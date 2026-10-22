// Las metas de comida (especificación, «Nutrición» 1; el cómo, en spec/nutricion.md). Es el
// método de MacroFactor con fórmulas públicas: para empezar, Mifflin-St Jeor por el nivel de
// actividad; después, el control de cada semana (control.ts) mide el gasto de verdad.

import type { ClaveDia, DiaSemana } from './fechas';

export type Sexo = 'f' | 'm';
export type Actividad = 'poco' | 'algo' | 'activo' | 'muy';
export type Objetivo = 'bajar' | 'mantener' | 'subir';
export type Ritmo = 'suave' | 'recomendado' | 'rapido';

/** Las respuestas del cuestionario de la entrada. */
export type Cuestionario = { edad: number; sexo: Sexo; alturaCm: number; pesoKg: number; actividad: Actividad; objetivo: Objetivo; ritmo: Ritmo };

export type Macros = { kcal: number; proteina: number; carbohidratos: number; grasas: number };

/**
 * Cómo se reparten las kcal entre los macros, como los programas de MacroFactor. La proteína va
 * siempre por kilo; cambia qué se lleva el resto (spec/nutricion.md, «Lo que tienen las otras apps»).
 */
export type Estilo = 'equilibrada' | 'bajaEnGrasas' | 'bajaEnCarbohidratos' | 'keto';
export const ESTILOS: readonly Estilo[] = ['equilibrada', 'bajaEnGrasas', 'bajaEnCarbohidratos', 'keto'];

/** Repartir la semana: los días altos y cuántas kcal suben (repartirSemana). */
export type Semana = { altos: DiaSemana[]; extra: number };
export const EXTRAS = [200, 300, 500] as const;

/**
 * Lo que queda guardado del cuestionario: la edad como año de nacimiento, para que no envejezca; el
 * peso va aparte. La estrategia de Progreso suma el peso al que se quiere llegar, el día de la
 * semana del control (sin elegirlo, es el día de la primera meta) y si se reparte la semana.
 */
export type Perfil = Omit<Cuestionario, 'edad' | 'pesoKg'> & {
  nacimiento: number; estilo?: Estilo; pesoMeta?: number; diaDelControl?: DiaSemana; semana?: Semana; actualizado: string;
};

/**
 * Las metas desde una fecha, con el gasto de donde salieron, por qué y cuándo se fijaron (entre dos
 * teléfonos, gana la más nueva). «objetivo» es un cambio de la estrategia en Progreso.
 */
export type MetaGuardada = Macros & { desde: ClaveDia; gasto: number; motivo: 'inicial' | 'control' | 'faltanDatos' | 'manual' | 'objetivo'; momento: string };

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
/** Bajas en grasas es la punta de abajo del rango recomendado (20 a 35 %). */
const GRASAS_BAJAS = 0.2;
/** Menos del 26 % de las kcal en carbohidratos ya es «bajo en carbohidratos». */
const CARBOHIDRATOS_BAJOS = 0.25;
/** Keto: los carbohidratos fijos, en gramos por día. */
const CARBOHIDRATOS_KETO = 30;

const aDiez = (n: number) => Math.round(n / 10) * 10;

export const pisoDe = (sexo: Sexo) => PISOS[sexo];

/** La fibra: 14 g cada 1.000 kcal, la recomendación de las guías de Estados Unidos. Es una meta suave: nunca se marca en rojo. */
export const metaDeFibra = (kcal: number) => Math.round((14 * kcal) / 1000);

/**
 * Cómo va cada macro contra su meta: brilla cuando se cumple lo pedido (el número redondeado llega
 * a la meta) y tiembla si se pasa por mucho, un 20 % y al menos 10 g.
 */
export type EstadoDeMacro = 'falta' | 'cumplido' | 'pasado';
const PASADO = 0.2;
const PASADO_GRAMOS = 10;
export function estadoDeMacro(comido: number, meta: number): EstadoDeMacro {
  if (Math.round(comido) < Math.round(meta)) return 'falta';
  return comido - meta >= Math.max(PASADO_GRAMOS, meta * PASADO) ? 'pasado' : 'cumplido';
}

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

/**
 * Proteína primero. En la equilibrada y en la baja en grasas, después las grasas con su mínimo y
 * los carbohidratos con lo que queda; en las bajas en carbohidratos, al revés.
 */
