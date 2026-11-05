// Cómo llegas a entrenar hoy (spec/ascent.md, «Ascent en Progreso», para aprobar), con Ascent vinculada.
// Revisado con la evidencia el 5/11/2026 (spec/rendimiento.md, «Lo que cambió»): ningún puntaje compuesto de
// «recuperación» está validado contra el rendimiento (Doherty 2025), y la suma compensa (con noches de 4 h 30
// a 6 h, el 97 % de las combinaciones daba «Bien» o «Muy bien»). Lo que se propone ahora:
// - el titular del día, sin porcentaje, con la regla del eslabón más débil: el primer caso que se cumple
//   manda y nada lo compensa (titularDeHoy);
// - debajo, tres filas con sus datos: el sueño, los músculos de hoy y la comida.
// El número de antes («Estás 87 % recuperado», recuperado()) queda hasta que decidas, con la comida sin
// anotar fuera de la cuenta. En la app lo va a calcular moss.recuperacion(fecha) con estas reglas, así
// Ascent muestra lo mismo.

import { calidadParaRecuperar } from './entrenamiento';
import type { EstadoMuscular } from './musculos';
import { suenoCorto, type Noche } from './rendimiento';

// ------------------------------------------------------------ el titular

export type QueTitular = 'hecha' | 'descanso' | 'sinHorario' | 'faltaNoche' | 'cargado' | 'suenoCorto' | 'teSientes' | 'casi' | 'listo';
/** Lo que pone el límite hoy: lleva el único color de la sección. */
export type Limita = 'sueno' | 'musculos' | 'teSientes' | null;
export type Titular = { que: QueTitular; limita: Limita };

/** «¿Cómo te sientes para entrenar?», de 0 a 10: 4 o menos es la mitad de abajo de la escala de Laurent 2011 (convención). */
export const TE_SIENTES_BAJO = 4;

/**
 * El titular de hoy. Sigue la regla del eslabón más débil, y el orden pone primero lo que hoy cambia la
 * sesión:
 * - la sesión de hoy ya está anotada: «hecha»; sin sesión, «descanso» (o, si no se sabe cuándo entrenas,
 *   «sinHorario»);
 * - sin la noche, «faltaNoche»;
 * - lo que entrenas hoy, cargado: «cargado» (más liviano u otra cosa);
 * - la noche corta (estadoDeLaNoche, en rendimiento.ts) o dos de las últimas tres: «suenoCorto» (sin ir
 *   al fallo);
 * - dijiste que no te sientes recuperado: «teSientes»;
 * - lo de hoy todavía se recupera: «casi» (como siempre);
 * - si no, «listo».
 */
export function titularDeHoy(x: {
  sesion: 'prevista' | 'hecha' | null;
  sabeCuandoEntrena: boolean;
  noche: Noche | null;
  ultimas3: readonly number[];
  /** El peor estado de los músculos de hoy (peorEstado de musculos.ts); null si no se sabe qué entrenas. */
  musculos: EstadoMuscular | null;
  comoTeSientes: number | null;
}): Titular {
  if (x.sesion === 'hecha') return { que: 'hecha', limita: null };
  if (!x.sesion) return { que: x.sabeCuandoEntrena ? 'descanso' : 'sinHorario', limita: null };
  if (!x.noche) return { que: 'faltaNoche', limita: null };
  if (x.musculos === 'cargado') return { que: 'cargado', limita: 'musculos' };
  if (suenoCorto(x.noche, x.ultimas3)) return { que: 'suenoCorto', limita: 'sueno' };
  if (x.comoTeSientes !== null && x.comoTeSientes <= TE_SIENTES_BAJO) return { que: 'teSientes', limita: 'teSientes' };
  if (x.musculos === 'recuperandose') return { que: 'casi', limita: null };
  return { que: 'listo', limita: null };
}

// ------------------------------------------------------------ el número de antes (hasta que decidas)

export const MAXIMOS = { sueno: 40, musculos: 40, comida: 20 } as const;
export type Parte = keyof typeof MAXIMOS;

/** Sin la calidad de la noche (ni la del reloj ni la que dijiste a la mañana) cuenta como regular: el sueño llega a 30. */
export const CALIDAD_SIN_DATO = 50;

