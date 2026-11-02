// El saludo del día (spec/saludo.md; lo pediste el 2/11/2026): al abrir Moss, una frase corta con lo de
// hoy, sin IA. Acá van códigos y valores; el texto está en src/textos (saludo.frases.<código>) y lo pone
// la interfaz, como en los avisos. Recibe lo que Moss ya calculó (metas.ts, sueno.ts, horasDeSueno y
// lineasDelDia) y lo que ya dijo.
// - Cierto: cada situación sale de un dato de hoy. Lo que no se sabe no se nombra y lo que ya pasó no se
//   anuncia. La sesión sale de un horario: solo si Ascent la confirma (`hecha`) dice que entrenaste.
// - Sin culpa: nunca reta ni pide compensar, y nunca habla de peso. Con «sin déficit» no hay entrenamiento,
//   proteína ni «te pasaste» (spec/entreno.md, 5.9); con los números ocultos, ni calorías, ni gramos, ni
//   «te pasaste». Lo de la noche corta y el hambre no va: está pendiente (spec/entreno.md, 7.3).
// - Sin plantilla: cada situación tiene frases de formas distintas (observación, sugerencia, pregunta), y
//   las de dos temas cruzan señales («dormiste poco y hoy entrenas»).
// - No se repite: una frase no vuelve en DIAS_SIN_REPETIR días mientras haya otra; en el día no se habla del
//   mismo tema dos veces seguidas si otro tiene algo nuevo que decir (salvo NO_ESPERA), y cambia solo si hay
//   algo distinto que decir o pasó UN_RATO. Es determinista dados los datos, el historial y la semilla.

import { cuenta, type Linea, type Principal, type Sesion } from './alrededorDelEntreno';
import type { Comida } from './comidas';
import { diaDeLaSemana, diasEntre, type ClaveDia, type DiaSemana } from './fechas';
import { estadoDeMacro, type Macros } from './metas';
import type { Cara } from './sueno';

/** `antes` y `despues` son qué comer alrededor de entrenar: cuentan aparte de `entreno` (que hoy entrenas), porque cada uno dice algo nuevo. */
export type Tema = 'primero' | 'sueno' | 'entreno' | 'antes' | 'despues' | 'comida' | 'cama' | 'dia' | 'nada';
/** La forma de la frase: una observación, una sugerencia o una pregunta. */
export type Forma = 'dice' | 'sugiere' | 'pregunta';

type Entrada = {
  temas: readonly Tema[];
  dice?: number;
  sugiere?: number;
  pregunta?: number;
  /** Solo con los números a la vista: lleva calorías o gramos, o habla de pasarse. */
  numeros?: true;
  /** No va con «sin déficit». */
  cuidado?: true;
};

const PRIMERO: readonly Tema[] = ['primero'];
const SUENO: readonly Tema[] = ['sueno'];
const ENTRENO: readonly Tema[] = ['entreno'];
const COMIDA: readonly Tema[] = ['comida'];
const CAMA: readonly Tema[] = ['cama'];
const DIA: readonly Tema[] = ['dia'];
const NADA: readonly Tema[] = ['nada'];
const SUENO_Y_ENTRENO: readonly Tema[] = ['sueno', 'entreno'];
const ANTES: readonly Tema[] = ['antes'];
const DESPUES: readonly Tema[] = ['despues'];

/**
 * Cada situación, con cuántas frases tiene de cada forma: `suenoPoco.dice1`, `suenoPoco.pregunta1`… Los
 * tests comprueban que cada código tenga su texto en es.json y en.json, y que no sobre ninguno.
 */
