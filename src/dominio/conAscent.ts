// Lo que Moss arma con lo que llega de Ascent por el vínculo (spec/ascent.md, «Cada función
// conectada»), para las cuentas de entrenamiento.ts, rendimiento.ts y musculos.ts: las sesiones con
// sus ejercicios, la meta del día (calorías según el día y proteína después de entrenar), la carga
// para la recuperación, el ejercicio estancado y las semanas para «Por qué no subes», el peso único,
// el gimnasio de hoy y tu año. Las formas son las de src/lib/ascentRemoto.ts, sin importarlo: el
// dominio no sabe de dónde llegan.

import { ultimoDiaDeControl, type Peso } from './control';
import {
  caloriasSegunElDia, costoDeSesion, frecuenciaPorDia, metaConEntrenamiento, promedioDeSesiones, proteinaDespuesDeEntrenar, semanaDeMoss,
  SEMANAS_DE_HISTORIA, sesionesAnteriores, tamanoDeSesion, type DiaConEntrenamiento, type SemanaDeMoss, type Sesion,
} from './entrenamiento';
import { diaDeLaSemana, diasEntre, lunesDe, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import type { Macros, Sexo } from './metas';
import { claveDelEjercicio, grupoDelEjercicio, unRmDeAscent, type Bloque, type Carga, type GrupoDeAscent, type SesionConBloques } from './musculos';

/** `rir`: las repeticiones que quedaban, si se anotaron en Ascent («al fallo» es 0). */
export type SerieDeAscent = { kilos: number | null; reps: number | null; rir?: number | null };
/** Un ejercicio de una sesión: el nombre de Ascent, su grupo (uno solo), sus series y su id ('sentadilla', o 'propio_…'). */
/** `carga`: cómo se anotó ese día; null si el bloque no la trae, y falta mientras la base no la manda (0020). */
export type EjercicioDeAscent = { nombre: string; musculos: string[]; series: SerieDeAscent[]; id?: string; copiada?: true; carga?: Carga | null };
/** Un día de gimnasio en Ascent; sin cronómetro llega con 0 series, 0 kilos, 0 minutos y sin ejercicios. */
export type SesionDeAscent = Sesion & { ejercicios: EjercicioDeAscent[]; inicio?: string };
export type MarcaDeAscent = { ejercicio: string; fecha: ClaveDia; kilos: number; reps: number; id?: string };
export type PesoCompartido = { fecha: ClaveDia; kg: number; de: 'moss' | 'ascent' };

const GRUPOS: readonly GrupoDeAscent[] = ['pecho', 'espalda', 'hombros', 'brazos', 'piernas', 'core', 'cardio'];

/** El grupo de Ascent de un ejercicio: el que trae (uno solo) o, si no, el del catálogo por su id. */
export function grupoDe(e: Pick<EjercicioDeAscent, 'musculos' | 'id'>): GrupoDeAscent | undefined {
  const dicho = e.musculos.map((m) => m.toLowerCase()).find((m): m is GrupoDeAscent => (GRUPOS as readonly string[]).includes(m));
  return dicho ?? grupoDelEjercicio({ id: e.id });
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

// ------------------------------------------------------------ la rutina y los ajustes de Ascent

/** Un ejercicio de la rutina de Ascent: lo que dice la rutina, sin pesos (salen de la última vez, como en Ascent). */
export type EjercicioDeLaRutina = { id: string; nombre: string; musculos: string[]; series: number; minutos?: number; reps?: number };
/** Un día de la rutina: 0 es el domingo, como en Ascent. Uno de descanso no tiene ejercicios. */
export type DiaDeLaRutina = { dia: DiaSemana; descanso: boolean; ejercicios: EjercicioDeLaRutina[] };
/** La rutina activa de Ascent: su nombre y los días de la semana. */
export type RutinaDeAscent = { nombre: string; dias: DiaDeLaRutina[] };
/** De los Ajustes y el perfil de Ascent: el umbral de estancamiento (semanas sin marca) y la racha, de la que sale el rango. */
export type AjustesDeAscent = { umbral: number; racha: number };

/** Los umbrales de estancamiento que se eligen en Ascent. */
const UMBRALES = [2, 3, 6, 8];

type Objeto = Record<string, unknown>;
const esObjeto = (x: unknown): x is Objeto => typeof x === 'object' && x !== null && !Array.isArray(x);
const natural = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? Math.round(x) : null);

/** La rutina como llega (del servidor o de lo guardado), o null si no se entiende. */
export function leerRutinaDeAscent(x: unknown): RutinaDeAscent | null {
  if (!esObjeto(x) || typeof x.nombre !== 'string' || !Array.isArray(x.dias)) return null;
  const dias = x.dias.filter(esObjeto).flatMap((d): DiaDeLaRutina[] => {
    const dia = natural(d.dia);
    if (dia === null || dia > 6) return [];
    const descanso = d.descanso === true;
    const ejercicios = descanso || !Array.isArray(d.ejercicios) ? [] : d.ejercicios.filter(esObjeto).flatMap((e): EjercicioDeLaRutina[] => {
      const series = natural(e.series), minutos = natural(e.minutos), reps = natural(e.reps);
      if (typeof e.id !== 'string' || !e.id || series === null) return [];
      return [{
        id: e.id,
        nombre: typeof e.nombre === 'string' && e.nombre ? e.nombre : e.id,
        musculos: Array.isArray(e.musculos) ? e.musculos.filter((m): m is string => typeof m === 'string') : [],
        series,
        ...(minutos !== null ? { minutos } : {}),
        ...(reps ? { reps } : {}),
      }];
    });
    return [{ dia: dia as DiaSemana, descanso, ejercicios }];
  });
  return { nombre: x.nombre, dias };
}

/** Los ajustes como llegan, o null si no se entienden. Un umbral que Ascent no ofrece queda en null. */
export function leerAjustesDeAscent(x: unknown): AjustesDeAscent | null {
  if (!esObjeto(x)) return null;
  const umbral = natural(x.umbral), racha = natural(x.racha);
  return umbral !== null && UMBRALES.includes(umbral) && racha !== null ? { umbral, racha } : null;
}

/** Los días de la semana que la rutina dice de entrenar: los que no son de descanso y tienen ejercicios. */
export const diasDeLaRutina = (r: RutinaDeAscent): DiaSemana[] => r.dias.filter((d) => !d.descanso && d.ejercicios.length).map((d) => d.dia);

/** Los grupos de un día de la rutina, del que tiene más series al que menos: con eso se nombra, como una sesión. */
export function gruposDelDia(d: Pick<DiaDeLaRutina, 'ejercicios'>): GrupoDeAscent[] {
  const series = new Map<GrupoDeAscent, number>();
  for (const e of d.ejercicios) {
    const g = grupoDe(e);
    if (g) series.set(g, (series.get(g) ?? 0) + Math.max(1, e.series));
  }
  return [...series].sort((a, b) => b[1] - a[1]).map(([g]) => g);
}

/**
 * La sesión que toca según la rutina, como la arma Ascent: los ejercicios y las series de la rutina, con el peso y
 * las repeticiones de la última vez que se hizo cada uno (las repeticiones objetivo, si la rutina las tiene). Lo que
 * nunca se hizo, sin peso. Lo que se mide en minutos (el cardio) no lleva series.
 */
export function bloquesDeLaRutina(dia: Pick<DiaDeLaRutina, 'ejercicios'>, previas: readonly SesionConBloques[]): Bloque[] {
  return dia.ejercicios.filter((e) => e.series > 0).map((e) => {
    let ultima: Bloque | undefined;
    for (let i = previas.length - 1; i >= 0 && !ultima; i--) ultima = [...previas[i].bloques].reverse().find((b) => claveDelEjercicio(b) === e.id && b.series.length);
    const series = Array.from({ length: e.series }, (_, i) => {
      const s = ultima?.series[Math.min(i, ultima.series.length - 1)];
      return { peso: s?.peso ?? 0, reps: e.reps ?? s?.reps ?? null };
    });
    return { ejercicio: e.nombre, id: e.id, grupo: grupoDe(e), series };
  });
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
    bloques: s.ejercicios.map((e) => ({ ejercicio: e.nombre, ...(e.id ? { id: e.id } : {}), grupo: grupoDe(e), series: e.series.map((x) => ({ peso: x.kilos ?? 0, reps: x.reps, ...(x.rir != null ? { rir: x.rir } : {}) })), ...(e.copiada ? { copiada: true } : {}), ...(e.carga ? { carga: e.carga } : {}) })),
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

/** Lo de Ascent que mueve la meta de cada día, con el vínculo: desde qué día llegaron sus sesiones, y ellas. */
export type GimnasioDeAscent = { desde: ClaveDia; sesiones: readonly Sesion[] };

/**
 * La meta de un día con Ascent vinculada (spec/ascent.md, funciones 5 y 8), la que se ve en Inicio y en Comida y contra la
 * que se encienden las estrellas de la comida: las calorías según el día de la semana del control y la proteína de la
 * sesión. Reemplaza al reparto de la semana a mano (`base`): con Ascent, los días altos son los de gimnasio. Sin vínculo
 * (`gimnasio` null), sin sesiones en las 4 semanas antes de la del control, sin datos de esa semana o sin peso, `base`.
 */
export function metaConAscentDe(
  base: Macros,
  e: { metas: readonly (Macros & { desde: ClaveDia })[]; perfil: { diaDelControl?: DiaSemana; sexo: Sexo } | null; pesos: readonly { kg: number }[]; hoy: ClaveDia },
  dia: ClaveDia,
  gimnasio: GimnasioDeAscent | null,
): Macros {
  if (!gimnasio || !e.perfil || !e.metas.length) return base;
  const inicio = ultimoDiaDeControl(dia, e.perfil.diaDelControl ?? diaDeLaSemana(e.metas[0].desde));
  if (inicio < gimnasio.desde || !gimnasio.sesiones.some((s) => s.fecha >= sumarDias(inicio, -28) && s.fecha <= sumarDias(inicio, 6))) return base;
  // La meta que vale ese día, sin repartir (como metaVigente, en el almacén): la última que empezó hasta ese día.
  const vigente = e.metas.filter((m) => m.desde <= dia).at(-1);
  const pesoKg = e.pesos.at(-1)?.kg;
  if (!vigente || pesoKg === undefined) return base;
  const meta = { kcal: vigente.kcal, proteina: vigente.proteina, carbohidratos: vigente.carbohidratos, grasas: vigente.grasas };
  return metaDelDiaConAscent({ meta, inicio, dia, hoy: e.hoy, sesiones: gimnasio.sesiones, pesoKg, sexo: e.perfil.sexo })?.meta ?? base;
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

/**
 * El umbral de fábrica de Ascent: 6 semanas sin subir (sus Ajustes dejan elegir 2, 3, 6 u 8). Antes eran 3:
 * con el ruido de cada día, a quien sube un 1 % por mes le decía «estancado» el 63 % de las veces; con 6, el
 * 38 %. Con menos de 3 marcas no hay tendencia, hay puntos.
 */
export const SEMANAS_SIN_SUBIR = 6;
export const MARCAS_MINIMAS = 3;

/** El 1RM de una marca como lo cuenta Ascent (Epley; con una repetición, el peso). */
export const unRm = (m: Pick<MarcaDeAscent, 'kilos' | 'reps'>) => unRmDeAscent(m);

export type Estancado = { ejercicio: string; semanas: number; mejor: MarcaDeAscent };

const semanasEntre = (desde: ClaveDia, hasta: ClaveDia) => Math.floor(diasEntre(desde, hasta) / 7);

/**
 * El ejercicio estancado, como lo detecta Ascent (nucleo/estancamiento.ts, «la marca quieta»): con 3
 * marcas o más, la mejor tiene el umbral de semanas o más (6 de fábrica) y después hubo al menos otra (se
 * siguió intentando y no subió). Si hace ese tiempo que no aparece, no está estancado: se dejó. Con
 * varios, el que lleva más tiempo así.
 */
export function estancamiento(marcas: readonly MarcaDeAscent[], hoy: ClaveDia, umbral = SEMANAS_SIN_SUBIR): Estancado | null {
  const porEjercicio = new Map<string, MarcaDeAscent[]>();
  for (const m of marcas) porEjercicio.set(m.ejercicio, [...(porEjercicio.get(m.ejercicio) ?? []), m]);
  let peor: Estancado | null = null;
  for (const [ejercicio, suyas] of porEjercicio) {
    if (suyas.length < MARCAS_MINIMAS) continue;
    const ordenadas = [...suyas].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
    if (semanasEntre(ordenadas[ordenadas.length - 1].fecha, hoy) >= umbral) continue;
    const mejor = ordenadas.reduce((a, b) => (unRm(b) > unRm(a) ? b : a));
    const semanas = semanasEntre(mejor.fecha, hoy);
    if (semanas < umbral || !ordenadas.some((m) => m.fecha > mejor.fecha)) continue;
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

// ------------------------------------------------------------ cuánto hace que no comes

/**
 * Las horas desde lo último anotado antes de un momento (los momentos de los registros, en ISO), mirando las
 * 24 horas de antes: sin nada anotado en ese tiempo, null (no se sabe, y no se supone que no comiste).
 */
export function horasSinComer(momentos: readonly string[], en: number): number | null {
  const antes = momentos.map((m) => Date.parse(m)).filter((t) => Number.isFinite(t) && t <= en && t > en - 24 * 3_600_000);
  return antes.length ? (en - Math.max(...antes)) / 3_600_000 : null;
}

// ------------------------------------------------------------ cuánto hace que entrenas

/** Desde las 26 semanas (6 meses) entrenando, el ruido es el de los entrenados (Grgic 2020) y la recuperación también (Newton 2008; Nosaka 2001). */
export const SEMANAS_PARA_ENTRENADO = 26;

/**
 * Si entrena hace 6 meses o más, con lo que llegó de Ascent: la primera sesión o la marca más vieja (de cada
 * ejercicio llega la mejor de siempre, aunque sea de antes de las sesiones que se piden). Sin nada, no.
 */
export function entrenadoSegunAscent(sesiones: readonly Pick<Sesion, 'fecha'>[], marcas: readonly Pick<MarcaDeAscent, 'fecha'>[], hoy: ClaveDia): boolean {
  const fechas = [...sesiones.map((s) => s.fecha), ...marcas.map((m) => m.fecha)].sort();
  return fechas.length > 0 && diasEntre(fechas[0], hoy) >= 7 * SEMANAS_PARA_ENTRENADO;
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
