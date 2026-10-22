import { describe, expect, it } from '@jest/globals';

import { crearEscena, ponerEncendidos } from './escena';

const escena = (encendidos: boolean[]) =>
  crearEscena({
    ancho: 393, alto: 852,
    habitos: encendidos.map((encendido, i) => ({ x: i * 0.1, y: 0.1, encendido, auto: false })),
    lineas: [], centro: [0, 0], brotes: [], universo: [], factorParticulas: 1, riqueza: 0, movimientoReducido: false,
  });

describe('lo que se enciende fuera del cielo', () => {
  it('llega a la escena que está, sin volver a avisar ni a marcar', () => {
    const e = escena([false, false, true]);
    ponerEncendidos(e, [true, false, true]);
    expect(e.habitos.map((h) => h.encendido)).toEqual([true, false, true]);
    expect(e.eventos).toEqual([]);
    expect(e.particulas.length).toBeGreaterThan(0);
  });

  it('si con eso se completa el día, se celebra; y no toca lo que ya estaba igual', () => {
    const e = escena([true, false]);
    e.eventos.push({ tipo: 'encendida', indice: 0 });
    ponerEncendidos(e, [true, true]);
    expect(e.completo).toBe(true);
    expect(e.eventos).toEqual([{ tipo: 'encendida', indice: 0 }, { tipo: 'completo' }]);
    ponerEncendidos(e, [true, true]);
    expect(e.eventos).toHaveLength(2);
  });
});
