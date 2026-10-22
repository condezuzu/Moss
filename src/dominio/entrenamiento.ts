// Lo que Moss hace con el entrenamiento de Ascent (spec/ascent.md): las calorías según el día, la
// proteína después de entrenar, la recuperación y «Por qué no subís». Ascent anota cada sesión con
// sus series y el peso de cada serie; Moss la lee por el vínculo y no la guarda.

import { diaDeLaSemana, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { pisoDe, type Macros, type Sexo } from './metas';

/**
 * Una sesión de Ascent: el día, las series, el peso movido (la suma del peso de cada serie, en
 * kilos, como lo cuenta Ascent) y los minutos.
 */
export type Sesion = { fecha: ClaveDia; series: number; kilos: number; minutos: number };

/** Lo que se mira hacia atrás para saber cómo entrena alguien: las 4 semanas anteriores. */
export const SEMANAS_DE_HISTORIA = 4;

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const aDiez = (n: number) => Math.round(n / 10) * 10;

/** Las sesiones de las 4 semanas anteriores a `desde` (sin contar ese día). */
export function sesionesAnteriores(sesiones: readonly Sesion[], desde: ClaveDia): Sesion[] {
  const inicio = sumarDias(desde, -7 * SEMANAS_DE_HISTORIA);
  return sesiones.filter((s) => s.fecha >= inicio && s.fecha < desde);
}

/** El promedio de las sesiones: series, peso movido y minutos. Sin sesiones, null. */
export function promedioDeSesiones(sesiones: readonly Sesion[]): Omit<Sesion, 'fecha'> | null {
  if (sesiones.length === 0) return null;
  const n = sesiones.length;
  return {
    series: sesiones.reduce((s, x) => s + x.series, 0) / n,
    kilos: sesiones.reduce((s, x) => s + x.kilos, 0) / n,
    minutos: sesiones.reduce((s, x) => s + x.minutos, 0) / n,
  };
}

// ------------------------------------------------------------ calorías según el día

/**
 * Lo que cuesta una sesión de pesas, NETO: el gasto total de esa hora menos lo que se gasta igual
 * en reposo, que el día de descanso ya incluye. Un MET es 1 kcal por kilo y por hora. El Compendio
 * de Actividades Físicas (2024) le da al entrenamiento de fuerza de 3,5 a 6 MET según el esfuerzo:
 * se toman 5 en total, menos el 1 del reposo, y quedan 4 kcal por kilo y por hora. Con la duración
 * promedio, de a 10 kcal, entre 100 y 500.
 */
export const MET_DE_LA_SESION = 5;
export const MET_EN_REPOSO = 1;
export const KCAL_POR_KILO_Y_HORA = MET_DE_LA_SESION - MET_EN_REPOSO;
export function costoDeSesion(pesoKg: number, minutosPromedio: number): number {
  return aDiez(clamp((KCAL_POR_KILO_Y_HORA * pesoKg * minutosPromedio) / 60, 100, 500));
}

/**
 * Qué tan seguido entrena cada día de la semana: en cuántas de las 4 semanas anteriores a `desde`
 * hubo sesión ese día, de 0 a 1.
 */
export function frecuenciaPorDia(sesiones: readonly Sesion[], desde: ClaveDia): Record<DiaSemana, number> {
  const f: Record<DiaSemana, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  const dias = new Set(sesionesAnteriores(sesiones, desde).map((s) => s.fecha));
  dias.forEach((fecha) => { f[diaDeLaSemana(fecha)] += 1 / SEMANAS_DE_HISTORIA; });
  return f;
}

/**
 * Un día de la semana del control: si entrenó (null si todavía no se sabe) y su meta. Los días
 * que vienen son una previsión: la meta que tendrían si entrena como de costumbre.
 */
export type DiaConEntrenamiento = { fecha: ClaveDia; entrena: boolean | null; meta: Macros };

/**
 * Calorías según el día. El control de la semana ya cuenta el entrenamiento de siempre en el gasto,
 * así que no se suma nada: se reparte. Un día de gimnasio tiene lo que cuesta una sesión más que
 * uno de descanso, y la semana del control (de su día a los 6 siguientes) suma lo mismo que da el
 * control: 7 veces su meta.
 *
 * Los días se resuelven en orden, y cada uno se lleva su parte de lo que queda de la semana. Lo que
 * ya pasó se sabe: entrenó o no, y hoy cuenta como entrenado si Ascent ya anotó la sesión (si no,
 * hoy es de descanso hasta que la anote). Lo que viene se espera según qué tan seguido entrena ese
 * día de la semana. Así, si entrena más o menos que de costumbre, los días que quedan se acomodan y
 * el último cierra la cuenta exacta.
 *
 * Se mueven los carbohidratos: la proteína y las grasas quedan. Ningún día baja del piso de
 * calorías ni de lo que piden la proteína y las grasas; solo ahí la semana puede pasarse.
 */
export function caloriasSegunElDia(p: {
  meta: Macros;
  inicio: ClaveDia;
  hoy: ClaveDia;
  sesiones: readonly Sesion[];
  frecuencia: Record<DiaSemana, number>;
  costo: number;
  sexo: Sexo;
}): DiaConEntrenamiento[] {
  const total = 7 * p.meta.kcal;
  const minimo = Math.max(pisoDe(p.sexo), p.meta.kcal - p.meta.carbohidratos * 4);
  const entreno = new Set(p.sesiones.map((s) => s.fecha));
  const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(p.inicio, i));
  const esperado = (i: number) => p.frecuencia[diaDeLaSemana(fechas[i])];
  const dias: DiaConEntrenamiento[] = [];
  let usado = 0;
  for (let i = 0; i < 7; i++) {
    const sabido = fechas[i] <= p.hoy;
    const entrena = sabido ? entreno.has(fechas[i]) : null;
    const este = entrena === null ? esperado(i) : entrena ? 1 : 0;
    let siguen = 0;
    for (let k = i + 1; k < 7; k++) siguen += esperado(k);
    const queda = total - usado;
    // Lo de un día de descanso: lo que queda, menos lo que se espera entrenar, entre los días que quedan.
    const descanso = (queda - p.costo * (este + siguen)) / (7 - i);
    const kcal = Math.max(minimo, i === 6 ? queda : aDiez(descanso + p.costo * este));
    usado += kcal;
    const carbohidratos = Math.max(0, Math.round(p.meta.carbohidratos + (kcal - p.meta.kcal) / 4));
    dias.push({ fecha: fechas[i], entrena, meta: { ...p.meta, kcal, carbohidratos } });
  }
  return dias;
}

