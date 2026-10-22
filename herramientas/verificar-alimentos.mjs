// Revisa la base de alimentos que arma `npm run alimentos` (assets/alimentos.db):
// - valores posibles: nada negativo, nada con más de 100 g de macros en 100 g, el sodio por debajo
//   del de la sal y el alcohol por debajo de 100 g;
// - cada curado con su porción de siempre en español, y todas sus porciones traducidas;
// - los nombres de cada región: uno principal por alimento y región, y ningún nombre principal
//   que en la misma región sea de dos alimentos;
// - cómo se mide: lo cocido con su versión cruda, los códigos de barras, las marcas de los
//   productos, y que nada se presente como de un país (el catálogo es para todo el mundo);
// - los dos índices de búsqueda, y el tamaño;
// - y avisa (sin fallar) de los curados cuyas calorías no cierran con 4/4/9 (y 7 para el alcohol),
//   o con más fibra o azúcares que carbohidratos o más saturadas que grasas, para mirarlos.
// La calidad de la búsqueda la prueban los tests (src/comida/buscar.test.ts).
// Uso: npm run alimentos:verificar   → sale con código 1 si algo falla.

import { statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const ruta = process.env.BASE ? join(dirname(fileURLToPath(import.meta.url)), '..', process.env.BASE) : join(dirname(fileURLToPath(import.meta.url)), '../assets/alimentos.db');
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

const imposibles = todas(`SELECT descripcion FROM alimentos WHERE kcal < 0 OR proteina < 0 OR carbohidratos < 0 OR grasas < 0 OR kcal > 902 OR proteina + carbohidratos + grasas > 102
  OR fibra < 0 OR azucares < 0 OR saturadas < 0 OR sodio < 0 OR alcohol < 0 OR sodio > 40000 OR alcohol > 100`);
comprobar(!imposibles.length, 'los valores por 100 g son posibles', imposibles.map((a) => a.descripcion));
// Cocinar le saca agua a un plato, y nunca le suma más que un poco: lo terminado pesa entre el 40 % y el 105 % de sus ingredientes.
const platos = todas(`SELECT a.nombre_es, r.peso_final, (SELECT sum(gramos) FROM ingredientes i WHERE i.plato = r.plato) AS crudo FROM recetas r JOIN alimentos a ON a.id = r.plato`);
const pesosRaros = platos.filter((p) => p.peso_final < 0.4 * p.crudo || p.peso_final > 1.05 * p.crudo);
comprobar(!pesosRaros.length, `los ${platos.length} platos como recetas pesan algo posible al terminarlos`, pesosRaros.map((p) => `${p.nombre_es}: ${p.peso_final} g de ${p.crudo} g`));
const sinSecundarios = todas(`SELECT nombre_es FROM alimentos WHERE nombre_es IS NOT NULL AND fuente <> 'propio' AND (fibra IS NULL OR sodio IS NULL)`);

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

// Cómo se miden los alimentos (spec/nutricion.md).
// El rinde, por la proteína (que no se pierde al cocinar); sin proteína, por las calorías. Lo frito no cuenta: el rebozado suma.
const pares = todas(`SELECT a.nombre_es AS cocido, c.nombre_es AS crudo, c.crudo AS doble, a.aceite,
  CASE WHEN c.proteina >= 1 AND a.proteina >= 1 THEN c.proteina / a.proteina ELSE c.kcal / a.kcal END AS rinde FROM alimentos a JOIN alimentos c ON c.id = a.crudo`);
comprobar(pares.every((p) => p.crudo && !p.doble), `los ${pares.length} cocidos tienen su versión cruda curada`, pares.filter((p) => !p.crudo || p.doble).map((p) => p.cocido));
const sinCodigo = todas(`SELECT nombre_es FROM alimentos WHERE fuente = 'producto' AND (marca IS NULL OR porcion IS NULL)`);
const productos = uno(`SELECT count(*) AS n FROM alimentos WHERE fuente = 'producto'`).n;
comprobar(!sinCodigo.length, `los ${productos} productos tienen marca y porción`, sinCodigo.map((a) => a.nombre_es));
const huerfanos = uno('SELECT count(*) AS n FROM codigos c LEFT JOIN alimentos a ON a.id = c.alimento WHERE a.id IS NULL').n;
comprobar(!huerfanos, `los ${uno('SELECT count(*) AS n FROM codigos').n} códigos de barras son de un alimento`);
// Moss es para todo el mundo: lo de un país está en la base, pero no se presenta como de ese país.
const deUnPais = todas(`SELECT texto FROM (SELECT nombre_es AS texto FROM alimentos UNION ALL SELECT nombre_en FROM alimentos UNION ALL SELECT marca FROM alimentos UNION ALL SELECT texto FROM alias)
  WHERE texto LIKE '%urugua%' OR texto LIKE '%oriental%' OR texto LIKE '%charrúa%' OR texto LIKE '%criollo uy%'`);
comprobar(!deUnPais.length, 'ningún nombre presenta un alimento como de un país', deUnPais.map((a) => a.texto));

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

// USDA usa factores de Atwater propios de cada alimento, y la fibra cuenta menos: se avisa de
// diferencias de más de un 20 % y 20 kcal. El alcohol aporta 7 kcal/g.
const lejos = todas(`SELECT nombre_es, kcal, round(4 * proteina + 4 * carbohidratos + 9 * grasas + 7 * coalesce(alcohol, 0)) AS calculadas FROM alimentos
  WHERE nombre_es IS NOT NULL AND abs(kcal - (4 * proteina + 4 * carbohidratos + 9 * grasas + 7 * coalesce(alcohol, 0))) > max(20, 0.2 * kcal)`);
if (lejos.length) console.log(`! para mirar: ${lejos.length} curados no cierran con 4/4/9 y 7 (fibra, edulcorantes):\n  ${lejos.map((a) => `${a.nombre_es}: ${a.kcal} kcal, y 4/4/9 da ${a.calculadas}`).join('\n  ')}`);
if (sinSecundarios.length) console.log(`! para mirar: ${sinSecundarios.length} curados de USDA sin fibra o sin sodio (en la app no se muestran): ${sinSecundarios.map((a) => a.nombre_es).join(', ')}`);
const rindeRaro = pares.filter((p) => p.aceite !== 'incluido' && (p.rinde < 0.25 || p.rinde > 4));
if (rindeRaro.length) console.log(`! para mirar: ${rindeRaro.length} pares crudo y cocido con un rendimiento raro:\n  ${rindeRaro.map((p) => `${p.cocido}: ${p.rinde.toFixed(2)}`).join('\n  ')}`);
// Lo cocido sin su versión cruda, y lo crudo sin cocido: para completar los pares.
const cocinado = /(?:^|\s)(cocid[oa]s?|hervid[oa]s?|a la plancha|al horno|asad[oa]s?|frit[oa]s?|salteado|guisad[oa]s?|al vapor|grillad[oa])(?:$|\s|,)/i;
const sinCrudo = todas(`SELECT nombre_es FROM alimentos WHERE nombre_es IS NOT NULL AND crudo IS NULL AND fuente IN ('sr', 'fndds') AND categoria <> 'platos'`).filter((a) => cocinado.test(a.nombre_es));
if (sinCrudo.length) console.log(`! para mirar: ${sinCrudo.length} curados cocidos sin su versión cruda: ${sinCrudo.map((a) => a.nombre_es).join(', ')}`);
const crudos = new Set(todas('SELECT crudo FROM alimentos WHERE crudo IS NOT NULL').map((a) => a.crudo));
const sinCocido = todas(`SELECT id, nombre_es FROM alimentos WHERE nombre_es LIKE '% crud%'`).filter((a) => !crudos.has(a.id));
if (sinCocido.length) console.log(`! para mirar: ${sinCocido.length} crudos sin versión cocida: ${sinCocido.map((a) => a.nombre_es).join(', ')}`);
const raros = todas(`SELECT nombre_es FROM alimentos WHERE nombre_es IS NOT NULL AND (fibra > carbohidratos + 1 OR azucares > carbohidratos + 1 OR saturadas > grasas + 1)`);
if (raros.length) console.log(`! para mirar: ${raros.length} curados con más fibra o azúcares que carbohidratos, o más saturadas que grasas:\n  ${raros.map((a) => a.nombre_es).join(', ')}`);

db.close();
console.log(fallas ? `\n${fallas} comprobaciones fallaron.` : '\nTodo bien.');
process.exit(fallas ? 1 : 0);
