// El sueño (spec/sueno.md): las muestras de Salud de cada noche, armadas sin inventar nada.
// - Una sola fuente por noche: la que elegiste, o el reloj, o otro aparato con etapas, o sin ellas, o
//   una app del teléfono. Nunca se suman dos: contaría doble.
// - La noche es del día en que te despertás, y el día cambia a las 18: una siesta de la tarde es de
//   ese día y lo que termina a la noche ya es del siguiente.
// - El «en cama» del teléfono nunca cuenta como sueño: el teléfono mide su uso, no el sueño.
// - Una noche sin datos queda sin datos: no es un cero, no se rellena y no entra en los promedios.
// Lo que se calcula sale de lo que el reloj mide bien (cuánto dormiste, cuándo te dormiste y te
// despertaste); las etapas se muestran como una estimación y no entran en la calidad.

import type { ClaveDia } from './fechas';

/** Lo que guarda Salud (HKCategoryValueSleepAnalysis): en cama, dormido sin etapa, despierto y las tres etapas. */
export type Etapa = 'enCama' | 'dormido' | 'despierto' | 'nucleo' | 'profundo' | 'rem';
/** De dónde viene: el reloj, otro aparato o app que escribe en Salud (un anillo, Garmin), o el teléfono. */
export type TipoDeFuente = 'reloj' | 'otra' | 'telefono';
export type Fuente = { id: string; nombre: string; tipo: TipoDeFuente };
/**
 * Una muestra: instantes en milisegundos, la diferencia de la zona horaria de ese momento en
 * minutos (−180 en Uruguay) y si se anotó a mano.
 */
export type Muestra = { etapa: Etapa; desde: number; hasta: number; fuente: string; zona: number; aMano?: boolean };

export type Tramo = { etapa: Exclude<Etapa, 'enCama'>; desde: number; hasta: number };
export type Confianza = 'alta' | 'media' | 'baja';

export type Noche = {
  /** El día en que te despertás: la noche del martes al miércoles es del miércoles. */
  clave: ClaveDia;
  fuente: Fuente;
  /** Si la fuente separa etapas (el reloj desde watchOS 9). */
  conEtapas: boolean;
  /** Los momentos, en minutos desde las 18 del día anterior a `clave`: las 23:41 son 341 y las 7:13, 793. */
  dormirse: number;
  despertar: number;
  /** El tiempo en cama, solo si alguna fuente lo escribió de verdad (si no, null). */
  enCama: { desde: number; hasta: number; minutos: number; fuente: Fuente } | null;
  /** Minutos dormidos de la noche, sin las siestas. */
  dormido: number;
  /** Despierto entre que te dormiste y que te despertaste, y cuántas veces por 5 minutos o más. */
  despierto: number;
  despertares: number;
  /** Las etapas estimadas; lo dormido sin etapa va aparte. */
  etapas: { nucleo: number; profundo: number; rem: number; sinEtapa: number };
  /** Los minutos dormidos en siestas de ese día: cuentan para la deuda, no para el horario. */
  siestas: number;
  tramos: Tramo[];
  /** Los intervalos dormidos, en milisegundos: ahí se miran la frecuencia, la variabilidad y la respiración. */
  intervalos: [number, number][];
  confianza: { duracion: Confianza; horario: Confianza; despertares: Confianza; etapas: Confianza | null; enCama: Confianza | null };
};

const MIN = 60_000;
/** Lo dormido separado por menos de una hora es el mismo episodio. */
const MISMO_EPISODIO = 60;
/** A la noche se suman los episodios de 3 horas o más y los que empiezan o terminan a 2 horas del principal. */
const EPISODIO_LARGO = 180;
const CERCA_DEL_PRINCIPAL = 120;
/** Una siesta, desde 15 minutos dormidos. */
const SIESTA_MINIMA = 15;
/** Despierto menos de 5 minutos no es un despertar: es un cambio de etapa. */
const DESPERTAR_MINIMO = 5;
/** El día del sueño cambia a las 18 (lo que termina después ya es del día siguiente). */
const CAMBIO_DE_DIA = 18 * 60;
const DORMIDO: readonly Etapa[] = ['dormido', 'nucleo', 'profundo', 'rem'];
const ETAPAS: readonly Etapa[] = ['nucleo', 'profundo', 'rem'];

