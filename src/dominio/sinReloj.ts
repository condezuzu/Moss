// Sin reloj (spec/sueno.md, «Sin reloj»): desde iOS 18, sin un reloj o un anillo Salud no tiene nada
// de la noche, así que la arma Moss cada mañana con lo que el teléfono ya guardó. De noche solo se
// guarda la hora de un Atajo o del despertador de Moss (spec/sueno-sin-esfuerzo.md).
// - La ventana tranquila es el hueco sin actividad (pasos, el teléfono en movimiento, Moss abierta, un
//   Atajo) de 5 a 12 horas que empieza entre las 18 y las 4. Lo suelto de la madrugada no la corta: es
//   una interrupción.
// - Ninguna señal decide sola (lo pediste el 31/10/2026). Cada una propone una hora con su duda (la última
//   actividad más lo que tardás, el cargador, lo que avisaste, tu hora de siempre; a la mañana la primera
//   actividad, el cargador, la alarma) y Moss las junta: las de menos duda pesan más. Lo único que no se
//   negocia es que no estabas dormido antes de la última actividad ni después de la primera.
// - Esos dos ratos son tuyos (D33, lo pediste el 29/10/2026): empiezan en lo de Sahha (31 y 18 minutos)
//   y se aprenden de cada «¿Dormiste de X a Y?» que contestás, o se eligen en «Tardo en dormirme». El de
//   dormirte incluye el rato con el teléfono en la cama, que el movimiento no ve.
// - Si conectaste el cargador y seguiste usando el teléfono, el cargador no cuenta: manda lo último que
//   hiciste. Si dejaste el teléfono mucho antes que siempre, dice poco y pesa más tu hora de siempre.
// - Dice qué tan segura está, por qué señales llegó a esa hora y, si no lo está, pregunta a la mañana.
// La estimación nunca se escribe en Salud (guía 5.1.3 de Apple).

