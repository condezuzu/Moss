// Arma alimentos/marcas.txt: los productos de marca que se consiguen en Uruguay, de Open Food Facts
// (.cache/off/, lo baja herramientas/bajar-marcas.mjs). Entra lo que tiene a Uruguay entre sus países; de lo
// cargado en Argentina, solo las marcas que se venden acá (MARCAS); y de otros países de la región, solo
// las marcas globales que nadie cargó con Uruguay (DE_AFUERA), con menos productos y marcadas «aproximado»,
// porque la etiqueta es de otro país. De cada producto, solo si los valores son por 100 g y posibles, si las
// kcal cierran con los macros (la fibra y el alcohol cuentan) y si tiene un código válido. Lo que ya está en
// productos.txt, curado a mano, no se repite. El mismo producto en varios tamaños va en una línea con todos
// sus códigos. Dentro de cada marca, lo más escaneado primero: ese es el orden en que aparece al buscar la
// marca. Un producto conserva su número al rearmar: lo que ya se anotó apunta a él.
// Uso: node herramientas/marcas.mjs   → después, npm run alimentos y npm run alimentos:verificar

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
// Hasta tantos productos por marca: lo poco escaneado de una marca enorme es ruido, y la base tiene un tope.
const TOPE_POR_MARCA = 70;
const TOPE_DE_AFUERA = 14;
const PRIMER_NUMERO = 2000;

const llano = (t) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

