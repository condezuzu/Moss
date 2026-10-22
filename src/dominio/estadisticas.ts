// Las estadísticas de Hábitos («Tu mes»): cuántos días completos y con luz tuvo un mes, la racha de
// días seguidos con luz y cuánto se cumplió cada hábito. Salen de los días resumidos (dias.ts), que
// guardan qué hábitos tocaban y cuáles se hicieron, aunque después los hábitos cambien.

import type { Dia } from './dias';
import { sumarDias, type ClaveDia } from './fechas';

const clave = (anio: number, mes: number, dia: number): ClaveDia => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Los días de un mes (mes de 0 a 11), con su clave. */
export function diasDelMes(anio: number, mes: number): ClaveDia[] {
  const cuantos = new Date(anio, mes + 1, 0).getDate();
  return Array.from({ length: cuantos }, (_, i) => clave(anio, mes, i + 1));
}

export type ResumenDelMes = { completos: number; conLuz: number; conHabitos: number };

/** Del mes, hasta hoy: los días con todo hecho, los que tuvieron algo y los que tenían hábitos. */
export function resumenDelMes(dias: ReadonlyMap<ClaveDia, Dia>, anio: number, mes: number, hoy: ClaveDia): ResumenDelMes {
  const r: ResumenDelMes = { completos: 0, conLuz: 0, conHabitos: 0 };
  for (const c of diasDelMes(anio, mes)) {
    const d = dias.get(c);
    if (c > hoy || !d || !d.habitos.length) continue;
    r.conHabitos++;
    if (d.hechos.length) r.conLuz++;
    if (d.completo) r.completos++;
  }
  return r;
}

/**
 * Los días seguidos con algo hecho, hasta hoy. Si hoy todavía no tiene nada, la racha sigue viva y
 * se cuenta hasta ayer: el día no terminó.
 */
export function racha(dias: ReadonlyMap<ClaveDia, Dia>, hoy: ClaveDia): number {
  const conLuz = (c: ClaveDia) => (dias.get(c)?.hechos.length ?? 0) > 0;
  let c = conLuz(hoy) ? hoy : sumarDias(hoy, -1);
  let n = 0;
  while (conLuz(c)) {
    n++;
    c = sumarDias(c, -1);
  }
  return n;
}

/** Cuántas veces se hizo un hábito de las que tocaba, en los últimos `cuantos` días hasta hoy. */
export function cumplimiento(habito: string, dias: ReadonlyMap<ClaveDia, Dia>, hoy: ClaveDia, cuantos = 30): { hechos: number; total: number } {
  let hechos = 0;
  let total = 0;
  for (let i = 0; i < cuantos; i++) {
    const d = dias.get(sumarDias(hoy, -i));
    if (!d || !d.habitos.includes(habito)) continue;
    total++;
    if (d.hechos.includes(habito)) hechos++;
  }
  return { hechos, total };
}
