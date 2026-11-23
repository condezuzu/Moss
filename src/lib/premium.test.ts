// La suscripción en el teléfono (spec/suscripcion.md), con Apple de mentira: sin conexión nadie queda afuera,
// tampoco al volver a Moss después de que renovó.

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Suscripcion } from '@/dominio/premium';
import type { Producto } from './premium';

const HORA = 3_600_000;
const MENSUAL = 'uy.moss.suscripcion.mensual';
const ANUAL = 'uy.moss.suscripcion.anual';
const PRODUCTOS: Producto[] = [
  { id: MENSUAL, precio: 'USD 9,99', porMes: 'USD 9,99', valor: 9.99, prueba: 0 },
  { id: ANUAL, precio: 'USD 39,99', porMes: 'USD 3,33', valor: 39.99, prueba: 0 },
];
const mockTienda = {
  productos: jest.fn<(ids: string[]) => Promise<Producto[]>>(),
  estado: jest.fn<() => Promise<Suscripcion | null>>(),
  ultima: jest.fn<(ids: string[]) => Promise<Suscripcion | null>>(),
  comprar: jest.fn(),
  restaurar: jest.fn(),
  addListener: jest.fn(() => ({ remove() {} })),
};
let mockAlVolver: ((a: string) => void) | undefined;

jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockTienda }));
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, oyente: (a: string) => void) => {
      mockAlVolver = oyente;
      return { remove() {} };
    },
  },
  Linking: { openURL: async () => {} },
  Platform: { OS: 'ios' },
}));
jest.mock('@/lib/banderas', () => ({ CON_PREMIUM: true, PREMIUM_SALE: '2026-11-14' }));
jest.mock('@/textos', () => ({ idioma: () => 'es' }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const MANANA = new Date(2026, 11, 10, 9).getTime();
const mensualHasta = (vence: number): Suscripcion => ({ producto: MENSUAL, vence, prueba: false, renueva: true });
const nunca = () => new Promise<never>(() => {});

/** A la mañana, con conexión: la mensual vence a las 14 y los precios llegan. */
async function abrirALaManana() {
  jest.setSystemTime(MANANA);
  const s = mensualHasta(MANANA + 5 * HORA);
  mockTienda.estado.mockResolvedValue(s);
  mockTienda.ultima.mockResolvedValue(s);
  mockTienda.productos.mockResolvedValue(PRODUCTOS);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const premium = require('./premium') as typeof import('./premium');
  await premium.arrancarPremium(async () => null);
  expect(premium.accesoActual()).toBe('activa');
  return { premium, vencio: s };
}

describe('al volver a Moss', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    mockAlVolver = undefined;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sin conexión, quien renovó con Moss cerrada sigue adentro, y no ve la pantalla de pago ni un instante', async () => {
    const { premium, vencio } = await abrirALaManana();
    // A las 15, sin conexión: Apple no sabe que renovó y los precios no llegan.
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('activa');
    await jest.advanceTimersByTimeAsync(5000);
    expect(premium.accesoActual()).toBe('activa');
    expect(premium.suscripcionActual()).toBeNull();
  });

  it('con conexión, la que venció sin renovar queda vencida', async () => {
    const { premium, vencio } = await abrirALaManana();
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('vencida');
  });

  it('con una vigente no espera a los precios', async () => {
    const { premium } = await abrirALaManana();
    const renovada = mensualHasta(MANANA + 30 * 24 * HORA);
    mockTienda.estado.mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValue(renovada);
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.suscripcionActual()).toEqual(renovada);
  });
});
