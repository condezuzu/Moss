// El cuestionario nuevo de la entrada (lo pediste el 2/11/2026: «las preguntas típicas que te hace
// MacroFactor»), para aprobar en la galería: lo que se contesta y lo que sale de ahí. El gasto se arma
// por partes, como en MacroFactor: el de reposo (con la grasa, por la masa magra), la vida diaria sin el
// entrenamiento y el entrenamiento aparte. Cada pregunta, por qué y sus fuentes, en spec/nutricion.md
// («El cuestionario nuevo»). La app todavía usa metasIniciales (metas.ts).

import type { Comida } from './comidas';
import { MET_DE_LA_SESION, MET_EN_REPOSO } from './entrenamiento';
import { SEMANA, type DiaSemana } from './fechas';
import { ajusteDiario, gastoBasal, KCAL_POR_KG, macrosConProteina, MAYORIA_DE_EDAD, NIVELES, pesoMinimoSano, pisoDe, RANGOS_DEL_CUESTIONARIO, RITMOS, ritmoPermitido, type Actividad, type Estilo, type Macros, type Objetivo, type Ritmo, type Sexo } from './metas';

const aDiez = (n: number) => Math.round(n / 10) * 10;
const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------ la grasa
/** Cómo la supo: la dijo (de una balanza o un estudio), eligió una figura o la midió con cinta. */
export type ComoSeSupo = 'dicha' | 'imagen' | 'cinta';
export type GrasaDicha = { como: ComoSeSupo; pct: number };

/** Fuera de esto, la grasa dicha no se usa: es un error al tipearla o de la balanza. */
export const RANGO_DE_GRASA: Record<Sexo, readonly [number, number]> = { m: [3, 60], f: [8, 65] };

/**
 * Las nueve figuras para elegir, de menos a más grasa, con el rango de cada una: como la grilla de
 * MacroFactor, dibujadas y no fotos. Se usa el medio del rango.
 */
export const FIGURAS: Record<Sexo, readonly (readonly [number, number])[]> = {
  m: [[6, 9], [10, 13], [14, 17], [18, 21], [22, 25], [26, 29], [30, 34], [35, 39], [40, 45]],
  f: [[12, 15], [16, 19], [20, 23], [24, 27], [28, 31], [32, 35], [36, 39], [40, 44], [45, 50]],
};
export function grasaDeFigura(sexo: Sexo, i: number): number {
  const [desde, hasta] = FIGURAS[sexo][limitar(Math.round(i), 0, FIGURAS[sexo].length - 1)];
  return (desde + hasta) / 2;
}

/**
 * La grasa se usa desde los 18 y sin cuidados: las fórmulas por masa magra son de adultos, y con
 * embarazo, lactancia o una condición médica Moss no la pregunta.
 */
export function usaGrasa(r: { edad: number; sexo: Sexo; sinDeficit?: boolean; grasa?: GrasaDicha | null }): boolean {
  const g = r.grasa;
  if (!g || r.sinDeficit || r.edad < MAYORIA_DE_EDAD) return false;
  const [desde, hasta] = RANGO_DE_GRASA[r.sexo];
  return Number.isFinite(g.pct) && g.pct >= desde && g.pct <= hasta;
}

export const masaMagra = (pesoKg: number, grasaPct: number) => pesoKg * (1 - grasaPct / 100);

/** Katch-McArdle: el gasto en reposo por la masa magra, en kcal por día. */
export const katchMcArdle = (masaMagraKg: number) => 370 + 21.6 * masaMagraKg;

// ------------------------------------------------------------ la vida diaria y el entrenamiento
/** Fuera del entrenamiento: casi todo el día sentado, de pie o caminando parte del día, o un trabajo físico. */
export type Movimiento = 'sentado' | 'dePie' | 'fisico';
export const MOVIMIENTOS: readonly Movimiento[] = ['sentado', 'dePie', 'fisico'];

