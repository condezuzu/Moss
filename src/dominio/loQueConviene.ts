// Lo que conviene hacer (lo pediste el 3/11/2026): avisos como los de Rise, que sugieren qué hacer, a qué hora y
// por qué (desde el 18/11, sugerencias y no órdenes), así no hace falta abrir Moss para saberlo. Cada uno dice una sola cosa y suena cuando hay que
// hacerla. Salen del entreno de ese día (Perfil › Entrenamiento, con lo que tardás en llegar al gimnasio) y de
// la hora de ir a la cama (horasDeSueno, en avisos.ts):
// - Comer antes de entrenar: la comida de siempre que cae desde 4 h antes de empezar hasta 1 h antes de salir;
//   si ninguna cae, algo liviano 60 a 90 minutos antes de salir. Suena media hora antes de esa comida, con los
//   gramos de alrededorDelEntreno.ts y poca grasa. La hora de esa comida, y las que caerían justo antes de salir
//   o en medio del entreno, ya no suenan aparte: comer apenas salís no conviene.
// - El café: una hora antes de entrenar, si todavía no le quita al sueño; si no, desde qué hora mejor sin cafeína
//   (corteDeCafeina: desde la hora de acostarte y según la cafeína de una toma). Con tu periodo de melatonina, esa
//   hora es la del periodo (su comienzo menos tu margen para dormirte) y el aviso lo nombra (18/11/2026).
// - La proteína de después, al terminar: en la comida que sigue o, si hace mucho que no comés, cuanto antes.
// - Con dos sesiones el mismo día (dos deportes, sesionesDelDia), cada una lleva lo suyo. Si la comida de después
//   de una es la de antes de la otra, queda el de antes, que ya trae los carbohidratos; y haber entrenado es de
//   una sola sesión.
// - Lo que cuenta hacia atrás desde la cama: la última comida grande (3 h antes), terminar lo fuerte (2 h
//   antes) y bajar las luces (hora y media antes).
// - Con Ascent vinculada, la recuperación al despertarte, los días que entrenás.
// - Según el deporte (para aprobar, segunElDeporte.ts): la víspera de un partido, «Mañana juegas», y dos días
//   antes de una carrera de más de 90 minutos, «Tu carrera es pasado mañana», a la hora del almuerzo de
//   siempre: carbohidratos en todas las comidas. Toman el lugar de la hora del almuerzo.
// Es parte del plan del día, como lo demás de avisos.ts: lo hecho (la comida anotada, entrenar a otra hora)
// no lo saca del plan, lo deja como que sobra. Con «sin déficit», nada de comida ni de café para entrenar; con
// cuidados de salud marcados, lo que cada uno apaga (cuidados.ts).
// Acá van códigos; el texto sale de textoDelAviso y tituloDelAviso (avisos.ts). Las fuentes, en spec/avisos.md.

import { carbohidratosPrevios, COMIDA_PREVIA, corteDeCafeina, cuenta, ENTRE_PREVIA_Y_POSTERIOR, POSTERIOR_HASTA, proteinaDeComida, type Contexto, type Entreno, type Principal, type Sesion } from './alrededorDelEntreno';
import { avisosDelDia, horasDeSueno, type Aviso, type DelDia, type Notificacion } from './avisos';
import { CON_HORA, horasCorridas, type Comida } from './comidas';
import { deportesDePerfil } from './cuestionario';
import type { ClaveDia } from './fechas';
import { CERCA_DE_LA_CAMA, cercaDeLaCama } from './loQueFalta';
import type { Macros } from './metas';
import { DIAS_DE_CARGA, diasParaLaCarrera, partidoManana, partidosEntre, type Carrera, type Partido } from './segunElDeporte';

/** Los de lo que conviene: cada uno tiene su interruptor en Perfil › Avisos (Avisos, en avisos.ts). */
export const QUE_CONVIENE = ['antesDeEntrenar', 'despuesDeEntrenar', 'cafe', 'ultimaComida', 'entrenarTarde', 'luces', 'recuperacion', 'partido', 'carrera'] as const;
export type QueConviene = (typeof QUE_CONVIENE)[number];

