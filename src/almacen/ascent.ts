// Lo de Ascent en el teléfono (spec/ascent.md): si la cuenta está vinculada y lo último que llegó de
// Ascent por el vínculo (los días de gimnasio con sus series, las marcas y el peso de las dos apps).
// Se guarda en los ajustes del almacén, que no suben a la cuenta ni van a la copia de iCloud: así
// anda sin red y al abrir no parpadea. Se refresca al abrir la app, al cambiar la sesión y al
// volver a primer plano. Con el vínculo, además, enciende el gimnasio automático y va guardando lo
// dormido cada noche (Salud da cuatro semanas; «Por qué no subes» mira más).

import { useMemo, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { entrenoEl, metaDelDiaConAscent, pesoUnico, primerDiaQueHaceFalta, type MarcaDeAscent, type PesoCompartido, type SesionDeAscent } from '@/dominio/conAscent';
import { ultimoDiaDeControl, type Peso } from '@/dominio/control';
import { claveDeMarca } from '@/dominio/dias';
import { diaDeLaSemana, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { habitosDelDia } from '@/dominio/habitos';
import type { Macros } from '@/dominio/metas';
import { conNochesDeMoss } from '@/dominio/sinReloj';
import type { ErrorDeVincular, EstadoDelVinculo } from '@/lib/ascentRemoto';
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
};

export type DeAscent = {
  /** Ya se leyó lo guardado en el teléfono. */
  listo: boolean;
  /** Hay sesión de Moss en este teléfono: sin ella no se puede vincular. */
  conCuenta: boolean;
  vinculo: EstadoDelVinculo;
  sesiones: SesionDeAscent[];
  marcas: MarcaDeAscent[];
  pesos: PesoCompartido[];
  /** Desde qué día están las sesiones; null sin ninguna. */
  desde: ClaveDia | null;
  /** Cuándo llegó lo último de Ascent (ISO). */
  llego: string | null;
  /** Lo dormido cada noche, en minutos, que se va juntando mientras está vinculada. */
  noches: Record<ClaveDia, number>;
  /** Los días en que se dijo «buen día para intentar marca», por ejercicio: para los aciertos. */
  avisos: { ejercicio: string; fecha: ClaveDia }[];
  /** Sube con cada cambio. */
  version: number;
};

/** Las sesiones: las de este año y, en enero, las de 12 semanas atrás (el rendimiento mira 8). */
const DIAS_DE_SESIONES = 84;
/** Con los ejercicios de cada serie solo las de las últimas 9 semanas: lo de antes cuenta para tu año. */
const DIAS_CON_EJERCICIOS = 63;
/** Las marcas de un año (y la mejor de siempre de cada ejercicio, que el servidor suma igual). */
const DIAS_DE_MARCAS = 365;
/** El peso, como el gráfico más largo de Progreso y la tendencia que lo arranca. */
const DIAS_DE_PESOS = 120;
const DIAS_DE_NOCHES = 400;

const SIN_VINCULO: EstadoDelVinculo = { vinculada: false, nombre: null, desde: null };
const vacio = (): Omit<DeAscent, 'listo' | 'conCuenta' | 'version'> => ({ vinculo: SIN_VINCULO, sesiones: [], marcas: [], pesos: [], desde: null, llego: null, noches: {}, avisos: [] });
const porFecha = <T extends { fecha: ClaveDia }>(a: T, b: T) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);

type Guardado = ReturnType<typeof vacio> & { v: 1; usuario: string | null };

