// Los enlaces de los widgets no son pantallas: se quedan en las secciones, que los leen (Secciones.tsx).
// Sin esto, moss://habitos daría «no se encontró» en Expo Router.

import { leerEnlace } from '@/secciones/enlaces';

export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    return leerEnlace(path) ? '/' : path;
  } catch {
    return path;
  }
}
