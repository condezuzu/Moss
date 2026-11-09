-- Moss · esquema 12: la base de comida de la comunidad. Cuando alguien carga un producto que no estaba
-- (a mano o desde la etiqueta), además de quedar en sus propios (moss.propios) sale como propuesta.
-- Si varias personas distintas cargan lo mismo con valores parecidos, Moss lo publica en el catálogo
-- (moss.catalogo) para todos, marcado «Verificado por la comunidad»: con código de barras alcanzan 3,
-- sin código hacen falta 5 con el mismo nombre y marca. Lo publicado es la mediana del grupo, así un
-- valor raro no lo arruina. Si varios reportan un dato mal, se oculta (`retirado`, que ya entienden
-- todas las versiones de la app) hasta que propuestas nuevas lo vuelvan a publicar corregido.
--
-- Como las búsquedas y los reportes de 0006_alimentos.sql: las tablas no se leen ni se escriben desde
-- la app; solo las dos funciones, con sesión, que revisan lo que llega y rechazan la basura con
-- 22023 (la app descarta lo que vuelve con código 22 o 23 y no lo reintenta). Solo cuentan las cuentas
-- con cierta antigüedad, contra las de usar y tirar, y hay un tope por día.
--
-- Los umbrales viven en una fila (moss.comunidad_reglas): cambiarlos es un `update` con la clave de
-- servicio, sin migración ni OTA. Después de bajar uno, lo que ya alcanza se publica con la próxima
-- propuesta de esa clave, o de una vez con
--   select moss.evaluar_propuesta(clave) from moss.propuestas group by clave;
--
-- «Borrar mis datos» y borrar la cuenta borran las propuestas y los reportes de esa cuenta. Lo ya
-- publicado queda: no es de nadie, es el acuerdo de varios.
--
-- Se aplica con `npm run migraciones -- --aplicar` después de 0011_noches_quieto_build6.sql.

-- ------------------------------------------------------------ Los umbrales
create table moss.comunidad_reglas (
  unica boolean primary key default true check (unica),
  -- Personas distintas con valores parecidos para publicar: con código de barras y sin él.
  confirmaciones smallint not null default 3 check (confirmaciones >= 2),
  confirmaciones_sin_codigo smallint not null default 5 check (confirmaciones_sin_codigo >= 2),
  -- Parecido: cada valor dentro de este margen del mayor, o del mínimo absoluto (las etiquetas
  -- redondean: 0,4 g y 1 g de grasa son lo mismo).
  margen double precision not null default 0.10 check (margen >= 0 and margen <= 0.5),
  margen_minimo_g double precision not null default 1 check (margen_minimo_g >= 0 and margen_minimo_g <= 10),
  margen_minimo_kcal double precision not null default 10 check (margen_minimo_kcal >= 0 and margen_minimo_kcal <= 100),
  reportes_para_ocultar smallint not null default 3 check (reportes_para_ocultar >= 1),
  propuestas_por_dia smallint not null default 30 check (propuestas_por_dia >= 1),
  reportes_por_dia smallint not null default 30 check (reportes_por_dia >= 1),
  antiguedad_minima interval not null default interval '24 hours' check (antiguedad_minima >= interval '0')
);
insert into moss.comunidad_reglas default values;

-- ------------------------------------------------------------ Lo que hace falta para comparar
-- EAN-8, UPC-A (12), EAN-13 o GTIN-14 con su dígito verificador: lo mal leído o inventado no entra.
-- El CASE es a propósito: Postgres no promete el orden de un AND, y el cast de algo que no es dígito
-- cortaría todo.
create or replace function moss.gtin_valido(codigo text) returns boolean
language sql
immutable
set search_path = ''
as $$
  select case when codigo ~ '^([0-9]{8}|[0-9]{12,14})$' then
    (select (10 - sum(substr(codigo, char_length(codigo) - i, 1)::int * case when i % 2 = 1 then 3 else 1 end) % 10) % 10
       from generate_series(1, char_length(codigo) - 1) as i) = substr(codigo, char_length(codigo), 1)::int
  else false end;
