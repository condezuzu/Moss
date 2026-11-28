// «Tareas para mañana» (antes «Lo que tienes en la cabeza»; el título, del 28/11), la de la galería 50 (galeria/src/periodo.js; spec/sueno.md): la nota corta donde
// se escriben los pendientes antes de acostarte, uno por uno, y la fila de Sueño que la abre, debajo de tu periodo
// de melatonina. Lo anotado es para mañana (src/dominio/pendientes.ts), queda en el teléfono y vuelve por la mañana,
// en un aviso y arriba de «Para hoy». La fila se ve con el aviso «Anotar lo que tienes en la cabeza» activado
// (Perfil › Avisos); ese aviso, al tocarlo, abre la nota (abrirLaNota).

import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { diaDeLosPendientes, LARGO_DEL_PENDIENTE, limpiarPendiente, MAXIMO_DE_PENDIENTES, pendientesPara } from '@/dominio/pendientes';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { Icono } from '../comida/comunes';
import { useEstado } from '../comida/datos';
import { HojaModal } from '../HojaModal';
import { ACOMODA } from '../tarjetas';
import { SN } from './comunes';

/** Si se anotan pendientes: con el aviso de la noche activado (apagado de fábrica). */
export const conPendientes = (e: Pick<Estado, 'avisos'>) => !!e.avisos.descarga?.encendido;

// ------------------------------------------------------------ abrir la nota desde afuera
// El aviso de la noche lleva a Sueño y abre la nota, como «Más en Sueño» lleva a tu energía (irAEnergia).
const quienesAbren = new Set<() => void>();
let porAbrir = false;

/** Abre la nota en Sueño. La llama quien lleva a Sueño (el aviso «Anota lo que tienes en la cabeza»). */
export function abrirLaNota() {
  porAbrir = true;
  quienesAbren.forEach((f) => f());
}

/** Sueño lo escucha: `alAbrir` abre la nota. */
export function useAbrirLaNota(alAbrir: () => void) {
  useEffect(() => {
    const f = () => {
      porAbrir = false;
      alAbrir();
    };
    quienesAbren.add(f);
    if (porAbrir) f();
    return () => {
      quienesAbren.delete(f);
    };
  }, [alAbrir]);
}

// ------------------------------------------------------------ la fila de Sueño
export function FilaDePendientes({ alTocar }: { alTocar: () => void }) {
  const e = useEstado();
  const n = pendientesPara(e.pendientes, diaDeLosPendientes(e.hoy)).length;
  return (
    <Pressable onPress={alTocar} style={({ pressed }) => [st.fila, pressed && st.filaApretada]} accessibilityRole="button">
      <View style={st.filaIco}><Icono nombre="pencil" tam={15} /></View>
      <View style={st.filaTextos}>
        <Text style={st.filaTitulo}>{t('sueno.pendientes.fila')}</Text>
        <Text style={st.filaDetalle}>{n ? plural('sueno.pendientes.filaCon', n) : t('sueno.pendientes.filaVacia')}</Text>
      </View>
      <Icono nombre="chevron.right" tam={12} peso="semibold" color={SN.tenue} />
    </Pressable>
  );
}

