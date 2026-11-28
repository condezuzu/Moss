// La sesión que Moss deja para Ascent en el llavero compartido (spec/ascent.md, D27): con tu nombre
// de Moss, que va aparte del perfil. La sesión con la cuenta (cuándo se sale de verdad, lo que falta subir y la
// espera de la entrada). Y el reloj que cambia de día a la hora elegida. Lo del teléfono va de mentira.

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';

import { cambiarDeDiaAlCorte, compartirLaSesion, esperarLaCuenta, salirAProposito, sincronizarConLaCuenta, subirLoQueFalta } from './index';
import type { Almacen } from './almacen';
import { sinComida, type Pendientes } from './repositorio';

const mockDejar = jest.fn();
const mockBorrar = jest.fn(async () => {});
let mockEstado: { perfil: object | null; nombre: { valor: string; actualizado: string } | null } = { perfil: null, nombre: null };
let mockConAscent = true;
// La cuenta de mentira: Supabase avisa cada cambio de sesión a quien lo oye, y la suscripción anota si se salió.
let mockConSupabase = false;
let mockAvisar: (evento: string, sesion: unknown) => void = () => {};
const mockCuentaDePremium = jest.fn(async (_creada: unknown, _salio?: boolean) => {});
let mockPrimeraBajada: Promise<void> = Promise.resolve();

