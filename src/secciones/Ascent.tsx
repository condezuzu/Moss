// Ascent, arriba de Hábitos (cambio 10 de la especificación), como en la galería. Sube desde el
// musgo con el gesto del cielo o tocando la flecha (Cielo.tsx), y se baja tirando para abajo desde
// arriba de todo, con la flecha de arriba o tocando Hábitos. Tiene los colores de Ascent y su regla:
// esquina viva o píldora, y una línea arriba de cada parte en vez de cajas. Sin vincular, cada
// función vacía con su candado y «Vincular con Ascent» (la hoja de vincular, D27); vinculada, lo de
// hoy con lo que llega de Ascent (ascent/Vinculada.tsx). Al vincular, la luna entra en la órbita.

import { SymbolView } from 'expo-symbols';
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown, useAnimatedReaction, useAnimatedScrollHandler, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useAscent } from '@/almacen/ascent';
import { claveDelDia } from '@/dominio/fechas';
import { irALaAppStore } from '@/lib/ascent';
import { t } from '@/textos';
import { letras } from '@/tema';
import { C } from './ascent/colores';
import { HojaDeVincular } from './ascent/HojaDeVincular';
import { Carta, st as v, Vinculada } from './ascent/Vinculada';
import { fechaDiaMes } from './comida/datos';
import { MarcaDeAscent } from './MarcaDeAscent';

const DEGRADE = 'linear-gradient(180deg, rgba(5, 6, 10, 0) 0%, rgba(5, 6, 10, 0.42) 22%, rgba(5, 6, 10, 0.6) 100%)';
/** Lo de adentro cambia al vincular o desvincular: entra con un fundido, apenas desde abajo. */
const ENTRA = FadeInDown.duration(600).withInitialValues({ opacity: 0, transform: [{ translateY: 8 }] });

type Props = { subida: SharedValue<number>; abierta: boolean; abajo: number; alCerrar: () => void };

export function Ascent({ subida, abierta, abajo, alCerrar }: Props) {
  const { height: alto } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { vinculo } = useAscent();
  const [hoja, setHoja] = useState(false);
  const [vez, setVez] = useState(0);
  // Las cuentas de la sección vinculada se hacen cuando empieza a subir, no con cada toque del cielo.
  const [subiendo, setSubiendo] = useState(false);
  useAnimatedReaction(
    () => subida.get() > 0,
    (ahora, antes) => {
      if (ahora !== antes) scheduleOnRN(setSubiendo, ahora);
    },
  );
  // La luna entra en la órbita cuando la hoja termina de bajar.
  const vinculada = vinculo.vinculada && !hoja;

  const estiloVelo = useAnimatedStyle(() => ({ opacity: 0.32 * subida.get() }));
  const estiloPanel = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - subida.get()) * alto }] }));
  // Tirar para abajo desde arriba de todo la baja, como una hoja.
  const alDesplazar = useAnimatedScrollHandler({
    onEndDrag: (ev) => {
      if (ev.contentOffset.y < -70) scheduleOnRN(alCerrar);
    },
  });
  const abrirHoja = () => {
    setVez((x) => x + 1);
    setHoja(true);
  };

  return (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, estilos.velo, estiloVelo]} pointerEvents="none" />
      <Animated.View style={[StyleSheet.absoluteFill, estilos.panel, estiloPanel]} pointerEvents={abierta ? 'auto' : 'none'} accessibilityViewIsModal={abierta}>
        <Animated.ScrollView
          onScroll={alDesplazar}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingTop: insets.top - 6, paddingBottom: abajo + 44, paddingHorizontal: 22 }}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={alCerrar} style={estilos.volver} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('ascent.volver')}>
            <SymbolView name="chevron.down" size={20} weight="light" tintColor="rgba(138, 147, 168, 0.6)" />
          </Pressable>
          <MarcaDeAscent unida={vinculada} />
          <Animated.View key={vinculada ? 'con' : 'sin'} entering={ENTRA}>
            <View style={estilos.cabecera}>
              <Text style={estilos.etiqueta}>{vinculada && vinculo.desde ? t('ascent.vinculadaDesde', { fecha: fechaDiaMes(claveDelDia(new Date(vinculo.desde))) }) : t('ascent.etiqueta')}</Text>
              <Text style={estilos.titulo}>{t('ascent.titulo')}</Text>
              {!vinculada && (
                <>
                  <Text style={estilos.bajada}>{t('ascent.bajada')}</Text>
                  <Pressable onPress={abrirHoja} style={({ pressed }) => [estilos.vincular, pressed && estilos.vincularApretado]} accessibilityRole="button">
                    <Text style={estilos.vincularTexto}>{t('ascent.vincular')}</Text>
                  </Pressable>
                  <Pressable onPress={irALaAppStore} hitSlop={8} accessibilityRole="link">
                    <Text style={estilos.conseguir}>{t('ascent.conseguir')}</Text>
                  </Pressable>
                  <Text style={estilos.misma}>{t('ascent.permiso')}</Text>
                </>
              )}
            </View>
            {vinculada ? <Vinculada preparada={abierta || subiendo} /> : <SinVincular />}
          </Animated.View>
        </Animated.ScrollView>
      </Animated.View>
      <HojaDeVincular key={vez} abierta={hoja} alCerrar={() => setHoja(false)} />
    </>
  );
}

