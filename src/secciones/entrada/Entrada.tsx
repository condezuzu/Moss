// La entrada a la app, la de la galería (galeria/src/entrada.js): la frase de apertura, dos
// diapositivas (con la suscripción prendida, la introducción más larga: la comida, la base, el sueño,
// los dos juntos, los hábitos y lo que cuesta, y al final la pantalla de pago), tus datos (qué guarda
// Moss y el consentimiento para los datos de salud), la cuenta (solo con Apple) y el cuestionario nuevo,
// como el de MacroFactor (Preguntas.tsx): Salud, tus datos, los cuidados (D44), la grasa, cuánto te mueves,
// el entreno y cuándo, lo que quieres lograr, el peso meta con su ritmo o su fecha, lo que sigue, cómo
// quieres comer y tu día. Lo que no aplica se saltea. La recorre una estrella guía (Guia.tsx, con el guion
// de guion.ts): en la frase y las diapositivas espera abajo y tocarla es seguir, así que no se saltean; con
// la suscripción, «Saltar» lleva a lo que cuesta, que no se saltea. Desde la segunda pregunta, «Atrás»
// vuelve a la anterior con lo contestado. Cada pantalla tiene su lugar en el cielo: la cámara sube a medida
// que se avanza. Al final la estrella se va y un «flum» (src/cielo/viaje.ts) lleva hasta hoy: en la mitad se
// guarda todo (el perfil, el peso de hoy, la meta y, en el teléfono, lo nuevo y los cuidados) y aparece Inicio.

import * as AppleAuthentication from 'expo-apple-authentication';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, AppState, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming,
  type EntryExitAnimationFunction, type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { actualizarSalud, elAlmacen } from '@/almacen';
