// Razones de estancamiento (spec/ascent.md, «Ascent en Progreso», para aprobar): Ascent dice qué ejercicios no
// suben desde hace N semanas (el umbral se elige en sus Ajustes: 2, 3, 6 u 8; 6 de fábrica) y Moss busca las
// razones más probables de cada uno, todas las que se den. Las del sueño y la comida comparan las semanas en
// que subía con las de ahora, con la regla de porQueNoSube() (entrenamiento.ts, que la app sigue usando); las
// de Ascent miran cómo llegaste a cada sesión, cada cuánto lo entrenas y cuánto duran tus sesiones. Siempre es
// una causa probable, no segura, y describe sin recetar.

import { DIAS_MINIMOS, ESCALAS, SEMANAS_MINIMAS, type Promedios, type SemanaDeMoss } from './entrenamiento';

export type Razon =
  /** Con objetivo «bajar»: mantener la fuerza ya es un buen resultado. `bajaSemanal`, en kg por semana. */
  | { que: 'definicion'; bajaSemanal: number | null }
  /** Las semanas de ahora contra las que subía: el sueño (minutos), la proteína (g por día) y el balance (kcal por día). */
  | { que: 'sueno'; antes: number; ahora: number }
  | { que: 'proteina'; antes: number; ahora: number }
  | { que: 'calorias'; antes: number; ahora: number }
  /** Llegó con el músculo principal cargado a `veces` de sus últimas `de` sesiones con el ejercicio. */
  | { que: 'cargado'; veces: number; de: number }
  /** Lo entrena menos seguido que cuando subía: veces por semana. */
  | { que: 'menosSeguido'; antes: number; ahora: number }
  /** Las sesiones se achicaron: la mediana de minutos. */
  | { que: 'sesionesMasCortas'; antes: number; ahora: number };

export type Comparacion =
  | { estado: 'comparado'; antes: Promedios; ahora: Promedios }
  | { estado: 'juntando'; conMarcas: number; sinMarcas: number };

export type RazonesDeEstancamiento = { comparacion: Comparacion; razones: Razon[] };

/** Cargado es más de 10 % sin recuperar (estadoDe() de musculos.ts); cuenta si pasa en la mitad de las sesiones o más. */
export const CARGADO_DESDE = 10;
export const SESIONES_PARA_CARGADO = 3;
/** Menos seguido: dos tercios de lo de antes o menos. */
export const MENOS_SEGUIDO = 2 / 3;
/** Sesiones más cortas: un 25 % menos o más, como la señal de Ascent (CAIDA_MINIMA en su nucleo/estancamiento.ts). */
export const SESION_MAS_CORTA = 0.75;

/**
 * Las razones de un ejercicio que no sube, de la que más pesa a la que menos: primero la definición (explica
 * lo demás), después el sueño, la proteína y las calorías que llegan a una escala entera (las mismas de
 * porQueNoSube(): 45 minutos, 15 g o 250 kcal por día), y al final lo de Ascent. Sin ninguna, una lista vacía:
 * no hay una causa clara en el sueño ni en la comida.
 */
export function razonesDeEstancamiento(p: {
  conMarcas: readonly SemanaDeMoss[];
  sinMarcas: readonly SemanaDeMoss[];
  objetivo: 'bajar' | 'mantener' | 'subir';
  bajaSemanal: number | null;
  /** Lo que le faltaba recuperar al músculo principal al empezar cada sesión con el ejercicio (en %), de la más vieja a la última. */
  llegadas: readonly number[];
  vecesPorSemana: { antes: number; ahora: number } | null;
  minutos: { antes: number; ahora: number } | null;
}): RazonesDeEstancamiento {
  const razones: Razon[] = [];
  if (p.objetivo === 'bajar') razones.push({ que: 'definicion', bajaSemanal: p.bajaSemanal });

  const completa = (s: SemanaDeMoss) => s.diasConComida >= DIAS_MINIMOS && s.nochesConSueno >= DIAS_MINIMOS && s.sueno !== null && s.proteina !== null && s.balance !== null;
  const a = p.conMarcas.filter(completa);
  const b = p.sinMarcas.filter(completa);
  let comparacion: Comparacion;
  if (a.length < SEMANAS_MINIMAS || b.length < SEMANAS_MINIMAS) comparacion = { estado: 'juntando', conMarcas: a.length, sinMarcas: b.length };
  else {
    const promedios = (xs: SemanaDeMoss[]): Promedios => ({
      sueno: xs.reduce((s, x) => s + (x.sueno as number), 0) / xs.length,
      proteina: xs.reduce((s, x) => s + (x.proteina as number), 0) / xs.length,
      balance: xs.reduce((s, x) => s + (x.balance as number), 0) / xs.length,
    });
    const antes = promedios(a);
    const ahora = promedios(b);
    comparacion = { estado: 'comparado', antes, ahora };
    // Solo lo que va para el lado malo: dormir menos, menos proteína o más déficit.
    const de: ['sueno' | 'proteina' | 'calorias', number, number, number][] = [
      ['sueno', (antes.sueno - ahora.sueno) / ESCALAS.sueno, antes.sueno, ahora.sueno],
      ['proteina', (antes.proteina - ahora.proteina) / ESCALAS.proteina, antes.proteina, ahora.proteina],
      ['calorias', (antes.balance - ahora.balance) / ESCALAS.calorias, antes.balance, ahora.balance],
    ];
    de.filter(([, d]) => d >= 1).sort((x, y) => y[1] - x[1]).forEach(([que, , antes2, ahora2]) => razones.push({ que, antes: antes2, ahora: ahora2 }));
  }

  if (p.llegadas.length >= SESIONES_PARA_CARGADO) {
    const veces = p.llegadas.filter((r) => r > CARGADO_DESDE).length;
    if (veces * 2 >= p.llegadas.length) razones.push({ que: 'cargado', veces, de: p.llegadas.length });
  }
  // El margen es para que 1 contra 1,5 cuente: 1,5 × 2/3 da apenas menos que 1 en coma flotante.
  if (p.vecesPorSemana && p.vecesPorSemana.antes > 0 && p.vecesPorSemana.ahora <= p.vecesPorSemana.antes * MENOS_SEGUIDO + 1e-9) {
    razones.push({ que: 'menosSeguido', antes: p.vecesPorSemana.antes, ahora: p.vecesPorSemana.ahora });
  }
  if (p.minutos && p.minutos.antes > 0 && p.minutos.ahora <= p.minutos.antes * SESION_MAS_CORTA) {
    razones.push({ que: 'sesionesMasCortas', antes: p.minutos.antes, ahora: p.minutos.ahora });
  }
  return { comparacion, razones };
}
