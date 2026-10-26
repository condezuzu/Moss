// Corre supabase/functions/moss-vincular/index.ts en Node (con tipos borrados) contra Auth y PostgREST
// de mentira: que revisa las dos sesiones antes de guardar, que cada cuenta va de su lado según desde
// qué app se vincula, que responde lo que dice el contrato y que ningún token aparece en los logs ni
// en las respuestas. Lo mismo contra la base de verdad (las migraciones en PGlite) está en
// `npm run supabase:verificar`.
// Uso: node herramientas/probar-vincular.mjs
import assert from 'node:assert/strict';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const archivo = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '../supabase/functions/moss-vincular/index.ts');

// --- Secretos que nunca pueden aparecer en los logs ni en las respuestas ---
const DE_MOSS = 'TOKEN_DE_MOSS_SECRETO';
const DE_ASCENT = 'TOKEN_DE_ASCENT_SECRETO';
const CLAVE = 'sb_secret_CLAVE_SECRETA';
const VIEJA = 'eyJ.SERVICE_ROLE_SECRETA.firma';
const secretos = [DE_MOSS, DE_ASCENT, CLAVE, VIEJA];
const MOSS = '11111111-1111-4111-8111-111111111111';
const ASCENT = '22222222-2222-4222-8222-222222222222';

const base = () => ({ SUPABASE_URL: 'https://proyecto.supabase.co', SUPABASE_SECRET_KEYS: JSON.stringify({ default: CLAVE }), SUPABASE_SERVICE_ROLE_KEY: VIEJA });
let env = base();
globalThis.Deno = { env: { get: (k) => env[k] } };

// --- Auth y PostgREST de mentira ---
const json = (estado, cuerpo) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
const usuarios = { [DE_MOSS]: MOSS, [DE_ASCENT]: ASCENT };
const normal = () => ({
  user: (token) => (usuarios[token] ? json(200, { id: usuarios[token], aud: 'authenticated' }) : json(403, { code: 'bad_jwt', message: 'invalid JWT' })),
  rpc: () => json(200, { nombre: 'agus' }),
});
let escenario = normal();
let llamadas = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const headers = new Headers(init.headers);
  assert.ok(init.signal instanceof AbortSignal, 'cada pedido lleva un tope de tiempo');
  const cuerpo = init.body === undefined ? undefined : String(init.body);
  llamadas.push({ u, metodo: init.method ?? 'GET', headers, cuerpo });
  if (u === 'https://proyecto.supabase.co/auth/v1/user') return escenario.user(/^Bearer (.+)$/.exec(headers.get('authorization') ?? '')?.[1], headers);
  if (u === 'https://proyecto.supabase.co/rest/v1/rpc/vincular_cuentas') return escenario.rpc(JSON.parse(cuerpo), headers);
  throw new Error(`pedido inesperado a ${u}`);
};

// --- Los logs ---
const logs = [];
console.error = (...partes) => logs.push(partes.map(String).join(' '));
console.log = (...partes) => logs.push(partes.map(String).join(' '));

const { default: funcion } = await import(pathToFileURL(archivo).href);

async function llamar({ metodo = 'POST', autorizacion = `Bearer ${DE_MOSS}`, cuerpo = { otra: DE_ASCENT, desde: 'moss' } } = {}) {
  llamadas = [];
  const headers = {};
  if (autorizacion) headers.Authorization = autorizacion;
  const texto = typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo);
  const r = await funcion.fetch(new Request('https://proyecto.supabase.co/functions/v1/moss-vincular', { method: metodo, headers, body: metodo === 'GET' ? undefined : texto }));
  const respuesta = await r.text();
  for (const s of secretos) assert.ok(!respuesta.includes(s), `la respuesta no lleva ${s}`);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
  return { estado: r.status, cuerpo: JSON.parse(respuesta), rutas: llamadas.map((l) => `${l.metodo} ${l.u.replace('https://proyecto.supabase.co', '')}`) };
}
const USER = 'GET /auth/v1/user';
const RPC = 'POST /rest/v1/rpc/vincular_cuentas';

const casos = [];
const caso = (nombre, f) => casos.push([nombre, f]);

