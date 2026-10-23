// Los músculos de cada ejercicio y lo que les falta para recuperarse (spec/rendimiento.md, «Por
// músculo»). Ascent le da un solo grupo a cada ejercicio, y la fatiga necesita el músculo principal y
// los que ayudan: va una tabla con los ejercicios comunes, en español y en inglés, y el grupo de
// Ascent para los demás.
// - La dosis de una sesión: las series de cada músculo, 1 si es el principal y 0,5 si ayuda, por el
//   esfuerzo (sin repeticiones se supone cerca del fallo).
// - Lo que cae al principio: 30 % × (1 − e^(−dosis/8)), y se va recuperando con una constante de 18
//   horas en el tren superior y 36 en las piernas (más con una serie al fallo, 10 series o más, o con
//   menos de 6 meses entrenando).
// Las constantes son una propuesta, derivada de los estudios citados, para calibrar con lo tuyo.

export type Musculo =
  | 'pecho' | 'espaldaAlta' | 'hombros' | 'biceps' | 'triceps' | 'antebrazos' | 'abdomen'
  | 'espaldaBaja' | 'cuadriceps' | 'gluteos' | 'isquios' | 'aductores' | 'pantorrillas';
export const MUSCULOS: readonly Musculo[] = [
  'cuadriceps', 'gluteos', 'isquios', 'espaldaBaja', 'aductores', 'pantorrillas', 'pecho', 'espaldaAlta', 'hombros', 'biceps', 'triceps', 'antebrazos', 'abdomen',
];
/** Los grupos de Ascent (un solo grupo por ejercicio). */
export type GrupoDeAscent = 'pecho' | 'espalda' | 'hombros' | 'brazos' | 'piernas' | 'core' | 'cardio';

/** Cuánto tarda cada músculo, en horas: las piernas y la espalda baja, el doble. */
export const TAU: Record<Musculo, number> = {
  pecho: 18, espaldaAlta: 18, hombros: 18, biceps: 18, triceps: 18, antebrazos: 18, abdomen: 18, pantorrillas: 18,
  espaldaBaja: 36, cuadriceps: 36, gluteos: 36, isquios: 36, aductores: 36,
};
export const DE_PIERNAS: readonly Musculo[] = ['cuadriceps', 'gluteos', 'isquios', 'espaldaBaja', 'aductores', 'pantorrillas'];

