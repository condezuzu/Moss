import { describe, expect, it } from '@jest/globals';

import { conCon, leerFrase, mismoNombre, porComida } from './frase';

/** Lo que se busca y la cantidad de cada alimento: «2 huevo revuelto», «½ taza avena». */
const resumen = (texto: string, esNombre?: (b: string) => boolean, idioma: 'es' | 'en' = 'es') =>
  leerFrase(texto, idioma, esNombre).dichos.map((d) => [d.cantidad, d.unidad, d.buscado, d.acompanante ?? false]);

const nombres = new Set(['cafe con leche', 'café con leche', 'arroz con pollo', 'arroz con leche', 'coffee with milk']);
const esNombre = (b: string) => nombres.has(b);

describe('mismoNombre', () => {
  it('lo dicho y el nombre de la base son lo mismo, con o sin plural, tildes y mayúsculas', () => {
    expect(mismoNombre('yogur con fruta', 'Yogur con frutas')).toBe(true);
    expect(mismoNombre('café con leche', 'Cafe con leche')).toBe(true);
    expect(mismoNombre('tostada con manteca', 'Tostada')).toBe(false);
    expect(mismoNombre('arroz con leche', 'Arroz con pollo')).toBe(false);
    // Con dos palabras después del «con», se corta: las papas se preguntan aparte.
    expect(mismoNombre('Milanesa con papas fritas', 'milanesa con papa frita')).toBe(false);
  });
});

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

  it('«y media» con un alimento después es otro alimento; cerrando lo de antes, es la fracción', () => {
    const leer = (texto: string, idioma: 'es' | 'en' = 'es') => resumen(texto, undefined, idioma).map(([c, u, b]) => [c, u, b]);
    expect(leer('dos huevos y media palta')).toEqual([[2, null, 'huevo'], [0.5, null, 'palta']]);
    expect(leer('un yogur y media manzana')).toEqual([[1, null, 'yogur'], [0.5, null, 'manzana']]);
    expect(leer('two eggs and half an avocado', 'en')).toEqual([[2, null, 'egg'], [0.5, null, 'avocado']]);
    // Lo de antes ya tenía su «de»: lo que se calla es la medida o el alimento.
    expect(leer('una cucharada de aceite y media de manteca')).toEqual([[1, 'cucharada', 'aceite'], [0.5, 'cucharada', 'manteca']]);
    expect(leer('dos empanadas de carne y media de jamón')).toEqual([[2, null, 'empanada de carne'], [0.5, null, 'empanada de jamón']]);
    expect(leerFrase('un plato de arroz y medio de fideos', 'es').dichos.map((d) => [d.cantidad, d.buscado, d.vago ?? false])).toEqual([[1, 'arroz', true], [0.5, 'fideo', true]]);
    // Solo un número y una medida antes: es la fracción.
    expect(leer('una taza y media de arroz')).toEqual([[1.5, 'taza', 'arroz']]);
    expect(leer('dos huevos y medio, un café')).toEqual([[2.5, null, 'huevo'], [1, null, 'café']]);
  });

  it('la medida sin número es una: «kilo y medio de asado», «kilo de asado»', () => {
    const leer = (texto: string) => resumen(texto).map(([c, u, b]) => [c, u, b]);
    expect(leer('kilo y medio de asado')).toEqual([[1.5, 'kg', 'asado']]);
    expect(leer('taza y media de arroz')).toEqual([[1.5, 'taza', 'arroz']]);
    expect(leer('litro y medio de agua')).toEqual([[1.5, 'l', 'agua']]);
    expect(leer('kilo de asado')).toEqual([[1, 'kg', 'asado']]);
  });

  it('lo que se calla es lo de antes: la unidad o el alimento', () => {
    expect(resumen('200 gramos de arroz y 150 de pollo a la plancha').map(([c, u]) => [c, u])).toEqual([[200, 'g'], [150, 'g']]);
    expect(resumen('dos empanadas de carne y una de jamón y queso').map(([c, , b]) => [c, b])).toEqual([[2, 'empanada de carne'], [1, 'empanada de jamón y queso']]);
    expect(resumen('un vaso de leche y uno de jugo').map(([c, u, b]) => [c, u, b])).toEqual([[1, 'vaso', 'leche'], [1, 'vaso', 'jugo']]);
  });

  it('«cuatro empanadas, dos de carne y dos de jamón» son cuatro: lo de antes era el total', () => {
    expect(resumen('cuatro empanadas, dos de carne y dos de jamón').map(([c, , b]) => [c, b])).toEqual([[2, 'empanada de carne'], [2, 'empanada de jamón']]);
    // Si no suman lo mismo, son otras.
    expect(resumen('dos empanadas, una de carne').map(([c, , b]) => [c, b])).toEqual([[2, 'empanada'], [1, 'empanada de carne']]);
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

  it('la comida nombrada sin preposición, al empezar (lo pediste el 30/10/2026)', () => {
    expect(leerFrase('el desayuno comí dos tostadas', 'es')).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'tostada', cantidad: 2 }] });
    expect(leerFrase('El almuerzo fue una milanesa', 'es')).toMatchObject({ comida: 'almuerzo', dichos: [{ buscado: 'milanesa', cantidad: 1 }] });
    expect(leerFrase('la cena comí pizza', 'es')).toMatchObject({ comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    expect(leerFrase('la merienda un café', 'es')).toMatchObject({ comida: 'merienda', dichos: [{ buscado: 'café' }] });
    expect(leerFrase('snack: una manzana', 'es')).toMatchObject({ comida: 'snack', dichos: [{ buscado: 'manzana' }] });
    expect(leerFrase('desayuno: dos huevos', 'es')).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'huevo', cantidad: 2 }] });
    expect(leerFrase('hoy el almuerzo fue una milanesa', 'es').comida).toBe('almuerzo');
    expect(leerFrase('bueno la cena comí pizza', 'es').comida).toBe('cena');
    expect(leerFrase('almuerzo de pollo con arroz', 'es').dichos[0].buscado).toBe('pollo');
    expect(leerFrase('la cena de ayer fue pizza', 'es')).toMatchObject({ comida: 'cena', ayer: true, dichos: [{ buscado: 'pizza' }] });
    expect(leerFrase('breakfast: two eggs', 'en')).toMatchObject({ comida: 'desayuno', dichos: [{ cantidad: 2 }] });
  });

  it('con preposición, en todas las comidas: también el snack', () => {
    expect(leerFrase('en el snack una manzana', 'es')).toMatchObject({ comida: 'snack', dichos: [{ buscado: 'manzana' }] });
    expect(leerFrase('para el snack unas galletitas', 'es').comida).toBe('snack');
    expect(leerFrase('de snack una banana', 'es').comida).toBe('snack');
    expect(leerFrase('como colación una banana', 'es').comida).toBe('snack');
    expect(leerFrase('a la cena pizza', 'es').comida).toBe('cena');
    expect(leerFrase('comí dos huevos en el desayuno', 'es')).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'huevo' }] });
    expect(leerFrase('I had two eggs at breakfast', 'en').comida).toBe('desayuno');
    expect(leerFrase('an apple as a snack', 'en').comida).toBe('snack');
    expect(leerFrase('cenamos pizza', 'es')).toMatchObject({ comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    // Lo que no nombra una comida no la inventa.
    expect(leerFrase('dos huevos', 'es').comida).toBeNull();
    expect(leerFrase('una cena', 'es').comida).toBeNull();
  });

  it('un plato de algo, con todas sus formas', () => {
    const plato = (texto: string) => {
      const [d] = leerFrase(texto, 'es').dichos;
      return [d.cantidad, d.buscado, d.vago ?? false, d.plato ?? null];
    };
    expect(plato('medio plato de arroz')).toEqual([0.5, 'arroz', true, null]);
    expect(plato('un cuarto de plato de ensalada')).toEqual([0.25, 'ensalada', true, null]);
    expect(plato('tres cuartos de plato de fideos')).toEqual([0.75, 'fideo', true, null]);
    expect(plato('un platito de sopa')).toEqual([1, 'sopa', true, 'chico']);
    expect(plato('un platazo de ñoquis')).toEqual([1, 'ñoqui', true, 'grande']);
    expect(plato('un plato hondo de sopa')).toEqual([1, 'sopa', true, null]);
    expect(plato('un plato lleno de arroz')).toEqual([1, 'arroz', true, 'grande']);
    expect(plato('un plato de fideos grande')).toEqual([1, 'fideo', true, 'grande']);
    expect(leerFrase('half a plate of rice', 'en').dichos[0]).toMatchObject({ cantidad: 0.5, buscado: 'rice', vago: true });
  });

  it('el plato sin número, con «½» o «y medio», y el tamaño antes del plato', () => {
    const plato = (texto: string, idioma: 'es' | 'en' = 'es') => {
      const [d] = leerFrase(texto, idioma).dichos;
      return [d.cantidad, d.buscado, d.vago ?? false, d.plato ?? null];
    };
    expect(plato('un plato y medio de arroz')).toEqual([1.5, 'arroz', true, null]);
    expect(plato('plato y medio de fideos')).toEqual([1.5, 'fideo', true, null]);
    expect(plato('½ plato de arroz')).toEqual([0.5, 'arroz', true, null]);
    expect(plato('1/2 plato de arroz')).toEqual([0.5, 'arroz', true, null]);
    expect(plato('plato de fideos')).toEqual([1, 'fideo', true, null]);
    expect(plato('un gran plato de guiso')).toEqual([1, 'guiso', true, 'grande']);
    expect(plato('a big plate of pasta', 'en')).toEqual([1, 'pasta', true, 'grande']);
    // Solo, el plato es de lo de antes: no se busca «plato».
    expect(leerFrase('fideos, un plato grande', 'es').dichos.map((d) => [d.buscado, d.vago, d.plato])).toEqual([['fideo', true, 'grande']]);
  });

  it('«una porción» o «un bol» no son un plato, y «uno de» repite el plato', () => {
    expect(leerFrase('una porción de queso', 'es').dichos[0].recipiente).toBe('otro');
    expect(leerFrase('un plato de arroz', 'es').dichos[0].recipiente).toBe('plato');
    expect(leerFrase('un plato de arroz y uno de fideos', 'es').dichos.map((d) => [d.buscado, d.vago ?? false])).toEqual([['arroz', true], ['fideo', true]]);
  });

  it('«un poco» y «mucho» dicen cuánto, sin número', () => {
    expect(leerFrase('un poco de arroz', 'es').dichos[0]).toMatchObject({ buscado: 'arroz', cantidad: null, cuanto: 'poco' });
    expect(leerFrase('mucho arroz', 'es').dichos[0]).toMatchObject({ buscado: 'arroz', cantidad: null, cuanto: 'mucho' });
    expect(leerFrase('bastante ensalada', 'es').dichos[0]).toMatchObject({ buscado: 'ensalada', cuanto: 'mucho' });
    expect(leerFrase('pollo y un poco de ensalada', 'es').dichos.map((d) => [d.buscado, d.cuanto ?? null])).toEqual([['pollo', null], ['ensalada', 'poco']]);
    expect(leerFrase('a little rice', 'en').dichos[0]).toMatchObject({ buscado: 'rice', cuanto: 'poco' });
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

describe('varias comidas en una frase (lo pediste el 18/11/2026)', () => {
  /** Cada grupo: su comida (o «hora»), « ayer» si es de ayer, y lo que se busca con su cantidad. */
  const grupos = (texto: string, idioma: 'es' | 'en' = 'es') =>
    leerFrase(texto, idioma).grupos.map((g) => [`${g.comida ?? 'hora'}${g.ayer ? ' ayer' : ''}`, g.dichos.map((d) => `${d.cantidad ?? '–'} ${d.buscado}`)]);

  it('cada alimento va a su comida, con o sin puntuación', () => {
    expect(grupos('en el desayuno dos huevos y un café en el almuerzo una milanesa y de merienda dos bizcochos')).toEqual([
      ['desayuno', ['2 huevo', '1 café']], ['almuerzo', ['1 milanesa']], ['merienda', ['2 bizcocho']],
    ]);
    expect(grupos('Desayuno: avena. Almuerzo: pollo. Cena: una tarta.')).toEqual([['desayuno', ['– avena']], ['almuerzo', ['– pollo']], ['cena', ['1 tarta']]]);
    expect(grupos('desayuné un café, almorcé una milanesa y a la noche una pizza')).toEqual([['desayuno', ['1 café']], ['almuerzo', ['1 milanesa']], ['cena', ['1 pizza']]]);
    expect(grupos('for breakfast two eggs, for lunch a salad', 'en')).toEqual([['desayuno', ['2 egg']], ['almuerzo', ['1 salad']]]);
  });

  it('la comida que se nombra dos veces se suma, y lo que no dice comida queda para la de la hora', () => {
    expect(grupos('en el desayuno dos huevos, en el almuerzo una milanesa y también en el desayuno un café')).toEqual([
      ['desayuno', ['2 huevo', '1 café']], ['almuerzo', ['1 milanesa']],
    ]);
    expect(grupos('dos huevos y en el almuerzo una milanesa')).toEqual([['hora', ['2 huevo']], ['almuerzo', ['1 milanesa']]]);
    expect(grupos('dos huevos y un café')).toEqual([['hora', ['2 huevo', '1 café']]]);
  });

  it('la comida al final se lleva lo de antes', () => {
    expect(grupos('comí dos huevos en el desayuno y una milanesa en el almuerzo')).toEqual([['desayuno', ['2 huevo']], ['almuerzo', ['1 milanesa']]]);
    expect(grupos('an apple as a snack', 'en')).toEqual([['snack', ['1 apple']]]);
  });

  it('«ayer» y «hoy» valen desde donde se dicen', () => {
    expect(grupos('ayer en el desayuno dos huevos y hoy en el almuerzo una milanesa')).toEqual([['desayuno ayer', ['2 huevo']], ['almuerzo', ['1 milanesa']]]);
    expect(grupos('en el desayuno un café y anoche una pizza')).toEqual([['desayuno', ['1 café']], ['cena ayer', ['1 pizza']]]);
    expect(grupos('yesterday for lunch a burger', 'en')).toEqual([['almuerzo ayer', ['1 burger']]]);
  });

  it('lo dictado sin comas, las correcciones de alimento y los números con palabras', () => {
    expect(grupos('2 huevos 1 tostada 1 café')).toEqual([['hora', ['2 huevo', '1 tostada', '1 café']]]);
    expect(grupos('comí dos huevos una tostada y un café')).toEqual([['hora', ['2 huevo', '1 tostada', '1 café']]]);
    expect(grupos('un café, no, mejor un té')).toEqual([['hora', ['1 té']]]);
    expect(grupos('dos huevos no tres huevos')).toEqual([['hora', ['3 huevo']]]);
    expect(grupos('una medialuna, no, mejor dos')).toEqual([['hora', ['2 medialuna']]]);
    expect(leerFrase('ciento cincuenta gramos de pollo', 'es').dichos[0]).toMatchObject({ cantidad: 150, unidad: 'g' });
    expect(leerFrase('two hundred grams of rice', 'en').dichos[0]).toMatchObject({ cantidad: 200, unidad: 'g' });
  });

  it('«con» y una cantidad es otra cosa; con dos «con», se corta donde queda un nombre de la base', () => {
    expect(grupos('un café con leche con dos medialunas')).toEqual([['hora', ['1 café', '– leche', '2 medialuna']]]);
    const conNombre = (b: string) => b === 'café con leche';
    expect(leerFrase('un café con leche con tostadas', 'es', conNombre).dichos.map((d) => [d.buscado, d.acompanante ?? false])).toEqual([['café con leche', false], ['tostada', true]]);
  });

  it('porComida: lo que no dijo comida va a la de la hora y se junta con lo que ya iba ahí', () => {
    const leida = leerFrase('dos huevos y en el almuerzo una milanesa', 'es');
    expect(porComida(leida.grupos, 'almuerzo').map((g) => [g.comida, g.ayer, g.dichos.length])).toEqual([['almuerzo', false, 2]]);
    expect(porComida(leida.grupos, 'desayuno').map((g) => [g.comida, g.dichos.length])).toEqual([['desayuno', 1], ['almuerzo', 1]]);
    expect(porComida(leerFrase('y una banana', 'es').grupos, 'cena', true)).toMatchObject([{ comida: 'cena', ayer: true }]);
  });
});

describe('un plato con nombre y lo que lleva (lo pediste el 27/11/2026)', () => {
  /** De cada cosa: su grupo (el plato del que es parte), cuánto, en qué medida y lo que se busca. */
  const lista = (texto: string, idioma: 'es' | 'en' = 'es', esNombre?: (b: string) => boolean) =>
    leerFrase(texto, idioma, esNombre).dichos.map((d) => [d.grupo ?? null, d.cantidad, d.unidad, d.buscado]);
  const nombres = (texto: string, idioma: 'es' | 'en' = 'es') => lista(texto, idioma).map(([g, , , b]) => [g, b]);

  it('«un batido de banana, leche y avena» abre la lista: cada ingrediente aparte, con el nombre del plato', () => {
    const batido = [['batido', null, null, 'banana'], ['batido', null, null, 'leche'], ['batido', null, null, 'avena']];
    expect(lista('un batido de banana, leche y avena')).toEqual(batido);
    expect(lista('me tomo un batido de banana, leche y avena')).toEqual(batido);
    expect(lista('un batido de banana y leche')).toEqual(batido.slice(0, 2));
    expect(nombres('una ensalada de lechuga, tomate y huevo')).toEqual([['ensalada', 'lechuga'], ['ensalada', 'tomate'], ['ensalada', 'huevo']]);
    expect(nombres('un licuado con banana, leche y avena')).toEqual([['licuado', 'banana'], ['licuado', 'leche'], ['licuado', 'avena']]);
    expect(nombres('un bowl con arroz, pollo y palta')).toEqual([['bowl', 'arroz'], ['bowl', 'pollo'], ['bowl', 'palta']]);
  });

  it('con los dos puntos o con cantidades, cada cosa con la suya; también dictado, sin comas', () => {
    expect(lista('me tomo un batido de: una banana, 300 de leche, 30 gramos de avena')).toEqual([['batido', 1, null, 'banana'], ['batido', 300, null, 'leche'], ['batido', 30, 'g', 'avena']]);
    const conCantidades = [['batido', 1, null, 'banana'], ['batido', 1, 'taza', 'leche'], ['batido', 2, 'cucharada', 'avena'], ['batido', 1, 'cucharada', 'mantequilla de maní']];
    expect(lista('un batido de: una banana, una taza de leche, dos cucharadas de avena y una de mantequilla de maní')).toEqual(conCantidades);
    expect(lista('me tomo un batido de una banana una taza de leche dos cucharadas de avena y una de mantequilla de maní')).toEqual(conCantidades);
    expect(lista('un licuado con una banana y una taza de leche')).toEqual([['licuado', 1, null, 'banana'], ['licuado', 1, 'taza', 'leche']]);
    expect(nombres('un batido: banana y leche')).toEqual([['batido', 'banana'], ['batido', 'leche']]);
    // Con otro nombre antes de los dos puntos, ese es el del plato.
    expect(nombres('mi batido verde: espinaca, manzana y apio')).toEqual([['batido verde', 'espinaca'], ['batido verde', 'manzana'], ['batido verde', 'apio']]);
  });

  it('una bebida con algo más en su nombre se abre si lo que sigue es una lista: «un batido verde de espinaca, manzana y apio»', () => {
    expect(nombres('un batido verde de espinaca, manzana y apio')).toEqual([['batido verde', 'espinaca'], ['batido verde', 'manzana'], ['batido verde', 'apio']]);
    expect(nombres('un licuado proteico con banana y avena')).toEqual([['licuado proteico', 'banana'], ['licuado proteico', 'avena']]);
    // Sin una lista, es lo que dice: el de la base, si lo tiene.
    expect(nombres('un batido verde')).toEqual([[null, 'batido verde']]);
    expect(nombres('un batido verde de espinaca').map(([g]) => g)).toEqual([null]);
  });

  it('lo que se hace con huevos, si se dice cuántos: «una tortilla de 3 huevos con queso»', () => {
    expect(leerFrase('una tortilla de 3 huevos con queso', 'es').dichos.map((d) => [d.grupo, d.cantidad, d.buscado, d.acompanante ?? false]))
      .toEqual([['tortilla', 3, 'huevo', false], ['tortilla', null, 'queso', true]]);
    expect(lista('un omelette de 2 huevos y queso').map(([g, c, , b]) => [g, c, b])).toEqual([['omelette', 2, 'huevo'], ['omelette', null, 'queso']]);
    expect(lista('un omelette con 2 huevos y queso').map(([g, c, , b]) => [g, c, b])).toEqual([['omelette', 2, 'huevo'], ['omelette', null, 'queso']]);
    // Sin cuántos huevos, es lo que dice: la tortilla de la base, o la de maíz con su queso.
    expect(lista('una tortilla de papas')).toEqual([[null, 1, null, 'tortilla de papa']]);
    expect(nombres('dos tortillas con queso')).toEqual([[null, 'tortilla'], [null, 'queso']]);
  });

  it('la lista sigue hasta donde termina lo dicho: un punto, «después», «de postre» u otra comida', () => {
    expect(nombres('un batido de banana, leche y dos cucharadas de avena. Después dos tostadas')).toEqual([['batido', 'banana'], ['batido', 'leche'], ['batido', 'avena'], [null, 'tostada']]);
    expect(nombres('un licuado con banana y avena y de postre un flan')).toEqual([['licuado', 'banana'], ['licuado', 'avena'], [null, 'flan']]);
    const leida = leerFrase('en el desayuno un batido de banana y leche, en el almuerzo una milanesa y también en el desayuno un café', 'es');
    expect(leida.grupos.map((g) => [g.comida, g.dichos.map((d) => [d.grupo ?? null, d.buscado])])).toEqual([
      ['desayuno', [['batido', 'banana'], ['batido', 'leche'], [null, 'café']]], ['almuerzo', [[null, 'milanesa']]],
    ]);
  });

  it('con un solo alimento después del «de», decide la base: va entero, con lo que llevaría si no existe', () => {
    const uno = (texto: string) => leerFrase(texto, 'es').dichos.map((d) => [d.grupo ?? null, d.cantidad, d.buscado, d.lleva?.map((x) => [x.grupo, x.buscado]) ?? null]);
    expect(uno('un batido de proteína')).toEqual([[null, 1, 'batido de proteína', [['batido', 'proteína']]]]);
    expect(uno('una ensalada de frutas')).toEqual([[null, 1, 'ensalada de fruta', [['ensalada', 'fruta']]]]);
    expect(uno('un licuado de plátano con avena')).toEqual([[null, 1, 'licuado de plátano', [['licuado', 'plátano']]], [null, null, 'avena', null]]);
    expect(uno('un batido')).toEqual([[null, 1, 'batido', null]]);
    // Lo que no es una mezcla es lo que dice, como siempre.
    expect(uno('un jugo de naranja')).toEqual([[null, 1, 'jugo de naranja', null]]);
    expect(uno('un sándwich de jamón y queso')).toEqual([[null, 1, 'sándwich de jamón y queso', null]]);
    expect(uno('una empanada de jamón y queso')).toEqual([[null, 1, 'empanada de jamón y queso', null]]);
    // Un bol sigue siendo una porción de lo que tiene, también con «con».
    expect(leerFrase('un bol de cereales', 'es').dichos[0]).toMatchObject({ buscado: 'cereal', vago: true, recipiente: 'otro' });
    expect(leerFrase('un bowl con arroz', 'es').dichos).toMatchObject([{ buscado: 'arroz', vago: true, recipiente: 'otro' }]);
  });

  it('lo que sigue con su cantidad después de un solo alimento es otra cosa, como siempre', () => {
    expect(lista('un licuado de banana y dos tostadas con mermelada').map(([g, c, , b]) => [g, c, b])).toEqual([[null, 1, 'licuado de banana'], [null, 2, 'tostada'], [null, null, 'mermelada']]);
    expect(nombres('una milanesa con ensalada y un batido')).toEqual([[null, 'milanesa'], [null, 'ensalada'], [null, 'batido']]);
    // El tamaño del batido no es un ingrediente.
    expect(lista('un batido de 300 ml').every(([g]) => g === null)).toBe(true);
    // Una ensalada con algo contado es la ensalada y eso; con «de», es de lo que está hecha.
    expect(lista('una ensalada con dos huevos y un bife').map(([g, c, , b]) => [g, c, b])).toEqual([[null, 1, 'ensalada'], [null, 2, 'huevo'], [null, 1, 'bife']]);
    expect(lista('una ensalada de 2 tomates y una cebolla').map(([g, c, , b]) => [g, c, b])).toEqual([['ensalada', 2, 'tomate'], ['ensalada', 1, 'cebolla']]);
  });

  it('en inglés', () => {
    expect(lista('a smoothie with banana, milk and oats', 'en')).toEqual([['smoothie', null, null, 'banana'], ['smoothie', null, null, 'milk'], ['smoothie', null, null, 'oats']]);
    expect(lista("I'm having a smoothie with a banana, a cup of milk and two tablespoons of oats", 'en'))
      .toEqual([['smoothie', 1, null, 'banana'], ['smoothie', 1, 'taza', 'milk'], ['smoothie', 2, 'cucharada', 'oats']]);
    expect(nombres('a salad with lettuce, tomato and egg', 'en')).toEqual([['salad', 'lettuce'], ['salad', 'tomato'], ['salad', 'egg']]);
    expect(lista('an omelet with 3 eggs and cheese', 'en').map(([g, c, , b]) => [g, c, b])).toEqual([['omelet', 3, 'egg'], ['omelet', null, 'cheese']]);
    // Un alimento de la base, como siempre.
    expect(lista('a protein shake', 'en')).toEqual([[null, 1, null, 'protein shake']]);
    expect(lista('a fruit salad', 'en')).toEqual([[null, 1, null, 'fruit salad']]);
    expect(leerFrase('a bowl of cereal with milk', 'en').dichos.map((d) => [d.grupo ?? null, d.buscado, d.vago ?? false])).toEqual([[null, 'cereal', true], [null, 'milk', false]]);
  });
});

describe('más formas de decirlo (27/11/2026)', () => {
  const leer = (texto: string, idioma: 'es' | 'en' = 'es') => leerFrase(texto, idioma).dichos.map((d) => [d.cantidad, d.unidad, d.buscado]);

  it('los verbos en presente y lo que uno se prepara: «me tomo», «como», «me hice», «voy a comer»', () => {
    expect(leer('me tomo un café')).toEqual([[1, null, 'café']]);
    expect(leer('como una manzana')).toEqual([[1, null, 'manzana']]);
    expect(leer('me hice un licuado de banana')).toEqual([[1, null, 'licuado de banana']]);
    expect(leer('me preparé dos tostadas')).toEqual([[2, null, 'tostada']]);
    expect(leer('voy a comer una milanesa')).toEqual([[1, null, 'milanesa']]);
    expect(leer("I'm having a coffee", 'en')).toEqual([[1, null, 'coffee']]);
    expect(leer('I made a sandwich', 'en')).toEqual([[1, null, 'sandwich']]);
    expect(leerFrase('ceno pizza', 'es')).toMatchObject({ comida: 'cena', dichos: [{ buscado: 'pizza' }] });
    // «Como» también es «más o menos».
    expect(leer('sushi, como doce piezas')).toEqual([[12, null, 'sushi']]);
  });

  it('un verbo después de «y» empieza otra cosa, y «después» también después de un punto', () => {
    expect(leer('comí una manzana y tomé un vaso de agua')).toEqual([[1, null, 'manzana'], [1, 'vaso', 'agua']]);
    expect(leer('I ate an apple and drank a glass of water', 'en')).toEqual([[1, null, 'apple'], [1, 'vaso', 'water']]);
    expect(leer('Dos huevos. Después un café')).toEqual([[2, null, 'huevo'], [1, null, 'café']]);
    expect(leer('primero una sopa, luego un bife y además una banana')).toEqual([[1, null, 'sopa'], [1, null, 'bife'], [1, null, 'banana']]);
    expect(leer('como siempre, un café y como postre un flan')).toEqual([[1, null, 'café'], [1, null, 'flan']]);
  });

  it('«300 de leche» después de algo que se cuenta son 300 de leche: lo que se calla no es «bananas»', () => {
    expect(leer('una banana y 300 de leche')).toEqual([[1, null, 'banana'], [300, null, 'leche']]);
    // Con la medida de antes, se sigue callando la medida.
    expect(leer('200 gramos de arroz y 150 de pollo')).toEqual([[200, 'g', 'arroz'], [150, 'g', 'pollo']]);
  });

  it('la medida del polvo: «un scoop de proteína», «dos medidas de whey»', () => {
    expect(leer('un scoop de proteína')).toEqual([[1, 'medida', 'proteína']]);
    expect(leer('dos medidas de whey')).toEqual([[2, 'medida', 'whey']]);
    expect(leer('dos scoops de proteína con agua')).toEqual([[2, 'medida', 'proteína'], [null, null, 'agua']]);
    expect(leerFrase('una medida de proteína', 'es').dichos[0].medida).toBe('medida');
    expect(leerFrase('a scoop of protein powder', 'en').dichos[0]).toMatchObject({ cantidad: 1, unidad: 'medida', buscado: 'protein powder', medida: 'scoop' });
  });

  it('el hielo no se anota', () => {
    expect(leer('un batido de banana, leche y hielo').map(([, , b]) => b)).toEqual(['banana', 'leche']);
    expect(leer('un café con hielo').map(([, , b]) => b)).toEqual(['café']);
    expect(leer('a smoothie with banana, milk and ice', 'en').map(([, , b]) => b)).toEqual(['banana', 'milk']);
    // El helado sí.
    expect(leer('un helado').map(([, , b]) => b)).toEqual(['helado']);
  });
});

describe('lo tuyo, dicho por su nombre (lo pediste el 27/11/2026)', () => {
  const tuyos = ['Batido de la mañana', 'Mi batido', 'Desayuno de siempre', 'Yogur', 'Tostadas con palta y huevo', 'Café'];
  const leer = (texto: string, esNombre?: (b: string) => boolean) => leerFrase(texto, 'es', esNombre, tuyos);
  /** De cada cosa: cuál de lo tuyo es (o null), cuánto y lo que se busca. */
  const dichos = (texto: string, esNombre?: (b: string) => boolean) => leer(texto, esNombre).dichos.map((d) => [d.tuyo ?? null, d.cantidad, d.buscado]);

  it('el nombre entero, con «mi», «un» o «el» adelante, o solo', () => {
    expect(dichos('mi batido de la mañana')).toEqual([[0, null, 'batido de la mañana']]);
    expect(dichos('un batido de la mañana')).toEqual([[0, 1, 'batido de la mañana']]);
    expect(dichos('me tomo el batido de la mañana y una banana')).toEqual([[0, null, 'batido de la mañana'], [null, 1, 'banana']]);
    expect(dichos('medio batido de la mañana')).toEqual([[0, 0.5, 'batido de la mañana']]);
    expect(dichos('Batido de la manana')).toEqual([[0, null, 'batido de la manana']]);
    // El nombre más largo gana, y «Mi batido» es otro.
    expect(dichos('mi batido')).toEqual([[1, null, 'mi batido']]);
  });

  it('con una palabra de comida en el nombre es lo tuyo, y va a esa comida: «mi desayuno de siempre»', () => {
    expect(leer('mi desayuno de siempre')).toMatchObject({ comida: 'desayuno', dichos: [{ tuyo: 2 }] });
    expect(leer('en la merienda mi desayuno de siempre')).toMatchObject({ comida: 'merienda', dichos: [{ tuyo: 2 }] });
    // Sin el nombre entero, «el desayuno» sigue siendo la comida.
    expect(leer('en el desayuno dos huevos')).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'huevo', cantidad: 2 }] });
    expect(leer('en el desayuno dos huevos').dichos[0].tuyo).toBeUndefined();
  });

  it('adentro de otro nombre no es lo tuyo: «yogur de frutilla», y «café con leche» si la base lo tiene', () => {
    expect(dichos('un yogur de frutilla')).toEqual([[null, 1, 'yogur de frutilla']]);
    expect(dichos('un yogur con granola')).toEqual([[3, 1, 'yogur'], [null, null, 'granola']]);
    expect(dichos('un café con leche', (b) => b === 'café con leche')).toEqual([[null, 1, 'café con leche']]);
    expect(dichos('un café con leche')).toEqual([[5, 1, 'café'], [null, null, 'leche']]);
  });

  it('un nombre con «con» y con «y» es una sola cosa', () => {
    expect(dichos('tostadas con palta y huevo')).toEqual([[4, null, 'tostadas con palta y huevo']]);
    expect(dichos('tostadas con palta y huevo y un café')).toEqual([[4, null, 'tostadas con palta y huevo'], [5, 1, 'café']]);
  });

  it('si después del nombre viene la lista, es la lista; solo, es lo tuyo', () => {
    const conBatido = (texto: string) => leerFrase(texto, 'es', undefined, ['Batido']).dichos.map((d) => [d.tuyo ?? null, d.grupo ?? null, d.buscado]);
    expect(conBatido('un batido de banana, leche y avena')).toEqual([[null, 'batido', 'banana'], [null, 'batido', 'leche'], [null, 'batido', 'avena']]);
    expect(conBatido('un batido')).toEqual([[0, null, 'batido']]);
  });

  it('sin nada tuyo, la frase se lee igual que siempre', () => {
    expect(leerFrase('un batido de la mañana', 'es', undefined, []).dichos.map((d) => d.tuyo)).toEqual([undefined]);
  });
});

