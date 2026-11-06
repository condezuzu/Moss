// Las seis secciones con el «+» en el medio de la barra (cambio 9 de la especificación) y Ascent
// arriba de Hábitos (cambio 10), como se aprobaron en la galería. Se pasa de una a otra tocando su
// nombre o deslizando, con el gesto de Ascent; el cielo queda quieto detrás de todas, oscurecido
// salvo en Hábitos, y la constelación va con su página. Abre en Inicio: la comida es el centro.
// Sin perfil, primero la entrada, sobre el mismo cielo: al terminarla aparece Inicio.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, interpolate, ReduceMotion, useAnimatedStyle, useDerivedValue, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { almacenListo, elAlmacen } from '@/almacen';
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
import { abrirRegistro, avisar, cerrarRegistro, quitarAviso, useAviso, useRegistro } from './comida/registro';
import { guardarSenales } from '@/salud/anclas';
import { leerEnlace, type Enlace } from './enlaces';
import { Entrada } from './entrada/Entrada';
import { EditorDeHabito } from './habitos/Editor';
import { Mes } from './habitos/Mes';
import { Sugeridos } from './habitos/Sugeridos';
import { HojaMas, type VistaDelMas } from './HojaMas';
import { PantallaPremium } from './premium/Premium';
import { PaginaDeInicio } from './inicio/Inicio';
import { PaginaDePerfil } from './perfil/Perfil';
import { PaginaDeProgreso } from './progreso/Progreso';
import { PaginaDeSueno } from './sueno/Sueno';
import { CEDE_EN_EL_BORDE, entre, LLEGA, subirOBajar, UMBRAL, VELOCIDAD_MINIMA, viaje, VIAJE_MS } from './movimiento';

const ULTIMA = PESTANAS.length - 1;
const FONDO = '#000';
// Con una hoja abierta, lo de atrás: cuánto se achica y el radio de sus esquinas.
const ACHICA = 0.07;
const RADIO = 30;
// El ancho del borde del marco de las esquinas. Para tapar lo que queda afuera del radio alcanza con
// RADIO × (√2 − 1), unos 12 puntos; más ancho, iOS dibuja más grande la imagen del borde, que rehace en
// cada cuadro mientras el radio cambia.
const MARCO = 16;

// El enlace con el que se abrió Moss se atiende una sola vez: volver a la entrada y salir no lo repite.
let inicialAtendido = false;

