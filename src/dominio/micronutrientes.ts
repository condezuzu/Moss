// Los micronutrientes (spec/nutricion.md, «Micronutrientes»): en qué unidad van, en qué grupo se
// muestran y cuánto se recomienda por día según el sexo, la edad, el embarazo y la lactancia. Las
// referencias son las ingestas diarias recomendadas (RDA) o adecuadas (AI) de las Academias
// Nacionales de Estados Unidos, las mismas que usa USDA; de la cafeína, un tope. Sirven de guía:
// Moss no pide llegar a cada una y nunca las usa para un diagnóstico.

import type { Sexo } from './metas';

/** El mismo orden que las columnas de la base (herramientas/alimentos.mjs, MICROS). */
export const MICROS = [
  'colesterol', 'trans', 'monoinsaturadas', 'poliinsaturadas', 'potasio', 'calcio', 'hierro', 'magnesio', 'fosforo', 'zinc', 'selenio',
  'vitaminaA', 'vitaminaC', 'vitaminaD', 'vitaminaE', 'vitaminaK', 'tiamina', 'riboflavina', 'niacina', 'vitaminaB6', 'folato', 'vitaminaB12', 'cafeina',
] as const;
export type Micro = (typeof MICROS)[number];
export type Micros = Partial<Record<Micro, number>>;

export type Unidad = 'g' | 'mg' | 'µg';
export const UNIDAD: Record<Micro, Unidad> = {
  colesterol: 'mg', trans: 'g', monoinsaturadas: 'g', poliinsaturadas: 'g',
  potasio: 'mg', calcio: 'mg', hierro: 'mg', magnesio: 'mg', fosforo: 'mg', zinc: 'mg', selenio: 'µg',
  vitaminaA: 'µg', vitaminaC: 'mg', vitaminaD: 'µg', vitaminaE: 'mg', vitaminaK: 'µg',
  tiamina: 'mg', riboflavina: 'mg', niacina: 'mg', vitaminaB6: 'mg', folato: 'µg', vitaminaB12: 'µg', cafeina: 'mg',
};

/**
 * Lo máximo posible en 100 g de algo que se come, con margen: el colesterol de los sesos, el potasio
 * del crémor tártaro, la vitamina A y la D del aceite de hígado de bacalao, el selenio de la nuez de
 * Brasil, la cafeína del café instantáneo. Las grasas, hasta todas las grasas. El armado de la base
 * (herramientas/alimentos.mjs) usa los mismos.
 */
export const TOPE_POR_100G: Partial<Record<Micro, number>> = {
  colesterol: 4000, potasio: 20000, calcio: 10000, hierro: 200, magnesio: 1500, fosforo: 15000, zinc: 200, selenio: 3000,
  vitaminaA: 35000, vitaminaC: 5000, vitaminaD: 400, vitaminaE: 300, vitaminaK: 3000, tiamina: 50, riboflavina: 50, niacina: 200,
  vitaminaB6: 50, folato: 6000, vitaminaB12: 150, cafeina: 8000,
};

/** Cómo se muestran: primero las vitaminas y los minerales, después las grasas y la cafeína. */
export const GRUPOS = {
  vitaminas: ['vitaminaA', 'vitaminaC', 'vitaminaD', 'vitaminaE', 'vitaminaK', 'tiamina', 'riboflavina', 'niacina', 'vitaminaB6', 'folato', 'vitaminaB12'],
  minerales: ['calcio', 'hierro', 'magnesio', 'fosforo', 'potasio', 'zinc', 'selenio'],
  grasas: ['monoinsaturadas', 'poliinsaturadas', 'trans', 'colesterol'],
  otros: ['cafeina'],
} as const satisfies Record<string, readonly Micro[]>;

export type Etapa = 'embarazo' | 'lactancia';
export type ParaQuien = { sexo: Sexo; edad: number; etapa?: Etapa | null };

/** Cuánto por día: lo recomendado para llegar (`meta`) o lo que conviene no pasar (`tope`). */
export type Referencia = { meta: number } | { tope: number };

type PorSexo = { m: number; f: number };
// [hasta los 30, de 31 a 50, de 51 a 70, desde los 71]: las Academias cambian algunas por edad.
type PorEdad = readonly [PorSexo, PorSexo, PorSexo, PorSexo];
const igual = (s: PorSexo): PorEdad => [s, s, s, s];

const RECOMENDADO: Partial<Record<Micro, PorEdad>> = {
  calcio: [{ m: 1000, f: 1000 }, { m: 1000, f: 1000 }, { m: 1000, f: 1200 }, { m: 1200, f: 1200 }],
  hierro: [{ m: 8, f: 18 }, { m: 8, f: 18 }, { m: 8, f: 8 }, { m: 8, f: 8 }],
  magnesio: [{ m: 400, f: 310 }, { m: 420, f: 320 }, { m: 420, f: 320 }, { m: 420, f: 320 }],
  fosforo: igual({ m: 700, f: 700 }),
  potasio: igual({ m: 3400, f: 2600 }),
  zinc: igual({ m: 11, f: 8 }),
  selenio: igual({ m: 55, f: 55 }),
  vitaminaA: igual({ m: 900, f: 700 }),
  vitaminaC: igual({ m: 90, f: 75 }),
  vitaminaD: [{ m: 15, f: 15 }, { m: 15, f: 15 }, { m: 15, f: 15 }, { m: 20, f: 20 }],
  vitaminaE: igual({ m: 15, f: 15 }),
  vitaminaK: igual({ m: 120, f: 90 }),
  tiamina: igual({ m: 1.2, f: 1.1 }),
  riboflavina: igual({ m: 1.3, f: 1.1 }),
  niacina: igual({ m: 16, f: 14 }),
  vitaminaB6: [{ m: 1.3, f: 1.3 }, { m: 1.3, f: 1.3 }, { m: 1.7, f: 1.5 }, { m: 1.7, f: 1.5 }],
  folato: igual({ m: 400, f: 400 }),
  vitaminaB12: igual({ m: 2.4, f: 2.4 }),
};

