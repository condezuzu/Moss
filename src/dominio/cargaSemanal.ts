// La carga de la semana por músculo (spec/ascent.md, «Tu semana»): las series duras de esta semana, de lunes a
// domingo, contra un rango, con lo que todavía pone la rutina de Ascent en los días que quedan. Y la línea que dice
// qué hacer con eso hoy.

import type { DiaSemana } from './fechas';
import { MUSCULOS, type Musculo } from './musculos';

/**
 * De 10 a 20 series duras por músculo y por semana. Es una convención: la fuerza y el músculo suben con el volumen
 * cada vez menos (Pelland 2026), y es el rango que usan casi todas las guías.
 */
export const RANGO_SEMANAL = { desde: 10, hasta: 20 } as const;

export type EstadoDeCarga = 'poco' | 'enCamino' | 'enRango' | 'mucho';
export type CargaDelMusculo = { musculo: Musculo; hechas: number; previstas: number; estado: EstadoDeCarga };

/** Un día que queda de la rutina: su día de la semana (0 es el domingo) y las series de cada músculo principal. */
export type DiaQueQueda = { dia: DiaSemana; series: Partial<Record<Musculo, number>> };

export type LineaDeLaSemana =
  | { que: 'dale'; musculos: { musculo: Musculo; hechas: number }[] }
  | { que: 'retomar'; musculo: Musculo; dia: DiaSemana }
  | { que: 'proxima'; musculo: Musculo }
  | { que: 'mucho'; musculo: Musculo }
  | { que: 'enRango' };

/** Lunes 0 … domingo 6. */
export const enLaSemana = (d: DiaSemana) => (d + 6) % 7;

export function estadoDeCarga(hechas: number, previstas: number): EstadoDeCarga {
  if (hechas > RANGO_SEMANAL.hasta) return 'mucho';
  if (hechas >= RANGO_SEMANAL.desde) return 'enRango';
  return hechas + previstas >= RANGO_SEMANAL.desde ? 'enCamino' : 'poco';
}

/**
 * Cada músculo con algo hecho o previsto esta semana, en el orden de MUSCULOS. `quedan` son los días de la rutina
 * que faltan, hoy incluido si todavía no entrenaste.
 */
export function cargaDeLaSemana(hechas: ReadonlyMap<Musculo, number>, quedan: readonly DiaQueQueda[]): CargaDelMusculo[] {
  return MUSCULOS.flatMap((musculo) => {
    const h = hechas.get(musculo) ?? 0;
    const p = quedan.reduce((s, d) => s + (d.series[musculo] ?? 0), 0);
    return h || p ? [{ musculo, hechas: h, previstas: p, estado: estadoDeCarga(h, p) }] : [];
  });
}

/**
 * La línea de la semana, la primera que aplique: antes de entrenar, a qué darle más hoy (los dos de la sesión que
 * más lejos están de 10); si no, el músculo que quedó corto y cuándo vuelve (o que la semana que viene empiece por
 * ahí); si no, el que se pasó de 20; si no, que va en rango.
 */
export function lineaDeLaSemana(p: { carga: readonly CargaDelMusculo[]; deHoy: readonly Musculo[] | null; hoy: DiaSemana; quedan: readonly DiaQueQueda[] }): LineaDeLaSemana {
  const falta = (c: CargaDelMusculo) => RANGO_SEMANAL.desde - c.hechas;
  if (p.deHoy) {
    const dale = p.carga.filter((c) => p.deHoy!.includes(c.musculo) && (c.estado === 'poco' || c.estado === 'enCamino')).sort((a, b) => falta(b) - falta(a)).slice(0, 2);
    if (dale.length) return { que: 'dale', musculos: dale.map((c) => ({ musculo: c.musculo, hechas: c.hechas })) };
  }
  const cortos = p.carga.filter((c) => c.estado === 'poco').sort((a, b) => falta(b) - falta(a));
  // Los días que vuelven son los que siguen a hoy: lo de hoy ya está contado (o es la sesión de «dale»).
  const despues = p.quedan.filter((d) => enLaSemana(d.dia) > enLaSemana(p.hoy));
  for (const c of cortos) {
    const vuelve = despues.find((d) => (d.series[c.musculo] ?? 0) > 0);
    if (vuelve) return { que: 'retomar', musculo: c.musculo, dia: vuelve.dia };
  }
  if (cortos.length) return { que: 'proxima', musculo: cortos[0].musculo };
  const mucho = p.carga.filter((c) => c.estado === 'mucho').sort((a, b) => b.hechas - a.hechas)[0];
  if (mucho) return { que: 'mucho', musculo: mucho.musculo };
  return { que: 'enRango' };
}
