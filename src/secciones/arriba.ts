// Tocar otra vez la pestaña en la que estás sube arriba de todo, como en iOS, y solo el scroll de la
// sección que se ve sube con un toque en la hora (con más de un scroll que sube, iOS no sube ninguno).
// Las secciones son 0 Inicio, 1 Comida, 2 Progreso, 3 Sueño, 4 Hábitos y 5 Perfil.

import { useSyncExternalStore } from 'react';

const alTocar = new Map<number, () => void>();

/** Lo que hace una sección cuando se vuelve a tocar su pestaña. Devuelve cómo dejar de escuchar. */
export function alTocarDeNuevo(seccion: number, hacer: () => void): () => void {
  alTocar.set(seccion, hacer);
  return () => {
    if (alTocar.get(seccion) === hacer) alTocar.delete(seccion);
  };
}

/** Lo llama la barra cuando se toca la pestaña de la sección en la que ya estás. */
export function tocarDeNuevo(seccion: number) {
  alTocar.get(seccion)?.();
}

let actual = 0;
// Con una hoja abierta (la del «+» o la de registro), la hora sube el scroll de la hoja, no el de atrás.
let conHoja = false;
const oyentes = new Set<() => void>();
const escuchar = (o: () => void) => {
  oyentes.add(o);
  return () => {
    oyentes.delete(o);
  };
};

/** Secciones avisa qué sección se ve y si hay una hoja abierta encima. */
export function ponerSeccionActual(seccion: number, hojaAbierta = conHoja) {
  if (seccion === actual && hojaAbierta === conHoja) return;
  actual = seccion;
  conHoja = hojaAbierta;
  oyentes.forEach((o) => o());
}

/** Si esta sección es la que se ve, sin una hoja encima: para `scrollsToTop` del scroll de la sección. */
export function useEsLaActual(seccion: number): boolean {
  return useSyncExternalStore(escuchar, () => actual === seccion && !conHoja);
}
