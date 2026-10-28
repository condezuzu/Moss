// La cuenta de Moss de la entrada, en el proyecto de Supabase que comparte con Ascent: es una cuenta
// aparte de la de Ascent, aunque a veces compartan el usuario de Auth (spec/ascent.md, «Dos cuentas»). Con
// Apple (nativo, con signInWithIdToken) o con correo y contraseña. Una build sin Supabase (la web
// de prueba) sigue sin cuenta: Moss guarda todo en el teléfono.

import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import { elAlmacen } from '@/almacen';
import { nombreDeLasPartes } from '@/dominio/nombre';
import { haySupabase, supabase } from '@/lib/supabase';

/** El nombre que trae Apple, en el orden de cada idioma; sin nombre, vacío. */
function nombreDeApple(partes: AppleAuthentication.AppleAuthenticationFullName | null): string {
  if (!partes?.givenName && !partes?.familyName) return '';
  try {
    return AppleAuthentication.formatFullName({ ...partes, nickname: null, middleName: null, namePrefix: null, nameSuffix: null }) || nombreDeLasPartes(partes);
  } catch {
    return nombreDeLasPartes(partes);
  }
}

export type ErrorDeCuenta = 'credenciales' | 'conexion' | 'confirmar' | 'existe' | 'clave' | 'correo' | 'otro';
export type Resultado = { ok: true } | { ok: false; error: ErrorDeCuenta | null };

export async function hayApple(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Lo que dice Supabase, en lo que la pantalla sabe explicar. */
function errorDe(e: { code?: string; status?: number; message?: string } | null | undefined): ErrorDeCuenta {
  if (!e) return 'otro';
  if (e.code === 'invalid_credentials') return 'credenciales';
  if (e.code === 'email_not_confirmed') return 'confirmar';
  if (e.code === 'user_already_exists' || e.code === 'email_exists') return 'existe';
  if (e.code === 'weak_password') return 'clave';
  if (e.code === 'validation_failed' || e.code === 'email_address_invalid') return 'correo';
  if (e.status === 0 || /network|fetch/i.test(e.message ?? '')) return 'conexion';
  return 'otro';
}

export async function entrarConApple(): Promise<Resultado> {
  if (!haySupabase()) return { ok: true };
  try {
    // El correo y el nombre, que se ve arriba de Perfil (guía 5.1.1 de Apple: pedir solo lo que se usa).
    const credencial = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    });
    if (!credencial.identityToken) return { ok: false, error: 'otro' };
    const { error } = await supabase().auth.signInWithIdToken({ provider: 'apple', token: credencial.identityToken });
    if (error) return { ok: false, error: errorDe(error) };
    // Apple da el nombre solo la primera vez: se guarda, y si no viene, Perfil lo pide.
    elAlmacen().ponerNombre(nombreDeApple(credencial.fullName), true);
    return { ok: true };
  } catch (e) {
    // Cerrar la hoja de Apple no es un error: no se dice nada.
    if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return { ok: false, error: null };
    return { ok: false, error: 'conexion' };
  }
}

const correoValido = (correo: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());

export async function entrarConCorreo(correo: string, clave: string): Promise<Resultado> {
  if (!haySupabase()) return { ok: true };
  if (!correoValido(correo)) return { ok: false, error: 'correo' };
  try {
    const { error } = await supabase().auth.signInWithPassword({ email: correo.trim(), password: clave });
    return error ? { ok: false, error: errorDe(error) } : { ok: true };
  } catch {
    return { ok: false, error: 'conexion' };
  }
}

/** Una cuenta nueva. Si el proyecto pide confirmar el correo, no hay sesión hasta confirmarlo. */
export async function crearCuenta(correo: string, clave: string): Promise<Resultado> {
  if (!haySupabase()) return { ok: true };
  if (!correoValido(correo)) return { ok: false, error: 'correo' };
  if (clave.length < 8) return { ok: false, error: 'clave' };
  try {
    const { data, error } = await supabase().auth.signUp({ email: correo.trim(), password: clave });
    if (error) return { ok: false, error: errorDe(error) };
    return data.session ? { ok: true } : { ok: false, error: 'confirmar' };
  } catch {
    return { ok: false, error: 'conexion' };
  }
}

export async function olvideLaClave(correo: string): Promise<Resultado> {
  if (!haySupabase()) return { ok: true };
  if (!correoValido(correo)) return { ok: false, error: 'correo' };
  try {
    const { error } = await supabase().auth.resetPasswordForEmail(correo.trim());
    return error ? { ok: false, error: errorDe(error) } : { ok: true };
  } catch {
    return { ok: false, error: 'conexion' };
  }
}