describe('lo guardado con el nombre de una comida (27/11/2026)', () => {
  const tuyos = ['Desayuno', 'Merienda'];
  const leer = (texto: string) => leerFrase(texto, 'es', undefined, tuyos);

  it('la palabra es primero el momento: «Desayuno, dos huevos y un café» es el desayuno, sin lo guardado', () => {
    const casos: [string, string, string[]][] = [
      ['Desayuno, dos huevos y un café', 'desayuno', ['huevo', 'café']],
      ['Desayuno. Café con leche y dos tostadas', 'desayuno', ['café', 'leche', 'tostada']],
      ['Hoy de desayuno, café con leche.', 'desayuno', ['café', 'leche']],
      ['a la merienda, un alfajor', 'merienda', ['alfajor']],
      ['Merienda; un alfajor', 'merienda', ['alfajor']],
    ];
    for (const [texto, comida, esperado] of casos) {
      const leida = leer(texto);
      expect([texto, leida.comida, leida.dichos.map((d) => d.buscado), leida.dichos.some((d) => d.tuyo !== undefined)]).toEqual([texto, comida, esperado, false]);
    }
  });

  it('lo guardado, si se nombra sin dudas: «mi desayuno», «el desayuno de siempre» o la frase entera', () => {
    for (const texto of ['mi desayuno', 'el desayuno de siempre', 'Desayuno', 'Desayuno.']) expect([texto, leer(texto).dichos.map((d) => d.tuyo)]).toEqual([texto, [0]]);
    expect(leer('comí mi merienda y un café').dichos.map((d) => [d.tuyo ?? null, d.buscado])).toEqual([[1, 'merienda'], [null, 'café']]);
    // Con «en» delante es el momento, aunque diga «mi».
    expect(leer('en mi desayuno un café')).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'café' }] });
    expect(leerFrase('my breakfast', 'en', undefined, ['Breakfast']).dichos.map((d) => d.tuyo)).toEqual([0]);
    expect(leerFrase('Breakfast, two eggs and a coffee', 'en', undefined, ['Breakfast'])).toMatchObject({ comida: 'desayuno', dichos: [{ buscado: 'egg' }, { buscado: 'coffee' }] });
  });
});