const CATALOGO = {
  primerDia: { temas: PRIMERO, dice: 2, sugiere: 2, pregunta: 1 },
  primerDiaManana: { temas: PRIMERO, sugiere: 1, pregunta: 1 },
  primerDiaNoche: { temas: PRIMERO, dice: 1, pregunta: 1 },
  primerAnotado: { temas: PRIMERO, dice: 2, sugiere: 1 },

  suenoPoco: { temas: SUENO, dice: 3, sugiere: 2, pregunta: 1 },
  suenoBien: { temas: SUENO, dice: 5, sugiere: 1, pregunta: 2 },
  suenoNormal: { temas: SUENO, dice: 3, sugiere: 1, pregunta: 1 },
  caraMala: { temas: SUENO, dice: 2 },
  caraBuena: { temas: SUENO, dice: 2 },
  deuda: { temas: SUENO, dice: 1, sugiere: 1, pregunta: 1 },

  pocoYEntrena: { temas: SUENO_Y_ENTRENO, cuidado: true, dice: 1, sugiere: 2, pregunta: 1 },
  pocoYDesayuno: { temas: SUENO_Y_ENTRENO, cuidado: true, sugiere: 2, pregunta: 1 },
  bienYEntrena: { temas: SUENO_Y_ENTRENO, cuidado: true, dice: 2, sugiere: 1, pregunta: 1 },
  descansoPoco: { temas: SUENO_Y_ENTRENO, cuidado: true, dice: 2 },
  descansoBien: { temas: SUENO_Y_ENTRENO, cuidado: true, dice: 1, pregunta: 1 },
  entrenaHoy: { temas: ENTRENO, cuidado: true, dice: 2, sugiere: 1, pregunta: 1 },
  descanso: { temas: ENTRENO, cuidado: true, dice: 2, pregunta: 1 },

  previa: { temas: ANTES, cuidado: true, dice: 1, sugiere: 2, pregunta: 1 },
  previaCarbos: { temas: ANTES, cuidado: true, numeros: true, dice: 1, sugiere: 2, pregunta: 1 },
  previaLiviana: { temas: ANTES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  snackPrevio: { temas: ANTES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  snackPrevioCarbos: { temas: ANTES, cuidado: true, numeros: true, dice: 1, sugiere: 1 },
  ayunasLarga: { temas: ANTES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  sesionLarga: { temas: ANTES, cuidado: true, sugiere: 1, pregunta: 1 },
  cafe: { temas: ['antes', 'sueno'], cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  despues: { temas: DESPUES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  despuesProteina: { temas: DESPUES, cuidado: true, numeros: true, dice: 2, sugiere: 2, pregunta: 1 },
  pronto: { temas: DESPUES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  prontoProteina: { temas: DESPUES, cuidado: true, numeros: true, sugiere: 1, pregunta: 1 },
  reponer: { temas: DESPUES, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  dormirProteina: { temas: DESPUES, cuidado: true, numeros: true, dice: 1, sugiere: 1, pregunta: 1 },
  dormirProteinaPalabras: { temas: DESPUES, cuidado: true, sugiere: 1, pregunta: 1 },
  hechoFaltaProteina: { temas: DESPUES, cuidado: true, numeros: true, dice: 2, sugiere: 1, pregunta: 1 },
  hechoFaltaPalabras: { temas: DESPUES, cuidado: true, dice: 1, sugiere: 1 },
  hechoListo: { temas: DESPUES, cuidado: true, dice: 2, pregunta: 1 },
  mananaEntrena: { temas: ENTRENO, cuidado: true, dice: 1, pregunta: 1 },

  lunes: { temas: DIA, dice: 1, sugiere: 1 },
  finDeSemana: { temas: DIA, dice: 1, sugiere: 1, pregunta: 1 },

  diaNuevo: { temas: COMIDA, dice: 2, sugiere: 1, pregunta: 1 },
  metaDeHoy: { temas: COMIDA, numeros: true, cuidado: true, dice: 2, sugiere: 1, pregunta: 1 },
  trasDesayuno: { temas: COMIDA, dice: 2, pregunta: 1 },
  trasAlmuerzo: { temas: COMIDA, dice: 2, sugiere: 1, pregunta: 1 },
  trasMerienda: { temas: COMIDA, dice: 2, sugiere: 1, pregunta: 1 },
  pensarCena: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 2 },
  pensarCenaKcal: { temas: COMIDA, numeros: true, dice: 1, pregunta: 1 },
  diaCerrado: { temas: COMIDA, dice: 5, sugiere: 1, pregunta: 1 },
  proteinaAlDia: { temas: COMIDA, cuidado: true, dice: 2, sugiere: 1 },
  mitadDelDia: { temas: COMIDA, numeros: true, dice: 2, pregunta: 1 },
  sinDesayuno: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 2 },
  sinAlmuerzo: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 2 },
  sinMerienda: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 1 },
  sinCena: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 2 },
  nadaHoy: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 2 },
  quedaAlmuerzo: { temas: COMIDA, numeros: true, dice: 2, pregunta: 1 },
  quedaCena: { temas: COMIDA, numeros: true, dice: 2, sugiere: 1, pregunta: 1 },
  cenaAjustada: { temas: COMIDA, numeros: true, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  metaAntesDeCena: { temas: COMIDA, dice: 1, sugiere: 1, pregunta: 1 },
  queda: { temas: COMIDA, numeros: true, dice: 4, sugiere: 1, pregunta: 1 },
  quedaNoche: { temas: COMIDA, numeros: true, dice: 1, pregunta: 1 },
  quedaPalabras: { temas: COMIDA, dice: 2, sugiere: 1 },
  ritmoBien: { temas: COMIDA, dice: 4 },
  ajustadoFaltaProteina: { temas: COMIDA, numeros: true, cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  ajustadoFaltaPalabras: { temas: COMIDA, cuidado: true, dice: 1, sugiere: 1 },
  proteinaFalta: { temas: COMIDA, numeros: true, cuidado: true, dice: 2, sugiere: 1, pregunta: 1 },
  proteinaFaltaPalabras: { temas: COMIDA, cuidado: true, dice: 1, sugiere: 1 },
  proteinaLista: { temas: COMIDA, cuidado: true, dice: 2, sugiere: 1 },
  justo: { temas: COMIDA, dice: 2, pregunta: 1 },
  justoYProteina: { temas: COMIDA, cuidado: true, dice: 2 },
  pasadoHoy: { temas: COMIDA, numeros: true, cuidado: true, dice: 3, sugiere: 1, pregunta: 1 },
  comioPoco: { temas: COMIDA, dice: 1, pregunta: 1 },
  comioPocoKcal: { temas: COMIDA, numeros: true, dice: 1, sugiere: 1 },
  ayerPasado: { temas: COMIDA, numeros: true, cuidado: true, dice: 3, pregunta: 1 },
  ayerJusto: { temas: COMIDA, dice: 2, pregunta: 1 },
  ayerPoco: { temas: COMIDA, dice: 1, pregunta: 1 },
  ayerNada: { temas: COMIDA, dice: 1, sugiere: 1 },

  camaHoy: { temas: CAMA, dice: 4, sugiere: 2, pregunta: 2 },
  camaCerca: { temas: CAMA, dice: 1, sugiere: 2, pregunta: 1 },
  camaPasada: { temas: CAMA, dice: 1, sugiere: 1, pregunta: 1 },
  camaTarde: { temas: CAMA, dice: 1, sugiere: 1 },
  camaYDeuda: { temas: ['cama', 'sueno'], dice: 1, sugiere: 1, pregunta: 1 },
  camaYPocoSueno: { temas: ['cama', 'sueno'], dice: 1, sugiere: 1, pregunta: 1 },
  camaYMananaEntrena: { temas: ['cama', 'entreno'], cuidado: true, dice: 1, sugiere: 1, pregunta: 1 },
  camaYCena: { temas: ['cama', 'comida'], dice: 1, pregunta: 1 },
  madrugada: { temas: CAMA, dice: 2, pregunta: 1 },

  nadaManana: { temas: NADA, dice: 2 },
  nadaTarde: { temas: NADA, dice: 2 },
  nadaNoche: { temas: NADA, dice: 2 },
} as const satisfies Record<string, Entrada>;

export type Situacion = keyof typeof CATALOGO;
export const SITUACIONES = Object.keys(CATALOGO) as Situacion[];
const entradaDe = (s: Situacion): Entrada => CATALOGO[s];

const FORMAS: readonly Forma[] = ['dice', 'sugiere', 'pregunta'];
const frasesDe = (s: Situacion): string[] =>
  FORMAS.flatMap((forma) => Array.from({ length: entradaDe(s)[forma] ?? 0 }, (_, i) => `${s}.${forma}${i + 1}`));

/** Todos los códigos de frase: el texto de cada uno es `saludo.frases.<código>`. */
export const CODIGOS: readonly string[] = SITUACIONES.flatMap(frasesDe);
export const soloConNumeros = (s: Situacion) => !!entradaDe(s).numeros;
export const noVaSinDeficit = (s: Situacion) => !!entradaDe(s).cuidado;
export const temasDe = (s: Situacion) => entradaDe(s).temas;

const situacionDe = (codigo: string) => codigo.split('.')[0] as Situacion;
const formaDe = (codigo: string) => (codigo.split('.')[1] ?? '').replace(/\d+$/, '') as Forma;
// Un código guardado por otra versión de Moss puede no estar más en el catálogo.
const temasDelCodigo = (codigo: string): readonly Tema[] => (CATALOGO as Record<string, Entrada>)[situacionDe(codigo)]?.temas ?? [];

/** Una sesión de hoy: `hecha`, si Ascent la confirma; si no, Moss solo sabe que estaba en el horario. */
export type SesionDeHoy = Sesion & { hecha?: boolean };

export type Anoche = {
  /** Los minutos dormidos. Una noche de confianza baja no llega acá: es null. */
  dormido: number;
  /** Cómo dijo que durmió a la mañana. */
  cara?: Cara | null;
  /** pareceIncompleta (sueno.ts): el reloj se quedó sin batería o se lo sacó. De esa noche no se habla. */
  incompleta?: boolean;
};

/** Lo que Moss sabe del día, ya calculado. */
export type DelDia = {
  /** El día de Moss (diaLogico): lo de la madrugada es del día anterior. */
  dia: ClaveDia;
  /** Ahora, en minutos en la cuenta de ese día (minutosEnElDia): pasada la medianoche, más de 1440. */
  ahora: number;
  /** Perfil › Los números. */
  numeros: boolean;
  /** Perfil › Cuidados. */
  sinDeficit: boolean;
  /** Los días anteriores con algo anotado: con 0 y nada anotado hoy, es el primer día. */
  diasConDatos: number;

  meta: Macros | null;
  comido: Macros;
  /** Las comidas ya anotadas hoy, sin lo planificado. */
  anotadas: readonly Comida[];
  horaDeComida: Record<Principal, number>;
  /** Las que suele anotar: de las otras no pregunta (quien no desayuna no tiene por qué leerlo cada mañana). */
  habituales?: readonly Comida[];
  /** Lo de ayer: `kcal` 0 si no anotó nada; null si no se sabe (todavía no había días). */
  ayer: { kcal: number; meta: number } | null;

  anoche: Anoche | null;
  /** Lo que necesita dormir (necesidad, en sueno.ts). */
  necesidad: number;
  /** La deuda de las dos semanas, en minutos (deudaDeSueno). */
  deuda: number | null;
  /** horasDeSueno (avisos.ts); null sin noches para saberlo. */
  horas: { despertar: number | null; dormir: number | null; acostarse: number | null; despertarManana: number | null } | null;

  /** sesionesDelDia, con lo que Ascent confirme; vacío, un día sin entrenar. */
  sesiones: readonly SesionDeHoy[];
  /** lineasDelDia: ya respeta «sin déficit» y lo que ya se anotó. */
  lineas: readonly Linea[];
  /** Si hay un horario de entreno: sin él, un día sin sesión no es un día de descanso. */
  entrenaAlgunDia: boolean;
  /** A qué hora entrena mañana, si entrena. */
  sesionManana: number | null;
};

/** Lo que va en el texto: {kcal}, {p}, {c}, {hora}, {comida}… Los tiempos, en minutos. */
export type Valores = {
  kcal?: number;
  p?: number;
  c?: number;
  /** El porcentaje de la meta. */
  pct?: number;
  /** La hora de la sesión o la de ir a la cama, según la frase. */
  hora?: number;
  /** La hora del entreno de mañana. */
  entreno?: number;
  despertar?: number;
  /** Cuánto durmió o cuánto dormiría. */
  horas?: number;
  anoche?: number;
  deuda?: number;
  tiempo?: number;
  comida?: Comida;
  dia?: DiaSemana;
};

export type Candidato = { situacion: Situacion; peso: number; valores: Valores };

export type Saludo = {
  codigo: string;
  situacion: Situacion;
  temas: readonly Tema[];
  forma: Forma;
  valores: Valores;
  /** Lo que se podía decir en este momento: si no cambia, tampoco cambia la frase. */
  firma: string;
  /** Si es otra frase que la anterior: la interfaz la anima y la suma al historial. */
  nuevo: boolean;
};

/** Lo que ya dijo. */
export type Dicho = { codigo: string; dia: ClaveDia; minuto: number; firma: string };

/** Una frase no vuelve antes de esto, mientras la situación tenga otra. */
export const DIAS_SIN_REPETIR = 21;
/** Con lo mismo para decir, la frase queda este rato: abrir y cerrar Moss no pasa por todas. */
export const UN_RATO = 120;
/** Tres semanas de saludos, con unos siete por día. */
export const LARGO_DEL_HISTORIAL = 150;
/** Lo que cuenta como poco sueño y como dormir bien, contra lo que necesita. */
const POCO_SUENO = 60;
const SUENO_BIEN = 30;
/** Desde esta deuda se la nombra, como el aviso de dormir (avisos.ts). */
const DEUDA_QUE_SE_NOMBRA = 60;
/** Desde 100 kcal arriba de la meta, se pasó; más cerca, está justo. */
const JUSTO_KCAL = 100;
/** Si queda poco, la cena o la proteína tienen que entrar en eso. */
const POCO_MARGEN = 300;
/** Con menos de esto no se habla de «una buena comida»: la cena tiene que ser simple. */
const CENA_ENTERA = 500;
/** Lo que tiene que faltar de proteína para decirlo: lo mismo que antes de dormir (alrededorDelEntreno.ts). */
const FALTA_DE_PROTEINA = 25;
/** Con la cena anotada y menos de esto de la meta, comió poco o algo quedó sin anotar. */
const COMIO_POCO = 0.65;
/** Ayer: una diferencia que no sea de todos los días. */
const AYER_PASADO = 200;
const AYER_POCO = 0.6;
/** Cuánto de la meta suele estar comido después de cada comida: para saber si va a buen ritmo. */
const PARTE: Record<Comida, number> = { desayuno: 0.25, almuerzo: 0.35, merienda: 0.15, cena: 0.25, snack: 0.05 };
/** Lo que se aparta de ese ritmo sin que cuente. */
const RITMO = 0.12;
/** Hasta cuántas horas antes de ir a la cama se habla de ella. */
const CAMA_DESDE = 240;
const CAMA_CERCA = 60;
/** Con menos de 3 horas de sueño por delante, sin cuentas: no ayudan. */
const SUENO_MINIMO = 180;
/** Desde este peso no espera su turno: lo que importa ahora se dice aunque repita el tema (la proteína después de entrenar, la cama). */
export const NO_ESPERA = 9.5;

const PRINCIPALES: readonly Principal[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];
const SIN_ANOTAR: Record<Principal, Situacion> = { desayuno: 'sinDesayuno', almuerzo: 'sinAlmuerzo', merienda: 'sinMerienda', cena: 'sinCena' };

const aCinco = (x: number) => Math.round(x / 5) * 5;
const aDiez = (x: number) => Math.round(x / 10) * 10;
/** Como lo diría alguien: «unas 650 kcal», no «unas 637»; el número exacto está en Inicio. Lo poco importa más. */
const aproximar = (kcal: number) => (kcal < POCO_MARGEN ? aDiez(kcal) : Math.round(kcal / 50) * 50);

export type Momento = 'manana' | 'mediodia' | 'tarde' | 'noche' | 'madrugada';

/**
 * El momento del día: de reloj, salvo que el día empiece tarde (la mañana dura hasta 2 horas y media
 * después de despertarse, hasta las 14) o se acueste temprano (la noche empieza 3 horas antes de la cama).
 */
export function momentoDe(d: Pick<DelDia, 'ahora' | 'horas'>): Momento {
  const { ahora } = d;
  if (ahora >= 24 * 60 || ahora < 4 * 60) return 'madrugada';
  const finDeLaManana = Math.max(11 * 60, Math.min((d.horas?.despertar ?? 0) + 150, 14 * 60));
  if (ahora < finDeLaManana) return 'manana';
  const acostarse = d.horas?.acostarse;
  if (ahora >= Math.min(19.5 * 60, acostarse == null ? Infinity : acostarse - 180)) return 'noche';
  return ahora < 15.5 * 60 ? 'mediodia' : 'tarde';
}

type Di = (situacion: Situacion, peso: number, valores?: Valores) => void;

function delSueno(d: DelDia, m: Momento, di: Di, proxima: SesionDeHoy | undefined, sinSesion: boolean) {
  if (m !== 'manana' && m !== 'mediodia') return;
  const peso = m === 'manana' ? 8 : 3;
  if (d.deuda !== null && d.deuda >= DEUDA_QUE_SE_NOMBRA) di('deuda', peso - 3, { deuda: aCinco(d.deuda) });
  const n = d.anoche;
  if (!n || n.incompleta) return;
  const horas = aCinco(n.dormido);
  const mala = n.cara != null && n.cara <= 2;
  const buena = n.cara != null && n.cara >= 4;
  const poco = n.dormido < d.necesidad - POCO_SUENO;
  const bien = !poco && !mala && n.dormido >= d.necesidad - SUENO_BIEN;
  // Lo que cruza dos señales gana a cada una; con la sesión de hoy, la noche sola ya no hace falta.
  const cruza = peso + 1;
  if (proxima) {
    if (poco) di('pocoYEntrena', cruza, { horas, hora: proxima.inicio });
    if (poco && m === 'manana' && !d.anotadas.includes('desayuno')) di('pocoYDesayuno', cruza);
    if (bien) di('bienYEntrena', cruza, { horas, hora: proxima.inicio });
  }
  if (sinSesion && d.entrenaAlgunDia) {
    if (poco) di('descansoPoco', cruza, { horas });
    if (bien) di('descansoBien', cruza, { horas });
  }
  if (poco && buena) di('caraBuena', cruza, { horas });
  else if (!poco && mala) di('caraMala', cruza, { horas });
  else if (proxima && (poco || bien)) return;
  else if (poco) di('suenoPoco', peso, { horas });
  else if (bien) di('suenoBien', peso, { horas });
  // Una noche del montón dice poco: cualquier otra cosa puede ganarle.
  else di('suenoNormal', peso - 1, { horas });
}

function delEntreno(d: DelDia, m: Momento, di: Di, sesiones: readonly SesionDeHoy[], siguiente: Principal | null) {
  const { ahora, meta, comido } = d;
  const proxima = sesiones.find((s) => !s.hecha && ahora < s.inicio);
  if (proxima) di('entrenaHoy', 4, { hora: proxima.inicio });
  if (!sesiones.length && d.entrenaAlgunDia && (m === 'manana' || m === 'mediodia')) di('descanso', 5);
  if (d.sesionManana !== null && m === 'noche') di('mananaEntrena', 4, { entreno: d.sesionManana });

  for (const l of d.lineas) {
    const sesion = sesiones.find((s) => s.inicio === l.hora);
    const { comida, hora } = l;
    // La comida que viene pesa más que una que todavía está lejos.
    const cerca = comida === 'snack' || d.horaDeComida[comida] - ahora <= 120;
    const peso = cerca ? 8 : 5;
    const antes = l.clase === 'previa' || l.clase === 'previaLiviana' || l.clase === 'snackPrevio' || l.clase === 'ayunasLarga';
    // Lo de antes sale del horario: si Ascent dice que ya entrenó, ya no va.
    if (antes && sesion?.hecha) continue;
    if (l.clase === 'previa') di('previa', peso, { comida, hora });
    if (l.clase === 'previaLiviana') di('previaLiviana', peso, { comida, hora });
    if ((l.clase === 'previa' || l.clase === 'previaLiviana') && l.carbohidratos) di('previaCarbos', peso, { comida, hora, c: l.carbohidratos });
    if (l.clase === 'snackPrevio') {
      di('snackPrevio', peso, { hora });
      if (l.carbohidratos) di('snackPrevioCarbos', peso, { hora, c: l.carbohidratos });
    }
    if (l.clase === 'ayunasLarga') di('ayunasLarga', peso, { hora });
    if (l.durantePorHora) di('sesionLarga', peso - 2, { hora });
    if (l.cafeinaHasta !== undefined && ahora < l.cafeinaHasta) di('cafe', 6, { hora: l.cafeinaHasta });
    if (l.clase === 'despues') {
      di('despues', NO_ESPERA, { comida });
      if (l.proteina) di('despuesProteina', NO_ESPERA, { comida, p: l.proteina });
    }
    if (l.clase === 'despuesPronto') {
      di('pronto', NO_ESPERA, { comida });
      if (l.proteina) di('prontoProteina', NO_ESPERA, { p: l.proteina });
    }
    if (l.clase === 'reponer') di('reponer', NO_ESPERA, { comida, hora });
    if (l.clase === 'antesDeDormir') {
      di('dormirProteinaPalabras', 8);
      if (l.proteina) di('dormirProteina', 8, { p: l.proteina });
    }
  }

  // Lo único que se afirma de una sesión es lo que Ascent confirma.
  if (meta && sesiones.some((s) => s.hecha)) {
    if (estadoDeMacro(comido.proteina, meta.proteina) !== 'falta') di('hechoListo', 8, { dia: diaDeLaSemana(d.dia) });
    else if (meta.proteina - comido.proteina >= FALTA_DE_PROTEINA && siguiente) {
      di('hechoFaltaProteina', 10, { p: aCinco(meta.proteina - comido.proteina), comida: siguiente });
      di('hechoFaltaPalabras', 10, { comida: siguiente });
    }
  }
}

function deLaComida(d: DelDia, m: Momento, di: Di) {
  // De madrugada lo único que importa es dormir.
  if (m === 'madrugada') return;
  const { ahora, meta, comido } = d;
  const anotada = (c: Comida) => d.anotadas.includes(c);
  const habitual = (c: Comida) => !d.habituales || d.habituales.includes(c);
  const enSuHora = (c: Principal) => ahora >= d.horaDeComida[c] - 30 && ahora < d.horaDeComida[c] + (c === 'merienda' ? 90 : 180);
  const hayComida = d.anotadas.length > 0;
  const cena = anotada('cena');
  const hoy = diaDeLaSemana(d.dia);

  if (d.diasConDatos > 0 && !hayComida && ahora >= 12 * 60) di('nadaHoy', 7);
  const toca = [...PRINCIPALES].reverse().find(enSuHora);
  if (toca && !anotada(toca) && habitual(toca)) di(SIN_ANOTAR[toca], 6);
  if (m === 'manana' && !hayComida) di('diaNuevo', 5);
  if (m === 'manana' && anotada('desayuno') && !anotada('almuerzo')) di('trasDesayuno', 6);
  if ((m === 'mediodia' || m === 'tarde') && anotada('almuerzo') && !anotada('merienda') && !cena) di('trasAlmuerzo', 5);
  if (m === 'tarde' && anotada('merienda') && !cena) di('trasMerienda', 5);
  if (m === 'tarde' && !cena && ahora >= 16.5 * 60) di('pensarCena', 5);
  if (m === 'noche' && cena) di('diaCerrado', 6);
  if (m === 'manana' && hoy === 1) di('lunes', 6);
  if ((m === 'manana' || m === 'mediodia') && (hoy === 6 || hoy === 0)) di('finDeSemana', m === 'manana' ? 6 : 3, { dia: hoy });

  if (!meta || meta.kcal <= 0) return;
  if (d.ayer && d.diasConDatos > 0 && (m === 'manana' || m === 'mediodia')) {
    const peso = m === 'manana' ? 6 : 2;
    const { kcal, meta: metaDeAyer } = d.ayer;
    if (kcal === 0) di('ayerNada', peso);
    // Después de un día grande, lo que más ayuda a la mañana es que nadie haga un drama.
    else if (kcal - metaDeAyer >= AYER_PASADO) di('ayerPasado', peso + 3, { kcal: aproximar(kcal - metaDeAyer) });
    else if (Math.abs(kcal - metaDeAyer) <= JUSTO_KCAL) di('ayerJusto', peso);
    else if (kcal < metaDeAyer * AYER_POCO) di('ayerPoco', peso);
  }

  const queda = meta.kcal - comido.kcal;
  const kcal = aproximar(Math.abs(queda));
  const falta = meta.proteina - comido.proteina;
  const p = aCinco(falta);
  const proteinaLista = estadoDeMacro(comido.proteina, meta.proteina) !== 'falta';
  const faltaProteina = falta >= FALTA_DE_PROTEINA;
  const esperado = Math.min(1, d.anotadas.reduce((s, c) => s + PARTE[c], 0));
  const fraccion = comido.kcal / meta.kcal;
  const fraccionDeProteina = comido.proteina / Math.max(1, meta.proteina);
  const aLaTardeONoche = m === 'tarde' || m === 'noche';

  if (m === 'manana' && !hayComida) di('metaDeHoy', 5, { kcal: aDiez(meta.kcal), p: aCinco(meta.proteina) });
  if (hayComida && (m === 'mediodia' || m === 'tarde')) {
    if (Math.abs(fraccion - esperado) <= RITMO) {
      di('ritmoBien', 5);
      di('mitadDelDia', 5, { pct: aCinco(fraccion * 100) });
    }
    if (!proteinaLista && fraccionDeProteina >= esperado - 0.05) di('proteinaAlDia', 4);
    if (queda > POCO_MARGEN) {
      di('quedaPalabras', 4);
      di('queda', 5, { kcal });
    }
  }
  if ((m === 'manana' || m === 'mediodia') && hayComida && !anotada('almuerzo') && queda > POCO_MARGEN) di('quedaAlmuerzo', 6, { kcal });
  if (m === 'tarde' && !cena && ahora >= 16.5 * 60 && queda > POCO_MARGEN) di('pensarCenaKcal', 5, { kcal });

  if (m === 'noche' && !cena && queda > JUSTO_KCAL) {
    if (queda > CENA_ENTERA) di('quedaCena', 7, { kcal });
    else di('cenaAjustada', 7, { kcal });
  }
  // Nunca se sugiere saltear una comida: si ya llegó a la meta, la cena va igual.
  if (aLaTardeONoche && hayComida && !cena && queda <= JUSTO_KCAL) di('metaAntesDeCena', 8);

  if (aLaTardeONoche && hayComida) {
    if (faltaProteina && queda > -JUSTO_KCAL && queda <= POCO_MARGEN) {
      di('ajustadoFaltaProteina', NO_ESPERA, { p, kcal });
      di('ajustadoFaltaPalabras', NO_ESPERA);
    } else if (faltaProteina && queda > POCO_MARGEN && fraccionDeProteina < esperado - 0.15) {
      di('proteinaFalta', 7, { p });
      di('proteinaFaltaPalabras', 7);
    }
    if (proteinaLista && queda > 150) di('proteinaLista', 5);
  }
  // Con la cena anotada, o ya muy tarde, el día está cerrado.
  const cerrado = cena || ahora >= d.horaDeComida.cena + 120;
  if (aLaTardeONoche && hayComida && cerrado) {
    if (queda < -JUSTO_KCAL) di('pasadoHoy', m === 'tarde' ? 6 : 8, { kcal });
    else if (Math.abs(queda) <= JUSTO_KCAL) {
      di('justo', 8);
      if (proteinaLista) di('justoYProteina', 9);
    } else if (comido.kcal < meta.kcal * COMIO_POCO) {
      di('comioPoco', 7);
      di('comioPocoKcal', 7, { kcal });
    } else if (m === 'noche') {
      di('quedaNoche', 5, { kcal });
      di('quedaPalabras', 4);
    }
  }
}

function deLaCama(d: DelDia, m: Momento, di: Di) {
  const { ahora, horas } = d;
  if (m === 'madrugada') di('madrugada', 5);
  const acostarse = horas?.acostarse ?? null;
  const dormir = horas?.dormir ?? null;
  const despertar = horas?.despertarManana ?? null;
  if (acostarse === null || dormir === null || despertar === null) return;
  const falta = acostarse - ahora;
  if (falta > CAMA_DESDE) return;
  const hora = acostarse;
  if (falta > 0) {
    // Cerca de la hora, nada importa más que eso.
    const peso = falta > 120 ? 5 : falta > CAMA_CERCA ? 7 : 10;
    if (falta <= CAMA_CERCA) di('camaCerca', peso, { tiempo: Math.max(5, aCinco(falta)), hora });
    else di('camaHoy', peso, { hora, horas: aCinco(despertar - dormir), despertar });
    if (d.deuda !== null && d.deuda >= DEUDA_QUE_SE_NOMBRA) di('camaYDeuda', peso + 1, { deuda: aCinco(d.deuda), hora });
    if (d.anoche && !d.anoche.incompleta && d.anoche.dormido < d.necesidad - POCO_SUENO) di('camaYPocoSueno', peso + 1, { anoche: aCinco(d.anoche.dormido), hora });
    if (d.sesionManana !== null) di('camaYMananaEntrena', peso + 1, { entreno: d.sesionManana, hora, horas: aCinco(despertar - dormir) });
    if (!d.anotadas.includes('cena') && falta <= 150 && d.meta) di('camaYCena', peso + 1, { hora });
    return;
  }
  if (falta <= -CAMA_DESDE) return;
  const quedan = despertar - (ahora + (dormir - acostarse));
  if (quedan >= SUENO_MINIMO) di('camaPasada', NO_ESPERA, { horas: aCinco(quedan) });
  else di('camaTarde', NO_ESPERA);
}

/**
 * Todo lo que hay para decir ahora, con cuánto importa (de 0 a 10): lo que cruza dos señales pesa más que
 * cada una, y cada tema pesa según la hora: a la mañana, cómo durmió y qué viene; al mediodía, lo que
 * falta; antes de entrenar, qué comer; después, la proteína; a la noche, lo que queda y la cama.
 */
export function candidatos(d: DelDia): Candidato[] {
  const r: Candidato[] = [];
  const di: Di = (situacion, peso, valores = {}) => {
    const e = entradaDe(situacion);
    if ((e.numeros && !d.numeros) || (e.cuidado && d.sinDeficit)) return;
    r.push({ situacion, peso, valores });
  };
  const m = momentoDe(d);

  if (d.diasConDatos === 0 && !d.anotadas.length) {
    // No sabe casi nada: no finge conocer a la persona.
    di('primerDia', 5);
    if (m === 'manana') di('primerDiaManana', 6);
    if (m === 'noche' || m === 'madrugada') di('primerDiaNoche', 6);
    return r;
  }
  if (d.diasConDatos === 0) di('primerAnotado', 9);

  const habitual = (c: Comida) => !d.habituales || d.habituales.includes(c);
  const siguiente = PRINCIPALES.find((c) => !d.anotadas.includes(c) && habitual(c) && d.horaDeComida[c] >= d.ahora - 90) ?? null;
  const sesiones = (d.sinDeficit ? [] : d.sesiones.filter(cuenta)).slice().sort((a, b) => a.inicio - b.inicio);
  delSueno(d, m, di, sesiones.find((s) => !s.hecha && d.ahora < s.inicio), !sesiones.length);
  delEntreno(d, m, di, sesiones, siguiente);
  deLaComida(d, m, di);
  deLaCama(d, m, di);

  // Sin nada para decir, un saludo; nunca le gana a algo con datos.
  if (!r.length) di(m === 'manana' ? 'nadaManana' : m === 'noche' || m === 'madrugada' ? 'nadaNoche' : 'nadaTarde', 1);
  return r;
}

function resumen(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Un azar repetible (mulberry32): con la misma semilla, los mismos números. */
function generador(semilla: number): () => number {
  let s = semilla;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cuánto puede mover el azar a un candidato: dos de pesos parecidos se turnan. */
const AZAR = 2;
/** Lo que se le resta a un tema que ya se tocó hoy y a una situación por cada vez en los últimos 3 días. */
const YA_HOY = 3;
const RECIENTE = 1.2;

/**
 * El saludo de ahora. Con la misma firma, el mismo día y menos de UN_RATO, queda la frase de antes (con
 * los valores de ahora). Si no, gana el candidato que más pesa entre los que tienen algo sin decir y no
 * repiten el tema de recién, y de sus frases, una sin usar y de otra forma que la anterior.
 */
export function saludoDelDia(d: DelDia, historial: readonly Dicho[], semilla: string | number): Saludo {
  const todos = candidatos(d);
  const firma = resumen(`${todos.map((c) => c.situacion).sort().join()}|${[...d.anotadas].sort().join()}`).toString(36);
  const ultimo = historial[historial.length - 1];
  const armarSaludo = (c: Candidato, codigo: string, nuevo: boolean): Saludo => ({
    codigo, situacion: c.situacion, temas: entradaDe(c.situacion).temas, forma: formaDe(codigo), valores: c.valores, firma, nuevo,
  });

  if (ultimo && ultimo.dia === d.dia && ultimo.firma === firma && d.ahora - ultimo.minuto < UN_RATO) {
    const sigue = todos.find((c) => c.situacion === situacionDe(ultimo.codigo));
    if (sigue) return armarSaludo(sigue, ultimo.codigo, false);
  }

  const azar = generador(resumen(`${semilla}|${d.dia}|${d.ahora}|${historial.length}`));
  const hace = (h: Dicho) => diasEntre(h.dia, d.dia);
  const usadas = new Set(historial.filter((h) => hace(h) < DIAS_SIN_REPETIR).map((h) => h.codigo));
  // Lo de recién es de hoy: lo último de anoche no le saca la palabra a lo más importante de esta mañana.
  const recien = ultimo && ultimo.dia === d.dia ? ultimo : null;
  const temasDeRecien = recien ? temasDelCodigo(recien.codigo) : [];
  const temasDeAyer = ultimo && !recien && hace(ultimo) === 1 ? temasDelCodigo(ultimo.codigo) : [];
  const temasDeHoy = historial.filter((h) => h.dia === d.dia).flatMap((h) => temasDelCodigo(h.codigo));
  const comparten = (c: Candidato, temas: readonly Tema[]) => entradaDe(c.situacion).temas.some((t) => temas.includes(t));
  const deOtroTema = (lista: Candidato[]) => {
    const otros = lista.filter((c) => c.peso >= NO_ESPERA || !comparten(c, temasDeRecien));
    return otros.length ? otros : lista;
  };
  const libresDe = (s: Situacion) => frasesDe(s).filter((f) => !usadas.has(f));

  const conLibres = todos.filter((c) => libresDe(c.situacion).length);
  if (!conLibres.length) {
    // Ya se dijo todo lo que se puede decir: vuelve lo que hace más que no se dice.
    const ultimaVez = (f: string) => historial.reduce((n, h, i) => (h.codigo === f ? i : n), -1);
    const { c, f } = deOtroTema(todos).flatMap((x) => frasesDe(x.situacion).map((f) => ({ c: x, f }))).reduce((a, b) => (ultimaVez(b.f) < ultimaVez(a.f) ? b : a));
    return armarSaludo(c, f, true);
  }
  const puntaje = (c: Candidato) => {
    const veces = historial.filter((h) => hace(h) < 3 && situacionDe(h.codigo) === c.situacion).length;
    return c.peso + azar() * AZAR - veces * RECIENTE - (comparten(c, temasDeHoy) ? YA_HOY : 0) - (comparten(c, temasDeAyer) ? 1 : 0);
  };
  const elegido = deOtroTema(conLibres).map((c) => ({ c, p: puntaje(c) })).reduce((a, b) => (b.p > a.p ? b : a)).c;
  const libres = libresDe(elegido.situacion);
  const deOtraForma = recien ? libres.filter((f) => formaDe(f) !== formaDe(recien.codigo)) : libres;
  const pozo = deOtraForma.length ? deOtraForma : libres;
  return armarSaludo(elegido, pozo[Math.floor(azar() * pozo.length)], true);
}

/** El historial después de este saludo: solo cuenta lo nuevo, y se queda con lo último. */
export function recordar(historial: readonly Dicho[], s: Saludo, d: Pick<DelDia, 'dia' | 'ahora'>): Dicho[] {
  if (!s.nuevo) return [...historial];
  return [...historial, { codigo: s.codigo, dia: d.dia, minuto: d.ahora, firma: s.firma }].slice(-LARGO_DEL_HISTORIAL);
}

/** Cómo se escribe cada valor en el idioma de la interfaz. */
export type Formato = {
  numero: (n: number) => string;
  hora: (minutos: number) => string;
  duracion: (minutos: number) => string;
  /** Con su artículo: «la merienda». */
  comida: (c: Comida) => string;
  dia: (d: DiaSemana) => string;
};

/** El texto de un saludo, con su plantilla del diccionario. La primera letra va en mayúscula: puede empezar con {comida}. */
export function armar(plantilla: string, v: Valores, f: Formato): string {
  const texto = plantilla.replace(/\{(\w+)\}/g, (marca, clave: string) => {
    const x = v[clave as keyof Valores];
    // Un {valor} sin dato queda a la vista, como en t(): los tests lo buscan.
    if (x === undefined) return marca;
    if (clave === 'comida') return f.comida(x as Comida);
    if (clave === 'dia') return f.dia(x as DiaSemana);
    if (clave === 'hora' || clave === 'entreno' || clave === 'despertar') return f.hora(x as number);
    if (clave === 'horas' || clave === 'anoche' || clave === 'deuda' || clave === 'tiempo') return f.duracion(x as number);
    return f.numero(x as number);
  });
  return texto.replace(/^(¿?)([a-zñáéíóú])/, (_, signo: string, letra: string) => signo + letra.toUpperCase());
}
