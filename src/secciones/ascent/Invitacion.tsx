// La invitación de Inicio (spec/ascent.md, «Que se encuentre»; galeria/src/ascent.js): solo con Ascent en
// este iPhone y sin vincular. Sin Ascent no se dice nada. «Vincular» abre la hoja, sin salir de Inicio: dos
// toques. «Ahora no» queda guardado en este iPhone y no vuelve a aparecer; la señal de Hábitos y Perfil
// siguen ahí.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAscent } from '@/almacen/ascent';
import { invitarEnInicio } from '@/dominio/senalDeAscent';
import { CON_ASCENT } from '@/lib/banderas';
import { t } from '@/textos';
import { letras } from '@/tema';
import { ACOMODA } from '../tarjetas';
import { C } from './colores';
import { HojaDeVincular } from './HojaDeVincular';
import { MarcaChica } from './MarcaChica';
import { useHayAscent } from './useHayAscent';

const AHORA_NO = 'moss:invitarAVincularAhoraNo';

export function InvitacionDeAscent() {
  const { listo, conCuenta, vinculo } = useAscent();
  const instalada = useHayAscent();
  // Cuándo se tocó «Ahora no» (vuelve a las 4 horas: invitarEnInicio) y la hora con que se mira: al abrir Inicio y al
  // volver a Moss. Lo de antes («1») cuenta como hace mucho.
  const [descartada, setDescartada] = useState<number | false | null>(null);
  const [ahora, setAhora] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem(AHORA_NO)
      .then((x) => { setAhora(Date.now()); setDescartada(x ? Number(x) || 1 : false); })
      .catch(() => { setAhora(Date.now()); setDescartada(false); });
    const sub = AppState.addEventListener('change', (estado) => { if (estado === 'active') setAhora(Date.now()); });
    return () => sub.remove();
  }, []);
  const [hoja, setHoja] = useState(false);
  const [vez, setVez] = useState(0);
  const invita = invitarEnInicio({ conAscent: CON_ASCENT, listo, conCuenta, vinculada: vinculo.vinculada, instalada, descartada, ahora });
  return (
    <>
      {invita && (
        <Animated.View entering={FadeIn.duration(320)} exiting={FadeOut.duration(200)} layout={ACOMODA} style={st.carta}>
          <MarcaChica tam={40} />
          <View style={st.textos}>
            <Text style={st.titulo}>{t('ascent.invitacion.titulo')}</Text>
            <Text style={st.texto}>{t('ascent.invitacion.texto')}</Text>
            <View style={st.acciones}>
              <Pressable
                onPress={() => {
                  setVez((x) => x + 1);
                  setHoja(true);
                }}
                style={({ pressed }) => [st.si, pressed && st.siApretado]}
                accessibilityRole="button"
              >
                <Text style={st.siTexto}>{t('ascent.invitacion.vincular')}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const cuando = Date.now();
                  setDescartada(cuando);
                  setAhora(cuando);
                  AsyncStorage.setItem(AHORA_NO, String(cuando)).catch(() => {});
                }}
                style={st.no}
                accessibilityRole="button"
                hitSlop={6}
              >
                <Text style={st.noTexto}>{t('ascent.invitacion.ahoraNo')}</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      )}
      {/* Fuera de la carta: al vincular, la carta se va y la hoja baja a su tiempo. */}
      <HojaDeVincular key={vez} abierta={hoja} alCerrar={() => setHoja(false)} />
    </>
  );
}

const st = StyleSheet.create({
  carta: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 12, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 12, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(138, 147, 168, 0.2)', backgroundColor: 'rgba(8, 12, 26, 0.72)',
  },
  textos: { flex: 1, minWidth: 0 },
  titulo: { fontFamily: letras.texto, fontSize: 14.5, lineHeight: 18, color: C.tinta },
  texto: { marginTop: 4, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(232, 236, 246, 0.62)' },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, marginLeft: -1 },
  si: { height: 32, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232, 236, 246, 0.42)' },
  siApretado: { backgroundColor: 'rgba(232, 236, 246, 0.08)' },
  siTexto: { fontFamily: letras.texto, fontSize: 13, color: C.tinta },
  no: { height: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  noTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(232, 236, 246, 0.62)' },
});
