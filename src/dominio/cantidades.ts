// Cómo se miden los alimentos (especificación, «Cómo se miden los alimentos»): la parte comestible,
// los líquidos en ml, el aceite de cocción, los ajustes rápidos y el sistema métrico o imperial.
// Lo guardado va siempre en gramos (y en ml, los líquidos): el sistema es solo cómo se muestra y
// cómo se escribe.

export type Sistema = 'metrico' | 'imperial';

export const GRAMOS_POR_ONZA = 28.349523125;
export const ML_POR_ONZA_LIQUIDA = 29.5735295625;
/** La taza de las etiquetas de Estados Unidos. */
export const ML_POR_TAZA = 240;

/** Los ajustes rápidos sobre la porción, sin tipear. */
export const AJUSTES = [0.5, 1.5, 2] as const;

/** Lo que se agrega al cocinar, en gramos: el aceite de una cucharadita o de una cucharada (USDA). */
export const ACEITE = { nada: 0, cucharadita: 4.5, cucharada: 13.6, dosCucharadas: 27.2 } as const;
export type PorcionDeAceite = keyof typeof ACEITE;
/** El aceite de girasol, el de cocinar más común, por 100 g (USDA): todo grasa. */
export const ACEITE_POR_100G = { kcal: 884, proteina: 0, carbohidratos: 0, grasas: 100, saturadas: 10.3 };

/**
 * Si al registrarlo hay que preguntar por el aceite: lo salteado o a la plancha, que en la base no
 * lo lleva. En lo frito la base ya cuenta el aceite que absorbe: no se pregunta, se avisa.
 */
export type Aceite = 'preguntar' | 'incluido' | null;

/**
 * La parte que se come de lo que se pesó con cáscara, hueso o carozo. `desecho` es la fracción que
 * no se come (0,36 en la banana); los valores de la base son de la parte comestible.
 */
export function comestible(gramos: number, desecho: number | null | undefined): number {
  if (!desecho || desecho <= 0 || desecho >= 1) return gramos;
  return gramos * (1 - desecho);
}

/** Lo que pesan unos ml con su densidad, en g/ml; sin densidad, como el agua. */
export function gramosDeMl(ml: number, densidad?: number | null): number {
  return ml * (densidad && densidad > 0 ? densidad : 1);
}

export function mlDeGramos(gramos: number, densidad?: number | null): number {
  return gramos / (densidad && densidad > 0 ? densidad : 1);
}

/** Lo escrito en el sistema del usuario, a lo que se guarda: onzas a gramos, onzas líquidas o tazas a ml. */
export function aGramos(valor: number, unidad: 'g' | 'oz'): number {
  return unidad === 'oz' ? valor * GRAMOS_POR_ONZA : valor;
}

export function aMl(valor: number, unidad: 'ml' | 'floz' | 'taza'): number {
  if (unidad === 'floz') return valor * ML_POR_ONZA_LIQUIDA;
  if (unidad === 'taza') return valor * ML_POR_TAZA;
  return valor;
}

/** La unidad de cada sistema: gramos u onzas para lo sólido, ml u onzas líquidas para lo líquido. */
export const unidadDePeso = (s: Sistema): 'g' | 'oz' => (s === 'imperial' ? 'oz' : 'g');
export const unidadDeVolumen = (s: Sistema): 'ml' | 'floz' => (s === 'imperial' ? 'floz' : 'ml');

/** Para mostrar: los gramos en el sistema del usuario, con lo que conviene redondear. */
export function pesoEn(gramos: number, s: Sistema): { valor: number; unidad: 'g' | 'oz' } {
  if (s === 'imperial') return { valor: Math.round((gramos / GRAMOS_POR_ONZA) * 10) / 10, unidad: 'oz' };
  return { valor: Math.round(gramos), unidad: 'g' };
}

export function volumenEn(ml: number, s: Sistema): { valor: number; unidad: 'ml' | 'floz' } {
  if (s === 'imperial') return { valor: Math.round((ml / ML_POR_ONZA_LIQUIDA) * 10) / 10, unidad: 'floz' };
  return { valor: Math.round(ml), unidad: 'ml' };
}

/** El sistema del teléfono: Estados Unidos, Liberia y Myanmar usan el imperial. */
export function sistemaDeRegion(region: string | null | undefined): Sistema {
  return region && ['US', 'LR', 'MM'].includes(region.toUpperCase()) ? 'imperial' : 'metrico';
}

// Lo que dice un envase es un peso de fábrica, no una medida a ojo.
const DE_ENVASE = /(?:^|[^\p{L}])(paquete|paquetito|lata|latita|botella|envase|sobre|barra|barrita|frasco|pote|caja|cajita|bolsa|bolsita|package|can|bottle|container|packet|bar|jar|pot|box|bag|pouch)(?:s|es)?(?:$|[^\p{L}])/iu;

/**
 * Si un registro es a ojo de fábrica (el usuario lo cambia con un toque): lo escrito en gramos es
 * pesado; una porción casera (taza, cucharada, unidad mediana), a ojo; lo que dice un envase, pesado.
 */
export function aOjoDeFabrica(cantidad: { porcion: string } | { gramos: number }): boolean {
  return 'porcion' in cantidad && !DE_ENVASE.test(cantidad.porcion);
}

/** Un ajuste rápido sobre las veces de una porción: ×½ de 1 son ½, ×2 de 1½ son 3. */
export function ajustar(veces: number, factor: number): number {
  return Math.round(veces * factor * 1000) / 1000;
}

// El cuerpo, en el sistema de cada uno: el peso en kg o en libras, las medidas en cm o en pulgadas.
// Se guarda siempre en kg y en cm.
export const KG_POR_LIBRA = 0.45359237;
export const CM_POR_PULGADA = 2.54;

export function pesoCorporalEn(kg: number, s: Sistema): { valor: number; unidad: 'kg' | 'lb' } {
  return s === 'imperial' ? { valor: Math.round((kg / KG_POR_LIBRA) * 10) / 10, unidad: 'lb' } : { valor: Math.round(kg * 10) / 10, unidad: 'kg' };
}

export const aKg = (valor: number, s: Sistema) => (s === 'imperial' ? valor * KG_POR_LIBRA : valor);

export function largoEn(cm: number, s: Sistema): { valor: number; unidad: 'cm' | 'in' } {
  return s === 'imperial' ? { valor: Math.round((cm / CM_POR_PULGADA) * 10) / 10, unidad: 'in' } : { valor: Math.round(cm * 10) / 10, unidad: 'cm' };
}

export const aCm = (valor: number, s: Sistema) => (s === 'imperial' ? valor * CM_POR_PULGADA : valor);
