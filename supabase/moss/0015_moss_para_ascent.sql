-- Moss · esquema 15: lo de Moss que lee Ascent con el vínculo (spec/ascent.md, «Qué lee cada app de la otra»), para
-- la parte de Moss en Ascent y su rutina automática. Lo aprobaste el 19/11/2026 con la línea nueva de la privacidad:
-- con el vínculo, Moss le pasa a Ascent cuánto dormiste y cómo, la energía del día, lo que comes por día y por comida
-- (calorías, proteína, carbohidratos y grasas, con su hora), tu peso y tu objetivo.
--
-- El sueño de Salud, la necesidad, la deuda, la energía y la meta de cada día se calculan en el teléfono: no suben
-- con lo demás. Mientras está vinculada, Moss sube el resumen de los últimos días a `moss.resumenes_para_ascent`
-- (moss.guardar_resumenes); al desvincular, se borra. Lo comido, la cara de la mañana, el perfil y los pesos ya están
-- en la base y se leen de sus tablas.
--
-- Las cuatro que lee Ascent (moss_hoy, moss_semanas, moss_objetivo y moss_anio) son como las de 0008: security
-- definer con search_path vacío, las llama la cuenta de Ascent del vínculo (vinculo.ascent = auth.uid()) y leen la
-- de Moss; sin vínculo, null. Las fechas son claves del día de Moss. Se aplica con `npm run migraciones -- --aplicar`.

create table moss.resumenes_para_ascent (
  usuario uuid not null references auth.users (id) on delete cascade,
  fecha date not null,
  -- Minutos dormidos esa noche (la noche es del día en que te despiertas), sin lo despierto de adentro.
  dormido smallint check (dormido between 0 and 1440),
  necesidad smallint check (necesidad between 0 and 1440),
  -- La deuda de las últimas dos semanas, en minutos y en su palabra (sueno.ts, juicioDeLaDeuda).
  deuda smallint check (deuda between 0 and 20000),
  deuda_palabra text check (deuda_palabra in ('sinDeuda', 'baja', 'media', 'alta')),
  energia text check (energia in ('baja', 'suficiente', 'alta')),
  meta_kcal smallint check (meta_kcal between 0 and 20000),
  meta_proteina smallint check (meta_proteina between 0 and 2000),
  meta_carbohidratos smallint check (meta_carbohidratos between 0 and 3000),
  meta_grasas smallint check (meta_grasas between 0 and 2000),
  actualizado timestamptz not null default now(),
  primary key (usuario, fecha)
);

-- Solo las funciones: la app no la lee ni la escribe directo.
alter table moss.resumenes_para_ascent enable row level security;
revoke all on moss.resumenes_para_ascent from anon, authenticated;
grant all on moss.resumenes_para_ascent to service_role;

-- La llama la cuenta de Moss con hasta 31 días: [{ fecha, dormido, necesidad, deuda, deuda_palabra, energia,
-- meta: { kcal, proteina, carbohidratos, grasas } }]. Sin vínculo no guarda nada y devuelve false. Lo que no viene
-- (la energía y la deuda de los días que no son hoy) queda como estaba.
create or replace function moss.guardar_resumenes(p_dias jsonb) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := (select auth.uid());
  d jsonb;
  num smallint;
begin
  if cuenta is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  if not exists (select 1 from moss.vinculo vinculo where vinculo.moss = cuenta) then
    return false;
  end if;
  if jsonb_typeof(p_dias) <> 'array' or jsonb_array_length(p_dias) > 31 then
    raise exception 'pedido' using errcode = '22023';
  end if;
  for d in select x from jsonb_array_elements(p_dias) as x loop
    if jsonb_typeof(d) <> 'object' or coalesce(d ->> 'fecha', '') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception 'pedido' using errcode = '22023';
    end if;
    insert into moss.resumenes_para_ascent as r
      (usuario, fecha, dormido, necesidad, deuda, deuda_palabra, energia, meta_kcal, meta_proteina, meta_carbohidratos, meta_grasas, actualizado)
    values (
      cuenta, (d ->> 'fecha')::date,
      round((d ->> 'dormido')::numeric), round((d ->> 'necesidad')::numeric), round((d ->> 'deuda')::numeric), d ->> 'deuda_palabra', d ->> 'energia',
      round((d -> 'meta' ->> 'kcal')::numeric), round((d -> 'meta' ->> 'proteina')::numeric),
      round((d -> 'meta' ->> 'carbohidratos')::numeric), round((d -> 'meta' ->> 'grasas')::numeric), now()
    )
    on conflict (usuario, fecha) do update set
      dormido = excluded.dormido, necesidad = excluded.necesidad,
      deuda = coalesce(excluded.deuda, r.deuda), deuda_palabra = coalesce(excluded.deuda_palabra, r.deuda_palabra),
      energia = coalesce(excluded.energia, r.energia),
      meta_kcal = excluded.meta_kcal, meta_proteina = excluded.meta_proteina,
      meta_carbohidratos = excluded.meta_carbohidratos, meta_grasas = excluded.meta_grasas, actualizado = now();
  end loop;
  return true;
