// Las piezas de la entrada, las de la galería (galeria/src/entrada.js): el botón que se llena en
// 2,5 s, el deslizador de los números, las opciones y las chispas de lo que se come. Lo que se
// dibuja con Skia (el aro y los anillos de los macros) está en LienzosSkia.tsx.

import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Aro } from './Lienzos';

/** Lo que la frase y las diapositivas piden quedarse antes de poder seguir. */
export const MINIMO_MS = 2500;

// ------------------------------------------------------------------ el botón que se llena

/**
 * No se puede tocar hasta que el aro se completa; después late suave, como el circulito de Ascent.
 * Con Reducir movimiento, el aro aparece lleno y no late.
 */
export function Circulo({ alTocar, reducido }: { alTocar: () => void; reducido: boolean }) {
  const [listo, setListo] = useState(false);
  const aro = useSharedValue(0);
  const latido = useSharedValue(1);
  useEffect(() => {
    aro.set(withTiming(1, { duration: reducido ? 0 : MINIMO_MS, easing: Easing.linear }));
    const espera = setTimeout(() => {
      setListo(true);
      Haptics.selectionAsync().catch(() => {});
      if (!reducido) latido.set(withRepeat(withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })), -1));
    }, MINIMO_MS);
    return () => clearTimeout(espera);
  }, [aro, latido, reducido]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ scale: latido.get() }] }));
  return (
    <Animated.View style={[st.circulo, estilo]}>
      <Pressable onPress={() => listo && alTocar()} disabled={!listo} accessibilityRole="button" accessibilityLabel={t('entrada.seguir')} accessibilityState={{ disabled: !listo }} hitSlop={10}>
        <Aro avance={aro} listo={listo} />
      </Pressable>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ el deslizador
type PropsDeDeslizador = { valor: number; min: number; max: number; paso: number; alCambiar: (v: number) => void; etiqueta: string };

/** Una pista con su perilla: se arrastra o se toca donde se quiere ir. */
export function Deslizador({ valor, min, max, paso, alCambiar, etiqueta }: PropsDeDeslizador) {
  const ancho = useSharedValue(1);
  const x = useSharedValue((valor - min) / (max - min));
  useEffect(() => {
    x.set((valor - min) / (max - min));
  }, [x, valor, min, max]);
  const aValor = (px: number) => {
    'worklet';
    const k = Math.min(1, Math.max(0, px / ancho.get()));
    return Math.round((min + k * (max - min)) / paso) * paso;
  };
  const mover = (px: number) => {
    'worklet';
    const v = aValor(px);
    x.set((v - min) / (max - min));
    scheduleOnRN(alCambiar, Math.round(v * 100) / 100);
  };
  const arrastre = usePanGesture({
    activeOffsetX: [-4, 4],
    onUpdate: (ev) => {
      'worklet';
      mover(ev.x);
    },
  });
  const toque = useTapGesture({
    onActivate: (ev) => {
      'worklet';
      mover(ev.x);
    },
  });
  const lleno = useAnimatedStyle(() => ({ width: `${x.get() * 100}%` }));
  const perilla = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * ancho.get() - 14 }] }));
  const pasoDeAccesibilidad = (signo: 1 | -1) => alCambiar(Math.min(max, Math.max(min, Math.round((valor + signo * paso) * 100) / 100)));
  return (
    <GestureDetector gesture={arrastre}>
      <GestureDetector gesture={toque}>
        <View
          style={st.deslizador}
          onLayout={(ev) => ancho.set(ev.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={etiqueta}
          accessibilityValue={{ min, max, now: valor }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(ev) => pasoDeAccesibilidad(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
        >
          <View style={st.pista}>
            <Animated.View style={[st.pistaLlena, lleno]} />
          </View>
          <Animated.View style={[st.perilla, perilla]} />
        </View>
      </GestureDetector>
    </GestureDetector>
  );
}

// ------------------------------------------------------------------ las opciones
export function Opcion({ titulo, detalle, elegida, alTocar, centrada }: { titulo: string; detalle?: string; elegida: boolean; alTocar: () => void; centrada?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        alTocar();
      }}
      style={[st.opcion, elegida && st.opcionElegida, centrada && st.opcionCentrada]}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida }}
    >
      <Text style={[st.opcionTitulo, centrada && { textAlign: 'center' }]}>{titulo}</Text>
      {detalle ? <Text style={st.opcionDetalle}>{detalle}</Text> : null}
    </Pressable>
  );
}

