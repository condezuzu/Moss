// El rendimiento, la fuerza y las marcas (spec/rendimiento.md), con Ascent vinculada. Revisado con la
// evidencia el 5/11/2026: lo de arriba es lo que se propone ahora, para aprobar en la galería; lo de abajo
// («lo de antes») lo sigue usando la app, apagada con CON_ASCENT, hasta que se programe lo nuevo.
// - La noche en una palabra, con los umbrales de los estudios (estadoDeLaNoche), y una sola línea del
//   rendimiento, solo con la noche corta (lineaDelRendimiento).
// - La fuerza: la tendencia de 12 semanas de cada ejercicio con su rango del 80 %, que dice «sube», «sin
//   subida clara» o «todavía no se sabe» (tendenciaDeFuerza). Con 3 semanas, «estancado» era casi todo
//   ruido.
// - La marca, sin probabilidad: si tu nivel de hoy (la tendencia) está a menos de tu ruido de la marca, con
//   las condiciones a la vista y cada cuánto haces marca (cercaDeLaMarca, frecuenciaDeMarcas). La
//   probabilidad de antes no estaba calibrada: cuando decía 49 %, la marca salía el 15 % de las veces.

import type { EstadoMuscular } from './musculos';

const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

// ------------------------------------------------------------ la noche

/** 6 horas o menos es la pérdida de sueño de los estudios (Craven 2022); 4 h 30 o menos, muy corta. */
export const NOCHE_CORTA = 6 * 60;
export const NOCHE_MUY_CORTA = 4.5 * 60;
/** Despertarse una hora o más antes de lo de siempre pesa más que acostarse tarde (Craven 2022; Kong 2025). */
export const DESPERTO_ANTES = 60;

export type Noche = {
  dormido: number;
  necesidad: number;
  /** Cuántos minutos antes de lo de siempre te despertaste (null si no se sabe o no fue antes). */
  despertoAntes: number | null;
};
export type EstadoDeLaNoche = 'normal' | 'algoCorta' | 'corta' | 'muyCorta';

/**
 * La noche en una palabra, con los umbrales de los estudios y no con una recta: normal hasta una hora por
 * debajo de lo que necesitas; corta con 6 h o menos o despertándote una hora o más antes; muy corta con
 * 4 h 30 o menos. Entre una hora menos y 6 h, algo corta: no cambia la sesión.
 */
export function estadoDeLaNoche(n: Noche): EstadoDeLaNoche {
  if (n.dormido <= NOCHE_MUY_CORTA) return 'muyCorta';
  if (n.dormido <= NOCHE_CORTA || (n.despertoAntes ?? 0) >= DESPERTO_ANTES) return 'corta';
  return n.dormido < n.necesidad - 60 ? 'algoCorta' : 'normal';
}

/** Dos de las últimas tres noches de 6 h o menos: varias noches cortas bajan los multiarticulares (Knowles 2018; Reilly y Piercy 1994). */
export const nochesCortasSeguidas = (ultimas3: readonly number[]) => ultimas3.filter((m) => m <= NOCHE_CORTA).length >= 2;

/** Si la noche de hoy (o las de antes) es de las que cambian la sesión. */
export const suenoCorto = (noche: Noche | null, ultimas3: readonly number[]) =>
  !!noche && (['corta', 'muyCorta'].includes(estadoDeLaNoche(noche)) || nochesCortasSeguidas(ultimas3));

/**
 * El rendimiento de hoy, en una línea y solo con la noche corta: «la fuerza máxima casi no cambia; las
 * repeticiones pueden costar más» (en los estudios, −2,85 % y −9,85 %: Craven 2022). Sin Δ, sin «± 3,3 %»
 * y sin categorías: los multiplicadores de antes salían de subgrupos con intervalos que cruzan el cero.
 */
export const lineaDelRendimiento = (noche: Noche | null, ultimas3: readonly number[]): 'suenoCorto' | null => (suenoCorto(noche, ultimas3) ? 'suenoCorto' : null);

// ------------------------------------------------------------ la fuerza: la tendencia de cada ejercicio

