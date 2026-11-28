// Ascent, arriba de Progreso (spec/ascent.md, «Ascent en Progreso»), como la galería (galeria/src/ascent.js): como
// si Progreso siguiera para arriba. Baja siguiendo al dedo desde arriba de todo de Progreso (el gesto es de
// Progreso), con Progreso pegado abajo, y se llega abajo de todo, a lo principal: lo de hoy o, sin vincular,
// vincular. Subiendo está el resto, de lo más a lo menos importante, y arriba de todo, de fondo, el cuerpo de tu
// rango, como las estrellas. Volver es bajar: abajo de todo, empujar para arriba, «Volver a Progreso» o tocar
// Progreso. El cielo sigue detrás, apenas oscurecido para leer.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent, type ViewStyle } from 'react-native';
import { GestureDetector, ScrollView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, Easing, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useReducedMotion, useScrollOffset, useSharedValue,
  withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useAscent } from '@/almacen/ascent';
import { irALaAppStore } from '@/lib/ascent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { olvidarLaMetaPedida } from './ascent/abrir';
import { dondeEsta, loMovioLaPersona, type DondeEsta } from './ascent/pegado';
import { C, useAcento } from './ascent/colores';
import { Cuerpo, Marca } from './ascent/Dibujos';
import { HojaDeVincular } from './ascent/HojaDeVincular';
import { Accion, Candado, Parte, st as p, Una, useTitulares } from './ascent/piezas';
import { CuerpoDeFondo } from './ascent/Polvo';
import { useAhora, useHoyEnAscent } from './ascent/titularDeHoy';
import { useResumenParaAscent } from './ascent/resumenParaAscent';
import { BotonDelTutorial, Tutorial, useTutorialVisto } from './ascent/Tutorial';
import { MapaDelAnio, ParaHoy, RestoVinculada, TusMusculos, useTusMusculos } from './ascent/Vinculada';
import { vincularDesdeMoss } from './ascent/vincularDesdeMoss';
import { Icono } from './comida/comunes';
import { useEstado } from './comida/datos';
import { entre, subirOBajar, UMBRAL, VELOCIDAD_MINIMA } from './movimiento';

const DEGRADE = 'linear-gradient(180deg, rgba(5, 6, 10, 0.5) 0px, rgba(5, 6, 10, 0.42) 240px, rgba(5, 6, 10, 0.6) 100%)';
/** El cuerpo de tu rango, de fondo: qué parte del camino de la sección hace al bajar y cuánto se corre con todo el scroll (está lejos). */
const CUERPO_SIGUE = 0.38;
/**
 * Lo primero que se ve (una parte de la sección) queda en su lugar si cambia el alto de lo de más arriba: el scroll lo
 * compensa solo, en el mismo cuadro. Lo que cambia desde ahí para abajo no corre nada.
 */
const ANCLA = { minIndexForVisible: 0 };

// moss://vincular (desde Ascent): Secciones abre la sección y esto, la hoja; vinculada, solo la sección.
const alPedirVincular = new Set<() => void>();
export const pedirLaHojaDeVincular = () => alPedirVincular.forEach((f) => f());
const CUERPO_CORRE = 70;

type Props = {
  /** Cuánto bajó: 0 cerrada (arriba, escondida), 1 abierta. */
  subida: SharedValue<number>;
  abierta: boolean;
  abajo: number;
  alCerrar: () => void;
  /** «Más en Sueño», desde la sugerencia de sueño de hoy. */
  alIrASueno: () => void;
};

