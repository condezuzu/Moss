// La comida dicha o escrita de una vez («dos huevos revueltos, una tostada con manteca y un café con
// leche»), leída sin IA (lo pediste el 26/10): cada alimento con su cantidad, lo que hay que buscar
// y si vino después de un «con». Saca las muletillas y los verbos («eh, bueno, comí»), entiende la
// comida que se nombra («en el almuerzo») y las correcciones («dos, no, tres»), completa lo que se
// calla («dos empanadas de carne y una de jamón») y corta el «con» solo si el nombre entero no
// existe: «café con leche» es uno, «tostada con manteca» son dos. Cada pedazo lo lee
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
   * si se dijo («un plato grande de fideos»).
   */
  vago?: true;
  plato?: 'chico' | 'mediano' | 'grande';
  /** «Un poco de arroz», «mucho puré»: cuánto, sin número. */
  cuanto?: 'poco' | 'mucho';
};

/** `ayer`: se dijo «ayer», «anoche», «yesterday» o «last night»: es del día anterior. «Anoche», sin otra comida, es la cena. */
export type FraseLeida = { dichos: Dicho[]; comida: Comida | null; ayer: boolean };

const NUMERO = '(?:\\d+(?:[.,]\\d+)?|un|una|uno|medio|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half)';
/** Lo que abre un alimento nuevo: una cantidad o un artículo. */
const EMPIEZA_ALIMENTO = new RegExp(`^(?:${NUMERO}|un par|unos|unas|el|la|los|las|some|the|a couple|much[oa]s?|bastante|poco|algo de)(?![\\p{L}])`, 'u');

const MULETILLAS = /^(?:(?:eh+|em+|mm+|este|bueno|a ver|o sea|nada|mir[aá]|che|pues|entonces|hoy|today|well|so|um+|uh+|okay|ok)(?![\p{L}])[\s,]*)+/u;
/** El día, dicho en cualquier lugar de la frase («comí pizza anoche»); «pan de ayer» no es el día. */
const AYER = /(?<![\p{L}])(?<!de\s)(?:ayer|anoche|last night|yesterday)(?![\p{L}])/gu;
const ANOCHE = /(?<![\p{L}])(?<!de\s)(?:anoche|last night)(?![\p{L}])/u;
const VERBOS = /^(?:(?:me\s+)?(?:com[ií]|comimos|tom[eé]|tomamos|desayun[eé]|desayunamos|almorc[eé]|almorzamos|merend[eé]|merendamos|cen[eé]|cenamos|picote[eé]|clav[eé]|baj[eé])|(?:i|we)\s+(?:had|ate|drank)|had|ate|drank)(?![\p{L}])\s*/u;

/** La comida con lo que la nombra antes, en cualquier lugar: «en el almuerzo», «de cena», «para el snack», «for lunch». */
const nombrada = (palabras: string, ingles: string) => new RegExp(
  `(?:^|\\s)(?:en|de|para|a|al|como)\\s+(?:el\\s+|la\\s+|un\\s+|mi\\s+)?(?:${palabras})(?![\\p{L}])|(?:^|\\s)(?:for|at|during|as)\\s+(?:a\\s+|my\\s+)?(?:${ingles})(?![\\p{L}])`,
  'u',
);

const COMIDAS_DICHAS: [RegExp, Comida][] = [
  [nombrada('desayuno', 'breakfast'), 'desayuno'],
  [nombrada('almuerzo', 'lunch'), 'almuerzo'],
  [nombrada('merienda', 'afternoon\\s+snack'), 'merienda'],
  [nombrada('cena', 'dinner|supper'), 'cena'],
  [nombrada('snack|colaci[oó]n|tentempi[eé]', 'snack'), 'snack'],
  // El verbo también dice la comida: «desayuné dos huevos».
  [/(?:^|\s)(?:desayun[eé]|desayunamos)(?![\p{L}])/u, 'desayuno'],
  [/(?:^|\s)(?:almorc[eé]|almorzamos)(?![\p{L}])/u, 'almuerzo'],
  [/(?:^|\s)(?:merend[eé]|merendamos)(?![\p{L}])/u, 'merienda'],
  [/(?:^|\s)(?:cen[eé]|cenamos)(?![\p{L}])/u, 'cena'],
  // Y el momento del día, si no se nombró la comida: «a la noche comí pizza».
  [/(?:^|\s)(?:(?:a|en|por)\s+la|esta)\s+ma[ñn]ana(?![\p{L}])|this\s+morning|in\s+the\s+morning/u, 'desayuno'],
  [/(?:^|\s)al?\s+mediod[ií]a(?![\p{L}])|at\s+noon/u, 'almuerzo'],
  [/(?:^|\s)(?:(?:a|en|por)\s+la|esta)\s+tarde(?![\p{L}])|this\s+afternoon|in\s+the\s+afternoon/u, 'merienda'],
  [/(?:^|\s)(?:(?:a|en|por)\s+la|esta)\s+noche(?![\p{L}])|tonight|at\s+night/u, 'cena'],
];

