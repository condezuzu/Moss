// Lo que comparten las pantallas de la comida: la comida de ahora con tus horas de comer y cómo se dice una duración.
// El almacén va de mentira. En español (es-UY).

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { comidaDeAhora, duracion } from './datos';

const mockEstado = { hoy: '2026-11-25', corte: 240, registros: new Map(), respuestas: null, horasDeComer: { cena: 19 * 60 } as Record<string, number> };
jest.mock('@/almacen', () => ({ elAlmacen: () => ({ estado: () => mockEstado }) }));
jest.mock('@/almacen/ascent', () => ({ metaConAscent: (m: unknown) => m, estadoConAscent: () => null, suscribirConAscent: () => () => {} }));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));

describe('la comida de ahora', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  const a = (h: number, m: number) => {
    jest.useFakeTimers({ now: new Date(2026, 10, 25, h, m) });
    return comidaDeAhora();
  };

  it('con la cena puesta a las 19, a las 18:50 ya es la cena; lejos de tus horas, la franja', () => {
    expect(a(18, 50)).toBe('cena');
    expect(a(16, 0)).toBe('merienda');
    expect(a(11, 0)).toBe('snack');
  });
});

describe('duracion', () => {
  it('«7 h 5 min», sin el cero adelante; «8 h» sin minutos; «45 min»', () => {
    expect(duracion(425)).toBe('7 h 5 min');
    expect(duracion(452)).toBe('7 h 32 min');
    expect(duracion(480)).toBe('8 h');
    expect(duracion(479.6)).toBe('8 h');
    expect(duracion(45)).toBe('45 min');
  });
});
