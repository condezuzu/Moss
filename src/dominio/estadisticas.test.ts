import { describe, expect, it } from '@jest/globals';

import type { Dia } from './dias';
import { cumplimiento, diasDelMes, racha, resumenDelMes } from './estadisticas';

const dia = (clave: string, habitos: string[], hechos: string[]): Dia => ({ clave, constelacion: 'lyra', habitos, hechos, luz: hechos.length, completo: hechos.length === habitos.length && habitos.length > 0 });
const mapa = (lista: Dia[]) => new Map(lista.map((d) => [d.clave, d]));

describe('las estadísticas de Hábitos', () => {
  it('los días de un mes, también en febrero bisiesto', () => {
    expect(diasDelMes(2026, 9)).toHaveLength(31);
    expect(diasDelMes(2028, 1)).toHaveLength(29);
    expect(diasDelMes(2026, 9)[0]).toBe('2026-10-01');
  });

  it('el mes cuenta hasta hoy: completos, con luz y con hábitos', () => {
    const dias = mapa([
      dia('2026-10-01', ['a', 'b'], ['a', 'b']),
      dia('2026-10-02', ['a', 'b'], ['a']),
      dia('2026-10-03', ['a', 'b'], []),
      dia('2026-10-25', ['a', 'b'], ['a', 'b']),
    ]);
    expect(resumenDelMes(dias, 2026, 9, '2026-10-22')).toEqual({ completos: 1, conLuz: 2, conHabitos: 3 });
  });

  it('la racha: días seguidos con algo hecho; hoy sin nada todavía no la corta', () => {
    const dias = mapa([dia('2026-10-19', ['a'], ['a']), dia('2026-10-20', ['a'], ['a']), dia('2026-10-21', ['a'], ['a']), dia('2026-10-22', ['a'], [])]);
    expect(racha(dias, '2026-10-22')).toBe(3);
    expect(racha(mapa([...dias.values(), dia('2026-10-22', ['a'], ['a'])]), '2026-10-22')).toBe(4);
    expect(racha(mapa([dia('2026-10-20', ['a'], ['a'])]), '2026-10-22')).toBe(0);
  });

  it('cada hábito, contra los días que le tocaban', () => {
    const dias = mapa([dia('2026-10-20', ['a', 'b'], ['a']), dia('2026-10-21', ['a'], ['a']), dia('2026-10-22', ['a', 'b'], ['b'])]);
    expect(cumplimiento('a', dias, '2026-10-22')).toEqual({ hechos: 2, total: 3 });
    expect(cumplimiento('b', dias, '2026-10-22')).toEqual({ hechos: 1, total: 2 });
    expect(cumplimiento('c', dias, '2026-10-22')).toEqual({ hechos: 0, total: 0 });
  });
});
