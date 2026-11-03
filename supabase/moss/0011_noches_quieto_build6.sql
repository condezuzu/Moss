-- Moss · esquema 11: la ventana tranquila (0010_noches_quieto.sql) con la build 6 en la misma cuenta.
-- La build 6 no conoce quieto_*: su upsert no los nombra, así que al pisar una noche que otro teléfono
-- (con la OTA) subió con su ventana, quieto_* quedan como estaban. Si la build 6 sube esa noche sin lo
-- estimado (solo la cara, u horas a mano), el CHECK noches_quieto la rechazaba (23514) y la build 6 la
-- daba por subida: la cara o las horas quedaban solo en ese teléfono.
-- Ahora, si una noche pierde lo estimado sin que se toque su ventana (lo único que hace la build 6), la
-- ventana se va con lo estimado, antes del CHECK. Quien manda quieto_* (la OTA) sigue igual.
--
-- Se aplica con `npm run migraciones -- --aplicar`, junto con 0010_noches_quieto.sql: las dos antes de
-- cualquier OTA que suba la ventana.

create or replace function moss.quieto_con_lo_estimado() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estimada_dormirse is null
    and new.quieto_desde is not distinct from old.quieto_desde
    and new.quieto_hasta is not distinct from old.quieto_hasta then
    new.quieto_desde := null;
    new.quieto_hasta := null;
  end if;
  return new;
end;
$$;

-- Los BEFORE corren por orden alfabético: primero al_recibir, y si esa descarta la fila por vieja, esta
-- ni corre.
create trigger quieto_con_lo_estimado before update on moss.noches for each row execute function moss.quieto_con_lo_estimado();

revoke execute on function moss.quieto_con_lo_estimado() from public, anon;
