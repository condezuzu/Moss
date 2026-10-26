// El lector de la tabla nutricional de una etiqueta (spec/nutricion.md, «Escáner de etiqueta»):
// recibe las líneas que reconoce el iPhone (Vision) y devuelve la porción y los valores, por
// porción y por 100 g, más lo que conviene revisar. Lee las tres formas comunes:
// - la del Mercosur (Uruguay, Argentina): por porción, con %VD;
// - la de Estados Unidos (Nutrition Facts): por porción;
// - la europea: por 100 g, con la sal en lugar del sodio.
// En español, inglés y portugués. Los octógonos del frente («EXCESO EN SODIO») no tienen números:
// no confunden. No importa nada: así la galería también puede usarlo para la pantalla de revisión.

export type Nutriente = 'kcal' | 'proteina' | 'carbohidratos' | 'grasas' | 'fibra' | 'azucares' | 'saturadas' | 'sodio' | 'alcohol';
/** Los valores leídos: lo que no se leyó no está. El sodio, en mg. */
export type Leidos = Partial<Record<Nutriente, number>>;

export type Aviso =
  /** No se leyó la porción en gramos y la tabla no da los valores por 100 g. */
  | 'sinPorcion'
  /** La porción está en ml: se toma 1 ml como 1 g. */
  | 'mililitros'
  /** Falta alguno de los cuatro de siempre. */
  | 'faltan'
  /** Las kcal no cierran con los macros (4, 4 y 9 por gramo). */
  | 'noCierra';

export type Etiqueta = {
  porcion: { gramos: number; texto: string } | null;
  porPorcion: Leidos;
  por100g: Leidos;
  /** Por 100 g, completo, para guardar el alimento: de la tabla o calculado desde la porción. Sin los cuatro de siempre, null. */
  normalizado: (Leidos & { kcal: number; proteina: number; carbohidratos: number; grasas: number }) | null;
  avisos: Aviso[];
};

