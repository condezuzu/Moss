// El progreso hacia el objetivo (spec/progreso.md): a qué ritmo va el peso, con su margen, si va en
// camino y entre qué fechas llegaría, y el balance entre lo comido y lo gastado. Nunca sobre el peso de
// un día: el ritmo sale de la recta por el promedio de cada semana, y mientras el margen sea ancho,
// todavía no se sabe (spec/estudio/progreso.md, A4 a A6).

import { atrasoDeLaTendencia, cambioPorDia, pesadasQueCuentan, recta, type ComidaDelDia, type EstadoDelControl, type Pesada } from './control';
import { diasEntre, sumarDias, type ClaveDia } from './fechas';
import { DEFICIT_MAXIMO, KCAL_POR_KG, KG_POR_SEMANA_MAXIMOS, MAYORIA_DE_EDAD, pisoDe, RITMOS, type Objetivo, type Ritmo, type Sexo } from './metas';

/** Sin las pesadas, el ritmo se mide en las últimas tres semanas de tendencia, y hacen falta al menos dos. */
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
 * Los kilos por semana de las últimas tres semanas (o desde que hay, si son dos o más): con las pesadas,
 * la recta por ellas (cambioPorDia); sin ellas, lo que se movió la tendencia, que atrasa.
 */
export function ritmoSemanal(tendencia: Map<ClaveDia, number>, hasta: ClaveDia, pesadas?: readonly Pesada[]): number | null {
  const fin = tendencia.get(hasta);
  const primero = [...tendencia.keys()][0];
  if (fin === undefined || primero === undefined) return null;
  const dias = Math.min(DIAS_DEL_RITMO, diasEntre(primero, hasta));
  if (dias < DIAS_MINIMOS) return null;
  const desde = sumarDias(hasta, -dias);
  const porDia = pesadas ? cambioPorDia(pesadas, desde, hasta) : null;
  return (porDia ?? (fin - tendencia.get(desde)!) / dias) * 7;
}

// ------------------------------------------------------------ el ritmo con su margen
// De cada bloque de siete días que termina hoy, el promedio de sus pesadas (como cuentan, sin rellenar),
// en el día promedio de esas pesadas; y la recta por esos promedios. El margen es el de un 80 %, con la t
// de Student: con el ruido del peso, cubrió el ritmo de verdad 79 a 85 veces de cada 100 a las cuatro y
// seis semanas (Hall y Chow, 2011; la simulación del estudio). Con menos de tres semanas con pesadas, no hay.

export const SEMANAS_DEL_RITMO = 6;
const SEMANAS_MINIMAS = 3;
/** La t de Student del 80 % (de dos colas), por los grados de libertad: las semanas menos dos. */
const T80: Record<number, number> = { 1: 3.078, 2: 1.886, 3: 1.638, 4: 1.533, 5: 1.476, 6: 1.44 };
/** Con pocas semanas, el ruido medido puede salir casi cero: nunca menos de 0,2 kg. */
const DESVIO_MINIMO = 0.2;
/** Con medio margen más ancho que esto (o que el plan), todavía no se sabe. */
const MARGEN_PARA_SABER = 0.25;

export type RitmoConRango = {
  /** En kilos por semana, con su signo (negativo es bajar), de `desde` a `hasta`. */
  kgPorSemana: number;
  desde: number;
  hasta: number;
  /** El peso de hoy en la recta: sin el atraso de la tendencia. */
  nivelHoy: number;
  semanas: number;
};

export function ritmoConRango(pesadas: readonly Pesada[], hoy: ClaveDia, semanas = SEMANAS_DEL_RITMO): RitmoConRango | null {
  const cuentan = pesadasQueCuentan(pesadas.filter((p) => p.fecha <= hoy));
  const atras = cuentan.map((p) => diasEntre(p.fecha, hoy));
  const puntos: [number, number][] = [];
  for (let s = 0; s < semanas; s++) {
    let dias = 0;
    let kg = 0;
    let n = 0;
    cuentan.forEach((p, i) => {
      if (Math.floor(atras[i] / 7) !== s) return;
      dias += atras[i];
      kg += p.kg;
      n++;
    });
    if (n) puntos.push([-dias / n, kg / n]);
  }
  const r = puntos.length >= SEMANAS_MINIMAS ? recta(puntos) : null;
  if (!r) return null;
  const libres = puntos.length - 2;
  const desvio = Math.max(DESVIO_MINIMO, Math.sqrt(r.residuos / libres));
  const medio = ((T80[libres] ?? T80[6]) * desvio * 7) / Math.sqrt(r.sxx);
  const kgPorSemana = r.pendiente * 7;
  return { kgPorSemana, desde: kgPorSemana - medio, hasta: kgPorSemana + medio, nivelHoy: r.y - r.pendiente * r.x, semanas: puntos.length };
}

