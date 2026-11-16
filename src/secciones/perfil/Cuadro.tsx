// El cuadrito de color de cada fila de Perfil, el de la galería (pf-cuadro): apagado, para que no compita
// con lo demás.

import type { SFSymbol } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Icono } from '../comida/comunes';

const COLORES = {
  azul: ['rgba(116, 150, 232, 0.2)', '#b5ccf8'],
  salvia: ['rgba(166, 191, 148, 0.18)', '#c6d9b6'],
  oro: ['rgba(232, 196, 106, 0.17)', '#f2d98e'],
  rosa: ['rgba(232, 150, 136, 0.17)', '#f3bcae'],
  violeta: ['rgba(150, 132, 232, 0.2)', '#c9bff6'],
  gris: ['rgba(239, 230, 207, 0.09)', 'rgba(239, 230, 207, 0.76)'],
  ascent: ['rgba(138, 147, 168, 0.22)', '#c9cfdd'],
} as const;
export type ColorDeCuadro = keyof typeof COLORES;

export function Cuadro({ icono, color }: { icono: SFSymbol; color: ColorDeCuadro }) {
  const [fondo, tinta] = COLORES[color];
  return (
    <View style={[st.cuadro, { backgroundColor: fondo }]}>
      <Icono nombre={icono} tam={16} color={tinta} peso="regular" />
    </View>
  );
}

const st = StyleSheet.create({
  cuadro: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
