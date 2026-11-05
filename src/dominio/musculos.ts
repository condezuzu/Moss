// Los músculos de cada ejercicio y lo que les falta para recuperarse (spec/rendimiento.md, «Por
// músculo», revisado con la evidencia el 5/11/2026). Ascent le da un solo grupo a cada ejercicio, y la
// fatiga necesita el músculo principal y los que ayudan: va el catálogo de Ascent entero, por su id, y
// los ejercicios propios (`propio_…`) por el grupo que eligió la persona.
// - La dosis de una sesión: las series de cada músculo, 1 si es el principal y 0,5 si ayuda (Pelland
//   2026: contar la mitad las que ayudan fue lo que mejor ajustó). Cuenta toda serie de trabajo, con el
//   60 % del 1RM estimado o más; la entrada en calor no.
// - Lo que cae al principio: 30 % × (1 − e^(−dosis/8)), y se va recuperando con una constante de 18
//   horas en el tren superior y 36 en las piernas, que crece de a poco con las series (de ×1 con 6 a
//   ×1,5 con 12), con una serie al fallo o con menos de 6 meses entrenando.
// Las constantes son una propuesta, derivada de los estudios citados: por dentro eligen la palabra y el
// día; nunca se muestran como horas ni como porcentajes.

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

export type DeEjercicio = { principal: Musculo[]; ayudan: Musculo[]; multiarticular: boolean };
export type DelCatalogo = DeEjercicio & { grupo: GrupoDeAscent };

const ej = (grupo: GrupoDeAscent, principal: Musculo[], ayudan: Musculo[] = [], multiarticular = false): DelCatalogo => ({ grupo, principal, ayudan, multiarticular });
const multi = (grupo: GrupoDeAscent, principal: Musculo[], ayudan: Musculo[] = []) => ej(grupo, principal, ayudan, true);
const cardio = ej('cardio', []);

/**
 * El catálogo de Ascent (su tabla `ejercicios`, a la versión 96 de su esquema: las migraciones 8, 29, 56,
 * 76 y 96), por id: el grupo que le da Ascent, los músculos principales, los que ayudan y si es
 * multiarticular. El cardio está, sin músculos: se mide en minutos y no cansa como las series. Es una
 * tabla de Moss (Moss nunca llama funciones de Ascent): si Ascent suma un ejercicio, va acá también, y el
 * test de musculos.test.ts compara las dos listas.
 */
