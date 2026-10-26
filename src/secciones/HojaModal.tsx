// Una hoja de abajo, como la de personalizar Inicio: el título, la cruz para cerrar, lo de adentro
// con su scroll y, si hay, un pie fijo con los botones. Se cierra tocando afuera.

import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { AvisoFlotante, Icono } from './comida/comunes';
import { quitarAviso, useAviso } from './comida/registro';

type Props = { abierta: boolean; titulo: string; alCerrar: () => void; children: ReactNode; pie?: ReactNode; cabeza?: ReactNode };

export function HojaModal({ abierta, titulo, alCerrar, children, pie, cabeza }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducido = useReducedMotion();
  const tope = height - insets.top - 24;
  return (
    <Modal visible={abierta} transparent animationType={reducido ? 'fade' : 'slide'} onRequestClose={alCerrar}>
      <GestureHandlerRootView style={st.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={alCerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
        {/* El tope va también afuera: con el teclado, el relleno de abajo achica la hoja en vez de empujarla fuera de la pantalla. */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: tope }}>
          <View style={[st.hoja, { maxHeight: tope, paddingBottom: pie ? 0 : insets.bottom + 16 }]} accessibilityViewIsModal>
            <View style={st.asa} />
            <View style={st.cabeza}>
              <Text style={st.titulo} accessibilityRole="header">{titulo}</Text>
              {cabeza}
              <Pressable onPress={alCerrar} style={st.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={8}>
                <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={st.cuerpo} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
            {pie && <View style={[st.pie, { paddingBottom: insets.bottom + 12 }]}>{pie}</View>}
          </View>
        </KeyboardAvoidingView>
        <AvisoDeLaApp arriba={insets.top + 8} />
      </GestureHandlerRootView>
    </Modal>
  );
}

// El Modal es otra ventana, arriba de la app: el aviso de la app (Secciones.tsx) quedaba tapado.
function AvisoDeLaApp({ arriba }: { arriba: number }) {
  const aviso = useAviso();
  return <AvisoFlotante aviso={aviso} alIrse={quitarAviso} arriba={arriba} />;
}

const st = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  hoja: { flexShrink: 1, paddingTop: 8, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#0f1631', borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(232, 196, 106, 0.3)' },
  asa: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 12, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20 },
  titulo: { flex: 1, fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino },
  cerrar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  cuerpo: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 18 },
  pie: { gap: 10, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
});
