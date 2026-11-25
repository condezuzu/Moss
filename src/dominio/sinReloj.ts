// Sin reloj (spec/sueno.md, «Sin reloj»): desde iOS 18, sin un reloj o un anillo Salud no tiene nada
// de la noche, así que la arma Moss cada mañana con lo que el teléfono ya guardó. De noche solo se
// guarda la hora de un Atajo o del despertador de Moss (spec/sueno-sin-esfuerzo.md).
// - La ventana tranquila es el hueco sin actividad (pasos, el teléfono en movimiento, Moss abierta, un
//   Atajo) de 5 a 12 horas que empieza entre las 18 y las 4.
// - Como Rise (lo decidiste el 17/11/2026; spec/estudio/auditoria-del-sueno.md): cuenta como sueño todo el
//   rato que el teléfono estuvo quieto, menos UN margen para dormirte, de 15 minutos de fábrica, que se
//   elige en Sueño › Afinar. Ya no se restan los 18 minutos antes de agarrarlo ni la media hora despierto,
//   y tu hora de siempre no recorta la noche: una noche larga cuenta entera.
// - La noche termina con la actividad que sigue. Apagar la alarma o mirar la hora, si el teléfono vuelve a
//   quedar quieto 45 minutos o más, no la termina: es una interrupción. Levantarte (pasos, Moss abierta) sí,
//   salvo que después quede quieto hora y media.
// - Si conectaste el cargador y seguiste usando el teléfono, el cargador no cuenta: manda lo último que
//   hiciste.
// - Dice qué tan segura está, por qué señales llegó a esa hora y, si no lo está, pregunta a la mañana.
// La estimación nunca se escribe en Salud (guía 5.1.3 de Apple).

