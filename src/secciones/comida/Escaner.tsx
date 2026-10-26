// Los dos escáneres de la hoja de registro (spec/nutricion.md, «Código de barras» y «Escáner de
// etiqueta»): el código se lee solo, sin disparar; la etiqueta, con una foto que el iPhone lee en
// el teléfono (modules/leer-etiqueta). Qué hacer con lo leído lo decide la hoja.

import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { leerFotoDeEtiqueta } from '../../../modules/leer-etiqueta';
import { Boton, Icono } from './comunes';

type Props = {
  modo: 'codigo' | 'etiqueta';
  /** Lo que dice la hoja mientras busca o si no encontró; null, nada. */
  mensaje: string | null;
  ocupado: boolean;
  alCodigo: (codigo: string) => void;
  alEtiqueta: (lineas: string[]) => void;
  alAMano: () => void;
  alCambiarModo: (modo: 'codigo' | 'etiqueta') => void;
  alCerrar: () => void;
  arriba: number;
  abajo: number;
};

export function Escaner(p: Props) {
  const [permiso, pedirPermiso] = useCameraPermissions();
  const camara = useRef<CameraView>(null);
  const [lista, setLista] = useState(false);
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El código llega varias veces por segundo: el primero alcanza.
  const visto = useRef<string | null>(null);

  const sacarFoto = async () => {
    if (!camara.current || leyendo) return;
    if (!leerFotoDeEtiqueta) {
      setError(t('comida.escaner.soloIphone'));
      return;
    }
    setLeyendo(true);
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      const foto = await camara.current.takePictureAsync({ quality: 0.8, shutterSound: false });
      const lineas = await leerFotoDeEtiqueta(foto.uri);
      if (lineas.length) p.alEtiqueta(lineas);
      else setError(t('comida.escaner.noSeLeyo'));
    } catch {
      setError(t('comida.escaner.noSeLeyo'));
    } finally {
      setLeyendo(false);
    }
  };

  const mensaje = error ?? p.mensaje ?? (p.modo === 'codigo' ? t('comida.escaner.codigoTexto') : t('comida.escaner.etiquetaTexto'));
  const ocupado = p.ocupado || leyendo;

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(200)} style={estilos.escaner}>
      {permiso?.granted ? (
        <CameraView
          ref={camara}
          style={StyleSheet.absoluteFill}
          facing="back"
          onCameraReady={() => setLista(true)}
          barcodeScannerSettings={p.modo === 'codigo' ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] } : undefined}
          onBarcodeScanned={
            p.modo === 'codigo' && !p.ocupado
              ? (r) => {
                  if (visto.current === r.data) return;
                  visto.current = r.data;
                  Haptics.selectionAsync().catch(() => {});
                  p.alCodigo(r.data);
                }
              : undefined
          }
        />
      ) : (
        <View style={estilos.sinPermiso}>
          {permiso && (
            <>
              <Text style={estilos.texto}>{t('comida.escaner.sinPermiso')}</Text>
              <Boton
                tipo="principal"
                texto={t(permiso.canAskAgain ? 'comida.escaner.darPermiso' : 'comida.escaner.abrirAjustes')}
                alTocar={() => (permiso.canAskAgain ? pedirPermiso().catch(() => {}) : Linking.openSettings().catch(() => {}))}
              />
            </>
          )}
          <Boton tipo="contorno" texto={t('comida.escaner.aMano')} alTocar={p.alAMano} />
        </View>
      )}

      <View style={[estilos.arriba, { paddingTop: p.arriba }]} pointerEvents="box-none">
        <Pressable onPress={p.alCerrar} style={estilos.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')}>
          <Icono nombre="xmark" tam={15} color={colores.pergamino} peso="semibold" />
        </Pressable>
        <View style={estilos.modos}>
          {(['codigo', 'etiqueta'] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => {
                // Volver al código deja leer de nuevo el mismo (después de «sin conexión», por ejemplo).
                visto.current = null;
                p.alCambiarModo(m);
              }}
              style={[estilos.modo, p.modo === m && estilos.modoElegido]}
              accessibilityRole="button"
              accessibilityState={{ selected: p.modo === m }}
            >
              <Text style={[estilos.modoTexto, p.modo === m && estilos.modoTextoElegido]}>{t(m === 'codigo' ? 'comida.escaner.codigoTitulo' : 'comida.escaner.etiquetaTitulo')}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {permiso?.granted && <View style={[estilos.marco, p.modo === 'codigo' ? estilos.marcoCodigo : estilos.marcoEtiqueta]} pointerEvents="none" />}

      <View style={[estilos.abajo, { paddingBottom: p.abajo + 18 }]} pointerEvents="box-none">
        <View style={estilos.mensaje}>
          {ocupado && <ActivityIndicator color={colores.oroClaro} />}
          <Text style={estilos.texto}>{leyendo ? t('comida.escaner.leyendo') : mensaje}</Text>
        </View>
        {p.modo === 'etiqueta' && permiso?.granted && (
          <Pressable onPress={sacarFoto} disabled={!lista || leyendo} style={[estilos.disparo, (!lista || leyendo) && estilos.apagado]} accessibilityRole="button" accessibilityLabel={t('comida.escaner.sacarFoto')}>
            <View style={estilos.disparoAdentro} />
          </Pressable>
        )}
        {(p.mensaje || error) && <Boton tipo="contorno" texto={t('comida.escaner.aMano')} alTocar={p.alAMano} />}
        {p.modo === 'codigo' && p.mensaje && !p.ocupado && (
          <Boton
            tipo="contorno"
            texto={t('comida.escaner.otraVez')}
            alTocar={() => {
              visto.current = null;
              p.alCambiarModo('codigo');
            }}
          />
        )}
      </View>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  escaner: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', zIndex: 20 },
  sinPermiso: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 32 },
  arriba: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  cerrar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modos: { flexDirection: 'row', gap: 6 },
  modo: { height: 32, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  modoElegido: { backgroundColor: 'rgba(232, 196, 106, 0.22)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.62)' },
  modoTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.8)' },
  modoTextoElegido: { color: colores.oroClaro },
  marco: { position: 'absolute', alignSelf: 'center', borderRadius: 18, borderWidth: 2, borderColor: 'rgba(246, 227, 166, 0.85)' },
  marcoCodigo: { top: '32%', width: '78%', height: 150 },
  marcoEtiqueta: { top: '16%', width: '82%', height: '50%' },
  abajo: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', gap: 14, paddingHorizontal: 24 },
  mensaje: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(0, 0, 0, 0.55)' },
  texto: { flexShrink: 1, textAlign: 'center', fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: colores.pergamino },
  disparo: { width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: colores.pergamino, alignItems: 'center', justifyContent: 'center' },
  disparoAdentro: { width: 58, height: 58, borderRadius: 29, backgroundColor: colores.pergamino },
  apagado: { opacity: 0.4 },
});
