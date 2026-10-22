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
  useColorBuffer,
  useRectBuffer,
  useRSXformBuffer,
  useTexture,
  type SkPath,
} from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { AccessibilityInfo, PixelRatio, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, useCompetingGestures, usePanGesture, useTapGesture } from 'react-native-gesture-handler';
import { useDerivedValue, useFrameCallback, useSharedValue, type DerivedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { elAlmacen } from '@/almacen';
import { riquezaDe } from '@/dominio/luz';
import { calidadDeFabrica, unEscalonMenos } from './calidad';
import { useCieloDeHoy, useEncendidos } from './dia';
import { efectos } from './efectos';
import {
  CAPACIDAD_CIELO,
  CAPACIDAD_FRENTE,
  cambiarHabito,
  completarDia,
  crearEscena,
  DATOS_POR_SPRITE,
  lanzarFugaz,
  paso,
  repetirAnimacion,
  simularSalud,
  tocar,
  type Escena,
  type Evento,
} from './escena';
import { Interfaz, type Aviso } from './Interfaz';
import { CALIDADES, HORIZONTE, PARALAJE, VIA_LACTEA, ZONA_UNIVERSO, type Calidad } from './mundo';
import type { Brote } from './musgo';
import { armarPlano, armarPlanoDelMusgo, type Plano } from './plano';
import { useTextos } from './textosDelCielo';
import { colores } from '@/tema';

const CELDA = 128;
const MUESTREO = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
const ORO = 'rgb(255, 204, 112)';
const PERGAMINO = 'rgb(240, 230, 207)';
const MUSGO_LUZ = 'rgb(189, 237, 115)';
const aRgb = ([r, g, b]: number[]) => `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

export default function Cielo() {
  const { width: ancho, height: alto } = useWindowDimensions();
  const dpr = PixelRatio.get();
  const [calidad, setCalidad] = useState<Calidad>(calidadDeFabrica);
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
  const [riquezaForzada, setRiquezaForzada] = useState<number | null>(null);
  const riqueza = riquezaForzada ?? riquezaDe(dia.luzAcumulada);

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
        habitos: plano.estrellas.map(([x, y], i) => ({ x, y, encendido: a.encendidos[i], auto: !!dia.habitos[i].auto })),
        lineas: plano.lineas,
        centro: plano.centro,
        brotes: a.brotes,
        universo: plano.universo.estrellas,
        factorParticulas: a.particulas,
        riqueza: a.riqueza,
        movimientoReducido,
      }),
    [ancho, alto, plano, dia, movimientoReducido],
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

  const t = useTextos();

  // ------------------------------------------------------------------ texturas
  // El cielo fijo se dibuja una vez por tamaño, calidad y riqueza. Mientras llega la textura nueva
  // se sigue usando la anterior: el shader de cada cuadro lee su tamaño real (texFondo).
  const ef = efectos();
  const pxFondo = alto * Math.min(dpr, ajustes.dprFondo);
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
          uRiqueza: riqueza,
          uVia: VIA_LACTEA,
        }}
      />
    </Fill>,
    tamFondo,
    [tamFondo, ajustes.octavas, ajustes.capas, riqueza],
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
        if (ev.tipo === 'lento') { setCalidad((c) => unEscalonMenos(c)); continue; }
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
          const indice = ev.indice;
          setAviso({
            texto: t.t(prendida ? 'cielo.encendida' : 'cielo.apagada', { habito: nombre }),
            clave: Date.now(),
            deshacer: () => {
              scheduleOnUI(() => {
                'worklet';
                escena.modify((e) => {
                  'worklet';
                  cambiarHabito(e, indice, !prendida, false);
                  e.eventos = e.eventos.filter((x) => x.tipo !== 'encendida' && x.tipo !== 'apagada');
                  return e;
                }, true);
              });
              elAlmacen().marcar(h.id, !prendida, 'deshacer');
              setAviso(null);
            },
          });
        }
      }
    },
    [dia, escena, t],
  );

  const drenar = useCallback(() => {
    'worklet';
    const e = escena.value;
    if (e.eventos.length === 0) return;
    const lista = e.eventos.splice(0, e.eventos.length);
    scheduleOnRN(alEventos, lista);
  }, [escena, alEventos]);

  useFrameCallback((info) => {
    'worklet';
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16.7) / 1000);
    const hayFondo = fondo.value !== null;
    escena.modify((e) => {
      'worklet';
      // El cielo aparece cuando hay textura. Si ya estaba (una escena rehecha), aparece enseguida.
      if (hayFondo && !e.fondoListo) {
        e.fondoListo = true;
        e.eventos.push({ tipo: 'listo' });
      }
      paso(e, dt);
      return e;
    }, true);
    drenar();
  });

  // ------------------------------------------------------------------ gestos
  const toque = useTapGesture({
    maxDistance: 12,
    onActivate: (ev) => {
      'worklet';
      escena.modify((e) => {
        'worklet';
        tocar(e, ev.x, ev.y);
        return e;
      }, true);
      drenar();
    },
  });
  // Arrastrar mueve la cámara: hacia abajo, el cielo baja y aparece tu universo.
  const arrastre = usePanGesture({
    activeOffsetY: [-10, 10],
    onActivate: () => {
      'worklet';
      escena.modify((e) => {
        'worklet';
        e.cam.arrastrando = true;
        e.cam.desde = e.cam.y;
        return e;
      });
    },
    onUpdate: (ev) => {
      'worklet';
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
      escena.modify((e) => {
        'worklet';
        e.cam.arrastrando = false;
        return e;
      });
    },
  });
  const gestos = useCompetingGestures(arrastre, toque);

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

  const camaraCielo = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.cielo * alto }]);
  const camaraLoma0 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[0] * alto }]);
  const camaraLoma1 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[1] * alto }]);
  const camaraLoma2 = useDerivedValue(() => [{ translateY: escena.value.cam.y * PARALAJE.lomas[2] * alto }]);
  const camarasLomas = [camaraLoma0, camaraLoma1, camaraLoma2];
  const luzLoma0 = useDerivedValue(() => musgo.lomas[0].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const luzLoma1 = useDerivedValue(() => musgo.lomas[1].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const luzLoma2 = useDerivedValue(() => musgo.lomas[2].luz * (0.65 + 0.35 * escena.value.aurora.intensidad));
  const lucesLomas = [luzLoma0, luzLoma1, luzLoma2];

  // Las líneas que se encienden, hasta donde llegó cada una.
  const caminoLineas = useDerivedValue(() => {
    const e = escena.value;
    const p = Skia.PathBuilder.Make();
    for (const l of e.lineas) {
      if (l.avance <= 0) continue;
      const a = e.habitos[l.a];
      const b = e.habitos[l.b];
      const ax = ancho / 2 + a.x * alto, ay = alto / 2 - a.y * alto;
      const bx = ancho / 2 + b.x * alto, by = alto / 2 - b.y * alto;
      p.moveTo(ax, ay).lineTo(ax + (bx - ax) * l.avance, ay + (by - ay) * l.avance);
    }
    return p.detach();
  });
  const opacidadFantasmas = useDerivedValue(() => {
    const e = escena.value;
    let max = 0;
    for (const l of e.lineas) max = Math.max(max, l.avance);
    return 0.16 * (1 - max);
  });

  // El arco de avance de los hábitos automáticos que todavía no se encendieron.
  const caminoArcos = useDerivedValue(() => {
    const e = escena.value;
    const p = Skia.PathBuilder.Make();
    for (const a of plano.autos) {
      const h = e.habitos[a.indice];
      if (h.luz > 0.5 || a.avance <= 0) continue;
      const sx = ancho / 2 + h.x * alto, sy = alto / 2 - h.y * alto;
      const r = 17.2;
      p.addArc(Skia.XYWHRect(sx - r, sy - r, 2 * r, 2 * r), -90, 360 * a.avance);
    }
    return p.detach();
  });
  const alfaUniversoHoy = useDerivedValue(() => (escena.value.completo ? 0.7 : 0));

  // ------------------------------------------------------------------ los dos Atlas
  const rectsCielo = useRectBuffer(CAPACIDAD_CIELO, (r, i) => {
    'worklet';
    const e = escena.value;
    const celda = i < e.nCielo ? e.cielo[i * DATOS_POR_SPRITE + 4] : 0;
    r.setXYWH(celda * CELDA, 0, CELDA, CELDA);
  });
  const formasCielo = useRSXformBuffer(CAPACIDAD_CIELO, (x, i) => {
    'worklet';
    const e = escena.value;
    if (i >= e.nCielo) { x.set(0, 0, -1e4, -1e4); return; }
    const o = i * DATOS_POR_SPRITE;
    const s = (2 * e.cielo[o + 2]) / CELDA;
    const c = Math.cos(e.cielo[o + 3]) * s, n = Math.sin(e.cielo[o + 3]) * s;
    const m = CELDA / 2;
    x.set(c, n, e.cielo[o] - (c * m - n * m), e.cielo[o + 1] - (n * m + c * m));
  });
  const coloresCielo = useColorBuffer(CAPACIDAD_CIELO, (col, i) => {
    'worklet';
    const e = escena.value;
    if (i >= e.nCielo) { col[0] = 0; col[1] = 0; col[2] = 0; col[3] = 0; return; }
    const o = i * DATOS_POR_SPRITE;
    const k = Math.min(1, e.cielo[o + 8]);
    col[0] = e.cielo[o + 5] * k; col[1] = e.cielo[o + 6] * k; col[2] = e.cielo[o + 7] * k; col[3] = 1;
  });
  const rectsFrente = useRectBuffer(CAPACIDAD_FRENTE, (r, i) => {
    'worklet';
    const e = escena.value;
    const celda = i < e.nFrente ? e.frente[i * DATOS_POR_SPRITE + 4] : 0;
    r.setXYWH(celda * CELDA, 0, CELDA, CELDA);
  });
  const formasFrente = useRSXformBuffer(CAPACIDAD_FRENTE, (x, i) => {
    'worklet';
    const e = escena.value;
    if (i >= e.nFrente) { x.set(0, 0, -1e4, -1e4); return; }
    const o = i * DATOS_POR_SPRITE;
    const s = (2 * e.frente[o + 2]) / CELDA;
    const c = Math.cos(e.frente[o + 3]) * s, n = Math.sin(e.frente[o + 3]) * s;
    const m = CELDA / 2;
    x.set(c, n, e.frente[o] - (c * m - n * m), e.frente[o + 1] - (n * m + c * m));
  });
  const coloresFrente = useColorBuffer(CAPACIDAD_FRENTE, (col, i) => {
    'worklet';
    const e = escena.value;
    if (i >= e.nFrente) { col[0] = 0; col[1] = 0; col[2] = 0; col[3] = 0; return; }
    const o = i * DATOS_POR_SPRITE;
    const k = Math.min(1, e.frente[o + 8]);
    col[0] = e.frente[o + 5] * k; col[1] = e.frente[o + 6] * k; col[2] = e.frente[o + 7] * k; col[3] = 1;
  });

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
      calidad: setCalidad,
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
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={estilos.lleno}>
            {fondoListo && (
              <Fill>
                <Shader source={ef.cielo} uniforms={uniformesCielo}>
                  <ImageShader image={fondo} sampling={MUESTREO} />
                </Shader>
              </Fill>
            )}
            <Group transform={camaraCielo}>
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
            <Atlas image={hoja} sprites={rectsCielo} transforms={formasCielo} colors={coloresCielo} colorBlendMode="modulate" blendMode="plus" />
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
      <Interfaz
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
      />
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

