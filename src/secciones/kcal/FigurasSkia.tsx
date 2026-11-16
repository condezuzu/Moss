// Las calorías del día en cada estilo, las de la galería (galeria/src/kcal.js y luna.js), en Skia: la luna con
// relieve, el anillo, el arco y los anillos de los macros. La barra por comidas va con vistas (Barra.tsx).
// Todas van de lo que muestran a lo nuevo, y pasada la meta quedan llenas y en oro.

import {
  Blur, BlurMask, Canvas, Circle, ColorMatrix, DashPathEffect, FractalNoise, Group, Mask, Oval, Paint, Path, RadialGradient, Skia, vec, type SkPath,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useCalidad } from '@/cielo/dia';
import { colores } from '@/tema';
import { altoDelArco } from './medidas';

const LLENO = '#ece4cf';
const PISTA = 'rgba(239, 230, 207, 0.09)';
const CASI_NADA = 0.004;

/** Lo que se muestra, que va hacia `fraccion` en `ms` (con Reducir movimiento, de una). */
function useHacia(fraccion: number, ms: number): SharedValue<number> {
  const ahora = useSharedValue(fraccion);
  const reducido = useReducedMotion();
  useEffect(() => {
    ahora.set(ms && !reducido ? withTiming(fraccion, { duration: ms, easing: Easing.out(Easing.cubic) }) : fraccion);
  }, [ahora, fraccion, ms, reducido]);
  return ahora;
}

const entre0y1 = (x: number) => {
  'worklet';
  return Math.min(1, Math.max(0, x));
};

/** Una vuelta entera de radio r, desde arriba y en el sentido del reloj. */
const vuelta = (r: number) => Skia.Path.MakeFromSVGString(`M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}`) ?? Skia.Path.Make();

// ------------------------------------------------------------ la luna
/** La parte iluminada de una luna de radio r: p va de 0 (nueva) a 1 (llena). La misma de la galería. */
function fase(p: number, r: number): string {
  'worklet';
  const rx = Math.abs(Math.cos(Math.PI * p)) * r;
  return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
}

const MARES: readonly [number, number, number, number][] = [[-12, -14, 11, 8.5], [5, -10, 7, 6], [13, 0, 7.5, 7], [-20, 6, 7.5, 13], [-2, 15, 6.5, 4.2], [20, 14, 4.5, 3.6]];
// Cada cráter: [x, y, radio]. La sombra va adentro, del lado de la luz; el borde de enfrente la toma.
const CRATERES: readonly [number, number, number][] = [[-6, 27, 2.6], [10, 23, 1.6], [24, -2, 1.4], [-26, -6, 1.3], [-14, 20, 1.1], [17, -21, 1.8], [-29, 13, 0.9], [3, -27, 1.2]];
const BORDES_DE_LOS_CRATERES = CRATERES.map(([x, y, r]) => `M ${(x - r * 0.8).toFixed(2)} ${(y + r * 0.6).toFixed(2)} A ${r} ${r} 0 0 0 ${(x + r * 0.8).toFixed(2)} ${(y + r * 0.6).toFixed(2)}`).join(' ');
// El grano: el ruido, en un color de piedra cálida, con su alfa estirada (como el feColorMatrix de la galería).
const GRANO = [0, 0, 0, 0, 0.42, 0, 0, 0, 0, 0.35, 0, 0, 0, 0, 0.22, 0, 0, 0, 1, -0.4];
const CARA = ['#fffaf0', '#f0e5ca', '#d6c39b', '#bfa77a'];
/** Lo que sobra alrededor de la caja, para el resplandor. */
const MARGEN = 0.12;

export type PropsDeLuna = { tam: number; fraccion: number; ms?: number };

/**
 * La luna de la galería del 2/11: la luz cenicienta, que deja ver apenas los mares en la parte oscura, los cráteres
 * con relieve (la sombra adentro y el borde que toma la luz) y una línea de luz suave donde termina la sombra.
 */