import { diaDeLaSemana, diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { ceroDe, despiertoDeLaNoche, Z_DEL_80, type Confianza, type Fuente, type Noche, type NochePropia } from './sueno';

const MIN = 60_000;

/**
 * Algo que dice que estabas despierto, en milisegundos: pasos, el teléfono en movimiento, Moss abierta o
 * un Atajo. Con `fin`, puede ser lo último del día y nunca es una interrupción. `cargador`, si el Atajo
 * fue conectarlo o desconectarlo. `enMarcha`, si el movimiento fue caminar, correr, la bici o el auto, y no
 * solo agarrar el teléfono.
 */
export type Actividad = { desde: number; hasta: number; tipo: 'pasos' | 'movimiento' | 'moss' | 'atajo'; fin?: true; cargador?: 'conectado' | 'desconectado'; enMarcha?: true };
/** Lo que avisa un Atajo o el despertador de Moss: que te ibas a dormir o que te despertaste (deLasSenales). `de`, qué señal fue. */
export type Ancla = { en: number; que: 'dormir' | 'despertar'; de?: QueSenal };
/** Lo de siempre, en minutos desde las 18: la mediana de las últimas noches del mismo tipo (entre semana o fin de semana). */
export type Habitual = { dormirse: number; despertar: number; noches: number };
/** Por qué la estimación no es segura. */
export type Motivo = 'sinHistoria' | 'pocosDatos' | 'dejasteAntes' | 'agarrasteTarde' | 'usoDeNoche' | 'distintaDeLoDeSiempre' | 'sinVentana' | 'seguisteUsando';
/**
 * Una señal de las que se miraron para un borde de la noche. `en`, su hora en minutos desde las 18;
 * `peso`, 1 si de ella sale la hora y 0 si solo la afirma (el cargador) o, con `noCuenta`, si no sirvió
 * (conectaste y seguiste usándolo). `tipos`, qué se vio.
 */
export type Pista = {
  que: 'ultimaActividad' | 'primeraActividad' | 'cargador' | 'desconectaste' | 'alarma' | 'despertador' | 'meDesperte' | 'meVoyADormir' | 'enfoque';
  en: number;
  peso: number;
  noCuenta?: true;
  tipos?: Actividad['tipo'][];
};

export type Estimacion = {
  clave: ClaveDia;
  /** En minutos desde las 18 del día anterior: dormirte, la última actividad más tu margen; despertarte, la primera que sigue. */
  dormirse: number;
  despertar: number;
  /** La ventana tranquila: la última actividad y la primera. Se guarda con la noche, para volver a armarla (sinLasRestas). */
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
 * Lo suelto de la noche: tocar el teléfono hasta 20 minutos (apagar la alarma, mirar la hora) con 45 minutos
 * quietos antes y después. No corta la noche: es una interrupción. Si en ese rato te levantaste (diste pasos,
 * abriste Moss), hace falta hora y media quieta después, como antes: quien se levanta y deja el teléfono en la
 * mesa mientras desayuna no sigue durmiendo. Vale desde una hora después de tu hora de siempre de dormirte (o
 * desde la 1:30, sin historia) y a hora y media o más de haber dejado el teléfono: antes, mirarlo es lo último
 * del día. Si no, quien deja el teléfono lejos toda la tarde y lo mira antes de acostarse quedaba dormido
 * desde la tarde, ahora que tu hora de siempre ya no corre la hora. Los minutos son una convención.
 */
const SUELTO = { largo: 20, quieto: 45, quietoSiTeLevantaste: 90, desdeQueLoDejaste: 90, despuesDeLoDeSiempre: 60, sinHistoria: 450 };
/** Lo que se mira: de las 12 del día anterior a las 14 (en minutos desde las 18). */
const MIRA = { desde: -360, hasta: 1200 };
/** Dos actividades separadas por menos de 5 minutos son una sola. */
const JUNTAS = 5;
/**
 * El margen para dormirte, de fábrica (lo decidiste el 17/11/2026): del rato que el teléfono estuvo quieto, lo
 * único que no cuenta como sueño. Rise le dice «buffer» y en su captura muestra 30; para anotar a mano sugiere
 * restar unos 20, y de intentar dormir a dormirse pasan unos 17 minutos por polisomnografía (Silva 2007).
 */
export const MARGEN = 15;
/** Los que se pueden elegir en Sueño › Afinar, en minutos. */
export const MARGENES = [0, 15, 30, 45, 60] as const;
/** El margen que se usa: el que elegiste (`latencia`, en el almacén) o el de fábrica. */
export const margenParaDormirte = (elegido?: number | null): number => elegido ?? MARGEN;
/** Con el teléfono dejado más de una hora antes de lo de costumbre, baja la confianza. */
const TEMPRANO = { mas: 60 };
/**
 * Cuánta duda deja cada señal, en minutos, para el rango que se muestra: una propuesta, para calibrar con la
 * prueba contra un reloj (spec/sueno.md). Sahha mide 24 minutos de error mediano en cada borde, unos 35 de
 * desviación, y a la mañana algo menos. Conectar el cargador de noche dice más que dejar el teléfono en la
 * mesa; avisar que te vas a dormir, más todavía.
 */
const DUDA = { quieto: 35, cargador: 28, aviso: 20, primera: 30, desconectar: 20 };
/**
 * Cuánto crece la duda del teléfono por cada minuto que lo dejaste antes de tu hora (más allá de 15), o que
 * lo agarraste después (más allá de 30): el rato quieto de más puede no haber sido sueño. Conectado al
 * cargador crece menos.
 */
const CRECE = { noche: 1, conCargador: 0.5, margenNoche: 15, manana: 0.5, margenManana: 30 };
/** El cargador cuenta como haberte acostado si después de conectarlo no usaste el teléfono más de este rato. */
export const USO_TOLERADO = 20;
/** Conectado hasta 3 horas antes de lo último que hiciste: lo conectaste y seguiste usándolo. */
const SEGUISTE = 180;
/** Usar el teléfono hasta esto después de la hora en que Moss te daría dormido no es una interrupción: seguías despierto. */
const SIGUE_DESPIERTO = 30;
/** «Me desperté» lo dijiste tú: vale aunque después el teléfono quede quieto, hasta hora y media. */
const DIJISTE_QUE_TE_DESPERTASTE = 90;
/** Entre dos huecos posibles, lo que suma haberse acostado o levantado con una señal: como 2 horas sobre lo de siempre. */
const PUNTOS_POR_SENAL = 120;
/**
 * Sin ventana: de la última actividad antes de las 2 a la primera después de las 4 tras la que el teléfono ya
 * no vuelve a quedar quieto hora y media.
 */
const SIN_VENTANA = { antesDe: 480, despuesDe: 600, quieto: 90 };
/**
 * Que la noche sea más larga o distinta de lo de siempre baja la confianza hasta media, nunca a baja: se
 * pregunta, pero la noche cuenta (antes, las largas eran las que más quedaban fuera de la deuda).
 */
const PISO_POR_LARGA = 0.5;
/**
 * El rango que se muestra («entre 23:50 y 00:40») es el del 80 %: ±1,28 veces la duda de la señal de ese borde,
 * por 1,5 si hay de lo que más hace errar en él (en Sahha, usar el teléfono de noche, dejarlo mucho antes o
 * agarrarlo mucho después son el 74 % de los errores grandes; sin ventana, en los dos bordes), y ±10 minutos
 * con un ancla exacta (la alarma). Es una propuesta, a calibrar con la prueba contra un reloj (spec/sueno.md):
 * por eso el margen del rango se guarda con la noche.
 */
const RANGO = { conMotivo: 1.5, ancla: 10 };
/** Sin el margen guardado (una noche de antes, o que bajó de la cuenta), el de su confianza: lo típico del modelo. */
const MARGEN_POR_CONFIANZA: Record<Confianza, { dormirse: number; despertar: number }> = {
  alta: { dormirse: 40, despertar: 35 }, media: { dormirse: 50, despertar: 45 }, baja: { dormirse: 75, despertar: 65 },
};
/**
 * Lo que se restaba hasta el 17/11/2026, sin nada aprendido: 31 minutos hasta dormirte y 18 antes de agarrar
 * el teléfono (Sahha). Solo para deshacerlo en las noches de antes que no guardaron su ventana (sinLasRestas).
 */
const DE_ANTES = { latencia: 31, alDespertar: 18 };

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b);
  const k = Math.floor(o.length / 2);
  return o.length % 2 ? o[k] : (o[k - 1] + o[k]) / 2;
};

