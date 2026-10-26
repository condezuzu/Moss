-- Moss · esquema 8: el vínculo con Ascent (spec/ascent.md, «Vincular en menos de 10 segundos», D27).
--
-- Vincular es dar permiso: la persona acepta que Moss y Ascent compartan sus datos. Cada vínculo une
-- una cuenta de Moss con una de Ascent, que pueden ser la misma o dos distintas (Moss con Apple y
-- Ascent con el correo, por ejemplo). Lo escribe solo la función del servidor `moss-vincular`, con
-- la clave de servicio y después de revisar las dos sesiones; cada app lo ve y lo borra desde su
-- lado. No se sincroniza con el teléfono: se pregunta.
--
-- Lo que Moss lee de Ascent pasa por funciones `security definer` de este esquema. Corren como su
-- dueño, así que cada una revisa quién llama (auth.uid()) y el vínculo, y de Ascent solo leen: nunca
-- escriben en `public` ni llaman sus funciones (spec/ascent.md, «Lo que hay que cuidar»). Leen el
-- esquema de Ascent de la versión 96: profiles, logs, sesiones (con sus bloques), ejercicios, prs y
-- weights.
--
-- Se aplica a mano en el SQL Editor, después de 0007_plan.sql.

create table moss.vinculo (
  -- Cada cuenta está en un solo vínculo: vincular de nuevo borra los anteriores de las dos.
  moss uuid primary key references auth.users (id) on delete cascade,
  ascent uuid not null unique references auth.users (id) on delete cascade,
  desde timestamptz not null default now(),
  -- Desde qué app se vinculó.
  origen text not null check (origen in ('moss', 'ascent'))
);

alter table moss.vinculo enable row level security;
create policy suyo on moss.vinculo for select to authenticated using ((select auth.uid()) in (moss, ascent));
revoke all on moss.vinculo from anon, authenticated;
grant select on moss.vinculo to authenticated;
grant all on moss.vinculo to service_role;

-- La llama solo `moss-vincular` (supabase/functions/), con la clave de servicio, cuando ya revisó las
-- dos sesiones. La cuenta de Ascent tiene que haber usado Ascent: un perfil con nombre de usuario
-- (toda cuenta nueva tiene perfil, aunque sea de Moss, pero sin nombre).
create or replace function moss.vincular_cuentas(cuenta_moss uuid, cuenta_ascent uuid, origen text) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  usuario text;
begin
  if cuenta_moss is null or cuenta_ascent is null or vincular_cuentas.origen is null or vincular_cuentas.origen not in ('moss', 'ascent') then
    raise exception 'pedido' using errcode = '22023';
  end if;
  select perfil.username into usuario from public.profiles perfil where perfil.id = cuenta_ascent;
  if usuario is null then
    raise exception 'sin_ascent' using errcode = 'P0001';
  end if;
  delete from moss.vinculo anterior
   where anterior.moss in (cuenta_moss, cuenta_ascent) or anterior.ascent in (cuenta_moss, cuenta_ascent);
  insert into moss.vinculo (moss, ascent, origen) values (cuenta_moss, cuenta_ascent, vincular_cuentas.origen);
  return jsonb_build_object('nombre', usuario);
end;
$$;

-- Desde cualquiera de las dos apps: si la cuenta que llama está vinculada (de un lado o del otro),
-- con qué usuario de Ascent y desde cuándo.
create or replace function moss.estado_del_vinculo() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select jsonb_build_object('vinculada', true, 'nombre', perfil.username, 'desde', vinculo.desde)
       from moss.vinculo vinculo
       left join public.profiles perfil on perfil.id = vinculo.ascent
      where (select auth.uid()) in (vinculo.moss, vinculo.ascent)
      order by vinculo.moss = (select auth.uid()) desc
      limit 1),
    jsonb_build_object('vinculada', false, 'nombre', null, 'desde', null)
  );
$$;

-- Desde cualquiera de las dos apps: borra el vínculo de la cuenta que llama. Los datos quedan en cada app.
create or replace function moss.desvincular() returns void
language sql
security definer
set search_path = ''
as $$
  delete from moss.vinculo vinculo where (select auth.uid()) in (vinculo.moss, vinculo.ascent);
$$;

