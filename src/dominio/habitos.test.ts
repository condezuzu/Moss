import { describe, expect, it } from '@jest/globals';

import { enDosLineas, fuenteDeComida, metaDeComida, metaEscrita, metaParaEscribir, type MetaDeComida } from './habitos';

describe('los hábitos de comida, como los entiende también una versión anterior de Moss', () => {
  // Las metas que conocen las versiones de antes del 27/11/2026: con otra, se cerraban al dibujar su estrella.
  const CONOCIDAS = ['proteina', 'registrar', 'calorias'];
  const TODAS: MetaDeComida[] = ['proteina', 'macros', 'registrar', 'calorias'];

  it('cada una se guarda con una meta que ya conocen, y se vuelve a leer igual, también después de guardarla', () => {
    for (const meta of TODAS) {
      const fuente = fuenteDeComida(meta);
      expect(CONOCIDAS).toContain(fuente.meta);
      expect(metaDeComida(fuente)).toBe(meta);
      expect(metaDeComida(JSON.parse(JSON.stringify(fuente)))).toBe(meta);
    }
  });

  it('«Llegar a tus macros» va como la proteína: una versión anterior la enciende al llegar a la proteína', () => {
    expect(fuenteDeComida('macros')).toEqual({ tipo: 'comida', meta: 'proteina', macros: true });
    expect(fuenteDeComida('proteina')).toEqual({ tipo: 'comida', meta: 'proteina' });
  });
});

describe('el nombre de un hábito, en una línea o en dos parejas', () => {
  it('uno largo se parte en el espacio que deja las dos líneas más parecidas', () => {
    expect(enDosLineas('Quedar dentro de las calorías', 20)).toEqual(['Quedar dentro', 'de las calorías']);
    expect(enDosLineas('Registrar todas las comidas', 20)).toEqual(['Registrar todas', 'las comidas']);
    expect(enDosLineas('20 min de atención plena', 20)).toEqual(['20 min de', 'atención plena']);
    expect(enDosLineas('Stay within your calories', 20)).toEqual(['Stay within', 'your calories']);
  });

  it('entre dos cortes iguales, la primera línea es la más larga', () => {
    expect(enDosLineas('abc def ghi', 10)).toEqual(['abc def', 'ghi']);
  });

  it('el que entra en una línea queda como está, y el que no tiene espacios también', () => {
    expect(enDosLineas('Llegar a la proteína', 20)).toEqual(['Llegar a la proteína']);
    expect(enDosLineas('Llegar a tus macros', 20)).toEqual(['Llegar a tus macros']);
    expect(enDosLineas('Otorrinolaringólogo-de-guardia', 20)).toEqual(['Otorrinolaringólogo-de-guardia']);
  });

  it('si una de las dos líneas no entrara, queda entero: partido, se perdería la segunda', () => {
    const largo = 'Tomar la pastilla de la presión con el desayuno';
    expect(enDosLineas(largo, 20, 25)).toEqual(['Tomar la pastilla de la', 'presión con el desayuno']);
    expect(enDosLineas(largo, 20, 22)).toEqual([largo]);
    expect(enDosLineas(largo, 20)).toEqual([largo]);
  });

  it('cuenta letras y no pedazos: un emoji no se parte ni cuenta doble', () => {
    expect(enDosLineas('🏃 Correr 5 k', 12)).toEqual(['🏃 Correr 5 k']);
    expect(enDosLineas('🏃 Correr por la rambla', 12)).toEqual(['🏃 Correr por', 'la rambla']);
  });
});

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
