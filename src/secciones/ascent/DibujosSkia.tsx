// Los dibujos de la sección de Ascent, en Skia, con los trazos de la galería (galeria/src/ascent.js): la marca
// (el ícono de Ascent tal cual), el cuerpo de frente y de espalda con cada músculo en su estado, y la tendencia de
// cada ejercicio en chico.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { nivelEn, SEMANAS_DE_LA_TENDENCIA, type TendenciaDeFuerza } from '@/dominio/rendimiento';
import type { Musculo } from '@/dominio/musculos';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C } from './colores';
import { FORMAS, LINEAS, SILUETA, trazoDe, type Lado } from './cuerpo';

// ------------------------------------------------------------ la marca
// El ícono de Ascent (movil/assets/icon.png de su repo), medido: la órbita es 1,5 veces el planeta y abierta a la
// izquierda; el punto blanco va arriba a la derecha. Sin vincular, apagada; al vincular, se enciende.
const ORBITA = 'M -14.5 -34.6 A 37.5 37.5 0 1 1 -32.5 18.75';

export type PropsDeMarca = { tam: number; unida?: boolean };

export function MarcaSkia({ tam, unida = false }: PropsDeMarca) {
  const orbita = useMemo(() => Skia.Path.MakeFromSVGString(ORBITA), []);
  const reducido = useReducedMotion();
  const u = useSharedValue(unida ? 1 : 0);
  useEffect(() => {
    u.set(withTiming(unida ? 1 : 0, { duration: reducido ? 0 : 900 }));
  }, [unida, reducido, u]);
  const opOrbita = useDerivedValue(() => 0.6 + 0.4 * u.get());
  const opLuna = useDerivedValue(() => 0.72 + 0.28 * u.get());
  const halo = useDerivedValue(() => u.get());
  const borde = ['rgba(227, 233, 245, 0.8)', 'rgba(227, 233, 245, 0.14)', 'rgba(227, 233, 245, 0)'];
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ translateX: tam / 2 }, { translateY: tam / 2 }, { scale: tam / 132 }]}>
        <Circle cx={0} cy={0} r={25.6} style="stroke" strokeWidth={3}>
          <LinearGradient start={vec(-19.4, -21.5)} end={vec(16.4, 20.5)} colors={borde} positions={[0, 0.45, 1]} />
          <BlurMask blur={1.8} style="normal" />
        </Circle>
        <Circle cx={0} cy={0} r={25}>
          <RadialGradient c={vec(6, 8)} r={39} colors={['#0b0d12', '#161a23', '#363d4c', '#9aa3b7']} positions={[0, 0.55, 0.83, 1]} />
        </Circle>
        <Circle cx={0} cy={0} r={24.6} style="stroke" strokeWidth={0.9}>
          <LinearGradient start={vec(-18.7, -20.7)} end={vec(15.7, 19.7)} colors={borde} positions={[0, 0.45, 1]} />
        </Circle>
        {orbita && (
          <Path path={orbita} style="stroke" strokeWidth={2.2} strokeCap="round" opacity={opOrbita}>
            <LinearGradient start={vec(30, -32)} end={vec(-30, 34)} colors={['#e6e9ee', '#868c97']} />
          </Path>
        )}
        <Group transform={[{ translateX: 28.8 }, { translateY: -24 }]}>
          <Circle cx={0} cy={0} r={8.5} color="rgba(255, 255, 255, 0.22)" opacity={halo}>
            <BlurMask blur={2.6} style="normal" />
          </Circle>
          <Circle cx={0} cy={0} r={4.7} opacity={opLuna}>
            <RadialGradient c={vec(-1.32, -1.69)} r={7.52} colors={['#ffffff', '#eef0f4', '#aeb4be']} positions={[0, 0.55, 1]} />
          </Circle>
        </Group>
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ el cuerpo
export type EstadoDibujado = 'recuperandose' | 'cargado' | 'trabajado';
export type PropsDelCuerpo = {
  ancho: number;
  /** El estado de cada músculo; los que no están, descansados. */
  clases: Partial<Record<Musculo, EstadoDibujado>>;
  elegido?: Musculo | null;
  /** «De frente» y «De espalda» debajo. */
  rotulos?: boolean;
  /** Sin vincular: todo apagado. */
  apagado?: boolean;
  alTocar?: (m: Musculo) => void;
  etiqueta?: string;
};

