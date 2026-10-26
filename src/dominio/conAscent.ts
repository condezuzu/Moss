// Lo que Moss arma con lo que llega de Ascent por el vínculo (spec/ascent.md, «Cada función
// conectada»), para las cuentas de entrenamiento.ts, rendimiento.ts y musculos.ts: las sesiones con
// sus ejercicios, la meta del día (calorías según el día y proteína después de entrenar), la carga
// para la recuperación, el ejercicio estancado y las semanas para «Por qué no subes», el peso único,
// el gimnasio de hoy y tu año. Las formas son las de src/lib/ascentRemoto.ts, sin importarlo: el
// dominio no sabe de dónde llegan.

import type { Peso } from './control';
import {
  caloriasSegunElDia, costoDeSesion, frecuenciaPorDia, metaConEntrenamiento, promedioDeSesiones, proteinaDespuesDeEntrenar, semanaDeMoss,
  SEMANAS_DE_HISTORIA, sesionesAnteriores, tamanoDeSesion, type DiaConEntrenamiento, type SemanaDeMoss, type Sesion,
} from './entrenamiento';
import { diasEntre, lunesDe, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import type { Macros, Sexo } from './metas';
import { musculosDe, type GrupoDeAscent, type Musculo, type SesionConBloques } from './musculos';

export type SerieDeAscent = { kilos: number | null; reps: number | null };
export type EjercicioDeAscent = { nombre: string; musculos: string[]; series: SerieDeAscent[] };
/** Un día de gimnasio en Ascent; sin cronómetro llega con 0 series, 0 kilos, 0 minutos y sin ejercicios. */
export type SesionDeAscent = Sesion & { ejercicios: EjercicioDeAscent[]; inicio?: string };
export type MarcaDeAscent = { ejercicio: string; fecha: ClaveDia; kilos: number; reps: number };
export type PesoCompartido = { fecha: ClaveDia; kg: number; de: 'moss' | 'ascent' };

const GRUPOS: readonly GrupoDeAscent[] = ['pecho', 'espalda', 'hombros', 'brazos', 'piernas', 'core', 'cardio'];
const GRUPO_DEL_MUSCULO: Record<Musculo, GrupoDeAscent> = {
  cuadriceps: 'piernas', gluteos: 'piernas', isquios: 'piernas', aductores: 'piernas', pantorrillas: 'piernas', espaldaBaja: 'piernas',
  espaldaAlta: 'espalda', pecho: 'pecho', hombros: 'hombros', biceps: 'brazos', triceps: 'brazos', antebrazos: 'brazos', abdomen: 'core',
};

/** El grupo de Ascent de un ejercicio: el que trae (uno solo) o, si no, el de su músculo principal. */
export function grupoDe(e: Pick<EjercicioDeAscent, 'nombre' | 'musculos'>): GrupoDeAscent | undefined {
  const dicho = e.musculos.map((m) => m.toLowerCase()).find((m): m is GrupoDeAscent => (GRUPOS as readonly string[]).includes(m));
  if (dicho) return dicho;
  const m = musculosDe(e.nombre);
  return m ? GRUPO_DEL_MUSCULO[m.principal[0]] : undefined;
}

/** Los grupos de una sesión, del que tuvo más series al que menos: con eso se nombra («Piernas»). */
export function gruposDeLaSesion(s: Pick<SesionDeAscent, 'ejercicios'>): GrupoDeAscent[] {
  const series = new Map<GrupoDeAscent, number>();
  for (const e of s.ejercicios) {
    const g = grupoDe(e);
    if (g) series.set(g, (series.get(g) ?? 0) + Math.max(1, e.series.length));
  }
  return [...series].sort((a, b) => b[1] - a[1]).map(([g]) => g);
}

/** Si el día se anotó sin cronómetro: se fue al gimnasio, pero no se sabe más. */
export const sinDetalle = (s: Pick<Sesion, 'series' | 'minutos'>) => s.series === 0 && s.minutos === 0;

/**
 * Las sesiones con sus ejercicios, como las usa musculos.ts. `inicioDe` dice cuándo empezó cada
 * una, en milisegundos (Ascent la manda si se cronometró; si no, quien llama supone una hora). Los
 * kilos que faltan (con el peso del cuerpo) cuentan 0: la serie igual suma esfuerzo.
 */
export function sesionesConBloques(sesiones: readonly SesionDeAscent[], inicioDe: (s: SesionDeAscent) => number): (SesionConBloques & { fecha: ClaveDia })[] {
  return sesiones.filter((s) => s.ejercicios.length).map((s) => ({
    fecha: s.fecha,
    inicio: inicioDe(s),
    bloques: s.ejercicios.map((e) => ({ ejercicio: e.nombre, grupo: grupoDe(e), series: e.series.map((x) => ({ peso: x.kilos ?? 0, reps: x.reps })) })),
  }));
}

/** Las sesiones de un día, juntas: Ascent puede anotar dos el mismo día. */
function delDia(sesiones: readonly Sesion[], dia: ClaveDia): Sesion | null {
  const lista = sesiones.filter((s) => s.fecha === dia);
  if (!lista.length) return null;
  return lista.reduce((a, b) => ({ fecha: dia, series: a.series + b.series, kilos: a.kilos + b.kilos, minutos: a.minutos + b.minutos }));
}

/** Si Ascent dice que ese día se entrenó: el gimnasio automático se enciende. */
export const entrenoEl = (sesiones: readonly Pick<Sesion, 'fecha'>[], dia: ClaveDia) => sesiones.some((s) => s.fecha === dia);

/** Los días de la semana que se suele entrenar (la mitad de las 4 semanas anteriores o más). */
export function diasDeEntrenar(sesiones: readonly Sesion[], hoy: ClaveDia): DiaSemana[] {
  const f = frecuenciaPorDia(sesiones, sumarDias(hoy, 1));
  return ([0, 1, 2, 3, 4, 5, 6] as DiaSemana[]).filter((d) => f[d] >= 0.5);
}

// ------------------------------------------------------------ la meta del día

export type MetaConAscent = {
  /** La semana del control, de su día a los 6 siguientes: lo que ya pasó, hoy y lo que se espera. */
  semana: DiaConEntrenamiento[];
  dia: DiaConEntrenamiento;
  /** La sesión de ese día (juntas, si fueron dos), o null. */
  sesion: Sesion | null;
  costo: number;
  /** El tamaño de la sesión contra las de siempre (1 es una de las de siempre). */
  tamano: number;
  /** La proteína que suma la sesión, en gramos. */
  extra: number;
  /** Un día de gimnasio y uno de descanso de esta semana, y lo que suma la semana. */
  gimnasio: number;
  descanso: number;
  total: number;
  /** La meta del día con todo. */
  meta: Macros;
};

/**
 * La meta de un día con Ascent (spec/ascent.md, funciones 5 y 8): las calorías según el día de la
 * semana del control (que empieza en `inicio`) y, si ese día entrenó, la proteína de la sesión, que
 * sale de los carbohidratos. Para el costo y el tamaño, las sesiones sin cronómetro no cuentan: no
 * se sabe cuánto duraron. Si el día no es de esa semana, null.
 */
export function metaDelDiaConAscent(p: { meta: Macros; inicio: ClaveDia; dia: ClaveDia; hoy: ClaveDia; sesiones: readonly Sesion[]; pesoKg: number; sexo: Sexo }): MetaConAscent | null {
  const i = diasEntre(p.inicio, p.dia);
  if (i < 0 || i > 6) return null;
  const medidas = p.sesiones.filter((s) => !sinDetalle(s));
  const promedio = promedioDeSesiones(sesionesAnteriores(medidas, p.inicio));
  const costo = costoDeSesion(p.pesoKg, promedio?.minutos ?? 60);
  const semana = caloriasSegunElDia({ meta: p.meta, inicio: p.inicio, hoy: p.hoy, sesiones: p.sesiones, frecuencia: frecuenciaPorDia(p.sesiones, p.inicio), costo, sexo: p.sexo });
  const dia = semana[i];
  const sesion = dia.fecha <= p.hoy ? delDia(p.sesiones, dia.fecha) : null;
  const tamano = sesion && !sinDetalle(sesion) ? tamanoDeSesion(sesion, promedio) : 1;
  const extra = sesion ? proteinaDespuesDeEntrenar({ tamano, pesoKg: p.pesoKg, proteina: dia.meta.proteina }) : 0;
  const descansos = semana.filter((d) => d.entrena === false);
  const gimnasios = semana.filter((d) => d.entrena !== false);
  return {
    semana, dia, sesion, costo, tamano, extra,
    gimnasio: dia.entrena ? dia.meta.kcal : gimnasios.length ? Math.max(...gimnasios.map((d) => d.meta.kcal)) : dia.meta.kcal + costo,
    descanso: descansos.length ? descansos[descansos.length - 1].meta.kcal : dia.meta.kcal - (dia.entrena ? costo : 0),
    total: semana.reduce((t, d) => t + d.meta.kcal, 0),
    meta: metaConEntrenamiento(dia, extra),
  };
}

// ------------------------------------------------------------ la carga, para la recuperación

/**
 * Lo de Ascent para la recuperación de un día (entrenamiento.ts, recuperacion): el peso movido de
 * los 3 días anteriores, cuántos de esos venía entrenando seguidos y el promedio por día de las 4
 * semanas anteriores a esos tres.
 */
export function cargaAntesDe(sesiones: readonly Sesion[], dia: ClaveDia): { kilos3: number; kilosPorDia: number; seguidos: number } {
  const anteriores = [1, 2, 3].map((k) => delDia(sesiones, sumarDias(dia, -k)));
  let seguidos = 0;
  while (seguidos < anteriores.length && anteriores[seguidos]) seguidos++;
  const historia = sesionesAnteriores(sesiones, sumarDias(dia, -3));
  return {
    kilos3: anteriores.reduce((s, x) => s + (x ? x.kilos : 0), 0),
    kilosPorDia: historia.reduce((s, x) => s + x.kilos, 0) / (7 * SEMANAS_DE_HISTORIA),
    seguidos,
  };
}

// ------------------------------------------------------------ por qué no subes

/** Ascent avisa desde 3 semanas sin subir; con menos de 3 marcas no hay tendencia, hay puntos. */
export const SEMANAS_SIN_SUBIR = 3;
export const MARCAS_MINIMAS = 3;

/** El 1RM de una marca como lo cuenta Ascent (Epley; con una repetición, el peso). */
export const unRm = (m: Pick<MarcaDeAscent, 'kilos' | 'reps'>) => (m.reps <= 1 ? m.kilos : m.kilos * (1 + m.reps / 30));

export type Estancado = { ejercicio: string; semanas: number; mejor: MarcaDeAscent };

const semanasEntre = (desde: ClaveDia, hasta: ClaveDia) => Math.floor(diasEntre(desde, hasta) / 7);

/**
 * El ejercicio estancado, como lo detecta Ascent (nucleo/estancamiento.ts, «la marca quieta»): con 3
 * marcas o más, la mejor tiene 3 semanas o más y después hubo al menos otra (se siguió intentando y
 * no subió). Si hace 3 semanas que no aparece, no está estancado: se dejó. Con varios, el que lleva
 * más tiempo así.
 */
export function estancamiento(marcas: readonly MarcaDeAscent[], hoy: ClaveDia): Estancado | null {
  const porEjercicio = new Map<string, MarcaDeAscent[]>();
  for (const m of marcas) porEjercicio.set(m.ejercicio, [...(porEjercicio.get(m.ejercicio) ?? []), m]);
  let peor: Estancado | null = null;
  for (const [ejercicio, suyas] of porEjercicio) {
    if (suyas.length < MARCAS_MINIMAS) continue;
    const ordenadas = [...suyas].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (semanasEntre(ordenadas[ordenadas.length - 1].fecha, hoy) >= SEMANAS_SIN_SUBIR) continue;
    const mejor = ordenadas.reduce((a, b) => (unRm(b) > unRm(a) ? b : a));
    const semanas = semanasEntre(mejor.fecha, hoy);
    if (semanas < SEMANAS_SIN_SUBIR || !ordenadas.some((m) => m.fecha > mejor.fecha)) continue;
    if (!peor || semanas > peor.semanas) peor = { ejercicio, semanas, mejor };
  }
  return peor;
}

/**
 * Las semanas para comparar, de lunes a domingo: las del estancamiento (desde la siguiente a la de la
 * mejor marca hasta esta) y las de antes en que alguna marca subió, es decir, le ganó a la mejor que
 * había de su ejercicio. Las de antes de `desde` (sin datos de Moss) no se miran.
 */
export function semanasParaComparar(marcas: readonly MarcaDeAscent[], estancado: Estancado, hoy: ClaveDia, desde: ClaveDia): { con: ClaveDia[]; sin: ClaveDia[] } {
  const inicioSin = sumarDias(lunesDe(estancado.mejor.fecha), 7);
  const sin: ClaveDia[] = [];
  for (let l = inicioSin; l <= lunesDe(hoy); l = sumarDias(l, 7)) sin.push(l);
  const mejores = new Map<string, number>();
  const con = new Set<ClaveDia>();
  for (const m of [...marcas].sort((a, b) => (a.fecha < b.fecha ? -1 : 1))) {
    const antes = mejores.get(m.ejercicio);
    if (antes === undefined || unRm(m) > antes) mejores.set(m.ejercicio, unRm(m));
    if (antes === undefined || unRm(m) <= antes) continue;
    const lunes = lunesDe(m.fecha);
    if (lunes < inicioSin && lunes >= lunesDe(desde)) con.add(lunes);
  }
  return { con: [...con].sort(), sin };
}

/** Lo de Moss de la semana que empieza ese lunes: lo dormido cada noche y lo comido cada día. */
export function semanaDesde(lunes: ClaveDia, noches: ReadonlyMap<ClaveDia, number>, comidas: ReadonlyMap<ClaveDia, { kcal: number; proteina: number }>, gasto: number): SemanaDeMoss {
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  return semanaDeMoss(
    dias.flatMap((d) => (noches.has(d) ? [noches.get(d)!] : [])),
    dias.flatMap((d) => (comidas.has(d) ? [comidas.get(d)!] : [])),
    gasto,
  );
}

// ------------------------------------------------------------ el peso único

/**
 * El peso de las dos apps (spec/ascent.md, función 4): los de Moss y, los días que Moss no tiene,
 * los de Ascent. Ascent no guarda la hora de su peso, así que el mismo día gana el de Moss, como en
 * el servidor. No se copia nada: es solo para mirar.
 */
export function pesoUnico(propios: readonly Peso[], compartidos: readonly PesoCompartido[]): Peso[] {
  const porDia = new Map<ClaveDia, Peso>(propios.map((p) => [p.fecha, p]));
  for (const c of compartidos) {
    if (c.de !== 'ascent' || porDia.has(c.fecha) || !(c.kg >= 20 && c.kg <= 400)) continue;
    porDia.set(c.fecha, { fecha: c.fecha, kg: c.kg, origen: 'ascent', momento: `${c.fecha}T12:00:00.000Z` });
  }
  return [...porDia.values()].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

// ------------------------------------------------------------ tu año

export type TuAnio = { entrenamientos: number; marcas: number; diasConHabitos: number; sueno: number | null; diasConComida: number };

/**
 * Lo de las dos apps en un año: los días de gimnasio y las marcas de Ascent, y de Moss los días con
 * algún hábito hecho, lo dormido en promedio y los días con algo de comida anotado.
 */
export function tuAnio(p: {
  anio: number;
  sesiones: readonly Pick<Sesion, 'fecha'>[];
  marcas: readonly MarcaDeAscent[];
  dias: Iterable<{ clave: ClaveDia; hechos: readonly string[] }>;
  noches: ReadonlyMap<ClaveDia, number>;
  diasConComida: Iterable<ClaveDia>;
}): TuAnio {
  const delAnio = (f: ClaveDia) => f.startsWith(`${p.anio}-`);
  const marcas = new Set(p.marcas.filter((m) => delAnio(m.fecha)).map((m) => `${m.ejercicio}|${m.fecha}|${m.kilos}|${m.reps}`));
  const noches = [...p.noches].filter(([f]) => delAnio(f)).map(([, m]) => m);
  let diasConHabitos = 0;
  for (const d of p.dias) if (delAnio(d.clave) && d.hechos.length) diasConHabitos++;
  return {
    entrenamientos: new Set(p.sesiones.filter((s) => delAnio(s.fecha)).map((s) => s.fecha)).size,
    marcas: marcas.size,
    diasConHabitos,
    sueno: noches.length ? noches.reduce((s, m) => s + m, 0) / noches.length : null,
    diasConComida: new Set([...p.diasConComida].filter(delAnio)).size,
  };
}

/** Desde qué semana del año (lunes) hay sesiones para mirar, para no pedir de más. */
export const primerDiaQueHaceFalta = (hoy: ClaveDia, dias: number) => {
  const anio = `${hoy.slice(0, 4)}-01-01`;
  const atras = sumarDias(hoy, -dias);
  return anio < atras ? anio : atras;
};
