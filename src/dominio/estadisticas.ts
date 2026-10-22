// Las estadísticas de Hábitos («Tu mes»): cuántos días completos y con luz tuvo un mes, la luz que
// juntó y cuánto se cumplió cada hábito. Salen de los días resumidos (dias.ts), que guardan qué
// hábitos tocaban y cuáles se hicieron, aunque después los hábitos cambien. Sin rachas: todo suma, y
// faltar un día no le resta nada a nada (especificación, «Mecánica» 6).

import type { Dia } from './dias';
import { sumarDias, type ClaveDia } from './fechas';

const clave = (anio: number, mes: number, dia: number): ClaveDia => `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Los días de un mes (mes de 0 a 11), con su clave. */
export function diasDelMes(anio: number, mes: number): ClaveDia[] {
  const cuantos = new Date(anio, mes + 1, 0).getDate();
  return Array.from({ length: cuantos }, (_, i) => clave(anio, mes, i + 1));
}

export type ResumenDelMes = { completos: number; conLuz: number; conHabitos: number; luz: number };

/** Del mes, hasta hoy: los días con todo hecho, los que tuvieron algo, los que tenían hábitos y la luz juntada. */
export function resumenDelMes(dias: ReadonlyMap<ClaveDia, Dia>, anio: number, mes: number, hoy: ClaveDia): ResumenDelMes {
  const r: ResumenDelMes = { completos: 0, conLuz: 0, conHabitos: 0, luz: 0 };
  for (const c of diasDelMes(anio, mes)) {
    const d = dias.get(c);
    if (c > hoy || !d || !d.habitos.length) continue;
    r.conHabitos++;
    if (d.hechos.length) r.conLuz++;
    if (d.completo) r.completos++;
    r.luz += d.luz;
  }
  return r;
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