caso('sin Authorization: 401 sin_sesion, sin preguntarle a nadie', async () => {
  for (const autorizacion of [null, 'Basic abc', 'Bearer ']) {
    const r = await llamar({ autorizacion });
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [401, { error: 'sin_sesion' }, []], String(autorizacion));
  }
});

caso('otro método: 405', async () => {
  const r = await llamar({ metodo: 'GET' });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [405, { error: 'metodo' }, []]);
});

caso('cuerpos que no son { otra, desde }: 400 pedido, sin pedidos', async () => {
  const malos = ['no es json', '', '[]', '5', '{}', { otra: '' , desde: 'moss' }, { otra: DE_ASCENT }, { otra: DE_ASCENT, desde: 'web' },
    { otra: 5, desde: 'moss' }, { otra: 'x'.repeat(9000), desde: 'moss' }, { otra: 'con espacio', desde: 'ascent' }, { desde: 'moss' }];
  for (const cuerpo of malos) {
    const r = await llamar({ cuerpo });
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [400, { error: 'pedido' }, []], JSON.stringify(cuerpo));
  }
});

caso('desde Moss: revisa las dos sesiones y guarda Moss de un lado y Ascent del otro', async () => {
  const r = await llamar();
  assert.deepEqual([r.estado, r.cuerpo], [200, { ok: true, nombre: 'agus' }]);
  assert.deepEqual(r.rutas, [USER, USER, RPC]);
  const [a, b, rpc] = llamadas;
  assert.deepEqual([a.headers.get('authorization'), b.headers.get('authorization')].sort(), [`Bearer ${DE_ASCENT}`, `Bearer ${DE_MOSS}`]);
  for (const l of [a, b]) assert.equal(l.headers.get('apikey'), CLAVE);
  assert.deepEqual(JSON.parse(rpc.cuerpo), { cuenta_moss: MOSS, cuenta_ascent: ASCENT, origen: 'moss' });
  assert.equal(rpc.headers.get('apikey'), CLAVE);
  assert.equal(rpc.headers.get('authorization'), `Bearer ${CLAVE}`);
  assert.equal(rpc.headers.get('content-profile'), 'moss');
  assert.match(rpc.headers.get('content-type'), /^application\/json/);
});

caso('desde Ascent: al revés, y el origen lo dice', async () => {
  const r = await llamar({ autorizacion: `bearer ${DE_ASCENT}`, cuerpo: { otra: DE_MOSS, desde: 'ascent' } });
  assert.deepEqual([r.estado, r.cuerpo], [200, { ok: true, nombre: 'agus' }]);
  assert.deepEqual(JSON.parse(llamadas[2].cuerpo), { cuenta_moss: MOSS, cuenta_ascent: ASCENT, origen: 'ascent' });
});

caso('la misma cuenta en las dos apps: se vincula consigo misma', async () => {
  const r = await llamar({ cuerpo: { otra: DE_MOSS, desde: 'moss' } });
  assert.equal(r.estado, 200);
  assert.deepEqual(JSON.parse(llamadas[2].cuerpo), { cuenta_moss: MOSS, cuenta_ascent: MOSS, origen: 'moss' });
});

caso('la sesión propia vencida o borrada: 401 sin_sesion, sin guardar', async () => {
  for (const respuesta of [() => json(401, { code: 'bad_jwt' }), () => json(403, { code: 'session_not_found' }), () => json(404, { code: 'user_not_found' }), () => json(403, { error_code: 'user_not_found' })]) {
    escenario.user = (token) => (token === DE_MOSS ? respuesta() : json(200, { id: ASCENT }));
    const r = await llamar();
    assert.deepEqual([r.estado, r.cuerpo], [401, { error: 'sin_sesion' }]);
    assert.ok(!r.rutas.includes(RPC));
  }
});

caso('la otra sesión vencida o que no es una sesión: 401 vencida, sin guardar', async () => {
  const r = await llamar({ cuerpo: { otra: 'eyJ.otro.token', desde: 'moss' } });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [401, { error: 'vencida' }, [USER, USER]]);
  escenario.user = (token) => (token === DE_ASCENT ? json(404, { code: 'user_not_found' }) : json(200, { id: MOSS }));
  assert.deepEqual((await llamar()).cuerpo, { error: 'vencida' });
});

