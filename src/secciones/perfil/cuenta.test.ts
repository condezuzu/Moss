// Lo de Perfil que sale del teléfono: el correo sin conexión, borrar y salir de a uno, «Cerrar igual»
// sin conexión, el velo de espera (cuándo empieza, cuándo dice «Listo» y cuándo se va) y exportar con dos
// toques. La cuenta, el almacén y el teléfono van de mentira.

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { Alert, type AlertButton } from 'react-native';

type Sesion = { user: { email?: string; identities?: { provider: string }[] } } | null;
type AlLeer = { data: { session: Sesion }; error: unknown };

const mockGuardado = new Map<string, string>();
const mockLeerSesion = jest.fn<() => Promise<AlLeer>>();
const mockBorrarDatos = jest.fn<() => Promise<{ error: unknown }>>();
const mockSubir = jest.fn<() => Promise<void>>();
const mockVistaRapida = jest.fn<() => Promise<void>>();
const mockOlvidar = jest.fn(async () => {});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: async (k: string) => mockGuardado.get(k) ?? null,
  setItem: async (k: string, v: string) => { mockGuardado.set(k, v); },
  removeItem: async (k: string) => { mockGuardado.delete(k); },
}));
jest.mock('expo-apple-authentication', () => ({ signInAsync: async () => ({ authorizationCode: 'codigo' }) }));
/** Un archivo de mentira: Vista Rápida es la de mockVistaRapida. */
class MockArchivo {
  uri = 'file:///cache/moss.csv';
  static async canPreview(): Promise<boolean> {
    return true;
  }
  static preview(): Promise<void> {
    return mockVistaRapida();
  }
  create() {}
  writeSync() {}
}

jest.mock('expo-file-system', () => ({ Paths: { cache: 'cache' }, File: MockArchivo }));
jest.mock('@/almacen', () => ({
  elAlmacen: () => ({ olvidarTodo: () => mockOlvidar(), paraExportar: async () => ({ registros: [], pesos: [], metas: [] }) }),
  sinSincronizar: (hacer: () => Promise<unknown>) => hacer(),
  subirLoQueFalta: () => mockSubir(),
}));
jest.mock('@/almacen/buzonDeMoss', () => ({ buzon: () => ({ vaciar: async () => {} }) }));
jest.mock('@/lib/llavero', () => ({ borrarMiSesion: async () => {} }));
jest.mock('@/lib/supabase', () => ({
  haySupabase: () => true,
  supabase: () => ({
    auth: { getSession: () => mockLeerSesion(), signOut: async () => ({ error: null }) },
    rpc: () => mockBorrarDatos(),
    functions: { invoke: async () => ({ error: null }) },
  }),
}));
jest.mock('@/textos', () => ({ t: (clave: string) => clave }));
jest.mock('@/secciones/comida/fotos', () => ({ borrarFotos: () => {} }));
jest.mock('./foto', () => ({ borrarFotoDePerfil: () => {} }));

const conSesion = (email?: string): AlLeer => ({ data: { session: { user: { email } } }, error: null });
const sinConexion = (): AlLeer => ({ data: { session: null }, error: new AuthRetryableFetchError('Failed to fetch', 0) });
const sinSesion = (): AlLeer => ({ data: { session: null }, error: null });

/** El módulo de nuevo, como al abrir Moss otra vez: lo guardado en el teléfono sigue, lo de la memoria no. */
function otraVez(): typeof import('./cuenta') {
  let modulo: typeof import('./cuenta') | undefined;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('./cuenta');
  });
  return modulo!;
}

