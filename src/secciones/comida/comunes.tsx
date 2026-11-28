// Las piezas chicas de la comida: los íconos (SF Symbols, con un signo en la web de prueba), el
// aviso con «Deshacer», los puntos de color de cada macro y los botones de la galería.

import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { useEffect, useEffectEvent, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

import type { EstadoDeMacro } from '@/dominio/metas';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar, conLector } from '../anuncio';

// En la web no hay SF Symbols: un signo parecido, para ver dónde va cada cosa en las capturas.
const EN_LA_WEB: Partial<Record<string, string>> = {
  plus: '+', minus: '−', xmark: '×', 'magnifyingglass': '⌕', barcode: '▥', 'barcode.viewfinder': '▥', 'doc.text.viewfinder': '▤', 'doc.on.doc': '⧉',
  'bookmark': '❏', 'bolt': 'ϟ', 'camera': '◉', 'photo.on.rectangle': '▣', 'star': '☆', 'star.fill': '★', 'chevron.left': '‹', 'chevron.right': '›', 'chevron.down': '⌄', 'chevron.up': '⌃',
  checkmark: '✓', 'trash': '⌫', 'fork.knife': '⑂', 'scalemass': '⚖', 'drop': '◖', ruler: '⊢', 'square.and.arrow.up': '⇪',
  'calendar': '▦', 'arrow.uturn.backward': '↶', 'list.bullet': '≡', 'pencil': '✎', 'sparkles': '✦', 'flame': '♨', heart: '♡', 'heart.fill': '♥', cart: '⊔',
  'hand.thumbsup': '△', 'hand.thumbsup.fill': '▲', 'hand.thumbsdown': '▽', 'arrow.turn.down.right': '↳', 'chart.pie': '◔',
};

type PropsDeIcono = { nombre: SFSymbol; tam?: number; color?: string; peso?: SymbolWeight };

export function Icono({ nombre, tam = 18, color = colores.oroClaro, peso = 'regular' }: PropsDeIcono) {
  return (
    <SymbolView
      name={nombre}
      size={tam}
      weight={peso}
      tintColor={color}
      fallback={<Text style={{ color, fontSize: tam * 0.9, lineHeight: tam, width: tam, textAlign: 'center' }}>{EN_LA_WEB[nombre] ?? '·'}</Text>}
    />
  );
}

/** Un fondo en degradado, como los de la galería: en la web, backgroundImage; en el teléfono, el de React Native. */
export const degradado = (g: string) => (Platform.OS === 'web' ? { backgroundImage: g } : { experimental_backgroundImage: g }) as ViewStyle;

export const COLOR_DE_MACRO = { proteina: colores.oroClaro, carbohidratos: colores.salvia, grasas: colores.grasas } as const;
export type Macro = keyof typeof COLOR_DE_MACRO;
export const MACROS: readonly Macro[] = ['proteina', 'carbohidratos', 'grasas'];

/** El punto de color de un macro, con su brillo. */
export function Punto({ macro, tam = 6 }: { macro: Macro; tam?: number }) {
  const color = COLOR_DE_MACRO[macro];
  return <View style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />;
}

const RGB_DE_MACRO = { proteina: '246, 227, 166', carbohidratos: '166, 191, 148', grasas: '169, 196, 245' } as const;
// El temblor de la galería (@keyframes tiembla): corto, en el primer quinto de cada vuelta, y quieto el resto.
const TIEMBLA_X = [0, 0.8, -0.9, 0.6, -0.7, 0.9, -0.5, 0.6, -0.8, 0.4, -0.3, 0];
const TIEMBLA_Y = [0, -0.5, 0.4, 0.7, -0.6, 0.2, 0.6, -0.7, 0.1, 0.5, -0.3, 0];
const VECES = 2;

/**
 * El punto de un macro según cómo va, como en la galería: apagado mientras falta; al cumplir lo pedido se enciende
 * con su aro y brilla un par de veces; pasado por mucho, tiembla un par de veces. Después queda quieto. Con Reducir
 * movimiento, lo pasado no tiembla: queda con un aro entero.
 */