const claveDelSueno = (fin: number, zona: number): ClaveDia => new Date(fin + (zona + 24 * 60 - CAMBIO_DE_DIA) * MIN).toISOString().slice(0, 10);
/** Las 18 del día anterior a la clave, en milisegundos: el cero de los minutos de esa noche. */
const ceroDe = (clave: ClaveDia, zona: number) => Date.parse(clave + 'T00:00:00.000Z') - (24 * 60 - CAMBIO_DE_DIA) * MIN - zona * MIN;

/** La unión de intervalos, ordenada y sin encimarse. */
function unir(intervalos: [number, number][]): [number, number][] {
  const r: [number, number][] = [];
  for (const [a, b] of intervalos.filter(([x, y]) => y > x).sort((x, y) => x[0] - y[0])) {
    const ultimo = r[r.length - 1];
    if (ultimo && a <= ultimo[1]) ultimo[1] = Math.max(ultimo[1], b);
    else r.push([a, b]);
  }
  return r;
}
const largo = (intervalos: [number, number][]) => intervalos.reduce((s, [a, b]) => s + (b - a), 0) / MIN;
/** Lo de `a` que no toca `b`. */
function restar(a: [number, number][], b: [number, number][]): [number, number][] {
  let r = a;
  for (const [x, y] of b) {
    r = r.flatMap(([p, q]) => {
      const partes: [number, number][] = y <= p || x >= q ? [[p, q]] : [[p, Math.min(q, x)], [Math.max(p, y), q]];
      return partes.filter(([m, n]) => n > m);
    });
  }
  return r;
}

/**
 * Lo dormido de una fuente, sin repetir: entre dos revisiones se queda la última (las muestras ya
 * vienen así de Salud) y lo que tiene etapa, o está despierto, gana a lo «dormido» sin etapa que se
 * le encima: se corta, no se descarta.
 */
function dormidoDe(muestras: Muestra[]): Muestra[] {
  const conEtapa = unir(muestras.filter((m) => ETAPAS.includes(m.etapa) || m.etapa === 'despierto').map((m) => [m.desde, m.hasta]));
  return muestras.flatMap((m) => {
    if (!DORMIDO.includes(m.etapa)) return [];
    if (m.etapa !== 'dormido' || !conEtapa.length) return [m];
    const propio: [number, number] = [m.desde, m.hasta];
    return restar([propio], conEtapa).map(([desde, hasta]) => ({ ...m, desde, hasta }));
  });
}

type Episodio = { desde: number; hasta: number; dormido: number; muestras: Muestra[] };

/** Los episodios de una fuente: lo dormido separado por menos de una hora, con lo despierto de adentro. */
function episodios(muestras: Muestra[]): Episodio[] {
  const dormido = dormidoDe(muestras).sort((a, b) => a.desde - b.desde);
  const grupos: Muestra[][] = [];
  let fin = -Infinity;
  for (const m of dormido) {
    if (m.desde - fin >= MISMO_EPISODIO * MIN) grupos.push([]);
    grupos[grupos.length - 1].push(m);
    fin = Math.max(fin, m.hasta);
  }
  return grupos.map((g) => {
    const desde = g[0].desde, hasta = Math.max(...g.map((m) => m.hasta));
    const despierto = muestras.filter((m) => m.etapa === 'despierto' && m.desde < hasta && m.hasta > desde);
    return { desde, hasta, dormido: largo(unir(g.map((m) => [m.desde, m.hasta]))), muestras: [...g, ...despierto] };
  });
}

/**
 * El orden de las fuentes para una noche: la que elegiste, el reloj, otro aparato con etapas, sin
 * etapas, y al final las apps del teléfono. Lo anotado a mano cuenta solo si no hay otra cosa.
 */
function prioridad(fuente: Fuente, muestras: Muestra[], elegida?: string): number {
  if (fuente.id === elegida) return 100;
  const aMano = muestras.every((m) => m.aMano);
  const base = fuente.tipo === 'reloj' ? 40 : fuente.tipo === 'otra' ? (muestras.some((m) => ETAPAS.includes(m.etapa)) ? 30 : 20) : 10;
  return aMano ? 1 : base;
}

