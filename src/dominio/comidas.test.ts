import { describe, expect, it } from '@jest/globals';

import { comidaDeLaHora, horasCorridas, HORA_TIPICA, minutoDeLoDicho } from './comidas';

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

  it('con el día que empieza a las 5 o a las 6 (D32), el desayuno empieza con el día: antes es snack de ayer', () => {
    const conCorte = (h: number, m: number, corte: number) => comidaDeLaHora(h * 60 + m, corte * 60);
    expect(conCorte(5, 30, 6)).toBe('snack');
    // Las 5:30 en la cuenta del día anterior, que todavía no terminó.
    expect(comidaDeLaHora(24 * 60 + 5 * 60 + 30, 6 * 60)).toBe('snack');
    expect(conCorte(6, 0, 6)).toBe('desayuno');
    expect(conCorte(4, 59, 5)).toBe('snack');
    expect(conCorte(5, 0, 5)).toBe('desayuno');
    // Lo demás no cambia con el corte.
    expect(conCorte(10, 30, 6)).toBe('snack');
    expect(conCorte(13, 0, 6)).toBe('almuerzo');
  });

  it('con el corte a las 4 o antes, el desayuno empieza a las 4', () => {
    expect(comidaDeLaHora(4 * 60, 0)).toBe('desayuno');
    expect(comidaDeLaHora(4 * 60, 2 * 60)).toBe('desayuno');
    expect(comidaDeLaHora(4 * 60, 4 * 60)).toBe('desayuno');
    expect(comidaDeLaHora(3 * 60 + 59, 4 * 60)).toBe('snack');
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

  it('para los avisos, lo que ya llegó a su hora cuando se anotó la que corre no se mueve, y nada sale de 5:00 a 23:45', () => {
    // El desayuno olvidado, anotado a las 13:20: el almuerzo ya sonó; la cena no va a las 2:20.
    expect(horasCorridas(HORA_TIPICA, { desayuno: h(13, 20) }, true)).toEqual({ desayuno: h(13, 20), almuerzo: h(13), merienda: h(22, 50), cena: h(23, 45) });
    expect(horasCorridas(HORA_TIPICA, { desayuno: h(13, 20) })).toEqual({ desayuno: h(13, 20), almuerzo: h(18, 20), merienda: h(22, 50), cena: h(26, 20) });
    // La merienda de las 17 ya sonó cuando, a las 17:10, se anota el almuerzo.
    const cuatro = { desayuno: h(8), almuerzo: h(13), merienda: h(17), cena: h(21) };
    expect(horasCorridas(cuatro, { desayuno: h(8), almuerzo: h(17, 10) }, true)).toEqual({ desayuno: h(8), almuerzo: h(17, 10), merienda: h(17), cena: h(23, 45) });
    // Lo que todavía no llegó corre como siempre, y nada antes de las 5.
    expect(horasCorridas(HORA_TIPICA, { desayuno: h(9, 30) }, true)).toEqual(horasCorridas(HORA_TIPICA, { desayuno: h(9, 30) }));
    expect(horasCorridas({ desayuno: h(10), almuerzo: h(10, 30) }, { desayuno: h(4) }, true)).toEqual({ desayuno: h(4), almuerzo: h(5) });
  });
});

describe('lo dicho con el nombre de una comida', () => {
  it('va a la hora de esa comida si ya pasó; si recién pasó o no llegó, a la de ahora', () => {
    expect(minutoDeLoDicho(8 * 60, 15 * 60)).toBe(8 * 60);
    expect(minutoDeLoDicho(13 * 60, 13 * 60 + 30)).toBeNull();
    expect(minutoDeLoDicho(21 * 60, 15 * 60)).toBeNull();
    expect(minutoDeLoDicho(undefined, 15 * 60)).toBeNull();
  });
});
