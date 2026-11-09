// El menú de mantener apretado lo anotado en Comida (la galería 46, aprobada el 9/11/2026): lo apretado se
// levanta apenas sobre un velo y el menú crece desde ahí, con «Copiar a…», «Mover a…» y, abajo, «Borrar».
// Copiar y mover cambian el menú por los días (ayer, hoy y mañana) y las comidas. Sin «¿Seguro?»: lo hecho se
// deshace desde el aviso. Se va tocando afuera, con el gesto de salir de VoiceOver o al elegir, y lo elegido
// pasa cuando lo levantado ya volvió a su lugar. Con Reducir movimiento, solo fundidos.

import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View, type TextInstance } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInLeft, FadeInRight, interpolateColor, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { DIAS_DE_COMIDA, type Estado } from '@/almacen/almacen';
import { conMayuscula } from '@/comida/buscar';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { sugerenciaVencida } from '@/dominio/plan';
import { delDia, type Registro } from '@/dominio/registros';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { conLector } from '../anuncio';
import { useCerrarConLasCapas } from '../HojaModal';
import { margenDeToque } from '../paso';
import { Icono } from './comunes';
import { horasDeComer, tituloDelDia } from './datos';
import { ANCHO_DEL_MENU, diasDelMenu, dondeFue, minutoDeDestino, ubicarMenu, type Lugar, type Rect } from './menuDeComida';
import { avisar } from './registro';

/** Lo que se mantuvo apretado: un alimento o una comida entera de la línea del día. */
export type PedidoDeMenu = {
  /** Lo que se levanta: el id del alimento o «comida:almuerzo». */
  clave: string;
  rect: Rect;
  /**
   * La opacidad de lo de la línea: se oculta mientras está su copia y vuelve, en el hilo de la interfaz,
   * justo antes de que se vaya la copia (si después se borra, su fundido se ve).
   */
  visible: SharedValue<number>;
  /** La copia de lo apretado, que se levanta: el mismo dibujo, sobre un fondo opaco (`fondo`) con sus esquinas (`radio`). */
  vista: ReactNode;
  radio: number;
  fondo: string;
  /** Lo que se copia, se mueve o se borra: de una misma comida de un mismo día. */
  registros: readonly Registro[];
  /** El día que se mira, de donde sale, y hoy. */
  dia: ClaveDia;
  hoy: ClaveDia;
  comida: Comida;
  /** La comida entera: borrarla dice cuántos alimentos se fueron. */
  entera: boolean;
  /** Desde VoiceOver, «Copiar a…» y «Mover a…» abren el menú ya en los destinos. */
  en?: 'copiar' | 'mover';
};

// ------------------------------------------------------------ lo que se hace

/** Lo mismo que el menú, para VoiceOver: un gesto nunca es la única forma. */
export const accionesDelMenu = () => [
  { name: 'copiar', label: t('comida.menu.copiarA') },
  { name: 'mover', label: t('comida.menu.moverA') },
  { name: 'borrar', label: t('comida.menu.borrar') },
];

/** Lo de un día como lo muestra la línea: sin lo borrado ni lo sugerido de un día que ya pasó. */
const deLaLinea = (e: Estado, dia: ClaveDia) => delDia(e.registros.values(), dia).filter((r) => !sugerenciaVencida(r, e.hoy));

/** «a la cena de mañana», visto desde el día que se mira. */
function dondeTexto(hacia: { dia: ClaveDia; comida: Comida }, origen: ClaveDia, hoy: ClaveDia): string {
  const p = partesDe(hacia.dia);
  return t(`comida.menu.donde.${dondeFue(hacia.dia, origen, hoy)}`, {
    aLa: t(`comida.aLa.${hacia.comida}`),
    comida: t(`comida.comidas.${hacia.comida}`).toLowerCase(),
    dia: `${lista('fecha.dias')[p.diaSemana]} ${p.dia}`,
  });
}

/** La copia, a la hora de esa comida en ese día (minutoDeDestino); si el día no llegó, planificada. */
function copiarAlla(registros: readonly Registro[], hacia: { dia: ClaveDia; comida: Comida }): Registro[] {
  const a = elAlmacen();
  const e = a.estado();
  const minutos = minutoDeDestino(deLaLinea(e, hacia.dia), hacia.dia, hacia.comida, { hoy: e.hoy, ahora: new Date(), corte: e.corte, horaDe: horasDeComer(e) });
  return a.copiarRegistros(registros.map((r) => r.id), { ...hacia, minutos });
}

