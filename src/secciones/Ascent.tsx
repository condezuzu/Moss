// Ascent, arriba de Hábitos (cambio 10 de la especificación), como en la galería. Sube desde el
// musgo con el gesto del cielo o tocando la flecha (Cielo.tsx), y se baja tirando para abajo desde
// arriba de todo, con la flecha de arriba o tocando Hábitos. Tiene los colores de Ascent y su regla:
// esquina viva o píldora, y una línea arriba de cada parte en vez de cajas. Hasta que exista la
// conexión (después de la v1) se ve sin vincular: cada función vacía, con su candado.

import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useAnimatedScrollHandler, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { t } from '@/textos';
import { MarcaDeAscent } from './MarcaDeAscent';

// Los colores de Ascent (movil/src/colores.ts).
const C = {
  fondo: '#05060a', tinta: '#e8ecf6', sub: '#8a93a8', apagado: '#4a5163', linea: '#1d2230', lineaFuerte: '#2a3040',
  principal: '#7e8ca8', claro: '#c4c2ba',
};

const FUNCIONES: { clave: 'peso' | 'calorias' | 'objetivo' | 'cuenta' | 'proteina' | 'gimnasio'; icono: SFSymbol }[] = [
  { clave: 'peso', icono: 'scalemass' },
  { clave: 'calorias', icono: 'bolt' },
  { clave: 'objetivo', icono: 'target' },
  { clave: 'cuenta', icono: 'person.2' },
  { clave: 'proteina', icono: 'dumbbell' },
  { clave: 'gimnasio', icono: 'star' },
];

type Props = { subida: SharedValue<number>; abierta: boolean; abajo: number; alCerrar: () => void };

