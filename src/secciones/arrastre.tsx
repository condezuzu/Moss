// Bajar una hoja con el dedo para cerrarla, como en iOS (lo pediste el 5/11/2026): desde la pestañita
// o la cabecera siempre, y desde lo de adentro solo con su scroll arriba de todo, así no se pelea con
// el scroll. Al soltar, se cierra si bajó bastante o con un tirón corto; si no, vuelve a su lugar con
// un resorte que sale con la velocidad del dedo. Con Reducir movimiento vuelve derecho, sin rebote, y
// se va con el fundido de la hoja, sin viajar.

import { useCallback, useEffect, type ComponentProps, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ScrollView as ScrollDeRN, type StyleProp, type ViewStyle } from 'react-native';
import { GestureDetector, ScrollView, usePanGesture, type PanGestureConfig } from 'react-native-gesture-handler';
import {
  Easing, ReduceMotion, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useReducedMotion, useScrollOffset, useSharedValue, withSpring, withTiming,
  type AnimatedRef, type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { entre, LLEGA } from './movimiento';
import { bajarTeclado, tecladoArriba } from './teclado';

/** Un tirón hacia abajo más rápido que esto (puntos por segundo) cierra aunque la hoja haya bajado poco. */
const TIRON = 650;
/** La vuelta: un resorte que apenas rebota, así la hoja no se despega del borde de abajo. */
const RESORTE = { mass: 1, stiffness: 320, damping: 30 };

/** Si la hoja se cierra al soltarla: bajó un cuarto de su alto (entre 90 y 160 puntos) o fue un tirón. */
export function seCierra(y: number, alto: number, velocidad: number): boolean {
  'worklet';
  if (y < 4) return false;
  return velocidad > TIRON || (y > entre(alto * 0.25, 90, 160) && velocidad > -TIRON);
}

/** La vuelta a su lugar: un resorte con la velocidad del dedo; con Reducir movimiento, derecho y corto. */
export function vuelta(hasta: number, velocidad: number, reducido: boolean) {
  'worklet';
  return reducido
    ? withTiming(hasta, { duration: 180, easing: LLEGA, reduceMotion: ReduceMotion.Never })
    : withSpring(hasta, { ...RESORTE, velocity: velocidad });
}

/** Cómo se mueve una hoja: cuánto bajó (en puntos; 0 es abierta), cómo sigue al dedo y qué hace al soltarla. */
export type Movimiento = {
  bajada: () => number;
  mover: (y: number) => void;
  soltar: (y: number, velocidad: number, puedeCerrar: boolean) => void;
};

export type Arrastre = {
  cabeza: PanGestureConfig;
  contenido: PanGestureConfig;
  scroll: AnimatedRef<ScrollDeRN>;
  scrollY: SharedValue<number>;
};

/**
 * Los gestos de una hoja: el de la cabecera, que siempre la baja, y el de lo de adentro, que solo se
 * arma con su scroll arriba de todo y solo arranca hacia abajo (para arriba es scroll). `activo` en
 * false (mientras guarda, o con algo a medio escribir) los apaga. `conScroll` en false cuando no hay
 * scroll armado (la hoja de un Modal cerrado, o una que se baja solo desde la cabecera).
 */
export function useArrastre(m: Movimiento, activo: boolean, conScroll = true): Arrastre {
  const desde = useSharedValue(0);
  const arrastrando = useSharedValue(false);
  // Cuánto la bajó el dedo en este arrastre, y si la bajó desde lo de adentro.
  const bajo = useSharedValue(0);
  const porAdentro = useSharedValue(false);
  const scroll = useAnimatedRef<ScrollDeRN>();
  // Sin el scroll armado, Reanimated avisa que el ref no está: no se lo mira.
  const scrollY = useScrollOffset(conScroll ? scroll : null);
  const puede = useSharedValue(activo);
  const conContenido = useSharedValue(activo);
  useEffect(() => {
    puede.set(activo);
    conContenido.set(activo && scrollY.get() <= 1);
  }, [activo, puede, conContenido, scrollY]);
  useAnimatedReaction(
    () => scrollY.get() <= 1,
    (arriba, antes) => {
      if (arriba !== antes && !arrastrando.get()) conContenido.set(arriba && puede.get());
    },
  );
  // Bajándola desde lo de adentro, lo de adentro queda quieto: si el dedo vuelve a subir, sube la hoja y no el scroll.
  useAnimatedReaction(
    () => scrollY.get(),
    (y) => {
      if (arrastrando.get() && porAdentro.get() && y > 0 && bajo.get() > 0) scrollTo(scroll, 0, 0, false);
    },
  );

  const empezar = (traslado: number, adentro: boolean) => {
    'worklet';
    // Con el teclado arriba, el gesto de bajar es el de iOS para esconderlo: baja el teclado y la hoja
    // queda, con lo escrito. El próximo arrastre ya baja la hoja.
    if (tecladoArriba.get()) {
      scheduleOnRN(bajarTeclado);
      return;
    }
    arrastrando.set(true);
    porAdentro.set(adentro);
    // Desde donde está y sin el trecho que hizo falta para arrancar: así no salta.
    desde.set(m.bajada() - traslado);
  };
  const seguir = (traslado: number) => {
    'worklet';
    if (!arrastrando.get()) return;
    const y = Math.max(0, desde.get() + traslado);
    bajo.set(y);
    m.mover(y);
  };
  const terminar = (traslado: number, velocidad: number, cancelado: boolean) => {
    'worklet';
    if (!arrastrando.get()) return;
    arrastrando.set(false);
    bajo.set(0);
    m.soltar(Math.max(0, desde.get() + traslado), velocidad, !cancelado);
    conContenido.set(puede.get() && scrollY.get() <= 1);
  };
  const cabeza: PanGestureConfig = {
    enabled: activo,
    activeOffsetY: [-6, 6],
    // De costado es de lo de adentro (las pastillas de la comida).
    failOffsetX: [-14, 14],
    onActivate: (ev) => {
      'worklet';
      empezar(ev.translationY, false);
    },
    onUpdate: (ev) => {
      'worklet';
      seguir(ev.translationY);
    },
    onDeactivate: (ev) => {
      'worklet';
      terminar(ev.translationY, ev.velocityY, ev.canceled);
    },
  };
  const contenido: PanGestureConfig = {
    enabled: conContenido,
    activeOffsetY: 8,
    failOffsetY: -6,
    failOffsetX: [-18, 18],
    onActivate: (ev) => {
      'worklet';
      empezar(ev.translationY, true);
    },
    onUpdate: cabeza.onUpdate,
    onDeactivate: cabeza.onDeactivate,
  };
  return { cabeza, contenido, scroll, scrollY };
}

/**
 * Una hoja que baja con el dedo y lleva su propia bajada: se cierra yéndose para abajo con la velocidad
 * del dedo y recién abajo llama a `alCerrar`. Con Reducir movimiento llama enseguida: el fundido de la
 * hoja (el del Modal o su `exiting`) la saca desde donde quedó.
 */
export function useBajarParaCerrar({ alCerrar, activo = true, conScroll = true }: { alCerrar: () => void; activo?: boolean; conScroll?: boolean }) {
  const reducido = useReducedMotion();
  const alto = useSharedValue(0);
  const bajada = useSharedValue(0);
  const cerrar = () => alCerrar();
  const arrastre = useArrastre({
    bajada: () => {
      'worklet';
      return bajada.get();
    },
    mover: (y) => {
      'worklet';
      bajada.set(y);
    },
    soltar: (y, velocidad, puedeCerrar) => {
      'worklet';
      if (puedeCerrar && seCierra(y, alto.get(), velocidad)) {
        if (reducido) {
          scheduleOnRN(cerrar);
          return;
        }
        const fuera = alto.get() + 40;
        // Sigue con la velocidad del dedo: cuanto más fuerte el tirón, más corto el viaje.
        const ms = entre(((fuera - y) * 2000) / Math.max(velocidad, 1), 160, 300);
        bajada.set(withTiming(fuera, { duration: ms, easing: Easing.out(Easing.quad) }, (fin) => {
          if (fin) scheduleOnRN(cerrar);
        }));
        return;
      }
      bajada.set(vuelta(0, velocidad, reducido));
    },
  }, activo, conScroll);
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: Math.max(0, bajada.get()) }] }));
  // El fondo oscuro se aclara a medida que la hoja baja.
  const velo = useAnimatedStyle(() => ({ opacity: alto.get() > 0 ? entre(1 - bajada.get() / alto.get(), 0, 1) : 1 }));
  const medir = useCallback((ev: LayoutChangeEvent) => alto.set(ev.nativeEvent.layout.height), [alto]);
  /** Para la hoja que queda armada entre una vez y otra: al abrirse, en su lugar. */
  const reiniciar = useCallback(() => bajada.set(0), [bajada]);
  return { ...arrastre, bajada, estilo, velo, medir, reiniciar };
}

