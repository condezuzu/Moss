-- Moss · esquema 5: las noches propias de Moss (spec/sueno.md). Salud ya está en cada iPhone de la
-- cuenta de Apple, así que sus noches no suben; lo que Moss sabe de cada noche y Salud no, sí: cómo
-- dijiste que dormiste a la mañana (las cinco caras) y, sin reloj, la hora del sueño estimada por
-- el iPhone y confirmada o corregida por vos. Con eso, cambiar de teléfono no pierde nada, y la
-- recuperación con Ascent tiene la calidad de la noche.
--
-- Las mismas reglas que los esquemas anteriores: todo en `moss`, cada fila de un usuario con RLS, la
-- hora del cambio decide entre dos versiones (al_recibir), `recibido` dice qué bajar y lo borrado
-- llega como una marca.
--
-- Se aplica a mano en el SQL Editor, después de 0004_medir.sql.

create table moss.noches (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- La noche es del día en que te despertás, como en Salud.
  fecha date not null,
  -- Cómo dijiste que dormiste, de 1 (muy mal) a 5 (muy bien).
  cara smallint check (cara between 1 and 5),
  -- Sin reloj: cuándo te dormiste y te despertaste, de dónde sale y qué tan seguro es.
  dormirse timestamptz,
  despertar timestamptz,
  origen text check (origen in ('estimada', 'confirmada', 'corregida', 'manual')),
  confianza text check (confianza in ('alta', 'media', 'baja')),
  -- Lo que estimó el teléfono antes de corregirlo con lo aprendido: con eso se aprende cuánto se
  -- corre en tu caso (src/dominio/sinReloj.ts).
  estimada_dormirse timestamptz,
  estimada_despertar timestamptz,
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, fecha),
  -- Las dos horas van juntas, con su origen, y una noche dura entre 1 y 18 horas.
  check ((dormirse is null) = (despertar is null) and (dormirse is null) = (origen is null)),
  check ((estimada_dormirse is null) = (estimada_despertar is null) and (dormirse is not null or estimada_dormirse is null)),
  check (despertar is null or despertar - dormirse between interval '1 hour' and interval '18 hours')
);
create index noches_por_llegada on moss.noches (usuario, recibido);

create trigger al_recibir before insert or update on moss.noches for each row execute function moss.al_recibir('actualizado');
alter table moss.noches enable row level security;
create policy propias on moss.noches for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));

-- «Borrar mis datos de Moss» también borra las noches.
create or replace function moss.borrar_mis_datos() returns void
language sql
security invoker
set search_path = ''
as $$
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

revoke all on moss.noches from anon;
grant select, insert, update, delete on moss.noches to authenticated;
grant all on moss.noches to service_role;
revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
