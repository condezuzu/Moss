// Entrar con la cuenta de Ascent para vincular (spec/ascent.md, D27): para quien no tiene Ascent en
// este iPhone y para quien revisa en Apple. Un cliente de Supabase aparte, que no guarda la sesión ni
// la renueva: entra, vincula con ese token y sale. Moss sigue sin correo para su propia cuenta.

import 'react-native-url-polyfill/auto';

import { createClient, type AuthError } from '@supabase/supabase-js';

import { deAscent } from '@/almacen/ascent';
import type { ErrorDeVincular } from '@/lib/ascentRemoto';

export type ErrorDeEntrar = ErrorDeVincular | 'credenciales' | 'confirmar';

function errorDe(e: AuthError | null): ErrorDeEntrar {
  if (!e) return 'servidor';
  if (e.code === 'email_not_confirmed') return 'confirmar';
  if (e.code === 'invalid_credentials' || e.code === 'validation_failed' || e.status === 400) return 'credenciales';
  if (!e.status || /network|fetch/i.test(e.message)) return 'red';
  return 'servidor';
}

export async function vincularConCorreo(correo: string, clave: string): Promise<{ ok: true } | { ok: false; error: ErrorDeEntrar }> {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const llave = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !llave) return { ok: false, error: 'sin_sesion' };
  // Otra clave de almacenamiento: no se cruza con la sesión de Moss (y no la guarda igual).
  const cliente = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'moss-entrar-con-ascent' } });
  try {
    const { data, error } = await cliente.auth.signInWithPassword({ email: correo.trim(), password: clave });
    if (error || !data.session) return { ok: false, error: errorDe(error) };
    const r = await deAscent().vincular(data.session.access_token);
    return r.ok ? { ok: true } : r;
  } catch {
    return { ok: false, error: 'red' };
  } finally {
    await cliente.auth.signOut({ scope: 'local' }).catch(() => {});
  }
}
