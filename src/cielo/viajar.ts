// El viaje de la entrada a la app («flum», viaje.ts): el avance y cómo arranca. Lo lleva la entrada
// (Entrada.tsx) y lo dibuja el cielo (Cielo.tsx): por eso vive acá, afuera de los dos.

import { useSyncExternalStore } from 'react';
import { Easing, makeMutable, withTiming } from 'react-native-reanimated';

import { DURACION_DEL_VIAJE, MITAD_DEL_VIAJE } from './viaje';

/** El avance del viaje, de 0 a 1; quieto en 1. */
export const avanceDelViaje = makeMutable(1);

// Si hay un viaje en curso, para React: el cielo pone su capa solo mientras tanto.
let viajando = false;
const oyentes = new Set<() => void>();
const avisar = (v: boolean) => {
  viajando = v;
  oyentes.forEach((o) => o());
};
let fin: ReturnType<typeof setTimeout> | undefined;

/**
 * Arranca el viaje; `alCambiar` va en la mitad. Devuelve cómo no hacer ese cambio si todavía no llegó: el
 * viaje sigue igual, porque quien lo pidió (la entrada) se desmonta justo en el cambio.
 */
export function viajar(alCambiar: () => void) {
  clearTimeout(fin);
  avisar(true);
  avanceDelViaje.set(0);
  avanceDelViaje.set(withTiming(1, { duration: DURACION_DEL_VIAJE, easing: Easing.linear }));
  const cambio = setTimeout(alCambiar, DURACION_DEL_VIAJE * MITAD_DEL_VIAJE);
  // Un cuadro de más para que el cielo se dibuje quieto antes de sacar la capa.
  fin = setTimeout(() => avisar(false), DURACION_DEL_VIAJE + 100);
  return () => clearTimeout(cambio);
}

export function useViajando() {
  return useSyncExternalStore(
    (o) => {
      oyentes.add(o);
      return () => oyentes.delete(o);
    },
    () => viajando,
  );
}
