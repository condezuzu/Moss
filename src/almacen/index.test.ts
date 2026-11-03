// La sesión que Moss deja para Ascent en el llavero compartido (spec/ascent.md, D27): con tu nombre
// de Moss, que va aparte del perfil. Y el reloj que cambia de día a la hora elegida. Lo del teléfono va de mentira.

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';

import { cambiarDeDiaAlCorte, compartirLaSesion } from './index';

const mockDejar = jest.fn();
const mockBorrar = jest.fn(async () => {});
let mockEstado: { perfil: object | null; nombre: { valor: string; actualizado: string } | null } = { perfil: null, nombre: null };
let mockConAscent = true;

jest.mock('@/lib/banderas', () => ({
  get CON_ASCENT() {
    return mockConAscent;
  },
}));
jest.mock('@/lib/llavero', () => ({ dejarMiSesion: (s: unknown) => mockDejar(s), borrarMiSesion: () => mockBorrar() }));
jest.mock('./almacen', () => ({ crearAlmacen: () => ({ estado: () => mockEstado }) }));
jest.mock('@/comida/catalogoLocal', () => ({}));
jest.mock('@/datos/catalogo', () => ({ catalogo: [] }));
jest.mock('@/lib/supabase', () => ({ haySupabase: () => false }));
jest.mock('@/recordatorios/programar', () => ({}));
jest.mock('@/secciones/perfil/cuentaApple', () => ({}));
jest.mock('@/salud/leer', () => ({}));
jest.mock('@/salud/nocheSinReloj', () => ({}));
jest.mock('@/textos', () => ({ idioma: () => 'es' }));
jest.mock('./abrir', () => ({}));
jest.mock('./buzonDeMoss', () => ({}));
jest.mock('./remoto', () => ({}));
jest.mock('./semilla', () => ({}));
jest.mock('./sincronizar', () => ({}));
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
