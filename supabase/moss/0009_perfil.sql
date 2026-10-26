-- Moss · esquema 9: tu nombre, el de arriba de Perfil (src/dominio/nombre.ts). Lo trae Sign in with
-- Apple la primera vez que entras, o lo escribes en Editar perfil. Tu foto no sube: queda en el
-- teléfono.
--
-- El nombre va en la fila del perfil, pero con su propia hora: llega antes que el cuestionario (al
-- entrar con Apple) y cambia sin tocar lo demás del perfil. Las reglas de siempre: gana el cambio más
-- nuevo, y `recibido` (que pone al_recibir) dice qué bajar. Como la semilla, se escribe con una
-- función: si todavía no hay perfil, la fila nace con la hora más vieja posible, así el perfil de
-- verdad siempre le gana. «Borrar mis datos» y borrar la cuenta ya borran la fila entera.
--
-- Se aplica a mano en el SQL Editor, después de 0008_vinculo.sql. Antes que la versión de la app que
-- lo sube: sin la función, la sincronización reintenta y no da nada por subido.

alter table moss.perfiles
  add column nombre text check (char_length(nombre) between 1 and 60),
  -- Un nombre borrado también tiene su hora, con el nombre en null: así el borrado llega a los otros teléfonos.
  add column nombre_actualizado timestamptz;

-- Tu nombre, solo si es más nuevo que el guardado. Vacío lo borra.
create or replace function moss.poner_nombre(valor text, cuando timestamptz) returns void
language sql
security invoker
set search_path = ''
as $$
  insert into moss.perfiles (nombre, nombre_actualizado, actualizado) values (nullif(left(btrim(valor), 60), ''), cuando, to_timestamp(0))
  on conflict (usuario) do update set nombre = excluded.nombre, nombre_actualizado = excluded.nombre_actualizado
  where moss.perfiles.nombre_actualizado is null or moss.perfiles.nombre_actualizado < excluded.nombre_actualizado;
$$;

revoke execute on function moss.poner_nombre(text, timestamptz) from public, anon;
grant execute on function moss.poner_nombre(text, timestamptz) to authenticated;
