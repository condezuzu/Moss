import { describe, expect, it } from '@jest/globals';

import { MAXIMO_DE_CONSEJOS, paraHoy, type EntradaDeParaHoy } from './paraHoy';

const META = { kcal: 2600, proteina: 150, carbohidratos: 325, grasas: 78 };
const dia = (cambios: Partial<EntradaDeParaHoy>): EntradaDeParaHoy => ({
  ahora: 14 * 60,
  meta: META,
  comido: { kcal: 1100, proteina: 65, carbohidratos: 140, grasas: 33 },
  sinAnotar: [],
  anotadas: 2,
  proxima: 'merienda',
  ...cambios,
});

describe('para hoy', () => {
  it('lo que falta anotar va primero; sin nada anotado, solo cuando ya pasaron dos comidas', () => {
    expect(paraHoy(dia({ sinAnotar: ['almuerzo'] }))[0]).toEqual({ tipo: 'anotar', comidas: ['almuerzo'] });
    const nada = { anotadas: 0, comido: { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 } };
    expect(paraHoy(dia({ ...nada, sinAnotar: ['desayuno', 'almuerzo'] }))).toEqual([{ tipo: 'nadaAnotado' }]);
    expect(paraHoy(dia({ ...nada, sinAnotar: ['desayuno'] }))).toEqual([]);
  });

  it('el reparto: mucha proteína y pocos carbohidratos, o al revés, con lo que conviene en la próxima comida', () => {
    const conProteina = dia({ comido: { kcal: 1100, proteina: 110, carbohidratos: 90, grasas: 30 } });
    expect(paraHoy(conProteina)).toEqual([{ tipo: 'pocosCarbohidratos', proxima: 'merienda' }]);
    const conCarbos = dia({ comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, proxima: 'cena', ahora: 18 * 60 });
    expect(paraHoy(conCarbos)).toEqual([{ tipo: 'pocaProteina', proxima: 'cena' }]);
    // Con poco comido, no se mira: cualquier comida desequilibra.
    expect(paraHoy(dia({ comido: { kcal: 500, proteina: 40, carbohidratos: 20, grasas: 15 } }))).toEqual([]);
  });

  it('muchas grasas, si pasan por mucho a los otros dos', () => {
    const grasoso = dia({ comido: { kcal: 1300, proteina: 60, carbohidratos: 120, grasas: 60 } });
    expect(paraHoy(grasoso)).toEqual([{ tipo: 'muchaGrasa', proxima: 'merienda' }]);
  });

  it('lo que falta de proteína, desde la tarde y con 25 g o más, de a 5; sin repetir lo del reparto', () => {
    expect(paraHoy(dia({ ahora: 17 * 60, proxima: 'cena' }))).toEqual([{ tipo: 'faltaProteina', gramos: 85, proxima: 'cena' }]);
    expect(paraHoy(dia({ ahora: 15 * 60 }))).toEqual([]);
    expect(paraHoy(dia({ ahora: 21 * 60, comido: { kcal: 2400, proteina: 130, carbohidratos: 300, grasas: 70 } }))).toEqual([]);
    const conCarbos = dia({ ahora: 19 * 60, comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, proxima: 'cena' });
    expect(paraHoy(conCarbos).map((x) => x.tipo)).toEqual(['pocaProteina']);
    // «Vas bien de proteína» y «te faltan 40 g de proteína» juntos se contradicen: queda el reparto.
    const conProteina = dia({ ahora: 17 * 60 + 40, comido: { kcal: 1250, proteina: 110, carbohidratos: 95, grasas: 38 }, proxima: 'cena' });
    expect(paraHoy(conProteina).map((x) => x.tipo)).toEqual(['pocosCarbohidratos']);
  });

  it('el agua, desde las tres y debajo de la mitad, en vasos', () => {
    expect(paraHoy(dia({ ahora: 16 * 60, comido: { kcal: 1500, proteina: 130, carbohidratos: 230, grasas: 45 }, agua: { ml: 750, meta: 2000 } }))).toEqual([{ tipo: 'agua', vasos: 5 }]);
    expect(paraHoy(dia({ ahora: 14 * 60, agua: { ml: 250, meta: 2000 } }))).toEqual([]);
  });

  it('con «sin déficit», solo anotar y el agua', () => {
    const e = dia({ sinDeficit: true, ahora: 18 * 60, sinAnotar: ['merienda'], comido: { kcal: 1300, proteina: 40, carbohidratos: 220, grasas: 30 }, agua: { ml: 500, meta: 2000 } });
    expect(paraHoy(e).map((x) => x.tipo)).toEqual(['anotar', 'agua']);
  });

  it(`como mucho ${MAXIMO_DE_CONSEJOS}, en orden`, () => {
    const todo = dia({ ahora: 18 * 60, sinAnotar: ['merienda'], comido: { kcal: 1400, proteina: 45, carbohidratos: 230, grasas: 66 }, agua: { ml: 500, meta: 2000 }, proxima: 'cena' });
    expect(paraHoy(todo).map((x) => x.tipo)).toEqual(['anotar', 'pocaProteina', 'muchaGrasa']);
  });
});
