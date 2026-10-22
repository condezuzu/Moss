// Las seis secciones con el «+» en el medio de la barra (cambio 9 de la especificación) y Ascent
// arriba de Hábitos (cambio 10), como se aprobaron en la galería. Se pasa de una a otra tocando su
// nombre o deslizando, con el gesto de Ascent; el cielo queda quieto detrás de todas, oscurecido
// salvo en Hábitos, y la constelación va con su página. Abre en Inicio: la comida es el centro.
// Sin perfil, primero la entrada, sobre el mismo cielo: al terminarla aparece Inicio.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import PantallaDelCielo from '@/cielo/PantallaDelCielo';
import { lista, t } from '@/textos';
import { colores } from '@/tema';
import { Ascent } from './Ascent';
import { ALTO_BARRA, Barra, HABITOS, PESTANAS, VELO, type Pestana } from './Barra';
import { PaginaDeComida } from './comida/Comida';
import { AvisoAbajo, Icono } from './comida/comunes';
import { useEstado } from './comida/datos';
import { HojaRegistro } from './comida/HojaRegistro';
import { quitarAviso, useAviso, useRegistro } from './comida/registro';
import { Entrada } from './entrada/Entrada';
import { EditorDeHabito } from './habitos/Editor';
import { Mes } from './habitos/Mes';
import { Sugeridos } from './habitos/Sugeridos';
import { HojaMas, type VistaDelMas } from './HojaMas';
import { PaginaDeInicio } from './inicio/Inicio';
import { PaginaDeProgreso } from './progreso/Progreso';
import { PaginaDeSueno } from './sueno/Sueno';
import { CEDE_EN_EL_BORDE, entre, subirOBajar, UMBRAL, VELOCIDAD_MINIMA, viaje } from './movimiento';

const ULTIMA = PESTANAS.length - 1;

