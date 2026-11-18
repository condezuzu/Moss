// Lo que comparten los bloques de Inicio: la tarjeta, su cabecera, los textos de la galería (in-bloque, in-nota) y
// los renglones justos.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { colores, letras } from '@/tema';
import { degradado } from '../sueno/comunes';

/** El alto de línea natural de cada letra, en veces su tamaño: Jost (el texto) y Outfit (los números). */
const NATURAL = { texto: 1.445, numero: 1.26 } as const;

/**
 * Un renglón tan justo como en la galería (`line-height: 1`). Con un alto de línea menor que el de la letra, iOS la
 * recorta por arriba: se deja el natural y se le saca lo que sobra con márgenes. Ocupa `alto` y la letra queda centrada.
 */
export const justo = (letra: keyof typeof NATURAL, tam: number, alto: number = tam): TextStyle => ({ marginVertical: (alto - tam * NATURAL[letra]) / 2 });

export function Cabeza({ titulo, derecha }: { titulo: string; derecha?: ReactNode }) {
  return (
    <View style={bloques.cabeza}>
      <Text style={bloques.cabezaTitulo}>{titulo}</Text>
      {derecha}
    </View>
  );
}

/** Lo que va a la derecha de la cabecera sin caja: «3 de 6», «Calidad 92». */
export const Cuenta = ({ texto }: { texto: string }) => <Text style={bloques.cuenta}>{texto}</Text>;

export const bloques = StyleSheet.create({
  bloque: { marginTop: 14, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(8, 12, 26, 0.72)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)' },
  // El día en el cielo: más claro arriba, como el cielo de la galería (.in-cielo).
  bloqueCielo: { backgroundColor: 'transparent', ...degradado('radial-gradient(120% 100% at 50% 0%, rgba(20, 30, 62, 0.85), rgba(6, 9, 20, 0.85))') },
  apretado: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 22, marginBottom: 9 },
  cabezaTitulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)', ...justo('texto', 9.5) },
  cuenta: { fontFamily: letras.numeroMedio, fontSize: 11, color: 'rgba(239, 230, 207, 0.6)', fontVariant: ['tabular-nums'], ...justo('numero', 11) },
  /** El texto de lo que hay que hacer, en los bloques del primer día y en «Para hoy». */
  texto: { marginTop: 12, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.78)' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  cifra: { fontFamily: letras.numero, fontSize: 26, letterSpacing: -0.2, color: colores.cifra, fontVariant: ['tabular-nums'], ...justo('numero', 26) },
});