type DeEjercicio = { principal: Musculo[]; ayudan: Musculo[]; multiarticular: boolean };
/** Los ejercicios comunes: el nombre en minúsculas y sin tildes, el principal y los que ayudan. */
const EJERCICIOS: (DeEjercicio & { nombres: string[] })[] = [
  { nombres: ['sentadilla', 'squat', 'sentadilla frontal', 'front squat', 'hack squat'], principal: ['cuadriceps', 'gluteos'], ayudan: ['aductores', 'espaldaBaja'], multiarticular: true },
  { nombres: ['peso muerto', 'deadlift'], principal: ['isquios', 'gluteos', 'espaldaBaja'], ayudan: ['espaldaAlta', 'antebrazos', 'cuadriceps'], multiarticular: true },
  { nombres: ['peso muerto rumano', 'romanian deadlift', 'rdl', 'peso muerto piernas rigidas'], principal: ['isquios', 'gluteos'], ayudan: ['espaldaBaja'], multiarticular: true },
  { nombres: ['prensa', 'leg press'], principal: ['cuadriceps', 'gluteos'], ayudan: ['aductores'], multiarticular: true },
  { nombres: ['zancada', 'estocada', 'lunge', 'split squat', 'sentadilla bulgara'], principal: ['cuadriceps', 'gluteos'], ayudan: ['aductores', 'isquios'], multiarticular: true },
  { nombres: ['extension de piernas', 'extension de cuadriceps', 'leg extension', 'sillon de cuadriceps'], principal: ['cuadriceps'], ayudan: [], multiarticular: false },
  { nombres: ['curl femoral', 'leg curl', 'curl de piernas', 'camilla de isquios'], principal: ['isquios'], ayudan: [], multiarticular: false },
  { nombres: ['hip thrust', 'empuje de cadera', 'puente de gluteos'], principal: ['gluteos'], ayudan: ['isquios'], multiarticular: true },
  { nombres: ['pantorrillas', 'gemelos', 'calf raise', 'elevacion de talones'], principal: ['pantorrillas'], ayudan: [], multiarticular: false },
  { nombres: ['press banca', 'press de banca', 'bench press', 'press plano', 'press con mancuernas'], principal: ['pecho'], ayudan: ['triceps', 'hombros'], multiarticular: true },
  { nombres: ['press inclinado', 'incline press', 'press banca inclinado'], principal: ['pecho', 'hombros'], ayudan: ['triceps'], multiarticular: true },
  { nombres: ['fondos', 'dips'], principal: ['pecho', 'triceps'], ayudan: ['hombros'], multiarticular: true },
  { nombres: ['flexiones', 'push up', 'lagartijas'], principal: ['pecho'], ayudan: ['triceps', 'hombros'], multiarticular: true },
  { nombres: ['aperturas', 'flyes', 'cruce de poleas', 'crossover', 'pec deck'], principal: ['pecho'], ayudan: ['hombros'], multiarticular: false },
  { nombres: ['press militar', 'overhead press', 'press de hombros', 'shoulder press'], principal: ['hombros'], ayudan: ['triceps'], multiarticular: true },
  { nombres: ['elevaciones laterales', 'vuelos laterales', 'lateral raise'], principal: ['hombros'], ayudan: [], multiarticular: false },
  { nombres: ['dominadas', 'pull up', 'chin up', 'jalon al pecho', 'lat pulldown', 'jalon'], principal: ['espaldaAlta'], ayudan: ['biceps', 'antebrazos'], multiarticular: true },
  { nombres: ['remo', 'row'], principal: ['espaldaAlta'], ayudan: ['biceps', 'espaldaBaja', 'antebrazos'], multiarticular: true },
  { nombres: ['face pull'], principal: ['hombros', 'espaldaAlta'], ayudan: [], multiarticular: false },
  { nombres: ['curl', 'biceps'], principal: ['biceps'], ayudan: ['antebrazos'], multiarticular: false },
  { nombres: ['triceps', 'press frances', 'skull crusher', 'pushdown'], principal: ['triceps'], ayudan: [], multiarticular: false },
  { nombres: ['plancha', 'plank', 'abdominales', 'crunch', 'elevacion de piernas', 'rueda abdominal'], principal: ['abdomen'], ayudan: [], multiarticular: false },
];
/** Lo que no está en la tabla, por el grupo de Ascent. */
const DE_GRUPO: Record<Exclude<GrupoDeAscent, 'cardio'>, DeEjercicio> = {
  pecho: { principal: ['pecho'], ayudan: ['triceps', 'hombros'], multiarticular: true },
  espalda: { principal: ['espaldaAlta'], ayudan: ['biceps', 'antebrazos'], multiarticular: true },
  hombros: { principal: ['hombros'], ayudan: ['triceps'], multiarticular: false },
  brazos: { principal: ['biceps', 'triceps'], ayudan: ['antebrazos'], multiarticular: false },
  piernas: { principal: ['cuadriceps', 'gluteos', 'isquios'], ayudan: ['aductores'], multiarticular: true },
  core: { principal: ['abdomen'], ayudan: [], multiarticular: false },
};

const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/**
 * Los músculos de un ejercicio: el nombre más largo de la tabla que aparece en el suyo («peso muerto
 * rumano» antes que «peso muerto»); si no está, el grupo de Ascent; si tampoco, null (el cardio).
 */
export function musculosDe(ejercicio: string, grupo?: GrupoDeAscent): DeEjercicio | null {
  const nombre = sinTildes(ejercicio);
  let mejor: { largo: number; de: DeEjercicio } | null = null;
  for (const e of EJERCICIOS) {
    for (const n of e.nombres) {
      if (nombre.includes(n) && (!mejor || n.length > mejor.largo)) mejor = { largo: n.length, de: e };
    }
  }
  if (mejor) return mejor.de;
  return grupo && grupo !== 'cardio' ? DE_GRUPO[grupo] : null;
}

/** Una serie: el peso y, si se anotaron, las repeticiones (opcionales en Ascent desde la migración 94). */
export type Serie = { peso: number; reps: number | null };
export type Bloque = { ejercicio: string; grupo?: GrupoDeAscent; series: Serie[]; alFallo?: boolean };
/** Una sesión de Ascent con sus bloques; \`inicio\` en milisegundos. */
export type SesionConBloques = { inicio: number; bloques: Bloque[] };

/** El 1RM estimado con Epley, solo con 10 repeticiones o menos (más, se equivoca mucho). */
export const e1rm = (peso: number, reps: number) => (reps >= 1 && reps <= 10 ? peso * (1 + reps / 30) : null);

/**
 * El esfuerzo de una serie: sin repeticiones, 1 (se supone cerca del fallo). Con repeticiones y el
 * 1RM estimado del ejercicio, según cuántas quedaban en reserva: 0 o 1 cuentan 1; 2 o 3, 0,6; 4 o
 * más, 0,3. La entrada en calor (menos del 50 % del 1RM) no cuenta.
 */
