// Cómo se lee la sección (spec/musculos-compartido.md, 3): cinco pasos, cada uno con un dibujo que se mueve, como en
// Ascent. No se saltea: cada paso espera 2 segundos antes de dejar pasar al siguiente (la barra del botón se llena) y
// recién el último cierra. Aparece solo la primera vez que subes a la sección después de vincular; después, desde el
// «!». Con Reducir movimiento, los dibujos quedan quietos en su estado final y el botón se habilita igual a los 2 s.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import type { Musculo } from '@/dominio/musculos';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C, useAcento } from './colores';
import { Cuerpo, Reloj, type EstadoDibujado } from './Dibujos';
import { Octogono, useTitulares } from './piezas';
import { tx } from './palabras';

/** Lo que espera cada paso antes de dejar pasar. */
const ESPERA_MS = 2000;
const PASOS = ['color', 'barra', 'toca', 'fatigados', 'anotas'] as const;
type Paso = (typeof PASOS)[number];
const VISTO = 'moss:ascent:tutorial';

/**
 * Si ya se vio el tutorial con este vínculo: se guarda el día en que se vinculó, así uno nuevo lo vuelve a mostrar.
 * Mientras se lee, null.
 */
export function useTutorialVisto(desde: string | null) {
  const [visto, setVisto] = useState<boolean | null>(null);
  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(VISTO).then((x) => vivo && setVisto(x === (desde ?? '')), () => vivo && setVisto(true));
    return () => {
      vivo = false;
    };
  }, [desde]);
  const marcar = () => {
    setVisto(true);
    AsyncStorage.setItem(VISTO, desde ?? '').catch(() => {});
  };
  return { visto, marcar };
}

/** El «!» de arriba a la derecha, al lado de la marca, con «Cómo se lee»: solo, no se entendía que era un botón. */
export function BotonDelTutorial({ alTocar }: { alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} hitSlop={10} style={({ pressed }) => [st.boton, pressed && { opacity: 0.6 }]} accessibilityRole="button" accessibilityLabel={t('ascent.tutorial.abrir')}>
      <View style={st.botonCirculo}><Text style={st.botonTexto}>!</Text></View>
      <Text style={st.botonEtiqueta}>{t('ascent.tutorial.abrir')}</Text>
    </Pressable>
  );
}

/** `vez` cambia con cada apertura: así se vuelve a empezar del primer paso. */
export function Tutorial({ abierto, vez, alTerminar }: { abierto: boolean; vez: number; alTerminar: () => void }) {
  // Sin «Atrás» de Android que lo cierre: no se saltea, se cierra con el último paso.
  return (
    <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <Pasos key={vez} alTerminar={alTerminar} />
    </Modal>
  );
}

function Pasos({ alTerminar }: { alTerminar: () => void }) {
  const [i, setI] = useState(0);
  // El paso que ya esperó sus 2 segundos.
  const [esperado, setEsperado] = useState(-1);
  const reducido = useReducedMotion();
  const fuente = useTitulares();
  const a = useAcento();
  const lleno = useSharedValue(0);
  const entra = useSharedValue(0);
  useEffect(() => {
    lleno.set(0);
    lleno.set(withTiming(1, { duration: ESPERA_MS, easing: Easing.linear }));
    entra.set(0);
    entra.set(withTiming(1, { duration: reducido ? 120 : 420, easing: Easing.bezier(0.2, 0.7, 0.2, 1) }));
    const reloj = setTimeout(() => setEsperado(i), ESPERA_MS);
    return () => clearTimeout(reloj);
  }, [i, lleno, entra, reducido]);
  const listo = esperado === i;
  const barra = useAnimatedStyle(() => ({ width: `${lleno.get() * 100}%` }));
  const contenido = useAnimatedStyle(() => ({ opacity: entra.get(), transform: [{ translateY: reducido ? 0 : 10 * (1 - entra.get()) }] }));
  const paso = PASOS[i];
  const ultimo = i === PASOS.length - 1;
  const seguir = () => {
    if (!listo) return;
    if (ultimo) alTerminar();
    else setI(i + 1);
  };
  return (
    <View style={st.fondo}>
      <Text style={st.contador}>{t('ascent.tutorial.paso', { n: i + 1, de: PASOS.length })}</Text>
      <Animated.View key={paso} style={[st.contenido, contenido]}>
        <View style={st.dibujo}><Dibujo paso={paso} /></View>
        <Text style={[st.titulo, { fontFamily: fuente, color: a.claro }]}>{tx(`ascent.tutorial.pasos.${paso}.titulo`)}</Text>
        <Text style={st.texto}>{tx(`ascent.tutorial.pasos.${paso}.texto`)}</Text>
      </Animated.View>
      <View style={st.puntos}>
        {PASOS.map((p, k) => <View key={p} style={[st.punto, k === i && { backgroundColor: a.claro, width: 16 }]} />)}
      </View>
      <Pressable onPress={seguir} disabled={!listo} style={st.accion} accessibilityRole="button" accessibilityState={{ disabled: !listo }}>
        <Octogono corte={11} color="rgba(170, 178, 196, 0.16)" style={st.accionCaja}>
          <Animated.View style={[StyleSheet.absoluteFill, st.accionLleno, { backgroundColor: a.claro }, barra]} />
          <Text style={st.accionTexto}>{t(ultimo ? 'ascent.tutorial.listo' : 'ascent.tutorial.siguiente')}</Text>
        </Octogono>
      </Pressable>
    </View>
  );
}