export function LunaSkia({ tam, fraccion, ms = 1100 }: PropsDeLuna) {
  const ahora = useHacia(fraccion, ms);
  const camino = useDerivedValue<SkPath>(() => Skia.Path.MakeFromSVGString(fase(0.04 + 0.96 * entre0y1(ahora.get()), 40)) ?? Skia.Path.Make());
  // El resplandor crece con la fase; pasada la meta, se dora.
  const brillo = useDerivedValue(() => (ahora.get() > 1 ? 0.36 : 0.07 + 0.2 * entre0y1(ahora.get())));
  // Llena, no hay sombra: la línea se apaga.
  const terminador = useDerivedValue(() => (entre0y1(ahora.get()) > 0.97 ? 0 : 0.35));
  const pasada = fraccion > 1;
  // En calidad baja, sin el grano ni los desenfoques: lo que más cuesta.
  const simple = useCalidad() === 'baja';
  const disco = useMemo(() => Skia.Path.Circle(0, 0, 40), []);
  const bordes = useMemo(() => Skia.Path.MakeFromSVGString(BORDES_DE_LOS_CRATERES) ?? Skia.Path.Make(), []);
  const s = tam / 100;
  const margen = tam * MARGEN;
  const lado = tam + 2 * margen;
  const mares = (opacidad: number) => (
    <Group opacity={opacidad} layer={simple ? undefined : <Paint><Blur blur={2.2} /></Paint>}>
      {MARES.map(([cx, cy, rx, ry]) => <Oval key={`${cx},${cy}`} x={cx - rx} y={cy - ry} width={2 * rx} height={2 * ry} color="#a48d62" />)}
    </Group>
  );
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
          {/* La luz cenicienta: la cara de la luna, apenas, en la parte oscura. */}
          <Group opacity={0.075}>
            <Circle cx={0} cy={0} r={40}>
              <RadialGradient c={vec(-11.2, -14.4)} r={60.8} colors={CARA} positions={[0, 0.5, 0.88, 1]} />
            </Circle>
            {mares(0.9)}
          </Group>
          <Mask mask={<Path path={camino} color="white"><Blur blur={1.2} /></Path>}>
            <Circle cx={0} cy={0} r={40}>
              <RadialGradient c={vec(-11.2, -14.4)} r={60.8} colors={CARA} positions={[0, 0.5, 0.88, 1]} />
            </Circle>
            {mares(simple ? 0.3 : 0.42)}
            {CRATERES.map(([cx, cy, r]) => <Circle key={`${cx},${cy}`} cx={cx - r * 0.18} cy={cy - r * 0.18} r={r} color="#8f7a52" opacity={0.22} />)}
            <Path path={bordes} style="stroke" strokeWidth={0.6} strokeCap="round" color="#fff8e6" opacity={0.55} />
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
          <Path path={camino} style="stroke" strokeWidth={1.4} color="#fff3d2" opacity={terminador}>
            {!simple && <Blur blur={2.2} />}
          </Path>
        </Group>
        <Circle cx={0} cy={0} r={40} style="stroke" strokeWidth={pasada ? 1 : 0.7} color={pasada ? 'rgba(240, 197, 106, 0.6)' : 'rgba(246, 227, 166, 0.22)'} />
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ el anillo
export type PropsDeAnillo = { tam: number; grueso: number; fraccion: number; ms?: number };

/** Una vuelta es la meta, desde arriba y en el sentido del reloj. */
export function AnilloSkia({ tam, grueso, fraccion, ms = 1100 }: PropsDeAnillo) {
  const ahora = useHacia(fraccion, ms);
  const camino = useMemo(() => vuelta(46 - grueso / 2), [grueso]);
  const fin = useDerivedValue(() => entre0y1(ahora.get()));
  const se = useDerivedValue(() => (ahora.get() < CASI_NADA ? 0 : 1));
  const color = fraccion > 1.0005 ? colores.oro : LLENO;
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 100 }]}>
        <Path path={camino} style="stroke" strokeWidth={grueso} color={PISTA} />
        <Group opacity={se}>
          <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} opacity={0.35}>
            <BlurMask blur={3} style="normal" />
          </Path>
          <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} />
        </Group>
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ el arco
export type PropsDeArco = { ancho: number; grueso: number; fraccion: number; estrella?: boolean; ms?: number };


/** Medio círculo, como el cielo sobre el horizonte: lo comido sube de izquierda a derecha, con una estrella en la punta. */
export function ArcoSkia({ ancho, grueso, fraccion, estrella = true, ms = 1100 }: PropsDeArco) {
  const ahora = useHacia(fraccion, ms);
  const r = 46 - grueso / 2;
  const camino = useMemo(() => Skia.Path.MakeFromSVGString(`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`) ?? Skia.Path.Make(), [r]);
  const fin = useDerivedValue(() => entre0y1(ahora.get()));
  const se = useDerivedValue(() => (ahora.get() < CASI_NADA ? 0 : 1));
  const x = useDerivedValue(() => r * Math.cos(Math.PI * (1 - entre0y1(ahora.get()))));
  const y = useDerivedValue(() => -r * Math.sin(Math.PI * (1 - entre0y1(ahora.get()))));
  const deMas = fraccion > 1.0005;
  const color = deMas ? colores.oro : LLENO;
  const s = ancho / 100;
  const radio = Math.max(1.6, grueso * 0.95);
  return (
    <Canvas style={{ width: ancho, height: altoDelArco(grueso) * s }} pointerEvents="none">
      <Group transform={[{ translateX: ancho / 2 }, { translateY: 50 * s }, { scale: s }]}>
        <Path path={camino} style="stroke" strokeWidth={grueso} color={PISTA} />
        <Group opacity={se}>
          <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} opacity={0.35}>
            <BlurMask blur={3} style="normal" />
          </Path>
          <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} />
          {estrella && (
            <>
              <Circle cx={x} cy={y} r={radio * 2.4} color={colores.oro} opacity={0.4}>
                <BlurMask blur={radio * 1.6} style="normal" />
              </Circle>
              <Circle cx={x} cy={y} r={radio} color={deMas ? colores.oroClaro : colores.cifra} />
            </>
          )}
        </Group>
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ los anillos de los macros
export type FraccionesDeMacros = { proteina: number; carbohidratos: number; grasas: number };
export type PropsDeMacros = { tam: number; grueso: number; fracciones: FraccionesDeMacros; ms?: number };