export function Ascent({ subida, abierta, abajo, alCerrar, alIrASueno }: Props) {
  const { height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { vinculo } = useAscent();
  useResumenParaAscent();
  const [hoja, setHoja] = useState(false);
  const [vez, setVez] = useState(0);
  // La luna entra en la órbita cuando la hoja termina de bajar.
  const vinculada = vinculo.vinculada && !hoja;
  const ahora = useAhora();
  const h = useHoyEnAscent(ahora);
  const tm = useTusMusculos(vinculada ? h : null);
  const tutorial = useTutorialVisto(vinculo.desde);
  const [verTutorial, setVerTutorial] = useState(false);
  // Recién cuando la sección terminó de bajar: si aparece en el medio, la deja a mitad de camino.
  const [bajo, setBajo] = useState(false);
  const alBajar = (ya: boolean) => {
    // En la web, al cerrarse el tutorial el foco vuelve a la entrada de Progreso y el navegador corre la página hasta
    // ella: sin foco, no se mueve nada.
    if (ya && Platform.OS === 'web') (globalThis.document?.activeElement as { blur?: () => void } | null)?.blur?.();
    setBajo(ya);
  };
  useAnimatedReaction(
    () => subida.get() > 0.995,
    (ya, antes) => {
      if (ya !== antes) scheduleOnRN(alBajar, ya);
    },
  );
  const [vezDelTutorial, setVezDelTutorial] = useState(0);

  // El scroll: se llega abajo de todo y ahí se queda mientras se arma lo de arriba, hasta que la persona toca. Desde
  // ahí manda lo que está mirando (ANCLA). Antes se guardaba la distancia al final y se la reponía con cada cambio de
  // alto: abrir algo corría para arriba todo lo de antes, también lo que se había tocado, y lo sacaba de la pantalla.
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  const altoDelContenido = useSharedValue(0);
  const altoVisible = useSharedValue(0);
  const pegado = useRef(true);
  // Solo lo suelta la persona: un toque, arrastrar o, en la web, la rueda (que react-native-web le pasa al elemento y RN
  // no tipa). Un scroll que no hizo ella, como el ajuste del ANCLA (en RN 0.88 también avisa como scroll), no.
  const soltar = () => {
    pegado.current = false;
  };
  const conLaRueda = (Platform.OS === 'web' ? { onWheel: soltar } : {}) as object;
  // Lo que mueve el scroll sin tocar (VoiceOver, Control por voz, el teclado) llega solo como scroll: también lo suelta,
  // si no es el ajuste del ANCLA (pegado.ts).
  const ultimoScroll = useRef<DondeEsta>({ alto: 0, alFinal: 0 });
  const alScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const ahora = dondeEsta(nativeEvent);
    if (loMovioLaPersona(ultimoScroll.current, ahora)) soltar();
    ultimoScroll.current = ahora;
  };
  const alFondo = useDerivedValue(() => scrollY.get() >= altoDelContenido.get() - altoVisible.get() - 2);

  // Las cuentas de la sección se hacen cuando empieza a bajar, no con cada toque. Al cerrarse, lo desplegado se
  // pliega y la próxima vez se llega abajo de todo otra vez.
  const [aLaVista, setALaVista] = useState(false);
  const alMoverse = (visible: boolean) => {
    setALaVista(visible);
    if (visible) return;
    pegado.current = true;
    scroll.current?.scrollToEnd({ animated: false });
  };
  useAnimatedReaction(
    () => subida.get() > 0,
    (ahora2, antes) => {
      if (ahora2 !== antes) scheduleOnRN(alMoverse, ahora2);
    },
  );

  // Para volver, empujar para arriba abajo de todo, siguiendo al dedo. Mientras, el scroll queda quieto abajo.
  const tirando = useSharedValue(false);
  const cerrar = usePanGesture({
    enabled: alFondo,
    activeOffsetY: -8,
    failOffsetY: 6,
    failOffsetX: [-18, 18],
    onActivate: () => {
      'worklet';
      tirando.set(true);
    },
    onUpdate: (ev) => {
      'worklet';
      subida.set(entre(1 - Math.max(0, -ev.translationY - 10) / alto, 0, 1));
    },
    onDeactivate: (ev) => {
      'worklet';
      tirando.set(false);
      const p = subida.get();
      const sube = !ev.canceled && (1 - p >= UMBRAL || -ev.velocityY >= VELOCIDAD_MINIMA);
      subida.set(subirOBajar(p, sube ? 0 : 1));
      if (sube) scheduleOnRN(alCerrar);
    },
  });
  useAnimatedReaction(
    () => scrollY.get(),
    (y) => {
      const fondo = altoDelContenido.get() - altoVisible.get();
      if (tirando.get() && y !== fondo) scrollTo(scroll, 0, fondo, false);
    },
  );

  const estiloVelo = useAnimatedStyle(() => ({ opacity: 0.32 * subida.get() }));
  // Lo de adentro cambia al vincular o desvincular: entra con un fundido, apenas desde abajo. A mano y no con
  // `entering`: adentro de un scroll, en la web lo dejaba fuera de lugar.
  const cambio = useSharedValue(1);
  const [antes, setAntes] = useState(vinculada);
  if (antes !== vinculada) {
    setAntes(vinculada);
    cambio.set(0);
    cambio.set(withTiming(1, { duration: 600, easing: Easing.bezier(0.2, 0.7, 0.2, 1) }));
  }
  const estiloCambio = useAnimatedStyle(() => ({ opacity: cambio.get(), transform: [{ translateY: 8 * (1 - cambio.get()) }] }));
  // Al vincular o desvincular cambia todo lo de arriba: se vuelve a lo principal, abajo.
  useEffect(() => {
    pegado.current = true;
    scroll.current?.scrollToEnd({ animated: false });
  }, [vinculada, scroll]);
  // Desvinculada, una meta pedida con «Reintentar» ya no va.
  useEffect(() => {
    if (!vinculo.vinculada) olvidarLaMetaPedida();
  }, [vinculo.vinculada]);
  const estiloZona = useAnimatedStyle(() => ({ transform: [{ translateY: -(1 - subida.get()) * alto }], opacity: subida.get() > 0.0005 ? 1 : 0 }));
  // El cuerpo baja con la sección más despacio que ella y, con el scroll, se corre apenas.
  const bajaDelCuerpo = useDerivedValue(() => {
    const recorrido = Math.max(0, altoDelContenido.get() - altoVisible.get());
    const subido = recorrido ? entre((recorrido - scrollY.get()) / recorrido, 0, 1) : 1;
    return (1 - subida.get()) * alto * (1 - CUERPO_SIGUE) - (1 - subido) * CUERPO_CORRE;
  });

  const abrirHoja = () => {
    setVez((x) => x + 1);
    setHoja(true);
  };
  useEffect(() => {
    const pedir = () => {
      if (!vinculo.vinculada) abrirHoja();
    };
    alPedirVincular.add(pedir);
    return () => {
      alPedirVincular.delete(pedir);
    };
  }, [vinculo.vinculada]);
  // La primera vez que se sube a la sección después de vincular, el tutorial aparece solo, ya abierta del todo.
  const tutorialAbierto = verTutorial || (abierta && bajo && vinculada && !!tm && tutorial.visto === false);
  const abrirTutorial = () => {
    setVezDelTutorial((v) => v + 1);
    setVerTutorial(true);
  };

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, st.velo, estiloVelo]} pointerEvents="none" />
      <Animated.View
        style={[StyleSheet.absoluteFill, st.zona, estiloZona]}
        pointerEvents={abierta ? 'box-none' : 'none'}
        accessibilityViewIsModal={abierta}
        accessibilityElementsHidden={!aLaVista}
        importantForAccessibility={aLaVista ? 'auto' : 'no-hide-descendants'}
        accessibilityLabel="Ascent"
      >
        <View style={[StyleSheet.absoluteFill, st.cielo]} pointerEvents="none">
          <CuerpoDeFondo baja={bajaDelCuerpo} activo={aLaVista} />
        </View>
        <GestureDetector gesture={cerrar}>
          <View
            collapsable={false}
            style={StyleSheet.absoluteFill}
            // Cualquier toque: ya no se sigue el final.
            onStartShouldSetResponderCapture={() => {
              soltar();
              return false;
            }}
            {...conLaRueda}
          >
            <Animated.View style={[StyleSheet.absoluteFill, estiloCambio]}>
              <ScrollView
                ref={scroll}
                simultaneousWith={cerrar}
                scrollEventThrottle={16}
                showsVerticalScrollIndicator={false}
                maintainVisibleContentPosition={ANCLA}
                contentContainerStyle={[st.contenido, { paddingTop: insets.top + 6, paddingBottom: abajo + 14 }]}
                onLayout={(ev) => altoVisible.set(ev.nativeEvent.layout.height)}
                onContentSizeChange={(_, nuevo) => {
                  altoDelContenido.set(nuevo);
                  // También si se achicó lo de abajo de todo y el scroll quedó más allá del final: iOS no lo trae solo.
                  if (pegado.current || scrollY.get() > nuevo - altoVisible.get()) scroll.current?.scrollToEnd({ animated: false });
                }}
                onScrollBeginDrag={soltar}
                onScroll={alScroll}
              >
                {/* Lo que sobra va arriba: así lo principal queda pegado abajo aunque haya poco. */}
                <View style={st.lleno} />
                {/* Cada parte, suelta en el scroll y no en una caja: el ancla se agarra de la primera que se ve. */}
                {vinculada && h && tm ? (
                  <RestoVinculada h={h} tm={tm} preparada={aLaVista} />
                ) : (
                  <SinVincular />
                )}
                <Principal vinculada={vinculada} ayuda={vinculada && tm ? <BotonDelTutorial alTocar={abrirTutorial} /> : null}>
                  {vinculada && tm && h ? <TusMusculos tm={tm} hoy={<ParaHoy h={h} tm={tm} alIrASueno={alIrASueno} />} /> : <CabezaSinVincular alVincular={() => vincularDesdeMoss(abrirHoja).catch(() => {})} />}
                </Principal>
                <Pie vinculada={vinculada} alVolver={alCerrar} activo={aLaVista} />
              </ScrollView>
            </Animated.View>
          </View>
        </GestureDetector>
      </Animated.View>
      <HojaDeVincular key={vez} abierta={hoja} alCerrar={() => setHoja(false)} />
      <Tutorial abierto={tutorialAbierto} vez={vezDelTutorial} alTerminar={() => { setVerTutorial(false); tutorial.marcar(); }} />
    </>
  );
}

