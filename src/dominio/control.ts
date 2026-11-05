// El control de cada semana (especificación, «Nutrición» 2; spec/nutricion.md): mide el gasto de
// verdad con la comida registrada y cómo cambió el peso, y ajusta las metas. Es neutral al
// cumplimiento: nunca «compensa» lo que se comió de más o de menos, solo mide. Y es suave: un
// cambio grande en el gasto medido mueve la meta de a poco, en varias semanas. El cambio del peso
// sale de la recta por las pesadas de verdad, sin inventar los días sin pesada, y una pesada rara
// cuenta poco hasta que otra la confirme (spec/estudio/metas.md, A1; spec/estudio/progreso.md, A2 y A3).

import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from './fechas';
import { estiloPermitido, KCAL_POR_KG, macrosConProteina, metaPara, objetivoPermitido, PROTEINA_POR_KG, type Cuestionario, type Eleccion, type Estilo, type Macros } from './metas';

export type Pesada = { fecha: ClaveDia; kg: number };
/** Un peso guardado: uno por día, desde Salud, Ascent o a mano. */
export type Peso = Pesada & { origen: 'manual' | 'salud' | 'ascent'; momento: string };
/** Las kcal registradas en un día, y cuántas de ellas a ojo. Un día sin nada registrado no aparece. */
export type ComidaDelDia = { fecha: ClaveDia; kcal: number; kcalEstimadas?: number };

/** La tendencia del peso es una media móvil exponencial: unas tres semanas de memoria. */
const ALFA = 0.1;
/**
 * Los días que atrasa la tendencia cuando el peso baja (o sube) parejo: (1 − α)/α, nueve, a los que llega
 * de a poco desde la primera pesada.
 */
export const atrasoDeLaTendencia = (dias: number) => ((1 - ALFA) / ALFA) * (1 - (1 - ALFA) ** Math.max(0, dias));
/** El control mira las últimas tres semanas, y necesita al menos una con datos. */
const VENTANA = 21;
const TRAMO_MINIMO = 7;
/** La recta necesita dos pesadas a una semana una de otra: con el primer día y el último, siete. */
const DIAS_DE_LA_RECTA = TRAMO_MINIMO - 1;
/** Lo mínimo en la última semana para medir algo. */
const DIAS_CON_COMIDA = 4;
const PESADAS = 1;
/** Qué parte de la diferencia entre el gasto medido y el anterior se toma cada semana. */
const SUAVIZADO = 0.25;
/**
 * Lo calculado a ojo tiene más ruido que lo pesado. El gasto se mide igual (un error parejo, como
 * calcular siempre un poco menos, se compensa solo: el control mide lo que pasa con lo que anotas),
 * pero se mueve más despacio: con todo a ojo, la mitad de rápido.
 */
const FRENO_POR_LO_ESTIMADO = 0.5;
/**
 * Una pesada rara (vestido, de noche, después de una comida salada) se aparta de lo esperado más de 1,5 kg o
 * del 2 % del peso: unas tres veces lo que el peso varía de un día a otro (0,5 kg; Hall y Chow, 2011; Kutáč,
 * 2015). Cuenta con un cuarto de su diferencia hasta que la siguiente la confirme.
 */
const RARA_KG = 1.5;
const RARA_PARTE_DEL_PESO = 0.02;
const PARTE_DE_UNA_RARA = 0.25;
/** Lo esperado es la recta de las seis semanas anteriores, con al menos tres pesadas a una semana; si no, no se revisa. */
const DIAS_DE_LO_ESPERADO = 42;
const PESADAS_DE_LO_ESPERADO = 3;
/** Después de la última pesada, la tendencia sigue con su pendiente hasta una semana; más, no se adivina. */
const DIAS_QUE_SIGUE = 7;

export type Recta = { pendiente: number; x: number; y: number; sxx: number; residuos: number };

/** La recta de mínimos cuadrados por unos puntos (x en días): la pendiente, por dónde pasa y lo que se aparta. */
export function recta(puntos: readonly (readonly [number, number])[]): Recta | null {
  const n = puntos.length;
  if (n < 2) return null;
  const x = puntos.reduce((s, [a]) => s + a, 0) / n;
  const y = puntos.reduce((s, [, b]) => s + b, 0) / n;
  const sxx = puntos.reduce((s, [a]) => s + (a - x) ** 2, 0);
  if (!(sxx > 0)) return null;
  const pendiente = puntos.reduce((s, [a, b]) => s + (a - x) * (b - y), 0) / sxx;
  const residuos = puntos.reduce((s, [a, b]) => s + (b - y - pendiente * (a - x)) ** 2, 0);
  return { pendiente, x, y, sxx, residuos };
}

const porFecha = (a: Pesada, b: Pesada) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0);

