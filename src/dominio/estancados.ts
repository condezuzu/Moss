// El estancamiento y sus razones (spec/ascent.md, «Ascent en Progreso», para aprobar), revisado con la
// evidencia el 5/11/2026 (spec/rendimiento.md, «Lo que cambió»).
// - Cuándo: la tendencia de 12 semanas dice «sin subida clara» con 8 semanas o más (tendenciaDeFuerza, en
//   rendimiento.ts), y nunca antes del umbral de Ascent (6 semanas sin marca, de fábrica). Con 3 semanas,
//   a quien sube un 1 % por mes le decía «estancado» el 63 % de las veces.
// - Las razones, de la más a la menos sólida, cada una solo con datos suficientes: lo primero es la dosis
//   (las series duras por semana y, para la fuerza, la frecuencia y la carga pesada: Pelland 2026; Lopez
//   2021; ACSM 2026); después, bajar rápido o estar en definición (Garthe 2011; Murphy y Koehler 2022), la
//   proteína contra 1,6 g por kilo (Morton 2018) y el sueño, que «puede influir» (Knowles 2018). Los años
//   de entrenamiento van aparte, de contexto (Latella 2020).
// Siempre una causa probable, no segura, dos o tres como mucho y con los números a la vista.

import { diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { claveDelEjercicio, DE_TRABAJO, dosisDeLaSesion, mejorDeLasSeries, type Bloque, type Musculo, type SesionConBloques, type UnoRMDe } from './musculos';
import type { TendenciaDeFuerza } from './rendimiento';

/** Las semanas de tendencia que hacen falta para hablar de estancamiento. */
export const SEMANAS_PARA_ESTANCADO = 8;
/** El umbral de fábrica de Ascent (sus Ajustes: 2, 3, 6 u 8 semanas sin marca). */
export const UMBRAL_DE_ASCENT = 6;
/** «Cuando subía»: las semanas antes de la mejor marca que se comparan con las de ahora. */
export const SEMANAS_ANTES = 6;

/** Si un ejercicio está estancado: la tendencia lo dice con 8 semanas o más y ya pasó el umbral de Ascent. */
export const estaEstancado = (t: TendenciaDeFuerza, semanasSinMarca: number, umbral = UMBRAL_DE_ASCENT) =>
  t.estado === 'sinSubidaClara' && t.semanas >= SEMANAS_PARA_ESTANCADO && semanasSinMarca >= umbral;

/** Las semanas (sus lunes) para comparar: las 6 de antes de la mejor marca, con ella, y las de después hasta esta. */
export function semanasParaLasRazones(mejor: ClaveDia, hoy: ClaveDia): { antes: ClaveDia[]; ahora: ClaveDia[] } {
  const lunes = lunesDe(mejor);
  const antes = Array.from({ length: SEMANAS_ANTES }, (_, i) => sumarDias(lunes, -7 * (SEMANAS_ANTES - 1 - i)));
  const ahora: ClaveDia[] = [];
  for (let l = sumarDias(lunes, 7); l <= lunesDe(hoy); l = sumarDias(l, 7)) ahora.push(l);
  return { antes, ahora };
}

/** Una semana de entreno de un ejercicio: las series duras del músculo, las veces con el ejercicio y sus series pesadas. */
export type SemanaDeEntreno = {
  lunes: ClaveDia;
  /** Las series de trabajo del músculo principal del ejercicio, como principal, con todos los ejercicios. */
  series: number;
  /** Cuántas sesiones tuvieron el ejercicio. */
  veces: number;
  /** De las series de trabajo del ejercicio con repeticiones anotadas, las pesadas (80 % del 1RM estimado o más, o 6 repeticiones o menos). */
  pesadas: number;
  conReps: number;
};

/** Pesada: con el 80 % del 1RM estimado o más, o de 6 repeticiones o menos (Lopez 2021; ACSM 2026). */
export const PESADA = 0.8;
export const REPS_PESADAS = 6;

/**
 * Lo de una semana, de lunes a domingo, con las sesiones de Ascent de esos días. Sin el 1RM de cada
 * ejercicio, el de la mejor serie de ese día: así la entrada en calor tampoco cuenta.
 */
export function semanaDeEntreno(
  sesiones: readonly (SesionConBloques & { fecha: ClaveDia })[],
  lunes: ClaveDia,
  ejercicio: Pick<Bloque, 'id' | 'ejercicio'>,
  musculo: Musculo,
  unoRM: UnoRMDe = (b) => mejorDeLasSeries(b.series),
): SemanaDeEntreno {
  const fin = sumarDias(lunes, 7);
  const deLaSemana = sesiones.filter((s) => s.fecha >= lunes && s.fecha < fin);
  const clave = claveDelEjercicio(ejercicio);
  let series = 0, veces = 0, pesadas = 0, conReps = 0;
  for (const s of deLaSemana) {
    series += dosisDeLaSesion(s, unoRM).get(musculo)?.series ?? 0;
    const bloques = s.bloques.filter((b) => claveDelEjercicio(b) === clave);
    if (bloques.length) veces++;
    for (const b of bloques) {
      const mejor = unoRM(b) ?? mejorDeLasSeries(b.series);
      for (const x of b.series) {
        if (x.reps === null || x.peso <= 0) continue;
        if (mejor && x.peso < DE_TRABAJO * mejor) continue;
        conReps++;
        if (x.reps <= REPS_PESADAS || (mejor !== null && x.peso >= PESADA * mejor)) pesadas++;
      }
    }
  }
  return { lunes, series, veces, pesadas, conReps };
}

const promedio = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
const varianza = (xs: readonly number[]) => {
  const m = promedio(xs);
  return xs.length > 1 ? xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1) : 0;
};