/**
 * El peso de hoy sin el atraso de la tendencia: el de la recta de las semanas o, con menos de tres, la
 * tendencia más lo que atrasa con la pendiente de las pesadas.
 */
export function nivelDeHoy(tendencia: Map<ClaveDia, number>, hoy: ClaveDia, pesadas?: readonly Pesada[], conRango?: RitmoConRango | null): number | null {
  if (conRango) return conRango.nivelHoy;
  const t = tendencia.get(hoy);
  if (t === undefined || !pesadas) return t ?? null;
  const pendiente = cambioPorDia(pesadas, sumarDias(hoy, -(DIAS_DEL_RITMO - 1)), hoy);
  const fechas = pesadas.filter((p) => p.fecha <= hoy).map((p) => p.fecha).sort();
  if (pendiente === null || !fechas.length) return t;
  return t + pendiente * atrasoDeLaTendencia(diasEntre(fechas[0], fechas[fechas.length - 1]));
}

export type Fechas = { temprana: ClaveDia; tardia: ClaveDia };

/**
 * Cuándo llegaría, como un rango: con el avance más rápido del margen y con el más lento, en kilos por
 * semana hacia la meta. Sin fecha si el más lento casi no avanza, o si pasa de dos años.
 */
export function fechasDeLlegada(hoy: ClaveDia, faltan: number, lento: number, rapido: number): Fechas | null {
  if (!(lento > QUIETO_KG_SEMANA)) return null;
  const tardia = Math.ceil((faltan / lento) * 7);
  if (tardia > HORIZONTE_DIAS) return null;
  return { temprana: sumarDias(hoy, Math.ceil((faltan / rapido) * 7)), tardia: sumarDias(hoy, tardia) };
}

// ------------------------------------------------------------ el progreso al objetivo
/**
 * «otroLado»: el peso meta quedó del otro lado de donde se empezó (por ejemplo, al pasar de bajar a subir).
 * «todaviaNo»: hay ritmo, pero su margen es más ancho que el plan: todavía no se sabe.
 */
export type EstadoDelObjetivo = 'llegaste' | 'enCamino' | 'despacio' | 'quieto' | 'alReves' | 'estable' | 'seMueve' | 'sinMeta' | 'otroLado' | 'todaviaNo' | 'faltanDatos';

export type Progreso = {
  estado: EstadoDelObjetivo;
  /** El peso de la tendencia hoy. */
  peso: number | null;
  /** El de hoy sin el atraso de la tendencia: de ahí salen lo que falta, si llegaste y la fecha. */
  nivel: number | null;
  /** Medido, con su margen, y el del plan, en kilos por semana (negativo es bajar). */
  ritmo: number | null;
  rango: { desde: number; hasta: number } | null;
  ritmoPlan: number;
  /** Los kilos que faltan, siempre positivos. */
  faltan: number | null;
  /** Cuándo llegaría al ritmo medido: entre `fechas`, y `fecha` en el medio. Con un margen que no alcanza, ninguna. */
  fecha: ClaveDia | null;
  fechas: Fechas | null;
  /** Cuánto del camino ya se hizo, de 0 a 1, desde el peso con que se empezó. */
  hecho: number | null;
};

export type EntradaDelProgreso = {
  hoy: ClaveDia;
  tendencia: Map<ClaveDia, number>;
  /** Las pesadas: de ahí salen el ritmo con su margen y el peso de hoy sin atraso. */
  pesadas?: readonly Pesada[];
  objetivo: Objetivo;
  ritmo: Ritmo;
  pesoMeta?: number | null;
  /** El peso de la tendencia cuando se fijó el objetivo, para «cuánto del camino». */
  pesoInicial?: number | null;
};

