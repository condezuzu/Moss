// Los dibujos de la sección de Ascent, en Skia, con los trazos de la galería (galeria/src/ascent.js): la marca
// (el ícono de Ascent tal cual), el cuerpo de frente y de espalda con cada músculo en su estado, y la tendencia de
// cada ejercicio en chico.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, LinearGradient, Path, RadialGradient, Skia, SweepGradient, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { nivelEn, SEMANAS_DE_LA_TENDENCIA, type TendenciaDeFuerza } from '@/dominio/rendimiento';
import type { Musculo } from '@/dominio/musculos';
import type { cuerpoDeAscent } from '@/dominio/rangoDeAscent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C, useAcento } from './colores';
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
/** El relleno de cada estado, con el acento de tu rango. */
const relleno = (claro: string): Record<EstadoDibujado | 'nada', [string, number]> => ({
  nada: ['rgba(170, 178, 196, 0.2)', 1], recuperandose: [claro, 0.6], cargado: [C.lejos, 1], trabajado: [claro, 0.85],
});

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
  const RELLENO = relleno(useAcento().claro);
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
  const { claro } = useAcento();
  return (
    <Canvas style={{ width: W, height: H }} pointerEvents="none">
      {!dibujo ? (
        <Path path={vacia} style="stroke" strokeWidth={1} color={C.lineaFuerte}>
          <DashPathEffect intervals={[2, 3]} />
        </Path>
      ) : (
        <>
          {dibujo.bandaPath && <Path path={dibujo.bandaPath} color={claro} opacity={0.16} />}
          {dibujo.recta && (
            <Path path={dibujo.recta} style="stroke" strokeWidth={1.6} strokeCap="round" color={noSeSabe ? C.apagado : claro}>
              {noSeSabe && <DashPathEffect intervals={[2, 3]} />}
            </Path>
          )}
          {dibujo.puntos.map(([cx, cy], i) => <Circle key={i} cx={cx} cy={cy} r={1.9} color={C.tinta} />)}
        </>
      )}
    </Canvas>
  );
}

// ------------------------------------------------------------ el cuerpo de tu rango
// Desde el rango 2, el cuerpo de tu rango de fondo en la sección (el polvo del 1 es Polvo.tsx), como la galería
// (cuerpoDelHorizonte en galeria/src/ascent.js, .as-cielo): la parte de arriba de un círculo de 1.180 con sus
// detalles, en 360, girado para que su luz mire a la pantalla y tenue (el sol, más). Arriba de Progreso asoma su
// borde (TechoDelRangoSkia). Los colores son los de Ascent (src/dominio/rangoDeAscent.ts), simplificados.

type Rango = ReturnType<typeof cuerpoDeAscent>;
const LADO = 1180;
const MEDIO = LADO / 2;
const limbo = (x: number) => MEDIO - Math.sqrt(Math.max(0, MEDIO * MEDIO - (x - MEDIO) * (x - MEDIO)));
/** Un azar con semilla: el mismo dibujo cada vez, como en la galería. */
const azar = (semilla: number) => () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let x = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
};
/** `n` puntos en la parte que se ve, más juntos cerca del borde si `pegados`. */
function puntos(n: number, semilla: number, pegados = 1.6) {
  const r = azar(semilla);
  return Array.from({ length: n }, () => {
    const x = 300 + r() * 460;
    const y = limbo(x) + 4 + Math.pow(r(), pegados) * 250;
    return { x, y, a: r(), b: r() };
  });
}
const canales = (hex: string) => [16, 8, 0].map((k) => (parseInt(hex.slice(1), 16) >> k) & 255);
const hexDe = (c: number[]) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
/** Un color mezclado con otro: `f` es cuánto del otro. */
const mezcla = (hex: string, otro: string, f: number) => {
  const a = canales(hex), b = canales(otro);
  return hexDe(a.map((v, i) => v * (1 - f) + b[i] * f));
};
const conAlfa = (hex: string, alfa: number) => `rgba(${canales(hex).join(', ')}, ${alfa})`;
/** El borde: más claro que el color del rango; en el agujero negro, el naranja del disco. */
const bordeDe = (r: Rango) => (r.cuerpo === 'agujeroNegro' ? r.paleta.principal : mezcla(r.paleta.claro, '#ffffff', 0.35));

