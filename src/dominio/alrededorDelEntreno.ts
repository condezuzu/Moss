// Qué comer antes y después de entrenar (lo pediste el 26/10), con lo que comes y cómo dormís: una
// línea en la comida que toca, nunca un aviso. Las reglas, los números y sus fuentes están en
// spec/entreno.md (ACSM/AND/DC 2016; Kerksick 2017; Jäger 2017; Morton 2018; Schoenfeld y Aragon
// 2013 y 2018; Gardiner 2023). Sin culpa: nada de compensar, quemar ni ganarse la comida, y con
// «sin déficit» no aparece nada.

import type { Comida } from './comidas';
import { diaDeLaSemana, type ClaveDia, type DiaSemana } from './fechas';
import type { Macros } from './metas';

/** Lo suave (yoga, estirar, caminar un rato) no cambia lo que se come. */
export type TipoDeSesion = 'fuerza' | 'resistencia' | 'mixta' | 'suave';

/** Una sesión del día, en minutos desde la medianoche. */
export type Sesion = { inicio: number; minutos: number; tipo: TipoDeSesion; seriesPorMusculo?: number };

export type Principal = Exclude<Comida, 'snack'>;

/** Cuándo entrenás, puesto a mano en Perfil: qué días, a qué hora, cuánto dura y de qué tipo. */
export type Entreno = { dias: DiaSemana[]; hora: number; minutos: number; tipo: Exclude<TipoDeSesion, 'suave'> };

/** Las sesiones de un día: la del horario, si ese día se entrena. */
export function sesionesDelDia(entreno: Entreno | null, dia: ClaveDia): Sesion[] {
  if (!entreno || !entreno.dias.includes(diaDeLaSemana(dia))) return [];
  return [{ inicio: entreno.hora, minutos: entreno.minutos, tipo: entreno.tipo }];
}

export type Contexto = {
  /** Ahora, en minutos desde la medianoche. */
  ahora: number;
  sesiones: readonly Sesion[];
  /** La hora de cada comida: la del horario, la de siempre o la típica. */
  horaDeComida: Record<Principal, number>;
  /** Lo anotado hoy de cada comida: cuándo (la primera vez) y lo que suma. */
  anotado: Partial<Record<Comida, { hora: number; proteina: number; kcal: number }>>;
  /** La meta del día y lo comido hasta ahora. */
  meta: Macros;
  comido: Macros;
  /** Las comidas que se suelen anotar: con merienda, cuatro. */
  comidasHabituales: 3 | 4;
  pesoKg: number | null;
  edad: number;
  /** A qué hora se despierta y se duerme (lo de siempre), en minutos desde la medianoche; la noche puede pasar de 1440. */
  despertar: number | null;
  dormir: number | null;
  /** Cuánta cafeína se toma de una vez, en mg, si se anotó seguido; si no, null. */
  cafeinaPorToma: number | null;
  /** Con «sin déficit» (un cuidado de salud), nada de esto aparece. */
  sinDeficit: boolean;
};

export type Clase = 'previa' | 'previaLiviana' | 'snackPrevio' | 'ayunasLarga' | 'despues' | 'despuesPronto' | 'reponer' | 'antesDeDormir';

/** Lo que se dice en una comida, en gramos de a 5; sin peso, a veces sin número. */
export type Linea = {
  comida: Comida;
  clase: Clase;
  /** La hora de la sesión de la que habla, en minutos. */
  hora: number;
  proteina?: number;
  carbohidratos?: number;
  /** Para lo de más de 90 minutos: cuánto llevar por hora. */
  durantePorHora?: [number, number];
  /** El café, antes de esta hora: después le quita al sueño. */
  cafeinaHasta?: number;
};

