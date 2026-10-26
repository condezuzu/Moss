// El texto sobre el cielo: cabecera, etiquetas de las estrellas, aviso con deshacer, frase en el
// musgo y el universo. Cada capa sigue a la cámara con el mismo paralaje que su parte del cielo,
// en el hilo de la interfaz. El cielo es el protagonista: el nombre de la constelación va chico, y
// el día completo no tiene texto propio.

import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useEffect, useEffectEvent, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { lista, t } from '@/textos';
import { colores } from '@/tema';
import type { Escena } from './escena';
import { luzDelDia } from '@/dominio/luz';
import type { DiaDelCielo } from './dia';
import { PARALAJE, type Calidad } from './mundo';
import type { Plano } from './plano';
import { nombreEn, valorAutomatico } from './textosDelCielo';

export type Aviso = { texto: string; clave: number; deshacer?: () => void };

type Acciones = {
  salud: () => void;
  completar: () => void;
  repetir: () => void;
  universo: () => void;
  fugaz: () => void;
  reiniciar: () => void;
  calidad: (c: Calidad) => void;
  riqueza: (r: number) => void;
};

type Props = {
  plano: Plano;
  dia: DiaDelCielo;
  escena: SharedValue<Escena>;
  encendidos: boolean[];
  completo: boolean;
  aviso: Aviso | null;
  alCerrarAviso: () => void;
  calidad: Calidad;
  riqueza: number;
  cuadros: number;
  acciones: Acciones;
  /** Lo que ocupa la barra de pestañas abajo; sin barra, 0. */
  abajo: number;
  /** Cuánto subió Ascent: la flecha se apaga mientras sube. */
  subida?: SharedValue<number>;
};

// Las riquezas del panel de prueba: el primer día, tres meses (la de la galería) y la plena.
const RIQUEZAS = [0, 0.6, 1];

// La web solo se usa para probar el cielo sin iPhone: ahí el panel de prueba siempre está.
export const DIAGNOSTICO = __DEV__ || process.env.EXPO_PUBLIC_DIAGNOSTICO === '1' || Platform.OS === 'web';

