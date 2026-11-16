// Cómo se ven las calorías del día (galeria/src/kcal.js; lo elegiste el 2/11/2026 en «Todo lo de hoy»): la luna, un
// anillo, un arco, una barra por comidas o los anillos de los macros. Lo elegido queda en el almacén (`kcal`) y se
// ve en Inicio. Pasada la meta, la figura queda llena y en oro, como el «de más» del texto.

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import type { EstiloDeKcal } from '@/almacen/almacen';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { numero } from '../comida/datos';
import { Anillo, Arco, Luna, Macros, type FraccionesDeMacros } from './Figuras';

export { altoDelArco } from './Figuras';

const MS = 1100;

// ------------------------------------------------------------ la barra por comidas
/**
 * Una línea partida por comidas: se ve cómo se repartió el día. Pasada la meta, la línea entera es lo comido y una
 * marca fina dice dónde estaba la meta. `comidas` son las kcal de cada comida, en orden.
 */
export function Barra({ fraccion, comidas, alto = 8 }: { fraccion: number; comidas: readonly number[]; alto?: number }) {
  const ahora = useSharedValue(fraccion);
  const reducido = useReducedMotion();
  useEffect(() => {
    ahora.set(reducido ? fraccion : withTiming(fraccion, { duration: MS, easing: Easing.out(Easing.cubic) }));
  }, [ahora, fraccion, reducido]);
  const partes = comidas.length ? comidas : [1];
  const total = partes.reduce((s, x) => s + x, 0) || 1;
  const deMas = fraccion > 1.0005;
  const marca = useAnimatedStyle(() => ({ left: `${(100 / Math.max(1, ahora.get())).toFixed(2)}%`, opacity: ahora.get() > 1.0005 ? 1 : 0 }));
  return (
    <View style={[st.barra, { height: alto }]}>
      <View style={st.pista}>
        {partes.map((x, i) => (
          <Segmento key={i} ahora={ahora} desde={partes.slice(0, i).reduce((s, y) => s + y, 0) / total} parte={x / total} color={deMas ? (i % 2 ? '#c9a75a' : colores.oro) : i % 2 ? '#c9c1ac' : '#ece4cf'} />
        ))}
      </View>
      <Animated.View style={[st.marca, marca]} />
    </View>
  );
}

function Segmento({ ahora, desde, parte, color }: { ahora: SharedValue<number>; desde: number; parte: number; color: string }) {
  // Lo comido llena las partes en orden: cada una, lo que le toca de lo que ya se ve.
  const estilo = useAnimatedStyle(() => {
    const v = Math.max(0, ahora.get());
    const visto = v / Math.max(1, v);
    const ancho = Math.max(0, Math.min(visto * (1 - desde), parte * visto));
    return { width: `${(ancho * 100).toFixed(2)}%`, opacity: ancho > 0.001 ? 1 : 0 };
  });
  return <Animated.View style={[st.segmento, { backgroundColor: color }, estilo]} />;
}

// ------------------------------------------------------------ la de Inicio
export type DeLaFigura = { fraccion: number; macros: FraccionesDeMacros; comidas: readonly number[] };

/** El anillo con lo que llevas adentro, en porcentaje (con los números ocultos, sin él). */
function AnilloConPorcentaje({ tam, grueso, fraccion, numeros, letra }: { tam: number; grueso: number; fraccion: number; numeros: boolean; letra: number }) {
  return (
    <View style={{ width: tam, height: tam }}>
      <Anillo tam={tam} grueso={grueso} fraccion={fraccion} ms={MS} />
      {numeros && (
        <View style={[StyleSheet.absoluteFill, st.centro]} pointerEvents="none">
          <Text style={[st.porcentaje, { fontSize: letra }]}>{t('comida.porcentaje', { n: numero(Math.round(Math.max(0, fraccion) * 100)) })}</Text>
        </View>
      )}
    </View>
  );
}

/** La figura grande, la de Inicio: la luna o un anillo, al lado de la cifra; el arco, alrededor; la barra, abajo. */
export function FiguraGrande({ estilo, de, numeros, ancho }: { estilo: EstiloDeKcal; de: DeLaFigura; numeros: boolean; ancho: number }) {
  if (estilo === 'macros') return <Macros tam={116} grueso={8} fracciones={de.macros} ms={MS} />;
  if (estilo === 'anillo') return <AnilloConPorcentaje tam={112} grueso={5} fraccion={de.fraccion} numeros={numeros} letra={18} />;
  if (estilo === 'arco') return <Arco ancho={Math.min(300, ancho)} grueso={1.9} fraccion={de.fraccion} ms={MS} />;
  if (estilo === 'barra') return <Barra fraccion={de.fraccion} comidas={de.comidas} />;
  return <Luna tam={124} fraccion={de.fraccion} ms={MS} />;
}

/** Una muestra chica de cada estilo, quieta, para elegir. */
export function Muestra({ estilo }: { estilo: EstiloDeKcal }) {
  const ejemplo = 0.62;
  if (estilo === 'macros') return <Macros tam={36} grueso={9} fracciones={{ proteina: 0.72, carbohidratos: 0.55, grasas: 0.85 }} ms={0} />;
  if (estilo === 'anillo') return <Anillo tam={36} grueso={9} fraccion={ejemplo} ms={0} />;
  if (estilo === 'arco') return <Arco ancho={40} grueso={9} fraccion={ejemplo} estrella={false} ms={0} />;
  if (estilo === 'barra') return <View style={{ width: 38 }}><Barra fraccion={ejemplo} comidas={[3, 4, 2]} /></View>;
  return <Luna tam={36} fraccion={ejemplo} ms={0} />;
}

const st = StyleSheet.create({
  barra: { position: 'relative', alignSelf: 'stretch' },
  pista: { flex: 1, flexDirection: 'row', gap: 2, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.09)' },
  segmento: { height: '100%' },
  marca: { position: 'absolute', top: -4, bottom: -4, width: 2, marginLeft: -1, borderRadius: 1, backgroundColor: colores.cifra, boxShadow: '0 0 6px rgba(251, 242, 217, 0.7)' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  porcentaje: { fontFamily: letras.numeroLiviano, color: 'rgba(239, 230, 207, 0.62)', letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
});