export const COMIDA_PREVIA: [number, number] = [120, 240];
export const PREVIA_LIVIANA: [number, number] = [60, 120];
export const SNACK_PREVIO: [number, number] = [30, 60];
/** La primera comida hasta 4 h después del final es la de después. */
export const POSTERIOR_HASTA = 240;
/** Más que esto entre la comida de antes y la de después, la proteína conviene pronto (6 h si la de antes fue grande). */
export const ENTRE_PREVIA_Y_POSTERIOR = 240;
const PREVIA_GRANDE = { proteina: 30, kcal: 600 };
/** Dos sesiones largas a menos de 8 h: hay que reponer carbohidratos. */
export const DOBLE_SESION = 480;
/** Lo que tiene que faltar de proteína para decirlo antes de dormir. */
export const FALTA_PARA_DORMIR = 25;
/** Lo que se lleva por hora en lo de más de 90 minutos. */
export const DURANTE: [number, number] = [30, 60];
/** El café, tantas horas antes de dormir: 8 hasta 200 mg, 12 con más (Gardiner 2023 y 2025). */
const CORTE_DE_CAFEINA = { hasta200: 8 * 60, masDe200: 12 * 60 };
/** Como mucho tres líneas por día, y una por comida. */
const MAXIMO_POR_DIA = 3;

