// La comida dicha o escrita de una vez («dos huevos revueltos, una tostada con manteca y un café con
// leche»), leída sin IA (lo pediste el 26/10): cada alimento con su cantidad, lo que hay que buscar
// y si vino después de un «con». Saca las muletillas y los verbos («eh, bueno, comí»), entiende la
// comida que se nombra («en el almuerzo») y las correcciones («dos, no, tres»), completa lo que se
// calla («dos empanadas de carne y una de jamón») y corta el «con» solo si el nombre entero no
// existe: «café con leche» es uno, «tostada con manteca» son dos. Varias comidas en una frase
// (18/11/2026: «en el desayuno…, en el almuerzo… y de snack…») van cada una a su grupo; la que se
// nombra dos veces se suma, y lo que no dice comida queda para la de la hora. Cada pedazo lo lee
// recetaDeTexto.ts; buscar y decidir va en entender.ts. La galería usa este mismo archivo.

import type { Comida } from '../dominio/comidas';
import type { Idioma } from './porciones';
import { leerReceta, nombreDeMedida, type LineaDeReceta, type Tamano, type Unidad } from './recetaDeTexto';

export type Dicho = {
  /** Lo que se dijo de este alimento, para mostrarlo. */
  texto: string;
  /** Lo que se busca en la base. */
  buscado: string;
  cantidad: number | null;
  unidad: Unidad | null;
  tamano?: Tamano;
  /** La medida de la casa como se dijo, en singular («vaso»): la cantidad queda en esa medida. */
  medida?: string;
  /** Vino después de «con» y sin cantidad: va como acompañante, en una porción chica (la manteca de la tostada). */
  acompanante?: true;
  /** «Arroz y pollo», que recetaDeTexto lee como dos: si la base no tiene el nombre entero, va cada uno. */
  partes?: Dicho[];
  /**
   * Se dijo un plato, un bol o una porción sin cuánto (D36): «un plato de fideos». `plato` es el tamaño
   * si se dijo («un plato grande de fideos»), y `recipiente`, si fue un plato u otra cosa: «un bol de
   * cereales» o «una porción de queso» no son un plato de cereales ni de queso.
   */
  vago?: true;
  plato?: 'chico' | 'mediano' | 'grande';
  recipiente?: 'plato' | 'otro';
  /** «Un poco de arroz», «mucho puré»: cuánto, sin número. */
  cuanto?: 'poco' | 'mucho';
};

/**
 * Lo dicho de una comida: `comida` es null si no se nombró (va a la de la hora), y `ayer`, si se dijo
 * «ayer», «anoche», «yesterday» o «last night» (es del día anterior; «anoche», sin otra comida, es la cena).
 */
export type GrupoDicho = { comida: Comida | null; ayer: boolean; dichos: Dicho[] };
/** `grupos`, en el orden en que se nombraron; `dichos`, todos; `comida`, la primera nombrada; `ayer`, si algo es de ayer. */
export type FraseLeida = { dichos: Dicho[]; comida: Comida | null; ayer: boolean; grupos: GrupoDicho[] };

const NUMERO = '(?:\\d+(?:[.,]\\d+)?|un|una|uno|medio|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half)';
/** Lo que abre un alimento nuevo: una cantidad o un artículo. */
const EMPIEZA_ALIMENTO = new RegExp(`^(?:${NUMERO}|un par|unos|unas|el|la|los|las|some|the|a couple|much[oa]s?|bastante|poco|algo de)(?![\\p{L}])`, 'u');

const MULETILLAS = /^(?:(?:eh+|em+|mm+|ah+|oh+|este|bueno|a ver|o sea|nada|mir[aá]|che|pues|entonces|tipo|digamos|hoy|today|well|so|like|um+|uh+|okay|ok|and|y|e)(?![\p{L}])[\s,]*)+/u;
/** «Pan de ayer» no es el día. */
const DIA = /(?<![\p{L}])(?<!de\s)(ayer|yesterday|hoy|today)(?![\p{L}])/gu;
const VERBOS = /^(?:(?:me\s+)?(?:com[ií]|comimos|tom[eé]|tomamos|desayun[eé]|desayunamos|almorc[eé]|almorzamos|merend[eé]|merendamos|cen[eé]|cenamos|picote[eé]|clav[eé]|baj[eé])|(?:he|hemos)\s+(?:comido|tomado|bebido|desayunado|almorzado|merendado|cenado)|(?:i|we)\s+(?:had|ate|drank|just\s+had)|had|ate|drank)(?![\p{L}])\s*/u;

/** Las palabras de cada comida, en español y en inglés, para nombrarla con lo que va antes. */
const PALABRAS_DE_COMIDA: [Comida, string, string][] = [
  ['desayuno', 'desayuno', 'breakfast'],
  ['almuerzo', 'almuerzo', 'lunch'],
  ['merienda', 'merienda', 'afternoon\\s+snack'],
  ['cena', 'cena', 'dinner|supper'],
  ['snack', 'snack|colaci[oó]n|tentempi[eé]|botana', 'snack'],
];
/** «En el almuerzo», «de cena», «para el snack», «for lunch», «as a snack». */
const NOMBRADAS: [RegExp, Comida][] = PALABRAS_DE_COMIDA.map(([c, es, en]) => [new RegExp(
  `(?<![\\p{L}])(?:(?:en|de|para|a|al|como|durante)\\s+(?:el\\s+|la\\s+|un\\s+|una\\s+|mi\\s+)?(?:${es})|(?:for|at|during|as|with)\\s+(?:a\\s+|an\\s+|my\\s+)?(?:${en}))(?![\\p{L}])`,
  'gu',
), c]);

