// Baja la exportación de Open Food Facts (lo que ellos piden usar para traer mucho, en vez de su API) y se
// queda con lo que usa herramientas/marcas.mjs, con solo sus columnas. El archivo pesa más de 1 GB: se
// procesa mientras llega y no se guarda entero.
// - .cache/off/marcas.tsv: lo que tiene a Uruguay o a Argentina entre sus países, y lo que tiene un código
//   de GS1 Uruguay (773) aunque esté cargado con otro país.
// - .cache/off/marcas-region.tsv: de otros países de la región, las marcas globales que acá se venden y que
//   nadie cargó con Uruguay ni Argentina (Kellogg's, por ejemplo). marcas.mjs las marca como aproximadas.
// Tarda según la conexión: unos minutos.
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
// El prefijo 773 es de GS1 Uruguay: hecho acá aunque Open Food Facts le ponga otro país (2/11/2026).
const DE_URUGUAY = /^773\d{10}$/;
const REGION = /en:(mexico|chile|colombia|peru|ecuador|paraguay|bolivia|costa-rica|spain|brazil)\b/;
const GLOBALES = /kellogg|nesquik|nesquick|\boreo\b|pringles|\blay'?s\b|doritos|cheetos|ruffles|coca.?cola|pepsi|sprite|fanta|schweppes|red.?bull|monster|snickers|m&m|kit.?kat|milka|nutella|kinder|toblerone|ferrero|quaker|gatorade|powerade|nescaf|maggi|knorr|hellmann|heinz|danone|activia|cadbury|lacta|garoto/i;

mkdirSync(join(raiz, '.cache/off'), { recursive: true });
const final = join(raiz, '.cache/off/marcas.tsv');
const finalRegion = join(raiz, '.cache/off/marcas-region.tsv');
const salida = createWriteStream(`${final}.parcial`);
const salidaRegion = createWriteStream(`${finalRegion}.parcial`);
salida.write(`${COLUMNAS.join('\t')}\n`);
salidaRegion.write(`${COLUMNAS.join('\t')}\n`);

const respuesta = await fetch(URL_EXPORTACION, { headers: { 'User-Agent': 'Moss/1.1 (https://condezuzu.github.io/moss-app/)' } });
if (!respuesta.ok) throw new Error(`Open Food Facts respondió ${respuesta.status}`);

let indices = null;
let resto = '';
let leidas = 0;
let guardadas = 0;
let deLaRegion = 0;

function linea(texto) {
  if (!indices) {
    const cabecera = texto.split('\t');
    indices = Object.fromEntries(COLUMNAS.map((c) => [c, cabecera.indexOf(c)]));
    const faltan = COLUMNAS.filter((c) => indices[c] < 0);
    if (faltan.length) console.log(`Columnas que no están: ${faltan.join(', ')}`);
    return;
  }
  leidas++;
  if (!texto.includes('en:')) return;
  const campos = texto.split('\t');
  const paises = campos[indices.countries_tags] ?? '';
  const fila = () => `${COLUMNAS.map((c) => (indices[c] < 0 ? '' : (campos[indices[c]] ?? ''))).join('\t')}\n`;
  if (PAISES.test(paises) || DE_URUGUAY.test(campos[indices.code] ?? '')) {
    salida.write(fila());
    guardadas++;
  } else if (REGION.test(paises) && GLOBALES.test(campos[indices.brands] ?? '')) {
    salidaRegion.write(fila());
    deLaRegion++;
  }
  if (leidas % 1000000 === 0) console.log(`${leidas} leídas, ${guardadas} guardadas y ${deLaRegion} de la región`);
}

const descomprimido = Readable.fromWeb(respuesta.body).pipe(createGunzip());
descomprimido.setEncoding('utf8');
for await (const trozo of descomprimido) {
  const partes = (resto + trozo).split('\n');
  resto = partes.pop();
  for (const p of partes) linea(p);
}
if (resto) linea(resto);
await Promise.all([new Promise((listo) => salida.end(listo)), new Promise((listo) => salidaRegion.end(listo))]);
renameSync(`${final}.parcial`, final);
renameSync(`${finalRegion}.parcial`, finalRegion);
console.log(`Listo: ${leidas} productos leídos, ${guardadas} de Uruguay o Argentina y ${deLaRegion} de marcas globales en la región.`);
