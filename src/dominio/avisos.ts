// Los avisos (lo pediste el 23/10/2026): la hora de dormir como Rise, los de cada hábito y los de
// las comidas, con un máximo por día. El 26/10 sumaste el horario de comidas (avisa a la hora de comer,
// para comer ordenado) y pesarse a la mañana. El 2/11 los quisiste simples: cada uno dice una sola
// cosa, y nada de lo que ya pasó. Pocos y útiles: Moss nunca insiste. Acá van códigos; el texto, sin
// culpa, sale de textoDelAviso con las palabras de src/textos.
// - El plan de cada día sale de lo que elegiste y de las horas de siempre, no de lo que ya hiciste:
//   no cambia en el día, así que al reprogramar (cada vez que se abre Moss o se anota algo) lo que
//   ya sonó no vuelve a sonar y el máximo no se pasa. Lo hecho y lo anotado solo sacan avisos.
// - Nada se junta: entre dos avisos hay al menos 20 minutos. Si dos caen más cerca, el que importa
//   menos espera (como mucho 45 minutos: más tarde ya no viene al caso, y no suena).
// - No avisa lo que ya pasó: un hábito hecho, una comida anotada o una posterior (con la cena anotada,
//   la merienda ya fue), entrenar si la sesión de hoy ya empezó o ya entrenaste con Ascent.
// - El máximo cuenta las veces que suena. Si sobran, quedan primero el de dormir (el que más depende
//   de la hora), después los de hábitos (se eligen uno por uno) y al final los de comidas (un respaldo:
//   casi siempre ya se anotó); entre iguales, el más temprano. Lo que falta (loQueFalta.ts) va aparte,
//   con su propio tope.
// - Las horas son de reloj, en minutos desde la medianoche del día, sin instantes ni zonas: un
//   cambio de hora no corre nada. La noche es del día en que empieza: un aviso a las 0:15 de esa
//   noche es 1455. Cada día se agrupa aparte.
// - Lo que conviene hacer (el 3/11, como Rise: comer antes de entrenar, el café, la última comida
//   grande, las luces...) lo arma loQueConviene.ts y entra acá, en el mismo máximo, con su prioridad.

import { horasCorridas, type Comida } from './comidas';
import { claveDeMarca, type Marca } from './dias';
import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { tocaElDia, type Fuente, type Habito } from './habitos';
import type { Conviene } from './loQueConviene';
import type { FaltaConHora, Falta } from './loQueFalta';
import { DESPUES_MIN, DIAS } from './recordatorios';

/** Lo que pasa en el día y puede llamar al aviso de un hábito: anotar una comida o entrenar con Ascent. */
export type Evento = Exclude<Comida, 'snack'> | 'entrenamiento';

/** De qué sale la hora del aviso de un hábito, en minutos. */
export type Cuando =
  | { tipo: 'hora'; minutos: number }
  | { tipo: 'despertar'; despues: number }
  | { tipo: 'dormir'; antes: number }
  | { tipo: 'evento'; evento: Evento; despues: number };

export type AvisoDeHabito = {
  habito: string;
  cuando: Cuando;
  /** Los días de la semana en que avisa; vacío, todos los del hábito. Un día que el hábito no toca nunca avisa. */
  dias: DiaSemana[];
  /** Lo escribe el usuario, hasta 120 letras; sin él, la interfaz usa el nombre del hábito. */
  mensaje?: string;
};

/** Lo que se eligió: todo opcional y apagado de fábrica. */
export type Avisos = {
  /** El de la hora de dormir, y cuántos minutos antes (30 de fábrica). */
  dormir?: { encendido: boolean; antes?: number };
  habitos?: AvisoDeHabito[];
  /** Las comidas que avisan si a su hora de siempre no se anotaron (recordatorios.ts). */
  comidas?: Comida[];
  /**
   * El horario de comidas, para comer ordenado: cada comida elegida avisa a su hora, en minutos
   * desde la medianoche, si todavía no se anotó. Con horario, lo de «sin anotar» cuenta desde esta hora.
   */
  horario?: Partial<Record<Comida, number>>;
  /** Pesarse a la mañana, al rato de despertarse: el día del control o, con `todos`, cada día. */
  pesarse?: { encendido: boolean; todos?: boolean };
  /** Cuántas veces puede sonar por día, como mucho (6 de fábrica). */
  maximoPorDia?: number;
  /** Lo que falta (loQueFalta.ts): sin elegir, anda si hay algún otro aviso prendido. */
  falta?: { encendido: boolean };
  /** Lo que conviene hacer (loQueConviene.ts), cada uno con su interruptor y apagado de fábrica. */
  antesDeEntrenar?: { encendido: boolean };
  despuesDeEntrenar?: { encendido: boolean };
  cafe?: { encendido: boolean };
  ultimaComida?: { encendido: boolean };
  entrenarTarde?: { encendido: boolean };
  luces?: { encendido: boolean };
  /** Solo con Ascent vinculada. */
  recuperacion?: { encendido: boolean };
};

