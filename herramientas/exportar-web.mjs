// Arma la app para la web en web-exportada/, fuera de dist/, que `eas update` borra cada vez que publica.
// No es un script de package.json: los `scripts` y el .gitignore entran en la huella nativa, y cambiarlos
// corta las OTA a las builds instaladas (herramientas/verificar-huella.mjs). Por eso `npm run web:exportar`
// sigue como en la build 6, y web-exportada/ se ignora con su propio .gitignore.
// Uso: node herramientas/exportar-web.mjs && npm run web:ver

import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

for (const comando of [
  'npx setup-skia-web public',
  'node --disable-warning=ExperimentalWarning herramientas/alimentos-web.mjs',
  `npx expo export --platform web --output-dir web-exportada ${process.argv.slice(2).join(' ')}`,
]) {
  const r = spawnSync(comando, { cwd: raiz, shell: true, stdio: 'inherit' });
  if (r.status) process.exit(r.status);
}
writeFileSync(join(raiz, 'web-exportada/.gitignore'), '*\n');