/** Sin tildes, en minúsculas, con un espacio entre palabras. Las «O» pegadas a números son ceros (un error típico). */
function limpiar(linea: string): string {
  return linea
    .normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    // No la del final de una palabra: «Sodio120mg» es sodio.
    .replace(/(?<=\d)o|(?<![a-z])o(?=\d)/g, '0')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Qué nutriente nombra una línea. El orden importa: «grasas saturadas» antes que «grasas». */
const NOMBRES: readonly (readonly [Nutriente | 'trans' | 'sal' | 'agregados' | 'colesterol' | 'insaturadas', RegExp])[] = [
  ['trans', /\btrans\b/],
  ['colesterol', /colesterol|cholesterol/],
  // Las mono y poliinsaturadas no son saturadas ni el total de grasas.
  ['insaturadas', /insaturad|unsaturated/],
  ['saturadas', /saturad|saturate[ds]/],
  ['agregados', /anadid|agregad|adicionad|added/],
  ['azucares', /azucar|acucar|sugar/],
  ['fibra', /fibra|fiber|fibre/],
  ['sodio', /sodio|sodium/],
  ['sal', /\bsal\b|\bsalt\b/],
  ['alcohol', /alcohol/],
  ['kcal', /energetico|energia|energy|calorias|calories/],
  ['carbohidratos', /carbohidrato|carboidrato|hidratos de carbono|carbohydrate/],
  ['proteina', /protein/],
  ['grasas', /grasa|gordura|lipido|\bfat\b/],
];

type Numero = { valor: number; unidad: string };

/** Los números de una línea con su unidad, sin los porcentajes (%VD). */
function numeros(linea: string): Numero[] {
  const lista: Numero[] = [];
  for (const m of linea.matchAll(/(\d+(?:[.,]\d+)?)\s*(kcal|kj|mg|g|%)?/g)) {
    if (m[2] === '%') continue;
    // «Sodio 1.200 mg», «1,674 kJ»: con tres cifras después del punto, son miles.
    const miles = /^[1-9]\d{0,2}[.,]\d{3}$/.test(m[1]) && (m[2] === 'mg' || m[2] === 'kj' || m[2] === 'kcal');
    lista.push({ valor: Number(miles ? m[1].replace(/[.,]/, '') : m[1].replace(',', '.')), unidad: m[2] ?? '' });
  }
  return lista;
}

/** Los valores de una línea, uno por columna. */
function valoresDe(nutriente: Nutriente | 'sal', linea: string): number[] {
  const todos = numeros(linea);
  if (nutriente === 'kcal') {
    const kcal = todos.filter((n) => n.unidad === 'kcal');
    if (kcal.length) return kcal.map((n) => n.valor);
    const kj = todos.filter((n) => n.unidad === 'kj');
    if (kj.length) return kj.map((n) => Math.round(n.valor / 4.184));
    // «Calories 230»: el primero sin unidad.
    return todos.slice(0, 1).map((n) => n.valor);
  }
  const conUnidad = todos.filter((n) => n.unidad === 'g' || n.unidad === 'mg');
  // Sin unidades (el OCR se las comió), se toma el primero: el último suele ser el %VD.
  const usados = conUnidad.length ? conUnidad : todos.slice(0, 1);
  return usados.map((n) => {
    if (nutriente === 'sodio') return n.unidad === 'g' ? n.valor * 1000 : n.valor;
    return n.unidad === 'mg' ? n.valor / 1000 : n.valor;
  });
}

/** La porción: «Porción 30 g (5 galletitas)», «Serving size 2/3 cup (55g)», «Porción: 200 ml (1 vaso)». */
function porcionDe(lineas: string[]): { gramos: number; texto: string; ml: boolean } | null {
  for (const original of lineas) {
    const l = limpiar(original);
    if (!/porcion|porcao|serving size|portion|tamano/.test(l) || /por porcion|por porcao|per serving|por 100/.test(l)) continue;
    // Primero lo que está entre paréntesis («(55g)»), que en la etiqueta de EE. UU. es el peso.
    const entre = l.match(/\((\d+(?:[.,]\d+)?)\s*(g|ml)\)/);
    const suelto = l.match(/(\d+(?:[.,]\d+)?)\s*(g|ml)\b/);
    const m = entre ?? suelto;
    if (!m) continue;
    return { gramos: Number(m[1].replace(',', '.')), texto: original.replace(/^.*?(porci[oó]n|porç[aã]o|serving size|portion)\s*:?\s*/i, '').trim(), ml: m[2] === 'ml' };
  }
  // Sin un renglón de la porción, la del encabezado de dos columnas: «Por 100 g | Por porción (30 g)».
  for (const original of lineas) {
    const l = limpiar(original);
    const cien = l.search(/\b100 ?(g|ml)\b/);
    const k = l.search(/porcion|porcao|serving|portion/);
    if (cien < 0 || k < 0 || NOMBRES.some(([, patron]) => patron.test(l))) continue;
    const m = /(\d+(?:[.,]\d+)?)\s*(g|ml)\b/.exec(l.slice(k));
    if (!m || (cien > k && k + m.index >= cien)) continue;
    return { gramos: Number(m[1].replace(',', '.')), texto: `${m[1]} ${m[2]}`, ml: m[2] === 'ml' };
  }
  return null;
}

/**
 * El orden de las columnas, si la tabla tiene dos: «100 g | Porción» o al revés. El encabezado no
 * nombra un nutriente ni tiene más números que el 100, salvo el tamaño de la porción después de
 * nombrarla («Por 100 g | Por porción (30 g)»): así no se confunde con «Porción 100 g (1 pote)» ni
 * con «Azúcares 100 g».
 */
function columnas(lineas: string[]): ('100g' | 'porcion')[] {
  for (const original of lineas) {
    const l = limpiar(original);
    const cien = l.search(/\b100 ?(g|ml)\b/);
    if (cien < 0 || NOMBRES.some(([, patron]) => patron.test(l))) continue;
    const porcion = l.search(/porcion|porcao|serving|portion/);
    const solo100 = !numeros(l).some((n) => n.valor !== 100) && !l.replace(/%vd\s*\(\*\)/, '').includes('(');
    if (porcion < 0) {
      if (solo100) return ['100g'];
      continue;
    }
    if (cien < porcion) {
      if (solo100 || !numeros(l.slice(0, porcion)).some((n) => n.valor !== 100)) return ['100g', 'porcion'];
      continue;
    }
    // La porción primero: el 100 es otra columna solo si se dice «por 100 g» («Porción 100 g» es la porción).
    if (solo100 || (!numeros(l.slice(0, porcion)).length && /(?:por|per|\/)\s*$/.test(l.slice(0, cien)))) return ['porcion', '100g'];
  }
  return ['porcion'];
}

const kcalDeMacros = (v: Leidos) => 4 * (v.proteina ?? 0) + 4 * (v.carbohidratos ?? 0) + 9 * (v.grasas ?? 0) + 7 * (v.alcohol ?? 0);
const CUATRO: readonly Nutriente[] = ['kcal', 'proteina', 'carbohidratos', 'grasas'];

export function leerEtiqueta(lineas: string[]): Etiqueta {
  const orden = columnas(lineas);
  const porPorcion: Leidos = {};
  const por100g: Leidos = {};
  for (const original of lineas) {
    const l = limpiar(original);
    const nombre = NOMBRES.find(([, patron]) => patron.test(l))?.[0];
    if (!nombre || nombre === 'trans' || nombre === 'agregados' || nombre === 'colesterol' || nombre === 'insaturadas') continue;
    const valores = valoresDe(nombre, l);
    if (!valores.length) continue;
    // La sal de la etiqueta europea es sodio por 2,5.
    const clave: Nutriente = nombre === 'sal' ? 'sodio' : nombre;
    valores.slice(0, orden.length).forEach((v, i) => {
      const destino = orden[i] === '100g' ? por100g : porPorcion;
      const valor = nombre === 'sal' ? Math.round(v * 400) : v;
      // Si la misma cosa aparece dos veces («Grasas» y después «Grasas totales»), queda la primera.
      if (destino[clave] === undefined) destino[clave] = valor;
    });
  }

  const porcion = porcionDe(lineas);
  const avisos: Aviso[] = [];
  if (porcion?.ml) avisos.push('mililitros');
  const completo = (v: Leidos) => CUATRO.every((k) => v[k] !== undefined);
  let normalizado: Etiqueta['normalizado'] = null;
  if (completo(por100g)) normalizado = { ...por100g } as Etiqueta['normalizado'];
  else if (completo(porPorcion) && porcion) {
    const f = 100 / porcion.gramos;
    normalizado = Object.fromEntries(Object.entries(porPorcion).map(([k, v]) => [k, v! * f])) as Etiqueta['normalizado'];
  }
  if (!porcion && !completo(por100g)) avisos.push('sinPorcion');
  const leidos = completo(por100g) ? por100g : porPorcion;
  if (!completo(leidos)) avisos.push('faltan');
  else if (Math.abs(leidos.kcal! - kcalDeMacros(leidos)) > Math.max(15, 0.2 * leidos.kcal!)) avisos.push('noCierra');

  return { porcion: porcion ? { gramos: porcion.gramos, texto: porcion.texto } : null, porPorcion, por100g, normalizado, avisos };
}
