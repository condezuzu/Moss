-- Moss · esquema 19: las sesiones copiadas de Ascent (su migración 103, 26/11/2026). «Registrar el día» sin entrenar en
-- la app copia el último entrenamiento de ese día de la rutina y lo guarda como una sesión terminada de hoy, con
-- `copiada`. Ascent la cuenta para los músculos, el volumen y la fatiga, y no para la tendencia de fuerza: repetir los
-- mismos kilos aplanaría la línea y podría marcar un estancamiento que no es. Moss hace lo mismo, así que la necesita.
-- La de 0016, igual, con `copiada` en cada ejercicio: la de su sesión (sin marcar, falso). Necesita la columna
-- public.sesiones.copiada, que Ascent ya aplicó en la base real el 26/11.

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
    select s.id, s.log_id, s.inicio, s.series, coalesce(s.copiada, false) as copiada,
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
    select sesion.log_id, sesion.id as sesion, sesion.inicio, sesion.copiada, b.orden,
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
             'copiada', bloque.copiada,
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
