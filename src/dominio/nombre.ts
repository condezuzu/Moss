// Tu nombre, el de arriba de Perfil: lo trae Sign in with Apple la primera vez que entras, o lo
// escribes en Editar perfil. Va aparte del perfil, con su propia hora: llega antes que el
// cuestionario y cambia sin tocar lo demás. Sube a la cuenta (supabase/moss/0009_perfil.sql).

/** El nombre y la hora de su cambio. Vacío es que lo borraste: también es un cambio que viaja. */
export type Nombre = { valor: string; actualizado: string };

/** Lo más largo que guarda la cuenta, en letras. */
export const LARGO_DEL_NOMBRE = 60;

/** Sin espacios de más ni saltos de línea, y no más largo de lo que guarda la cuenta. */
export function limpiarNombre(texto: string): string {
  // Por letras y no por unidades de UTF-16: así una letra fuera del plano básico no queda partida.
  return [...texto.replace(/\s+/g, ' ').trim()].slice(0, LARGO_DEL_NOMBRE).join('').trim();
}

/** La letra del círculo cuando no hay foto: la primera del nombre, en mayúscula; sin nombre, nada. */
export function inicialDe(nombre: string): string {
  return ([...nombre.trim()][0] ?? '').toLocaleUpperCase();
}

/** Lo que trae Apple, en partes, como un nombre: el de pila y el apellido. Sin ninguno, vacío. */
export function nombreDeLasPartes(partes: { givenName?: string | null; familyName?: string | null } | null | undefined): string {
  return limpiarNombre([partes?.givenName, partes?.familyName].filter(Boolean).join(' '));
}

/** Un nombre guardado, si tiene forma: lo que no se entiende no está. */
export function leerNombre(x: unknown): Nombre | null {
  if (!x || typeof x !== 'object') return null;
  const { valor, actualizado } = x as Partial<Nombre>;
  return typeof valor === 'string' && typeof actualizado === 'string' && !Number.isNaN(Date.parse(actualizado)) ? { valor: limpiarNombre(valor), actualizado } : null;
}
