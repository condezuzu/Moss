// Ascent, arriba de Progreso (spec/ascent.md, «Ascent en Progreso»), como la galería (galeria/src/ascent.js): como
// si Progreso siguiera para arriba. Baja siguiendo al dedo desde arriba de todo de Progreso (el gesto es de
// Progreso), con Progreso pegado abajo, y se llega abajo de todo, a lo principal: lo de hoy o, sin vincular,
// vincular. Subiendo está el resto, de lo más a lo menos importante, y arriba de todo, de fondo, el cuerpo de tu
// rango, como las estrellas. Volver es bajar: abajo de todo, empujar para arriba, «Volver a Progreso» o tocar
// Progreso. El cielo sigue detrás, apenas oscurecido para leer.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { GestureDetector, ScrollView, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation, Easing, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedStyle, useDerivedValue, useReducedMotion, useScrollOffset, useSharedValue,
  withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useAscent } from '@/almacen/ascent';
import { NOCHE_CORTA } from '@/dominio/rendimiento';
import { PROTEINA_POR_KG } from '@/dominio/estancados';
import { irALaAppStore } from '@/lib/ascent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C } from './ascent/colores';
import { Cuerpo, Marca } from './ascent/Dibujos';
import { HojaDeVincular } from './ascent/HojaDeVincular';
import { Accion, Candado, Escala, Parte, Pildoras, st as p, Una, useTitulares } from './ascent/piezas';
import { Polvo } from './ascent/Polvo';
import { useAhora, useHoyEnAscent } from './ascent/titularDeHoy';
import { CabezaDelDia, DecideFila, MapaDelAnio, RestoVinculada, type IrA } from './ascent/Vinculada';
import { Icono } from './comida/comunes';
import { useEstado } from './comida/datos';
import { entre, subirOBajar, UMBRAL, VELOCIDAD_MINIMA } from './movimiento';

const DEGRADE = 'linear-gradient(180deg, rgba(5, 6, 10, 0.5) 0px, rgba(5, 6, 10, 0.42) 240px, rgba(5, 6, 10, 0.6) 100%)';
/** El cuerpo de tu rango, de fondo: qué parte del camino de la sección hace al bajar y cuánto se corre con todo el scroll (está lejos). */
const CUERPO_SIGUE = 0.38;
const CUERPO_CORRE = 70;

type Props = {
  /** Cuánto bajó: 0 cerrada (arriba, escondida), 1 abierta. */
  subida: SharedValue<number>;
  abierta: boolean;
  abajo: number;
  alCerrar: () => void;
  /** Lo que falta se anota en su sección: la noche en Sueño. */
  alIr: (a: IrA) => void;
};

export function Ascent({ subida, abierta, abajo, alCerrar, alIr }: Props) {
  const { height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { vinculo } = useAscent();
  const [hoja, setHoja] = useState(false);
  const [vez, setVez] = useState(0);
  const [como, setComo] = useState(false);
  // La luna entra en la órbita cuando la hoja termina de bajar.
  const vinculada = vinculo.vinculada && !hoja;
  const ahora = useAhora();
  const h = useHoyEnAscent(ahora);

  // El scroll: se llega abajo de todo y, al volver a pintar, se queda donde estaba contando desde abajo (-1: abajo de todo).
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  const altoDelContenido = useSharedValue(0);
  const altoVisible = useSharedValue(0);
  const desdeAbajo = useSharedValue(-1);
  const alFondo = useDerivedValue(() => scrollY.get() >= altoDelContenido.get() - altoVisible.get() - 2);
  const yDeComo = useRef(0);

  // Las cuentas de la sección se hacen cuando empieza a bajar, no con cada toque. Al cerrarse, lo desplegado se
  // pliega y la próxima vez se llega abajo de todo otra vez.
  const [aLaVista, setALaVista] = useState(false);
  const alMoverse = (visible: boolean) => {
    setALaVista(visible);
    if (visible) return;
    desdeAbajo.set(-1);
    setComo(false);
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
  const verComo = () => {
    setComo(true);
    // Que se vea el título de «En qué se basa», con un poco de aire arriba.
    setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, yDeComo.current - 60), animated: true }), 60);
  };
  const ir = (a: IrA) => {
    alCerrar();
    alIr(a);
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
          <Polvo baja={bajaDelCuerpo} activo={aLaVista} />
        </View>
        <GestureDetector gesture={cerrar}>
          <View collapsable={false} style={StyleSheet.absoluteFill}>
            <ScrollView
              ref={scroll}
              simultaneousWith={cerrar}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[st.contenido, { paddingTop: insets.top + 6, paddingBottom: abajo + 14 }]}
              onLayout={(ev) => altoVisible.set(ev.nativeEvent.layout.height)}
              onContentSizeChange={(_, nuevo) => {
                altoDelContenido.set(nuevo);
                const visible = altoVisible.get();
                const lejos = desdeAbajo.get();
                scroll.current?.scrollTo({ y: Math.max(0, nuevo - (lejos < 0 ? visible : lejos)), animated: false });
              }}
              onScroll={(ev) => {
                const { contentSize, contentOffset } = ev.nativeEvent;
                desdeAbajo.set(contentSize.height - contentOffset.y);
              }}
            >
              {/* Lo que sobra va arriba: así lo principal queda pegado abajo aunque haya poco. */}
              <View style={st.lleno} />
              <Animated.View style={[st.sinAchicar, estiloCambio]}>
                {vinculada && h ? (
                  <RestoVinculada h={h} preparada={aLaVista} como={como} alComo={setComo} alMedirComo={(y) => (yDeComo.current = y)} alIr={ir} />
                ) : (
                  <SinVincular />
                )}
                <Principal vinculada={vinculada}>
                  {vinculada && h ? <CabezaDelDia h={h} alVerComo={verComo} /> : <CabezaSinVincular alVincular={abrirHoja} />}
                </Principal>
                <Pie vinculada={vinculada} alVolver={alCerrar} activo={aLaVista} />
              </Animated.View>
            </ScrollView>
          </View>
        </GestureDetector>
      </Animated.View>
      <HojaDeVincular key={vez} abierta={hoja} alCerrar={() => setHoja(false)} />
    </>
  );
}

