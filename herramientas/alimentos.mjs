// Arma la base de alimentos de la app (assets/alimentos.db) con USDA FoodData Central, que es de
// dominio público, y los genéricos curados en español (alimentos/genericos.txt). Detalle en
// spec/nutricion.md: qué se toma de cada base, los nombres, la búsqueda y las porciones.
// - Baja FNDDS 2021–2023 y SR Legacy a .cache/usda la primera vez.
// - Deja afuera lo que no se registra (comida de bebé, fórmulas) y lo que es de una marca o
//   cadena de Estados Unidos.
// - Los valores van por 100 g: kcal, proteína, carbohidratos y grasas y, cuando USDA los tiene,
//   fibra, azúcares, grasas saturadas, sodio (en mg) y alcohol.
// - Calcula los platos que son recetas (`receta#` en genericos.txt) con sus ingredientes curados.
// - Arma los dos índices de búsqueda: palabras con prefijos y trigramas.
// La arma el SQLite de Node, que es la misma versión que trae expo-sqlite (3.53).
// Uso: npm run alimentos   → después, npm run alimentos:verificar

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ESQUEMA = 3;

const BASES = {
  fndds: {
    nombre: 'FNDDS 2021–2023',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_survey_food_csv_2024-10-31.zip',
    // FNDDS usa los números viejos de nutriente; SR Legacy, los ids de FoodData Central.
    nutrientes: { 208: 'kcal', 203: 'proteina', 205: 'carbohidratos', 204: 'grasas', 291: 'fibra', 269: 'azucares', 606: 'saturadas', 307: 'sodio', 221: 'alcohol' },
    // Comida de bebé, fórmulas y leche materna: no se registran en Moss.
    fuera: new Set(['9002', '9004', '9006', '9007', '9008', '9010', '9012', '9202', '9204', '9402', '9404', '9602']),
  },
  sr: {
    nombre: 'SR Legacy 2018-04',
    url: 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip',
    nutrientes: { 1008: 'kcal', 1003: 'proteina', 1005: 'carbohidratos', 1004: 'grasas', 1079: 'fibra', 2000: 'azucares', 1258: 'saturadas', 1093: 'sodio', 1018: 'alcohol' },
    // Bebés, comida rápida, indígenas de EE. UU., restaurantes, marcas y controles de calidad.
    fuera: new Set(['3', '21', '24', '25', '26', '27']),
  },
};

// ------------------------------------------------------------ Bajar y leer
async function bajar(base, url, nombre) {
  const carpeta = join(raiz, '.cache/usda', base);
  const zip = join(carpeta, base === 'sr28' ? 'sr28asc.zip' : `${base}.zip`);
  if (!existsSync(zip)) {
    mkdirSync(carpeta, { recursive: true });
    console.log(`Bajando ${nombre}…`);
    const respuesta = await fetch(url, { headers: { 'User-Agent': 'Moss (herramientas/alimentos.mjs)' } });
    if (!respuesta.ok) throw new Error(`${url}: ${respuesta.status}`);
    writeFileSync(zip, Buffer.from(await respuesta.arrayBuffer()));
  }
  return zip;
}

/** Los archivos de un .zip, por nombre sin carpeta. Solo lo que usan estos zips: sin ZIP64 ni cifrado. */
function leerZip(ruta) {
  const zip = readFileSync(ruta);
  const fin = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const cantidad = zip.readUInt16LE(fin + 10);
  let p = zip.readUInt32LE(fin + 16);
  const archivos = new Map();
  for (let i = 0; i < cantidad; i++) {
    const metodo = zip.readUInt16LE(p + 10);
    const comprimido = zip.readUInt32LE(p + 20);
    const largoNombre = zip.readUInt16LE(p + 28);
    const extra = zip.readUInt16LE(p + 30);
    const comentario = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nombre = zip.toString('utf8', p + 46, p + 46 + largoNombre);
    const datos = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const crudo = zip.subarray(datos, datos + comprimido);
    if (!nombre.endsWith('/')) archivos.set(nombre.split('/').pop(), metodo === 8 ? inflateRawSync(crudo) : crudo);
    p += 46 + largoNombre + extra + comentario;
  }
  return archivos;
}

/** CSV con comillas, como los exporta USDA. Devuelve filas como objetos. */
function csv(buffer) {
  const t = buffer.toString('utf8');
  const filas = [];
  let fila = [];
  let campo = '';
  let comillas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (comillas) {
      if (c !== '"') campo += c;
      else if (t[i + 1] === '"') { campo += '"'; i++; }
      else comillas = false;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo); filas.push(fila); fila = []; campo = ''; }
    else if (c !== '\r') campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filas.push(fila); }
  const [cabecera, ...resto] = filas;
  return resto.map((f) => Object.fromEntries(cabecera.map((k, j) => [k, f[j]])));
}

// ------------------------------------------------------------ Porciones
const FRACCIONES = { 0.125: '⅛', 0.25: '¼', 0.33: '⅓', 0.333: '⅓', 0.5: '½', 0.67: '⅔', 0.667: '⅔', 0.75: '¾' };
/** 0.5 → ½, 1.5 → 1½, 2 → 2. */
function cantidad(texto) {
  const n = Number(texto);
  if (!Number.isFinite(n) || n <= 0) return texto;
  const entero = Math.floor(n);
  const resto = Math.round((n - entero) * 1000) / 1000;
  if (!resto) return String(entero);
  const fraccion = FRACCIONES[resto];
  return fraccion ? `${entero || ''}${fraccion}` : String(n).replace('.', ',');
}

