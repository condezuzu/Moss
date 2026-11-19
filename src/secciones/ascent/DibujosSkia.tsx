// Los dibujos de la sección de Ascent, en Skia, con los trazos de la galería (galeria/src/ascent.js): la marca
// (el ícono de Ascent tal cual), el cuerpo de frente y de espalda con cada músculo en su estado, y la tendencia de
// cada ejercicio en chico. Y el cuerpo de tu rango, el de la app Ascent.

import {
  Atlas, BlurMask, Canvas, Circle, DashPathEffect, Fill, FilterMode, Group, LinearGradient, Mask, MipmapMode, Path, Rect, RadialGradient, Shader, Skia,
  useRSXformBuffer, vec, type SkImage, type SkPath, type SkRuntimeEffect,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { PixelRatio, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  useAnimatedReaction, useDerivedValue, useFrameCallback, useReducedMotion, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { nivelEn, SEMANAS_DE_LA_TENDENCIA, type TendenciaDeFuerza } from '@/dominio/progresoCompartido';
import type { Musculo } from '@/dominio/musculos';
import type { cuerpoDeAscent } from '@/dominio/rangoDeAscent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C, useAcento } from './colores';
import { FORMAS, LINEAS, SILUETA, trazoDe, type Lado } from './cuerpo';
import { fuenteDeLaParticula, fuenteDelCuerpo, fuenteDelResplandor, MODO } from './rangos.sksl';
import {
  alcanceDe, configDe, lineal, particulasDeLaGalaxia, particulasDelPolvo, posicionDeParticula, RESPLANDORES_DE_LA_GALAXIA, uniformsDelCuerpo,
  type Geometria,
} from './rangosDeAscent';

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
/** Cuánto entrenaste el músculo en la semana (spec/musculos-compartido.md, 2.1); sin entrenar, no está. */
export type EstadoDibujado = 'poco' | 'enSuPunto' | 'mucho';
export type PropsDelCuerpo = {
  ancho: number;
  /** El estado de cada músculo; los que no están, sin entrenar. */
  clases: Partial<Record<Musculo, EstadoDibujado>>;
  /** Los que todavía se recuperan: un borde punteado en terracota, encima del color. */
  fatigados?: readonly Musculo[];
  /** Solo un lado (la figura de 100 de ancho); sin él, de frente y de espalda juntos. */
  lado?: Lado;
  elegido?: Musculo | null;
  /** «De frente» y «De espalda» debajo. */
  rotulos?: boolean;
  /** Sin vincular: todo apagado. */
  apagado?: boolean;
  alTocar?: (m: Musculo) => void;
  etiqueta?: string;
};

const ANCHO_DEL_CUERPO = 210;
const ANCHO_DE_UN_LADO = 100;
const ALTO_DEL_CUERPO = 188;
const LADOS: Lado[] = ['frente', 'espalda'];
/** El relleno de cada estado, con el acento de tu rango. */
const relleno = (claro: string): Record<EstadoDibujado | 'nada', [string, number]> => ({
  nada: ['rgba(170, 178, 196, 0.2)', 1], poco: [claro, 0.38], enSuPunto: [claro, 0.92], mucho: [C.ambar, 0.85],
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

export function CuerpoSkia({ ancho, clases, fatigados = [], elegido = null, rotulos = false, apagado = false, alTocar, etiqueta, lado: soloUno }: PropsDelCuerpo) {
  const { formas: f, lineas: l, silueta: s } = trazos();
  const RELLENO = relleno(useAcento().claro);
  const lados = soloUno ? [soloUno] : LADOS;
  const k = ancho / (soloUno ? ANCHO_DE_UN_LADO : ANCHO_DEL_CUERPO);
  const alto = ALTO_DEL_CUERPO * k;
  const tocar = (x: number, y: number) => {
    const vx = x / k, vy = y / k;
    const lado: Lado = soloUno ?? (vx < 105 ? 'frente' : 'espalda');
    let lx = vx - (soloUno || lado === 'frente' ? 0 : 110);
    if (lx > 50) lx = 100 - lx;
    const hit = f[lado].find((x2) => x2.path.contains(lx, vy));
    if (hit && alTocar) alTocar(hit.musculo);
  };
  const figura = (lado: Lado) => {
    const musculos = f[lado].map(({ musculo, path }, i) => {
      const marcado = musculo === elegido;
      const [color, op] = apagado ? ['rgba(170, 178, 196, 0.1)', 1] : RELLENO[elegido && !marcado ? 'nada' : (clases[musculo] ?? 'nada')];
      const fatigado = !apagado && fatigados.includes(musculo);
      return [false, true].map((espejo) => (
        <Group key={`${i}${espejo}`} transform={espejo ? ESPEJO : []}>
          <Path path={path} color={color} opacity={op} />
          <Path path={path} style="stroke" strokeWidth={marcado ? 1.3 : 0.9} color={marcado ? C.tinta : '#07080d'} />
          {fatigado && (
            <Path path={path} style="stroke" strokeWidth={marcado ? 1.1 : 0.8} color={C.lejos}>
              <DashPathEffect intervals={[1.8, 1.2]} />
            </Path>
          )}
        </Group>
      ));
    });
    return (
      <Group key={lado} transform={[{ translateX: soloUno || lado === 'frente' ? 0 : 110 }]}>
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
      <Group transform={[{ scale: k }]}>{lados.map(figura)}</Group>
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
          {lados.map((lado) => (
            <Text key={lado} style={[st.rotulo, { left: soloUno ? ancho / 2 - 50 : ((lado === 'frente' ? 50 : 160) / ANCHO_DEL_CUERPO) * ancho - 50 }]}>{t(`ascent.cuerpo.${lado}`)}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ------------------------------------------------------------ las partes de un músculo, de cerca
export type PropsDeLaParte = {
  musculo: 'pecho' | 'triceps';
  ancho: number;
  alto: number;
  /** Cómo está la parte (pecho alto, cabeza larga) y cómo está el resto. */
  parte: EstadoDibujado | null;
  resto: EstadoDibujado | null;
  etiqueta?: string;
};

/**
 * El músculo solo, de cerca, partido en dos: el pecho alto arriba (un poco más de un tercio) y la cabeza larga del
 * tríceps del lado del cuerpo (la de adentro). Es un dibujo para ubicarse, no una medida de dónde termina cada parte.
 */
export function ParteSkia({ musculo, ancho, alto, parte, resto, etiqueta }: PropsDeLaParte) {
  const { formas: f } = trazos();
  const RELLENO = relleno(useAcento().claro);
  const lado: Lado = musculo === 'pecho' ? 'frente' : 'espalda';
  const paths = f[lado].filter((x) => x.musculo === musculo).map((x) => x.path);
  // El pecho va entero (las dos mitades se tocan); el tríceps, un brazo solo.
  const conEspejo = musculo === 'pecho';
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of paths) {
    const b = p.computeTightBounds();
    x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
  }
  const bx0 = conEspejo ? Math.min(x0, 100 - x1) : x0;
  const bx1 = conEspejo ? Math.max(x1, 100 - x0) : x1;
  const w = bx1 - bx0, h = y1 - y0;
  const k = Math.min(ancho / w, alto / h) * 0.9;
  const dx = (ancho - w * k) / 2 - bx0 * k, dy = (alto - h * k) / 2 - y0 * k;
  const corte = musculo === 'pecho' ? y0 + h * 0.42 : x0 + (x1 - x0) * 0.5;
  const zonaParte = musculo === 'pecho' ? Skia.XYWHRect(-10, y0 - 5, 120, corte - y0 + 5) : Skia.XYWHRect(corte, y0 - 5, x1 - corte + 5, h + 10);
  const zonaResto = musculo === 'pecho' ? Skia.XYWHRect(-10, corte, 120, y1 - corte + 5) : Skia.XYWHRect(x0 - 5, y0 - 5, corte - x0 + 5, h + 10);
  const linea = musculo === 'pecho'
    ? Skia.PathBuilder.Make().moveTo(bx0, corte).lineTo(bx1, corte).detach()
    : Skia.PathBuilder.Make().moveTo(corte, y0).lineTo(corte, y1).detach();
  const dibujar = (clase: EstadoDibujado | null, conBorde: boolean) => paths.flatMap((p, j) => (conEspejo ? [false, true] : [false]).map((espejo) => {
    const [color, op] = RELLENO[clase ?? 'nada'];
    return (
      <Group key={`${j}${espejo}`} transform={espejo ? ESPEJO : []}>
        {conBorde ? <Path path={p} style="stroke" strokeWidth={0.5} color={C.tinta} opacity={0.5} /> : <Path path={p} color={color} opacity={op} />}
      </Group>
    );
  }));
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={etiqueta}>
      <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
        <Group transform={[{ translateX: dx }, { translateY: dy }, { scale: k }]}>
          <Group clip={zonaResto}>{dibujar(resto, false)}</Group>
          <Group clip={zonaParte}>{dibujar(parte, false)}</Group>
          {dibujar(null, true)}
          <Path path={linea} style="stroke" strokeWidth={0.6} color={C.tinta}>
            <DashPathEffect intervals={[1.5, 1.2]} />
          </Path>
        </Group>
      </Canvas>
    </View>
  );
}

// ------------------------------------------------------------ el reloj de la recuperación
export type PropsDelReloj = { tam: number; hecho: number; color: string; etiqueta?: string };

/** Un aro que se llena hasta que el músculo está listo: `hecho` de 0 a 1 (lo que ya pasó de su recuperación). */
export function RelojSkia({ tam, hecho, color, etiqueta }: PropsDelReloj) {
  const r = tam / 2 - 2;
  const arco = Skia.PathBuilder.Make().addArc(Skia.XYWHRect(2, 2, tam - 4, tam - 4), -90, 360 * Math.max(0.04, Math.min(1, hecho))).detach();
  return (
    <View accessible={!!etiqueta} accessibilityRole="image" accessibilityLabel={etiqueta}>
      <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
        <Circle cx={tam / 2} cy={tam / 2} r={r} style="stroke" strokeWidth={2} color="rgba(170, 178, 196, 0.22)" />
        <Path path={arco} style="stroke" strokeWidth={2.4} strokeCap="round" color={color} />
      </Canvas>
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
// El cuerpo de tu rango de Ascent, de fondo en la sección y asomando arriba de Progreso: el mismo de la app Ascent,
// con sus shaders pasados a SkSL (rangos.sksl.ts) y sus parámetros (rangosDeAscent.ts). El polvo y la galaxia llevan
// además sus partículas y, la galaxia, el resplandor del bulbo.
//
// Lo que cuesta, y cómo se paga poco: el lienzo cubre solo lo que se ve; se dibuja a 2x como mucho (como Ascent: en un
// iPhone de 3x el lienzo es más chico y se agranda); y el reloj del shader avanza solo con la sección a la vista, a
// doce cuadros por segundo, y se para al minuto sin que nada se mueva (su nucleo/quietud.ts). Con Reducir movimiento,
// un cuadro quieto. Cada efecto se compila una vez.

type Rango = ReturnType<typeof cuerpoDeAscent>;

const efectosDelModo = new Map<number, SkRuntimeEffect>();
function efecto(clave: number, fuente: () => string) {
  let ef = efectosDelModo.get(clave);
  if (!ef) {
    ef = Skia.RuntimeEffect.Make(fuente()) ?? undefined;
    if (!ef) throw new Error(`No compiló el cuerpo de Ascent (modo ${clave}).`);
    efectosDelModo.set(clave, ef);
  }
  return ef;
}
const RESPLANDOR = -1;
const PARTICULA = -2;

/** La partícula de Ascent, pintada una vez en una imagen de LADO_PARTICULA. */
const LADO_PARTICULA = 64;
let imagenParticula: SkImage | null = null;
function particula() {
  if (!imagenParticula) {
    const sup = Skia.Surface.Make(LADO_PARTICULA, LADO_PARTICULA);
    if (!sup) return null;
    const pintura = Skia.Paint();
    pintura.setShader(efecto(PARTICULA, fuenteDeLaParticula).makeShader([LADO_PARTICULA]));
    sup.getCanvas().drawRect(Skia.XYWHRect(0, 0, LADO_PARTICULA, LADO_PARTICULA), pintura);
    sup.flush();
    imagenParticula = sup.makeImageSnapshot();
  }
  return imagenParticula;
}

// Los escalones de su nucleo/quietud.ts: doce cuadros por segundo con un margen de 2 ms, y nada al minuto quieto.
const MS_ENTRE_CUADROS = 1000 / 12 - 2;
const ESPERA_QUIETO_MS = 60_000;

/** El tiempo del shader, en segundos: arranca en cualquier punto, como en Ascent, y avanza solo mientras `vivo`. */
function useReloj(activo: boolean, despertar?: SharedValue<number>) {
  const reducido = useReducedMotion();
  const vivo = activo && !reducido;
  const [inicio] = useState(() => Math.random() * 100);
  const reloj = useSharedValue(inicio);
  const ultimoCuadro = useSharedValue(-1);
  const ultimaSenal = useSharedValue(0);
  const senal = useSharedValue(true);
  useAnimatedReaction(
    () => despertar?.get() ?? 0,
    (ahora, antes) => {
      if (antes !== null && ahora !== antes) senal.set(true);
    },
  );
  const cuadros = useFrameCallback(({ timestamp }) => {
    if (senal.get()) {
      senal.set(false);
      ultimaSenal.set(timestamp);
    }
    if (timestamp - ultimaSenal.get() >= ESPERA_QUIETO_MS) return;
    const antes = ultimoCuadro.get();
    const desde = timestamp - antes;
    if (antes >= 0 && desde < MS_ENTRE_CUADROS) return;
    ultimoCuadro.set(timestamp);
    // Lo que estuvo quieto o tapado no adelanta de golpe.
    if (antes >= 0) reloj.set(reloj.get() + Math.min(desde, 250) / 1000);
  }, false);
  useEffect(() => {
    senal.set(true);
    cuadros.setActive(vivo);
  }, [vivo, cuadros, senal]);
  return reloj;
}

/** Cuánto se tapa el cuerpo detrás del texto: el velo de Ascent en sus pantallas con contenido (velosDe, altura «baja»). */
const VELO = 0.4;

export type PropsDelRango = {
  rango: Rango;
  /** Dónde va: geometriaEnLaSeccion o geometriaDelTecho (rangosDeAscent.ts). */
  geometria: Geometria;
  /** Con la sección a la vista: el reloj avanza. Sin esto, un cuadro quieto. */
  activo?: boolean;
  /** Algo que se mueve (el scroll, la sección que baja): despierta al reloj si se había parado. */
  despertar?: SharedValue<number>;
  /** Los puntos de abajo que se desvanecen: el techo termina sin corte. */
  desvanece?: number;
};

/** El cuerpo de tu rango de Ascent, tal cual lo dibuja Ascent. */
export function CuerpoDelRangoSkia({ rango, geometria: g, activo = false, despertar, desvanece = 0 }: PropsDelRango) {
  const cfg = configDe(rango.rango, rango.planeta);
  const reloj = useReloj(activo, despertar);
  const f = Math.min(1, 2 / PixelRatio.get());
  const densidad = f * PixelRatio.get();
  const alcance = alcanceDe(cfg.modo, g.radio);
  const fijos = useMemo(() => {
    const giro = (g.giro * Math.PI) / 180;
    return {
      ...uniformsDelCuerpo(cfg), uCentro: [g.cx, g.cy], uEscala: alcance, uGiro: [Math.cos(giro), Math.sin(giro)],
      uDensidad: densidad, uPixel: 844 / 390 / alcance,
    };
  }, [cfg, g, alcance, densidad]);
  const uniforms = useDerivedValue(() => ({ ...fijos, uTime: reloj.get() }));
  const aditivo = cfg.modo === MODO.nebulosa || cfg.modo === MODO.galaxia;
  const dibujo = (
    <Group transform={[{ scale: f }]}>
      <Fill blendMode={aditivo ? 'plus' : 'srcOver'}>
        <Shader source={efecto(cfg.modo, () => fuenteDelCuerpo(cfg.modo))} uniforms={uniforms} />
      </Fill>
      {cfg.modo === MODO.galaxia &&
        RESPLANDORES_DE_LA_GALAXIA.map((r) => <Resplandor key={r.color} {...r} g={g} alcance={alcance} densidad={densidad} reloj={reloj} />)}
      {aditivo && <Particulas galaxia={cfg.modo === MODO.galaxia} g={g} alcance={alcance} reloj={reloj} />}
    </Group>
  );
  return (
    <View style={{ width: g.ancho, height: g.alto, opacity: 1 - VELO }} pointerEvents="none">
      <Canvas
        style={{ position: 'absolute', width: g.ancho * f, height: g.alto * f, left: (g.ancho * (1 - f)) / 2, top: (g.alto * (1 - f)) / 2, transform: [{ scale: 1 / f }] }}
        pointerEvents="none"
      >
        {desvanece > 0 ? (
          <Mask
            mode="alpha"
            mask={
              <Rect x={0} y={0} width={g.ancho * f} height={g.alto * f}>
                <LinearGradient start={vec(0, (g.alto - desvanece) * f)} end={vec(0, g.alto * f)} colors={['white', 'transparent']} />
              </Rect>
            }
          >
            {dibujo}
          </Mask>
        ) : dibujo}
      </Canvas>
    </View>
  );
}

type PropsDelResplandor = { color: string; escala: number; fuerza: number; g: Geometria; alcance: number; densidad: number; reloj: SharedValue<number> };

/** Uno de los dos resplandores del bulbo de la galaxia. */
function Resplandor({ color, escala, fuerza, g, alcance, densidad, reloj }: PropsDelResplandor) {
  const fijos = useMemo(
    () => ({ uCentro: [g.cx, g.cy], uEscala: escala * alcance, uDensidad: densidad, uColor: lineal(color), uFuerza: fuerza }),
    [g, escala, alcance, densidad, color, fuerza],
  );
  const uniforms = useDerivedValue(() => ({ ...fijos, uTime: reloj.get() }));
  return (
    <Fill blendMode="plus">
      <Shader source={efecto(RESPLANDOR, fuenteDelResplandor)} uniforms={uniforms} />
    </Fill>
  );
}

/** Las partículas del polvo o de la galaxia, que se suman: cada una con su tamaño en puntos y su color. */
function Particulas({ galaxia, g, alcance, reloj }: { galaxia: boolean; g: Geometria; alcance: number; reloj: SharedValue<number> }) {
  const p = useMemo(() => (galaxia ? particulasDeLaGalaxia() : particulasDelPolvo()), [galaxia]);
  const n = p.x.length;
  const sprites = useMemo(() => Array.from({ length: n }, () => Skia.XYWHRect(0, 0, LADO_PARTICULA, LADO_PARTICULA)), [n]);
  const colores = useMemo(() => p.color.map((c) => Float32Array.from(c)), [p]);
  const { x: xs, y: ys, z: zs, tam } = p;
  const { cx, cy } = g;
  const transforms = useRSXformBuffer(n, (val, i) => {
    'worklet';
    const [x, y] = posicionDeParticula(xs[i], ys[i], zs[i], galaxia, reloj.get(), cx, cy, alcance);
    const k = tam[i] / LADO_PARTICULA;
    val.set(k, 0, x - (k * LADO_PARTICULA) / 2, y - (k * LADO_PARTICULA) / 2);
  });
  return (
    <Atlas
      image={particula()}
      sprites={sprites}
      transforms={transforms}
      colors={colores}
      colorBlendMode="modulate"
      blendMode="plus"
      sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.Linear }}
    />
  );
}

/** El techo: el mismo cuerpo, más grande y colgado arriba de Progreso, del que asoma el borde de abajo. Quieto. */
export function TechoDelRangoSkia(props: PropsDelRango) {
  return <CuerpoDelRangoSkia {...props} activo={false} desvanece={110} />;
}


const st = StyleSheet.create({
  rotulos: { height: 14, marginTop: 2 },
  rotulo: { position: 'absolute', width: 100, textAlign: 'center', fontFamily: letras.texto, fontSize: 9, color: C.apagado },
});
