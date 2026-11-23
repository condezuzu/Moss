// Subir a Supabase con una fila que la base no acepta: el resto sube igual. El esquema de verdad se
// prueba con `npm run supabase:verificar`.

import { describe, expect, it, jest } from '@jest/globals';

import type { Marca } from '../dominio/dias';
import { remotoSupabase, type Cliente } from './remoto';
import { sinComida, type Cambios } from './repositorio';

const nada = (): Cambios => ({ habitos: [], periodos: null, marcas: [], dias: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });
const marca = (habito: string): Marca => ({ habito, dia: '2026-10-26', hecho: true, momento: '2026-10-26T12:00:00.000Z', origen: 'toque' });

/** Un Supabase de mentira: la base rechaza las marcas del hábito «malo» con un CHECK, o todo si no hay conexión. */
function cliente(conexion = true) {
  const guardadas: string[] = [];
  const falso = {
    from: () => ({
      upsert: async (filas: { habito: string }[]) => {
        if (!conexion) return { error: { message: 'Failed to fetch', code: '' } };
        if (filas.some((f) => f.habito === 'malo')) return { error: { message: 'viola un check', code: '23514' } };
        guardadas.push(...filas.map((f) => f.habito));
        return { error: null };
      },
    }),
    rpc: async () => ({ error: null }),
  };
  return { cliente: falso as unknown as Cliente, guardadas };
}

describe('subir a la cuenta', () => {
  it('lo que la base no acepta queda afuera y sube todo lo demás', async () => {
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const c = cliente();
    await remotoSupabase(c.cliente).subir({ ...nada(), marcas: ['leer', 'malo', 'meditar', 'correr', 'agua'].map(marca) });
    expect(c.guardadas.sort()).toEqual(['agua', 'correr', 'leer', 'meditar']);
    expect(aviso).toHaveBeenCalledTimes(1);
    aviso.mockRestore();
  });

  it('tu nombre sube con su hora por su función, sin tocar lo demás del perfil', async () => {
    const llamadas: [string, object][] = [];
    const falso = { from: () => ({ upsert: async () => ({ error: null }) }), rpc: async (f: string, a: object) => { llamadas.push([f, a]); return { error: null }; } };
    await remotoSupabase(falso as unknown as Cliente).subir({ ...nada(), nombre: { valor: 'Ana', actualizado: '2026-10-26T12:00:00.000Z' } });
    expect(llamadas).toEqual([['poner_nombre', { valor: 'Ana', cuando: '2026-10-26T12:00:00.000Z' }]]);
  });

  it('los nombres y las marcas más largos de lo que acepta la cuenta se recortan, en lugar de quedar solo en el teléfono', async () => {
    const filas: Record<string, { nombre: string; marca?: string }[]> = {};
    const falso = { from: (tabla: string) => ({ upsert: async (lista: { nombre: string }[]) => { filas[tabla] = lista; return { error: null }; } }), rpc: async () => ({ error: null }) };
    // De Open Food Facts, sin límite; con un emoji justo en el corte, que no se parte.
    const largo = `${'a'.repeat(119)}🍪${'b'.repeat(200)}`;
    const valores = { kcal: 1, proteina: 0, carbohidratos: 0, grasas: 0 };
    await remotoSupabase(falso as unknown as Cliente).subir({
      ...nada(),
      registros: [{ id: 'r1', dia: '2026-10-26', comida: 'snack', momento: '2026-10-26T12:00:00.000Z', fuente: 'off', ref: '123', nombre: largo, cantidad: null, valores, planificado: false, actualizado: '2026-10-26T12:00:00.000Z' }],
      propios: [{ id: 'p1', nombre: largo, marca: largo, codigo: null, por100g: valores, porciones: [], actualizado: '2026-10-26T12:00:00.000Z' }],
      recetas: [{ id: 'c1', tipo: 'comida', nombre: largo, items: [], porciones: 1, pesoFinal: null, actualizado: '2026-10-26T12:00:00.000Z' }],
    });
    const letras = (texto?: string) => Array.from(texto ?? '').length;
    expect([letras(filas.registros[0].nombre), letras(filas.propios[0].nombre), letras(filas.propios[0].marca), letras(filas.recetas[0].nombre)]).toEqual([200, 200, 120, 120]);
    expect(filas.propios[0].marca?.endsWith('🍪')).toBe(true);
  });

  it('sin conexión tira el error, para reintentar', async () => {
    const c = cliente(false);
    await expect(remotoSupabase(c.cliente).subir({ ...nada(), marcas: [marca('leer')] })).rejects.toThrow('marcas: Failed to fetch');
  });
});
