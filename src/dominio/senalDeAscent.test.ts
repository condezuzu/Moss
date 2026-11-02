import { describe, expect, it } from '@jest/globals';

import { DIAS_DE_LA_SENAL, invitarEnInicio, senalDeAscent } from './senalDeAscent';

const HOY = '2026-11-02';

describe('la señal de Hábitos', () => {
  const senal = (d: Partial<Parameters<typeof senalDeAscent>[0]>) => senalDeAscent({ conAscent: true, vinculada: false, instalada: true, sesiones: [], hoy: HOY, ...d });

  it('con la vinculación apagada no existe, esté como esté todo lo demás', () => {
    expect(senal({ conAscent: false })).toBeNull();
    expect(senal({ conAscent: false, vinculada: true, sesiones: [{ fecha: HOY }] })).toBeNull();
    expect(senal({ conAscent: false, instalada: false })).toBeNull();
  });

  it('sin vincular invita solo si Ascent está en este iPhone', () => {
    expect(senal({ instalada: true })).toEqual({ que: 'vincular' });
    expect(senal({ instalada: false })).toEqual({ que: 'marca' });
    expect(senal({ instalada: null })).toEqual({ que: 'marca' });
  });

  it('sin vincular no nombra sesiones aunque hayan quedado guardadas', () => {
    expect(senal({ sesiones: [{ fecha: HOY }] })).toEqual({ que: 'vincular' });
  });

  it('vinculada dice la última sesión, aunque lleguen desordenadas', () => {
    expect(senal({ vinculada: true, sesiones: [{ fecha: '2026-10-30' }, { fecha: HOY }, { fecha: '2026-11-01' }] })).toEqual({ que: 'sesion', fecha: HOY, dias: 0 });
    expect(senal({ vinculada: true, sesiones: [{ fecha: '2026-10-30' }, { fecha: '2026-11-01' }] })).toEqual({ que: 'sesion', fecha: '2026-11-01', dias: 1 });
  });

  it('una sesión con la fecha de mañana (otro huso) no cuenta', () => {
    expect(senal({ vinculada: true, sesiones: [{ fecha: '2026-11-03' }, { fecha: '2026-11-01' }] })).toEqual({ que: 'sesion', fecha: '2026-11-01', dias: 1 });
  });

  it('vinculada sin sesiones, o con una vieja, solo la marca', () => {
    expect(senal({ vinculada: true })).toEqual({ que: 'marca' });
    expect(senal({ vinculada: true, sesiones: [{ fecha: '2026-10-27' }] })).toEqual({ que: 'sesion', fecha: '2026-10-27', dias: DIAS_DE_LA_SENAL });
    expect(senal({ vinculada: true, sesiones: [{ fecha: '2026-10-26' }] })).toEqual({ que: 'marca' });
  });
});

describe('la invitación de Inicio', () => {
  const invita = (d: Partial<Parameters<typeof invitarEnInicio>[0]>) => invitarEnInicio({ conAscent: true, listo: true, conCuenta: true, vinculada: false, instalada: true, descartada: false, ...d });

  it('invita a quien tiene las dos apps y no las unió', () => {
    expect(invita({})).toBe(true);
  });

  it('con la vinculación apagada, nunca', () => {
    expect(invita({ conAscent: false })).toBe(false);
  });

  it('sin Ascent en este iPhone no se dice nada', () => {
    expect(invita({ instalada: false })).toBe(false);
  });

  it('vinculada, no hace falta', () => {
    expect(invita({ vinculada: true })).toBe(false);
  });

  it('después de «Ahora no», nunca más', () => {
    expect(invita({ descartada: true })).toBe(false);
  });

  it('sin la cuenta de Moss no se puede vincular', () => {
    expect(invita({ conCuenta: false })).toBe(false);
  });

  it('mientras no se sabe, espera: no aparece para irse enseguida', () => {
    expect(invita({ listo: false })).toBe(false);
    expect(invita({ instalada: null })).toBe(false);
    expect(invita({ descartada: null })).toBe(false);
  });
});
