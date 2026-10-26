import { describe, expect, it } from '@jest/globals';

import { cantidadDePorcion, conUnaUnidad, decimal, numeroDePorcion, pluralDePorcion, singularDePorcion } from './porciones';

describe('singularDePorcion', () => {
  it('en español, hasta la preposición', () => {
    expect(singularDePorcion('galletas', 'es')).toBe('galleta');
    expect(singularDePorcion('unidades', 'es')).toBe('unidad');
    expect(singularDePorcion('rebanadas de pan', 'es')).toBe('rebanada de pan');
    expect(singularDePorcion('galletas rellenas', 'es')).toBe('galleta rellena');
    expect(singularDePorcion('porciones', 'es')).toBe('porción');
    expect(singularDePorcion('nueces', 'es')).toBe('nuez');
    expect(singularDePorcion('panes', 'es')).toBe('pan');
    expect(singularDePorcion('filetes', 'es')).toBe('filete');
    expect(singularDePorcion('piezas grandes', 'es')).toBe('pieza grande');
    expect(singularDePorcion('dulces', 'es')).toBe('dulce');
    expect(singularDePorcion('crackers', 'es')).toBe('cracker');
  });

  it('en inglés, la última palabra', () => {
    expect(singularDePorcion('cookies', 'en')).toBe('cookie');
    expect(singularDePorcion('crackers', 'en')).toBe('cracker');
    expect(singularDePorcion('medium slices', 'en')).toBe('medium slice');
    expect(singularDePorcion('berries', 'en')).toBe('berry');
    expect(singularDePorcion('sandwiches', 'en')).toBe('sandwich');
    expect(singularDePorcion('tbsp', 'en')).toBe('tbsp');
  });
});

describe('conUnaUnidad', () => {
  it('suma la de una sola unidad adelante de la del paquete', () => {
    expect(conUnaUnidad([{ nombre: '7 galletas', gramos: 31 }], 'es')).toEqual([
      { nombre: '1 galleta', gramos: 4.4, deUna: true },
      { nombre: '7 galletas', gramos: 31 },
    ]);
    expect(conUnaUnidad([{ nombre: '7 crackers', gramos: 30 }], 'en')[0]).toEqual({ nombre: '1 cracker', gramos: 4.3, deUna: true });
  });

  it('no repite la que ya está ni toca lo que se cuenta en gramos', () => {
    const conLaDeUna = [{ nombre: '4 unidades', gramos: 28 }, { nombre: '1 unidad', gramos: 7 }];
    expect(conUnaUnidad(conLaDeUna, 'es')).toEqual(conLaDeUna);
    expect(conUnaUnidad([{ nombre: '30 g', gramos: 30 }, { nombre: '1 taza', gramos: 240 }], 'es')).toHaveLength(2);
    expect(conUnaUnidad([{ nombre: '2 oz', gramos: 57 }], 'en')).toHaveLength(1);
  });
});

describe('numeroDePorcion', () => {
  it('escribe enteros y fracciones comunes', () => {
    expect(numeroDePorcion(2)).toBe('2');
    expect(numeroDePorcion(0.5)).toBe('½');
    expect(numeroDePorcion(1.5)).toBe('1½');
    expect(numeroDePorcion(2.25)).toBe('2¼');
    expect(numeroDePorcion(1 / 3)).toBe('⅓');
  });

  it('devuelve null para lo que no es una fracción común', () => {
    expect(numeroDePorcion(1.3)).toBeNull();
  });
});

describe('decimal', () => {
  it('usa la coma y el punto de cada idioma', () => {
    expect(decimal(1.25, 'es')).toBe('1,25');
    expect(decimal(1.25, 'en')).toBe('1.25');
    expect(decimal(1250, 'es')).toBe('1.250');
    expect(decimal(1250, 'en')).toBe('1,250');
    expect(decimal(177, 'es')).toBe('177');
  });
});

describe('pluralDePorcion', () => {
  it('en español concuerdan las palabras hasta la preposición o la coma', () => {
    expect(pluralDePorcion('taza, en rodajas', 'es')).toBe('tazas, en rodajas');
    expect(pluralDePorcion('unidad muy pequeña', 'es')).toBe('unidades muy pequeñas');
    expect(pluralDePorcion('porción de referencia', 'es')).toBe('porciones de referencia');
    expect(pluralDePorcion('unidad grande (20 a 23 cm de largo)', 'es')).toBe('unidades grandes (20 a 23 cm de largo)');
    expect(pluralDePorcion('onza líquida', 'es')).toBe('onzas líquidas');
  });

  it('en inglés cambia solo la última palabra, y los tamaños quedan igual', () => {
    expect(pluralDePorcion('cup, mashed', 'en')).toBe('cups, mashed');
    expect(pluralDePorcion('large egg', 'en')).toBe('large eggs');
    expect(pluralDePorcion('medium', 'en')).toBe('medium');
    expect(pluralDePorcion('glass', 'en')).toBe('glasses');
    expect(pluralDePorcion('patty', 'en')).toBe('patties');
    expect(pluralDePorcion('NLEA serving', 'en')).toBe('NLEA servings');
    expect(pluralDePorcion('piece/slice, any size', 'en')).toBe('pieces/slices, any size');
  });
});

describe('cantidadDePorcion', () => {
  it('una porción queda como está', () => {
    expect(cantidadDePorcion(1, '1 mediana', 'es')).toBe('1 mediana');
    expect(cantidadDePorcion(1, 'Porción típica', 'es')).toBe('Porción típica');
  });

  it('multiplica y pasa al plural', () => {
    expect(cantidadDePorcion(2, '1 rebanada', 'es')).toBe('2 rebanadas');
    expect(cantidadDePorcion(1.5, '1 taza', 'es')).toBe('1½ tazas');
    expect(cantidadDePorcion(0.5, '1 unidad', 'es')).toBe('½ unidad');
    expect(cantidadDePorcion(2, '1 medium', 'en')).toBe('2 medium');
    expect(cantidadDePorcion(2, '1 slice', 'en')).toBe('2 slices');
  });

  it('las fracciones de la base se suman', () => {
    expect(cantidadDePorcion(2, '½ taza', 'es')).toBe('1 taza');
    expect(cantidadDePorcion(3, '½ taza', 'es')).toBe('1½ tazas');
    expect(cantidadDePorcion(3, '½ cup', 'en')).toBe('1½ cups');
  });

  it('los gramos y mililitros se multiplican', () => {
    expect(cantidadDePorcion(1.5, '100 g', 'es')).toBe('150 g');
    expect(cantidadDePorcion(2, '30 g', 'en')).toBe('60 g');
    expect(cantidadDePorcion(5, '250 ml', 'es')).toBe('1.250 ml');
  });

  it('lo que ya está en plural sigue en plural', () => {
    expect(cantidadDePorcion(2, '10 unidades', 'es')).toBe('20 unidades');
    expect(cantidadDePorcion(0.5, '10 unidades', 'es')).toBe('5 unidades');
    expect(cantidadDePorcion(0.1, '10 unidades', 'es')).toBe('0,1 × 10 unidades');
  });

  it('sin número cuenta como una', () => {
    expect(cantidadDePorcion(2, 'Porción típica', 'es')).toBe('2 porciones típicas');
    expect(cantidadDePorcion(2, 'Typical serving', 'en')).toBe('2 typical servings');
  });

  it('lo que no da una fracción común va con «×»', () => {
    expect(cantidadDePorcion(1.3, '1 taza', 'es')).toBe('1,3 × 1 taza');
  });
});
