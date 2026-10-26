// El teclado: su altura como número para React y como valor animado que sube y baja con él, con su
// misma duración. Así lo que está abajo (una hoja, la bandeja) acompaña al teclado en vez de saltar
// cuando ya terminó de subir.

import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

// La curva del teclado de iOS, aproximada: arranca rápido y frena largo.
const CURVA = Easing.bezier(0.2, 0.9, 0.3, 1);

export function useTeclado(): { alto: number; animado: SharedValue<number> } {
  const [alto, setAlto] = useState(0);
  const animado = useSharedValue(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const cambiar = (h: number, ms: number | undefined) => {
      setAlto(h);
      animado.set(withTiming(h, { duration: ms || 250, easing: CURVA }));
    };
    const mostrar = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (ev) => cambiar(ev.endCoordinates.height, ev.duration));
    const ocultar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (ev) => cambiar(0, ev.duration));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, [animado]);
  return { alto, animado };
}
