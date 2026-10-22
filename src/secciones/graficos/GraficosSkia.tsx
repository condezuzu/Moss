// Los gráficos chicos de Inicio, Progreso y Sueño, los de la galería (galeria/src/inicio.js,
// «Graficos»): una línea con su tendencia, el balance de la semana, el hipnograma de una noche y la
// constelación de hoy en chico. Con los colores de la galería.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { Constelacion } from '@/datos/catalogo';
import type { Tramo } from '@/dominio/sueno';
import { encajar, proyectar } from '@/cielo/mundo';

export type PuntoDeLinea = { x: number; punto: number | null; linea: number | null };

export type PropsDeLinea = { serie: PuntoDeLinea[]; ancho: number; alto: number; meta?: number | null };

/** Puntos (lo de cada día) y una línea (la tendencia), con el área debajo y, si hay, la meta punteada. */
export function LineaSkia({ serie, ancho, alto, meta }: PropsDeLinea) {
  const dibujo = useMemo(() => {
    const m = 4;
    const valores = serie.flatMap((p) => [p.punto, p.linea]).filter((v): v is number => v !== null).concat(meta != null ? [meta] : []);
    if (!valores.length) return null;
    const min = Math.min(...valores) - 0.1;
    const max = Math.max(...valores) + 0.1;
    const X = (x: number) => m + x * (ancho - 2 * m);
    const Y = (v: number) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
    const conLinea = serie.filter((p) => p.linea !== null);
    const linea = Skia.PathBuilder.Make();
    const area = Skia.PathBuilder.Make();
    conLinea.forEach((p, i) => {
      if (i === 0) {
        linea.moveTo(X(p.x), Y(p.linea!));
        area.moveTo(X(p.x), alto).lineTo(X(p.x), Y(p.linea!));
      } else {
        linea.lineTo(X(p.x), Y(p.linea!));
        area.lineTo(X(p.x), Y(p.linea!));
      }
    });
    const ultimo = conLinea[conLinea.length - 1];
    if (ultimo) area.lineTo(X(ultimo.x), alto).close();
    return {
      linea: linea.detach(), area: area.detach(),
      puntos: serie.filter((p) => p.punto !== null).map((p) => ({ x: X(p.x), y: Y(p.punto!) })),
      fin: ultimo ? { x: X(ultimo.x), y: Y(ultimo.linea!) } : null,
      meta: meta != null && meta > min && meta < max ? Y(meta) : null,
      m,
    };
  }, [serie, ancho, alto, meta]);
  if (!dibujo) return <Canvas style={{ width: ancho, height: alto }} />;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {dibujo.meta !== null && (
        <Line p1={vec(dibujo.m, dibujo.meta)} p2={vec(ancho - dibujo.m, dibujo.meta)} color="rgba(239, 230, 207, 0.4)" strokeWidth={1}>
          <DashPathEffect intervals={[3, 4]} />
        </Line>
      )}
      <Path path={dibujo.area}>
        <LinearGradient start={vec(0, 0)} end={vec(0, alto)} colors={['rgba(246, 227, 166, 0.18)', 'rgba(246, 227, 166, 0)']} />
      </Path>
      {dibujo.puntos.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={1.5} color="rgba(239, 230, 207, 0.3)" />
      ))}
      <Path path={dibujo.linea} style="stroke" strokeWidth={1.8} strokeCap="round" strokeJoin="round" color="#f6e3a6" />
      {dibujo.fin && (
        <Group>
          <Circle cx={dibujo.fin.x} cy={dibujo.fin.y} r={4} color="rgba(246, 227, 166, 0.6)">
            <BlurMask blur={4} style="normal" />
          </Circle>
          <Circle cx={dibujo.fin.x} cy={dibujo.fin.y} r={2.6} color="#fbf2d9" />
        </Group>
      )}
    </Canvas>
  );
}

export type PropsDeBalance = { dias: { kcal: number }[]; gasto: number; ancho: number; alto: number };

/** Lo comido de cada día contra el gasto (la línea punteada): debajo es déficit; arriba, de más. */
export function BalanceSkia({ dias, gasto, ancho, alto }: PropsDeBalance) {
  const m = 3;
  const max = Math.max(gasto * 1.15, ...dias.map((d) => d.kcal));
  const Y = (v: number) => alto - m - (v / max) * (alto - 2 * m);
  const paso = (ancho - 2 * m) / 7;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {dias.map((d, i) => {
        const x = m + (7 - dias.length + i) * paso + paso * 0.28;
        return (
          <RoundedRect key={i} x={x} y={Y(d.kcal)} width={paso * 0.44} height={alto - m - Y(d.kcal)} r={1.6} color={d.kcal > gasto ? 'rgba(232, 196, 106, 0.6)' : 'rgba(239, 230, 207, 0.32)'} />
        );
      })}
      <Line p1={vec(m, Y(gasto))} p2={vec(ancho - m, Y(gasto))} color="rgba(239, 230, 207, 0.62)" strokeWidth={1.2}>
        <DashPathEffect intervals={[3, 3]} />
      </Line>
    </Canvas>
  );
}