/** Lo que nombra una comida en la frase, en cualquier lugar: la comida, el verbo o el momento del día. */
const MARCAS: [RegExp, Comida, boolean?][] = [
  ...NOMBRADAS,
  // «En la comida» es el almuerzo en México y en España; «la comida», sola, no dice cuál.
  [/(?<![\p{L}])(?:en|para|a|durante)\s+la\s+comida(?![\p{L}])|(?:^|[,.;!?])\s*(?:la\s+)?comida\s*:/gu, 'almuerzo'],
  // El verbo también dice la comida: «desayuné dos huevos», «he cenado», «de cenar».
  [/(?<![\p{L}])(?:(?:me\s+)?desayun[eé]|desayunamos|(?:he|hemos)\s+desayunado|(?:de|para)\s+desayunar)(?![\p{L}])/gu, 'desayuno'],
  [/(?<![\p{L}])(?:(?:me\s+)?almorc[eé]|almorzamos|(?:he|hemos)\s+almorzado|(?:de|para)\s+almorzar|para\s+comer)(?![\p{L}])/gu, 'almuerzo'],
  [/(?<![\p{L}])(?:(?:me\s+)?merend[eé]|merendamos|(?:he|hemos)\s+merendado|(?:de|para)\s+merendar)(?![\p{L}])/gu, 'merienda'],
  [/(?<![\p{L}])(?:(?:me\s+)?cen[eé]|cenamos|(?:he|hemos)\s+cenado|(?:de|para)\s+cenar)(?![\p{L}])/gu, 'cena'],
  // Y el momento del día: «a la noche comí pizza». «A media mañana» es un snack, no el desayuno.
  [/(?<![\p{L}])(?:a|de|en)\s+media\s+ma[ñn]ana(?![\p{L}])/gu, 'snack'],
  [/(?<![\p{L}])(?:a|de|en)\s+media\s+tarde(?![\p{L}])/gu, 'merienda'],
  [/(?<![\p{L}])(?:(?:(?:a|en|por)\s+la|esta)\s+ma[ñn]ana|this\s+morning|in\s+the\s+morning)(?![\p{L}])/gu, 'desayuno'],
  [/(?<![\p{L}])(?:al?\s+mediod[ií]a|at\s+(?:noon|midday))(?![\p{L}])/gu, 'almuerzo'],
  [/(?<![\p{L}])(?:(?:(?:a|en|por)\s+la|esta)\s+tarde|this\s+afternoon|in\s+the\s+afternoon)(?![\p{L}])/gu, 'merienda'],
  [/(?<![\p{L}])(?:(?:(?:a|en|por)\s+la|esta)\s+noche|tonight|at\s+night|this\s+evening|in\s+the\s+evening)(?![\p{L}])/gu, 'cena'],
  [/(?<![\p{L}])(?:anoche|last\s+night)(?![\p{L}])/gu, 'cena', true],
];

/**
 * La comida al empezar una frase, sin nada antes (lo pediste el 30/10/2026): «el desayuno comí…», «la
 * cena fue pizza», «desayuno: dos huevos», «almuerzo de pollo»; también después de una coma, un punto o
 * un «y»: «…, almuerzo milanesa, cena pizza». «La cena de ayer» también dice el día.
 */
const COMIDA_AL_EMPEZAR = /(?:^|[,.;:!?]|\s(?:y|and|then|despu[eé]s|tambi[eé]n|also)(?=\s))\s*(?:(?:y|and|bueno|eh+|em+|este|pues|o sea|a ver|so|well|um+)[\s,]+)*(?:el\s+|la\s+|mi\s+|my\s+)?(desayuno|almuerzo|merienda|cena|snack|colaci[oó]n|tentempi[eé]|breakfast|lunch|dinner|supper)(?![\p{L}])(?:\s+de\s+(hoy|ayer|anoche)(?![\p{L}])|\s+de(?=\s))?\s*(?:[:\-–]|(?:fue|fueron|era|eran|was|were)(?![\p{L}]))?/gu;
const COMIDA_DE_LA_PALABRA: Record<string, Comida> = {
  desayuno: 'desayuno', breakfast: 'desayuno', almuerzo: 'almuerzo', lunch: 'almuerzo', merienda: 'merienda', cena: 'cena', dinner: 'cena', supper: 'cena',
  snack: 'snack', colacion: 'snack', colación: 'snack', tentempie: 'snack', tentempié: 'snack',
};

/** Lo que separa un alimento del siguiente, además de la coma: «después», «también», «de postre», «para tomar». */
const SEPARADORES = new RegExp(
  `\\s*(?:;|\\.(?!\\d)|(?:^|\\s)(?:y\\s+|and\\s+)?(?:despu[eé]s|tambi[eé]n|de postre|de primero|de segundo|para tomar|de tomar|then|also|for dessert|to drink)(?![\\p{L}])|(?:^|\\s)m[aá]s(?=\\s+${NUMERO}(?![\\p{L}])))\\s*`,
  'gu',
);

/** «Dos, no, tres medialunas»: queda la cantidad corregida. */
const CORRECCION = new RegExp(`(?<![\\p{L}])${NUMERO}\\s*,?\\s*(?<![\\p{L}])(?:no|digo|perd[oó]n|mejor)(?![\\p{L}])\\s*,?\\s*(${NUMERO})(?![\\p{L}])`, 'gu');
/**
 * «Dos huevos, no, tres» o «dos medialunas, no, eran tres»: el número corregido va con lo de antes.
 * Lo de antes son palabras sueltas, sin cruzar un «y»: «un café y dos huevos, no, tres».
 */
