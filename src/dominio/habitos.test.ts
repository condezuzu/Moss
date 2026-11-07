import { describe, expect, it } from '@jest/globals';

import { metaEscrita, metaParaEscribir } from './habitos';

describe('la meta propia de un hábito de Salud, escrita', () => {
  it('va en el campo sin separar los miles', () => {
    expect(metaParaEscribir(9000, 'es')).toBe('9000');
    expect(metaParaEscribir(12000, 'en')).toBe('12000');
  });

  it('las horas y los litros, con el decimal del idioma', () => {
    expect(metaParaEscribir(7.5, 'es')).toBe('7,5');
    expect(metaParaEscribir(2.25, 'en')).toBe('2.25');
    expect(metaParaEscribir(1 / 3, 'es')).toBe('0,33');
  });

  it('con el teclado de dígitos solo cuentan los dígitos: un punto o una coma separan miles', () => {
    expect(metaEscrita('9500', 'es', true)).toBe(9500);
    // Antes, «9.500» se leía 9,5: la meta quedaba en 10 pasos.
    expect(metaEscrita('9.500', 'es', true)).toBe(9500);
    expect(metaEscrita('9,500', 'en', true)).toBe(9500);
    expect(metaEscrita(' 12 000 ', 'es', true)).toBe(12000);
    expect(metaEscrita('', 'es', true)).toBeNull();
    expect(metaEscrita('pasos', 'es', true)).toBeNull();
  });

  it('con decimales, vale la coma o el punto del teclado, en los dos idiomas', () => {
    expect(metaEscrita('7,5', 'es', false)).toBe(7.5);
    expect(metaEscrita('7.5', 'es', false)).toBe(7.5);
    expect(metaEscrita('2,5', 'en', false)).toBe(2.5);
    expect(metaEscrita('2.5', 'en', false)).toBe(2.5);
    expect(metaEscrita(',5', 'es', false)).toBe(0.5);
    expect(metaEscrita('2,', 'es', false)).toBe(2);
  });

  it('el separador de miles del idioma se saca solo donde separa miles', () => {
    expect(metaEscrita('1.500', 'es', false)).toBe(1500);
    expect(metaEscrita('1,500', 'en', false)).toBe(1500);
    expect(metaEscrita('1.500,5', 'es', false)).toBe(1500.5);
    expect(metaEscrita('1,500.5', 'en', false)).toBe(1500.5);
    expect(metaEscrita('1,500', 'es', false)).toBe(1.5);
    expect(metaEscrita('1.50', 'es', false)).toBe(1.5);
  });

  it('lo que no es un número no se lee', () => {
    expect(metaEscrita('2,5,5', 'es', false)).toBeNull();
    expect(metaEscrita('.', 'es', false)).toBeNull();
    expect(metaEscrita('-2', 'es', false)).toBeNull();
    expect(metaEscrita('', 'en', false)).toBeNull();
  });

  it('lo que pone Moss en el campo se vuelve a leer igual', () => {
    for (const idioma of ['es', 'en'] as const) {
      for (const n of [9000, 12000, 25]) expect(metaEscrita(metaParaEscribir(n, idioma), idioma, true)).toBe(n);
      for (const n of [7.5, 2.25, 8, 1.5]) expect(metaEscrita(metaParaEscribir(n, idioma), idioma, false)).toBe(n);
    }
  });
});
