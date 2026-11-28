// De lo que devuelve HealthKit a lo que entiende el dominio (src/dominio/sueno.ts): las muestras de
// sueño con su etapa, su fuente y la zona horaria de ese momento, y las lecturas del reloj. Sin nada
// del teléfono, para probarlo.

import { claveDelDia, diaLogico, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { lasDelAparato, marcaDe, type Confianza, type Etapa, type Fuente, type Medida, type Muestra, type Noche, type TipoDeFuente } from '@/dominio/sueno';

/** Lo que importa de una muestra de HealthKit. */
export type DeSalud = {
  value?: number;
  quantity?: number;
  startDate: Date;
  endDate: Date;
  sourceRevision: { source: { name: string; bundleIdentifier: string }; productType?: string };
  metadata?: Record<string, unknown>;
};

/** HKCategoryValueSleepAnalysis: en cama, dormido sin etapa, despierto, núcleo, profundo y REM. */
const ETAPAS: Record<number, Etapa> = { 0: 'enCama', 1: 'dormido', 2: 'despierto', 3: 'nucleo', 4: 'profundo', 5: 'rem' };

/**
 * El reloj, otro aparato (un anillo, Garmin) o el teléfono. El modelo dice dónde corría la app que
 * escribió: los aparatos escriben desde su app del iPhone, así que se reconocen por la app (su
 * identificador o su nombre; spec/aparatos.md).
 */
export function tipoDeFuente(productType: string | undefined, id = '', nombre = ''): TipoDeFuente {
  if (productType?.startsWith('Watch')) return 'reloj';
  if (marcaDe({ id, nombre, tipo: 'otra' }) !== 'otra') return 'otra';
  if (productType?.startsWith('iPhone')) return 'telefono';
  return 'otra';
}

const idDeFuente = (s: DeSalud) => s.sourceRevision.source.bundleIdentifier || s.sourceRevision.source.name;

/** Las fuentes de unas muestras, una por cada aparato o app. */
export function fuentesDe(muestras: DeSalud[]): Fuente[] {
  const fuentes = new Map<string, Fuente>();
  for (const s of muestras) {
    const id = idDeFuente(s);
    if (!fuentes.has(id)) fuentes.set(id, { id, nombre: s.sourceRevision.source.name, tipo: tipoDeFuente(s.sourceRevision.productType, id, s.sourceRevision.source.name) });
  }
  return [...fuentes.values()];
}

/** Una muestra de sueño, con la zona de su momento (−180 en Uruguay). Lo que no se entiende queda afuera. */
export function muestraDeSueno(s: DeSalud): Muestra | null {
  const etapa = s.value === undefined ? undefined : ETAPAS[s.value];
  const desde = s.startDate.getTime();
  const hasta = s.endDate.getTime();
  if (!etapa || !(hasta > desde)) return null;
  const aMano = s.metadata?.HKWasUserEntered === true || s.metadata?.HKWasUserEntered === 1;
  return { etapa, desde, hasta, fuente: idDeFuente(s), zona: -s.startDate.getTimezoneOffset(), ...(aMano ? { aMano: true } : {}) };
}

/** Las lecturas de una cantidad (la frecuencia, la variabilidad, la respiración): cuándo y cuánto. */
export const lecturasDe = (muestras: DeSalud[]): Medida[] =>
  muestras.flatMap((s) => (typeof s.quantity === 'number' && Number.isFinite(s.quantity) ? [{ en: s.startDate.getTime(), valor: s.quantity }] : []));

/** De muchas muestras de un valor diario (la frecuencia en reposo), la última de cada día. */
export function ultimaPorDia(muestras: DeSalud[]): Map<ClaveDia, number> {
  const porDia = new Map<ClaveDia, { en: number; valor: number }>();
  for (const s of muestras) {
    if (typeof s.quantity !== 'number' || !Number.isFinite(s.quantity)) continue;
    const dia = claveDelDia(s.startDate);
    const antes = porDia.get(dia);
    if (!antes || s.startDate.getTime() > antes.en) porDia.set(dia, { en: s.startDate.getTime(), valor: s.quantity });
  }
  return new Map([...porDia].map(([d, x]) => [d, x.valor]));
}

/**
 * El peso de cada día de Moss: el primero, el de la mañana en ayunas (D34), que varía menos de un día a otro
 * (Cheuvront y otros, 2004). Lo de antes de la hora de corte es del día anterior, como todo en Moss (D32). Con
 * `dato` en 'en', en lugar del valor, cuándo se midió (en ms).
 */
export function primeraPorDia(muestras: DeSalud[], corte: number, dato: 'valor' | 'en' = 'valor'): Map<ClaveDia, number> {
  const porDia = new Map<ClaveDia, { en: number; valor: number }>();
  for (const s of muestras) {
    if (typeof s.quantity !== 'number' || !Number.isFinite(s.quantity)) continue;
    const dia = diaLogico(s.startDate, corte);
    const antes = porDia.get(dia);
    if (!antes || s.startDate.getTime() < antes.en) porDia.set(dia, { en: s.startDate.getTime(), valor: s.quantity });
  }
  return new Map([...porDia].map(([d, x]) => [d, x[dato]]));
}

/** Las muestras de pasos, con cuándo y cuántos: sin reloj, dicen cuándo estabas despierto. */
export const pasosDe = (muestras: DeSalud[]) =>
  muestras.flatMap((s) => (typeof s.quantity === 'number' && s.quantity > 0 ? [{ desde: s.startDate.getTime(), hasta: s.endDate.getTime(), pasos: s.quantity }] : []));

/** Los minutos de unas sesiones (la atención plena). */
export const minutosDe = (muestras: DeSalud[]) => Math.round(muestras.reduce((s, m) => s + Math.max(0, m.endDate.getTime() - m.startDate.getTime()), 0) / 60_000);

/** Lo de Salud, leído al abrir la app y al volver: queda en memoria y no sube. Solo lo mínimo de las noches se guarda en el teléfono (nochesParaGuardar). */
export type LoDeSalud = {
  /** El día en que se leyó: los valores son de ese día. */
  dia: ClaveDia;
  /** Lo de hoy: pasos, ml de agua, minutos de atención plena y minutos dormidos anoche. */
  valores: Partial<Record<'pasos' | 'agua' | 'mindfulness' | 'sueno', number>>;
  /** Lo mismo del día anterior, entero: lo que llegó a la meta con Moss cerrada enciende su estrella al abrirla. */
  ayer?: { dia: ClaveDia; valores: LoDeSalud['valores'] };
  noches: Noche[];
  soloEnCama: Map<ClaveDia, { minutos: number; fuente: Fuente }>;
  lecturas: { frecuencia: Medida[]; variabilidad: Medida[]; respiracion: Medida[]; reposo: Map<ClaveDia, number> };
  fuentes: Fuente[];
  /** Los aparatos que escribieron sueño las últimas cuatro semanas: cuántas noches y si con etapas (Perfil › Aparatos). */
  aparatos: { fuente: Fuente; noches: number; conEtapas: boolean }[];
  /** Los pasos de las últimas 30 horas, muestra por muestra: sin reloj, con eso se estima la noche. */
  pasosRecientes: { desde: number; hasta: number; pasos: number }[];
  /** El primer peso de cada día de Moss, en kg. */
  pesos: Map<ClaveDia, number>;
  /** Cuándo se tomó cada uno de esos pesos, en ms: el peso se guarda con esa hora. */
  pesadoEn?: Map<ClaveDia, number>;
  /** Los entrenamientos de las últimas dos semanas; sin pedirlos todavía (quien pasó la entrada antes del 18/11/2026), ninguno. */
  entrenamientos?: EntrenoDeSalud[];
};

// ------------------------------------------------------------ los entrenamientos
// Un entrenamiento de Salud de ese día, de cualquier fuente (el reloj, un anillo, Strava, Fitness), cuenta como
// «entrenaste» (lo pediste el 18/11/2026). Se lee el tipo, cuándo empezó y terminó, cuánto duró y las calorías
// activas si vienen; nada más.

/** Lo que importa de un entrenamiento de HealthKit (HKWorkout). */
export type DeSaludEntreno = {
  workoutActivityType: number;
  startDate: Date;
  endDate: Date;
  duration?: { unit: string; quantity: number };
  totalEnergyBurned?: { unit: string; quantity: number };
};

/** Un entrenamiento de Salud: el día de Moss en que empezó, el tipo (HKWorkoutActivityType), los instantes en ms y las kcal activas, si vienen. */
export type EntrenoDeSalud = { dia: ClaveDia; tipo: number; desde: number; hasta: number; minutos: number; kcal: number | null };

/**
 * Lo que no es entrenar, aunque se anote como entrenamiento: caminar (52) y en silla a paso de caminar (70), enfriar
 * (80), prepararse y recuperarse (33) y mente y cuerpo (29). Y menos de 10 minutos tampoco.
 */
const NO_ES_ENTRENAR: ReadonlySet<number> = new Set([52, 70, 80, 33, 29]);
const MINUTOS_PARA_CONTAR = 10;

/** Un entrenamiento de Salud, con el día de Moss en que empezó (lo de antes del corte es del día anterior). Lo que no se entiende queda afuera. */
export function entrenoDeSalud(w: DeSaludEntreno, corte: number): EntrenoDeSalud | null {
  const desde = w.startDate.getTime();
  const hasta = w.endDate.getTime();
  if (!(hasta > desde)) return null;
  // La duración de Salud no cuenta las pausas; sin ella, de punta a punta.
  const segundos = w.duration?.unit === 's' && Number.isFinite(w.duration.quantity) && w.duration.quantity > 0 ? w.duration.quantity : (hasta - desde) / 1000;
  const kcal = w.totalEnergyBurned && Number.isFinite(w.totalEnergyBurned.quantity) && w.totalEnergyBurned.quantity > 0 ? Math.round(w.totalEnergyBurned.quantity) : null;
  return { dia: diaLogico(w.startDate, corte), tipo: w.workoutActivityType, desde, hasta, minutos: Math.round(segundos / 60), kcal };
}

export const cuentaComoEntrenar = (e: EntrenoDeSalud) => e.minutos >= MINUTOS_PARA_CONTAR && !NO_ES_ENTRENAR.has(e.tipo);

/** Los entrenamientos de un día de Moss que cuentan como entrenar, en orden. */
export const entrenosDelDia = (lista: readonly EntrenoDeSalud[] | undefined, dia: ClaveDia): EntrenoDeSalud[] =>
  (lista ?? []).filter((e) => e.dia === dia && cuentaComoEntrenar(e)).sort((a, b) => a.desde - b.desde);

// ------------------------------------------------------------ las noches guardadas (D45)
// Lo mínimo de las noches de Salud que usan los avisos (lo decidiste el 27/11/2026): con el iPhone bloqueado Salud no
// deja leer nada, y los avisos que iOS programa de fondo se armaban sin lo del sueño. Se guarda cada vez que Salud se
// lee bien, solo en el teléfono (SQLite, fuera de la copia de seguridad), y no sube ni se sincroniza. Sin las etapas,
// sin los tramos ni sus instantes, sin el aparato ni nada de lo que mide el reloj (la frecuencia, la variabilidad).

/**
 * Una noche de Salud, guardada: de qué día es, cuándo te dormiste y te despertaste (en minutos desde las 18 del día
 * anterior, como en Noche), lo dormido y las siestas, lo despierto adentro, si es de un reloj o un anillo, si se anotó a
 * mano y qué tan segura es la duración y la hora. Es lo que miran la deuda, lo de siempre, el periodo de melatonina y lo
 * que sueles estar despierto: con estas, los avisos dan lo mismo que con Salud.
 */
export type NocheGuardada = {
  clave: ClaveDia;
  dormirse: number;
  despertar: number;
  dormido: number;
  siestas: number;
  despierto: number;
  aparato: TipoDeFuente;
  aMano?: true;
  confianza: { duracion: Confianza; horario: Confianza };
};

/** Las de los últimos 16 días: la deuda de ayer y lo de siempre de anoche miran dos semanas para atrás desde ayer. */
export const DIAS_GUARDADOS = 16;

/**
 * Lo que se guarda de las noches de Salud leídas el día `dia`: las de los últimos DIAS_GUARDADOS días y, de un reloj o un
 * anillo, las últimas 14 aunque sean de antes (lasDelAparato: de esas sale lo que sueles estar despierto).
 */
export function nochesParaGuardar(noches: readonly Noche[], dia: ClaveDia): NocheGuardada[] {
  const desde = sumarDias(dia, 1 - DIAS_GUARDADOS);
  const delAparato = new Set(lasDelAparato(noches));
  return noches
    .filter((n) => n.clave >= desde || delAparato.has(n))
    .map((n) => ({
      clave: n.clave, dormirse: n.dormirse, despertar: n.despertar, dormido: n.dormido, siestas: n.siestas, despierto: n.despierto, aparato: n.fuente.tipo,
      ...(n.aMano ? { aMano: true as const } : {}), confianza: { duracion: n.confianza.duracion, horario: n.confianza.horario },
    }));
}

const CONFIANZAS: readonly unknown[] = ['alta', 'media', 'baja'];
const APARATOS: readonly unknown[] = ['reloj', 'otra', 'telefono', 'moss'];
const esGuardada = (n: Partial<NocheGuardada> | null): n is NocheGuardada =>
  !!n && typeof n.clave === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(n.clave) && APARATOS.includes(n.aparato)
  && [n.dormirse, n.despertar, n.dormido, n.siestas, n.despierto].every(Number.isFinite)
  && CONFIANZAS.includes(n.confianza?.duracion) && CONFIANZAS.includes(n.confianza?.horario);

/** Las noches guardadas, como se leen del teléfono: lo que no tiene forma queda afuera; sin lista, null (no hay nada guardado). */
export const nochesGuardadasDe = (x: unknown): NocheGuardada[] | null => (Array.isArray(x) ? x.filter(esGuardada) : null);

/**
 * Lo de Salud que queda guardado, para los avisos mientras Salud no se puede leer: solo las noches. Lo que no se guarda
 * vuelve vacío (los avisos no lo usan): los tramos, las etapas, el aparato, las lecturas, los pasos y los entrenamientos.
 */
export function saludGuardada(noches: readonly NocheGuardada[], dia: ClaveDia): LoDeSalud {
  return {
    dia, valores: {}, soloEnCama: new Map(), lecturas: { frecuencia: [], variabilidad: [], respiracion: [], reposo: new Map() }, fuentes: [], aparatos: [], pasosRecientes: [], pesos: new Map(),
    noches: noches.map((n): Noche => ({
      clave: n.clave, fuente: { id: '', nombre: '', tipo: n.aparato }, conEtapas: false, dormirse: n.dormirse, despertar: n.despertar, enCama: null,
      dormido: n.dormido, despierto: n.despierto, despertares: 0, etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: n.dormido }, siestas: n.siestas, tramos: [],
      intervalos: [], confianza: { ...n.confianza, despertares: 'baja', etapas: null, enCama: null }, ...(n.aMano ? { aMano: true as const } : {}),
    })),
  };
}
