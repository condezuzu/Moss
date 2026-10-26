// La estrella guía de la entrada, la de la galería (galeria/src/entrada.js): va por encima de las
// pantallas con su estela, lleva la barra del cuestionario y, en la frase y las diapositivas, espera
// abajo: respira, un aro se le cierra encima y tocarla es seguir. Lo que se mueve sale del reloj de la
// pantalla y del guion (guion.ts); quieta, lo único que se anima es su respiración, unas pocas veces.

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from 'react-native-reanimated';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { barraEn, estado, type Anclas, type Recorrido } from './guion';
import { Cuerpo, Estela, Halo } from './Lienzos';

type Props = {
  recorrido: SharedValue<Recorrido | null>;
  reloj: SharedValue<number>;
  anclas: Anclas;
  reducido: boolean;
  /** En la frase y las diapositivas: el botón invisible sobre la estrella. */
  tocable: boolean;
  /** Ya terminó su parte: se puede tocar. */
  lista: boolean;
  alTocar: () => void;
};

const SUAVE = Easing.inOut(Easing.sin);

export function Guia({ recorrido, reloj, anclas: a, reducido, tocable, lista, alTocar }: Props) {
  const respira = useSharedValue(0);
  const aro = useSharedValue(0);
  const destello = useSharedValue(0);
  const [pista, setPista] = useState(false);
  const esperando = tocable && lista;

  useEffect(() => {
    if (!esperando || reducido) {
      cancelAnimation(respira);
      cancelAnimation(aro);
      respira.set(withTiming(0, { duration: 300 }));
      aro.set(0);
      return;
    }
    // Unas veces y no para siempre: quieta no gasta.
    respira.set(withRepeat(withSequence(withTiming(1, { duration: 1300, easing: SUAVE }), withTiming(0, { duration: 1300, easing: SUAVE })), 8));
    aro.set(withRepeat(withSequence(withDelay(800, withTiming(1, { duration: 1820, easing: Easing.bezier(0.25, 0.6, 0.3, 1) })), withTiming(0, { duration: 0 })), 8));
    return () => {
      cancelAnimation(respira);
      cancelAnimation(aro);
    };
  }, [esperando, reducido, respira, aro]);

  // Si pasa un rato sin que la toquen, una palabra chica dice qué hacer.
  useEffect(() => {
    if (!esperando) return;
    const espera = setTimeout(() => setPista(true), 2600);
    return () => {
      clearTimeout(espera);
      setPista(false);
    };
  }, [esperando]);

  const estrella = useAnimatedStyle(() => {
    const e = estado(recorrido.get(), reloj.get(), reducido);
    return { opacity: e.brillo, transform: [{ translateX: e.x }, { translateY: e.y }, { scale: e.escala }] };
  });
  const halo = useAnimatedStyle(() => ({ opacity: 1 - 0.22 * respira.get(), transform: [{ scale: 1 + 0.16 * respira.get() + 0.7 * destello.get() }] }));
  const cuerpo = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.6 * destello.get() }] }));
  // Como en la galería: el aro aparece, se cierra sobre la estrella y se apaga.
  const aroEstilo = useAnimatedStyle(() => {
    const u = aro.get();
    return { opacity: u <= 0 ? 0 : u < 0.43 ? (0.6 * u) / 0.43 : 0.6 * (1 - (u - 0.43) / 0.57), transform: [{ scale: 1 - 0.66 * u }] };
  });
  const barra = useAnimatedStyle(() => ({ opacity: barraEn(recorrido.get(), reloj.get()).visible }));
  const relleno = useAnimatedStyle(() => ({ width: `${barraEn(recorrido.get(), reloj.get()).k * 100}%` }));

  const tocar = () => {
    if (!esperando) return;
    if (!reducido) destello.set(withSequence(withTiming(1, { duration: 210 }), withTiming(0, { duration: 390 })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    alTocar();
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[st.barra, { top: a.barra.y - 1, left: a.barra.x0, width: a.barra.x1 - a.barra.x0 }, barra]} pointerEvents="none">
        <Animated.View style={[st.relleno, relleno]} />
      </Animated.View>
      {/* En la web, un hijo directo de box-none recibe toques aunque el lienzo diga que no. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Estela recorrido={recorrido} reloj={reloj} reducido={reducido} ancho={a.W} alto={a.H} />
      </View>
      <Animated.View style={[st.estrella, estrella]} pointerEvents="none">
        <Animated.View style={[st.halo, halo]}>
          <Halo />
        </Animated.View>
        <Animated.View style={[st.cuerpo, cuerpo]}>
          <Cuerpo />
        </Animated.View>
        <Animated.View style={[st.aro, aroEstilo]} />
      </Animated.View>
      {tocable && (
        <Pressable
          onPress={tocar}
          disabled={!lista}
          style={[st.tocar, { left: a.descanso[0] - 36, top: a.descanso[1] - 36 }]}
          accessibilityRole="button"
          accessibilityLabel={t('entrada.seguir')}
          accessibilityState={{ disabled: !lista }}
          hitSlop={10}
        />
      )}
      {tocable && pista && (
        <Animated.Text entering={FadeIn.duration(900)} exiting={FadeOut.duration(300)} style={[st.pista, { top: a.descanso[1] + 44 }]} pointerEvents="none">
          {t('entrada.tocaLaEstrella')}
        </Animated.Text>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  barra: { position: 'absolute', height: 2, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  relleno: { height: '100%', backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  // Una vista de tamaño cero en el centro de la estrella: lo de adentro se centra con márgenes.
  estrella: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  halo: { position: 'absolute', left: -42, top: -42, width: 84, height: 84 },
  cuerpo: { position: 'absolute', left: -27, top: -27, width: 54, height: 54 },
  aro: { position: 'absolute', left: -31, top: -31, width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: 'rgba(255, 244, 214, 0.55)' },
  tocar: { position: 'absolute', width: 72, height: 72, borderRadius: 36 },
  pista: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.1, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
});
