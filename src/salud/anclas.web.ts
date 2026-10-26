// En la web no hay Atajos ni despertador (src/salud/anclas.ts): no llega nada.

import type { Senal } from '@/dominio/sinReloj';

export async function guardarSenales(): Promise<void> {}

export async function leerSenales(): Promise<Senal[]> {
  return [];
}

export function useSenales(): Senal[] | null {
  return [];
}
