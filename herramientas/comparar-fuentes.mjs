// Compara cada alimento curado de assets/alimentos.db con una segunda fuente oficial (USDA es la
// primera) y escribe alimentos/verificacion.txt: con qué se comparó, los valores de la otra tabla,
// la diferencia y si coincide. Las fuentes, sus licencias y las reglas están en spec/fuentes.md.
// - Las segundas fuentes: TACO (Brasil), Ciqual (Francia) y CoFID (Reino Unido). Se bajan a
//   .cache/fuentes/<fuente>/ la primera vez, de su sitio oficial. Lo que esas tablas copian de USDA
//   no cuenta.
// - Cada curado (lo que tiene nombre en español, menos los productos) se empareja con su mejor par
//   (herramientas/fuentes/emparejar.mjs), salvo que herramientas/fuentes/pares.txt diga otro, o
//   «sin par». Los platos que son recetas se comparan, con sus valores calculados, con un plato
//   parecido si alguna tabla lo tiene.
// - Se comparan las kcal, la proteína, los carbohidratos (totales, como los de USDA: con la fibra)
//   y las grasas. Coincide («ok») si ninguno se aleja más de un 10 % del nuestro, o de 2 g cuando
//   son menos de 20 g, o de 10 kcal cuando son menos de 100. Si no, «revisar», hasta que pares.txt
//   diga por qué la diferencia es real: «revisado: motivo».
// - Es determinista: la fecha de cada línea es la del día en que su resultado apareció por primera
//   vez, y se conserva mientras no cambie.
// Uso: npm run alimentos:comparar
//      node herramientas/comparar-fuentes.mjs [--taco x.xlsx] [--cofid x.xlsx] [--ciqual carpeta] [--candidatos archivo.txt]
//      (--candidatos escribe, para revisar, los tres mejores de cada fuente para cada curado)

import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { CIQUAL, leerCiqual } from './fuentes/ciqual.mjs';
import { COFID, leerCofid } from './fuentes/cofid.mjs';
import { indice, MARCAS, palabrasEn, palabrasPt, tiposDeCategoria, tiposDeFuente } from './fuentes/emparejar.mjs';
import { leerTaco, TACO } from './fuentes/taco.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const cache = join(raiz, '.cache/fuentes');
const salida = join(raiz, 'alimentos/verificacion.txt');
const hoy = new Date().toLocaleDateString('sv');

