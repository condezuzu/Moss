// El control de cada semana (especificación, «Nutrición» 2; spec/nutricion.md): mide el gasto de
// verdad con la comida registrada y la tendencia del peso, y ajusta las metas. Es neutral al
// cumplimiento: nunca «compensa» lo que se comió de más o de menos, solo mide. Y es suave: un
// cambio grande en el gasto medido mueve la meta de a poco, en varias semanas.

import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { KCAL_POR_KG, metaPara, type Cuestionario, type Estilo, type Macros } from './metas';

export type Pesada = { fecha: ClaveDia; kg: number };
/** Un peso guardado: uno por día, desde Salud, Ascent o a mano. */
export type Peso = Pesada & { origen: 'manual' | 'salud' | 'ascent'; momento: string };
/** Las kcal registradas en un día, y cuántas de ellas a ojo. Un día sin nada registrado no aparece. */
export type ComidaDelDia = { fecha: ClaveDia; kcal: number; kcalEstimadas?: number };

/** La tendencia del peso es una media móvil exponencial: unas tres semanas de memoria. */
const ALFA = 0.1;
/** Lo que tarda la tendencia en alcanzar a un peso que se mueve: a las tres semanas va al 89 %. */
const ARRANQUE = 21;
/** El control mira las últimas tres semanas, y necesita al menos una con datos. */
const VENTANA = 21;
const TRAMO_MINIMO = 7;
/** Lo mínimo en la última semana para medir algo. */
const DIAS_CON_COMIDA = 4;
const PESADAS = 1;
/** Qué parte de la diferencia entre el gasto medido y el anterior se toma cada semana. */
const SUAVIZADO = 0.25;
/**
 * Lo calculado a ojo tiene más ruido que lo pesado. El gasto se mide igual (un error parejo, como
 * calcular siempre un poco menos, se compensa solo: el control mide lo que pasa con lo que anotás),
 * pero se mueve más despacio: con todo a ojo, la mitad de rápido.
 */
const FRENO_POR_LO_ESTIMADO = 0.5;

/**
 * El peso de cada día, desde la primera pesada hasta `hasta`. Los días sin pesada se rellenan en
 * línea recta entre las vecinas, y con la última después de ella.
 */
function pesosDiarios(pesadas: Pesada[], hasta: ClaveDia): Map<ClaveDia, number> {
  const lista = pesadas.filter((p) => p.fecha <= hasta).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const resultado = new Map<ClaveDia, number>();
  if (!lista.length) return resultado;
  let i = 0;
  for (let dia = lista[0].fecha; dia <= hasta; dia = sumarDias(dia, 1)) {
    while (i + 1 < lista.length && lista[i + 1].fecha <= dia) i++;
    const a = lista[i];
    const b = lista[i + 1];
    resultado.set(dia, b ? a.kg + ((b.kg - a.kg) * diasEntre(a.fecha, dia)) / diasEntre(a.fecha, b.fecha) : a.kg);
  }
  return resultado;
}

/** La tendencia de cada día, desde la primera pesada hasta `hasta`: la media móvil del peso de cada día. */
export function tendencia(pesadas: Pesada[], hasta: ClaveDia): Map<ClaveDia, number> {
  const resultado = new Map<ClaveDia, number>();
  let actual: number | null = null;
  for (const [dia, kg] of pesosDiarios(pesadas, hasta)) {
    actual = actual === null ? kg : actual + ALFA * (kg - actual);
    resultado.set(dia, actual);
  }
  return resultado;
}

/**
 * Cuántos kilos por día cambió el peso de `desde` a `hasta`. La tendencia arranca en la primera
 * pesada (o en `datosDesde`, si es después) y tarda unas tres semanas en alcanzar a un peso que se
 * mueve: medido con ella, las primeras semanas darían la mitad. Hasta entonces se mide con la recta
 * de mínimos cuadrados por el peso de cada día, que no se atrasa.
 */
