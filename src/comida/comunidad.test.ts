import { describe, expect, test } from '@jest/globals';

import { cierra, codigoValido, propuestaDe } from './comunidad';

const galletitas = {
  nombre: '  Galletitas  de avena ', marca: 'Granix', codigo: '7790895643828',
  por100g: { kcal: 450, proteina: 8, carbohidratos: 65, grasas: 17, fibra: 5, sodio: 300 },
  porciones: [{ nombre: '3 galletitas', gramos: 30 }],
};

describe('la base de la comunidad, antes de mandar', () => {
  test('el dígito verificador de los códigos de barras', () => {
    expect(codigoValido('7790895643828')).toBe(true); // EAN-13
    expect(codigoValido('7790895643829')).toBe(false);
    expect(codigoValido('96385074')).toBe(true); // EAN-8
    expect(codigoValido('036000291452')).toBe(true); // UPC-A
    expect(codigoValido('12345')).toBe(false);
    expect(codigoValido('779089564382a')).toBe(false);
  });

  test('las calorías tienen que cerrar con los macros, con lugar para la fibra y el redondeo', () => {
    expect(cierra({ kcal: 450, proteina: 8, carbohidratos: 65, grasas: 17 })).toBe(true);
    expect(cierra({ kcal: 45, proteina: 8, carbohidratos: 65, grasas: 17 })).toBe(false); // un cero de menos
    expect(cierra({ kcal: 30, proteina: 0, carbohidratos: 0, grasas: 0 })).toBe(true);
  });

  test('arma la propuesta limpia, con la región y la primera porción', () => {
    expect(propuestaDe(galletitas, 'UY')).toEqual({
      codigo: '7790895643828', nombre: 'Galletitas de avena', marca: 'Granix', kcal: 450, proteina: 8, carbohidratos: 65, grasas: 17,
      fibra: 5, azucares: null, saturadas: null, sodio: 300, porcion: '3 galletitas', porcionGramos: 30, region: 'UY',
    });
    expect(propuestaDe({ ...galletitas, codigo: null, porciones: [] }, undefined)).toMatchObject({ codigo: null, porcion: null, porcionGramos: null, region: '' });
  });

  test('no manda lo que el servidor igual rechazaría', () => {
    expect(propuestaDe({ ...galletitas, nombre: '1' }, 'UY')).toBeNull();
    expect(propuestaDe({ ...galletitas, nombre: 'Compra en www.ejemplo.com' }, 'UY')).toBeNull();
    expect(propuestaDe({ ...galletitas, codigo: '7790895643829' }, 'UY')).toBeNull();
    expect(propuestaDe({ ...galletitas, por100g: { ...galletitas.por100g, kcal: 4500 } }, 'UY')).toBeNull();
    expect(propuestaDe({ ...galletitas, por100g: { ...galletitas.por100g, carbohidratos: 95 } }, 'UY')).toBeNull();
    expect(propuestaDe({ ...galletitas, por100g: { kcal: 230, proteina: 0, carbohidratos: 2, grasas: 0, alcohol: 32 } }, 'UY')).toBeNull();
  });
});