/** La cabecera de una hoja (la pestañita, el título): bajarla siempre baja la hoja. */
export function CabezaQueBaja({ arrastre, style, children }: { arrastre: Arrastre; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const gesto = usePanGesture(arrastre.cabeza);
  return (
    <GestureDetector gesture={gesto}>
      <View collapsable={false} style={style}>{children}</View>
    </GestureDetector>
  );
}

type PropsDelScroll = Omit<ComponentProps<typeof ScrollView>, 'ref' | 'simultaneousWith'> & { arrastre: Arrastre; lugar?: StyleProp<ViewStyle> };

/**
 * El scroll de una hoja: arriba de todo, bajarlo baja la hoja; si no, es scroll. No rebota: arriba,
 * el dedo que baja ya baja la hoja. Arrastrarlo baja el teclado, y el primer toque en un botón con el
 * teclado arriba ya cuenta (no se pierde en bajar el teclado).
 */
export function ScrollQueBaja({ arrastre: { contenido, scroll: scrollRef }, lugar, children, ...props }: PropsDelScroll) {
  const gesto = usePanGesture(contenido);
  return (
    <GestureDetector gesture={gesto}>
      <View collapsable={false} style={[estilos.lugar, lugar]}>
        <ScrollView
          ref={scrollRef}
          simultaneousWith={gesto}
          bounces={false}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          {...props}
        >
          {children}
        </ScrollView>
      </View>
    </GestureDetector>
  );
}

const estilos = StyleSheet.create({
  // Que se achique hasta el tope de la hoja: así su scroll scrollea y lo de abajo queda a la vista.
  lugar: { flexShrink: 1 },
});
