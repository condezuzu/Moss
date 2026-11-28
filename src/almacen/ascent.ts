// Lo de Ascent en el teléfono (spec/ascent.md): si la cuenta está vinculada y lo último que llegó de
// Ascent por el vínculo (los días de gimnasio con sus series, las marcas, el peso de las dos apps, la
// rutina y los ajustes).
// Se guarda en los ajustes del almacén, que no suben a la cuenta ni van a la copia de iCloud: así
// anda sin red y al abrir no parpadea. Se refresca al abrir la app, al cambiar la sesión y al
// volver a primer plano. Con el vínculo, además, enciende el gimnasio automático y va guardando lo
// dormido cada noche (Salud da cuatro semanas; «Por qué no subes» mira más).

import { useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import {
  entrenoEl, leerAjustesDeAscent, leerRutinaDeAscent, metaConAscentDe, pesoUnico, primerDiaQueHaceFalta,
  type AjustesDeAscent, type EjercicioDeAscent, type GimnasioDeAscent, type MarcaDeAscent, type PesoCompartido, type RutinaDeAscent, type SesionDeAscent,
} from '@/dominio/conAscent';
import type { Peso } from '@/dominio/control';
import { claveDeMarca, seEnciendeSola } from '@/dominio/dias';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { habitosDelDia } from '@/dominio/habitos';
import type { Macros } from '@/dominio/metas';
import { conNochesDeMoss } from '@/dominio/sinReloj';
import type { ErrorDeVincular, EstadoDelVinculo, MetaDeFuerza } from '@/lib/ascentRemoto';
import * as ascentRemoto from '@/lib/ascentRemoto';
import { metaVigente, type Estado } from './almacen';
import type { Repositorio } from './repositorio';
import { elAlmacen, oirLaSesion } from './index';

/** Lo que se pide al servidor de Ascent; los tests ponen uno de mentira. */
export type RemotoDeAscent = {
  estadoDelVinculo(): Promise<EstadoDelVinculo>;
  vincular(token: string): Promise<{ ok: true; nombre: string } | { ok: false; error: ErrorDeVincular }>;
  desvincular(): Promise<void>;
  sesionesDeAscent(desde: ClaveDia): Promise<SesionDeAscent[]>;
  marcasDeAscent(desde: ClaveDia): Promise<MarcaDeAscent[]>;
  pesosCompartidos(desde: ClaveDia): Promise<PesoCompartido[]>;
  rutinaDeAscent(): Promise<RutinaDeAscent | null>;
  ajustesDeAscent(): Promise<AjustesDeAscent | null>;
  /**
   * Las metas de fuerza (0016_metas_de_fuerza.sql); los tests pueden no tenerlas. Sin vínculo, null. Guardar devuelve el
   * id; null sin vínculo, o si la que se cambia ya no está. Con 20 metas, crear otra rechaza con «demasiadas». Lo que no
   * contesta a tiempo rechaza con un error que termina en «sin respuesta»: pudo haberse hecho igual.
   */
  metasDeFuerza?(): Promise<MetaDeFuerza[] | null>;
  guardarMetaDeFuerza?(m: MetaPedida): Promise<string | null>;
  borrarMetaDeFuerza?(id: string): Promise<boolean>;
};

/** Una meta para guardar: sin id, una nueva (o la del ejercicio, si ya tiene). */
export type MetaPedida = { id?: string; ejercicio: string; kilos: number; reps: number };
/** Por qué no se guardó o no se borró una meta, para decirlo: sin conexión, sin respuesta a tiempo, el tope o sin vínculo. */
export type FalloDeMeta = 'red' | 'sinRespuesta' | 'demasiadas' | 'sinVinculo';
const fallo = (porQue: FalloDeMeta) => Object.assign(new Error(`meta: ${porQue}`), { fallo: porQue });
const esFallo = (e: unknown): e is { fallo: FalloDeMeta } => typeof e === 'object' && e !== null && 'fallo' in e;
/** Por qué rechazó guardarMeta o borrarMeta. */
export const falloDeMeta = (e: unknown): FalloDeMeta => (esFallo(e) ? e.fallo : 'red');
const sinRespuesta = (e: unknown) => e instanceof Error && e.message.endsWith('sin respuesta');

export type DeAscent = {
  /** Ya se leyó lo guardado en el teléfono. */
  listo: boolean;
  /** Hay sesión de Moss en este teléfono: sin ella no se puede vincular. */
  conCuenta: boolean;
  vinculo: EstadoDelVinculo;
  sesiones: SesionDeAscent[];
  marcas: MarcaDeAscent[];
  pesos: PesoCompartido[];
  /** La rutina activa de Ascent; null sin rutina o hasta que llegue (la base la da desde 0013_ascent_rutina.sql). */
  rutina: RutinaDeAscent | null;
  /** El umbral de estancamiento de sus Ajustes y la racha; null hasta que lleguen. */
  ajustes: AjustesDeAscent | null;
  /** Las metas de fuerza de la sección de músculos, las mismas que ve Ascent. */
  metas: MetaDeFuerza[];
  /** Desde qué día están las sesiones; null sin ninguna. */
  desde: ClaveDia | null;
  /** Cuándo llegó lo último de Ascent (ISO). */
  llego: string | null;
  /** Lo dormido cada noche, en minutos, que se va juntando mientras está vinculada. */
  noches: Record<ClaveDia, number>;
  /** «¿Cómo te sientes para entrenar?», de 0 a 10: lo que se contestó y qué día (vale solo ese día). */
  siente: { fecha: ClaveDia; n: number } | null;
  /** Sube con cada cambio. */
  version: number;
};

/** Las sesiones: las de este año y, en enero, las de 12 semanas atrás (el rendimiento mira 8). */
const DIAS_DE_SESIONES = 84;
/**
 * Con las series de cada ejercicio, las de las últimas 18 semanas: la tendencia de tu fuerza mira 12 y las razones
 * de estancamiento, lo de antes de la última marca. De lo de antes quedan los ejercicios sin las series: alcanza
 * para el color de cada día de tu año y pesa mucho menos.
 */
const DIAS_CON_SERIES = 126;
/** Las marcas de un año (y la mejor de siempre de cada ejercicio, que el servidor suma igual). */
const DIAS_DE_MARCAS = 365;
/** El peso, como el gráfico más largo de Progreso y la tendencia que lo arranca. */
const DIAS_DE_PESOS = 120;
const DIAS_DE_NOCHES = 400;

const SIN_VINCULO: EstadoDelVinculo = { vinculada: false, nombre: null, desde: null };
const SIN_PESOS: readonly PesoCompartido[] = [];
const vacio = (): Omit<DeAscent, 'listo' | 'conCuenta' | 'version'> => ({ vinculo: SIN_VINCULO, sesiones: [], marcas: [], pesos: [], rutina: null, ajustes: null, metas: [], desde: null, llego: null, noches: {}, siente: null });
const porFecha = <T extends { fecha: ClaveDia }>(a: T, b: T) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);