export function copiarA(registros: readonly Registro[], origen: ClaveDia, hacia: { dia: ClaveDia; comida: Comida }) {
  const a = elAlmacen();
  const copia = copiarAlla(registros, hacia);
  if (!copia.length) return;
  Haptics.selectionAsync().catch(() => {});
  avisar(t('comida.menu.copiado', { donde: dondeTexto(hacia, origen, a.estado().hoy) }), () => copia.forEach((r) => a.borrarRegistro(r.id)));
}

/** Mover es copiar y borrar lo de antes. */
export function moverA(registros: readonly Registro[], origen: ClaveDia, hacia: { dia: ClaveDia; comida: Comida }) {
  const a = elAlmacen();
  const copia = copiarAlla(registros, hacia);
  if (!copia.length) return;
  const movidos = registros.filter((r) => a.borrarRegistro(r.id));
  Haptics.selectionAsync().catch(() => {});
  avisar(t('comida.menu.movido', { donde: dondeTexto(hacia, origen, a.estado().hoy) }), () => {
    // Lo de antes vuelve primero, lo último que se borró antes que nada: si su borrado había devuelto lo
    // sugerido, así lo que sigue vuelve a correr. Después se va la copia.
    [...movidos].reverse().forEach((r) => a.deshacerBorrado(r.id));
    copia.forEach((r) => a.borrarRegistro(r.id));
  });
}

/**
 * Borrar sin preguntar: el aviso lo deshace. Un alimento dice su nombre; la comida entera (o lo último que
 * tenía), cuántos alimentos se fueron, como en la galería.
 */
export function borrarDeLaLinea(registros: readonly Registro[], entera: boolean) {
  const a = elAlmacen();
  const borrados = registros.filter((r) => a.borrarRegistro(r.id));
  if (!borrados.length) return;
  const deshacer = () => [...borrados].reverse().forEach((r) => a.deshacerBorrado(r.id));
  avisar(
    entera ? plural('comida.menu.comidaBorrada', borrados.length, { comida: t(`comida.comidas.${borrados[0].comida}`) }) : t('comida.quitado', { alimento: borrados[0].nombre }),
    deshacer,
  );
}

// ------------------------------------------------------------ el menú

/** La curva de la galería: sale rápido y frena largo. */
const CURVA = Easing.bezier(0.2, 0.8, 0.2, 1);
const CAMBIO = { duration: 260, easing: CURVA };
const PELIGRO = '#f0a58a';
const TENUE = 'rgba(239, 230, 207, 0.66)';
// Lo de adentro que cambia entra de costado, como en la galería; con Reducir movimiento, con un fundido.
const DESDE_LA_DERECHA = FadeInRight.duration(240).easing(CURVA).withInitialValues({ opacity: 0, transform: [{ translateX: 14 }] }).reduceMotion(ReduceMotion.Never);
const DESDE_LA_IZQUIERDA = FadeInLeft.duration(240).easing(CURVA).withInitialValues({ opacity: 0, transform: [{ translateX: -14 }] }).reduceMotion(ReduceMotion.Never);
const FUNDIDO = FadeIn.duration(200).reduceMotion(ReduceMotion.Never);

type Vista = 'opciones' | 'copiar' | 'mover';

/** El menú de lo que se mantuvo apretado; con `pedido` en null, nada. */
export function MenuFlotante({ pedido, alCerrar }: { pedido: PedidoDeMenu | null; alCerrar: () => void }) {
  if (!pedido) return null;
  return <Menu key={pedido.clave} pedido={pedido} alCerrar={alCerrar} />;
}

