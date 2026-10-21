// Arma galeria/dist/index.html: un solo archivo con la página, los shaders del cielo, el
// catálogo y los textos. Los shaders, el catálogo y el diccionario se leen de src/, que es lo
// mismo que usa la app: la galería nunca tiene una copia propia.
// Uso: node galeria/construir.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (p) => readFileSync(join(raiz, p), 'utf8');
const leerJson = (p) => (existsSync(join(raiz, p)) ? JSON.parse(leer(p)) : null);

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
  'entrada.cuestionario.resultadoTitulo', 'ajustes.titulo'];
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

// "</" adentro de un <script> lo cortaría.
const json = (v) => JSON.stringify(v).replace(/<\//g, '<\\/');
const js = [
  `const SHADERS = ${json(shaders)};`,
  `const CATALOGO = ${json(catalogo)};`,
  `const TEXTOS = ${json(textos)};`,
  leer('galeria/src/motor.js'),
  leer('galeria/src/escena.js'),
  leer('galeria/src/entrada.js'),
  leer('galeria/src/galeria.js'),
].join('\n');

const html = leer('galeria/src/pagina.html').replace('/*@SCRIPTS*/', () => js);
mkdirSync(join(raiz, 'galeria/dist'), { recursive: true });
writeFileSync(join(raiz, 'galeria/dist/index.html'), html);
const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
const n = catalogo ? catalogo.constelaciones.length : 0;
console.log(`galeria/dist/index.html · ${kb} KB · ${n} constelaciones en el catálogo`);
