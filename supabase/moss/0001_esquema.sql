-- Moss · esquema 1: perfil, hábitos, constelaciones por día, marcas, días, logros, pesos y metas.
--
-- Vive en el proyecto de Supabase de Ascent, siempre en el esquema `moss`: nunca toca `public`
-- (es de Ascent) ni llama funciones de Ascent (spec/ascent.md). Cada fila es de un usuario y RLS
-- solo deja ver y tocar las propias. Si se borra la cuenta (auth.users), se borra todo en cascada.
--
-- Se aplica a mano en el SQL Editor, como las migraciones de Ascent, y antes hay que exponer el
-- esquema `moss` en Settings › Data API. `npm run supabase:verificar` la prueba en un Postgres
-- local (PGlite) sin tocar Supabase, y también la app sincronizando contra ella.

create schema if not exists moss;
grant usage on schema moss to authenticated, service_role;

-- La app es local primero y sube lo que cambió. Al llegar cada fila:
-- - si es más vieja que la guardada (otro teléfono, o una subida atrasada), se ignora;
-- - si no, se anota en `recibido` la hora del servidor, para que cada teléfono baje solo lo nuevo.
-- El argumento es la columna con la hora del cambio.
create or replace function moss.al_recibir() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (to_jsonb(new) ->> tg_argv[0])::timestamptz < (to_jsonb(old) ->> tg_argv[0])::timestamptz then
    return null;
  end if;
  new.recibido := now();
  return new;
end;
$$;

-- Las respuestas del cuestionario de la entrada. La edad se guarda como año de nacimiento para
-- que no envejezca. Hasta que se contesta, la fila puede tener solo la semilla.
create table moss.perfiles (
  usuario uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nacimiento smallint check (nacimiento between 1900 and 2100),
  sexo text check (sexo in ('f', 'm')),
  altura_cm numeric(5, 1) check (altura_cm between 50 and 260),
  actividad text check (actividad in ('poco', 'algo', 'activo', 'muy')),
  objetivo text check (objetivo in ('bajar', 'mantener', 'subir')),
  ritmo text check (ritmo in ('suave', 'recomendado', 'rapido')),
  -- Para que cada usuario reciba su propio orden del catálogo de constelaciones.
  semilla text,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now()
);

create table moss.habitos (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 64),
  nombre text not null check (char_length(nombre) between 1 and 80),
  icono text not null,
  dias smallint[] not null,
  -- {"tipo": "manual"} o {"tipo": "salud", "dato": "pasos", "meta": 8000}, etc. (src/dominio/habitos.ts).
  fuente jsonb not null,
  orden integer not null,
  desde date not null,
  hasta date,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, id)
);

-- La constelación de cada día de la semana mientras ese día tiene la misma cantidad de hábitos.
create table moss.periodos (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  dia smallint not null check (dia between 0 and 6),
  desde date not null,
  hasta date,
  constelacion text not null,
  cantidad smallint not null check (cantidad > 0),
  primary key (usuario, dia, desde)
);

-- El último estado de cada hábito en cada día.
create table moss.marcas (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  habito text not null,
  dia date not null,
  hecho boolean not null,
  momento timestamptz not null,
  origen text not null check (origen in ('toque', 'deshacer', 'salud', 'ascent', 'comida')),
  recibido timestamptz not null default now(),
  primary key (usuario, habito, dia)
);

-- El resumen de cada día vivido: queda fijo aunque después cambien los hábitos.
create table moss.dias (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  clave date not null,
  constelacion text,
  habitos text[] not null,
  hechos text[] not null,
  luz smallint not null check (luz >= 0),
  completo boolean not null,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, clave)
);

-- Una vez ganado, un logro no se pierde.
create table moss.logros (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  desde date not null,
  primary key (usuario, id)
);

-- Un peso por día: de Salud, de Ascent o a mano. Las metas usan la tendencia, no el número de un día.
create table moss.pesos (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  kg numeric(5, 2) not null check (kg between 20 and 400),
  origen text not null check (origen in ('manual', 'salud', 'ascent')),
  momento timestamptz not null,
  recibido timestamptz not null default now(),
  primary key (usuario, fecha)
);

