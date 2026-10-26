// El repositorio del teléfono sobre el SQLite de Node: lo que solo se ve al cerrar y volver a abrir
// la base (el número de cambio y las migraciones a medias).

import { describe, expect, it, jest } from '@jest/globals';

import type { Marca } from '@/dominio/dias';
import { sinCambios, sinComida } from './repositorio';
import { repositorioSQLite } from './sqlite';

// Como herramientas/expo-sqlite-node.mjs, pero la misma base sigue ahí al volver a abrirla por su nombre.
jest.mock('expo-sqlite', () => {
  // Dentro de jest.mock solo se puede require.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  const bases = new Map<string, InstanceType<typeof DatabaseSync>>();
  return {
    bases,
    async openDatabaseAsync(nombre: string) {
      if (!bases.has(nombre)) bases.set(nombre, new DatabaseSync(':memory:'));
      const db = bases.get(nombre)!;
      const preparar = (sql: string, parametros: unknown[]) => [db.prepare(sql), parametros.flat()] as const;
      return {
        async execAsync(sql: string) {
          db.exec(sql);
        },
        async getFirstAsync(sql: string, ...parametros: never[]) {
          const [consulta, valores] = preparar(sql, parametros);
          return consulta.get(...(valores as never[])) ?? null;
        },
        async getAllAsync(sql: string, ...parametros: never[]) {
          const [consulta, valores] = preparar(sql, parametros);
          return consulta.all(...(valores as never[]));
        },
        async runAsync(sql: string, ...parametros: never[]) {
          const [consulta, valores] = preparar(sql, parametros);
          consulta.run(...(valores as never[]));
        },
        async withTransactionAsync(tarea: () => Promise<void>) {
          db.exec('BEGIN');
          try {
            await tarea();
            db.exec('COMMIT');
          } catch (error) {
            db.exec('ROLLBACK');
            throw error;
          }
        },
      };
    },
  };
});

const base = (nombre: string) => (jest.requireMock('expo-sqlite') as { bases: Map<string, { exec(sql: string): void }> }).bases.get(nombre)!;
const nada = { habitos: [], periodos: null, marcas: [], dias: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() };
const marca = (dia: string): Marca => ({ habito: 'leer', dia, hecho: true, momento: `${dia}T12:00:00.000Z`, origen: 'toque' });

describe('el repositorio en SQLite', () => {
  it('al volver a abrir no da números de cambio por debajo de lo ya subido', async () => {
    const r = await repositorioSQLite('reabrir.db');
    await r.guardarMarca(marca('2026-10-25'));
    await r.guardarMarca(marca('2026-10-26'));
    await r.subidoHasta((await r.pendientes()).hasta);
    // Otro teléfono cambió la última: la de la cuenta gana y queda con el número 0.
    await r.guardarDeLaNube({ ...nada, marcas: [{ ...marca('2026-10-26'), hecho: false }] });

    const otraVez = await repositorioSQLite('reabrir.db');
    expect(sinCambios(await otraVez.pendientes())).toBe(true);
    await otraVez.guardarMarca(marca('2026-10-27'));
    expect((await otraVez.pendientes()).marcas.map((m) => m.dia)).toEqual(['2026-10-27']);
  });

  it('una migración que quedó a medias se termina la próxima vez', async () => {
    // Se cortó después de crear una tabla, antes de anotar la versión.
    await repositorioSQLite('previa.db');
    base('previa.db').exec('PRAGMA user_version = 0');
    const r = await repositorioSQLite('previa.db');
    await r.guardarMarca(marca('2026-10-26'));
    expect((await r.pendientes()).marcas).toHaveLength(1);
  });
});
