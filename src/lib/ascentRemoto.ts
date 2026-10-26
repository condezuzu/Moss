// La conexión con Ascent en el servidor (spec/ascent.md, D27): el vínculo entre tu cuenta de Moss y
// la de Ascent (pueden ser la misma) y lo que Moss lee de Ascent con él. Todo pasa por funciones del
// esquema `moss` (supabase/moss/0008_vinculo.sql) que revisan la sesión y el vínculo; vincular pasa
// por la función del servidor `moss-vincular`, que recibe las dos sesiones y las revisa con Supabase.
//
// Sin Supabase configurado o sin sesión, no hay vínculo ni nada que leer. Si la base no contesta
// (sin conexión, por ejemplo), las lecturas y desvincular rechazan la promesa: quien llama se queda
// con lo que tenía. Vincular nunca la rechaza: devuelve el error.

import type { ClaveDia } from '@/dominio/fechas';
import { haySupabase, supabase } from '@/lib/supabase';

/**
 * Una serie: lo que se movió, en kilos, como lo cuenta Ascent (×2 con dos mancuernas o un lado por
 * vez; el lastre sin el peso del cuerpo), y las repeticiones. null lo que no se anotó; con el peso
 * del cuerpo, los kilos son null.
 */
export type SerieDeAscent = { kilos: number | null; reps: number | null };

/**
 * Un ejercicio de la sesión, en orden: su nombre en Ascent (el del catálogo, en español, o el que le
 * puso la persona), sus grupos y sus series. Ascent le da un solo grupo a cada ejercicio: pecho,
 * espalda, hombros, brazos, piernas, core o cardio (GrupoDeAscent en src/dominio/musculos.ts).
 */
export type EjercicioDeAscent = {
  nombre: string;
  musculos: string[];
  series: SerieDeAscent[];
  /** El id del ejercicio en Ascent ('sentadilla', o 'propio_…' si lo creó la persona). */
  id?: string;
};

/**
 * Un día de gimnasio en Ascent, con todas sus sesiones juntas: el día (la clave local, como la
 * guarda Ascent), las series (el contador de Ascent), el peso movido (la suma de los kilos de cada
 * serie, como lo cuenta Ascent), los minutos y los ejercicios. Un día anotado sin cronómetro viene
 * con 0 series, 0 kilos, 0 minutos y sin ejercicios: se fue al gimnasio, pero no se sabe más.
 */
export type SesionDeAscent = {
  fecha: ClaveDia;
  series: number;
  kilos: number;
  /** Solo las sesiones terminadas de 5 minutos o más, como en Ascent: si no hay, 0. */
  minutos: number;
  ejercicios: EjercicioDeAscent[];
  /** Cuándo empezó la primera sesión del día (ISO); falta si el día se anotó sin cronómetro. */
  inicio?: string;
};

/**
 * Una marca de Ascent: el ejercicio (el mismo nombre que en EjercicioDeAscent), el día, el peso
 * levantado y las repeticiones (1 es un máximo real).
 */
export type MarcaDeAscent = {
  ejercicio: string;
  fecha: ClaveDia;
  kilos: number;
  reps: number;
  id?: string;
};

/** Un peso de la cuenta: de Moss (moss.pesos) o de Ascent. Uno por día. */
export type PesoCompartido = { fecha: ClaveDia; kg: number; de: 'moss' | 'ascent' };

/** Si esta cuenta está vinculada, con qué usuario de Ascent y desde cuándo (ISO). */
export type EstadoDelVinculo = { vinculada: boolean; nombre: string | null; desde: string | null };

/**
 * Por qué no se vinculó: sin sesión en Moss, la sesión de Ascent venció o no sirve, esa cuenta
 * nunca usó Ascent (no tiene nombre de usuario), sin conexión, o cualquier otra cosa del servidor.
 */
export type ErrorDeVincular = 'sin_sesion' | 'vencida' | 'sin_ascent' | 'red' | 'servidor';

type Cliente = Pick<ReturnType<typeof supabase>, 'auth' | 'rpc' | 'functions'>;

let elCliente: () => Cliente | null = () => (haySupabase() ? supabase() : null);

/** Para probar contra la base local (herramientas/verificar-supabase.mjs): otro cliente en lugar del de la app. */
export function probarCon(cliente: () => Cliente | null): void {
  elCliente = cliente;
}

/** Vincular espera hasta esto: revisa dos sesiones con Supabase y guarda. */
const ESPERA_MS = 15_000;

const NO_VINCULADA: EstadoDelVinculo = { vinculada: false, nombre: null, desde: null };

type Objeto = Record<string, unknown>;
const esObjeto = (x: unknown): x is Objeto => typeof x === 'object' && x !== null && !Array.isArray(x);
const lista = (x: unknown): Objeto[] => (Array.isArray(x) ? x.filter(esObjeto) : []);
const numero = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);
const texto = (x: unknown): string | null => (typeof x === 'string' && x.length > 0 ? x : null);
const esClave = (x: unknown): x is ClaveDia => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

/** La sesión de Moss en este teléfono, o null sin Supabase o sin sesión. */
async function conSesion(): Promise<{ cliente: Cliente; token: string } | null> {
  const cliente = elCliente();
  if (!cliente) return null;
  const { data, error } = await cliente.auth.getSession();
  // Sin conexión para renovarla: no se sabe si hay sesión, y eso no es «sin sesión».
  if (error) throw error;
  return data.session ? { cliente, token: data.session.access_token } : null;
}

