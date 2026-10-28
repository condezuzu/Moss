// Corre supabase/functions/moss-borrar-cuenta/index.ts en Node (con tipos borrados) contra Apple, Auth
// y PostgREST de mentira: que revoca Apple antes de borrar, que no borra nada si Apple o la
// configuración fallan, que borra lo de Moss y después el usuario solo si es solo de Moss (si también
// es la cuenta de Ascent, le quita Apple y nada más), y que ningún token aparece en los logs ni en las
// respuestas. Lo mismo contra la base (PGlite), en `npm run supabase:verificar`, sección 8.
// Uso: node herramientas/probar-borrar-cuenta.mjs
import assert from 'node:assert/strict';
import { generateKeyPairSync, verify } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const archivo = process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '../supabase/functions/moss-borrar-cuenta/index.ts');

// --- Claves: una P-256 como la de Apple (PKCS#8 con los parámetros y la pública adentro) ---
const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
const largo = (n) => (n < 0x80 ? Buffer.from([n]) : n < 0x100 ? Buffer.from([0x81, n]) : Buffer.from([0x82, n >> 8, n & 0xff]));
const der = (etiqueta, contenido) => Buffer.concat([Buffer.from([etiqueta]), largo(contenido.length), contenido]);
const sec1 = privateKey.export({ type: 'sec1', format: 'der' });
const algoritmo = Buffer.from('301306072a8648ce3d020106082a8648ce3d030107', 'hex');
const pkcs8Apple = der(0x30, Buffer.concat([Buffer.from('020100', 'hex'), algoritmo, der(0x04, sec1)]));
const base64Apple = pkcs8Apple.toString('base64');
assert.ok(base64Apple.startsWith('MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg'), 'la clave de prueba tiene el formato de las .p8 de Apple');
const pemApple = `-----BEGIN PRIVATE KEY-----\n${base64Apple.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----`;
const pemNode = privateKey.export({ type: 'pkcs8', format: 'pem' });

// --- Secretos que nunca pueden aparecer en los logs ni en las respuestas ---
const JWT = 'JWT_DEL_USUARIO_SECRETO';
const CODIGO = 'CODIGO_APPLE_SECRETO';
const REFRESCO = 'TOKEN_DE_REFRESCO_SECRETO';
const ACCESO = 'TOKEN_DE_ACCESO_SECRETO';
const ID_TOKEN = 'ID_TOKEN_SECRETO';
const CLAVE = 'sb_secret_CLAVE_SECRETA';
const VIEJA = 'eyJ.SERVICE_ROLE_SECRETA.firma';
const ID = '715ed5db-f090-4b8c-a067-640ecee36aa0';
// El identity_id de cada fila de identidad (el que se quita) y el sub de Apple (el id del proveedor).
const IDENTIDAD_APPLE = '9b0c1e7e-4d1b-4f35-9a52-2a6f3f0c7d11';
const IDENTIDAD_CORREO = '3f8e2a40-5f0e-4c8f-8e3e-0d5b9f6a1c22';
const SUB_APPLE = '001234.abcdef0123456789.0123';
const secretos = [JWT, CODIGO, REFRESCO, ACCESO, ID_TOKEN, CLAVE, VIEJA, base64Apple.slice(20, 60)];

const base = () => ({
  SUPABASE_URL: 'https://proyecto.supabase.co',
  SUPABASE_SECRET_KEYS: JSON.stringify({ default: CLAVE }),
  SUPABASE_SERVICE_ROLE_KEY: VIEJA,
  APPLE_TEAM_ID: 'XF9N8X9KJG',
  APPLE_KEY_ID: 'ABC123DEFG',
  APPLE_PRIVATE_KEY: pemApple,
});
let env = base();
globalThis.Deno = { env: { get: (k) => env[k] } };

