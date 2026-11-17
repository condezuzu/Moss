// El día que sigue tu despertar (lo pediste el 16/11/2026: «pesarte» sonó antes de que te despertaras). Como Rise,
// el día se acomoda a cómo es el tuyo (spec/avisos.md, «El día que sigue tu despertar»):
// - Nada de la mañana suena hasta saber a qué hora te despertaste de verdad ese día (Sueno.despertarReal; lo
//   espera avisosDelDia). Con el despertar, de a uno y separados: la deuda de sueño en una línea, sin festejar;
//   pesarse, si lo tienes prendido; y «¿Desayunas hoy?», con dos respuestas.
// - La primera comida que anotas corre las demás (horasCorridas). Si no desayunaste («Voy directo al almuerzo», o
//   la primera que anotaste es otra), lo que te queda del día se reparte entre las que quedan, con el reparto del
//   plan de comidas, sin pasarse del día.
// - La noche sale de tu periodo de melatonina (horasDeSueno, con Sueno.periodo: el mismo de la tarjeta de Sueño,
//   aprobado el 17/11 con la galería 50): el aviso del periodo cuando la melatonina empieza a subir, bajar el ritmo
//   y, apagados de fábrica, las gafas para la luz azul y anotar lo que tienes en la cabeza. Las luces y la hora de
//   acostarte son las de siempre (loQueConviene.ts y avisosDelDia), con esa misma hora. Sin periodo (menos de 3
//   noches en la semana), el aviso del periodo no suena y la hora es la de antes, con tu despertar y tu deuda.
// - Lo que hay que hacer hoy (17/11): con «anotar lo que tienes en la cabeza» prendido, los pendientes de ese día
//   vuelven a la mañana, 20 minutos después de la pregunta del desayuno.
// Entra en avisosDelDia como lo que conviene: el mismo máximo, de a uno y nada de lo que ya pasó. Acá van códigos;
// el texto sale de textoDelAviso y tituloDelAviso (avisos.ts). Las fuentes, en spec/estudio/momentos.md.

import { avisosDelDia, horasDeSueno, inicioDeLaManana, PESARSE_DESPUES, SEPARACION, type Aviso, type Avisos, type DelDia, type Notificacion } from './avisos';
import { CON_HORA, horasCorridas, type Comida } from './comidas';
import { diaDeLaSemana } from './fechas';
import { loQueConviene, type DeLoQueConviene } from './loQueConviene';
import type { Macros } from './metas';
import type { Pendiente } from './pendientes';
import { REPARTO } from './plan';
import { redondearDeuda } from './sueno';

type ConHora = (typeof CON_HORA)[number];
type SinDesayuno = Exclude<ConHora, 'desayuno'>;

/**
 * Lo que dice cada uno. La deuda, a la media hora (redondearDeuda, como en Sueño), la de esta mañana y la de ayer;
 * en las comidas, a cuáles va lo que no comiste en el desayuno (desde esta) y, con números, las kcal de esta; en
 * el periodo de melatonina, sus dos horas, en minutos del día; y en lo que hay que hacer hoy, lo que falta hacer.
 */
export type DelDespertar =
  | { que: 'deuda'; ahora: number; antes: number | null }
  | { que: 'desayuno' }
  | { que: 'comida'; comida: SinDesayuno; van: SinDesayuno[]; kcal?: number }
  | { que: 'melatonina'; desde: number; hasta: number }
  | { que: 'revoluciones' | 'gafas'; cama: number }
  | { que: 'descarga' }
  | { que: 'pendientes'; lista: string[] };

/** Las dos respuestas de «¿Desayunas hoy?», en los botones del aviso. */
export const RESPUESTAS_DEL_DESAYUNO = ['si', 'directo'] as const;
export type RespuestaDelDesayuno = (typeof RESPUESTAS_DEL_DESAYUNO)[number];

/** Los de Perfil › Avisos, en sus dos grupos: los que vienen prendidos y los que no. */
export const DE_FABRICA = ['deuda', 'pesarse', 'horario', 'melatonina', 'revoluciones', 'luces', 'dormir'] as const;
export const MAS = ['descarga', 'gafas', 'cafe', 'entrenarTarde', 'ultimaComida'] as const;

