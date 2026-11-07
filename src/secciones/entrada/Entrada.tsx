// La entrada a la app, la de la galería (galeria/src/entrada.js): la frase de apertura, dos
// diapositivas (con la suscripción prendida, la introducción más larga: la comida, la base, el sueño,
// los dos juntos, los hábitos y lo que cuesta, y al final la pantalla de pago), tus datos (qué guarda
// Moss y el consentimiento para los datos de salud), la cuenta
// (solo con Apple) y el cuestionario que arma la meta inicial de comida, con lo que cuida: mayores de
// 16 (y sin bajar «rápido» antes de los 18), y sin déficit en el embarazo, la lactancia o con una condición médica. La recorre una estrella
// guía (Guia.tsx, con el guion de guion.ts): en la frase y las diapositivas espera abajo y tocarla es
// seguir, así que no se saltean; con la suscripción, «Saltar» lleva a lo que cuesta, que no se saltea.
// Cada pantalla tiene su lugar en el cielo: la cámara sube a medida
// que se avanza. Al final la estrella se va, la cámara baja hasta hoy, se guardan las respuestas (el
// perfil, el peso de hoy y la meta) y aparece Inicio.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { buscarConstelacion } from '@/datos/catalogo';
import { CM_POR_PULGADA, KG_POR_LIBRA } from '@/dominio/cantidades';
import { EDAD_MINIMA, edadDe, MAYORIA_DE_EDAD, metasIniciales, RANGOS_DEL_CUESTIONARIO, RITMOS, ritmoPermitido, type Actividad, type Objetivo, type Ritmo, type Sexo } from '@/dominio/metas';
import { DIA_DEL_AVISO, DIAS_DE_PRUEBA } from '@/dominio/premium';
import { deudaDeSueno, redondearDeuda, ultimasNoches } from '@/dominio/sueno';
import { hayCompras } from '@/lib/premium';
import { abrirPagina } from '@/lib/sitio';
import { haySupabase } from '@/lib/supabase';
import { datosDelCuestionario, haySalud, pedirPermisos } from '@/salud/salud';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { useCuenta } from '../animados';
import { anunciar } from '../anuncio';
import { COLOR_DE_MACRO, Icono, MACROS } from '../comida/comunes';
import { duracion, horaDelDia, numero, sistemaDe, useEstado } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { ejemplo } from '../ejemplo';
import { Hipnograma } from '../graficos/Graficos';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { BotonDePaso } from '../paso';
import { entrarConApple, hayApple, type ErrorDeCuenta } from './cuenta';
import { Guia } from './Guia';
import {
  ALTO_PARA_LO_DICHO, anclas as medirAnclas, barraEn, BASE, esDiapositiva, estado, guionDe, guionDeSalida, INTRO, JUNTOS, LUNA, NOCHE, PALABRAS, reposo,
  type Anclas, type EscenaDeLuna, type Evento, type Guion, type Lugar, type Paso, type Recorrido,
} from './guion';
import { EjemploDeJuntos, ofrecerPremium, usePreciosDeLaEntrada } from '../premium/Premium';
import { Anillos, Casiopea } from './Lienzos';
import { Boton, Deslizador, Opcion } from './piezas';

/** Cada pantalla y dónde queda la cámara: sube a medida que se avanza, como en la galería. */
const PASOS: readonly { id: Paso; camara: number }[] = [
  { id: 'frase', camara: 0 },
  { id: 'habitos', camara: 0.42 },
  { id: 'comida', camara: 0.8 },
  { id: 'datos', camara: 0.98 },
  { id: 'cuenta', camara: 1.08 },
  { id: 'salud', camara: 1.16 },
  { id: 'edad', camara: 1.19 },
  { id: 'sexo', camara: 1.22 },
  { id: 'altura', camara: 1.25 },
  { id: 'peso', camara: 1.28 },
  { id: 'actividad', camara: 1.31 },
  { id: 'cuidado', camara: 1.325 },
  { id: 'objetivo', camara: 1.34 },
  { id: 'resultado', camara: 1.37 },
];
const CUESTIONARIO: readonly Paso[] = ['salud', 'edad', 'sexo', 'altura', 'peso', 'actividad', 'cuidado', 'objetivo'];

/** Con la suscripción, la introducción más larga: lo que Moss hace, los dos juntos y lo que cuesta. Cada cámara, como en la galería. */
const PASOS_CON_PAGO: readonly { id: Paso; camara: number }[] = [
  { id: 'frase', camara: 0 },
  { id: 'comida', camara: 0.2 },
  { id: 'base', camara: 0.36 },
  { id: 'sueno', camara: 0.52 },
  { id: 'juntos', camara: 0.66 },
  { id: 'habitos', camara: 0.8 },
  { id: 'precio', camara: 0.92 },
  ...PASOS.slice(PASOS.findIndex((p) => p.id === 'datos')),
];
/** Las pantallas de la introducción, con su constelación chica arriba. */
const INTRODUCCION: readonly Paso[] = ['comida', 'base', 'sueno', 'juntos', 'habitos', 'precio'];
// Lo del ejemplo, de la base: 2 huevos (122 g), 1 rebanada (25 g) y 1 taza (252 g).
const KCAL_DEL_DICHO = [234, 73, 101];
// kcal y gramos de proteína, carbohidratos y grasas: ½ aguacate, 1 milanesa y 1 cucharada de dulce de leche.
const DE_LA_BASE: readonly [number, number, number, number][] = [[160, 2, 8.5, 14.7], [490, 31.8, 12.7, 33.7], [60, 1.3, 10.5, 1.4]];

/** Una build sin Supabase no tiene cuenta: esa pantalla no se muestra, y Moss guarda todo en el teléfono. */
const pasosDeEstaVersion = () => {
  const pasos = hayCompras() ? PASOS_CON_PAGO : PASOS;
  return haySupabase() ? pasos : pasos.filter((p) => p.id !== 'cuenta');
};