describe('lo que va en cada plato, «como» y los números sin unidad (la revisión del 27/11/2026)', () => {
  /** De cada cosa: su grupo, cuánto, en qué medida y lo que se busca. */
  const lista = (texto: string, idioma: 'es' | 'en' = 'es') => leerFrase(texto, idioma).dichos.map((d) => [d.grupo ?? null, d.cantidad, d.unidad, d.buscado]);
  const buscados = (texto: string) => leerFrase(texto, 'es').dichos.map((d) => d.buscado);

  it('un plato con algo que no va en él son el plato y lo otro, como antes: «un licuado con dos medialunas»', () => {
    const casos: [string, string[], ('es' | 'en')?][] = [
      ['un licuado con dos medialunas', ['licuado', 'medialuna']],
      ['un smoothie con un sándwich', ['smoothie', 'sándwich']],
      ['una malteada con unas papas fritas', ['malteada', 'papa frita']],
      ['un omelette con dos tostadas', ['omelette', 'tostada']],
      ['un revuelto con una tostada', ['revuelto', 'tostada']],
      ['un shake con una hamburguesa', ['shake', 'hamburguesa']],
      ['un licuado con tostadas y mermelada', ['licuado', 'tostada', 'mermelada']],
      ['un smoothie con tostadas y huevos', ['smoothie', 'tostada', 'huevo']],
      ['un batido con galletitas y fruta', ['batido', 'galletita', 'fruta']],
      ['a smoothie with a bagel', ['smoothie', 'bagel'], 'en'],
      ['an omelet with two slices of toast', ['omelet', 'toast'], 'en'],
    ];
    for (const [texto, esperado, idioma] of casos) {
      const dichos = leerFrase(texto, idioma ?? 'es').dichos;
      expect([texto, dichos.map((d) => d.buscado), dichos.map((d) => d.grupo ?? null)]).toEqual([texto, esperado, esperado.map(() => null)]);
    }
    // Lo que va en el plato abre la lista, y lo que no queda aparte.
    expect(lista('un licuado con una banana y dos medialunas')).toEqual([['licuado', 1, null, 'banana'], [null, 2, null, 'medialuna']]);
  });

  it('la lista termina en lo primero que no va en el plato: «un licuado de banana, tostadas y café»', () => {
    expect(lista('un licuado de banana, tostadas y café')).toEqual([[null, 1, null, 'licuado de banana'], [null, null, null, 'tostada y café']]);
    expect(lista('un licuado de frutilla y medialunas')).toEqual([[null, 1, null, 'licuado de frutilla y medialuna']]);
    expect(lista('un batido de chocolate y galletitas')).toEqual([[null, 1, null, 'batido de chocolate y galletita']]);
    expect(lista('ensalada de pollo, arroz y una coca')).toEqual([[null, null, null, 'ensalada de pollo'], [null, null, null, 'arroz'], [null, 1, null, 'coca']]);
  });

  it('lo que viene después con su artículo no queda en la lista del plato', () => {
    const grupos = (texto: string) => lista(texto).map(([g, , , b]) => [g, b]);
    expect(grupos('un batido de banana, leche y avena y dos tostadas')).toEqual([['batido', 'banana'], ['batido', 'leche'], ['batido', 'avena'], [null, 'tostada']]);
    expect(grupos('un batido de banana y leche y un yogur')).toEqual([['batido', 'banana'], ['batido', 'leche'], [null, 'yogur']]);
    expect(grupos('una ensalada de lechuga y tomate y una milanesa')).toEqual([['ensalada', 'lechuga'], ['ensalada', 'tomate'], [null, 'milanesa']]);
    // Lo que se parte en la lista lleva su nombre, también el acompañante.
    expect(grupos('ensalada de tomate y lechuga con aceite')).toEqual([['ensalada', 'tomate'], ['ensalada', 'lechuga'], ['ensalada', 'aceite']]);
  });

  it('si la base tiene el plato con ese nombre, con «y» o con «con», es el de la base, entero', () => {
    const enLaBase = new Set(['ensalada de zanahoria y huevo', 'ensalada de atún con huevo']);
    const conLaBase = (texto: string) => leerFrase(texto, 'es', (b) => enLaBase.has(b)).dichos.map((d) => [d.grupo ?? null, d.buscado, !!d.partes]);
    expect(conLaBase('ensalada de zanahoria y huevo')).toEqual([[null, 'ensalada de zanahoria y huevo', false]]);
    expect(conLaBase('una ensalada de atún y huevo')).toEqual([[null, 'ensalada de atún con huevo', false]]);
    expect(conLaBase('una milanesa con una ensalada de zanahoria y huevo')).toEqual([[null, 'milanesa', false], [null, 'ensalada de zanahoria y huevo', false]]);
    // Sin el plato en la base, es la lista.
    expect(conLaBase('ensalada de zanahoria y pepino')).toEqual([['ensalada', 'zanahoria', false], ['ensalada', 'pepino', false]]);
    // conCon busca los dos nombres, y la base puede tenerlo en plural o con «con».
    expect(conCon('una ensalada de atún y huevo', 'es')).toEqual(['ensalada de atún y huevo', 'ensalada de atún con huevo']);
    expect(mismoNombre('Ensalada de chauchas y huevo', 'ensalada de chaucha y huevo')).toBe(true);
    expect(mismoNombre('Ensalada de atún con huevo', 'ensalada de atún y huevo')).toBe(true);
  });

  it('«como bebida» o «como acompañamiento» no es el verbo: lo que sigue se anota', () => {
    expect(buscados('una pizza y como bebida una coca')).toEqual(['pizza', 'coca']);
    expect(buscados('pollo y como acompañamiento arroz')).toEqual(['pollo', 'arroz']);
    expect(buscados('milanesa y como guarnición puré')).toEqual(['milanesa', 'puré']);
    // «Como» sigue siendo el verbo.
    expect(buscados('como dos empanadas')).toEqual(['empanada']);
  });

  it('un número sin unidad son gramos, no la medida ni el plato de antes', () => {
    expect(lista('una taza de café y 30 de leche')).toEqual([[null, 1, 'taza', 'café'], [null, 30, null, 'leche']]);
    expect(lista('un vaso de leche y 30 de cereales')).toEqual([[null, 1, 'vaso', 'leche'], [null, 30, null, 'cereal']]);
    expect(leerFrase('un plato de arroz y 200 de pollo', 'es').dichos.map((d) => [d.cantidad, d.buscado, d.vago ?? false])).toEqual([[1, 'arroz', true], [200, 'pollo', false]]);
    // Pocos, sí: «uno de jugo» es un vaso; y lo contado se sigue contando.
    expect(lista('un vaso de leche y uno de jugo')).toEqual([[null, 1, 'vaso', 'leche'], [null, 1, 'vaso', 'jugo']]);
    expect(lista('20 empanadas de carne y 20 de pollo')).toEqual([[null, 20, null, 'empanada de carne'], [null, 20, null, 'empanada de pollo']]);
    // Después del litro, ml.
    expect(lista('un litro de agua y 500 de jugo')).toEqual([[null, 1, 'l', 'agua'], [null, 500, 'ml', 'jugo']]);
  });
});

