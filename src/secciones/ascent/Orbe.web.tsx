// En la web, Skia es CanvasKit: el orbe llega con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDelOrbe } from './OrbeSkia';

export function Orbe(props: PropsDelOrbe) {
  const tam = props.tam ?? 48;
  return (
    <WithSkiaWeb<PropsDelOrbe>
      opts={{ locateFile: (archivo: string) => `/${archivo}` }}
      getComponent={() => import('./OrbeSkia')}
      fallback={<View style={{ width: tam, height: tam }} />}
      componentProps={props}
    />
  );
}
