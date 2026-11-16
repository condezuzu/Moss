// Las piezas de la entrada, las de la galería (galeria/src/entrada.js): el deslizador de los
// números, las opciones, los botones y las del cuestionario nuevo (lo que crece y se achica, los pasos de a
// 15 minutos, los días de la semana). La estrella guía está en Guia.tsx y lo que se dibuja con Skia,
// en LienzosSkia.tsx.

import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { SEMANA, type DiaSemana } from '@/dominio/fechas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { Icono } from '../comida/comunes';
import { BotonDePaso } from '../paso';

// ------------------------------------------------------------------ el deslizador
type PropsDeDeslizador = {
  valor: number; min: number; max: number; paso: number; alCambiar: (v: number) => void; etiqueta: string;
  /** Cómo se dice un valor («74,5 kg», «5′ 8″»): sin el texto, VoiceOver lo leía como un porcentaje. */
  textoDe: (v: number) => string;
  /** Cuánto cambia con VoiceOver: de a un kilo o un centímetro, no de a 0,1. */
  pasoDeAccesibilidad?: number;
  style?: StyleProp<ViewStyle>;
};

const vibrar = () => {
  Haptics.selectionAsync().catch(() => {});
};

/** Una pista con su perilla: se arrastra o se toca donde se quiere ir. */
export function Deslizador({ valor, min, max, paso, alCambiar, etiqueta, textoDe, pasoDeAccesibilidad = paso, style }: PropsDeDeslizador) {
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
          style={[st.deslizador, style]}
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

// ------------------------------------------------------------------ las piezas del cuestionario nuevo
/** Lo que se corre cuando algo crece o se achica arriba: se acomoda, nunca salta. */
export const ACOMODA = LinearTransition.duration(320);
const CRECE = FadeInDown.duration(380);
const SE_ACHICA = FadeOut.duration(200).reduceMotion(ReduceMotion.Never);
const FUNDIDO = FadeIn.duration(300).reduceMotion(ReduceMotion.Never);

/** Lo que entra con la pantalla, un poco después de lo anterior; con Reducir movimiento, solo el fundido. */
export const entra = (reducido: boolean, demora = 0) => (reducido ? FadeIn.delay(demora).duration(300).reduceMotion(ReduceMotion.Never) : FadeInDown.delay(demora).duration(500));

/** La etiqueta chica de cada grupo: «QUÉ DÍAS», «A QUÉ RITMO». */
export function Etiqueta({ children, arriba = 18 }: { children: ReactNode; arriba?: number }) {
  return <Animated.Text layout={ACOMODA} style={[st.etiqueta, { marginTop: arriba }]}>{children}</Animated.Text>;
}

/** Lo que depende de lo elegido crece y se achica: nunca aparece ni desaparece de golpe. */
export function Plegable({ abierto, children, style }: { abierto: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducido = useReducedMotion();
  if (!abierto) return null;
  return <Animated.View entering={reducido ? FUNDIDO : CRECE} exiting={SE_ACHICA} layout={ACOMODA} style={style}>{children}</Animated.View>;
}

/** Un texto que cambia se apaga y se vuelve a prender con el nuevo. */
export function TextoQueCambia({ texto, style }: { texto: string; style?: StyleProp<TextStyle> }) {
  return (
    <Animated.View layout={ACOMODA}>
      <Animated.Text key={texto} entering={FUNDIDO} style={style}>{texto}</Animated.Text>
    </Animated.View>
  );
}

type FormaDeOpcion = 'fila' | 'chip' | 'segmento' | 'cuadro';

/**
 * Una opción del cuestionario: en fila (con su ícono a la izquierda y, si se elige más de una, su marca a la
 * derecha), en chip, en segmento (varias en una fila) o en cuadro (dos por fila). `abajo` va debajo del texto.
 */
export function Elegible({ titulo, detalle, elegida, alTocar, forma = 'fila', icono, marca, desactivada, demora = 0, abajo, chico, alto }: {
  titulo: string; detalle?: string | null; elegida: boolean; alTocar: () => void; forma?: FormaDeOpcion; icono?: SFSymbol; marca?: boolean;
  desactivada?: boolean; demora?: number; abajo?: ReactNode; chico?: boolean;
  /** En segmento, con el relleno de una opción grande (Femenino · Masculino). */
  alto?: boolean;
}) {
  const reducido = useReducedMotion();
  const centrada = forma === 'segmento';
  return (
    <Animated.View entering={entra(reducido, 320 + demora)} layout={ACOMODA} style={centrada || forma === 'cuadro' ? { flex: 1 } : undefined}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          alTocar();
        }}
        disabled={desactivada}
        style={({ pressed }) => [
          st.opcion, forma === 'chip' && st.chip, centrada && st.segmento, alto && { paddingVertical: 15, borderRadius: 16 }, forma === 'cuadro' && st.cuadro, forma === 'fila' && (icono || marca) && st.conIcono,
          elegida && st.opcionElegida, desactivada && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.98 }] },
        ]}
        accessibilityRole={marca ? 'checkbox' : 'radio'}
        accessibilityState={marca ? { checked: elegida, disabled: !!desactivada } : { selected: elegida, disabled: !!desactivada }}
      >
        {forma === 'chip' && marca && <Marca elegida={elegida} tam={18} />}
        {icono && (
          <View style={[st.icono, elegida && st.iconoElegido]}>
            <Icono nombre={icono} tam={16} color={elegida ? colores.oroClaro : 'rgba(239, 230, 207, 0.55)'} />
          </View>
        )}
        <View style={forma === 'chip' ? undefined : st.textos}>
          <Text
            style={[st.opcionTitulo, forma === 'chip' && st.chipTitulo, centrada && st.segmentoTitulo, alto && { fontSize: 16 }, forma === 'cuadro' && { fontSize: 14.5 }, chico && { fontSize: 12.5 }]}
            numberOfLines={centrada ? 1 : undefined}
            adjustsFontSizeToFit={centrada}
            minimumFontScale={0.75}
          >
            {titulo}
          </Text>
          {detalle ? <Text style={[st.opcionDetalle, centrada && st.segmentoDetalle]}>{detalle}</Text> : null}
          {abajo}
        </View>
        {forma === 'fila' && marca && <Marca elegida={elegida} tam={20} />}
      </Pressable>
    </Animated.View>
  );
}