/** `levantado`: en ese rato diste pasos, ibas en marcha o abriste Moss: no fue solo tocar el teléfono. */
type Bloque = { desde: number; hasta: number; tipos: Actividad['tipo'][]; fin: boolean; levantado: boolean };

/** La actividad en minutos desde las 18, dentro de lo que se mira, juntando lo que está pegado. */
function bloques(actividad: Actividad[], cero: number): Bloque[] {
  const lista = actividad
    .map((a) => ({ desde: (a.desde - cero) / MIN, hasta: (Math.max(a.hasta, a.desde + MIN) - cero) / MIN, tipo: a.tipo, fin: !!a.fin, levantado: a.tipo === 'pasos' || a.tipo === 'moss' || !!a.enMarcha }))
    .filter((a) => a.hasta > MIRA.desde && a.desde < MIRA.hasta)
    .sort((a, b) => a.desde - b.desde);
  const r: Bloque[] = [];
  for (const a of lista) {
    const ultimo = r[r.length - 1];
    if (ultimo && a.desde - ultimo.hasta < JUNTAS) {
      ultimo.hasta = Math.max(ultimo.hasta, a.hasta);
      ultimo.fin ||= a.fin;
      ultimo.levantado ||= a.levantado;
      if (!ultimo.tipos.includes(a.tipo)) ultimo.tipos.push(a.tipo);
    } else {
      r.push({ desde: a.desde, hasta: a.hasta, tipos: [a.tipo], fin: a.fin, levantado: a.levantado });
    }
  }
  return r;
}

type Ventana = { desde: number; hasta: number };

/**
 * Los huecos entre actividades, saltando lo suelto de la noche (SUELTO; `desde`, en minutos desde las 18): el
 * hueco termina en la primera actividad que sigue, no en un toque tras el que el teléfono vuelve a quedar quieto.
 */
