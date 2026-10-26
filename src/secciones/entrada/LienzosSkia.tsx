// Lo de la entrada que se dibuja con Skia: la estrella guía (su halo y su cuerpo, quietos: lo que se
// mueve es la vista que los lleva), su estela, Casiopea que la guía enciende y los anillos de los
// macros alrededor de la luna. Lo que cambia en cada cuadro sale del reloj de la pantalla y del
// guion (guion.ts), como en la galería. En la web llega con un import dinámico (Lienzos.web.tsx).

import { Canvas, Circle, DashPathEffect, Group, Line, LinearGradient, Path, RadialGradient, Rect, Skia, vec, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';

import { colores } from '@/tema';
import { COLOR_DE_MACRO } from '../comida/comunes';
import { enLut, estado, facil, limitar, mezclar, type EscenaDeCasiopea, type Recorrido } from './guion';

// ------------------------------------------------------------------ la estrella guía
/** El halo: lo que respira cuando espera. */
export function HaloSkia() {
  return (
    <Canvas style={{ width: 84, height: 84 }} pointerEvents="none">
      <Circle cx={42} cy={42} r={42}>
        <RadialGradient c={vec(42, 42)} r={42} colors={['rgba(246, 227, 166, 0.5)', 'rgba(246, 227, 166, 0.17)', 'rgba(246, 227, 166, 0.05)', 'rgba(246, 227, 166, 0)']} positions={[0, 0.3, 0.48, 0.68]} />
      </Circle>
    </Canvas>
  );
}

const RAYO = ['rgba(255, 247, 226, 0)', 'rgba(255, 247, 226, 0.8)', 'rgba(255, 247, 226, 0)'];

/** El cuerpo: los rayos en cruz y el núcleo. */
export function CuerpoSkia() {
  return (
    <Canvas style={{ width: 54, height: 54 }} pointerEvents="none">
      <Rect x={0} y={26.4} width={54} height={1.2}>
        <LinearGradient start={vec(0, 27)} end={vec(54, 27)} colors={RAYO} />
      </Rect>
      <Rect x={26.4} y={0} width={1.2} height={54}>
        <LinearGradient start={vec(27, 0)} end={vec(27, 54)} colors={RAYO} />
      </Rect>
      <Circle cx={27} cy={27} r={8}>
        <RadialGradient c={vec(27, 27)} r={8} colors={['#fffdf6', '#fbf2d9', 'rgba(251, 242, 217, 0.5)', 'rgba(251, 242, 217, 0)']} positions={[0, 0.22, 0.42, 0.7]} />
      </Circle>
    </Canvas>
  );
}

export type PropsDeEstela = { recorrido: SharedValue<Recorrido | null>; reloj: SharedValue<number>; reducido: boolean; ancho: number; alto: number };

const TRAZOS = [[7, 0.12], [3.6, 0.22], [1.6, 0.85]] as const;

/** La estela: un hilo de luz que se apaga hacia atrás, con dos trazos anchos y tenues de resplandor. */
export function EstelaSkia({ recorrido, reloj, reducido, ancho, alto }: PropsDeEstela) {
  const trazo = useDerivedValue(() => {
    const e = estado(recorrido.get(), reloj.get(), reducido);
    const b = Skia.PathBuilder.Make();
    let cola = { x: 0, y: 0 };
    let cabeza = { x: 0, y: 1 };
    e.estelas.forEach((es) => {
      for (let k = 0; k <= 18; k++) {
        const [x, y] = enLut(es.lut, mezclar(es.desde, es.hasta, k / 18));
        if (k === 0) b.moveTo(x, y);
        else b.lineTo(x, y);
        if (k === 0) cola = { x, y };
        if (k === 18) cabeza = { x, y };
      }
    });
    return { camino: b.detach(), cola, cabeza };
  });
  const camino = useDerivedValue<SkPath>(() => trazo.get().camino);
  const cola = useDerivedValue(() => trazo.get().cola);
  const cabeza = useDerivedValue(() => trazo.get().cabeza);
  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width: ancho, height: alto }} pointerEvents="none">
      {TRAZOS.map(([grosor, alfa]) => (
        <Path key={grosor} path={camino} style="stroke" strokeWidth={grosor} strokeCap="round" strokeJoin="round">
          <LinearGradient start={cola} end={cabeza} colors={['rgba(246, 227, 166, 0)', `rgba(255, 244, 214, ${alfa})`]} />
        </Path>
      ))}
    </Canvas>
  );
}

// ------------------------------------------------------------------ Casiopea
export type PropsDeCasiopea = { escena: EscenaDeCasiopea; reloj: SharedValue<number>; reducido: boolean; ancho: number; alto: number };

