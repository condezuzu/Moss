import { describe, expect, it } from '@jest/globals';

import type { Comida } from './comidas';
import { DESPUES_MIN, DIAS_PARA_ACOMODARSE, horaHabitual, horasDeComer, horasDeSiempre, horasPuestasAMano, noSueleComer, recordatoriosDeLaSemana } from './recordatorios';
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

describe('tus horas de comer: una sola lista', () => {
  const r = (dia: string, comida: Comida, local: string, extra: Partial<Registro> = {}): Registro => ({
    fuente: 'rapida', ref: null, nombre: comida, cantidad: null, valores: { kcal: 100, proteina: 1, carbohidratos: 1, grasas: 1 },
    id: `${comida}-${local}-${Math.random()}`, dia, comida, momento: new Date(local).toISOString(), planificado: false, actualizado: '', ...extra,
  });
  const HOY = '2026-11-18';
  /** n días de almuerzo, el último ayer, a esa hora del reloj. */
  const almuerzos = (n: number, hora = '14:10') =>
    Array.from({ length: n }, (_, i) => {
      const dia = `2026-11-${String(17 - i).padStart(2, '0')}`;
      return r(dia, 'almuerzo', `${dia}T${hora}`);
    });
  const cuestionario = { desayuno: 7 * 60 + 30, almuerzo: 13 * 60, merienda: null, cena: 21 * 60 + 30 };

  it('al principio, las de tu día; sin cuestionario, las típicas', () => {
    const hora = horasDeComer({ registros: [], hoy: HOY, cuestionario });
    expect([hora('desayuno'), hora('almuerzo'), hora('cena')]).toEqual([{ minutos: 450, de: 'cuestionario' }, { minutos: 780, de: 'cuestionario' }, { minutos: 1290, de: 'cuestionario' }]);
    expect(horasDeComer({ registros: [], hoy: HOY })('almuerzo')).toEqual({ minutos: 13 * 60, de: 'tipica' });
    // «No suelo»: la hora típica, y no avisa.
    expect(hora('merienda')).toEqual({ minutos: 17 * 60 + 30, de: 'tipica' });
    expect([noSueleComer(cuestionario, 'merienda'), noSueleComer(cuestionario, 'cena'), noSueleComer(null, 'merienda')]).toEqual([true, false, false]);
  });

  it(`con ${DIAS_PARA_ACOMODARSE} días con esa comida anotada en dos semanas, se acomoda a lo anotado, al cuarto de hora`, () => {
    expect(horasDeComer({ registros: almuerzos(DIAS_PARA_ACOMODARSE - 1), hoy: HOY, cuestionario })('almuerzo')).toEqual({ minutos: 780, de: 'cuestionario' });
    expect(horasDeComer({ registros: almuerzos(DIAS_PARA_ACOMODARSE), hoy: HOY, cuestionario })('almuerzo')).toEqual({ minutos: 14 * 60 + 15, de: 'anotado' });
    // Cinco cosas en el mismo almuerzo son un día, no cinco.
    const unDia = Array.from({ length: 6 }, () => r('2026-11-17', 'almuerzo', '2026-11-17T14:10'));
    expect(horasDeComer({ registros: unDia, hoy: HOY, cuestionario })('almuerzo').de).toBe('cuestionario');
    // Lo de hace más de dos semanas, lo de hoy, lo planificado y lo borrado no cuentan.
    const viejos = [...almuerzos(3), r('2026-11-03', 'almuerzo', '2026-11-03T14:00'), r('2026-11-18', 'almuerzo', '2026-11-18T14:00'),
      r('2026-11-12', 'almuerzo', '2026-11-12T14:00', { planificado: true }), r('2026-11-11', 'almuerzo', '2026-11-11T14:00', { borrado: true })];
    expect(horasDeComer({ registros: viejos, hoy: HOY, cuestionario })('almuerzo').de).toBe('cuestionario');
  });

  it('la que cambiaste a mano queda fija, aunque anotes a otra hora', () => {
    const hora = horasDeComer({ registros: almuerzos(10), hoy: HOY, cuestionario, aMano: { almuerzo: 12 * 60 + 45 } });
    expect(hora('almuerzo')).toEqual({ minutos: 12 * 60 + 45, de: 'aMano' });
    // Las demás siguen su regla.
    expect(hora('desayuno')).toEqual({ minutos: 450, de: 'cuestionario' });
  });

  it('una cena pasada la medianoche es tarde, y no pasa de las 23:45; el snack, como siempre', () => {
    const cenas = Array.from({ length: 5 }, (_, i) => {
      const dia = `2026-11-${String(17 - i).padStart(2, '0')}`;
      return r(dia, 'cena', `2026-11-${String(18 - i).padStart(2, '0')}T00:30`);
    });
    expect(horasDeComer({ registros: cenas, hoy: HOY })('cena')).toEqual({ minutos: 23 * 60 + 45, de: 'anotado' });
    expect(horasDeComer({ registros: [], hoy: HOY })('snack').minutos).toBe(16 * 60);
  });
});

describe('cambiar tus horas en Tus respuestas', () => {
  const mostradas = { desayuno: 450, almuerzo: 855, merienda: 1050, cena: 1290 };

  it('la que moviste queda a mano; las que no tocaste, no; la que pasaste a «No suelo» deja de estar a mano', () => {
    expect(horasPuestasAMano({ mostradas, elegidas: { ...mostradas, almuerzo: 780 }, noSuele: {} })).toEqual({ almuerzo: 780 });
    expect(horasPuestasAMano({ mostradas, elegidas: mostradas, noSuele: {}, antes: { cena: 1290 } })).toEqual({ cena: 1290 });
    expect(horasPuestasAMano({ mostradas, elegidas: { ...mostradas, cena: 1200 }, noSuele: { merienda: true }, antes: { merienda: 1050 } })).toEqual({ cena: 1200 });
  });
});
