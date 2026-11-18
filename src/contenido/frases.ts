// Las frases del día (especificación, «Contenido»; plan, etapa 11): estoicos en traducciones propias,
// frases cortas atribuidas con su fuente y propias de Moss, sin fragmentos de mitos. Los textos están
// en src/textos (`frasesDelDia`), en es y en; el orden de es.json es el de los días: los autores se turnan.

import type { Texto } from '@/datos/catalogo';
import { diasEntre, type ClaveDia } from '@/dominio/fechas';
import en from '@/textos/en.json';
import es from '@/textos/es.json';

export type Frase = { texto: Texto; autor: Texto };

type Id = keyof typeof es.frasesDelDia;

export const FRASES: Frase[] = (Object.keys(es.frasesDelDia) as Id[]).map((id) => ({
  texto: { es: es.frasesDelDia[id].texto, en: en.frasesDelDia[id].texto },
  autor: { es: es.frasesDelDia[id].autor, en: en.frasesDelDia[id].autor },
}));

/** Una por día, siempre la misma ese día, y ninguna vuelve hasta que pasaron todas. */
export function fraseDelDia(clave: ClaveDia): Frase {
  const n = FRASES.length;
  return FRASES[((diasEntre('2026-01-01', clave) % n) + n) % n];
}
