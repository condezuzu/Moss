// El widget del agua (spec/widgets.md, D43): una entrada por día, y lo tocado queda en ella hasta abrir Moss.

import type { Estado } from '@/almacen/almacen';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { aguaDelDia, type TomaDeAgua } from '@/dominio/registros';
import { comienzoDe, DIAS_ARMADOS, DIAS_QUE_ESPERA } from './cielo';
import type { PropsAgua, ToqueDeAgua } from './tipos';

export const VASO_ML = 250;
type Entrada = { date: Date; props: PropsAgua };

export function lineaDelAgua(e: Pick<Estado, 'hoy' | 'agua'> & Partial<Pick<Estado, 'corte'>>, d: { meta: number; textos: PropsAgua['textos']; url: string; fondo?: string }): Entrada[] {
  const entradas: Entrada[] = [];
  for (let k = 0; k < DIAS_ARMADOS; k++) {
    const dia = sumarDias(e.hoy, k);
    entradas.push({
      date: comienzoDe(dia, e.corte),
      props: { dia, ml: aguaDelDia(e.agua.values(), dia), meta: d.meta, pendientes: [], textos: d.textos, url: d.url, fondo: d.fondo ?? '' },
    });
  }
  return entradas;
}

export type ToqueDelAgua = ToqueDeAgua & { dia: ClaveDia };

/** Los toques de cada día, de toda la línea: cada uno es un vaso más o uno menos. */
export function toquesDelAgua(linea: { props: unknown }[]): ToqueDelAgua[] {
  const toques: ToqueDelAgua[] = [];
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsAgua>;
    if (typeof p.dia !== 'string' || !Array.isArray(p.pendientes)) continue;
    for (const t of p.pendientes) {
      if (t && typeof t.vasos === 'number' && t.vasos !== 0 && typeof t.en === 'number' && Number.isFinite(t.en)) toques.push({ dia: p.dia, vasos: Math.sign(t.vasos), en: t.en });
    }
  }
  return toques;
}

/**
 * Qué hacer con lo tocado, día por día y en el orden de los toques: cada «+» es un vaso a la hora del
 * toque; cada «−» saca el último vaso que había a esa hora, una toma o uno tocado antes (y entonces no
 * se suma ninguno de los dos). Aplicar dos veces la misma línea no hace nada más: lo sumado tiene su
 * toma a la hora del toque, y lo que sacó un «−» quedó borrado después del toque.
 */
export function repartirAgua(toques: readonly ToqueDelAgua[], e: Pick<Estado, 'hoy' | 'agua'>): { sumar: { dia: ClaveDia; ml: number; en: number }[]; quitar: string[] } {
  const r: { sumar: { dia: ClaveDia; ml: number; en: number }[]; quitar: string[] } = { sumar: [], quitar: [] };
  const desde = sumarDias(e.hoy, -DIAS_QUE_ESPERA);
  const dias = new Set(toques.map((t) => t.dia).filter((dia) => dia <= e.hoy && dia >= desde));
  for (const dia of dias) {
    // Los vasos de ese día, cada uno desde su hora: las tomas (una borrada, hasta que se borró) y lo tocado.
    type Vaso = { en: number; hasta: number; toma?: TomaDeAgua };
    const vasos: Vaso[] = [...e.agua.values()]
      .filter((x) => x.dia === dia)
      .map((x) => ({ en: Date.parse(x.momento), hasta: x.borrado ? Date.parse(x.actualizado) : Infinity, toma: x }));
    const sacados = new Set<Vaso>();
    for (const t of toques.filter((x) => x.dia === dia).sort((a, b) => a.en - b.en)) {
      if (t.vasos > 0) {
        if (!vasos.some((v) => v.toma && v.en === t.en)) vasos.push({ en: t.en, hasta: Infinity });
        continue;
      }
      const ultimo = vasos.filter((v) => v.en < t.en && v.hasta >= t.en && !sacados.has(v)).sort((a, b) => b.en - a.en)[0];
      if (ultimo) sacados.add(ultimo);
    }
    for (const v of vasos) {
      if (!v.toma && !sacados.has(v)) r.sumar.push({ dia, ml: VASO_ML, en: v.en });
      if (v.toma && !v.toma.borrado && sacados.has(v)) r.quitar.push(v.toma.id);
    }
  }
  return r;
}
