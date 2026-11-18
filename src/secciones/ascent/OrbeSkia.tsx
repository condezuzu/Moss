// El logo de Ascent como en su ícono (galeria/src/ascent.js, el orbe sin vincular): el planeta, la órbita
// abierta a la izquierda y el punto arriba a la derecha. Quieto: es la entrada de Progreso mientras Ascent
// dice «Pronto».

import { Canvas, Circle, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

export type PropsDelOrbe = { tam?: number };

export default function OrbeSkia({ tam = 48 }: PropsDelOrbe) {
  const orbita = useMemo(() => Skia.Path.MakeFromSVGString('M -7.36 -17.52 A 19 19 0 1 1 -16.45 9.5'), []);
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 48 }]}>
        {orbita && <Path path={orbita} style="stroke" strokeWidth={1.7} strokeCap="round" color="#9ea4ae" opacity={0.9} />}
        <Circle cx={0} cy={0} r={12.5}>
          <RadialGradient c={vec(3, 4)} r={20} colors={['#0d1016', '#1b1f2a', '#3b4251', '#98a1b5']} positions={[0, 0.58, 0.85, 1]} />
        </Circle>
        <Group transform={[{ translateX: 14.6 }, { translateY: -12.16 }]}>
          <Circle cx={0} cy={0} r={4.4} color="rgba(255, 255, 255, 0.18)" />
          <Circle cx={0} cy={0} r={2.8} opacity={0.9}>
            <RadialGradient c={vec(-0.78, -1)} r={4.48} colors={['#ffffff', '#b9bec8']} />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}