import { DURACION_DEL_VIAJE, loQueSeVa, MITAD_DEL_VIAJE } from '@/cielo/viaje';
import { avanceDelViaje, viajar } from '@/cielo/viajar';
import { buscarConstelacion } from '@/datos/catalogo';
import { EDAD_MINIMA } from '@/dominio/metas';
import { DIA_DEL_AVISO, DIAS_DE_PRUEBA } from '@/dominio/premium';
import { deudaDeSueno, redondearDeuda, ultimasNoches } from '@/dominio/sueno';
import { hayCompras } from '@/lib/premium';
import { abrirPagina } from '@/lib/sitio';
import { haySupabase } from '@/lib/supabase';
import { pasosPorDia } from '@/salud/leer';
import { datosDelCuestionario, haySalud, pedirPermisos } from '@/salud/salud';
import { movimientoPorPasos } from '@/dominio/cuestionario';
import { lista, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { COLOR_DE_MACRO, Icono } from '../comida/comunes';
import { duracion, horaDelDia, numero } from '../comida/datos';
import { Luna } from '../comida/Luna';
import { ejemplo } from '../ejemplo';
import { Columnas, Hipnograma } from '../graficos/Graficos';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { entrarConApple, hayApple, type ErrorDeCuenta } from './cuenta';
import { Guia } from './Guia';
import {
  ALTO_PARA_LO_DICHO, anclas as medirAnclas, barraEn, BASE, esDiapositiva, estado, guionDe, guionDeSalida, INTRO, JUNTOS, LUNA, NOCHE, PALABRAS, reposo,
  type Anclas, type EscenaDeLuna, type Evento, type Guion, type Lugar, type Paso, type Recorrido,
} from './guion';
import { EjemploDeJuntos, ofrecerPremium, usePreciosDeLaEntrada } from '../premium/Premium';
import { Anillos, Casiopea } from './Lienzos';
import { Boton } from './piezas';
import { Cabeza, Desliza, Espacio, PantallaDePregunta, Pie, Resultado, Texto, Titulo, TOPE, type DeSalud } from './Preguntas';
import { aplica, DE_FABRICA, desdeLoGuardado, lugarDe, paraGuardar, PREGUNTAS, type Contestado, type Pregunta } from './respuestas';

/** Cada pantalla y dónde queda la cámara: sube a medida que se avanza, como en la galería. */
const PASOS: readonly { id: Paso; camara: number }[] = [
  { id: 'frase', camara: 0 },
  { id: 'habitos', camara: 0.42 },
  { id: 'comida', camara: 0.8 },
  { id: 'datos', camara: 0.98 },
  { id: 'cuenta', camara: 1.08 },
  { id: 'salud', camara: 1.16 },
  { id: 'tu', camara: 1.18 },
  { id: 'sexo', camara: 1.18 },
  { id: 'edad', camara: 1.19 },
  { id: 'altura', camara: 1.2 },
  { id: 'peso', camara: 1.21 },
  { id: 'cuidado', camara: 1.22 },
  { id: 'grasa', camara: 1.235 },
  { id: 'movimiento', camara: 1.25 },
  { id: 'entreno', camara: 1.26 },
  { id: 'cuando', camara: 1.27 },
  { id: 'objetivo', camara: 1.28 },
  { id: 'experiencia', camara: 1.29 },
  { id: 'meta', camara: 1.3 },
  { id: 'despues', camara: 1.315 },
  { id: 'comer', camara: 1.33 },
  { id: 'dia', camara: 1.345 },
  { id: 'resultado', camara: 1.37 },
];
const esPregunta = (p: Paso | undefined): p is Pregunta => !!p && PREGUNTAS.some((x) => x.id === p);

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

/** Lo que deja cada pantalla arriba, debajo del borde del teléfono. */
const ARRIBA = 28;
/** Lo que deja cada pantalla a los costados. */
const LADOS = 26;
const CASIOPEA = buscarConstelacion('cassiopeia');
/** Lo que se contesta se guarda con esta espera: el deslizador cambia muchas veces por segundo. */
const ESPERA_DEL_AVANCE = 400;
/** Un fundido no es movimiento: con Reducir movimiento también se ve (si no, aparecía de golpe). */
const fundido = (demora: number, ms: number) => FadeIn.delay(demora).duration(ms).reduceMotion(ReduceMotion.Never);
/** Lo que entra subiendo; con Reducir movimiento, solo con el fundido. */
const subiendo = (reducido: boolean, demora: number, ms: number) => (reducido ? fundido(demora, ms) : FadeInDown.delay(demora).duration(ms));
const SE_APAGA = FadeOut.duration(200).reduceMotion(ReduceMotion.Never);
/** La de antes se va para abajo al volver con «Atrás»: arranca suave y termina rápido, como en la galería. */
const SE_VA_BAJANDO = Easing.in(Easing.quad);

/**
 * La pantalla que se va: al seguir, con un fundido; al volver con «Atrás», para abajo, mientras la nueva entra
 * desde arriba (al revés que al seguir). La dirección se lee al irse: la pantalla se dibujó por última vez
 * antes de saber adónde se iba.
 */
function salidaDeLaPantalla(haciaAtras: SharedValue<boolean>): EntryExitAnimationFunction {
  return () => {
    'worklet';
    const baja = haciaAtras.get();
    const como = baja ? { duration: 400, easing: SE_VA_BAJANDO } : { duration: 320 };
    return {
      initialValues: { opacity: 1, transform: [{ translateY: 0 }] },
      animations: { opacity: withTiming(0, como), transform: [{ translateY: withTiming(baja ? 34 : 0, como) }] },
    };
  };
}

function vibrar(e: Evento) {
  if (e === 'completo') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  else if (e === 'toque') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else Haptics.selectionAsync().catch(() => {});
}

type Retomar = { i: number; r: Contestado; deSalud: DeSalud };

/**
 * Dónde sigue lo guardado en el paso `id`: la lista cambia con la suscripción (y sin cuenta), así que el
 * mismo número puede ser otra pantalla. Si esta versión no tiene ese paso, el anterior más cercano que sí;
 * una pregunta del cuestionario de antes (la actividad), desde Salud.
 */
function retomarEn(id: string, pasos: readonly { id: Paso }[]): number {
  const aca = pasos.findIndex((p) => p.id === id);
  if (aca >= 0) return aca;
  const enLaLarga = PASOS_CON_PAGO.findIndex((p) => p.id === id);
  if (enLaLarga < 0) return Math.max(0, pasos.findIndex((p) => p.id === 'salud'));
  for (let k = enLaLarga - 1; k >= 0; k--) {
    const anterior = pasos.findIndex((p) => p.id === PASOS_CON_PAGO[k].id);
    if (anterior >= 0) return anterior;
  }
  return 0;
}

function avanceInicial(pasos: readonly { id: Paso }[]): Retomar {
  const e = elAlmacen().estado();
  const a = e.avanceDeEntrada as { i?: unknown; id?: unknown; r?: Partial<Contestado>; deSalud?: unknown } | null;
  // Lo guardado antes, sin el id del paso, sigue con el número.
  const i = typeof a?.id === 'string' ? retomarEn(a.id, pasos) : typeof a?.i === 'number' && a.i >= 0 && a.i < pasos.length ? a.i : null;
  if (a && i !== null && a.r) {
    return { i, r: { ...DE_FABRICA, ...a.r }, deSalud: new Set(Array.isArray(a.deSalud) ? a.deSalud : []) as DeSalud };
  }
  // Si la cuenta ya tenía un perfil, sus respuestas vienen llenas.
  return { i: 0, r: e.perfil ? desdeLoGuardado(e) : DE_FABRICA, deSalud: new Set() };
}

export function Entrada({ camara, alTerminar }: { camara: SharedValue<number>; alTerminar?: () => void }) {
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const reducido = useReducedMotion();
  const [pasos] = useState(pasosDeEstaVersion);
  // Se retoma donde quedó.
  const [inicio] = useState(() => avanceInicial(pasos));
  const [i, setI] = useState(inicio.i);
  const [r, setR] = useState<Contestado>(inicio.r);
  const [deSalud, setDeSalud] = useState<DeSalud>(inicio.deSalud);
  const [terminando, setTerminando] = useState(false);
  // Si a la pantalla de ahora se llegó con «Atrás»: entra desde arriba y la de antes se va para abajo.
  const [volviendo, setVolviendo] = useState(false);
  const haciaAtras = useSharedValue(false);
  const salida = useMemo(() => salidaDeLaPantalla(haciaAtras), [haciaAtras]);
  const paso = pasos[i];
  const hoy = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().hoy);
  const noches = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().salud?.noches ?? SIN_NOCHES);

  // La estrella guía: el guion de la pantalla de ahora y el reloj que lo recorre (ms desde que empezó).
  const a = useMemo(() => medirAnclas(W, H, insets.top, insets.bottom, ARRIBA, LADOS), [W, H, insets.top, insets.bottom]);
  const recorrido = useSharedValue<Recorrido | null>(null);
  const reloj = useSharedValue(0);
  // Lo que lleva la barra: el lugar de la pregunta entre las que aparecen con lo contestado.
  const kDe = (j: number, x: Contestado = r) => {
    const id = pasos[j]?.id;
    if (!esPregunta(id)) return 0;
    const l = lugarDe(id, x);
    return (l.i + 1) / l.total;
  };
  const guionPara = (j: number, desde: Lugar, x?: Contestado) => guionDe(pasos[j].id, a, desde, kDe(j, x), CASIOPEA, hayCompras());
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
  const edadDeSalud = (paso.id === 'tu' || paso.id === 'edad') && deSalud.has('edad');
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

  const irA = (j: number, atras = false, x?: Contestado) => {
    setEspera(false);
    setVolviendo(atras);
    haciaAtras.set(atras);
    // La estrella sale de donde está: en la barra, al volver, retrocede hasta la pregunta de antes.
    setGuion(guionPara(j, lugarDeAhora(), x));
    setI(j);
  };
  // La que sigue entre las que aparecen con lo contestado; lo de la pantalla de ahora ya está en `r`.
  const siguiente = (x: Contestado = r) => {
    let j = i + 1;
    while (j < pasos.length - 1 && esPregunta(pasos[j].id) && !aplica(pasos[j].id as Pregunta, x)) j++;
    if (j < pasos.length) irA(j, false, x);
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
  const poner = useCallback((cambio: (x: Contestado) => Contestado, deSaludQueSeVa?: 'edad' | 'sexo' | 'alturaCm' | 'pesoKg') => {
    setR(cambio);
    // Lo que se cambia a mano ya no es de Salud.
    if (deSaludQueSeVa) {
      setDeSalud((antes) => {
        if (!antes.has(deSaludQueSeVa)) return antes;
        const nuevo = new Set(antes);
        nuevo.delete(deSaludQueSeVa);
        return nuevo;
      });
    }
  }, []);

  // El final: el «flum» lleva hasta hoy y en la mitad, con la entrada ya apagada, la cámara queda en hoy y se
  // guarda todo; con el perfil guardado, Secciones deja la entrada y aparece Inicio. Con Reducir movimiento,
  // sin viaje: la entrada se apaga y la cámara baja.
  const salir = (guardar: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const cambiar = () => {
      camara.set(0);
      guardar();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    };
    if (!reducido) return viajar(cambiar);
    camara.set(0);
    const espera = setTimeout(cambiar, 200);
    return () => clearTimeout(espera);
  };
  const terminar = () => {
    if (saliendo || !r.sexo) {
      empezo.current = false;
      return;
    }
    setTerminando(true);
    // La estrella sube y se va, como en la galería antes del flum.
    setGuion(guionDeSalida(lugarDeAhora()));
    const { c, nuevo } = paraGuardar(r, hoy, noches);
    salir(() => {
      elAlmacen().responderCuestionario(c, deSalud.has('pesoKg') ? 'salud' : 'manual', nuevo);
      // Los primeros hábitos suben cuando el viaje ya llegó, como en la galería: antes tapaban a Inicio llegando.
      if (alTerminar) setTimeout(alTerminar, reducido ? 0 : DURACION_DEL_VIAJE * (1 - MITAD_DEL_VIAJE));
    });
  };
  const empezar = () => {
    if (empezo.current || saliendo) return;
    empezo.current = true;
    ofrecerPremium(terminar, reiniciar);
  };
  useEffect(() => {
    if (!conLaCuenta || terminando) return;
    return salir(() => elAlmacen().terminarEntrada());
    // Solo importa cuándo llega el perfil: salir es otra función en cada dibujo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conLaCuenta]);

  // Al salir, la entrada crece y se apaga hacia la cámara con la primera mitad del viaje. Antes de que arranque
  // el avance está quieto en 1, y la entrada se desmonta en la mitad: hasta entonces, 1 es «todavía no».
  // Con Reducir movimiento se apaga igual (de fábrica, withTiming lo saltearía) pero sin agrandarse.
  const estiloSalida = useAnimatedStyle(() => {
    if (reducido) return { opacity: withTiming(saliendo ? 0 : 1, { duration: 700, reduceMotion: ReduceMotion.Never }), transform: [{ scale: 1 }] };
    const u = avanceDelViaje.get();
    const v = loQueSeVa(saliendo && u < 1 ? u : 0);
    return { opacity: v.opacidad, transform: [{ scale: v.escala }] };
  });

  const pregunta = esPregunta(paso.id) ? paso.id : null;
  // Salud dijo menos de 16: Moss no sigue (Menor), y tampoco se vuelve a la pregunta de antes.
  const menor = (paso.id === 'edad' || paso.id === 'tu') && deSalud.has('edad') && r.edad < EDAD_MINIMA;
  // «Atrás», desde la segunda pregunta: la de antes que aparece con lo contestado (el avance se guarda por pantalla).
  let anterior = -1;
  if (pregunta && !menor) {
    for (let j = i - 1; j >= 0 && esPregunta(pasos[j].id); j--) {
      if (aplica(pasos[j].id as Pregunta, r)) {
        anterior = j;
        break;
      }
    }
  }
  const atras = () => {
    if (anterior < 0 || saliendo) return;
    Haptics.selectionAsync().catch(() => {});
    irA(anterior, true);
  };
  const relleno = { paddingTop: insets.top + ARRIBA, paddingBottom: insets.bottom + 24 };
  // La frase, las diapositivas y la cuenta tienen lo suyo en un lugar fijo, el que recorre la estrella: no corren.
  const fija = esDiapositiva(paso.id) || paso.id === 'cuenta';
  const conPago = hayCompras();
  const lugar = pregunta ? lugarDe(pregunta, r) : null;
  return (
    <Animated.View style={[StyleSheet.absoluteFill, estiloSalida]} pointerEvents={saliendo ? 'none' : 'box-none'}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View
          key={paso.id}
          entering={reducido ? ENTRA_FUNDIDO : (volviendo ? FadeInUp : FadeInDown).delay(i === 0 ? 120 : 280).duration(620)}
          exiting={reducido ? SALE_FUNDIDO : salida}
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
                {paso.id === 'cuenta' && <Cuenta alEntrar={() => siguiente()} />}
              </View>
              {conPago && INTRODUCCION.includes(paso.id) && <ConstelacionDeIntro i={INTRODUCCION.indexOf(paso.id)} arriba={insets.top + 4} />}
            </>
          ) : (
            // Con VoiceOver, el gesto de escape también vuelve a la pregunta de antes.
            <View style={[s.pantalla, relleno]} onAccessibilityEscape={anterior >= 0 ? atras : undefined}>
              {lugar && <Cabeza i={lugar.i} total={lugar.total} alAtras={anterior >= 0 ? atras : undefined} />}
              {paso.id === 'datos' && <TusDatos alSeguir={() => siguiente()} />}
              {paso.id === 'salud' && (
                <Salud
                  alSeguir={siguiente}
                  alLeer={(d, pasos) => {
                    const sugerido = movimientoPorPasos(pasos);
                    const x: Contestado = { ...r, ...d, salud: true, pasosDeSalud: pasos, movimientoSugerido: sugerido, movimiento: sugerido ?? r.movimiento };
                    setR(x);
                    setDeSalud(new Set(Object.keys(d) as ('edad' | 'sexo' | 'alturaCm' | 'pesoKg')[]));
                    return x;
                  }}
                />
              )}
              {pregunta && pregunta !== 'salud' && <PantallaDePregunta id={pregunta} r={r} poner={poner} deSalud={deSalud} hoy={hoy} noches={noches} alSeguir={() => siguiente()} />}
              {paso.id === 'resultado' && <Resultado r={r} hoy={hoy} alEmpezar={empezar} boton={conPago ? t('entrada.seguir') : t('entrada.cuestionario.empezar')} />}
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
      <Guia recorrido={recorrido} reloj={reloj} anclas={a} reducido={reducido} tocable={esDiapositiva(paso.id) && !saliendo} lista={espera} alTocar={() => siguiente()} />
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

const SIN_NOCHES: never[] = [];

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
        {/* Las columnas de la galería, contra las 8 h (la línea punteada). */}
        <Columnas valores={noches.map((x) => (x ? x.dormido : null))} meta={8 * 60} ancho={a.W - 2 * a.barra.x0} alto={60} />
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
    if (resultado.ok) {
      // Sigue «Entrando…» hasta que la pantalla se va: el botón de Apple no vuelve a asomar.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      alEntrar();
      return;
    }
    enCamino.current = false;
    setOcupado(false);
    setError(resultado.error);
    if (resultado.error) anunciar(t(`entrada.cuenta.errores.${resultado.error}`));
  };
  // La marca va arriba (Marca); abajo, Apple y lo que se acepta.
  return (
    <>
      <Espacio />
      <Animated.View entering={subiendo(reducido, 2100, 800)} style={s.botones}>
        <View>
          {apple ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={25}
              style={s.apple}
              onPress={entrar}
            />
          ) : (
            <Boton tipo="apple" texto={t('entrada.cuenta.apple')} alTocar={entrar} icono={<Icono nombre="applelogo" tam={17} color="#000" />} />
          )}
          {/* Mientras entra, la ruedita y «Entrando…» (aprobado en la galería el 9/11/2026). El botón de Apple no
              puede decirlo: va uno igual encima, que además no deja tocarlo dos veces. */}
          {ocupado && (
            <Animated.View
              entering={ENTRA_FUNDIDO}
              exiting={SALE_FUNDIDO}
              style={[StyleSheet.absoluteFill, s.entrando]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={t('entrada.cuenta.entrando')}
              accessibilityState={{ busy: true, disabled: true }}
            >
              <ActivityIndicator color="rgba(0, 0, 0, 0.72)" />
              <Text style={s.entrandoTexto} maxFontSizeMultiplier={TOPE}>{t('entrada.cuenta.entrando')}</Text>
            </Animated.View>
          )}
        </View>
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
      <Desliza>
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
      </Desliza>
      <Pie>
        <Boton texto={t('entrada.datos.acepto')} alTocar={alSeguir} />
      </Pie>
    </>
  );
}

// ------------------------------------------------------------------ el cuestionario
const ICONOS_DE_SALUD = ['figure.walk', 'moon.zzz', 'brain.head.profile', 'drop', 'scalemass'] as const;

/** Conectar con Salud trae la edad, el sexo, la altura y el peso: con eso, la pregunta que sigue es «Esto dice Salud». */
function Salud({ alSeguir, alLeer }: { alSeguir: (x?: Contestado) => void; alLeer: (d: Partial<Pick<Contestado, 'edad' | 'sexo' | 'alturaCm' | 'pesoKg'>>, pasos: number | null) => Contestado }) {
  const [ocupado, setOcupado] = useState(false);
  const enCamino = useRef(false);
  const hay = haySalud();
  const conectar = async () => {
    if (enCamino.current) return;
    enCamino.current = true;
    setOcupado(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    let x: Contestado | undefined;
    if (await pedirPermisos()) {
      // Con los pasos de las últimas dos semanas, la respuesta de «¿Cuánto te mueves?» ya viene sugerida.
      const [datos, pasos] = await Promise.all([datosDelCuestionario(), pasosPorDia().catch(() => null)]);
      x = alLeer(datos, pasos);
      actualizarSalud().catch(() => {});
    }
    setOcupado(false);
    alSeguir(x);
  };
  return (
    <>
      <Desliza>
      <Titulo>{t('entrada.cuestionario.saludTitulo')}</Titulo>
      <Texto>{t('entrada.cuestionario.saludTexto')}</Texto>
      <View style={s.iconosDeSalud}>
        {ICONOS_DE_SALUD.map((nombre, k) => (
          <Animated.View key={nombre} entering={fundido(200 + k * 160, 600)} style={s.iconoDeSalud}>
            <Icono nombre={nombre} tam={19} color="rgba(239, 230, 207, 0.55)" />
          </Animated.View>
        ))}
      </View>
      </Desliza>
      <Pie>
        {hay && <Boton texto={t('entrada.cuestionario.conectar')} alTocar={conectar} desactivado={ocupado} />}
        <Boton tipo={hay ? 'secundario' : 'principal'} texto={hay ? t('entrada.cuestionario.ahoraNo') : t('entrada.seguir')} alTocar={() => alSeguir()} desactivado={ocupado} />
      </Pie>
    </>
  );
}

const SOMBRA = { textShadowColor: 'rgba(3, 5, 12, 0.95)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 0 } };

const s = StyleSheet.create({
  pantalla: { flex: 1, paddingHorizontal: 26 },
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
  pie: { gap: 10, width: '100%', maxWidth: 340, alignSelf: 'center', paddingTop: 18 },
  centrado: { textAlign: 'center', alignSelf: 'center' },
  fija: { flex: 1 },
  frase: { position: 'absolute', left: 28, right: 28, top: 0, alignItems: 'center', justifyContent: 'center' },
  fraseTexto: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 7, maxWidth: 230 },
  palabra: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 29, lineHeight: 36, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.35)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  autor: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 10.5, letterSpacing: 2.3, textTransform: 'uppercase', color: 'rgba(185, 227, 107, 0.75)' },
  lunaGrande: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  lunaFija: { position: 'absolute' },
  marcaCaja: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  marca: { flexDirection: 'row' },
  marcaLetra: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 66, lineHeight: 72, color: colores.cifra, textShadowColor: 'rgba(232, 196, 106, 0.45)', textShadowRadius: 22, textShadowOffset: { width: 0, height: 0 } },
  lema: { marginTop: 8, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 18, color: 'rgba(239, 230, 207, 0.72)' },
  botones: { width: '100%', maxWidth: 330, alignSelf: 'center', gap: 10 },
  apple: { width: '100%', height: 50 },
  // El botón blanco de Apple, con la ruedita y «Entrando…» en vez de su texto.
  entrando: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 25, backgroundColor: '#fff' },
  entrandoTexto: { fontFamily: letras.textoMedio, fontSize: 15.5, letterSpacing: 0.15, color: '#000' },
  error: { marginTop: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: '#f0a58a', textAlign: 'center' },
  iconosDeSalud: { marginTop: 38, flexDirection: 'row', justifyContent: 'center', gap: 16 },
  iconoDeSalud: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: 'rgba(166, 191, 148, 0.25)', alignItems: 'center', justifyContent: 'center' },
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
