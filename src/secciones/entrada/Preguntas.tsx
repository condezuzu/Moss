// Las preguntas del cuestionario nuevo, las de la galería (galeria/src/entrada.js): Salud, tus datos, los
// cuidados, la grasa, cuánto te mueves, el entreno y cuándo, lo que quieres lograr, la experiencia, el peso meta
// con su ritmo o su fecha, lo que sigue, cómo quieres comer, tu día y el resultado. Las usan la entrada
// (Entrada.tsx, con la estrella guía en la barra) y «Tus respuestas» (TusRespuestas.tsx, desde Perfil). Cada
// pregunta tiene arriba lo suyo (con lo que no entra, se desliza) y abajo su botón. Lo que sale de lo contestado
// está en respuestas.ts.

import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { CM_POR_PULGADA, KG_POR_LIBRA } from '@/dominio/cantidades';
import { CON_HORA } from '@/dominio/comidas';
import {
  avisoDeRecomposicion, diasConDosSesiones, DEPORTES, FIGURAS, kcalDelEntreno, MOVIMIENTOS, NIVELES_DE_PROTEINA, partesRedondas, preguntasDelEntreno,
  proteinaDelNivel, rangoDelPesoMeta, ritmoSugerido, VIAJES, type Deporte, type Despues, type Movimiento, type ObjetivoDicho,
} from '@/dominio/cuestionario';
import { RANGOS as RANGOS_DEL_CUERPO, rangoDeGrasa } from '@/dominio/cuerpo';
import { gruposPara, PREGUNTA, sinDeficitDe, type Cuidado } from '@/dominio/cuidados';
import { diasEntre, partesDe, SEMANA, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { EDAD_MINIMA, ESTILOS, macrosConProteina, MAYORIA_DE_EDAD, RANGOS_DEL_CUESTIONARIO, type Sexo } from '@/dominio/metas';
import { DIETAS } from '@/dominio/plan';
import { SEMANAS_DE_MANTENIMIENTO } from '@/dominio/progreso';
import type { Noche } from '@/dominio/sueno';
import { idioma, lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { useCuenta } from '../animados';
import { anunciar } from '../anuncio';
import { COLOR_DE_MACRO, Icono, MACROS } from '../comida/comunes';
import { horaDelDia, numero, sistemaDe, useEstado } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { BotonDePaso, margenDeToque } from '../paso';
import { Anillos, Figura } from './Lienzos';
import { ACOMODA, Boton, Deslizador, Dias, Elegible, entra, Etiqueta, Interruptor, Pasito, Plegable, TextoQueCambia } from './piezas';
import {
  cambiaPeso, conObjetivo, conPesoMeta, deporteDelPartido, entrenoDicho, levantaPesas, medidasDeCinta, metaDeAhora, objetivoPosible, objetivosQueNo, pctDe,
  plazoDeRitmo, plazoElegido, reglasDeAhora, respuestasPara, sexoDe, suenoDeSalud, type Contestado, type Pregunta,
} from './respuestas';

/** Lo que vino de Salud (y no se cambió a mano). */
export type DeSalud = ReadonlySet<'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>;
/** Lo más que crece el texto grande en las cifras grandes: con más, «174,5 kg» y sus ± no entraban. */
export const TOPE = 1.2;
/** El lado de «Atrás» y de «Cerrar»: el toque llega a 44 con el margen. */
const LADO_ATRAS = 32;

const SOMBRA = { textShadowColor: 'rgba(3, 5, 12, 0.95)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } };

// ------------------------------------------------------------------ las piezas de cada pantalla
export const Titulo = ({ children, centrado, tope, denso }: { children: ReactNode; centrado?: boolean; tope?: boolean; denso?: boolean }) => (
  <Text style={[s.titulo, denso && s.tituloDenso, centrado && s.centrado]} accessibilityRole="header" maxFontSizeMultiplier={tope ? TOPE : undefined}>{children}</Text>
);
export const Texto = ({ children, centrado, tope, denso }: { children: ReactNode; centrado?: boolean; tope?: boolean; denso?: boolean }) => (
  <Text style={[s.texto, denso && s.textoDenso, centrado && s.centrado]} maxFontSizeMultiplier={tope ? TOPE : undefined}>{children}</Text>
);
export const Chico = ({ children, izquierda }: { children: ReactNode; izquierda?: boolean }) => (
  <Animated.Text layout={ACOMODA} style={[s.chico, izquierda && s.izquierda]}>{children}</Animated.Text>
);
export const Pie = ({ children }: { children: ReactNode }) => <View style={s.pie}>{children}</View>;
export const Espacio = () => <View style={{ flex: 1, minHeight: 24 }} />;
/** Lo de cada pregunta, arriba del botón: si no entra, se desliza y el botón queda abajo. */
export function Desliza({ children }: { children: ReactNode }) {
  return (
    <ScrollView style={s.desliza} contentContainerStyle={s.deslizaAdentro} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

/**
 * Arriba de cada pregunta: la constelación de las preguntas (lo contestado encendido y la de ahora, prendiéndose),
 * «n de N» y, desde la segunda, la flecha de «Atrás». La barra la lleva la estrella guía (Guia.tsx); desde Perfil, sin
 * estrella, va dibujada (`barra`), con «Cerrar» a la derecha.
 */
export function Cabeza({ i, total, alAtras, alCerrar, barra }: { i: number; total: number; alAtras?: () => void; alCerrar?: () => void; barra?: boolean }) {
  return (
    <View>
      {barra ? <BarraDibujada k={(i + 1) / total} /> : <View style={s.avance} />}
      <View style={s.avanceFila}>
        {alAtras && (
          <Animated.View entering={entra(false, 0)}>
            <Pressable onPress={alAtras} style={({ pressed }) => [s.atras, pressed && s.atrasApretado]} hitSlop={margenDeToque(LADO_ATRAS)} accessibilityRole="button" accessibilityLabel={t('comun.atras')}>
              <Icono nombre="chevron.left" tam={15} color="rgba(239, 230, 207, 0.78)" peso="medium" />
            </Pressable>
          </Animated.View>
        )}
        <ConstelacionDePasos actual={i} total={total} />
        <Text style={s.paso}>{t('entrada.cuestionario.paso', { n: i + 1, total })}</Text>
        {alCerrar && (
          <Pressable onPress={alCerrar} style={s.cerrar} hitSlop={8} accessibilityRole="button">
            <Text style={s.cerrarTexto}>{t('entrada.cuestionario.revisar.cerrar')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function BarraDibujada({ k }: { k: number }) {
  const lleno = useSharedValue(k);
  useEffect(() => {
    lleno.set(withTiming(k, { duration: 600 }));
  }, [lleno, k]);
  const estilo = useAnimatedStyle(() => ({ width: `${lleno.get() * 100}%` }));
  return (
    <View style={s.barra}>
      <Animated.View style={[s.barraLlena, estilo]} />
    </View>
  );
}

/** Una estrella por pregunta, en zigzag, como una constelación chica. */
function ConstelacionDePasos({ actual, total }: { actual: number; total: number }) {
  const W = 150, H = 30;
  const pts = Array.from({ length: total }, (_, k) => [6 + (k * (W - 12)) / Math.max(1, total - 1), H - 8 - (k % 2 ? 9 : 0) - k * 1.2] as const);
  return (
    <View style={{ width: W * 0.62, height: H * 0.62 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: W, height: H, transform: [{ scale: 0.62 }], transformOrigin: 'left top' }}>
        {pts.slice(1).map(([x, y], k) => {
          const [x0, y0] = pts[k];
          const largo = Math.hypot(x - x0, y - y0);
          const hecha = k + 1 <= actual;
          return <View key={k} style={[s.linea, hecha && s.lineaHecha, { left: (x + x0) / 2 - largo / 2, top: (y + y0) / 2, width: largo, transform: [{ rotate: `${Math.atan2(y - y0, x - x0)}rad` }] }]} />;
        })}
        {pts.map(([x, y], k) => {
          const r = k === actual ? 3.4 : 2.6;
          return <View key={k} style={[s.estrella, k < actual && s.estrellaHecha, k === actual && s.estrellaAhora, { left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: r }]} />;
        })}
      </View>
    </View>
  );
}

/** Lo que vino de Salud. Si se cambia a mano, el chip se apaga pero deja su lugar: al irse, lo de abajo subía de golpe. */
export function ChipDeSalud({ encendido, izquierda }: { encendido: boolean; izquierda?: boolean }) {
  const [estuvo] = useState(encendido);
  const luz = useAnimatedStyle(() => ({ opacity: withTiming(encendido ? 1 : 0, { duration: 240, reduceMotion: ReduceMotion.Never }) }), [encendido]);
  if (!estuvo) return null;
  return (
    <Animated.View style={[s.chipFila, izquierda && { justifyContent: 'flex-start' }, luz]} accessibilityElementsHidden={!encendido} importantForAccessibility={encendido ? 'auto' : 'no-hide-descendants'}>
      <Text style={s.deSalud}>{t('entrada.cuestionario.deSalud')}</Text>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ formatos
const kg = (x: number) => numero(x, Math.round(x * 10) % 10 ? 1 : 0);
const hasta2 = (x: number) => numero(x, 2);
/** Una fecha del plan: corta y, a más de diez meses, con el año (si no, parecería de este). */
function fechaDelCamino(clave: ClaveDia, hoy: ClaveDia) {
  const p = partesDe(clave);
  return `${t('fecha.corta', { num: p.dia, mes: lista('fecha.mesesCortos')[p.mes] })}${diasEntre(hoy, clave) > 300 ? ` ${p.anio}` : ''}`;
}
/** «Lun, Mié y Vie»: los días cortos, de lunes a domingo. */
function listaDeDias(dias: readonly DiaSemana[]) {
  const nombres = SEMANA.filter((d) => dias.includes(d)).map((d) => lista('fecha.diasCortos')[d]);
  return nombres.length < 2 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')}${idioma() === 'es' ? ' y ' : ' and '}${nombres[nombres.length - 1]}`;
}

// ------------------------------------------------------------------ las preguntas
export type PropsDePregunta = {
  id: Pregunta;
  r: Contestado;
  /** Cambia lo contestado; lo de Salud que se cambia a mano deja de ser de Salud. */
  poner: (cambio: (r: Contestado) => Contestado, deSalud?: 'edad' | 'sexo' | 'alturaCm' | 'pesoKg') => void;
  deSalud: DeSalud;
  hoy: ClaveDia;
  noches: readonly Noche[];
  alSeguir: () => void;
};

/** La pantalla de una pregunta (sin Salud ni el resultado, que tienen lo suyo). */
export function PantallaDePregunta(p: PropsDePregunta) {
  switch (p.id) {
    case 'tu': return p.r.edad < EDAD_MINIMA ? <Menor /> : <Tu {...p} />;
    case 'sexo': return <ElSexo {...p} />;
    case 'edad': return p.r.edad < EDAD_MINIMA && p.deSalud.has('edad') ? <Menor /> : <Edad {...p} />;
    case 'altura': return <Altura {...p} />;
    case 'peso': return <Peso {...p} />;
    case 'cuidado': return <ElCuidado {...p} />;
    case 'grasa': return <LaGrasa {...p} />;
    case 'movimiento': return <ElMovimiento {...p} />;
    case 'entreno': return <ElEntreno {...p} />;
    case 'cuando': return <Cuando {...p} />;
    case 'objetivo': return <ElObjetivo {...p} />;
    case 'experiencia': return <LaExperiencia {...p} />;
    case 'meta': return <LaMeta {...p} />;
    case 'despues': return <LoQueSigue {...p} />;
    case 'comer': return <Comer {...p} />;
    case 'dia': return <TuDia {...p} />;
    default: return null;
  }
}

const Seguir = ({ alSeguir, texto, desactivado }: { alSeguir: () => void; texto?: string; desactivado?: boolean }) => (
  <Pie>
    <Boton texto={texto ?? t('entrada.seguir')} alTocar={alSeguir} desactivado={desactivado} />
  </Pie>
);

/** Menos de 16, según Salud: Moss no sigue (lo pediste el 22/10/2026). */
export function Menor() {
  return (
    <View style={s.menor}>
      <Titulo centrado>{t('entrada.menor.titulo')}</Titulo>
      <Texto centrado>{t('entrada.menor.texto')}</Texto>
    </View>
  );
}

type PropsDeNumero = {
  titulo: string; texto?: string; valor: number; min: number; max: number; paso: number; decimales: number; unidad: string; deSalud: boolean;
  alCambiar: (v: number) => void; alSeguir: () => void; mostrar?: (v: number) => string;
};

/** Las preguntas de un número: el número grande, el deslizador y un paso fino a cada lado (mantenido, repite). */
function Numero({ titulo, texto, valor, min, max, paso, decimales, unidad, deSalud, alCambiar, alSeguir, mostrar }: PropsDeNumero) {
  const textoDe = (v: number) => (mostrar ? mostrar(v) : `${numero(v, decimales)} ${unidad}`);
  const fino = (signo: 1 | -1) => {
    const nuevo = Math.min(max, Math.max(min, Math.round((valor + signo * paso) * 100) / 100));
    if (nuevo === valor) return false;
    alCambiar(nuevo);
    anunciar(textoDe(nuevo));
  };
  return (
    <>
      <Desliza>
        <Titulo>{titulo}</Titulo>
        {texto ? <Texto>{texto}</Texto> : null}
        <View style={s.numero}>
          <BotonDePaso alPaso={() => fino(-1)} etiqueta={`− ${numero(paso, decimales)}`} lado={40} style={s.fino}>
            <Icono nombre="minus" tam={16} peso="semibold" />
          </BotonDePaso>
          <View style={s.numeroCentro}>
            <Text style={s.numeroValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={TOPE}>{mostrar ? mostrar(valor) : numero(valor, decimales)}</Text>
            {!mostrar && <Text style={s.numeroUnidad} maxFontSizeMultiplier={TOPE}>{unidad}</Text>}
          </View>
          <BotonDePaso alPaso={() => fino(1)} etiqueta={`+ ${numero(paso, decimales)}`} lado={40} style={s.fino}>
            <Icono nombre="plus" tam={16} peso="semibold" />
          </BotonDePaso>
        </View>
        <ChipDeSalud encendido={deSalud} />
        <Deslizador valor={valor} min={min} max={max} paso={paso} alCambiar={alCambiar} etiqueta={titulo} textoDe={textoDe} pasoDeAccesibilidad={1} />
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

function Edad({ r, poner, deSalud, alSeguir }: PropsDePregunta) {
  const [min, max] = RANGOS_DEL_CUESTIONARIO.edad;
  return (
    <Numero
      titulo={t('entrada.cuestionario.edadTitulo')} valor={Math.max(r.edad, min)} min={min} max={max} paso={1} decimales={0} unidad={t('entrada.cuestionario.anos')}
      deSalud={deSalud.has('edad')} alCambiar={(v) => poner((x) => ({ ...x, edad: v }), 'edad')}
      alSeguir={() => {
        poner((x) => ({ ...x, edad: Math.max(x.edad, min) }));
        alSeguir();
      }}
    />
  );
}

function Altura({ r, poner, deSalud, alSeguir }: PropsDePregunta) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  const cambiar = (cm: number) => poner((x) => ({ ...x, alturaCm: cm }), 'alturaCm');
  const [min, max] = RANGOS_DEL_CUESTIONARIO.alturaCm;
  if (!imperial) return <Numero titulo={t('entrada.cuestionario.alturaTitulo')} valor={r.alturaCm} min={min} max={max} paso={1} decimales={0} unidad="cm" deSalud={deSalud.has('alturaCm')} alCambiar={cambiar} alSeguir={alSeguir} />;
  // En pulgadas, y se muestra en pies y pulgadas: 5′ 9″.
  return (
    <Numero
      titulo={t('entrada.cuestionario.alturaTitulo')} valor={Math.round(r.alturaCm / CM_POR_PULGADA)} min={Math.ceil(min / CM_POR_PULGADA)} max={Math.floor(max / CM_POR_PULGADA)}
      paso={1} decimales={0} unidad="in" deSalud={deSalud.has('alturaCm')} alCambiar={(p) => cambiar(Math.round(p * CM_POR_PULGADA))} alSeguir={alSeguir}
      mostrar={(p) => `${Math.floor(p / 12)}′ ${p % 12}″`}
    />
  );
}

function Peso({ r, poner, deSalud, alSeguir }: PropsDePregunta) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  const cambiar = (v: number) => poner((x) => ({ ...x, pesoKg: v }), 'pesoKg');
  const [min, max] = RANGOS_DEL_CUESTIONARIO.pesoKg;
  const comun = { titulo: t('entrada.cuestionario.pesoTitulo'), texto: t('entrada.cuestionario.pesoTexto'), deSalud: deSalud.has('pesoKg'), alSeguir, decimales: 1 };
  if (!imperial) return <Numero {...comun} valor={r.pesoKg} min={min} max={max} paso={0.1} unidad="kg" alCambiar={(v) => cambiar(Math.round(v * 10) / 10)} />;
  return <Numero {...comun} valor={Math.round((r.pesoKg / KG_POR_LIBRA) * 10) / 10} min={Math.ceil(min / KG_POR_LIBRA)} max={Math.floor(max / KG_POR_LIBRA)} paso={0.2} unidad="lb" alCambiar={(lb) => cambiar(Math.round(lb * KG_POR_LIBRA * 100) / 100)} />;
}

function ElSexo({ r, poner, deSalud, alSeguir }: PropsDePregunta) {
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.sexoTitulo')}</Titulo>
        <Texto>{t('entrada.cuestionario.sexoTexto')}</Texto>
        <View style={[s.opciones, s.fila]} accessibilityRole="radiogroup">
          {(['f', 'm'] as const).map((x, k) => (
            <Elegible key={x} forma="segmento" alto titulo={t(`entrada.cuestionario.${x === 'f' ? 'femenino' : 'masculino'}`)} elegida={r.sexo === x} alTocar={() => poner((y) => ({ ...y, sexo: x }), 'sexo')} demora={k * 80} />
          ))}
        </View>
        <ChipDeSalud encendido={deSalud.has('sexo')} izquierda />
      </Desliza>
      <Seguir alSeguir={alSeguir} desactivado={!r.sexo} />
    </>
  );
}

/** Con Salud: los cuatro datos juntos, para confirmar. Cada uno se abre para cambiarlo. */
function Tu({ r, poner, deSalud, alSeguir }: PropsDePregunta) {
  const reducido = useReducedMotion();
  const [abierta, setAbierta] = useState<string | null>(null);
  const filas: { clave: 'sexo' | 'edad' | 'alturaCm' | 'pesoKg'; nombre: string; valor: string; editor: ReactNode }[] = [
    {
      clave: 'sexo', nombre: t('entrada.cuestionario.sexo'), valor: r.sexo ? t(`entrada.cuestionario.${r.sexo === 'f' ? 'femenino' : 'masculino'}`) : '—',
      editor: (
        <View style={s.fila}>
          {(['f', 'm'] as const).map((x) => <Elegible key={x} forma="segmento" titulo={t(`entrada.cuestionario.${x === 'f' ? 'femenino' : 'masculino'}`)} elegida={r.sexo === x} alTocar={() => poner((y) => ({ ...y, sexo: x }), 'sexo')} />)}
        </View>
      ),
    },
    {
      clave: 'edad', nombre: t('entrada.cuestionario.edad'), valor: `${numero(r.edad)} ${t('entrada.cuestionario.anos')}`,
      editor: <Deslizador style={s.deslizadorChico} valor={r.edad} min={EDAD_MINIMA} max={RANGOS_DEL_CUESTIONARIO.edad[1]} paso={1} alCambiar={(v) => poner((y) => ({ ...y, edad: v }), 'edad')} etiqueta={t('entrada.cuestionario.edad')} textoDe={(v) => `${numero(v)} ${t('entrada.cuestionario.anos')}`} />,
    },
    {
      clave: 'alturaCm', nombre: t('entrada.cuestionario.altura'), valor: `${numero(r.alturaCm)} cm`,
      editor: <Deslizador style={s.deslizadorChico} valor={r.alturaCm} min={RANGOS_DEL_CUESTIONARIO.alturaCm[0]} max={RANGOS_DEL_CUESTIONARIO.alturaCm[1]} paso={1} alCambiar={(v) => poner((y) => ({ ...y, alturaCm: v }), 'alturaCm')} etiqueta={t('entrada.cuestionario.altura')} textoDe={(v) => `${numero(v)} cm`} />,
    },
    {
      clave: 'pesoKg', nombre: t('entrada.cuestionario.peso'), valor: `${numero(r.pesoKg, 1)} kg`,
      editor: <Deslizador style={s.deslizadorChico} valor={r.pesoKg} min={RANGOS_DEL_CUESTIONARIO.pesoKg[0]} max={RANGOS_DEL_CUESTIONARIO.pesoKg[1]} paso={0.1} pasoDeAccesibilidad={1} alCambiar={(v) => poner((y) => ({ ...y, pesoKg: Math.round(v * 10) / 10 }), 'pesoKg')} etiqueta={t('entrada.cuestionario.peso')} textoDe={(v) => `${numero(v, 1)} kg`} />,
    },
  ];
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.tuTitulo')}</Titulo>
        <Texto>{t('entrada.cuestionario.tuTexto')}</Texto>
        <Animated.View entering={entra(reducido, 300)} layout={ACOMODA} style={s.tarjeta}>
          {filas.map((f, k) => {
            const abierto = abierta === f.clave;
            return (
              <Animated.View key={f.clave} layout={ACOMODA} style={k > 0 && s.tarjetaBorde}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setAbierta(abierto ? null : f.clave);
                  }}
                  style={s.tarjetaFila}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: abierto }}
                >
                  <Text style={s.tarjetaNombre}>{f.nombre}</Text>
                  <Text style={s.tarjetaValor}>{f.valor}</Text>
                  <ChipEnFila encendido={deSalud.has(f.clave)} />
                  <Flecha abierta={abierto} />
                </Pressable>
                <Plegable abierto={abierto} style={s.editor}>{f.editor}</Plegable>
              </Animated.View>
            );
          })}
        </Animated.View>
      </Desliza>
      <Seguir alSeguir={alSeguir} texto={t('entrada.cuestionario.estaBien')} desactivado={!r.sexo} />
    </>
  );
}

function ChipEnFila({ encendido }: { encendido: boolean }) {
  const [estuvo] = useState(encendido);
  const luz = useAnimatedStyle(() => ({ opacity: withTiming(encendido ? 1 : 0, { duration: 300, reduceMotion: ReduceMotion.Never }) }), [encendido]);
  if (!estuvo) return null;
  return <Animated.Text style={[s.deSalud, luz]}>{t('entrada.cuestionario.deSalud')}</Animated.Text>;
}

function Flecha({ abierta }: { abierta: boolean }) {
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '180deg' : '0deg', { duration: 300 }) }] }), [abierta]);
  return (
    <Animated.View style={giro}>
      <Icono nombre="chevron.down" tam={13} color="rgba(239, 230, 207, 0.45)" />
    </Animated.View>
  );
}

// ------------------------------------------------------------------ los cuidados
/**
 * ¿Alguno es tu caso? (D44): se marcan varios, en grupos (el embarazo y la lactancia, solo a las mujeres); lo que se
 * pregunta además (la semana, el parto, la insulina, la diálisis) crece debajo de su grupo. Al marcar el primero, el
 * pie pide guardarlo en este iPhone en lugar de «Seguir»: es el consentimiento explícito. Lo marcado no sube a la cuenta.
 */
function ElCuidado({ r, poner, hoy, alSeguir }: PropsDePregunta) {
  const d = r.datosCuidado;
  const hay = r.cuidados.length > 0;
  const pendiente = hay && !r.consentido;
  const reglas = reglasDeAhora(r, hoy);
  const ponerDato = (cambio: Partial<Contestado['datosCuidado']>) => poner((x) => ({ ...x, datosCuidado: { ...x.datosCuidado, ...cambio } }));
  const marcar = (c: Cuidado) => poner((x) => ({ ...x, cuidados: x.cuidados.includes(c) ? x.cuidados.filter((y) => y !== c) : [...x.cuidados, c] }));
  let k = 0;
  const siNo = (si: boolean, alElegir: (si: boolean) => void) => (
    <View style={[s.fila, { width: 132 }]}>
      <Elegible forma="segmento" titulo={t('cuidados.preguntas.si')} elegida={si} alTocar={() => alElegir(true)} />
      <Elegible forma="segmento" titulo={t('cuidados.preguntas.no')} elegida={!si} alTocar={() => alElegir(false)} />
    </View>
  );
  const preguntas = (c: Cuidado) => {
    if (c === 'embarazo') {
      return (
        <View style={s.extra}>
          <View style={s.extraFila}>
            <Text style={s.extraTexto}>{t('cuidados.preguntas.semana')}</Text>
            <Pasito valor={d.semana} min={1} max={42} paso={1} ancho={92} nombre={t('cuidados.preguntas.semana')} formato={(n) => t('cuidados.preguntas.semanaN', { n })} alCambiar={(n) => ponerDato({ semana: n })} />
          </View>
          <Text style={s.extraTexto}>{t('cuidados.preguntas.pesoAntes')}</Text>
          <View style={[s.extraFila, { justifyContent: 'flex-end' }]}>
            <Interruptor texto={t('cuidados.preguntas.noSe')} prendido={d.pesoAntes === null} alTocar={() => ponerDato({ pesoAntes: d.pesoAntes === null ? r.pesoKg : null })} />
            <Pasito valor={d.pesoAntes ?? r.pesoKg} min={35} max={200} paso={0.5} ancho={92} apagado={d.pesoAntes === null} nombre={t('cuidados.preguntas.pesoAntes')} formato={(x) => `${kg(x)} kg`} alCambiar={(x) => ponerDato({ pesoAntes: x })} />
          </View>
          <View style={s.extraFila}>
            <Text style={s.extraTexto}>{t('cuidados.preguntas.mellizos')}</Text>
            {siNo(d.mellizos, (si) => ponerDato({ mellizos: si }))}
          </View>
        </View>
      );
    }
    if (c === 'lactancia') {
      return (
        <View style={s.extra}>
          <View style={s.extraFila}>
            <Text style={s.extraTexto}>{t('cuidados.preguntas.parto')}</Text>
            <Pasito valor={d.semanasParto} min={0} max={104} paso={1} ancho={92} nombre={t('cuidados.preguntas.parto')} formato={(n) => plural('cuidados.preguntas.partoN', n)} alCambiar={(n) => ponerDato({ semanasParto: n })} />
          </View>
          <View style={s.fila}>
            <Elegible forma="segmento" titulo={t('cuidados.preguntas.soloPecho')} elegida={d.soloPecho} alTocar={() => ponerDato({ soloPecho: true })} />
            <Elegible forma="segmento" titulo={t('cuidados.preguntas.conFormula')} elegida={!d.soloPecho} alTocar={() => ponerDato({ soloPecho: false })} />
          </View>
        </View>
      );
    }
    if (c === 'diabetes2') {
      const valor = d.bajaElAzucar === true ? 'si' : d.bajaElAzucar === false ? 'no' : 'noSe';
      return (
        <View style={s.extra}>
          <Text style={s.extraTexto}>{t('cuidados.preguntas.insulina')}</Text>
          <View style={s.fila}>
            {(['si', 'no', 'noSe'] as const).map((v) => (
              <Elegible key={v} forma="segmento" titulo={t(`cuidados.preguntas.${v === 'noSe' ? 'noLoSe' : v}`)} elegida={valor === v} alTocar={() => ponerDato({ bajaElAzucar: v === 'si' ? true : v === 'no' ? false : null })} />
            ))}
          </View>
        </View>
      );
    }
    return (
      <View style={s.extra}>
        <View style={s.extraFila}>
          <Text style={s.extraTexto}>{t('cuidados.preguntas.dialisis')}</Text>
          {siNo(d.dialisis, (si) => ponerDato({ dialisis: si }))}
        </View>
      </View>
    );
  };
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuidado.titulo')}</Titulo>
        <Texto denso>{t('entrada.cuidado.marcaTodo')}</Texto>
        {gruposPara(r.sexo === 'f' ? 'f' : 'm').map(({ grupo, cuidados }) => (
          <Animated.View key={grupo} layout={ACOMODA}>
            <Etiqueta arriba={16}>{t(`cuidados.grupos.${grupo}`)}</Etiqueta>
            <View style={s.chips}>
              {cuidados.map((c) => <Elegible key={c} forma="chip" marca titulo={t(`cuidados.nombres.${c}`)} elegida={r.cuidados.includes(c)} alTocar={() => marcar(c)} demora={(k++) * 35} />)}
            </View>
            {cuidados.filter((c) => PREGUNTA[c]).map((c) => <Plegable key={c} abierto={r.cuidados.includes(c)}>{preguntas(c)}</Plegable>)}
          </Animated.View>
        ))}
        <Animated.View layout={ACOMODA} style={[s.chips, { marginTop: 20 }]}>
          <Elegible forma="chip" marca titulo={t('entrada.cuidado.nada')} elegida={!hay} alTocar={() => poner((x) => ({ ...x, cuidados: [] }))} demora={k * 35} />
        </Animated.View>
        {/* Debajo, lo que hace falta saber: sin déficit, que Moss no propone comer menos; con diálisis, que no calcula; y ya guardado, que queda solo en este iPhone. */}
        <Plegable abierto={hay && sinDeficitDe(reglas) && !reglas.manuales}><Text style={s.nota}>{t('entrada.cuidado.aviso')}</Text></Plegable>
        <Plegable abierto={hay && reglas.manuales}><Text style={s.nota}>{t(r.cuidados.includes('renal') && d.dialisis ? 'cuidados.manuales.dialisis' : 'cuidados.manuales.menor')}</Text></Plegable>
        <Plegable abierto={hay && r.consentido}>
          <View style={[s.nota, s.notaPrivada]}>
            <Icono nombre="lock" tam={14} color={colores.salvia} />
            <Text style={[s.notaTexto, { color: colores.salvia }]}>{t('cuidados.soloEnElIphone')}</Text>
          </View>
        </Plegable>
      </Desliza>
      <View style={s.pie}>
        <Plegable abierto={pendiente} style={s.consentimiento}>
          <View style={s.consentimientoTexto}>
            <Icono nombre="lock" tam={15} color={colores.salvia} />
            <Text style={s.consentimientoLetra}>{t('cuidados.consentimiento.texto')}</Text>
          </View>
          <Boton
            texto={t('cuidados.consentimiento.guardar')}
            alTocar={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              poner((x) => ({ ...x, consentido: true }));
            }}
          />
          <Boton tipo="secundario" texto={t('cuidados.consentimiento.ahoraNo')} alTocar={() => poner((x) => ({ ...x, cuidados: [] }))} />
        </Plegable>
        <Plegable abierto={!pendiente}>
          <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
        </Plegable>
      </View>
    </>
  );
}