import { diaDeLaSemana, diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { ceroDe, DESPIERTO_SIN_RELOJ, despiertoDeLaNoche, Z_DEL_80, type Confianza, type Fuente, type Noche, type NochePropia } from './sueno';

const MIN = 60_000;

/**
 * Algo que dice que estabas despierto, en milisegundos: pasos, el teléfono en movimiento, Moss abierta o
 * un Atajo. Con `fin`, puede ser lo último del día y nunca es una interrupción. `cargador`, si el Atajo
 * fue conectarlo o desconectarlo.
 */
export type Actividad = { desde: number; hasta: number; tipo: 'pasos' | 'movimiento' | 'moss' | 'atajo'; fin?: true; cargador?: 'conectado' | 'desconectado' };
/** Lo que avisa un Atajo o el despertador de Moss: que te ibas a dormir o que te despertaste (deLasSenales). `de`, qué señal fue. */
export type Ancla = { en: number; que: 'dormir' | 'despertar'; de?: QueSenal };
/** Lo de siempre, en minutos desde las 18: la mediana de las últimas noches del mismo tipo (entre semana o fin de semana). */
export type Habitual = { dormirse: number; despertar: number; noches: number };
/**
 * Lo tuyo, en minutos (D33): cuánto tardás en dormirte después de la última actividad y en tocar el
 * teléfono después de despertarte. `aprendida` es la que aprendió Moss de tus respuestas; `latencia`,
 * la que se usa: la que elegiste en «Tardo en dormirme» o, sin elegir, la aprendida (`elegida` dice
 * cuál). `noches`, de cuántas respuestas aprendió.
 */
export type Personal = { latencia: number; aprendida: number; elegida: boolean; alDespertar: number; noches: number };
/** Por qué la estimación no es segura. */
export type Motivo = 'sinHistoria' | 'pocosDatos' | 'dejasteAntes' | 'agarrasteTarde' | 'usoDeNoche' | 'distintaDeLoDeSiempre' | 'sinVentana' | 'seguisteUsando';
/**
 * Una señal de las que se miraron para un borde de la noche. `en`, su hora en minutos desde las 18;
 * `peso`, de 0 a 1, cuánto pesó en la hora que quedó: 0 si no propone una hora sino que afirma a otra
 * (el cargador) y, con `noCuenta`, si no sirvió (conectaste y seguiste usándolo). `tipos`, qué se vio.
 */
export type Pista = {
  que: 'ultimaActividad' | 'primeraActividad' | 'habitual' | 'cargador' | 'desconectaste' | 'alarma' | 'despertador' | 'meDesperte' | 'meVoyADormir' | 'enfoque';
  en: number;
  peso: number;
  noCuenta?: true;
  tipos?: Actividad['tipo'][];
};

export type Estimacion = {
  clave: ClaveDia;
  /** En minutos desde las 18 del día anterior, con lo tuyo. */
  dormirse: number;
  despertar: number;
  /** La ventana tranquila: la última actividad y la primera. Se guarda para aprender lo tuyo (aprenderPersonal). */
  quieto: { desde: number; hasta: number };
  rango: { dormirse: [number, number]; despertar: [number, number] };
  /** La mitad del rango de cada borde, en minutos (RANGO): se guarda con la noche, para calibrarlo. */
  margen: { dormirse: number; despertar: number };
  confianza: Confianza;
  /** La probabilidad de que los dos bordes estén dentro de una hora (una propuesta, para calibrar). */
  probabilidad: number;
  /** Las veces que se usó el teléfono en medio de la noche: se marcan, no se cuentan como despierto. */
  interrupciones: number;
  motivos: Motivo[];
  /** Qué borde sale de un ancla: con el de despertar, a la mañana se pregunta solo la hora de dormirte. */
  anclada: { dormirse: boolean; despertar: boolean };
  /** Las señales de cada borde, para contar por qué llegó a esa hora. */
  pistas: { dormirse: Pista[]; despertar: Pista[] };
};

/** La ventana tranquila: de 5 a 12 horas, empezando entre las 18 y las 4 (en minutos desde las 18). */
const VENTANA = { minimo: 300, maximo: 720, empiezaHasta: 600 };
/**
 * Lo suelto de la madrugada: hasta 20 minutos, con hora y media de silencio de cada lado, después de
 * tu hora de siempre (o de las 0:30, sin historia). Antes, mirar el teléfono es lo último del día.
 */
const SUELTO = { largo: 20, silencio: 90, antesDeLoDeSiempre: 15, sinHistoria: 390 };
/** Lo que se mira: de las 12 del día anterior a las 14 (en minutos desde las 18). */
const MIRA = { desde: -360, hasta: 1200 };
/** Dos actividades separadas por menos de 5 minutos son una sola. */
const JUNTAS = 5;
/** De que te despertaste a la primera actividad de la mañana, sin nada aprendido (Sahha). */
export const AL_DESPERTAR = 18;
/**
 * De la última actividad a dormirte, sin nada aprendido: 31 minutos, lo de Sahha para quien deja el
 * teléfono a su hora de siempre.
 */
export const LATENCIA = 31;
/** Lo que se puede elegir en «Tardo en dormirme», en minutos (D33). */
export const LATENCIAS = [5, 10, 15, 20, 30, 45, 60, 90] as const;
/** Con el teléfono dejado más de una hora antes de lo de costumbre, baja la confianza. */
const TEMPRANO = { mas: 60 };
/** Con el teléfono dejado después de tu hora de siempre, Sahha mide 18 minutos: lo tuyo, en esa proporción. */
const TARDE = 18;
/**
 * Cuánta duda deja cada señal, en minutos: una propuesta, para calibrar con la prueba contra un reloj
 * (spec/sueno.md). Sahha mide 24 minutos de error mediano en cada borde, unos 35 de desviación, y a la
 * mañana algo menos. Conectar el cargador de noche dice más que dejar el teléfono en la mesa; avisar
 * que te vas a dormir, más todavía.
 */
const DUDA = { quieto: 35, cargador: 28, aviso: 20, habitual: 60, pocaHistoria: 80, primera: 30, desconectar: 20 };
/**
 * Cuánto crece la duda del teléfono por cada minuto que lo dejaste antes de tu hora (más allá de 15),
 * o que lo agarraste después (más allá de 30). Con esto, dejarlo una hora y media o tres horas antes da
 * unos 70 y 160 minutos hasta dormirte: lo que mide Sahha (76 y 153). Conectado al cargador crece menos.
 */
const CRECE = { noche: 1, conCargador: 0.5, margenNoche: 15, manana: 0.5, margenManana: 30 };
/** Con tres respuestas o más, lo tuyo deja menos duda que lo de Sahha. */
const CON_RESPUESTAS = 0.8;
/** El cargador cuenta como haberte acostado si después de conectarlo no usaste el teléfono más de este rato. */
export const USO_TOLERADO = 20;
/** Conectado hasta 3 horas antes de lo último que hiciste: lo conectaste y seguiste usándolo. */
const SEGUISTE = 180;
/** Usar el teléfono hasta esto después de la hora en que Moss te daría dormido no es una interrupción: seguías despierto. */
const SIGUE_DESPIERTO = 30;
/** Desconectar el cargador es de lo primero: pasan como mucho estos minutos desde que te despertaste. */
const ANTES_DE_DESCONECTAR = 10;
/** Entre dos huecos posibles, lo que suma haberse acostado o levantado con una señal: como 2 horas sobre lo de siempre. */
const PUNTOS_POR_SENAL = 120;
/** Sin ventana: la última actividad antes de las 2 y la primera después de las 4. */
const SIN_VENTANA = { antesDe: 480, despuesDe: 600 };
/**
 * El rango que se muestra («entre 23:50 y 00:40») es el del 80 %: ±1,28 veces la duda que queda al juntar las
 * señales de ese borde, por 1,5 si hay de lo que más hace errar en él (en Sahha, usar el teléfono de noche,
 * dejarlo mucho antes o agarrarlo mucho después son el 74 % de los errores grandes; sin ventana, en los dos
 * bordes), y ±10 minutos con un ancla exacta (la alarma). Es una propuesta, a calibrar con la prueba
 * contra un reloj (spec/sueno.md): por eso el margen se guarda con la noche.
 */
const RANGO = { conMotivo: 1.5, ancla: 10 };
/** Sin el margen guardado (una noche de antes, o que bajó de la cuenta), el de su confianza: lo típico del modelo. */
const MARGEN_POR_CONFIANZA: Record<Confianza, { dormirse: number; despertar: number }> = {
  alta: { dormirse: 40, despertar: 35 }, media: { dormirse: 50, despertar: 45 }, baja: { dormirse: 75, despertar: 65 },
};
/**
 * Cuánto pesa lo tuyo contra lo de fábrica (spec/sueno.md, «Aprender de cada persona»): un promedio
 * con contracción, `n·τ² / (n·τ² + σ²)`, con τ lo que cambia de una persona a otra y σ el ruido de
 * cada noche (Sahha mide 24 minutos de error mediano por borde). Con una corrección, un tercio; con
 * tres, más de la mitad; con siete, casi todo.
 */
const ENTRE_PERSONAS = 25;
const DE_CADA_NOCHE = 35;
/**
 * Un «Sí» pesa un tercio de una corrección (dice poco: puede ser aceptar sin mirar); lo viejo pierde
 * la mitad del peso en 30 noches, y una noche de antes, sin la ventana guardada, pesa la mitad.
 */
const PESO = { corregida: 1, confirmada: 1 / 3, vidaMedia: 30, sinVentana: 0.5 };
/** Una corrección de más de tres horas es casi siempre un error (la mañana por la tarde): no enseña. */
const CORRECCION_MAXIMA = 180;

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b);
  const k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : (o[k - 1] + o[k]) / 2;
};

/** La mediana con pesos: el valor donde se pasa la mitad del peso. null si no hay nada. */
function medianaPesada(lista: { x: number; peso: number }[]): number | null {
  const o = [...lista].sort((a, b) => a.x - b.x);
  const total = o.reduce((s, v) => s + v.peso, 0);
  if (!(total > 0)) return null;
  let acumulado = 0;
  for (const v of o) {
    acumulado += v.peso;
    if (acumulado >= total / 2) return v.x;
  }
  return o[o.length - 1].x;
}

