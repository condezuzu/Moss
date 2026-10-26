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

// La automática es una sola para toda la app (el cielo, la luna): la que dice el modelo, y un
// escalón menos cada vez que el cielo avisa que no llega.
let automatica: Calidad | null = null;
const oyentes = new Set<() => void>();

export function calidadAutomatica(): Calidad {
  automatica ??= calidadDeFabrica();
  return automatica;
}

export function bajarLaAutomatica() {
  const nueva = unEscalonMenos(calidadAutomatica());
  if (nueva === automatica) return;
  automatica = nueva;
  oyentes.forEach((o) => o());
}

export function oirLaAutomatica(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function unEscalonMenos(c: Calidad): Calidad {
  return ORDEN[Math.min(ORDEN.indexOf(c) + 1, ORDEN.length - 1)];
}

export function siguiente(c: Calidad): Calidad {
  return ORDEN[(ORDEN.indexOf(c) + 1) % ORDEN.length];
}
