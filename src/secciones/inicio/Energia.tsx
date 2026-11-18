// Tu energía, de un vistazo (lo pediste el 5/11, a la noche; galeria/src/inicio.js): un botón redondo arriba a la
// derecha de Inicio, con la batería y cómo está, en todos los estados: solo el título, sin por qué debajo (17/11).
// Tocarlo abre ahí mismo un globo con lo básico, que crece desde el botón; abajo, «Más en Sueño» se desliza a la
// tarjeta completa, que lo explica todo. Nada salta: el globo crece y se achica. La regla y las piezas son las de
// Sueño (src/secciones/sueno/Energia.tsx), que tiene la tarjeta.

import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { Bateria, COLOR_DE_ENERGIA, cuandoEs, estadoDe, fraseDeEnergia, PartesDeEnergia, TiraDelDia, type DatosDeEnergia } from '../sueno/Energia';

const ROJIZO = '#f2b9a2';

export function BotonDeEnergia({ datos, abierto, alTocar }: { datos: DatosDeEnergia; abierto: boolean; alTocar: () => void }) {
  const estado = estadoDe(datos);
  const color = COLOR_DE_ENERGIA[estado];
  const titulo = t(`inicio.energia.boton.${estado}`);
  return (
    <Animated.View entering={FadeIn.duration(450).delay(100).reduceMotion(ReduceMotion.Never)}>
      <Pressable
        onPress={alTocar}
        style={st.boton}
        accessibilityRole="button"
        accessibilityLabel={titulo}
        accessibilityHint={t('inicio.energia.verEnSueno')}
        accessibilityState={{ expanded: abierto }}
        hitSlop={6}
      >
        {({ pressed }) => (
          <>
            <Text style={[st.botonTitulo, estado === 'baja' && { color: ROJIZO }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{titulo}</Text>
            <View style={[st.circulo, { borderColor: `rgba(${color.rgb}, ${(0.55 * color.alfa).toFixed(2)})` }, estado === 'baja' && st.circuloBajo, pressed && st.apretado]}>
              <Bateria estado={estado} chica />
            </View>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

/**
 * El globo, debajo del botón y alineado a su derecha (`arriba` y `derecha`, en la página). `cerrando` lo achica y
 * después avisa con `alCerrado`.
 */
export function GloboDeEnergia(p: {
  datos: DatosDeEnergia; arriba: number; derecha: number; anchoDePagina: number; cerrando: boolean; alCerrar: () => void; alCerrado: () => void; alIrASueno: () => void;
}) {
  const { datos, cerrando, alCerrado } = p;
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
  const velo = useAnimatedStyle(() => ({ opacity: Math.min(1, abierto.get()) }));
  // Crece desde el botón (arriba a la derecha); con Reducir movimiento, solo el fundido.
  const globo = useAnimatedStyle(() => {
    const v = abierto.get();
    return {
      opacity: Math.min(1, v * 1.6),
      transform: reducido ? [] : [{ translateY: (1 - v) * -10 }, { scale: 0.35 + 0.65 * v }],
    };
  });
  const estado = estadoDe(datos);
  const ancho = Math.min(330, p.anchoDePagina - 28);
  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, st.velo, velo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.alCerrar} accessibilityRole="button" accessibilityLabel={t('inicio.energia.cerrar')} />
      </Animated.View>
      <Animated.View
        style={[st.globo, { top: p.arriba, right: p.derecha, width: ancho, transformOrigin: 'top right' }, estado === 'baja' && st.globoBajo, globo]}
        accessibilityViewIsModal
        accessibilityLabel={t(`inicio.energia.boton.${estado}`)}
        onAccessibilityEscape={p.alCerrar}
      >
        <View style={st.cab}>
          <Bateria estado={estado} />
          <View style={st.titulos}>
            <Text style={st.etiqueta} maxFontSizeMultiplier={1.3}>{t('inicio.energia.etiqueta', { cuando: t(`inicio.energia.cuando.${cuandoEs(datos)}`) })}</Text>
            <Text style={[st.titulo, estado === 'baja' && { color: ROJIZO }, estado === 'alta' && { color: colores.oroClaro }]}>{t(`inicio.energia.titulo.${estado}`)}</Text>
          </View>
          <Pressable onPress={p.alCerrar} style={({ pressed }) => [st.cerrar, pressed && st.apretado]} accessibilityRole="button" accessibilityLabel={t('inicio.energia.cerrar')} hitSlop={8}>
            <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.7)" peso="semibold" />
          </Pressable>
        </View>
        <Text style={st.texto}>{fraseDeEnergia(datos)}</Text>
        {datos.dia && (
          <>
            <TiraDelDia datos={datos} ancho={ancho - 30} />
            <PartesDeEnergia datos={datos} />
          </>
        )}
        <Pressable onPress={p.alIrASueno} style={({ pressed }) => [st.mas, pressed && st.apretado]} accessibilityRole="link" hitSlop={8}>
          <Text style={st.masTexto}>{t('inicio.energia.masEnSueno')}</Text>
          <Icono nombre="chevron.right" tam={13} color={colores.oroClaro} peso="semibold" />
        </Pressable>
      </Animated.View>
    </>
  );
}

const st = StyleSheet.create({
  boton: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 4 },
  botonTitulo: { maxWidth: 170, fontFamily: letras.textoMedio, fontSize: 13.5, lineHeight: 15, color: colores.pergamino },
  circulo: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8, 12, 26, 0.65)' },
  circuloBajo: { backgroundColor: 'rgba(203, 133, 105, 0.16)' },
  apretado: { transform: [{ scale: 0.95 }], opacity: 0.8 },
  velo: { backgroundColor: 'rgba(4, 6, 14, 0.35)', zIndex: 40 },
  globo: {
    position: 'absolute', zIndex: 41, gap: 10, paddingTop: 14, paddingRight: 14, paddingBottom: 12, paddingLeft: 16, borderRadius: 22,
    backgroundColor: 'rgba(12, 16, 32, 0.97)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', boxShadow: '0 18px 50px rgba(0, 0, 0, 0.55)',
  },
  globoBajo: { borderColor: 'rgba(203, 133, 105, 0.45)', backgroundColor: 'rgba(30, 24, 34, 0.97)' },
  cab: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulos: { flex: 1, minWidth: 0, gap: 4 },
  etiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  titulo: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 21, lineHeight: 24, color: colores.pergamino },
  cerrar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  texto: { fontFamily: letras.textoLiviano, fontSize: 14.5, lineHeight: 21, color: 'rgba(239, 230, 207, 0.88)' },
  mas: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', paddingTop: 6, paddingBottom: 2 },
  masTexto: { fontFamily: letras.texto, fontSize: 13.5, color: colores.oroClaro },
});
