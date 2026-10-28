// Las seis secciones con el «+» en el medio de la barra (cambio 9 de la especificación) y Ascent
// arriba de Hábitos (cambio 10), como se aprobaron en la galería. Se pasa de una a otra tocando su
// nombre o deslizando, con el gesto de Ascent; el cielo queda quieto detrás de todas, oscurecido
// salvo en Hábitos, y la constelación va con su página. Abre en Inicio: la comida es el centro.
// Sin perfil, primero la entrada, sobre el mismo cielo: al terminarla aparece Inicio.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { soloLosDeEjemplo } from '@/almacen/almacen';
import PantallaDelCielo from '@/cielo/PantallaDelCielo';
import { CON_ASCENT } from '@/lib/banderas';
import { t } from '@/textos';
import { colores } from '@/tema';
import { useAlTocarUnAviso } from '@/recordatorios/programar';
import { Ascent } from './Ascent';
import { alAbrirAscent } from './ascent/abrir';
import { ALTO_BARRA, Barra, HABITOS, PESTANAS, VELO } from './Barra';
import { PaginaDeComida } from './comida/Comida';
import { AvisoFlotante, Icono } from './comida/comunes';
import { HojaRegistro } from './comida/HojaRegistro';
import { abrirRegistro, cerrarRegistro, quitarAviso, useAviso, useRegistro } from './comida/registro';
import { Entrada } from './entrada/Entrada';
import { EditorDeHabito } from './habitos/Editor';
import { Mes } from './habitos/Mes';
import { Sugeridos } from './habitos/Sugeridos';
import { HojaMas, type VistaDelMas } from './HojaMas';
import { PaginaDeInicio } from './inicio/Inicio';
import { PaginaDePerfil } from './perfil/Perfil';
import { PaginaDeProgreso } from './progreso/Progreso';
import { PaginaDeSueno } from './sueno/Sueno';
import { CEDE_EN_EL_BORDE, entre, LLEGA, subirOBajar, UMBRAL, VELOCIDAD_MINIMA, viaje } from './movimiento';

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
    conRegistro.set(withTiming(registro ? 1 : 0, { duration: registro ? 340 : 230, easing: LLEGA }));
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
  // La entrada: el cielo solo, con la cámara donde la pide cada pantalla. Hasta saber si hay perfil,
  // solo el cielo: así Inicio no asoma antes de la entrada. Solo este dato: con todo el estado, las
  // secciones se volverían a dibujar con cada toque.
  const fase = useSyncExternalStore(elAlmacen().suscribir, () => {
    const e = elAlmacen().estado();
    return !e.listo ? 'cargando' : e.perfil && e.entradaHecha ? 'secciones' : 'entrada';
  });
  const enEntrada = fase === 'entrada';
  const conSecciones = fase === 'secciones';
  const camaraDeLaEntrada = useSharedValue(0);
  const entrada = useMemo(() => (enEntrada ? { camara: camaraDeLaEntrada } : undefined), [enEntrada, camaraDeLaEntrada]);
  const sinSecciones = useSharedValue(true);
  useEffect(() => {
    sinSecciones.set(!conSecciones);
  }, [conSecciones, sinSecciones]);
  // Al volver a la entrada (cerrar sesión, cambiar de cuenta o borrar los datos), al terminarla se
  // abre otra vez en Inicio, sin hojas abiertas.
  const [conSeccionesAntes, setConSeccionesAntes] = useState(conSecciones);
  if (conSecciones !== conSeccionesAntes) {
    setConSeccionesAntes(conSecciones);
    if (!conSecciones) {
      setActual(0);
      setAnterior(0);
      setAscentAbierta(false);
      setHojaAbierta(false);
      setEditando(undefined);
      setVerMes(false);
    }
  }
  useEffect(() => {
    if (conSecciones) return;
    posicion.set(0);
    subida.set(0);
    hoja.set(0);
    cerrarRegistro();
  }, [conSecciones, posicion, subida, hoja]);
  // Con Ascent arriba, una hoja abierta o sin las secciones (en la entrada), las pestañas no se deslizan.
  const deslizable = useDerivedValue(() => subida.get() === 0 && hoja.get() === 0 && conRegistro.get() === 0 && !sinSecciones.get());

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
  // Desde la recuperación en Sueño o la fila de Perfil: pasa por Hábitos y la sube, como en la galería.
  useEffect(() => alAbrirAscent(() => {
    if (actual !== HABITOS) {
      cambiarDePestana(HABITOS);
      posicion.set(HABITOS);
    }
    subida.set(subirOBajar(subida.get(), 1));
    setAscentAbierta(true);
  }));
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

  // Tocar un aviso lleva a lo suyo: anotar esa comida, el cielo de Hábitos, el peso o el sueño.
  useAlTocarUnAviso((a) => {
    // La comida de su día: un aviso de la cena tocado después de medianoche anota la cena de ayer.
    if ((a.tipo === 'horario' || a.tipo === 'comida') && a.comida) abrirRegistro({ comida: a.comida, ...(a.dia ? { dia: a.dia } : {}) });
    else if (a.tipo === 'pesarse') abrirHoja('peso');
    else ir(a.tipo === 'dormir' ? PESTANAS.indexOf('sueno') : HABITOS);
  });

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
            // Sin la vinculación (src/lib/banderas.ts), el cielo no tiene ni el gesto ni la flecha de Ascent.
            subida={CON_ASCENT ? {
              progreso: subida,
              limiteY: alto - abajo - 8,
              flecha: { x: ancho / 2, y: alto - abajo - 24 },
              alCambiar: setAscentAbierta,
            } : undefined}
            entrada={entrada}
            alEditarHabito={setEditando}
            alIrAComida={() => ir(PESTANAS.indexOf('comida'))}
          />
          {conSecciones && (
            <Animated.View entering={FadeIn.duration(320)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, estiloVelo]} pointerEvents="none" />
              <Animated.View style={[estilos.tira, { width: ancho * PESTANAS.length }, estiloTira]} pointerEvents="box-none">
                {/* Las secciones de al lado quedan armadas pero fuera de la pantalla: VoiceOver no las recorre. */}
                {PESTANAS.map((n, i) => (
                  <View
                    key={n}
                    style={[estilos.pagina, { width: ancho }]}
                    pointerEvents="box-none"
                    accessibilityElementsHidden={i !== actual}
                    importantForAccessibility={i === actual ? 'auto' : 'no-hide-descendants'}
                  >
                    {i === HABITOS ? (
                      <BotonesDeHabitos ancho={ancho} arriba={insets.top} subida={subida} alNuevo={() => setEditando(null)} alMes={() => setVerMes(true)} />
                    ) : !armada(i) ? (
                      <View style={{ width: ancho }} pointerEvents="none" />
                    ) : n === 'comida' ? (
                      <PaginaDeComida ancho={ancho} arriba={insets.top} abajo={abajo} />
                    ) : n === 'inicio' ? (
                      <PaginaDeInicio ancho={ancho} arriba={insets.top} abajo={abajo} alIr={ir} />
                    ) : n === 'progreso' ? (
                      <PaginaDeProgreso ancho={ancho} arriba={insets.top} abajo={abajo} alAbrirMas={abrirHoja} />
                    ) : n === 'sueno' ? (
                      <PaginaDeSueno ancho={ancho} arriba={insets.top} abajo={abajo} />
                    ) : (
                      <PaginaDePerfil ancho={ancho} arriba={insets.top} abajo={abajo} />
                    )}
                  </View>
                ))}
              </Animated.View>
              {CON_ASCENT && <Ascent subida={subida} abierta={ascentAbierta} abajo={abajo} alCerrar={cerrarAscent} />}
            </Animated.View>
          )}
        </Animated.View>
        {/* Los primeros hábitos, solo si siguen los de ejemplo: los de una cuenta que ya tenía los suyos quedan. */}
        {enEntrada && <Entrada camara={camaraDeLaEntrada} alTerminar={() => setSugeridos(soloLosDeEjemplo(elAlmacen().estado()))} />}
        {conSecciones && (
          <Animated.View entering={FadeIn.duration(320)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <Barra posicion={posicion} subida={subida} actual={actual} abajo={insets.bottom} alTocar={ir} alMas={() => abrirHoja()} />
            <AvisoFlotante aviso={aviso} alIrse={quitarAviso} arriba={insets.top + 8} />
            {/* Cerrada, la hoja del «+» sigue armada abajo: VoiceOver no la recorre. */}
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityElementsHidden={!hojaAbierta} importantForAccessibility={hojaAbierta ? 'auto' : 'no-hide-descendants'}>
              <HojaMas hoja={hoja} abierta={hojaAbierta} alCerrar={cerrarHoja} vista={vistaDelMas} alCambiarVista={setVistaDelMas} />
            </View>
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
function BotonesDeHabitos({ ancho, arriba, subida, alNuevo, alMes }: { ancho: number; arriba: number; subida: SharedValue<number>; alNuevo: () => void; alMes: () => void }) {
  // Con Ascent subiendo se apagan, como lo de hoy en el cielo.
  const estilo = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - subida.get() * 2) }));
  return (
    <View style={{ width: ancho }} pointerEvents="box-none">
      <Animated.View style={[estilos.botonesDeHabitos, { top: arriba + 76 }, estilo]}>
        <Pressable onPress={alMes} style={estilos.botonDeHabitos} accessibilityRole="button" accessibilityLabel={t('habitos.mes.abrir')} hitSlop={6}>
          <Icono nombre="calendar" tam={15} color="rgba(239, 230, 207, 0.75)" />
        </Pressable>
        <Pressable onPress={alNuevo} style={estilos.botonDeHabitos} accessibilityRole="button" accessibilityLabel={t('habitos.mas')} hitSlop={6}>
          <Icono nombre="plus" tam={16} color={colores.oroClaro} peso="semibold" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  lleno: { flex: 1, backgroundColor: '#000' },
  atras: { overflow: 'hidden', backgroundColor: colores.noche0 },
  velo: { backgroundColor: colores.noche0 },
  tira: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  // En fila, como en la tira: la sección se estira a todo el alto.
  pagina: { flexDirection: 'row' },
  botonesDeHabitos: { position: 'absolute', right: 16, flexDirection: 'row', gap: 8 },
  botonDeHabitos: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.45)' },
});