export function macrosPara(kcal: number, pesoKg: number, objetivo: Objetivo, estilo: Estilo = 'equilibrada'): Macros {
  const proteina = Math.round(Math.min(pesoKg * PROTEINA_POR_KG[objetivo], (kcal * PROTEINA_MAXIMA) / 4));
  if (estilo === 'equilibrada' || estilo === 'bajaEnGrasas') {
    const minimas = estilo === 'equilibrada' ? GRASAS_MINIMAS : GRASAS_BAJAS;
    const grasas = Math.round(Math.max(pesoKg * GRASAS_POR_KG, (kcal * minimas) / 9));
    const carbohidratos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));
    return { kcal, proteina, carbohidratos, grasas };
  }
  const carbohidratos = estilo === 'keto' ? CARBOHIDRATOS_KETO : Math.round((kcal * CARBOHIDRATOS_BAJOS) / 4);
  const grasas = Math.max(0, Math.round((kcal - proteina * 4 - carbohidratos * 4) / 9));
  return { kcal, proteina, carbohidratos, grasas };
}

/** La meta para un gasto: el gasto más o menos el ritmo, nunca por debajo del piso. */
export function metaPara(gasto: number, c: Pick<Cuestionario, 'edad' | 'sexo' | 'pesoKg' | 'objetivo' | 'ritmo'>, estilo: Estilo = 'equilibrada'): Macros {
  const kcal = Math.max(PISOS[c.sexo], aDiez(gasto + ajusteDiario(c.objetivo, ritmoPermitido(c), c.pesoKg)));
  return macrosPara(kcal, c.pesoKg, c.objetivo, estilo);
}

/** Las metas a mano: los gramos de cada macro y, si no se dan, las kcal que suman (4, 4 y 9 por gramo). */
export function metaManual(m: Omit<Macros, 'kcal'> & { kcal?: number }): Macros {
  const proteina = Math.max(0, Math.round(m.proteina));
  const carbohidratos = Math.max(0, Math.round(m.carbohidratos));
  const grasas = Math.max(0, Math.round(m.grasas));
  return { kcal: Math.round(m.kcal ?? proteina * 4 + carbohidratos * 4 + grasas * 9), proteina, carbohidratos, grasas };
}

/** Con porcentajes de las kcal. Si no suman 100, se toman en proporción. */
export function macrosDePorcentajes(kcal: number, p: Omit<Macros, 'kcal'>): Macros {
  const suma = p.proteina + p.carbohidratos + p.grasas;
  if (suma <= 0) return { kcal, proteina: 0, carbohidratos: 0, grasas: 0 };
  const parte = (porcentaje: number, kcalPorGramo: number) => Math.round((kcal * porcentaje) / suma / kcalPorGramo);
  return { kcal, proteina: parte(p.proteina, 4), carbohidratos: parte(p.carbohidratos, 4), grasas: parte(p.grasas, 9) };
}

/**
 * Repartir la semana, como el «calorie shifting» de MacroFactor: los días altos suben `extra` kcal
 * y los otros bajan lo mismo entre todos, así la semana suma igual. La proteína y las grasas no se
 * mueven: se mueven los carbohidratos. Si un día bajo quedara por debajo del piso o sin
 * carbohidratos, se reparte menos.
 */
export function repartirSemana(meta: Macros, altos: readonly DiaSemana[], extra: number, sexo: Sexo): Record<DiaSemana, Macros> {
  const dias: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
  const cuantos = new Set(altos).size;
  const igual = Object.fromEntries(dias.map((d) => [d, { ...meta }])) as Record<DiaSemana, Macros>;
  if (cuantos === 0 || cuantos === 7 || extra <= 0) return igual;
  const maximoQueBaja = Math.max(0, Math.min(meta.kcal - PISOS[sexo], meta.carbohidratos * 4));
  const baja = Math.min((extra * cuantos) / (7 - cuantos), maximoQueBaja);
  const sube = (baja * (7 - cuantos)) / cuantos;
  const con = (cambio: number): Macros => ({ ...meta, kcal: Math.round(meta.kcal + cambio), carbohidratos: Math.max(0, Math.round(meta.carbohidratos + cambio / 4)) });
  return Object.fromEntries(dias.map((d) => [d, altos.includes(d) ? con(sube) : con(-baja)])) as Record<DiaSemana, Macros>;
}

/** La meta de un día de la semana: la guardada o, si se reparte la semana, la que le toca. */
export const metaRepartida = (meta: Macros, perfil: Pick<Perfil, 'semana' | 'sexo'> | null, dia: DiaSemana): Macros =>
  perfil?.semana ? repartirSemana(meta, perfil.semana.altos, perfil.semana.extra, perfil.sexo)[dia] : meta;

/** Lo que muestra el final del cuestionario: el gasto estimado y la meta de arranque. */
export function metasIniciales(c: Cuestionario): { gasto: number; metas: Macros } {
  const gasto = gastoBasal(c) * NIVELES[c.actividad];
  return { gasto: aDiez(gasto), metas: metaPara(gasto, c) };
}
