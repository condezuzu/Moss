// Perfil › Aparatos, el de la galería (galeria/src/perfil.js; spec/aparatos.md): los que escriben tu
// sueño en Salud, con su precisión; de cuál sale la noche (la automática toma la más precisa de cada
// noche); y qué llega de cada marca, que se despliega. Todo llega desde Salud: en la v1 no hay
// conexiones directas.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { sumarDias } from '@/dominio/fechas';
import { marcaDe, NIVEL_DE_LA_MARCA, type Fuente } from '@/dominio/sueno';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { useEstado } from '../comida/datos';
import { Opcion } from '../entrada/piezas';
import { HojaModal } from '../HojaModal';
import { Aparece, EtiquetaDeGrupo, Parrafo } from '../tarjetas';

/** Las marcas de la lista, en el orden en que miden mejor el sueño (spec/aparatos.md, «El orden»). */
const MARCAS = ['appleWatch', 'oura', 'google', 'whoop', 'polar', 'garmin', 'withings', 'ringconn', 'ultrahuman', 'amazfit', 'coros', 'suunto', 'eightSleep', 'samsung'] as const;
type ConTexto = (typeof MARCAS)[number] | 'iphone';

/** El nombre de la marca si se reconoce (Xiaomi y Huawei van con Amazfit en la lista); si no, el de la app. */
const nombreDe = (f: Fuente) => {
  const m = marcaDe(f);
  return (MARCAS as readonly string[]).includes(m) ? t(`perfil.aparatos.marcas.${m as (typeof MARCAS)[number]}.nombre`) : f.nombre;
};

/** El aparato de las noches para la fila de Perfil: el que mejor mide entre los que escribieron sueño; sin ninguno, el iPhone. */
export function aparatoPrincipal(aparatos: { fuente: Fuente; noches: number }[]): string {
  const con = aparatos.filter((a) => a.noches > 0).sort((a, b) => NIVEL_DE_LA_MARCA[marcaDe(b.fuente)] - NIVEL_DE_LA_MARCA[marcaDe(a.fuente)]);
  return con.length ? nombreDe(con[0].fuente) : t('perfil.aparatos.soloIphone');
}

/** La precisión, de 1 (estimada con el teléfono) a 5 (conexión directa, después de la v1), en puntos. */
function Puntos({ nivel }: { nivel: number }) {
  return (
    <View style={st.puntos} accessibilityLabel={`${nivel} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <View key={i} style={[st.punto, i <= nivel && st.puntoLleno]} />)}
    </View>
  );
}

/** Una marca que se despliega con lo que llega de ella; la flecha gira. */
function DeCadaUno({ marca, abierta, alTocar, primera }: { marca: ConTexto; abierta: boolean; alTocar: () => void; primera: boolean }) {
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '90deg' : '0deg', { duration: 260 }) }] }), [abierta]);
  return (
    <View style={!primera && st.separada}>
      <Pressable onPress={alTocar} style={({ pressed }) => [st.fila, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityState={{ expanded: abierta }}>
        <Text style={st.filaTitulo}>{t(`perfil.aparatos.marcas.${marca}.nombre`)}</Text>
        <Animated.View style={giro}>
          <Icono nombre="chevron.right" tam={12} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
        </Animated.View>
      </Pressable>
      {abierta && (
        <Aparece>
          <Text style={st.marcaTexto}>{t(`perfil.aparatos.marcas.${marca}.texto`)}</Text>
        </Aparece>
      )}
    </View>
  );
}

export function Aparatos({ alCerrar }: { alCerrar: () => void }) {
  const e = useEstado();
  const [abierta, setAbierta] = useState<ConTexto | null>(null);
  const aparatos = (e.salud?.aparatos ?? []).filter((a) => a.noches > 0)
    .sort((a, b) => NIVEL_DE_LA_MARCA[marcaDe(b.fuente)] - NIVEL_DE_LA_MARCA[marcaDe(a.fuente)]);
  const desde = sumarDias(e.hoy, -30);
  const deMoss = [...e.noches.values()].filter((n) => n.hora && !n.borrado && n.fecha > desde).length;
  const elegir = (id: string | null) => {
    elAlmacen().ponerFuenteDelSueno(id);
    // Las noches se rearman con la fuente elegida.
    actualizarSalud().catch(() => {});
  };
  const lista: ConTexto[] = [...(aparatos.length ? [] : ['iphone' as const]), ...MARCAS];
  return (
    <HojaModal abierta titulo={t('perfil.aparatos.titulo')} alCerrar={alCerrar}>
      <Parrafo>{t('perfil.aparatos.arriba')}</Parrafo>
      <EtiquetaDeGrupo>{t('perfil.aparatos.tuyos')}</EtiquetaDeGrupo>
      <View style={st.lista}>
        {aparatos.length ? aparatos.map((a, i) => (
          <View key={a.fuente.id} style={[st.tuyo, i > 0 && st.separada]}>
            <View style={{ flex: 1 }}>
              <Text style={st.filaTitulo}>{nombreDe(a.fuente)}</Text>
              <Text style={st.detalle}>{plural('perfil.aparatos.noches', a.noches, { n: a.noches })}</Text>
            </View>
            <Puntos nivel={a.fuente.tipo === 'reloj' ? 4 : a.conEtapas && a.fuente.tipo === 'otra' ? 3 : 2} />
          </View>
        )) : (
          <View style={st.tuyo}>
            <View style={{ flex: 1 }}>
              <Text style={st.filaTitulo}>{t('perfil.aparatos.marcas.iphone.nombre')}</Text>
              <Text style={st.detalle}>{plural('perfil.aparatos.noches', deMoss, { n: deMoss })}</Text>
            </View>
            <Puntos nivel={1} />
          </View>
        )}
      </View>
      {aparatos.length > 1 && (
        <Aparece>
          <EtiquetaDeGrupo>{t('perfil.aparatos.laNoche')}</EtiquetaDeGrupo>
          <View style={{ gap: 8 }}>
            <Opcion titulo={t('perfil.aparatos.automatica')} detalle={t('perfil.aparatos.automaticaTexto')} elegida={!e.fuenteDelSueno} alTocar={() => elegir(null)} />
            {aparatos.map((a) => <Opcion key={a.fuente.id} titulo={nombreDe(a.fuente)} elegida={e.fuenteDelSueno === a.fuente.id} alTocar={() => elegir(a.fuente.id)} />)}
          </View>
        </Aparece>
      )}
      <EtiquetaDeGrupo>{t('perfil.aparatos.cadaUno')}</EtiquetaDeGrupo>
      <View style={st.lista}>
        {lista.map((m, i) => (
          <DeCadaUno key={m} marca={m} abierta={abierta === m} primera={i === 0} alTocar={() => setAbierta((x) => (x === m ? null : m))} />
        ))}
      </View>
      <Parrafo chico>{t('perfil.aparatos.varios')}</Parrafo>
    </HojaModal>
  );
}

const st = StyleSheet.create({
  lista: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.72)' },
  separada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  tuyo: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, paddingHorizontal: 16 },
  filaTitulo: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  detalle: { marginTop: 3, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
  marcaTexto: { paddingHorizontal: 16, paddingBottom: 14, fontFamily: letras.texto, fontSize: 13, lineHeight: 19, color: 'rgba(239, 230, 207, 0.62)' },
  puntos: { flexDirection: 'row', gap: 5 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  puntoLleno: { backgroundColor: '#8fd3e8', shadowColor: '#8fd3e8', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
});
