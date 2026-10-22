// Los alimentos curados de assets/alimentos.db en un JSON, para la web de prueba de la app
// (src/comida/base.web.ts): en la web no hay SQLite. Lo corre `npm run web:exportar`.
// Por alimento: id, fuente, nombres, valores por 100 g y lo secundario, porciones [es, en, gramos],
// textos de búsqueda [idioma, región, principal, texto] y cómo se mide.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const db = new DatabaseSync(join(raiz, 'assets/alimentos.db'), { readOnly: true });
const redondo = (n) => (n === null ? null : Math.round(n * 100) / 100);

const alimentos = new Map(db.prepare(`SELECT * FROM alimentos WHERE nombre_es IS NOT NULL ORDER BY id`).all().map((a) => [a.id, {
  id: a.id, f: a.fuente, es: a.nombre_es, en: a.nombre_en ?? a.descripcion,
  v: [a.kcal, a.proteina, a.carbohidratos, a.grasas].map(redondo),
  s: [a.fibra, a.azucares, a.saturadas, a.sodio, a.alcohol].map(redondo),
  p: [], t: [], m: a.marca, d: a.densidad, x: a.desecho ? [a.desecho, a.desecho_es, a.desecho_en] : null, a: a.aceite, c: a.crudo, o: a.atribucion,
}]));
for (const p of db.prepare('SELECT alimento, es, en, gramos FROM porciones ORDER BY id').all()) alimentos.get(p.alimento)?.p.push([p.es, p.en, redondo(p.gramos)]);
for (const t of db.prepare('SELECT alimento, idioma, region, principal, texto FROM textos ORDER BY id').all()) alimentos.get(t.alimento)?.t.push([t.idioma, t.region ?? '', t.principal, t.texto]);
const recetas = {};
for (const r of db.prepare('SELECT plato, peso_final FROM recetas').all()) {
  recetas[r.plato] = [r.peso_final, db.prepare('SELECT ingrediente, gramos FROM ingredientes WHERE plato = ? ORDER BY rowid').all(r.plato).map((i) => [i.ingrediente, i.gramos])];
}
const codigos = Object.fromEntries(db.prepare('SELECT codigo, alimento FROM codigos').all().map((c) => [c.codigo, c.alimento]));
db.close();

const salida = join(raiz, 'public/alimentos.json');
mkdirSync(dirname(salida), { recursive: true });
writeFileSync(salida, JSON.stringify({ alimentos: [...alimentos.values()], recetas, codigos }));
console.log(`public/alimentos.json: ${alimentos.size} alimentos`);
