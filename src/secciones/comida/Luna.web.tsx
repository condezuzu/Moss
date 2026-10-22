// En la web, Skia es CanvasKit: hay que cargarlo antes de importar lo que lo usa, por eso las
// lunas llegan con un import dinámico (como el cielo, src/cielo/PantallaDelCielo.web.tsx).

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import { View } from 'react-native';

import type { PropsDeLuna, PropsDeLunitas } from './LunaSkia';

export type { EstadoDeLunita, Lunita } from './LunaSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

export function Luna(props: PropsDeLuna) {
  return <WithSkiaWeb<PropsDeLuna> opts={opciones} getComponent={() => import('./LunaSkia')} fallback={<View style={{ width: props.tam, height: props.tam }} />} componentProps={props} />;
}

export function Lunitas(props: PropsDeLunitas) {
  return (
    <WithSkiaWeb<PropsDeLunitas>
      opts={opciones}
      getComponent={async () => ({ default: (await import('./LunaSkia')).LunitasSkia })}
      fallback={<View style={{ width: props.ancho, height: props.tam }} />}
      componentProps={props}
    />
  );
}
