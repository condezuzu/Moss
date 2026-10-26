// Tu foto de Perfil: queda solo en este teléfono, en la carpeta de documentos de Moss (como las fotos
// de las comidas, src/secciones/comida/fotos.ts), y no sube a la cuenta. Se saca con la cámara o se
// elige con el selector del sistema, que no pide permiso para ver tus fotos; el selector la recorta
// cuadrada y acá se achica a 512 px. Se borra con «Borrar mis datos», al borrar la cuenta y al cerrar
// sesión (cuenta.ts). En la web de prueba no hay fotos: foto.web.ts.

import { FilterMode, ImageFormat, MipmapMode, Skia, type SkData } from '@shopify/react-native-skia';
import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export const hayFotoDePerfil = true;

/** El lado de lo que se guarda: alcanza para el círculo más grande (96 pt a 3×) con margen. */
const LADO = 512;

const carpeta = () => new Directory(Paths.document, 'perfil');
const archivo = () => new File(carpeta(), 'foto.jpg');

/** Tu foto, si hay. Con la hora del archivo: si la foto cambió, la imagen guardada en memoria no se usa. */
export function fotoDePerfil(): string | null {
  try {
    const f = archivo();
    return f.exists ? `${f.uri}?${f.modificationTime ?? 0}` : null;
  } catch {
    return null;
  }
}

/** El cuadrado del medio, achicado y en JPEG, en la carpeta temporal. Si no se puede, la del selector, que ya viene recortada. */
function achicar(uri: string, datos: SkData): string {
  const imagen = Skia.Image.MakeImageFromEncoded(datos);
  if (!imagen) return uri;
  const lado = Math.min(imagen.width(), imagen.height());
  const destino = Math.min(LADO, lado);
  const superficie = Skia.Surface.Make(destino, destino);
  if (!superficie) return uri;
  // Con mipmaps: al achicar mucho de una vez, sin ellos quedaría granulada.
  superficie.getCanvas().drawImageRectOptions(
    imagen, Skia.XYWHRect((imagen.width() - lado) / 2, (imagen.height() - lado) / 2, lado, lado), Skia.XYWHRect(0, 0, destino, destino), FilterMode.Linear, MipmapMode.Linear,
  );
  superficie.flush();
  const f = new File(Paths.cache, `perfil-${Date.now()}.jpg`);
  f.create({ overwrite: true });
  f.writeSync(superficie.makeImageSnapshot().encodeToBytes(ImageFormat.JPEG, 85));
  return f.uri;
}

/**
 * Saca una foto (con la cámara de adelante) o la elige con el selector del sistema. Devuelve dónde
 * quedó, todavía sin guardar como tu foto (eso es al tocar «Guardar»), o null si no se eligió.
 */
export async function elegirFotoDePerfil(desde: 'camara' | 'carrete'): Promise<string | null> {
  const opciones: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.9 };
  let r: ImagePicker.ImagePickerResult;
  if (desde === 'camara') {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return null;
    r = await ImagePicker.launchCameraAsync({ ...opciones, cameraType: ImagePicker.CameraType.front });
  } else {
    r = await ImagePicker.launchImageLibraryAsync(opciones);
  }
  const elegida = r.canceled ? null : r.assets[0];
  if (!elegida) return null;
  try {
    return achicar(elegida.uri, await Skia.Data.fromURI(elegida.uri));
  } catch {
    return elegida.uri;
  }
}

/** La elegida pasa a ser tu foto (reemplaza la que había). Devuelve cómo mostrarla. */
export async function guardarFotoDePerfil(uri: string): Promise<string | null> {
  const d = carpeta();
  if (!d.exists) d.create({ intermediates: true });
  const destino = archivo();
  if (destino.exists) destino.delete();
  await new File(uri).copy(destino);
  // Con otra foto en el mismo archivo, la imagen guardada en memoria no se usa.
  return destino.exists ? `${destino.uri}?${Date.now()}` : null;
}

/** Sin foto: vuelve la inicial. También al borrar los datos o la cuenta y al cerrar sesión. */
export function borrarFotoDePerfil(): void {
  try {
    const d = carpeta();
    if (d.exists) d.delete();
  } catch (error) {
    console.warn('Moss no pudo borrar tu foto', error);
  }
}