/** Una sesión con el ejercicio: cuándo (en semanas, desde cualquier día fijo) y el 1RM estimado de su mejor serie. */
export type PuntoDeFuerza = { t: number; e1rm: number };
export type EstadoDeLaFuerza = 'sube' | 'sinSubidaClara' | 'noSeSabe';
/** La recta de la tendencia, en logaritmos: lo que hace falta para dibujarla con su rango. */
export type Ajuste = { tMedio: number; yMedio: number; b: number; s: number; n: number; sxx: number };
export type TendenciaDeFuerza = {
  estado: EstadoDeLaFuerza;
  /** Las sesiones de la ventana y cuántas semanas van de la primera a la última. */
  sesiones: number;
  semanas: number;
  /** Lo que sube por mes, en %, con su rango del 80 % (null si no se sabe). */
  porMes: number | null;
  rango: [number, number] | null;
  /** Tu ruido de un día a otro, en %, acercado al de los estudios (sigmaTuyo). */
  sigma: number;
  /** Tu nivel de hoy, en kg de 1RM estimado: el de la tendencia (null con menos de 3 sesiones). */
  nivel: number | null;
  ajuste: Ajuste | null;
  puntos: PuntoDeFuerza[];
};

/** La ventana: las últimas 12 semanas. */
export const SEMANAS_DE_LA_TENDENCIA = 12;
/** Para decir algo: 6 sesiones o más, y por lo menos 6 semanas de la primera a la última. */
export const SESIONES_MINIMAS = 6;
export const SEMANAS_MINIMAS_DE_HISTORIA = 6;
/** «Sin subida clara»: ni el borde de arriba del rango llega a +0,3 % por semana. */
export const SIN_SUBIDA_POR_SEMANA = 0.3;
/** El rango del 80 %. */
export const Z_80 = 1.2816;
/** Semanas por mes (52,2 / 12). */
const SEMANAS_POR_MES = 4.35;

const porMesDe = (b: number) => (Math.exp(SEMANAS_POR_MES * b) - 1) * 100;

/**
 * La tendencia de la fuerza en un ejercicio: con las sesiones de las últimas 12 semanas, la recta de
 * mínimos cuadrados de ln(e1RM) contra el tiempo, con su rango del 80 % (b ± 1,2816 · EE(b)).
 * - «sube» si el borde de abajo pasa 0; «sin subida clara» si el de arriba no llega a +0,3 % por semana;
 *   si no, o con menos de 6 sesiones o 6 semanas, «todavía no se sabe».
 * - Con una sesión por semana y un ruido de 3,3 %: si subes un 1 % por mes, dice «sin subida clara» el
 *   15 % de las veces (la regla de las 3 semanas, el 63 %); si no subes, «sube» el 12 %.
 * - Tu ruido sale de lo que se aparta cada sesión de la recta (el error típico de Hopkins 2000), acercado
 *   al de los estudios con el peso de 10 sesiones.
 */
export function tendenciaDeFuerza(todos: readonly PuntoDeFuerza[], o: { hoy: number; entrenado: boolean }): TendenciaDeFuerza {
  const puntos = todos.filter((p) => p.t <= o.hoy && p.t > o.hoy - SEMANAS_DE_LA_TENDENCIA && p.e1rm > 0).sort((a, b) => a.t - b.t);
  const n = puntos.length;
  const semanas = n ? puntos[n - 1].t - puntos[0].t : 0;
  const base = o.entrenado ? SIGMA.entrenado : SIGMA.novato;
  const vacia: TendenciaDeFuerza = { estado: 'noSeSabe', sesiones: n, semanas, porMes: null, rango: null, sigma: base, nivel: null, ajuste: null, puntos };
  if (n < 3 || semanas <= 0) return vacia;
  const ys = puntos.map((p) => Math.log(p.e1rm));
  const tMedio = puntos.reduce((s, p) => s + p.t, 0) / n;
  const yMedio = ys.reduce((s, y) => s + y, 0) / n;
  let sxx = 0, sxy = 0;
  puntos.forEach((p, i) => { sxx += (p.t - tMedio) ** 2; sxy += (p.t - tMedio) * (ys[i] - yMedio); });
  const b = sxy / sxx;
  const residuos = puntos.map((p, i) => ys[i] - yMedio - b * (p.t - tMedio));
  const sse = residuos.reduce((s, r) => s + r * r, 0);
  const s = Math.sqrt(sse / Math.max(1, n - 2));
  const ee = s / Math.sqrt(sxx);
  const ajuste: Ajuste = { tMedio, yMedio, b, s, n, sxx };
  const sigma = sigmaTuyo(residuos.map((r) => r * 100), o.entrenado);
  const nivel = Math.exp(yMedio + b * (o.hoy - tMedio));
  if (n < SESIONES_MINIMAS || semanas < SEMANAS_MINIMAS_DE_HISTORIA) return { ...vacia, sigma, nivel, ajuste };
  const abajo = 100 * (b - Z_80 * ee), arriba = 100 * (b + Z_80 * ee);
  const estado: EstadoDeLaFuerza = abajo > 0 ? 'sube' : arriba < SIN_SUBIDA_POR_SEMANA ? 'sinSubidaClara' : 'noSeSabe';
  return { estado, sesiones: n, semanas, porMes: porMesDe(b), rango: [porMesDe(b - Z_80 * ee), porMesDe(b + Z_80 * ee)], sigma, nivel, ajuste, puntos };
}

