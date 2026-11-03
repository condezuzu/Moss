// El diagnóstico de tu rendimiento (spec/ascent.md, «El diagnóstico»), con Ascent vinculada: cruza el
// sueño de anoche, lo que comiste y lo que falta, y el entrenamiento de hoy, y dice cómo vienes y qué
// hacer. No inventa nada: el rendimiento sale de rendimiento.ts, lo que se come de las líneas de
// alrededorDelEntreno.ts, y cada consejo, de spec/rendimiento.md, spec/entreno.md o spec/sueno.md.
// Sin culpa: describe, no reta. Con «sin déficit», nada. Si falta un dato, lo dice y no adivina.

import { lineasDelDia, type Contexto, type Linea, type Sesion } from './alrededorDelEntreno';
import type { Rendimiento } from './rendimiento';

/** Lo que Ascent sabe de hoy: `hecha` si ya está anotada; si no, la que se espera. */
export type SesionDeHoy = Sesion & { hecha: boolean };

export type EntradasDelDiagnostico = {
  /** Lo de las líneas de la comida: la hora, la meta, lo comido y lo anotado. Las sesiones salen de `sesion`. */
  contexto: Omit<Contexto, 'sesiones'>;
  sesion: SesionDeHoy | null;
  /** Hay sesiones en Ascent o un horario en Perfil: sin eso, no tener sesión hoy no quiere decir descansar. */
  sabeCuandoEntrena: boolean;
  /** Anoche, en minutos; sin noche, null. */
  noche: { dormido: number; necesidad: number; siesta: boolean } | null;
  /** Lo dormido las últimas tres noches, en minutos. */
  ultimas3: readonly number[];
  /** La deuda de las dos semanas, en minutos (null sin 5 noches). */
  deuda: number | null;
  /** El de la sesión de hoy (rendimientoEsperado); sin sesión, null. */
  rendimiento: Rendimiento | null;
  /** Si hoy es buen día para intentar marca (buenDiaParaMarca), en qué ejercicio. */
  marca: string | null;
};

export type Momento = 'antes' | 'despues' | 'descanso';
export type EstadoDelSueno = 'sinDatos' | 'bien' | 'algoCorta' | 'corta' | 'muyCorta';

export type Titular =
  | { que: 'faltaNoche' }
  | { que: 'sinHorario' }
  | { que: 'descanso' }
  | { que: 'mejor' }
  | { que: 'comoSiempre' }
  | { que: 'repeticiones' }
  | { que: 'cuesta' }
  | { que: 'entrenoHecho' }
  | { que: 'faltaProteina'; gramos: number }
  | { que: 'proteinaLista' };

/** Lo que conviene comer, y en qué momento de la sesión: la línea de la comida, tal cual. */
export type Paso = { cuando: 'antes' | 'despues' | 'dormir'; linea: Linea };

export type Consejo =
  /** Dormir poco: una siesta de 20 minutos ayuda (spec/rendimiento.md, S; Easow 2025, Cunha 2023). */
  | { que: 'siesta' }
  /** Dormir poco no cambia lo que se come: nadie probó que lo compense (spec/entreno.md, 3.6, C3). */
  | { que: 'noCompensar' }
  /** Dos de las últimas tres noches cortas (spec/rendimiento.md, D; Kong 2025, Knowles 2022). */
  | { que: 'seriesPesadas' }
  /** Una hora de deuda lleva unos cuatro días (spec/sueno.md; Kitamura 2016). */
  | { que: 'deuda' }
  /** Hay comida antes y después: no hace falta apurarse (spec/entreno.md, 2.2 y 2.3). */
  | { que: 'sinApuro' }
  /** Lo que más pesa es el total del día (spec/entreno.md, Resumen 1). */
  | { que: 'totalDelDia'; gramos: number }
  | { que: 'marca'; ejercicio: string };

export type Falta = 'sueno' | 'comida' | 'sesion';

export type Diagnostico = {
  momento: Momento;
  sueno: EstadoDelSueno;
  titular: Titular;
  pasos: Paso[];
  consejos: Consejo[];
  faltan: Falta[];
  /** La proteína de hoy; sin nada anotado, null: que no haya registro no quiere decir que no comió. */
  proteina: { comido: number; meta: number; falta: number } | null;
};

const SEIS_HORAS = 6 * 60;
const CUATRO_HORAS_Y_MEDIA = 4.5 * 60;
/** Lo que tiene que faltar de proteína para hablar del total del día (el de antes de dormir: spec/entreno.md, C1). */
const FALTA_QUE_SE_DICE = 25;
/** Desde esta deuda, en minutos, las noches ya pesan (porLasNoches). */
const DEUDA_QUE_PESA = 7 * 60;
/** Para una siesta hace falta tiempo antes de entrenar (derivado). */
const SIESTA_ANTES = 60;
const MAXIMO_DE_CONSEJOS = 3;

