// Mantener apretado, el de la galería (galeria/src/detalles.js, mantener): mientras se aprieta, lo apretado
// se hunde apenas y, al llegar, pasa lo suyo y vuelve. Un toque corto no hace nada: los botones de adentro
// hacen lo de siempre. Con Reducir movimiento no se hunde.

import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { MANTENER_MS } from './agua';

/** `lugar`: lo que ocupa en lo de afuera (un `flex`); `style`: lo de adentro, que es lo que se hunde. */
export function Mantener({ alMantener, lugar, style, children }: { alMantener: () => void; lugar?: StyleProp<ViewStyle>; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const reducido = useReducedMotion();
  const hundido = useSharedValue(0);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.018 * hundido.get() }] }));
  const volver = () => hundido.set(withTiming(0, { duration: 160 }));
  return (
    // No es un elemento de VoiceOver: lo de adentro sí, y el botón de adentro trae la acción del gesto.
    <Pressable
      onLongPress={() => {
        volver();
        alMantener();
      }}
      delayLongPress={MANTENER_MS}
      onPressIn={() => {
        if (!reducido) hundido.set(withTiming(1, { duration: MANTENER_MS }));
      }}
      onPressOut={volver}
      accessible={false}
      style={lugar}
    >
      <Animated.View style={[style, estilo]}>{children}</Animated.View>
    </Pressable>
  );
}