function Menu({ pedido, alCerrar }: { pedido: PedidoDeMenu; alCerrar: () => void }) {
  const { width: anchoPantalla, height: altoPantalla, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const [vista, setVista] = useState<{ cual: Vista; atras: boolean }>({ cual: pedido.en ?? 'opciones', atras: false });
  const [lugar, setLugar] = useState<Lugar | null>(null);
  // Con el texto grande, el menú se ensancha un poco antes de cortar las palabras.
  const ancho = Math.min(anchoPantalla - 28, Math.round(ANCHO_DEL_MENU * Math.min(1.3, Math.max(1, fontScale))));
  const p = useSharedValue(0);
  const alto = useSharedValue(0);
  const arriba = useSharedValue(0);
  const corre = useSharedValue(0);
  const medido = useRef(false);
  const cerrando = useRef(false);
  const despues = useRef<(() => void) | undefined>(undefined);
  // VoiceOver, al cambiar lo de adentro (o al abrir ya en los destinos): a lo primero de lo nuevo, el título de
  // los destinos o «Copiar a…». Al abrir en las opciones, iOS ya lleva el foco a la primera.
  const primero = useRef<TextInstance | null>(null);
  const cambios = useRef(0);
  const enDestinos = !!pedido.en;
  useEffect(() => {
    const abriendo = cambios.current++ === 0;
    if ((abriendo && !enDestinos) || !conLector()) return;
    const espera = setTimeout(() => {
      if (primero.current) AccessibilityInfo.sendAccessibilityEvent(primero.current, 'focus');
    }, 200);
    return () => clearTimeout(espera);
  }, [vista, enDestinos]);

  // Lo elegido pasa con lo levantado ya otra vez en la línea (visible desde el hilo de la interfaz): lo que se
  // borra se va con su fundido.
  const terminar = () => {
    alCerrar();
    despues.current?.();
  };
  // Solo el valor compartido entra en los worklets (el pedido lleva la copia dibujada).
  const { visible } = pedido;
  const cerrar = (luego?: () => void) => {
    if (cerrando.current) return;
    cerrando.current = true;
    despues.current = luego;
    p.set(withTiming(0, { duration: 230, easing: CURVA, reduceMotion: ReduceMotion.Never }, () => {
      visible.set(1);
      scheduleOnRN(terminar);
    }));
  };
  // Un aviso o un widget que llevan a otro lado lo cierran sin hacer nada.
  useCerrarConLasCapas(true, () => cerrar());
  // Si se va sin cerrarse (la sección se desarmó), lo de la línea no queda oculto.
  useEffect(() => () => visible.set(1), [visible]);

  const alMedir = (h: number) => {
    const l = ubicarMenu(pedido.rect, h, { ancho: anchoPantalla, alto: altoPantalla }, { arriba: insets.top + 4, abajo: insets.bottom + 12 }, ancho);
    setLugar(l);
    // Con Reducir movimiento, lo levantado no se corre: el menú puede taparlo un poco, como en la galería.
    const sube = reducido ? 0 : l.corre;
    if (!medido.current || reducido) {
      alto.set(h);
      arriba.set(l.arriba);
      corre.set(sube);
    } else {
      alto.set(withTiming(h, CAMBIO));
      arriba.set(withTiming(l.arriba, CAMBIO));
      corre.set(withTiming(sube, CAMBIO));
    }
    if (medido.current) return;
    medido.current = true;
    p.set(withTiming(1, { duration: 280, easing: CURVA, reduceMotion: ReduceMotion.Never }));
  };

  const estiloVelo = useAnimatedStyle(() => ({ opacity: p.get() }));
  const estiloCopia = useAnimatedStyle(() => ({
    shadowOpacity: 0.55 * p.get(),
    transform: [{ translateY: corre.get() * p.get() }, { scale: reducido ? 1 : 1 + 0.03 * p.get() }],
  }));
  // El borde de la caja (1 punto arriba y abajo) va por fuera de lo de adentro.
  const estiloCaja = useAnimatedStyle(() => ({
    top: arriba.get(),
    height: alto.get() + 2,
    opacity: Math.min(1, p.get() * 1.6),
    transform: [{ scale: reducido ? 1 : 0.7 + 0.3 * p.get() }],
  }));

  const ir = (cual: Vista) => {
    Haptics.selectionAsync().catch(() => {});
    setVista({ cual, atras: false });
  };
  const elegir = (dia: ClaveDia, comida: Comida) => {
    const hacer = vista.cual === 'mover' ? moverA : copiarA;
    cerrar(() => hacer(pedido.registros, pedido.dia, { dia, comida }));
  };
  const { rect } = pedido;
  return (
    // Lo de la línea se oculta recién con la copia ya en pantalla: hasta entonces, la copia lo tapa igual.
    <Modal visible transparent animationType="none" onShow={() => visible.set(0)} onRequestClose={() => cerrar()}>
      <View style={StyleSheet.absoluteFill}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st.velo, estiloVelo]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => cerrar()} accessible={false} />
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[st.copia, { left: rect.x, top: rect.y, width: rect.ancho, height: rect.alto, borderRadius: pedido.radio, backgroundColor: pedido.fondo }, estiloCopia]}
        >
          {pedido.vista}
        </Animated.View>
        <Animated.View
          style={[st.caja, { left: lugar?.izquierda ?? rect.x, width: ancho, transformOrigin: lugar?.desdeAbajo ? '30% 100%' : '30% 0%' }, estiloCaja]}
          accessibilityViewIsModal
          onAccessibilityEscape={() => cerrar()}
        >
          <View style={st.recorte}>
            <Animated.View
              key={vista.cual}
              entering={reducido ? FUNDIDO : vista.atras ? DESDE_LA_IZQUIERDA : DESDE_LA_DERECHA}
              style={st.adentro}
              onLayout={(ev) => alMedir(ev.nativeEvent.layout.height)}
            >
              {vista.cual === 'opciones' ? (
                <>
                  <Fila texto={t('comida.menu.copiarA')} icono="doc.on.doc" primera refDelTexto={primero} alTocar={() => ir('copiar')} />
                  <Fila texto={t('comida.menu.moverA')} icono="arrow.turn.down.right" alTocar={() => ir('mover')} />
                  <Fila
                    texto={t('comida.menu.borrar')}
                    icono="trash"
                    peligro
                    separada
                    alTocar={() => cerrar(() => {
                      Haptics.selectionAsync().catch(() => {});
                      borrarDeLaLinea(pedido.registros, pedido.entera);
                    })}
                  />
                </>
              ) : (
                <Destinos modo={vista.cual} pedido={pedido} refDelTitulo={primero} alVolver={() => setVista({ cual: 'opciones', atras: true })} alElegir={elegir} />
              )}
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** «Ayer», «Hoy», «Mañana» o «Vie 16»: en el ancho de cada día del menú. */
function etiquetaDelDia(dia: ClaveDia, hoy: ClaveDia): string {
  if (dia === hoy) return t('comida.dias.hoy');
  if (dia === sumarDias(hoy, -1)) return t('comida.dias.ayer');
  if (dia === sumarDias(hoy, 1)) return t('comida.dias.manana');
  const p = partesDe(dia);
  return conMayuscula(t('comida.tituloDia', { dia: lista('fecha.diasCortos')[p.diaSemana], num: p.dia }));
}