const COLOR_DEL_ANILLO = { proteina: [colores.oroClaro, 'rgba(246, 227, 166, 0.13)'], carbohidratos: [colores.salvia, 'rgba(166, 191, 148, 0.13)'], grasas: [colores.grasas, 'rgba(169, 196, 245, 0.13)'] } as const;

function UnAnillo({ r, grueso, fraccion, macro, ms }: { r: number; grueso: number; fraccion: number; macro: keyof FraccionesDeMacros; ms: number }) {
  const ahora = useHacia(fraccion, ms);
  const camino = useMemo(() => vuelta(r), [r]);
  const fin = useDerivedValue(() => entre0y1(ahora.get()));
  const se = useDerivedValue(() => (ahora.get() < CASI_NADA ? 0 : 1));
  const [color, pista] = COLOR_DEL_ANILLO[macro];
  return (
    <>
      <Path path={camino} style="stroke" strokeWidth={grueso} color={pista} />
      <Group opacity={se}>
        <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} opacity={0.35}>
          <BlurMask blur={3} style="normal" />
        </Path>
        <Path path={camino} style="stroke" strokeWidth={grueso} strokeCap="round" color={color} start={0} end={fin} />
      </Group>
    </>
  );
}

/** Tres vueltas, de afuera hacia adentro: la proteína, los carbohidratos y las grasas, como los anillos de Actividad. */
export function MacrosSkia({ tam, grueso, fracciones, ms = 1100 }: PropsDeMacros) {
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 100 }]}>
        {(['proteina', 'carbohidratos', 'grasas'] as const).map((m, i) => (
          <UnAnillo key={m} macro={m} r={46 - grueso / 2 - i * (grueso + 2.5)} grueso={grueso} fraccion={fracciones[m]} ms={ms} />
        ))}
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ el camino del primer día
export type PropsDelCamino = { ancho: number; alto: number; desde: number; meta: number };

/**
 * El camino del primer día (galeria/src/inicio.js, caminoPrimerDia): hoy y la meta, unidos por lo que falta (punteado),
 * con la línea de la meta. Se dibuja de izquierda a derecha al aparecer.
 */
export function CaminoSkia({ ancho, alto, desde, meta }: PropsDelCamino) {
  const reducido = useReducedMotion();
  const trazo = useSharedValue(reducido ? 1 : 0);
  useEffect(() => {
    if (!reducido) trazo.set(withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [reducido, trazo]);
  const m = 6;
  const min = Math.min(desde, meta) - 0.4;
  const max = Math.max(desde, meta) + 0.4;
  const Y = (v: number) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
  const x0 = m;
  const x1 = ancho - m;
  const lineaMeta = Skia.Path.MakeFromSVGString(`M ${x0} ${Y(meta)} L ${x1} ${Y(meta)}`) ?? Skia.Path.Make();
  const plan = Skia.Path.MakeFromSVGString(`M ${x0} ${Y(desde)} L ${x1} ${Y(meta)}`) ?? Skia.Path.Make();
  const destino = useDerivedValue(() => (trazo.get() > 0.98 ? 1 : 0));
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Path path={lineaMeta} style="stroke" strokeWidth={1} color="rgba(239, 230, 207, 0.4)">
        <DashPathEffect intervals={[3, 4]} />
      </Path>
      <Path path={plan} style="stroke" strokeWidth={1.6} strokeCap="round" color="rgba(246, 227, 166, 0.75)" start={0} end={trazo}>
        <DashPathEffect intervals={[2, 4]} />
      </Path>
      <Circle cx={x0} cy={Y(desde)} r={7} color="rgba(246, 227, 166, 0.12)" />
      <Circle cx={x0} cy={Y(desde)} r={4.6} color="rgba(246, 227, 166, 0.22)" />
      <Circle cx={x0} cy={Y(desde)} r={3} color={colores.cifra} />
      <Circle cx={x1} cy={Y(meta)} r={3.4} style="stroke" strokeWidth={1.4} color={colores.oroClaro} opacity={destino} />
    </Canvas>
  );
}
