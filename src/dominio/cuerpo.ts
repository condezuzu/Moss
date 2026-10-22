// El cuerpo: las medidas con cinta y la grasa corporal que se estima con ellas (spec/progreso.md).
// Es una estimación, nunca una medición: se muestra como un rango chico, con su aviso.

import type { ClaveDia } from './fechas';
import type { Sexo } from './metas';

export type Sitio = 'cintura' | 'cuello' | 'cadera' | 'brazo' | 'pecho' | 'muslo';
/** En el orden en que se miden: las tres de la fórmula primero. */
export const SITIOS: readonly Sitio[] = ['cintura', 'cuello', 'cadera', 'brazo', 'pecho', 'muslo'];
/** Los centímetros de cada sitio; lo que no se midió no está. */
export type Centimetros = Partial<Record<Sitio, number>>;
/** Las medidas de un día. Entre dos teléfonos gana la más nueva; borrar deja una marca. */
export type Medidas = Centimetros & { fecha: ClaveDia; actualizado: string; borrado?: true };

/** Lo que puede tener una medida con cinta en un adulto: fuera de esto, se tipeó mal. */
export const RANGOS: Record<Sitio, readonly [number, number]> = {
  cintura: [40, 200], cuello: [20, 70], cadera: [50, 200], brazo: [15, 70], pecho: [50, 200], muslo: [25, 110],
};
export const medidaValida = (sitio: Sitio, cm: number) => Number.isFinite(cm) && cm >= RANGOS[sitio][0] && cm <= RANGOS[sitio][1];

/**
 * El método de la Marina de EE. UU. (Hodgdon y Beckett, 1984), en centímetros: la densidad del
 * cuerpo sale del cuello, la cintura (y la cadera, en mujeres) y la altura, y la grasa, de la
 * fórmula de Siri. Sin las medidas que pide, no hay estimación.
 */
export function grasaMarina(sexo: Sexo, alturaCm: number, m: Centimetros): number | null {
  const { cintura, cuello, cadera } = m;
  if (!cintura || !cuello || !(alturaCm > 0)) return null;
  const perimetro = sexo === 'm' ? cintura - cuello : cadera ? cintura + cadera - cuello : 0;
  if (perimetro <= 0) return null;
  const densidad = sexo === 'm'
    ? 1.0324 - 0.19077 * Math.log10(perimetro) + 0.15456 * Math.log10(alturaCm)
    : 1.29579 - 0.35004 * Math.log10(perimetro) + 0.221 * Math.log10(alturaCm);
  return 495 / densidad - 450;
}

/**
 * Lo que la cinta puede errar entre una medida y otra, en centímetros: la cintura y la cadera
 * se corren más que el cuello.
 */
const ERROR_CM: Partial<Record<Sitio, number>> = { cintura: 1, cadera: 1, cuello: 0.5 };
/** El rango nunca es más angosto que un punto para cada lado. */
const MEDIO_ANCHO_MINIMO = 1;
/**
 * Con muy poca grasa o con mucha, el método erra más (sobreestima a los más magros y subestima a
 * los de más grasa): el rango se abre un punto más para cada lado.
 */
const PUNTAS: Record<Sexo, readonly [number, number]> = { m: [10, 30], f: [18, 40] };
/** Fuera de esto, alguna medida está mal tomada. */
const POSIBLE: Record<Sexo, readonly [number, number]> = { m: [2, 60], f: [8, 65] };

export type RangoDeGrasa = { desde: number; hasta: number; estimado: number };

/**
 * El rango que se muestra: la estimación de la Marina más y menos lo que mueve el error de la
 * cinta en cada medida (sumados en cuadratura), redondeado hacia afuera a puntos enteros. Así
 * queda chico, de 2 a 4 puntos (5 en las puntas); lo que puede errar el método contra un
 * laboratorio, 3 o 4 puntos, va en el aviso, no en el rango (spec/progreso.md).
 */
export function rangoDeGrasa(sexo: Sexo, alturaCm: number, m: Centimetros): RangoDeGrasa | null {
  const estimado = grasaMarina(sexo, alturaCm, m);
  if (estimado === null || estimado < POSIBLE[sexo][0] || estimado > POSIBLE[sexo][1]) return null;
  const usadas: Sitio[] = sexo === 'm' ? ['cintura', 'cuello'] : ['cintura', 'cadera', 'cuello'];
  let cuadrados = 0;
  for (const sitio of usadas) {
    const corrida = grasaMarina(sexo, alturaCm, { ...m, [sitio]: (m[sitio] ?? 0) + (ERROR_CM[sitio] ?? 0) });
    if (corrida !== null) cuadrados += (corrida - estimado) ** 2;
  }
  const enLaPunta = estimado < PUNTAS[sexo][0] || estimado > PUNTAS[sexo][1];
  const medio = Math.max(MEDIO_ANCHO_MINIMO, Math.sqrt(cuadrados)) + (enLaPunta ? 1 : 0);
  return { desde: Math.max(0, Math.floor(estimado - medio)), hasta: Math.ceil(estimado + medio), estimado };
}

/**
 * La cintura sobre la altura: la guía NICE del Reino Unido (NG246) pide mantener la cintura por
 * debajo de la mitad de la altura; de 0,5 a 0,59 el riesgo sube, y desde 0,6 es alto.
 */
export function cinturaAltura(cinturaCm: number | undefined, alturaCm: number): number | null {
  return cinturaCm && alturaCm > 0 ? cinturaCm / alturaCm : null;
}

/** Las últimas medidas de cada sitio hasta `hasta`: no hace falta medir todo el mismo día. */
export function ultimasMedidas(medidas: Iterable<Medidas>, hasta: ClaveDia): Centimetros & { fechas: Partial<Record<Sitio, ClaveDia>> } {
  const lista = [...medidas].filter((x) => !x.borrado && x.fecha <= hasta).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const resultado: Centimetros & { fechas: Partial<Record<Sitio, ClaveDia>> } = { fechas: {} };
  for (const x of lista) {
    for (const sitio of SITIOS) {
      const cm = x[sitio];
      if (cm === undefined) continue;
      resultado[sitio] = cm;
      resultado.fechas[sitio] = x.fecha;
    }
  }
  return resultado;
}

/** Cuánto cambió un sitio desde la medida más cercana a `dias` atrás (en centímetros). */
export function cambioDe(medidas: Iterable<Medidas>, sitio: Sitio, hasta: ClaveDia, desde: ClaveDia): number | null {
  const lista = [...medidas].filter((x) => !x.borrado && x[sitio] !== undefined && x.fecha <= hasta).sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const ultima = lista[lista.length - 1];
  const antes = [...lista].reverse().find((x) => x.fecha <= desde);
  if (!ultima || !antes || antes === ultima) return null;
  return ultima[sitio]! - antes[sitio]!;
}
