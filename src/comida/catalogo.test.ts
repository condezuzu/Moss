import { describe, expect, it } from '@jest/globals';

import type { Resultado } from './buscar';
import { codigoDelCatalogo, conElCatalogo, detalleDelCatalogo, mezclarCatalogo, type FilaDelCatalogo } from './catalogo';

const fila = (x: Partial<FilaDelCatalogo> & Pick<FilaDelCatalogo, 'id' | 'nombre_es' | 'nombre_en'>): FilaDelCatalogo => ({
  alias: [], categoria: null, marca: null, codigos: [], kcal: 100, proteina: 1, carbohidratos: 20, grasas: 1, fibra: null, azucares: null, saturadas: null,
  sodio: null, alcohol: null, porciones: [], densidad: null, desecho: null, que_desecho: null, aceite: null, crudo: null, retirado: false,
  actualizado: '2026-10-22T10:00:00Z', ...x,
});
const resultado = (id: number, nombre: string): Resultado => ({ id, nombre, coincide: nombre, curado: true, kcal: 50, proteina: 1, carbohidratos: 10, grasas: 0, porcion: null });
const op = { idioma: 'es' as const, region: 'UY' };

describe('el catálogo del servidor', () => {
  it('de cada id queda la fila más nueva', () => {
    const vieja = fila({ id: 1, nombre_es: 'Leche', nombre_en: 'Milk', kcal: 60 });
    const nueva = fila({ id: 1, nombre_es: 'Leche', nombre_en: 'Milk', kcal: 61, actualizado: '2026-10-23T10:00:00Z' });
    expect(mezclarCatalogo([nueva], [vieja])[0].kcal).toBe(61);
    expect(mezclarCatalogo([vieja], [nueva])[0].kcal).toBe(61);
  });

  it('al buscar: lo retirado se va, lo corregido toma sus valores y lo nuevo que coincide va primero', () => {
    const filas = [
      fila({ id: 10, nombre_es: 'Banana', nombre_en: 'Banana', kcal: 90 }),
      fila({ id: 11, nombre_es: 'Bandeja', nombre_en: 'Tray', retirado: true }),
      fila({ id: -20001, nombre_es: 'Bananita de chocolate', nombre_en: 'Chocolate banana', marca: 'Marca', porciones: [{ es: '1 unidad', en: '1 piece', gramos: 30 }] }),
    ];
    const salida = conElCatalogo([resultado(10, 'Banana'), resultado(11, 'Bandeja')], filas, 'banan', op);
    expect(salida.map((r) => r.id)).toEqual([-20001, 10]);
    expect(salida[1].kcal).toBe(90);
    expect(salida[0].porcion).toEqual({ nombre: '1 unidad', gramos: 30 });
  });

  it('sin catálogo, la búsqueda queda igual', () => {
    const base = [resultado(10, 'Banana')];
    expect(conElCatalogo(base, [], 'banana', op)).toBe(base);
  });

  it('con una marca nombrada no corta el menú entero que trajo el buscador', () => {
    const menu = Array.from({ length: 40 }, (_, k) => resultado(100 + k, `Combo ${k}`));
    const filas = [fila({ id: 1, nombre_es: 'Leche', nombre_en: 'Milk' })];
    expect(conElCatalogo(menu, filas, 'combo', { ...op, limite: 30, limiteDeMarca: 200 })).toHaveLength(40);
  });

  it('el detalle sale de la fila, y lo retirado no se muestra', () => {
    const filas = [fila({ id: 1, nombre_es: 'arroz crudo', nombre_en: 'raw rice' }), fila({ id: 2, nombre_es: 'arroz cocido', nombre_en: 'cooked rice', crudo: 1 }), fila({ id: 3, nombre_es: 'x', nombre_en: 'x', retirado: true })];
    expect(detalleDelCatalogo(filas, 2, op)).toMatchObject({ nombre: 'Arroz cocido', crudo: { id: 1, nombre: 'arroz crudo' } });
    expect(detalleDelCatalogo(filas, 1, op)?.cocidos).toEqual([{ id: 2, nombre: 'arroz cocido' }]);
    expect(detalleDelCatalogo(filas, 3, op)).toBeNull();
    expect(detalleDelCatalogo(filas, 9, op)).toBeUndefined();
  });

  it('el código de barras, también con el 0 que el iPhone le pone al UPC', () => {
    const filas = [fila({ id: 5, nombre_es: 'Galletas', nombre_en: 'Crackers', codigos: ['012345678905'] })];
    expect(codigoDelCatalogo(filas, '0012345678905')).toBe(5);
    expect(codigoDelCatalogo(filas, '7730000000017')).toBeNull();
  });
});

describe('lo que publicó la comunidad', () => {
  const comunidad = (x: Partial<FilaDelCatalogo> & Pick<FilaDelCatalogo, 'id' | 'nombre_es'>) =>
    fila({ nombre_en: x.nombre_es, comunidad: true, personas: 3, paises: ['UY'], marca: 'Granix', ...x });

  it('va después de la base, salvo que lo escrito lo nombre; lo de otro país, al final', () => {
    const filas = [
      comunidad({ id: 9_000_000_001, nombre_es: 'Galletitas de avena' }),
      comunidad({ id: 9_000_000_002, nombre_es: 'Galletitas de arroz', paises: ['MX'] }),
      fila({ id: -20001, nombre_es: 'Galletitas de chocolate', nombre_en: 'Chocolate cookies' }),
    ];
    const base = [resultado(10, 'Galletitas dulces')];
    expect(conElCatalogo(base, filas, 'galletitas', op).map((r) => r.id)).toEqual([-20001, 10, 9_000_000_001, 9_000_000_002]);
    expect(conElCatalogo(base, filas, 'galletitas de avena', op).map((r) => r.id)[0]).toBe(9_000_000_001);
    // Sin saber el país, ninguno es de otro.
    expect(conElCatalogo(base, filas, 'galletitas', { idioma: 'es' }).map((r) => r.id)).toEqual([-20001, 10, 9_000_000_001, 9_000_000_002]);
    const deMexico = conElCatalogo(base, filas, 'galletitas de arroz', { idioma: 'es', region: 'MX' });
    // Nombrado y de ahí: antes que la base (lo que agregó Moss, que se le parece, sigue primero).
    const ids = deMexico.map((r) => r.id);
    expect(ids.indexOf(9_000_000_002)).toBeLessThan(ids.indexOf(10));
    expect(deMexico.find((r) => r.id === 9_000_000_001)?.curado).toBe(false);
  });

  it('el detalle dice que es de la comunidad y no lo da por verificado por Moss', () => {
    const filas = [comunidad({ id: 9_000_000_001, nombre_es: 'Galletitas de avena', verificado: '2026-11-09', segunda: 'etiqueta' })];
    const d = detalleDelCatalogo(filas, 9_000_000_001, op)!;
    expect(d.comunidad).toEqual({ personas: 3 });
    expect(d.verificado).toBeNull();
    expect(d.origen).toBe('producto');
    // Oculto por los reportes: no se abre.
    expect(detalleDelCatalogo([{ ...filas[0], retirado: true }], 9_000_000_001, op)).toBeNull();
  });
});
