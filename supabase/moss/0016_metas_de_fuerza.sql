-- Moss · esquema 16: las metas de fuerza de la sección de músculos y el RIR de cada serie (spec/musculos-compartido.md,
-- 2.6 y 5). La sección es la misma en Moss y en Ascent y existe solo con el vínculo: las metas («llegar a 100 kg en
-- press de banca») son de la cuenta de Moss del vínculo y las leen, crean y borran las dos cuentas, por funciones.
-- Moss no escribe en `public` ni llama funciones de Ascent; Ascent llama estas, del esquema `moss`.
--
-- Como las de 0008: security definer con search_path vacío; miran quién llama y el vínculo. Sin vínculo, null.
-- Al desvincular, las metas se borran (como el resumen de 0015), y también con «Borrar mis datos» y al borrar la
-- cuenta. Se aplica con `npm run migraciones -- --aplicar`.

create table moss.metas_de_fuerza (
  id uuid primary key default gen_random_uuid(),
  usuario uuid not null references auth.users (id) on delete cascade,
  -- El id del ejercicio en Ascent ('press_banca', o 'propio_…').
  ejercicio text not null check (length(ejercicio) between 1 and 100),
  kilos numeric not null check (kilos between 1 and 1000),
  reps int not null default 1 check (reps between 1 and 30),
  creada timestamptz not null default now(),
  actualizada timestamptz not null default now()
);
create index metas_de_fuerza_usuario on moss.metas_de_fuerza (usuario);

-- Solo las funciones: las apps no la leen ni la escriben directo.
alter table moss.metas_de_fuerza enable row level security;
revoke all on moss.metas_de_fuerza from anon, authenticated;
grant all on moss.metas_de_fuerza to service_role;

-- La cuenta de Moss del vínculo de quien llama, sea el lado de Moss o el de Ascent. Sin vínculo, null.
create or replace function moss.cuenta_del_vinculo() returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select vinculo.moss from moss.vinculo vinculo
   where vinculo.moss = (select auth.uid()) or vinculo.ascent = (select auth.uid())
   limit 1;
$$;

-- Las metas, de la más vieja a la más nueva: [{ id, ejercicio, kilos, reps, creada, actualizada }]. Sin vínculo, null.
create or replace function moss.metas_de_fuerza() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select case when cuenta.id is null then null else coalesce((
    select jsonb_agg(jsonb_build_object('id', meta.id, 'ejercicio', meta.ejercicio, 'kilos', meta.kilos, 'reps', meta.reps,
                                        'creada', meta.creada, 'actualizada', meta.actualizada) order by meta.creada)
      from moss.metas_de_fuerza meta where meta.usuario = cuenta.id), '[]'::jsonb) end
    from (select moss.cuenta_del_vinculo() as id) cuenta;
$$;

-- Crea una meta (p_id null) o cambia una de la cuenta; hasta 20. Devuelve su id; sin vínculo, o si no es de la cuenta, null.
create or replace function moss.guardar_meta_de_fuerza(p_id uuid, p_ejercicio text, p_kilos numeric, p_reps int) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := moss.cuenta_del_vinculo();
  guardada uuid;
begin
  if cuenta is null then
    return null;
  end if;
  if p_ejercicio is null or length(p_ejercicio) not between 1 and 100 or p_kilos is null or p_kilos not between 1 and 1000
     or p_reps is null or p_reps not between 1 and 30 then
    raise exception 'meta' using errcode = '22023';
  end if;
  if p_id is null then
    if (select count(*) from moss.metas_de_fuerza meta where meta.usuario = cuenta) >= 20 then
      raise exception 'demasiadas' using errcode = '22023';
    end if;
    insert into moss.metas_de_fuerza (usuario, ejercicio, kilos, reps) values (cuenta, p_ejercicio, p_kilos, p_reps) returning id into guardada;
  else
    update moss.metas_de_fuerza meta set ejercicio = p_ejercicio, kilos = p_kilos, reps = p_reps, actualizada = now()
     where meta.id = p_id and meta.usuario = cuenta returning meta.id into guardada;
  end if;
  return guardada;
end;
$$;

-- Borra una meta de la cuenta. Devuelve si la borró.
create or replace function moss.borrar_meta_de_fuerza(p_id uuid) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := moss.cuenta_del_vinculo();
  borradas int;
begin
  if cuenta is null then
    return false;
  end if;
  delete from moss.metas_de_fuerza meta where meta.id = p_id and meta.usuario = cuenta;
  get diagnostics borradas = row_count;
  return borradas > 0;
end;
$$;

revoke execute on function moss.cuenta_del_vinculo(), moss.metas_de_fuerza(), moss.guardar_meta_de_fuerza(uuid, text, numeric, int), moss.borrar_meta_de_fuerza(uuid)
  from public, anon;
grant execute on function moss.metas_de_fuerza(), moss.guardar_meta_de_fuerza(uuid, text, numeric, int), moss.borrar_meta_de_fuerza(uuid) to authenticated;
revoke execute on function moss.cuenta_del_vinculo() from authenticated;

-- Al desvincular, también las metas (la de 0015, con las metas).
create or replace function moss.al_desvincular() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from moss.resumenes_para_ascent resumen where resumen.usuario = old.moss;
  delete from moss.metas_de_fuerza meta where meta.usuario = old.moss;
  return old;