const CORRECCION_DESPUES = new RegExp(
  `(?<![\\p{L}])${NUMERO}((?:\\s+(?!(?:y|e|and|no|digo|mejor)(?![\\p{L}]))[\\p{L}]+)+?)\\s*,?\\s*(?<![\\p{L}])(?:no|digo|perd[oó]n|mejor|i mean|sorry)(?![\\p{L}])\\s*,?\\s*(?:(?:eran?|fueron|son|mejor|digo|it was|they were)\\s+)?(${NUMERO})(?![\\p{L}])(?=\\s*(?:$|[,.;]|(?:y|e|and)(?![\\p{L}]))|\\1(?:e?s)?(?![\\p{L}]))`,
  'gu',
);
/** «Un café, no, mejor un té»: lo nuevo reemplaza a lo de antes (leerGrupo lo saca). */
const OTRO_ALIMENTO = new RegExp(`\\s*,?\\s+(?:no|digo|perd[oó]n|i mean|sorry)(?:\\s*,)?\\s+(?:(?:mejor|digo|era|fue|it was)\\s+)?(?=(?:${NUMERO}|unos|unas|some)\\s)`, 'gu');
/** Lo que queda de esa corrección, solo: «no», «no, mejor». */
const ES_CORRECCION = /^(?:no|digo|perd[oó]n|i mean|sorry)(?:[\s,]+(?:mejor|digo|era|fue|it was))?$/u;
/** «Un huevo y medio», «una pizza y media»: uno y medio de eso, si cierra lo de antes (cierraLoDeAntes). */
const Y_MEDIO = new RegExp(`(?<![\\p{L}])(${NUMERO})((?:\\s+(?!(?:y|e|and|con|with)(?![\\p{L}]))[\\p{L}]+){1,3}?)\\s+(?:y|and\\s+a)\\s+(?:medio|media|half)(?![\\p{L}])`, 'gu');
/** «Café con dos medialunas»: lo que sigue al «con» con su cantidad es otra cosa, no un acompañante. */
const CON_CANTIDAD = new RegExp(`\\s(?:con|with)\\s+(?=(?:${NUMERO}|un par de|a couple of)\\s)`, 'gu');
/** Lo que queda solo y no es un alimento: una negación, un número o una palabra de unión. */
const VACIO = new RegExp(`^(?:no|s[ií]|ok|okay|nada|algo|eso|esto|eran?|fueron|son|y|e|o|de|con|sin|i|we|${NUMERO}|(?:y|and)\\s+(?:an?\\s+)?(?:medio|media|half))$`, 'u');
/** Lo que se dice al terminar y no es comida: «nomás», «nada más», «y listo», «that's it». */
const AL_TERMINAR = /(?<![\p{L}])(?:y\s+)?(?:nada\s+m[aá]s(?:\s+que)?|nom[aá]s|y\s+listo|(?:y\s+)?eso\s+es\s+todo|(?:and\s+)?that'?s\s+(?:it|all))(?![\p{L}])/gu;
/** Las muletillas en medio de la frase: «comí eh dos huevos», «I ate like three cookies». */
const MULETILLA_EN_MEDIO = new RegExp(`(?<![\\p{L}])(?:eh+|ehm+|em+|mm+|um+|uh+|ah+|(?:este|tipo|like|o sea|digamos)(?=\\s*,|\\s+(?:${NUMERO}|un par|unos|unas)(?![\\p{L}])))(?![\\p{L}])`, 'gu');

const recortar = (s: string) => s.replace(/^[\s,;:.]+|[\s,;:.]+$/g, '').trim();

/** Las palabras que abren una cantidad, para cortar donde la frase dictada no tiene comas: «dos huevos una tostada». */
const ABRE_CANTIDAD_ES = /^(?:\d+(?:[.,]\d+)?|\d*½|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|unos|unas)$/u;
const ABRE_CANTIDAD_EN = /^(?:\d+(?:[.,]\d+)?|\d*½|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve|some)$/u;
/** Lo que, antes de una cantidad, la deja en el mismo alimento: «un plato de dos…», «y medio», «con dos». */
const NO_CORTA_DESPUES = /^(?:de|del|of|con|with|y|e|and|o|or|a|al|en|el|la|los|las|the|por|x|medio|media|half|cada|sin|mas|más|plus|par|docena|dozen|kilo|kilos|litro|litros)$/u;

/**
 * Si el «y medio» que sigue a `antes` es su fracción: al final, antes de una coma, de otro «y» o de un
 * «con» («un huevo y medio»), o antes de «de X» si lo de antes no tenía su «de» («una taza y media de
 * arroz»). Si sigue un alimento («y media palta») o lo de antes ya tenía su «de» («una cucharada de
 * aceite y media de manteca»), es otro alimento. `despues` es lo que sigue al «medio».
 */
function cierraLoDeAntes(antes: string, despues: string): boolean {
  if (/^\s*(?:$|[,.;]|(?:y|e|and|con|with)(?![\p{L}]))/u.test(despues)) return true;
  return /^\s+(?:de|of)\s/u.test(despues) && !/(?<![\p{L}])(?:de|del|of)(?![\p{L}])/u.test(antes);
}
const SOLO_NUMERO = new RegExp(`^${NUMERO}$`, 'u');

/** Corta en las comas (no en «1,5»), en «y» cuando sigue otro alimento («jamón y queso» queda junto, y «y medio» que cierra lo de antes es cantidad) y donde empieza otra cantidad. */
function pedazos(texto: string, idioma: Idioma): string[] {
  const salida: string[] = [];
  for (const p of texto.split(/,(?!\d)/)) {
    let desde = 0;
    for (const m of p.matchAll(/\s(?:y|e|and)\s/gu)) {
      const derecha = p.slice(m.index + m[0].length);
      const medio = /^(?:an?\s+)?(?:medio|media|half)(?![\p{L}])/u.exec(derecha);
      const antes = limpiar(p.slice(desde, m.index));
      // «Two and a half eggs»: después de un número solo, siempre es la fracción.
      const fraccion = medio && (SOLO_NUMERO.test(antes) || cierraLoDeAntes(antes, derecha.slice(medio[0].length)));
      if (EMPIEZA_ALIMENTO.test(derecha) && !fraccion) {
        salida.push(...sinComas(p.slice(desde, m.index), idioma));
        desde = m.index + m[0].length;
      }
    }
    salida.push(...sinComas(p.slice(desde), idioma));
  }
  return salida.map(recortar).filter(Boolean);
}

/** Lo dictado sin comas: «2 huevos 1 tostada 1 café» son tres, si empieza con una cantidad y cada una sigue a un nombre. */
function sinComas(p: string, idioma: Idioma): string[] {
  const abre = idioma === 'en' ? ABRE_CANTIDAD_EN : ABRE_CANTIDAD_ES;
  const palabras = limpiar(p).split(/\s+/);
  if (palabras.length < 3 || !abre.test(palabras[0])) return [p];
  const salida: string[] = [];
  let desde = 0;
  for (let i = 2; i < palabras.length - 1; i++) {
    if (abre.test(palabras[i]) && !abre.test(palabras[i - 1]) && !NO_CORTA_DESPUES.test(palabras[i - 1]) && !/^(?:vez|veces|time|times)$/u.test(palabras[i + 1])) {
      salida.push(palabras.slice(desde, i).join(' '));
      desde = i;
    }
  }
  salida.push(palabras.slice(desde).join(' '));
  return salida;
}

/** Sin muletillas ni verbos al principio: «eh bueno comí dos empanadas» → «dos empanadas». */
const limpiar = (s: string) => recortar(recortar(s).replace(MULETILLAS, '').replace(VERBOS, '').replace(MULETILLAS, ''));

/** «X con Y y Z»: lo de antes del «y» que sigue al «con», y lo de después, que es otra cosa salvo que el nombre entero exista. */
const CON_Y = /^(.*?\s(?:con|with)\s.+?)\s(?:y|e|and)\s(.+)$/u;
/** Dónde está cada «con» de un pedazo: «café con leche con tostadas» tiene dos. */
const losCon = (p: string) => [...p.matchAll(/\s(?:con|with)\s/gu)].map((m) => ({ antes: p.slice(0, m.index), despues: p.slice(m.index + m[0].length) }));

/** Los «X con Y» de la frase, para saber antes cuáles son un solo alimento de la base («café con leche»). */
export function conCon(texto: string, idioma: Idioma): string[] {
  const lista: string[] = [];
  for (const g of enComidas(texto, idioma)) {
    for (const p of pedazos(prepararGrupo(g.texto), idioma)) {
      const limpio = limpiar(p);
      const cons = losCon(limpio);
      if (!cons.length) continue;
      lista.push(leerUno(limpio, idioma).buscado);
      // «Café con leche con tostadas»: también lo de antes del segundo «con».
      for (const c of cons.slice(1)) lista.push(leerUno(c.antes, idioma).buscado);
      const y = CON_Y.exec(limpio);
      if (y) lista.push(leerUno(y[1], idioma).buscado);
    }
  }
  return lista;
}

/**
 * Si un nombre de la base es lo dicho. conCon deja «yogur con fruta» en singular y la base lo tiene como
 * «Yogur con frutas»: sin el plural se cortaba en el «con» y salía otra cosa. Solo con una palabra después
 * del «con»: «milanesa con papas fritas» se sigue cortando, porque las papas se preguntan aparte.
 */
export function mismoNombre(a: string, b: string): boolean {
  const palabras = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const [x, y] = [palabras(a), palabras(b)];
  if (x.join(' ') === y.join(' ')) return true;
  const con = y.findIndex((p) => p === 'con' || p === 'with');
  if (con < 0 || y.length - con !== 2 || x.length !== y.length) return false;
  const sinPlural = (p: string) => p.replace(/(?<=[aeiou])s$/, '');
  return x.every((p, i) => sinPlural(p) === sinPlural(y[i]));
}

// ------------------------------------------------------------ los números con palabras
const CENTENAS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300, trescientas: 300, cuatrocientos: 400, cuatrocientas: 400,
  quinientos: 500, quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700, setecientas: 700, ochocientos: 800, ochocientas: 800,
  novecientos: 900, novecientas: 900,
};
const DECENAS: Record<string, number> = { treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90 };
const DE_DIEZ_A_VEINTINUEVE: Record<string, number> = {
  diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, dieciséis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintidós: 22, veintitres: 23, veintitrés: 23, veinticuatro: 24,
  veinticinco: 25, veintiseis: 26, veintiséis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29,
};
const UNIDADES: Record<string, number> = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9 };
const EN_UNIDADES: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
const EN_DIEZ: Record<string, number> = { ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19 };
const EN_DECENAS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const llaves = (r: Record<string, number>) => Object.keys(r).sort((a, b) => b.length - a.length).join('|');
const NUMERO_GRANDE_ES = new RegExp(
  `(?<![\\p{L}])(?:(${llaves(CENTENAS)})(?:\\s+(?:(${llaves(DECENAS)})(?:\\s+y\\s+(${llaves(UNIDADES)}))?|(${llaves(DE_DIEZ_A_VEINTINUEVE)})|(${llaves(UNIDADES)})(?=\\s+(?:g|gr|gramos?|ml|cc|kcal|calor[ií]as)(?![\\p{L}]))))?|(${llaves(DECENAS)})(?:\\s+y\\s+(${llaves(UNIDADES)}))?|(trece|catorce|diecis[eé]is|diecisiete|dieciocho|diecinueve|veinti[\\p{L}]+))(?![\\p{L}])`,
  'gu',
);
const NUMERO_GRANDE_EN = new RegExp(
  `(?<![\\p{L}])(?:(?:(a|one|${llaves(EN_UNIDADES)})\\s+hundred(?:\\s+(?:and\\s+)?(?:(${llaves(EN_DECENAS)})(?:[\\s-]+(${llaves(EN_UNIDADES)}))?|(${llaves(EN_DIEZ)})))?)|(${llaves(EN_DECENAS)})(?:[\\s-]+(${llaves(EN_UNIDADES)}))?|(thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))(?![\\p{L}])`,
  'gu',
);

