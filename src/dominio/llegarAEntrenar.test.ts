import { describe, expect, it } from '@jest/globals';

import { queEsperar } from './llegarAEntrenar';

const a = (momento: number, carbohidratos: number, proteina: number, grasas: number) => ({ momento, carbohidratos, proteina, grasas });

describe('queEsperar', () => {
  it('bien comido', () => {
    expect(queEsperar({ comido: [a(8 * 60, 60, 30, 10), a(13 * 60, 80, 40, 15)], inicio: 16 * 60, pesoKg: 75 })).toEqual(['bien']);
  });

  it('sin nada anotado, ayunas', () => {
    expect(queEsperar({ comido: [], inicio: 18 * 60, pesoKg: 75 })).toEqual(['ayunas']);
  });

  it('muchas horas sin comer y pocos carbohidratos, en ese orden', () => {
    expect(queEsperar({ comido: [a(9 * 60, 30, 40, 10)], inicio: 18 * 60, pesoKg: 75 })).toEqual(['ayunas', 'pocosCarbohidratos']);
  });

  it('grasa en las 2 horas antes', () => {
    expect(queEsperar({ comido: [a(8 * 60, 60, 30, 5), a(16 * 60, 40, 20, 25)], inicio: 17 * 60, pesoKg: 75 })).toEqual(['grasaCerca']);
  });

  it('lo de después de la sesión no cuenta', () => {
    expect(queEsperar({ comido: [a(8 * 60, 90, 40, 5), a(19 * 60, 40, 20, 40)], inicio: 11 * 60, pesoKg: 75 })).toEqual(['bien']);
  });

  it('poca proteína, como mucho dos cosas', () => {
    expect(queEsperar({ comido: [a(12 * 60, 30, 10, 30)], inicio: 13 * 60, pesoKg: 80 })).toEqual(['pocosCarbohidratos', 'grasaCerca']);
    expect(queEsperar({ comido: [a(12 * 60, 100, 10, 5)], inicio: 13 * 60, pesoKg: 80 })).toEqual(['pocaProteina']);
  });
});
