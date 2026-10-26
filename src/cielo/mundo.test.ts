import { describe, expect, it } from '@jest/globals';

import { separar, type Punto } from './mundo';

const distancias = (p: Punto[]) => p.flatMap((a, i) => p.slice(i + 1).map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));

describe('separar las estrellas de hoy', () => {
  it('aparta las que quedaron pegadas y deja el centro donde estaba', () => {
    const plano: Punto[] = [[0, 0.2], [0.01, 0.21], [0.2, -0.1], [-0.2, -0.1]];
    const separadas = separar(plano, 0.07);
    expect(Math.min(...distancias(separadas))).toBeGreaterThanOrEqual(0.07 - 1e-6);
    const centro = (p: Punto[]) => p.reduce((s, q) => [s[0] + q[0] / p.length, s[1] + q[1] / p.length], [0, 0]);
    expect(centro(separadas)[0]).toBeCloseTo(centro(plano)[0], 9);
    expect(centro(separadas)[1]).toBeCloseTo(centro(plano)[1], 9);
  });

  it('una figura sin estrellas juntas queda igual', () => {
    const plano: Punto[] = [[0, 0.2], [0.2, -0.1], [-0.2, -0.1]];
    expect(separar(plano, 0.07)).toEqual(plano);
  });

  it('dos en el mismo lugar se apartan de costado', () => {
    const separadas = separar([[0, 0], [0, 0]], 0.07);
    expect(Math.min(...distancias(separadas))).toBeGreaterThanOrEqual(0.07 - 1e-6);
  });
});
