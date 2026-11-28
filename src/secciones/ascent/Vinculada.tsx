// La sección de Ascent vinculada, la misma que tiene Ascent de Moss (spec/musculos-compartido.md): la misma información,
// el mismo orden y lo mismo al tocar; cambia solo la cara. Se llega por abajo, a tus músculos (el cuerpo con el color
// de la semana, la barra de cada uno y, al tocar uno, sus partes, tus ejercicios y cuándo subir el peso, y la nota de
// tu rutina); subiendo, los fatigados, tu año, los estancados y por qué puedes estar estancado. Debajo de cada bloque,
// «En qué se basa», solo lo suyo. Las cuentas están en vista.ts y en puntajeMuscular.ts.

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { reglasDeCuidados } from '@/almacen/almacen';
import { deAscent, falloDeMeta, useAscent, type FalloDeMeta, type MetaPedida } from '@/almacen/ascent';
import type { Sistema } from '@/dominio/cantidades';
import { POCAS_PESADAS, PROTEINA_POR_KG, type Razon } from '@/dominio/progresoCompartido';
import { musculosPrincipales } from '@/dominio/fatiga';
import { diasEntre, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import type { Musculo } from '@/dominio/musculos';
import { RANGO, type EstadoDelPuntaje } from '@/dominio/puntajeMuscular';
import { NOCHE_CORTA } from '@/dominio/rendimiento';
import { totalDelDia } from '@/dominio/registros';
import { juicioDeLaDeuda } from '@/dominio/sueno';
import { sugerenciasDeHoy, type Sugerencia, type SugerenciasDeHoy } from '@/dominio/sugerenciasDeHoy';
import { lista, plural, t, type ClaveDeLista } from '@/textos';
import { letras } from '@/tema';
import { duracion, hora, metaDelDia, numero, sistemaDe, useEstado } from '../comida/datos';
import { avisar, cerrarRegistro } from '../comida/registro';
import { usePersona, useSueno } from '../ganchos';
import { cerrarLasHojas } from '../HojaModal';
import { alReabrirLaMeta, reabrirLaMeta } from './abrir';
import { C, GRUPOS_DEL_ANIO, useAcento } from './colores';
import { Cuerpo, Parte as ParteDeCerca, Reloj, type EstadoDibujado } from './Dibujos';
import { HojaDeMeta, type Borrador } from './HojaDeMeta';
import { conMayuscula, enFrase, enLaUnidad, enLista, ladoDe, nivelEn, nombreDelEjercicio, nombreDelMusculo, pesoEn, siguienteEn, tx, type Lado } from './palabras';
import { Cambia, Desplegable, Etiqueta, Flecha, Fundido, Nota, Parte, Una, Escala, Enlace } from './piezas';
import {
  calcularTodo, calcularTusMusculos, METAS_TOPE, objetivoDeHoy, type EjercicioDeLaSemana, type Estancado, type Falta, type Hoy, type MetaConProyeccion, type MusculoDeLaSemana, type Todo,
  type TusMusculos as DeTusMusculos,
} from './vista';

/** La barra del sueño va de 0 a 10 horas; la de la proteína, hasta 2,6 g por kilo. */
const SUENO_TOPE = 10 * 60;
const PROTEINA_TOPE = 2.6;
const LLEGA = Easing.bezier(0.2, 0.7, 0.2, 1);

/** Las cuentas de tus músculos, una vez para los dos lugares que las usan (abajo, tus músculos; arriba, los fatigados). */
export function useTusMusculos(h: Hoy | null): DeTusMusculos | null {
  return useMemo(() => (h ? calcularTusMusculos(h) : null), [h]);
}

/** Lo de arriba de tus músculos, de lo menos a lo más importante (se llega por abajo). */
export function RestoVinculada({ h, tm, preparada }: { h: Hoy; tm: DeTusMusculos; preparada: boolean }) {
  const e = useEstado();
  const d = useAscent();
  const persona = usePersona();
  const sueno = useSueno();
  const todo = useMemo(
    () => (preparada ? calcularTodo(h, { e, d, sueno, persona, ahora: new Date(h.ahora) }) : null),
    [preparada, h, e, d, sueno, persona],
  );
  if (!todo) return <View style={st.esperando} />;
  return (
    <>
      <Metas todo={todo} tm={tm} />
      {todo.estancados.length > 0 && <PorQue todo={todo} />}
      <Estancados todo={todo} />
      <TuAnio h={h} todo={todo} />
      <Rutina nota={tm.nota} />
      <Fatigados tm={tm} />
    </>
  );
}

// ------------------------------------------------------------ en qué se basa, debajo de cada bloque
function EnQueSeBasa({ de }: { de: 'musculos' | 'fatigados' | 'estancados' | 'porQue' | 'metas' }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <View style={st.base}>
      <Pressable onPress={() => setAbierto((x) => !x)} style={({ pressed }) => [st.baseCab, pressed && st.apretado]} hitSlop={6} accessibilityRole="button" accessibilityState={{ expanded: abierto }}>
        <Text style={st.baseTitulo}>{t('ascent.enQueSeBasa')}</Text>
        <Flecha abierta={abierto} />
      </Pressable>
      <Desplegable abierto={abierto} style={st.baseCuerpo}>
        {lista(`ascent.baseDe.${de}` as ClaveDeLista).map((p) => {
          const i = p.indexOf(':');
          return (
            <Text key={p} style={st.baseParrafo}>
              {i > 0 && i < 40 ? <><Text style={st.baseNegrita}>{p.slice(0, i + 1)}</Text>{p.slice(i + 1)}</> : p}
            </Text>
          );
        })}
      </Desplegable>
    </View>
  );
}

// ------------------------------------------------------------ sugerencias para hoy (justo arriba de «Esta semana»)
/** Las sugerencias de hoy (sugerenciasDeHoy.ts, igual en Ascent) con lo de Moss y lo de Ascent de hoy. */
function useSugerenciasDeHoy(h: Hoy, tm: DeTusMusculos): SugerenciasDeHoy {
  const e = useEstado();
  const sueno = useSueno();
  return useMemo(() => {
    const musculos = h.sesion?.bloques ? musculosPrincipales(h.sesion.bloques) : [];
    // Más liviano solo con el músculo cargado (2 días o más), como el titular: con 1 día, la sesión no cambia
    // (spec/estudio/sugerencias-de-hoy.md, E6).
    const sinRecuperar = musculos.filter((m) => tm.fatigados.some((f) => f.musculo === m && f.fatiga === 'cargado'));
    const noches = sueno.deEjemplo ? [] : sueno.noches;
    const periodo = noches.length ? periodoDeMelatonina(noches, e.hoy, { margen: e.latencia, deuda: h.deuda }) : null;
    const ayer = sumarDias(e.hoy, -1);
    const comido = totalDelDia(e.registros.values(), ayer, false);
    const meta = metaDelDia(e, ayer);
    return sugerenciasDeHoy({
      sesion: h.sesion ? { musculos, minutos: h.sesion.minutos, hecha: h.sesion.como === 'hecha' } : null,
      sinRecuperar,
      // Las repeticiones que dice son las del objetivo: si la rutina de hoy pide pocas, las de fuerza.
      objetivo: objetivoDeHoy(h),
      noche: h.noche ? { dormido: h.noche.dormido, despertoAntes: h.noche.despertoAntes } : null,
      deuda: h.deuda === null ? null : juicioDeLaDeuda({ minutos: h.deuda }),
      necesidad: sueno.necesidad,
      // El periodo cuenta desde las 18 del día anterior; las sugerencias, desde la medianoche.
      acostarse: periodo ? (periodo.acostarse + 18 * 60) % (24 * 60) : null,
      ayer: comido.kcal > 0 && meta ? {
        kcal: comido.kcal, proteina: comido.proteina, carbohidratos: comido.carbohidratos, grasas: comido.grasas,
        metaKcal: meta.kcal, metaProteina: meta.proteina, metaCarbohidratos: meta.carbohidratos, metaGrasas: meta.grasas,
      } : null,
      cuidadoConLaComida: !!reglasDeCuidados(e)?.cuidados.includes('tca'),
    });
  }, [h, tm, e, sueno]);
}