/** Lo del sueño que usan los avisos. */
export type Sueno = {
  /**
   * Lo de siempre de la noche que termina ese día, en minutos desde las 18 del anterior: habitualDe
   * (sinReloj.ts), que mira solo las noches de antes y así no cambia en el día.
   */
  habitual: (noche: ClaveDia) => { dormirse: number; despertar: number } | null;
  /** La alarma de la mañana de cada día de la semana, si se sabe, en minutos desde la medianoche: gana a lo de siempre. */
  alarmas?: Partial<Record<DiaSemana, number>>;
  /** Lo que hace falta dormir (necesidad, en sueno.ts). */
  necesidad: number;
  /** La deuda de las dos semanas (deudaDeSueno), en minutos; null mientras no hay. */
  deuda: number | null;
  /**
   * Cuánto tardás en dormirte desde que te acostás, en minutos (D33: lo que aprende Moss o lo que
   * elegiste en «Tardo en dormirme»). La hora de ir a la cama es la de dormirte menos esto.
   */
  latencia?: number;
};

/**
 * Un aviso: el de dormir, el de un hábito, el de una comida (sin anotar o a su hora), el de pesarse, lo que
 * falta o lo que conviene hacer (comer antes de entrenar, el café, la última comida grande...).
 */
export type Aviso = {
  /**
   * 'dormir', 'comida:cena', 'horario:cena', 'pesarse', 'falta:proteina', 'habito:<id>:<n>' (el n-ésimo aviso
   * de ese hábito, desde 0) o los de lo que conviene: 'antesDeEntrenar:0', 'cafe', 'ultimaComida', 'luces'...
   */
  id: string;
  /** Su hora, en minutos desde la medianoche del día; lo de la noche puede pasar de 1440. */
  minutos: number;
  tipo: 'dormir' | 'habito' | 'comida' | 'horario' | 'pesarse' | 'falta'
    | 'antesDeEntrenar' | 'despuesDeEntrenar' | 'cafe' | 'ultimaComida' | 'entrenarTarde' | 'luces' | 'recuperacion';
  /** En los de lo que conviene: qué dice (loQueConviene.ts). */
  conviene?: Conviene;
  /** Los avisos de ese día que este deja sin sentido: el de comer antes de entrenar reemplaza la hora de esa comida. */
  reemplaza?: readonly string[];
  /**
   * Ya no hace falta (entrenaste a otra hora) o todavía no se sabe qué decir (la recuperación de esa mañana):
   * no suena, pero guarda su lugar en el máximo.
   */
  sobra?: true;
  /** Desde qué minuto sobra, si se sabe: si es antes de su hora, le deja el lugar a lo primero que reemplazaba. */
  sobraDesde?: number;
  /** En el de lo que falta: qué, cuánto y la idea. */
  falta?: Falta;
  /** En el de pesarse, si ese día es el del control: el texto lo dice. */
  control?: boolean;
  habito?: string;
  comida?: Comida;
  mensaje?: string;
  /** En el de dormir, la hora de ir a la cama (en la misma cuenta que `minutos`), para el texto. */
  dormirA?: number;
  /** En el de dormir, qué dice esta noche (textoDeDormir), a qué hora te despertarías y cuánto dormirías. */
  texto?: TextoDeDormir;
  despertarA?: number;
  duerme?: number;
  /** En el de dormir, la deuda en minutos, si el texto de esta noche la nombra. */
  deuda?: number;
};

/**
 * Lo que dice el aviso de dormir (lo pediste el 31/10/2026: repetía siempre lo mismo). Corto y con un
 * dato de esa noche. Están en el orden en que salen, para que dos seguidos no se parezcan.
 */
export const TEXTOS_DE_DORMIR = ['enUnRato', 'estaNoche', 'luces', 'paraDespertar', 'enTiempo', 'pantallas', 'aLaHora', 'duermes', 'bajaElRitmo'] as const;
export type TextoDeDormir = (typeof TEXTOS_DE_DORMIR)[number] | 'deuda';
/** Desde esta deuda, en minutos, una noche de cada cuatro el aviso la nombra. */
const DEUDA_QUE_SE_NOMBRA = 60;

/**
 * El texto de cada noche: uno por vez hasta pasar por todos, así no vuelve hasta dentro de nueve
 * noches. Sale del día y nada más: reprogramar no lo cambia y el que ya se vio no se repite mañana.
 */
export function textoDeDormir(dia: ClaveDia, deuda: number | null): TextoDeDormir {
  const n = diasEntre('2026-01-05', dia);
  if ((deuda ?? 0) >= DEUDA_QUE_SE_NOMBRA && ((n % 4) + 4) % 4 === 0) return 'deuda';
  const largo = TEXTOS_DE_DORMIR.length;
  return TEXTOS_DE_DORMIR[((n % largo) + largo) % largo];
}

/** Lo que suena: un aviso, que dice una sola cosa. */
export type Notificacion = { dia: ClaveDia; minutos: number; aviso: Aviso };

/** Entre dos avisos, al menos esto. */
export const SEPARACION = 20;
/** Lo que puede esperar un aviso para no pisarse con otro: más tarde ya no viene al caso. */
export const ATRASO_MAXIMO = 45;
// Con el horario de comidas, cuatro se llenaban solo con comer: seis deja lugar a los hábitos.
export const MAXIMO_POR_DIA = 6;
/** Pesarse, al rato de despertarse: antes de desayunar, como se pesa en el control. */
export const PESARSE_DESPUES = 10;
/** Y siempre al menos esto antes del desayuno de siempre. */
export const ANTES_DEL_DESAYUNO = 15;
/** Sin noches para saber cuándo se despierta: a las 8. */
const PESARSE_SIN_SUENO = 8 * 60;
/**
 * Los de un hábito al despertarse o antes de dormirse, sin noches para saberlo: como si se
 * despertara a las 7:30 y se durmiera a las 23. El de la hora de dormir, en cambio, no suena.
 */