/** Las noches desde las muestras de todas las fuentes, una por día, de la más vieja a la más nueva. */
export function armarNoches(muestras: Muestra[], fuentes: Fuente[], elegida?: string): Noche[] {
  // Por día del sueño y por fuente, los episodios.
  const porDia = new Map<ClaveDia, Map<string, Episodio[]>>();
  for (const fuente of fuentes) {
    const propias = muestras.filter((m) => m.fuente === fuente.id);
    for (const e of episodios(propias)) {
      const clave = claveDelSueno(e.hasta, e.muestras[0].zona);
      const delDia = porDia.get(clave) ?? new Map<string, Episodio[]>();
      delDia.set(fuente.id, [...(delDia.get(fuente.id) ?? []), e]);
      porDia.set(clave, delDia);
    }
  }
  const enCamaTodas = muestras.filter((m) => m.etapa === 'enCama');
  const noches: Noche[] = [];
  for (const [clave, delDia] of porDia) {
    const [id, lista] = [...delDia.entries()].sort(([a, ea], [b, eb]) => {
      const fa = fuentes.find((f) => f.id === a)!, fb = fuentes.find((f) => f.id === b)!;
      return prioridad(fb, eb.flatMap((e) => e.muestras), elegida) - prioridad(fa, ea.flatMap((e) => e.muestras), elegida);
    })[0];
    const fuente = fuentes.find((f) => f.id === id)!;
    const principal = [...lista].sort((a, b) => b.dormido - a.dormido)[0];
    const deLaNoche = lista.filter((e) => e === principal || e.dormido >= EPISODIO_LARGO
      || Math.abs(e.desde - principal.hasta) <= CERCA_DEL_PRINCIPAL * MIN || Math.abs(principal.desde - e.hasta) <= CERCA_DEL_PRINCIPAL * MIN);
    const siestas = lista.filter((e) => !deLaNoche.includes(e) && e.dormido >= SIESTA_MINIMA).reduce((s, e) => s + e.dormido, 0);
    noches.push(resumir(clave, fuente, deLaNoche, siestas, enCamaTodas, fuentes));
  }
  return noches.sort((a, b) => (a.clave < b.clave ? -1 : 1));
}

function resumir(clave: ClaveDia, fuente: Fuente, deLaNoche: Episodio[], siestas: number, enCamaTodas: Muestra[], fuentes: Fuente[]): Noche {
  const muestras = deLaNoche.flatMap((e) => e.muestras);
  const zona = muestras[0].zona;
  const cero = ceroDe(clave, zona);
  const aMin = (ms: number) => (ms - cero) / MIN;
  const dormidas = muestras.filter((m) => DORMIDO.includes(m.etapa));
  const intervalos = unir(dormidas.map((m) => [m.desde, m.hasta]));
  const inicio = intervalos[0][0], fin = intervalos[intervalos.length - 1][1];
  const dormido = largo(intervalos);
  const huecos: number[] = [];
  for (let i = 1; i < intervalos.length; i++) huecos.push((intervalos[i][0] - intervalos[i - 1][1]) / MIN);
  const etapa = (e: Etapa) => largo(unir(dormidas.filter((m) => m.etapa === e).map((m) => [m.desde, m.hasta])));
  const etapas = { nucleo: etapa('nucleo'), profundo: etapa('profundo'), rem: etapa('rem'), sinEtapa: etapa('dormido') };
  const conEtapas = etapas.nucleo + etapas.profundo + etapas.rem > 0;
  // En cama: solo si alguna fuente lo escribió, cerca de este sueño; primero la misma fuente.
  const cerca = enCamaTodas.filter((m) => m.hasta > inicio - CERCA_DEL_PRINCIPAL * MIN && m.desde < fin + CERCA_DEL_PRINCIPAL * MIN);
  const deLaMisma = cerca.filter((m) => m.fuente === fuente.id);
  const usadas = deLaMisma.length ? deLaMisma : cerca;
  const camaI = unir(usadas.map((m) => [m.desde, m.hasta]));
  const fuenteCama = usadas.length ? fuentes.find((f) => f.id === usadas[0].fuente) ?? null : null;
  const enCama = camaI.length && fuenteCama
    ? { desde: aMin(Math.min(camaI[0][0], inicio)), hasta: aMin(Math.max(camaI[camaI.length - 1][1], fin)), minutos: largo(camaI), fuente: fuenteCama }
    : null;
  // El hipnograma: lo despierto de adentro y cada etapa (o lo dormido sin etapa), en orden.
  const tramos: Tramo[] = [
    ...dormidas.map((m) => ({ etapa: m.etapa as Tramo['etapa'], desde: aMin(m.desde), hasta: aMin(m.hasta) })),
    ...unir(huecos.length ? intervalos.slice(1).map((x, i): [number, number] => [intervalos[i][1], x[0]]) : []).map(([a, b]) => ({ etapa: 'despierto' as const, desde: aMin(a), hasta: aMin(b) })),
  ].sort((a, b) => a.desde - b.desde);
  const desdeElTelefono = fuente.tipo === 'telefono';
  return {
    clave, fuente, conEtapas,
    dormirse: aMin(inicio), despertar: aMin(fin), enCama,
    dormido, despierto: Math.max(0, (fin - inicio) / MIN - dormido), despertares: huecos.filter((h) => h >= DESPERTAR_MINIMO).length,
    etapas, siestas, tramos, intervalos,
    confianza: {
      duracion: desdeElTelefono ? 'baja' : 'alta',
      horario: desdeElTelefono ? 'baja' : 'alta',
      despertares: desdeElTelefono ? 'baja' : 'media',
      etapas: conEtapas ? 'baja' : null,
      enCama: enCama ? (enCama.fuente.tipo === 'telefono' ? 'baja' : 'media') : null,
    },
  };
}