/** El texto de una porción en inglés, como lo arma cada base. */
function porcionEnIngles(base, p) {
  if (base === 'fndds') return p.portion_description === 'Quantity not specified' ? 'Typical serving' : p.portion_description;
  return `${cantidad(p.amount)} ${p.modifier}`.trim();
}

// Del inglés de USDA al español. Lo que tiene género usa «unidad»: «1 unidad mediana» sirve para
// una banana y para un tomate. Si algo no se reconoce entero, no se traduce (vale null).
const UNIDADES = [
  ['typical serving', 'porción típica', 'porciones típicas'],
  ['nlea serving', 'porción de referencia', 'porciones de referencia'],
  ['serving', 'porción', 'porciones'],
  ['cup', 'taza', 'tazas'],
  ['tablespoon', 'cucharada', 'cucharadas'],
  ['tbsp', 'cucharada', 'cucharadas'],
  ['teaspoon', 'cucharadita', 'cucharaditas'],
  ['tsp', 'cucharadita', 'cucharaditas'],
  ['fl oz', 'onza líquida', 'onzas líquidas'],
  ['oz', 'onza', 'onzas'],
  ['ounce', 'onza', 'onzas'],
  ['lb', 'libra', 'libras'],
  ['large or thick slice', 'rebanada gruesa', 'rebanadas gruesas'],
  ['thick slice', 'rebanada gruesa', 'rebanadas gruesas'],
  ['medium or regular slice', 'rebanada mediana', 'rebanadas medianas'],
  ['medium slice', 'rebanada mediana', 'rebanadas medianas'],
  ['small or thin/very thin slice', 'rebanada fina', 'rebanadas finas'],
  ['small or thin slice', 'rebanada fina', 'rebanadas finas'],
  ['regular/thin slice', 'rebanada fina', 'rebanadas finas'],
  ['cracker-size slice', 'rebanada pequeña', 'rebanadas pequeñas'],
  ['piece/slice', 'porción', 'porciones'],
  ['slice', 'rebanada', 'rebanadas'],
  ['piece', 'trozo', 'trozos'],
  ['small/regular fillet', 'filete mediano', 'filetes medianos'],
  ['large fillet', 'filete grande', 'filetes grandes'],
  ['whole fish', 'pescado entero', 'pescados enteros'],
  ['individual container', 'envase individual', 'envases individuales'],
  ['miniature/bite size', 'unidad pequeña', 'unidades pequeñas'],
  ['miniature', 'unidad mini', 'unidades mini'],
  ['small/individual', 'unidad pequeña', 'unidades pequeñas'],
  ['medium breast', 'pechuga mediana', 'pechugas medianas'],
  ['large breast', 'pechuga grande', 'pechugas grandes'],
  ['small breast', 'pechuga pequeña', 'pechugas pequeñas'],
  ['breast', 'pechuga', 'pechugas'],
  ['wing', 'ala', 'alas'],
  ['half', 'mitad', 'mitades'],
  ['regular', 'unidad', 'unidades'],
  ['thick', 'unidad gruesa', 'unidades gruesas'],
  ['thin', 'unidad fina', 'unidades finas'],
  ['nut', 'unidad', 'unidades'],
  ['chip', 'unidad', 'unidades'],
  ['extra large', 'unidad muy grande', 'unidades muy grandes'],
  ['extra small', 'unidad muy pequeña', 'unidades muy pequeñas'],
  ['large', 'unidad grande', 'unidades grandes'],
  ['medium', 'unidad mediana', 'unidades medianas'],
  ['small', 'unidad pequeña', 'unidades pequeñas'],
  ['whole', 'unidad', 'unidades'],
  ['item', 'unidad', 'unidades'],
  ['unit', 'unidad', 'unidades'],
  ['each', 'unidad', 'unidades'],
  ['fruit', 'unidad', 'unidades'],
  ['egg', 'huevo', 'huevos'],
  ['fillet', 'filete', 'filetes'],
  ['steak', 'filete', 'filetes'],
  ['chop', 'chuleta', 'chuletas'],
  ['link', 'unidad', 'unidades'],
  ['patty', 'medallón', 'medallones'],
  ['bar', 'barra', 'barras'],
  ['stick', 'barra', 'barras'],
  ['can', 'lata', 'latas'],
  ['bottle', 'botella', 'botellas'],
  ['container', 'envase', 'envases'],
  ['package', 'paquete', 'paquetes'],
  ['packet', 'sobre', 'sobres'],
  ['cookie', 'galleta', 'galletas'],
  ['leaf', 'hoja', 'hojas'],
  ['leaves', 'hoja', 'hojas'],
  ['stalk', 'tallo', 'tallos'],
  ['clove', 'diente', 'dientes'],
  ['head', 'cabeza', 'cabezas'],
  ['wedge', 'gajo', 'gajos'],
  ['strip', 'tira', 'tiras'],
  ['scoop', 'bola', 'bolas'],
  ['sandwich', 'sándwich', 'sándwiches'],
  ['tortilla', 'tortilla', 'tortillas'],
  ['pizza', 'pizza', 'pizzas'],
  ['drink', 'vaso', 'vasos'],
  ['glass', 'vaso', 'vasos'],
  ['mug', 'taza grande', 'tazas grandes'],
  ['pat', 'porción individual', 'porciones individuales'],
];
const MODOS = {
  chopped: 'picado', diced: 'en cubos', sliced: 'en rodajas', slices: 'en rodajas', mashed: 'en puré', shredded: 'rallado', grated: 'rallado',
  cubed: 'en cubos', cubes: 'en cubos', halves: 'en mitades', pieces: 'en trozos', cooked: 'cocido', raw: 'crudo', packed: 'apretado',
  'chopped or diced': 'picado', 'cooked, diced': 'cocido, en cubos', 'cooked, chopped': 'cocido, picado', 'whole': 'entero', melted: 'derretido',
  'with ice': 'con hielo', 'no ice': 'sin hielo', crumbled: 'desmenuzado', drained: 'escurrido', 'drained solids': 'escurrido', 'boneless': 'sin hueso',
  sections: 'en gajos', balls: 'en bolitas', crushed: 'triturado', 'without shell': 'sin cáscara',
  // Lo que no agrega nada: «1 cup, NFS» es «1 taza».
  nfs: '', 'any size': '',
};
const pulgadasACm = (texto) => {
  const [entero, fraccion] = texto.split('-');
  const [a, b] = (fraccion ?? (entero.includes('/') ? entero : '')).split('/').map(Number);
  const pulgadas = (entero.includes('/') ? 0 : Number(entero)) + (b ? a / b : 0);
  return Math.round(pulgadas * 2.54);
};
/** «(7" to 7-7/8" long)» → «(18 a 20 cm de largo)»; si no se entiende, nada. */
function medidas(texto) {
  const m = texto.match(/^\(([\d/-]+)"(?: to ([\d/-]+)")? (long|dia|diameter|thick|wide|square|high)\)$/);
  if (!m) return null;
  const que = { long: 'de largo', dia: 'de diámetro', diameter: 'de diámetro', thick: 'de grosor', wide: 'de ancho', square: 'de lado', high: 'de alto' }[m[3]];
  return `(${pulgadasACm(m[1])}${m[2] ? ` a ${pulgadasACm(m[2])}` : ''} cm ${que})`;
}