caso('las dos vencidas: sin_sesion primero', async () => {
  escenario.user = () => json(401, { code: 'bad_jwt' });
  assert.deepEqual((await llamar()).cuerpo, { error: 'sin_sesion' });
});

caso('Auth caído o sin responder: 502 interno, sin guardar', async () => {
  for (const respuesta of [() => json(500, { message: 'boom' }), () => { throw new TypeError('network'); }, () => json(200, { sin: 'id' })]) {
    escenario.user = (token) => (token === DE_ASCENT ? respuesta() : json(200, { id: MOSS }));
    const r = await llamar();
    assert.deepEqual([r.estado, r.cuerpo], [502, { error: 'interno' }]);
    assert.ok(!r.rutas.includes(RPC));
  }
});

caso('la cuenta de Ascent sin nombre de usuario (nunca usó Ascent): 409 sin_ascent', async () => {
  escenario.rpc = () => json(400, { code: 'P0001', message: 'sin_ascent', details: null, hint: null });
  assert.deepEqual([(await llamar()).estado, (await llamar()).cuerpo], [409, { error: 'sin_ascent' }]);
});

caso('la base falla: 500 interno con el código en el log, nunca 404', async () => {
  for (const [estado, code] of [[404, 'PGRST202'], [406, 'PGRST106'], [409, '23505'], [500, 'XX000'], [401, 'PGRST301']]) {
    escenario.rpc = () => json(estado, { code, message: `algo con ${DE_ASCENT}` });
    const r = await llamar();
    assert.deepEqual([r.estado, r.cuerpo], [500, { error: 'interno' }], code);
    assert.ok(logs.some((l) => l.includes(String(estado)) && l.includes(code)), `el log dice ${estado} ${code}`);
  }
  escenario.rpc = () => json(200, 'no es lo esperado');
  assert.deepEqual((await llamar()).cuerpo, { error: 'interno' });
  escenario.rpc = () => { throw new DOMException('timeout', 'TimeoutError'); };
  assert.deepEqual([(await llamar()).estado, (await llamar()).cuerpo], [502, { error: 'interno' }]);
});

caso('sin las claves nuevas usa la service_role; sin nada, 500 configuracion', async () => {
  for (const claves of [undefined, 'no es json', '{}', '{"default":""}']) {
    env = { ...base(), SUPABASE_SECRET_KEYS: claves };
    const r = await llamar();
    assert.equal(r.estado, 200);
    assert.equal(llamadas[0].headers.get('apikey'), VIEJA);
    assert.equal(llamadas[2].headers.get('authorization'), `Bearer ${VIEJA}`);
  }
  env = { ...base(), SUPABASE_SECRET_KEYS: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined };
  assert.deepEqual([(await llamar()).estado, (await llamar()).cuerpo, (await llamar()).rutas], [500, { error: 'configuracion' }, []]);
  env = { ...base(), SUPABASE_URL: undefined };
  assert.deepEqual((await llamar()).cuerpo, { error: 'configuracion' });
  env = { ...base(), SUPABASE_URL: 'https://proyecto.supabase.co/' };
  assert.equal((await llamar()).estado, 200);
});

caso('nunca responde 404 (para la app es «no está desplegada»)', async () => {
  escenario.user = () => json(404, { code: 'not_found' });
  assert.notEqual((await llamar()).estado, 404);
});

let fallas = 0;
for (const [nombre, f] of casos) {
  env = base();
  escenario = normal();
  try {
    await f();
    process.stdout.write(`ok   ${nombre}\n`);
  } catch (e) {
    fallas++;
    process.stdout.write(`MAL  ${nombre}\n     ${e.message}\n`);
  }
}

// Los logs: solo pasos, estados y códigos.
for (const linea of logs) for (const s of secretos) if (linea.includes(s)) { fallas++; process.stdout.write(`MAL  un log lleva un secreto: ${linea}\n`); }
process.stdout.write(`\n${logs.length} líneas de log, por ejemplo:\n${[...new Set(logs)].slice(0, 12).map((l) => `  ${l}`).join('\n')}\n`);
process.stdout.write(fallas ? `\n${fallas} fallas\n` : `\n${casos.length} casos bien\n`);
process.exit(fallas ? 1 : 0);
