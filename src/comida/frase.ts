// La comida dicha o escrita de una vez («dos huevos revueltos, una tostada con manteca y un café con
// leche»), leída sin IA (lo pediste el 26/10): cada alimento con su cantidad, lo que hay que buscar
// y si vino después de un «con». Saca las muletillas y los verbos («eh, bueno, comí»), entiende la
// comida que se nombra («en el almuerzo») y las correcciones («dos, no, tres»), completa lo que se
// calla («dos empanadas de carne y una de jamón») y corta el «con» solo si el nombre entero no
// existe: «café con leche» es uno, «tostada con manteca» son dos. Cada pedazo lo lee
// recetaDeTexto.ts; buscar y decidir va en entender.ts. La galería usa este mismo archivo.

import type { Comida } from '../dominio/comidas';
import type { Idioma } from './porciones';
import { leerReceta, nombreDeMedida, type Tamano, type Unidad } from './recetaDeTexto';

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
};

export type FraseLeida = { dichos: Dicho[]; comida: Comida | null };

const NUMERO = '(?:\\d+(?:[.,]\\d+)?|un|una|uno|medio|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|a|an|one|two|three|four|five|six|seven|eight|nine|ten|half)';
/** Lo que abre un alimento nuevo: una cantidad o un artículo. */
const EMPIEZA_ALIMENTO = new RegExp(`^(?:${NUMERO}|un par|unos|unas|el|la|los|las|some|the|a couple)(?![\\p{L}])`, 'u');

const MULETILLAS = /^(?:(?:eh+|em+|mm+|este|bueno|a ver|o sea|nada|mir[aá]|che|pues|entonces|hoy|ayer|well|so|um+|uh+|okay|ok)(?![\p{L}])[\s,]*)+/u;
const VERBOS = /^(?:(?:me\s+)?(?:com[ií]|tom[eé]|desayun[eé]|almorc[eé]|merend[eé]|cen[eé]|picote[eé]|clav[eé]|baj[eé])|i\s+(?:had|ate|drank)|had|ate|drank)(?![\p{L}])\s*/u;

const COMIDAS_DICHAS: [RegExp, Comida][] = [
  [/(?:^|\s)(?:en|de|para|a|al)\s+(?:el\s+|la\s+)?desayuno(?![\p{L}])|for\s+breakfast/u, 'desayuno'],
  [/(?:^|\s)(?:en|de|para|a|al)\s+(?:el\s+|la\s+)?almuerzo(?![\p{L}])|for\s+lunch/u, 'almuerzo'],
  [/(?:^|\s)(?:en|de|para|a|al)\s+(?:el\s+|la\s+)?merienda(?![\p{L}])/u, 'merienda'],
  [/(?:^|\s)(?:en|de|para|a|al)\s+(?:el\s+|la\s+)?cena(?![\p{L}])|for\s+dinner/u, 'cena'],
  [/(?:^|\s)(?:de|para|como)\s+(?:un\s+)?snack(?![\p{L}])|for\s+a\s+snack/u, 'snack'],
];

/** Lo que separa un alimento del siguiente, además de la coma: «después», «también», «de postre», «para tomar». */
const SEPARADORES = new RegExp(
  `\\s*(?:;|\\.(?!\\d)|(?:^|\\s)(?:y\\s+)?(?:despu[eé]s|tambi[eé]n|de postre|para tomar|de tomar|then|also|for dessert|to drink)(?![\\p{L}])|(?:^|\\s)m[aá]s(?=\\s+${NUMERO}(?![\\p{L}])))\\s*`,
  'gu',
);

/** «Dos, no, tres medialunas»: queda la cantidad corregida. */
const CORRECCION = new RegExp(`(?<![\\p{L}])${NUMERO}\\s*,?\\s*(?:no|digo|perd[oó]n|mejor)\\s*,?\\s*(${NUMERO})(?![\\p{L}])`, 'gu');

const recortar = (s: string) => s.replace(/^[\s,;:.]+|[\s,;:.]+$/g, '').trim();

