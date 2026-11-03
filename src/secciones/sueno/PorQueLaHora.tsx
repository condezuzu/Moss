// «Cómo llegó Moss a esta hora», la de la galería (galeria/src/sueno.js): abajo de «¿Dormiste de… a…?»,
// la noche en una línea y cada señal con su hora y cuánto pesó (`pistas` de estimarNoche). Si conectaste
// el cargador y seguiste usando el teléfono, aparece tachado: no cuenta.

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import type { ClaveDia } from '@/dominio/fechas';
import type { Estimacion, Pista } from '@/dominio/sinReloj';
import { useComoLlego } from '@/salud/nocheSinReloj';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { horaDelDia } from '../comida/datos';
import { Aparece } from '../tarjetas';

/** Una hora del sueño: los minutos se cuentan desde las 18 del día anterior. */
const reloj = (minutos: number) => horaDelDia(minutos + 18 * 60);

function nombreDe(p: Pista): string {
  if (p.que !== 'ultimaActividad' && p.que !== 'primeraActividad') return t(`sueno.manana.porque.pistas.${p.que}`);
  const tipo = p.tipos?.find((x) => x !== 'atajo') ?? p.tipos?.[0] ?? 'movimiento';
  return t(`sueno.manana.porque.pistas.${p.que}.${tipo}`);
}

/** La noche en una línea: lo dormido, con una marca por cada señal. */
function LineaDeLaNoche({ e }: { e: Estimacion }) {
  const todas = [...e.pistas.dormirse, ...e.pistas.despertar];
  const desde = Math.min(e.dormirse, ...todas.map((p) => p.en)) - 15;
  const hasta = Math.max(e.despertar, ...todas.map((p) => p.en)) + 15;
  const en = (m: number): `${number}%` => `${((m - desde) / (hasta - desde)) * 100}%`;
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={st.linea}>
        <View style={st.base} />
        <View style={[st.dormido, { left: en(e.dormirse), right: `${((hasta - e.despertar) / (hasta - desde)) * 100}%` }]} />
        {todas.map((p) => <View key={`${p.que}-${p.en}`} style={[st.marca, { left: en(p.en) }, p.noCuenta && st.marcaNoCuenta]} />)}
      </View>
      <View style={st.horas}>
        <Text style={st.hora}>{reloj(desde + 15)}</Text>
        <Text style={st.hora}>{reloj(hasta - 15)}</Text>
      </View>
    </View>
  );
}

function Borde({ titulo, hora, pistas }: { titulo: string; hora: number; pistas: Pista[] }) {
  const varias = pistas.filter((p) => p.peso > 0).length > 1;
  return (
    <>
      <View style={st.cab}>
        <Text style={st.cabTitulo}>{titulo}</Text>
        <Text style={st.cabHora}>{reloj(hora)}</Text>
      </View>
      {pistas.map((p) => (
        <View key={`${p.que}-${p.en}`} style={st.pista}>
          <View style={st.pistaFila}>
            <Text style={[st.pistaNombre, p.noCuenta && st.pistaNoCuenta]}>{nombreDe(p)}</Text>
            <Text style={st.pistaHora}>{reloj(p.en)}</Text>
          </View>
          {p.noCuenta ? <Text style={st.pistaNota}>{t('sueno.manana.porque.noCuenta')}</Text>
            : !p.peso ? <Text style={st.pistaNota}>{t('sueno.manana.porque.confirma')}</Text>
            : varias ? <View style={st.peso}><View style={[st.pesoLleno, { width: `${p.peso * 100}%` }]} /></View>
            : null}
        </View>
      ))}
    </>
  );
}

export function PorQueLaHora({ clave }: { clave: ClaveDia }) {
  const comoLlego = useComoLlego(clave);
  const [abierto, setAbierto] = useState(false);
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierto ? '180deg' : '0deg', { duration: 260 }) }] }), [abierto]);
  if (!comoLlego) return null;
  const { estimacion: e, personal } = comoLlego;
  // Llega un rato después de abrir (estimarAnoche no se guarda): entra con su fundido.
  return (
    <Aparece style={st.caja}>
      <Pressable onPress={() => setAbierto((x) => !x)} style={({ pressed }) => [st.abrir, pressed && st.apretado]} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Text style={st.abrirTexto}>{t('sueno.manana.porque.abrir')}</Text>
        <Animated.View style={giro}>
          <Icono nombre="chevron.down" tam={12} color="rgba(239, 230, 207, 0.55)" peso="semibold" />
        </Animated.View>
      </Pressable>
      {abierto && (
        <Aparece style={st.dentro}>
          <LineaDeLaNoche e={e} />
          <Borde titulo={t('sueno.manana.porque.dormirse')} hora={e.dormirse} pistas={e.pistas.dormirse} />
          <Borde titulo={t('sueno.manana.porque.despertar')} hora={e.despertar} pistas={e.pistas.despertar} />
          <Text style={st.nota}>{t(personal.elegida ? 'sueno.manana.porque.tardasElegida' : personal.noches > 0 ? 'sueno.manana.porque.tardas' : 'sueno.manana.porque.tardasFabrica', { n: personal.latencia })}</Text>
          <Text style={st.nota}>{t('sueno.manana.porque.nota')}</Text>
        </Aparece>
      )}
    </Aparece>
  );
}

const st = StyleSheet.create({
  caja: { marginTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  abrir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, minHeight: 40 },
  apretado: { opacity: 0.7 },
  abrirTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.72)' },
  dentro: { gap: 8, paddingTop: 2, paddingBottom: 4 },
  linea: { height: 14, marginHorizontal: 4, justifyContent: 'center' },
  base: { position: 'absolute', left: 0, right: 0, height: 2, borderRadius: 1, backgroundColor: 'rgba(239, 230, 207, 0.14)' },
  dormido: { position: 'absolute', height: 4, borderRadius: 2, backgroundColor: 'rgba(232, 196, 106, 0.55)' },
  marca: { position: 'absolute', width: 7, height: 7, marginLeft: -3.5, borderRadius: 3.5, backgroundColor: colores.oroClaro, borderWidth: 1, borderColor: '#0f1631' },
  marcaNoCuenta: { backgroundColor: '#0f1631', borderColor: 'rgba(239, 230, 207, 0.5)' },
  horas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginHorizontal: 4 },
  hora: { fontFamily: letras.numero, fontSize: 11, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  cab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 8 },
  cabTitulo: { fontFamily: letras.textoMedio, fontSize: 13.5, color: colores.pergamino },
  cabHora: { fontFamily: letras.numeroMedio, fontSize: 14, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  pista: { gap: 4 },
  pistaFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  pistaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.78)' },
  pistaNoCuenta: { textDecorationLine: 'line-through', color: 'rgba(239, 230, 207, 0.48)' },
  pistaHora: { fontFamily: letras.numero, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.7)', fontVariant: ['tabular-nums'] },
  pistaNota: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: 'rgba(239, 230, 207, 0.48)' },
  peso: { height: 2, borderRadius: 1, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.1)' },
  pesoLleno: { height: 2, backgroundColor: colores.oro },
  nota: { marginTop: 4, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
});
