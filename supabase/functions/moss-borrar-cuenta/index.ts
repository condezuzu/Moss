// moss-borrar-cuenta: «Borrar la cuenta» de Perfil. Borra la cuenta de Moss de quien llama y, si usa
// Sign in with Apple, antes revoca su autorización con la API REST de Apple, como pide la App Store
// (5.1.1(v), spec/revision.md). La app manda un código nuevo de Apple; si Apple falla, no se borra
// nada.
//
// La cuenta de Moss y la de Ascent son dos cuentas (spec/ascent.md, «Dos cuentas», D29), aunque a
// veces compartan el usuario de Auth: si alguien entra a Moss con un Apple ID cuyo correo es el de
// su cuenta de Ascent, Supabase une Apple a ese usuario. Por eso, después de Apple:
// 1. `moss.borrar_cuenta(cuenta)` borra todo lo de Moss de esa cuenta y sus vínculos del lado de Moss;
// 2. si el usuario de Auth solo tiene la identidad de Apple, es solo de Moss y se borra;
// 3. si tiene otra (el correo de Ascent), no se borra: se le quita Apple, y Ascent queda intacta.
// La decisión sale de las identidades que devuelve Auth: la función no lee ni escribe `public`.
//
// Sin dependencias: la sesión se verifica, el usuario se borra y la identidad se quita con los
// mismos pedidos a Auth que hacen `auth.getUser(jwt)`, `auth.admin.deleteUser(id)` y
// `auth.unlinkIdentity()` de supabase-js, y el secreto de Apple se firma con Web Crypto. Se despliega
// con --no-verify-jwt (ver README.md).

// El tsc de la app también lee este archivo (tsconfig incluye **/*.ts) y no conoce Deno.
declare const Deno: { env: { get(nombre: string): string | undefined } };

const APPLE = 'https://appleid.apple.com';
const ESPERA_MS = 10_000;

type CodigoDeError = 'metodo' | 'sin_sesion' | 'pedido' | 'configuracion' | 'auth' | 'apple' | 'borrar' | 'separar' | 'interno';
/** `queda`: el usuario de Auth sigue porque también es la cuenta de Ascent (solo se le quitó Apple). */
type Respuesta = { ok: true; queda?: boolean } | { error: CodigoDeError; apple?: string };
type Servidor = { url: string; clave: string };
type Identidad = { id: string; proveedor: string };
type Usuario = { id: string; identidades: Identidad[] };
type Apple = { equipo: string; idDeClave: string; clavePrivada: string; cliente: string };

const responder = (estado: number, cuerpo: Respuesta) => Response.json(cuerpo, { status: estado });

// En los logs van el paso, el estado y el código de error: nunca un token, un código ni un mensaje
// de error, que podría traer parte de una respuesta.
const registrar = (...partes: (string | number)[]) => console.error('moss-borrar-cuenta:', ...partes);
const nombreDe = (e: unknown) => (e instanceof Error ? e.name : typeof e);
/** El código de error de Auth (con la versión 2024-01-01 de su API, `code`; sin ella, `error_code`). */
const codigoDeAuth = (datos: { code?: unknown; error_code?: unknown } | null) => (typeof datos?.code === 'string' ? datos.code : typeof datos?.error_code === 'string' ? datos.error_code : '');
const codigoParaElLog = (codigo: string) => (/^[a-z_]{1,40}$/.test(codigo) ? codigo : '-');

/** Un pedido con tope: si Apple o Auth no contestan, la app se entera y no se borra nada. */
const pedir = (url: string, init: RequestInit = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(ESPERA_MS) });

export default {
  async fetch(pedido: Request): Promise<Response> {
    try {
      return await borrarLaCuenta(pedido);
    } catch (e) {
      registrar('falló', nombreDe(e));
      return responder(500, { error: 'interno' });
    }
  },
};