/**
 * Lo que la vida diaria multiplica el gasto en reposo, sin el entrenamiento (va aparte). Son las
 * categorías del IOM (2005): la vida de todos los días sola llega a 1,39; con un rato de caminar, de 1,4
 * a 1,59, y con un trabajo de esfuerzo, de 1,6 a 1,89. Sentado es el «poco» de siempre.
 */
export const FACTORES_DE_VIDA: Record<Movimiento, number> = { sentado: NIVELES.poco, dePie: 1.5, fisico: 1.7 };

/**
 * Los pasos de Salud sugieren la respuesta (Tudor-Locke y Bassett, 2004): menos de 5.000 por día es
 * sedentario y más de 10.000, activo. Los pasos de correr también cuentan: es una sugerencia.
 */
export const PASOS_SENTADO = 5000;
export const PASOS_MUCHO = 10000;
export function movimientoPorPasos(pasosPorDia: number | null | undefined): Movimiento | null {
  if (pasosPorDia == null || !(pasosPorDia > 0)) return null;
  return pasosPorDia < PASOS_SENTADO ? 'sentado' : pasosPorDia <= PASOS_MUCHO ? 'dePie' : 'fisico';
}

/**
 * Qué entrena, con ejemplos que se reconocen (lo pediste el 2/11/2026: no todo es proteína, carbohidratos
 * y grasas, y el deporte cambia los consejos): pesas o máquinas (también crossfit); partidos, que son
 * intermitentes (fútbol, básquetbol, hockey, vóley, tenis, pádel); correr, bici o nadar; choques o combate
 * (rugby, artes marciales, boxeo). Caminar o el yoga no son entrenar: van en la vida diaria. Se elige más
 * de uno, cada uno con sus días y su hora.
 */
export type Deporte = 'fuerza' | 'equipo' | 'resistencia' | 'contacto';
export const DEPORTES: readonly Deporte[] = ['fuerza', 'equipo', 'resistencia', 'contacto'];

/** Una sesión de la semana: qué deporte, qué días, a qué hora empieza (minutos desde la medianoche) y cuánto dura. */
export type SesionDicha = { tipo: Deporte; dias: DiaSemana[]; hora: number; minutos: number };

/**
 * Cómo entrena: los deportes (de ahí salen los consejos, spec/entreno.md), las sesiones de cada uno (un día
 * puede tener dos), cuánto tarda en llegar, si juega partidos o compite y qué día (con partidos o choques), y
 * si compite por categoría de peso (con combate). Sin entrenar, null.
 */
export type EntrenoDicho = {
  tipos: Deporte[];
  sesiones: SesionDicha[];
  viaje: number;
  partidos?: { dia: DiaSemana } | null;
  categoriaDePeso?: boolean | null;
};

/** Lo que se pregunta además: los partidos, con partidos o choques; la categoría de peso, con combate. */
export function preguntasDelEntreno(tipos: readonly Deporte[]): { partidos: boolean; categoriaDePeso: boolean } {
  return { partidos: tipos.includes('equipo') || tipos.includes('contacto'), categoriaDePeso: tipos.includes('contacto') };
}

/** El tipo del horario de Perfil › Entrenamiento (alrededorDelEntreno.ts), que hoy lleva uno solo. */
export type TipoDeEntreno = 'fuerza' | 'resistencia' | 'mixta';

/**
 * El tipo reducido, SOLO para el horario de los avisos de comer antes y después, que hoy lleva un tipo: solo
 * pesas es fuerza, solo correr, bici o nadar es resistencia, y lo demás, mixto. Los consejos no salen de acá
 * sino de `tipos` y de las sesiones de cada día: básquetbol con pesas no pide lo mismo que bici con pesas.
 */
export function tipoDeSesion(tipos: readonly Deporte[]): TipoDeEntreno | null {
  const unicos = new Set(tipos);
  if (unicos.size === 0) return null;
  if (unicos.size === 1 && unicos.has('fuerza')) return 'fuerza';
  if (unicos.size === 1 && unicos.has('resistencia')) return 'resistencia';
  return 'mixta';
}