export const DESPERTAR_SIN_SUENO = 7 * 60 + 30;
export const DORMIR_SIN_SUENO = 23 * 60;
export const ANTES_DE_DORMIR = 30;
/** Lo que se adelanta la hora de dormir por la deuda, como mucho. */
export const PAGO_MAXIMO = 30;
/** Nunca más que esto antes de la hora de siempre. */
export const ADELANTO_MAXIMO = 60;
export const MENSAJE_MAXIMO = 120;

const DIA = 24 * 60;
/** Las noches cuentan desde las 18 del día anterior (sueno.ts): la medianoche es su minuto 360. */
const LAS_18 = 18 * 60;
const MEDIANOCHE = DIA - LAS_18;
/** Lo de una comida nunca pasa de las 23:30, como en recordatorios.ts. */
const ULTIMO_DE_COMIDA = 23 * 60 + 30;
const aCinco = (x: number) => Math.round(x / 5) * 5;

/**
 * La hora de dormirse esta noche, como la arma Rise (lo que hace falta dormir, la deuda y el reloj
 * del cuerpo), simplificada: la hora de despertarse mañana menos la necesidad, menos un tercio de la
 * deuda (hasta media hora: una hora de deuda lleva unos cuatro días, Kitamura y otros, 2016), y nunca
 * más de una hora antes de lo de siempre: antes de la hora habitual hay un rato en que el cuerpo no
 * se duerme (la «zona prohibida», Lavie 1986), así que se corre de a poco. En minutos desde las 18,
 * como las noches, y de a 5 minutos. Sin hora de despertarse, null: no hay aviso. Es una estimación.
 */
export function horaDeDormir(d: { despertar: number | null; necesidad: number; deuda: number | null; habitual: number | null }): number | null {
  if (d.despertar === null) return null;
  const pago = Math.min(PAGO_MAXIMO, Math.max(0, d.deuda ?? 0) / 3);
  const hora = d.despertar - d.necesidad - pago;
  return aCinco(d.habitual === null ? hora : Math.max(hora, d.habitual - ADELANTO_MAXIMO));
}

/**
 * A qué hora se despierta ese día, a qué hora dormirse esa noche y a qué hora ir a la cama para eso
 * (D33: dormirse menos lo que tardás), en minutos desde la medianoche del día (pasada la medianoche,
 * más de 1440). La mañana sale de la alarma de ese día o de lo de siempre; la noche, de la mañana
 * siguiente y de la deuda de hoy, que se rehace al reprogramar.
 */
export function horasDeSueno(dia: ClaveDia, s: Sueno): { despertar: number | null; dormir: number | null; acostarse: number | null; despertarManana: number | null } {
  // La mañana de un día, en la cuenta de su noche (desde las 18 del anterior).
  const manana = (clave: ClaveDia): number | null => {
    const alarma = s.alarmas?.[diaDeLaSemana(clave)];
    return alarma != null ? alarma + MEDIANOCHE : (s.habitual(clave)?.despertar ?? null);
  };
  const hoy = manana(dia);
  const siguiente = sumarDias(dia, 1);
  const despiertaManana = manana(siguiente);
  const dormir = horaDeDormir({ despertar: despiertaManana, necesidad: s.necesidad, deuda: s.deuda, habitual: s.habitual(siguiente)?.dormirse ?? null });
  return {
    despertar: hoy === null ? null : aCinco(hoy - MEDIANOCHE),
    dormir: dormir === null ? null : dormir + LAS_18,
    acostarse: dormir === null ? null : aCinco(dormir + LAS_18 - (s.latencia ?? 0)),
    despertarManana: despiertaManana === null ? null : aCinco(despiertaManana + LAS_18),
  };
}

// El horario y pesarse se eligen como un hábito: valen lo mismo. Lo de «sin anotar» es el respaldo.
// Lo que conviene (3/11): lo de entrenar va antes que los hábitos (solo los días de entreno, y dice qué
// comer y cuándo); lo que cuenta hacia atrás desde la cama, después, en este orden: lo más general, lo último.
const CATEGORIA: Record<Aviso['tipo'], number> = {
  dormir: 0, antesDeEntrenar: 1, despuesDeEntrenar: 1, recuperacion: 1, horario: 2, habito: 2, pesarse: 2,
  entrenarTarde: 3, ultimaComida: 4, cafe: 5, luces: 6, comida: 7, falta: 8,
};
const porHora = (a: Aviso, b: Aviso) => a.minutos - b.minutos || CATEGORIA[a.tipo] - CATEGORIA[b.tipo] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const redondo = <T extends { minutos: number }>(a: T): T => ({ ...a, minutos: Math.round(a.minutos) });
const valido = (a: Aviso) => Number.isFinite(a.minutos) && a.minutos >= 0;

