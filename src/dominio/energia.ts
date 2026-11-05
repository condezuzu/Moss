// La energía de estos días (lo pediste el 5/11/2026; para aprobar en la galería): si lo que comes alcanza para lo
// que entrenas. Siempre a la vista en Inicio: baja (arriba de todo, como advertencia), suficiente o alta (debajo
// de los macros), con una explicación que se abre y se pliega. Después, el mismo día, la energía del día entero
// (energiaDelDia, abajo): la comida de estos días junto con el sueño y, con Ascent, los músculos.
// Es la disponibilidad de energía de Loucks: (kcal comidas − kcal de entrenar) / kg de masa magra, por día, con
// lo anotado de los últimos 7 días. 45 o más es lo que el cuerpo necesita para todo (Loucks, Kiens y Wright 2011);
// debajo de 30 en mujeres (de 25 en hombres, que lo toleran algo mejor) es energía baja (el consenso del COI sobre
// REDs, 2023; los mismos umbrales que la regla 10 de segunElDeporte.ts). Entre los dos, un déficit sano.
// Lo anotado puede faltar: por eso solo cuentan los días con las comidas de siempre, y la explicación dice que
// es una estimación. Las señales del peso de la regla 10 (dos semanas) también la ponen baja, aunque no se anote.

import { DISPONIBILIDAD, type SenalDeEnergia } from './segunElDeporte';
import { diasEntre, type ClaveDia } from './fechas';
import type { Objetivo, Sexo } from './metas';
import type { EstadoDeLaNoche } from './rendimiento';
import type { JuicioDeLaDeuda } from './sueno';

/** Con 45 kcal o más por kg de masa magra por día, el cuerpo tiene toda la energía que necesita. */
export const ENERGIA_ALTA = 45;
/** Cuántos días mirar (sin hoy, que está a medio anotar) y cuántos tienen que estar bien anotados. */
export const DIAS_DE_ENERGIA = 7;
export const DIAS_ANOTADOS = 4;

export type EstadoDeEnergia = 'baja' | 'suficiente' | 'alta';
/** Un día anotado: lo comido, lo que gastó entrenando (kcal), cuántas comidas tiene anotadas y la meta de calorías de ese día. */
export type DiaDeEnergia = { dia: ClaveDia; kcal: number; entreno: number; anotadas: number; meta?: number };

export type EntradaDeEnergia = {
  hoy: ClaveDia;
  sexo: Sexo;
  objetivo: Objetivo;
  pesoKg: number;
  alturaCm: number;
  /** El porcentaje de grasa, si se sabe (cuestionario o cinta); si no, la masa magra sale de la altura y el peso. */
  grasaPct?: number | null;
  dias: readonly DiaDeEnergia[];
  /** Cuántas comidas suele anotar: un día cuenta con todas menos una (3 de fábrica). */
  comidasDeSiempre?: number;
  entrenaHoy?: boolean;
  /** La señal de dos semanas de la regla 10 (segunElDeporte.senalDeEnergia), si la hay. */
  senal?: SenalDeEnergia | null;
};

export type Energia = {
  estado: EstadoDeEnergia;
  /** De qué sale: lo anotado, o una señal del peso. */
  porQue: 'anotado' | SenalDeEnergia;
  /** kcal por kg de masa magra por día, en promedio; null si sale solo de la señal del peso. */
  disponible: number | null;
  /** Los días que contaron y, en promedio, lo comido y lo de entrenar. */
  dias: number;
  kcal: number | null;
  entreno: number | null;
  masaMagra: number;
  entrenaHoy: boolean;
  bajando: boolean;
  /** Si llegaste a tus calorías estos días (el 90 % de la meta, en promedio) y la meta promedio; null sin metas. */
  llegaste: boolean | null;
  meta: number | null;
};

/** Llegar a tus calorías: comer en promedio al menos el 90 % de la meta de cada día. */
export const LLEGASTE = 0.9;

/**
 * La masa magra: con la grasa, el peso sin ella; sin la grasa, la fórmula de Janmahasatian (2005), que sale de la
 * altura y el peso y se validó contra DEXA.
 */
