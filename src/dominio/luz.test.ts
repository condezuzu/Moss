import { describe, expect, it } from '@jest/globals';

import { LUZ_PLENA, luzDelDia, luzParaRiqueza, riquezaDe } from './luz';

const semana = (hechos: number[]) => hechos.reduce((suma, n) => suma + luzDelDia(n), 0);

describe('la luz del día', () => {
  it('vale 3 por el primer hábito y 1 por cada uno más', () => {
    expect([0, 1, 2, 7].map(luzDelDia)).toEqual([0, 3, 4, 9]);
  });

  it('suma 49 en una semana de 6, 4, 3, 7, 5, 4 y 6 hábitos', () => {
    expect(semana([6, 4, 3, 7, 5, 4, 6])).toBe(49);
  });

  it('suma 36 en una de 10, 2, 2, 2, 2, 2 y 2: gana la constancia, no los picos', () => {
    expect(semana([10, 2, 2, 2, 2, 2, 2])).toBe(36);
  });
});

describe('la riqueza del cielo', () => {
  it('pasa por los puntos de la tabla de D5', () => {
    expect(riquezaDe(0)).toBe(0);
    expect(riquezaDe(56)).toBeCloseTo(0.2, 1);
    expect(riquezaDe(200)).toBeCloseTo(0.4, 1);
    expect(riquezaDe(564)).toBeCloseTo(0.6, 2);
    expect(riquezaDe(1450)).toBeCloseTo(0.8, 2);
    expect(riquezaDe(LUZ_PLENA)).toBe(1);
  });

  it('nunca baja y no pasa de 1', () => {
    let antes = -1;
    for (let luz = 0; luz <= 5000; luz += 25) {
      const r = riquezaDe(luz);
      expect(r).toBeGreaterThanOrEqual(antes);
      antes = r;
    }
    expect(riquezaDe(1_000_000)).toBe(1);
    expect(riquezaDe(-10)).toBe(0);
  });

  it('luzParaRiqueza es la cuenta al revés', () => {
    for (const r of [0.1, 0.3, 0.6, 0.9]) expect(riquezaDe(luzParaRiqueza(r))).toBeCloseTo(r, 6);
  });
});