// ------------------------------------------------------------ la nota
/** Lo de adentro cambia de alto (se anota uno, se quita otro) y la hoja lo acompaña en vez de saltar. */
function AltoSuave({ children }: { children: ReactNode }) {
  const reducido = useReducedMotion();
  const alto = useSharedValue(-1);
  const estilo = useAnimatedStyle(() => (alto.get() < 0 ? {} : { height: alto.get() }));
  return (
    <Animated.View style={[st.recorta, estilo]}>
      <View
        onLayout={(ev) => {
          const h = ev.nativeEvent.layout.height;
          alto.set(alto.get() < 0 || reducido ? h : withTiming(h, { duration: 280 }));
        }}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/** La nota corta: lo pendiente, uno por uno. Se abre desde la fila de Sueño o tocando el aviso de la noche. */
export function LaNota({ alCerrar }: { alCerrar: () => void }) {
  const e = useEstado();
  const lista = pendientesPara(e.pendientes, diaDeLosPendientes(e.hoy));
  const lleno = lista.length >= MAXIMO_DE_PENDIENTES;
  const [texto, setTexto] = useState('');
  const [enfocado, setEnfocado] = useState(false);
  const escrito = limpiarPendiente(texto);
  /** Anota lo escrito; dice si anotó algo. Con la lista llena después de ese, el teclado ya no hace falta. */
  const sumar = () => {
    if (!elAlmacen().ponerPendiente(texto)) return false;
    Haptics.selectionAsync().catch(() => {});
    anunciar(plural('sueno.pendientes.filaCon', lista.length + 1));
    setTexto('');
    if (lista.length + 1 >= MAXIMO_DE_PENDIENTES) Keyboard.dismiss();
    return true;
  };
  const quitar = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    elAlmacen().quitarPendiente(id);
  };
  // «Listo» no pierde lo que quedó escrito sin agregar: lo anota y cierra.
  const listo = () => {
    if (escrito) sumar();
    Keyboard.dismiss();
    alCerrar();
  };
  return (
    <HojaModal
      abierta
      titulo={t('sueno.pendientes.titulo')}
      alCerrar={alCerrar}
      sinGuardar={!!escrito}
      // El campo va en el pie de la hoja, que sube con el teclado: así queda siempre a la vista, con la lista arriba.
      pie={(
        <>
          <View style={st.nuevo}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              editable={!lleno}
              placeholder={t('sueno.pendientes.campo')}
              placeholderTextColor="rgba(239, 230, 207, 0.35)"
              maxLength={LARGO_DEL_PENDIENTE}
              selectionColor={colores.oro}
              keyboardAppearance="dark"
              // «Listo» en el teclado: con algo escrito lo anota y sigue, para el próximo; sin nada, baja el teclado.
              returnKeyType="done"
              submitBehavior="submit"
              onSubmitEditing={() => {
                if (!sumar()) Keyboard.dismiss();
              }}
              onFocus={() => setEnfocado(true)}
              onBlur={() => setEnfocado(false)}
              style={[st.campo, (enfocado || !!escrito) && st.campoActivo, lleno && st.apagado]}
              accessibilityLabel={t('sueno.pendientes.campo')}
            />
            <Pressable
              onPress={sumar}
              disabled={lleno || !escrito}
              style={({ pressed }) => [st.agregar, (lleno || !escrito) && st.apagado, pressed && st.agregarApretado]}
              accessibilityRole="button"
              accessibilityLabel={t('sueno.pendientes.agregar')}
              accessibilityState={{ disabled: lleno || !escrito }}
            >
              <Icono nombre="plus" tam={17} peso="semibold" />
            </Pressable>
          </View>
          <View style={st.pie}>
            <Text style={[st.queda, lleno && st.quedaLleno]}>{lleno ? t('sueno.pendientes.lleno', { n: MAXIMO_DE_PENDIENTES }) : t('sueno.pendientes.queda')}</Text>
            <Pressable onPress={listo} style={({ pressed }) => [st.listo, pressed && st.listoApretado]} accessibilityRole="button">
              <Text style={st.listoTexto} maxFontSizeMultiplier={1.4}>{t('sueno.pendientes.listo')}</Text>
            </Pressable>
          </View>
        </>
      )}
    >
      <Text style={st.texto}>{t('sueno.pendientes.texto')}</Text>
      <AltoSuave>
        {lista.map((p, i) => (
          // Uno nuevo entra con un fundido; el que se quita se va igual, rápido, y los de abajo suben. La raya de
          // abajo del último es la del pie de la hoja.
          <Animated.View
            key={p.id}
            entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)}
            exiting={FadeOut.duration(140).reduceMotion(ReduceMotion.Never)}
            layout={ACOMODA}
            style={[st.item, i === lista.length - 1 && st.ultimo]}
          >
            <View style={st.punto} />
            <Text style={st.itemTexto}>{p.texto}</Text>
            <Pressable
              onPress={() => quitar(p.id)}
              style={({ pressed }) => [st.quitar, pressed && st.quitarApretado]}
              hitSlop={7}
              accessibilityRole="button"
              accessibilityLabel={`${t('sueno.pendientes.quitar')}: ${p.texto}`}
            >
              <Icono nombre="xmark" tam={11} peso="semibold" color="rgba(239, 230, 207, 0.45)" />
            </Pressable>
          </Animated.View>
        ))}
      </AltoSuave>
    </HojaModal>
  );
}

const st = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 10, paddingVertical: 11, paddingLeft: 14, paddingRight: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(150, 178, 240, 0.11)', backgroundColor: 'rgba(12, 20, 46, 0.5)' },
  filaApretada: { backgroundColor: 'rgba(20, 30, 62, 0.6)', transform: [{ scale: 0.985 }] },
  filaIco: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  filaTextos: { flex: 1, gap: 3 },
  filaTitulo: { fontFamily: letras.texto, fontSize: 14.5, lineHeight: 17.5, color: colores.pergamino },
  filaDetalle: { fontFamily: letras.texto, fontSize: 12, lineHeight: 14.5, color: SN.tenue },
  texto: { marginTop: 6, marginHorizontal: 4, marginBottom: 12, fontFamily: letras.textoLiviano, fontSize: 14, lineHeight: 20.7, color: 'rgba(239, 230, 207, 0.78)' },
  // La lista llega hasta la raya del pie: se come el margen de abajo del cuerpo de la hoja (HojaModal).
  recorta: { overflow: 'hidden', marginBottom: -18 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9, paddingLeft: 6, paddingRight: 2, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  ultimo: { borderBottomWidth: 0 },
  punto: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 1, backgroundColor: colores.oroClaro, opacity: 0.8 },
  itemTexto: { flex: 1, fontFamily: letras.texto, fontSize: 15, lineHeight: 19.5, color: colores.pergamino },
  quitar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  quitarApretado: { backgroundColor: 'rgba(239, 230, 207, 0.1)' },
  nuevo: { flexDirection: 'row', gap: 8 },
  campo: { flex: 1, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(6, 10, 22, 0.6)', fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
  campoActivo: { borderColor: 'rgba(232, 196, 106, 0.55)' },
  agregar: { width: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.45)', backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  agregarApretado: { transform: [{ scale: 0.94 }] },
  apagado: { opacity: 0.35 },
  pie: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  queda: { flexShrink: 1, fontFamily: letras.texto, fontSize: 12, lineHeight: 15.6, color: 'rgba(239, 230, 207, 0.5)' },
  quedaLleno: { color: colores.oroClaro },
  listo: { paddingVertical: 11, paddingHorizontal: 22, borderRadius: 999, backgroundColor: colores.oroClaro },
  listoApretado: { transform: [{ scale: 0.96 }] },
  listoTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: '#1a1608' },
});
