// La guía del cargador, la de la galería (galeria/src/atajos.js; spec/sueno-sin-esfuerzo.md): armar la
// automatización que avisa a Moss cuando conectas o desconectas el cargador, con un iPhone dibujado que
// muestra qué tocar. En iOS 27 la automatización viaja con el atajo; hasta iOS 26, el atajo se instala
// de un toque y la automatización se arma a mano. Sin el enlace del atajo (hace falta armarlo en un iPhone),
// se arman a mano las dos automatizaciones, igual de guiadas. Como la persona sale de Moss para ir a Atajos, se puede
// mirar entera antes, y al volver sigue donde quedó. Termina probándolo con el cargador de verdad.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeIn, FadeInRight, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ATAJO_DEL_CARGADOR } from '@/lib/sitio';
import { useSenales } from '@/salud/anclas';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { horaDelDia } from '../comida/datos';
import { Aparece } from '../tarjetas';

type Tocar = 'instalar' | 'llave' | 'anadir' | 'mas' | 'cargador' | 'siguiente' | 'atajo' | 'accion';

// Cada pantalla del iPhone dibujado y qué hay que tocar en ella.
const PASOS = {
  27: [
    { id: 'instalar', clave: 'conAtajos27.instalar', pantalla: 'moss', toca: 'instalar' },
    { id: 'activar', clave: 'conAtajos27.activar', pantalla: 'importar', toca: 'llave' },
    { id: 'anadir', clave: 'conAtajos27.anadir', pantalla: 'importarListo', toca: 'anadir' },
  ],
  26: [
    { id: 'instalar', clave: 'conAtajos26.instalar', pantalla: 'importarSimple', toca: 'anadir' },
    { id: 'automatizacion', clave: 'conAtajos26.automatizacion', pantalla: 'automatizaciones', toca: 'mas' },
    { id: 'cargador', clave: 'conAtajos26.cargador', pantalla: 'lista', toca: 'cargador' },
    { id: 'marcar', clave: 'conAtajos26.marcar', pantalla: 'marcar', toca: 'siguiente' },
    { id: 'elegir', clave: 'conAtajos26.elegir', pantalla: 'elegir', toca: 'atajo' },
  ],
  aMano: [
    { id: 'automatizacion', clave: 'aMano.automatizacion', pantalla: 'automatizaciones', toca: 'mas' },
    { id: 'cargador', clave: 'aMano.cargador', pantalla: 'lista', toca: 'cargador' },
    { id: 'conectado', clave: 'aMano.conectado', pantalla: 'marcarConectado', toca: 'siguiente' },
    { id: 'accionConectado', clave: 'aMano.accionConectado', pantalla: 'accionConectado', toca: 'accion' },
    { id: 'desconectado', clave: 'aMano.desconectado', pantalla: 'marcarDesconectado', toca: 'siguiente' },
    { id: 'accionDesconectado', clave: 'aMano.accionDesconectado', pantalla: 'accionDesconectado', toca: 'accion' },
  ],
} as const;
type Paso = (typeof PASOS)[keyof typeof PASOS][number];

const MIRAR_MS = 2400;
const LLAVE_MS = 420;
/** Sin nada del cargador en este rato, se dice qué mirar. */
const ESPERA_MS = 30_000;

/** En iOS 27 la automatización viaja con el atajo; antes, no; y sin el enlace, todo a mano. En la web, para probarla: EXPO_PUBLIC_IOS_DE_PRUEBA. */
function versionDeLaGuia(): keyof typeof PASOS {
  if (!ATAJO_DEL_CARGADOR) return 'aMano';
  const ios = Number(process.env.EXPO_PUBLIC_IOS_DE_PRUEBA ?? String(Platform.Version).split('.')[0]);
  return ios >= 27 ? 27 : 26;
}


