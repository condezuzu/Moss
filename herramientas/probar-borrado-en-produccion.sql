-- Prueba en producción de los dos borrados (D29, D30): cuentas de prueba dentro de un solo bloque
-- que termina en raise exception, así todo se deshace y no queda nada. Se corre con
-- `npx supabase db query --linked -f herramientas/probar-borrado-en-produccion.sql`: el «error» trae
-- `RESULTADO {…}`, con true en cada comprobación. Necesita la migración 99 de Ascent.
-- Casos: 1) cuentas separadas, borra Ascent; 2) cuentas separadas, borra Moss;
-- 3) el mismo usuario (correo de Ascent + Apple de Moss), borra Ascent;
-- 4) el mismo usuario, borra Moss (moss.borrar_cuenta y se le quita Apple, como hace moss-borrar-cuenta).
do $prueba$
declare
  a uuid := 'b0e1a5e0-0000-4000-8000-00000000000a';
  m uuid := 'b0e1a5e0-0000-4000-8000-00000000000b';
  a2 uuid := 'b0e1a5e0-0000-4000-8000-00000000000c';
  m2 uuid := 'b0e1a5e0-0000-4000-8000-00000000000d';
  u uuid := 'b0e1a5e0-0000-4000-8000-00000000000e';
  u2 uuid := 'b0e1a5e0-0000-4000-8000-00000000000f';
  r jsonb := '{}';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  select '00000000-0000-0000-0000-000000000000', v.id, 'authenticated', 'authenticated', 'prueba-borrado-' || v.n || '@moss.invalid', 'x', now(), '{}'::jsonb, '{}'::jsonb, now(), now()
  from (values (a, 'a'), (m, 'm'), (a2, 'a2'), (m2, 'm2'), (u, 'u'), (u2, 'u2')) as v(id, n);

  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  select x.id::text, x.id, jsonb_build_object('sub', x.id::text, 'email', x.email), 'email', now(), now()
  from auth.users x where x.id in (a, a2, u, u2);
  insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
  select 'prueba-apple-' || x.id::text, x.id, jsonb_build_object('sub', 'prueba-apple-' || x.id::text, 'email', x.email), 'apple', now(), now()
  from auth.users x where x.id in (m, m2, u, u2);

  -- Lo de Ascent: el perfil con nombre (el alta deja uno vacío a cualquier cuenta).
  insert into public.profiles (id, username)
  select v.id, v.n from (values (a, 'pruebaborradoa'), (a2, 'pruebaborradoc'), (u, 'pruebaborradoe'), (u2, 'pruebaborradof')) as v(id, n)
  on conflict (id) do update set username = excluded.username;

  -- Lo de Moss: el perfil y un peso.
  insert into moss.perfiles (usuario, nacimiento) select x, 1990 from unnest(array[m, m2, u, u2]) as x;
  insert into moss.pesos (usuario, fecha, kg, origen, momento) select x, current_date, 80, 'manual', now() from unnest(array[m, m2, u, u2]) as x;
  insert into moss.vinculo (moss, ascent, origen) values (m, a, 'moss'), (m2, a2, 'moss');

  -- 1) Cuentas separadas: borra Ascent (a).
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.eliminar_cuenta();
  r := r || jsonb_build_object('1_separadas_borra_ascent', jsonb_build_object(
    'ascent_borrada', not exists (select 1 from auth.users where id = a),
    'moss_usuario_sigue', exists (select 1 from auth.users where id = m),
    'moss_perfil_sigue', exists (select 1 from moss.perfiles where usuario = m),
    'moss_peso_sigue', exists (select 1 from moss.pesos where usuario = m),
    'vinculo_cortado', not exists (select 1 from moss.vinculo where moss = m)));

  -- 2) Cuentas separadas: borra Moss (m2), como moss-borrar-cuenta con un usuario solo de Apple.
  perform moss.borrar_cuenta(m2);
  delete from auth.users where id = m2;
  r := r || jsonb_build_object('2_separadas_borra_moss', jsonb_build_object(
    'moss_borrada', not exists (select 1 from auth.users where id = m2) and not exists (select 1 from moss.perfiles where usuario = m2),
    'ascent_usuario_sigue', exists (select 1 from auth.users where id = a2),
    'ascent_perfil_sigue', exists (select 1 from public.profiles where id = a2 and username = 'pruebaborradoc'),
    'ascent_correo_sigue', exists (select 1 from auth.identities where user_id = a2 and provider = 'email'),
    'vinculo_cortado', not exists (select 1 from moss.vinculo where ascent = a2)));

  -- 3) El mismo usuario (u): borra Ascent.
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform public.eliminar_cuenta();
  r := r || jsonb_build_object('3_mismo_borra_ascent', jsonb_build_object(
    'usuario_sigue', exists (select 1 from auth.users where id = u),
    'moss_perfil_sigue', exists (select 1 from moss.perfiles where usuario = u),
    'moss_peso_sigue', exists (select 1 from moss.pesos where usuario = u),
    'apple_sigue', exists (select 1 from auth.identities where user_id = u and provider = 'apple'),
    'ascent_sin_nombre', exists (select 1 from public.profiles where id = u and username is null),
    'correo_quitado', not exists (select 1 from auth.identities where user_id = u and provider = 'email'),
    'sin_contrasena', (select encrypted_password is null from auth.users where id = u)));

  -- 4) El mismo usuario (u2): borra Moss. moss-borrar-cuenta ve correo y Apple: borra lo de Moss y le quita Apple.
  perform moss.borrar_cuenta(u2);
  delete from auth.identities where user_id = u2 and provider = 'apple';
  r := r || jsonb_build_object('4_mismo_borra_moss', jsonb_build_object(
    'moss_perfil_borrado', not exists (select 1 from moss.perfiles where usuario = u2),
    'moss_peso_borrado', not exists (select 1 from moss.pesos where usuario = u2),
    'usuario_sigue', exists (select 1 from auth.users where id = u2),
    'ascent_perfil_sigue', exists (select 1 from public.profiles where id = u2 and username = 'pruebaborradof'),
    'correo_sigue', exists (select 1 from auth.identities where user_id = u2 and provider = 'email'),
    'apple_quitada', not exists (select 1 from auth.identities where user_id = u2 and provider = 'apple')));

  raise exception 'RESULTADO %', r::text;
end
$prueba$;