export function ParaHoy({ h, tm, alIrASueno }: { h: Hoy; tm: DeTusMusculos; alIrASueno?: () => void }) {
  const a = useAcento();
  const s = useSugerenciasDeHoy(h, tm);
  const lista = (ms: readonly string[] | undefined) =>
    ms?.length ? enLista(ms.map((m) => nombreDelMusculo(m as Musculo).toLowerCase())) : (h.sesion?.nombre ?? '').toLowerCase();
  // Con más de un músculo que se recupera, el verbo va en plural.
  const clave = (x: Sugerencia) => (x.clave === 'conFatiga' && (x.fatigados?.length ?? 0) > 1 ? 'conFatigaVarios' : x.clave);
  const texto = (grupo: 'entreno' | 'comida' | 'sueno', x: Sugerencia) => tx(`ascent.sugerencias.${grupo}.${clave(x)}`, {
    musculos: lista(x.musculos), fatigados: conMayuscula(lista(x.fatigados)), repsDe: x.reps?.[0] ?? '', repsA: x.reps?.[1] ?? '', reservaDe: x.reserva?.[0] ?? '', reservaA: x.reserva?.[1] ?? '',
    hora: x.hora === undefined ? '' : hora(x.hora),
    macros: enLista((x.macros ?? []).map((m) => t(`comida.${m}`).toLowerCase())), horas: x.minutos === undefined ? '' : duracion(x.minutos),
  });
  // Si ya entrenaste hoy, el entrenamiento no va: quedan la comida y el sueño.
  const filas = ([['entreno', s.entreno], ['comida', s.comida], ['sueno', s.sueno]] as const).filter((f): f is ['entreno' | 'comida' | 'sueno', Sugerencia] => f[1] !== null);
  return (
    <View style={st.paraHoy}>
      <Etiqueta>{t('ascent.sugerencias.titulo')}</Etiqueta>
      {filas.map(([grupo, x]) => (
        <View key={grupo} style={st.sugerencia}>
          <View style={[st.sugerenciaPunto, { backgroundColor: a.claro }]} />
          <View style={st.crece}>
            <Text style={st.sugerenciaTipo}>{t(`ascent.sugerencias.tipos.${grupo}`)}</Text>
            <Text style={st.sugerenciaTexto}>{texto(grupo, x)}</Text>
            {grupo === 'sueno' && alIrASueno && <Enlace texto={t('ascent.sugerencias.masEnSueno')} alTocar={alIrASueno} estilo={st.sugerenciaEnlace} />}
          </View>
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------ tus músculos (lo principal, donde se llega)
/** Los músculos que se ven de frente y los de espalda: la lista de cada lado va al lado del dibujo. */
const DEL_FRENTE: readonly Musculo[] = ['pecho', 'hombros', 'biceps', 'antebrazos', 'abdomen', 'cuadriceps', 'aductores'];
const DE_ESPALDA: readonly Musculo[] = ['trapecio', 'dorsales', 'triceps', 'espaldaBaja', 'gluteos', 'isquios', 'pantorrillas'];
/** La barra de cada músculo va de 0 a 30 series, con la franja de 10 a 20 marcada. */
const TOPE_DE_SERIES = 30;
const enLaBarra = (n: number) => (Math.min(TOPE_DE_SERIES, Math.max(0, n)) / TOPE_DE_SERIES) * 100;
/** Las series se dicen con su medio (la del músculo que ayuda cuenta media): redondeado, 9,5 decía «10» al lado de «Le faltan». */
const series = (n: number) => numero(n, 1);
/** Un peso redondo cuando lo es («60»), con un decimal cuando no («62,5»). */
const cifra = (v: number) => numero(v, v % 1 ? 1 : 0);
/** Un peso de Ascent (en kg) en la unidad de cada uno: «62,5 kg» o «137,5 lb»; el de un lado, «27,5 kg por mancuerna». */
const conUnidad = (kg: number, s: Sistema, lado: Lado = null) => enLaUnidad(`${cifra(pesoEn(kg, s))} kg`, s, lado);

export function TusMusculos({ tm, hoy }: { tm: DeTusMusculos; hoy?: ReactNode }) {
  const { width } = useWindowDimensions();
  const [lado, setLado] = useState<'frente' | 'espalda'>('frente');
  const [elegido, setElegido] = useState<Musculo | null>(null);
  const elegir = (m: Musculo) => {
    Haptics.selectionAsync().catch(() => {});
    setElegido((x) => (x === m ? null : m));
  };
  const clases = Object.fromEntries(tm.musculos.filter((m) => m.estado !== 'sinEntrenar').map((m) => [m.musculo, m.estado as EstadoDibujado]));
  const fatigados = tm.fatigados.map((m) => m.musculo);
  const delLado = (lado === 'frente' ? DEL_FRENTE : DE_ESPALDA).map((m) => tm.musculos.find((x) => x.musculo === m)!).filter(Boolean);
  const del = elegido ? tm.musculos.find((m) => m.musculo === elegido) ?? null : null;
  const anchoDelCuerpo = Math.min(160, Math.round((width - 44) * 0.42));
  return (
    <View style={st.tus}>
      <Text style={st.paraQue}>{t('ascent.tus.paraQue')}</Text>
      {/* Sugerencias para hoy, justo arriba de «Esta semana» (lo pidió el dueño el 23/11/2026, igual en Ascent). */}
      {hoy}
      {!tm.conDatos ? (
        <Text style={st.vacio}>{t('ascent.tus.sinDatos')}</Text>
      ) : (
        <>
          <Etiqueta style={st.semanaEtq}>{t('ascent.tus.semana')}</Etiqueta>
          <Text style={st.semanaTexto}>{t('ascent.tus.semanaTexto')}</Text>
          <View style={st.lados}>
            {(['frente', 'espalda'] as const).map((x) => (
              <Pressable key={x} onPress={() => { setLado(x); setElegido(null); }} style={[st.ladoBoton, lado === x && st.ladoElegido]} accessibilityRole="button" accessibilityState={{ selected: lado === x }}>
                <Text style={[st.ladoTexto, lado === x && st.ladoTextoElegido]}>{t(`ascent.cuerpo.${x}`)}</Text>
              </Pressable>
            ))}
          </View>
          <Fundido clave={lado} style={st.cuerpoYLista}>
            <Cuerpo ancho={anchoDelCuerpo} lado={lado} clases={clases} fatigados={fatigados} elegido={elegido} alTocar={elegir} etiqueta={t('ascent.tus.titulo')} />
            <View style={st.listaDelLado}>
              {delLado.map((m) => <FilaDelMusculo key={m.musculo} m={m} elegido={m.musculo === elegido} alTocar={() => elegir(m.musculo)} />)}
            </View>
          </Fundido>
          {del ? (
            <Fundido clave={del.musculo} style={st.debajo}>
              <DetalleDelMusculo m={del} tm={tm} alCerrar={() => setElegido(null)} />
            </Fundido>
          ) : (
            <Leyenda />
          )}
        </>
      )}
      <Nota style={st.anotas}>{t('ascent.tus.anotas')}</Nota>
      <EnQueSeBasa de="musculos" />
    </View>
  );
}

/** Qué hacer según cómo está cada músculo esta semana, con su color; y el borde de lo que todavía se recupera. */
function Leyenda() {
  const a = useAcento();
  const relleno: Record<Exclude<EstadoDelPuntaje, 'sinEntrenar'>, object> = {
    poco: { backgroundColor: a.claro, opacity: 0.4 },
    enSuPunto: { backgroundColor: a.claro },
    mucho: { backgroundColor: C.ambar, opacity: 0.85 },
  };
  return (
    <View style={st.leyenda}>
      {(['poco', 'enSuPunto', 'mucho'] as const).map((x) => (
        <View key={x} style={st.leyendaFila}>
          <View style={[st.leyendaCuadro, relleno[x]]} />
          <Text style={st.leyendaTexto}><Text style={st.leyendaEstado}>{tx(`ascent.tus.estados.${x}`)}: </Text>{tx(`ascent.tus.acciones.${x}`)}</Text>
        </View>
      ))}
      <View style={st.leyendaFila}>
        <View style={[st.leyendaCuadro, st.leyendaFatigado]} />
        <Text style={st.leyendaTexto}><Text style={st.leyendaEstado}>{t('ascent.tus.estados.fatigado')}: </Text>{t('ascent.tus.acciones.fatigado')}</Text>
      </View>
      <Text style={st.toca}>{t('ascent.tus.toca')}</Text>
    </View>
  );
}

/** Las series de la semana de 0 a 30, con la franja de 10 a 20; lo lleno crece al aparecer. */
function BarraDeSeries({ n, estado, alta = 6 }: { n: number; estado: EstadoDelPuntaje; alta?: number }) {
  const a = useAcento();
  const reducido = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    v.set(withTiming(enLaBarra(n), { duration: reducido ? 0 : 700, easing: LLEGA }));
  }, [n, reducido, v]);
  const lleno = useAnimatedStyle(() => ({ width: `${v.get()}%` }));
  const color = estado === 'mucho' ? C.ambar : a.claro;
  const zona = { left: `${enLaBarra(RANGO.desde)}%`, width: `${enLaBarra(RANGO.hasta) - enLaBarra(RANGO.desde)}%` } as const;
  return (
    <View style={[st.pista, { height: alta, borderRadius: alta / 2 }]}>
      <View style={[st.zona, zona]} />
      <Animated.View style={[st.lleno, { backgroundColor: color, borderRadius: alta / 2, opacity: estado === 'poco' ? 0.55 : 1 }, lleno]} />
      <View style={[st.bordes, zona]} />
    </View>
  );
}

function FilaDelMusculo({ m, elegido, alTocar }: { m: MusculoDeLaSemana; elegido: boolean; alTocar: () => void }) {
  const estado = tx(`ascent.tus.estados.${m.estado}`);
  return (
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [st.fila, elegido && st.filaElegida, pressed && st.apretado]}
      accessibilityRole="button"
      accessibilityState={{ selected: elegido }}
      accessibilityLabel={t('ascent.tus.barra', { musculo: nombreDelMusculo(m.musculo), series: series(m.series), estado: estado.toLowerCase() })}
    >
      <View style={st.filaCab}>
        <Text style={st.filaNombre} numberOfLines={1}>{nombreDelMusculo(m.musculo)}</Text>
        {m.dias > 0 && <View style={st.filaFatiga} />}
        <Text style={[st.filaEstado, m.estado === 'mucho' && { color: C.ambar }]} numberOfLines={1}>{estado}</Text>
        <Text style={[st.filaNumero, m.estado === 'mucho' && { color: C.ambar }]}>{series(m.series)}</Text>
      </View>
      <BarraDeSeries n={m.series} estado={m.estado} />
    </Pressable>
  );
}

/** «falta 1 día» o «faltan 3 días»: lo que le falta para recuperarse. */
const cuandoVuelve = (f: { dias: number }): string => plural('ascent.fatigados.faltan', Math.max(1, Math.ceil(f.dias)));

/** Un músculo: de cerca con sus partes (si tiene), sus series contra lo ideal, qué hacer, cuándo está listo y sus ejercicios. */
function DetalleDelMusculo({ m, tm, alCerrar }: { m: MusculoDeLaSemana; tm: DeTusMusculos; alCerrar: () => void }) {
  const a = useAcento();
  const sistema = sistemaDe(useEstado());
  const fuerte = (x: EjercicioDeLaSemana) => x.principal.includes(m.musculo);
  const ejercicios = tm.ejercicios.filter((x) => fuerte(x) || x.ayudan.includes(m.musculo)).sort((x, y) => Number(fuerte(y)) - Number(fuerte(x)));
  const fatigado = tm.fatigados.find((x) => x.musculo === m.musculo) ?? null;
  const parte = m.musculo === 'pecho' ? 'pechoAlto' : m.musculo === 'triceps' ? 'tricepsLarga' : null;
  const enParte = parte ? (m.partes[parte] ?? 0) : 0;
  return (
    <View>
      <View style={st.detCab}>
        <Text style={st.detNombre}>{nombreDelMusculo(m.musculo)}</Text>
        <Pressable onPress={alCerrar} hitSlop={10} accessibilityRole="button"><Text style={st.cerrar}>{t('ascent.tus.cerrar')}</Text></Pressable>
      </View>
      <Text style={st.detSeries}>{t('ascent.tus.seriesCorto', { n: series(m.series) })}</Text>
      <BarraDeSeries n={m.series} estado={m.estado} alta={8} />
      <Text style={[st.detAccion, m.estado === 'mucho' && { color: C.ambar }]}>{m.estado === 'sinEntrenar' ? t('ascent.tus.acciones.sinEntrenar') : `${tx(`ascent.tus.estados.${m.estado}`)}: ${tx(`ascent.tus.acciones.${m.estado}`)}`}</Text>
      {fatigado && (
        <View style={st.detFatiga}>
          <Reloj tam={22} hecho={1 - fatigado.dias / fatigado.total} color={C.lejos} etiqueta={cuandoVuelve(fatigado)} />
          <Text style={st.detFatigaTexto}>{`${t('ascent.tus.estados.fatigado')} · ${cuandoVuelve(fatigado)}`}<Text style={st.estimado}>{` · ${t('ascent.fatigados.estimado')}`}</Text></Text>
        </View>
      )}
      {parte && (
        <View style={st.partes}>
          <ParteDeCerca musculo={m.musculo as 'pecho' | 'triceps'} ancho={120} alto={96} parte={enParte > 0 ? 'enSuPunto' : null} resto={m.series - enParte > 0 ? 'poco' : null} etiqueta={t('ascent.tus.partes.titulo')} />
          <View style={st.crece}>
            {([[parte, enParte], [`${m.musculo}Resto`, Math.max(0, m.series - enParte)]] as const).map(([k, n], i) => (
              <View key={k} style={st.parteFila}>
                <View style={[st.parteMarca, { backgroundColor: a.claro }, i === 1 && st.parteMarcaResto]} />
                <Text style={st.parteNombre}>{t('ascent.tus.partes.linea', { parte: tx(`ascent.tus.partes.${k}`), n: series(n) })}</Text>
              </View>
            ))}
            <Text style={st.parteNota}>{tx(`ascent.tus.partes.como.${m.musculo}`)}</Text>
          </View>
        </View>
      )}
      <Etiqueta style={st.ejsEtq}>{t('ascent.tus.ejercicios')}</Etiqueta>
      {!ejercicios.length ? (
        <Text style={st.ninguno}>{t('ascent.tus.sinEjercicios')}</Text>
      ) : (
        ejercicios.map((x) => <FilaDelEjercicio key={nombreDelEjercicio(x.e)} x={x} musculo={m.musculo} ayuda={!fuerte(x)} sistema={sistema} />)
      )}
    </View>
  );
}

function FilaDelEjercicio({ x, musculo, ayuda, sistema }: { x: EjercicioDeLaSemana; musculo: Musculo; ayuda: boolean; sistema: Sistema }) {
  const a = useAcento();
  const p = x.proxima;
  // Lo que se anota por mancuerna o por lado se dice así: el peso llega en total.
  const lado = ladoDe({ id: x.e.id, carga: x.carga });
  const kg = lado ? x.peso / 2 : x.peso;
  const siguiente = siguienteEn(kg, sistema);
  const peso = x.peso > 0 ? conUnidad(kg, sistema, lado) : t('ascent.tus.mismoPeso');
  const proxima = p.decision === 'subir'
    ? (siguiente === null ? t('ascent.tus.proxima.subirSinPeso') : enLaUnidad(t('ascent.tus.proxima.subirA', { kg: cifra(siguiente) }), sistema, lado))
    : p.decision === 'noSeSabe' ? t('ascent.tus.proxima.pocasSesiones', { peso }) : tx(`ascent.tus.proxima.${p.razon}`, { tope: x.tope ?? '', peso });
  return (
    <View style={st.ej}>
      <View style={st.ejCab}>
        <Text style={st.ejNombre}>{nombreDelEjercicio(x.e)}</Text>
        <Text style={st.ejSeries}>{t('ascent.tus.duras', { n: x.duras })}</Text>
      </View>
      {ayuda ? (
        <Text style={st.ejDatos}>{t('ascent.tus.ayuda', { musculo: nombreDelMusculo(musculo).toLowerCase() })}</Text>
      ) : (
        <View style={st.ejProxima}>
          <Text style={[st.ejFlecha, { color: p.decision === 'subir' ? a.claro : C.sub }]}>{p.decision === 'subir' ? '↑' : '='}</Text>
          <Text style={st.ejProximaTexto}>{proxima}</Text>
        </View>
      )}
    </View>
  );
}

/** La nota de tu rutina de Ascent y lo que la mejoraría (más arriba, aparte). */
function Rutina({ nota }: { nota: DeTusMusculos['nota'] }) {
  const a = useAcento();
  return (
    <Parte titulo={t('ascent.tus.rutina.titulo')} derecha={nota ? <Text style={[st.rutinaNota, { color: nota.nota === 'mejorable' ? C.lejos : a.claro }]}>{tx(`ascent.tus.rutina.nota.${nota.nota}`)}</Text> : undefined}>
      {!nota ? (
        <Text style={st.ninguno}>{t('ascent.tus.rutina.sinRutina')}</Text>
      ) : !nota.mejoras.length ? (
        <Text style={st.mejora}>{t('ascent.tus.rutina.bien')}</Text>
      ) : (
        nota.mejoras.map((x) => (
          <Text key={x.musculo} style={st.mejora}>
            {conMayuscula(tx(`ascent.tus.rutina.${x.que}`, { musculo: nombreDelMusculo(x.musculo as Musculo).toLowerCase(), n: series(x.series) }))}
          </Text>
        ))
      )}
    </Parte>
  );
}

// ------------------------------------------------------------ músculos fatigados
function Fatigados({ tm }: { tm: DeTusMusculos }) {
  return (
    <Parte titulo={t('ascent.fatigados.titulo')}>
      <Una>{t('ascent.fatigados.texto')}</Una>
      {!tm.fatigados.length ? (
        <Text style={st.ninguno}>{t('ascent.fatigados.ninguno')}</Text>
      ) : (
        <View style={st.fatigados}>
          {tm.fatigados.map((m, i) => (
            <View key={m.musculo} style={[st.fatigado, i === 0 && st.sinBorde]}>
              <Reloj tam={24} hecho={1 - m.dias / m.total} color={C.lejos} />
              <Text style={st.fatigadoNombre}>{nombreDelMusculo(m.musculo)}</Text>
              <Text style={st.fatigadoCuando}>{cuandoVuelve(m)}</Text>
            </View>
          ))}
          <Text style={st.parteNota}>{t('ascent.fatigados.comoSeCalcula')}</Text>
        </View>
      )}
      <EnQueSeBasa de="fatigados" />
    </Parte>
  );
}

// ------------------------------------------------------------ los estancados y por qué
const v1 = (n: number) => numero(Math.round(n * 10) / 10, Math.round(n * 10) % 10 ? 1 : 0);
const horasDe = (min: number) => duracion(Math.round(min / 5) * 5);

function Estancados({ todo }: { todo: Todo }) {
  const est = todo.estancados;
  const sistema = sistemaDe(useEstado());
  return (
    <Parte titulo={t('ascent.estancados.lista')}>
      <Una>{t('ascent.estancados.texto', { n: todo.umbral })}</Una>
      {!est.length ? (
        <Text style={st.ninguno}>{t('ascent.estancados.ninguno')}</Text>
      ) : (
        est.map((e, i) => {
          const marca = enLaUnidad(t('ascent.estancamiento.marca', { kg: cifra(pesoEn(e.ultima.kilos, sistema)), reps: e.ultima.reps }), sistema);
          return (
            <View key={nombreDelEjercicio(e.e)} style={[st.estancEj, i === 0 && st.sinBorde]}>
              <Text style={st.estancNombre}>{nombreDelEjercicio(e.e)}</Text>
              <Text style={st.estancDato}>{t('ascent.estancados.dato', { n: e.sinMarca, marca })}</Text>
            </View>
          );
        })
      )}
      <EnQueSeBasa de="estancados" />
    </Parte>
  );
}

/** Las series duras de cada semana: las de cuando subía, llenas; las de ahora, huecas. */
function Barras({ est }: { est: Estancado }) {
  const a = useAcento();
  const tope = Math.max(1, ...est.antes.map((s) => s.series), ...est.ahora.map((s) => s.series));
  const barra = (n: number, ahora: boolean, k: string) => <View key={k} style={[st.barra, ahora ? [st.barraAhora, { borderColor: a.principal }] : [st.barraAntes, { backgroundColor: a.claro }], { height: `${Math.max(4, (n / tope) * 100)}%` }]} />;
  return (
    <View style={st.semanas}>
      {est.antes.map((s) => barra(s.series, false, `a${s.lunes}`))}
      <View style={st.semanasDivisor} />
      {est.ahora.map((s) => barra(s.series, true, `h${s.lunes}`))}
    </View>
  );
}

function RazonVista({ x, est }: { x: Razon; est: Estancado }) {
  const a = useAcento();
  const cab = (titulo: string, valor?: string) => (
    <View style={st.razonCab}>
      <Text style={st.razonTitulo}>{titulo}</Text>
      {!!valor && <Text style={st.razonValor}>{valor}</Text>}
    </View>
  );
  const p = (texto: string) => <Text style={st.razonTexto}>{texto}</Text>;
  if (x.que === 'series') {
    const texto = t('ascent.estancados.series.texto');
    return (
      <View style={st.razon}>
        {cab(t('ascent.estancados.series.titulo', { musculo: nombreDelMusculo(est.musculo).toLowerCase() }), `${v1(x.antes)} → ${v1(x.ahora)}`)}
        <View accessible accessibilityRole="image" accessibilityLabel={t('ascent.estancados.series.etiqueta', { antes: v1(x.antes), ahora: v1(x.ahora) })}><Barras est={est} /></View>
        <View style={st.leyendaRazon}>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAntes, { backgroundColor: a.claro }]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.antes')}</Text></View>
          <View style={st.leyendaItem}><View style={[st.leyendaCuadro, st.barraAhora, { borderColor: a.principal }]} /><Text style={st.leyendaTexto}>{t('ascent.estancados.leyenda.ahora')}</Text></View>
        </View>
        {p(texto)}
      </View>
    );
  }
  if (x.que === 'frecuencia') return <View style={st.razon}>{cab(t('ascent.estancados.frecuencia.titulo'), `${v1(x.antes)} → ${v1(x.ahora)}`)}{p(t('ascent.estancados.frecuencia.texto', { antes: v1(x.antes), ahora: v1(x.ahora) }))}</View>;
  if (x.que === 'pesadas') {
    const texto = t('ascent.estancados.pesadas.texto', { n: x.pesadas, de: x.de });
    return <View style={st.razon}>{cab(t('ascent.estancados.pesadas.titulo'), `${x.pesadas} / ${x.de}`)}<Escala valor={x.pesadas / x.de} tope={1} rayas={[[POCAS_PESADAS, t('ascent.estancados.pesadas.raya')]]} etiqueta={texto} />{p(texto)}</View>;
  }
  if (x.que === 'bajando') return <View style={st.razon}>{cab(t('ascent.estancados.bajando.titulo'), t('ascent.estancados.bajando.valor', { n: numero(x.porSemana, 1) }))}{p(t('ascent.estancados.bajando.texto'))}</View>;
  if (x.que === 'definicion') return <View style={st.razon}>{cab(t('ascent.estancados.definicion.titulo'))}{p(t('ascent.estancados.definicion.texto'))}</View>;
  if (x.que === 'proteina') {
    const texto = t('ascent.estancados.proteina.texto', { g: numero(x.gPorKg, 1) });
    return <View style={st.razon}>{cab(t('ascent.estancados.proteina.titulo'), t('ascent.filas.comida.valor', { g: numero(x.gPorKg, 1) }))}<Escala valor={x.gPorKg} tope={PROTEINA_TOPE} rayas={[[PROTEINA_POR_KG, t('ascent.filas.comida.raya')]]} limita etiqueta={texto} />{p(texto)}</View>;
  }
  return (
    <View style={st.razon}>
      {cab(t('ascent.estancados.sueno.titulo'), horasDe(x.ahora))}
      <Escala valor={x.ahora} tope={SUENO_TOPE} rayas={[[NOCHE_CORTA, t('ascent.filas.sueno.seis')]]} zona={NOCHE_CORTA} etiqueta={horasDe(x.ahora)} />
      {p(x.antes !== null ? t('ascent.estancados.sueno.texto', { ahora: horasDe(x.ahora), antes: horasDe(x.antes) }) : t('ascent.estancados.sueno.sinAntes', { ahora: horasDe(x.ahora) }))}
    </View>
  );
}

/** Lo que es de la persona y no del ejercicio: si les toca a todos, va una vez, arriba. */
const DE_LA_PERSONA: readonly Razon['que'][] = ['bajando', 'definicion', 'proteina', 'sueno'];

function PorQue({ todo }: { todo: Todo }) {
  const est = todo.estancados;
  const comunes = est.length > 1 ? DE_LA_PERSONA.filter((q) => est.every((e) => e.r.razones.some((x) => x.que === q))) : [];
  return (
    <Parte titulo={t('ascent.porQue.titulo')}>
      {!est.length ? (
        <Text style={st.ninguno}>{t('ascent.porQue.ninguno')}</Text>
      ) : (
        <>
          {comunes.length > 0 && (
            <View style={[st.estancEj, st.sinBorde]}>
              <Text style={st.estancNombre}>{t('ascent.estancados.comunes')}</Text>
              <View style={st.razones}>{est[0].r.razones.filter((x) => comunes.includes(x.que)).map((x) => <RazonVista key={x.que} x={x} est={est[0]} />)}</View>
            </View>
          )}
          {est.map((e, i) => {
            const propias = e.r.razones.filter((x) => !comunes.includes(x.que));
            return (
              <View key={nombreDelEjercicio(e.e)} style={[st.estancEj, i === 0 && !comunes.length && st.sinBorde]}>
                <Text style={st.estancNombre}>{nombreDelEjercicio(e.e)}</Text>
                {propias.length ? (
                  <View style={st.razones}>{propias.map((x) => <RazonVista key={x.que} x={x} est={e} />)}</View>
                ) : (
                  <Text style={st.ninguno}>{t(comunes.length ? 'ascent.estancados.soloComunes' : 'ascent.estancados.sinCausa')}</Text>
                )}
                {(e.r.faltan.includes('comida') || e.r.faltan.includes('sueno')) && <Nota>{t('ascent.estancados.faltan')}</Nota>}
              </View>
            );
          })}
          {est.some((e) => e.r.anios !== null) && <Text style={st.contexto}>{t('ascent.estancados.anios')}</Text>}
        </>
      )}
      <EnQueSeBasa de="porQue" />
    </Parte>
  );
}


// ------------------------------------------------------------ metas (arriba de todo: lo que menos importa)
/** Lo que dice el aviso si no se pudo guardar o borrar una meta: lo de cada caso. */
function textoDelFallo(porQue: FalloDeMeta, borrando: boolean): string {
  if (porQue === 'demasiadas') return t('ascent.metas.demasiadas', { n: METAS_TOPE });
  if (porQue === 'sinVinculo') return t('ascent.metas.sinVinculo');
  if (porQue === 'sinRespuesta') return t(borrando ? 'ascent.metas.sinRespuestaBorrar' : 'ascent.metas.sinRespuesta');
  return t(borrando ? 'ascent.metas.errorBorrar' : 'ascent.metas.error');
}

/** Lo que falta para estimar cuándo llegas, dicho. */
const textoDeLaFalta = (f: Falta) => (f.que === 'sesiones' || f.que === 'semanas'
  ? plural(f.que === 'sesiones' ? 'ascent.metas.faltanSesiones' : 'ascent.metas.faltanSemanas', f.n)
  : t(f.que === 'sinReps' ? 'ascent.metas.faltaReps' : f.que === 'sinPeso' ? 'ascent.metas.faltaPeso' : 'ascent.metas.muchasReps'));

/**
 * Las filas de una lista que cambia: las que llegan después de la primera vez crecen, y las que se van se pliegan en su
 * lugar antes de irse (`sacar`, al terminar). `clave` reconoce cada una de una vez a otra.
 */
function useFilas<T>(lista: readonly T[], clave: (x: T) => string) {
  type Fila = { k: string; x: T; entra: boolean; sale: boolean };
  // Si dos llegan con la misma (un momento, dos pendientes del mismo ejercicio), la segunda va aparte: React las quiere únicas.
  const claves = (xs: readonly T[]) => {
    const vistas = new Set<string>();
    return xs.map((x) => {
      let k = clave(x);
      while (vistas.has(k)) k += '+';
      vistas.add(k);
      return k;
    });
  };
  const [hay, setHay] = useState(() => {
    const ks = claves(lista);
    return { de: lista, filas: lista.map((x, i): Fila => ({ k: ks[i], x, entra: false, sale: false })) };
  });
  let filas = hay.filas;
  if (hay.de !== lista) {
    const antes = new Map(filas.map((f) => [f.k, f]));
    const ks = claves(lista);
    const nuevas = lista.map((x, i): Fila => {
      const k = ks[i];
      return { k, x, entra: antes.get(k)?.entra ?? true, sale: false };
    });
    const quedan = new Set(nuevas.map((f) => f.k));
    filas.forEach((f, i) => {
      if (quedan.has(f.k)) return;
      const arriba = filas.slice(0, i).reverse().find((g) => quedan.has(g.k));
      nuevas.splice(arriba ? nuevas.findIndex((g) => g.k === arriba.k) + 1 : 0, 0, { ...f, sale: true });
      quedan.add(f.k);
    });
    filas = nuevas;
    setHay({ de: lista, filas });
  }
  const sacar = (k: string) => setHay((x) => ({ ...x, filas: x.filas.filter((f) => f.k !== k || !f.sale) }));
  return { filas, sacar };
}

function Metas({ todo, tm }: { todo: Todo; tm: DeTusMusculos }) {
  const sistema = sistemaDe(useEstado());
  // La hoja de la meta: la que se cambia o, con null, una nueva; con lo escrito, si no se pudo guardar. `vez` la arma de
  // nuevo en cada apertura.
  const [hoja, setHoja] = useState<{ abierta: boolean; meta: MetaConProyeccion | null; borrador: Borrador | null; vez: number }>({ abierta: false, meta: null, borrador: null, vez: 0 });
  // Una meta por ejercicio: la fila se reconoce por él, así no se arma de nuevo cuando llega el id del servidor.
  const { filas, sacar } = useFilas(todo.metas, (x) => x.meta.ejercicio);
  const abrir = (meta: MetaConProyeccion | null, borrador: Borrador | null = null) => setHoja((x) => ({ abierta: true, meta, borrador, vez: x.vez + 1 }));
  // «Reintentar» llega también con la sección cerrada (este componente ya no estaba): lo pedido espera en abrir.ts.
  useEffect(() => alReabrirLaMeta((b) => abrir(null, b)));
  const guardar = (m: MetaPedida, borrador: Borrador) => {
    deAscent().guardarMeta(m).catch((e: unknown) => {
      const porQue = falloDeMeta(e);
      // Sin conexión o sin respuesta, se vuelve a la hoja con lo escrito: se cierra lo que haya encima y se abre la sección.
      const volver = porQue === 'red' || porQue === 'sinRespuesta';
      const reintentar = () => {
        cerrarLasHojas();
        cerrarRegistro();
        reabrirLaMeta(borrador);
      };
      avisar(textoDelFallo(porQue, false), volver ? reintentar : undefined, volver ? t('ascent.metas.reintentar') : undefined);
    });
  };
  // Se va al instante, plegándose; si el servidor no la borra, vuelve creciendo.
  const borrar = (id: string) => {
    deAscent().borrarMeta(id).catch((e: unknown) => avisar(textoDelFallo(falloDeMeta(e), true)));
  };
  return (
    <Parte titulo={t('ascent.metas.titulo')}>
      <Desplegable abierto={!todo.metas.length}><Una>{t('ascent.metas.ninguna')}</Una></Desplegable>
      {filas.map((f, i) => (
        <Desplegable key={f.k} abierto={!f.sale} entra={f.entra} alPlegarse={() => sacar(f.k)}>
          <FilaDeMeta x={f.x} todo={todo} tm={tm} primera={i === 0} sistema={sistema} alEditar={() => abrir(f.x)} />
        </Desplegable>
      ))}
      <Enlace texto={t('ascent.metas.nueva')} alTocar={() => abrir(null)} />
      <Desplegable abierto={todo.proteina !== null && todo.metas.some((x) => !x.alcanzada)}>
        <Text style={st.metaHacer}>{t('ascent.metas.comer', { g: todo.proteina ?? 0 })}</Text>
      </Desplegable>
      <EnQueSeBasa de="metas" />
      <HojaDeMeta
        key={hoja.vez}
        abierta={hoja.abierta}
        meta={hoja.meta}
        borrador={hoja.borrador}
        metas={todo.metas}
        ejercicios={todo.paraMetas}
        sistema={sistema}
        alCerrar={() => setHoja((x) => ({ ...x, abierta: false }))}
        alGuardar={guardar}
        alBorrar={borrar}
      />
    </Parte>
  );
}

function FilaDeMeta({ x, todo, tm, primera, sistema, alEditar }: { x: MetaConProyeccion; todo: Todo; tm: DeTusMusculos; primera: boolean; sistema: Sistema; alEditar: () => void }) {
  const a = useAcento();
  const p = x.proyeccion;
  // La meta y lo que llega de Ascent van en total: lo que se anota por mancuerna o por lado se dice así, la mitad.
  const lado = ladoDe({ id: x.meta.ejercicio, carga: x.carga });
  const deLado = (kg: number) => (lado ? kg / 2 : kg);
  // Alcanzada, solo con una serie de verdad (metaAlcanzada). Si lo que ya pasa la meta es el nivel estimado, se dice
  // eso y se invita a probarla: 40 kg × 8 no es haber levantado 50 kg una vez.
  const parte = x.alcanzada ? 1 : x.nivel === null ? null : Math.min(1, x.nivel / x.objetivo);
  const linea = x.alcanzada ? t('ascent.metas.alcanzada')
    : p.estado === 'lograda' ? t('ascent.metas.nivelPasa')
    : p.estado === 'enCamino'
      ? (p.semanas[1] === null ? plural('ascent.metas.enCaminoAbierto', p.semanas[0])
        : p.semanas[1] === p.semanas[0] ? plural('ascent.metas.enCaminoExacto', p.semanas[0])
        : t('ascent.metas.enCamino', { de: p.semanas[0], a: p.semanas[1] })) + (p.realista ? '' : ' ' + t('ascent.metas.lejana'))
      : p.estado === 'noSube' ? t('ascent.metas.noSube') : null;
  const ej = tm.ejercicios.find((y) => y.e.id === x.meta.ejercicio);
  const proxima = ej?.proxima;
  const siguiente = ej ? siguienteEn(deLado(ej.peso), sistema) : null;
  const peso = ej && ej.peso > 0 ? conUnidad(deLado(ej.peso), sistema, lado) : t('ascent.tus.mismoPeso');
  const queHacer = !proxima || proxima.decision === 'noSeSabe' ? null
    : proxima.decision === 'subir' ? (siguiente === null ? t('ascent.tus.proxima.subirSinPeso') : enLaUnidad(t('ascent.tus.proxima.subirA', { kg: cifra(siguiente) }), sistema, lado))
    : tx(`ascent.tus.proxima.${proxima.razon}`, { tope: ej?.tope ?? '', peso });
  const kg = cifra(pesoEn(deLado(x.meta.kilos), sistema));
  return (
    <View style={[st.meta, primera && st.sinBorde]}>
      <View style={st.metaCab}>
        <Text style={st.metaNombre}>{nombreDelEjercicio(x.e)}</Text>
        <Text style={st.metaObjetivo}>{enLaUnidad(x.meta.reps === 1 ? t('ascent.metas.objetivoUna', { kg }) : t('ascent.metas.objetivoVarias', { kg, reps: x.meta.reps }), sistema, lado)}</Text>
      </View>
      {parte !== null && <View style={st.metaPista}><View style={[st.metaLleno, { width: `${parte * 100}%`, backgroundColor: a.claro }]} /></View>}
      {x.nivel !== null && (
        <Text style={st.metaNivel}>{enLaUnidad(t('ascent.metas.nivelKg', { kg: numero(nivelEn(deLado(x.meta.reps === 1 ? x.nivel : x.nivel / (1 + x.meta.reps / 30)), sistema), 1) }), sistema, lado)}</Text>
      )}
      {/* Lo que falta para estimarla se lee fuerte: es lo que hay que saber hasta que haya una fecha. */}
      {x.falta && !x.alcanzada
        ? <Text style={st.metaFalta}>{textoDeLaFalta(x.falta)}</Text>
        : <Text style={st.metaLinea}>{linea}</Text>}
      {!x.alcanzada && p.estado !== 'lograda' && (
        <>
          {queHacer && <Text style={st.metaHacer}>{queHacer}</Text>}
          {todo.alejan.map((y) => (
            <Text key={y.que} style={[st.metaHacer, { color: C.lejos }]}>
              {y.que === 'sueno' ? t('ascent.metas.alejaSueno', { h: horasDe(y.minutos) }) : t('ascent.metas.alejaProteina', { g: numero(y.gPorKg, 1) })}
            </Text>
          ))}
        </>
      )}
      {/* Recién puesta, todavía no tiene su id: se puede cambiar cuando el servidor la guardó. */}
      <Enlace texto={t('ascent.metas.editar')} alTocar={x.meta.pendiente ? () => {} : alEditar} estilo={x.meta.pendiente && st.apretado} />
    </View>
  );
}

// ------------------------------------------------------------ tu año
type CeldaDelAnio = { fecha: ClaveDia; clase: 'nada' | 'futuro' | 'hoy' | 'descanso' | keyof typeof GRUPOS_DEL_ANIO; marca: boolean };

/** Un día por cuadro, los meses en filas, con el color de lo que entrenaste y un punto en cada marca. */
export function MapaDelAnio({ hoy, dias, elegido, alElegir, vacio }: { hoy: ClaveDia; dias: Todo['anio']['dias']; elegido?: ClaveDia | null; alElegir?: (f: ClaveDia) => void; vacio?: boolean }) {
  const [ancho, setAncho] = useState(0);
  const anio = Number(hoy.slice(0, 4));
  const porFecha = useMemo(() => new Map(dias.map((x) => [x.fecha, x])), [dias]);
  const filas = useMemo(() => Array.from({ length: 12 }, (_, mes) => {
    const enElMes = new Date(anio, mes + 1, 0).getDate();
    return Array.from({ length: 31 }, (_, i): CeldaDelAnio => {
      const n = i + 1;
      const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      const x = porFecha.get(fecha);
      const clase = n > enElMes ? 'nada' : fecha > hoy ? 'futuro' : fecha === hoy ? 'hoy' : x?.grupo ?? 'descanso';
      return { fecha, clase, marca: !!x?.marca && clase !== 'nada' };
    });
  }), [anio, hoy, porFecha]);
  const MES = 24;
  const lado = ancho ? (ancho - MES - 30 * 1.5) / 31 : 0;
  const tocar = (x: number, y: number) => {
    if (!alElegir || !lado) return;
    const col = Math.floor((x - MES) / (lado + 1.5));
    const fila = Math.floor(y / (lado + 2));
    const c = filas[fila]?.[col];
    if (c && c.clase !== 'nada' && c.clase !== 'futuro') alElegir(c.fecha);
  };
  const meses = lista('fecha.mesesCortos');
  const total = dias.filter((x) => x.grupo).length;
  const marcas = dias.filter((x) => x.marca).length;
  return (
    <Pressable
      onLayout={(ev) => setAncho(ev.nativeEvent.layout.width)}
      onPress={(ev) => tocar(ev.nativeEvent.locationX, ev.nativeEvent.locationY)}
      disabled={!alElegir}
      style={st.mapa}
      accessibilityRole="image"
      accessibilityLabel={t('ascent.anio.mapa', { n: total, m: marcas })}
    >
      {lado > 0 && filas.map((fila, mes) => (
        <View key={mes} style={[st.mapaFila, { height: lado }]}>
          <Text style={[st.mapaMes, { width: MES }]}>{meses[mes]}</Text>
          {fila.map((c) => (
            <View
              key={c.fecha}
              style={[
                st.mapaDia, { width: lado, height: lado },
                vacio ? st.mapaVacio : c.clase === 'nada' ? st.mapaNada : c.clase === 'futuro' ? st.mapaFuturo : c.clase in GRUPOS_DEL_ANIO ? { backgroundColor: GRUPOS_DEL_ANIO[c.clase as keyof typeof GRUPOS_DEL_ANIO] } : null,
                !vacio && (c.clase === 'hoy' || c.fecha === elegido) && st.mapaHoy,
              ]}
            >
              {!vacio && c.marca && <View style={st.mapaMarca} />}
            </View>
          ))}
        </View>
      ))}
    </Pressable>
  );
}

function TuAnio({ h, todo }: { h: Hoy; todo: Todo }) {
  const [elegido, setElegido] = useState<ClaveDia | null>(null);
  const sistema = sistemaDe(useEstado());
  const a = todo.anio;
  const detalle = (fecha: ClaveDia) => {
    const x = a.dias.find((y) => y.fecha === fecha);
    const [, m, dd] = fecha.split('-').map(Number);
    const cuando = t('fecha.corta', { num: dd, mes: lista('fecha.mesesCortos')[m - 1] });
    if (fecha === h.hoy) return t('ascent.anio.detalle.hoy', { cuando });
    if (!x?.grupo) return t('ascent.anio.detalle.descanso', { cuando });
    return t(x.marca ? 'ascent.anio.detalle.marca' : 'ascent.anio.detalle.entreno', { cuando, grupo: enFrase(tx(`ascent.hoy.grupos.${x.grupo}`)) });
  };
  const datos: [string, string][] = [
    ['entrenamientos', numero(a.datos.entrenamientos)],
    ['marcas', numero(a.datos.marcas)],
    ['habitos', numero(a.datos.diasConHabitos)],
    ['sueno', a.datos.sueno === null ? '—' : t('ascent.anio.horas', { h: Math.floor(a.datos.sueno / 60), m: String(Math.round(a.datos.sueno % 60)).padStart(2, '0') })],
    ['comida', numero(a.datos.diasConComida)],
  ];
  return (
    <Parte titulo={t('ascent.anio.titulo')} derecha={t('ascent.anio.hastaHoy', { anio: h.hoy.slice(0, 4) })}>
      <Una>{t('ascent.anio.texto2')}</Una>
      <MapaDelAnio hoy={h.hoy} dias={a.dias} elegido={elegido} alElegir={(f) => { Haptics.selectionAsync().catch(() => {}); setElegido(f); }} />
      <LeyendaDelAnio />
      <View style={st.anioDetalle} accessibilityLiveRegion="polite">{elegido && <Cambia texto={detalle(elegido)} style={st.anioDetalleTexto} />}</View>
      {a.ultimas.length > 0 && (
        <>
          <Etiqueta style={st.anioUltimasEtq}>{t('ascent.anio.ultimas')}</Etiqueta>
          <View style={st.anioUltimas}>
            {a.ultimas.map((m) => {
              const semanas = Math.floor(diasEntre(m.fecha, h.hoy) / 7);
              return (
                <View key={m.id ?? m.ejercicio} style={st.anioUltima}>
                  <View style={[st.leyendaCuadro, { backgroundColor: m.grupo ? GRUPOS_DEL_ANIO[m.grupo] : C.lejos }]} />
                  <Text style={[st.anioUltimaTexto, m.destacada && st.anioUltimaDestacada]}>{`${m.de ? `${tx(`ascent.hoy.grupos.${m.de}`)}: ${enFrase(nombreDelEjercicio({ id: m.id, ejercicio: m.ejercicio }))}` : conMayuscula(nombreDelEjercicio({ id: m.id, ejercicio: m.ejercicio }))} ${enLaUnidad(t('ascent.estancamiento.marca', { kg: cifra(pesoEn(m.kilos, sistema)), reps: m.reps }), sistema)}`}</Text>
                  <Text style={st.anioUltimaCuando}>{semanas ? plural('ascent.anio.hace', semanas) : t('ascent.anio.estaSemana')}</Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      <View style={st.grilla}>
        {datos.map(([k, v]) => (
          <View key={k} style={st.dato}>
            <Text style={st.datoValor}>{v}</Text>
            <Text style={st.datoNombre}>{tx(`ascent.anio.datos.${k}`)}</Text>
          </View>
        ))}
      </View>
    </Parte>
  );
}

function LeyendaDelAnio() {
  const items: [string, string, object][] = [
    ...(['pecho', 'espalda', 'piernas', 'brazos'] as const).map((g): [string, string, object] => [g, tx(`ascent.hoy.grupos.${g}`), { backgroundColor: GRUPOS_DEL_ANIO[g] }]),
    ['descanso', t('ascent.anio.descanso'), { backgroundColor: 'rgba(170, 178, 196, 0.1)' }],
    ['marca', t('ascent.anio.marca'), { backgroundColor: 'rgba(170, 178, 196, 0.25)' }],
  ];
  return (
    <View style={st.anioLeyenda}>
      {items.map(([k, texto, color]) => (
        <View key={k} style={st.leyendaItem}>
          <View style={[st.leyendaCuadro, color]}>{k === 'marca' && <View style={st.mapaMarca} />}</View>
          <Text style={st.leyendaTexto}>{texto}</Text>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  esperando: { minHeight: 600 },
  crece: { flex: 1, minWidth: 0 },
  sinBorde: { borderTopWidth: 0 },
  apretado: { opacity: 0.6 },
  vacio: { marginTop: 18, fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: C.sub },
  ninguno: { marginTop: 10, fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: C.sub },
  // En qué se basa
  base: { marginTop: 16 },
  baseCab: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 },
  baseTitulo: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  baseCuerpo: { paddingTop: 8 },
  baseParrafo: { marginBottom: 10, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 18, color: C.sub },
  baseNegrita: { fontFamily: letras.textoMedio, color: C.tinta },
  // Para hoy
  paraHoy: { marginTop: 26, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.lineaSuave, gap: 14 },
  sugerencia: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  sugerenciaPunto: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6 },
  sugerenciaTipo: { fontFamily: letras.textoMedio, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: C.sub },
  sugerenciaTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 15, lineHeight: 21, color: C.tinta },
  sugerenciaEnlace: { marginTop: 6 },
  // Tus músculos
  tus: { marginTop: 2 },
  paraQue: { marginTop: 6, fontFamily: letras.texto, fontSize: 15, lineHeight: 20.5, color: C.tinta },
  semanaEtq: { marginTop: 20 },
  semanaTexto: { marginTop: 6, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.sub },
  lados: { flexDirection: 'row', gap: 6, marginTop: 14 },
  ladoBoton: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  ladoElegido: { backgroundColor: C.tinta, borderColor: C.tinta },
  ladoTexto: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  ladoTextoElegido: { color: C.fondo },
  cuerpoYLista: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginTop: 14 },
  listaDelLado: { flex: 1, minWidth: 0, gap: 2 },
  leyenda: { marginTop: 16, gap: 8 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaFila: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  leyendaCuadro: { width: 10, height: 10, borderRadius: 2, marginTop: 4 },
  leyendaFatigado: { borderWidth: 1.2, borderStyle: 'dashed', borderColor: C.lejos },
  leyendaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.sub },
  leyendaEstado: { fontFamily: letras.textoMedio, color: C.tinta },
  debajo: { marginTop: 18 },
  fila: { paddingVertical: 6, paddingHorizontal: 6, marginHorizontal: -6, borderRadius: 8, gap: 5 },
  filaElegida: { backgroundColor: 'rgba(170, 178, 196, 0.1)' },
  filaCab: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, color: C.tinta },
  filaEstado: { fontFamily: letras.texto, fontSize: 11, color: C.sub },
  filaFatiga: { width: 8, height: 8, borderRadius: 2, borderWidth: 1.2, borderStyle: 'dashed', borderColor: C.lejos },
  filaNumero: { minWidth: 20, textAlign: 'right', fontFamily: letras.numero, fontSize: 13, color: C.sub, fontVariant: ['tabular-nums'] },
  pista: { backgroundColor: 'rgba(170, 178, 196, 0.1)', overflow: 'hidden' },
  zona: { position: 'absolute', top: 0, bottom: 0, backgroundColor: 'rgba(170, 178, 196, 0.14)' },
  bordes: { position: 'absolute', top: 0, bottom: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(232, 236, 246, 0.55)' },
  lleno: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  toca: { marginTop: 4, fontFamily: letras.texto, fontSize: 12, lineHeight: 16, color: C.apagado },
  detCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 },
  detNombre: { fontFamily: letras.texto, fontSize: 20, lineHeight: 24, color: C.tinta },
  cerrar: { fontFamily: letras.texto, fontSize: 13, color: C.sub, textDecorationLine: 'underline' },
  detSeries: { marginBottom: 8, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: C.tinta },
  detAccion: { marginTop: 10, fontFamily: letras.texto, fontSize: 14.5, lineHeight: 20, color: C.tinta },
  detFatiga: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  detFatigaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: C.lejos },
  estimado: { color: C.apagado },
  partes: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  parteFila: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  parteMarca: { width: 10, height: 10, borderRadius: 2 },
  // Las partes no tienen su propio rango: la destacada va llena y el resto, tenue, para distinguirlas.
  parteMarcaResto: { opacity: 0.4 },
  parteNombre: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18, color: C.tinta },
  parteNota: { marginTop: 8, fontFamily: letras.texto, fontSize: 12, lineHeight: 16.5, color: C.apagado },
  ejsEtq: { marginTop: 20 },
  ej: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.lineaSuave },
  ejCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  ejNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 15, lineHeight: 19, color: C.tinta },
  ejSeries: { fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  ejDatos: { marginTop: 4, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.sub },
  ejProxima: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 5 },
  ejFlecha: { width: 12, fontFamily: letras.textoMedio, fontSize: 14, lineHeight: 19 },
  ejProximaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: C.tinta },
  rutinaNota: { fontFamily: letras.texto, fontSize: 15 },
  mejora: { marginTop: 8, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 18.5, color: C.tinta },
  anotas: { marginTop: 18 },
  // Fatigados
  fatigados: { marginTop: 10 },
  fatigado: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  fatigadoNombre: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  fatigadoCuando: { minWidth: 104, textAlign: 'right', fontFamily: letras.texto, fontSize: 12.5, color: C.tinta },
  // Estancados y por qué
  estancEj: { paddingTop: 14, paddingBottom: 8, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  estancNombre: { fontFamily: letras.texto, fontSize: 15.5, lineHeight: 19, color: C.tinta },
  estancDato: { marginTop: 4, fontFamily: letras.texto, fontSize: 12.5, color: C.sub, fontVariant: ['tabular-nums'] },
  razones: { marginTop: 12, gap: 14 },
  razon: { gap: 6 },
  razonCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  razonTitulo: { flexShrink: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  razonValor: { fontFamily: letras.numero, fontSize: 12, color: C.sub, fontVariant: ['tabular-nums'] },
  razonTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.sub },
  semanas: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 38 },
  barra: { flex: 1, minWidth: 3 },
  barraAntes: { backgroundColor: C.claro, opacity: 0.7 },
  barraAhora: { borderWidth: 1.2, borderColor: C.principal },
  semanasDivisor: { width: 1, alignSelf: 'stretch', marginHorizontal: 4, backgroundColor: C.lineaFuerte },
  leyendaRazon: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginTop: 4 },
  contexto: { marginTop: 12, marginBottom: 2, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: C.apagado },
  // Metas
  meta: { paddingTop: 14, paddingBottom: 6, borderTopWidth: 1, borderTopColor: C.lineaSuave },
  // Si el nombre y el objetivo no entran en una línea («35 kg por mancuerna 8 veces»), el objetivo baja.
  metaCab: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', columnGap: 10, rowGap: 3 },
  metaNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 15.5, lineHeight: 19, color: C.tinta },
  metaObjetivo: { fontFamily: letras.numero, fontSize: 13, color: C.sub, fontVariant: ['tabular-nums'] },
  metaPista: { height: 6, borderRadius: 3, marginTop: 10, backgroundColor: 'rgba(170, 178, 196, 0.12)', overflow: 'hidden' },
  metaLleno: { height: 6, borderRadius: 3 },
  metaNivel: { marginTop: 5, fontFamily: letras.texto, fontSize: 11.5, color: C.apagado },
  metaLinea: { marginTop: 8, fontFamily: letras.texto, fontSize: 14, lineHeight: 19, color: C.tinta },
  metaFalta: { marginTop: 8, fontFamily: letras.textoMedio, fontSize: 15, lineHeight: 20.5, color: C.tinta },
  metaHacer: { marginTop: 5, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.sub },
  // Tu año
  mapa: { marginTop: 14, gap: 2 },
  mapaFila: { flexDirection: 'row', alignItems: 'center', gap: 1.5 },
  mapaMes: { fontFamily: letras.texto, fontSize: 9.5, color: C.apagado, textTransform: 'capitalize' },
  mapaDia: { borderRadius: 1.5, backgroundColor: 'rgba(170, 178, 196, 0.1)', alignItems: 'center', justifyContent: 'center' },
  mapaVacio: { backgroundColor: 'rgba(170, 178, 196, 0.07)' },
  mapaNada: { opacity: 0 },
  mapaFuturo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(170, 178, 196, 0.08)' },
  mapaHoy: { borderWidth: 1.5, borderColor: C.tinta },
  mapaMarca: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#fbf8ef' },
  anioLeyenda: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 14, rowGap: 6, marginTop: 12 },
  anioDetalle: { minHeight: 17, marginTop: 10 },
  anioDetalleTexto: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: C.tinta },
  anioUltimasEtq: { marginTop: 18 },
  anioUltimas: { marginTop: 14, gap: 9 },
  anioUltima: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  anioUltimaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 17.5, color: C.tinta },
  // Las del DOTS (pecho, piernas y espalda), un poco más fuertes.
  anioUltimaDestacada: { fontFamily: letras.textoMedio },
  anioUltimaCuando: { fontFamily: letras.texto, fontSize: 12, color: C.sub },
  grilla: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, marginTop: 18 },
  dato: { width: '33.3%', gap: 4, paddingRight: 10 },
  datoValor: { fontFamily: letras.numeroLiviano, fontSize: 21, letterSpacing: -0.2, color: C.tinta, fontVariant: ['tabular-nums'] },
  datoNombre: { fontFamily: letras.texto, fontSize: 11, lineHeight: 14, color: C.sub },
});
