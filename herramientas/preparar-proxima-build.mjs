// Prende en esta carpeta lo que va con la próxima build (spec/widgets.md, D43): declara en app.json los
// widgets Hoy, Anotar y Agua y los tamaños nuevos de Cielo y Noche, y pone CON_WIDGETS_NUEVOS en true.
// Eso cambia la huella: se corre recién al armar esa build, nunca antes de una OTA para las que ya están.
// Uso: node herramientas/preparar-proxima-build.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Los nombres de la galería de widgets van en español: el plugin los escribe tal cual en Swift.
const WIDGETS = [
  {
    name: 'Hoy',
    displayName: 'Hoy',
    description: 'Lo que te queda de hoy y tus comidas, para anotarlas de un toque.',
    ios: { supportedFamilies: ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline'] },
  },
  {
    name: 'Anotar',
    displayName: 'Anotar',
    description: 'Buscar, decir, escanear o leer una etiqueta, de un toque.',
    ios: {
      supportedFamilies: ['systemSmall', 'systemMedium', 'accessoryCircular'],
      configuration: {
        title: 'Anotar',
        description: 'Qué abre el widget chico.',
        parameters: {
          accion: {
            title: 'Al tocar',
            type: 'enum',
            default: 'decir',
            values: [
              { name: 'Decir lo que comí', value: 'decir' },
              { name: 'Buscar', value: 'buscar' },
              { name: 'Código de barras', value: 'codigo' },
              { name: 'Foto de la etiqueta', value: 'etiqueta' },
            ],
          },
        },
      },
    },
  },
  {
    name: 'Agua',
    displayName: 'Agua',
    description: 'Un vaso más, de un toque.',
    ios: { supportedFamilies: ['systemSmall'] },
  },
];
const FAMILIAS = {
  Cielo: ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryCircular'],
  Noche: ['systemSmall', 'accessoryCircular', 'accessoryRectangular'],
};

const rutaApp = join(raiz, 'app.json');
const crudo = readFileSync(rutaApp, 'utf8');
const app = JSON.parse(crudo);
const plugin = app.expo.plugins.find((p) => Array.isArray(p) && p[0] === 'expo-widgets');
if (!plugin) throw new Error('No encontré expo-widgets en app.json');
for (const w of plugin[1].widgets) if (FAMILIAS[w.name]) w.ios.supportedFamilies = FAMILIAS[w.name];
for (const w of WIDGETS) if (!plugin[1].widgets.some((x) => x.name === w.name)) plugin[1].widgets.push(w);
const texto = `${JSON.stringify(app, null, 2)}\n`;
writeFileSync(rutaApp, crudo.includes('\r\n') ? texto.replace(/\n/g, '\r\n') : texto);

const rutaBanderas = join(raiz, 'src/lib/banderas.ts');
const banderas = readFileSync(rutaBanderas, 'utf8');
if (!/CON_WIDGETS_NUEVOS = (true|false)/.test(banderas)) throw new Error('No encontré CON_WIDGETS_NUEVOS');
writeFileSync(rutaBanderas, banderas.replace('CON_WIDGETS_NUEVOS = false', 'CON_WIDGETS_NUEVOS = true'));

console.log('Listo: app.json con todos los widgets y CON_WIDGETS_NUEVOS en true. La huella cambió: esto va con la próxima build.');
