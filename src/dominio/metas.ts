// Las metas de comida (especificación, «Nutrición» 1; el cómo, en spec/nutricion.md). Es el
// método de MacroFactor con fórmulas públicas: para empezar, Mifflin-St Jeor por el nivel de
// actividad; después, el control de cada semana (control.ts) mide el gasto de verdad.

import type { ClaveDia } from './fechas';

export type Sexo = 'f' | 'm';
export type Actividad = 'poco' | 'algo' | 'activo' | 'muy';
export type Objetivo = 'bajar' | 'mantener' | 'subir';
export type Ritmo = 'suave' | 'recomendado' | 'rapido';

/** Las respuestas del cuestionario de la entrada. */
export type Cuestionario = { edad: number; sexo: Sexo; alturaCm: number; pesoKg: number; actividad: Actividad; objetivo: Objetivo; ritmo: Ritmo };

export type Macros = { kcal: number; proteina: number; carbohidratos: number; grasas: number };

/** Lo que queda guardado del cuestionario: la edad como año de nacimiento, para que no envejezca; el peso va aparte. */
export type Perfil = Omit<Cuestionario, 'edad' | 'pesoKg'> & { nacimiento: number; actualizado: string };

/** Las metas desde una fecha, con el gasto de donde salieron, por qué y cuándo se fijaron (entre dos teléfonos, gana la más nueva). */
export type MetaGuardada = Macros & { desde: ClaveDia; gasto: number; motivo: 'inicial' | 'control' | 'faltanDatos' | 'manual'; momento: string };

export const edadDe = (perfil: Pick<Perfil, 'nacimiento'>, hoy: ClaveDia) => Number(hoy.slice(0, 4)) - perfil.nacimiento;

/** El factor de cada nivel de actividad sobre el gasto basal. */
export const NIVELES: Record<Actividad, number> = { poco: 1.35, algo: 1.5, activo: 1.65, muy: 1.85 };

/** Cuánto del peso por semana, en porcentaje. */
export const RITMOS: Record<Exclude<Objetivo, 'mantener'>, Record<Ritmo, number>> = {
  bajar: { suave: -0.25, recomendado: -0.5, rapido: -0.75 },
  subir: { suave: 0.1, recomendado: 0.25, rapido: 0.4 },
};

export const KCAL_POR_KG = 7700;
export const MAYORIA_DE_EDAD = 18;

const PISOS: Record<Sexo, number> = { f: 1200, m: 1400 };
/** Proteína por kilo según el objetivo; todas dentro del rango de 1,2 a 2,2 g. */
const PROTEINA_POR_KG: Record<Objetivo, number> = { bajar: 2.0, mantener: 1.6, subir: 1.8 };
/** Con mucho peso y pocas calorías, la proteína por kilo se comería el resto: nunca pasa del 40 %. */
const PROTEINA_MAXIMA = 0.4;
/** Las grasas: al menos el 27 % de las kcal y nunca menos de 0,6 g por kilo. */
const GRASAS_MINIMAS = 0.27;
const GRASAS_POR_KG = 0.6;

const aDiez = (n: number) => Math.round(n / 10) * 10;

/** Mifflin-St Jeor: el gasto en reposo, en kcal por día. */
export function gastoBasal(c: Pick<Cuestionario, 'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>): number {
  return 10 * c.pesoKg + 6.25 * c.alturaCm - 5 * c.edad + (c.sexo === 'f' ? -161 : 5);
}

/** El ritmo que se usa: bajar rápido queda para los mayores de edad. */
export function ritmoPermitido(c: Pick<Cuestionario, 'edad' | 'objetivo' | 'ritmo'>): Ritmo {
  return c.objetivo === 'bajar' && c.ritmo === 'rapido' && c.edad < MAYORIA_DE_EDAD ? 'recomendado' : c.ritmo;
}

/** Las kcal por día de más o de menos que pide el objetivo. */
export function ajusteDiario(objetivo: Objetivo, ritmo: Ritmo, pesoKg: number): number {
  if (objetivo === 'mantener') return 0;
  return ((RITMOS[objetivo][ritmo] / 100) * pesoKg * KCAL_POR_KG) / 7;
}

/** Proteína primero, después las grasas y los carbohidratos con lo que queda. */
export function macrosPara(kcal: number, pesoKg: number, objetivo: Objetivo): Macros {
  const proteina = Math.round(Math.min(pesoKg * PROTEINA_POR_KG[objetivo], (kcal * PROTEINA_MAXIMA) / 4));
  const grasas = Math.round(Math.max(pesoKg * GRASAS_POR_KG, (kcal * GRASAS_MINIMAS) / 9));
  const carbohidratos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));
  return { kcal, proteina, carbohidratos, grasas };
}

/** La meta para un gasto: el gasto más o menos el ritmo, nunca por debajo del piso. */
export function metaPara(gasto: number, c: Pick<Cuestionario, 'edad' | 'sexo' | 'pesoKg' | 'objetivo' | 'ritmo'>): Macros {
  const kcal = Math.max(PISOS[c.sexo], aDiez(gasto + ajusteDiario(c.objetivo, ritmoPermitido(c), c.pesoKg)));
  return macrosPara(kcal, c.pesoKg, c.objetivo);
}

/** Lo que muestra el final del cuestionario: el gasto estimado y la meta de arranque. */
export function metasIniciales(c: Cuestionario): { gasto: number; metas: Macros } {
  const gasto = gastoBasal(c) * NIVELES[c.actividad];
  return { gasto: aDiez(gasto), metas: metaPara(gasto, c) };
}