export function progresoAlObjetivo(e: EntradaDelProgreso): Progreso {
  const peso = e.tendencia.get(e.hoy) ?? null;
  // Sin las pesadas (lo de la galería que todavía no las pasa), el ritmo de la tendencia, sin margen.
  const conRango = e.pesadas ? ritmoConRango(e.pesadas, e.hoy) : null;
  const ritmo = e.pesadas ? (conRango?.kgPorSemana ?? null) : ritmoSemanal(e.tendencia, e.hoy);
  const medio = conRango ? (conRango.hasta - conRango.desde) / 2 : 0;
  const nivel = peso === null ? null : nivelDeHoy(e.tendencia, e.hoy, e.pesadas, conRango);
  const ritmoPlan = e.objetivo === 'mantener' || peso === null ? 0 : (RITMOS[e.objetivo][e.ritmo] / 100) * peso;
  const rango = ritmo === null ? null : { desde: ritmo - medio, hasta: ritmo + medio };
  const base = { peso, nivel, ritmo, rango, ritmoPlan, faltan: null, fecha: null, fechas: null, hecho: null };
  if (peso === null || nivel === null) return { ...base, estado: 'faltanDatos' };
  if (e.objetivo === 'mantener') {
    if (ritmo === null) return { ...base, estado: 'faltanDatos' };
    if (medio > MARGEN_PARA_SABER) return { ...base, estado: 'todaviaNo' };
    // Cambiando, solo si todo el margen queda afuera de los 150 g por semana.
    return { ...base, estado: ritmo - medio > ESTABLE_KG_SEMANA || ritmo + medio < -ESTABLE_KG_SEMANA ? 'seMueve' : 'estable' };
  }
  if (!e.pesoMeta) return { ...base, estado: ritmo === null ? 'faltanDatos' : 'sinMeta' };

  const direccion = e.objetivo === 'bajar' ? -1 : 1;
  const faltan = Math.max(0, (e.pesoMeta - nivel) * direccion);
  const camino = e.pesoInicial ? (e.pesoMeta - e.pesoInicial) * direccion : 0;
  const hecho = camino > 0 ? Math.min(1, Math.max(0, 1 - faltan / camino)) : null;
  if (faltan <= LLEGASTE_KG) {
    // Si la meta ya estaba pasada al empezar, no se llegó: está del otro lado.
    if (e.pesoInicial && camino <= 0) return { ...base, estado: 'otroLado' };
    return { ...base, faltan, hecho: hecho === null ? null : 1, estado: 'llegaste' };
  }
  if (ritmo === null) return { ...base, faltan, hecho, estado: 'faltanDatos' };
  const plan = Math.abs(ritmoPlan);
  if (medio > Math.max(MARGEN_PARA_SABER, plan)) return { ...base, faltan, hecho, estado: 'todaviaNo' };

  // El avance hacia la meta con su margen; para decir que no se mueve, nunca menos que lo que se llama quieto.
  const avance = ritmo * direccion;
  const margen = Math.max(medio, QUIETO_KG_SEMANA);
  const fechas = fechasDeLlegada(e.hoy, faltan, avance - medio, avance + medio);
  const fecha = fechas ? sumarDias(e.hoy, Math.ceil((faltan / avance) * 7)) : null;
  const estado: EstadoDelObjetivo = avance + margen < 0 ? 'alReves'
    : avance - margen <= 0 ? 'quieto'
    : avance + medio < DESPACIO * plan ? 'despacio'
    : 'enCamino';
  return { ...base, faltan, hecho, fecha, fechas, estado };
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

// ------------------------------------------------------------ lo que le falta a Moss
/** Lo que falta para estimar mejor: cuántas pesadas o días con comida pide el control, y lo que todavía no sabe. */
export type FaltaParaEstimar = { que: 'pesadas' | 'comida'; n: number; fecha: ClaveDia } | { que: 'pesoMeta' | 'medidas' | 'reloj' };

/**
 * Lo que le falta a Moss (lo pediste el 30/10/2026: da seguridad saberlo): lo que el próximo control
 * necesita antes de su día, un peso meta si va a bajar o a subir, las medidas para la grasa corporal y,
 * sin reloj ni anillo, que el sueño es estimado.
 */
export function faltaParaEstimar(o: {
  control: Pick<EstadoDelControl, 'fecha' | 'diasConComida' | 'pesadas' | 'minimos'> | null;
  objetivo: Objetivo;
  pesoMeta?: number | null;
  conMedidas: boolean;
  sinReloj: boolean;
}): FaltaParaEstimar[] {
  const lista: FaltaParaEstimar[] = [];
  if (o.control) {
    const { pesadas, diasConComida, minimos, fecha } = o.control;
    if (pesadas < minimos.pesadas) lista.push({ que: 'pesadas', n: minimos.pesadas - pesadas, fecha });
    if (diasConComida < minimos.diasConComida) lista.push({ que: 'comida', n: minimos.diasConComida - diasConComida, fecha });
  }
  if (o.objetivo !== 'mantener' && !o.pesoMeta) lista.push({ que: 'pesoMeta' });
  if (!o.conMedidas) lista.push({ que: 'medidas' });
  if (o.sinReloj) lista.push({ que: 'reloj' });
  return lista;
}

// ------------------------------------------------------------ la meta con plazo (D35)
// Como en MacroFactor (lo pediste el 29/10/2026): con el peso meta, el ritmo da la fecha o la fecha
// da el ritmo, y se dice cuánto pide ese ritmo y lo que conviene saber. Los bordes y sus fuentes, en
// spec/evidencia-1.1.md (5).

export type Viabilidad = 'viable' | 'exigente' | 'muyAgresivo';
export type Direccion = Exclude<Objetivo, 'mantener'>;

/** Hasta dónde es viable y hasta dónde exigente, en % del peso por semana. */
export const BORDES: Record<Direccion, readonly [number, number]> = { bajar: [0.5, 1], subir: [0.25, 0.5] };
/** Con medio kilo o menos de diferencia no hay camino: es mantener (como LLEGASTE_KG). */
const SIN_CAMINO_KG = LLEGASTE_KG;
/** Cada kilo menos, unas 22 kcal menos de gasto por día (Hall y Chow, 2011; Hall, 2011, da unas 24). */
const GASTO_POR_KG = 22;

/** Las kcal por día de menos (o de más) que pide un ritmo en kg por semana. */
export const kcalPorDia = (kgPorSemana: number) => (Math.abs(kgPorSemana) * KCAL_POR_KG) / 7;

/** Qué tan exigente es un ritmo, en % del peso por semana (siempre positivo). */
export function viabilidad(direccion: Direccion, pct: number, pesoKg: number): Viabilidad {
  const [viable, exigente] = BORDES[direccion];
  const kg = (pct / 100) * pesoKg;
  const demasiado = pct > exigente + 1e-9 || (direccion === 'bajar' && (kg > KG_POR_SEMANA_MAXIMOS + 1e-9 || kcalPorDia(kg) > DEFICIT_MAXIMO + 1e-9));
  return demasiado ? 'muyAgresivo' : pct > viable + 1e-9 ? 'exigente' : 'viable';
}

/** El ritmo más rápido que todavía es de una viabilidad, en % del peso por semana. */
export function bordeDe(direccion: Direccion, cual: 'viable' | 'exigente', pesoKg: number): number {
  const pct = BORDES[direccion][cual === 'viable' ? 0 : 1];
  if (direccion === 'subir' || !(pesoKg > 0)) return pct;
  const maximoKg = Math.min(KG_POR_SEMANA_MAXIMOS, (DEFICIT_MAXIMO * 7) / KCAL_POR_KG);
  return Math.min(pct, (maximoKg / pesoKg) * 100);
}

/**
 * Lo que conviene saber de un plazo: sin entrenamiento de fuerza, bajando se pierde músculo y
 * subiendo, casi todo es grasa; con ese ritmo la comida quedaría debajo del piso; el piso deja tan
 * poco déficit (o nada) que no se llega en dos años; hoy entra arriba del piso, pero con el gasto que
 * baja al bajar de peso, cerca del final no; o es menor de edad y el ritmo no es el viable.
 */
export type AvisoDelPlazo = 'sinFuerzaBajar' | 'sinFuerzaSubir' | 'piso' | 'pisoNoLlega' | 'pisoAlFinal' | 'menor';

export type Plazo = {
  direccion: Direccion;
  /** Los kilos que faltan, siempre positivos. */
  faltan: number;
  /** El ritmo, en % del peso de hoy y en kg por semana (siempre positivos), y las kcal por día de menos o de más. */
  pct: number;
  kgPorSemana: number;
  kcal: number;
  fecha: ClaveDia;
  semanas: number;
  viabilidad: Viabilidad;
  /** Desde cuándo sería viable y desde cuándo exigente: lo que se puede sugerir. */
  fechaViable: ClaveDia;
  fechaExigente: ClaveDia;
  /** Lo que pide el piso de kcal: con más déficit, quedaría por debajo; null si no llega a eso o si con el piso no se llega en dos años. */
  fechaConPiso: ClaveDia | null;
  avisos: AvisoDelPlazo[];
};

export type EntradaDelPlazo = {
  hoy: ClaveDia;
  /** El peso de hoy (el de la tendencia, o el último). */
  pesoKg: number;
  pesoMeta: number;
  sexo: Sexo;
  edad: number;
  /** Lo que gasta por día (el del último control, o el estimado al empezar). */
  gasto: number;
  /** Si entrena fuerza (Perfil › Entrenamiento o Ascent); sin saberlo, null, y el aviso va. */
  entrenaFuerza: boolean | null;
};

/** Hacia dónde va, o null si con esa meta no hay camino (es mantener). */
export const direccionDe = (pesoKg: number, pesoMeta: number): Direccion | null =>
  Math.abs(pesoMeta - pesoKg) <= SIN_CAMINO_KG ? null : pesoMeta < pesoKg ? 'bajar' : 'subir';

const fechaConRitmo = (hoy: ClaveDia, faltan: number, kgPorSemana: number) => sumarDias(hoy, Math.ceil((faltan / kgPorSemana) * 7));

function armarPlazo(e: EntradaDelPlazo, direccion: Direccion, pct: number, fecha: ClaveDia): Plazo {
  const faltan = Math.abs(e.pesoMeta - e.pesoKg);
  const kgPorSemana = (pct / 100) * e.pesoKg;
  const kcal = kcalPorDia(kgPorSemana);
  const cual = viabilidad(direccion, pct, e.pesoKg);
  const conPiso = direccion === 'bajar' ? e.gasto - pisoDe(e.sexo) : Infinity;
  const conElPiso = kcal > conPiso && conPiso > 0 ? fechaConRitmo(e.hoy, faltan, (conPiso * 7) / KCAL_POR_KG) : null;
  // Con el gasto en el piso o debajo no hay déficit; con muy poco, la fecha queda a años: tampoco es una fecha.
  const noLlega = kcal > conPiso && (conElPiso === null || diasEntre(e.hoy, conElPiso) > HORIZONTE_DIAS);
  const fechaConPiso = noLlega ? null : conElPiso;
  const avisos: AvisoDelPlazo[] = [];
  if (noLlega) avisos.push('pisoNoLlega');
  else if (fechaConPiso) avisos.push('piso');
  else if (direccion === 'bajar' && e.gasto - GASTO_POR_KG * faltan - kcal < pisoDe(e.sexo)) avisos.push('pisoAlFinal');
  if (e.edad < MAYORIA_DE_EDAD && cual !== 'viable') avisos.push('menor');
  if (e.entrenaFuerza !== true) avisos.push(direccion === 'bajar' ? 'sinFuerzaBajar' : 'sinFuerzaSubir');
  return {
    direccion, faltan, pct, kgPorSemana, kcal, fecha, semanas: diasEntre(e.hoy, fecha) / 7, viabilidad: cual,
    fechaViable: fechaConRitmo(e.hoy, faltan, (bordeDe(direccion, 'viable', e.pesoKg) / 100) * e.pesoKg),
    fechaExigente: fechaConRitmo(e.hoy, faltan, (bordeDe(direccion, 'exigente', e.pesoKg) / 100) * e.pesoKg),
    fechaConPiso, avisos,
  };
}

/** Con el ritmo (en % del peso por semana), la fecha en que se llegaría. null si no hay camino o el ritmo es 0. */
export function plazoConRitmo(e: EntradaDelPlazo, pct: number): Plazo | null {
  const direccion = direccionDe(e.pesoKg, e.pesoMeta);
  if (!direccion || !(pct > 0) || !(e.pesoKg > 0)) return null;
  return armarPlazo(e, direccion, pct, fechaConRitmo(e.hoy, Math.abs(e.pesoMeta - e.pesoKg), (pct / 100) * e.pesoKg));
}

/** Con la fecha, el ritmo que hace falta. null si no hay camino o la fecha no es de acá en adelante. */
export function plazoConFecha(e: EntradaDelPlazo, fecha: ClaveDia): Plazo | null {
  const direccion = direccionDe(e.pesoKg, e.pesoMeta);
  const dias = diasEntre(e.hoy, fecha);
  if (!direccion || dias < 7 || !(e.pesoKg > 0)) return null;
  const pct = ((Math.abs(e.pesoMeta - e.pesoKg) / (dias / 7)) / e.pesoKg) * 100;
  return armarPlazo(e, direccion, pct, fecha);
}

// ------------------------------------------------------------ el plan por etapas
// Lo pediste el 2/11/2026: arriba de Progreso, el plan («llegar acá en tanto tiempo; después, esto»),
// que cambie según cómo vienes. Es el plazo (D35) con hitos cada cuatro semanas y lo que viene al
// llegar: unas semanas en mantenimiento, comiendo lo que se gasta, para que el peso se asiente. Cómo
// vienes compara el ritmo medido, con su margen, con el del plan; el control de cada semana ajusta las
// calorías para seguirlo, así que la fecha del plan queda y lo que se mueve es a dónde llegarías.

export type TipoDeEtapa = Objetivo;
export type Etapa = { tipo: TipoDeEtapa; desde: ClaveDia; hasta: ClaveDia | null; pesoDesde: number; pesoHasta: number };
export type Hito = { fecha: ClaveDia; kg: number; meta: boolean };
export type ComoVienes = 'alRitmo' | 'adelantado' | 'atrasado' | 'alReves' | 'llegaste' | 'estable' | 'seMueve' | 'todaviaNo' | 'faltanDatos';
export type PlanPorEtapas = {
  etapas: Etapa[];
  hitos: Hito[];
  comoVienes: ComoVienes;
  /** El ritmo medido, con su margen, y el del plan, en kg por semana con su signo (negativo es bajar). */
  ritmo: number | null;
  rango: { desde: number; hasta: number } | null;
  ritmoPlan: number;
  /** A dónde llegarías a tu ritmo, si va para el lado de la meta y en menos de dos años: entre `fechasATuRitmo`, y en el medio. */
  fechaATuRitmo: ClaveDia | null;
  fechasATuRitmo: Fechas | null;
};

const SEMANAS_POR_HITO = 4;
/** Los hitos antes de la meta: en un plan largo se reparten, así entran en una línea. */
const HITOS_MAXIMOS = 3;
export const SEMANAS_DE_MANTENIMIENTO = 2;
/** Al ritmo es estar a un cuarto del plan, o a 100 g por semana con un plan lento. */
const AL_RITMO = 0.25;
const AL_RITMO_KG = 0.1;

export function planPorEtapas(e: {
  hoy: ClaveDia;
  /** El peso de hoy (sin el atraso de la tendencia, si se sabe). */
  pesoKg: number;
  objetivo: Objetivo;
  pesoMeta?: number | null;
  /** El plazo de hoy (plazoConRitmo o plazoConFecha); sin camino, null. */
  plazo: Plazo | null;
  /** El ritmo medido, en kg por semana, y su margen (ritmoConRango); sin margen, el ritmo solo. */
  ritmo: number | null;
  rango?: { desde: number; hasta: number } | null;
  /** Lo que sigue después del mantenimiento, si lo dijo en el cuestionario: mantener, ganar músculo o decidirlo después. */
  despues?: 'mantener' | 'musculo' | 'despues' | null;
  /** El peso de la tendencia cuando se fijó el objetivo: si la meta ya estaba pasada al empezar, no se llegó. */
  pesoInicial?: number | null;
}): PlanPorEtapas {
  const { hoy, pesoKg, plazo, ritmo } = e;
  const medio = ritmo !== null && e.rango ? (e.rango.hasta - e.rango.desde) / 2 : 0;
  const rango = ritmo === null ? null : { desde: ritmo - medio, hasta: ritmo + medio };
  if (e.objetivo === 'mantener' || !plazo) {
    const meta = e.objetivo === 'mantener' || !e.pesoMeta ? pesoKg : e.pesoMeta;
    // A medio kilo de la meta o pasándola, como progresoAlObjetivo; la meta del otro lado desde el principio no cuenta.
    const direccion = e.objetivo === 'bajar' ? -1 : 1;
    const llego = e.objetivo !== 'mantener' && !!e.pesoMeta && (e.pesoMeta - pesoKg) * direccion <= LLEGASTE_KG
      && !(e.pesoInicial && (e.pesoMeta - e.pesoInicial) * direccion <= 0);
    const comoVienes: ComoVienes = llego ? 'llegaste' : ritmo === null ? 'faltanDatos' : medio > MARGEN_PARA_SABER ? 'todaviaNo'
      : ritmo - medio > ESTABLE_KG_SEMANA || ritmo + medio < -ESTABLE_KG_SEMANA ? 'seMueve' : 'estable';
    return { etapas: [{ tipo: 'mantener', desde: hoy, hasta: null, pesoDesde: pesoKg, pesoHasta: meta }], hitos: [], comoVienes, ritmo, rango, ritmoPlan: 0, fechaATuRitmo: null, fechasATuRitmo: null };
  }
  const signo = plazo.direccion === 'bajar' ? -1 : 1;
  const meta = pesoKg + signo * plazo.faltan;
  const dias = diasEntre(hoy, plazo.fecha);
  const finDelMantenimiento = sumarDias(plazo.fecha, SEMANAS_DE_MANTENIMIENTO * 7);
  const etapas: Etapa[] = [
    { tipo: plazo.direccion, desde: hoy, hasta: plazo.fecha, pesoDesde: pesoKg, pesoHasta: meta },
    { tipo: 'mantener', desde: plazo.fecha, hasta: finDelMantenimiento, pesoDesde: meta, pesoHasta: meta },
  ];
  // Lo que sigue, sin fecha de fin: quedarse ahí o ganar músculo (subir despacio). «Después» lo decide al llegar.
  if (e.despues === 'mantener' || e.despues === 'musculo') {
    etapas.push({ tipo: e.despues === 'musculo' ? 'subir' : 'mantener', desde: finDelMantenimiento, hasta: null, pesoDesde: meta, pesoHasta: meta });
  }
  // Cada cuatro semanas, o repartidos si no entran; el último, la meta. De a medio kilo: más fino sería precisión falsa.
  const cuantos = Math.min(HITOS_MAXIMOS, Math.floor((dias - 1) / (SEMANAS_POR_HITO * 7)));
  const paso = cuantos > 0 ? (Math.floor((dias - 1) / (SEMANAS_POR_HITO * 7)) > HITOS_MAXIMOS ? dias / (cuantos + 1) : SEMANAS_POR_HITO * 7) : 0;
  const hitos: Hito[] = Array.from({ length: cuantos }, (_, i) => {
    const d = Math.round(paso * (i + 1));
    return { fecha: sumarDias(hoy, d), kg: Math.round((pesoKg + (signo * plazo.faltan * d) / dias) * 2) / 2, meta: false };
  });
  hitos.push({ fecha: plazo.fecha, kg: meta, meta: true });
  const ritmoPlan = signo * plazo.kgPorSemana;
  const base = { etapas, hitos, ritmo, rango, ritmoPlan, fechaATuRitmo: null as ClaveDia | null, fechasATuRitmo: null as Fechas | null };
  if (ritmo === null) return { ...base, comoVienes: 'faltanDatos' };
  const p = plazo.kgPorSemana;
  if (medio > Math.max(MARGEN_PARA_SABER, p)) return { ...base, comoVienes: 'todaviaNo' };
  const avance = ritmo * signo;
  const fechasATuRitmo = fechasDeLlegada(hoy, plazo.faltan, avance - medio, avance + medio);
  const fechaATuRitmo = fechasATuRitmo ? sumarDias(hoy, Math.ceil((plazo.faltan / avance) * 7)) : null;
  // Adelantado o más lento, solo si todo el margen queda afuera del plan con su cuarto.
  const m = Math.max(AL_RITMO * p, AL_RITMO_KG);
  const comoVienes: ComoVienes = avance + Math.max(medio, QUIETO_KG_SEMANA) < 0 ? 'alReves'
    : avance - medio > p + m ? 'adelantado'
    : avance + medio < p - m ? 'atrasado'
    : 'alRitmo';
  return { ...base, comoVienes, fechaATuRitmo, fechasATuRitmo };
}
