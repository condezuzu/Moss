// La pantalla de pago y «Tu suscripción», las de la galería (galeria/src/suscripcion.js; spec/suscripcion.md).
// Toda Moss es de pago, con 7 días gratis: aparece al terminar la entrada, después de la meta, y cuando se
// queda sin acceso. No se salta y no borra nada: exportar, cerrar sesión, borrar la cuenta, restaurar, los
// términos y la privacidad siempre están. Lo que Apple pide está a la vista y sin letra chica: el nombre y la
// duración de cada plan, lo que se cobra como lo más grande (lo que equivale, abajo y en chico), cuánto dura
// la prueba y lo que se cobra después, junto al botón.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type AlertButton, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, SlideInDown, SlideOutDown, useAnimatedStyle, useReducedMotion, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { claveDelDia } from '@/dominio/fechas';
import { ahorroDelAnual, DIA_DEL_AVISO, DIAS_DE_PRUEBA, diasDePrueba, planDe, porMes, PRECIOS, tieneAcceso, type Plan } from '@/dominio/premium';
import type { Tramo } from '@/dominio/sueno';
import { accesoActual, accesoDe, administrarSuscripcion, comprar, contestoApple, hayCompras, leerPrecios, precioDeRespaldo, restaurar, seSabeElAcceso, suscripcionActual, useEstadoDePremium, type EstadoDePremium } from '@/lib/premium';
import { abrirPagina } from '@/lib/sitio';
import { pedirPermisoDeAvisos, programarAvisos } from '@/recordatorios/programar';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { duracion, fechaLarga } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { Hipnograma } from '../graficos/Graficos';
import { anunciar } from '../anuncio';
import { HojaModal } from '../HojaModal';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { borrarLaCuenta, exportarTodo, salirDeLaCuenta } from '../perfil/cuenta';
import { Aparece, Parrafo } from '../tarjetas';

/** La noche del ejemplo: 5 h 40 dormidas, la misma de la galería. */
const NOCHE_CORTA: { desde: number; hasta: number; dormido: number; tramos: Tramo[] } = {
  desde: 0,
  hasta: 352,
  dormido: 340,
  tramos: [
    { etapa: 'nucleo', desde: 0, hasta: 28 }, { etapa: 'profundo', desde: 28, hasta: 62 }, { etapa: 'nucleo', desde: 62, hasta: 96 }, { etapa: 'rem', desde: 96, hasta: 112 },
    { etapa: 'nucleo', desde: 112, hasta: 150 }, { etapa: 'profundo', desde: 150, hasta: 176 }, { etapa: 'nucleo', desde: 176, hasta: 212 }, { etapa: 'despierto', desde: 212, hasta: 224 },
    { etapa: 'nucleo', desde: 224, hasta: 262 }, { etapa: 'rem', desde: 262, hasta: 296 }, { etapa: 'nucleo', desde: 296, hasta: 336 }, { etapa: 'rem', desde: 336, hasta: 352 },
  ],
};

/** El regalo se dice una vez, en este teléfono. */
const REGALO_AVISADO = 'moss:regaloAvisado';

type Vista = 'pago' | 'listo' | 'restaurada' | 'regalo';
type Pedido = { abierta: boolean; vista: Vista; vez: number; despues?: () => void; alOlvidar?: () => void };
let pedido: Pedido = { abierta: false, vista: 'pago', vez: 0 };
const oyentes = new Set<() => void>();
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};
function cambiar(nuevo: Partial<Pedido>) {
  pedido = { ...pedido, ...nuevo };
  oyentes.forEach((o) => o());
}
// Mientras dura una compra, lo que Apple va contestando no cambia la pantalla: la cambia el final de la compra.
let enCompra = false;
/** Queda abierta aunque Apple conteste que ya hay acceso: la cierra «Seguir». Devuelve cómo estaba. */
function quedarAbierta() {
  const antes = pedido.abierta;
  enCompra = true;
  cambiar({ abierta: true });
  return antes;
}

/**
 * Al final de la entrada, después de la meta: quien tiene acceso sigue de largo. `alOlvidar`: si desde
 * acá se borra la cuenta o se cierra la sesión, la entrada empieza de nuevo.
 */
