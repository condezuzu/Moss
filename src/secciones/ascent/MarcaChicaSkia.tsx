// La marca de Ascent en chico, para la señal de Hábitos y la invitación de Inicio (galeria/src/ascent.js):
// a este tamaño, la órbita y la luna de MarcaDeAscent ya no se ven, así que van más gruesas. Sin vincular,
// la luna queda afuera y la órbita, punteada; vinculada, entra y la órbita queda entera. Con Reducir
// movimiento, cambia sin viajar.

import { Canvas, Circle, DashPathEffect, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { LLEGA } from '../movimiento';

export type PropsDeMarcaChica = { unida?: boolean; tam?: number };

export default function MarcaChicaSkia({ unida = false, tam = 24 }: PropsDeMarcaChica) {
  const orbita = useMemo(() => Skia.Path.MakeFromSVGString('M -4.59 -6.55 A 8 8 0 1 1 -6.55 4.59'), []);
  const reducido = useReducedMotion();
  const u = useSharedValue(unida ? 1 : 0);
  useEffect(() => {
    const hasta = unida ? 1 : 0;
    u.set(reducido ? hasta : withTiming(hasta, { duration: 1300, easing: LLEGA }));
  }, [unida, reducido, u]);
  const luna = useDerivedValue(() => [{ translateX: 9.3 + (6.55 - 9.3) * u.get() }, { translateY: -7 + (7 - 4.59) * u.get() }]);
  const opacidadLuna = useDerivedValue(() => 0.8 + 0.2 * u.get());
  const punteada = useDerivedValue(() => 1 - u.get());
  const entera = useDerivedValue(() => 0.9 * u.get());
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 24 }]}>
        <Circle cx={0} cy={0} r={4.6}>
          <RadialGradient c={vec(-1.6, -1.8)} r={8} colors={['#7b8498', '#2b313e']} />
        </Circle>
        <Circle cx={0} cy={0} r={4.6} style="stroke" strokeWidth={0.7} color="rgba(232, 236, 246, 0.4)" />
        {orbita && (
          <>
            <Path path={orbita} style="stroke" strokeWidth={1} strokeCap="round" color="rgba(138, 147, 168, 0.9)" opacity={punteada}>
              <DashPathEffect intervals={[0.1, 2.3]} />
            </Path>
            <Path path={orbita} style="stroke" strokeWidth={1} strokeCap="round" color="#c4c2ba" opacity={entera} />
          </>
        )}
        <Group transform={luna}>
          <Circle cx={0} cy={0} r={1.9} color="#f6ecd2" opacity={opacidadLuna} />
        </Group>
      </Group>
    </Canvas>
  );
}
