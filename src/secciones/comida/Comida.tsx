// La pestaña Comida, como en la galería (galeria/src/comida.js): arriba la tira de la semana, con
// una luna chica por día que se toca para verlo; un cuadro que se desliza del día a la semana y al
// mes, como MacroFactor; y abajo, la línea del día con sus comidas a la hora en que se comieron.
// Lo que queda, con la luna grande, está en Inicio; el peso y el gasto, en Progreso. Lo anotado se mantiene
// apretado para copiarlo, moverlo o borrarlo (MenuFlotante), y se desliza a la izquierda para borrarlo
// (FilaQueSeDesliza), como en la galería 46.

import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewInstance } from 'react-native';
import { GestureDetector, useLongPressGesture, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing, FadeIn, FadeOut, ReduceMotion, useAnimatedRef, useAnimatedStyle, useReducedMotion, useScrollOffset, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { DIAS_DE_COMIDA, type Estado } from '@/almacen/almacen';
import { deAscent } from '@/almacen/ascent';
import { conMayuscula } from '@/comida/buscar';
import { comidaDeLaHora, CON_HORA, horasCorridas, type Comida } from '@/dominio/comidas';
import { diasEntre, lunesDe, minutosEnElDia, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { estadoDeMacro, type Macros } from '@/dominio/metas';
import type { Linea } from '@/dominio/alrededorDelEntreno';
import { sugerenciaVencida } from '@/dominio/plan';
import { confirmar, delDia, sumarValores, totalDelDia, type Registro, type Valores } from '@/dominio/registros';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { alTocarDeNuevo, useEsLaActual } from '../arriba';
import { FranjaBajoLaHora } from '../franja';
import { HojaModal } from '../HojaModal';
import { entre, viaje } from '../movimiento';
import { margenDeToque } from '../paso';
import { ACOMODA, Aparece } from '../tarjetas';
import { Relleno, useCuenta } from '../animados';
import { Boton, COLOR_DE_MACRO, Etiqueta, Icono, MACROS, Punto, type Macro } from './comunes';
import { alTocarLaPagina, cerrarLaFilaAbierta, FilaQueSeDesliza } from './FilaQueSeDesliza';
import { borrarFoto, fotoDe, hayFotos, sacarFoto } from './fotos';
import { accionesDelMenu, borrarDeLaLinea, MenuFlotante, type PedidoDeMenu } from './MenuFlotante';
import {
  cantidadDeTexto, comidasDelDia, fechaCorta, gramosDeMacro, hora, HORA_TIPICA, horasDeComer, letraDelDia, metaDelDia, numero, sistemaDe, tituloDelDia, totalDe, useNumeros,
  useEstado, type ComidaDelDia,
} from './datos';
import { Luna, Lunitas, type Lunita } from './Luna';
import { AccionesDelPlan, ArmarElDia, PlanDeLaSemana } from './Plan';
import { lineasDeHoy } from './entreno';
import { LineaDeEntreno } from './LineaDeEntreno';
import { abrirRegistro, avisar } from './registro';

const VISTAS = ['dia', 'semana', 'mes'] as const;
type Vista = (typeof VISTAS)[number];
/** Comida en la barra (arriba.ts). */
const SECCION = 1;
// Lo que entra y sale de la línea del día: un fundido no es movimiento, también con Reducir movimiento.
const ENTRA = FadeIn.duration(300).reduceMotion(ReduceMotion.Never);
const ENTRA_ALIMENTO = FadeIn.duration(280).reduceMotion(ReduceMotion.Never);
const ENTRA_ACCIONES = FadeIn.duration(260).reduceMotion(ReduceMotion.Never);
const SALE = FadeOut.duration(180).reduceMotion(ReduceMotion.Never);
/** El alto de los textos de Día, Semana y Mes, y el de cada alimento de la línea: los toques llegan a 44. */
const ALTO_PUNTO = 27;
const ALTO_ALIMENTO = 26;
/** Con el texto grande, las cifras grandes crecen hasta acá: más, no entran en su lugar (al lado de la luna, en el cuadro). */
const CIFRA_GRANDE = 1.3;
/** Lo levantado al mantenerlo apretado, sobre el velo: opaco (así iOS calcula su sombra con la forma). */
const FONDO_DE_FILA = '#0d1328';
const FONDO_DE_TARJETA = '#090e1e';
/** Mantener apretado: a los 350 ms abre el menú; mientras, se hunde apenas. */
const MANTENER = 350;
const HUNDE = 0.018;

// Inicio › Calorías lleva a hoy y a «Día»: Comida escucha mientras está armada (si no, ya abre en hoy).
const alVolverAHoy = new Set<() => void>();

/** Que Comida muestre hoy, en «Día»: lo de otro día que quedó elegido ahí no es lo de hoy. */
export function comidaEnHoy() {
  alVolverAHoy.forEach((volver) => volver());
}

// Lo de cada día, armado una vez por cada versión de los registros (el almacén cambia el Map entero
// en cada cambio): la semana y el mes miran decenas de días cada vez que se pinta la pestaña.
const indices = new WeakMap<Estado['registros'], Map<ClaveDia, Registro[]>>();

/** Lo de un día, como delDia, sin recorrer todo lo registrado y sin lo sugerido de un día que ya pasó. */
function registrosDe(e: Pick<Estado, 'registros' | 'hoy'>, dia: ClaveDia): Registro[] {
  let indice = indices.get(e.registros);
  if (!indice) {
    indice = new Map();
    for (const r of e.registros.values()) {
      const lista = indice.get(r.dia);
      if (lista) lista.push(r);
      else indice.set(r.dia, [r]);
    }
    indices.set(e.registros, indice);
  }
  return delDia(indice.get(dia) ?? [], dia).filter((r) => !sugerenciaVencida(r, e.hoy));
}

/** Como totalDe: hoy y antes, sin lo planificado; en un día que no llegó, con lo planificado. */
const totalDelIndice = (e: Pick<Estado, 'registros' | 'hoy'>, dia: ClaveDia) => totalDelDia(registrosDe(e, dia), dia, dia > e.hoy);

/** Lo comido está en el teléfono solo de los últimos DIAS_DE_COMIDA días: lo de antes no se abre, porque se vería vacío. */
const fueraDeLoCargado = (e: Pick<Estado, 'hoy'>, dia: ClaveDia) => dia < sumarDias(e.hoy, -DIAS_DE_COMIDA);

/** Lo que miran las lunas chicas: lo comido de cada día y su meta, que sale de las metas, el perfil, el peso y lo de Ascent. */
type ParaLunas = Pick<Estado, 'registros' | 'hoy' | 'metas' | 'perfil' | 'pesos'>;

/** El día de un instante de la meta y lo comido, para la luna: llena es la meta. */
function lunitaDe(e: ParaLunas, dia: ClaveDia): Lunita {
  const registros = registrosDe(e, dia);
  const plan = registros.some((r) => r.planificado);
  const estado = dia > e.hoy && !plan ? 'futuro' : registros.length ? (plan ? 'plan' : 'comido') : 'vacio';
  const meta = metaDelDia(e, dia) ?? metaDelDia(e, e.hoy);
  const kcal = totalDelIndice(e, dia).kcal;
  return { estado, fraccion: meta ? kcal / meta.kcal : registros.length ? 1 : 0 };
}

const FUERA_DEL_MES: Lunita = { estado: 'fuera', fraccion: 0 };

// Cada fila de lunas chicas (la tira y cada semana del mes) se arma una vez mientras no cambie lo que
// miran: con cualquier otro cambio del almacén (la canasta mientras anotas, el agua) es la misma
// lista, y Skia no rehace sus caminos ni la vuelve a dibujar. Lo de Ascent entra por su versión.
let filasDeLunas: { de: readonly unknown[]; filas: Map<string, Lunita[]> } | undefined;

/** Las lunas de unos días; con el mes, las de los días que no son de él quedan fuera. */
function lunasDe(e: ParaLunas, dias: readonly ClaveDia[], mes?: readonly [ClaveDia, ClaveDia]): Lunita[] {
  const de = [e.registros, e.hoy, e.metas, e.perfil, e.pesos, deAscent().estado().version];
  const antes = filasDeLunas;
  const guardadas = antes && de.every((x, i) => x === antes.de[i]) ? antes : (filasDeLunas = { de, filas: new Map() });
  const clave = mes ? `${dias.join()}|${mes.join()}` : dias.join();
  let lunas = guardadas.filas.get(clave);
  if (!lunas) {
    lunas = dias.map((d) => (mes && (d < mes[0] || d > mes[1]) ? FUERA_DEL_MES : lunitaDe(e, d)));
    guardadas.filas.set(clave, lunas);
  }
  return lunas;
}

export function PaginaDeComida({ ancho, arriba, abajo }: { ancho: number; arriba: number; abajo: number }) {
  const e = useEstado();
  // Otro día o la vista, con el día en que se eligieron: pasada la hora de corte vale otra vez hoy, en
  // «Día» (lo elegido ayer quedaba de un día para otro).
  const [eleccion, setEleccion] = useState<{ dia: ClaveDia; vista: Vista; hoy: ClaveDia } | null>(null);
  const vigente = eleccion?.hoy === e.hoy ? eleccion : null;
  const dia = vigente?.dia ?? e.hoy;
  const vista = vigente?.vista ?? 'dia';
  const anchoCuadro = ancho - 40;
  const scroll = useAnimatedRef<ScrollView>();
  // La franja bajo la hora aparece con el scroll.
  const scrollY = useScrollOffset(scroll);
  const reducido = useReducedMotion();
  const esLaActual = useEsLaActual(SECCION);
  // Lo que se mantuvo apretado, con su menú encima.
  const [menu, setMenu] = useState<PedidoDeMenu | null>(null);
  useEffect(() => {
    const volver = () => setEleccion(null);
    alVolverAHoy.add(volver);
    return () => {
      alVolverAHoy.delete(volver);
    };
  }, []);
  // Tocar otra vez la pestaña: arriba de todo, en hoy y en «Día».
  useEffect(() => alTocarDeNuevo(SECCION, () => {
    cerrarLaFilaAbierta();
    scroll.current?.scrollTo({ y: 0, animated: !reducido });
    setEleccion(null);
  }), [reducido, scroll]);
  // Una fila abierta para borrar se cierra al dejar Comida, con una hoja encima o al tocar afuera de ella.
  useEffect(() => {
    if (!esLaActual) cerrarLaFilaAbierta();
  }, [esLaActual]);

  const verDia = (d: ClaveDia) => {
    if (fueraDeLoCargado(e, d)) return;
    Haptics.selectionAsync().catch(() => {});
    setEleccion({ dia: d, vista: 'dia', hoy: e.hoy });
  };
  const verVista = (v: Vista) => setEleccion({ dia, vista: v, hoy: e.hoy });

  return (
    // Un toque que empieza afuera de la fila abierta la cierra.
    <View style={{ width: ancho }} onTouchStart={alTocarLaPagina}>
      <ScrollView
        ref={scroll}
        style={estilos.lleno}
        contentContainerStyle={{ paddingTop: arriba + 18, paddingHorizontal: 20, paddingBottom: abajo + 48 }}
        showsVerticalScrollIndicator={false}
        scrollsToTop={esLaActual}
        scrollEventThrottle={16}
      >
        <Text style={estilos.fecha}>{fechaCorta(dia)}</Text>
        <Text style={estilos.titulo}>{tituloDelDia(dia, e.hoy)}</Text>
        <TiraDeLaSemana e={e} dia={dia} alElegir={verDia} />
        <Cuadro ancho={anchoCuadro} vista={vista} alCambiar={verVista}>
          <PaginaDelDia e={e} dia={dia} />
          <PaginaDeLaSemana e={e} dia={dia} alElegir={verDia} />
          <PaginaDelMes e={e} dia={dia} ancho={anchoCuadro} alElegir={verDia} />
        </Cuadro>
        <View style={estilos.puntos}>
          {VISTAS.map((v) => (
            <Pressable
              key={v}
              onPress={() => verVista(v)}
              style={({ pressed }) => [estilos.punto, pressed && v !== vista && estilos.apretado]}
              hitSlop={{ ...margenDeToque(ALTO_PUNTO), left: 2, right: 2 }}
              accessibilityRole="button"
              accessibilityState={{ selected: v === vista }}
            >
              <View style={[estilos.puntoMarca, v === vista && estilos.puntoMarcaElegido]} />
              <Text style={[estilos.puntoTexto, v === vista && estilos.puntoTextoElegido]}>{t(`comida.vistas.${v}`)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={estilos.seccion}>{t('comida.tuDia')}</Text>
        {dia > e.hoy && <Text style={estilos.nota}>{t('comida.planificadoTexto')}</Text>}
        {!metaDelDia(e, dia) && <Text style={estilos.nota}>{t('comida.sinMeta')}</Text>}
        <ArmarElDia e={e} dia={dia} />
        <LineaDelDia e={e} dia={dia} alMenu={setMenu} />
        <AccionesDelDia e={e} dia={dia} />
      </ScrollView>
      <FranjaBajoLaHora scrollY={scrollY} arriba={arriba} />
      <MenuFlotante pedido={menu} alCerrar={() => setMenu(null)} />
    </View>
  );
}

// ------------------------------------------------------------------ la tira de la semana
function TiraDeLaSemana({ e, dia, alElegir }: { e: Estado; dia: ClaveDia; alElegir: (d: ClaveDia) => void }) {
  const [ancho, setAncho] = useState(0);
  // Las lunas van sobre el lugar que les deja cada día, debajo de la letra: con el texto grande la letra
  // crece y el lugar baja, así que se mide en vez de suponerlo.
  const [arribaDeLunas, setArribaDeLunas] = useState<number | null>(null);
  const lunes = lunesDe(dia);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  return (
    <View style={estilos.tira} onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)}>
      {dias.map((d, i) => (
        <Pressable
          key={d}
          onPress={() => alElegir(d)}
          disabled={fueraDeLoCargado(e, d)}
          style={({ pressed }) => [estilos.tiraDia, d === dia && estilos.tiraDiaElegido, pressed && d !== dia && estilos.apretado]}
          accessibilityRole="button"
          accessibilityLabel={fechaCorta(d)}
          accessibilityState={{ selected: d === dia, disabled: fueraDeLoCargado(e, d) }}
        >
          <Text style={estilos.tiraLetra} numberOfLines={1}>{letraDelDia(d)}</Text>
          <View style={estilos.tiraLugar} onLayout={i === 0 ? (ev) => setArribaDeLunas(ev.nativeEvent.layout.y) : undefined} />
          <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{partesDe(d).dia}</Text>
        </Pressable>
      ))}
      <View style={[estilos.tiraLunas, arribaDeLunas !== null && { top: arribaDeLunas }]} pointerEvents="none">
        <Lunitas lunas={lunasDe(e, dias)} ancho={ancho} tam={24} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ el cuadro que se desliza
/**
 * Con el dedo de costado se pasa del día a la semana y al mes; en los bordes cede un cuarto, como
 * las pestañas. El alto sigue a la página que se ve. El gesto que empieza en el cuadro es del cuadro.
 */
function Cuadro({ ancho, vista, alCambiar, children }: { ancho: number; vista: Vista; alCambiar: (v: Vista) => void; children: React.ReactNode[] }) {
  const pos = useSharedValue(VISTAS.indexOf(vista));
  const desde = useSharedValue(0);
  const altos = useSharedValue<number[]>([0, 0, 0]);
  // Las tres medidas llegan juntas: leer el valor compartido, cambiar una y escribirlo perdía las
  // otras en el iPhone (la lectura vuelve vieja), y el cuadro quedaba sin alto al volver de «Mes».
  const medidas = useRef([0, 0, 0]);
  // La vista cambia también desde los puntos de abajo o al tocar un día: el cuadro va solo.
  useEffect(() => {
    pos.set(viaje(VISTAS.indexOf(vista)));
  }, [pos, vista]);
  const cambiar = (i: number) => alCambiar(VISTAS[i]);
  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      desde.set(Math.round(pos.get()));
    },
    onUpdate: (ev) => {
      'worklet';
      let p = desde.get() - ev.translationX / ancho;
      if (p < 0) p *= 0.25;
      if (p > 2) p = 2 + (p - 2) * 0.25;
      pos.set(p);
    },
    onDeactivate: (ev) => {
      'worklet';
      const i = desde.get();
      const pasa = Math.abs(ev.translationX) > ancho * 0.2 || Math.abs(ev.velocityX) > 350;
      const destino = entre(pasa ? i + (ev.translationX < 0 ? 1 : -1) : i, 0, 2);
      pos.set(viaje(destino));
      scheduleOnRN(cambiar, destino);
    },
  });
  const estiloTira = useAnimatedStyle(() => ({ transform: [{ translateX: -pos.get() * ancho }] }));
  const estiloAlto = useAnimatedStyle(() => {
    const a = altos.get();
    // Hasta tener las tres medidas, el alto natural (devolver {} después de un alto dejaría el último).
    if (!a[0] || !a[1] || !a[2]) return {};
    const p = entre(pos.get(), 0, 2);
    const i = Math.floor(p);
    const f = p - i;
    return { height: a[i] * (1 - f) + a[Math.min(2, i + 1)] * f };
  });
  const actual = VISTAS.indexOf(vista);
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[estilos.cuadro, estiloAlto]}>
        <Animated.View style={[estilos.cuadroTira, { width: ancho * 3 }, estiloTira]}>
          {children.map((pagina, i) => (
            <View
              key={i}
              style={[estilos.pagina, { width: ancho }]}
              // Las otras dos quedan armadas al costado, fuera del cuadro: VoiceOver no las recorre.
              accessibilityElementsHidden={i !== actual}
              importantForAccessibility={i === actual ? 'auto' : 'no-hide-descendants'}
              onLayout={(ev) => {
                medidas.current[i] = ev.nativeEvent.layout.height;
                altos.set([...medidas.current]);
              }}
            >
              {pagina}
            </View>
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

/** Las barras de proteína, carbohidratos y grasas contra su meta. En un día, cada punto brilla al cumplir y tiembla si se pasa por mucho. */
export function BarrasDeMacros({ comido, meta, conEstado }: { comido: Pick<Valores, Macro>; meta: Macros | null; conEstado: boolean }) {
  const numeros = useNumeros();
  return (
    <View style={estilos.macros}>
      {MACROS.map((m) => {
        const objetivo = meta?.[m] ?? 0;
        const estado = conEstado && meta ? estadoDeMacro(comido[m], objetivo) : 'falta';
        const lleno = objetivo ? Math.min(1, comido[m] / objetivo) : 0;
        return (
          <View key={m} style={estilos.macro}>
            <View style={estilos.macroNombre}>
              <View style={{ opacity: estado === 'falta' ? 0.55 : 1 }}>
                <Punto macro={m} />
              </View>
              <Text style={estilos.macroNombreTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t(`comida.${m}`)}</Text>
            </View>
            {numeros && (
              <Text style={estilos.macroCifra} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {meta ? t('comida.gramosDe', { n: numero(Math.round(comido[m])), meta: numero(meta[m]) }) : `${numero(Math.round(comido[m]))} g`}
              </Text>
            )}
            <View style={estilos.barra}>
              <Relleno fraccion={lleno} style={[estilos.barraLlena, { backgroundColor: COLOR_DE_MACRO[m], opacity: estado === 'falta' ? 0.75 : 1 }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PaginaDelDia({ e, dia }: { e: Estado; dia: ClaveDia }) {
  const meta = metaDelDia(e, dia);
  const comido = totalDe(e.registros, dia, e.hoy);
  const queda = meta ? meta.kcal - comido.kcal : 0;
  // Al anotar, lo comido cuenta hasta lo nuevo, como en la galería.
  const kcal = useCuenta(Math.round(comido.kcal));
  let linea = '';
  if (dia === e.hoy && meta && e.numeros) linea = t(queda >= 0 ? 'comida.quedanKcal' : 'comida.deMasKcal', { n: numero(Math.abs(Math.round(queda))) });
  else if (dia > e.hoy) linea = t('comida.planificado');
  return (
    <View>
      <View style={estilos.resumen}>
        <View style={estilos.resumenLuna}>
          <Luna tam={64} fraccion={meta ? comido.kcal / meta.kcal : 0} />
        </View>
        <View style={estilos.resumenTextos}>
          {e.numeros && (
            <Text style={estilos.resumenCifra} maxFontSizeMultiplier={CIFRA_GRANDE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {numero(Math.round(kcal))}
              {meta && <Text style={estilos.resumenDe}>{`  ${t('comida.deMetaCorto', { meta: numero(meta.kcal) })}`}</Text>}
            </Text>
          )}
          {linea ? <Text style={[estilos.resumenLinea, dia === e.hoy && queda < 0 && estilos.deMas]}>{linea}</Text> : null}
        </View>
      </View>
      <BarrasDeMacros comido={comido} meta={meta} conEstado={dia <= e.hoy} />
    </View>
  );
}

type Promedio = { n: number; meta: Macros | null } & Pick<Valores, 'kcal' | Macro>;
/**
 * El promedio de los días que ya terminaron y tienen algo registrado, y la meta de esos mismos días
 * promediada: con la semana repartida, o con la meta de otro mes, cada día tiene la suya.
 */
function promedioDe(e: Estado, dias: ClaveDia[]): Promedio {
  const validos = dias.filter((d) => d < e.hoy && registrosDe(e, d).some((r) => !r.planificado));
  const p: Promedio = { n: validos.length, meta: null, kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 };
  for (const d of validos) {
    const t2 = totalDelIndice(e, d);
    p.kcal += t2.kcal / validos.length;
    for (const m of MACROS) p[m] += t2[m] / validos.length;
  }
  const metas = validos.flatMap((d) => metaDelDia(e, d) ?? []);
  if (metas.length) {
    const media = (k: keyof Macros) => Math.round(metas.reduce((s, m) => s + m[k], 0) / metas.length);
    p.meta = { kcal: media('kcal'), proteina: media('proteina'), carbohidratos: media('carbohidratos'), grasas: media('grasas') };
  }
  return p;
}

function CabezaDePromedio({ titulo, fechas, promedio, dias, metaSinDias }: { titulo: string; fechas: string; promedio: Promedio; dias: number; metaSinDias: Macros | null }) {
  const numeros = useNumeros();
  const meta = promedio.meta ?? metaSinDias;
  return (
    <View>
      <View style={estilos.paginaCabeza}>
        <Text style={estilos.paginaTitulo}>{titulo}</Text>
        <Text style={estilos.paginaFechas}>{fechas}</Text>
      </View>
      <Etiqueta>{t('comida.promedio')}</Etiqueta>
      {promedio.n ? (
        <>
          {numeros && (
            <Text style={estilos.promedioCifra} maxFontSizeMultiplier={CIFRA_GRANDE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
              {numero(Math.round(promedio.kcal))}
              <Text style={estilos.promedioUnidad}>{` ${t('comida.kcal')}`}</Text>
            </Text>
          )}
          <Text style={estilos.promedioNota}>{[meta && numeros ? t('comida.metaDe', { n: numero(meta.kcal) }) : null, t('comida.diasRegistrados', { n: promedio.n, total: dias })].filter(Boolean).join(' · ')}</Text>
          <BarrasDeMacros comido={promedio} meta={meta} conEstado={false} />
        </>
      ) : (
        <Text style={estilos.promedioNota}>{t('comida.sinRegistros')}</Text>
      )}
    </View>
  );
}

function PaginaDeLaSemana({ e, dia, alElegir }: { e: Estado; dia: ClaveDia; alElegir: (d: ClaveDia) => void }) {
  const lunes = lunesDe(dia);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  const desde = partesDe(lunes);
  const hasta = partesDe(dias[6]);
  const meta = metaDelDia(e, dias[6] < e.hoy ? dias[6] : e.hoy);
  const titulo = lunes === lunesDe(e.hoy) ? t('comida.estaSemana') : t('comida.semanaDel', { num: desde.dia, mes: lista('fecha.mesesCortos')[desde.mes] });
  return (
    <View>
      <CabezaDePromedio
        titulo={titulo}
        fechas={t('comida.rangoSemana', { desde: desde.dia, hasta: hasta.dia, mes: lista('fecha.mesesCortos')[hasta.mes] })}
        promedio={promedioDe(e, dias)}
        dias={dias.filter((d) => d < e.hoy).length}
        metaSinDias={meta}
      />
      <View style={estilos.grafica}>
        {/* La meta va a 100 de los 120 que mide cada barra: lo que pasa de ahí no cambia la lectura. */}
        <View style={estilos.graficaMeta} pointerEvents="none" />
        {dias.map((d) => {
          const total = totalDelIndice(e, d);
          const m = metaDelDia(e, d) ?? meta;
          const plan = registrosDe(e, d).some((r) => r.planificado);
          const alto = (v: number, objetivo: number | undefined) => `${(Math.min(1.2, objetivo ? v / objetivo : 0) / 1.2) * 100}%` as const;
          return (
            <Pressable
              key={d}
              onPress={() => alElegir(d)}
              disabled={fueraDeLoCargado(e, d)}
              style={({ pressed }) => [estilos.graficaDia, pressed && estilos.apretado]}
              accessibilityRole="button"
              accessibilityLabel={fechaCorta(d)}
            >
              <View style={[estilos.graficaBarras, plan && estilos.tenue]}>
                <View style={[estilos.graficaBarra, { height: alto(total.kcal, m?.kcal), backgroundColor: '#e6dfcc' }]} />
                {MACROS.map((x) => <View key={x} style={[estilos.graficaBarra, { height: alto(total[x], m?.[x]), backgroundColor: COLOR_DE_MACRO[x] }]} />)}
              </View>
              <Text style={estilos.tiraLetra} numberOfLines={1}>{letraDelDia(d)}</Text>
              <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{partesDe(d).dia}</Text>
            </Pressable>
          );
        })}
      </View>
      <PlanDeLaSemana e={e} dia={dia} />
    </View>
  );
}

function PaginaDelMes({ e, dia, ancho, alElegir }: { e: Estado; dia: ClaveDia; ancho: number; alElegir: (d: ClaveDia) => void }) {
  const p = partesDe(dia);
  const primero = sumarDias(dia, -(p.dia - 1));
  const ultimo = sumarDias(primero, new Date(p.anio, p.mes + 1, 0).getDate() - 1);
  const dias = Array.from({ length: diasEntre(primero, ultimo) + 1 }, (_, i) => sumarDias(primero, i));
  const semanas = useMemo(() => {
    const filas: ClaveDia[][] = [];
    for (let lunes = lunesDe(primero); lunes <= ultimo; lunes = sumarDias(lunes, 7)) filas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)));
    return filas;
  }, [primero, ultimo]);
  const anchoGrilla = ancho - 32;
  return (
    <View>
      <CabezaDePromedio titulo={conMayuscula(lista('fecha.meses')[p.mes])} fechas={String(p.anio)} promedio={promedioDe(e, dias)} dias={dias.filter((d) => d < e.hoy).length} metaSinDias={metaDelDia(e, e.hoy)} />
      <View style={estilos.calendario}>
        <View style={estilos.calendarioFila}>
          {semanas[0].map((d) => <Text key={d} style={[estilos.calendarioLetra]}>{letraDelDia(d)}</Text>)}
        </View>
        {semanas.map((semana) => (
          <View key={semana[0]} style={estilos.calendarioSemana}>
            <View style={estilos.calendarioFila}>
              {semana.map((d) => {
                const fuera = d < primero || d > ultimo;
                return (
                  <Pressable
                    key={d}
                    disabled={fuera || fueraDeLoCargado(e, d)}
                    onPress={() => alElegir(d)}
                    style={({ pressed }) => [estilos.calendarioDia, d === e.hoy && estilos.calendarioHoy, pressed && estilos.apretado]}
                    accessibilityRole="button"
                    accessibilityLabel={fechaCorta(d)}
                  >
                    <View style={estilos.calendarioLugar} />
                    {!fuera && <Text style={[estilos.tiraNumero, d === e.hoy && estilos.hoy]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{partesDe(d).dia}</Text>}
                  </Pressable>
                );
              })}
            </View>
            <View style={estilos.calendarioLunas} pointerEvents="none">
              <Lunitas lunas={lunasDe(e, semana, [primero, ultimo])} ancho={anchoGrilla} tam={26} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ la línea del día
type Entrada = { minutos: number } & ({ tipo: 'comida'; comida: ComidaDelDia } | { tipo: 'vacia'; comida: Comida; ahora: boolean } | { tipo: 'ahora' });

/**
 * Las comidas sobre una línea de horas, con el espacio entre una y otra según el tiempo que pasó.
 * Hoy, la comida que falta espera en «ahora»; otro día, las que faltan se pueden agregar.
 */
function LineaDelDia({ e, dia, alMenu }: { e: Estado; dia: ClaveDia; alMenu: (p: PedidoDeMenu) => void }) {
  const sistema = sistemaDe(e);
  const comidas = comidasDelDia(e.registros, dia, e.hoy);
  const entradas: Entrada[] = comidas.map((c) => ({ tipo: 'comida', comida: c, minutos: c.minutos }));
  // En la cuenta del día (D32): pasada la medianoche, antes del corte, la 1470 de hoy.
  const ahora = minutosEnElDia(new Date(), dia);
  // Qué comer antes y después de entrenar: en la comida que toca, aunque todavía no sea su hora.
  const lineas = dia === e.hoy ? lineasDeHoy(e) : new Map<Comida, Linea>();
  // Lo que falta, corrido por la última que comiste: con la misma distancia entre ellas. Desde la hora
  // de cada comida (la del horario o la de siempre), la misma que la de lo que se anota.
  const anotadas = Object.fromEntries(comidas.filter((c) => !c.planificada).map((c) => [c.comida, c.minutos]));
  const horaDe = horasDeComer(e);
  const horas = horasCorridas(Object.fromEntries(CON_HORA.map((c) => [c, horaDe(c)])), anotadas);
  for (const tipo of Object.keys(HORA_TIPICA) as Comida[]) {
    const minutos = horas[tipo] ?? HORA_TIPICA[tipo as keyof typeof HORA_TIPICA];
    if (comidas.some((c) => c.comida === tipo)) continue;
    if (dia !== e.hoy) entradas.push({ tipo: 'vacia', comida: tipo, ahora: false, minutos });
    else {
      const actual = comidaDeLaHora(ahora, e.corte) === tipo;
      if (minutos <= ahora || actual || lineas.has(tipo)) entradas.push({ tipo: 'vacia', comida: tipo, ahora: actual, minutos: actual ? ahora : minutos });
    }
  }
  // El snack: el de antes de entrenar, un rato antes de la sesión; el de la noche, después de la cena.
  // Va aunque haya uno anotado más temprano (la regla ya mira si hubo uno a su hora); si está planificado, la línea va en él.
  const snack = lineas.get('snack');
  if (snack && !comidas.some((c) => c.comida === 'snack' && c.planificada)) {
    // Después de una cena tarde, el de antes de dormir no pasa del final del día, que llega hasta el corte (D32).
    entradas.push({ tipo: 'vacia', comida: 'snack', ahora: false, minutos: Math.min(24 * 60 + e.corte - 1, Math.max(ahora, snack.clase === 'antesDeDormir' ? snack.hora + 30 : snack.hora - 45)) });
  }
  // Una comida registrada ahora ya marca la hora: «ahora» va solo si no la hay.
  if (dia === e.hoy && !comidas.some((c) => Math.abs(c.minutos - ahora) < 1)) entradas.push({ tipo: 'ahora', minutos: ahora - 0.5 });
  entradas.sort((a, b) => a.minutos - b.minutos);
  return (
    <View style={estilos.linea}>
      <View style={estilos.lineaRaya} pointerEvents="none" />
      {entradas.map((x, i) => {
        const separacion = i === 0 ? 0 : 10 + Math.min(34, (x.minutos - entradas[i - 1].minutos) * 0.12);
        if (x.tipo === 'ahora') {
          return (
            <Animated.View key="ahora" layout={ACOMODA} style={[estilos.entradaAhora, { marginTop: separacion }]}>
              <Text style={[estilos.hora, estilos.horaAhora]}>{hora(Math.round(x.minutos))}</Text>
              <View style={[estilos.nodo, estilos.nodoAhora]} />
              <Text style={estilos.ahoraTexto}>{t('comida.ahora')}</Text>
            </Animated.View>
          );
        }
        const clave = x.tipo === 'comida' ? `c-${x.comida.comida}` : `v-${x.comida}`;
        const planificada = x.tipo === 'comida' && x.comida.planificada;
        // Lo que se registra, se borra o se planifica entra, sale y se acomoda: nada salta.
        return (
          <Animated.View key={clave} entering={ENTRA} exiting={SALE} layout={ACOMODA} style={{ marginTop: separacion }}>
            <Text style={estilos.hora}>{x.tipo === 'vacia' && x.ahora ? '' : hora(Math.round(x.minutos))}</Text>
            <View style={[estilos.nodo, x.tipo === 'vacia' && estilos.nodoVacio, planificada && estilos.nodoPlan]} />
            {x.tipo === 'comida'
              ? <Tarjeta key={`${dia}-${x.comida.comida}`} c={x.comida} dia={dia} sistema={sistema} e={e} linea={x.comida.planificada ? lineas.get(x.comida.comida) : undefined} alMenu={alMenu} />
              : <TarjetaVacia comida={x.comida} dia={dia} hoy={e.hoy} e={e} linea={lineas.get(x.comida)} />}
          </Animated.View>
        );
      })}
    </View>
  );
}

type Sistema = ReturnType<typeof sistemaDe>;

function Tarjeta({ c, dia, sistema, e, linea, alMenu }: { c: ComidaDelDia; dia: ClaveDia; sistema: Sistema; e: Estado; linea?: Linea; alMenu: (p: PedidoDeMenu) => void }) {
  const numeros = useNumeros();
  const reducido = useReducedMotion();
  // La foto, opcional y solo en el teléfono (D10): un toque en la comida ya registrada.
  const [foto, setFoto] = useState(() => fotoDe(dia, c.comida));
  const [viendo, setViendo] = useState(false);
  const tarjeta = useRef<ViewInstance>(null);
  const apretando = useSharedValue(0);
  const visible = useSharedValue(1);
  const sacar = () => {
    sacarFoto(dia, c.comida).then((uri) => uri && setFoto(uri)).catch(() => {});
  };
  // La cámara espera a que se vaya la hoja de la foto: iOS no abre una pantalla mientras otra se está cerrando.
  const cambiarFoto = () => {
    setViendo(false);
    setTimeout(sacar, 600);
  };
  // Lo planificado que quedó en una comida con algo ya comido (un café a la hora del almuerzo armado)
  // se ve tenue y no suma hasta confirmarlo, como en el total del día.
  const mezclada = !c.planificada && c.registros.some((r) => r.planificado);
  const total = mezclada && dia <= e.hoy ? sumarValores(c.registros.filter((r) => !r.planificado).map((r) => r.valores)) : c.total;
  const delPlan = c.registros.some((r) => r.planificado && r.plan);
  // Lo que sugirió el plan tiene lo suyo («Comí esto», «Otra»): no se mantiene apretado, como en la galería.
  const conMenu = !delPlan;
  const etiqueta = [
    t(`comida.comidas.${c.comida}`),
    c.planificada ? t(delPlan ? 'comida.plan.sugerida' : 'comida.planificado') : '',
    numeros ? `${numero(Math.round(total.kcal))} ${t('comida.kcal')}` : '',
  ].filter(Boolean).join(', ');
  // La comida entera se levanta con su menú. Se mide la tarjeta de afuera, que no se hunde.
  const abrirMenu = (en?: 'copiar' | 'mover') => {
    tarjeta.current?.measureInWindow((x, y, ancho, alto) => alMenu({
      clave: `comida:${c.comida}`,
      rect: { x, y, ancho, alto },
      visible,
      radio: 16,
      fondo: FONDO_DE_TARJETA,
      vista: <CopiaDeTarjeta c={c} total={total} mezclada={mezclada} sistema={sistema} numeros={numeros} linea={linea} foto={foto} />,
      registros: c.registros,
      dia,
      hoy: e.hoy,
      comida: c.comida,
      entera: true,
      en,
    }));
  };
  const mantenida = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    abrirMenu();
  };
  // Mantener apretada la cabecera: la comida entera se hunde apenas y, a los 350 ms, se levanta con su menú.
  const mantener = useLongPressGesture({
    enabled: conMenu,
    minDuration: MANTENER,
    maxDistance: 10,
    onBegin: () => {
      'worklet';
      if (!reducido) apretando.set(withTiming(1, { duration: MANTENER, easing: Easing.out(Easing.quad) }));
    },
    onActivate: () => {
      'worklet';
      scheduleOnRN(mantenida);
    },
    onFinalize: () => {
      'worklet';
      apretando.set(withTiming(0, { duration: 160 }));
    },
  });
  const estiloTarjeta = useAnimatedStyle(() => ({ opacity: visible.get(), transform: [{ scale: 1 - HUNDE * apretando.get() }] }));
  return (
    // Se mide esta, que no se hunde ni se acomoda; la de adentro es la que se ve.
    <View ref={tarjeta} collapsable={false}>
      <Animated.View layout={ACOMODA} style={[estilos.tarjeta, c.planificada && estilos.tarjetaPlan, estiloTarjeta]}>
        {/* Lo planificado se ve tenue; lo que se hace con lo armado, no. */}
        <View style={c.planificada && estilos.tenueDePlan}>
          <GestureDetector gesture={mantener}>
            <View
              collapsable={false}
              style={estilos.tarjetaCabeza}
              accessible
              accessibilityRole="header"
              accessibilityLabel={etiqueta}
              accessibilityActions={conMenu ? accionesDelMenu() : undefined}
              onAccessibilityAction={(ev) => {
                const accion = ev.nativeEvent.actionName;
                if (accion === 'borrar') borrarDeLaLinea(c.registros, true);
                else if (accion === 'copiar' || accion === 'mover') abrirMenu(accion);
              }}
            >
              <CabezaDeTarjeta c={c} total={total} delPlan={delPlan} numeros={numeros} />
            </View>
          </GestureDetector>
          {linea && <LineaDeEntreno linea={linea} />}
          {c.registros.map((r, i) => (
            <Animated.View key={r.id} entering={ENTRA_ALIMENTO} exiting={SALE} layout={ACOMODA}>
              <FilaDeRegistro r={r} c={c} dia={dia} hoy={e.hoy} sistema={sistema} tenue={mezclada && r.planificado} primera={i === 0 && !linea} ultima={i === c.registros.length - 1} alMenu={alMenu} />
            </Animated.View>
          ))}
          {foto && (
            <Aparece>
              <Pressable onPress={() => setViendo(true)} accessibilityRole="imagebutton" accessibilityLabel={t('comida.fotos.ver')}>
                <Image source={{ uri: foto }} style={estilos.foto} contentFit="cover" />
              </Pressable>
            </Aparece>
          )}
          <PieDeTarjeta total={total} numeros={numeros}>
            {hayFotos && !c.planificada && !foto && (
              <Pressable onPress={sacar} style={estilos.botonFoto} accessibilityRole="button" accessibilityLabel={t('comida.foto')} hitSlop={8}>
                <Icono nombre="camera" tam={14} color="rgba(239, 230, 207, 0.6)" />
              </Pressable>
            )}
          </PieDeTarjeta>
        </View>
        {delPlan && (
          <Animated.View entering={ENTRA_ACCIONES} exiting={SALE}>
            <AccionesDelPlan e={e} c={c} dia={dia} />
          </Animated.View>
        )}
        {foto && (
          <HojaModal
            abierta={viendo}
            titulo={t('comida.fotos.ver')}
            alCerrar={() => setViendo(false)}
            pie={(
              <>
                <Boton tipo="contorno" texto={t('comida.fotos.cambiar')} alTocar={cambiarFoto} />
                <Boton tipo="quitar" texto={t('comida.fotos.borrar')} alTocar={() => { borrarFoto(dia, c.comida); setFoto(null); setViendo(false); }} />
              </>
            )}
          >
            <Image source={{ uri: foto }} style={estilos.fotoGrande} contentFit="cover" />
            <Text style={estilos.fotoNota}>{t('comida.fotos.nota')}</Text>
          </HojaModal>
        )}
      </Animated.View>
    </View>
  );
}

/** El nombre de la comida, si está planificada o sugerida, y sus calorías. */
function CabezaDeTarjeta({ c, total, delPlan, numeros }: { c: ComidaDelDia; total: Valores; delPlan: boolean; numeros: boolean }) {
  return (
    <>
      {/* En inglés, «Afternoon snack» con «Suggested» no entraban: el título se achica y lo demás queda. */}
      <Text style={[estilos.tarjetaTitulo, estilos.tarjetaTituloEnFila]} numberOfLines={1}>{t(`comida.comidas.${c.comida}`)}</Text>
      {c.planificada && <Text style={estilos.etiquetaPlan} numberOfLines={1}>{t(delPlan ? 'comida.plan.sugerida' : 'comida.planificado')}</Text>}
      {numeros && (
        <Text style={estilos.tarjetaKcal} numberOfLines={1}>
          {numero(Math.round(total.kcal))}
          <Text style={estilos.tarjetaKcalUnidad}> kcal</Text>
        </Text>
      )}
    </>
  );
}

/** Los gramos de cada macro y, al final, lo que se sume (la cámara). */
function PieDeTarjeta({ total, numeros, children }: { total: Valores; numeros: boolean; children?: ReactNode }) {
  return (
    <View style={estilos.tarjetaPie}>
      {MACROS.map((m) => (
        // VoiceOver leía «32 g, 50 g, 20 g» sin decir de qué: cada uno, con su macro.
        <View key={m} style={estilos.mini} accessible={numeros} accessibilityLabel={numeros ? t('comida.lector.macro', { macro: t(`comida.${m}`), n: gramosDeMacro(total[m]) }) : undefined}>
          <Punto macro={m} tam={5} />
          {numeros && <Text style={estilos.miniTexto}>{`${gramosDeMacro(total[m])} g`}</Text>}
        </View>
      ))}
      {children}
    </View>
  );
}

/** El nombre y la cantidad de un alimento, y sus calorías. */
function ContenidoDeFila({ r, cantidad, numeros }: { r: Registro; cantidad: string; numeros: boolean }) {
  return (
    <>
      <Text style={estilos.itemTexto} numberOfLines={1}>
        {r.nombre}
        {cantidad ? <Text style={estilos.itemCantidad}>{` · ${cantidad}`}</Text> : null}
      </Text>
      {numeros && <Text style={estilos.itemKcal}>{numero(Math.round(r.valores.kcal))}</Text>}
    </>
  );
}

/** La comida entera como en la línea, quieta y sobre fondo opaco: la que se levanta al mantenerla apretada. */
function CopiaDeTarjeta({ c, total, mezclada, sistema, numeros, linea, foto }: {
  c: ComidaDelDia;
  total: Valores;
  mezclada: boolean;
  sistema: Sistema;
  numeros: boolean;
  linea?: Linea;
  foto: string | null;
}) {
  return (
    <View style={[estilos.tarjeta, c.planificada && estilos.tarjetaPlan, estilos.tarjetaLevantada]}>
      <View style={c.planificada && estilos.tenueDePlan}>
        <View style={estilos.tarjetaCabeza}>
          <CabezaDeTarjeta c={c} total={total} delPlan={false} numeros={numeros} />
        </View>
        {linea && <LineaDeEntreno linea={linea} />}
        {c.registros.map((r) => (
          <View key={r.id} style={[estilos.item, mezclada && r.planificado && estilos.tenueDePlan]}>
            <ContenidoDeFila r={r} cantidad={cantidadDeTexto(r.cantidad, sistema)} numeros={numeros} />
          </View>
        ))}
        {foto && <Image source={{ uri: foto }} style={estilos.foto} contentFit="cover" />}
        <PieDeTarjeta total={total} numeros={numeros}>
          {hayFotos && !c.planificada && !foto && (
            <View style={estilos.botonFoto}>
              <Icono nombre="camera" tam={14} color="rgba(239, 230, 207, 0.6)" />
            </View>
          )}
        </PieDeTarjeta>
      </View>
    </View>
  );
}

/** Un alimento de la línea. Van pegados uno a otro: el toque crece hacia afuera de la lista, no sobre el vecino. */
function FilaDeRegistro({ r, c, dia, hoy, sistema, tenue, primera, ultima, alMenu }: {
  r: Registro;
  c: ComidaDelDia;
  dia: ClaveDia;
  hoy: ClaveDia;
  sistema: Sistema;
  tenue: boolean;
  primera: boolean;
  ultima: boolean;
  alMenu: (p: PedidoDeMenu) => void;
}) {
  const cantidad = cantidadDeTexto(r.cantidad, sistema);
  const numeros = useNumeros();
  const { top = 0, bottom = 0 } = margenDeToque(ALTO_ALIMENTO);
  const margen = { top: primera ? Math.min(top, 7) : 0, bottom: ultima ? Math.min(bottom, 7) : 0, left: 6, right: 6 };
  const etiqueta = [r.nombre, cantidad, numeros ? `${numero(Math.round(r.valores.kcal))} ${t('comida.kcal')}` : '', tenue ? t('comida.planificado') : ''].filter(Boolean).join(', ');
  const editar = () => abrirRegistro({ editar: r.id, comida: r.comida, dia: r.dia });
  const contenido = <ContenidoDeFila r={r} cantidad={cantidad} numeros={numeros} />;
  // Lo que sugirió el plan tiene lo suyo («Comí esto», «Otra»): no se mantiene apretado ni se desliza, como en la galería.
  if (r.planificado && r.plan) {
    return (
      <Pressable
        onPress={editar}
        style={({ pressed }) => [estilos.item, tenue && estilos.tenueDePlan, pressed && estilos.itemApretado]}
        hitSlop={margen}
        accessibilityRole="button"
        accessibilityLabel={etiqueta}
      >
        {contenido}
      </Pressable>
    );
  }
  // Lo último que le quedaba a la comida se la lleva: el aviso dice la comida, como en la galería.
  const entera = c.registros.length === 1;
  return (
    <FilaQueSeDesliza
      id={r.id}
      etiqueta={etiqueta}
      alTocar={editar}
      alBorrar={() => borrarDeLaLinea([r], entera)}
      alMenu={(rect, visible, en) => alMenu({
        clave: r.id,
        rect,
        visible,
        radio: 12,
        fondo: FONDO_DE_FILA,
        vista: <View style={[estilos.itemFrente, estilos.itemLevantado, tenue && estilos.tenueDePlan]}>{contenido}</View>,
        registros: [r],
        dia,
        hoy,
        comida: r.comida,
        entera,
        en,
      })}
      margen={margen}
      estilo={[estilos.itemFrente, tenue && estilos.tenueDePlan]}
      estiloApretado={estilos.itemApretado}
    >
      {contenido}
    </FilaQueSeDesliza>
  );
}

function TarjetaVacia({ comida, dia, hoy, e, linea }: { comida: Comida; dia: ClaveDia; hoy: ClaveDia; e: Estado; linea?: Linea }) {
  const ayer = sumarDias(hoy, -1);
  // Lo planificado de ayer que no se confirmó no se comió: no se copia.
  const deAyer = dia === hoy ? registrosDe(e, ayer).filter((r) => r.comida === comida && !r.planificado) : [];
  return (
    <View style={[estilos.tarjeta, estilos.tarjetaVacia]}>
      <Text style={estilos.tarjetaTitulo}>{t(`comida.comidas.${comida}`)}</Text>
      {linea && <LineaDeEntreno linea={linea} />}
      <View style={estilos.acciones}>
        <Boton texto={t('comida.agregar')} icono="plus" tipo="principal" alTocar={() => abrirRegistro({ comida, dia })} />
        {deAyer.length > 0 && (
          <Boton
            texto={t('comida.copiarDeAyer')}
            icono="doc.on.doc"
            tipo="secundario"
            alTocar={() => abrirRegistro({ comida, dia, panel: 'revision', items: deAyer.map(({ fuente, ref, nombre, cantidad, valores, estimado }) => ({ fuente, ref, nombre, cantidad, valores, ...(estimado ? { estimado } : {}) })) })}
          />
        )}
      </View>
    </View>
  );
}

/** Debajo de la línea: confirmar lo planificado cuando llega el día (o después, si quedó sin confirmar), y copiar el día a hoy o a mañana. */
function AccionesDelDia({ e, dia }: { e: Estado; dia: ClaveDia }) {
  const [copiando, setCopiando] = useState(false);
  const registros = registrosDe(e, dia);
  // Lo que armó el plan se anota de a una comida, con «Comí esto»: confirmar todo junto anotaría también la cena que falta.
  const planificados = dia <= e.hoy ? registros.filter((r) => r.planificado && !r.plan).length : 0;
  const destinos = [e.hoy, sumarDias(e.hoy, 1)].filter((d) => d !== dia);
  if (!registros.length) return null;
  const copiar = (hacia: ClaveDia) => {
    const copia = elAlmacen().copiar({ dia }, { dia: hacia });
    setCopiando(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    avisar(plural('comida.copiado', copia.length, { dia: tituloDelDia(hacia, e.hoy).toLowerCase() }), () => copia.forEach((r) => elAlmacen().borrarRegistro(r.id)));
  };
  const confirmarTodo = () => {
    // Los que confirma confirmarPlanificados, que devuelve cuántos: lo planificado a mano del día, sin lo del plan.
    const ids = confirmar(elAlmacen().estado().registros.values(), dia, '').filter((r) => !r.plan).map((r) => r.id);
    const n = elAlmacen().confirmarPlanificados(dia);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    avisar(plural('comida.confirmados', n), n ? () => elAlmacen().volverAPlanificar(ids) : undefined);
  };
  // Nada cambia de golpe: «Copiar el día» y «Copiar a…» se funden uno en otro, y lo de alrededor se acomoda.
  return (
    <Aparece style={estilos.accionesDelDia}>
      {planificados > 0 && (
        <Aparece>
          <Boton texto={t('comida.confirmar')} icono="checkmark" tipo="principal" alTocar={confirmarTodo} />
        </Aparece>
      )}
      {copiando ? (
        <Aparece key="destinos" style={estilos.acciones}>
          <Text style={estilos.copiarA}>{t('comida.copiarA')}</Text>
          {destinos.map((d) => <Boton key={d} texto={tituloDelDia(d, e.hoy)} tipo="secundario" alTocar={() => copiar(d)} />)}
          <Boton texto={t('comun.cancelar')} tipo="contorno" alTocar={() => setCopiando(false)} />
        </Aparece>
      ) : (
        <Aparece key="copiar">
          <Boton texto={t('comida.copiarDia')} icono="doc.on.doc" tipo="contorno" alTocar={() => setCopiando(true)} />
        </Aparece>
      )}
    </Aparece>
  );
}

/** Un alimento de la línea: el toque se ve en todo su ancho, con esquinas. */
const FILA = { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingVertical: 4, paddingHorizontal: 6, borderRadius: 8 } as const;

const estilos = StyleSheet.create({
  lleno: { flex: 1 },
  fecha: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.58)' },
  titulo: { marginTop: 6, fontFamily: letras.numeroMedio, fontSize: 28, letterSpacing: -0.3, color: colores.pergamino },
  hoy: { color: colores.oroClaro },
  apretado: { opacity: 0.6 },
  tira: { marginTop: 16, flexDirection: 'row', gap: 4 },
  tiraDia: { flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 9, borderRadius: 14, borderWidth: 1, borderColor: 'transparent' },
  tiraDiaElegido: { backgroundColor: 'rgba(239, 230, 207, 0.07)', borderColor: 'rgba(239, 230, 207, 0.16)' },
  tiraLetra: { fontFamily: letras.textoMedio, fontSize: 10, lineHeight: 12, letterSpacing: 1.2, color: 'rgba(239, 230, 207, 0.5)' },
  tiraLugar: { height: 24, marginVertical: 6 },
  tiraNumero: { fontFamily: letras.numeroMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.78)', fontVariant: ['tabular-nums'] },
  tiraLunas: { position: 'absolute', left: 0, right: 0, top: 8 + 12 + 6 },
  cuadro: { marginTop: 14, overflow: 'hidden', borderRadius: 20, backgroundColor: 'rgba(8, 12, 26, 0.66)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)' },
  cuadroTira: { flexDirection: 'row', alignItems: 'flex-start' },
  pagina: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16 },
  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 4, marginTop: 8 },
  punto: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 9 },
  puntoMarca: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(239, 230, 207, 0.42)' },
  puntoMarcaElegido: { backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro, shadowOpacity: 0.7, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } },
  puntoTexto: { fontFamily: letras.texto, fontSize: 11.5, letterSpacing: 0.4, color: 'rgba(239, 230, 207, 0.42)' },
  puntoTextoElegido: { color: colores.pergamino },
  resumen: { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: -8 },
  resumenLuna: { margin: -4 },
  resumenTextos: { gap: 6, flexShrink: 1 },
  resumenCifra: { fontFamily: letras.numero, fontSize: 30, letterSpacing: -0.4, color: colores.cifra, fontVariant: ['tabular-nums'] },
  resumenDe: { fontFamily: letras.texto, fontSize: 13, letterSpacing: 0, color: 'rgba(239, 230, 207, 0.55)' },
  resumenLinea: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.78)', fontVariant: ['tabular-nums'] },
  deMas: { color: colores.oroClaro },
  macros: { marginTop: 16, flexDirection: 'row', gap: 14 },
  macro: { flex: 1, gap: 7, minWidth: 0 },
  macroNombre: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  macroNombreTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.62)' },
  macroCifra: { fontFamily: letras.numeroMedio, fontSize: 14, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  barra: { height: 4, borderRadius: 4, backgroundColor: 'rgba(239, 230, 207, 0.08)', overflow: 'hidden' },
  barraLlena: { height: '100%', borderRadius: 4 },
  paginaCabeza: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 10 },
  paginaTitulo: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  paginaFechas: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
  promedioCifra: { marginTop: 6, fontFamily: letras.numero, fontSize: 32, letterSpacing: -0.3, color: colores.cifra, fontVariant: ['tabular-nums'] },
  promedioUnidad: { fontFamily: letras.texto, fontSize: 13, letterSpacing: 0, color: 'rgba(239, 230, 207, 0.58)' },
  promedioNota: { marginTop: 6, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.72)' },
  grafica: { marginTop: 14, paddingTop: 14, flexDirection: 'row', gap: 4, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  graficaMeta: { position: 'absolute', left: 0, right: 0, top: 14 + 20, borderTopWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(239, 230, 207, 0.32)' },
  graficaDia: { flex: 1, alignItems: 'center', gap: 6 },
  graficaBarras: { height: 120, width: '100%', flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2 },
  graficaBarra: { width: 5, borderTopLeftRadius: 3, borderTopRightRadius: 3, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 },
  tenue: { opacity: 0.35 },
  calendario: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  calendarioFila: { flexDirection: 'row' },
  calendarioLetra: { flex: 1, textAlign: 'center', paddingBottom: 8, fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 1.2, color: 'rgba(239, 230, 207, 0.45)' },
  calendarioSemana: { marginBottom: 2 },
  calendarioDia: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 12 },
  calendarioHoy: { backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  calendarioLugar: { height: 26 },
  calendarioLunas: { position: 'absolute', left: 0, right: 0, top: 6 },
  seccion: { marginTop: 32, marginBottom: 14, fontFamily: letras.numeroMedio, fontSize: 19, color: colores.pergamino },
  nota: { marginTop: -6, marginBottom: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  linea: { paddingLeft: 60 },
  lineaRaya: { position: 'absolute', left: 48, top: 6, bottom: 6, width: 1, backgroundColor: 'rgba(232, 196, 106, 0.42)' },
  hora: { position: 'absolute', left: -60, width: 40, top: 9, textAlign: 'right', fontFamily: letras.texto, fontSize: 11, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  horaAhora: { top: 0, color: colores.oroClaro },
  nodo: { position: 'absolute', left: -16.5, top: 10.5, width: 9, height: 9, borderRadius: 4.5, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.85, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  nodoVacio: { backgroundColor: '#070b18', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.7)', shadowOpacity: 0 },
  nodoPlan: { backgroundColor: 'rgba(232, 196, 106, 0.35)', shadowOpacity: 0 },
  nodoAhora: { top: 1.5, backgroundColor: colores.oroClaro, shadowColor: colores.oroClaro },
  entradaAhora: { height: 12 },
  ahoraTexto: { position: 'absolute', left: 2, top: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: colores.oroClaro },
  tarjeta: { borderRadius: 16, paddingTop: 11, paddingHorizontal: 14, paddingBottom: 10, backgroundColor: 'rgba(6, 10, 22, 0.66)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)' },
  tarjetaPlan: { borderStyle: 'dashed' },
  tenueDePlan: { opacity: 0.6 },
  tarjetaVacia: { gap: 11, paddingBottom: 13, backgroundColor: 'rgba(6, 10, 22, 0.35)', borderStyle: 'dashed', borderColor: 'rgba(232, 196, 106, 0.38)' },
  tarjetaCabeza: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 7 },
  tarjetaTitulo: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  tarjetaTituloEnFila: { flexShrink: 1 },
  etiquetaPlan: { alignSelf: 'center', fontFamily: letras.texto, fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase', color: colores.oro, paddingHorizontal: 7, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.4)', borderRadius: 999 },
  tarjetaKcal: { marginLeft: 'auto', fontFamily: letras.numeroMedio, fontSize: 16, color: colores.oroClaro, fontVariant: ['tabular-nums'] },
  tarjetaKcalUnidad: { fontFamily: letras.texto, fontSize: 10, color: 'rgba(239, 230, 207, 0.5)', letterSpacing: 0.6 },
  item: { ...FILA, marginHorizontal: -6 },
  // Lo de adelante de la fila que se desliza: el margen negativo lo lleva ella.
  itemFrente: FILA,
  // Levantado, con su aro: el borde se come un punto del relleno y lo de adentro queda en su lugar.
  itemLevantado: { paddingVertical: 3, paddingHorizontal: 5, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', borderRadius: 12 },
  itemApretado: { backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  tarjetaLevantada: { backgroundColor: FONDO_DE_TARJETA },
  itemTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.9)' },
  itemCantidad: { color: 'rgba(239, 230, 207, 0.5)' },
  itemKcal: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.58)', fontVariant: ['tabular-nums'] },
  tarjetaPie: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 7, paddingTop: 8, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  botonFoto: { marginLeft: 'auto', width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.06)' },
  foto: { marginTop: 8, height: 140, borderRadius: 12, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  fotoGrande: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: 'rgba(239, 230, 207, 0.05)' },
  fotoNota: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)' },
  mini: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniTexto: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  accionesDelDia: { marginTop: 22, marginLeft: 60, gap: 10, alignItems: 'flex-start' },
  copiarA: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.7)' },
});
