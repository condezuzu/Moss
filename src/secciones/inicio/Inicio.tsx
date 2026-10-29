// Inicio, el de la galería (galeria/src/inicio.js; especificación, cambio 9): lo primero que se ve,
// hecho de bloques que cada uno elige y ordena. De fábrica: las calorías y los macros que quedan,
// el progreso al objetivo, el peso con el balance y el día en el cielo; el sueño de anoche y el agua
// están para sumarlos. Tocar un bloque lleva a su sección.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { useCieloDeHoy, useEncendidos } from '@/cielo/dia';
import { decimal } from '@/comida/porciones';
import { pesoCorporalEn } from '@/dominio/cantidades';
import { estadoDeMacro } from '@/dominio/metas';
import { calidadDeNoche, ultimasNoches } from '@/dominio/sueno';
import { aguaDelDia } from '@/dominio/registros';
import { sumarDias } from '@/dominio/fechas';
import { idioma, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { COLOR_DE_MACRO, Icono, MACROS, Punto } from '../comida/comunes';
import { conSigno, duracion, fechaCorta, fechaDiaMes, horaDelDia, metaDelDia, numero, sistemaDe, totalDe, useEstado } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { usePersona, useSueno } from '../ganchos';
import { ACOMODA, Aparece, Camino } from '../tarjetas';
import { Relleno, useCuenta, Vaso } from '../animados';
import { Balance, Hipnograma, Linea, MiniCielo } from '../graficos/Graficos';

export const BLOQUES = ['calorias', 'objetivo', 'peso', 'cielo', 'sueno', 'agua'] as const;
export type Bloque = (typeof BLOQUES)[number];
const DE_FABRICA: Bloque[] = ['calorias', 'objetivo', 'peso', 'cielo'];
// Adónde lleva cada bloque: las secciones de la barra.
const SECCION: Partial<Record<Bloque, number>> = { calorias: 1, objetivo: 2, peso: 2, cielo: 4, sueno: 3 };
const VASO_ML = 250;
const VASOS_META = 8;

/** Lo elegido, con lo que falte al final (un bloque nuevo aparece apagado). */
function preferencias(guardadas: { orden: string[]; visibles: string[] } | null): { orden: Bloque[]; visibles: Set<Bloque> } {
  if (!guardadas) return { orden: [...BLOQUES], visibles: new Set(DE_FABRICA) };
  const orden = [...guardadas.orden.filter((b): b is Bloque => (BLOQUES as readonly string[]).includes(b)), ...BLOQUES.filter((b) => !guardadas.orden.includes(b))];
  return { orden, visibles: new Set(guardadas.visibles.filter((b): b is Bloque => (BLOQUES as readonly string[]).includes(b))) };
}

export function PaginaDeInicio({ ancho, arriba, abajo, alIr }: { ancho: number; arriba: number; abajo: number; alIr: (seccion: number) => void }) {
  const e = useEstado();
  const [personalizando, setPersonalizando] = useState(false);
  const { orden, visibles } = useMemo(() => preferencias(e.inicio), [e.inicio]);
  const anchoGrafico = Math.min(150, (ancho - 40 - 32) * 0.45);
  const bloques: Record<Bloque, () => ReactNode> = {
    calorias: () => <Calorias />,
    objetivo: () => <Objetivo />,
    peso: () => <Peso anchoGrafico={anchoGrafico} />,
    cielo: () => <Cielo ancho={ancho - 40 - 32} />,
    sueno: () => <SuenoDeAnoche anchoGrafico={anchoGrafico} />,
    agua: () => <Agua />,
  };
  return (
    <View style={{ width: ancho }}>
      <ScrollView contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={estilos.fecha}>{fechaCorta(e.hoy)}</Text>
        <Text style={estilos.titulo}>{t('inicio.titulo')}</Text>
        {orden.filter((b) => visibles.has(b)).map((b) => {
          const seccion = SECCION[b];
          // Sumar, sacar u ordenar bloques en Personalizar nunca es de golpe: entran, salen y se acomodan.
          return (
            <Animated.View key={b} entering={FadeIn.duration(320)} exiting={FadeOut.duration(200)} layout={ACOMODA}>
              {seccion === undefined ? (
                // El agua no lleva a ninguna sección: es un bloque quieto, con su botón.
                <View style={estilos.bloque}>{bloques[b]()}</View>
              ) : (
                <Pressable
                  onPress={() => alIr(seccion)}
                  style={({ pressed }) => [estilos.bloque, b === 'cielo' && estilos.bloqueCielo, pressed && estilos.apretado]}
                  accessibilityRole="button"
                  accessibilityLabel={t(`inicio.bloques.${b}`)}
                >
                  {bloques[b]()}
                </Pressable>
              )}
            </Animated.View>
          );
        })}
        <View style={estilos.pie}>
          <Pressable onPress={() => setPersonalizando(true)} style={estilos.personalizar} accessibilityRole="button">
            <Icono nombre="line.3.horizontal" tam={15} color="rgba(239, 230, 207, 0.72)" />
            <Text style={estilos.personalizarTexto}>{t('inicio.personalizar')}</Text>
          </Pressable>
        </View>
      </ScrollView>
      <Personalizar abierta={personalizando} orden={orden} visibles={visibles} alCerrar={() => setPersonalizando(false)} />
    </View>
  );
}

function Cabeza({ titulo, derecha }: { titulo: string; derecha?: ReactNode }) {
  return (
    <View style={estilos.cabeza}>
      <Text style={estilos.cabezaTitulo}>{titulo}</Text>
      {derecha}
    </View>
  );
}

const Chip = ({ texto, tipo }: { texto: string; tipo?: 'bien' | 'atencion' | 'tenue' }) => (
  <Text style={[estilos.chip, tipo === 'bien' && estilos.chipBien, tipo === 'atencion' && estilos.chipAtencion]}>{texto}</Text>
);

// ------------------------------------------------------------------ calorías y macros: lo que queda
function Calorias() {
  const e = useEstado();
  const numeros = e.numeros;
  const meta = metaDelDia(e, e.hoy);
  const comido = totalDe(e.registros, e.hoy, e.hoy);
  if (!meta) {
    return (
      <View style={estilos.calArriba}>
        <Luna tam={124} fraccion={0} />
        <View style={estilos.calCifra}>
          <Text style={estilos.calEtiqueta}>{t('inicio.bloques.calorias')}</Text>
          {numeros && <Text style={estilos.calNumero}>{numero(Math.round(comido.kcal))}</Text>}
          <Text style={estilos.nota}>{t('comida.sinMeta')}</Text>
        </View>
      </View>
    );
  }
  return <CaloriasConMeta numeros={numeros} comido={comido} meta={meta} />;
}

// Aparte, así el hook de la cifra que cuenta no depende de si hay meta.
function CaloriasConMeta({ numeros, comido, meta }: { numeros: boolean; comido: ReturnType<typeof totalDe>; meta: NonNullable<ReturnType<typeof metaDelDia>> }) {
  const queda = meta.kcal - comido.kcal;
  // Al anotar, «te quedan» cuenta hasta lo nuevo en vez de saltar.
  const cifra = useCuenta(Math.abs(Math.round(queda)));
  return (
    <>
      <View style={estilos.calArriba}>
        <Luna tam={124} fraccion={comido.kcal / meta.kcal} />
        {numeros && (
          <Aparece style={estilos.calCifra}>
            <Text style={estilos.calEtiqueta}>{t(queda >= 0 ? 'inicio.teQuedan' : 'inicio.deMas')}</Text>
            <Text style={estilos.calNumero}>{numero(Math.round(cifra))}</Text>
            <Text style={estilos.calDe}>{t('inicio.kcalDe', { comido: numero(Math.round(comido.kcal)), meta: numero(meta.kcal) })}</Text>
          </Aparece>
        )}
      </View>
      <View style={estilos.macros}>
        {MACROS.map((m) => {
          const estado = estadoDeMacro(comido[m], meta[m]);
          const resto = meta[m] - comido[m];
          const valor = estado === 'falta' ? t('inicio.gramos', { n: numero(Math.round(resto)) }) : estado === 'pasado' ? t('inicio.gramos', { n: `+${numero(Math.round(-resto))}` }) : t('inicio.listo');
          return (
            <View key={m} style={estilos.macro}>
              <View style={estilos.macroNombre}>
                <View style={{ opacity: estado === 'falta' ? 0.55 : 1 }}>
                  <Punto macro={m} />
                </View>
                <Text style={estilos.macroNombreTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t(`comida.${m}`)}</Text>
              </View>
              {numeros && <Text style={estilos.macroValor}>{valor}</Text>}
              <View style={estilos.barra}>
                <Relleno fraccion={comido[m] / meta[m]} style={[estilos.barraLlena, { backgroundColor: COLOR_DE_MACRO[m], opacity: estado === 'falta' ? 0.75 : 1 }]} />
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
}

// ------------------------------------------------------------------ el progreso al objetivo
function Objetivo() {
  const p = usePersona();
  const e = useEstado();
  const sistema = sistemaDe(e);
  const kg = (x: number, dec = 1) => {
    const v = pesoCorporalEn(x, sistema);
    return `${numero(v.valor, dec)} ${v.unidad}`;
  };
  const unidad = pesoCorporalEn(1, sistema).unidad;
  const g = p.progreso;
  const metaKg = p.perfil.pesoMeta;
  const bien = g.estado === 'enCamino' || g.estado === 'llegaste' || g.estado === 'estable';
  return (
    <>
      <Cabeza
        titulo={t('inicio.bloques.objetivo')}
        derecha={(
          <View style={estilos.chips}>
            {p.deEjemplo && <Chip texto={t('inicio.ejemplo')} tipo="tenue" />}
            <Chip texto={t(`progreso.estados.${g.estado}`)} tipo={bien ? 'bien' : g.estado === 'faltanDatos' || g.estado === 'sinMeta' ? 'tenue' : 'atencion'} />
          </View>
        )}
      />
      <View style={estilos.objFila}>
        {g.fecha && metaKg ? (
          <>
            <Text style={estilos.objCifra}>{fechaDiaMes(g.fecha)}</Text>
            <Text style={estilos.objTexto}>{t('inicio.llegarias', { kg: numero(pesoCorporalEn(metaKg, sistema).valor, metaKg % 1 ? 1 : 0), unidad })}</Text>
          </>
        ) : g.estado === 'llegaste' && metaKg ? (
          <>
            <Text style={estilos.objCifra}>{kg(metaKg, metaKg % 1 ? 1 : 0)}</Text>
            <Text style={estilos.objTexto}>{t('inicio.yaLlegaste')}</Text>
          </>
        ) : (
          <>
            <Text style={estilos.objCifra}>{g.peso === null ? '—' : kg(g.peso)}</Text>
            <Text style={estilos.objTexto}>{t('inicio.tendencia')}</Text>
          </>
        )}
      </View>
      {g.hecho !== null && p.pesoInicial !== null && g.peso !== null && metaKg ? (
        <Camino hecho={g.hecho} etiquetas={[numero(pesoCorporalEn(p.pesoInicial, sistema).valor, 1), numero(pesoCorporalEn(g.peso, sistema).valor, 1), numero(pesoCorporalEn(metaKg, sistema).valor, metaKg % 1 ? 1 : 0)]} />
      ) : null}
    </>
  );
}

// ------------------------------------------------------------------ el peso y el balance
function Peso({ anchoGrafico }: { anchoGrafico: number }) {
  const p = usePersona();
  const e = useEstado();
  const sistema = sistemaDe(e);
  const v = p.pesoHoy !== null ? pesoCorporalEn(p.pesoHoy, sistema) : null;
  const cambio = p.cambio7 !== null ? pesoCorporalEn(Math.abs(p.cambio7), sistema).valor * Math.sign(p.cambio7) : null;
  return (
    <>
      <Cabeza titulo={t('inicio.bloques.peso')} derecha={p.deEjemplo ? <Chip texto={t('inicio.ejemplo')} tipo="tenue" /> : undefined} />
      <View style={estilos.fila}>
        <View style={estilos.dato}>
          <Text style={estilos.datoCifra}>
            {v ? numero(v.valor, 1) : '—'}
            <Text style={estilos.datoUnidad}>{v ? ` ${v.unidad}` : ''}</Text>
          </Text>
          <Text style={estilos.datoTexto}>{cambio === null ? t('inicio.tendencia') : t('inicio.enSieteDias', { n: conSigno(cambio, 1), unidad: pesoCorporalEn(1, sistema).unidad })}</Text>
        </View>
        {/* Con una sola pesada no hay línea, solo un punto suelto. */}
        {p.serie30.filter((x) => x.punto !== null).length >= 2 && <Aparece><Linea serie={p.serie30} ancho={anchoGrafico} alto={44} /></Aparece>}
      </View>
      {p.gasto !== null && (
        <View style={[estilos.fila, estilos.filaSegunda]}>
          <View style={estilos.dato}>
            {/* Sin días todavía, solo lo que falta: una raya y «kcal por día» no dicen nada. */}
            {e.numeros && p.balance.dias.length > 0 && (
              <Text style={estilos.datoCifra}>
                {p.balance.promedio === null ? '—' : conSigno(Math.round(p.balance.promedio))}
                <Text style={estilos.datoUnidad}>{` ${t('inicio.kcalPorDia')}`}</Text>
              </Text>
            )}
            <Text style={estilos.datoTexto}>
              {!p.balance.dias.length
                ? t('progreso.sinBalance')
                : e.numeros
                  ? plural('inicio.balanceCorto', p.balance.dias.length)
                  : plural('inicio.balanceDiasSinNumeros', p.balance.dias.length)}
            </Text>
          </View>
          {/* El balance llega hasta ayer (persona.ts): cada barra va en su día. */}
          {p.balance.dias.length > 0 && <Balance dias={p.balance.dias} hasta={sumarDias(e.hoy, -1)} gasto={p.gasto} ancho={anchoGrafico} alto={44} />}
        </View>
      )}
    </>
  );
}

// ------------------------------------------------------------------ el día en el cielo
/** La constelación de hoy en chico, con lo encendido: lo que llega de Salud está en Sueño y en Hábitos. */
function Cielo({ ancho }: { ancho: number }) {
  const dia = useCieloDeHoy();
  const encendidos = useEncendidos();
  const hechos = encendidos.filter(Boolean).length;
  return (
    <>
      <Cabeza titulo={t('inicio.bloques.cielo')} derecha={dia.habitos.length ? <Chip texto={t('inicio.encendidas', { n: hechos, total: dia.habitos.length })} /> : undefined} />
      {dia.constelacion ? <MiniCielo constelacion={dia.constelacion} encendidas={encendidos} ancho={ancho} alto={118} /> : <View style={{ height: 40 }} />}
    </>
  );
}

// ------------------------------------------------------------------ el sueño de anoche
function SuenoDeAnoche({ anchoGrafico }: { anchoGrafico: number }) {
  const s = useSueno();
  const e = useEstado();
  const noche = s.noches.find((n) => n.clave === e.hoy);
  const calidad = noche ? calidadDeNoche(noche, s.necesidad, ultimasNoches(s.noches, sumarDias(e.hoy, -1), 14)) : null;
  return (
    <>
      <Cabeza
        titulo={t('inicio.bloques.sueno')}
        derecha={(
          <View style={estilos.chips}>
            {s.deEjemplo && <Chip texto={t('inicio.ejemplo')} tipo="tenue" />}
            {/* Sin reloj, si todavía es lo que estimó el teléfono, lo dice. */}
            {noche?.moss?.origen === 'estimada' && <Chip texto={t('sueno.origen.estimada')} tipo="tenue" />}
            {calidad && <Chip texto={t('inicio.calidad', { n: calidad.puntos })} />}
          </View>
        )}
      />
      {noche ? (
        <View style={estilos.fila}>
          <View style={estilos.dato}>
            <Text style={estilos.datoCifra}>{duracion(noche.dormido)}</Text>
            <Text style={estilos.datoTexto}>{t('inicio.horario', { desde: horaDelDia(noche.dormirse + 18 * 60), hasta: horaDelDia(noche.despertar + 18 * 60) })}</Text>
          </View>
          <Hipnograma desde={noche.dormirse} hasta={noche.despertar} tramos={noche.tramos} ancho={anchoGrafico} alto={44} />
        </View>
      ) : (
        <Text style={estilos.nota}>{t('sueno.sinNoche')}</Text>
      )}
    </>
  );
}

// ------------------------------------------------------------------ el agua
function Agua() {
  const e = useEstado();
  const ml = aguaDelDia(e.agua.values(), e.hoy);
  const vasos = Math.round(ml / VASO_ML);
  return (
    <>
      <Cabeza titulo={t('inicio.bloques.agua')} />
      <View style={estilos.fila}>
        <Text style={estilos.datoCifra}>
          {decimal(ml / 1000, idioma())}
          <Text style={estilos.datoUnidad}>{` ${t('inicio.deLitros', { meta: decimal((VASOS_META * VASO_ML) / 1000, idioma()) })}`}</Text>
        </Text>
        <View style={estilos.vasos}>
          {Array.from({ length: Math.max(VASOS_META, vasos) }, (_, i) => <Vaso key={i} lleno={i < vasos} extra={i >= VASOS_META} style={estilos.vaso} llenoStyle={estilos.vasoLleno} />)}
        </View>
        <Pressable
          onPress={() => {
            elAlmacen().sumarAgua(VASO_ML);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }}
          style={estilos.aguaMas}
          accessibilityRole="button"
          accessibilityLabel={t('mas.sumarVaso')}
          hitSlop={6}
        >
          <Icono nombre="plus" tam={15} peso="semibold" />
        </Pressable>
      </View>
    </>
  );
}

// ------------------------------------------------------------------ personalizar
const ALTO_FILA = 56;

/** Una hoja con los bloques: la llave muestra u oculta, y se ordenan arrastrando de la manija. */
function Personalizar({ abierta, orden, visibles, alCerrar }: { abierta: boolean; orden: Bloque[]; visibles: Set<Bloque>; alCerrar: () => void }) {
  const insets = useSafeAreaInsets();
  const arrastrada = useSharedValue(-1);
  const dy = useSharedValue(0);
  // El orden en que empezó el arrastre: con el orden nuevo ya pintado, lo corrido vuelve a cero en el mismo cuadro.
  const version = orden.join();
  const versionDelArrastre = useSharedValue('');
  useEffect(() => {
    arrastrada.set(-1);
    dy.set(0);
  }, [version, arrastrada, dy]);
  const guardar = (o: Bloque[], v: Set<Bloque>) => elAlmacen().ponerInicio({ orden: o, visibles: o.filter((b) => v.has(b)) });
  const mover = (desde: number, hasta: number) => {
    if (desde === hasta) return;
    const nuevo = [...orden];
    const [b] = nuevo.splice(desde, 1);
    nuevo.splice(hasta, 0, b);
    Haptics.selectionAsync().catch(() => {});
    guardar(nuevo, visibles);
  };
  return (
    <Modal visible={abierta} transparent animationType="slide" onRequestClose={alCerrar}>
      <GestureHandlerRootView style={estilos.modal}>
        <Pressable style={StyleSheet.absoluteFill} onPress={alCerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
        <View style={[estilos.hoja, { paddingBottom: insets.bottom + 20 }]}>
          <View style={estilos.asa} />
          <View style={estilos.hojaCabeza}>
            <Text style={estilos.hojaTitulo}>{t('inicio.personalizarTitulo')}</Text>
            <Pressable onPress={alCerrar} style={estilos.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')}>
              <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
            </Pressable>
          </View>
          <Text style={estilos.hojaTexto}>{t('inicio.personalizarTexto')}</Text>
          <View style={{ height: ALTO_FILA * orden.length }}>
            {orden.map((b, i) => (
              <FilaDeOrden
                key={b}
                bloque={b}
                indice={i}
                total={orden.length}
                visible={visibles.has(b)}
                arrastrada={arrastrada}
                dy={dy}
                version={version}
                versionDelArrastre={versionDelArrastre}
                alMover={mover}
                alCambiar={(si) => {
                  const v = new Set(visibles);
                  if (si) v.add(b);
                  else v.delete(b);
                  guardar(orden, v);
                }}
              />
            ))}
          </View>
          <Text style={estilos.hojaNota}>{t('inicio.personalizarNota')}</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function FilaDeOrden(p: {
  bloque: Bloque; indice: number; total: number; visible: boolean; arrastrada: SharedValue<number>; dy: SharedValue<number>;
  version: string; versionDelArrastre: SharedValue<string>; alMover: (desde: number, hasta: number) => void; alCambiar: (si: boolean) => void;
}) {
  const { indice, total, arrastrada, dy, version, versionDelArrastre, alMover } = p;
  const pan = usePanGesture({
    onActivate: () => {
      'worklet';
      versionDelArrastre.set(version);
      arrastrada.set(indice);
      dy.set(0);
    },
    onUpdate: (ev) => {
      'worklet';
      dy.set(ev.translationY);
    },
    onDeactivate: (ev) => {
      'worklet';
      const hasta = Math.max(0, Math.min(total - 1, indice + Math.round(ev.translationY / ALTO_FILA)));
      // Se suelta en su lugar nuevo y ahí queda hasta que llega el orden nuevo; sin moverse, vuelve al suyo.
      dy.set(withTiming((hasta - indice) * ALTO_FILA, { duration: 150 }, (terminado) => {
        if (hasta !== indice) scheduleOnRN(alMover, indice, hasta);
        else if (terminado) arrastrada.set(-1);
      }));
    },
  });
  // La que se arrastra sigue al dedo y las otras le hacen lugar.
  const estilo = useAnimatedStyle(() => {
    const a = arrastrada.get();
    if (a >= 0 && versionDelArrastre.get() !== version) return { transform: [{ translateY: 0 }], zIndex: 1, opacity: 1 };
    if (a === indice) return { transform: [{ translateY: dy.get() }], zIndex: 2, opacity: 0.95 };
    if (a < 0) return { transform: [{ translateY: withTiming(0, { duration: 150 }) }], zIndex: 1, opacity: 1 };
    const hasta = Math.max(0, Math.min(total - 1, a + Math.round(dy.get() / ALTO_FILA)));
    const corre = a < hasta ? (indice > a && indice <= hasta ? -ALTO_FILA : 0) : indice < a && indice >= hasta ? ALTO_FILA : 0;
    return { transform: [{ translateY: withTiming(corre, { duration: 150 }) }], zIndex: 1, opacity: 1 };
  });
  return (
    <Animated.View style={[estilos.filaOrden, { top: indice * ALTO_FILA }, estilo]}>
      <GestureDetector gesture={pan}>
        <View style={estilos.manija} accessibilityLabel={t('inicio.mover')}>
          <Icono nombre="line.3.horizontal" tam={16} color="rgba(239, 230, 207, 0.45)" />
        </View>
      </GestureDetector>
      <Text style={estilos.filaNombre}>{t(`inicio.bloques.${p.bloque}`)}</Text>
      <Switch value={p.visible} onValueChange={p.alCambiar} trackColor={{ true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' }} thumbColor={colores.pergamino} accessibilityLabel={t(`inicio.bloques.${p.bloque}`)} />
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  fecha: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.58)' },
  titulo: { marginTop: 6, marginBottom: 4, fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  bloque: { marginTop: 12, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(8, 12, 26, 0.72)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', gap: 6 },
  bloqueCielo: { backgroundColor: 'rgba(14, 22, 48, 0.82)' },
  apretado: { opacity: 0.85 },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 26 },
  cabezaTitulo: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.6, color: 'rgba(239, 230, 207, 0.7)', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  chipBien: { color: colores.salvia, backgroundColor: 'rgba(166, 191, 148, 0.1)' },
  chipAtencion: { color: colores.oroClaro, backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  calArriba: { flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: -8 },
  calCifra: { flex: 1, gap: 4, minWidth: 0 },
  calEtiqueta: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)' },
  calNumero: { fontFamily: letras.numeroLiviano, fontSize: 54, lineHeight: 56, letterSpacing: -1.3, color: colores.cifra, fontVariant: ['tabular-nums'] },
  calDe: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  macros: { marginTop: 12, paddingTop: 13, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  macro: { flex: 1, gap: 5, minWidth: 0 },
  macroNombre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroNombreTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)' },
  macroValor: { fontFamily: letras.numero, fontSize: 20, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  barra: { height: 3, marginTop: 3, borderRadius: 3, backgroundColor: 'rgba(239, 230, 207, 0.08)', overflow: 'hidden' },
  barraLlena: { height: '100%', borderRadius: 3 },
  objFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 9 },
  objCifra: { fontFamily: letras.numero, fontSize: 26, letterSpacing: -0.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
  objTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.62)' },
  nota: { marginTop: 5, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.58)', fontVariant: ['tabular-nums'] },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  filaSegunda: { marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  dato: { flex: 1, gap: 5, minWidth: 0 },
  datoCifra: { fontFamily: letras.numero, fontSize: 26, letterSpacing: -0.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
  datoUnidad: { fontFamily: letras.texto, fontSize: 12, letterSpacing: 0, color: 'rgba(239, 230, 207, 0.55)' },
  datoTexto: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  vasos: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 3 },
  vaso: { width: 7, height: 16, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderWidth: 1, borderColor: 'rgba(188, 216, 242, 0.35)' },
  vasoLleno: { backgroundColor: '#bcd8f2', borderColor: '#bcd8f2' },
  aguaMas: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.42)', backgroundColor: 'rgba(232, 196, 106, 0.08)', alignItems: 'center', justifyContent: 'center' },
  pie: { alignItems: 'center', marginTop: 18 },
  personalizar: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(8, 12, 26, 0.6)' },
  personalizarTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.72)' },
  modal: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  hoja: { paddingTop: 8, paddingHorizontal: 20, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: '#0f1631', borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(232, 196, 106, 0.3)' },
  asa: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 12, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  hojaCabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hojaTitulo: { fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino },
  cerrar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  hojaTexto: { marginTop: 6, marginBottom: 10, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  hojaNota: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
  filaOrden: { position: 'absolute', left: 0, right: 0, height: ALTO_FILA, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)', backgroundColor: '#0f1631' },
  manija: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
  filaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
});