/** Copiar o mover: el día arriba (el que se mira, elegido) y la comida, de un toque. Mover a donde ya está no se puede. */
function Destinos({ modo, pedido, refDelTitulo, alVolver, alElegir }: {
  modo: 'copiar' | 'mover';
  pedido: PedidoDeMenu;
  refDelTitulo: RefObject<TextInstance | null>;
  alVolver: () => void;
  alElegir: (dia: ClaveDia, comida: Comida) => void;
}) {
  const [dia, setDia] = useState(pedido.dia);
  const dias = diasDelMenu(pedido.dia, pedido.hoy, sumarDias(pedido.hoy, -DIAS_DE_COMIDA));
  return (
    <>
      <View style={st.cabeza}>
        <Pressable onPress={alVolver} style={({ pressed }) => [st.volver, pressed && st.apretado]} hitSlop={margenDeToque(34)} accessibilityRole="button" accessibilityLabel={t('comun.atras')}>
          <Icono nombre="chevron.left" tam={16} peso="semibold" color={colores.oroClaro} />
        </Pressable>
        <Text ref={refDelTitulo} style={st.titulo} numberOfLines={1} accessibilityRole="header" maxFontSizeMultiplier={1.6}>
          {t(modo === 'copiar' ? 'comida.menu.copiarTitulo' : 'comida.menu.moverTitulo')}
        </Text>
        <View style={st.volver} />
      </View>
      <View style={st.dias}>
        {dias.map((d) => (
          <DiaDelMenu
            key={d}
            texto={etiquetaDelDia(d, pedido.hoy)}
            etiqueta={tituloDelDia(d, pedido.hoy)}
            elegido={d === dia}
            alTocar={() => {
              if (d !== dia) Haptics.selectionAsync().catch(() => {});
              setDia(d);
            }}
          />
        ))}
      </View>
      {COMIDAS.map((c, i) => {
        const aca = modo === 'mover' && dia === pedido.dia && c === pedido.comida;
        return <Fila key={c} texto={t(`comida.comidas.${c}`)} detalle={aca ? t('comida.menu.aca') : undefined} desactivada={aca} chica primera={i === 0} alTocar={() => alElegir(dia, c)} />;
      })}
    </>
  );
}