/**
 * Si algo bajó de verdad: de cada lado, 3 semanas o más, y la diferencia pasa dos errores estándar de lo
 * que cambia de una semana a otra en la propia persona, y un mínimo (si todas las semanas son iguales, el
 * error es 0 y cualquier cosa contaría). Devuelve los dos promedios, o null sin datos.
 */
export function bajoDeVerdad(antes: readonly number[], ahora: readonly number[], minimo: number): { antes: number; ahora: number; bajo: boolean } | null {
  if (antes.length < 3 || ahora.length < 3) return null;
  const a = promedio(antes), b = promedio(ahora);
  const ee = Math.sqrt(varianza(antes) / antes.length + varianza(ahora) / ahora.length);
  return { antes: a, ahora: b, bajo: a - b > 2 * ee && a - b >= minimo };
}

/** Lo mínimo que cuenta: 2 series duras por semana y media sesión por semana. */
export const MENOS_SERIES = 2;
export const MENOS_VECES = 0.5;

export type Razon =
  /** Menos series duras por semana del músculo que cuando subía. */
  | { que: 'series'; antes: number; ahora: number }
  /** Menos veces por semana con el ejercicio. */
  | { que: 'frecuencia'; antes: number; ahora: number }
  /** Pocas series pesadas, si buscas fuerza: menos de un tercio. */
  | { que: 'pesadas'; pesadas: number; de: number }
  /** Bajando más de un 1 % del peso por semana. */
  | { que: 'bajando'; porSemana: number }
  /** En definición (objetivo «bajar»), a un ritmo tranquilo: que la fuerza se mantenga ya es un buen resultado. */
  | { que: 'definicion' }
  /** La proteína de estas semanas por debajo de 1,6 g por kilo por día. */
  | { que: 'proteina'; gPorKg: number }
  /** El sueño de estas semanas por debajo de 6 h, o 45 minutos menos que cuando subía. */
  | { que: 'sueno'; ahora: number; antes: number | null };

export type Faltan = 'series' | 'comida' | 'sueno';
export type RazonesDeEstancamiento = {
  razones: Razon[];
  /** «Con años de entrenamiento se sube más lento»: de contexto, no como causa. */
  anios: number | null;
  /** Lo que no se pudo mirar por falta de datos. */
  faltan: Faltan[];
};

export const MAXIMO_DE_RAZONES = 3;
export const POCAS_PESADAS = 1 / 3;
/** Con menos de 6 series con repeticiones en las semanas de ahora, no se dice nada de la carga. */
export const SERIES_PARA_LA_CARGA = 6;
export const BAJANDO_RAPIDO = 1;
export const PROTEINA_POR_KG = 1.6;
/** La comida cuenta en una semana con 4 días anotados o más, y hacen falta 2 de esas semanas. */
export const DIAS_DE_COMIDA = 4;
export const SEMANAS_DE_COMIDA = 2;
export const SUENO_POCO = 6 * 60;
export const SUENO_MENOS = 45;
/** Desde 2 años entrenando se dice el contexto. */
export const ANIOS_DE_CONTEXTO = 2;