/**
 * La comida al empezar, sin nada antes (lo pediste el 30/10/2026): «el desayuno comí…», «la cena fue
 * pizza», «desayuno: dos huevos», «almuerzo de pollo». «La cena de ayer» también dice el día.
 */
const COMIDA_AL_EMPEZAR = /^(?:y\s+)?(?:el\s+|la\s+|mi\s+|my\s+)?(desayuno|almuerzo|merienda|cena|snack|colaci[oó]n|tentempi[eé]|breakfast|lunch|dinner|supper)(?![\p{L}])(?:\s+de\s+(hoy|ayer)(?![\p{L}])|\s+de(?=\s))?\s*[:,-]?\s*(?:(?:fue|fueron|era|eran|was|were)(?![\p{L}]))?/u;
const COMIDA_DE_LA_PALABRA: Record<string, Comida> = {
  desayuno: 'desayuno', breakfast: 'desayuno', almuerzo: 'almuerzo', lunch: 'almuerzo', merienda: 'merienda', cena: 'cena', dinner: 'cena', supper: 'cena',
  snack: 'snack', colacion: 'snack', colación: 'snack', tentempie: 'snack', tentempié: 'snack',
};

/** Lo que separa un alimento del siguiente, además de la coma: «después», «también», «de postre», «para tomar». */
const SEPARADORES = new RegExp(
  `\\s*(?:;|\\.(?!\\d)|(?:^|\\s)(?:y\\s+)?(?:despu[eé]s|tambi[eé]n|de postre|para tomar|de tomar|then|also|for dessert|to drink)(?![\\p{L}])|(?:^|\\s)m[aá]s(?=\\s+${NUMERO}(?![\\p{L}])))\\s*`,
  'gu',
);

/** «Dos, no, tres medialunas»: queda la cantidad corregida. */
const CORRECCION = new RegExp(`(?<![\\p{L}])${NUMERO}\\s*,?\\s*(?<![\\p{L}])(?:no|digo|perd[oó]n|mejor)(?![\\p{L}])\\s*,?\\s*(${NUMERO})(?![\\p{L}])`, 'gu');
/**
 * «Dos huevos, no, tres» o «dos medialunas, no, eran tres»: el número corregido va con lo de antes.
 * Lo de antes son palabras sueltas, sin cruzar un «y»: «un café y dos huevos, no, tres».
 */
const CORRECCION_DESPUES = new RegExp(
  `(?<![\\p{L}])${NUMERO}((?:\\s+(?!(?:y|e|and|no|digo|mejor)(?![\\p{L}]))[\\p{L}]+)+?)\\s*,?\\s*(?<![\\p{L}])(?:no|digo|perd[oó]n|mejor|i mean|sorry)(?![\\p{L}])\\s*,?\\s*(?:(?:eran?|fueron|son|it was|they were)\\s+)?(${NUMERO})(?![\\p{L}])`,
  'gu',
);
/** «Un huevo y medio», «una pizza y media»: uno y medio de eso. */
const Y_MEDIO = new RegExp(`(?<![\\p{L}])(${NUMERO})((?:\\s+(?!(?:y|e|and|con|with)(?![\\p{L}]))[\\p{L}]+){1,3}?)\\s+(?:y|and\\s+a)\\s+(?:medio|media|half)(?![\\p{L}])`, 'gu');
/** Lo que queda solo y no es un alimento: una negación, un número o una palabra de unión. */
const VACIO = new RegExp(`^(?:no|s[ií]|ok|okay|nada|algo|eso|esto|eran?|fueron|son|y|e|o|de|con|sin|${NUMERO}|(?:y|and)\\s+(?:an?\\s+)?(?:medio|media|half))$`, 'u');

const recortar = (s: string) => s.replace(/^[\s,;:.]+|[\s,;:.]+$/g, '').trim();

