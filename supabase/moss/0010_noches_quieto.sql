-- Moss · esquema 10: la ventana tranquila de cada noche sin reloj (D33, lo pediste el 29/10/2026).
-- Para aprender cuánto tardás en dormirte desde la última vez que usaste el teléfono, y en agarrarlo
-- al despertarte (src/dominio/sinReloj.ts, aprenderPersonal), cada estimación guarda la última
-- actividad antes del hueco y la primera después. Así lo aprendido no se pierde al cambiar de
-- teléfono ni cuando la noche vuelve de la cuenta.
--
-- Son dos columnas que pueden quedar vacías: la versión de la app que no las conoce sigue igual. Se
-- aplica con `npm run migraciones -- --aplicar`, antes de la versión de la app que las sube: sin las
-- columnas, subir las noches falla y se reintenta.

alter table moss.noches
  add column quieto_desde timestamptz,
  add column quieto_hasta timestamptz,
  -- Las dos van juntas, solo con lo estimado, y la ventana dura algo.
  add constraint noches_quieto check (
    (quieto_desde is null) = (quieto_hasta is null)
    and (quieto_desde is null or (estimada_dormirse is not null and quieto_hasta > quieto_desde))
  );
