// La sesión que una app deja para la otra en el llavero compartido (llavero.ts): su forma y si
// todavía sirve. Sin nada del teléfono, para probarlo.

export type App = 'moss' | 'ascent';

export type SesionCompartida = {
  v: 1;
  app: App;
  /** El id de la cuenta (auth.users). */
  usuario: string;
  /** El nombre de la persona en esa app: el de usuario en Ascent, el del perfil en Moss (o vacío). */
  nombre: string;
  /** El access token de Supabase: lo revisa el servidor al vincular. Nunca el de refresco. */
  token: string;
  /** Cuándo vence el token, en segundos desde 1970 (expires_at de Supabase). */
  vence: number;
};

/** Con menos de esto por delante, la sesión ya no sirve: el servidor tarda en revisarla. */
const MARGEN_MS = 60_000;

/** Lo que dejó una app en el llavero, si tiene la forma del contrato; si no, null. */
export function leerSesion(texto: string | null, app: App): SesionCompartida | null {
  if (!texto) return null;
  try {
    const x = JSON.parse(texto) as Partial<SesionCompartida> | null;
    if (!x || x.v !== 1 || x.app !== app || typeof x.usuario !== 'string' || !x.usuario || typeof x.token !== 'string' || !x.token) return null;
    if (typeof x.vence !== 'number' || !Number.isFinite(x.vence)) return null;
    return { v: 1, app, usuario: x.usuario, nombre: typeof x.nombre === 'string' ? x.nombre : '', token: x.token, vence: x.vence };
  } catch {
    return null;
  }
}

/** Si a la sesión todavía le queda tiempo para vincular. */
export const vigente = (s: Pick<SesionCompartida, 'vence'>, ahora = Date.now()) => s.vence * 1000 > ahora + MARGEN_MS;