export const CATALOGO: Readonly<Record<string, DelCatalogo>> = {
  // piernas
  sentadilla: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'espaldaBaja']),
  sentadilla_frontal: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'espaldaAlta']),
  sentadilla_bulgara: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'isquios']),
  sentadilla_goblet: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'abdomen']),
  sentadilla_hack: multi('piernas', ['cuadriceps'], ['gluteos', 'aductores']),
  sentadilla_smith: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores']),
  peso_muerto_rumano: multi('piernas', ['isquios', 'gluteos'], ['espaldaBaja', 'antebrazos']),
  peso_muerto_sumo: multi('piernas', ['gluteos', 'isquios', 'aductores'], ['cuadriceps', 'espaldaBaja', 'antebrazos']),
  peso_muerto_rigidas: multi('piernas', ['isquios', 'gluteos'], ['espaldaBaja']),
  peso_muerto_una_pierna: multi('piernas', ['isquios', 'gluteos'], ['espaldaBaja']),
  buenos_dias: multi('piernas', ['isquios', 'espaldaBaja'], ['gluteos']),
  prensa: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores']),
  prensa_una_pierna: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores']),
  hip_thrust: multi('piernas', ['gluteos'], ['isquios']),
  puente_gluteo: multi('piernas', ['gluteos'], ['isquios']),
  zancadas: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'isquios']),
  zancadas_caminando: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'isquios']),
  zancada_inversa: multi('piernas', ['cuadriceps', 'gluteos'], ['aductores', 'isquios']),
  subida_cajon: multi('piernas', ['cuadriceps', 'gluteos'], ['isquios']),
  extension_cuadriceps: ej('piernas', ['cuadriceps']),
  curl_femoral: ej('piernas', ['isquios']),
  curl_femoral_pie: ej('piernas', ['isquios']),
  gemelos: ej('piernas', ['pantorrillas']),
  gemelos_sentado: ej('piernas', ['pantorrillas']),
  gemelos_prensa: ej('piernas', ['pantorrillas']),
  aductores: ej('piernas', ['aductores']),
  abductores: ej('piernas', ['gluteos']),
  patada_gluteo: ej('piernas', ['gluteos'], ['isquios']),
  // pecho
  press_banca: multi('pecho', ['pecho'], ['triceps', 'hombros']),
  press_mancuernas: multi('pecho', ['pecho'], ['triceps', 'hombros']),
  press_plano_smith: multi('pecho', ['pecho'], ['triceps', 'hombros']),
  press_pecho_maquina: multi('pecho', ['pecho'], ['triceps', 'hombros']),
  press_declinado: multi('pecho', ['pecho'], ['triceps']),
  press_inclinado: multi('pecho', ['pecho', 'hombros'], ['triceps']),
  press_inclinado_mancuernas: multi('pecho', ['pecho', 'hombros'], ['triceps']),
  press_inclinado_smith: multi('pecho', ['pecho', 'hombros'], ['triceps']),
  fondos: multi('pecho', ['pecho', 'triceps'], ['hombros']),
  flexiones: multi('pecho', ['pecho'], ['triceps', 'hombros']),
  aperturas: ej('pecho', ['pecho'], ['hombros']),
  cruce_polea_alta: ej('pecho', ['pecho'], ['hombros']),
  cruce_polea_baja: ej('pecho', ['pecho'], ['hombros']),
  pec_deck: ej('pecho', ['pecho'], ['hombros']),
  pullover: ej('pecho', ['pecho', 'espaldaAlta'], ['triceps']),
  // espalda
  peso_muerto: multi('espalda', ['isquios', 'gluteos', 'espaldaBaja'], ['espaldaAlta', 'antebrazos', 'cuadriceps']),
  rack_pull: multi('espalda', ['espaldaBaja', 'gluteos', 'espaldaAlta'], ['isquios', 'antebrazos']),
  dominadas: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  dominadas_supinas: multi('espalda', ['espaldaAlta', 'biceps'], ['antebrazos']),
  dominadas_lastradas: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  jalon: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  jalon_cerrado: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  jalon_unilateral: multi('espalda', ['espaldaAlta'], ['biceps']),
  remo_barra: multi('espalda', ['espaldaAlta'], ['biceps', 'espaldaBaja', 'antebrazos']),
  remo_pendlay: multi('espalda', ['espaldaAlta'], ['biceps', 'espaldaBaja', 'antebrazos']),
  remo_t: multi('espalda', ['espaldaAlta'], ['biceps', 'espaldaBaja', 'antebrazos']),
  remo_mancuerna: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  remo_polea: multi('espalda', ['espaldaAlta'], ['biceps', 'antebrazos']),
  remo_maquina: multi('espalda', ['espaldaAlta'], ['biceps']),
  remo_unilateral_polea: multi('espalda', ['espaldaAlta'], ['biceps']),
  remo_invertido: multi('espalda', ['espaldaAlta'], ['biceps', 'hombros']),
  pullover_polea: ej('espalda', ['espaldaAlta'], ['triceps']),
  hiperextensiones: ej('espalda', ['espaldaBaja', 'gluteos'], ['isquios']),
  // hombros
  press_militar: multi('hombros', ['hombros'], ['triceps']),
  press_militar_mancuernas: multi('hombros', ['hombros'], ['triceps']),
  press_hombro_maquina: multi('hombros', ['hombros'], ['triceps']),
  press_arnold: multi('hombros', ['hombros'], ['triceps']),
  remo_menton: multi('hombros', ['hombros', 'espaldaAlta'], ['biceps']),
  elevaciones_laterales: ej('hombros', ['hombros']),
  elevaciones_polea: ej('hombros', ['hombros']),
  elevaciones_maquina: ej('hombros', ['hombros']),
  elevaciones_frontales: ej('hombros', ['hombros']),
  pajaros: ej('hombros', ['hombros'], ['espaldaAlta']),
  face_pull: ej('hombros', ['hombros', 'espaldaAlta']),
  rotacion_externa: ej('hombros', ['hombros']),
  // El trapecio va con la espalda alta: Moss no lo separa.
  encogimientos: ej('hombros', ['espaldaAlta'], ['antebrazos']),
  // brazos
  curl_barra: ej('brazos', ['biceps'], ['antebrazos']),
  curl_mancuernas: ej('brazos', ['biceps'], ['antebrazos']),
  curl_barra_z: ej('brazos', ['biceps'], ['antebrazos']),
  curl_predicador: ej('brazos', ['biceps'], ['antebrazos']),
  curl_inclinado: ej('brazos', ['biceps'], ['antebrazos']),
  curl_polea: ej('brazos', ['biceps'], ['antebrazos']),
  curl_concentrado: ej('brazos', ['biceps']),
  martillo: ej('brazos', ['biceps', 'antebrazos']),
  curl_muneca: ej('brazos', ['antebrazos']),
  press_cerrado: multi('brazos', ['triceps', 'pecho'], ['hombros']),
  fondos_banco: multi('brazos', ['triceps'], ['pecho', 'hombros']),
  press_frances: ej('brazos', ['triceps']),
  triceps_polea: ej('brazos', ['triceps']),
  triceps_mancuerna: ej('brazos', ['triceps']),
  triceps_sobre_cabeza: ej('brazos', ['triceps']),
  patada_triceps: ej('brazos', ['triceps']),
  triceps_maquina: ej('brazos', ['triceps']),
  // core
  abdominales_polea: ej('core', ['abdomen']),
  rueda_abdominal: ej('core', ['abdomen']),
  plancha: ej('core', ['abdomen']),
  plancha_lateral: ej('core', ['abdomen']),
  crunch: ej('core', ['abdomen']),
  crunch_declinado: ej('core', ['abdomen']),
  elevacion_piernas: ej('core', ['abdomen'], ['antebrazos']),
  elevacion_rodillas: ej('core', ['abdomen']),
  giros_rusos: ej('core', ['abdomen']),
  bicicleta_abdominal: ej('core', ['abdomen']),
  dead_bug: ej('core', ['abdomen']),
  press_pallof: ej('core', ['abdomen']),
  // cardio
  cinta: cardio, correr: cardio, caminar: cardio, bicicleta_fija: cardio, eliptica: cardio, remo_ergometro: cardio, escaladora: cardio, soga: cardio, natacion: cardio,
};