describe('la segunda revisión del 27/11/2026', () => {
  /** De cada cosa: cuánto, en qué medida y lo que se busca. */
  const leer = (texto: string, esNombre?: (b: string) => boolean) => leerFrase(texto, 'es', esNombre).dichos.map((d) => [d.cantidad, d.unidad, d.buscado]);
  const conGrupo = (texto: string, esNombre?: (b: string) => boolean) => leerFrase(texto, 'es', esNombre).dichos.map((d) => [d.grupo ?? null, d.buscado]);

  it('lo que se calla después de una docena o de «unas N» es la cosa, nunca «docena», «unas» ni «media»', () => {
    expect(leer('una docena de empanadas, 6 de carne y 6 de jamón y queso')).toEqual([[6, null, 'empanada de carne'], [6, null, 'empanada de jamón y queso']]);
    expect(leer('media docena de huevos y 2 de codorniz')).toEqual([[6, null, 'huevo'], [2, null, 'huevo de codorniz']]);
    expect(leer('media docena de medialunas y 3 de grasa')).toEqual([[6, null, 'medialuna'], [3, null, 'medialuna de grasa']]);
    expect(leer('dos docenas de empanadas y 10 de pollo')).toEqual([[24, null, 'empanada'], [10, null, 'empanada de pollo']]);
    expect(leer('unas 6 empanadas de carne y 6 de pollo')).toEqual([[6, null, 'empanada de carne'], [6, null, 'empanada de pollo']]);
  });

  it('los dos puntos después de lo contado no abren una lista: «tres empanadas: dos de carne y una de pollo»', () => {
    expect(leer('tres empanadas: dos de carne y una de pollo')).toEqual([[2, null, 'empanada de carne'], [1, null, 'empanada de pollo']]);
    expect(leer('4 empanadas: 2 de carne y 2 de pollo')).toEqual([[2, null, 'empanada de carne'], [2, null, 'empanada de pollo']]);
    expect(leerFrase('Almuerzo: 3 empanadas: 2 de carne y 1 de pollo', 'es')).toMatchObject({ comida: 'almuerzo', dichos: [{ cantidad: 2, buscado: 'empanada de carne' }, { cantidad: 1, buscado: 'empanada de pollo' }] });
    expect(leer('dos medialunas: una de grasa y una de manteca')).toEqual([[1, null, 'medialuna de grasa'], [1, null, 'medialuna de manteca']]);
    // Después de un plato que se arma, sí.
    expect(conGrupo('un batido de: banana y leche')).toEqual([['batido', 'banana'], ['batido', 'leche']]);
  });

  it('una bebida con una o dos cosas y sin el líquido es la de la base, si la tiene: como antes', () => {
    const enLaBase = new Set(['licuado de banana', 'batido de proteína', 'licuado de frutilla']);
    const esNombre = (b: string) => enLaBase.has(b);
    expect(conGrupo('un licuado de una banana', esNombre)).toEqual([[null, 'licuado de una banana']]);
    expect(conGrupo('un licuado de banana y frutilla', esNombre)).toEqual([[null, 'licuado de banana y frutilla']]);
    expect(conGrupo('un batido con una cucharada de proteína', esNombre)).toEqual([[null, 'batido'], [null, 'proteína']]);
    // La base lo tiene como licuado: se busca así.
    expect(conGrupo('un smoothie de banana y espinaca', esNombre)).toEqual([[null, 'licuado de banana y espinaca']]);
    expect(conCon('un smoothie de banana y espinaca', 'es')).toEqual(expect.arrayContaining(['smoothie de banana', 'licuado de banana', 'batido de banana']));
    // Con el líquido, con tres cosas, con «con» y dos cosas, o si la base no la tiene, la lista.
    expect(conGrupo('un licuado de banana y frutilla con leche', esNombre).map(([g]) => g)).toEqual(['licuado', 'licuado', 'licuado']);
    expect(conGrupo('un licuado de banana, frutilla y durazno', esNombre).map(([g]) => g)).toEqual(['licuado', 'licuado', 'licuado']);
    expect(conGrupo('un licuado con banana y avena', esNombre)).toEqual([['licuado', 'banana'], ['licuado', 'avena']]);
    expect(conGrupo('un batido de mango y maracuyá', esNombre)).toEqual([['batido', 'mango'], ['batido', 'maracuyá']]);
  });

  it('ya estaba antes: los gramos sin unidad, el kilo, los números con letras, «un tostado» y el helado de la ensalada', () => {
    expect(leer('200 de arroz y 200 de pollo')).toEqual([[200, null, 'arroz'], [200, null, 'pollo']]);
    expect(leer('150 de carne y 150 de puré')).toEqual([[150, null, 'carne'], [150, null, 'puré']]);
    expect(leer('un kilo de asado y dos de chorizo')).toEqual([[1, 'kg', 'asado'], [2, null, 'chorizo']]);
    expect(leer('veinte empanadas de carne y veinte de pollo')).toEqual([[20, null, 'empanada de carne'], [20, null, 'empanada de pollo']]);
    expect(leer('20 alitas y 20 de papas')).toEqual([[20, null, 'alita'], [20, null, 'papa']]);
    expect(leer('un tostado')).toEqual([[1, null, 'tostado de jamón y queso']]);
    expect(leerFrase('ensalada de frutas con helado', 'es', (b) => b === 'ensalada de fruta').dichos.map((d) => [d.buscado, d.acompanante ?? false]))
      .toEqual([['ensalada de fruta', false], ['helado', true]]);
  });

  it('lo tuyo en plural y la comida que nombra: «dos batidos de la mañana», «cena liviana»', () => {
    const tuyos = ['Batido de la mañana', 'Medialuna', 'Cena liviana', 'Asado'];
    const dichos = (texto: string) => leerFrase(texto, 'es', undefined, tuyos).dichos.map((d) => [d.tuyo ?? null, d.cantidad, d.sinDudas ?? false]);
    expect(dichos('dos batidos de la mañana')).toEqual([[0, 2, false]]);
    expect(dichos('dos medialunas')).toEqual([[1, 2, false]]);
    expect(dichos('una medialuna')).toEqual([[1, 1, false]]);
    expect(leerFrase('cena liviana y un vaso de agua', 'es', undefined, tuyos)).toMatchObject({ comida: 'cena', dichos: [{ tuyo: 2 }, { buscado: 'agua' }] });
    expect(leerFrase('mi cena liviana', 'es', undefined, tuyos)).toMatchObject({ comida: 'cena', dichos: [{ tuyo: 2, sinDudas: true }] });
    // Lo que nombra otra comida manda.
    expect(leerFrase('en el almuerzo mi cena liviana', 'es', undefined, tuyos).comida).toBe('almuerzo');
    // Sin dudas: con «mi», con «de siempre» o la frase entera; con una cantidad delante, no.
    expect(dichos('200 g de asado')).toEqual([[3, 200, false]]);
    expect(dichos('mi asado')).toEqual([[3, null, true]]);
    expect(dichos('el asado de siempre')).toEqual([[3, null, true]]);
    expect(dichos('Asado')).toEqual([[3, null, true]]);
  });
});

describe('la frase cortada', () => {
  it('lo que termina en «de» sin el alimento no se busca: «un vaso de» encontraba un refresco y «un plato de», 1665 kcal', () => {
    expect(resumen('un café y una taza de')).toEqual([[1, null, 'café', false]]);
    for (const cortada of ['una taza de', 'una taza de…', 'un vaso de', 'un plato de', 'una porción de', 'dos rebanadas de', 'una lata de', '200 gramos de']) {
      expect(resumen(cortada)).toEqual([]);
    }
    expect(resumen('eggs and a cup of', undefined, 'en')).toEqual([[null, null, 'egg', false]]);
    expect(resumen('a bowl of', undefined, 'en')).toEqual([]);
    // Con el alimento, como siempre.
    expect(resumen('una taza de café')).toEqual([[1, 'taza', 'café', false]]);
  });
});