// En el embarazo y la lactancia cambian algunas; el magnesio, además, con la edad.
const POR_ETAPA: Record<Etapa, Partial<Record<Micro, number>>> = {
  embarazo: { hierro: 27, potasio: 2900, zinc: 11, selenio: 60, vitaminaA: 770, vitaminaC: 85, tiamina: 1.4, riboflavina: 1.4, niacina: 18, vitaminaB6: 1.9, folato: 600, vitaminaB12: 2.6 },
  lactancia: { hierro: 9, potasio: 2800, zinc: 12, selenio: 70, vitaminaA: 1300, vitaminaC: 120, vitaminaE: 19, tiamina: 1.4, riboflavina: 1.6, niacina: 17, vitaminaB6: 2, folato: 500, vitaminaB12: 2.8 },
};
const MAGNESIO_EN_ETAPA: Record<Etapa, [number, number]> = { embarazo: [350, 360], lactancia: [310, 320] };

// La cafeína: hasta 400 mg por día en adultos; en el embarazo y la lactancia, 200 (FDA y EFSA).
const TOPE_DE_CAFEINA = 400;
const TOPE_DE_CAFEINA_EN_ETAPA = 200;

const tramo = (edad: number) => (edad <= 30 ? 0 : edad <= 50 ? 1 : edad <= 70 ? 2 : 3);

/** La referencia del día para una persona; las grasas y el colesterol no tienen una que sirva sola. */
export function referenciaDe(micro: Micro, p: ParaQuien): Referencia | null {
  const etapa = p.sexo === 'f' ? p.etapa ?? null : null;
  if (micro === 'cafeina') return { tope: etapa ? TOPE_DE_CAFEINA_EN_ETAPA : TOPE_DE_CAFEINA };
  if (etapa && micro === 'magnesio') return { meta: MAGNESIO_EN_ETAPA[etapa][p.edad <= 30 ? 0 : 1] };
  const deLaEtapa = etapa ? POR_ETAPA[etapa][micro] : undefined;
  if (deLaEtapa !== undefined) return { meta: deLaEtapa };
  const porEdad = RECOMENDADO[micro];
  return porEdad ? { meta: porEdad[tramo(p.edad)][p.sexo] } : null;
}

/** Qué parte de la referencia del día es una cantidad, de 0 en adelante (1 es el 100 %). */
export function parteDelDia(micro: Micro, cantidad: number, p: ParaQuien): number | null {
  const r = referenciaDe(micro, p);
  if (!r) return null;
  return cantidad / ('meta' in r ? r.meta : r.tope);
}

/**
 * Lo que vale la pena ver de un alimento o de un día: lo que aporta al menos `desde` de la
 * referencia (un 10 %, de entrada), de lo que más aporta a lo que menos. La cafeína se ve siempre
 * que haya.
 */
export function destacados(micros: Micros, p: ParaQuien, desde = 0.1): { micro: Micro; cantidad: number; parte: number }[] {
  return MICROS.flatMap((micro) => {
    const cantidad = micros[micro];
    if (cantidad == null || cantidad <= 0) return [];
    const parte = parteDelDia(micro, cantidad, p);
    if (parte === null) return [];
    return micro === 'cafeina' || parte >= desde ? [{ micro, cantidad, parte }] : [];
  }).sort((a, b) => b.parte - a.parte);
}

/** Los micronutrientes por un factor (100 g a una cantidad); lo que no se sabe sigue sin saberse. */
export function escalarMicros(m: Micros, factor: number): Micros {
  const r: Micros = {};
  for (const k of MICROS) if (m[k] != null) r[k] = m[k]! * factor;
  return r;
}

/** La suma: lo que no dice un alimento cuenta como cero, y lo que no dice ninguno no está. */
export function sumarMicros(lista: Iterable<Micros | undefined>): Micros {
  const r: Micros = {};
  for (const m of lista) {
    if (!m) continue;
    for (const k of MICROS) if (m[k] != null) r[k] = (r[k] ?? 0) + m[k]!;
  }
  return r;
}

/** Los micronutrientes que llegan de afuera (lo compartido, la base del servidor): solo los conocidos y posibles. */
export function microsValidos(x: unknown): Micros | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const r: Micros = {};
  for (const k of MICROS) {
    const v = (x as Record<string, unknown>)[k];
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 100000) r[k] = v;
  }
  return Object.keys(r).length ? r : undefined;
}
