// «Lo que hay que hacer hoy», la de la galería 50 (galeria/src/periodo.js, listaDeHoy): arriba de «Para hoy», lo
// que anotaste anoche en Sueño (src/dominio/pendientes.ts), para ir tachando. Tocar uno lo tacha; tocarlo otra vez
// lo deja como estaba. Sin pendientes para hoy, o con el aviso de anotarlos apagado, no está. Sin «Para hoy» a la
// vista (el primer día, o sacado en Personalizar), va sola: el aviso de la mañana lleva a Inicio a tacharla.

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, interpolateColor, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { pendientesPara, type Pendiente } from '@/dominio/pendientes';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { useEstado } from '../comida/datos';
import { conPendientes } from '../sueno/Pendientes';
import { ACOMODA } from '../tarjetas';
import { bloques, Cabeza } from './comunes';

/** Lo que hay que hacer hoy: con el aviso de anotar lo pendiente activado, lo anotado para hoy. */
export const pendientesDeHoy = (e: Pick<Estado, 'avisos' | 'pendientes' | 'hoy'>): Pendiente[] => (conPendientes(e) ? pendientesPara(e.pendientes, e.hoy) : []);

/** El círculo salta un poco al llenarse, como en la galería. */
const SALTA = Easing.bezier(0.3, 1.6, 0.5, 1);

function Item({ p }: { p: Pendiente }) {
  const reducido = useReducedMotion();
  const x = useSharedValue(p.hecho ? 1 : 0);
  const escala = useSharedValue(p.hecho ? 1.08 : 1);
  useEffect(() => {
    x.set(withTiming(p.hecho ? 1 : 0, { duration: reducido ? 0 : 300 }));
    escala.set(withTiming(p.hecho ? 1.08 : 1, { duration: reducido ? 0 : 250, easing: SALTA }));
  }, [p.hecho, reducido, x, escala]);
  // Dónde quedó cada renglón del texto: la raya que lo tacha crece de izquierda a derecha sobre cada uno. En la web
  // no se sabe, y se tacha con el subrayado de siempre.
  const [renglones, setRenglones] = useState<{ x: number; y: number; width: number; height: number }[]>([]);
  const circulo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(x.get(), [0, 1], ['rgba(166, 191, 148, 0)', colores.salvia]),
    borderColor: interpolateColor(x.get(), [0, 1], ['rgba(239, 230, 207, 0.4)', 'rgba(239, 230, 207, 0)']),
    transform: [{ scale: escala.get() }],
  }));
  const tilde = useAnimatedStyle(() => ({ opacity: x.get(), transform: [{ scale: 0.6 + 0.4 * x.get() }] }));
  const texto = useAnimatedStyle(() => ({ color: interpolateColor(x.get(), [0, 1], ['rgba(239, 230, 207, 0.9)', 'rgba(239, 230, 207, 0.45)']) }));
  const raya = useAnimatedStyle(() => ({ opacity: x.get() > 0 ? 1 : 0, transform: [{ scaleX: Math.max(0.001, x.get()) }] }));
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        elAlmacen().marcarPendiente(p.id, !p.hecho);
      }}
      style={st.item}
      hitSlop={{ top: 3, bottom: 3 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: p.hecho }}
      accessibilityLabel={p.texto}
    >
      <Animated.View style={[st.circulo, circulo]}>
        <Animated.View style={tilde}><Icono nombre="checkmark" tam={11} peso="bold" color="#14200f" /></Animated.View>
      </Animated.View>
      <View style={st.textos}>
        <Animated.Text
          style={[st.texto, texto, p.hecho && !renglones.length && st.tachado]}
          onTextLayout={(ev) => setRenglones(ev.nativeEvent.lines.map(({ x: rx, y, width, height }) => ({ x: rx, y, width, height })))}
        >
          {p.texto}
        </Animated.Text>
        {renglones.map((r, i) => (
          <Animated.View key={i} pointerEvents="none" style={[st.raya, { left: r.x, top: r.y + r.height * 0.52, width: r.width, transformOrigin: 'left' }, raya]} />
        ))}
      </View>
    </Pressable>
  );
}

/** `sola`: sin los consejos debajo, no lleva la raya que la separa de ellos. */
export function LoQueHayQueHacer({ lista, sola }: { lista: Pendiente[]; sola?: boolean }) {
  return (
    <Animated.View
      entering={FadeIn.duration(400).reduceMotion(ReduceMotion.Never)}
      exiting={FadeOut.duration(200).reduceMotion(ReduceMotion.Never)}
      layout={ACOMODA}
      style={[st.caja, !sola && st.conConsejos]}
    >
      <Text style={st.titulo} accessibilityRole="header">{t('inicio.pendientes.titulo')}</Text>
      {lista.map((p) => <Item key={p.id} p={p} />)}
    </Animated.View>
  );
}

/** La lista en su propio bloque, cuando «Para hoy» no está a la vista. */
export function PendientesSolos() {
  const lista = pendientesDeHoy(useEstado());
  if (!lista.length) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)}
      exiting={FadeOut.duration(200).reduceMotion(ReduceMotion.Never)}
      layout={ACOMODA}
      style={bloques.bloque}
    >
      <Cabeza titulo={t('inicio.bloques.consejos')} />
      <LoQueHayQueHacer lista={lista} sola />
    </Animated.View>
  );
}

const st = StyleSheet.create({
  caja: { gap: 2 },
  conConsejos: { paddingBottom: 8, marginBottom: 4, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  titulo: { marginBottom: 4, fontFamily: letras.textoMedio, fontSize: 14, lineHeight: 18.2, color: colores.pergamino },
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 7 },
  circulo: { width: 20, height: 20, marginHorizontal: 1, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  textos: { flex: 1, alignItems: 'flex-start' },
  texto: { fontFamily: letras.textoLiviano, fontSize: 14.5, lineHeight: 19.6 },
  tachado: { textDecorationLine: 'line-through' },
  raya: { position: 'absolute', height: 1, backgroundColor: 'rgba(239, 230, 207, 0.45)' },
});