// ------------------------------------------------------------------ la grasa
/**
 * ¿Sabes tu grasa? No sé, lo sé, por imagen o con cinta; debajo, lo de cada uno. Nunca se muestra como una
 * medida exacta: lo dicho es una estimación, la figura un rango y la cinta también.
 */
function LaGrasa({ r, poner, alSeguir }: PropsDePregunta) {
  const sexo = sexoDe(r);
  const modos = ['no', 'dicha', 'imagen', 'cinta'] as const;
  const cinta = rangoDeGrasa(sexo, r.alturaCm, medidasDeCinta(r));
  const [minPct, maxPct] = [sexo === 'f' ? 10 : 4, 50];
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuestionario.grasa.titulo')}</Titulo>
        <Texto denso>{t('entrada.cuestionario.grasa.texto')}</Texto>
        <View style={[s.opciones, s.fila]}>
          {modos.map((m, k) => <Elegible key={m} forma="segmento" chico titulo={t(`entrada.cuestionario.grasa.modos.${m}`)} elegida={r.grasaModo === m} alTocar={() => poner((x) => ({ ...x, grasaModo: m }))} demora={k * 60} />)}
        </View>
        <Plegable abierto={r.grasaModo === 'no'}><Chico izquierda>{t('entrada.cuestionario.grasa.sinGrasa')}</Chico></Plegable>
        <Plegable abierto={r.grasaModo === 'dicha'}>
          <View style={[s.numero, { marginTop: 14 }]}>
            <Text style={[s.numeroValor, { fontSize: 56, lineHeight: 62 }]} maxFontSizeMultiplier={TOPE}>{numero(r.grasaPct, 1)}</Text>
            <Text style={s.numeroUnidad}>%</Text>
          </View>
          <Deslizador style={{ marginTop: 14 }} valor={r.grasaPct} min={minPct} max={maxPct} paso={0.5} pasoDeAccesibilidad={1} alCambiar={(v) => poner((x) => ({ ...x, grasaPct: v }))} etiqueta={t('entrada.cuestionario.grasa.titulo')} textoDe={(v) => `${numero(v, 1)} %`} />
          <Chico izquierda>{t('entrada.cuestionario.grasa.dichaTexto')}</Chico>
        </Plegable>
        <Plegable abierto={r.grasaModo === 'imagen'}>
          <Chico izquierda>{t('entrada.cuestionario.grasa.imagenTexto')}</Chico>
          <View style={s.figuras}>
            {FIGURAS[sexo].map(([desde, hasta], k) => <Figurita key={k} sexo={sexo} k={k} rango={t('entrada.cuestionario.grasa.figura', { desde: numero(desde), hasta: numero(hasta) })} elegida={r.figura === k} alTocar={() => poner((x) => ({ ...x, figura: k }))} />)}
          </View>
        </Plegable>
        <Plegable abierto={r.grasaModo === 'cinta'}>
          <View style={s.medidas}>
            {(sexo === 'f' ? (['cintura', 'cuello', 'cadera'] as const) : (['cintura', 'cuello'] as const)).map((m) => (
              <View key={m} style={s.medida}>
                <View style={{ flex: 1 }}>
                  <Text style={s.medidaNombre}>{t(`entrada.cuestionario.grasa.${m}`)}</Text>
                  {m === 'cintura' && <Text style={s.medidaTexto}>{t('entrada.cuestionario.grasa.cinturaTexto')}</Text>}
                </View>
                <Pasito valor={r.cinta[m]} min={RANGOS_DEL_CUERPO[m][0]} max={RANGOS_DEL_CUERPO[m][1]} paso={0.5} nombre={t(`entrada.cuestionario.grasa.${m}`)} formato={(x) => `${numero(x, 1)} cm`} alCambiar={(x) => poner((y) => ({ ...y, cinta: { ...y.cinta, [m]: x } }))} />
              </View>
            ))}
          </View>
          <TextoQueCambia style={s.resultadoCinta} texto={cinta ? t('entrada.cuestionario.grasa.rango', { desde: numero(cinta.desde), hasta: numero(cinta.hasta) }) : t('entrada.cuestionario.grasa.revisa')} />
        </Plegable>
      </Desliza>
      <Seguir alSeguir={alSeguir} desactivado={r.grasaModo === 'imagen' && r.figura === null} />
    </>
  );
}