/** La tendencia en un momento, en kg, con su rango del 80 % (para dibujarla). */
export function nivelEn(a: Ajuste, t: number): { nivel: number; abajo: number; arriba: number } {
  const y = a.yMedio + a.b * (t - a.tMedio);
  const ee = a.s * Math.sqrt(1 / a.n + (t - a.tMedio) ** 2 / a.sxx);
  return { nivel: Math.exp(y), abajo: Math.exp(y - Z_80 * ee), arriba: Math.exp(y + Z_80 * ee) };
}

/** El 1RM estimado se dice redondeado a 2,5 kg y con «aprox.»: Epley y Brzycki difieren más que el ruido de un día. */
export const aDosYMedio = (kg: number) => Math.round(kg / 2.5) * 2.5;

// ------------------------------------------------------------ la marca, sin probabilidad

export type CercaDeLaMarca = { cerca: boolean; distancia: number | null };

/**
 * Cerca de tu marca: tu nivel de hoy (la tendencia) está a menos de tu ruido de un día a otro de lo que
 * levantaste en tu marca: ln(marca) − ln(nivel) ≤ σ. Sin nivel, no se sabe.
 */
export function cercaDeLaMarca(x: { marca: number; nivel: number | null; sigma: number }): CercaDeLaMarca {
  if (x.nivel === null || x.nivel <= 0 || x.marca <= 0) return { cerca: false, distancia: null };
  const distancia = (Math.log(x.marca) - Math.log(x.nivel)) * 100;
  return { cerca: distancia <= x.sigma, distancia };
}

export type CondicionesDeLaMarca = { sueno: boolean; musculos: boolean; semana: boolean };

/**
 * Lo que acompaña un buen día, en una lista: dormiste más de 6 h y no te despertaste antes (ni vienes de
 * dos noches cortas de tres), los músculos del ejercicio descansados y una semana sin más series que de
 * costumbre.
 */
export function condicionesDeLaMarca(x: { noche: Noche | null; ultimas3: readonly number[]; musculos: EstadoMuscular | null; seriesSemanaSobreMes: number | null }): CondicionesDeLaMarca {
  const n = x.noche;
  return {
    sueno: !!n && n.dormido > NOCHE_CORTA && (n.despertoAntes ?? 0) < DESPERTO_ANTES && !nochesCortasSeguidas(x.ultimas3),
    musculos: x.musculos === 'recuperado',
    semana: x.seriesSemanaSobreMes === null || x.seriesSemanaSobreMes <= 1,
  };
}

/**
 * Cada cuánto haces marca: en cuántas de tus últimas sesiones con el ejercicio (hasta 20) hubo una marca
 * ese día. Es lo que más acierta: decir la frecuencia de siempre le gana a la probabilidad de antes
 * (Brier de 0,135 contra 0,183).
 */
export function frecuenciaDeMarcas(sesiones: readonly string[], marcas: readonly string[], ultimas = 20): { marcas: number; de: number } {
  const dias = [...new Set(sesiones)].sort().slice(-ultimas);
  const conMarca = new Set(marcas);
  return { marcas: dias.filter((d) => conMarca.has(d)).length, de: dias.length };
}

