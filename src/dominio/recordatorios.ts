// Los recordatorios para anotar (spec/plan.md, etapa 12: suaves y opcionales, a la hora de
// siempre). Cada comida elegida avisa un rato después de su hora habitual, y solo si ese día todavía
// no se anotó. Se programan los de la semana cada vez que se abre Moss o se anota algo: si no se
// abre en una semana, paran solos.

import { HORA_TIPICA, type Comida } from './comidas';
import { minutosEnElDia, sumarDias, type ClaveDia } from './fechas';
import type { Registro } from './registros';

/** Cuánto después de la hora habitual: da tiempo a comer antes del aviso. */
export const DESPUES_MIN = 45;
export const DIAS = 7;

/** Lo de la madrugada, hasta las 5, en una comida de la noche es de la noche anterior: una cena a las 0:20 es tarde, no temprano. */
const MADRUGADA = 5 * 60;
const DIA = 24 * 60;

/**
 * La hora habitual de una comida, en minutos desde la medianoche: la mediana de cuándo se anotó en
 * los días que se dan; sin datos, la típica. Con `deNoche` (la cena, la merienda), lo de la
 * madrugada cuenta como más tarde, y si la mediana pasa de la medianoche queda en las 23:59.
 */
export function horaHabitual(minutosAnotados: number[], tipica: number, deNoche = false): number {
  if (!minutosAnotados.length) return tipica;
  const orden = minutosAnotados.map((m) => (deNoche && m < MADRUGADA ? m + DIA : m)).sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  const mediana = orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
  return Math.min(DIA - 1, mediana);
}

/** Cuántos días se miran para la hora de siempre. */
const DIAS_DE_SIEMPRE = 21;

/**
 * La hora de siempre de cada comida: la mediana de cuándo se anotó en las últimas tres semanas (sin
 * hoy ni lo planificado), en la cuenta de su día (D32: la cena de las 0:30 es tarde); sin datos, la
 * típica, y el snack, las 16. La usan los avisos, la línea de Comida y lo que corre al comer.
 */
export function horasDeSiempre(registros: Iterable<Registro>, hoy: ClaveDia): (c: Comida) => number {
  const desde = sumarDias(hoy, -DIAS_DE_SIEMPRE);
  const anotadas = new Map<Comida, number[]>();
  for (const r of registros) {
    if (r.borrado || r.planificado || r.dia < desde || r.dia >= hoy) continue;
    const minutos = minutosEnElDia(new Date(r.momento), r.dia);
    const lista = anotadas.get(r.comida);
    if (lista) lista.push(minutos);
    else anotadas.set(r.comida, [minutos]);
  }
  return (c) => horaHabitual(anotadas.get(c) ?? [], c === 'snack' ? 16 * 60 : HORA_TIPICA[c], c === 'cena' || c === 'merienda');
}

type ConHora = Exclude<Comida, 'snack'>;

/** Con al menos estos días con esa comida anotada en las últimas dos semanas, su hora se acomoda a lo anotado. */
export const DIAS_PARA_ACOMODARSE = 5;
const DIAS_QUE_SE_MIRAN = 14;

/** De dónde sale la hora de una comida: la que pusiste a mano, la de lo que anotas, la de tu día o la típica. */
export type DeDondeSale = 'aMano' | 'anotado' | 'cuestionario' | 'tipica';

export type HorasDeComer = {
  registros: Iterable<Registro>;
  hoy: ClaveDia;
  /** Las que cambiaste a mano (Perfil › Tus respuestas): quedan fijas. */
  aMano?: Partial<Record<ConHora, number>> | null;
  /** Las de tu día, en el cuestionario; null es «No suelo». */
  cuestionario?: Partial<Record<ConHora, number | null>> | null;
};

/**
 * Tus horas de comer, una sola lista para todo (lo pediste el 18/11/2026): los avisos, lo que conviene, qué comer
 * antes y después de entrenar, el plan, lo que se anota y la línea de Comida. Cada comida, la que cambiaste a mano,
 * fija; si no, la mediana de lo anotado, con al menos DIAS_PARA_ACOMODARSE días con esa comida en las últimas dos
 * semanas (sin hoy, así no cambia en el día), al cuarto de hora; si no, la de tu día en el cuestionario; si no, la
 * típica. El snack, como siempre (horasDeSiempre).
 */