// ------------------------------------------------------------ proteína después de entrenar

/**
 * Pasando los 2,2 g por kilo por día, más proteína no suma músculo: es el límite de arriba del
 * punto de quiebre de Morton y otros (2018), que está en 1,62 g por kilo.
 */
export const TECHO_PROTEINA_POR_KG = 2.2;
export const PROTEINA_EXTRA_MAXIMA = 40;

/**
 * El tamaño de una sesión contra las de siempre: las series y el peso movido, cada uno contra el
 * promedio de las 4 semanas anteriores, y la media de los dos. 1 es una sesión de las de siempre;
 * sin historia, también.
 */
export function tamanoDeSesion(sesion: Pick<Sesion, 'series' | 'kilos'>, promedio: Pick<Sesion, 'series' | 'kilos'> | null): number {
  if (!promedio || promedio.series <= 0 || promedio.kilos <= 0) return 1;
  return (sesion.series / promedio.series + sesion.kilos / promedio.kilos) / 2;
}

/**
 * Proteína después de entrenar: el día de una sesión, la proteína sube hacia el techo útil de 2,2 g
 * por kilo, según el tamaño de la sesión. Una de la mitad de lo de siempre o menos no suma; una de
 * las de siempre suma la mitad de lo que falta hasta el techo; una un 50 % más grande, todo. De a
 * 5 g y hasta 40 g. Después de una sesión de todo el cuerpo, más proteína da más síntesis muscular
 * (Macnaughton y otros, 2016; Trommelen y otros, 2023).
 */
