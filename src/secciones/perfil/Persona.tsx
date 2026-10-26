// La persona arriba de Perfil, la de la galería (galeria/src/perfil.js, pf-cab): su foto o su inicial
// en oro (sin nombre ni foto, un círculo tenue con la silueta), su nombre y el correo de la cuenta.
// Tocarla abre Editar perfil. Lo que cambia entra con un fundido sobre lo de antes.

import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';

import { inicialDe } from '@/dominio/nombre';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';

const ORO_DE_LA_INICIAL = 'linear-gradient(160deg, #fdeebf 0%, #e8c46a 72%)';

/** El círculo: tu foto, la inicial de tu nombre en oro o, sin ninguno de los dos, la silueta. */
export function Avatar({ foto, nombre, tam }: { foto: string | null; nombre: string; tam: number }) {
  const reducido = useReducedMotion();
  const inicial = inicialDe(nombre);
  const forma = { width: tam, height: tam, borderRadius: tam / 2 };
  // La clave es lo que se ve: lo nuevo entra encima de lo de antes, que se va.
  const clave = foto ?? (inicial ? `inicial-${inicial}` : 'vacio');
  return (
    <View style={[forma, st.marco]}>
      <Animated.View key={clave} entering={FadeIn.duration(320)} exiting={FadeOut.duration(200)} style={[StyleSheet.absoluteFill, st.centro, forma, !foto && (inicial ? st.oro : st.vacio)]}>
        {foto ? (
          <Image source={{ uri: foto }} style={forma} contentFit="cover" transition={reducido ? 0 : 250} accessibilityIgnoresInvertColors />
        ) : inicial ? (
          <Text style={[st.inicial, { fontSize: Math.round(tam * 0.44) }]}>{inicial}</Text>
        ) : (
          <Icono nombre="person" tam={Math.round(tam * 0.4)} color="rgba(239, 230, 207, 0.5)" peso="light" />
        )}
      </Animated.View>
    </View>
  );
}

/** La fila de arriba de Perfil: sin nombre, invita a ponerlo. */
export function Persona({ nombre, correo, foto, alTocar }: { nombre: string; correo: string | null; foto: string | null; alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [st.persona, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={nombre || t('perfil.agregarNombre')}
      accessibilityHint={t('perfil.editar.titulo')}
    >
      <Avatar foto={foto} nombre={nombre} tam={54} />
      <View style={st.textos}>
        <Animated.Text key={nombre} entering={FadeIn.duration(320)} style={nombre ? st.nombre : st.sinNombre} numberOfLines={1}>
          {nombre || t('perfil.agregarNombre')}
        </Animated.Text>
        {/* El correo de la cuenta; sin cuenta (la web de prueba), se dice. */}
        {correo !== '' && <Text style={st.correo} numberOfLines={1} ellipsizeMode="middle">{correo ?? t('perfil.sinCuenta')}</Text>}
      </View>
      <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
    </Pressable>
  );
}

const st = StyleSheet.create({
  persona: { marginTop: 10, marginBottom: 2, flexDirection: 'row', alignItems: 'center', gap: 14 },
  marco: { overflow: 'hidden' },
  centro: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  oro: {
    backgroundColor: colores.oro,
    ...((Platform.OS === 'web' ? { backgroundImage: ORO_DE_LA_INICIAL } : { experimental_backgroundImage: ORO_DE_LA_INICIAL }) as ViewStyle),
  },
  vacio: { backgroundColor: 'rgba(239, 230, 207, 0.06)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)' },
  inicial: { fontFamily: letras.numero, color: '#1a1406' },
  textos: { flex: 1, gap: 5 },
  nombre: { fontFamily: letras.numeroMedio, fontSize: 24, color: colores.pergamino },
  sinNombre: { fontFamily: letras.numero, fontSize: 19, color: colores.oroClaro },
  correo: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
});