/** Los ejercicios propios (los que crea la persona en Ascent), por el grupo que eligió. */
export const DE_GRUPO: Record<Exclude<GrupoDeAscent, 'cardio'>, DeEjercicio> = {
  pecho: { principal: ['pecho'], ayudan: ['triceps', 'hombros'], multiarticular: true },
  espalda: { principal: ['espaldaAlta'], ayudan: ['biceps', 'antebrazos'], multiarticular: true },
  hombros: { principal: ['hombros'], ayudan: ['triceps'], multiarticular: false },
  brazos: { principal: ['biceps', 'triceps'], ayudan: ['antebrazos'], multiarticular: false },
  piernas: { principal: ['cuadriceps', 'gluteos', 'isquios'], ayudan: ['aductores'], multiarticular: true },
  core: { principal: ['abdomen'], ayudan: [], multiarticular: false },
};

/** Lo que se sabe de un ejercicio: el id de Ascent y, si se sabe, su grupo. */
export type RefDeEjercicio = { id?: string; grupo?: GrupoDeAscent };

export const esPropio = (id: string | undefined) => !!id && id.startsWith('propio_');

/** El grupo de Ascent de un ejercicio: el del catálogo o, si no está, el que llegó. */
export const grupoDelEjercicio = (e: RefDeEjercicio): GrupoDeAscent | undefined => (e.id && CATALOGO[e.id] ? CATALOGO[e.id].grupo : e.grupo);

/**
 * Los músculos de un ejercicio: los del catálogo por su id; un propio, o uno que Moss todavía no tiene,
 * por el grupo; el cardio, null.
 */
export function musculosDe(e: RefDeEjercicio): DeEjercicio | null {
  const delCatalogo = e.id && !esPropio(e.id) ? CATALOGO[e.id] : undefined;
  if (delCatalogo) return delCatalogo.grupo === 'cardio' ? null : delCatalogo;
  return e.grupo && e.grupo !== 'cardio' ? DE_GRUPO[e.grupo] : null;
}