end;
$$;

-- Al desvincular (desde cualquiera de las dos apps), al vincular de nuevo o al borrar la cuenta: el resumen se va.
create or replace function moss.al_desvincular() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from moss.resumenes_para_ascent resumen where resumen.usuario = old.moss;
  return old;
end;
$$;
create trigger al_desvincular after delete on moss.vinculo for each row execute function moss.al_desvincular();

-- ------------------------------------------------------------ lo que lee Ascent

-- El día: la noche (con la cara de la mañana), la energía y lo comido (el total, la meta y cada comida con su hora).
create or replace function moss.moss_hoy(p_fecha date) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cuenta as (
    select vinculo.moss from moss.vinculo vinculo where vinculo.ascent = (select auth.uid())
  ),
  sin as (
    select coalesce((select perfil.sin_deficit from moss.perfiles perfil where perfil.usuario = cuenta.moss), false) as deficit from cuenta
  ),
  resumen as (
    select r.* from moss.resumenes_para_ascent r join cuenta on r.usuario = cuenta.moss where r.fecha = p_fecha
  ),
  cara as (
    select noche.cara from moss.noches noche join cuenta on noche.usuario = cuenta.moss where noche.fecha = p_fecha and not noche.borrado
  ),
  comido as (
    select registro.* from moss.registros registro join cuenta on registro.usuario = cuenta.moss
     where registro.dia = p_fecha and not registro.borrado and not registro.planificado
  )
  select (
    select jsonb_build_object(
      'fecha', p_fecha,
      'sin_deficit', sin.deficit,
      'noche', case when (select dormido from resumen) is null and (select cara from cara) is null then null else jsonb_build_object(
        'dormido', (select dormido from resumen), 'necesidad', (select necesidad from resumen), 'cara', (select cara from cara),
        'deuda', (select deuda from resumen), 'deuda_palabra', (select deuda_palabra from resumen)
      ) end,
      'energia', (select energia from resumen),
      'comida', jsonb_build_object(
        'total', (select jsonb_build_object('kcal', round(coalesce(sum(kcal), 0)), 'proteina', round(coalesce(sum(proteina), 0)),
                   'carbohidratos', round(coalesce(sum(carbohidratos), 0)), 'grasas', round(coalesce(sum(grasas), 0))) from comido),
        'meta', case when sin.deficit or (select meta_kcal from resumen) is null then null else (
          select jsonb_build_object('kcal', meta_kcal, 'proteina', meta_proteina, 'carbohidratos', meta_carbohidratos, 'grasas', meta_grasas) from resumen
        ) end,
        -- Una por comida y por hora (lo anotado junto, junto).
        'comidas', coalesce((
          select jsonb_agg(jsonb_build_object('momento', c.momento, 'comida', c.comida, 'kcal', c.kcal, 'proteina', c.proteina,
                   'carbohidratos', c.carbohidratos, 'grasas', c.grasas) order by c.momento)
            from (select momento, comida, round(sum(kcal)) as kcal, round(sum(proteina)) as proteina,
                         round(sum(carbohidratos)) as carbohidratos, round(sum(grasas)) as grasas
                    from comido group by momento, comida) c
        ), '[]'::jsonb)
      )
    )
    from sin
  );
$$;

