import { describe, expect, it } from '@jest/globals';

import { comoDejaElDia } from './dejaElDia';

const META = { kcal: 2600, proteina: 150, carbohidratos: 320, grasas: 80 };
const DIA = { kcal: 1500, proteina: 90, carbohidratos: 180, grasas: 45 };

describe('cómo deja el día', () => {
  it('cada macro antes y después, como parte de su meta', () => {
    const { barras } = comoDejaElDia(DIA, { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, META);
    expect(barras.proteina.antes).toBeCloseTo(0.6, 6);
    expect(barras.proteina.despues).toBeCloseTo(0.8067, 3);
    expect(barras.carbohidratos.despues).toBeCloseTo(barras.carbohidratos.antes, 6);
  });

  it('una frase con lo que más cambia, y la proteína primero', () => {
    expect(comoDejaElDia(DIA, { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, META).frase).toEqual({ tipo: 'llegas', macro: 'proteina', porcentaje: 81 });
    // Una porción de arroz: lo que sube son los carbohidratos.
    expect(comoDejaElDia(DIA, { kcal: 195, proteina: 4, carbohidratos: 42, grasas: 0.4 }, META).frase).toEqual({ tipo: 'llegas', macro: 'carbohidratos', porcentaje: 69 });
  });

  it('si completa un macro, lo dice; si pasa la meta por mucho, también, como un dato', () => {
    const casi = { ...DIA, proteina: 140 };
    expect(comoDejaElDia(casi, { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, META).frase).toEqual({ tipo: 'completas', macro: 'proteina' });
    const lleno = { ...DIA, grasas: 78 };
    expect(comoDejaElDia(lleno, { kcal: 300, proteina: 2, carbohidratos: 30, grasas: 20 }, META).frase).toEqual({ tipo: 'pasas', macro: 'grasas', gramos: 18 });
  });

  it('lo que casi no cambia nada no lleva frase, y sin meta no hay barra', () => {
    expect(comoDejaElDia(DIA, { kcal: 2, proteina: 0.3, carbohidratos: 0, grasas: 0 }, META).frase).toBeNull();
    const { barras, frase } = comoDejaElDia(DIA, { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, { ...META, proteina: 0 });
    expect(barras.proteina).toEqual({ antes: 0, despues: 0 });
    expect(frase).toBeNull();
  });

  it('lo que ya estaba pasado no se vuelve a decir', () => {
    const pasado = { ...DIA, carbohidratos: 400 };
    expect(comoDejaElDia(pasado, { kcal: 195, proteina: 4, carbohidratos: 42, grasas: 0.4 }, META).frase).toBeNull();
  });
});