/** Una serie: el peso y, si se anotaron, las repeticiones (opcionales en Ascent desde la migración 94). */
export type Serie = { peso: number; reps: number | null };
/** Un ejercicio de una sesión: su nombre (el de Ascent), su id, su grupo y sus series. */
export type Bloque = RefDeEjercicio & { ejercicio: string; series: Serie[]; alFallo?: boolean };
/** Una sesión de Ascent con sus bloques; \`inicio\` en milisegundos. */
export type SesionConBloques = { inicio: number; bloques: Bloque[] };

const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
/** Cómo se reconoce el mismo ejercicio en dos sesiones: por el id o, sin id, por el nombre. */
export const claveDelEjercicio = (b: { id?: string; ejercicio: string }) => b.id ?? sinTildes(b.ejercicio);

/**
 * El 1RM estimado con Epley, de 1 a 10 repeticiones (más, se equivoca mucho: Reynolds 2006). Con una
 * repetición, el peso: es lo levantado, como lo cuenta Ascent (un_rm). Sin peso, null.
 */
export const e1rm = (peso: number, reps: number) => (peso > 0 && reps >= 1 && reps <= 10 ? (reps === 1 ? peso : peso * (1 + reps / 30)) : null);

/** El 1RM de una marca como lo cuenta Ascent (un_rm): con una repetición, el peso; con más, Epley (sus marcas van hasta 20). */
export const unRmDeAscent = (m: { kilos: number; reps: number }) => (m.reps <= 1 ? m.kilos : m.kilos * (1 + m.reps / 30));

/** La serie de trabajo empieza en el 60 % del 1RM estimado: lo de menos es entrada en calor. */
export const DE_TRABAJO = 0.6;

/**
 * El esfuerzo de una serie: 1 si es de trabajo (o si no se sabe: sin repeticiones o sin 1RM) y 0 la
 * entrada en calor. Las repeticiones en reserva no se estiman con Epley: el error entre personas es del
 * tamaño de los cortes (Nuzzo 2024).
 */
export function esfuerzoDeSerie(serie: Serie, unoRM: number | null): number {
  if (serie.reps === null || !unoRM || serie.peso <= 0) return 1;
  return serie.peso >= DE_TRABAJO * unoRM ? 1 : 0;
}

/** El mejor 1RM estimado de unas series (null sin repeticiones). */
export function mejorDeLasSeries(series: readonly Serie[]): number | null {
  let mejor: number | null = null;
  for (const x of series) {
    const v = x.reps === null ? null : e1rm(x.peso, x.reps);
    if (v !== null && (mejor === null || v > mejor)) mejor = v;
  }
  return mejor;
}

/** El mejor 1RM estimado de un ejercicio en unas sesiones (null sin repeticiones). */
export function mejorE1rm(sesiones: readonly SesionConBloques[], ejercicio: { id?: string; ejercicio: string }): number | null {
  const clave = claveDelEjercicio(ejercicio);
  let mejor: number | null = null;
  for (const s of sesiones) {
    for (const b of s.bloques) {
      if (claveDelEjercicio(b) !== clave) continue;
      const v = mejorDeLasSeries(b.series);
      if (v !== null && (mejor === null || v > mejor)) mejor = v;
    }
  }
  return mejor;
}

type Dosis = { dosis: number; series: number; alFallo: boolean };
export type UnoRMDe = (b: Bloque) => number | null;

