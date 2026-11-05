import { describe, expect, it } from '@jest/globals';

import { destacados, escalarMicros, microsValidos, parteDelDia, referenciaDe, requerimientoDe, sumarMicros } from './micronutrientes';
import { escalar, sumarValores, type Valores } from './registros';

const ELLA = { sexo: 'f' as const, edad: 29 };
const EL = { sexo: 'm' as const, edad: 29 };

describe('las referencias del día', () => {
  it('cambian con el sexo y la edad, como las de las Academias', () => {
    expect(referenciaDe('hierro', ELLA)).toEqual({ meta: 18 });
    expect(referenciaDe('hierro', EL)).toEqual({ meta: 8 });
    expect(referenciaDe('hierro', { ...ELLA, edad: 55 })).toEqual({ meta: 8 });
    expect(referenciaDe('calcio', { ...ELLA, edad: 60 })).toEqual({ meta: 1200 });
    expect(referenciaDe('calcio', { ...EL, edad: 60 })).toEqual({ meta: 1000 });
    expect(referenciaDe('magnesio', EL)).toEqual({ meta: 400 });
    expect(referenciaDe('magnesio', { ...EL, edad: 40 })).toEqual({ meta: 420 });
    expect(referenciaDe('vitaminaD', { ...EL, edad: 75 })).toEqual({ meta: 20 });
  });

  it('en el embarazo y la lactancia cambian; en un hombre, la etapa no cuenta', () => {
    expect(referenciaDe('hierro', { ...ELLA, etapa: 'embarazo' })).toEqual({ meta: 27 });
    expect(referenciaDe('folato', { ...ELLA, etapa: 'lactancia' })).toEqual({ meta: 500 });
    expect(referenciaDe('magnesio', { ...ELLA, etapa: 'embarazo' })).toEqual({ meta: 350 });
    expect(referenciaDe('calcio', { ...ELLA, etapa: 'embarazo' })).toEqual({ meta: 1000 });
    expect(referenciaDe('hierro', { ...EL, etapa: 'embarazo' })).toEqual({ meta: 8 });
  });

  it('la cafeína es un tope, más bajo en el embarazo; las grasas y el colesterol no tienen una referencia sola', () => {
    expect(referenciaDe('cafeina', EL)).toEqual({ tope: 400 });
    expect(referenciaDe('cafeina', { ...ELLA, etapa: 'embarazo' })).toEqual({ tope: 200 });
    expect(referenciaDe('colesterol', EL)).toBeNull();
    expect(referenciaDe('monoinsaturadas', EL)).toBeNull();
  });

  it('de 14 a 18 años, las suyas: más calcio y fósforo; desde los 19, las de adultos', () => {
    expect(referenciaDe('calcio', { sexo: 'f', edad: 17 })).toEqual({ meta: 1300 });
    expect(referenciaDe('calcio', { sexo: 'f', edad: 18 })).toEqual({ meta: 1300 });
    expect(referenciaDe('calcio', { sexo: 'f', edad: 19 })).toEqual({ meta: 1000 });
    expect(referenciaDe('fosforo', { sexo: 'm', edad: 16 })).toEqual({ meta: 1250 });
    expect(referenciaDe('hierro', { sexo: 'f', edad: 16 })).toEqual({ meta: 15 });
    expect(referenciaDe('hierro', { sexo: 'm', edad: 16 })).toEqual({ meta: 11 });
    expect(referenciaDe('potasio', { sexo: 'f', edad: 17 })).toEqual({ meta: 2300 });
    expect(referenciaDe('vitaminaK', { sexo: 'm', edad: 17 })).toEqual({ meta: 75 });
  });

  it('la cafeína antes de los 18: 3 mg por kilo; sin el peso, no hay un tope que sirva', () => {
    expect(referenciaDe('cafeina', { sexo: 'm', edad: 17, pesoKg: 60 })).toEqual({ tope: 180 });
    expect(referenciaDe('cafeina', { sexo: 'm', edad: 17 })).toBeNull();
    expect(referenciaDe('cafeina', { sexo: 'm', edad: 18, pesoKg: 60 })).toEqual({ tope: 400 });
    expect(referenciaDe('cafeina', { sexo: 'f', edad: 17, pesoKg: 50, etapa: 'embarazo' })).toEqual({ tope: 150 });
  });

  it('el requerimiento promedio del hierro (EAR), para decir que viene bajo', () => {
    expect(requerimientoDe('hierro', ELLA)).toBe(8.1);
    expect(requerimientoDe('hierro', EL)).toBe(6);
    expect(requerimientoDe('hierro', { ...ELLA, edad: 55 })).toBe(5);
    expect(requerimientoDe('hierro', { ...ELLA, edad: 17 })).toBe(7.9);
    expect(requerimientoDe('hierro', { ...ELLA, etapa: 'embarazo' })).toBe(22);
    expect(requerimientoDe('calcio', ELLA)).toBeNull();
  });

  it('la parte del día: 9 mg de hierro son la mitad para ella y más que todo para él', () => {
    expect(parteDelDia('hierro', 9, ELLA)).toBeCloseTo(0.5, 6);
    expect(parteDelDia('hierro', 9, EL)).toBeCloseTo(1.125, 6);
    expect(parteDelDia('trans', 1, EL)).toBeNull();
  });
});

