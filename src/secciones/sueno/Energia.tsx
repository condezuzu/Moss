// Tu energía, la de la galería (galeria/src/inicio.js, tarjetaDeEnergia; spec/entreno.md 5.13): la de ahora,
// según la hora, con la regla de src/dominio/energia.ts. Arriba, la batería, «Tu energía · esta tarde», cómo está
// y una frase; la curva del día sobre la tira de tu día (las comidas y ahora) y las partes: el sueño, que dice si
// está bien o mal, y la comida, con hoy y estos días juntos (lo pediste el 17/11). «Más» explica cada parte: con qué
// números, qué significa, qué conviene y qué mira Moss; se pliega en vez de «No mostrar más». Sin Ascent, es la de
// tu día: sin la sesión, los músculos ni lo de no llegar al fallo. Con Ascent vinculada, la capa del gimnasio: la
// etiqueta dice «· con Ascent» con su marca, la tira lleva la sesión y las partes, los músculos (spec/entreno.md 5.13).
// Vive en Sueño, debajo de la noche. Inicio usa lo mismo para su botón: useEnergia, Bateria, fraseDeEnergia,
// TiraDelDia, PartesDeEnergia e irAEnergia (que lleva a la tarjeta).

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import type { EstadoDeEnergia, Parte, TramoDeLaCurva } from '@/dominio/energia';
import { DESPUES_DE_SU_HORA, DIAS_ANOTADOS, DIAS_DE_ENERGIA, LLEGASTE } from '@/dominio/energia';
import { horaDeReloj } from '@/dominio/avisos';
import { NOCHE_CORTA, NOCHE_MUY_CORTA } from '@/dominio/rendimiento';
import { TRAMOS_DE_LA_DEUDA } from '@/dominio/sueno';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Relleno } from '../animados';
import { MarcaChica } from '../ascent/MarcaChica';
import { useTitularDeAscent } from '../ascent/titularDeHoy';
import { Icono } from '../comida/comunes';
import { duracion, numero, useEstado, useNumeros } from '../comida/datos';
import { useSueno } from '../ganchos';
import { ACOMODA, Aparece } from '../tarjetas';
import { Curva } from './Dibujos';
import { energiaDeHoy, type DatosDeEnergia } from './datosDeEnergia';

export type { DatosDeEnergia } from './datosDeEnergia';
export type EstadoDelBoton = EstadoDeEnergia | 'sinDatos';

/** El color de cada estado: el de «atención» para la baja (como las franjas de Ascent) y el oro para la alta. */
export const COLOR_DE_ENERGIA: Record<EstadoDelBoton, { color: string; rgb: string; alfa: number }> = {
  baja: { color: '#cb8569', rgb: '203, 133, 105', alfa: 1 },
  suficiente: { color: 'rgba(239, 230, 207, 0.8)', rgb: '239, 230, 207', alfa: 0.8 },
  alta: { color: colores.oro, rgb: '232, 196, 106', alfa: 1 },
  sinDatos: { color: 'rgba(239, 230, 207, 0.3)', rgb: '239, 230, 207', alfa: 0.3 },
};

export const estadoDe = (d: DatosDeEnergia | null): EstadoDelBoton => d?.dia?.estado ?? 'sinDatos';

/** La hora cambia lo que se dice: se rehace cada `ms` (de fábrica, cinco minutos). */
export function useAhora(ms = 5 * 60_000): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), ms);
    return () => clearInterval(reloj);
  }, [ms]);
  return ahora;
}

/** Tu energía de ahora; sin cuestionario, null. */
export function useEnergia(): DatosDeEnergia | null {
  const e = useEstado();
  const s = useSueno();
  const ahora = useAhora();
  const ascent = useTitularDeAscent();
  return useMemo(() => energiaDeHoy(e, s, ahora, ascent), [e, s, ahora, ascent]);
}

// ------------------------------------------------------------ ir a la tarjeta desde Inicio
// «Más en Sueño», en el globo de Inicio: la sección se desliza y Sueño baja suave hasta la tarjeta, con «Más»
// abierto, y la tarjeta brilla un momento (así se ve adónde llegaste).
const quienesVan = new Set<() => void>();
let pendiente = false;
let masAbierto = false;
let plegada = false;

/** Lleva a la tarjeta de Sueño, con «Más» abierto. Inicio llama a esto al deslizar a Sueño. */
export function irAEnergia() {
  masAbierto = true;
  plegada = false;
  pendiente = true;
  quienesVan.forEach((f) => f());
}

/** Sueño lo escucha: `alIr` baja hasta la tarjeta. */
export function useIrAEnergia(alIr: () => void) {
  useEffect(() => {
    const f = () => {
      pendiente = false;
      alIr();
    };
    quienesVan.add(f);
    if (pendiente) f();
    return () => {
      quienesVan.delete(f);
    };
  }, [alIr]);
}

