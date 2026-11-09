/**
 * Contra la base de verdad (assets/alimentos.db, la arma `npm run alimentos`), con el SQLite de Node.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import { buscarAlimentos, candidatosEnMemoria, consultaDePalabras, consultaDeTrigramas, mejoresPorAlimento, normalizar, parecido, textoEnMemoria, type Opciones } from './buscar';

const db = new DatabaseSync(join(__dirname, '../../assets/alimentos.db'), { readOnly: true });
const base = { getAllAsync: async <T,>(sql: string, ...parametros: (string | number)[]) => db.prepare(sql).all(...parametros) as T[] };
const idDe = (nombreEs: string) => (db.prepare('SELECT id FROM alimentos WHERE nombre_es = ?').get(nombreEs) as { id: number }).id;

const buscar = (texto: string, op: Partial<Opciones> = {}) => buscarAlimentos(base, texto, { idioma: 'es', region: 'UY', ...op });
const primero = async (texto: string, op?: Partial<Opciones>) => (await buscar(texto, op))[0];

describe('lo escrito', () => {
  it('se compara sin tildes ni mayúsculas', () => {
    expect(normalizar('  Puré de PAPAS, ¡ya! ')).toBe('pure de papas ya');
  });

  it('cada palabra es un prefijo, y nada de lo escrito rompe la consulta', () => {
    expect(consultaDePalabras('pech poll')).toBe('"pech"* "poll"*');
    expect(consultaDePalabras('100% "jugo" OR *')).toBe('"100"* "jugo"* "or"*');
    expect(consultaDePalabras(' ¡¿ ')).toBeNull();
  });

  it('los trigramas van en OR, y lo corto no tiene', () => {
    expect(consultaDeTrigramas('frutila')).toBe('"fru" OR "rut" OR "uti" OR "til" OR "ila"');
    expect(consultaDeTrigramas('pa')).toBeNull();
  });

  it('el parecido perdona un error y no mucho más', () => {
    expect(parecido('frutila', 'frutillas')).toBeGreaterThan(0.8);
    expect(parecido('manzaan', 'Manzana')).toBeGreaterThanOrEqual(0.75);
    expect(parecido('atun', 'yogurt natural')).toBeLessThan(0.75);
  });
});

describe('buscar alimentos', () => {
  it('lo de todos los días sale primero', async () => {
    expect((await primero('banana')).nombre).toBe('Banana');
    expect((await primero('arroz')).nombre).toBe('Arroz blanco cocido');
    expect((await primero('leche')).nombre).toBe('Leche entera');
    expect((await primero('huevo')).nombre).toBe('Huevo');
    expect((await primero('cafe con leche')).nombre).toBe('Café con leche');
    expect((await primero('milanesa')).nombre).toBe('Milanesa');
  });

  it('la palabra entera va antes que el principio de otra', async () => {
    const nombres = (await buscar('pan')).slice(0, 4).map((r) => r.nombre);
    expect(nombres.every((n) => n.startsWith('Pan '))).toBe(true);
  });

  it('cada región con su nombre', async () => {
    expect(await primero('aguacate')).toMatchObject({ id: idDe('Aguacate'), nombre: 'Palta' });
    expect(await primero('palta', { region: 'MX' })).toMatchObject({ id: idDe('Aguacate'), nombre: 'Aguacate', coincide: 'palta' });
    expect((await primero('quinua', { region: 'PE' })).nombre).toBe('Quinua');
    // Plátano es banana en España y el plátano de cocinar en Colombia.
    expect((await primero('platano', { region: 'ES' })).id).toBe(idDe('Banana'));
    expect((await primero('platano', { region: 'CO' })).id).toBe(idDe('Plátano verde'));
  });

  it('con errores de tipeo también encuentra', async () => {
    expect(await primero('frutila')).toMatchObject({ id: idDe('Fresas'), nombre: 'Frutillas' });
    expect((await primero('manzaan')).id).toBe(idDe('Manzana'));
    expect((await primero('polo frito')).id).toBe(idDe('Pollo frito'));
  });

  it('con errores, el principio del nombre va antes que una palabra del medio, aunque se use más', async () => {
    const yogur = idDe('Yogur con frutas');
    expect((await primero('frutila', { premio: (id) => (id === yogur ? 6 : 0) })).id).toBe(idDe('Fresas'));
  });

  it('en inglés: los nombres curados y, si no, los de USDA', async () => {
    // En inglés el sustantivo va al final: primero la pechuga sola (cruda o cocida), no un plato con pechuga.
    expect((await primero('chicken breast', { idioma: 'en', region: 'US' })).nombre).toMatch(/^(Raw|Grilled|Baked|Boiled) chicken breast$/);
    expect((await buscar('pechuga de pollo')).slice(0, 3).map((r) => r.nombre)).not.toContainEqual(expect.stringMatching(/ con /));
    expect((await primero('banana', { idioma: 'en', region: 'US' })).nombre).toBe('Banana');
    // Lo que no está curado se encuentra igual, con su nombre de USDA.
    expect((await primero('kohlrabi', { idioma: 'en' })).nombre).toMatch(/^Kohlrabi/);
  });

  it('lo más usado sube', async () => {
    const pechuga = idDe('Pechuga de pollo a la plancha');
    expect((await primero('pech')).id).not.toBe(pechuga);
    expect((await primero('pech', { premio: (id) => (id === pechuga ? 10 : 0) })).id).toBe(pechuga);
  });

  it('cada resultado trae sus valores por 100 g y su porción de siempre', async () => {
    expect(await primero('banana')).toMatchObject({ kcal: 89, proteina: 1.09, carbohidratos: 22.84, grasas: 0.33, curado: true, porcion: { nombre: '1 mediana', gramos: 118 } });
  });

  it('los platos uruguayos, que la base calcula como recetas con sus ingredientes', async () => {
    expect(await primero('faina')).toMatchObject({ nombre: 'Fainá', curado: true, porcion: { nombre: '1 porción', gramos: 75 } });
    expect((await primero('chivito')).nombre).toBe('Chivito');
    expect((await primero('napolitana')).nombre).toBe('Milanesa a la napolitana');
    const torta = await primero('torta frita');
    expect(torta.nombre).toBe('Torta frita');
    // Una torta frita, entre 250 y 350 kcal.
    expect((torta.kcal * torta.porcion!.gramos) / 100).toBeGreaterThan(250);
    expect((torta.kcal * torta.porcion!.gramos) / 100).toBeLessThan(350);
  });

  it('y lo secundario, cuando la base lo tiene: fibra, azúcares, saturadas y sodio (en mg)', async () => {
    expect(await primero('banana')).toMatchObject({ fibra: 2.6, azucares: 12.23, saturadas: 0.11, sodio: 1 });
    expect('fibra' in (await primero('aceto'))).toBe(false);
  });

  it('lo vacío o raro no rompe nada', async () => {
    expect(await buscar('')).toEqual([]);
    await expect(buscar('100% "jugo" OR *')).resolves.toBeInstanceOf(Array);
    await expect(buscar('a')).resolves.toBeInstanceOf(Array);
  });

  it('lo corto con un error no trae cualquier cosa: «coke» no es «Cooked taro»', async () => {
    expect((await buscar('coke', { idioma: 'en', region: 'US' })).map((r) => r.nombre)).not.toContainEqual(expect.stringMatching(/^Cooked/));
  });
});

describe('la comida de las cadenas (alimentos/cadenas.txt)', () => {
  it('se encuentra por su nombre y por cómo se la llama', async () => {
    expect((await primero('big mac'))?.nombre).toBe('Big Mac');
    expect((await primero('cuarto de libra'))?.nombre).toMatch(/^Cuarto de Libra/);
    expect((await primero('mcnuggets'))?.nombre).toBe('Chicken McNuggets');
  });

  it('cada una dice de dónde salen sus valores; lo que no es oficial, que es aproximado', () => {
    const filas = db.prepare(`SELECT nombre_es, fuente_texto, aproximado, marca FROM alimentos WHERE id IN (SELECT id FROM alimentos WHERE fuente_texto IS NOT NULL)`).all() as { nombre_es: string; fuente_texto: string; aproximado: number | null; marca: string }[];
    expect(filas.length).toBeGreaterThanOrEqual(100);
    expect(filas.every((f) => f.fuente_texto.length > 5 && f.marca)).toBe(true);
    const bigMac = filas.find((f) => f.nombre_es === 'Big Mac')!;
    expect(bigMac).toMatchObject({ aproximado: null });
    expect(bigMac.fuente_texto).toMatch(/McDonald's Uruguay/);
    // Mostaza y La Pasiva no publican sus valores: todo lo suyo es aproximado.
    const sinTabla = filas.filter((f) => f.marca === 'Mostaza' || f.marca === 'La Pasiva');
    expect(sinTabla.length).toBeGreaterThan(10);
    expect(sinTabla.every((f) => f.aproximado === 1)).toBe(true);
  });
});

describe('las marcas', () => {
  const nombres = async (q: string, op: Partial<Opciones> = {}) => (await buscar(q, op)).map((r) => r.nombre);

  it('lo genérico va antes que cada marca', async () => {
    const lista = await nombres('leche');
    expect(lista[0]).toBe('Leche entera');
    expect(lista.slice(0, 5).some((n) => /conaprole|claldy|parmalat/i.test(n))).toBe(false);
  });

  it('lo escrito nombra la marca: el producto genérico y enseguida los de la marca, en su orden', async () => {
    const lista = await nombres('mostaza');
    expect(lista[0]).toBe('Mostaza');
    const hamburguesa = lista.findIndex((n) => /^Hamburguesa/.test(n));
    const postre = lista.findIndex((n) => /Medialuna|Budín|Helado/.test(n));
    expect(hamburguesa).toBeGreaterThan(0);
    expect(hamburguesa).toBeLessThan(6);
    if (postre >= 0) expect(hamburguesa).toBeLessThan(postre);
  });

  it.each([
    ['kelloggs', "Kellogg's"],
    ["kellogg's", "Kellogg's"],
    ['kell', "Kellogg's"],
    ['nesquik', 'Nesquik'],
    ['lays', "Lay's"],
    ['pepsi', 'Pepsi'],
    ['coca cola', 'Coca-Cola'],
    ['cocacola', 'Coca-Cola'],
    ['conaprole', 'Conaprole'],
    ['bagley', 'Bagley'],
    ['mcdonalds', "McDonald's"],
    ['dominos', "Domino's"],
    ['kfc', 'KFC'],
    ['grido', 'Grido'],
    ['pasiva', 'La Pasiva'],
    ['burger king', 'Burger King'],
  ])('«%s» encuentra la marca, y arriba', async (q, marca) => {
    const lista = await buscar(q);
    expect(lista.length).toBeGreaterThan(0);
    expect(lista.slice(0, 3).some((r) => r.marca === marca || r.nombre.includes(marca))).toBe(true);
  });

  it('la marca entera va antes que otra que empieza igual: Pepsi, y después PepsiCo', async () => {
    const lista = await buscar('pepsi', { limite: 60 });
    const pepsico = lista.findIndex((r) => /^pepsico$/i.test(r.marca ?? ''));
    if (pepsico >= 0) expect(lista.slice(0, pepsico).every((r) => r.marca === 'Pepsi')).toBe(true);
  });

  it.each([
    ['zucaritas', /Zucaritas/],
    ['tita', /Tita/],
    ['oreo', /Oreo/],
    ['big mac', /Big Mac/],
    ['whopper', /Whopper/],
  ])('«%s» encuentra el producto', async (q, nombre) => {
    expect((await nombres(q)).slice(0, 4).some((n) => nombre.test(n))).toBe(true);
  });

  it('marca y producto a la vez', async () => {
    const lista = await buscar('leche conaprole');
    expect(lista[0].marca).toBe('Conaprole');
    expect(lista[0].nombre).toMatch(/leche/i);
    expect(await nombres('combo mostaza')).toEqual(expect.arrayContaining([expect.stringMatching(/^Combo .*Mostaza$/)]));
  });

  it('el menú de una cadena: primero lo principal, después los combos y al final lo demás', async () => {
    const lista = await nombres('mostaza', { limite: 100 });
    const lugar = (patron: RegExp) => lista.findIndex((n) => patron.test(n));
    expect(lugar(/^Hamburguesa Mostaza/)).toBeLessThan(lugar(/^Combo/));
    const postre = lugar(/Muffin|Dona|Helado|Sundae/);
    if (postre >= 0) expect(lugar(/^Combo/)).toBeLessThan(postre);
  });

  it('con la marca nombrada, más resultados: se ve el menú entero', async () => {
    const corta = await nombres('conaprole', { limite: 10 });
    const larga = await nombres('conaprole', { limite: 10, limiteDeMarca: 40 });
    expect(corta).toHaveLength(10);
    expect(larga.length).toBeGreaterThan(10);
    // Sin marca nombrada, el límite de siempre.
    expect(await nombres('arroz', { limite: 10, limiteDeMarca: 40 })).toHaveLength(10);
  });

  it('una marca que se llama como una palabra no se come lo genérico', async () => {
    const lista = await nombres('pan');
    expect(lista.slice(0, 3).some((n) => /^Pan\b/.test(n))).toBe(true);
  });
});

describe('lo que se vende en cada país (paises en la base)', () => {
  const paisesDe = new Map((db.prepare('SELECT id, paises FROM alimentos WHERE paises IS NOT NULL').all() as { id: number; paises: string }[]).map((f) => [f.id, f.paises.split(' ')]));
  const soloEnUruguay = (id: number) => paisesDe.get(id)?.length === 1 && paisesDe.get(id)![0] === 'UY';
  const marcas = (marca: string) => db.prepare('SELECT paises FROM alimentos WHERE marca = ?').all(marca) as { paises: string | null }[];

  it('lo del súper de Uruguay y las cadenas regionales dicen sus países; lo genérico y las cadenas globales, ninguno', () => {
    expect(marcas('Conaprole').every((f) => f.paises === 'UY')).toBe(true);
    expect(marcas('Mostaza').every((f) => f.paises === 'AR PY UY')).toBe(true);
    expect(marcas('La Pasiva').every((f) => f.paises === 'UY')).toBe(true);
    for (const global of ["McDonald's", 'Burger King', 'Starbucks', 'KFC', 'Subway']) expect(marcas(global).every((f) => f.paises === null)).toBe(true);
    expect(db.prepare("SELECT count(*) AS n FROM alimentos WHERE paises IS NOT NULL AND marca IS NULL").get()).toEqual({ n: 0 });
    expect(paisesDe.has(idDe('Chivito'))).toBe(false);
  });

  it.each(['MX', 'ES'])('en %s, «mostaza» es la mostaza y no el menú de la cadena', async (region) => {
    const lista = await buscar('mostaza', { region, limite: 10, limiteDeMarca: 40 });
    expect(lista[0].nombre).toBe('Mostaza');
    // Nombrar la marca no la sube ni agranda la lista: Mostaza no está ahí.
    expect(lista).toHaveLength(10);
    expect(lista.slice(0, 5).some((r) => r.marca === 'Mostaza')).toBe(false);
    expect(lista.slice(0, 3).every((r) => !r.marca)).toBe(true);
  });

  it.each(['MX', 'ES'])('en %s, «leche» y «galletitas» no traen productos de Uruguay entre los primeros 10', async (region) => {
    for (const q of ['leche', 'galletitas', 'galletas', 'yogur', 'queso']) {
      const lista = await buscar(q, { region, limite: 10 });
      expect(lista).toHaveLength(10);
      expect(lista.filter((r) => soloEnUruguay(r.id)).map((r) => r.nombre)).toEqual([]);
    }
  });

  it('en Uruguay, lo de siempre: la mostaza y enseguida el menú de Mostaza, con la lista larga', async () => {
    const lista = await buscar('mostaza', { limite: 10, limiteDeMarca: 40 });
    expect(lista[0].nombre).toBe('Mostaza');
    expect(lista.length).toBeGreaterThan(10);
    expect(lista.slice(0, 6).some((r) => r.marca === 'Mostaza' && /^Hamburguesa/.test(r.nombre))).toBe(true);
  });

  it('en Argentina y Paraguay, Mostaza sí está', async () => {
    for (const region of ['AR', 'PY']) expect((await buscar('mostaza', { region })).slice(0, 6).some((r) => r.marca === 'Mostaza')).toBe(true);
  });

  it('sin saber el país, como en Uruguay: nada se esconde', async () => {
    const sinPais = await buscar('mostaza', { region: undefined, limite: 10, limiteDeMarca: 40 });
    expect(sinPais.slice(0, 6).some((r) => r.marca === 'Mostaza')).toBe(true);
    expect((await buscar('leche conaprole', { region: undefined }))[0].marca).toBe('Conaprole');
  });

  it.each(['UY', 'MX', 'ES', 'US', 'AR', undefined])('«big mac» y «whopper» se encuentran en cualquier país (%s)', async (region) => {
    expect((await buscar('big mac', { region }))[0].nombre).toBe('Big Mac');
    expect((await buscar('whopper', { region }))[0].nombre).toBe('Whopper');
    expect((await buscar('big mac', { idioma: 'en', region }))[0].nombre).toBe('Big Mac');
  });

  it('en inglés, con Estados Unidos, lo genérico queda igual: solo baja lo que se vende en otro lado', async () => {
    for (const q of ['milk', 'mustard', 'cookies', 'chicken breast', 'cheese', 'yogurt']) {
      const conPais = (await buscar(q, { idioma: 'en', region: 'US', limite: 60 })).filter((r) => !paisesDe.has(r.id)).map((r) => r.id);
      const sinPais = (await buscar(q, { idioma: 'en', region: undefined, limite: 60 })).filter((r) => !paisesDe.has(r.id)).map((r) => r.id);
      const n = Math.min(conPais.length, sinPais.length, 20);
      expect(conPais.slice(0, n)).toEqual(sinPais.slice(0, n));
    }
    expect((await buscar('milk', { idioma: 'en', region: 'US' })).slice(0, 10).filter((r) => soloEnUruguay(r.id))).toEqual([]);
  });

  it('en la memoria (la web y la galería), igual: los países llegan del texto al candidato', () => {
    const corpus = [
      textoEnMemoria(1, 'es', null, 0, 'Mostaza'),
      textoEnMemoria(2, 'es', null, 0, 'Hamburguesa Mostaza', 'Mostaza', 0, ['AR', 'PY', 'UY']),
      textoEnMemoria(3, 'es', null, 0, 'Salsa de mostaza'),
    ];
    const orden = (region?: string) => mejoresPorAlimento(candidatosEnMemoria(corpus, 'mostaza', 'es'), 'mostaza', { idioma: 'es', region }, () => true).map((c) => c.alimento);
    expect(candidatosEnMemoria(corpus, 'mostaza', 'es').find((c) => c.alimento === 2)?.paises).toEqual(['AR', 'PY', 'UY']);
    expect(orden('UY')).toEqual([1, 2, 3]);
    expect(orden(undefined)).toEqual([1, 2, 3]);
    expect(orden('MX')).toEqual([1, 3, 2]);
  });
});
