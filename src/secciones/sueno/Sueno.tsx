// Sueño, el de la galería (galeria/src/sueno.js; spec/sueno.md): lo que Salud trae de cada noche, con las reglas
// de src/dominio/sueno.ts, sobre una noche oscura con auroras. Arriba, la pregunta de la mañana y la deuda, el
// número con su palabra, compacta, con lo que necesitas y «Más»; debajo, tu periodo de melatonina con la hora de
// acostarte y la nota de lo pendiente; después la noche en un arco y, debajo, tu energía de ahora; las
// dos semanas para elegir otra noche, su calidad en un anillo, el horario, lo que mide el reloj y de dónde sale
// cada dato. Sin reloj, las noches que estima Moss con el teléfono (spec/sueno.md, «Sin reloj»). Sin noches, la
// invitación y, en cada tarjeta, el ejemplo marcado como ejemplo con cuánto falta. Lo que falta va en gris: nunca
// se inventa. Arriba de todo, tirar para abajo vuelve a leer Salud.

import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ReduceMotion, useAnimatedRef, useReducedMotion, useScrollOffset } from 'react-native-reanimated';

import { actualizarSalud } from '@/almacen';
import { reglasDeCuidados } from '@/almacen/almacen';
import { CON_ASCENT } from '@/lib/banderas';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import { edadDe } from '@/dominio/metas';
import { deudaDeSueno, pocoSuenoSostenido, ultimasNoches, type Noche } from '@/dominio/sueno';
import { saludPedida } from '@/salud/salud';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { alTocarDeNuevo, useEsLaActual } from '../arriba';
import { PESTANAS } from '../Barra';
import { duracion, fechaCorta, fechaDiaMes, useEstado } from '../comida/datos';
import { DE_LA_NOCHE, FranjaBajoLaHora } from '../franja';
import { useSueno } from '../ganchos';
import type { Sueno } from '../persona';
import { Aparece, Cabecera } from '../tarjetas';
import { RecuperacionEnSueno } from '../ascent/EnSueno';
import { Afinar } from './Afinar';
import { CartaDeSueno, Crece, degradado, letraDe, Nota, SN, Texto } from './comunes';
import { LaDeuda } from './Deuda';
import { ElHorario, LaCalidad, LasFuentes, LoDelReloj, VitalesSinReloj } from './Detalle';
import { TarjetaDeEnergia, useEnergia, useIrAEnergia } from './Energia';
import { ElMovimiento, Invitacion, LaNoche, LaNocheDeMoss, SinNoche } from './LaNoche';
import { LaManana } from './Manana';
import { conPendientes, FilaDePendientes, LaNota, useAbrirLaNota } from './Pendientes';
import { ElPeriodo } from './Periodo';

const DIAS = 14;
const SUENO = PESTANAS.indexOf('sueno');

// ------------------------------------------------------------------ volver a leer Salud
// Arriba de todo, tirar para abajo vuelve a leer Salud (aprobado en la galería 46, Detalles.tirar): la
// ruedita de iOS gira mientras lee; al terminar, «Al día con Salud» un momento en su lugar, y la página sube.

/** Cómo va: girando, con «Al día con Salud» en el lugar de la ruedita, o con la página subiendo otra vez. */
type Lectura = 'quieta' | 'leyendo' | 'alDia' | 'subiendo';
/** La ruedita, del color de la de la galería. */
const PERGAMINO = '239, 230, 207';
const ALFA_DE_LA_RUEDITA = 0.85;
/** Al terminar, la ruedita se apaga en estos pasos, de a 50 ms: iOS no deja fundirla, pero sí cambiarle el color. */
const APAGAR = [0.6, 0.35, 0.12, 0];
/** Lo mínimo que gira: si Salud contesta enseguida, no es un parpadeo. */
const GIRA_AL_MENOS = 700;
/** Cuánto queda «Al día con Salud» antes de que la página vuelva a subir, como en la galería. */
const AL_DIA_MS = 1000;
/** Lo que tarda iOS en subir la página: hasta entonces la ruedita sigue apagada, si no reaparece al irse. */
const SUBE_MS = 600;
/** El alto que iOS le da a la ruedita mientras gira: «Al día con Salud» va en su medio. */
const ALTO_DE_LA_RUEDITA = 60;