export function PuntoDeMacro({ macro, estado }: { macro: Macro; estado: EstadoDeMacro }) {
  const reducido = useReducedMotion();
  const color = COLOR_DE_MACRO[macro];
  const rgb = RGB_DE_MACRO[macro];
  const encendido = useSharedValue(estado === 'falta' ? 0 : 1);
  const brillo = useSharedValue(0);
  const temblor = useSharedValue(0);
  useEffect(() => {
    encendido.set(withTiming(estado === 'falta' ? 0 : 1, { duration: 600, reduceMotion: ReduceMotion.Never }));
    brillo.set(0);
    temblor.set(0);
    if (reducido) return;
    if (estado === 'cumplido') brillo.set(withRepeat(withSequence(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }), withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) })), VECES));
    if (estado === 'pasado') temblor.set(withRepeat(withSequence(withTiming(1, { duration: 2600, easing: Easing.linear }), withTiming(0, { duration: 0 })), VECES));
  }, [estado, reducido, encendido, brillo, temblor]);
  const estiloPunto = useAnimatedStyle(() => {
    // Cada paso del temblor es un 2 % de la vuelta.
    const paso = temblor.get() / 0.02;
    const i = Math.min(TIEMBLA_X.length - 2, Math.floor(paso));
    const f = Math.min(1, paso - i);
    const quieto = paso >= TIEMBLA_X.length - 1;
    return {
      opacity: 0.55 + 0.45 * encendido.get(),
      transform: [{ translateX: quieto ? 0 : TIEMBLA_X[i] + (TIEMBLA_X[i + 1] - TIEMBLA_X[i]) * f }, { translateY: quieto ? 0 : TIEMBLA_Y[i] + (TIEMBLA_Y[i + 1] - TIEMBLA_Y[i]) * f }],
    };
  });
  const estiloAro = useAnimatedStyle(() => ({ opacity: encendido.get() }));
  const estiloBrillo = useAnimatedStyle(() => ({ opacity: brillo.get() }));
  const aro = reducido && estado === 'pasado' ? `0 0 0 2px ${color}` : `0 0 0 2px rgba(${rgb}, 0.16), 0 0 10px 1px ${color}`;
  return (
    <Animated.View style={[estilos.puntoDeMacro, { backgroundColor: color }, estiloPunto]}>
      {/* El aro y su brillo van en capas que solo cambian de opacidad: la sombra no se rehace en cada cuadro. */}
      <Animated.View style={[StyleSheet.absoluteFill, estilos.puntoCapa, { boxShadow: aro }, estiloAro]} />
      <Animated.View style={[StyleSheet.absoluteFill, estilos.puntoCapa, { boxShadow: `0 0 0 3px rgba(${rgb}, 0.1), 0 0 14px 2px ${color}` }, estiloBrillo]} />
    </Animated.View>
  );
}

/** `boton`: lo que dice el botón de `deshacer`; sin él, «Deshacer». */
export type Aviso = { texto: string; deshacer?: () => void; boton?: string; vez: number };

/**
 * Un aviso corto: dice lo que pasó y, si se puede, ofrece deshacerlo. Arriba (con `arriba`) no tapa
 * la barra ni lo que se toca después; abajo, dentro de una hoja. Se va solo, o con un toque.
 */