export function proteinaDespuesDeEntrenar(p: { tamano: number; pesoKg: number; proteina: number }): number {
  const margen = Math.max(0, TECHO_PROTEINA_POR_KG * p.pesoKg - p.proteina);
  const extra = Math.min(PROTEINA_EXTRA_MAXIMA, margen * clamp(p.tamano - 0.5, 0, 1));
  return Math.floor(extra / 5) * 5;
}

/**
 * La meta de hoy con Ascent: la del reparto de la semana y, si entrenó, la proteína de la sesión.
 * Esa proteína sale de los carbohidratos del día: las calorías quedan como las dejó el reparto.
 */
export function metaConEntrenamiento(dia: DiaConEntrenamiento, extraProteina: number): Macros {
  const extra = dia.entrena ? Math.min(extraProteina, dia.meta.carbohidratos) : 0;
  return { ...dia.meta, proteina: dia.meta.proteina + extra, carbohidratos: dia.meta.carbohidratos - extra };
}

// ------------------------------------------------------------ recuperación

export const MAXIMOS_DE_RECUPERACION = { sueno: 40, carga: 40, comida: 20 } as const;
export type ParteDeRecuperacion = keyof typeof MAXIMOS_DE_RECUPERACION;
export type Recuperacion = {
  partes: Record<ParteDeRecuperacion, number>;
  total: number;
  /** El peso movido de los 3 días anteriores contra 3 días de los de siempre. */
  carga: number;
  conviene: 'fuerte' | 'normal' | 'suave';
};

/**
 * La recuperación de cada día, antes de entrenar, de 0 a 100. En la app la calcula
 * moss.recuperacion(fecha) en Supabase, con esta misma cuenta, así las dos apps dan el mismo número.
 * - Sueño, 40: 20 por lo dormido contra lo que se necesita y 20 por la calidad de la noche.
 * - Carga, 40: el peso movido de los 3 días anteriores contra 3 veces el promedio diario de las 4
 *   semanas anteriores. Hasta la mitad de lo de siempre da 40, lo de siempre 20 y 1,5 veces, 0;
 *   menos 5 por cada día seguido de entrenamiento después del segundo.
 * - Comida, 20: 10 por la proteína de ayer contra la meta y 10 por haber comido al menos el 80 %.
 * Desde 70 conviene ir fuerte; de 45 a 69, normal; debajo, suave.
 */
export function recuperacion(d: {
  dormido: number; necesidad: number; calidad: number | null;
  kilos3: number; kilosPorDia: number; seguidos: number;
  proteinaAyer: number; metaProteina: number; kcalAyer: number; metaKcal: number;
}): Recuperacion {
  const sueno = 20 * Math.min(1, d.dormido / d.necesidad) + (20 * clamp(d.calidad ?? 0, 0, 100)) / 100;
  const carga = d.kilosPorDia > 0 ? d.kilos3 / (3 * d.kilosPorDia) : 0;
  const deCarga = Math.max(0, 40 * clamp(1.5 - carga, 0, 1) - 5 * Math.max(0, d.seguidos - 2));
  const comida = 10 * Math.min(1, d.proteinaAyer / d.metaProteina) + 10 * Math.min(1, d.kcalAyer / (0.8 * d.metaKcal));
  const partes = { sueno: Math.round(sueno), carga: Math.round(deCarga), comida: Math.round(comida) };
  const total = partes.sueno + partes.carga + partes.comida;
  return { partes, total, carga, conviene: total >= 70 ? 'fuerte' : total >= 45 ? 'normal' : 'suave' };
}

// ------------------------------------------------------------ por qué no subís