const PRINCIPALES: readonly Principal[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
/** Si dos caen en la misma comida, queda la que más importa. */
const PRIORIDAD: readonly Clase[] = ['reponer', 'despuesPronto', 'despues', 'previa', 'previaLiviana', 'snackPrevio', 'ayunasLarga', 'antesDeDormir'];

const aCinco = (x: number) => Math.round(x / 5) * 5;
const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** Lo que cuenta como entrenar: lo suave o de menos de 20 minutos, no. */
export const cuenta = (s: Sesion) => s.tipo !== 'suave' && s.minutos >= 20;
/** Larga: fuerza de más de 45 minutos (o 10 series por músculo), o resistencia o mixta de una hora o más. */
export const larga = (s: Sesion) =>
  s.tipo === 'fuerza' ? s.minutos > 45 || (s.seriesPorMusculo ?? 0) >= 10 : s.tipo === 'resistencia' || s.tipo === 'mixta' ? s.minutos >= 60 : false;
export const muyLarga = (s: Sesion) => (s.tipo === 'resistencia' || s.tipo === 'mixta') && s.minutos >= 90;

/**
 * La proteína de una comida: 0,3 g/kg (0,4 desde los 65), de 20 a 40 g, o su parte de la meta si es
 * más; sin peso, 25 g (30 después de entrenar o en ayunas, 35 desde los 65). Cerca de entrenar, solo
 * la regla: mucha proteína justo antes cae pesada. Nunca más de lo que queda del día.
 */
export function proteinaDeComida(c: Contexto, momento: 'normal' | 'liviana' | 'despues' | 'ayunas'): number {
  const mayor = c.edad >= 65;
  const regla = c.pesoKg !== null ? limitar(c.pesoKg * (mayor ? 0.4 : 0.3), 20, 40) : mayor ? 35 : momento === 'normal' || momento === 'liviana' ? 25 : 30;
  const parte = momento === 'liviana' ? 0 : c.meta.proteina / c.comidasHabituales;
  const minimo = momento === 'ayunas' ? 25 : 0;
  const queda = Math.max(0, c.meta.proteina - c.comido.proteina);
  return aCinco(Math.min(queda, Math.max(regla, parte, minimo)));
}

/**
 * Los carbohidratos de la comida de antes: solo con peso y sesión larga. Alrededor de 1 g/kg; con
 * resistencia de 90 minutos o más, 1 g/kg por cada hora de anticipación (de 1 a 4). La mitad de lo
 * que queda del día se guarda para después.
 */
export function carbohidratosPrevios(c: Contexto, s: Sesion, minutosAntes: number): number | null {
  if (c.pesoKg === null || !larga(s)) return null;
  const porKg = muyLarga(s) ? limitar(minutosAntes / 60, 1, 4) : 1;
  const queda = Math.max(0, c.meta.carbohidratos - c.comido.carbohidratos);
  return aCinco(Math.min(porKg * c.pesoKg, 0.5 * queda));
}

/** El snack de antes: 30 g de carbohidratos fáciles; con peso, 0,5 g/kg, de 20 a 40. */
const carbohidratosDelSnack = (c: Contexto) => aCinco(c.pesoKg !== null ? limitar(0.5 * c.pesoKg, 20, 40) : 30);

const sinAnotar = (c: Contexto, comida: Comida) => !c.anotado[comida];

/** Las líneas de antes de una sesión: en la comida que cae 30 minutos a 4 horas antes, o el snack si no hay ninguna. */
function antes(c: Contexto, s: Sesion): Linea[] {
  const base = { hora: s.inicio };
  // En ayunas a la mañana: entrena antes de las 2 horas de despertarse y no comió nada desde entonces.
  const despertar = c.despertar;
  const comioDesdeQueDesperto = despertar !== null && Object.values(c.anotado).some((a) => a && a.hora >= despertar && a.hora <= s.inicio);
  if (despertar !== null && s.inicio < despertar + 120 && !comioDesdeQueDesperto) {
    return larga(s) && sinAnotar(c, 'desayuno') ? [{ ...base, comida: 'desayuno', clase: 'ayunasLarga', carbohidratos: carbohidratosDelSnack(c) }] : [];
  }
  const candidatas = PRINCIPALES.map((comida) => ({ comida, delta: s.inicio - c.horaDeComida[comida] })).filter((x) => x.delta >= SNACK_PREVIO[0] && x.delta <= COMIDA_PREVIA[1]);
  const previa = candidatas.sort((a, b) => a.delta - b.delta)[0];
  if (!previa) {
    // Sin comida en las 4 horas de antes: si la sesión es larga, algo chico antes.
    if (!larga(s)) return [];
    const proxima = PRINCIPALES.filter((comida) => c.horaDeComida[comida] < s.inicio && sinAnotar(c, comida)).sort((a, b) => c.horaDeComida[b] - c.horaDeComida[a])[0];
    return [{ ...base, comida: proxima ?? 'snack', clase: 'snackPrevio', carbohidratos: carbohidratosDelSnack(c) }];
  }
  if (!sinAnotar(c, previa.comida)) return [];
  const carbohidratos = carbohidratosPrevios(c, s, previa.delta);
  const linea: Linea =
    previa.delta >= COMIDA_PREVIA[0] ? { ...base, comida: previa.comida, clase: 'previa', proteina: proteinaDeComida(c, 'normal'), ...(carbohidratos !== null ? { carbohidratos } : {}) }
      : previa.delta >= PREVIA_LIVIANA[0] ? { ...base, comida: previa.comida, clase: 'previaLiviana', proteina: proteinaDeComida(c, 'liviana'), ...(carbohidratos !== null ? { carbohidratos } : {}) }
        : { ...base, comida: previa.comida, clase: 'snackPrevio', carbohidratos: carbohidratosDelSnack(c) };
  if (muyLarga(s)) linea.durantePorHora = DURANTE;
  // El café de antes de entrenar, si se toma seguido y cae tarde para el sueño.
  if (c.cafeinaPorToma !== null && c.dormir !== null) {
    const corte = c.dormir - (c.cafeinaPorToma > 200 ? CORTE_DE_CAFEINA.masDe200 : CORTE_DE_CAFEINA.hasta200);
    if (s.inicio - 60 > corte) linea.cafeinaHasta = corte;
  }
  return [linea];
}

/** La línea de después: en la primera comida hasta 4 horas después del final. */
function despues(c: Contexto, s: Sesion, todas: readonly Sesion[]): Linea[] {
  const fin = s.inicio + s.minutos;
  const posterior = PRINCIPALES.filter((comida) => c.horaDeComida[comida] >= fin - 15 && c.horaDeComida[comida] <= fin + POSTERIOR_HASTA)
    .sort((a, b) => c.horaDeComida[a] - c.horaDeComida[b])[0];
  if (!posterior || !sinAnotar(c, posterior)) return [];
  const base = { hora: s.inicio, comida: posterior };
  // Otra sesión larga a menos de 8 horas: reponer carbohidratos ahora y en la comida siguiente.
  const otra = todas.find((x) => x !== s && x.inicio > fin && x.inicio - fin < DOBLE_SESION && larga(x) && larga(s));
  if (otra) {
    const carbohidratos = c.pesoKg !== null ? aCinco(c.pesoKg) : undefined;
    const siguiente = PRINCIPALES.filter((comida) => c.horaDeComida[comida] > c.horaDeComida[posterior] && c.horaDeComida[comida] < otra.inicio && sinAnotar(c, comida))[0];
    const reponer = (comida: Comida): Linea => ({ hora: otra.inicio, comida, clase: 'reponer', proteina: proteinaDeComida(c, 'despues'), ...(carbohidratos ? { carbohidratos } : {}) });
    return [reponer(posterior), ...(siguiente ? [reponer(siguiente)] : [])];
  }
  // La comida de antes: la última anotada (o por anotar) antes de empezar.
  const anteriores = PRINCIPALES.map((comida) => ({ comida, hora: c.anotado[comida]?.hora ?? c.horaDeComida[comida] })).filter((x) => x.hora <= s.inicio);
  const anterior = anteriores.sort((a, b) => b.hora - a.hora)[0];
  const deAntes = anterior ? c.anotado[anterior.comida] : undefined;
  const grande = !!deAntes && (deAntes.proteina >= PREVIA_GRANDE.proteina || deAntes.kcal >= PREVIA_GRANDE.kcal);
  const enAyunas = c.despertar !== null && s.inicio < c.despertar + 120 && (!anterior || anterior.hora < c.despertar);
  const hueco = anterior ? c.horaDeComida[posterior] - anterior.hora : Infinity;
  if (enAyunas || hueco > (grande ? 360 : ENTRE_PREVIA_Y_POSTERIOR)) return [{ ...base, clase: 'despuesPronto', proteina: proteinaDeComida(c, 'ayunas') }];
  return [{ ...base, clase: 'despues', proteina: proteinaDeComida(c, 'despues') }];
}

/** Con sesión, si después de la cena falta proteína: algo antes de dormir también cuenta. */
function antesDeDormir(c: Contexto): Linea[] {
  if (!c.anotado.cena || c.anotado.snack && c.anotado.snack.hora > c.anotado.cena.hora) return [];
  const falta = c.meta.proteina - c.comido.proteina;
  if (falta < FALTA_PARA_DORMIR) return [];
  return [{ comida: 'snack', clase: 'antesDeDormir', hora: c.anotado.cena.hora, proteina: aCinco(limitar(falta, 30, 40)) }];
}

/**
 * Las líneas de hoy, una por comida y tres como mucho, en las comidas que todavía no se anotaron:
 * las de antes, hasta que empieza la sesión; las de después, desde que termina (un cuarto de hora
 * antes) hasta 4 horas después. Sin sesiones que cuenten, o con «sin déficit», ninguna.
 */
export function lineasDelDia(c: Contexto): Linea[] {
  if (c.sinDeficit) return [];
  const sesiones = c.sesiones.filter(cuenta).sort((a, b) => a.inicio - b.inicio);
  if (!sesiones.length) return [];
  const todas: Linea[] = [];
  for (const s of sesiones) {
    if (c.ahora < s.inicio) todas.push(...antes(c, s));
    const fin = s.inicio + s.minutos;
    if (c.ahora >= fin - 15 && c.ahora <= fin + POSTERIOR_HASTA) todas.push(...despues(c, s, sesiones));
  }
  todas.push(...antesDeDormir(c));
  const porComida = new Map<Comida, Linea>();
  for (const l of todas.sort((a, b) => PRIORIDAD.indexOf(a.clase) - PRIORIDAD.indexOf(b.clase))) {
    if (!porComida.has(l.comida)) porComida.set(l.comida, l);
  }
  const orden = (l: Linea) => (l.comida === 'snack' ? l.hora : c.horaDeComida[l.comida]);
  return [...porComida.values()].sort((a, b) => PRIORIDAD.indexOf(a.clase) - PRIORIDAD.indexOf(b.clase)).slice(0, MAXIMO_POR_DIA).sort((a, b) => orden(a) - orden(b));
}