// ------------------------------------------------------------ los dibujos de cada paso
/** Va de 0 a `n - 1` cada `ms`, en vuelta; con Reducir movimiento, se queda en el último. */
function usePaso(n: number, ms: number) {
  const reducido = useReducedMotion();
  const [k, setK] = useState(reducido ? n - 1 : 0);
  useEffect(() => {
    if (reducido) return;
    const reloj = setInterval(() => setK((x) => (x + 1) % n), ms);
    return () => clearInterval(reloj);
  }, [n, ms, reducido]);
  return k;
}

const COLOREADO: [Musculo, EstadoDibujado][] = [['pecho', 'enSuPunto'], ['cuadriceps', 'enSuPunto'], ['hombros', 'poco'], ['dorsales', 'enSuPunto'], ['gluteos', 'mucho'], ['biceps', 'poco']];

function Dibujo({ paso }: { paso: Paso }) {
  if (paso === 'color') return <Coloreando />;
  if (paso === 'barra') return <BarraQueSube />;
  if (paso === 'toca') return <Tocando />;
  if (paso === 'fatigados') return <Recuperandose />;
  return <ConLoQueAnotas />;
}

function Coloreando() {
  const k = usePaso(COLOREADO.length + 2, 650);
  const clases = Object.fromEntries(COLOREADO.slice(0, Math.min(k + 1, COLOREADO.length)));
  return <Cuerpo ancho={230} clases={clases} etiqueta={tx('ascent.tutorial.pasos.color.titulo')} />;
}

function BarraQueSube() {
  const a = useAcento();
  const reducido = useReducedMotion();
  const v = useSharedValue(reducido ? 0.5 : 0);
  useEffect(() => {
    if (reducido) return;
    v.set(withRepeat(withSequence(withTiming(0.5, { duration: 1400, easing: Easing.bezier(0.2, 0.7, 0.2, 1) }), withDelay(900, withTiming(0, { duration: 500 }))), -1));
  }, [reducido, v]);
  const lleno = useAnimatedStyle(() => ({ width: `${v.get() * 100}%` }));
  return (
    <View style={st.barraDibujo}>
      <View style={st.barraPista}>
        <View style={[st.barraZona, { left: '33.3%', width: '33.3%' }]} />
        <Animated.View style={[st.barraLleno, { backgroundColor: a.claro }, lleno]} />
        <View style={[st.barraBordes, { left: '33.3%', width: '33.3%' }]} />
      </View>
      <View style={st.barraEje}>
        {['0', '10', '15', '20', '30'].map((x, k) => (
          <Text key={x} style={[st.barraNumero, { left: `${[0, 33.3, 50, 66.7, 100][k]}%` }, x === '15' && { color: C.tinta }]}>{x}</Text>
        ))}
      </View>
    </View>
  );
}

