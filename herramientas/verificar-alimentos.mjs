// Revisa la base de alimentos que arma `npm run alimentos` (assets/alimentos.db):
// - valores posibles: nada negativo, nada con más de 100 g de macros en 100 g;
// - cada curado con su porción de siempre en español, y todas sus porciones traducidas;
// - los nombres de cada región: uno principal por alimento y región, y ningún nombre principal
//   que en la misma región sea de dos alimentos;
// - los dos índices de búsqueda, y el tamaño;
// - y avisa (sin fallar) de los curados cuyas calorías no cierran con 4/4/9, para mirarlos.
// La calidad de la búsqueda la prueban los tests (src/comida/buscar.test.ts).
// Uso: npm run alimentos:verificar   → sale con código 1 si algo falla.

import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const ruta = join(dirname(fileURLToPath(import.meta.url)), '../assets/alimentos.db');
const db = new DatabaseSync(ruta, { readOnly: true });
const todas = (sql, ...p) => db.prepare(sql).all(...p);
const uno = (sql, ...p) => db.prepare(sql).get(...p);

let fallas = 0;
const comprobar = (bien, texto, detalle = []) => {
  if (!bien) fallas++;
  console.log(`${bien ? '✓' : '✗'} ${texto}${detalle.length ? `\n  ${detalle.slice(0, 12).join('\n  ')}${detalle.length > 12 ? `\n  … y ${detalle.length - 12} más` : ''}` : ''}`);
};

const { total, curados } = uno('SELECT count(*) AS total, count(nombre_es) AS curados FROM alimentos');
console.log(`${total} alimentos, ${curados} curados en español. ${uno('SELECT valor FROM datos WHERE clave = ?', 'fuentes').valor}.`);

const imposibles = todas('SELECT descripcion FROM alimentos WHERE kcal < 0 OR proteina < 0 OR carbohidratos < 0 OR grasas < 0 OR kcal > 902 OR proteina + carbohidratos + grasas > 102');
comprobar(!imposibles.length, 'los valores por 100 g son posibles', imposibles.map((a) => a.descripcion));

const sinPorcion = todas(`SELECT a.nombre_es FROM alimentos a LEFT JOIN porciones p ON p.id = a.porcion WHERE a.nombre_es IS NOT NULL AND (p.id IS NULL OR p.es IS NULL)`);
comprobar(!sinPorcion.length, 'cada curado tiene su porción de siempre en español', sinPorcion.map((a) => a.nombre_es));
const sinTraducir = todas('SELECT a.nombre_es, p.en FROM porciones p JOIN alimentos a ON a.id = p.alimento WHERE a.nombre_es IS NOT NULL AND p.es IS NULL');
comprobar(!sinTraducir.length, 'todas las porciones de los curados están en español', sinTraducir.map((p) => `${p.nombre_es}: ${p.en}`));
const malas = todas('SELECT count(*) AS n FROM porciones WHERE gramos <= 0')[0].n;
comprobar(!malas, 'ninguna porción pesa cero');

const dosPrincipales = todas(`SELECT a.nombre_es, x.region FROM alias x JOIN alimentos a ON a.id = x.alimento WHERE x.principal = 1 GROUP BY x.alimento, x.region HAVING count(*) > 1`);
comprobar(!dosPrincipales.length, 'cada alimento tiene a lo sumo un nombre principal por región', dosPrincipales.map((d) => `${d.nombre_es} en ${d.region}`));
const ambiguos = todas(`SELECT lower(x.texto) AS texto, x.region, group_concat(a.nombre_es, ' y ') AS cuales FROM alias x JOIN alimentos a ON a.id = x.alimento
  WHERE x.principal = 1 GROUP BY lower(x.texto), x.region HAVING count(DISTINCT x.alimento) > 1`);
comprobar(!ambiguos.length, 'ningún nombre principal es de dos alimentos en la misma región', ambiguos.map((d) => `«${d.texto}» en ${d.region}: ${d.cuales}`));

let indices = true;
for (const tabla of ['palabras', 'trigramas']) {
  try {
    db.prepare(`INSERT INTO ${tabla} (${tabla}) VALUES ('integrity-check')`).run();
  } catch (error) {
    indices = !/corrupt|malformed/i.test(error.message) && indices;
  }
}
comprobar(indices, 'los dos índices de búsqueda están sanos');
const megas = statSync(ruta).size / 1048576;
comprobar(megas < 10, `la base pesa ${megas.toFixed(1)} MB (el tope es 10)`);

// USDA usa factores de Atwater propios de cada alimento, y la fibra cuenta menos (acá no se guarda):
// se avisa de diferencias de más de un 20 % y 20 kcal. Salvo el alcohol, que aporta 7 kcal/g.
const lejos = todas(`SELECT nombre_es, kcal, round(4 * proteina + 4 * carbohidratos + 9 * grasas) AS calculadas FROM alimentos
  WHERE nombre_es IS NOT NULL AND categoria <> 'alcohol' AND abs(kcal - (4 * proteina + 4 * carbohidratos + 9 * grasas)) > max(20, 0.2 * kcal)`);
if (lejos.length) console.log(`! para mirar: ${lejos.length} curados no cierran con 4/4/9 (fibra, edulcorantes):\n  ${lejos.map((a) => `${a.nombre_es}: ${a.kcal} kcal, y 4/4/9 da ${a.calculadas}`).join('\n  ')}`);

db.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron.` : '\nTodo bien.');
process.exit(fallas ? 1 : 0);
