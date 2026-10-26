// Los avisos (lo pediste el 23/10/2026): la hora de dormir como Rise, los de cada hábito y los de
// las comidas, con un máximo por día y juntos los que caen cerca. El 26/10 sumaste el horario de
// comidas (avisa a la hora de comer, para comer ordenado) y pesarse a la mañana. Pocos y útiles:
// Moss nunca insiste. Acá van códigos; el texto, sin culpa, lo arma la interfaz.
// - El plan de cada día sale de lo que elegiste y de las horas de siempre, no de lo que ya hiciste:
//   no cambia en el día, así que al reprogramar (cada vez que se abre Moss o se anota algo) lo que
//   ya sonó no vuelve a sonar y el máximo no se pasa. Lo hecho y lo anotado solo sacan avisos.
// - Lo que cae a 20 minutos o menos del primero de un grupo suena con él, a su hora: nada llega
//   tarde, lo agrupado llega como mucho 20 minutos antes y entre dos sonidos hay más de 20 minutos.
//   Lo de después de un evento es la excepción: no se sabe de antemano, así que espera al sonido de
//   los 20 minutos siguientes o suena solo.
// - El máximo cuenta las veces que suena: juntar no gasta. Si sobran, quedan primero el de dormir
//   (el que más depende de la hora), después los de hábitos (se eligen uno por uno) y al final los
//   de comidas (un respaldo: casi siempre ya se anotó); entre iguales, el grupo que junta más y,
//   después, el más temprano.
// - Las horas son de reloj, en minutos desde la medianoche del día, sin instantes ni zonas: un
//   cambio de hora no corre nada. La noche es del día en que empieza: un aviso a las 0:15 de esa
//   noche es 1455. Cada día se agrupa aparte.

import type { Comida } from './comidas';
import { claveDeMarca, type Marca } from './dias';
import { diaDeLaSemana, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { tocaElDia, type Fuente, type Habito } from './habitos';
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
};

/** Un aviso: el de dormir, el de un hábito, el de una comida (sin anotar o a su hora) o el de pesarse. */
export type Aviso = {
  /** 'dormir', 'comida:cena', 'horario:cena', 'pesarse' o 'habito:<id>:<n>', el n-ésimo aviso de ese hábito (desde 0). */
  id: string;
  /** Su hora, en minutos desde la medianoche del día; lo de la noche puede pasar de 1440. */
  minutos: number;
  tipo: 'dormir' | 'habito' | 'comida' | 'horario' | 'pesarse';
  /** En el de pesarse, si ese día es el del control: el texto lo dice. */
  control?: boolean;
  habito?: string;
  comida?: Comida;
  mensaje?: string;
  /** En el de dormir, la hora de dormirse (en la misma cuenta que `minutos`), para el texto. */
  dormirA?: number;
};

/** Lo que suena: uno o varios avisos juntos, en orden. */
export type Notificacion = { dia: ClaveDia; minutos: number; avisos: Aviso[] };

/** Lo que cae a esta distancia del primero de un grupo, o menos, suena con él. */
export const VENTANA = 20;
// Con el horario de comidas, cuatro se llenaban solo con comer: seis deja lugar a los hábitos.
export const MAXIMO_POR_DIA = 6;
/** Pesarse, al rato de despertarse: antes de desayunar, como se pesa en el control. */
export const PESARSE_DESPUES = 10;
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
 * A qué hora se despierta ese día y a qué hora dormirse esa noche, en minutos desde la medianoche
 * del día (pasada la medianoche, más de 1440). La mañana sale de la alarma de ese día o de lo de
 * siempre; la noche, de la mañana siguiente y de la deuda de hoy, que se rehace al reprogramar.
 */
export function horasDeSueno(dia: ClaveDia, s: Sueno): { despertar: number | null; dormir: number | null } {
  // La mañana de un día, en la cuenta de su noche (desde las 18 del anterior).
  const manana = (clave: ClaveDia): number | null => {
    const alarma = s.alarmas?.[diaDeLaSemana(clave)];
    return alarma != null ? alarma + MEDIANOCHE : (s.habitual(clave)?.despertar ?? null);
  };
  const hoy = manana(dia);
  const siguiente = sumarDias(dia, 1);
  const dormir = horaDeDormir({ despertar: manana(siguiente), necesidad: s.necesidad, deuda: s.deuda, habitual: s.habitual(siguiente)?.dormirse ?? null });
  return { despertar: hoy === null ? null : aCinco(hoy - MEDIANOCHE), dormir: dormir === null ? null : dormir + LAS_18 };
}