/**
 * SOLO para el horario de los avisos (alrededorDelEntreno.ts), que hoy lleva un horario: los días de todas
 * las sesiones, la hora y la duración de la principal (la de más días; con empate, la primera) y el tipo
 * reducido. Cuando los avisos lean las sesiones de cada día (sesionesDeUnDia), esto sobra.
 */
export function horarioDeLosAvisos(e: Pick<EntrenoDicho, 'tipos' | 'sesiones'>): { tipo: TipoDeEntreno; dias: DiaSemana[]; hora: number; minutos: number } | null {
  const tipo = tipoDeSesion(e.tipos);
  if (!tipo || !e.sesiones.length) return null;
  const principal = e.sesiones.reduce((a, b) => (new Set(b.dias).size > new Set(a.dias).size ? b : a));
  const dias = SEMANA.filter((d) => e.sesiones.some((s) => s.dias.includes(d)));
  return { tipo, dias, hora: principal.hora, minutos: principal.minutos };
}

/**
 * «¿Cuánto tardas en llegar?»: en casa, menos de 15 minutos, de 15 a 30 y más de 30. Se guarda el borde
 * de arriba de cada tramo (y 45 para el último): lo de comer antes de entrenar llega con tiempo, nunca tarde.
 */
export const VIAJES = [0, 15, 30, 45] as const;

/**
 * Los MET de cada deporte, del Compendio de Actividades Físicas (2024), para una práctica común y no un
 * partido de competencia: pesas o máquinas, 5 (de 3,5 a 6 según el esfuerzo, el mismo número que la sesión
 * de Ascent; el crossfit, como un circuito vigoroso, llega a 7,5); partidos, 7 (fútbol 7, básquetbol 7,5,
 * hockey 7,8, tenis 6,8, vóley de 4 a 6; el pádel no está en el Compendio); correr, la bici o nadar a un ritmo
 * moderado, 8 (correr, de 7,5 a 9,3; la bici, de 6,8 a 8; nadar, de 5,8 a 9,8); choques o combate, 7,5 (el
 * rugby, de 6,3 a 8,3; el kickboxing, 7,3; el boxeo con bolsa, de 5,8 a 10,8; el sparring, 7,8).
 */
export const MET_DEL_DEPORTE: Record<Deporte, number> = { fuerza: MET_DE_LA_SESION, equipo: 7, resistencia: 8, contacto: 7.5 };

/** Las sesiones de un día de la semana, por la hora: puede haber dos (las pesas a la mañana y el partido a la noche). */
export function sesionesDeUnDia(e: Pick<EntrenoDicho, 'sesiones'> | null | undefined, dia: DiaSemana): SesionDicha[] {
  return (e?.sesiones ?? []).filter((s) => s.dias.includes(dia)).sort((a, b) => a.hora - b.hora);
}

/** Los días con dos sesiones o más, de lunes a domingo. */
export function diasConDosSesiones(e: Pick<EntrenoDicho, 'sesiones'> | null | undefined): DiaSemana[] {
  return SEMANA.filter((d) => sesionesDeUnDia(e, d).length >= 2);
}

/**
 * Lo que suma entrenar un día de la semana: lo de cada sesión de ese día, neto (el MET menos el de reposo,
 * que la vida diaria ya cuenta; un MET es 1 kcal por kilo y por hora).
 */
export function kcalDelDia(e: Pick<EntrenoDicho, 'sesiones'> | null | undefined, dia: DiaSemana, pesoKg: number): number {
  if (!(pesoKg > 0)) return 0;
  return sesionesDeUnDia(e, dia).reduce((suma, s) => suma + (s.minutos > 0 ? (MET_DEL_DEPORTE[s.tipo] - MET_EN_REPOSO) * pesoKg * (s.minutos / 60) : 0), 0);
}

/** Lo que suma el entrenamiento por día, en promedio de la semana: cada día, lo que se hace ese día. */
export function kcalDelEntreno(e: Pick<EntrenoDicho, 'sesiones'> | null | undefined, pesoKg: number): number {
  return SEMANA.reduce<number>((suma, d) => suma + kcalDelDia(e, d, pesoKg), 0) / 7;
}

