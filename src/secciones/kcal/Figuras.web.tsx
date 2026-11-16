// En la web, Skia es CanvasKit: las figuras llegan con un import dinámico, como las lunas de Comida.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import { altoDelArco } from './medidas';
import type { PropsDeAnillo, PropsDeArco, PropsDelCamino, PropsDeLuna, PropsDeMacros } from './FigurasSkia';

export type { FraccionesDeMacros } from './FigurasSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

function conSkia<P extends object>(cargar: () => Promise<ComponentType<P>>, lado: (p: P) => { width: number; height: number }) {
  return function ConSkia(props: P) {
    return <WithSkiaWeb<P> opts={opciones} getComponent={async () => ({ default: await cargar() })} fallback={<View style={lado(props)} />} componentProps={props} />;
  };
}

export const Luna = conSkia<PropsDeLuna>(async () => (await import('./FigurasSkia')).LunaSkia, (p) => ({ width: p.tam, height: p.tam }));
export const Anillo = conSkia<PropsDeAnillo>(async () => (await import('./FigurasSkia')).AnilloSkia, (p) => ({ width: p.tam, height: p.tam }));
export const Arco = conSkia<PropsDeArco>(async () => (await import('./FigurasSkia')).ArcoSkia, (p) => ({ width: p.ancho, height: (altoDelArco(p.grueso) * p.ancho) / 100 }));
export const Macros = conSkia<PropsDeMacros>(async () => (await import('./FigurasSkia')).MacrosSkia, (p) => ({ width: p.tam, height: p.tam }));
export const Camino = conSkia<PropsDelCamino>(async () => (await import('./FigurasSkia')).CaminoSkia, (p) => ({ width: p.ancho, height: p.alto }));