type Bloque = { desde: number; hasta: number; tipos: Actividad['tipo'][]; fin: boolean };

/**
 * Lo que proponen las señales, junto: un promedio pesado por 1/duda², lo que pesó cada una y la duda que queda,
 * (Σ 1/duda²)^(−1/2), que es menor que la de cualquiera de ellas.
 */
function juntar(lista: { en: number; duda: number }[]): { en: number; pesos: number[]; duda: number } {
  const inversa = lista.map((p) => 1 / p.duda ** 2);
  const total = inversa.reduce((s, x) => s + x, 0);
  return { en: lista.reduce((s, p, i) => s + p.en * inversa[i], 0) / total, pesos: inversa.map((x) => x / total), duda: 1 / Math.sqrt(total) };
}

/** La actividad en minutos desde las 18, dentro de lo que se mira, juntando lo que está pegado. */
function bloques(actividad: Actividad[], cero: number): Bloque[] {
  const lista = actividad
    .map((a) => ({ desde: (a.desde - cero) / MIN, hasta: (Math.max(a.hasta, a.desde + MIN) - cero) / MIN, tipo: a.tipo, fin: !!a.fin }))
    .filter((a) => a.hasta > MIRA.desde && a.desde < MIRA.hasta)
    .sort((a, b) => a.desde - b.desde);
  const r: Bloque[] = [];
  for (const a of lista) {
    const ultimo = r[r.length - 1];
    if (ultimo && a.desde - ultimo.hasta < JUNTAS) {
      ultimo.hasta = Math.max(ultimo.hasta, a.hasta);
      ultimo.fin ||= a.fin;
      if (!ultimo.tipos.includes(a.tipo)) ultimo.tipos.push(a.tipo);
    } else {
      r.push({ desde: a.desde, hasta: a.hasta, tipos: [a.tipo], fin: a.fin });
    }
  }
  return r;
}

type Ventana = { desde: number; hasta: number; interrupciones: number };

/** Los huecos entre actividades, saltando lo suelto de la madrugada (desde `desde`, en minutos desde las 18). */
function ventanas(b: Bloque[], desde: number): Ventana[] {
  const r: Ventana[] = [];
  for (let i = 0; i + 1 < b.length; i++) {
    let j = i + 1;
    let interrupciones = 0;
    const suelto = (k: number) => k + 1 < b.length && !b[k].fin && b[k].desde >= desde && b[k].hasta - b[k].desde <= SUELTO.largo
      && b[k].desde - b[k - 1].hasta >= SUELTO.silencio && b[k + 1].desde - b[k].hasta >= SUELTO.silencio;
    while (suelto(j)) {
      interrupciones++;
      j++;
    }
    r.push({ desde: b[i].hasta, hasta: b[j].desde, interrupciones });
  }
  return r;
}

/**
 * La noche que estima el teléfono, o null si no alcanza: sin actividad a la mañana todavía no se
 * sabe cuándo te despertaste. `zona` es la de esa noche, en minutos (−180 en Uruguay).
 */
