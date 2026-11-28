// La comida dicha o escrita de una vez («dos huevos revueltos, una tostada con manteca y un café con
// leche»), leída sin IA (lo pediste el 26/10): cada alimento con su cantidad, lo que hay que buscar
// y si vino después de un «con». Saca las muletillas y los verbos («eh, bueno, comí»), entiende la
// comida que se nombra («en el almuerzo») y las correcciones («dos, no, tres»), completa lo que se
// calla («dos empanadas de carne y una de jamón») y corta el «con» solo si el nombre entero no
// existe: «café con leche» es uno, «tostada con manteca» son dos. Varias comidas en una frase
// (18/11/2026: «en el desayuno…, en el almuerzo… y de snack…») van cada una a su grupo; la que se
// nombra dos veces se suma, y lo que no dice comida queda para la de la hora. Un plato dicho con lo que
// lleva (27/11/2026: «un batido de banana, leche y avena») se abre en sus ingredientes, que guardan el
// nombre del plato, y lo que la persona guardó se reconoce por su nombre entero («mi batido de la
// mañana»). Cada pedazo lo lee recetaDeTexto.ts; buscar y decidir va en entender.ts. La galería usa este
// mismo archivo.

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
  /** Es parte de un plato que se dijo con lo que lleva («un batido de banana, leche y avena»): el nombre del plato, para guardarlo después. */
  grupo?: string;
  /** «Un batido de kiwi»: si la base no tiene ese nombre, es el batido con lo que lleva (lo decide entender.ts). */
  lleva?: Dicho[];
  /** Es algo que la persona guardó, dicho por su nombre: cuál de los nombres que recibió leerFrase. */
  tuyo?: number;
  /** Lo tuyo se nombró sin dudas («mi asado», «el asado de siempre» o la frase entera): una comida guardada que se llama como algo de la base solo va así. */
  sinDudas?: true;
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

const MULETILLAS = /^(?:(?:eh+|em+|mm+|ah+|oh+|este|bueno|a ver|o sea|nada|mir[aá]|che|pues|entonces|tipo|digamos|como siempre|primero|first|hoy|today|well|so|like|um+|uh+|okay|ok|and|y|e)(?![\p{L}])[\s,]*)+/u;
/** «Pan de ayer» no es el día. */
const DIA = /(?<![\p{L}])(?<!de\s)(ayer|yesterday|hoy|today)(?![\p{L}])/gu;
/**
 * También en presente («me tomo un batido») y lo que uno se prepara o está por comer («me hice», «voy a comer»).
 * «Como bebida», «como postre» o «como acompañamiento» no son el verbo.
 */
const VERBOS = /^(?!como\s+(?:bebida|acompa[ñn]amiento|postre|entrada|guarnici[oó]n|plato)(?![\p{L}]))(?:(?:me\s+)?(?:com[ioí]|comimos|tom[eéo]|tomamos|beb[ioí]|desayun[eé]|desayunamos|almorc[eé]|almorzamos|merend[eé]|meriendo|merendamos|cen[eéo]|cenamos|picote[eé]|clav[eé]|baj[eé]|hice|hago|prepar[eéo]|arm[eéo])|(?:me\s+)?(?:voy|vamos)\s+a\s+(?:comer|tomar|beber|desayunar|almorzar|merendar|cenar|hacer|preparar)(?:me)?|estoy\s+(?:comiendo|tomando|desayunando|almorzando|merendando|cenando)|(?:he|hemos)\s+(?:comido|tomado|bebido|desayunado|almorzado|merendado|cenado)|(?:i|we)\s+(?:had|ate|drank|just\s+had|have|made|make|eat|drink)(?:\s+myself)?|(?:i['’]?m|i\s+am|we['’]?re|we\s+are)\s+(?:having|eating|drinking|making)|had|ate|drank)(?![\p{L}])\s*/u;

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
  [/(?<![\p{L}])(?:(?:me\s+)?merend[eé]|meriendo|merendamos|(?:he|hemos)\s+merendado|(?:de|para)\s+merendar)(?![\p{L}])/gu, 'merienda'],
  [/(?<![\p{L}])(?:(?:me\s+)?cen[eéo]|cenamos|(?:he|hemos)\s+cenado|(?:de|para)\s+cenar)(?![\p{L}])/gu, 'cena'],
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

/**
 * Lo que separa un alimento del siguiente, además de la coma: «después», «también», «de postre», «para tomar»,
 * «como bebida», «como acompañamiento». También pegado a otro separador: «Dos huevos. Después un café».
 */
const SEPARADORES = new RegExp(
  `\\s*(?:;|\\.(?!\\d)|(?<![\\p{L}\\d])(?:y\\s+|and\\s+)?(?:despu[eé]s|luego|tambi[eé]n|adem[aá]s|de postre|como postre|como (?:bebida|acompa[ñn]amiento|guarnici[oó]n|entrada|plato (?:principal|fuerte|de fondo))|para acompa[ñn]ar|de primero|de segundo|para tomar|de tomar|then|also|for dessert|to drink|as a (?:side|drink)|for a side)(?![\\p{L}])|(?<![\\p{L}\\d])m[aá]s(?=\\s+${NUMERO}(?![\\p{L}])))\\s*`,
  'gu',
);
/** Donde termina lo que se venía diciendo (un separador, o la comida que se vuelve a nombrar): ahí termina también la lista de un plato. */
const CIERRE = '\u0001';

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
/** Lo que queda solo y no es un alimento: una negación, un número, una palabra de unión o el hielo (la base solo tiene el raspado con jarabe). */
const VACIO = new RegExp(`^(?:no|s[ií]|ok|okay|nada|algo|eso|esto|eran?|fueron|son|y|e|o|de|con|sin|i|we|hielo|cubitos? de hielo|ice|ice cubes?|${NUMERO}|(?:y|and)\\s+(?:an?\\s+)?(?:medio|media|half))$`, 'u');
/**
 * Lo dicho que termina en «de» sin lo que sigue: la frase se cortó («…y una taza de»). No se busca: la base daba
 * cualquier cosa («un vaso de» era un refresco, y «un plato de», 1665 kcal).
 */
const CORTADO = /(?<![\p{L}])(?:de|del|of)[\s.,;:!?…]*$/u;
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