// ------------------------------------------------------------ las palabras
type Cuando = 'alDespertar' | 'manana' | 'tarde' | 'antes' | 'despues' | 'noche';
/** Cuándo es, para la etiqueta: el momento, o la parte del día. */
export function cuandoEs(d: DatosDeEnergia): Cuando {
  const m = d.dia?.momento;
  if (m === 'recienDespierto') return 'alDespertar';
  if (m === 'antesDeEntrenar') return 'antes';
  if (m === 'despuesDeEntrenar') return 'despues';
  if (m === 'noche') return 'noche';
  return d.ahora < 12 * 60 ? 'manana' : d.ahora < 20 * 60 ? 'tarde' : 'noche';
}

const CLAVE_DEL_MOMENTO = { recienDespierto: 'manana', antesDeEntrenar: 'antes', despuesDeEntrenar: 'despues', noche: 'noche', dia: 'dia' } as const;

/** La frase de arriba: según el estado y el momento; alta, con por qué. */
export function fraseDeEnergia(d: DatosDeEnergia): string {
  const en = d.dia;
  if (!en) return t('inicio.energia.texto.sinDatos');
  const momento = CLAVE_DEL_MOMENTO[en.momento];
  const hora = en.sesion ? horaDeReloj(en.sesion.inicio) : '';
  if (en.estado !== 'alta') {
    if (momento === 'dia') return t(en.estado === 'suficiente' && en.entrenaHoy ? 'inicio.energia.texto.suficienteEntrena' : `inicio.energia.texto.${en.estado}`);
    return t(`inicio.energia.momento.${momento}.${en.estado}`, { hora, cama: d.noche?.cama ?? '' });
  }
  // Alta: por qué, de estos días y de anoche.
  const sueno = en.deuda === 'sinDeuda' || en.deuda === 'baja' ? en.deuda : 'soloAnoche';
  const como = en.comida?.como;
  const comida = como === 'deSobra' && d.ascent ? 'deSobraEntrena' : como === 'deSobra' || como === 'llegaste' ? como : 'alcanza';
  const razones = { comida: t(`inicio.energia.razon.comida.${comida}`), sueno: t(`inicio.energia.razon.sueno.${sueno}`), hora };
  if (momento === 'dia') return t(en.entrenaHoy ? 'inicio.energia.texto.altaEntrena' : 'inicio.energia.texto.alta', razones);
  return t(`inicio.energia.momento.${momento}.alta`, razones);
}

/** Cada parte, explicada en «Más» (lo pediste el 17/11): con qué números, qué significa, qué conviene y qué mira Moss. */
type Bloque = {
  k: 'sueno' | 'hoy' | 'estosDias' | 'musculos' | 'hora';
  /** Cómo está, para la palabra y el color; lo que no se juzga, null. */
  parte: Parte | null;
  numeros: string | null;
  significa: string | null;
  conviene: string[];
  /** Con la comida baja, cuándo hablarlo con alguien (el consenso del COI sobre REDs, 2023). */
  aviso?: string;
  mira: string | null;
};