export function Ascent({ subida, abierta, abajo, alCerrar }: Props) {
  const { height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState<{ texto: string; clave: number } | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(null), 2400);
    return () => clearTimeout(espera);
  }, [aviso]);

  const estiloVelo = useAnimatedStyle(() => ({ opacity: 0.6 * subida.get() }));
  const estiloPanel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - subida.get()) * alto }] }));
  // Tirar para abajo desde arriba de todo la baja, como una hoja.
  const alDesplazar = useAnimatedScrollHandler({
    onEndDrag: (ev) => {
      if (ev.contentOffset.y < -70) scheduleOnRN(alCerrar);
    },
  });
  const pronto = () => {
    Haptics.selectionAsync().catch(() => {});
    setAviso({ texto: t('ascent.pronto'), clave: Date.now() });
  };

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, estiloVelo]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, estilos.panel, estiloPanel]} pointerEvents={abierta ? 'auto' : 'none'} accessibilityViewIsModal={abierta}>
        <View style={estilos.lineaDeArriba} />
        <Animated.ScrollView
          onScroll={alDesplazar}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: insets.top - 6, paddingBottom: abajo + 44, paddingHorizontal: 22 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={alCerrar} style={estilos.volver} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('ascent.volver')}>
            <SymbolView name="chevron.down" size={20} weight="light" tintColor="rgba(138, 147, 168, 0.6)" />
          </Pressable>
          <MarcaDeAscent />
          <View style={estilos.cabecera}>
            <Text style={estilos.etiqueta}>{t('ascent.etiqueta')}</Text>
            <Text style={estilos.titulo}>{t('ascent.titulo')}</Text>
            <Text style={estilos.bajada}>{t('ascent.bajada')}</Text>
            <Pressable onPress={pronto} style={({ pressed }) => [estilos.vincular, pressed && estilos.vincularApretado]} accessibilityRole="button">
              <Text style={estilos.vincularTexto}>{t('ascent.vincular')}</Text>
            </Pressable>
            <Pressable onPress={pronto} hitSlop={8} accessibilityRole="link">
              <Text style={estilos.conseguir}>{t('ascent.conseguir')}</Text>
            </Pressable>
            <Text style={estilos.misma}>{t('ascent.mismaCuenta')}</Text>
          </View>

          <Text style={estilos.grupo}>{t('ascent.soloConLasDos')}</Text>
          <Carta titulo={t('ascent.recuperacion.titulo')}>
            <View style={estilos.recFila}>
              <View style={estilos.anillo}>
                <Text style={estilos.anilloTexto}>—</Text>
              </View>
              <Text style={[estilos.texto, estilos.crece]}>{t('ascent.recuperacion.texto')}</Text>
            </View>
            {(['sueno', 'carga', 'comida'] as const).map((k) => (
              <View key={k} style={estilos.parte}>
                <Text style={estilos.parteNombre}>{t(`ascent.recuperacion.partes.${k}`)}</Text>
                <View style={estilos.parteBarra} />
                <Text style={estilos.raya}>—</Text>
              </View>
            ))}
          </Carta>
          <Carta titulo={t('ascent.estancamiento.titulo')}>
            <Text style={estilos.texto}>{t('ascent.estancamiento.texto')}</Text>
            <View style={estilos.tabla}>
              {(['sueno', 'proteina', 'calorias'] as const).map((k) => (
                <View key={k} style={estilos.tablaFila}>
                  <Text style={[estilos.parteNombre, estilos.crece]}>{t(`ascent.estancamiento.filas.${k}`)}</Text>
                  <Text style={estilos.raya}>—</Text>
                  <Text style={estilos.raya}>—</Text>
                </View>
              ))}
            </View>
          </Carta>
          <Carta titulo={t('ascent.anio.titulo')}>
            <Text style={estilos.texto}>{t('ascent.anio.texto')}</Text>
            <View style={estilos.grilla}>
              {(['entrenamientos', 'marcas', 'habitos', 'sueno', 'comida'] as const).map((k) => (
                <View key={k} style={estilos.dato}>
                  <Text style={estilos.datoRaya}>—</Text>
                  <Text style={estilos.datoNombre}>{t(`ascent.anio.datos.${k}`)}</Text>
                </View>
              ))}
            </View>
          </Carta>

          <Text style={estilos.grupo}>{t('ascent.mejorConectadas')}</Text>
          <View style={estilos.funciones}>
            {FUNCIONES.map((f) => (
              <View key={f.clave} style={estilos.funcion}>
                <SymbolView name={f.icono} size={19} weight="light" tintColor={C.principal} />
                <View style={estilos.crece}>
                  <Text style={estilos.funcionTitulo}>{t(`ascent.funciones.${f.clave}.titulo`)}</Text>
                  <Text style={estilos.funcionTexto}>{t(`ascent.funciones.${f.clave}.texto`)}</Text>
                </View>
                <SymbolView name="lock" size={14} weight="regular" tintColor={C.apagado} />
              </View>
            ))}
          </View>
        </Animated.ScrollView>
        {aviso && (
          <Animated.View key={aviso.clave} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(180)} style={[estilos.aviso, { bottom: abajo + 18 }]} pointerEvents="none">
            <Text style={estilos.avisoTexto}>{aviso.texto}</Text>
          </Animated.View>
        )}
      </Animated.View>
    </>
  );
}

