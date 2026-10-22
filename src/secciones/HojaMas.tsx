// La hoja del «+» (cambio 9 de la especificación), la de la galería: lo principal arriba (agregar
// comida y registrar el peso), la carga rápida (calorías y macros, y el agua) y las medidas del
// cuerpo. En esta etapa de la app suma el agua; lo demás llega con la comida (etapa 7) y avisa.
// Se cierra tocando afuera o bajándola con el dedo.

import * as Haptics from 'expo-haptics';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { comidaDeLaHora } from '@/dominio/comidas';
import { idioma, lista, t } from '@/textos';
import { colores } from '@/tema';
import { entre, subirOBajar } from './movimiento';

/** El agua de hoy, en mililitros. */
function useAguaDeHoy(): number {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => {
    const e = a.estado();
    let ml = 0;
    for (const x of e.agua.values()) if (x.dia === e.hoy && !x.borrado) ml += x.ml;
    return ml;
  });
}

/** El último peso como «AAAA-MM-DD kg», o '' si todavía no hay. */
function useUltimoPeso(): string {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => {
    const pesos = a.estado().pesos;
    if (pesos.length === 0) return '';
    const ultimo = pesos.reduce((x, y) => (y.fecha > x.fecha ? y : x));
    return `${ultimo.fecha} ${ultimo.kg}`;
  });
}

const numero = (n: number, decimales: number) => n.toLocaleString(idioma() === 'es' ? 'es-UY' : 'en-US', { maximumFractionDigits: decimales });

type Props = { hoja: SharedValue<number>; abierta: boolean; alCerrar: () => void };