/**
 * Con todo lo de fábrica, un día con merienda llega a diez (la deuda, pesarse, el desayuno, cuatro comidas, la
 * melatonina, bajar el ritmo, las luces y acostarte): con el máximo de siempre (6) se perdía la noche.
 */
export const MAXIMO_QUE_SIGUE_EL_DESPERTAR = 10;
/**
 * El máximo de quien nunca lo eligió: el de fábrica, que sube solo con lo que se prende aparte, como en la galería
 * 50: dos por anotar lo que tienes en la cabeza (el de la noche y «Lo que hay que hacer hoy») y uno por las gafas.
 * Sin eso, prenderlos dejaba afuera justo el aviso de anotar, y bajar el ritmo. El que se eligió a mano no se toca.
 */
export const maximoDeFabrica = (a: Pick<Avisos, 'descarga' | 'gafas'>): number =>
  MAXIMO_QUE_SIGUE_EL_DESPERTAR + (a.descarga?.encendido ? 2 : 0) + (a.gafas?.encendido ? 1 : 0);
/** Bajar el ritmo (`revoluciones`, en lo guardado), una hora antes de acostarte (Rise: de 1 a 2 h; es una convención). */
export const REVOLUCIONES = 60;
/** Las gafas, 2 h antes de acostarte, como en el ensayo de Shechter 2018. */
export const GAFAS = 120;
/** Anotar lo que tienes en la cabeza, al acostarte: cinco minutos antes de apagar la luz (Scullin 2018). */
export const DESCARGA = 5;
/**
 * Si Moss se entera de tu despertar más de dos horas después, la deuda y pesarse ya no son «al despertarte»: no suenan.
 * El desayuno sí pregunta. Es una convención.
 */
export const MANANA_QUE_SE_PASO = 120;

const aCuarto = (x: number) => Math.round(x / 15) * 15;
const aDiez = (x: number) => Math.round(x / 10) * 10;

export type DeSigueElDespertar = Pick<DelDia, 'dia' | 'ajustes' | 'sueno' | 'horaDeComida' | 'anotadas' | 'eventos' | 'diaDelControl'> & {
  /** La deuda de ayer, en minutos (deudaDeSueno sin la noche de hoy): para decir si bajó o subió. */
  deudaAntes?: number | null;
  /** Lo que contestaste hoy a «¿Desayunas hoy?», si contestaste. */
  desayuno?: RespuestaDelDesayuno | null;
  /** Para repartir lo del desayuno: la meta de hoy y lo comido hasta ahora. Sin meta o sin números, sin kcal. */
  meta?: Macros | null;
  comido?: Macros;
  sinNumeros?: boolean;
  /** Los pendientes de ese día (pendientesPara, en pendientes.ts), hechos o no. */
  pendientes?: readonly Pick<Pendiente, 'texto' | 'hecho'>[];
};

/**
 * Lo prendido de fábrica, para quien no eligió: la deuda, la melatonina, las revoluciones, las luces, la hora de
 * dormir, el horario con el desayuno, el almuerzo y la cena a sus horas de siempre, y el máximo de diez, que sube
 * con anotar lo que tienes en la cabeza y con las gafas (maximoDeFabrica). Pesarse sigue como lo elegiste; lo demás,
 * apagado.
 */
export function deFabrica(a: Avisos, horaDeComida: (c: Comida) => number): Avisos {
  const prendido = { encendido: true };
  return {
    ...a,
    dormir: a.dormir ?? prendido, deuda: a.deuda ?? prendido, melatonina: a.melatonina ?? prendido,
    revoluciones: a.revoluciones ?? prendido, luces: a.luces ?? prendido,
    horario: a.horario ?? Object.fromEntries((['desayuno', 'almuerzo', 'cena'] as const).map((c) => [c, aCuarto(horaDeComida(c))])),
    maximoPorDia: a.maximoPorDia ?? maximoDeFabrica(a),
  };
}

