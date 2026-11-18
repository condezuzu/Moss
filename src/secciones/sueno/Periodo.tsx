// Tu periodo de melatonina, el de la galería 50 (galeria/src/sueno.js y periodo.js; spec/sueno.md), debajo de la
// deuda y en lugar de «Acuéstate a las…»: de qué hora a qué hora, cuánto cambió desde ayer y a qué hora acostarte
// para estar dormido cuando empieza; con deuda, lo mismo y no antes. La regla es la de src/dominio/melatonina.ts,
// con tus noches y tu margen. «¿Qué es?» abre la hoja que lo explica, con la noche en un dibujo. Sin noches, el de
// la persona de ejemplo, marcado; con menos de tres en la semana, cuántas faltan.

import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { ANTES_DEL_PUNTO_MEDIO, MINIMO_DE_NOCHES, NOCHES_DEL_PERIODO, PERIODO, type PeriodoDeMelatonina } from '@/dominio/melatonina';
import type { Noche } from '@/dominio/sueno';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { HojaModal } from '../HojaModal';
import { CartaDeSueno, ChipDeEjemplo, degradado, Progreso, reloj } from './comunes';
import { Periodo } from './Dibujos';
import { DIBUJO, xDelPeriodo } from './dibujoDelPeriodo';

const FONDO = 'linear-gradient(140deg, rgba(34, 44, 110, 0.5), rgba(18, 60, 74, 0.42))';
const SUBE = 'linear-gradient(90deg, rgba(138, 219, 200, 0), rgba(138, 219, 200, 0.5))';
const TRAMO = 'linear-gradient(90deg, #8adbc8, #9fb6ff)';
const FONDO_DEL_DIBUJO = 'linear-gradient(150deg, rgba(34, 44, 110, 0.42), rgba(18, 60, 74, 0.34))';
/** Lo que se ve de la noche en la línea: desde que empieza a subir la melatonina hasta una hora después del periodo. */
const DESPUES_EN_LA_PISTA = 60;
/** Un lugar para la hora dentro de la frase, para escribirla con más peso. */
const MARCA = '';

/** «9 min antes que ayer», «7 min más tarde que ayer» o «Igual que ayer»; sin ayer, nada. */
function corrido(p: PeriodoDeMelatonina): string | null {
  if (p.corrido === null) return null;
  return p.corrido === 0 ? t('sueno.periodo.igual') : t(p.corrido < 0 ? 'sueno.periodo.antes' : 'sueno.periodo.despues', { n: Math.abs(p.corrido) });
}

/** El tramo del periodo en la línea: crece desde la izquierda al aparecer. */
function Tramo({ desde, ancho }: { desde: `${number}%`; ancho: `${number}%` }) {
  const reducido = useReducedMotion();
  const x = useSharedValue(reducido ? 1 : 0);
  useEffect(() => {
    if (!reducido) x.set(withDelay(200, withTiming(1, { duration: 700, easing: Easing.bezier(0.2, 0.7, 0.2, 1) })));
  }, [reducido, x]);
  const estilo = useAnimatedStyle(() => ({ opacity: x.get(), transform: [{ scaleX: Math.max(0.001, x.get()) }] }));
  return <Animated.View style={[st.tramo, { left: desde, width: ancho, transformOrigin: 'left' }, degradado(TRAMO), estilo]} />;
}

function QueEs({ alTocar, centrado }: { alTocar: () => void; centrado?: boolean }) {
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [centrado && st.queEsCentrado, pressed && st.apretado]} hitSlop={10} accessibilityRole="button">
      <Text style={st.queEs}>{t('sueno.periodo.queEs')}</Text>
    </Pressable>
  );
}