export function cambioPorDia(pesadas: Pesada[], desde: ClaveDia, hasta: ClaveDia, datosDesde?: ClaveDia): number | null {
  const diarios = pesosDiarios(pesadas, hasta);
  const primero = [...diarios.keys()][0];
  if (primero === undefined || desde < primero || desde >= hasta) return null;
  const arranque = datosDesde && datosDesde > primero ? datosDesde : primero;
  if (diasEntre(arranque, desde) >= ARRANQUE) {
    const t = tendencia(pesadas, hasta);
    return (t.get(hasta)! - t.get(desde)!) / diasEntre(desde, hasta);
  }
  const puntos = [...diarios].filter(([dia]) => dia >= desde).map(([dia, kg]) => [diasEntre(desde, dia), kg] as const);
  const mx = puntos.reduce((s, [x]) => s + x, 0) / puntos.length;
  const my = puntos.reduce((s, [, y]) => s + y, 0) / puntos.length;
  return puntos.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / puntos.reduce((s, [x]) => s + (x - mx) ** 2, 0);
}

/**
 * Lo que mira el control que termina en `fin`: las últimas tres semanas o, si hay menos, desde que
 * hay pesadas y comida registrada; las pesadas de antes (las de Salud, de antes de Moss) no tienen
 * comida con qué compararse. `dias` cuenta los días con datos, el primero y el último incluidos.
 */
function tramoDelControl(pesadas: Pesada[], comidas: ComidaDelDia[], fin: ClaveDia) {
  const primera = (fechas: ClaveDia[]) => fechas.reduce<ClaveDia | null>((m, f) => (f <= fin && (m === null || f < m) ? f : m), null);
  const primeraPesada = primera(pesadas.map((p) => p.fecha));
  const primeraComida = primera(comidas.filter((c) => c.kcal > 0).map((c) => c.fecha));
  if (primeraPesada === null || primeraComida === null) return null;
  const datosDesde = primeraPesada > primeraComida ? primeraPesada : primeraComida;
  const ventana = sumarDias(fin, -(VENTANA - 1));
  const inicio = datosDesde > ventana ? datosDesde : ventana;
  return { inicio, datosDesde, dias: diasEntre(inicio, fin) + 1 };
}

export type Control = {
  gasto: number;
  metas: Macros;
  motivo: 'control' | 'faltanDatos';
  /** Lo que se usó, para mostrar «cómo se calcula». */
  datos: {
    diasConComida: number;
    pesadas: number;
    comidaPromedio: number | null;
    cambioDeTendencia: number | null;
    dias: number | null;
    gastoMedido: number | null;
    pesoDeTendencia: number | null;
    /** Qué parte de las kcal del tramo fue calculada a ojo, de 0 a 1. */
    fraccionEstimada: number;
  };
};

export type EntradaDelControl = {
  hoy: ClaveDia;
  pesadas: Pesada[];
  comidas: ComidaDelDia[];
  gastoAnterior: number;
  metasAnteriores: Macros;
  perfil: Pick<Cuestionario, 'edad' | 'sexo' | 'pesoKg' | 'objetivo' | 'ritmo' | 'sinDeficit'>;
  /** Cómo se reparten los macros; sin decir, la equilibrada. */
  estilo?: Estilo;
};