export function estimarNoche(d: {
  clave: ClaveDia;
  zona: number;
  actividad: Actividad[];
  anclas?: Ancla[];
  habitual: Habitual | null;
  /** Lo tuyo (aprenderPersonal); sin nada, lo de Sahha. */
  personal?: Personal | null;
}): Estimacion | null {
  const cero = ceroDe(d.clave, d.zona);
  const anclas = (d.anclas ?? []).map((a) => ({ en: (a.en - cero) / MIN, que: a.que, de: a.de }));
  const cargadores = d.actividad.flatMap((a) => (a.cargador ? [{ que: a.cargador, en: (a.desde - cero) / MIN, deNoche: !!a.fin }] : []));
  // Un ancla es tocar el teléfono: cuenta como actividad. La de irte a dormir puede ser lo último del
  // día aunque llegue tarde: nunca es una interrupción.
  const conAnclas = [...d.actividad, ...(d.anclas ?? []).map((a): Actividad => ({ desde: a.en, hasta: a.en + MIN, tipo: 'atajo', ...(a.que === 'dormir' ? { fin: true as const } : {}) }))];
  const b = bloques(conAnclas, cero);
  const h = d.habitual;
  const validas = ventanas(b, h ? h.dormirse - SUELTO.antesDeLoDeSiempre : SUELTO.sinHistoria).filter((v) => v.hasta - v.desde >= VENTANA.minimo && v.hasta - v.desde <= VENTANA.maximo && v.desde >= 0 && v.desde <= VENTANA.empiezaHasta);
  // Con dos huecos posibles (el teléfono quedó en la mesa toda la tarde), el que más se parece a lo
  // de siempre; sin historia, el más largo.
  // Un hueco que empieza con el cargador o un aviso, o termina con ellos, se parece más a una noche.
  const encima = (v: Ventana) => (h ? Math.max(0, Math.min(v.hasta, h.despertar) - Math.max(v.desde, h.dormirse)) : 0);
  const seAcosto = (v: Ventana) => cargadores.some((c) => c.que === 'conectado' && c.deNoche && c.en <= v.desde && v.desde - c.en <= USO_TOLERADO)
    || anclas.some((a) => a.que === 'dormir' && a.en <= v.desde && v.desde - a.en <= USO_TOLERADO);
  const seLevanto = (v: Ventana) => cargadores.some((c) => c.que === 'desconectado' && Math.abs(c.en - v.hasta) <= JUNTAS)
    || anclas.some((a) => a.que === 'despertar' && a.en > v.desde + 60 && a.en <= v.hasta && v.hasta - a.en < SUELTO.silencio);
  const puntaje = (v: Ventana) => encima(v) + (seAcosto(v) ? PUNTOS_POR_SENAL : 0) + (seLevanto(v) ? PUNTOS_POR_SENAL : 0);
  let v: Ventana | undefined = [...validas].sort((x, y) => puntaje(y) - puntaje(x) || y.hasta - y.desde - (x.hasta - x.desde))[0];
  let sinVentana = false;
  if (!v) {
    const antes = b.filter((x) => x.hasta <= SIN_VENTANA.antesDe && x.hasta >= -60);
    const despues = b.filter((x) => x.desde >= SIN_VENTANA.despuesDe);
    if (!antes.length || !despues.length) return null;
    const desde = antes[antes.length - 1].hasta, hasta = despues[0].desde;
    if (hasta - desde < 180 || hasta - desde > VENTANA.maximo) return null;
    v = { desde, hasta, interrupciones: b.filter((x) => x.desde > desde && x.hasta < hasta).length };
    sinVentana = true;
  }
  const tuya = d.personal?.latencia ?? LATENCIA;
  const principio = v.hasta;
  const dudaDeLoDeSiempre = h && h.noches >= 5 ? DUDA.habitual : DUDA.pocaHistoria;
  const conRespuestas = (d.personal?.noches ?? 0) >= 3 ? CON_RESPUESTAS : 1;

  /** Cuándo te dormiste, si lo último que hiciste fue a esta hora. */
  const desde = (fin: number) => {
    const adelanto = h ? h.dormirse - fin : null;
    // Si lo dejaste después de tu hora de siempre, te dormís antes: en Sahha, 18 minutos contra 31.
    const latencia = adelanto !== null && adelanto < 0 ? Math.round((tuya * TARDE) / LATENCIA) : tuya;
    // «Me voy a dormir» o el Focus prendido justo al empezar el hueco.
    const alDormir = anclas.filter((a) => a.que === 'dormir' && a.en <= fin && a.en >= fin - JUNTAS - 1).at(-1);
    // El cargador: si seguiste usando el teléfono después de conectarlo, no dice nada.
    const conectados = cargadores.filter((c) => c.que === 'conectado' && c.deNoche && c.en <= fin && fin - c.en <= SEGUISTE);
    const alCargador = conectados.filter((c) => fin - c.en <= USO_TOLERADO).at(-1);
    const sobra = Math.max(0, (adelanto ?? 0) - latencia - CRECE.margenNoche);
    const duda = (alDormir ? DUDA.aviso : alCargador ? DUDA.cargador + CRECE.conCargador * sobra : DUDA.quieto + CRECE.noche * sobra) * conRespuestas;
    // Lo de siempre solo si es después de lo último que hiciste: antes ya se sabe que no.
    const propuestas = [{ en: fin + latencia, duda }, ...(h && h.dormirse > fin ? [{ en: h.dormirse, duda: dudaDeLoDeSiempre }] : [])];
    return { fin, adelanto, latencia, alDormir, alCargador, seguiste: alCargador ? undefined : conectados.at(-1), propuestas, junto: juntar(propuestas) };
  };
  // Lo que parecía una interrupción pero cae antes de dormirte, o casi, es que seguías despierto.
  let noche = desde(v.desde);
  let interrupciones = v.interrupciones;
  for (const x of b.filter((y) => y.desde > v!.desde && y.hasta < principio)) {
    if (x.desde > noche.junto.en + SIGUE_DESPIERTO) break;
    noche = desde(x.hasta);
    interrupciones = Math.max(0, interrupciones - 1);
  }
  const { fin, adelanto, latencia, alDormir, alCargador, seguiste, propuestas: paraDormirse, junto: alDormirse } = noche;
  const temprano = h !== null && adelanto !== null && adelanto > latencia + TEMPRANO.mas;
  // Nunca antes de la última actividad ni después de la primera.
  const dormirse = limitar(Math.round(alDormirse.en), fin + 5, principio);

  // Cuándo te despertaste. La alarma, «Me desperté» o el Focus apagado lo dicen; si después hubo hora y
  // media de silencio, te volviste a dormir y no cuenta.
  const alDespertar = anclas
    .filter((a) => a.que === 'despertar' && a.en > fin + 60 && a.en <= principio && principio - a.en < SUELTO.silencio)
    .sort((x, y) => x.en - y.en)[0];
  const tocar = d.personal?.alDespertar ?? AL_DESPERTAR;
  // Lo primero del día fue desconectar el cargador.
  const desconectaste = cargadores.find((c) => c.que === 'desconectado' && Math.abs(c.en - principio) <= JUNTAS);
  const deMas = Math.max(0, (h ? principio - tocar - h.despertar : 0) - CRECE.margenManana) * CRECE.manana;
  const primera = desconectaste
    ? { en: desconectaste.en - Math.min(tocar, ANTES_DE_DESCONECTAR), duda: (DUDA.desconectar + deMas) * conRespuestas }
    : { en: principio - tocar, duda: (DUDA.primera + deMas) * conRespuestas };
  // Lo de siempre solo si es antes de lo primero que hiciste: después ya se sabe que no.
  const paraDespertar = [primera, ...(h && h.despertar < principio ? [{ en: h.despertar, duda: dudaDeLoDeSiempre }] : [])];
  const alLevantarte = juntar(paraDespertar);
  const despertarFinal = alDespertar ? alDespertar.en : limitar(Math.round(alLevantarte.en), dormirse, principio);
  if (despertarFinal - dormirse < 120) return null;

  // Qué tan segura está: una propuesta que se calibra con la prueba contra un reloj (spec/sueno.md).
  const motivos: Motivo[] = [];
  let p = 0.85;
  if (!h || h.noches < 5) {
    p -= 0.15;
    motivos.push('sinHistoria');
  }
  if (!b.some((x) => x.tipos.includes('pasos') || x.tipos.includes('movimiento'))) {
    p -= 0.2;
    motivos.push('pocosDatos');
  }
  if (temprano) {
    p -= 0.15 * Math.min(2, (adelanto - latencia - TEMPRANO.mas) / 60 + 0.5);
    motivos.push('dejasteAntes');
  }
  // Con tres respuestas o más, lo tuyo ya es tuyo.
  if ((d.personal?.noches ?? 0) >= 3) p += 0.05;
  const tarde = h ? v.hasta - AL_DESPERTAR - h.despertar : 0;
  if (tarde > 60 && !alDespertar) {
    p -= 0.1 * Math.min(3, (tarde - 60) / 60);
    motivos.push('agarrasteTarde');
  }
  if (interrupciones) {
    p -= 0.08 * Math.min(3, interrupciones);
    motivos.push('usoDeNoche');
  }
  if (h && Math.abs(despertarFinal - dormirse - (h.despertar - h.dormirse)) > 120) {
    p -= 0.1;
    motivos.push('distintaDeLoDeSiempre');
  }
  // Conectó y siguió: lo que hizo después sin mover el teléfono no se ve.
  if (seguiste) {
    p -= 0.05;
    motivos.push('seguisteUsando');
  }
  // Un borde exacto (spec/sueno-sin-esfuerzo.md): una propuesta, como lo demás. El cargador afirma el borde que coincide con él.
  if (alDespertar) p += 0.1;
  else if (desconectaste) p += 0.05;
  if (alDormir || alCargador) p += 0.05;
  if (sinVentana) {
    p = Math.min(p, 0.4);
    motivos.push('sinVentana');
  }
  p = limitar(p, 0.05, 0.95);
  const confianza: Confianza = p >= 0.75 ? 'alta' : p >= 0.5 ? 'media' : 'baja';
  // El margen de cada borde sale de la duda que quedó al juntar sus señales (RANGO).
  const con = (...m: Motivo[]) => m.some((x) => motivos.includes(x));
  const ancho = (duda: number, conMotivo: boolean) => Math.round(Z_DEL_80 * duda * (conMotivo ? RANGO.conMotivo : 1));
  const margen = {
    dormirse: ancho(alDormirse.duda, con('dejasteAntes', 'usoDeNoche', 'sinVentana')),
    despertar: alDespertar ? RANGO.ancla : ancho(alLevantarte.duda, con('agarrasteTarde', 'usoDeNoche', 'sinVentana')),
  };
  return {
    clave: d.clave,
    dormirse,
    despertar: despertarFinal,
    quieto: { desde: fin, hasta: principio },
    rango: rangoDe(dormirse, despertarFinal, margen, { desde: fin, hasta: principio }),
    margen,
    confianza,
    probabilidad: p,
    interrupciones,
    motivos,
    anclada: { dormirse: !!alDormir, despertar: !!alDespertar },
    pistas: {
      dormirse: [
        alDormir
          ? { que: alDormir.de === 'enfoqueEmpezo' ? 'enfoque' : 'meVoyADormir', en: alDormir.en, peso: alDormirse.pesos[0] }
          : { que: 'ultimaActividad', en: fin, peso: alDormirse.pesos[0], tipos: b.find((x) => x.hasta === fin)?.tipos ?? [] },
        ...(alCargador ? [{ que: 'cargador' as const, en: alCargador.en, peso: 0 }] : []),
        ...(seguiste ? [{ que: 'cargador' as const, en: seguiste.en, peso: 0, noCuenta: true as const }] : []),
        ...(paraDormirse.length > 1 ? [{ que: 'habitual' as const, en: h!.dormirse, peso: alDormirse.pesos[1] }] : []),
      ],
      despertar: alDespertar
        ? [{ que: alDespertar.de === 'despertadorParado' ? 'despertador' : alDespertar.de === 'meDesperte' ? 'meDesperte' : alDespertar.de === 'enfoqueTermino' ? 'enfoque' : 'alarma', en: alDespertar.en, peso: 1 }]
        : [
          desconectaste
            ? { que: 'desconectaste', en: desconectaste.en, peso: alLevantarte.pesos[0] }
            : { que: 'primeraActividad', en: principio, peso: alLevantarte.pesos[0], tipos: b.find((x) => x.desde === principio)?.tipos ?? [] },
          ...(paraDespertar.length > 1 ? [{ que: 'habitual' as const, en: h!.despertar, peso: alLevantarte.pesos[1] }] : []),
        ],
    },
  };
}