export function ofrecerPremium(despues: () => void, alOlvidar?: () => void) {
  if (!hayCompras()) {
    despues();
    return;
  }
  contestoApple().then(() => {
    // Si Apple no contestó a tiempo, no aparece la pantalla de pago (spec/suscripcion.md): si después dice que
    // no hay acceso, aparece entonces.
    if (!seSabeElAcceso() || tieneAcceso(accesoActual())) despues();
    else cambiar({ abierta: true, vista: 'pago', vez: pedido.vez + 1, despues, alOlvidar });
  }).catch(() => {});
}

function cerrar() {
  const { despues } = pedido;
  pedido = { abierta: false, vista: 'pago', vez: pedido.vez + 1 };
  oyentes.forEach((o) => o());
  despues?.();
}

/** Se borró la cuenta o se cerró la sesión desde acá: vuelve la entrada, desde el principio. */
function olvidado() {
  const { alOlvidar } = pedido;
  pedido = { abierta: false, vista: 'pago', vez: pedido.vez + 1 };
  oyentes.forEach((o) => o());
  alOlvidar?.();
}

/** Un degradado de fondo: en la web es CSS, en el teléfono el de React Native (como en Sueño). */
const degradado = (g: string) => (Platform.OS === 'web' ? { backgroundImage: g } : { experimental_backgroundImage: g }) as ViewStyle;
const FONDO = degradado('linear-gradient(180deg, rgb(24, 34, 70) 0%, rgb(9, 12, 26) 45%)');

// ------------------------------------------------------------------ los precios
function losPrecios(e: EstadoDePremium) {
  const anual = e.productos.anual;
  const mensual = e.productos.mensual;
  return {
    anual: anual?.precio ?? precioDeRespaldo(PRECIOS.anual),
    mensual: mensual?.precio ?? precioDeRespaldo(PRECIOS.mensual),
    porMes: anual?.porMes ?? precioDeRespaldo(porMes(PRECIOS.anual)),
    ahorro: ahorroDelAnual(anual?.valor ?? PRECIOS.anual, mensual?.valor ?? PRECIOS.mensual),
  };
}

/** Lo que cuesta, para la introducción: `dias` es 0 si esta cuenta de Apple ya usó la prueba. */
export function usePreciosDeLaEntrada() {
  const e = useEstadoDePremium();
  const p = losPrecios(e);
  return { anual: p.anual, mensual: p.mensual, dias: e.productos.anual ? e.productos.anual.prueba : DIAS_DE_PRUEBA };
}

// ------------------------------------------------------------------ las piezas
/**
 * Comida y sueño juntos, con un ejemplo: la noche de ayer y lo que eso le dice al día de hoy (lo dice
 * Comida, lineaDeNocheCorta). En la entrada, en grande (`medidas`) y con la estrella bajando (`baja`).
 */