export function ElPeriodo({ periodo: p, noches, hoy, conNoches }: {
  /** El de esta noche (periodoDeMelatonina); null si todavía no alcanzan las noches. */
  periodo: PeriodoDeMelatonina | null;
  /** Las noches de verdad, para decir cuántas faltan. */
  noches: Noche[];
  hoy: ClaveDia;
  conNoches: boolean;
}) {
  const [hoja, setHoja] = useState(false);
  const abrir = () => setHoja(true);
  if (!p) {
    const desde = sumarDias(hoy, -NOCHES_DEL_PERIODO);
    const hay = noches.filter((n) => n.clave > desde && n.clave <= hoy && n.confianza.horario !== 'baja').length;
    return (
      <CartaDeSueno titulo={t('sueno.periodo.titulo')} estilo={[st.carta, degradado(FONDO)]}>
        <View style={st.faltanFila}>
          <Text style={st.faltan}>{plural('sueno.periodo.faltan', MINIMO_DE_NOCHES - hay)}</Text>
          <Text style={st.paraSaber}>{t('sueno.periodo.paraSaber')}</Text>
        </View>
        <Progreso hay={hay} minimo={MINIMO_DE_NOCHES} texto={t('sueno.periodo.faltanTexto', { minimo: MINIMO_DE_NOCHES })} />
      </CartaDeSueno>
    );
  }
  const cambio = corrido(p);
  const total = p.hasta + DESPUES_EN_LA_PISTA - p.inicio;
  const parte = (m: number): `${number}%` => `${Number(((m / total) * 100).toFixed(1))}%`;
  const hora = reloj(p.acostarse);
  const [antes, despues] = t(p.conDeuda ? 'sueno.periodo.conDeuda' : 'sueno.periodo.acuestate', { hora: MARCA }).split(MARCA);
  return (
    <CartaDeSueno titulo={t('sueno.periodo.titulo')} derecha={conNoches ? <QueEs alTocar={abrir} /> : <ChipDeEjemplo />} estilo={[st.carta, degradado(FONDO)]}>
      <View style={[st.cuerpo, !conNoches && st.muestra]}>
        <View style={st.horas}>
          <Text style={st.tramoDeHoras}>{`${reloj(p.desde)} – ${reloj(p.hasta)}`}</Text>
          {cambio && <Text style={st.corrido}>{cambio}</Text>}
        </View>
        {/* La noche en una línea: la melatonina sube desde su inicio y el tramo es tu periodo. */}
        <View style={st.pista} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[st.sube, { left: 0, width: parte(p.desde - p.inicio) }, degradado(SUBE)]} />
          <Tramo desde={parte(p.desde - p.inicio)} ancho={parte(p.hasta - p.desde)} />
        </View>
        <Text style={st.texto}>
          {antes}
          <Text style={st.hora}>{hora}</Text>
          {despues}
        </Text>
      </View>
      {!conNoches && <QueEs alTocar={abrir} centrado />}
      {hoja && <HojaDelPeriodo p={p} alCerrar={() => setHoja(false)} />}
    </CartaDeSueno>
  );
}

// ------------------------------------------------------------ la hoja «¿Qué es?»
/** La noche en un dibujo: la melatonina que sube desde su inicio y el tramo del periodo, con sus horas. */
function Dibujo({ p, ancho }: { p: PeriodoDeMelatonina; ancho: number }) {
  const reducido = useReducedMotion();
  const s = ancho / DIBUJO.ancho;
  const x = xDelPeriodo(p.inicio, p.hasta);
  // Lo escrito va centrado en su minuto, en una caja más ancha que cualquier texto.
  const en = (m: number, arriba: number) => ({ left: x(m) * s - CAJA / 2, top: arriba * s });
  return (
    <View style={[st.dibujo, degradado(FONDO_DEL_DIBUJO)]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: ancho, height: DIBUJO.alto * s }}>
        <Periodo ancho={ancho} inicio={p.inicio} desde={p.desde} hasta={p.hasta} animar={!reducido} />
        <Text style={[st.rotulo, st.rotuloNombre, en((p.desde + p.hasta) / 2, -3)]} maxFontSizeMultiplier={1.15}>{t('sueno.periodo.hoja.dibujo.periodo')}</Text>
        {[p.inicio, p.desde, p.hasta].map((m) => (
          <Text key={m} style={[st.rotulo, st.rotuloHora, en(m, DIBUJO.base + 8)]} maxFontSizeMultiplier={1.15}>{reloj(m)}</Text>
        ))}
        <Text style={[st.rotulo, st.rotuloChico, en(p.inicio, DIBUJO.base + 21)]} maxFontSizeMultiplier={1.15}>{t('sueno.periodo.hoja.dibujo.sube')}</Text>
      </View>
    </View>
  );
}
const CAJA = 130;

