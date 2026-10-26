// Vincular con Ascent en dos toques (spec/ascent.md, D27), la hoja de la galería (galeria/src/ascent.js):
// al abrirse y cada vez que la app vuelve a primer plano, mira el llavero que comparten las apps del
// equipo. Con la sesión de Ascent, «@usuario · Ascent en este iPhone» y «Vincular»; con Ascent sin
// sesión, «Abre Ascent y vuelve»; sin Ascent, «Conseguir Ascent»; sin la cuenta de Moss, que hace
// falta entrar. Siempre, abajo y chico, entrar con la cuenta de Ascent (correo y contraseña, que no
// se guardan). Tiene los colores de Ascent, como la sección.

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { AppState, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { deAscent, useAscent } from '@/almacen/ascent';
import { abrirLaApp, hayAscent, irALaAppStore } from '@/lib/ascent';
import { sesionDeAscent, vigente, type SesionCompartida } from '@/lib/llavero';
import { lista, t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { MarcaDeAscent } from '../MarcaDeAscent';
import { Aparece } from '../tarjetas';
import { C } from './colores';
import { vincularConCorreo, type ErrorDeEntrar } from './cuentaDeAscent';

type DelIphone = 'mirando' | 'sesion' | 'sinSesion' | 'sinAscent';
type Error = { de: 'llavero' | 'correo'; cual: ErrorDeEntrar };

const DEGRADE = 'linear-gradient(180deg, #0d1018 0%, #07080d 100%)';

/** `alCerrar(true)` cuando quedó vinculada: la sección hace entrar la luna en la órbita. */
export function HojaDeVincular({ abierta, alCerrar }: { abierta: boolean; alCerrar: (vinculada: boolean) => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reducido = useReducedMotion();
  const { conCuenta } = useAscent();
  const [iphone, setIphone] = useState<DelIphone>('mirando');
  const [sesion, setSesion] = useState<SesionCompartida | null>(null);
  const [conCorreo, setConCorreo] = useState(false);
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [vinculando, setVinculando] = useState<Error['de'] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // El llavero se mira al abrir y al volver de Ascent: al entrar, Ascent deja ahí su sesión.
  useEffect(() => {
    if (!abierta) return;
    let viva = true;
    const mirar = async () => {
      const s = await sesionDeAscent();
      const hay = s && vigente(s) ? true : await hayAscent();
      if (!viva) return;
      setSesion(s && vigente(s) ? s : null);
      setIphone(s && vigente(s) ? 'sesion' : hay ? 'sinSesion' : 'sinAscent');
    };
    mirar().catch(() => {});
    const sub = AppState.addEventListener('change', (e) => {
      if (e === 'active') mirar().catch(() => {});
    });
    return () => {
      viva = false;
      sub.remove();
    };
  }, [abierta]);

  const vista = conCuenta ? iphone : 'sinCuenta';
  const listo = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    alCerrar(true);
  };
  const conLlavero = async () => {
    if (!sesion || vinculando) return;
    setVinculando('llavero');
    setError(null);
    const r = await deAscent().vincular(sesion.token).catch(() => ({ ok: false as const, error: 'red' as const }));
    setVinculando(null);
    if (r.ok) listo();
    else setError({ de: 'llavero', cual: r.error });
  };
  const entrar = async () => {
    if (vinculando || !correo.trim() || !clave) return;
    setVinculando('correo');
    setError(null);
    const r = await vincularConCorreo(correo, clave);
    setVinculando(null);
    if (r.ok) listo();
    else setError({ de: 'correo', cual: r.error });
  };
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(conCorreo ? '90deg' : '0deg', { duration: reducido ? 0 : 220 }) }] }));

  const aviso = (de: Error['de']) =>
    error?.de === de ? (
      <Aparece>
        <Text style={st.error} accessibilityRole="alert" accessibilityLiveRegion="polite">{t(`ascent.vincularHoja.errores.${error.cual}`)}</Text>
      </Aparece>
    ) : null;

  return (
    <Modal visible={abierta} transparent animationType={reducido ? 'fade' : 'slide'} onRequestClose={() => alCerrar(false)}>
      <View style={st.fondo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => alCerrar(false)} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ maxHeight: height - insets.top - 24 }}>
          <View style={[st.hoja, { maxHeight: height - insets.top - 24 }]} accessibilityViewIsModal>
            <View style={st.asa} />
            <View style={st.cabeza}>
              <Text style={st.titulo} accessibilityRole="header">{t('ascent.vincularHoja.titulo')}</Text>
              <Pressable onPress={() => alCerrar(false)} style={st.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={8}>
                <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={[st.cuerpo, { paddingBottom: insets.bottom + 18 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Aparece key={vista} style={st.cuenta}>
                <MarcaDeAscent tam={52} />
                <View style={st.quien}>
                  {vista === 'sesion' && sesion ? (
                    <>
                      <Text style={st.quienNombre} numberOfLines={1}>{sesion.nombre ? `@${sesion.nombre.replace(/^@/, '')}` : t('ascent.titulo')}</Text>
                      <Text style={st.quienTexto}>{t('ascent.vincularHoja.enEsteIphone')}</Text>
                    </>
                  ) : vista !== 'mirando' && vista !== 'sesion' ? (
                    <>
                      <Text style={st.quienNombre}>{t(`ascent.vincularHoja.${vista}.titulo`)}</Text>
                      <Text style={st.quienTexto}>{t(`ascent.vincularHoja.${vista}.texto`)}</Text>
                    </>
                  ) : null}
                </View>
              </Aparece>
              {(['deMoss', 'deAscent'] as const).map((k) => (
                <View key={k}>
                  <Text style={st.grupo}>{t(`ascent.vincularHoja.${k}`)}</Text>
                  {lista(k === 'deMoss' ? 'ascent.vincularHoja.mossComparte' : 'ascent.vincularHoja.ascentComparte').map((x) => (
                    <View key={x} style={st.item}>
                      <View style={st.punto} />
                      <Text style={st.itemTexto}>{x}</Text>
                    </View>
                  ))}
                </View>
              ))}
              <Text style={st.nota}>{t('ascent.vincularHoja.nota')}</Text>
              {aviso('llavero')}
              {vista === 'sesion' && (
                <Boton texto={t(vinculando === 'llavero' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.vincular')} alTocar={conLlavero} apagado={!!vinculando} />
              )}
              {vista === 'sinSesion' && <Boton texto={t('ascent.vincularHoja.sinSesion.boton')} alTocar={abrirLaApp} />}
              {vista === 'sinAscent' && <Boton texto={t('ascent.vincularHoja.sinAscent.boton')} alTocar={irALaAppStore} />}
              <Pressable onPress={() => alCerrar(false)} style={st.ahoraNo} accessibilityRole="button" hitSlop={8}>
                <Text style={st.ahoraNoTexto}>{t('ascent.vincularHoja.ahoraNo')}</Text>
              </Pressable>
              {vista !== 'sinCuenta' && (
                <Pressable
                  onPress={() => {
                    setConCorreo((x) => !x);
                    if (error?.de === 'correo') setError(null);
                  }}
                  style={st.conCorreo}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: conCorreo }}
                  hitSlop={8}
                >
                  <Text style={st.conCorreoTexto}>{t('ascent.vincularHoja.conCorreo')}</Text>
                  <Animated.View style={flecha}>
                    <Icono nombre="chevron.right" tam={11} color={C.sub} peso="semibold" />
                  </Animated.View>
                </Pressable>
              )}
              {conCorreo && vista !== 'sinCuenta' && (
                <Aparece style={st.form}>
                  <TextInput
                    value={correo}
                    onChangeText={setCorreo}
                    placeholder={t('ascent.vincularHoja.correo')}
                    placeholderTextColor={C.sub}
                    style={st.campo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="username"
                    returnKeyType="next"
                    accessibilityLabel={t('ascent.vincularHoja.correo')}
                  />
                  <TextInput
                    value={clave}
                    onChangeText={setClave}
                    placeholder={t('ascent.vincularHoja.clave')}
                    placeholderTextColor={C.sub}
                    style={st.campo}
                    secureTextEntry
                    autoCapitalize="none"
                    autoComplete="current-password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={entrar}
                    accessibilityLabel={t('ascent.vincularHoja.clave')}
                  />
                  {aviso('correo')}
                  <Pressable
                    onPress={entrar}
                    disabled={!!vinculando}
                    style={({ pressed }) => [st.entrar, pressed && st.entrarApretado, (!correo.trim() || !clave || !!vinculando) && st.apagado]}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !!vinculando }}
                  >
                    <Text style={st.entrarTexto}>{t(vinculando === 'correo' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.entrar')}</Text>
                  </Pressable>
                  <Text style={st.nota}>{t('ascent.vincularHoja.notaCorreo')}</Text>
                </Aparece>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Boton({ texto, alTocar, apagado }: { texto: string; alTocar: () => void; apagado?: boolean }) {
  return (
    <Pressable onPress={alTocar} disabled={apagado} style={({ pressed }) => [st.boton, pressed && st.botonApretado, apagado && st.apagado]} accessibilityRole="button" accessibilityState={{ disabled: !!apagado }}>
      <Text style={st.botonTexto}>{texto}</Text>
    </Pressable>
  );
}

const st = StyleSheet.create({
  fondo: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  hoja: {
    flexShrink: 1, paddingTop: 8, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderColor: C.lineaFuerte, backgroundColor: '#0a0c12',
    ...((Platform.OS === 'web' ? { backgroundImage: DEGRADE } : { experimental_backgroundImage: DEGRADE }) as ViewStyle),
  },
  asa: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, marginBottom: 6, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cabeza: { alignItems: 'center', justifyContent: 'center', minHeight: 36, paddingHorizontal: 56 },
  titulo: { fontFamily: letras.numeroMedio, fontSize: 17, color: C.tinta, textAlign: 'center' },
  cerrar: { position: 'absolute', right: 12, top: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  cuerpo: { paddingHorizontal: 22, paddingTop: 4 },
  cuenta: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderColor: C.linea, minHeight: 80 },
  quien: { flex: 1 },
  quienNombre: { fontFamily: letras.texto, fontSize: 18, lineHeight: 22, color: C.tinta },
  quienTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16.5, color: C.sub },
  grupo: { marginTop: 16, marginBottom: 6, fontFamily: letras.texto, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: C.sub },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 3 },
  punto: { width: 4, height: 4, borderRadius: 2, marginTop: 8, marginLeft: 2, backgroundColor: C.claro },
  itemTexto: { flex: 1, fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: C.tinta },
  nota: { marginTop: 16, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: C.sub },
  error: { marginTop: 16, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.ambar },
  boton: { marginTop: 18, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: C.tinta },
  botonApretado: { backgroundColor: '#c9cedb' },
  botonTexto: { fontFamily: letras.textoMedio, fontSize: 15, letterSpacing: 0.3, color: C.fondo },
  apagado: { opacity: 0.6 },
  ahoraNo: { alignSelf: 'center', marginTop: 12, paddingVertical: 4 },
  ahoraNoTexto: { fontFamily: letras.texto, fontSize: 13, color: C.claro, textDecorationLine: 'underline', textDecorationColor: 'rgba(196, 194, 186, 0.4)' },
  conCorreo: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 20, paddingVertical: 6 },
  conCorreoTexto: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  form: { marginTop: 12, gap: 8 },
  campo: { minHeight: 46, paddingHorizontal: 14, borderWidth: 1, borderColor: C.lineaFuerte, backgroundColor: 'rgba(232, 236, 246, 0.04)', fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  entrar: { marginTop: 10, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 236, 246, 0.7)' },
  entrarApretado: { backgroundColor: 'rgba(232, 236, 246, 0.08)' },
  entrarTexto: { fontFamily: letras.textoMedio, fontSize: 14.5, letterSpacing: 0.3, color: C.tinta },
});