type Guardado = ReturnType<typeof vacio> & { v: 1; usuario: string | null; conSeries?: number };

function leerGuardado(texto: string | null): Guardado | null {
  try {
    const leido = texto ? (JSON.parse(texto) as Partial<Guardado> & { avisos?: unknown }) : null;
    if (!leido || leido.v !== 1 || !leido.vinculo || !Array.isArray(leido.sesiones) || !Array.isArray(leido.marcas) || !Array.isArray(leido.pesos)) return null;
    // Los avisos de marca de la build 6 ya no se usan.
    const { avisos: _a, ...x } = leido;
    const siente = x.siente && typeof x.siente.n === 'number' && typeof x.siente.fecha === 'string' ? x.siente : null;
    // Lo guardado con menos semanas con series (la build 6 guardaba 9): se vuelve a pedir todo.
    const desde = x.conSeries === DIAS_CON_SERIES ? (x.desde ?? null) : null;
    // Lo que guardó la build 6 no trae la rutina ni los ajustes: quedan en null hasta que lleguen.
    const rutina = leerRutinaDeAscent(x.rutina), ajustes = leerAjustesDeAscent(x.ajustes);
    const metas = Array.isArray(x.metas) ? x.metas : [];
    return { ...vacio(), ...x, v: 1, usuario: x.usuario ?? null, noches: x.noches ?? {}, siente, desde, rutina, ajustes, metas } as Guardado;
  } catch {
    return null;
  }
}

export type OpcionesDeAscent = {
  remoto: RemotoDeAscent;
  /** Dónde queda en el teléfono (los ajustes del almacén). */
  guardado: { leer(): Promise<string | null>; escribir(texto: string): Promise<void> };
  hoy: () => ClaveDia;
  ahora?: () => Date;
};

export type AlmacenDeAscent = ReturnType<typeof crearAscent>;

