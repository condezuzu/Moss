// Sin reloj (spec/sueno.md, «Sin reloj»): desde iOS 18, sin un reloj o un anillo Salud no tiene nada
// de la noche, así que la arma Moss cada mañana con lo que el teléfono ya guardó. Nada corre de noche.
// - La ventana tranquila es el hueco sin actividad (pasos, el teléfono en movimiento, Moss abierta) de
//   5 a 12 horas que empieza entre las 18 y las 4. Lo suelto de la madrugada no la corta: es una
//   interrupción.
// - Te dormiste un rato después de la última actividad (más si dejaste el teléfono mucho antes de lo
//   de siempre) y te despertaste 18 minutos antes de la primera: las reglas publicadas de Sahha.
// - Lo que aprende de tus correcciones corre las dos horas.
// - Dice qué tan segura está y, si no lo está, pregunta a la mañana.
// La estimación nunca se escribe en Salud (guía 5.1.3 de Apple).

import { diaDeLaSemana, diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { ceroDe, type Confianza, type Fuente, type Noche, type NochePropia } from './sueno';

const MIN = 60_000;

/** Algo que dice que estabas despierto, en milisegundos: pasos, el teléfono en movimiento, Moss abierta o un Atajo. */
export type Actividad = { desde: number; hasta: number; tipo: 'pasos' | 'movimiento' | 'moss' | 'atajo' };
/** Lo que avisa un Atajo, si lo configuraste: que te ibas a dormir (el Focus de Sueño) o que te despertaste (la alarma). */
export type Ancla = { en: number; que: 'dormir' | 'despertar' };
/** Lo de siempre, en minutos desde las 18: la mediana de las últimas noches del mismo tipo (entre semana o fin de semana). */
export type Habitual = { dormirse: number; despertar: number; noches: number };
/** Cuánto correr la estimación en tu caso, en minutos, por lo que corregiste. */
export type Ajuste = { dormirse: number; despertar: number; correcciones: number };
/** Por qué la estimación no es segura. */
export type Motivo = 'sinHistoria' | 'pocosDatos' | 'dejasteAntes' | 'agarrasteTarde' | 'usoDeNoche' | 'distintaDeLoDeSiempre' | 'sinVentana';

export type Estimacion = {
  clave: ClaveDia;
  /** En minutos desde las 18 del día anterior, ya corridas por lo aprendido. */
  dormirse: number;
  despertar: number;
  /** Lo estimado antes de correrlo: es lo que se guarda para aprender. */
  cruda: { dormirse: number; despertar: number };
  rango: { dormirse: [number, number]; despertar: [number, number] };
  confianza: Confianza;
  /** La probabilidad de que los dos bordes estén dentro de una hora (una propuesta, para calibrar). */
  probabilidad: number;
  /** Las veces que se usó el teléfono en medio de la noche: se marcan, no se cuentan como despierto. */
  interrupciones: number;
  motivos: Motivo[];
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
/** De que te despertaste a la primera actividad de la mañana (Sahha). */
const AL_DESPERTAR = 18;
/** Sin ventana: la última actividad antes de las 2 y la primera después de las 4. */
const SIN_VENTANA = { antesDe: 480, despuesDe: 600 };
/** La mitad del rango que se muestra, en minutos, al dormirte y al despertarte. */
const RANGO: Record<Confianza, [number, number]> = { alta: [20, 15], media: [35, 25], baja: [60, 45] };
/** Cuánto pesa lo de los estudios contra lo tuyo, en noches corregidas (spec/sueno.md, «Aprender de cada persona»). */
const PREVIO = 6;
/** Una corrección pesa como 6 noches confirmadas, y lo viejo pierde la mitad del peso en 30 noches. */
const PESO = { corregida: 6, confirmada: 1, vidaMedia: 30 };

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b);
  const k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : (o[k - 1] + o[k]) / 2;
};

/**
 * Cuánto tardás en dormirte después de la última actividad, según cuánto antes de tu hora de siempre
 * dejaste el teléfono (en minutos; Sahha): a la hora de siempre, 31; con 1 a 1,5 horas antes, 76; con
 * 2 a 3, 153; con 3 o más, 202. Si lo dejaste más tarde que siempre, 18. Sin historia, 31.
 */
export function latencia(adelanto: number | null): number {
  if (adelanto === null) return 31;
  if (adelanto < 0) return 18;
  if (adelanto < 60) return 31;
  if (adelanto < 90) return 76;
  if (adelanto < 120) return 76 + ((adelanto - 90) / 30) * (153 - 76);
  if (adelanto < 180) return 153;
  return 202;
}

type Bloque = { desde: number; hasta: number; tipos: Actividad['tipo'][] };