// --- Apple y Auth de mentira ---
const json = (estado, cuerpo) => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado, headers: { 'Content-Type': 'application/json' } });
const normal = () => ({
  user: () => json(200, { id: ID, email: 'a@b.c', identities: [{ identity_id: IDENTIDAD_APPLE, id: SUB_APPLE, user_id: ID, provider: 'apple' }] }),
  moss: () => new Response(null, { status: 204 }),
  quitar: () => json(200, {}),
  token: () => json(200, { access_token: ACCESO, token_type: 'Bearer', expires_in: 3600, refresh_token: REFRESCO, id_token: ID_TOKEN }),
  revoke: () => new Response(null, { status: 200 }),
  borrar: () => json(200, {}),
});
let escenario = normal();
let llamadas = [];
const secretosDeCliente = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  const headers = new Headers(init.headers);
  assert.ok(init.signal instanceof AbortSignal, 'cada pedido lleva un tope de tiempo');
  const cuerpo = init.body === undefined ? undefined : String(init.body);
  llamadas.push({ u, metodo: init.method ?? 'GET', headers, cuerpo });
  if (u === 'https://proyecto.supabase.co/auth/v1/user') return escenario.user(headers);
  if (u === 'https://appleid.apple.com/auth/token' || u === 'https://appleid.apple.com/auth/revoke') {
    assert.equal(init.method, 'POST');
    assert.match(headers.get('content-type'), /^application\/x-www-form-urlencoded/);
    const form = new URLSearchParams(cuerpo);
    secretosDeCliente.push(form.get('client_secret'));
    return u.endsWith('/token') ? escenario.token(form) : escenario.revoke(form);
  }
  if (u.startsWith('https://proyecto.supabase.co/auth/v1/admin/users/')) return escenario.borrar(u, headers);
  if (u === 'https://proyecto.supabase.co/rest/v1/rpc/borrar_cuenta') return escenario.moss(headers, cuerpo);
  if (u.startsWith('https://proyecto.supabase.co/auth/v1/user/identities/')) return escenario.quitar(u, headers);
  throw new Error(`pedido inesperado a ${u}`);
};

// --- Los logs ---
const logs = [];
console.error = (...partes) => logs.push(partes.map(String).join(' '));
console.log = (...partes) => logs.push(partes.map(String).join(' '));

const { default: funcion } = await import(pathToFileURL(archivo).href);

async function llamar({ metodo = 'POST', autorizacion = `Bearer ${JWT}`, cuerpo } = {}) {
  llamadas = [];
  const headers = {};
  if (autorizacion) headers.Authorization = autorizacion;
  if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
  const r = await funcion.fetch(new Request('https://proyecto.supabase.co/functions/v1/moss-borrar-cuenta', { method: metodo, headers, body: metodo === 'GET' ? undefined : cuerpo }));
  const texto = await r.text();
  for (const s of secretos) assert.ok(!texto.includes(s), `la respuesta no lleva ${s}`);
  assert.match(r.headers.get('content-type') ?? '', /application\/json/);
  return { estado: r.status, cuerpo: JSON.parse(texto), rutas: llamadas.map((l) => `${l.metodo} ${l.u.replace('https://proyecto.supabase.co', '').replace('https://appleid.apple.com', 'apple')}`) };
}

function verificarSecreto(secreto, cliente = 'uy.moss.app') {
  const [h, p, s] = secreto.split('.');
  assert.ok(verify('sha256', Buffer.from(`${h}.${p}`), { key: publicKey, dsaEncoding: 'ieee-p1363' }, Buffer.from(s, 'base64url')), 'la firma ES256 verifica con la clave pública');
  assert.deepEqual(JSON.parse(Buffer.from(h, 'base64url')), { alg: 'ES256', kid: 'ABC123DEFG' });
  const datos = JSON.parse(Buffer.from(p, 'base64url'));
  assert.equal(datos.iss, 'XF9N8X9KJG');
  assert.equal(datos.aud, 'https://appleid.apple.com');
  assert.equal(datos.sub, cliente);
  assert.equal(datos.exp - datos.iat, 300);
  assert.ok(Math.abs(datos.iat - Date.now() / 1000) < 5);
  assert.deepEqual(Object.keys(datos).sort(), ['aud', 'exp', 'iat', 'iss', 'sub']);
}

const casos = [];
const caso = (nombre, f) => casos.push([nombre, f]);
const conApple = JSON.stringify({ codigoDeApple: CODIGO });

caso('sin Authorization: 401 sin preguntarle a nadie', async () => {
  const r = await llamar({ autorizacion: null });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [401, { error: 'sin_sesion' }, []]);
});

caso('otro método: 405', async () => {
  const r = await llamar({ metodo: 'GET' });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [405, { error: 'metodo' }, []]);
});

caso('cuerpos que no son { codigoDeApple }: 400 sin pedidos', async () => {
  for (const cuerpo of ['no es json', '[]', '5', '{"codigoDeApple":5}', '{"codigoDeApple":""}', JSON.stringify({ codigoDeApple: 'x'.repeat(3000) })]) {
    const r = await llamar({ cuerpo });
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [400, { error: 'pedido' }, []], cuerpo);
  }
});