/**
 * Lo que dice cada uno. Las horas, en minutos del día (lo de la noche puede pasar de 1440); los gramos, de a 5.
 * - antesDeEntrenar: qué comida (o algo liviano), a qué hora, si es más temprano que la de siempre y cuánto.
 * - despuesDeEntrenar: en qué comida y a qué hora o, sin comida cerca, antes de qué hora.
 * - cafe: antes de entrenar (a qué hora y cuánto falta para acostarte) o el corte del día: desde qué hora, la hora de
 *   acostarte y, si lo hay, el comienzo de tu periodo de melatonina, del que sale.
 * - entrenarTarde: hasta qué hora lo fuerte; `suave` si ya no da el tiempo.
 * - recuperacion: de 0 a 100; lo dormido anoche, solo si fue poco.
 * - partido y carrera: la víspera del partido y dos días antes de la carrera larga; el texto no lleva números.
 */
export type Conviene =
  | { que: 'antesDeEntrenar'; comida: Comida; a: number; adelantada?: true; proteina?: number; carbohidratos?: number }
  | { que: 'despuesDeEntrenar'; comida?: Principal; a: number; proteina?: number }
  | { que: 'cafe'; forma: 'antes'; a: number; faltan: number }
  | { que: 'cafe'; forma: 'ultimo' | 'ultimoEntrenas'; a: number; cama: number; periodo?: number; entreno?: number }
  | { que: 'ultimaComida'; a: number; cama: number }
  | { que: 'entrenarTarde'; a: number; entreno: number; cama: number; suave?: true }
  | { que: 'luces'; cama: number }
  | { que: 'recuperacion'; porcentaje: number; fuerte: boolean; dormido?: number }
  | { que: 'partido' }
  | { que: 'carrera' };

/** Lo que tardás en llegar al gimnasio si no se eligió, y lo que se puede elegir, en minutos. */
export const VIAJE_DE_FABRICA = 15;
export const VIAJES = [0, 15, 30, 45, 60] as const;
/**
 * La comida de antes, de 1 a 4 h antes del ejercicio (ACSM 2016). Lo más cerca cuenta desde que salís (comer y
 * salir enseguida no conviene) y lo más lejos, desde que empezás: con una hora de viaje, comer 5 h antes de
 * empezar ya no es la comida de antes.
 */
export const ANTES_DE_SALIR = 60;
export const ANTES_DE_EMPEZAR = 240;
/** Sin comida en esas horas, algo liviano entre 60 y 90 minutos antes de salir: a los 75. */
export const ALGO_ANTES_DE_SALIR = 75;
/** El aviso de comer suena media hora antes de esa comida: da tiempo a elegir qué. */
export const AVISO_ANTES_DE_COMER = 30;
/** El café para entrenar, una hora antes de empezar (ISSN 2021); el aviso, un cuarto de hora antes. */
export const CAFE_ANTES = 60;
const AVISO_DE_CAFE = 15;
/**
 * La última comida grande, 2 h antes de ir a la cama, o 3 con reflujo (ACG 2022: 2 a 3 h; Fujiwara 2005), como lo
 * de la noche en loQueFalta.ts (cercaDeLaCama). Se corre con la hora de la cama: con deuda, también ella.
 */
export const ULTIMA_COMIDA = CERCA_DE_LA_CAMA;
/** Su aviso, 45 minutos antes de esa hora, o un cuarto de hora antes de tu cena si es más temprano. */
const AVISO_DE_ULTIMA_COMIDA = 45;
const ANTES_DE_LA_CENA = 15;
/**
 * Lo fuerte, que termine 2 h antes de la cama: lo intenso que termina 2 a 4 h antes no cambia el sueño (Frimpong
 * 2021) y en la hora de antes, quizá sí (Stutz 2019). En noches reales, desde 4 h antes no se ve nada (Leota 2025,
 * que recomienda 4 h). El aviso, media hora antes de salir.
 */
