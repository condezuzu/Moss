// En la web, Skia es CanvasKit: los dibujos llegan con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import { ARCO } from './arco';
import type { PropsDeLaCurva, PropsDeLasChispas, PropsDelAnillo, PropsDelArco } from './DibujosSkia';

export type { Chispa, ParteDelAnillo } from './DibujosSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

function conSkia<P extends object>(cargar: () => Promise<ComponentType<P>>, medida: (p: P) => { width: number; height: number }) {
  return function ConSkia(props: P) {
    return (
      <WithSkiaWeb<P>
        opts={opciones}
        getComponent={async () => ({ default: await cargar() })}
        fallback={<View style={medida(props)} />}
        componentProps={props}
      />
    );
  };
}

export const Arco = conSkia<PropsDelArco>(async () => (await import('./DibujosSkia')).ArcoSkia, (p) => ({ width: p.ancho, height: (ARCO.alto * p.ancho) / ARCO.ancho }));
export const Anillo = conSkia<PropsDelAnillo>(async () => (await import('./DibujosSkia')).AnilloSkia, (p) => ({ width: p.tam, height: p.tam }));
export const Curva = conSkia<PropsDeLaCurva>(async () => (await import('./DibujosSkia')).CurvaSkia, (p) => ({ width: p.ancho, height: p.alto }));
export const Chispas = conSkia<PropsDeLasChispas>(async () => (await import('./DibujosSkia')).ChispasSkia, (p) => ({ width: p.ancho, height: p.altoDeFila * p.filas.length }));
