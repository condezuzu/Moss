// La pregunta de cada mañana, la de la galería (galeria/src/sueno.js; spec/sueno.md): sin reloj y si
// Moss no está segura, primero la hora («¿Dormiste de 00:30 a 08:10?», con «Sí» y «Cambiar», y una
// mañana por semana sin proponer); después cómo dormiste, con cinco caras. Lo contestado se va con un
// fundido y la tarjeta se achica; contestadas las caras, queda una línea para cambiarlas.

import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import type { ClaveDia } from '@/dominio/fechas';
import { habitualDe, instanteDe, quePreguntar } from '@/dominio/sinReloj';
import type { Cara, Noche, NochePropia, OrigenDeNoche } from '@/dominio/sueno';
import { DESDE_LAS } from '@/salud/nocheSinReloj';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { horaDelDia } from '../comida/datos';
import { ACOMODA, Aparece } from '../tarjetas';
import { Caras } from './Caras';

/** Una hora del sueño: los minutos se cuentan desde las 18 del día anterior. */
const reloj = (minutos: number) => horaDelDia(minutos + 18 * 60);
const CARAS = [1, 2, 3, 4, 5] as const;
const TENUE = 'rgba(239, 230, 207, 0.62)';

/** «Ahora no» la esconde por hoy: queda mientras la app está abierta, sin recordatorios. */
const ocultas = new Set<ClaveDia>();

/** Guarda la hora de una noche de Moss (en minutos desde las 18), con lo que había estimado el teléfono. */
export function ponerHora(clave: ClaveDia, dormirse: number, despertar: number, origen: OrigenDeNoche, antes: NochePropia | undefined) {
  // Cada hora en la zona de su momento, como las muestra nocheDeMoss: un cambio de hora no la corre.
  const zonaEn = (ms: number) => -new Date(ms).getTimezoneOffset();
  const iso = (min: number) => {
    const aprox = instanteDe(clave, zonaEn(Date.now()), Math.round(min));
    return new Date(instanteDe(clave, zonaEn(aprox), Math.round(min))).toISOString();
  };
  const h = antes?.hora;
  elAlmacen().ponerHoraDeLaNoche(clave, {
    dormirse: iso(dormirse), despertar: iso(despertar), origen, confianza: h?.confianza ?? 'media', ...(h?.estimada ? { estimada: h.estimada } : {}),
  });
}

/**
 * Las dos horas, de a 5 minutos, con «Guardar» (en minutos desde las 18). `cambiadas` dice si se movió
 * alguna: guardar sin moverlas es confirmar lo que había, con sus horas exactas.
 */
export function EditorDeHora({ desde, hasta, alGuardar }: { desde: number; hasta: number; alGuardar: (dormirse: number, despertar: number, cambiadas: boolean) => void }) {
  const [a, setA] = useState(Math.round(desde / 5) * 5);
  const [b, setB] = useState(Math.round(hasta / 5) * 5);
  const [cambiadas, setCambiadas] = useState(false);
  const fila = (texto: string, valor: number, mover: (d: number) => void) => (
    <View style={st.editorFila}>
      <Text style={st.editorTexto}>{texto}</Text>
      <Pressable onPress={() => mover(-5)} style={({ pressed }) => [st.paso, pressed && st.apretado]} accessibilityRole="button" accessibilityLabel={`${texto}: ${t('sueno.manana.antes')}`}>
        <Text style={st.pasoTexto}>−</Text>
      </Pressable>
      <Text style={st.editorValor} accessibilityLiveRegion="polite">{reloj(valor)}</Text>
      <Pressable onPress={() => mover(5)} style={({ pressed }) => [st.paso, pressed && st.apretado]} accessibilityRole="button" accessibilityLabel={`${texto}: ${t('sueno.manana.despues')}`}>
        <Text style={st.pasoTexto}>+</Text>
      </Pressable>
    </View>
  );
  return (
    <View style={st.editor}>
      {fila(t('sueno.manana.teDormiste'), a, (d) => { setCambiadas(true); setA((x) => Math.min(b - 60, x + d)); })}
      {fila(t('sueno.manana.teDespertaste'), b, (d) => { setCambiadas(true); setB((x) => Math.max(a + 60, x + d)); })}
      <Pressable onPress={() => (cambiadas ? alGuardar(a, b, true) : alGuardar(desde, hasta, false))} style={({ pressed }) => [st.principal, pressed && st.principalApretado]} accessibilityRole="button">
        <Text style={st.principalTexto}>{t('sueno.manana.guardar')}</Text>
      </Pressable>
    </View>
  );
}