/** Los mismos cortes del sueño que el rendimiento (porElSueno, spec/rendimiento.md, S). */
export function estadoDelSueno(noche: EntradasDelDiagnostico['noche']): EstadoDelSueno {
  if (!noche) return 'sinDatos';
  if (noche.dormido >= noche.necesidad - 60) return 'bien';
  return noche.dormido > SEIS_HORAS ? 'algoCorta' : noche.dormido > CUATRO_HORAS_Y_MEDIA ? 'corta' : 'muyCorta';
}

/** De a 5 y hacia abajo, como lo de antes de dormir: nunca dice que falta más de lo que falta. */
const deACinco = (g: number) => Math.floor(g / 5) * 5;

function titularDeAntes(r: Rendimiento): Titular {
  const { max, vol } = r.categoria;
  if (max === 'algoMenos' || max === 'menos') return { que: 'cuesta' };
  if (vol === 'algoMenos' || vol === 'menos') return { que: 'repeticiones' };
  return max === 'mejor' ? { que: 'mejor' } : { que: 'comoSiempre' };
}

/**
 * Cómo vienes y qué hacer hoy. Sin sesión ni horario no adivina si descansas; sin noche no dice cómo
 * puedes rendir; sin nada anotado no dice cuánto falta. Las líneas son las de la comida, y antes de
 * entrenar se adelanta también la de después, con la misma regla. Con «sin déficit», null.
 */
export function diagnostico(x: EntradasDelDiagnostico): Diagnostico | null {
  const c = x.contexto;
  if (c.sinDeficit) return null;
  const sueno = estadoDelSueno(x.noche);
  const momento: Momento = !x.sesion ? 'descanso' : x.sesion.hecha ? 'despues' : 'antes';
  const conComida = Object.keys(c.anotado).length > 0;
  const falta = Math.max(0, c.meta.proteina - c.comido.proteina);
  const faltan: Falta[] = [];
  if (sueno === 'sinDatos') faltan.push('sueno');
  if (!conComida) faltan.push('comida');
  if (!x.sesion && !x.sabeCuandoEntrena) faltan.push('sesion');

  let titular: Titular;
  if (momento === 'despues') titular = !conComida ? { que: 'entrenoHecho' } : falta >= 5 ? { que: 'faltaProteina', gramos: deACinco(falta) } : { que: 'proteinaLista' };
  else if (momento === 'descanso') titular = x.sabeCuandoEntrena ? { que: 'descanso' } : { que: 'sinHorario' };
  else titular = sueno === 'sinDatos' || !x.rendimiento ? { que: 'faltaNoche' } : titularDeAntes(x.rendimiento);

  const sesiones = x.sesion ? [x.sesion] : [];
  const lineas = sesiones.length ? lineasDelDia({ ...c, sesiones }) : [];
  // Antes de entrenar, lo de después todavía no se ve en Comida: se adelanta con la misma regla.
  const luego = x.sesion && !x.sesion.hecha && c.ahora < x.sesion.inicio ? lineasDelDia({ ...c, sesiones, ahora: x.sesion.inicio + x.sesion.minutos }) : [];
  const delMomento = (l: Linea): Paso['cuando'] => (l.clase === 'antesDeDormir' ? 'dormir' : l.clase === 'despues' || l.clase === 'despuesPronto' || l.clase === 'reponer' ? 'despues' : 'antes');
  const pasos: Paso[] = lineas.map((linea) => ({ cuando: delMomento(linea), linea }));
  for (const linea of luego) {
    if (delMomento(linea) === 'despues' && !pasos.some((p) => p.linea.comida === linea.comida)) pasos.push({ cuando: 'despues', linea });
  }

  const consejos: Consejo[] = [];
  if (x.marca && momento === 'antes' && titular.que !== 'faltaNoche') consejos.push({ que: 'marca', ejercicio: x.marca });
  const nocheCorta = sueno === 'corta' || sueno === 'muyCorta';
  if (nocheCorta && momento === 'antes' && !x.noche?.siesta && x.sesion && x.sesion.inicio - c.ahora >= SIESTA_ANTES) consejos.push({ que: 'siesta' });
  if (x.ultimas3.filter((m) => m <= SEIS_HORAS).length >= 2 && momento === 'antes') consejos.push({ que: 'seriesPesadas' });
  if (nocheCorta) consejos.push({ que: 'noCompensar' });
  if (x.deuda !== null && x.deuda >= DEUDA_QUE_PESA) consejos.push({ que: 'deuda' });
  if (pasos.some((p) => p.linea.clase === 'despues') && momento === 'despues') consejos.push({ que: 'sinApuro' });
  if (momento === 'descanso' && conComida && falta >= FALTA_QUE_SE_DICE) consejos.push({ que: 'totalDelDia', gramos: deACinco(falta) });

  return {
    momento, sueno, titular, pasos, faltan,
    consejos: consejos.slice(0, MAXIMO_DE_CONSEJOS),
    proteina: conComida ? { comido: c.comido.proteina, meta: c.meta.proteina, falta } : null,
  };
}
