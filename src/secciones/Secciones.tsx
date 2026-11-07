// Las seis secciones con el «+» en el medio de la barra (cambio 9 de la especificación) y Ascent
// arriba de Hábitos (cambio 10), como se aprobaron en la galería. Se pasa de una a otra tocando su
// nombre o deslizando, con el gesto de Ascent; el cielo queda quieto detrás de todas, oscurecido
// salvo en Hábitos, y la constelación va con su página. Abre en Inicio: la comida es el centro.
// Sin perfil, primero la entrada, sobre el mismo cielo: al terminarla aparece Inicio.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Keyboard, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, interpolate, ReduceMotion, useAnimatedStyle, useDerivedValue, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { almacenListo, elAlmacen } from '@/almacen';
import { soloLosDeEjemplo } from '@/almacen/almacen';
import PantallaDelCielo from '@/cielo/PantallaDelCielo';
import { CON_ASCENT } from '@/lib/banderas';
import { t } from '@/textos';
import { colores } from '@/tema';
import { useAlTocarUnAviso } from '@/recordatorios/programar';
import { ponerSeccionActual, tocarDeNuevo } from './arriba';
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
import { Sugeridos, useVolverAOfrecer } from './habitos/Sugeridos';
import { HojaMas, type VistaDelMas } from './HojaMas';
import { cerrarLasHojas } from './HojaModal';
import { PantallaPremium } from './premium/Premium';
import { PaginaDeInicio } from './inicio/Inicio';
import { PaginaDePerfil } from './perfil/Perfil';
import { PaginaDeProgreso } from './progreso/Progreso';
import { PaginaDeSueno } from './sueno/Sueno';
import { CEDE_EN_EL_BORDE, entre, LLEGA, subirOBajar, UMBRAL, VELOCIDAD_MINIMA, viaje, VIAJE_MS } from './movimiento';
import { bajarTeclado } from './teclado';

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
  // La sección de donde arrancó el dedo (la más cercana, si la tira venía viajando).
  const base = useSharedValue(0);
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
  const conHojaEncima = hojaAbierta || !!registro;
  useEffect(() => {
    ponerSeccionActual(actual, conHojaEncima);
  }, [actual, conHojaEncima]);
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
  // Si los primeros hábitos se cerraron sin elegir (un aviso llevó a otro lado, o iOS cerró Moss), vuelven al llegar a Hábitos.
  useVolverAOfrecer(conSecciones && actual === HABITOS, () => setSugeridos(true));
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

  const cambiarDePestana = (i: number, vibrar = true) => {
    if (i !== actual && vibrar) Haptics.selectionAsync().catch(() => {});
    setActual(i);
  };

  // `vibrar` en false cuando no hay un toque (un aviso o un widget llevan a la sección).
  const ir = (i: number, vibrar = true) => {
    // El teclado de un campo de la sección que se deja quedaría tapando la que llega.
    Keyboard.dismiss();
    // Con Ascent arriba, Hábitos la baja; otra pestaña la saca de una.
    if (subida.get() > 0) {
      subida.set(i === HABITOS ? subirOBajar(subida.get(), 0) : 0);
      setAscentAbierta(false);
    }
    cambiarDePestana(i, vibrar);
    posicion.set(viaje(i));
  };

  // Tocar la pestaña en la que ya estás la sube arriba de todo, como en iOS.
  const tocarPestana = (i: number) => {
    if (i === actual && subida.get() === 0) tocarDeNuevo(i);
    else ir(i);
  };

  const cerrarAscent = () => {
    subida.set(subirOBajar(subida.get(), 0));
    setAscentAbierta(false);
  };
  // Desde la recuperación en Sueño o la fila de Perfil: pasa por Hábitos y la sube, como en la galería.
  useEffect(() => alAbrirAscent(() => {
    if (actual !== HABITOS) {
      cambiarDePestana(HABITOS);
      posicion.set(viaje(HABITOS));
    }
    subida.set(subirOBajar(subida.get(), 1));
    setAscentAbierta(true);
  }));
  // Con Reducir movimiento la hoja del «+» no sube: aparece y se va con un fundido corto (HojaMas).
  const reducido = useReducedMotion();
  const llevarLaHoja = (hasta: 0 | 1) => hoja.set(reducido ? withTiming(hasta, { duration: 180, reduceMotion: ReduceMotion.Never }) : subirOBajar(hoja.get(), hasta));
  const abrirHoja = (vista: VistaDelMas = 'menu', vibrar = true) => {
    if (vibrar) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setVistaDelMas(vista);
    llevarLaHoja(1);
    setHojaAbierta(true);
  };
  const cerrarHoja = () => {
    // El teclado del peso o de las medidas no se queda solo, encima de la sección, mientras la hoja baja.
    Keyboard.dismiss();
    llevarLaHoja(0);
    setHojaAbierta(false);
  };
  // Un aviso o un widget llevan a lo suyo: se cierra lo que estaba abierto encima, que lo taparía: la hoja
  // del «+», los modales de Hábitos (el editor, «Tu mes» y los primeros hábitos), las hojas de las
  // secciones y, si lo que sigue no es anotar, la de registro.
  const cerrarCapas = (anota: boolean) => {
    Keyboard.dismiss();
    if (hojaAbierta) cerrarHoja();
    setEditando(undefined);
    setVerMes(false);
    setSugeridos(false);
    cerrarLasHojas();
    if (!anota) cerrarRegistro();
  };

  // Tocar un aviso lleva a lo suyo: anotar esa comida, el cielo de Hábitos, el peso o el sueño.
  useAlTocarUnAviso((a) => {
    // «Me voy a dormir» (D33): la hora queda como la de un Atajo, y Moss no se abre en ninguna sección.
    if (a.meVoyADormir) {
      const { id, en } = a.meVoyADormir;
      almacenListo().then(() => guardarSenales([{ id, que: 'meVoyADormir', en }])).then(() => avisar(t('recordatorios.buenasNoches'))).catch(() => {});
      return;
    }
    const sueno = PESTANAS.indexOf('sueno');
    switch (a.tipo) {
      // La comida de su día: un aviso de la cena tocado después de medianoche anota la cena de ayer.
      case 'horario':
      case 'comida':
      case 'antesDeEntrenar':
      case 'despuesDeEntrenar':
      case 'ultimaComida':
        cerrarCapas(true);
        abrirRegistro({ ...(a.comida ? { comida: a.comida } : {}), ...(a.dia ? { dia: a.dia } : {}) });
        return;
      // Lo que falta: para anotar lo que propone. El agua, en el «+», que siempre la tiene (en Inicio puede no estar).
      case 'falta':
        cerrarCapas(a.que !== 'agua');
        if (a.que === 'agua') abrirHoja('menu', false);
        else abrirRegistro({});
        return;
      case 'pesarse':
        cerrarCapas(false);
        abrirHoja('peso', false);
        return;
      // El fin de la prueba: en Perfil está tu suscripción, y cómo cancelarla.
      case 'prueba':
        cerrarCapas(false);
        ir(PESTANAS.indexOf('perfil'), false);
        return;
      // Lo de la noche y la recuperación, en Sueño; el partido y la carrera, en Inicio.
      case 'dormir':
      case 'cafe':
      case 'luces':
      case 'entrenarTarde':
      case 'recuperacion':
        cerrarCapas(false);
        ir(sueno, false);
        return;
      case 'partido':
      case 'carrera':
        cerrarCapas(false);
        ir(PESTANAS.indexOf('inicio'), false);
        return;
      default:
        cerrarCapas(false);
        ir(HABITOS, false);
    }
  });

  // Tocar un widget lleva a lo suyo: su sección, o anotar justo ahí.
  useEnlaces(conSecciones, (e) => {
    if ('seccion' in e) {
      cerrarCapas(false);
      ir(PESTANAS.indexOf(e.seccion), false);
      return;
    }
    cerrarCapas(true);
    const { comida, via } = e.anotar;
    abrirRegistro({ ...(comida ? { comida } : {}), ...(via && via !== 'buscar' ? { panel: via } : {}) });
  });

  const tira = usePanGesture({
    enabled: deslizable,
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    onActivate: (ev) => {
      'worklet';
      // Desde donde está y sin el trecho que hizo falta para arrancar: así no salta, tampoco si la tira
      // venía viajando de un deslizamiento anterior.
      const p = posicion.get();
      desde.set(p + ev.translationX / ancho);
      base.set(Math.round(p));
      // Si se vuelve a deslizar antes de que se armen las vecinas, se arman ya: la que entra no llega vacía.
      // Casi siempre ya están, y el estado no cambia.
      scheduleOnRN(setVecinasDe, base.get());
      // El teclado de un campo de la sección que se deja quedaría tapando la que llega.
      scheduleOnRN(bajarTeclado);
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
      // Se cambia con un quinto de la pantalla o con un tirón rápido hacia ese lado.
      const movido = posicion.get() - base.get();
      const lejos = Math.abs(movido) >= UMBRAL;
      const rapido = Math.abs(ev.velocityX) >= VELOCIDAD_MINIMA && Math.sign(-ev.velocityX) === Math.sign(movido);
      const destino = lejos || rapido ? entre(base.get() + (movido > 0 ? 1 : -1), 0, ULTIMA) : base.get();
      posicion.set(viaje(destino));
      scheduleOnRN(cambiarDePestana, destino, true);
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

  // Con la hoja del «+» o la de registro abiertas, VoiceOver no recorre lo de atrás: no son sus hermanas,
  // y `accessibilityViewIsModal` solo esconde a las hermanas.
  const atrasTapado = conHojaEncima;
  // El texto del cielo (la cabecera y los nombres de las estrellas) solo existe para VoiceOver en Hábitos.
  const cieloOculto = atrasTapado || (conSecciones && actual !== HABITOS);
  return (
    <View style={estilos.lleno}>
      <GestureDetector gesture={tira}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[StyleSheet.absoluteFill, estilos.atras, estiloAtras]}
            accessibilityElementsHidden={atrasTapado}
            importantForAccessibility={atrasTapado ? 'no-hide-descendants' : 'auto'}
          >
            <View
              style={StyleSheet.absoluteFill}
              pointerEvents="box-none"
              accessibilityElementsHidden={cieloOculto}
              importantForAccessibility={cieloOculto ? 'no-hide-descendants' : 'auto'}
            >
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
            </View>
            {conSecciones && (
              <Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)} exiting={FadeOut.duration(240).reduceMotion(ReduceMotion.Never)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
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
            <Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)} exiting={FadeOut.duration(240).reduceMotion(ReduceMotion.Never)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <View
                style={StyleSheet.absoluteFill}
                pointerEvents="box-none"
                accessibilityElementsHidden={atrasTapado}
                importantForAccessibility={atrasTapado ? 'no-hide-descendants' : 'auto'}
              >
                <Barra posicion={posicion} subida={subida} actual={actual} abajo={insets.bottom} alTocar={tocarPestana} alMas={() => abrirHoja()} />
              </View>
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
      {/* Afuera del gesto de la tira: deslizar sobre la pantalla de pago no cambia la sección de atrás. */}
      <PantallaPremium conSecciones={conSecciones} />
    </View>
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
