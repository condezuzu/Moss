// Lo que comparten las tarjetas de Sueño, con los colores de la galería (galeria/src/sueno.js, `.sueno`): azul de
// noche y un poco de verde de la aurora. Las tarjetas en caja y las abiertas (con una línea arriba), los chips,
// el ejemplo, los puntos de cuánto falta y las barras que crecen.

import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import type { ClaveDia } from '@/dominio/fechas';
import type { Confianza, OrigenDeNoche } from '@/dominio/sueno';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { horaDelDia } from '../comida/datos';
import { ACOMODA } from '../tarjetas';

export const SN = {
  texto: 'rgba(214, 226, 250, 0.82)',
  tenue: 'rgba(196, 212, 246, 0.68)',
  linea: 'rgba(150, 178, 240, 0.15)',
  rem: '#a8e2f0', nucleo: '#6aa2f0', profundo: '#6a5fd6', despierto: '#efb08c', azul: '#6b8ff0', verde: '#2ea8a0', verdeClaro: '#8adbc8',
} as const;

/** Una hora del sueño: los minutos se cuentan desde las 18 del día anterior. */
export const reloj = (minutos: number) => horaDelDia(minutos + 18 * 60);
/** «mié 12». */
export const diaCorto = (clave: ClaveDia) => `${lista('fecha.diasCortos')[new Date(`${clave}T12:00:00`).getDay()]} ${Number(clave.slice(8))}`;
export const letraDe = (clave: ClaveDia) => lista('fecha.diasCortos')[new Date(`${clave}T12:00:00`).getDay()].charAt(0).toUpperCase();

/**
 * Una tarjeta de Sueño: en caja, abierta (sin caja, con una línea arriba: el horario, lo del reloj y las fuentes)
 * o la de la noche, con el azul que va de la noche a la mañana.
 */
export function CartaDeSueno({ titulo, derecha, children, tipo = 'caja', estilo }: {
  titulo?: string; derecha?: ReactNode; children: ReactNode; tipo?: 'caja' | 'abierta' | 'heroe'; estilo?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View layout={ACOMODA} style={[st.carta, tipo === 'abierta' && st.abierta, tipo === 'heroe' && st.heroe, estilo]}>
      {titulo !== undefined && (
        <View style={st.cab}>
          <Text style={st.titulo} accessibilityRole="header">{titulo}</Text>
          {derecha}
        </View>
      )}
      {children}
    </Animated.View>
  );
}

export type TipoDeChip = 'alta' | 'media' | 'baja' | 'buena' | 'enCamino' | 'floja' | 'despacio';
export const ChipDeSueno = ({ texto, tipo }: { texto: string; tipo: TipoDeChip }) => <Text style={[st.chip, st[`chip_${tipo}`]]}>{texto}</Text>;
export const ConConfianza = ({ nivel }: { nivel: Confianza }) => <ChipDeSueno texto={t(`sueno.confianza.${nivel}`)} tipo={nivel} />;
export const DeOrigen = ({ origen }: { origen: OrigenDeNoche }) => <ChipDeSueno texto={t(`sueno.origen.${origen}`)} tipo={origen === 'estimada' ? 'baja' : 'alta'} />;
/** Lo de ejemplo se dice en cada tarjeta: nunca pasa por tuyo. */
export const ChipDeEjemplo = () => <Text style={st.ejemplo}>{t('sueno.vacio.ejemplo')}</Text>;

/** Cuánto falta para que aparezca algo: un punto por noche, «2 de 5 noches» y qué lo hace aparecer. */
export function Progreso({ hay, minimo, texto }: { hay: number; minimo: number; texto?: string }) {
  return (
    <View style={st.progreso} accessible accessibilityLabel={`${plural('sueno.vacio.progreso', minimo, { a: Math.min(hay, minimo) })}. ${texto ?? ''}`}>
      <View style={st.progresoFila}>
        <Puntos hay={hay} minimo={minimo} />
        <Text style={st.progresoCuenta}>{plural('sueno.vacio.progreso', minimo, { a: Math.min(hay, minimo) })}</Text>
      </View>
      {texto ? <Text style={st.progresoTexto}>{texto}</Text> : null}
    </View>
  );
}

export const Puntos = ({ hay, minimo }: { hay: number; minimo: number }) => (
  <View style={st.puntos}>
    {Array.from({ length: minimo }, (_, i) => <View key={i} style={[st.punto, i < hay && st.puntoLleno]} />)}
  </View>
);