export function esfuerzoDeSerie(serie: Serie, unoRM: number | null): number {
  if (serie.reps === null || !unoRM) return 1;
  if (serie.peso < 0.5 * unoRM) return 0;
  const posibles = 30 * (unoRM / serie.peso - 1);
  const reserva = posibles - serie.reps;
  return reserva <= 1 ? 1 : reserva <= 3 ? 0.6 : 0.3;
}

/** El mejor 1RM estimado de un ejercicio en unas sesiones (null sin repeticiones). */
export function mejorE1rm(sesiones: readonly SesionConBloques[], ejercicio: string): number | null {
  const nombre = sinTildes(ejercicio);
  let mejor: number | null = null;
  for (const s of sesiones) {
    for (const b of s.bloques) {
      if (sinTildes(b.ejercicio) !== nombre) continue;
      for (const x of b.series) {
        const v = x.reps === null ? null : e1rm(x.peso, x.reps);
        if (v !== null && (mejor === null || v > mejor)) mejor = v;
      }
    }
  }
  return mejor;
}

type Dosis = { dosis: number; series: number; alFallo: boolean };

/** La dosis de cada músculo en una sesión: series × rol × esfuerzo. */
export function dosisDeLaSesion(sesion: SesionConBloques, unoRM: (ejercicio: string) => number | null = () => null): Map<Musculo, Dosis> {
  const r = new Map<Musculo, Dosis>();
  for (const b of sesion.bloques) {
    const m = musculosDe(b.ejercicio, b.grupo);
    if (!m) continue;
    const esfuerzo = b.series.reduce((s, x) => s + esfuerzoDeSerie(x, unoRM(b.ejercicio)), 0);
    const duras = b.series.filter((x) => esfuerzoDeSerie(x, unoRM(b.ejercicio)) > 0).length;
    const sumar = (musculo: Musculo, rol: number) => {
      const antes = r.get(musculo) ?? { dosis: 0, series: 0, alFallo: false };
      r.set(musculo, { dosis: antes.dosis + esfuerzo * rol, series: antes.series + (rol === 1 ? duras : 0), alFallo: antes.alFallo || !!b.alFallo });
    };
    m.principal.forEach((x) => sumar(x, 1));
    m.ayudan.forEach((x) => sumar(x, 0.5));
  }
  return r;
}

/** Lo que cae al principio, en %: 6 series dan 15,8; 8, 19; 15, 25,4. */
export const caidaInicial = (dosis: number) => 30 * (1 - Math.exp(-dosis / 8));

const HORA = 3_600_000;

/**
 * Lo que le falta recuperar a un músculo en un momento (en %), sumando las sesiones de antes. La
 * constante crece ×1,5 con una serie al fallo o 10 series o más, y ×1,5 (con la caída) si entrena
 * hace menos de 6 meses.
 */
export function residual(musculo: Musculo, sesiones: readonly SesionConBloques[], en: number, opciones: { novato?: boolean; unoRM?: (ejercicio: string) => number | null } = {}): number {
  let r = 0;
  for (const s of sesiones) {
    if (s.inicio > en) continue;
    const d = dosisDeLaSesion(s, opciones.unoRM).get(musculo);
    if (!d || d.dosis <= 0) continue;
    const tau = TAU[musculo] * (d.alFallo || d.series >= 10 ? 1.5 : 1) * (opciones.novato ? 1.5 : 1);
    r += caidaInicial(d.dosis) * (opciones.novato ? 1.5 : 1) * Math.exp(-(en - s.inicio) / HORA / tau);
  }
  return r;
}

export type EstadoMuscular = 'recuperado' | 'recuperandose' | 'cargado';
/** Por debajo del 3 %, el ruido de cada día, está recuperado; hasta 10 %, recuperándose; más, cargado. */
export const estadoDe = (r: number): EstadoMuscular => (r < 3 ? 'recuperado' : r <= 10 ? 'recuperandose' : 'cargado');

/** En cuántas horas baja del 3 % (de a una hora, hasta una semana; null si ya está). */
export function listoEn(musculo: Musculo, sesiones: readonly SesionConBloques[], en: number, opciones: { novato?: boolean; unoRM?: (ejercicio: string) => number | null } = {}): number | null {
  if (residual(musculo, sesiones, en, opciones) < 3) return null;
  for (let h = 1; h <= 168; h++) if (residual(musculo, sesiones, en + h * HORA, opciones) < 3) return h;
  return 168;
}
