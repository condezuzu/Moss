import * as Device from 'expo-device';

import type { Calidad } from './mundo';

const ORDEN: Calidad[] = ['alta', 'media', 'baja'];

/**
 * El valor de fábrica sale del modelo. iPhone13,x es el iPhone 12 (A14): de ahí en adelante, alta.
 * iPhone12,x es la serie 11 y el SE de 2020 (A13): media. Lo anterior, baja. Sin modelo (web o
 * simulador), alta. Después, la escena mide los primeros segundos y baja un escalón si hace falta.
 */
export function calidadDeFabrica(): Calidad {
  const modelo = /^iPhone(\d+),/.exec(Device.modelId ?? '');
  if (!modelo) return 'alta';
  const generacion = Number(modelo[1]);
  if (generacion >= 13) return 'alta';
  if (generacion === 12) return 'media';
  return 'baja';
}

export function unEscalonMenos(c: Calidad): Calidad {
  return ORDEN[Math.min(ORDEN.indexOf(c) + 1, ORDEN.length - 1)];
}

export function siguiente(c: Calidad): Calidad {
  return ORDEN[(ORDEN.indexOf(c) + 1) % ORDEN.length];
}
