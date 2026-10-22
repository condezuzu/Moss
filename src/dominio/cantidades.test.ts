import { describe, expect, it } from '@jest/globals';

import {
  ACEITE, aCm, aGramos, ajustar, AJUSTES, aKg, aMl, aOjoDeFabrica, comestible, largoEn, pesoCorporalEn, GRAMOS_POR_ONZA, gramosDeMl, ML_POR_ONZA_LIQUIDA, mlDeGramos, pesoEn,
  sistemaDeRegion, volumenEn,
} from './cantidades';

describe('la parte comestible', () => {
  it('lo pesado con cáscara o hueso descuenta lo que no se come', () => {
    // Una banana de 180 g con cáscara: un 36 % es cáscara.
    expect(comestible(180, 0.36)).toBeCloseTo(115.2, 6);
  });

  it('sin desecho, o con uno que no tiene sentido, queda igual', () => {
    expect(comestible(150, null)).toBe(150);
    expect(comestible(150, 0)).toBe(150);
    expect(comestible(150, 1)).toBe(150);
  });
});

describe('los líquidos en ml', () => {
  it('con la densidad de cada uno: 250 ml de leche entera pesan 257,5 g', () => {
    expect(gramosDeMl(250, 1.03)).toBeCloseTo(257.5, 6);
    expect(mlDeGramos(257.5, 1.03)).toBeCloseTo(250, 6);
  });

  it('sin densidad, como el agua', () => {
    expect(gramosDeMl(200, null)).toBe(200);
    expect(mlDeGramos(200, undefined)).toBe(200);
  });
});

describe('el sistema métrico o el imperial', () => {
  it('lo escrito en onzas se guarda en gramos, y en onzas líquidas o tazas, en ml', () => {
    expect(aGramos(4, 'oz')).toBeCloseTo(4 * GRAMOS_POR_ONZA, 6);
    expect(aGramos(100, 'g')).toBe(100);
    expect(aMl(8, 'floz')).toBeCloseTo(8 * ML_POR_ONZA_LIQUIDA, 6);
    expect(aMl(1, 'taza')).toBe(240);
  });

  it('se muestra en el sistema de cada uno: 150 g son 5,3 oz y 250 ml, 8,5 fl oz', () => {
    expect(pesoEn(150, 'metrico')).toEqual({ valor: 150, unidad: 'g' });
    expect(pesoEn(150, 'imperial')).toEqual({ valor: 5.3, unidad: 'oz' });
    expect(volumenEn(250, 'imperial')).toEqual({ valor: 8.5, unidad: 'floz' });
  });

  it('el de fábrica sale del país: Estados Unidos usa el imperial', () => {
    expect(sistemaDeRegion('US')).toBe('imperial');
    expect(sistemaDeRegion('UY')).toBe('metrico');
    expect(sistemaDeRegion(null)).toBe('metrico');
  });
});

describe('los ajustes rápidos y el aceite', () => {
  it('×½, ×1½ y ×2 sobre la porción, sin tipear', () => {
    expect(AJUSTES).toEqual([0.5, 1.5, 2]);
    expect(ajustar(1, 0.5)).toBe(0.5);
    expect(ajustar(1.5, 2)).toBe(3);
    expect(ajustar(1, 1.5)).toBe(1.5);
  });

  it('el aceite de cocción en porciones simples: una cucharada es 13,6 g', () => {
    expect(ACEITE.cucharadita).toBe(4.5);
    expect(ACEITE.cucharada).toBe(13.6);
    expect(ACEITE.nada).toBe(0);
  });
});

describe('pesado o a ojo, de fábrica', () => {
  it('lo escrito en gramos es pesado; una porción casera, a ojo; lo de un envase, pesado', () => {
    expect(aOjoDeFabrica({ gramos: 150 })).toBe(false);
    expect(aOjoDeFabrica({ porcion: '1 taza' })).toBe(true);
    expect(aOjoDeFabrica({ porcion: '1 unidad mediana' })).toBe(true);
    expect(aOjoDeFabrica({ porcion: '1 lata' })).toBe(false);
    expect(aOjoDeFabrica({ porcion: '1 paquete (250 g)' })).toBe(false);
    expect(aOjoDeFabrica({ porcion: '1 can' })).toBe(false);
    // «Canela» no es una lata.
    expect(aOjoDeFabrica({ porcion: '1 cucharadita de canela' })).toBe(true);
  });
});

describe('el cuerpo en el sistema de cada uno', () => {
  it('el peso en libras y las medidas en pulgadas, guardados en kg y cm', () => {
    expect(pesoCorporalEn(80, 'imperial')).toEqual({ valor: 176.4, unidad: 'lb' });
    expect(pesoCorporalEn(80.04, 'metrico')).toEqual({ valor: 80, unidad: 'kg' });
    expect(aKg(176.4, 'imperial')).toBeCloseTo(80.01, 2);
    expect(aKg(80, 'metrico')).toBe(80);
    expect(largoEn(85.5, 'imperial')).toEqual({ valor: 33.7, unidad: 'in' });
    expect(aCm(33.7, 'imperial')).toBeCloseTo(85.6, 1);
  });
});