end;
$$;

-- ------------------------------------------------------------ el RIR de cada serie
-- La de 0008, igual, con `rir` en cada serie: el array `rir` del bloque, paralelo a `reps` (Ascent lo anota desde su
-- migración 102, opcional), entero de 0 a 10; sin anotar, null.
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
  dia as (
    select l.id, l.fecha
      from public.logs l
      join cuenta on cuenta.id = l.user_id
     where l.fecha >= ascent_sesiones.desde
       and (not l.es_descanso or exists (select 1 from sesion where sesion.log_id = l.id and sesion.series > 0))
  ),
  bloque as (
    select sesion.log_id, sesion.id as sesion, sesion.inicio, b.orden,
           b.valor ->> 'ejercicio' as ejercicio,
           case when jsonb_typeof(b.valor -> 'series') = 'number'
                then least(greatest(floor((b.valor ->> 'series')::numeric), 0), 999)::int else 0 end as n,
           b.valor -> 'pesos' as pesos,
           b.valor -> 'reps' as reps,
           b.valor -> 'rir' as rir,
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
                          then (bloque.reps ->> (j - 1))::int end end as reps,
           case when jsonb_typeof(bloque.rir) = 'array' and jsonb_typeof(bloque.rir -> (j - 1)) = 'number'
                then case when (bloque.rir ->> (j - 1))::numeric between 0 and 10
                           and (bloque.rir ->> (j - 1))::numeric = trunc((bloque.rir ->> (j - 1))::numeric)
                          then (bloque.rir ->> (j - 1))::int end end as rir
      from bloque
      cross join lateral generate_series(1, bloque.n) as j
  ),
  ejercicio as (
    select bloque.log_id,
           jsonb_agg(jsonb_build_object(
             'id', bloque.ejercicio,
             'nombre', coalesce(catalogo.nombre, bloque.ejercicio),
             'musculos', case when catalogo.grupo is null then '[]'::jsonb else jsonb_build_array(catalogo.grupo) end,
             'series', coalesce((select jsonb_agg(jsonb_build_object('kilos', serie.kilos, 'reps', serie.reps, 'rir', serie.rir) order by serie.j)
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

-- ------------------------------------------------------------ borrar también las metas
-- Las dos de 0015, iguales, con las metas de fuerza.
create or replace function moss.borrar_mis_datos() returns void
language sql
security definer
set search_path = ''
as $$
  delete from moss.metas_de_fuerza where usuario = (select auth.uid());
  delete from moss.resumenes_para_ascent where usuario = (select auth.uid());
  delete from moss.propuestas where usuario = (select auth.uid());
  delete from moss.reportes_comunidad where usuario = (select auth.uid());
  delete from moss.noches where usuario = (select auth.uid());
  delete from moss.medidas where usuario = (select auth.uid());
  delete from moss.registros where usuario = (select auth.uid());
  delete from moss.recetas where usuario = (select auth.uid());
  delete from moss.propios where usuario = (select auth.uid());
  delete from moss.favoritos where usuario = (select auth.uid());
  delete from moss.agua where usuario = (select auth.uid());
  delete from moss.marcas where usuario = (select auth.uid());
  delete from moss.dias where usuario = (select auth.uid());
  delete from moss.periodos where usuario = (select auth.uid());
  delete from moss.habitos where usuario = (select auth.uid());
  delete from moss.logros where usuario = (select auth.uid());
  delete from moss.pesos where usuario = (select auth.uid());
  delete from moss.metas where usuario = (select auth.uid());
  delete from moss.perfiles where usuario = (select auth.uid());
$$;

create or replace function moss.borrar_cuenta(cuenta uuid) returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if cuenta is null then
    raise exception 'pedido' using errcode = '22023';
  end if;
  delete from moss.vinculo vinculo where vinculo.moss = cuenta;
  delete from moss.metas_de_fuerza where usuario = cuenta;
  delete from moss.resumenes_para_ascent where usuario = cuenta;
  delete from moss.propuestas where usuario = cuenta;
  delete from moss.reportes_comunidad where usuario = cuenta;
  delete from moss.noches where usuario = cuenta;
  delete from moss.medidas where usuario = cuenta;
  delete from moss.registros where usuario = cuenta;
  delete from moss.recetas where usuario = cuenta;
  delete from moss.propios where usuario = cuenta;
  delete from moss.favoritos where usuario = cuenta;
  delete from moss.agua where usuario = cuenta;
  delete from moss.marcas where usuario = cuenta;
  delete from moss.dias where usuario = cuenta;
  delete from moss.periodos where usuario = cuenta;
  delete from moss.habitos where usuario = cuenta;
  delete from moss.logros where usuario = cuenta;
  delete from moss.pesos where usuario = cuenta;
  delete from moss.metas where usuario = cuenta;
  delete from moss.perfiles where usuario = cuenta;
end;
$$;

revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
revoke execute on function moss.borrar_cuenta(uuid) from public, anon, authenticated;
grant execute on function moss.borrar_cuenta(uuid) to service_role;
revoke execute on function moss.al_desvincular() from public, anon, authenticated;
