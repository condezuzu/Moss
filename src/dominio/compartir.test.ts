import { describe, expect, it } from '@jest/globals';

import { enlaceDe, leerCompartido, porPorcion, PREFIJO, type Compartido } from './compartir';
import type { Item } from './registros';

const item = (nombre: string, kcal: number, fuente: Item['fuente'] = 'base', ref: string | null = '1'): Item => ({
  fuente, ref, nombre, cantidad: { gramos: 100 }, valores: { kcal, proteina: 10, carbohidratos: 20, grasas: 5 },
});
const receta: Compartido = { tipo: 'receta', receta: { tipo: 'receta', nombre: 'Guiso de lentejas', porciones: 4, pesoFinal: 1800, items: [item('Lentejas', 400), item('Mi caldo', 80, 'propio', 'p-123')] } };

describe('compartir sin dominio', () => {
  it('una receta va y vuelve entera, con acentos y eñes, sin las referencias a lo propio', () => {
    const enlace = enlaceDe(receta);
    expect(enlace.startsWith(PREFIJO)).toBe(true);
    expect(enlace).toMatch(/^moss:\/\/compartido\?d=[A-Za-z0-9_-]+$/);
    const vuelta = leerCompartido(enlace);
    expect(vuelta).toMatchObject({ tipo: 'receta', receta: { nombre: 'Guiso de lentejas', porciones: 4, pesoFinal: 1800 } });
    if (vuelta?.tipo !== 'receta') throw new Error('no');
    expect(vuelta.receta.items[1]).toMatchObject({ fuente: 'rapida', ref: null, nombre: 'Mi caldo' });
    expect(leerCompartido(enlaceDe({ tipo: 'receta', receta: { ...receta.receta, nombre: 'Ñoquis con salsa' } }))).toMatchObject({ receta: { nombre: 'Ñoquis con salsa' } });
  });

  it('un alimento propio también, con su código y sus porciones', () => {
    const propio: Compartido = { tipo: 'propio', propio: { nombre: 'Granola de la casa', marca: null, codigo: '7730000000017', por100g: { kcal: 450, proteina: 12, carbohidratos: 60, grasas: 18, fibra: 8 }, porciones: [{ nombre: '1 taza', gramos: 60 }], origen: 'etiqueta' } };
    expect(leerCompartido(enlaceDe(propio))).toEqual(propio);
  });

  it('lo que no cierra no entra: valores imposibles, otra versión o basura', () => {
    const malo = { tipo: 'propio', propio: { nombre: 'X', marca: null, codigo: null, por100g: { kcal: 5000, proteina: 1, carbohidratos: 1, grasas: 1 }, porciones: [], origen: 'mano' } } as Compartido;
    expect(leerCompartido(enlaceDe(malo))).toBeNull();
    expect(leerCompartido('moss://compartido?d=nada')).toBeNull();
    expect(leerCompartido('')).toBeNull();
    const sinItems = { tipo: 'receta', receta: { ...receta.receta, items: [] } } as Compartido;
    expect(leerCompartido(enlaceDe(sinItems))).toBeNull();
  });

  it('una porción de la receta', () => {
    if (receta.tipo !== 'receta') throw new Error('no');
    expect(porPorcion(receta.receta)).toEqual({ kcal: 120, proteina: 5, carbohidratos: 10, grasas: 2.5 });
  });

  it('una cantidad que no es posible no entra, y lo que sobra no se guarda', () => {
    // Armado a mano, como podría venir de cualquier lado.
    const conCantidad = (cantidad: unknown) => PREFIJO + btoa(JSON.stringify({ v: 1, tipo: 'receta', receta: { tipo: 'receta', nombre: 'Torta', porciones: 4, pesoFinal: null, items: [{ ...item('Harina', 100), cantidad }] } })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(leerCompartido(conCantidad(5))).toBeNull();
    expect(leerCompartido(conCantidad({}))).toBeNull();
    expect(leerCompartido(conCantidad({ gramos: 'x' }))).toBeNull();
    expect(leerCompartido(conCantidad({ porcion: 1 }))).toBeNull();
    expect(leerCompartido(conCantidad('hola'))).toBeNull();
    const bien = leerCompartido(conCantidad({ porcion: '1 taza', gramosPorcion: 120, veces: 2, raro: 1 }));
    if (bien?.tipo !== 'receta') throw new Error('no');
    expect(bien.receta.items[0].cantidad).toEqual({ porcion: '1 taza', gramosPorcion: 120, veces: 2 });
    expect(leerCompartido(conCantidad(null))).not.toBeNull();
  });

  it('un nombre largo (los de Open Food Facts) se comparte igual, recortado si hace falta', () => {
    const largo = 'Galletitas dulces rellenas sabor vainilla con chips de chocolate, paquete familiar edición especial';
    const propio: Compartido = { tipo: 'propio', propio: { nombre: largo, marca: 'Marca', codigo: null, por100g: { kcal: 450, proteina: 6, carbohidratos: 70, grasas: 16 }, porciones: [{ nombre: '3 galletitas', gramos: 30 }], origen: 'off' } };
    expect(leerCompartido(enlaceDe(propio))).toMatchObject({ propio: { nombre: largo } });
    const enorme = { ...propio, propio: { ...propio.propio, nombre: 'x'.repeat(500) } } as Compartido;
    expect(leerCompartido(enlaceDe(enorme))).toMatchObject({ propio: { nombre: 'x'.repeat(200) } });
  });
});