/** La actividad en minutos desde las 18, dentro de lo que se mira, juntando lo que está pegado. */
function bloques(actividad: Actividad[], cero: number): Bloque[] {
  const lista = actividad
    .map((a) => ({ desde: (a.desde - cero) / MIN, hasta: (Math.max(a.hasta, a.desde + MIN) - cero) / MIN, tipo: a.tipo }))
    .filter((a) => a.hasta > MIRA.desde && a.desde < MIRA.hasta)
    .sort((a, b) => a.desde - b.desde);
  const r: Bloque[] = [];
  for (const a of lista) {
    const ultimo = r[r.length - 1];
    if (ultimo && a.desde - ultimo.hasta < JUNTAS) {
      ultimo.hasta = Math.max(ultimo.hasta, a.hasta);
      if (!ultimo.tipos.includes(a.tipo)) ultimo.tipos.push(a.tipo);
    } else {
      r.push({ desde: a.desde, hasta: a.hasta, tipos: [a.tipo] });
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
    const suelto = (k: number) => k + 1 < b.length && b[k].desde >= desde && b[k].hasta - b[k].desde <= SUELTO.largo
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
  ajuste?: Ajuste | null;
}): Estimacion | null {
  const cero = ceroDe(d.clave, d.zona);
  const anclas = (d.anclas ?? []).map((a) => ({ en: (a.en - cero) / MIN, que: a.que }));
  // Prender el Focus de Sueño es tocar el teléfono: cuenta como actividad.
  const conAnclas = [...d.actividad, ...(d.anclas ?? []).filter((a) => a.que === 'dormir').map((a): Actividad => ({ desde: a.en, hasta: a.en + MIN, tipo: 'atajo' }))];
  const b = bloques(conAnclas, cero);
  const h = d.habitual;
  const validas = ventanas(b, h ? h.dormirse - SUELTO.antesDeLoDeSiempre : SUELTO.sinHistoria).filter((v) => v.hasta - v.desde >= VENTANA.minimo && v.hasta - v.desde <= VENTANA.maximo && v.desde >= 0 && v.desde <= VENTANA.empiezaHasta);
  // Con dos huecos posibles (el teléfono quedó en la mesa toda la tarde), el que más se parece a lo
  // de siempre; sin historia, el más largo.
  const encima = (v: Ventana) => (h ? Math.max(0, Math.min(v.hasta, h.despertar) - Math.max(v.desde, h.dormirse)) : 0);
  let v: Ventana | undefined = [...validas].sort((x, y) => encima(y) - encima(x) || y.hasta - y.desde - (x.hasta - x.desde))[0];
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
  const adelanto = h ? h.dormirse - v.desde : null;
  let despertar = v.hasta - AL_DESPERTAR;
  // La alarma o el Focus apagado (un Atajo) dicen cuándo te despertaste.
  const alDespertar = anclas.filter((a) => a.que === 'despertar' && a.en > v!.desde + 60 && a.en <= v!.hasta).sort((x, y) => x.en - y.en)[0];
  if (alDespertar) despertar = alDespertar.en;
  const cruda = { dormirse: v.desde + latencia(adelanto), despertar };
  const ajuste = d.ajuste ?? { dormirse: 0, despertar: 0, correcciones: 0 };
  // Lo aprendido corre las horas, pero nunca antes de la última actividad ni después de la primera.
  const dormirse = limitar(cruda.dormirse + ajuste.dormirse, v.desde + 5, v.hasta);
  const despertarFinal = alDespertar ? cruda.despertar : limitar(cruda.despertar + ajuste.despertar, dormirse, v.hasta);
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
  if (adelanto !== null && adelanto > 60) {
    p -= 0.15 * Math.min(2, (adelanto - 60) / 60);
    motivos.push('dejasteAntes');
  }
  const tarde = h ? v.hasta - AL_DESPERTAR - h.despertar : 0;
  if (tarde > 60 && !alDespertar) {
    p -= 0.1 * Math.min(3, (tarde - 60) / 60);
    motivos.push('agarrasteTarde');
  }
  if (v.interrupciones) {
    p -= 0.08 * Math.min(3, v.interrupciones);
    motivos.push('usoDeNoche');
  }
  if (h && Math.abs(despertarFinal - dormirse - (h.despertar - h.dormirse)) > 120) {
    p -= 0.1;
    motivos.push('distintaDeLoDeSiempre');
  }
  if (alDespertar) p += 0.05;
  if (sinVentana) {
    p = Math.min(p, 0.4);
    motivos.push('sinVentana');
  }
  p = limitar(p, 0.05, 0.95);
  const confianza: Confianza = p >= 0.75 ? 'alta' : p >= 0.5 ? 'media' : 'baja';
  return {
    clave: d.clave,
    dormirse,
    despertar: despertarFinal,
    cruda,
    rango: rangoDe(dormirse, despertarFinal, confianza),
    confianza,
    probabilidad: p,
    interrupciones: v.interrupciones,
    motivos,
  };
}

/** El rango que se muestra («entre 23:50 y 00:40»), más ancho cuanto menos segura. */
export function rangoDe(dormirse: number, despertar: number, confianza: Confianza): Estimacion['rango'] {
  const [a, b] = RANGO[confianza];
  return { dormirse: [dormirse - a, dormirse + a], despertar: [despertar - b, despertar + b] };
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
 * Cuánto correr la estimación en tu caso: el promedio de lo que corregiste (la hora que diste menos la
 * que estimó el teléfono), donde una corrección pesa como 6 «Sí» y lo viejo pierde la mitad del peso
 * en 30 noches, contra 6 noches de no correr nada. Hasta hora y media.
 */
export function aprenderAjuste(propias: NochePropia[], clave: ClaveDia): Ajuste {
  let pesos = 0, dormirse = 0, despertar = 0, correcciones = 0;
  for (const np of propias) {
    const h = np.hora;
    if (np.borrado || !h?.estimada || h.origen === 'estimada' || np.fecha >= clave) continue;
    const edad = diasEntre(np.fecha, clave);
    if (edad > 120) continue;
    const peso = (h.origen === 'confirmada' ? PESO.confirmada : PESO.corregida) * 0.5 ** (edad / PESO.vidaMedia);
    pesos += peso;
    dormirse += (peso * (Date.parse(h.dormirse) - Date.parse(h.estimada.dormirse))) / MIN;
    despertar += (peso * (Date.parse(h.despertar) - Date.parse(h.estimada.despertar))) / MIN;
    if (h.origen !== 'confirmada') correcciones++;
  }
  return { dormirse: limitar(dormirse / (PREVIO + pesos), -90, 90), despertar: limitar(despertar / (PREVIO + pesos), -90, 90), correcciones };
}

/**
 * Qué se pregunta a la mañana: con confianza media o baja, la hora estimada («¿Dormiste de 00:30 a
 * 08:10?»); con alta, nada. Una mañana por semana se pregunta sin proponer, para medir cuánto se
 * acepta lo propuesto sin mirarlo: el día cambia cada semana.
 */
export function quePreguntar(clave: ClaveDia, confianza: Confianza): 'proponer' | 'sinProponer' | null {
  const semana = Math.floor(diasEntre('2026-01-05', lunesDe(clave)) / 7);
  const dia = (((semana * 5 + 3) % 7) + 7) % 7;
  if (diasEntre(lunesDe(clave), clave) === dia) return 'sinProponer';
  return confianza === 'alta' ? null : 'proponer';
}

/** Un momento de la noche (minutos desde las 18 del día anterior a `clave`) en milisegundos. */
export const instanteDe = (clave: ClaveDia, zona: number, minutos: number) => ceroDe(clave, zona) + minutos * MIN;

/** La fuente de las noches de Moss. */
export const MOSS: Fuente = { id: 'moss', nombre: 'Moss', tipo: 'moss' };

/**
 * Una noche de Moss como las de Salud: sin etapas ni despertares, que el teléfono no sabe. Las
 * estimaciones con confianza baja no cuentan para la deuda ni el horario hasta que las confirmes.
 */
export function nocheDeMoss(np: NochePropia, zona: number): Noche | null {
  const h = np.hora;
  if (!h || np.borrado) return null;
  const desde = Date.parse(h.dormirse), hasta = Date.parse(h.despertar);
  if (!(hasta > desde)) return null;
  const cero = ceroDe(np.fecha, zona);
  const aMin = (ms: number) => (ms - cero) / MIN;
  const dormido = (hasta - desde) / MIN;
  const estimada = h.origen === 'estimada';
  const cuenta: Confianza = estimada && h.confianza === 'baja' ? 'baja' : 'media';
  return {
    clave: np.fecha, fuente: MOSS, conEtapas: false,
    dormirse: aMin(desde), despertar: aMin(hasta), enCama: null,
    dormido, despierto: 0, despertares: 0,
    etapas: { nucleo: 0, profundo: 0, rem: 0, sinEtapa: dormido },
    siestas: 0,
    tramos: [{ etapa: 'dormido', desde: aMin(desde), hasta: aMin(hasta) }],
    intervalos: [[desde, hasta]],
    confianza: { duracion: cuenta, horario: cuenta, despertares: 'baja', etapas: null, enCama: null },
    moss: { origen: h.origen, confianza: h.confianza, rango: estimada ? rangoDe(aMin(desde), aMin(hasta), h.confianza) : null },
  };
}

/**
 * Las noches de Salud con las de Moss donde Salud no tiene nada. La hora que confirmaste o corregiste
 * gana también a lo anotado a mano en Salud: es de esa noche y la diste en Moss (spec/aparatos.md).
 */
export function conNochesDeMoss(noches: Noche[], propias: NochePropia[], zona: number): Noche[] {
  const porClave = new Map(noches.map((n) => [n.clave, n]));
  for (const np of propias) {
    const n = nocheDeMoss(np, zona);
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
