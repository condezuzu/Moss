// Open Food Facts: un producto por su código de barras (spec/nutricion.md, «Código de barras»).
// Se pregunta solo si el código no está en lo guardado (lo escaneado y los propios), y lo que vuelve
// se guarda en el teléfono. La API va con su versión fija y un User-Agent que dice quién pregunta,
// como piden sus condiciones. Los datos son de Open Food Facts, con licencia ODbL.
// No importa nada.

/** La versión 2 de la API, fija: así un cambio de ellos no rompe Moss sin aviso. */
export const API = 'https://world.openfoodfacts.org/api/v2/product/';
const CAMPOS = ['code', 'product_name', 'product_name_es', 'product_name_en', 'brands', 'serving_size', 'serving_quantity', 'nutriments'].join(',');

export type ValoresOff = { kcal: number; proteina: number; carbohidratos: number; grasas: number; fibra?: number; azucares?: number; saturadas?: number; sodio?: number; alcohol?: number };

export type Producto = {
  codigo: string;
  nombre: string;
  marca: string | null;
  /** Lo que se leyó por 100 g. Si falta alguno de los cuatro de siempre, `completo` es falso y conviene la etiqueta. */
  por100g: Partial<ValoresOff>;
  completo: boolean;
  porcion: { texto: string; gramos: number } | null;
  /** Para revisar antes de guardar: las kcal no cierran con los macros, o lo de la porción no cierra con lo de 100 g. */
  avisos: ('noCierra' | 'porcionNoCierra')[];
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
  return v;
}

const CUATRO = ['kcal', 'proteina', 'carbohidratos', 'grasas'] as const;
const kcalDeMacros = (v: Partial<ValoresOff>) => 4 * (v.proteina ?? 0) + 4 * (v.carbohidratos ?? 0) + 9 * (v.grasas ?? 0) + 7 * (v.alcohol ?? 0);
const lejos = (a: number, b: number, parte: number, minimo: number) => Math.abs(a - b) > Math.max(minimo, parte * Math.max(a, b));

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
  if (completo && lejos(por100g.kcal!, kcalDeMacros(por100g), 0.2, 15)) avisos.push('noCierra');
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