/** `ancho` es el de adentro de la tarjeta. */
export function LaManana({ hoy, noche, propia, noches, ancho, desde }: {
  hoy: ClaveDia; noche: Noche | null; propia: NochePropia | undefined; noches: Noche[]; ancho: number;
  /** El día en que empezaste Moss: las dos primeras semanas se pregunta la hora cada mañana. */
  desde: ClaveDia | null;
}) {
  const [cambiando, setCambiando] = useState(false);
  const [editando, setEditando] = useState(false);
  const [, setOculta] = useState(0);
  // La cara elegida brilla un momento antes de que se vaya la pregunta.
  const [tocada, setTocada] = useState<Cara | null>(null);
  // Antes de las 4 la noche de hoy todavía no pasó: lo que se conteste sería de la que viene.
  const oculta = ocultas.has(hoy) || new Date().getHours() < DESDE_LAS;
  const cara = propia?.cara ?? null;
  const modo = !oculta && noche?.moss?.origen === 'estimada' ? quePreguntar(hoy, noche.moss.confianza, desde) : null;
  const conCaras = (!cara && !oculta) || cambiando;
  const nombres = lista('sueno.manana.caras');

  const elegir = (c: Cara) => {
    Haptics.selectionAsync().catch(() => {});
    setTocada(c);
    setTimeout(() => {
      elAlmacen().ponerCara(hoy, c);
      setCambiando(false);
      setTocada(null);
    }, 420);
  };

  return (
    <>
      {(modo || conCaras) && (
        <Animated.View entering={FadeIn.duration(320)} exiting={FadeOut.duration(220)} layout={ACOMODA} style={st.carta}>
          {modo && noche && (
            <Aparece key={`hora-${modo}-${editando}`}>
              {modo === 'proponer' && !editando ? (
                <>
                  <Text style={st.pregunta}>{t('sueno.manana.hora', { desde: reloj(noche.dormirse), hasta: reloj(noche.despertar) })}</Text>
                  <Text style={st.nota}>{t('sueno.manana.horaNota', { seguridad: t(`sueno.seguridad.${noche.moss!.confianza}`) })}</Text>
                  <View style={st.acciones}>
                    <Pressable
                      onPress={() => { Haptics.selectionAsync().catch(() => {}); ponerHora(hoy, noche.dormirse, noche.despertar, 'confirmada', propia); }}
                      style={({ pressed }) => [st.principal, st.accion, pressed && st.principalApretado]}
                      accessibilityRole="button"
                    >
                      <Text style={st.principalTexto}>{t('sueno.manana.si')}</Text>
                    </Pressable>
                    <Pressable onPress={() => setEditando(true)} style={({ pressed }) => [st.secundario, st.accion, pressed && st.apretado]} accessibilityRole="button">
                      <Text style={st.secundarioTexto}>{t('sueno.manana.otraHora')}</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={st.pregunta}>{t('sueno.manana.sinProponer')}</Text>
                  {(() => {
                    // Sin proponer, arranca en lo de siempre y no en lo estimado: así se mide cuánto se acepta lo propuesto.
                    const h = modo === 'sinProponer' ? habitualDe(noches, hoy) : null;
                    return (
                      <EditorDeHora
                        desde={h ? h.dormirse : noche.dormirse}
                        hasta={h ? h.despertar : noche.despertar}
                        alGuardar={(x, y, cambiadas) => {
                          // Sin proponer, lo escrito siempre es tuyo; si no, sin mover nada es un «Sí».
                          ponerHora(hoy, x, y, modo === 'sinProponer' ? 'manual' : cambiadas ? 'corregida' : 'confirmada', propia);
                          setEditando(false);
                        }}
                      />
                    );
                  })()}
                </>
              )}
            </Aparece>
          )}
          {conCaras && (
            <Aparece key="caras" style={modo ? st.separado : undefined}>
              <Text style={st.pregunta}>{t('sueno.manana.pregunta')}</Text>
              <View>
                <Caras caras={CARAS} colores={CARAS.map((c) => ((tocada ?? cara) === c ? colores.oroClaro : TENUE))} elegida={tocada ?? cara} ancho={ancho} tam={34} />
                <View style={st.nombres}>
                  {CARAS.map((c, i) => <Text key={c} style={[st.caraNombre, (tocada ?? cara) === c && st.caraNombreElegida]}>{nombres[i]}</Text>)}
                </View>
                {/* Los toques, encima del dibujo y del nombre de cada cara. */}
                <View style={st.toques}>
                  {CARAS.map((c, i) => (
                    <Pressable key={c} onPress={() => elegir(c)} style={({ pressed }) => [st.cara, pressed && st.caraApretada]} accessibilityRole="button" accessibilityLabel={nombres[i]} />
                  ))}
                </View>
              </View>
            </Aparece>
          )}
          <Pressable
            onPress={() => {
              ocultas.add(hoy);
              setCambiando(false);
              setOculta((n) => n + 1);
            }}
            style={st.ahoraNo}
            accessibilityRole="button"
          >
            <Text style={st.ahoraNoTexto}>{t('sueno.manana.ahoraNo')}</Text>
          </Pressable>
        </Animated.View>
      )}
      {cara && !cambiando && (
        <Aparece style={st.hecha}>
          <Caras caras={[cara]} colores={[colores.oroClaro]} ancho={24} tam={22} />
          <Text style={st.hechaTexto}>{t('sueno.manana.respondida', { cara: nombres[cara - 1].toLowerCase() })}</Text>
          <Pressable onPress={() => { ocultas.delete(hoy); setCambiando(true); }} hitSlop={8} accessibilityRole="button">
            <Text style={st.cambiar}>{t('sueno.manana.cambiar')}</Text>
          </Pressable>
        </Aparece>
      )}
    </>
  );
}

