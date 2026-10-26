// `npm run servidor:preparar -- <ruta a AuthKey_XXXXXXXXXX.p8>`: carga la clave de Sign in with Apple
// como secreto de las funciones y despliega moss-borrar-cuenta y moss-vincular en el proyecto de
// Supabase. Antes, una vez: `npx supabase login`. Sin la ruta, solo despliega (los secretos que ya
// estén quedan). Nunca muestra la clave. Las migraciones siguen siendo a mano, en el SQL Editor
// (spec/ascent.md, «Lo que tenés que hacer vos»).

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROYECTO = 'okeanaihymbvbdmrdqph';
const EQUIPO = 'XF9N8X9KJG';
const FUNCIONES = ['moss-borrar-cuenta', 'moss-vincular'];
const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

function supabase(args, { ocultar } = {}) {
  const r = spawnSync('npx', ['--yes', 'supabase@latest', ...args], { cwd: raiz, encoding: 'utf8', shell: process.platform === 'win32' });
  const salida = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  return { ok: r.status === 0, salida: ocultar ? salida.replaceAll(ocultar, '<clave>') : salida };
}

const sesion = supabase(['projects', 'list']);
if (!sesion.ok) {
  console.log('Primero entrá al CLI de Supabase: npx supabase login');
  process.exit(1);
}
if (!sesion.salida.includes(PROYECTO)) {
  console.log(`Esta sesión del CLI no ve el proyecto ${PROYECTO}: entrá con la cuenta dueña del proyecto.`);
  process.exit(1);
}

const ruta = process.argv[2];
if (ruta) {
  const idDeClave = /AuthKey_([A-Z0-9]{10})\.p8$/i.exec(basename(ruta))?.[1];
  if (!idDeClave) {
    console.log('El archivo tiene que llamarse AuthKey_XXXXXXXXXX.p8 (el Key ID son esos 10 caracteres).');
    process.exit(1);
  }
  // La clave en una línea, sin BEGIN ni END: la función acepta las dos formas.
  const clave = readFileSync(ruta, 'utf8').split(/\r?\n/).filter((l) => l && !l.includes('-----')).join('');
  if (clave.length < 100) {
    console.log('El archivo no parece una clave .p8.');
    process.exit(1);
  }
  const r = supabase(['secrets', 'set', `APPLE_TEAM_ID=${EQUIPO}`, `APPLE_KEY_ID=${idDeClave}`, 'APPLE_CLIENT_ID=uy.moss.app', `APPLE_PRIVATE_KEY=${clave}`, '--project-ref', PROYECTO], { ocultar: clave });
  console.log(r.ok ? `Clave de Apple cargada (Key ID ${idDeClave}).` : `No se pudo cargar la clave:\n${r.salida}`);
  if (!r.ok) process.exit(1);
} else {
  console.log('Sin la ruta de la .p8: no toco los secretos de Apple.');
}

let fallas = 0;
for (const funcion of FUNCIONES) {
  // --use-api arma la función en el servidor: no hace falta Docker.
  const r = supabase(['functions', 'deploy', funcion, '--project-ref', PROYECTO, '--no-verify-jwt', '--use-api']);
  console.log(r.ok ? `${funcion}: desplegada.` : `${funcion}: falló.\n${r.salida.slice(-1500)}`);
  if (!r.ok) fallas++;
}
process.exit(fallas ? 1 : 0);
