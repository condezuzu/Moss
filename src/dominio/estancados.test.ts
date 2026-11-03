import { describe, expect, it } from '@jest/globals';

import type { SemanaDeMoss } from './entrenamiento';
import { razonesDeEstancamiento } from './estancados';

const semana = (sueno: number, proteina: number, balance: number, dias = 7): SemanaDeMoss => ({ sueno, proteina, balance, diasConComida: dias, nochesConSueno: dias });
// Cuando subía: 7 h 40, 150 g y 280 kcal por debajo del gasto.
const SUBIA = [semana(460, 150, -280), semana(460, 150, -280), semana(460, 150, -280)];
const base = (cambios: Partial<Parameters<typeof razonesDeEstancamiento>[0]> = {}) => razonesDeEstancamiento({
  conMarcas: SUBIA, sinMarcas: SUBIA, objetivo: 'mantener', bajaSemanal: null, llegadas: [], vecesPorSemana: null, minutos: null,
  ...cambios,
});

describe('razones de estancamiento', () => {
  it('sin nada distinto, ninguna: no hay una causa clara', () => {
    const r = base();
    expect(r.razones).toEqual([]);
    expect(r.comparacion.estado).toBe('comparado');
  });

  it('todas las que llegan a una escala entera, de la más grande a la más chica', () => {
    // 1 h menos de sueño (1,3 escalas) y 30 g menos de proteína (2 escalas); el balance, 200 kcal (0,8): no.
    const r = base({ sinMarcas: [semana(400, 120, -480), semana(400, 120, -480), semana(400, 120, -480)] });
    expect(r.razones.map((x) => x.que)).toEqual(['proteina', 'sueno']);
    expect(r.razones[0]).toEqual({ que: 'proteina', antes: 150, ahora: 120 });
  });

  it('solo cuenta lo que va para el lado malo: dormir más o comer más no es una razón', () => {
    const r = base({ sinMarcas: [semana(520, 180, 100), semana(520, 180, 100), semana(520, 180, 100)] });
    expect(r.razones).toEqual([]);
  });

  it('en definición, primero eso: mantener la fuerza ya es un buen resultado', () => {
    const r = base({ objetivo: 'bajar', bajaSemanal: 0.4, sinMarcas: [semana(400, 150, -280), semana(400, 150, -280), semana(400, 150, -280)] });
    expect(r.razones.map((x) => x.que)).toEqual(['definicion', 'sueno']);
    expect(r.razones[0]).toEqual({ que: 'definicion', bajaSemanal: 0.4 });
  });

  it('con pocas semanas completas no compara la comida ni el sueño, pero dice cuántas van', () => {
    const r = base({ sinMarcas: [semana(300, 90, -900), semana(300, 90, -900, 3)] });
    expect(r.comparacion).toEqual({ estado: 'juntando', conMarcas: 3, sinMarcas: 1 });
    expect(r.razones).toEqual([]);
  });

  it('llegar con el músculo cargado a la mitad de las sesiones o más', () => {
    expect(base({ llegadas: [12, 4, 11, 13] }).razones).toEqual([{ que: 'cargado', veces: 3, de: 4 }]);
    expect(base({ llegadas: [12, 11, 2, 1] }).razones).toEqual([{ que: 'cargado', veces: 2, de: 4 }]);
    expect(base({ llegadas: [12, 1, 2, 1] }).razones).toEqual([]);
    // Con menos de 3 sesiones no se dice.
    expect(base({ llegadas: [12, 14] }).razones).toEqual([]);
  });

  it('entrenarlo menos seguido: dos tercios de lo de antes o menos', () => {
    expect(base({ vecesPorSemana: { antes: 1.5, ahora: 1 } }).razones).toEqual([{ que: 'menosSeguido', antes: 1.5, ahora: 1 }]);
    expect(base({ vecesPorSemana: { antes: 1, ahora: 0.75 } }).razones).toEqual([]);
  });

  it('las sesiones que se achican, como la señal de Ascent: un 25 % menos', () => {
    expect(base({ minutos: { antes: 60, ahora: 44 } }).razones).toEqual([{ que: 'sesionesMasCortas', antes: 60, ahora: 44 }]);
    expect(base({ minutos: { antes: 60, ahora: 50 } }).razones).toEqual([]);
  });

  it('lo de Ascent va después de lo de Moss', () => {
    const r = base({ objetivo: 'bajar', bajaSemanal: 0.5, llegadas: [12, 12, 12], sinMarcas: [semana(460, 120, -280), semana(460, 120, -280), semana(460, 120, -280)] });
    expect(r.razones.map((x) => x.que)).toEqual(['definicion', 'proteina', 'cargado']);
  });
});