/**
 * El rango que se muestra («entre 23:50 y 00:40»): cada borde con su margen, sin pasar de lo que se sabe con la
 * ventana tranquila (no estabas dormido antes de la última actividad ni después de la primera).
 */
export function rangoDe(dormirse: number, despertar: number, margen: Estimacion['margen'], quieto?: Estimacion['quieto']): Estimacion['rango'] {
  return {
    dormirse: [Math.max(dormirse - margen.dormirse, quieto?.desde ?? -Infinity), dormirse + margen.dormirse],
    despertar: [despertar - margen.despertar, Math.min(despertar + margen.despertar, quieto?.hasta ?? Infinity)],
  };
}

/**
 * Lo de siempre: la mediana de las noches medidas de las últimas dos semanas antes de `clave`, aparte
 * entre semana y fin de semana (las noches que terminan sábado o domingo) cuando hay 3 o más. Con
 * menos de 3 noches, null.
 */
export function habitualDe(noches: Pick<Noche, 'clave' | 'dormirse' | 'despertar' | 'confianza'>[], clave: ClaveDia): Habitual | null {
  const desde = sumarDias(clave, -14);
  const previas = noches.filter((n) => n.clave < clave && n.clave >= desde && n.confianza.horario !== 'baja');
  const finde = (c: ClaveDia) => [6, 0].includes(diaDeLaSemana(c));
  const mismas = previas.filter((n) => finde(n.clave) === finde(clave));
  const usadas = mismas.length >= 3 ? mismas : previas;
  if (usadas.length < 3) return null;
  return { dormirse: mediana(usadas.map((n) => n.dormirse)), despertar: mediana(usadas.map((n) => n.despertar)), noches: usadas.length };
}