/** Una fila de dato: el nombre, el valor y, si hay, qué tan seguro es. */
export function Dato({ nombre, valor, nivel, antes }: { nombre: string; valor: string; nivel?: Confianza | null; antes?: ReactNode }) {
  return (
    <View style={st.dato}>
      <View style={st.datoNombre}>
        {antes}
        <Text style={st.datoNombreTexto}>{nombre}</Text>
      </View>
      <Text style={st.datoValor}>{valor}</Text>
      {nivel ? <ConConfianza nivel={nivel} /> : null}
    </View>
  );
}

export const Nota = ({ children }: { children: ReactNode }) => <Text style={st.nota}>{children}</Text>;
export const Texto = ({ children }: { children: ReactNode }) => <Text style={st.texto}>{children}</Text>;

const CRECE = Easing.bezier(0.2, 0.7, 0.2, 1);
/**
 * Una barra que crece desde abajo (o desde arriba, o desde la izquierda) al aparecer, de a una: `i` es su lugar.
 * Con Reducir movimiento, ya está.
 */
export function Crece({ animar, i = 0, desde = 'abajo', style, children }: { animar: boolean; i?: number; desde?: 'abajo' | 'arriba' | 'izquierda'; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const reducido = useReducedMotion();
  const x = useSharedValue(animar && !reducido ? 0 : 1);
  useEffect(() => {
    if (animar && !reducido) x.set(withDelay(i * 24, withTiming(1, { duration: 600, easing: CRECE })));
  }, [animar, reducido, i, x]);
  const estilo = useAnimatedStyle(() => (desde === 'izquierda'
    ? { opacity: 0.5 + 0.5 * x.get(), transform: [{ scaleX: 0.5 + 0.5 * x.get() }] }
    : { transform: [{ scaleY: Math.max(0.001, x.get()) }] }));
  return <Animated.View style={[style, { transformOrigin: desde === 'abajo' ? 'bottom' : desde === 'arriba' ? 'top' : 'left' }, estilo]}>{children}</Animated.View>;
}

export const st = StyleSheet.create({
  carta: { marginTop: 12, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(12, 20, 46, 0.6)', borderWidth: 1, borderColor: 'rgba(150, 178, 240, 0.11)', gap: 6 },
  abierta: { marginTop: 20, paddingTop: 16, paddingHorizontal: 4, paddingBottom: 4, backgroundColor: 'transparent', borderWidth: 0, borderTopWidth: 1, borderColor: 'rgba(150, 178, 240, 0.13)', borderRadius: 0 },
  heroe: { backgroundColor: 'rgba(13, 24, 60, 0.82)' },
  cab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 26 },
  titulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: SN.texto },
  chip: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.6, color: colores.oroClaro, backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  chip_alta: { color: '#b9d6fb', backgroundColor: 'rgba(120, 170, 240, 0.16)' },
  chip_media: {},
  chip_baja: { color: SN.texto, backgroundColor: 'rgba(150, 178, 240, 0.12)' },
  chip_buena: { color: SN.verdeClaro, backgroundColor: 'rgba(46, 168, 160, 0.18)' },
  chip_enCamino: { color: '#b9d6fb', backgroundColor: 'rgba(120, 170, 240, 0.16)' },
  chip_floja: { color: SN.texto, backgroundColor: 'rgba(150, 178, 240, 0.14)' },
  chip_despacio: {},
  ejemplo: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(239, 230, 207, 0.32)', backgroundColor: 'rgba(239, 230, 207, 0.1)', fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.8, color: colores.pergamino },
  progreso: { marginTop: 10, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 11, borderRadius: 12, backgroundColor: 'rgba(150, 178, 240, 0.09)', gap: 5 },
  progresoFila: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  progresoCuenta: { flexShrink: 1, fontFamily: letras.numeroMedio, fontSize: 12.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  progresoTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: SN.texto },
  puntos: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  punto: { width: 7, height: 7, borderRadius: 3.5, borderWidth: 1, borderColor: 'rgba(196, 212, 246, 0.5)' },
  puntoLleno: { borderWidth: 0, backgroundColor: '#a8c8fa' },
  dato: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: 1, borderColor: SN.linea },
  datoNombre: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  datoNombreTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  datoValor: { fontFamily: letras.numero, fontSize: 14, color: colores.pergamino, textAlign: 'right', fontVariant: ['tabular-nums'] },
  nota: { marginTop: 6, fontFamily: letras.texto, fontSize: 12, lineHeight: 17.5, color: SN.tenue },
  texto: { marginTop: 4, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 20, color: SN.texto },
});
