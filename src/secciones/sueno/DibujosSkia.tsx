// Los dibujos de Sueño, los de la galería (galeria/src/sueno.js e inicio.js): el arco de la noche, el anillo
// de la calidad, la curva de tu energía y las líneas chicas de lo que mide el reloj. Cada uno es un solo
// lienzo: en la web cada lienzo es un contexto de WebGL, y el navegador deja pocos. Lo escrito (las horas, el
// centro) va encima, en la vista.

import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Mask, Path, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import type { Noche } from '@/dominio/sueno';
import { angulo, ARCO, CARRILES, estrellasDelArco, GRUESO, horasDelArco, punto, type Escala, type Rango } from './arco';

const COLOR_DE_ETAPA = { despierto: '#efb08c', rem: '#a8e2f0', nucleo: '#6aa2f0', profundo: '#6a5fd6' } as const;
const PISTA = 'rgba(150, 178, 240, 0.09)';

/** Un trazo del arco, de `a0` a `a1` en radianes (de π a 2π, pasando por arriba). */
function trazo(r: number, a0: number, a1: number): SkPath {
  const b = Skia.PathBuilder.Make();
  b.addArc(Skia.XYWHRect(ARCO.cx - r, ARCO.cy - r, 2 * r, 2 * r), (a0 * 180) / Math.PI, ((a1 - a0) * 180) / Math.PI);
  return b.detach();
}

/** El color de lo dormido según la hora, de la noche a la mañana: de izquierda a derecha. */
const PARADAS: [number, [number, number, number]][] = [[0, [0x5a, 0x5f, 0xd0]], [0.5, [0x6b, 0x8f, 0xf0]], [1, [0xa8, 0xe2, 0xf0]]];
function colorEn(x: number, alfa = 1): string {
  const f = Math.min(1, Math.max(0, (x - (ARCO.cx - GRUESO.r)) / (2 * GRUESO.r)));
  const [p, q] = f < 0.5 ? [PARADAS[0], PARADAS[1]] : [PARADAS[1], PARADAS[2]];
  const k = (f - p[0]) / (q[0] - p[0]);
  const c = p[1].map((v, i) => Math.round(v + (q[1][i] - v) * k));
  return `rgba(${c.join(', ')}, ${alfa})`;
}

/** Lo que se dibuja de a poco al aparecer: de 0 a 1 con la curva de la galería, o entero sin animar. */
function useRevela(animar: boolean, ms: number, demora = 0): SharedValue<number> {
  const p = useSharedValue(animar ? 0 : 1);
  useEffect(() => {
    if (animar) p.set(withDelay(demora, withTiming(1, { duration: ms, easing: Easing.bezier(0.3, 0.7, 0.2, 1) })));
  }, [animar, ms, demora, p]);
  return p;
}

export type PropsDelArco = {
  ancho: number;
  /** Sin noche, el arco punteado. */
  noche: Noche | null;
  escala: Escala | null;
  rango?: Rango | null;
  /** El tramo que se está leyendo (los demás se apagan), o -1. */
  leido: number;
  animar: boolean;
};