caso('sesión vencida o inválida: 401, ni Apple ni borrar', async () => {
  for (const estado of [401, 403]) {
    escenario.user = () => json(estado, { code: 'bad_jwt', message: 'invalid JWT' });
    const r = await llamar({ cuerpo: conApple });
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [401, { error: 'sin_sesion' }, ['GET /auth/v1/user']]);
  }
});

caso('el usuario ya no existe (se perdió la respuesta del primer intento): ok, sin hacer nada', async () => {
  escenario.user = () => json(403, { code: 'user_not_found', message: 'User from sub claim in JWT does not exist' });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true }, ['GET /auth/v1/user']]);
  escenario.user = () => json(403, { code: 403, error_code: 'user_not_found', msg: 'x' });
  assert.equal((await llamar()).estado, 200);
});

caso('Auth caído o sin responder: 502 auth', async () => {
  escenario.user = () => json(500, { message: 'boom' });
  let r = await llamar();
  assert.deepEqual([r.estado, r.cuerpo], [502, { error: 'auth' }]);
  escenario.user = () => { throw new TypeError('network'); };
  r = await llamar();
  assert.deepEqual([r.estado, r.cuerpo], [502, { error: 'auth' }]);
});

const SOLO_MOSS = ['GET /auth/v1/user', 'POST /rest/v1/rpc/borrar_cuenta', `DELETE /auth/v1/admin/users/${ID}`];

caso('sin código: verifica con Auth, borra lo de Moss y, si es solo de Moss, el usuario, con la clave secreta', async () => {
  const r = await llamar();
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true }, SOLO_MOSS]);
  const [usuario, moss, borrar] = llamadas;
  assert.equal(usuario.headers.get('apikey'), CLAVE);
  assert.equal(usuario.headers.get('authorization'), `Bearer ${JWT}`);
  assert.equal(moss.headers.get('apikey'), CLAVE);
  assert.equal(moss.headers.get('authorization'), `Bearer ${CLAVE}`);
  assert.equal(moss.headers.get('content-profile'), 'moss');
  assert.deepEqual(JSON.parse(moss.cuerpo), { cuenta: ID });
  assert.equal(borrar.headers.get('apikey'), CLAVE);
  assert.equal(borrar.headers.get('authorization'), `Bearer ${CLAVE}`);
  assert.deepEqual(JSON.parse(borrar.cuerpo), { should_soft_delete: false });
  // Un cuerpo vacío o {} también es «sin Apple».
  assert.equal((await llamar({ cuerpo: '{}' })).estado, 200);
  assert.equal((await llamar({ cuerpo: '{"codigoDeApple":null}' })).rutas.length, 3);
});

caso('solo de Moss (solo Apple, aunque sean dos identidades de Apple): borra lo de Moss y el usuario de Auth', async () => {
  escenario.user = () => json(200, { id: ID, identities: [{ identity_id: IDENTIDAD_APPLE, provider: 'apple' }, { identity_id: IDENTIDAD_CORREO, provider: 'apple' }] });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true }, ['GET /auth/v1/user', 'POST apple/auth/token', 'POST apple/auth/revoke', ...SOLO_MOSS.slice(1)]]);
});

caso('la misma cuenta que Ascent (Apple y el correo): borra lo de Moss y le quita Apple con la sesión de quien llama; el usuario sigue', async () => {
  escenario.user = () => json(200, { id: ID, identities: [{ identity_id: IDENTIDAD_CORREO, id: ID, provider: 'email' }, { identity_id: IDENTIDAD_APPLE, id: SUB_APPLE, provider: 'apple' }] });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true, queda: true },
    ['GET /auth/v1/user', 'POST apple/auth/token', 'POST apple/auth/revoke', 'POST /rest/v1/rpc/borrar_cuenta', `DELETE /auth/v1/user/identities/${IDENTIDAD_APPLE}`]]);
  const quitar = llamadas.at(-1);
  assert.equal(quitar.headers.get('apikey'), CLAVE);
  assert.equal(quitar.headers.get('authorization'), `Bearer ${JWT}`);
  assert.equal(quitar.headers.get('x-supabase-api-version'), '2024-01-01');
  assert.ok(!r.rutas.some((x) => x.includes('/admin/')), 'nunca borra el usuario de Auth');
});

caso('la misma cuenta que Ascent, ya sin Apple (un intento anterior se la quitó): borra lo de Moss y nada más', async () => {
  escenario.user = () => json(200, { id: ID, identities: [{ identity_id: IDENTIDAD_CORREO, provider: 'email' }] });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas.at(-1)], [200, { ok: true, queda: true }, 'POST /rest/v1/rpc/borrar_cuenta']);
});

