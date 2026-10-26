// El progreso hacia el objetivo (spec/progreso.md): a qué ritmo va la tendencia del peso, si va en
// camino y en qué fecha llegaría, y el balance entre lo comido y lo gastado. Todo se mide sobre la
// tendencia, nunca sobre el peso de un día.

import { cambioPorDia, type ComidaDelDia, type Pesada } from './control';
import { diasEntre, sumarDias, type ClaveDia } from './fechas';
import { RITMOS, type Objetivo, type Ritmo } from './metas';

/** El ritmo se mide en las últimas tres semanas de tendencia, y hacen falta al menos dos. */
const DIAS_DEL_RITMO = 21;
const DIAS_MINIMOS = 14;
/** A medio kilo de la meta ya llegaste: la tendencia se mueve más que eso en una semana común. */
const LLEGASTE_KG = 0.5;
/** Con menos de la mitad del ritmo del plan, vas despacio; casi sin moverte, estás quieto. */
const DESPACIO = 0.5;
const QUIETO_KG_SEMANA = 0.05;
/** Manteniendo, moverse menos de esto por semana es estar estable. */
const ESTABLE_KG_SEMANA = 0.15;
/** Más allá de dos años no se da fecha: a ese ritmo no es una fecha. */
const HORIZONTE_DIAS = 730;

/**
 * Los kilos por semana de las últimas tres semanas (o desde que hay, si son dos o más). Con las
 * pesadas, sin el atraso de la tendencia en sus primeras semanas (cambioPorDia).
 */
export function ritmoSemanal(tendencia: Map<ClaveDia, number>, hasta: ClaveDia, pesadas?: Pesada[]): number | null {
  const fin = tendencia.get(hasta);
  const primero = [...tendencia.keys()][0];
  if (fin === undefined || primero === undefined) return null;
  const dias = Math.min(DIAS_DEL_RITMO, diasEntre(primero, hasta));
  if (dias < DIAS_MINIMOS) return null;
  const desde = sumarDias(hasta, -dias);
  const porDia = pesadas ? cambioPorDia(pesadas, desde, hasta) : null;
  return (porDia ?? (fin - tendencia.get(desde)!) / dias) * 7;
}

/** «otroLado»: el peso meta quedó del otro lado de donde se empezó (por ejemplo, al pasar de bajar a subir). */
export type EstadoDelObjetivo = 'llegaste' | 'enCamino' | 'despacio' | 'quieto' | 'alReves' | 'estable' | 'seMueve' | 'sinMeta' | 'otroLado' | 'faltanDatos';

export type Progreso = {
  estado: EstadoDelObjetivo;
  /** El peso de la tendencia hoy. */
  peso: number | null;
  /** Medido y el del plan, en kilos por semana (negativo es bajar). */
  ritmo: number | null;
  ritmoPlan: number;
  /** Los kilos que faltan, siempre positivos. */
  faltan: number | null;
  /** Cuándo llegaría al ritmo medido. */
  fecha: ClaveDia | null;
  /** Cuánto del camino ya se hizo, de 0 a 1, desde el peso con que se empezó. */
  hecho: number | null;
};

export type EntradaDelProgreso = {
  hoy: ClaveDia;
  tendencia: Map<ClaveDia, number>;
  /** Las pesadas de la tendencia, para medir el ritmo sin su atraso al principio. */
  pesadas?: Pesada[];
  objetivo: Objetivo;
  ritmo: Ritmo;
  pesoMeta?: number | null;
  /** El peso de la tendencia cuando se fijó el objetivo, para «cuánto del camino». */
  pesoInicial?: number | null;
};

export function progresoAlObjetivo(e: EntradaDelProgreso): Progreso {
  const peso = e.tendencia.get(e.hoy) ?? null;
  const ritmo = ritmoSemanal(e.tendencia, e.hoy, e.pesadas);
  const ritmoPlan = e.objetivo === 'mantener' || peso === null ? 0 : (RITMOS[e.objetivo][e.ritmo] / 100) * peso;
  const base = { peso, ritmo, ritmoPlan, faltan: null, fecha: null, hecho: null };
  if (peso === null) return { ...base, estado: 'faltanDatos' };
  if (e.objetivo === 'mantener') {
    if (ritmo === null) return { ...base, estado: 'faltanDatos' };
    return { ...base, estado: Math.abs(ritmo) <= ESTABLE_KG_SEMANA ? 'estable' : 'seMueve' };
  }
  if (!e.pesoMeta) return { ...base, estado: ritmo === null ? 'faltanDatos' : 'sinMeta' };

  const direccion = e.objetivo === 'bajar' ? -1 : 1;
  const faltan = Math.max(0, (e.pesoMeta - peso) * direccion);
  const camino = e.pesoInicial ? (e.pesoMeta - e.pesoInicial) * direccion : 0;
  const hecho = camino > 0 ? Math.min(1, Math.max(0, 1 - faltan / camino)) : null;
  if (faltan <= LLEGASTE_KG) {
    // Si la meta ya estaba pasada al empezar, no se llegó: está del otro lado.
    if (e.pesoInicial && camino <= 0) return { ...base, estado: 'otroLado' };
    return { ...base, faltan, hecho: hecho === null ? null : 1, estado: 'llegaste' };
  }
  if (ritmo === null) return { ...base, faltan, hecho, estado: 'faltanDatos' };

  const avance = ritmo * direccion;
  const dias = avance > QUIETO_KG_SEMANA ? Math.ceil((faltan / avance) * 7) : null;
  const fecha = dias !== null && dias <= HORIZONTE_DIAS ? sumarDias(e.hoy, dias) : null;
  const estado: EstadoDelObjetivo = avance < -QUIETO_KG_SEMANA ? 'alReves'
    : avance <= QUIETO_KG_SEMANA ? 'quieto'
    : avance < DESPACIO * Math.abs(ritmoPlan) ? 'despacio'
    : 'enCamino';
  return { ...base, faltan, hecho, fecha, estado };
}

export type Balance = {
  /** Cada día con comida registrada en el tramo: lo comido menos el gasto (negativo es déficit). */
  dias: { fecha: ClaveDia; kcal: number; balance: number }[];
  promedio: number | null;
};

/** El balance de los últimos días contra el gasto estimado. Los días sin registrar no cuentan: no son ceros. */
export function balance(comidas: ComidaDelDia[], gasto: number, hasta: ClaveDia, dias = 7): Balance {
  const desde = sumarDias(hasta, -(dias - 1));
  const lista = comidas
    .filter((c) => c.kcal > 0 && c.fecha >= desde && c.fecha <= hasta)
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))
    .map((c) => ({ fecha: c.fecha, kcal: c.kcal, balance: c.kcal - gasto }));
  const promedio = lista.length ? lista.reduce((s, d) => s + d.balance, 0) / lista.length : null;
  return { dias: lista, promedio };
}