/** Un día de arriba de los destinos: el elegido, dorado, con el cambio de color fundido (un fundido no es movimiento). */
function DiaDelMenu({ texto, etiqueta, elegido, alTocar }: { texto: string; etiqueta: string; elegido: boolean; alTocar: () => void }) {
  const brillo = useSharedValue(elegido ? 1 : 0);
  useEffect(() => {
    brillo.set(withTiming(elegido ? 1 : 0, { duration: 200, reduceMotion: ReduceMotion.Never }));
  }, [elegido, brillo]);
  const estilo = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(brillo.get(), [0, 1], ['rgba(232, 196, 106, 0)', 'rgba(232, 196, 106, 0.16)']),
    borderColor: interpolateColor(brillo.get(), [0, 1], ['rgba(239, 230, 207, 0.14)', 'rgba(232, 196, 106, 0.62)']),
  }));
  const estiloTexto = useAnimatedStyle(() => ({ color: interpolateColor(brillo.get(), [0, 1], ['rgba(239, 230, 207, 0.72)', colores.oroClaro]) }));
  return (
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [st.dia, pressed && !elegido && st.apretado]}
      hitSlop={{ top: 7, bottom: 7, left: 3, right: 3 }}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ selected: elegido }}
    >
      <Animated.View style={[st.diaFondo, estilo]}>
        <Animated.Text style={[st.diaTexto, estiloTexto]} numberOfLines={1} maxFontSizeMultiplier={1.4}>{texto}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

function Fila({ texto, icono, detalle, peligro, separada, primera, chica, desactivada, refDelTexto, alTocar }: {
  texto: string;
  icono?: SFSymbol;
  detalle?: string;
  peligro?: boolean;
  separada?: boolean;
  primera?: boolean;
  chica?: boolean;
  desactivada?: boolean;
  refDelTexto?: RefObject<TextInstance | null>;
  alTocar: () => void;
}) {
  return (
    <Pressable
      onPress={alTocar}
      disabled={desactivada}
      style={({ pressed }) => [st.fila, chica && st.filaChica, !primera && st.conRaya, separada && st.separada, pressed && st.filaApretada]}
      accessibilityRole="button"
      accessibilityLabel={detalle ? `${texto}, ${detalle}` : texto}
      accessibilityState={{ disabled: !!desactivada }}
    >
      <Text ref={refDelTexto} style={[st.filaTexto, peligro && st.peligro, desactivada && st.desactivada]} maxFontSizeMultiplier={1.6}>{texto}</Text>
      {detalle ? <Text style={st.detalle} maxFontSizeMultiplier={1.4}>{detalle}</Text> : icono ? <Icono nombre={icono} tam={17} color={peligro ? PELIGRO : TENUE} /> : null}
    </Pressable>
  );
}

const st = StyleSheet.create({
  // Sin el desenfoque de la galería (haría falta un módulo nativo nuevo): un poco más oscuro.
  velo: { backgroundColor: 'rgba(2, 4, 10, 0.64)' },
  // Con fondo opaco: así iOS calcula la sombra con la forma y no píxel por píxel.
  copia: { position: 'absolute', shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowRadius: 23 },
  caja: {
    position: 'absolute', borderRadius: 14, backgroundColor: '#121932', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)',
    shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 25, shadowOffset: { width: 0, height: 18 },
  },
  // Lo de adentro se recorta mientras la caja cambia de alto.
  recorte: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 13, overflow: 'hidden' },
  adentro: { position: 'absolute', top: 0, left: 0, right: 0 },
  fila: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingLeft: 16, paddingRight: 14, paddingVertical: 8 },
  filaChica: { minHeight: 42 },
  conRaya: { borderTopWidth: 1, borderTopColor: 'rgba(239, 230, 207, 0.07)' },
  separada: { borderTopWidth: 7, borderTopColor: 'rgba(2, 4, 10, 0.42)' },
  filaApretada: { backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  filaTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 15, lineHeight: 19, color: colores.pergamino },
  peligro: { color: PELIGRO },
  desactivada: { color: 'rgba(239, 230, 207, 0.4)' },
  detalle: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.42)' },
  cabeza: { minHeight: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(239, 230, 207, 0.08)' },
  volver: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  titulo: { flex: 1, textAlign: 'center', fontFamily: letras.textoMedio, fontSize: 14, color: colores.pergamino },
  apretado: { opacity: 0.6 },
  dias: { flexDirection: 'row', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(239, 230, 207, 0.07)' },
  dia: { flex: 1, minWidth: 0 },
  diaFondo: { minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 999, borderWidth: 1 },
  diaTexto: { fontFamily: letras.texto, fontSize: 12.5 },
});
