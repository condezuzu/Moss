// Moss Premium, la de la galería (galeria/src/suscripcion.js; spec/suscripcion.md): después de la meta, al
// final de la entrada, y cuando se toca algo que es de Premium. Lo que Apple pide está a la vista: qué
// incluye, el precio que se cobra como lo más grande, cuánto dura la prueba y lo que se cobra después,
// restaurar, los términos y la privacidad. «Seguir con lo gratis» se ve tanto como lo demás.

import * as Haptics from 'expo-haptics';
import { useState, useSyncExternalStore } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ahorroDelAnual, type Bloqueo, type Plan } from '@/dominio/premium';
import { comprar, hayCompras, leerPrecios, pareceTenerPremium, restaurar, useEstadoDePremium, type Producto } from '@/lib/premium';
import { abrirPagina } from '@/lib/sitio';
import { pedirPermisoDeAvisos } from '@/recordatorios/programar';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { Aparece, Carta, Parrafo } from '../tarjetas';

type Pedido = { abierta: boolean; vez: number; bloqueo?: Bloqueo; despues?: () => void };
let pedido: Pedido = { abierta: false, vez: 0 };
const oyentes = new Set<() => void>();
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};

/** Abre Premium. `bloqueo`, qué se tocó; `despues`, lo que sigue al cerrarla. */
export function pedirPremium(p: { bloqueo?: Bloqueo; despues?: () => void } = {}) {
  pedido = { ...p, abierta: true, vez: pedido.vez + 1 };
  oyentes.forEach((o) => o());
}

/** Si se puede seguir; si no, abre Premium y dice qué se tocó. */
export function conPremium(que: Bloqueo): boolean {
  if (pareceTenerPremium()) return true;
  pedirPremium({ bloqueo: que });
  return false;
}

/** Desde una hoja con su propio Modal: iOS no presenta otro encima, así que espera a que se cierre. */
export function pedirPremiumAlCerrarse(que: Bloqueo) {
  setTimeout(() => pedirPremium({ bloqueo: que }), 700);
}

/** Al final de la entrada, después de la meta: quien ya lo tiene sigue de largo. */
export function ofrecerPremium(despues: () => void) {
  if (hayCompras() && !pareceTenerPremium()) pedirPremium({ despues });
  else despues();
}

// Lo que sigue al cerrarla: si es otra hoja, iOS no la presenta hasta que esta terminó de irse.
let alIrse: (() => void) | undefined;
const seguir = () => {
  const despues = alIrse;
  alIrse = undefined;
  despues?.();
};

function cerrar() {
  alIrse = pedido.despues;
  pedido = { abierta: false, vez: pedido.vez };
  oyentes.forEach((o) => o());
  // Avisa onDismiss, cuando ya se fue; por las dudas, también el reloj.
  if (alIrse) setTimeout(seguir, 900);
}

/** Lo que es de Premium, en su lugar: lo dice y lleva a verlo. */
export function CartaPremium({ que }: { que: Bloqueo }) {
  // Quien ya usó la prueba no la tiene de nuevo: no se promete.
  const { productos } = useEstadoDePremium();
  const conPrueba = (productos.anual?.prueba ?? 0) > 0;
  return (
    <Aparece>
      <Carta>
        <View style={st.carta}>
          <View style={st.cartaTexto}>
            <Text style={st.cartaTitulo}>{t(`suscripcion.bloqueo.${que}`)}</Text>
            {conPrueba && <Parrafo chico>{t('suscripcion.prueba')}</Parrafo>}
          </View>
          <Pressable onPress={() => pedirPremium({ bloqueo: que })} style={({ pressed }) => [st.cartaBoton, pressed && st.principalApretado]} accessibilityRole="button">
            <Text style={st.cartaBotonTexto}>{t('suscripcion.perfil.verPlanes')}</Text>
          </Pressable>
        </View>
      </Carta>
    </Aparece>
  );
}

