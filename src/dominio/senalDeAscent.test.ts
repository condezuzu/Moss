import { describe, expect, it } from '@jest/globals';

import { invitarEnInicio, VUELVE_EN } from './senalDeAscent';

describe('la invitación de Inicio', () => {
  const AHORA = Date.parse('2026-11-05T15:00:00Z');
  const HORA = 60 * 60 * 1000;
  const invita = (d: Partial<Parameters<typeof invitarEnInicio>[0]>) => invitarEnInicio({ conAscent: true, listo: true, conCuenta: true, vinculada: false, instalada: true, descartada: false, ahora: AHORA, ...d });

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

  it('después de «Ahora no», vuelve a las 4 horas', () => {
    expect(VUELVE_EN).toBe(4 * HORA);
    expect(invita({ descartada: AHORA - 3.9 * HORA })).toBe(false);
    expect(invita({ descartada: AHORA - 4 * HORA })).toBe(true);
    // Lo que guardaba la 1.0 («1») vale como un «Ahora no» viejo: vuelve.
    expect(invita({ descartada: 1 })).toBe(true);
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
