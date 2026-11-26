// Lo que se puede decir con honestidad de una sesión y de una bajada de fuerza con los datos de Ascent (para aprobar
// en la galería; spec/estudio/vinculo-ascent.md). Sin puntajes: ninguno está validado, tampoco en las apps que los
// muestran. Cada cosa sale de una regla con su estudio y se dice como probable.
// - La bajada: el promedio de las últimas 4 sesiones de un ejercicio, más de un 4 % por debajo del de las 8 de antes.
//   Con un ruido de un 3,3 % por sesión (Grgic 2020), eso es unas dos veces el error de la diferencia: poco probable
//   que sea azar. Cambiar de rango de repeticiones mueve el 1RM estimado aunque la fuerza no cambie (Reynolds 2006),
//   y una pausa de dos semanas o más también cuenta (Bosquet 2013): se dicen aparte.
// - La sesión: el rendimiento contra lo tuyo (más de un 6 % arriba o abajo de la mediana de tus últimas sesiones de
//   ese ejercicio; menos es el ruido de un día), las series de cada músculo en el día (pasadas unas 10, cada serie
//   suma poco: Remmert 2025, preprint) y cuánto cayeron las repeticiones con el mismo peso (casi la mitad o más en 3
//   series o más: probablemente al fallo o muy cerca, Refalo 2023; eso pide uno o dos días más, Morán-Navarro 2017).

import { diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { claveDelEjercicio, mejorDeLasSeries, musculosDe, type Bloque, type Musculo } from './musculos';

const promedio = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
function mediana(xs: readonly number[]): number {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

// ------------------------------------------------------------ la bajada

export const SESIONES_RECIENTES = 4;
export const SESIONES_DE_ANTES = 8;
/** Lo mínimo para decir «bajó», en %: el ruido de una sesión es de un 3,3 % (Grgic 2020). */
export const BAJA_MINIMA = 4;
/** Con 3 repeticiones o más de diferencia en la mejor serie, el 1RM estimado ya no se compara bien. */
export const CAMBIO_DE_RANGO = 3;
/** Una pausa: 14 días o más sin el ejercicio. */
export const DIAS_DE_PAUSA = 14;

/** Una sesión con el ejercicio: el día, el 1RM estimado de su mejor serie y las repeticiones de esa serie. */
export type PuntoDeLaBajada = { fecha: ClaveDia; e1rm: number; reps: number | null };
export type Bajada = {
  /** Cuánto bajó, en % del promedio de antes. */
  caida: number;
  antes: number;
  ahora: number;
  /** Las 8 de antes, de cuándo a cuándo, y desde cuándo las 4 de ahora. */
  antesDesde: ClaveDia;
  antesHasta: ClaveDia;
  desde: ClaveDia;
  /** La mejor serie cambió de rango de repeticiones: el número estimado se mueve aunque la fuerza no cambie. */
  cambioDeRango: boolean;
  /** La pausa más larga entre esas sesiones, en días (14 o más); si no hubo, null. */
  pausa: number | null;
};

/**
 * Si la fuerza de un ejercicio bajó: sus últimas 12 sesiones, las 4 más nuevas contra las 8 de antes. Devuelve la
 * bajada solo si pasa BAJA_MINIMA; si no bajó o sin 12 sesiones (todavía no se sabe), null.
 */
export function bajadaDeFuerza(puntos: readonly PuntoDeLaBajada[]): Bajada | null {
  const n = SESIONES_RECIENTES + SESIONES_DE_ANTES;
  if (puntos.length < n) return null;
  const ultimos = [...puntos].sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)).slice(-n);
  const antes = ultimos.slice(0, SESIONES_DE_ANTES);
  const ahora = ultimos.slice(SESIONES_DE_ANTES);
  const a = promedio(antes.map((p) => p.e1rm));
  const b = promedio(ahora.map((p) => p.e1rm));
  const caida = ((a - b) / a) * 100;
  if (!(caida > BAJA_MINIMA)) return null;
  const repsDe = (xs: readonly PuntoDeLaBajada[]) => xs.flatMap((p) => (p.reps === null ? [] : [p.reps]));
  const ra = repsDe(antes);
  const rb = repsDe(ahora);
  const cambioDeRango = ra.length >= 3 && rb.length >= 2 && Math.abs(mediana(ra) - mediana(rb)) >= CAMBIO_DE_RANGO;
  let pausa: number | null = null;
  for (let i = SESIONES_DE_ANTES - 1; i < ultimos.length - 1; i++) {
    const d = diasEntre(ultimos[i].fecha, ultimos[i + 1].fecha);
    if (d >= DIAS_DE_PAUSA && (pausa === null || d > pausa)) pausa = d;
  }
  return { caida, antes: a, ahora: b, antesDesde: antes[0].fecha, antesHasta: antes[antes.length - 1].fecha, desde: ahora[0].fecha, cambioDeRango, pausa };
}

