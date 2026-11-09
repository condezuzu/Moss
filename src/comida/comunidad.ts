// La base de la comunidad (supabase/moss/0012_comunidad.sql): lo que alguien crea a mano o desde la
// etiqueta sale como propuesta, y cuando varias personas cargan lo mismo, el servidor lo publica en el
// catálogo para todos, marcado «Verificado por la comunidad». Acá, lo que el teléfono revisa antes de
// mandarlo: las mismas reglas que el servidor, para no mandar lo que igual va a rechazar. Puro.

/** Lo que se propone, por 100 g (el sodio, en mg), como lo pide moss.proponer_alimento. */
export type Propuesta = {
  codigo: string | null;
  nombre: string;
  marca: string | null;
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  fibra: number | null;
  azucares: number | null;
  saturadas: number | null;
  sodio: number | null;
  porcion: string | null;
  porcionGramos: number | null;
  region: string;
};

type Propio = {
  nombre: string;
  marca: string | null;
  codigo: string | null;
  por100g: { kcal: number; proteina: number; carbohidratos: number; grasas: number; fibra?: number; azucares?: number; saturadas?: number; sodio?: number; alcohol?: number };
  porciones: readonly { nombre: string; gramos: number }[];
};

/** EAN-8, UPC-A, EAN-13 o GTIN-14 con su dígito verificador bien: lo mal leído o inventado no pasa. */
export function codigoValido(codigo: string): boolean {
  if (!/^(\d{8}|\d{12,14})$/.test(codigo)) return false;
  const digitos = [...codigo].map(Number);
  const control = digitos.pop()!;
  // Desde la derecha, sin el de control: por 3, por 1, por 3…
  const suma = digitos.reverse().reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}

/** Si las calorías cierran con los macros (4/4/9), con lugar para la fibra, los polioles y el redondeo. */
export function cierra(v: { kcal: number; proteina: number; carbohidratos: number; grasas: number }): boolean {
  const calculadas = 4 * v.proteina + 4 * v.carbohidratos + 9 * v.grasas;
  return Math.abs(v.kcal - calculadas) <= Math.max(40, 0.25 * v.kcal);
}

const enRango = (n: number | undefined, tope: number) => n === undefined || (Number.isFinite(n) && n >= 0 && n <= tope);

/**
 * La propuesta de un alimento creado, o null si no se manda: sin letras, con una dirección web, valores
 * imposibles, calorías que no cierran, un código mal leído o con alcohol (el servidor no lo cuenta).
 */
export function propuestaDe(propio: Propio, region: string | null | undefined): Propuesta | null {
  const nombre = propio.nombre.trim().replace(/\s+/g, ' ');
  const marca = propio.marca?.trim().replace(/\s+/g, ' ') || null;
  const v = propio.por100g;
  if (nombre.length < 2 || nombre.length > 120 || !/\p{L}/u.test(nombre)) return null;
  if ([nombre, marca ?? ''].some((x) => /https?:|www\.|@|\.(com|net|org)\b/i.test(x))) return null;
  if (marca && marca.length > 80) return null;
  if (propio.codigo && !codigoValido(propio.codigo)) return null;
  if (v.alcohol) return null;
  if (!enRango(v.kcal, 902) || ![v.proteina, v.carbohidratos, v.grasas, v.fibra, v.azucares, v.saturadas].every((x) => enRango(x, 100)) || !enRango(v.sodio, 40000)) return null;
  if (v.proteina + v.carbohidratos + v.grasas > 102 || !cierra(v)) return null;
  const porcion = propio.porciones.find((p) => p.gramos > 0 && p.gramos <= 2000 && p.nombre.trim());
  return {
    codigo: propio.codigo || null, nombre, marca,
    kcal: v.kcal, proteina: v.proteina, carbohidratos: v.carbohidratos, grasas: v.grasas,
    fibra: v.fibra ?? null, azucares: v.azucares ?? null, saturadas: v.saturadas ?? null, sodio: v.sodio ?? null,
    porcion: porcion ? porcion.nombre.trim().slice(0, 40) : null, porcionGramos: porcion?.gramos ?? null,
    region: region && /^[A-Z]{2}$/.test(region) ? region : '',
  };
}
