// El visor de la foto de la comida (galeria/src/fotos.js): la cámara adentro de la hoja de registro,
// con la línea fija de que la foto no se analiza, «Tus fotos» a mano (el selector del sistema) y un
// toque hasta disparar. Qué hacer con la foto lo decide la hoja.

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_FUNDIDO, ENTRA_PANEL, SALE_FUNDIDO, SALE_PANEL } from '../movimiento';
import { margenDeToque } from '../paso';
import { Boton, Icono } from './comunes';
import { elegirDeTusFotos } from './fotos';

/** Dónde estaba lo que se tocó, en la pantalla: la miniatura de «¿Qué es?» vuela desde ahí. */
export type Rect = { x: number; y: number; ancho: number; alto: number };

const medir = (v: ViewInstance | null) => new Promise<Rect | null>((listo) => {
  if (!v) return listo(null);
  v.measureInWindow((x, y, ancho, alto) => listo(ancho ? { x, y, ancho, alto } : null));
});

export function Visor({ alSacar, alAtras, abajo }: { alSacar: (uri: string, desde: Rect | null) => void; alAtras: () => void; abajo: number }) {
  const reducido = useReducedMotion();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);
  const marco = useRef<ViewInstance>(null);
  const tusFotos = useRef<ViewInstance>(null);
  const [lista, setLista] = useState(false);
  const [sacando, setSacando] = useState(false);
  const flash = useSharedValue(0);
  const estiloFlash = useAnimatedStyle(() => ({ opacity: flash.get() }));

  const disparar = async () => {
    if (sacando || !camara.current) return;
    setSacando(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!reducido) flash.set(withSequence(withTiming(0.85, { duration: 70 }), withTiming(0, { duration: 170 })));
    try {
      const [foto, desde] = await Promise.all([camara.current.takePictureAsync({ quality: 0.6 }), medir(marco.current)]);
      if (foto?.uri) alSacar(foto.uri, desde);
      else setSacando(false);
    } catch {
      setSacando(false);
    }
  };
  const elegir = async () => {
    if (sacando) return;
    const uri = await elegirDeTusFotos().catch(() => null);
    if (uri) alSacar(uri, await medir(tusFotos.current));
  };

  return (
    <Animated.View entering={reducido ? ENTRA_FUNDIDO : ENTRA_PANEL} exiting={reducido ? SALE_FUNDIDO : SALE_PANEL} style={[st.panel, { bottom: -abajo }]} accessibilityViewIsModal onAccessibilityEscape={alAtras}>
      <View style={st.cabeza}>
        <Pressable onPress={alAtras} style={({ pressed }) => [st.atras, pressed && st.apretado]} accessibilityRole="button" accessibilityLabel={t('comun.atras')} hitSlop={margenDeToque(38)}>
          <Icono nombre="chevron.left" tam={18} peso="medium" />
        </Pressable>
        <Text style={st.titulo} numberOfLines={1} accessibilityRole="header">{t('comida.fotoDiario.visor')}</Text>
        <View style={st.lugar} />
      </View>
      <View ref={marco} collapsable={false} style={st.marco}>
        {permiso?.granted ? (
          <CameraView ref={camara} style={StyleSheet.absoluteFill} facing="back" onCameraReady={() => setLista(true)} />
        ) : (
          <View style={st.sinPermiso}>
            {permiso && (
              <>
                <Text style={st.sinPermisoTexto}>{t('comida.escaner.sinPermiso')}</Text>
                <Boton
                  tipo="principal"
                  texto={t(permiso.canAskAgain ? 'comida.escaner.darPermiso' : 'comida.escaner.abrirAjustes')}
                  alTocar={() => (permiso.canAskAgain ? pedirPermiso().catch(() => {}) : Linking.openSettings().catch(() => {}))}
                />
              </>
            )}
          </View>
        )}
        <Animated.View style={[st.flash, estiloFlash]} pointerEvents="none" />
      </View>
      <Text style={st.noSeAnaliza}>{t('comida.fotoDiario.noSeAnaliza')}</Text>
      <View style={[st.controles, { paddingBottom: abajo + 10 }]}>
        <Pressable
          ref={tusFotos}
          onPress={elegir}
          style={({ pressed }) => [st.elegir, pressed && st.apretado]}
          accessibilityRole="button"
          accessibilityLabel={t('comida.fotoDiario.elegir')}
          accessibilityHint={t('comida.fotoDiario.soloLaQueElijas')}
        >
          <View style={st.elegirCuadro}>
            <Icono nombre="photo.on.rectangle" tam={20} color="rgba(239, 230, 207, 0.85)" />
          </View>
          <Text style={st.elegirTexto} numberOfLines={1}>{t('comida.fotoDiario.tusFotos')}</Text>
        </Pressable>
        <Pressable
          onPress={disparar}
          disabled={!permiso?.granted || !lista || sacando}
          style={[st.disparar, (!permiso?.granted || !lista) && st.apagado]}
          accessibilityRole="button"
          accessibilityLabel={t('comida.fotoDiario.disparar')}
        >
          {({ pressed }) => <View style={[st.dispararAdentro, pressed && st.dispararApretado]} />}
        </Pressable>
        <View style={st.costado} />
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  // Las esquinas de la hoja de registro, como un panel (Paneles.tsx).
  panel: { position: 'absolute', top: 0, left: 0, right: 0, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: colores.hoja },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 46, paddingTop: 2, paddingHorizontal: 12 },
  atras: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  apretado: { opacity: 0.6 },
  titulo: { flex: 1, minWidth: 0, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  lugar: { width: 38 },
  marco: { flex: 1, minHeight: 0, marginTop: 2, marginHorizontal: 16, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000' },
  sinPermiso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 28 },
  sinPermisoTexto: { textAlign: 'center', fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: colores.pergamino },
  flash: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#fff', opacity: 0 },
  noSeAnaliza: { marginTop: 12, marginHorizontal: 20, textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.68)' },
  controles: { flexDirection: 'row', alignItems: 'center', paddingTop: 14, paddingHorizontal: 24 },
  elegir: { flex: 1, alignItems: 'flex-start' },
  elegirCuadro: { width: 46, height: 46, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  elegirTexto: { marginTop: 5, width: 60, marginLeft: -7, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.8)' },
  disparar: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: colores.pergamino, alignItems: 'center', justifyContent: 'center' },
  dispararAdentro: { width: 58, height: 58, borderRadius: 29, backgroundColor: colores.pergamino },
  dispararApretado: { transform: [{ scale: 0.9 }] },
  apagado: { opacity: 0.4 },
  costado: { flex: 1 },
});