/** Las semanas (sus lunes) para buscar por qué bajó con razonesDeEstancamiento: las de antes y las de ahora hasta hoy. */
export function semanasDeLaBajada(b: Pick<Bajada, 'antesDesde' | 'antesHasta' | 'desde'>, hoy: ClaveDia): { antes: ClaveDia[]; ahora: ClaveDia[] } {
  const semanas = (desde: ClaveDia, hasta: ClaveDia) => {
    const r: ClaveDia[] = [];
    for (let l = lunesDe(desde); l <= lunesDe(hasta); l = sumarDias(l, 7)) r.push(l);
    return r;
  };
  const ahora = semanas(b.desde, hoy);
  return { antes: semanas(b.antesDesde, b.antesHasta).filter((l) => !ahora.includes(l)), ahora };
}

// ------------------------------------------------------------ la sesión

/** Un día distinto de lo tuyo, en %: unas dos veces el ruido de un día (3,3 %, Grgic 2020). */
export const UN_DIA_DISTINTO = 6;
/** Lo tuyo de un ejercicio: la mediana de sus últimas 6 sesiones, con 3 como mínimo. */
export const SESIONES_DE_REFERENCIA = 6;
export const MINIMO_DE_REFERENCIA = 3;
/** Pasadas unas 10 series de un músculo en un día, cada una suma poco (Remmert 2025; el que ayuda cuenta la mitad). */
export const SERIES_QUE_SUMAN_POCO = 10;
/** Con el mismo peso, de la primera a la última serie: si las repeticiones caen un 45 % o más, cerca del fallo (Refalo 2023). */
export const CAIDA_CERCA_DEL_FALLO = 0.45;
export const SERIES_PARA_LA_CAIDA = 3;
/** El mismo peso, con un 2,5 % de diferencia como mucho. */
export const MISMO_PESO = 0.025;
/** De trabajo: con el 60 % del mejor 1RM estimado de la sesión o más (como en puntajeMuscular.ts). */
const DE_TRABAJO = 0.6;
/** Dos series anotadas sin repeticiones de sobra ya es ir al fallo. */
const SERIES_AL_FALLO = 2;

export type NotaDeLaSesion = 'buena' | 'comoSiempre' | 'dura' | 'floja';
export type ComoFue = {
  /** Una palabra, no un puntaje: floja, dura, buena o como siempre, en ese orden de importancia. */
  nota: NotaDeLaSesion;
  /** Cada ejercicio con lo tuyo para comparar: cuánto se separó, en %. */
  rendimiento: { ejercicio: string; diferencia: number; como: 'arriba' | 'igual' | 'abajo' }[];
  /** Los músculos con más de 10 series en el día. */
  volumen: { musculo: Musculo; series: number }[];
  /** Los ejercicios que probablemente fueron al fallo o muy cerca: cuánto cayeron las repeticiones y las series a 0 de reserva. */
  fallo: { ejercicio: string; caida: number | null; alFallo: number }[];
  /** La noche fue corta: un día flojo es esperable. */
  nocheCorta: boolean;
};

type SesionConFecha = { fecha: ClaveDia; bloques: readonly Bloque[] };

/** Las series de trabajo de los bloques de un ejercicio en una sesión, en orden. */
function deTrabajo(bloques: readonly Bloque[]) {
  const series = bloques.flatMap((b) => b.series).filter((x) => x.peso > 0 && x.reps !== null && x.reps >= 1);
  const mejor = mejorDeLasSeries(series);
  return mejor === null ? [] : series.filter((x) => x.peso >= DE_TRABAJO * mejor);
}