/** Lo que abre un widget, en frío o con Moss abierta. Espera a que estén las secciones. */
function useEnlaces(listas: boolean, alEnlace: (e: Enlace) => void) {
  const ultimo = useRef(alEnlace);
  useEffect(() => {
    ultimo.current = alEnlace;
  });
  useEffect(() => {
    if (!listas) return;
    const atender = (url: string | null | undefined) => {
      const e = url ? leerEnlace(url) : null;
      if (e) ultimo.current(e);
    };
    if (!inicialAtendido) {
      inicialAtendido = true;
      Linking.getInitialURL().then(atender).catch(() => {});
    }
    const suscripcion = Linking.addEventListener('url', ({ url }) => atender(url));
    return () => suscripcion.remove();
  }, [listas]);
}

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
  // iPhone viejo). Al pasar a otra, el destino se arma al instante (casi siempre ya estaba, de vecina)
  // y sus vecinas nuevas, cuando termina el viaje: armadas en medio, daban un tirón al final del gesto.
  // Las de donde se viene quedan un rato más.
  const [vecinasDe, setVecinasDe] = useState(0);
  const [anterior, setAnterior] = useState(0);
  useEffect(() => {
    const llegada = setTimeout(() => setVecinasDe(actual), VIAJE_MS + 40);
    const espera = setTimeout(() => setAnterior(actual), 600);
    return () => {
      clearTimeout(llegada);
      clearTimeout(espera);
    };
  }, [actual]);
  const armada = (i: number) => i === actual || Math.abs(i - vecinasDe) <= 1 || Math.abs(i - anterior) <= 1;
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
      setVecinasDe(0);
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
  // Con Reducir movimiento la hoja del «+» no sube: aparece y se va con un fundido corto (HojaMas).
  const reducido = useReducedMotion();
  const llevarLaHoja = (hasta: 0 | 1) => hoja.set(reducido ? withTiming(hasta, { duration: 180, reduceMotion: ReduceMotion.Never }) : subirOBajar(hoja.get(), hasta));
  const abrirHoja = (vista: VistaDelMas = 'menu') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setVistaDelMas(vista);
    llevarLaHoja(1);
    setHojaAbierta(true);
  };
  const cerrarHoja = () => {
    llevarLaHoja(0);
    setHojaAbierta(false);
  };
  // Un aviso o un widget llevan a lo suyo: se cierra lo que estaba abierto encima, que lo taparía (la hoja
  // del «+» y los modales de Hábitos: el editor, «Tu mes» y los primeros hábitos).
  const cerrarCapas = () => {
    if (hojaAbierta) cerrarHoja();
    setEditando(undefined);
    setVerMes(false);
    setSugeridos(false);
  };

  // Tocar un aviso lleva a lo suyo: anotar esa comida, el cielo de Hábitos, el peso o el sueño.
  useAlTocarUnAviso((a) => {
    // «Me voy a dormir» (D33): la hora queda como la de un Atajo, y Moss no se abre en ninguna sección.
    if (a.meVoyADormir) {
      const { id, en } = a.meVoyADormir;
      almacenListo().then(() => guardarSenales([{ id, que: 'meVoyADormir', en }])).then(() => avisar(t('recordatorios.buenasNoches'))).catch(() => {});
      return;
    }
    cerrarCapas();
    // La comida de su día: un aviso de la cena tocado después de medianoche anota la cena de ayer.
    if ((a.tipo === 'horario' || a.tipo === 'comida') && a.comida) abrirRegistro({ comida: a.comida, ...(a.dia ? { dia: a.dia } : {}) });
    // Lo que falta: para anotar lo que propone. Del agua, a Inicio, donde se suman los vasos.
    else if (a.tipo === 'falta') {
      if (a.que === 'agua') ir(PESTANAS.indexOf('inicio'));
      else abrirRegistro({});
    }
    else if (a.tipo === 'pesarse') abrirHoja('peso');
    // El fin de la prueba: en Perfil está tu suscripción, y cómo cancelarla.
    else if (a.tipo === 'prueba') ir(PESTANAS.indexOf('perfil'));
    else ir(a.tipo === 'dormir' ? PESTANAS.indexOf('sueno') : HABITOS);
  });

  // Tocar un widget lleva a lo suyo: su sección, o anotar justo ahí.
  useEnlaces(conSecciones, (e) => {
    cerrarCapas();
    if ('seccion' in e) {
      cerrarRegistro();
      ir(PESTANAS.indexOf(e.seccion));
      return;
    }
    const { comida, via } = e.anotar;
    abrirRegistro({ ...(comida ? { comida } : {}), ...(via && via !== 'buscar' ? { panel: via } : {}) });
  });

  const tira = usePanGesture({
    enabled: deslizable,
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    onActivate: () => {
      'worklet';
      desde.set(Math.round(posicion.get()));
      // Si se vuelve a deslizar antes de que se armen las vecinas, se arman ya: la que entra no llega vacía.
      // Casi siempre ya están, y el estado no cambia.
      scheduleOnRN(setVecinasDe, desde.get());
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
  // Cuánto tapa una hoja (la del «+» o la de registro) lo de atrás: el cielo se frena debajo.
  const tapado = useDerivedValue(() => Math.max(hoja.get(), conRegistro.get()));
  // Con una hoja abierta, lo de atrás se achica un poco, como en iOS. Con Reducir movimiento, no: saltaba.
  const estiloAtras = useAnimatedStyle(() => ({ transform: [{ scale: 1 - ACHICA * (reducido ? 0 : tapado.get()) }] }));
  // Sus esquinas se redondean con un marco encima, del color del fondo: recortarlas con un radio obligaba a
  // iOS a componer aparte toda la pantalla (el cielo y las secciones) en cada cuadro mientras se anota.
  // Cerrada la hoja, el marco no se dibuja.
  const estiloMarco = useAnimatedStyle(() => {
    const abierta = reducido ? 0 : tapado.get();
    return { opacity: abierta > 0 ? 1 : 0, borderRadius: MARCO + RADIO * abierta, transform: [{ scale: 1 - ACHICA * abierta }] };
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
            tapado={tapado}
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
        <Animated.View style={[estilos.marco, estiloMarco]} pointerEvents="none" />
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
        <PantallaPremium conSecciones={conSecciones} />
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
  lleno: { flex: 1, backgroundColor: FONDO },
  // Un recorte recto (sin radio) no se compone aparte: tapa las secciones de al lado y Ascent, que con lo
  // de atrás achicado asomarían por los bordes.
  atras: { overflow: 'hidden', backgroundColor: colores.noche0 },
  // Del tamaño de la pantalla más su borde, para que el borde quede justo afuera de lo de atrás: con el
  // radio de afuera MARCO + r, el de adentro es r, el de las esquinas.
  marco: { position: 'absolute', top: -MARCO, left: -MARCO, right: -MARCO, bottom: -MARCO, borderWidth: MARCO, borderColor: FONDO },
  velo: { backgroundColor: colores.noche0 },
  tira: { position: 'absolute', top: 0, bottom: 0, left: 0, flexDirection: 'row' },
  // En fila, como en la tira: la sección se estira a todo el alto.
  pagina: { flexDirection: 'row' },
  botonesDeHabitos: { position: 'absolute', right: 16, flexDirection: 'row', gap: 8 },
  botonDeHabitos: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.45)' },
});