const st = StyleSheet.create({
  carta: { marginTop: 14, borderRadius: 20, paddingTop: 16, paddingHorizontal: 17, paddingBottom: 8, backgroundColor: 'rgba(8, 12, 26, 0.72)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', overflow: 'hidden' },
  pregunta: { marginBottom: 12, fontFamily: letras.textoMedio, fontSize: 19, lineHeight: 23, color: colores.pergamino },
  nota: { marginTop: -6, marginBottom: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)' },
  acciones: { flexDirection: 'row', gap: 8 },
  accion: { flex: 1 },
  principal: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  principalApretado: { backgroundColor: '#d9d0b8' },
  principalTexto: { fontFamily: letras.textoMedio, fontSize: 14.5, color: '#0b0f1d' },
  secundario: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.2)' },
  secundarioTexto: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
  apretado: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  separado: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  nombres: { flexDirection: 'row', marginTop: 5 },
  toques: { position: 'absolute', left: 0, right: 0, top: -6, bottom: -4, flexDirection: 'row', gap: 4 },
  cara: { flex: 1, borderRadius: 14 },
  caraApretada: { backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  caraNombre: { flex: 1, textAlign: 'center', fontFamily: letras.texto, fontSize: 11, color: TENUE },
  caraNombreElegida: { color: colores.oroClaro },
  ahoraNo: { alignSelf: 'center', marginTop: 8, paddingVertical: 8, paddingHorizontal: 12 },
  ahoraNoTexto: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.45)' },
  hecha: { marginTop: 14, marginHorizontal: 2, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hechaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.72)' },
  cambiar: { fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  editor: { gap: 8 },
  editorFila: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editorTexto: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  editorValor: { width: 64, textAlign: 'center', fontFamily: letras.numero, fontSize: 18, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  paso: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  pasoTexto: { fontFamily: letras.texto, fontSize: 18, color: colores.pergamino },
});
