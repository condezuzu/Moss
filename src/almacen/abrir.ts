import { defaultDatabaseDirectory } from 'expo-sqlite';

import { excluirDelRespaldo } from '../../modules/respaldo';
import { repositorioSQLite } from './sqlite';

// Lo de Moss no entra en la copia de seguridad del iPhone (guía 5.1.3(ii): nada de salud en iCloud);
// con la cuenta, ya está en el servidor. La carpeta es la de SQLite, con la base de alimentos adentro.
export async function abrirRepositorio() {
  const repositorio = await repositorioSQLite();
  excluirDelRespaldo(defaultDatabaseDirectory);
  return repositorio;
}