export const FIN_DE_LO_FUERTE = 120;
const AVISO_DE_ENTRENO_TARDE = 30;
/** Con menos de esto entre que empezás y esa hora, mejor algo suave. */
const MINIMO_PARA_LO_FUERTE = 30;
/**
 * Las luces, hora y media antes de la cama, como Rise. El consenso de Brown 2022 pide luz baja desde al menos 3 h
 * antes (D2 de spec/estudio/momentos.md); Gooley 2011 no da un horario: la luz de una habitación en las 8 h antes
 * de dormir atrasó la melatonina y la acortó unos 90 minutos.
 */
export const LUCES = 90;
/** La recuperación, media hora después de despertarte: pesarse va a los 10 y no se corre a antes de despertarte. */
const AVISO_DE_RECUPERACION = 30;
/** Desde esta recuperación, entrenar fuerte: «bien» o «muy bien» en la propuesta de recuperado.ts. */
export const RECUPERACION_FUERTE = 70;
/** Lo dormido se nombra si fue al menos una hora menos de lo que hace falta. */
const POCO_SUENO = 60;
/** Si hace mucho que no comés, la comida de después cuenta solo si cae en esta primera hora. */
const ENSEGUIDA = 60;
/** Algo liviano antes de entrenar no hace falta si ya comiste desde una hora antes hasta salir. */
const YA_COMISTE = 60;
/** Sin comida cerca después: la proteína antes de 1 h si hace mucho que no comés, de 2 h si no (ISSN 2017). */
const SIN_COMIDA_CERCA = { pronto: 60, normal: 120 };

