// Los movimientos de las secciones, con las reglas del gesto de Ascent (nucleo/deslizar.ts): se
// cambia con un quinto de la pantalla o con un tirón rápido, el viaje dura 340 ms y la curva sale
// rápido y frena largo.

import { Easing, withTiming } from 'react-native-reanimated';

export const UMBRAL = 0.22;
/** El tirón, en puntos por segundo: 0,35 por milisegundo, como en Ascent. */
export const VELOCIDAD_MINIMA = 350;
export const VIAJE_MS = 340;
/** En los bordes no hay pestaña: la tira cede un cuarto de lo que se mueve el dedo. */
export const CEDE_EN_EL_BORDE = 0.25;

export function viaje(hasta: number) {
  'worklet';
  return withTiming(hasta, { duration: VIAJE_MS, easing: Easing.bezier(0.16, 1, 0.3, 1) });
}

/** Ascent o la hoja del «+», que suben o bajan: más corto cuanto menos falta, como un resorte. */
export function subirOBajar(desde: number, hasta: number) {
  'worklet';
  return withTiming(hasta, { duration: 220 + 260 * Math.abs(hasta - desde), easing: Easing.bezier(0.16, 1, 0.3, 1) });
}

export function entre(x: number, a: number, b: number) {
  'worklet';
  return Math.min(b, Math.max(a, x));
}
