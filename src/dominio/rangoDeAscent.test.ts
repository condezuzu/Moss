import { describe, expect, it } from '@jest/globals';

import { cuerpoDeAscent, DESDE_RANGO, numeroDeRango, PALETAS_PLANETA, PALETAS_RANGO, planetaDeDia, PLANETAS, rachaDe } from './rangoDeAscent';

describe('el rango de Ascent, como allá', () => {
  it('cada rango empieza en su día de racha: 5, 10, 15, 20, 25 y 30 días, y el último sin techo', () => {
    expect([0, 5, 6, 15, 16, 30, 31, 50, 51, 75, 76, 105, 106, 400].map(numeroDeRango)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
  });

  it('sin un número que sirva, el rango 1', () => {
    expect(numeroDeRango(Number.NaN)).toBe(1);
    expect(numeroDeRango(-3)).toBe(1);
  });

  it('el rango 4 cambia de planeta cada cuatro días, de Ceres a Saturno; fuera del 4, ninguno', () => {
    expect([31, 34, 35, 39, 43, 47, 50].map(planetaDeDia)).toEqual(['Ceres', 'Ceres', 'Mercurio', 'Marte', 'Venus', 'Saturno', 'Saturno']);
    expect(planetaDeDia(30)).toBeNull();
    expect(planetaDeDia(51)).toBeNull();
  });

  it('la paleta es la del rango, y en el 4 la del planeta del día', () => {
    expect(cuerpoDeAscent(20)).toEqual({ rango: 3, cuerpo: 'luna', planeta: null, paleta: PALETAS_RANGO[3] });
    expect(cuerpoDeAscent(39)).toEqual({ rango: 4, cuerpo: 'planeta', planeta: 'Marte', paleta: PALETAS_PLANETA.Marte });
    expect(cuerpoDeAscent(200).cuerpo).toBe('agujeroNegro');
  });

  it('la racha de cada rango y de cada planeta vuelve al mismo rango y planeta', () => {
    DESDE_RANGO.forEach((_, i) => expect(numeroDeRango(rachaDe(i + 1))).toBe(i + 1));
    PLANETAS.forEach((p) => expect(planetaDeDia(rachaDe(4, p))).toBe(p));
  });
});
