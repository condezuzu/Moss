import { describe, expect, it } from '@jest/globals';

import { leerSesion, vigente } from './sesionCompartida';

const de = (x: object) => JSON.stringify({ v: 1, app: 'ascent', usuario: 'u-1', nombre: 'agustin', token: 'tok', vence: 2_000_000_000, ...x });

describe('la sesión del llavero compartido', () => {
  it('lee la que tiene la forma del contrato', () => {
    expect(leerSesion(de({}), 'ascent')).toEqual({ v: 1, app: 'ascent', usuario: 'u-1', nombre: 'agustin', token: 'tok', vence: 2_000_000_000 });
  });

  it('descarta la de otra app, otra versión, sin token o lo que no es JSON', () => {
    expect(leerSesion(de({}), 'moss')).toBeNull();
    expect(leerSesion(de({ v: 2 }), 'ascent')).toBeNull();
    expect(leerSesion(de({ token: '' }), 'ascent')).toBeNull();
    expect(leerSesion('no', 'ascent')).toBeNull();
    expect(leerSesion(null, 'ascent')).toBeNull();
  });

  it('sin nombre queda vacío', () => {
    expect(leerSesion(de({ nombre: 3 }), 'ascent')?.nombre).toBe('');
  });

  it('vence un minuto antes: el servidor tarda en revisarla', () => {
    const ahora = 1_000_000_000_000;
    expect(vigente({ vence: ahora / 1000 + 120 }, ahora)).toBe(true);
    expect(vigente({ vence: ahora / 1000 + 30 }, ahora)).toBe(false);
  });
});
