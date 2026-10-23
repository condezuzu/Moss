// Una receta pegada como texto («200 g de arroz, 2 huevos…»), leída sin IA: cada ingrediente con su
// cantidad, su unidad y lo que hay que buscar, más las porciones que rinde y lo que pesa terminada.
// Cada línea se busca después con el buscador de siempre y la persona confirma el alimento; acá solo
// se lee el texto y, con el alimento elegido, se pasa una línea a gramos (gramosDeLinea). Las cuentas
// de la receta ya están en src/dominio/registros.ts (valoresDeReceta). Lee español (del Río de la
// Plata, de España y de México) e inglés. La galería usa este mismo archivo: solo importa porciones.ts.

import { pluralDePorcion, type Idioma } from './porciones';

/** La unidad de una línea, la misma en los dos idiomas: «cup» es 'taza' y «clove», 'diente'. */
export type Unidad =
  | 'g' | 'kg' | 'mg' | 'oz' | 'lb'
  | 'ml' | 'l' | 'cl' | 'dl' | 'fl oz'
  | 'taza' | 'cucharada' | 'cucharadita' | 'pizca' | 'vaso' | 'pocillo' | 'chorrito'
  | 'unidad' | 'diente' | 'rebanada' | 'feta' | 'lata' | 'paquete' | 'sobre' | 'puñado' | 'hoja' | 'rama' | 'atado'
  | 'cabeza' | 'filete' | 'trozo';

export type Tamano = 'pequeno' | 'mediano' | 'grande';

export type LineaDeReceta = {
  /** La línea como vino, sin la viñeta. */
  texto: string;
  /** Sin cantidad («sal a gusto»), null. De un rango («2 a 3»), el medio. */
  cantidad: number | null;
  unidad: Unidad | null;
  /** Lo que se busca: sin cantidad, unidad, conectores ni cómo se prepara, en minúsculas y en singular. */
  buscado: string;
  /** Lo que se sacó de la búsqueda: «a gusto», «picada», «opcional», «(sin piel)». */
  nota: string | null;
  /** Solo si se escribió: «1 cebolla grande», «2 large eggs». Elige la porción de ese tamaño. */
  tamano?: Tamano;
};

export type RecetaLeida = { lineas: LineaDeReceta[]; porciones: number | null; pesoFinal: number | null };

/** Lo que gramosDeLinea necesita del alimento elegido: sus porciones con nombre y, si se toma, su densidad (g por ml). */
export type AlimentoParaGramos = { porciones: readonly { nombre: string; gramos: number }[]; densidad: number | null };

// ——— El texto plano ———

const EQUIVALENTES: Record<string, string> = { '–': '-', '—': '-', '‑': '-', '−': '-', '×': 'x', '⁄': '/', '’': "'", '‘': "'", [String.fromCharCode(160)]: ' ' };

/**
 * En minúsculas y sin tildes, letra por letra: cada posición del texto plano es la misma del
 * original, así lo que se reconoce en el plano se recorta del original con sus tildes.
 */
function aplanar(texto: string): string {
  let plano = '';
  for (const c of texto) {
    const igual = EQUIVALENTES[c];
    if (igual) {
      plano += igual;
      continue;
    }
    const p = c.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
    plano += p.length === c.length ? p : c;
  }
  return plano;
}

/** Tapa con espacios un tramo, sin cambiar el largo. */
const tapar = (s: string, desde: number, hasta: number) => s.slice(0, desde) + ' '.repeat(Math.max(0, hasta - desde)) + s.slice(hasta);

const juntarEspacios = (s: string) => s.replace(/\s+/g, ' ').trim();

// ——— Las unidades ———

/**
 * Cada unidad con sus nombres en español y en inglés, en singular (el plural sale de porciones.ts,
 * el mismo de las porciones de la base), y sus abreviaturas tal cual.
 */
const UNIDADES: readonly (readonly [Unidad, readonly string[], readonly string[], readonly string[]])[] = [
  ['g', ['gramo'], ['gram', 'gramme'], ['g', 'gr', 'grs', 'grm', 'grms', 'gm', 'gms']],
  ['kg', ['kilo', 'kilogramo'], ['kilogram'], ['kg', 'kgs']],
  ['mg', ['miligramo'], ['milligram'], ['mg']],
  ['oz', ['onza'], ['ounce'], ['oz', 'ozs']],
  ['lb', ['libra'], ['pound'], ['lb', 'lbs']],
  ['ml', ['mililitro'], ['milliliter', 'millilitre'], ['ml', 'mls', 'cc', 'cm3']],
  ['l', ['litro'], ['liter', 'litre'], ['l', 'lt', 'lts', 'ltr']],
  ['cl', ['centilitro'], ['centiliter', 'centilitre'], ['cl']],
  ['dl', ['decilitro'], ['deciliter', 'decilitre'], ['dl']],
  ['fl oz', ['onza líquida'], ['fluid ounce'], ['fl oz', 'floz']],
  ['taza', ['taza', 'tacita'], ['cup'], ['tz', 'tza', 'tzas']],
  ['cucharada', ['cucharada', 'cucharada sopera', 'cuchara'], ['tablespoon'], ['cda', 'cdas', 'cuch', 'tbsp', 'tbsps', 'tbs', 'tbl', 'tblsp']],
  ['cucharadita', ['cucharadita', 'cucharita'], ['teaspoon'], ['cdta', 'cdtas', 'cdita', 'cditas', 'cdt', 'tsp', 'tsps']],
  ['pizca', ['pizca', 'pizquita'], ['pinch', 'dash', 'smidgen'], []],
  ['vaso', ['vaso', 'vasito', 'copa'], ['glass'], []],
  ['pocillo', ['pocillo'], [], []],
  ['chorrito', ['chorrito', 'chorro'], ['splash', 'drizzle'], []],
  ['unidad', ['unidad', 'pieza', 'cubo', 'cubito', 'pastilla'], ['piece', 'unit', 'cube'], ['u', 'ud', 'uds', 'unid', 'pza', 'pzas', 'pz', 'pc', 'pcs']],
  ['diente', ['diente', 'dientito'], ['clove'], []],
  ['rebanada', ['rebanada', 'rodaja', 'tajada', 'loncha', 'lonja'], ['slice', 'wedge'], []],
  ['feta', ['feta', 'fetita'], [], []],
  ['lata', ['lata', 'latita'], ['can', 'tin'], []],
  ['paquete', ['paquete', 'paquetito', 'bolsa', 'bolsita', 'caja', 'cajita', 'envase', 'pote', 'potecito', 'frasco', 'frasquito', 'botella', 'botellita', 'tarro', 'barra', 'barrita', 'tableta'],
    ['package', 'pack', 'bag', 'box', 'container', 'jar', 'bottle', 'tub', 'carton', 'stick', 'bar'], ['paq', 'pkg', 'pkgs']],
  ['sobre', ['sobre', 'sobrecito'], ['packet', 'sachet', 'envelope'], []],
  ['puñado', ['puñado', 'puñadito'], ['handful'], []],
  ['hoja', ['hoja', 'hojita'], ['leaf'], ['leaves']],
  ['rama', ['rama', 'ramita', 'tallo', 'penca'], ['sprig', 'stalk', 'stem', 'rib'], []],
  ['atado', ['atado', 'manojo', 'mazo'], ['bunch', 'bundle'], []],
  ['cabeza', ['cabeza'], ['head', 'bulb'], []],
  ['filete', ['filete'], ['fillet', 'filet'], []],
  ['trozo', ['trozo', 'trocito', 'pedazo', 'pedacito'], ['chunk'], []],
];

/** La forma escrita, sin puntos ni espacios, para buscarla: «fl. oz.» y «floz» son la misma. */
const claveDeUnidad = (s: string) => aplanar(s).replace(/[.\s]/g, '');

const FORMAS = new Map<string, Unidad>();
const ESCRITAS: string[] = [];
for (const [unidad, es, en, sueltas] of UNIDADES) {
  const todas = [...es.flatMap((f) => [f, pluralDePorcion(f, 'es')]), ...en.flatMap((f) => [f, pluralDePorcion(f, 'en')]), ...sueltas];
  for (const forma of todas) {
    FORMAS.set(claveDeUnidad(forma), unidad);
    ESCRITAS.push(aplanar(forma));
  }
}
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Las más largas primero, para que «cucharadas soperas» gane a «cucharadas» y «lb» a «l».
const RE_UNIDAD = new RegExp(
  `(?:${[...new Set(ESCRITAS)].sort((a, b) => b.length - a.length).map((f) => f.split(' ').map(escapar).join('[.\\s]*')).join('|')})\\.?(?![\\p{L}\\d])`,
  'uy',
);