const ANCHO_DEL_CUERPO = 210;
const ALTO_DEL_CUERPO = 188;
const LADOS: Lado[] = ['frente', 'espalda'];
const RELLENO: Record<EstadoDibujado | 'nada', [string, number]> = {
  nada: ['rgba(170, 178, 196, 0.2)', 1], recuperandose: [C.claro, 0.6], cargado: [C.lejos, 1], trabajado: [C.claro, 0.85],
};

type FormaDelCuerpo = { musculo: Musculo; path: SkPath };
let formas: Record<Lado, FormaDelCuerpo[]> | null = null;
let lineas: Record<Lado, SkPath[]> | null = null;
let silueta: SkPath | null = null;
/** Los trazos se arman una sola vez. */
function trazos() {
  if (!formas || !lineas || !silueta) {
    const p = (d: string) => Skia.Path.MakeFromSVGString(d)!;
    formas = { frente: [], espalda: [] };
    lineas = { frente: LINEAS.frente.map(p), espalda: LINEAS.espalda.map(p) };
    for (const lado of LADOS) {
      for (const [m, xs] of Object.entries(FORMAS[lado])) for (const x of xs ?? []) formas[lado].push({ musculo: m as Musculo, path: p(trazoDe(x)) });
    }
    silueta = Skia.PathBuilder.Make().addPath(p(SILUETA)).addOval(Skia.XYWHRect(50 - 7.6, 13.8 - 9.2, 15.2, 18.4)).detach();
  }
  return { formas, lineas, silueta };
}

const ESPEJO = [{ translateX: 100 }, { scaleX: -1 }];

