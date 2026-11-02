// Baja la exportación de Open Food Facts (lo que ellos piden usar para traer mucho, en vez de su API) y se
// queda con lo que tiene a Uruguay o a Argentina entre sus países, con solo las columnas que usa
// herramientas/marcas.mjs. El archivo pesa más de 1 GB: se procesa mientras llega y no se guarda entero.
// Queda en .cache/off/marcas.tsv. Tarda según la conexión: unos minutos.
// Uso: node herramientas/bajar-marcas.mjs

import { createWriteStream, mkdirSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createGunzip } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const URL_EXPORTACION = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';
const COLUMNAS = ['code', 'last_modified_t', 'product_name', 'generic_name', 'quantity', 'brands', 'brands_tags', 'categories_tags', 'countries_tags', 'serving_size', 'serving_quantity', 'product_quantity',
  'unique_scans_n', 'energy-kcal_100g', 'energy_100g', 'fat_100g', 'saturated-fat_100g', 'carbohydrates_100g', 'sugars_100g', 'fiber_100g', 'proteins_100g', 'sodium_100g', 'alcohol_100g'];
const PAISES = /en:(uruguay|argentina)\b/;

mkdirSync(join(raiz, '.cache/off'), { recursive: true });
const final = join(raiz, '.cache/off/marcas.tsv');
const salida = createWriteStream(`${final}.parcial`);
salida.write(`${COLUMNAS.join('\t')}\n`);

const respuesta = await fetch(URL_EXPORTACION, { headers: { 'User-Agent': 'Moss/1.1 (https://condezuzu.github.io/moss-app/)' } });
if (!respuesta.ok) throw new Error(`Open Food Facts respondió ${respuesta.status}`);

let indices = null;
let resto = '';
let leidas = 0;
let guardadas = 0;
const paisesEn = () => indices.countries_tags;

function linea(texto) {
  if (!indices) {
    const cabecera = texto.split('\t');
    indices = Object.fromEntries(COLUMNAS.map((c) => [c, cabecera.indexOf(c)]));
    const faltan = COLUMNAS.filter((c) => indices[c] < 0);
    if (faltan.length) console.log(`Columnas que no están: ${faltan.join(', ')}`);
    return;
  }
  leidas++;
  if (!texto.includes('en:uruguay') && !texto.includes('en:argentina')) return;
  const campos = texto.split('\t');
  if (!PAISES.test(campos[paisesEn()] ?? '')) return;
  salida.write(`${COLUMNAS.map((c) => (indices[c] < 0 ? '' : (campos[indices[c]] ?? ''))).join('\t')}\n`);
  guardadas++;
  if (guardadas % 2000 === 0) console.log(`${leidas} leídas, ${guardadas} guardadas`);
}

const descomprimido = Readable.fromWeb(respuesta.body).pipe(createGunzip());
descomprimido.setEncoding('utf8');
for await (const trozo of descomprimido) {
  const partes = (resto + trozo).split('\n');
  resto = partes.pop();
  for (const p of partes) linea(p);
}
if (resto) linea(resto);
await new Promise((listo) => salida.end(listo));
renameSync(`${final}.parcial`, final);
console.log(`Listo: ${leidas} productos leídos, ${guardadas} de Uruguay o Argentina, en .cache/off/marcas.tsv`);