/** Una parte: una línea de pelo arriba, el título y su candado, y lo que va a mostrar, vacío. */
function Carta({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View style={estilos.carta}>
      <View style={estilos.cartaCabecera}>
        <Text style={estilos.cartaTitulo}>{titulo}</Text>
        <View style={estilos.candado}>
          <SymbolView name="lock" size={10} weight="semibold" tintColor={C.principal} />
          <Text style={estilos.candadoTexto}>{t('ascent.conAscent')}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

const estilos = StyleSheet.create({
  velo: { backgroundColor: '#020308' },
  panel: { backgroundColor: C.fondo, shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 30, shadowOffset: { width: 0, height: -12 } },
  lineaDeArriba: { position: 'absolute', left: 0, right: 0, top: 0, height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(126, 140, 168, 0.6)', zIndex: 1 },
  volver: { alignSelf: 'center', width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
  cabecera: { alignItems: 'center', marginTop: 10 },
  etiqueta: { fontFamily: 'Jost_400Regular', fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: C.sub },
  titulo: { marginTop: 8, fontFamily: 'Jost_500Medium', fontSize: 28, color: C.tinta },
  bajada: { marginTop: 12, marginHorizontal: 6, fontFamily: 'Jost_400Regular', fontSize: 14.5, lineHeight: 20.5, textAlign: 'center', color: 'rgba(232, 236, 246, 0.72)' },
  vincular: { alignSelf: 'stretch', marginTop: 22, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: C.tinta },
  vincularApretado: { backgroundColor: '#c9cedb' },
  vincularTexto: { fontFamily: 'Jost_500Medium', fontSize: 15, letterSpacing: 0.3, color: C.fondo },
  conseguir: { marginTop: 16, fontFamily: 'Jost_400Regular', fontSize: 13, color: C.claro, textDecorationLine: 'underline', textDecorationColor: 'rgba(196, 194, 186, 0.4)' },
  misma: { marginTop: 14, marginHorizontal: 6, fontFamily: 'Jost_400Regular', fontSize: 12, lineHeight: 17.5, textAlign: 'center', color: C.sub },
  grupo: { marginTop: 36, paddingBottom: 12, fontFamily: 'Jost_400Regular', fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase', color: C.sub },
  carta: { paddingTop: 16, paddingBottom: 26, borderTopWidth: 1, borderTopColor: C.lineaFuerte },
  cartaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
  cartaTitulo: { fontFamily: 'Jost_400Regular', fontSize: 16, color: C.tinta },
  candado: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingLeft: 7, paddingRight: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(126, 140, 168, 0.32)' },
  candadoTexto: { fontFamily: 'Jost_400Regular', fontSize: 10, letterSpacing: 0.8, color: C.principal },
  texto: { marginTop: 6, fontFamily: 'Jost_400Regular', fontSize: 13.5, lineHeight: 19.5, color: 'rgba(232, 236, 246, 0.62)' },
  crece: { flex: 1 },
  recFila: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  anillo: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderStyle: 'dotted', borderColor: C.apagado, alignItems: 'center', justifyContent: 'center' },
  anilloTexto: { fontFamily: 'Jost_400Regular', fontSize: 30, color: C.apagado },
  parte: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  parteNombre: { width: 70, fontFamily: 'Jost_400Regular', fontSize: 13, color: C.sub },
  parteBarra: { flex: 1, height: 3, backgroundColor: C.lineaFuerte },
  raya: { minWidth: 50, textAlign: 'right', fontFamily: 'Jost_400Regular', fontSize: 12.5, color: C.apagado },
  tabla: { marginTop: 14, gap: 11 },
  tablaFila: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 18 },
  dato: { width: '33.3%', gap: 5 },
  datoRaya: { fontFamily: 'Jost_400Regular', fontSize: 22, color: C.apagado },
  datoNombre: { fontFamily: 'Jost_400Regular', fontSize: 11, color: C.sub },
  funciones: { borderTopWidth: 1, borderTopColor: C.lineaFuerte },
  funcion: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.linea },
  funcionTitulo: { fontFamily: 'Jost_400Regular', fontSize: 14.5, color: C.tinta },
  funcionTexto: { marginTop: 3, fontFamily: 'Jost_400Regular', fontSize: 12.5, lineHeight: 17.5, color: 'rgba(232, 236, 246, 0.55)' },
  aviso: {
    position: 'absolute', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: '#11141d', borderWidth: 1, borderColor: 'rgba(126, 140, 168, 0.35)',
  },
  avisoTexto: { fontFamily: 'Jost_400Regular', fontSize: 13, color: C.tinta },
});
