import { describe, expect, it } from '@jest/globals';

import { dibujoDeFigura } from './figuras';

describe('las figuras de la grasa', () => {
  it('las nueve de cada sexo se arman sin números rotos; las marcas del abdomen, solo con poca grasa', () => {
    for (const sexo of ['m', 'f'] as const) {
      for (let k = 0; k < 9; k++) {
        const d = dibujoDeFigura(sexo, k);
        const todo = [d.brazos, d.contorno, ...d.ropa, ...d.lineas.map((l) => l.d), d.papada?.d ?? ''].join(' ');
        expect(todo).not.toMatch(/NaN|Infinity/);
        expect(Object.values(d.cabeza).every(Number.isFinite)).toBe(true);
      }
    }
    expect(dibujoDeFigura('m', 0).lineas.length).toBeGreaterThan(dibujoDeFigura('m', 8).lineas.length);
    // Las mujeres llevan top.
    expect(dibujoDeFigura('f', 4).ropa).toHaveLength(2);
    expect(dibujoDeFigura('m', 4).ropa).toHaveLength(1);
  });
});