export default function Secciones() {
  const { width: ancho, height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const abajo = ALTO_BARRA + insets.bottom;
  const [actual, setActual] = useState(0);
  const [ascentAbierta, setAscentAbierta] = useState(false);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [vistaDelMas, setVistaDelMas] = useState<VistaDelMas>('menu');
  // Hábitos: el editor (un id, o null para uno nuevo), «Tu mes» y los primeros hábitos al terminar la entrada.
  const [editando, setEditando] = useState<string | null | undefined>(undefined);
  const [verMes, setVerMes] = useState(false);
  const [sugeridos, setSugeridos] = useState(false);
  // La pestaña, con decimales mientras se desliza; Ascent y la hoja del «+», de 0 (abajo) a 1.
  const posicion = useSharedValue(0);
  const desde = useSharedValue(0);
  const subida = useSharedValue(0);
  const hoja = useSharedValue(0);
  // La hoja de registro de la comida: se abre desde Comida, Inicio o el «+».
  const registro = useRegistro();
  const conRegistro = useSharedValue(0);
  useEffect(() => {
    conRegistro.set(withTiming(registro ? 1 : 0, { duration: registro ? 450 : 380 }));
  }, [registro, conRegistro]);
  const aviso = useAviso();
  // Solo se arman la sección de ahora y sus vecinas (menos memoria y menos lienzos de Skia en un
  // iPhone viejo); mientras se pasa de una a otra, también las de donde se viene.
  const [anterior, setAnterior] = useState(0);
  useEffect(() => {
    const espera = setTimeout(() => setAnterior(actual), 600);
    return () => clearTimeout(espera);
  }, [actual]);
  const armada = (i: number) => Math.abs(i - actual) <= 1 || Math.abs(i - anterior) <= 1;
  const paginaX = useDerivedValue(() => (HABITOS - posicion.get()) * ancho);
  // La entrada: el cielo solo, con la cámara donde la pide cada pantalla.
  const { listo, perfil } = useEstado();
  const enEntrada = listo && !perfil;
  const camaraDeLaEntrada = useSharedValue(0);
  const entrada = useMemo(() => (enEntrada ? { camara: camaraDeLaEntrada } : undefined), [enEntrada, camaraDeLaEntrada]);
  const conEntrada = useSharedValue(false);
  useEffect(() => {
    conEntrada.set(enEntrada);
  }, [enEntrada, conEntrada]);
  // Con Ascent arriba, una hoja abierta o en la entrada, las pestañas no se deslizan.
  const deslizable = useDerivedValue(() => subida.get() === 0 && hoja.get() === 0 && conRegistro.get() === 0 && !conEntrada.get());

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
  const abrirHoja = (vista: VistaDelMas = 'menu') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setVistaDelMas(vista);
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
  // Con una hoja abierta, lo de atrás se achica un poco, como en iOS.
  const estiloAtras = useAnimatedStyle(() => {
    const abierta = Math.max(hoja.get(), conRegistro.get());
    return { transform: [{ scale: 1 - 0.07 * abierta }], borderRadius: 30 * abierta };
  });

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
            entrada={entrada}
            alEditarHabito={setEditando}
          />
          {!enEntrada && (
            <Animated.View entering={FadeIn.duration(900)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, estiloVelo]} pointerEvents="none" />
              <Animated.View style={[estilos.tira, { width: ancho * PESTANAS.length }, estiloTira]} pointerEvents="box-none">
                {PESTANAS.map((n, i) =>
                  i === HABITOS ? (
                    <BotonesDeHabitos key={n} ancho={ancho} arriba={insets.top} alNuevo={() => setEditando(null)} alMes={() => setVerMes(true)} />
                  ) : !armada(i) ? (
                    <View key={n} style={{ width: ancho }} pointerEvents="none" />
                  ) : n === 'comida' ? (
                    <PaginaDeComida key={n} ancho={ancho} arriba={insets.top} abajo={abajo} />
                  ) : n === 'inicio' ? (
                    <PaginaDeInicio key={n} ancho={ancho} arriba={insets.top} abajo={abajo} alIr={ir} />
                  ) : n === 'progreso' ? (
                    <PaginaDeProgreso key={n} ancho={ancho} arriba={insets.top} abajo={abajo} alAbrirMas={abrirHoja} />
                  ) : n === 'sueno' ? (
                    <PaginaDeSueno key={n} ancho={ancho} arriba={insets.top} abajo={abajo} />
                  ) : (
                    <SeccionPendiente key={n} nombre={n} ancho={ancho} arriba={insets.top} />
                  ),
                )}
              </Animated.View>
              <Ascent subida={subida} abierta={ascentAbierta} abajo={abajo} alCerrar={cerrarAscent} />
            </Animated.View>
          )}
        </Animated.View>
        {enEntrada ? (
          <Entrada camara={camaraDeLaEntrada} alTerminar={() => setSugeridos(true)} />
        ) : (
          <Animated.View entering={FadeIn.duration(900)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Barra posicion={posicion} subida={subida} actual={actual} abajo={insets.bottom} alTocar={ir} alMas={() => abrirHoja()} />
            <AvisoAbajo aviso={aviso} alIrse={quitarAviso} abajo={abajo + 14} />
            <HojaMas hoja={hoja} abierta={hojaAbierta} alCerrar={cerrarHoja} vista={vistaDelMas} alCambiarVista={setVistaDelMas} />
            <HojaRegistro />
          </Animated.View>
        )}
        {editando !== undefined && <EditorDeHabito key={editando ?? 'nuevo'} id={editando} alCerrar={() => setEditando(undefined)} />}
        {verMes && <Mes alCerrar={() => setVerMes(false)} />}
        {sugeridos && <Sugeridos alCerrar={() => setSugeridos(false)} />}
      </View>
    </GestureDetector>
  );
}

/** Arriba a la derecha de Hábitos, debajo de la luz de hoy: un hábito nuevo y «Tu mes». El cielo queda limpio. */
function BotonesDeHabitos({ ancho, arriba, alNuevo, alMes }: { ancho: number; arriba: number; alNuevo: () => void; alMes: () => void }) {
  return (
    <View style={{ width: ancho }} pointerEvents="box-none">
      <View style={[estilos.botonesDeHabitos, { top: arriba + 76 }]}>
        <Pressable onPress={alMes} style={estilos.botonDeHabitos} accessibilityRole="button" accessibilityLabel={t('habitos.mes.abrir')} hitSlop={6}>
          <Icono nombre="calendar" tam={15} color="rgba(239, 230, 207, 0.75)" />
        </Pressable>
        <Pressable onPress={alNuevo} style={estilos.botonDeHabitos} accessibilityRole="button" accessibilityLabel={t('habitos.mas')} hitSlop={6}>
          <Icono nombre="plus" tam={16} color={colores.oroClaro} peso="semibold" />
        </Pressable>
      </View>
    </View>
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
  botonesDeHabitos: { position: 'absolute', right: 16, flexDirection: 'row', gap: 8 },
  botonDeHabitos: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.45)' },
  fecha: { fontFamily: 'Jost_400Regular', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: colores.pergaminoTenue },
  titulo: { marginTop: 8, fontFamily: 'Jost_500Medium', fontSize: 28, color: colores.pergamino },
  pronto: { marginTop: 14, fontFamily: 'Jost_400Regular', fontSize: 14, lineHeight: 20, color: colores.pergaminoTenue },
});
