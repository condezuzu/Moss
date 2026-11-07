// Los botones de «−» y «+»: un toque da un paso; mantenido, repite y acelera, como los de iOS. Cada
// paso vibra apenas (la vibración de elegir), y el botón responde al apoyar el dedo. Cada pantalla
// pone su forma: este botón solo agrega el comportamiento.

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, type Insets, type StyleProp, type ViewStyle } from 'react-native';

/** Cuánto espera antes de repetir, y el paso más rápido al que llega (en ms). */
const ANTES_DE_REPETIR = 400;
const MAS_RAPIDO = 80;

/** Lo que falta para que un botón de `lado` puntos llegue a los 44 que pide Apple, repartido alrededor. */
export function margenDeToque(lado: number): Insets {
  const m = Math.max(0, Math.ceil((44 - lado) / 2));
  return { top: m, bottom: m, left: m, right: m };
}

type Props = {
  /** Da un paso. Si devuelve false (llegó al tope), no vibra y deja de repetir. */
  alPaso: () => boolean | void;
  etiqueta: string;
  /** El lado del botón dibujado, para completar los 44 puntos tocables. */
  lado?: number;
  desactivado?: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function BotonDePaso({ alPaso, etiqueta, lado = 38, desactivado, style, children }: Props) {
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const vueltas = useRef(0);
  // El paso de este render: al repetir, la pantalla ya se volvió a dibujar con el valor nuevo.
  const ultimo = useRef(alPaso);
  useEffect(() => {
    ultimo.current = alPaso;
  });
  const parar = () => {
    clearTimeout(espera.current);
    espera.current = undefined;
  };
  useEffect(() => parar, []);
  const paso = () => {
    if (ultimo.current() === false) {
      parar();
      return false;
    }
    Haptics.selectionAsync();
    return true;
  };
  const repetir = () => {
    vueltas.current += 1;
    if (!paso()) return;
    espera.current = setTimeout(repetir, Math.max(MAS_RAPIDO, 220 - vueltas.current * 25));
  };
  return (
    <Pressable
      disabled={desactivado}
      onPressIn={() => {
        vueltas.current = 0;
        parar();
        if (paso()) espera.current = setTimeout(repetir, ANTES_DE_REPETIR);
      }}
      onPressOut={parar}
      hitSlop={margenDeToque(lado)}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!desactivado }}
      style={({ pressed }) => [style, pressed && { opacity: 0.6, transform: [{ scale: 0.94 }] }, desactivado && { opacity: 0.35 }]}
    >
      {children}
    </Pressable>
  );
}
