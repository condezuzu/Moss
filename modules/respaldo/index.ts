// El módulo propio que saca la carpeta de SQLite de la copia de seguridad del iPhone
// (ios/RespaldoModule.swift). Va en la build de la app; en Expo Go y en la web no está, y no hace falta.

import { requireOptionalNativeModule } from 'expo';

type Modulo = { excluir(ruta: string): boolean };

const modulo = requireOptionalNativeModule<Modulo>('Respaldo');

/** Saca una carpeta (y lo de adentro) de la copia de seguridad. Acepta una ruta o una dirección file://. */
export function excluirDelRespaldo(ruta: string | null | undefined): boolean {
  if (!modulo || !ruta) return false;
  try {
    return modulo.excluir(decodeURI(ruta.replace(/^file:\/\//, '')));
  } catch {
    return false;
  }
}
