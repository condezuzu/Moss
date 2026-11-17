import { describe, expect, it } from '@jest/globals';

import { CORTE_DE_FABRICA, diaLogico } from './fechas';
import {
  diaDeLosPendientes, LARGO_DEL_PENDIENTE, limpiarPendiente, MAXIMO_DE_PENDIENTES, pendientesDe, pendientesLlenos, pendientesPara, pendientesVigentes, type Pendiente,
} from './pendientes';

const p = (id: string, para: string, hecho = false): Pendiente => ({ id, texto: id, hecho, para });

describe('diaDeLosPendientes', () => {
  it('lo anotado a la noche es para mañana', () => {
    const noche = diaLogico(new Date(2026, 10, 17, 23, 10), CORTE_DE_FABRICA);
    expect(noche).toBe('2026-11-17');
    expect(diaDeLosPendientes(noche)).toBe('2026-11-18');
  });

  it('lo anotado de madrugada, antes del corte, también: para Moss sigue siendo el día anterior', () => {
    const madrugada = diaLogico(new Date(2026, 10, 18, 1, 30), CORTE_DE_FABRICA);
    expect(madrugada).toBe('2026-11-17');
    expect(diaDeLosPendientes(madrugada)).toBe('2026-11-18');
  });

  it('pasa de mes y de año', () => {
    expect(diaDeLosPendientes('2026-11-30')).toBe('2026-12-01');
    expect(diaDeLosPendientes('2026-12-31')).toBe('2027-01-01');
  });
});

describe('pendientesPara', () => {
  it('da los de ese día, en el orden en que se anotaron', () => {
    const lista = [p('dentista', '2026-11-18'), p('viejo', '2026-11-17', true), p('luz', '2026-11-18', true), p('regalo', '2026-11-19')];
    expect(pendientesPara(lista, '2026-11-18').map((x) => x.id)).toEqual(['dentista', 'luz']);
    expect(pendientesPara(lista, '2026-11-20')).toEqual([]);
  });

  it('lo anotado anoche es lo de hoy al despertar', () => {
    const anoche = '2026-11-17';
    const lista = [p('dentista', diaDeLosPendientes(anoche))];
    expect(pendientesPara(lista, '2026-11-18')).toEqual(lista);
    // Y esa misma noche la nota está vacía: lo que se anote es para pasado mañana.
    expect(pendientesPara(lista, diaDeLosPendientes('2026-11-18'))).toEqual([]);
  });
});

describe('la lista es corta', () => {
  it('el texto se guarda sin espacios de más y hasta el largo', () => {
    expect(limpiarPendiente('  Llamar   al\ndentista ')).toBe('Llamar al dentista');
    expect(limpiarPendiente('   ')).toBe('');
    expect(Array.from(limpiarPendiente('a'.repeat(200)))).toHaveLength(LARGO_DEL_PENDIENTE);
    // No corta un emoji por la mitad.
    expect(limpiarPendiente('😀'.repeat(80))).toBe('😀'.repeat(LARGO_DEL_PENDIENTE));
  });

  it('hasta seis por día', () => {
    const seis = Array.from({ length: MAXIMO_DE_PENDIENTES }, (_, i) => p(`p${i}`, '2026-11-18'));
    expect(pendientesLlenos(seis, '2026-11-18')).toBe(true);
    expect(pendientesLlenos(seis, '2026-11-19')).toBe(false);
    expect(pendientesLlenos(seis.slice(1), '2026-11-18')).toBe(false);
  });
});

describe('lo guardado', () => {
  it('los de hace más de una semana se olvidan', () => {
    const lista = [p('viejo', '2026-11-10'), p('justo', '2026-11-11'), p('ayer', '2026-11-17'), p('manana', '2026-11-19')];
    expect(pendientesVigentes(lista, '2026-11-18').map((x) => x.id)).toEqual(['justo', 'ayer', 'manana']);
  });

  it('lo que no tiene forma no está', () => {
    expect(pendientesDe(null)).toEqual([]);
    expect(pendientesDe({})).toEqual([]);
    expect(pendientesDe([null, 3, { id: 'a' }, { id: 'b', texto: '', para: '2026-11-18' }, { id: 'c', texto: 'Pagar', para: 'mañana' }, { id: 'd', texto: 'Pagar la luz', para: '2026-11-18', hecho: 'si', otra: 1 }]))
      .toEqual([{ id: 'd', texto: 'Pagar la luz', hecho: false, para: '2026-11-18' }]);
  });
});