/** Un degradado de fondo: en la web es CSS, en el teléfono el de React Native (como en Sueño). */
const degradado = (g: string) => (Platform.OS === 'web' ? { backgroundImage: g } : { experimental_backgroundImage: g }) as ViewStyle;
const FONDO = degradado('linear-gradient(180deg, rgb(24, 34, 70) 0%, rgb(9, 12, 26) 45%)');

function ListaDe({ titulo, textos, premium }: { titulo: string; textos: readonly string[]; premium?: boolean }) {
  return (
    <View style={[st.lista, premium && st.listaPremium]}>
      <Text style={[st.listaTitulo, premium && st.listaTituloPremium]}>{titulo}</Text>
      {textos.map((texto) => (
        <View key={texto} style={st.listaFila}>
          <View style={[st.rombo, !premium && st.romboGratis]} />
          <Text style={st.listaTexto}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

function OpcionDePlan({ plan, producto, otro, elegido, alElegir }: { plan: Plan; producto: Producto; otro?: Producto; elegido: boolean; alElegir: () => void }) {
  const detalle = plan === 'mensual' ? t('suscripcion.mensual.detalle')
    : otro ? t('suscripcion.anual.detalleDe', { mes: producto.porMes, ahorro: ahorroDelAnual(producto.valor, otro.valor) })
    : '';
  // El borde y el círculo pasan al otro plan de a poco.
  const caja = useAnimatedStyle(() => ({
    borderColor: withTiming(elegido ? colores.oro : 'rgba(239, 230, 207, 0.14)', { duration: 200 }),
    backgroundColor: withTiming(elegido ? 'rgba(232, 196, 106, 0.08)' : 'rgba(232, 196, 106, 0)', { duration: 200 }),
  }), [elegido]);
  const circulo = useAnimatedStyle(() => ({
    borderWidth: withTiming(elegido ? 5 : 1.5, { duration: 200 }),
    borderColor: withTiming(elegido ? colores.oro : 'rgba(239, 230, 207, 0.4)', { duration: 200 }),
  }), [elegido]);
  return (
    <Pressable onPress={alElegir} accessibilityRole="radio" accessibilityState={{ checked: elegido }}>
      <Animated.View style={[st.plan, caja]}>
      <Animated.View style={[st.radio, circulo]} />
      <View style={st.planTextos}>
        <Text style={st.planNombre}>{t(`suscripcion.${plan}.nombre`)}</Text>
        {/* El precio que se cobra es lo más grande; lo que equivale, abajo y en chico (lo pide Apple). */}
        <Text style={st.planPrecio}>{t(`suscripcion.${plan}.precioDe`, { precio: producto.precio })}</Text>
        {!!detalle && <Text style={st.planDetalle}>{detalle}</Text>}
      </View>
      </Animated.View>
    </Pressable>
  );
}

function Contenido({ bloqueo }: { bloqueo?: Bloqueo }) {
  const insets = useSafeAreaInsets();
  const { productos, sinPrecios } = useEstadoDePremium();
  const [plan, setPlan] = useState<Plan>('anual');
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const producto = productos[plan];
  const conPrueba = (producto?.prueba ?? 0) > 0;

  const empezar = async () => {
    if (ocupado || !producto) return;
    setOcupado(true);
    setAviso(null);
    const r = await comprar(plan);
    setOcupado(false);
    if (r === 'comprado') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Para poder avisar antes de que termine la prueba, como dice la pantalla.
      if (conPrueba) pedirPermisoDeAvisos().catch(() => {});
      setListo(true);
    } else if (r === 'pendiente') setAviso(t('suscripcion.pendiente'));
    else if (r === 'error') setAviso(t('suscripcion.error'));
  };
  const alRestaurar = async () => {
    setAviso(null);
    if (await restaurar()) setListo(true);
    else setAviso(t('suscripcion.restaurando'));
  };

  if (listo) {
    return (
      <Animated.View entering={FadeIn.duration(320)} style={[st.listo, { paddingBottom: insets.bottom + 12 }]}>
        <View style={[st.estrella, st.estrellaGrande]} />
        <Text style={st.listoTitulo}>{t('suscripcion.listo.titulo')}</Text>
        <Text style={st.listoTexto}>{t(conPrueba ? 'suscripcion.listo.texto' : 'suscripcion.listo.textoSinPrueba')}</Text>
        <Pressable onPress={cerrar} style={({ pressed }) => [st.principal, st.listoBoton, pressed && st.principalApretado]} accessibilityRole="button">
          <Text style={st.principalTexto}>{t('suscripcion.listo.seguir')}</Text>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View exiting={FadeOut.duration(160)} style={st.planesTodo}>
      {!!bloqueo && (
        <Pressable onPress={cerrar} style={[st.cerrar, { top: insets.top + 6 }]} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={8}>
          <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
        </Pressable>
      )}
      <ScrollView style={st.scroll} contentContainerStyle={[st.adentro, { paddingTop: insets.top + 18 }]} showsVerticalScrollIndicator={false}>
        {bloqueo ? <Text style={st.bloqueo}>{t(`suscripcion.bloqueo.${bloqueo}`)}</Text> : (
          <View style={st.cab}>
            <View style={st.estrella} />
            <Text style={st.titulo}>{t('suscripcion.titulo')}</Text>
            <Text style={st.bajada}>{t('suscripcion.bajada')}</Text>
          </View>
        )}
        <ListaDe titulo={t('suscripcion.premiumTitulo')} textos={lista('suscripcion.premium')} premium />
        {!bloqueo && <ListaDe titulo={t('suscripcion.gratisTitulo')} textos={lista('suscripcion.gratis')} />}
        {sinPrecios && !producto ? (
          <Aparece style={st.sinPrecios}>
            <Parrafo>{t('suscripcion.sinPrecios')}</Parrafo>
            <Pressable onPress={() => { leerPrecios().catch(() => {}); }} accessibilityRole="button" hitSlop={8}>
              <Text style={st.enlaceFuerte}>{t('suscripcion.reintentar')}</Text>
            </Pressable>
          </Aparece>
        ) : (
          <View style={st.planes} accessibilityRole="radiogroup">
            {productos.anual && <OpcionDePlan plan="anual" producto={productos.anual} otro={productos.mensual} elegido={plan === 'anual'} alElegir={() => setPlan('anual')} />}
            {productos.mensual && <OpcionDePlan plan="mensual" producto={productos.mensual} elegido={plan === 'mensual'} alElegir={() => setPlan('mensual')} />}
          </View>
        )}
        <View style={st.legal}>
          {!!producto && <Text style={st.legalTexto}>{t(conPrueba ? 'suscripcion.legal' : 'suscripcion.legalSinPrueba', { precio: t(`suscripcion.${plan}.precioDe`, { precio: producto.precio }) })}</Text>}
          {conPrueba && <Text style={st.legalRecuerda}>{t('suscripcion.recordatorio')}</Text>}
          <View style={st.enlaces}>
            <Pressable onPress={() => { alRestaurar().catch(() => {}); }} accessibilityRole="button" hitSlop={6}><Text style={st.enlace}>{t('suscripcion.restaurar')}</Text></Pressable>
            <Pressable onPress={() => abrirPagina('terminos')} accessibilityRole="link" hitSlop={6}><Text style={st.enlace}>{t('suscripcion.terminos')}</Text></Pressable>
            <Pressable onPress={() => abrirPagina('privacidad')} accessibilityRole="link" hitSlop={6}><Text style={st.enlace}>{t('suscripcion.privacidad')}</Text></Pressable>
          </View>
          {!!aviso && <Aparece key={aviso}><Text style={st.aviso} accessibilityLiveRegion="polite">{aviso}</Text></Aparece>}
        </View>
      </ScrollView>
      <View style={[st.pie, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable onPress={() => { empezar().catch(() => {}); }} disabled={!producto || ocupado} style={({ pressed }) => [st.principal, pressed && st.principalApretado, (!producto || ocupado) && st.apagado]} accessibilityRole="button">
          <Text style={st.principalTexto}>{t(conPrueba ? 'suscripcion.empezar' : 'suscripcion.suscribirme')}</Text>
        </Pressable>
        <Pressable onPress={cerrar} style={({ pressed }) => [st.secundario, pressed && st.apretado]} accessibilityRole="button">
          <Text style={st.secundarioTexto}>{bloqueo ? t('suscripcion.bloqueo.cerrar') : t('suscripcion.seguirGratis')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** Va una sola vez, en Secciones. Cerrada queda armada lo que dura su salida. */
export function PantallaPremium() {
  const p = useSyncExternalStore(suscribir, () => pedido);
  const reducido = useReducedMotion();
  if (!hayCompras()) return null;
  return (
    <Modal visible={p.abierta} animationType={reducido ? 'fade' : 'slide'} onRequestClose={cerrar} onDismiss={seguir}>
      <View style={[st.raiz, FONDO]}>
        <Contenido key={p.vez} bloqueo={p.bloqueo} />
      </View>
    </Modal>
  );
}

const st = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#090c1a' },
  planesTodo: { flex: 1 },
  cerrar: { position: 'absolute', zIndex: 2, right: 12, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  scroll: { flex: 1 },
  adentro: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  cab: { alignItems: 'center', gap: 6 },
  estrella: { width: 10, height: 10, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  estrellaGrande: { width: 16, height: 16 },
  titulo: { marginTop: 6, fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, lineHeight: 34, color: colores.pergamino },
  bajada: { maxWidth: 300, textAlign: 'center', fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 21, color: 'rgba(239, 230, 207, 0.72)' },
  bloqueo: { marginTop: 6, marginRight: 28, fontFamily: 'CormorantGaramond_500Medium', fontSize: 25, lineHeight: 30, color: colores.pergamino },
  lista: { gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.03)' },
  listaPremium: { borderColor: 'rgba(232, 196, 106, 0.28)' },
  listaTitulo: { marginBottom: 2, fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  listaTituloPremium: { color: colores.oroClaro },
  listaFila: { flexDirection: 'row', gap: 10 },
  rombo: { width: 5, height: 5, marginTop: 7, marginLeft: 2, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro },
  romboGratis: { backgroundColor: 'rgba(239, 230, 207, 0.4)' },
  listaTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 14, lineHeight: 19, color: 'rgba(239, 230, 207, 0.88)' },
  planes: { gap: 8 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1 },
  radio: { width: 18, height: 18, borderRadius: 9 },
  planTextos: { flex: 1, gap: 2 },
  planNombre: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.6)' },
  planPrecio: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  planDetalle: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)' },
  sinPrecios: { gap: 6 },
  legal: { gap: 6 },
  legalTexto: { fontFamily: letras.texto, fontSize: 11, lineHeight: 15, color: 'rgba(239, 230, 207, 0.52)' },
  legalRecuerda: { fontFamily: letras.texto, fontSize: 11, lineHeight: 15, color: 'rgba(239, 230, 207, 0.7)' },
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 2, paddingVertical: 4 },
  enlace: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.78)', textDecorationLine: 'underline' },
  enlaceFuerte: { fontFamily: letras.textoMedio, fontSize: 13.5, color: colores.oroClaro },
  aviso: { fontFamily: letras.texto, fontSize: 12, lineHeight: 16, color: colores.oroClaro },
  pie: { gap: 8, paddingHorizontal: 20, paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  principal: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  principalApretado: { backgroundColor: '#d9d0b8' },
  principalTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: '#0b0f1d' },
  apagado: { opacity: 0.5 },
  secundario: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.22)' },
  secundarioTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  apretado: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  listo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  listoTitulo: { marginTop: 14, fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, lineHeight: 32, color: colores.pergamino },
  listoTexto: { marginBottom: 18, textAlign: 'center', fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 21, color: 'rgba(239, 230, 207, 0.78)' },
  listoBoton: { alignSelf: 'stretch' },
  carta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartaTexto: { flex: 1 },
  cartaTitulo: { fontFamily: letras.textoMedio, fontSize: 14.5, lineHeight: 19, color: colores.pergamino },
  cartaBoton: { minHeight: 38, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  cartaBotonTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: '#0b0f1d' },
});