/** Si entrena con pesas (la experiencia con pesas y los avisos del plazo sobre el músculo). */
export const entrenaFuerza = (e: Pick<EntrenoDicho, 'tipos'> | null | undefined) => !!e && e.tipos.includes('fuerza');

// ------------------------------------------------------------ el gasto, por partes
export type PersonaDelCuestionario = { edad: number; sexo: Sexo; alturaCm: number; pesoKg: number; sinDeficit?: boolean; grasa?: GrasaDicha | null };

/** El gasto en reposo: por la masa magra si se usa la grasa (Katch-McArdle); si no, Mifflin-St Jeor. */
export function gastoEnReposo(r: PersonaDelCuestionario): number {
  return usaGrasa(r) ? katchMcArdle(masaMagra(r.pesoKg, r.grasa!.pct)) : gastoBasal(r);
}

/** El gasto de un día promedio, en kcal: en reposo, lo que suma la vida diaria y lo que suma entrenar. */
export type Gasto = { reposo: number; vida: number; entreno: number; total: number; conGrasa: boolean };

export function gastoEstimado(r: PersonaDelCuestionario & { movimiento: Movimiento; entreno: EntrenoDicho | null }): Gasto {
  const reposo = gastoEnReposo(r);
  const vida = reposo * (FACTORES_DE_VIDA[r.movimiento] - 1);
  const entreno = kcalDelEntreno(r.entreno, r.pesoKg);
  return { reposo, vida, entreno, total: reposo + vida + entreno, conGrasa: usaGrasa(r) };
}

/** Las partes para mostrar, de a 10 kcal y sumando justo el total: lo que no cierra al redondear va a la vida diaria. */
export function partesRedondas(g: Gasto): { reposo: number; vida: number; entreno: number; total: number } {
  const total = aDiez(g.total);
  const reposo = aDiez(g.reposo);
  const entreno = aDiez(g.entreno);
  return { reposo, vida: total - reposo - entreno, entreno, total };
}

/** El nivel de actividad de siempre que más se parece: es lo que guarda la base hasta que guarde lo nuevo. */
export function actividadEquivalente(g: Pick<Gasto, 'reposo' | 'total'>): Actividad {
  const factor = g.total / g.reposo;
  const niveles = Object.keys(NIVELES) as Actividad[];
  return niveles.reduce((a, b) => (Math.abs(NIVELES[b] - factor) < Math.abs(NIVELES[a] - factor) ? b : a));
}

// ------------------------------------------------------------ lo que se quiere lograr
/** Lo de siempre, o la recomposición: ganar músculo y perder grasa a la vez. */
export type ObjetivoDicho = Objetivo | 'recomponer';

/** Sin déficit (embarazo, lactancia o una condición médica), ni bajar ni recomponer: mantener. */
export const objetivoUsado = (r: { objetivo: ObjetivoDicho; sinDeficit?: boolean }): ObjetivoDicho =>
  r.sinDeficit && (r.objetivo === 'bajar' || r.objetivo === 'recomponer') ? 'mantener' : r.objetivo;

/** La base solo acepta bajar, mantener o subir (un CHECK): la recomposición se guarda como mantener, con su marca. */
export const objetivoGuardado = (o: ObjetivoDicho): Objetivo => (o === 'recomponer' ? 'mantener' : o);

/**
 * La recomposición, como en MacroFactor: en mantenimiento, o bajando muy despacio (el ritmo suave) con
 * mucha grasa (desde el 25 % en hombres y el 32 % en mujeres, «obesidad» para el ACE): ahí se pierde
 * grasa y, con pesas y proteína alta, se gana músculo a la vez (Barakat y otros, 2020).
 */
export const GRASA_ALTA: Record<Sexo, number> = { m: 25, f: 32 };
export function ajusteDeRecomposicion(r: PersonaDelCuestionario): number {
  return usaGrasa(r) && r.grasa!.pct >= GRASA_ALTA[r.sexo] ? ajusteDiario('bajar', 'suave', r.pesoKg) : 0;
}