/** Sin vincular: cada función muestra vacío lo que va a mostrar, con un candado chico. */
function SinVincular() {
  return (
    <>
      <Text style={v.grupo}>{t('ascent.soloConLasDos')}</Text>
      <Bloqueada titulo={t('ascent.recuperacion.titulo')}>
        <View style={estilos.recFila}>
          <View style={estilos.anillo}>
            <Text style={estilos.anilloTexto}>—</Text>
          </View>
          <Text style={[v.texto, estilos.crece]}>{t('ascent.recuperacion.texto')}</Text>
        </View>
        {(['sueno', 'carga', 'comida'] as const).map((k) => (
          <View key={k} style={estilos.parte}>
            <Text style={estilos.parteNombre}>{t(`ascent.recuperacion.partes.${k}`)}</Text>
            <View style={estilos.parteBarra} />
            <Text style={estilos.raya}>—</Text>
          </View>
        ))}
      </Bloqueada>
      <Bloqueada titulo={t('ascent.rendimiento.titulo')}>
        <Text style={v.texto}>{t('ascent.rendimiento.texto')}</Text>
        {(['fuerza', 'repeticiones'] as const).map((k) => (
          <View key={k} style={estilos.parte}>
            <Text style={[estilos.parteNombre, estilos.crece]}>{t(`ascent.rendimiento.${k}`)}</Text>
            <Text style={estilos.raya}>—</Text>
          </View>
        ))}
      </Bloqueada>
      <Bloqueada titulo={t('ascent.musculos.titulo')}>
        <Text style={v.texto}>{t('ascent.musculos.texto')}</Text>
      </Bloqueada>
      <Bloqueada titulo={t('ascent.marca.titulo')}>
        <Text style={v.texto}>{t('ascent.marca.texto')}</Text>
      </Bloqueada>
      <Bloqueada titulo={t('ascent.estancamiento.titulo')}>
        <Text style={v.texto}>{t('ascent.estancamiento.texto')}</Text>
        <View style={estilos.tabla}>
          {(['sueno', 'proteina', 'calorias'] as const).map((k) => (
            <View key={k} style={estilos.tablaFila}>
              <Text style={[estilos.parteNombre, estilos.crece]}>{t(`ascent.estancamiento.filas.${k}`)}</Text>
              <Text style={estilos.raya}>—</Text>
              <Text style={estilos.raya}>—</Text>
            </View>
          ))}
        </View>
      </Bloqueada>
      <Bloqueada titulo={t('ascent.anio.titulo')}>
        <Text style={v.texto}>{t('ascent.anio.texto')}</Text>
        <View style={estilos.grilla}>
          {(['entrenamientos', 'marcas', 'habitos', 'sueno', 'comida'] as const).map((k) => (
            <View key={k} style={estilos.dato}>
              <Text style={estilos.datoRaya}>—</Text>
              <Text style={estilos.datoNombre}>{t(`ascent.anio.datos.${k}`)}</Text>
            </View>
          ))}
        </View>
      </Bloqueada>
    </>
  );
}

