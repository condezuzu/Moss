// En la web, Skia es CanvasKit: las caras llegan con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeCaras } from './CarasSkia';

export function Caras(props: PropsDeCaras) {
  return (
    <WithSkiaWeb<PropsDeCaras>
      opts={{ locateFile: (archivo: string) => `/${archivo}` }}
      getComponent={() => import('./CarasSkia')}
      fallback={<View style={{ width: props.ancho, height: props.tam + 4 }} />}
      componentProps={props}
    />
  );
}