/** Hace cuánto entrena con pesas: menos de un año, de 1 a 3 o más de 3. */
export type Experiencia = 'principiante' | 'intermedio' | 'avanzado';

/**
 * El ritmo que se propone. Subiendo, depende de los años con pesas: el músculo que se puede sumar por
 * mes baja con la experiencia (el modelo de Aragon: del 1 al 1,5 % del peso por mes el primer año, de
 * 0,5 a 1 % hasta los tres y de 0,25 a 0,5 % después), y lo que se sube de más es grasa.
 */
export function ritmoSugerido(objetivo: ObjetivoDicho, experiencia: Experiencia | null | undefined): Ritmo {
  return objetivo === 'subir' && experiencia === 'avanzado' ? 'suave' : 'recomendado';
}

/** Al llegar al peso meta, después de unas semanas en mantenimiento: quedarse, ganar músculo o decidirlo al llegar (planPorEtapas). */
export type Despues = 'mantener' | 'musculo' | 'despues';

// ------------------------------------------------------------ la proteína
export type NivelDeProteina = 'baja' | 'recomendada' | 'alta';
export const NIVELES_DE_PROTEINA: readonly NivelDeProteina[] = ['baja', 'recomendada', 'alta'];

/**
 * Los gramos por kilo de cada nivel. La recomendada es la de siempre (metas.ts) y la recomposición va
 * más alta (Barakat y otros, 2020). Todo entre 1,2 y 2,2: debajo no alcanza para cuidar el músculo
 * entrenando; arriba, más no suma (Morton y otros, 2018).
 */
export const PROTEINA_POR_NIVEL: Record<ObjetivoDicho, Record<NivelDeProteina, number>> = {
  bajar: { baja: 1.6, recomendada: 2.0, alta: 2.2 },
  mantener: { baja: 1.2, recomendada: 1.6, alta: 2.0 },
  subir: { baja: 1.4, recomendada: 1.8, alta: 2.2 },
  recomponer: { baja: 1.8, recomendada: 2.0, alta: 2.2 },
};
export const PROTEINA_POR_KG_MINIMA = 1.2;
export const PROTEINA_POR_KG_MAXIMA = 2.2;
/**
 * La grasa típica de la gente de esos estudios. Con la grasa dicha, la proteína va por la masa magra:
 * un poco más para alguien muy magro y menos con mucha grasa, siempre entre 1,2 y 2,2 g por kilo.
 */
const GRASA_DE_REFERENCIA: Record<Sexo, number> = { m: 15, f: 25 };

export function proteinaDelNivel(r: PersonaDelCuestionario & { objetivo: ObjetivoDicho; proteina?: NivelDeProteina }): number {
  const porKg = PROTEINA_POR_NIVEL[objetivoUsado(r)][r.proteina ?? 'recomendada'];
  const gramos = usaGrasa(r) ? (porKg * masaMagra(r.pesoKg, r.grasa!.pct)) / (1 - GRASA_DE_REFERENCIA[r.sexo] / 100) : porKg * r.pesoKg;
  return limitar(gramos, PROTEINA_POR_KG_MINIMA * r.pesoKg, PROTEINA_POR_KG_MAXIMA * r.pesoKg);
}

// ------------------------------------------------------------ el día
/**
 * A qué hora suele hacer cada comida, en minutos desde la medianoche (null: no la suele hacer). Son sus
 * horas de comer, no «avisarme a esa hora»: eso se elige aparte, en Perfil › Avisos.
 */
export type Horarios = Record<Exclude<Comida, 'snack'>, number | null>;
/** A qué hora se despierta y se acuesta (minutos del reloj) y si el fin de semana es igual o más tarde. */
export type SuenoDicho = { despertar: number; acostarse: number; finDeSemana: 'igual' | 'tarde' };
/** Con estas noches en Salud, el sueño ya se sabe y no se pregunta. */
export const NOCHES_PARA_NO_PREGUNTAR = 3;