/**
 * Lo tuyo (D33), de cada «¿Dormiste de X a Y?» que contestaste en los últimos cuatro meses: la hora que
 * diste contra la ventana tranquila de esa noche. Cuánto tardaste en dormirte es la hora en que te
 * dormiste menos la última actividad; en tocar el teléfono, la primera actividad menos la hora en que
 * te despertaste. De cada uno, la mediana con pesos (un dato raro no la mueve), mezclada con lo de
 * Sahha según cuántas respuestas hay (ENTRE_PERSONAS y DE_CADA_NOCHE). `elegida` es la de «Tardo en
 * dormirme», si se eligió: gana a la aprendida. Las noches de antes, sin la ventana guardada, la
 * toman de lo estimado y pesan la mitad.
 */
export function aprenderPersonal(propias: readonly NochePropia[], clave: ClaveDia, elegida?: number | null): Personal {
  const latencias: { x: number; peso: number }[] = [];
  const despertares: { x: number; peso: number }[] = [];
  for (const np of propias) {
    const h = np.hora;
    if (np.borrado || !h?.estimada || (h.origen !== 'confirmada' && h.origen !== 'corregida') || np.fecha >= clave) continue;
    const edad = diasEntre(np.fecha, clave);
    if (edad > 120) continue;
    const q = h.estimada.quieto;
    const desde = q ? Date.parse(q.desde) : Date.parse(h.estimada.dormirse) - LATENCIA * MIN;
    const hasta = q ? Date.parse(q.hasta) : Date.parse(h.estimada.despertar) + AL_DESPERTAR * MIN;
    const peso = (h.origen === 'corregida' ? PESO.corregida : PESO.confirmada) * 0.5 ** (edad / PESO.vidaMedia) * (q ? 1 : PESO.sinVentana);
    const latencia = (Date.parse(h.dormirse) - desde) / MIN;
    const alDespertar = (hasta - Date.parse(h.despertar)) / MIN;
    // Lo que no puede ser (dormirte más de un cuarto de hora antes de la última actividad) no enseña nada.
    if (latencia >= -15 && latencia - LATENCIA <= CORRECCION_MAXIMA) latencias.push({ x: Math.max(0, latencia), peso });
    if (alDespertar >= -15 && alDespertar - AL_DESPERTAR <= CORRECCION_MAXIMA) despertares.push({ x: Math.max(0, alDespertar), peso });
  }
  const mezcla = (lista: { x: number; peso: number }[], previo: number, tope: number) => {
    const m = medianaPesada(lista);
    const n = lista.reduce((s, v) => s + v.peso, 0);
    const tuyo = (n * ENTRE_PERSONAS ** 2) / (n * ENTRE_PERSONAS ** 2 + DE_CADA_NOCHE ** 2);
    return m === null ? previo : Math.round(limitar(previo + tuyo * (m - previo), 0, tope));
  };
  const aprendida = mezcla(latencias, LATENCIA, 240);
  return { latencia: elegida ?? aprendida, aprendida, elegida: elegida != null, alDespertar: mezcla(despertares, AL_DESPERTAR, 120), noches: Math.max(latencias.length, despertares.length) };
}

/** Las dos primeras semanas con Moss se pregunta cada mañana (lo pediste el 22/10/2026): así aprende rápido cómo se corre en tu caso. */
export const DIAS_DE_APRENDER = 14;

/**
 * Qué se pregunta a la mañana: con confianza media o baja, la hora estimada («¿Dormiste de 00:30 a
 * 08:10?»); con alta, nada, salvo las dos primeras semanas desde `desde` (el día en que empezaste
 * Moss), que se pregunta siempre. Una mañana por semana se pregunta sin proponer, para medir cuánto
 * se acepta lo propuesto sin mirarlo: el día cambia cada semana.
 */
export function quePreguntar(clave: ClaveDia, confianza: Confianza, desde?: ClaveDia | null): 'proponer' | 'sinProponer' | null {
  const semana = Math.floor(diasEntre('2026-01-05', lunesDe(clave)) / 7);
  const dia = (((semana * 5 + 3) % 7) + 7) % 7;
  if (diasEntre(lunesDe(clave), clave) === dia) return 'sinProponer';
  if (desde && diasEntre(desde, clave) < DIAS_DE_APRENDER) return 'proponer';
  return confianza === 'alta' ? null : 'proponer';
}

/** Un momento de la noche (minutos desde las 18 del día anterior a `clave`) en milisegundos. */
export const instanteDe = (clave: ClaveDia, zona: number, minutos: number) => ceroDe(clave, zona) + minutos * MIN;

/** La fuente de las noches de Moss. */
export const MOSS: Fuente = { id: 'moss', nombre: 'Moss', tipo: 'moss' };

/**
 * La zona horaria, en minutos (−180 en Uruguay): una sola o la de cada instante, en milisegundos.
 * Con la de cada instante, un cambio de hora no corre las noches de antes.
 */
export type Zona = number | ((ms: number) => number);

/**
 * Una noche de Moss como las de Salud: sin etapas ni despertares, que el teléfono no sabe. De dormirte a
 * despertarte no es todo sueño: adentro hay un rato despierto que el teléfono no ve (`despierto`,
 * despiertoDeLaNoche en sueno.ts), y lo dormido, lo que va a la deuda y a la calidad, es lo demás. Las
 * estimaciones con confianza baja no cuentan para la deuda ni el horario hasta que las confirmes.
 * Las horas, en la zona de cada momento (spec/sueno.md), como las de Salud.
 */
