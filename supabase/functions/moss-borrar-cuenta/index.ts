// moss-borrar-cuenta: «Borrar la cuenta» de Perfil. Borra la cuenta de quien llama y, si la cuenta
// usa Sign in with Apple, antes revoca su autorización con la API REST de Apple, como pide la App
// Store (5.1.1(v), spec/revision.md). La app manda un código nuevo de Apple; si Apple falla, no se
// borra nada.
//
// Borrar el usuario de Auth borra en cascada todo lo de `moss` (y lo de Ascent: la cuenta es una
// sola, y la app lo avisa antes). La función no lee ni escribe el esquema `public` (spec/ascent.md).
//
// Sin dependencias: la sesión se verifica y el usuario se borra con los mismos pedidos a Auth que
// hacen `auth.getUser(jwt)` y `auth.admin.deleteUser(id)` de supabase-js, y el secreto de Apple se
// firma con Web Crypto. Se despliega con --no-verify-jwt (ver README.md).

// El tsc de la app también lee este archivo (tsconfig incluye **/*.ts) y no conoce Deno.
declare const Deno: { env: { get(nombre: string): string | undefined } };

const APPLE = 'https://appleid.apple.com';
const ESPERA_MS = 10_000;

type CodigoDeError = 'metodo' | 'sin_sesion' | 'pedido' | 'configuracion' | 'auth' | 'apple' | 'borrar' | 'interno';
type Respuesta = { ok: true } | { error: CodigoDeError; apple?: string };
type Auth = { url: string; clave: string };
type Apple = { equipo: string; idDeClave: string; clavePrivada: string; cliente: string };

const responder = (estado: number, cuerpo: Respuesta) => Response.json(cuerpo, { status: estado });

// En los logs van el paso, el estado y el código de error: nunca un token, un código ni un mensaje
// de error, que podría traer parte de una respuesta.
const registrar = (...partes: (string | number)[]) => console.error('moss-borrar-cuenta:', ...partes);
const nombreDe = (e: unknown) => (e instanceof Error ? e.name : typeof e);

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
  const auth: Auth = { url: `${url}/auth/v1`, clave };

  // Primero quién llama: sin una sesión válida no se le pide nada a Apple.
  const usuario = await quienLlama(auth, jwt);
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

  return (await borrarUsuario(auth, usuario.id)) ? responder(200, { ok: true }) : responder(500, { error: 'borrar' });
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

/**
 * Quién llama, según Auth (el pedido de `auth.getUser(jwt)`). Si el usuario ya no existe, la cuenta
 * ya está borrada: pasa si la respuesta del primer intento se perdió y la app lo vuelve a pedir.
 */
async function quienLlama(auth: Auth, jwt: string): Promise<{ id: string } | 'borrado' | 'sin_sesion' | 'caido'> {
  let r: Response;
  try {
    r = await pedir(`${auth.url}/user`, {
      headers: { apikey: auth.clave, Authorization: `Bearer ${jwt}`, 'X-Supabase-Api-Version': '2024-01-01' },
    });
  } catch (e) {
    registrar('Auth no respondió', nombreDe(e));
    return 'caido';
  }
  const datos = await r.json().catch(() => null);
  if (r.ok) return typeof datos?.id === 'string' ? { id: datos.id } : 'caido';
  if (datos?.code === 'user_not_found' || datos?.error_code === 'user_not_found') return 'borrado';
  // También el 401: con la clave secreta mal puesta, toda sesión parecería vencida.
  registrar('Auth /user respondió', r.status);
  return r.status === 401 || r.status === 403 ? 'sin_sesion' : 'caido';
}

/** Borra el usuario de Auth (el pedido de `auth.admin.deleteUser(id)`), y con él todo lo de `moss`. */
async function borrarUsuario(auth: Auth, id: string): Promise<boolean> {
  try {
    const r = await pedir(`${auth.url}/admin/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      // Como el cliente de administración de supabase-js: la clave en apikey y en Authorization.
      headers: { apikey: auth.clave, Authorization: `Bearer ${auth.clave}`, 'Content-Type': 'application/json' },
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