/** «Doscientos gramos», «ciento cincuenta», «two hundred»: en cifras. Los chicos («dos», «doce») ya los lee recetaDeTexto. */
function numerosEnCifras(s: string, idioma: Idioma): string {
  if (idioma === 'en') {
    return s.replace(NUMERO_GRANDE_EN, (todo, cientos?: string, decena?: string, unidad?: string, diez?: string, decenaSola?: string, unidadSola?: string, teen?: string) => {
      if (teen) return String(EN_DIEZ[teen]);
      if (decenaSola) return String(EN_DECENAS[decenaSola] + (unidadSola ? EN_UNIDADES[unidadSola] : 0));
      const c = cientos === 'a' || cientos === 'one' ? 1 : EN_UNIDADES[cientos ?? ''] ?? 1;
      return String(100 * c + (decena ? EN_DECENAS[decena] + (unidad ? EN_UNIDADES[unidad] : 0) : diez ? EN_DIEZ[diez] : 0));
    });
  }
  return s.replace(NUMERO_GRANDE_ES, (todo, cientos?: string, decena?: string, unidad?: string, especial?: string, suelta?: string, decenaSola?: string, unidadSola?: string, chico?: string) => {
    if (chico) return DE_DIEZ_A_VEINTINUEVE[chico] !== undefined ? String(DE_DIEZ_A_VEINTINUEVE[chico]) : todo;
    if (decenaSola) return String(DECENAS[decenaSola] + (unidadSola ? UNIDADES[unidadSola] : 0));
    const resto = decena ? DECENAS[decena] + (unidad ? UNIDADES[unidad] : 0) : especial ? DE_DIEZ_A_VEINTINUEVE[especial] : suelta ? UNIDADES[suelta] : 0;
    return String(CENTENAS[cientos ?? ''] + resto);
  });
}

