// Los movimientos de las secciones, con las reglas del gesto de Ascent (nucleo/deslizar.ts): se
// cambia con un quinto de la pantalla o con un tirón rápido, el viaje dura 340 ms y la curva sale
// rápido y frena largo.

import { Easing, FadeIn, FadeOut, SlideInDown, SlideInRight, SlideOutDown, SlideOutRight, withTiming } from 'react-native-reanimated';

export const UMBRAL = 0.22;
/** El tirón, en puntos por segundo: 0,35 por milisegundo, como en Ascent. */
export const VELOCIDAD_MINIMA = 350;
export const VIAJE_MS = 340;
/** En los bordes no hay pestaña: la tira cede un cuarto de lo que se mueve el dedo. */
export const CEDE_EN_EL_BORDE = 0.25;

/** La curva de lo que llega: sale rápido y frena largo, como en iOS. */
export const LLEGA = Easing.bezier(0.16, 1, 0.3, 1);
/** La de lo que se va: arranca suave y termina rápido, y dura menos que la llegada. */
const SE_VA = Easing.bezier(0.4, 0, 1, 1);

export function viaje(hasta: number) {
  'worklet';
  return withTiming(hasta, { duration: VIAJE_MS, easing: LLEGA });
}

// Las hojas y los paneles: con la curva de iOS se sienten rápidos aunque duren lo mismo. Con la
// curva pareja de antes, una hoja de casi medio segundo parecía en cámara lenta.
export const ENTRA_HOJA = SlideInDown.duration(340).easing(LLEGA);
export const SALE_HOJA = SlideOutDown.duration(230).easing(SE_VA);
export const ENTRA_PANEL = SlideInRight.duration(300).easing(LLEGA);
export const SALE_PANEL = SlideOutRight.duration(220).easing(SE_VA);
/** El fondo oscuro detrás de una hoja. */
export const ENTRA_VELO = FadeIn.duration(220);
export const SALE_VELO = FadeOut.duration(200);

/** Ascent o la hoja del «+», que suben o bajan: más corto cuanto menos falta, como un resorte. */
export function subirOBajar(desde: number, hasta: number) {
  'worklet';
  return withTiming(hasta, { duration: 220 + 260 * Math.abs(hasta - desde), easing: LLEGA });
}

export function entre(x: number, a: number, b: number) {
  'worklet';
  return Math.min(b, Math.max(a, x));
}
