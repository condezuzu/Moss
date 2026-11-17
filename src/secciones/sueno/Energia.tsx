// Tu energía, la de la galería (galeria/src/inicio.js, tarjetaDeEnergia; spec/entreno.md 5.13): la de ahora,
// según la hora, con la regla de src/dominio/energia.ts. Arriba, la batería, «Tu energía · esta tarde», cómo está
// y una frase; la curva del día sobre la tira de tu día (las comidas y ahora) y cada parte con su estado. «Más»
// abre qué te conviene ahora y de dónde sale; se pliega en vez de «No mostrar más». Sin Ascent, es la de tu día:
// sin la sesión, los músculos ni lo de no llegar al fallo.
// Vive en Sueño, debajo de la noche. Inicio usa lo mismo para su botón: useEnergia, Bateria, fraseDeEnergia,
// porQueDeLaEnergia, TiraDelDia, PartesDeEnergia e irAEnergia (que lleva a la tarjeta).

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withTiming } from 'react-native-reanimated';

import type { EstadoDeEnergia, TramoDeLaCurva } from '@/dominio/energia';
import { DESPUES_DE_SU_HORA } from '@/dominio/energia';
import { horaDeReloj } from '@/dominio/avisos';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Relleno } from '../animados';
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

/** La hora cambia lo que se dice: se rehace cada cinco minutos. */
function useAhora(ms = 5 * 60_000): Date {
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
  return useMemo(() => energiaDeHoy(e, s, ahora), [e, s, ahora]);
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
  const comida = como === 'deSobra' || como === 'llegaste' ? como : 'alcanza';
  const razones = { comida: t(`inicio.energia.razon.comida.${comida}`), sueno: t(`inicio.energia.razon.sueno.${sueno}`), hora };
  if (momento === 'dia') return t(en.entrenaHoy ? 'inicio.energia.texto.altaEntrena' : 'inicio.energia.texto.alta', razones);
  return t(`inicio.energia.momento.${momento}.alta`, razones);
}

/** Para el botón de Inicio: lo que la baja o la frena; con todo bien, «Todo a favor». */
export function porQueDeLaEnergia(d: DatosDeEnergia): 'sueno' | 'comida' | 'hoy' | 'musculos' | 'todo' | 'sinDatos' | null {
  if (!d.dia) return 'sinDatos';
  return d.dia.estado === 'alta' ? 'todo' : (d.dia.limita[0] ?? null);
}

/** Qué te conviene ahora: primero lo que la baja, después lo que la frena y lo de la hora; si no, seguir así. */
function consejos(d: DatosDeEnergia, conNumeros: boolean): string[] {
  const en = d.dia!;
  const lista: string[] = [];
  const noche = d.noche;
  if (noche && en.sueno && (en.sueno.parte === 'baja' || en.sueno.como === 'algoCorta')) lista.push(t('inicio.energia.consejo.dormir', noche));
  else if (noche && en.sueno?.como === 'deuda') lista.push(t('inicio.energia.consejo.dormirDeuda', noche));
  if (en.comida?.parte === 'baja') lista.push(t('inicio.energia.consejo.comerMas'));
  if (en.hoy?.como === 'atrasado') lista.push(conNumeros ? t('inicio.energia.consejo.atrasado', { kcal: numero(Math.round(en.hoy.falta / 10) * 10) }) : t('inicio.energia.consejo.atrasadoSinNumeros'));
  // Según el tramo de la curva, con sus horas: al despertar, cuándo llega el mejor momento.
  const tramo = (que: TramoDeLaCurva) => en.curva?.tramos.find((x) => x.que === que);
  for (const n of en.notas) {
    if (n === 'bajarElRitmo' && d.cama !== null && d.ahora >= d.cama) {
      lista.push(t('inicio.energia.consejo.aLaCama'));
      continue;
    }
    if (n === 'bajarElRitmo' && !noche) continue;
    const x = tramo(n === 'inercia' ? 'pico' : n);
    lista.push(t(`inicio.energia.consejo.${n}`, { hora: noche?.hora ?? '', despertar: noche?.despertar ?? '', cama: noche?.cama ?? '', desde: x ? horaDeReloj(x.desde) : '', hasta: x ? horaDeReloj(x.hasta) : '' }));
  }
  if (!lista.length) lista.push(t('inicio.energia.consejo.seguir'));
  return lista;
}