function ios(clave: 'acciones' | 'automatizacion' | 'atajos' | 'nueva' | 'buscar' | 'alarma' | 'sueno' | 'cargador' | 'conectado' | 'desconectado' | 'ejecutar' | 'confirmar' | 'siguiente' | 'anadir' | 'activar' | 'atajo' | 'cuando' | 'misAtajos' | 'otro1' | 'otro2') {
  return t(`sueno.afinar.cargador.guia.ios.${clave}`);
}

/** Lo que hay que tocar late, con un anillo; con Reducir movimiento, queda quieto. */
function Latido({ radio }: { radio: number }) {
  const reducido = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (!reducido) v.set(withRepeat(withTiming(1, { duration: 750, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [reducido, v]);
  const anillo = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * v.get(), transform: [{ scale: 1 + 0.025 * v.get() }] }));
  return <Animated.View pointerEvents="none" style={[st.latido, { borderRadius: radio + 2 }, anillo]} />;
}

function Tocable({ id, toca, alTocar, style, radio = 9, etiqueta, children }: { id: Tocar; toca: Tocar; alTocar: () => void; style?: StyleProp<ViewStyle>; radio?: number; etiqueta?: string; children: ReactNode }) {
  const es = id === toca;
  return (
    <Pressable onPress={es ? alTocar : undefined} disabled={!es} style={style} accessibilityRole={es ? 'button' : undefined} accessibilityLabel={es ? etiqueta : undefined}>
      {children}
      {es && <Latido radio={radio} />}
    </Pressable>
  );
}

function Fila({ texto, marca }: { texto: string; marca?: 'si' | 'no' }) {
  return (
    <>
      <Text style={st.iosTexto}>{texto}</Text>
      {marca === undefined ? <Text style={st.iosFlecha}>›</Text> : marca === 'si' ? <Text style={st.iosMarca}>✓</Text> : null}
    </>
  );
}