/** Cuánto importa cada uno: lo de su tipo, salvo lo que reemplaza a otro (avisosDelDia). */
type Importancia = (a: Aviso) => number;
const porTipo: Importancia = (a) => CATEGORIA[a.tipo];

/** Lo que entra en el máximo. Lo de después de un evento guarda su lugar como un hábito, aunque todavía no se sepa su hora. */
function elegir(avisos: Aviso[], conEvento: string[], maximo: number, categoria = porTipo): { avisos: Aviso[]; eventos: Set<string> } {
  type Lugar = { categoria: number; minutos: number; aviso?: Aviso; evento?: string };
  const lugares: Lugar[] = [
    ...avisos.map((aviso) => ({ categoria: categoria(aviso), minutos: aviso.minutos, aviso })),
    ...conEvento.map((evento) => ({ categoria: CATEGORIA.habito, minutos: Number.MAX_SAFE_INTEGER, evento })),
  ];
  const quedan = lugares.sort((a, b) => a.categoria - b.categoria || a.minutos - b.minutos).slice(0, maximo);
  return { avisos: quedan.flatMap((l) => (l.aviso ? [l.aviso] : [])), eventos: new Set(quedan.flatMap((l) => (l.evento ? [l.evento] : []))) };
}

/**
 * El momento más cercano a esta hora que está a SEPARACION de todo lo que ya suena. Si lo que estorba viene
 * después, un rato antes, si entra: leer 45 minutos antes de dormir no puede sonar después de «a la cama».
 * Lo que recién se supo (después de un evento, lo que falta) solo puede esperar.
 */
function hueco(minutos: number, puestos: readonly { minutos: number }[], soloDespues = false): number {
  const orden = [...puestos].sort((a, b) => a.minutos - b.minutos);
  const libre = (m: number) => orden.every((p) => Math.abs(p.minutos - m) >= SEPARACION);
  if (libre(minutos)) return minutos;
  const siguiente = orden.find((p) => p.minutos > minutos && p.minutos - minutos < SEPARACION);
  if (!soloDespues && siguiente && libre(siguiente.minutos - SEPARACION)) return siguiente.minutos - SEPARACION;
  let m = minutos;
  for (const p of orden) if (Math.abs(p.minutos - m) < SEPARACION) m = p.minutos + SEPARACION;
  return m;
}

/** Cada uno a su hora; si no entra, el que importa menos espera. */
function acomodar(avisos: Aviso[], categoria = porTipo): Aviso[] {
  const puestos: Aviso[] = [];
  for (const a of [...avisos].sort((x, y) => categoria(x) - categoria(y) || porHora(x, y))) {
    const minutos = hueco(a.minutos, puestos);
    if (Math.abs(minutos - a.minutos) <= ATRASO_MAXIMO) puestos.push({ ...a, minutos });
  }
  return puestos.sort(porHora);
}

/** El hábito de entrenar: el de los primeros hábitos o uno que se llame así. */
const DE_ENTRENAR = /entren|gimnasio|\bgym\b|workout|training|exercise|ejercicio/i;
const esDeEntrenar = (h: Habito) => h.icono === 'dumbbell' || DE_ENTRENAR.test(h.nombre);
/** En este orden: anotada una, la de antes ya pasó. El snack va aparte: puede ser a cualquier hora. */
const ORDEN_DE_COMIDAS: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

export type DelDia = {
  dia: ClaveDia;
  ajustes: Avisos;
  habitos: readonly Habito[];
  /** Sin sueño no hay el de dormir, y los de un hábito con la hora de despertarse o de dormirse usan las de fábrica. */
  sueno: Sueno | null;
  /** La hora de siempre de cada comida, en minutos desde la medianoche (horaHabitual, en recordatorios.ts). */
  horaDeComida: (c: Comida) => number;
  /** Las marcas del almacén, por claveDeMarca: un hábito hecho no avisa. */
  marcas?: ReadonlyMap<string, Pick<Marca, 'hecho'>>;
  /** Las comidas ya anotadas ese día, sin lo planificado: no avisan. */
  anotadas?: ReadonlySet<Comida>;
  /** El día de la semana del control (control.ts): ese día, pesarse avisa aunque no sea cada día. */
  diaDelControl?: DiaSemana;
  /** Si ya se pesó ese día: pesarse no avisa. */
  pesado?: boolean;
  /**
   * Lo que ya pasó ese día, en minutos desde la medianoche: cuándo se anotó cada comida (la primera
   * vez) y cuándo terminó el entrenamiento de Ascent.
   */
  eventos?: Partial<Record<Evento, number>>;
  /** Hoy, los minutos de ahora en la cuenta de ese día: lo de antes ya sonó o ya no sirve. */
  ahora?: number;
  /** Las sesiones del horario de ese día (sesionesDelDia): si ya empezó, «Entrenar» no avisa. */
  sesiones?: readonly { inicio: number; minutos: number }[];
  /** Lo que falta, ya calculado (loQueFaltaHoy). Solo hoy, y aparte del máximo. */
  faltas?: readonly FaltaConHora[];
  /** Lo que conviene hacer ese día, ya armado (loQueConviene): entra en el máximo, y lo que reemplaza no suena. */
  conviene?: readonly Aviso[];
};