export function porcionEnEspanol(ingles) {
  let resto = ingles.trim().replace(/^(\d+) (\d)\/(\d)\b/, '$1-$2/$3').replace(/^(?:(\d+)-)?([1-3])\/([2348])\b/, (_, entero = '', a, b) => `${entero}${FRACCIONES[Math.round((a / b) * 1000) / 1000] ?? `${a}/${b}`}`);
  const numero = resto.match(/^([\d½¼¾⅓⅔⅛]+(?:[.,]\d+)?)\s+/);
  const n = numero ? numero[1] : '1';
  if (numero) resto = resto.slice(numero[0].length);
  const plural = !/^(1|½|¼|¾|⅓|⅔|⅛)$/.test(n);
  let parentesis = '';
  const p = resto.match(/\s*(\([^)]*\))$/);
  if (p) {
    // Un paréntesis que no se entiende puede cambiar lo que es la porción («1 oz, raw (yield after
    // cooking)» son 16 g cocidos): mejor no traducirla que traducirla a medias.
    const traducido = medidas(p[1]);
    if (traducido === null) return null;
    parentesis = traducido;
    resto = resto.slice(0, -p[0].length);
  }
  const bajo = resto.toLowerCase();
  for (const [en, uno, varios] of UNIDADES) {
    for (const forma of [en, `${en}s`, `${en}es`]) {
      if (bajo !== forma && !bajo.startsWith(`${forma}, `) && !bajo.startsWith(`${forma} `)) continue;
      const modo = bajo.slice(forma.length).replace(/^,?\s*/, '');
      if (modo && MODOS[modo] === undefined) return null;
      return `${n} ${plural ? varios : uno}${MODOS[modo] ? `, ${MODOS[modo]}` : ''}${parentesis ? ` ${parentesis}` : ''}`.replace(/^1 porción típica$/, 'Porción típica');
    }
  }
  return null;
}

// ------------------------------------------------------------ Lo que no se come (SR28)
// SR Legacy en FoodData Central no trae el «refuse»: la parte de lo que se compra que no se come
// (la cáscara de la banana, el hueso de la costilla). Lo trae SR28, la misma base en su formato de
// antes, también de dominio público. Va por la descripción, que es la misma.
async function desechosDeSr28() {
  const zip = await bajar('sr28', 'https://www.ars.usda.gov/ARSUserFiles/80400535/DATA/SR/sr28/dnload/sr28asc.zip', 'SR28');
  const desechos = new Map();
  for (const linea of leerZip(zip).get('FOOD_DES.txt').toString('latin1').split(/\r?\n/)) {
    const f = linea.split('^').map((c) => c.replace(/^~|~$/g, ''));
    if (Number(f[8]) > 0) desechos.set(f[2], { fraccion: Number(f[8]) / 100, que: f[7] });
  }
  return desechos;
}

// El nombre corto de lo que no se come, para «Con cáscara»: lo que nombra la descripción de USDA,
// en este orden. «Hueso» es también el de la fruta, como dice la RAE.
const QUE_SE_DESECHA = [
  [/bone|cartilage/i, 'hueso', 'bone'],
  [/\bpits?\b|\bstones?\b/i, 'hueso', 'pit'],
  [/shell|hull|husk|\bpods?\b/i, 'cáscara', 'shell'],
  [/peel|skin|rind|paring/i, 'cáscara', 'peel'],
  [/\bseeds\b/i, 'semillas', 'seeds'],
  [/\bseed\b/i, 'semilla', 'seed'],
  [/\bcores?\b/i, 'corazón', 'core'],
  [/\bcobs?\b/i, 'marlo', 'cob'],
  [/stem|leaves|ends|trimming|crown|roots?\b|base/i, 'tallos', 'stems'],
];
/** Lo que no se come, en inglés: el hueso de una fruta es «pit» y el de una carne, «bone»; la cáscara de un huevo o de un fruto seco es «shell». */
function enIngles(es, categoria) {
  if (es === 'hueso') return categoria === 'frutas' ? 'pit' : 'bone';
  if (es === 'cáscara') return /huevo|frutos-secos|semillas|mariscos|pescados/.test(categoria ?? '') ? 'shell' : 'peel';
  return Object.fromEntries(QUE_SE_DESECHA.map(([, e, en]) => [e, en]))[es];
}
function queSeDesecha(descripcion) {
  const partes = QUE_SE_DESECHA.filter(([re]) => re.test(descripcion));
  const unicos = (i) => [...new Set(partes.map((p) => p[i]))].slice(0, 2).join(i === 1 ? ' y ' : ' and ');
  return partes.length ? { es: unicos(1), en: unicos(2) } : null;
}