function Figurita({ sexo, k, rango, elegida, alTocar }: { sexo: Sexo; k: number; rango: string; elegida: boolean; alTocar: () => void }) {
  const reducido = useReducedMotion();
  return (
    <Animated.View entering={entra(reducido, 300 + k * 40)} style={s.figuraCaja}>
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          alTocar();
        }}
        style={[s.figura, elegida && s.figuraElegida]}
        accessibilityRole="radio"
        accessibilityLabel={rango}
        accessibilityState={{ selected: elegida }}
      >
        <Figura sexo={sexo} k={k} color={elegida ? colores.oroClaro : 'rgba(239, 230, 207, 0.4)'} ancho={40} alto={62} />
        <Text style={[s.figuraRango, elegida && { color: colores.oroClaro }]}>{rango}</Text>
      </Pressable>
    </Animated.View>
  );
}

// ------------------------------------------------------------------ el movimiento y el entreno
const ICONOS_DEL_MOVIMIENTO: Record<Movimiento, SFSymbol> = { sentado: 'chair', dePie: 'figure.walk', fisico: 'shippingbox' };
const ICONOS_DEL_ENTRENO: Record<Deporte | 'no', SFSymbol> = { fuerza: 'dumbbell', equipo: 'soccerball', resistencia: 'waveform.path.ecg', contacto: 'football', no: 'pause' };
const ICONOS_DEL_OBJETIVO: Record<ObjetivoDicho, SFSymbol> = { bajar: 'chevron.down', mantener: 'scope', subir: 'chevron.up', recomponer: 'arrow.up.arrow.down' };
const ICONOS_DE_DESPUES: Record<Despues, SFSymbol> = { mantener: 'scope', musculo: 'dumbbell', despues: 'clock' };

