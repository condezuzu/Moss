// El cielo de la etapa 1: lo que la galería mostró, ahora en Skia y en el hilo de la interfaz.
// Un pase de shader dibuja el cielo (fijo + aurora + estrellas que titilan); encima van las líneas
// y dos Atlas con todas las luces (antes y después del musgo). React solo dibuja el texto.

import {
  Atlas,
  BlurMask,
  Canvas,
  DashPathEffect,
  Fill,
  FilterMode,
  Group,
  ImageShader,
  MipmapMode,
  Path,
  Shader,
  Skia,
  useTexture,
  type SkColor,
  type SkHostRect,
  type SkPath,
  type SkRSXform,
} from '@shopify/react-native-skia';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AccessibilityInfo, PixelRatio, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useCompetingGestures, useLongPressGesture, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { useAnimatedReaction, useDerivedValue, useFrameCallback, useSharedValue, type DerivedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { riquezaDe } from '@/dominio/luz';
import { calidadDeFabrica, unEscalonMenos } from './calidad';
import { useCalidadElegida, useCieloDeHoy, useEncendidos } from './dia';
import { efectos } from './efectos';
import {
  avancesNuevos,
  CAPACIDAD_CIELO,
  CAPACIDAD_FRENTE,
  claveDeApagados,
  completarDia,
  crearEscena,
  estrellaEn,
  lanzarFugaz,
  paso,
  ponerEncendidos,
  repetirAnimacion,
  simularSalud,
  tocar,
  type Escena,
  type Evento,
} from './escena';
import { DIAGNOSTICO, Interfaz, type Aviso } from './Interfaz';
import { CELDA, crearReserva, volcarLuces, type Reserva } from './luces';
import { CALIDADES, HORIZONTE, PARALAJE, VIA_LACTEA, ZONA_UNIVERSO, type Calidad } from './mundo';
import type { Brote } from './musgo';
import { armarPlano, armarPlanoDelMusgo, type Plano } from './plano';
import { useTextos } from './textosDelCielo';
import { entre, subirOBajar, UMBRAL, VELOCIDAD_MINIMA } from '@/secciones/movimiento';
import { colores } from '@/tema';

/** Hasta dónde sube la cámara del cielo con Ascent arriba: menos que el dedo, porque está más lejos. */
const CAMARA_DE_ASCENT = 0.75;

const MUESTREO = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
const ORO = 'rgb(255, 204, 112)';
const PERGAMINO = 'rgb(240, 230, 207)';
const MUSGO_LUZ = 'rgb(189, 237, 115)';
const aRgb = ([r, g, b]: number[]) => `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

/**
 * Ascent, arriba de Hábitos: deslizar para arriba desde el cielo la sube siguiendo al dedo, y tocar
 * la flecha tenue también. Lo maneja este gesto, así un deslizamiento que empieza en la flecha
 * también sube.
 */
export type Subida = {
  /** Cuánto subió: 0 abajo, 1 arriba. */
  progreso: SharedValue<number>;
  /** Más abajo no arranca: ahí está la barra, y debajo, el gesto de inicio del iPhone. */
  limiteY: number;
  /** El centro de la flecha con la cámara en hoy. */
  flecha: { x: number; y: number };
  alCambiar: (abierta: boolean) => void;
};

export type PropsDelCielo = {
  /** Cuánto está corrida la pestaña Hábitos, en puntos. */
  paginaX?: SharedValue<number>;
  subida?: Subida;
  /** Lo que ocupa la barra de pestañas abajo, con el borde del teléfono. */
  abajo?: number;
  /**
   * La entrada a la app: el cielo solo, sin la constelación del día, sin gestos ni texto, con la
   * cámara donde la pida cada pantalla (como el modo «entrada» de la galería).
   */
  entrada?: { camara: SharedValue<number> };
  /** Mantener apretada una estrella abre el editor de su hábito. */
  alEditarHabito?: (id: string) => void;
};

const RIQUEZA_DE_LA_ENTRADA = 0.6;
const RIQUEZA_INICIAL = 0.6;

export default function Cielo({ paginaX, subida, abajo = 0, entrada, alEditarHabito }: PropsDelCielo) {
  const soloCielo = !!entrada;
  const camaraDeLaEntrada = entrada?.camara;
  const { width: ancho, height: alto } = useWindowDimensions();
  const dpr = PixelRatio.get();
  // La elegida en Perfil manda; si no, la automática, que arranca según el modelo y baja un
  // escalón si el teléfono no llega. El panel de prueba la puede forzar.
  const elegida = useCalidadElegida();
  const [automatica, setAutomatica] = useState<Calidad>(calidadDeFabrica);
  const [delPanel, setDelPanel] = useState<Calidad | null>(null);
  const calidad = delPanel ?? elegida ?? automatica;
  const ajustes = CALIDADES[calidad];
  const [movimientoReducido, setMovimientoReducido] = useState(false);
  // El día viene del almacén. Lo que React sabe alcanza para el texto; lo que se anima vive en la
  // escena, y un toque se guarda después de verse.
  const dia = useCieloDeHoy();
  const encendidos = useEncendidos();
  const completo = encendidos.length > 0 && encendidos.every(Boolean);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [cuadros, setCuadros] = useState(0);
  const [fondoListo, setFondoListo] = useState(false);
  const [vuelta, setVuelta] = useState(0);
  // El progreso es el cielo: sale de la luz juntada desde siempre. El panel de prueba la puede forzar.
  // La entrada muestra el de 0,6 como promesa, como la galería (D5); el propio arranca en 0.
  const [riquezaForzada, setRiquezaForzada] = useState<number | null>(null);
  // El cielo arranca como en la galería (60 %) y la luz juntada lo lleva hasta el 100 %: desde cero
  // se veía apagado, sin color.
  const riqueza = riquezaForzada ?? (soloCielo ? RIQUEZA_DE_LA_ENTRADA : RIQUEZA_INICIAL + (1 - RIQUEZA_INICIAL) * riquezaDe(dia.luzAcumulada));

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setMovimientoReducido).catch(() => {});
  }, []);

  const plano: Plano = useMemo(() => armarPlano(ancho, alto, dia), [ancho, alto, dia]);
  const musgo = useMemo(() => armarPlanoDelMusgo(ancho, alto, riqueza), [ancho, alto, riqueza]);

  // Solo en la web, que es donde se prueba: dónde quedó cada estrella, para las capturas automáticas.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    (globalThis as { __cielo?: unknown }).__cielo = {
      estrellas: plano.etiquetas.map((e) => [e.x, e.y]),
      habitos: dia.habitos.map((h) => ({ nombre: h.nombre, auto: !!h.auto })),
    };
  }, [plano, dia]);

  const nuevaEscena = useCallback(
    (a: { encendidos: boolean[]; particulas: number; brotes: Brote[]; riqueza: number }) =>
      crearEscena({
        ancho,
        alto,
        habitos: soloCielo ? [] : plano.estrellas.map(([x, y], i) => ({ x, y, encendido: a.encendidos[i], auto: !!dia.habitos[i].auto, fija: dia.habitos[i].auto === 'comida' })),
        lineas: soloCielo ? [] : plano.lineas,
        centro: plano.centro,
        brotes: a.brotes,
        universo: soloCielo ? [] : plano.universo.estrellas,
        factorParticulas: a.particulas,
        riqueza: a.riqueza,
        movimientoReducido,
        contarCuadros: DIAGNOSTICO,
      }),
    [ancho, alto, plano, dia, movimientoReducido, soloCielo],
  );

  // Lo que la escena toma del momento en que se arma. Lo encendido, la calidad y la riqueza no la
  // rehacen: se cambian en la que está (más abajo), así el cielo no vuelve a aparecer desde negro.
  const deAhora = () => ({ encendidos, particulas: ajustes.particulas, brotes: musgo.brotes, riqueza });
  const valoresDeAhora = useEffectEvent(deAhora);
  const [escenaInicial] = useState(() => nuevaEscena(deAhora()));
  const escena = useSharedValue<Escena>(escenaInicial);
  // Otro tamaño, otro día u otros hábitos, o reiniciar: escena nueva con los hábitos como están.
  // La textura del cielo fijo sigue siendo la misma, así que el cielo aparece enseguida.
  useEffect(() => {
    escena.value = nuevaEscena(valoresDeAhora());
  }, [nuevaEscena, vuelta, escena]);
  useEffect(() => {
    const particulas = ajustes.particulas;
    const brotes = musgo.brotes;
    scheduleOnUI(() => {
      'worklet';
      escena.modify((e) => {
        'worklet';
        e.factorParticulas = particulas;
        e.brotes = brotes;
        e.riqueza = riqueza;
        return e;
      });
    });
  }, [ajustes.particulas, musgo, riqueza, escena]);
  // Lo que se enciende fuera del cielo (la comida, Salud, otro teléfono) llega a la escena que está.
  // Lo que se tocó acá ya está igual y no cambia nada.
  useEffect(() => {
    const lista = encendidos;
    scheduleOnUI(() => {
      'worklet';
      escena.modify((e) => {
        'worklet';
        ponerEncendidos(e, lista);
        return e;
      });
    });
  }, [encendidos, escena]);

  const t = useTextos();
  // Una sola vez, la primera vez que se ve Hábitos (la app abre en Inicio): qué hace tocar una estrella.
  const [vistoHabitos, setVistoHabitos] = useState(false);
  useAnimatedReaction(
    () => (paginaX ? Math.abs(paginaX.value) < 1 : true),
    (ahora, antes) => {
      if (ahora && !antes) scheduleOnRN(setVistoHabitos, true);
    },
  );
  useEffect(() => {
    if (soloCielo || !vistoHabitos) return;
    AsyncStorage.getItem('moss:globitoEstrellas').then((visto) => {
      if (visto) return;
      setAviso({ texto: t.t('cielo.globito'), clave: Date.now() });
      AsyncStorage.setItem('moss:globitoEstrellas', '1').catch(() => {});
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soloCielo, vistoHabitos]);

  // ------------------------------------------------------------------ texturas
  // El cielo fijo se dibuja una vez por tamaño, calidad y riqueza. Mientras llega la textura nueva
  // se sigue usando la anterior: el shader de cada cuadro lee su tamaño real (texFondo).
  const ef = efectos();
  const pxFondo = alto * Math.min(dpr, ajustes.dprFondo);
  // El fondo es caro de dibujar: cambia de a 5 %, no con cada hábito que se marca.
  const riquezaDelFondo = Math.round(riqueza * 20) / 20;
  const tamFondo = useMemo(
    () => ({ width: Math.ceil(plano.fondo.tam[0] * pxFondo), height: Math.ceil(plano.fondo.tam[1] * pxFondo) }),
    [plano, pxFondo],
  );
  const fondo = useTexture(
    <Fill>
      <Shader
        source={ef.fondo}
        uniforms={{
          uRes: [tamFondo.width, tamFondo.height],
          uMundoMin: plano.fondo.min,
          uMundoTam: plano.fondo.tam,
          uPxPorUnidad: pxFondo,
          uHorizonte: HORIZONTE,
          uOctavas: ajustes.octavas,
          uCapas: ajustes.capas,
          uSemilla: 7,
          uRiqueza: riquezaDelFondo,
          uVia: VIA_LACTEA,
        }}
      />
    </Fill>,
    tamFondo,
    [tamFondo, ajustes.octavas, ajustes.capas, riquezaDelFondo],
  );
  const texFondo = useDerivedValue(() => {
    const f = fondo.value;
    return f ? [f.width(), f.height()] : [1, 1];
  });
  const tamHoja = useMemo(() => ({ width: CELDA * 6, height: CELDA }), []);
  const hoja = useTexture(
    <Fill>
      <Shader source={ef.hoja} uniforms={{ uCelda: CELDA }} />
    </Fill>,
    tamHoja,
  );

  // ------------------------------------------------------------------ eventos de la escena
  const alEventos = useCallback(
    (eventos: Evento[]) => {
      for (const ev of eventos) {
        if (ev.tipo === 'cuadros') { setCuadros(ev.valor); continue; }
        if (ev.tipo === 'lento') { setAutomatica((c) => unEscalonMenos(c)); continue; }
        if (ev.tipo === 'listo') { setFondoListo(true); continue; }
        if (ev.tipo === 'completo') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          continue;
        }
        if (ev.tipo === 'incompleto') continue;
        const h = dia.habitos[ev.indice];
        const nombre = h.nombre;
        if (ev.tipo === 'automatico') {
          Haptics.selectionAsync().catch(() => {});
          if (h.auto === 'comida') {
            setAviso({ texto: t.t('cielo.seEnciendeConLaComida'), clave: Date.now() });
            continue;
          }
          const valor = t.valorAutomatico(h);
          setAviso({ texto: valor ? `${t.t('cielo.seEnciendeSola')} · ${valor}` : t.t('cielo.seEnciendeSola'), clave: Date.now() });
          continue;
        }
        const prendida = ev.tipo !== 'apagada';
        elAlmacen().marcar(h.id, prendida, ev.tipo === 'salud' ? 'salud' : 'toque');
        if (ev.tipo === 'salud') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
          setAviso({ texto: t.t('cielo.desdeSalud', { habito: nombre }), clave: Date.now() });
        } else {
          if (prendida) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          else Haptics.selectionAsync().catch(() => {});
          // Sin «Deshacer»: tocar otra vez la estrella la apaga.
          setAviso({ texto: t.t(prendida ? 'cielo.encendida' : 'cielo.apagada', { habito: nombre }), clave: Date.now() });
        }
      }
    },
    [dia, t],
  );

  const drenar = useCallback(() => {
    'worklet';
    const e = escena.value;
    if (e.eventos.length === 0) return;
    const lista = e.eventos.splice(0, e.eventos.length);
    scheduleOnRN(alEventos, lista);
  }, [escena, alEventos]);

  // Las luces de los dos Atlas: las arma cada cuadro, solo las que hay, con objetos de Skia que se
  // reusan (luces.ts).
  const reservas = useSharedValue<{ cielo: Reserva; frente: Reserva } | null>(null);
  const rectsCielo = useSharedValue<SkHostRect[]>([]);
  const formasCielo = useSharedValue<SkRSXform[]>([]);
  const coloresCielo = useSharedValue<SkColor[]>([]);
  const rectsFrente = useSharedValue<SkHostRect[]>([]);
  const formasFrente = useSharedValue<SkRSXform[]>([]);
  const coloresFrente = useSharedValue<SkColor[]>([]);
  // Hasta dónde llegó cada línea y qué hábitos están apagados: sus caminos se rehacen solo con esto.
  const avances = useSharedValue<number[]>([]);
  const apagados = useSharedValue('');

  useFrameCallback((info) => {
    'worklet';
    const corrida = paginaX ? paginaX.value : 0;
    const ascent = subida ? subida.progreso.value : 0;
    // Detrás de las otras secciones el cielo se ve velado y quieto: no se calcula ni se vuelve a
    // dibujar, así cada cuadro queda para la interfaz. Se mueve en Hábitos, mientras se llega o se
    // va de ahí, con Ascent y en la entrada.
    const antes = escena.value;
    if (!soloCielo && ascent === 0 && antes.velado === 0 && antes.aparicion >= 1 && Math.abs(corrida) >= ancho && Math.abs(antes.paginaX) >= ancho) return;
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16.7) / 1000);
    const hayFondo = fondo.value !== null;
    escena.modify((e) => {
      'worklet';
      e.paginaX = corrida;
      if (camaraDeLaEntrada) e.cam.objetivo = camaraDeLaEntrada.value;
      // Ascent sube sobre el mismo cielo: la cámara sube con el dedo y lo de hoy se apaga en la
      // primera mitad del gesto. Cerrada, la cámara vuelve a ser del cielo.
      if (ascent > 0 || e.velado > 0) {
        e.cam.y = CAMARA_DE_ASCENT * ascent;
        e.cam.objetivo = e.cam.y;
        e.cam.v = 0;
        e.velado = Math.min(1, ascent * 2);
      }
      // El cielo aparece cuando hay textura. Si ya estaba (una escena rehecha), aparece enseguida.
      if (hayFondo && !e.fondoListo) {
        e.fondoListo = true;
        e.eventos.push({ tipo: 'listo' });
      }
      paso(e, dt);
      return e;
    }, true);
    const e = escena.value;
    let r = reservas.value;
    if (r === null) {
      r = { cielo: crearReserva(CAPACIDAD_CIELO), frente: crearReserva(CAPACIDAD_FRENTE) };
      reservas.value = r;
    }
    const cielo = volcarLuces(r.cielo, e.cielo, e.nCielo);
    rectsCielo.value = cielo.rects;
    formasCielo.value = cielo.formas;
    coloresCielo.value = cielo.colores;
    const frente = volcarLuces(r.frente, e.frente, e.nFrente);
    rectsFrente.value = frente.rects;
    formasFrente.value = frente.formas;
    coloresFrente.value = frente.colores;
    const nuevos = avancesNuevos(e);
    if (nuevos) avances.value = nuevos;
    const clave = claveDeApagados(e);
    if (clave !== apagados.value) apagados.value = clave;
    drenar();
  });

  // ------------------------------------------------------------------ gestos
  const toque = useTapGesture({
    maxDistance: 12,
    onActivate: (ev) => {
      'worklet';
      if (subida) {
        const e = escena.value;
        const fy = subida.flecha.y + e.cam.y * PARALAJE.lomas[2] * alto;
        if (e.paginaX === 0 && subida.progreso.get() === 0 && Math.abs(ev.x - subida.flecha.x) < 32 && Math.abs(ev.y - fy) < 22) {
          subida.progreso.set(subirOBajar(0, 1));
          scheduleOnRN(subida.alCambiar, true);
          return;
        }
      }
      escena.modify((e) => {
        'worklet';
        tocar(e, ev.x, ev.y);
        return e;
      }, true);
      drenar();
    },
  });
  // Arrastrar mueve la cámara: hacia abajo, el cielo baja y aparece tu universo. Hacia arriba, desde
  // hoy y arriba de la barra, sube Ascent. De costado es de las pestañas.
  // Se decide con el primer movimiento, desde donde se apoyó el dedo: arriba de la barra, en hoy
  // y para arriba, es Ascent; si no, la cámara.
  const modo = useSharedValue<'nada' | 'camara' | 'ascent'>('nada');
  const inicioY = useSharedValue(0);
  const arrastre = usePanGesture({
    activeOffsetY: [-10, 10],
    failOffsetX: [-14, 14],
    onBegin: (ev) => {
      'worklet';
      inicioY.set(ev.absoluteY);
      modo.set('nada');
    },
    onUpdate: (ev) => {
      'worklet';
      if (modo.get() === 'nada') {
        // El primer evento puede llegar sin movimiento todavía: se espera a que el dedo se mueva.
        if (Math.abs(ev.translationY) < 3) return;
        const actual = escena.value;
        const enHoy = actual.cam.objetivo === 0 && Math.abs(actual.cam.y) < 0.02 && actual.paginaX === 0;
        if (subida && ev.translationY < 0 && enHoy && inicioY.get() < subida.limiteY && subida.progreso.get() === 0) {
          modo.set('ascent');
        } else {
          modo.set('camara');
          escena.modify((e) => {
            'worklet';
            e.cam.arrastrando = true;
            e.cam.desde = e.cam.y - ev.translationY / e.alto;
            return e;
          });
        }
      }
      if (modo.get() === 'ascent' && subida) {
        subida.progreso.set(entre((-ev.translationY - 10) / alto, 0, 1));
        return;
      }
      escena.modify((e) => {
        'worklet';
        let y = e.cam.desde + ev.translationY / e.alto;
        if (y < 0) y *= 0.35;
        if (y > ZONA_UNIVERSO) y = ZONA_UNIVERSO + (y - ZONA_UNIVERSO) * 0.35;
        e.cam.y = y;
        e.cam.v = 0;
        return e;
      });
    },
    onDeactivate: (ev) => {
      'worklet';
      if (modo.get() === 'ascent' && subida) {
        const p = subida.progreso.get();
        const abrir = p >= UMBRAL || -ev.velocityY >= VELOCIDAD_MINIMA;
        subida.progreso.set(subirOBajar(p, abrir ? 1 : 0));
        scheduleOnRN(subida.alCambiar, abrir);
        return;
      }
      if (modo.get() !== 'camara') return;
      escena.modify((e) => {
        'worklet';
        const v = ev.velocityY / e.alto;
        e.cam.objetivo = e.cam.y + v * 0.28 > ZONA_UNIVERSO / 2 ? ZONA_UNIVERSO : 0;
        e.cam.v = v;
        e.cam.arrastrando = false;
        return e;
      });
    },
    onFinalize: () => {
      'worklet';
      const era = modo.get();
      modo.set('nada');
      if (era !== 'camara') return;
      escena.modify((e) => {
        'worklet';
        e.cam.arrastrando = false;
        return e;
      });
    },
  });
  const editar = useCallback((i: number) => {
    const h = dia.habitos[i];
    if (!h || !alEditarHabito) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    alEditarHabito(h.id);
  }, [dia, alEditarHabito]);
  const apretar = useLongPressGesture({
    minDuration: 450,
    onActivate: (ev) => {
      'worklet';
      const i = estrellaEn(escena.value, ev.x, ev.y);
      if (i >= 0) scheduleOnRN(editar, i);
    },
  });
  const gestos = useCompetingGestures(arrastre, apretar, toque);

  // ------------------------------------------------------------------ valores por cuadro
  const uniformesCielo = useDerivedValue(() => {
    const e = escena.value;
    return {
      uLienzo: [ancho, alto],
      uEscala: alto,
      uDpr: dpr,
      uCamY: e.cam.y * PARALAJE.cielo,
      uMundoMin: plano.fondo.min,
      uMundoTam: plano.fondo.tam,
      uTex: texFondo.value,
      uHorizonte: HORIZONTE,
      uTiempo: e.t,
      uTiempoAurora: e.aurora.tiempo,
      uIntensidad: e.aurora.intensidad,
      uOleada: e.aurora.oleada,
      uCortinas: ajustes.cortinas,
      uParalajeAurora: PARALAJE.aurora,
      uDensidad: ajustes.densidad,
      uOnda: e.onda,
      uFugaz: e.fugazU,
      uFugazEstela: e.fugazEstela,
      uAparicion: e.aparicion,
      uRiqueza: e.riqueza,
    };
  });

  const camaraCielo = useDerivedValue(() => [{ translateX: escena.value.paginaX }, { translateY: escena.value.cam.y * PARALAJE.cielo * alto }]);
  const opacidadDeHoy = useDerivedValue(() => (soloCielo ? 0 : 1 - escena.value.velado));
  const camaraLoma0 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[0] * alto }]);
  const camaraLoma1 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[1] * alto }]);
  const camaraLoma2 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[2] * alto }]);
  const camarasLomas = [camaraLoma0, camaraLoma1, camaraLoma2];
  const luzLoma0 = useDerivedValue(() => musgo.lomas[0].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const luzLoma1 = useDerivedValue(() => musgo.lomas[1].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const luzLoma2 = useDerivedValue(() => musgo.lomas[2].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const lucesLomas = [luzLoma0, luzLoma1, luzLoma2];

  // Las líneas que se encienden, hasta donde llegó cada una. Con las líneas quietas no se rehace:
  // un camino nuevo también obliga a Skia a volver a desenfocar el halo.
  const caminoLineas = useDerivedValue(() => {
    const lista = avances.value;
    const p = Skia.PathBuilder.Make();
    for (let i = 0; i < lista.length && i < plano.lineas.length; i++) {
      if (lista[i] <= 0) continue;
      const a = plano.estrellas[plano.lineas[i].a];
      const b = plano.estrellas[plano.lineas[i].b];
      const ax = ancho / 2 + a[0] * alto, ay = alto / 2 - a[1] * alto;
      const bx = ancho / 2 + b[0] * alto, by = alto / 2 - b[1] * alto;
      p.moveTo(ax, ay).lineTo(ax + (bx - ax) * lista[i], ay + (by - ay) * lista[i]);
    }
    return p.detach();
  });
  const opacidadFantasmas = useDerivedValue(() => {
    let max = 0;
    for (const a of avances.value) max = Math.max(max, a);
    return 0.16 * (1 - max);
  });

  // El arco de avance de los hábitos automáticos que todavía no se encendieron.
  const caminoArcos = useDerivedValue(() => {
    const clave = apagados.value;
    const p = Skia.PathBuilder.Make();
    for (const a of plano.autos) {
      const s = plano.estrellas[a.indice];
      if (!s || clave[a.indice] !== '0' || a.avance <= 0) continue;
      const sx = ancho / 2 + s[0] * alto, sy = alto / 2 - s[1] * alto;
      const r = 17.2;
      p.addArc(Skia.XYWHRect(sx - r, sy - r, 2 * r, 2 * r), -90, 360 * a.avance);
    }
    return p.detach();
  });
  const alfaUniversoHoy = useDerivedValue(() => (escena.value.completo ? 0.7 : 0));

  // ------------------------------------------------------------------ acciones del panel de prueba
  const enLaEscena = useCallback(
    (accion: (e: Escena) => void) => {
      scheduleOnUI(() => {
        'worklet';
        escena.modify((e) => {
          'worklet';
          accion(e);
          return e;
        }, true);
      });
    },
    [escena],
  );
  const acciones = useMemo(
    () => ({
      salud: () => enLaEscena((e) => { 'worklet'; simularSalud(e); }),
      completar: () => enLaEscena((e) => { 'worklet'; completarDia(e); }),
      repetir: () => enLaEscena((e) => { 'worklet'; repetirAnimacion(e); }),
      universo: () => enLaEscena((e) => { 'worklet'; e.cam.objetivo = e.cam.objetivo > 0 ? 0 : ZONA_UNIVERSO; e.cam.v = 0; }),
      fugaz: () => enLaEscena((e) => { 'worklet'; lanzarFugaz(e); }),
      // Apaga todo lo de hoy en el almacén y rearma la escena con eso.
      reiniciar: () => {
        elAlmacen().reiniciarHoy();
        setAviso(null);
        setVuelta((v) => v + 1);
      },
      calidad: setDelPanel,
      riqueza: setRiquezaForzada,
    }),
    [enLaEscena],
  );

  // Los gestos van solo sobre el lienzo: si envolvieran también a la interfaz, un toque en un
  // botón (Deshacer, el panel de prueba) le llegaría además al cielo y encendería la estrella que
  // tiene abajo. Lo que no se toca en la interfaz (etiquetas, frase) deja pasar el toque.
  return (
    <View style={estilos.lleno}>
      <GestureDetector gesture={gestos}>
        <View style={StyleSheet.absoluteFill} collapsable={false} pointerEvents={soloCielo ? 'none' : 'auto'}>
          <Canvas style={estilos.lleno}>
            {fondoListo && (
              <Fill>
                <Shader source={ef.cielo} uniforms={uniformesCielo}>
                  <ImageShader image={fondo} sampling={MUESTREO} />
                </Shader>
              </Fill>
            )}
            <Group transform={camaraCielo} opacity={opacidadDeHoy}>
              <Path path={plano.universo.pendientes} style="stroke" strokeWidth={0.7} color={PERGAMINO} opacity={0.15} blendMode="plus">
                <DashPathEffect intervals={[2.5, 3.5]} />
              </Path>
              <Path path={plano.universo.hechas} style="stroke" strokeWidth={1.1} color={ORO} opacity={0.7} blendMode="plus" />
              <Path path={plano.universo.hoy} style="stroke" strokeWidth={1.1} color={ORO} opacity={alfaUniversoHoy} blendMode="plus" />
              <Path path={plano.fantasmas} style="stroke" strokeWidth={0.8} color={PERGAMINO} opacity={opacidadFantasmas} blendMode="plus">
                <DashPathEffect intervals={[2.7, 4.3]} />
              </Path>
              <Brillo camino={caminoLineas} ancho={1.7} color={ORO} opacidad={0.95} />
              <Path path={caminoArcos} style="stroke" strokeWidth={1.5} strokeCap="round" color={MUSGO_LUZ} opacity={0.95} blendMode="plus" />
            </Group>
            <Group opacity={opacidadDeHoy}>
              <Atlas image={hoja} sprites={rectsCielo} transforms={formasCielo} colors={coloresCielo} colorBlendMode="modulate" blendMode="plus" />
            </Group>
            {musgo.lomas.map((l, k) => (
              <Group key={k} transform={camarasLomas[k]}>
                <Path path={l.cuerpo}>
                  <Shader source={ef.musgo} uniforms={{ uLienzo: [ancho, alto], uEscala: alto, uCuerpo: l.color, uBase: l.base }} />
                </Path>
                <Group clip={l.cuerpo}>
                  <Path path={l.borde} style="stroke" strokeWidth={3.2} color={aRgb(l.colorBorde)} opacity={lucesLomas[k]}>
                    <BlurMask blur={2.2} style="normal" />
                  </Path>
                </Group>
              </Group>
            ))}
            <Atlas image={hoja} sprites={rectsFrente} transforms={formasFrente} colors={coloresFrente} colorBlendMode="modulate" blendMode="plus" />
          </Canvas>
        </View>
      </GestureDetector>
      {!soloCielo && <Interfaz
        plano={plano}
        dia={dia}
        escena={escena}
        encendidos={encendidos}
        completo={completo}
        aviso={aviso}
        alCerrarAviso={() => setAviso(null)}
        calidad={calidad}
        riqueza={riqueza}
        cuadros={cuadros}
        acciones={acciones}
        abajo={abajo}
        subida={subida?.progreso}
      />}
    </View>
  );
}

/** Una línea dorada con su halo: el trazo nítido y, debajo, el mismo camino desenfocado. */
function Brillo({ camino, ancho, color, opacidad, factor = 1 }: {
  camino: SkPath | DerivedValue<SkPath>;
  ancho: number;
  color: string;
  opacidad: number | DerivedValue<number>;
  factor?: number;
}) {
  const halo = useDerivedValue(() => (typeof opacidad === 'number' ? opacidad : opacidad.value) * 0.4 * factor);
  const nitida = useDerivedValue(() => (typeof opacidad === 'number' ? opacidad : opacidad.value) * 0.9 * factor);
  return (
    <Group blendMode="plus">
      <Path path={camino} style="stroke" strokeWidth={ancho * 3.5} strokeCap="round" strokeJoin="round" color={color} opacity={halo}>
        <BlurMask blur={ancho * 2.4} style="normal" />
      </Path>
      <Path path={camino} style="stroke" strokeWidth={ancho} strokeCap="round" strokeJoin="round" color={color} opacity={nitida} />
    </Group>
  );
}

const estilos = StyleSheet.create({
  lleno: { flex: 1, backgroundColor: colores.noche0 },
});