caso('sin identidades a la vista no se borra el usuario: podría ser de Ascent', async () => {
  for (const identities of [undefined, [], 'x', [{ sin: 'proveedor' }]]) {
    escenario.user = () => json(200, { id: ID, identities });
    const r = await llamar();
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true, queda: true }, ['GET /auth/v1/user', 'POST /rest/v1/rpc/borrar_cuenta']], JSON.stringify(identities));
  }
});

caso('quitar Apple: sin «Allow manual linking», 500 configuracion; si ya no estaba, ok; otro error, 500 separar', async () => {
  escenario.user = () => json(200, { id: ID, identities: [{ identity_id: IDENTIDAD_CORREO, provider: 'email' }, { identity_id: IDENTIDAD_APPLE, provider: 'apple' }] });
  escenario.quitar = () => json(404, { code: 'manual_linking_disabled', message: 'Manual linking is disabled' });
  assert.deepEqual((await llamar()).cuerpo, { error: 'configuracion' });
  escenario.quitar = () => json(422, { code: 'identity_not_found', message: 'Identity does not exist' });
  assert.deepEqual((await llamar()).cuerpo, { ok: true, queda: true });
  escenario.quitar = () => json(422, { code: 'email_conflict_identity_not_deletable', message: `x ${JWT}` });
  const conflicto = await llamar();
  assert.deepEqual([conflicto.estado, conflicto.cuerpo], [500, { error: 'separar' }]);
  escenario.quitar = () => { throw new TypeError('network'); };
  assert.deepEqual((await llamar()).cuerpo, { error: 'separar' });
  escenario.user = () => json(200, { id: ID, identities: [{ provider: 'email' }, { provider: 'apple' }] });
  assert.deepEqual((await llamar()).cuerpo, { error: 'separar' }, 'sin identity_id no se puede quitar');
});

caso('si no se puede borrar lo de Moss: 500 borrar, y ni el usuario ni Apple en Auth se tocan', async () => {
  for (const moss of [() => json(404, { code: 'PGRST202', message: 'no existe' }), () => json(500, { code: '23503', message: `x ${CLAVE}` }), () => { throw new TypeError('network'); }]) {
    escenario.moss = moss;
    const r = await llamar();
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [500, { error: 'borrar' }, ['GET /auth/v1/user', 'POST /rest/v1/rpc/borrar_cuenta']]);
  }
});

caso('Apple: canjea el código, revoca el de refresco y recién ahí borra', async () => {
  secretosDeCliente.length = 0;
  const r = await llamar({ cuerpo: conApple, autorizacion: `bearer ${JWT}` });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [200, { ok: true }, ['GET /auth/v1/user', 'POST apple/auth/token', 'POST apple/auth/revoke', ...SOLO_MOSS.slice(1)]]);
  const canje = new URLSearchParams(llamadas[1].cuerpo);
  assert.deepEqual([...canje.keys()].sort(), ['client_id', 'client_secret', 'code', 'grant_type']);
  assert.deepEqual([canje.get('client_id'), canje.get('code'), canje.get('grant_type')], ['uy.moss.app', CODIGO, 'authorization_code']);
  const revocar = new URLSearchParams(llamadas[2].cuerpo);
  assert.deepEqual([...revocar.keys()].sort(), ['client_id', 'client_secret', 'token', 'token_type_hint']);
  assert.deepEqual([revocar.get('client_id'), revocar.get('token'), revocar.get('token_type_hint')], ['uy.moss.app', REFRESCO, 'refresh_token']);
  for (const s of secretosDeCliente) verificarSecreto(s);
  secretos.push(...secretosDeCliente);
});

caso('Apple: código vencido o usado: 502 con lo que dijo Apple, sin borrar', async () => {
  escenario.token = () => json(400, { error: 'invalid_grant' });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [502, { error: 'apple', apple: 'invalid_grant' }, ['GET /auth/v1/user', 'POST apple/auth/token']]);
});

caso('Apple: un error raro no se repite tal cual', async () => {
  escenario.token = () => json(400, { error: `algo ${REFRESCO}` });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual(r.cuerpo, { error: 'apple', apple: 'http_400' });
  escenario.token = () => new Response('<html>caído</html>', { status: 503 });
  assert.deepEqual((await llamar({ cuerpo: conApple })).cuerpo, { error: 'apple', apple: 'http_503' });
});

caso('Apple: no revoca: 502, sin borrar', async () => {
  escenario.revoke = () => json(400, { error: 'invalid_request' });
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [502, { error: 'apple', apple: 'invalid_request' }, ['GET /auth/v1/user', 'POST apple/auth/token', 'POST apple/auth/revoke']]);
});