export function EjemploDeJuntos({ ancho, medidas, baja }: { ancho: number; medidas?: { relleno: number; noche: number; hilo: number; margen: number }; baja?: [number, number] }) {
  const reducido = useReducedMotion();
  const conEstrella = !!baja && !reducido;
  const relleno = medidas?.relleno ?? 14;
  return (
    <View style={[st.juntos, { paddingHorizontal: relleno, paddingVertical: medidas?.relleno ?? 12 }]}>
      <View style={[st.juntosFila, medidas && { height: medidas.noche }]}>
        <View style={st.juntosColumna}>
          <Text style={st.juntosRotulo}>{t('suscripcion.ejemplo.anoche')}</Text>
          <Text style={st.juntosCifra}>{duracion(NOCHE_CORTA.dormido)}</Text>
        </View>
        <Hipnograma desde={NOCHE_CORTA.desde} hasta={NOCHE_CORTA.hasta} tramos={NOCHE_CORTA.tramos} ancho={Math.max(80, ancho - 2 * relleno - 110)} alto={medidas?.noche ?? 40} />
      </View>
      <Animated.View entering={conEstrella ? FadeIn.delay(baja[0]).duration(baja[1]) : undefined} style={[st.juntosUnion, medidas && { height: medidas.hilo, marginVertical: medidas.margen }]} />
      <Animated.View entering={conEstrella ? FadeIn.delay(baja[0] + baja[1] - 150).duration(600) : undefined} style={st.juntosFila}>
        <View style={st.juntosLuna}><Luna tam={48} fraccion={0.16} ms={0} /></View>
        <View style={st.juntosColumna}>
          <Text style={st.juntosRotulo}>{t('suscripcion.ejemplo.hoy')}</Text>
          <Text style={st.juntosTexto}>{t('suscripcion.ejemplo.hambre', { h: duracion(NOCHE_CORTA.dormido) })}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/** Lo que pasa en la prueba: hoy, el aviso del día 5 (lo programa recordatorios/programar.ts) y el cobro. */
function LineaDePrueba({ dias, precio }: { dias: number; precio: string }) {
  const puntos = [
    { titulo: t('suscripcion.linea.hoy'), texto: t('suscripcion.linea.hoyTexto'), hoy: true },
    { titulo: t('suscripcion.linea.dia', { n: dias - (DIAS_DE_PRUEBA - DIA_DEL_AVISO) }), texto: t('suscripcion.linea.avisoTexto') },
    { titulo: t('suscripcion.linea.dia', { n: dias }), texto: t('suscripcion.linea.cobroTexto', { precio }) },
  ];
  return (
    <View style={st.linea}>
      <View style={st.lineaHilo} />
      {puntos.map((p) => (
        <View key={p.titulo} style={st.lineaPunto}>
          <View style={[st.lineaNodo, p.hoy && st.lineaNodoHoy]} />
          <Text style={st.lineaTitulo}>{p.titulo}</Text>
          <Text style={st.lineaTexto}>{p.texto}</Text>
        </View>
      ))}
    </View>
  );
}

function OpcionDePlan({ plan, precio, debajo, elegido, alElegir, atenuado }: { plan: Plan; precio: string; debajo: string[]; elegido: boolean; alElegir: () => void; atenuado: boolean }) {
  // El borde pasa al otro plan de a poco.
  const caja = useAnimatedStyle(() => ({
    borderColor: withTiming(elegido ? colores.oro : 'rgba(239, 230, 207, 0.16)', { duration: 200 }),
    backgroundColor: withTiming(elegido ? 'rgba(232, 196, 106, 0.08)' : 'rgba(232, 196, 106, 0)', { duration: 200 }),
  }), [elegido]);
  return (
    <Pressable onPress={alElegir} style={st.planCaja} accessibilityRole="radio" accessibilityState={{ checked: elegido }}>
      <Animated.View style={[st.plan, caja, atenuado && st.apagado]}>
        <Text style={st.planNombre}>{t(`suscripcion.${plan}.nombre`)}</Text>
        {/* Lo que se cobra es lo más grande; lo que equivale, abajo y en chico (lo pide Apple). */}
        <Text style={st.planPrecio} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{precio}</Text>
        <Text style={st.planPor}>{t(`suscripcion.${plan}.por`)}</Text>
        {debajo.map((d, i) => <Text key={d} style={[st.planDetalle, plan === 'anual' && i === 1 && st.planAhorro]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{d}</Text>)}
      </Animated.View>
      {plan === 'anual' && <View style={st.reco}><Text style={st.recoTexto}>{t('suscripcion.anual.recomendado')}</Text></View>}
    </Pressable>
  );
}

function Enlace({ texto, alTocar, peligro, rol = 'button' }: { texto: string; alTocar: () => void; peligro?: boolean; rol?: 'button' | 'link' }) {
  return (
    <Pressable onPress={alTocar} accessibilityRole={rol} hitSlop={6}>
      <Text style={[st.enlace, peligro && st.enlacePeligro]}>{texto}</Text>
    </Pressable>
  );
}

// Lo que no se paga: llevarse los datos, salir y borrar la cuenta (guía 5.1.1 de Apple).
const exportar = () => { exportarTodo(elAlmacen().estado().hoy).catch(() => Alert.alert(t('perfil.errorExportar'))); };
const salir = () => Alert.alert(t('perfil.cerrarSesionTitulo'), t('perfil.cerrarSesionTexto'), [
  { text: t('comun.cancelar'), style: 'cancel' },
  { text: t('perfil.cerrarSesion'), style: 'destructive', onPress: () => salirDeLaCuenta(olvidado) },
]);
const borrar = () => {
  Alert.alert(t('perfil.borrarCuentaTitulo'), t('perfil.borrarCuentaTexto'), [
    { text: t('comun.cancelar'), style: 'cancel' },
    {
      text: t('perfil.borrar'),
      style: 'destructive',
      onPress: () => {
        // null: canceló la hoja de Apple, no se dice nada.
        borrarLaCuenta().then((ok) => {
          if (ok) olvidado();
          else if (ok === false) Alert.alert(t('perfil.errorBorrar'));
        }).catch(() => Alert.alert(t('perfil.errorBorrar')));
      },
    },
  ]);
};

/** Cuando venció, a la vista: sus datos siguen ahí, y se los puede llevar sin pagar. */
function TuCuenta() {
  return (
    <View style={st.cuenta}>
      <Text style={st.cuentaTitulo}>{t('suscripcion.cuenta.titulo')}</Text>
      <View style={st.enlaces}>
        <Enlace texto={t('suscripcion.cuenta.exportar')} alTocar={exportar} />
        <Enlace texto={t('suscripcion.cuenta.cerrarSesion')} alTocar={salir} />
        <Enlace texto={t('suscripcion.cuenta.borrar')} alTocar={borrar} peligro />
      </View>
    </View>
  );
}

/** Para quien recién llega, un enlace más: abre la hoja de acciones de iOS. */
function abrirCuenta() {
  if (Platform.OS !== 'ios') return;
  ActionSheetIOS.showActionSheetWithOptions(
    { options: [t('suscripcion.cuenta.exportar'), t('suscripcion.cuenta.cerrarSesion'), t('suscripcion.cuenta.borrar'), t('comun.cancelar')], destructiveButtonIndex: 2, cancelButtonIndex: 3, userInterfaceStyle: 'dark' },
    (i) => {
      if (i === 0) exportar();
      else if (i === 1) salir();
      else if (i === 2) borrar();
    },
  );
}

// ------------------------------------------------------------------ la pantalla de pago
function Pago({ e }: { e: EstadoDePremium }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [plan, setPlan] = useState<Plan>('anual');
  const [ocupado, setOcupado] = useState(false);
  // Restaurando, «Empezar» no se toca (sin cambiar lo que dice): las dos a la vez pedían dos veces la cuenta de Apple.
  const [restaurando, setRestaurando] = useState(false);
  // El segundo toque llega antes de que el estado se dibuje: esto lo frena ya.
  const enCamino = useRef(false);
  const [nota, setNota] = useState<string | null>(null);
  // La nota se ve y, con VoiceOver, se dice.
  const decir = (texto: string) => {
    setNota(texto);
    anunciar(texto);
  };
  const acceso = accesoDe(e);
  const vencida = acceso === 'vencida';
  const p = losPrecios(e);
  const producto = e.productos[plan];
  // Sin saber todavía, se promete solo a quien nunca tuvo una: Apple dice al final si le corresponde.
  const dias = producto ? producto.prueba : vencida ? 0 : DIAS_DE_PRUEBA;
  const conPrueba = dias > 0;
  const sinConexion = e.sinPrecios && !producto;
  const precio = plan === 'anual' ? p.anual : p.mensual;
  const precioCon = t(`suscripcion.${plan}.precioDe`, { precio });

  const empezar = async () => {
    if (enCamino.current || !producto) return;
    enCamino.current = true;
    setOcupado(true);
    setNota(null);
    const antes = quedarAbierta();
    const r = await comprar(plan);
    enCompra = false;
    enCamino.current = false;
    setOcupado(false);
    if (r === 'comprado') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      cambiar({ vista: 'listo' });
      return;
    }
    cambiar({ abierta: antes });
    if (r === 'cancelado') decir(t('suscripcion.notas.cancelada'));
    else if (r === 'pendiente') decir(t('suscripcion.notas.pendiente'));
    else decir(t('suscripcion.notas.error'));
  };
  const alRestaurar = async () => {
    if (enCamino.current) return;
    enCamino.current = true;
    setRestaurando(true);
    setNota(null);
    const antes = quedarAbierta();
    const r = await restaurar();
    enCompra = false;
    enCamino.current = false;
    setRestaurando(false);
    if (r === 'restaurada') {
      cambiar({ vista: 'restaurada' });
      return;
    }
    cambiar({ abierta: antes });
    decir(t(r === 'nada' ? 'suscripcion.notas.nada' : 'suscripcion.notas.errorRestaurar'));
  };
  const apagado = ocupado || restaurando || (!producto && !sinConexion);

  return (
    <Animated.View exiting={FadeOut.duration(160).reduceMotion(ReduceMotion.Never)} style={st.pantalla}>
      <ScrollView style={st.scroll} contentContainerStyle={[st.adentro, { paddingTop: insets.top + 18 }]} showsVerticalScrollIndicator={false}>
        <Text style={st.titulo} accessibilityRole="header">{vencida ? t(e.ultima?.prueba ? 'suscripcion.vencida.tituloPrueba' : 'suscripcion.vencida.titulo') : t('suscripcion.pago.titulo')}</Text>
        <Text style={st.bajada}>{vencida ? t('suscripcion.vencida.texto') : t('suscripcion.pago.texto')}</Text>
        {vencida ? <TuCuenta /> : <EjemploDeJuntos ancho={width - 40} />}
        <View style={st.todo}>
          <Text style={st.todoTitulo}>{t('suscripcion.pago.todoTitulo')}</Text>
          {lista('suscripcion.pago.todo').map((texto) => (
            <View key={texto} style={st.todoFila}>
              <View style={st.rombo} />
              <Text style={st.todoTexto}>{texto}</Text>
            </View>
          ))}
        </View>
        {conPrueba && !vencida && <Aparece key={plan}><LineaDePrueba dias={dias} precio={precio} /></Aparece>}
      </ScrollView>
      <View style={[st.pie, { paddingBottom: insets.bottom + 8 }]}>
        <View style={st.planes} accessibilityRole="radiogroup">
          <OpcionDePlan plan="anual" precio={p.anual} debajo={[t('suscripcion.anual.porMes', { mes: p.porMes }), t('suscripcion.anual.ahorro', { ahorro: p.ahorro })]} elegido={plan === 'anual'} alElegir={() => setPlan('anual')} atenuado={sinConexion} />
          <OpcionDePlan plan="mensual" precio={p.mensual} debajo={[t('suscripcion.mensual.detalle')]} elegido={plan === 'mensual'} alElegir={() => setPlan('mensual')} atenuado={sinConexion} />
        </View>
        {(sinConexion || nota) && (
          <Aparece key={nota ?? 'sinConexion'}>
            <Text style={st.nota} accessibilityLiveRegion="polite">{nota ?? t('suscripcion.notas.sinConexion')}</Text>
          </Aparece>
        )}
        <Pressable
          onPress={() => { if (sinConexion) leerPrecios().catch(() => {}); else empezar().catch(() => {}); }}
          disabled={apagado}
          style={({ pressed }) => [st.principal, pressed && st.principalApretado, apagado && st.apagado]}
          accessibilityRole="button"
          accessibilityState={{ busy: ocupado || restaurando, disabled: apagado }}
        >
          {ocupado && <ActivityIndicator color="#0b0f1d" />}
          <Text style={st.principalTexto}>{ocupado ? t('suscripcion.enCurso') : sinConexion ? t('suscripcion.reintentar') : conPrueba ? t('suscripcion.empezar', { n: dias }) : t('suscripcion.suscribirme')}</Text>
        </Pressable>
        <Aparece key={plan}>
          <Text style={st.legal}>{conPrueba ? t('suscripcion.legal', { n: dias, precio: precioCon }) : t('suscripcion.legalSinPrueba', { precio: precioCon })}</Text>
        </Aparece>
        <Text style={st.renovacion}>{t('suscripcion.renovacion')}</Text>
        <View style={st.enlaces}>
          <Enlace texto={t('suscripcion.restaurar')} alTocar={() => { alRestaurar().catch(() => {}); }} />
          <Enlace texto={t('suscripcion.terminos')} alTocar={() => abrirPagina('terminos')} rol="link" />
          <Enlace texto={t('suscripcion.privacidad')} alTocar={() => abrirPagina('privacidad')} rol="link" />
          {!vencida && <Enlace texto={t('suscripcion.cuenta.titulo')} alTocar={abrirCuenta} />}
        </View>
      </View>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ después de pagar, restaurar o el regalo
function Listo({ titulo, texto, nota }: { titulo: string; texto: string; nota?: string | null }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)} style={[st.listo, { paddingBottom: insets.bottom + 12 }]}>
      <View style={st.estrella} />
      <Text style={st.listoTitulo} accessibilityRole="header">{titulo}</Text>
      <Text style={st.listoTexto}>{texto}</Text>
      {!!nota && <Aparece><Text style={st.listoNota}>{nota}</Text></Aparece>}
      <Pressable onPress={cerrar} style={({ pressed }) => [st.principal, st.listoBoton, pressed && st.principalApretado]} accessibilityRole="button">
        <Text style={st.principalTexto}>{t('suscripcion.listo.seguir')}</Text>
      </Pressable>
    </Animated.View>
  );
}

function ListoDeLaCompra({ e }: { e: EstadoDePremium }) {
  const s = e.suscripcion;
  const plan = s ? planDe(s) : 'anual';
  const precioCon = t(`suscripcion.${plan}.precioDe`, { precio: plan === 'anual' ? losPrecios(e).anual : losPrecios(e).mensual });
  const [sinAvisos, setSinAvisos] = useState(false);
  const enPrueba = !!s?.prueba;
  useEffect(() => {
    // Para poder avisar antes de que termine la prueba, como dice la pantalla.
    if (!enPrueba) return;
    pedirPermisoDeAvisos().then((si) => {
      setSinAvisos(!si);
      if (si) programarAvisos(elAlmacen().estado()).catch(() => {});
    }).catch(() => setSinAvisos(true));
  }, [enPrueba]);
  if (!s?.prueba) return <Listo titulo={t('suscripcion.listo.tituloSinPrueba')} texto={t('suscripcion.listo.textoSinPrueba', { precio: precioCon })} />;
  return (
    <Listo
      titulo={t('suscripcion.listo.titulo', { n: diasDePrueba(s, e.leido) })}
      texto={t('suscripcion.listo.texto', { fecha: fechaLarga(claveDelDia(new Date(s.vence))), precio: precioCon })}
      nota={sinAvisos ? t('suscripcion.listo.sinAvisos') : null}
    />
  );
}

/** Va una sola vez, en Secciones, arriba de todo. Sin compras en esta build, no hay nada. */
export function PantallaPremium({ conSecciones }: { conSecciones: boolean }) {
  const e = useEstadoDePremium();
  const p = useSyncExternalStore(suscribir, () => pedido);
  const reducido = useReducedMotion();
  const acceso = accesoDe(e);
  const conAcceso = tieneAcceso(acceso);
  const sinAcceso = conSecciones && e.listo && !conAcceso;

  useEffect(() => {
    // Mientras se la mira llegó el acceso: Ask to Buy aprobado, otro aparato, o la cuenta dijo que es de regalo.
    if (p.abierta && p.vista === 'pago' && e.listo && conAcceso && !enCompra) cambiar({ vista: acceso === 'regalo' ? 'regalo' : 'restaurada' });
  }, [p.abierta, p.vista, e.listo, conAcceso, acceso]);

  useEffect(() => {
    // Quien ya estaba, una vez: Moss ahora es de pago y para esa persona sigue gratis. No hace nada más.
    if (!hayCompras() || !conSecciones || !e.listo || acceso !== 'regalo') return;
    let vigente = true;
    AsyncStorage.getItem(REGALO_AVISADO).then((visto) => {
      if (visto || !vigente) return;
      AsyncStorage.setItem(REGALO_AVISADO, '1').catch(() => {});
      cambiar({ abierta: true, vista: 'regalo', vez: pedido.vez + 1 });
    }).catch(() => {});
    return () => { vigente = false; };
  }, [conSecciones, e.listo, acceso]);

  if (!hayCompras() || !(p.abierta || sinAcceso)) return null;
  return (
    <Animated.View
      // Con Reducir movimiento, el fundido (sin él, FadeIn también se saltea y la pantalla aparecía de golpe).
      entering={reducido ? ENTRA_FUNDIDO : SlideInDown.duration(340)}
      exiting={reducido ? SALE_FUNDIDO : SlideOutDown.duration(280)}
      style={[StyleSheet.absoluteFill, st.raiz, FONDO]}
      accessibilityViewIsModal
    >
      {p.vista === 'pago' && <Pago key={p.vez} e={e} />}
      {p.vista === 'listo' && <ListoDeLaCompra e={e} />}
      {p.vista === 'restaurada' && <Listo titulo={t('suscripcion.restaurada.titulo')} texto={t('suscripcion.restaurada.texto')} />}
      {p.vista === 'regalo' && <Listo titulo={t('suscripcion.regalo.titulo')} texto={t('suscripcion.regalo.texto')} />}
    </Animated.View>
  );
}

// ------------------------------------------------------------------ Perfil
/** Lo que dice la fila de Perfil. */
export function valorDeSuscripcion(e: EstadoDePremium): string {
  const acceso = accesoDe(e);
  if (acceso === 'regalo') return t('suscripcion.perfil.regalo');
  if (acceso === 'prueba' && e.suscripcion) return plural('suscripcion.perfil.prueba', diasDePrueba(e.suscripcion, e.leido));
  const s = e.suscripcion ?? e.ultima;
  return acceso === 'activa' && s ? t(`suscripcion.perfil.${planDe(s)}`) : t('suscripcion.perfil.vencida');
}

function FilaDeLaHoja({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View style={st.hojaFila}>
      <Text style={st.hojaTitulo}>{titulo}</Text>
      <Text style={st.hojaValor}>{valor}</Text>
    </View>
  );
}

/** «Tu suscripción», desde Perfil: qué tienes, cuándo cambia y cómo administrarla en Apple. */
export function HojaDeSuscripcion({ alCerrar }: { alCerrar: () => void }) {
  const e = useEstadoDePremium();
  const acceso = accesoDe(e);
  const s = e.suscripcion ?? e.ultima;
  const [nota, setNota] = useState<string | null>(null);
  // Dos toques en «Restaurar» pedían dos veces la cuenta de Apple: el segundo no hace nada.
  const restaurando = useRef(false);
  const alRestaurar = () => {
    if (restaurando.current) return;
    restaurando.current = true;
    restaurar().then((r) => {
      const texto = r === 'restaurada' ? t('suscripcion.restaurada.titulo') : t(r === 'nada' ? 'suscripcion.notas.nada' : 'suscripcion.notas.errorRestaurar');
      setNota(texto);
      anunciar(texto);
    }).catch(() => {}).finally(() => {
      restaurando.current = false;
    });
  };
  const plan = s ? planDe(s) : null;
  const p = losPrecios(e);
  const cancelada = s?.renueva === false;
  return (
    <HojaModal abierta titulo={t('suscripcion.titulo')} alCerrar={alCerrar}>
      {acceso === 'regalo' ? <Parrafo>{t('suscripcion.hoja.regalo')}</Parrafo> : (
        <>
          <FilaDeLaHoja titulo={t('suscripcion.hoja.estado')} valor={valorDeEstado(e)} />
          {plan && <FilaDeLaHoja titulo={t('suscripcion.hoja.plan')} valor={t(`suscripcion.${plan}.nombre`)} />}
          {plan && <FilaDeLaHoja titulo={t('suscripcion.hoja.precio')} valor={t(`suscripcion.${plan}.precioDe`, { precio: plan === 'anual' ? p.anual : p.mensual })} />}
          {s && <FilaDeLaHoja titulo={t(cancelada ? 'suscripcion.hoja.termina' : s.prueba ? 'suscripcion.hoja.primerCobro' : 'suscripcion.hoja.renueva')} valor={fechaLarga(claveDelDia(new Date(s.vence)))} />}
          {cancelada && <Parrafo chico>{t('suscripcion.hoja.cancelada')}</Parrafo>}
          <Pressable onPress={administrarSuscripcion} style={({ pressed }) => [st.principal, st.hojaBoton, pressed && st.principalApretado]} accessibilityRole="link">
            <Text style={st.principalTexto}>{t('suscripcion.hoja.administrar')}</Text>
          </Pressable>
          <Parrafo chico>{t('suscripcion.hoja.administrarTexto')}</Parrafo>
        </>
      )}
      {!!nota && <Aparece key={nota}><Text style={st.nota}>{nota}</Text></Aparece>}
      <View style={st.enlaces}>
        <Enlace texto={t('suscripcion.restaurar')} alTocar={alRestaurar} />
        <Enlace texto={t('suscripcion.terminos')} alTocar={() => abrirPagina('terminos')} rol="link" />
        <Enlace texto={t('suscripcion.privacidad')} alTocar={() => abrirPagina('privacidad')} rol="link" />
      </View>
    </HojaModal>
  );
}

function valorDeEstado(e: EstadoDePremium): string {
  const acceso = accesoDe(e);
  if (acceso === 'prueba' && e.suscripcion) return plural('suscripcion.perfil.prueba', diasDePrueba(e.suscripcion, e.leido));
  return t(acceso === 'activa' ? 'suscripcion.hoja.activa' : 'suscripcion.perfil.vencida');
}

/** Apple pide avisar que borrar la cuenta no cancela la suscripción, y dar cómo cancelarla. */
export function avisoAlBorrarLaCuenta(texto: string): { texto: string; botones: AlertButton[] } {
  const s = suscripcionActual();
  if (!hayCompras() || !s || s.renueva === false) return { texto, botones: [] };
  return { texto: `${texto} ${t('suscripcion.borrarConSuscripcion')}`, botones: [{ text: t('suscripcion.administrarSuscripcion'), onPress: administrarSuscripcion }] };
}

const st = StyleSheet.create({
  raiz: { backgroundColor: '#090c1a', zIndex: 50 },
  pantalla: { flex: 1 },
  scroll: { flex: 1 },
  adentro: { paddingHorizontal: 20, paddingBottom: 14, gap: 14 },
  titulo: { textAlign: 'center', fontFamily: 'CormorantGaramond_500Medium', fontSize: 30, lineHeight: 33, color: colores.pergamino },
  bajada: { marginTop: -6, textAlign: 'center', fontFamily: letras.textoLiviano, fontSize: 14.5, lineHeight: 20.5, color: 'rgba(239, 230, 207, 0.74)' },
  juntos: { borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(239, 230, 207, 0.03)' },
  juntosFila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  juntosColumna: { flexShrink: 1 },
  juntosRotulo: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  juntosCifra: { marginTop: 2, fontFamily: letras.numeroMedio, fontSize: 18, color: colores.cifra, fontVariant: ['tabular-nums'] },
  juntosTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: colores.pergamino },
  juntosUnion: { width: 1, height: 14, marginVertical: 4, marginLeft: 23, backgroundColor: 'rgba(232, 196, 106, 0.55)' },
  juntosLuna: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  todo: { gap: 6 },
  todoTitulo: { marginBottom: 2, fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: colores.oroClaro },
  todoFila: { flexDirection: 'row', gap: 10 },
  rombo: { width: 5, height: 5, marginTop: 7, marginLeft: 2, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro },
  todoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 14, lineHeight: 19, color: 'rgba(239, 230, 207, 0.88)' },
  linea: { flexDirection: 'row', gap: 8 },
  lineaHilo: { position: 'absolute', left: 4, right: '8%', top: 4, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.18)' },
  lineaPunto: { flex: 1, gap: 2 },
  lineaNodo: { width: 9, height: 9, marginBottom: 5, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.45)', backgroundColor: '#0c1124' },
  lineaNodoHoy: { borderColor: colores.oro, backgroundColor: colores.oro },
  lineaTitulo: { fontFamily: letras.textoMedio, fontSize: 12.5, color: colores.pergamino },
  lineaTexto: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.62)' },
  cuenta: { gap: 2 },
  cuentaTitulo: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  pie: { gap: 8, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)', backgroundColor: 'rgba(9, 12, 26, 0.9)' },
  planes: { flexDirection: 'row', gap: 10, paddingTop: 6 },
  planCaja: { flex: 1 },
  plan: { flex: 1, paddingTop: 13, paddingBottom: 10, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1 },
  planNombre: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.66)' },
  planPrecio: { marginTop: 3, fontFamily: letras.numeroMedio, fontSize: 22, color: colores.cifra, fontVariant: ['tabular-nums'] },
  planPor: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.72)' },
  planDetalle: { marginTop: 4, fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.6)' },
  planAhorro: { marginTop: 1, color: colores.oroClaro },
  reco: { position: 'absolute', top: -8, left: 10, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, backgroundColor: colores.oro },
  recoTexto: { fontFamily: letras.textoMedio, fontSize: 10.5, color: colores.tinta },
  nota: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: colores.oroClaro },
  principal: { minHeight: 50, borderRadius: 15, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  principalApretado: { backgroundColor: '#d9d0b8' },
  principalTexto: { fontFamily: letras.textoMedio, fontSize: 15.5, color: '#0b0f1d' },
  apagado: { opacity: 0.5 },
  legal: { fontFamily: letras.textoMedio, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.9)' },
  renovacion: { marginTop: -4, fontFamily: letras.texto, fontSize: 11, lineHeight: 15, color: 'rgba(239, 230, 207, 0.58)' },
  enlaces: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 2, paddingVertical: 4 },
  enlace: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.8)', textDecorationLine: 'underline' },
  enlacePeligro: { color: '#f0a58a' },
  listo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 28 },
  estrella: { width: 16, height: 16, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro, shadowOpacity: 0.8, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  listoTitulo: { marginTop: 14, textAlign: 'center', fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, lineHeight: 32, color: colores.pergamino },
  listoTexto: { textAlign: 'center', fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 21, color: 'rgba(239, 230, 207, 0.78)' },
  listoNota: { textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: colores.oroClaro },
  listoBoton: { alignSelf: 'stretch', marginTop: 18 },
  hojaFila: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  hojaTitulo: { fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)' },
  hojaValor: { flexShrink: 1, textAlign: 'right', fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  hojaBoton: { marginTop: 16 },
});