-- Los días de gimnasio de la cuenta de Ascent vinculada, desde `desde`, para la cuenta de Moss que
-- llama: uno por día (la clave local con que lo guarda Ascent), con todas sus sesiones juntas. Cada
-- día lleva las series (el contador de Ascent), el peso movido (la suma de los kilos de cada serie,
-- como lo cuenta Ascent), los minutos (solo de las sesiones terminadas de 5 minutos o más, como en
-- Stats), cuándo empezó la primera sesión y los ejercicios con sus series. Sin vínculo, nada.
create or replace function moss.ascent_sesiones(desde date) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cuenta as (
    select vinculo.ascent as id from moss.vinculo vinculo where vinculo.moss = (select auth.uid())
  ),
  sesion as (
    select s.id, s.log_id, s.inicio, s.series,
           case when s.estado = 'terminada' and s.fin - s.inicio >= interval '5 minutes'
                then extract(epoch from s.fin - s.inicio) / 60 else 0 end as minutos,
           case when jsonb_typeof(s.bloques) = 'array' then s.bloques else '[]'::jsonb end as bloques
      from public.sesiones s
      join cuenta on cuenta.id = s.user_id
  ),
  -- Un día anotado como ido o, aunque esté marcado de descanso, con una sesión con series.
  dia as (
    select l.id, l.fecha
      from public.logs l
      join cuenta on cuenta.id = l.user_id
     where l.fecha >= ascent_sesiones.desde
       and (not l.es_descanso or exists (select 1 from sesion where sesion.log_id = l.id and sesion.series > 0))
  ),
  -- Cada bloque como lo lee Ascent (leerBloques, en nucleo/volumen.ts). Los CASE anidados son a
  -- propósito: Postgres no promete el orden de un AND, y un cast de algo que no es número corta todo.
  bloque as (
    select sesion.log_id, sesion.id as sesion, sesion.inicio, b.orden,
           b.valor ->> 'ejercicio' as ejercicio,
           case when jsonb_typeof(b.valor -> 'series') = 'number'
                then least(greatest(floor((b.valor ->> 'series')::numeric), 0), 999)::int else 0 end as n,
           b.valor -> 'pesos' as pesos,
           b.valor -> 'reps' as reps,
           -- Lo que vale el número escrito (nucleo/carga.ts): de dos mancuernas o un lado por vez, el
           -- doble; con el peso del cuerpo, nada; la barra, la máquina y el lastre, lo que dice.
           case b.valor ->> 'carga' when 'par' then 2 when 'una' then 2 when 'corporal' then 0 else 1 end as factor
      from sesion
      join dia on dia.id = sesion.log_id
      cross join lateral jsonb_array_elements(sesion.bloques) with ordinality as b (valor, orden)
     where jsonb_typeof(b.valor) = 'object' and jsonb_typeof(b.valor -> 'ejercicio') = 'string'
  ),
  serie as (
    select bloque.log_id, bloque.sesion, bloque.orden, j,
           case when bloque.factor > 0 and jsonb_typeof(bloque.pesos -> (j - 1)) = 'number'
                then case when (bloque.pesos ->> (j - 1))::numeric > 0
                          then round((bloque.pesos ->> (j - 1))::numeric * bloque.factor, 2) end end as kilos,
           case when jsonb_typeof(bloque.reps -> (j - 1)) = 'number'
                then case when (bloque.reps ->> (j - 1))::numeric between 1 and 999
                           and (bloque.reps ->> (j - 1))::numeric = trunc((bloque.reps ->> (j - 1))::numeric)
                          then (bloque.reps ->> (j - 1))::int end end as reps
      from bloque
      cross join lateral generate_series(1, bloque.n) as j
  ),
  ejercicio as (
    select bloque.log_id,
           jsonb_agg(jsonb_build_object(
             'id', bloque.ejercicio,
             'nombre', coalesce(catalogo.nombre, bloque.ejercicio),
             'musculos', case when catalogo.grupo is null then '[]'::jsonb else jsonb_build_array(catalogo.grupo) end,
             'series', coalesce((select jsonb_agg(jsonb_build_object('kilos', serie.kilos, 'reps', serie.reps) order by serie.j)
                                   from serie where serie.sesion = bloque.sesion and serie.orden = bloque.orden), '[]'::jsonb)
           ) order by bloque.inicio, bloque.sesion, bloque.orden) as lista
      from bloque
      left join public.ejercicios catalogo on catalogo.id = bloque.ejercicio
     where bloque.n > 0
     group by bloque.log_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'fecha', dia.fecha,
           'inicio', (select min(sesion.inicio) from sesion where sesion.log_id = dia.id),
           'series', coalesce((select sum(sesion.series) from sesion where sesion.log_id = dia.id), 0),
           'kilos', coalesce((select round(sum(serie.kilos), 2) from serie where serie.log_id = dia.id), 0),
           'minutos', coalesce((select round(sum(sesion.minutos)) from sesion where sesion.log_id = dia.id), 0),
           'ejercicios', coalesce((select ejercicio.lista from ejercicio where ejercicio.log_id = dia.id), '[]'::jsonb)
         ) order by dia.fecha), '[]'::jsonb)
    from dia;