export function AvisoFlotante({ aviso, alIrse, arriba, abajo = 0 }: { aviso: Aviso | null; alIrse: () => void; arriba?: number; abajo?: number }) {
  const reducido = useReducedMotion();
  // Solo un aviso nuevo vuelve a contar: si el tiempo dependiera de la función para irse, cada vez
  // que la pantalla se vuelve a dibujar (una letra en el buscador) empezaría de nuevo.
  const irse = useEffectEvent(() => alIrse());
  useEffect(() => {
    if (!aviso) return;
    // VoiceOver no ve lo que aparece: se lo dice. Y con lector, «Deshacer» espera a que se llegue a tocarlo.
    anunciar(aviso.texto);
    const espera = setTimeout(irse, aviso.deshacer ? (conLector() ? 10000 : 3200) : conLector() ? 4000 : 2200);
    return () => clearTimeout(espera);
  }, [aviso]);
  if (!aviso) return null;
  const desdeArriba = arriba !== undefined;
  return (
    <Animated.View
      key={aviso.vez}
      entering={(reducido ? FadeIn : desdeArriba ? FadeInDown : FadeInUp).duration(220).reduceMotion(ReduceMotion.Never)}
      exiting={FadeOut.duration(180).reduceMotion(ReduceMotion.Never)}
      style={[estilos.aviso, desdeArriba ? { top: arriba } : { bottom: abajo }]}
      pointerEvents="box-none"
    >
      <Pressable onPress={alIrse} style={estilos.avisoTextoLugar} accessibilityRole="button" accessibilityHint={t('comida.cerrar')}>
        <Text style={estilos.avisoTexto} numberOfLines={1}>{aviso.texto}</Text>
      </Pressable>
      {aviso.deshacer && (
        <Pressable
          onPress={() => {
            const deshacer = aviso.deshacer;
            alIrse();
            deshacer?.();
          }}
          style={estilos.avisoBoton}
          accessibilityRole="button"
          hitSlop={8}
        >
          <Text style={estilos.avisoBotonTexto}>{aviso.boton ?? t('comun.deshacer')}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

type PropsDeBoton = { texto: string; alTocar: () => void; icono?: SFSymbol; tipo?: 'principal' | 'secundario' | 'contorno' | 'grande' | 'quitar' | 'atajo' | 'segundo'; estilo?: StyleProp<ViewStyle>; desactivado?: boolean; etiqueta?: string };

/** Los botones de la galería: el dorado lleno, el de contorno, el de quitar, el atajo de la hoja de registro (más chico) y el segundo de un pie (`.fi-secundario`). */
export function Boton({ texto, alTocar, icono, tipo = 'contorno', estilo, desactivado, etiqueta }: PropsDeBoton) {
  const lleno = tipo === 'principal' || tipo === 'grande';
  return (
    <Pressable
      onPress={alTocar}
      disabled={desactivado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ disabled: !!desactivado }}
      // Los de 34 puntos llegan a los 44 que se tocan.
      hitSlop={tipo === 'atajo' ? 6 : 5}
      style={({ pressed }) => [estilos.boton, estilos[tipo], desactivado && estilos.desactivado, pressed && estilos.apretado, estilo]}
    >
      {icono && <Icono nombre={icono} tam={tipo === 'grande' ? 18 : tipo === 'segundo' ? 17 : tipo === 'atajo' ? 14 : 15} color={lleno ? colores.tinta : colores.oroClaro} peso={tipo === 'atajo' || tipo === 'segundo' ? 'medium' : 'semibold'} />}
      <Text
        style={[estilos.botonTexto, lleno && estilos.botonTextoLleno, tipo === 'grande' && estilos.botonTextoGrande, tipo === 'quitar' && estilos.botonTextoQuitar, tipo === 'atajo' && estilos.botonTextoAtajo, tipo === 'segundo' && estilos.botonTextoSegundo]}
        maxFontSizeMultiplier={1.4}
      >
        {texto}
      </Text>
    </Pressable>
  );
}

/** Una pastilla que se elige: las comidas, las porciones, crudo o cocido. Elegir otra vibra apenas, como un selector de iOS. */
export function Pastilla({ texto, detalle, elegida, alTocar, estilo, estiloTexto }: { texto: string; detalle?: string; elegida: boolean; alTocar: () => void; estilo?: StyleProp<ViewStyle>; estiloTexto?: StyleProp<TextStyle> }) {
  return (
    <Pressable
      onPress={() => {
        if (!elegida) Haptics.selectionAsync().catch(() => {});
        alTocar();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: elegida }}
      hitSlop={6}
      style={({ pressed }) => [estilos.pastilla, elegida && estilos.pastillaElegida, pressed && estilos.apretado, estilo]}
    >
      <Text style={[estilos.pastillaTexto, estiloTexto, elegida && estilos.pastillaTextoElegida]} numberOfLines={1} maxFontSizeMultiplier={1.4}>{texto}</Text>
      {detalle ? <Text style={estilos.pastillaDetalle} maxFontSizeMultiplier={1.4}>{detalle}</Text> : null}
    </Pressable>
  );
}

/** El título chico en mayúsculas de cada parte («PORCIÓN», «RECIENTES»). */
export function Etiqueta({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return (
    <View style={estilo}>
      <Text style={estilos.etiqueta}>{children}</Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  puntoDeMacro: { width: 6, height: 6, borderRadius: 3 },
  puntoCapa: { borderRadius: 3 },
  // Con fondo opaco: con alfa, iOS calcula la sombra píxel por píxel en cada cuadro.
  aviso: {
    position: 'absolute', alignSelf: 'center', maxWidth: '92%', flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42,
    paddingLeft: 16, paddingRight: 7, paddingVertical: 6, borderRadius: 999, backgroundColor: '#090e1e',
    borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
  },
  avisoTextoLugar: { flexShrink: 1, paddingVertical: 4 },
  avisoTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.pergamino, paddingRight: 9 },
  avisoBoton: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  avisoBotonTexto: { fontFamily: letras.textoMedio, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: colores.oro },
  // Con el alto mínimo y no fijo: con el texto grande de iOS el botón crece en vez de cortar el texto.
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 34, paddingHorizontal: 13, paddingVertical: 4, borderRadius: 999 },
  principal: { backgroundColor: colores.oro },
  secundario: { borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.36)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  contorno: { borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  grande: { minHeight: 52, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.24, shadowRadius: 13, shadowOffset: { width: 0, height: 8 } },
  quitar: { minHeight: 44, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)' },
  segundo: { minHeight: 46, gap: 8, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.36)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  atajo: { minHeight: 32, gap: 5, paddingLeft: 9, paddingRight: 11, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  desactivado: { opacity: 0.4 },
  apretado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  botonTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  botonTextoLleno: { fontFamily: letras.textoMedio, color: colores.tinta },
  botonTextoGrande: { fontSize: 16 },
  botonTextoQuitar: { fontSize: 15, color: 'rgba(239, 230, 207, 0.75)' },
  botonTextoAtajo: { fontSize: 12 },
  botonTextoSegundo: { fontSize: 15 },
  pastilla: { justifyContent: 'center', minHeight: 32, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  pastillaElegida: { borderColor: 'rgba(232, 196, 106, 0.72)', backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  pastillaTexto: { fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  pastillaTextoElegida: { color: colores.oroClaro },
  pastillaDetalle: { marginTop: 3, fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.5)' },
  etiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
});
