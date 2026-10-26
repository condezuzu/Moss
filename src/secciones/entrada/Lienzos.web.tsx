// En la web, Skia es CanvasKit: lo de la entrada llega con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeAnillos, PropsDeCasiopea, PropsDeEstela } from './LienzosSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

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

export function Casiopea(props: PropsDeCasiopea) {
  return (
    <WithSkiaWeb<PropsDeCasiopea>
      opts={opciones}
      getComponent={async () => ({ default: (await import('./LienzosSkia')).CasiopeaSkia })}
      fallback={<View />}
      componentProps={props}
    />
  );
}

export function Estela(props: PropsDeEstela) {
  return (
    <WithSkiaWeb<PropsDeEstela>
      opts={opciones}
      getComponent={async () => ({ default: (await import('./LienzosSkia')).EstelaSkia })}
      fallback={<View />}
      componentProps={props}
    />
  );
}

export function Halo() {
  return <WithSkiaWeb opts={opciones} getComponent={async () => ({ default: (await import('./LienzosSkia')).HaloSkia })} fallback={<View style={{ width: 84, height: 84 }} />} />;
}

export function Cuerpo() {
  return <WithSkiaWeb opts={opciones} getComponent={async () => ({ default: (await import('./LienzosSkia')).CuerpoSkia })} fallback={<View style={{ width: 54, height: 54 }} />} />;
}