/**
 * Los días que solo tienen «en cama» (el teléfono, sin el reloj): no es sueño medido y no entra en
 * nada, pero se muestra aparte, con confianza baja, en vez de dejar el día vacío.
 */
export function soloEnCama(muestras: Muestra[], fuentes: Fuente[], noches: Noche[]): Map<ClaveDia, { minutos: number; fuente: Fuente }> {
  const conNoche = new Set(noches.map((n) => n.clave));
  const porDia = new Map<ClaveDia, { intervalos: [number, number][]; fuente: Fuente }>();
  for (const x of muestras) {
    const fuente = fuentes.find((f) => f.id === x.fuente);
    const clave = claveDelSueno(x.hasta, x.zona);
    if (x.etapa !== 'enCama' || !fuente || conNoche.has(clave)) continue;
    const dia = porDia.get(clave) ?? { intervalos: [], fuente };
    dia.intervalos.push([x.desde, x.hasta]);
    porDia.set(clave, dia);
  }
  return new Map([...porDia].map(([clave, d]) => [clave, { minutos: largo(unir(d.intervalos)), fuente: d.fuente }]));
}

// ------------------------------------------------------------ las últimas dos semanas

/** Las noches de los últimos `dias` hasta `hasta` (incluida), con null donde no hay datos. */
export function ultimasNoches(noches: Noche[], hasta: ClaveDia, dias: number): (Noche | null)[] {
  const porClave = new Map(noches.map((n) => [n.clave, n]));
  const fin = Date.parse(hasta + 'T00:00:00.000Z');
  return Array.from({ length: dias }, (_, i) => porClave.get(new Date(fin - (dias - 1 - i) * 24 * 60 * MIN).toISOString().slice(0, 10)) ?? null);
}

/** Lo que necesitás dormir: lo que elegiste, de 7 a 9 horas; sin elegir, 8 y desde los 65, 7 y media. */
export function necesidad(edad: number, elegida?: number | null): number {
  if (elegida) return Math.min(9 * 60, Math.max(7 * 60, elegida));
  return edad >= 65 ? 7.5 * 60 : 8 * 60;
}

/** Lo mínimo para cada cosa: el horario desde 5 noches previas, la deuda con 5 de 14, la regularidad con 8 de 14. */
export const MINIMOS = { horarioDeLaCalidad: 5, deuda: 5, regularidad: 8, loTuyo: 7, finDeSemana: 2, semana: 4 };

const medidas = (noches: (Noche | null)[]) => noches.filter((n): n is Noche => !!n && n.confianza.horario !== 'baja');
const mediana = (xs: number[]) => {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};
const mediaYDesvio = (xs: number[]): [number, number] => {
  const media = xs.reduce((s, x) => s + x, 0) / xs.length;
  return [media, Math.sqrt(xs.reduce((s, x) => s + (x - media) ** 2, 0) / xs.length)];
};
const limitar = (x: number) => Math.min(1, Math.max(0, x));