jest.mock('@/lib/banderas', () => ({
  get CON_ASCENT() {
    return mockConAscent;
  },
}));
jest.mock('@/lib/llavero', () => ({ dejarMiSesion: (s: unknown) => mockDejar(s), borrarMiSesion: () => mockBorrar() }));
jest.mock('./almacen', () => ({ crearAlmacen: () => ({ estado: () => mockEstado }) }));
jest.mock('@/comida/catalogoLocal', () => ({ actualizarCatalogo: async () => {} }));
jest.mock('@/datos/catalogo', () => ({ catalogo: [] }));
jest.mock('@/lib/supabase', () => ({
  haySupabase: () => mockConSupabase,
  supabase: () => ({
    auth: {
      onAuthStateChange: (oyente: (evento: string, sesion: unknown) => void) => {
        mockAvisar = oyente;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signOut: async () => ({ error: null }),
    },
  }),
}));
jest.mock('@/lib/premium', () => ({ cuentaDePremium: (creada: unknown, salio?: boolean) => mockCuentaDePremium(creada, salio) }));
jest.mock('@/recordatorios/programar', () => ({}));
jest.mock('@/secciones/perfil/cuentaApple', () => ({ yaNoEsDeMoss: () => false }));
jest.mock('@/salud/leer', () => ({}));
jest.mock('@/salud/salud', () => ({}));
jest.mock('@/salud/nocheSinReloj', () => ({}));
jest.mock('@/textos', () => ({ idioma: () => 'es' }));
jest.mock('./abrir', () => ({}));
jest.mock('./buzonDeMoss', () => ({ avisarSesion: () => {} }));
jest.mock('./remoto', () => ({ remotoSupabase: () => ({}) }));
jest.mock('./semilla', () => ({}));
jest.mock('./sincronizar', () => ({
  crearSincronizador: () => ({
    arrancar: () => {}, parar: () => {}, terminar: async () => {}, vuelta: async () => true, alVolver: () => {}, deOtraCuenta: () => false, primeraBajada: () => mockPrimeraBajada,
  }),
}));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const sesion = { user: { id: 'u1' }, access_token: 'token', expires_at: 2_000_000_000, expires_in: 3600 } as unknown as Session;

describe('la sesión para Ascent', () => {
  beforeEach(() => {
    mockDejar.mockClear();
    mockBorrar.mockClear();
    mockConAscent = true;
  });

  it('con la vinculación apagada no se deja, y se saca la que hubiera quedado', () => {
    mockConAscent = false;
    mockEstado = { perfil: null, nombre: { valor: 'Agustín', actualizado: '2026-10-27T12:00:00.000Z' } };
    compartirLaSesion('SIGNED_IN', sesion);
    compartirLaSesion('INITIAL_SESSION', sesion);
    expect(mockDejar).not.toHaveBeenCalled();
    expect(mockBorrar).toHaveBeenCalledTimes(2);
  });

  it('lleva tu nombre de Moss, que no está en el perfil', () => {
    mockEstado = { perfil: { sexo: 'm', alturaCm: 175 }, nombre: { valor: 'Agustín', actualizado: '2026-10-27T12:00:00.000Z' } };
    compartirLaSesion('SIGNED_IN', sesion);
    expect(mockDejar).toHaveBeenCalledWith({ usuario: 'u1', nombre: 'Agustín', token: 'token', vence: 2_000_000_000 });
  });

  it('sin nombre, vacío; y al salir se saca del llavero', () => {
    mockEstado = { perfil: null, nombre: null };
    compartirLaSesion('TOKEN_REFRESHED', sesion);
    expect(mockDejar).toHaveBeenCalledWith(expect.objectContaining({ nombre: '' }));
    compartirLaSesion('SIGNED_OUT', null);
    expect(mockBorrar).toHaveBeenCalled();
  });
});

describe('la sesión con la cuenta', () => {
  const unRato = () => new Promise((listo) => setTimeout(listo, 0));
  /** Un almacén de mentira con algo sin subir, o no. */
  const almacenCon = (sinSubir: boolean) => {
    const pendientes: Pendientes = { ...sinComida(), habitos: [], periodos: null, marcas: [], dias: [], logros: [], perfil: null, metas: [], pesos: [], semilla: sinSubir ? 'semilla' : null, hasta: 1 };
    return { enCola: async (tarea: (r: { pendientes: () => Promise<Pendientes> }) => unknown) => tarea({ pendientes: async () => pendientes }) } as unknown as Almacen;
  };
  const salio = () => mockCuentaDePremium.mock.calls.at(-1)?.[1];

  beforeEach(() => {
    mockConSupabase = true;
    mockCuentaDePremium.mockClear();
    mockPrimeraBajada = Promise.resolve();
  });

  it('una sesión que se corta sola no es salir: la cuenta no se olvida; cerrar sesión, sí', async () => {
    const cuenta = sincronizarConLaCuenta(almacenCon(false));
    mockAvisar('SIGNED_IN', sesion);
    await unRato();
    // supabase-js también avisa SIGNED_OUT cuando el servidor ya no acepta la renovación.
    mockAvisar('SIGNED_OUT', null);
    await unRato();
    expect(salio()).toBe(false);
    await salirAProposito(async () => mockAvisar('SIGNED_OUT', null));
    await unRato();
    expect(salio()).toBe(true);
    cuenta.parar();
  });

  it('sin sesión, lo que falta subir no se da por subido: cerrar sesión avisa antes de perderlo', async () => {
    const cuenta = sincronizarConLaCuenta(almacenCon(true));
    mockAvisar('SIGNED_OUT', null);
    await unRato();
    await expect(subirLoQueFalta()).rejects.toThrow();
    cuenta.parar();
    const nada = sincronizarConLaCuenta(almacenCon(false));
    await expect(subirLoQueFalta()).resolves.toBeUndefined();
    nada.parar();
  });

  it('con los datos de otra cuenta, la vuelta no sube nada: lo que falta tampoco se da por subido', async () => {
    const pendientes: Pendientes = { ...sinComida(), habitos: [], periodos: null, marcas: [], dias: [], logros: [], perfil: null, metas: [], pesos: [], semilla: 'semilla', hasta: 1 };
    const deOtra = {
      iniciar: async () => {},
      enCola: async (tarea: (r: object) => unknown) => tarea({ pendientes: async () => pendientes, leerAjuste: async () => 'otra-cuenta', guardarAjuste: async () => {} }),
    } as unknown as Almacen;
    const cuenta = sincronizarConLaCuenta(deOtra);
    mockAvisar('SIGNED_IN', sesion);
    await unRato();
    await expect(subirLoQueFalta()).rejects.toThrow();
    cuenta.parar();
  });

  it('la entrada espera lo que ya tenía la cuenta, pero no más que el tope', async () => {
    const cuenta = sincronizarConLaCuenta(almacenCon(false));
    // Sin sesión no hay nada que esperar.
    expect(await esperarLaCuenta(10)).toBe(true);
    mockPrimeraBajada = new Promise(() => {});
    mockAvisar('SIGNED_IN', sesion);
    await unRato();
    expect(await esperarLaCuenta(10)).toBe(false);
    cuenta.parar();
    mockPrimeraBajada = Promise.resolve();
    const otra = sincronizarConLaCuenta(almacenCon(false));
    mockAvisar('SIGNED_IN', sesion);
    await unRato();
    expect(await esperarLaCuenta(10)).toBe(true);
    otra.parar();
  });
});

describe('el día cambia a la hora elegida (D32)', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('el reloj se vuelve a armar cuando llega el corte guardado o se elige otro', () => {
    // Moss se abre a las 23:50 con el corte de fábrica; al terminar de cargar llega el guardado, la medianoche.
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 4, 23, 50));
    let corte = 4 * 60;
    const oyentes = new Set<() => void>();
    const revisarDia = jest.fn(() => true);
    const almacen = { estado: () => ({ corte }), suscribir: (o: () => void) => { oyentes.add(o); return () => oyentes.delete(o); }, revisarDia };
    const parar = cambiarDeDiaAlCorte(almacen as unknown as Parameters<typeof cambiarDeDiaAlCorte>[0]);
    corte = 0;
    oyentes.forEach((o) => o());
    // A la medianoche cambia el día, y no recién a las 4.
    jest.advanceTimersByTime(10 * 60_000 + 500);
    expect(revisarDia).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(4 * 60 * 60_000);
    expect(revisarDia).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(20 * 60 * 60_000);
    expect(revisarDia).toHaveBeenCalledTimes(2);
    // Elegido el corte a las 5 en Perfil: el próximo, a las 5.
    corte = 5 * 60;
    oyentes.forEach((o) => o());
    jest.advanceTimersByTime(4 * 60 * 60_000 + 59 * 60_000);
    expect(revisarDia).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(2 * 60_000);
    expect(revisarDia).toHaveBeenCalledTimes(3);
    parar();
    jest.advanceTimersByTime(48 * 60 * 60_000);
    expect(revisarDia).toHaveBeenCalledTimes(3);
    expect(oyentes.size).toBe(0);
  });
});
