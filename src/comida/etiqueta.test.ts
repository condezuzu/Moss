import { describe, expect, it } from '@jest/globals';

import { leerEtiqueta } from './etiqueta';

// Las líneas como las devuelve el reconocimiento de texto: una por renglón de la tabla.
const MERCOSUR = `INFORMACIÓN NUTRICIONAL
Porción 30 g (5 galletitas)
Cantidad por porción %VD(*)
Valor energético 140 kcal = 588 kJ 7
Carbohidratos 20 g 7
Proteínas 2,4 g 3
Grasas totales 5,6 g 10
Grasas saturadas 2,5 g 11
Grasas trans 0 g -
Fibra alimentaria 0,9 g 4
Sodio 105 mg 4
(*) % Valores Diarios con base a una dieta de 2.000 kcal u 8.400 kJ.`.split('\n');

const DOS_COLUMNAS = `INFORMACION NUTRICIONAL
Porción: 200 g (1 vaso)
100 g Porción %VD(*)
Valor energético 76 kcal = 319 kJ 152 kcal = 638 kJ 8
Carbohidratos 11 g 22 g 7
Proteínas 3,2 g 6,4 g 9
Grasas totales 2,1 g 4,2 g 8
Grasas saturadas 1,3 g 2,6 g 12
Sodio 50 mg 100 mg 4`.split('\n');

const ESTADOS_UNIDOS = `Nutrition Facts
8 servings per container
Serving size 2/3 cup (55g)
Amount per serving
Calories 230
% Daily Value*
Total Fat 8g 10%
Saturated Fat 1g 5%
Trans Fat 0g
Cholesterol 0mg 0%
Sodium 160mg 7%
Total Carbohydrate 37g 13%
Dietary Fiber 4g 14%
Total Sugars 12g
Includes 10g Added Sugars 20%
Protein 3g`.split('\n');

const EUROPA = `Valores nutricionales medios por 100 g
Valor energético 1700 kJ / 405 kcal
Grasas 12 g
de las cuales saturadas 5,2 g
Hidratos de carbono 65 g
de los cuales azúcares 22 g
Fibra alimentaria 3,1 g
Proteínas 7,5 g
Sal 0,85 g`.split('\n');

describe('la etiqueta del Mercosur', () => {
  const e = leerEtiqueta(MERCOSUR);

  it('lee la porción y los valores por porción, sin el %VD', () => {
    expect(e.porcion).toEqual({ gramos: 30, texto: '30 g (5 galletitas)' });
    expect(e.porPorcion).toEqual({ kcal: 140, carbohidratos: 20, proteina: 2.4, grasas: 5.6, saturadas: 2.5, fibra: 0.9, sodio: 105 });
    expect(e.por100g).toEqual({});
  });

  it('y los lleva a 100 g para guardar el alimento', () => {
    expect(e.normalizado!.kcal).toBeCloseTo(466.67, 2);
    expect(e.normalizado!.sodio).toBeCloseTo(350, 6);
    expect(e.avisos).toEqual([]);
  });
});

describe('con dos columnas', () => {
  it('cada valor va a su columna: por 100 g y por porción', () => {
    const e = leerEtiqueta(DOS_COLUMNAS);
    expect(e.por100g).toMatchObject({ kcal: 76, carbohidratos: 11, proteina: 3.2, grasas: 2.1, saturadas: 1.3, sodio: 50 });
    expect(e.porPorcion).toMatchObject({ kcal: 152, carbohidratos: 22, proteina: 6.4, grasas: 4.2, sodio: 100 });
    expect(e.normalizado).toMatchObject({ kcal: 76, proteina: 3.2 });
  });

  it('también con las columnas al revés', () => {
    const alReves = DOS_COLUMNAS.map((l) => (l === '100 g Porción %VD(*)' ? 'Porción 100 g %VD(*)' : l))
      .map((l) => l.replace('11 g 22 g', '22 g 11 g'));
    expect(leerEtiqueta(alReves)).toMatchObject({ porPorcion: { carbohidratos: 22 }, por100g: { carbohidratos: 11 } });
  });
});

describe('la de Estados Unidos', () => {
  it('lee el peso de la porción entre paréntesis, las calorías sin unidad y los azúcares totales, no los agregados', () => {
    const e = leerEtiqueta(ESTADOS_UNIDOS);
    expect(e.porcion).toEqual({ gramos: 55, texto: '2/3 cup (55g)' });
    expect(e.porPorcion).toEqual({ kcal: 230, grasas: 8, saturadas: 1, sodio: 160, carbohidratos: 37, fibra: 4, azucares: 12, proteina: 3 });
  });
});

