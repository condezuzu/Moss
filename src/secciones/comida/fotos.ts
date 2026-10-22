// La foto de una comida (spec/nutricion.md; D10): opcional, no se analiza, y queda solo en el
// teléfono, en la carpeta de documentos de Moss, que entra en la copia de iCloud del iPhone. No se
// sube a la cuenta. Una por comida de cada día; sacar otra la reemplaza.

import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { Comida } from '@/dominio/comidas';
import type { ClaveDia } from '@/dominio/fechas';

/** En la web de prueba no hay cámara ni carpeta de la app. */
export const hayFotos = Platform.OS !== 'web';

const carpeta = () => new Directory(Paths.document, 'fotos');
const archivo = (dia: ClaveDia, comida: Comida) => new File(carpeta(), `${dia}-${comida}.jpg`);

/** La foto de esa comida, si hay. */
export function fotoDe(dia: ClaveDia, comida: Comida): string | null {
  if (!hayFotos) return null;
  try {
    const f = archivo(dia, comida);
    return f.exists ? f.uri : null;
  } catch {
    return null;
  }
}

/** Saca la foto con la cámara y la guarda; devuelve dónde quedó, o null si no se sacó. */
export async function sacarFoto(dia: ClaveDia, comida: Comida): Promise<string | null> {
  if (!hayFotos) return null;
  const permiso = await ImagePicker.requestCameraPermissionsAsync();
  if (!permiso.granted) return null;
  const r = await ImagePicker.launchCameraAsync({ quality: 0.6, mediaTypes: ['images'] });
  const tomada = r.canceled ? null : r.assets[0];
  if (!tomada) return null;
  const d = carpeta();
  if (!d.exists) d.create({ intermediates: true });
  const destino = archivo(dia, comida);
  if (destino.exists) destino.delete();
  await new File(tomada.uri).copy(destino);
  // Con otra foto en el mismo archivo, la imagen guardada en memoria no se usa.
  return `${destino.uri}?${Date.now()}`;
}

export function borrarFoto(dia: ClaveDia, comida: Comida): void {
  try {
    const f = archivo(dia, comida);
    if (f.exists) f.delete();
  } catch {
    // Si no estaba, no hay nada que borrar.
  }
}