/**
 * Las razones de un ejercicio estancado, de la más a la menos sólida: las series duras del músculo, las
 * veces por semana, la carga pesada, bajar rápido (o estar en definición), la proteína y el sueño. Dos o
 * tres como mucho. Con «sin déficit», nada de lo que habla de bajar.
 */
export function razonesDeEstancamiento(p: {
  antes: readonly SemanaDeEntreno[];
  ahora: readonly SemanaDeEntreno[];
  objetivo: 'bajar' | 'mantener' | 'subir';
  sinDeficit?: boolean;
  /** Lo que bajas por semana, en % del peso (positivo es bajar), de la tendencia del peso. */
  bajaSemanal: number | null;
  /** La comida de cada semana de ahora: los días anotados y la proteína promedio de esos días. */
  comida: readonly { dias: number; proteina: number }[];
  pesoKg: number;
  /** Lo dormido en promedio cuando subía y ahora, en minutos (null sin noches). */
  sueno: { antes: number | null; ahora: number | null };
  anios: number | null;
}): RazonesDeEstancamiento {
  const razones: Razon[] = [];
  const faltan: Faltan[] = [];

  const series = bajoDeVerdad(p.antes.map((s) => s.series), p.ahora.map((s) => s.series), MENOS_SERIES);
  if (!series) faltan.push('series');
  else if (series.bajo) razones.push({ que: 'series', antes: series.antes, ahora: series.ahora });
  const veces = bajoDeVerdad(p.antes.map((s) => s.veces), p.ahora.map((s) => s.veces), MENOS_VECES);
  if (veces?.bajo) razones.push({ que: 'frecuencia', antes: veces.antes, ahora: veces.ahora });
  const conReps = p.ahora.reduce((s, x) => s + x.conReps, 0);
  const pesadas = p.ahora.reduce((s, x) => s + x.pesadas, 0);
  if (conReps >= SERIES_PARA_LA_CARGA && pesadas / conReps < POCAS_PESADAS) razones.push({ que: 'pesadas', pesadas, de: conReps });

  if (!p.sinDeficit) {
    if (p.bajaSemanal !== null && p.bajaSemanal > BAJANDO_RAPIDO) razones.push({ que: 'bajando', porSemana: p.bajaSemanal });
    else if (p.objetivo === 'bajar') razones.push({ que: 'definicion' });
  }

  const conComida = p.comida.filter((c) => c.dias >= DIAS_DE_COMIDA);
  if (conComida.length < SEMANAS_DE_COMIDA || p.pesoKg <= 0) faltan.push('comida');
  else {
    const gPorKg = promedio(conComida.map((c) => c.proteina)) / p.pesoKg;
    if (gPorKg < PROTEINA_POR_KG) razones.push({ que: 'proteina', gPorKg });
  }

  if (p.sueno.ahora === null) faltan.push('sueno');
  else if (p.sueno.ahora < SUENO_POCO || (p.sueno.antes !== null && p.sueno.antes - p.sueno.ahora >= SUENO_MENOS)) {
    razones.push({ que: 'sueno', ahora: p.sueno.ahora, antes: p.sueno.antes });
  }

  return { razones: razones.slice(0, MAXIMO_DE_RAZONES), anios: p.anios !== null && p.anios >= ANIOS_DE_CONTEXTO ? p.anios : null, faltan };
}

/** Las sesiones de un ejercicio en puntos para la tendencia: la semana (desde `origen`) y el 1RM estimado de su mejor serie. */
export function puntosDelEjercicio(sesiones: readonly (SesionConBloques & { fecha: ClaveDia })[], ejercicio: Pick<Bloque, 'id' | 'ejercicio'>, origen: ClaveDia): { t: number; e1rm: number; fecha: ClaveDia }[] {
  const clave = claveDelEjercicio(ejercicio);
  return sesiones.flatMap((s) => {
    const mejor = s.bloques.filter((b) => claveDelEjercicio(b) === clave).reduce<number | null>((m, b) => {
      const v = mejorDeLasSeries(b.series);
      return v !== null && (m === null || v > m) ? v : m;
    }, null);
    return mejor === null ? [] : [{ t: diasEntre(origen, s.fecha) / 7, e1rm: mejor, fecha: s.fecha }];
  });
}