/** Embarazo o lactancia, una condición médica o nada: de eso solo se guarda si va sin déficit. */
type Caso = 'nada' | 'embarazo' | 'condicion';
type Respuestas = { edad: number; sexo: Sexo | null; alturaCm: number; pesoKg: number; actividad: Actividad; objetivo: Objetivo; ritmo: Ritmo; caso: Caso };
const DE_FABRICA: Respuestas = { edad: 29, sexo: null, alturaCm: 172, pesoKg: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', caso: 'nada' };
type DeSalud = ReadonlySet<'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>;
/** Lo que deja cada pantalla arriba, debajo del borde del teléfono. */
const ARRIBA = 28;
/** Lo que deja cada pantalla a los costados. */
const LADOS = 26;
const CASIOPEA = buscarConstelacion('cassiopeia');
/**
 * Lo más que crece el texto grande en lo que tiene su lugar medido a mano (las cifras grandes, la marca y
 * la introducción, que la estrella recorre): con más, «174,5 kg» y sus ± no entraban.
 */
const TOPE = 1.2;
/** Lo que se contesta se guarda con esta espera: el deslizador cambia muchas veces por segundo. */
const ESPERA_DEL_AVANCE = 400;
/** Un fundido no es movimiento: con Reducir movimiento también se ve (si no, aparecía de golpe). */
const fundido = (demora: number, ms: number) => FadeIn.delay(demora).duration(ms).reduceMotion(ReduceMotion.Never);
/** Lo que entra subiendo; con Reducir movimiento, solo con el fundido. */
const subiendo = (reducido: boolean, demora: number, ms: number) => (reducido ? fundido(demora, ms) : FadeInDown.delay(demora).duration(ms));
const SE_APAGA = FadeOut.duration(200).reduceMotion(ReduceMotion.Never);

function vibrar(e: Evento) {
  if (e === 'completo') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (e === 'toque') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
}

type Retomar = { i: number; r: Respuestas; deSalud: DeSalud };

/**
 * Dónde sigue lo guardado en el paso `id`: la lista cambia con la suscripción (y sin cuenta), así que el
 * mismo número puede ser otra pantalla. Si esta versión no tiene ese paso, el anterior más cercano que sí.
 */
function retomarEn(id: string, pasos: readonly { id: Paso }[]): number {
  const aca = pasos.findIndex((p) => p.id === id);
  if (aca >= 0) return aca;
  // La lista con suscripción tiene todos los pasos.
  for (let k = PASOS_CON_PAGO.findIndex((p) => p.id === id) - 1; k >= 0; k--) {
    const anterior = pasos.findIndex((p) => p.id === PASOS_CON_PAGO[k].id);
    if (anterior >= 0) return anterior;
  }
  return 0;
}

function avanceInicial(pasos: readonly { id: Paso }[]): Retomar {
  const e = elAlmacen().estado();
  const a = e.avanceDeEntrada as { i?: unknown; id?: unknown; r?: Partial<Respuestas>; deSalud?: unknown } | null;
  // Lo guardado antes, sin el id del paso, sigue con el número.
  const i = typeof a?.id === 'string' ? retomarEn(a.id, pasos) : typeof a?.i === 'number' && a.i >= 0 && a.i < pasos.length ? a.i : null;
  if (a && i !== null && a.r) {
    return { i, r: { ...DE_FABRICA, ...a.r }, deSalud: new Set(Array.isArray(a.deSalud) ? a.deSalud : []) as DeSalud };
  }
  const p = e.perfil;
  const peso = e.pesos[e.pesos.length - 1]?.kg;
  const r: Respuestas = p
    ? { ...DE_FABRICA, edad: edadDe(p, e.hoy), sexo: p.sexo, alturaCm: p.alturaCm, actividad: p.actividad, objetivo: p.objetivo, ritmo: p.ritmo, caso: p.sinDeficit ? 'condicion' : 'nada', ...(peso ? { pesoKg: peso } : {}) }
    : DE_FABRICA;
  return { i: 0, r, deSalud: new Set() };
}

export function Entrada({ camara, alTerminar }: { camara: SharedValue<number>; alTerminar?: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const reducido = useReducedMotion();
  const [pasos] = useState(pasosDeEstaVersion);
  // Se retoma donde quedó; si la cuenta ya tenía un perfil, sus respuestas vienen llenas.
  const [inicio] = useState(() => avanceInicial(pasos));
  const [i, setI] = useState(inicio.i);
  const [r, setR] = useState<Respuestas>(inicio.r);
  const [deSalud, setDeSalud] = useState<DeSalud>(inicio.deSalud);
  const [terminando, setTerminando] = useState(false);
  const paso = pasos[i];

  // La estrella guía: el guion de la pantalla de ahora y el reloj que lo recorre (ms desde que empezó).
  const a = useMemo(() => medirAnclas(W, H, insets.top, insets.bottom, ARRIBA, LADOS), [W, H, insets.top, insets.bottom]);
  const recorrido = useSharedValue<Recorrido | null>(null);
  const reloj = useSharedValue(0);
  const kDe = (j: number) => {
    const c = CUESTIONARIO.indexOf(pasos[j]?.id);
    return c >= 0 ? (c + 1) / CUESTIONARIO.length : 0;
  };
  const guionPara = (j: number, desde: Lugar) => guionDe(pasos[j].id, a, desde, kDe(j), CASIOPEA, hayCompras());
  // Al abrir (o retomar), sale de donde habría quedado la pantalla anterior.
  const [guion, setGuion] = useState<Guion>(() => guionPara(inicio.i, reposo(pasos[inicio.i - 1]?.id, a, kDe(inicio.i - 1))));
  // En la frase y las diapositivas: ya terminó su parte y espera que la toquen.
  const [espera, setEspera] = useState(false);
  /** Dónde está la estrella ahora mismo: de ahí sale la pantalla siguiente. */
  const lugarDeAhora = (): Lugar => {
    const g = recorrido.get();
    if (!g) return reposo(pasos[i - 1]?.id, a, kDe(i - 1));
    const e = estado(g, reloj.get(), false);
    const b = barraEn(g, reloj.get());
    return { pos: [e.x, e.y], escala: e.escala, brillo: e.base, enBarra: b.visible > 0.5 ? b.k : null };
  };
  useEffect(() => {
    recorrido.set(guion.recorrido);
    const dura = guion.fin + 600;
    reloj.set(0);
    reloj.set(withTiming(dura, { duration: dura, easing: Easing.linear }));
    const esperas = guion.eventos.map(([ms, e]) => setTimeout(() => vibrar(e), ms));
    if (esDiapositiva(paso.id) && !terminando) esperas.push(setTimeout(() => setEspera(true), guion.fin));
    return () => esperas.forEach(clearTimeout);
    // El guion cambia junto con la pantalla: alcanza con él.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guion, recorrido, reloj]);
  // Después de Salud, si la cuenta trajo su perfil (otro teléfono, reinstalar o volver a entrar),
  // el cuestionario no se pregunta otra vez: se sale como al terminar y quedan sus metas y sus hábitos.
  const conPerfil = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().perfil !== null);
  const conLaCuenta = conPerfil && i > pasos.findIndex((p) => p.id === 'salud');
  const saliendo = terminando || conLaCuenta;

  // El avance se guarda al cambiar de pantalla; lo que se contesta en la misma, con una espera corta (el
  // deslizador cambia muchas veces por segundo, y cada vez se escribía) o al irse Moss a segundo plano.
  const avancePendiente = useRef<(() => void) | null>(null);
  const pantallaGuardada = useRef<number | null>(null);
  useEffect(() => {
    if (saliendo) {
      avancePendiente.current = null;
      return;
    }
    const guardar = () => {
      avancePendiente.current = null;
      elAlmacen().ponerAvanceDeEntrada({ i, id: paso.id, r, deSalud: [...deSalud] });
    };
    avancePendiente.current = guardar;
    if (pantallaGuardada.current !== i) {
      pantallaGuardada.current = i;
      guardar();
      return;
    }
    const espera = setTimeout(guardar, ESPERA_DEL_AVANCE);
    return () => clearTimeout(espera);
  }, [i, paso.id, r, deSalud, saliendo]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') avancePendiente.current?.();
    });
    return () => {
      sub.remove();
      avancePendiente.current?.();
    };
  }, []);

  // Salud dijo menos de 16: al volver a esa pregunta (o a Moss), se le pregunta de nuevo, por si cambió la
  // fecha de nacimiento. Si ya no la tiene, la edad se elige a mano.
  const edadDeSalud = paso.id === 'edad' && deSalud.has('edad');
  useEffect(() => {
    if (!edadDeSalud) return;
    let vigente = true;
    const releer = () => {
      datosDelCuestionario().then((d) => {
        if (!vigente) return;
        const edad = d.edad;
        if (edad !== undefined) setR((antes) => (antes.edad === edad ? antes : { ...antes, edad }));
        else setDeSalud((antes) => {
          const nuevo = new Set(antes);
          nuevo.delete('edad');
          return nuevo;
        });
      }).catch(() => {});
    };
    releer();
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') releer();
    });
    return () => {
      vigente = false;
      sub.remove();
    };
  }, [edadDeSalud]);

  useEffect(() => {
    camara.set(paso.camara);
  }, [camara, paso.camara]);

  const irA = (j: number) => {
    setEspera(false);
    setGuion(guionPara(j, lugarDeAhora()));
    setI(j);
  };
  const siguiente = () => {
    if (i < pasos.length - 1) irA(i + 1);
  };
  // «Empezar» va una vez: mientras Apple contesta (hasta tres segundos), un segundo toque abría la pantalla
  // de pago otra vez o guardaba las respuestas dos veces.
  const empezo = useRef(false);
  // Se borró la cuenta o se cerró la sesión desde la pantalla de pago: desde el principio, sin lo contestado.
  const reiniciar = () => {
    empezo.current = false;
    setR(DE_FABRICA);
    setDeSalud(new Set());
    irA(0);
  };
  const dondeCuesta = pasos.findIndex((p) => p.id === 'precio');
  const poner = <K extends keyof Respuestas>(clave: K, valor: Respuestas[K]) => {
    setR((antes) => ({ ...antes, [clave]: valor }));
    // Lo que se cambia a mano ya no es de Salud.
    setDeSalud((antes) => {
      if (!antes.has(clave as never)) return antes;
      const nuevo = new Set(antes);
      nuevo.delete(clave as never);
      return nuevo;
    });
  };

  // El final: la cámara baja hasta hoy, la entrada se apaga y se guarda todo; con el perfil
  // guardado, Secciones deja la entrada y aparece Inicio.
  const salir = (guardar: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    camara.set(0);
    return setTimeout(() => {
      guardar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, reducido ? 200 : 1100);
  };
  const terminar = () => {
    if (saliendo || !r.sexo) {
      empezo.current = false;
      return;
    }
    setTerminando(true);
    // La estrella sube y se va, como en la galería antes del flum.
    setGuion(guionDeSalida(lugarDeAhora()));
    const sexo = r.sexo;
    const { caso, ...respuestas } = r;
    salir(() => {
      elAlmacen().responderCuestionario({ ...respuestas, sexo, sinDeficit: caso !== 'nada' }, deSalud.has('pesoKg') ? 'salud' : 'manual');
      alTerminar?.();
    });
  };
  const empezar = () => {
    if (empezo.current || saliendo) return;
    empezo.current = true;
    ofrecerPremium(terminar, reiniciar);
  };
  useEffect(() => {
    if (!conLaCuenta || terminando) return;
    const espera = salir(() => elAlmacen().terminarEntrada());
    return () => clearTimeout(espera);
    // Solo importa cuándo llega el perfil: salir es otra función en cada dibujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conLaCuenta]);

  // Con Reducir movimiento, la entrada se apaga igual (de fábrica, withTiming lo saltearía) pero sin agrandarse.
  const estiloSalida = useAnimatedStyle(() => ({
    opacity: withTiming(saliendo ? 0 : 1, { duration: 700, reduceMotion: ReduceMotion.Never }),
    transform: [{ scale: reducido ? 1 : withTiming(saliendo ? 1.06 : 1, { duration: 900 }) }],
  }));

  const enCuestionario = CUESTIONARIO.indexOf(paso.id);
  const relleno = { paddingTop: insets.top + ARRIBA, paddingBottom: insets.bottom + 24 };
  // La frase, las diapositivas y la cuenta tienen lo suyo en un lugar fijo, el que recorre la estrella: no corren.
  const fija = esDiapositiva(paso.id) || paso.id === 'cuenta';
  const conPago = hayCompras();
  // Sin déficit, bajar de peso queda en mantener; antes de los 18, bajando, «Rápido» queda en el recomendado.
  const objetivo: Objetivo = r.caso !== 'nada' && r.objetivo === 'bajar' ? 'mantener' : r.objetivo;
  const ritmo = ritmoPermitido({ edad: r.edad, objetivo, ritmo: r.ritmo });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estiloSalida]} pointerEvents={saliendo ? 'none' : 'box-none'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          key={paso.id}
          entering={reducido ? ENTRA_FUNDIDO : FadeInDown.delay(i === 0 ? 120 : 280).duration(620)}
          exiting={reducido ? SALE_FUNDIDO : FadeOut.duration(320)}
          style={{ flex: 1 }}
        >
          {fija ? (
            <>
              {paso.id === 'frase' && <Frase a={a} />}
              {paso.id === 'habitos' && guion.casiopea && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Casiopea escena={guion.casiopea} reloj={reloj} reducido={reducido} ancho={a.W} alto={a.H} />
                </View>
              )}
              {paso.id === 'comida' && guion.luna && <LunaQueSeLlena luna={guion.luna} reloj={reloj} reducido={reducido} />}
              {paso.id === 'comida' && conPago && guion.luna && <LoDicho a={a} luna={guion.luna} reducido={reducido} />}
              {paso.id === 'base' && guion.base && <LaBase a={a} llegaA={guion.base} reducido={reducido} />}
              {paso.id === 'sueno' && guion.noche && <LaNoche a={a} cruza={guion.noche} reducido={reducido} />}
              {paso.id === 'juntos' && guion.juntos && <LosDosJuntos a={a} baja={guion.juntos} />}
              {paso.id === 'precio' && guion.camino && <ElCamino a={a} cuando={guion.camino} reducido={reducido} />}
              {paso.id === 'cuenta' && <Marca a={a} letras={guion.letras} reducido={reducido} />}
              <View style={[s.pantalla, s.fija, relleno]} pointerEvents="box-none">
                {paso.id === 'habitos' && <Encabezado titulo={t('entrada.habitosTitulo')} texto={t('entrada.habitosTexto')} />}
                {paso.id === 'comida' && (conPago
                  ? <Encabezado titulo={t('entrada.intro.comida.titulo')} texto={t('entrada.intro.comida.texto')} />
                  : <Encabezado titulo={t('entrada.comidaTitulo')} texto={t('entrada.comidaTexto')} />)}
                {paso.id === 'base' && <Encabezado titulo={t('entrada.intro.base.titulo')} texto={t('entrada.intro.base.texto')} />}
                {paso.id === 'sueno' && <Encabezado titulo={t('entrada.intro.sueno.titulo')} texto={t('entrada.intro.sueno.texto')} />}
                {paso.id === 'juntos' && <Encabezado titulo={t('entrada.intro.juntos.titulo')} texto={t('entrada.intro.juntos.texto')} />}
                {paso.id === 'precio' && <LoQueCuesta />}
                {paso.id === 'cuenta' && <Cuenta alEntrar={siguiente} />}
              </View>
              {conPago && INTRODUCCION.includes(paso.id) && <ConstelacionDeIntro i={INTRODUCCION.indexOf(paso.id)} arriba={insets.top + 4} />}
            </>
          ) : (
          <ScrollView
            contentContainerStyle={[s.pantalla, relleno]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {enCuestionario >= 0 && <Avance n={enCuestionario + 1} total={CUESTIONARIO.length} />}
            {paso.id === 'datos' && <TusDatos alSeguir={siguiente} />}
            {paso.id === 'salud' && (
              <Salud
                alSeguir={siguiente}
                alLeer={(d) => {
                  setR((antes) => ({ ...antes, ...d }));
                  setDeSalud(new Set(Object.keys(d) as ('edad' | 'sexo' | 'alturaCm' | 'pesoKg')[]));
                }}
              />
            )}
            {paso.id === 'edad' && (deSalud.has('edad') && r.edad < EDAD_MINIMA ? <Menor /> : (
              <Numero titulo={t('entrada.cuestionario.edadTitulo')} valor={Math.max(r.edad, RANGOS_DEL_CUESTIONARIO.edad[0])} min={RANGOS_DEL_CUESTIONARIO.edad[0]} max={RANGOS_DEL_CUESTIONARIO.edad[1]} paso={1} decimales={0} unidad={t('entrada.cuestionario.anos')} deSalud={deSalud.has('edad')} alCambiar={(v) => poner('edad', v)} alSeguir={() => { poner('edad', Math.max(r.edad, RANGOS_DEL_CUESTIONARIO.edad[0])); siguiente(); }} />
            ))}
            {paso.id === 'sexo' && <ElSexo sexo={r.sexo} deSalud={deSalud.has('sexo')} alElegir={(v) => poner('sexo', v)} alSeguir={siguiente} />}
            {paso.id === 'altura' && <Altura cm={r.alturaCm} deSalud={deSalud.has('alturaCm')} alCambiar={(v) => poner('alturaCm', v)} alSeguir={siguiente} />}
            {paso.id === 'peso' && <Peso kg={r.pesoKg} deSalud={deSalud.has('pesoKg')} alCambiar={(v) => poner('pesoKg', v)} alSeguir={siguiente} />}
            {paso.id === 'actividad' && <LaActividad actividad={r.actividad} alElegir={(v) => poner('actividad', v)} alSeguir={siguiente} />}
            {paso.id === 'cuidado' && <Cuidado sexo={r.sexo} caso={r.caso} alElegir={(v) => poner('caso', v)} alSeguir={siguiente} />}
            {paso.id === 'objetivo' && (
              <ElObjetivo
                objetivo={objetivo}
                ritmo={ritmo}
                sinDeficit={r.caso !== 'nada'}
                menor={r.edad < MAYORIA_DE_EDAD}
                alObjetivo={(v) => poner('objetivo', v)}
                alRitmo={(v) => poner('ritmo', v)}
                alSeguir={() => {
                  if (objetivo !== r.objetivo) poner('objetivo', objetivo);
                  if (ritmo !== r.ritmo) poner('ritmo', ritmo);
                  siguiente();
                }}
              />
            )}
            {paso.id === 'resultado' && <ElResultado r={r} alEmpezar={empezar} boton={conPago ? t('entrada.seguir') : t('entrada.cuestionario.empezar')} reducido={reducido} />}
          </ScrollView>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      <Guia recorrido={recorrido} reloj={reloj} anclas={a} reducido={reducido} tocable={esDiapositiva(paso.id) && !saliendo} lista={espera} alTocar={siguiente} />
      {/* Saltar lleva a lo que cuesta: el cuestionario es trabajo, y antes hay que saber que Moss es de pago. */}
      {conPago && i < dondeCuesta && !saliendo && (
        <Animated.View entering={fundido(0, 320)} exiting={SE_APAGA} style={[s.saltar, { top: insets.top + 4 }]}>
          <Pressable onPress={() => irA(dondeCuesta)} accessibilityRole="button" hitSlop={10}>
            <Text style={s.saltarTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.saltar')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </Animated.View>
  );
}

// Como en la galería, la frase, las diapositivas, la cuenta y el resultado van centrados; el cuestionario, a la izquierda.
// `tope`: en las pantallas fijas, lo de abajo tiene su lugar medido y el texto grande lo taparía.
const Titulo = ({ children, centrado, tope }: { children: ReactNode; centrado?: boolean; tope?: boolean }) => (
  <Text style={[s.titulo, centrado && s.centrado]} accessibilityRole="header" maxFontSizeMultiplier={tope ? TOPE : undefined}>{children}</Text>
);
const Texto = ({ children, centrado, tope }: { children: ReactNode; centrado?: boolean; tope?: boolean }) => (
  <Text style={[s.texto, centrado && s.centrado]} maxFontSizeMultiplier={tope ? TOPE : undefined}>{children}</Text>
);
const Pie = ({ children }: { children: ReactNode }) => <View style={s.pie}>{children}</View>;
const Espacio = () => <View style={{ flex: 1, minHeight: 24 }} />;

/** Cuánto falta del cuestionario. La barra es de la estrella (Guia.tsx), que va en su punta: acá queda su lugar. */
function Avance({ n, total }: { n: number; total: number }) {
  return (
    <View>
      <View style={s.avance} />
      <Text style={s.paso}>{t('entrada.cuestionario.paso', { n, total })}</Text>
    </View>
  );
}

// ------------------------------------------------------------------ la frase y las diapositivas
/**
 * La frase, centrada en el 44 % del alto: las palabras aparecen mientras la estrella la presenta desde arriba.
 * Con Reducir movimiento también se encienden de a una: es un fundido, y la estrella sigue el mismo reloj.
 */
function Frase({ a }: { a: Anclas }) {
  const palabras = t('entrada.frase').split(' ');
  return (
    <View style={[s.frase, { height: a.H * 0.88 }]} pointerEvents="none">
      <View style={s.fraseTexto} accessible accessibilityLabel={t('entrada.frase')}>
        {palabras.map((p, k) => (
          <Animated.Text key={k} entering={fundido(PALABRAS.desde + k * PALABRAS.cada, 900)} style={s.palabra} maxFontSizeMultiplier={TOPE}>{p}</Animated.Text>
        ))}
      </View>
      <Animated.Text entering={fundido(PALABRAS.autor, 1000)} style={s.autor} maxFontSizeMultiplier={TOPE}>{t('entrada.fraseAutor')}</Animated.Text>
    </View>
  );
}

function Encabezado({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <>
      <Titulo centrado tope>{titulo}</Titulo>
      <Texto centrado tope>{texto}</Texto>
    </>
  );
}

/** La luna de la comida, en el centro: se llena mientras la estrella le da tres vueltas, y cada vuelta deja el anillo de un macro. */
function LunaQueSeLlena({ luna, reloj, reducido }: { luna: EscenaDeLuna; reloj: SharedValue<number>; reducido: boolean }) {
  const [llena, setLlena] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setLlena(true), luna.llena[0]);
    return () => clearTimeout(id);
  }, [luna]);
  return (
    <View style={[s.lunaGrande, s.lunaFija, { left: luna.centro[0] - LUNA.caja / 2, top: luna.centro[1] - LUNA.caja / 2 }]} pointerEvents="none">
      <Luna tam={118} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : luna.llena[1] - luna.llena[0]} />
      <Anillos tam={LUNA.caja} ms={0} vueltas={luna.vueltas} reloj={reloj} />
    </View>
  );
}

/** La marca de la cuenta, en el 36 % del alto: cada letra aparece cuando la estrella pasa por encima. */
function Marca({ a, letras: cuando, reducido }: { a: Anclas; letras?: number[]; reducido: boolean }) {
  return (
    <View style={[s.marcaCaja, { top: a.marca[1] - 36 }]} pointerEvents="none">
      <View style={s.marca} accessible accessibilityRole="header" accessibilityLabel="Moss">
        {'Moss'.split('').map((letra, k) => (
          <Animated.Text key={k} entering={subiendo(reducido, cuando?.[k] ?? 150 + k * 120, 1100)} style={s.marcaLetra} maxFontSizeMultiplier={TOPE}>{letra}</Animated.Text>
        ))}
      </View>
      <Animated.Text entering={fundido(1900, 1000)} style={s.lema} maxFontSizeMultiplier={TOPE}>{t('entrada.cuenta.lema')}</Animated.Text>
    </View>
  );
}

// ------------------------------------------------------------------ la introducción, con la suscripción
/** Una estrella por pantalla, en zigzag, como la del cuestionario de la galería: lo visto encendido y lo de ahora, prendiéndose. */
function ConstelacionDeIntro({ i, arriba }: { i: number; arriba: number }) {
  const total = INTRODUCCION.length;
  const pts = Array.from({ length: total }, (_, k) => [3 + (k * 86) / (total - 1), 17 - (k % 2 ? 6 : 0) - k * 0.8] as const);
  return (
    <View style={[s.constelacion, { top: arriba }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pts.slice(1).map(([x, y], k) => {
        const [x0, y0] = pts[k];
        const largo = Math.hypot(x - x0, y - y0);
        return <View key={k} style={[s.constelacionLinea, k < i && s.constelacionHecha, { left: (x + x0) / 2 - largo / 2, top: (y + y0) / 2, width: largo, transform: [{ rotate: `${Math.atan2(y - y0, x - x0)}rad` }] }]} />;
      })}
      {pts.map(([x, y], k) => <View key={k} style={[s.constelacionEstrella, k < i && s.constelacionEncendida, k === i && s.constelacionAhora, { left: x - 2, top: y - 2 }]} />)}
    </View>
  );
}

/** Lo dicho, arriba de la luna, y lo que anotó: cada vuelta de la estrella deja un alimento. */
function LoDicho({ a, luna, reducido }: { a: Anclas; luna: EscenaDeLuna; reducido: boolean }) {
  const lados = { left: a.barra.x0, right: a.barra.x0 };
  const aparece = (ms: number) => subiendo(reducido, ms, 550);
  const porciones = lista('entrada.intro.comida.porciones');
  // Debajo de la luna, midiendo desde ella: tres filas de 33 y lo que suman.
  const filas = luna.centro[1] + LUNA.radios[2] + 12;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {a.H >= ALTO_PARA_LO_DICHO && (
        <Animated.View entering={aparece(500)} style={[s.dicho, lados, { top: a.H * INTRO.dicho }]}>
          <Icono nombre="mic" tam={16} color={colores.oroClaro} />
          <Text style={s.dichoTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.comida.frase')}</Text>
        </Animated.View>
      )}
      <View style={[s.dichoFilas, lados, { top: filas }]}>
        {lista('entrada.intro.comida.filas').map((nombre, k) => (
          <Animated.View key={nombre} entering={aparece(luna.vueltas[k][1] - 200)} style={s.dichoFila}>
            <Text style={s.dichoNombre} numberOfLines={1} maxFontSizeMultiplier={TOPE}>{nombre}<Text style={s.dichoPorcion}>{`  ${porciones[k]}`}</Text></Text>
            <Text style={s.dichoKcal} maxFontSizeMultiplier={TOPE}>{`${numero(KCAL_DEL_DICHO[k])} kcal`}</Text>
          </Animated.View>
        ))}
      </View>
      <Animated.Text entering={aparece(luna.vueltas[2][1] + 150)} style={[s.dichoTotal, lados, { top: filas + 3 * 33 + 12 }]} maxFontSizeMultiplier={TOPE}>
        {t('entrada.intro.comida.total', { n: numero(KCAL_DEL_DICHO.reduce((x, y) => x + y, 0)) })}
      </Animated.Text>
    </View>
  );
}

/** Lo que se busca y lo que encuentra: cada resultado se enciende con su fuente al pasar la estrella. */
function LaBase({ a, llegaA, reducido }: { a: Anclas; llegaA: number[]; reducido: boolean }) {
  const lados = { left: a.barra.x0, right: a.barra.x0 };
  const y = a.H * INTRO.busca;
  const porciones = lista('entrada.intro.base.porciones');
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[s.busca, lados, { top: y }]}>
        <Icono nombre="magnifyingglass" tam={15} color="rgba(239, 230, 207, 0.6)" />
        <Text style={s.buscaTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.base.busca')}</Text>
      </View>
      <View style={[s.baseFilas, lados, { top: y + BASE.hastaLasFilas }]}>
        {lista('entrada.intro.base.filas').map((nombre, k) => {
          const [kcal, proteina, carbohidratos, grasas] = DE_LA_BASE[k];
          const total = proteina * 4 + carbohidratos * 4 + grasas * 9;
          return (
            <Animated.View key={nombre} entering={subiendo(reducido, 300 + k * 160, 550)} style={s.baseFila}>
              <View style={s.baseMarca}>
                <Animated.View entering={fundido(llegaA[k], 450)} style={s.baseMarcaLuz}>
                  <Icono nombre="checkmark" tam={11} color={colores.oroClaro} peso="semibold" />
                </Animated.View>
              </View>
              <View style={s.baseTextos}>
                <Text style={s.baseNombre} numberOfLines={1} maxFontSizeMultiplier={TOPE}>{nombre}</Text>
                <Text style={s.basePorcion} numberOfLines={1} maxFontSizeMultiplier={TOPE}>{porciones[k]}</Text>
                <View style={s.baseMacros}>
                  <View style={{ flex: (proteina * 4) / total, backgroundColor: COLOR_DE_MACRO.proteina }} />
                  <View style={{ flex: (carbohidratos * 4) / total, backgroundColor: COLOR_DE_MACRO.carbohidratos }} />
                  <View style={{ flex: (grasas * 9) / total, backgroundColor: COLOR_DE_MACRO.grasas }} />
                </View>
              </View>
              <Text style={s.baseKcal} maxFontSizeMultiplier={TOPE}>{`${numero(kcal)} kcal`}</Text>
            </Animated.View>
          );
        })}
      </View>
      <Animated.View entering={fundido(llegaA[2] + 300, 500)} style={[s.baseNota, lados, { top: y + BASE.hastaLasFilas + 3 * BASE.fila + 4 }]}>
        <Text style={s.baseVerificado} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.base.verificado')}</Text>
      </Animated.View>
    </View>
  );
}

/** La noche de anoche, de ejemplo: la estrella la dibuja al cruzarla, y debajo lo que sale de ella. */
function LaNoche({ a, cruza, reducido }: { a: Anclas; cruza: [number, number]; reducido: boolean }) {
  const [hoy] = useState(() => elAlmacen().estado().hoy);
  const noches = ultimasNoches(ejemplo(hoy).noches, hoy, 14);
  const n = noches[noches.length - 1] ?? ejemplo(hoy).noches[0];
  const deuda = deudaDeSueno(noches, 8 * 60);
  const lados = { left: a.barra.x0, right: a.barra.x0 };
  const interior = a.W - 2 * a.barra.x0 - 32;
  const [llega, tarda] = cruza;
  const ancho = useSharedValue(reducido ? interior : 0);
  useEffect(() => {
    if (!reducido) ancho.set(withDelay(llega, withTiming(interior, { duration: tarda, easing: Easing.linear })));
  }, [ancho, interior, llega, tarda, reducido]);
  const estiloDelGrafico = useAnimatedStyle(() => ({ width: ancho.get() }));
  const maximo = 8 * 60 * 1.2;
  const datos: [string, string][] = [
    [t('entrada.intro.sueno.teDormiste'), horaDelDia(n.dormirse + 18 * 60)],
    [t('entrada.intro.sueno.teDespertaste'), horaDelDia(n.despertar + 18 * 60)],
    [t('entrada.intro.sueno.deuda'), deuda ? duracion(redondearDeuda(deuda.minutos)) : '—'],
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View entering={subiendo(reducido, 250, 550)} style={[s.noche, lados, { top: a.H * INTRO.noche }]}>
        <View style={[s.nocheCab, { height: NOCHE.hastaElGrafico - 26 }]}>
          <Text style={s.nocheRotulo} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.sueno.anoche')}</Text>
          <Text style={s.nocheCifra} maxFontSizeMultiplier={TOPE}>{duracion(n.dormido)}</Text>
        </View>
        <Animated.View style={[s.nocheGrafico, estiloDelGrafico]}>
          <Hipnograma desde={n.dormirse} hasta={n.despertar} tramos={n.tramos} ancho={interior} alto={NOCHE.grafico} guias />
        </Animated.View>
        <Animated.View entering={fundido(llega + tarda - 100, 450)} style={s.nocheDatos}>
          {datos.map(([titulo, valor]) => (
            <View key={titulo} style={s.nocheDato}>
              <Text style={s.nocheDatoTitulo} maxFontSizeMultiplier={TOPE}>{titulo}</Text>
              <Text style={s.nocheDatoValor} maxFontSizeMultiplier={TOPE}>{valor}</Text>
            </View>
          ))}
        </Animated.View>
      </Animated.View>
      <Animated.View entering={fundido(llega + tarda, 500)} style={[lados, s.nochesCaja, { top: a.H * INTRO.noche + 214 }]}>
        <Text style={s.nocheRotulo} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.sueno.semanas')}</Text>
        <View style={s.noches}>
          {noches.map((x, k) => <View key={k} style={[s.nocheBarra, x ? { height: Math.max(3, (x.dormido / maximo) * 46) } : s.nocheVacia, x && x.dormido >= 8 * 60 * 0.9 && s.nocheBien]} />)}
        </View>
      </Animated.View>
    </View>
  );
}

function LosDosJuntos({ a, baja }: { a: Anclas; baja: [number, number] }) {
  return (
    <View style={[StyleSheet.absoluteFill, { top: a.H * INTRO.juntos, paddingHorizontal: a.barra.x0 }]} pointerEvents="none">
      <EjemploDeJuntos ancho={a.W - 2 * a.barra.x0} medidas={JUNTOS} baja={baja} />
    </View>
  );
}

/** Lo que cuesta, antes de pedir nada: el precio lo da Apple, en la moneda de cada país. */
function LoQueCuesta() {
  const p = usePreciosDeLaEntrada();
  if (!p.dias) return <Encabezado titulo={t('entrada.intro.precio.tituloSinPrueba')} texto={t('entrada.intro.precio.textoSinPrueba', { anual: p.anual, mensual: p.mensual })} />;
  return <Encabezado titulo={t('entrada.intro.precio.titulo', { n: p.dias })} texto={t('entrada.intro.precio.texto', { anual: p.anual, mensual: p.mensual })} />;
}

/** La prueba, caminada por la estrella: hoy, el aviso y el cobro, cada uno encendido al llegar. */
function ElCamino({ a, cuando, reducido }: { a: Anclas; cuando: number[]; reducido: boolean }) {
  const p = usePreciosDeLaEntrada();
  const lados = { left: a.barra.x0, right: a.barra.x0 };
  const columna = (a.W - 2 * a.barra.x0 - 12) / 3;
  const largo = a.W - 2 * a.barra.x0 - columna;
  const lleno = useSharedValue(reducido ? largo : 0);
  useEffect(() => {
    if (!reducido) lleno.set(withDelay(cuando[0], withTiming(largo, { duration: cuando[2] - cuando[0], easing: Easing.linear })));
  }, [lleno, largo, cuando, reducido]);
  const estiloLleno = useAnimatedStyle(() => ({ width: lleno.get() }));
  const puntos: [string, string][] = [
    [t('suscripcion.linea.hoy'), t('suscripcion.linea.hoyTexto')],
    [t('suscripcion.linea.dia', { n: p.dias - (DIAS_DE_PRUEBA - DIA_DEL_AVISO) }), t('suscripcion.linea.avisoTexto')],
    [t('suscripcion.linea.dia', { n: p.dias }), t('suscripcion.linea.cobroTexto', { precio: p.anual })],
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {p.dias > 0 && (
        <View style={[s.camino, lados, { top: a.H * INTRO.camino }]}>
          <View style={[s.caminoHilo, { left: columna / 2, right: columna / 2 }]}>
            <Animated.View style={[s.caminoLleno, estiloLleno]} />
          </View>
          {puntos.map(([titulo, texto], k) => (
            <View key={titulo} style={s.caminoPunto}>
              <View style={s.caminoNodo}>
                <Animated.View entering={fundido(cuando[k], 350)} style={s.caminoNodoLuz} />
              </View>
              <Text style={s.caminoTitulo} maxFontSizeMultiplier={TOPE}>{titulo}</Text>
              <Text style={s.caminoTexto} maxFontSizeMultiplier={TOPE}>{texto}</Text>
            </View>
          ))}
        </View>
      )}
      <Animated.Text entering={fundido(cuando[2] + 200, 500)} style={[s.caminoNota, lados, { top: a.H * INTRO.nota }]} maxFontSizeMultiplier={TOPE}>{t('entrada.intro.precio.nota')}</Animated.Text>
    </View>
  );
}

// ------------------------------------------------------------------ la cuenta
/** Solo con Apple (la v1 no ofrece correo: la lógica sigue en cuenta.ts, sin usar). */
function Cuenta({ alEntrar }: { alEntrar: () => void }) {
  const reducido = useReducedMotion();
  const [apple, setApple] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<ErrorDeCuenta | null>(null);
  // El segundo toque llega antes de que el estado se dibuje: la hoja de Apple se pedía dos veces.
  const enCamino = useRef(false);
  useEffect(() => {
    hayApple().then(setApple).catch(() => {});
  }, []);
  const entrar = async () => {
    if (enCamino.current) return;
    enCamino.current = true;
    setOcupado(true);
    setError(null);
    const resultado = await entrarConApple();
    enCamino.current = false;
    setOcupado(false);
    if (resultado.ok) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alEntrar();
    } else {
      setError(resultado.error);
      if (resultado.error) anunciar(t(`entrada.cuenta.errores.${resultado.error}`));
    }
  };
  // La marca va arriba (Marca); abajo, Apple y lo que se acepta.
  return (
    <>
      <Espacio />
      <Animated.View entering={subiendo(reducido, 2100, 800)} style={s.botones}>
        {apple ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={25}
            style={s.apple}
            onPress={entrar}
          />
        ) : (
          <Boton tipo="apple" texto={t('entrada.cuenta.apple')} alTocar={entrar} desactivado={ocupado} icono={<Icono nombre="applelogo" tam={17} color="#000" />} />
        )}
        {error && (
          <Animated.Text entering={fundido(0, 300)} exiting={SE_APAGA} style={s.error} accessibilityLiveRegion="polite">
            {t(`entrada.cuenta.errores.${error}`)}
          </Animated.Text>
        )}
        <Legal />
      </Animated.View>
    </>
  );
}