function leerGuardado(texto: string | null): Guardado | null {
  try {
    const x = texto ? (JSON.parse(texto) as Partial<Guardado>) : null;
    if (!x || x.v !== 1 || !x.vinculo || !Array.isArray(x.sesiones) || !Array.isArray(x.marcas) || !Array.isArray(x.pesos)) return null;
    return { ...vacio(), ...x, v: 1, usuario: x.usuario ?? null, noches: x.noches ?? {}, avisos: Array.isArray(x.avisos) ? x.avisos : [] } as Guardado;
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
  let leyendo: Promise<void> | undefined;
  const oyentes = new Set<() => void>();

  const cambiar = (nuevo: Partial<DeAscent>) => {
    estado = { ...estado, ...nuevo, version: estado.version + 1 };
    oyentes.forEach((o) => o());
  };

  /** Lo de antes de las últimas 9 semanas va sin las series: alcanza para tu año y pesa mucho menos. */
  function guardar() {
    const corte = sumarDias(op.hoy(), -DIAS_CON_EJERCICIOS);
    const { listo: _l, conCuenta: _c, version: _v, ...datos } = estado;
    const g: Guardado = { ...datos, v: 1, usuario, sesiones: estado.sesiones.map((s) => (s.fecha < corte && s.ejercicios.length ? { ...s, ejercicios: [] } : s)) };
    op.guardado.escribir(JSON.stringify(g)).catch(() => {});
  }

  /** Lo guardado, si es de esta cuenta (o si todavía no se sabe de quién es la sesión). Sin sesión, nada. */
  function usarLoDeAntes() {
    if (!deAntes || (sesionSabida && (!usuario || deAntes.usuario !== usuario))) return;
    const { v: _v, usuario: _u, ...datos } = deAntes;
    cambiar({ ...datos });
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
            cambiar({ ...vacio(), noches: estado.noches });
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
        const [sesiones, marcas, pesos] = await Promise.all([
          op.remoto.sesionesDeAscent(desde),
          op.remoto.marcasDeAscent(sumarDias(hoy, -DIAS_DE_MARCAS)),
          op.remoto.pesosCompartidos(sumarDias(hoy, -DIAS_DE_PESOS)),
        ]);
        if (de !== generacion) return;
        cambiar({
          sesiones: [...estado.sesiones.filter((s) => s.fecha >= primero && s.fecha < desde), ...sesiones].sort(porFecha),
          marcas, pesos, desde: primero, llego: ahora().toISOString(),
          avisos: estado.avisos.filter((a) => a.fecha >= sumarDias(hoy, -DIAS_DE_MARCAS)),
        });
        guardar();
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

  return {
    estado: () => estado,
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
    iniciar,
    refrescar,
    /** La sesión de Moss en este teléfono: sin sesión no hay vínculo, y con otra cuenta se empieza de cero. */
    async ponerSesion(nuevo: string | null) {
      // La primera vez sigue aunque no haya sesión: así se va lo guardado de una sesión que ya no está.
      const primera = !sesionSabida;
      sesionSabida = true;
      if (!primera && nuevo === usuario && estado.conCuenta === !!nuevo) return;
      const otra = usuario !== null && nuevo !== usuario;
      usuario = nuevo;
      generacion++;
      if (!nuevo) {
        cambiar({ ...vacio(), conCuenta: false });
        if (leyendo) guardar();
        return;
      }
      cambiar({ conCuenta: true, ...(otra || (deAntes && deAntes.usuario !== nuevo) ? vacio() : {}) });
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
        generacion++;
        cambiar({ vinculo: { vinculada: true, nombre: r.nombre, desde: ahora().toISOString() } });
        guardar();
        refrescar().catch(() => {});
      }
      return r;
    },
    /** Desvincula en el servidor y saca lo de Ascent del teléfono. Sin conexión, tira el error. */
    async desvincular() {
      await op.remoto.desvincular();
      generacion++;
      cambiar({ ...vacio(), noches: estado.noches });
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
    /** Que se dijo «buen día para intentar marca» en ese ejercicio ese día. */
    anotarAviso(ejercicio: string, fecha: ClaveDia) {
      if (estado.avisos.some((a) => a.ejercicio === ejercicio && a.fecha === fecha)) return;
      cambiar({ avisos: [...estado.avisos, { ejercicio, fecha }] });
      guardar();
    },
  };
}

// ------------------------------------------------------------ el de la app

const CLAVE = 'ascent';

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
  const revisar = () => {
    const e = almacen.estado();
    const d = a.estado();
    if (!e.listo || !d.vinculo.vinculada) return;
    if (entrenoEl(d.sesiones, e.hoy)) {
      for (const h of habitosDelDia(e.habitos, e.hoy)) {
        if (h.fuente.tipo === 'ascent' && !e.marcas.get(claveDeMarca(h.id, e.hoy))?.hecho) almacen.marcar(h.id, true, 'ascent');
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
 * La meta de un día con Ascent vinculada (spec/ascent.md, funciones 5 y 8): las calorías según el
 * día de la semana del control y la proteína de la sesión. Reemplaza al reparto de la semana a
 * mano: con Ascent, los días altos son los de gimnasio. Sin vínculo, sin sesiones en las últimas 4
 * semanas o sin datos de esa semana, la de siempre.
 */
export function metaConAscent(base: Macros, e: Pick<Estado, 'metas' | 'perfil' | 'pesos' | 'hoy'>, dia: ClaveDia): Macros {
  const d = deAscent().estado();
  if (!d.vinculo.vinculada || !e.perfil || !d.desde || !e.metas.length) return base;
  const inicio = ultimoDiaDeControl(dia, e.perfil.diaDelControl ?? diaDeLaSemana(e.metas[0].desde));
  if (inicio < d.desde || !d.sesiones.some((s) => s.fecha >= sumarDias(inicio, -28) && s.fecha <= sumarDias(inicio, 6))) return base;
  const vigente = metaVigente(e, dia);
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg;
  if (!vigente || pesoKg === undefined) return base;
  if (memoriaDe !== d.version) {
    memoria.clear();
    memoriaDe = d.version;
  }
  const clave = `${dia}|${e.hoy}|${inicio}|${vigente.kcal}|${vigente.proteina}|${vigente.carbohidratos}|${vigente.grasas}|${pesoKg}|${e.perfil.sexo}`;
  const guardada = memoria.get(clave);
  if (guardada) return guardada;
  const meta = { kcal: vigente.kcal, proteina: vigente.proteina, carbohidratos: vigente.carbohidratos, grasas: vigente.grasas };
  const r = metaDelDiaConAscent({ meta, inicio, dia, hoy: e.hoy, sesiones: d.sesiones, pesoKg, sexo: e.perfil.sexo })?.meta ?? base;
  memoria.set(clave, r);
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