// Las marcas de un supermercado de acá, como se escriben. La clave es sin tildes ni signos.
const MARCAS = new Map(Object.entries({
  nesquik: 'Nesquik', nesquick: 'Nesquik', nestle: 'Nestlé', 'kellogg s': "Kellogg's", kelloggs: "Kellogg's", kellog: "Kellogg's", quaker: 'Quaker', granix: 'Granix', cerealitas: 'Cerealitas', nescafe: 'Nescafé',
  toddy: 'Toddy', 'la virginia': 'La Virginia', cabrales: 'Cabrales', dolca: 'Dolca', zucaritas: "Kellogg's",
  conaprole: 'Conaprole', parmalat: 'Parmalat', claldy: 'Claldy', calcar: 'Calcar', danone: 'Danone', ser: 'Ser', yogurisimo: 'Yogurísimo', activia: 'Activia', danonino: 'Danonino',
  bagley: 'Bagley', terrabusi: 'Terrabusi', arcor: 'Arcor', oreo: 'Oreo', mauri: 'Mauri', famosa: 'Famosa', 'maestro cubano': 'Maestro Cubano', portezuelo: 'Portezuelo', jorgito: 'Jorgito', havanna: 'Havanna', guaymallen: 'Guaymallén',
  tita: 'Tita', rhodesia: 'Rhodesia', milka: 'Milka', 'club social': 'Club Social', pepitos: 'Pepitos', criollitas: 'Criollitas', sonrisas: 'Sonrisas', chocolinas: 'Chocolinas', melba: 'Melba', traviata: 'Traviata', express: 'Express',
  mana: 'Maná', hogarenas: 'Hogareñas', bimbo: 'Bimbo', fargo: 'Fargo', 'los sorchantes': 'Los Sorchantes', bauducco: 'Bauducco', marinela: 'Marinela', cachafaz: 'Cachafaz', 'capitan del espacio': 'Capitán del Espacio',
  'coca cola': 'Coca-Cola', cocacola: 'Coca-Cola', pepsi: 'Pepsi', pepsico: 'Pepsi', sprite: 'Sprite', fanta: 'Fanta', schweppes: 'Schweppes', '7up': '7 Up', '7 up': '7 Up', 'paso de los toros': 'Paso de los Toros', mirinda: 'Mirinda', salus: 'Salus', matutina: 'Matutina',
  villavicencio: 'Villavicencio', ades: 'Ades', 'del valle': 'Del Valle', baggio: 'Baggio', cepita: 'Cepita', citric: 'Citric', powerade: 'Powerade', gatorade: 'Gatorade', 'red bull': 'Red Bull', speed: 'Speed', monster: 'Monster', 'monster energy': 'Monster',
  aquarius: 'Aquarius', levite: 'Levité', tang: 'Tang', clight: 'Clight', bc: 'BC', frutte: 'Frutté', nix: 'Nix', h2oh: 'H2OH',
  'lay s': "Lay's", lays: "Lay's", pringles: 'Pringles', doritos: 'Doritos', cheetos: 'Cheetos', ruffles: 'Ruffles', pehuamar: 'Pehuamar', '3d': '3D', krachitos: 'Krachitos', twistos: 'Twistos', saladix: 'Saladix',
  'bon o bon': 'Bon o Bon', cofler: 'Cofler', nucrem: 'Nucrem', cadbury: 'Cadbury', garoto: 'Garoto', lacta: 'Lacta', aguila: 'Águila', mogul: 'Mogul', beldent: 'Beldent', billiken: 'Billiken', sugus: 'Sugus', kinder: 'Kinder',
  ferrero: 'Ferrero', 'ferrero rocher': 'Ferrero', toblerone: 'Toblerone', nutella: 'Nutella', snickers: 'Snickers', 'm m s': "M&M's", 'kit kat': 'Kit Kat', kitkat: 'Kit Kat', shot: 'Shot', 'hellmann s': "Hellmann's", hellmanns: "Hellmann's", fanacoa: 'Fanacoa', natura: 'Natura', knorr: 'Knorr', maggi: 'Maggi',
  'la campagnola': 'La Campagnola', adria: 'Adria', 'las acacias': 'Las Acacias', 'don vicente': 'Don Vicente', lucchetti: 'Lucchetti', matarazzo: 'Matarazzo', saman: 'Saman', 'green chef': 'Green Chef', optimo: 'Óptimo', cocinero: 'Cocinero',
  canarias: 'Canarias', sara: 'Sara', baldo: 'Baldo', taragui: 'Taragüi', rosamonte: 'Rosamonte', puritas: 'Puritas', heinz: 'Heinz', savora: 'Savora', alco: 'Alco', cica: 'Cica',
  schneck: 'Schneck', cattivelli: 'Cattivelli', 'la constancia': 'La Constancia', centenario: 'Centenario', ottonello: 'Ottonello', paladini: 'Paladini', swift: 'Swift',
  pilsen: 'Pilsen', patricia: 'Patricia', zillertal: 'Zillertal', 'stella artois': 'Stella Artois', heineken: 'Heineken', corona: 'Corona', crufi: 'Crufi', ena: 'ENA', 'star nutrition': 'Star Nutrition', 'gold nutrition': 'Gold Nutrition',
}));
// Las dueñas de otras marcas: «Sprite» es Sprite, aunque Open Food Facts diga Coca-Cola.
const DUENAS = new Set(['Nestlé', 'Arcor', 'Danone', 'Coca-Cola', 'Pepsi']);
const DE_LAS_DUENAS = ['Sprite', 'Fanta', 'Cepita', 'Del Valle', 'Powerade', 'Schweppes', 'Aquarius', 'Ades', 'Mirinda', '7 Up', 'Gatorade', 'H2OH', 'Paso de los Toros', 'Cheetos', 'Doritos', "Lay's", 'Ruffles', '3D', 'Pehuamar', 'Twistos', 'Quaker', 'Toddy', 'Nesquik', 'Nescafé', 'Kit Kat', 'Maggi', 'Bon o Bon', 'Cofler', 'Águila', 'Mogul', 'Activia', 'Ser', 'Danonino'];
// Las marcas globales que entran con una etiqueta de otro país, si nadie las cargó con Uruguay o Argentina.
const DE_AFUERA = new Set(["Kellogg's", 'Nesquik', 'Oreo', 'Pringles', "Lay's", 'Doritos', 'Cheetos', 'Ruffles', 'Coca-Cola', 'Pepsi', 'Sprite', 'Fanta', 'Schweppes', 'Red Bull', 'Monster', 'Snickers', "M&M's", 'Kit Kat', 'Milka', 'Nutella', 'Kinder', 'Toblerone', 'Ferrero', 'Quaker', 'Gatorade', 'Powerade', 'Nescafé', 'Maggi', 'Knorr', "Hellmann's", 'Heinz', 'Cadbury', 'Garoto', 'Lacta']);
const NOMBRE_DEL_PAIS = { mexico: 'México', chile: 'Chile', colombia: 'Colombia', peru: 'Perú', ecuador: 'Ecuador', paraguay: 'Paraguay', bolivia: 'Bolivia', 'costa-rica': 'Costa Rica', spain: 'España', brazil: 'Brasil' };
// Cómo se escribe mal cada marca, además de con o sin signos y tildes (eso ya lo perdona patronDe).
const ERRATAS = { Nesquik: ['nesquick'], "Kellogg's": ['kellog s', 'kellogs'], "Hellmann's": ['helmann s', 'hellman s'] };
// Lo que un producto de acá trae cargado en inglés o mal escrito, y tiene nombre conocido.
const ARREGLOS = [[/^coke\b/i, 'Coca-Cola'], [/^coca(\s+(zero|light|sin\b.*))?$/i, 'Coca-Cola$1'], [/milk caramel spread/i, 'Dulce de leche'], [/cream cheese/i, 'Queso crema'], [/\bligth\b/gi, 'light'], [/zukaritas/gi, 'Zucaritas'], [/ultrapaseturizada/gi, 'ultrapasteurizada'], [/\bbudin\b/gi, 'budín']];
// De las marcas de afuera entra lo que acá se conoce, no cada edición de otro país.
const LINEAS = {
  "Kellogg's": /corn ?flakes|zucaritas|froot ?loops|choco ?krispi|special ?k|all.?bran|krave|rice ?krispies|musli|muesli|granola|smacks|choco ?pops|cereal/i,
  Nesquik: /cacao|polvo|chocolate en|cereal|bebida|listo|leche/i,
  Quaker: /avena|oat|granola|barra|cereal/i,
  'Coca-Cola': /coca|sin azucar|zero|light|original|cherry/i,
  Pepsi: /pepsi|cola|black|twist|zero|max/i,
};
// Lo cargado en otro idioma: en una búsqueda en español no se encuentra, y en la lista se ve raro.
// Más palabras de otros idiomas que se colaban (3/11/2026), y los nombres en otro alfabeto: nadie los busca en español.
const OTRO_IDIOMA_MAS = /getränk|riegel|packung|erdbeer|zitrone|überraschung|tuinkruiden|bananen|schoko|\bkaffee?\b|maquereau|tartinade|avoine|calendrier|brisket|\bmaple\b|glazed|\bhoney\b/i;
const OTRO_ALFABETO = /[Ѐ-ӿ֐-׿؀-ۿ぀-ヿ一-鿿가-힯]/;
const OTRO_IDIOMA = /frutta|cioccolato|\bsecca\b|\blatte\b|céréales|poudre|cacaotée|pépites|noisette|saveur|\blait\b|\baux?\b|\bavec\b|\bsans\b|\bmit\b|\bund\b|\bchocolat\b|fraise|fromage|\bnocciol|\bsenza\b|\bessential\b|\bpowder\b|\bvitamins\b|\bminerals\b|\bflavou?red\b/i;
// Palabras que van en mayúsculas de verdad.
const SIGLAS = new Set(['TACC', 'UHT', 'BCAA', 'ZMA', 'BBQ', 'ADES', 'ENA', 'BC']);
// Lo que no se anota: se toma, pero no es lo que está cargado (la yerba es la hoja, no el mate).
const NO_SE_ANOTA = ['en:teas', 'en:herbal-teas', 'en:yerba-mate', 'en:infusions', 'en:baby-foods', 'en:baby-milks', 'en:non-food-products'];
// Lo que no se entiende en una búsqueda en español. Lo que es nombre propio («Corn Flakes», «Special K») queda.
// «rice» solo con lo que lo acompaña: Rice Krispies es el nombre del producto también acá.
const EN_INGLES = /\b(milk|cream|cheese|spread|herbal|teas?|juice|water|butter|peanut|flavou?r|flavored|sweetened|unsweetened|whole|wheat|bread|drink|with|strawberry|vanilla|sauce|soup|beans|sugar|salted|roasted|chicken|beef|chocolate bar|flour|all-purpose|coating|seasoned|vegetables|wrappers|rice (?:cake|dessert|paper)|brown rice)\b/i;
// Lo que no es una marca, o lo que nadie busca como marca.
const NO_ES_MARCA = /^(uruguay|argentina|sin marca|unbranded|generico|generica|varios|otro|otros|na|n a|none)$/;
// Lo de Brasil o Portugal que llega con su nombre: en una búsqueda en español, no ayuda.
const EN_PORTUGUES = /\b(biscoito|bolacha|leite|suco|refrigerante|acucar|achocolatado|recheado|sabor de|queijo|manteiga|pao)\b|[ãõç]/i;