type Trazo = { path: SkPath; color: string; opacity?: number; ancho?: number };
const svg = (d: string) => Skia.Path.MakeFromSVGString(d)!;
const elipse = (cx: number, cy: number, rx: number, ry: number) => Skia.PathBuilder.Make().addOval(Skia.XYWHRect(cx - rx, cy - ry, 2 * rx, 2 * ry)).detach();
const circulo = (cx: number, cy: number, r: number) => Skia.PathBuilder.Make().addCircle(cx, cy, r).detach();
/** Cráteres: elipses más chatas cuanto más cerca del borde, con la sombra de un lado y la luz del otro. */
const crateres = (n: number, semilla: number, tam = 1): Trazo[] => puntos(n, semilla, 1.2).flatMap(({ x, y, a, b }) => {
  const rx = (6 + a * 22) * tam;
  const ry = rx * (0.28 + Math.min(1, (y - limbo(x)) / 260) * 0.55);
  return [
    { path: elipse(x, y, rx, ry), color: `rgba(0, 0, 0, ${(0.16 + b * 0.18).toFixed(2)})` },
    { path: svg(`M ${x - rx} ${y} A ${rx} ${ry} 0 0 0 ${x + rx} ${y}`), color: `rgba(255, 255, 255, ${(0.08 + b * 0.1).toFixed(2)})`, ancho: 1.2 },
  ];
});
const PLANETAS_DEL_HORIZONTE: Record<string, { colores: string[]; crateres: number; extra?: () => Trazo[] }> = {
  Ceres: { colores: ['#b8c0cc', '#7a828e', '#3c4048', '#0d0e12'], crateres: 26, extra: () => [{ path: elipse(575, 38, 7, 2.6), color: '#ffffff', opacity: 0.9 }, { path: elipse(596, 44, 3.5, 1.4), color: '#ffffff', opacity: 0.75 }] },
  Mercurio: { colores: ['#b5ada4', '#7e766e', '#3a3532', '#0d0c0b'], crateres: 44 },
  Marte: {
    colores: ['#f0925c', '#d9531e', '#8a2e10', '#2a0e05'], crateres: 10,
    extra: () => [{ path: elipse(600, 12, 70, 9), color: '#fff4ea', opacity: 0.75 }, { path: elipse(470, 120, 90, 26), color: '#6a2410', opacity: 0.4 }, { path: elipse(690, 96, 70, 18), color: '#6a2410', opacity: 0.35 }],
  },
  Venus: { colores: ['#f0e4c2', '#c9b278', '#8a7a4a', '#2a2416'], crateres: 0, extra: () => [40, 85, 135, 190].map((y, i) => ({ path: elipse(560 + i * 18, y, 420, 10 + i * 4), color: '#fff7e0', opacity: 0.14 - i * 0.025 })) },
  Saturno: {
    colores: ['#e8dcbe', '#b0a078', '#6e6248', '#1f1b14'], crateres: 0,
    // Las bandas siguen el borde; los anillos cruzan por delante, con la sombra que dejan arriba.
    extra: () => [
      ...[26, 58, 96, 140].map((d, i) => ({ path: circulo(MEDIO, MEDIO, MEDIO - d), color: i % 2 ? '#8f8160' : '#d9cba4', ancho: 12 + i * 4, opacity: 0.28 })),
      { path: svg('M -190 191 A 780 92 0 0 0 1370 191'), color: '#000000', ancho: 16, opacity: 0.28 },
      { path: svg('M -190 205 A 780 92 0 0 0 1370 205'), color: '#e8dcbe', ancho: 11, opacity: 0.55 },
      { path: svg('M -130 205 A 720 80 0 0 0 1310 205'), color: '#cbbd96', ancho: 7, opacity: 0.4 },
    ],
  },
};

type Degrade = { c: [number, number]; r: number; colores: string[]; posiciones: number[] };

