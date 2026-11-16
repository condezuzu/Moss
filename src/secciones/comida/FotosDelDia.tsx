// La foto de la comida en Comida (galeria/src/fotos.js): «Tu día en fotos», la tira de arriba de la
// línea del día, que sin fotos no ocupa lugar; la miniatura en la tarjeta de su comida, en lugar de la
// cámara; la hoja de cada foto, con lo que se anotó con ella; y, en «¿Qué es?», la miniatura que vuela
// desde el visor. La foto no se analiza: lo dice una línea fija.

import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance, type ViewInstance } from 'react-native';
import Animated, {
  FadeIn, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

import { comidaDeLaHora } from '@/dominio/comidas';
import type { ClaveDia } from '@/dominio/fechas';
import { fotosDelDia, loAnotado, sinAnotar, type FotoDeComida } from '@/dominio/fotos';
import { sumarValores } from '@/dominio/registros';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { HojaModal } from '../HojaModal';
import { LLEGA } from '../movimiento';
import { ACOMODA } from '../tarjetas';
import { Boton, MACROS, Punto } from './comunes';
import { cantidadDeTexto, gramosDeMacro, hora, numero, sistemaDe, useEstado, useNumeros } from './datos';
import { fotoPorId, quitarFoto, uriDe, useFotos } from './fotos';
import { abrirRegistro, avisar } from './registro';
import type { Rect } from './Visor';

const ENTRA = FadeIn.duration(400).reduceMotion(ReduceMotion.Never);
const SALE = FadeOut.duration(200).reduceMotion(ReduceMotion.Never);
/** Lo que tarda en irse una hoja: lo que se abre después espera (iOS no abre nada mientras otra se cierra). */
const DESPUES_DE_LA_HOJA = 450;

/** «Almuerzo · 13:05» o «Sin anotar · 20:15». */
const tituloDe = (f: FotoDeComida) => `${f.comida ? t(`comida.comidas.${f.comida}`) : t('comida.fotoDiario.sinAnotar')} · ${hora(f.minutos)}`;

// La hoja de cada foto es una sola: la abren la tira y la miniatura de la tarjeta.
let abierta: string | null = null;
const oyentes = new Set<() => void>();
function verFoto(id: string | null) {
  abierta = id;
  oyentes.forEach((o) => o());
}
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => oyentes.delete(o);
};

/** Se borra la foto, nunca lo anotado, con «Deshacer». */
function borrar(f: FotoDeComida) {
  const devolver = quitarFoto(f.id);
  avisar(t('comida.fotoDiario.borrada'), devolver);
}

// ------------------------------------------------------------------ la tira
/** Tu día en fotos: crece desde cero con la primera y se cierra con la última, con lo que tenía adentro. */
export function TiraDeFotos({ dia }: { dia: ClaveDia }) {
  const todas = useFotos();
  const lista = useMemo(() => fotosDelDia(todas, dia), [todas, dia]);
  const reducido = useReducedMotion();
  // Sin fotos, se cierra con lo último que mostró: no se vacía de golpe.
  const [ultima, setUltima] = useState(lista);
  if (lista.length && ultima !== lista) setUltima(lista);
  const mostrada = lista.length ? lista : ultima.every((f) => f.dia === dia) ? ultima : [];
  const [alto, setAlto] = useState(0);
  const abiertaH = useSharedValue(lista.length ? 1 : 0);
  useEffect(() => {
    abiertaH.set(withTiming(lista.length ? 1 : 0, { duration: reducido ? 0 : 450, easing: LLEGA }));
  }, [lista.length, reducido, abiertaH]);
  const estilo = useAnimatedStyle(() => ({ height: alto * abiertaH.get(), opacity: abiertaH.get() }));
  // La que acaba de entrar queda a la vista, en el medio.
  const tira = useRef<ScrollViewInstance>(null);
  const ancho = useRef(0);
  const antes = useRef(new Set(lista.map((f) => f.id)));
  useEffect(() => {
    const i = lista.findIndex((f) => !antes.current.has(f.id));
    antes.current = new Set(lista.map((f) => f.id));
    if (i < 0) return;
    const espera = setTimeout(() => tira.current?.scrollTo({ x: Math.max(0, 20 + i * 88 - (ancho.current - 78) / 2), animated: !reducido }), 80);
    return () => clearTimeout(espera);
  }, [lista, reducido]);
  const pendientes = mostrada.filter(sinAnotar).length;
  return (
    <Animated.View style={[st.lugar, estilo]} pointerEvents={lista.length ? 'auto' : 'none'}>
      <View style={st.dentro} onLayout={(ev) => setAlto(ev.nativeEvent.layout.height)}>
        <View style={st.cab}>
          <Text style={st.cabTitulo} accessibilityRole="header">{t('comida.fotoDiario.tira')}</Text>
          {mostrada.length > 0 && (
            <Text style={st.cabCuenta}>{pendientes ? plural('comida.fotoDiario.pendientes', pendientes) : plural('comida.fotoDiario.cuantas', mostrada.length)}</Text>
          )}
        </View>
        <ScrollView
          ref={tira}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollsToTop={false}
          contentContainerStyle={st.tira}
          onLayout={(ev) => { ancho.current = ev.nativeEvent.layout.width; }}
        >
          <Animated.View key={dia} entering={ENTRA} style={st.fila}>
            {mostrada.map((f) => (
              <Animated.View key={f.id} entering={ENTRA} exiting={SALE} layout={ACOMODA}>
                <FotoDeLaTira f={f} />
              </Animated.View>
            ))}
          </Animated.View>
        </ScrollView>
      </View>
    </Animated.View>
  );
}