async function borrarLaCuenta(pedido: Request): Promise<Response> {
  if (pedido.method !== 'POST') return responder(405, { error: 'metodo' });
  const jwt = /^Bearer\s+(\S+)$/i.exec(pedido.headers.get('Authorization') ?? '')?.[1];
  if (!jwt) return responder(401, { error: 'sin_sesion' });
  const cuerpo = await leerCuerpo(pedido);
  if (!cuerpo) return responder(400, { error: 'pedido' });

  const url = Deno.env.get('SUPABASE_URL')?.replace(/\/+$/, '');
  const clave = claveDeServicio();
  if (!url || !clave) {
    registrar('faltan SUPABASE_URL o la clave secreta');
    return responder(500, { error: 'configuracion' });
  }
  const servidor: Servidor = { url, clave };

  // Primero quién llama: sin una sesión válida no se le pide nada a Apple.
  const usuario = await quienLlama(servidor, jwt);
  if (usuario === 'borrado') return responder(200, { ok: true });
  if (usuario === 'sin_sesion') return responder(401, { error: 'sin_sesion' });
  if (usuario === 'caido') return responder(502, { error: 'auth' });

  if (cuerpo.codigoDeApple) {
    const apple = configDeApple();
    if (!apple) {
      registrar('faltan APPLE_TEAM_ID, APPLE_KEY_ID o APPLE_PRIVATE_KEY');
      return responder(500, { error: 'configuracion' });
    }
    const revocada = await revocarApple(apple, cuerpo.codigoDeApple);
    if (revocada !== true) return responder(502, { error: 'apple', apple: revocada });
  }

  if (!(await borrarLoDeMoss(servidor, usuario.id))) return responder(500, { error: 'borrar' });

  // Solo de Moss: el usuario entero. Sin identidades conocidas no se borra: podría ser de Ascent.
  const soloDeMoss = usuario.identidades.length > 0 && usuario.identidades.every((i) => i.proveedor === 'apple');
  if (soloDeMoss) return (await borrarUsuario(servidor, usuario.id)) ? responder(200, { ok: true }) : responder(500, { error: 'borrar' });

  for (const identidad of usuario.identidades.filter((i) => i.proveedor === 'apple')) {
    const quitada = await quitarIdentidad(servidor, jwt, identidad.id);
    if (quitada !== true) return responder(500, { error: quitada });
  }
  return responder(200, { ok: true, queda: true });
}

