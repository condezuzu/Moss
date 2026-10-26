// Cómo se lee una cantidad en el registro: «2 rebanadas», «1½ tazas», «½ unidad», «2 medium».
// La base dice cuánto es una porción («1 rebanada», «½ taza», «30 g»); el registro guarda cuántas
// veces se comió. La galería usa este mismo archivo (galeria/construir.mjs): no puede importar nada.

export type Idioma = 'es' | 'en';

const FRACCIONES: readonly (readonly [number, string])[] = [[0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾']];
const VALOR_DE: Record<string, number> = Object.fromEntries(FRACCIONES.map(([v, f]) => [f, v]));

/** Lo que se multiplica tal cual, sin plural: «30 g» por dos son «60 g». */
const METRICAS = /^(g|kg|ml|l|oz|lb)$/i;

/** Lo que no cambia en plural: unidades, adverbios y, en inglés, los adjetivos de tamaño. */
const INVARIABLES: Record<Idioma, Set<string>> = {
  es: new Set(['g', 'kg', 'ml', 'l', 'cm', 'oz', 'fl', 'muy', 'más', 'extra']),
  en: new Set(['g', 'kg', 'ml', 'l', 'cm', 'oz', 'fl', 'tbsp', 'tsp', 'medium', 'large', 'small', 'regular', 'extra', 'thin', 'thick', 'jumbo', 'mini']),
};
/** En español, las palabras que vienen después de estas no van en plural: «2 porciones de referencia». */
const PREPOSICIONES = new Set(['de', 'del', 'en', 'con', 'a', 'al', 'para', 'sin', 'por']);

/** Con coma o punto según el idioma, hasta dos decimales y con separador de miles. */
export function decimal(n: number, idioma: Idioma): string {
  const [entero, decimales] = String(Math.round(n * 100) / 100).split('.');
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, idioma === 'es' ? '.' : ',');
  return decimales ? `${miles}${idioma === 'es' ? ',' : '.'}${decimales}` : miles;
}

/** Un número como se escribe en una porción (1, ½, 1½, 2¼…), o null si no es un entero ni una fracción común. */
export function numeroDePorcion(n: number): string | null {
  const entero = Math.floor(n + 1e-6);
  const resto = n - entero;
  if (resto < 1e-6) return String(entero);
  const fraccion = FRACCIONES.find(([v]) => Math.abs(v - resto) < 0.01);
  return fraccion ? `${entero || ''}${fraccion[1]}` : null;
}

function pluralDePalabra(palabra: string, idioma: Idioma): string {
  if (palabra.includes('/')) return palabra.split('/').map((p) => pluralDePalabra(p, idioma)).join('/');
  if (INVARIABLES[idioma].has(palabra.toLowerCase()) || /\d/.test(palabra) || (palabra.length > 1 && palabra === palabra.toUpperCase())) return palabra;
  if (idioma === 'en') {
    if (/(ss|sh|ch|x|z)$/i.test(palabra)) return `${palabra}es`;
    // Una s sola es que ya está en plural («slices»).
    if (/s$/i.test(palabra)) return palabra;
    if (/[^aeiou]y$/i.test(palabra)) return `${palabra.slice(0, -1)}ies`;
    return `${palabra}s`;
  }
  if (/[aeiouáéó]$/i.test(palabra)) return `${palabra}s`;
  if (/[sx]$/i.test(palabra)) return palabra;
  if (/z$/i.test(palabra)) return `${palabra.slice(0, -1)}ces`;
  // Las agudas en -n pierden la tilde: porción, porciones.
  const SIN_TILDE: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };
  return `${palabra.replace(/([áéíóú])n$/, (_, v: string) => `${SIN_TILDE[v]}n`)}es`;
}

/**
 * El plural de una porción sin su número: «taza, en rodajas» → «tazas, en rodajas». En español
 * concuerdan todas las palabras hasta la primera preposición; en inglés cambia solo la última.
 */