type Grupo = { minutos: number; avisos: Aviso[] };
// El horario y pesarse se eligen como un hábito: valen lo mismo. Lo de «sin anotar» es el respaldo.
const CATEGORIA: Record<Aviso['tipo'], number> = { dormir: 0, horario: 1, habito: 1, pesarse: 1, comida: 2 };
const porHora = (a: Aviso, b: Aviso) => a.minutos - b.minutos || CATEGORIA[a.tipo] - CATEGORIA[b.tipo] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const redondo = <T extends { minutos: number }>(a: T): T => ({ ...a, minutos: Math.round(a.minutos) });
const valido = (a: Aviso) => Number.isFinite(a.minutos) && a.minutos >= 0;

/** Cada grupo, a la hora de su primero y con lo que cae a VENTANA minutos o menos de él. */
function agrupar(avisos: Aviso[]): Grupo[] {
  const grupos: Grupo[] = [];
  for (const a of [...avisos].sort(porHora)) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && a.minutos - ultimo.minutos <= VENTANA) ultimo.avisos.push(a);
    else grupos.push({ minutos: a.minutos, avisos: [a] });
  }
  return grupos;
}

/** Lo que entra en el máximo. Lo de después de un evento guarda su lugar como un hábito, aunque todavía no se sepa su hora. */
function elegir(grupos: Grupo[], conEvento: string[], maximo: number): { grupos: Grupo[]; eventos: Set<string> } {
  type Lugar = { categoria: number; tamano: number; minutos: number; grupo?: Grupo; evento?: string };
  const lugares: Lugar[] = [
    ...grupos.map((g) => ({ categoria: Math.min(...g.avisos.map((a) => CATEGORIA[a.tipo])), tamano: g.avisos.length, minutos: g.minutos, grupo: g })),
    ...conEvento.map((evento) => ({ categoria: CATEGORIA.habito, tamano: 1, minutos: Number.MAX_SAFE_INTEGER, evento })),
  ];
  const quedan = lugares.sort((a, b) => a.categoria - b.categoria || b.tamano - a.tamano || a.minutos - b.minutos).slice(0, maximo);
  return {
    grupos: quedan.flatMap((l) => (l.grupo ? [l.grupo] : [])).sort((a, b) => a.minutos - b.minutos),
    eventos: new Set(quedan.flatMap((l) => (l.evento ? [l.evento] : []))),
  };
}

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
};

/**
 * Lo que suena un día. El plan (los grupos y cuáles entran en el máximo) sale solo de lo elegido y de
 * las horas de siempre; después lo hecho y lo anotado sacan avisos, y un grupo sigue a su hora aunque
 * lo primero ya esté hecho: no se sabe si se hizo antes o después de que sonara.
 */