-- Una fila por semana, de lunes a domingo, desde la semana de p_desde hasta la de hoy: las noches con su promedio
-- dormido, los días con comida, la proteína por kilo por día, el balance por día (lo comido menos el gasto de la meta
-- de ese día; sin déficit, null) y el peso (el último hasta el domingo).
create or replace function moss.moss_semanas(p_desde date) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with cuenta as (
    select vinculo.moss from moss.vinculo vinculo where vinculo.ascent = (select auth.uid())
  ),
  sin as (
    select coalesce((select perfil.sin_deficit from moss.perfiles perfil where perfil.usuario = cuenta.moss), false) as deficit from cuenta
  ),
  semanas as (
    select s::date as lunes from generate_series(
      (p_desde - (extract(isodow from p_desde)::int - 1))::timestamp,
      (current_date - (extract(isodow from current_date)::int - 1))::timestamp,
      interval '7 days') as s
    where p_desde >= current_date - 400
  ),
  dias as (
    select registro.dia, sum(registro.kcal) as kcal, sum(registro.proteina) as proteina
      from moss.registros registro join cuenta on registro.usuario = cuenta.moss
     where registro.dia >= p_desde - 6 and not registro.borrado and not registro.planificado
     group by registro.dia
  ),
  con_gasto as (
    select dias.*, (select meta.gasto from moss.metas meta join cuenta on meta.usuario = cuenta.moss
                     where meta.desde <= dias.dia order by meta.desde desc limit 1) as gasto,
           (select peso.kg from moss.pesos peso join cuenta on peso.usuario = cuenta.moss
             where peso.fecha <= dias.dia order by peso.fecha desc limit 1) as kg
      from dias
  ),
  noches as (
    select r.fecha, r.dormido from moss.resumenes_para_ascent r join cuenta on r.usuario = cuenta.moss
     where r.fecha >= p_desde - 6 and r.dormido is not null
  )
  select case when not exists (select 1 from cuenta) then null else coalesce((
    select jsonb_agg(jsonb_build_object(
      'lunes', semanas.lunes,
      'noches', (select count(*) from noches where noches.fecha between semanas.lunes and semanas.lunes + 6),
      'dormido', (select round(avg(dormido)) from noches where noches.fecha between semanas.lunes and semanas.lunes + 6),
      'dias_con_comida', (select count(*) from con_gasto c where c.dia between semanas.lunes and semanas.lunes + 6),
      'proteina_g_kg', (select round((avg(c.proteina / nullif(c.kg, 0)))::numeric, 2) from con_gasto c where c.dia between semanas.lunes and semanas.lunes + 6),
      'balance', case when (select deficit from sin) then null else
        (select round(avg(c.kcal - c.gasto)) from con_gasto c where c.dia between semanas.lunes and semanas.lunes + 6 and c.gasto is not null) end,
      'peso', (select peso.kg from moss.pesos peso join cuenta on peso.usuario = cuenta.moss
                where peso.fecha <= semanas.lunes + 6 order by peso.fecha desc limit 1)
    ) order by semanas.lunes)
    from semanas
  ), '[]'::jsonb) end;
$$;

-- El objetivo: bajar, mantener o subir, el ritmo, el peso al que se quiere llegar, el de ahora y desde cuándo hay plan.
create or replace function moss.moss_objetivo() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object(
      'objetivo', perfil.objetivo, 'ritmo', perfil.ritmo, 'peso_meta', perfil.peso_meta,
      'peso', (select peso.kg from moss.pesos peso where peso.usuario = vinculo.moss order by peso.fecha desc limit 1),
      'desde', (select min(meta.desde) from moss.metas meta where meta.usuario = vinculo.moss),
      'sin_deficit', coalesce(perfil.sin_deficit, false)
    )
    from moss.vinculo vinculo
    join moss.perfiles perfil on perfil.usuario = vinculo.moss
    where vinculo.ascent = (select auth.uid())
  );
$$;

-- El año: los días con comida, los días completos del cielo, las noches con su promedio y el peso del principio y de ahora.
create or replace function moss.moss_anio(p_anio int) returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object(
      'dias_con_comida', (select count(distinct registro.dia) from moss.registros registro
                           where registro.usuario = vinculo.moss and extract(year from registro.dia) = p_anio and not registro.borrado and not registro.planificado),
      'dias_completos', (select count(*) from moss.dias dia where dia.usuario = vinculo.moss and extract(year from dia.clave) = p_anio and dia.completo),
      'noches', (select count(*) from moss.resumenes_para_ascent r where r.usuario = vinculo.moss and extract(year from r.fecha) = p_anio and r.dormido is not null),
      'dormido', (select round(avg(r.dormido)) from moss.resumenes_para_ascent r where r.usuario = vinculo.moss and extract(year from r.fecha) = p_anio),
      'peso_inicio', (select peso.kg from moss.pesos peso where peso.usuario = vinculo.moss and extract(year from peso.fecha) = p_anio order by peso.fecha limit 1),
      'peso_hoy', (select peso.kg from moss.pesos peso where peso.usuario = vinculo.moss and extract(year from peso.fecha) = p_anio order by peso.fecha desc limit 1)
    )
    from moss.vinculo vinculo
    where vinculo.ascent = (select auth.uid())
  );
$$;

revoke execute on function moss.guardar_resumenes(jsonb), moss.moss_hoy(date), moss.moss_semanas(date), moss.moss_objetivo(), moss.moss_anio(int)
  from public, anon;
grant execute on function moss.guardar_resumenes(jsonb), moss.moss_hoy(date), moss.moss_semanas(date), moss.moss_objetivo(), moss.moss_anio(int)
  to authenticated;
revoke execute on function moss.al_desvincular() from public, anon, authenticated;

-- ------------------------------------------------------------ borrar también el resumen
-- Las dos de 0012_comunidad.sql, iguales, con el resumen.
create or replace function moss.borrar_mis_datos() returns void
language sql
security definer
set search_path = ''
as $$
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