/**
 * Lo que suena un día. Cuáles entran en el máximo sale solo de lo elegido y de las horas de siempre. A la
 * hora de acomodarlos, lo que ya pasó sigue ocupando su lugar (ya sonó, y lo de después no puede volver a
 * correrse); lo hecho antes de su hora, no: si ya entrenaste, entrenar no atrasa la merienda.
 */
export function avisosDelDia(op: DelDia): Notificacion[] {
  const { dia, ajustes } = op;
  const semana = diaDeLaSemana(dia);
  const horas = op.sueno ? horasDeSueno(dia, op.sueno) : { despertar: null, dormir: null, acostarse: null, despertarManana: null };
  const fijos: Aviso[] = [];
  const conEvento: { aviso: Omit<Aviso, 'minutos'>; evento: Evento; despues: number }[] = [];

  // Un rato antes de la hora de ir a la cama, que ya descuenta lo que tardás en dormirte.
  if (ajustes.dormir?.encendido && horas.acostarse !== null) {
    const texto = textoDeDormir(dia, op.sueno?.deuda ?? null);
    fijos.push({
      id: 'dormir', tipo: 'dormir', minutos: horas.acostarse - (ajustes.dormir.antes ?? ANTES_DE_DORMIR), dormirA: horas.acostarse, texto,
      ...(horas.despertarManana !== null && horas.dormir !== null ? { despertarA: horas.despertarManana, duerme: horas.despertarManana - horas.dormir } : {}),
      ...(texto === 'deuda' ? { deuda: op.sueno?.deuda ?? 0 } : {}),
    });
  }
  const vistos = new Map<string, number>();
  for (const r of ajustes.habitos ?? []) {
    const n = vistos.get(r.habito) ?? 0;
    vistos.set(r.habito, n + 1);
    const h = op.habitos.find((x) => x.id === r.habito);
    if (!h || !tocaElDia(h, dia) || (r.dias.length > 0 && !r.dias.includes(semana))) continue;
    // Por letras, no por unidades de UTF-16: un emoji no queda partido.
    const mensaje = Array.from(r.mensaje?.trim() ?? '').slice(0, MENSAJE_MAXIMO).join('').trim();
    const aviso = { id: `habito:${r.habito}:${n}`, tipo: 'habito' as const, habito: r.habito, ...(mensaje ? { mensaje } : {}) };
    const c = r.cuando;
    if (c.tipo === 'evento') conEvento.push({ aviso, evento: c.evento, despues: c.despues });
    else if (c.tipo === 'hora') fijos.push({ ...aviso, minutos: c.minutos });
    else if (c.tipo === 'despertar') fijos.push({ ...aviso, minutos: (horas.despertar ?? DESPERTAR_SIN_SUENO) + c.despues });
    else if (c.tipo === 'dormir') fijos.push({ ...aviso, minutos: (horas.acostarse ?? DORMIR_SIN_SUENO) - c.antes });
  }
  // Hoy, lo que falta corre con la última comida que anotaste (lo pediste el 29/10/2026): desayunar
  // hora y media tarde corre el aviso del almuerzo y el de la cena lo mismo.
  const anotadasHoy = Object.fromEntries(Object.entries(op.eventos ?? {}).filter(([k]) => k !== 'entrenamiento')) as Partial<Record<Comida, number>>;
  const corridas = horasCorridas(Object.fromEntries((ajustes.comidas ?? []).map((c) => [c, op.horaDeComida(c)])), anotadasHoy);
  const delHorario = horasCorridas(ajustes.horario ?? {}, anotadasHoy);
  const horario = (Object.keys(ajustes.horario ?? {}) as Comida[]).map((c) => [c, delHorario[c]] as [Comida, number]).filter(([, m]) => Number.isFinite(m));
  for (const [comida, minutos] of horario) fijos.push({ id: `horario:${comida}`, tipo: 'horario', comida, minutos });
  for (const comida of ajustes.comidas ?? []) {
    const enHorario = delHorario[comida];
    const minutos = Math.min(ULTIMO_DE_COMIDA, (enHorario ?? corridas[comida] ?? op.horaDeComida(comida)) + DESPUES_MIN);
    // Con una comida tarde en el horario, el de «sin anotar» sonaría con el de su hora o antes: alcanza con ese.
    if (enHorario !== undefined && minutos - enHorario <= SEPARACION) continue;
    fijos.push({ id: `comida:${comida}`, tipo: 'comida', comida, minutos });
  }
  if (ajustes.pesarse?.encendido) {
    const control = op.diaDelControl === semana;
    if (control || ajustes.pesarse.todos) {
      // Al rato de despertarte y antes de desayunar (lo pediste el 29/10/2026): si desayunás enseguida,
      // un cuarto de hora antes del desayuno de siempre, pero nunca antes de despertarte.
      const alDespertar = horas.despertar !== null ? horas.despertar + PESARSE_DESPUES : PESARSE_SIN_SUENO;
      const desayuno = (ajustes.horario?.desayuno ?? op.horaDeComida('desayuno')) - ANTES_DEL_DESAYUNO;
      const minutos = Math.max(horas.despertar ?? 0, Math.min(alDespertar, desayuno));
      fijos.push({ id: 'pesarse', tipo: 'pesarse', minutos, ...(control ? { control: true } : {}) });
    }
  }

  // Lo que conviene entra con los demás; lo que deja sin sentido (la hora del almuerzo, si el de antes de
  // entrenar ya dice cuándo almorzar y qué) no suena. Y vale al menos lo que valía lo que reemplaza: la última
  // comida grande es ahora la hora de la cena, y si no entrara en el máximo, la cena quedaría sin aviso.
  // Si dejó de hacer falta antes de su hora (entrenaste a otra hora), le deja su lugar a lo primero que
  // reemplazaba: la hora del almuerzo vuelve a sonar como siempre, y el máximo cuenta lo mismo. Sale de cuándo
  // dejó de hacer falta, no de la hora de ahora: reprogramar más tarde no lo cambia.
  const deja = (a: Aviso) => !!a.sobra && a.sobraDesde !== undefined && a.sobraDesde < a.minutos && fijos.some((f) => f.id === a.reemplaza?.[0]);
  const vuelven = new Set((op.conviene ?? []).filter(deja).flatMap((a) => a.reemplaza?.slice(0, 1) ?? []));
  const conviene = (op.conviene ?? []).filter((a) => !deja(a));
  const reemplazados = new Set((op.conviene ?? []).flatMap((a) => a.reemplaza ?? []).filter((id) => !vuelven.has(id)));
  const vale = new Map(conviene.map((a) => [a.id, Math.min(CATEGORIA[a.tipo], ...fijos.filter((f) => a.reemplaza?.includes(f.id)).map(porTipo))]));
  const categoria: Importancia = (a) => vale.get(a.id) ?? CATEGORIA[a.tipo];
  const delDia = [...fijos.filter((a) => !reemplazados.has(a.id)), ...conviene];

  const maximo = Math.max(0, Math.floor(ajustes.maximoPorDia ?? MAXIMO_POR_DIA));
  const plan = elegir(delDia.map(redondo).filter(valido), conEvento.map((e) => e.aviso.id), maximo, categoria);

  // Lo que ya pasó no avisa. Pesarse, después de desayunar, ya no es lo mismo: con el desayuno anotado no suena.
  const yaPasoLaComida = (c: Comida) => {
    const i = ORDEN_DE_COMIDAS.indexOf(c);
    return i >= 0 && ORDEN_DE_COMIDAS.slice(i + 1).some((x) => op.anotadas?.has(x));
  };
  const yaEntreno = (a: Aviso) => {
    const h = a.habito ? op.habitos.find((x) => x.id === a.habito) : undefined;
    if (!h || !esDeEntrenar(h)) return false;
    return op.eventos?.entrenamiento != null || (op.sesiones ?? []).some((s) => s.inicio <= a.minutos);
  };
  const falta = (a: Aviso) =>
    !a.sobra && !(a.habito && op.marcas?.get(claveDeMarca(a.habito, dia))?.hecho) && !yaEntreno(a)
    && !(a.comida && (op.anotadas?.has(a.comida) || yaPasoLaComida(a.comida)))
    && !(a.tipo === 'pesarse' && (op.pesado || op.anotadas?.has('desayuno')));
  const quedan = acomodar(plan.avisos.filter((a) => falta(a) || (op.ahora !== undefined && a.minutos <= op.ahora)), categoria).filter(falta);
  for (const e of conEvento) {
    const paso = op.eventos?.[e.evento];
    if (paso == null) continue;
    // «En el momento» es dos minutos después: al reprogramar (un segundo y medio después de anotar,
    // más lo que se espera al permiso) ya puede ser el minuto siguiente, y lo de ese minuto se pierde.
    const aviso = redondo({ ...e.aviso, minutos: paso + Math.max(2, e.despues) });
    if (!valido(aviso) || !falta(aviso) || !plan.eventos.has(aviso.id)) continue;
    quedan.push({ ...aviso, minutos: hueco(aviso.minutos, quedan, true) });
  }
  // Lo que falta va aparte del máximo, con su propio tope: busca su hueco, sin correr a nadie. Si tendría
  // que esperar mucho, un rato antes: a la noche, más tarde ya es hora de acostarse.
  for (const f of op.faltas ?? []) {
    const despues = hueco(f.minutos, quedan, true);
    const antes = hueco(f.minutos - SEPARACION, quedan, true);
    const minutos = despues - f.minutos > SEPARACION && antes > (op.ahora ?? -Infinity) ? antes : despues;
    quedan.push(redondo({ id: `falta:${f.falta.que}`, tipo: 'falta', minutos, falta: f.falta }));
  }
  return quedan
    .filter((a) => op.ahora === undefined || a.minutos > op.ahora)
    .sort(porHora)
    .map((aviso) => ({ dia, minutos: aviso.minutos, aviso }));
}