function Marca({ elegida, tam }: { elegida: boolean; tam: number }) {
  const luz = useAnimatedStyle(() => ({ opacity: withTiming(elegida ? 1 : 0, { duration: 250, reduceMotion: ReduceMotion.Never }) }), [elegida]);
  return (
    <View style={[st.marca, { width: tam, height: tam, borderRadius: tam / 2 }]}>
      <Animated.View style={[StyleSheet.absoluteFill, st.marcaLlena, { borderRadius: tam / 2 }, luz]}>
        <Icono nombre="checkmark" tam={tam * 0.55} color={colores.tinta} peso="bold" />
      </Animated.View>
    </View>
  );
}

/** Un número de a pasos (la hora de a 15 minutos, la duración, la cinta, la fecha), con su menos y su más; mantenido, repite. */
export function Pasito({ valor, min, max, paso, formato, nombre, alCambiar, apagado, ancho = 62 }: {
  valor: number; min: number; max: number; paso: number; formato: (x: number) => string; nombre: string; alCambiar: (x: number) => void; apagado?: boolean; ancho?: number;
}) {
  const dar = (signo: 1 | -1) => {
    const nuevo = Math.min(max, Math.max(min, Math.round((valor + signo * paso) * 100) / 100));
    if (nuevo === valor) return false;
    alCambiar(nuevo);
    anunciar(formato(nuevo));
  };
  return (
    <View style={st.pasito}>
      <BotonDePaso alPaso={() => dar(-1)} etiqueta={`${nombre}: ${t('entrada.cuestionario.menos')}`} lado={32} style={st.pasitoBoton}>
        <Icono nombre="minus" tam={14} peso="semibold" />
      </BotonDePaso>
      <Text style={[st.pasitoValor, { minWidth: ancho }, apagado && { color: 'rgba(239, 230, 207, 0.4)' }]} numberOfLines={1}>{formato(valor)}</Text>
      <BotonDePaso alPaso={() => dar(1)} etiqueta={`${nombre}: ${t('entrada.cuestionario.mas')}`} lado={32} style={st.pasitoBoton}>
        <Icono nombre="plus" tam={14} peso="semibold" />
      </BotonDePaso>
    </View>
  );
}

