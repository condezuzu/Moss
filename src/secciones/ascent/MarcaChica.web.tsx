// En la web, Skia es CanvasKit: la marca llega con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeMarcaChica } from './MarcaChicaSkia';

export function MarcaChica(props: PropsDeMarcaChica) {
  const tam = props.tam ?? 24;
  return (
    <WithSkiaWeb<PropsDeMarcaChica>
      opts={{ locateFile: (archivo: string) => `/${archivo}` }}
      getComponent={() => import('./MarcaChicaSkia')}
      fallback={<View style={{ width: tam, height: tam }} />}
      componentProps={props}
    />
  );
}
