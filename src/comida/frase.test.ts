import { describe, expect, it } from '@jest/globals';

import { conCon, leerFrase } from './frase';

/** Lo que se busca y la cantidad de cada alimento: «2 huevo revuelto», «½ taza avena». */
const resumen = (texto: string, esNombre?: (b: string) => boolean, idioma: 'es' | 'en' = 'es') =>
  leerFrase(texto, idioma, esNombre).dichos.map((d) => [d.cantidad, d.unidad, d.buscado, d.acompanante ?? false]);

const nombres = new Set(['cafe con leche', 'café con leche', 'arroz con pollo', 'arroz con leche', 'coffee with milk']);
const esNombre = (b: string) => nombres.has(b);

describe('la comida dicha de una vez', () => {
  it('cada alimento con su cantidad; «café con leche» es uno y «tostada con manteca», dos', () => {
    expect(resumen('dos huevos revueltos, una tostada con manteca y un café con leche', esNombre)).toEqual([
      [2, null, 'huevo revuelto', false],
      [1, null, 'tostada', false],
      [null, null, 'manteca', true],
      [1, null, 'café con leche', false],
    ]);
  });

  it('las unidades caseras y los gramos dichos', () => {
    expect(resumen('un vaso de leche y una banana')).toEqual([[1, 'vaso', 'leche', false], [1, null, 'banana', false]]);
    expect(resumen('media taza de avena con un yogur y una manzana')).toEqual([
      [0.5, 'taza', 'avena', false], [1, null, 'yogur', false], [1, null, 'manzana', false],
    ]);
  });

  it('la medida de la casa, como se dijo: el vaso queda vaso; los gramos, no', () => {
    expect(leerFrase('un vaso de leche, dos cucharadas de azúcar y 200 g de arroz', 'es').dichos.map((d) => d.medida ?? null)).toEqual(['vaso', 'cucharada', null]);
    expect(leerFrase('a glass of milk', 'en').dichos[0].medida).toBe('glass');
  });

  it('la corrección después de lo dicho, y nada de lo que queda suelto', () => {
    expect(resumen('dos huevos, no, tres').map(([c, , b]) => [c, b])).toEqual([[3, 'huevo']]);
    expect(resumen('comí dos medialunas, no, eran tres').map(([c, , b]) => [c, b])).toEqual([[3, 'medialuna']]);
    expect(resumen('un café y dos huevos, no, tres').map(([c, , b]) => [c, b])).toEqual([[1, 'café'], [3, 'huevo']]);
  });

  it('el «y» después de un «con» empieza otra cosa, salvo que el nombre entero exista', () => {
    expect(resumen('un café con leche y medialunas', esNombre).map(([c, , b, a]) => [c, b, a])).toEqual([[1, 'café con leche', false], [null, 'medialuna', false]]);
    expect(resumen('una tostada con manteca y mermelada').map(([, , b, a]) => [b, a])).toEqual([['tostada', false], ['manteca', true], ['mermelada', true]]);
  });

  it('uno y medio, y la comida por el verbo o el momento del día', () => {
    expect(resumen('un huevo y medio').map(([c, , b]) => [c, b])).toEqual([[1.5, 'huevo']]);
    expect(resumen('una pizza y media').map(([c, , b]) => [c, b])).toEqual([[1.5, 'pizza']]);
    expect(leerFrase('desayuné dos huevos', 'es').comida).toBe('desayuno');
    expect(leerFrase('cené una milanesa', 'es').comida).toBe('cena');
    expect(leerFrase('a la noche comí pizza', 'es')).toMatchObject({ comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    expect(leerFrase('al mediodía una milanesa', 'es')).toMatchObject({ comida: 'almuerzo', dichos: [{ buscado: 'milanesa' }] });
    expect(leerFrase('anoche comí pizza', 'es').dichos.map((d) => d.buscado)).toEqual(['pizza']);
  });

  it('lo que se calla es lo de antes: la unidad o el alimento', () => {
    expect(resumen('200 gramos de arroz y 150 de pollo a la plancha').map(([c, u]) => [c, u])).toEqual([[200, 'g'], [150, 'g']]);
    expect(resumen('dos empanadas de carne y una de jamón y queso').map(([c, , b]) => [c, b])).toEqual([[2, 'empanada de carne'], [1, 'empanada de jamón y queso']]);
    expect(resumen('un vaso de leche y uno de jugo').map(([c, u, b]) => [c, u, b])).toEqual([[1, 'vaso', 'leche'], [1, 'vaso', 'jugo']]);
  });

  it('sin muletillas ni verbos, y «y» corta solo cuando sigue otro alimento', () => {
    expect(resumen('eh bueno comí tres medialunas y un cortado').map(([c, , b]) => [c, b])).toEqual([[3, 'medialuna'], [1, 'cortado']]);
    expect(resumen('me tomé un café y después una galletita').map(([c, , b]) => [c, b])).toEqual([[1, 'café'], [1, 'galletita']]);
  });

  it('la corrección: «dos, no, tres» son tres', () => {
    expect(resumen('dos, no, tres medialunas').map(([c, , b]) => [c, b])).toEqual([[3, 'medialuna']]);
  });

  it('la comida nombrada se usa y se saca de la frase', () => {
    const leida = leerFrase('en el almuerzo comí un plato de arroz con pollo y una ensalada', 'es', esNombre);
    expect(leida.comida).toBe('almuerzo');
    expect(leida.dichos.map((d) => d.buscado)).toEqual(['arroz con pollo', 'ensalada']);
  });

  it('sin cantidad, sin cantidad: lo decide la historia o la porción típica', () => {
    expect(resumen('un chivito, papas fritas y una coca')).toEqual([[1, null, 'chivito', false], [null, null, 'papa frita', false], [1, null, 'coca', false]]);
  });

  it('en inglés', () => {
    expect(resumen('two scrambled eggs, a toast with butter and a coffee with milk', esNombre, 'en')).toEqual([
      [2, null, 'scrambled egg', false],
      [1, null, 'toast', false],
      [null, null, 'butter', true],
      [1, null, 'coffee with milk', false],
    ]);
  });

  it('los «X con Y» que hay que mirar en la base', () => {
    expect(conCon('una tostada con manteca y un café con leche', 'es')).toEqual(['tostada con manteca', 'café con leche']);
  });

  it('una palabra que termina en «no» no es una corrección: «vino, dos empanadas» son dos', () => {
    expect(resumen('una copa de vino, dos empanadas').map(([c, , b]) => [c, b])).toEqual([[1, 'vino'], [2, 'empanada']]);
    expect(resumen('un plátano, un café').map(([c, , b]) => [c, b])).toEqual([[1, 'plátano'], [1, 'café']]);
    expect(resumen('dos panes de centeno, una banana').map(([c, , b]) => [c, b])).toEqual([[2, 'pan de centeno'], [1, 'banana']]);
    expect(resumen('dos huevos, no, tres').map(([c, , b]) => [c, b])).toEqual([[3, 'huevo']]);
  });

  it('«one and a half» es uno y medio, y solo no deja nada', () => {
    expect(resumen('two and a half eggs', undefined, 'en').map(([c, , b]) => [c, b])).toEqual([[2.5, 'egg']]);
    expect(resumen('one and a half cups of rice', undefined, 'en').map(([c, u, b]) => [c, u, b])).toEqual([[1.5, 'taza', 'rice']]);
    expect(resumen('two eggs and a banana', undefined, 'en').map(([c, , b]) => [c, b])).toEqual([[2, 'egg'], [1, 'banana']]);
    expect(resumen('one and a half', undefined, 'en')).toEqual([]);
  });

  it('«ayer» y «anoche» dicen el día, en cualquier lugar; «anoche» sin otra comida es la cena', () => {
    expect(leerFrase('anoche comí pizza', 'es')).toMatchObject({ ayer: true, comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    expect(leerFrase('comí dos empanadas anoche', 'es')).toMatchObject({ ayer: true, comida: 'cena', dichos: [{ buscado: 'empanada', cantidad: 2 }] });
    expect(leerFrase('ayer al mediodía una milanesa', 'es')).toMatchObject({ ayer: true, comida: 'almuerzo', dichos: [{ buscado: 'milanesa' }] });
    expect(leerFrase('last night I had pizza', 'en')).toMatchObject({ ayer: true, comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    expect(leerFrase('una tostada de pan de ayer', 'es').ayer).toBe(false);
    expect(leerFrase('desayuné dos huevos', 'es').ayer).toBe(false);
  });

  it('«arroz y pollo» se busca entero, con cada uno aparte por si la base no lo tiene', () => {
    const [dicho] = leerFrase('arroz y pollo', 'es').dichos;
    expect(dicho.buscado).toBe('arroz y pollo');
    expect(dicho.partes?.map((x) => x.buscado)).toEqual(['arroz', 'pollo']);
    expect(leerFrase('un huevo', 'es').dichos[0].partes).toBeUndefined();
  });
});
