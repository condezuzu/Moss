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

  it('sin meta no hay barra', () => {
    const { barras } = comoDejaElDia(DIA, { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, { ...META, proteina: 0 });
    expect(barras.proteina).toEqual({ antes: 0, despues: 0 });
  });
});