/**
 * Las pesadas como cuentan, de la más vieja a la más nueva. Una rara entra con un cuarto de su diferencia con
 * lo esperado hasta que la siguiente la confirme (apartada para el mismo lado en más de la mitad del borde):
 * entonces las dos cuentan enteras y lo esperado vuelve a empezar desde ahí, porque el peso cambió de verdad.
 */
export function pesadasQueCuentan(pesadas: readonly Pesada[]): Pesada[] {
  const lista = [...pesadas].sort(porFecha);
  if (!lista.length) return [];
  const x = lista.map((p) => diasEntre(lista[0].fecha, p.fecha));
  const cuentan: Pesada[] = [];
  let pendiente: { i: number; lado: number; kg: number } | null = null;
  let desde = -Infinity;
  let inicio = 0;
  for (let i = 0; i < lista.length; i++) {
    const p = lista[i];
    while (inicio < i && x[inicio] < Math.max(x[i] - DIAS_DE_LO_ESPERADO, desde)) inicio++;
    const previas: [number, number][] = [];
    for (let k = inicio; k < i; k++) if (k !== pendiente?.i && x[k] < x[i]) previas.push([x[k], cuentan[k].kg]);
    const r = previas.length >= PESADAS_DE_LO_ESPERADO && previas[previas.length - 1][0] - previas[0][0] >= DIAS_DE_LA_RECTA ? recta(previas) : null;
    if (!r) {
      cuentan.push({ fecha: p.fecha, kg: p.kg });
      pendiente = null;
      continue;
    }
    const esperado = r.y + r.pendiente * (x[i] - r.x);
    const borde = Math.max(RARA_KG, RARA_PARTE_DEL_PESO * esperado);
    const diferencia = p.kg - esperado;
    if (pendiente && Math.sign(diferencia) === pendiente.lado && Math.abs(diferencia) > borde / 2) {
      cuentan[pendiente.i] = { fecha: cuentan[pendiente.i].fecha, kg: pendiente.kg };
      desde = x[pendiente.i];
      cuentan.push({ fecha: p.fecha, kg: p.kg });
      pendiente = null;
    } else if (Math.abs(diferencia) > borde) {
      cuentan.push({ fecha: p.fecha, kg: esperado + PARTE_DE_UNA_RARA * diferencia });
      pendiente = { i: cuentan.length - 1, lado: Math.sign(diferencia), kg: p.kg };
    } else {
      cuentan.push({ fecha: p.fecha, kg: p.kg });
      pendiente = null;
    }
  }
  return cuentan;
}

/** La pendiente de la recta por las pesadas (ya como cuentan) de `desde` a `hasta`: con menos de dos, o a menos de una semana, null. */
function pendienteEntre(cuentan: readonly Pesada[], desde: ClaveDia, hasta: ClaveDia): number | null {
  const del = cuentan.filter((p) => p.fecha >= desde && p.fecha <= hasta);
  if (del.length < 2 || diasEntre(del[0].fecha, del[del.length - 1].fecha) < DIAS_DE_LA_RECTA) return null;
  return recta(del.map((p) => [diasEntre(desde, p.fecha), p.kg] as const))?.pendiente ?? null;
}

/** El peso de cada día, de la primera pesada a la última: entre dos, en línea recta. Después de la última, nada. */
function pesosDiarios(cuentan: readonly Pesada[]): Map<ClaveDia, number> {
  const resultado = new Map<ClaveDia, number>();
  if (!cuentan.length) return resultado;
  let i = 0;
  for (let dia = cuentan[0].fecha; dia <= cuentan[cuentan.length - 1].fecha; dia = sumarDias(dia, 1)) {
    while (i + 1 < cuentan.length && cuentan[i + 1].fecha <= dia) i++;
    const a = cuentan[i];
    const b = cuentan[i + 1];
    resultado.set(dia, b ? a.kg + ((b.kg - a.kg) * diasEntre(a.fecha, dia)) / diasEntre(a.fecha, b.fecha) : a.kg);
  }
  return resultado;
}

/**
 * La tendencia de cada día, desde la primera pesada hasta `hasta`: la media móvil del peso de cada día, con
 * las pesadas como cuentan. Después de la última no se copia: sigue con la pendiente de las tres semanas
 * anteriores, hasta una semana.
 */
