import { describe, expect, it } from '@jest/globals';

import { borrarEnElServidor, usaApple, type PasosParaBorrar, type UsuarioDeLaSesion } from './cuentaApple';

const conCorreo: UsuarioDeLaSesion = { app_metadata: { provider: 'email', providers: ['email'] }, identities: [{ provider: 'email' }] };
const conApple: UsuarioDeLaSesion = { app_metadata: { provider: 'apple', providers: ['apple'] }, identities: [{ provider: 'apple' }] };

/** Los pasos de mentira, con lo que se llamó y en qué orden. */
function pasos({ codigo = 'codigo-nuevo', funcion = null, sinRevocar = true }: { codigo?: string | null; funcion?: number | null; sinRevocar?: boolean } = {}) {
  const llamadas: string[] = [];
  const codigos: (string | undefined)[] = [];
  const p: PasosParaBorrar = {
    codigoDeApple: async () => {
      llamadas.push('apple');
      return codigo;
    },
    funcion: async (c) => {
      llamadas.push('funcion');
      codigos.push(c);
      return funcion;
    },
    sinRevocar: async () => {
      llamadas.push('sinRevocar');
      return sinRevocar;
    },
  };
  return { p, llamadas, codigos };
}

describe('si la cuenta usa Apple', () => {
  it('se creó con Apple, lo vinculó después o solo tiene la identidad', () => {
    expect(usaApple(conApple)).toBe(true);
    expect(usaApple({ app_metadata: { provider: 'email', providers: ['email', 'apple'] } })).toBe(true);
    expect(usaApple({ app_metadata: {}, identities: [{ provider: 'email' }, { provider: 'apple' }] })).toBe(true);
  });

  it('con correo solo, sin datos o sin sesión, no', () => {
    expect(usaApple(conCorreo)).toBe(false);
    expect(usaApple({})).toBe(false);
    expect(usaApple({ app_metadata: null, identities: null })).toBe(false);
    expect(usaApple(null)).toBe(false);
    expect(usaApple(undefined)).toBe(false);
  });
});

describe('borrar la cuenta en el servidor', () => {
  it('con correo no pide Apple: la función borra sin código', async () => {
    const { p, llamadas, codigos } = pasos();
    expect(await borrarEnElServidor(conCorreo, p)).toBe(true);
    expect(llamadas).toEqual(['funcion']);
    expect(codigos).toEqual([undefined]);
  });

  it('con Apple confirma primero y manda el código nuevo', async () => {
    const { p, llamadas, codigos } = pasos({ codigo: 'c.0.abc' });
    expect(await borrarEnElServidor(conApple, p)).toBe(true);
    expect(llamadas).toEqual(['apple', 'funcion']);
    expect(codigos).toEqual(['c.0.abc']);
  });

  it('cancelar la hoja de Apple no borra nada, y no es un error', async () => {
    const { p, llamadas } = pasos({ codigo: null });
    expect(await borrarEnElServidor(conApple, p)).toBeNull();
    expect(llamadas).toEqual(['apple']);
  });

  it('si la función falla (Apple, la sesión, la conexión), no borra por otro lado', async () => {
    for (const estado of [0, 400, 401, 500, 502]) {
      const { p, llamadas } = pasos({ funcion: estado });
      expect(await borrarEnElServidor(conApple, p)).toBe(false);
      expect(llamadas).toEqual(['apple', 'funcion']);
    }
  });

  it('solo sin la función desplegada (404) borra como antes, y dice si pudo', async () => {
    const borro = pasos({ funcion: 404 });
    expect(await borrarEnElServidor(conCorreo, borro.p)).toBe(true);
    expect(borro.llamadas).toEqual(['funcion', 'sinRevocar']);

    const noPudo = pasos({ funcion: 404, sinRevocar: false });
    expect(await borrarEnElServidor(conApple, noPudo.p)).toBe(false);
    expect(noPudo.llamadas).toEqual(['apple', 'funcion', 'sinRevocar']);
  });
});