/** Lo de adentro del disco, en el espacio de 1.180: el fondo, el degradé de la esfera y los trazos encima. */
function dibujoDelCuerpo(r: Rango): { fondo: string | null; degrade: Degrade; trazos: Trazo[] } {
  const p = r.paleta;
  // Una esfera con la luz en el borde de arriba, hundida hacia el fondo de Ascent para que no le gane al texto.
  const esfera = (colores: string[], oscuro = 0.38): Degrade => ({ c: [MEDIO, 0], r: 0.24 * LADO, colores: colores.map((c) => mezcla(c, '#05060a', oscuro)), posiciones: colores.map((_, i) => i / (colores.length - 1)) });
  if (r.cuerpo === 'galaxia') {
    // Partículas en una banda, con su centro brillante; sin disco.
    return {
      fondo: null,
      degrade: { c: [MEDIO, 0.04 * LADO], r: 0.3 * LADO, colores: ['rgba(233, 220, 255, 0.55)', conAlfa(p.principal, 0.32), conAlfa(p.apagado, 0)], posiciones: [0, 0.4, 1] },
      trazos: puntos(420, 77, 3.2).map(({ x, y, a, b }) => ({ path: circulo(x, y, 0.6 + a * 1.5), color: b < 0.5 ? p.claro : b < 0.8 ? p.principal : '#ffffff', opacity: 0.25 + a * 0.6 })),
    };
  }
  if (r.cuerpo === 'agujeroNegro') {
    // Negro absoluto; el naranja, solo en una línea fina pegada al borde (el disco).
    return { fondo: '#020204', degrade: { c: [MEDIO, MEDIO], r: MEDIO, colores: [conAlfa(p.principal, 0), 'rgba(255, 196, 107, 0.9)', conAlfa(p.principal, 1)], posiciones: [0.965, 0.992, 1] }, trazos: [] };
  }
  if (r.cuerpo === 'sol') {
    return { fondo: '#05060a', degrade: esfera(['#ffffff', p.claro, p.principal, p.apagado, '#b8650f'], 0.12), trazos: puntos(160, 5, 1.1).map(({ x, y, a }) => ({ path: circulo(x, y, 3 + a * 6), color: '#fff6d0', opacity: 0.06 + a * 0.1 })) };
  }
  if (r.cuerpo === 'planeta') {
    const pl = PLANETAS_DEL_HORIZONTE[r.planeta ?? 'Ceres'] ?? PLANETAS_DEL_HORIZONTE.Ceres;
    return { fondo: '#05060a', degrade: esfera(pl.colores), trazos: [...crateres(pl.crateres, 31), ...(pl.extra?.() ?? [])] };
  }
  if (r.cuerpo === 'asteroide') {
    const vetas = puntos(14, 19, 1).map(({ x, y, a }) => ({ path: svg(`M ${x - 40} ${y} L ${x} ${y - 6 - a * 8} L ${x + 46} ${y + 2}`), color: '#e08a3c', ancho: 1.4, opacity: 0.18 + a * 0.2 }));
    return { fondo: '#05060a', degrade: esfera(['#c9762e', '#95491a', '#5c2a10', '#241408']), trazos: [...crateres(30, 7, 1.3), ...vetas] };
  }
  // La luna: gris mineral, mares oscuros y cráteres.
  return {
    fondo: '#05060a',
    degrade: esfera(['#c9ced8', '#949aa5', '#5c6069', '#24262c', '#0b0c10']),
    trazos: [{ path: elipse(455, 96, 120, 30), color: '#3c3f46', opacity: 0.45 }, { path: elipse(672, 70, 80, 18), color: '#3c3f46', opacity: 0.4 }, ...crateres(34, 3)],
  };
}

/** Un anillo de luz en el borde, como el conic-gradient de la galería: `desde` en grados de CSS (0 arriba). */
function Anillo({ c, r, color, paradas, desde }: { c: number; r: number; color: string; paradas: [number, number][]; desde: number }) {
  return (
    <Circle cx={c} cy={c} r={r} style="stroke" strokeWidth={1.5}>
      <SweepGradient c={vec(c, c)} colors={paradas.map(([, a]) => conAlfa(color, a))} positions={paradas.map(([g]) => g / 360)} origin={vec(c, c)} transform={[{ rotate: ((desde - 90) * Math.PI) / 180 }]} />
    </Circle>
  );
}