const numero = (x) => {
  const n = Number(String(x ?? '').replace(',', '.'));
  return x !== '' && x != null && Number.isFinite(n) && n >= 0 ? n : null;
};
function codigoValido(codigo) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(codigo)) return false;
  const digitos = [...codigo].map(Number);
  const control = digitos.pop();
  const suma = digitos.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}
function cierra(v) {
  const base = 4 * v.proteina + 9 * v.grasas + 7 * (v.alcohol ?? 0);
  const fibra = v.fibra ?? 0;
  const formas = [base + 4 * v.carbohidratos, base + 4 * v.carbohidratos + 2 * fibra, base + 4 * Math.max(0, v.carbohidratos - fibra) + 2 * fibra];
  return formas.some((k) => Math.abs(v.kcal - k) <= Math.max(15, 0.17 * v.kcal));
}

/** La marca que se muestra: la de la lista, si alguna coincide; si no, la primera tal como viene. */
function marcaDe(campo, nombre) {
  const todas = campo.split(',').map((m) => m.replace(/^xx:/, '').trim()).filter(Boolean);
  const conocidas = todas.map((m) => MARCAS.get(llano(m))).filter(Boolean);
  // La más específica gana: «Nestlé, Nesquik» es Nesquik. Y si el nombre la dice, también: «Sprite», de Coca-Cola.
  let especifica = conocidas.find((m) => !DUENAS.has(m)) ?? conocidas[0];
  if (DUENAS.has(especifica)) especifica = DE_LAS_DUENAS.find((m) => patronesDe(m).some((p) => p.test(nombre))) ?? especifica;
  if (especifica) return { marca: especifica, conocida: true, otras: conocidas.filter((m) => m !== especifica) };
  const primera = todas[0]?.replace(/\s*\([^)]*\)/g, '').trim();
  if (!primera || NO_ES_MARCA.test(llano(primera)) || primera.length < 2 || primera.length > 28) return null;
  const linda = primera === primera.toUpperCase() || primera === primera.toLowerCase() ? primera.toLowerCase().replace(/(^|[\s-])\p{L}/gu, (x) => x.toUpperCase()) : primera;
  return { marca: linda, conocida: false, otras: [] };
}

