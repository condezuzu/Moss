// La capa que agranda el cielo de cada cuadro en calidad baja (Cielo.tsx): lo de adentro se dibuja
// más chico y, al soltar la capa, Skia lo estira con un filtro. Así el shader corre en la cuarta
// parte de los píxeles y lo demás (las luces, las líneas, el musgo) se sigue sumando encima en el
// mismo lienzo, como en las otras calidades. Con el cielo en otro lienzo, atrás, las luces ya no se
// sumaban: se componían encima y cada una lo tapaba un poco (los halos salían más naranjas).

import { FilterMode, MipmapMode, Skia, type SkImageFilter, type SkPaint } from '@shopify/react-native-skia';
import { Platform } from 'react-native';

/** Lo poco de CanvasKit que hace falta en la web. */
type CanvasKitDeLaWeb = {
  ImageFilter: { MakeMatrixTransform: (matriz: number[], muestreo: { filter: unknown; mipmap: unknown }, entrada: null) => { delete: () => void } };
  Matrix: { scaled: (x: number, y: number) => number[] };
  FilterMode: { Linear: unknown };
  MipmapMode: { None: unknown };
};

/** Una pintura de capa que agranda `factor` veces lo que se dibujó en ella, desde la esquina de arriba a la izquierda. */
export function pinturaQueAgranda(factor: number): SkPaint {
  const pintura = Skia.Paint();
  if (Platform.OS !== 'web') {
    pintura.setImageFilter(Skia.ImageFilter.MakeMatrixTransform(Skia.Matrix().scale(factor, factor), FilterMode.Linear, MipmapMode.None, null));
    return pintura;
  }
  // En la web, React Native Skia no trae este filtro (tira «Not implemented on React Native Web»),
  // pero CanvasKit sí. Su pintura solo lee `ref` del filtro que recibe (JsiSkImageFilter), y se
  // queda con su propia referencia: el objeto de CanvasKit se puede borrar enseguida.
  const ck = (globalThis as unknown as { CanvasKit: CanvasKitDeLaWeb }).CanvasKit;
  const filtro = ck.ImageFilter.MakeMatrixTransform(ck.Matrix.scaled(factor, factor), { filter: ck.FilterMode.Linear, mipmap: ck.MipmapMode.None }, null);
  pintura.setImageFilter({ ref: filtro } as unknown as SkImageFilter);
  filtro.delete();
  return pintura;
}
