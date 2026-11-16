// Lo que comparten los bloques de Inicio: la tarjeta, su cabecera y los textos de la galería (in-bloque, in-nota).

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colores, letras } from '@/tema';

export function Cabeza({ titulo, derecha }: { titulo: string; derecha?: ReactNode }) {
  return (
    <View style={bloques.cabeza}>
      <Text style={bloques.cabezaTitulo}>{titulo}</Text>
      {derecha}
    </View>
  );
}

export const bloques = StyleSheet.create({
  bloque: { marginTop: 12, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(8, 12, 26, 0.72)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', gap: 6 },
  bloqueCielo: { backgroundColor: 'rgba(14, 22, 48, 0.82)' },
  apretado: { opacity: 0.85 },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 26 },
  cabezaTitulo: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  /** El texto de lo que hay que hacer, en los bloques del primer día y en «Para hoy». */
  texto: { fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.78)' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  cifra: { fontFamily: letras.numero, fontSize: 26, letterSpacing: -0.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
});
