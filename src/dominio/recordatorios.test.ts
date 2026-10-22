import { describe, expect, it } from '@jest/globals';

import { DESPUES_MIN, horaHabitual, recordatoriosDeLaSemana } from './recordatorios';

describe('los recordatorios para anotar', () => {
  it('la hora habitual es la mediana de cuándo se anotó; sin datos, la típica', () => {
    expect(horaHabitual([], 13 * 60)).toBe(780);
    expect(horaHabitual([12 * 60, 13 * 60 + 30, 14 * 60], 13 * 60)).toBe(810);
    expect(horaHabitual([12 * 60, 13 * 60], 0)).toBe(750);
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
