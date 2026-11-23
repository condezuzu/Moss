// El control cerca, en Inicio: «listo» solo cuando alcanza (estadoDelControl); si no, lo que falta.

import { describe, expect, it, jest } from '@jest/globals';

import { estadoDelControl } from '@/dominio/control';
import { diaDeLaSemana, sumarDias, type DiaSemana } from '@/dominio/fechas';
import { loQueFalta } from './Control';

jest.mock('react-native-reanimated', () => ({}));
jest.mock('../ganchos', () => ({}));
jest.mock('../comida/comunes', () => ({}));
jest.mock('../tarjetas', () => ({}));
jest.mock('./comunes', () => ({}));
jest.mock('@/textos', () => ({ t: (clave: string) => clave, plural: (clave: string, n: number) => `${clave}:${n}`, lista: () => [] }));

const HOY = '2026-11-23';
const dia = (n: number) => sumarDias(HOY, n);
// El control, pasado mañana.
const control = (pesadas: number[], comidas: number[]) => estadoDelControl({
  hoy: HOY, dia: ((diaDeLaSemana(HOY) + 2) % 7) as DiaSemana, ultimaMeta: dia(-5),
  pesadas: pesadas.map((n) => ({ fecha: dia(n), kg: 80 })),
  comidas: comidas.map((n) => ({ fecha: dia(n), kcal: 2000 })),
});

describe('lo que le falta al control cerca', () => {
  it('con la primera pesada hace 4 días el tramo es corto: esta semana no llega, aunque haya pesada y comida', () => {
    const c = control([-4, -1], [-6, -5, -4, -3, -2, -1]);
    expect(c).toMatchObject({ faltan: 2, tramoCorto: true, alcanza: false });
    expect(loQueFalta(c)).toBe('progreso.control.textos.faltanDatos');
  });

  it('con dos pesadas a menos de una semana, le falta otra: la recta las necesita a una semana', () => {
    const c = control([-6, -2], [-6, -5, -4, -3, -2, -1]);
    expect(c).toMatchObject({ tramoCorto: false, alcanza: false });
    expect(loQueFalta(c)).toBe('inicio.control.faltaPesada');
  });

  it('sin comida suficiente, cuántos días faltan; con todo, listo', () => {
    expect(loQueFalta(control([-12, -1], [-12, -2, -1]))).toBe('inicio.control.faltanDias:2');
    const listo = control([-12, -1], [-12, -5, -4, -3, -2, -1]);
    expect(listo.alcanza).toBe(true);
    expect(loQueFalta(listo)).toBe('inicio.control.listo');
  });
});