$$;

-- El mismo producto escaneado como UPC-A, EAN-13 o GTIN-14 con ceros adelante es una sola clave.
create or replace function moss.gtin_normal(codigo text) returns text
language sql
immutable
set search_path = ''
as $$
  select case when char_length(codigo) = 12 then '0' || codigo
              when char_length(codigo) = 14 and left(codigo, 1) = '0' then substr(codigo, 2)
              else codigo end;
$$;

-- Para comparar nombres y marcas: minúsculas, sin tildes y solo letras y dígitos separados por un
-- espacio. Lo que no es latino (otro alfabeto) queda, así dos nombres en japonés no son la misma clave.
-- Las mayúsculas con tilde van aparte porque lower() no las toca en todas las configuraciones.
create or replace function moss.normalizar(texto text) returns text
language sql
immutable
set search_path = ''
as $$
  select btrim(regexp_replace(regexp_replace(
    lower(translate(texto, 'áàâäãåéèêëíìîïóòôöõúùûüýÿñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÝÑÇ', 'aaaaaaeeeeiiiiooooouuuuyyncaaaaaaeeeeiiiiooooouuuuync')),
    '[«»“”‘’–—·¡¿€°®™ ]', ' ', 'g'), '[\u0001-/:-`{-\u007f]+', ' ', 'g'));
$$;

-- Dos valores parecidos: la diferencia, dentro del margen del mayor o del mínimo absoluto.
create or replace function moss.cerca(uno double precision, otro double precision, margen double precision, minimo double precision) returns boolean
language sql
immutable
set search_path = ''
as $$
  select abs(uno - otro) <= greatest(margen * greatest(uno, otro), minimo);
$$;

-- ------------------------------------------------------------ Las propuestas
-- Una por persona y clave: cambiar de opinión pisa lo suyo, nunca suma dos veces. La clave es el
-- código de barras (normal) o, sin código, el nombre y la marca normalizados.
create table moss.propuestas (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clave text not null check (clave ~ '^(codigo:[0-9]{8,13}|nombre:.+\|.*)$'),
  codigo text check (codigo is null or moss.gtin_valido(codigo)),
  nombre text not null check (char_length(nombre) between 2 and 120),
  marca text check (char_length(marca) between 1 and 80),
  -- Por 100 g de lo que se come. El sodio, en mg.
  kcal double precision not null check (kcal between 0 and 902),
  proteina double precision not null check (proteina between 0 and 100),
  carbohidratos double precision not null check (carbohidratos between 0 and 100),
  grasas double precision not null check (grasas between 0 and 100),
  fibra double precision check (fibra between 0 and 100),
  azucares double precision check (azucares between 0 and 100),
  saturadas double precision check (saturadas between 0 and 100),
  sodio double precision check (sodio between 0 and 40000),
  porcion text check (char_length(porcion) between 1 and 40),
  porcion_gramos double precision check (porcion_gramos > 0 and porcion_gramos <= 2000),
  region text not null default '' check (region ~ '^([A-Z]{2})?$'),
  -- Cambiar la propuesta la vuelve a fechar: así cuenta como nueva después de que se oculta.
  creado timestamptz not null default now(),
  primary key (usuario, clave),
  check ((porcion is null) = (porcion_gramos is null))
);
create index propuestas_por_clave on moss.propuestas (clave);
create index propuestas_por_dia on moss.propuestas (usuario, creado);

