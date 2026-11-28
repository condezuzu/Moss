-- Moss · esquema 23: los despertares de cada noche sin reloj (28/11/2026, lo pediste: agarrar el teléfono en medio
-- de la noche y volver a dejarlo ya no la corta). Cada despertar va de que lo agarraste a que volviste a dormirte, y
-- se resta de lo dormido (src/dominio/sinReloj.ts, DESPERTAR y nocheDeMoss). Van con lo estimado, como la ventana
-- tranquila (0010_noches_quieto.sql), y suben para que el otro teléfono de la cuenta cuente la misma noche.
--
-- Es una columna que puede quedar vacía: [{ "desde": "…", "hasta": "…" }, …], las horas en ISO.
-- - La versión de la app que no la conoce no la nombra en su upsert: al pisar una noche que otro teléfono subió con
--   sus despertares, quedan como estaban. Si cambió la hora de esa noche, la app de ahora resta solo lo que cae
--   adentro de la nueva.
-- - Si esa versión sube la noche sin lo estimado (solo la cara, u horas a mano), los despertares se van con lo
--   estimado antes del CHECK (como 0011_noches_quieto_build6.sql): si no, la rechazaba y quedaba solo en su teléfono.
--
-- Se aplica con `npm run migraciones -- --aplicar`, antes de la OTA que la sube: sin la columna, subir las noches
-- falla y se reintenta.

-- Una lista de hasta 48 despertares, cada uno con sus dos horas y la primera antes. Una noche dura hasta 18 horas y
-- entre dos despertares queda por lo menos media hora quieta: 48 sobra.
create or replace function moss.despertares_validos(lista jsonb) returns boolean
language sql
stable
set search_path = ''
as $$
  select jsonb_typeof(lista) = 'array' and jsonb_array_length(lista) <= 48 and not exists (
    select 1 from jsonb_array_elements(lista) d
     where jsonb_typeof(d) <> 'object' or jsonb_typeof(d -> 'desde') is distinct from 'string' or jsonb_typeof(d -> 'hasta') is distinct from 'string'
        or (d ->> 'desde')::timestamptz >= (d ->> 'hasta')::timestamptz
  );
$$;

alter table moss.noches
  add column despertares jsonb,
  add constraint noches_despertares check (despertares is null or (estimada_dormirse is not null and moss.despertares_validos(despertares)));

create or replace function moss.despertares_con_lo_estimado() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estimada_dormirse is null then
    new.despertares := null;
  end if;
  return new;
end;
$$;

-- Los BEFORE corren por orden alfabético: primero al_recibir, y si esa descarta la fila por vieja, esta ni corre.
create trigger despertares_con_lo_estimado before update on moss.noches for each row execute function moss.despertares_con_lo_estimado();

revoke execute on function moss.despertares_con_lo_estimado() from public, anon;
