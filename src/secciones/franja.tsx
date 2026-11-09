// La franja bajo la hora (aprobada en la galería, 6/11/2026): al hacer scroll, lo que pasa por debajo de la
// hora y de la isla se separa con un degradado del color del fondo. Con todo arriba no se ve: aparece en los
// primeros 24 puntos de scroll. Va arriba de la página de cada sección, sin tomar toques.

import { Platform, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

/** El fondo de las secciones (colores.noche0), en componentes para el degradado. */
export const DEL_FONDO = '3, 5, 12';
/** El de Sueño, su noche azul. */
export const DE_LA_NOCHE = '5, 9, 22';

export function FranjaBajoLaHora({ scrollY, arriba, rgb = DEL_FONDO }: { scrollY: SharedValue<number>; arriba: number; rgb?: string }) {
  const alto = arriba + 14;
  // Casi opaca hasta 26 puntos antes del final, y de ahí a transparente: como en la galería.
  const parada = Math.max(0, Math.round(((alto - 26) / alto) * 100));
  const degradado = `linear-gradient(180deg, rgba(${rgb}, 0.94) 0%, rgba(${rgb}, 0.82) ${parada}%, rgba(${rgb}, 0) 100%)`;
  const estilo = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.get(), [0, 24], [0, 1], 'clamp') }));
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        estilos.franja,
        { height: alto },
        (Platform.OS === 'web' ? { backgroundImage: degradado } : { experimental_backgroundImage: degradado }) as ViewStyle,
        estilo,
      ]}
    />
  );
}

const estilos = StyleSheet.create({
  franja: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 },
});
