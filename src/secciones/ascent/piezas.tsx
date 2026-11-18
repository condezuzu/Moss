// Las piezas de la sección de Ascent, con el lenguaje de Ascent (galeria/src/ascent.js): un titular grande sin
// caja, línea de pelo y aire en vez de tarjetas, octágono de esquinas cortadas solo para la acción, píldora para
// lo que se elige y lo secundario, subrayado. Lo único con color es lo que pone el límite hoy, en terracota.
// Lo que cambia se anima a mano y no con `entering` ni `layout`: la sección se arma escondida, arriba, y así
// (en la web, por lo menos) esas animaciones dejaban lo de adentro fuera de lugar.

import { useFonts } from 'expo-font';
import { Outfit_200ExtraLight } from '@expo-google-fonts/outfit/200ExtraLight';
import { useEffect, useState, type ReactNode } from 'react';
import { scheduleOnRN } from 'react-native-worklets';
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { C, useAcento } from './colores';

/** Los titulares de Ascent van en Outfit 200; hasta que carga, en la más liviana que ya tiene Moss. */
export function useTitulares(): string {
  const [cargada] = useFonts({ Outfit_200ExtraLight });
  return cargada ? 'Outfit_200ExtraLight' : letras.numeroLiviano;
}

const LLEGA = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Lo de adentro, cuando cambia `clave`, entra con un fundido, apenas desde abajo: nada aparece de golpe. */
export function Fundido({ clave, children, style }: { clave: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducido = useReducedMotion();
  const v = useSharedValue(1);
  const [antes, setAntes] = useState(clave);
  if (antes !== clave) {
    setAntes(clave);
    v.set(0);
    v.set(withTiming(1, { duration: reducido ? 120 : 450, easing: LLEGA }));
  }
  const estilo = useAnimatedStyle(() => ({ opacity: v.get(), transform: [{ translateY: reducido ? 0 : 8 * (1 - v.get()) }] }));
  return <Animated.View style={[style, estilo]}>{children}</Animated.View>;
}

/** Un texto que, al cambiar, entra con un fundido. */
export function Cambia({ texto, style }: { texto: string; style?: StyleProp<TextStyle> }) {
  return (
    <Fundido clave={texto}>
      <Text style={style}>{texto}</Text>
    </Fundido>
  );
}

export const Etiqueta = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[st.etq, style]} accessibilityRole="header">{children}</Text>;
export const Una = ({ children }: { children: ReactNode }) => <Text style={st.una}>{children}</Text>;
export const Nota = ({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) => <Text style={[st.nota, style]}>{children}</Text>;

/** Una parte: cuelga de una línea de pelo de borde a borde, con su título y, a la derecha, lo que la acompaña. */
export function Parte({ titulo, derecha, children, primera, estilo }: { titulo: string; derecha?: ReactNode; children?: ReactNode; primera?: boolean; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={[st.parte, primera && st.partePrimera, estilo]}>
      <View style={st.parteCab}>
        <Etiqueta>{titulo}</Etiqueta>
        {typeof derecha === 'string' ? <Text style={st.derecha}>{derecha}</Text> : derecha}
      </View>
      {children}
    </View>
  );
}

/** Lo secundario: subrayado. */
export function Enlace({ texto, alTocar, estilo, expandido }: { texto: string; alTocar: () => void; estilo?: StyleProp<ViewStyle>; expandido?: boolean }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [st.enlace, pressed && st.apretado, estilo]} hitSlop={8} accessibilityRole="button" accessibilityState={expandido === undefined ? undefined : { expanded: expandido }}>
      <Text style={st.enlaceTexto}>{texto}</Text>
    </Pressable>
  );
}

/** El candado de lo que solo está con las dos apps. */
export function Candado() {
  return (
    <View style={st.candado}>
      <Icono nombre="lock" tam={11} color={C.sub} peso="semibold" />
      <Text style={st.candadoTexto}>{t('ascent.conAscent')}</Text>
    </View>
  );
}

/**
 * Un octágono de esquinas cortadas, el de la acción en Ascent: dos franjas y cuatro triángulos. Con `soloArriba`,
 * cortado solo arriba (la hoja de vincular).
 */