function suave(a: number, b: number, x: number) {
  'worklet';
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function Interfaz(p: Props) {
  const insets = useSafeAreaInsets();
  const { alto } = p.plano;
  const hechos = p.encendidos.filter(Boolean).length;
  const c = p.dia.constelacion;
  // Los worklets toman solo lo que usan: con `p.escena` adentro se llevaban todas las props (el plano,
  // el día) en cada render.
  const escena = p.escena;
  const subida = p.subida;

  // Todo lo de Hábitos se corre con su pestaña, como la constelación.
  const estiloCabecera = useAnimatedStyle(() => {
    const e = escena.value;
    return { transform: [{ translateX: e.paginaX }, { translateY: e.cam.y * alto }], opacity: (1 - suave(0.15, 0.6, e.cam.y)) * (1 - e.velado) };
  });
  // Mientras la constelación se conecta y sube la aurora, las etiquetas se apagan un poco: el
  // momento es del cielo.
  const estiloEtiquetas = useAnimatedStyle(() => {
    const e = escena.value;
    const dc = e.completo ? e.t - e.tCompleto : -1;
    const momento = e.completo ? suave(0.6, 1.4, dc) * (1 - suave(7.5, 9.0, dc)) : 0;
    return { transform: [{ translateX: e.paginaX }, { translateY: e.cam.y * alto }], opacity: (1 - suave(0.15, 0.6, e.cam.y)) * (1 - 0.55 * momento) * (1 - e.velado) };
  });
  const estiloFrase = useAnimatedStyle(() => ({ transform: [{ translateX: escena.value.paginaX }, { translateY: escena.value.cam.y * PARALAJE.lomas[2] * alto }], opacity: 1 - escena.value.velado }));
  // El panel de prueba es de Hábitos: no se ve encima de las otras secciones.
  const estiloPanel = useAnimatedStyle(() => ({ transform: [{ translateX: escena.value.paginaX }], opacity: 1 - escena.value.velado }));
  // La flecha tenue de Ascent va con la frase y respira apenas; mientras Ascent sube, se apaga.
  const reducido = useReducedMotion();
  const respira = useSharedValue(0);
  const conFlecha = !!p.subida;
  useEffect(() => {
    if (!reducido && conFlecha) respira.value = withRepeat(withTiming(1, { duration: 1900 }), -1, true);
  }, [reducido, conFlecha, respira]);
  const estiloFlecha = useAnimatedStyle(() => {
    const e = escena.value;
    const subio = subida ? subida.get() : 0;
    return {
      opacity: (1 - Math.min(1, subio * 2.5)) * (1 - 0.45 * respira.value),
      transform: [{ translateX: e.paginaX }, { translateY: e.cam.y * PARALAJE.lomas[2] * alto - 3 * respira.value }],
    };
  });
  const estiloUniverso = useAnimatedStyle(() => {
    const e = escena.value;
    return { transform: [{ translateX: e.paginaX }, { translateY: e.cam.y * alto }], opacity: suave(0.5, 1.1, e.cam.y) * (1 - e.velado) };
  });

  // Solo un aviso nuevo vuelve a contar: si el tiempo dependiera de la función para cerrarlo, cada
  // vez que el cielo se vuelve a dibujar empezaría de nuevo y el aviso no se iría nunca.
  const cerrarAviso = useEffectEvent(() => p.alCerrarAviso());
  useEffect(() => {
    if (!p.aviso) return;
    const espera = setTimeout(cerrarAviso, p.aviso.deshacer ? 4200 : 2600);
    return () => clearTimeout(espera);
  }, [p.aviso]);

  const fecha = t('cielo.fecha', {
    dia: lista('fecha.dias')[p.dia.fecha.diaSemana],
    num: p.dia.fecha.diaMes,
    mes: lista('fecha.mesesCortos')[p.dia.fecha.mes],
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[estilos.capa, estiloUniverso]} pointerEvents="none">
        <Text style={[estilos.universoTitulo, { left: p.plano.universo.titulo[0] - 150, top: p.plano.universo.titulo[1] - 18 }]}>
          {t('cielo.tuUniverso')}
        </Text>
        {p.plano.universo.etiquetas.map((u) => (
          <View key={u.dia} style={[estilos.universoEtiqueta, { left: u.x - 80, top: u.y }]}>
            <Text style={[estilos.universoDia, u.hoy && estilos.universoHoy]}>{lista('fecha.diasCortos')[u.dia]}</Text>
            <Text style={[estilos.universoNombre, u.hoy && estilos.universoNombreHoy]}>{nombreEn(u.nombre)}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[estilos.capa, estiloEtiquetas]} pointerEvents="none">
        {p.plano.etiquetas.map((e, i) => {
          const h = p.dia.habitos[i];
          const encendida = p.encendidos[i];
          // Un automático encendido muestra al menos su meta; sin datos todavía, nada.
          const textoAuto = !h.auto ? '' : encendida && h.meta ? valorAutomatico({ ...h, valor: Math.max(h.valor ?? 0, h.meta) }) : valorAutomatico(h);
          const posicion =
            e.lado === 'abajo' ? { left: e.x - 90, top: e.y + 14, width: 180, alignItems: 'center' as const }
              : e.lado === 'der' ? { left: e.x + 22, top: e.y - 9, width: 180, alignItems: 'flex-start' as const }
                : { left: e.x - 202, top: e.y - 9, width: 180, alignItems: 'flex-end' as const };
          return (
            <View key={i} style={[estilos.etiqueta, posicion]}>
              <View style={estilos.etiquetaFila}>
                <SymbolView name={h.icono as SFSymbol} size={11} tintColor={encendida ? colores.oroClaro : colores.pergaminoTenue} />
                <Text style={[estilos.etiquetaNombre, encendida && estilos.etiquetaEncendida]}>{h.nombre}</Text>
              </View>
              {textoAuto ? <Text style={[estilos.etiquetaAuto, encendida && { opacity: 0.7 }]}>{textoAuto}</Text> : null}
            </View>
          );
        })}
      </Animated.View>

      <Animated.View style={[estilos.cabecera, { top: insets.top + 14 }, estiloCabecera]} pointerEvents="none">
        <View style={estilos.cabeceraFila}>
          <View>
            <Text style={estilos.fecha}>{fecha}</Text>
            {c && <Text style={estilos.nombre}>{nombreEn(c.nombres)}</Text>}
          </View>
          <View style={estilos.luz}>
            <Text style={estilos.luzNumero}>{luzDelDia(hechos)}</Text>
            <Text style={estilos.luzTexto}>{t('cielo.luzDeHoy')}</Text>
          </View>
        </View>
        <Text style={[estilos.cuenta, p.completo && estilos.cuentaCompleta]}>
          {p.completo ? t('cielo.completa') : t('cielo.encendidas', { n: hechos, total: p.encendidos.length })}
        </Text>
      </Animated.View>

      <Animated.View style={[estilos.frase, { bottom: p.abajo ? p.abajo + 38 : insets.bottom + 12 }, estiloFrase]} pointerEvents="none">
        <Text style={estilos.fraseTexto}>{`“${nombreEn(p.dia.frase.texto)}”`}</Text>
        <Text style={estilos.fraseAutor}>{nombreEn(p.dia.frase.autor)}</Text>
      </Animated.View>

      {p.subida && (
        <Animated.View style={[estilos.flecha, { bottom: p.abajo + 2 }, estiloFlecha]} pointerEvents="none" accessibilityElementsHidden>
          <SymbolView name="chevron.up" size={20} weight="light" tintColor="rgba(239, 230, 207, 0.32)" />
        </Animated.View>
      )}

      {/* El aviso es de Hábitos: se va con su página. */}
      <Animated.View style={[StyleSheet.absoluteFill, estiloPanel]} pointerEvents="box-none">
      {p.aviso && (
        <Animated.View key={p.aviso.clave} entering={FadeInDown.duration(220)} exiting={FadeOut.duration(200)} style={[estilos.aviso, { bottom: p.abajo ? p.abajo + 24 : insets.bottom + 96 }]}>
          <Text style={estilos.avisoTexto} numberOfLines={2}>{p.aviso.texto}</Text>
          {p.aviso.deshacer && (
            <Pressable onPress={p.aviso.deshacer} style={estilos.avisoBoton} accessibilityRole="button" hitSlop={8}>
              <Text style={estilos.avisoBotonTexto}>{t('comun.deshacer')}</Text>
            </Pressable>
          )}
        </Animated.View>
      )}
      </Animated.View>

      {DIAGNOSTICO && (
        <Animated.View style={[StyleSheet.absoluteFill, estiloPanel]} pointerEvents="box-none">
          <PanelDePrueba arriba={insets.top + 126} calidad={p.calidad} riqueza={p.riqueza} cuadros={p.cuadros} acciones={p.acciones} />
        </Animated.View>
      )}
    </View>
  );
}

// Solo en builds de desarrollo o de diagnóstico: para probar en el teléfono lo que la galería
// prueba con sus botones.
function PanelDePrueba({ arriba, calidad, riqueza, cuadros, acciones }: {
  arriba: number;
  calidad: Calidad;
  riqueza: number;
  cuadros: number;
  acciones: Acciones;
}) {
  const [abierto, setAbierto] = useState(false);
  const botones: [string, () => void][] = [
    [t('diagnostico.salud'), acciones.salud],
    [t('diagnostico.completar'), acciones.completar],
    [t('diagnostico.repetir'), acciones.repetir],
    [t('diagnostico.universo'), acciones.universo],
    [t('diagnostico.fugaz'), acciones.fugaz],
    [t('diagnostico.reiniciar'), acciones.reiniciar],
  ];
  return (
    <View style={[estilos.panel, { top: arriba }]} pointerEvents="box-none">
      <Pressable onPress={() => setAbierto((a) => !a)} style={estilos.panelBoton} accessibilityRole="button" hitSlop={10}>
        <Text style={estilos.panelBotonTexto}>{t('diagnostico.cuadros', { n: Math.round(cuadros), calidad: t(`diagnostico.${calidad}`) })}</Text>
      </Pressable>
      {abierto && (
        <View style={estilos.panelCaja}>
          {botones.map(([texto, accion]) => (
            <Pressable key={texto} onPress={accion} style={estilos.panelAccion} accessibilityRole="button">
              <Text style={estilos.panelAccionTexto}>{texto}</Text>
            </Pressable>
          ))}
          <View style={estilos.panelCalidades}>
            {(['alta', 'media', 'baja'] as const).map((c) => (
              <Pressable key={c} onPress={() => acciones.calidad(c)} style={[estilos.panelCalidad, c === calidad && estilos.panelCalidadElegida]} accessibilityRole="button">
                <Text style={estilos.panelAccionTexto}>{t(`diagnostico.${c}`)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={estilos.panelCalidades}>
            {RIQUEZAS.map((r) => (
              <Pressable key={r} onPress={() => acciones.riqueza(r)} style={[estilos.panelCalidad, Math.abs(r - riqueza) < 0.01 && estilos.panelCalidadElegida]} accessibilityRole="button">
                <Text style={estilos.panelAccionTexto}>{t('diagnostico.riqueza', { n: Math.round(r * 100) })}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const SOMBRA = { textShadowColor: 'rgba(3, 5, 12, 0.95)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } };

const estilos = StyleSheet.create({
  capa: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  cabecera: { position: 'absolute', left: 24, right: 24 },
  fecha: { fontFamily: 'Jost_400Regular', fontSize: 11, letterSpacing: 2.2, textTransform: 'uppercase', color: colores.pergaminoTenue },
  cabeceraFila: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  // El nombre de la constelación, chico y discreto: el cielo es el protagonista.
  nombre: { marginTop: 5, fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 16, lineHeight: 19, color: 'rgba(239, 230, 207, 0.62)', ...SOMBRA },
  luz: { alignItems: 'flex-end' },
  luzNumero: { fontFamily: 'CormorantGaramond_500Medium', fontSize: 26, lineHeight: 27, color: colores.oroClaro, ...SOMBRA },
  luzTexto: { marginTop: 4, fontFamily: 'Jost_400Regular', fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: colores.pergaminoTenue },
  cuenta: { marginTop: 8, fontFamily: 'Jost_400Regular', fontSize: 12, color: colores.pergaminoTenue },
  cuentaCompleta: { color: colores.oro, letterSpacing: 1.9, textTransform: 'uppercase', fontSize: 10.5 },

  etiqueta: { position: 'absolute' },
  etiquetaFila: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  etiquetaNombre: { fontFamily: 'Jost_400Regular', fontSize: 11.5, color: 'rgba(239, 230, 207, 0.66)', ...SOMBRA },
  etiquetaEncendida: { color: '#f3dc9b' },
  etiquetaAuto: { marginTop: 3, fontFamily: 'Jost_400Regular', fontSize: 10, color: colores.musgoLuz, fontVariant: ['tabular-nums'], ...SOMBRA },

  universoTitulo: { position: 'absolute', width: 300, textAlign: 'center', fontFamily: 'CormorantGaramond_500Medium', fontSize: 28, color: colores.pergamino, ...SOMBRA },
  universoEtiqueta: { position: 'absolute', width: 160, alignItems: 'center' },
  universoDia: { fontFamily: 'Jost_500Medium', fontSize: 9.5, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(232, 196, 106, 0.8)' },
  universoHoy: { color: colores.oroClaro },
  universoNombre: { marginTop: 2, fontFamily: 'Jost_400Regular', fontSize: 10.5, color: 'rgba(239, 230, 207, 0.6)', ...SOMBRA },
  universoNombreHoy: { color: colores.pergamino },

  frase: { position: 'absolute', left: 26, right: 26, alignItems: 'center' },
  flecha: { position: 'absolute', alignSelf: 'center', width: 64, height: 44, alignItems: 'center', justifyContent: 'center' },
  fraseTexto: { fontFamily: 'CormorantGaramond_400Regular_Italic', fontSize: 14.5, lineHeight: 19, textAlign: 'center', color: 'rgba(239, 230, 207, 0.74)' },
  fraseAutor: { marginTop: 5, fontFamily: 'Jost_400Regular', fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(185, 227, 107, 0.6)' },

  aviso: {
    position: 'absolute', alignSelf: 'center', maxWidth: '88%', flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingLeft: 16, paddingRight: 8, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(8, 13, 28, 0.86)',
    borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.22)',
  },
  avisoTexto: { flexShrink: 1, fontFamily: 'Jost_400Regular', fontSize: 13, color: colores.pergamino },
  avisoBoton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(232, 196, 106, 0.12)' },
  avisoBotonTexto: { fontFamily: 'Jost_500Medium', fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase', color: colores.oro },

  panel: { position: 'absolute', right: 12, alignItems: 'flex-end' },
  panelBoton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(3, 5, 12, 0.7)' },
  panelBotonTexto: { fontFamily: 'Jost_500Medium', fontSize: 10, color: colores.musgoLuz },
  panelCaja: { marginTop: 6, padding: 8, gap: 6, borderRadius: 14, backgroundColor: 'rgba(6, 10, 22, 0.92)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.25)' },
  panelAccion: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.3)' },
  panelAccionTexto: { fontFamily: 'Jost_400Regular', fontSize: 12.5, color: colores.oroClaro },
  panelCalidades: { flexDirection: 'row', gap: 4 },
  panelCalidad: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999 },
  panelCalidadElegida: { backgroundColor: 'rgba(232, 196, 106, 0.18)' },
});
