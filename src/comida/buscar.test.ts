/**
 * Contra la base de verdad (assets/alimentos.db, la arma `npm run alimentos`), con el SQLite de Node.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import { buscarAlimentos, consultaDePalabras, consultaDeTrigramas, normalizar, parecido, type Opciones } from './buscar';

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

  it('en inglés: los nombres curados y, si no, los de USDA', async () => {
    expect((await primero('chicken breast', { idioma: 'en', region: 'US' })).nombre).toBe('Grilled chicken breast');
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

  it('lo vacío o raro no rompe nada', async () => {
    expect(await buscar('')).toEqual([]);
    await expect(buscar('100% "jugo" OR *')).resolves.toBeInstanceOf(Array);
    await expect(buscar('a')).resolves.toBeInstanceOf(Array);
  });
});
