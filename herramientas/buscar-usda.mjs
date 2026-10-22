// Busca en USDA (la base que arma `npm run alimentos`) la descripción exacta para curar un alimento,
// con sus valores por 100 g, sus porciones, la parte que no se come (SR28) y si ya está curado.
// Uso: node herramientas/buscar-usda.mjs rice white cooked   (las palabras, en inglés, en cualquier orden)
//      node herramientas/buscar-usda.mjs --curados arroz      (lo ya curado que se llama así, en español)

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new DatabaseSync(join(raiz, process.env.BASE ?? 'assets/alimentos.db'), { readOnly: true });
const args = process.argv.slice(2);
const curados = args[0] === '--curados';
const palabras = (curados ? args.slice(1) : args).join(' ').toLowerCase().replace(/[^\p{L}\p{N} ]+/gu, ' ').split(' ').filter(Boolean);
if (!palabras.length) {
  console.log('Uso: node herramientas/buscar-usda.mjs palabras en inglés   |   --curados palabras en español');
  process.exit(0);
}

// La parte que no se come, de SR28 (la baja `npm run alimentos`).
const desechos = new Map();
const zip = join(raiz, '.cache/usda/sr28/sr28asc.zip');
if (existsSync(zip)) {
  const z = readFileSync(zip);
  const fin = z.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  let p = z.readUInt32LE(fin + 16);
  for (let i = 0; i < z.readUInt16LE(fin + 10); i++) {
    const largo = z.readUInt16LE(p + 28);
    const nombre = z.toString('utf8', p + 46, p + 46 + largo);
    if (nombre === 'FOOD_DES.txt') {
      const local = z.readUInt32LE(p + 42);
      const datos = local + 30 + z.readUInt16LE(local + 26) + z.readUInt16LE(local + 28);
      for (const linea of inflateRawSync(z.subarray(datos, datos + z.readUInt32LE(p + 20))).toString('latin1').split(/\r?\n/)) {
        const f = linea.split('^').map((c) => c.replace(/^~|~$/g, ''));
        if (Number(f[8]) > 0) desechos.set(f[2], `${f[8]}% ${f[7]}`);
      }
    }
    p += 46 + largo + z.readUInt16LE(p + 30) + z.readUInt16LE(p + 32);
  }
}

const consulta = palabras.map((w) => `"${w}"*`).join(' ');
const filas = curados
  ? db.prepare(`SELECT DISTINCT a.* FROM palabras JOIN textos t ON t.id = palabras.rowid JOIN alimentos a ON a.id = t.alimento
      WHERE palabras MATCH ? AND a.nombre_es IS NOT NULL ORDER BY length(a.nombre_es) LIMIT 40`).all(consulta)
  : db.prepare(`SELECT a.* FROM palabras JOIN textos t ON t.id = palabras.rowid JOIN alimentos a ON a.id = t.alimento
      WHERE palabras MATCH ? AND t.idioma = 'en' AND t.texto = a.descripcion AND a.fuente IN ('sr', 'fndds') ORDER BY length(a.descripcion) LIMIT 40`).all(consulta);
const redondo = (n) => (n === null ? '–' : Math.round(n * 10) / 10);
for (const a of filas) {
  const porciones = db.prepare('SELECT en, es, gramos FROM porciones WHERE alimento = ? ORDER BY id LIMIT 8').all(a.id)
    .map((p) => `${p.es ?? p.en}=${redondo(p.gramos)}`).join(' · ');
  const curado = a.nombre_es ? `  ← curado: «${a.nombre_es}»${a.crudo ? ` (crudo: ${db.prepare('SELECT nombre_es FROM alimentos WHERE id = ?').get(a.crudo)?.nombre_es})` : ''}` : '';
  const desecho = desechos.get(a.descripcion);
  console.log(`${a.fuente}:${a.descripcion}${curado}`);
  console.log(`   ${redondo(a.kcal)} kcal · P ${redondo(a.proteina)} · C ${redondo(a.carbohidratos)} · G ${redondo(a.grasas)} · fibra ${redondo(a.fibra)} · sodio ${redondo(a.sodio)}${desecho ? ` · no se come: ${desecho}` : ''}`);
  if (porciones) console.log(`   ${porciones}`);
}
if (!filas.length) console.log('Nada. Probá con menos palabras o con otras (USDA está en inglés).');
