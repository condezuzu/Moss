// Lo de expo-sqlite que usa src/almacen/sqlite.ts, sobre el SQLite que trae Node: así el
// repositorio del teléfono se prueba fuera del teléfono (lo usa verificar-supabase.mjs).
// Cada base abierta es nueva y vive en memoria.

import { DatabaseSync } from 'node:sqlite';

export async function openDatabaseAsync() {
  const db = new DatabaseSync(':memory:');
  const preparar = (sql, parametros) => [db.prepare(sql), parametros.flat()];
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async getFirstAsync(sql, ...parametros) {
      const [consulta, valores] = preparar(sql, parametros);
      return consulta.get(...valores) ?? null;
    },
    async getAllAsync(sql, ...parametros) {
      const [consulta, valores] = preparar(sql, parametros);
      return consulta.all(...valores);
    },
    async runAsync(sql, ...parametros) {
      const [consulta, valores] = preparar(sql, parametros);
      const r = consulta.run(...valores);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async withTransactionAsync(tarea) {
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
}
