// La regla del ritmo (galeria/src/pagina.html, .pg-regla): la pista con las zonas viable, exigente y
// muy agresivo, la perilla que se arrastra o se toca donde se quiere ir, y debajo los tres ritmos de
// siempre, que se tocan. Como el deslizador de la entrada (entrada/piezas.tsx).

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';

/** La perilla: la pista va de su centro a su centro, como un input range. */
const PERILLA = 24;
const PASO = 0.01;

export type Marca = { clave: string; texto: string; pos: number; elegida: boolean; alTocar: () => void };

type Props = {
  valor: number; min: number; max: number;
  /** Dónde terminan lo viable y lo exigente, en % de la pista. */
  viable: number; exigente: number;
  etiqueta: string; textoDe: (v: number) => string;
  /** Mientras se arrastra (null al soltar sin cambiar) y al soltar. */
  alMover: (v: number) => void; alSoltar: (v: number) => void;
  marcas: Marca[];
};

const vibrar = () => {
  Haptics.selectionAsync().catch(() => {});
};

export function Regla({ valor, min, max, viable, exigente, etiqueta, textoDe, alMover, alSoltar, marcas }: Props) {
  const [ancho, setAncho] = useState(0);
  const util = useSharedValue(1);
  const fraccion = Math.min(1, Math.max(0, (valor - min) / (max - min)));
  const x = useSharedValue(fraccion);
  const ultimo = useSharedValue(valor);
  // Mientras se arrastra, la perilla es del dedo: lo que vuelve de JavaScript llega atrasado.
  const arrastrando = useRef(false);
  useEffect(() => {
    if (arrastrando.current) return;
    x.set(fraccion);
    ultimo.set(valor);
  }, [x, ultimo, fraccion, valor]);
  const empezar = () => {
    arrastrando.current = true;
  };
  const soltar = (v: number) => {
    arrastrando.current = false;
    alSoltar(v);
  };
  const mover = (px: number) => {
    'worklet';
    const k = Math.min(1, Math.max(0, (px - PERILLA / 2) / util.get()));
    const v = Math.round((min + k * (max - min)) / PASO) * PASO;
    x.set((v - min) / (max - min));
    const antes = ultimo.get();
    if (Math.abs(v - antes) < PASO / 2) return;
    ultimo.set(v);
    // Una muesca por cada décima de punto.
    if (Math.floor(v * 10 + 1e-6) !== Math.floor(antes * 10 + 1e-6)) scheduleOnRN(vibrar);
    scheduleOnRN(alMover, v);
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
      scheduleOnRN(soltar, ultimo.get());
    },
  });
  const toque = useTapGesture({
    onActivate: (ev) => {
      'worklet';
      mover(ev.x);
      scheduleOnRN(soltar, ultimo.get());
    },
  });
  const perilla = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() * util.get() }] }));
  const pasoDeVoiceOver = (signo: 1 | -1) => {
    const nuevo = Math.min(max, Math.max(min, Math.round((valor + signo * 0.05) * 100) / 100));
    if (nuevo === valor) return;
    alSoltar(nuevo);
    anunciar(textoDe(nuevo));
  };
  const enPista = (pct: number) => PERILLA / 2 + (pct / 100) * Math.max(0, ancho - PERILLA);
  return (
    <View style={st.regla}>
      <GestureDetector gesture={arrastre}>
        <GestureDetector gesture={toque}>
          <View
            style={st.toque}
            onLayout={(ev) => {
              setAncho(ev.nativeEvent.layout.width);
              util.set(Math.max(1, ev.nativeEvent.layout.width - PERILLA));
            }}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={etiqueta}
            accessibilityValue={{ min, max, now: valor, text: textoDe(valor) }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(ev) => pasoDeVoiceOver(ev.nativeEvent.actionName === 'increment' ? 1 : -1)}
          >
            <View style={st.pista}>
              <View style={[st.zona, st.viable, { left: 0, width: enPista(viable) }]} />
              <View style={[st.zona, st.exigente, { left: enPista(viable), width: Math.max(0, enPista(exigente) - enPista(viable)) }]} />
              <View style={[st.zona, st.agresivo, { left: enPista(exigente), right: 0 }]} />
            </View>
            <Animated.View style={[st.perilla, perilla]} />
          </View>
        </GestureDetector>
      </GestureDetector>
      <View style={st.marcas}>
        {marcas.map((m) => (
          <View key={m.clave} style={[st.marca, { left: `${m.pos}%` }]}>
            <Pressable
              onPress={() => {
                if (!m.elegida) vibrar();
                m.alTocar();
              }}
              style={({ pressed }) => [st.marcaDentro, pressed && { opacity: 0.6 }]}
              hitSlop={{ top: 8, bottom: 10, left: 4, right: 4 }}
              accessibilityRole="button"
              accessibilityState={{ selected: m.elegida }}
            >
              <View style={st.muesca} />
              <Text style={[st.marcaTexto, m.elegida && st.marcaElegida]} maxFontSizeMultiplier={1.2}>{m.texto}</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  regla: { paddingTop: 6, paddingBottom: 2 },
  toque: { height: PERILLA + 8, justifyContent: 'center' },
  pista: { height: 6, borderRadius: 6, overflow: 'hidden' },
  zona: { position: 'absolute', top: 0, bottom: 0 },
  viable: { backgroundColor: 'rgba(166, 191, 148, 0.6)' },
  exigente: { backgroundColor: 'rgba(232, 196, 106, 0.6)' },
  agresivo: { backgroundColor: 'rgba(231, 140, 128, 0.55)' },
  perilla: {
    position: 'absolute', left: 0, width: PERILLA, height: PERILLA, borderRadius: PERILLA / 2, backgroundColor: colores.cifra,
    shadowColor: colores.cifra, shadowOpacity: 0.55, shadowRadius: 7, shadowOffset: { width: 0, height: 0 },
    borderWidth: 4, borderColor: 'rgba(251, 242, 217, 0.85)',
  },
  marcas: { height: 30, marginHorizontal: PERILLA / 2 },
  marca: { position: 'absolute', top: 2 },
  marcaDentro: { alignItems: 'center', gap: 3, transform: [{ translateX: '-50%' }] },
  muesca: { width: 1, height: 5, backgroundColor: 'rgba(239, 230, 207, 0.3)' },
  marcaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.45)' },
  marcaElegida: { color: colores.pergamino },
});