/** Corta en las comas (no en «1,5»), en «y» cuando sigue otro alimento o un verbo («jamón y queso» queda junto, y «y medio» que cierra lo de antes es cantidad) y donde empieza otra cantidad. */
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
      if ((EMPIEZA_ALIMENTO.test(derecha) || VERBOS.test(derecha)) && !fraccion) {
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
    // Después de los dos puntos de un plato que se arma tampoco: «un batido de: una banana» sigue junto, con su
    // nombre. Después de lo contado, sí: «tres empanadas: dos de carne y una de pollo».
    const dosPuntosDelPlato = palabras[i - 1].endsWith(':') && PLATO_QUE_SE_ARMA.test(palabras.slice(desde, i).join(' '));
    if (abre.test(palabras[i]) && !abre.test(palabras[i - 1]) && !NO_CORTA_DESPUES.test(palabras[i - 1]) && !dosPuntosDelPlato && !/^(?:vez|veces|time|times)$/u.test(palabras[i + 1])) {
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

/**
 * Los «X con Y» de la frase y los platos dichos con lo que llevan («ensalada de zanahoria y huevo»), para saber
 * antes cuáles son un solo alimento de la base («café con leche»).
 */
export function conCon(texto: string, idioma: Idioma): string[] {
  const lista: string[] = [];
  for (const g of enComidas(texto, idioma)) {
    for (const p of pedazos(prepararGrupo(g.texto, idioma), idioma)) {
      const limpio = limpiar(p);
      const cons = losCon(limpio);
      const entero = leerUno(limpio, idioma).buscado;
      if (cons.length || esPlatoConLista(limpio)) lista.push(entero);
      // La base puede tener el plato con «con»: «ensalada de atún y huevo» es su «Ensalada de atún con huevo».
      if (esPlatoConLista(limpio)) lista.push(conElUltimoY(entero));
      // Una bebida con lo que lleva: la de la base con lo primero («licuado de banana»), por si es esa (abrePlato).
      lista.push(...lasBebidasDe(limpio, idioma));
      if (!cons.length) continue;
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
  const sinPlural = (p: string) => p.replace(/(?<=[aeiou])s$/, '');
  // Un plato con lo que lleva es el de la base con o sin plural, y con «y» o con «con»: «ensalada de chauchas y huevo».
  const une = (p: string) => p === 'y' || p === 'e' || p === 'and' || p === 'con' || p === 'with';
  if (ES_MEZCLA.test(y[0] ?? '') && x.length === y.length && x.every((p, i) => sinPlural(p) === sinPlural(y[i]) || (une(p) && une(y[i])))) return true;
  const con = y.findIndex((p) => p === 'con' || p === 'with');
  if (con < 0 || y.length - con !== 2 || x.length !== y.length) return false;
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
  `(?<![\\p{L}])(?:(${llaves(CENTENAS)})(?:\\s+(?:(${llaves(DECENAS)})(?:\\s+y\\s+(${llaves(UNIDADES)}))?|(${llaves(DE_DIEZ_A_VEINTINUEVE)})|(${llaves(UNIDADES)})(?=\\s+(?:g|gr|gramos?|ml|cc|kcal|calor[ií]as)(?![\\p{L}]))))?|(${llaves(DECENAS)})(?:\\s+y\\s+(${llaves(UNIDADES)}))?|(trece|catorce|diecis[eé]is|diecisiete|dieciocho|diecinueve|veinte|veinti[\\p{L}]+))(?![\\p{L}])`,
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
    // Con un punto: lo que se suma después a esa comida no es parte de la lista de un plato.
    if (igual) igual.texto = `${igual.texto}. ${limpio}`;
    else juntos.push({ ...t, texto: limpio });
  }
  return juntos;
}

/** Lo de una comida, con las correcciones hechas y los separadores como comas. */
function prepararGrupo(texto: string, idioma: Idioma): string {
  let s = ` ${texto} `;
  s = s.replace(CORRECCION, (_, segundo: string) => segundo);
  s = s.replace(CORRECCION_DESPUES, (_, cosa: string, segundo: string) => `${segundo}${cosa}`);
  // «Dos huevos, no, tres huevos»: el nombre repetido queda una vez.
  s = s.replace(/(?<![\p{L}])(\p{L}{3,}?)(e?s)?\s+\1(e?s)?(?![\p{L}])/gu, '$1$3');
  s = s.replace(OTRO_ALIMENTO, ', no, ');
  // «Un licuado con una banana»: el «con» de un plato que se arma no corta, abre su lista. Solo si lo que sigue va
  // en ese plato: «un licuado con dos medialunas» son el licuado y las medialunas.
  const antesDelCon = s;
  s = s.replace(CON_CANTIDAD, (corte: string, desde: number) => {
    const plato = PLATO_ANTES_DEL_CON.exec(antesDelCon.slice(0, desde));
    const sigue = primeraCosa(antesDelCon.slice(desde + corte.length));
    return plato && vaEnElPlato(tipoDePlato(plato[1]), leerUno(sigue, idioma).buscado, idioma) ? corte : ', ';
  });
  s = s.replace(SEPARADORES, `, ${CIERRE}, `);
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

/** Lo que se dice con un nombre corto y la base tiene con otro: en el Río de la Plata, «un tostado» es el de jamón y queso, no el maíz tostado. */
const DICHO_CORTO: Record<string, string> = { tostado: 'tostado de jamón y queso' };

/** Un pedazo: con recetaDeTexto; si no encuentra el alimento («un cortado» le parece una preparación), lo que queda sin la cantidad. */
function leerUno(original: string, idioma: Idioma): Dicho {
  const leido = leerTalCual(original, idioma);
  const largo = idioma === 'es' ? DICHO_CORTO[leido.buscado] : undefined;
  return largo ? { ...leido, buscado: largo } : leido;
}

function leerTalCual(original: string, idioma: Idioma): Dicho {
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

// ------------------------------------------------------------ un plato con nombre y lo que lleva
// «Un batido de banana, leche y avena» (lo pediste el 27/11/2026) son la banana, la leche y la avena, no un
// licuado de la base: el plato se abre en lo que lleva, y cada cosa guarda su nombre (`grupo`). Se abre con
// dos puntos, con cantidades («de una banana…») o con una lista de dos cosas o más, y solo con lo que va en
// ese plato (vaEnElPlato): «un licuado con dos medialunas» son el licuado y las medialunas, y la lista
// termina en lo primero que no va («un licuado de banana, tostadas y café»). Si la base tiene el plato con
// ese nombre («ensalada de zanahoria y huevo»), es el de la base. Con una sola cosa («un batido de proteína»)
// decide la base, en entender.ts: va entero, con lo que llevaría (`lleva`). Lo que se hace con huevos solo se
// abre si se dice cuántos («una tortilla de 3 huevos con queso»): «tortilla de papas» y «tortillas con
// queso» son lo que dicen.
const BEBIDAS = 'batidos?|licuados?|smoothies?|shakes?|malteadas?';
const ENSALADAS = 'ensaladas?|salads?';
const BOLES = 'bowls?|bol(?:es)?|pokes?';
const MEZCLAS = `${BEBIDAS}|${ENSALADAS}|${BOLES}`;
const OMELETTES = 'omelettes?|omelets?|omeletes?|revueltos?|scrambles?';
const DE_HUEVO = `tortillas?|${OMELETTES}`;
const DETERMINANTE = `(?:${NUMERO}|unos|unas|el|la|mi|my|the)`;
const ES_DE_HUEVO = new RegExp(`^(?:${DE_HUEVO})$`, 'u');
const ES_MEZCLA = new RegExp(`^(?:${MEZCLAS})$`, 'u');
/** Con «con» y una cantidad no son una lista: «una ensalada con dos huevos» es la ensalada y los huevos, y «tortillas con dos huevos», las de maíz. */
const ES_ALGO_POR_SI_MISMO = new RegExp(`^(?:tortillas?|${ENSALADAS})$`, 'u');
const ES_BOL = /^(?:bowls?|bol(?:es)?)$/u;
const ABRE_PLATO = new RegExp(`^(?:${DETERMINANTE}\\s+)?(${MEZCLAS}|${DE_HUEVO})\\s+(de|con|of|with)(?:\\s+(.*))?$`, 'u');
/** «Un batido verde de espinaca, manzana y apio»: una bebida con algo más en su nombre, si lo que sigue es una lista. */
const ABRE_BEBIDA_CON_NOMBRE = new RegExp(`^(?:${DETERMINANTE}\\s+)?((?:${BEBIDAS})(?:\\s+(?!(?:de|del|con)(?![\\p{L}]))[\\p{L}]+){1,2})\\s+(de|con)\\s+(.+)$`, 'u');
/** «Batido: banana y leche», «mi batido verde: espinaca…»: lo de antes de los dos puntos es el nombre del plato. */
const ABRE_CON_DOS_PUNTOS = new RegExp(`^(?:${DETERMINANTE}\\s+)?((?:${MEZCLAS}|${DE_HUEVO})(?:\\s+[\\p{L}]+){0,4}?)\\s*:\\s*(.*)$`, 'u');
/** Otro plato, con su artículo («y un batido»): ahí termina la lista del anterior. */
const OTRO_PLATO = new RegExp(`^${DETERMINANTE}\\s+(?:${MEZCLAS}|${DE_HUEVO})(?![\\p{L}])`, 'u');
/** El plato que se arma justo antes de un «con» y una cantidad («un licuado con una banana»): ese «con» no corta, si lo que sigue va en él. */
const PLATO_ANTES_DEL_CON = new RegExp(`(?:(?:^|[,;.:${CIERRE}])\\s*|(?<![\\p{L}])${DETERMINANTE}\\s+)(${BEBIDAS}|${BOLES}|${OMELETTES})$`, 'u');
/** Lo que sigue trae su cantidad («una banana», «3 huevos»): es un ingrediente con lo suyo. */
const CON_SU_CANTIDAD = new RegExp(`^(?:${NUMERO}|un par|unos|unas|a couple)(?![\\p{L}])`, 'u');

/** El nombre del plato, en singular y sin lo que lo une a la lista: «batidos de» es «batido». */
const nombreDelPlato = (dicho: string) => dicho.replace(/\s+(?:de|con|of|with)$/u, '').replace(/^(\p{L}+?)(?:(?<=bol)es|s)(?=\s|$)/u, '$1');

// ------------------------------------------------------------ lo que va en cada plato
// La lista de un plato es solo lo que va en él (27/11/2026): lo de un batido, una ensalada, un bol o lo que se hace
// con huevos. Va sin tildes y en singular (el plural lo suma la regla); en español cuenta la primera palabra de lo
// dicho («leche de almendras»), y en inglés, la última («almond milk»). Lo que no está acá corta la lista y queda
// como siempre: el plato de la base y lo demás aparte.
type TipoDePlato = 'bebida' | 'ensalada' | 'bol' | 'huevo';
const FRUTAS = 'fruta|fruto|banana|banano|platano|guineo|frutilla|fresa|freson|mango|durazno|melocoton|damasco|albaricoque|chabacano|anana|pina|kiwi|manzana|pera|naranja|mandarina|limon|lima|pomelo|toronja|uva|arandano|frambuesa|mora|zarzamora|cereza|guinda|sandia|melon|papaya|mamon|maracuya|parchita|guayaba|guanabana|lucuma|pitahaya|pitaya|higo|datil|ciruela|coco|acai|granada|nispero|caqui|kaki|carambola|tamarindo|pasa';
const VERDURAS = 'lechuga|tomate|tomatito|cherry|cebolla|cebollin|cebolleta|verdeo|rucula|arugula|espinaca|acelga|kale|col|repollo|lombarda|brocoli|coliflor|remolacha|betabel|betarraga|morron|pimiento|pimenton|aji|chile|apio|choclo|maiz|elote|palta|aguacate|aceituna|oliva|rabanito|rabano|berro|radicchio|endivia|escarola|hongo|champinon|champignon|seta|zapallito|calabacin|zucchini|berenjena|chaucha|ejote|judia verde|vainita|habichuela|arveja|guisante|chicharo|esparrago|alcaucil|alcachofa|puerro|hinojo|palmito|germinado|brote|hoja|verdura|vegetal|pepino|zanahoria|jicama|calabaza|zapallo|boniato|batata|camote|papa(?!s? fritas?)|patata(?!s? fritas?)|ajo|perejil|cilantro|albahaca|menta|hierbabuena|nopal|jengibre';
const PROTEINAS = 'huevo|clara|yema|atun|pollo|pechuga|jamon|pavo|pavita|panceta|tocino|bacon|beicon|salmon|camaron|langostino|gamba|surimi|kanikama|queso|mozzarella|muzzarella|mozarela|ricota|requeson|tofu|tempeh|seitan|garbanzo|lenteja|poroto|frijol|alubia|judia|haba|soja|soya|edamame|carne|cerdo|lomo|lomito|bondiola|chorizo|salchicha|salame|salami|fiambre|mortadela|marisco|pulpo|calamar|sardina|caballa|anchoa|bonito|mejillon|cangrejo';
const SECOS = 'mani|cacahuate|cacahuete|almendra|nuez|nueces|avellana|castana|pistacho|anacardo|maranon|pecana|macadamia|chia|lino|linaza|semilla|sesamo|ajonjoli|girasol|pepita|(?:pasta|manteca|mantequilla|crema) de (?:mani|cacahuate|cacahuete|almendra|avellana)|granola';
const LACTEOS = 'leche|yogur|yogurt|yoghurt|kefir|helado|crema|nata|bebida (?:de|vegetal)';
const PARA_BATIR = 'miel|azucar|edulcorante|stevia|sacarina|sucralosa|cacao|chocolate|nesquik|toddy|canela|vainilla|esencia|extracto|dulce de leche|jarabe|sirope|almibar|agave|nutella|proteina|whey|suero|colageno|creatina|caseina|avena|salvado|germen|copos? de avena|cereal|hielo|agua';
const ADEREZOS = 'aceite|vinagre|vinagreta|mayonesa|mostaza|aderezo|salsa|sal|pimienta|oregano|crouton|cruton|quinoa|quinua|cuscus|bulgur';
const GRANOS = 'arroz|quinoa|quinua|fideo|pasta(?! de)|cuscus|bulgur|trigo|cebada|avena|granola|cereal';
const FRUITS = 'fruit|banana|strawberr(?:y|ie)|blueberr(?:y|ie)|raspberr(?:y|ie)|blackberr(?:y|ie)|cranberr(?:y|ie)|berr(?:y|ie)|mango|peach|pineapple|kiwi|apple|pear|orange|tangerine|clementine|mandarin|lemon|lime|grapefruit|grape|cherr(?:y|ie)|watermelon|melon|cantaloupe|papaya|passion ?fruit|guava|avocado|coconut|date|fig|plum|apricot|nectarine|acai|pomegranate|raisin';
const VEGETABLES = 'lettuce|romaine|tomato|onion|scallion|shallot|cucumber|carrot|arugula|rocket|spinach|kale|cabbage|beet|beetroot|pepper|celery|corn|avocado|olive|radish|mushroom|zucchini|squash|broccoli|cauliflower|pea|green bean|asparagus|artichoke|sprout|green|herb|basil|cilantro|parsley|mint|ginger|eggplant|jalapeno|potato';
const PROTEINS = 'egg|egg white|yolk|tuna|chicken|breast|ham|turkey|bacon|salmon|shrimp|prawn|crab|cheese|feta|mozzarella|parmesan|cheddar|tofu|tempeh|chickpea|garbanzo|bean|lentil|edamame|beef|steak|pork|sausage|chorizo|anchov(?:y|ie)|sardine';
const NUTS = 'nut|peanut|almond|walnut|cashew|pecan|pistachio|hazelnut|macadamia|seed|chia|flax|flaxseed|sesame|sunflower|peanut butter|almond butter|nut butter|granola';
const DAIRY = 'milk|yogurt|yoghurt|yogourt|kefir|ice ?cream|cream';
const FOR_SHAKES = 'honey|sugar|sweetener|stevia|cocoa|cacao|chocolate|cinnamon|vanilla|syrup|maple|agave|nutella|protein|whey|powder|collagen|creatine|casein|oat|oatmeal|bran|cereal|ice|water';
const DRESSINGS = 'oil|vinegar|vinaigrette|dressing|mayo|mayonnaise|ranch|mustard|salt|crouton|quinoa|couscous|bulgur';
const GRAINS = 'rice|quinoa|couscous|bulgur|noodle|pasta|barley|farro|oat|oatmeal|granola|cereal';
const alPrincipio = (lista: string) => new RegExp(`^(?:${lista})(?:e?s)?(?![\\p{L}])`, 'u');
const alFinal = (lista: string) => new RegExp(`(?:^|\\s)(?:${lista})(?:e?s)?$`, 'u');
const VA_EN: Record<Idioma, Record<TipoDePlato, RegExp>> = {
  es: {
    // El batido verde lleva espinaca, apio o pepino, pero no lechuga ni cebolla.
    bebida: alPrincipio(`${FRUTAS}|${LACTEOS}|${SECOS}|${PARA_BATIR}|espinaca|acelga|kale|apio|pepino|zanahoria|remolacha|betabel|jengibre|menta|hierbabuena|perejil|nopal|palta|aguacate`),
    // La ensalada, sin arroz, fideos ni pan: «ensalada de pollo, arroz y una coca» son tres cosas.
    ensalada: alPrincipio(`${VERDURAS}|${PROTEINAS}|${FRUTAS}|${SECOS}|${ADEREZOS}`),
    bol: alPrincipio(`${VERDURAS}|${PROTEINAS}|${FRUTAS}|${SECOS}|${ADEREZOS}|${LACTEOS}|${PARA_BATIR}|${GRANOS}`),
    huevo: alPrincipio(`${VERDURAS}|${PROTEINAS}|leche|crema|aceite|manteca|mantequilla`),
  },
  en: {
    bebida: alFinal(`${FRUITS}|${DAIRY}|${NUTS}|${FOR_SHAKES}|spinach|kale|celery|cucumber|carrot|beet|ginger|mint`),
    ensalada: alFinal(`${VEGETABLES}|${PROTEINS}|${FRUITS}|${NUTS}|${DRESSINGS}`),
    bol: alFinal(`${VEGETABLES}|${PROTEINS}|${FRUITS}|${NUTS}|${DRESSINGS}|${DAIRY}|${FOR_SHAKES}|${GRAINS}`),
    huevo: alFinal(`${VEGETABLES}|${PROTEINS}|milk|cream|butter|oil`),
  },
};
const ES_BEBIDA = new RegExp(`^(?:${BEBIDAS})(?![\\p{L}])`, 'u');
const ES_ENSALADA = new RegExp(`^(?:${ENSALADAS})(?![\\p{L}])`, 'u');
const ES_DE_BOL = new RegExp(`^(?:${BOLES})(?![\\p{L}])`, 'u');
const tipoDePlato = (plato: string): TipoDePlato => (ES_BEBIDA.test(plato) ? 'bebida' : ES_ENSALADA.test(plato) ? 'ensalada' : ES_DE_BOL.test(plato) ? 'bol' : 'huevo');

/** Si lo dicho va en ese tipo de plato: «leche de almendras» en un batido, sí; «medialuna», no. Lo tuyo, dicho en la lista, también. */
function vaEnElPlato(tipo: TipoDePlato, buscado: string, idioma: Idioma): boolean {
  const b = buscado.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  return SOLO_LA_MARCA.test(b) || VA_EN[idioma][tipo].test(b);
}
/** Lo primero que se nombra: hasta la coma, el «y», el «con» o el «después». */
const primeraCosa = (s: string) => s.split(/[,;]|\.(?!\d)|\s(?:y|e|and|con|with|despu[eé]s|luego|then|also|tambi[eé]n|adem[aá]s)\s/u)[0].trim();
/** Las cosas que se nombran: «banana y leche» son dos; «yogur con granola», una. */
const cosasDe = (s: string) => s.split(/\s(?:y|e|and)\s/u).map(recortar).filter(Boolean);
/** Cuántas cosas seguidas, desde la primera, van en el plato. */
function cuantasVan(tipo: TipoDePlato, cosas: readonly string[], idioma: Idioma): number {
  const k = cosas.findIndex((c) => !vaEnElPlato(tipo, leerUno(c, idioma).buscado, idioma));
  return k < 0 ? cosas.length : k;
}
/** Lo que se toma en un batido y lo hace líquido: dicho, la lista se abre aunque tenga una sola cosa más. */
const LIQUIDO: Record<Idioma, RegExp> = {
  es: /^(?:leche|agua|yogur|yogurt|yoghurt|kefir|bebida|helado)(?![\p{L}])/u,
  en: /(?:^|\s)(?:milk|water|yogurt|yoghurt|kefir|ice ?cream)s?$/u,
};
/** Si se dijo el líquido, también con «con»: «frutilla con leche». */
const tieneLiquido = (cosa: string, idioma: Idioma) =>
  cosa.split(/\s(?:con|with)\s/u).some((parte) => LIQUIDO[idioma].test(leerUno(parte, idioma).buscado.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()));
/** Un plato que se arma con su lista: después de su nombre, los dos puntos abren la lista. */
const PLATO_QUE_SE_ARMA = new RegExp(`(?<![\\p{L}])(?:${MEZCLAS}|${DE_HUEVO})(?![\\p{L}])`, 'u');

/** Las bebidas que son lo mismo: un licuado, un batido o un smoothie; un shake, una malteada o un milkshake. */
export const FAMILIAS_DE_BEBIDA: readonly (readonly string[])[] = [['licuado', 'batido', 'smoothie'], ['shake', 'malteada', 'milkshake']];

/**
 * La bebida con lo primero que lleva, como la puede tener la base, también con el nombre de su familia: «un licuado de
 * una banana» o «un batido de: una banana» es el «licuado de banana», y «un batido con una cucharada de proteína», el
 * «batido de proteína». En español; si no, ninguna.
 */
function lasBebidasDe(limpio: string, idioma: Idioma): string[] {
  const conPuntos = ABRE_CON_DOS_PUNTOS.exec(limpio);
  const m = conPuntos ? null : ABRE_PLATO.exec(limpio);
  const [plato, resto] = conPuntos ? [conPuntos[1], conPuntos[2]] : [m?.[1], m?.[3]];
  if (idioma !== 'es' || !plato || !resto || tipoDePlato(plato) !== 'bebida') return [];
  const primero = leerUno(primeraCosa(resto), idioma).buscado;
  const dicha = nombreDelPlato(plato).split(' ')[0];
  const familia = FAMILIAS_DE_BEBIDA.find((f) => f.includes(dicha)) ?? [];
  return primero ? [dicha, ...familia.filter((b) => b !== dicha)].map((b) => `${b} de ${primero}`) : [];
}

/** Lo que va en el plato, en orden: lo de acá y lo que sigue, hasta lo primero que no va (sin cantidades, también lo que viene con su artículo). */
function laLista(tipo: TipoDePlato, cosas: readonly string[], siguientes: readonly string[], conCantidades: boolean, idioma: Idioma): string[] {
  const lista = cosas.slice(0, cuantasVan(tipo, cosas, idioma));
  if (lista.length < cosas.length) return lista;
  for (const s of siguientes) {
    const limpio = limpiar(s);
    if (s === CIERRE || ES_CORRECCION.test(recortar(s)) || OTRO_PLATO.test(limpio) || (!conCantidades && EMPIEZA_ALIMENTO.test(limpio))) break;
    const suyas = cosasDe(limpio);
    const van = cuantasVan(tipo, suyas, idioma);
    lista.push(...suyas.slice(0, van));
    if (van < suyas.length) break;
  }
  return lista;
}

/** Un plato con toda su lista en un pedazo y sin cantidades («ensalada de zanahoria y huevo»): conCon lo busca, por si la base lo tiene. */
function esPlatoConLista(limpio: string): boolean {
  const m = ABRE_PLATO.exec(limpio) ?? ABRE_BEBIDA_CON_NOMBRE.exec(limpio);
  return !!m?.[3] && !CON_SU_CANTIDAD.test(m[3]) && cosasDe(m[3]).length >= 2;
}
/** El nombre con «con» en vez del último «y»: «ensalada de atún y huevo» es «ensalada de atún con huevo». */
function conElUltimoY(nombre: string): string {
  const y = [...nombre.matchAll(/\s(y|e|and)\s/gu)].pop();
  return y ? `${nombre.slice(0, y.index)} ${y[1] === 'and' ? 'with' : 'con'} ${nombre.slice(y.index + y[0].length)}` : nombre;
}

/** La lista abierta: el nombre del plato, de qué tipo es y si se dijo con cantidades (o con dos puntos). */
type Lista = { nombre: string; tipo: TipoDePlato; conCantidades: boolean };
/**
 * `solo`: es un plato de la base con ese nombre, y va entero, sin partir en lo que lleva. `aparte`: lo que va después
 * del plato, por su lado («un licuado de: una banana» es el licuado y la banana, como antes).
 */
type Plato = ({ abre: true; resto: string } & Lista) | { abre: false; entero: string; lleva: Dicho[] | null; solo?: true; aparte?: string };

/** Si el pedazo nombra un plato con lo que lleva, y si se abre. `siguientes`: lo que viene después, para contar la lista. */
function abrePlato(p: string, siguientes: readonly string[], idioma: Idioma, esNombre: (buscado: string) => boolean): Plato | null {
  // Lo primero de la lista, acá o en el pedazo que sigue, tiene que ir en el plato.
  const despues = siguientes[0] && siguientes[0] !== CIERRE ? limpiar(siguientes[0]) : '';
  const primeroVa = (tipo: TipoDePlato, resto: string) => !!(resto || despues) && vaEnElPlato(tipo, leerUno(primeraCosa(resto || despues), idioma).buscado, idioma);
  /**
   * Una bebida con una o dos cosas, sin decir el líquido (con «con», una sola), es la de la base si la tiene: «un
   * licuado de banana y frutilla» es el licuado de banana y la frutilla, como antes, y no la fruta sola sin la leche.
   * Devuelve el pedazo con la bebida como la tiene la base («un smoothie de banana» es su «licuado de banana»), o null.
   */
  const conLaDeLaBase = (plato: string, esCon: boolean, lista: readonly string[]): string | null => {
    if (tipoDePlato(plato) !== 'bebida' || lista.length > (esCon ? 1 : 2) || lista.some((c) => tieneLiquido(c, idioma))) return null;
    const hallada = lasBebidasDe(p, idioma).find(esNombre)?.split(' ')[0];
    const dicha = nombreDelPlato(plato).split(' ')[0];
    return !hallada ? null : hallada === dicha ? p : p.replace(new RegExp(`(?<![\\p{L}])${dicha}(?:e?s)?(?![\\p{L}])`, 'u'), hallada);
  };
  const conPuntos = ABRE_CON_DOS_PUNTOS.exec(p);
  if (conPuntos) {
    const tipo = tipoDePlato(conPuntos[1]);
    if (!primeroVa(tipo, conPuntos[2])) return null;
    const enLaBase = conLaDeLaBase(conPuntos[1], false, laLista(tipo, cosasDe(conPuntos[2]), siguientes, true, idioma));
    if (enLaBase) return { abre: false, entero: enLaBase.slice(0, enLaBase.indexOf(':')), lleva: null, aparte: conPuntos[2] };
    return { abre: true, nombre: nombreDelPlato(conPuntos[1]), resto: conPuntos[2], tipo, conCantidades: true };
  }
  const m = ABRE_PLATO.exec(p);
  const conNombre = m ? null : ABRE_BEBIDA_CON_NOMBRE.exec(p);
  const [, plato, nexo, resto = ''] = m ?? conNombre ?? [];
  if (!plato) return null;
  const nombre = nombreDelPlato(plato);
  const tipo = tipoDePlato(plato);
  const esCon = nexo === 'con' || nexo === 'with';
  // «Un batido de», y nada más en el pedazo: lo que sigue es la lista.
  if (!resto) return primeroVa(tipo, '') ? { abre: true, nombre, resto, tipo, conCantidades: CON_SU_CANTIDAD.test(despues) } : null;
  if (CON_SU_CANTIDAD.test(resto)) {
    // «De 300 ml» es el tamaño, no lo que lleva.
    const esLista = leerReceta(resto, idioma).lineas.some((l) => l.buscado) && !(esCon && ES_ALGO_POR_SI_MISMO.test(plato)) && primeroVa(tipo, resto);
    if (!esLista) return null;
    const enLaBase = conLaDeLaBase(plato, esCon, laLista(tipo, cosasDe(resto), siguientes, true, idioma));
    return enLaBase ? { abre: false, entero: enLaBase, lleva: null } : { abre: true, nombre, resto, tipo, conCantidades: true };
  }
  if (ES_DE_HUEVO.test(plato)) return null;
  // Sin cantidades: lo que va en el plato, seguido, acá y en lo que sigue sin artículo, hasta lo primero que no va.
  const cosas = cosasDe(resto);
  const lista = laLista(tipo, cosas, siguientes, false, idioma);
  const soloAca = lista.length <= cosas.length;
  // Con toda la lista acá, si la base tiene el plato con ese nombre (conCon lo buscó), es el de la base, entero; si lo
  // tiene con «con» («ensalada de atún y huevo» es su «Ensalada de atún con huevo»), se busca así.
  if (soloAca && cosas.length > 1) {
    const entero = leerUno(p, idioma).buscado;
    if (esNombre(entero)) return { abre: false, entero: p, lleva: null, solo: true };
    if (esNombre(conElUltimoY(entero))) return { abre: false, entero: conElUltimoY(p), lleva: null, solo: true };
  }
  if (lista.length >= 2) {
    const enLaBase = conLaDeLaBase(plato, esCon, lista);
    return enLaBase ? { abre: false, entero: enLaBase, lleva: null } : { abre: true, nombre, resto, tipo, conCantidades: false };
  }
  if (conNombre || cosas.length > 1) return null;
  // Una sola cosa: el nombre entero puede ser de la base («batido de proteína»). Un bol es una porción de lo que tiene.
  if (ES_BOL.test(plato)) return { abre: false, entero: esCon ? p.replace(/\s(?:con|with)\s/u, ' de ') : p, lleva: null };
  const lleva = leerUno(resto.split(/\s(?:con|with)\s/u)[0], idioma);
  return { abre: false, entero: p, lleva: vaEnElPlato(tipo, lleva.buscado, idioma) ? [{ ...lleva, grupo: nombre }] : null };
}

/** Lo que se dijo solo con un artículo, sin medida («un yogur»): en una lista sin cantidades, ya es otra cosa. */
const SOLO_CON_ARTICULO = /^(?:un|una|unos|unas|el|la|los|las|a|an|the|some)\s/u;

/**
 * Lo nuevo de la lista lleva el nombre del plato hasta lo primero que no va en él: ahí termina la lista (null).
 * Sin cantidades, termina también en lo que se dice con su artículo: «un batido de banana y leche y un yogur».
 */
function conSuGrupo(nuevos: readonly Dicho[], lista: Lista, idioma: Idioma): Lista | null {
  const va = (x: Dicho) => vaEnElPlato(lista.tipo, x.buscado, idioma) && (lista.conCantidades || !!x.unidad || !!x.vago || !SOLO_CON_ARTICULO.test(x.texto));
  for (const d of nuevos) {
    if (!(d.partes ?? [d]).every(va)) return null;
    d.grupo = lista.nombre;
    for (const x of d.partes ?? []) x.grupo = lista.nombre;
  }
  return lista;
}

/**
 * Lo que se calla en «N de Y» después de `anterior`: el plato («un plato de arroz y uno de fideos»), la medida
 * («un vaso de leche y uno de jugo», «200 g de arroz y 150 de pollo») o lo contado («dos empanadas de carne y una
 * de jamón»). Muchos, sin unidad, son gramos y no la medida de antes (27/11/2026: «una taza de café y 30 de leche»
 * no son 30 tazas, ni «una banana y 300 de leche», 300 bananas); salvo después de muchos («20 empanadas de carne y
 * 20 de pollo»), de gramos, ml o piezas, que siguen igual, y del litro, que pasa a ml. Después de un kilo, pocos
 * se cuentan («un kilo de asado y dos de chorizo» son dos chorizos, `cuenta`), y después de gramos dichos sin la
 * unidad no se calla nada: «200 de arroz y 200 de pollo» son los dos.
 */
function loQueSeCalla(anterior: Dicho, n: number): 'plato' | 'medida' | 'ml' | 'cuenta' | 'nombre' | null {
  const muchos = n >= 20;
  if (anterior.vago) return muchos ? null : 'plato';
  if (anterior.unidad) {
    if (!muchos && (anterior.unidad === 'kg' || anterior.unidad === 'lb')) return 'cuenta';
    if (!muchos || anterior.unidad === 'g' || anterior.unidad === 'mg' || anterior.unidad === 'ml' || anterior.unidad === 'unidad') return 'medida';
    return anterior.unidad === 'l' || anterior.unidad === 'cl' || anterior.unidad === 'dl' ? 'ml' : null;
  }
  if (GRAMOS_SIN_UNIDAD.test(anterior.texto)) return null;
  if (!muchos) return 'nombre';
  // Muchos después de muchos: otra de lo mismo («20 empanadas de carne y 20 de pollo») o una parte del total («40
  // empanadas, 20 de carne»). «20 alitas y 20 de papas» no son alitas de papas.
  const conDe = anterior.buscado.startsWith(`${anterior.buscado.split(' ')[0]} de `);
  return anterior.cantidad !== null && anterior.cantidad >= 10 && (conDe || n < anterior.cantidad) ? 'nombre' : null;
}
/** «200 de arroz»: un número y «de», sin unidad ni nombre en el medio: son gramos. */
const GRAMOS_SIN_UNIDAD = new RegExp(`^${NUMERO}\\s+de\\s`, 'u');

/** Lo de una comida, alimento por alimento. */
function leerGrupo(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean): Dicho[] {
  const dichos: Dicho[] = [];
  let anterior: Dicho | null = null;
  // Cuántos sumó el último pedazo: «un café, no, un té» los saca.
  let ultimos = 0;
  let corregir = false;
  // Cada detalle callado («dos de carne») y lo dicho sin detalle de donde sale («cuatro empanadas»).
  const detalleDe = new Map<Dicho, Dicho>();
  // El plato que se está armando: lo que sigue es parte de él mientras vaya en él, hasta que termina lo dicho o empieza otro plato.
  let lista: Lista | null = null;
  const trozos = pedazos(prepararGrupo(texto, idioma), idioma);
  for (let k = 0; k < trozos.length; k++) {
    const pedazo = trozos[k];
    if (pedazo === CIERRE) {
      lista = null;
      continue;
    }
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
    // «Un batido de banana, leche y avena»: desde acá, lo que sigue es lo que lleva (abrePlato).
    const plato = abrePlato(p, trozos.slice(k + 1), idioma, esNombre);
    if (plato?.abre) {
      lista = { nombre: plato.nombre, tipo: plato.tipo, conCantidades: plato.conCantidades };
      p = plato.resto;
      if (!p) continue;
    } else {
      if (OTRO_PLATO.test(p)) lista = null;
      if (plato) p = plato.entero;
    }
    const aparte = plato && !plato.abre ? plato.aparte ?? null : null;
    // «Fideos, un plato grande»: el plato es de lo de antes, si no tenía cuánto; solo, no es un alimento.
    if (SOLO_RECIPIENTE.test(p)) {
      if (anterior && anterior.cantidad === null && !anterior.unidad && !anterior.cuanto) {
        const conPlato = leerUno(`${p} de ${anterior.texto}`, idioma);
        if (anterior.grupo) conPlato.grupo = anterior.grupo;
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
        if (anterior.grupo) contado.grupo = anterior.grupo;
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
    const n = elipsis ? VALOR_DE_PALABRA[elipsis[1]] ?? Number(elipsis[1].replace(',', '.')) : NaN;
    const calla = elipsis && anterior ? loQueSeCalla(anterior, n) : null;
    if (elipsis && anterior && calla) {
      // «uno de jugo» es «un vaso de jugo».
      const cuanto = elipsis[1] === 'uno' ? 'un' : elipsis[1];
      const recipiente = `${anterior.recipiente === 'otro' ? 'porción' : 'plato'}${anterior.plato ? ` ${anterior.plato}` : ''}`;
      const palabra = anterior.buscado.split(' ')[0];
      // Varios, con la cosa como se dijo antes («20 empanadas de pollo» se cuentan); nunca «docena», «unas» ni «media».
      const comoSeDijo = anterior.texto.split(/\s+/).find((w) => w === palabra || w === `${palabra}s` || w === `${palabra}es`);
      const contado = n > 1 && comoSeDijo ? comoSeDijo : palabra;
      const callado = calla === 'plato' ? recipiente : calla === 'ml' ? 'ml' : calla === 'medida' ? anterior.unidad : contado;
      const deQue = p.slice(elipsis[0].length);
      p = calla === 'cuenta' ? `${cuanto} ${deQue}` : `${cuanto} ${callado} de ${deQue}`;
      general = calla === 'cuenta' ? null : detalleDe.get(anterior) ?? (!anterior.vago && !anterior.unidad && anterior.buscado === palabra ? anterior : null);
    }
    // «Café con leche y medialunas»: lo de después del «y» es otra cosa, salvo que el nombre entero exista.
    let resto: string | null = aparte;
    const y = CON_Y.exec(p);
    if (y && !esNombre(leerUno(p, idioma).buscado)) {
      p = y[1];
      resto = y[2];
    }
    const leido = leerUno(p, idioma);
    if (plato && !plato.abre && plato.solo) delete leido.partes;
    // Si la lectura dejó lo del «con» como nota («ensalada de frutas con helado»: «helado» como preparación), el
    // nombre de la base es lo de antes y lo del «con» va aparte.
    const cons = esNombre(leido.buscado) && /\s(?:con|with)\s/u.test(leido.buscado) ? [] : losCon(p);
    if (cons.length) {
      // «Café con leche con tostadas»: se corta en el último «con» que deja un nombre de la base antes; si
      // no hay, en el primero. Lo de después, con cada «con», son acompañantes.
      const corte = [...cons].reverse().find((c) => esNombre(leerUno(c.antes, idioma).buscado)) ?? cons[0];
      const principal = leerUno(corte.antes, idioma);
      // En la lista de un plato, «tomate y lechuga con aceite» son el tomate, la lechuga y el aceite.
      const principales = lista && principal.partes ? principal.partes : [principal];
      dichos.push(...principales);
      for (const parte of corte.despues.split(/\s(?:con|with)\s/u)) {
        const despues = leerUno(parte, idioma);
        dichos.push(despues.cantidad === null ? { ...despues, acompanante: true } : despues);
      }
      anterior = principales[principales.length - 1];
    } else if (lista && leido.partes) {
      // En la lista de un plato, «leche y avena» son dos ingredientes, no la leche de avena.
      dichos.push(...leido.partes);
      anterior = leido.partes[leido.partes.length - 1];
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
    if (plato && !plato.abre && plato.lleva && dichos.length > antes) dichos[antes].lleva = plato.lleva;
    if (lista) lista = conSuGrupo(dichos.slice(antes), lista, idioma);
    ultimos = dichos.length - antes;
  }
  // «Cuatro empanadas, dos de carne y dos de jamón»: si los detalles suman lo mismo, lo de antes era el total.
  const esElTotal = (d: Dicho) => {
    const detalles = dichos.filter((x) => detalleDe.get(x) === d);
    return detalles.length > 0 && detalles.reduce((suma, x) => suma + (x.cantidad ?? NaN), 0) === d.cantidad;
  };
  return dichos.filter((d) => d.buscado && !VACIO.test(d.buscado) && !CORTADO.test(d.texto) && !esElTotal(d));
}

function leerSinLoTuyo(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean): FraseLeida {
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

// ------------------------------------------------------------ lo tuyo, por su nombre
// Lo que la persona guardó (una receta, una comida, un alimento suyo) se reconoce por su nombre entero (lo
// pediste el 27/11/2026): «mi batido de la mañana». Antes de partir la frase, cada nombre que aparece se
// cambia por una marca que la lectura trata como una palabra: así «mi desayuno de siempre» no es «el
// desayuno», y un nombre con «con» o con «y» no se corta. Si la marca termina adentro de otro nombre («yogur»
// en «yogur de frutilla») o no queda en nada, no era lo tuyo: se lee de nuevo sin ella.
const LETRAS_DE_MARCA = 'abcdefghij';
const marcaDeLoTuyo = (k: number) => `zqw${[...String(k)].map((d) => LETRAS_DE_MARCA[Number(d)]).join('')}zq`;
const MARCA_DE_LO_TUYO = /zqw([a-j]+)zq/gu;
const SOLO_LA_MARCA = /^zqw([a-j]+)zq$/u;
const cualMarca = (letras: string) => Number([...letras].map((l) => LETRAS_DE_MARCA.indexOf(l)).join(''));
/** Sin tildes, letra por letra: cada lugar es el mismo del texto. */
const sinTildes = (s: string) => [...s].map((c) => { const p = c.normalize('NFD').replace(/\p{M}/gu, ''); return p.length === c.length ? p : c; }).join('');

type Nombrado = { desde: number; hasta: number; tuyo: number; dicho: string; sinDudas: boolean };

/** Lo guardado con el nombre de una comida («Desayuno», «Merienda»): esa palabra es primero el momento del día. */
const NOMBRE_DE_COMIDA = /^(?:desayuno|almuerzo|merienda|cena|snack|colacion|tentempie|brunch|breakfast|lunch|dinner|supper)$/u;
/** Lo que, antes, la hace el momento: «en el desayuno», «de merienda», «a la merienda», «for breakfast». */
const ANTES_DEL_MOMENTO = /(?<![\p{L}])(?:en|de|para|a|al|como|durante|in|for|at|as|during|with)\s+(?:(?:el|la|un|una|mi|the|an?|my)\s+)?$/u;
/** Lo que, después, la hace lo tuyo: «el desayuno de siempre». */
const DE_SIEMPRE = /^\s+(?:de\s+siempre|de\s+todos\s+los\s+dias|as\s+usual)(?![\p{L}])/u;
/** Si no queda nada más que decir: ni comida ni otra cosa («comí el», «.»). «Un» y «una» son una cantidad: con ellos manda la base. */
const sinNadaMas = (t: string) => !limpiar(t.replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/(?<![\p{L}])(?:el|la|mi|the|my)(?![\p{L}])/gu, ' '));
/** Las palabras que unen, que no van en plural. */
const UNE = /^(?:de|del|la|las|el|los|con|sin|y|e|en|a|al|mi|mis|my|the|of|with|and|in)$/u;
/** Una palabra del nombre también en plural o en singular: «dos batidos de la mañana», «una medialuna» de «Medialunas». */
function enPluralTambien(w: string): string {
  if (w.length < 3 || UNE.test(w)) return w;
  if (w.endsWith('z')) return `${w.slice(0, -1)}(?:z|ces)`;
  return `${w.length > 3 ? w.replace(/(?<=[^aeiou])es$|(?<=[aeiou])s$/u, '') : w}(?:e?s)?`;
}
/** La comida que nombra lo tuyo cuando empieza con ella («Cena liviana», «mi desayuno»): ahí va, si la frase no dice otra. */
function comidaDelNombre(nombre: string): Comida | null {
  const [primera = '', segunda = ''] = sinTildes(nombre.toLowerCase()).split(/[^\p{L}]+/u).filter(Boolean);
  const palabra = /^(?:el|la|mi|my|the)$/u.test(primera) ? segunda : primera;
  return /^(?:desayuno|almuerzo|merienda|cena|breakfast|lunch|dinner|supper)$/u.test(palabra) ? COMIDA_DE_LA_PALABRA[palabra] : null;
}

/**
 * Dónde se nombra lo tuyo en la frase, ya en minúsculas: el nombre más largo primero, con «mi» adelante o sin él, y
 * en plural o singular. `sinDudas`: con «mi», con «de siempre» o la frase entera, y no después de «en», «de» o «a la».
 * Lo que se llama como una comida solo si se nombra sin dudas (27/11/2026): «Desayuno, dos huevos y un café» es el
 * desayuno, no lo guardado más los huevos.
 */
function nombrados(s: string, tuyos: readonly string[]): Nombrado[] {
  const plano = sinTildes(s);
  const lista: Nombrado[] = [];
  const nombres = tuyos
    .map((nombre, tuyo) => ({ tuyo, palabras: sinTildes(nombre.toLowerCase()).split(/[^\p{L}\p{N}]+/u).filter(Boolean) }))
    .filter((n) => n.palabras.join('').length >= 3)
    .sort((a, b) => b.palabras.join(' ').length - a.palabras.join(' ').length);
  for (const { tuyo, palabras } of nombres) {
    const delNombre = /^(?:el|la|mi|my|the)$/u.test(palabras[0]) ? palabras.slice(1) : palabras;
    const esComida = delNombre.length === 1 && NOMBRE_DE_COMIDA.test(delNombre[0]);
    const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:(?:mi|mis|my)\\s+)?(${palabras.map(enPluralTambien).join('[\\s-]+')})(?![\\p{L}\\p{N}])`, 'gu');
    for (const m of plano.matchAll(re)) {
      let hasta = m.index + m[0].length;
      const dicho = s.slice(hasta - m[1].length, hasta);
      const antes = plano.slice(0, m.index);
      const siempre = DE_SIEMPRE.exec(plano.slice(hasta));
      const conMi = m[0].length > m[1].length || /^(?:mi|my)$/u.test(palabras[0]);
      const sola = sinNadaMas(antes) && sinNadaMas(plano.slice(hasta + (siempre?.[0].length ?? 0)));
      const sinDudas = !ANTES_DEL_MOMENTO.test(antes) && (conMi || !!siempre || sola);
      if (esComida && !sinDudas) continue;
      if (siempre) hasta += siempre[0].length;
      if (!lista.some((x) => m.index < x.hasta && hasta > x.desde)) lista.push({ desde: m.index, hasta, tuyo, dicho, sinDudas });
    }
  }
  return lista.sort((a, b) => a.desde - b.desde);
}

/**
 * Lee la frase. `esNombre` dice si un «X con Y» es un alimento de la base (lo busca quien llama, con
 * conCon): si no, se corta en dos y lo de después del «con», sin cantidad, va como acompañante. `tuyos`:
 * los nombres de lo que la persona guardó; lo que se nombra entero vuelve con `tuyo`, su lugar en esa lista.
 */
export function leerFrase(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean = () => false, tuyos: readonly string[] = []): FraseLeida {
  const s = texto.toLowerCase().replace(/\s+/g, ' ');
  const lista = tuyos.length ? nombrados(s, tuyos) : [];
  if (!lista.length) return leerSinLoTuyo(texto, idioma, esNombre);
  const comoSeDijo = lista.map((x) => x.dicho);
  // Como se busca cada nombre: en singular, igual que lo demás de la frase.
  const comoSeBusca = lista.map((x) => leerUno(x.dicho, idioma).buscado || x.dicho);
  const reponer = (b: string, como: readonly string[]) => b.replace(MARCA_DE_LO_TUYO, (_, letras: string) => como[cualMarca(letras)] ?? '');
  // Las que no eran lo tuyo: se van sacando hasta que cada marca que queda es un alimento entero.
  const sin = new Set<number>();
  for (;;) {
    let conMarcas = '';
    let desde = 0;
    lista.forEach((x, k) => {
      if (sin.has(k)) return;
      conMarcas += s.slice(desde, x.desde) + marcaDeLoTuyo(k);
      desde = x.hasta;
    });
    const leida = leerSinLoTuyo(conMarcas + s.slice(desde), idioma, (b) => esNombre(reponer(b, comoSeBusca)));
    const enteras = new Set<number>();
    const poner = (d: Dicho): Dicho => {
      const entera = SOLO_LA_MARCA.exec(d.buscado);
      if (entera) enteras.add(cualMarca(entera[1]));
      return {
        ...d,
        texto: reponer(d.texto, comoSeDijo),
        // Lo tuyo no se busca: queda con su nombre, como se dijo.
        buscado: reponer(d.buscado, entera ? comoSeDijo : comoSeBusca),
        ...(entera ? { tuyo: lista[cualMarca(entera[1])].tuyo, ...(lista[cualMarca(entera[1])].sinDudas ? { sinDudas: true as const } : {}) } : {}),
        ...(d.partes ? { partes: d.partes.map(poner) } : {}),
        ...(d.lleva ? { lleva: d.lleva.map(poner) } : {}),
      };
    };
    // Lo guardado con el nombre de una comida («Cena liviana») va a esa comida, si la frase no dice otra.
    const grupos = leida.grupos.map((g) => {
      const dichos = g.dichos.map(poner);
      const suya = dichos.map((d) => (d.tuyo === undefined ? null : comidaDelNombre(tuyos[d.tuyo]))).find(Boolean);
      return { ...g, comida: g.comida ?? suya ?? null, dichos };
    });
    const dudosas = lista.map((_, k) => k).filter((k) => !sin.has(k) && !enteras.has(k));
    if (!dudosas.length) return { ...leida, grupos, dichos: grupos.flatMap((g) => g.dichos), comida: grupos.find((g) => g.comida)?.comida ?? null };
    for (const k of dudosas) sin.add(k);
  }
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