/** Lo principal, abajo: con la marca arriba a la derecha y una línea de pelo que lo separa de lo que sigue arriba. */
function Principal({ vinculada, ayuda, children }: { vinculada: boolean; ayuda?: ReactNode; children: ReactNode }) {
  const reducido = useReducedMotion();
  const a = useAcento();
  const u = useSharedValue(vinculada ? 1 : 0);
  useEffect(() => {
    u.set(withTiming(vinculada ? 1 : 0, { duration: reducido ? 0 : 700, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [vinculada, reducido, u]);
  // Vinculada, la marca se achica (de 76 a 46) y sube: el titular manda.
  const marca = useAnimatedStyle(() => ({ transform: [{ translateY: -12 * u.get() }, { scale: 1 - (30 / 76) * u.get() }] }));
  return (
    <View collapsable={false} style={st.base}>
      <Animated.View style={[st.marca, marca]} pointerEvents="none">
        <Marca tam={76} unida={vinculada} />
      </Animated.View>
      {/* El «!» del tutorial, a la izquierda de la marca. */}
      {ayuda && <View style={st.ayuda}>{ayuda}</View>}
      {vinculada && <Text style={[p.etq, st.nombre, { color: a.claro }]}>{t('ascent.titulo')}</Text>}
      {children}
    </View>
  );
}

/** Sin vincular: «Ascent», la frase, la acción (un octágono) y, subrayado, la App Store. */
function CabezaSinVincular({ alVincular }: { alVincular: () => void }) {
  const fuente = useTitulares();
  return (
    <View style={st.cab}>
      <Text style={[st.titulo, { fontFamily: fuente }]} numberOfLines={1}>{t('ascent.titulo')}</Text>
      <Text style={st.bajada}>{t('ascent.bajada')}</Text>
      <Accion texto={t('ascent.vincular')} alTocar={alVincular} estilo={st.vincular} />
      <Pressable onPress={irALaAppStore} style={({ pressed }) => [st.conseguir, pressed && { opacity: 0.6 }]} hitSlop={8} accessibilityRole="link">
        <Text style={st.conseguirTexto}>{t('ascent.conseguir')}</Text>
      </Pressable>
    </View>
  );
}

/** Sin vincular, cada parte vacía con su candado, mostrando lo que va a mostrar, en el mismo orden que vinculada. */
function SinVincular() {
  const hoy = useEstado().hoy;
  const vacia = (titulo: string, texto: string, dibujo: ReactNode, primera = false) => (
    <Parte titulo={titulo} derecha={<Candado />} primera={primera}>
      <Una>{texto}</Una>
      {dibujo}
    </Parte>
  );
  return (
    <>
      <Text style={[p.etq, st.grupo]}>{t('ascent.soloConLasDos')}</Text>
      {vacia(t('ascent.metas.titulo'), t('ascent.vacio.metas'), null, true)}
      {vacia(t('ascent.porQue.titulo'), t('ascent.vacio.porQue'), null)}
      {vacia(t('ascent.estancados.lista'), t('ascent.vacio.estancados'), null)}
      {vacia(t('ascent.anio.titulo'), t('ascent.vacio.anio'), <MapaDelAnio hoy={hoy} dias={[]} vacio />)}
      {vacia(t('ascent.fatigados.titulo'), t('ascent.vacio.fatigados'), null)}
      {vacia(t('ascent.tus.titulo'), t('ascent.vacio.musculos'), <View style={st.cuerpoVacio}><Cuerpo ancho={290} clases={{}} rotulos apagado etiqueta={t('ascent.tus.titulo')} /></View>)}
    </>
  );
}

/** El final, abajo, pegado a Progreso: volver es bajar, así que la flecha apunta para abajo y respira. */
function Pie({ vinculada, alVolver, activo }: { vinculada: boolean; alVolver: () => void; activo: boolean }) {
  const reducido = useReducedMotion();
  const respira = useSharedValue(0);
  useEffect(() => {
    if (!activo || reducido) return;
    respira.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true));
    return () => cancelAnimation(respira);
  }, [activo, reducido, respira]);
  const flecha = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * respira.get(), transform: [{ translateY: 3 * respira.get() }] }));
  return (
    <View style={st.final}>
      {vinculada && <Text style={st.pie}>{t('ascent.desvincular')}</Text>}
      <Pressable onPress={alVolver} style={({ pressed }) => [st.volver, pressed && { opacity: 0.6 }]} accessibilityRole="button" hitSlop={8}>
        <Text style={st.volverTexto}>{t('ascent.volverAProgreso')}</Text>
        <Animated.View style={flecha}>
          <Icono nombre="chevron.down" tam={18} color={C.sub} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const st = StyleSheet.create({
  velo: { backgroundColor: '#020308' },
  zona: (Platform.OS === 'web' ? { backgroundImage: DEGRADE } : { experimental_backgroundImage: DEGRADE }) as ViewStyle,
  cielo: { overflow: 'hidden' },
  // Se llega por abajo: lo principal queda pegado abajo.
  // Que crezca con lo de adentro (en la web, sin flexShrink en 0 se quedaba del alto de la pantalla y no había scroll).
  contenido: { flexGrow: 1, flexShrink: 0, paddingHorizontal: 22 },
  lleno: { flexGrow: 1 },
  base: { marginTop: 30, paddingTop: 14, marginHorizontal: -22, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  // 6 puntos adentro del margen de la derecha.
  marca: { position: 'absolute', right: 16, top: 20, width: 76, height: 76, transformOrigin: 'top right' },
  ayuda: { position: 'absolute', right: 74, top: 18, zIndex: 1 },
  nombre: { marginTop: 4, marginBottom: 12, color: C.claro },
  cab: { marginTop: 10, paddingRight: 78 },
  titulo: { marginTop: 8, fontSize: 46, lineHeight: 50, letterSpacing: -0.9, color: C.claro },
  bajada: { marginTop: 14, marginRight: -78, fontFamily: letras.texto, fontSize: 15, lineHeight: 21.3, color: C.tinta },
  vincular: { marginTop: 20, marginRight: -78 },
  conseguir: { alignSelf: 'center', marginTop: 18, marginRight: -78, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(232, 236, 246, 0.42)' },
  conseguirTexto: { fontFamily: letras.texto, fontSize: 13.5, color: C.tinta },
  grupo: { marginTop: 36, marginHorizontal: -22, paddingTop: 12, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  filaVacia: { paddingTop: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  filaVaciaCab: { flexDirection: 'row', alignItems: 'baseline', gap: 9 },
  filaVaciaNombre: { fontFamily: letras.texto, fontSize: 16.5, color: C.tinta },
  filaVaciaValor: { fontFamily: letras.numeroLiviano, fontSize: 15, color: C.sub },
  fuerzaVacia: { marginTop: 8 },
  fuerzaVaciaEj: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  fuerzaVaciaNombre: { fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  fuerzaVaciaRaya: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, color: C.sub },
  tendenciaVacia: { width: 120, marginHorizontal: 4, borderTopWidth: 1, borderStyle: 'dashed', borderColor: C.lineaFuerte },
  cuerpoVacio: { alignItems: 'center', marginTop: 10 },
  final: { alignItems: 'center', gap: 6, marginTop: 30 },
  pie: { fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: C.apagado, textAlign: 'center' },
  volver: { alignItems: 'center', gap: 2, paddingVertical: 6, paddingHorizontal: 12 },
  volverTexto: { fontFamily: letras.texto, fontSize: 13, color: C.sub },
});