export function masaMagraEstimada(e: Pick<EntradaDeEnergia, 'sexo' | 'pesoKg' | 'alturaCm' | 'grasaPct'>): number {
  if (e.grasaPct != null && e.grasaPct > 0 && e.grasaPct < 70) return e.pesoKg * (1 - e.grasaPct / 100);
  const imc = e.pesoKg / Math.pow(e.alturaCm / 100, 2);
  return e.sexo === 'm' ? (9270 * e.pesoKg) / (6680 + 216 * imc) : (9270 * e.pesoKg) / (8780 + 244 * imc);
}

/** La energía de estos días; null mientras no haya con qué decirla (pocos días anotados y sin señal del peso). */
export function energiaDeEstosDias(e: EntradaDeEnergia): Energia | null {
  const masaMagra = masaMagraEstimada(e);
  const minimo = Math.max(2, (e.comidasDeSiempre ?? 3) - 1);
  const cuentan = e.dias.filter((d) => {
    const atras = diasEntre(d.dia, e.hoy);
    return atras >= 1 && atras <= DIAS_DE_ENERGIA && d.anotadas >= minimo;
  });
  const promedio = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const conDatos = cuentan.length >= DIAS_ANOTADOS && masaMagra > 0;
  const disponible = conDatos ? promedio(cuentan.map((d) => (d.kcal - d.entreno) / masaMagra)) : null;
  const base = {
    disponible,
    dias: conDatos ? cuentan.length : 0,
    kcal: conDatos ? promedio(cuentan.map((d) => d.kcal)) : null,
    entreno: conDatos ? promedio(cuentan.map((d) => d.entreno)) : null,
    masaMagra,
    entrenaHoy: !!e.entrenaHoy,
    bajando: e.objetivo === 'bajar',
    ...conMeta(conDatos ? cuentan : []),
  };
  // Las señales del peso pesan más que lo anotado (spec/entreno.md 5.12, regla 10).
  if (e.senal) return { estado: 'baja', porQue: e.senal, ...base };
  if (disponible === null) return null;
  const estado: EstadoDeEnergia = disponible < DISPONIBILIDAD[e.sexo] ? 'baja' : disponible >= ENERGIA_ALTA ? 'alta' : 'suficiente';
  return { estado, porQue: 'anotado', ...base };
}

function conMeta(dias: readonly DiaDeEnergia[]): { llegaste: boolean | null; meta: number | null } {
  const con = dias.filter((d) => (d.meta ?? 0) > 0);
  if (!con.length) return { llegaste: null, meta: null };
  return {
    llegaste: con.reduce((s, d) => s + d.kcal / (d.meta as number), 0) / con.length >= LLEGASTE,
    meta: con.reduce((s, d) => s + (d.meta as number), 0) / con.length,
  };
}

/** Desde dónde la energía deja de ser baja: 30 en mujeres y 25 en hombres. */
export const pisoDe = (sexo: Sexo) => DISPONIBILIDAD[sexo];
/** Dónde cae en la barra de las tres franjas (de 15 a 60), de 0 a 1, para el dibujo. */
export const enLaBarra = (disponible: number) => Math.min(1, Math.max(0, (disponible - 15) / 45));
/** Dónde empieza cada franja en la barra: la suficiente desde el piso de cada uno, la alta desde 45. */
export const franjasDeLaBarra = (sexo: Sexo) => ({ suficiente: enLaBarra(DISPONIBILIDAD[sexo]), alta: enLaBarra(ENERGIA_ALTA) });

// ------------------------------------------------------------ la energía del día

/**
 * La energía de hoy, del día entero y no solo de la comida (lo pediste el 5/11/2026), para leer de un vistazo.
 * Sale de sus partes con la regla del eslabón más débil, como la recuperación de Ascent (recuperado.ts), y no de
 * una suma: ningún puntaje compuesto está validado contra el rendimiento (spec/estudio/ascent.md).
 * - El sueño: anoche corta (6 h o menos, o despertándote una hora antes de lo de siempre: Craven 2022, en
 *   estadoDeLaNoche) o dos de las últimas tres de 6 h o menos (Knowles 2018), baja. Algo corta (más de una hora
 *   menos de lo que necesitas) o con la deuda algo alta o alta, justa: la deuda sola no la baja, porque una
 *   noche normal ya cuenta. Sin la noche de anoche, solo dice algo si la deuda está alta.
 * - La comida de estos días (energiaDeEstosDias): baja si lo que queda después de entrenar no alcanza; justa
 *   si alcanza pero no llegaste a tus calorías; bien si llegaste o comiste de sobra.
 * - Con Ascent, los músculos de hoy: cargados, no la dejan ser alta.
 * Baja si una parte está baja; alta si el sueño y la comida están bien y los músculos no están cargados; si no,
 * suficiente. Sin el sueño ni la comida, null.
 */