/** Las cuatro franjas, de peor a mejor: las mismas en el total y en cada parte. Solo «atención» lleva color. */
export type Banda = 'atencion' | 'aceptable' | 'bien' | 'muyBien';
export const BANDAS: readonly Banda[] = ['atencion', 'aceptable', 'bien', 'muyBien'];

/**
 * Dónde empieza y termina cada franja, de peor a mejor: el total, el sueño (de 40), la comida (de 20) y la
 * fatiga muscular (en %, al revés: menos es mejor). Son las de Oura, prestadas (convención).
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

/**
 * La comida de ayer, de 20: 10 por la proteína contra la meta y 10 por haber comido al menos el 80 % de las
 * calorías. Sin nada anotado, null: que no haya registro no quiere decir que no comiste.
 */
export function comidaParaRecuperar(c: { proteinaAyer: number | null; metaProteina: number; kcalAyer: number | null; metaKcal: number }) {
  if (c.proteinaAyer === null || c.kcalAyer === null || c.kcalAyer <= 0) return null;
  const proteina = 10 * Math.min(1, c.proteinaAyer / c.metaProteina);
  const calorias = 10 * Math.min(1, c.kcalAyer / (0.8 * c.metaKcal));
  return { puntos: Math.round(proteina + calorias), proteina, calorias };
}

export type Recuperado = {
  total: number;
  banda: Banda;
  /** La comida, null sin nada anotado ayer: entonces el total sale del sueño y los músculos, sobre 80. */
  partes: { sueno: number; musculos: number; comida: number | null };
  /** La franja de cada parte; la de los músculos sale de la fatiga. */
  bandas: { sueno: Banda; fatiga: Banda; comida: Banda | null };
  /** La fatiga muscular, en % (0 a 100; menos es mejor). */
  fatiga: number;
  /** Si la noche tiene calidad (del reloj o de la mañana): sin ella, el sueño no pasa de 30. */
  conCalidad: boolean;
  /** Antes de entrenar: muy bien, fuerte; bien o aceptable, normal; atención, suave. */
  conviene: 'fuerte' | 'normal' | 'suave';
  /** La parte que más lejos está de su máximo (en proporción); en un empate, el sueño y después la comida. */
  loQueMasFalta: Parte;
};

/** El número de antes: el sueño de anoche, la fatiga de los músculos de hoy y la comida de ayer. */
export function recuperado(d: {
  dormido: number;
  necesidad: number;
  /** La calidad del reloj, de 0 a 100, y cómo dijiste que dormiste, de 1 a 5. */
  calidad: number | null;
  sentida: number | null;
  /** La fatiga muscular de hoy, en % (fatiga.ts). */
  fatiga: number;
  /** Lo de ayer; null sin nada anotado. */
  proteinaAyer: number | null;
  metaProteina: number;
  kcalAyer: number | null;
  metaKcal: number;
}): Recuperado {
  const sueno = suenoParaRecuperar(d);
  const comida = comidaParaRecuperar(d);
  const partes = { sueno: sueno.puntos, musculos: musculosParaRecuperar(d.fatiga), comida: comida ? comida.puntos : null };
  // Sin la comida, lo que hay se lleva a 100: un dato que falta no es un dato malo.
  const total = partes.comida === null ? Math.round(((partes.sueno + partes.musculos) / (MAXIMOS.sueno + MAXIMOS.musculos)) * 100) : partes.sueno + partes.musculos + partes.comida;
  const banda = bandaDe(total, 'total');
  const orden: Parte[] = partes.comida === null ? ['sueno', 'musculos'] : ['sueno', 'comida', 'musculos'];
  const proporcion = (p: Parte) => (partes[p] ?? MAXIMOS[p]) / MAXIMOS[p];
  const loQueMasFalta = orden.reduce((a, b) => (proporcion(b) < proporcion(a) ? b : a));
  return {
    total, banda, partes,
    bandas: { sueno: bandaDe(partes.sueno, 'sueno'), fatiga: bandaDe(d.fatiga, 'fatiga'), comida: partes.comida === null ? null : bandaDe(partes.comida, 'comida') },
    fatiga: Math.round(d.fatiga),
    conCalidad: sueno.conCalidad,
    conviene: banda === 'muyBien' ? 'fuerte' : banda === 'atencion' ? 'suave' : 'normal',
    loQueMasFalta,
  };
}