// ------------------------------------------------------------ las comidas de la frase
type Marca = { desde: number; hasta: number; comida: Comida; ayer: boolean };
type Tramo = { comida: Comida | null; ayer: boolean; texto: string };

/** Todo lo que nombra una comida, en orden y sin pisarse: si dos se pisan, gana la que empieza antes y, si no, la más larga. */
function marcasDe(s: string): Marca[] {
  const todas: Marca[] = [];
  for (const [re, comida, ayer] of MARCAS) {
    for (const m of s.matchAll(re)) todas.push({ desde: m.index, hasta: m.index + m[0].length, comida, ayer: !!ayer });
  }
  for (const m of s.matchAll(COMIDA_AL_EMPEZAR)) {
    todas.push({ desde: m.index, hasta: m.index + m[0].length, comida: COMIDA_DE_LA_PALABRA[m[1]], ayer: m[2] === 'ayer' || m[2] === 'anoche' });
  }
  todas.sort((a, b) => a.desde - b.desde || b.hasta - a.hasta);
  const marcas: Marca[] = [];
  for (const m of todas) if (!marcas.length || m.desde >= marcas[marcas.length - 1].hasta) marcas.push(m);
  return marcas;
}

/** Si un tramo no tiene comida: solo uniones, muletillas o nada («y», «y también», «comí»). */
const sinComida = (t: string) => !limpiar(t.replace(/(?<![\p{L}])(?:y|e|and|then|tambi[eé]n|also|despu[eé]s|que)(?![\p{L}])/gu, ' '));

/**
 * La frase en tramos, cada uno con su comida (o null) y su día. Lo de cada comida va después de
 * nombrarla («en el desayuno dos huevos, en el almuerzo…») o, si la frase termina en una comida, antes
 * («dos huevos en el desayuno»). «Ayer» y «hoy» valen desde donde se dicen: para la comida que sigue
 * si no hay nada en el medio, y para las que vienen después.
 */
function tramos(s: string): Tramo[] {
  const dias = [...s.matchAll(DIA)];
  // El texto sin los días, del mismo largo: «hoy el almuerzo fue…» empieza con la comida, y los lugares siguen valiendo.
  let plano = s;
  for (const d of dias) plano = plano.slice(0, d.index) + ' '.repeat(d[0].length) + plano.slice(d.index + d[0].length);
  const marcas = marcasDe(plano);
  // El tramo 0 es lo de antes de la primera comida; el i + 1, lo de después de la marca i.
  const limites = [{ desde: 0, hasta: marcas[0]?.desde ?? s.length }, ...marcas.map((m, i) => ({ desde: m.hasta, hasta: marcas[i + 1]?.desde ?? s.length }))];
  const diaDe: ('ayer' | 'hoy' | undefined)[] = limites.map(() => undefined);
  for (const d of dias) {
    const k = limites.findIndex((l) => d.index >= l.desde && d.index < l.hasta);
    if (k < 0) continue;
    const siguiente = k + 1 < limites.length && sinComida(plano.slice(d.index + d[0].length, limites[k].hasta)) ? k + 1 : k;
    diaDe[siguiente] = d[1] === 'ayer' || d[1] === 'yesterday' ? 'ayer' : 'hoy';
  }
  let ayer = false;
  const delDia = limites.map((_, k) => {
    if (diaDe[k]) ayer = diaDe[k] === 'ayer';
    if (k > 0 && marcas[k - 1].ayer) ayer = true;
    return ayer;
  });
  const textos = limites.map((l) => plano.slice(l.desde, l.hasta));
  const alFinal = marcas.length > 0 && !sinComida(textos[0]) && sinComida(textos[textos.length - 1]);
  if (alFinal) {
    // «Dos huevos en el desayuno y un café en el almuerzo»: cada comida se lleva lo de antes.
    return marcas.map((m, i) => ({ comida: m.comida, ayer: delDia[i] || delDia[i + 1], texto: textos[i] }));
  }
  return textos.map((texto, k) => ({ comida: k === 0 ? null : marcas[k - 1].comida, ayer: delDia[k], texto }));
}