export type Regularidad = 'muyRegular' | 'regular' | 'irregular' | 'muyIrregular';
export type Horario = {
  /** El promedio de la hora de dormirte y de despertarte (en minutos desde las 18) y cuánto se corre cada una. */
  dormirse: number;
  despertar: number;
  desvioDormirse: number;
  desvioDespertar: number;
  noches: number;
  regularidad: Regularidad;
  /** Cuánto más tarde queda la mitad del sueño las noches de viernes y sábado (null si no hay noches para comparar). */
  finDeSemana: number | null;
};

/**
 * El horario de las últimas dos semanas: a qué hora te dormís y te despertás, y cuánto se corre (el
 * desvío estándar). Hasta 30 minutos es muy regular; hasta una hora, regular; hasta hora y media,
 * irregular. Con menos de 8 noches medidas, null.
 */
export function horario(noches: (Noche | null)[]): Horario | null {
  const lista = medidas(noches);
  if (lista.length < MINIMOS.regularidad) return null;
  const [dormirse, desvioDormirse] = mediaYDesvio(lista.map((n) => n.dormirse));
  const [despertar, desvioDespertar] = mediaYDesvio(lista.map((n) => n.despertar));
  const peor = Math.max(desvioDormirse, desvioDespertar);
  // El fin de semana: las noches que terminan sábado y domingo contra las que terminan de lunes a viernes.
  const dia = (n: Noche) => new Date(n.clave + 'T00:00:00.000Z').getUTCDay();
  const mitad = (n: Noche) => (n.dormirse + n.despertar) / 2;
  const fin = lista.filter((n) => dia(n) === 6 || dia(n) === 0);
  const semana = lista.filter((n) => dia(n) >= 1 && dia(n) <= 5);
  const promedio = (xs: Noche[]) => xs.reduce((s, n) => s + mitad(n), 0) / xs.length;
  return {
    dormirse, despertar, desvioDormirse, desvioDespertar, noches: lista.length,
    regularidad: peor <= 30 ? 'muyRegular' : peor <= 60 ? 'regular' : peor <= 90 ? 'irregular' : 'muyIrregular',
    finDeSemana: fin.length >= MINIMOS.finDeSemana && semana.length >= MINIMOS.semana ? promedio(fin) - promedio(semana) : null,
  };
}

export type Deuda = { minutos: number; noches: number; de: number };
/** Lo que sobra en una noche paga deuda hasta 2 horas, no más. */
const SOBRA_MAXIMA = 120;

/**
 * La deuda de las últimas dos semanas: lo que faltó para tu necesidad cada noche, pesando más las
 * últimas (anoche entera, hace dos semanas casi nada), menos lo que sobró. Las siestas cuentan; las
 * noches sin datos no suman ni restan. Hacen falta 5 noches medidas de 14.
 */
export function deudaDeSueno(noches: (Noche | null)[], necesidadMin: number): Deuda | null {
  const n = noches.length;
  let suma = 0;
  let contadas = 0;
  noches.forEach((noche, i) => {
    if (!noche || noche.confianza.duracion === 'baja') return;
    const atras = n - 1 - i;
    const falta = Math.max(-SOBRA_MAXIMA, necesidadMin - (noche.dormido + noche.siestas));
    suma += (1 - atras / n) * falta;
    contadas++;
  });
  if (contadas < MINIMOS.deuda) return null;
  return { minutos: Math.max(0, suma), noches: contadas, de: n };
}

// ------------------------------------------------------------ la calidad

export type Calidad = {
  puntos: number;
  /** Cada parte con lo que suma; `horario` es null mientras no hay 5 noches para comparar. */
  partes: { duracion: number; horario: number | null; continuidad: number };
  /** Sin el horario, el total se reescala a 100 y es parcial. */
  parcial: boolean;
  palabra: 'excelente' | 'buena' | 'regular' | 'baja';
};
export const MAXIMOS = { duracion: 50, horario: 30, continuidad: 20 };

/**
 * La calidad de una noche, de 0 a 100, en tres partes que se pueden explicar:
 * - la duración contra tu necesidad (50): nada con 4 horas, todo al llegar;
 * - el horario (30): cuánto se corrieron tu hora de dormirte y de despertarte de las de siempre (la
 *   mediana de las noches anteriores): todo hasta media hora, nada desde hora y media;
 * - la continuidad (20): los minutos despierto (todo hasta 20, nada desde 60) y los despertares
 *   (todo con uno, nada con cuatro).
 * Las etapas, el tiempo en cama y el corazón no entran: el reloj los mide con menos acierto.
 */