/** Las que pesan: se pasan a gramos sin mirar el alimento. */
const GRAMOS_POR: Partial<Record<Unidad, number>> = { g: 1, kg: 1000, mg: 0.001, oz: 28.349523125, lb: 453.59237 };
/**
 * Las que miden volumen, en ml. La taza, la cucharada y la cucharadita son las de Estados Unidos
 * (USDA); la pizca, un dieciseisavo de cucharadita; el vaso, el de 200 ml de las porciones de la base.
 */
const ML_POR: Partial<Record<Unidad, number>> = { ml: 1, l: 1000, cl: 10, dl: 100, 'fl oz': 29.5735295625, taza: 236.6, cucharada: 14.8, cucharadita: 4.9, pizca: 0.31, vaso: 200 };
/** Las de volumen que no tienen porción con nombre: van directo por la densidad. */
const METRICAS = new Set<Unidad>(['ml', 'l', 'cl', 'dl', 'fl oz']);
/** Las de un envase: el tamaño que sigue («1 lata de 400 g») es de cada uno. */
const ENVASES = new Set<Unidad>(['lata', 'paquete', 'sobre']);

/** La unidad de una palabra («cdas», «cloves», «fl oz»), o null. */
const unidadDePalabra = (palabra: string): Unidad | null => FORMAS.get(claveDeUnidad(palabra)) ?? null;

// ——— Los tamaños ———

const TAMANOS: Record<string, Tamano> = {};
for (const [tamano, palabras] of [
  ['grande', 'grande grandes grandecito grandecita grandecitos grandecitas large big jumbo xl'],
  ['mediano', 'mediano mediana medianos medianas medium med'],
  ['pequeno', 'pequeno pequena pequenos pequenas chico chica chicos chicas chiquito chiquita chiquitos chiquitas small'],
] as const) for (const p of palabras.split(' ')) TAMANOS[p] = tamano;
const RE_TAMANO = new RegExp(`(?:extra[\\s-]?)?(${Object.keys(TAMANOS).join('|')})(?![\\p{L}])`, 'uy');

// ——— El lector: recorre el texto plano y avanza con lo que reconoce ———

type Lector = { o: string; p: string; i: number };

/** Prueba una expresión fija (con la bandera y) después de los espacios; si no está, no avanza. */
function tomar(l: Lector, re: RegExp): RegExpExecArray | null {
  let i = l.i;
  while (i < l.p.length && /\s/.test(l.p[i])) i++;
  re.lastIndex = i;
  const m = re.exec(l.p);
  if (m) l.i = re.lastIndex;
  return m;
}

/** Corre una lectura y, si no da nada, deja el lector donde estaba. */
function probar<T>(l: Lector, leer: () => T | null): T | null {
  const antes = l.i;
  const r = leer();
  if (r === null) l.i = antes;
  return r;
}

const FRACCIONES: Record<string, number> = {
  '¼': 1 / 4, '½': 1 / 2, '¾': 3 / 4, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 1 / 8, '⅜': 3 / 8, '⅝': 5 / 8, '⅞': 7 / 8,
  '⅕': 1 / 5, '⅖': 2 / 5, '⅗': 3 / 5, '⅘': 4 / 5, '⅙': 1 / 6, '⅚': 5 / 6,
};
const FRAC = `[${Object.keys(FRACCIONES).join('')}]`;
const RE_BARRA = /(\d+)\s*\/\s*(\d+)(?!\d)/y;
const RE_DECIMAL = new RegExp(`(\\d+)(?:([.,])(\\d+))?(?:\\s*(${FRAC}))?`, 'uy');
const RE_FRACCION = new RegExp(`(${FRAC})`, 'uy');
/** Después de «1.000» o «1,000», lo que dice que son miles y no un decimal: los gramos y los ml no se escriben con tres decimales. */
const RE_MILES = /\s*(?:g|gr|grs|gramos?|mg|ml|cc|mililitros?|cm3)(?![\p{L}])/uy;

/** «1/2», «½», «3/4». */
function leerFraccion(l: Lector): number | null {
  const barra = probar(l, () => {
    const m = tomar(l, RE_BARRA);
    return m && Number(m[2]) > 0 ? Number(m[1]) / Number(m[2]) : null;
  });
  if (barra !== null) return barra;
  const m = tomar(l, RE_FRACCION);
  return m ? FRACCIONES[m[1]] : null;
}

/** Un número con cifras: «2», «1,5», «1.5», «1.000 g», «½», «1½», «1/2». */
function leerCifras(l: Lector): number | null {
  const fraccion = leerFraccion(l);
  if (fraccion !== null) return fraccion;
  const m = tomar(l, RE_DECIMAL);
  if (!m) return null;
  let valor = Number(m[1]);
  if (m[3] !== undefined) {
    RE_MILES.lastIndex = l.i;
    const miles = m[3].length === 3 && m[1] !== '0' && RE_MILES.test(l.p);
    valor = miles ? Number(m[1] + m[3]) : Number(`${m[1]}.${m[3]}`);
  }
  if (m[4]) valor += FRACCIONES[m[4]];
  return valor;
}

const RE_PALABRA_NUMERO = new RegExp(
  '(media docena|half a dozen|un par(?: de)?|a couple(?: of)?|un cuarto(?: de)?|tres cuartos(?: de)?|un tercio(?: de)?|dos tercios(?: de)?|' +
    'a quarter(?: of)?|three quarters(?: of)?|a third(?: of)?|a half|one half|half(?: an?)?|un[oa]?|medi[oa]|dos|tres|cuatro|cinco|seis|siete|ocho|' +
    'nueve|diez|once|doce|quince|veinte|cuarto|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)(?![\\p{L}])',
  'uy',
);
const PALABRAS_NUMERO: Record<string, number> = {
  un: 1, una: 1, uno: 1, medio: 0.5, media: 0.5, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, quince: 15, veinte: 20, cuarto: 0.25, a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};

/** Un número con palabras: «una», «media», «un par de», «un cuarto de», «a», «half a», «a dozen». */
function leerPalabraNumero(l: Lector, idioma: Idioma): number | null {
  return probar(l, () => {
    const m = tomar(l, RE_PALABRA_NUMERO);
    if (!m) return null;
    const t = m[1];
    // «a» es un artículo solo en inglés, y «once» es once solo en español.
    if ((t === 'a' || t === 'an') && idioma !== 'en') return null;
    if (t === 'once' && idioma !== 'es') return null;
    // «cuarto kilo» es ¼ kg, pero «cuarto de pollo» es una presa.
    if (t === 'cuarto') {
      RE_UNIDAD.lastIndex = l.i + (/^\s*(?:de\s+)?/.exec(l.p.slice(l.i))?.[0].length ?? 0);
      if (!RE_UNIDAD.test(l.p)) return null;
    }
    if (/^(media docena|half a dozen)$/.test(t)) return 6;
    if (/^(un par|a couple)/.test(t)) return 2;
    if (/^(un cuarto|a quarter)/.test(t)) return 0.25;
    if (/^(tres cuartos|three quarters)/.test(t)) return 0.75;
    if (/^(un tercio|a third)/.test(t)) return 1 / 3;
    if (/^dos tercios/.test(t)) return 2 / 3;
    if (/^(a half|one half|half)/.test(t)) return 0.5;
    return PALABRAS_NUMERO[t] ?? null;
  });
}

const RE_Y_MEDIO = new RegExp(`(?:y|and)\\s+(medio|media|a half|half|un cuarto|cuarto|a quarter|${FRAC}|1\\s*/\\s*2|1\\s*/\\s*4)(?![\\p{L}\\d])`, 'uy');
const valorDeYMedio = (t: string) => (/cuarto|quarter|¼|1\s*\/\s*4/.test(t) ? 0.25 : FRACCIONES[t] ?? 0.5);

/** Un número entero o mixto: «2», «1 1/2», «1-1/2», «1 ½», «1 y ½», «1 y medio», «one and a half». */
function leerNumero(l: Lector, idioma: Idioma): number | null {
  let n = leerCifras(l) ?? leerPalabraNumero(l, idioma);
  if (n === null) return null;
  if (Number.isInteger(n)) {
    // «1 1/2» y, en inglés, «1-1/2»: el guion no es un rango si sigue una fracción.
    const resto = probar(l, () => {
      tomar(l, /-/y);
      const f = leerFraccion(l);
      return f !== null && f < 1 ? f : null;
    });
    if (resto !== null) n += resto;
  }
  const yMedio = tomar(l, RE_Y_MEDIO);
  if (yMedio) n += valorDeYMedio(yMedio[1]);
  return n;
}

/** Una cantidad: un número, un rango («2-3», «2 a 3», «dos o tres»: el medio) y las docenas. */
function leerCantidad(l: Lector, idioma: Idioma): number | null {
  const a = leerNumero(l, idioma);
  if (a === null) return null;
  let valor = a;
  const b = probar(l, () => {
    if (!tomar(l, /(?:-|(?:a|al|o|u|to|or)(?![\p{L}]))/uy)) return null;
    const n = leerNumero(l, idioma);
    return n !== null && n > a ? n : null;
  });
  if (b !== null) valor = (a + b) / 2;
  if (tomar(l, /(?:docenas?|dozens?)(?![\p{L}])/uy)) valor *= 12;
  return valor;
}