// ------------------------------------------------------------ Los curados
/**
 * alimentos/*.txt (genericos.txt primero): una línea por alimento, con los campos separados por
 * « | »: nombre en español | nombre en inglés | de dónde sale | porciones | alias | detalles.
 * Las líneas «# categoría» abren una categoría; las que empiezan con «//» son comentarios.
 * Con SOLO=archivo.txt se arma con genericos.txt y ese archivo nada más (para revisar uno).
 */
function leerCurados() {
  const carpeta = join(raiz, 'alimentos');
  const solo = process.env.SOLO ? process.env.SOLO.split(',') : null;
  const archivos = readdirSync(carpeta).filter((a) => a.endsWith('.txt') && (!solo || a === 'genericos.txt' || solo.includes(a)))
    .sort((a, b) => (a === 'genericos.txt' ? -1 : b === 'genericos.txt' ? 1 : a.localeCompare(b)));
  const curados = [];
  for (const archivo of archivos) {
    let categoria = null;
    readFileSync(join(carpeta, archivo), 'utf8').split(/\r?\n/).forEach((linea, i) => {
      const donde = `${archivo}:${i + 1}`;
      if (!linea.trim() || linea.startsWith('//')) return;
      if (linea.startsWith('# ')) {
        categoria = linea.slice(2).trim();
        return;
      }
      const campos = linea.split('|').map((c) => c.trim());
      while (campos.length > 4 && !campos[campos.length - 1]) campos.pop();
      if (campos.length < 4) throw new Error(`${donde}: faltan campos`);
      const [es, en, origen, porciones, alias = '', detalles = ''] = campos;
      if (!es || !en) throw new Error(`${donde}: falta el nombre`);
      curados.push({
        donde, categoria, es, en, origen,
        // «1 mediana=118», o con el inglés: «1 mediana / 1 medium=118».
        porciones: porciones.split(' · ').filter(Boolean).map((x) => {
          const corte = x.lastIndexOf('=');
          const [nombre, gramos] = [x.slice(0, corte), x.slice(corte + 1)];
          if (!(Number(gramos) > 0)) throw new Error(`${donde}: porción sin gramos: ${x}`);
          const [es, en] = nombre.split(' / ').map((s) => s.trim());
          return { es, en, gramos: Number(gramos) };
        }),
        alias: alias.split(' · ').filter(Boolean).map((x) => {
          const m = x.match(/^(.+?)(\*)?(?: \(([A-Z ]+)\))?$/);
          return { texto: m[1].trim(), principal: Boolean(m[2]), regiones: m[3] ? m[3].split(' ') : [null] };
        }),
        detalles: leerDetalles(detalles, donde),
      });
    });
  }
  return curados;
}

const DETALLES = new Set(['crudo', 'desecho', 'ml', 'densidad', 'aceite', 'marca', 'ean', 'off', 'fibra', 'azucares', 'saturadas', 'sodio', 'alcohol']);
/** «crudo=Arroz blanco crudo · ml · marca=Conaprole»: cada detalle, con su valor o en true. */
function leerDetalles(texto, donde) {
  const d = {};
  for (const x of texto.split(' · ').map((s) => s.trim()).filter(Boolean)) {
    const corte = x.indexOf('=');
    const [clave, valor] = corte < 0 ? [x, true] : [x.slice(0, corte).trim(), x.slice(corte + 1).trim()];
    if (!DETALLES.has(clave)) throw new Error(`${donde}: no conozco el detalle «${clave}»`);
    d[clave] = valor;
  }
  return d;
}

/** El dígito de control de un EAN-13, EAN-8, UPC-A o GTIN-14. */
function codigoValido(codigo) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(codigo)) return false;
  const digitos = [...codigo].map(Number);
  const control = digitos.pop();
  const suma = digitos.reverse().reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (suma % 10)) % 10 === control;
}

