// En la web, Skia es CanvasKit: los dibujos llegan con un import dinámico, como el cielo.

import { WithSkiaWeb } from '@shopify/react-native-skia/lib/module/web';
import type { ComponentType } from 'react';
import { View } from 'react-native';

import type { PropsDeChispa, PropsDeMarca, PropsDelCuerpo, PropsDelRango } from './DibujosSkia';

export type { EstadoDibujado } from './DibujosSkia';

const opciones = { locateFile: (archivo: string) => `/${archivo}` };

function conSkia<P extends object>(cargar: () => Promise<ComponentType<P>>, tamano: (p: P) => { width: number; height: number }) {
  return function ConSkia(props: P) {
    return (
      <WithSkiaWeb<P>
        opts={opciones}
        getComponent={async () => ({ default: await cargar() })}
        fallback={<View style={tamano(props)} />}
        componentProps={props}
      />
    );
  };
}

export const Marca = conSkia<PropsDeMarca>(async () => (await import('./DibujosSkia')).MarcaSkia, (p) => ({ width: p.tam, height: p.tam }));
export const Cuerpo = conSkia<PropsDelCuerpo>(async () => (await import('./DibujosSkia')).CuerpoSkia, (p) => ({ width: p.ancho, height: (p.ancho * 188) / 210 + (p.rotulos ? 16 : 0) }));
export const Tendencia = conSkia<PropsDeChispa>(async () => (await import('./DibujosSkia')).TendenciaSkia, (p) => ({ width: p.ancho, height: p.alto }));
const delRango = (p: PropsDelRango) => ({ width: p.geometria.ancho, height: p.geometria.alto });
export const CuerpoDelRango = conSkia<PropsDelRango>(async () => (await import('./DibujosSkia')).CuerpoDelRangoSkia, delRango);
export const TechoDelRango = conSkia<PropsDelRango>(async () => (await import('./DibujosSkia')).TechoDelRangoSkia, delRango);
