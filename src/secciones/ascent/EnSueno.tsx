// Con Ascent vinculada, la recuperación de hoy también vive arriba en Sueño (galeria/src/sueno.js):
// cruza justo el sueño con el entrenamiento. Tocarla lleva a la sección de Ascent. Debajo, la línea
// del rendimiento esperado. Sin vínculo o sin la noche de anoche, no está.

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAscent } from '@/almacen/ascent';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { metaDelDia, useEstado } from '../comida/datos';
import { Icono } from '../comida/comunes';
import { usePersona, useSueno } from '../ganchos';
import { Aparece, Carta } from '../tarjetas';
import { abrirAscent } from './abrir';
import { calcularVista } from './calculos';
import { C } from './colores';

export function RecuperacionEnSueno() {
  const e = useEstado();
  const d = useAscent();
  const sueno = useSueno();
  const persona = usePersona();
  const vinculada = d.vinculo.vinculada;
  const vista = useMemo(() => (vinculada ? calcularVista({ e, d, sueno, persona, metaDe: (dia) => metaDelDia(e, dia), soloSueno: true }) : null), [vinculada, e, d, sueno, persona]);
  const r = vista?.recuperacion;
  if (!r) return null;
  return (
    <Aparece>
      <Carta titulo={t('ascent.recuperacion.titulo')} derecha={<Text style={st.conAscent}>{t('ascent.conAscent')}</Text>}>
        <Pressable onPress={abrirAscent} style={({ pressed }) => [st.fila, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <Text style={st.numero}>{r.total}</Text>
          <Text style={st.conviene}>{t(`ascent.recuperacion.conviene.${r.conviene}`)}</Text>
          <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
        </Pressable>
        {vista.rendimiento && (
          <Text style={st.nota}>{t('ascent.rendimiento.enSueno', { categoria: t(`ascent.rendimiento.categorias.${vista.rendimiento.r.categoria.max}`) })}</Text>
        )}
      </Carta>
    </Aparece>
  );
}

const st = StyleSheet.create({
  conAscent: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: C.sub },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  numero: { fontFamily: letras.numeroLiviano, fontSize: 34, color: colores.cifra, fontVariant: ['tabular-nums'] },
  conviene: { flex: 1, fontFamily: letras.texto, fontSize: 14, lineHeight: 18, color: 'rgba(239, 230, 207, 0.78)' },
  nota: { marginTop: 6, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
});