describe('el correo de Perfil', () => {
  beforeEach(() => {
    mockGuardado.clear();
    mockLeerSesion.mockReset();
  });

  it('sin conexión y con la sesión vencida, es el último que se supo, también al abrir Moss otra vez', async () => {
    const cuenta = otraVez();
    mockLeerSesion.mockResolvedValue(conSesion('lucia@ejemplo.com'));
    expect(await cuenta.correoDeLaCuenta()).toBe('lucia@ejemplo.com');
    mockLeerSesion.mockResolvedValue(sinConexion());
    expect(await cuenta.correoDeLaCuenta()).toBe('lucia@ejemplo.com');
    expect(await otraVez().correoDeLaCuenta()).toBe('lucia@ejemplo.com');
  });

  it('la sesión que sigue sin un correo sabido es una cuenta igual: no «Sin cuenta»', async () => {
    mockLeerSesion.mockResolvedValue(sinConexion());
    expect(await otraVez().correoDeLaCuenta()).toBe('');
  });

  it('sin sesión de verdad no hay cuenta, y el correo se olvida', async () => {
    const cuenta = otraVez();
    mockLeerSesion.mockResolvedValue(conSesion('lucia@ejemplo.com'));
    await cuenta.correoDeLaCuenta();
    mockLeerSesion.mockResolvedValue(sinSesion());
    expect(await cuenta.correoDeLaCuenta()).toBeNull();
    await Promise.resolve();
    expect([...mockGuardado.values()]).not.toContain('lucia@ejemplo.com');
  });
});

describe('borrar y salir, de a uno', () => {
  beforeEach(() => {
    mockGuardado.clear();
    mockLeerSesion.mockReset();
    mockBorrarDatos.mockReset();
    mockSubir.mockReset();
  });

  it('un segundo «Borrar» mientras borra no hace nada (y no es un error)', async () => {
    const cuenta = otraVez();
    mockLeerSesion.mockResolvedValue(conSesion('lucia@ejemplo.com'));
    let terminar: () => void = () => {};
    mockBorrarDatos.mockReturnValue(new Promise((listo) => { terminar = () => listo({ error: null }); }));
    const primero = cuenta.borrarMisDatos();
    expect(await cuenta.borrarMisDatos()).toBeNull();
    // Cerrar sesión tampoco empieza mientras se borra.
    expect(await cuenta.cerrarSesion()).toBeNull();
    terminar();
    expect(await primero).toBe(true);
    expect(mockBorrarDatos).toHaveBeenCalledTimes(1);
  });

  it('«Cerrar igual» sin conexión dice que no se pudo, en vez de no hacer nada', async () => {
    const cuenta = otraVez();
    mockSubir.mockRejectedValue(new Error('sin conexión'));
    mockLeerSesion.mockResolvedValue(sinConexion());
    const avisos: { titulo: string | null | undefined; botones?: AlertButton[] }[] = [];
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation((titulo, _texto, botones) => { avisos.push({ titulo, botones }); });
    const salio = jest.fn();
    cuenta.salirDeLaCuenta(salio);
    await new Promise((listo) => setTimeout(listo, 0));
    expect(avisos[0]?.titulo).toBe('perfil.sinSubirTitulo');
    avisos[0].botones?.find((b) => b.text === 'perfil.cerrarIgual')?.onPress?.();
    await new Promise((listo) => setTimeout(listo, 0));
    expect(avisos[1]?.titulo).toBe('perfil.errorBorrar');
    expect(salio).not.toHaveBeenCalled();
    alerta.mockRestore();
  });
});