export function CuerpoSkia({ ancho, clases, elegido = null, rotulos = false, apagado = false, alTocar, etiqueta }: PropsDelCuerpo) {
  const { formas: f, lineas: l, silueta: s } = trazos();
  const k = ancho / ANCHO_DEL_CUERPO;
  const alto = ALTO_DEL_CUERPO * k;
  const tocar = (x: number, y: number) => {
    const vx = x / k, vy = y / k;
    const lado: Lado = vx < 105 ? 'frente' : 'espalda';
    let lx = vx - (lado === 'frente' ? 0 : 110);
    if (lx > 50) lx = 100 - lx;
    const hit = f[lado].find((x2) => x2.path.contains(lx, vy));
    if (hit && alTocar) alTocar(hit.musculo);
  };
  const figura = (lado: Lado) => {
    const musculos = f[lado].map(({ musculo, path }, i) => {
      const [color, op] = apagado ? ['rgba(170, 178, 196, 0.1)', 1] : RELLENO[clases[musculo] ?? 'nada'];
      const marcado = musculo === elegido;
      return [false, true].map((espejo) => (
        <Group key={`${i}${espejo}`} transform={espejo ? ESPEJO : []}>
          <Path path={path} color={color} opacity={op} />
          <Path path={path} style="stroke" strokeWidth={marcado ? 1.3 : 0.9} color={marcado ? C.tinta : '#07080d'} />
        </Group>
      ));
    });
    return (
      <Group key={lado} transform={[{ translateX: lado === 'frente' ? 0 : 110 }]}>
        <Path path={s} color="rgba(170, 178, 196, 0.1)" />
        {musculos}
        {l[lado].map((p, i) => [false, true].map((espejo) => (
          <Group key={`l${i}${espejo}`} transform={espejo ? ESPEJO : []}>
            <Path path={p} style="stroke" strokeWidth={0.7} strokeCap="round" color="#07080d" />
          </Group>
        )))}
      </Group>
    );
  };
  const lienzo = (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Group transform={[{ scale: k }]}>{LADOS.map(figura)}</Group>
    </Canvas>
  );
  return (
    <View accessible={!alTocar} accessibilityRole="image" accessibilityLabel={etiqueta}>
      {alTocar ? (
        <Pressable onPress={(ev) => tocar(ev.nativeEvent.locationX, ev.nativeEvent.locationY)} accessibilityLabel={etiqueta} accessibilityRole="image">
          {lienzo}
        </Pressable>
      ) : lienzo}
      {rotulos && (
        <View style={[st.rotulos, { width: ancho }]}>
          {LADOS.map((lado) => (
            <Text key={lado} style={[st.rotulo, { left: ((lado === 'frente' ? 50 : 160) / ANCHO_DEL_CUERPO) * ancho - 50 }]}>{t(`ascent.cuerpo.${lado}`)}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------ la tendencia de un ejercicio
export type PropsDeChispa = { t: TendenciaDeFuerza | null; puntos: { t: number; e1rm: number }[]; ancho: number; alto: number };

/** La tendencia en un dibujo chico: el rango de la recta, la recta y cada sesión en un punto. */
export function TendenciaSkia({ t: x, puntos, ancho: W, alto: H }: PropsDeChispa) {
  const M = 4;
  const desde = -SEMANAS_DE_LA_TENDENCIA, hasta = 0;
  const enVentana = puntos.filter((p) => p.t > desde && p.t <= hasta);
  const dibujo = useMemo(() => {
    if (!x || !enVentana.length) return null;
    const ajuste = x.ajuste;
    const primero = Math.min(...enVentana.map((p) => p.t));
    const banda = ajuste ? Array.from({ length: 13 }, (_, i) => desde + (i * (hasta - desde)) / 12).filter((v) => v >= primero).map((v) => [v, nivelEn(ajuste, v)] as const) : [];
    const valores = [...enVentana.map((p) => p.e1rm), ...banda.flatMap(([, b]) => [b.abajo, b.arriba])];
    const lo = Math.min(...valores), hi = Math.max(...valores);
    const pad = (hi - lo) * 0.12 || 1;
    const X = (v: number) => M + ((v - desde) / (hasta - desde)) * (W - 2 * M);
    const Y = (v: number) => H - M - ((v - (lo - pad)) / (hi - lo + 2 * pad)) * (H - 2 * M);
    let bandaPath: SkPath | null = null;
    let recta: SkPath | null = null;
    if (banda.length > 1) {
      const b1 = Skia.PathBuilder.Make();
      banda.forEach(([v, b], i) => (i ? b1.lineTo(X(v), Y(b.arriba)) : b1.moveTo(X(v), Y(b.arriba))));
      [...banda].reverse().forEach(([v, b]) => b1.lineTo(X(v), Y(b.abajo)));
      bandaPath = b1.close().detach();
      const b2 = Skia.PathBuilder.Make();
      banda.forEach(([v, b], i) => (i ? b2.lineTo(X(v), Y(b.nivel)) : b2.moveTo(X(v), Y(b.nivel))));
      recta = b2.detach();
    }
    return { bandaPath, recta, puntos: enVentana.map((p) => [X(p.t), Y(p.e1rm)] as const) };
  }, [x, enVentana, W, H, desde]);
  const vacia = useMemo(() => Skia.PathBuilder.Make().moveTo(M, H / 2).lineTo(W - M, H / 2).detach(), [W, H]);
  const noSeSabe = x?.estado === 'noSeSabe';
  return (
    <Canvas style={{ width: W, height: H }} pointerEvents="none">
      {!dibujo ? (
        <Path path={vacia} style="stroke" strokeWidth={1} color={C.lineaFuerte}>
          <DashPathEffect intervals={[2, 3]} />
        </Path>
      ) : (
        <>
          {dibujo.bandaPath && <Path path={dibujo.bandaPath} color={C.claro} opacity={0.16} />}
          {dibujo.recta && (
            <Path path={dibujo.recta} style="stroke" strokeWidth={1.6} strokeCap="round" color={noSeSabe ? C.apagado : C.claro}>
              {noSeSabe && <DashPathEffect intervals={[2, 3]} />}
            </Path>
          )}
          {dibujo.puntos.map(([cx, cy], i) => <Circle key={i} cx={cx} cy={cy} r={1.9} color={C.tinta} />)}
        </>
      )}
    </Canvas>
  );
}

const st = StyleSheet.create({
  rotulos: { height: 14, marginTop: 2 },
  rotulo: { position: 'absolute', width: 100, textAlign: 'center', fontFamily: letras.texto, fontSize: 9, color: C.apagado },
});