/** Una función del esquema moss, con la sesión de Moss. null sin Supabase o sin sesión. */
async function llamar(funcion: string, argumentos?: Objeto): Promise<unknown> {
  const sesion = await conSesion();
  if (!sesion) return null;
  const { data, error } = await sesion.cliente.rpc(funcion, argumentos);
  if (error) throw new Error(`moss.${funcion}: ${error.code || error.message}`);
  return data;
}

/** Si esta cuenta está vinculada con una de Ascent. Sirve igual desde las dos apps. */
export async function estadoDelVinculo(): Promise<EstadoDelVinculo> {
  const datos = await llamar('estado_del_vinculo');
  if (!esObjeto(datos) || datos.vinculada !== true) return NO_VINCULADA;
  return { vinculada: true, nombre: texto(datos.nombre), desde: texto(datos.desde) };
}

/**
 * Vincula esta cuenta de Moss con la de Ascent de la sesión que dejó Ascent en el llavero compartido
 * (su access token). Las dos sesiones las revisa el servidor; si eran otras cuentas vinculadas
 * antes, esos vínculos se borran.
 */
export async function vincular(tokenDeAscent: string): Promise<{ ok: true; nombre: string } | { ok: false; error: ErrorDeVincular }> {
  if (!tokenDeAscent) return { ok: false, error: 'vencida' };
  let sesion: Awaited<ReturnType<typeof conSesion>>;
  try {
    sesion = await conSesion();
  } catch {
    return { ok: false, error: 'red' };
  }
  if (!sesion) return { ok: false, error: 'sin_sesion' };
  const { data, error, response } = await sesion.cliente.functions.invoke('moss-vincular', {
    body: { otra: tokenDeAscent, desde: 'moss' },
    // La sesión recién leída (getSession la renueva si venció), no la que el cliente tenga guardada.
    headers: { Authorization: `Bearer ${sesion.token}` },
    timeout: ESPERA_MS,
  });
  if (!error) {
    return esObjeto(data) && data.ok === true && texto(data.nombre) ? { ok: true, nombre: data.nombre as string } : { ok: false, error: 'servidor' };
  }
  // Sin respuesta: sin conexión o pasó el tope.
  if (!response) return { ok: false, error: 'red' };
  const cuerpo: unknown = await response.json().catch(() => null);
  const codigo = esObjeto(cuerpo) ? cuerpo.error : null;
  return codigo === 'sin_sesion' || codigo === 'vencida' || codigo === 'sin_ascent' ? { ok: false, error: codigo } : { ok: false, error: 'servidor' };
}

/** Borra el vínculo de esta cuenta, sea el lado de Moss o el de Ascent. Los datos quedan en cada app. */
export async function desvincular(): Promise<void> {
  await llamar('desvincular');
}

/** Los días de gimnasio de la cuenta de Ascent vinculada desde `desde` (incluido), del más viejo al más nuevo. */
export async function sesionesDeAscent(desde: ClaveDia): Promise<SesionDeAscent[]> {
  return lista(await llamar('ascent_sesiones', { desde })).flatMap((s) => {
    const series = numero(s.series), kilos = numero(s.kilos), minutos = numero(s.minutos);
    if (!esClave(s.fecha) || series === null || kilos === null || minutos === null) return [];
    const inicio = texto(s.inicio);
    return [{ fecha: s.fecha, series, kilos, minutos, ejercicios: lista(s.ejercicios).flatMap(ejercicioDe), ...(inicio ? { inicio } : {}) }];
  });
}

function ejercicioDe(e: Objeto): EjercicioDeAscent[] {
  const nombre = texto(e.nombre);
  if (!nombre) return [];
  const id = texto(e.id);
  return [{
    nombre,
    musculos: Array.isArray(e.musculos) ? e.musculos.filter((m): m is string => typeof m === 'string') : [],
    series: lista(e.series).map((x) => ({ kilos: numero(x.kilos), reps: numero(x.reps) })),
    ...(id ? { id } : {}),
  }];
}

/**
 * Las marcas de Ascent desde `desde` (incluido) y, de cada ejercicio, la mejor de siempre aunque sea
 * de antes: «tu marca» es la mejor, y «una marca en las últimas 8 semanas» se ve por la fecha.
 */
export async function marcasDeAscent(desde: ClaveDia): Promise<MarcaDeAscent[]> {
  return lista(await llamar('ascent_marcas', { desde })).flatMap((m) => {
    const ejercicio = texto(m.ejercicio), kilos = numero(m.kilos), reps = numero(m.reps), id = texto(m.id);
    if (!ejercicio || !esClave(m.fecha) || kilos === null || reps === null) return [];
    return [{ ejercicio, fecha: m.fecha, kilos, reps, ...(id ? { id } : {}) }];
  });
}

/**
 * El peso de la cuenta, uno por día desde `desde`: lo de Moss y lo de Ascent juntos. Ascent no guarda
 * la hora de su peso, así que si un día hay de las dos, gana el de Moss (en Ascent, el de Ascent).
 * Sin vínculo, nada: el peso propio ya está en el teléfono.
 */
export async function pesosCompartidos(desde: ClaveDia): Promise<PesoCompartido[]> {
  return lista(await llamar('pesos_compartidos', { desde, app: 'moss' })).flatMap((p) => {
    const kg = numero(p.kg);
    if (!esClave(p.fecha) || kg === null || (p.de !== 'moss' && p.de !== 'ascent')) return [];
    return [{ fecha: p.fecha, kg, de: p.de }];
  });
}
