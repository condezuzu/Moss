// En la web, Skia (CanvasKit) recién está cuando carga el cielo: la marca va con vistas. La web
// solo sirve para probar sin iPhone; la marca de verdad es la de MarcaDeAscent.tsx.

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

export function MarcaDeAscent({ unida = false, tam = 124 }: { unida?: boolean; tam?: number }) {
  const reducido = useReducedMotion();
  const u = useSharedValue(unida ? 1 : 0);
  useEffect(() => {
    u.set(reducido ? (unida ? 1 : 0) : withTiming(unida ? 1 : 0, { duration: 1300, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [unida, reducido, u]);
  const k = tam / 124;
  const luna = useAnimatedStyle(() => ({
    opacity: 0.6 + 0.4 * u.get(),
    transform: [{ translateX: (51 + (36.04 - 51) * u.get()) * k }, { translateY: (-36 + (36 - 25.24) * u.get()) * k }],
  }));
  const punteada = useAnimatedStyle(() => ({ opacity: 1 - u.get() }));
  const entera = useAnimatedStyle(() => ({ opacity: 0.85 * u.get() }));
  const orbita = { width: 88 * k, height: 88 * k, borderRadius: 44 * k };
  return (
    <View style={[estilos.marca, { width: tam, height: tam }, tam !== 124 && estilos.chica]}>
      <Animated.View style={[estilos.orbita, orbita, estilos.punteada, punteada]} />
      <Animated.View style={[estilos.orbita, orbita, estilos.entera, entera]} />
      <View style={[estilos.planeta, { width: 50 * k, height: 50 * k, borderRadius: 25 * k }]} />
      <Animated.View style={[estilos.luna, { width: 10.4 * k, height: 10.4 * k, borderRadius: 5.2 * k, marginLeft: -5.2 * k, marginTop: -5.2 * k }, luna]} />
    </View>
  );
}

const estilos = StyleSheet.create({
  marca: { alignSelf: 'center', marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  chica: { alignSelf: 'auto', marginTop: 0 },
  orbita: { position: 'absolute' },
  punteada: { borderWidth: 1.3, borderStyle: 'dotted', borderColor: 'rgba(138, 147, 168, 0.6)' },
  entera: { borderWidth: 1.6, borderColor: '#c4c2ba' },
  planeta: { backgroundColor: '#2b313e', borderWidth: 0.8, borderColor: 'rgba(232, 236, 246, 0.14)' },
  luna: { position: 'absolute', left: '50%', top: '50%', backgroundColor: '#e6dfcf' },
});
