// El control de cada semana (especificación, «Nutrición» 2; spec/nutricion.md): mide el gasto de
// verdad con la comida registrada y la tendencia del peso, y ajusta las metas. Es neutral al
// cumplimiento: nunca «compensa» lo que se comió de más o de menos, solo mide. Y es suave: un
// cambio grande en el gasto medido mueve la meta de a poco, en varias semanas.

import { diasEntre, sumarDias, type ClaveDia } from './fechas';
import { KCAL_POR_KG, metaPara, type Cuestionario, type Macros } from './metas';

export type Pesada = { fecha: ClaveDia; kg: number };
/** Un peso guardado: uno por día, desde Salud, Ascent o a mano. */
export type Peso = Pesada & { origen: 'manual' | 'salud' | 'ascent'; momento: string };
/** Las kcal registradas en un día. Un día sin nada registrado no aparece. */
export type ComidaDelDia = { fecha: ClaveDia; kcal: number };

/** La tendencia del peso es una media móvil exponencial: unas tres semanas de memoria. */
const ALFA = 0.1;
/** El control mira las últimas tres semanas, y la tendencia necesita al menos una. */
const VENTANA = 21;
const TRAMO_MINIMO = 7;
/** Lo mínimo en la última semana para medir algo. */
const DIAS_CON_COMIDA = 4;
const PESADAS = 1;
/** Qué parte de la diferencia entre el gasto medido y el anterior se toma cada semana. */
const SUAVIZADO = 0.25;

/**
 * La tendencia de cada día, desde la primera pesada hasta `hasta`. Los días sin pesada se
 * rellenan en línea recta entre las vecinas, y con la última después de ella.
 */
export function tendencia(pesadas: Pesada[], hasta: ClaveDia): Map<ClaveDia, number> {
  const lista = pesadas.filter((p) => p.fecha <= hasta).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const resultado = new Map<ClaveDia, number>();
  if (!lista.length) return resultado;
  let actual = lista[0].kg;
  let i = 0;
  for (let dia = lista[0].fecha; dia <= hasta; dia = sumarDias(dia, 1)) {
    while (i + 1 < lista.length && lista[i + 1].fecha <= dia) i++;
    const a = lista[i];
    const b = lista[i + 1];
    const kg = b ? a.kg + ((b.kg - a.kg) * diasEntre(a.fecha, dia)) / diasEntre(a.fecha, b.fecha) : a.kg;
    actual += ALFA * (kg - actual);
    resultado.set(dia, actual);
  }
  return resultado;
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
  };
};

export type EntradaDelControl = {
  hoy: ClaveDia;
  pesadas: Pesada[];
  comidas: ComidaDelDia[];
  gastoAnterior: number;
  metasAnteriores: Macros;
  perfil: Pick<Cuestionario, 'edad' | 'sexo' | 'pesoKg' | 'objetivo' | 'ritmo'>;
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
    datos: { diasConComida, pesadas, comidaPromedio: null, cambioDeTendencia: null, dias: null, gastoMedido: null, pesoDeTendencia: null, ...datos },
  });
  if (diasConComida < DIAS_CON_COMIDA || pesadas < PESADAS) return sinCambios({});

  // El tramo: las últimas tres semanas, o desde que hay tendencia si es más corto.
  const t = tendencia(e.pesadas, fin);
  const primero = [...t.keys()][0];
  const inicio = primero > sumarDias(fin, -(VENTANA - 1)) ? primero : sumarDias(fin, -(VENTANA - 1));
  const dias = diasEntre(inicio, fin);
  const pesoDeTendencia = t.get(fin)!;
  if (dias < TRAMO_MINIMO) return sinCambios({ pesoDeTendencia });

  const registradas = e.comidas.filter((c) => c.kcal > 0 && enRango(c.fecha, inicio));
  const comidaPromedio = registradas.reduce((s, c) => s + c.kcal, 0) / registradas.length;
  const cambioDeTendencia = pesoDeTendencia - t.get(inicio)!;
  // Lo que entró menos lo que quedó guardado (o más lo que se gastó de reserva).
  const gastoMedido = comidaPromedio - (cambioDeTendencia * KCAL_POR_KG) / dias;
  const gasto = e.gastoAnterior + SUAVIZADO * (gastoMedido - e.gastoAnterior);
  return {
    gasto: Math.round(gasto),
    metas: metaPara(gasto, { ...e.perfil, pesoKg: pesoDeTendencia }),
    motivo: 'control',
    datos: { diasConComida, pesadas, comidaPromedio: Math.round(comidaPromedio), cambioDeTendencia, dias, gastoMedido: Math.round(gastoMedido), pesoDeTendencia },
  };
}
