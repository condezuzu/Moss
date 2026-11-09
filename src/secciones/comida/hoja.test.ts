// Lo puro de la hoja de registro: el día cuando no es hoy y cambiar lo guardado. En español (es-UY).

import { describe, expect, it, jest } from '@jest/globals';

import type { AlimentoPropio, Item, Receta } from '@/dominio/registros';
import { agregarADe, cambioLaEdicion, conLoEditado, edicionDe, etiquetaDelDia, porcionDePropio, sufijoDelDia, tuComidaDe, type Guardada } from './hoja';

jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'es-UY', regionCode: 'UY' }] }));

// El 9/11/2026 es lunes.
const HOY = '2026-11-09';

describe('el día de la hoja', () => {
  it('hoy no dice nada', () => {
    expect(etiquetaDelDia(HOY, HOY)).toBeNull();
    expect(sufijoDelDia(HOY, HOY)).toBe('');
    expect(tuComidaDe('cena', HOY, HOY)).toBe('Tu cena');
    expect(agregarADe('cena', HOY, HOY)).toBe('Agregar a la cena');
  });

  it('ayer y mañana, con su nombre', () => {
    expect(etiquetaDelDia('2026-11-08', HOY)).toBe('Ayer');
    expect(etiquetaDelDia('2026-11-10', HOY)).toBe('Mañana');
    expect(tuComidaDe('cena', '2026-11-08', HOY)).toBe('Tu cena · ayer');
    expect(agregarADe('cena', '2026-11-08', HOY)).toBe('Agregar a la cena de ayer');
    expect(agregarADe('almuerzo', '2026-11-10', HOY)).toBe('Agregar al almuerzo de mañana');
  });

  it('otro día, con el día de la semana y el número', () => {
    expect(etiquetaDelDia('2026-11-06', HOY)).toBe('Vie 6');
    expect(sufijoDelDia('2026-11-06', HOY)).toBe(' · viernes 6');
    expect(agregarADe('merienda', '2026-11-06', HOY)).toBe('Agregar a la merienda del viernes 6');
  });
});

const item = (nombre: string, kcal: number): Item => ({ fuente: 'base', ref: nombre, nombre, cantidad: { gramos: 100 }, valores: { kcal, proteina: 1, carbohidratos: 2, grasas: 3 } });

const receta: Receta = {
  id: 'r1', tipo: 'receta', nombre: 'Arroz con pollo', items: [item('Arroz', 774), item('Pollo', 792)], porciones: 4, pesoFinal: 1200, actualizado: '2026-11-01T12:00:00.000Z',
};

const barrita: AlimentoPropio = {
  id: 'a1', nombre: 'Barrita de avena', marca: 'Casera', codigo: '7790001', origen: 'etiqueta', actualizado: '2026-11-01T12:00:00.000Z',
  por100g: { kcal: 400, proteina: 8, carbohidratos: 60, grasas: 15, fibra: 5, sodio: 120 }, porciones: [{ nombre: '1 barrita', gramos: 30 }],
};

describe('cambiar lo guardado', () => {
  it('abre con lo que tiene; un alimento tuyo, por porción', () => {
    expect(edicionDe({ tipo: 'receta', x: receta })).toMatchObject({ nombre: 'Arroz con pollo', porciones: '4', pesoFinal: '1200' });
    expect(edicionDe({ tipo: 'propio', x: barrita })).toMatchObject({ marca: 'Casera', porcion: '30', kcal: '120', proteina: '2,4', carbohidratos: '18', grasas: '4,5' });
  });

  it('sin cambios no hay nada que descartar; sacar algo o escribir, sí', () => {
    const g: Guardada = { tipo: 'receta', x: receta };
    const e = edicionDe(g);
    expect(cambioLaEdicion(g, e)).toBe(false);
    expect(cambioLaEdicion(g, { ...e, items: e.items.slice(1) })).toBe(true);
    expect(cambioLaEdicion(g, { ...e, nombre: 'Arroz con pollo y arvejas' })).toBe(true);
  });

  it('guardar sin tocar los números deja los valores como estaban, sin redondear', () => {
    const tercio: AlimentoPropio = { ...barrita, por100g: { ...barrita.por100g, proteina: 13.333 } };
    const g: Guardada = { tipo: 'propio', x: tercio };
    const editado = conLoEditado(g, { ...edicionDe(g), nombre: 'Barrita de avena y miel' });
    expect(editado?.x.nombre).toBe('Barrita de avena y miel');
    expect((editado?.x as AlimentoPropio).por100g).toEqual(tercio.por100g);
  });

  it('una porción que pesa otra cosa: lo de la porción sigue igual, también lo que no se ve', () => {
    const g: Guardada = { tipo: 'propio', x: barrita };
    const a = conLoEditado(g, { ...edicionDe(g), porcion: '40' })?.x as AlimentoPropio;
    expect(a.porciones).toEqual([{ nombre: '1 barrita', gramos: 40 }]);
    expect(a.por100g.kcal).toBeCloseTo(300);
    expect(a.por100g.fibra).toBeCloseTo(3.75);
    expect(a.codigo).toBe('7790001');
    expect(porcionDePropio(a)).toEqual({ porcion: '1 barrita', gramosPorcion: 40, veces: 1 });
  });

  it('las kcal vacías salen de los macros', () => {
    const g: Guardada = { tipo: 'propio', x: barrita };
    const a = conLoEditado(g, { ...edicionDe(g), kcal: '', proteina: '3', carbohidratos: '18', grasas: '4' })?.x as AlimentoPropio;
    expect(a.por100g.kcal).toBeCloseTo(((3 * 4 + 18 * 4 + 4 * 9) * 100) / 30);
  });

  it('sin nombre, sin lo que lleva o sin lo que rinde no se guarda', () => {
    const g: Guardada = { tipo: 'receta', x: receta };
    const e = edicionDe(g);
    expect(conLoEditado(g, { ...e, nombre: '  ' })).toBeNull();
    expect(conLoEditado(g, { ...e, items: [] })).toBeNull();
    expect(conLoEditado(g, { ...e, porciones: '0' })).toBeNull();
    expect(conLoEditado(g, { ...e, porciones: '6', pesoFinal: '' })?.x).toMatchObject({ id: 'r1', porciones: 6, pesoFinal: null });
  });

  it('una comida guardada guarda lo que quedó, con su id', () => {
    const comida: Receta = { ...receta, id: 'c1', tipo: 'comida', porciones: 1, pesoFinal: null };
    const g: Guardada = { tipo: 'comida', x: comida };
    const editado = conLoEditado(g, { ...edicionDe(g), items: [comida.items[1]] });
    expect(editado?.x).toMatchObject({ id: 'c1', tipo: 'comida', items: [comida.items[1]] });
  });

  it('un alimento tuyo sin porción la gana si deja de pesar 100 g', () => {
    const sinPorcion: AlimentoPropio = { ...barrita, porciones: [] };
    const g: Guardada = { tipo: 'propio', x: sinPorcion };
    expect(edicionDe(g).porcion).toBe('100');
    expect((conLoEditado(g, edicionDe(g))?.x as AlimentoPropio).porciones).toEqual([]);
    expect((conLoEditado(g, { ...edicionDe(g), porcion: '25' })?.x as AlimentoPropio).porciones).toEqual([{ nombre: '25 g', gramos: 25 }]);
  });
});
