import { describe, expect, it } from '@jest/globals';

import { borrarEnElServidor, usaApple, yaNoEsDeMoss, type PasosParaBorrar, type UsuarioDeLaSesion } from './cuentaApple';

const conCorreo: UsuarioDeLaSesion = { app_metadata: { provider: 'email', providers: ['email'] }, identities: [{ provider: 'email' }] };
const conApple: UsuarioDeLaSesion = { app_metadata: { provider: 'apple', providers: ['apple'] }, identities: [{ provider: 'apple' }] };
/** El mismo usuario de Auth para Moss (Apple) y Ascent (el correo): Supabase unió las dos por el correo. */
const compartida: UsuarioDeLaSesion = { app_metadata: { provider: 'email', providers: ['email', 'apple'] }, identities: [{ provider: 'email' }, { provider: 'apple' }] };

/** Los pasos de mentira, con lo que se llamó y en qué orden. */
function pasos({ codigo = 'codigo-nuevo', funcion = null }: { codigo?: string | null; funcion?: number | null } = {}) {
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
  };
  return { p, llamadas, codigos };
}

describe('si la cuenta usa Apple', () => {
  it('se creó con Apple, lo vinculó después o solo tiene la identidad', () => {
    expect(usaApple(conApple)).toBe(true);
    expect(usaApple(compartida)).toBe(true);
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

describe('si la sesión ya no es de una cuenta de Moss', () => {
  it('con Apple sigue siendo de Moss, sola o junto al correo de Ascent', () => {
    expect(yaNoEsDeMoss(conApple)).toBe(false);
    expect(yaNoEsDeMoss(compartida)).toBe(false);
  });

  it('sin Apple (se la quitaron al borrar la cuenta de Moss desde otro teléfono), ya no', () => {
    expect(yaNoEsDeMoss(conCorreo)).toBe(true);
  });

  it('sin las identidades no se sabe, y se sigue como siempre', () => {
    expect(yaNoEsDeMoss({ app_metadata: { providers: ['email'] } })).toBe(false);
    expect(yaNoEsDeMoss({ identities: [] })).toBe(false);
    expect(yaNoEsDeMoss({ identities: null })).toBe(false);
    expect(yaNoEsDeMoss(null)).toBe(false);
  });
});

describe('borrar la cuenta en el servidor', () => {
  it('con Apple confirma primero y manda el código nuevo', async () => {
    const { p, llamadas, codigos } = pasos({ codigo: 'c.0.abc' });
    expect(await borrarEnElServidor(conApple, p)).toBe(true);
    expect(llamadas).toEqual(['apple', 'funcion']);
    expect(codigos).toEqual(['c.0.abc']);
  });

  it('también si la cuenta es la misma de Ascent: la función decide qué se borra', async () => {
    const { p, llamadas } = pasos();
    expect(await borrarEnElServidor(compartida, p)).toBe(true);
    expect(llamadas).toEqual(['apple', 'funcion']);
  });

  it('sin Apple no pide la hoja: la función borra sin código', async () => {
    const { p, llamadas, codigos } = pasos();
    expect(await borrarEnElServidor(conCorreo, p)).toBe(true);
    expect(llamadas).toEqual(['funcion']);
    expect(codigos).toEqual([undefined]);
  });

  it('cancelar la hoja de Apple no borra nada, y no es un error', async () => {
    const { p, llamadas } = pasos({ codigo: null });
    expect(await borrarEnElServidor(conApple, p)).toBeNull();
    expect(llamadas).toEqual(['apple']);
  });

  it('si la función falla o no está desplegada (404), no borra por otro lado', async () => {
    for (const estado of [0, 400, 401, 404, 500, 502]) {
      const { p, llamadas } = pasos({ funcion: estado });
      expect(await borrarEnElServidor(conApple, p)).toBe(false);
      expect(llamadas).toEqual(['apple', 'funcion']);
    }
  });
});