type Fila = { k: 'sueno' | 'comida' | 'hoy'; parte: string | null; texto: string };
/** De dónde sale: una línea por parte, con sus números si se ven. Sin Ascent, estos días contra tu meta, sin nombrar el gimnasio. */
function detalles(d: DatosDeEnergia, conNumeros: boolean): Fila[] {
  const en = d.dia!;
  const redondo = (x: number) => numero(Math.round(x / 10) * 10);
  const filas: Fila[] = [];
  filas.push({
    k: 'sueno', parte: en.sueno?.parte ?? null,
    texto: d.dormido !== null ? t('inicio.energia.detalle.sueno', { dormido: duracion(d.dormido), deuda: en.deuda ? t(`inicio.energia.juicioDeuda.${en.deuda}`) : '—' }) : t('inicio.energia.detalle.suenoSinDatos'),
  });
  const c = en.deEstosDias;
  filas.push({
    k: 'comida', parte: en.comida?.parte ?? null,
    texto: !c || c.kcal === null ? t('inicio.energia.detalle.comidaSinDatos')
      : !conNumeros ? t('inicio.energia.detalle.comidaSinNumeros')
        : c.meta ? t('inicio.energia.detalle.comida', { kcal: redondo(c.kcal), meta: redondo(c.meta) }) : t('inicio.energia.detalle.comidaSinMeta', { kcal: redondo(c.kcal) }),
  });
  if (en.hoy) {
    filas.push({
      k: 'hoy', parte: en.hoy.como === 'temprano' ? null : en.hoy.parte,
      texto: en.hoy.como === 'temprano' ? t('inicio.energia.detalle.hoyTemprano')
        : conNumeros ? t('inicio.energia.detalle.hoy', { comido: redondo(en.hoy.comido), esperado: redondo(en.hoy.esperado) }) : t('inicio.energia.detalle.hoySinNumeros'),
    });
  }
  return filas;
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

const ICONO_DE_PARTE = { sueno: 'moon.zzz', comida: 'fork.knife', hoy: 'clock' } as const;

/** Las partes, de un vistazo: el ícono, el nombre y cómo está cada una. Solo lo bajo lleva color. */
export function PartesDeEnergia({ datos }: { datos: DatosDeEnergia }) {
  const en = datos.dia;
  if (!en) return null;
  const partes = [['sueno', en.sueno], ['comida', en.comida], ['hoy', en.hoy]] as const;
  return (
    <View style={st.partes}>
      {partes.map(([k, p], i) => {
        // Temprano, lo de hoy no se juzga: va sin color.
        const clase = !p || (k === 'hoy' && p.como === 'temprano') ? 'sin' : p.parte;
        const como = t(`inicio.energia.como.${k}.${(p?.como ?? 'sinDatos') as 'sinDatos'}`);
        return (
          <Aparece key={k} demora={60 * i} style={[st.parte, clase === 'baja' && st.parteBaja]}>
            <View style={[st.parteIco, clase === 'bien' && st.parteIcoBien, clase === 'baja' && st.parteIcoBaja]}>
              <Icono nombre={ICONO_DE_PARTE[k]} tam={14} color={clase === 'bien' ? colores.oro : clase === 'baja' ? '#f2b9a2' : 'rgba(239, 230, 207, 0.75)'} />
            </View>
            <Text style={st.parteNombre} numberOfLines={1} maxFontSizeMultiplier={1.3}>{t(`inicio.energia.partes.${k}`)}</Text>
            <Text style={[st.parteComo, clase === 'justa' && st.parteComoJusta, clase === 'baja' && st.parteComoBaja, clase === 'sin' && st.parteComoSin]} numberOfLines={1} maxFontSizeMultiplier={1.3}>{como}</Text>
          </Aparece>
        );
      })}
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
          <Text style={st.etiqueta} maxFontSizeMultiplier={1.4}>{t('inicio.energia.etiqueta', { cuando: t(`inicio.energia.cuando.${cuandoEs(datos)}`) })}</Text>
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
                  <Text style={st.h4}>{t('inicio.energia.conviene')}</Text>
                  {consejos(datos, conNumeros).map((x) => (
                    <View key={x} style={st.consejo}>
                      <View style={[st.consejoPunto, { backgroundColor: color.color }]} />
                      <Text style={st.consejoTexto}>{x}</Text>
                    </View>
                  ))}
                  {/* Con la comida baja, cuándo hablarlo con alguien (el consenso del COI sobre REDs, 2023). */}
                  {en.comida?.parte === 'baja' && <Text style={st.chico}>{t('inicio.energia.consejo.medico')}</Text>}
                  <Text style={st.h4}>{t('inicio.energia.deQueSaleSinEntreno')}</Text>
                  {detalles(datos, conNumeros).map((f) => (
                    <View key={f.k} style={st.detalle}>
                      <View style={[st.detalleIco, f.parte === 'baja' && st.parteIcoBaja]}>
                        <Icono nombre={ICONO_DE_PARTE[f.k]} tam={12} color={f.parte === 'baja' ? '#f2b9a2' : f.parte === 'bien' ? colores.oro : 'rgba(239, 230, 207, 0.7)'} />
                      </View>
                      <Text style={st.detalleTexto}>{f.texto}</Text>
                    </View>
                  ))}
                  {/* De qué días sale cada parte: el sueño, de anoche y de dos semanas; la comida, de la semana; lo de hoy, de lo anotado. */}
                  <Text style={st.h4}>{t('inicio.energia.deCuando.titulo')}</Text>
                  {(['sueno', 'comida', 'hoy', 'curva'] as const).map((k) => <Text key={k} style={st.cuando}>{t(`inicio.energia.deCuando.${k}`)}</Text>)}
                  <Text style={st.chico}>{t('inicio.energia.estimacion')}</Text>
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
  comidaAnotada: { backgroundColor: colores.cifra },
  comidaVencida: { borderWidth: 1.5, borderColor: '#cb8569', backgroundColor: '#0b0f1f' },
  comidaFutura: { borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.35)', backgroundColor: '#0b0f1f' },
  ahora: { position: 'absolute', top: 0, width: 2, height: 22, borderRadius: 1, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  horas: { height: 14, marginTop: 5 },
  hora: { position: 'absolute', top: 0, fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.45)', fontVariant: ['tabular-nums'] },
  horaTexto: { width: 60, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, fontVariant: ['tabular-nums'] },
  horaAhora: { color: colores.pergamino },
  partes: { flexDirection: 'row', gap: 8, marginTop: 14 },
  parte: { flex: 1, minWidth: 0, alignItems: 'center', gap: 5, paddingTop: 11, paddingHorizontal: 6, paddingBottom: 10, borderRadius: 14, backgroundColor: 'rgba(239, 230, 207, 0.045)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  parteBaja: { backgroundColor: 'rgba(203, 133, 105, 0.13)', borderColor: 'rgba(203, 133, 105, 0.42)' },
  parteIco: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  parteIcoBien: { backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  parteIcoBaja: { backgroundColor: 'rgba(203, 133, 105, 0.24)' },
  parteNombre: { fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.1, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  parteComo: { maxWidth: '100%', fontFamily: letras.textoMedio, fontSize: 13, color: colores.pergamino },
  parteComoJusta: { color: 'rgba(239, 230, 207, 0.72)' },
  parteComoBaja: { color: '#f2b9a2' },
  parteComoSin: { color: 'rgba(239, 230, 207, 0.4)' },
  mas: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 13, paddingVertical: 7, paddingLeft: 11, paddingRight: 13, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.18)' },
  masSigno: { fontFamily: letras.texto, fontSize: 15, lineHeight: 16, color: 'rgba(239, 230, 207, 0.86)' },
  masTexto: { fontFamily: letras.textoMedio, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.86)' },
  porque: { gap: 9, marginTop: 12 },
  h4: { marginTop: 6, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: TENUE },
  consejo: { flexDirection: 'row', gap: 10 },
  consejoPunto: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginLeft: 2 },
  consejoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.9)' },
  chico: { fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: TENUE },
  detalle: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detalleIco: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  detalleTexto: { flex: 1, marginTop: 3, fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 19, color: 'rgba(239, 230, 207, 0.82)' },
  cuando: { fontFamily: letras.textoLiviano, fontSize: 12.5, lineHeight: 18, color: 'rgba(239, 230, 207, 0.78)' },
});
