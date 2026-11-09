// Lo que se decide, sin nada de la pantalla, al mantener apretado lo anotado en Comida y al deslizarlo para
// borrarlo (la galería 46, aprobada el 9/11/2026): dónde va el menú, a qué días se copia o se mueve, a qué
// hora queda lo copiado y cómo sigue la fila al dedo. Con sus tests.

import { comidaDeLaHora, type Comida } from '@/dominio/comidas';
import { minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import type { Registro } from '@/dominio/registros';

/** Un lugar en la pantalla, en puntos. */
export type Rect = { x: number; y: number; ancho: number; alto: number };

/** El ancho del menú, el de la galería. */
export const ANCHO_DEL_MENU = 236;
/** Entre lo levantado y el menú. */
const SEPARACION = 10;
/** Del menú al borde de la pantalla, a los costados. */
const BORDE = 14;

/**
 * Dónde va el menú. `arriba` es su borde de arriba; `corre`, cuánto sube (negativo) lo levantado para
 * hacerle lugar; `desdeAbajo`, si va encima de lo levantado (crece desde su borde de abajo).
 */
export type Lugar = { izquierda: number; arriba: number; corre: number; desdeAbajo: boolean };

/**
 * Debajo de lo levantado; si no entra, encima; si tampoco, lo levantado sube lo que haga falta (sin pasar
 * de la hora) y el menú va debajo. `margen` es lo que no se tapa: la hora arriba y la barra de inicio abajo.
 */
export function ubicarMenu(
  rect: Rect,
  alto: number,
  pantalla: { ancho: number; alto: number },
  margen: { arriba: number; abajo: number },
  ancho = ANCHO_DEL_MENU,
): Lugar {
  const izquierda = Math.max(BORDE, Math.min(rect.x, pantalla.ancho - BORDE - ancho));
  const debajo = rect.y + rect.alto + SEPARACION;
  const fin = pantalla.alto - margen.abajo;
  if (debajo + alto <= fin) return { izquierda, arriba: debajo, corre: 0, desdeAbajo: false };
  const encima = rect.y - SEPARACION - alto;
  if (encima >= margen.arriba) return { izquierda, arriba: encima, corre: 0, desdeAbajo: true };
  const corre = Math.max(margen.arriba - rect.y, fin - (debajo + alto));
  // Lo levantado tan alto que ni así entra: el menú queda dentro de la pantalla, aunque lo tape un poco.
  return { izquierda, arriba: Math.max(margen.arriba, Math.min(debajo + corre, fin - alto)), corre, desdeAbajo: false };
}

/**
 * Los días a los que se copia o se mueve: ayer, hoy y mañana, y el día que se mira si es otro (como en la
 * galería), en orden. Sin los que ya no están en el teléfono (antes de `primero`).
 */
export function diasDelMenu(origen: ClaveDia, hoy: ClaveDia, primero: ClaveDia): ClaveDia[] {
  return [...new Set([sumarDias(hoy, -1), hoy, sumarDias(hoy, 1), origen])].filter((d) => d >= primero).sort();
}

/** Cómo se dice a dónde fue, visto desde el día que se mira: «al almuerzo», «a la cena de mañana». */
export type Donde = 'mismo' | 'hoy' | 'ayer' | 'manana' | 'otro';

export function dondeFue(dia: ClaveDia, origen: ClaveDia, hoy: ClaveDia): Donde {
  if (dia === origen) return 'mismo';
  if (dia === hoy) return 'hoy';
  if (dia === sumarDias(hoy, -1)) return 'ayer';
  if (dia === sumarDias(hoy, 1)) return 'manana';
  return 'otro';
}

/**
 * El minuto del día de destino para lo que se copia o se mueve. Si ese día ya tiene algo de esa comida, al
 * minuto siguiente de lo último que tiene: queda al final de la comida, como en la galería, y la comida no
 * cambia de hora. Si no, hoy y en la comida de la hora, ahora; si no, a la hora de esa comida (la del
 * horario o la de siempre, `horaDe`).
 */
export function minutoDeDestino(
  delDia: readonly Pick<Registro, 'comida' | 'momento'>[],
  dia: ClaveDia,
  comida: Comida,
  op: { hoy: ClaveDia; ahora: Date; corte: number; horaDe: (c: Comida) => number },
): number {
  const deEsa = delDia.filter((r) => r.comida === comida).map((r) => minutosEnElDia(new Date(r.momento), dia));
  if (deEsa.length) return Math.max(...deEsa) + 1;
  if (dia === op.hoy) {
    const ahora = minutosEnElDia(op.ahora, dia);
    if (comidaDeLaHora(ahora, op.corte) === comida) return ahora;
  }
  return op.horaDe(comida);
}

// ------------------------------------------------------------ deslizar para borrar

/** El ancho de «Borrar» con la fila abierta. */
export const ANCHO_DE_BORRAR = 80;

/** Pasado esto (un poco más de la mitad de la fila), soltar borra. */
export function topeDeBorrar(anchoDeLaFila: number): number {
  'worklet';
  return Math.max(ANCHO_DE_BORRAR * 1.6, anchoDeLaFila * 0.58);
}

/** Dónde queda la fila con el dedo: a la derecha no hay nada y cede poco; pasado el tope, cuesta más. */
export function seguirAlDedo(desde: number, traslado: number, tope: number): number {
  'worklet';
  let x = desde + traslado;
  if (x > 0) x *= 0.25;
  if (-x > tope) x = -(tope + (-x - tope) * 0.35);
  return x;
}

/**
 * Qué hace la fila al soltarla (`velocidad` en puntos por segundo; para la izquierda, negativa): pasado el
 * tope, se borra; corrida más de media «Borrar» o con un tirón a la izquierda, queda abierta; si no, se cierra.
 */
export function alSoltarLaFila(x: number, velocidad: number, tope: number): 'borrar' | 'abrir' | 'cerrar' {
  'worklet';
  if (-x >= tope) return 'borrar';
  const porMs = velocidad / 1000;
  const abre = -x > ANCHO_DE_BORRAR / 2 || (porMs < -0.5 && -x > 16);
  return abre && porMs < 0.5 ? 'abrir' : 'cerrar';
}
