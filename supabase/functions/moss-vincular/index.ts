// moss-vincular: vincula una cuenta de Moss con una de Ascent (spec/ascent.md, «Vincular en menos de
// 10 segundos», D27). Las dos pueden ser la misma cuenta o dos distintas. La llama la app desde la
// que se vincula, con su sesión, y manda la de la otra app, que leyó del llavero compartido del
// equipo. Sin las dos sesiones vivas no se vincula: así nadie vincula algo ajeno.
//
// El contrato, que usan las dos apps:
//   POST /functions/v1/moss-vincular
//   Authorization: Bearer <access token de la app que llama>
//   { "otra": "<access token de la cuenta de la otra app>", "desde": "moss" | "ascent" }
// Con "desde": "moss", la cuenta de Moss es la de Authorization y la de Ascent, la de `otra`; con
// "ascent", al revés. Bien: 200 { ok: true, nombre } (el usuario de Ascent). Los errores, en README.md.
//
// Las sesiones se verifican con el mismo pedido a Auth que hace `auth.getUser(jwt)` de supabase-js, y
// el vínculo lo guarda `moss.vincular_cuentas` (supabase/moss/0008_vinculo.sql), que solo puede
// llamar la clave de servicio: borra los vínculos anteriores de las dos cuentas y exige que la de
// Ascent tenga nombre de usuario. La función no lee ni escribe `public`. Sin dependencias, como
// moss-borrar-cuenta; se despliega con --no-verify-jwt (ver README.md).

// El tsc de la app también lee este archivo (tsconfig incluye **/*.ts) y no conoce Deno.
declare const Deno: { env: { get(nombre: string): string | undefined } };

const ESPERA_MS = 10_000;
/** Un access token de Supabase anda por los mil caracteres. */
const LARGO_MAXIMO = 8192;

type App = 'moss' | 'ascent';
type CodigoDeError = 'metodo' | 'sin_sesion' | 'vencida' | 'sin_ascent' | 'pedido' | 'configuracion' | 'interno';
type Respuesta = { ok: true; nombre: string } | { error: CodigoDeError };
type Servidor = { url: string; clave: string };
type Sesion = { id: string } | 'invalida' | 'caido';

const responder = (estado: number, cuerpo: Respuesta) => Response.json(cuerpo, { status: estado });

// En los logs van el paso, el estado y el código de error: nunca un token ni un mensaje de error,
// que podría traer parte de una respuesta.
const registrar = (...partes: (string | number)[]) => console.error('moss-vincular:', ...partes);
const nombreDe = (e: unknown) => (e instanceof Error ? e.name : typeof e);

/** Un pedido con tope: si Auth o la base no contestan, la app se entera y no se vincula nada. */
const pedir = (url: string, init: RequestInit = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(ESPERA_MS) });

export default {
  async fetch(pedido: Request): Promise<Response> {
    try {
      return await vincular(pedido);
    } catch (e) {
      registrar('falló', nombreDe(e));
      return responder(500, { error: 'interno' });
    }
  },
};

async function vincular(pedido: Request): Promise<Response> {
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

  // Las dos a la vez: es lo que más tarda, y vincular tiene que durar segundos.
  const [propia, otra] = await Promise.all([quien(servidor, jwt), quien(servidor, cuerpo.otra)]);
  if (propia === 'invalida') return responder(401, { error: 'sin_sesion' });
  if (otra === 'invalida') return responder(401, { error: 'vencida' });
  if (propia === 'caido' || otra === 'caido') return responder(502, { error: 'interno' });

  const [moss, ascent] = cuerpo.desde === 'moss' ? [propia, otra] : [otra, propia];
  return guardar(servidor, moss.id, ascent.id, cuerpo.desde);
}

/** `{ otra, desde }`, o null si el cuerpo no es eso. */
async function leerCuerpo(pedido: Request): Promise<{ otra: string; desde: App } | null> {
  let datos: unknown;
  try {
    datos = JSON.parse(await pedido.text());
  } catch {
    return null;
  }
  if (typeof datos !== 'object' || datos === null || Array.isArray(datos)) return null;
  const { otra, desde } = datos as { otra?: unknown; desde?: unknown };
  if (typeof otra !== 'string' || !otra || otra.length > LARGO_MAXIMO || /\s/.test(otra)) return null;
  return desde === 'moss' || desde === 'ascent' ? { otra, desde } : null;
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

/** De quién es una sesión, según Auth (el pedido de `auth.getUser(jwt)`). Una cuenta borrada no vale. */
async function quien(servidor: Servidor, jwt: string): Promise<Sesion> {
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
  if (r.ok) return typeof datos?.id === 'string' ? { id: datos.id } : 'caido';
  if (datos?.code === 'user_not_found' || datos?.error_code === 'user_not_found') return 'invalida';
  // También el 401: con la clave secreta mal puesta, toda sesión parecería vencida.
  registrar('Auth /user respondió', r.status);
  return r.status === 401 || r.status === 403 ? 'invalida' : 'caido';
}

/** Guarda el vínculo con `moss.vincular_cuentas`, por PostgREST y con la clave de servicio. */
async function guardar(servidor: Servidor, moss: string, ascent: string, origen: App): Promise<Response> {
  let r: Response;
  try {
    r = await pedir(`${servidor.url}/rest/v1/rpc/vincular_cuentas`, {
      method: 'POST',
      headers: {
        apikey: servidor.clave,
        Authorization: `Bearer ${servidor.clave}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Las funciones de Moss están en el esquema moss, no en public.
        'Content-Profile': 'moss',
      },
      body: JSON.stringify({ cuenta_moss: moss, cuenta_ascent: ascent, origen }),
    });
  } catch (e) {
    registrar('la base no respondió', nombreDe(e));
    return responder(502, { error: 'interno' });
  }
  const datos = await r.json().catch(() => null);
  if (r.ok && typeof datos?.nombre === 'string') return responder(200, { ok: true, nombre: datos.nombre });
  if (datos?.message === 'sin_ascent') return responder(409, { error: 'sin_ascent' });
  // El código es de Postgres o de PostgREST (23505, PGRST202…): dice qué pasó sin repetir el mensaje.
  const codigo = typeof datos?.code === 'string' && /^[A-Z0-9]{1,10}$/.test(datos.code) ? datos.code : '-';
  registrar('vincular_cuentas respondió', r.status, codigo);
  return responder(500, { error: 'interno' });
}