/** La dosis de cada músculo en una sesión: series × rol × esfuerzo; `series` son las de trabajo como principal. */
export function dosisDeLaSesion(sesion: SesionConBloques, unoRM: UnoRMDe = () => null): Map<Musculo, Dosis> {
  const r = new Map<Musculo, Dosis>();
  for (const b of sesion.bloques) {
    const m = musculosDe(b);
    if (!m) continue;
    const uno = unoRM(b);
    const esfuerzo = b.series.reduce((s, x) => s + esfuerzoDeSerie(x, uno), 0);
    const duras = b.series.filter((x) => esfuerzoDeSerie(x, uno) > 0).length;
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

/**
 * Cuánto más tarda con más series: ×1 hasta 6 series duras, de a poco hasta ×1,5 con 12 o más
 * (Bartolomei 2017: con 8 × 10, la fuerza seguía baja a las 72 h; con 8 × 3, no), y ×1,5 con una serie
 * al fallo (Morán-Navarro 2017; Vieira 2022). Antes saltaba de ×1 a ×1,5 al pasar de 9 a 10 series.
 */
export const porLasSeries = (series: number, alFallo = false) => Math.max(alFallo ? 1.5 : 1, 1 + 0.5 * Math.min(1, Math.max(0, (series - 6) / 6)));

const HORA = 3_600_000;
export type OpcionesDelResidual = { novato?: boolean; unoRM?: UnoRMDe };

/**
 * Lo que le falta recuperar a un músculo en un momento (en %), sumando las sesiones de antes. Con menos
 * de 6 meses entrenando, la constante y la caída, ×1,5 (Newton 2008; Nosaka 2001).
 */
export function residual(musculo: Musculo, sesiones: readonly SesionConBloques[], en: number, opciones: OpcionesDelResidual = {}): number {
  let r = 0;
  for (const s of sesiones) {
    if (s.inicio > en) continue;
    const d = dosisDeLaSesion(s, opciones.unoRM).get(musculo);
    if (!d || d.dosis <= 0) continue;
    const tau = TAU[musculo] * porLasSeries(d.series, d.alFallo) * (opciones.novato ? 1.5 : 1);
    r += caidaInicial(d.dosis) * (opciones.novato ? 1.5 : 1) * Math.exp(-(en - s.inicio) / HORA / tau);
  }
  return r;
}

export type EstadoMuscular = 'recuperado' | 'recuperandose' | 'cargado';
/** Por debajo del 3 %, el ruido de cada día (Grgic 2020), está descansado; hasta 10 %, recuperándose; más, cargado. */
export const estadoDe = (r: number): EstadoMuscular => (r < 3 ? 'recuperado' : r <= 10 ? 'recuperandose' : 'cargado');
const PESO_DEL_ESTADO: Record<EstadoMuscular, number> = { recuperado: 0, recuperandose: 1, cargado: 2 };
/** El peor de unos estados (null sin ninguno): el eslabón más débil manda. */
export const peorEstado = (estados: readonly EstadoMuscular[]): EstadoMuscular | null =>
  estados.length ? estados.reduce((a, b) => (PESO_DEL_ESTADO[b] > PESO_DEL_ESTADO[a] ? b : a)) : null;

/** En cuántas horas baja del 3 % (de a una hora, hasta una semana; null si ya está). Es por dentro: se dice en días. */
export function listoEn(musculo: Musculo, sesiones: readonly SesionConBloques[], en: number, opciones: OpcionesDelResidual = {}): number | null {
  if (residual(musculo, sesiones, en, opciones) < 3) return null;
  for (let h = 1; h <= 168; h++) if (residual(musculo, sesiones, en + h * HORA, opciones) < 3) return h;
  return 168;
}

export type Cuando = 'ya' | 'hoy' | 'manana' | 'pasadoManana' | 'enUnosDias';
/**
 * Cuándo va a estar listo, en días del calendario y no en horas: la cuenta erra de más o menos un día
 * contra los estudios, así que se dice con «probablemente». `minuto` es la hora del momento que se mira,
 * en minutos desde la medianoche.
 */
export function cuandoListo(horas: number | null, minuto: number): Cuando {
  if (horas === null) return 'ya';
  const dias = Math.floor((minuto + horas * 60) / 1440);
  return dias <= 0 ? 'hoy' : dias === 1 ? 'manana' : dias === 2 ? 'pasadoManana' : 'enUnosDias';
}

/**
 * Los músculos que trabajó una sesión como principales, de los que más series tuvieron a los que menos
 * (en un empate, en el orden de MUSCULOS): «Lunes: Pecho, Hombros, Tríceps».
 */
export function musculosTrabajados(sesion: SesionConBloques, unoRM: UnoRMDe = () => null): { musculo: Musculo; series: number }[] {
  const dosis = dosisDeLaSesion(sesion, unoRM);
  return MUSCULOS.flatMap((musculo) => {
    const d = dosis.get(musculo);
    return d && d.series > 0 ? [{ musculo, series: d.series }] : [];
  }).sort((a, b) => b.series - a.series || MUSCULOS.indexOf(a.musculo) - MUSCULOS.indexOf(b.musculo));
}
