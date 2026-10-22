// El catálogo del servidor en el teléfono: lo que bajó de moss.catalogo queda guardado y se mezcla
// con la base al buscar (src/comida/catalogo.ts). Se baja con sesión, al abrir la app y al volver
// del fondo, como mucho una vez por hora: cambia poco.

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { supabase } from '@/lib/supabase';
import { mezclarCatalogo, type CatalogoLocal, type FilaDelCatalogo } from './catalogo';

const CLAVE = 'moss:catalogo';
const UNA_HORA = 3_600_000;
const PAGINA = 1000;

let guardado: CatalogoLocal = { hasta: null, filas: [] };
let leido: Promise<void> | undefined;
let ultimaVez = 0;

/** Las filas que se tienen del catálogo (vacío hasta la primera bajada). */
export async function filasDelCatalogo(): Promise<FilaDelCatalogo[]> {
  leido ??= AsyncStorage.getItem(CLAVE)
    .then((texto) => {
      if (texto) guardado = JSON.parse(texto) as CatalogoLocal;
    })
    .catch(() => {});
  await leido;
  return guardado.filas;
}

/** Baja lo que cambió del catálogo desde la última vez. */
export async function actualizarCatalogo(cliente: ReturnType<typeof supabase>): Promise<void> {
  if (Date.now() - ultimaVez < UNA_HORA) return;
  ultimaVez = Date.now();
  await filasDelCatalogo();
  // Con un margen: una fila guardada con una hora apenas anterior a la última bajada igual llega.
  const desde = guardado.hasta ? new Date(Date.parse(guardado.hasta) - UNA_HORA).toISOString() : null;
  const llegadas: FilaDelCatalogo[] = [];
  for (let inicio = 0; ; inicio += PAGINA) {
    let consulta = cliente.from('catalogo').select('*').order('actualizado').order('id').range(inicio, inicio + PAGINA - 1);
    if (desde) consulta = consulta.gt('actualizado', desde);
    const { data, error } = await consulta;
    if (error) throw error;
    const filas = (data ?? []) as FilaDelCatalogo[];
    llegadas.push(...filas);
    if (filas.length < PAGINA) break;
  }
  if (!llegadas.length) return;
  guardado = { hasta: llegadas[llegadas.length - 1].actualizado, filas: mezclarCatalogo(guardado.filas, llegadas) };
  await AsyncStorage.setItem(CLAVE, JSON.stringify(guardado));
}