/** La frase lista para partir: en minúsculas, con los números grandes en cifras y sin muletillas en el medio. */
function normalizar(texto: string, idioma: Idioma): string {
  const s = ` ${texto.toLowerCase().replace(/\s+/g, ' ')} `;
  return numerosEnCifras(s, idioma)
    .replace(AL_TERMINAR, ' ')
    .replace(MULETILLA_EN_MEDIO, ' ')
    // «I also had oatmeal»: el «also» no separa nada ahí.
    .replace(/(?<![\p{L}])(i|we)\s+(?:also|just|then)\s+(had|ate|drank)(?![\p{L}])/gu, '$1 $2')
    .replace(/ {2,}/g, ' ');
}

/** Los tramos de la frase con lo que dicen, juntos por comida y día: «y también en el desayuno…» se suma al desayuno. */
function enComidas(texto: string, idioma: Idioma): Tramo[] {
  const juntos: Tramo[] = [];
  for (const t of tramos(normalizar(texto, idioma))) {
    const limpio = t.texto.replace(/^[\s,;:.]*(?:(?:y|e|and|then|tambi[eé]n|also|despu[eé]s)(?![\p{L}])[\s,]*)*/u, '').replace(/(?:[\s,;:.]+|(?<![\p{L}])(?:y|e|and|then|tambi[eé]n|also|despu[eé]s)(?![\p{L}]))+$/u, '');
    if (sinComida(limpio)) continue;
    const igual = juntos.find((j) => j.comida === t.comida && j.ayer === t.ayer);
    if (igual) igual.texto = `${igual.texto}, ${limpio}`;
    else juntos.push({ ...t, texto: limpio });
  }
  return juntos;
}

/** Lo de una comida, con las correcciones hechas y los separadores como comas. */
function prepararGrupo(texto: string): string {
  let s = ` ${texto} `;
  s = s.replace(CORRECCION, (_, segundo: string) => segundo);
  s = s.replace(CORRECCION_DESPUES, (_, cosa: string, segundo: string) => `${segundo}${cosa}`);
  // «Dos huevos, no, tres huevos»: el nombre repetido queda una vez.
  s = s.replace(/(?<![\p{L}])(\p{L}{3,}?)(e?s)?\s+\1(e?s)?(?![\p{L}])/gu, '$1$3');
  s = s.replace(OTRO_ALIMENTO, ', no, ');
  s = s.replace(CON_CANTIDAD, ', ');
  s = s.replace(SEPARADORES, ', ');
  // Después de los separadores: «un huevo y medio después un café» ya tiene la coma que lo cierra.
  s = s.replace(Y_MEDIO, (todo: string, n: string, cosa: string, desde: number, todoElTexto: string) => {
    if (!cierraLoDeAntes(cosa, todoElTexto.slice(desde + todo.length))) return todo;
    const valor = VALOR_DE_PALABRA[n] ?? Number(n.replace(',', '.'));
    return Number.isInteger(valor) && valor > 0 ? `${valor}½${cosa}` : todo;
  });
  return s.trim();
}

const PALABRA_CANTIDAD = new RegExp(`^(?:${NUMERO}|un par de|unos|unas|el|la|los|las|some|the)\\s+`, 'u');
const TAMANO_DICHO = 'chic[oa]s?|median[oa]s?|grandes?|gran|buen|peque[nñ][oa]s?|abundantes?|llen[oa]s?|colmad[oa]s?|bien\\s+servid[oa]s?|small|medium|large|big|full';
/**
 * El plato, el bol o la porción, con cuántos y su tamaño, antes o después («un plato grande», «a big
 * plate»). Sin número es uno («plato de fideos»); «½» y «1½» quedan así (el segundo, de Y_MEDIO).
 */
const DEL_RECIPIENTE = `(?:(${NUMERO}|\\d*½|\\d+\\/\\d+|un\\s+cuarto\\s+de|tres\\s+cuartos\\s+de|un\\s+tercio\\s+de|half\\s+a|a\\s+quarter\\s+of|a\\s+third\\s+of)\\s+)?(?:(${TAMANO_DICHO})\\s+)?(plat(?:os?|itos?|azos?)|bol(?:es)?|bowls?|taz[oó]n(?:es)?|cuencos?|porci[oó]n(?:es)?|raci[oó]n(?:es)?|plates?|servings?)(\\s+y\\s+medio)?(?:\\s+(?:hond[oa]s?|play[oa]s?))?(?:\\s+(${TAMANO_DICHO}))?`;
/** «Un plato de arroz»: el plato, el bol o la porción son una porción de lo que sigue. */
const RECIPIENTE = new RegExp(`^${DEL_RECIPIENTE}\\s+(?:de|of)\\s+`, 'u');
/** «Fideos, un plato grande»: el plato solo, de lo que se dijo antes. */
const SOLO_RECIPIENTE = new RegExp(`^${DEL_RECIPIENTE}$`, 'u');
const TAMANO_DEL_PLATO: Record<string, 'chico' | 'mediano' | 'grande'> = {
  chic: 'chico', pequ: 'chico', smal: 'chico', medi: 'mediano', gran: 'grande', buen: 'grande', abun: 'grande', llen: 'grande', colm: 'grande', bien: 'grande', larg: 'grande', big: 'grande', full: 'grande',
};
/** Lo que no es una palabra de cantidad de las de siempre: «un cuarto de plato». */
const FRACCION_DEL_PLATO: Record<string, number> = { 'un cuarto de': 0.25, 'tres cuartos de': 0.75, 'un tercio de': 0.33, 'half a': 0.5, 'a quarter of': 0.25, 'a third of': 0.33 };
/** El tamaño que se dijo después del alimento, como lo lee recetaDeTexto: «un plato de fideos grande», «milanesa grande». */
export const TAMANO_DE_LA_RECETA: Record<Tamano, 'chico' | 'mediano' | 'grande'> = { pequeno: 'chico', mediano: 'mediano', grande: 'grande' };
/** «Un poco de arroz», «mucho puré», «bastante ensalada». */
const POCO = /^(?:un\s+poco(?:\s+de)?|un\s+poquito(?:\s+de)?|poquito(?:\s+de)?|poco(?:\s+de)?|algo\s+de|a\s+little(?:\s+bit)?(?:\s+of)?|a\s+bit\s+of)\s+/u;
const MUCHO = /^(?:much[oa]s?(?:\s+de)?|bastante(?:\s+de)?|un\s+mont[oó]n\s+de|a\s+lot\s+of|lots\s+of|plenty\s+of)\s+/u;