/** Lo que se acepta al continuar, con los Términos y la Política de privacidad para abrirlos. */
function Legal() {
  return (
    <Text style={[s.chico, s.legal]}>
      {t('entrada.cuenta.legalConEnlaces').split(/(\{\w+\})/).map((parte, k) => {
        const clave = parte.slice(1, -1);
        if (clave !== 'terminos' && clave !== 'privacidad') return parte;
        return (
          <Text key={k} style={s.enlace} onPress={() => abrirPagina(clave)} accessibilityRole="link" suppressHighlighting>
            {t(`entrada.cuenta.${clave}`)}
          </Text>
        );
      })}
    </Text>
  );
}

// ------------------------------------------------------------------ tus datos
/**
 * Antes de la cuenta, una idea y una acción: qué guarda Moss y para qué, y el consentimiento para los
 * datos de salud (Ley 18.331 y la guía 5.1.1 de Apple). Mandar lo que no se encuentra ya no se pregunta
 * acá: empieza apagado y se prende en Perfil.
 */
function TusDatos({ alSeguir }: { alSeguir: () => void }) {
  const reducido = useReducedMotion();
  return (
    <>
      <Titulo>{t('entrada.datos.titulo')}</Titulo>
      <Texto>{t('entrada.datos.texto')}</Texto>
      <View style={s.datos}>
        {lista('entrada.datos.lineas').map((linea, k) => (
          <Animated.View key={linea} entering={subiendo(reducido, 500 + k * 140, 600)} style={s.datoFila}>
            <View style={s.datoPunto} />
            <Text style={s.datoTexto}>{linea}</Text>
          </Animated.View>
        ))}
      </View>
      <Pressable onPress={() => abrirPagina('privacidad')} accessibilityRole="link" hitSlop={8}>
        <Text style={[s.chico, s.enlace, s.izquierda]}>{t('entrada.datos.politica')}</Text>
      </Pressable>
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.datos.acepto')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

/** Menos de 16, según Salud: Moss no sigue (lo pediste el 22/10/2026). */
function Menor() {
  return (
    <View style={s.menor}>
      <Titulo centrado>{t('entrada.menor.titulo')}</Titulo>
      <Texto centrado>{t('entrada.menor.texto')}</Texto>
    </View>
  );
}

/** Embarazo o lactancia (solo se pregunta a las mujeres), una condición médica o nada. */
function Cuidado({ sexo, caso, alElegir, alSeguir }: { sexo: Sexo | null; caso: Caso; alElegir: (c: Caso) => void; alSeguir: () => void }) {
  const casos: { caso: Caso; titulo: string; detalle?: string }[] = [
    ...(sexo === 'f' ? [{ caso: 'embarazo' as const, titulo: t('entrada.cuidado.embarazo') }] : []),
    { caso: 'condicion', titulo: t('entrada.cuidado.condicion'), detalle: t('entrada.cuidado.condicionTexto') },
    { caso: 'nada', titulo: t('entrada.cuidado.nada') },
  ];
  return (
    <>
      <Titulo>{t('entrada.cuidado.titulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {casos.map((c) => <Opcion key={c.caso} titulo={c.titulo} detalle={c.detalle} elegida={c.caso === caso} alTocar={() => alElegir(c.caso)} />)}
      </View>
      {caso !== 'nada' && (
        <Animated.View entering={fundido(0, 300)} exiting={SE_APAGA}>
          <Texto>{t('entrada.cuidado.aviso')}</Texto>
        </Animated.View>
      )}
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

// ------------------------------------------------------------------ el cuestionario
const ICONOS_DE_SALUD = ['figure.walk', 'moon.zzz', 'brain.head.profile', 'drop', 'scalemass'] as const;

function Salud({ alSeguir, alLeer }: { alSeguir: () => void; alLeer: (d: Partial<Pick<Respuestas, 'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>>) => void }) {
  const [ocupado, setOcupado] = useState(false);
  const enCamino = useRef(false);
  const hay = haySalud();
  const conectar = async () => {
    if (enCamino.current) return;
    enCamino.current = true;
    setOcupado(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (await pedirPermisos()) {
      alLeer(await datosDelCuestionario());
      actualizarSalud().catch(() => {});
    }
    setOcupado(false);
    alSeguir();
  };
  return (
    <>
      <Titulo>{t('entrada.cuestionario.saludTitulo')}</Titulo>
      <Texto>{t('entrada.cuestionario.saludTexto')}</Texto>
      <View style={s.iconosDeSalud}>
        {ICONOS_DE_SALUD.map((nombre, k) => (
          <Animated.View key={nombre} entering={fundido(200 + k * 160, 600)} style={s.iconoDeSalud}>
            <Icono nombre={nombre} tam={19} color="rgba(239, 230, 207, 0.55)" />
          </Animated.View>
        ))}
      </View>
      <Espacio />
      <Pie>
        {hay && <Boton texto={t('entrada.cuestionario.conectar')} alTocar={conectar} desactivado={ocupado} />}
        <Boton tipo={hay ? 'secundario' : 'principal'} texto={hay ? t('entrada.cuestionario.ahoraNo') : t('entrada.seguir')} alTocar={alSeguir} desactivado={ocupado} />
      </Pie>
    </>
  );
}

/**
 * Lo que vino de Salud. Si se cambia a mano, el chip se apaga pero deja su lugar: al irse, el deslizador
 * subía de golpe con el dedo encima.
 */
function ChipDeSalud({ encendido, izquierda }: { encendido: boolean; izquierda?: boolean }) {
  const [estuvo] = useState(encendido);
  const luz = useAnimatedStyle(() => ({ opacity: withTiming(encendido ? 1 : 0, { duration: 240, reduceMotion: ReduceMotion.Never }) }), [encendido]);
  if (!estuvo) return null;
  return (
    <Animated.View
      style={[s.chipFila, izquierda && { justifyContent: 'flex-start' }, luz]}
      accessibilityElementsHidden={!encendido}
      importantForAccessibility={encendido ? 'auto' : 'no-hide-descendants'}
    >
      <Text style={s.deSalud}>{t('entrada.cuestionario.deSalud')}</Text>
    </Animated.View>
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
      <Titulo>{titulo}</Titulo>
      {texto ? <Texto>{texto}</Texto> : null}
      <View style={s.numero}>
        <BotonDePaso alPaso={() => fino(-1)} etiqueta={`− ${numero(paso, decimales)}`} lado={40} style={s.fino}>
          <Icono nombre="minus" tam={16} peso="semibold" />
        </BotonDePaso>
        <View style={s.numeroCentro}>
          <Text style={s.numeroValor} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={TOPE}>
            {mostrar ? mostrar(valor) : numero(valor, decimales)}
          </Text>
          {!mostrar && <Text style={s.numeroUnidad} maxFontSizeMultiplier={TOPE}>{unidad}</Text>}
        </View>
        <BotonDePaso alPaso={() => fino(1)} etiqueta={`+ ${numero(paso, decimales)}`} lado={40} style={s.fino}>
          <Icono nombre="plus" tam={16} peso="semibold" />
        </BotonDePaso>
      </View>
      <ChipDeSalud encendido={deSalud} />
      <Deslizador valor={valor} min={min} max={max} paso={paso} alCambiar={alCambiar} etiqueta={titulo} textoDe={textoDe} pasoDeAccesibilidad={1} />
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

function Altura({ cm, deSalud, alCambiar, alSeguir }: { cm: number; deSalud: boolean; alCambiar: (cm: number) => void; alSeguir: () => void }) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  if (!imperial) {
    return <Numero titulo={t('entrada.cuestionario.alturaTitulo')} valor={cm} min={RANGOS_DEL_CUESTIONARIO.alturaCm[0]} max={RANGOS_DEL_CUESTIONARIO.alturaCm[1]} paso={1} decimales={0} unidad="cm" deSalud={deSalud} alCambiar={alCambiar} alSeguir={alSeguir} />;
  }
  // En pulgadas, y se muestra en pies y pulgadas: 5′ 9″.
  const pulgadas = Math.round(cm / CM_POR_PULGADA);
  return (
    <Numero
      titulo={t('entrada.cuestionario.alturaTitulo')}
      valor={pulgadas}
      min={Math.ceil(RANGOS_DEL_CUESTIONARIO.alturaCm[0] / CM_POR_PULGADA)}
      max={Math.floor(RANGOS_DEL_CUESTIONARIO.alturaCm[1] / CM_POR_PULGADA)}
      paso={1}
      decimales={0}
      unidad="in"
      deSalud={deSalud}
      alCambiar={(p) => alCambiar(Math.round(p * CM_POR_PULGADA))}
      alSeguir={alSeguir}
      mostrar={(p) => `${Math.floor(p / 12)}′ ${p % 12}″`}
    />
  );
}

function Peso({ kg, deSalud, alCambiar, alSeguir }: { kg: number; deSalud: boolean; alCambiar: (kg: number) => void; alSeguir: () => void }) {
  const imperial = sistemaDe(useEstado()) === 'imperial';
  const comun = { titulo: t('entrada.cuestionario.pesoTitulo'), texto: t('entrada.cuestionario.pesoTexto'), deSalud, alSeguir, decimales: 1 };
  if (!imperial) return <Numero {...comun} valor={kg} min={RANGOS_DEL_CUESTIONARIO.pesoKg[0]} max={RANGOS_DEL_CUESTIONARIO.pesoKg[1]} paso={0.1} unidad="kg" alCambiar={(v) => alCambiar(Math.round(v * 10) / 10)} />;
  return <Numero {...comun} valor={Math.round((kg / KG_POR_LIBRA) * 10) / 10} min={Math.ceil(RANGOS_DEL_CUESTIONARIO.pesoKg[0] / KG_POR_LIBRA)} max={Math.floor(RANGOS_DEL_CUESTIONARIO.pesoKg[1] / KG_POR_LIBRA)} paso={0.2} unidad="lb" alCambiar={(lb) => alCambiar(Math.round(lb * KG_POR_LIBRA * 100) / 100)} />;
}

function ElSexo({ sexo, deSalud, alElegir, alSeguir }: { sexo: Sexo | null; deSalud: boolean; alElegir: (s: Sexo) => void; alSeguir: () => void }) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.sexoTitulo')}</Titulo>
      <Texto>{t('entrada.cuestionario.sexoTexto')}</Texto>
      <View style={[s.opciones, s.dos]} accessibilityRole="radiogroup">
        <Opcion titulo={t('entrada.cuestionario.femenino')} elegida={sexo === 'f'} alTocar={() => alElegir('f')} centrada />
        <Opcion titulo={t('entrada.cuestionario.masculino')} elegida={sexo === 'm'} alTocar={() => alElegir('m')} centrada />
      </View>
      <ChipDeSalud encendido={deSalud} izquierda />
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} desactivado={!sexo} />
      </Pie>
    </>
  );
}

const ACTIVIDADES: readonly Actividad[] = ['poco', 'algo', 'activo', 'muy'];

function LaActividad({ actividad, alElegir, alSeguir }: { actividad: Actividad; alElegir: (a: Actividad) => void; alSeguir: () => void }) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.actividadTitulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {ACTIVIDADES.map((a) => {
          const [titulo, detalle] = lista(`entrada.cuestionario.actividad.${a}`);
          return <Opcion key={a} titulo={titulo} detalle={detalle} elegida={a === actividad} alTocar={() => alElegir(a)} />;
        })}
      </View>
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

function ElObjetivo({ objetivo, ritmo, sinDeficit, menor, alObjetivo, alRitmo, alSeguir }: {
  objetivo: Objetivo; ritmo: Ritmo; sinDeficit: boolean; menor: boolean; alObjetivo: (o: Objetivo) => void; alRitmo: (r: Ritmo) => void; alSeguir: () => void;
}) {
  return (
    <>
      <Titulo>{t('entrada.cuestionario.objetivoTitulo')}</Titulo>
      <View style={s.opciones} accessibilityRole="radiogroup">
        {/* Sin déficit, bajar de peso no se elige acá: se dice por qué, corto. */}
        {(['bajar', 'mantener', 'subir'] as const).map((o) => (
          <Opcion
            key={o}
            titulo={t(`entrada.cuestionario.${o}`)}
            detalle={o === 'bajar' && sinDeficit ? t('entrada.cuidado.bajarNo') : undefined}
            desactivada={o === 'bajar' && sinDeficit}
            elegida={o === objetivo}
            alTocar={() => alObjetivo(o)}
          />
        ))}
      </View>
      {objetivo !== 'mantener' && (
        <Animated.View entering={fundido(0, 300)} exiting={SE_APAGA} style={s.ritmo}>
          <Text style={s.paso}>{t('entrada.cuestionario.ritmo')}</Text>
          <View style={[s.opciones, s.tres]} accessibilityRole="radiogroup">
            {(['suave', 'recomendado', 'rapido'] as const).map((x) => {
              // Antes de los 18, bajar rápido no está (ritmoPermitido): se dice desde cuándo, corto.
              const no = menor && objetivo === 'bajar' && x === 'rapido';
              return <Opcion key={x} titulo={t(`entrada.cuestionario.${x}`)} detalle={no ? t('entrada.cuestionario.meta.desde18') : undefined} desactivada={no} elegida={x === ritmo} alTocar={() => alRitmo(x)} centrada />;
            })}
          </View>
          <Text style={s.chico}>{t('entrada.cuestionario.ritmoTexto', { pct: numero(Math.abs(RITMOS[objetivo][ritmo]), 2) })}</Text>
        </Animated.View>
      )}
      <Espacio />
      <Pie>
        <Boton texto={t('entrada.seguir')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

// ------------------------------------------------------------------ el resultado
function ElResultado({ r, alEmpezar, boton, reducido }: { r: Respuestas; alEmpezar: () => void; boton: string; reducido: boolean }) {
  const { gasto, metas } = metasIniciales({ ...r, sexo: r.sexo ?? 'm' });
  const kcal = [metas.proteina * 4, metas.carbohidratos * 4, metas.grasas * 9];
  const total = kcal.reduce((a, b) => a + b, 0) || 1;
  const [llena, setLlena] = useState(false);
  // La cifra cuenta desde cero hasta la meta, de a pasos (useCuenta) y no en cada cuadro.
  const [hasta, setHasta] = useState(reducido ? metas.kcal : 0);
  const cuenta = Math.round(useCuenta(hasta, 1400));
  useEffect(() => {
    const id = setTimeout(() => {
      setLlena(true);
      setHasta(metas.kcal);
    }, 200);
    return () => clearTimeout(id);
  }, [metas.kcal]);
  return (
    <>
      <Titulo centrado>{t('entrada.cuestionario.resultadoTitulo')}</Titulo>
      <View style={[s.lunaGrande, s.lunaResultado]}>
        <Luna tam={100} fraccion={llena ? 1 : 0.06} ms={reducido ? 0 : 1600} />
        <Anillos tam={196} reparto={[kcal[0] / total, kcal[1] / total, kcal[2] / total]} ms={reducido ? 0 : 1600} demora={200} />
      </View>
      <View style={s.kcal}>
        <Text style={s.kcalNumero} maxFontSizeMultiplier={TOPE}>{numero(cuenta)}</Text>
        <Text style={s.kcalTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.cuestionario.kcal')}</Text>
      </View>
      <View style={s.macros}>
        {MACROS.map((m) => (
          <View key={m} style={s.macro}>
            <View style={[s.macroPunto, { backgroundColor: COLOR_DE_MACRO[m] }]} />
            <Text style={s.macroNombre}>{t(`entrada.cuestionario.${m}`)}</Text>
            <Text style={s.macroGramos}>{`${numero(metas[m])} g`}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.chico, { textAlign: 'center' }]}>{t('entrada.cuestionario.gasto', { n: numero(gasto) })}</Text>
      <Texto centrado>{t('entrada.cuestionario.resultadoTexto')}</Texto>
      <Text style={s.chico}>{t('entrada.cuestionario.profesional')}</Text>
      <Espacio />
      <Pie>
        <Boton texto={boton} alTocar={alEmpezar} />
      </Pie>
    </>
  );
}

const SOMBRA = { textShadowColor: 'rgba(3, 5, 12, 0.95)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } };

const s = StyleSheet.create({
  pantalla: { flexGrow: 1, paddingHorizontal: 26 },
  titulo: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 32, lineHeight: 35, color: colores.pergamino, ...SOMBRA },
  texto: { marginTop: 12, maxWidth: 320, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 22, color: 'rgba(239, 230, 207, 0.78)', ...SOMBRA },
  chico: { marginTop: 12, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.55)', textAlign: 'center' },
  legal: { marginTop: 6, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.4)' },
  enlace: { textDecorationLine: 'underline' },
  izquierda: { textAlign: 'left' },
  datos: { marginTop: 18, gap: 9, maxWidth: 340 },
  datoFila: { flexDirection: 'row', gap: 12 },
  // Un rombo chico, como una estrella lejana.
  datoPunto: { width: 5, height: 5, marginTop: 8.5, marginLeft: 2, backgroundColor: colores.oroClaro, transform: [{ rotate: '45deg' }], shadowColor: colores.oroClaro, shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  datoTexto: { flex: 1, fontFamily: letras.textoLiviano, fontSize: 15, lineHeight: 21, color: 'rgba(239, 230, 207, 0.86)', ...SOMBRA },
  menor: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  pie: { gap: 10, width: '100%', maxWidth: 340, alignSelf: 'center', paddingTop: 18 },
  avance: { height: 2 },
  paso: { marginTop: 16, marginBottom: 10, fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.5)' },
  centrado: { textAlign: 'center', alignSelf: 'center' },
  fija: { flex: 1 },
  frase: { position: 'absolute', left: 28, right: 28, top: 0, alignItems: 'center', justifyContent: 'center' },
  fraseTexto: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 7, maxWidth: 230 },
  palabra: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 29, lineHeight: 36, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.35)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  autor: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: 'rgba(185, 227, 107, 0.75)' },
  lunaGrande: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  lunaFija: { position: 'absolute' },
  lunaResultado: { width: 196, height: 196, alignSelf: 'center', marginTop: 14 },
  marcaCaja: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  marca: { flexDirection: 'row' },
  marcaLetra: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 66, lineHeight: 72, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.45)', textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } },
  lema: { marginTop: 8, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: 'rgba(239, 230, 207, 0.72)' },
  botones: { width: '100%', maxWidth: 330, alignSelf: 'center', gap: 10 },
  apple: { width: '100%', height: 50 },
  error: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: '#f0a58a', textAlign: 'center' },
  iconosDeSalud: { marginTop: 38, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  iconoDeSalud: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.25)', alignItems: 'center', justifyContent: 'center' },
  numero: { marginTop: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  numeroCentro: { flexShrink: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8, minWidth: 170, justifyContent: 'center' },
  numeroValor: { flexShrink: 1, fontFamily: letras.numeroLiviano, fontSize: 68, lineHeight: 74, letterSpacing: -1.2, color: colores.cifra, fontVariant: ['tabular-nums'] },
  numeroUnidad: { fontFamily: letras.texto, fontSize: 16, color: 'rgba(239, 230, 207, 0.6)' },
  fino: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  chipFila: { marginTop: 10, flexDirection: 'row', justifyContent: 'center' },
  deSalud: { overflow: 'hidden', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.4)', fontFamily: letras.texto, fontSize: 11, color: colores.salvia },
  opciones: { marginTop: 22, gap: 10 },
  dos: { flexDirection: 'row' },
  tres: { marginTop: 0, flexDirection: 'row', gap: 6 },
  ritmo: { marginTop: 20 },
  kcal: { marginTop: 2, alignItems: 'center' },
  kcalNumero: { fontFamily: letras.numeroLiviano, fontSize: 44, lineHeight: 48, letterSpacing: -0.8, color: colores.cifra, fontVariant: ['tabular-nums'], ...SOMBRA },
  kcalTexto: { fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 1.9, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.6)' },
  macros: { marginTop: 22, alignSelf: 'center', width: '100%', maxWidth: 300, gap: 8 },
  macro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  macroPunto: { width: 8, height: 8, borderRadius: 4 },
  macroNombre: { flex: 1, fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.8)' },
  macroGramos: { fontFamily: letras.numero, fontSize: 14, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  saltar: { position: 'absolute', right: 18, padding: 6 },
  saltarTexto: { fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.62)' },
  constelacion: { position: 'absolute', left: 26, width: 92, height: 22 },
  constelacionLinea: { position: 'absolute', height: 1, backgroundColor: 'rgba(239, 230, 207, 0.12)' },
  constelacionHecha: { backgroundColor: 'rgba(232, 196, 106, 0.45)' },
  constelacionEstrella: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(239, 230, 207, 0.2)' },
  constelacionEncendida: { backgroundColor: colores.oroClaro },
  constelacionAhora: { backgroundColor: colores.cifra, shadowColor: colores.cifra, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  dicho: { position: 'absolute', flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.12)', backgroundColor: 'rgba(6, 10, 22, 0.6)' },
  dichoTexto: { flex: 1, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 15.5, lineHeight: 19, color: 'rgba(239, 230, 207, 0.92)' },
  dichoFilas: { position: 'absolute' },
  dichoFila: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 6, paddingHorizontal: 2, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  dichoNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  dichoPorcion: { fontFamily: letras.textoLiviano, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.6)' },
  dichoKcal: { fontFamily: letras.numero, fontSize: 13.5, color: 'rgba(239, 230, 207, 0.84)', fontVariant: ['tabular-nums'] },
  dichoTotal: { position: 'absolute', textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, color: colores.oroClaro },
  busca: { position: 'absolute', height: 40, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13, borderRadius: 13, backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  buscaTexto: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  baseFilas: { position: 'absolute', gap: 8 },
  baseFila: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.58)' },
  baseMarca: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.25)' },
  baseMarcaLuz: { position: 'absolute', left: -1, top: -1, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.7)' },
  baseTextos: { flex: 1, minWidth: 0 },
  baseNombre: { fontFamily: letras.textoMedio, fontSize: 14.5, color: colores.pergamino },
  basePorcion: { marginTop: 1, fontFamily: letras.textoLiviano, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.62)' },
  baseMacros: { flexDirection: 'row', gap: 2, width: 60, height: 3, marginTop: 4, borderRadius: 2, overflow: 'hidden' },
  baseKcal: { fontFamily: letras.numero, fontSize: 14, color: 'rgba(239, 230, 207, 0.86)', fontVariant: ['tabular-nums'] },
  baseNota: { position: 'absolute', alignItems: 'center', gap: 7 },
  baseVerificado: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.7)' },
  noche: { position: 'absolute', paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.58)' },
  nocheCab: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 },
  nocheRotulo: { fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.58)' },
  nocheCifra: { fontFamily: letras.numero, fontSize: 24, color: colores.cifra, fontVariant: ['tabular-nums'] },
  nocheGrafico: { height: NOCHE.grafico, overflow: 'hidden' },
  nocheDatos: { flexDirection: 'row', gap: 8, marginTop: 12 },
  nocheDato: { flex: 1, gap: 3 },
  nocheDatoTitulo: { fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.6)' },
  nocheDatoValor: { fontFamily: letras.numero, fontSize: 15, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  nochesCaja: { position: 'absolute', gap: 8 },
  noches: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 46 },
  nocheBarra: { flex: 1, borderRadius: 2, backgroundColor: 'rgba(239, 230, 207, 0.32)' },
  nocheVacia: { height: 2, backgroundColor: 'rgba(239, 230, 207, 0.14)' },
  nocheBien: { backgroundColor: 'rgba(166, 191, 148, 0.6)' },
  camino: { position: 'absolute', flexDirection: 'row', gap: 6 },
  caminoHilo: { position: 'absolute', top: 5, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.2)' },
  caminoLleno: { height: 1, backgroundColor: colores.oro },
  caminoPunto: { flex: 1, alignItems: 'center', gap: 3 },
  caminoNodo: { width: 11, height: 11, marginBottom: 7, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.5)', backgroundColor: '#0c1124' },
  caminoNodoLuz: { position: 'absolute', left: -1, top: -1, width: 11, height: 11, borderRadius: 6, backgroundColor: colores.oro, shadowColor: colores.oro, shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } },
  caminoTitulo: { fontFamily: letras.textoMedio, fontSize: 14, color: colores.pergamino },
  caminoTexto: { textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 16, color: 'rgba(239, 230, 207, 0.72)' },
  caminoNota: { position: 'absolute', textAlign: 'center', fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.66)' },
});
