// Las piezas chicas de la comida: los íconos (SF Symbols, con un signo en la web de prueba), el
// aviso con «Deshacer», los puntos de color de cada macro y los botones de la galería.

import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { useEffect, useEffectEvent, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';

import { t } from '@/textos';
import { colores, letras } from '@/tema';

// En la web no hay SF Symbols: un signo parecido, para ver dónde va cada cosa en las capturas.
const EN_LA_WEB: Partial<Record<string, string>> = {
  plus: '+', minus: '−', xmark: '×', 'magnifyingglass': '⌕', barcode: '▥', 'barcode.viewfinder': '▥', 'doc.text.viewfinder': '▤', 'doc.on.doc': '⧉',
  'bookmark': '❏', 'bolt': 'ϟ', 'camera': '◉', 'star': '☆', 'star.fill': '★', 'chevron.left': '‹', 'chevron.right': '›',
  checkmark: '✓', 'trash': '⌫', 'fork.knife': '⑂', 'scalemass': '⚖', 'drop': '◖', ruler: '⊢', 'square.and.arrow.up': '⇪',
  'calendar': '▦', 'arrow.uturn.backward': '↶', 'list.bullet': '≡', 'pencil': '✎', 'sparkles': '✦', 'flame': '♨', heart: '♡', 'heart.fill': '♥', cart: '⊔',
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

export const COLOR_DE_MACRO = { proteina: colores.oroClaro, carbohidratos: colores.salvia, grasas: colores.grasas } as const;
export type Macro = keyof typeof COLOR_DE_MACRO;
export const MACROS: readonly Macro[] = ['proteina', 'carbohidratos', 'grasas'];

/** El punto de color de un macro, con su brillo. */
export function Punto({ macro, tam = 6 }: { macro: Macro; tam?: number }) {
  const color = COLOR_DE_MACRO[macro];
  return <View style={{ width: tam, height: tam, borderRadius: tam / 2, backgroundColor: color, shadowColor: color, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }} />;
}

export type Aviso = { texto: string; deshacer?: () => void; vez: number };

/**
 * Un aviso corto: dice lo que pasó y, si se puede, ofrece deshacerlo. Arriba (con `arriba`) no tapa
 * la barra ni lo que se toca después; abajo, dentro de una hoja. Se va solo, o con un toque.
 */
export function AvisoFlotante({ aviso, alIrse, arriba, abajo = 0 }: { aviso: Aviso | null; alIrse: () => void; arriba?: number; abajo?: number }) {
  // Solo un aviso nuevo vuelve a contar: si el tiempo dependiera de la función para irse, cada vez
  // que la pantalla se vuelve a dibujar (una letra en el buscador) empezaría de nuevo.
  const irse = useEffectEvent(() => alIrse());
  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(irse, aviso.deshacer ? 3200 : 2200);
    return () => clearTimeout(espera);
  }, [aviso]);
  if (!aviso) return null;
  const desdeArriba = arriba !== undefined;
  return (
    <Animated.View
      key={aviso.vez}
      entering={(desdeArriba ? FadeInDown : FadeInUp).duration(220)}
      exiting={FadeOut.duration(180)}
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
          <Text style={estilos.avisoBotonTexto}>{t('comun.deshacer')}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

type PropsDeBoton = { texto: string; alTocar: () => void; icono?: SFSymbol; tipo?: 'principal' | 'secundario' | 'contorno' | 'grande' | 'quitar'; estilo?: StyleProp<ViewStyle>; desactivado?: boolean; etiqueta?: string };

/** Los botones de la galería: el dorado lleno, el de contorno y el de quitar. */
export function Boton({ texto, alTocar, icono, tipo = 'contorno', estilo, desactivado, etiqueta }: PropsDeBoton) {
  const lleno = tipo === 'principal' || tipo === 'grande';
  return (
    <Pressable
      onPress={alTocar}
      disabled={desactivado}
      accessibilityRole="button"
      accessibilityLabel={etiqueta ?? texto}
      accessibilityState={{ disabled: !!desactivado }}
      style={({ pressed }) => [estilos.boton, estilos[tipo], desactivado && estilos.desactivado, pressed && estilos.apretado, estilo]}
    >
      {icono && <Icono nombre={icono} tam={tipo === 'grande' ? 18 : 15} color={lleno ? colores.tinta : colores.oroClaro} peso="semibold" />}
      <Text style={[estilos.botonTexto, lleno && estilos.botonTextoLleno, tipo === 'grande' && estilos.botonTextoGrande, tipo === 'quitar' && estilos.botonTextoQuitar]}>{texto}</Text>
    </Pressable>
  );
}

/** Una pastilla que se elige: las comidas, las porciones, crudo o cocido. */
export function Pastilla({ texto, detalle, elegida, alTocar, estilo }: { texto: string; detalle?: string; elegida: boolean; alTocar: () => void; estilo?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityState={{ selected: elegida }}
      style={({ pressed }) => [estilos.pastilla, elegida && estilos.pastillaElegida, pressed && estilos.apretado, estilo]}
    >
      <Text style={[estilos.pastillaTexto, elegida && estilos.pastillaTextoElegida]} numberOfLines={1}>{texto}</Text>
      {detalle ? <Text style={estilos.pastillaDetalle}>{detalle}</Text> : null}
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
  aviso: {
    position: 'absolute', alignSelf: 'center', maxWidth: '92%', flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 42,
    paddingLeft: 16, paddingRight: 7, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(9, 14, 30, 0.95)',
    borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 10 },
  },
  avisoTextoLugar: { flexShrink: 1, paddingVertical: 4 },
  avisoTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.pergamino, paddingRight: 9 },
  avisoBoton: { paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  avisoBotonTexto: { fontFamily: letras.textoMedio, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', color: colores.oro },
  boton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, paddingHorizontal: 13, borderRadius: 999 },
  principal: { backgroundColor: colores.oro },
  secundario: { borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.36)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  contorno: { borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  grande: { height: 52, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.24, shadowRadius: 13, shadowOffset: { width: 0, height: 8 } },
  quitar: { height: 44, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)' },
  desactivado: { opacity: 0.4 },
  apretado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  botonTexto: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  botonTextoLleno: { fontFamily: letras.textoMedio, color: colores.tinta },
  botonTextoGrande: { fontSize: 16 },
  botonTextoQuitar: { fontSize: 15, color: 'rgba(239, 230, 207, 0.75)' },
  pastilla: { justifyContent: 'center', minHeight: 32, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  pastillaElegida: { borderColor: 'rgba(232, 196, 106, 0.72)', backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  pastillaTexto: { fontFamily: letras.texto, fontSize: 13.5, color: colores.pergamino },
  pastillaTextoElegida: { color: colores.oroClaro },
  pastillaDetalle: { marginTop: 3, fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.5)' },
  etiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
});
