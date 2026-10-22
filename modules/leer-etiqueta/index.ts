// El módulo propio que lee la foto de una etiqueta con Vision (ios/LeerEtiquetaModule.swift). Va en
// la build de la app, no en Expo Go ni en la web: ahí no está y se ofrece cargar los valores a mano.

import { requireOptionalNativeModule } from 'expo';

type Modulo = { leer(uri: string): Promise<string[]> };

const modulo = requireOptionalNativeModule<Modulo>('LeerEtiqueta');

/** Las filas de texto de la foto, de arriba abajo; sin el módulo, null. */
export const leerFotoDeEtiqueta: ((uri: string) => Promise<string[]>) | null = modulo ? (uri) => modulo.leer(uri) : null;