export function crearAscent(op: OpcionesDeAscent) {
  const ahora = op.ahora ?? (() => new Date());
  let estado: DeAscent = { ...vacio(), listo: false, conCuenta: false, version: 0 };
  let usuario: string | null = null;
  /** Ya se sabe si hay sesión y de quién: hasta entonces vale lo guardado, para que no parpadee. */
  let sesionSabida = false;
  /** Lo guardado de la última vez, hasta saber de quién es la sesión. */
  let deAntes: Guardado | null = null;
  /** Sube con cada vincular, desvincular o cambio de sesión: lo que llegue de antes ya no vale. */
  let generacion = 0;
  let refrescando: Promise<void> | null = null;
  let otraVez = false;
  /** Las metas puestas en este teléfono que todavía no tienen su id del servidor. */
  let metasPuestas = 0;
  /** Los cambios de metas de este teléfono que todavía esperan al servidor (de esta cuenta y este vínculo). */
  let metasEnCurso = 0;
  /**
   * Sube al terminar cada cambio de una meta: las metas que trae un refresco que salió antes, o mientras alguno esperaba,
   * no pisan lo que hizo la persona. Las que se descartan así se piden otra vez cuando termina el último (`descartadas`).
   */
  let cambiosDeMetas = 0;
  let descartadas = false;
  /** Cada meta como está en la base (lo último que llegó o que contestó el servidor): es lo que vuelve si un cambio falla. */
  const enLaBase = new Map<string, MetaDeFuerza>();
  /**
   * El último guardado de cada ejercicio: el siguiente del mismo sale recién cuando ese contestó. Si salían juntos, la base
   * podía quedarse con el de antes (llegaban al revés) y la pantalla con la respuesta que llegó última.
   */
  const enFila = new Map<string, Promise<void>>();
  let leyendo: Promise<void> | undefined;
  const oyentes = new Set<() => void>();

  const cambiar = (nuevo: Partial<DeAscent>) => {
    estado = { ...estado, ...nuevo, version: estado.version + 1 };
    oyentes.forEach((o) => o());
  };
  /** Las metas del servidor; undefined si no contestó. */
  const metasDelServidor = () => (op.remoto.metasDeFuerza ? op.remoto.metasDeFuerza().catch(() => undefined) : Promise.resolve(undefined));
  /** Las metas como están en la base (las de un refresco, las guardadas en el teléfono, o ninguna). */
  function deLaBase(metas: MetaDeFuerza[]): MetaDeFuerza[] {
    enLaBase.clear();
    for (const m of metas) enLaBase.set(m.id, m);
    return metas;
  }
  /** Otra cuenta u otro vínculo: lo que llegue de antes ya no vale, y los cambios de metas de antes ya no cuentan. */
  function otraGeneracion() {
    generacion++;
    metasEnCurso = 0;
    descartadas = false;
  }

  function guardar() {
    const corte = sumarDias(op.hoy(), -DIAS_CON_SERIES);
    const { listo: _l, conCuenta: _c, version: _v, ...datos } = estado;
    const sinSeries = (s: SesionDeAscent): SesionDeAscent => ({ ...s, ejercicios: s.ejercicios.map((e) => ({ ...e, series: [] })) });
    // Una meta que todavía no se guardó en el servidor no queda en el teléfono: si no llega a guardarse, no vuelve al abrir.
    const metas = estado.metas.filter((m) => !m.pendiente);
    const g: Guardado = { ...datos, v: 1, usuario, conSeries: DIAS_CON_SERIES, metas, sesiones: estado.sesiones.map((s) => (s.fecha < corte ? sinSeries(s) : s)) };
    op.guardado.escribir(JSON.stringify(g)).catch(() => {});
  }

  /** Lo guardado, si es de esta cuenta (o si todavía no se sabe de quién es la sesión). Sin sesión, nada. */
  function usarLoDeAntes() {
    if (!deAntes || (sesionSabida && (!usuario || deAntes.usuario !== usuario))) return;
    const { v: _v, usuario: _u, conSeries: _s, ...datos } = deAntes;
    cambiar({ ...datos, metas: deLaBase(datos.metas) });
  }

  function iniciar() {
    leyendo ??= op.guardado.leer().then(leerGuardado, () => null).then((g) => {
      deAntes = g;
      usarLoDeAntes();
      cambiar({ listo: true });
    });
    return leyendo;
  }

  /** Pide al servidor si sigue vinculada y, si sí, lo nuevo. Sin conexión, queda lo que había. */
  function refrescar(): Promise<void> {
    if (!usuario) return Promise.resolve();
    if (refrescando) {
      otraVez = true;
      return refrescando;
    }
    const de = generacion;
    refrescando = (async () => {
      try {
        const vinculo = await op.remoto.estadoDelVinculo();
        if (de !== generacion) return;
        if (!vinculo.vinculada) {
          if (estado.vinculo.vinculada || estado.sesiones.length) {
            cambiar({ ...vacio(), metas: deLaBase([]), noches: estado.noches });
            guardar();
          }
          return;
        }
        if (vinculo.nombre !== estado.vinculo.nombre || vinculo.desde !== estado.vinculo.desde || !estado.vinculo.vinculada) cambiar({ vinculo });
        const hoy = op.hoy();
        const primero = primerDiaQueHaceFalta(hoy, DIAS_DE_SESIONES);
        // Lo que ya está no se vuelve a pedir: desde una semana antes del último día (Ascent deja
        // corregir los días recientes).
        const ultimo = estado.desde && estado.desde <= primero && estado.sesiones.length ? estado.sesiones[estado.sesiones.length - 1].fecha : null;
        const desde = ultimo && sumarDias(ultimo, -7) > primero ? sumarDias(ultimo, -7) : primero;
        const vez = cambiosDeMetas;
        const [sesiones, marcas, pesos, rutina, ajustes, metas] = await Promise.all([
          op.remoto.sesionesDeAscent(desde),
          op.remoto.marcasDeAscent(sumarDias(hoy, -DIAS_DE_MARCAS)),
          op.remoto.pesosCompartidos(sumarDias(hoy, -DIAS_DE_PESOS)),
          // La OTA puede llegar antes que sus funciones en la base: sin ellas queda lo que había, y lo demás llega igual.
          op.remoto.rutinaDeAscent().catch(() => estado.rutina),
          op.remoto.ajustesDeAscent().catch(() => estado.ajustes),
          metasDelServidor(),
        ]);
        if (de !== generacion) return;
        const guardadas = estado.sesiones.filter((s) => s.fecha >= primero && s.fecha < desde);
        // La carga de cada ejercicio llega desde 0020_carga_de_cada_ejercicio.sql y lo guardado de antes no la trae: la
        // primera vez que llega se pide todo de nuevo, así la última vez de cada ejercicio dice cómo se anotó.
        const alguno = (xs: readonly SesionDeAscent[], si: (e: EjercicioDeAscent) => boolean) => xs.some((s) => s.ejercicios.some(si));
        const todas = alguno(sesiones, (e) => e.carga !== undefined) && alguno(guardadas, (e) => e.carga === undefined)
          ? await op.remoto.sesionesDeAscent(primero).catch(() => null) : null;
        if (de !== generacion) return;
        // Las metas, solo si llegaron y nada cambió acá desde que salió el pedido: si no, quedan las de ahora (con lo que
        // la persona puso o borró, y lo que espera al servidor) y se piden otra vez al terminar el último cambio.
        const alDia = metas !== undefined && !metasEnCurso && vez === cambiosDeMetas;
        cambiar({
          sesiones: todas ?? [...guardadas, ...sesiones].sort(porFecha),
          marcas, pesos, rutina, ajustes, ...(alDia ? { metas: deLaBase(metas ?? []) } : {}), desde: primero, llego: ahora().toISOString(),
        });
        guardar();
        if (metas !== undefined && !alDia) descartar();
      } catch {
        // Sin conexión o el servidor no contesta: queda lo que había.
      }
    })().finally(() => {
      refrescando = null;
      if (otraVez) {
        otraVez = false;
        refrescar().catch(() => {});
      }
    });
    return refrescando;
  }

  /** Solo las metas, otra vez (un refresco las descartó por un cambio de acá), con la misma regla que el refresco. */
  async function releerMetas() {
    const de = generacion;
    const vez = cambiosDeMetas;
    const metas = await metasDelServidor();
    if (de !== generacion || metas === undefined) return;
    if (metasEnCurso || vez !== cambiosDeMetas) return descartar();
    cambiar({ metas: deLaBase(metas ?? []) });
    guardar();
  }
  /** Unas metas del servidor que no se aplicaron: se piden otra vez al terminar el último cambio en curso (o ya). */
  function descartar() {
    if (metasEnCurso) descartadas = true;
    else releerMetas().catch(() => {});
  }
  /** Terminó un cambio de una meta de la generación `de` (los de otra cuenta o vínculo ya no cuentan). */
  function terminarCambio(de: number) {
    if (de !== generacion) return;
    metasEnCurso--;
    cambiosDeMetas++;
    if (metasEnCurso || !descartadas) return;
    descartadas = false;
    releerMetas().catch(() => {});
  }

  /**
   * Guarda una meta en el servidor y devuelve su id; null si ya no hace falta (`sigue` dice si todavía está). Si la que
   * se cambia ya no está (la borraron en Ascent), se guarda como nueva: con 0022, cambia la del ejercicio si hay otra. Si
   * no contesta a tiempo, se mira si quedó guardada. Si no se guardó, rechaza con por qué.
   */
  async function subir(m: MetaPedida, sigue: () => boolean): Promise<string | null> {
    const guardarla = op.remoto.guardarMetaDeFuerza!;
    try {
      const id = await guardarla(m);
      if (id) return id;
      if (!m.id) throw fallo('sinVinculo');
      if (!sigue()) return null;
      const nueva = await guardarla({ ejercicio: m.ejercicio, kilos: m.kilos, reps: m.reps });
      if (nueva) return nueva;
      throw fallo('sinVinculo');
    } catch (e) {
      if (esFallo(e)) throw e;
      if (!sinRespuesta(e)) throw fallo(e instanceof Error && e.message === 'demasiadas' ? 'demasiadas' : 'red');
      const lista = await metasDelServidor();
      const quedo = lista?.find((x) => x.ejercicio === m.ejercicio && x.kilos === m.kilos && x.reps === m.reps);
      if (quedo) return quedo.id;
      throw fallo(lista === undefined ? 'sinRespuesta' : lista === null ? 'sinVinculo' : 'red');
    }
  }

  return {
    estado: () => estado,
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    iniciar,
    refrescar,
    /**
     * Crea o cambia una meta de fuerza: queda al instante y se guarda atrás. Si el servidor no la guarda, vuelve como está
     * en la base y rechaza con por qué (falloDeMeta): lo dice quien la pide; sin vínculo, además, se refresca. Una por
     * ejercicio: sin id, si el ejercicio ya tiene una guardada, se cambia esa (como en el servidor desde
     * 0022_una_meta_por_ejercicio.sql). Si la persona la borra mientras tanto, no vuelve.
     */
    async guardarMeta(pedida: MetaPedida) {
      if (!op.remoto.guardarMetaDeFuerza) return;
      const suya = pedida.id ? undefined : estado.metas.find((x) => x.ejercicio === pedida.ejercicio && !x.pendiente);
      const m = suya ? { ...pedida, id: suya.id } : pedida;
      const de = generacion;
      const clave = m.id ?? `pendiente:${++metasPuestas}`;
      const antes = estado.metas.find((x) => x.id === clave);
      const puesta: MetaDeFuerza = antes ? { ...antes, ...m, id: clave } : { ...m, id: clave, pendiente: true };
      // Desvinculó o cambió de cuenta (las metas ya son otras), o la persona la borró: lo que conteste ya no va.
      const sigue = () => de === generacion && estado.metas.some((x) => x.id === clave);
      metasEnCurso++;
      cambiar({ metas: antes ? estado.metas.map((x) => (x === antes ? puesta : x)) : [...estado.metas, puesta] });
      const previo = enFila.get(m.ejercicio);
      let soltar = () => {};
      const turno = new Promise<void>((r) => (soltar = r));
      enFila.set(m.ejercicio, turno);
      try {
        if (previo) {
          await previo;
          // Mientras esperaba, otra cuenta u otro vínculo, o la persona la borró: ya no sale.
          if (!sigue()) return;
        }
        const id = await subir(m, sigue);
        if (!id || de !== generacion) return;
        const guardada = { id, ejercicio: m.ejercicio, kilos: m.kilos, reps: m.reps };
        // La base ya la tiene así, aunque acá se haya borrado mientras tanto (si ese borrado falla, vuelve así).
        enLaBase.delete(clave);
        enLaBase.set(id, guardada);
        // Si se borró, o ya se ve un cambio que salió después (contesta él), lo que se ve queda.
        if (!sigue() || estado.metas.find((x) => x.id === clave) !== puesta) return;
        // En su lugar, y una sola vez si ese id ya estaba.
        cambiar({ metas: estado.metas.filter((x) => x.id !== id || x.id === clave).map((x) => (x.id === clave ? guardada : x)) });
        guardar();
      } catch (e) {
        if (de !== generacion) return;
        // Vuelve como está en la base (salvo que otro cambio ya la haya puesto distinta), y el teléfono guarda lo que se ve.
        const deLaBaseAhora = enLaBase.get(clave);
        cambiar({ metas: estado.metas.flatMap((x) => (x !== puesta ? [x] : deLaBaseAhora ? [deLaBaseAhora] : [])) });
        guardar();
        // Sin vínculo: la sección pasa a desvinculada, como al desvincular desde Ascent.
        if (falloDeMeta(e) === 'sinVinculo') refrescar().catch(() => {});
        throw e;
      } finally {
        soltar();
        if (enFila.get(m.ejercicio) === turno) enFila.delete(m.ejercicio);
        terminarCambio(de);
      }
    },
    /**
     * Borra una meta: se va al instante. Si el servidor no la borra, vuelve a su lugar como está en la base y rechaza con
     * por qué (falloDeMeta); si ya no estaba (la borraron en Ascent), queda borrada. Una recién puesta todavía no tiene
     * id: no se borra.
     */
    async borrarMeta(id: string) {
      const borrarla = op.remoto.borrarMetaDeFuerza;
      const antes = estado.metas.find((x) => x.id === id);
      if (!borrarla || !antes || antes.pendiente) return;
      const de = generacion;
      const lugar = estado.metas.indexOf(antes);
      metasEnCurso++;
      cambiar({ metas: estado.metas.filter((x) => x !== antes) });
      try {
        await borrarla(id).catch(async (e: unknown) => {
          // Sin respuesta a tiempo pudo haberse borrado igual: se mira la lista (sin vínculo, ya no está).
          const lista = sinRespuesta(e) ? await metasDelServidor() : undefined;
          if (lista === undefined) throw fallo(sinRespuesta(e) ? 'sinRespuesta' : 'red');
          if (lista?.some((x) => x.id === id)) throw fallo('red');
        });
        if (de !== generacion) return;
        enLaBase.delete(id);
        guardar();
      } catch (e) {
        if (de !== generacion) return;
        // No con un cambio que tampoco se guardó: con lo último que tiene la base. Y si ya volvió, una sola vez.
        const enBase = enLaBase.get(id);
        if (enBase && !estado.metas.some((x) => x.id === id)) cambiar({ metas: [...estado.metas.slice(0, lugar), enBase, ...estado.metas.slice(lugar)] });
        guardar();
        throw e;
      } finally {
        terminarCambio(de);
      }
    },
    /** La sesión de Moss en este teléfono: sin sesión no hay vínculo, y con otra cuenta se empieza de cero. */
    async ponerSesion(nuevo: string | null) {
      // La primera vez sigue aunque no haya sesión: así se va lo guardado de una sesión que ya no está.
      const primera = !sesionSabida;
      sesionSabida = true;
      if (!primera && nuevo === usuario && estado.conCuenta === !!nuevo) return;
      const otra = usuario !== null && nuevo !== usuario;
      usuario = nuevo;
      otraGeneracion();
      if (!nuevo) {
        cambiar({ ...vacio(), metas: deLaBase([]), conCuenta: false });
        if (leyendo) guardar();
        return;
      }
      cambiar({ conCuenta: true, ...(otra || (deAntes && deAntes.usuario !== nuevo) ? { ...vacio(), metas: deLaBase([]) } : {}) });
      await iniciar();
      usarLoDeAntes();
      await refrescar();
    },
    /**
     * Vincula con la sesión de Ascent (la del llavero o la de entrar con su correo). Si sale, la
     * cuenta queda vinculada ya y lo de Ascent llega atrás.
     */
    async vincular(token: string) {
      const r = await op.remoto.vincular(token);
      if (r.ok) {
        otraGeneracion();
        cambiar({ vinculo: { vinculada: true, nombre: r.nombre, desde: ahora().toISOString() } });
        guardar();
        refrescar().catch(() => {});
      }
      return r;
    },
    /** Desvincula en el servidor y saca lo de Ascent del teléfono. Sin conexión, tira el error. */
    async desvincular() {
      await op.remoto.desvincular();
      otraGeneracion();
      cambiar({ ...vacio(), metas: deLaBase([]), noches: estado.noches });
      guardar();
    },
    /** Lo dormido cada noche, para «Por qué no subes» y tu año: se junta mientras está vinculada. */
    anotarNoches(noches: { clave: ClaveDia; dormido: number }[]) {
      if (!estado.vinculo.vinculada) return;
      const corte = sumarDias(op.hoy(), -DIAS_DE_NOCHES);
      const nuevas: Record<ClaveDia, number> = {};
      for (const [k, v] of Object.entries(estado.noches)) if (k >= corte) nuevas[k] = v;
      let cambio = Object.keys(nuevas).length !== Object.keys(estado.noches).length;
      for (const n of noches) {
        const m = Math.round(n.dormido);
        if (n.clave < corte || nuevas[n.clave] === m) continue;
        nuevas[n.clave] = m;
        cambio = true;
      }
      if (!cambio) return;
      cambiar({ noches: nuevas });
      guardar();
    },
    /** «¿Cómo te sientes para entrenar?» de hoy (null lo borra): queda en el teléfono y no sube. */
    ponerComoTeSientes(n: number | null) {
      const fecha = op.hoy();
      if (n === null ? !estado.siente : estado.siente?.fecha === fecha && estado.siente.n === n) return;
      cambiar({ siente: n === null ? null : { fecha, n } });
      guardar();
    },
  };
}