// ------------------------------------------------------------ lo de antes (la app, hasta que se programe lo nuevo)

/** El ruido de un día a otro en el 1RM (Grgic 2020): 3,3 % en entrenados, 5,5 % con menos de 6 meses. */
export const SIGMA = { entrenado: 3.3, novato: 5.5 };
/** Con el sueño estimado por el teléfono (sin reloj), el margen crece. */
export const SIGMA_SIN_RELOJ = 1.25;

export type DosNumeros = { max: number; vol: number };
export type Categoria = 'mejor' | 'normal' | 'algoMenos' | 'menos';
export type Motivo =
  | { que: 'durmioPoco'; minutos: number }
  | { que: 'despertoAntes' }
  | { que: 'nochesCortas' }
  | { que: 'deuda' }
  | { que: 'caraMala' }
  | { que: 'ayuno' }
  | { que: 'pocosCarbos' }
  | { que: 'bajandoRapido' }
  | { que: 'comioPoco' }
  | { que: 'musculoCargado'; residual: number }
  | { que: 'descarga' }
  | { que: 'sinEntrenarlo'; dias: number };

export type EntradasDelRendimiento = {
  /** Anoche: lo dormido (en minutos), lo que necesitás y cómo fue. Sin noche, null. */
  sueno: { dormido: number; necesidad: number; despertoAntes: boolean; seAcostoTarde: boolean; siesta: boolean; sinReloj: boolean } | null;
  /** Lo dormido las últimas tres noches (en minutos; las que faltan no están). */
  ultimas3: number[];
  /** La deuda de las dos semanas, en minutos (null sin 5 noches). */
  deuda: number | null;
  /** Cómo dijiste que dormiste, de 1 a 5. */
  cara: number | null;
  /** Lo de hoy: si es multiarticular, si es de piernas o del tren superior, y la hora de siempre (minutos desde la medianoche). */
  multiarticular: boolean;
  tren: 'inferior' | 'superior';
  horaHabitual: number | null;
  comida: {
    ayuno8h: boolean;
    sesionLarga: boolean;
    carbosAyerPorKilo: number | null;
    mismosMusculosAyer: boolean;
    /** Cuánto bajás por semana (en % del peso; positivo es bajar) y desde cuántas semanas. */
    bajaSemanal: number | null;
    semanasBajando: number;
    /** Las calorías de ayer sobre la meta (1 es la meta). */
    kcalAyer: number | null;
  };
  /** Lo que le falta recuperar a los músculos principales de hoy, en % (src/dominio/musculos.ts). */
  residual: number;
  descarga: { diasSinSeriesDuras: number; seriesSemanaSobreMes: number | null; intensidadMantenida: boolean; diasSinElEjercicio: number };
  entrenado: boolean;
};

export type Rendimiento = DosNumeros & {
  sigma: number;
  categoria: { max: Categoria; vol: Categoria };
  partes: { sueno: DosNumeros; cara: DosNumeros; comida: DosNumeros; musculo: DosNumeros; descarga: DosNumeros };
  /** Los motivos, del que más pesa al que menos. */
  motivos: Motivo[];
};

const CERO: DosNumeros = { max: 0, vol: 0 };
const sumar = (...xs: DosNumeros[]): DosNumeros => xs.reduce((a, b) => ({ max: a.max + b.max, vol: a.vol + b.vol }), CERO);

/**
 * S: el sueño de anoche (Craven 2022; Kong 2025). Desde una hora menos de lo que necesitás no cuenta;
 * de ahí a 6 horas, −1 / −2 (derivado); de 4,5 a 6, −3 / −6; menos, −4 / −8. Lo multiplican el
 * despertar temprano (×1,5; acostarse tarde, ×0,5), las piernas o los multiarticulares (×1,2; el tren
 * superior, ×0,6), entrenar de tarde (×1,6; de mañana, ×0,6) y una siesta (×0,5), hasta ×1,6.
 */
