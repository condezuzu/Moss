// La sesión que Moss deja para Ascent en el llavero compartido (spec/ascent.md, D27): con tu nombre
// de Moss, que va aparte del perfil. Lo del teléfono va de mentira.

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Session } from '@supabase/supabase-js';

import { compartirLaSesion } from './index';

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