/** Lo principal, abajo: con la marca arriba a la derecha y una línea de pelo que lo separa de lo que sigue arriba. */
function Principal({ vinculada, children }: { vinculada: boolean; children: ReactNode }) {
  const reducido = useReducedMotion();
  const u = useSharedValue(vinculada ? 1 : 0);
  useEffect(() => {
    u.set(withTiming(vinculada ? 1 : 0, { duration: reducido ? 0 : 700, easing: Easing.bezier(0.16, 1, 0.3, 1) }));
  }, [vinculada, reducido, u]);
  // Vinculada, la marca se achica (de 76 a 46) y sube: el titular manda.
  const marca = useAnimatedStyle(() => ({ transform: [{ translateY: -12 * u.get() }, { scale: 1 - (30 / 76) * u.get() }] }));
  return (
    <View style={st.base}>
      <Animated.View style={[st.marca, marca]} pointerEvents="none">
        <Marca tam={76} unida={vinculada} />
      </Animated.View>
      {vinculada && <Text style={[p.etq, st.nombre]}>{t('ascent.titulo')}</Text>}
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

/** Sin vincular, cada parte vacía con su candado, mostrando lo que va a mostrar. */
function SinVincular() {
  const hoy = useEstado().hoy;
  const vacia = (titulo: string, texto: string, dibujo: ReactNode, primera = false) => (
    <Parte titulo={titulo} derecha={<Candado />} primera={primera}>
      <Una>{texto}</Una>
      {dibujo}
    </Parte>
  );
  const fila = (nombre: string, contenido: ReactNode, primera = false) => (
    <View style={[st.filaVacia, primera && { borderTopWidth: 0, paddingTop: 10 }]}>
      <View style={st.filaVaciaCab}>
        <Text style={st.filaVaciaNombre}>{nombre}</Text>
        <Text style={st.filaVaciaValor}>—</Text>
      </View>
      {contenido}
    </View>
  );
  return (
    <>
      <Text style={[p.etq, st.grupo]}>{t('ascent.soloConLasDos')}</Text>
      {vacia(t('ascent.anio.titulo'), t('ascent.vacio.anio'), <MapaDelAnio hoy={hoy} dias={[]} vacio />, true)}
      {vacia(t('ascent.estancados.titulo'), t('ascent.vacio.estancamiento'), null)}
      {vacia(t('ascent.marcas.titulo'), t('ascent.vacio.marcas'), null)}
      {vacia(t('ascent.fuerza.titulo'), t('ascent.vacio.fuerza'), (
        <View style={st.fuerzaVacia}>
          {(['sentadilla', 'press_banca', 'peso_muerto'] as const).map((id, i) => (
            <View key={id} style={[st.fuerzaVaciaEj, i === 0 && { borderTopWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={st.fuerzaVaciaNombre}>{t(`ascent.ejercicios.${id}`)}</Text>
                <Text style={st.fuerzaVaciaRaya}>—</Text>
              </View>
              {/* La tendencia vacía: una raya punteada (sin un lienzo más). */}
              <View style={st.tendenciaVacia} />
            </View>
          ))}
        </View>
      ))}
      {vacia(t('ascent.cuerpo.titulo'), t('ascent.vacio.cuerpo'), <View style={st.cuerpoVacio}><Cuerpo ancho={290} clases={{}} rotulos apagado etiqueta={t('ascent.cuerpo.titulo')} /></View>)}
      {vacia(t('ascent.filas.titulo'), t('ascent.vacio.filas'), (
        <View>
          {fila(t('ascent.filas.sueno.nombre'), <Escala valor={null} tope={10 * 60} rayas={[[NOCHE_CORTA, t('ascent.filas.sueno.seis')], [8 * 60, t('ascent.filas.sueno.tuyo', { horas: '8 h' })]]} zona={NOCHE_CORTA} />, true)}
          {fila(t('ascent.filas.musculos.nombre'), <Pildoras apagadas items={(['cuadriceps', 'gluteos', 'pecho', 'espaldaAlta'] as const).map((m) => ({ clave: m, texto: t(`ascent.musculos.nombres.${m}`), estado: 'recuperado' as const }))} />)}
          {fila(t('ascent.filas.comida.nombre'), <Escala valor={null} tope={2.6} rayas={[[PROTEINA_POR_KG, t('ascent.filas.comida.raya')]]} />)}
        </View>
      ))}
      {vacia(t('ascent.vacio.titular'), t('ascent.vacio.titularTexto'), (
        <DecideFila vacio items={[
          ['noche', 'moon', t('ascent.decide.noche'), '—', false],
          ['musculos', 'dumbbell', t('ascent.decide.musculos'), '—', false],
          ['siente', 'heart', t('ascent.decide.siente'), '—', false],
        ]} />
      ))}
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
  sinAchicar: { flexShrink: 0 },
  base: { marginTop: 30, paddingTop: 14, marginHorizontal: -22, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  // 6 puntos adentro del margen de la derecha.
  marca: { position: 'absolute', right: 16, top: 20, width: 76, height: 76, transformOrigin: 'top right' },
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

