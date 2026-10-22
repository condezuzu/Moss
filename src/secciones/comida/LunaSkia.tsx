// La luna de la comida, la de la galería (galeria/src/luna.js): la parte iluminada es lo que llevas
// del día contra la meta. La cara con su degradé, los mares difuminados, el grano y la sombra con
// el borde suave. Se dibuja en una caja de 100 × 100 (el disco es de radio 40; el resto, el halo).
// Las lunas chicas de la semana y del mes son más simples: la noche, la luz y el borde.

import {
  Blur, Canvas, Circle, ColorMatrix, DashPathEffect, FractalNoise, Group, Mask, Oval, Paint, Path, RadialGradient, Skia, vec, type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

/** La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de la galería. */
export function fase(p: number, r: number): string {
  'worklet';
  const rx = Math.abs(Math.cos(Math.PI * p)) * r;
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
}

const MARES: readonly [number, number, number, number][] = [[-13, -15, 11, 8.5], [5, -11, 7, 6], [13, -1, 8, 7], [-21, 5, 8, 15], [-3, 14, 7, 4.5], [22, -14, 4, 3.2], [19, 13, 5, 4]];
// El grano: el ruido, en un color de piedra, con su alfa estirada (como el feColorMatrix de la galería).
const GRANO = [0, 0, 0, 0, 0.32, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0.26, 0, 0, 0, 1.5, -0.72];

export type PropsDeLuna = {
  /** El lado, en puntos: el disco ocupa el 80 %. */
  tam: number;
  /** Lo comido sobre la meta: 0 es nueva y 1, llena. */
  fraccion: number;
  /** Cuánto tarda en llegar a la fase nueva. */
  ms?: number;
};

export default function LunaSkia({ tam, fraccion, ms = 1100 }: PropsDeLuna) {
  const ahora = useSharedValue(fraccion);
  useEffect(() => {
    ahora.set(ms ? withTiming(fraccion, { duration: ms, easing: Easing.out(Easing.cubic) }) : fraccion);
  }, [ahora, fraccion, ms]);
  const camino = useDerivedValue<SkPath>(() => Skia.Path.MakeFromSVGString(fase(0.04 + 0.96 * Math.min(1, Math.max(0, ahora.get())), 40)) ?? Skia.Path.Make());
  const disco = useMemo(() => Skia.Path.Circle(0, 0, 40), []);
  const s = tam / 100;
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: s }]}>
        <Circle cx={0} cy={0} r={46} color="rgba(236, 230, 214, 0.07)">
          <Blur blur={9 / s} />
        </Circle>
        <Group clip={disco}>
          <Circle cx={0} cy={0} r={40} color="#12172a" />
          <Mask mask={<Path path={camino} color="white"><Blur blur={1.4} /></Path>}>
            <Circle cx={0} cy={0} r={40}>
              <RadialGradient c={vec(-8, -11.2)} r={57.6} colors={['#f7f3e8', '#e4ddcc', '#b9b09b']} positions={[0, 0.6, 1]} />
            </Circle>
            <Group opacity={0.5} layer={<Paint><Blur blur={2.4} /></Paint>}>
              {MARES.map(([cx, cy, rx, ry]) => <Oval key={`${cx},${cy}`} x={cx - rx} y={cy - ry} width={2 * rx} height={2 * ry} color="#8c8574" />)}
            </Group>
            <Circle cx={0} cy={0} r={40} opacity={0.55}>
              <FractalNoise freqX={0.16} freqY={0.16} octaves={3} seed={4} />
              <ColorMatrix matrix={GRANO} />
            </Circle>
            <Circle cx={-7} cy={27} r={1.5} color="#f8f4ea" opacity={0.7} />
            <Circle cx={9} cy={22} r={1} color="#f8f4ea" opacity={0.7} />
          </Mask>
        </Group>
        <Circle cx={0} cy={0} r={40} style="stroke" strokeWidth={0.6} color="rgba(236, 230, 214, 0.16)" />
      </Group>
    </Canvas>
  );
}

/** Cómo está un día: comido, planificado, todavía no llegó, sin nada, o fuera del mes. */
export type EstadoDeLunita = 'comido' | 'plan' | 'futuro' | 'vacio' | 'fuera';
export type Lunita = { estado: EstadoDeLunita; fraccion: number };

export type PropsDeLunitas = {
  lunas: Lunita[];
  /** El ancho de la fila: cada luna va en el medio de su columna. */
  ancho: number;
  /** El lado de cada luna. */
  tam: number;
};

/** Una fila de lunas chicas en un solo lienzo (la semana, o una fila del mes): más liviano que una por día. */
export function LunitasSkia({ lunas, ancho, tam }: PropsDeLunitas) {
  const caminos = useMemo(
    () => lunas.map((l) => (l.estado === 'comido' || l.estado === 'plan' ? Skia.Path.MakeFromSVGString(fase(Math.max(0.04, Math.min(1, l.fraccion)), 9.5)) : null)),
    [lunas],
  );
  if (!ancho) return null;
  const columna = ancho / lunas.length;
  const s = tam / 24;
  return (
    <Canvas style={{ width: ancho, height: tam }} pointerEvents="none">
      {lunas.map((l, i) => {
        if (l.estado === 'fuera') return null;
        const camino = caminos[i];
        const punteado = l.estado === 'plan' || l.estado === 'futuro';
        return (
          <Group key={i} transform={[{ translateX: columna * (i + 0.5) }, { translateY: tam / 2 }, { scale: s }]}>
            {l.estado !== 'futuro' && <Circle cx={0} cy={0} r={9.5} color="#141a2e" />}
            {camino && <Path path={camino} color="#e6dfcc" opacity={l.estado === 'plan' ? 0.35 : 1} />}
            <Circle cx={0} cy={0} r={9.5} style="stroke" strokeWidth={0.9} color={l.estado === 'vacio' ? 'rgba(236, 230, 214, 0.16)' : 'rgba(236, 230, 214, 0.28)'}>
              {punteado && <DashPathEffect intervals={[2, 2.2]} />}
            </Circle>
          </Group>
        );
      })}
    </Canvas>
  );
}
