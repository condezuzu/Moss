// El diagnóstico de tu rendimiento (spec/ascent.md, «El diagnóstico»), con Ascent vinculada: cruza el
// sueño de anoche, lo que comiste y lo que falta, y el entrenamiento de hoy, y dice cómo vienes y qué
// hacer. No inventa nada: la noche sale de rendimiento.ts, el titular de recuperado.ts, lo que se come de
// las líneas de alrededorDelEntreno.ts, y cada consejo, de spec/rendimiento.md, spec/entreno.md o
// spec/sueno.md. Sin culpa: describe, no reta. Con «sin déficit», nada. Si falta un dato, lo dice y no
// adivina. Desde el 5/11/2026 no dice «puedes ir más fuerte»: ningún puntaje predice un día mejor.

import { lineasDelDia, type Contexto, type Linea, type Sesion } from './alrededorDelEntreno';
import type { Titular as TitularDelDia } from './recuperado';
import { suenoCorto, type CercaDeLaMarca, type CondicionesDeLaMarca } from './rendimiento';

/** Lo que Ascent sabe de hoy: `hecha` si ya está anotada; si no, la que se espera. */
export type SesionDeHoy = Sesion & { hecha: boolean };

export type EntradasDelDiagnostico = {
  /** Lo de las líneas de la comida: la hora, la meta, lo comido y lo anotado. Las sesiones salen de `sesion`. */
  contexto: Omit<Contexto, 'sesiones'>;
  sesion: SesionDeHoy | null;
  /** Hay sesiones en Ascent o un horario en Perfil: sin eso, no tener sesión hoy no quiere decir descansar. */
  sabeCuandoEntrena: boolean;
  /** Anoche, en minutos (y cuántos antes de lo de siempre te despertaste); sin noche, null. */
  noche: { dormido: number; necesidad: number; siesta: boolean; despertoAntes?: number | null } | null;
  /** Lo dormido las últimas tres noches, en minutos. */
  ultimas3: readonly number[];
  /** La deuda de las dos semanas, en minutos (null sin 5 noches). */
  deuda: number | null;
  /** El ejercicio de hoy que está cerca de tu marca, con todo a favor (buenDiaParaLaMarca). */
  marca: string | null;
};

export type Momento = 'antes' | 'despues' | 'descanso';
export type EstadoDelSueno = 'sinDatos' | 'bien' | 'algoCorta' | 'corta' | 'muyCorta';

export type Titular =
  | { que: 'faltaNoche' }
  | { que: 'sinHorario' }
  | { que: 'descanso' }
  | { que: 'comoSiempre' }
  | { que: 'repeticiones' }
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
/** Desde esta deuda, en minutos, las noches ya pesan. */
const DEUDA_QUE_PESA = 7 * 60;
/** Para una siesta hace falta tiempo antes de entrenar (derivado). */
const SIESTA_ANTES = 60;
const MAXIMO_DE_CONSEJOS = 3;

/** Los cortes del sueño (los de estadoDeLaNoche en rendimiento.ts, sin el despertar temprano). */
export function estadoDelSueno(noche: EntradasDelDiagnostico['noche']): EstadoDelSueno {
  if (!noche) return 'sinDatos';
  if (noche.dormido >= noche.necesidad - 60) return 'bien';
  return noche.dormido > SEIS_HORAS ? 'algoCorta' : noche.dormido > CUATRO_HORAS_Y_MEDIA ? 'corta' : 'muyCorta';
}

/** De a 5 y hacia abajo, como lo de antes de dormir: nunca dice que falta más de lo que falta. */
const deACinco = (g: number) => Math.floor(g / 5) * 5;