/** El iPhone dibujado: una pantalla de la app Atajos, con lo que hay que tocar latiendo. */
function IphoneDibujado({ paso, llave, alTocar }: { paso: Paso; llave: boolean; alTocar: () => void }) {
  const { toca, pantalla } = paso;
  const fila = (texto: string, id?: Tocar) => (id ? (
    <Tocable id={id} toca={toca} alTocar={alTocar} style={st.iosFila} etiqueta={texto}><Fila texto={texto} /></Tocable>
  ) : (
    <View style={st.iosFila}><Fila texto={texto} /></View>
  ));
  const marca = (texto: string, si: boolean) => <View style={st.iosFila}><Fila texto={texto} marca={si ? 'si' : 'no'} /></View>;
  const barra = (titulo: string, derecha?: ReactNode) => (
    <View style={st.iosBarra}><Text style={st.iosTitulo}>{titulo}</Text>{derecha}</View>
  );
  const anadir = <Tocable id="anadir" toca={toca} alTocar={alTocar} style={st.iosPrincipal} radio={11} etiqueta={ios('anadir')}><Text style={st.iosPrincipalTexto}>{ios('anadir')}</Text></Tocable>;
  const ficha = (
    <View style={st.iosFicha}>
      <View style={st.iosGlifo} />
      <Text style={st.iosFichaNombre}>{ios('atajo')}</Text>
    </View>
  );
  let contenido: ReactNode;
  if (pantalla === 'moss') {
    contenido = (
      <View style={st.enMoss}>
        <Text style={st.mossNombre}>Moss</Text>
        <Text style={st.mossDetalle}>{t('sueno.afinar.cargador.titulo')}</Text>
        <Tocable id="instalar" toca={toca} alTocar={alTocar} style={st.mossBoton} radio={13} etiqueta={t('sueno.afinar.cargador.guia.conAtajos27.instalar.titulo')}>
          <Text style={st.mossBotonTexto}>{t('sueno.afinar.cargador.guia.conAtajos27.instalar.titulo')}</Text>
        </Tocable>
      </View>
    );
  } else if (pantalla === 'importarSimple') {
    contenido = <View style={st.iosHoja}>{ficha}{anadir}</View>;
  } else if (pantalla === 'importar' || pantalla === 'importarListo') {
    contenido = (
      <View style={st.iosHoja}>
        {ficha}
        <Text style={st.iosCuando}>{ios('cuando')}</Text>
        <Tocable id="llave" toca={toca} alTocar={alTocar} style={st.iosFila} etiqueta={ios('activar')}>
          <Text style={st.iosTexto}>{ios('activar')}</Text>
          <Llave prendida={llave || pantalla === 'importarListo'} />
        </Tocable>
        {anadir}
      </View>
    );
  } else if (pantalla === 'automatizaciones') {
    contenido = (
      <>
        {barra(ios('automatizacion'), <Tocable id="mas" toca={toca} alTocar={alTocar} style={st.iosMas} radio={13} etiqueta="+"><Text style={st.iosMasTexto}>+</Text></Tocable>)}
        <View style={st.iosVacio}><View style={[st.iosGlifo, st.iosGlifoChico]} /><Text style={st.iosVacioTexto}>{ios('nueva')}</Text></View>
        <View style={st.iosPestanas}><Text style={st.iosPestana}>{ios('atajos')}</Text><Text style={[st.iosPestana, st.iosPestanaActiva]}>{ios('automatizacion')}</Text></View>
      </>
    );
  } else if (pantalla === 'lista') {
    contenido = (
      <>
        {barra(ios('nueva'))}
        <View style={st.iosBuscar}><Text style={st.iosBuscarTexto}>{ios('buscar')}</Text></View>
        {fila(ios('alarma'))}
        {fila(ios('sueno'))}
        {fila(ios('cargador'), 'cargador')}
      </>
    );
  } else if (pantalla === 'marcar') {
    contenido = (
      <>
        {barra(ios('cargador'))}
        {marca(ios('conectado'), true)}
        {marca(ios('desconectado'), true)}
        <View style={st.iosEspacio} />
        {marca(ios('confirmar'), false)}
        {marca(ios('ejecutar'), true)}
        <Tocable id="siguiente" toca={toca} alTocar={alTocar} style={st.iosPrincipal} radio={11} etiqueta={ios('siguiente')}><Text style={st.iosPrincipalTexto}>{ios('siguiente')}</Text></Tocable>
      </>
    );
  } else if (pantalla === 'marcarConectado' || pantalla === 'marcarDesconectado') {
    contenido = (
      <>
        {barra(ios('cargador'))}
        {marca(ios('conectado'), pantalla === 'marcarConectado')}
        {marca(ios('desconectado'), pantalla === 'marcarDesconectado')}
        <View style={st.iosEspacio} />
        {marca(ios('confirmar'), false)}
        {marca(ios('ejecutar'), true)}
        <Tocable id="siguiente" toca={toca} alTocar={alTocar} style={st.iosPrincipal} radio={11} etiqueta={ios('siguiente')}><Text style={st.iosPrincipalTexto}>{ios('siguiente')}</Text></Tocable>
      </>
    );
  } else if (pantalla === 'accionConectado' || pantalla === 'accionDesconectado') {
    const accion = (clave: 'conectar' | 'desconectar' | 'alarma') => t(`sueno.afinar.atajos.cuales.${clave}.accion`);
    contenido = (
      <>
        {barra(ios('acciones'))}
        <View style={st.iosBuscar}><Text style={st.iosBuscarTexto}>Moss</Text></View>
        {fila(accion('conectar'), pantalla === 'accionConectado' ? 'accion' : undefined)}
        {fila(accion('desconectar'), pantalla === 'accionDesconectado' ? 'accion' : undefined)}
        {fila(accion('alarma'))}
      </>
    );
  } else {
    contenido = (
      <>
        {barra(ios('misAtajos'))}
        <View style={st.iosBuscar}><Text style={st.iosBuscarTexto}>{ios('buscar')}</Text></View>
        {fila(ios('otro1'))}
        {fila(ios('atajo'), 'atajo')}
        {fila(ios('otro2'))}
      </>
    );
  }
  return (
    <Aparece style={st.marco}>
      <Animated.View key={paso.id} entering={FadeInRight.duration(320)} exiting={FadeOut.duration(140)} style={[st.pantalla, pantalla === 'moss' && st.pantallaMoss, (pantalla === 'importar' || pantalla === 'importarListo' || pantalla === 'importarSimple') && st.pantallaHoja]}>
        {contenido}
      </Animated.View>
      <View style={st.isla} />
    </Aparece>
  );
}

