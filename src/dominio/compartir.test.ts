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
});