-- ------------------------------------------------------------ Lo publicado
-- Lo de la comunidad en el catálogo: si lo es, cuántas personas lo cargaron y desde qué países.
alter table moss.catalogo
  add column comunidad boolean not null default false,
  add column personas smallint check (personas > 0),
  add column paises text[] not null default '{}' check (array_to_string(paises, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  add constraint catalogo_comunidad_check check (comunidad or personas is null);

-- Los ids de lo publicado, muy por encima de los de la base de la app (hasta 2.710.814 al 9/11/2026)
-- y de los del catálogo a mano, y todavía exactos en un número de JavaScript.
create sequence moss.comunidad_ids as bigint start with 9000000000 minvalue 9000000000 maxvalue 9007199254740991;

-- Qué clave es qué fila del catálogo, cuándo se publicó por última vez y cuándo se ocultó. Solo cuentan
-- los reportes de después de publicarse y, una vez oculta, solo las propuestas de después.
create table moss.comunidad (
  clave text primary key,
  alimento bigint not null unique references moss.catalogo (id) on delete cascade,
  publicado timestamptz not null default now(),
  oculto timestamptz
);

-- Un reporte por persona y alimento de la comunidad: reportar otra vez pisa el anterior.
create table moss.reportes_comunidad (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  alimento bigint not null references moss.catalogo (id) on delete cascade,
  motivo text not null check (motivo in ('valores', 'porcion', 'nombre', 'otro')),
  nota text check (char_length(nota) between 1 and 500),
  creado timestamptz not null default now(),
  primary key (usuario, alimento)
);
create index reportes_comunidad_por_alimento on moss.reportes_comunidad (alimento, creado);
create index reportes_comunidad_por_dia on moss.reportes_comunidad (usuario, creado);

-- ------------------------------------------------------------ Evaluar una clave
-- Las propuestas que cuentan para una clave: de cuentas con la antigüedad mínima y, si se ocultó
-- alguna vez, solo las de después (las que se reportaron no vuelven a contar).
create or replace function moss.propuestas_validas(la_clave text) returns setof moss.propuestas
language sql
stable
set search_path = ''
as $$
  select p.*
    from moss.propuestas p
    join auth.users cuenta on cuenta.id = p.usuario
    cross join moss.comunidad_reglas regla
    left join moss.comunidad ya on ya.clave = p.clave
   where p.clave = la_clave
     and cuenta.created_at <= now() - regla.antiguedad_minima
     and (ya.oculto is null or p.creado > ya.oculto);
$$;

-- Busca la propuesta con más personas distintas parecidas a ella (kcal y los tres macros, cada uno
-- cerca) y, si llegan a las confirmaciones, publica la mediana de ese grupo o la pone al día.
-- Devuelve quiénes forman el grupo publicado, o null si todavía no alcanza.
create or replace function moss.evaluar_propuesta(la_clave text) returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  hacen_falta integer;
  el_margen double precision;
  minimo_g double precision;
  minimo_kcal double precision;
  ya_publicado bigint;
  publicado_en timestamptz;
  ocultado timestamptz;
  esta_retirado boolean;
  centro uuid;
  grupo uuid[];
  m_kcal double precision;
  m_proteina double precision;
  m_carbohidratos double precision;
  m_grasas double precision;
  m_fibra double precision;
  m_azucares double precision;
  m_saturadas double precision;
  m_sodio double precision;
  los_codigos text[];
  los_paises text[];
  el_nombre text;
  la_marca text;
  la_porcion jsonb;
begin
  if la_clave is null then
    raise exception 'pedido' using errcode = '22023';
  end if;
  -- Dos propuestas a la vez de la misma clave no publican dos veces.
  perform pg_advisory_xact_lock(hashtext('moss.comunidad:' || la_clave));

  select ya.alimento, ya.publicado, ya.oculto, cat.retirado into ya_publicado, publicado_en, ocultado, esta_retirado
    from moss.comunidad ya
    join moss.catalogo cat on cat.id = ya.alimento
   where ya.clave = la_clave;
  -- Retirado a mano (con la clave de servicio, no por reportes): queda así hasta que Moss lo decida.
  if esta_retirado and (ocultado is null or ocultado < publicado_en) then
    return null;
  end if;

  select case when la_clave like 'codigo:%' then regla.confirmaciones else regla.confirmaciones_sin_codigo end,
         regla.margen, regla.margen_minimo_g, regla.margen_minimo_kcal
    into hacen_falta, el_margen, minimo_g, minimo_kcal
    from moss.comunidad_reglas regla;

  with valida as (
    select * from moss.propuestas_validas(la_clave)
  ),
  par as (
    select a.usuario as uno, a.creado as desde, b.usuario as otro
      from valida a
      join valida b on moss.cerca(a.kcal, b.kcal, el_margen, minimo_kcal)
        and moss.cerca(a.proteina, b.proteina, el_margen, minimo_g)
        and moss.cerca(a.carbohidratos, b.carbohidratos, el_margen, minimo_g)
        and moss.cerca(a.grasas, b.grasas, el_margen, minimo_g)
  ),
  -- Con un empate, el centro es la más antigua: siempre el mismo.
  elegido as (
    select par.uno from par group by par.uno, par.desde order by count(*) desc, par.desde, par.uno limit 1
  )
  select (select elegido.uno from elegido), array_agg(par.otro order by par.otro)
    into centro, grupo
    from par
   where par.uno = (select elegido.uno from elegido);

  if coalesce(cardinality(grupo), 0) < hacen_falta then
    return null;
  end if;

  select percentile_cont(0.5) within group (order by g.kcal),
         percentile_cont(0.5) within group (order by g.proteina),
         percentile_cont(0.5) within group (order by g.carbohidratos),
         percentile_cont(0.5) within group (order by g.grasas),
         percentile_cont(0.5) within group (order by g.fibra),
         percentile_cont(0.5) within group (order by g.azucares),
         percentile_cont(0.5) within group (order by g.saturadas),
         percentile_cont(0.5) within group (order by g.sodio),
         coalesce(array_agg(distinct g.codigo order by g.codigo) filter (where g.codigo is not null), '{}'),
         coalesce(array_agg(distinct g.region order by g.region) filter (where g.region <> ''), '{}')
    into m_kcal, m_proteina, m_carbohidratos, m_grasas, m_fibra, m_azucares, m_saturadas, m_sodio, los_codigos, los_paises
    from moss.propuestas_validas(la_clave) g
   where g.usuario = any (grupo);

  -- El nombre y la marca: la forma más repetida del grupo y, de esa forma, como la escribió el primero.
  select g.nombre into el_nombre
    from moss.propuestas_validas(la_clave) g
   where g.usuario = any (grupo)
   order by count(*) over (partition by moss.normalizar(g.nombre)) desc, g.creado, g.usuario
   limit 1;
  select g.marca into la_marca
    from moss.propuestas_validas(la_clave) g
   where g.usuario = any (grupo)
   order by count(*) over (partition by coalesce(moss.normalizar(g.marca), '')) desc, g.creado, g.usuario
   limit 1;
  select case when g.porcion is null then '[]'::jsonb
              else jsonb_build_array(jsonb_build_object('es', g.porcion, 'en', g.porcion, 'gramos', g.porcion_gramos)) end
    into la_porcion
    from moss.propuestas_validas(la_clave) g
   where g.usuario = centro;

  if ya_publicado is null then
    ya_publicado := nextval('moss.comunidad_ids');
    insert into moss.catalogo (id, nombre_es, nombre_en, marca, codigos, kcal, proteina, carbohidratos, grasas, fibra, azucares, saturadas, sodio,
                               porciones, comunidad, personas, paises, retirado)
    values (ya_publicado, el_nombre, el_nombre, la_marca, los_codigos, m_kcal, m_proteina, m_carbohidratos, m_grasas, m_fibra, m_azucares, m_saturadas, m_sodio,
            la_porcion, true, least(cardinality(grupo), 32767), los_paises, false);
    -- Una clave que se publicó, se borró del catálogo a mano y vuelve: la fila nueva la reemplaza.
    insert into moss.comunidad (clave, alimento, publicado) values (la_clave, ya_publicado, now())
    on conflict (clave) do update set alimento = excluded.alimento, publicado = excluded.publicado, oculto = null;
  else
    -- Solo si algo cambió: cada cambio mueve `actualizado` y todos los teléfonos lo vuelven a bajar.
    update moss.catalogo cat
       set nombre_es = el_nombre, nombre_en = el_nombre, marca = la_marca, codigos = los_codigos,
           kcal = m_kcal, proteina = m_proteina, carbohidratos = m_carbohidratos, grasas = m_grasas,
           fibra = m_fibra, azucares = m_azucares, saturadas = m_saturadas, sodio = m_sodio,
           porciones = la_porcion, comunidad = true, personas = least(cardinality(grupo), 32767), paises = los_paises, retirado = false
     where cat.id = ya_publicado
       and (cat.nombre_es, cat.nombre_en, cat.marca, cat.codigos, cat.kcal, cat.proteina, cat.carbohidratos, cat.grasas, cat.fibra, cat.azucares,
            cat.saturadas, cat.sodio, cat.porciones, cat.comunidad, cat.personas, cat.paises, cat.retirado)
           is distinct from
           (el_nombre, el_nombre, la_marca, los_codigos, m_kcal, m_proteina, m_carbohidratos, m_grasas, m_fibra, m_azucares,
            m_saturadas, m_sodio, la_porcion, true, least(cardinality(grupo), 32767)::smallint, los_paises, false);
    -- Vuelve después de ocultarse: se publica de nuevo y los reportes de antes dejan de contar.
    if esta_retirado then
      update moss.comunidad ya set publicado = now() where ya.clave = la_clave;
    end if;
  end if;
  return grupo;
end;
$$;

-- ------------------------------------------------------------ Proponer
-- Lo llama la app al crear un alimento (src/comida/comunidad.ts revisa lo mismo antes de mandarlo).
-- Devuelve 'publicada' si con esta propuesta el alimento está en el catálogo con los valores de su
-- grupo, o 'guardada' si todavía no.
create or replace function moss.proponer_alimento(
  de_barras text,
  como_se_llama text,
  de_marca text,
  kcal_100 double precision,
  proteina_100 double precision,
  carbohidratos_100 double precision,
  grasas_100 double precision,
  fibra_100 double precision default null,
  azucares_100 double precision default null,
  saturadas_100 double precision default null,
  sodio_100 double precision default null,
  porcion_nombre text default null,
  porcion_gramos double precision default null,
  region_app text default ''
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  quien uuid := auth.uid();
  el_codigo text := nullif(btrim(coalesce(de_barras, '')), '');
  el_nombre text := btrim(regexp_replace(coalesce(como_se_llama, ''), '\s+', ' ', 'g'));
  la_marca text := nullif(btrim(regexp_replace(coalesce(de_marca, ''), '\s+', ' ', 'g')), '');
  la_porcion text := nullif(btrim(regexp_replace(coalesce(porcion_nombre, ''), '\s+', ' ', 'g')), '');
  la_region text := upper(btrim(coalesce(region_app, '')));
  la_clave text;
  tope integer;
  grupo uuid[];
begin
  if quien is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if el_codigo is not null and not moss.gtin_valido(el_codigo) then
    raise exception 'codigo' using errcode = '22023';
  end if;
  -- Un nombre con letras (de cualquier alfabeto), sin direcciones ni arrobas.
  if char_length(el_nombre) not between 2 and 120 or moss.normalizar(el_nombre) !~ '[^0-9 ]'
     or el_nombre ~* '(https?:|www\.|@|\.(com|net|org)\y)' then
    raise exception 'nombre' using errcode = '22023';
  end if;
  if la_marca is not null and (char_length(la_marca) > 80 or la_marca ~* '(https?:|www\.|@|\.(com|net|org)\y)') then
    raise exception 'marca' using errcode = '22023';
  end if;
  -- NaN e infinito no están entre nada.
  if kcal_100 is null or not (kcal_100 between 0 and 902)
     or proteina_100 is null or not (proteina_100 between 0 and 100)
     or carbohidratos_100 is null or not (carbohidratos_100 between 0 and 100)
     or grasas_100 is null or not (grasas_100 between 0 and 100)
     or proteina_100 + carbohidratos_100 + grasas_100 > 102
     or (fibra_100 is not null and not (fibra_100 between 0 and 100))
     or (azucares_100 is not null and not (azucares_100 between 0 and 100))
     or (saturadas_100 is not null and not (saturadas_100 between 0 and 100))
     or (sodio_100 is not null and not (sodio_100 between 0 and 40000)) then
    raise exception 'valores' using errcode = '22023';
  end if;
  -- 4/4/9, con lugar para la fibra, los polioles y el redondeo de la etiqueta.
  if abs(kcal_100 - (4 * proteina_100 + 4 * carbohidratos_100 + 9 * grasas_100)) > greatest(40, 0.25 * kcal_100) then
    raise exception 'no_cierra' using errcode = '22023';
  end if;
  if (la_porcion is null) <> (porcion_gramos is null)
     or (la_porcion is not null and (char_length(la_porcion) > 40 or not (porcion_gramos > 0 and porcion_gramos <= 2000))) then
    raise exception 'porcion' using errcode = '22023';
  end if;
  if la_region !~ '^([A-Z]{2})?$' then
    la_region := '';
  end if;

  la_clave := case when el_codigo is not null then 'codigo:' || moss.gtin_normal(el_codigo)
                   else 'nombre:' || moss.normalizar(el_nombre) || '|' || coalesce(moss.normalizar(la_marca), '') end;

  -- El tope cuenta las otras claves: cambiar de opinión sobre la misma no lo gasta.
  select regla.propuestas_por_dia into tope from moss.comunidad_reglas regla;
  if (select count(*) from moss.propuestas p
       where p.usuario = quien and p.clave <> la_clave and p.creado > now() - interval '24 hours') >= tope then
    raise exception 'tope' using errcode = '22023';
  end if;

  insert into moss.propuestas (usuario, clave, codigo, nombre, marca, kcal, proteina, carbohidratos, grasas, fibra, azucares, saturadas, sodio,
                               porcion, porcion_gramos, region, creado)
  values (quien, la_clave, el_codigo, el_nombre, la_marca, kcal_100, proteina_100, carbohidratos_100, grasas_100, fibra_100, azucares_100, saturadas_100, sodio_100,
          la_porcion, case when la_porcion is null then null else porcion_gramos end, la_region, now())
  on conflict (usuario, clave) do update
    set codigo = excluded.codigo, nombre = excluded.nombre, marca = excluded.marca, kcal = excluded.kcal, proteina = excluded.proteina,
        carbohidratos = excluded.carbohidratos, grasas = excluded.grasas, fibra = excluded.fibra, azucares = excluded.azucares,
        saturadas = excluded.saturadas, sodio = excluded.sodio, porcion = excluded.porcion, porcion_gramos = excluded.porcion_gramos,
        region = excluded.region, creado = excluded.creado;

  grupo := moss.evaluar_propuesta(la_clave);
  return case when quien = any (grupo) then 'publicada' else 'guardada' end;
end;
$$;

-- ------------------------------------------------------------ Reportar
-- Un dato mal en algo de la comunidad. Devuelve true si quedó oculto (ahora o desde antes).
create or replace function moss.reportar_de_la_comunidad(del_catalogo bigint, que_esta_mal text, nota_libre text default null) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  quien uuid := auth.uid();
  la_clave text;
  desde timestamptz;
  esta_retirado boolean;
  hacen_falta integer;
  tope integer;
  antiguedad interval;
  cuantos integer;
begin
  if quien is null then
    raise exception 'sin_sesion' using errcode = '42501';
  end if;
  if que_esta_mal is null or que_esta_mal not in ('valores', 'porcion', 'nombre', 'otro') then
    raise exception 'motivo' using errcode = '22023';
  end if;
  select ya.clave, ya.publicado, cat.retirado into la_clave, desde, esta_retirado
    from moss.comunidad ya
    join moss.catalogo cat on cat.id = ya.alimento
   where ya.alimento = del_catalogo and cat.comunidad;
  if la_clave is null then
    raise exception 'no_es_de_la_comunidad' using errcode = '22023';
  end if;
  select regla.reportes_para_ocultar, regla.reportes_por_dia, regla.antiguedad_minima into hacen_falta, tope, antiguedad
    from moss.comunidad_reglas regla;
  if (select count(*) from moss.reportes_comunidad r
       where r.usuario = quien and r.alimento <> del_catalogo and r.creado > now() - interval '24 hours') >= tope then
    raise exception 'tope' using errcode = '22023';
  end if;

  insert into moss.reportes_comunidad (usuario, alimento, motivo, nota)
  values (quien, del_catalogo, que_esta_mal, nullif(left(btrim(coalesce(nota_libre, '')), 500), ''))
  on conflict (usuario, alimento) do update set motivo = excluded.motivo, nota = excluded.nota, creado = excluded.creado;

  if esta_retirado then
    return true;
  end if;
  perform pg_advisory_xact_lock(hashtext('moss.comunidad:' || la_clave));
  select count(*) into cuantos
    from moss.reportes_comunidad r
    join auth.users cuenta on cuenta.id = r.usuario
   where r.alimento = del_catalogo and r.creado > desde and cuenta.created_at <= now() - antiguedad;
  if cuantos < hacen_falta then
    return false;
  end if;
  update moss.catalogo cat set retirado = true where cat.id = del_catalogo;
  update moss.comunidad ya set oculto = now() where ya.clave = la_clave;
  return true;
end;
$$;

-- ------------------------------------------------------------ Borrar
-- «Borrar mis datos de Moss» también borra las propuestas y los reportes. Pasa a security definer
-- porque esas dos tablas no se tocan desde la app (sin políticas); cada borrado sigue atado a quien
-- llama.
create or replace function moss.borrar_mis_datos() returns void
language sql
security definer
set search_path = ''
as $$
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

-- Borrar la cuenta de Moss (0008_vinculo.sql), igual más las propuestas y los reportes.
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

-- ------------------------------------------------------------ Quién toca qué
-- Las tablas, nadie desde la app: solo las funciones. Moss las lee y ajusta con la clave de servicio.
alter table moss.comunidad_reglas enable row level security;
alter table moss.propuestas enable row level security;
alter table moss.comunidad enable row level security;
alter table moss.reportes_comunidad enable row level security;
revoke all on moss.comunidad_reglas, moss.propuestas, moss.comunidad, moss.reportes_comunidad from anon, authenticated;
grant all on moss.comunidad_reglas, moss.propuestas, moss.comunidad, moss.reportes_comunidad to service_role;
revoke all on sequence moss.comunidad_ids from anon, authenticated;
grant usage, select on sequence moss.comunidad_ids to service_role;

revoke execute on function moss.gtin_valido(text), moss.gtin_normal(text), moss.normalizar(text),
  moss.cerca(double precision, double precision, double precision, double precision), moss.propuestas_validas(text), moss.evaluar_propuesta(text)
  from public, anon, authenticated;
grant execute on function moss.gtin_valido(text), moss.gtin_normal(text), moss.normalizar(text),
  moss.cerca(double precision, double precision, double precision, double precision), moss.propuestas_validas(text), moss.evaluar_propuesta(text)
  to service_role;

revoke execute on function moss.proponer_alimento(text, text, text, double precision, double precision, double precision, double precision,
  double precision, double precision, double precision, double precision, text, double precision, text) from public, anon;
grant execute on function moss.proponer_alimento(text, text, text, double precision, double precision, double precision, double precision,
  double precision, double precision, double precision, double precision, text, double precision, text) to authenticated;
revoke execute on function moss.reportar_de_la_comunidad(bigint, text, text) from public, anon;
grant execute on function moss.reportar_de_la_comunidad(bigint, text, text) to authenticated;
revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
revoke execute on function moss.borrar_cuenta(uuid) from public, anon, authenticated;
grant execute on function moss.borrar_cuenta(uuid) to service_role;