/**
 * Lo que suena desde ahora: lo que falta de hoy y los 6 días siguientes, como recordatorios.ts, más
 * lo de anoche que todavía no sonó (pasada la medianoche, el de dormir de ayer). Se rehace cada vez
 * que se abre Moss o se anota algo: si no se abre en una semana, para solo.
 */
export function avisosDeLaSemana(op: Omit<DelDia, 'dia' | 'anotadas' | 'eventos' | 'ahora' | 'pesado' | 'sesiones' | 'faltas' | 'conviene'> & {
  hoy: ClaveDia;
  /** Los minutos de ahora, desde la medianoche. */
  ahora: number;
  anotadasHoy?: ReadonlySet<Comida>;
  eventosHoy?: Partial<Record<Evento, number>>;
  pesadoHoy?: boolean;
  faltasHoy?: readonly FaltaConHora[];
  /** Las sesiones del horario de cada día (sesionesDelDia). */
  sesionesDe?: (dia: ClaveDia) => readonly { inicio: number; minutos: number }[];
  /** Lo que conviene de cada día (loQueConviene), con lo de hoy si es hoy. */
  convieneDe?: (dia: ClaveDia) => readonly Aviso[];
}): Notificacion[] {
  const { hoy, ahora, anotadasHoy, eventosHoy, pesadoHoy, faltasHoy, sesionesDe, convieneDe, ...comun } = op;
  const de = (dia: ClaveDia) => ({ ...comun, dia, sesiones: sesionesDe?.(dia), conviene: convieneDe?.(dia) });
  return [
    ...avisosDelDia({ ...de(sumarDias(hoy, -1)), ahora: ahora + DIA }),
    ...avisosDelDia({ ...de(hoy), ahora, anotadas: anotadasHoy, eventos: eventosHoy, pesado: pesadoHoy, faltas: faltasHoy }),
    ...Array.from({ length: DIAS - 1 }, (_, i) => avisosDelDia(de(sumarDias(hoy, i + 1)))).flat(),
  ];
}

