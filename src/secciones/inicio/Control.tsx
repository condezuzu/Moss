// El control, cuando se acerca (lo pediste el 2/11/2026): debajo de la luna, desde dos días antes, cuándo es y, si
// le falta algo, qué, en una línea (spec/progreso.md, el control). Lleva a Progreso.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion } from 'react-native-reanimated';

import type { EstadoDelControl } from '@/dominio/control';
import { diaDeLaSemana } from '@/dominio/fechas';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { usePersona } from '../ganchos';
import { ACOMODA } from '../tarjetas';
import { bloques } from './comunes';

export const CONTROL_CERCA = 2;

/**
 * Lo que le falta, en una línea: «listo» solo si alcanza. Con el tramo corto ese control no mide aunque lleguen
 * los datos (como Progreso); con la pesada y la comida, todavía le falta otra pesada a una semana, para la recta.
 */
export function loQueFalta(c: EstadoDelControl): string {
  if (c.alcanza) return t('inicio.control.listo');
  if (c.tramoCorto) return t('progreso.control.textos.faltanDatos');
  return c.pesadas >= c.minimos.pesadas && c.diasConComida < c.minimos.diasConComida
    ? plural('inicio.control.faltanDias', c.minimos.diasConComida - c.diasConComida)
    : t('inicio.control.faltaPesada');
}

export function ControlCerca({ alIr }: { alIr: () => void }) {
  const p = usePersona();
  const c = p.estadoControl;
  // El de la persona de ejemplo no es tuyo: no se anuncia.
  if (p.deEjemplo || !c || c.faltan > CONTROL_CERCA) return null;
  const cuando = c.faltan === 1 ? t('progreso.manana') : t('progreso.enDias', { n: c.faltan });
  const titulo = c.faltan === 0 ? t('inicio.control.hoy') : t('inicio.control.titulo', { dia: lista('fecha.dias')[diaDeLaSemana(c.fecha)], cuando });
  const falta = loQueFalta(c);
  return (
    <Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)} exiting={FadeOut.duration(200).reduceMotion(ReduceMotion.Never)} layout={ACOMODA}>
      <Pressable
        onPress={alIr}
        style={({ pressed }) => [bloques.bloque, st.control, pressed && bloques.apretado]}
        accessibilityRole="button"
        accessibilityLabel={`${titulo}. ${falta}`}
        accessibilityHint={t('inicio.lector.lleva', { seccion: t('pestanas.progreso') })}
      >
        <Icono nombre="clock" tam={18} color={colores.oroClaro} />
        <View style={st.textos}>
          <Text style={st.titulo}>{titulo}</Text>
          <Text style={st.falta}>{falta}</Text>
        </View>
        <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" />
      </Pressable>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  // Arriba y abajo por separado: `paddingVertical` no le gana al `paddingTop` del bloque.
  control: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingTop: 12, paddingBottom: 12, paddingHorizontal: 14 },
  textos: { flex: 1, gap: 3, minWidth: 0 },
  titulo: { fontFamily: letras.textoMedio, fontSize: 14.5, lineHeight: 17.5, color: colores.pergamino },
  falta: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.6)' },
});
