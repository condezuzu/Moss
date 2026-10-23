// Open Food Facts: un producto por su código de barras (spec/nutricion.md, «Código de barras»).
// Se pregunta solo si el código no está en lo guardado (lo escaneado y los propios), y lo que vuelve
// se guarda en el teléfono. La API va con su versión fija y un User-Agent que dice quién pregunta,
// como piden sus condiciones. Los datos son de Open Food Facts, con licencia ODbL.
// Lo que llega pasa los mismos controles que la base (src/comida/controles.test.ts): si no cierra,
// queda sin verificar y conviene leer la etiqueta. Solo importa del dominio, y lo puro.

import { TOPE_POR_100G, type Micro, type Micros } from '@/dominio/micronutrientes';

/** La versión 2 de la API, fija: así un cambio de ellos no rompe Moss sin aviso. */
export const API = 'https://world.openfoodfacts.org/api/v2/product/';
const CAMPOS = ['code', 'product_name', 'product_name_es', 'product_name_en', 'brands', 'serving_size', 'serving_quantity', 'nutriments'].join(',');

export type ValoresOff = {
  kcal: number; proteina: number; carbohidratos: number; grasas: number; fibra?: number; azucares?: number; saturadas?: number; sodio?: number; alcohol?: number;
  micros?: Micros;
};

export type Producto = {
  codigo: string;
  nombre: string;
  marca: string | null;
  /** Lo que se leyó por 100 g. Si falta alguno de los cuatro de siempre, `completo` es falso y conviene la etiqueta. */
  por100g: Partial<ValoresOff>;
  completo: boolean;
  porcion: { texto: string; gramos: number } | null;
  /**
   * Para revisar antes de guardar: las kcal no cierran con los macros, algo es imposible (más de
   * 100 g de macros, más azúcares que carbohidratos…) o lo de la porción no cierra con lo de 100 g.
   */
  avisos: ('noCierra' | 'imposible' | 'porcionNoCierra')[];
  /** Completo y sin avisos: pasa los mismos controles que la base. */
  verificado: boolean;
};

/**
 * Los códigos a probar: el que llegó, solo con dígitos, y su otra forma. El iPhone entrega el
 * UPC-A como EAN-13 con un 0 adelante, y Open Food Facts lo puede tener de las dos maneras.
 */
export function codigosPosibles(codigo: string): string[] {
  const c = codigo.replace(/\D/g, '');
  if (c.length === 13 && c.startsWith('0')) return [c, c.slice(1)];
  if (c.length === 12) return [c, `0${c}`];
  return c ? [c] : [];
}

