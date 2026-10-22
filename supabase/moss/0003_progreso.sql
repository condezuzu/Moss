-- Moss · esquema 3: Progreso (spec/progreso.md). La estrategia viaja con el perfil (cómo se
-- reparten los macros, el peso al que se quiere llegar y el día del control), las metas suman el
-- motivo «objetivo» (un cambio de la estrategia) y las medidas del cuerpo tienen su tabla.
--
-- Las mismas reglas que los esquemas 1 y 2: todo en `moss`, cada fila de un usuario con RLS, la
-- hora del cambio decide entre dos versiones (al_recibir), `recibido` dice qué bajar y lo borrado
-- llega como una marca.
--
-- Se aplica a mano en el SQL Editor, después de 0002_comida.sql.

alter table moss.perfiles
  add column estilo text check (estilo in ('equilibrada', 'bajaEnGrasas', 'bajaEnCarbohidratos', 'keto')),
  add column peso_meta numeric(5, 1) check (peso_meta between 20 and 400),
  -- 0 es domingo, como en el teléfono. Sin elegir, el control es el día de la primera meta.
  add column dia_del_control smallint check (dia_del_control between 0 and 6);

alter table moss.metas drop constraint metas_motivo_check;
alter table moss.metas add constraint metas_motivo_check check (motivo in ('inicial', 'control', 'faltanDatos', 'manual', 'objetivo'));

-- Las medidas de un día, en centímetros: lo que no se midió va en null.
create table moss.medidas (
  usuario uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha date not null,
  cintura numeric(4, 1) check (cintura between 40 and 200),
  cuello numeric(4, 1) check (cuello between 20 and 70),
  cadera numeric(4, 1) check (cadera between 50 and 200),
  brazo numeric(4, 1) check (brazo between 15 and 70),
  pecho numeric(4, 1) check (pecho between 50 and 200),
  muslo numeric(4, 1) check (muslo between 25 and 110),
  borrado boolean not null default false,
  actualizado timestamptz not null default now(),
  recibido timestamptz not null default now(),
  primary key (usuario, fecha)
);
create index medidas_por_llegada on moss.medidas (usuario, recibido);

create trigger al_recibir before insert or update on moss.medidas for each row execute function moss.al_recibir('actualizado');
alter table moss.medidas enable row level security;
create policy propias on moss.medidas for all to authenticated using (usuario = (select auth.uid())) with check (usuario = (select auth.uid()));

-- «Borrar mis datos de Moss» también borra las medidas.
create or replace function moss.borrar_mis_datos() returns void
language sql
security invoker
set search_path = ''
as $$
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

revoke all on moss.medidas from anon;
grant select, insert, update, delete on moss.medidas to authenticated;
grant all on moss.medidas to service_role;
revoke execute on function moss.borrar_mis_datos() from public, anon;
grant execute on function moss.borrar_mis_datos() to authenticated;