export function controlSemanal(e: EntradaDelControl): Control {
  // Se miran días enteros: hasta ayer.
  const fin = sumarDias(e.hoy, -1);
  const semana = sumarDias(fin, -6);
  const enRango = (fecha: ClaveDia, desde: ClaveDia) => fecha >= desde && fecha <= fin;
  const diasConComida = e.comidas.filter((c) => c.kcal > 0 && enRango(c.fecha, semana)).length;
  const pesadas = e.pesadas.filter((p) => enRango(p.fecha, semana)).length;
  const sinCambios = (datos: Partial<Control['datos']>): Control => ({
    gasto: e.gastoAnterior, metas: e.metasAnteriores, motivo: 'faltanDatos',
    datos: { diasConComida, pesadas, comidaPromedio: null, cambioDeTendencia: null, dias: null, gastoMedido: null, pesoDeTendencia: null, fraccionEstimada: 0, ...datos },
  });
  if (diasConComida < DIAS_CON_COMIDA || pesadas < PESADAS) return sinCambios({});

  const pesoDeTendencia = tendencia(e.pesadas, fin).get(fin)!;
  const tramo = tramoDelControl(e.pesadas, e.comidas, fin);
  if (!tramo || tramo.dias < TRAMO_MINIMO) return sinCambios({ pesoDeTendencia });
  const { inicio } = tramo;
  const dias = diasEntre(inicio, fin);

  const registradas = e.comidas.filter((c) => c.kcal > 0 && enRango(c.fecha, inicio));
  const comidaPromedio = registradas.reduce((s, c) => s + c.kcal, 0) / registradas.length;
  const cambioDeTendencia = cambioPorDia(e.pesadas, inicio, fin, tramo.datosDesde)! * dias;
  // Lo que entró menos lo que quedó guardado (o más lo que se gastó de reserva).
  const gastoMedido = comidaPromedio - (cambioDeTendencia * KCAL_POR_KG) / dias;
  const total = registradas.reduce((s, c) => s + c.kcal, 0);
  const fraccionEstimada = total > 0 ? Math.min(1, registradas.reduce((s, c) => s + (c.kcalEstimadas ?? 0), 0) / total) : 0;
  const gasto = e.gastoAnterior + SUAVIZADO * (1 - FRENO_POR_LO_ESTIMADO * fraccionEstimada) * (gastoMedido - e.gastoAnterior);
  return {
    gasto: Math.round(gasto),
    metas: metaPara(gasto, { ...e.perfil, pesoKg: pesoDeTendencia }, e.estilo),
    motivo: 'control',
    datos: { diasConComida, pesadas, comidaPromedio: Math.round(comidaPromedio), cambioDeTendencia, dias, gastoMedido: Math.round(gastoMedido), pesoDeTendencia, fraccionEstimada },
  };
}

/** El último día de control hasta hoy, incluido: el día de la semana elegido. */
export function ultimoDiaDeControl(hoy: ClaveDia, dia: DiaSemana): ClaveDia {
  return sumarDias(hoy, -((diaDeLaSemana(hoy) - dia + 7) % 7));
}

export type EstadoDelControl = {
  /** Cuándo es el próximo: hoy, si toca hoy y todavía no corrió. */
  fecha: ClaveDia;
  faltan: number;
  /** Lo que ya hay de la semana que va a mirar, y lo mínimo para que mida algo. */
  diasConComida: number;
  pesadas: number;
  minimos: { diasConComida: number; pesadas: number };
  /** Para ese día todavía no hay una semana con pesadas y comida registrada: ese control no mide. */
  tramoCorto: boolean;
  alcanza: boolean;
};

/** Cómo viene el próximo control: cuándo es y si la semana que va a mirar ya tiene lo que necesita. */
export function estadoDelControl(e: { hoy: ClaveDia; dia: DiaSemana; ultimaMeta: ClaveDia; pesadas: Pesada[]; comidas: ComidaDelDia[] }): EstadoDelControl {
  const ultimo = ultimoDiaDeControl(e.hoy, e.dia);
  // Uno que ya tocó y no corrió (al cambiar el día del control, por ejemplo) corre al abrir Moss: hoy.
  const fecha = ultimo > e.ultimaMeta ? (ultimo < e.hoy ? e.hoy : ultimo) : sumarDias(ultimo, 7);
  const fin = sumarDias(fecha, -1);
  const desde = sumarDias(fecha, -7);
  const hasta = fin < e.hoy ? fin : e.hoy;
  const enRango = (f: ClaveDia) => f >= desde && f <= hasta;
  const diasConComida = e.comidas.filter((c) => c.kcal > 0 && enRango(c.fecha)).length;
  const pesadas = e.pesadas.filter((p) => enRango(p.fecha)).length;
  // Sin pesadas o sin comida todavía, lo más pronto que puede empezar el tramo es hoy.
  const inicio = tramoDelControl(e.pesadas, e.comidas, fin)?.inicio ?? e.hoy;
  const tramoCorto = diasEntre(inicio, fin) + 1 < TRAMO_MINIMO;
  return {
    fecha, faltan: diasEntre(e.hoy, fecha), diasConComida, pesadas,
    minimos: { diasConComida: DIAS_CON_COMIDA, pesadas: PESADAS },
    tramoCorto,
    alcanza: diasConComida >= DIAS_CON_COMIDA && pesadas >= PESADAS && !tramoCorto,
  };
}
