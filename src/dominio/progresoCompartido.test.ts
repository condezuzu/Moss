import { describe, expect, it } from '@jest/globals';

import * as P from './progresoCompartido';
import { casos } from './progresoCompartido.casos.json';

// Los casos son los mismos en Moss y en Ascent: si uno falla acá, falla allá.
describe('progresoCompartido (los casos compartidos)', () => {
  it.each(casos.map((c) => [c.que, c] as const))('%s', (_, c) => {
    const f = (P as unknown as Record<string, (...a: unknown[]) => unknown>)[c.funcion];
    expect(f(...(c.entrada as unknown[]))).toEqual(c.salida);
  });
});