function FotoDeLaTira({ f }: { f: FotoDeComida }) {
  const pendiente = sinAnotar(f);
  return (
    <Pressable onPress={() => verFoto(f.id)} style={({ pressed }) => [st.foto, pressed && st.hundida]} accessibilityRole="imagebutton" accessibilityLabel={tituloDe(f)}>
      <View style={[st.marco, pendiente && st.marcoPendiente]}>
        <Image source={{ uri: uriDe(f) }} style={[st.imagen, pendiente && st.imagenPendiente]} contentFit="cover" transition={200} />
        {pendiente && <View style={st.punto} />}
      </View>
      {/* Al anotarla, el nombre cambia con un fundido. */}
      <Animated.Text key={f.comida ?? '-'} entering={ENTRA} style={[st.fotoNombre, pendiente && st.fotoNombrePendiente]} numberOfLines={1}>
        {f.comida ? t(`comida.comidas.${f.comida}`) : t('comida.fotoDiario.sinAnotar')}
      </Animated.Text>
      <Text style={st.fotoHora}>{hora(f.minutos)}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------------ en la tarjeta
/** La foto en la tarjeta de su comida, en lugar de la cámara: abre lo mismo que la tira. */
export function MiniaturaDeFoto({ f, quieta }: { f: FotoDeComida; quieta?: boolean }) {
  const imagen = <Image source={{ uri: uriDe(f) }} style={st.miniImagen} contentFit="cover" transition={200} />;
  if (quieta) return <View style={st.mini}>{imagen}</View>;
  return (
    <Animated.View entering={ENTRA} style={st.miniLugar}>
      <Pressable onPress={() => verFoto(f.id)} style={({ pressed }) => [st.mini, pressed && st.hundida]} accessibilityRole="imagebutton" accessibilityLabel={t('comida.fotos.ver')} hitSlop={8}>
        {imagen}
      </Pressable>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ la hoja de cada foto
/** Con lo que se anotó con ella (o toda su comida, si se sacó después) o, sin anotar, «Anotar». */
export function HojaDeFoto() {
  const id = useSyncExternalStore(suscribir, () => abierta);
  useFotos();
  const vigente = id ? fotoPorId(id) : null;
  // Mientras se va, sigue mostrando la que tenía.
  const [ultima, setUltima] = useState<FotoDeComida | null>(vigente);
  if (vigente && vigente !== ultima) setUltima(vigente);
  const f = vigente ?? ultima;
  const e = useEstado();
  const numeros = useNumeros();
  if (!f) return null;
  const anotado = loAnotado(f, e.registros.values());
  const sinNada = !anotado.length;
  const total = sumarValores(anotado.map((r) => r.valores));
  const cerrar = () => verFoto(null);
  const despues = (abrir: () => void) => {
    cerrar();
    setTimeout(abrir, DESPUES_DE_LA_HOJA);
  };
  return (
    <HojaModal
      abierta={!!vigente}
      titulo={tituloDe(f)}
      alCerrar={cerrar}
      pie={(
        <>
          {sinNada
            ? <Boton tipo="grande" texto={t('comida.fotoDiario.anotar')} alTocar={() => despues(() => abrirRegistro({ panel: 'decir', dia: f.dia, comida: comidaDeLaHora(f.minutos, e.corte), foto: { anotar: f.id } }))} />
            : <Boton tipo="contorno" texto={t('comida.fotos.cambiar')} alTocar={() => despues(() => abrirRegistro({ panel: 'foto', dia: f.dia, comida: f.comida ?? undefined, foto: { reemplazar: f.id } }))} />}
          <Boton tipo="quitar" texto={t('comida.fotos.borrar')} alTocar={() => { cerrar(); borrar(f); }} />
        </>
      )}
    >
      <Image source={{ uri: uriDe(f) }} style={st.grande} contentFit="cover" transition={200} />
      <Text style={st.noSeAnaliza}>{t('comida.fotoDiario.noSeAnaliza')}</Text>
      {sinNada ? (
        <Text style={st.sinAnotar}>{t('comida.fotoDiario.sinAnotarTexto')}</Text>
      ) : (
        <View style={st.anotado}>
          <View style={st.anotadoCab}>
            <Text style={st.anotadoTitulo}>{t('comida.fotoDiario.loAnotado')}</Text>
            {numeros && (
              <Text style={st.anotadoKcal}>
                {numero(Math.round(total.kcal))}
                <Text style={st.anotadoUnidad}> kcal</Text>
              </Text>
            )}
          </View>
          {anotado.map((r) => {
            const cantidad = cantidadDeTexto(r.cantidad, sistemaDe(e));
            return (
              <View key={r.id} style={st.anotadoFila}>
                <Text style={st.anotadoNombre} numberOfLines={1}>
                  {r.nombre}
                  {cantidad ? <Text style={st.anotadoCantidad}>{` · ${cantidad}`}</Text> : null}
                </Text>
                {numeros && <Text style={st.anotadoK}>{numero(Math.round(r.valores.kcal))}</Text>}
              </View>
            );
          })}
          <View style={st.anotadoPie}>
            {MACROS.map((m) => (
              <View key={m} style={st.macro} accessible={numeros} accessibilityLabel={numeros ? t('comida.lector.macro', { macro: t(`comida.${m}`), n: gramosDeMacro(total[m]) }) : undefined}>
                <Punto macro={m} tam={5} />
                {numeros && <Text style={st.macroTexto}>{`${gramosDeMacro(total[m])} g`}</Text>}
              </View>
            ))}
          </View>
        </View>
      )}
      <Text style={st.nota}>{t('comida.fotos.nota')}</Text>
    </HojaModal>
  );
}

// ------------------------------------------------------------------ arriba de «¿Qué es?»
/** La miniatura, con la línea fija y «Sacar otra» y «Borrar». Vuela desde el visor hasta su lugar. */
export function CabezaDeFoto({ f, desde, alOtra, alBorrar }: { f: FotoDeComida; desde: Rect | null; alOtra: () => void; alBorrar: () => void }) {
  const reducido = useReducedMotion();
  const marco = useRef<ViewInstance>(null);
  const vuelo = useSharedValue<Rect | null>(null);
  const avance = useSharedValue(1);
  const estilo = useAnimatedStyle(() => {
    const v = vuelo.get();
    const p = avance.get();
    if (!v || p >= 1) return { transform: [] };
    return {
      transform: [
        { translateX: v.x * (1 - p) },
        { translateY: v.y * (1 - p) },
        { scaleX: 1 + (v.ancho - 1) * (1 - p) },
        { scaleY: 1 + (v.alto - 1) * (1 - p) },
      ],
    };
  });
  // Se mide al llegar a su lugar, y desde ahí se arma el vuelo (desplazamiento y escala desde la esquina).
  const medido = useRef(false);
  const alUbicarse = () => {
    if (medido.current || !desde || reducido) return;
    medido.current = true;
    marco.current?.measureInWindow((x, y, ancho, alto) => {
      if (!ancho) return;
      vuelo.set({ x: desde.x - x, y: desde.y - y, ancho: desde.ancho / ancho, alto: desde.alto / alto });
      avance.set(0);
      avance.set(withTiming(1, { duration: 420, easing: LLEGA }));
    });
  };
  return (
    <View style={st.cabeza}>
      <Animated.View ref={marco} collapsable={false} onLayout={alUbicarse} style={[st.cabezaMarco, st.origenArriba, estilo]}>
        <Image source={{ uri: uriDe(f) }} style={st.imagen} contentFit="cover" />
      </Animated.View>
      <Animated.View entering={FadeIn.duration(350).reduceMotion(ReduceMotion.Never)} style={st.cabezaTexto}>
        <Text style={st.noSeAnalizaChica}>{t('comida.fotoDiario.noSeAnaliza')}</Text>
        <View style={st.acciones}>
          <Pressable onPress={alOtra} accessibilityRole="button" hitSlop={10} style={({ pressed }) => pressed && st.hundida}>
            <Text style={st.accion}>{t('comida.fotoDiario.otraFoto')}</Text>
          </Pressable>
          <Pressable onPress={alBorrar} accessibilityRole="button" accessibilityLabel={t('comida.fotos.borrar')} hitSlop={10} style={({ pressed }) => pressed && st.hundida}>
            <Text style={st.accion}>{t('comida.fotoDiario.borrar')}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const TINTA = 'rgba(239, 230, 207, 0.55)';

const st = StyleSheet.create({
  lugar: { marginHorizontal: -20, overflow: 'hidden' },
  dentro: { position: 'absolute', top: 0, left: 0, right: 0 },
  cab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingTop: 26, paddingHorizontal: 20, marginBottom: 11 },
  cabTitulo: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  cabCuenta: { fontFamily: letras.texto, fontSize: 11.5, color: TINTA, fontVariant: ['tabular-nums'] },
  tira: { paddingHorizontal: 20, paddingBottom: 2 },
  fila: { flexDirection: 'row', gap: 10 },
  foto: { width: 78, gap: 3 },
  hundida: { transform: [{ scale: 0.97 }], opacity: 0.85 },
  marco: { width: 78, height: 104, marginBottom: 4, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  marcoPendiente: { borderStyle: 'dashed', borderColor: 'rgba(232, 196, 106, 0.7)' },
  imagen: { width: '100%', height: '100%' },
  imagenPendiente: { opacity: 0.72 },
  punto: { position: 'absolute', top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: colores.oro, borderWidth: 2, borderColor: 'rgba(6, 10, 22, 0.7)' },
  fotoNombre: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 14.5, color: colores.pergamino },
  fotoNombrePendiente: { color: colores.oroClaro },
  fotoHora: { fontFamily: letras.texto, fontSize: 11, color: TINTA, fontVariant: ['tabular-nums'] },
  miniLugar: { marginLeft: 'auto' },
  mini: { width: 30, height: 26, borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)', marginLeft: 'auto' },
  miniImagen: { width: '100%', height: '100%' },
  grande: { width: '100%', aspectRatio: 5 / 4, borderRadius: 16, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  noSeAnaliza: { marginTop: 12, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.68)' },
  sinAnotar: { marginTop: 12, fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: 'rgba(239, 230, 207, 0.86)' },
  anotado: { marginTop: 12, gap: 7, paddingTop: 11, paddingBottom: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: 'rgba(6, 10, 22, 0.66)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)' },
  anotadoCab: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  anotadoTitulo: { flex: 1, fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  anotadoKcal: { fontFamily: letras.numeroMedio, fontSize: 16, color: colores.oroClaro, fontVariant: ['tabular-nums'] },
  anotadoUnidad: { fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.5)', letterSpacing: 0.6 },
  anotadoFila: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  anotadoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.9)' },
  anotadoCantidad: { color: 'rgba(239, 230, 207, 0.5)' },
  anotadoK: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.58)', fontVariant: ['tabular-nums'] },
  anotadoPie: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  macroTexto: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  nota: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: TINTA },
  cabeza: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingTop: 4, paddingBottom: 6 },
  cabezaMarco: { zIndex: 3, width: 66, height: 88, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  origenArriba: { transformOrigin: 'top left' },
  cabezaTexto: { flex: 1, minWidth: 0, gap: 8 },
  noSeAnalizaChica: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.68)' },
  acciones: { flexDirection: 'row', gap: 14 },
  accion: { fontFamily: letras.texto, fontSize: 13, lineHeight: 16, color: colores.oroClaro, textDecorationLine: 'underline', textDecorationColor: 'rgba(246, 227, 166, 0.3)' },
});
