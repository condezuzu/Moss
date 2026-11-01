// Una OTA solo le llega a una build con la misma huella nativa, y la huella cuenta más de lo que parece:
// el código nativo, app.json, los `scripts` de package.json y hasta los bytes del .gitignore. Esto
// compara la de esta carpeta con la de la build que está en la tienda. Se corre antes de cada OTA. Lo
// que no cuenta es el Swift de app-intents/: acá da bien aunque la build no tenga ese Swift.
// Uso: node herramientas/verificar-huella.mjs [--arreglar]
// --arreglar deja el .gitignore como cuando se armó la build 6: las 55 primeras líneas con CRLF y las
// últimas con LF. Git puede reescribirlo al cambiar de rama (autocrlf) y la huella cambia sola.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Build 6, la de la tienda. Con cada build nueva se cambia acá.
const DE_LA_BUILD = 'fc0d415b9a4f72c58715db202f22d4be49af3eb0';
const LINEAS_CON_CRLF = 55;

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const huella = () => {
  const r = spawnSync('npx expo-updates fingerprint:generate --platform ios', { cwd: raiz, shell: true, encoding: 'utf8', maxBuffer: 1 << 28 });
  return JSON.parse(r.stdout).hash;
};

let ahora = huella();
if (ahora !== DE_LA_BUILD && process.argv.includes('--arreglar')) {
  const ruta = join(raiz, '.gitignore');
  const lineas = readFileSync(ruta, 'utf8').replace(/\r\n/g, '\n').split('\n').slice(0, -1);
  writeFileSync(ruta, lineas.map((l, i) => l + (i < LINEAS_CON_CRLF ? '\r\n' : '\n')).join(''));
  ahora = huella();
}
if (ahora === DE_LA_BUILD) {
  console.log(`✓ La huella es la de la build: ${ahora}. Una OTA de acá le llega.`);
} else {
  console.error(`✗ La huella es ${ahora} y la de la build, ${DE_LA_BUILD}: una OTA de acá NO le llegaría.`);
  console.error('  Para ver qué cambió: npx eas-cli@latest fingerprint:compare --build-id <id de la build>');
  console.error('  Si fue el .gitignore: node herramientas/verificar-huella.mjs --arreglar');
  process.exit(1);
}