export function porElSueno(x: EntradasDelRendimiento): DosNumeros {
  const s = x.sueno;
  if (!s) return CERO;
  const h = s.dormido / 60;
  const base: DosNumeros = h >= s.necesidad / 60 - 1 ? CERO : h > 6 ? { max: -1, vol: -2 } : h > 4.5 ? { max: -3, vol: -6 } : { max: -4, vol: -8 };
  if (base.max === 0 && base.vol === 0) return CERO;
  let por = 1;
  if (s.despertoAntes) por *= 1.5;
  else if (s.seAcostoTarde) por *= 0.5;
  por *= x.tren === 'inferior' || x.multiarticular ? 1.2 : 0.6;
  if (x.horaHabitual !== null) por *= x.horaHabitual >= 15 * 60 ? 1.6 : x.horaHabitual < 11 * 60 ? 0.6 : 1;
  if (s.siesta) por *= 0.5;
  por = Math.min(1.6, por);
  return { max: base.max * por, vol: base.vol * por };
}

/**
 * D: las noches seguidas (Knowles 2018 y 2022; Reilly y Piercy 1994): 2 de las últimas 3 de 6 horas o
 * menos, −2 / −3 en los multiarticulares y 0 / −2 en los demás. La deuda de 7 horas o más, −1 / −1
 * (sin confirmar).
 */
export function porLasNoches(x: EntradasDelRendimiento): DosNumeros {
  const cortas = x.ultimas3.filter((m) => m <= 6 * 60).length >= 2;
  const seguidas = cortas ? (x.multiarticular ? { max: -2, vol: -3 } : { max: 0, vol: -2 }) : CERO;
  return sumar(seguidas, x.deuda !== null && x.deuda >= 7 * 60 ? { max: -1, vol: -1 } : CERO);
}

/** Q: con una o dos caras, −1 / −1 (sin evidencia directa: que lo decida lo tuyo). */
export const porLaCara = (cara: number | null): DosNumeros => (cara !== null && cara <= 2 ? { max: -1, vol: -1 } : CERO);

/**
 * C: la comida. Llegar con 8 horas o más sin comer: 0 / −5 en una sesión larga y 0 / −2 en una corta
 * (King 2022). Pocos carbohidratos ayer (menos de 3 g/kg) con los mismos músculos: 0 / −3 (sin
 * confirmar). Bajar más del 1 % por semana dos semanas o más: −1 / −2 (Garthe 2011). Ayer, menos del
 * 80 % de las calorías: 0 / −1. En la fuerza máxima los carbohidratos nunca cuentan.
 */
export function porLaComida(c: EntradasDelRendimiento['comida']): DosNumeros {
  return sumar(
    c.ayuno8h ? { max: 0, vol: c.sesionLarga ? -5 : -2 } : CERO,
    c.carbosAyerPorKilo !== null && c.carbosAyerPorKilo < 3 && c.mismosMusculosAyer ? { max: 0, vol: -3 } : CERO,
    c.bajaSemanal !== null && c.bajaSemanal > 1 && c.semanasBajando >= 2 ? { max: -1, vol: -2 } : CERO,
    c.kcalAyer !== null && c.kcalAyer < 0.8 ? { max: 0, vol: -1 } : CERO,
  );
}

/** M: la fatiga del músculo (derivado): −0,5 por cada punto en la fuerza máxima y −1 en las repeticiones. */
export const porElMusculo = (residual: number): DosNumeros => ({ max: -0.5 * residual, vol: -1 * residual });

/**
 * T: la descarga (Travis 2020). De 2 a 7 días sin series duras, con la semana entre un 30 y un 60 %
 * por debajo de lo de siempre y la carga mantenida: +2 / 0. Más de 7 días sin el ejercicio: −1 / −2.
 */
export function porLaDescarga(d: EntradasDelRendimiento['descarga']): DosNumeros {
  if (d.diasSinElEjercicio > 7) return { max: -1, vol: -2 };
  const enDescarga = d.diasSinSeriesDuras >= 2 && d.diasSinSeriesDuras <= 7 && d.seriesSemanaSobreMes !== null
    && d.seriesSemanaSobreMes >= 0.4 && d.seriesSemanaSobreMes <= 0.7 && d.intensidadMantenida;
  return enDescarga ? { max: 2, vol: 0 } : CERO;
}

