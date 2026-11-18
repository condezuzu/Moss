// Ascent mientras no está (CON_ASCENT apagada; lo pediste el 17/11/2026: «en la parte de Ascent poner pronto»):
// en Progreso, arriba a la derecha, la entrada de la galería (galeria/src/ascent.js) con el logo de Ascent y
// «Ascent · Pronto». No lleva a ningún lado: tocarla abre un globo chico, que crece desde ella, con una línea.
// Sin el gesto de arrastrar ni la sección de Ascent.

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/textos';
import { letras } from '@/tema';
import { anunciar } from '../anuncio';
import { C } from './colores';
import { Orbe } from './Orbe';

export function EntradaPronto({ abierto, alTocar }: { abierto: boolean; alTocar: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(450).delay(100).reduceMotion(ReduceMotion.Never)}>
      <Pressable
        onPress={alTocar}
        style={st.entrada}
        accessibilityRole="button"
        accessibilityLabel={`${t('ascent.senal.marca')}. ${t('ascent.pronto.valor')}`}
        accessibilityState={{ expanded: abierto }}
        hitSlop={6}
      >
        {({ pressed }) => (
          <>
            <Text style={st.marca} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {t('ascent.senal.marca')}
              <Text style={st.valor}>{` · ${t('ascent.pronto.valor')}`}</Text>
            </Text>
            <View style={pressed && st.apretado}>
              <Orbe />
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * El globo, debajo de la entrada y alineado a su derecha (`arriba` y `derecha`, en la página). Un toque en
 * cualquier lado lo cierra: `cerrando` lo achica y después avisa con `alCerrado`.
 */
export function GloboPronto(p: { arriba: number; derecha: number; anchoDePagina: number; cerrando: boolean; alCerrar: () => void; alCerrado: () => void }) {
  const { cerrando, alCerrado } = p;
  const reducido = useReducedMotion();
  const abierto = useSharedValue(0);
  useEffect(() => {
    if (!cerrando) {
      abierto.set(withTiming(1, { duration: reducido ? 150 : 340, easing: Easing.bezier(0.2, 0.9, 0.25, 1.12) }));
      return;
    }
    abierto.set(withTiming(0, { duration: reducido ? 150 : 210, easing: Easing.in(Easing.quad) }, (fin) => {
      if (fin) scheduleOnRN(alCerrado);
    }));
  }, [abierto, cerrando, reducido, alCerrado]);
  useEffect(() => anunciar(t('ascent.pronto.globo')), []);
  // Crece desde la entrada (arriba a la derecha); con Reducir movimiento, solo el fundido.
  const globo = useAnimatedStyle(() => {
    const v = abierto.get();
    return {
      opacity: Math.min(1, v * 1.6),
      transform: reducido ? [] : [{ translateY: (1 - v) * -8 }, { scale: 0.35 + 0.65 * v }],
    };
  });
  return (
    <>
      <Pressable style={[StyleSheet.absoluteFill, st.afuera]} onPress={p.alCerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
      <Animated.View
        style={[st.globo, { top: p.arriba, right: p.derecha, maxWidth: Math.min(270, p.anchoDePagina - 40), transformOrigin: 'top right' }, globo]}
        accessibilityViewIsModal
        onAccessibilityEscape={p.alCerrar}
      >
        <Pressable onPress={p.alCerrar} accessibilityRole="text">
          <Text style={st.globoTexto}>{t('ascent.pronto.globo')}</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const st = StyleSheet.create({
  entrada: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4, paddingLeft: 10, paddingRight: 6 },
  marca: { fontFamily: letras.texto, fontSize: 13.5, lineHeight: 16, color: C.tinta },
  valor: { fontSize: 11.5, color: '#aab2c4' },
  apretado: { opacity: 0.75 },
  afuera: { zIndex: 40 },
  globo: {
    position: 'absolute', zIndex: 41, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 16,
    backgroundColor: 'rgba(11, 13, 19, 0.97)', borderWidth: 1, borderColor: 'rgba(138, 147, 168, 0.34)', boxShadow: '0 14px 40px rgba(0, 0, 0, 0.55)',
  },
  globoTexto: { fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: C.tinta },
});