function dichoDeLinea(texto: string, l: LineaDeReceta, idioma: Idioma): Dicho {
  const medida = l.unidad ? nombreDeMedida(l.unidad, idioma) : null;
  return { texto, buscado: l.buscado, cantidad: l.cantidad, unidad: l.unidad, ...(l.tamano ? { tamano: l.tamano } : {}), ...(medida ? { medida } : {}) };
}

/** Un pedazo: con recetaDeTexto; si no encuentra el alimento («un cortado» le parece una preparación), lo que queda sin la cantidad. */
function leerUno(original: string, idioma: Idioma): Dicho {
  const cuanto = POCO.exec(original) ?? MUCHO.exec(original);
  if (cuanto) return { ...leerSinRecipiente(original, original.slice(cuanto[0].length), idioma), cantidad: null, cuanto: POCO.test(original) ? 'poco' : 'mucho' };
  const recipiente = RECIPIENTE.exec(original);
  if (!recipiente) return leerSinRecipiente(original, original, idioma);
  const [todo, numero = '1', antes, cual, yMedio, despues] = recipiente;
  const cuantos = FRACCION_DEL_PLATO[numero] ?? numero;
  // «Plato y medio», sin número: con número, Y_MEDIO ya lo dejó en «1½».
  const conMedio = yMedio ? (VALOR_DE_PALABRA[cuantos] ?? Number(cuantos)) + 0.5 : cuantos;
  const leido = leerSinRecipiente(original, `${conMedio} ${original.slice(todo.length)}`, idioma);
  const porLaPalabra = cual.startsWith('platit') ? 'chico' as const : cual.startsWith('plataz') ? 'grande' as const : undefined;
  const dicho = despues ?? antes;
  const plato = dicho ? TAMANO_DEL_PLATO[dicho.slice(0, 4)] ?? TAMANO_DEL_PLATO[dicho.slice(0, 3)] : porLaPalabra ?? (leido.tamano ? TAMANO_DE_LA_RECETA[leido.tamano] : undefined);
  return { ...leido, vago: true, recipiente: /^plat/.test(cual) ? 'plato' : 'otro', ...(plato ? { plato } : {}) };
}

/**
 * Lo que recetaDeTexto lee como medida o tamaño y acá es parte del nombre: «una barrita de cereal» es
 * una barra de cereal, no un paquete de cereales, y «un big mac» no es un «mac» grande.
 */
const BARRA = /(?<![\p{L}])barr(?:a|ita)s?\s+de\s+/u;
const CON_TAMANO_EN_EL_NOMBRE = /(?<![\p{L}])big\s+(?:mac|tasty)(?![\p{L}])/u;
function conSuNombre(l: LineaDeReceta, texto: string): LineaDeReceta {
  const nombre = CON_TAMANO_EN_EL_NOMBRE.exec(texto);
  if (nombre) return { ...l, buscado: nombre[0], tamano: undefined };
  if (l.unidad === 'paquete' && BARRA.test(texto)) return { ...l, buscado: `barra de ${l.buscado}`, unidad: null };
  return l;
}

function leerSinRecipiente(original: string, texto: string, idioma: Idioma): Dicho {
  // Este pedazo ya es un solo alimento: si recetaDeTexto lo parte en el «y» («jamón y queso»), se junta.
  const lineas = leerReceta(texto, idioma).lineas.filter((x) => x.buscado).map((x) => conSuNombre(x, x.texto));
  const [l] = lineas;
  if (l) {
    const buscado = lineas.length > 1 ? lineas.map((x) => x.buscado).join(idioma === 'en' ? ' and ' : ' y ') : l.buscado;
    const partes = lineas.length > 1 ? lineas.map((x) => dichoDeLinea(x.texto, x, idioma)) : null;
    return { ...dichoDeLinea(original, { ...l, buscado }, idioma), ...(partes ? { partes } : {}) };
  }
  const primera = /^(\S+)\s/.exec(texto)?.[1] ?? '';
  const n = VALOR_DE_PALABRA[primera] ?? Number(primera.replace(',', '.'));
  return { texto: original, buscado: texto.replace(PALABRA_CANTIDAD, '').trim(), cantidad: primera && Number.isFinite(n) ? n : null, unidad: null };
}

const VALOR_DE_PALABRA: Record<string, number> = {
  un: 1, una: 1, uno: 1, a: 1, an: 1, one: 1, medio: 0.5, media: 0.5, half: 0.5, dos: 2, two: 2, tres: 3, three: 3, cuatro: 4, four: 4,
  cinco: 5, five: 5, seis: 6, six: 6, siete: 7, seven: 7, ocho: 8, eight: 8, nueve: 9, nine: 9, diez: 10, ten: 10, doce: 12, twelve: 12,
};

const SOLO_CUANTOS = new RegExp(`^(?:como|unos|unas|about|around|like)?\\s*(\\d+|${NUMERO})\\s+(?:piezas?|unidades|pieces|rolls?)$`, 'u');

