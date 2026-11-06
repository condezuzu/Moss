// La calidad automática: arranca según el modelo, baja un escalón si el cielo no llega y lo medido
// queda guardado para el próximo arranque, solo en ese iPhone y por un tiempo.

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

let mockModelo: string | null = 'iPhone12,1';
jest.mock('expo-device', () => ({
  get modelId() {
    return mockModelo;
  },
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const CLAVE = 'moss:calidadMedida';
const DIA = 24 * 60 * 60 * 1000;

/** Un arranque de la app: el módulo de nuevo, con `guardado` en el almacenamiento, y lo guardado ya leído. */
async function arrancar(guardado?: unknown) {
  jest.resetModules();
  // El de mentira es un módulo de CommonJS sin `default`: require lo da tal cual.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const almacenamiento = require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage').default;
  if (guardado !== undefined) {
    await almacenamiento.setItem(CLAVE, typeof guardado === 'string' ? guardado : JSON.stringify(guardado));
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const calidad = require('./calidad') as typeof import('./calidad');
  await calidad.laMedidaLeida;
  return { calidad, almacenamiento };
}

beforeEach(() => {
  mockModelo = 'iPhone12,1';
});

describe('la calidad automática', () => {
  it('sin nada guardado, arranca en la de fábrica', async () => {
    const { calidad } = await arrancar();
    expect(calidad.calidadLeida()).toBe(true);
    expect(calidad.calidadAutomatica()).toBe('media');
  });

  it('lo que bajó queda guardado y el próximo arranque empieza ahí', async () => {
    const primero = await arrancar();
    const oyente = jest.fn();
    primero.calidad.oirLaAutomatica(oyente);
    primero.calidad.bajarLaAutomatica('media');
    expect(primero.calidad.calidadAutomatica()).toBe('baja');
    expect(oyente).toHaveBeenCalled();
    const guardado = await primero.almacenamiento.getItem(CLAVE);
    expect(JSON.parse(guardado ?? 'null')).toMatchObject({ calidad: 'baja', modelo: 'iPhone12,1' });

    const segundo = await arrancar(guardado);
    expect(segundo.calidad.calidadAutomatica()).toBe('baja');
  });

  it('medida con otra calidad (la elegida en Perfil), no baja la automática', async () => {
    const { calidad, almacenamiento } = await arrancar();
    calidad.bajarLaAutomatica('alta');
    expect(calidad.calidadAutomatica()).toBe('media');
    expect(await almacenamiento.getItem(CLAVE)).toBeNull();
  });

  it('no vale lo medido en otro iPhone, lo de hace más de un mes ni lo que no se entiende', async () => {
    const ahora = Date.now();
    expect((await arrancar({ calidad: 'baja', modelo: 'iPhone11,8', cuando: ahora })).calidad.calidadAutomatica()).toBe('media');
    expect((await arrancar({ calidad: 'baja', modelo: 'iPhone12,1', cuando: ahora - 31 * DIA })).calidad.calidadAutomatica()).toBe('media');
    expect((await arrancar({ calidad: 'baja', modelo: 'iPhone12,1', cuando: ahora - 29 * DIA })).calidad.calidadAutomatica()).toBe('baja');
    expect((await arrancar({ calidad: 'mínima', modelo: 'iPhone12,1', cuando: ahora })).calidad.calidadAutomatica()).toBe('media');
    expect((await arrancar('{roto')).calidad.calidadAutomatica()).toBe('media');
  });

  it('lo guardado nunca sube la de fábrica', async () => {
    mockModelo = 'iPhone11,2';
    const { calidad } = await arrancar({ calidad: 'media', modelo: 'iPhone11,2', cuando: Date.now() });
    expect(calidad.calidadAutomatica()).toBe('baja');
  });

  it('sin modelo (la web) no espera ni guarda nada', async () => {
    mockModelo = null;
    const { calidad, almacenamiento } = await arrancar();
    expect(calidad.calidadLeida()).toBe(true);
    expect(calidad.calidadAutomatica()).toBe('alta');
    calidad.bajarLaAutomatica('alta');
    expect(calidad.calidadAutomatica()).toBe('media');
    expect(await almacenamiento.getItem(CLAVE)).toBeNull();
  });
});