describe('lo que vale la pena ver', () => {
  it('lo que aporta al menos un 10 %, de más a menos, y la cafeína siempre que haya', () => {
    const espinaca = { vitaminaK: 483, folato: 194, hierro: 2.7, calcio: 99, vitaminaC: 28, potasio: 558, sodio: 79, cafeina: 0 };
    const lista = destacados(espinaca, ELLA).map((d) => d.micro);
    expect(lista[0]).toBe('vitaminaK');
    expect(lista).toEqual(expect.arrayContaining(['folato', 'hierro', 'vitaminaC', 'potasio']));
    expect(lista).not.toContain('calcio');
    expect(lista).not.toContain('cafeina');
    expect(destacados({ cafeina: 40 }, EL)).toEqual([{ micro: 'cafeina', cantidad: 40, parte: 0.1 }]);
    expect(destacados({ cafeina: 10 }, EL).map((d) => d.micro)).toEqual(['cafeina']);
  });
});

describe('las cuentas', () => {
  it('escalar y sumar: lo que no dice un alimento cuenta como cero, y lo que no dice ninguno no está', () => {
    expect(escalarMicros({ calcio: 120, hierro: 0.5 }, 2)).toEqual({ calcio: 240, hierro: 1 });
    expect(sumarMicros([{ calcio: 120 }, undefined, { calcio: 30, hierro: 2 }])).toEqual({ calcio: 150, hierro: 2 });
    expect(sumarMicros([])).toEqual({});
  });

  it('van con los valores de cada registro: se escalan y se suman con todo lo demás', () => {
    const leche: Valores = { kcal: 61, proteina: 3.2, carbohidratos: 4.8, grasas: 3.3, micros: { calcio: 123, vitaminaD: 1.1 } };
    const pan: Valores = { kcal: 265, proteina: 9, carbohidratos: 49, grasas: 3.2 };
    const vaso = escalar(leche, 2);
    expect(vaso.micros).toEqual({ calcio: 246, vitaminaD: 2.2 });
    expect(sumarValores([vaso, pan]).micros).toEqual({ calcio: 246, vitaminaD: 2.2 });
    expect('micros' in sumarValores([pan, pan])).toBe(false);
  });

  it('lo que llega de afuera se limpia: solo lo conocido y posible', () => {
    expect(microsValidos({ calcio: 120, hierro: -1, plutonio: 3, vitaminaC: 'mucha', zinc: Infinity })).toEqual({ calcio: 120 });
    expect(microsValidos({ hierro: -1 })).toBeUndefined();
    expect(microsValidos(null)).toBeUndefined();
  });
});