export function nocheDeMoss(np: NochePropia, zona: Zona, despierto = DESPIERTO_SIN_RELOJ): Noche | null {
  const h = np.hora;
  if (!h || np.borrado) return null;
  const desde = Date.parse(h.dormirse), hasta = Date.parse(h.despertar);
  if (!(hasta > desde)) return null;
  const zonaDe = typeof zona === 'number' ? () => zona : zona;
  const cero = ceroDe(np.fecha, zonaDe(desde));
  const aMin = (ms: number) => (ms - cero) / MIN;
  // Si en la noche cambió la hora, despertar es la del reloj; el tramo va por el tiempo que pasó.
  const aReloj = (ms: number) => aMin(ms) + zonaDe(ms) - zonaDe(desde);
  const despertar = aReloj(hasta);
  const periodo = (hasta - desde) / MIN;
  const adentro = Math.min(periodo, Math.max(0, despierto));
  const dormido = periodo - adentro;
  const estimada = h.origen === 'estimada';
  const cuenta: Confianza = estimada && h.confianza === 'baja' ? 'baja' : 'media';
  const q = h.estimada?.quieto;
  const quieto = q ? { desde: aMin(Date.parse(q.desde)), hasta: aReloj(Date.parse(q.hasta)) } : undefined;
  return {
    clave: np.fecha, fuente: MOSS, conEtapas: false,
    dormirse: aMin(desde), despertar, enCama: null,
    dormido, despierto: adentro, despertares: 0,
    etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: dormido },
    siestas: 0,
    tramos: [{ etapa: 'dormido', desde: aMin(desde), hasta: aMin(hasta) }],
    intervalos: [[desde, hasta]],
    confianza: { duracion: cuenta, horario: cuenta, despertares: 'baja', etapas: null, enCama: null },
    moss: {
      origen: h.origen, confianza: h.confianza,
      rango: estimada ? rangoDe(aMin(desde), despertar, h.estimada?.margen ?? MARGEN_POR_CONFIANZA[h.confianza], quieto) : null,
    },
  };
}

/**
 * Las noches de Salud con las de Moss donde Salud no tiene nada. La hora que confirmaste o corregiste
 * gana también a lo anotado a mano en Salud: es de esa noche y la diste en Moss (spec/aparatos.md). Lo
 * despierto de las de Moss es lo tuyo, si tuviste noches con un reloj o un anillo.
 */
export function conNochesDeMoss(noches: Noche[], propias: NochePropia[], zona: Zona): Noche[] {
  const porClave = new Map(noches.map((n) => [n.clave, n]));
  const despierto = despiertoDeLaNoche(noches);
  for (const np of propias) {
    const n = nocheDeMoss(np, zona, despierto);
    if (!n) continue;
    const deSalud = porClave.get(np.fecha);
    if (deSalud && !(deSalud.aMano && n.moss!.origen !== 'estimada')) continue;
    porClave.set(np.fecha, n);
  }
  return [...porClave.values()].sort((a, b) => (a.clave < b.clave ? -1 : 1));
}

/** Un cambio del historial de movimiento del iPhone (CMMotionActivity): desde cuándo y qué, con su confianza (0 a 2). */
export type Movimiento = { en: number; quieto: boolean; caminando: boolean; corriendo: boolean; auto: boolean; bici: boolean; confianza: 0 | 1 | 2 };

/**
 * Del historial de movimiento (los últimos 7 días) a actividad: caminar, correr, la bici o el auto con
 * confianza media o alta. Un cambio que no es «quieto» ni nada de eso es alguien que agarró el
 * teléfono: cuenta 5 minutos.
 */
export function actividadDelMovimiento(lista: Movimiento[], hasta: number): Actividad[] {
  const orden = [...lista].sort((a, b) => a.en - b.en);
  return orden.flatMap((m, i) => {
    const fin = Math.min(orden[i + 1]?.en ?? hasta, hasta);
    if (!(fin > m.en)) return [];
    if ((m.caminando || m.corriendo || m.bici || m.auto) && m.confianza >= 1) return [{ desde: m.en, hasta: fin, tipo: 'movimiento' as const }];
    if (!m.quieto && !m.caminando && !m.corriendo && !m.bici && !m.auto) return [{ desde: m.en, hasta: Math.min(fin, m.en + 5 * MIN), tipo: 'movimiento' as const }];
    return [];
  });
}

/**
 * De las muestras de pasos de Salud a actividad. Una muestra larga dice cuántos pasos hubo, no
 * cuándo: cuenta su principio y su final, lo que tardan esos pasos (unos 100 por minuto).
 */
export function actividadDeLosPasos(muestras: { desde: number; hasta: number; pasos: number }[]): Actividad[] {
  return muestras.flatMap((m) => {
    if (!(m.pasos > 0) || !(m.hasta >= m.desde)) return [];
    const largo = Math.max(MIN, (m.pasos / 100) * MIN);
    if (m.hasta - m.desde <= 10 * MIN || m.hasta - m.desde <= 2 * largo) return [{ desde: m.desde, hasta: m.hasta, tipo: 'pasos' as const }];
    return [{ desde: m.desde, hasta: m.desde + largo, tipo: 'pasos' as const }, { desde: m.hasta - largo, hasta: m.hasta, tipo: 'pasos' as const }];
  });
}

// ------------------------------------------------------------------ los Atajos y el despertador
// spec/sueno-sin-esfuerzo.md: cada acción de Moss en Atajos, y el despertador de Moss, deja constancia
// de qué pasó y a qué hora; el teléfono la guarda (src/salud/anclas.ts) y acá se vuelve actividad y
// anclas. Ninguna dice la hora exacta de dormirse: son topes («despierto a las 23:52»).

/** El nombre con que las despacha el Swift (app-intents/). */
export const SENALES = ['alarmaParada', 'despertadorParado', 'meDesperte', 'meVoyADormir', 'enfoqueEmpezo', 'enfoqueTermino', 'cargadorConectado', 'cargadorDesconectado'] as const;
export type QueSenal = (typeof SENALES)[number];
/** Lo que avisó un Atajo o el despertador, tal como llegó (en milisegundos). El id es el de la invocación: así no cuenta dos veces. */
export type Senal = { id: string; que: QueSenal; en: number };

/** De 19 a 4, conectar el cargador puede ser lo último del día; volver a conectarlo a los 30 minutos de desconectarlo es usar el teléfono de noche. */
const CARGADOR = { desde: 19 * 60, hasta: 4 * 60, reconectar: 30 };
/** El enfoque Sueño con horario: la misma hora, al minuto (con uno de tolerancia), en 2 noches más de las últimas 14. */
const PROGRAMADO = { otras: 2, tolerancia: 1, dias: 14 };