/** Una parte bloqueada: su título con el candado chico, y lo que va a mostrar, vacío. */
function Bloqueada({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Carta
      titulo={titulo}
      derecha={
        <View style={estilos.candado}>
          <SymbolView name="lock" size={10} weight="semibold" tintColor={C.principal} />
          <Text style={estilos.candadoTexto}>{t('ascent.conAscent')}</Text>
        </View>
      }
    >
      {children}
    </Carta>
  );
}

const estilos = StyleSheet.create({
  velo: { backgroundColor: '#020308' },
  // Sin caja: el cielo sigue detrás (sube con el dedo, como a «Tu universo»), apenas oscurecido para leer.
  panel: (Platform.OS === 'web' ? { backgroundImage: DEGRADE } : { experimental_backgroundImage: DEGRADE }) as ViewStyle,
  volver: { alignSelf: 'center', width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
  cabecera: { alignItems: 'center', marginTop: 10 },
  etiqueta: { fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: C.sub, textAlign: 'center' },
  titulo: { marginTop: 8, fontFamily: letras.numeroMedio, fontSize: 28, color: C.tinta },
  bajada: { marginTop: 12, marginHorizontal: 6, fontFamily: letras.texto, fontSize: 14.5, lineHeight: 20.5, textAlign: 'center', color: 'rgba(232, 236, 246, 0.72)' },
  vincular: { alignSelf: 'stretch', marginTop: 22, minHeight: 50, alignItems: 'center', justifyContent: 'center', backgroundColor: C.tinta },
  vincularApretado: { backgroundColor: '#c9cedb' },
  vincularTexto: { fontFamily: letras.textoMedio, fontSize: 15, letterSpacing: 0.3, color: C.fondo },
  conseguir: { marginTop: 16, fontFamily: letras.texto, fontSize: 13, color: C.claro, textDecorationLine: 'underline', textDecorationColor: 'rgba(196, 194, 186, 0.4)' },
  misma: { marginTop: 14, marginHorizontal: 6, fontFamily: letras.texto, fontSize: 12, lineHeight: 17.5, textAlign: 'center', color: C.sub },
  candado: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingLeft: 7, paddingRight: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(126, 140, 168, 0.32)' },
  candadoTexto: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 0.8, color: C.principal },
  crece: { flex: 1 },
  recFila: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
  anillo: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderStyle: 'dotted', borderColor: C.apagado, alignItems: 'center', justifyContent: 'center' },
  anilloTexto: { fontFamily: letras.numeroLiviano, fontSize: 30, color: C.apagado },
  parte: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 13 },
  parteNombre: { width: 70, fontFamily: letras.texto, fontSize: 13, color: C.sub },
  parteBarra: { flex: 1, height: 3, backgroundColor: C.lineaFuerte },
  raya: { minWidth: 50, textAlign: 'right', fontFamily: letras.texto, fontSize: 12.5, color: C.apagado },
  tabla: { marginTop: 14, gap: 11 },
  tablaFila: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 18 },
  dato: { width: '33.3%', gap: 5 },
  datoRaya: { fontFamily: letras.numeroLiviano, fontSize: 22, color: C.apagado },
  datoNombre: { fontFamily: letras.texto, fontSize: 11, color: C.sub },
});
