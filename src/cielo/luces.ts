// Las luces de los dos Atlas, en el hilo de la interfaz. Los objetos de Skia se arman una vez y en
// cada cuadro se toca solo lo que cambió de cada luz. Al Atlas le llegan las luces que hay, con un
// largo que crece de a tramos y no se achica: con la capacidad entera, cada cuadro dibujaba cientos de
// luces vacías; con el largo exacto, que cambia cuadro a cuadro, Skia podía leer los tres arreglos
// con largos distintos al volver a grabar el lienzo (AtlasCmd::draw), y eso cierra la app.

import { Skia, type SkColor, type SkHostRect, type SkRSXform } from '@shopify/react-native-skia';

import { DATOS_POR_SPRITE } from './escena';

/** El lado de cada celda de la hoja de sprites, en píxeles. */
export const CELDA = 128;

export type Luces = { rects: SkHostRect[]; formas: SkRSXform[]; colores: SkColor[] };

/** Los objetos de Skia de un Atlas, lo último que se le puso a cada luz (celda y forma), cuántas hubo y el largo que se pasa. */
export type Reserva = Luces & { ultimo: Float64Array; n: number; largo: number };

const POR_LUZ = 5;
/** De a cuánto crece lo que se le pasa al Atlas. */
const TRAMO = 64;

export function crearReserva(capacidad: number): Reserva {
  'worklet';
  const rects: SkHostRect[] = [];
  const formas: SkRSXform[] = [];
  const colores: SkColor[] = [];
  for (let i = 0; i < capacidad; i++) {
    rects.push(Skia.XYWHRect(0, 0, CELDA, CELDA));
    formas.push(Skia.RSXform(1, 0, 0, 0));
    colores.push(new Float32Array(4));
  }
  // NaN no es igual a nada: la primera vez se escribe todo.
  return { rects, formas, colores, ultimo: new Float64Array(capacidad * POR_LUZ).fill(NaN), n: 0, largo: 0 };
}

/** Pasa las n luces del cuadro, como las deja escena.ts, a los objetos de Skia. */
export function volcarLuces(r: Reserva, datos: Float32Array, n: number): Luces {
  'worklet';
  const m = CELDA / 2;
  for (let i = 0; i < n; i++) {
    const o = i * DATOS_POR_SPRITE;
    const u = i * POR_LUZ;
    const celda = datos[o + 4];
    if (r.ultimo[u] !== celda) {
      r.ultimo[u] = celda;
      r.rects[i].setXYWH(celda * CELDA, 0, CELDA, CELDA);
    }
    const escala = (2 * datos[o + 2]) / CELDA;
    const c = Math.cos(datos[o + 3]) * escala;
    const s = Math.sin(datos[o + 3]) * escala;
    const tx = datos[o] - (c * m - s * m);
    const ty = datos[o + 1] - (s * m + c * m);
    // Cada cambio es una llamada a Skia: las luces quietas no se tocan.
    if (r.ultimo[u + 1] !== c || r.ultimo[u + 2] !== s || r.ultimo[u + 3] !== tx || r.ultimo[u + 4] !== ty) {
      r.ultimo[u + 1] = c;
      r.ultimo[u + 2] = s;
      r.ultimo[u + 3] = tx;
      r.ultimo[u + 4] = ty;
      r.formas[i].set(c, s, tx, ty);
    }
    const k = Math.min(1, datos[o + 8]);
    const color = r.colores[i];
    color[0] = datos[o + 5] * k;
    color[1] = datos[o + 6] * k;
    color[2] = datos[o + 7] * k;
    color[3] = 1;
  }
  // Las que dejaron de usarse quedan transparentes hasta que vuelvan.
  for (let i = n; i < r.n; i++) {
    const color = r.colores[i];
    color[0] = 0;
    color[1] = 0;
    color[2] = 0;
    color[3] = 0;
  }
  r.n = n;
  r.largo = Math.min(r.rects.length, Math.max(r.largo, Math.ceil(n / TRAMO) * TRAMO));
  return { rects: r.rects.slice(0, r.largo), formas: r.formas.slice(0, r.largo), colores: r.colores.slice(0, r.largo) };
}
