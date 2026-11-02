// La señal de Hábitos (spec/ascent.md, «Que se encuentre»; galeria/src/ascent.js): abajo, sobre el musgo,
// la marca de Ascent, qué hay y la flecha hacia donde sube la sección. Sin vincular invita, si Ascent está
// en este iPhone; vinculada, la última sesión; si no, solo la marca. No toma toques: tocarla o deslizar
// desde ella lo resuelven los gestos del cielo (Cielo.tsx), así un deslizamiento que empieza acá también
// sube y un toque no enciende la estrella de abajo. La primera vez que se ve sube y baja apenas.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeOut, useAnimatedReaction, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { useAscent } from '@/almacen/ascent';
import type { Escena } from '@/cielo/escena';
import { gruposDeLaSesion, type SesionDeAscent } from '@/dominio/conAscent';
import { diaDeLaSemana } from '@/dominio/fechas';
import { senalDeAscent, type SenalDeAscent as Senal } from '@/dominio/senalDeAscent';
import { CON_ASCENT } from '@/lib/banderas';
import { lista, t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { ACOMODA } from '../tarjetas';
import { C } from './colores';
import { MarcaChica } from './MarcaChica';
import { nombreDeSesion } from './nombres';
import { useHayAscent } from './useHayAscent';

const YA_ASOMO = 'moss:asomoLaSenalDeAscent';

function textoDe(s: Senal, sesiones: readonly SesionDeAscent[]): string {
  if (s.que !== 'sesion') return t(`ascent.senal.${s.que}`);
  const sesion = nombreDeSesion(gruposDeLaSesion({ ejercicios: sesiones.filter((x) => x.fecha === s.fecha).flatMap((x) => x.ejercicios) })).toLowerCase();
  if (s.dias === 0) return t('ascent.senal.hoy', { sesion });
  if (s.dias === 1) return t('ascent.senal.ayer', { sesion });
  return t('ascent.senal.dia', { dia: lista('fecha.dias')[diaDeLaSemana(s.fecha)], sesion });
}

type Props = {
  escena: SharedValue<Escena>;
  /** Para VoiceOver, que no pasa por los gestos del cielo. */
  alAbrir: () => void;
  /** Hasta dónde llega a cada lado, para el toque en el cielo. */
  medio: SharedValue<number>;
};

export function SenalDeAscent({ escena, alAbrir, medio }: Props) {
  const { vinculo, sesiones } = useAscent();
  // Solo este dato: con todo el estado, se volvería a dibujar con cada estrella tocada.
  const hoy = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().hoy);
  const instalada = useHayAscent();
  const senal = senalDeAscent({ conAscent: CON_ASCENT, vinculada: vinculo.vinculada, instalada, sesiones, hoy });
  const reducido = useReducedMotion();

  // A la vista: en Hábitos y con la cámara en hoy. Fuera de ahí, VoiceOver no la recorre.
  const [aLaVista, setALaVista] = useState(false);
  useAnimatedReaction(
    () => escena.value.paginaX === 0 && escena.value.cam.objetivo === 0,
    (ahora, antes) => {
      if (ahora !== antes) scheduleOnRN(setALaVista, ahora);
    },
  );

  const asoma = useSharedValue(0);
  useEffect(() => {
    if (!aLaVista) return;
    let viva = true;
    AsyncStorage.getItem(YA_ASOMO).then((ya) => {
      if (ya || !viva) return;
      AsyncStorage.setItem(YA_ASOMO, '1').catch(() => {});
      if (reducido) return;
      const a = (y: number, ms: number) => withTiming(y, { duration: ms, easing: Easing.inOut(Easing.quad) });
      asoma.set(withDelay(800, withSequence(a(-9, 330), a(0, 330), a(-5, 270), a(0, 270))));
    }).catch(() => {});
    return () => {
      viva = false;
    };
  }, [aLaVista, reducido, asoma]);
  const estiloAsoma = useAnimatedStyle(() => ({ transform: [{ translateY: asoma.get() }] }));

  // La flecha respira apenas, con el reloj del cielo: cuando el cielo queda quieto, ella también.
  const estiloFlecha = useAnimatedStyle(() => {
    const respira = reducido ? 0 : 0.5 - 0.5 * Math.cos((escena.value.t * 2 * Math.PI) / 3.8);
    return { opacity: 1 - 0.45 * respira, transform: [{ translateY: -2 * respira }] };
  });

  if (!senal) return null;
  const texto = textoDe(senal, sesiones);
  return (
    <Animated.View style={estiloAsoma}>
      <Animated.View
        layout={ACOMODA}
        style={st.pastilla}
        onLayout={(e) => medio.set(e.nativeEvent.layout.width / 2 + 4)}
        accessible
        accessibilityRole="button"
        accessibilityLabel={senal.que === 'marca' ? t('ascent.flecha') : `${t('ascent.flecha')}. ${texto}`}
        accessibilityElementsHidden={!aLaVista}
        importantForAccessibility={aLaVista ? 'yes' : 'no-hide-descendants'}
        onAccessibilityTap={alAbrir}
      >
        <MarcaChica unida={vinculo.vinculada} />
        <Animated.Text key={texto} entering={FadeIn.duration(320)} exiting={FadeOut.duration(120)} style={st.texto} numberOfLines={1}>{texto}</Animated.Text>
        <Animated.View style={estiloFlecha}>
          <View style={st.flecha}>
            <Icono nombre="chevron.up" tam={12} color={C.sub} peso="semibold" />
          </View>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  pastilla: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingLeft: 5, paddingRight: 11, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(138, 147, 168, 0.34)', backgroundColor: 'rgba(5, 6, 10, 0.62)',
  },
  texto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12.5, letterSpacing: 0.1, color: C.tinta },
  flecha: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
});
