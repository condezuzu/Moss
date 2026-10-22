-- Moss · esquema 2: lo que se come. Los registros de la línea del día, las recetas y comidas
-- guardadas, los alimentos propios, los favoritos y el agua (spec/nutricion.md, «Datos»).
--
-- Las mismas reglas que el esquema 1: todo en `moss`, cada fila de un usuario con RLS, la hora del
-- cambio decide entre dos versiones (al_recibir) y `recibido` dice qué bajar. Lo que se borra en el
-- teléfono no se borra acá: llega con `borrado` y gana si es lo más nuevo, así el borrado también
-- llega a los otros teléfonos.
--
-- Se aplica a mano en el SQL Editor, después de 0001_esquema.sql.

-- Cada alimento comido, con lo que valía al anotarlo: el historial no cambia si cambia la base.
create table moss.registros (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  dia date not null,
  comida text not null check (comida in ('desayuno', 'almuerzo', 'merienda', 'cena', 'snack')),
  momento timestamptz not null,
  fuente text not null check (fuente in ('base', 'catalogo', 'off', 'propio', 'receta', 'rapida')),
  -- El id en su fuente; la carga rápida no tiene.
  ref text check (char_length(ref) between 1 and 64),
  nombre text not null check (char_length(nombre) between 1 and 200),
  -- {"porcion": "1 taza", "gramosPorcion": 240, "veces": 1}, {"gramos": 150} o null (carga rápida).
  cantidad jsonb,
  kcal double precision not null check (kcal >= 0),
  proteina double precision not null check (proteina >= 0),
  carbohidratos double precision not null check (carbohidratos >= 0),
  grasas double precision not null check (grasas >= 0),
  -- Lo secundario, si la fuente lo trae. El sodio en mg; lo demás en g.
  fibra double precision check (fibra >= 0),
  azucares double precision check (azucares >= 0),
  saturadas double precision check (saturadas >= 0),
  sodio double precision check (sodio >= 0),
  alcohol double precision check (alcohol >= 0),
  planificado boolean not null default false,
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, id)
);
create index registros_por_dia on moss.registros (usuario, dia);
create index registros_por_llegada on moss.registros (usuario, recibido);

-- Una receta se registra como un alimento, por porciones; una comida guardada, con cada uno de sus alimentos.
create table moss.recetas (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  tipo text not null check (tipo in ('receta', 'comida')),
  nombre text not null check (char_length(nombre) between 1 and 120),
  -- Los alimentos, como en los registros: fuente, ref, nombre, cantidad y valores.
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  porciones double precision not null check (porciones > 0),
  peso_final double precision check (peso_final > 0),
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, id)
);

-- Creados a mano o desde la etiqueta, con sus valores por 100 g.
create table moss.propios (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  nombre text not null check (char_length(nombre) between 1 and 200),
  marca text check (char_length(marca) <= 120),
  -- EAN-13, EAN-8 o UPC: solo dígitos.
  codigo text check (codigo ~ '^[0-9]{6,14}$'),
  por_100g jsonb not null check (jsonb_typeof(por_100g) = 'object'),
  porciones jsonb not null default '[]' check (jsonb_typeof(porciones) = 'array'),
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, id)
);
create index propios_por_codigo on moss.propios (usuario, codigo);

-- Sacar un favorito es otro cambio: queda con `favorito` en falso.
create table moss.favoritos (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fuente text not null check (fuente in ('base', 'catalogo', 'off', 'propio', 'receta')),
  ref text not null check (char_length(ref) between 1 and 64),
  favorito boolean not null,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, fuente, ref)
);

-- Cada vaso sumado a mano. Lo de Salud se lee en el teléfono: no se copia.
create table moss.agua (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  dia date not null,
  ml smallint not null check (ml between 1 and 5000),
  momento timestamptz not null,
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, id)
);
create index agua_por_dia on moss.agua (usuario, dia);

create trigger al_recibir before insert or update on moss.registros for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.recetas for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.propios for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.favoritos for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.agua for each row execute function moss.al_recibir('actualizado');

alter table moss.registros enable row level security;
alter table moss.recetas enable row level security;
alter table moss.propios enable row level security;
alter table moss.favoritos enable row level security;
alter table moss.agua enable row level security;

create policy propias on moss.registros for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.recetas for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.propios for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.favoritos for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.agua for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));

-- «Borrar mis datos de Moss» ahora también borra lo que se come.
create or replace function moss.borrar_mis_datos() returns void
language sql
security invoker
set search_path = ''
as $$
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

revoke all on moss.registros, moss.recetas, moss.propios, moss.favoritos, moss.agua from anon;
grant select, insert, update, delete on moss.registros, moss.recetas, moss.propios, moss.favoritos, moss.agua to authenticated;
grant all on moss.registros, moss.recetas, moss.propios, moss.favoritos, moss.agua to service_role;
revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
