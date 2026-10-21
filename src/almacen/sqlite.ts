// El repositorio de la app: SQLite en el teléfono. Las versiones del esquema van en
// PRAGMA user_version; para cambiarlo se suma un bloque `if (version < N)` al final de migrar().

import * as SQLite from 'expo-sqlite';

import type { Periodo } from '@/dominio/constelaciones';
import type { Dia, Marca, Origen } from '@/dominio/dias';
import type { ClaveDia, DiaSemana } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { IdDeLogro, Logro } from '@/dominio/logros';
import type { Guardado, Repositorio } from './repositorio';

async function migrar(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL');
  let version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE habitos (id TEXT PRIMARY KEY NOT NULL, datos TEXT NOT NULL);
      CREATE TABLE periodos (dia INTEGER NOT NULL, constelacion TEXT NOT NULL, cantidad INTEGER NOT NULL, desde TEXT NOT NULL, hasta TEXT);
      CREATE TABLE marcas (habito TEXT NOT NULL, dia TEXT NOT NULL, hecho INTEGER NOT NULL, momento TEXT NOT NULL, origen TEXT NOT NULL, PRIMARY KEY (habito, dia));
      CREATE TABLE dias (clave TEXT PRIMARY KEY NOT NULL, constelacion TEXT, habitos TEXT NOT NULL, hechos TEXT NOT NULL, luz INTEGER NOT NULL, completo INTEGER NOT NULL);
      CREATE TABLE logros (id TEXT PRIMARY KEY NOT NULL, desde TEXT NOT NULL);
      CREATE TABLE ajustes (clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL);
    `);
    version = 1;
  }
  await db.execAsync(`PRAGMA user_version = ${version}`);
}

type FilaPeriodo = { dia: number; constelacion: string; cantidad: number; desde: string; hasta: string | null };
type FilaMarca = { habito: string; dia: string; hecho: number; momento: string; origen: string };
type FilaDia = { clave: string; constelacion: string | null; habitos: string; hechos: string; luz: number; completo: number };

export async function repositorioSQLite(nombre = 'moss.db'): Promise<Repositorio> {
  const db = await SQLite.openDatabaseAsync(nombre);
  await migrar(db);

  return {
    async cargar(desde: ClaveDia): Promise<Guardado> {
      const [habitos, periodos, marcas, dias, logros, ajustes] = await Promise.all([
        db.getAllAsync<{ datos: string }>('SELECT datos FROM habitos'),
        db.getAllAsync<FilaPeriodo>('SELECT * FROM periodos'),
        db.getAllAsync<FilaMarca>('SELECT * FROM marcas WHERE dia >= ?', desde),
        db.getAllAsync<FilaDia>('SELECT * FROM dias'),
        db.getAllAsync<{ id: string; desde: string }>('SELECT * FROM logros'),
        db.getAllAsync<{ clave: string; valor: string }>('SELECT * FROM ajustes'),
      ]);
      return {
        habitos: habitos.map((f) => JSON.parse(f.datos) as Habito),
        periodos: periodos.map((f): Periodo => ({
          dia: f.dia as DiaSemana, constelacion: f.constelacion, cantidad: f.cantidad, desde: f.desde, ...(f.hasta ? { hasta: f.hasta } : {}),
        })),
        marcas: marcas.map((f): Marca => ({ habito: f.habito, dia: f.dia, hecho: f.hecho === 1, momento: f.momento, origen: f.origen as Origen })),
        dias: dias.map((f): Dia => ({
          clave: f.clave, constelacion: f.constelacion, habitos: JSON.parse(f.habitos), hechos: JSON.parse(f.hechos), luz: f.luz, completo: f.completo === 1,
        })),
        logros: logros.map((f): Logro => ({ id: f.id as IdDeLogro, desde: f.desde })),
        ajustes: Object.fromEntries(ajustes.map((f) => [f.clave, f.valor])),
      };
    },
    async guardarHabitos(habitos) {
      await db.withTransactionAsync(async () => {
        for (const h of habitos) await db.runAsync('INSERT OR REPLACE INTO habitos (id, datos) VALUES (?, ?)', h.id, JSON.stringify(h));
      });
    },
    async guardarPeriodos(periodos) {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM periodos');
        for (const p of periodos) {
          await db.runAsync('INSERT INTO periodos (dia, constelacion, cantidad, desde, hasta) VALUES (?, ?, ?, ?, ?)', p.dia, p.constelacion, p.cantidad, p.desde, p.hasta ?? null);
        }
      });
    },
    async guardarMarca(m) {
      await db.runAsync('INSERT OR REPLACE INTO marcas (habito, dia, hecho, momento, origen) VALUES (?, ?, ?, ?, ?)', m.habito, m.dia, m.hecho ? 1 : 0, m.momento, m.origen);
    },
    async guardarDia(d) {
      await db.runAsync(
        'INSERT OR REPLACE INTO dias (clave, constelacion, habitos, hechos, luz, completo) VALUES (?, ?, ?, ?, ?, ?)',
        d.clave, d.constelacion, JSON.stringify(d.habitos), JSON.stringify(d.hechos), d.luz, d.completo ? 1 : 0,
      );
    },
    async guardarLogros(logros) {
      await db.withTransactionAsync(async () => {
        for (const l of logros) await db.runAsync('INSERT OR IGNORE INTO logros (id, desde) VALUES (?, ?)', l.id, l.desde);
      });
    },
    async guardarAjuste(clave, valor) {
      await db.runAsync('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)', clave, valor);
    },
  };
}