export function Octogono({ corte, color, soloArriba, children, style }: { corte: number; color: string; soloArriba?: boolean; children?: ReactNode; style?: StyleProp<ViewStyle> }) {
  const tri = (lado: 'izq' | 'der', arriba: boolean) => ({
    position: 'absolute' as const, width: 0, height: 0, [arriba ? 'top' : 'bottom']: 0, [lado === 'izq' ? 'left' : 'right']: 0,
    borderColor: 'transparent', [arriba ? 'borderBottomWidth' : 'borderTopWidth']: corte, [arriba ? 'borderBottomColor' : 'borderTopColor']: color,
    [lado === 'izq' ? 'borderLeftWidth' : 'borderRightWidth']: corte,
  });
  return (
    <View style={style}>
      <View style={[StyleSheet.absoluteFill, { left: corte, right: corte, backgroundColor: color }]} />
      <View style={[StyleSheet.absoluteFill, { top: corte, bottom: soloArriba ? 0 : corte, backgroundColor: color }]} />
      <View style={tri('izq', true)} />
      <View style={tri('der', true)} />
      {!soloArriba && <View style={tri('izq', false)} />}
      {!soloArriba && <View style={tri('der', false)} />}
      {children}
    </View>
  );
}

/** La acción de la pantalla: un octágono claro. */
export function Accion({ texto, alTocar, apagado, estilo }: { texto: string; alTocar: () => void; apagado?: boolean; estilo?: StyleProp<ViewStyle> }) {
  const a = useAcento();
  return (
    <Pressable onPress={alTocar} disabled={apagado} style={[st.accion, apagado && st.apagado, estilo]} accessibilityRole="button" accessibilityState={{ disabled: !!apagado }}>
      {({ pressed }) => (
        <Octogono corte={11} color={pressed ? '#86839a' : a.claro} style={st.accionCaja}>
          <Text style={st.accionTexto}>{texto}</Text>
        </Octogono>
      )}
    </Pressable>
  );
}

/** Lo que se despliega y se pliega: crece desde arriba, con un fundido; al plegarse, se achica y recién ahí se va. */
export function Desplegable({ abierto, children, style }: { abierto: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const reducido = useReducedMotion();
  const [montado, setMontado] = useState(abierto);
  if (abierto && !montado) setMontado(true);
  const v = useSharedValue(abierto ? 1 : 0);
  const alto = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(abierto ? 1 : 0, { duration: reducido ? 120 : 300, easing: LLEGA }, (fin) => {
      if (fin && !abierto) scheduleOnRN(setMontado, false);
    }));
  }, [abierto, reducido, v]);
  // Hasta medir lo de adentro, a su alto: así no salta.
  const estilo = useAnimatedStyle(() => (alto.get() ? { height: alto.get() * (reducido ? 1 : v.get()), opacity: v.get() } : { opacity: v.get() }));
  if (!montado) return null;
  return (
    <Animated.View style={[st.desplegable, estilo]}>
      <View style={style} onLayout={(ev) => alto.set(ev.nativeEvent.layout.height)}>{children}</View>
    </Animated.View>
  );
}

/** Una flecha que gira al desplegar. */
export function Flecha({ abierta, grados = 180, color = C.sub }: { abierta: boolean; grados?: number; color?: string }) {
  const reducido = useReducedMotion();
  const giro = useSharedValue(abierta ? grados : 0);
  useEffect(() => {
    giro.set(withTiming(abierta ? grados : 0, { duration: reducido ? 0 : 300 }));
  }, [abierta, grados, giro, reducido]);
  const estilo = useAnimatedStyle(() => ({ transform: [{ rotate: `${giro.get()}deg` }] }));
  return (
    <Animated.View style={estilo}>
      <Icono nombre="chevron.down" tam={14} color={color} peso="semibold" />
    </Animated.View>
  );
}

/**
 * Una escala en una línea, de 0 a `tope`: lo de hoy hasta su punto, y las rayas de los umbrales con su nombre.
 * `zona` sombrea de 0 a ese valor (lo que se considera poco). El punto llega deslizándose.
 */
export function Escala({ valor, tope, rayas, limita = false, zona = null, etiqueta }: {
  valor: number | null; tope: number; rayas: [number, string][]; limita?: boolean; zona?: number | null; etiqueta?: string;
}) {
  const [ancho, setAncho] = useState(0);
  const reducido = useReducedMotion();
  const a = useAcento();
  const x = (v: number) => (Math.min(tope, Math.max(0, v)) / tope) * ancho;
  const hasta = useSharedValue(0);
  useEffect(() => {
    if (valor !== null && ancho) hasta.set(withTiming(x(valor), { duration: reducido ? 0 : 800 }));
  });
  const lleno = useAnimatedStyle(() => ({ width: hasta.get() }));
  const punto = useAnimatedStyle(() => ({ transform: [{ translateX: hasta.get() - 7.5 }] }));
  return (
    <View style={st.escala} onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)} accessibilityRole="image" accessibilityLabel={etiqueta}>
      {zona !== null && <View style={[st.escalaZona, { width: x(zona) }]} />}
      <View style={st.escalaPista} />
      {rayas.map(([v, texto]) => (
        <View key={texto} style={[st.escalaRaya, { left: x(v) }]}>
          {!!texto && <Text style={st.escalaRayaTexto}>{texto}</Text>}
        </View>
      ))}
      {valor !== null && (
        <>
          <Animated.View style={[st.escalaLleno, { backgroundColor: a.claro }, limita && st.limitaFondo, lleno]} />
          <Animated.View style={[st.escalaPunto, limita && st.limitaFondo, punto]} />
        </>
      )}
    </View>
  );
}

