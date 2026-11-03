// Los recordatorios para anotar (spec/plan.md, etapa 12: suaves y opcionales, a la hora de
// siempre). Cada comida elegida avisa un rato después de su hora habitual, y solo si ese día todavía
// no se anotó. Se programan los de la semana cada vez que se abre Moss o se anota algo: si no se
// abre en una semana, paran solos.

import { HORA_TIPICA, type Comida } from './comidas';
import { minutosEnElDia, sumarDias, type ClaveDia } from './fechas';
import type { Registro } from './registros';

/** Cuánto después de la hora habitual: da tiempo a comer antes del aviso. */
export const DESPUES_MIN = 45;
export const DIAS = 7;

/** Lo de la madrugada, hasta las 5, en una comida de la noche es de la noche anterior: una cena a las 0:20 es tarde, no temprano. */
const MADRUGADA = 5 * 60;
const DIA = 24 * 60;

/**
 * La hora habitual de una comida, en minutos desde la medianoche: la mediana de cuándo se anotó en
 * los días que se dan; sin datos, la típica. Con `deNoche` (la cena, la merienda), lo de la
 * madrugada cuenta como más tarde, y si la mediana pasa de la medianoche queda en las 23:59.
 */
export function horaHabitual(minutosAnotados: number[], tipica: number, deNoche = false): number {
  if (!minutosAnotados.length) return tipica;
  const orden = minutosAnotados.map((m) => (deNoche && m < MADRUGADA ? m + DIA : m)).sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  const mediana = orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
  return Math.min(DIA - 1, mediana);
}

/** Cuántos días se miran para la hora de siempre. */
const DIAS_DE_SIEMPRE = 21;

/**
 * La hora de siempre de cada comida: la mediana de cuándo se anotó en las últimas tres semanas (sin
 * hoy ni lo planificado), en la cuenta de su día (D32: la cena de las 0:30 es tarde); sin datos, la
 * típica, y el snack, las 16. La usan los avisos, la línea de Comida y lo que corre al comer.
 */
export function horasDeSiempre(registros: Iterable<Registro>, hoy: ClaveDia): (c: Comida) => number {
  const desde = sumarDias(hoy, -DIAS_DE_SIEMPRE);
  const anotadas = new Map<Comida, number[]>();
  for (const r of registros) {
    if (r.borrado || r.planificado || r.dia < desde || r.dia >= hoy) continue;
    const minutos = minutosEnElDia(new Date(r.momento), r.dia);
    const lista = anotadas.get(r.comida);
    if (lista) lista.push(minutos);
    else anotadas.set(r.comida, [minutos]);
  }
  return (c) => horaHabitual(anotadas.get(c) ?? [], c === 'snack' ? 16 * 60 : HORA_TIPICA[c], c === 'cena' || c === 'merienda');
}

export type Recordatorio = { dia: ClaveDia; comida: Comida; minutos: number };

/** Los avisos de hoy y los próximos días, sin los que ya pasaron ni los de lo que hoy ya se anotó. */
export function recordatoriosDeLaSemana(op: {
  hoy: ClaveDia;
  /** Los minutos de ahora, desde la medianoche. */
  ahora: number;
  comidas: readonly Comida[];
  hora: (c: Comida) => number;
  anotadasHoy: ReadonlySet<Comida>;
}): Recordatorio[] {
  const lista: Recordatorio[] = [];
  for (let d = 0; d < DIAS; d++) {
    const dia = sumarDias(op.hoy, d);
    for (const comida of op.comidas) {
      const minutos = Math.min(23 * 60 + 30, op.hora(comida) + DESPUES_MIN);
      if (d === 0 && (minutos <= op.ahora || op.anotadasHoy.has(comida))) continue;
      lista.push({ dia, comida, minutos });
    }
  }
  return lista;
}
