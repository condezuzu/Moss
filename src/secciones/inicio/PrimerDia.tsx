// Inicio el primer día, recién instalada y sin nada anotado (la maqueta del 29/10/2026; galeria/src/inicio.js): cada
// bloque dice qué hacer y con qué se va a llenar, en vez de ceros y rayas. La meta de hoy con la luna nueva, el camino
// a tu peso meta con la fecha de tu plan y el cielo de hoy con sus estrellas esperando.

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { useCieloDeHoy } from '@/cielo/dia';
import { pesoCorporalEn } from '@/dominio/cantidades';
import { edadDe, objetivoPermitido } from '@/dominio/metas';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Boton, COLOR_DE_MACRO, MACROS } from '../comida/comunes';
import { cifraDePeso, fechaDiaMes, metaDelDia, numero, sistemaDe, useEstado } from '../comida/datos';
import { abrirRegistro } from '../comida/registro';
import { usePersona } from '../ganchos';
import { plazoDelPlan } from '../persona';
import { MiniCielo } from '../graficos/Graficos';
import { Camino } from '../kcal/Figuras';
import { degradado } from '../sueno/comunes';
import { bloques, Cabeza, justo } from './comunes';

type Ir = (a: 'progreso' | 'habitos') => void;

/** Lo que entra con un fundido, uno después de otro. */
const entra = (i: number) => FadeIn.duration(500).delay(250 + i * 100).reduceMotion(ReduceMotion.Never);

