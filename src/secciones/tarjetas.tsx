// Las piezas de las tarjetas de Progreso y Sueño, las de la galería (galeria/src/pagina.html:
// pg-carta, pg-cifra, in-estado, aj-segmento, aj-dias…): la tarjeta con su título, la cifra grande,
// las notas, el «Cómo se calcula» que se despliega, los segmentos y los días de la semana. Nada
// aparece ni desaparece de golpe: lo que cambia entra con un fundido y la tarjeta se acomoda.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { DiaSemana } from '@/dominio/fechas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { useFraccion } from './animados';
import { Icono } from './comida/comunes';

/** De lunes a domingo, como se lee la semana. */
export const SEMANA: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];

export function Cabecera({ fecha, titulo }: { fecha: string; titulo: string }) {
  return (
    <View style={e.cabecera}>
      <Text style={e.fecha}>{fecha}</Text>
      <Text style={e.tituloPagina}>{titulo}</Text>
    </View>
  );
}

/** Los datos de ejemplo se dicen arriba de todo: nunca pasan por tuyos. */
export const AvisoDeEjemplo = ({ texto }: { texto: string }) => (
  <View style={e.ejemplo}>
    <Icono nombre="sparkles" tam={14} />
    <Text style={e.ejemploTexto}>{texto}</Text>
  </View>
);

export type TipoDeChip = 'bien' | 'atencion' | 'tenue';
export const Chip = ({ texto, tipo }: { texto: string; tipo?: TipoDeChip }) => (
  <Text style={[e.chip, tipo === 'bien' && e.chipBien, tipo === 'atencion' && e.chipAtencion]}>{texto}</Text>
);

/** Lo que aparece o desaparece con un toque: entra con un fundido, sale igual y lo de alrededor se acomoda. */
export function Aparece({ children, style, demora = 0 }: { children: ReactNode; style?: StyleProp<ViewStyle>; demora?: number }) {
  return (
    <Animated.View entering={FadeIn.duration(280).delay(demora)} exiting={FadeOut.duration(180)} layout={LinearTransition.duration(260)} style={style}>
      {children}
    </Animated.View>
  );
}

/** El alto que cambia (otra noche, algo que se despliega) se acomoda en vez de saltar. */
export const ACOMODA = LinearTransition.duration(260);

export function Carta({ titulo, derecha, children, estilo }: { titulo?: string; derecha?: ReactNode; children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View layout={ACOMODA} style={[e.carta, estilo]}>
      {titulo !== undefined && (
        <View style={e.cab}>
          <Text style={e.titulo}>{titulo}</Text>
          {derecha}
        </View>
      )}
      {children}
    </Animated.View>
  );
}

/** El número grande de una tarjeta y lo que es. */
export const Cifra = ({ valor, texto }: { valor: string; texto?: string }) => (
  <View style={e.cifra}>
    <Text style={e.cifraValor}>{valor}</Text>
    {texto ? <Text style={e.cifraTexto}>{texto}</Text> : null}
  </View>
);

export const Nota = ({ children, tenue }: { children: ReactNode; tenue?: boolean }) => <Text style={[e.nota, tenue && e.notaTenue]}>{children}</Text>;
export const Parrafo = ({ children, chico }: { children: ReactNode; chico?: boolean }) => <Text style={[e.parrafo, chico && e.parrafoChico]}>{children}</Text>;
/** Lo que hay que leer antes de creerle al número: un recuadro tenue. */
export const Recuadro = ({ children }: { children: ReactNode }) => <Text style={e.recuadro}>{children}</Text>;

export const Eje = ({ izquierda, derecha }: { izquierda: string; derecha: string }) => (
  <View style={e.eje}>
    <Text style={e.ejeTexto}>{izquierda}</Text>
    <Text style={e.ejeTexto}>{derecha}</Text>
  </View>
);

/** «Cómo se calcula»: un enlace que despliega la explicación debajo. */
export function ComoSeCalcula({ abierto, alTocar, children }: { abierto: boolean; alTocar: () => void; children: ReactNode }) {
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierto ? '90deg' : '0deg', { duration: 220 }) }] }));
  return (
    <>
      <Pressable onPress={alTocar} style={e.enlace} accessibilityRole="button" accessibilityState={{ expanded: abierto }} hitSlop={8}>
        <Text style={e.enlaceTexto}>{t('progreso.comoSeCalcula')}</Text>
        <Animated.View style={flecha}>
          <Icono nombre="chevron.right" tam={12} peso="semibold" />
        </Animated.View>
      </Pressable>
      {abierto && <Aparece style={e.como}>{children}</Aparece>}
    </>
  );
}

/** El botón chico de arriba a la derecha de una tarjeta: «Registrar», «Medir». */
export function BotonChico({ texto, icono, alTocar }: { texto: string; icono: Parameters<typeof Icono>[0]['nombre']; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [e.botonChico, pressed && { opacity: 0.7 }]} accessibilityRole="button" hitSlop={8}>
      <Icono nombre={icono} tam={12} peso="semibold" />
      <Text style={e.botonChicoTexto}>{texto}</Text>
    </Pressable>
  );
}

