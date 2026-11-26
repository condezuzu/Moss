import { describe, expect, it } from '@jest/globals';

import { sumarDias } from './fechas';
import { tocaPedirResena } from './resena';

const HOY = '2026-11-26';

describe('cuándo pedir la reseña', () => {
  it('con el primer día completo o con 7 días de comida anotada, lo que llegue primero', () => {
    expect(tocaPedirResena({ hoy: HOY, ultimoPedido: null, diasConComida: 2, diaCompleto: true })).toBe(true);
    expect(tocaPedirResena({ hoy: HOY, ultimoPedido: null, diasConComida: 7, diaCompleto: false })).toBe(true);
  });

  it('antes, no: ni con 6 días de comida', () => {
    expect(tocaPedirResena({ hoy: HOY, ultimoPedido: null, diasConComida: 6, diaCompleto: false })).toBe(false);
  });

  it('después de pedirla, no otra vez hasta 120 días', () => {
    expect(tocaPedirResena({ hoy: HOY, ultimoPedido: sumarDias(HOY, -119), diasConComida: 40, diaCompleto: true })).toBe(false);
    expect(tocaPedirResena({ hoy: HOY, ultimoPedido: sumarDias(HOY, -120), diasConComida: 40, diaCompleto: false })).toBe(true);
  });
});