/** Lo de la mañana, el reparto del desayuno y lo de la noche, como avisos para avisosDelDia (en `conviene`). */
export function avisosDelDespertar(op: DeSigueElDespertar): Aviso[] {
  const { ajustes, sueno } = op;
  if (!sueno?.despertarReal) return [];
  const prendido = (q: 'deuda' | 'melatonina' | 'revoluciones' | 'descarga' | 'gafas') => !!ajustes[q]?.encendido;
  const horas = horasDeSueno(op.dia, sueno);
  const lista: Aviso[] = [];

  // La mañana, con el despertar de verdad: cada cosa a SEPARACION de la anterior, para que no se junten, y nada antes
  // de que Moss sepa que te despertaste (inicioDeLaManana).
  const despertar = horas.despertar;
  const inicio = inicioDeLaManana(op.dia, sueno, despertar);
  if (despertar !== null && inicio !== null) {
    let libre = inicio;
    const aTiempo = inicio - despertar <= MANANA_QUE_SE_PASO;
    if (aTiempo && prendido('deuda') && sueno.deuda !== null) {
      const antes = op.deudaAntes == null ? null : redondearDeuda(op.deudaAntes);
      lista.push({ id: 'deuda', tipo: 'deuda', minutos: inicio, despertar: { que: 'deuda', ahora: redondearDeuda(sueno.deuda), antes } });
      libre = inicio + SEPARACION;
    }
    const control = op.diaDelControl === diaDeLaSemana(op.dia);
    if (aTiempo && ajustes.pesarse?.encendido && (control || ajustes.pesarse.todos)) {
      const minutos = Math.max(libre, despertar + PESARSE_DESPUES);
      lista.push({ id: 'pesarse', tipo: 'pesarse', minutos, ...(control ? { control: true } : {}) });
      libre = minutos + SEPARACION;
    }
    if (ajustes.horario?.desayuno !== undefined) {
      const minutos = Math.max(libre, ajustes.horario.desayuno);
      lista.push({
        id: 'desayuno', tipo: 'desayuno', comida: 'desayuno', minutos, despertar: { que: 'desayuno' },
        // Ya pregunta por el desayuno: el de su hora y el de «falta anotar», que contaban desde la hora de siempre
        // (con un despertar tarde, mientras dormías), no hacen falta.
        reemplaza: ['horario:desayuno', 'comida:desayuno'],
      });
      libre = minutos + SEPARACION;
    }
    // Lo que hay que hacer hoy: lo que anotaste anoche, después de lo último de la mañana. Con todo hecho no suena,
    // pero guarda su lugar en el máximo, como lo demás que ya pasó.
    const pendientes = op.pendientes ?? [];
    if (prendido('descarga') && pendientes.length) {
      const sinHacer = pendientes.filter((p) => !p.hecho).map((p) => p.texto);
      lista.push({ id: 'pendientes', tipo: 'pendientes', minutos: libre, despertar: { que: 'pendientes', lista: sinHacer }, ...(sinHacer.length ? {} : { sobra: true as const }) });
    }
  }

  // Sin desayuno, lo que queda del día se reparte entre las comidas que quedan, a su hora corrida por lo anotado.
  const anotadas = Object.fromEntries(Object.entries(op.eventos ?? {}).filter(([k]) => k !== 'entrenamiento')) as Partial<Record<Comida, number>>;
  const comio = (c: ConHora) => anotadas[c] !== undefined || !!op.anotadas?.has(c);
  const sinDesayuno = op.desayuno === 'directo' || (!comio('desayuno') && CON_HORA.some((c) => c !== 'desayuno' && comio(c)));
  if (sinDesayuno && ajustes.horario) {
    const base: Partial<Record<Comida, number>> = { ...Object.fromEntries(CON_HORA.map((c) => [c, op.horaDeComida(c)])), ...ajustes.horario };
    const corridas = horasCorridas(base, anotadas, true);
    const ultima = Math.max(-1, ...CON_HORA.map((c, i) => (comio(c) ? i : -1)));
    const van = CON_HORA.filter((c, i): c is SinDesayuno => c !== 'desayuno' && i > ultima && ajustes.horario?.[c] !== undefined);
    const peso = (c: ConHora) => REPARTO[4][c] ?? 0;
    const total = van.reduce((s, c) => s + peso(c), 0);
    const queda = op.meta && !op.sinNumeros ? Math.max(0, op.meta.kcal - (op.comido?.kcal ?? 0)) : 0;
    van.forEach((c, i) => {
      const kcal = queda > 0 && total > 0 ? aDiez((queda * peso(c)) / total) : 0;
      lista.push({
        id: `despertar:${c}`, tipo: 'horario', comida: c, minutos: corridas[c] ?? base[c] ?? 0,
        despertar: { que: 'comida', comida: c, van: van.slice(i), ...(kcal > 0 ? { kcal } : {}) },
        reemplaza: [`horario:${c}`],
      });
    });
  }

  // La noche, desde la hora de acostarte de esta noche: la de tu periodo de melatonina o, sin él, la de antes.
  const cama = horas.acostarse;
  if (cama !== null) {
    // El periodo se anuncia cuando la melatonina empieza a subir, unas dos horas antes de que empiece (PERIODO, en
    // melatonina.ts), con las mismas horas que dice Sueño. Sin periodo, no suena.
    const p = horas.periodo;
    if (prendido('melatonina') && p) lista.push({ id: 'melatonina', tipo: 'melatonina', minutos: p.inicio, despertar: { que: 'melatonina', desde: p.desde, hasta: p.hasta } });
    if (prendido('gafas')) lista.push({ id: 'gafas', tipo: 'gafas', minutos: cama - GAFAS, despertar: { que: 'gafas', cama } });
    if (prendido('revoluciones')) lista.push({ id: 'revoluciones', tipo: 'revoluciones', minutos: cama - REVOLUCIONES, despertar: { que: 'revoluciones', cama } });
    if (prendido('descarga')) lista.push({ id: 'descarga', tipo: 'descarga', minutos: cama - DESCARGA, despertar: { que: 'descarga' } });
  }
  return lista;
}