caso('Apple no responde: 502 sin_respuesta, sin borrar', async () => {
  escenario.token = () => { throw new DOMException('timeout', 'TimeoutError'); };
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [502, { error: 'apple', apple: 'sin_respuesta' }, ['GET /auth/v1/user', 'POST apple/auth/token']]);
});

caso('Apple sin token de refresco: revoca el de acceso', async () => {
  escenario.token = () => json(200, { access_token: ACCESO, token_type: 'Bearer', expires_in: 3600, id_token: ID_TOKEN });
  const r = await llamar({ cuerpo: conApple });
  assert.equal(r.estado, 200);
  const revocar = new URLSearchParams(llamadas[2].cuerpo);
  assert.deepEqual([revocar.get('token'), revocar.get('token_type_hint')], [ACCESO, 'access_token']);
  escenario.token = () => json(200, { token_type: 'Bearer' });
  assert.deepEqual((await llamar({ cuerpo: conApple })).cuerpo, { error: 'apple', apple: 'sin_token' });
});

caso('faltan secretos de Apple: 500, ni Apple ni borrar', async () => {
  for (const falta of ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY']) {
    env = base();
    delete env[falta];
    const r = await llamar({ cuerpo: conApple });
    assert.deepEqual([r.estado, r.cuerpo, r.rutas], [500, { error: 'configuracion' }, ['GET /auth/v1/user']], falta);
  }
  // Sin código, faltar Apple no importa.
  assert.equal((await llamar()).estado, 200);
});

caso('la clave de Apple ilegible: 502 clave, sin borrar', async () => {
  env.APPLE_PRIVATE_KEY = 'esto no es una clave';
  const r = await llamar({ cuerpo: conApple });
  assert.deepEqual([r.estado, r.cuerpo, r.rutas], [502, { error: 'apple', apple: 'clave' }, ['GET /auth/v1/user']]);
});

caso('la .p8 sirve entera, en una línea con \\n, solo el base64, o como la exporta Node', async () => {
  const variantes = {
    entera: pemApple,
    'con \\n': pemApple.replace(/\n/g, '\\n'),
    'con \\r\\n': pemApple.replace(/\n/g, '\r\n'),
    'solo el base64': base64Apple,
    node: pemNode,
  };
  for (const [nombre, clave] of Object.entries(variantes)) {
    env = { ...base(), APPLE_PRIVATE_KEY: clave };
    secretosDeCliente.length = 0;
    const r = await llamar({ cuerpo: conApple });
    assert.equal(r.estado, 200, nombre);
    verificarSecreto(secretosDeCliente[0]);
    secretos.push(...secretosDeCliente);
  }
});

caso('APPLE_CLIENT_ID cambia el client_id y el sub del secreto', async () => {
  env.APPLE_CLIENT_ID = 'uy.otra.app';
  secretosDeCliente.length = 0;
  await llamar({ cuerpo: conApple });
  assert.equal(new URLSearchParams(llamadas[1].cuerpo).get('client_id'), 'uy.otra.app');
  verificarSecreto(secretosDeCliente[0], 'uy.otra.app');
  secretos.push(...secretosDeCliente);
});

caso('Auth no borra: 500 borrar; si ya no estaba (404), ok', async () => {
  escenario.borrar = () => json(500, { msg: 'Database error deleting user' });
  assert.deepEqual((await llamar()).cuerpo, { error: 'borrar' });
  escenario.borrar = () => { throw new TypeError('network'); };
  assert.deepEqual((await llamar()).cuerpo, { error: 'borrar' });
  escenario.borrar = () => json(404, { code: 'user_not_found' });
  assert.deepEqual((await llamar()).cuerpo, { ok: true });
});

caso('sin las claves nuevas usa la service_role; sin nada, 500', async () => {
  for (const claves of [undefined, 'no es json', '{}', '{"default":""}']) {
    env = { ...base(), SUPABASE_SECRET_KEYS: claves };
    const r = await llamar();
    assert.equal(r.estado, 200);
    assert.equal(llamadas[0].headers.get('apikey'), VIEJA);
    assert.equal(llamadas[1].headers.get('authorization'), `Bearer ${VIEJA}`);
    assert.equal(llamadas[2].headers.get('authorization'), `Bearer ${VIEJA}`);
  }
  env = { ...base(), SUPABASE_SECRET_KEYS: undefined, SUPABASE_SERVICE_ROLE_KEY: undefined };
  assert.deepEqual([(await llamar()).estado, (await llamar()).cuerpo], [500, { error: 'configuracion' }]);
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