/** Lo de Moss de una semana: los promedios y cuántos días tuvieron datos. */
export type SemanaDeMoss = {
  sueno: number | null;
  proteina: number | null;
  balance: number | null;
  diasConComida: number;
  nochesConSueno: number;
};
export type Promedios = { sueno: number; proteina: number; balance: number };
export type Causa = 'sueno' | 'proteina' | 'calorias';
export type PorQueNoSube =
  | { estado: 'juntando'; conMarcas: number; sinMarcas: number }
  | { estado: 'sinDiferencia'; antes: Promedios; ahora: Promedios }
  | { estado: 'probable'; causa: Causa; antes: Promedios; ahora: Promedios };

/** Lo mínimo para decir algo: 3 semanas de cada lado, cada una con 4 días de comida y 4 noches. */
export const SEMANAS_MINIMAS = 3;
export const DIAS_MINIMOS = 4;
/** Lo que cuenta lo mismo: 45 minutos de sueño, 15 g de proteína por día o 250 kcal de balance por día. */
export const ESCALAS: Record<Causa, number> = { sueno: 45, proteina: 15, calorias: 250 };

/** El resumen de una semana: el sueño promedio, la proteína y el balance por día, con lo que haya. */
export function semanaDeMoss(noches: readonly number[], comidas: readonly { kcal: number; proteina: number }[], gasto: number): SemanaDeMoss {
  const promedio = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const kcal = promedio(comidas.map((c) => c.kcal));
  return {
    sueno: promedio([...noches]),
    proteina: promedio(comidas.map((c) => c.proteina)),
    balance: kcal === null ? null : kcal - gasto,
    diasConComida: comidas.length,
    nochesConSueno: noches.length,
  };
}

/**
 * «Por qué no subís»: Ascent dice qué ejercicio se estancó; Moss compara las semanas en que subía
 * con las del estancamiento, en el sueño, la proteína y el balance. Sin el mínimo de semanas,
 * todavía está juntando información. Cada diferencia se mide en su escala y solo cuenta la que va
 * para el lado malo (dormir menos, menos proteína, más déficit). Si la más grande llega a una escala
 * entera, es la causa probable (nunca segura: son semanas comparadas); si no, no hay una diferencia
 * clara.
 */
export function porQueNoSube(conMarcas: readonly SemanaDeMoss[], sinMarcas: readonly SemanaDeMoss[]): PorQueNoSube {
  const completa = (s: SemanaDeMoss) => s.diasConComida >= DIAS_MINIMOS && s.nochesConSueno >= DIAS_MINIMOS && s.sueno !== null && s.proteina !== null && s.balance !== null;
  const a = conMarcas.filter(completa);
  const b = sinMarcas.filter(completa);
  if (a.length < SEMANAS_MINIMAS || b.length < SEMANAS_MINIMAS) return { estado: 'juntando', conMarcas: a.length, sinMarcas: b.length };
  const promedios = (xs: SemanaDeMoss[]): Promedios => ({
    sueno: xs.reduce((s, x) => s + (x.sueno as number), 0) / xs.length,
    proteina: xs.reduce((s, x) => s + (x.proteina as number), 0) / xs.length,
    balance: xs.reduce((s, x) => s + (x.balance as number), 0) / xs.length,
  });
  const antes = promedios(a);
  const ahora = promedios(b);
  const diferencias: Record<Causa, number> = {
    sueno: (antes.sueno - ahora.sueno) / ESCALAS.sueno,
    proteina: (antes.proteina - ahora.proteina) / ESCALAS.proteina,
    calorias: (antes.balance - ahora.balance) / ESCALAS.calorias,
  };
  const causa = (Object.keys(diferencias) as Causa[]).reduce((x, y) => (diferencias[y] > diferencias[x] ? y : x));
  return diferencias[causa] >= 1 ? { estado: 'probable', causa, antes, ahora } : { estado: 'sinDiferencia', antes, ahora };
}
