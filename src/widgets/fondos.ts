// Los fondos de los widgets (assets/widgets, los saca herramientas/fondos-de-widgets.mjs de los shaders de
// la app): un widget no corre shaders ni puede leer lo de la app, así que se copian una vez al App Group.
// Si algo falla, los widgets siguen con su degradé: el fondo vuelve vacío y el widget no lo pide.
// El número en el nombre cambia si cambia la imagen: así se copia la nueva.

import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';

export type Fondos = { noche: string; aurora: string };

const IMAGENES = [
  ['noche', 'cielo-noche-1.jpg', require('../../assets/widgets/cielo-noche.jpg')],
  ['aurora', 'cielo-aurora-1.jpg', require('../../assets/widgets/cielo-aurora.jpg')],
] as const;

let copiados: Promise<Fondos> | undefined;

/** `carpeta` es widgetsDirectory de expo-widgets: una URL file:// que termina en barra. */
export function fondosEnElGrupo(carpeta: string | null | undefined): Promise<Fondos> {
  if (!carpeta) return Promise.resolve({ noche: '', aurora: '' });
  copiados ??= (async () => {
    const fondos: Fondos = { noche: '', aurora: '' };
    for (const [clave, nombre, modulo] of IMAGENES) {
      const destino = new File(`${carpeta}${nombre}`);
      if (!destino.exists) {
        const asset = await Asset.fromModule(modulo).downloadAsync();
        if (!asset.localUri) throw new Error(`Sin el archivo de ${nombre}`);
        await new File(asset.localUri).copy(destino);
      }
      fondos[clave] = destino.uri;
    }
    return fondos;
  })().catch((error) => {
    console.warn('Moss no pudo copiar los fondos de los widgets', error);
    copiados = undefined;
    return { noche: '', aurora: '' };
  });
  return copiados;
}