/** Antes de entrenar: con la noche corta, las repeticiones pueden costar más (Craven 2022); si no, como siempre. */
function titularDeAntes(x: EntradasDelDiagnostico): Titular {
  const n = x.noche!;
  return suenoCorto({ dormido: n.dormido, necesidad: n.necesidad, despertoAntes: n.despertoAntes ?? null }, x.ultimas3) ? { que: 'repeticiones' } : { que: 'comoSiempre' };
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
  else titular = sueno === 'sinDatos' ? { que: 'faltaNoche' } : titularDeAntes(x);

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

// ------------------------------------------------------------ hoy, concéntrate en

/**
 * Lo fuerte, por lo menos 2 horas antes de dormir y mejor 4: las fuentes se contradicen. Lo intenso entre 2
 * y 4 horas antes no cambió el sueño en los experimentos (Frimpong 2021); en 14.689 usuarios de WHOOP, lo
 * más intenso que termina 2 horas antes se asocia a dormirse 36 minutos más tarde, y desde 4, nada (Leota
 * 2025; dos autores cobran de WHOOP). Se avisa desde las 2 horas, y el texto dice que mejor 4.
 */
export const TERMINAR_ANTES_DE_DORMIR = 120;
export const TERMINAR_MEJOR = 240;
export const MAXIMO_DEL_FOCO = 3;
/** El snack de antes va unos 45 minutos antes de empezar (entre 30 y 60: SNACK_PREVIO); el de la noche, una hora antes de dormir. */
const SNACK_ANTES = 45;
const SNACK_DE_LA_NOCHE = 60;

/**
 * Cómo ir en el gimnasio, por factor y nunca por un puntaje: cerca de tu marca con todo a favor; sin ir al
 * fallo después de una noche corta; más liviano (u otra cosa) con lo de hoy cargado; si dijiste que no te
 * sientes recuperado, escúchalo; si no, como siempre.
 */
export type ComoEntrenar = 'marca' | 'comoSiempre' | 'sinFallo' | 'masLiviano' | 'escuchate';
export type PorQueAsi = 'sueno' | 'musculos' | 'teSientes' | null;
export type Foco =
  /** Lo que conviene comer, a la hora de esa comida: la línea de la comida, tal cual. */
  | { que: 'comer'; cuando: Paso['cuando']; linea: Linea; hora: number }
  /** Cómo ir en el gimnasio, a la hora de la sesión: por el sueño, los músculos o cómo te sientes. */
  | { que: 'entrenar'; como: ComoEntrenar; porque: PorQueAsi; hora: number; ejercicio: string | null }
  /** Lo fuerte que termina a menos de 2 horas de dormir: por lo menos a `antesDe`, y mejor a `mejor`. */
  | { que: 'terminar'; antesDe: number; mejor: number; dormir: number; hora: number }
  /** A la cama a la hora que deja dormir lo que necesitas, si la noche fue corta o hay deuda. */
  | { que: 'dormir'; hora: number }
  | { que: 'proteina'; gramos: number; hora: null }
  | { que: 'descanso'; hora: null }
  | { que: 'faltaNoche'; hora: null };

export type EntradasDelFoco = EntradasDelDiagnostico & {
  /** El titular de hoy (titularDeHoy, en recuperado.ts); sin la noche, null. */
  titular: TitularDelDia | null;
  /**
   * A qué hora ir a la cama esta noche, en minutos desde la medianoche: la del aviso de dormir (horasDeSueno, en
   * avisos.ts, con la deuda, lo de siempre y lo que tardas en dormirte). Sin saberla, la hora de dormir de siempre.
   */
  acostarse?: number | null;
};

/**
 * Cómo ir en el gimnasio antes de entrenar, con el titular de hoy: más liviano u otra cosa con lo de hoy
 * cargado; sin ir al fallo con la noche corta (Knowles 2022: 15 % menos de velocidad y más esfuerzo; para
 * la fuerza no hace falta el fallo: Grgic 2022); si dijiste que no te sientes recuperado, escúchalo; con
 * todo a favor y una marca cerca, buen día para intentarla; si no, como siempre. No depende de la comida:
 * también vale con «sin déficit».
 */
export function comoEntrenar(x: { titular: TitularDelDia; marca: string | null }): { como: ComoEntrenar; porque: PorQueAsi } {
  const t = x.titular.que;
  if (t === 'cargado') return { como: 'masLiviano', porque: 'musculos' };
  if (t === 'suenoCorto') return { como: 'sinFallo', porque: 'sueno' };
  if (t === 'teSientes') return { como: 'escuchate', porque: 'teSientes' };
  if (x.marca && t === 'listo') return { como: 'marca', porque: null };
  return { como: 'comoSiempre', porque: null };
}

/** Una hora del día para ordenar: lo de la madrugada va después de la noche. */
const paraOrdenar = (h: number) => (h < 5 * 60 ? h + 24 * 60 : h);

/**
 * «Hoy, concéntrate en»: hasta tres cosas, cada una una sola idea y con su hora si tiene, en el orden del
 * día. Primero lo que falta saber y lo que conviene comer antes de entrenar; después cómo ir en el gimnasio
 * (con «como siempre», solo si sobra lugar), terminar a tiempo, la hora de ir a la cama si la noche fue más
 * corta de lo que necesitas (o hay deuda que pesa), y lo de después. Con «sin déficit», nada, como el
 * diagnóstico.
 */
export function focoDeHoy(x: EntradasDelFoco): Foco[] {
  const d = diagnostico(x);
  if (!d) return [];
  const c = x.contexto;
  const s = x.sesion;
  const horaDe = (l: Linea) => {
    // En ayunas, lo chico va antes de entrenar aunque el desayuno de siempre sea después, y no antes de despertarse.
    if (l.clase === 'ayunasLarga') {
      const antes = Math.min(c.horaDeComida.desayuno, l.hora - SNACK_ANTES);
      return c.despertar !== null ? Math.max(c.despertar, antes) : antes;
    }
    if (l.comida !== 'snack') return c.horaDeComida[l.comida];
    if (l.clase === 'antesDeDormir') return c.dormir !== null ? c.dormir - SNACK_DE_LA_NOCHE : l.hora + 2 * 60;
    return l.hora - SNACK_ANTES;
  };
  const candidatos: [number, Foco][] = [];
  if (d.sueno === 'sinDatos' && s && !s.hecha) candidatos.push([1, { que: 'faltaNoche', hora: null }]);
  if (d.momento === 'descanso' && x.sabeCuandoEntrena) candidatos.push([1, { que: 'descanso', hora: null }]);
  for (const p of d.pasos) if (p.cuando === 'antes') candidatos.push([1, { que: 'comer', cuando: 'antes', linea: p.linea, hora: horaDe(p.linea) }]);
  if (s && !s.hecha && c.ahora < s.inicio && x.titular) {
    const { como, porque } = comoEntrenar({ titular: x.titular, marca: x.marca });
    candidatos.push([como === 'comoSiempre' ? 5 : 2, { que: 'entrenar', como, porque, hora: s.inicio, ejercicio: como === 'marca' ? x.marca : null }]);
  }
  if (s && !s.hecha && c.ahora < s.inicio + s.minutos && c.dormir !== null && s.inicio + s.minutos > c.dormir - TERMINAR_ANTES_DE_DORMIR) {
    candidatos.push([2, { que: 'terminar', antesDe: c.dormir - TERMINAR_ANTES_DE_DORMIR, mejor: c.dormir - TERMINAR_MEJOR, dormir: c.dormir, hora: s.inicio }]);
  }
  const deudaQuePesa = x.deuda !== null && x.deuda >= DEUDA_QUE_PESA;
  // Con la noche una hora o más por debajo de lo que necesitas, la hora de ir a la cama.
  const suenoFlojo = d.sueno === 'algoCorta' || d.sueno === 'corta' || d.sueno === 'muyCorta';
  if (x.noche && (suenoFlojo || deudaQuePesa)) {
    const hora = x.acostarse ?? c.dormir;
    if (hora !== null) candidatos.push([3, { que: 'dormir', hora: ((hora % 1440) + 1440) % 1440 }]);
  }
  for (const p of d.pasos) if (p.cuando !== 'antes') candidatos.push([4, { que: 'comer', cuando: p.cuando, linea: p.linea, hora: horaDe(p.linea) }]);
  for (const k of d.consejos) if (k.que === 'totalDelDia') candidatos.push([4, { que: 'proteina', gramos: k.gramos, hora: null }]);
  return candidatos
    .map((x2, i) => ({ x: x2, i }))
    .sort((a, b) => a.x[0] - b.x[0] || a.i - b.i)
    .slice(0, MAXIMO_DEL_FOCO)
    .map((a) => a.x[1])
    .sort((a, b) => (a.hora === null ? -1 : paraOrdenar(a.hora)) - (b.hora === null ? -1 : paraOrdenar(b.hora)));
}

// ------------------------------------------------------------ marcas

/** Lo que acompaña un buen día (condicionesDeLaMarca), en el orden en que se dice. */
export const CONDICIONES: readonly (keyof CondicionesDeLaMarca)[] = ['sueno', 'musculos', 'semana'];

/** Lo que no se da, en ese orden: el porqué de un «hoy no». */
export const queFalla = (c: CondicionesDeLaMarca) => CONDICIONES.filter((k) => !c[k]);

/** Buen día para intentar marca: cerca, con todo a favor. */
export const buenDiaParaLaMarca = (m: { cerca: CercaDeLaMarca; condiciones: CondicionesDeLaMarca }) => m.cerca.cerca && queFalla(m.condiciones).length === 0;

/**
 * Los ejercicios de hoy para «Marcas»: los de buen día primero, después los que están cerca y al final el
 * resto, del más cerca al más lejos (los que no se sabe, al final).
 */
export function ordenarMarcas<T extends { cerca: CercaDeLaMarca; condiciones: CondicionesDeLaMarca }>(lista: readonly T[]): T[] {
  const lejos = (x: T) => x.cerca.distancia ?? Infinity;
  return [...lista].sort((a, b) => Number(buenDiaParaLaMarca(b)) - Number(buenDiaParaLaMarca(a)) || Number(b.cerca.cerca) - Number(a.cerca.cerca) || lejos(a) - lejos(b));
}
