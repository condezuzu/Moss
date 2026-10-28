// Borrar la cuenta de Moss en el servidor (spec/revision.md, 5.1.1(v)): si la cuenta usa Sign in with
// Apple, la persona confirma con Apple y el código nuevo va a la función `moss-borrar-cuenta`, que
// revoca la autorización de Apple y recién después borra todo lo de Moss (y el usuario, si es solo de
// Moss; si también es la cuenta de Ascent, le quita Apple y Ascent queda intacta). Sin el teléfono
// ni Supabase, para probarlo: cuenta.ts le pasa los pasos de verdad.

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
};

/** Si la cuenta usa Sign in with Apple: se creó con Apple, lo tiene vinculado o tiene esa identidad. */
export function usaApple(usuario: UsuarioDeLaSesion | null | undefined): boolean {
  if (!usuario) return false;
  const { provider, providers } = usuario.app_metadata ?? {};
  return provider === 'apple' || (providers ?? []).includes('apple') || (usuario.identities ?? []).some((i) => i.provider === 'apple');
}

/**
 * Si la sesión ya no es de una cuenta de Moss: Moss entra solo con Apple, así que un usuario de Auth
 * con sus identidades a la vista y ninguna de Apple es la cuenta de Ascent que quedó después de borrar
 * la de Moss desde otro teléfono. Sin las identidades no se sabe, y se sigue como siempre.
 */
export function yaNoEsDeMoss(usuario: UsuarioDeLaSesion | null | undefined): boolean {
  const identidades = usuario?.identities;
  return Array.isArray(identidades) && identidades.length > 0 && !identidades.some((i) => i.provider === 'apple');
}

/**
 * Borra la cuenta de Moss en el servidor: true si quedó borrada y false si falló. Cancelar la hoja de
 * Apple no borra nada y no es un error: null, así Perfil no muestra nada.
 */
export async function borrarEnElServidor(usuario: UsuarioDeLaSesion | null | undefined, pasos: PasosParaBorrar): Promise<boolean | null> {
  let codigo: string | undefined;
  if (usaApple(usuario)) {
    const nuevo = await pasos.codigoDeApple();
    if (!nuevo) return null;
    codigo = nuevo;
  }
  // Sin la función desplegada (404) tampoco se borra: no hay otro camino que revoque Apple y deje
  // intacta la cuenta de Ascent.
  return (await pasos.funcion(codigo)) === null;
}
