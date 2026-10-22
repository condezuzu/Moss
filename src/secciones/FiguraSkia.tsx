// La figura de las medidas del cuerpo, la de la galería (galeria/src/mas.js): de frente y sin
// rasgos, porque lo que importa es dónde va la cinta. La de la medida que se está escribiendo brilla.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, Oval, Path, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { Sitio } from '@/dominio/cuerpo';

// Dónde va la cinta en cada medida: [x1, y, x2, curva], en una caja de 120 × 240.
const CINTA: Record<Sitio, readonly [number, number, number, number]> = {
  cuello: [53, 41, 67, 2.5], pecho: [36.5, 65, 83.5, 5], cintura: [41, 97, 79, 4.5], cadera: [37.5, 118, 82.5, 5],
  brazo: [22.6, 74, 33.8, 2.4], muslo: [40.5, 150, 57.5, 3],
};
const TORSO = 'M44 45.5C50 43 70 43 76 45.5L83.5 50.5C85.5 58 84.5 71 81.5 81C79.5 88 78.5 94 79 100C80 108 83 113 83 122C83 127 79 129 75 129L45 129C41 129 37 127 37 122C37 113 40 108 41 100C41.5 94 40.5 88 38.5 81C35.5 71 34.5 58 36.5 50.5Z';
const RELLENO = 'rgba(239, 230, 207, 0.09)';
const BORDE = 'rgba(239, 230, 207, 0.22)';

export type PropsDeFigura = { activa: Sitio; ancho: number };

/** Un miembro: el relleno tenue y su borde, girado como en la galería. */
function Parte({ x, y, w, h, r, giro, origen }: { x: number; y: number; w: number; h: number; r: number; giro: number; origen: [number, number] }) {
  return (
    <Group origin={vec(origen[0], origen[1])} transform={[{ rotate: (giro * Math.PI) / 180 }]}>
      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={RELLENO} />
      <RoundedRect x={x} y={y} width={w} height={h} r={r} color={BORDE} style="stroke" strokeWidth={0.8} />
    </Group>
  );
}

export default function FiguraSkia({ activa, ancho }: PropsDeFigura) {
  const torso = useMemo(() => Skia.Path.MakeFromSVGString(TORSO)!, []);
  const cintas = useMemo(
    () => (Object.entries(CINTA) as [Sitio, (typeof CINTA)[Sitio]][]).map(([sitio, [x1, y, x2, curva]]) => ({ sitio, camino: Skia.Path.MakeFromSVGString(`M${x1} ${y} Q${(x1 + x2) / 2} ${y + curva} ${x2} ${y}`)! })),
    [],
  );
  const s = ancho / 120;
  return (
    <Canvas style={{ width: ancho, height: ancho * 2 }} pointerEvents="none">
      <Group transform={[{ scale: s }]}>
        <Oval x={48.5} y={7.5} width={23} height={27} color={RELLENO} />
        <Oval x={48.5} y={7.5} width={23} height={27} color={BORDE} style="stroke" strokeWidth={0.8} />
        <Parte x={54} y={31} w={12} h={15} r={4} giro={0} origen={[60, 31]} />
        <Parte x={22} y={51} w={11} h={74} r={5.5} giro={7} origen={[27.5, 51]} />
        <Parte x={87} y={51} w={11} h={74} r={5.5} giro={-7} origen={[92.5, 51]} />
        <Parte x={40} y={118} w={18} h={114} r={9} giro={2} origen={[49, 118]} />
        <Parte x={62} y={118} w={18} h={114} r={9} giro={-2} origen={[71, 118]} />
        <Path path={torso} color={RELLENO} />
        <Path path={torso} color={BORDE} style="stroke" strokeWidth={0.8} />
        <Circle cx={60} cy={99.5} r={0.9} color="rgba(239, 230, 207, 0.4)" />
        {cintas.map(({ sitio, camino }) =>
          sitio === activa ? (
            <Group key={sitio}>
              <Path path={camino} color="#e8c46a" style="stroke" strokeWidth={2.2} strokeCap="round">
                <BlurMask blur={2} style="solid" />
              </Path>
            </Group>
          ) : (
            <Path key={sitio} path={camino} color="rgba(239, 230, 207, 0.2)" style="stroke" strokeWidth={1}>
              <DashPathEffect intervals={[2, 2.5]} />
            </Path>
          ),
        )}
      </Group>
    </Canvas>
  );
}
