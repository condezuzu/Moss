// Las porciones de un plato dicho sin cantidad (D36, lo pediste el 29/10/2026): «un plato de fideos»
// o «comí guiso» va con la porción mediana, se puede cambiar a chica o grande con una sola pregunta, y
// queda marcado «aproximado». Los gramos son de comida cocida, como se sirve, de USDA FNDDS, del
// manual del MSP de Uruguay y de las Guías Alimentarias de Argentina (spec/evidencia-1.1.md, 6).
// La galería puede usar este archivo: no importa nada.

export type Tamano = 'chico' | 'mediano' | 'grande';
export const TAMANOS: readonly Tamano[] = ['chico', 'mediano', 'grande'];

/** Chico, mediano y grande, en gramos. */
export type PorcionesDePlato = Record<Tamano, number>;

/** Sin una fila de la tabla, a partir del «1 plato» del alimento: chico ≈ 0,65 y grande ≈ 1,5 (FNDDS). */
export const CHICO = 0.65;
export const GRANDE = 1.5;

/**
 * Lo que se reconoce por el nombre, sin tildes y en minúsculas. El plato es la primera palabra entera
 * («guiso de lentejas»), no un pedazo del nombre: «carne para guiso», «pasta de maní», «pastafrola» o
 * «galletas de arroz» no son platos. El orden importa: lo primero que coincide gana.
 */
const TABLA: readonly (readonly [RegExp, PorcionesDePlato])[] = [
  [/^(?:guisos?|estofados?|locros?|busecas?|mondongos?)\b/, { chico: 200, mediano: 300, grande: 450 }],
  // La crema de leche, de maní o la que se unta no es una sopa.
  [/^(?:sopas?|caldos?|pucheros?)\b|^crema de (?!leche|avellana|almendra|mani)/, { chico: 200, mediano: 300, grande: 450 }],
  // Lo instantáneo va por el paquete; «pasta salad» es una ensalada.
  [/^(?:fideos?|pasta(?! de | salad)|spaghetti|espaguetis?|tallarin(?:es)?|noquis?|raviol(?:es|is?)?|sorrentinos?|canelon(?:es)?|lasa(?:n|ñ)as?|macarron(?:es)?|tirabuzon(?:es)?|mostachol(?:es)?)\b(?!.*instantane)/, { chico: 200, mediano: 300, grande: 450 }],
  [/^polenta\b/, { chico: 200, mediano: 300, grande: 450 }],
  [/^arroz\b(?! con leche| inflado)/, { chico: 160, mediano: 250, grande: 375 }],
  [/^lentejas?\b/, { chico: 90, mediano: 150, grande: 200 }],
  // Una milanesa sola: al pan, con guarnición o a la napolitana es otra cosa, con su porción.
  [/^milanesas?\b(?!.*\b(?:al pan|con|napolitana)\b)/, { chico: 120, mediano: 160, grande: 240 }],
  [/^pure\b(?!.*instantane)/, { chico: 125, mediano: 200, grande: 300 }],
  [/^ensaladas?\b/, { chico: 75, mediano: 150, grande: 250 }],
  [/^pizzas?\b/, { chico: 85, mediano: 120, grande: 160 }],
  [/^empanadas?\b/, { chico: 70, mediano: 105, grande: 130 }],
  [/^(?:tartas?|pascualinas?|quiches?)\b/, { chico: 120, mediano: 180, grande: 250 }],
];

/**
 * Lo que no es un plato por sí mismo, pero se dice así (lo pediste el 30/10/2026): «medio plato de
 * pollo», «un plato de verduras». Solo cuando se nombró el plato: «pollo» a secas no pregunta el tamaño.
 */
const CUANDO_SE_DICE_PLATO: readonly (readonly [RegExp, PorcionesDePlato])[] = [
  [/\b(?:pollo|pechuga|carne|bife|asado|lomo|cerdo|pavo|pescado|merluza|salmon|atun)/, { chico: 100, mediano: 150, grande: 225 }],
  [/\b(?:verduras?|vegetales|vegetables?|brocoli|zapallo|calabaza|espinaca|acelga|chauchas?|judias|zanahorias?|berenjenas?)/, { chico: 100, mediano: 150, grande: 225 }],
  [/\b(?:garbanzos?|porotos?|frijoles?|habas?|arvejas?|alubias?)/, { chico: 90, mediano: 150, grande: 200 }],
  [/\b(?:papas?|patatas?|boniatos?|batatas?|camote)/, { chico: 125, mediano: 200, grande: 300 }],
];
/** Un plato de cualquier otra cosa: como uno de arroz. Queda «aproximado» y se puede cambiar. */
const PLATO_CUALQUIERA: PorcionesDePlato = { chico: 160, mediano: 250, grande: 375 };

/** Las cosas que se cortan en porciones, enteras: «media pizza» son 4 porciones de 8, no media porción. */
const ENTERAS: readonly (readonly [RegExp, number])[] = [
  [/\bpizzas?\b/, 8 * 120],
  [/\b(?:tartas?|pascualina|quiche)\b/, 6 * 180],
];

const llano = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Las porciones de un plato por su nombre (el del alimento de la base o lo dicho), o null si no es un
 * plato de la tabla. «Guiso de lentejas» es un guiso, no lentejas solas.
 */
export function porcionesDePlato(...nombres: (string | null | undefined)[]): PorcionesDePlato | null {
  for (const n of nombres) {
    if (!n) continue;
    const t = llano(n);
    const fila = TABLA.find(([re]) => re.test(t));
    if (fila) return fila[1];
  }
  return null;
}

/** Se dijo «un plato de…»: lo de la tabla, el «1 plato» de la base o, si no, lo que da cualquier plato. */
export function porcionesAlDecirPlato(deLaBase: PorcionesDePlato | null, ...nombres: (string | null | undefined)[]): PorcionesDePlato {
  const textos = nombres.flatMap((n) => (n ? [llano(n)] : []));
  return porcionesDePlato(...nombres) ?? deLaBase ?? CUANDO_SE_DICE_PLATO.find(([re]) => textos.some((t) => re.test(t)))?.[1] ?? PLATO_CUALQUIERA;
}

/** Cuánto pesa entera una cosa que se corta en porciones, o null si no es de esas. */
export function gramosDeLaEntera(...nombres: (string | null | undefined)[]): number | null {
  const textos = nombres.flatMap((n) => (n ? [llano(n)] : []));
  return ENTERAS.find(([re]) => textos.some((t) => re.test(t)))?.[1] ?? null;
}

/** De un «1 plato» de la base (los platos de Moss lo tienen): mediano ese, chico y grande en proporción. */
export const porcionesDesde = (mediano: number): PorcionesDePlato => ({ chico: Math.round(mediano * CHICO), mediano, grande: Math.round(mediano * GRANDE) });
