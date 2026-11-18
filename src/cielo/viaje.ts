// El «flum» de la galería (galeria/src/escena.js, viajar): de la entrada a la app se pasa con un salto
// de un segundo. La cámara acelera hacia un punto de fuga, las estrellas se estiran en estelas
// (shaders/viaje.glsl), en la mitad cambia lo que se ve y después todo frena hasta quedar quieto. La
// entrada crece y se apaga hacia la cámara. Lo lleva la entrada (Entrada.tsx) y lo dibuja el cielo
// (Cielo.tsx): el avance y cómo arranca están en viajar.ts; acá, las cuentas.

export const DURACION_DEL_VIAJE = 1000;
/** Cuándo cambia lo que se ve: hasta acá acelera, después frena. */
export const MITAD_DEL_VIAJE = 0.45;

export type ParametrosDelViaje = { zoom: number; estela: number; brillo: number; velo: number };

const limitar = (x: number) => {
  'worklet';
  return Math.min(1, Math.max(0, x));
};
const suave = (a: number, b: number, x: number) => {
  'worklet';
  const t = limitar((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Lo que usa el filtro del cielo en el avance `u`: el acercamiento, la estela, el brillo y el velo. */
export function parametrosDelViaje(u: number): ParametrosDelViaje {
  'worklet';
  if (u >= 1) return { zoom: 1, estela: 0, brillo: 1, velo: 0 };
  if (u < MITAD_DEL_VIAJE) {
    const k = Math.pow(limitar(u / MITAD_DEL_VIAJE), 2.2);
    return { zoom: 1 + 1.5 * k, estela: 1.1 * k, brillo: 1 + 0.35 * k, velo: 0.2 * k };
  }
  const k = 1 - Math.pow(1 - limitar((u - MITAD_DEL_VIAJE) / (1 - MITAD_DEL_VIAJE)), 3);
  // Un destello justo en el cambio: ahí se tapa el salto de la cámara.
  const destello = 0.35 * Math.exp(-Math.pow((u - MITAD_DEL_VIAJE) / 0.05, 2));
  return { zoom: 1 + 0.6 * (1 - k), estela: 1.1 * (1 - k), brillo: 1 + 0.35 * (1 - k) + destello, velo: 0.2 * (1 - k) };
}

/** La entrada que se va, en la primera mitad: crece y se apaga hacia la cámara. */
export function loQueSeVa(u: number): { escala: number; opacidad: number } {
  'worklet';
  const k = u >= 1 ? 1 : suave(0, 0.85, u / MITAD_DEL_VIAJE);
  return { escala: 1 + 0.22 * k, opacidad: 1 - k };
}