/** Lo que dura cada cosa de un toque, como en el cielo: el destello y la onda. */
const DESTELLO = 420;
const ONDA = 760;
const OLA = 1300;

/** Casiopea: apagada, con sus líneas punteadas; la guía la enciende salto por salto y al final se conecta. */
export function CasiopeaSkia({ escena, reloj, reducido, ancho, alto }: PropsDeCasiopea) {
  const base = useMemo(() => {
    const b = Skia.PathBuilder.Make();
    escena.lineas.forEach(([i, j]) => b.moveTo(escena.pos[i][0], escena.pos[i][1]).lineTo(escena.pos[j][0], escena.pos[j][1]));
    return b.detach();
  }, [escena]);
  const centro = useMemo(() => {
    const n = escena.pos.length || 1;
    return { x: escena.pos.reduce((s, p) => s + p[0], 0) / n, y: escena.pos.reduce((s, p) => s + p[1], 0) / n };
  }, [escena]);
  const completo = escena.completo;
  const olaR = useDerivedValue(() => {
    const d = reloj.get() - completo;
    return d >= 0 && d <= OLA && !reducido ? mezclar(16, 166, facil('llega', d / OLA)) : 0;
  });
  const olaA = useDerivedValue(() => {
    const d = reloj.get() - completo;
    return d >= 0 && d <= OLA && !reducido ? 0.35 * (1 - d / OLA) : 0;
  });
  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width: ancho, height: alto }} pointerEvents="none">
      <Path path={base} style="stroke" strokeWidth={1} color="rgba(239, 230, 207, 0.16)">
        <DashPathEffect intervals={[2, 5]} />
      </Path>
      {escena.saltos.map(([a, b, t0, t1]) => (
        <LineaDeCasiopea key={`${a}-${b}`} desde={escena.pos[a]} hasta={escena.pos[b]} t0={t0} t1={t1} completo={completo} reloj={reloj} />
      ))}
      <Circle cx={centro.x} cy={centro.y} r={olaR} style="stroke" strokeWidth={1.2} color={colores.oro} opacity={olaA} />
      {escena.pos.map(([x, y], i) => (
        <EstrellaDeCasiopea key={i} x={x} y={y} luz={escena.luz[i]} reloj={reloj} reducido={reducido} />
      ))}
    </Canvas>
  );
}

function LineaDeCasiopea({ desde, hasta, t0, t1, completo, reloj }: { desde: readonly [number, number]; hasta: readonly [number, number]; t0: number; t1: number; completo: number; reloj: SharedValue<number> }) {
  // La línea llega hasta donde va la guía: la misma curva de tiempo que su salto.
  const punta = useDerivedValue(() => {
    const s = facil('suave', limitar((reloj.get() - t0) / (t1 - t0), 0, 1));
    return { x: mezclar(desde[0], hasta[0], s), y: mezclar(desde[1], hasta[1], s) };
  });
  const c = useDerivedValue(() => limitar((reloj.get() - completo) / 500, 0, 1));
  const ancho = useDerivedValue(() => 1.2 + 0.5 * c.get());
  const opacidad = useDerivedValue(() => (reloj.get() < t0 ? 0 : 0.6 + 0.35 * c.get()));
  return <Line p1={vec(desde[0], desde[1])} p2={punta} style="stroke" strokeWidth={ancho} strokeCap="round" color={colores.oro} opacity={opacidad} />;
}