const LETRAS_CON_TILDE = { a: '[aáàä]', e: '[eéèë]', i: '[iíìï]', o: '[oóòö]', u: '[uúùü]', n: '[nñ]' };
/** La marca dentro de un nombre, se haya escrito como se haya escrito: «Lays», «Lay's», «7up», «coca cola». */
function patronDe(forma) {
  const letras = [...forma].map((c) => (c === ' ' ? "[\\s'’.&\\-]*" : (LETRAS_CON_TILDE[c] ?? c))).join('');
  return new RegExp(`(?<![\\p{L}\\p{N}])${letras}(?![\\p{L}\\p{N}])`, 'iu');
}
const patrones = new Map();
function patronesDe(marca) {
  if (!patrones.has(marca)) patrones.set(marca, [llano(marca), ...(ERRATAS[marca] ?? [])].map(patronDe));
  return patrones.get(marca);
}

function nombreLimpio(crudo, marca) {
  let s = crudo.replace(/[|·]/g, ' ').replace(/\s+/g, ' ').trim();
  for (const [de, a] of ARREGLOS) s = s.replace(de, a);
  // «Burger Life Burger Life Green»: el nombre repetido.
  s = s.replace(/^(.{4,}?)\s+\1\b/i, '$1');
  // Sin la cantidad: es del envase, y un mismo producto viene en varios.
  s = s.replace(/\b\d+(?:[.,]\d+)?\s?(?:g|gr|grs|gramos?|kg|kilos?|ml|cc|cm3|l|lt|lts|litros?)\b\.?/gi, ' ').replace(/\bx\s?\d+\b/gi, ' ').replace(/\s*\(\s*\)/g, ' ');
  s = s.replace(/\s+/g, ' ').replace(/^[\s,.:;-]+|[\s,.:;-]+$/g, '');
  if (s.length < 2) return null;
  const letras = s.replace(/[^\p{L}]/gu, '');
  if (!letras) return null;
  // Lo escrito casi todo en mayúsculas («LECHE LARGA VIDA Clásica») o todo en minúsculas, como una oración.
  const mayusculas = letras.replace(/[^\p{Lu}]/gu, '').length;
  const palabras = s.split(' ').filter((w) => w.length >= 3);
  const conMayuscula = palabras.filter((w) => /^\p{Lu}/u.test(w)).length;
  if (mayusculas === 0 || mayusculas > letras.length * 0.6 || (palabras.length >= 3 && conMayuscula >= palabras.length * 0.7)) s = s.toLowerCase();
  else s = s.replace(/\p{Lu}{3,}/gu, (w) => (SIGLAS.has(w) ? w : w.toLowerCase()));
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (s.length > 60) return null;
  // La marca, siempre bien escrita, y una sola vez.
  const patron = patronesDe(marca).find((p) => p.test(s));
  if (!patron) return `${s} ${marca}`;
  s = s.replace(patron, marca);
  if (s.startsWith(`${marca},`)) s = `${marca} ${s.slice(marca.length + 1).trim()}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function categoriaDe(tags, nombre) {
  const es = (x) => tags.includes(`en:${x}`);
  if (es('alcoholic-beverages') || es('beers') || es('wines')) return 'alcohol';
  if (es('cheeses')) return 'quesos';
  if (es('dairies') || es('milks') || es('yogurts') || es('fermented-milk-products')) return 'lacteos';
  if (es('beverages') || es('sodas') || es('waters') || es('fruit-juices')) return 'bebidas';
  if (es('breakfast-cereals')) return 'cereales';
  if (es('spreads') || es('sweet-spreads') || es('jams')) return 'untables';
  if (es('salty-snacks') || es('chips-and-fries') || es('crisps') || es('appetizers')) return 'snacks';
  if (es('biscuits-and-cakes') || es('biscuits') || es('cakes') || es('chocolates') || es('confectioneries') || es('sweet-snacks') || es('candies') || es('ice-creams') || es('desserts')) return 'dulces';
  if (es('breads')) return 'panes';
  if (es('pastas')) return 'pastas';
  if (es('meats') || es('prepared-meats') || es('sausages')) return 'carnes';
  if (es('sauces') || es('condiments')) return 'salsas';
  if (es('fats') || es('vegetable-oils')) return 'grasas';
  if (es('cereals-and-their-products') || es('cereals-and-potatoes')) return 'cereales';
  // Mucho de acá no trae categorías: entonces, por cómo se llama.
  const n = llano(nombre);
  if (/\b(dulce de leche|mermelada|untable|miel)\b/.test(n)) return 'untables';
  if (/\b(manteca|margarina|aceite)\b/.test(n)) return 'grasas';
  if (/\b(queso|requeson|muzzarella|mozzarella)\b/.test(n)) return 'quesos';
  if (/\b(leche|yogur|yogurt|postre lacteo|flan|crema de leche)\b/.test(n)) return 'lacteos';
  if (/\b(galletitas?|alfajor(es)?|chocolate|budin|obleas?|bizcochos?|helado|caramelos?|bombon(es)?|barra de)\b/.test(n)) return 'dulces';
  if (/\b(jugo|agua|refresco|gaseosa|bebida)\b/.test(n)) return 'bebidas';
  if (/\b(papas|papitas|chizitos|palitos|snacks?|mani|nachos)\b/.test(n)) return 'snacks';
  if (/\b(fideos|pasta|ravioles|tallarines|sorrentinos)\b/.test(n)) return 'pastas';
  if (/\b(pan|tostadas|panes|pancitos)\b/.test(n)) return 'panes';
  if (/\b(arroz|harina|avena|cereal|cereales|granola|polenta)\b/.test(n)) return 'cereales';
  if (/\b(salsa|ketchup|mayonesa|mostaza|aderezo)\b/.test(n)) return 'salsas';
  if (/\b(jamon|salame|panceta|hamburguesas?|salchichas?|chorizo|mortadela)\b/.test(n)) return 'carnes';
  return 'ingredientes';
}
const PORCION = { bebidas: 200, alcohol: 330, cereales: 30, dulces: 30, untables: 20, snacks: 30, panes: 50, salsas: 15, grasas: 10, pastas: 80, quesos: 30, lacteos: 150, carnes: 50, ingredientes: 50 };
// Menos que esto por 100 g es que se cargó lo de una porción: una galletita no tiene 140 kcal cada 100 g.
const MINIMO_DE_KCAL = { snacks: 300, cereales: 250, pastas: 200 };
const SIEMPRE_CALORICO = /\b(galletitas?|alfajor(es)?|obleas?|chocolate en barra|barra de chocolate|budin)\b/;
// Lo que puede tener cada cosa por 100 g. Lo de afuera de esto es que se cargó lo de una porción: las kcal
// igual cierran con los macros, así que solo se ve por el nombre. La primera que coincide manda.
const KCAL_POSIBLES = [
  [/\byogur|yogurt\b.*\b(descremad|light|0)/, 25, 85],
  [/\byogur|yogurt\b/, 30, 175],
  [/\bdulce de leche\b/, 150, 400],
  [/\bleche\b(?!.*(condensada|polvo))/, 20, 110],
  [/\b(barbacoa|bbq|ketchup)\b/, 40, 300],
  [/\bmayonesa\b/, 100, 800],
  [/\b(corn ?flakes|cereal(es)?|avena|granola|copos|musli|muesli)\b/, 250, 600],
  [/\bmermelada\b/, 30, 350],
  [/\bqueso\b/, 60, 480],
  [/\bhelado\b/, 90, 450],
  [/\b(jugo|gaseosa|refresco|cepita|del valle)\b/, 0, 70],
  [/\b(palitos|papas fritas|papitas|chizitos|nachos)\b/, 300, 650],
];
const redondo = (n) => Math.round(n * 10) / 10;
const texto = (n) => String(redondo(n));

// ---------------------------------------------------------------- leer
function leer(archivo) {
  const ruta = join(raiz, '.cache/off', archivo);
  if (!existsSync(ruta)) return [];
  const crudo = readFileSync(ruta, 'utf8').split('\n');
  const columnas = crudo[0].split('\t');
  return crudo.slice(1).filter(Boolean).map((l) => {
    const c = l.split('\t');
    return Object.fromEntries(columnas.map((k, i) => [k, c[i] ?? '']));
  });
}
const filas = [...leer('marcas.tsv'), ...leer('marcas-region.tsv')];

// Un producto conserva su número al rearmar: lo que ya se anotó apunta a él.
const numeros = new Map();
let siguiente = PRIMER_NUMERO;
if (existsSync(join(raiz, 'alimentos/marcas.txt'))) {
  for (const linea of readFileSync(join(raiz, 'alimentos/marcas.txt'), 'utf8').split(/\r?\n/)) {
    const n = linea.match(/producto#(\d+)/);
    const codigos = linea.match(/ean=([\d,]+)/);
    if (!n || !codigos) continue;
    for (const c of codigos[1].split(',')) numeros.set(c, Number(n[1]));
    siguiente = Math.max(siguiente, Number(n[1]) + 1);
  }
}

// Lo que ya está curado a mano no se repite.
const yaEstan = { codigos: new Set(), nombres: new Set() };
for (const archivo of readdirSync(join(raiz, 'alimentos'))) {
  if (!archivo.endsWith('.txt') || archivo === 'marcas.txt' || archivo === 'verificacion.txt') continue;
  for (const linea of readFileSync(join(raiz, 'alimentos', archivo), 'utf8').split(/\r?\n/)) {
    if (!linea.trim() || linea.startsWith('//') || linea.startsWith('#')) continue;
    yaEstan.nombres.add(llano(linea.split('|')[0]));
    const m = linea.match(/ean=([\d,]+)/);
    if (m) m[1].split(',').forEach((c) => yaEstan.codigos.add(c));
  }
}

const motivos = new Map();
const fuera = (m) => { motivos.set(m, (motivos.get(m) ?? 0) + 1); return null; };

function producto(f) {
  if (!codigoValido(f.code)) return fuera('código no válido');
  if (yaEstan.codigos.has(f.code)) return fuera('ya está curado');
  const m = marcaDe(f.brands, f.product_name);
  if (!m) return fuera('sin marca');
  // Con un código de GS1 Uruguay (773) es de acá, aunque Open Food Facts le ponga otro país.
  const enUruguay = f.countries_tags.includes('en:uruguay') || /^773\d{10}$/.test(f.code);
  const enArgentina = f.countries_tags.includes('en:argentina');
  if (!enUruguay && !m.conocida) return fuera('marca de Argentina que no se vende acá');
  if (!enUruguay && !enArgentina && !DE_AFUERA.has(m.marca)) return fuera('marca de otro país que no entra');
  if (!f.product_name || EN_PORTUGUES.test(llano(f.product_name)) || /[ãõç]/i.test(f.product_name)) return fuera('sin nombre o en portugués');
  const tags = f.categories_tags.split(',');
  if (NO_SE_ANOTA.some((t) => tags.includes(t))) return fuera('no se anota');
  if (OTRO_IDIOMA.test(f.product_name) || OTRO_IDIOMA_MAS.test(f.product_name) || OTRO_ALFABETO.test(f.product_name)) return fuera('en otro idioma');
  // Moss es para todo el mundo: nada se presenta como de un país (lo comprueba verificar-alimentos.mjs).
  const es = nombreLimpio(f.product_name, m.marca);
  if (!es) return fuera('nombre que no sirve');
  if (EN_INGLES.test(llano(es))) return fuera('en inglés');
  // Moss es para todo el mundo: nada se presenta como de un país (lo comprueba verificar-alimentos.mjs).
  if (/urugua|oriental|charrúa/i.test(es)) return fuera('nombra un país');
  if (!enUruguay && !enArgentina && LINEAS[m.marca] && !LINEAS[m.marca].test(llano(es))) return fuera('de otro país y no es de las líneas conocidas');
  if (yaEstan.nombres.has(llano(es))) return fuera('ya está curado');
  const kcal = numero(f['energy-kcal_100g']) ?? (numero(f.energy_100g) !== null ? numero(f.energy_100g) / 4.184 : null);
  const v = { kcal, proteina: numero(f.proteins_100g), carbohidratos: numero(f.carbohydrates_100g), grasas: numero(f.fat_100g), fibra: numero(f.fiber_100g), azucares: numero(f.sugars_100g), saturadas: numero(f['saturated-fat_100g']), sodio: numero(f.sodium_100g), alcohol: numero(f.alcohol_100g) };
  if (v.kcal === null || v.proteina === null || v.carbohidratos === null || v.grasas === null) return fuera('sin los cuatro valores');
  if (v.kcal > 902 || v.proteina + v.carbohidratos + v.grasas > 100.5) return fuera('valores imposibles');
  v.alcohol = v.alcohol ? v.alcohol * 0.789 : null;
  v.sodio = v.sodio === null ? null : v.sodio * 1000;
  if (v.kcal === 0 && v.proteina + v.carbohidratos + v.grasas > 2) return fuera('no cierra con los macros');
  if (!cierra(v)) return fuera('no cierra con los macros');
  if ((v.azucares ?? 0) > v.carbohidratos + 1 || (v.saturadas ?? 0) > v.grasas + 1 || (v.sodio ?? 0) > 40000) return fuera('lo secundario no cierra');
  const categoria = categoriaDe(tags, es);
  if (/\bcorn ?flakes\b/.test(llano(es)) && v.grasas > 5) return fuera('valores de otro producto');
  const posible = KCAL_POSIBLES.find(([p]) => p.test(llano(es)));
  if (v.kcal < (MINIMO_DE_KCAL[categoria] ?? 0) || (SIEMPRE_CALORICO.test(llano(es)) && v.kcal < 250) || (posible && (v.kcal < posible[1] || v.kcal > posible[2]))) return fuera('valores por porción, no por 100 g');
  const envase = (f.quantity || '').toLowerCase();
  // El cacao en polvo y el café instantáneo son bebidas, pero se miden en gramos: lo líquido tiene pocas kcal.
  const esPolvo = categoria === 'bebidas' && v.kcal > 120;
  const esCafe = esPolvo && tags.some((t) => t === 'en:coffees' || t === 'en:instant-coffees');
  const pareceLiquido = /\b(ml|cc|cl|l|lt|lts|litros?)\b/.test(envase) || categoria === 'bebidas' || categoria === 'alcohol' || /\bml\b/.test((f.serving_size || '').toLowerCase());
  const esLiquido = pareceLiquido && !esPolvo && v.kcal <= (categoria === 'alcohol' ? 400 : 120);
  const seBebe = esLiquido && (categoria === 'bebidas' || categoria === 'alcohol' || (/\b(leche|bebible|batido|beber)\b/.test(llano(es)) && !/\b(dulce de leche|en polvo)\b/.test(llano(es))));
  const unidad = esLiquido ? 'ml' : 'g';
  const deFabrica = esCafe ? 2 : esPolvo ? 15 : seBebe && categoria !== 'alcohol' ? 200 : PORCION[categoria];
  const cargada = numero(f.serving_quantity);
  // Muchos cargan como porción los 100 g de la tabla: lo que se aleja mucho de lo normal no es una porción.
  const deUna = cargada && cargada !== 100 && cargada >= deFabrica * 0.3 && cargada <= deFabrica * 3 ? cargada : deFabrica;
  const tamano = numero(f.product_quantity);
  // Lo que viene de a uno (un alfajor, una lata) se anota de a uno.
  const deAUno = tamano && ((seBebe && tamano <= 600) || ((categoria === 'dulces' || categoria === 'snacks') && tamano <= 80));
  const porciones = [];
  if (deAUno) porciones.push(seBebe ? `1 envase (${texto(tamano)} ml) / 1 package (${texto(tamano)} ml)=${texto(tamano)}` : `1 unidad (${texto(tamano)} g) / 1 piece (${texto(tamano)} g)=${texto(tamano)}`);
  if (!deAUno || deUna <= tamano * 0.7) porciones.push(seBebe ? `1 vaso (${texto(deUna)} ml) / 1 glass (${texto(deUna)} ml)=${texto(deUna)}` : `1 porción (${texto(deUna)} ${unidad}) / 1 serving (${texto(deUna)} ${unidad})=${texto(deUna)}`);
  if (!deAUno && tamano && tamano >= deUna * 1.5 && tamano <= 1500) porciones.push(`1 envase (${texto(tamano)} ${unidad}) / 1 package (${texto(tamano)} ${unidad})=${texto(tamano)}`);
  const paisDeAfuera = !enUruguay && !enArgentina ? Object.keys(NOMBRE_DEL_PAIS).find((p) => f.countries_tags.includes(`en:${p}`)) : undefined;
  return {
    es, en: nombreEnIngles(es), marca: m.marca, otras: m.otras, codigo: f.code, categoria, v, porciones, liquido: esLiquido, escaneos: numero(f.unique_scans_n) ?? 0, enUruguay,
    origen: enUruguay ? 0 : enArgentina ? 1 : 2, deAfuera: paisDeAfuera ? NOMBRE_DEL_PAIS[paisDeAfuera] : null,
  };
}
// Un nombre de marca se dice igual: en inglés va el mismo.
const nombreEnIngles = (es) => es;

const buenos = filas.map(producto).filter(Boolean);

// El mismo producto en varios tamaños va junto, si los valores se parecen; si no, queda el más escaneado.
const porNombre = new Map();
for (const p of buenos.sort((a, b) => a.origen - b.origen || b.escaneos - a.escaneos)) {
  const clave = llano(p.es);
  const antes = porNombre.get(clave);
  if (!antes) porNombre.set(clave, { ...p, codigos: [p.codigo] });
  else if (Math.abs(antes.v.kcal - p.v.kcal) <= Math.max(15, 0.1 * antes.v.kcal)) {
    antes.codigos.push(p.codigo);
    antes.escaneos += p.escaneos;
    if (antes.porciones.length === 1 && p.porciones.length > 1) antes.porciones.push(p.porciones[1]);
  } else fuera('otro producto con el mismo nombre');
}

// Por marca, lo más escaneado primero, hasta el tope. Lo de afuera va después, entra poco y solo si falta.
const porMarca = Map.groupBy([...porNombre.values()], (p) => p.marca);
const elegidos = [...porMarca.entries()]
  .flatMap(([, lista]) => {
    const orden = lista.sort((a, b) => b.escaneos - a.escaneos);
    const deAca = orden.filter((p) => p.origen < 2).slice(0, TOPE_POR_MARCA);
    const deAfuera = orden.filter((p) => p.origen === 2).slice(0, TOPE_DE_AFUERA);
    return [...deAca, ...deAfuera].map((p, i) => ({ ...p, orden: i }));
  })
  .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.marca.localeCompare(b.marca) || a.orden - b.orden);

// ---------------------------------------------------------------- escribir
const lineas = [
  '// Los productos de marca que se consiguen en Uruguay, de Open Food Facts (openfoodfacts.org, licencia ODbL; cada',
  '// línea lleva «off»). No se edita a mano: lo arma herramientas/marcas.mjs con la exportación que baja',
  '// herramientas/bajar-marcas.mjs. Entra solo lo que tiene código válido, valores por 100 g posibles y kcal que',
  '// cierran con los macros. Lo curado a mano está en productos.txt, y lo de aquí no lo repite. Lo de otro país lleva',
  '// «aproximado»: es la etiqueta de allá. «orden» es el lugar en que sale al buscar la marca.',
  '// Lo que se toma va por 100 ml, como dicen las etiquetas, con densidad 1: la diferencia con la real es de menos de 5 %.',
  `// Armado el ${new Date().toISOString().slice(0, 10)}.`,
];
let categoria = null;
for (const p of elegidos) {
  if (p.categoria !== categoria) {
    categoria = p.categoria;
    lineas.push('', `# ${categoria}`);
  }
  const n = p.codigos.map((c) => numeros.get(c)).find((x) => x !== undefined) ?? siguiente++;
  const detalles = [`marca=${p.marca}`, `orden=${p.orden}`, `ean=${p.codigos.join(',')}`, 'off'];
  if (p.deAfuera) detalles.push('aproximado', `fuente=Open Food Facts, etiqueta de ${p.deAfuera}`);
  if (p.liquido) detalles.push('densidad=1');
  for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol']) if (p.v[k] !== null && p.v[k] !== undefined) detalles.push(`${k}=${texto(p.v[k])}`);
  const alias = p.otras.map((o) => (llano(p.es).includes(llano(o)) ? null : `${p.es} ${o}`)).filter(Boolean).join(' · ');
  lineas.push(`${p.es} | ${p.en} | producto#${n} ${texto(p.v.kcal)} ${texto(p.v.proteina)} ${texto(p.v.carbohidratos)} ${texto(p.v.grasas)} | ${p.porciones.join(' · ')} | ${alias} | ${detalles.join(' · ')}`);
}
writeFileSync(join(raiz, 'alimentos/marcas.txt'), `${lineas.join('\n')}\n`);
// ODbL: quien usa una base derivada tiene que poder obtenerla. Va con el sitio (spec/fuentes.md).
mkdirSync(join(raiz, 'docs/datos'), { recursive: true });
writeFileSync(join(raiz, 'docs/datos/marcas-open-food-facts.txt'), `// Productos de marca que usa Moss, derivados de Open Food Facts (openfoodfacts.org). Licencia ODbL: https://opendatacommons.org/licenses/odbl/1-0/\n${lineas.join('\n')}\n`);

const cuantos = [...Map.groupBy(elegidos, (p) => p.marca).entries()].map(([m, l]) => [m, l.length]).sort((a, b) => b[1] - a[1]);
console.log(`${filas.length} leídos, ${buenos.length} buenos, ${elegidos.length} en alimentos/marcas.txt, de ${cuantos.length} marcas.`);
console.log('Afuera:', [...motivos].sort((a, b) => b[1] - a[1]).map(([m, c]) => `${m}: ${c}`).join(' · '));
console.log('Marcas:', cuantos.slice(0, 60).map(([m, c]) => `${m} ${c}`).join(' · '));
