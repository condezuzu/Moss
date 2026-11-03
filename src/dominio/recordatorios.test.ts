import { describe, expect, it } from '@jest/globals';

import type { Comida } from './comidas';
import { DESPUES_MIN, horaHabitual, horasDeSiempre, recordatoriosDeLaSemana } from './recordatorios';
import type { Registro } from './registros';

describe('los recordatorios para anotar', () => {
  it('la hora de siempre: la mediana de tres semanas, sin hoy, lo planificado ni lo borrado; sin datos, la típica', () => {
    // A la hora local del teléfono, como el almacén: la cena de las 0:30 del 21 es del 20 (D32).
    const r = (dia: string, comida: Comida, local: string, extra: Partial<Registro> = {}): Registro => ({
      fuente: 'rapida', ref: null, nombre: comida, cantidad: null, valores: { kcal: 100, proteina: 1, carbohidratos: 1, grasas: 1 },
      id: `${comida}-${local}`, dia, comida, momento: new Date(local).toISOString(), planificado: false, actualizado: '', ...extra,
    });
    const deSiempre = horasDeSiempre([
      r('2026-10-20', 'desayuno', '2026-10-20T09:00'), r('2026-10-21', 'desayuno', '2026-10-21T09:30'), r('2026-10-22', 'desayuno', '2026-10-22T10:00'),
      // Lo de hoy, lo planificado, lo borrado y lo de hace más de tres semanas no cuentan.
      r('2026-10-23', 'desayuno', '2026-10-23T06:00'), r('2026-10-21', 'desayuno', '2026-10-21T06:00', { planificado: true }),
      r('2026-10-22', 'desayuno', '2026-10-22T06:00', { borrado: true }), r('2026-10-01', 'desayuno', '2026-10-01T06:00'),
      r('2026-10-20', 'cena', '2026-10-21T00:30'), r('2026-10-21', 'cena', '2026-10-22T00:20'),
    ], '2026-10-23');
    expect(deSiempre('desayuno')).toBe(9 * 60 + 30);
    // Pasada la medianoche es tarde, no temprano: no pasa de las 23:59.
    expect(deSiempre('cena')).toBe(24 * 60 - 1);
    expect(deSiempre('almuerzo')).toBe(13 * 60);
    expect(deSiempre('snack')).toBe(16 * 60);
  });

  it('la hora habitual es la mediana de cuándo se anotó; sin datos, la típica', () => {
    expect(horaHabitual([], 13 * 60)).toBe(780);
    expect(horaHabitual([12 * 60, 13 * 60 + 30, 14 * 60], 13 * 60)).toBe(810);
    expect(horaHabitual([12 * 60, 13 * 60], 0)).toBe(750);
  });

  it('una cena pasada la medianoche es tarde, no temprano', () => {
    // 23:40, 0:15, 0:20 y 23:50: sin darse cuenta, la mediana caía a las 12.
    const cenas = [23 * 60 + 40, 15, 20, 23 * 60 + 50];
    expect(horaHabitual(cenas, 21 * 60)).toBe(720);
    expect(horaHabitual(cenas, 21 * 60, true)).toBe(24 * 60 - 1);
    expect(horaHabitual([22 * 60, 23 * 60, 30], 21 * 60, true)).toBe(23 * 60);
    // Un desayuno a las 4:30 sigue siendo temprano.
    expect(horaHabitual([4 * 60 + 30], 8 * 60)).toBe(270);
  });

  it('de hoy, solo lo que falta y todavía no se anotó; los demás días, todo', () => {
    const hora = (c: string) => ({ desayuno: 8 * 60, almuerzo: 13 * 60, cena: 21 * 60 })[c as 'desayuno'] ?? 0;
    const lista = recordatoriosDeLaSemana({ hoy: '2026-10-22', ahora: 12 * 60, comidas: ['desayuno', 'almuerzo', 'cena'], hora, anotadasHoy: new Set(['almuerzo']) });
    expect(lista.filter((r) => r.dia === '2026-10-22')).toEqual([{ dia: '2026-10-22', comida: 'cena', minutos: 21 * 60 + DESPUES_MIN }]);
    expect(lista.filter((r) => r.dia === '2026-10-23').map((r) => r.comida)).toEqual(['desayuno', 'almuerzo', 'cena']);
    expect(new Set(lista.map((r) => r.dia)).size).toBe(7);
    expect(lista).toHaveLength(1 + 6 * 3);
  });

  it('nunca pasa de la medianoche', () => {
    const lista = recordatoriosDeLaSemana({ hoy: '2026-10-22', ahora: 0, comidas: ['cena'], hora: () => 23 * 60 + 40, anotadasHoy: new Set() });
    expect(lista[0].minutos).toBe(23 * 60 + 30);
  });
});