/** Los días de la semana, de lunes a domingo: varios, o uno solo (el del partido). */
export function Dias({ elegidos, alCambiar, uno }: { elegidos: readonly DiaSemana[]; alCambiar: (dias: DiaSemana[]) => void; uno?: boolean }) {
  const iniciales = lista('entrada.cuestionario.entreno.iniciales');
  const nombres = lista('fecha.dias');
  return (
    <Animated.View layout={ACOMODA} style={st.dias}>
      {SEMANA.map((d, k) => {
        const si = elegidos.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              alCambiar(uno ? [d] : si ? elegidos.filter((x) => x !== d) : [...elegidos, d]);
            }}
            style={[st.dia, si && st.diaElegido]}
            hitSlop={3}
            accessibilityRole={uno ? 'radio' : 'checkbox'}
            accessibilityLabel={nombres[d]}
            accessibilityState={uno ? { selected: si } : { checked: si }}
          >
            <Text style={[st.diaTexto, si && { color: colores.oroClaro }]}>{iniciales[k]}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

/** Un botón chico que se prende y se apaga: «Varía», «No lo sé». */
export function Interruptor({ texto, prendido, alTocar }: { texto: string; prendido: boolean; alTocar: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        alTocar();
      }}
      style={[st.interruptor, prendido && st.diaElegido]}
      hitSlop={4}
      accessibilityRole="switch"
      accessibilityState={{ checked: prendido }}
    >
      <Text style={[st.diaTexto, prendido && { color: colores.oroClaro }]}>{texto}</Text>
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
  etiqueta: { marginBottom: 9, fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 1.9, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  conIcono: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  textos: { flex: 1, gap: 3 },
  icono: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', alignItems: 'center', justifyContent: 'center' },
  iconoElegido: { borderColor: 'rgba(232, 196, 106, 0.6)', shadowColor: colores.oro, shadowOpacity: 0.3, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8, paddingLeft: 9, paddingRight: 13, borderRadius: 999 },
  chipTitulo: { fontFamily: letras.texto, fontSize: 14 },
  segmento: { alignItems: 'center', paddingVertical: 11, paddingHorizontal: 4, borderRadius: 14 },
  segmentoTitulo: { fontSize: 13.5, textAlign: 'center' },
  segmentoDetalle: { fontFamily: letras.numero, fontSize: 11.5, lineHeight: 14, textAlign: 'center' },
  cuadro: { flex: 1, padding: 12, justifyContent: 'center' },
  marca: { borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.25)', overflow: 'hidden' },
  marcaLlena: { backgroundColor: colores.oro, alignItems: 'center', justifyContent: 'center' },
  pasito: { flexDirection: 'row', alignItems: 'center', gap: 2, padding: 3, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.5)', alignSelf: 'flex-start' },
  pasitoBoton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasitoValor: { textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 16, color: colores.cifra, fontVariant: ['tabular-nums'] },
  dias: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dia: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)', backgroundColor: 'rgba(6, 10, 22, 0.5)', alignItems: 'center', justifyContent: 'center' },
  diaElegido: { backgroundColor: 'rgba(232, 196, 106, 0.16)', borderColor: 'rgba(232, 196, 106, 0.8)', shadowColor: colores.oro, shadowOpacity: 0.25, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  diaTexto: { fontFamily: letras.textoMedio, fontSize: 13.5, color: 'rgba(239, 230, 207, 0.72)' },
  interruptor: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)', backgroundColor: 'rgba(6, 10, 22, 0.5)' },
});
