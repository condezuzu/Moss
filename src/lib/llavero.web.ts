// En la web no hay llavero compartido: no hay sesión de Ascent que leer ni dónde dejar la de Moss.
// Se vincula con la cuenta de Ascent (correo y contraseña), como sin Ascent en el teléfono.

import type { SesionCompartida } from './sesionCompartida';

export { leerSesion, vigente, type App, type SesionCompartida } from './sesionCompartida';

export async function sesionDeAscent(): Promise<SesionCompartida | null> {
  return null;
}

export function dejarMiSesion(_s: Omit<SesionCompartida, 'v' | 'app'>): void {}

export async function borrarMiSesion(): Promise<void> {}