/** Lo que respira o titila despacio, salvo con Reducir movimiento. */
function useLatido(ms: number) {
  const v = useSharedValue(0);
  const reducido = useReducedMotion();
  useEffect(() => {
    if (!reducido) v.set(withRepeat(withTiming(1, { duration: ms / 2, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [ms, reducido, v]);
  return v;
}

// ------------------------------------------------------------ la meta de hoy
function LunaNueva() {
  const v = useLatido(4800);
  const brillo = useAnimatedStyle(() => ({ opacity: v.get() }));
  return (
    <View style={st.luna}>
      <View style={st.lunaAro} />
      <View style={[st.lunaDisco, st.lunaLuz]} />
      <Animated.View style={[st.lunaDisco, st.lunaLuzFuerte, brillo]} />
    </View>
  );
}

function Calorias() {
  const e = useEstado();
  const meta = metaDelDia(e, e.hoy);
  if (!meta) return null;
  return (
    <View style={[bloques.bloque, st.calorias]}>
      <View style={st.arriba}>
        <LunaNueva />
        {e.numeros && (
          <View style={st.cifra}>
            <Text style={st.etiqueta}>{t('inicio.primerDia.etiqueta')}</Text>
            <Text style={st.numero} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.3}>{numero(meta.kcal)}</Text>
            <Text style={st.de}>{t('inicio.primerDia.kcalHoy')}</Text>
          </View>
        )}
      </View>
      <View style={st.chips}>
        {MACROS.map((m, i) => (
          <Animated.View key={m} entering={entra(i)} style={st.chip}>
            <View style={[st.punto, { backgroundColor: COLOR_DE_MACRO[m], boxShadow: `0 0 6px ${COLOR_DE_MACRO[m]}` }]} />
            {e.numeros && <Text style={st.chipCifra}>{t('inicio.gramos', { n: numero(meta[m]) })}</Text>}
            <Text style={st.chipTexto}>{t(`comida.${m}`).toLowerCase()}</Text>
          </Animated.View>
        ))}
      </View>
      <Text style={bloques.texto}>{t('inicio.primerDia.caloriasTexto')}</Text>
      <View style={bloques.acciones}>
        <Boton tipo="principal" icono="plus" texto={t('inicio.primerDia.anotar')} alTocar={() => abrirRegistro()} />
        <Boton icono="mic" texto={t('inicio.primerDia.decir')} alTocar={() => abrirRegistro({ panel: 'decir' })} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------ el camino
function TuCamino({ ancho, alIr }: { ancho: number; alIr: Ir }) {
  const e = useEstado();
  const p = usePersona();
  const sistema = sistemaDe(e);
  const desde = p.pesoHoy ?? e.pesos[e.pesos.length - 1]?.kg ?? null;
  const metaKg = e.perfil?.pesoMeta ?? null;
  if (!e.perfil || desde === null) return null;
  const kg = (x: number) => cifraDePeso(x, sistema).cifra;
  const unidad = pesoCorporalEn(1, sistema).unidad;
  // Sin déficit, bajar queda en mantener (objetivoPermitido): sin camino.
  const conMeta = metaKg !== null && objetivoPermitido(e.perfil) !== 'mantener';
  const plazo = conMeta
    ? plazoDelPlan(e, {
      hoy: e.hoy, pesoKg: desde, pesoMeta: metaKg, sexo: e.perfil.sexo, edad: edadDe(e.perfil, e.hoy), gasto: p.gasto ?? metaDelDia(e, e.hoy)?.kcal ?? 2000,
      entrenaFuerza: e.entreno ? e.entreno.tipo !== 'resistencia' : null,
    })
    : null;
  return (
    <View style={bloques.bloque}>
      <Cabeza titulo={t('inicio.primerDia.camino')} />
      <Text style={bloques.cifra}>
        {conMeta ? `${kg(desde)} → ${kg(metaKg)} ${unidad}` : `${kg(desde)} ${unidad}`}
      </Text>
      {plazo && (
        <>
          <View style={st.camino}>
            <Camino ancho={ancho} alto={(64 * ancho) / 300} desde={desde} meta={metaKg!} />
          </View>
          <Text style={bloques.texto}>{t('inicio.primerDia.caminoTexto', { fecha: fechaDiaMes(plazo.fecha) })}</Text>
        </>
      )}
      <View style={bloques.acciones}>
        <Boton icono="scalemass" texto={t('inicio.primerDia.pesarme')} alTocar={() => alIr('progreso')} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------ el cielo
function CieloQueEspera({ ancho, alIr }: { ancho: number; alIr: Ir }) {
  const dia = useCieloDeHoy();
  const v = useLatido(3200);
  // Las estrellas esperan: titilan despacio.
  const titila = useAnimatedStyle(() => ({ opacity: 1 - 0.28 * v.get() }));
  return (
    <View style={[bloques.bloque, bloques.bloqueCielo]}>
      <Cabeza titulo={t('inicio.bloques.cielo')} />
      {dia.constelacion ? (
        <Animated.View style={titila}>
          <MiniCielo constelacion={dia.constelacion} encendidas={dia.habitos.map(() => false)} ancho={ancho} alto={118} />
        </Animated.View>
      ) : null}
      <Text style={bloques.texto}>{t('inicio.primerDia.cieloTexto')}</Text>
      <View style={bloques.acciones}>
        <Boton icono="star" texto={t('inicio.primerDia.habitos')} alTocar={() => alIr('habitos')} />
      </View>
    </View>
  );
}

export function PrimerDia({ ancho, alIr }: { ancho: number; alIr: Ir }) {
  return (
    <>
      <Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)}><Calorias /></Animated.View>
      <Animated.View entering={FadeIn.duration(320).delay(80).reduceMotion(ReduceMotion.Never)}><TuCamino ancho={ancho} alIr={alIr} /></Animated.View>
      <Animated.View entering={FadeIn.duration(320).delay(160).reduceMotion(ReduceMotion.Never)}><CieloQueEspera ancho={ancho} alIr={alIr} /></Animated.View>
    </>
  );
}

const st = StyleSheet.create({
  calorias: { paddingTop: 12 },
  arriba: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  luna: { width: 74, height: 74, margin: 2, marginLeft: -2, marginRight: 4 },
  lunaAro: { position: 'absolute', top: -9, left: -9, right: -9, bottom: -9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(246, 227, 166, 0.12)' },
  // La cara de la luna nueva, con algo de azul hacia donde le da la luz (.in-luna-nueva).
  lunaDisco: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 37, backgroundColor: '#0c1124', ...degradado('radial-gradient(circle at 62% 38%, rgba(30, 40, 72, 0.9), rgba(8, 12, 26, 0.95) 70%)') },
  lunaLuz: { boxShadow: 'inset -3px 2px 0 rgba(246, 227, 166, 0.55), 0 0 22px rgba(246, 227, 166, 0.16)' },
  lunaLuzFuerte: { boxShadow: 'inset -4px 2px 0 rgba(246, 227, 166, 0.75), 0 0 30px rgba(246, 227, 166, 0.26)' },
  cifra: { flex: 1, gap: 4, minWidth: 0 },
  etiqueta: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)', ...justo('texto', 10) },
  numero: { fontFamily: letras.numeroLiviano, fontSize: 54, letterSpacing: -1.35, color: colores.cifra, fontVariant: ['tabular-nums'], ...justo('numero', 54, 51.3) },
  de: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)', ...justo('texto', 12.5, 15) },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  punto: { width: 6, height: 6, borderRadius: 3 },
  chipCifra: { fontFamily: letras.numeroMedio, fontSize: 12.5, color: colores.pergamino, ...justo('numero', 12.5) },
  chipTexto: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.7)', ...justo('texto', 12) },
  camino: { marginTop: 8 },
});