// ------------------------------------------------------------ Armar
const alimentos = new Map();
const porciones = [];
const resumen = {};
for (const base of Object.keys(BASES)) {
  const { nutrientes, fuera } = BASES[base];
  const archivos = leerZip(await bajar(base, BASES[base].url, BASES[base].nombre));
  const categoriaDe = base === 'fndds' ? new Map(csv(archivos.get('survey_fndds_food.csv')).map((s) => [s.fdc_id, s.wweia_category_number])) : null;
  const valores = new Map();
  for (const n of csv(archivos.get('food_nutrient.csv'))) {
    const clave = nutrientes[n.nutrient_id];
    if (!clave) continue;
    const v = valores.get(n.fdc_id) ?? {};
    v[clave] = Number(n.amount);
    valores.set(n.fdc_id, v);
  }
  let marcas = 0;
  let afuera = 0;
  for (const f of csv(archivos.get('food.csv'))) {
    const categoria = base === 'fndds' ? categoriaDe.get(f.fdc_id) : f.food_category_id;
    const v = valores.get(f.fdc_id);
    if (fuera.has(categoria) || !v || v.kcal === undefined) {
      afuera++;
      continue;
    }
    // En SR Legacy las marcas van en mayúsculas (QUAKER, KRAFT): fuera, salvo la nota de USDA, el
    // BBQ y lo de «varias marcas», que es genérico.
    if (base === 'sr' && !/assorted brands/.test(f.description) && /\b(?!USDA|BBQ\b)[A-Z][A-Z'&.-]{2,}\b/.test(f.description.replace(/\(Includes foods for USDA's Food Distribution Program\)/, ''))) {
      marcas++;
      continue;
    }
    alimentos.set(Number(f.fdc_id), {
      id: Number(f.fdc_id), fuente: base, categoriaUsda: categoria,
      descripcion: f.description.replace(/\s*\(Includes foods for USDA's Food Distribution Program\)/, '').trim(),
      kcal: v.kcal, proteina: v.proteina ?? 0, carbohidratos: v.carbohidratos ?? 0, grasas: v.grasas ?? 0,
      fibra: v.fibra, azucares: v.azucares, saturadas: v.saturadas, sodio: v.sodio, alcohol: v.alcohol,
    });
  }
  const vistas = new Set();
  for (const p of csv(archivos.get('food_portion.csv')).sort((a, b) => Number(a.seq_num) - Number(b.seq_num))) {
    const id = Number(p.fdc_id);
    const gramos = Number(p.gram_weight);
    if (!alimentos.has(id) || !(gramos > 0)) continue;
    const en = porcionEnIngles(base, p);
    if (!en || vistas.has(`${id}|${en}|${gramos}`)) continue;
    vistas.add(`${id}|${en}|${gramos}`);
    porciones.push({ alimento: id, en, gramos });
  }
  resumen[base] = { alimentos: [...alimentos.values()].filter((a) => a.fuente === base).length, afuera, marcas };
}
const porAlimento = Map.groupBy(porciones, (p) => p.alimento);
const desechos = await desechosDeSr28();