export function Boton({ texto, alTocar, tipo = 'principal', desactivado, icono }: { texto: string; alTocar: () => void; tipo?: 'principal' | 'secundario' | 'apple'; desactivado?: boolean; icono?: ReactNode }) {
  return (
    <Pressable
      onPress={alTocar}
      disabled={desactivado}
      style={({ pressed }) => [st.boton, tipo === 'principal' && st.botonPrincipal, tipo === 'secundario' && st.botonSecundario, tipo === 'apple' && st.botonApple, (pressed || desactivado) && { opacity: desactivado ? 0.35 : 0.85 }]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desactivado }}
    >
      {icono}
      <Text style={[st.botonTexto, tipo === 'principal' && { color: colores.tinta }, tipo === 'secundario' && { color: colores.oroClaro }, tipo === 'apple' && { color: '#000' }]}>{texto}</Text>
    </Pressable>
  );
}

/** Lo que se come vuela hasta la luna: unas chispas que llegan de todos lados. */
export function Chispas({ tam, reducido }: { tam: number; reducido: boolean }) {
  if (reducido) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { width: tam, height: tam }]} pointerEvents="none">
      {Array.from({ length: 7 }, (_, i) => <Chispa key={i} tam={tam} angulo={(i / 7) * Math.PI * 2 + 0.4} demora={200 + i * 220} />)}
    </View>
  );
}

function Chispa({ tam, angulo, demora }: { tam: number; angulo: number; demora: number }) {
  const u = useSharedValue(0);
  useEffect(() => {
    u.set(withDelay(demora, withTiming(1, { duration: 1100, easing: Easing.in(Easing.quad) })));
  }, [u, demora]);
  const estilo = useAnimatedStyle(() => {
    const d = 150 * (1 - u.get());
    return {
      opacity: u.get() <= 0 || u.get() >= 1 ? 0 : Math.min(1, u.get() * 4) * (1 - u.get() * 0.6),
      transform: [{ translateX: Math.cos(angulo) * d }, { translateY: Math.sin(angulo) * d }],
    };
  });
  return <Animated.View style={[st.chispa, { left: tam / 2 - 3.5, top: tam / 2 - 3.5 }, estilo]} />;
}

const st = StyleSheet.create({
  circulo: { alignSelf: 'center', width: 64, height: 64 },
  deslizador: { height: 44, justifyContent: 'center', marginTop: 26 },
  pista: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.14)' },
  pistaLlena: { height: '100%', backgroundColor: colores.oro },
  perilla: { position: 'absolute', left: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colores.cifra, shadowColor: colores.oro, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  opcion: { gap: 4, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  opcionElegida: { borderColor: 'rgba(232, 196, 106, 0.75)', backgroundColor: 'rgba(232, 196, 106, 0.1)', shadowColor: colores.oro, shadowOpacity: 0.18, shadowRadius: 11, shadowOffset: { width: 0, height: 0 } },
  opcionCentrada: { flex: 1, alignItems: 'center' },
  opcionTitulo: { fontFamily: letras.textoMedio, fontSize: 16, color: colores.pergamino },
  opcionDetalle: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.62)' },
  boton: { minHeight: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: 'transparent' },
  botonPrincipal: { backgroundColor: colores.oro },
  botonSecundario: { backgroundColor: 'rgba(6, 10, 22, 0.45)', borderColor: 'rgba(232, 196, 106, 0.45)' },
  botonApple: { backgroundColor: '#fff' },
  botonTexto: { fontFamily: letras.textoMedio, fontSize: 15.5, letterSpacing: 0.15 },
  chispa: { position: 'absolute', width: 7, height: 7, borderRadius: 3.5, backgroundColor: colores.cifra, shadowColor: colores.oroClaro, shadowOpacity: 0.8, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
});