function useLeerSalud() {
  const [lectura, setLectura] = useState<Lectura>('quieta');
  // Cada lectura lleva su número: una que empieza mientras la anterior termina deja sin efecto a la anterior.
  const vez = useRef(0);
  const esperas = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pendientes = esperas.current;
    return () => {
      vez.current += 1;
      pendientes.forEach(clearTimeout);
      pendientes.clear();
    };
  }, []);
  const esperar = (ms: number) => new Promise<void>((listo) => {
    const id = setTimeout(() => {
      esperas.current.delete(id);
      listo();
    }, ms);
    esperas.current.add(id);
  });
  const leer = async () => {
    vez.current += 1;
    const esta = vez.current;
    // Al armarse vibra como el tope de deslizar: desde iOS 17.4, la ruedita de React Native no vibra sola.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLectura('leyendo');
    anunciar(t('sueno.leer.leyendo'));
    const [, pedida] = await Promise.all([actualizarSalud().catch(() => {}), saludPedida(), esperar(GIRA_AL_MENOS)]);
    if (esta !== vez.current) return;
    // Sin Salud pedida no se leyó nada de ahí (sí la noche del teléfono): la ruedita se va sin decir que está al día.
    if (!pedida) {
      setLectura('quieta');
      return;
    }
    setLectura('alDia');
    anunciar(t('sueno.leer.listo'));
    await esperar(AL_DIA_MS);
    if (esta !== vez.current) return;
    setLectura('subiendo');
    await esperar(SUBE_MS);
    if (esta === vez.current) setLectura('quieta');
  };
  return { lectura, leer };
}

/** La ruedita de iOS, debajo de la hora (`arriba`). Con «Al día con Salud» se apaga y queda así mientras la página sube. */
function Ruedita({ lectura, alLeer, arriba }: { lectura: Lectura; alLeer: () => void; arriba: number }) {
  const apagada = lectura === 'alDia' || lectura === 'subiendo';
  const [paso, setPaso] = useState(0);
  const [antes, setAntes] = useState(apagada);
  if (apagada !== antes) {
    setAntes(apagada);
    setPaso(0);
  }
  useEffect(() => {
    if (!apagada) return;
    const pasos = APAGAR.map((_, i) => setTimeout(() => setPaso(i + 1), (i + 1) * 50));
    return () => pasos.forEach(clearTimeout);
  }, [apagada]);
  const alfa = apagada && paso > 0 ? APAGAR[paso - 1] : ALFA_DE_LA_RUEDITA;
  return (
    <RefreshControl
      refreshing={lectura === 'leyendo' || lectura === 'alDia'}
      onRefresh={alLeer}
      tintColor={`rgba(${PERGAMINO}, ${alfa})`}
      // El scroll empieza arriba de todo: sin correrla, la ruedita quedaba debajo de la isla.
      progressViewOffset={arriba}
    />
  );
}

// ------------------------------------------------------------ la noche de fondo
// Casi negra, con algo del cielo detrás; arriba, la aurora: manchas suaves de verde agua, un poco de celeste y de
// violeta, quietas (lo pediste el 2/11/2026: «como Alaska», sin nieve, que se note que es de noche).
const NOCHE_DE_FONDO = 'linear-gradient(180deg, rgba(4, 8, 18, 0.93) 0%, rgba(5, 9, 22, 0.95) 46%, rgba(3, 5, 13, 0.97) 100%)';
const AURORA = [
  'radial-gradient(70% 34% at 50% -6%, rgba(36, 120, 112, 0.18) 0%, rgba(36, 120, 112, 0) 74%)',
  'radial-gradient(40% 22% at 24% 16%, rgba(52, 196, 158, 0.16) 0%, rgba(52, 196, 158, 0) 100%)',
  'radial-gradient(32% 18% at 52% 9%, rgba(64, 170, 196, 0.12) 0%, rgba(64, 170, 196, 0) 100%)',
  'radial-gradient(38% 22% at 78% 15%, rgba(112, 104, 226, 0.12) 0%, rgba(112, 104, 226, 0) 100%)',
].join(', ');