$$;

-- Las marcas de la cuenta de Ascent vinculada, para la cuenta de Moss que llama: las de `desde` en
-- adelante y, de cada ejercicio, la mejor de siempre (por el 1RM, como lo cuenta Ascent en un_rm),
-- aunque sea de antes. Sin vínculo, nada.
create or replace function moss.ascent_marcas(desde date) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with marca as (
    select pr.id, pr.ejercicio, pr.peso, pr.reps, pr.fecha, pr.creado,
           case when pr.es_real or pr.reps = 1 then pr.peso else pr.peso * (1 + pr.reps / 30.0) end as unorm
      from public.prs pr
      join moss.vinculo vinculo on vinculo.ascent = pr.user_id and vinculo.moss = (select auth.uid())
  ),
  elegida as (
    select * from marca where marca.fecha >= ascent_marcas.desde
    union
    select * from (select distinct on (mejor.ejercicio) * from marca mejor order by mejor.ejercicio, mejor.unorm desc, mejor.fecha desc) la_mejor
  )
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', elegida.ejercicio,
           'ejercicio', coalesce(catalogo.nombre, elegida.ejercicio),
           'fecha', elegida.fecha,
           'kilos', elegida.peso,
           'reps', elegida.reps
         ) order by elegida.fecha, elegida.creado), '[]'::jsonb)
    from elegida
    left join public.ejercicios catalogo on catalogo.id = elegida.ejercicio;
$$;

-- El peso de las dos apps juntas, desde cualquiera de las dos (spec/ascent.md, «Peso único»): lo de
-- Moss (moss.pesos de la cuenta de Moss del vínculo) y lo de Ascent (public.weights de la de
-- Ascent), uno por día. Ascent no guarda la hora de su peso, así que no se sabe cuál es el último:
-- si un día hay de las dos, gana el de la app que pregunta (`app`), y cada una ve lo que se anotó en
-- ella. Sin vínculo, nada: cada app ya tiene lo suyo.
create or replace function moss.pesos_compartidos(desde date, app text default 'moss') returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with vinculado as (
    select vinculo.moss, vinculo.ascent
      from moss.vinculo vinculo
     where (select auth.uid()) in (vinculo.moss, vinculo.ascent)
     order by vinculo.moss = (select auth.uid()) desc
     limit 1
  ),
  peso as (
    select p.fecha, p.kg, 'moss' as de from moss.pesos p join vinculado on vinculado.moss = p.usuario where p.fecha >= pesos_compartidos.desde
    union all
    select w.fecha, w.valor, 'ascent' from public.weights w join vinculado on vinculado.ascent = w.user_id where w.fecha >= pesos_compartidos.desde
  )
  select coalesce(jsonb_agg(jsonb_build_object('fecha', uno.fecha, 'kg', uno.kg, 'de', uno.de) order by uno.fecha), '[]'::jsonb)
    from (select distinct on (peso.fecha) peso.fecha, peso.kg, peso.de from peso order by peso.fecha, peso.de = pesos_compartidos.app desc, peso.de) uno;
$$;

revoke execute on function moss.vincular_cuentas(uuid, uuid, text) from public, anon, authenticated;
grant execute on function moss.vincular_cuentas(uuid, uuid, text) to service_role;
revoke execute on function moss.estado_del_vinculo(), moss.desvincular(), moss.ascent_sesiones(date), moss.ascent_marcas(date), moss.pesos_compartidos(date, text) from public, anon;
grant execute on function moss.estado_del_vinculo(), moss.desvincular(), moss.ascent_sesiones(date), moss.ascent_marcas(date), moss.pesos_compartidos(date, text) to authenticated;
