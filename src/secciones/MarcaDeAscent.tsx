// El planeta de Ascent con su órbita abierta, como en su ícono, y la luna de Moss: sin vincular queda
// afuera de la órbita, y al vincular entra (galería, sección 7). La órbita pasa de punteada a
// entera y la luna toma su halo. Con Reducir movimiento, cambia sin viajar.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const LLEGA = Easing.bezier(0.16, 1, 0.3, 1);

export function MarcaDeAscent({ unida = false, tam = 124 }: { unida?: boolean; tam?: number }) {
  const orbita = useMemo(() => Skia.Path.MakeFromSVGString('M -25.24 -36.04 A 44 44 0 1 1 -36.04 25.24'), []);
  const reducido = useReducedMotion();
  const u = useSharedValue(unida ? 1 : 0);
  const halo = useSharedValue(unida ? 1 : 0);
  useEffect(() => {
    const hasta = unida ? 1 : 0;
    u.set(reducido ? hasta : withTiming(hasta, { duration: 1300, easing: LLEGA }));
    halo.set(reducido ? hasta : withDelay(unida ? 400 : 0, withTiming(hasta, { duration: 1000 })));
  }, [unida, reducido, u, halo]);
  const luna = useDerivedValue(() => [{ translateX: 51 + (36.04 - 51) * u.get() }, { translateY: -36 + (36 - 25.24) * u.get() }]);
  const opacidadLuna = useDerivedValue(() => 0.6 + 0.4 * u.get());
  const punteada = useDerivedValue(() => 1 - u.get());
  const entera = useDerivedValue(() => 0.85 * u.get());
  const escala = tam / 124;
  return (
    <Canvas style={[estilos.marca, { width: tam, height: tam }, tam !== 124 && estilos.chica]}>
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: escala }]}>
        <Circle cx={0} cy={0} r={25}>
          <RadialGradient c={vec(-8, -10)} r={42} colors={['#6b7386', '#2b313e', '#0c0f15']} />
        </Circle>
        <Circle cx={0} cy={0} r={25} style="stroke" strokeWidth={0.8} color="rgba(232, 236, 246, 0.14)" />
        {orbita && (
          <>
            <Path path={orbita} style="stroke" strokeWidth={1.3} strokeCap="round" color="rgba(138, 147, 168, 0.6)" opacity={punteada}>
              <DashPathEffect intervals={[0.4, 5]} />
            </Path>
            <Path path={orbita} style="stroke" strokeWidth={1.6} strokeCap="round" color="#c4c2ba" opacity={entera} />
          </>
        )}
        <Group transform={luna}>
          <Circle cx={0} cy={0} r={9.5} color="rgba(246, 236, 210, 0.22)" opacity={halo}>
            <BlurMask blur={3} style="normal" />
          </Circle>
          <Circle cx={0} cy={0} r={5.2} opacity={opacidadLuna}>
            <RadialGradient c={vec(-2, -2)} r={7} colors={['#fbf6ea', '#bdb39c']} />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}

const estilos = StyleSheet.create({
  marca: { alignSelf: 'center', marginTop: 2 },
  chica: { alignSelf: 'auto', marginTop: 0 },
});
