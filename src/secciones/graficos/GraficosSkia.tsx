// Los gráficos chicos de Inicio, Progreso y Sueño, los de la galería (galeria/src/inicio.js,
// «Graficos»): una línea con su tendencia, el balance de la semana, las barras y las columnas de
// cada semana, la línea chiquita de una medida, el hipnograma de una noche, la constelación de hoy
// en chico y lo que sigue a la meta del plan. Con los colores de la galería.

import { BlurMask, Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { Constelacion } from '@/datos/catalogo';
import { diasEntre, type ClaveDia } from '@/dominio/fechas';
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

export type PropsDeBalance = { dias: { kcal: number; fecha?: ClaveDia }[]; hasta?: ClaveDia; gasto: number; ancho: number; alto: number };

/**
 * Lo comido de cada día contra el gasto (la línea punteada): debajo es déficit; arriba, de más. Con
 * `hasta`, cada barra va en su día y los días sin registrar quedan vacíos; sin él, juntas al final.
 */
export function BalanceSkia({ dias, hasta, gasto, ancho, alto }: PropsDeBalance) {
  const m = 3;
  const max = Math.max(gasto * 1.15, ...dias.map((d) => d.kcal));
  const Y = (v: number) => alto - m - (v / max) * (alto - 2 * m);
  const paso = (ancho - 2 * m) / 7;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {dias.map((d, i) => {
        const atras = hasta && d.fecha ? diasEntre(d.fecha, hasta) : dias.length - 1 - i;
        const x = m + (6 - atras) * paso + paso * 0.28;
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

export type PropsDeBarras = { valores: (number | null)[]; ancho: number; alto: number };

/**
 * Barras desde el cero: lo negativo baja y lo positivo sube (el cambio de cada semana). Si todo va
 * para el mismo lado, el cero queda en el borde y las barras usan todo el alto.
 */
export function BarrasSkia({ valores, ancho, alto }: PropsDeBarras) {
  const m = 3;
  const hay = valores.filter((v): v is number => v !== null);
  const max = Math.max(0.1, ...hay.map((v) => Math.abs(v)));
  const cero = hay.every((v) => v <= 0) ? m : hay.every((v) => v >= 0) ? alto - m : alto / 2;
  const lugar = Math.max(cero - m, alto - m - cero);
  const paso = (ancho - 2 * m) / valores.length;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Line p1={vec(m, cero)} p2={vec(ancho - m, cero)} color="rgba(239, 230, 207, 0.06)" strokeWidth={1} />
      {valores.map((v, i) => {
        if (v === null) return null;
        const h = Math.max(1.5, (Math.abs(v) / max) * lugar);
        return <RoundedRect key={i} x={m + i * paso + paso * 0.24} y={v < 0 ? cero : cero - h} width={paso * 0.52} height={h} r={2} color={v < 0 ? 'rgba(166, 191, 148, 0.75)' : 'rgba(232, 196, 106, 0.6)'} />;
      })}
    </Canvas>
  );
}

export type PropsDeColumnas = { valores: (number | null)[]; meta: number; ancho: number; alto: number };

/** Lo comido de cada semana contra la meta (la línea punteada): columnas que llegan o no. */
export function ColumnasSkia({ valores, meta, ancho, alto }: PropsDeColumnas) {
  const m = 3;
  const max = Math.max(meta * 1.2, ...valores.map((v) => v ?? 0));
  const Y = (v: number) => alto - m - (v / max) * (alto - 2 * m);
  const paso = (ancho - 2 * m) / valores.length;
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {valores.map((v, i) => {
        const x = m + i * paso + paso * 0.24;
        if (v === null) return <RoundedRect key={i} x={x} y={alto - m - 2} width={paso * 0.52} height={2} r={1} color="rgba(239, 230, 207, 0.12)" />;
        const color = v > meta * 1.05 ? 'rgba(232, 196, 106, 0.65)' : v < meta * 0.9 ? 'rgba(239, 230, 207, 0.35)' : 'rgba(166, 191, 148, 0.6)';
        return <RoundedRect key={i} x={x} y={Y(v)} width={paso * 0.52} height={alto - m - Y(v)} r={2} color={color} />;
      })}
      <Line p1={vec(m, Y(meta))} p2={vec(ancho - m, Y(meta))} color="rgba(239, 230, 207, 0.62)" strokeWidth={1.2}>
        <DashPathEffect intervals={[3, 3]} />
      </Line>
    </Canvas>
  );
}

export type PropsDeChispa = { valores: number[]; ancho: number; alto: number };

/** Una línea chiquita, al lado de un número (las medidas), con el último punto encendido. */
export function ChispaSkia({ valores, ancho, alto }: PropsDeChispa) {
  const dibujo = useMemo(() => {
    const m = 2.5;
    if (valores.length < 2) return null;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const X = (i: number) => m + (i / (valores.length - 1)) * (ancho - 2 * m);
    const Y = (v: number) => (max === min ? alto / 2 : m + (1 - (v - min) / (max - min)) * (alto - 2 * m));
    const camino = Skia.PathBuilder.Make();
    valores.forEach((v, i) => (i ? camino.lineTo(X(i), Y(v)) : camino.moveTo(X(i), Y(v))));
    const ultimo = valores.length - 1;
    return { camino: camino.detach(), fin: { x: X(ultimo), y: Y(valores[ultimo]) } };
  }, [valores, ancho, alto]);
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {dibujo && (
        <Group>
          <Path path={dibujo.camino} style="stroke" strokeWidth={1.8} strokeCap="round" strokeJoin="round" color="#f6e3a6" />
          <Circle cx={dibujo.fin.x} cy={dibujo.fin.y} r={2} color="#fbf2d9" />
        </Group>
      )}
    </Canvas>
  );
}

const FILAS: Record<Tramo['etapa'], number> ={ despierto: 0, rem: 1, nucleo: 2, profundo: 3, dormido: 2 };
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
    // Como en la galería (dibujarConstelacion): llena el lienzo, con 30 de margen a los lados y 15 arriba y abajo.
    const plano = encajar(proyectar(constelacion.estrellas), [0, 0], (ancho - 60) / alto, (alto - 30) / alto);
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

export type CeldaDelMes = { x: number; y: number; ancho: number; alto: number; constelacion: Constelacion | null; encendidas: boolean[]; completo: boolean };
export type PropsDeMes = { celdas: CeldaDelMes[]; ancho: number; alto: number };

/** El mes en mini cielos: la constelación de cada día con lo que se encendió; los días completos, unidos en oro. */
export function MesSkia({ celdas, ancho, alto }: PropsDeMes) {
  const dibujo = useMemo(
    () =>
      celdas.map((c) => {
        if (!c.constelacion) return null;
        const plano = encajar(proyectar(c.constelacion.estrellas), [0, 0], (c.ancho / c.alto) * 0.78, 0.34);
        const pos = plano.map(([x, y]) => ({ x: c.x + c.ancho / 2 + x * c.alto, y: c.y + c.alto / 2 + 4 - y * c.alto }));
        const lineas = Skia.PathBuilder.Make();
        c.constelacion.lineas.forEach(([a, b]) => lineas.moveTo(pos[a].x, pos[a].y).lineTo(pos[b].x, pos[b].y));
        return { pos, lineas: lineas.detach() };
      }),
    [celdas],
  );
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      {celdas.map((c, i) => {
        const d = dibujo[i];
        if (!d) return null;
        const cx = c.x + c.ancho / 2, cy = c.y + c.alto / 2 + 4;
        return (
          <Group key={i}>
            {c.completo && (
              <Circle cx={cx} cy={cy} r={c.alto * 0.48}>
                <RadialGradient c={vec(cx, cy)} r={c.alto * 0.48} colors={['rgba(232, 196, 106, 0.16)', 'rgba(232, 196, 106, 0)']} />
              </Circle>
            )}
            <Path path={d.lineas} style="stroke" strokeWidth={0.8} strokeCap="round" color={c.completo ? 'rgba(232, 196, 106, 0.8)' : 'rgba(239, 230, 207, 0.13)'} />
            {d.pos.map((p, k) => (
              <Circle key={k} cx={p.x} cy={p.y} r={c.encendidas[k] ? 1.7 : 1.1} color={c.encendidas[k] ? '#fbf2d9' : 'rgba(239, 230, 207, 0.32)'} />
            ))}
          </Group>
        );
      })}
    </Canvas>
  );
}

export type LoQueSigueDibujado = 'mantener' | 'grasa' | 'recomponer' | 'musculo' | 'despues';
export type PropsDeLoQueSigue = { que: LoQueSigueDibujado; ancho: number; alto: number };

/** Los caminos de cada uno, en una caja de 90 × 24: el peso baja despacio, se queda o sube despacio. */
const DIBUJO_DE_LO_QUE_SIGUE: Record<LoQueSigueDibujado, { linea: string; punto?: [number, number]; flecha?: string; apagado?: boolean }> = {
  mantener: { linea: 'M0 12H84', punto: [85, 12] },
  grasa: { linea: 'M0 12C30 12 50 15 84 20.5', punto: [85, 20.7] },
  musculo: { linea: 'M0 12C30 12 50 9 84 3.5', punto: [85, 3.3] },
  recomponer: { linea: 'M0 12H84', punto: [85, 12], flecha: 'M62 9V2M59 5l3-3 3 3M72 15v7M69 19l3 3 3-3' },
  despues: { linea: 'M0 12H52', apagado: true },
};

/**
 * Lo que sigue a la meta, al final de la línea del plan (galeria/src/progreso.js): punteado como el mantenimiento,
 * con su punto al final; la recomposición, con una flecha para cada lado; «lo decides», apagado (el signo va en
 * Plan.tsx, como texto).
 */
export function LoQueSigueSkia({ que, ancho, alto }: PropsDeLoQueSigue) {
  const d = DIBUJO_DE_LO_QUE_SIGUE[que];
  const caminos = useMemo(() => ({ linea: Skia.Path.MakeFromSVGString(d.linea)!, flecha: d.flecha ? Skia.Path.MakeFromSVGString(d.flecha)! : null }), [d]);
  const escala = Math.min(ancho / 90, alto / 24);
  const color = 'rgba(239, 230, 207, 0.62)';
  return (
    <Canvas style={{ width: ancho, height: alto }} pointerEvents="none">
      <Group transform={[{ translateY: (alto - 24 * escala) / 2 }, { scale: escala }]}>
        <Path path={caminos.linea} style="stroke" strokeWidth={2} strokeCap="round" color={d.apagado ? 'rgba(239, 230, 207, 0.32)' : color}>
          <DashPathEffect intervals={[4, 3.6]} />
        </Path>
        {d.punto && <Circle cx={d.punto[0]} cy={d.punto[1]} r={2.4} color={color} />}
        {caminos.flecha && <Path path={caminos.flecha} style="stroke" strokeWidth={1.5} strokeCap="round" strokeJoin="round" color="#a6bf94" />}
      </Group>
    </Canvas>
  );
}
