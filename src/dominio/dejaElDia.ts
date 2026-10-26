// Cómo deja el día lo que estás por sumar (spec/nutricion.md, «La ventana del alimento»): cuánto
// de cada macro tenías y cuánto tendrías, contra la meta. Sin frases: decían lo que las barras ya
// muestran («con esto llegas al 5 % de tus grasas»).

import type { Macros } from './metas';

export type Macro = 'proteina' | 'carbohidratos' | 'grasas';
export const MACROS: readonly Macro[] = ['proteina', 'carbohidratos', 'grasas'];

/** Cada macro como parte de su meta (1 es la meta entera), antes y después de sumarlo. */
export type ComoDeja = { barras: Record<Macro, { antes: number; despues: number }> };

export function comoDejaElDia(antes: Macros, esto: Macros, meta: Macros): ComoDeja {
  const barras = {} as ComoDeja['barras'];
  for (const m of MACROS) {
    barras[m] = meta[m] > 0 ? { antes: antes[m] / meta[m], despues: (antes[m] + esto[m]) / meta[m] } : { antes: 0, despues: 0 };
  }
  return { barras };
}