function Tocando() {
  const k = usePaso(3, 1100);
  const elegido = k === 0 ? null : 'pecho';
  return (
    <View style={st.centro}>
      <Cuerpo ancho={190} clases={{ pecho: 'enSuPunto', triceps: 'poco', hombros: 'poco' }} elegido={elegido} etiqueta={tx('ascent.tutorial.pasos.toca.titulo')} />
    </View>
  );
}

function Recuperandose() {
  const k = usePaso(2, 1300);
  return (
    <View style={st.centro}>
      <Cuerpo ancho={170} clases={{ cuadriceps: 'enSuPunto', gluteos: 'enSuPunto', isquios: 'poco' }} fatigados={k === 0 ? ['cuadriceps', 'gluteos'] : ['cuadriceps']} etiqueta={tx('ascent.tutorial.pasos.fatigados.titulo')} />
      <View style={st.relojDibujo}>
        <Reloj tam={34} hecho={k === 0 ? 0.35 : 0.75} color={C.lejos} />
        <Text style={st.relojTexto}>{t('ascent.fatigados.vuelve', { cuando: t(k === 0 ? 'ascent.titular.cuando.pasadoManana' : 'ascent.titular.cuando.manana') })}</Text>
      </View>
    </View>
  );
}

function ConLoQueAnotas() {
  const a = useAcento();
  const k = usePaso(4, 700);
  const cosas = [t('ascent.tutorial.fuentes.ascent'), t('ascent.tutorial.fuentes.sueno'), t('ascent.tutorial.fuentes.comida')];
  return (
    <View style={st.anotas}>
      {cosas.map((x, n) => (
        <View key={x} style={[st.anota, { opacity: k > n ? 1 : 0.25 }]}>
          <View style={[st.anotaPunto, k > n && { backgroundColor: a.claro, borderColor: a.claro }]} />
          <Text style={st.anotaTexto}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  boton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: 4, paddingRight: 10, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  botonCirculo: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.2, borderColor: C.sub, alignItems: 'center', justifyContent: 'center' },
  botonEtiqueta: { fontFamily: letras.texto, fontSize: 12, color: C.sub },
  botonTexto: { fontFamily: letras.textoMedio, fontSize: 11, lineHeight: 13, color: C.sub },
  fondo: { flex: 1, backgroundColor: C.fondo, paddingHorizontal: 28, paddingTop: 70, paddingBottom: 44 },
  contador: { fontFamily: letras.textoMedio, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  contenido: { flex: 1, justifyContent: 'center' },
  dibujo: { height: 260, alignItems: 'center', justifyContent: 'center' },
  titulo: { marginTop: 26, fontSize: 30, lineHeight: 34, letterSpacing: -0.4 },
  texto: { marginTop: 12, fontFamily: letras.texto, fontSize: 16, lineHeight: 23, color: C.tinta },
  puntos: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 20 },
  punto: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(170, 178, 196, 0.3)' },
  accion: { alignSelf: 'stretch' },
  accionCaja: { minHeight: 52, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  accionLleno: { right: undefined, opacity: 0.9 },
  accionTexto: { fontFamily: letras.textoMedio, fontSize: 15, letterSpacing: 0.15, color: C.fondo },
  centro: { alignItems: 'center' },
  relojDibujo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  relojTexto: { fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  barraDibujo: { width: 280 },
  barraPista: { height: 14, borderRadius: 7, backgroundColor: 'rgba(170, 178, 196, 0.1)', overflow: 'hidden' },
  barraZona: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(170, 178, 196, 0.16)' },
  // Los bordes de la franja van encima de lo lleno: se ven siempre.
  barraBordes: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(232, 236, 246, 0.7)' },
  barraLleno: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 7 },
  barraEje: { height: 18, marginTop: 8 },
  barraNumero: { position: 'absolute', width: 40, marginLeft: -20, textAlign: 'center', fontFamily: letras.numero, fontSize: 11.5, color: C.apagado },
  lineas: { gap: 8, marginTop: 14, alignItems: 'center' },
  linea: { height: 6, borderRadius: 3, backgroundColor: 'rgba(170, 178, 196, 0.3)' },
  anotas: { gap: 16 },
  anota: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  anotaPunto: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.4, borderColor: C.apagado },
  anotaTexto: { fontFamily: letras.texto, fontSize: 18, color: C.tinta },
});
