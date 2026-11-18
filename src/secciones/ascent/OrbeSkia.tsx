// La entrada a Ascent en Progreso (galeria/src/ascent.js, el orbe): el planeta con el punto arriba a la derecha.
// Sin vincular (y mientras Ascent dice «Pronto»), el logo de Ascent como en su ícono: la órbita abierta a la
// izquierda. Vinculada, la órbita se cierra (las dos apps, juntas); si algo pone el límite hoy, va en terracota.

import { Canvas, Circle, Group, Path, RadialGradient, Skia, vec } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { C, useAcento } from './colores';

export type PropsDelOrbe = { tam?: number; unida?: boolean; atencion?: boolean };

export default function OrbeSkia({ tam = 48, unida = false, atencion = false }: PropsDelOrbe) {
  const abierta = useMemo(() => Skia.Path.MakeFromSVGString('M -7.36 -17.52 A 19 19 0 1 1 -16.45 9.5'), []);
  const reducido = useReducedMotion();
  const { claro } = useAcento();
  const u = useSharedValue(unida ? 1 : 0);
  useEffect(() => {
    u.set(withTiming(unida ? 1 : 0, { duration: reducido ? 0 : 900 }));
  }, [unida, reducido, u]);
  const opAbierta = useDerivedValue(() => 0.9 * (1 - u.get()));
  const opCerrada = useDerivedValue(() => u.get());
  // El arco se cierra desde arriba, como en la galería.
  const arco = useDerivedValue(() => u.get());
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 48 }]}>
        {abierta && <Path path={abierta} style="stroke" strokeWidth={1.7} strokeCap="round" color="#9ea4ae" opacity={opAbierta} />}
        <Circle cx={0} cy={0} r={19} style="stroke" strokeWidth={1.6} color="rgba(170, 178, 196, 0.22)" opacity={opCerrada} />
        <Group transform={[{ rotate: -Math.PI / 2 }]}>
          <Path path={CIRCULO} style="stroke" strokeWidth={2.2} strokeCap="round" color={atencion ? C.lejos : claro} end={arco} opacity={opCerrada} />
        </Group>
        <Circle cx={0} cy={0} r={12.5}>
          <RadialGradient c={vec(3, 4)} r={20} colors={['#0d1016', '#1b1f2a', '#3b4251', '#98a1b5']} positions={[0, 0.58, 0.85, 1]} />
        </Circle>
        <Group transform={[{ translateX: 14.6 }, { translateY: -12.16 }]}>
          <Circle cx={0} cy={0} r={4.4} color="rgba(255, 255, 255, 0.2)" />
          <Circle cx={0} cy={0} r={2.8} opacity={0.9}>
            <RadialGradient c={vec(-0.78, -1)} r={4.48} colors={['#ffffff', '#b9bec8']} />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}

const CIRCULO = Skia.PathBuilder.Make().addCircle(0, 0, 19).detach();