export function Segmento<T extends string | number>({ opciones, elegida, alElegir }: { opciones: readonly (readonly [T, string])[]; elegida: T; alElegir: (v: T) => void }) {
  return (
    <View style={e.segmento} accessibilityRole="radiogroup">
      {opciones.map(([valor, texto]) => (
        <Pressable
          key={String(valor)}
          onPress={() => alElegir(valor)}
          style={[e.seg, valor === elegida && e.segElegido]}
          accessibilityRole="radio"
          accessibilityState={{ selected: valor === elegida }}
        >
          <Text style={[e.segTexto, valor === elegida && e.segTextoElegido]} numberOfLines={1}>{texto}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Los siete días, de lunes a domingo, con su inicial. */
export function Dias({ elegidos, alTocar }: { elegidos: readonly DiaSemana[]; alTocar: (d: DiaSemana) => void }) {
  return (
    <View style={e.dias}>
      {SEMANA.map((d) => {
        const si = elegidos.includes(d);
        return (
          <Pressable
            key={d}
            onPress={() => alTocar(d)}
            style={[e.dia, si && e.diaElegido]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: si }}
            accessibilityLabel={lista('fecha.dias')[d]}
          >
            <Text style={[e.diaTexto, si && e.diaTextoElegido]}>{lista('fecha.diasCortos')[d].charAt(0)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const EtiquetaDeGrupo = ({ children }: { children: ReactNode }) => <Text style={e.etiqueta}>{children}</Text>;

/** El camino al peso meta: de dónde se empezó a la meta, con hoy marcado. Las etiquetas: el inicio, hoy y la meta. */
export function Camino({ hecho, etiquetas }: { hecho: number; etiquetas: readonly [string, string, string] }) {
  // Como la galería (.in-camino-pista i): el tramo hecho se recorre y la marca de hoy lo acompaña.
  const x = useFraccion(hecho);
  const lleno = useAnimatedStyle(() => ({ width: `${x.get() * 100}%` }));
  const marca = useAnimatedStyle(() => ({ left: `${x.get() * 100}%` }));
  return (
    <View style={e.camino}>
      <View style={e.caminoPista}>
        <Animated.View style={[e.caminoLleno, lleno]} />
        <Animated.View style={[e.caminoMarca, marca]} />
      </View>
      <View style={e.caminoEtiquetas}>
        <Text style={e.caminoEtiqueta}>{etiquetas[0]}</Text>
        <Text style={[e.caminoEtiqueta, e.caminoAhora]}>{etiquetas[1]}</Text>
        <Text style={e.caminoEtiqueta}>{etiquetas[2]}</Text>
      </View>
    </View>
  );
}

export const e = StyleSheet.create({
  cabecera: { marginBottom: 4 },
  fecha: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.58)' },
  tituloPagina: { marginTop: 6, fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  ejemplo: { marginTop: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 11, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.07)' },
  ejemploTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(246, 227, 166, 0.88)' },
  carta: { marginTop: 12, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(8, 12, 26, 0.72)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', gap: 6 },
  cab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 26 },
  titulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  chip: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.6, color: 'rgba(239, 230, 207, 0.7)', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  chipBien: { color: colores.salvia, backgroundColor: 'rgba(166, 191, 148, 0.1)' },
  chipAtencion: { color: colores.oroClaro, backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  cifra: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, rowGap: 2 },
  cifraValor: { fontFamily: letras.numero, fontSize: 32, letterSpacing: -0.5, color: colores.cifra, fontVariant: ['tabular-nums'] },
  cifraTexto: { fontFamily: letras.texto, fontSize: 13, lineHeight: 16, color: 'rgba(239, 230, 207, 0.58)' },
  nota: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.72)', fontVariant: ['tabular-nums'] },
  notaTenue: { color: 'rgba(239, 230, 207, 0.45)' },
  parrafo: { marginTop: 4, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 20, color: 'rgba(239, 230, 207, 0.8)' },
  parrafoChico: { fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
  recuadro: { marginTop: 4, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.66)', overflow: 'hidden' },
  eje: { flexDirection: 'row', justifyContent: 'space-between' },
  ejeTexto: { fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.42)', fontVariant: ['tabular-nums'] },
  enlace: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 6 },
  enlaceTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  como: { gap: 8 },
  botonChico: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 28, paddingLeft: 8, paddingRight: 11, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.36)' },
  botonChicoTexto: { fontFamily: letras.texto, fontSize: 12, color: colores.oroClaro },
  segmento: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  seg: { flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderRadius: 999, alignItems: 'center' },
  segElegido: { backgroundColor: 'rgba(239, 230, 207, 0.1)' },
  segTexto: { fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)' },
  segTextoElegido: { color: colores.pergamino },
  dias: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginVertical: 4 },
  dia: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)', alignItems: 'center', justifyContent: 'center' },
  diaElegido: { borderColor: colores.oro, backgroundColor: colores.oro },
  diaTexto: { fontFamily: letras.textoMedio, fontSize: 13, color: 'rgba(239, 230, 207, 0.7)' },
  diaTextoElegido: { color: colores.tinta },
  etiqueta: { marginTop: 22, marginBottom: 9, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  camino: { marginTop: 13 },
  caminoPista: { height: 4, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  caminoLleno: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4, backgroundColor: colores.salvia },
  caminoMarca: { position: 'absolute', top: -3.5, width: 11, height: 11, marginLeft: -5.5, borderRadius: 5.5, backgroundColor: colores.cifra, shadowColor: colores.cifra, shadowOpacity: 0.6, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  caminoEtiquetas: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  caminoEtiqueta: { fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
  caminoAhora: { color: colores.pergamino },
});