/** «23:20» de unos minutos en la cuenta de un día (lo de la noche pasa de 1440). */
export const horaDeReloj = (minutos: number) => {
  const m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

/** Lo que hace falta para escribir un aviso: las palabras y lo que no está en él. */
export type ParaElTexto = {
  t: (clave: string, valores?: Record<string, string | number>) => string;
  /** El nombre del hábito. */
  habito: (id: string) => string;
  /** Lo que el plan dejó para esa comida de ese día, en pocas palabras: «pollo a la plancha, arroz». */
  plan: (dia: ClaveDia, comida: Comida) => string;
  /** «8 h» o «1 h 30 min». */
  duracion: (minutos: number) => string;
};

/** «En una hora» o «en 45 minutos»: lo que falta para ir a la cama. */
function hastaLaCama(minutos: number, h: ParaElTexto): string {
  if (minutos === 60) return h.t('recordatorios.dormirEn.60');
  if (minutos === 30) return h.t('recordatorios.dormirEn.30');
  return minutos === 15 ? h.t('recordatorios.dormirEn.15') : h.t('recordatorios.dormirEn.45');
}

/** Lo que falta, en una frase corta: qué, cuánto y la idea. */
function textoDeLoQueFalta(f: Falta, h: ParaElTexto): string {
  if (f.que === 'agua') return h.t(`recordatorios.falta.agua.${f.sinNumeros ? 1 + (f.forma % 2) : f.forma % 3}`, { vasos: f.cuanto });
  const nombres = f.ideas.map((i) => ('nombre' in i ? i.nombre.charAt(0).toLowerCase() + i.nombre.slice(1) : h.t(`recordatorios.falta.ideas.${i.id}`)));
  // «yogur e higos»: delante de i o hi, «e».
  const idea = nombres.length < 2 ? nombres[0] : h.t(/^(i|hi(?!e))/i.test(nombres[1]) ? 'recordatorios.falta.ye' : 'recordatorios.falta.y', { a: nombres[0], b: nombres[1] });
  const numero = nombres.length === 2 ? 'dos' : 'uno';
  const base = `recordatorios.falta.${f.que}`;
  if (f.sinNumeros) return h.t(`${base}.sinNumero.${numero}`, { idea });
  if (!f.alcanza) return h.t(`${base}.acerca.${numero}.${f.forma % 2}`, { idea, cuanto: f.cuanto });
  return h.t(`${base}.alcanza.${numero}.${f.forma % 3}`, { idea, cuanto: f.cuanto });
}

const CONVIENE = 'recordatorios.conviene';

/**
 * Lo que conviene, en dos partes, como Rise: el título dice qué hacer y el texto, a qué hora y cuánto.
 * Sin gramos (sin meta o con los números ocultos), lo mismo sin números.
 */
function textoDeLoQueConviene(c: Conviene, h: ParaElTexto): { titulo: string; texto: string } {
  const de = (clave: string, valores?: Record<string, string | number>) => h.t(`${CONVIENE}.${clave}`, valores);
  switch (c.que) {
    case 'antesDeEntrenar': {
      const cuando = de(`antes.${c.adelantada ? 'adelantada' : 'comida'}.${c.comida}`, { hora: horaDeReloj(c.a) });
      const texto = c.proteina && c.carbohidratos ? de('antes.todo', { cuando, c: c.carbohidratos, p: c.proteina })
        : c.proteina ? de('antes.sinCarbohidratos', { cuando, p: c.proteina })
          : de('antes.sinNumeros', { cuando });
      return { titulo: de('antes.titulo'), texto };
    }
    case 'despuesDeEntrenar': {
      const donde = c.comida ? de(`despues.en.${c.comida}`, { hora: horaDeReloj(c.a) }) : de('despues.antesDe', { hora: horaDeReloj(c.a) });
      return { titulo: de('despues.titulo'), texto: c.proteina ? de('despues.cuanto', { p: c.proteina, donde }) : de('despues.sinNumeros', { donde }) };
    }
    case 'cafe':
      return c.forma === 'antes'
        ? { titulo: de('cafe.titulo'), texto: de('cafe.antes', { hora: horaDeReloj(c.a), horas: h.duracion(c.faltan ?? 0) }) }
        : { titulo: de('cafe.tituloUltimo'), texto: de(`cafe.${c.forma}`, { hora: horaDeReloj(c.a), entreno: horaDeReloj(c.entreno ?? 0) }) };
    case 'ultimaComida':
      return { titulo: de('ultimaComida.titulo'), texto: de('ultimaComida.texto', { hora: horaDeReloj(c.a), cama: horaDeReloj(c.cama) }) };
    case 'entrenarTarde':
      return c.suave
        ? { titulo: de('tarde.tituloSuave'), texto: de('tarde.suave', { entreno: horaDeReloj(c.entreno), cama: horaDeReloj(c.cama) }) }
        : { titulo: de('tarde.titulo', { hora: horaDeReloj(c.a) }), texto: de('tarde.texto', { cama: horaDeReloj(c.cama) }) };
    case 'luces':
      return { titulo: de('luces.titulo'), texto: de('luces.texto', { cama: horaDeReloj(c.cama) }) };
    case 'recuperacion':
      return {
        titulo: de('recuperacion.titulo', { pct: c.porcentaje }),
        texto: c.fuerte ? de('recuperacion.fuerte') : c.dormido !== undefined ? de('recuperacion.suave', { horas: h.duracion(c.dormido) }) : de('recuperacion.suaveSinSueno'),
      };
  }
}

/** El título de un aviso: lo que conviene dice ahí qué hacer; los demás llevan el nombre de la app. */
export function tituloDelAviso(n: Notificacion, h: ParaElTexto): string {
  return n.aviso.conviene ? textoDeLoQueConviene(n.aviso.conviene, h).titulo : 'Moss';
}

/** Lo que dice un aviso: una sola cosa, sin culpa. */
export function textoDelAviso(n: Notificacion, h: ParaElTexto): string {
  const a = n.aviso;
  if (a.conviene) return textoDeLoQueConviene(a.conviene, h).texto;
  if (a.tipo === 'dormir') {
    const cama = a.dormirA ?? a.minutos;
    return h.t(`recordatorios.dormirTextos.${a.texto ?? 'aLaHora'}`, {
      hora: horaDeReloj(cama),
      tiempo: hastaLaCama(cama - a.minutos, h),
      despertar: horaDeReloj(a.despertarA ?? 0),
      horas: h.duracion(a.duerme ?? 0),
      deuda: h.duracion(a.deuda ?? 0),
    });
  }
  if (a.tipo === 'horario' && a.comida) {
    const hora = h.t(`recordatorios.horario.${a.comida}`);
    const plan = h.plan(n.dia, a.comida);
    return plan ? h.t('recordatorios.conPlan', { hora, plan }) : hora;
  }
  if (a.tipo === 'pesarse') return h.t(a.control ? 'recordatorios.pesarseControl' : 'recordatorios.pesarse');
  if (a.tipo === 'comida' && a.comida) return h.t(`recordatorios.sinAnotar.${a.comida}`);
  if (a.tipo === 'falta' && a.falta) return textoDeLoQueFalta(a.falta, h);
  return a.mensaje || (a.habito ? h.habito(a.habito) : '');
}

/**
 * El aviso con que llega un hábito nuevo de los primeros (Sugeridos), a la hora en que más ayuda: lo
 * de la noche antes de dormirse, meditar al despertarse, los pasos y el agua a la tarde si todavía
 * faltan (un hábito hecho no avisa). Dormir va con el aviso de la hora de dormir; lo de la comida,
 * con el horario de comidas. Se cambia o se saca en el editor del hábito.
 */
export function avisoDeFabrica(fuente: Fuente, nombre?: 'leer' | 'escribir' | 'entrenar'): Cuando | null {
  if (fuente.tipo === 'salud') {
    if (fuente.dato === 'mindfulness') return { tipo: 'despertar', despues: 15 };
    if (fuente.dato === 'pasos') return { tipo: 'hora', minutos: 18 * 60 };
    if (fuente.dato === 'agua') return { tipo: 'hora', minutos: 16 * 60 };
    return null;
  }
  if (fuente.tipo !== 'manual') return null;
  if (nombre === 'leer') return { tipo: 'dormir', antes: 45 };
  if (nombre === 'escribir') return { tipo: 'dormir', antes: 30 };
  if (nombre === 'entrenar') return { tipo: 'hora', minutos: 17 * 60 + 30 };
  return null;
}

/**
 * Cuándo suena en el reloj: lo de la noche pasa de 1440 y cae al día siguiente (1455 son las 0:15).
 * Es hora de reloj, sin zona: el teléfono la programa con new Date(año, mes − 1, día, hora, minuto),
 * y un cambio de hora no la corre.
 */
export function cuandoSuena(dia: ClaveDia, minutos: number): { dia: ClaveDia; hora: number; minuto: number } {
  const dias = Math.floor(minutos / DIA);
  const resto = minutos - dias * DIA;
  return { dia: sumarDias(dia, dias), hora: Math.floor(resto / 60), minuto: resto % 60 };
}
