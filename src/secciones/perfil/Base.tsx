// Perfil › En qué se basa Moss, el de la galería (galeria/src/perfil.js, pintarBase; spec/estudio.md): cómo
// se ordena lo que llega (un dibujo con lo que llega, lo que hace Moss y lo que ves, y sus reglas), cada área
// con su porqué y sus fuentes, que se abren de a una, y lo que Moss no hace. Ascent, solo con la vinculación.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { CON_ASCENT } from '@/lib/banderas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { HojaModal } from '../HojaModal';
import { ACOMODA, Aparece, EtiquetaDeGrupo, Parrafo } from '../tarjetas';

const AREAS = (['metas', 'progreso', 'sueno', 'momentos', 'ascent', 'cuidados', 'fotos'] as const).filter((a) => a !== 'ascent' || CON_ASCENT);
type Area = (typeof AREAS)[number];

function Columna({ titulo, items, moss }: { titulo: string; items: readonly string[]; moss?: boolean }) {
  return (
    <View style={st.columna}>
      <Text style={st.columnaTitulo}>{titulo}</Text>
      {items.map((x) => (
        <Text key={x} style={[st.item, moss && st.itemMoss]}>{x}</Text>
      ))}
    </View>
  );
}

const Flecha = () => (
  <View style={st.flecha}>
    <Icono nombre="chevron.right" tam={11} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
  </View>
);

/** Una lista con sus puntos, como las reglas y lo que Moss no hace. */
function Puntos({ items }: { items: readonly string[] }) {
  return (
    <View style={st.puntos}>
      {items.map((x) => (
        <View key={x} style={st.puntoFila}>
          <View style={st.punto} />
          <Text style={st.puntoTexto}>{x}</Text>
        </View>
      ))}
    </View>
  );
}

function AreaQueSeAbre({ area, abierta, alTocar }: { area: Area; abierta: boolean; alTocar: () => void }) {
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '180deg' : '0deg', { duration: 300 }) }] }), [abierta]);
  return (
    <Animated.View layout={ACOMODA} style={st.area}>
      <Pressable onPress={alTocar} style={({ pressed }) => [st.areaCab, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={{ expanded: abierta }}>
        <Text style={st.areaTitulo}>{t(`perfil.baseInfo.areas.${area}.titulo`)}</Text>
        <Animated.View style={giro}>
          <Icono nombre="chevron.down" tam={14} color="rgba(239, 230, 207, 0.7)" peso="medium" />
        </Animated.View>
      </Pressable>
      {abierta && (
        <Aparece style={st.areaDentro}>
          <Text style={st.areaTexto}>{t(`perfil.baseInfo.areas.${area}.texto`)}</Text>
          <Text style={st.fuentes}>{`${t('perfil.baseInfo.fuentes')}: ${t(`perfil.baseInfo.areas.${area}.fuentes`)}`}</Text>
        </Aparece>
      )}
    </Animated.View>
  );
}

export function EnQueSeBasa({ alCerrar }: { alCerrar: () => void }) {
  const [abierta, setAbierta] = useState<Area | null>(null);
  const llega = [...lista('perfil.baseInfo.llega'), ...(CON_ASCENT ? [t('perfil.baseInfo.llegaAscent')] : [])];
  return (
    <HojaModal abierta titulo={t('perfil.base')} alCerrar={alCerrar}>
      <Parrafo>{t('perfil.baseInfo.intro')}</Parrafo>
      <EtiquetaDeGrupo>{t('perfil.baseInfo.comoTitulo')}</EtiquetaDeGrupo>
      <View style={st.flujo} accessibilityRole="image" accessibilityLabel={[...llega, ...lista('perfil.baseInfo.hace'), ...lista('perfil.baseInfo.ves')].join(', ')}>
        <Columna titulo={t('perfil.baseInfo.columnas.llega')} items={llega} />
        <Flecha />
        <Columna titulo={t('perfil.baseInfo.columnas.hace')} items={lista('perfil.baseInfo.hace')} moss />
        <Flecha />
        <Columna titulo={t('perfil.baseInfo.columnas.ves')} items={lista('perfil.baseInfo.ves')} />
      </View>
      <Puntos items={lista('perfil.baseInfo.reglas')} />
      <EtiquetaDeGrupo>{t('perfil.baseInfo.areasTitulo')}</EtiquetaDeGrupo>
      <View style={st.areas}>
        {AREAS.map((a) => <AreaQueSeAbre key={a} area={a} abierta={abierta === a} alTocar={() => setAbierta((x) => (x === a ? null : a))} />)}
      </View>
      {/* Lo de abajo se acomoda cuando un área se abre o se cierra. */}
      <Animated.View layout={ACOMODA}>
        <EtiquetaDeGrupo>{t('perfil.baseInfo.noHaceTitulo')}</EtiquetaDeGrupo>
        <Puntos items={lista('perfil.baseInfo.noHace')} />
      </Animated.View>
    </HojaModal>
  );
}

const st = StyleSheet.create({
  flujo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, marginBottom: 2 },
  columna: { flex: 1, gap: 6, justifyContent: 'center' },
  columnaTitulo: { textAlign: 'center', fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.3, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  item: {
    paddingVertical: 7, paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(239, 230, 207, 0.04)',
    textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, lineHeight: 14.5, color: colores.pergamino, overflow: 'hidden',
  },
  itemMoss: { borderColor: 'rgba(232, 196, 106, 0.4)', backgroundColor: 'rgba(232, 196, 106, 0.07)' },
  flecha: { width: 14, alignItems: 'center' },
  puntos: { marginTop: 10, gap: 6 },
  puntoFila: { flexDirection: 'row', gap: 10, paddingLeft: 2 },
  punto: { width: 4, height: 4, borderRadius: 2, marginTop: 8, backgroundColor: 'rgba(239, 230, 207, 0.7)' },
  puntoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 18.5, color: 'rgba(239, 230, 207, 0.82)' },
  areas: { gap: 6 },
  area: { borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(8, 12, 26, 0.5)', overflow: 'hidden' },
  areaCab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 12, paddingHorizontal: 14 },
  areaTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 14.5, lineHeight: 18, color: colores.pergamino },
  areaDentro: { paddingHorizontal: 14, paddingBottom: 12 },
  areaTexto: { fontFamily: letras.texto, fontSize: 13.5, lineHeight: 20, color: 'rgba(239, 230, 207, 0.78)' },
  fuentes: { marginTop: 8, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.5)' },
});
