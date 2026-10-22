// En la web, Skia es CanvasKit: la figura llega con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeFigura } from './FiguraSkia';

export function Figura(props: PropsDeFigura) {
  return (
    <WithSkiaWeb<PropsDeFigura>
      opts={{ locateFile: (archivo: string) => `/${archivo}` }}
      getComponent={() => import('./FiguraSkia')}
      fallback={<View style={{ width: props.ancho, height: props.ancho * 2 }} />}
      componentProps={props}
    />
  );
}