export function horasDeComer(o: HorasDeComer): (c: Comida) => { minutos: number; de: DeDondeSale } {
  const desde = sumarDias(o.hoy, -DIAS_QUE_SE_MIRAN);
  const registros = [...o.registros];
  // De cada día, cuándo se anotó esa comida por primera vez: un almuerzo de cinco cosas cuenta una vez.
  const porDia = new Map<ConHora, Map<ClaveDia, number>>();
  for (const r of registros) {
    if (r.borrado || r.planificado || r.comida === 'snack' || r.dia < desde || r.dia >= o.hoy) continue;
    const minutos = minutosEnElDia(new Date(r.momento), r.dia);
    const dias = porDia.get(r.comida) ?? new Map<ClaveDia, number>();
    dias.set(r.dia, Math.min(dias.get(r.dia) ?? Infinity, minutos));
    porDia.set(r.comida, dias);
  }
  const snack = horasDeSiempre(registros, o.hoy);
  return (c) => {
    if (c === 'snack') return { minutos: snack('snack'), de: 'tipica' };
    const aMano = o.aMano?.[c];
    if (aMano !== undefined) return { minutos: aMano, de: 'aMano' };
    const dias = [...(porDia.get(c)?.values() ?? [])];
    // Al cuarto de hora, como se cambian a mano, y no más tarde de las 23:45.
    if (dias.length >= DIAS_PARA_ACOMODARSE) return { minutos: Math.min(23 * 60 + 45, Math.round(horaHabitual(dias, HORA_TIPICA[c], c === 'cena' || c === 'merienda') / 15) * 15), de: 'anotado' };
    const dicha = o.cuestionario?.[c];
    if (dicha != null) return { minutos: dicha, de: 'cuestionario' };
    return { minutos: HORA_TIPICA[c], de: 'tipica' };
  };
}

/**
 * Lo que cambiaste en tu día (Perfil › Tus respuestas, que muestra tus horas de ahora): cada hora que moviste queda
 * fija, a mano; las que no tocaste siguen su regla, y la que pasaste a «No suelo» deja de estar a mano.
 */
export function horasPuestasAMano(o: {
  mostradas: Record<ConHora, number>;
  elegidas: Record<ConHora, number>;
  noSuele: Partial<Record<ConHora, boolean>>;
  antes?: Partial<Record<ConHora, number>> | null;
}): Partial<Record<ConHora, number>> {
  const aMano: Partial<Record<ConHora, number>> = { ...o.antes };
  for (const c of Object.keys(o.mostradas) as ConHora[]) {
    if (o.noSuele[c]) delete aMano[c];
    else if (o.elegidas[c] !== o.mostradas[c]) aMano[c] = o.elegidas[c];
  }
  return aMano;
}

/** «No suelo», en tu día: esa comida no avisa. */
export const noSueleComer = (cuestionario: HorasDeComer['cuestionario'], c: Comida): boolean => c !== 'snack' && cuestionario?.[c] === null;

export type Recordatorio = { dia: ClaveDia; comida: Comida; minutos: number };

/** Los avisos de hoy y los próximos días, sin los que ya pasaron ni los de lo que hoy ya se anotó. */
export function recordatoriosDeLaSemana(op: {
  hoy: ClaveDia;
  /** Los minutos de ahora, desde la medianoche. */
  ahora: number;
  comidas: readonly Comida[];
  hora: (c: Comida) => number;
  anotadasHoy: ReadonlySet<Comida>;
}): Recordatorio[] {
  const lista: Recordatorio[] = [];
  for (let d = 0; d < DIAS; d++) {
    const dia = sumarDias(op.hoy, d);
    for (const comida of op.comidas) {
      const minutos = Math.min(23 * 60 + 30, op.hora(comida) + DESPUES_MIN);
      if (d === 0 && (minutos <= op.ahora || op.anotadasHoy.has(comida))) continue;
      lista.push({ dia, comida, minutos });
    }
  }
  return lista;
}
