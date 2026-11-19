import { describe, expect, it } from '@jest/globals';

import * as P from './puntajeMuscular';
import { casos } from './puntajeMuscular.casos.json';

// Los casos son los mismos en Moss y en Ascent: si uno falla acá, falla allá.
describe('puntajeMuscular (los casos compartidos)', () => {
  it.each(casos.map((c) => [c.que, c] as const))('%s', (_, c) => {
    const f = (P as unknown as Record<string, (...a: unknown[]) => unknown>)[c.funcion];
    const r = f(...(c.entrada as unknown[]));
    expect(r instanceof Map ? Object.fromEntries(r) : r).toEqual(c.salida);
  });
});