/** Corta en las comas (no en «1,5») y en «y» cuando sigue otro alimento («jamón y queso» queda junto, y «y medio» es cantidad). */
function pedazos(texto: string): string[] {
  const salida: string[] = [];
  for (const p of texto.split(/,(?!\d)/)) {
    let desde = 0;
    for (const m of p.matchAll(/\s(?:y|e|and)\s/gu)) {
      const derecha = p.slice(m.index + m[0].length);
      if (EMPIEZA_ALIMENTO.test(derecha) && !/^(?:medio|media|half)(?![\p{L}])/u.test(derecha)) {
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

/** Los «X con Y» de la frase, para saber antes cuáles son un solo alimento de la base («café con leche»). */
export function conCon(texto: string, idioma: Idioma): string[] {
  const lista: string[] = [];
  for (const p of pedazos(prepararTexto(texto).texto)) {
    const limpio = limpiar(p);
    const m = /^(.*?)\s(?:con|with)\s(.+)$/u.exec(limpio);
    if (m) lista.push(leerUno(limpio, idioma).buscado);
  }
  return lista;
}

/** La frase sin las comidas nombradas ni las correcciones, con los separadores como comas. */
function prepararTexto(texto: string): { texto: string; comida: Comida | null } {
  let s = ` ${texto.toLowerCase().replace(/\s+/g, ' ')} `;
  let comida: Comida | null = null;
  for (const [re, c] of COMIDAS_DICHAS) {
    if (re.test(s)) {
      comida = comida ?? c;
      s = s.replace(re, ' ');
    }
  }
  s = s.replace(CORRECCION, (_, segundo: string) => segundo);
  s = s.replace(SEPARADORES, ', ');
  return { texto: s.trim(), comida };
}

const PALABRA_CANTIDAD = new RegExp(`^(?:${NUMERO}|un par de|unos|unas|el|la|los|las|some|the)\\s+`, 'u');
/** «Un plato de arroz»: el plato, el bol o la porción son una porción de lo que sigue. */
const RECIPIENTE = new RegExp(`^(${NUMERO})\\s+(?:platos?|bol(?:es)?|bowls?|taz[oó]n(?:es)?|cuencos?|porci[oó]n(?:es)?|raci[oó]n(?:es)?|plates?|servings?)\\s+(?:de|of)\\s+`, 'u');

/** Un pedazo: con recetaDeTexto; si no encuentra el alimento («un cortado» le parece una preparación), lo que queda sin la cantidad. */
function leerUno(original: string, idioma: Idioma): Dicho {
  const texto = original.replace(RECIPIENTE, '$1 ');
  // Este pedazo ya es un solo alimento: si recetaDeTexto lo parte en el «y» («jamón y queso»), se junta.
  const lineas = leerReceta(texto, idioma).lineas;
  const [l] = lineas;
  if (l && l.buscado) {
    const buscado = lineas.map((x) => x.buscado).filter(Boolean).join(idioma === 'en' ? ' and ' : ' y ');
    const medida = l.unidad ? nombreDeMedida(l.unidad, idioma) : null;
    return { texto: original, buscado, cantidad: l.cantidad, unidad: l.unidad, ...(l.tamano ? { tamano: l.tamano } : {}), ...(medida ? { medida } : {}) };
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
  const { texto: preparado, comida } = prepararTexto(texto);
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
    const leido = leerUno(p, idioma);
    const con = /^(.*?)\s(?:con|with)\s(.+)$/u.exec(p);
    if (con && !esNombre(leido.buscado)) {
      const principal = leerUno(con[1], idioma);
      const despues = leerUno(con[2], idioma);
      dichos.push(principal);
      dichos.push(despues.cantidad === null ? { ...despues, acompanante: true } : despues);
      anterior = principal;
      continue;
    }
    dichos.push(leido);
    anterior = leido;
  }
  return { dichos: dichos.filter((d) => d.buscado), comida };
}
