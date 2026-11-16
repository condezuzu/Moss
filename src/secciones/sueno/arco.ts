// La geometría del arco de la noche (galeria/src/sueno.js, arcoDe), sin Skia: la usan el dibujo y lo que va
// encima (las horas y el toque). La izquierda es cuando te dormiste, la derecha cuando te despertaste, y cada
// etapa va en su carril, como un hipnograma doblado. Los minutos se cuentan desde las 18 del día anterior.

import type { Noche } from '@/dominio/sueno';

/** El arco en su caja de 325 × 170, con el centro abajo al medio. */
export const ARCO = { ancho: 325, alto: 170, cx: 162.5, cy: 164 };
export const CARRILES = { despierto: { r: 141, w: 6 }, rem: { r: 132, w: 8 }, nucleo: { r: 122, w: 8 }, profundo: { r: 112, w: 8 } } as const;
/** Sin etapas, lo dormido en un solo trazo ancho. */
export const GRUESO = { r: 122, w: 18 };

export type Rango = { dormirse: [number, number]; despertar: [number, number] };
export type Escala = { desde: number; hasta: number };

/**
 * De hora en punto a hora en punto, con las noches de `lista`: cada hora queda en su lugar de una noche a otra,
 * y una noche corta se ve corta.
 */
export function escalaDelArco(n: Noche, lista: readonly (Noche | null)[], rango?: Rango | null): Escala {
  const todas = [...lista.filter((x): x is Noche => !!x), n];
  const fin = n.tramos.length ? Math.max(...n.tramos.map((t) => t.hasta)) : n.despertar;
  return {
    desde: Math.floor((Math.min(...todas.map((x) => x.dormirse), ...(rango ? [rango.dormirse[0]] : [])) - 15) / 60) * 60,
    hasta: Math.ceil((Math.max(...todas.map((x) => x.despertar), fin, ...(rango ? [rango.despertar[1]] : [])) + 15) / 60) * 60,
  };
}

/** El ángulo de un minuto, en radianes: de π (izquierda) a 2π (derecha), pasando por arriba. */
export const angulo = (e: Escala, m: number) => Math.PI + ((Math.min(e.hasta, Math.max(e.desde, m)) - e.desde) / Math.max(1, e.hasta - e.desde)) * Math.PI;

export const punto = (r: number, a: number) => ({ x: ARCO.cx + r * Math.cos(a), y: ARCO.cy + r * Math.sin(a) });

/** Las horas alrededor: una marca por hora y el número cada dos, salvo pegado a los extremos. */
export function horasDelArco(e: Escala): { a: number; larga: boolean; texto: string | null; x: number; y: number }[] {
  const horas = [];
  for (let m = Math.ceil(e.desde / 60) * 60; m <= e.hasta; m += 60) {
    const a = angulo(e, m);
    const borde = Math.min(a - Math.PI, 2 * Math.PI - a);
    if (borde < 0.05) continue;
    const hora = (18 + m / 60) % 24;
    const larga = hora % 2 === 0;
    const r = 153 + 6 * Math.abs(Math.cos(a));
    horas.push({ a, larga, texto: larga && borde > 0.24 ? String(hora).padStart(2, '0') : null, x: ARCO.cx + r * Math.cos(a), y: ARCO.cy + r * Math.sin(a) });
  }
  return horas;
}

/** Qué tramo hay en un punto del arco (en la caja de 325 × 170): se busca por la hora, no por el trazo. */
export function tramoEn(x: number, y: number, e: Escala, n: Noche): number {
  const dx = x - ARCO.cx;
  const dy = y - ARCO.cy;
  const lejos = Math.hypot(dx, dy);
  // Solo en la corona de los carriles: el medio y lo de afuera no leen nada.
  if (dy > 0 || lejos < 100 || lejos > 152) return -1;
  const a = Math.atan2(dy, dx) + 2 * Math.PI;
  const m = e.desde + ((a - Math.PI) / Math.PI) * (e.hasta - e.desde);
  return n.tramos.findIndex((t) => m >= t.desde && m <= t.hasta);
}

/** Unas pocas estrellas adentro, siempre las mismas. */
export function estrellasDelArco(): { x: number; y: number; r: number; a: number }[] {
  let s = 7;
  const azar = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: 16 }, () => {
    const a = Math.PI + 0.12 + azar() * (Math.PI - 0.24);
    const dist = 62 + azar() * 38;
    return { x: ARCO.cx + dist * Math.cos(a), y: ARCO.cy + dist * Math.sin(a), r: 0.5 + azar() * 0.55, a: 0.25 + azar() * 0.45 };
  });
}