/** `{ codigoDeApple? }`, o null si el cuerpo no es eso. Sin cuerpo es borrar sin Apple. */
async function leerCuerpo(pedido: Request): Promise<{ codigoDeApple?: string } | null> {
  const texto = await pedido.text();
  if (!texto.trim()) return {};
  let datos: unknown;
  try {
    datos = JSON.parse(texto);
  } catch {
    return null;
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return null;
  const codigo = (datos as { codigoDeApple?: unknown }).codigoDeApple;
  if (codigo === undefined || codigo === null) return {};
  return typeof codigo === 'string' && codigo.length > 0 && codigo.length <= 2048 ? { codigoDeApple: codigo } : null;
}

/** La clave secreta nueva (la «default» de `SUPABASE_SECRET_KEYS`) o, mientras exista, la service_role. */
function claveDeServicio(): string | null {
  try {
    const clave = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}')?.default;
    if (typeof clave === 'string' && clave) return clave;
  } catch {
    // Sin las claves nuevas, sigue con la de antes.
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || null;
}

function configDeApple(): Apple | null {
  const equipo = Deno.env.get('APPLE_TEAM_ID');
  const idDeClave = Deno.env.get('APPLE_KEY_ID');
  const clavePrivada = Deno.env.get('APPLE_PRIVATE_KEY');
  const cliente = Deno.env.get('APPLE_CLIENT_ID') || 'uy.moss.app';
  return equipo && idDeClave && clavePrivada ? { equipo, idDeClave, clavePrivada, cliente } : null;
}

/** Las identidades como las devuelve Auth: `identity_id` es la de la fila (la que se quita), `id` es la del proveedor. */
function identidadesDe(lista: unknown): Identidad[] {
  if (!Array.isArray(lista)) return [];
  return lista.flatMap((i) => (typeof i?.provider === 'string' ? [{ id: typeof i.identity_id === 'string' ? i.identity_id : '', proveedor: i.provider }] : []));
}

/**
 * Quién llama, según Auth (el pedido de `auth.getUser(jwt)`), con sus identidades. Si el usuario ya
 * no existe, la cuenta ya está borrada: pasa si la respuesta del primer intento se perdió y la app lo
 * vuelve a pedir.
 */
async function quienLlama(servidor: Servidor, jwt: string): Promise<Usuario | 'borrado' | 'sin_sesion' | 'caido'> {
  let r: Response;
  try {
    r = await pedir(`${servidor.url}/auth/v1/user`, {
      headers: { apikey: servidor.clave, Authorization: `Bearer ${jwt}`, 'X-Supabase-Api-Version': '2024-01-01' },
    });
  } catch (e) {
    registrar('Auth no respondió', nombreDe(e));
    return 'caido';
  }
  const datos = await r.json().catch(() => null);
  if (r.ok) return typeof datos?.id === 'string' ? { id: datos.id, identidades: identidadesDe(datos.identities) } : 'caido';
  if (codigoDeAuth(datos) === 'user_not_found') return 'borrado';
  // También el 401: con la clave secreta mal puesta, toda sesión parecería vencida.
  registrar('Auth /user respondió', r.status);
  return r.status === 401 || r.status === 403 ? 'sin_sesion' : 'caido';
}

/** Todo lo de Moss de la cuenta, con `moss.borrar_cuenta` (0008_vinculo.sql), por PostgREST y con la clave de servicio. */
async function borrarLoDeMoss(servidor: Servidor, cuenta: string): Promise<boolean> {
  try {
    const r = await pedir(`${servidor.url}/rest/v1/rpc/borrar_cuenta`, {
      method: 'POST',
      headers: {
        apikey: servidor.clave,
        Authorization: `Bearer ${servidor.clave}`,
        'Content-Type': 'application/json',
        // Las funciones de Moss están en el esquema moss, no en public.
        'Content-Profile': 'moss',
      },
      body: JSON.stringify({ cuenta }),
    });
    if (r.ok) return true;
    const datos = await r.json().catch(() => null);
    // El código es de Postgres o de PostgREST (PGRST202…): dice qué pasó sin repetir el mensaje.
    registrar('borrar_cuenta respondió', r.status, typeof datos?.code === 'string' && /^[A-Z0-9]{1,10}$/.test(datos.code) ? datos.code : '-');
    return false;
  } catch (e) {
    registrar('la base no respondió', nombreDe(e));
    return false;
  }
}

/** Borra el usuario de Auth (el pedido de `auth.admin.deleteUser(id)`): solo cuando es solo de Moss. */
async function borrarUsuario(servidor: Servidor, id: string): Promise<boolean> {
  try {
    const r = await pedir(`${servidor.url}/auth/v1/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      // Como el cliente de administración de supabase-js: la clave en apikey y en Authorization.
      headers: { apikey: servidor.clave, Authorization: `Bearer ${servidor.clave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ should_soft_delete: false }),
    });
    // 404: otro pedido la borró antes.
    if (r.ok || r.status === 404) return true;
    registrar('Auth no borró el usuario', r.status);
    return false;
  } catch (e) {
    registrar('Auth no respondió al borrar', nombreDe(e));
    return false;
  }
}

/**
 * Le quita la identidad de Apple al usuario que también es de Ascent (el pedido de
 * `auth.unlinkIdentity()`, con la sesión de quien llama: Auth no tiene uno de administración para
 * esto). Necesita *Allow manual linking* en el proyecto; sin eso Auth responde 404
 * `manual_linking_disabled` y es un error de configuración.
 */
async function quitarIdentidad(servidor: Servidor, jwt: string, identidad: string): Promise<true | 'separar' | 'configuracion'> {
  if (!identidad) {
    registrar('Auth no mandó el identity_id de Apple');
    return 'separar';
  }
  let r: Response;
  try {
    r = await pedir(`${servidor.url}/auth/v1/user/identities/${encodeURIComponent(identidad)}`, {
      method: 'DELETE',
      headers: { apikey: servidor.clave, Authorization: `Bearer ${jwt}`, 'X-Supabase-Api-Version': '2024-01-01' },
    });
  } catch (e) {
    registrar('Auth no respondió al quitar Apple', nombreDe(e));
    return 'separar';
  }
  if (r.ok) return true;
  const codigo = codigoDeAuth(await r.json().catch(() => null));
  // Otro pedido ya la quitó.
  if (codigo === 'identity_not_found') return true;
  registrar('Auth no quitó Apple', r.status, codigoParaElLog(codigo));
  return codigo === 'manual_linking_disabled' ? 'configuracion' : 'separar';
}

