// Lo que cambia con un toque se mueve hasta lo nuevo en vez de saltar, como en la galería: las
// cifras cuentan (galeria/src/comida.js, contar), las barras se llenan (.in-macro-barra i) y los
// vasos de agua se llenan de a uno (.in-vasos i). Con Reducir movimiento, todo va directo.

import { useEffect, useRef, useState } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

// La curva de las barras de la galería: cubic-bezier(0.2, 0.7, 0.2, 1).
const LLENA = Easing.bezier(0.2, 0.7, 0.2, 1);
const LLENA_MS = 1100;
/** Cuántas veces cambia la cifra mientras cuenta: cada cambio vuelve a dibujar a quien la usa. */
const PASOS = 10;
/** Un relleno ocupa toda su pista y se corre: ver Relleno. */
const ENTERO: ViewStyle = { width: '100%' };

/**
 * Una cifra que, cuando cambia, cuenta desde lo que mostraba (anotar comida baja «te quedan» de a
 * poco). La primera vez aparece quieta. Cuenta de a pasos, diez en el mismo tiempo y con la misma
 * curva, y no en cada cuadro: Inicio y Comida cuentan a la vez al anotar, y cada paso las vuelve a
 * dibujar (uno por cuadro eran unos treinta).
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
    let paso = 0;
    const reloj = setInterval(() => {
      paso++;
      const v = paso < PASOS ? inicio + (valor - inicio) * (1 - (1 - paso / PASOS) ** 3) : valor;
      desde.current = v;
      setMostrado(v);
      if (paso >= PASOS) clearInterval(reloj);
    }, ms / PASOS);
    return () => clearInterval(reloj);
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

/**
 * El relleno de una barra: el estilo le da el alto, el color y el borde. Es tan ancho como su pista y
 * se llena corriéndose desde la izquierda con transform, que no rehace el layout en cada cuadro (con
 * el ancho, sí: seis barras cada vez que se anota). La pista tiene que recortar (overflow hidden, con
 * las cuatro esquinas iguales): su borde hace de punta izquierda, y la derecha es la del relleno, la
 * misma que cuando crecía.
 */
export function Relleno({ fraccion, style }: { fraccion: number; style?: StyleProp<ViewStyle> }) {
  const x = useFraccion(fraccion);
  const corrido = useAnimatedStyle(() => ({ transform: [{ translateX: `${(x.get() - 1) * 100}%` }] }));
  return <Animated.View style={[style, ENTERO, corrido]} />;
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
