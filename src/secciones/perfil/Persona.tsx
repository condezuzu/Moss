// La persona arriba de Perfil, la de la galería (galeria/src/perfil.js, pf-tarjeta): su foto o su inicial
// en oro (sin nombre ni foto, un círculo tenue con la silueta), su nombre y el correo de la cuenta, y
// debajo la edad, la altura y el peso de hoy. Tocarla abre Editar perfil. Lo que cambia entra con un
// fundido sobre lo de antes.

import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';

import { inicialDe } from '@/dominio/nombre';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';

const ORO_DE_LA_INICIAL = 'linear-gradient(160deg, #fdeebf 0%, #e8c46a 72%)';
// Un fundido no es movimiento: con Reducir movimiento también se ve.
const ENTRA = FadeIn.duration(320).reduceMotion(ReduceMotion.Never);
const SALE = FadeOut.duration(200).reduceMotion(ReduceMotion.Never);

/** El círculo: tu foto, la inicial de tu nombre en oro o, sin ninguno de los dos, la silueta. */
export function Avatar({ foto, nombre, tam }: { foto: string | null; nombre: string; tam: number }) {
  const reducido = useReducedMotion();
  const inicial = inicialDe(nombre);
  const forma = { width: tam, height: tam, borderRadius: tam / 2 };
  // La clave es lo que se ve: lo nuevo entra encima de lo de antes, que se va.
  const clave = foto ?? (inicial ? `inicial-${inicial}` : 'vacio');
  return (
    <View style={[forma, st.marco]}>
      <Animated.View key={clave} entering={ENTRA} exiting={SALE} style={[StyleSheet.absoluteFill, st.centro, forma, !foto && (inicial ? st.oro : st.vacio)]}>
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

export type Mini = { clave: string; etiqueta: string; valor: string; unidad?: string; alTocar: () => void };

/**
 * La tarjeta de arriba de Perfil (galeria/src/perfil.js, pf-tarjeta): la persona y, debajo, lo importante de
 * un vistazo (la edad, la altura y el peso de hoy). El valor que cambia entra con un fundido.
 */
export function Tarjeta({ minis, ...persona }: Parameters<typeof Persona>[0] & { minis: Mini[] }) {
  return (
    <View style={st.tarjeta}>
      <Persona {...persona} />
      <View style={st.minis}>
        {minis.map((m) => (
          <Pressable
            key={m.clave}
            onPress={m.alTocar}
            style={({ pressed }) => [st.mini, pressed && st.miniTocada]}
            accessibilityRole="button"
            accessibilityLabel={`${m.etiqueta}: ${m.valor}${m.unidad ? ` ${m.unidad}` : ''}`}
          >
            <Text style={st.miniEtiqueta} numberOfLines={1}>{m.etiqueta}</Text>
            <Animated.Text key={m.valor + (m.unidad ?? '')} entering={ENTRA} style={st.miniValor} numberOfLines={1}>
              {m.valor}
              {m.unidad ? <Text style={st.miniUnidad}>{` ${m.unidad}`}</Text> : null}
            </Animated.Text>
          </Pressable>
        ))}
      </View>
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
        <Animated.Text key={nombre} entering={ENTRA} style={nombre ? st.nombre : st.sinNombre} numberOfLines={1}>
          {nombre || t('perfil.agregarNombre')}
        </Animated.Text>
        {/* El correo de la cuenta; sin cuenta (la web de prueba), se dice. Llega después de armar Perfil: entra con un fundido. */}
        {correo !== '' && (
          <Animated.Text key={correo ?? ''} entering={ENTRA} exiting={SALE} style={st.correo} numberOfLines={1} ellipsizeMode="middle">
            {correo ?? t('perfil.sinCuenta')}
          </Animated.Text>
        )}
      </View>
      <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
    </Pressable>
  );
}

const FONDO_DE_LA_TARJETA = 'linear-gradient(150deg, #2b3563 0%, #1b2247 56%, #11162f 100%)';

const st = StyleSheet.create({
  tarjeta: {
    marginTop: 2, paddingTop: 14, paddingHorizontal: 14, paddingBottom: 13, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.2)', backgroundColor: '#1b2247',
    ...((Platform.OS === 'web' ? { backgroundImage: FONDO_DE_LA_TARJETA } : { experimental_backgroundImage: FONDO_DE_LA_TARJETA }) as ViewStyle),
  },
  minis: { flexDirection: 'row', gap: 8, marginTop: 13 },
  mini: { flex: 1, minWidth: 0, gap: 6, paddingTop: 10, paddingHorizontal: 11, paddingBottom: 11, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(239, 230, 207, 0.055)' },
  miniTocada: { transform: [{ scale: 0.97 }], backgroundColor: 'rgba(239, 230, 207, 0.09)' },
  miniEtiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.64)' },
  miniValor: { fontFamily: letras.numero, fontSize: 20, lineHeight: 22, color: '#fbf2d9', fontVariant: ['tabular-nums'] },
  miniUnidad: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.72)' },
  persona: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  marco: { overflow: 'hidden' },
  centro: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  oro: {
    backgroundColor: colores.oro,
    ...((Platform.OS === 'web' ? { backgroundImage: ORO_DE_LA_INICIAL } : { experimental_backgroundImage: ORO_DE_LA_INICIAL }) as ViewStyle),
  },
  vacio: { backgroundColor: 'rgba(239, 230, 207, 0.06)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)' },
  inicial: { fontFamily: letras.numero, color: '#1a1406' },
  textos: { flex: 1, gap: 5 },
  nombre: { fontFamily: letras.numeroMedio, fontSize: 23, color: colores.pergamino },
  sinNombre: { fontFamily: letras.numero, fontSize: 19, color: colores.oroClaro },
  correo: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
});
