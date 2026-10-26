// Lo que avisan los Atajos y el despertador de Moss (spec/sueno-sin-esfuerzo.md): cada aviso con su
// hora, en la tabla `anclas` del teléfono (bloque 5 de migrar(), src/almacen/sqlite.ts), que no sube a
// la cuenta. Lo usan la noche sin reloj (nocheSinReloj.ts) y «Afinar» en Sueño. Se guarda un mes:
// alcanza para ver si el enfoque Sueño sigue un horario. Quien escribe espera a que el almacén haya
// abierto la base (la tabla existe recién después de migrar).

import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { SENALES, type Senal } from '@/dominio/sinReloj';

const UN_MES = 30 * 86_400_000;
let base: Promise<SQLite.SQLiteDatabase> | undefined;
// La misma base del almacén: expo-sqlite reusa la conexión abierta con ese nombre.
const abrir = () => (base ??= SQLite.openDatabaseAsync('moss.db'));
const oyentes = new Set<() => void>();

/** Guarda lo que llegó (lo repetido se ignora: la clave es el id de la invocación) y olvida lo de hace más de un mes. */
export async function guardarSenales(lista: Senal[]): Promise<void> {
  const db = await abrir();
  for (const s of lista) await db.runAsync('INSERT OR IGNORE INTO anclas (id, que, en) VALUES (?, ?, ?)', s.id, s.que, Math.round(s.en));
  await db.runAsync('DELETE FROM anclas WHERE en < ?', Date.now() - UN_MES);
  oyentes.forEach((o) => o());
}

/** Lo que llegó desde `desde` (en milisegundos), de lo más viejo a lo más nuevo. */
export async function leerSenales(desde: number): Promise<Senal[]> {
  const db = await abrir();
  const filas = await db.getAllAsync<{ id: string; que: string; en: number }>('SELECT id, que, en FROM anclas WHERE en >= ? ORDER BY en', desde);
  return filas.filter((f): f is Senal => (SENALES as readonly string[]).includes(f.que));
}

/** Lo que llegó en los últimos días, al día con lo que va llegando. Mientras carga, null. */
export function useSenales(dias = 7): Senal[] | null {
  const [lista, setLista] = useState<Senal[] | null>(null);
  useEffect(() => {
    let vivo = true;
    const cargar = () => {
      leerSenales(Date.now() - dias * 86_400_000).then(
        (l) => vivo && setLista(l),
        () => vivo && setLista([]),
      );
    };
    cargar();
    oyentes.add(cargar);
    return () => {
      vivo = false;
      oyentes.delete(cargar);
    };
  }, [dias]);
  return lista;
}
