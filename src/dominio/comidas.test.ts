import { describe, expect, it } from '@jest/globals';

import { comidaDeLaHora, horasCorridas, HORA_TIPICA } from './comidas';

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

describe('horasCorridas: lo que falta corre con la última que comiste', () => {
  const h = (hh: number, m = 0) => hh * 60 + m;

  it('desayunar hora y media tarde corre el almuerzo, la merienda y la cena lo mismo', () => {
    expect(horasCorridas(HORA_TIPICA, { desayuno: h(9, 30) })).toEqual({ desayuno: h(9, 30), almuerzo: h(14, 30), merienda: h(19), cena: h(22, 30) });
  });

  it('almorzar temprano adelanta lo que sigue; lo de antes queda donde estaba', () => {
    expect(horasCorridas(HORA_TIPICA, { desayuno: h(8, 20), almuerzo: h(12) })).toEqual({ desayuno: h(8, 20), almuerzo: h(12), merienda: h(16, 30), cena: h(20) });
  });

  it('sin nada anotado, las de siempre; lo que no tiene hora de siempre no corre', () => {
    expect(horasCorridas(HORA_TIPICA, {})).toEqual(HORA_TIPICA);
    expect(horasCorridas({ almuerzo: h(13), cena: h(21) }, { desayuno: h(9) })).toEqual({ desayuno: h(9), almuerzo: h(13), cena: h(21) });
    expect(horasCorridas({ desayuno: h(8), almuerzo: h(13), cena: h(21) }, { desayuno: h(9), snack: h(11) })).toEqual({ desayuno: h(9), almuerzo: h(14), cena: h(22), snack: h(11) });
  });
});