/**
 * Cómo fue una sesión, sin puntaje: el rendimiento de cada ejercicio contra la mediana de tus últimas sesiones de
 * ese ejercicio, las series de cada músculo y si las repeticiones cayeron como cuando se va al fallo. `antes` son
 * las sesiones anteriores, de cualquier orden. Sin ningún ejercicio con series, null.
 */
export function comoFueLaSesion(p: { sesion: { bloques: readonly Bloque[] }; antes: readonly SesionConFecha[]; nocheCorta: boolean }): ComoFue | null {
  // Una sesión copiada con «Registrar el día» repite la de antes: no hay nada que juzgar, y tampoco sirve de referencia.
  const claves = [...new Set(p.sesion.bloques.filter((b) => !b.copiada).map(claveDelEjercicio))];
  const ordenadas = [...p.antes].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  const rendimiento: ComoFue['rendimiento'] = [];
  const fallo: ComoFue['fallo'] = [];
  const porMusculo = new Map<Musculo, number>();
  let conSeries = false;
  for (const clave of claves) {
    const bloques = p.sesion.bloques.filter((b) => claveDelEjercicio(b) === clave && !b.copiada);
    const nombre = bloques[0].ejercicio;
    const series = deTrabajo(bloques);
    if (!series.length) continue;
    conSeries = true;

    const hoy = mejorDeLasSeries(series);
    const tuyas = ordenadas.flatMap((s) => {
      const v = mejorDeLasSeries(deTrabajo(s.bloques.filter((b) => claveDelEjercicio(b) === clave && !b.copiada)));
      return v === null ? [] : [v];
    }).slice(0, SESIONES_DE_REFERENCIA);
    if (hoy !== null && tuyas.length >= MINIMO_DE_REFERENCIA) {
      const diferencia = ((hoy - mediana(tuyas)) / mediana(tuyas)) * 100;
      rendimiento.push({ ejercicio: nombre, diferencia, como: diferencia > UN_DIA_DISTINTO ? 'arriba' : diferencia < -UN_DIA_DISTINTO ? 'abajo' : 'igual' });
    }

    const m = musculosDe(bloques[0]);
    if (m) {
      for (const x of m.principal) porMusculo.set(x, (porMusculo.get(x) ?? 0) + series.length);
      for (const x of m.ayudan) porMusculo.set(x, (porMusculo.get(x) ?? 0) + series.length / 2);
    }

    const conElMismo = series.filter((x) => Math.abs(x.peso - series[0].peso) <= MISMO_PESO * series[0].peso);
    const primera = conElMismo[0].reps!;
    const ultima = conElMismo[conElMismo.length - 1].reps!;
    const caida = conElMismo.length >= SERIES_PARA_LA_CAIDA && primera > 0 ? (primera - ultima) / primera : null;
    const alFallo = series.filter((x) => x.rir === 0).length;
    if ((caida !== null && caida >= CAIDA_CERCA_DEL_FALLO) || alFallo >= SERIES_AL_FALLO) fallo.push({ ejercicio: nombre, caida, alFallo });
  }
  if (!conSeries) return null;

  const volumen = [...porMusculo].filter(([, n]) => n > SERIES_QUE_SUMAN_POCO).map(([musculo, series]) => ({ musculo, series })).sort((a, b) => b.series - a.series);
  const abajo = rendimiento.filter((r) => r.como === 'abajo').length;
  const arriba = rendimiento.filter((r) => r.como === 'arriba').length;
  // La mitad o más de lo que se puede comparar, por debajo: un ejercicio flojo entre cinco no hace floja la sesión.
  const nota: NotaDeLaSesion = abajo > 0 && abajo * 2 >= rendimiento.length ? 'floja' : volumen.length || fallo.length ? 'dura' : arriba > 0 && abajo === 0 ? 'buena' : 'comoSiempre';
  return { nota, rendimiento, volumen, fallo, nocheCorta: p.nocheCorta };
}
