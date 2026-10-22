// Lo de la entrada que se dibuja con Skia: el aro del botón que se llena y los anillos de los macros
// alrededor de la luna. En la web llega con un import dinámico (Lienzos.web.tsx).

import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { colores } from '@/tema';
import { COLOR_DE_MACRO } from '../comida/comunes';

export type PropsDeAro = { avance: SharedValue<number>; listo: boolean };

export function AroSkia({ avance, listo }: PropsDeAro) {
  const caminos = useMemo(() => ({ aro: Skia.Path.Circle(32, 32, 29), flecha: Skia.Path.MakeFromSVGString('M26 32h13M33 25.5l6.5 6.5-6.5 6.5')! }), []);
  const fin = useDerivedValue(() => avance.get());
  return (
    <Canvas style={{ width: 64, height: 64 }} pointerEvents="none">
      <Circle cx={32} cy={32} r={29} color="rgba(6, 10, 22, 0.35)" />
      <Circle cx={32} cy={32} r={29} style="stroke" strokeWidth={1.2} color="rgba(239, 230, 207, 0.16)" />
      <Group origin={{ x: 32, y: 32 }} transform={[{ rotate: -Math.PI / 2 }]}>
        <Path path={caminos.aro} style="stroke" strokeWidth={2} strokeCap="round" color={colores.oro} start={0} end={fin} />
      </Group>
      <Path path={caminos.flecha} style="stroke" strokeWidth={1.8} strokeCap="round" strokeJoin="round" color={listo ? colores.oroClaro : 'rgba(239, 230, 207, 0.35)'} />
    </Canvas>
  );
}

const MACROS = ['proteina', 'carbohidratos', 'grasas'] as const;

export type PropsDeAnillos = { tam: number; reparto?: readonly [number, number, number]; ms: number; demora?: number };

/**
 * Alrededor de la luna, los macros, de dos maneras: tres anillos que se llenan hasta la meta (la
 * diapositiva) o un solo anillo repartido entre los tres, en proporción a sus kcal (el resultado).
 */
export function AnillosSkia({ tam, reparto, ms, demora = 250 }: PropsDeAnillos) {
  const k = tam / 200;
  const avance = useSharedValue(0);
  useEffect(() => {
    avance.set(withDelay(demora, withTiming(1, { duration: ms, easing: Easing.out(Easing.cubic) })));
  }, [avance, ms, demora]);
  const caminos = useMemo(() => MACROS.map((_, i) => Skia.Path.Circle(tam / 2, tam / 2, (reparto ? 60 : 54 + i * 8) * k)), [tam, k, reparto]);
  // Repartido: cada macro su tramo del mismo anillo, uno detrás del otro, con un hueco entre ellos.
  const desde = reparto ? [0, reparto[0], reparto[0] + reparto[1]] : [0, 0, 0];
  const hueco = reparto ? 7 / (2 * Math.PI * 60) : 0;
  const parte = (i: number, u: number) => {
    'worklet';
    if (reparto) return desde[i] + Math.max(0, reparto[i] - hueco) * Math.min(1, Math.max(0, u * 3 - i));
    return Math.min(1, Math.max(0, (u - 0.15 * i) / 0.7));
  };
  const fin0 = useDerivedValue(() => parte(0, avance.get()));
  const fin1 = useDerivedValue(() => parte(1, avance.get()));
  const fin2 = useDerivedValue(() => parte(2, avance.get()));
  const fines = [fin0, fin1, fin2];
  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width: tam, height: tam }} pointerEvents="none">
      <Group origin={{ x: tam / 2, y: tam / 2 }} transform={[{ rotate: -Math.PI / 2 }]}>
        {MACROS.map((m, i) => (
          <Path key={m} path={caminos[i]} style="stroke" strokeWidth={2.4 * Math.max(1, k)} strokeCap="round" color={COLOR_DE_MACRO[m]} start={desde[i]} end={fines[i]} />
        ))}
      </Group>
    </Canvas>
  );
}