function Llave({ prendida }: { prendida: boolean }) {
  const perilla = useAnimatedStyle(() => ({ transform: [{ translateX: withTiming(prendida ? 14 : 0, { duration: 240 }) }] }), [prendida]);
  const fondo = useAnimatedStyle(() => ({ backgroundColor: withTiming(prendida ? '#34c759' : '#bfc0c8', { duration: 240 }) }), [prendida]);
  return (
    <Animated.View style={[st.llave, fondo]}>
      <Animated.View style={[st.perilla, perilla]} />
    </Animated.View>
  );
}

/** Se monta de nuevo cada vez que se abre (`key`, en Afinar): lo que cuenta como probado es lo que llega desde entonces. */
export function GuiaCargador({ abierta, alCerrar }: { abierta: boolean; alCerrar: () => void }) {
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const version = versionDeLaGuia();
  const pasos = PASOS[version];
  // -1 es la presentación; después, cada paso; al final, probarlo.
  const [paso, setPaso] = useState(-1);
  const [llave, setLlave] = useState(false);
  const [mirando, setMirando] = useState(false);
  const [tarde, setTarde] = useState(false);
  const senales = useSenales(1);
  const [desde] = useState(() => Date.now());
  // A qué paso seguir al volver de Atajos.
  const alVolver = useRef<number | null>(null);
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enPrueba = paso >= pasos.length;

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active' || alVolver.current === null) return;
      setPaso(alVolver.current);
      alVolver.current = null;
    });
    return () => suscripcion.remove();
  }, []);

  useEffect(() => {
    if (!enPrueba) return;
    const id = setTimeout(() => setTarde(true), ESPERA_MS);
    return () => clearTimeout(id);
  }, [enPrueba]);

  const avanzar = () => {
    clearTimeout(espera.current);
    // La llave se prende a la vista y recién después sigue.
    if (pasos[paso]?.id === 'activar' && !llave) {
      setLlave(true);
      espera.current = setTimeout(() => setPaso((x) => x + 1), reducido ? 0 : LLAVE_MS);
      return;
    }
    // Mirándola no se instaló nada: vuelve al principio, a «Empezar».
    if (mirando && paso + 1 >= pasos.length) {
      setMirando(false);
      setLlave(false);
      setPaso(-1);
      return;
    }
    setPaso(paso + 1);
  };

  useEffect(() => {
    if (!mirando) return;
    const id = setTimeout(avanzar, MIRAR_MS);
    return () => clearTimeout(id);
    // Un paso cada MIRAR_MS: avanzar cambia en cada render, pero lo que marca el ritmo es el paso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mirando, paso, llave]);

  const empezar = () => {
    setLlave(false);
    setMirando(false);
    // Sin el enlace, se abre Atajos y la guía acompaña desde el primer paso.
    if (version === 'aMano') {
      setPaso(0);
      Linking.openURL('shortcuts://').catch(() => {});
      return;
    }
    // En iOS 27, lo de Atajos termina ahí: al volver, a probarlo. Hasta iOS 26, sigue la automatización.
    alVolver.current = version === 27 ? pasos.length : 1;
    setPaso(version === 27 ? 1 : 0);
    if (ATAJO_DEL_CARGADOR) Linking.openURL(ATAJO_DEL_CARGADOR).catch(() => {});
  };
  const atras = () => {
    clearTimeout(espera.current);
    setMirando(false);
    setLlave(false);
    setTarde(false);
    setPaso((x) => x - 1);
  };

  const llego = enPrueba ? senales?.filter((s) => (s.que === 'cargadorConectado' || s.que === 'cargadorDesconectado') && s.en >= desde).at(-1) : undefined;
  const horaDe = (ms: number) => { const f = new Date(ms); return horaDelDia(f.getHours() * 60 + f.getMinutes()); };
  const actual = paso >= 0 && !enPrueba ? pasos[paso] : null;

  return (
    <Modal visible={abierta} animationType={reducido ? 'fade' : 'slide'} onRequestClose={alCerrar}>
      <View style={[st.raiz, { paddingTop: insets.top + 8 }]}>
        <View style={st.arriba}>
          <View style={st.asa} />
          <Pressable onPress={alCerrar} style={st.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={8}>
            <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
          </Pressable>
        </View>
        <ScrollView style={st.cuerpo} contentContainerStyle={st.cuerpoAdentro} showsVerticalScrollIndicator={false}>
          {paso < 0 && (
            <Aparece key="presentacion">
              <Text style={st.titulo}>{t('sueno.afinar.cargador.guia.titulo')}</Text>
              <View style={st.puntos}>
                {lista('sueno.afinar.cargador.guia.puntos').map((texto) => (
                  <View key={texto} style={st.punto}>
                    <View style={st.rombo} />
                    <Text style={st.puntoTexto}>{texto}</Text>
                  </View>
                ))}
              </View>
              <Text style={st.chico}>{t(version === 'aMano' ? 'sueno.afinar.cargador.guia.minutoAMano' : 'sueno.afinar.cargador.guia.minuto')}</Text>
            </Aparece>
          )}
          {actual && (
            <>
              <Aparece key={`textos-${actual.id}`}>
                <Text style={st.cuenta}>{t('sueno.afinar.cargador.guia.paso', { n: paso + 1, total: pasos.length + 1 })}</Text>
                <Text style={st.titulo}>{t(`sueno.afinar.cargador.guia.${actual.clave}.titulo`)}</Text>
                <Text style={st.texto}>{t(`sueno.afinar.cargador.guia.${actual.clave}.texto`)}</Text>
              </Aparece>
              <IphoneDibujado paso={actual} llave={llave} alTocar={avanzar} />
            </>
          )}
          {enPrueba && (
            <Aparece key="probar" style={st.prueba}>
              <Text style={st.titulo}>{t('sueno.afinar.cargador.guia.probar.titulo')}</Text>
              <Text style={st.texto}>{t('sueno.afinar.cargador.guia.probar.texto')}</Text>
              <Animated.View key={llego ? 'llego' : tarde ? 'tarde' : 'esperando'} entering={FadeIn.duration(240)} style={st.estado} accessibilityLiveRegion="polite">
                <View style={[st.estadoPunto, llego && st.estadoPuntoLlego]} />
                <Text style={[st.estadoTexto, !!llego && st.estadoTextoLlego]}>
                  {llego ? t(llego.que === 'cargadorConectado' ? 'sueno.afinar.cargador.guia.probar.llego' : 'sueno.afinar.cargador.guia.probar.llegoDesconectado', { hora: horaDe(llego.en) })
                    : t(tarde ? 'sueno.afinar.cargador.guia.probar.noLlego' : 'sueno.afinar.cargador.guia.probar.esperando')}
                </Text>
              </Animated.View>
            </Aparece>
          )}
        </ScrollView>
        <View style={[st.pie, { paddingBottom: insets.bottom + 12 }]}>
          {paso < 0 && (
            <>
              <Aparece key="empezar">
                <Pressable onPress={empezar} style={({ pressed }) => [st.principal, pressed && st.principalApretado]} accessibilityRole="button">
                  <Text style={st.principalTexto}>{t('sueno.afinar.cargador.guia.empezar')}</Text>
                </Pressable>
              </Aparece>
              <Aparece key="mirar">
                <Pressable onPress={() => { setMirando(true); setLlave(false); setPaso(0); }} style={({ pressed }) => [st.secundario, pressed && st.apretado]} accessibilityRole="button">
                  <Text style={st.secundarioTexto}>{t('sueno.afinar.cargador.guia.mirar')}</Text>
                </Pressable>
              </Aparece>
            </>
          )}
          {paso >= 0 && !llego && (
            <Aparece key="fila" style={st.pieFila}>
              <Pressable onPress={atras} style={st.atras} accessibilityRole="button" hitSlop={6}>
                <Icono nombre="chevron.left" tam={14} color="rgba(239, 230, 207, 0.65)" peso="medium" />
                <Text style={st.atrasTexto}>{t('sueno.afinar.cargador.guia.atras')}</Text>
              </Pressable>
              {(version === 'aMano' || (version === 26 && paso >= 1)) && !enPrueba && !mirando && (
                <Aparece key="abrirAtajos">
                  <Pressable onPress={() => { Linking.openURL('shortcuts://').catch(() => {}); }} style={({ pressed }) => [st.abrirAtajos, pressed && st.principalApretado]} accessibilityRole="button">
                    <Text style={st.abrirAtajosTexto}>{t('sueno.afinar.atajos.abrir')}</Text>
                  </Pressable>
                </Aparece>
              )}
            </Aparece>
          )}
          {!!llego && (
            <Aparece key="listo">
              <Pressable onPress={alCerrar} style={({ pressed }) => [st.principal, pressed && st.principalApretado]} accessibilityRole="button">
                <Text style={st.principalTexto}>{t('sueno.afinar.cargador.guia.probar.listo')}</Text>
              </Pressable>
            </Aparece>
          )}
        </View>
      </View>
    </Modal>
  );
}

const IOS = '#0a66e4';
const st = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: '#0b1024' },
  arriba: { alignItems: 'center', minHeight: 36 },
  asa: { width: 38, height: 5, borderRadius: 3, marginTop: 4, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cerrar: { position: 'absolute', right: 12, top: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  cuerpo: { flex: 1 },
  cuerpoAdentro: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12 },
  titulo: { marginTop: 4, marginBottom: 6, fontFamily: 'CormorantGaramond_500Medium', fontSize: 24, lineHeight: 29, color: colores.pergamino },
  texto: { marginBottom: 12, minHeight: 40, fontFamily: letras.textoLiviano, fontSize: 14.5, lineHeight: 20, color: 'rgba(239, 230, 207, 0.78)' },
  cuenta: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colores.oroClaro },
  chico: { marginTop: 10, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  puntos: { marginTop: 14, gap: 12 },
  punto: { flexDirection: 'row', gap: 12 },
  rombo: { width: 6, height: 6, marginTop: 8, marginLeft: 4, transform: [{ rotate: '45deg' }], backgroundColor: colores.oroClaro },
  puntoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 15.5, lineHeight: 22, color: 'rgba(239, 230, 207, 0.86)' },
  pie: { gap: 8, paddingHorizontal: 22, paddingTop: 10 },
  pieFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  atras: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingRight: 8 },
  atrasTexto: { fontFamily: letras.texto, fontSize: 13.5, color: 'rgba(239, 230, 207, 0.65)' },
  abrirAtajos: { minHeight: 38, paddingHorizontal: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  abrirAtajosTexto: { fontFamily: letras.textoMedio, fontSize: 14, color: '#0b0f1d' },
  principal: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.pergamino },
  principalApretado: { backgroundColor: '#d9d0b8' },
  principalTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: '#0b0f1d' },
  secundario: { minHeight: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.2)' },
  secundarioTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  apretado: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  prueba: { flex: 1, justifyContent: 'center' },
  estado: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, padding: 14, borderRadius: 14, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  estadoPunto: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(239, 230, 207, 0.35)' },
  estadoPuntoLlego: { backgroundColor: colores.salvia },
  estadoTexto: { flex: 1, fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: 'rgba(239, 230, 207, 0.82)' },
  estadoTextoLlego: { color: colores.pergamino },
  // El iPhone dibujado.
  marco: { flex: 1, alignSelf: 'center', width: 232, minHeight: 330, maxHeight: 470, padding: 8, borderRadius: 34, backgroundColor: '#1b2033', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(239, 230, 207, 0.25)' },
  isla: { position: 'absolute', top: 15, alignSelf: 'center', width: 62, height: 16, borderRadius: 9, backgroundColor: '#000' },
  pantalla: { position: 'absolute', left: 8, right: 8, top: 8, bottom: 8, gap: 6, paddingTop: 34, paddingHorizontal: 10, paddingBottom: 14, borderRadius: 27, overflow: 'hidden', backgroundColor: '#f2f2f7' },
  pantallaMoss: { backgroundColor: '#0f1631', justifyContent: 'center' },
  pantallaHoja: { backgroundColor: '#dfe0e7', justifyContent: 'flex-end' },
  latido: { position: 'absolute', left: -2, right: -2, top: -2, bottom: -2, borderWidth: 2, borderColor: 'rgb(232, 150, 40)', shadowColor: 'rgb(232, 150, 40)', shadowOpacity: 0.6, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  enMoss: { alignItems: 'center', gap: 4 },
  mossNombre: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, lineHeight: 32, color: colores.pergamino },
  mossDetalle: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.6)' },
  mossBoton: { marginTop: 18, paddingVertical: 11, paddingHorizontal: 18, borderRadius: 13, backgroundColor: colores.pergamino },
  mossBotonTexto: { fontFamily: letras.textoMedio, fontSize: 13, color: '#0b0f1d' },
  iosHoja: { gap: 8 },
  iosBarra: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 26 },
  iosTitulo: { fontSize: 17, fontWeight: '700', color: '#15171f' },
  iosMas: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  iosMasTexto: { fontSize: 22, lineHeight: 24, color: IOS },
  iosFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, minHeight: 34, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#fff' },
  iosTexto: { flexShrink: 1, fontSize: 12, color: '#15171f' },
  iosFlecha: { fontSize: 12, color: '#a1a1aa' },
  iosMarca: { fontSize: 12, fontWeight: '600', color: IOS },
  iosBuscar: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9, backgroundColor: '#e4e4ea' },
  iosBuscarTexto: { fontSize: 12, color: '#7c7c85' },
  iosEspacio: { height: 6 },
  iosVacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  iosVacioTexto: { fontSize: 12, color: '#7c7c85' },
  iosPestanas: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, borderTopWidth: 1, borderColor: '#d8d8de' },
  iosPestana: { fontSize: 10.5, color: '#7c7c85' },
  iosPestanaActiva: { fontWeight: '600', color: IOS },
  iosFicha: { alignItems: 'center', gap: 8, paddingTop: 14, paddingHorizontal: 8, paddingBottom: 8 },
  iosFichaNombre: { fontSize: 14, fontWeight: '600', color: '#15171f' },
  iosGlifo: { width: 42, height: 42, borderRadius: 11, backgroundColor: '#8a6ad0' },
  iosGlifoChico: { width: 30, height: 30, borderRadius: 8, opacity: 0.7 },
  iosCuando: { marginHorizontal: 2, fontSize: 11, lineHeight: 14, textAlign: 'center', color: '#5c5c66' },
  iosPrincipal: { minHeight: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: IOS },
  iosPrincipalTexto: { fontSize: 13, fontWeight: '600', color: '#fff' },
  llave: { width: 34, height: 20, borderRadius: 10 },
  perilla: { position: 'absolute', top: 2, left: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff' },
});
