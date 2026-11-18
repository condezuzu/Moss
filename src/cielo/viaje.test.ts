import { describe, expect, it } from '@jest/globals';

import { loQueSeVa, MITAD_DEL_VIAJE, parametrosDelViaje } from './viaje';

describe('el viaje de la entrada a la app', () => {
  it('arranca y termina quieto: sin acercamiento, estela ni velo', () => {
    for (const u of [0, 1]) {
      const p = parametrosDelViaje(u);
      expect(p.zoom).toBeCloseTo(1, 5);
      expect(p.estela).toBeCloseTo(0, 5);
      expect(p.velo).toBeCloseTo(0, 5);
    }
  });

  it('acelera hasta la mitad, con el destello en el cambio, y después frena', () => {
    const antes = parametrosDelViaje(MITAD_DEL_VIAJE - 0.001);
    const cambio = parametrosDelViaje(MITAD_DEL_VIAJE);
    expect(antes.estela).toBeCloseTo(1.1, 1);
    expect(antes.zoom).toBeCloseTo(2.5, 1);
    expect(cambio.brillo).toBeGreaterThan(antes.brillo + 0.3);
    const estelas = [0.1, 0.3, 0.44].map((u) => parametrosDelViaje(u).estela);
    expect(estelas[0]).toBeLessThan(estelas[1]);
    expect(estelas[1]).toBeLessThan(estelas[2]);
    expect(parametrosDelViaje(0.7).estela).toBeLessThan(parametrosDelViaje(0.5).estela);
  });

  it('la entrada se va del todo antes del cambio', () => {
    expect(loQueSeVa(0)).toEqual({ escala: 1, opacidad: 1 });
    const casi = loQueSeVa(MITAD_DEL_VIAJE * 0.85);
    expect(casi.opacidad).toBeCloseTo(0, 5);
    expect(casi.escala).toBeCloseTo(1.22, 5);
    expect(loQueSeVa(1).opacidad).toBe(0);
  });
});
