// «Estás 87 % recuperado» (spec/ascent.md, «Ascent en Progreso», para aprobar), con Ascent vinculada: tres
// partes que suman 100, el sueño de anoche (40), lo que les falta a los músculos (40) y la comida de ayer (20).
// Cuando se apruebe reemplaza a recuperacion() de entrenamiento.ts, que la app sigue usando hasta entonces; en
// la app la va a calcular moss.recuperacion(fecha) con esta misma cuenta, así Ascent muestra el mismo número.
// Es un número del día: se mira a la hora de la sesión de hoy o, sin sesión, a la mañana (como WHOOP), y
// cada parte se dice con las mismas cuatro franjas que el total (como Oura). Las constantes son una propuesta
// para calibrar con lo tuyo.

import { calidadParaRecuperar } from './entrenamiento';

export const MAXIMOS = { sueno: 40, musculos: 40, comida: 20 } as const;
export type Parte = keyof typeof MAXIMOS;

/** Sin la calidad de la noche (ni la del reloj ni la que dijiste a la mañana) cuenta como regular: el sueño llega a 30. */
export const CALIDAD_SIN_DATO = 50;

/** Las cuatro franjas, de peor a mejor: las mismas en el total y en cada parte. Solo «atención» lleva color. */
export type Banda = 'atencion' | 'aceptable' | 'bien' | 'muyBien';
export const BANDAS: readonly Banda[] = ['atencion', 'aceptable', 'bien', 'muyBien'];

/**
 * Dónde empieza y termina cada franja, de peor a mejor: el total, el sueño (de 40), la comida (de 20) y la
 * fatiga muscular (en %, al revés: menos es mejor). Muy bien desde 85, bien de 70 a 84, aceptable de 50 a
 * 69 y atención debajo; la fatiga, muy bien hasta 5 %, bien hasta 15 (baja), aceptable hasta 40 (moderada)
 * y atención con más (alta).
 */
export const LIMITES = {
  total: [0, 50, 70, 85, 100],
  sueno: [0, 18, 26, 34, 40],
  comida: [0, 9, 13, 17, 20],
  fatiga: [100, 40, 15, 5, 0],
} as const;
export type Escala = keyof typeof LIMITES;

/** La franja de un valor en su escala. En los bordes gana la mejor: 85 es muy bien; con la fatiga, 15 % es bien. */
export function bandaDe(valor: number, escala: Escala): Banda {
  const l = LIMITES[escala];
  const sube = l[4] > l[0];
  for (let k = 3; k >= 1; k--) {
    if (sube ? valor >= l[k] : valor <= l[k]) return BANDAS[k];
  }
  return 'atencion';
}

/**
 * Dónde cae un valor en una barra de cuatro tramos iguales, uno por franja, de 0 (lo peor) a 1 (lo mejor):
 * dentro de cada tramo, en proporción.
 */
export function enLaBarra(valor: number, escala: Escala): number {
  const l = LIMITES[escala];
  const sube = l[4] > l[0];
  const v = sube ? Math.min(l[4], Math.max(l[0], valor)) : Math.max(l[4], Math.min(l[0], valor));
  for (let k = 0; k < 4; k++) {
    const a = l[k], b = l[k + 1];
    const dentro = sube ? v <= b : v >= b;
    if (dentro) return (k + (v - a) / (b - a)) / 4;
  }
  return 1;
}

/** El sueño, de 40: 20 por lo dormido contra lo que necesitas (hasta 1) y 20 por la calidad (sin calidad, regular). */
export function suenoParaRecuperar(n: { dormido: number; necesidad: number; calidad: number | null; sentida: number | null }) {
  const calidad = calidadParaRecuperar(n.calidad, n.sentida);
  const porDuracion = 20 * Math.min(1, n.dormido / n.necesidad);
  const porCalidad = (20 * (calidad ?? CALIDAD_SIN_DATO)) / 100;
  return { puntos: Math.round(porDuracion + porCalidad), conCalidad: calidad !== null, calidad };
}

/** Los músculos, de 40: 40 × (1 − la fatiga). Sin fatiga, los 40. */
export const musculosParaRecuperar = (fatiga: number) => Math.round(40 * (1 - Math.min(100, Math.max(0, fatiga)) / 100));

/** La comida de ayer, de 20: 10 por la proteína contra la meta y 10 por haber comido al menos el 80 % de las calorías. */
export function comidaParaRecuperar(c: { proteinaAyer: number; metaProteina: number; kcalAyer: number; metaKcal: number }) {
  const proteina = 10 * Math.min(1, c.proteinaAyer / c.metaProteina);
  const calorias = 10 * Math.min(1, c.kcalAyer / (0.8 * c.metaKcal));
  return { puntos: Math.round(proteina + calorias), proteina, calorias };
}

export type Recuperado = {
  total: number;
  banda: Banda;
  partes: Record<Parte, number>;
  /** La franja de cada parte; la de los músculos sale de la fatiga. */
  bandas: { sueno: Banda; fatiga: Banda; comida: Banda };
  /** La fatiga muscular, en % (0 a 100; menos es mejor). */
  fatiga: number;
  /** Si la noche tiene calidad (del reloj o de la mañana): sin ella, el sueño no pasa de 30. */
  conCalidad: boolean;
  /** Antes de entrenar: muy bien, fuerte; bien o aceptable, normal; atención, suave. */
  conviene: 'fuerte' | 'normal' | 'suave';
  /** La parte que más lejos está de su máximo (en proporción); en un empate, el sueño y después la comida. */
  loQueMasFalta: Parte;
};

/** La recuperación de un día: el sueño de anoche, la fatiga de los músculos de hoy y la comida de ayer. */
export function recuperado(d: {
  dormido: number;
  necesidad: number;
  /** La calidad del reloj, de 0 a 100, y cómo dijiste que dormiste, de 1 a 5. */
  calidad: number | null;
  sentida: number | null;
  /** La fatiga muscular de hoy, en % (fatiga.ts). */
  fatiga: number;
  proteinaAyer: number;
  metaProteina: number;
  kcalAyer: number;
  metaKcal: number;
}): Recuperado {
  const sueno = suenoParaRecuperar(d);
  const partes = { sueno: sueno.puntos, musculos: musculosParaRecuperar(d.fatiga), comida: comidaParaRecuperar(d).puntos };
  const total = partes.sueno + partes.musculos + partes.comida;
  const banda = bandaDe(total, 'total');
  const orden: Parte[] = ['sueno', 'comida', 'musculos'];
  const loQueMasFalta = orden.reduce((a, b) => (partes[b] / MAXIMOS[b] < partes[a] / MAXIMOS[a] ? b : a));
  return {
    total, banda, partes,
    bandas: { sueno: bandaDe(partes.sueno, 'sueno'), fatiga: bandaDe(d.fatiga, 'fatiga'), comida: bandaDe(partes.comida, 'comida') },
    fatiga: Math.round(d.fatiga),
    conCalidad: sueno.conCalidad,
    conviene: banda === 'muyBien' ? 'fuerte' : banda === 'atencion' ? 'suave' : 'normal',
    loQueMasFalta,
  };
}
