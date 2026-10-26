// El repositorio de la app: SQLite en el teléfono. Las versiones del esquema van en
// PRAGMA user_version; para cambiarlo se suma un `bloque(N, ...)` al final de migrar().
// Cada fila lleva `cambio`, un número que solo crece: lo que pasa del último subido está pendiente.

import * as SQLite from 'expo-sqlite';

import type { Periodo } from '@/dominio/constelaciones';
import type { Peso } from '@/dominio/control';
import type { Dia, Marca, Origen } from '@/dominio/dias';
import type { ClaveDia, DiaSemana } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { IdDeLogro, Logro } from '@/dominio/logros';
import type { MetaGuardada, Perfil } from '@/dominio/metas';
import {
  AJUSTES_QUE_SUBEN, COLECCIONES, DE_COMIDA, NOMBRE, nombreDeAjuste, type Coleccion, type DeComida, type Guardado, type ListasDeComida, type Pendientes, type Repositorio,
} from './repositorio';

const TABLAS = ['habitos', 'periodos', 'marcas', 'dias', 'logros', 'perfil', 'metas', 'pesos', 'ajustes', ...COLECCIONES, 'anclas'];

async function migrar(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL');
  const version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  // Cada bloque va entero o no va: con su número de versión, en una transacción. Si la app se cierra
  // a la mitad, la próxima vez se vuelve a correr sin encontrar nada hecho a medias.
  const bloque = async (n: number, sql: string) => {
    if (version >= n) return;
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${n}`);
    });
  };
  await bloque(1, `
    CREATE TABLE IF NOT EXISTS habitos (id TEXT PRIMARY KEY NOT NULL, datos TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS periodos (dia INTEGER NOT NULL, constelacion TEXT NOT NULL, cantidad INTEGER NOT NULL, desde TEXT NOT NULL, hasta TEXT, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS marcas (habito TEXT NOT NULL, dia TEXT NOT NULL, hecho INTEGER NOT NULL, momento TEXT NOT NULL, origen TEXT NOT NULL, cambio INTEGER NOT NULL, PRIMARY KEY (habito, dia));
    CREATE TABLE IF NOT EXISTS dias (clave TEXT PRIMARY KEY NOT NULL, datos TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS logros (id TEXT PRIMARY KEY NOT NULL, desde TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS perfil (id INTEGER PRIMARY KEY CHECK (id = 1), datos TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS metas (desde TEXT PRIMARY KEY NOT NULL, datos TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS pesos (fecha TEXT PRIMARY KEY NOT NULL, kg REAL NOT NULL, origen TEXT NOT NULL, momento TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ajustes (clave TEXT PRIMARY KEY NOT NULL, valor TEXT NOT NULL, cambio INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS marcas_por_dia ON marcas (dia);
  `);
  // Lo que se come: cada cosa entera, en JSON, con su clave y, en los registros y el agua, su día.
  await bloque(2, `
    ${['registros', 'recetas', 'propios', 'favoritos', 'agua'].map((c) => `CREATE TABLE IF NOT EXISTS ${c} (clave TEXT PRIMARY KEY NOT NULL, dia TEXT, datos TEXT NOT NULL, cambio INTEGER NOT NULL);`).join('\n    ')}
    CREATE INDEX IF NOT EXISTS registros_por_dia ON registros (dia);
    CREATE INDEX IF NOT EXISTS agua_por_dia ON agua (dia);
  `);
  // Las medidas del cuerpo, como lo que se come: una por día.
  await bloque(3, 'CREATE TABLE IF NOT EXISTS medidas (clave TEXT PRIMARY KEY NOT NULL, dia TEXT, datos TEXT NOT NULL, cambio INTEGER NOT NULL);');
  // Las noches propias (la cara de la mañana y la hora sin reloj), igual: una por noche.
  await bloque(4, 'CREATE TABLE IF NOT EXISTS noches (clave TEXT PRIMARY KEY NOT NULL, dia TEXT, datos TEXT NOT NULL, cambio INTEGER NOT NULL);');
  // Lo que avisan los Atajos y el despertador (src/salud/anclas.ts): queda en el teléfono, no sube.
  // `cambio` es siempre 0: está solo para que borrarTodo() también las borre.
  await bloque(5, 'CREATE TABLE IF NOT EXISTS anclas (id TEXT PRIMARY KEY NOT NULL, que TEXT NOT NULL, en INTEGER NOT NULL, cambio INTEGER NOT NULL DEFAULT 0);');
}

type FilaPeriodo = { dia: number; constelacion: string; cantidad: number; desde: string; hasta: string | null };
type FilaMarca = { habito: string; dia: string; hecho: number; momento: string; origen: string };
type FilaPeso = { fecha: string; kg: number; origen: string; momento: string };

const periodo = (f: FilaPeriodo): Periodo => ({ dia: f.dia as DiaSemana, constelacion: f.constelacion, cantidad: f.cantidad, desde: f.desde, ...(f.hasta ? { hasta: f.hasta } : {}) });
const marca = (f: FilaMarca): Marca => ({ habito: f.habito, dia: f.dia, hecho: f.hecho === 1, momento: f.momento, origen: f.origen as Origen });
const peso = (f: FilaPeso): Peso => ({ fecha: f.fecha, kg: f.kg, origen: f.origen as Peso['origen'], momento: f.momento });

export async function repositorioSQLite(nombre = 'moss.db'): Promise<Repositorio> {
  const db = await SQLite.openDatabaseAsync(nombre);
  await migrar(db);
  const subido = async () => Number((await db.getFirstAsync<{ valor: string }>("SELECT valor FROM ajustes WHERE clave = 'subido'"))?.valor ?? 0);
  const maximo = await db.getFirstAsync<{ n: number | null }>(`SELECT MAX(n) AS n FROM (${TABLAS.map((t) => `SELECT MAX(cambio) AS n FROM ${t}`).join(' UNION ALL ')})`);
  // Nunca por debajo de lo ya subido: lo que baja de la cuenta pisa filas con el número 0, y un
  // número nuevo que no pase el subido nunca quedaría pendiente.
  let secuencia = Math.max(maximo?.n ?? 0, await subido());
  const siguiente = () => ++secuencia;

  /** Lo de una colección de la comida: lo de `desde` en adelante, o lo que cambió después de `cambio`. */
  async function leer<C extends Coleccion>(coleccion: C, filtro: { desde?: ClaveDia; cambio?: number } = {}): Promise<DeComida[C][]> {
    const donde = filtro.cambio !== undefined ? ' WHERE cambio > ?' : filtro.desde && DE_COMIDA[coleccion].dia ? ' WHERE dia >= ?' : '';
    const parametros = filtro.cambio !== undefined ? [filtro.cambio] : donde ? [filtro.desde!] : [];
    return (await db.getAllAsync<{ datos: string }>(`SELECT datos FROM ${coleccion}${donde}`, ...parametros)).map((f) => JSON.parse(f.datos) as DeComida[C]);
  }
  async function leerTodas(filtro: { desde?: ClaveDia; cambio?: number }): Promise<ListasDeComida> {
    const [registros, recetas, propios, favoritos, agua, medidas, noches] = await Promise.all([
      leer('registros', filtro), leer('recetas', filtro), leer('propios', filtro), leer('favoritos', filtro), leer('agua', filtro), leer('medidas', filtro),
      leer('noches', filtro),
    ]);
    return { registros, recetas, propios, favoritos, agua, medidas, noches };
  }
  /** Con el número de cambio que se le pase: 0 es lo que bajó de la cuenta. */
  async function poner<C extends Coleccion>(coleccion: C, lista: DeComida[C][], cambio: () => number) {
    const clave = DE_COMIDA[coleccion].clave as (x: DeComida[C]) => string;
    const dia = DE_COMIDA[coleccion].dia as ((x: DeComida[C]) => ClaveDia) | undefined;
    for (const x of lista) {
      await db.runAsync(`INSERT OR REPLACE INTO ${coleccion} (clave, dia, datos, cambio) VALUES (?, ?, ?, ?)`, clave(x), dia ? dia(x) : null, JSON.stringify(x), cambio());
    }
  }

  return {
    async cargar(desde: ClaveDia, comidaDesde: ClaveDia): Promise<Guardado> {
      const [habitos, periodos, marcas, dias, logros, perfil, metas, pesos, ajustes] = await Promise.all([
        db.getAllAsync<{ datos: string }>('SELECT datos FROM habitos'),
        db.getAllAsync<FilaPeriodo>('SELECT * FROM periodos'),
        db.getAllAsync<FilaMarca>('SELECT * FROM marcas WHERE dia >= ?', desde),
        db.getAllAsync<{ datos: string }>('SELECT datos FROM dias'),
        db.getAllAsync<{ id: string; desde: string }>('SELECT id, desde FROM logros'),
        db.getFirstAsync<{ datos: string }>('SELECT datos FROM perfil WHERE id = 1'),
        db.getAllAsync<{ datos: string }>('SELECT datos FROM metas ORDER BY desde'),
        db.getAllAsync<FilaPeso>('SELECT * FROM pesos ORDER BY fecha'),
        db.getAllAsync<{ clave: string; valor: string }>('SELECT clave, valor FROM ajustes'),
      ]);
      return {
        habitos: habitos.map((f) => JSON.parse(f.datos) as Habito),
        periodos: periodos.map(periodo),
        marcas: marcas.map(marca),
        dias: dias.map((f) => JSON.parse(f.datos) as Dia),
        logros: logros.map((f): Logro => ({ id: f.id as IdDeLogro, desde: f.desde })),
        perfil: perfil ? (JSON.parse(perfil.datos) as Perfil) : null,
        metas: metas.map((f) => JSON.parse(f.datos) as MetaGuardada),
        pesos: pesos.map(peso),
        ...(await leerTodas({ desde: comidaDesde })),
        ajustes: Object.fromEntries(ajustes.map((f) => [f.clave, f.valor])),
      };
    },
    async guardarHabitos(habitos) {
      await db.withTransactionAsync(async () => {
        for (const h of habitos) {
          // Solo queda pendiente el que cambió.
          await db.runAsync(
            'INSERT INTO habitos (id, datos, cambio) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET datos = excluded.datos, cambio = excluded.cambio WHERE habitos.datos <> excluded.datos',
            h.id, JSON.stringify(h), siguiente(),
          );
        }
      });
    },
    async guardarPeriodos(periodos) {
      const cambio = siguiente();
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM periodos');
        for (const p of periodos) {
          await db.runAsync('INSERT INTO periodos (dia, constelacion, cantidad, desde, hasta, cambio) VALUES (?, ?, ?, ?, ?, ?)', p.dia, p.constelacion, p.cantidad, p.desde, p.hasta ?? null, cambio);
        }
      });
    },
    async guardarMarca(m) {
      await db.runAsync('INSERT OR REPLACE INTO marcas (habito, dia, hecho, momento, origen, cambio) VALUES (?, ?, ?, ?, ?, ?)', m.habito, m.dia, m.hecho ? 1 : 0, m.momento, m.origen, siguiente());
    },
    async guardarDia(d) {
      await db.runAsync('INSERT OR REPLACE INTO dias (clave, datos, cambio) VALUES (?, ?, ?)', d.clave, JSON.stringify(d), siguiente());
    },
    async guardarLogros(logros) {
      await db.withTransactionAsync(async () => {
        for (const l of logros) await db.runAsync('INSERT OR IGNORE INTO logros (id, desde, cambio) VALUES (?, ?, ?)', l.id, l.desde, siguiente());
      });
    },
    async guardarPerfil(p) {
      await db.runAsync('INSERT OR REPLACE INTO perfil (id, datos, cambio) VALUES (1, ?, ?)', JSON.stringify(p), siguiente());
    },
    async guardarMeta(m) {
      await db.runAsync('INSERT OR REPLACE INTO metas (desde, datos, cambio) VALUES (?, ?, ?)', m.desde, JSON.stringify(m), siguiente());
    },
    async guardarPeso(p) {
      await db.runAsync('INSERT OR REPLACE INTO pesos (fecha, kg, origen, momento, cambio) VALUES (?, ?, ?, ?, ?)', p.fecha, p.kg, p.origen, p.momento, siguiente());
    },
    async guardarComida(coleccion, lista) {
      await db.withTransactionAsync(() => poner(coleccion, lista, siguiente));
    },
    async guardarAjuste(clave, valor) {
      await db.runAsync('INSERT OR REPLACE INTO ajustes (clave, valor, cambio) VALUES (?, ?, ?)', clave, valor, (AJUSTES_QUE_SUBEN as readonly string[]).includes(clave) ? siguiente() : 0);
    },
    async leerAjuste(clave) {
      return (await db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ?', clave))?.valor ?? null;
    },
    async guardarDeLaNube(c) {
      // Con el número de cambio 0: nada de esto queda pendiente.
      await db.withTransactionAsync(async () => {
        for (const h of c.habitos) await db.runAsync('INSERT OR REPLACE INTO habitos (id, datos, cambio) VALUES (?, ?, 0)', h.id, JSON.stringify(h));
        if (c.periodos) {
          await db.runAsync('DELETE FROM periodos');
          for (const p of c.periodos) {
            await db.runAsync('INSERT INTO periodos (dia, constelacion, cantidad, desde, hasta, cambio) VALUES (?, ?, ?, ?, ?, 0)', p.dia, p.constelacion, p.cantidad, p.desde, p.hasta ?? null);
          }
        }
        for (const m of c.marcas) {
          await db.runAsync('INSERT OR REPLACE INTO marcas (habito, dia, hecho, momento, origen, cambio) VALUES (?, ?, ?, ?, ?, 0)', m.habito, m.dia, m.hecho ? 1 : 0, m.momento, m.origen);
        }
        for (const d of c.dias) await db.runAsync('INSERT OR REPLACE INTO dias (clave, datos, cambio) VALUES (?, ?, 0)', d.clave, JSON.stringify(d));
        for (const l of c.logros) await db.runAsync('INSERT OR REPLACE INTO logros (id, desde, cambio) VALUES (?, ?, 0)', l.id, l.desde);
        if (c.perfil) await db.runAsync('INSERT OR REPLACE INTO perfil (id, datos, cambio) VALUES (1, ?, 0)', JSON.stringify(c.perfil));
        for (const m of c.metas) await db.runAsync('INSERT OR REPLACE INTO metas (desde, datos, cambio) VALUES (?, ?, 0)', m.desde, JSON.stringify(m));
        for (const p of c.pesos) {
          await db.runAsync('INSERT OR REPLACE INTO pesos (fecha, kg, origen, momento, cambio) VALUES (?, ?, ?, ?, 0)', p.fecha, p.kg, p.origen, p.momento);
        }
        if (c.semilla) await db.runAsync("INSERT OR REPLACE INTO ajustes (clave, valor, cambio) VALUES ('semilla', ?, 0)", c.semilla);
        if (c.nombre) await db.runAsync('INSERT OR REPLACE INTO ajustes (clave, valor, cambio) VALUES (?, ?, 0)', NOMBRE, JSON.stringify(c.nombre));
        for (const coleccion of COLECCIONES) await poner(coleccion, c[coleccion] as DeComida[typeof coleccion][], () => 0);
      });
    },
    async pendientes(): Promise<Pendientes> {
      const desde = await subido();
      const hasta = secuencia;
      const [habitos, periodosPendientes, marcas, dias, logros, perfil, metas, pesos, semilla, nombre] = await Promise.all([
        db.getAllAsync<{ datos: string }>('SELECT datos FROM habitos WHERE cambio > ?', desde),
        db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM periodos WHERE cambio > ?', desde),
        db.getAllAsync<FilaMarca>('SELECT * FROM marcas WHERE cambio > ?', desde),
        db.getAllAsync<{ datos: string }>('SELECT datos FROM dias WHERE cambio > ?', desde),
        db.getAllAsync<{ id: string; desde: string }>('SELECT id, desde FROM logros WHERE cambio > ?', desde),
        db.getFirstAsync<{ datos: string }>('SELECT datos FROM perfil WHERE cambio > ?', desde),
        db.getAllAsync<{ datos: string }>('SELECT datos FROM metas WHERE cambio > ?', desde),
        db.getAllAsync<FilaPeso>('SELECT * FROM pesos WHERE cambio > ?', desde),
        db.getFirstAsync<{ valor: string }>("SELECT valor FROM ajustes WHERE clave = 'semilla' AND cambio > ?", desde),
        db.getFirstAsync<{ valor: string }>('SELECT valor FROM ajustes WHERE clave = ? AND cambio > ?', NOMBRE, desde),
      ]);
      // Si cambió algún período, se suben todos: en Supabase se reemplazan juntos.
      const periodos = periodosPendientes?.n ? (await db.getAllAsync<FilaPeriodo>('SELECT * FROM periodos')).map(periodo) : null;
      const comida = await leerTodas({ cambio: desde });
      return {
        hasta,
        habitos: habitos.map((f) => JSON.parse(f.datos) as Habito),
        periodos,
        marcas: marcas.map(marca),
        dias: dias.map((f) => JSON.parse(f.datos) as Dia),
        logros: logros.map((f): Logro => ({ id: f.id as IdDeLogro, desde: f.desde })),
        perfil: perfil ? (JSON.parse(perfil.datos) as Perfil) : null,
        metas: metas.map((f) => JSON.parse(f.datos) as MetaGuardada),
        pesos: pesos.map(peso),
        semilla: semilla?.valor ?? null,
        nombre: nombreDeAjuste(nombre?.valor),
        ...comida,
      };
    },
    async subidoHasta(cambio) {
      const actual = await subido();
      if (cambio > actual) await db.runAsync("INSERT OR REPLACE INTO ajustes (clave, valor, cambio) VALUES ('subido', ?, 0)", String(cambio));
    },
    async borrarTodo() {
      await db.withTransactionAsync(async () => {
        for (const tabla of TABLAS) await db.runAsync(`DELETE FROM ${tabla}`);
      });
    },
  };
}
