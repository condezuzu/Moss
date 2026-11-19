-- Moss · esquema 14: vincular desde Moss con un código de un uso (spec/ascent.md, «Vincular en menos de 10
-- segundos», «Con un código»). Las cuentas de Moss del iPhone se crean con Apple y no tienen contraseña, y las
-- builds de Ascent de la tienda no dejan su sesión en el llavero: sin ella, Moss pide un código, lo abre en
-- Ascent (https://ascent-blush-seven.vercel.app/vincular/<código>) y Ascent, con su sesión, lo usa.
--
-- El código solo existe en claro en el enlace: aquí queda su sha256, con la cuenta de Moss, cuándo vence (a los
-- 5 minutos) y cuándo se usó. La tabla la tocan solo estas dos funciones `security definer`: RLS prendida y sin
-- políticas ni permisos para la app. Vincular hace lo mismo que `moss-vincular`: llama a moss.vincular_cuentas
-- (0008_vinculo.sql), que sigue cerrada para la app. De Ascent solo se lee el nombre de usuario, como en 0008.
--
-- Necesita pgcrypto en el esquema `extensions`, como viene en Supabase (gen_random_bytes). Se aplica con
-- `npm run migraciones -- --aplicar`.

create table moss.codigos_de_vinculo (
  -- El sha256 del código, nunca el código.
  hash bytea primary key,
  moss uuid not null references auth.users (id) on delete cascade,
  vence timestamptz not null,
  -- null mientras no se usó.
  usado timestamptz
);

create index codigos_de_vinculo_moss on moss.codigos_de_vinculo (moss);

alter table moss.codigos_de_vinculo enable row level security;
revoke all on moss.codigos_de_vinculo from anon, authenticated;

-- La llama la cuenta de Moss. Devuelve el código (32 bytes al azar en base64url sin relleno: 43 caracteres).
-- Cada código nuevo borra los anteriores sin usar de esa cuenta, y de paso los vencidos de todos.
create or replace function moss.crear_codigo_de_vinculo() returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := (select auth.uid());
  nuevo text;
begin
  if cuenta is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  delete from moss.codigos_de_vinculo viejo where viejo.vence <= now() or (viejo.moss = cuenta and viejo.usado is null);
  nuevo := rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=');
  insert into moss.codigos_de_vinculo (hash, moss, vence) values (sha256(convert_to(nuevo, 'UTF8')), cuenta, now() + interval '5 minutes');
  return nuevo;
end;
$$;

-- La llama la cuenta de Ascent, con el código que le llegó en el enlace. { ok: true, nombre } (el usuario de
-- Ascent, como moss-vincular) o { ok: false, error }: 'sin_ascent' (la cuenta nunca usó Ascent: no tiene nombre
-- de usuario; así tampoco prueba códigos), 'no_existe', 'usado' o 'vencido'.
create or replace function moss.vincular_con_codigo(p_codigo text) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cuenta uuid := (select auth.uid());
  usuario text;
  huella bytea;
  de_moss uuid;
  ya_usado boolean;
begin
  if cuenta is null then
    raise exception 'sin_sesion' using errcode = 'P0001';
  end if;
  select perfil.username into usuario from public.profiles perfil where perfil.id = cuenta;
  if usuario is null then
    return jsonb_build_object('ok', false, 'error', 'sin_ascent');
  end if;
  if p_codigo is null or p_codigo !~ '^[A-Za-z0-9_-]{43}$' then
    return jsonb_build_object('ok', false, 'error', 'no_existe');
  end if;
  huella := sha256(convert_to(p_codigo, 'UTF8'));
  -- Usarlo es un solo update: con dos llamadas a la vez, la segunda espera la fila y, al volver a mirarla, ya está
  -- usada, así que no la toma.
  update moss.codigos_de_vinculo codigo set usado = now()
   where codigo.hash = huella and codigo.usado is null and codigo.vence > now()
   returning codigo.moss into de_moss;
  if de_moss is null then
    select codigo.usado is not null into ya_usado from moss.codigos_de_vinculo codigo where codigo.hash = huella;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'no_existe');
    end if;
    return jsonb_build_object('ok', false, 'error', case when ya_usado then 'usado' else 'vencido' end);
  end if;
  return jsonb_build_object('ok', true) || moss.vincular_cuentas(de_moss, cuenta, 'ascent');
end;
$$;

revoke execute on function moss.crear_codigo_de_vinculo(), moss.vincular_con_codigo(text) from public, anon;
grant execute on function moss.crear_codigo_de_vinculo(), moss.vincular_con_codigo(text) to authenticated;