function ventanas(b: Bloque[], desde: number): Ventana[] {
  const r: Ventana[] = [];
  for (let i = 0; i + 1 < b.length; i++) {
    let j = i + 1;
    const suelto = (k: number) => k + 1 < b.length && !b[k].fin && b[k].desde >= desde && b[k].hasta - b[k].desde <= SUELTO.largo
      && b[k].desde - b[i].hasta >= SUELTO.desdeQueLoDejaste
      && b[k].desde - b[k - 1].hasta >= SUELTO.quieto && b[k + 1].desde - b[k].hasta >= (b[k].levantado ? SUELTO.quietoSiTeLevantaste : SUELTO.quieto);
    while (suelto(j)) j++;
    r.push({ desde: b[i].hasta, hasta: b[j].desde });
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
  /** Lo de siempre: para elegir entre dos huecos, para saber desde cuándo un toque es una interrupción y para la confianza. No mueve las horas. */
  habitual: Habitual | null;
  /** El margen para dormirte, en minutos (margenParaDormirte); sin nada, el de fábrica. */
  margen?: number;
}): Estimacion | null {
  const cero = ceroDe(d.clave, d.zona);
  const anclas = (d.anclas ?? []).map((a) => ({ en: (a.en - cero) / MIN, que: a.que, de: a.de }));
  const cargadores = d.actividad.flatMap((a) => (a.cargador ? [{ que: a.cargador, en: (a.desde - cero) / MIN, deNoche: !!a.fin }] : []));
  // Un ancla es tocar el teléfono: cuenta como actividad. La de irte a dormir puede ser lo último del
  // día aunque llegue tarde: nunca es una interrupción.
  const conAnclas = [...d.actividad, ...(d.anclas ?? []).map((a): Actividad => ({ desde: a.en, hasta: a.en + MIN, tipo: 'atajo', ...(a.que === 'dormir' ? { fin: true as const } : {}) }))];
  const b = bloques(conAnclas, cero);
  const h = d.habitual;
  const validas = ventanas(b, h ? h.dormirse + SUELTO.despuesDeLoDeSiempre : SUELTO.sinHistoria).filter((v) => v.hasta - v.desde >= VENTANA.minimo && v.hasta - v.desde <= VENTANA.maximo && v.desde >= 0 && v.desde <= VENTANA.empiezaHasta);
  // Con dos huecos posibles (el teléfono quedó en la mesa toda la tarde), el que más se parece a lo
  // de siempre; sin historia, el más largo.
  // Un hueco que empieza con el cargador o un aviso, o termina con ellos, se parece más a una noche.
  const encima = (v: Ventana) => (h ? Math.max(0, Math.min(v.hasta, h.despertar) - Math.max(v.desde, h.dormirse)) : 0);
  const seAcosto = (v: Ventana) => cargadores.some((c) => c.que === 'conectado' && c.deNoche && c.en <= v.desde && v.desde - c.en <= USO_TOLERADO)
    || anclas.some((a) => a.que === 'dormir' && a.en <= v.desde && v.desde - a.en <= USO_TOLERADO);
  const seLevanto = (v: Ventana) => cargadores.some((c) => c.que === 'desconectado' && Math.abs(c.en - v.hasta) <= JUNTAS)
    || anclas.some((a) => a.que === 'despertar' && a.en > v.desde + 60 && a.en <= v.hasta && v.hasta - a.en < SUELTO.quieto);
  const puntaje = (v: Ventana) => encima(v) + (seAcosto(v) ? PUNTOS_POR_SENAL : 0) + (seLevanto(v) ? PUNTOS_POR_SENAL : 0);
  let v: Ventana | undefined = [...validas].sort((x, y) => puntaje(y) - puntaje(x) || y.hasta - y.desde - (x.hasta - x.desde))[0];
  let sinVentana = false;
  if (!v) {
    const antes = b.filter((x) => x.hasta <= SIN_VENTANA.antesDe && x.hasta >= -60);
    const despues = b.filter((x) => x.desde >= SIN_VENTANA.despuesDe);
    // La noche termina con la actividad que sigue: una tras la que el teléfono quedó quieto otro rato largo no es el final.
    const final = despues.find((x, i) => i === despues.length - 1 || despues[i + 1].desde - x.hasta < SIN_VENTANA.quieto);
    if (!antes.length || !final) return null;
    const desde = antes[antes.length - 1].hasta, hasta = final.desde;
    if (hasta - desde < 180 || hasta - desde > VENTANA.maximo) return null;
    v = { desde, hasta };
    sinVentana = true;
  }
  const margenDeDormirte = Math.max(0, d.margen ?? MARGEN);
  const principio = v.hasta;

  // Lo que parecía una interrupción pero cae antes de dormirte, o casi, es que seguías despierto.
  let fin = v.desde;
  for (const x of b.filter((y) => y.desde > v!.desde && y.hasta < principio)) {
    if (x.desde > fin + margenDeDormirte + SIGUE_DESPIERTO) break;
    fin = x.hasta;
  }
  const adelanto = h ? h.dormirse - fin : null;
  // «Me voy a dormir» o el Focus prendido justo al empezar el hueco.
  const alDormir = anclas.filter((a) => a.que === 'dormir' && a.en <= fin && a.en >= fin - JUNTAS - 1).at(-1);
  // El cargador: si seguiste usando el teléfono después de conectarlo, no dice nada.
  const conectados = cargadores.filter((c) => c.que === 'conectado' && c.deNoche && c.en <= fin && fin - c.en <= SEGUISTE);
  const alCargador = conectados.filter((c) => fin - c.en <= USO_TOLERADO).at(-1);
  const seguiste = alCargador ? undefined : conectados.at(-1);
  const temprano = adelanto !== null && adelanto > margenDeDormirte + TEMPRANO.mas;
  // Todo el rato quieto menos el margen: nunca antes de la última actividad ni después de la primera.
  const dormirse = Math.min(Math.round(fin + margenDeDormirte), principio);

  // Cuándo te despertaste: la primera actividad que sigue. La alarma, el despertador o el Focus apagado lo dicen
  // si son esa actividad; si después el teléfono quedó quieto 45 minutos o más, te volviste a dormir y no cuentan.
  const alDespertar = anclas
    .filter((a) => a.que === 'despertar' && a.en > fin + 60 && a.en <= principio && principio - a.en < (a.de === 'meDesperte' ? DIJISTE_QUE_TE_DESPERTASTE : SUELTO.quieto))
    .sort((x, y) => x.en - y.en)[0];
  // Lo primero del día fue desconectar el cargador.
  const desconectaste = cargadores.find((c) => c.que === 'desconectado' && Math.abs(c.en - principio) <= JUNTAS);
  const despertar = alDespertar ? alDespertar.en : principio;
  if (despertar - dormirse < 120) return null;
  // Las veces que tocaste el teléfono adentro de la noche.
  const interrupciones = b.filter((x) => x.desde > fin && x.desde < despertar).length;

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
  if (interrupciones) {
    p -= 0.08 * Math.min(3, interrupciones);
    motivos.push('usoDeNoche');
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
  // Lo que la hace más larga o distinta de lo de siempre: el rato quieto de más puede no haber sido sueño.
  const sinLoLargo = p;
  if (temprano) {
    p -= 0.15 * Math.min(2, (adelanto - margenDeDormirte - TEMPRANO.mas) / 60 + 0.5);
    motivos.push('dejasteAntes');
  }
  const tarde = h ? principio - h.despertar : 0;
  if (tarde > 60 && !alDespertar) {
    p -= 0.1 * Math.min(3, (tarde - 60) / 60);
    motivos.push('agarrasteTarde');
  }
  if (h && Math.abs(despertar - dormirse - (h.despertar - h.dormirse)) > 120) {
    p -= 0.1;
    motivos.push('distintaDeLoDeSiempre');
  }
  if (sinLoLargo >= PISO_POR_LARGA) p = Math.max(p, PISO_POR_LARGA);
  if (sinVentana) {
    p = Math.min(p, 0.4);
    motivos.push('sinVentana');
  }
  p = limitar(p, 0.05, 0.95);
  const confianza: Confianza = p >= 0.75 ? 'alta' : p >= 0.5 ? 'media' : 'baja';
  // El rango de cada borde sale de la duda de su señal (RANGO), que crece con el rato quieto de más.
  const con = (...m: Motivo[]) => m.some((x) => motivos.includes(x));
  const ancho = (duda: number, conMotivo: boolean) => Math.round(Z_DEL_80 * duda * (conMotivo ? RANGO.conMotivo : 1));
  const sobra = Math.max(0, (adelanto ?? 0) - margenDeDormirte - CRECE.margenNoche);
  const deMas = Math.max(0, tarde - CRECE.margenManana) * CRECE.manana;
  const margen = {
    dormirse: ancho(alDormir ? DUDA.aviso : alCargador ? DUDA.cargador + CRECE.conCargador * sobra : DUDA.quieto + CRECE.noche * sobra, con('dejasteAntes', 'usoDeNoche', 'sinVentana')),
    despertar: alDespertar ? RANGO.ancla : ancho((desconectaste ? DUDA.desconectar : DUDA.primera) + deMas, con('agarrasteTarde', 'usoDeNoche', 'sinVentana')),
  };
  return {
    clave: d.clave,
    dormirse,
    despertar,
    // Hasta la actividad con la que termina: con «Me desperté», esa, aunque el teléfono siguiera quieto.
    quieto: { desde: fin, hasta: despertar },
    rango: rangoDe(dormirse, despertar, margen, { desde: fin, hasta: despertar }),
    margen,
    confianza,
    probabilidad: p,
    interrupciones,
    motivos,
    anclada: { dormirse: !!alDormir, despertar: !!alDespertar },
    pistas: {
      dormirse: [
        alDormir
          ? { que: alDormir.de === 'enfoqueEmpezo' ? 'enfoque' : 'meVoyADormir', en: alDormir.en, peso: 1 }
          : { que: 'ultimaActividad', en: fin, peso: 1, tipos: b.find((x) => x.hasta === fin)?.tipos ?? [] },
        ...(alCargador ? [{ que: 'cargador' as const, en: alCargador.en, peso: 0 }] : []),
        ...(seguiste ? [{ que: 'cargador' as const, en: seguiste.en, peso: 0, noCuenta: true as const }] : []),
      ],
      despertar: [
        alDespertar
          ? { que: alDespertar.de === 'despertadorParado' ? 'despertador' : alDespertar.de === 'meDesperte' ? 'meDesperte' : alDespertar.de === 'enfoqueTermino' ? 'enfoque' : 'alarma', en: alDespertar.en, peso: 1 }
          : desconectaste
            ? { que: 'desconectaste', en: desconectaste.en, peso: 1 }
            : { que: 'primeraActividad', en: principio, peso: 1, tipos: b.find((x) => x.desde === principio)?.tipos ?? [] },
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

/** Las noches estimadas que se vuelven a armar cuando cambia la regla o tu margen: las de las últimas cuatro semanas, lo que mira Moss. */
export const NOCHES_QUE_SE_REARMAN = 28;

/**
 * Una noche confirmada con «Sí» tal como Moss la propuso: las mismas horas que lo estimado. No es una medición
 * tuya: aceptaste una propuesta. La que corregiste, aunque sea un minuto, es tuya.
 */
export function aceptadaSinCambios(hora: NochePropia['hora']): boolean {
  const e = hora?.estimada;
  const igual = (a: string, b: string) => Math.abs(Date.parse(a) - Date.parse(b)) < MIN;
  return !!hora && hora.origen === 'confirmada' && !!e && igual(hora.dormirse, e.dormirse) && igual(hora.despertar, e.despertar);
}

/**
 * Una noche estimada con la regla de antes del 17/11/2026, con la de ahora y sin sus señales: todo el rato
 * quieto de su ventana guardada, menos tu margen. Sin la ventana (las noches de las primeras versiones), se
 * deshace lo que se restaba de fábrica, y la ventana queda guardada: así, hacerlo dos veces (en otro teléfono
 * de la cuenta) da lo mismo. Solo lo estimado y sin confirmar: lo que corregiste o escribiste es tuyo. Con
 * `aceptadas` (al rehacer las noches de antes, una sola vez), también las que aceptaste con «Sí» sin cambiarlas:
 * la propuesta ya traía las restas de antes, y vuelven a ser estimadas. null si no hay nada que cambiar: una
 * aceptada que ya es de la regla nueva queda confirmada.
 */
export function sinLasRestas(hora: NochePropia['hora'], margen = MARGEN, aceptadas = false): NonNullable<NochePropia['hora']> | null {
  if (!hora || !(hora.origen === 'estimada' || (aceptadas && aceptadaSinCambios(hora)))) return null;
  const e = hora.estimada ?? { dormirse: hora.dormirse, despertar: hora.despertar };
  const desde = e.quieto ? Date.parse(e.quieto.desde) : Date.parse(e.dormirse) - DE_ANTES.latencia * MIN;
  const hasta = e.quieto ? Date.parse(e.quieto.hasta) : Date.parse(e.despertar) + DE_ANTES.alDespertar * MIN;
  const dormirse = desde + Math.max(0, margen) * MIN;
  if (!(hasta - dormirse >= 120 * MIN)) return null;
  const nueva = { dormirse: new Date(dormirse).toISOString(), despertar: new Date(hasta).toISOString() };
  if (nueva.dormirse === hora.dormirse && nueva.despertar === hora.despertar) return null;
  return { ...hora, ...nueva, origen: 'estimada', estimada: { ...e, ...nueva, quieto: { desde: new Date(desde).toISOString(), hasta: new Date(hasta).toISOString() } } };
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

/** Lo más que dura una noche, en minutos: más larga, la cuenta no la acepta (el CHECK de supabase/moss/0005_noches.sql). */
const NOCHE_MAS_LARGA = 18 * 60;

/**
 * Las horas del editor de la mañana (en minutos desde las 18), movidas `d` minutos: entre las 18 de ayer y las 18 de
 * hoy, con una hora al menos y 18 a lo sumo entre las dos. Lo que ya estaba fuera queda, pero no se aleja.
 */
export const moverDormirse = (dormirse: number, despertar: number, d: number) =>
  Math.max(Math.min(dormirse, Math.max(0, despertar - NOCHE_MAS_LARGA)), Math.min(despertar - 60, dormirse + d));
export const moverDespertar = (dormirse: number, despertar: number, d: number) =>
  Math.min(Math.max(despertar, Math.min(24 * 60, dormirse + NOCHE_MAS_LARGA)), Math.max(dormirse + 60, despertar + d));

/** La fuente de las noches de Moss. */
export const MOSS: Fuente = { id: 'moss', nombre: 'Moss', tipo: 'moss' };

/**
 * La zona horaria, en minutos (−180 en Uruguay): una sola o la de cada instante, en milisegundos.
 * Con la de cada instante, un cambio de hora no corre las noches de antes.
 */
export type Zona = number | ((ms: number) => number);

/**
 * Una noche de Moss como las de Salud: sin etapas ni despertares, que el teléfono no sabe. De dormirte a
 * despertarte cuenta todo como sueño (desde el 17/11/2026, como Rise: si te despiertas y no tocas el teléfono,
 * no se ve), salvo que tengas noches de un reloj o un anillo: entonces se descuenta lo que sueles estar
 * despierto (`despierto`, despiertoDeLaNoche en sueno.ts), para que se parezcan a las medidas. Las
 * estimaciones con confianza baja no cuentan para la deuda ni el horario hasta que las confirmes.
 * Las horas, en la zona de cada momento (spec/sueno.md), como las de Salud.
 */
export function nocheDeMoss(np: NochePropia, zona: Zona, despierto = 0): Noche | null {
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
 * despierto de las de Moss es lo tuyo, si tuviste noches con un reloj o un anillo. Una de Salud con la
 * duración de confianza baja (Sleep Cycle, AutoSleep: apps del teléfono) no cuenta para nada: es como si faltara.
 */
export function conNochesDeMoss(noches: Noche[], propias: NochePropia[], zona: Zona): Noche[] {
  const porClave = new Map(noches.map((n) => [n.clave, n]));
  const despierto = despiertoDeLaNoche(noches);
  for (const np of propias) {
    const n = nocheDeMoss(np, zona, despierto);
    if (!n) continue;
    const deSalud = porClave.get(np.fecha);
    if (deSalud && deSalud.confianza.duracion !== 'baja' && !(deSalud.aMano && n.moss!.origen !== 'estimada')) continue;
    porClave.set(np.fecha, n);
  }
  return [...porClave.values()].sort((a, b) => (a.clave < b.clave ? -1 : 1));
}

/**
 * El reloj o el anillo cuya noche de `clave` todavía puede llegar, o null. Muchos la escriben en Salud recién cuando
 * se sincroniza su app (Da Rings, al abrirla): mientras, Moss muestra la estimada con el teléfono, y al llegar la
 * reemplaza (conNochesDeMoss). Es el que escribió alguna de las dos semanas anteriores; si ya llegó una noche suya de
 * ese día o de después, ya se sincronizó y esa no va a llegar.
 */
export function aparatoQueFalta(noches: readonly Noche[], clave: ClaveDia): Fuente | null {
  const desde = sumarDias(clave, -14);
  let ultima: Noche | null = null;
  for (const n of noches) {
    if (n.moss || n.aMano || (n.fuente.tipo !== 'reloj' && n.fuente.tipo !== 'otra')) continue;
    if (n.clave >= clave) return null;
    if (n.clave >= desde && (!ultima || n.clave > ultima.clave)) ultima = n;
  }
  return ultima?.fuente ?? null;
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
    if ((m.caminando || m.corriendo || m.bici || m.auto) && m.confianza >= 1) return [{ desde: m.en, hasta: fin, tipo: 'movimiento' as const, enMarcha: true as const }];
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
