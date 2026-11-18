// La entrada a Ascent, arriba a la derecha del encabezado de Progreso (galeria/src/ascent.js, .as-entrada): el
// planeta de Ascent con su órbita y la luna de Moss, y lo de hoy en dos palabras, sin porcentaje («Sin ir al
// fallo», «Hoy descansas»…) con la sesión («Piernas · 18:40»). Sin vincular, la órbita abierta, como en el ícono, y
// «Vincular con Ascent» (sin Ascent en el iPhone, «Ascent»). Si algo pone el límite hoy, la órbita va en terracota.
// Debajo, «Desliza hacia abajo» con su flecha, hasta que se abre una vez: al volver a Progreso se pliega a la vista.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, LinearTransition, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useAscent } from '@/almacen/ascent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { hora } from '../comida/datos';
import { C } from './colores';
import { Orbe } from './Orbe';
import { enFrase, tx } from './palabras';
import { useAhora, useHoyEnAscent } from './titularDeHoy';
import { useHayAscent } from './useHayAscent';

/** Lo que pasa una sola vez, guardado en el teléfono: null mientras no se sabe. */
export function useUnaVez(clave: string): [boolean | null, () => void] {
  const [hecha, setHecha] = useState<boolean | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(clave).then((x) => setHecha(x === '1')).catch(() => setHecha(false));
  }, [clave]);
  const marcar = useCallback(() => {
    setHecha(true);
    AsyncStorage.setItem(clave, '1').catch(() => {});
  }, [clave]);
  return [hecha, marcar];
}

/** Ya se abrió Ascent alguna vez: la pista se pliega. */
export const YA_SE_ABRIO = 'moss:seAbrioAscent';

export function EntradaDeAscent({ alAbrir, conPista }: { alAbrir: () => void; conPista: boolean }) {
  const { vinculo } = useAscent();
  const instalada = useHayAscent();
  const h = useHoyEnAscent(useAhora());
  const vinculada = vinculo.vinculada && !!h;
  let cifra: string;
  let sub = '';
  if (!vinculada || !h) cifra = t(instalada === false ? 'ascent.senal.marca' : 'ascent.senal.vincular');
  else {
    cifra = tx(`ascent.entrada.titular.${h.titular.que}`);
    const s = h.sesion;
    sub = !s ? (h.sabeCuandoEntrena ? t('ascent.entrada.descanso') : '') : s.como === 'hecha' ? t('ascent.senal.hoy', { sesion: enFrase(s.nombre) }) : t('ascent.entrada.sesion', { sesion: s.nombre, hora: hora(s.inicio) });
  }
  const etiqueta = vinculada ? t('ascent.entrada.etiquetaTitular', { titular: cifra }) : t('ascent.flecha');
  return (
    <Pressable onPress={alAbrir} style={({ pressed }) => [st.entrada, pressed && st.apretada]} accessibilityRole="button" accessibilityLabel={etiqueta} hitSlop={6}>
      <View style={st.fila}>
        <Animated.View key={`${cifra}|${sub}`} entering={FadeIn.duration(380).reduceMotion(ReduceMotion.Never)} style={st.textos}>
          <Text style={st.cifra} numberOfLines={1} maxFontSizeMultiplier={1.3}>{cifra}</Text>
          {!!sub && <Text style={st.sub} numberOfLines={1} maxFontSizeMultiplier={1.3}>{sub}</Text>}
        </Animated.View>
        <Orbe unida={vinculada} atencion={vinculada && !!h?.titular.limita} />
      </View>
      {conPista && <Pista />}
    </Pressable>
  );
}

function Pista() {
  const reducido = useReducedMotion();
  const respira = useSharedValue(0);
  useEffect(() => {
    if (reducido) return;
    respira.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(respira);
  }, [reducido, respira]);
  const flecha = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * respira.get(), transform: [{ translateY: 2 * respira.get() }] }));
  return (
    <Animated.View entering={FadeIn.duration(300).reduceMotion(ReduceMotion.Never)} exiting={FadeOut.duration(400).reduceMotion(ReduceMotion.Never)} layout={LinearTransition.duration(500)} style={st.pista}>
      <Animated.View style={flecha}>
        <Icono nombre="chevron.down" tam={12} color={C.sub} peso="semibold" />
      </Animated.View>
      <Text style={st.pistaTexto} maxFontSizeMultiplier={1.3}>{t('ascent.entrada.pista')}</Text>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  entrada: { paddingVertical: 4, paddingLeft: 10, paddingRight: 6 },
  apretada: { opacity: 0.75 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  textos: { alignItems: 'flex-end', gap: 4, flexShrink: 1 },
  cifra: { fontFamily: letras.texto, fontSize: 13.5, lineHeight: 15.5, color: C.tinta },
  sub: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 13, color: C.sub },
  pista: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  pistaTexto: { fontFamily: letras.texto, fontSize: 11, lineHeight: 13, color: C.sub },
});
