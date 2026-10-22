import { describe, expect, it } from '@jest/globals';

import { comidaDeLaHora } from './comidas';

const a = (h: number, m = 0) => comidaDeLaHora(h * 60 + m);

describe('comidaDeLaHora', () => {
  it('elige la comida de cada franja', () => {
    expect(a(8, 10)).toBe('desayuno');
    expect(a(11)).toBe('snack');
    expect(a(13, 5)).toBe('almuerzo');
    expect(a(17, 30)).toBe('merienda');
    expect(a(21, 47)).toBe('cena');
  });

  it('cambia justo en el borde de cada franja', () => {
    expect(a(3, 59)).toBe('snack');
    expect(a(4)).toBe('desayuno');
    expect(a(10, 29)).toBe('desayuno');
    expect(a(10, 30)).toBe('snack');
    expect(a(12)).toBe('almuerzo');
    expect(a(15, 29)).toBe('almuerzo');
    expect(a(15, 30)).toBe('merienda');
    expect(a(19, 29)).toBe('merienda');
    expect(a(19, 30)).toBe('cena');
  });

  it('la cena sigue hasta la medianoche y de madrugada es snack', () => {
    expect(a(23, 59)).toBe('cena');
    expect(a(0)).toBe('snack');
    expect(a(2, 15)).toBe('snack');
  });
});
