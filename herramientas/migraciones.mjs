// Las migraciones de Moss (supabase/moss/NNNN_*.sql) contra el proyecto real, con el CLI de Supabase
// (antes, una vez: `npx supabase login` y `npx supabase link --project-ref okeanaihymbvbdmrdqph`).
//
//   npm run migraciones                 cuáles están aplicadas y cuáles faltan
//   npm run migraciones -- --aplicar    aplica las que faltan, en orden, cada una en su transacción
//   npm run migraciones -- --marcar 0003 0004   las anota como aplicadas sin correrlas (las que se
//                                       pegaron a mano en el SQL Editor)
//
// El historial del CLI (supabase_migrations.schema_migrations) es de Ascent: tiene sus versiones
// 001…0NN y su `db push` se traba si aparecen versiones que su repo no tiene. Por eso Moss lleva el
// suyo en `moss.migraciones`, dentro de su esquema, y aplica con `db query` en vez de `db push`.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const carpeta = join(raiz, 'supabase', 'moss');

function supabase(args) {
  const r = spawnSync('npx', ['--yes', 'supabase@latest', ...args], { cwd: raiz, encoding: 'utf8', shell: process.platform === 'win32', input: '' });
  return { ok: r.status === 0, datos: r.stdout ?? '', salida: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const temporal = mkdtempSync(join(tmpdir(), 'moss-migracion-'));
let consultas = 0;

/** Corre SQL en la base del proyecto conectado: las filas, o el error. Siempre por archivo, así la shell no parte el SQL. */
function consultar(sql, archivo) {
  if (!archivo) {
    archivo = join(temporal, `consulta-${++consultas}.sql`);
    writeFileSync(archivo, sql);
  }
  const r = supabase(['db', 'query', '--linked', '-f', archivo]);
  const json = r.datos.slice(r.datos.indexOf('{'), r.datos.lastIndexOf('}') + 1);
  try {
    if (!r.ok) throw new Error();
    return { filas: JSON.parse(json).rows ?? [] };
  } catch {
    return { error: r.salida.slice(-2000) };
  }
}

const locales = readdirSync(carpeta)
  .map((f) => /^(\d{4})_(.+)\.sql$/.exec(f))
  .filter(Boolean)
  .map(([archivo, numero, nombre]) => ({ archivo, numero, nombre }))
  .sort((a, b) => a.numero.localeCompare(b.numero));

const HISTORIAL = `create table if not exists moss.migraciones (
  numero text primary key,
  nombre text not null,
  aplicada timestamptz not null default now()
);
alter table moss.migraciones enable row level security;
revoke all on moss.migraciones from anon, authenticated;`;
const anotar = (l) => `${HISTORIAL}\ninsert into moss.migraciones (numero, nombre) values ('${l.numero}', '${l.nombre}') on conflict do nothing;`;

// Postgres valida los nombres antes de correr: si la tabla no existe todavía, se pregunta aparte.
const existe = consultar(`select to_regclass('moss.migraciones') is not null as hay`);
const leidas = existe.filas?.[0]?.hay ? consultar('select numero from moss.migraciones') : existe.error ? existe : { filas: [] };
if (leidas.error) {
  console.log(`No pude leer la base:\n${leidas.error}`);
  process.exit(1);
}
const aplicadas = new Set(leidas.filas.map((f) => f.numero).filter(Boolean));

const [modo, ...numeros] = process.argv.slice(2);

if (modo === '--marcar') {
  for (const n of numeros) {
    const l = locales.find((x) => x.numero === n.padStart(4, '0'));
    if (!l) { console.log(`${n}: no hay migración con ese número`); process.exit(1); }
    const archivo = join(temporal, `marcar-${l.numero}.sql`);
    writeFileSync(archivo, `begin;\n${anotar(l)}\ncommit;\n`);
    const r = consultar(null, archivo);
    console.log(`${l.numero} ${l.nombre}: ${r.error ? `falló\n${r.error}` : 'anotada como aplicada'}`);
  }
  process.exit(0);
}

const faltan = locales.filter((l) => !aplicadas.has(l.numero));
for (const l of locales) console.log(`${l.numero} ${l.nombre}: ${aplicadas.has(l.numero) ? 'aplicada' : 'falta'}`);
if (modo !== '--aplicar' || !faltan.length) process.exit(0);

for (const l of faltan) {
  const sql = readFileSync(join(carpeta, l.archivo), 'utf8');
  const archivo = join(temporal, l.archivo);
  // Cada una entera o nada, con su anotación adentro: si algo falla, la base queda como estaba.
  writeFileSync(archivo, `begin;\n${sql}\n;\n${anotar(l)}\ncommit;\n`);
  const r = consultar(null, archivo);
  if (r.error) {
    console.log(`\n${l.numero} falló, no sigo:\n${r.error}`);
    process.exit(1);
  }
  console.log(`${l.numero} ${l.nombre}: aplicada`);
}