export function HojaMas({ hoja, abierta, alCerrar }: Props) {
  const insets = useSafeAreaInsets();
  const altoHoja = useSharedValue(520);
  const [aviso, setAviso] = useState<{ texto: string; clave: number } | null>(null);
  // La comida que toca: la de la hora en que se abrió la app.
  const [comida] = useState(() => {
    const ahora = new Date();
    return comidaDeLaHora(ahora.getHours() * 60 + ahora.getMinutes());
  });
  const [hoy] = useState(() => elAlmacen().estado().hoy);
  const agua = useAguaDeHoy();
  const peso = useUltimoPeso();

  useEffect(() => {
    if (!aviso) return;
    const espera = setTimeout(() => setAviso(null), 2200);
    return () => clearTimeout(espera);
  }, [aviso]);

  const estiloFondo = useAnimatedStyle(() => ({ opacity: hoja.get() }));
  const estiloHoja = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - hoja.get()) * (altoHoja.get() + 40) }] }));
  // Bajarla con el dedo: sigue al dedo y, al soltar, se cierra o vuelve.
  const arrastre = usePanGesture({
    activeOffsetY: [-10, 10],
    onUpdate: (ev) => {
      'worklet';
      hoja.set(entre(1 - Math.max(0, ev.translationY) / (altoHoja.get() + 40), 0, 1));
    },
    onDeactivate: (ev) => {
      'worklet';
      if (ev.translationY > 90 || ev.velocityY > 600) scheduleOnRN(alCerrar);
      else hoja.set(subirOBajar(hoja.get(), 1));
    },
  });

  const pronto = () => {
    Haptics.selectionAsync().catch(() => {});
    setAviso({ texto: t('mas.pronto'), clave: Date.now() });
  };
  const sumarAgua = () => {
    elAlmacen().sumarAgua(250);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setAviso({ texto: t('mas.vasoSumado'), clave: Date.now() });
  };

  let detallePeso = t('mas.hoy');
  if (peso) {
    const [fecha, kg] = peso.split(' ');
    const [, mes, dia] = fecha.split('-').map(Number);
    const cuando = fecha === hoy ? t('mas.hoy') : `${dia} ${lista('fecha.mesesCortos')[mes - 1]}`;
    detallePeso = t('mas.ultimoPeso', { cuando, kg: numero(Number(kg), 1) });
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={abierta ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, estilos.fondo, estiloFondo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={alCerrar} accessibilityRole="button" accessibilityLabel={t('comun.cancelar')} />
      </Animated.View>
      <GestureDetector gesture={arrastre}>
        <Animated.View
          style={[estilos.hoja, { paddingBottom: insets.bottom + 18 }, estiloHoja]}
          onLayout={(ev) => altoHoja.set(ev.nativeEvent.layout.height)}
          accessibilityViewIsModal
        >
          <View style={estilos.asa} />
          <View style={estilos.fila}>
            <Principal icono="fork.knife" titulo={t('mas.agregarComida')} detalle={t(`comida.comidas.${comida}`)} alTocar={pronto} />
            <Principal icono="scalemass" titulo={t('mas.registrarPeso')} detalle={detallePeso} alTocar={pronto} />
          </View>
          <Text style={estilos.grupo}>{t('mas.cargaRapida')}</Text>
          <View style={estilos.fila}>
            <Pressable onPress={pronto} style={[estilos.rapido, estilos.mitad]} accessibilityRole="button">
              <SymbolView name="bolt" size={17} weight="light" tintColor={colores.oroClaro} />
              <Text style={estilos.rapidoTitulo}>{t('mas.caloriasYMacros')}</Text>
            </Pressable>
            <View style={[estilos.rapido, estilos.mitad]}>
              <SymbolView name="drop" size={17} weight="light" tintColor="#bcd8f2" />
              <View style={estilos.crece}>
                <Text style={estilos.rapidoTitulo}>{t('mas.agua')}</Text>
                <Text style={estilos.detalle}>{`${numero(agua / 1000, 2)} L`}</Text>
              </View>
              <Pressable onPress={sumarAgua} style={estilos.aguaMas} accessibilityRole="button" accessibilityLabel={t('mas.sumarVaso')} hitSlop={6}>
                <SymbolView name="plus" size={14} weight="semibold" tintColor={colores.pergamino} />
              </Pressable>
            </View>
          </View>
          <Pressable onPress={pronto} style={estilos.medidas} accessibilityRole="button">
            <SymbolView name="ruler" size={20} weight="light" tintColor={colores.oroClaro} />
            <View style={estilos.crece}>
              <Text style={estilos.rapidoTitulo}>{t('mas.medidas')}</Text>
              <Text style={estilos.detalle}>{t('mas.medidasTexto')}</Text>
            </View>
            <SymbolView name="chevron.right" size={13} weight="regular" tintColor={colores.pergaminoApagado} />
          </Pressable>
          {aviso && (
            <Animated.View key={aviso.clave} entering={FadeInDown.duration(200)} exiting={FadeOut.duration(180)} style={estilos.aviso} pointerEvents="none">
              <Text style={estilos.avisoTexto}>{aviso.texto}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function Principal({ icono, titulo, detalle, alTocar }: { icono: SFSymbol; titulo: string; detalle: string; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [estilos.principal, pressed && estilos.apretado]} accessibilityRole="button">
      <SymbolView name={icono} size={22} weight="light" tintColor={colores.oroClaro} />
      <Text style={estilos.principalTitulo}>{titulo}</Text>
      <Text style={estilos.detalle} numberOfLines={1}>{detalle}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  fondo: { backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  hoja: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10, paddingHorizontal: 16,
    borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#0f1631',
    borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(232, 196, 106, 0.3)',
  },
  asa: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 16, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  fila: { flexDirection: 'row', gap: 10 },
  principal: { flex: 1, gap: 6, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  apretado: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  principalTitulo: { marginTop: 4, fontFamily: 'Jost_500Medium', fontSize: 16, color: colores.pergamino },
  grupo: { marginTop: 20, marginBottom: 10, fontFamily: 'Jost_400Regular', fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: colores.pergaminoTenue },
  rapido: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  mitad: { flex: 1 },
  crece: { flex: 1, gap: 2 },
  rapidoTitulo: { fontFamily: 'Jost_400Regular', fontSize: 14.5, color: colores.pergamino },
  detalle: { fontFamily: 'Jost_400Regular', fontSize: 12.5, color: colores.pergaminoTenue, fontVariant: ['tabular-nums'] },
  aguaMas: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.35)', alignItems: 'center', justifyContent: 'center' },
  medidas: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, minHeight: 58, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  aviso: {
    position: 'absolute', alignSelf: 'center', bottom: 14, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999,
    backgroundColor: 'rgba(8, 13, 28, 0.96)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.24)',
  },
  avisoTexto: { fontFamily: 'Jost_400Regular', fontSize: 13, color: colores.pergamino },
});
