// Los logros (especificación, «Progresión»; nombres en D6, todavía pendiente). Cuentan días
// acumulados, nunca seguidos, porque Moss no tiene rachas, y una vez ganados no se pierden.
// Los de Ascent, la comida y el sueño llegan con sus etapas.

import { diasEntre, type ClaveDia } from './fechas';
import type { Dia } from './dias';
import { LUZ_PLENA } from './luz';

export type IdDeLogro = 'primeraLuz' | 'constelacion' | 'esporas' | 'solsticio' | 'cometa' | 'lunaLlena' | 'tapiz' | 'aurora' | 'viaLactea';
export type Logro = { id: IdDeLogro; desde: ClaveDia };

export type Historial = { diasConLuz: number; diasCompletos: number; mejorLuz: number; luzTotal: number; volvio: boolean };

/** «Volver» es encender algo después de al menos una semana entera sin luz. */
const SEMANA_SIN_LUZ = 7;

export function historial(dias: Iterable<Dia>): Historial {
  const conLuz: ClaveDia[] = [];
  let diasCompletos = 0;
  let mejorLuz = 0;
  let luzTotal = 0;
  for (const d of dias) {
    if (d.luz > 0) conLuz.push(d.clave);
    if (d.completo) diasCompletos++;
    mejorLuz = Math.max(mejorLuz, d.luz);
    luzTotal += d.luz;
  }
  conLuz.sort();
  const volvio = conLuz.some((clave, i) => i > 0 && diasEntre(conLuz[i - 1], clave) > SEMANA_SIN_LUZ);
  return { diasConLuz: conLuz.length, diasCompletos, mejorLuz, luzTotal, volvio };
}

export const LOGROS: { id: IdDeLogro; cumple: (h: Historial) => boolean }[] = [
  { id: 'primeraLuz', cumple: (h) => h.diasConLuz >= 1 },
  { id: 'constelacion', cumple: (h) => h.diasCompletos >= 1 },
  { id: 'esporas', cumple: (h) => h.diasConLuz >= 7 },
  // El día más largo: 8 hábitos en un mismo día.
  { id: 'solsticio', cumple: (h) => h.mejorLuz >= 10 },
  { id: 'cometa', cumple: (h) => h.volvio },
  // Un ciclo lunar dura 29,5 días.
  { id: 'lunaLlena', cumple: (h) => h.diasCompletos >= 30 },
  { id: 'tapiz', cumple: (h) => h.diasConLuz >= 100 },
  { id: 'aurora', cumple: (h) => h.diasCompletos >= 100 },
  { id: 'viaLactea', cumple: (h) => h.luzTotal >= LUZ_PLENA },
];

/** Los que se ganan ahora: nunca devuelve uno que ya estaba, y nunca saca ninguno. */
export function logrosNuevos(dias: Iterable<Dia>, tenidos: Logro[], hoy: ClaveDia): Logro[] {
  const h = historial(dias);
  const ya = new Set(tenidos.map((l) => l.id));
  return LOGROS.filter((l) => !ya.has(l.id) && l.cumple(h)).map((l) => ({ id: l.id, desde: hoy }));
}