/** La unidad que sigue a la cantidad: «g», «tazas», «cdas.», «c/s», «cloves»; en inglés, también «T», «t» y «c.». */
function leerUnidad(l: Lector, idioma: Idioma): Unidad | null {
  return probar(l, () => {
    // «c/s» y «c/c»: la cuchara sopera y la de café.
    const cuchara = tomar(l, /c\s*\/\s*([sc])\.?(?![\p{L}])/uy);
    if (cuchara) return cuchara[1] === 's' ? 'cucharada' : 'cucharadita';
    if (idioma === 'en') {
      // En inglés la mayúscula importa: «1 T» es una cucharada y «1 t», una cucharadita.
      const desde = l.i + (/^\s*/.exec(l.p.slice(l.i))?.[0].length ?? 0);
      const letra = /^([Tt])\.?(?![\p{L}\d])/u.exec(l.o.slice(desde));
      if (letra) {
        l.i = desde + letra[0].length;
        return letra[1] === 'T' ? 'cucharada' : 'cucharadita';
      }
      if (tomar(l, /c\.(?![\p{L}])/uy)) return 'taza';
    }
    const m = tomar(l, RE_UNIDAD);
    return m ? FORMAS.get(claveDeUnidad(m[0])) ?? null : null;
  });
}

function leerTamano(l: Lector): Tamano | null {
  const m = tomar(l, RE_TAMANO);
  return m ? TAMANOS[m[1]] : null;
}

/** Un peso o un volumen medido: «400 g», «unos 300 g», «15-oz», «240 ml», «400 g c/u». */
type Medida = { valor: number; unidad: Unidad; cadaUno: boolean };

const RE_APROXIMADO = /(?:aprox(?:imadamente)?\.?|unos|unas|alrededor de|cerca de|about|approx\.?|approximately|around|roughly|~|±)\s*/uy;
const RE_CADA_UNO = /(?:c\s*\/\s*u|cada un[oa]|each|por unidad)\.?(?![\p{L}])/uy;
const esMedible = (u: Unidad | null): u is Unidad => !!u && (GRAMOS_POR[u] !== undefined || METRICAS.has(u));
/** «1 heaping tablespoon»: en inglés, cómo se llena la medida va antes de la medida. */
const RE_LLENADO = /(heaping|heaped|level|rounded|scant|generous)(?![\p{L}])/uy;

/** Con `caseras`, también la taza y las cucharadas: «1 stick (1/2 cup) butter». */
function leerMedida(l: Lector, idioma: Idioma, caseras = false): Medida | null {
  return probar(l, () => {
    tomar(l, RE_APROXIMADO);
    const valor = leerCantidad(l, idioma);
    if (valor === null) return null;
    tomar(l, /-/y);
    const unidad = leerUnidad(l, idioma);
    if (!esMedible(unidad) && !(caseras && unidad && ML_FIABLES.has(unidad))) return null;
    return { valor, unidad: unidad!, cadaUno: !!tomar(l, RE_CADA_UNO) };
  });
}

/** Lo que pesa una medida, en gramos; los líquidos, como el agua. */
const gramosDeMedida = (m: Medida) => m.valor * (GRAMOS_POR[m.unidad] ?? ML_POR[m.unidad] ?? 1);

// ——— Lo que no se busca: la nota y cómo se prepara ———

/**
 * Lo que queda como nota: cuánto («a gusto», «c/n»), si hace falta y para qué. «para» con un
 * artículo o un verbo («para freír», «para la masa») y «for» van hasta el final; «salsa para
 * enchiladas» es un alimento.
 */
const RE_NOTAS = new RegExp(
  String.raw`(?<![\p{L}])(?:a gusto|al gusto|c\s*/\s*[sn]|cantidad (?:necesaria|suficiente)|lo (?:necesario|que (?:admita|acepte|pida|haga falta))|` +
    String.raw`opcional(?:mente)?|optional|to taste|as needed|as required|if (?:needed|desired|you like)|si (?:se desea|quieres|queres|gustas|te gusta)|` +
    String.raw`dividid[oa]s?|divided|separad[oa]s?|separated|(?:y|and|plus|o)\s+(?:un poco\s+)?(?:mas|more|extra)(?![\p{L}]).*$|` +
    String.raw`(?:extra|mas)\s+(?:para|for)(?![\p{L}]).*$|para\s+(?:el|la|los|las|\p{L}+(?:ar|er|ir))(?![\p{L}]).*$|for(?![\p{L}]).*$)(?![\p{L}])`,
  'gu',
);
/** Las notas que valen para toda una lista sin cantidades: «Sal, pimienta y orégano a gusto». */
const RE_NOTA_COMPARTIDA = /a gusto|al gusto|c\s*\/\s*[sn]|cantidad|necesari|to taste|as needed|opcional|optional/;

/** Cómo se prepara, en español y en inglés. No cambia el alimento que se busca. */
const RE_PREPARACION = new RegExp(
  String.raw`(?<![\p{L}])(?:` +
    [
      String.raw`(?:picad|cortad|trozad|trocead|rallad|pelad|desmenuzad|deshebrad|triturad|machacad|aplastad|pisad|exprimid|colad|escurrid|enjuagad|lavad|` +
        String.raw`derretid|fundid|ablandad|batid|tamizad|cernid|filetead|laminad|rebanad|desgranad|deshuesad|despepitad|desvenad|remojad|hidratad|picadit|` +
        String.raw`molid|limpi|tibi|fri|helad|fin|grues)(?:o|a|os|as)(?:\s+(?:fin[oa]s?|grues[oa]s?|bien|en\s+(?:cubos|cubitos|dados|tiras|rodajas|juliana|trozos)))?`,
      'calientes?', 'blandas?', 'blandos?', 'pomada', 'finamente', 'groseramente', 'toscamente', 'bien', 'recien', 'apenas',
      'sin (?:la |el |las |los )?(?:piel|semillas?|cascaras?|hueso|carozo|espinas?|tallos?|venas?|nervios?|corazon)',
      'a temperatura ambiente', 'a punto (?:de )?nieve', 'a nieve', 'virgen extra', 'extra[ -]?virgen', 'extra[ -]?virgin',
      'colmad[oa]s?', 'al ras', 'rasa?s?', 'heaping', 'heaped', 'level', 'rounded', 'scant', 'generous',
      String.raw`cortad[oa]s?\s+(?:en|a)\s+[^,;]*`,
      String.raw`en (?:cubos|cubitos|dados|daditos|juliana|rodajas|rodajitas|tiras|tiritas|laminas|laminitas|lonchas|trozos|trocitos|pedazos|mitades|cuartos|gajos|` +
        String.raw`brunoise|aros|bastones|pluma|hebras|cascos|octavos|rebanadas|fetas|hilos|cuadraditos)(?:\s+(?:chic[oa]s|pequen[oa]s|medianos|grandes|fin[oa]s|` +
        String.raw`grues[oa]s|parejos|regulares|de\s+[\d.,]+\s*(?:cm|mm)))?`,
      'finely', 'roughly', 'coarsely', 'thinly', 'thickly', 'freshly', 'lightly', 'firmly', 'loosely', 'well', 'chopped', 'diced', 'minced', 'sliced',
      'grated', 'shredded', 'peeled', 'seeded', 'deseeded', 'cored', 'pitted', 'stemmed', 'halved', 'quartered', 'cubed', 'julienned', 'crumbled',
      'melted', 'softened', 'beaten', 'whisked', 'sifted', 'packed', 'drained', 'rinsed', 'trimmed', 'deveined', 'thawed', 'chilled', 'cooled',
      'cold', 'warm', 'lukewarm', 'boneless', 'skinless', 'crushed', 'mashed', 'torn', 'squeezed', 'juiced', 'zested', 'ground',
      '(?:at )?room[ -]temperature', 'patted dry', String.raw`cut (?:into|in)\s+[^,;]*`,
    ].join('|') +
    String.raw`)(?![\p{L}])`,
  'gu',
);
/** Las preparaciones que, junto al alimento, son otro alimento en la base: el pan rallado no es pan. */
const RE_COMPUESTOS = new RegExp(
  String.raw`(?<![\p{L}])(?:pan (?:rallado|molido|tostado)|(?:queso|parmesano|reggianito|coco) rallad[oa]|carne (?:picada|molida)|` +
    String.raw`(?:cerdo|pollo|pavo|res|ternera|cordero|borrego|vacuno|vaca) (?:picad|molid)[oa]|tomates? triturados?|crema batida|cafe molido|` +
    String.raw`maiz pisado|(?:aji|chile) molido|crushed tomato(?:es)?|crushed red pepper|mashed potato(?:es)?|whipped cream|grated (?:parmesan|cheese)|shredded coconut|` +
    String.raw`ground (?:beef|pork|turkey|chicken|lamb|meat|veal|bison|sausage))(?![\p{L}])`,
  'gu',
);
/** En español el alimento va primero, y estas preparaciones también son alimentos: un batido, un helado. */
const NOMBRE_PRIMERO = /^(?:batid|helad)(?:o|a|os|as)$/;
const RE_TAMANOS = new RegExp(`(?<![\\p{L}])${RE_TAMANO.source}`, 'gu');

