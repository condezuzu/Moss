// La barra de abajo, como en la galería: Inicio, Comida y Progreso, el «+» en el medio, y Sueño,
// Hábitos y Perfil, cada una con su ícono y su nombre. El nombre de destino se va prendiendo
// mientras se arrastra la tira, no de golpe al llegar. Sobre las secciones la barra es pareja; sobre
// el cielo de Hábitos deja ver el musgo.

import { SymbolView, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { t } from '@/textos';
import { colores } from '@/tema';

export const PESTANAS = ['inicio', 'comida', 'progreso', 'sueno', 'habitos', 'perfil'] as const;
export type Pestana = (typeof PESTANAS)[number];
export const HABITOS = 4;
/** Lo que ocupa la barra sin el borde de abajo del teléfono. */
export const ALTO_BARRA = 58;
/** Cuánto se oscurece el cielo detrás de cada sección: en Sueño deja ver un poco la noche. */
export const VELO = [0.8, 0.8, 0.8, 0.7, 0, 0.8];

const ICONOS: Record<Pestana, SFSymbol> = {
  inicio: 'house',
  comida: 'fork.knife',
  progreso: 'chart.line.uptrend.xyaxis',
  sueno: 'moon',
  habitos: 'point.3.connected.trianglepath.dotted',
  perfil: 'person',
};

type Props = {
  posicion: SharedValue<number>;
  subida: SharedValue<number>;
  actual: number;
  abajo: number;
  alTocar: (i: number) => void;
  alMas: () => void;
};

export function Barra({ posicion, subida, actual, abajo, alTocar, alMas }: Props) {
  const estiloSolida = useAnimatedStyle(() => {
    const velo = interpolate(posicion.value, [0, 1, 2, 3, 4, 5], VELO, 'clamp');
    return { opacity: Math.max(Math.min(1, subida.value * 3), Math.min(1, velo / 0.7)) };
  });
  const botones = PESTANAS.map((n, i) => (
    <Boton key={n} nombre={n} indice={i} posicion={posicion} elegida={i === actual} alTocar={alTocar} />
  ));
  return (
    <View style={[estilos.barra, { height: ALTO_BARRA + abajo, paddingBottom: abajo }]}>
      <View style={[StyleSheet.absoluteFill, estilos.fondo]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, estilos.solida, estiloSolida]} pointerEvents="none" />
      {botones.slice(0, 3)}
      <Pressable onPress={alMas} style={estilos.mas} accessibilityRole="button" accessibilityLabel={t('pestanas.mas')} hitSlop={6}>
        <View style={estilos.masCirculo}>
          <SymbolView name="plus" size={17} weight="regular" tintColor={colores.oroClaro} />
        </View>
      </Pressable>
      {botones.slice(3)}
    </View>
  );
}

function Boton({ nombre, indice, posicion, elegida, alTocar }: {
  nombre: Pestana;
  indice: number;
  posicion: SharedValue<number>;
  elegida: boolean;
  alTocar: (i: number) => void;
}) {
  // Encendida según dónde está la tira: del todo en su pestaña, a medias entre dos.
  const estiloLuz = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - Math.abs(posicion.value - indice)) }));
  const texto = t(`pestanas.${nombre}`);
  return (
    <Pressable onPress={() => alTocar(indice)} style={estilos.boton} accessibilityRole="tab" accessibilityLabel={texto} accessibilityState={{ selected: elegida }}>
      <View style={estilos.capa}>
        <SymbolView name={ICONOS[nombre]} size={21} weight="light" tintColor={colores.pergaminoApagado} />
        <Text style={estilos.nombre}>{texto}</Text>
      </View>
      <Animated.View style={[estilos.capa, estilos.luz, estiloLuz]} pointerEvents="none">
        <SymbolView name={ICONOS[nombre]} size={21} weight="light" tintColor={colores.pergamino} />
        <Text style={[estilos.nombre, estilos.nombreLuz]}>{texto}</Text>
      </Animated.View>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  barra: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  fondo: { backgroundColor: 'rgba(3, 5, 12, 0.55)' },
  solida: { backgroundColor: '#04060d', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(239, 230, 207, 0.12)' },
  boton: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  capa: { alignItems: 'center', gap: 4 },
  luz: { position: 'absolute', shadowColor: colores.oro, shadowOpacity: 0.35, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  nombre: { fontFamily: 'Jost_400Regular', fontSize: 10.5, color: colores.pergaminoApagado },
  nombreLuz: { color: colores.pergamino },
  mas: { flex: 1, minHeight: 50, alignItems: 'center', justifyContent: 'center' },
  masCirculo: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.55)', alignItems: 'center', justifyContent: 'center' },
});
