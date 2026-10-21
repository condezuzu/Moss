import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';

import aurora from './shaders/aurora.glsl';
import comun from './shaders/comun.glsl';
import fondo from './shaders/fondo.glsl';
import vivo from './shaders/vivo.glsl';
import { fuenteCielo, fuenteFondo, fuenteHoja, fuenteMusgo } from './sksl';

type Efectos = { fondo: SkRuntimeEffect; cielo: SkRuntimeEffect; musgo: SkRuntimeEffect; hoja: SkRuntimeEffect };

let compilados: Efectos | null = null;

function compilar(nombre: string, fuente: string): SkRuntimeEffect {
  const efecto = Skia.RuntimeEffect.Make(fuente);
  // npm run shaders:verificar compila lo mismo con CanvasKit y muestra el error exacto.
  if (!efecto) throw new Error(`No compiló el shader "${nombre}". Corré npm run shaders:verificar.`);
  return efecto;
}

/** Se compilan la primera vez que se piden: en la web, Skia recién existe después de cargar CanvasKit. */
export function efectos(): Efectos {
  compilados ??= {
    fondo: compilar('fondo', fuenteFondo({ comun, fondo })),
    cielo: compilar('cielo', fuenteCielo({ comun, aurora, vivo })),
    musgo: compilar('musgo', fuenteMusgo({ comun })),
    hoja: compilar('hoja', fuenteHoja()),
  };
  return compilados;
}