const porInstante = (zona: Zona) => (typeof zona === 'number' ? () => zona : zona);
/** El minuto del reloj (de 0 a 1439) de un instante. */
const minutoDelReloj = (ms: number, zona: (ms: number) => number) => (((Math.floor(ms / MIN + zona(ms)) % 1440) + 1440) % 1440);
/** La noche de un instante, de las 18 a las 18: un número por día. */
const nocheDe = (ms: number, zona: (ms: number) => number) => Math.floor((ms / MIN + zona(ms) + 360) / 1440);

/** Si el enfoque Sueño empezó o terminó por el horario: eso dice el plan, no lo que hiciste. */
export function esProgramado(s: Senal, todas: Senal[], zona: (ms: number) => number): boolean {
  if (s.que !== 'enfoqueEmpezo' && s.que !== 'enfoqueTermino') return false;
  const minuto = minutoDelReloj(s.en, zona);
  const otras = todas.filter((o) => {
    if (o.que !== s.que || Math.abs(o.en - s.en) > PROGRAMADO.dias * 1440 * MIN || nocheDe(o.en, zona) === nocheDe(s.en, zona)) return false;
    const d = Math.abs(minutoDelReloj(o.en, zona) - minuto);
    return Math.min(d, 1440 - d) <= PROGRAMADO.tolerancia;
  });
  return new Set(otras.map((o) => nocheDe(o.en, zona))).size >= PROGRAMADO.otras;
}

/**
 * Lo que avisaron los Atajos y el despertador, como actividad y anclas para estimarNoche:
 * - la alarma o el despertador parados y «Me desperté», anclas de despertar;
 * - «Me voy a dormir», ancla de dormir;
 * - el enfoque Sueño, ancla de dormir al empezar y de despertar al terminar, salvo que sea el horario;
 * - el cargador, tocar el teléfono; de 19 a 4, conectarlo puede ser lo último del día.
 */
export function deLasSenales(senales: Senal[], zona: Zona): { actividad: Actividad[]; anclas: Ancla[] } {
  const z = porInstante(zona);
  const actividad: Actividad[] = [];
  const anclas: Ancla[] = [];
  for (const s of senales) {
    if (s.que === 'alarmaParada' || s.que === 'despertadorParado' || s.que === 'meDesperte') {
      anclas.push({ en: s.en, que: 'despertar', de: s.que });
    } else if (s.que === 'meVoyADormir') {
      anclas.push({ en: s.en, que: 'dormir', de: s.que });
    } else if (s.que === 'enfoqueEmpezo' || s.que === 'enfoqueTermino') {
      if (!esProgramado(s, senales, z)) anclas.push({ en: s.en, que: s.que === 'enfoqueEmpezo' ? 'dormir' : 'despertar', de: s.que });
    } else {
      const minuto = minutoDelReloj(s.en, z);
      const reconectado = senales.some((o) => o.que === 'cargadorDesconectado' && o.en <= s.en && s.en - o.en <= CARGADOR.reconectar * MIN);
      const fin = s.que === 'cargadorConectado' && (minuto >= CARGADOR.desde || minuto < CARGADOR.hasta) && !reconectado;
      actividad.push({ desde: s.en, hasta: s.en + MIN, tipo: 'atajo', cargador: s.que === 'cargadorConectado' ? 'conectado' : 'desconectado', ...(fin ? { fin: true as const } : {}) });
    }
  }
  return { actividad, anclas };
}

/** Con este silencio, el cargador dejó de llegar: casi todos cargan el teléfono cada día o dos. */
const DIAS_SIN_CARGADOR = 3;
/** Con este par de avisos de uno solo en una semana, falta armar el otro. */
const PARA_VER_QUE_FALTA = 3;

export type EstadoDelCargador =
  | { estado: 'sinArmar' }
  | { estado: 'anda'; ultima: number }
  | { estado: 'dejoDeLlegar'; ultima: number; dias: number }
  | { estado: 'aMedias'; ultima: number; falta: 'conectar' | 'desconectar' };

/**
 * Si la automatización del cargador está andando (lo pediste el 31/10/2026): Moss no puede ver las
 * automatizaciones de Atajos, pero sí lo que le llega. Sin nada, no se armó; sin nada hace tres días,
 * dejó de andar (la borraron, o iOS la apagó); con un solo sentido, quedó a medias.
 */
export function estadoDelCargador(senales: readonly Senal[], ahora: number): EstadoDelCargador {
  const delCargador = senales.filter((s) => s.que === 'cargadorConectado' || s.que === 'cargadorDesconectado');
  if (!delCargador.length) return { estado: 'sinArmar' };
  const ultima = Math.max(...delCargador.map((s) => s.en));
  const dias = Math.floor((ahora - ultima) / 86_400_000);
  if (dias >= DIAS_SIN_CARGADOR) return { estado: 'dejoDeLlegar', ultima, dias };
  const semana = delCargador.filter((s) => ahora - s.en <= 7 * 86_400_000);
  const conectar = semana.filter((s) => s.que === 'cargadorConectado').length;
  const desconectar = semana.length - conectar;
  if (conectar >= PARA_VER_QUE_FALTA && !desconectar) return { estado: 'aMedias', ultima, falta: 'desconectar' };
  if (desconectar >= PARA_VER_QUE_FALTA && !conectar) return { estado: 'aMedias', ultima, falta: 'conectar' };
  return { estado: 'anda', ultima };
}

/**
 * Si la hora de despertar de la noche (en minutos desde las 18) salió de un ancla: entonces a la mañana
 * se pregunta solo a qué hora te dormiste («¿Te dormiste a las 00:30?»).
 */
export function despertarAnclado(anclas: Ancla[], clave: ClaveDia, zona: number, despertar: number): boolean {
  const cero = ceroDe(clave, zona);
  return anclas.some((a) => a.que === 'despertar' && Math.abs((a.en - cero) / MIN - despertar) < 1);
}
