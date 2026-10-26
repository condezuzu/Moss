import { describe, expect, it } from '@jest/globals';

import { API, buscarEnOff, codigosPosibles, productoDe, type Pedir } from './off';

// Una respuesta de la API 2, con los campos que se piden. Los números son los de unas galletitas de
// ejemplo, no de un producto real.
const GALLETITAS = {
  code: '7730205000011',
  status: 1,
  product: {
    code: '7730205000011',
    product_name: 'Galletitas María',
    product_name_es: 'Galletitas María',
    product_name_en: '',
    brands: 'Marca de Ejemplo, Otra',
    serving_size: '30 g (5 galletitas)',
    serving_quantity: 30,
    nutriments: {
      'energy-kcal_100g': 440, energy_100g: 1841, proteins_100g: 7.5, carbohydrates_100g: 72, fat_100g: 13.5,
      fiber_100g: 2.4, sugars_100g: 20, 'saturated-fat_100g': 6.1, sodium_100g: 0.35,
      'energy-kcal_serving': 132,
    },
  },
};

describe('el producto', () => {
  it('el nombre en el idioma de la app, la marca, los valores por 100 g con el sodio en mg, y la porción', () => {
    const p = productoDe(GALLETITAS, 'es')!;
    expect(p).toEqual({
      codigo: '7730205000011', nombre: 'Galletitas María', marca: 'Marca de Ejemplo', completo: true, avisos: [], verificado: true,
      por100g: { kcal: 440, proteina: 7.5, carbohidratos: 72, grasas: 13.5, fibra: 2.4, azucares: 20, saturadas: 6.1, sodio: 350 },
      porcion: { texto: '30 g (5 galletitas)', gramos: 30 },
    });
  });

  it('sin el nombre en inglés, usa el general', () => {
    expect(productoDe(GALLETITAS, 'en')!.nombre).toBe('Galletitas María');
  });

  it('sin kcal, las saca de los kJ', () => {
    const { 'energy-kcal_100g': _, ...sinKcal } = GALLETITAS.product.nutriments;
    expect(productoDe({ ...GALLETITAS, product: { ...GALLETITAS.product, nutriments: sinKcal } }, 'es')!.por100g.kcal).toBe(440);
  });

  it('si falta un macro, no está completo: conviene la etiqueta', () => {
    const { fat_100g: _, ...sinGrasas } = GALLETITAS.product.nutriments;
    const p = productoDe({ ...GALLETITAS, product: { ...GALLETITAS.product, nutriments: sinGrasas } }, 'es')!;
    expect(p.completo).toBe(false);
    expect('grasas' in p.por100g).toBe(false);
  });

  it('avisa si las kcal no cierran con los macros o si la porción no cierra con lo de 100 g', () => {
    const malo = { ...GALLETITAS.product.nutriments, 'energy-kcal_100g': 250, 'energy-kcal_serving': 200 };
    expect(productoDe({ ...GALLETITAS, product: { ...GALLETITAS.product, nutriments: malo } }, 'es')!.avisos).toEqual(['noCierra', 'porcionNoCierra']);
  });

  it('lo imposible no pasa los controles: queda sin verificar', () => {
    const imposible = { ...GALLETITAS.product.nutriments, carbohidratos_100g: 72, sugars_100g: 80 };
    const p = productoDe({ ...GALLETITAS, product: { ...GALLETITAS.product, nutriments: imposible } }, 'es')!;
    expect(p.avisos).toEqual(['imposible']);
    expect(p.verificado).toBe(false);
    const sinGrasas = { ...GALLETITAS.product.nutriments } as Record<string, number>;
    delete sinGrasas.fat_100g;
    expect(productoDe({ ...GALLETITAS, product: { ...GALLETITAS.product, nutriments: sinGrasas } }, 'es')!.verificado).toBe(false);
  });

  it('una etiqueta europea, con la fibra aparte a 2 kcal, cierra', () => {
    // Pan integral: 6 g de fibra que los carbohidratos (41 g) no cuentan.
    const pan = { status: 1, product: { code: '2', product_name: 'Pan integral', nutriments: { 'energy-kcal_100g': 250, proteins_100g: 9, carbohydrates_100g: 41, fat_100g: 3.5, fiber_100g: 6 } } };
    expect(productoDe(pan, 'es')!.avisos).toEqual([]);
  });

  it('las vitaminas y los minerales vienen en gramos y se pasan a mg o µg; lo imposible no se guarda', () => {
    const leche = { status: 1, product: { code: '3', product_name: 'Leche', nutriments: {
      'energy-kcal_100g': 61, proteins_100g: 3.2, carbohydrates_100g: 4.8, fat_100g: 3.3, calcium_100g: 0.12, 'vitamin-d_100g': 0.0000011, 'vitamin-a_100g': 0.00005,
      'vitamin-c_100g': 90, cholesterol_100g: 0.012,
    } } };
    const m = productoDe(leche, 'es')!.por100g.micros!;
    expect(m.calcio).toBeCloseTo(120, 6);
    expect(m.vitaminaD).toBeCloseTo(1.1, 6);
    expect(m.vitaminaA).toBeCloseTo(50, 6);
    expect(m.colesterol).toBeCloseTo(12, 6);
    expect('vitaminaC' in m).toBe(false);
  });

  it('el alcohol viene en % de volumen y se pasa a gramos', () => {
    const vino = { status: 1, product: { code: '1', product_name: 'Tannat', nutriments: { 'energy-kcal_100g': 83, proteins_100g: 0.1, carbohydrates_100g: 2.6, fat_100g: 0, alcohol_100g: 13 } } };
    expect(productoDe(vino, 'es')!.por100g.alcohol).toBeCloseTo(10.257, 3);
  });

  it('lo que no es un producto no es nada', () => {
    expect(productoDe({ status: 0, status_verbose: 'product not found' }, 'es')).toBeNull();
    expect(productoDe(null, 'es')).toBeNull();
    expect(productoDe({ status: 1, product: { nutriments: {} } }, 'es')).toBeNull();
  });
});