describe('la europea', () => {
  it('por 100 g, las kcal aunque vengan después de los kJ, y la sal como sodio', () => {
    const e = leerEtiqueta(EUROPA);
    expect(e.porcion).toBeNull();
    expect(e.por100g).toEqual({ kcal: 405, grasas: 12, saturadas: 5.2, carbohidratos: 65, azucares: 22, fibra: 3.1, proteina: 7.5, sodio: 340 });
    expect(e.normalizado).toEqual(e.por100g);
    expect(e.avisos).toEqual([]);
  });

  it('un renglón con 100 g de un nutriente no es el encabezado de las columnas', () => {
    const azucar = leerEtiqueta(['Información nutricional por 100 g', 'Valor energético 400 kcal', 'Carbohidratos 100 g', 'Azúcares 100 g', 'Proteínas 0 g', 'Grasas totales 0 g', 'Sodio 0 mg']);
    expect(azucar.por100g).toEqual({ kcal: 400, carbohidratos: 100, azucares: 100, proteina: 0, grasas: 0, sodio: 0 });
    expect(azucar.avisos).toEqual([]);
  });

  it('solo con kJ, los pasa a kcal', () => {
    const e = leerEtiqueta(EUROPA.map((l) => (l.startsWith('Valor energético') ? 'Energía 1700 kJ' : l)));
    expect(e.por100g.kcal).toBe(406);
  });
});

describe('en portugués, y con los octógonos', () => {
  it('lee la tabla de Brasil y no se confunde con los avisos del frente', () => {
    const e = leerEtiqueta([
      'EXCESO EN AZÚCARES', 'EXCESO EN GRASAS SATURADAS', 'INFORMAÇÃO NUTRICIONAL', 'Porção de 30 g (3 biscoitos)',
      'Valor energético 135 kcal = 567 kJ 7%', 'Carboidratos 20 g 7%', 'Açúcares totais 8,1 g', 'Açúcares adicionados 7,9 g 16%',
      'Proteínas 2,0 g 4%', 'Gorduras totais 5,1 g 8%', 'Gorduras saturadas 2,2 g 11%', 'Fibra alimentar 0,6 g 2%', 'Sódio 95 mg 5%',
    ]);
    expect(e.porcion).toEqual({ gramos: 30, texto: 'de 30 g (3 biscoitos)' });
    expect(e.porPorcion).toEqual({ kcal: 135, carbohidratos: 20, azucares: 8.1, proteina: 2, grasas: 5.1, saturadas: 2.2, fibra: 0.6, sodio: 95 });
  });
});

describe('lo que conviene revisar', () => {
  it('con errores de lectura: una O por un cero, sin tildes y sin espacios', () => {
    const e = leerEtiqueta(['Porcion 30g', 'Valor energetico 14O kcal', 'Carbohidratos 2O g', 'Proteinas 2,4g', 'Grasas totales 5.6 g', 'Sodio 105mg']);
    expect(e.porPorcion).toEqual({ kcal: 140, carbohidratos: 20, proteina: 2.4, grasas: 5.6, sodio: 105 });
  });

  it('si las kcal no cierran con los macros, avisa', () => {
    const e = leerEtiqueta(MERCOSUR.map((l) => l.replace('140 kcal', '340 kcal')));
    expect(e.avisos).toEqual(['noCierra']);
  });

  it('si falta un macro o la porción, avisa y no inventa el valor por 100 g', () => {
    const sinGrasas = leerEtiqueta(MERCOSUR.filter((l) => !l.startsWith('Grasas totales')));
    expect(sinGrasas.avisos).toEqual(['faltan']);
    expect(sinGrasas.normalizado).toBeNull();
    const sinPorcion = leerEtiqueta(MERCOSUR.filter((l) => !l.startsWith('Porción')));
    expect(sinPorcion.avisos).toEqual(['sinPorcion']);
    expect(sinPorcion.normalizado).toBeNull();
  });

  it('una porción en ml se toma como gramos, con aviso', () => {
    const e = leerEtiqueta(DOS_COLUMNAS.map((l) => l.replace('Porción: 200 g (1 vaso)', 'Porción: 200 ml (1 vaso)')));
    expect(e.porcion?.gramos).toBe(200);
    expect(e.avisos).toContain('mililitros');
  });
});