/** Corta en las comas (no en «1,5») y en «y» cuando sigue otro alimento («jamón y queso» queda junto, y «y medio» es cantidad). */
function pedazos(texto: string): string[] {
  const salida: string[] = [];
  for (const p of texto.split(/,(?!\d)/)) {
    let desde = 0;
    for (const m of p.matchAll(/\s(?:y|e|and)\s/gu)) {
      const derecha = p.slice(m.index + m[0].length);
      if (EMPIEZA_ALIMENTO.test(derecha) && !/^(?:an?\s+)?(?:medio|media|half)(?![\p{L}])/u.test(derecha)) {
        salida.push(p.slice(desde, m.index));
        desde = m.index + m[0].length;
      }
    }
    salida.push(p.slice(desde));
  }
  return salida.map(recortar).filter(Boolean);
}

/** Sin muletillas ni verbos al principio: «eh bueno comí dos empanadas» → «dos empanadas». */
const limpiar = (s: string) => recortar(recortar(s).replace(MULETILLAS, '').replace(VERBOS, '').replace(MULETILLAS, ''));

/** «X con Y y Z»: lo de antes del «y» que sigue al «con», y lo de después, que es otra cosa salvo que el nombre entero exista. */
const CON_Y = /^(.*?\s(?:con|with)\s.+?)\s(?:y|e|and)\s(.+)$/u;

/** Los «X con Y» de la frase, para saber antes cuáles son un solo alimento de la base («café con leche»). */
export function conCon(texto: string, idioma: Idioma): string[] {
  const lista: string[] = [];
  for (const p of pedazos(prepararTexto(texto).texto)) {
    const limpio = limpiar(p);
    if (!/\s(?:con|with)\s/u.test(limpio)) continue;
    lista.push(leerUno(limpio, idioma).buscado);
    const y = CON_Y.exec(limpio);
    if (y) lista.push(leerUno(y[1], idioma).buscado);
  }
  return lista;
}

/** La frase sin las comidas nombradas ni las correcciones, con los separadores como comas. */
function prepararTexto(texto: string): { texto: string; comida: Comida | null; ayer: boolean } {
  let s = ` ${texto.toLowerCase().replace(/\s+/g, ' ')} `;
  let comida: Comida | null = null;
  const desde = s.trim().replace(MULETILLAS, '');
  const alEmpezar = COMIDA_AL_EMPEZAR.exec(desde);
  if (alEmpezar) {
    comida = COMIDA_DE_LA_PALABRA[alEmpezar[1]];
    s = ` ${desde.slice(alEmpezar[0].length)} `;
  }
  for (const [re, c] of COMIDAS_DICHAS) {
    if (re.test(s)) {
      comida = comida ?? c;
      s = s.replace(re, ' ');
    }
  }
  if (!comida && ANOCHE.test(s)) comida = 'cena';
  const sinDia = s.replace(AYER, ' ');
  const ayer = sinDia !== s || alEmpezar?.[2] === 'ayer';
  s = sinDia;
  s = s.replace(CORRECCION, (_, segundo: string) => segundo);
  s = s.replace(CORRECCION_DESPUES, (_, cosa: string, segundo: string) => `${segundo}${cosa}`);
  s = s.replace(Y_MEDIO, (todo: string, n: string, cosa: string) => {
    const valor = VALOR_DE_PALABRA[n] ?? Number(n.replace(',', '.'));
    return Number.isInteger(valor) && valor > 0 ? `${valor}½${cosa}` : todo;
  });
  s = s.replace(SEPARADORES, ', ');
  return { texto: s.trim(), comida, ayer };
}

const PALABRA_CANTIDAD = new RegExp(`^(?:${NUMERO}|un par de|unos|unas|el|la|los|las|some|the)\\s+`, 'u');
/**
 * «Un plato de arroz»: el plato, el bol o la porción son una porción de lo que sigue, quizás con su
 * tamaño («un plato grande de fideos»).
 */