export type Parte = 'baja' | 'justa' | 'bien';
export type ComoDormiste = 'muyCorta' | 'corta' | 'seguidas' | 'algoCorta' | 'deuda' | 'bien';
export type ComoComiste = 'senal' | 'muyPoco' | 'debajo' | 'llegaste' | 'deSobra' | 'alcanza';
export type Musculos = 'cargados' | 'listos';
export type LoQueLimita = 'sueno' | 'comida' | 'musculos';
/** El sueño de hoy: la noche de anoche en una palabra (null si no está), si hubo dos cortas de las últimas tres, y la deuda. */
export type SuenoDeHoy = { anoche: EstadoDeLaNoche | null; seguidas: boolean; deuda: JuicioDeLaDeuda | null };

export type EnergiaDelDia = {
  estado: EstadoDeEnergia;
  sueno: { parte: Parte; como: ComoDormiste } | null;
  comida: { parte: Parte; como: ComoComiste } | null;
  musculos: Musculos | null;
  /** La deuda de sueño en una palabra, para decirla. */
  deuda: JuicioDeLaDeuda | null;
  /** Lo que la baja o no la deja ser alta: primero lo bajo, después lo justo. */
  limita: LoQueLimita[];
  entrenaHoy: boolean;
  /** La comida de estos días con sus números, para «Más». */
  deEstosDias: Energia | null;
};

export function suenoParaLaEnergia(s: SuenoDeHoy): { parte: Parte; como: ComoDormiste } | null {
  if (s.anoche === 'muyCorta' || s.anoche === 'corta') return { parte: 'baja', como: s.anoche };
  if (s.seguidas) return { parte: 'baja', como: 'seguidas' };
  if (s.anoche === 'algoCorta') return { parte: 'justa', como: 'algoCorta' };
  if (s.deuda === 'algoAlta' || s.deuda === 'alta') return { parte: 'justa', como: 'deuda' };
  return s.anoche === null ? null : { parte: 'bien', como: 'bien' };
}

export function comidaParaLaEnergia(e: Energia | null): { parte: Parte; como: ComoComiste } | null {
  if (!e) return null;
  if (e.estado === 'baja') return { parte: 'baja', como: e.porQue === 'anotado' ? 'muyPoco' : 'senal' };
  if (e.estado === 'alta') return { parte: 'bien', como: 'deSobra' };
  if (e.llegaste === false) return { parte: 'justa', como: 'debajo' };
  return { parte: 'bien', como: e.llegaste ? 'llegaste' : 'alcanza' };
}

export function energiaDelDia(x: { deEstosDias: Energia | null; sueno: SuenoDeHoy | null; musculos?: Musculos | null; entrenaHoy?: boolean }): EnergiaDelDia | null {
  const sueno = x.sueno ? suenoParaLaEnergia(x.sueno) : null;
  const comida = comidaParaLaEnergia(x.deEstosDias);
  if (!sueno && !comida) return null;
  const musculos = x.musculos ?? null;
  const partes = { sueno, comida };
  const con = (p: Parte) => (['sueno', 'comida'] as const).filter((k) => partes[k]?.parte === p);
  const bajas = con('baja');
  const justas: LoQueLimita[] = [...con('justa'), ...(musculos === 'cargados' ? (['musculos'] as const) : [])];
  const estado: EstadoDeEnergia = bajas.length ? 'baja' : sueno?.parte === 'bien' && comida?.parte === 'bien' && musculos !== 'cargados' ? 'alta' : 'suficiente';
  return { estado, sueno, comida, musculos, deuda: x.sueno?.deuda ?? null, limita: [...bajas, ...justas], entrenaHoy: !!(x.entrenaHoy ?? x.deEstosDias?.entrenaHoy), deEstosDias: x.deEstosDias };
}