// ------------------------------------------------------------ el de la app

const CLAVE = 'ascent';

/** Lo de Ascent que mueve la meta de cada día (metaConAscentDe): con el vínculo, desde cuándo llegaron sus sesiones, y ellas. */
const gimnasioDe = (d: Pick<DeAscent, 'vinculo' | 'desde' | 'sesiones'>): GimnasioDeAscent | null =>
  (d.vinculo.vinculada && d.desde ? { desde: d.desde, sesiones: d.sesiones } : null);

/** Lo mismo, de lo que quedó guardado en el teléfono (los ajustes del almacén): con eso arranca el almacén, antes de que Ascent lea lo suyo. */
export function gimnasioGuardado(ajustes: Record<string, string>): GimnasioDeAscent | null {
  const g = leerGuardado(ajustes[CLAVE] ?? null);
  return g ? gimnasioDe(g) : null;
}

let elDeAscent: AlmacenDeAscent | undefined;

export function deAscent(): AlmacenDeAscent {
  if (elDeAscent) return elDeAscent;
  const almacen = elAlmacen();
  const conElAlmacen = async <T>(tarea: (r: Repositorio) => Promise<T>) => {
    await almacen.iniciar();
    return almacen.enCola(tarea);
  };
  const a = crearAscent({
    remoto: ascentRemoto,
    guardado: { leer: () => conElAlmacen((r) => r.leerAjuste(CLAVE)), escribir: (texto) => conElAlmacen((r) => r.guardarAjuste(CLAVE, texto)) },
    hoy: () => almacen.estado().hoy,
  });
  elDeAscent = a;
  a.iniciar().catch(() => {});
  oirLaSesion((usuario) => {
    a.ponerSesion(usuario).catch(() => {});
  });
  AppState.addEventListener('change', (e) => {
    if (e === 'active') a.refrescar().catch(() => {});
  });
  // El gimnasio automático (spec/ascent.md, función 9): con una sesión de hoy en Ascent, los hábitos
  // con la fuente «Ascent» se encienden solos, como los de Salud (y como Salud, nunca los apagan).
  // Y lo dormido de cada noche se va guardando mientras está vinculada.
  let antes: { salud: unknown; noches: unknown } = { salud: null, noches: null };
  // Los pesos de Ascent también cuentan para el control (sin vínculo, ninguno): van al almacén cuando cambian.
  let pesosPuestos: readonly PesoCompartido[] | null = null;
  // undefined: todavía no se le pasó nada, y el almacén arrancó con lo guardado (gimnasioGuardado).
  let gimnasioPuesto: GimnasioDeAscent | null | undefined;
  const revisar = () => {
    const e = almacen.estado();
    const d = a.estado();
    if (!e.listo) return;
    const pesos = d.vinculo.vinculada ? d.pesos : SIN_PESOS;
    if (pesos !== pesosPuestos) {
      pesosPuestos = pesos;
      almacen.ponerPesosDeAscent(pesos);
    }
    // Sus sesiones mueven la meta de cada día (metaConAscent): las estrellas de la comida se miden con la misma.
    const gimnasio = gimnasioDe(d);
    // Hasta que Ascent leyó lo suyo, vale lo que el almacén tomó de lo guardado: su estado vacío no es «sin vínculo».
    if (d.listo && (gimnasioPuesto === undefined || gimnasio?.sesiones !== gimnasioPuesto?.sesiones || gimnasio?.desde !== gimnasioPuesto?.desde)) {
      gimnasioPuesto = gimnasio;
      almacen.ponerGimnasioDeAscent(gimnasio);
    }
    if (!d.vinculo.vinculada) return;
    if (entrenoEl(d.sesiones, e.hoy)) {
      for (const h of habitosDelDia(e.habitos, e.hoy)) {
        if (h.fuente.tipo === 'ascent' && seEnciendeSola(e.marcas.get(claveDeMarca(h.id, e.hoy)), 'ascent')) almacen.marcar(h.id, true, 'ascent');
      }
    }
    if (e.salud !== antes.salud || e.noches !== antes.noches) {
      antes = { salud: e.salud, noches: e.noches };
      const noches = conNochesDeMoss(e.salud?.noches ?? [], [...e.noches.values()], (ms) => -new Date(ms).getTimezoneOffset());
      a.anotarNoches(noches.filter((n) => n.confianza.duracion !== 'baja').map((n) => ({ clave: n.clave, dormido: n.dormido })));
    }
  };
  almacen.suscribir(revisar);
  a.suscribir(revisar);
  return a;
}

