// En la web, Skia es CanvasKit: los gráficos llegan con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import type { PropsDeBalance, PropsDeHipnograma, PropsDeLinea, PropsDeMiniCielo } from './GraficosSkia';

export type { PuntoDeLinea } from './GraficosSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

function conSkia<P extends { ancho: number; alto: number }>(cargar: () => Promise<ComponentType<P>>) {
  return function ConSkia(props: P) {
    return (
      <WithSkiaWeb<P>
        opts={opciones}
        getComponent={async () => ({ default: await cargar() })}
        fallback={<View style={{ width: props.ancho, height: props.alto }} />}
        componentProps={props}
      />
    );
  };
}

export const Linea = conSkia<PropsDeLinea>(async () => (await import('./GraficosSkia')).LineaSkia);
export const Balance = conSkia<PropsDeBalance>(async () => (await import('./GraficosSkia')).BalanceSkia);
export const Hipnograma = conSkia<PropsDeHipnograma>(async () => (await import('./GraficosSkia')).HipnogramaSkia);
export const MiniCielo = conSkia<PropsDeMiniCielo>(async () => (await import('./GraficosSkia')).MiniCieloSkia);