export function calidadDeNoche(noche: Noche, necesidadMin: number, anteriores: (Noche | null)[]): Calidad | null {
  if (noche.confianza.duracion === 'baja') return null;
  const duracion = MAXIMOS.duracion * limitar((noche.dormido - 240) / Math.max(1, necesidadMin - 240));
  const previas = medidas(anteriores).filter((n) => n.clave < noche.clave);
  let horarioP: number | null = null;
  if (previas.length >= MINIMOS.horarioDeLaCalidad) {
    const d = (Math.abs(noche.dormirse - mediana(previas.map((n) => n.dormirse))) + Math.abs(noche.despertar - mediana(previas.map((n) => n.despertar)))) / 2;
    horarioP = MAXIMOS.horario * limitar((90 - d) / 60);
  }
  const continuidad = 10 * limitar((60 - noche.despierto) / 40) + 10 * limitar((4 - noche.despertares) / 3);
  const suma = duracion + (horarioP ?? 0) + continuidad;
  const maximo = MAXIMOS.duracion + (horarioP === null ? 0 : MAXIMOS.horario) + MAXIMOS.continuidad;
  const puntos = Math.round((suma / maximo) * 100);
  return {
    puntos,
    partes: { duracion: Math.round(duracion), horario: horarioP === null ? null : Math.round(horarioP), continuidad: Math.round(continuidad) },
    parcial: horarioP === null,
    palabra: puntos >= 85 ? 'excelente' : puntos >= 70 ? 'buena' : puntos >= 50 ? 'regular' : 'baja',
  };
}

/**
 * Una noche que parece cortada (la batería, el reloj que se sacó): menos de la mitad de lo que
 * solés dormir y despertarte más de dos horas antes que siempre. Se pregunta; no se descarta sola.
 */
export function pareceIncompleta(noche: Noche, anteriores: (Noche | null)[]): boolean {
  const previas = medidas(anteriores).filter((n) => n.clave < noche.clave);
  if (previas.length < MINIMOS.horarioDeLaCalidad) return false;
  return noche.dormido < 0.5 * mediana(previas.map((n) => n.dormido)) && noche.despertar < mediana(previas.map((n) => n.despertar)) - 120;
}

// ------------------------------------------------------------ lo que mide el reloj de noche

/** Un valor del reloj (frecuencia cardíaca, variabilidad, respiración) en un instante, en milisegundos. */
export type Medida = { en: number; valor: number };
export type Vital = { valor: number; lecturas: number; comparado: 'usual' | 'mas' | 'menos' | null; usual: number | null };
export type TipoDeVital = 'frecuencia' | 'variabilidad' | 'respiracion';

/** Cuántas lecturas hacen falta: una cada media hora de frecuencia, dos de variabilidad y de respiración. */
const LECTURAS: Record<TipoDeVital, (horas: number) => number> = { frecuencia: (h) => Math.max(1, Math.floor(h * 2)), variabilidad: () => 2, respiracion: () => 2 };
/** Desde cuánto de diferencia con lo tuyo se dice «más» o «menos»: en lpm, en %, en respiraciones. */
const DIFERENCIA: Record<TipoDeVital, (usual: number) => number> = { frecuencia: () => 3, variabilidad: (u) => u * 0.15, respiracion: () => 1 };

/**
 * Un valor de la noche: el promedio de lo medido mientras dormías, de la misma fuente, contra lo
 * tuyo (la mediana de tus noches anteriores, con al menos 7). Sin lecturas suficientes, null.
 */
export function vitalDeNoche(tipo: TipoDeVital, lecturas: Medida[], noche: Pick<Noche, 'intervalos'>, anteriores: number[]): Vital | null {
  const dentro = lecturas.filter((m) => noche.intervalos.some(([a, b]) => m.en >= a && m.en <= b)).map((m) => m.valor);
  const horas = largo(noche.intervalos) / 60;
  if (dentro.length < LECTURAS[tipo](horas)) return null;
  const valor = dentro.reduce((s, x) => s + x, 0) / dentro.length;
  if (anteriores.length < MINIMOS.loTuyo) return { valor, lecturas: dentro.length, comparado: null, usual: null };
  const usual = mediana(anteriores.slice(-28));
  const umbral = DIFERENCIA[tipo](usual);
  return { valor, lecturas: dentro.length, usual, comparado: valor > usual + umbral ? 'mas' : valor < usual - umbral ? 'menos' : 'usual' };
}
