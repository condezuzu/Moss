// Lo que dice la estrella de un hábito de comida al tocarla, y VoiceOver: las calorías, según el objetivo. En español.

import { describe, expect, it, jest } from '@jest/globals';

import { seEnciendeCon } from './textosDelCielo';

jest.mock('@/almacen', () => ({ elAlmacen: () => ({ estado: () => ({}) }) }));
jest.mock('@/almacen/ascent', () => ({ metaConAscent: (m: unknown) => m, estadoConAscent: () => null, suscribirConAscent: () => () => {} }));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));

describe('lo que enciende la estrella de un hábito de comida', () => {
  it('las calorías dicen la regla de tu objetivo: bajando, sin pasarte; subiendo, sin quedarte corto', () => {
    expect(seEnciendeCon('calorias', 'bajar')).toBe('Se enciende sola cuando quedas en tus calorías o hasta un 10 % por debajo');
    expect(seEnciendeCon('calorias', 'mantener')).toBe('Se enciende sola cuando quedas en tus calorías o hasta un 10 % por encima o por debajo');
    expect(seEnciendeCon('calorias', 'subir')).toBe('Se enciende sola cuando quedas en tus calorías o hasta un 10 % por encima');
  });

  it('lo demás no depende del objetivo', () => {
    expect(seEnciendeCon('macros', 'bajar')).toBe('Se enciende sola cuando llegas a tus macros');
    expect(seEnciendeCon('proteina', 'subir')).toBe('Se enciende sola cuando llegas a tu proteína');
    expect(seEnciendeCon(undefined, 'mantener')).toBe('Se enciende sola cuando anotas todas tus comidas');
  });
});