export function ArcoSkia({ ancho, noche, escala, rango, leido, animar }: PropsDelArco) {
  const s = ancho / ARCO.ancho;
  const revela = useRevela(animar && !!noche, 1200);
  const fijo = useMemo(() => {
    const r0 = 104;
    const cielo = Skia.PathBuilder.Make();
    cielo.moveTo(ARCO.cx - r0, ARCO.cy);
    cielo.addArc(Skia.XYWHRect(ARCO.cx - r0, ARCO.cy - r0, 2 * r0, 2 * r0), 180, 180);
    cielo.close();
    return { r0, cielo: cielo.detach(), estrellas: estrellasDelArco(), medio: trazo(126, Math.PI, 2 * Math.PI) };
  }, []);
  const dibujo = useMemo(() => {
    if (!noche || !escala) return null;
    const ang = (m: number) => angulo(escala, m);
    const marcas = Skia.PathBuilder.Make();
    for (const h of horasDelArco(escala)) {
      const a = punto(145.5, h.a);
      const b = punto(h.larga ? 149.5 : 147.5, h.a);
      marcas.moveTo(a.x, a.y).lineTo(b.x, b.y);
    }
    const deTramo = (t: Noche['tramos'][number], r: number, w: number) => {
      // Con el borde redondo ocupando lo justo: lo corto queda como un punto.
      const borde = (w / 2 + 0.6) / r;
      const a0 = ang(t.desde) + borde;
      const a1 = ang(t.hasta) - borde;
      return a1 > a0 ? trazo(r, a0, a1) : trazo(r, (a0 + a1) / 2, (a0 + a1) / 2 + 0.001);
    };
    if (noche.conEtapas) {
      return {
        marcas: marcas.detach(),
        pistas: (Object.keys(CARRILES) as (keyof typeof CARRILES)[]).map((c) => ({ ...CARRILES[c], path: trazo(CARRILES[c].r, Math.PI, 2 * Math.PI) })),
        tramos: noche.tramos.map((t, i) => {
          const cual = t.etapa === 'dormido' ? 'nucleo' : t.etapa;
          const { r, w } = CARRILES[cual];
          return { i, w, color: COLOR_DE_ETAPA[cual], path: deTramo(t, r, w) };
        }),
        grueso: null,
      };
    }
    // Sin etapas: lo dormido en un solo trazo ancho, con los bordes esfumados del ancho de la duda si hay un rango.
    const borde = rango ? 0 : (GRUESO.w / 2 + 0.6) / GRUESO.r;
    const a = (rango ? ang(rango.dormirse[1]) : ang(noche.dormirse)) + borde;
    const b = (rango ? ang(rango.despertar[0]) : ang(noche.despertar)) - borde;
    const esfumados = rango
      ? ([[ang(rango.dormirse[0]), a + 0.008, 0, 1], [b - 0.008, ang(rango.despertar[1]), 1, 0]] as const).filter(([x0, x1]) => x1 > x0).map(([x0, x1, de, hasta]) => {
          const p0 = punto(GRUESO.r, x0);
          const p1 = punto(GRUESO.r, x1);
          return { path: trazo(GRUESO.r, x0, x1), p0, p1, colores: [colorEn(p0.x, de), colorEn(p1.x, hasta)] };
        })
      : [];
    return {
      marcas: marcas.detach(),
      pistas: [{ ...GRUESO, path: trazo(GRUESO.r, Math.PI, 2 * Math.PI) }],
      tramos: noche.tramos.filter((t) => t.etapa === 'despierto').map((t) => ({ i: noche.tramos.indexOf(t), w: CARRILES.despierto.w, color: COLOR_DE_ETAPA.despierto, path: deTramo(t, CARRILES.despierto.r, CARRILES.despierto.w) })),
      grueso: { path: trazo(GRUESO.r, a, Math.max(a + 0.001, b)), redondo: !rango, esfumados },
    };
  }, [noche, escala, rango]);
  return (
    <Canvas style={{ width: ancho, height: ARCO.alto * s }} pointerEvents="none">
      <Group transform={[{ scale: s }]}>
        <Path path={fijo.cielo}>
          <LinearGradient start={vec(ARCO.cx - fijo.r0, 0)} end={vec(ARCO.cx + fijo.r0, 0)} colors={['rgba(106, 95, 214, 0.26)', 'rgba(107, 143, 240, 0.14)', 'rgba(168, 226, 240, 0.22)']} positions={[0, 0.55, 1]} />
        </Path>
        {fijo.estrellas.map((e, i) => <Circle key={i} cx={e.x} cy={e.y} r={e.r} color="#dfe8ff" opacity={e.a} />)}
        <Line p1={vec(4, ARCO.cy + 1)} p2={vec(ARCO.ancho - 4, ARCO.cy + 1)} color="rgba(150, 178, 240, 0.3)" strokeWidth={1} />
        {!dibujo ? (
          <Path path={fijo.medio} style="stroke" strokeWidth={2} strokeCap="round" color="rgba(196, 212, 246, 0.5)">
            <DashPathEffect intervals={[1, 7]} />
          </Path>
        ) : (
          <>
            <Path path={dibujo.marcas} style="stroke" strokeWidth={1} color="rgba(196, 212, 246, 0.42)" />
            {dibujo.pistas.map((p, i) => <Path key={i} path={p.path} style="stroke" strokeWidth={p.w} color={PISTA} />)}
            <Mask mode="alpha" mask={<Path path={fijo.medio} style="stroke" strokeWidth={64} color="white" end={revela} />}>
              {dibujo.grueso && (
                <>
                  {dibujo.grueso.esfumados.map((x, i) => (
                    <Path key={i} path={x.path} style="stroke" strokeWidth={GRUESO.w}>
                      <LinearGradient start={vec(x.p0.x, x.p0.y)} end={vec(x.p1.x, x.p1.y)} colors={x.colores} />
                    </Path>
                  ))}
                  <Path path={dibujo.grueso.path} style="stroke" strokeWidth={GRUESO.w} strokeCap={dibujo.grueso.redondo ? 'round' : 'butt'}>
                    <LinearGradient start={vec(ARCO.cx - GRUESO.r, 0)} end={vec(ARCO.cx + GRUESO.r, 0)} colors={[colorEn(ARCO.cx - GRUESO.r), colorEn(ARCO.cx), colorEn(ARCO.cx + GRUESO.r)]} />
                  </Path>
                </>
              )}
              {dibujo.tramos.map((t) => (
                <Path key={t.i} path={t.path} style="stroke" strokeWidth={t.w} strokeCap="round" color={t.color} opacity={leido >= 0 && leido !== t.i ? 0.32 : 1} />
              ))}
            </Mask>
          </>
        )}
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ el anillo de la calidad
/** Una parte del anillo, en vueltas: dónde empieza su lugar, cuánto ocupa y qué parte de eso sumó. */
export type ParteDelAnillo = { color: string; desde: number; largo: number; lleno: number };
export type PropsDelAnillo = { tam: number; partes: ParteDelAnillo[] | null; animar: boolean };

const R_DEL_ANILLO = 44;
const arcoDelAnillo = (desde: number, largo: number) => {
  const b = Skia.PathBuilder.Make();
  b.addArc(Skia.XYWHRect(54 - R_DEL_ANILLO, 54 - R_DEL_ANILLO, 2 * R_DEL_ANILLO, 2 * R_DEL_ANILLO), -90 + desde * 360, Math.max(0.01, largo * 360));
  return b.detach();
};

function Llenado({ parte, p }: { parte: ParteDelAnillo; p: SharedValue<number> }) {
  const path = useMemo(() => arcoDelAnillo(parte.desde, parte.largo), [parte.desde, parte.largo]);
  const fin = useDerivedValue(() => p.get() * parte.lleno);
  return <Path path={path} style="stroke" strokeWidth={9} color={parte.color} end={fin} />;
}

export function AnilloSkia({ tam, partes, animar }: PropsDelAnillo) {
  const p = useRevela(animar, 1000);
  const vuelta = useMemo(() => arcoDelAnillo(0, 1), []);
  return (
    <Canvas style={{ width: tam, height: tam }} pointerEvents="none">
      <Group transform={[{ scale: tam / 108 }]}>
        {!partes ? (
          <Path path={vuelta} style="stroke" strokeWidth={2} strokeCap="round" color="rgba(196, 212, 246, 0.5)">
            <DashPathEffect intervals={[2, 6]} />
          </Path>
        ) : (
          partes.map((x) => (
            <Group key={x.color}>
              <Path path={arcoDelAnillo(x.desde, x.largo)} style="stroke" strokeWidth={9} color="rgba(150, 178, 240, 0.16)" />
              <Llenado parte={x} p={p} />
            </Group>
          ))
        )}
      </Group>
    </Canvas>
  );
}

// ------------------------------------------------------------ la curva de tu energía
export type PropsDeLaCurva = { ancho: number; alto: number; base: number; puntos: { x: number; y: number }[]; rgb: string; alfa: number; animar: boolean };

/** La curva del día con su área, que se dibuja de izquierda a derecha al aparecer. */
export function CurvaSkia({ ancho, alto, base, puntos, rgb, alfa, animar }: PropsDeLaCurva) {
  const fin = useRevela(animar, 1100, 150);
  const { linea, area } = useMemo(() => {
    const l = Skia.PathBuilder.Make();
    const a = Skia.PathBuilder.Make();
    puntos.forEach((q, i) => {
      if (i) l.lineTo(q.x, q.y);
      else l.moveTo(q.x, q.y);
      if (i) a.lineTo(q.x, q.y);
      else a.moveTo(q.x, q.y);
    });
    a.lineTo(ancho, base).lineTo(0, base).close();
    return { linea: l.detach(), area: a.detach() };
  }, [puntos, ancho, base]);
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Path path={area} color={`rgba(${rgb}, ${(alfa * 0.14).toFixed(3)})`} />
      <Path path={linea} style="stroke" strokeWidth={1.6} strokeJoin="round" color={`rgba(${rgb}, ${(alfa * 0.85).toFixed(3)})`} end={fin} />
    </Canvas>
  );
}

// ------------------------------------------------------------ las líneas de lo que mide el reloj
export type Chispa = { valores: (number | null)[]; usual: number | null; rangoMinimo: number };
export type PropsDeLasChispas = { ancho: number; altoDeFila: number; filas: Chispa[] };

/** Las dos semanas de cada valor en una línea chiquita, una por fila; sin datos, un hueco. La raya es lo tuyo. */
export function ChispasSkia({ ancho, altoDeFila, filas }: PropsDeLasChispas) {
  const H = 26;
  const m = 3.5;
  const dibujo = useMemo(() => filas.map((f, k) => {
    const y0 = k * altoDeFila + (altoDeFila - H) / 2;
    const hay = f.valores.map((v, i) => [v, i] as const).filter((x): x is readonly [number, number] => x[0] != null);
    if (!hay.length) return null;
    const todos = hay.map(([v]) => v).concat(f.usual != null ? [f.usual] : []);
    // Con un rango mínimo: que un latido de diferencia no parezca un salto.
    const medio = (Math.min(...todos) + Math.max(...todos)) / 2;
    const rango = Math.max(f.rangoMinimo, Math.max(...todos) - Math.min(...todos));
    const min = medio - rango / 2;
    const X = (i: number) => m + (i / Math.max(1, f.valores.length - 1)) * (ancho - 2 * m);
    const Y = (v: number) => y0 + m + (1 - (v - min) / rango) * (H - 2 * m);
    const linea = Skia.PathBuilder.Make();
    f.valores.forEach((v, i) => {
      if (v == null) return;
      if (i && f.valores[i - 1] != null) linea.lineTo(X(i), Y(v));
      else linea.moveTo(X(i), Y(v));
    });
    const [ultimo, iUlt] = hay[hay.length - 1];
    return {
      linea: linea.detach(),
      base: f.usual != null ? Y(f.usual) : null,
      sueltos: hay.slice(0, -1).filter(([, i]) => f.valores[i - 1] == null && f.valores[i + 1] == null).map(([v, i]) => ({ x: X(i), y: Y(v) })),
      fin: { x: X(iUlt), y: Y(ultimo) },
    };
  }), [filas, ancho, altoDeFila]);
  return (
    <Canvas style={{ width: ancho, height: altoDeFila * filas.length }} pointerEvents="none">
      {dibujo.map((d, k) => d && (
        <Group key={k}>
          {d.base !== null && <Line p1={vec(m, d.base)} p2={vec(ancho - m, d.base)} color="rgba(196, 212, 246, 0.3)" strokeWidth={1} />}
          <Path path={d.linea} style="stroke" strokeWidth={1.6} strokeCap="round" strokeJoin="round" color="#9cc0f8" />
          {d.sueltos.map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={1.4} color="#9cc0f8" />)}
          <Circle cx={d.fin.x} cy={d.fin.y} r={2.6} color="#fbf2d9" />
        </Group>
      ))}
    </Canvas>
  );
}