function EstrellaDeCasiopea({ x, y, luz, reloj, reducido }: { x: number; y: number; luz: number; reloj: SharedValue<number>; reducido: boolean }) {
  const l = useDerivedValue(() => limitar((reloj.get() - luz) / 250, 0, 1));
  const pop = useDerivedValue(() => {
    const d = reloj.get() - luz;
    return d >= 0 && !reducido ? Math.exp(-d / 200) : 0;
  });
  const haloR = useDerivedValue(() => 16 + 6 * l.get() + 10 * pop.get());
  const nucleoR = useDerivedValue(() => 1.3 + 1.3 * l.get() + 0.8 * pop.get());
  const nucleoA = useDerivedValue(() => 0.55 + 0.45 * l.get());
  const anilloA = useDerivedValue(() => 1 - l.get());
  const destelloR = useDerivedValue(() => {
    const d = reloj.get() - luz;
    return d >= 0 && d <= DESTELLO && !reducido ? mezclar(8, 34, facil('llega', d / DESTELLO)) : 0;
  });
  const destelloA = useDerivedValue(() => {
    const d = reloj.get() - luz;
    return d >= 0 && d <= DESTELLO && !reducido ? 0.85 * (1 - d / DESTELLO) : 0;
  });
  const ondaR = useDerivedValue(() => {
    const d = reloj.get() - luz;
    return d >= 0 && d <= ONDA && !reducido ? mezclar(8, 46, facil('llega', d / ONDA)) : 0;
  });
  const ondaA = useDerivedValue(() => {
    const d = reloj.get() - luz;
    return d >= 0 && d <= ONDA && !reducido ? 0.7 * (1 - d / ONDA) : 0;
  });
  const c = vec(x, y);
  return (
    <Group>
      <Circle cx={x} cy={y} r={ondaR} style="stroke" strokeWidth={1.2} color={colores.oro} opacity={ondaA} />
      <Circle cx={x} cy={y} r={haloR} opacity={l}>
        <RadialGradient c={c} r={haloR} colors={['rgba(246, 227, 166, 0.62)', 'rgba(246, 227, 166, 0.2)', 'rgba(246, 227, 166, 0)']} positions={[0, 0.34, 1]} />
      </Circle>
      <Circle cx={x} cy={y} r={destelloR} opacity={destelloA}>
        <RadialGradient c={c} r={destelloR} colors={['rgba(255, 246, 222, 0.95)', 'rgba(255, 246, 222, 0.45)', 'rgba(255, 246, 222, 0)']} positions={[0, 0.3, 1]} />
      </Circle>
      <Circle cx={x} cy={y} r={4.2} style="stroke" strokeWidth={0.9} color="rgba(239, 230, 207, 0.42)" opacity={anilloA} />
      <Circle cx={x} cy={y} r={nucleoR} color="#fbf2d9" opacity={nucleoA} />
    </Group>
  );
}

// ------------------------------------------------------------------ los anillos de la luna
const MACROS = ['proteina', 'carbohidratos', 'grasas'] as const;

export type PropsDeAnillos = {
  tam: number;
  reparto?: readonly [number, number, number];
  ms: number;
  demora?: number;
  /** Con la guía: cada anillo se dibuja en su vuelta (ms desde que empieza la pantalla, en este reloj). */
  vueltas?: readonly (readonly [number, number])[];
  reloj?: SharedValue<number>;
};

/**
 * Alrededor de la luna, los macros, de dos maneras: tres anillos que dibuja la estrella guía al dar
 * cada vuelta (la diapositiva) o un solo anillo repartido entre los tres, en proporción a sus kcal
 * (el resultado).
 */
export function AnillosSkia({ tam, reparto, ms, demora = 250, vueltas, reloj }: PropsDeAnillos) {
  const k = tam / 200;
  const propio = useSharedValue(0);
  useEffect(() => {
    if (!reloj) propio.set(withDelay(demora, withTiming(1, { duration: ms, easing: Easing.out(Easing.cubic) })));
  }, [propio, ms, demora, reloj]);
  const caminos = useMemo(() => MACROS.map((_, i) => Skia.Path.Circle(tam / 2, tam / 2, (reparto ? 60 : 54 + i * 8) * k)), [tam, k, reparto]);
  // Repartido: cada macro su tramo del mismo anillo, uno detrás del otro, con un hueco entre ellos.
  const desde = reparto ? [0, reparto[0], reparto[0] + reparto[1]] : [0, 0, 0];
  const hueco = reparto ? 7 / (2 * Math.PI * 60) : 0;
  // t: el reloj de la guía; u: el avance propio. Se leen afuera, en cada valor derivado: así se entera cuando cambian.
  const parte = (i: number, t: number, u: number) => {
    'worklet';
    if (vueltas) return limitar((t - vueltas[i][0]) / (vueltas[i][1] - vueltas[i][0]), 0, 1);
    if (reparto) return desde[i] + Math.max(0, reparto[i] - hueco) * Math.min(1, Math.max(0, u * 3 - i));
    return Math.min(1, Math.max(0, (u - 0.15 * i) / 0.7));
  };
  const fin0 = useDerivedValue(() => parte(0, reloj ? reloj.get() : 0, propio.get()));
  const fin1 = useDerivedValue(() => parte(1, reloj ? reloj.get() : 0, propio.get()));
  const fin2 = useDerivedValue(() => parte(2, reloj ? reloj.get() : 0, propio.get()));
  const fines = [fin0, fin1, fin2];
  return (
    <Canvas style={{ position: 'absolute', left: 0, top: 0, width: tam, height: tam }} pointerEvents="none">
      <Group origin={{ x: tam / 2, y: tam / 2 }} transform={[{ rotate: -Math.PI / 2 }]}>
        {MACROS.map((m, i) => (
          <Path key={m} path={caminos[i]} style="stroke" strokeWidth={2.4 * Math.max(1, k)} strokeCap="round" color={COLOR_DE_MACRO[m]} start={desde[i]} end={fines[i]} />
        ))}
      </Group>
    </Canvas>
  );
}
