// El cuerpo de tu rango en Ascent, de fondo en su sección, como las estrellas (galeria/src/ascent.js, .as-cielo).
// Con tu racha de Ascent (moss.ascent_ajustes), desde el rango 2, su cuerpo (CuerpoDelRangoSkia en DibujosSkia.tsx).
// En el rango 1, sin vincular o mientras no llegue la racha, el polvo: una nube de gas violeta y azul con vetas, granos
// y una estrella que nace. Se mueve como en la galería: el gas gira despacio alrededor de la estrella (una vuelta en 5
// minutos) y late; los granos giran más rápido, en tres grupos que titilan a destiempo; la estrella respira. Son
// imágenes hechas una vez (herramientas/polvo-de-ascent.mjs) que solo giran y cambian de opacidad: nada se vuelve a
// pintar. Con Reducir movimiento, quieta. Arriba de Progreso, el borde que asoma: su luz.

import { useEffect } from 'react';
import { Image, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, Easing, FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue,
} from 'react-native-reanimated';

import { useRango } from './colores';
import { CuerpoDelRango, TechoDelRango } from './Dibujos';

const GAS = require('../../../assets/ascent/polvo-gas.png');
const GRANOS = [require('../../../assets/ascent/polvo-granos-0.png'), require('../../../assets/ascent/polvo-granos-1.png'), require('../../../assets/ascent/polvo-granos-2.png')];

/** La nube, en puntos, y su estrella (donde gira todo). */
const NUBE = { ancho: 560, alto: 380, centro: 120 };
const ESTRELLA = { x: 294, y: 196 };
const ORIGEN = `${ESTRELLA.x}px ${ESTRELLA.y}px`;
/** Cada grupo de granos titila a su ritmo: así van a destiempo. */
const TITILA = [5000, 7000, 9500];
const SUAVE = Easing.inOut(Easing.ease);

/** Un valor que va de 0 a 1 y vuelve, para siempre, mientras `activo`. */
function useVaiven(ms: number, activo: boolean) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!activo) return;
    v.set(withRepeat(withTiming(1, { duration: ms, easing: SUAVE }), -1, true));
    return () => cancelAnimation(v);
  }, [activo, ms, v]);
  return v;
}

/** Una vuelta entera, para siempre, mientras `activo`. */
function useGiro(ms: number, activo: boolean) {
  const v = useSharedValue(0);
  useEffect(() => {
    if (!activo) return;
    v.set(withRepeat(withTiming(v.get() + 360, { duration: ms, easing: Easing.linear }), -1, false));
    return () => cancelAnimation(v);
  }, [activo, ms, v]);
  return v;
}

/**
 * El polvo, arriba a la derecha y cortado por el borde. `baja` lo corre (en puntos): baja con la sección más
 * despacio que ella y se corre apenas con el scroll. `activo`: solo se mueve con la sección a la vista.
 */
export function Polvo({ baja, activo }: { baja: SharedValue<number>; activo: boolean }) {
  const reducido = useReducedMotion();
  const vivo = activo && !reducido;
  const late = useVaiven(16000, vivo);
  const giroGas = useGiro(320000, vivo);
  const giroGranos = useGiro(200000, vivo);
  const respira = useVaiven(3500, vivo);
  const titila = [useVaiven(TITILA[0], vivo), useVaiven(TITILA[1], vivo), useVaiven(TITILA[2], vivo)];
  const entra = useSharedValue(0);
  useEffect(() => {
    entra.set(withTiming(1, { duration: 800 }));
  }, [entra]);

  const caja = useAnimatedStyle(() => ({ opacity: 0.72 * entra.get(), transform: [{ translateY: baja.get() }] }));
  const estiloLate = useAnimatedStyle(() => ({ transform: [{ scale: 1 + 0.06 * late.get() }] }));
  const estiloGas = useAnimatedStyle(() => ({ transform: [{ rotate: `${giroGas.get()}deg` }] }));
  const estiloGranos = useAnimatedStyle(() => ({ transform: [{ rotate: `${giroGranos.get()}deg` }] }));
  const grano0 = useAnimatedStyle(() => ({ opacity: 1 - 0.65 * titila[0].get() }));
  const grano1 = useAnimatedStyle(() => ({ opacity: 1 - 0.65 * titila[1].get() }));
  const grano2 = useAnimatedStyle(() => ({ opacity: 1 - 0.65 * titila[2].get() }));
  const estiloEstrella = useAnimatedStyle(() => ({ opacity: 1 - 0.18 * respira.get(), transform: [{ scale: 1 + 0.14 * respira.get() }] }));
  const granos = [grano0, grano1, grano2];
  return (
    <Animated.View style={[st.nube, caja]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGEN }, estiloLate]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGEN }, estiloGas]}>
          <Image source={GAS} style={st.imagen} resizeMode="stretch" />
        </Animated.View>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ORIGEN }, estiloGranos]}>
        {GRANOS.map((g, i) => (
          <Animated.View key={i} style={[StyleSheet.absoluteFill, granos[i]]}>
            <Image source={g} style={st.imagen} resizeMode="stretch" />
          </Animated.View>
        ))}
      </Animated.View>
      <Animated.View style={[st.estrella, estiloEstrella]}>
        <View style={st.estrellaCentro} />
      </Animated.View>
    </Animated.View>
  );
}

