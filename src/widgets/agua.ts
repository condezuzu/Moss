// El widget del agua (spec/widgets.md, D43): una entrada por día, y lo tocado queda en ella hasta abrir Moss.

import type { Estado } from '@/almacen/almacen';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { aguaDelDia, vigentes } from '@/dominio/registros';
import { comienzoDe, DIAS_ARMADOS, DIAS_QUE_ESPERA } from './cielo';
import type { PropsAgua } from './tipos';

export const VASO_ML = 250;
type Entrada = { date: Date; props: PropsAgua };

export function lineaDelAgua(e: Pick<Estado, 'hoy' | 'agua'> & Partial<Pick<Estado, 'corte'>>, d: { meta: number; textos: PropsAgua['textos']; url: string; fondo?: string }): Entrada[] {
  const entradas: Entrada[] = [];
  for (let k = 0; k < DIAS_ARMADOS; k++) {
    const dia = sumarDias(e.hoy, k);
    entradas.push({
      date: comienzoDe(dia, e.corte),
      props: { dia, ml: aguaDelDia(e.agua.values(), dia), meta: d.meta, vasos: 0, en: 0, textos: d.textos, url: d.url, fondo: d.fondo ?? '' },
    });
  }
  return entradas;
}

export type ToqueDelAgua = { dia: ClaveDia; vasos: number; en: number };

/** Los vasos tocados en cada día, de toda la línea. */
export function toquesDelAgua(linea: { props: unknown }[]): ToqueDelAgua[] {
  const toques: ToqueDelAgua[] = [];
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsAgua>;
    if (typeof p.dia === 'string' && typeof p.vasos === 'number' && p.vasos !== 0 && typeof p.en === 'number') toques.push({ dia: p.dia, vasos: p.vasos, en: p.en });
  }
  return toques;
}

/**
 * Qué hacer con cada toque: sumar los vasos, con la hora del toque, o sacar las últimas tomas de ese
 * día. Lo que ya se sumó con esa hora no se repite (la línea pudo no llegar a escribirse).
 */
export function repartirAgua(toques: readonly ToqueDelAgua[], e: Pick<Estado, 'hoy' | 'agua'>): { sumar: { dia: ClaveDia; ml: number; en: number }[]; quitar: string[] } {
  const r: { sumar: { dia: ClaveDia; ml: number; en: number }[]; quitar: string[] } = { sumar: [], quitar: [] };
  const desde = sumarDias(e.hoy, -DIAS_QUE_ESPERA);
  const tomas = vigentes(e.agua.values());
  for (const t of toques) {
    if (t.dia > e.hoy || t.dia < desde) continue;
    const delDia = tomas.filter((x) => x.dia === t.dia).sort((a, b) => Date.parse(b.momento) - Date.parse(a.momento));
    if (t.vasos > 0) {
      if (!delDia.some((x) => Math.abs(Date.parse(x.momento) - t.en) < 1000)) r.sumar.push({ dia: t.dia, ml: t.vasos * VASO_ML, en: t.en });
      continue;
    }
    let falta = -t.vasos * VASO_ML;
    for (const x of delDia) {
      if (falta <= 0) break;
      r.quitar.push(x.id);
      falta -= x.ml;
    }
  }
  return r;
}