// Los ids de lo que no es de USDA son negativos y no cambian nunca: propio#N es -N, receta#N es
// -(5000 + N) y producto#N es -(10000 + N).
const ID = { propio: (n) => (n >= 1 && n < 5000 ? -n : null), receta: (n) => (n >= 1 && n < 5000 ? -(5000 + n) : null), producto: (n) => (n >= 1 ? -(10000 + n) : null) };
const SECUNDARIOS = ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'];
const curados = leerCurados();
const porDescripcion = new Map();
for (const a of alimentos.values()) porDescripcion.set(`${a.fuente}:${a.descripcion}`, a);
const errores = [];
const alias = [];
const recetas = [];
const codigos = new Map();
const usados = new Map();
let deOff = 0;
for (const g of curados) {
  // Los platos van después: sus ingredientes tienen que estar curados.
  if (g.origen.startsWith('receta#')) {
    recetas.push(g);
    continue;
  }
  let alimento;
  const propio = g.origen.match(/^(propio|producto)#(\d+) ([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)$/);
  if (propio) {
    const [, tipo, n, kcal, proteina, carbohidratos, grasas] = propio;
    const id = ID[tipo](Number(n));
    if (id === null || alimentos.has(id)) {
      errores.push(`${g.donde}: ${tipo}#${n} ${id === null ? 'está fuera de rango' : `ya lo usa ${usados.get(id)}`}`);
      continue;
    }
    alimento = { id, fuente: tipo, descripcion: g.en, kcal: +kcal, proteina: +proteina, carbohidratos: +carbohidratos, grasas: +grasas };
    for (const k of SECUNDARIOS) if (g.detalles[k] !== undefined) alimento[k] = Number(g.detalles[k]);
    alimentos.set(id, alimento);
  } else alimento = porDescripcion.get(g.origen);
  if (!alimento) {
    errores.push(`${g.donde}: no existe «${g.origen}»`);
    continue;
  }
  if (alimento.es) {
    errores.push(`${g.donde}: «${g.origen}» ya está curado como «${alimento.es}» (${usados.get(alimento.id)})`);
    continue;
  }
  usados.set(alimento.id, g.donde);
  Object.assign(alimento, { es: g.es, en: g.en, categoria: g.categoria, propias: g.porciones, detalles: g.detalles, donde: g.donde });
  for (const a of g.alias) for (const region of a.regiones) alias.push({ alimento: alimento.id, texto: a.texto, region, principal: a.principal && region !== null });
}

// Los platos: los valores por 100 g de lo terminado salen de los ingredientes. De lo secundario, lo
// que un ingrediente no dice cuenta como cero; lo que no dice ninguno, no está. Un plato puede ser
// ingrediente de otro que venga después.
const porEspanol = new Map([...alimentos.values()].filter((a) => a.es).map((a) => [a.es, a]));
const ingredientes = [];
const pesosFinales = [];
for (const g of recetas) {
  const m = g.origen.match(/^receta#(\d+) (.+?)(?: → ([\d.]+))?$/);
  const id = m ? ID.receta(Number(m[1])) : null;
  if (!m || id === null || alimentos.has(id)) {
    errores.push(`${g.donde}: ${!m ? 'la receta no se entiende' : id === null ? 'el número está fuera de rango' : `receta#${m[1]} ya la usa ${usados.get(id)}`}`);
    continue;
  }
  const lista = m[2].split(' · ').map((x) => {
    const corte = x.lastIndexOf(' ');
    return { nombre: x.slice(0, corte).trim(), gramos: Number(x.slice(corte + 1)) };
  });
  const malos = lista.filter((i) => !porEspanol.has(i.nombre) || !(i.gramos > 0));
  if (malos.length) {
    errores.push(`${g.donde}: no conozco ${malos.map((i) => `«${i.nombre}»`).join(', ')}`);
    continue;
  }
  const peso = m[3] ? Number(m[3]) : lista.reduce((s, i) => s + i.gramos, 0);
  const valores = {};
  for (const clave of ['kcal', 'proteina', 'carbohidratos', 'grasas', ...SECUNDARIOS]) {
    const conDato = lista.filter((i) => porEspanol.get(i.nombre)[clave] != null);
    if (!conDato.length && SECUNDARIOS.includes(clave)) continue;
    valores[clave] = conDato.reduce((s, i) => s + porEspanol.get(i.nombre)[clave] * i.gramos, 0) / peso;
  }
  if (porEspanol.has(g.es)) {
    errores.push(`${g.donde}: «${g.es}» ya es otro alimento (${usados.get(porEspanol.get(g.es).id)})`);
    continue;
  }
  const plato = { id, fuente: 'receta', descripcion: g.en, ...valores, es: g.es, en: g.en, categoria: g.categoria, propias: g.porciones, detalles: g.detalles, donde: g.donde };
  alimentos.set(id, plato);
  porEspanol.set(g.es, plato);
  usados.set(id, g.donde);
  for (const i of lista) ingredientes.push([id, porEspanol.get(i.nombre).id, i.gramos]);
  pesosFinales.push([id, peso]);
  for (const a of g.alias) for (const region of a.regiones) alias.push({ alimento: id, texto: a.texto, region, principal: a.principal && region !== null });
}

// Los detalles de cómo se mide (spec/nutricion.md, «Cómo se miden los alimentos»).
const TAZA_ML = 236.588;
const ONZA_ML = 29.5735;
for (const a of alimentos.values()) {
  const d = a.detalles;
  if (!d) continue;
  const donde = a.donde;
  if (d.crudo) {
    const crudo = porEspanol.get(d.crudo);
    if (!crudo) errores.push(`${donde}: no conozco la versión cruda «${d.crudo}»`);
    else if (crudo.detalles?.crudo) errores.push(`${donde}: «${d.crudo}» es cocido: la versión cruda no puede tener a su vez una cruda`);
    else if (crudo.id === a.id) errores.push(`${donde}: un alimento no es su propia versión cruda`);
    else a.crudo = crudo.id;
  }
  if (d.desecho) {
    const sr = a.fuente === 'sr' ? desechos.get(a.descripcion) : null;
    const m = d.desecho === true ? null : String(d.desecho).match(/^([\d.]+)(?:\s+(.+?))?$/);
    if (d.desecho !== true && !m) errores.push(`${donde}: el desecho se escribe «desecho», «desecho=36» o «desecho=36 cáscara»`);
    const fraccion = m ? Number(m[1]) / 100 : sr?.fraccion;
    let que = null;
    if (m?.[2]) {
      const [es, en] = m[2].split('/').map((x) => x.trim());
      que = { es, en: en ?? es.split(' y ').map((x) => enIngles(x, a.categoria)).join(' and ') };
      if (/undefined/.test(que.en)) errores.push(`${donde}: «${es}» no lo sé decir en inglés: «desecho=${m[1]} ${es}/…»`);
    } else if (sr) que = queSeDesecha(sr.que);
    if (!(fraccion > 0 && fraccion < 0.9)) errores.push(`${donde}: ${sr || m ? `el desecho (${fraccion}) no es posible` : 'USDA no dice qué parte no se come: «desecho=N qué»'}`);
    else if (!que) errores.push(`${donde}: no sé qué es lo que no se come («${sr?.que}»): «desecho=${Math.round(fraccion * 100)} qué»`);
    else Object.assign(a, { desecho: fraccion, queDesecho: que });
  }
  if (d.ml || d.densidad) {
    let densidad = d.densidad && d.densidad !== true ? Number(d.densidad) : null;
    if (!densidad) {
      // Primero lo medido por USDA: la taza o la onza líquida. Si no hay, una porción que dice sus ml
      // («1 vaso (200 ml)»), y al final una taza propia. Antes una taza propia de «(240 ml)» se tomaba
      // como una de USDA, de 236,6 ml.
      const deUsda = porAlimento.get(a.id) ?? [];
      const propias = (a.propias ?? []).map((p) => ({ en: p.en ?? '', es: p.es, gramos: p.gramos }));
      const mlDe = (p) => `${p.en} ${p.es ?? ''}`.match(/\((\d+(?:[.,]\d+)?)\s*ml\)/i);
      const taza = (lista) => lista.find((p) => /^1 cup\b/i.test(p.en) && !mlDe(p));
      const onza = deUsda.find((p) => /^1 fl oz\b/i.test(p.en));
      const conMl = [...deUsda, ...propias].find((p) => mlDe(p));
      const tazaDeUsda = taza(deUsda);
      const tazaPropia = taza(propias);
      densidad = tazaDeUsda ? tazaDeUsda.gramos / TAZA_ML
        : onza ? onza.gramos / ONZA_ML
          : conMl ? conMl.gramos / Number(mlDe(conMl)[1].replace(',', '.'))
            : tazaPropia ? tazaPropia.gramos / TAZA_ML : null;
    }
    if (!(densidad >= 0.3 && densidad <= 2)) errores.push(`${donde}: ${densidad ? `la densidad (${densidad}) no es posible` : 'no hay una taza ni una onza líquida para sacar la densidad: «densidad=…»'}`);
    else a.densidad = Math.round(densidad * 1000) / 1000;
  }
  if (d.aceite) {
    if (d.aceite !== true && d.aceite !== 'incluido') errores.push(`${donde}: el aceite es «aceite» (se pregunta) o «aceite=incluido» (frito)`);
    a.aceite = d.aceite === true ? 'preguntar' : 'incluido';
  }
  if (d.marca) a.marca = String(d.marca);
  if (d.ean) {
    for (const codigo of String(d.ean).split(',').map((c) => c.trim())) {
      if (!codigoValido(codigo)) errores.push(`${donde}: el código ${codigo} no es un EAN o UPC válido`);
      else if (codigos.has(codigo)) errores.push(`${donde}: el código ${codigo} ya es de ${usados.get(codigos.get(codigo))}`);
      else codigos.set(codigo, a.id);
    }
  }
  if (d.off) {
    a.atribucion = 'off';
    deOff++;
  }
}
if (errores.length) {
  console.error(errores.join('\n'));
  process.exit(1);
}

const salida = process.env.SALIDA ? join(raiz, process.env.SALIDA) : join(raiz, 'assets/alimentos.db');
rmSync(salida, { force: true });
mkdirSync(dirname(salida), { recursive: true });
const db = new DatabaseSync(salida);
db.exec(`
  PRAGMA page_size = 4096;
  PRAGMA user_version = ${ESQUEMA};
  -- Un alimento por fila, con los valores por 100 g de lo que se come. Los de USDA llevan su fdc_id; los demás, ids negativos.
  CREATE TABLE alimentos (
    id INTEGER PRIMARY KEY,
    fuente TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nombre_es TEXT,
    nombre_en TEXT,
    categoria TEXT,
    kcal REAL NOT NULL,
    proteina REAL NOT NULL,
    carbohidratos REAL NOT NULL,
    grasas REAL NOT NULL,
    -- Lo secundario: lo que no se sabe queda en null (no es cero). El sodio, en mg.
    fibra REAL,
    azucares REAL,
    saturadas REAL,
    sodio REAL,
    alcohol REAL,
    porcion INTEGER,
    -- Cómo se mide: la marca de un producto; lo que se toma, en g por ml; la parte que no se come y
    -- qué es; si se pregunta por el aceite ('preguntar') o ya lo tiene ('incluido'); en lo cocido,
    -- su versión cruda; y de dónde salen los datos, si hay que nombrarlo ('off': Open Food Facts).
    marca TEXT,
    densidad REAL,
    desecho REAL,
    desecho_es TEXT,
    desecho_en TEXT,
    aceite TEXT,
    crudo INTEGER,
    atribucion TEXT
  );
  CREATE INDEX alimentos_por_crudo ON alimentos (crudo) WHERE crudo IS NOT NULL;
  -- La porción es un peso: «1 pechuga» son 145 g. Sin traducción, 'es' es null.
  CREATE TABLE porciones (id INTEGER PRIMARY KEY, alimento INTEGER NOT NULL, en TEXT NOT NULL, es TEXT, gramos REAL NOT NULL);
  CREATE INDEX porciones_por_alimento ON porciones (alimento);
  -- Los nombres de cada región. 'principal' es el que se muestra ahí (palta en Uruguay, aguacate en México).
  CREATE TABLE alias (alimento INTEGER NOT NULL, texto TEXT NOT NULL, region TEXT, principal INTEGER NOT NULL);
  CREATE INDEX alias_por_alimento ON alias (alimento);
  -- Los códigos de barras de los productos.
  CREATE TABLE codigos (codigo TEXT PRIMARY KEY, alimento INTEGER NOT NULL) WITHOUT ROWID;
  -- Todo lo que se busca, un texto por fila, y sus dos índices: palabras con prefijos y trigramas.
  CREATE TABLE textos (id INTEGER PRIMARY KEY, alimento INTEGER NOT NULL, idioma TEXT NOT NULL, region TEXT, principal INTEGER NOT NULL, texto TEXT NOT NULL);
  CREATE VIRTUAL TABLE palabras USING fts5(texto, content = 'textos', content_rowid = 'id', tokenize = 'unicode61 remove_diacritics 2', prefix = '2 3');
  CREATE VIRTUAL TABLE trigramas USING fts5(texto, content = 'textos', content_rowid = 'id', tokenize = 'trigram remove_diacritics 1');
  CREATE TABLE datos (clave TEXT PRIMARY KEY, valor TEXT NOT NULL);
  -- Los platos que son recetas: lo que pesan terminados y sus ingredientes, para mostrar de dónde salen sus valores.
  CREATE TABLE recetas (plato INTEGER PRIMARY KEY, peso_final REAL NOT NULL);
  CREATE TABLE ingredientes (plato INTEGER NOT NULL, ingrediente INTEGER NOT NULL, gramos REAL NOT NULL);
`);
db.exec('BEGIN');
const ponerAlimento = db.prepare('INSERT INTO alimentos VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const ponerPorcion = db.prepare('INSERT INTO porciones (alimento, en, es, gramos) VALUES (?, ?, ?, ?)');
const ponerAlias = db.prepare('INSERT INTO alias VALUES (?, ?, ?, ?)');
const ponerTexto = db.prepare('INSERT INTO textos (alimento, idioma, region, principal, texto) VALUES (?, ?, ?, ?, ?)');
const redondo = (n) => Math.round(n * 100) / 100;
let sinTraducir = 0;
const textosSinTraducir = new Map();
for (const a of [...alimentos.values()].sort((x, y) => x.id - y.id)) {
  const tal = (n) => (n === undefined ? null : redondo(n));
  ponerAlimento.run(
    a.id, a.fuente, a.descripcion, a.es ?? null, a.en ?? null, a.categoria ?? null, redondo(a.kcal), redondo(a.proteina), redondo(a.carbohidratos), redondo(a.grasas),
    tal(a.fibra), tal(a.azucares), tal(a.saturadas), tal(a.sodio), tal(a.alcohol), null,
    a.marca ?? null, a.densidad ?? null, a.desecho ?? null, a.queDesecho?.es ?? null, a.queDesecho?.en ?? null, a.aceite ?? null, a.crudo ?? null, a.atribucion ?? null,
  );
  // De los curados: primero sus porciones (la primera es la de siempre); de USDA, solo las que
  // tienen traducción. Una porción propia sin inglés toma el de la de USDA que pesa lo mismo.
  const deUsda = porAlimento.get(a.id) ?? [];
  const lista = (a.propias ?? []).map((p) => ({ en: p.en ?? deUsda.find((u) => u.gramos === p.gramos)?.en ?? 'Serving', es: p.es, gramos: p.gramos }));
  for (const p of deUsda) {
    const es = porcionEnEspanol(p.en);
    if (a.es && !es) {
      sinTraducir++;
      const forma = p.en.replace(/^[\d½¼¾⅓⅔⅛/.,-]+\s*/, '# ');
      textosSinTraducir.set(forma, (textosSinTraducir.get(forma) ?? 0) + 1);
      continue;
    }
    // USDA repite porciones casi iguales («1 cucharada» de 14 y de 14,2 g): queda la primera.
    if (lista.some((x) => x.gramos === p.gramos || (es ? x.es === es : x.en === p.en))) continue;
    lista.push({ en: p.en, es, gramos: p.gramos });
  }
  let primera = null;
  for (const p of lista) {
    const { lastInsertRowid } = ponerPorcion.run(a.id, p.en, p.es, p.gramos);
    primera ??= Number(lastInsertRowid);
  }
  if (primera) db.prepare('UPDATE alimentos SET porcion = ? WHERE id = ?').run(primera, a.id);
  ponerTexto.run(a.id, 'en', null, 0, a.descripcion);
  if (a.en && a.en !== a.descripcion) ponerTexto.run(a.id, 'en', null, 0, a.en);
  if (a.es) ponerTexto.run(a.id, 'es', null, 0, a.es);
  // Un producto se encuentra también por su marca: «leche conaprole».
  if (a.marca) {
    ponerTexto.run(a.id, 'es', null, 0, `${a.es} ${a.marca}`);
    ponerTexto.run(a.id, 'en', null, 0, `${a.en} ${a.marca}`);
  }
}
for (const a of alias) {
  ponerAlias.run(a.alimento, a.texto, a.region, a.principal ? 1 : 0);
  ponerTexto.run(a.alimento, 'es', a.region, a.principal ? 1 : 0, a.texto);
}
for (const [codigo, alimento] of codigos) db.prepare('INSERT INTO codigos VALUES (?, ?)').run(codigo, alimento);
for (const [plato, peso] of pesosFinales) db.prepare('INSERT INTO recetas VALUES (?, ?)').run(plato, peso);
for (const [plato, ingrediente, gramos] of ingredientes) db.prepare('INSERT INTO ingredientes VALUES (?, ?, ?)').run(plato, ingrediente, gramos);
const fuentes = [`USDA FoodData Central: ${BASES.fndds.nombre} y ${BASES.sr.nombre} (dominio público)`];
if (deOff) fuentes.push('Open Food Facts (ODbL, openfoodfacts.org)');
db.prepare('INSERT INTO datos VALUES (?, ?)').run('fuentes', fuentes.join('; '));
db.prepare('INSERT INTO datos VALUES (?, ?)').run('armada', new Date().toISOString().slice(0, 10));
db.exec('COMMIT');
db.exec(`INSERT INTO palabras (palabras) VALUES ('rebuild'); INSERT INTO trigramas (trigramas) VALUES ('rebuild');`);
db.exec(`INSERT INTO palabras (palabras) VALUES ('optimize'); INSERT INTO trigramas (trigramas) VALUES ('optimize'); VACUUM;`);
db.close();
// La versión que ve el teléfono: con una base nueva, la copia otra vez (src/comida/base.ts).
if (!process.env.SALIDA) {
  const version = createHash('sha1').update(readFileSync(salida)).digest('hex').slice(0, 10);
  const aviso = '// La escribe `npm run alimentos`: cambia con cada base nueva, así el teléfono la copia otra vez.';
  writeFileSync(join(raiz, 'src/comida/version-de-la-base.ts'), `${aviso}\nexport const VERSION_DE_LA_BASE = '${version}';\n`);
}

const cuantos = (f) => [...alimentos.values()].filter(f).length;
console.log(`FNDDS: ${resumen.fndds.alimentos} alimentos (${resumen.fndds.afuera} afuera)`);
console.log(`SR Legacy: ${resumen.sr.alimentos} alimentos (${resumen.sr.afuera} afuera y ${resumen.sr.marcas} de marcas)`);
console.log(`Curados: ${curados.length}, con ${alias.length} alias: ${recetas.length} platos como recetas, ${cuantos((a) => a.fuente === 'producto')} productos (${deOff} de Open Food Facts) y ${codigos.size} códigos de barras.`);
console.log(`Cómo se miden: ${cuantos((a) => a.crudo)} cocidos con su versión cruda, ${cuantos((a) => a.desecho)} con parte que no se come, ${cuantos((a) => a.densidad)} líquidos y ${cuantos((a) => a.aceite === 'preguntar')} que preguntan por el aceite.`);
console.log(`Porciones de USDA sin traducir en los curados: ${sinTraducir}.`);
console.log(`${salida.replace(raiz, '').slice(1)}: ${(statSync(salida).size / 1048576).toFixed(1)} MB`);
// Para ampliar la tabla de traducción: VER_PORCIONES=1 npm run alimentos
if (process.env.VER_PORCIONES) {
  console.log([...textosSinTraducir].sort((a, b) => b[1] - a[1]).slice(0, 80).map(([t, n]) => `${n} ${t}`).join(' | '));
}