const RECIPIENTE = new RegExp(`^(${NUMERO}|un\\s+cuarto\\s+de|tres\\s+cuartos\\s+de|un\\s+tercio\\s+de|half\\s+a|a\\s+quarter\\s+of|a\\s+third\\s+of)\\s+(plat(?:os?|itos?|azos?)|bol(?:es)?|bowls?|taz[oó]n(?:es)?|cuencos?|porci[oó]n(?:es)?|raci[oó]n(?:es)?|plates?|servings?)(?:\\s+(?:hond[oa]s?|play[oa]s?))?(?:\\s+(chic[oa]s?|median[oa]s?|grandes?|peque[nñ][oa]s?|abundantes?|llen[oa]s?|colmad[oa]s?|bien\\s+servid[oa]s?|small|medium|large|big|full))?\\s+(?:de|of)\\s+`, 'u');
const TAMANO_DEL_PLATO: Record<string, 'chico' | 'mediano' | 'grande'> = {
  chic: 'chico', pequ: 'chico', smal: 'chico', medi: 'mediano', gran: 'grande', abun: 'grande', llen: 'grande', colm: 'grande', bien: 'grande', larg: 'grande', big: 'grande', full: 'grande',
};
/** Lo que no es una palabra de cantidad de las de siempre: «un cuarto de plato». */
const FRACCION_DEL_PLATO: Record<string, number> = { 'un cuarto de': 0.25, 'tres cuartos de': 0.75, 'un tercio de': 0.33, 'half a': 0.5, 'a quarter of': 0.25, 'a third of': 0.33 };
/** El tamaño que se dijo después del alimento, como lo lee recetaDeTexto: «un plato de fideos grande». */
const TAMANO_DE_LA_RECETA: Record<Tamano, 'chico' | 'mediano' | 'grande'> = { pequeno: 'chico', mediano: 'mediano', grande: 'grande' };
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
  const [todo, numero, cual, dicho] = recipiente;
  const leido = leerSinRecipiente(original, `${FRACCION_DEL_PLATO[numero] ?? numero} ${original.slice(todo.length)}`, idioma);
  const porLaPalabra = cual.startsWith('platit') ? 'chico' as const : cual.startsWith('plataz') ? 'grande' as const : undefined;
  const plato = dicho ? TAMANO_DEL_PLATO[dicho.slice(0, 4)] ?? TAMANO_DEL_PLATO[dicho.slice(0, 3)] : porLaPalabra ?? (leido.tamano ? TAMANO_DE_LA_RECETA[leido.tamano] : undefined);
  return { ...leido, vago: true, ...(plato ? { plato } : {}) };
}

function leerSinRecipiente(original: string, texto: string, idioma: Idioma): Dicho {
  // Este pedazo ya es un solo alimento: si recetaDeTexto lo parte en el «y» («jamón y queso»), se junta.
  const lineas = leerReceta(texto, idioma).lineas.filter((x) => x.buscado);
  const [l] = lineas;
  if (l) {
    const buscado = lineas.map((x) => x.buscado).join(idioma === 'en' ? ' and ' : ' y ');
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

/**
 * Lee la frase. `esNombre` dice si un «X con Y» es un alimento de la base (lo busca quien llama, con
 * conCon): si no, se corta en dos y lo de después del «con», sin cantidad, va como acompañante.
 */
export function leerFrase(texto: string, idioma: Idioma, esNombre: (buscado: string) => boolean = () => false): FraseLeida {
  const { texto: preparado, comida, ayer } = prepararTexto(texto);
  const dichos: Dicho[] = [];
  let anterior: Dicho | null = null;
  for (const pedazo of pedazos(preparado)) {
    let p = limpiar(pedazo);
    if (!p) continue;
    // Lo que se calla es lo de antes: «dos empanadas de carne y una de jamón» (la empanada), «200 g de
    // arroz y 150 de pollo» o «un vaso de leche y uno de jugo» (la unidad).
    const elipsis = new RegExp(`^(${NUMERO})\\s+de\\s+`, 'u').exec(p);
    if (elipsis && anterior) {
      // «uno de jugo» es «un vaso de jugo».
      const cuanto = elipsis[1] === 'uno' ? 'un' : elipsis[1];
      p = `${cuanto} ${anterior.unidad ?? anterior.buscado.split(' ')[0]} de ${p.slice(elipsis[0].length)}`;
    }
    // «Café con leche y medialunas»: lo de después del «y» es otra cosa, salvo que el nombre entero exista.
    let resto: string | null = null;
    const y = CON_Y.exec(p);
    if (y && !esNombre(leerUno(p, idioma).buscado)) {
      p = y[1];
      resto = y[2];
    }
    const leido = leerUno(p, idioma);
    const con = /^(.*?)\s(?:con|with)\s(.+)$/u.exec(p);
    const partido = !!con && !esNombre(leido.buscado);
    if (con && partido) {
      const principal = leerUno(con[1], idioma);
      const despues = leerUno(con[2], idioma);
      dichos.push(principal);
      dichos.push(despues.cantidad === null ? { ...despues, acompanante: true } : despues);
      anterior = principal;
    } else {
      dichos.push(leido);
      anterior = leido;
    }
    if (resto) {
      const otro = leerUno(resto, idioma);
      // «Tostada con manteca y mermelada»: también acompaña. «Café con leche y medialunas»: no.
      dichos.push(partido && otro.cantidad === null ? { ...otro, acompanante: true } : otro);
    }
  }
  return { dichos: dichos.filter((d) => d.buscado && !VACIO.test(d.buscado)), comida, ayer };
}
