import { describe, expect, it } from '@jest/globals';

import { luzAcumulada, progresoPorConstelacion, resumirDia, type Dia, type Marca } from './dias';
import type { Habito } from './habitos';
import { historial, logrosNuevos, type Logro } from './logros';

const habito = (id: string, orden: number): Habito => ({ id, nombre: id, icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden, desde: '2026-01-01' });
const marca = (h: string, dia: string, hecho: boolean, momento: string): Marca => ({ habito: h, dia, hecho, momento, origen: 'toque' });
const dia = (clave: string, hechos: number, total = hechos, constelacion = 'lyra'): Dia => ({
  clave, constelacion, habitos: Array.from({ length: total }, (_, i) => `h${i}`), hechos: Array.from({ length: hechos }, (_, i) => `h${i}`),
  luz: hechos > 0 ? hechos + 2 : 0, completo: total > 0 && hechos === total,
});

describe('el resumen del día', () => {
  const tres = [habito('a', 0), habito('b', 1), habito('c', 2)];

  it('cuenta lo hecho, la luz y si el día está completo', () => {
    const r = resumirDia('2026-10-21', tres, [marca('a', '2026-10-21', true, '1'), marca('b', '2026-10-21', true, '2')], 'lyra');
    expect(r).toMatchObject({ hechos: ['a', 'b'], luz: 4, completo: false, habitos: ['a', 'b', 'c'] });
    const todo = resumirDia('2026-10-21', tres, ['a', 'b', 'c'].map((h, i) => marca(h, '2026-10-21', true, String(i))), 'lyra');
    expect(todo).toMatchObject({ luz: 5, completo: true });
  });

  it('deshacer: gana la última marca', () => {
    const r = resumirDia('2026-10-21', tres, [marca('a', '2026-10-21', true, '2026-10-21T10:00:00Z'), marca('a', '2026-10-21', false, '2026-10-21T10:00:05Z')], 'lyra');
    expect(r).toMatchObject({ hechos: [], luz: 0 });
  });

  it('no cuenta marcas de otros días ni de hábitos que ya no tocan', () => {
    const r = resumirDia('2026-10-21', tres, [marca('a', '2026-10-20', true, '1'), marca('viejo', '2026-10-21', true, '2')], 'lyra');
    expect(r.hechos).toEqual([]);
  });

  it('un día sin hábitos no está completo', () => {
    expect(resumirDia('2026-10-21', [], [], null)).toMatchObject({ completo: false, luz: 0 });
  });
});

describe('la luz juntada', () => {
  const dias = [dia('2026-10-19', 6), dia('2026-10-20', 4), dia('2026-10-21', 3)];

  it('suma todo, o solo lo anterior a un día (el cielo de hoy crece con la luz hasta ayer)', () => {
    expect(luzAcumulada(dias)).toBe(8 + 6 + 5);
    expect(luzAcumulada(dias, '2026-10-21')).toBe(8 + 6);
  });

  it('cada constelación guarda lo que juntó', () => {
    const p = progresoPorConstelacion([dia('2026-10-19', 6, 6, 'lyra'), dia('2026-10-26', 2, 6, 'lyra'), dia('2026-10-20', 4, 4, 'crater')]);
    expect(p.get('lyra')).toEqual({ luz: 8 + 4, completos: 1, dias: 2 });
    expect(p.get('crater')).toEqual({ luz: 6, completos: 1, dias: 1 });
  });
});

describe('los logros', () => {
  const ids = (logros: Logro[]) => logros.map((l) => l.id);

  it('la primera luz y la primera constelación', () => {
    expect(ids(logrosNuevos([dia('2026-10-21', 1, 3)], [], '2026-10-21'))).toEqual(['primeraLuz']);
    expect(ids(logrosNuevos([dia('2026-10-21', 3, 3)], [], '2026-10-21'))).toEqual(['primeraLuz', 'constelacion']);
  });

  it('cuentan días acumulados, no seguidos', () => {
    const salteados = Array.from({ length: 7 }, (_, i) => dia(`2026-10-${String(1 + i * 3).padStart(2, '0')}`, 1, 3));
    expect(ids(logrosNuevos(salteados, [], '2026-10-21'))).toContain('esporas');
    expect(ids(logrosNuevos(salteados.slice(0, 6), [], '2026-10-21'))).not.toContain('esporas');
  });

  it('el cometa: volver después de una semana entera sin luz', () => {
    expect(historial([dia('2026-10-01', 1), dia('2026-10-09', 1)]).volvio).toBe(true);
    expect(historial([dia('2026-10-01', 1), dia('2026-10-08', 1)]).volvio).toBe(false);
    expect(historial([dia('2026-10-01', 1), dia('2026-10-05', 0), dia('2026-10-12', 1)]).volvio).toBe(true);
  });

  it('la luna llena: 30 días completos', () => {
    const completos = Array.from({ length: 30 }, (_, i) => dia(`2026-${i < 15 ? '09' : '10'}-${String((i % 15) + 1).padStart(2, '0')}`, 2, 2));
    expect(ids(logrosNuevos(completos, [], '2026-10-21'))).toContain('lunaLlena');
  });

  it('nunca repite uno que ya estaba', () => {
    const tenidos: Logro[] = [{ id: 'primeraLuz', desde: '2026-10-01' }];
    expect(ids(logrosNuevos([dia('2026-10-21', 3, 3)], tenidos, '2026-10-21'))).toEqual(['constelacion']);
  });
});