/** Sin Ascent, la comida de estos días va contra tu meta, sin nombrar el gimnasio; con Ascent, lo de entrenar y los músculos. */
function explicacion(d: DatosDeEnergia, conNumeros: boolean): Bloque[] {
  const en = d.dia!;
  const noche = d.noche;
  const redondo = (x: number) => numero(Math.round(x / 10) * 10);
  const bloques: Bloque[] = [];

  const s = en.sueno;
  const conSueno = d.dormido !== null || d.deuda !== null;
  const sesion = en.sesion ? horaDeReloj(en.sesion.inicio) : '';
  const deSueno: string[] = [];
  // Con la noche corta, sin ir al fallo (Craven 2022; Knowles 2022): lo mismo que dice Ascent.
  if (s?.parte === 'baja' && en.entrenaHoy && en.momento !== 'despuesDeEntrenar' && en.momento !== 'noche') deSueno.push(t('inicio.energia.consejo.sinFallo'));
  if (s && !noche && s.parte === 'bien') deSueno.push(t('inicio.energia.explica.sueno.seguirSinHora'));
  if (s && noche) deSueno.push(s.parte === 'bien' ? t('inicio.energia.explica.sueno.seguir', noche) : t(s.como === 'deuda' ? 'inicio.energia.consejo.dormirDeuda' : 'inicio.energia.consejo.dormir', noche));
  bloques.push({
    k: 'sueno',
    parte: s?.parte ?? null,
    numeros: !conSueno ? t('inicio.energia.explica.sueno.sinDatos') : [
      d.dormido !== null ? t('inicio.energia.explica.sueno.anoche', { dormido: duracion(d.dormido), necesidad: duracion(d.necesidad) }) : t('inicio.energia.explica.sueno.sinAnoche'),
      d.deuda === null || !en.deuda ? '' : d.deuda === 0 ? t('inicio.energia.explica.sueno.sinDeuda') : t('inicio.energia.explica.sueno.deuda', { deuda: duracion(d.deuda), juicio: t(`inicio.energia.juicioDeuda.${en.deuda}`) }),
    ].filter(Boolean).join(' '),
    significa: s ? t(`inicio.energia.explica.sueno.como.${s.como}`, { corta: duracion(NOCHE_CORTA), muyCorta: duracion(NOCHE_MUY_CORTA), deudaMedia: duracion(TRAMOS_DE_LA_DEUDA.media) }) : null,
    conviene: deSueno,
    mira: t('inicio.energia.explica.sueno.mira'),
  });

  const h = en.hoy;
  if (h) {
    // Temprano, lo de hoy no se juzga: todavía no es hora.
    if (h.como === 'temprano') bloques.push({ k: 'hoy', parte: null, numeros: t('inicio.energia.explica.hoy.temprano'), significa: null, conviene: [], mira: t('inicio.energia.explica.hoy.mira') });
    else {
      const deHoy: string[] = [];
      if (h.como === 'sinComerParaEntrenar') deHoy.push(t('inicio.energia.consejo.comerAntesYa', { hora: sesion }));
      else deHoy.push(t(h.como === 'alDia' ? 'inicio.energia.explica.hoy.conviene.alDia' : 'inicio.energia.explica.hoy.conviene.atrasado'));
      if (en.comerAntes && en.sesion && h.como !== 'sinComerParaEntrenar') deHoy.push(t('inicio.energia.consejo.comerAntes', { hora: horaDeReloj(en.sesion.inicio - 60), sesion }));
      if (en.comerDespues) deHoy.push(t('inicio.energia.consejo.comerDespues'));
      bloques.push({
        k: 'hoy',
        parte: h.parte,
        numeros: conNumeros ? t('inicio.energia.explica.hoy.numeros', { comido: redondo(h.comido), esperado: redondo(h.esperado) }) : t(`inicio.energia.explica.hoy.sinNumeros.${h.como}`),
        significa: h.como !== 'atrasado' ? t(`inicio.energia.explica.hoy.como.${h.como}`)
          : conNumeros ? t('inicio.energia.explica.hoy.como.atrasado', { kcal: redondo(h.falta) }) : t('inicio.energia.explica.hoy.como.atrasadoSinNumeros'),
        conviene: deHoy,
        mira: t('inicio.energia.explica.hoy.mira'),
      });
    }
  }

  const c = en.deEstosDias;
  const p = en.comida;
  const entrena = d.ascent ? 'Entrena' : '';
  bloques.push({
    k: 'estosDias',
    parte: p?.parte ?? null,
    numeros: !c || c.kcal === null ? t('inicio.energia.explica.estosDias.sinDatos', { minimo: DIAS_ANOTADOS })
      : !conNumeros ? t(`inicio.energia.explica.estosDias.sinNumeros${entrena}`)
        // Sin lo de entrenar de estos días, sin «gastaste unas 0 entrenando».
        : t(`inicio.energia.explica.estosDias.${c.meta ? 'numeros' : 'numerosSinMeta'}${c.entreno ? entrena : ''}`, { kcal: redondo(c.kcal), meta: c.meta ? redondo(c.meta) : '', entreno: redondo(c.entreno ?? 0) }),
    significa: p ? t(`inicio.energia.explica.estosDias.como.${p.como}`, { pct: Math.round(LLEGASTE * 100) }) : null,
    conviene: !p ? [] : [t(p.parte === 'baja' ? `inicio.energia.consejo.comerMas${entrena}` : p.como === 'debajo' ? 'inicio.energia.explica.estosDias.conviene.debajo' : 'inicio.energia.explica.estosDias.conviene.bien')],
    aviso: p?.parte === 'baja' ? t(`inicio.energia.consejo.medico${entrena}`) : undefined,
    mira: t('inicio.energia.explica.estosDias.mira', { dias: DIAS_DE_ENERGIA }),
  });

  // Con Ascent, el titular de hoy de su sección, tal cual.
  if (d.ascent && en.musculos) bloques.push({ k: 'musculos', parte: en.musculos === 'cargados' ? 'justa' : 'bien', numeros: `${d.ascent.titulo}.`, significa: d.ascent.texto, conviene: [], mira: null });

  // La hora: lo del tramo de la curva en que estás, con sus horas (al despertar, cuándo llega el mejor momento).
  const tramo = (que: TramoDeLaCurva) => en.curva?.tramos.find((x) => x.que === que);
  const deLaHora: string[] = [];
  for (const n of en.notas) {
    if (n === 'bajarElRitmo' && d.cama !== null && d.ahora >= d.cama) {
      deLaHora.push(t('inicio.energia.consejo.aLaCama'));
      continue;
    }
    if (n === 'bajarElRitmo' && !noche) continue;
    const x = tramo(n === 'inercia' ? 'pico' : n);
    deLaHora.push(t(`inicio.energia.consejo.${n}`, { hora: noche?.hora ?? '', despertar: noche?.despertar ?? '', cama: noche?.cama ?? '', desde: x ? horaDeReloj(x.desde) : '', hasta: x ? horaDeReloj(x.hasta) : '' }));
  }
  if (en.curva || deLaHora.length) bloques.push({ k: 'hora', parte: null, numeros: null, significa: null, conviene: deLaHora, mira: en.curva ? t('inicio.energia.explica.hora.curva') : null });
  return bloques;
}

