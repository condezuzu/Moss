/**
 * Con una base chica armada acá, con el mismo esquema que assets/alimentos.db (herramientas/alimentos.mjs).
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';

import { alimentoPorCodigo, detalleDeAlimento, formasDelCodigo, rindeAlCocinar } from './detalle';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE alimentos (id INTEGER PRIMARY KEY, fuente TEXT, descripcion TEXT, nombre_es TEXT, nombre_en TEXT, categoria TEXT, kcal REAL, proteina REAL,
    carbohidratos REAL, grasas REAL, fibra REAL, azucares REAL, saturadas REAL, sodio REAL, alcohol REAL, porcion INTEGER, marca TEXT, densidad REAL,
    desecho REAL, desecho_es TEXT, desecho_en TEXT, aceite TEXT, crudo INTEGER, atribucion TEXT);
  CREATE TABLE porciones (id INTEGER PRIMARY KEY, alimento INTEGER, en TEXT, es TEXT, gramos REAL);
  CREATE TABLE alias (alimento INTEGER, texto TEXT, region TEXT, principal INTEGER);
  CREATE TABLE codigos (codigo TEXT PRIMARY KEY, alimento INTEGER);
  CREATE TABLE recetas (plato INTEGER PRIMARY KEY, peso_final REAL);
  CREATE TABLE ingredientes (plato INTEGER, ingrediente INTEGER, gramos REAL);
  INSERT INTO alimentos (id, fuente, descripcion, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas, fibra, desecho, desecho_es, desecho_en) VALUES
    (1, 'sr', 'Bananas, raw', 'Banana', 'Banana', 89, 1.1, 22.8, 0.3, 2.6, 0.36, 'cáscara', 'peel');
  INSERT INTO alimentos (id, fuente, descripcion, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas) VALUES
    (2, 'sr', 'Rice, white, raw', 'Arroz blanco crudo', 'White rice, raw', 365, 7.1, 80, 0.7);
  INSERT INTO alimentos (id, fuente, descripcion, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas, crudo) VALUES
    (3, 'sr', 'Rice, white, cooked', 'Arroz blanco cocido', 'White rice, cooked', 130, 2.7, 28, 0.3, 2),
    (4, 'fndds', 'Rice, fried', 'Arroz salteado', 'Stir-fried rice', 170, 3.5, 30, 4, 2);
  UPDATE alimentos SET aceite = 'preguntar' WHERE id = 4;
  INSERT INTO alimentos (id, fuente, descripcion, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas, marca, densidad, atribucion) VALUES
    (-10001, 'producto', 'Whole milk', 'Leche entera', 'Whole milk', 61, 3.1, 4.8, 3.2, 'Marca', 1.03, 'off');
  INSERT INTO alimentos (id, fuente, descripcion, nombre_es, nombre_en, kcal, proteina, carbohidratos, grasas) VALUES
    (-5001, 'receta', 'Rice pudding', 'Arroz con leche', 'Rice pudding', 120, 3, 20, 3);
  INSERT INTO porciones (alimento, en, es, gramos) VALUES (1, '1 medium', '1 mediana', 118), (1, '1 large', '1 grande', 136), (-10001, '1 glass', '1 vaso', 206), (3, '1 cup', null, 158);
  INSERT INTO alias VALUES (1, 'plátano', 'MX', 1);
  INSERT INTO codigos VALUES ('7730000000017', -10001), ('012345678905', -10001);
  INSERT INTO recetas VALUES (-5001, 900);
  INSERT INTO ingredientes VALUES (-5001, 2, 100), (-5001, -10001, 800);
`);
const base = { getAllAsync: async <T,>(sql: string, ...parametros: (string | number)[]) => db.prepare(sql).all(...parametros) as T[] };

describe('el detalle de un alimento', () => {
  it('trae las porciones en el idioma de la app y lo que no se come', async () => {
    const banana = await detalleDeAlimento(base, 1, { idioma: 'es', region: 'UY' });
    expect(banana).toMatchObject({ nombre: 'Banana', origen: 'usda', porciones: [{ nombre: '1 mediana', gramos: 118 }, { nombre: '1 grande', gramos: 136 }] });
    expect(banana?.desecho).toEqual({ fraccion: 0.36, que: 'cáscara' });
    expect(banana?.por100g.fibra).toBe(2.6);
    expect(banana?.por100g.sodio).toBeUndefined();
    expect((await detalleDeAlimento(base, 1, { idioma: 'en' }))?.desecho?.que).toBe('peel');
  });

  it('en español, con el nombre de la región', async () => {
    expect((await detalleDeAlimento(base, 1, { idioma: 'es', region: 'MX' }))?.nombre).toBe('Plátano');
  });

  it('una porción sin traducir se muestra en inglés antes que perderla', async () => {
    expect((await detalleDeAlimento(base, 3, { idioma: 'es' }))?.porciones).toEqual([{ nombre: '1 cup', gramos: 158 }]);
  });

  it('lo cocido conoce su crudo y sus hermanas; lo crudo, todas sus formas cocidas', async () => {
    const cocido = await detalleDeAlimento(base, 3, { idioma: 'es' });
    expect(cocido?.crudo).toEqual({ id: 2, nombre: 'Arroz blanco crudo' });
    expect(cocido?.cocidos).toEqual([{ id: 4, nombre: 'Arroz salteado' }]);
    const crudo = await detalleDeAlimento(base, 2, { idioma: 'es' });
    expect(crudo?.crudo).toBeNull();
    expect(crudo?.cocidos.map((c) => c.id)).toEqual([3, 4]);
    expect((await detalleDeAlimento(base, 4, { idioma: 'es' }))?.aceite).toBe('preguntar');
  });

  it('un producto dice su marca, su densidad y que los datos son de Open Food Facts', async () => {
    expect(await detalleDeAlimento(base, -10001, { idioma: 'es' })).toMatchObject({ origen: 'producto', marca: 'Marca', densidad: 1.03, atribucion: 'off' });
  });

  it('un plato hecho receta trae lo que pesa terminado y sus ingredientes', async () => {
    expect((await detalleDeAlimento(base, -5001, { idioma: 'es' }))?.receta).toEqual({
      pesoFinal: 900, ingredientes: [{ nombre: 'Arroz blanco crudo', gramos: 100 }, { nombre: 'Leche entera', gramos: 800 }],
    });
  });

  it('lo que no está es null', async () => {
    expect(await detalleDeAlimento(base, 999, { idioma: 'es' })).toBeNull();
  });
});

describe('el código de barras', () => {
  it('encuentra el producto, también si el iPhone le puso un 0 adelante al UPC', async () => {
    expect(await alimentoPorCodigo(base, '7730000000017')).toBe(-10001);
    expect(await alimentoPorCodigo(base, '0012345678905')).toBe(-10001);
    expect(await alimentoPorCodigo(base, '123')).toBeNull();
    expect(formasDelCodigo(' 0012345678905 ')).toEqual(['0012345678905', '012345678905']);
    expect(formasDelCodigo('abc')).toEqual([]);
  });
});

describe('cuánto rinde al cocinar', () => {
  it('por las calorías de las dos versiones: 100 g de arroz crudo dan unos 280 g cocido', () => {
    expect(rindeAlCocinar(365, 130)).toBeCloseTo(2.81, 2);
    expect(rindeAlCocinar(0, 130)).toBeNull();
    expect(rindeAlCocinar(900, 10)).toBeNull();
  });
});