export function tendencia(pesadas: readonly Pesada[], hasta: ClaveDia): Map<ClaveDia, number> {
  const cuentan = pesadasQueCuentan(pesadas.filter((p) => p.fecha <= hasta));
  const resultado = new Map<ClaveDia, number>();
  let actual: number | null = null;
  for (const [dia, kg] of pesosDiarios(cuentan)) {
    actual = actual === null ? kg : actual + ALFA * (kg - actual);
    resultado.set(dia, actual);
  }
  if (actual === null) return resultado;
  const ultima = cuentan[cuentan.length - 1].fecha;
  const pendiente = pendienteEntre(cuentan, sumarDias(ultima, -(VENTANA - 1)), ultima) ?? 0;
  for (let dia = sumarDias(ultima, 1), n = 1; dia <= hasta; dia = sumarDias(dia, 1), n++) resultado.set(dia, actual + pendiente * Math.min(n, DIAS_QUE_SIGUE));
  return resultado;
}

/**
 * Cuántos kilos por día cambió el peso de `desde` a `hasta`: la pendiente de la recta por las pesadas de
 * ese tramo, como cuentan, sin inventar los días sin pesada (con una por semana, rellenar después de la
 * última achataba el ritmo un 23 %). Con menos de dos pesadas, o a menos de una semana una de otra, null.
 */
export function cambioPorDia(pesadas: readonly Pesada[], desde: ClaveDia, hasta: ClaveDia): number | null {
  if (desde >= hasta) return null;
  return pendienteEntre(pesadasQueCuentan(pesadas.filter((p) => p.fecha <= hasta)), desde, hasta);
}

/**
 * Lo que mira el control que termina en `fin`: las últimas tres semanas o, si hay menos, desde que
 * hay pesadas y comida registrada; las pesadas de antes (las de Salud, de antes de Moss) no tienen
 * comida con qué compararse. `dias` cuenta los días con datos, el primero y el último incluidos.
 */
function tramoDelControl(pesadas: readonly Pesada[], comidas: readonly ComidaDelDia[], fin: ClaveDia) {
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
    /** Lo que cambió el peso en el tramo, por la recta de las pesadas. */
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
  /** Lo que eligió en el cuestionario nuevo (la proteína, y el ritmo de la fecha o de la recomposición): el control lo sigue. */
  eleccion?: Eleccion;
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
  // Con una sola pesada en el tramo no se sabe cómo cambió el peso: medir así tomaría lo comido por el gasto.
  const porDia = cambioPorDia(e.pesadas, inicio, fin);
  if (porDia === null) return sinCambios({ pesoDeTendencia });

  const registradas = e.comidas.filter((c) => c.kcal > 0 && enRango(c.fecha, inicio));
  const comidaPromedio = registradas.reduce((s, c) => s + c.kcal, 0) / registradas.length;
  const cambioDeTendencia = porDia * dias;
  // Lo que entró menos lo que quedó guardado (o más lo que se gastó de reserva).
  const gastoMedido = comidaPromedio - porDia * KCAL_POR_KG;
  const total = registradas.reduce((s, c) => s + c.kcal, 0);
  const fraccionEstimada = total > 0 ? Math.min(1, registradas.reduce((s, c) => s + (c.kcalEstimadas ?? 0), 0) / total) : 0;
  const gasto = e.gastoAnterior + SUAVIZADO * (1 - FRENO_POR_LO_ESTIMADO * fraccionEstimada) * (gastoMedido - e.gastoAnterior);
  let metas = metaPara(gasto, { ...e.perfil, pesoKg: pesoDeTendencia }, e.estilo, e.eleccion);
  // Sin déficit, el control nunca baja la meta: lo que sube en un embarazo no es grasa a 7.700 kcal por
  // kilo, y con un trastorno de la alimentación no se propone comer menos. Con el sí/no no se sabe cuál es.
  if (e.perfil.sinDeficit && metas.kcal < e.metasAnteriores.kcal) {
    const porKg = e.eleccion?.proteinaPorKg ?? PROTEINA_POR_KG[objetivoPermitido(e.perfil)];
    metas = macrosConProteina(e.metasAnteriores.kcal, pesoDeTendencia, pesoDeTendencia * porKg, estiloPermitido(e.estilo ?? 'equilibrada', true));
  }
  return {
    gasto: Math.round(gasto),
    metas,
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
  /** Lo que ya tiene alcanza, también dos pesadas del tramo a una semana una de otra, para la recta. */
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
  const delTramo = e.pesadas.map((p) => p.fecha).filter((f) => f >= inicio && f <= hasta).sort();
  const conRecta = delTramo.length >= 2 && diasEntre(delTramo[0], delTramo[delTramo.length - 1]) >= DIAS_DE_LA_RECTA;
  return {
    fecha, faltan: diasEntre(e.hoy, fecha), diasConComida, pesadas,
    minimos: { diasConComida: DIAS_CON_COMIDA, pesadas: PESADAS },
    tramoCorto,
    alcanza: diasConComida >= DIAS_CON_COMIDA && pesadas >= PESADAS && !tramoCorto && conRecta,
  };
}