// ------------------------------------------------------------ las piezas
/** La batería: una raya por nivel, con el color del estado. */
export function Bateria({ estado, chica }: { estado: EstadoDelBoton; chica?: boolean }) {
  const n = { baja: 1, suficiente: 2, alta: 3, sinDatos: 0 }[estado];
  const k = chica ? 26 / 40 : 1;
  const color = COLOR_DE_ENERGIA[estado].color;
  return (
    <View style={{ width: 40 * k, height: 24 * k, flexDirection: 'row', alignItems: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[st.bateria, { width: 32 * k, height: 20 * k, borderRadius: 4.6 * k, paddingHorizontal: 2.6 * k, gap: 1.8 * k }]}>
        {[0, 1, 2].map((i) => <View key={i} style={{ flex: 1, height: 12 * k, borderRadius: 1.8 * k, backgroundColor: i < n ? color : 'rgba(239, 230, 207, 0.08)' }} />)}
      </View>
      <View style={[st.bateriaPunta, { width: 2 * k, height: 6.6 * k }]} />
    </View>
  );
}

const ICONO_DE_PARTE = { sueno: 'moon.zzz', comida: 'fork.knife', hoy: 'fork.knife', estosDias: 'fork.knife', musculos: 'dumbbell', hora: 'clock' } as const;
type Clase = Parte | 'sin';
const colorDelIcono = (c: Clase) => (c === 'bien' ? colores.oro : c === 'baja' ? '#f2b9a2' : 'rgba(239, 230, 207, 0.75)');
const peor = (a: Clase, b: Clase): Clase => (['baja', 'justa', 'bien', 'sin'] as const).find((x) => x === a || x === b)!;
/** Los espacios de adentro no cortan: «Hoy: vas bien» pasa entero al otro renglón. */
const junto = (x: string) => x.replace(/ /g, ' ');

/**
 * Las partes, de un vistazo (17/11): el sueño, que dice si está bien o mal y por qué, y la comida en una sola
 * fila, con hoy y estos días («Hoy: vas bien · Estos días: por debajo»). Con Ascent, los músculos. Solo lo bajo
 * lleva color.
 */
export function PartesDeEnergia({ datos }: { datos: DatosDeEnergia }) {
  const en = datos.dia;
  if (!en) return null;
  const s = en.sueno;
  const sueno = !s ? t('inicio.energia.como.sueno.sinDatos')
    : s.como === 'bien' ? t('inicio.energia.juicio.bien')
      : `${t(`inicio.energia.juicio.${s.parte}`)}: ${t(`inicio.energia.como.sueno.${s.como}`)}`;
  // Temprano, lo de hoy no se juzga: va sin color.
  const deHoy: Clase | null = !en.hoy ? null : en.hoy.como === 'temprano' ? 'sin' : en.hoy.parte;
  const deEstosDias: Clase = en.comida?.parte ?? 'sin';
  const hoy = en.hoy ? t(`inicio.energia.como.hoy.${en.hoy.como}`) : null;
  const estosDias = t(`inicio.energia.como.comida.${en.comida?.como ?? 'sinDatos'}`);
  const deSueno: Clase = s?.parte ?? 'sin';
  const deComida = deHoy ? peor(deHoy, deEstosDias) : deEstosDias;
  const deMusculos: Clase | null = en.musculos ? (en.musculos === 'cargados' ? 'justa' : 'bien') : null;
  const musculos = en.musculos ? t(`inicio.energia.como.musculos.${datos.comoMusculos ?? en.musculos}`) : '';
  return (
    <View style={st.partes}>
      <Aparece style={st.parte}>
        <View style={st.parteFila} accessible accessibilityLabel={`${t('inicio.energia.partes.sueno')}: ${sueno}`}>
          <View style={[st.parteIco, deSueno === 'bien' && st.parteIcoBien, deSueno === 'baja' && st.parteIcoBaja]}>
            <Icono nombre={ICONO_DE_PARTE.sueno} tam={14} color={colorDelIcono(deSueno)} />
          </View>
          <View style={st.parteTextos}>
            <Text style={st.parteNombre} maxFontSizeMultiplier={1.3}>{t('inicio.energia.partes.sueno')}</Text>
            <Text style={[st.parteComo, st[`parteComo_${deSueno}`]]} maxFontSizeMultiplier={1.3}>{sueno}</Text>
          </View>
        </View>
      </Aparece>
      <Aparece demora={60} style={[st.parte, st.parteSiguiente]}>
        <View style={st.parteFila} accessible accessibilityLabel={`${t('inicio.energia.partes.comida')}. ${hoy ? `${t('inicio.energia.hoy')}: ${hoy}. ` : ''}${t('inicio.energia.estosDias')}: ${estosDias}`}>
          <View style={[st.parteIco, deComida === 'bien' && st.parteIcoBien, deComida === 'baja' && st.parteIcoBaja]}>
            <Icono nombre={ICONO_DE_PARTE.comida} tam={14} color={colorDelIcono(deComida)} />
          </View>
          <View style={st.parteTextos}>
            <Text style={st.parteNombre} maxFontSizeMultiplier={1.3}>{t('inicio.energia.partes.comida')}</Text>
            <Text style={st.parteComo} maxFontSizeMultiplier={1.3}>
              {hoy && deHoy && (
                <>
                  <Text style={st.parteDe}>{junto(`${t('inicio.energia.hoy')}: `)}</Text>
                  <Text style={st[`parteComo_${deHoy}`]}>{junto(hoy)}</Text>
                  <Text style={st.parteDe}>{' · '}</Text>
                </>
              )}
              <Text style={st.parteDe}>{junto(`${t('inicio.energia.estosDias')}: `)}</Text>
              <Text style={st[`parteComo_${deEstosDias}`]}>{junto(estosDias)}</Text>
            </Text>
          </View>
        </View>
      </Aparece>
      {deMusculos && (
        <Aparece demora={120} style={[st.parte, st.parteSiguiente]}>
          <View style={st.parteFila} accessible accessibilityLabel={`${t('inicio.energia.partes.musculos')}: ${musculos}`}>
            <View style={[st.parteIco, deMusculos === 'bien' && st.parteIcoBien]}>
              <Icono nombre={ICONO_DE_PARTE.musculos} tam={14} color={colorDelIcono(deMusculos)} />
            </View>
            <View style={st.parteTextos}>
              <Text style={st.parteNombre} maxFontSizeMultiplier={1.3}>{t('inicio.energia.partes.musculos')}</Text>
              <Text style={[st.parteComo, st[`parteComo_${deMusculos}`]]} maxFontSizeMultiplier={1.3}>{musculos}</Text>
            </View>
          </View>
        </Aparece>
      )}
    </View>
  );
}

const ALTO_CURVA = 56;
const BASE_CURVA = 50;

/** Centrado en `x`: el texto, sin medirlo. */
const EnX = ({ x, children, arriba, abajo }: { x: number; children: ReactNode; arriba?: number; abajo?: number }) => (
  <View style={[st.enX, { left: x }, arriba !== undefined && { top: arriba }, abajo !== undefined && { bottom: abajo }]} pointerEvents="none">{children}</View>
);

/**
 * La tira de tu día: de despertarte a la cama de esta noche, con la curva de tu energía arriba (el mejor momento,
 * el bajón y el otro pico), cada comida (anotada, pasada sin anotar o por venir) y ahora. Se lee sin leer.
 */
export function TiraDelDia({ datos, ancho }: { datos: DatosDeEnergia; ancho: number }) {
  const reducido = useReducedMotion();
  const D = datos.despertar;
  const C = datos.cama;
  if (D === null || C === null || C <= D || ancho <= 0) return null;
  const estado = estadoDe(datos);
  const color = COLOR_DE_ENERGIA[estado];
  const fr = (m: number) => Math.min(1, Math.max(0, (m - D) / (C - D)));
  const x = (m: number) => fr(m) * ancho;
  const curva = datos.dia?.curva ?? null;
  const ahora = fr(datos.ahora);
  let puntos: { x: number; y: number }[] = [];
  let punto: { x: number; y: number } | null = null;
  if (curva) {
    const D0 = curva.puntos[0].t;
    const C0 = curva.puntos[curva.puntos.length - 1].t;
    const Y = (n: number) => BASE_CURVA - n * (BASE_CURVA - 4);
    puntos = curva.puntos.map((p) => ({ x: ((p.t - D0) / Math.max(1, C0 - D0)) * ancho, y: Y(p.nivel) }));
    const cerca = curva.puntos.reduce((a, p) => (Math.abs(p.t - datos.ahora) < Math.abs(a.t - datos.ahora) ? p : a), curva.puntos[0]);
    punto = { x: x(datos.ahora), y: Y(cerca.nivel) };
  }
  return (
    <View style={st.dia} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {curva && (
        <View style={{ height: ALTO_CURVA, marginBottom: 4 }}>
          <Curva ancho={ancho} alto={ALTO_CURVA} base={BASE_CURVA} puntos={puntos} rgb={color.rgb} alfa={color.alfa} animar={!reducido} />
          {(['pico', 'bajon', 'segundoPico'] as const).map((que) => {
            const tr = curva.tramos.find((z) => z.que === que);
            if (!tr) return null;
            return (
              <EnX key={que} x={x((tr.desde + tr.hasta) / 2)} arriba={que === 'bajon' ? undefined : -2} abajo={que === 'bajon' ? 2 : undefined}>
                <Text style={[st.tramo, datos.dia?.tramo === que && st.tramoActual]} maxFontSizeMultiplier={1.2}>{t(`inicio.energia.curva.${que}`)}</Text>
              </EnX>
            );
          })}
          {punto && (
            <Animated.View entering={FadeIn.duration(400).delay(reducido ? 0 : 1100).reduceMotion(ReduceMotion.Never)} style={[st.punto, { left: punto.x - 4.5, top: punto.y - 4.5, shadowColor: color.color }]} />
          )}
        </View>
      )}
      <View style={st.pista}>
        <View style={st.pistaLinea} />
        <View style={st.hechoRecorte}>
          <Relleno fraccion={ahora} style={st.hecho} />
        </View>
        {/* La sesión, solo con Ascent. */}
        {datos.ascent && datos.dia?.sesion && (
          <View style={[st.sesion, datos.ahora >= datos.dia.sesion.inicio + datos.dia.sesion.minutos && st.sesionHecha, { left: x(datos.dia.sesion.inicio), width: Math.max(4, x(datos.dia.sesion.inicio + datos.dia.sesion.minutos) - x(datos.dia.sesion.inicio)) }]} />
        )}
        {datos.comidas.map((c) => {
          const clase = c.anotada ? 'anotada' : datos.ahora >= c.hora + DESPUES_DE_SU_HORA ? 'vencida' : 'futura';
          return <View key={c.comida} style={[st.comida, { left: x(c.hora) - 5 }, clase === 'anotada' ? st.comidaAnotada : clase === 'vencida' ? st.comidaVencida : st.comidaFutura]} />;
        })}
        <View style={[st.ahora, { left: x(datos.ahora) - 1, backgroundColor: color.color, shadowColor: color.color }]} />
      </View>
      <View style={st.horas}>
        {/* Cerca de los bordes, la hora de ahora va al costado de la rayita, hacia adentro, y la del borde se esconde si no entran las dos. */}
        {ahora >= 0.1 && <Text style={[st.hora, { left: 0 }]}>{horaDeReloj(D)}</Text>}
        {ahora <= 0.9 && <Text style={[st.hora, { right: 0 }]}>{horaDeReloj(C)}</Text>}
        {ahora < 0.14 ? (
          <Text style={[st.hora, st.horaAhora, { left: x(datos.ahora) + 6 }]}>{horaDeReloj(datos.ahora)}</Text>
        ) : ahora > 0.86 ? (
          <Text style={[st.hora, st.horaAhora, { right: ancho - x(datos.ahora) + 6 }]}>{horaDeReloj(datos.ahora)}</Text>
        ) : (
          <EnX x={x(datos.ahora)} arriba={0}>
            <Text style={[st.horaTexto, st.horaAhora]}>{horaDeReloj(datos.ahora)}</Text>
          </EnX>
        )}
      </View>
    </View>
  );
}

// ------------------------------------------------------------ la tarjeta
/** La tarjeta entera. `ancho` es el de adentro; `resaltar` la hace brillar un momento (al llegar desde Inicio). */
export function TarjetaDeEnergia({ datos, ancho, resaltar = 0 }: { datos: DatosDeEnergia; ancho: number; resaltar?: number }) {
  const numeros = useNumeros();
  const perfil = useEstado().perfil;
  const conNumeros = numeros && !perfil?.sinDeficit;
  const reducido = useReducedMotion();
  const [estaPlegada, setPlegada] = useState(plegada);
  const [mas, setMas] = useState(masAbierto);
  // Al llegar desde Inicio, «Más» se abre aunque la tarjeta ya estuviera armada.
  const [vistoResaltar, setVistoResaltar] = useState(resaltar);
  if (resaltar !== vistoResaltar) {
    setVistoResaltar(resaltar);
    setMas(masAbierto);
    setPlegada(plegada);
  }
  const brillo = useSharedValue(0);
  useEffect(() => {
    if (!resaltar || reducido) return;
    brillo.set(withDelay(450, withSequence(withTiming(1, { duration: 480 }), withTiming(0, { duration: 1100 }))));
  }, [resaltar, reducido, brillo]);
  const estiloBrillo = useAnimatedStyle(() => ({ opacity: brillo.get() }));
  const flecha = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(estaPlegada ? '0deg' : '180deg', { duration: reducido ? 0 : 300 }) }] }));
  const estado = estadoDe(datos);
  const en = datos.dia;
  const color = COLOR_DE_ENERGIA[estado];
  const plegar = () => {
    plegada = !estaPlegada;
    setPlegada(plegada);
  };
  const alternarMas = () => {
    masAbierto = !mas;
    setMas(masAbierto);
  };
  return (
    <Animated.View layout={ACOMODA} style={[st.carta, estado === 'baja' && st.cartaBaja]}>
      <Animated.View style={[StyleSheet.absoluteFill, st.brillo, { borderColor: color.color, shadowColor: color.color }, estiloBrillo]} pointerEvents="none" />
      <View style={st.cab}>
        <View style={st.ico}><Bateria estado={estado} /></View>
        <View style={st.titulos} accessible accessibilityRole="header">
          <View style={st.etiquetaFila}>
            {/* Con Ascent, su marca chica (la del ícono de Ascent) y «· con Ascent»: es lo que hace Moss con el vínculo. */}
            {datos.ascent && <MarcaChica tam={13} />}
            <Text style={st.etiqueta} maxFontSizeMultiplier={1.4}>{t('inicio.energia.etiqueta', { cuando: t(`inicio.energia.cuando.${cuandoEs(datos)}`) })}</Text>
            {datos.ascent && <Text style={st.etiqueta} maxFontSizeMultiplier={1.4}>{`· ${t('inicio.energia.conAscent')}`}</Text>}
          </View>
          <Text style={[st.titulo, estado === 'baja' && st.tituloBaja, estado === 'alta' && st.tituloAlta]}>{t(`inicio.energia.titulo.${estado}`)}</Text>
        </View>
        <Pressable
          onPress={plegar}
          style={({ pressed }) => [st.plegar, pressed && st.apretado]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t(estaPlegada ? 'inicio.energia.desplegar' : 'inicio.energia.plegar')}
          accessibilityState={{ expanded: !estaPlegada }}
        >
          <Animated.View style={flecha}><Icono nombre="chevron.down" tam={14} color="rgba(239, 230, 207, 0.7)" peso="semibold" /></Animated.View>
        </Pressable>
      </View>
      {!estaPlegada && (
        <Aparece>
          <Text style={st.texto}>{fraseDeEnergia(datos)}</Text>
          {en && (
            <>
              <TiraDelDia datos={datos} ancho={ancho} />
              <PartesDeEnergia datos={datos} />
              <Pressable onPress={alternarMas} style={({ pressed }) => [st.mas, pressed && st.apretado]} accessibilityRole="button" accessibilityState={{ expanded: mas }}>
                <Text style={st.masSigno}>{mas ? '−' : '+'}</Text>
                <Text style={st.masTexto}>{t(mas ? 'inicio.energia.menos' : 'inicio.energia.mas')}</Text>
              </Pressable>
              {mas && (
                <Aparece style={st.porque}>
                  {explicacion(datos, conNumeros).map((b, i) => {
                    const clase: Clase = b.parte ?? 'sin';
                    return (
                      <Aparece key={b.k} demora={50 * i} style={[st.bloque, i > 0 && st.bloqueSiguiente]}>
                        <View style={st.bloqueCab} accessible accessibilityRole="header">
                          <View style={[st.detalleIco, clase === 'baja' && st.parteIcoBaja]}>
                            <Icono nombre={ICONO_DE_PARTE[b.k]} tam={12} color={colorDelIcono(clase)} />
                          </View>
                          <Text style={st.h4}>{t(`inicio.energia.explica.${b.k}.titulo`)}</Text>
                          {b.parte && <Text style={[st.bloqueJuicio, st[`parteComo_${b.parte}`]]}>{t(`inicio.energia.juicio.${b.parte}`)}</Text>}
                        </View>
                        {b.numeros && <Text style={st.bloqueNumeros}>{b.numeros}</Text>}
                        {b.significa && <Text style={st.bloqueTexto}>{b.significa}</Text>}
                        {b.conviene.map((x) => (
                          <View key={x} style={st.consejo}>
                            <View style={[st.consejoPunto, { backgroundColor: color.color }]} />
                            <Text style={st.consejoTexto}>{x}</Text>
                          </View>
                        ))}
                        {b.aviso && <Text style={st.chico}>{b.aviso}</Text>}
                        {b.mira && <Text style={st.chico}>{b.mira}</Text>}
                      </Aparece>
                    );
                  })}
                  <Text style={[st.chico, st.estimacion]}>{t('inicio.energia.estimacion')}</Text>
                </Aparece>
              )}
            </>
          )}
        </Aparece>
      )}
    </Animated.View>
  );
}

