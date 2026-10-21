// Las frases del día (especificación, «Contenido»): estoicos, frases modernas cortas y atribuidas,
// y propias, sin fragmentos de mitos. La lista completa es de la etapa 8; por ahora, la de la galería.

import type { Texto } from '@/datos/catalogo';
import type { ClaveDia } from '@/dominio/fechas';

export type Frase = { texto: Texto; autor: Texto };

export const FRASES: Frase[] = [
  {
    texto: { es: 'Nada grande nace de golpe, ni siquiera un racimo de uvas o un higo.', en: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.' },
    autor: { es: 'Epicteto · Disertaciones I.15', en: 'Epictetus · Discourses I.15' },
  },
];

/** Una por día, y siempre la misma ese día. */
export function fraseDelDia(clave: ClaveDia): Frase {
  let h = 0;
  for (let i = 0; i < clave.length; i++) h = (h * 31 + clave.charCodeAt(i)) >>> 0;
  return FRASES[h % FRASES.length];
}