/** El disco del cuerpo de tu rango: arriba a la derecha, cortado por el borde, con su margen para el resplandor. */
const DISCO = { lado: 360, margen: 130, derecha: -140, arriba: -110 };
/** El techo: un círculo de 760 que cuelga del borde de arriba de Progreso y se ve 7 puntos adentro. */
const TECHO = { lado: 760, margen: 40, adentro: 7 };

/** El cuerpo de tu rango, de fondo en su sección: el polvo en el rango 1 y, desde el 2, su cuerpo. Cambia con un fundido. */
export function CuerpoDeFondo({ baja, activo }: { baja: SharedValue<number>; activo: boolean }) {
  const rango = useRango();
  const caja = useAnimatedStyle(() => ({ transform: [{ translateY: baja.get() }] }));
  if (rango.cuerpo === 'polvo') {
    return (
      <Animated.View key="polvo" exiting={FadeOut.duration(800)} style={StyleSheet.absoluteFill}>
        <Polvo baja={baja} activo={activo} />
      </Animated.View>
    );
  }
  return (
    <Animated.View key={`${rango.cuerpo}${rango.planeta ?? ''}`} entering={FadeIn.duration(800)} exiting={FadeOut.duration(800)} style={[st.disco, caja]}>
      <CuerpoDelRango rango={rango} lado={DISCO.lado} margen={DISCO.margen} />
    </Animated.View>
  );
}

const fondo = (gradiente: string) => (Platform.OS === 'web' ? { backgroundImage: gradiente } : { experimental_backgroundImage: gradiente }) as ViewStyle;

/**
 * Arriba de Progreso asoma el polvo, colgado: su luz, no un borde. `baja`, en puntos: baja con el dedo y con el
 * tirón de la primera vez.
 */
export function BordeQueAsoma({ baja, estilo }: { baja: SharedValue<number>; estilo: ViewStyle | ReturnType<typeof useAnimatedStyle> }) {
  const rango = useRango();
  const luz = useAnimatedStyle(() => ({ transform: [{ translateY: baja.get() }] }));
  return (
    <Animated.View style={[st.techo, estilo]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {rango.cuerpo === 'polvo' ? (
        <Animated.View key="polvo" exiting={FadeOut.duration(800)} style={[st.techoLuz, luz]} />
      ) : (
        // Desde el rango 2, el borde de su cuerpo, encendido con su color.
        <Animated.View key="cuerpo" entering={FadeIn.duration(800)} style={[st.techoCuerpo, luz]}>
          <TechoDelRango rango={rango} lado={TECHO.lado} margen={TECHO.margen} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  nube: { position: 'absolute', left: '70%', marginLeft: -NUBE.ancho / 2, top: NUBE.centro - NUBE.alto / 2, width: NUBE.ancho, height: NUBE.alto },
  imagen: { width: NUBE.ancho, height: NUBE.alto },
  estrella: {
    position: 'absolute', left: ESTRELLA.x - 42, top: ESTRELLA.y - 42, width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center',
    ...fondo('radial-gradient(circle, rgba(255, 241, 220, 0.85) 0%, rgba(250, 196, 146, 0.42) 12%, rgba(255, 206, 168, 0.12) 34%, rgba(255, 206, 168, 0) 68%)'),
  },
  estrellaCentro: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff4e4' },
  techo: { position: 'absolute', left: 0, right: 0, top: 0, height: 190, overflow: 'hidden', zIndex: 2 },
  // Un círculo de 760 que cuelga del borde de arriba: se ve su resplandor, 7 puntos adentro.
  disco: {
    position: 'absolute', right: DISCO.derecha - DISCO.margen, top: DISCO.arriba - DISCO.margen,
    width: DISCO.lado + 2 * DISCO.margen, height: DISCO.lado + 2 * DISCO.margen,
  },
  techoCuerpo: {
    position: 'absolute', left: '62%', marginLeft: -(TECHO.lado / 2 + TECHO.margen), top: TECHO.adentro - TECHO.lado - TECHO.margen,
    width: TECHO.lado + 2 * TECHO.margen, height: TECHO.lado + 2 * TECHO.margen,
  },
  techoLuz: { position: 'absolute', left: '62%', marginLeft: -380, top: 7 - 760, width: 760, height: 760, borderRadius: 380, boxShadow: '0 8px 30px rgba(138, 107, 214, 0.22)' },
});
