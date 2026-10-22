// El planeta de Ascent con su órbita abierta, como en su ícono, y la luna de Moss afuera de la
// órbita: todavía sin vincular. Al vincular, la luna entra (galería, sección 7).

import { Canvas, Circle, DashPathEffect, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

export function MarcaDeAscent() {
  const orbita = useMemo(() => Skia.Path.MakeFromSVGString('M -25.24 -36.04 A 44 44 0 1 1 -36.04 25.24'), []);
  return (
    <Canvas style={estilos.marca}>
      <Group transform={[{ translateX: 62 }, { translateY: 62 }]}>
        <Circle cx={0} cy={0} r={25}>
          <RadialGradient c={vec(-8, -10)} r={42} colors={['#6b7386', '#2b313e', '#0c0f15']} />
        </Circle>
        <Circle cx={0} cy={0} r={25} style="stroke" strokeWidth={0.8} color="rgba(232, 236, 246, 0.14)" />
        {orbita && (
          <Path path={orbita} style="stroke" strokeWidth={1.3} strokeCap="round" color="rgba(138, 147, 168, 0.6)">
            <DashPathEffect intervals={[0.4, 5]} />
          </Path>
        )}
        <Circle cx={51} cy={-36} r={5.2} opacity={0.6}>
          <RadialGradient c={vec(49, -38)} r={7} colors={['#fbf6ea', '#bdb39c']} />
        </Circle>
      </Group>
    </Canvas>
  );
}

const estilos = StyleSheet.create({
  marca: { alignSelf: 'center', width: 124, height: 124, marginTop: 2 },
});