type Nutriments = Record<string, number | string | undefined>;
const numero = (x: unknown): number | undefined => {
  const n = typeof x === 'string' ? Number(x.replace(',', '.')) : typeof x === 'number' ? x : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/** De los nutrientes de Open Food Facts a los de Moss, por 100 g o por porción (`_serving`). */
function valoresDe(n: Nutriments, sufijo: '_100g' | '_serving'): Partial<ValoresOff> {
  const v: Partial<ValoresOff> = {};
  const poner = (clave: keyof ValoresOff, valor: number | undefined) => {
    if (valor !== undefined) v[clave] = valor;
  };
  const kj = numero(n[`energy-kj${sufijo}`]) ?? (n[`energy${sufijo}`] !== undefined && n.energy_unit !== 'kcal' ? numero(n[`energy${sufijo}`]) : undefined);
  poner('kcal', numero(n[`energy-kcal${sufijo}`]) ?? (kj !== undefined ? Math.round(kj / 4.184) : undefined));
  poner('proteina', numero(n[`proteins${sufijo}`]));
  poner('carbohidratos', numero(n[`carbohydrates${sufijo}`]));
  poner('grasas', numero(n[`fat${sufijo}`]));
  poner('fibra', numero(n[`fiber${sufijo}`]));
  poner('azucares', numero(n[`sugars${sufijo}`]));
  poner('saturadas', numero(n[`saturated-fat${sufijo}`]));
  // Open Food Facts da el sodio en gramos; Moss, en mg.
  const sodio = numero(n[`sodium${sufijo}`]);
  poner('sodio', sodio !== undefined ? sodio * 1000 : undefined);
  // El alcohol viene en % de volumen: por la densidad del etanol, son 0,789 g cada 1 %.
  const alcohol = numero(n[`alcohol${sufijo}`]);
  if (alcohol) poner('alcohol', alcohol * 0.789);
  const micros: Micros = {};
  for (const [clave, micro, factor] of MICROS_DE_OFF) {
    const x = numero(n[`${clave}${sufijo}`]);
    // Lo imposible (un error al cargarlo, que en Open Food Facts pasa) no se guarda.
    if (x !== undefined && x * factor <= (TOPE_POR_100G[micro] ?? 100)) micros[micro] = x * factor;
  }
  if (sufijo === '_100g' && Object.keys(micros).length) v.micros = micros;
  return v;
}

// Las vitaminas, los minerales y lo demás de Open Food Facts, que da todo en gramos: el factor lleva
// a la unidad de Moss (mg o µg; las grasas, en g).
const MICROS_DE_OFF: [string, Micro, number][] = [
  ['cholesterol', 'colesterol', 1e3], ['trans-fat', 'trans', 1], ['monounsaturated-fat', 'monoinsaturadas', 1], ['polyunsaturated-fat', 'poliinsaturadas', 1],
  ['potassium', 'potasio', 1e3], ['calcium', 'calcio', 1e3], ['iron', 'hierro', 1e3], ['magnesium', 'magnesio', 1e3], ['phosphorus', 'fosforo', 1e3],
  ['zinc', 'zinc', 1e3], ['selenium', 'selenio', 1e6], ['vitamin-a', 'vitaminaA', 1e6], ['vitamin-c', 'vitaminaC', 1e3], ['vitamin-d', 'vitaminaD', 1e6],
  ['vitamin-e', 'vitaminaE', 1e3], ['vitamin-k', 'vitaminaK', 1e6], ['vitamin-b1', 'tiamina', 1e3], ['vitamin-b2', 'riboflavina', 1e3], ['vitamin-pp', 'niacina', 1e3],
  ['vitamin-b6', 'vitaminaB6', 1e3], ['vitamin-b9', 'folato', 1e6], ['folates', 'folato', 1e6], ['vitamin-b12', 'vitaminaB12', 1e6], ['caffeine', 'cafeina', 1e3],
];

const CUATRO = ['kcal', 'proteina', 'carbohidratos', 'grasas'] as const;
const lejos = (a: number, b: number, parte: number, minimo: number) => Math.abs(a - b) > Math.max(minimo, parte * Math.max(a, b));
/**
 * Las kcal cierran con los macros, como en la base: con 4/4/9 y 7, o con la fibra a 2 kcal (en
 * Europa los carbohidratos no la cuentan; en Estados Unidos, sí).
 */
function cierra(v: Partial<ValoresOff>): boolean {
  const base = 4 * (v.proteina ?? 0) + 9 * (v.grasas ?? 0) + 7 * (v.alcohol ?? 0);
  const c = v.carbohidratos ?? 0;
  const fibra = v.fibra ?? 0;
  return [base + 4 * c, base + 4 * c + 2 * fibra, base + 4 * Math.max(0, c - fibra) + 2 * fibra].some((k) => !lejos(v.kcal ?? 0, k, 0.2, 15));
}
/** Lo que no puede ser en 100 g de nada: más de 100 g de macros, más de 902 kcal, el sodio de más que la sal, más azúcares que carbohidratos. */
const imposible = (v: Partial<ValoresOff>) => (v.proteina ?? 0) + (v.carbohidratos ?? 0) + (v.grasas ?? 0) + (v.alcohol ?? 0) > 100.5 || (v.kcal ?? 0) > 902
  || (v.sodio ?? 0) > 40000 || (v.azucares ?? 0) > (v.carbohidratos ?? 0) + 1 || (v.saturadas ?? 0) > (v.grasas ?? 0) + 1;

/** Lo que devuelve la API, a lo de Moss: el nombre en el idioma de la app, los valores por 100 g y la porción. */
export function productoDe(respuesta: unknown, idioma: 'es' | 'en'): Producto | null {
  const r = respuesta as { status?: number; code?: string; product?: Record<string, unknown> } | null;
  const p = r?.product;
  if (!p || r?.status === 0) return null;
  const texto = (clave: string) => (typeof p[clave] === 'string' && (p[clave] as string).trim() ? (p[clave] as string).trim() : null);
  const otro = idioma === 'es' ? 'en' : 'es';
  const nombre = texto(`product_name_${idioma}`) ?? texto('product_name') ?? texto(`product_name_${otro}`);
  if (!nombre) return null;
  const nutriments = (p.nutriments ?? {}) as Nutriments;
  const por100g = valoresDe(nutriments, '_100g');
  const gramos = numero(p.serving_quantity);
  const porcion = gramos ? { texto: texto('serving_size') ?? `${gramos} g`, gramos } : null;
  const completo = CUATRO.every((k) => por100g[k] !== undefined);

  const avisos: Producto['avisos'] = [];
  if (completo && !cierra(por100g)) avisos.push('noCierra');
  if (imposible(por100g)) avisos.push('imposible');
  const porPorcion = valoresDe(nutriments, '_serving');
  if (porcion && por100g.kcal !== undefined && porPorcion.kcal !== undefined && lejos(porPorcion.kcal, (por100g.kcal * porcion.gramos) / 100, 0.15, 5)) avisos.push('porcionNoCierra');

  return {
    codigo: (typeof p.code === 'string' && p.code) || r?.code || '',
    nombre,
    marca: texto('brands')?.split(',')[0].trim() ?? null,
    por100g,
    completo,
    porcion,
    avisos,
    verificado: completo && !avisos.length,
  };
}

export type Pedir = (url: string, init: { headers: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

/**
 * Busca un código en Open Food Facts. Devuelve null si no está; si no hay conexión (o Open Food
 * Facts se cae, que pasa seguido), tira el error: quien llama ofrece el escáner de etiqueta.
 * `contacto` va en el User-Agent, como piden ellos.
 */
export async function buscarEnOff(codigo: string, op: { idioma: 'es' | 'en'; version: string; contacto: string; pedir?: Pedir }): Promise<Producto | null> {
  const pedir: Pedir = op.pedir ?? ((url, init) => fetch(url, init));
  for (const c of codigosPosibles(codigo)) {
    const respuesta = await pedir(`${API}${c}.json?fields=${CAMPOS}`, { headers: { 'User-Agent': `Moss/${op.version} (${op.contacto})` } });
    if (respuesta.status === 404) continue;
    if (!respuesta.ok) throw new Error(`Open Food Facts respondió ${respuesta.status}`);
    const producto = productoDe(await respuesta.json(), op.idioma);
    if (producto) return producto;
  }
  return null;
}
