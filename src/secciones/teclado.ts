// El teclado: su altura como número para React y como valor animado que sube y baja con él, con su
// misma duración. Así lo que está abajo (una hoja, la bandeja) acompaña al teclado en vez de saltar
// cuando ya terminó de subir. Y lo que se escribe queda a la vista (useCampoALaVista).

import { useEffect, useEffectEvent, useState } from 'react';
import { Keyboard, Platform, TextInput, type KeyboardEvent, type ScrollView } from 'react-native';
import { Easing, makeMutable, useReducedMotion, useSharedValue, withTiming, type AnimatedRef, type SharedValue } from 'react-native-reanimated';

import { t } from '@/textos';

// La curva del teclado de iOS, aproximada: arranca rápido y frena largo.
const CURVA = Easing.bezier(0.2, 0.9, 0.3, 1);

/**
 * Si el teclado está arriba (o subiendo), para los gestos: con el teclado arriba, bajar una hoja con
 * el dedo solo baja el teclado, como en iOS, y lo escrito no se pierde.
 */
export const tecladoArriba = makeMutable(false);
if (Platform.OS === 'ios') {
  Keyboard.addListener('keyboardWillShow', () => tecladoArriba.set(true));
  Keyboard.addListener('keyboardWillHide', () => tecladoArriba.set(false));
}

/** Para llamar desde un worklet con `scheduleOnRN`. */
export const bajarTeclado = () => Keyboard.dismiss();

/**
 * Los teclados de números de iOS no tienen tecla de retorno. React Native les pone arriba una barra
 * nativa con un botón cuando el campo trae `returnKeyType`: acá, con el texto en el idioma de Moss
 * (sin la etiqueta, salía «Done» o «Next» en inglés). «Siguiente» pasa al campo que sigue con
 * `onSubmitEditing` (con `submitBehavior="submit"`, el teclado queda); «Listo» lo cierra.
 */
export function tecladoDeNumeros(siguiente = false) {
  return siguiente
    ? ({ returnKeyType: 'next', inputAccessoryViewButtonLabel: t('comun.siguiente'), submitBehavior: 'submit', keyboardAppearance: 'dark' } as const)
    : ({ returnKeyType: 'done', inputAccessoryViewButtonLabel: t('comun.listo'), submitBehavior: 'blurAndSubmit', keyboardAppearance: 'dark' } as const);
}

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

/** El aire que queda entre el campo y el teclado (o el borde del scroll). */
const AIRE = 16;

/**
 * Lo que se escribe queda a la vista: cuando el teclado terminó de subir (o cambió, al pasar a otro
 * campo), si el campo enfocado está en este scroll y quedó tapado, por el teclado o por el borde del
 * scroll que se achicó con él, el scroll lo trae. Con `junto` (dónde termina, en el scroll, lo que va
 * con el campo: el botón de sumar de la ventana) trae también eso, si entra con el campo.
 */
export function useCampoALaVista(scroll: AnimatedRef<ScrollView>, scrollY: SharedValue<number>, junto?: () => number | null) {
  const reducido = useReducedMotion();
  const traer = useEffectEvent((arriba: number | null) => {
    const s = scroll.current;
    const campo = TextInput.State.currentlyFocusedInput();
    const adentro = s?.getInnerViewRef();
    if (!s || !campo || !adentro) return;
    // Un campo de afuera de este scroll no es su hijo: measureLayout falla y no se mueve nada.
    campo.measureLayout(adentro, (_x, y, _ancho, h) => {
      s.getNativeScrollRef()?.measureInWindow((_sx, sy, _sw, sh) => {
        const visible = (arriba !== null ? Math.min(sy + sh, arriba) : sy + sh) - sy;
        if (visible < 60) return;
        const actual = scrollY.get();
        const fin = Math.max(y + h, junto?.() ?? 0);
        const hasta = fin - y + 2 * AIRE <= visible ? fin : y + h;
        let destino = actual;
        if (hasta + AIRE > actual + visible) destino = hasta + AIRE - visible;
        if (y - AIRE < destino) destino = Math.max(0, y - AIRE);
        if (Math.abs(destino - actual) > 2) s.scrollTo({ y: destino, animated: !reducido });
      });
    }, () => {});
  });
  useEffect(() => {
    // En la web no hay teclado que tape.
    if (Platform.OS === 'web') return;
    let espera: ReturnType<typeof setTimeout> | undefined;
    // Un respiro: la hoja termina de subir o de achicarse con el teclado. Dónde empieza el teclado sale
    // del evento: `Keyboard.metrics()` no se pone al día cuando el teclado cambia de alto.
    const acomodar = (ev: KeyboardEvent) => {
      clearTimeout(espera);
      const arriba = ev.endCoordinates.height > 0 ? ev.endCoordinates.screenY : null;
      espera = setTimeout(() => traer(arriba), 80);
    };
    const subs = [Keyboard.addListener('keyboardDidShow', acomodar), Keyboard.addListener('keyboardDidChangeFrame', acomodar)];
    return () => {
      clearTimeout(espera);
      subs.forEach((x) => x.remove());
    };
  }, []);
}
