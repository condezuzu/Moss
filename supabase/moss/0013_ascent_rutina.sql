-- Moss · esquema 13: la rutina de Ascent y lo de sus Ajustes que usa la sección de Ascent arriba de
-- Progreso (spec/ascent.md, «Qué lee cada app de la otra» y «Ascent en Progreso»): «Tu semana en
-- Ascent», la sesión de hoy, «Tu fuerza», el umbral de estancamiento y el color y el cuerpo de tu rango.
--
-- Como las de 0008_vinculo.sql: `security definer` con `search_path` vacío, miran quién llama y el
-- vínculo, y de Ascent solo leen (nunca escriben en `public` ni llaman sus funciones). Las llama la
-- cuenta de Moss del vínculo y leen la de Ascent; sin vínculo (o desde el lado de Ascent), null.
-- Leen el esquema de Ascent de la versión 102: rutinas (desde la 75; `reps` desde la 95), ejercicios
-- (con `creado_por` desde la 76) y profiles (`umbral_estancamiento` desde la 30, `racha_actual`).
--
-- Se aplica con `npm run migraciones -- --aplicar`. La app que las llama anda igual sin ellas: hasta
-- que estén, sigue como antes (src/almacen/ascent.ts).

-- La rutina activa de la cuenta de Ascent vinculada: su nombre y los siete días, en el orden de Ascent
-- (0 es el domingo, como Date.getDay()). Cada día dice si es de descanso y sus ejercicios en orden, con
-- su id, su nombre (el del catálogo o el que le puso la persona a un propio suyo), su grupo y lo que dice
-- la rutina: las series, y los minutos o las repeticiones objetivo si los tiene. Ascent no guarda pesos
-- ni hora en la rutina: el peso sale de la última vez y la hora, de las sesiones. Lo que no se entiende
-- se saltea, con las reglas de `rutina_dias_limpios` de Ascent. Sin vínculo o sin rutina activa, null.
create or replace function moss.ascent_rutina() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with activa as (
    select rutina.nombre, rutina.user_id as cuenta,
           case when jsonb_typeof(rutina.dias) = 'array' then rutina.dias else '[]'::jsonb end as dias
      from public.rutinas rutina
      join moss.vinculo vinculo on vinculo.ascent = rutina.user_id and vinculo.moss = (select auth.uid())
     where rutina.activa
     limit 1
  ),
  -- Los CASE anidados son a propósito, como en 0008: Postgres no promete el orden de un AND.
  dia as (
    select g.n as dia,
           case when jsonb_typeof(activa.dias -> g.n) = 'object' then activa.dias -> g.n else '{}'::jsonb end as valor
      from activa
      cross join generate_series(0, 6) as g (n)
  ),
  ejercicio as (
    select dia.dia, e.orden, left(e.valor ->> 'ejercicio', 80) as id,
           case when jsonb_typeof(e.valor -> 'series') = 'number'
                then least(greatest(round((e.valor ->> 'series')::numeric), 0), 99)::int else 0 end as series,
           case when jsonb_typeof(e.valor -> 'minutos') = 'number'
                then least(greatest(round((e.valor ->> 'minutos')::numeric), 0), 600)::int end as minutos,
           case when jsonb_typeof(e.valor -> 'reps') = 'number'
                then case when round((e.valor ->> 'reps')::numeric) between 1 and 100 then round((e.valor ->> 'reps')::numeric)::int end end as reps
      from dia
      cross join lateral jsonb_array_elements(case when jsonb_typeof(dia.valor -> 'ejercicios') = 'array' then dia.valor -> 'ejercicios' else '[]'::jsonb end)
           with ordinality as e (valor, orden)
     where jsonb_typeof(e.valor) = 'object' and jsonb_typeof(e.valor -> 'ejercicio') = 'string' and e.orden <= 30
  ),
  descanso as (
    select dia.dia, case when jsonb_typeof(dia.valor -> 'descanso') = 'boolean' then (dia.valor ->> 'descanso')::boolean else false end as si
      from dia
  )
  select (
    select jsonb_build_object(
      'nombre', activa.nombre,
      'dias', (
        select jsonb_agg(jsonb_build_object(
                 'dia', descanso.dia,
                 'descanso', descanso.si,
                 -- Un día de descanso no tiene ejercicios, como en Ascent.
                 'ejercicios', case when descanso.si then '[]'::jsonb else coalesce((
                   select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                            'id', ejercicio.id,
                            -- Un propio ajeno (copiado con la rutina de un amigo) no dice su nombre, como en Ascent.
                            'nombre', coalesce(catalogo.nombre, ejercicio.id),
                            'musculos', case when catalogo.grupo is null then '[]'::jsonb else jsonb_build_array(catalogo.grupo) end,
                            'series', ejercicio.series,
                            'minutos', ejercicio.minutos,
                            'reps', ejercicio.reps
                          )) order by ejercicio.orden)
                     from ejercicio
                     left join public.ejercicios catalogo
                       on catalogo.id = ejercicio.id and (catalogo.creado_por is null or catalogo.creado_por = activa.cuenta)
                    where ejercicio.dia = descanso.dia and ejercicio.id <> ''), '[]'::jsonb) end
               ) order by descanso.dia)
          from descanso
      )
    )
    from activa
  );
$$;

-- Lo de los Ajustes y el perfil de la cuenta de Ascent vinculada que usa Moss: el umbral de
-- estancamiento que se eligió (2, 3, 6 u 8 semanas sin marca) y la racha, de la que sale el rango con la
-- regla de Ascent (src/dominio/rangoDeAscent.ts, el espejo de su nucleo/reglas.ts). Es la racha que
-- muestra Ascent (`racha_actual`, que su barrido de cada hora pone al día). Sin vínculo, null.
create or replace function moss.ascent_ajustes() returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select (
    select jsonb_build_object('umbral', perfil.umbral_estancamiento, 'racha', perfil.racha_actual)
      from moss.vinculo vinculo
      join public.profiles perfil on perfil.id = vinculo.ascent
     where vinculo.moss = (select auth.uid())
  );
$$;

revoke execute on function moss.ascent_rutina(), moss.ascent_ajustes() from public, anon;
grant execute on function moss.ascent_rutina(), moss.ascent_ajustes() to authenticated;
