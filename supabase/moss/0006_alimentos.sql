-- Moss · esquema 6: los micronutrientes de lo comido y del catálogo, lo que mejora la base de
-- alimentos sin saber de quién viene (las búsquedas que no encontraron nada y los errores que
-- reporta la gente desde la ventana de un alimento; spec/nutricion.md, «La base se mejora sola») y,
-- en el perfil, si Moss no pone en déficit (embarazo, lactancia o una condición médica).
--
-- Lo comido sigue las reglas de siempre. Las búsquedas y los reportes no son de nadie: no guardan
-- el usuario, ni la hora, ni nada del teléfono. Se escriben solo con dos funciones que revisan lo
-- que llega, y nadie los lee desde la app.
--
-- Se aplica a mano en el SQL Editor, después de 0005_noches.sql.

-- Sin déficit: embarazo, lactancia o una condición médica. No se guarda cuál: solo que Moss no
-- propone comer menos de lo que se gasta (src/dominio/metas.ts, objetivoPermitido).
alter table moss.perfiles add column sin_deficit boolean not null default false;

-- Las vitaminas, los minerales, las otras grasas y la cafeína de lo comido, como los guarda la app:
-- {"calcio": 246, "vitaminaD": 2.2}. Lo que no se sabe, no está.
alter table moss.registros add column micros jsonb check (micros is null or jsonb_typeof(micros) = 'object');

-- El catálogo, como la base de la app: los micronutrientes y si está verificado (el día y con qué:
-- una segunda fuente oficial, sus ingredientes o su etiqueta).
alter table moss.catalogo
  add column micros jsonb check (micros is null or jsonb_typeof(micros) = 'object'),
  add column verificado date,
  add column segunda text check (char_length(segunda) between 1 and 60),
  add constraint catalogo_verificado_check check ((verificado is null) = (segunda is null));

-- Lo que se buscó y no encontró nada: el texto (en minúsculas), el idioma y la región de la app, y
-- el día. Sin usuario. La misma búsqueda del mismo día suma una vez.
create table moss.busquedas_vacias (
  texto text not null check (char_length(texto) between 2 and 60),
  idioma text not null check (idioma in ('es', 'en')),
  region text not null default '' check (region ~ '^([A-Z]{2})?$'),
  dia date not null default current_date,
  veces integer not null default 1 check (veces > 0),
  primary key (texto, idioma, region, dia)
);

create or replace function moss.anotar_busqueda_vacia(buscado text, idioma_app text, region_app text default '') returns void
language sql
security definer
set search_path = ''
as $$
  insert into moss.busquedas_vacias (texto, idioma, region)
  values (left(lower(btrim(buscado)), 60), idioma_app, coalesce(upper(left(region_app, 2)), ''))
  on conflict (texto, idioma, region, dia) do update set veces = moss.busquedas_vacias.veces + 1;
$$;

-- Un error en un alimento: cuál (su id en la base de la app, o el código de barras), qué está mal y,
-- si quiere, una nota. Sin usuario: no se contesta, se corrige en la base o en el catálogo.
create table moss.reportes (
  id bigint generated always as identity primary key,
  alimento bigint,
  codigo text check (codigo ~ '^[0-9]{6,14}$'),
  nombre text not null check (char_length(nombre) between 1 and 200),
  motivo text not null check (motivo in ('valores', 'porcion', 'nombre', 'otro')),
  nota text check (char_length(nota) between 1 and 500),
  -- La versión de la base de alimentos de la app (src/comida/version-de-la-base.ts).
  version text check (char_length(version) between 1 and 20),
  dia date not null default current_date,
  check (alimento is not null or codigo is not null)
);

create or replace function moss.reportar_alimento(de_la_base bigint, de_barras text, como_se_llama text, que_esta_mal text, nota_libre text default null, version_base text default null) returns void
language sql
security definer
set search_path = ''
as $$
  insert into moss.reportes (alimento, codigo, nombre, motivo, nota, version)
  values (de_la_base, nullif(de_barras, ''), left(btrim(como_se_llama), 200), que_esta_mal, nullif(left(btrim(coalesce(nota_libre, '')), 500), ''), nullif(left(version_base, 20), ''));
$$;

-- Nadie las lee ni las escribe directo desde la app: solo las dos funciones, con sesión (la entrada
-- pide la cuenta, y así un anónimo no puede llenarlas). Moss las lee con la clave de servicio.
alter table moss.busquedas_vacias enable row level security;
alter table moss.reportes enable row level security;
revoke all on moss.busquedas_vacias, moss.reportes from anon, authenticated;
grant all on moss.busquedas_vacias, moss.reportes to service_role;
revoke execute on function moss.anotar_busqueda_vacia(text, text, text) from public, anon;
revoke execute on function moss.reportar_alimento(bigint, text, text, text, text, text) from public, anon;
grant execute on function moss.anotar_busqueda_vacia(text, text, text) to authenticated;
grant execute on function moss.reportar_alimento(bigint, text, text, text, text, text) to authenticated;
