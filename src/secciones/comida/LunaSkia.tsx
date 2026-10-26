// La luna de la comida, la de la galería (galeria/src/luna.js): la parte iluminada es lo que llevas
// del día contra la meta. Desde el 27/10, en los colores de Moss: luz de luna cálida, los mares
// suaves con algunos cráteres, la sombra del borde, un resplandor que crece con la fase (como el de
// las estrellas) y el disco oscuro con su borde, que siempre muestra la meta. Pasada la meta, el
// borde y el resplandor se doran. Se dibuja en una caja de 100 × 100 con el disco de radio 40; el
// lienzo es más grande que la caja para que el resplandor no se corte.
// Las lunas chicas de la semana y del mes son más simples: la noche, la luz y el borde.

import {
  Blur, Canvas, Circle, ColorMatrix, DashPathEffect, FractalNoise, Group, Mask, Oval, Paint, Path, RadialGradient, Skia, vec, type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { useCalidad } from '@/cielo/dia';

/** La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de la galería. */
export function fase(p: number, r: number): string {
  'worklet';
  const rx = Math.abs(Math.cos(Math.PI * p)) * r;
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
}

const MARES: readonly [number, number, number, number][] = [[-12, -14, 11, 8.5], [5, -10, 7, 6], [13, 0, 7.5, 7], [-20, 6, 7.5, 13], [-2, 15, 6.5, 4.2], [20, 14, 4.5, 3.6]];
const CRATERES: readonly [number, number, number][] = [[-6, 27, 2.4], [10, 23, 1.5], [24, -2, 1.3], [-26, -6, 1.2]];
// El grano: el ruido, en un color de piedra cálida, con su alfa estirada (como el feColorMatrix de la galería).
const GRANO = [0, 0, 0, 0, 0.42, 0, 0, 0, 0, 0.35, 0, 0, 0, 0, 0.22, 0, 0, 0, 1, -0.4];
/** Lo que sobra alrededor de la caja, para el resplandor. */
const MARGEN = 0.12;

export type PropsDeLuna = {
  /** El lado, en puntos: el disco ocupa el 80 %. */
  tam: number;
  /** Lo comido sobre la meta: 0 es nueva y 1, llena; más de 1, pasada. */
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
  // El resplandor crece con la fase; pasada la meta, se dora.
  const brillo = useDerivedValue(() => (ahora.get() > 1 ? 0.36 : 0.07 + 0.2 * Math.min(1, Math.max(0, ahora.get()))));
  const pasada = fraccion > 1;
  // En calidad baja, sin el grano ni los desenfoques de los mares y del borde: lo que más cuesta.
  const simple = useCalidad() === 'baja';
  const disco = useMemo(() => Skia.Path.Circle(0, 0, 40), []);
  const s = tam / 100;
  const margen = tam * MARGEN;
  const lado = tam + 2 * margen;
  return (
    <Canvas style={{ width: lado, height: lado, margin: -margen }} pointerEvents="none">
      <Group transform={[{ translateX: lado / 2 }, { translateY: lado / 2 }, { scale: s }]}>
        <Group transform={[{ scale: 1.06 }]}>
          <Path path={camino} color={pasada ? '#f0c56a' : '#f6e3a6'} opacity={brillo}>
            <Blur blur={7} />
          </Path>
        </Group>
        <Group clip={disco}>
          <Circle cx={0} cy={0} r={40}>
            <RadialGradient c={vec(-8, -9.6)} r={57.6} colors={['#1b2342', '#0b1022']} />
          </Circle>
          <Mask mask={<Path path={camino} color="white"><Blur blur={1.2} /></Path>}>
            <Circle cx={0} cy={0} r={40}>
              <RadialGradient c={vec(-11.2, -14.4)} r={60.8} colors={['#fffaf0', '#f0e5ca', '#d6c39b', '#bfa77a']} positions={[0, 0.5, 0.88, 1]} />
            </Circle>
            <Group opacity={simple ? 0.3 : 0.42} layer={simple ? undefined : <Paint><Blur blur={2.2} /></Paint>}>
              {MARES.map(([cx, cy, rx, ry]) => <Oval key={`${cx},${cy}`} x={cx - rx} y={cy - ry} width={2 * rx} height={2 * ry} color="#a48d62" />)}
            </Group>
            {CRATERES.map(([cx, cy, r]) => <Circle key={`${cx},${cy}`} cx={cx} cy={cy} r={r} style="stroke" strokeWidth={0.7} color="#9c8459" opacity={0.28} />)}
            {!simple && (
              <Circle cx={0} cy={0} r={40} opacity={0.16}>
                <FractalNoise freqX={0.5} freqY={0.5} octaves={2} seed={7} />
                <ColorMatrix matrix={GRANO} />
              </Circle>
            )}
            <Circle cx={0} cy={0} r={40} style="stroke" strokeWidth={simple ? 3 : 6} color="#8a7348" opacity={simple ? 0.25 : 0.4}>
              {!simple && <Blur blur={2.2} />}
            </Circle>
          </Mask>
        </Group>
        <Circle cx={0} cy={0} r={40} style="stroke" strokeWidth={pasada ? 1 : 0.7} color={pasada ? 'rgba(240, 197, 106, 0.6)' : 'rgba(246, 227, 166, 0.22)'} />
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
            {l.estado !== 'futuro' && <Circle cx={0} cy={0} r={9.5} color="#141c36" />}
            {camino && <Path path={camino} color="#ecdcb2" opacity={l.estado === 'plan' ? 0.35 : 1} />}
            <Circle cx={0} cy={0} r={9.5} style="stroke" strokeWidth={0.9} color={l.estado === 'vacio' ? 'rgba(246, 227, 166, 0.16)' : 'rgba(246, 227, 166, 0.3)'}>
              {punteado && <DashPathEffect intervals={[2, 2.2]} />}
            </Circle>
          </Group>
        );
      })}
    </Canvas>
  );
}