const TENUE = 'rgba(239, 230, 207, 0.55)';
const st = StyleSheet.create({
  carta: { marginTop: 12, borderRadius: 20, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 15, backgroundColor: 'rgba(12, 20, 46, 0.6)', borderWidth: 1, borderColor: 'rgba(150, 178, 240, 0.11)' },
  cartaBaja: { borderColor: 'rgba(203, 133, 105, 0.5)', backgroundColor: 'rgba(30, 22, 30, 0.78)' },
  brillo: { borderRadius: 20, borderWidth: 2, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  cab: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ico: { width: 44, height: 30, alignItems: 'center', justifyContent: 'center' },
  bateria: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.2, borderColor: 'rgba(239, 230, 207, 0.5)' },
  bateriaPunta: { marginLeft: 1.5, borderTopRightRadius: 1, borderBottomRightRadius: 1, backgroundColor: 'rgba(239, 230, 207, 0.5)' },
  titulos: { flex: 1, gap: 4 },
  etiqueta: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: TENUE },
  etiquetaFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 2 },
  titulo: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 21, lineHeight: 24, color: colores.pergamino },
  tituloBaja: { fontSize: 27, lineHeight: 30, color: '#f2b9a2' },
  tituloAlta: { color: colores.oroClaro },
  plegar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', alignItems: 'center', justifyContent: 'center' },
  apretado: { opacity: 0.6 },
  texto: { marginTop: 12, fontFamily: letras.textoLiviano, fontSize: 14.5, lineHeight: 21, color: 'rgba(239, 230, 207, 0.88)' },
  dia: { marginTop: 14 },
  enX: { position: 'absolute', width: 0, alignItems: 'center' },
  tramo: { width: 120, textAlign: 'center', fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 0.4, color: 'rgba(239, 230, 207, 0.5)' },
  tramoActual: { color: colores.pergamino },
  punto: { position: 'absolute', width: 9, height: 9, borderRadius: 4.5, backgroundColor: colores.cifra, borderWidth: 0, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  pista: { height: 22 },
  pistaLinea: { position: 'absolute', left: 0, right: 0, top: 10, height: 2, borderRadius: 1, backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  hechoRecorte: { position: 'absolute', left: 0, right: 0, top: 10, height: 2, borderRadius: 1, overflow: 'hidden' },
  hecho: { height: 2, backgroundColor: 'rgba(239, 230, 207, 0.45)' },
  comida: { position: 'absolute', top: 6, width: 10, height: 10, borderRadius: 5 },
  sesion: { position: 'absolute', top: 5, height: 12, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.45)', backgroundColor: 'rgba(232, 196, 106, 0.14)' },
  sesionHecha: { backgroundColor: 'rgba(232, 196, 106, 0.4)' },
  comidaAnotada: { backgroundColor: colores.cifra },
  comidaVencida: { borderWidth: 1.5, borderColor: '#cb8569', backgroundColor: '#0b0f1f' },
  comidaFutura: { borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.35)', backgroundColor: '#0b0f1f' },
  ahora: { position: 'absolute', top: 0, width: 2, height: 22, borderRadius: 1, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  horas: { height: 14, marginTop: 5 },
  hora: { position: 'absolute', top: 0, fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  horaTexto: { width: 60, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, fontVariant: ['tabular-nums'] },
  horaAhora: { color: colores.pergamino },
  partes: { marginTop: 14, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(239, 230, 207, 0.045)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  parte: { paddingVertical: 10 },
  parteSiguiente: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  parteFila: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  parteIco: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  parteIcoBien: { backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  parteIcoBaja: { backgroundColor: 'rgba(203, 133, 105, 0.24)' },
  parteTextos: { flex: 1, minWidth: 0, gap: 4 },
  parteNombre: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  parteComo: { fontFamily: letras.textoMedio, fontSize: 13, lineHeight: 17, color: colores.pergamino },
  parteDe: { fontFamily: letras.texto, color: 'rgba(239, 230, 207, 0.55)' },
  parteComo_bien: { color: colores.pergamino },
  parteComo_justa: { color: 'rgba(239, 230, 207, 0.72)' },
  parteComo_baja: { color: '#f2b9a2' },
  parteComo_sin: { color: 'rgba(239, 230, 207, 0.4)' },
  mas: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13, paddingVertical: 7, paddingLeft: 11, paddingRight: 13, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)' },
  masSigno: { fontFamily: letras.texto, fontSize: 15, lineHeight: 16, color: 'rgba(239, 230, 207, 0.86)' },
  masTexto: { fontFamily: letras.textoMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.86)' },
  porque: { marginTop: 14 },
  bloque: { gap: 7, paddingBottom: 14 },
  bloqueSiguiente: { paddingTop: 14, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  bloqueCab: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  h4: { flex: 1, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: TENUE },
  bloqueJuicio: { fontFamily: letras.textoMedio, fontSize: 12.5 },
  bloqueNumeros: { fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  bloqueTexto: { fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.86)' },
  consejo: { flexDirection: 'row', gap: 10 },
  consejoPunto: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginLeft: 2 },
  consejoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.9)' },
  chico: { fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: TENUE },
  estimacion: { paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  detalleIco: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
});
