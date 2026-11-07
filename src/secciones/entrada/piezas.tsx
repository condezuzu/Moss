// Las piezas de la entrada, las de la galería (galeria/src/entrada.js): el deslizador de los
// números, las opciones y los botones. La estrella guía está en Guia.tsx y lo que se dibuja con Skia,
// en LienzosSkia.tsx.

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';

// ------------------------------------------------------------------ el deslizador
type PropsDeDeslizador = {
  valor: number; min: number; max: number; paso: number; alCambiar: (v: number) => void; etiqueta: string;
  /** Cómo se dice un valor («74,5 kg», «5′ 8″»): sin el texto, VoiceOver lo leía como un porcentaje. */
  textoDe: (v: number) => string;
  /** Cuánto cambia con VoiceOver: de a un kilo o un centímetro, no de a 0,1. */
  pasoDeAccesibilidad?: number;
};

const vibrar = () => {
  Haptics.selectionAsync().catch(() => {});
};

/** Una pista con su perilla: se arrastra o se toca donde se quiere ir. */
export function Deslizador({ valor, min, max, paso, alCambiar, etiqueta, textoDe, pasoDeAccesibilidad = paso }: PropsDeDeslizador) {
  const ancho = useSharedValue(1);
  const fraccion = Math.min(1, Math.max(0, (valor - min) / (max - min)));
  const x = useSharedValue(fraccion);
  // Lo último que se mandó: mientras el dedo no cambia el valor, JavaScript no se entera.
  const ultimo = useSharedValue(valor);
  // Mientras se arrastra, la perilla es del dedo: lo que vuelve de JavaScript llega atrasado y la haría saltar atrás.
  const arrastrando = useRef(false);
  useEffect(() => {
    if (arrastrando.current) return;
    x.set(fraccion);
    ultimo.set(valor);
  }, [x, ultimo, fraccion, valor]);
  const empezar = () => {
    arrastrando.current = true;
  };
  const soltar = () => {
    arrastrando.current = false;
  };
  const aValor = (px: number) => {
    'worklet';
    const k = Math.min(1, Math.max(0, px / ancho.get()));
    return Math.round(Math.round((min + k * (max - min)) / paso) * paso * 100) / 100;
  };
  const mover = (px: number) => {
    'worklet';
    const v = aValor(px);
    x.set((v - min) / (max - min));
    const antes = ultimo.get();
    if (v === antes) return;
    ultimo.set(v);
    // Una muesca por entero (kg, cm, año), como una rueda de iOS.
    if (Math.floor(v + 1e-6) !== Math.floor(antes + 1e-6)) scheduleOnRN(vibrar);
    scheduleOnRN(alCambiar, v);
  };
  const arrastre = usePanGesture({
    activeOffsetX: [-4, 4],
    onActivate: () => {
      'worklet';
      scheduleOnRN(empezar);
    },
    onUpdate: (ev) => {
      'worklet';
      mover(ev.x);
    },
    onFinalize: () => {
      'worklet';
      scheduleOnRN(soltar);
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
  const pasoDeVoiceOver = (signo: 1 | -1) => {
    const nuevo = Math.min(max, Math.max(min, Math.round((valor + signo * pasoDeAccesibilidad) * 100) / 100));
    if (nuevo === valor) return;
    alCambiar(nuevo);
    // VoiceOver lee el valor antes de que llegue el nuevo: se lo dice después.
    anunciar(textoDe(nuevo));
  };
  return (
    <GestureDetector gesture={arrastre}>
      <GestureDetector gesture={toque}>
        <View
          style={st.deslizador}
          onLayout={(ev) => ancho.set(ev.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={etiqueta}
          accessibilityValue={{ min, max, now: valor, text: textoDe(valor) }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(ev) => pasoDeVoiceOver(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
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
export function Opcion({ titulo, detalle, elegida, alTocar, centrada, desactivada }: { titulo: string; detalle?: string; elegida: boolean; alTocar: () => void; centrada?: boolean; desactivada?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        alTocar();
      }}
      disabled={desactivada}
      style={[st.opcion, elegida && st.opcionElegida, centrada && st.opcionCentrada, desactivada && { opacity: 0.45 }]}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegida, disabled: !!desactivada }}
    >
      {/* Las de una fila (Suave · Recomendado · Rápido) achican la letra antes que partir la palabra. */}
      <Text style={[st.opcionTitulo, centrada && st.centrado]} numberOfLines={centrada ? 1 : undefined} adjustsFontSizeToFit={centrada} minimumFontScale={0.8}>{titulo}</Text>
      {detalle ? <Text style={[st.opcionDetalle, centrada && st.centrado]}>{detalle}</Text> : null}
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

const st = StyleSheet.create({
  deslizador: { height: 44, justifyContent: 'center', marginTop: 26 },
  pista: { height: 4, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.14)' },
  pistaLlena: { height: '100%', backgroundColor: colores.oro },
  perilla: { position: 'absolute', left: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: colores.cifra, shadowColor: colores.oro, shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  opcion: { gap: 4, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  opcionElegida: { borderColor: 'rgba(232, 196, 106, 0.75)', backgroundColor: 'rgba(232, 196, 106, 0.1)', shadowColor: colores.oro, shadowOpacity: 0.18, shadowRadius: 11, shadowOffset: { width: 0, height: 0 } },
  // Centradas, el relleno de los costados no se ve: en un iPhone de 375, al texto le quedaban 70 puntos.
  opcionCentrada: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  centrado: { textAlign: 'center' },
  opcionTitulo: { fontFamily: letras.textoMedio, fontSize: 16, color: colores.pergamino },
  opcionDetalle: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.62)' },
  boton: { minHeight: 50, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: 'transparent' },
  botonPrincipal: { backgroundColor: colores.oro },
  botonSecundario: { backgroundColor: 'rgba(6, 10, 22, 0.45)', borderColor: 'rgba(232, 196, 106, 0.45)' },
  botonApple: { backgroundColor: '#fff' },
  botonTexto: { fontFamily: letras.textoMedio, fontSize: 15.5, letterSpacing: 0.15 },
});
