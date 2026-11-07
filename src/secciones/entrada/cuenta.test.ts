// Entrar con Apple: lo que se le dice a la persona según lo que falló, y el tope de espera a la cuenta.
// Apple y Supabase van de mentira.

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthRetryableFetchError } from '@supabase/supabase-js';

import { entrarConApple } from './cuenta';

type AlEntrar = { error: unknown };
const mockApple = jest.fn<() => Promise<{ identityToken: string | null; fullName: { givenName: string | null; familyName: string | null } | null }>>();
const mockEntrar = jest.fn<() => Promise<AlEntrar>>();
const mockNombre = jest.fn();

jest.mock('expo-apple-authentication', () => ({
  signInAsync: () => mockApple(),
  formatFullName: (p: { givenName?: string | null; familyName?: string | null }) => [p.givenName, p.familyName].filter(Boolean).join(' '),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));
jest.mock('@/almacen', () => ({ elAlmacen: () => ({ ponerNombre: (...x: unknown[]) => mockNombre(...x) }) }));
jest.mock('@/lib/supabase', () => ({
  haySupabase: () => true,
  supabase: () => ({ auth: { signInWithIdToken: () => mockEntrar() } }),
}));

/** Un error de Apple con su código, como los de expo-apple-authentication. */
const deApple = (code: string) => Object.assign(new Error('The operation couldn’t be completed.'), { code });

describe('entrar con Apple', () => {
  beforeEach(() => {
    mockApple.mockReset();
    mockEntrar.mockReset();
    mockNombre.mockReset();
    mockApple.mockResolvedValue({ identityToken: 'token', fullName: { givenName: 'Lucía', familyName: 'Pérez' } });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('cerrar la hoja de Apple no es un error: no se dice nada', async () => {
    mockApple.mockRejectedValue(deApple('ERR_REQUEST_CANCELED'));
    expect(await entrarConApple()).toEqual({ ok: false, error: null });
  });

  it('lo demás de Apple no es la conexión: «No se pudo entrar», y no «No hay conexión»', async () => {
    for (const code of ['ERR_REQUEST_FAILED', 'ERR_REQUEST_UNKNOWN', 'ERR_REQUEST_NOT_HANDLED', 'ERR_REQUEST_INVALID_RESPONSE']) {
      mockApple.mockRejectedValueOnce(deApple(code));
      expect(await entrarConApple()).toEqual({ ok: false, error: 'otro' });
    }
  });

  it('sin red, la cuenta no contesta: eso sí es la conexión', async () => {
    mockEntrar.mockResolvedValue({ error: new AuthRetryableFetchError('Failed to fetch', 0) });
    expect(await entrarConApple()).toEqual({ ok: false, error: 'conexion' });
    mockEntrar.mockRejectedValue(new TypeError('Network request failed'));
    expect(await entrarConApple()).toEqual({ ok: false, error: 'conexion' });
  });

  it('entra y guarda el nombre que trae Apple', async () => {
    mockEntrar.mockResolvedValue({ error: null });
    expect(await entrarConApple()).toEqual({ ok: true });
    expect(mockNombre).toHaveBeenCalledWith('Lucía Pérez', true);
  });

  it('si la cuenta no contesta en 20 segundos, es la conexión; si contesta después, el nombre igual se guarda', async () => {
    jest.useFakeTimers();
    let contestar: (x: AlEntrar) => void = () => {};
    mockEntrar.mockReturnValue(new Promise<AlEntrar>((listo) => { contestar = listo; }));
    const resultado = entrarConApple();
    await jest.advanceTimersByTimeAsync(19_000);
    let termino = false;
    resultado.then(() => { termino = true; }).catch(() => {});
    await Promise.resolve();
    expect(termino).toBe(false);
    await jest.advanceTimersByTimeAsync(1_500);
    expect(await resultado).toEqual({ ok: false, error: 'conexion' });
    // Apple da el nombre solo la primera vez: si la cuenta se creó igual, no se pierde.
    contestar({ error: null });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockNombre).toHaveBeenCalledWith('Lucía Pérez', true);
  });
});