// ——— El singular: el buscador encuentra por el principio de las palabras ———

/** Lo que termina en s sin ser plural. */
const SIN_SINGULAR = new Set(['humus', 'hummus', 'cuscus', 'couscous', 'cous', 'ananas', 'anis', 'tres', 'asparagus', 'molasses', 'swiss', 'citrus']);
const SINGULARES: Record<string, string> = { chiles: 'chile', moles: 'mole' };
const CONECTORES = new Set(['de', 'del', 'con', 'en', 'al', 'a', 'sin', 'para', 'y', 'o', 'la', 'el', 'los', 'las', 'of', 'with', 'in', 'and', 'or', 'the']);

/**
 * El singular de una palabra del alimento: «huevos», «huevo»; «limones», «limón»; «tomatoes»,
 * «tomato». Como solo se sacan letras del final, el singular sigue siendo el principio del plural
 * y el buscador encuentra los dos: «tomate» da «Tomate» antes que «Tomates secos». Lo que no se
 * puede pasar sin romper el principio («nueces», «berries») queda como está.
 */
function singular(palabra: string, idioma: Idioma): string {
  const plano = aplanar(palabra);
  if (plano.length <= 3 || /[^\p{L}]/u.test(plano) || SIN_SINGULAR.has(plano) || CONECTORES.has(plano)) return palabra;
  if (SINGULARES[plano]) return SINGULARES[plano];
  if (idioma === 'en') {
    if (/(?:ss|us|is|ies|ves)$/.test(plano)) return palabra;
    if (/(?:oes|ches|shes|xes|zes)$/.test(plano)) return palabra.slice(0, -2);
    return plano.endsWith('s') ? palabra.slice(0, -1) : palabra;
  }
  if (/[áéíóú]s$/.test(palabra) || /[aeiou]ces$/.test(plano)) return palabra;
  if (/[íú]es$/.test(palabra)) return palabra.slice(0, -2);
  if (/[aeiou][lnrjy]es$/.test(plano)) {
    const raiz = palabra.slice(0, -2);
    // Las agudas en -n recuperan la tilde: «limones», «limón»; «calabacines», «calabacín».
    if (!/[áéíóú]/.test(raiz) && /[aeiou].*[oi]n$/.test(aplanar(raiz))) return raiz.replace(/([oi])n$/, (_, v: string) => `${v === 'o' ? 'ó' : 'í'}n`);
    return raiz;
  }
  return /[aeiou]s$/.test(plano) ? palabra.slice(0, -1) : palabra;
}

// ——— Un ingrediente ———

type Tramo = { texto: string; cantidad: number | null; unidad: Unidad | null; buscado: string; nota: string | null; tamano: Tamano | null };
type Pieza = { desde: number; hasta: number; texto: string };

const RE_VAGO = /(un poco(?: de)?|un poquito(?: de)?|algo de|a little(?: bit)?(?: of)?|a bit(?: of)?|some|unos|unas|algunos|algunas|varios|varias|a few|several)(?![\p{L}])/uy;
/** Las unidades que también se escriben sin número: «Pizca de sal», «Hojas de laurel», «Pinch of salt». */
const SIN_NUMERO = new Set<Unidad>(['pizca', 'chorrito', 'puñado', 'hoja', 'rama', 'atado']);
/** Las que en inglés pueden ir después del alimento: «garlic cloves», «basil leaves», «chicken pieces». */
const DESPUES_DEL_ALIMENTO = new Set<Unidad>(['diente', 'hoja', 'rama', 'rebanada', 'cabeza', 'filete', 'trozo', 'unidad']);
const RE_JUGO = /(?:(?:el|la|las|los|the)\s+)?(jugo|zumo|ralladura|cascara|claras?|yemas?|juice|zest)\s+(?:de|del|of)\s+/uy;

/** Sin la viñeta ni la puntuación de los bordes. */
const recortar = (s: string) => s.replace(/^[\s,;:.\-*]+|[\s,;:]+$/g, '').replace(/\.$/, '').trim();

/** Las notas en el orden del texto. Las que van juntas siguen juntas: «pelados y picados». */
function unirNotas(original: string, piezas: Pieza[]): string | null {
  if (!piezas.length) return null;
  const orden = [...piezas].sort((a, b) => a.desde - b.desde);
  let nota = orden[0].texto;
  for (let k = 1; k < orden.length; k++) {
    const hueco = original.slice(orden[k - 1].hasta, orden[k].desde).trim();
    nota += /^(?:y|and|e)$/i.test(hueco) ? ` ${hueco} ` : hueco ? ', ' : ' ';
    nota += orden[k].texto;
  }
  // «Un poco de aceite» da «un poco»; una sigla («TACC») queda como está.
  return /^\p{Lu}\p{Lu}/u.test(nota) ? nota : nota.charAt(0).toLowerCase() + nota.slice(1);
}

/**
 * La cantidad escrita después del alimento: «arroz 200 g», «huevos x 2», «Harina: 500 g». Sin
 * unidad ni «x», solo cuenta un entero sin ceros adelante: «Harina 0000» no es una cantidad.
 */
function cantidadAlFinal(o: string, p: string, inicio: number, idioma: Idioma): { cantidad: number; unidad: Unidad | null; desde: number } | null {
  const letra = p.slice(inicio).search(/\p{L}/u);
  if (letra < 0) return null;
  for (let k = inicio + letra + 1; k < p.length; k++) {
    if (!/[\dx¼-¾⅐-⅞]/u.test(p[k]) || /[\p{L}\d.,/]/u.test(p[k - 1])) continue;
    const l: Lector = { o, p, i: k };
    const conX = !!tomar(l, /x(?![\p{L}])/uy);
    const desdeNumero = l.i;
    const cantidad = leerCantidad(l, idioma);
    if (cantidad === null) continue;
    const escrito = p.slice(desdeNumero, l.i).trim();
    tomar(l, /-/y);
    const unidad = leerUnidad(l, idioma);
    if (!/^[\s.,;:]*$/.test(p.slice(l.i))) continue;
    if (!unidad && !conX && !/^[1-9]\d*(?:\s*(?:-|a|o)\s*[1-9]\d*)?$/.test(escrito)) continue;
    // Desde el separador: «Harina: 500 g», «Leche - 1 taza», «fideos de 500 g».
    const antes = /(?:\s+(?:de|of))?[\s:=\-…]*$/u.exec(p.slice(inicio, k));
    return { cantidad, unidad, desde: antes ? inicio + antes.index : k };
  }
  return null;
}

