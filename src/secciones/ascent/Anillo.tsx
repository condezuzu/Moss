// El anillo de la recuperación (galería: .as-anillo): la pista y lo que llega de 100. Sin vincular,
// la pista punteada y vacía.

import { Canvas, Circle, DashPathEffect, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { C } from './colores';

export function Anillo({ valor, tam = 92 }: { valor: number | null; tam?: number }) {
  const r = (42 / 100) * tam;
  const arco = useMemo(() => {
    if (valor === null) return null;
    const p = Skia.PathBuilder.Make();
    p.addArc(Skia.XYWHRect(tam / 2 - r, tam / 2 - r, 2 * r, 2 * r), -90, (360 * Math.min(100, Math.max(0, valor))) / 100);
    return p.detach();
  }, [valor, tam, r]);
  return (
    <Canvas style={{ position: 'absolute', width: tam, height: tam }}>
      {valor === null ? (
        <Circle cx={tam / 2} cy={tam / 2} r={r} style="stroke" strokeWidth={2.2} strokeCap="round" color={C.apagado}>
          <DashPathEffect intervals={[0.5, 5.5]} />
        </Circle>
      ) : (
        <Circle cx={tam / 2} cy={tam / 2} r={r} style="stroke" strokeWidth={3} color={C.lineaFuerte} />
      )}
      {arco && <Path path={arco} style="stroke" strokeWidth={3} strokeCap="round" color={C.claro} />}
    </Canvas>
  );
}
