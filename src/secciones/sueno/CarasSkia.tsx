// Las caras de la mañana, las de la galería (galeria/src/sueno.js): un círculo, dos ojos y la boca, de
// muy mal (1) a muy bien (5), de línea. Todas en un solo lienzo: en la web cada lienzo es un contexto
// de WebGL, y el navegador deja pocos.

import { BlurMask, Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';

/** Cuánto se curva la boca de cada cara, en una caja de 24 × 24 con el centro en el medio. */
const BOCA = [-3.4, -1.8, 0, 1.8, 3.4];

export type PropsDeCaras = {
  /** Las caras que se dibujan (de 1 a 5), una al lado de la otra en partes iguales del ancho. */
  caras: readonly number[];
  /** El color de cada una; la elegida brilla. */
  colores: readonly string[];
  elegida?: number | null;
  ancho: number;
  /** El diámetro de cada cara. */
  tam: number;
};

export default function CarasSkia({ caras, colores, elegida, ancho, tam }: PropsDeCaras) {
  const bocas = useMemo(
    () => BOCA.map((curva, i) => {
      const y = i < 2 ? 5.4 : 4.2;
      return Skia.Path.MakeFromSVGString(`M -4.6 ${y} Q 0 ${y + curva} 4.6 ${y}`)!;
    }),
    [],
  );
  const s = tam / 24;
  const paso = ancho / caras.length;
  return (
    <Canvas style={{ width: ancho, height: tam + 4 }} pointerEvents="none">
      {caras.map((cara, i) => {
        const color = colores[i];
        const dibujo = (
          <>
            <Circle cx={0} cy={0} r={10.4} color={color} style="stroke" strokeWidth={1.3} />
            <Circle cx={-3.6} cy={-2.4} r={1.05} color={color} />
            <Circle cx={3.6} cy={-2.4} r={1.05} color={color} />
            <Path path={bocas[cara - 1]} color={color} style="stroke" strokeWidth={1.3} strokeCap="round" />
          </>
        );
        return (
          <Group key={cara} transform={[{ translateX: paso * (i + 0.5) }, { translateY: tam / 2 + 2 }, { scale: s }]}>
            {cara === elegida && (
              <Group opacity={0.55}>
                {dibujo}
                <BlurMask blur={2.2} style="normal" />
              </Group>
            )}
            {dibujo}
          </Group>
        );
      })}
    </Canvas>
  );
}