export type PropsDelRango = { rango: Rango; lado: number; margen: number };

/** El cuerpo de tu rango (del 2 al 7), de fondo: un disco de `lado`, con `margen` alrededor para el resplandor. */
export function CuerpoDelRangoSkia({ rango, lado, margen }: PropsDelRango) {
  const d = useMemo(() => dibujoDelCuerpo(rango), [rango]);
  const borde = bordeDe(rango);
  const R = lado / 2, c = margen + R;
  const disco = useMemo(() => circulo(c, c, R), [c, R]);
  const resplandor: [string, number][] = rango.cuerpo === 'galaxia' ? []
    : rango.cuerpo === 'sol' ? [['rgba(242, 194, 48, 0.42)', 23], ['rgba(239, 159, 39, 0.2)', 60]]
      : rango.cuerpo === 'agujeroNegro' ? [['rgba(167, 139, 250, 0.24)', 18], ['rgba(255, 106, 0, 0.4)', 5]]
        : [[conAlfa(borde, 0.15), 15]];
  return (
    <Canvas style={{ width: 2 * c, height: 2 * c }} pointerEvents="none">
      <Group opacity={rango.cuerpo === 'sol' ? 0.32 : 0.5} transform={[{ rotate: (225 * Math.PI) / 180 }]} origin={vec(c, c)}>
        {resplandor.map(([color, blur], i) => (
          <Circle key={i} cx={c} cy={c} r={R} color={color}>
            <BlurMask blur={blur} style="outer" />
          </Circle>
        ))}
        <Group clip={disco}>
          {d.fondo && <Circle cx={c} cy={c} r={R} color={d.fondo} />}
          <Group transform={[{ translateX: c - R }, { translateY: c - R }, { scale: lado / LADO }]}>
            <Circle cx={MEDIO} cy={MEDIO} r={MEDIO}>
              <RadialGradient c={vec(d.degrade.c[0], d.degrade.c[1])} r={d.degrade.r} colors={d.degrade.colores} positions={d.degrade.posiciones} />
            </Circle>
            {d.trazos.map((x, i) => (
              <Path key={i} path={x.path} color={x.color} opacity={x.opacity ?? 1} style={x.ancho ? 'stroke' : 'fill'} strokeWidth={x.ancho ?? 0} />
            ))}
          </Group>
        </Group>
        <Group opacity={rango.cuerpo === 'galaxia' ? 0.3 : 1}>
          <Anillo c={c} r={R - 0.75} color={borde} desde={-40} paradas={[[0, 0.12], [24, 0.86], [46, 0.34], [70, 0.04], [320, 0], [360, 0.12]]} />
        </Group>
      </Group>
    </Canvas>
  );
}

/** El techo: el círculo que cuelga arriba de Progreso, del que se ve el borde de abajo, encendido. */
export function TechoDelRangoSkia({ rango, lado, margen }: PropsDelRango) {
  const borde = bordeDe(rango);
  const R = lado / 2, c = margen + R;
  return (
    <Canvas style={{ width: 2 * c, height: 2 * c }} pointerEvents="none">
      <Circle cx={c} cy={c + 6} r={R} color={conAlfa(borde, 0.16)}>
        <BlurMask blur={14} style="outer" />
      </Circle>
      <Circle cx={c} cy={c} r={R}>
        <RadialGradient c={vec(c, c + R)} r={Math.hypot(R, 2 * R)} colors={['#161922', '#0b0c12', '#05060a']} positions={[0, 0.3, 0.64]} />
      </Circle>
      <Anillo c={c} r={R - 0.75} color={borde} desde={120} paradas={[[0, 0], [34, 0.45], [58, 0.95], [82, 0.4], [118, 0], [360, 0]]} />
    </Canvas>
  );
}

const st = StyleSheet.create({
  rotulos: { height: 14, marginTop: 2 },
  rotulo: { position: 'absolute', width: 100, textAlign: 'center', fontFamily: letras.texto, fontSize: 9, color: C.apagado },
});