const args = process.argv.slice(2);
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`);
  return i >= 0 ? args[i + 1] : null;
};

// ------------------------------------------------------------ Las fuentes
/** Un archivo de una fuente: el que se pasó, o el de .cache/fuentes (que se baja si no está). */
async function archivo(fuente, nombre, url) {
  const ruta = join(cache, fuente, nombre);
  if (existsSync(ruta)) return ruta;
  mkdirSync(dirname(ruta), { recursive: true });
  console.log(`Bajando ${nombre}…`);
  const respuesta = await fetch(url, { headers: { 'User-Agent': 'Moss (herramientas/comparar-fuentes.mjs)' } });
  if (!respuesta.ok) throw new Error(`${url}: ${respuesta.status}`);
  writeFileSync(ruta, Buffer.from(await respuesta.arrayBuffer()));
  return ruta;
}

const taco = leerTaco(opcion('taco') ?? await archivo('taco', TACO.archivo, TACO.url));
const cofid = leerCofid(opcion('cofid') ?? await archivo('cofid', COFID.archivo, COFID.url));
const carpetaCiqual = opcion('ciqual');
const deCiqual = async (clave) => (carpetaCiqual ? join(carpetaCiqual, CIQUAL.archivos[clave].archivo) : archivo('ciqual', CIQUAL.archivos[clave].archivo, CIQUAL.archivos[clave].url));
const ciqual = leerCiqual(await deCiqual('alim'), await deCiqual('compo'), await deCiqual('sources'), await deCiqual('grupos'));

const todas = [...taco, ...ciqual, ...cofid];
const porCodigo = new Map(todas.map((a) => [`${a.fuente}:${a.codigo}`, a]));
// Sirve para comparar lo que no copia a USDA, no es comida de bebé (que Moss no registra) y tiene la
// proteína, las grasas y los carbohidratos o las kcal.
const sirve = (a) => !a.deUsda && !String(a.subgrupo).startsWith('11') && a.proteina != null && a.grasas != null && (a.carbohidratosTotales != null || a.kcal != null);
const candidatos = todas.filter(sirve).map((a) => ({
  ...a,
  palabras: a.fuente === 'taco' ? palabrasPt(a.descripcion) : palabrasEn(a.ingles ?? a.descripcion),
  tipos: tiposDeFuente(a),
}));
const buscar = indice(candidatos);

// ------------------------------------------------------------ Los curados
const db = new DatabaseSync(join(raiz, 'assets/alimentos.db'), { readOnly: true });
const curados = db.prepare(`SELECT id, fuente, descripcion, nombre_es, nombre_en, categoria, kcal, proteina, carbohidratos, grasas
  FROM alimentos WHERE nombre_es IS NOT NULL AND fuente <> 'producto'`).all()
  .sort((a, b) => (a.categoria ?? '').localeCompare(b.categoria ?? '') || a.nombre_es.localeCompare(b.nombre_es, 'es'));
db.close();

// ------------------------------------------------------------ Lo que se decidió a mano
// herramientas/fuentes/pares.txt: «nombre en español | fuente:código» (o «sin par»), y, si la
// diferencia se revisó y es real, «| revisado: motivo (la diferencia que se revisó)».
const pares = new Map();
const errores = [];
const avisos = [];
const nombres = new Set(curados.map((c) => c.nombre_es));
readFileSync(join(raiz, 'herramientas/fuentes/pares.txt'), 'utf8').split(/\r?\n/).forEach((linea, i) => {
  if (!linea.trim() || linea.startsWith('//')) return;
  const [nombre, par = '', nota = ''] = linea.split('|').map((c) => c.trim());
  const donde = `pares.txt:${i + 1}`;
  // Un curado que se renombró o se sacó no frena la verificación: solo avisa.
  if (!nombres.has(nombre)) avisos.push(`${donde}: no hay un curado «${nombre}» (se ignora)`);
  else if (pares.has(nombre)) errores.push(`${donde}: «${nombre}» ya tiene par`);
  else if (par !== 'sin par' && !porCodigo.has(par)) errores.push(`${donde}: no existe ${par}`);
  else if (par !== 'sin par' && !sirve(porCodigo.get(par))) errores.push(`${donde}: ${par} copia a USDA o le faltan valores`);
  else if (nota && !/^revisado: .+ \(\d+ % (kcal|P|C|G)\)$/.test(nota) && par !== 'sin par') errores.push(`${donde}: la nota es «revisado: motivo (N % kcal|P|C|G)»`);
  else pares.set(nombre, { par, nota });
});
if (errores.length) {
  console.error(errores.join('\n'));
  process.exit(1);
}

// ------------------------------------------------------------ Emparejar
/**
 * Lo que se busca de un curado: las palabras de su nombre en inglés (valen 1) y las de la
 * descripción de USDA (valen 0,7), la palabra principal de su nombre en inglés, que tiene que estar
 * («Coffee with milk» → coffee; «Raw 85% lean ground beef» → beef), y los tipos de su categoría.
 */
function consulta(c) {
  const palabras = new Map(palabrasEn(c.descripcion).map((p) => [p, 0.7]));
  for (const p of palabrasEn(c.nombre_en ?? '')) palabras.set(p, 1);
  const cabeza = (c.nombre_en ?? '').replace(/\(.*?\)/g, ' ').split(/\b(?:with|and|in|on|without)\b|,/)[0];
  const principal = palabrasEn(cabeza).filter((p) => !MARCAS.has(p) && !/^\d/.test(p)).at(-1);
  return { palabras, nucleo: principal ? [principal] : [], tipos: tiposDeCategoria(c.categoria) };
}

// Si dos fuentes empatan, la regional primero.
const ORDEN = { taco: 0, ciqual: 1, cofid: 2 };
const PUNTAJE_MINIMO = 0.3;

/** El par de un curado: el de pares.txt, o el mejor de las tres fuentes si se parece lo bastante. */
function emparejar(c, mejores) {
  const manual = pares.get(c.nombre_es);
  if (manual) return manual.par === 'sin par' ? null : porCodigo.get(manual.par);
  const primeros = [...mejores.values()].map((l) => l[0]).filter(Boolean)
    .sort((a, b) => b.puntaje - a.puntaje || ORDEN[a.c.fuente] - ORDEN[b.c.fuente]);
  const [mejor] = primeros;
  if (!mejor || mejor.puntaje < PUNTAJE_MINIMO) return null;
  // Entre los que casi empatan con el mejor, el de la fuente regional.
  return primeros.filter((x) => x.puntaje >= mejor.puntaje - 0.03).sort((a, b) => ORDEN[a.c.fuente] - ORDEN[b.c.fuente])[0].c;
}

// ------------------------------------------------------------ Comparar
const COMPONENTES = [['kcal', 'kcal', 100], ['proteina', 'P', 20], ['carbohidratos', 'C', 20], ['grasas', 'G', 20]];
const valorDe = (a, k) => (k === 'carbohidratos' ? a.carbohidratosTotales : a[k]);

/** La mayor diferencia, en % del nuestro (o del piso, cuando el nuestro es chico), y en qué. */
function diferencia(c, s) {
  let peor = { porciento: 0, que: 'kcal' };
  for (const [k, letra, piso] of COMPONENTES) {
    const suyo = valorDe(s, k);
    if (suyo == null) continue;
    const porciento = Math.round((Math.abs(suyo - c[k]) / Math.max(c[k], piso)) * 100);
    if (porciento > peor.porciento) peor = { porciento, que: letra };
  }
  return peor;
}

const numero = (n, decimales) => (n == null ? '-' : String(Math.round(n * 10 ** decimales) / 10 ** decimales));
const valores = (s) => [numero(s.kcal, 0), ...['proteina', 'carbohidratos', 'grasas'].map((k) => numero(valorDe(s, k), 1))].join(' ');

// Lo que ya estaba: la fecha de cada línea se conserva mientras su resultado no cambie.
const antes = new Map();
if (existsSync(salida)) {
  for (const linea of readFileSync(salida, 'utf8').split(/\r?\n/)) {
    if (!linea.trim() || linea.startsWith('//')) continue;
    const campos = linea.split('|').map((x) => x.trim());
    antes.set(campos[0], { resultado: campos.slice(1, 5).join(' | '), fecha: campos[5] });
  }
}

const lineas = [];
const cuenta = { ok: 0, revisado: 0, revisar: 0, 'sin par': 0 };
const paraRevisar = [];
for (const c of curados) {
  const mejores = buscar(consulta(c));
  const s = emparejar(c, mejores);
  let campos;
  if (!s) {
    campos = ['sin par', '-', '-', 'sin par'];
    cuenta['sin par']++;
  } else {
    const { porciento, que } = diferencia(c, s);
    const dif = `${porciento} % ${que}`;
    const nota = pares.get(c.nombre_es)?.nota;
    let estado = porciento <= 10 ? 'ok' : 'revisar';
    if (estado === 'revisar' && nota) {
      if (nota.endsWith(`(${dif})`)) estado = nota;
      else avisos.push(`${c.nombre_es}: la revisión era para otra diferencia (${nota}); ahora es ${dif}`);
    }
    if (estado === 'revisar') paraRevisar.push({ c, s, dif });
    cuenta[estado.startsWith('revisado') ? 'revisado' : estado]++;
    campos = [`${s.fuente}:${s.codigo} ${s.descripcion.replace(/\|/g, '/')}`, valores(s), dif, estado];
  }
  const resultado = campos.join(' | ');
  const previo = antes.get(c.nombre_es);
  lineas.push(`${c.nombre_es} | ${resultado} | ${previo?.resultado === resultado ? previo.fecha : hoy}`);
}

const cabecera = [
  '// La verificación de los curados contra una segunda fuente oficial (USDA es la primera). La arma',
  '// `npm run alimentos:comparar` (herramientas/comparar-fuentes.mjs): no se edita a mano. Los pares y las',
  '// revisiones a mano van en herramientas/fuentes/pares.txt; las fuentes y las reglas, en spec/fuentes.md.',
  '// Cada línea: nombre en español | fuente:código y descripción en la segunda fuente | sus kcal, proteína,',
  '// carbohidratos y grasas por 100 g (los carbohidratos, totales: con la fibra, como USDA) | la diferencia',
  '// más grande con los nuestros, en % del nuestro, y en qué | estado | fecha.',
  '// Estado: «ok» si nada se aleja más de un 10 % (o de 2 g si son menos de 20 g, o de 10 kcal si son menos',
  '// de 100); «revisado: motivo» si se aleja pero la diferencia es real; «revisar»; o «sin par».',
];
writeFileSync(salida, `${[...cabecera, ...lineas].join('\n')}\n`);

console.log(`Segundas fuentes: TACO ${taco.length} alimentos, Ciqual ${ciqual.length} (${ciqual.filter((a) => a.deUsda).length} copian a USDA), CoFID ${cofid.length} (${cofid.filter((a) => a.deUsda).length} copian a USDA).`);
console.log(`${curados.length} curados: ${cuenta.ok} ok, ${cuenta.revisado} revisados, ${cuenta.revisar} para revisar y ${cuenta['sin par']} sin par.`);
const porFuente = Object.groupBy(lineas.filter((l) => !l.includes('| sin par |')), (l) => l.split('|')[1].trim().split(':')[0]);
console.log(`Comparados con: ${Object.entries(porFuente).map(([f, l]) => `${f} ${l.length}`).join(', ')}.`);
if (avisos.length) console.log(avisos.join('\n'));
if (paraRevisar.length) {
  console.log('Para revisar (nuestro → el de la segunda fuente):');
  for (const { c, s, dif } of paraRevisar.slice(0, 40)) {
    console.log(`  ${c.nombre_es} (${dif}): ${valores({ ...c, carbohidratosTotales: c.carbohidratos })} → ${valores(s)} ${s.fuente}:${s.codigo} ${s.descripcion}`);
  }
  if (paraRevisar.length > 40) console.log(`  … y ${paraRevisar.length - 40} más (en alimentos/verificacion.txt)`);
}

// Para revisar los pares: los tres mejores de cada fuente para cada curado.
const rutaCandidatos = opcion('candidatos');
if (rutaCandidatos) {
  const texto = [];
  for (const c of curados) {
    const elegido = emparejar(c, buscar(consulta(c)));
    texto.push(`\n## ${c.nombre_es} | ${c.fuente}:${c.descripcion} | ${valores({ ...c, carbohidratosTotales: c.carbohidratos })}${pares.has(c.nombre_es) ? ' | (a mano)' : ''}`);
    for (const [fuente, lista] of [...buscar(consulta(c))].sort((a, b) => ORDEN[a[0]] - ORDEN[b[0]])) {
      for (const { c: s, puntaje } of lista) {
        const { porciento, que } = diferencia(c, s);
        texto.push(`${s === elegido ? '→' : ' '} ${puntaje.toFixed(2)} ${fuente}:${s.codigo} ${s.ingles && s.fuente === 'ciqual' ? s.ingles : s.descripcion} | ${valores(s)} | ${porciento} % ${que}`);
      }
    }
  }
  writeFileSync(rutaCandidatos, `${texto.join('\n')}\n`);
}

