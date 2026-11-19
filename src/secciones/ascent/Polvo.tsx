// El cuerpo de tu rango en Ascent, de fondo en su sección, el mismo que dibuja la app Ascent (CuerpoDelRangoSkia en
// DibujosSkia.tsx): con tu racha de Ascent (moss.ascent_ajustes) y, sin vincular o mientras no llegue la racha, el
// polvo del rango 1, su nebulosa con sus partículas. Se mueve solo con la sección a la vista; con Reducir movimiento,
// quieto. Arriba de Progreso, el borde que asoma.

import { StyleSheet, useWindowDimensions, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { useRango } from './colores';
import { CuerpoDelRango, TechoDelRango } from './Dibujos';
import { geometriaDelTecho, geometriaEnLaSeccion } from './rangosDeAscent';

/**
 * El cuerpo de tu rango, de fondo en la sección: arriba a la derecha y cortado por el borde. `baja` lo corre (en
 * puntos): baja con la sección más despacio que ella y se corre apenas con el scroll. `activo`: la sección a la vista.
 * Cambia con un fundido.
 */
export function CuerpoDeFondo({ baja, activo }: { baja: SharedValue<number>; activo: boolean }) {
  const rango = useRango();
  const { width } = useWindowDimensions();
  const caja = useAnimatedStyle(() => ({ transform: [{ translateY: baja.get() }] }));
  return (
    <Animated.View key={`${rango.cuerpo}${rango.planeta ?? ''}`} entering={FadeIn.duration(800)} exiting={FadeOut.duration(800)} style={[st.fondo, caja]} pointerEvents="none">
      <CuerpoDelRango rango={rango} geometria={geometriaEnLaSeccion(rango.rango, rango.planeta, width)} activo={activo} despertar={baja} />
    </Animated.View>
  );
}

/**
 * Arriba de Progreso asoma tu cuerpo, colgado: el polvo, su luz; desde el rango 2, el borde de abajo del cuerpo.
 * `baja`, en puntos: baja con el dedo y con el tirón de la primera vez.
 */
export function BordeQueAsoma({ baja, estilo }: { baja: SharedValue<number>; estilo: ViewStyle | ReturnType<typeof useAnimatedStyle> }) {
  const rango = useRango();
  const { width } = useWindowDimensions();
  const luz = useAnimatedStyle(() => ({ transform: [{ translateY: baja.get() }] }));
  return (
    <Animated.View style={[st.techo, estilo]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {rango.cuerpo === 'polvo' ? (
        <Animated.View key="polvo" exiting={FadeOut.duration(800)} style={[st.techoLuz, luz]} />
      ) : (
        <Animated.View key={`${rango.cuerpo}${rango.planeta ?? ''}`} entering={FadeIn.duration(800)} exiting={FadeOut.duration(800)} style={[st.techoCuerpo, luz]}>
          <TechoDelRango rango={rango} geometria={geometriaDelTecho(rango.rango, rango.planeta, width)} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const st = StyleSheet.create({
  fondo: { position: 'absolute', left: 0, top: 0 },
  techo: { position: 'absolute', left: 0, right: 0, top: 0, height: 190, overflow: 'hidden', zIndex: 2 },
  // El lienzo del techo empieza 90 puntos más arriba: se ven al bajar con el dedo (geometriaDelTecho).
  techoCuerpo: { position: 'absolute', left: 0, top: -90 },
  // Un círculo de 760 que cuelga del borde de arriba: se ve su resplandor, 7 puntos adentro.
  techoLuz: { position: 'absolute', left: '62%', marginLeft: -380, top: 7 - 760, width: 760, height: 760, borderRadius: 380, boxShadow: '0 8px 30px rgba(138, 107, 214, 0.22)' },
});