/** Lo de Ascent, para las pantallas: se vuelve a dibujar cuando cambia. */
export function useAscent(): DeAscent {
  const a = deAscent();
  return useSyncExternalStore(a.suscribir, a.estado);
}

// ------------------------------------------------------------ lo que cambia en otras secciones

/** La hora en que se supone que entrena quien anotó el día sin cronómetro: la de Perfil, o las 18. */
export const horaDeEntrenar = (e: Pick<Estado, 'entreno'>) => e.entreno?.hora ?? 18 * 60;

const memoria = new Map<string, Macros>();
let memoriaDe = -1;

/**
 * La meta de un día con Ascent vinculada (metaConAscentDe, en conAscent.ts): las calorías según el día de la semana del
 * control y la proteína de la sesión. Es la misma cuenta con que el almacén mide las estrellas de la comida
 * (metaQueSeVe), con lo que le pasa ascent.ts. Sin vínculo, sin sesiones en las últimas 4 semanas o sin datos de esa
 * semana, la de siempre.
 */
export function metaConAscent(base: Macros, e: Pick<Estado, 'metas' | 'perfil' | 'pesos' | 'hoy'>, dia: ClaveDia): Macros {
  const d = deAscent().estado();
  const gimnasio = gimnasioDe(d);
  if (!gimnasio) return base;
  if (memoriaDe !== d.version) {
    memoria.clear();
    memoriaDe = d.version;
  }
  const vigente = metaVigente(e, dia);
  const clave = `${dia}|${e.hoy}|${e.perfil?.diaDelControl}|${e.metas[0]?.desde}|${vigente?.kcal}|${vigente?.proteina}|${vigente?.carbohidratos}|${vigente?.grasas}|${e.pesos.at(-1)?.kg}|${e.perfil?.sexo}`;
  const guardada = memoria.get(clave);
  if (guardada) return guardada;
  const r = metaConAscentDe(base, e, dia, gimnasio);
  // La de siempre no se guarda: sale del reparto de la semana, que no está en la clave.
  if (r !== base) memoria.set(clave, r);
  return r;
}

let ultimo: { base: Estado; version: number; estado: Estado } | undefined;

/**
 * El estado del almacén, otro objeto también cuando cambia lo de Ascent: así lo que se calcula con
 * los dos (la meta del día) se vuelve a dibujar cuando llega una sesión.
 */
export function estadoConAscent(): Estado {
  const base = elAlmacen().estado();
  const version = deAscent().estado().version;
  if (ultimo && ultimo.base === base && ultimo.version === version) return ultimo.estado;
  const estado = ultimo && ultimo.base === base ? { ...base } : base;
  ultimo = { base, version, estado };
  return estado;
}

export function suscribirConAscent(oyente: () => void) {
  const sinAlmacen = elAlmacen().suscribir(oyente);
  const sinAscent = deAscent().suscribir(oyente);
  return () => {
    sinAlmacen();
    sinAscent();
  };
}

/** El peso de las dos apps con el vínculo (spec/ascent.md, función 4); sin vínculo, el de Moss. */
export function usePesoUnico(propios: Peso[]): Peso[] {
  const d = useAscent();
  const compartidos = d.vinculo.vinculada ? d.pesos : null;
  return useMemo(() => (compartidos?.length ? pesoUnico(propios, compartidos) : propios), [propios, compartidos]);
}