const FILAS: Record<Tramo['etapa'], number> = { despierto: 0, rem: 1, nucleo: 2, profundo: 3, dormido: 2 };
const COLORES: Record<Tramo['etapa'], string> = { despierto: '#e7a07a', rem: '#8fd3e8', nucleo: '#6f86d6', dormido: '#6f86d6', profundo: '#4b4fa8' };

export type PropsDeHipnograma = { desde: number; hasta: number; tramos: Tramo[]; ancho: number; alto: number; guias?: boolean };

/** Las etapas de una noche en el tiempo: despierto arriba y profundo abajo, como la app Salud. */
export function HipnogramaSkia({ desde, hasta, tramos, ancho, alto, guias }: PropsDeHipnograma) {
  const X = (min: number) => ((min - desde) / Math.max(1, hasta - desde)) * ancho;
  const fila = alto / 4;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {guias && [0, 1, 2, 3].map((i) => <Line key={i} p1={vec(0, i * fila + fila / 2)} p2={vec(ancho, i * fila + fila / 2)} color="rgba(239, 230, 207, 0.06)" strokeWidth={1} />)}
      {tramos.map((t) => (
        <RoundedRect key={`${t.desde}-${t.etapa}`} x={X(t.desde)} y={FILAS[t.etapa] * fila + 1} width={Math.max(0.6, X(t.hasta) - X(t.desde))} height={fila - 2} r={1.4} color={COLORES[t.etapa]} />
      ))}
    </Canvas>
  );
}

/** Unas estrellas de fondo, quietas: siempre las mismas. */
function estrellasDeFondo(ancho: number, alto: number) {
  let s = 17;
  const azar = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return Array.from({ length: 70 }, () => ({ x: azar() * ancho, y: azar() * alto, r: 0.3 + azar() * 0.6, a: 0.08 + azar() * 0.22 }));
}

export type PropsDeMiniCielo = { constelacion: Constelacion; encendidas: boolean[]; ancho: number; alto: number; /** Sin las estrellas de fondo: encima del cielo de verdad (la entrada). */ sinFondo?: boolean };

/** La constelación de hoy en chico, con lo encendido y unas estrellas de fondo, quietas. */
export function MiniCieloSkia({ constelacion, encendidas, ancho, alto, sinFondo }: PropsDeMiniCielo) {
  const dibujo = useMemo(() => {
    const aspecto = ancho / alto;
    const plano = encajar(proyectar(constelacion.estrellas), [0, 0], (aspecto - 60 / alto) * 0.9, 0.38);
    const pos = plano.map(([x, y]) => ({ x: ancho / 2 + x * alto, y: alto / 2 - y * alto }));
    const fondo = estrellasDeFondo(ancho, alto);
    const lineas = Skia.PathBuilder.Make();
    constelacion.lineas.forEach(([a, b]) => lineas.moveTo(pos[a].x, pos[a].y).lineTo(pos[b].x, pos[b].y));
    return { pos, fondo, lineas: lineas.detach() };
  }, [constelacion, ancho, alto]);
  const completa = encendidas.length > 0 && encendidas.every(Boolean);
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Rect x={0} y={0} width={ancho} height={alto} color="transparent" />
      {!sinFondo && dibujo.fondo.map((f, i) => (
        <Circle key={i} cx={f.x} cy={f.y} r={f.r} color={`rgba(239, 230, 207, ${f.a.toFixed(2)})`} />
      ))}
      <Path path={dibujo.lineas} style="stroke" strokeWidth={1} strokeCap="round" color={completa ? 'rgba(232, 196, 106, 0.7)' : 'rgba(232, 196, 106, 0.22)'} />
      {constelacion.estrellas.map((estrella, i) => {
        const p = dibujo.pos[i];
        const radio = Math.max(1.4, Math.min(3.4, 3.2 - 0.45 * estrella.mag));
        return encendidas[i] ? (
          <Group key={estrella.id}>
            <Circle cx={p.x} cy={p.y} r={radio * 5}>
              <RadialGradient c={vec(p.x, p.y)} r={radio * 5} colors={['rgba(246, 227, 166, 0.55)', 'rgba(246, 227, 166, 0)']} />
            </Circle>
            <Circle cx={p.x} cy={p.y} r={radio} color="#fbf2d9" />
          </Group>
        ) : (
          <Circle key={estrella.id} cx={p.x} cy={p.y} r={radio + 0.6} style="stroke" strokeWidth={0.9} color="rgba(239, 230, 207, 0.4)" />
        );
      })}
    </Canvas>
  );
}