describe('buscar un código', () => {
  it('el UPC-A llega del iPhone con un 0 adelante: se prueba de las dos formas', () => {
    expect(codigosPosibles('0049000028911')).toEqual(['0049000028911', '049000028911']);
    expect(codigosPosibles('049000028911')).toEqual(['049000028911', '0049000028911']);
    expect(codigosPosibles(' 7730-2050 ')).toEqual(['77302050']);
  });

  it('pregunta con la versión fija y el User-Agent, y si no está con una forma prueba la otra', async () => {
    const pedidos: { url: string; agente: string }[] = [];
    const pedir: Pedir = async (url, init) => {
      pedidos.push({ url, agente: init.headers['User-Agent'] });
      const encontrado = url.includes('/049000028911.json');
      return { ok: encontrado, status: encontrado ? 200 : 404, json: async () => ({ ...GALLETITAS, code: '049000028911' }) };
    };
    const p = await buscarEnOff('0049000028911', { idioma: 'es', version: '1.0.0', contacto: 'contacto@ejemplo.uy', pedir });
    expect(p?.nombre).toBe('Galletitas María');
    expect(pedidos.map((x) => x.url.replace(API, '').split('?')[0])).toEqual(['0049000028911.json', '049000028911.json']);
    expect(pedidos[0].agente).toBe('Moss/1.0.0 (contacto@ejemplo.uy)');
  });

  it('si no está en ningún lado devuelve null, y si Open Food Facts se cae, el error sube', async () => {
    const noEsta: Pedir = async () => ({ ok: false, status: 404, json: async () => ({}) });
    expect(await buscarEnOff('7730205000011', { idioma: 'es', version: '1', contacto: 'x', pedir: noEsta })).toBeNull();
    const caido: Pedir = async () => ({ ok: false, status: 503, json: async () => ({}) });
    await expect(buscarEnOff('7730205000011', { idioma: 'es', version: '1', contacto: 'x', pedir: caido })).rejects.toThrow('503');
  });

  it('si Open Food Facts no contesta a tiempo, el error sube y se corta el pedido', async () => {
    let cortado = false;
    const colgado: Pedir = (_, init) => new Promise(() => { init.signal?.addEventListener('abort', () => { cortado = true; }); });
    await expect(buscarEnOff('7730205000011', { idioma: 'es', version: '1', contacto: 'x', pedir: colgado, espera: 20 })).rejects.toThrow('a tiempo');
    expect(cortado).toBe(true);
  });
});