/** Un ingrediente, ya cortado de los otros de su línea: «2 cebollas medianas, picadas». */
function leerTramo(original: string, idioma: Idioma): Tramo {
  let o = original;
  let p = aplanar(original);
  const notas: Pieza[] = [];
  const sacar = (desde: number, hasta: number, comoNota: boolean) => {
    const texto = juntarEspacios(o.slice(desde, hasta)).replace(/^[,;:\-\s]+|[,;:\-\s]+$/g, '');
    if (comoNota && texto) notas.push({ desde, hasta, texto });
    o = tapar(o, desde, hasta);
    p = tapar(p, desde, hasta);
  };

  // Lo que está entre paréntesis es una medida («(400 g)»), una cuenta («(2)») o una nota.
  let entre: Medida | null = null;
  let cuentaEntre: number | null = null;
  for (let m = /[([]([^()[\]]*)[)\]]/.exec(p); m; m = /[([]([^()[\]]*)[)\]]/.exec(p)) {
    const dentro: Lector = { o: o.slice(m.index + 1, m.index + m[0].length - 1), p: m[1], i: 0 };
    let usado = false;
    if (!entre) {
      const medida = leerMedida(dentro, idioma, true);
      if (medida && /^[\s.,;]*$/.test(dentro.p.slice(dentro.i))) [entre, usado] = [medida, true];
    }
    const cuenta: RegExpExecArray | null = usado || cuentaEntre !== null ? null : /^\s*x?\s*(\d+)\s*(?:u|uds?|unidades?)?\.?\s*$/.exec(m[1]);
    if (cuenta) [cuentaEntre, usado] = [Number(cuenta[1]), true];
    sacar(m.index, m.index + m[0].length, !usado);
  }
  const abierto = p.search(/[([]/);
  if (abierto >= 0) sacar(abierto, p.length, true);
  for (let k = p.search(/[)\]]/); k >= 0; k = p.search(/[)\]]/)) sacar(k, k + 1, false);

  // La cantidad, el tamaño y la unidad del principio.
  const l: Lector = { o, p, i: 0 };
  probar(l, () => (tomar(l, RE_APROXIMADO) && /^\s*[\d¼-¾⅐-⅞]/u.test(l.p.slice(l.i)) ? true : null));
  // Antes que el número: «un poco» no es uno, ni «a few» es «a».
  const v = tomar(l, RE_VAGO);
  const vago = !!v;
  if (v && /poc|little|bit/.test(v[1])) notas.push({ desde: v.index, hasta: l.i, texto: juntarEspacios(o.slice(v.index, l.i)).replace(/\s+(?:de|of)$/i, '') });
  let cantidad = vago ? null : leerCantidad(l, idioma);
  let unidad: Unidad | null = null;
  let tamano: Tamano | null = null;
  let porEnvase: Medida | null = null;
  if (cantidad !== null) {
    // «2 x 400 g»
    const por = probar(l, () => (tomar(l, /x(?![\p{L}])/uy) ? leerMedida(l, idioma) : null));
    if (por) [cantidad, unidad] = [cantidad * por.valor, por.unidad];
  }
  if (cantidad !== null || vago) {
    if (!unidad) {
      tamano = leerTamano(l);
      // «2 15-oz cans»: el tamaño del envase va antes del envase.
      const envase = probar(l, () => {
        const m = leerMedida(l, idioma);
        const u = m && leerUnidad(l, idioma);
        return m && u && ENVASES.has(u) ? { m, u } : null;
      });
      const llena = envase ? null : probar(l, () => {
        const m = tomar(l, RE_LLENADO);
        const u = m && leerUnidad(l, idioma);
        return m && u ? { pieza: { desde: m.index, hasta: m.index + m[0].length, texto: m[1] }, u } : null;
      });
      if (envase) [porEnvase, unidad] = [envase.m, envase.u];
      else if (llena) {
        unidad = llena.u;
        notas.push(llena.pieza);
      } else unidad = leerUnidad(l, idioma) ?? probar(l, () => (tomar(l, /(?:de|of(?:\s+an?)?)(?![\p{L}])/uy) ? leerUnidad(l, idioma) : null));
    }
    if (unidad && cantidad !== null) {
      const yMedio = tomar(l, RE_Y_MEDIO);
      if (yMedio) cantidad += valorDeYMedio(yMedio[1]);
    }
    if (unidad && ENVASES.has(unidad) && !porEnvase) {
      porEnvase = probar(l, () => {
        tomar(l, /de(?![\p{L}])/uy);
        return leerMedida(l, idioma);
      });
    }
    tamano = tamano ?? leerTamano(l);
  } else {
    const sola = probar(l, () => {
      const u = leerUnidad(l, idioma);
      return u && SIN_NUMERO.has(u) ? u : null;
    });
    if (sola) [unidad, cantidad] = [sola, /s$/.test(p.slice(0, l.i).trim()) ? null : 1];
  }
  if (cantidad !== null || unidad) tomar(l, /(?:de|del|of)(?![\p{L}])/uy);
  const inicio = l.i;

  // «Jugo de 1 limón»: la cuenta va en el medio.
  let jugo = false;
  if (cantidad === null && !vago) {
    const j = probar(l, () => {
      if (!tomar(l, RE_JUGO)) return null;
      const desde = l.i;
      const n = leerCantidad(l, idioma);
      return n === null ? null : { n, desde, hasta: l.i };
    });
    if (j) {
      [cantidad, jugo] = [j.n, true];
      sacar(j.desde, j.hasta, false);
    }
  }

  const protegidos = [...p.slice(inicio).matchAll(RE_COMPUESTOS)].map((m) => [inicio + m.index!, inicio + m.index! + m[0].length] as const);
  for (const m of [...p.slice(inicio).matchAll(RE_NOTAS)]) sacar(inicio + m.index!, inicio + m.index! + m[0].length, true);
  if (cantidad === null && !vago) {
    const fin = cantidadAlFinal(o, p, inicio, idioma);
    if (fin) {
      [cantidad, unidad] = [fin.cantidad, fin.unidad];
      sacar(fin.desde, p.length, false);
    }
  } else if (unidad && ENVASES.has(unidad) && !porEnvase) {
    // «1 paquete de fideos de 500 g»
    const fin = cantidadAlFinal(o, p, inicio, idioma);
    if (fin && esMedible(fin.unidad)) {
      porEnvase = { valor: fin.cantidad, unidad: fin.unidad, cadaUno: false };
      sacar(fin.desde, p.length, false);
    }
  }
  const alternativa = /(?<![\p{L}])(?:o|u|or|y\s*\/\s*o|and\s*\/\s*or)\s+\S/u.exec(p.slice(inicio));
  if (alternativa && /\p{L}/u.test(p.slice(inicio, inicio + alternativa.index))) sacar(inicio + alternativa.index, p.length, true);
  for (const m of [...p.slice(inicio).matchAll(RE_TAMANOS)]) {
    tamano = tamano ?? TAMANOS[m[1]];
    sacar(inicio + m.index!, inicio + m.index! + m[0].length, false);
  }
  const primera = /\p{L}+/u.exec(p.slice(inicio));
  for (const m of [...p.slice(inicio).matchAll(RE_PREPARACION)]) {
    const desde = inicio + m.index!;
    const hasta = desde + m[0].length;
    if (protegidos.some(([a, b]) => desde < b && hasta > a)) continue;
    if (idioma === 'es' && primera && m.index === primera.index && NOMBRE_PRIMERO.test(m[0])) continue;
    sacar(desde, hasta, true);
  }
  // En inglés la unidad también va después del alimento: «2 garlic cloves», «4 basil leaves».
  const ultima = idioma === 'en' && !unidad ? /(\p{L}+)\s*$/u.exec(p.slice(inicio)) : null;
  const despues = ultima ? unidadDePalabra(ultima[1]) : null;
  if (ultima && despues && DESPUES_DEL_ALIMENTO.has(despues) && /\p{L}/u.test(p.slice(inicio, inicio + ultima.index))) {
    unidad = despues;
    sacar(inicio + ultima.index, inicio + ultima.index + ultima[0].length, false);
  }

  const palabras = juntarEspacios(o.slice(inicio).replace(/[*"“”«»_#•·¿?¡!:;,]/g, ' ')).toLowerCase().split(' ')
    .map((w) => w.replace(/^[-./+&]+|[-./+&]+$/g, ''))
    .filter(Boolean);
  // Lo que queda suelto en los bordes al sacar lo demás: «de», «y», «the».
  while (palabras.length && CONECTORES.has(aplanar(palabras[0]))) palabras.shift();
  while (palabras.length && CONECTORES.has(aplanar(palabras[palabras.length - 1]))) palabras.pop();
  // El buscador pide cada palabra: «tapas para empanadas» se busca sin «para», porque la base dice «Tapas de empanada».
  for (let k = palabras.length - 1; k >= 0; k--) if (aplanar(palabras[k]) === 'para') palabras.splice(k, 1);
  // Una letra sola («g», «x») no es un alimento.
  let buscado = /\p{L}{2}/u.test(palabras.join(' ')) ? palabras.join(' ') : '';
  const enIngles = jugo ? /^(juice|zest) of (.+)$/.exec(buscado) : null;
  if (enIngles) buscado = `${enIngles[2]} ${enIngles[1]}`;
  buscado = buscado.split(' ').map((w) => singular(w, idioma)).join(' ');

  if (porEnvase) [cantidad, unidad] = [(cantidad ?? 1) * porEnvase.valor, porEnvase.unidad];
  else if (entre && !esMedible(unidad)) {
    cantidad = entre.cadaUno || (unidad && ENVASES.has(unidad)) ? (cantidad ?? 1) * entre.valor : entre.valor;
    unidad = entre.unidad;
  }
  if (cantidad === null && cuentaEntre !== null && !unidad) cantidad = cuentaEntre;
  return { texto: recortar(original), cantidad, unidad, buscado, nota: unirNotas(original, notas), tamano };
}

// ——— Una línea con uno o más ingredientes ———

/**
 * Los ingredientes de una línea. Se corta en las comas (no en «1,5 kg» ni dentro de paréntesis)
 * y en «y» cuando de los dos lados hay un alimento («sal y pimienta», «2 huevos y 1 yema», pero no
 * «1 y ½ taza» ni «pelados y picados»). Lo que sigue a una coma sin alimento es del anterior: su
 * nota («1 cebolla, picada») o su cantidad («Azúcar, 2 cdas»).
 */
function ingredientesDeLinea(linea: string, idioma: Idioma): LineaDeReceta[] {
  const p = aplanar(linea);
  const hondura: number[] = [];
  let h = 0;
  for (const c of p) {
    if (c === '(' || c === '[') h++;
    hondura.push(h);
    if ((c === ')' || c === ']') && h > 0) h--;
  }
  const cortes: [number, number][] = [];
  let desde = 0;
  for (let k = 0; k < p.length; k++) {
    if (hondura[k] > 0) continue;
    if (p[k] === ';' || (p[k] === ',' && !(/\d/.test(p[k - 1] ?? '') && /\d/.test(p[k + 1] ?? '')))) {
      cortes.push([desde, k]);
      desde = k + 1;
    }
  }
  cortes.push([desde, p.length]);

  const tramos: [number, number][] = [];
  for (const [a, b] of cortes) {
    let inicio = a;
    for (const m of p.slice(a, b).matchAll(/\s(?:y|and)\s/g)) {
      const k = a + m.index!;
      if (hondura[k] > 0) continue;
      const izquierda = leerTramo(linea.slice(inicio, k), idioma);
      const derecha = leerTramo(linea.slice(k + m[0].length, b), idioma);
      if (izquierda.buscado && derecha.buscado) {
        tramos.push([inicio, k]);
        inicio = k + m[0].length;
      }
    }
    tramos.push([inicio, b]);
  }

  const leidos: (Tramo & { desde: number })[] = [];
  for (const [a, b] of tramos) {
    const t = leerTramo(linea.slice(a, b), idioma);
    const anterior = leidos[leidos.length - 1];
    if (t.buscado) {
      leidos.push({ ...t, desde: a });
      continue;
    }
    if (!anterior) continue;
    anterior.texto = recortar(linea.slice(anterior.desde, b));
    if (t.nota) anterior.nota = anterior.nota ? `${anterior.nota}, ${t.nota}` : t.nota;
    if (anterior.cantidad === null && t.cantidad !== null) [anterior.cantidad, anterior.unidad] = [t.cantidad, t.unidad];
    anterior.tamano = anterior.tamano ?? t.tamano;
  }

  // «Sal, pimienta y orégano a gusto»: la nota del último vale para los de antes sin cantidad.
  const ultimo = leidos[leidos.length - 1];
  if (ultimo && ultimo.cantidad === null && ultimo.nota && RE_NOTA_COMPARTIDA.test(aplanar(ultimo.nota))) {
    for (let k = leidos.length - 2; k >= 0 && leidos[k].cantidad === null && !leidos[k].nota; k--) leidos[k].nota = ultimo.nota;
  }
  return leidos.map(({ texto, cantidad, unidad, buscado, nota, tamano }) => ({ texto, cantidad, unidad, buscado, nota, ...(tamano ? { tamano } : {}) }));
}

/**
 * «Relleno: jamón y queso» es una etiqueta y sus ingredientes; «Harina: 500 g» y «Sal: a gusto»
 * son el alimento y su cantidad, porque a la derecha no hay ningún alimento.
 */
function conEtiqueta(texto: string, idioma: Idioma): LineaDeReceta[] {
  const k = texto.indexOf(':');
  if (k > 0 && texto.slice(k + 1).trim()) {
    const derecha = ingredientesDeLinea(texto.slice(k + 1), idioma);
    // «Opcional: nueces»: la etiqueta es la nota.
    const etiqueta = texto.slice(0, k).trim().toLowerCase();
    if (RE_NOTA_COMPARTIDA.test(aplanar(etiqueta))) for (const x of derecha) x.nota = x.nota ? `${etiqueta}, ${x.nota}` : etiqueta;
    if (derecha.length) return derecha;
  }
  return ingredientesDeLinea(texto, idioma);
}

// ——— La receta entera ———

const CABECERA_INGREDIENTES = /^(?:(?:lista de |los )?(?:ingredientes?|ingredients?)|lo que (?:vas a )?necesit\p{L}*|necesitas|vas a necesitar|you'?ll need|what you'?ll need|what you need)(?![\p{L}])/u;
/** Desde acá ya no hay ingredientes: los pasos. */
const CABECERA_PASOS = /^(?:(?:modo|forma|manera) de (?:preparacion|hacerl[oa]s?|elaboracion)|preparacion|procedimiento|elaboracion|instrucciones|pasos?(?: a paso| \d+)?|como (?:se hace|se prepara|hacerl[oa]s?|prepararl[oa]s?)|metodo|directions?|instructions?|method|steps?(?: \d+)?|preparation|how to (?:make|prepare)(?: it)?|procedure)(?![\p{L}])/u;
/** Las notas y los utensilios: solos, abren una parte sin ingredientes; con texto, son una línea que se saltea. */
const CABECERA_NOTAS = /^(?:notas?|notes?|tips?|consejos?|trucos?|sugerencias?|utensilios|equipo|equipment|informacion nutricional|nutrition(?: facts| information)?|valor nutricional)(?![\p{L}])/u;
const METADATOS = /^(?:tiempo|dificultad|nivel|difficulty|(?:prep|preparation|cook|cooking|total|active) time|categoria|category|cocina|cuisine|course|autor|author|fuente|source|keywords?|etiquetas|tags|calorias|calories|kcal|valor energetico|porcion|tamano de (?:la )?porcion|serving size|(?:preparacion|coccion|horneado|reposo|prep|cook|total)\s*:\s*\d)(?![\p{L}])|https?:\/\/|www\./u;
/** Un paso de la preparación: un infinitivo, «se» con un verbo, «luego», «en una olla», «preheat»… */
const PASO = new RegExp(
  String.raw`^(?:se\s+\p{L}{3,}|(?:agreg|anad|incorpor|mezcl|bat|cocin|herv|horne|precalent|calent|pic|cort|pel|rall|coloc|retir|dej|salte|dor|licu|proces|integr|volc|vert|enmantec|engras|enharin|amas|estir|rellen|cubr|reserv|condiment|salpiment|sazon|lav|escurr|remoj|hidrat|disolv|derret|fund|tamiz|llev|enfri|refriger|decor|espolvore|unt|pincel|desmold|divid|arm|rehog|tritur|exprim|emplat|prepar|comenz|empez|gratin|roci|marin|sofre|fre|serv|pon|coc|as|mol|un)(?:ar|er|ir|amos|emos|imos)|` +
    String.raw`luego|despues|mientras|cuando|una vez|por ultimo|finalmente|primero|a continuacion|then|meanwhile|once|while|finally|after that|en (?:un|una|el|la|los|las)|in (?:a|an|the)|preheat|paso \d+|step \d+)(?![\p{L}])`,
  'u',
);
/** Un imperativo, que también puede ser un nombre («mezcla», «tapa», «mix»): es un paso si la línea es una oración. */
const PASO_DEBIL = new RegExp(
  String.raw`^(?:agrega|agregue|anade|anada|incorpora|incorpore|mezcla|mezcle|bate|bata|cocina|cocine|hierve|hierva|hornea|hornee|precalienta|precaliente|calienta|caliente|` +
    String.raw`pica|pique|corta|corte|pela|pele|ralla|ralle|coloca|coloque|pon|ponga|pone|retira|retire|deja|deje|saltea|saltee|dora|dore|licua|licue|procesa|procese|vuelca|` +
    String.raw`vuelque|vierte|vierta|amasa|amase|estira|estire|rellena|rellene|cubre|cubra|tapa|tape|reserva|reserve|lava|lave|escurre|escurra|derrite|derrita|lleva|lleve|` +
    String.raw`sirve|sirva|servi|bati|cubri|add|mix|stir|combine|whisk|beat|bake|heat|cook|boil|simmer|bring|place|put|pour|serve|remove|let|fry|saute|chop|cut|peel|grate|` +
    String.raw`transfer|drain|rinse|cover|reduce|fold|knead|roll|grease|line|sprinkle|garnish|divide|form|shape|melt|dissolve|whip|blend|puree|toss|arrange|repeat|allow|` +
    String.raw`refrigerate|chill|cool|store|season|spread|brush|coat|marinate|soak|mash|squeeze|strain|sift|prepare|make|assemble|enjoy)(?![\p{L}])`,
  'u',
);
const PALABRA_PORCION = /^(?:porcion(?:es)?|racion(?:es)?|personas?|comensales?|platos?|servings?|portions?|people|persons?|pax)$/;

const empiezaConCantidad = (plano: string, idioma: Idioma) => leerCantidad({ o: plano, p: plano, i: 0 }, idioma) !== null;
const porcionesValidas = (n: number) => (n > 0 && n <= 200 ? Math.round(n) : null);
const redondear = (g: number) => Math.round(g * 10) / 10;

type Rinde = { porciones: number | null; pesoFinal: number | null };

/**
 * Si la línea dice lo que rinde la receta: las porciones («Rinde 4 porciones», «Serves 4», «Para
 * 4 personas») o lo que pesa terminada («Peso final 900 g», «Pesa 1,2 kg terminado»). Una línea
 * que lo dice sin un número que sirva («Rinde 1 tarta», «Para 1 molde de 24 cm») tampoco es un
 * ingrediente: rinde nulo.
 */
function rindeDe(plano: string, idioma: Idioma): Rinde | null {
  const desde = (i: number): Lector => ({ o: plano, p: plano, i });
  const peso = /^(?:peso\s+(?:final|total|neto|terminad[oa]|cocid[oa])(?:\s+de\s+la\s+\p{L}+)?|pesa(?:\s+en\s+total)?|final weight|total weight|cooked weight|weighs|weight)(?![\p{L}])\s*:?\s*/u.exec(plano);
  if (peso) {
    const m = leerMedida(desde(peso[0].length), idioma);
    return m ? { porciones: null, pesoFinal: redondear(gramosDeMedida(m)) } : null;
  }
  const rinde = /^(?:rinde|rendimiento|yields?|makes|salen)(?![\p{L}])\s*:?\s*(?:para\s+)?/u.exec(plano);
  if (rinde) {
    const l = desde(rinde[0].length);
    const m = leerMedida(l, idioma);
    if (m) return { porciones: null, pesoFinal: redondear(gramosDeMedida(m)) };
    tomar(l, RE_APROXIMADO);
    const n = leerCantidad(l, idioma);
    if (n === null) return { porciones: null, pesoFinal: null };
    const unidad = leerUnidad(l, idioma);
    // «Rinde 2 tazas» no dice porciones ni peso.
    if (unidad && unidad !== 'unidad') return { porciones: null, pesoFinal: null };
    const palabra = /^\s*(\p{L}+)/u.exec(plano.slice(l.i))?.[1];
    if (unidad || !palabra || PALABRA_PORCION.test(palabra) || n > 1) return { porciones: porcionesValidas(n), pesoFinal: null };
    // «Yield: 1 loaf (12 slices)»
    const entre = /\((?:unas?\s+|unos\s+|about\s+)?(\d+)\s*\p{L}+/u.exec(plano);
    return { porciones: entre ? porcionesValidas(Number(entre[1])) : null, pesoFinal: null };
  }
  const porciones = /^(?:porciones|raciones|comensales|servings?|serves|sirve(?:\s+para)?|personas|yield|(?:n(?:umero|ro|o)\.?|cantidad)\s+de\s+(?:porciones|raciones|personas))(?![\p{L}])\s*:?\s*/u.exec(plano);
  if (porciones) {
    const l = desde(porciones[0].length);
    tomar(l, RE_APROXIMADO);
    const n = leerCantidad(l, idioma);
    return n === null ? null : { porciones: porcionesValidas(n), pesoFinal: null };
  }
  const para = /^(?:para|for)\s+/.exec(plano);
  if (para) {
    const l = desde(para[0].length);
    const n = leerCantidad(l, idioma);
    if (n === null) return null;
    const palabra = /^\s*(\p{L}+)/u.exec(plano.slice(l.i))?.[1];
    return { porciones: !palabra || PALABRA_PORCION.test(palabra) ? porcionesValidas(n) : null, pesoFinal: null };
  }
  const l = desde(0);
  const n = leerCantidad(l, idioma);
  const resto = plano.slice(l.i).trim();
  return n !== null && PALABRA_PORCION.test(resto) && !/^platos?$/.test(resto) ? { porciones: porcionesValidas(n), pesoFinal: null } : null;
}

/** Las porciones dichas en un título o una cabecera: «Tortilla (4 porciones)», «Ingredientes para 6 personas», «Ingredients (serves 4)». */
function rindeEnTitulo(plano: string): Rinde | null {
  const m = /(?:^|[\s(])(\d+)(?:\s*(?:-|a|o|to|or)\s*(\d+))?\s*(?:porciones|raciones|personas|comensales|servings?|portions?|people)(?![\p{L}])/u.exec(plano)
    ?? /(?:serves|rinde|makes)\s*:?\s*(\d+)(?:\s*(?:-|a|o|to|or)\s*(\d+))?/u.exec(plano);
  if (!m) return null;
  return { porciones: porcionesValidas(m[2] ? (Number(m[1]) + Number(m[2])) / 2 : Number(m[1])), pesoFinal: null };
}

/** El idioma del texto, si se nota; si no, el de la app. Una receta en inglés se puede pegar con la app en español. */
function idiomaDelTexto(plano: string, idioma: Idioma): Idioma {
  const contar = (re: RegExp) => plano.match(re)?.length ?? 0;
  const es = contar(/\b(?:de|del|con|y|para|tazas?|cucharadas?|cucharaditas?|cdas?|cdtas?|gramos|huevos?|sal|gusto|picad[oa]s?|cebollas?|ajo|aceite|harina|azucar|leche|ingredientes|preparacion|pizca|dientes?)\b/g);
  const en = contar(/\b(?:of|the|and|with|cups?|tablespoons?|teaspoons?|tbsp|tsp|eggs?|salt|taste|chopped|minced|diced|onions?|garlic|oil|flour|sugar|milk|ingredients|directions|instructions|large|medium|small|cloves?|pinch)\b/g);
  if (es >= 2 && es > en * 1.5) return 'es';
  if (en >= 2 && en > es * 1.5) return 'en';
  return idioma;
}

type Renglon = { texto: string; titulo: boolean; solo: boolean };

/** Lo que termina en punto sin cortar la oración: «1 cda. de azúcar», «aprox. 200 g». */
const ABREVIATURAS = new Set(['aprox', 'approx', 'cda', 'cdas', 'cdta', 'cdtas', 'cdita', 'cditas', 'cuch', 'tz', 'tza', 'gr', 'grs', 'oz', 'fl', 'lb', 'lbs', 'tbsp', 'tbs', 'tsp', 'pkg', 'paq', 'ud', 'uds', 'u', 'unid', 'c', 't', 'ej', 'etc', 'nro', 'no', 'sr', 'sra', 'dr', 'pza', 'pzas', 'p', 'pag']);

/** Las oraciones de un renglón: «200 g de arroz. 2 huevos.» son dos. */
function oraciones(s: string): string[] {
  const partes: string[] = [];
  let desde = 0;
  for (const m of s.matchAll(/\.\s+(?=[\p{Lu}\d¼-¾⅐-⅞])/gu)) {
    const palabra = /(\p{L}+)$/u.exec(s.slice(desde, m.index))?.[1] ?? '';
    if (ABREVIATURAS.has(aplanar(palabra))) continue;
    partes.push(s.slice(desde, m.index));
    desde = m.index! + m[0].length;
  }
  partes.push(s.slice(desde));
  return partes;
}

/** Sin viñetas ni marcas: «- », «• », «1. », «2) », «[ ] », «**», un emoji al principio. */
function sinVineta(s: string): string {
  let t = s;
  for (let k = 0; k < 3; k++) {
    t = t.replace(/^[^\p{L}\p{N}(["'«¿¡~±]+/u, '').replace(/^(?:\(?\d{1,2}[.)](?!\d)|\(?[a-z]\)(?=\s)|\[[ xX]?\])\s*/iu, '');
  }
  return t.trim();
}

function renglonesDe(texto: string): Renglon[] {
  const crudos = texto.split(/\r\n|\r|\n|\p{Zl}|\p{Zp}/u);
  const lista: Renglon[] = [];
  crudos.forEach((crudo, k) => {
    const titulo = /^\s*#/.test(crudo);
    const solo = !(crudos[k + 1] ?? '').trim();
    const limpio = crudo.replace(/\*\*|__|`/g, '').replace(/^\s*#+\s*/, '');
    // Las viñetas del medio también separan: «• 200 g de arroz • 2 huevos».
    for (const parte of limpio.split(/[•·▪◦●]/)) {
      for (const oracion of oraciones(parte)) {
        const t = sinVineta(oracion);
        if (t) lista.push({ texto: t, titulo, solo });
      }
    }
  });
  return lista;
}

/** El título, cuando no hay «Ingredientes:»: un encabezado, «Receta de…», en mayúsculas o seguido de un renglón en blanco. */
function esTitulo(r: Renglon, plano: string, total: number, idioma: Idioma): boolean {
  if (total < 2) return false;
  if (/^(?:receta|recipe)(?![\p{L}])|\srecipe$/u.test(plano)) return true;
  if (empiezaConCantidad(plano, idioma) || /,|a gusto|al gusto|c\/[sn]|to taste/.test(plano)) return false;
  return r.titulo || r.solo || (r.texto === r.texto.toUpperCase() && /\p{L}{3}/u.test(r.texto));
}

function esPaso(texto: string, plano: string, idioma: Idioma): boolean {
  if (empiezaConCantidad(plano, idioma)) return false;
  if (PASO.test(plano)) return true;
  return PASO_DEBIL.test(plano) && (/\.\s*$/.test(texto) || plano.split(/\s+/).length >= 7);
}

/**
 * Lee una receta pegada. Con «Ingredientes:», lo de antes es el título y la presentación; sin él,
 * todo es ingrediente salvo un título claro. Después de «Preparación» (o del primer paso) ya no
 * hay ingredientes, pero se sigue buscando lo que rinde y lo que pesa terminada. `idioma` es el de
 * la app: decide cuando el texto no deja claro en qué idioma está.
 */
export function leerReceta(texto: string, idioma: Idioma): RecetaLeida {
  const receta: RecetaLeida = { lineas: [], porciones: null, pesoFinal: null };
  if (typeof texto !== 'string' || !texto.trim()) return receta;
  const limpio = texto.normalize('NFC').slice(0, 20000);
  const lengua = idiomaDelTexto(aplanar(limpio), idioma === 'en' ? 'en' : 'es');
  const renglones = renglonesDe(limpio);
  const conCabecera = renglones.some((r) => CABECERA_INGREDIENTES.test(aplanar(r.texto)));
  let modo: 'antes' | 'ingredientes' | 'pasos' = conCabecera ? 'antes' : 'ingredientes';
  const anotar = (r: Rinde | null) => {
    if (r?.porciones && !receta.porciones) receta.porciones = r.porciones;
    if (r?.pesoFinal && !receta.pesoFinal) receta.pesoFinal = r.pesoFinal;
  };
  renglones.forEach((r, k) => {
    const plano = aplanar(r.texto).replace(/^[([]\s*|\s*[)\]]$/g, '').replace(/[\s.:;,]+$/, '');
    if (!/[\p{L}\p{N}]/u.test(plano)) return;
    const rinde = rindeDe(plano, lengua);
    if (rinde) return anotar(rinde);
    if (CABECERA_INGREDIENTES.test(plano)) {
      modo = 'ingredientes';
      anotar(rindeEnTitulo(plano));
      const dosPuntos = r.texto.indexOf(':');
      if (dosPuntos >= 0) receta.lineas.push(...conEtiqueta(r.texto.slice(dosPuntos + 1), lengua));
      return;
    }
    if (METADATOS.test(plano)) return;
    if (CABECERA_PASOS.test(plano) && (plano.length <= 40 || plano.includes(':'))) {
      modo = 'pasos';
      return;
    }
    if (CABECERA_NOTAS.test(plano)) {
      if (!/:\s*\S/.test(plano)) modo = 'pasos';
      return;
    }
    if (modo !== 'ingredientes') {
      if (modo === 'antes') anotar(rindeEnTitulo(plano));
      return;
    }
    if (esPaso(r.texto, plano, lengua)) {
      modo = 'pasos';
      return;
    }
    if (!conCabecera && k === 0 && esTitulo(r, plano, renglones.length, lengua)) return anotar(rindeEnTitulo(plano));
    // Un subtítulo: «Para la masa», «Relleno:».
    if (/:\s*$/.test(r.texto) || (/^(?:para|for)\s+(?:el|la|los|las|the)\s/.test(plano) && !plano.includes(':'))) return;
    if (plano.split(/\s+/).length > 18) return;
    receta.lineas.push(...conEtiqueta(r.texto, lengua));
  });
  return receta;
}

// ——— Una línea en gramos, con el alimento elegido ———

/** Una porción de la base leída: «½ taza» es media taza; «1 fresa mediana», una unidad mediana; «1 vaso (200 ml)», 200 ml. */
type PorcionLeida = { gramos: number; n: number; unidad: Unidad | null; cabeza: string | null; tamano: Tamano | null; extra: boolean; ml: number | null };

/** Lo que no es una unidad del alimento aunque no sea una medida: «1 porción», «1 plato». */
const NO_CUENTA = /^(?:porcion(?:es)?|servings?|portions?|racion(?:es)?|platos?|bowls?)$/;
const ADJETIVOS = new Set(['fina', 'fino', 'finas', 'finos', 'gruesa', 'grueso', 'gruesas', 'gruesos', 'thin', 'thick', 'whole', 'regular', 'normal', 'de', 'of']);
/** Las medidas de volumen que valen igual en cualquier alimento: con ellas se saca su densidad. */
const ML_FIABLES = new Set<Unidad>(['ml', 'l', 'cl', 'dl', 'fl oz', 'taza', 'cucharada', 'cucharadita']);

function leerPorcion(porcion: { nombre: string; gramos: number }): PorcionLeida | null {
  if (!porcion || typeof porcion.nombre !== 'string' || !(porcion.gramos > 0)) return null;
  const plano = aplanar(porcion.nombre).trim();
  const l: Lector = { o: plano, p: plano, i: 0 };
  const n = leerNumero(l, 'es') ?? 1;
  if (!(n > 0)) return null;
  const palabras = plano.slice(l.i).split(/[,(]/)[0].trim().split(/\s+/).filter(Boolean);
  let tamano: Tamano | null = null;
  let extra = false;
  let k = 0;
  const adjetivo = (w: string) => {
    if (w === 'extra') extra = true;
    else if (TAMANOS[w]) tamano = tamano ?? TAMANOS[w];
    else return ADJETIVOS.has(w);
    return true;
  };
  while (k < palabras.length && adjetivo(palabras[k])) k++;
  const cabeza = palabras[k] ?? null;
  palabras.slice(k + 1).forEach(adjetivo);
  const unidad = cabeza ? (unidadDePalabra(`${cabeza}${palabras[k + 1] ?? ''}`) ?? unidadDePalabra(cabeza)) : null;
  const explicito = /\((\d+(?:[.,]\d+)?)\s*ml\)/.exec(plano);
  const ml = explicito ? Number(explicito[1].replace(',', '.')) : unidad && ML_FIABLES.has(unidad) ? n * ML_POR[unidad]! : null;
  return { gramos: porcion.gramos, n, unidad, cabeza, tamano, extra, ml };
}

/**
 * La porción de la base que dice cuánto pesa una de la línea. Para «2 dientes», la del diente;
 * para una cuenta («2 huevos», «1 cebolla grande»), la que es una unidad del alimento («1 unidad»,
 * «1 mediana», «1 large egg», «10 uvas»), del tamaño escrito si lo hay y si no, la primera, que es
 * la de siempre.
 */
function porcionPara(porciones: PorcionLeida[], unidad: Unidad | null, tamano: Tamano | null | undefined): PorcionLeida | null {
  const rebanadas: (Unidad | null)[] = ['rebanada', 'feta'];
  const candidatas = porciones.filter((p) => {
    if (!unidad || unidad === 'unidad') return p.unidad === 'unidad' || (p.unidad === null && !(p.cabeza && NO_CUENTA.test(p.cabeza)));
    return p.unidad === unidad || (rebanadas.includes(p.unidad) && rebanadas.includes(unidad));
  });
  return (tamano && candidatas.find((p) => p.tamano === tamano && !p.extra)) || candidatas.find((p) => !p.extra) || candidatas[0] || null;
}

/** La densidad del alimento; si no la tiene, la de su porción medida en volumen más grande («1 taza = 125 g»). */
function densidadDe(alimento: AlimentoParaGramos, porciones: PorcionLeida[]): number | null {
  if (alimento.densidad && alimento.densidad > 0) return alimento.densidad;
  const medida = porciones.filter((p) => p.ml && p.ml > 0).sort((a, b) => b.ml! - a.ml!)[0];
  return medida ? medida.gramos / medida.ml! : null;
}

/**
 * Los gramos de una línea con el alimento elegido, o null si no se pueden saber (la pantalla los
 * pregunta). Lo que pesa va directo; la taza, la cucharada y la cucharadita, por la porción de ese
 * nombre o, sin ella, por la densidad; los ml, por la densidad; lo que se cuenta («2 dientes», «1
 * lata», «3 huevos»), por la porción de ese nombre.
 */
export function gramosDeLinea(linea: Pick<LineaDeReceta, 'cantidad' | 'unidad' | 'tamano'>, alimento: AlimentoParaGramos): number | null {
  const { cantidad, unidad } = linea;
  if (cantidad === null || !(cantidad > 0) || !Number.isFinite(cantidad)) return null;
  const porGramo = unidad ? GRAMOS_POR[unidad] : undefined;
  if (porGramo) return redondear(cantidad * porGramo);
  const porciones = (alimento?.porciones ?? []).map(leerPorcion).filter((p): p is PorcionLeida => p !== null);
  if (!unidad || !METRICAS.has(unidad)) {
    const porcion = porcionPara(porciones, unidad, linea.tamano);
    if (porcion) return redondear((cantidad * porcion.gramos) / porcion.n);
  }
  const ml = unidad ? ML_POR[unidad] : undefined;
  const densidad = ml && alimento ? densidadDe(alimento, porciones) : null;
  return ml && densidad ? redondear(cantidad * ml * densidad) : null;
}