/**
 * Canjea el código por los tokens de Apple y revoca el de refresco, con lo que Moss deja de estar
 * autorizada en ese Apple ID. true si quedó revocada; si no, qué dijo Apple, para la app y los logs.
 */
async function revocarApple(apple: Apple, codigo: string): Promise<true | string> {
  let secreto: string;
  try {
    secreto = await secretoDeCliente(apple);
  } catch (e) {
    registrar('la clave de Apple no se pudo leer', nombreDe(e));
    return 'clave';
  }
  const canje = await formularioAApple('/auth/token', { client_id: apple.cliente, client_secret: secreto, code: codigo, grant_type: 'authorization_code' });
  if (!canje.ok) return canje.error;
  const { refresh_token: refresco, access_token: acceso } = canje.datos;
  // Apple siempre manda el de refresco al canjear un código; revocar el de acceso también corta la autorización.
  const [token, tipo] = typeof refresco === 'string' ? [refresco, 'refresh_token'] : [acceso, 'access_token'];
  if (typeof token !== 'string') {
    registrar('Apple no mandó tokens');
    return 'sin_token';
  }
  const revocado = await formularioAApple('/auth/revoke', { client_id: apple.cliente, client_secret: secreto, token, token_type_hint: tipo });
  return revocado.ok ? true : revocado.error;
}

type DeApple = { ok: true; datos: { refresh_token?: unknown; access_token?: unknown } } | { ok: false; error: string };

async function formularioAApple(ruta: '/auth/token' | '/auth/revoke', campos: Record<string, string>): Promise<DeApple> {
  let r: Response;
  try {
    r = await pedir(`${APPLE}${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(campos),
    });
  } catch (e) {
    registrar('Apple no respondió', ruta, nombreDe(e));
    return { ok: false, error: 'sin_respuesta' };
  }
  // Revocar bien no trae cuerpo.
  const datos = await r.json().catch(() => ({}));
  if (r.ok) return { ok: true, datos: datos ?? {} };
  // Los de Apple son invalid_request, invalid_client, invalid_grant y otros así; lo demás no se repite.
  const error = typeof datos?.error === 'string' && /^[a-z_]{1,40}$/.test(datos.error) ? datos.error : `http_${r.status}`;
  registrar('Apple', ruta, r.status, error);
  return { ok: false, error };
}

/**
 * El client_secret de Apple: un JWT ES256 firmado con la clave .p8 («Creating a client secret», en
 * developer.apple.com). Se arma en cada pedido y vence a los cinco minutos (Apple acepta hasta seis
 * meses).
 */
async function secretoDeCliente(apple: Apple): Promise<string> {
  const ahora = Math.floor(Date.now() / 1000);
  const cabecera = { alg: 'ES256', kid: apple.idDeClave };
  const datos = { iss: apple.equipo, iat: ahora, exp: ahora + 300, aud: APPLE, sub: apple.cliente };
  const firmado = `${base64url(JSON.stringify(cabecera))}.${base64url(JSON.stringify(datos))}`;
  const clave = await crypto.subtle.importKey('pkcs8', derDeLaClave(apple.clavePrivada), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  // Web Crypto ya firma como pide JWS (r y s seguidos, 64 bytes), no en DER.
  const firma = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, clave, new TextEncoder().encode(firmado));
  return `${firmado}.${base64url(new Uint8Array(firma))}`;
}

/** La .p8 tal cual, en una sola línea con «\n» o solo el base64 de adentro: las tres sirven. */
function derDeLaClave(texto: string) {
  const base64 = texto.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\\n|\s/g, '');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function base64url(datos: string | Uint8Array): string {
  const bytes = typeof datos === 'string' ? new TextEncoder().encode(datos) : datos;
  let binario = '';
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