export function pluralDePorcion(texto: string, idioma: Idioma): string {
  const corte = texto.search(/[,(]/);
  const cabeza = corte < 0 ? texto : texto.slice(0, corte);
  const cola = corte < 0 ? '' : texto.slice(corte);
  const palabras = cabeza.split(' ');
  if (idioma === 'en') {
    const ultima = palabras.map((p) => p.length > 0).lastIndexOf(true);
    if (ultima >= 0) palabras[ultima] = pluralDePalabra(palabras[ultima], idioma);
    return palabras.join(' ') + cola;
  }
  let seguir = true;
  return palabras.map((p) => {
    if (PREPOSICIONES.has(p.toLowerCase())) seguir = false;
    return seguir && p ? pluralDePalabra(p, idioma) : p;
  }).join(' ') + cola;
}

/** Las palabras en inglés que terminan en -ie: «cookies» es «cookie» y no «cooky». */
const IE_EN_INGLES = new Set(['cookie', 'brownie', 'pie', 'smoothie', 'veggie', 'calorie', 'tie']);

/** El singular de una palabra en plural («galletas», «unidades», «crackers»); si no está en plural, igual. */
function singularDePalabra(palabra: string, idioma: Idioma): string {
  const p = palabra.toLowerCase();
  if (INVARIABLES[idioma].has(p) || /\d/.test(palabra) || palabra.length < 3) return palabra;
  if (idioma === 'en') {
    if (/ies$/i.test(palabra)) return IE_EN_INGLES.has(p.slice(0, -1)) ? palabra.slice(0, -1) : `${palabra.slice(0, -3)}y`;
    if (/(ss|sh|ch|x|z|o)es$/i.test(palabra)) return palabra.slice(0, -2);
    if (/[^s]s$/i.test(palabra)) return palabra.slice(0, -1);
    return palabra;
  }
  if (/iones$/i.test(palabra)) return `${palabra.slice(0, -5)}ión`;
  if (/ones$/i.test(palabra)) return `${palabra.slice(0, -4)}ón`;
  if (/[aeiou]ces$/i.test(palabra)) return `${palabra.slice(0, -3)}z`;
  // «unidades», «panes», «flores»: después de una sola consonante, el plural agrega -es.
  if (/[aeiou][dlnrj]es$/i.test(palabra)) return palabra.slice(0, -2);
  if (/[aeiouáéó]s$/i.test(palabra)) return palabra.slice(0, -1);
  // Lo que viene del inglés («crackers», «snacks»).
  if (/[^aeious]s$/i.test(palabra)) return palabra.slice(0, -1);
  return palabra;
}

/** El singular de una porción sin su número, con las mismas reglas que el plural: «galletas rellenas» → «galleta rellena». */
export function singularDePorcion(texto: string, idioma: Idioma): string {
  const corte = texto.search(/[,(]/);
  const cabeza = corte < 0 ? texto : texto.slice(0, corte);
  const cola = corte < 0 ? '' : texto.slice(corte);
  const palabras = cabeza.split(' ');
  if (idioma === 'en') {
    const ultima = palabras.map((p) => p.length > 0).lastIndexOf(true);
    if (ultima >= 0) palabras[ultima] = singularDePalabra(palabras[ultima], idioma);
    return palabras.join(' ') + cola;
  }
  let seguir = true;
  return palabras.map((p) => {
    if (PREPOSICIONES.has(p.toLowerCase())) seguir = false;
    return seguir && p ? singularDePalabra(p, idioma) : p;
  }).join(' ') + cola;
}

/**
 * Las porciones con la de una sola unidad adelante: «7 galletas» (31 g) suma «1 galleta» (4,4 g),
 * así no se arranca del número que eligió el paquete. Lo que ya tiene la de una, o se cuenta en
 * gramos, queda igual.
 */
export function conUnaUnidad<P extends { nombre: string; gramos: number }>(porciones: readonly P[], idioma: Idioma): (P | { nombre: string; gramos: number })[] {
  const salida: (P | { nombre: string; gramos: number })[] = [];
  const nombres = new Set(porciones.map((p) => p.nombre.toLowerCase()));
  for (const p of porciones) {
    const m = /^(\d+)\s+(\S.*)$/.exec(p.nombre);
    const n = m ? Number(m[1]) : 0;
    if (m && n >= 2 && n <= 100 && !METRICAS.test(m[2].split(/[\s,(]/)[0])) {
      const una = `1 ${singularDePorcion(m[2], idioma)}`;
      if (!nombres.has(una.toLowerCase())) {
        nombres.add(una.toLowerCase());
        salida.push({ nombre: una, gramos: Math.round((p.gramos / n) * 10) / 10 });
      }
    }
    salida.push(p);
  }
  return salida;
}

/** Lo que se comió, con palabras: `veces` porciones de `porcion` («1 rebanada», «½ taza», «30 g»). */
export function cantidadDePorcion(veces: number, porcion: string, idioma: Idioma): string {
  if (Math.abs(veces - 1) < 1e-9) return porcion;
  const m = /^(\d+(?:[.,]\d+)?)?\s*([¼⅓½⅔¾])?\s+(\S.*)$/.exec(porcion);
  // Sin número («Porción típica»): es una.
  if (!m || (!m[1] && !m[2])) return cantidadDePorcion(veces, `1 ${porcion.charAt(0).toLowerCase()}${porcion.slice(1)}`, idioma);
  const base = (m[1] ? Number(m[1].replace(',', '.')) : 0) + (m[2] ? VALOR_DE[m[2]] : 0);
  const resto = m[3];
  const total = base * veces;
  if (METRICAS.test(resto)) return `${decimal(total, idioma)} ${resto}`;
  const numero = numeroDePorcion(total);
  const porVeces = `${numeroDePorcion(veces) ?? decimal(veces, idioma)} × ${porcion}`;
  if (!numero) return porVeces;
  // «1 rebanada» o «½ taza»: singular hasta llegar a una.
  if (base <= 1) return `${numero} ${total > 1 ? pluralDePorcion(resto, idioma) : resto}`;
  // «10 unidades» ya está en plural; para bajar de una haría falta el singular.
  return total > 1 ? `${numero} ${resto}` : porVeces;
}
