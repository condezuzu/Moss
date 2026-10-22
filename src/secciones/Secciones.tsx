// Las seis secciones con el «+» en el medio de la barra (cambio 9 de la especificación) y Ascent
// arriba de Hábitos (cambio 10), como se aprobaron en la galería. Se pasa de una a otra tocando su
// nombre o deslizando, con el gesto de Ascent; el cielo queda quieto detrás de todas, oscurecido
// salvo en Hábitos, y la constelación va con su página. Por ahora la app tiene el cielo: las otras
// secciones llegan en las etapas 7 y 8, y mientras tanto muestran su nombre, así que abre en Hábitos.

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { interpolate, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import PantallaDelCielo from '@/cielo/PantallaDelCielo';
import { lista, t } from '@/textos';
import { colores } from '@/tema';
import { Ascent } from './Ascent';
import { ALTO_BARRA, Barra, HABITOS, PESTANAS, VELO, type Pestana } from './Barra';
import { HojaMas } from './HojaMas';
import { CEDE_EN_EL_BORDE, entre, subirOBajar, UMBRAL, VELOCIDAD_MINIMA, viaje } from './movimiento';

const ULTIMA = PESTANAS.length - 1;

export default function Secciones() {
  const { width: ancho, height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const abajo = ALTO_BARRA + insets.bottom;
  const [actual, setActual] = useState(HABITOS);
  const [ascentAbierta, setAscentAbierta] = useState(false);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  // La pestaña, con decimales mientras se desliza; Ascent y la hoja del «+», de 0 (abajo) a 1.
  const posicion = useSharedValue(HABITOS);
  const desde = useSharedValue(HABITOS);
  const subida = useSharedValue(0);
  const hoja = useSharedValue(0);
  const paginaX = useDerivedValue(() => (HABITOS - posicion.get()) * ancho);
  // Con Ascent arriba o la hoja abierta, las pestañas no se deslizan.
  const deslizable = useDerivedValue(() => subida.get() === 0 && hoja.get() === 0);

  const cambiarDePestana = (i: number) => {
    if (i !== actual) Haptics.selectionAsync().catch(() => {});
    setActual(i);
  };

  const ir = (i: number) => {
    // Con Ascent arriba, Hábitos la baja; otra pestaña la saca de una.
    if (subida.get() > 0) {
      subida.set(i === HABITOS ? subirOBajar(subida.get(), 0) : 0);
      setAscentAbierta(false);
    }
    cambiarDePestana(i);
    posicion.set(viaje(i));
  };

  const cerrarAscent = () => {
    subida.set(subirOBajar(subida.get(), 0));
    setAscentAbierta(false);
  };
  const abrirHoja = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    hoja.set(subirOBajar(hoja.get(), 1));
    setHojaAbierta(true);
  };
  const cerrarHoja = () => {
    hoja.set(subirOBajar(hoja.get(), 0));
    setHojaAbierta(false);
  };

  const tira = usePanGesture({
    enabled: deslizable,
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    onActivate: () => {
      'worklet';
      desde.set(Math.round(posicion.get()));
    },
    onUpdate: (ev) => {
      'worklet';
      let p = desde.get() - ev.translationX / ancho;
      if (p < 0) p *= CEDE_EN_EL_BORDE;
      if (p > ULTIMA) p = ULTIMA + (p - ULTIMA) * CEDE_EN_EL_BORDE;
      posicion.set(p);
    },
    onDeactivate: (ev) => {
      'worklet';
      const lejos = Math.abs(ev.translationX) >= ancho * UMBRAL;
      const rapido = Math.abs(ev.velocityX) >= VELOCIDAD_MINIMA && Math.sign(ev.velocityX) === Math.sign(ev.translationX);
      const destino = lejos || rapido ? entre(desde.get() + (ev.translationX < 0 ? 1 : -1), 0, ULTIMA) : desde.get();
      posicion.set(viaje(destino));
      scheduleOnRN(cambiarDePestana, destino);
    },
  });

  const estiloVelo = useAnimatedStyle(() => ({ opacity: interpolate(posicion.get(), [0, 1, 2, 3, 4, 5], VELO, 'clamp') }));
  const estiloTira = useAnimatedStyle(() => ({ transform: [{ translateX: -posicion.get() * ancho }] }));
  // Con la hoja del «+» abierta, lo de atrás se achica un poco, como en iOS.
  const estiloAtras = useAnimatedStyle(() => ({ transform: [{ scale: 1 - 0.07 * hoja.get() }], borderRadius: 30 * hoja.get() }));

  return (
    <GestureDetector gesture={tira}>
      <View style={estilos.lleno}>
        <Animated.View style={[StyleSheet.absoluteFill, estilos.atras, estiloAtras]}>
          <PantallaDelCielo
            paginaX={paginaX}
            abajo={abajo}
            subida={{
              progreso: subida,
              limiteY: alto - abajo - 8,
              flecha: { x: ancho / 2, y: alto - abajo - 24 },
              alCambiar: setAscentAbierta,
            }}
          />
          <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, estiloVelo]} pointerEvents="none" />
          <Animated.View style={[estilos.tira, { width: ancho * PESTANAS.length }, estiloTira]} pointerEvents="box-none">
            {PESTANAS.map((n, i) =>
              i === HABITOS ? (
                <View key={n} style={{ width: ancho }} pointerEvents="none" />
              ) : (
                <SeccionPendiente key={n} nombre={n} ancho={ancho} arriba={insets.top} />
              ),
            )}
          </Animated.View>
          <Ascent subida={subida} abierta={ascentAbierta} abajo={abajo} alCerrar={cerrarAscent} />
        </Animated.View>
        <Barra posicion={posicion} subida={subida} actual={actual} abajo={insets.bottom} alTocar={ir} alMas={abrirHoja} />
        <HojaMas hoja={hoja} abierta={hojaAbierta} alCerrar={cerrarHoja} />
      </View>
    </GestureDetector>
  );
}

/** Una sección que todavía no está en la app: su nombre, como en la galería, y que llega pronto. */
function SeccionPendiente({ nombre, ancho, arriba }: { nombre: Pestana; ancho: number; arriba: number }) {
  const [hoy] = useState(() => new Date());
  const fecha = t('cielo.fecha', { dia: lista('fecha.dias')[hoy.getDay()], num: hoy.getDate(), mes: lista('fecha.mesesCortos')[hoy.getMonth()] });
  return (
    <View style={[estilos.pendiente, { width: ancho, paddingTop: arriba + 18 }]}>
      <Text style={estilos.fecha}>{fecha}</Text>
      <Text style={estilos.titulo}>{t(`pestanas.${nombre}`)}</Text>
      <Text style={estilos.pronto}>{t('secciones.pronto')}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  lleno: { flex: 1, backgroundColor: '#000' },
  atras: { overflow: 'hidden', backgroundColor: colores.noche0 },
  velo: { backgroundColor: colores.noche0 },
  tira: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  pendiente: { paddingHorizontal: 22 },
  fecha: { fontFamily: 'Jost_400Regular', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: colores.pergaminoTenue },
  titulo: { marginTop: 8, fontFamily: 'Jost_500Medium', fontSize: 28, color: colores.pergamino },
  pronto: { marginTop: 14, fontFamily: 'Jost_400Regular', fontSize: 14, lineHeight: 20, color: colores.pergaminoTenue },
});