-- Las metas de comida desde cada fecha: la inicial y las de cada control semanal, con el porqué.
create table moss.metas (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  desde date not null,
  kcal smallint not null check (kcal between 0 and 20000),
  proteina smallint not null check (proteina >= 0),
  carbohidratos smallint not null check (carbohidratos >= 0),
  grasas smallint not null check (grasas >= 0),
  gasto smallint not null check (gasto > 0),
  motivo text not null check (motivo in ('inicial', 'control', 'faltanDatos', 'manual')),
  momento timestamptz not null,
  recibido timestamptz not null default now(),
  primary key (usuario, desde)
);

create trigger al_recibir before insert or update on moss.perfiles for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.habitos for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.marcas for each row execute function moss.al_recibir('momento');
create trigger al_recibir before insert or update on moss.dias for each row execute function moss.al_recibir('actualizado');
create trigger al_recibir before insert or update on moss.pesos for each row execute function moss.al_recibir('momento');
create trigger al_recibir before insert or update on moss.metas for each row execute function moss.al_recibir('momento');

alter table moss.perfiles enable row level security;
alter table moss.habitos enable row level security;
alter table moss.periodos enable row level security;
alter table moss.marcas enable row level security;
alter table moss.dias enable row level security;
alter table moss.logros enable row level security;
alter table moss.pesos enable row level security;
alter table moss.metas enable row level security;

-- `(select auth.uid())` y no `auth.uid()`: así Postgres lo calcula una vez por consulta.
create policy propias on moss.perfiles for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.habitos for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.periodos for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.marcas for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.dias for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.logros for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.pesos for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));
create policy propias on moss.metas for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));

-- La semilla es de la cuenta: queda la primera que llega, y se devuelve la que quedó. Si todavía
-- no hay perfil, la fila nace con la hora más vieja posible: el perfil de verdad siempre le gana.
create or replace function moss.poner_semilla(valor text) returns text
language sql
security invoker
set search_path = ''
as $$
  insert into moss.perfiles (semilla, actualizado) values (valor, to_timestamp(0))
  on conflict (usuario) do update set semilla = coalesce(moss.perfiles.semilla, excluded.semilla)
  returning semilla;
$$;

-- Los períodos salen de los hábitos y se suben enteros: se reemplazan todos los del usuario de una vez.
create or replace function moss.poner_periodos(lista jsonb) returns void
language sql
security invoker
set search_path = ''
as $$
  delete from moss.periodos where usuario = (select auth.uid());
  insert into moss.periodos (dia, desde, hasta, constelacion, cantidad)
  select (p ->> 'dia')::smallint, (p ->> 'desde')::date, (p ->> 'hasta')::date, p ->> 'constelacion', (p ->> 'cantidad')::smallint
  from jsonb_array_elements(lista) as p;
$$;

-- «Borrar mis datos de Moss»: todo lo de Moss del usuario, sin tocar la cuenta (es la misma de Ascent).
create or replace function moss.borrar_mis_datos() returns void
language sql
security invoker
set search_path = ''
as $$
  delete from moss.marcas where usuario = (select auth.uid());
  delete from moss.dias where usuario = (select auth.uid());
  delete from moss.periodos where usuario = (select auth.uid());
  delete from moss.habitos where usuario = (select auth.uid());
  delete from moss.logros where usuario = (select auth.uid());
  delete from moss.pesos where usuario = (select auth.uid());
  delete from moss.metas where usuario = (select auth.uid());
  delete from moss.perfiles where usuario = (select auth.uid());
$$;

revoke all on all tables in schema moss from anon;
grant select, insert, update, delete on all tables in schema moss to authenticated;
grant all on all tables in schema moss to service_role;
revoke execute on all functions in schema moss from public, anon;
grant execute on function moss.poner_semilla(text) to authenticated;
grant execute on function moss.poner_periodos(jsonb) to authenticated;
grant execute on function moss.borrar_mis_datos() to authenticated;
