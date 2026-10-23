// Cómo deja el día lo que estás por sumar (spec/nutricion.md, «La ventana del alimento»): cuánto
// de cada macro tenías y cuánto tendrías, contra la meta, y una sola frase con lo que más cambia.
// Sin culpa: pasarse se dice como un dato, no como una falta; y la proteína no se «pasa».

import { estadoDeMacro, type Macros } from './metas';

export type Macro = 'proteina' | 'carbohidratos' | 'grasas';
export const MACROS: readonly Macro[] = ['proteina', 'carbohidratos', 'grasas'];

export type Frase =
  | { tipo: 'llegas'; macro: Macro; porcentaje: number }
  | { tipo: 'completas'; macro: Macro }
  | { tipo: 'pasas'; macro: Macro; gramos: number };

/** Cada macro como parte de su meta (1 es la meta entera), antes y después de sumarlo. */
export type ComoDeja = { barras: Record<Macro, { antes: number; despues: number }>; frase: Frase | null };

// Lo que cuenta como un cambio que vale una frase: 5 puntos de la meta.
const CAMBIO = 0.05;
// Pasarse es lo mismo que hace temblar al macro (estadoDeMacro), por algo que suma al menos 5 g.
const GRAMOS_MINIMOS = 5;

export function comoDejaElDia(antes: Macros, esto: Macros, meta: Macros): ComoDeja {
  const barras = {} as ComoDeja['barras'];
  for (const m of MACROS) {
    barras[m] = meta[m] > 0 ? { antes: antes[m] / meta[m], despues: (antes[m] + esto[m]) / meta[m] } : { antes: 0, despues: 0 };
  }
  const conMeta = MACROS.filter((m) => meta[m] > 0);
  const pasados = conMeta
    .filter((m) => m !== 'proteina' && esto[m] >= GRAMOS_MINIMOS)
    .filter((m) => estadoDeMacro(antes[m] + esto[m], meta[m]) === 'pasado' && estadoDeMacro(antes[m], meta[m]) !== 'pasado')
    .map((m) => ({ macro: m, gramos: Math.round(antes[m] + esto[m] - meta[m]) }))
    .sort((a, b) => b.gramos - a.gramos);
  if (pasados.length) return { barras, frase: { tipo: 'pasas', ...pasados[0] } };
  // La proteína primero: es la que más se busca completar.
  const completa = conMeta.find((m) => barras[m].antes < 1 && barras[m].despues >= 1);
  if (completa) return { barras, frase: { tipo: 'completas', macro: completa } };
  // Lo que ya pasó la meta no se vuelve a decir.
  const subidas = conMeta.filter((m) => barras[m].antes < 1 && barras[m].despues - barras[m].antes >= CAMBIO);
  if (!subidas.length) return { barras, frase: null };
  const macro = subidas.includes('proteina') ? 'proteina' : subidas.sort((a, b) => (barras[b].despues - barras[b].antes) - (barras[a].despues - barras[a].antes))[0];
  return { barras, frase: { tipo: 'llegas', macro, porcentaje: Math.round(barras[macro].despues * 100) } };
}