describe('el velo mientras se borra o se sale', () => {
  /** Lo que le pasa al velo y al teléfono, en orden. */
  let pasos: string[] = [];
  const espera = {
    empezar: () => {
      pasos.push('empezar');
    },
    listo: () => {
      pasos.push('listo');
    },
    dejar: () => {
      pasos.push('dejar');
    },
  };
  const unRato = () => new Promise((listo) => setTimeout(listo, 0));

  beforeEach(() => {
    pasos = [];
    mockGuardado.clear();
    mockLeerSesion.mockReset();
    mockBorrarDatos.mockReset();
    mockSubir.mockReset();
    mockOlvidar.mockReset();
    mockOlvidar.mockImplementation(async () => {
      pasos.push('vaciar');
    });
  });

  it('al cerrar sesión empieza, dice «Listo» con la sesión ya cerrada y antes de vaciar el teléfono, y no se va', async () => {
    const cuenta = otraVez();
    mockSubir.mockResolvedValue(undefined);
    // Con sesión antes de cerrarla, y sin sesión después.
    mockLeerSesion.mockResolvedValueOnce(conSesion('lucia@ejemplo.com')).mockResolvedValueOnce(sinSesion());
    const salio = jest.fn();
    cuenta.salirDeLaCuenta(salio, espera);
    await unRato();
    expect(pasos).toEqual(['empezar', 'listo', 'vaciar']);
    expect(salio).toHaveBeenCalledTimes(1);
  });

  it('sin subir lo último se va antes de preguntar y vuelve con «Cerrar igual»; sin conexión, se va antes de decirlo', async () => {
    const cuenta = otraVez();
    mockSubir.mockRejectedValue(new Error('sin conexión'));
    mockLeerSesion.mockResolvedValue(sinConexion());
    const avisos: { titulo: string | null | undefined; botones?: AlertButton[] }[] = [];
    const alerta = jest.spyOn(Alert, 'alert').mockImplementation((titulo, _texto, botones) => {
      pasos.push(`pregunta: ${titulo}`);
      avisos.push({ titulo, botones });
    });
    cuenta.salirDeLaCuenta(undefined, espera);
    await unRato();
    expect(pasos).toEqual(['empezar', 'dejar', 'pregunta: perfil.sinSubirTitulo']);
    avisos[0].botones?.find((b) => b.text === 'perfil.cerrarIgual')?.onPress?.();
    await unRato();
    expect(pasos.slice(3)).toEqual(['empezar', 'dejar', 'pregunta: perfil.errorBorrar']);
    expect(mockOlvidar).not.toHaveBeenCalled();
    alerta.mockRestore();
  });

  it('al borrar, «Listo» llega cuando lo de la cuenta ya se borró; si falla, no llega ni se vacía el teléfono', async () => {
    const cuenta = otraVez();
    mockLeerSesion.mockResolvedValue(conSesion('lucia@ejemplo.com'));
    expect(await cuenta.borrarLaCuenta(espera.listo)).toBe(true);
    expect(pasos).toEqual(['listo', 'vaciar']);
    pasos = [];
    mockBorrarDatos.mockResolvedValue({ error: new Error('sin conexión') });
    expect(await cuenta.borrarMisDatos(espera.listo)).toBe(false);
    expect(pasos).toEqual([]);
  });
});

describe('exportar', () => {
  beforeEach(() => {
    mockVistaRapida.mockReset();
  });

  it('avisa cuando los archivos están, sin esperar a que se cierre Vista Rápida', async () => {
    const cuenta = otraVez();
    let cerrar: () => void = () => {};
    mockVistaRapida.mockReturnValue(new Promise<void>((listo) => { cerrar = listo; }));
    const armados = jest.fn();
    const exportando = cuenta.exportarTodo('2026-11-06', armados);
    await new Promise((listo) => setTimeout(listo, 0));
    expect(armados).toHaveBeenCalledTimes(1);
    cerrar();
    await exportando;
    expect(armados).toHaveBeenCalledTimes(1);
  });

  it('con dos toques se abre una sola Vista Rápida, y el segundo no da error', async () => {
    const cuenta = otraVez();
    let cerrar: () => void = () => {};
    mockVistaRapida.mockReturnValue(new Promise<void>((listo) => { cerrar = listo; }));
    const primero = cuenta.exportarTodo('2026-11-06');
    await expect(cuenta.exportarTodo('2026-11-06')).resolves.toBeUndefined();
    cerrar();
    await primero;
    expect(mockVistaRapida).toHaveBeenCalledTimes(1);
    // Cerrada la primera, se puede exportar otra vez.
    mockVistaRapida.mockResolvedValue(undefined);
    await cuenta.exportarTodo('2026-11-06');
    expect(mockVistaRapida).toHaveBeenCalledTimes(2);
  });
});