/** Mejor desde +1,5; normal hasta −1,5; algo menos hasta −5; menos después. */
export const categoriaDe = (d: number): Categoria => (d >= 1.5 ? 'mejor' : d > -1.5 ? 'normal' : d > -5 ? 'algoMenos' : 'menos');

/** El rendimiento esperado de hoy, con sus partes y sus motivos. */
export function rendimientoEsperado(x: EntradasDelRendimiento): Rendimiento {
  const s = porElSueno(x), d = porLasNoches(x);
  // Para la última noche, lo peor de las dos, sin sumarlas.
  const sueno = { max: Math.min(s.max, d.max), vol: Math.min(s.vol, d.vol) };
  const cara = porLaCara(x.cara), comida = porLaComida(x.comida), musculo = porElMusculo(x.residual), descarga = porLaDescarga(x.descarga);
  const total = sumar(sueno, cara, comida, musculo, descarga);
  const max = limitar(total.max, -15, 4), vol = limitar(total.vol, -15, 4);
  const motivos: [number, Motivo][] = [];
  if (s.vol < 0 && x.sueno) motivos.push([s.vol, { que: 'durmioPoco', minutos: x.sueno.dormido }]);
  if (s.vol < 0 && x.sueno?.despertoAntes) motivos.push([s.vol / 2, { que: 'despertoAntes' }]);
  if (d.vol < 0 && d.vol <= s.vol) motivos.push([d.vol, x.ultimas3.filter((m) => m <= 360).length >= 2 ? { que: 'nochesCortas' } : { que: 'deuda' }]);
  if (cara.vol < 0) motivos.push([cara.vol, { que: 'caraMala' }]);
  if (x.comida.ayuno8h) motivos.push([x.comida.sesionLarga ? -5 : -2, { que: 'ayuno' }]);
  if (x.comida.carbosAyerPorKilo !== null && x.comida.carbosAyerPorKilo < 3 && x.comida.mismosMusculosAyer) motivos.push([-3, { que: 'pocosCarbos' }]);
  if (x.comida.bajaSemanal !== null && x.comida.bajaSemanal > 1 && x.comida.semanasBajando >= 2) motivos.push([-2, { que: 'bajandoRapido' }]);
  if (x.comida.kcalAyer !== null && x.comida.kcalAyer < 0.8) motivos.push([-1, { que: 'comioPoco' }]);
  if (x.residual >= 3) motivos.push([musculo.vol, { que: 'musculoCargado', residual: x.residual }]);
  if (descarga.max > 0) motivos.push([-descarga.max, { que: 'descarga' }]);
  if (descarga.vol < 0) motivos.push([descarga.vol, { que: 'sinEntrenarlo', dias: x.descarga.diasSinElEjercicio }]);
  const sigma = (x.entrenado ? SIGMA.entrenado : SIGMA.novato) * (x.sueno?.sinReloj ? SIGMA_SIN_RELOJ : 1);
  return {
    max, vol, sigma,
    categoria: { max: categoriaDe(max), vol: categoriaDe(vol) },
    partes: { sueno, cara, comida, musculo, descarga },
    motivos: motivos.sort((a, b) => a[0] - b[0]).map(([, m]) => m),
  };
}

