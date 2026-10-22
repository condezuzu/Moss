// En la web, Skia es CanvasKit: lo de la entrada llega con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeAnillos, PropsDeAro } from './LienzosSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

export function Aro(props: PropsDeAro) {
  return (
    <WithSkiaWeb<PropsDeAro>
      opts={opciones}
      getComponent={async () => ({ default: (await import('./LienzosSkia')).AroSkia })}
      fallback={<View style={{ width: 64, height: 64 }} />}
      componentProps={props}
    />
  );
}

export function Anillos(props: PropsDeAnillos) {
  return (
    <WithSkiaWeb<PropsDeAnillos>
      opts={opciones}
      getComponent={async () => ({ default: (await import('./LienzosSkia')).AnillosSkia })}
      fallback={<View />}
      componentProps={props}
    />
  );
}
