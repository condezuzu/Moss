// Arma galeria/dist/index.html: un solo archivo con la página, los shaders del cielo, el
// catálogo, los textos, los alimentos curados y los módulos de la comida. Todo se lee de src/ y
// de assets/, que es lo mismo que usa la app: la galería nunca tiene una copia propia.
// Uso: npm run galeria

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');
const leerJson = (p) => (existsSync(join(raiz, p)) ? JSON.parse(leer(p)) : null);

// Un módulo de src/ pasado a JavaScript, como una constante con lo que exporta. Tiene que ser
// autosuficiente: sin imports (los de solo tipos se borran al pasarlo).
function modulo(nombre, ruta) {
  const { outputText } = ts.transpileModule(leer(ruta), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  if (/^import\s/m.test(outputText)) throw new Error(`${ruta} importa otros módulos: la galería no puede usarlo`);
  const exportado = /^export (?:async )?(?:function|const|let|class) (\w+)/gm;
  const nombres = [...outputText.matchAll(exportado)].map((m) => m[1]);
  const cuerpo = outputText.replace(/^export (?=(?:async )?(?:function|const|let|class) )/gm, '').replace(/^export \{\s*\};?$/gm, '');
  return `const ${nombre} = (() => {\n${cuerpo}\nreturn { ${nombres.join(', ')} };\n})();`;
}

// Los genéricos curados de assets/alimentos.db, compactos: la galería busca sobre ellos en la
// memoria con el mismo orden que la app (src/comida/buscar.ts). Por alimento: id, nombres, valores
// por 100 g (kcal, proteína, carbohidratos, grasas, y aparte lo secundario), porciones [es, en,
// gramos], la de siempre y los textos de búsqueda [idioma, región, principal, texto].
function alimentosCurados() {
  const ruta = join(raiz, 'assets/alimentos.db');
  if (!existsSync(ruta)) return null;
  const db = new DatabaseSync(ruta, { readOnly: true });
  const redondo = (n) => Math.round(n * 100) / 100;
  const alimentos = new Map(db.prepare(`SELECT id, nombre_es, nombre_en, categoria, kcal, proteina, carbohidratos, grasas, fibra, azucares, saturadas, sodio, alcohol, porcion
    FROM alimentos WHERE nombre_es IS NOT NULL ORDER BY id`).all()
    .map((a) => [a.id, {
      id: a.id, es: a.nombre_es, en: a.nombre_en, cat: a.categoria, v: [a.kcal, a.proteina, a.carbohidratos, a.grasas].map(redondo),
      // Lo secundario: fibra, azúcares, saturadas, sodio (mg) y alcohol; null si la base no lo tiene.
      s: [a.fibra, a.azucares, a.saturadas, a.sodio, a.alcohol].map((n) => (n === null ? null : redondo(n))),
      p: [], d: 0, t: [], porcion: a.porcion,
    }]));
  for (const p of db.prepare(`SELECT p.id, p.alimento, p.es, p.en, p.gramos FROM porciones p JOIN alimentos a ON a.id = p.alimento WHERE a.nombre_es IS NOT NULL ORDER BY p.id`).all()) {
    const a = alimentos.get(p.alimento);
    if (p.id === a.porcion) a.d = a.p.length;
    a.p.push([p.es, p.en, redondo(p.gramos)]);
  }
  for (const t of db.prepare(`SELECT t.alimento, t.idioma, t.region, t.principal, t.texto FROM textos t JOIN alimentos a ON a.id = t.alimento WHERE a.nombre_es IS NOT NULL ORDER BY t.id`).all()) {
    alimentos.get(t.alimento).t.push([t.idioma, t.region || '', t.principal, t.texto]);
  }
  db.close();
  return [...alimentos.values()].map(({ porcion, ...a }) => a);
}

const shaders = {
  comun: leer('src/cielo/shaders/comun.glsl'),
  fondo: leer('src/cielo/shaders/fondo.glsl'),
  aurora: leer('src/cielo/shaders/aurora.glsl'),
  vivo: leer('src/cielo/shaders/vivo.glsl'),
};

const catalogo = leerJson('src/datos/constelaciones.json');
const textos = { es: leerJson('src/textos/es.json'), en: leerJson('src/textos/en.json') };

const claves = ['comun.deshacer', 'fecha.dias', 'fecha.diasCortos', 'fecha.mesesCortos', 'cielo.fecha', 'cielo.luzDeHoy', 'cielo.encendidas',
  'cielo.completa', 'cielo.encendida', 'cielo.apagada', 'cielo.seEnciendeSola', 'cielo.desdeSalud', 'cielo.horasMinutos',
  'cielo.tuUniverso', 'entrada.frase', 'entrada.fraseAutor', 'entrada.habitosTitulo', 'entrada.comidaTitulo', 'entrada.cuenta.apple',
  'entrada.cuestionario.resultadoTitulo', 'ajustes.titulo', 'comida.comidas.cena', 'comida.teQuedan', 'comida.buscar', 'comida.sueles.cena',
  'comida.agregarA.cena', 'comida.tuDia', 'comida.controlTexto'];
const faltan = [];
for (const idioma of ['es', 'en']) {
  if (!textos[idioma]) { faltan.push(`src/textos/${idioma}.json`); continue; }
  for (const clave of claves) {
    const valor = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), textos[idioma]);
    if (valor == null) faltan.push(`${idioma}:${clave}`);
  }
}
if (faltan.length) {
  console.error('Faltan textos en el diccionario:', faltan.join(', '));
  process.exit(1);
}

const alimentos = alimentosCurados();
if (!alimentos) console.warn('Sin assets/alimentos.db (npm run alimentos): la galería de la comida queda sin alimentos.');

// "</" adentro de un <script> lo cortaría.
const json = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');
const js = [
  `const SHADERS = ${json(shaders)};`,
  `const CATALOGO = ${json(catalogo)};`,
  `const TEXTOS = ${json(textos)};`,
  `const ALIMENTOS = ${json(alimentos)};`,
  modulo('Buscar', 'src/comida/buscar.ts'),
  modulo('Porciones', 'src/comida/porciones.ts'),
  modulo('Comidas', 'src/dominio/comidas.ts'),
  modulo('Etiqueta', 'src/comida/etiqueta.ts'),
  modulo('Metas', 'src/dominio/metas.ts'),
  leer('galeria/src/motor.js'),
  leer('galeria/src/escena.js'),
  leer('galeria/src/entrada.js'),
  leer('galeria/src/comida.js'),
  leer('galeria/src/ajustes.js'),
  leer('galeria/src/galeria.js'),
].join('\n');

const html = leer('galeria/src/pagina.html').replace('/*@SCRIPTS*/', () => js);
mkdirSync(join(raiz, 'galeria/dist'), { recursive: true });
writeFileSync(join(raiz, 'galeria/dist/index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
const n = catalogo ? catalogo.constelaciones.length : 0;
console.log(`galeria/dist/index.html · ${kb} KB · ${n} constelaciones en el catálogo · ${alimentos ? alimentos.length : 0} alimentos curados`);
