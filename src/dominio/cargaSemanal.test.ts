import { describe, expect, it } from '@jest/globals';

import { cargaDeLaSemana, estadoDeCarga, lineaDeLaSemana } from './cargaSemanal';
import type { Musculo } from './musculos';

const hechas = (x: Partial<Record<Musculo, number>>) => new Map(Object.entries(x) as [Musculo, number][]);

describe('estadoDeCarga', () => {
  it('va de poco a mucho', () => {
    expect(estadoDeCarga(4, 3)).toBe('poco');
    expect(estadoDeCarga(4, 6)).toBe('enCamino');
    expect(estadoDeCarga(10, 0)).toBe('enRango');
    expect(estadoDeCarga(20, 0)).toBe('enRango');
    expect(estadoDeCarga(21, 0)).toBe('mucho');
  });
});

describe('cargaDeLaSemana', () => {
  it('suma lo previsto de los días que quedan y deja afuera lo que no se toca', () => {
    const c = cargaDeLaSemana(hechas({ pecho: 6 }), [{ dia: 4, series: { pecho: 4, espaldaAlta: 8 } }]);
    expect(c).toEqual([
      { musculo: 'pecho', hechas: 6, previstas: 4, estado: 'enCamino' },
      { musculo: 'espaldaAlta', hechas: 0, previstas: 8, estado: 'poco' },
    ]);
  });
});

describe('lineaDeLaSemana', () => {
  it('antes de entrenar, a qué darle más hoy', () => {
    const quedan = [{ dia: 3 as const, series: { espaldaAlta: 4, biceps: 3 } }];
    const carga = cargaDeLaSemana(hechas({ espaldaAlta: 4, biceps: 8, pecho: 12 }), quedan);
    expect(lineaDeLaSemana({ carga, deHoy: ['espaldaAlta', 'biceps'], hoy: 3, quedan })).toEqual({
      que: 'dale', musculos: [{ musculo: 'espaldaAlta', hechas: 4 }, { musculo: 'biceps', hechas: 8 }],
    });
  });

  it('lo corto que vuelve otro día de la semana se retoma ese día', () => {
    const quedan = [{ dia: 4 as const, series: { pecho: 3 } }];
    const carga = cargaDeLaSemana(hechas({ pecho: 4, cuadriceps: 12 }), quedan);
    expect(lineaDeLaSemana({ carga, deHoy: null, hoy: 2, quedan })).toEqual({ que: 'retomar', musculo: 'pecho', dia: 4 });
  });

  it('lo corto que no vuelve, la semana que viene', () => {
    const carga = cargaDeLaSemana(hechas({ pecho: 4 }), []);
    expect(lineaDeLaSemana({ carga, deHoy: null, hoy: 5, quedan: [] })).toEqual({ que: 'proxima', musculo: 'pecho' });
  });

  it('el domingo cuenta como el último día', () => {
    const quedan = [{ dia: 0 as const, series: { pecho: 3 } }];
    const carga = cargaDeLaSemana(hechas({ pecho: 4 }), quedan);
    expect(lineaDeLaSemana({ carga, deHoy: null, hoy: 6, quedan })).toEqual({ que: 'retomar', musculo: 'pecho', dia: 0 });
  });

  it('lo que pasó de 20, y si no, en rango', () => {
    expect(lineaDeLaSemana({ carga: cargaDeLaSemana(hechas({ hombros: 22, pecho: 12 }), []), deHoy: null, hoy: 3, quedan: [] })).toEqual({ que: 'mucho', musculo: 'hombros' });
    expect(lineaDeLaSemana({ carga: cargaDeLaSemana(hechas({ pecho: 12 }), []), deHoy: null, hoy: 3, quedan: [] })).toEqual({ que: 'enRango' });
  });
});