export function avisosDelDia(op: DelDia): Notificacion[] {
  const { dia, ajustes } = op;
  const semana = diaDeLaSemana(dia);
  const horas = op.sueno ? horasDeSueno(dia, op.sueno) : { despertar: null, dormir: null };
  const fijos: Aviso[] = [];
  const conEvento: { aviso: Omit<Aviso, 'minutos'>; evento: Evento; despues: number }[] = [];

  if (ajustes.dormir?.encendido && horas.dormir !== null) {
    fijos.push({ id: 'dormir', tipo: 'dormir', minutos: horas.dormir - (ajustes.dormir.antes ?? ANTES_DE_DORMIR), dormirA: horas.dormir });
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
    else if (c.tipo === 'dormir') fijos.push({ ...aviso, minutos: (horas.dormir ?? DORMIR_SIN_SUENO) - c.antes });
  }
  const horario = Object.entries(ajustes.horario ?? {}).filter(([, m]) => Number.isFinite(m)) as [Comida, number][];
  for (const [comida, minutos] of horario) fijos.push({ id: `horario:${comida}`, tipo: 'horario', comida, minutos });
  for (const comida of ajustes.comidas ?? []) {
    const enHorario = ajustes.horario?.[comida];
    const minutos = Math.min(ULTIMO_DE_COMIDA, (enHorario ?? op.horaDeComida(comida)) + DESPUES_MIN);
    // Con una comida tarde en el horario, el de «sin anotar» sonaría con el de su hora o antes: alcanza con ese.
    if (enHorario !== undefined && minutos - enHorario <= VENTANA) continue;
    fijos.push({ id: `comida:${comida}`, tipo: 'comida', comida, minutos });
  }
  if (ajustes.pesarse?.encendido) {
    const control = op.diaDelControl === semana;
    if (control || ajustes.pesarse.todos) {
      const minutos = horas.despertar !== null ? horas.despertar + PESARSE_DESPUES : PESARSE_SIN_SUENO;
      fijos.push({ id: 'pesarse', tipo: 'pesarse', minutos, ...(control ? { control: true } : {}) });
    }
  }

  const maximo = Math.max(0, Math.floor(ajustes.maximoPorDia ?? MAXIMO_POR_DIA));
  const plan = elegir(agrupar(fijos.map(redondo).filter(valido)), conEvento.map((e) => e.aviso.id), maximo);

  const falta = (a: Aviso) =>
    !(a.habito && op.marcas?.get(claveDeMarca(a.habito, dia))?.hecho) && !(a.comida && op.anotadas?.has(a.comida)) && !(a.tipo === 'pesarse' && op.pesado);
  const grupos = plan.grupos.map((g) => ({ minutos: g.minutos, avisos: g.avisos.filter(falta) }));
  const solos: Grupo[] = [];
  for (const e of conEvento) {
    const paso = op.eventos?.[e.evento];
    if (paso == null) continue;
    // «En el momento» es dos minutos después: al reprogramar (un segundo y medio después de anotar,
    // más lo que se espera al permiso) ya puede ser el minuto siguiente, y lo de ese minuto se pierde.
    const aviso = redondo({ ...e.aviso, minutos: paso + Math.max(2, e.despues) });
    if (!valido(aviso) || !falta(aviso)) continue;
    // Solo con un grupo que suena después: si sonó antes, quizás fue antes de que se supiera el evento.
    const siguiente = grupos.find((g) => g.minutos >= aviso.minutos && g.minutos - aviso.minutos <= VENTANA);
    if (siguiente) siguiente.avisos.push(aviso);
    else if (plan.eventos.has(aviso.id)) solos.push({ minutos: aviso.minutos, avisos: [aviso] });
  }
  return [...grupos, ...solos]
    .filter((g) => g.avisos.length > 0 && (op.ahora === undefined || g.minutos > op.ahora))
    .sort((a, b) => a.minutos - b.minutos)
    .map((g) => ({ dia, minutos: g.minutos, avisos: g.avisos.sort(porHora) }));
}

/**
 * Lo que suena desde ahora: lo que falta de hoy y los 6 días siguientes, como recordatorios.ts, más
 * lo de anoche que todavía no sonó (pasada la medianoche, el de dormir de ayer). Se rehace cada vez
 * que se abre Moss o se anota algo: si no se abre en una semana, para solo.
 */
export function avisosDeLaSemana(op: Omit<DelDia, 'dia' | 'anotadas' | 'eventos' | 'ahora' | 'pesado'> & {
  hoy: ClaveDia;
  /** Los minutos de ahora, desde la medianoche. */
  ahora: number;
  anotadasHoy?: ReadonlySet<Comida>;
  eventosHoy?: Partial<Record<Evento, number>>;
  pesadoHoy?: boolean;
}): Notificacion[] {
  const { hoy, ahora, anotadasHoy, eventosHoy, pesadoHoy, ...comun } = op;
  return [
    ...avisosDelDia({ ...comun, dia: sumarDias(hoy, -1), ahora: ahora + DIA }),
    ...avisosDelDia({ ...comun, dia: hoy, ahora, anotadas: anotadasHoy, eventos: eventosHoy, pesado: pesadoHoy }),
    ...Array.from({ length: DIAS - 1 }, (_, i) => avisosDelDia({ ...comun, dia: sumarDias(hoy, i + 1) })).flat(),
  ];
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