/** Lo de una comida, alimento por alimento. */
function leerGrupo(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean): Dicho[] {
  const dichos: Dicho[] = [];
  let anterior: Dicho | null = null;
  // Cuántos sumó el último pedazo: «un café, no, un té» los saca.
  let ultimos = 0;
  let corregir = false;
  // Cada detalle callado («dos de carne») y lo dicho sin detalle de donde sale («cuatro empanadas»).
  const detalleDe = new Map<Dicho, Dicho>();
  for (const pedazo of pedazos(prepararGrupo(texto), idioma)) {
    if (ES_CORRECCION.test(recortar(pedazo))) {
      corregir = true;
      continue;
    }
    let p = limpiar(pedazo);
    if (!p) continue;
    if (corregir) {
      dichos.splice(dichos.length - ultimos, ultimos);
      anterior = dichos[dichos.length - 1] ?? null;
      corregir = false;
    }
    const antes = dichos.length;
    // «Fideos, un plato grande»: el plato es de lo de antes, si no tenía cuánto; solo, no es un alimento.
    if (SOLO_RECIPIENTE.test(p)) {
      if (anterior && anterior.cantidad === null && !anterior.unidad && !anterior.cuanto) {
        const conPlato = leerUno(`${p} de ${anterior.texto}`, idioma);
        dichos[dichos.indexOf(anterior)] = conPlato;
        anterior = conPlato;
      }
      continue;
    }
    // «Sushi, como doce piezas»: cuántos, de lo de antes.
    const cuantos = SOLO_CUANTOS.exec(p);
    if (cuantos) {
      if (anterior && anterior.cantidad === null && !anterior.unidad) {
        const contado = leerUno(`${cuantos[1]} ${anterior.texto}`, idioma);
        dichos[dichos.indexOf(anterior)] = contado;
        anterior = contado;
      }
      continue;
    }
    // Lo que se calla es lo de antes: «dos empanadas de carne y una de jamón» (la empanada), «200 g de
    // arroz y 150 de pollo» o «un vaso de leche y uno de jugo» (la unidad), o «un plato de arroz y uno de
    // fideos» (el plato).
    const elipsis = new RegExp(`^(${NUMERO})\\s+de\\s+`, 'u').exec(p);
    let general: Dicho | null = null;
    if (elipsis && anterior) {
      // «uno de jugo» es «un vaso de jugo».
      const cuanto = elipsis[1] === 'uno' ? 'un' : elipsis[1];
      const recipiente = `${anterior.recipiente === 'otro' ? 'porción' : 'plato'}${anterior.plato ? ` ${anterior.plato}` : ''}`;
      const palabra = anterior.buscado.split(' ')[0];
      p = `${cuanto} ${anterior.vago ? recipiente : anterior.unidad ?? palabra} de ${p.slice(elipsis[0].length)}`;
      general = detalleDe.get(anterior) ?? (!anterior.vago && !anterior.unidad && anterior.buscado === palabra ? anterior : null);
    }
    // «Café con leche y medialunas»: lo de después del «y» es otra cosa, salvo que el nombre entero exista.
    let resto: string | null = null;
    const y = CON_Y.exec(p);
    if (y && !esNombre(leerUno(p, idioma).buscado)) {
      p = y[1];
      resto = y[2];
    }
    const leido = leerUno(p, idioma);
    const cons = esNombre(leido.buscado) ? [] : losCon(p);
    if (cons.length) {
      // «Café con leche con tostadas»: se corta en el último «con» que deja un nombre de la base antes; si
      // no hay, en el primero. Lo de después, con cada «con», son acompañantes.
      const corte = [...cons].reverse().find((c) => esNombre(leerUno(c.antes, idioma).buscado)) ?? cons[0];
      const principal = leerUno(corte.antes, idioma);
      dichos.push(principal);
      for (const parte of corte.despues.split(/\s(?:con|with)\s/u)) {
        const despues = leerUno(parte, idioma);
        dichos.push(despues.cantidad === null ? { ...despues, acompanante: true } : despues);
      }
      anterior = principal;
    } else {
      dichos.push(leido);
      anterior = leido;
    }
    if (general) detalleDe.set(anterior, general);
    if (resto) {
      const otro = leerUno(resto, idioma);
      // «Tostada con manteca y mermelada»: también acompaña. «Café con leche y medialunas»: no.
      dichos.push(cons.length && otro.cantidad === null ? { ...otro, acompanante: true } : otro);
    }
    ultimos = dichos.length - antes;
  }
  // «Cuatro empanadas, dos de carne y dos de jamón»: si los detalles suman lo mismo, lo de antes era el total.
  const esElTotal = (d: Dicho) => {
    const detalles = dichos.filter((x) => detalleDe.get(x) === d);
    return detalles.length > 0 && detalles.reduce((suma, x) => suma + (x.cantidad ?? NaN), 0) === d.cantidad;
  };
  return dichos.filter((d) => d.buscado && !VACIO.test(d.buscado) && !esElTotal(d));
}

/**
 * Lee la frase. `esNombre` dice si un «X con Y» es un alimento de la base (lo busca quien llama, con
 * conCon): si no, se corta en dos y lo de después del «con», sin cantidad, va como acompañante.
 */
export function leerFrase(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean = () => false): FraseLeida {
  const grupos = enComidas(texto, idioma)
    .map((t) => ({ comida: t.comida, ayer: t.ayer, dichos: leerGrupo(t.texto, idioma, esNombre) }))
    .filter((g) => g.dichos.length > 0);
  return {
    grupos,
    dichos: grupos.flatMap((g) => g.dichos),
    comida: grupos.find((g) => g.comida)?.comida ?? null,
    ayer: grupos.some((g) => g.ayer),
  };
}

/** Los grupos con comida: lo que no la dijo va a `laDeLaHora` (y a su día), y lo que cae en la misma comida y día, junto. */
export function porComida(grupos: readonly GrupoDicho[], laDeLaHora: Comida, ayerDeLaHora = false): { comida: Comida; ayer: boolean; dichos: Dicho[] }[] {
  const juntos: { comida: Comida; ayer: boolean; dichos: Dicho[] }[] = [];
  for (const g of grupos) {
    const comida = g.comida ?? laDeLaHora;
    const ayer = g.comida ? g.ayer : g.ayer || ayerDeLaHora;
    const igual = juntos.find((j) => j.comida === comida && j.ayer === ayer);
    if (igual) igual.dichos.push(...g.dichos);
    else juntos.push({ comida, ayer, dichos: [...g.dichos] });
  }
  return juntos;
}
