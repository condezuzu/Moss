// Un alimento anotado de la línea del día (la galería 46, aprobada el 9/11/2026). Deslizado a la izquierda,
// destapa «Borrar» desde el borde: soltado a la mitad queda abierto, y pasado el tope (un poco más de la mitad
// de la fila) vibra, el rojo la llena y al soltarlo se borra, sin preguntar (el aviso lo deshace). Mantenido
// apretado, se hunde apenas y a los 350 ms abre su menú (MenuFlotante). Para la derecha, con la fila cerrada,
// el gesto es de las pestañas. Abierta hay una sola: tocar en otro lado la cierra.

import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type Insets, type StyleProp, type ViewInstance, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { Easing, interpolateColor, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/textos';
import { letras } from '@/tema';
import { alSoltarLaFila, ANCHO_DE_BORRAR, seguirAlDedo, topeDeBorrar, type Rect } from './menuDeComida';
import { accionesDelMenu } from './MenuFlotante';

// La fila abierta, una sola en toda la línea, y si el toque que empieza fue en ella.
let abierta: { id: string; cerrar: () => void } | null = null;
let tocoLaAbierta = false;

function ponerAbierta(id: string, cerrar: () => void) {
  if (abierta && abierta.id !== id) abierta.cerrar();
  abierta = { id, cerrar };
}

function quitarAbierta(id: string) {
  if (abierta?.id === id) abierta = null;
}

/** Para el `onTouchStart` de la página: un toque que empieza afuera de la fila abierta la cierra. */
export function alTocarLaPagina() {
  if (!tocoLaAbierta) abierta?.cerrar();
  tocoLaAbierta = false;
}

/** Cierra la fila abierta (al dejar la sección o con una hoja encima). */
export function cerrarLaFilaAbierta() {
  abierta?.cerrar();
}

function marcarToque(id: string) {
  if (abierta?.id === id) tocoLaAbierta = true;
}

/** Las esquinas de «Borrar». */
const RADIO = 8;
const ROJO = '#a9503f';
const ROJO_LLENO = '#c05a46';
const CURVA = Easing.bezier(0.2, 0.8, 0.2, 1);

const vibrarEnElTope = (adentro: boolean) => {
  if (adentro) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
};

type Props = {
  id: string;
  /** Lo que dice VoiceOver de la fila. */
  etiqueta: string;
  alTocar: () => void;
  /** Mantenida (o «Copiar a…» y «Mover a…» de VoiceOver, con `en`): su lugar en la pantalla y su opacidad, para el menú. */
  alMenu: (rect: Rect, visible: SharedValue<number>, en?: 'copiar' | 'mover') => void;
  alBorrar: () => void;
  /** Hasta dónde llega el toque afuera de la fila (los 44 puntos). */
  margen: Insets;
  estilo: StyleProp<ViewStyle>;
  estiloApretado: StyleProp<ViewStyle>;
  children: ReactNode;
};

export function FilaQueSeDesliza({ id, etiqueta, alTocar, alMenu, alBorrar, margen, estilo, estiloApretado, children }: Props) {
  const reducido = useReducedMotion();
  const fila = useRef<ViewInstance>(null);
  const [estaAbierta, setEstaAbierta] = useState(false);
  const borrando = useRef(false);
  const ancho = useSharedValue(0);
  const anchoDelTexto = useSharedValue(0);
  // Cuánto se corrió lo de adelante (negativo, a la izquierda), desde dónde arrancó el dedo y si pasó el tope.
  const x = useSharedValue(0);
  const desde = useSharedValue(0);
  const pasado = useSharedValue(false);
  // De 0 a 1: el rojo que llena la fila pasado el tope.
  const lleno = useSharedValue(0);
  const apretando = useSharedValue(0);
  const visible = useSharedValue(1);
  // Con Reducir movimiento la fila no viaja sola más de lo justo: vuelve o se abre corto y sin rebote.
  const viaje = { duration: reducido ? 160 : 300, easing: CURVA, reduceMotion: ReduceMotion.Never };

  const alCerrarse = () => {
    quitarAbierta(id);
    setEstaAbierta(false);
  };
  const cerrar = () => {
    pasado.set(false);
    lleno.set(withTiming(0, { duration: 180 }));
    x.set(withTiming(0, viaje));
    alCerrarse();
  };
  const alAbrirse = () => {
    ponerAbierta(id, cerrar);
    setEstaAbierta(true);
  };
  useEffect(() => () => quitarAbierta(id), [id]);

  /** Se va del todo a la izquierda, con el rojo lleno, y recién ahí se borra (se va con su fundido y lo de abajo se acomoda). */
  const borrar = (yaVibro: boolean) => {
    if (borrando.current) return;
    borrando.current = true;
    quitarAbierta(id);
    if (!yaVibro) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (reducido) {
      alBorrar();
      return;
    }
    lleno.set(withTiming(1, { duration: 150 }));
    x.set(withTiming(-ancho.get(), { duration: 200, easing: CURVA }, (fin) => {
      if (fin) scheduleOnRN(alBorrar);
    }));
  };

  const medirYAbrir = (en?: 'copiar' | 'mover') => {
    fila.current?.measureInWindow((mx, my, w, h) => alMenu({ x: mx, y: my, ancho: w, alto: h }, visible, en));
  };
  // Mantener apretado es el del botón de la fila (onLongPress) y no un gesto aparte: con el botón adentro, un
  // gesto de mantener no se enteraba en la web. Deslizar sí es un gesto: al arrancar, cancela el apretón.
  // En la web, soltar después de deslizar también llega como toque: ese no abre el alimento ni cierra la fila
  // (en el teléfono, el gesto al arrancar ya cancela el toque). Se desmarca al apoyar el dedo, con el gesto: el
  // toque de la web empieza 50 ms tarde, cuando el gesto ya pudo arrancar.
  const deslizada = useRef(false);
  const hundir = () => {
    if (!estaAbierta && !reducido) apretando.set(withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }));
  };
  const soltarElApreton = () => apretando.set(withTiming(0, { duration: 160 }));
  const apoyar = () => {
    deslizada.current = false;
  };
  const alDeslizar = () => {
    deslizada.current = true;
    soltarElApreton();
  };
  const mantenida = () => {
    if (deslizada.current) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    medirYAbrir();
  };

  const desliza = usePanGesture({
    // Cerrada, solo arranca hacia la izquierda y antes que la tira de las secciones (14 puntos): para la
    // derecha es de las pestañas. Abierta, también hacia la derecha, para cerrarla.
    activeOffsetX: estaAbierta ? ([-10, 10] as [number, number]) : -10,
    failOffsetY: [-10, 10],
    onBegin: () => {
      'worklet';
      scheduleOnRN(apoyar);
    },
    onActivate: (ev) => {
      'worklet';
      // Sin el trecho que hizo falta para arrancar: así no salta.
      desde.set(x.get() - ev.translationX);
      scheduleOnRN(alDeslizar);
    },
    onUpdate: (ev) => {
      'worklet';
      const tope = topeDeBorrar(ancho.get());
      const nx = seguirAlDedo(desde.get(), ev.translationX, tope);
      const ahora = -nx >= tope;
      if (ahora !== pasado.get()) {
        pasado.set(ahora);
        lleno.set(withTiming(ahora ? 1 : 0, { duration: 180 }));
        scheduleOnRN(vibrarEnElTope, ahora);
      }
      x.set(nx);
    },
    onDeactivate: (ev) => {
      'worklet';
      const que = ev.canceled ? 'cerrar' : alSoltarLaFila(x.get(), ev.velocityX, topeDeBorrar(ancho.get()));
      if (que === 'borrar') {
        scheduleOnRN(borrar, true);
        return;
      }
      pasado.set(false);
      lleno.set(withTiming(0, { duration: 180 }));
      if (que === 'abrir') {
        x.set(withTiming(-ANCHO_DE_BORRAR, viaje));
        scheduleOnRN(alAbrirse);
      } else {
        x.set(withTiming(0, viaje));
        scheduleOnRN(alCerrarse);
      }
    },
  });

  const estiloFila = useAnimatedStyle(() => ({ opacity: visible.get() }));
  // Mientras se mantiene, se hunde apenas (no la fila que se mide para el menú: lo de adentro).
  const estiloHundida = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.018 * apretando.get() }] }));
  const estiloFrente = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));
  // «Borrar» se destapa desde el borde con sus esquinas redondas: dos puntas fijas a los lados y el medio que
  // se estira, todo con transform (cambiar el ancho rehace el diseño en cada cuadro).
  const color = () => {
    'worklet';
    return interpolateColor(lleno.get(), [0, 1], [ROJO, ROJO_LLENO]);
  };
  const estiloPuntaDerecha = useAnimatedStyle(() => ({ opacity: x.get() < -0.5 ? 1 : 0, backgroundColor: color() }));
  const estiloMedio = useAnimatedStyle(() => ({
    backgroundColor: color(),
    transform: [{ scaleX: ancho.get() > 0 ? Math.max(0, -x.get() - 2 * RADIO) / ancho.get() : 0 }],
  }));
  const estiloPuntaIzquierda = useAnimatedStyle(() => ({
    opacity: x.get() < -0.5 ? 1 : 0,
    backgroundColor: color(),
    transform: [{ translateX: Math.min(RADIO, x.get() + RADIO) }],
  }));
  // El texto, al medio de lo destapado; pasado el tope, contra su borde izquierdo. Aparece cuando entra.
  const estiloTexto = useAnimatedStyle(() => {
    const w = ancho.get();
    const l = anchoDelTexto.get();
    const v = -x.get();
    const centrado = w - v / 2 - l / 2;
    const alBorde = w - v + 14;
    return { opacity: Math.min(1, Math.max(0, (v - l * 0.6) / 24)), transform: [{ translateX: centrado + (alBorde - centrado) * lleno.get() }] };
  });

  return (
    <GestureDetector gesture={desliza}>
      <Animated.View
        ref={fila}
        collapsable={false}
        style={[st.fila, estiloFila]}
        hitSlop={margen}
        onLayout={(ev) => ancho.set(ev.nativeEvent.layout.width)}
        onTouchStart={() => marcarToque(id)}
      >
        <Animated.View style={estiloHundida} hitSlop={margen}>
          <View style={st.atras} pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Animated.View style={[st.medio, estiloMedio]} />
            <Animated.View style={[st.puntaDerecha, estiloPuntaDerecha]} />
            <Animated.View style={[st.puntaIzquierda, estiloPuntaIzquierda]} />
            <Animated.View style={[st.texto, estiloTexto]} onLayout={(ev) => anchoDelTexto.set(ev.nativeEvent.layout.width)}>
              <Text style={st.textoBorrar} numberOfLines={1} maxFontSizeMultiplier={1.3}>{t('comida.menu.borrar')}</Text>
            </Animated.View>
          </View>
          {/* Abierta, tocar «Borrar» borra; cerrada, lo de adelante lo tapa. */}
          <Pressable
            style={st.boton}
            onPress={() => borrar(false)}
            pointerEvents={estaAbierta ? 'auto' : 'none'}
            accessible={false}
            importantForAccessibility="no"
          />
          <Animated.View style={estiloFrente} hitSlop={margen}>
            <Pressable
              // Abierta, tocarla la cierra en vez de abrir el alimento.
              onPress={() => {
                if (deslizada.current) return;
                if (estaAbierta) cerrar();
                else alTocar();
              }}
              onLongPress={estaAbierta ? undefined : mantenida}
              delayLongPress={350}
              onPressIn={hundir}
              onPressOut={soltarElApreton}
              style={({ pressed }) => [estilo, pressed && !estaAbierta && estiloApretado]}
              hitSlop={margen}
              accessibilityRole="button"
              accessibilityLabel={etiqueta}
              accessibilityActions={accionesDelMenu()}
              onAccessibilityAction={(ev) => {
                const accion = ev.nativeEvent.actionName;
                if (accion === 'borrar') alBorrar();
                else if (accion === 'copiar' || accion === 'mover') medirYAbrir(accion);
              }}
            >
              {children}
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const st = StyleSheet.create({
  // Corrida, lo de adelante sale por la izquierda: se recorta en recto (con esquinas, iOS la dibujaría aparte).
  fila: { marginHorizontal: -6, overflow: 'hidden' },
  atras: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  medio: { position: 'absolute', top: 0, bottom: 0, right: RADIO, width: '100%', transformOrigin: '100% 50%' },
  puntaDerecha: { position: 'absolute', top: 0, bottom: 0, right: 0, width: RADIO, borderTopRightRadius: RADIO, borderBottomRightRadius: RADIO },
  puntaIzquierda: { position: 'absolute', top: 0, bottom: 0, right: 0, width: RADIO, borderTopLeftRadius: RADIO, borderBottomLeftRadius: RADIO },
  texto: { position: 'absolute', top: 0, bottom: 0, left: 0, justifyContent: 'center' },
  textoBorrar: { fontFamily: letras.textoMedio, fontSize: 13, color: '#fff1ea' },
  boton: { position: 'absolute', top: 0, bottom: 0, right: 0, width: ANCHO_DE_BORRAR },
});