// ------------------------------------------------------------ el peso meta
type Direccion = Exclude<Objetivo, 'mantener'>;

/**
 * Entre qué pesos se elige, de a medio kilo: bajando, desde un IMC de 18,5 hasta 1 kg menos; subiendo,
 * de 1 kg más a un 30 % más. A medio kilo ya no hay camino (progreso.ts): si bajar no tiene lugar, null.
 */
export function rangoDelPesoMeta(pesoKg: number, alturaCm: number, direccion: Direccion): readonly [number, number] | null {
  const arriba = (x: number) => Math.ceil(x * 2 - 1e-9) / 2;
  const abajo = (x: number) => Math.floor(x * 2 + 1e-9) / 2;
  const desde = direccion === 'bajar' ? arriba(pesoMinimoSano(alturaCm)) : arriba(pesoKg + 1);
  const hasta = direccion === 'bajar' ? abajo(pesoKg - 1) : abajo(Math.min(RANGOS_DEL_CUESTIONARIO.pesoKg[1], pesoKg * 1.3));
  return desde <= hasta ? [desde, hasta] : null;
}

/** El que se propone: un 5 % menos o más, de a medio kilo, dentro de lo que se puede elegir. */
export function pesoMetaSugerido(pesoKg: number, alturaCm: number, direccion: Direccion): number | null {
  const rango = rangoDelPesoMeta(pesoKg, alturaCm, direccion);
  if (!rango) return null;
  return limitar(Math.round(pesoKg * (direccion === 'bajar' ? 0.95 : 1.05) * 2) / 2, rango[0], rango[1]);
}

// ------------------------------------------------------------ la meta de arranque
export type Respuestas = PersonaDelCuestionario & {
  movimiento: Movimiento;
  entreno: EntrenoDicho | null;
  objetivo: ObjetivoDicho;
  ritmo: Ritmo;
  /** Con una fecha elegida (D35), el ritmo que pide, en % del peso por semana; si no, el de `ritmo`. */
  pct?: number | null;
  estilo?: Estilo;
  proteina?: NivelDeProteina;
};

export type MetaDelCuestionario = {
  gasto: Gasto;
  metas: Macros;
  /** Lo que se guarda: bajar, mantener o subir, si es recomposición y el nivel de actividad que más se parece. */
  objetivo: Objetivo;
  recomponer: boolean;
  actividad: Actividad;
};

/** El gasto más o menos el ritmo, nunca debajo del piso ni en déficit si no se puede, con la proteína del nivel elegido. */
export function metaDelCuestionario(r: Respuestas): MetaDelCuestionario {
  const gasto = gastoEstimado(r);
  const usado = objetivoUsado(r);
  const objetivo = objetivoGuardado(usado);
  let ajuste = 0;
  if (usado === 'recomponer') ajuste = ajusteDeRecomposicion(r);
  else if (objetivo !== 'mantener' && r.pct != null && r.pct > 0) {
    // Antes de los 18, bajando, una fecha tampoco pide más que el ritmo recomendado (como ritmoPermitido).
    const pct = r.edad < MAYORIA_DE_EDAD && objetivo === 'bajar' ? Math.min(r.pct, Math.abs(RITMOS.bajar.recomendado)) : r.pct;
    ajuste = ((objetivo === 'bajar' ? -1 : 1) * (pct / 100) * r.pesoKg * KCAL_POR_KG) / 7;
  } else ajuste = ajusteDiario(objetivo, ritmoPermitido({ edad: r.edad, objetivo, ritmo: r.ritmo }), r.pesoKg);
  const kcal = Math.max(pisoDe(r.sexo), aDiez(gasto.total + ajuste));
  return {
    gasto,
    metas: macrosConProteina(kcal, r.pesoKg, proteinaDelNivel(r), r.estilo),
    objetivo,
    recomponer: usado === 'recomponer',
    actividad: actividadEquivalente(gasto),
  };
}