const NADA: Macros = { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
const aCinco = (x: number) => Math.round(x / 5) * 5;
const aCuarto = (x: number) => Math.round(x / 15) * 15;

export type DeLoQueConviene = Pick<DelDia, 'dia' | 'ajustes' | 'sueno' | 'horaDeComida' | 'anotadas' | 'eventos'> & {
  /** Las sesiones de ese día (sesionesDelDia), con su tipo: lo suave o corto no cuenta. */
  sesiones?: readonly Sesion[];
  /** Lo que tardás en llegar al gimnasio, en minutos (Entreno.viaje). */
  viaje?: number;
  /** Cuándo entrenaste hoy, si ya se sabe (la marca del hábito de entrenar o el final de la sesión de Ascent), en minutos. */
  entrenado?: number | null;
  /** Para los gramos: la meta de ese día y, hoy, lo comido hasta ahora. Sin meta, sin números. */
  meta?: Macros | null;
  comido?: Macros;
  pesoKg?: number | null;
  edad?: number;
  comidasHabituales?: 3 | 4;
  /** La cafeína de una toma, en mg, si se anota seguido: con más de 200 mg el corte es antes. */
  cafeinaPorToma?: number | null;
  /** «Sin déficit», el sí o no de antes: nada de comida ni de café para entrenar, ni de la última comida. */
  sinDeficit?: boolean;
  /**
   * Con cuidados de salud marcados (cuidados.ts), en lugar de «sin déficit»: si apagan lo de comer para entrenar.
   * Entonces tampoco el café de antes; lo demás que apagan llega apagado en `ajustes`, y la última comida queda libre.
   */
  sinLoDeEntrenar?: boolean;
  /** Reflujo, en Cuidados: la última comida grande, 3 h antes de la cama en vez de 2. */
  reflujo?: boolean;
  /** «Mostrar números» apagado: sin gramos. */
  sinNumeros?: boolean;
  /** Ascent prendida (CON_ASCENT) y vinculada: sin eso, no hay recuperación. */
  conAscent?: boolean;
  /** La recuperación de esa mañana, de 0 a 100, y lo dormido anoche, en minutos. Mientras no llega, null. */
  recuperacion?: { porcentaje: number; dormido?: number | null } | null;
  /** Los partidos con fecha (partidosEntre, en segunElDeporte.ts) y la próxima carrera, de Perfil › Entrenamiento. */
  partidos?: readonly Partido[];
  carrera?: Carrera | null;
};

/**
 * Lo del deporte para los avisos, de lo guardado en Perfil › Entrenamiento: con partidos o choques, los partidos de
 * cada semana entre dos fechas; con correr, bici o nadar, la próxima carrera. Sin ese deporte no hay aviso ni
 * interruptor (`partido` y `carrera` dicen cuáles van en Perfil › Avisos). Los deportes son los que muestra Perfil ›
 * Entrenamiento (deportesDePerfil), aunque la hora se haya cambiado a mano: el partido sigue siendo ese día.
 */
export function delDeporte(entreno: Entreno | null | undefined, desde: ClaveDia, hasta: ClaveDia): { partido: boolean; carrera: boolean; partidos: Partido[]; proximaCarrera: Carrera | null } {
  const tipos = entreno?.dias.length ? deportesDePerfil(entreno) : [];
  const partido = tipos.includes('equipo') || tipos.includes('contacto');
  const carrera = tipos.includes('resistencia');
  return {
    partido, carrera,
    partidos: partido && entreno ? partidosEntre({ sesiones: entreno.sesiones ?? [], partidos: entreno.partidos }, desde, hasta) : [],
    proximaCarrera: (carrera && entreno?.carrera) || null,
  };
}

/**
 * Lo que conviene hacer un día, como avisos para avisosDelDia (en `conviene`): solo los prendidos y los que
 * aplican ese día. Lo que ya pasó queda en el plan, con `sobra`; lo que reemplazan, en `reemplaza`.
 */
export function loQueConviene(op: DeLoQueConviene): Aviso[] {
  const { ajustes } = op;
  const prendido = (q: QueConviene) => !!ajustes[q]?.encendido;
  if (!QUE_CONVIENE.some(prendido)) return [];
  const horas = op.sueno ? horasDeSueno(op.dia, op.sueno) : null;
  const despertar = horas?.despertar ?? null;
  const dormir = horas?.dormir ?? null;
  const cama = horas?.acostarse ?? null;
  const despierto = (m: number) => despertar === null || m >= despertar;
  const desdeQueDespierta = (m: number) => Math.max(m, despertar ?? m);
  // Tus horas de comer (horasDeComer); hoy, corridas por lo que ya anotaste (horasCorridas).
  // Al cuarto de hora: desayunar cinco minutos tarde no hace decir «almuerzo a las 13:05».
  const anotadasHoy = Object.fromEntries(Object.entries(op.eventos ?? {}).filter(([k]) => k !== 'entrenamiento')) as Partial<Record<Comida, number>>;
  const base = Object.fromEntries(CON_HORA.map((c) => [c, op.horaDeComida(c)]));
  const corridas = horasCorridas(base, anotadasHoy);
  const hora = Object.fromEntries(CON_HORA.map((c) => [c, aCuarto(corridas[c] ?? base[c])])) as Record<Principal, number>;
  const viaje = op.viaje ?? VIAJE_DE_FABRICA;
  const entrenado = op.entrenado ?? op.eventos?.entrenamiento ?? null;
  const sesiones = (op.sesiones ?? []).filter(cuenta).sort((a, b) => a.inicio - b.inicio);
  const contexto = (s: Sesion): Contexto => ({
    ahora: 0, sesiones: [s], horaDeComida: hora, anotado: {}, meta: op.meta ?? NADA, comido: op.comido ?? NADA,
    comidasHabituales: op.comidasHabituales ?? 3, pesoKg: op.pesoKg ?? null, edad: op.edad ?? 30,
    despertar, dormir, acostarse: cama, cafeinaPorToma: op.cafeinaPorToma ?? null, sinDeficit: !!op.sinDeficit,
  });
  const gramos = (g: number | null) => (op.meta && !op.sinNumeros && g !== null && g > 0 ? g : undefined);
  const lista: Aviso[] = [];

  /** La comida de antes de una sesión: cuál y a qué hora, y las que caerían encima de salir o del entreno. */
  const previaDe = (s: Sesion) => {
    const salida = s.inicio - viaje;
    const enHora = CON_HORA.filter((c) => salida - hora[c] >= ANTES_DE_SALIR && s.inicio - hora[c] <= ANTES_DE_EMPEZAR && despierto(hora[c]));
    const encima = CON_HORA.filter((c) => hora[c] > salida - ANTES_DE_SALIR && hora[c] < s.inicio + s.minutos);
    // De las que caen bien, la más cercana a la salida.
    const elegida = enHora.sort((a, b) => hora[b] - hora[a])[0];
    if (elegida) return { salida, encima, comida: elegida as Comida, a: hora[elegida], adelantada: false };
    const a = aCuarto(salida - ALGO_ANTES_DE_SALIR);
    // Si entrenás apenas te despertás, no hay antes: lo dice la línea de la comida (en ayunas).
    if (!despierto(a)) return null;
    // La comida que caía encima se adelanta; si no, algo liviano.
    return { salida, encima, comida: (encima[0] ?? 'snack') as Comida, a, adelantada: encima.length > 0 };
  };

  const previas = sesiones.map(previaDe);
  const sinEntrenar = !!op.sinDeficit || !!op.sinLoDeEntrenar;
  const conLoDeAntes = prendido('antesDeEntrenar') && !sinEntrenar;
  // Con dos sesiones, haber entrenado es de una sola: la última que ya había empezado o, si fue antes de todas, la
  // primera. La otra sigue en pie, con sus avisos.
  const deLaMarca = entrenado === null ? -1 : sesiones.reduce((k, x, j) => (x.inicio <= entrenado ? j : k), 0);
  const entrenadoLa = (i: number) => (i === deLaMarca ? entrenado : null);
  sesiones.forEach((s, i) => {
    const previa = previas[i];
    const fin = s.inicio + s.minutos;
    const hecha = entrenadoLa(i);
    if (conLoDeAntes && previa) {
      const c = contexto(s);
      const minutosAntes = s.inicio - previa.a;
      const principal = previa.comida === 'snack' ? null : previa.comida;
      const proteina = gramos(proteinaDeComida(c, minutosAntes >= COMIDA_PREVIA[0] ? 'normal' : 'liviana'));
      const carbohidratos = gramos(carbohidratosPrevios(c, s, minutosAntes));
      // Algo liviano: si ya comiste cerca de esa hora, no hace falta.
      const comioCerca = !principal && Object.values(anotadasHoy).some((m) => m !== undefined && m >= previa.a - YA_COMISTE && m <= previa.salida);
      lista.push({
        id: `antesDeEntrenar:${i}`, tipo: 'antesDeEntrenar', minutos: desdeQueDespierta(previa.a - AVISO_ANTES_DE_COMER),
        // Con la comida, avisosDelDia sabe si ya se anotó (o una posterior), y tocarlo abre esa comida.
        ...(principal ? { comida: principal } : {}),
        conviene: {
          que: 'antesDeEntrenar', comida: previa.comida, a: previa.a, ...(previa.adelantada ? { adelantada: true as const } : {}),
          ...(proteina ? { proteina } : {}), ...(carbohidratos ? { carbohidratos } : {}),
        },
        reemplaza: [...new Set([...(principal ? [`horario:${principal}`] : []), ...previa.encima.flatMap((x) => [`horario:${x}`, `comida:${x}`])])],
        ...(hecha !== null ? { sobra: true as const, sobraDesde: hecha } : comioCerca ? { sobra: true as const } : {}),
      });
    }
    if (prendido('despuesDeEntrenar') && !sinEntrenar) {
      const posterior = CON_HORA.filter((c) => hora[c] >= fin && hora[c] <= fin + POSTERIOR_HASTA).sort((a, b) => hora[a] - hora[b])[0];
      // Lo último que comiste antes de entrenar: la comida de antes o, sin ella, la última de siempre antes de salir.
      const ultima = previa?.a ?? Math.max(-Infinity, ...CON_HORA.map((c) => hora[c]).filter((m) => m <= s.inicio - viaje));
      const sinComer = !Number.isFinite(ultima) || (despertar !== null && ultima < despertar);
      const pronto = sinComer || (posterior ? hora[posterior] : fin + SIN_COMIDA_CERCA.normal) - ultima > ENTRE_PREVIA_Y_POSTERIOR;
      // En esa comida; si hace mucho que no comés, solo si cae enseguida.
      const enLa = posterior !== undefined && (!pronto || hora[posterior] - fin <= ENSEGUIDA) ? posterior : null;
      // Con dos sesiones ese día, si esa comida es también la de antes de la otra, alcanza con ese aviso: ya dice a
      // qué hora y cuánto, con los carbohidratos que piden dos sesiones seguidas.
      const yaLoDiceElDeAntes = conLoDeAntes && !!enLa && previas.some((p, j) => j > i && p?.comida === enLa);
      const proteina = gramos(proteinaDeComida(contexto(s), pronto ? 'ayunas' : 'despues'));
      if (!yaLoDiceElDeAntes) lista.push({
        id: `despuesDeEntrenar:${i}`, tipo: 'despuesDeEntrenar', minutos: fin,
        ...(enLa ? { comida: enLa } : {}),
        conviene: enLa
          ? { que: 'despuesDeEntrenar', comida: enLa, a: hora[enLa], ...(proteina ? { proteina } : {}) }
          : { que: 'despuesDeEntrenar', a: aCinco(fin + (pronto ? SIN_COMIDA_CERCA.pronto : SIN_COMIDA_CERCA.normal)), ...(proteina ? { proteina } : {}) },
        // La hora de esa comida, si cae enseguida, ya la dice este.
        ...(enLa && hora[enLa] - fin <= ENSEGUIDA ? { reemplaza: [`horario:${enLa}`] } : {}),
        // Entrenaste antes de la hora de tu sesión: el final de la sesión ya no es el tuyo.
        ...(hecha !== null && hecha < s.inicio ? { sobra: true as const, sobraDesde: hecha } : {}),
      });
    }
  });

  if (prendido('cafe') && cama !== null) {
    // Desde la hora de acostarte y según lo que tiene una toma; con un té, sin corte (null). Con tu periodo de
    // melatonina, la hora de acostarte es la suya (horasDeSueno): Gardiner 2023 cuenta desde que te acuestas.
    const corte = corteDeCafeina(cama, op.cafeinaPorToma ?? null);
    const periodo = horas?.periodo ? { periodo: horas.periodo.desde } : {};
    // La primera sesión en la que el café de antes cae después de despertarte; con «sin déficit», ninguna.
    const s = sinEntrenar ? undefined : sesiones.find((x) => despierto(x.inicio - CAFE_ANTES));
    const a = s && (corte === null || s.inicio - CAFE_ANTES <= corte) ? s.inicio - CAFE_ANTES : null;
    const minutos = a !== null ? desdeQueDespierta(a - AVISO_DE_CAFE) : null;
    // Si entrenaste a otra hora antes de que sonara, queda el último café del día; si ya había sonado, sobra.
    const hecha = s ? entrenadoLa(sesiones.indexOf(s)) : null;
    const yaSono = minutos !== null && hecha !== null && hecha >= minutos;
    if (a !== null && minutos !== null && (hecha === null || yaSono)) {
      lista.push({
        id: 'cafe', tipo: 'cafe', minutos, conviene: { que: 'cafe', forma: 'antes', a, faltan: cama - a },
        ...(hecha !== null ? { sobra: true as const } : {}),
      });
    } else if (corte !== null && despierto(corte)) {
      // Suena en el corte: «desde ahora, mejor sin cafeína» (lo pediste el 18/11/2026). Si ya entrenaste, queda solo
      // el corte: lo de entrenar ya no viene al caso.
      const entreno = s && hecha === null ? s.inicio : null;
      lista.push({
        id: 'cafe', tipo: 'cafe', minutos: corte,
        conviene: { que: 'cafe', forma: entreno !== null ? 'ultimoEntrenas' : 'ultimo', a: corte, cama, ...periodo, ...(entreno !== null ? { entreno } : {}) },
      });
    }
  }

  if (prendido('ultimaComida') && cama !== null && !op.sinDeficit) {
    const limite = cama - cercaDeLaCama(op.reflujo);
    // Si entrenás en esas horas, comés después, y de eso habla el de después de entrenar; si el de antes o el de
    // después ya hablan de la cena, alcanza con ese.
    const deLaCena = lista.some((a) => a.comida === 'cena');
    const minutos = Math.min(limite - AVISO_DE_ULTIMA_COMIDA, hora.cena - ANTES_DE_LA_CENA);
    if (!deLaCena && !sesiones.some((s) => s.inicio + s.minutos > limite) && despierto(minutos)) {
      lista.push({ id: 'ultimaComida', tipo: 'ultimaComida', minutos, comida: 'cena', conviene: { que: 'ultimaComida', a: limite, cama }, reemplaza: ['horario:cena'] });
    }
  }

  if (prendido('entrenarTarde') && cama !== null) {
    const limite = cama - FIN_DE_LO_FUERTE;
    sesiones.forEach((s, i) => {
      if (s.inicio + s.minutos <= limite) return;
      const suave = s.inicio > limite - MINIMO_PARA_LO_FUERTE;
      lista.push({
        id: `entrenarTarde:${i}`, tipo: 'entrenarTarde', minutos: s.inicio - viaje - AVISO_DE_ENTRENO_TARDE,
        conviene: { que: 'entrenarTarde', a: limite, entreno: s.inicio, cama, ...(suave ? { suave: true as const } : {}) },
        ...(entrenadoLa(i) !== null ? { sobra: true as const } : {}),
      });
    });
  }

  if (prendido('luces') && cama !== null) lista.push({ id: 'luces', tipo: 'luces', minutos: cama - LUCES, conviene: { que: 'luces', cama } });

  // Según el deporte: a la hora del almuerzo, sin esperar a que lo anotes (habla de todas las comidas), y en
  // lugar de la hora del almuerzo, que ya dice. Con «sin déficit» o sin lo de entrenar, nada: es de comer.
  if (!sinEntrenar) {
    const almuerzo = () => ({ minutos: hora.almuerzo, reemplaza: ['horario:almuerzo'] });
    if (prendido('partido') && partidoManana(op.dia, op.partidos ?? [])) lista.push({ id: 'partido', tipo: 'partido', ...almuerzo(), conviene: { que: 'partido' } });
    if (prendido('carrera') && diasParaLaCarrera(op.dia, op.carrera) === DIAS_DE_CARGA) lista.push({ id: 'carrera', tipo: 'carrera', ...almuerzo(), conviene: { que: 'carrera' } });
  }

  if (prendido('recuperacion') && op.conAscent && despertar !== null && sesiones.length) {
    const r = op.recuperacion ?? null;
    const necesidad = op.sueno?.necesidad ?? 0;
    const poco = r && r.dormido != null && r.dormido < necesidad - POCO_SUENO ? r.dormido : undefined;
    lista.push({
      id: 'recuperacion', tipo: 'recuperacion', minutos: despertar + AVISO_DE_RECUPERACION,
      conviene: { que: 'recuperacion', porcentaje: Math.round(r?.porcentaje ?? 0), fuerte: (r?.porcentaje ?? 0) >= RECUPERACION_FUERTE, ...(poco !== undefined ? { dormido: poco } : {}) },
      // Hasta que llega la de esa mañana no hay nada que decir, pero el lugar queda guardado.
      ...(r ? {} : { sobra: true as const }),
    });
  }
  return lista;
}

/** Lo que suena un día, con lo que conviene adentro: avisosDelDia con lo de loQueConviene. */
export function avisosConLoQueConviene(op: Omit<DelDia, 'conviene' | 'sesiones'> & DeLoQueConviene): Notificacion[] {
  return avisosDelDia({ ...op, conviene: loQueConviene(op) });
}