/** Qué es, cómo lo estima Moss, con qué margen y qué pasa si te acuestas antes o después. */
function HojaDelPeriodo({ p, alCerrar }: { p: PeriodoDeMelatonina; alCerrar: () => void }) {
  const { width } = useWindowDimensions();
  // El punto medio de tu sueño: del comienzo del periodo, 4 h 30 hacia adelante.
  const medio = p.desde - PERIODO.desde + ANTES_DEL_PUNTO_MEDIO;
  const partes = [
    ['queEs', t('sueno.periodo.hoja.queEsTexto')],
    ['como', t('sueno.periodo.hoja.comoTexto', { medio: reloj(medio), noches: plural('sueno.periodo.hoja.noches', p.noches) })],
    ['margen', t('sueno.periodo.hoja.margenTexto')],
    ['antes', t('sueno.periodo.hoja.antesTexto')],
    ['despues', t('sueno.periodo.hoja.despuesTexto')],
  ] as const;
  return (
    <HojaModal abierta titulo={t('sueno.periodo.titulo')} alCerrar={alCerrar}>
      {/* El ancho de la hoja, menos su margen (20 de cada lado) y el del dibujo (10 y el borde). */}
      <Dibujo p={p} ancho={width - 40 - 22} />
      {partes.map(([clave, texto]) => (
        <View key={clave} style={st.parte}>
          <Text style={st.parteTitulo} accessibilityRole="header">{t(`sueno.periodo.hoja.${clave}`)}</Text>
          <Text style={st.parteTexto}>{texto}</Text>
        </View>
      ))}
      <Text style={st.pie}>{t('sueno.periodo.hoja.pie')}</Text>
    </HojaModal>
  );
}

const st = StyleSheet.create({
  carta: { gap: 8, borderColor: 'rgba(150, 178, 240, 0.16)' },
  cuerpo: { gap: 8 },
  muestra: { opacity: 0.84 },
  apretado: { opacity: 0.6 },
  queEs: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  queEsCentrado: { alignSelf: 'center', paddingVertical: 2 },
  horas: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 10, rowGap: 6 },
  tramoDeHoras: { fontFamily: letras.numero, fontSize: 30, lineHeight: 34, letterSpacing: -0.3, color: colores.cifra, fontVariant: ['tabular-nums'] },
  corrido: { overflow: 'hidden', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, fontFamily: letras.texto, fontSize: 12, lineHeight: 14, color: '#c6d6fa', backgroundColor: 'rgba(150, 178, 240, 0.14)' },
  pista: { height: 6, marginTop: 4, marginBottom: 2, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(150, 178, 240, 0.12)' },
  sube: { position: 'absolute', top: 0, bottom: 0 },
  tramo: { position: 'absolute', top: 0, bottom: 0, borderRadius: 3 },
  texto: { fontFamily: letras.texto, fontSize: 14.5, lineHeight: 20.6, color: 'rgba(239, 230, 207, 0.9)' },
  hora: { fontFamily: letras.textoMedio, color: colores.cifra, fontVariant: ['tabular-nums'] },
  faltanFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8, rowGap: 2 },
  faltan: { fontFamily: letras.numero, fontSize: 32, letterSpacing: -0.5, color: colores.cifra },
  paraSaber: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.58)' },
  dibujo: { marginTop: 6, marginBottom: 2, paddingTop: 12, paddingHorizontal: 10, paddingBottom: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(150, 178, 240, 0.14)' },
  rotulo: { position: 'absolute', width: CAJA, textAlign: 'center' },
  rotuloNombre: { fontFamily: letras.textoMedio, fontSize: 10.5, lineHeight: 13, color: colores.cifra },
  rotuloHora: { fontFamily: letras.numero, fontSize: 10.5, lineHeight: 13, color: 'rgba(214, 226, 250, 0.86)', fontVariant: ['tabular-nums'] },
  rotuloChico: { fontFamily: letras.texto, fontSize: 9.5, lineHeight: 12, color: 'rgba(196, 212, 246, 0.66)' },
  parte: { marginTop: 16, marginHorizontal: 2, gap: 5 },
  parteTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, lineHeight: 18, color: colores.pergamino },
  parteTexto: { fontFamily: letras.textoLiviano, fontSize: 14, lineHeight: 21, color: 'rgba(239, 230, 207, 0.82)' },
  pie: { marginTop: 18, marginHorizontal: 2, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.5)' },
});