/** La normal acumulada (Abramowitz y Stegun 7.1.26: error menor a 1,5 × 10⁻⁷). */
export function normalAcumulada(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/** Cuánto le falta a tu mejor serie reciente para llegar a la marca, en % (g). */
export const distanciaALaMarca = (marca: number, mejorReciente: number) => Math.max(0, (marca / mejorReciente - 1) * 100);

export type CondicionesDeMarca = { cerca: boolean; recuperado: boolean; sueno: boolean; sinPico: boolean; comida: boolean };
export type DiaDeMarca = { aplica: boolean; probabilidad: number; distancia: number; condiciones: CondicionesDeMarca };

/** Solo se avisa con una probabilidad de 35 % o más (spec/rendimiento.md). */
export const AVISAR_DESDE = 0.35;

/**
 * La regla general, desde el primer día: cerca de la marca (a 4 % o menos, o una marca en las últimas
 * 8 semanas sin repeticiones para estimar), los músculos recuperados, más de 6 horas sin despertar
 * temprano ni 2 de 3 noches cortas, sin pico de carga (la semana no pasa el promedio del mes) y sin
 * llegar en ayunas a una sesión larga ni estar bajando más de un 1 % por semana. Y la probabilidad:
 * P = 1 − Φ((g − Δmáx) / σ).
 */
export function buenDiaParaMarca(x: {
  marca: number;
  mejorReciente: number | null;
  marcaEn8Semanas: boolean;
  recuperado: boolean;
  dormido: number | null;
  despertoAntes: boolean;
  ultimas3: number[];
  seriesSemanaSobreMes: number | null;
  ayunoSesionLarga: boolean;
  bajandoRapido: boolean;
  deltaMax: number;
  sigma: number;
}): DiaDeMarca {
  const distancia = x.mejorReciente ? distanciaALaMarca(x.marca, x.mejorReciente) : 2;
  const condiciones: CondicionesDeMarca = {
    cerca: x.mejorReciente ? distancia <= 4 : x.marcaEn8Semanas,
    recuperado: x.recuperado,
    sueno: x.dormido !== null && x.dormido > 6 * 60 && !x.despertoAntes && x.ultimas3.filter((m) => m <= 6 * 60).length < 2,
    sinPico: x.seriesSemanaSobreMes === null || x.seriesSemanaSobreMes <= 1,
    comida: !x.ayunoSesionLarga && !x.bajandoRapido,
  };
  const probabilidad = 1 - normalAcumulada((distancia - x.deltaMax) / x.sigma);
  return { aplica: Object.values(condiciones).every(Boolean) && probabilidad >= AVISAR_DESDE, probabilidad, distancia, condiciones };
}

export type Seguridad = 'aprendiendo' | 'baja' | 'media' | 'alta';

/**
 * Qué tan segura es la versión tuya (los números exactos, sin confirmar): aprendiendo con menos de 3
 * marcas, 10 sesiones o 4 semanas; baja de 3 a 7 marcas; media de 8 a 14 y 8 semanas; alta con 15 o
 * más, 12 semanas y ganándole a la regla general.
 */
export function seguridadDeMarcas(x: { marcas: number; sesiones: number; semanas: number; leGanaALaGeneral: boolean }): Seguridad {
  if (x.marcas < 3 || x.sesiones < 10 || x.semanas < 4) return 'aprendiendo';
  if (x.marcas >= 15 && x.semanas >= 12 && x.leGanaALaGeneral) return 'alta';
  if (x.marcas >= 8 && x.semanas >= 8) return 'media';
  return 'baja';
}

/**
 * La versión tuya: de los 8 días más parecidos con ese ejercicio, en cuántos hiciste marca, contra
 * la regla general, que pesa como 6 días (contracción empírico-bayesiana; Efron y Morris 1975). El
 * intervalo del 80 %, con la aproximación normal de la Beta. Mientras la seguridad no sea alta, entre
 * 10 y 70 %.
 */
export function probabilidadTuya(general: number, marcasEnParecidos: number, parecidos: number, seguridad: Seguridad): { p: number; intervalo: [number, number] } {
  const a = 6 * general + marcasEnParecidos, b = 6 * (1 - general) + (parecidos - marcasEnParecidos);
  const media = a / (a + b);
  const desvio = Math.sqrt((a * b) / ((a + b) ** 2 * (a + b + 1)));
  const recortar = (p: number) => (seguridad === 'alta' ? limitar(p, 0, 1) : limitar(p, 0.1, 0.7));
  return { p: recortar(media), intervalo: [recortar(media - 1.2816 * desvio), recortar(media + 1.2816 * desvio)] };
}

/**
 * Tu σ: el desvío de tu mejor serie de cada sesión contra su tendencia (en %), que se acerca al de
 * los estudios con el peso de 10 sesiones (derivado).
 */
export function sigmaTuyo(desvios: number[], entrenado: boolean): number {
  const base = entrenado ? SIGMA.entrenado : SIGMA.novato;
  if (!desvios.length) return base;
  const varianza = desvios.reduce((s, d) => s + d * d, 0) / desvios.length;
  return Math.sqrt((desvios.length * varianza + 10 * base * base) / (desvios.length + 10));
}