export type EstadoDePildora = 'recuperado' | 'recuperandose' | 'cargado';
/** Los músculos (u otra cosa) en píldoras, cada uno con su estado. */
export function Pildoras({ items, chicas, apagadas }: { items: { clave: string; texto: string; estado: EstadoDePildora; etiqueta?: string }[]; chicas?: boolean; apagadas?: boolean }) {
  const a = useAcento();
  return (
    <View style={[st.pildoras, chicas && st.pildorasChicas]}>
      {items.map((x) => (
        <View key={x.clave} style={[st.pildora, chicas && st.pildoraChica, x.estado === 'cargado' && st.pildoraCargada, apagadas && st.pildoraApagada]} accessible accessibilityLabel={x.etiqueta ?? x.texto}>
          <View style={[st.pildoraPunto, x.estado === 'recuperandose' && { backgroundColor: a.claro }, x.estado === 'cargado' && { backgroundColor: C.lejos }]} />
          <Text style={[st.pildoraTexto, chicas && st.pildoraTextoChico, apagadas && { color: C.apagado }]}>{x.texto}</Text>
        </View>
      ))}
    </View>
  );
}

export const st = StyleSheet.create({
  etq: { fontFamily: letras.textoMedio, fontSize: 10.5, lineHeight: 13, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  una: { marginTop: 6, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.sub },
  nota: { marginTop: 10, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 16, color: C.apagado },
  parte: { marginTop: 30, marginHorizontal: -22, paddingTop: 14, paddingHorizontal: 22, borderTopWidth: 1, borderTopColor: C.linea },
  partePrimera: { marginTop: 12, paddingTop: 6, borderTopWidth: 0 },
  parteCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 22 },
  derecha: { flexShrink: 1, fontFamily: letras.texto, fontSize: 11.5, color: C.sub, textAlign: 'right', fontVariant: ['tabular-nums'] },
  enlace: { alignSelf: 'flex-start', marginTop: 12, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: 'rgba(170, 178, 196, 0.42)' },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  apretado: { opacity: 0.6 },
  candado: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingLeft: 7, paddingRight: 9, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  candadoTexto: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 0.6, color: C.sub },
  accion: { alignSelf: 'stretch' },
  accionCaja: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  accionTexto: { fontFamily: letras.textoMedio, fontSize: 15, letterSpacing: 0.15, color: C.fondo },
  apagado: { opacity: 0.6 },
  desplegable: { overflow: 'hidden' },
  escala: { height: 30, marginTop: 12 },
  escalaZona: { position: 'absolute', left: 0, top: 4, height: 6, backgroundColor: 'rgba(203, 133, 105, 0.14)' },
  escalaPista: { position: 'absolute', left: 0, right: 0, top: 6, height: 2, backgroundColor: C.linea },
  escalaRaya: { position: 'absolute', top: 1, width: 1, height: 12, backgroundColor: C.lineaFuerte },
  escalaRayaTexto: { position: 'absolute', top: 16, left: -60, width: 120, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, color: C.apagado },
  escalaLleno: { position: 'absolute', left: 0, top: 6, height: 2, backgroundColor: C.claro },
  // El punto, de 10, con un aro del color del fondo alrededor.
  escalaPunto: { position: 'absolute', left: 0, top: -0.5, width: 15, height: 15, borderRadius: 7.5, backgroundColor: C.tinta, borderWidth: 2.5, borderColor: '#090b11' },
  limitaFondo: { backgroundColor: C.lejos },
  pildoras: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 11 },
  pildorasChicas: { marginTop: 6, gap: 4 },
  pildora: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 5, paddingLeft: 8, paddingRight: 10, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  pildoraChica: { paddingVertical: 3, paddingLeft: 6, paddingRight: 8 },
  pildoraCargada: { borderColor: 'rgba(203, 133, 105, 0.55)' },
  pildoraApagada: { borderColor: C.linea },
  pildoraPunto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(170, 178, 196, 0.28)' },
  pildoraTexto: { fontFamily: letras.texto, fontSize: 12.5, color: C.tinta },
  pildoraTextoChico: { fontSize: 11.5 },
});
