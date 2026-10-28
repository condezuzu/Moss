// Lo que cambia con un toque se mueve hasta lo nuevo en vez de saltar, como en la galería: las
// cifras cuentan (galeria/src/comida.js, contar), las barras se llenan (.in-macro-barra i) y los
// vasos de agua se llenan de a uno (.in-vasos i). Con Reducir movimiento, todo va directo.

import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

// La curva de las barras de la galería: cubic-bezier(0.2, 0.7, 0.2, 1).
const LLENA = Easing.bezier(0.2, 0.7, 0.2, 1);
const LLENA_MS = 1100;

/**
 * Una cifra que, cuando cambia, cuenta desde lo que mostraba (anotar comida baja «te quedan» de a
 * poco). La primera vez aparece quieta. Solo se vuelve a dibujar quien la usa, unos 25 cuadros.
 */
export function useCuenta(valor: number, ms = 480): number {
  const reducido = useReducedMotion();
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);
  useEffect(() => {
    const inicio = desde.current;
    if (reducido || inicio === valor) {
      desde.current = valor;
      return;
    }
    const t0 = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const k = Math.min(1, (ahora - t0) / ms);
      const v = inicio + (valor - inicio) * (1 - (1 - k) ** 3);
      desde.current = v;
      setMostrado(v);
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [valor, ms, reducido]);
  return reducido ? valor : mostrado;
}

/** Una fracción de 0 a 1 que llega con la curva de las barras; al aparecer, se llena desde cero. */
export function useFraccion(fraccion: number): SharedValue<number> {
  const reducido = useReducedMotion();
  const f = Math.max(0, Math.min(1, Number.isFinite(fraccion) ? fraccion : 0));
  const x = useSharedValue(reducido ? f : 0);
  useEffect(() => {
    x.set(reducido ? f : withTiming(f, { duration: LLENA_MS, easing: LLENA }));
  }, [f, reducido, x]);
  return x;
}

/** El relleno de una barra: el estilo le da el alto, el color y el borde; el ancho lo anima. */
export function Relleno({ fraccion, style }: { fraccion: number; style?: StyleProp<ViewStyle> }) {
  const x = useFraccion(fraccion);
  const ancho = useAnimatedStyle(() => ({ width: `${x.get() * 100}%` }));
  return <Animated.View style={[style, ancho]} />;
}

/** Un vaso de agua: se llena con un fundido; los que pasan de la meta entran de a uno. */
export function Vaso({ lleno, extra, style, llenoStyle }: { lleno: boolean; extra: boolean; style: StyleProp<ViewStyle>; llenoStyle: StyleProp<ViewStyle> }) {
  const reducido = useReducedMotion();
  const opacidad = useAnimatedStyle(() => ({ opacity: reducido ? (lleno ? 1 : 0) : withTiming(lleno ? 1 : 0, { duration: 320 }) }));
  return (
    <Animated.View entering={extra && !reducido ? FadeIn.duration(320) : undefined} style={[style, { overflow: 'hidden' }]}>
      <Animated.View style={[{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1 }, llenoStyle, opacidad]} />
    </Animated.View>
  );
}
