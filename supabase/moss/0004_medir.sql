-- Moss · esquema 4: cómo se mide lo comido (spec/nutricion.md, «Cómo se miden los alimentos») y el
-- catálogo en el servidor (spec/decisiones.md, D11).
--
-- Lo comido sigue las reglas de siempre. El catálogo es distinto: no es de nadie, lo escribe solo
-- Moss con la clave de servicio y lo lee cualquier usuario con sesión (la entrada pide la cuenta).
--
-- Se aplica a mano en el SQL Editor, después de 0003_progreso.sql.

-- Pesado o a ojo: lo calculado a ojo, el control semanal lo mueve más despacio (src/dominio/control.ts).
alter table moss.registros add column estimado boolean not null default false;

-- De dónde salen los valores de un alimento propio: Open Food Facts pide nombrarlo donde se muestra (ODbL).
alter table moss.propios add column origen text check (origen in ('off', 'etiqueta', 'mano'));

-- Repartir la semana (Progreso, Metas): los días altos (0 es domingo) y cuántas kcal suben. Sin
-- repartir, los dos en null.
alter table moss.perfiles
  add column semana_altos smallint[] check (semana_altos <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[] and cardinality(semana_altos) between 1 and 6),
  add column semana_extra smallint check (semana_extra in (200, 300, 500)),
  add constraint perfiles_semana_check check ((semana_altos is null) = (semana_extra is null));

-- Borrar la cuenta (spec/ascent.md, «Borrar la cuenta»): es la misma de Ascent, así que borra los
-- datos de las dos apps; Moss lo avisa antes. La corre el dueño de la función, el único que puede
-- borrar en auth.users, y solo borra la cuenta de quien la llama. Revocar el token de Apple va en
-- una función del servidor con la clave de Apple (pendiente).
create or replace function moss.borrar_cuenta() returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;
revoke execute on function moss.borrar_cuenta() from public, anon;
grant execute on function moss.borrar_cuenta() to authenticated;

-- Los productos y los platos ya van dentro de la app (assets/alimentos.db), así andan sin conexión
-- desde el primer día. Esta tabla corrige y suma sin sacar una versión nueva: una fila con el id de
-- un alimento de la base lo reemplaza, una con un id nuevo lo agrega y `retirado` lo saca. El
-- teléfono baja lo que cambió desde la última vez, por `actualizado`.
create table moss.catalogo (
  id bigint primary key,
  nombre_es text not null check (char_length(nombre_es) between 1 and 200),
  nombre_en text not null check (char_length(nombre_en) between 1 and 200),
  -- Otros nombres para buscarlo, en español.
  alias text[] not null default '{}',
  categoria text check (char_length(categoria) between 1 and 60),
  marca text check (char_length(marca) between 1 and 120),
  -- EAN-13, EAN-8 o UPC: solo dígitos.
  codigos text[] not null default '{}' check (array_to_string(codigos, ',') ~ '^([0-9]{6,14}(,[0-9]{6,14})*)?$'),
  -- Por 100 g de lo que se come. El sodio, en mg; lo secundario que no se sabe, en null.
  kcal double precision not null check (kcal between 0 and 902),
  proteina double precision not null check (proteina between 0 and 100),
  carbohidratos double precision not null check (carbohidratos between 0 and 100),
  grasas double precision not null check (grasas between 0 and 100),
  fibra double precision check (fibra between 0 and 100),
  azucares double precision check (azucares between 0 and 100),
  saturadas double precision check (saturadas between 0 and 100),
  sodio double precision check (sodio between 0 and 40000),
  alcohol double precision check (alcohol between 0 and 100),
  -- [{"es": "1 vaso", "en": "1 glass", "gramos": 200}]: la primera es la de siempre.
  porciones jsonb not null default '[]' check (jsonb_typeof(porciones) = 'array'),
  -- Lo que se toma: g por ml. Lo que tiene parte que no se come: qué fracción, y qué es.
  densidad double precision check (densidad between 0.3 and 2),
  desecho double precision check (desecho > 0 and desecho < 1),
  que_desecho text check (char_length(que_desecho) between 1 and 60),
  -- Lo salteado pregunta por el aceite; en lo frito ya está incluido.
  aceite text check (aceite in ('preguntar', 'incluido')),
  -- En lo cocido, el id de su versión cruda.
  crudo bigint,
  retirado boolean not null default false,
  actualizado timestamptz not null default now()
);
create index catalogo_por_cambio on moss.catalogo (actualizado);

-- Cada cambio mueve la hora, con el reloj de la base: así el teléfono lo baja.
create or replace function moss.catalogo_cambiado() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado := now();
  return new;
end;
$$;
create trigger al_cambiar before insert or update on moss.catalogo for each row execute function moss.catalogo_cambiado();

alter table moss.catalogo enable row level security;
create policy leer on moss.catalogo for select to authenticated using (true);
revoke all on moss.catalogo from anon, authenticated;
grant select on moss.catalogo to authenticated;
grant all on moss.catalogo to service_role;
