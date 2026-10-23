// Borrar la cuenta en el servidor (spec/revision.md, 5.1.1(v)): si la cuenta usa Sign in with
// Apple, la persona confirma con Apple y el código nuevo va a la función `moss-borrar-cuenta`, que
// revoca la autorización de Apple y recién después borra. Sin el teléfono ni Supabase, para probarlo:
// cuenta.ts le pasa los pasos de verdad.

/** Lo que importa del usuario de la sesión (`session.user` de supabase-js). */
export type UsuarioDeLaSesion = {
  app_metadata?: { provider?: string; providers?: string[] } | null;
  identities?: { provider: string }[] | null;
};

export type PasosParaBorrar = {
  /** Un código de autorización nuevo de Apple (vale cinco minutos), o null si la persona cancela o falla. */
  codigoDeApple: () => Promise<string | null>;
  /** La función `moss-borrar-cuenta`: null si borró, o el estado HTTP con que falló (0 si no hubo respuesta). */
  funcion: (codigoDeApple: string | undefined) => Promise<number | null>;
  /** `moss.borrar_cuenta()`, la de antes, que no revoca Apple: true si borró. */
  sinRevocar: () => Promise<boolean>;
};

/** Si la cuenta usa Sign in with Apple: se creó con Apple, lo tiene vinculado o tiene esa identidad. */
export function usaApple(usuario: UsuarioDeLaSesion | null | undefined): boolean {
  if (!usuario) return false;
  const { provider, providers } = usuario.app_metadata ?? {};
  return provider === 'apple' || (providers ?? []).includes('apple') || (usuario.identities ?? []).some((i) => i.provider === 'apple');
}

/**
 * Borra la cuenta en el servidor: true si quedó borrada y false si falló. Cancelar la hoja de Apple
 * no borra nada y no es un error: null, así Perfil no muestra nada.
 */
export async function borrarEnElServidor(usuario: UsuarioDeLaSesion | null | undefined, pasos: PasosParaBorrar): Promise<boolean | null> {
  let codigo: string | undefined;
  if (usaApple(usuario)) {
    const nuevo = await pasos.codigoDeApple();
    if (!nuevo) return null;
    codigo = nuevo;
  }
  const fallo = await pasos.funcion(codigo);
  if (fallo === null) return true;
  // 404 es que la función todavía no está desplegada: solo entonces se borra como antes, sin revocar
  // Apple. Sacarlo cuando esté desplegada (supabase/functions/moss-borrar-cuenta/README.md).
  return fallo === 404 ? pasos.sinRevocar() : false;
}