function Fondo() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, degradado(NOCHE_DE_FONDO)]} />
      <View style={[st.aurora, degradado(AURORA)]} />
    </View>
  );
}

export function PaginaDeSueno({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  const s = useSueno();
  const energia = useEnergia();
  // Sin elegir, la de hoy: pasada la medianoche sigue siendo la de hoy, no la de ayer.
  const [elegida, setElegida] = useState<ClaveDia | null>(null);
  const clave = elegida ?? e.hoy;
  // Sin noches tuyas, las de ejemplo van solo como ejemplo, en cada tarjeta.
  const conNoches = !s.deEjemplo;
  const reales = conNoches ? s.noches : [];
  const muestra = conNoches ? [] : ultimasNoches(s.noches, e.hoy, DIAS);
  const deMuestra = [...muestra].reverse().find((x): x is Noche => !!x) ?? null;
  // Las dos semanas antes de una noche: con eso se miden el horario de siempre y lo tuyo.
  const anterioresA = (c: ClaveDia) => ultimasNoches(s.noches, sumarDias(c, -1), DIAS);
  const noche = conNoches ? (s.noches.find((n) => n.clave === clave) ?? null) : null;
  const deHoy = reales.find((n) => n.clave === e.hoy) ?? null;
  const delDetalle = noche ?? deMuestra;
  const interior = ancho - 40 - 34;
  const primera = reales.length ? reales.reduce((a, n) => (n.clave < a ? n.clave : a), reales[0].clave) : null;
  // Antes de los 18 el umbral de poco sueño es otro, y el texto también.
  const edad = e.perfil ? edadDe(e.perfil, e.hoy) : undefined;
  const menor = edad !== undefined && edad < 18;
  const reducido = useReducedMotion();
  const animar = !reducido;
  const esLaActual = useEsLaActual(SUENO);
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  // Tocar otra vez la pestaña sube arriba de todo.
  useEffect(() => alTocarDeNuevo(SUENO, () => scroll.current?.scrollTo({ y: 0, animated: !reducido })), [reducido, scroll]);
  const { lectura, leer } = useLeerSalud();
  // Desde el globo de Inicio: la noche de hoy, y baja suave hasta tu energía cuando la sección ya se deslizó; la tarjeta brilla.
  const yDeLaEnergia = useRef<number | null>(null);
  const [resaltar, setResaltar] = useState(0);
  const irAEnergia = useCallback(() => {
    setElegida(null);
    setResaltar((n) => n + 1);
    setTimeout(() => {
      if (yDeLaEnergia.current !== null) scroll.current?.scrollTo({ y: Math.max(0, yDeLaEnergia.current - 70), animated: !reducido });
    }, reducido ? 0 : 380);
  }, [reducido, scroll]);
  useIrAEnergia(irAEnergia);
  // La nota de lo pendiente: se abre desde su fila o, desde afuera, con el aviso de la noche (abrirLaNota).
  const [nota, setNota] = useState(false);
  const [pedida, setPedida] = useState(0);
  const abrirNota = useCallback(() => {
    setElegida(null);
    setPedida((n) => n + 1);
  }, []);
  useAbrirLaNota(abrirNota);
  useEffect(() => {
    if (!pedida) return;
    // Un momento después: la sección ya se deslizó, y la hoja que estuviera abierta ya se cerró (iOS no abre una
    // mientras cierra otra).
    const espera = setTimeout(() => setNota(true), 420);
    return () => clearTimeout(espera);
  }, [pedida]);
  // Tu periodo de melatonina de esta noche (melatonina.ts), con tus noches y tu margen para dormirte; sin noches
  // tuyas, el de la persona de ejemplo, sin deuda.
  const deudaDeHoy = conNoches ? deudaDeSueno(ultimasNoches(s.noches, e.hoy, DIAS), s.necesidad) : null;
  const periodo = periodoDeMelatonina(s.noches, e.hoy, { margen: e.latencia, deuda: deudaDeHoy?.minutos ?? null });
  const reflujo = !!reglasDeCuidados(e)?.cuidados.includes('reflujo');
  const conEnergia = clave === e.hoy && conNoches && !!energia;
  return (
    <View style={{ width: ancho }}>
      <Fondo />
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }}
        showsVerticalScrollIndicator={false}
        scrollsToTop={esLaActual}
        scrollEventThrottle={16}
        // En la web no hay Salud que leer.
        refreshControl={Platform.OS === 'ios' ? <Ruedita lectura={lectura} alLeer={leer} arriba={arriba} /> : undefined}
      >
        <Cabecera fecha={fechaCorta(e.hoy)} titulo={t('sueno.titulo')} />
        {/* Sin noches, primero lo que hace que aparezcan; la pregunta de la mañana va después. */}
        {!conNoches && <Aparece><Invitacion muestra={muestra} ancho={interior} /></Aparece>}
        <LaManana hoy={e.hoy} noche={deHoy} propia={e.noches.get(e.hoy)} noches={reales} ancho={interior} desde={e.metas[0]?.desde ?? null} />
        {/* La deuda, arriba de todo (5/11, a la noche): es lo primero que se mira. */}
        <LaDeuda noches={reales} hoy={e.hoy} clave={clave} necesidad={s.necesidad} edad={edad} conNoches={conNoches} muestra={muestra} acostarse={periodo?.acostarse ?? null} reflujo={reflujo} animar={animar} />
        {/* Debajo, lo de esta noche (17/11): tu periodo de melatonina y, con su aviso activado, la nota de lo pendiente. */}
        {clave === e.hoy && (
          <Aparece>
            <ElPeriodo periodo={periodo} noches={reales} hoy={e.hoy} conNoches={conNoches} />
            {conPendientes(e) && <Aparece><FilaDePendientes alTocar={() => setNota(true)} /></Aparece>}
          </Aparece>
        )}
        {/* Poco sueño por semanas: la sugerencia de un médico, arriba. Una estimación, no un diagnóstico. */}
        {conNoches && pocoSuenoSostenido(ultimasNoches(s.noches, e.hoy, DIAS), edad) && (
          <Aparece>
            <CartaDeSueno titulo={t('sueno.pocoSueno.titulo')}>
              <Texto>{t(menor ? 'sueno.pocoSueno.textoMenor' : 'sueno.pocoSueno.texto')}</Texto>
              <Nota>{t('sueno.pocoSueno.nota')}</Nota>
            </CartaDeSueno>
          </Aparece>
        )}
        {CON_ASCENT && clave === e.hoy && <RecuperacionEnSueno />}
        {/* Elegir otra noche no cambia todo de golpe: lo de esa noche entra con un fundido. */}
        {conNoches && (
          <Aparece key={`noche-${clave}`}>
            {noche?.moss ? (
              <LaNocheDeMoss n={noche} hoy={e.hoy} propia={e.noches.get(noche.clave)} ancho={interior} lista={ultimasNoches(s.noches, clave, DIAS)} animar={animar} />
            ) : noche ? (
              <LaNoche n={noche} hoy={e.hoy} ancho={interior} anteriores={anterioresA(noche.clave)} lista={ultimasNoches(s.noches, clave, DIAS)} animar={animar} />
            ) : (
              <SinNoche clave={clave} hoy={e.hoy} cama={s.soloEnCama.get(clave)} ancho={interior} />
            )}
            {noche?.moss && <ElMovimiento />}
          </Aparece>
        )}
        {/* Tu energía vive acá (5/11, a la noche), con la noche de hoy: la de ahora, según la hora. */}
        {conEnergia && energia && (
          <Aparece>
            <View onLayout={(ev) => { yDeLaEnergia.current = ev.nativeEvent.layout.y; }}>
              <TarjetaDeEnergia datos={energia} ancho={interior} resaltar={resaltar} />
            </View>
          </Aparece>
        )}
        {/* Los días, para elegir otra noche: más abajo (5/11, a la noche). */}
        <Tira s={s} reales={reales} conNoches={conNoches} hoy={e.hoy} elegida={clave} primera={primera} alElegir={(c) => setElegida(c === e.hoy ? null : c)} />
        <Aparece key={`detalle-${clave}`}>
          {delDetalle && (
            <LaCalidad
              n={delDetalle}
              necesidad={s.necesidad}
              anteriores={anterioresA(delDetalle.clave)}
              conNoches={conNoches}
              cara={conNoches ? (e.noches.get(clave)?.cara ?? null) : null}
              animar={animar}
            />
          )}
          <ElHorario noches={conNoches ? ultimasNoches(s.noches, clave, DIAS) : muestra} fin={conNoches ? clave : e.hoy} elegida={clave} conNoches={conNoches} primera={primera} animar={animar} />
          {noche?.moss ? <VitalesSinReloj /> : delDetalle ? <LoDelReloj n={delDetalle} s={s} conNoches={conNoches} /> : null}
        </Aparece>
        {/* Sin reloj ni anillo en las dos semanas: lo que le da a Moss horas exactas (spec/sueno-sin-esfuerzo.md). */}
        {!reales.some((n) => !n.moss && n.clave >= sumarDias(e.hoy, -DIAS) && (n.fuente.tipo === 'reloj' || n.fuente.tipo === 'otra')) && (
          <Aparece>
            <Afinar hoy={e.hoy} />
          </Aparece>
        )}
        <LasFuentes n={noche} s={s} clave={clave} conNoches={conNoches} />
        <Text style={st.pie}>{t('sueno.noMedico')}</Text>
      </ScrollView>
      <FranjaBajoLaHora scrollY={scrollY} arriba={arriba} rgb={DE_LA_NOCHE} />
      {nota && <LaNota alCerrar={() => setNota(false)} />}
      {/* En el lugar de la ruedita, que ya se apagó: la fecha está más abajo, con la página bajada. VoiceOver ya lo dijo. */}
      {lectura === 'alDia' && (
        <Animated.View
          entering={FadeIn.duration(250).reduceMotion(ReduceMotion.Never)}
          exiting={FadeOut.duration(250).reduceMotion(ReduceMotion.Never)}
          style={[st.alDia, { top: arriba }]}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={st.alDiaTexto} numberOfLines={1} maxFontSizeMultiplier={1.3}>{t('sueno.leer.listo')}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// ------------------------------------------------------------ las dos semanas, para elegir
const BARRA = 'linear-gradient(180deg, #a8e2f0, #6b8ff0 52%, #5a5fd0)';
const BARRA_LLEGO = 'linear-gradient(180deg, #8adbc8, #4fa6c8 46%, #5a78d8)';
const BARRA_VACIA = 'repeating-linear-gradient(135deg, rgba(196, 212, 246, 0.2) 0px, rgba(196, 212, 246, 0.2) 2px, rgba(196, 212, 246, 0) 2px, rgba(196, 212, 246, 0) 5px)';

function Tira({ s, reales, conNoches, hoy, elegida, primera, alElegir }: {
  s: Sueno; reales: Noche[]; conNoches: boolean; hoy: ClaveDia; elegida: ClaveDia; primera: ClaveDia | null; alElegir: (c: ClaveDia) => void;
}) {
  // Las dos semanas que terminan hoy o, si la noche elegida es más vieja, las de alrededor.
  const fin = elegida > sumarDias(hoy, -DIAS) ? hoy : sumarDias(elegida, 6);
  const noches = ultimasNoches(reales, fin, DIAS);
  const maximo = Math.max(s.necesidad + 60, ...noches.flatMap((n) => (n ? [n.dormido + n.siestas] : [])));
  const recientes = reales.filter((n) => n.clave > sumarDias(hoy, -DIAS)).length;
  return (
    <View style={st.tira}>
      {/* Elegir otra noche de las mismas catorce no vuelve a hacer crecer las barras: crecen al cambiar las catorce. */}
      <View key={fin} style={st.tiraFila}>
        {noches.map((n, i) => {
          const clave = sumarDias(fin, i - DIAS + 1);
          const cama = !n && conNoches ? s.soloEnCama.get(clave) : undefined;
          // Antes de la primera noche no hay nada que mirar: todavía no estabas.
          const antes = !n && !cama && (primera === null || clave < primera);
          const alto = n ? Math.max(6, (n.dormido / maximo) * 100) : cama ? Math.max(6, (cama.minutos / maximo) * 100) : 100;
          const llego = !!n && n.dormido + n.siestas >= s.necesidad;
          const esta = clave === elegida && conNoches;
          // Para VoiceOver, cada noche con cuánto dormiste: la barra no se lee.
          const cuanto = n ? `${duracion(n.dormido)} ${t(n.moss?.origen === 'estimada' ? 'sueno.dormidoAprox' : 'sueno.dormido')}`
            : cama ? `${duracion(cama.minutos)}, ${t('sueno.enCama').toLowerCase()}` : t('sueno.sinDatos');
          return (
            <Pressable
              key={clave}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                alElegir(clave);
              }}
              disabled={antes}
              style={({ pressed }) => [st.noche, esta && st.nocheElegida, pressed && !esta && st.nocheApretada]}
              accessibilityRole="button"
              accessibilityState={{ selected: esta, disabled: antes }}
              accessibilityLabel={`${t('sueno.elegirNoche', { fecha: fechaDiaMes(clave) })}, ${cuanto}`}
            >
              <View style={st.barra}>
                {!antes && (
                  <Crece
                    animar={!!n}
                    i={i}
                    style={[st.barraLlena, { height: `${alto}%` }, n ? degradado(llego ? BARRA_LLEGO : BARRA) : cama ? st.barraCama : degradado(BARRA_VACIA), n?.moss?.origen === 'estimada' && st.barraEstimada]}
                  />
                )}
                <View style={[st.barraMeta, { bottom: `${(s.necesidad / maximo) * 100}%` }]} />
              </View>
              {/* Catorce columnas en el ancho de la pantalla: con el texto grande, crecen poco. */}
              <Text style={[st.nocheLetra, esta && st.nocheTextoElegido]} maxFontSizeMultiplier={1.25}>{letraDe(clave)}</Text>
              <Text style={[st.nocheNumero, esta && st.nocheTextoElegido]} maxFontSizeMultiplier={1.25}>{Number(clave.slice(8))}</Text>
            </Pressable>
          );
        })}
      </View>
      {!recientes ? <Text style={st.tiraNota}>{t('sueno.vacio.tira')}</Text>
        : recientes < 3 ? <Text style={st.tiraNota}>{plural('sueno.vacio.tiraPocas', recientes)}</Text> : null}
    </View>
  );
}

const st = StyleSheet.create({
  aurora: { position: 'absolute', left: 0, right: 0, top: 0, height: 520 },
  alDia: { position: 'absolute', left: 0, right: 0, height: ALTO_DE_LA_RUEDITA, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  alDiaTexto: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.55)' },
  tira: { marginTop: 12, paddingTop: 10, paddingHorizontal: 6, paddingBottom: 8, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(150, 178, 240, 0.1)', backgroundColor: 'rgba(12, 20, 46, 0.42)' },
  tiraFila: { flexDirection: 'row', gap: 3 },
  tiraNota: { marginTop: 6, marginHorizontal: 4, textAlign: 'center', fontFamily: letras.texto, fontSize: 12, color: SN.texto },
  noche: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 3, paddingBottom: 4, borderRadius: 9 },
  nocheElegida: { backgroundColor: 'rgba(150, 178, 240, 0.18)' },
  nocheApretada: { backgroundColor: 'rgba(150, 178, 240, 0.08)' },
  barra: { width: 10, height: 54, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: 'rgba(150, 178, 240, 0.1)' },
  barraLlena: { width: '100%', borderRadius: 5 },
  barraCama: { backgroundColor: 'transparent', borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(196, 212, 246, 0.45)' },
  barraEstimada: { opacity: 0.72 },
  barraMeta: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.5)' },
  nocheLetra: { fontFamily: letras.textoMedio, fontSize: 9, letterSpacing: 0.4, color: SN.tenue },
  nocheNumero: { fontFamily: letras.numeroMedio, fontSize: 10.5, color: SN.tenue, fontVariant: ['tabular-nums'] },
  nocheTextoElegido: { color: colores.pergamino },
  pie: { marginTop: 18, marginHorizontal: 4, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, lineHeight: 17, color: SN.tenue },
});