/** Lo que suena un día que sigue tu despertar: avisosDelDia con lo que conviene y lo de este archivo adentro. */
export function avisosQueSiguenElDespertar(op: Omit<DelDia, 'conviene' | 'sesiones'> & DeLoQueConviene & DeSigueElDespertar): Notificacion[] {
  return avisosDelDia({ ...op, conviene: [...loQueConviene(op), ...avisosDelDespertar(op)] });
}

/** Las anclas que dicen que te despertaste: parar la alarma o el despertador de Moss, o el atajo «Me desperté». */
export const ANCLAS_DEL_DESPERTAR = ['alarmaParada', 'despertadorParado', 'meDesperte'] as const;
/**
 * El final de la noche en Salud y abrir Moss cuentan desde 3 h antes de tu despertar de siempre: abrirla a las 4:30
 * para ver la hora, o un tramo de sueño que Salud cortó en la madrugada, no es despertarse. Es una convención.
 */
export const ANTES_DE_LO_DE_SIEMPRE = 180;
/** Abrir Moss por primera vez pasado el mediodía y un rato no es «de mañana»: no dice a qué hora te despertaste. */
export const APERTURA_HASTA = 13 * 60;

/** Lo que dice a qué hora te despertaste un día, todo en minutos desde la medianoche de ese día. */
export type SenalesDelDespertar = {
  /** Cuándo terminó la noche de ese día en Salud; null sin noche. */
  salud: number | null;
  /** Cuándo llegó cada ancla del despertar (ANCLAS_DEL_DESPERTAR). */
  anclas: readonly number[];
  /** Cuándo se abrió Moss ese día. */
  aperturas: readonly number[];
  /** A qué hora empieza el día (D32): lo de antes es de la noche. */
  corte: number;
  /** Tu despertar de siempre, si se sabe. */
  habitual: number | null;
  ahora: number;
};

/**
 * El despertar real de un día: lo más temprano de lo que llegó, sea el final de la noche en Salud, el despertador, el
 * atajo o la primera vez que abriste Moss de mañana. Nada del futuro ni de antes del corte; null mientras no hay nada.
 */
export function despertarDelDia(s: SenalesDelDespertar): number | null {
  const desde = Math.max(s.corte, s.habitual === null ? 0 : s.habitual - ANTES_DE_LO_DE_SIEMPRE);
  const entre = (m: number, d: number, hasta: number) => Number.isFinite(m) && m >= d && m <= Math.min(hasta, s.ahora);
  const candidatos = [
    ...(s.salud !== null && entre(s.salud, desde, Infinity) ? [s.salud] : []),
    ...s.anclas.filter((m) => entre(m, s.corte, Infinity)),
    ...s.aperturas.filter((m) => entre(m, desde, APERTURA_HASTA)),
  ];
  return candidatos.length ? Math.round(Math.min(...candidatos)) : null;
}