/** Fuera del entrenamiento, ¿cuánto te mueves? */
function ElMovimiento({ r, poner, alSeguir }: PropsDePregunta) {
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.movimiento.titulo')}</Titulo>
        <Texto>{t('entrada.cuestionario.movimiento.texto')}</Texto>
        <View style={s.opciones} accessibilityRole="radiogroup">
          {MOVIMIENTOS.map((m, k) => {
            const [titulo, detalle] = lista(`entrada.cuestionario.movimiento.${m}`);
            return <Elegible key={m} titulo={titulo} detalle={detalle} icono={ICONOS_DEL_MOVIMIENTO[m]} elegida={r.movimiento === m} alTocar={() => poner((x) => ({ ...x, movimiento: m }))} demora={k * 80} />;
          })}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/** ¿Entrenas? Qué deportes, con ejemplos que se reconocen: se elige más de uno, y «No entreno» saca los demás. */
function ElEntreno({ r, poner, alSeguir }: PropsDePregunta) {
  const tipos = r.entreno.tipos;
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.entreno.titulo')}</Titulo>
        <Texto>{t('entrada.cuestionario.entreno.texto')}</Texto>
        <View style={[s.opciones, { gap: 8, marginTop: 18 }]}>
          {[...DEPORTES, 'no' as const].map((v, k) => {
            const [titulo, detalle] = lista(`entrada.cuestionario.entreno.tipos.${v}`);
            const elegida = v === 'no' ? !tipos.length : tipos.includes(v);
            return (
              <Elegible
                key={v} titulo={titulo} detalle={detalle} icono={ICONOS_DEL_ENTRENO[v]} marca elegida={elegida} demora={k * 70}
                alTocar={() => poner((x) => ({ ...x, entreno: { ...x.entreno, tipos: v === 'no' ? [] : x.entreno.tipos.includes(v) ? x.entreno.tipos.filter((y) => y !== v) : [...x.entreno.tipos, v] } }))}
              />
            );
          })}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/**
 * ¿Cuándo entrenas? Con un deporte, sus días, su hora y cuánto dura; con dos o más, lo de cada uno, y se ve qué días
 * tienen dos sesiones. Con partidos o choques, si juegas partidos o compites, qué día y a qué hora; con combate, si
 * compites por categoría de peso. Y cuánto tardas en llegar (lo de comer antes de entrenar cuenta el viaje).
 */
function Cuando({ r, poner, alSeguir }: PropsDePregunta) {
  const e = r.entreno;
  const tipos = DEPORTES.filter((x) => e.tipos.includes(x));
  const varios = tipos.length > 1;
  const preguntas = preguntasDelEntreno(tipos);
  const conPartidos = deporteDelPartido(r);
  const dicho = entrenoDicho(r);
  const dobles = diasConDosSesiones(dicho);
  const ponerDe = (tipo: Deporte, cambio: Partial<Contestado['entreno']['de'][Deporte]>) => poner((x) => ({ ...x, entreno: { ...x.entreno, de: { ...x.entreno.de, [tipo]: { ...x.entreno.de[tipo], ...cambio } } } }));
  const ponerEntreno = (cambio: Partial<Contestado['entreno']>) => poner((x) => ({ ...x, entreno: { ...x.entreno, ...cambio } }));
  // El día del partido también es un día de ese deporte: se suma a la vista.
  const conElPartido = (x: Contestado): Contestado => {
    const s0 = x.entreno.de[conPartidos];
    if (!x.entreno.partidos || s0.dias.includes(x.entreno.diaDePartido)) return x;
    return { ...x, entreno: { ...x.entreno, de: { ...x.entreno.de, [conPartidos]: { ...s0, dias: [...s0.dias, x.entreno.diaDePartido] } } } };
  };
  // Al abrir, el día del partido ya contestado también se ve entre los de ese deporte.
  useEffect(() => {
    poner(conElPartido);
    // Solo al abrir: después lo suma cada cambio.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const DE_FABRICA_HORA = 16 * 60;
  const siNo = lista('entrada.cuestionario.entreno.siNo');
  const pregunta = (clave: 'partidos' | 'categoria', si: boolean, alCambiar: (si: boolean) => void) => (
    <Animated.View layout={ACOMODA} style={s.pregunta}>
      <Text style={s.preguntaTexto}>{t(`entrada.cuestionario.entreno.${clave}`)}</Text>
      <View style={[s.fila, { width: 118 }]}>
        <Elegible forma="segmento" titulo={siNo[0]} elegida={!si} alTocar={() => alCambiar(false)} />
        <Elegible forma="segmento" titulo={siNo[1]} elegida={si} alTocar={() => alCambiar(true)} />
      </View>
    </Animated.View>
  );
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuestionario.entreno.cuandoTitulo')}</Titulo>
        {tipos.map((tipo, k) => {
          const de = e.de[tipo];
          return (
            <Animated.View key={tipo} layout={ACOMODA} style={k > 0 && s.sesionOtra}>
              {varios ? (
                <View style={s.sesionCab}>
                  <Icono nombre={ICONOS_DEL_ENTRENO[tipo]} tam={15} />
                  <Text style={s.sesionNombre}>{lista(`entrada.cuestionario.entreno.tipos.${tipo}`)[0]}</Text>
                </View>
              ) : <Etiqueta arriba={16}>{t('entrada.cuestionario.entreno.dias')}</Etiqueta>}
              <Dias elegidos={de.dias} alCambiar={(dias) => ponerDe(tipo, { dias })} />
              <View style={s.dosColumnas}>
                <View style={{ flex: 1 }}>
                  <Etiqueta>{t('entrada.cuestionario.entreno.hora')}</Etiqueta>
                  <Pasito valor={de.hora} min={5 * 60} max={23 * 60} paso={15} nombre={t('entrada.cuestionario.entreno.hora')} formato={horaDelDia} alCambiar={(x) => ponerDe(tipo, { hora: x })} />
                </View>
                <View style={{ flex: 1 }}>
                  <Etiqueta>{t('entrada.cuestionario.entreno.dura')}</Etiqueta>
                  <Pasito valor={de.minutos} min={15} max={180} paso={15} nombre={t('entrada.cuestionario.entreno.dura')} formato={(x) => t('fecha.minutos', { m: x })} alCambiar={(x) => ponerDe(tipo, { minutos: x })} />
                </View>
              </View>
            </Animated.View>
          );
        })}
        <Plegable abierto={dobles.length > 0}><Text style={s.suma}>{t('entrada.cuestionario.entreno.dosSesiones', { dias: listaDeDias(dobles) })}</Text></Plegable>
        <TextoQueCambia style={s.suma} texto={t('entrada.cuestionario.entreno.suma', { n: numero(Math.round(kcalDelEntreno(dicho, r.pesoKg) / 10) * 10) })} />
        {preguntas.partidos && pregunta('partidos', e.partidos, (si) => poner((x) => conElPartido({ ...x, entreno: { ...x.entreno, partidos: si } })))}
        {preguntas.partidos && (
          <Plegable abierto={e.partidos}>
            <Etiqueta arriba={12}>{t('entrada.cuestionario.entreno.partidoDia')}</Etiqueta>
            <Dias uno elegidos={[e.diaDePartido]} alCambiar={([d]) => poner((x) => conElPartido({ ...x, entreno: { ...x.entreno, diaDePartido: d } }))} />
            <Etiqueta arriba={12}>{t('entrada.cuestionario.entreno.partidoHora')}</Etiqueta>
            <View style={s.horaDelPartido}>
              <Interruptor texto={t('entrada.cuestionario.entreno.partidoVaria')} prendido={e.horaDePartido === null} alTocar={() => ponerEntreno({ horaDePartido: null })} />
              {/* Sin hora, el primer toque pone la de fábrica; después, de a 15 minutos. */}
              <Pasito
                valor={e.horaDePartido ?? DE_FABRICA_HORA} min={8 * 60} max={23 * 60} paso={15} apagado={e.horaDePartido === null} nombre={t('entrada.cuestionario.entreno.partidoHora')}
                formato={(x) => (e.horaDePartido === null ? '—:—' : horaDelDia(x))} alCambiar={(x) => ponerEntreno({ horaDePartido: e.horaDePartido === null ? DE_FABRICA_HORA : x })}
              />
            </View>
          </Plegable>
        )}
        {preguntas.categoriaDePeso && pregunta('categoria', e.categoriaDePeso, (si) => ponerEntreno({ categoriaDePeso: si }))}
        <Etiqueta>{t('entrada.cuestionario.entreno.viaje')}</Etiqueta>
        <Animated.View layout={ACOMODA} style={s.fila}>
          {VIAJES.map((min, k) => <Elegible key={min} forma="segmento" chico titulo={lista('entrada.cuestionario.entreno.viajes')[k]} elegida={e.viaje === min} alTocar={() => ponerEntreno({ viaje: min })} />)}
        </Animated.View>
        <Animated.Text layout={ACOMODA} style={s.suma}>{t('entrada.cuestionario.entreno.viajeNota')}</Animated.Text>
      </Desliza>
      <Seguir alSeguir={alSeguir} desactivado={tipos.some((x) => !e.de[x].dias.length)} />
    </>
  );
}

// ------------------------------------------------------------------ lo que se quiere lograr
function ElObjetivo({ r, poner, hoy, alSeguir }: PropsDePregunta) {
  const no = objetivosQueNo(r, hoy);
  // Lo que ya no se puede con lo contestado después (los cuidados, el peso) vuelve a mantener.
  useEffect(() => {
    poner((x) => objetivoPosible(x, hoy));
  }, [poner, hoy]);
  const detalle = (o: ObjetivoDicho): string | null => {
    if (o === 'bajar') return no.bajar === 'sinDeficit' ? t('entrada.cuidado.bajarNo') : no.bajar === 'sinLugar' ? t('entrada.cuestionario.bajarNoSano') : null;
    if (o === 'subir') return no.subir ? t('cuidados.subirNo') : null;
    if (o === 'recomponer') return t(no.recomponer ? 'entrada.cuestionario.recomponerNo' : avisoDeRecomposicion({ objetivo: 'recomponer', entreno: entrenoDicho(r) }) === 'sinFuerza' ? 'entrada.cuestionario.recomponerSinPesas' : 'entrada.cuestionario.recomponerTexto');
    return null;
  };
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.objetivoTitulo')}</Titulo>
        <View style={s.opciones} accessibilityRole="radiogroup">
          {(['bajar', 'mantener', 'subir', 'recomponer'] as const).map((o, k) => (
            <Elegible
              key={o} titulo={t(`entrada.cuestionario.${o}`)} detalle={detalle(o)} icono={ICONOS_DEL_OBJETIVO[o]} elegida={r.objetivo === o} demora={k * 80}
              desactivada={(o === 'bajar' && !!no.bajar) || (o === 'subir' && no.subir) || (o === 'recomponer' && no.recomponer)}
              alTocar={() => poner((x) => conObjetivo(x, o))}
            />
          ))}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/** ¿Hace cuánto entrenas con pesas? Al subir, cambia el ritmo que se propone. Sin frase debajo de «Más de 3 años». */
function LaExperiencia({ r, poner, alSeguir }: PropsDePregunta) {
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.experiencia.titulo')}</Titulo>
        <Texto>{t('entrada.cuestionario.experiencia.texto')}</Texto>
        <View style={s.opciones} accessibilityRole="radiogroup">
          {(['principiante', 'intermedio', 'avanzado'] as const).map((x, k) => (
            <Elegible key={x} titulo={t(`entrada.cuestionario.experiencia.${x}`)} elegida={r.experiencia === x} demora={k * 80} alTocar={() => poner((y) => ({ ...y, experiencia: x, ...(y.fecha ? {} : { ritmo: ritmoSugerido(y.objetivo, x) }) }))} />
          ))}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/** De una semana a dos años, de a una semana. */
const DIAS_MAXIMOS = 728;

/** ¿A qué peso quieres llegar? Y a qué ritmo: cada uno con su fecha, o una fecha con el ritmo que pide (D35). */
function LaMeta({ r, poner, hoy, alSeguir }: PropsDePregunta) {
  const reducido = useReducedMotion();
  useEffect(() => {
    poner(conPesoMeta);
  }, [poner]);
  const dir = r.objetivo === 'subir' ? 'subir' : 'bajar';
  const [min, max] = rangoDelPesoMeta(r.pesoKg, r.alturaCm, dir) ?? [r.pesoKg, r.pesoKg];
  const pesoMeta = Math.min(max, Math.max(min, r.pesoMeta ?? min));
  const sugerido = ritmoSugerido(r.objetivo, levantaPesas(r) ? r.experiencia : null);
  const elegida = r.fecha ? plazoElegido(r, hoy) : null;
  // Antes de los 18, una fecha que pide más que el ritmo recomendado pasa a la que llega a ese ritmo.
  useEffect(() => {
    if (elegida && r.fecha && elegida.fecha !== r.fecha) poner((x) => ({ ...x, fecha: elegida.fecha }));
  }, [elegida, r.fecha, poner]);
  const elegirFecha = () => {
    if (r.fecha) return;
    const x = plazoDeRitmo(r, hoy, r.ritmo);
    poner((y) => ({ ...y, fecha: sumarDias(hoy, x ? Math.min(DIAS_MAXIMOS, diasEntre(hoy, x.fecha)) : 70) }));
  };
  const COLOR_DE_VIABILIDAD = { viable: colores.salvia, exigente: colores.oroClaro, muyAgresivo: '#f0a58a' } as const;
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuestionario.meta.titulo')}</Titulo>
        <View style={[s.numero, { marginTop: 14 }]}>
          <Text style={[s.numeroValor, { fontSize: 56, lineHeight: 62 }]} maxFontSizeMultiplier={TOPE}>{numero(pesoMeta, 1)}</Text>
          <Text style={s.numeroUnidad}>kg</Text>
        </View>
        <Deslizador style={{ marginTop: 14 }} valor={pesoMeta} min={min} max={max} paso={0.5} pasoDeAccesibilidad={0.5} alCambiar={(v) => poner((x) => ({ ...x, pesoMeta: v }))} etiqueta={t('entrada.cuestionario.meta.titulo')} textoDe={(v) => `${kg(v)} kg`} />
        <View style={s.regla}>
          <Text style={s.reglaTexto}>{kg(min)}</Text>
          <Text style={s.reglaTexto}>{kg(max)}</Text>
        </View>
        {dir === 'bajar' && <Chico izquierda>{t('entrada.cuestionario.meta.minimo', { kg: kg(min) })}</Chico>}
        <Etiqueta>{t('entrada.cuestionario.meta.ritmo')}</Etiqueta>
        <View style={{ gap: 6 }}>
          {(['suave', 'recomendado', 'rapido', 'fecha'] as const).map((k, i) => {
            const esFecha = k === 'fecha';
            const menor = dir === 'bajar' && k === 'rapido' && r.edad < MAYORIA_DE_EDAD;
            const plazo = esFecha ? null : plazoDeRitmo(r, hoy, k);
            const pulsada = esFecha ? !!r.fecha : !r.fecha && r.ritmo === k;
            const fecha = esFecha ? (r.fecha ? fechaDelCamino(r.fecha, hoy) : '') : plazo && !menor ? fechaDelCamino(plazo.fecha, hoy) : '';
            return (
              <Animated.View key={k} entering={entra(reducido, 320 + i * 70)} layout={ACOMODA}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    if (esFecha) elegirFecha();
                    else poner((x) => ({ ...x, ritmo: k, fecha: null }));
                  }}
                  disabled={menor}
                  style={[s.ritmo, pulsada && s.ritmoElegido, menor && { opacity: 0.45 }]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: pulsada, disabled: menor }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={s.ritmoCab}>
                      <Text style={s.ritmoTitulo}>{t(esFecha ? 'entrada.cuestionario.meta.elegirFecha' : `entrada.cuestionario.${k}`)}</Text>
                      {k === sugerido && k !== 'recomendado' && <Text style={s.sugerida}>{t('entrada.cuestionario.meta.paraTi')}</Text>}
                    </View>
                    <Text style={s.ritmoDetalle}>{esFecha ? t('entrada.cuestionario.meta.elegirFechaTexto') : menor ? t('entrada.cuestionario.meta.desde18') : t('entrada.cuestionario.meta.porSemana', { pct: hasta2(pctDe(r, k)) })}</Text>
                  </View>
                  <Text style={s.ritmoFecha}>{fecha}</Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
        <Plegable abierto={!!r.fecha} style={s.fechaElegida}>
          <Pasito
            valor={r.fecha ? diasEntre(hoy, r.fecha) : 70} min={7} max={DIAS_MAXIMOS} paso={7} ancho={76} nombre={t('entrada.cuestionario.meta.elegirFecha')}
            formato={(d) => fechaDelCamino(sumarDias(hoy, d), hoy)} alCambiar={(d) => poner((x) => ({ ...x, fecha: sumarDias(hoy, d) }))}
          />
          {elegida && (
            <View style={s.viabilidad}>
              <Text style={[s.viabilidadNombre, { color: COLOR_DE_VIABILIDAD[elegida.viabilidad] }]}>{t(`entrada.cuestionario.meta.viabilidad.${elegida.viabilidad}`)}</Text>
              <Text style={s.viabilidadPct}>{t('entrada.cuestionario.meta.porSemana', { pct: hasta2(elegida.pct) })}</Text>
            </View>
          )}
        </Plegable>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/** Cuando llegues, ¿qué sigue? El plan en una línea: hoy, la meta con su fecha y lo que sigue después del mantenimiento. */
function LoQueSigue({ r, poner, hoy, alSeguir }: PropsDePregunta) {
  const plazo = plazoElegido(r, hoy);
  const llegada = plazo ? plazo.fecha : null;
  const meta = r.pesoMeta ?? r.pesoKg;
  const musculo = lista('entrada.cuestionario.despues.musculo');
  const opciones: [Despues, string, string][] = [
    ['mantener', ...(lista('entrada.cuestionario.despues.mantener') as [string, string])],
    ['musculo', musculo[0], r.objetivo === 'subir' ? t('entrada.cuestionario.despues.musculoSubir') : musculo[1]],
    ['despues', ...(lista('entrada.cuestionario.despues.despues') as [string, string])],
  ];
  return (
    <>
      <Desliza>
        <Titulo>{t('entrada.cuestionario.despues.titulo', { kg: kg(meta) })}</Titulo>
        <Texto>{t('entrada.cuestionario.despues.texto', { n: SEMANAS_DE_MANTENIMIENTO })}</Texto>
        <ElPlan
          nodos={[
            [t('entrada.cuestionario.despues.hoy'), `${kg(r.pesoKg)} kg`],
            [llegada ? fechaDelCamino(llegada, hoy) : '—', `${kg(meta)} kg`],
            [llegada ? fechaDelCamino(sumarDias(llegada, SEMANAS_DE_MANTENIMIENTO * 7), hoy) : '—', t(`entrada.cuestionario.despues.elegido.${r.despues}`)],
          ]}
        />
        <View style={s.opciones} accessibilityRole="radiogroup">
          {opciones.map(([v, titulo, detalle], k) => <Elegible key={v} titulo={titulo} detalle={detalle} icono={ICONOS_DE_DESPUES[v]} elegida={r.despues === v} demora={k * 80} alTocar={() => poner((x) => ({ ...x, despues: v }))} />)}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/** El plan en una línea: tres nodos y el hilo que la estrella recorre. */
function ElPlan({ nodos }: { nodos: [string, string][] }) {
  const reducido = useReducedMotion();
  const ancho = useSharedValue(reducido ? 1 : 0);
  useEffect(() => {
    if (!reducido) ancho.set(withDelay(500, withTiming(1, { duration: 1100 })));
  }, [ancho, reducido]);
  const hilo = useAnimatedStyle(() => ({ width: `${ancho.get() * 100}%` }));
  return (
    <View style={s.plan}>
      <View style={s.planHilo}>
        <Animated.View style={[s.planLleno, hilo]} />
      </View>
      {nodos.map(([arriba, abajo], k) => (
        <View key={k} style={s.planNodo}>
          <View style={[s.planPunto, k === nodos.length - 1 && s.planPuntoUltimo]} />
          <Text style={s.planArriba}>{arriba}</Text>
          <TextoQueCambia style={s.planAbajo} texto={abajo} />
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ cómo comer y tu día
/** ¿Cómo quieres comer? El reparto (con su barra, para la meta de ahora), la proteína en gramos y lo que comes. */
function Comer({ r, poner, hoy, alSeguir }: PropsDePregunta) {
  const kcal = metaDeAhora(r, hoy).metas.kcal;
  const resp = respuestasPara(r, hoy);
  const proteina = proteinaDelNivel(resp);
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuestionario.comer.titulo')}</Titulo>
        <Etiqueta>{t('entrada.cuestionario.comer.reparto')}</Etiqueta>
        {[ESTILOS.slice(0, 2), ESTILOS.slice(2)].map((par, j) => (
          <View key={j} style={[s.fila, { gap: 8, marginTop: j ? 8 : 0 }]}>
            {par.map((e, k) => {
              const m = macrosConProteina(kcal, r.pesoKg, proteina, e);
              const partes = [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9];
              return (
                <Elegible
                  key={e} forma="cuadro" titulo={lista(`progreso.metas.estilos.${e}`)[0]} elegida={r.estilo === e} demora={(j * 2 + k) * 60} alTocar={() => poner((x) => ({ ...x, estilo: e }))}
                  abajo={(
                    <View style={s.barraMacros}>
                      {MACROS.map((macro, i) => <Animated.View key={macro} layout={ACOMODA} style={{ flex: Math.max(0.001, partes[i]), backgroundColor: COLOR_DE_MACRO[macro] }} />)}
                    </View>
                  )}
                />
              );
            })}
          </View>
        ))}
        <TextoQueCambia style={[s.cuando, { minHeight: 50 }]} texto={t(`entrada.cuestionario.comer.cuando.${r.estilo}`)} />
        <Etiqueta>{t('entrada.cuestionario.comer.proteina')}</Etiqueta>
        <View style={s.fila}>
          {NIVELES_DE_PROTEINA.map((n, k) => {
            const g = macrosConProteina(kcal, r.pesoKg, proteinaDelNivel({ ...resp, proteina: n })).proteina;
            return <Elegible key={n} forma="segmento" titulo={t(`entrada.cuestionario.comer.niveles.${n}`)} detalle={t('entrada.cuestionario.comer.gramos', { n: numero(g) })} elegida={r.proteina === n} demora={k * 60} alTocar={() => poner((x) => ({ ...x, proteina: n }))} />;
          })}
        </View>
        <TextoQueCambia style={s.cuando} texto={t(`entrada.cuestionario.comer.proteinaCuando.${r.proteina}`)} />
        <Etiqueta>{t('entrada.cuestionario.comer.dieta')}</Etiqueta>
        <View style={s.chips}>
          {DIETAS.map((d, k) => <Elegible key={d} forma="chip" titulo={t(`comida.plan.dietas.${d}`)} elegida={r.dieta === d} demora={k * 50} alTocar={() => poner((x) => ({ ...x, dieta: d }))} />)}
        </View>
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

/**
 * ¿Cómo es tu día? De que te despiertas a que te acuestas, con las comidas y el entreno en el medio: lo que usan
 * los avisos (qué comer antes de entrenar, contando el viaje, y la hora de dormir). Con tres noches en Salud, el
 * sueño ya se sabe: se muestra y no se pregunta.
 */
function TuDia({ r, poner, hoy, noches, alSeguir }: PropsDePregunta) {
  const reducido = useReducedMotion();
  const deSalud = suenoDeSalud(r, noches, hoy);
  const e = entrenoDicho(r);
  type Fila = { tipo: 'despertar' | 'acostarse' } | { tipo: 'comida'; comida: (typeof CON_HORA)[number]; min: number } | { tipo: 'entreno'; sesion: NonNullable<typeof e>['sesiones'][number]; min: number };
  const medio: Fila[] = [...CON_HORA.map((c): Fila => ({ tipo: 'comida', comida: c, min: r.horarios[c] })), ...(e?.sesiones ?? []).map((sesion): Fila => ({ tipo: 'entreno', sesion, min: sesion.hora }))];
  const claveDe = (f: Fila) => (f.tipo === 'comida' ? f.comida : f.tipo === 'entreno' ? f.sesion.tipo : f.tipo);
  // El orden se fija al abrir: cambiar una hora no hace saltar las filas.
  const [orden] = useState(() => [...medio].sort((a, b) => ('min' in a ? a.min : 0) - ('min' in b ? b.min : 0)).map(claveDe));
  medio.sort((a, b) => orden.indexOf(claveDe(a)) - orden.indexOf(claveDe(b)));
  const filas: Fila[] = [{ tipo: 'despertar' }, ...medio, { tipo: 'acostarse' }];
  const ponerHora = (c: (typeof CON_HORA)[number], x: number) => poner((y) => ({ ...y, horarios: { ...y.horarios, [c]: x } }));
  return (
    <>
      <Desliza>
        <Titulo denso>{t('entrada.cuestionario.dia.titulo')}</Titulo>
        <Texto denso>{t('entrada.cuestionario.dia.texto')}</Texto>
        <View style={s.diaLista}>
          <View style={s.diaHilo} />
          {filas.map((f, k) => {
            const sueno = f.tipo === 'despertar' || f.tipo === 'acostarse';
            const no = f.tipo === 'comida' && !!r.noSuele[f.comida];
            let nombre: ReactNode;
            let valor: ReactNode;
            if (f.tipo === 'comida') {
              const c = f.comida;
              nombre = (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    poner((y) => ({ ...y, noSuele: { ...y.noSuele, [c]: !y.noSuele[c] } }));
                  }}
                  style={s.diaNombre}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: !no }}
                >
                  <Text style={[s.diaNombreTexto, no && { color: 'rgba(239, 230, 207, 0.45)' }]}>{t(`comida.comidas.${c}`)}</Text>
                </Pressable>
              );
              valor = no
                ? <Animated.Text key="no" entering={entra(reducido)} style={s.diaNo}>{t('entrada.cuestionario.dia.noSuelo')}</Animated.Text>
                : <Animated.View key="si" entering={entra(reducido)}><Pasito valor={r.horarios[c]} min={4 * 60} max={24 * 60 - 15} paso={15} nombre={t(`comida.comidas.${c}`)} formato={horaDelDia} alCambiar={(x) => ponerHora(c, x)} /></Animated.View>;
            } else if (f.tipo === 'entreno') {
              const ses = f.sesion;
              const dias = listaDeDias(ses.dias);
              nombre = (
                <View style={s.diaNombre}>
                  <Text style={s.diaNombreTexto}>{lista(`entrada.cuestionario.entreno.tipos.${ses.tipo}`)[0]}</Text>
                  <Text style={s.diaDetalle}>{e!.viaje ? t('entrada.cuestionario.dia.sesion', { dias, hora: horaDelDia(ses.hora - e!.viaje) }) : t('entrada.cuestionario.dia.sesionEnCasa', { dias })}</Text>
                </View>
              );
              valor = <Text style={s.diaFijo}>{`${horaDelDia(ses.hora)}–${horaDelDia(ses.hora + ses.minutos)}`}</Text>;
            } else {
              const despertar = f.tipo === 'despertar';
              nombre = <View style={s.diaNombre}><Text style={s.diaNombreTexto}>{t(`entrada.cuestionario.dia.${despertar ? 'despertar' : deSalud ? 'dormirse' : 'acostarse'}`)}</Text></View>;
              if (deSalud) {
                valor = (
                  <View style={s.fila}>
                    <Text style={s.diaFijo}>{horaDelDia(despertar ? deSalud.despertar : deSalud.dormirse)}</Text>
                    <Text style={s.deSalud}>{t('entrada.cuestionario.deSalud')}</Text>
                  </View>
                );
              } else if (despertar) {
                valor = <Pasito valor={r.sueno.despertar} min={4 * 60} max={12 * 60} paso={15} nombre={t('entrada.cuestionario.dia.despertar')} formato={horaDelDia} alCambiar={(x) => poner((y) => ({ ...y, sueno: { ...y.sueno, despertar: x } }))} />;
              } else {
                // Pasada la medianoche sigue siendo la noche de ese día: se cuenta desde la tarde y se guarda la hora del reloj.
                const noche = r.sueno.acostarse < 12 * 60 ? r.sueno.acostarse + 24 * 60 : r.sueno.acostarse;
                valor = <Pasito valor={noche} min={20 * 60} max={27 * 60} paso={15} nombre={t('entrada.cuestionario.dia.acostarse')} formato={horaDelDia} alCambiar={(x) => poner((y) => ({ ...y, sueno: { ...y.sueno, acostarse: x % (24 * 60) } }))} />;
              }
            }
            return (
              <Animated.View key={claveDe(f)} entering={entra(reducido, 300 + k * 50)} style={s.diaFila}>
                <View style={[s.diaNodo, sueno && s.diaNodoSueno, f.tipo === 'entreno' && s.diaNodoEntreno, no && s.diaNodoNo]} />
                {nombre}
                {valor}
              </Animated.View>
            );
          })}
        </View>
        {!deSalud && (
          <>
            <Etiqueta>{t('entrada.cuestionario.dia.finDeSemana')}</Etiqueta>
            <View style={s.fila}>
              {(['igual', 'tarde'] as const).map((k) => <Elegible key={k} forma="segmento" titulo={t(`entrada.cuestionario.dia.finDeSemanaOpciones.${k}`)} elegida={r.sueno.finDeSemana === k} alTocar={() => poner((y) => ({ ...y, sueno: { ...y.sueno, finDeSemana: k } }))} />)}
            </View>
          </>
        )}
      </Desliza>
      <Seguir alSeguir={alSeguir} />
    </>
  );
}

// ------------------------------------------------------------------ el resultado
/** El plan en una línea: «Bajar a 71 kg para el 4 de enero; después, mantener». */
function lineaDelPlan(r: Contestado, hoy: ClaveDia, objetivo: string, recomponer: boolean): string {
  if (recomponer) return t('entrada.cuestionario.plan.recomponer');
  if (objetivo === 'mantener' || !cambiaPeso(r)) return t('entrada.cuestionario.plan.mantener', { kg: kg(r.pesoKg) });
  const plazo = plazoElegido(r, hoy);
  const p = plazo ? partesDe(plazo.fecha) : null;
  const fecha = p && plazo ? t(diasEntre(hoy, plazo.fecha) > 300 ? 'entrada.cuestionario.fechaConAnio' : 'entrada.cuestionario.fecha', { num: p.dia, mes: lista('fecha.meses')[p.mes], anio: p.anio }) : '';
  return t(`entrada.cuestionario.plan.${objetivo === 'subir' ? 'subir' : 'bajar'}`, { kg: kg(r.pesoMeta ?? r.pesoKg), fecha }) + t(`entrada.cuestionario.plan.luego.${r.despues}`);
}

/**
 * Tu punto de partida: el plan en una línea, la luna con los macros, la meta que cuenta hasta llegar y de dónde
 * sale el gasto (en reposo, la vida diaria y el entrenamiento). Desde Perfil, la meta nueva al lado de la de antes.
 */
export function Resultado({ r, hoy, alEmpezar, boton, kcalAntes }: { r: Contestado; hoy: ClaveDia; alEmpezar: () => void; boton: string; kcalAntes?: number | null }) {
  const reducido = useReducedMotion();
  const meta = metaDeAhora(r, hoy);
  const m = meta.metas;
  const partes = partesRedondas(meta.gasto);
  const kcal = [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9];
  const total = kcal.reduce((a, b) => a + b, 0) || 1;
  const [llena, setLlena] = useState(false);
  // La cifra cuenta desde cero hasta la meta, de a pasos (useCuenta) y no en cada cuadro.
  const [hasta, setHasta] = useState(reducido ? m.kcal : 0);
  const cuenta = Math.round(useCuenta(hasta, 1400));
  useEffect(() => {
    const id = setTimeout(() => {
      setLlena(true);
      setHasta(m.kcal);
    }, 200);
    return () => clearTimeout(id);
  }, [m.kcal]);
  const enPartes = t(partes.entreno ? 'entrada.cuestionario.partes' : 'entrada.cuestionario.partesSinEntreno', { reposo: numero(partes.reposo), vida: numero(partes.vida), entreno: numero(partes.entreno) })
    + (meta.gasto.conGrasa ? ` · ${t('entrada.cuestionario.masaMagra')}` : '');
  return (
    <>
      <Desliza>
        <Titulo centrado>{t(kcalAntes !== undefined ? 'entrada.cuestionario.revisar.titulo' : 'entrada.cuestionario.resultadoTitulo')}</Titulo>
        <Animated.Text entering={entra(reducido, 300)} style={s.planLinea}>{lineaDelPlan(r, hoy, meta.objetivo, meta.recomponer)}</Animated.Text>
        <View style={s.lunaResultado}>
          <Luna tam={100} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : 1600} />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Anillos tam={196} reparto={[kcal[0] / total, kcal[1] / total, kcal[2] / total]} ms={reducido ? 0 : 1600} demora={200} />
          </View>
        </View>
        <View style={s.kcal}>
          <Text style={s.kcalNumero} maxFontSizeMultiplier={TOPE}>{numero(cuenta)}</Text>
          <Text style={s.kcalTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.cuestionario.kcal')}</Text>
        </View>
        <View style={s.macros}>
          {MACROS.map((x) => (
            <View key={x} style={s.macro}>
              <View style={[s.macroPunto, { backgroundColor: COLOR_DE_MACRO[x], shadowColor: COLOR_DE_MACRO[x] }]} />
              <Text style={s.macroNombre}>{t(`entrada.cuestionario.${x}`)}</Text>
              <Text style={s.macroGramos}>{`${numero(m[x])} g`}</Text>
            </View>
          ))}
        </View>
        <Text style={[s.chico, s.centrado]}>{t('entrada.cuestionario.gasto', { n: numero(partes.total) })}</Text>
        <Text style={s.partes}>{enPartes}</Text>
        {kcalAntes ? <Texto centrado>{t('entrada.cuestionario.revisar.antes', { antes: numero(kcalAntes), ahora: numero(m.kcal) })}</Texto> : kcalAntes === undefined ? <Texto centrado>{t('entrada.cuestionario.resultadoTexto')}</Texto> : null}
        <Text style={[s.chico, s.centrado]}>{t('entrada.cuestionario.profesional')}</Text>
      </Desliza>
      <Pie>
        <Boton texto={boton} alTocar={alEmpezar} />
      </Pie>
    </>
  );
}

const s = StyleSheet.create({
  titulo: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, lineHeight: 35, color: colores.pergamino, ...SOMBRA },
  tituloDenso: { fontSize: 28, lineHeight: 31 },
  texto: { marginTop: 12, maxWidth: 320, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 22, color: 'rgba(239, 230, 207, 0.78)', ...SOMBRA },
  textoDenso: { marginTop: 8, fontSize: 14, lineHeight: 20 },
  chico: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)', textAlign: 'center' },
  izquierda: { textAlign: 'left' },
  centrado: { textAlign: 'center', alignSelf: 'center' },
  pie: { gap: 10, width: '100%', maxWidth: 340, alignSelf: 'center', paddingTop: 12 },
  desliza: { flex: 1, marginHorizontal: -26 },
  deslizaAdentro: { paddingHorizontal: 26, paddingBottom: 14 },
  avance: { height: 2 },
  barra: { height: 1.5, borderRadius: 1, backgroundColor: 'rgba(239, 230, 207, 0.12)', overflow: 'hidden' },
  barraLlena: { height: '100%', backgroundColor: colores.oro },
  avanceFila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: LADO_ATRAS - 4, marginTop: 12, marginBottom: 6 },
  paso: { flex: 1, textAlign: 'right', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  // Corrida a la izquierda, para que la flecha quede alineada con el texto de abajo.
  atras: {
    width: LADO_ATRAS, height: LADO_ATRAS, marginVertical: -2, marginLeft: -6, marginRight: -2, borderRadius: LADO_ATRAS / 2, borderWidth: 1,
    borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(6, 10, 22, 0.45)', alignItems: 'center', justifyContent: 'center',
  },
  atrasApretado: { transform: [{ scale: 0.92 }], backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  cerrar: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.22)', backgroundColor: 'rgba(6, 10, 22, 0.5)' },
  cerrarTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.85)' },
  linea: { position: 'absolute', height: 1, backgroundColor: 'rgba(239, 230, 207, 0.14)' },
  lineaHecha: { backgroundColor: 'rgba(232, 196, 106, 0.55)' },
  estrella: { position: 'absolute', backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  estrellaHecha: { backgroundColor: colores.oro },
  estrellaAhora: { backgroundColor: colores.cifra, shadowColor: colores.cifra, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  chipFila: { marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  deSalud: { overflow: 'hidden', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.4)', fontFamily: letras.texto, fontSize: 11, color: colores.salvia },
  menor: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  numero: { marginTop: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  numeroCentro: { flexShrink: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 170, justifyContent: 'center' },
  numeroValor: { flexShrink: 1, fontFamily: letras.numeroLiviano, fontSize: 68, lineHeight: 74, letterSpacing: -1.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
  numeroUnidad: { fontFamily: letras.texto, fontSize: 16, color: 'rgba(239, 230, 207, 0.6)' },
  fino: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  opciones: { marginTop: 22, gap: 10 },
  fila: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tarjeta: { marginTop: 20, borderRadius: 18, backgroundColor: 'rgba(6, 10, 22, 0.55)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', overflow: 'hidden' },
  tarjetaBorde: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  tarjetaFila: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 16 },
  tarjetaNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14.5, color: 'rgba(239, 230, 207, 0.72)' },
  tarjetaValor: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.cifra, fontVariant: ['tabular-nums'] },
  editor: { paddingHorizontal: 16, paddingBottom: 14 },
  deslizadorChico: { marginTop: 0 },
  extra: { gap: 9, paddingTop: 12, paddingHorizontal: 2 },
  extraFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  extraTexto: { flexShrink: 1, fontFamily: letras.texto, fontSize: 13, lineHeight: 17, color: 'rgba(239, 230, 207, 0.76)' },
  nota: { marginTop: 12, marginHorizontal: 2, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.66)' },
  notaPrivada: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  notaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5 },
  consentimiento: { gap: 9, padding: 14, paddingBottom: 12, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.42)', backgroundColor: 'rgba(6, 10, 22, 0.72)' },
  consentimientoTexto: { flexDirection: 'row', gap: 9, marginBottom: 2 },
  consentimientoLetra: { flex: 1, fontFamily: letras.texto, fontSize: 13.5, lineHeight: 19, color: colores.pergamino },
  figuras: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  figuraCaja: { width: '31.5%' },
  figura: { alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  figuraElegida: { borderColor: 'rgba(232, 196, 106, 0.75)', backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  figuraRango: { fontFamily: letras.numero, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.66)', fontVariant: ['tabular-nums'] },
  medidas: { marginTop: 12, gap: 8 },
  medida: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingRight: 8, paddingLeft: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  medidaNombre: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
  medidaTexto: { marginTop: 2, fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.55)' },
  resultadoCinta: { marginTop: 12, fontFamily: letras.texto, fontSize: 15, color: colores.oroClaro, textAlign: 'center' },
  sesionOtra: { marginTop: 14, paddingTop: 2, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  sesionCab: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 10 },
  sesionNombre: { fontFamily: letras.textoMedio, fontSize: 14, color: colores.pergamino },
  dosColumnas: { flexDirection: 'row', gap: 12 },
  suma: { marginTop: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.6)' },
  pregunta: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  preguntaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 14, lineHeight: 18, color: colores.pergamino },
  horaDelPartido: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  regla: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  reglaTexto: { fontFamily: letras.numero, fontSize: 11, color: 'rgba(239, 230, 207, 0.38)', fontVariant: ['tabular-nums'] },
  ritmo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.55)' },
  ritmoElegido: { borderColor: 'rgba(232, 196, 106, 0.75)', backgroundColor: 'rgba(232, 196, 106, 0.1)', shadowColor: colores.oro, shadowOpacity: 0.18, shadowRadius: 11, shadowOffset: { width: 0, height: 0 } },
  ritmoCab: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ritmoTitulo: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  ritmoDetalle: { marginTop: 2, fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.6)' },
  ritmoFecha: { fontFamily: letras.numero, fontSize: 14, color: 'rgba(239, 230, 207, 0.88)', fontVariant: ['tabular-nums'] },
  sugerida: { overflow: 'hidden', paddingVertical: 3, paddingHorizontal: 7, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.45)', fontFamily: letras.texto, fontSize: 10.5, color: colores.salvia },
  fechaElegida: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  viabilidad: { alignItems: 'flex-end', gap: 4 },
  viabilidadNombre: { fontFamily: letras.textoMedio, fontSize: 12.5 },
  viabilidadPct: { fontFamily: letras.numero, fontSize: 12, color: 'rgba(239, 230, 207, 0.62)' },
  plan: { marginTop: 24, flexDirection: 'row', gap: 6 },
  planHilo: { position: 'absolute', left: '16.67%', right: '16.67%', top: 5, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.18)' },
  planLleno: { height: 1, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  planNodo: { flex: 1, alignItems: 'center', gap: 3 },
  planPunto: { width: 11, height: 11, marginBottom: 7, borderRadius: 6, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.7, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
  planPuntoUltimo: { backgroundColor: '#0c1124', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.75)', shadowOpacity: 0 },
  planArriba: { fontFamily: letras.numeroMedio, fontSize: 13.5, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  planAbajo: { textAlign: 'center', fontFamily: letras.texto, fontSize: 12, lineHeight: 15.5, color: 'rgba(239, 230, 207, 0.7)' },
  barraMacros: { flexDirection: 'row', gap: 2, height: 4, marginTop: 9, borderRadius: 2, overflow: 'hidden' },
  cuando: { marginTop: 8, marginHorizontal: 2, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.72)' },
  diaLista: { marginTop: 14, gap: 2 },
  diaHilo: { position: 'absolute', left: 6, top: 22, bottom: 22, width: 1, backgroundColor: 'rgba(232, 196, 106, 0.5)' },
  diaFila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  diaNodo: { width: 13, height: 13, borderRadius: 7, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  diaNodoSueno: { backgroundColor: colores.grasas, shadowColor: colores.grasas },
  diaNodoEntreno: { backgroundColor: colores.salvia, shadowColor: colores.salvia },
  diaNodoNo: { backgroundColor: '#0b1022', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.35)', shadowOpacity: 0 },
  diaNombre: { flex: 1, paddingVertical: 4, gap: 2 },
  diaNombreTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  diaDetalle: { fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
  diaNo: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.5)' },
  diaFijo: { fontFamily: letras.numeroMedio, fontSize: 15, color: 'rgba(239, 230, 207, 0.86)', fontVariant: ['tabular-nums'] },
  planLinea: { marginTop: 10, maxWidth: 320, alignSelf: 'center', textAlign: 'center', fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 16.5, lineHeight: 22, color: colores.oroClaro, ...SOMBRA },
  lunaResultado: { width: 196, height: 196, alignSelf: 'center', marginTop: 14, alignItems: 'center', justifyContent: 'center' },
  kcal: { marginTop: 2, alignItems: 'center' },
  kcalNumero: { fontFamily: letras.numeroLiviano, fontSize: 44, lineHeight: 48, letterSpacing: -0.8, color: colores.cifra, fontVariant: ['tabular-nums'], ...SOMBRA },
  kcalTexto: { fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 1.9, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  macros: { marginTop: 22, alignSelf: 'center', width: '100%', maxWidth: 300, gap: 8 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroPunto: { width: 8, height: 8, borderRadius: 4, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  macroNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.8)' },
  macroGramos: { fontFamily: letras.numeroMedio, fontSize: 14, color: colores.cifra, fontVariant: ['tabular-nums'] },
  partes: { marginTop: 4, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.5)' },
});
