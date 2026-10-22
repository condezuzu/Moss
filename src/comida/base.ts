// La base de alimentos en el teléfono (assets/alimentos.db): se copia a la carpeta de SQLite la
// primera vez y cada vez que la app trae una nueva (VERSION_DE_LA_BASE), y se abre una sola vez.
// La copia anterior se borra. Buscar, el detalle y el código de barras van todos por acá, con el
// catálogo del servidor encima (src/comida/catalogo.ts).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDatabaseAsync, importDatabaseFromAssetAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { buscarAlimentos, type Opciones, type Resultado } from './buscar';
import { codigoDelCatalogo, conElCatalogo, detalleDelCatalogo } from './catalogo';
import { filasDelCatalogo } from './catalogoLocal';
import { alimentoPorCodigo, detalleDeAlimento, type Detalle } from './detalle';
import { VERSION_DE_LA_BASE } from './version-de-la-base';

const COPIA = 'moss:baseDeAlimentos';

let abierta: Promise<SQLiteDatabase> | undefined;

function abrir(): Promise<SQLiteDatabase> {
  abierta ??= (async () => {
    const nombre = `alimentos-${VERSION_DE_LA_BASE}.db`;
    await importDatabaseFromAssetAsync(nombre, { assetId: require('../../assets/alimentos.db') });
    const db = await openDatabaseAsync(nombre);
    const anterior = await AsyncStorage.getItem(COPIA).catch(() => null);
    if (anterior && anterior !== nombre) deleteDatabaseAsync(anterior).catch(() => {});
    AsyncStorage.setItem(COPIA, nombre).catch(() => {});
    return db;
  })();
  // Si falló (por ejemplo, sin lugar), la próxima vez se intenta de nuevo.
  abierta.catch(() => {
    abierta = undefined;
  });
  return abierta;
}

export type OpcionesDeIdioma = Pick<Opciones, 'idioma' | 'region'>;

export const baseDeAlimentos = {
  async buscar(texto: string, op: Opciones): Promise<Resultado[]> {
    const [db, filas] = await Promise.all([abrir(), filasDelCatalogo()]);
    return conElCatalogo(await buscarAlimentos(db, texto, op), filas, texto, op);
  },
  async detalle(id: number, op: OpcionesDeIdioma): Promise<Detalle | null> {
    const delCatalogo = detalleDelCatalogo(await filasDelCatalogo(), id, op);
    return delCatalogo !== undefined ? delCatalogo : detalleDeAlimento(await abrir(), id, op);
  },
  async porCodigo(codigo: string): Promise<number | null> {
    return codigoDelCatalogo(await filasDelCatalogo(), codigo) ?? alimentoPorCodigo(await abrir(), codigo);
  },
  /** Para abrirla antes de que haga falta: la primera copia tarda un poco. */
  preparar() {
    abrir().catch((error) => console.warn('Moss no pudo abrir la base de alimentos', error));
  },
};
