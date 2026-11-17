// «Para hoy», al final de Inicio (lo pediste el 2/11/2026), en vez del saludo de arriba: hasta tres comentarios
// cortos de la comida, una idea cada uno, con lo del deporte primero (paraHoy.ts). Sin nada que decir, una línea
// tranquila. Lo que falta anotar se anota de ahí mismo, en esa comida. Arriba de todo, «Lo que hay que hacer hoy»:
// los pendientes que anotaste anoche (Pendientes.tsx).

import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import type { SFSymbol } from 'expo-symbols';

import type { ConsejoDeHoy } from '@/dominio/paraHoy';
import type { Tema } from '@/dominio/segunElDeporte';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { comidaDeAhora, useEstado } from '../comida/datos';
import { abrirRegistro } from '../comida/registro';
import { ACOMODA } from '../tarjetas';
import { bloques, Cabeza } from './comunes';
import { consejosDeHoy, textoDelConsejo } from './consejos';
import { LoQueHayQueHacer, pendientesDeHoy } from './Pendientes';

const AGUA = '#a9c4f5';
const ICONO: Record<Exclude<ConsejoDeHoy['tipo'], 'deporte'>, SFSymbol> = {
  anotar: 'fork.knife', nadaAnotado: 'fork.knife', pocosCarbohidratos: 'bolt', pocaProteina: 'bolt', muchaGrasa: 'bolt', faltaProteina: 'bolt', agua: 'drop',
};
// Lo del deporte, por su tema: los carbohidratos con el color de los carbohidratos, el agua como el agua.
const ICONO_DEL_TEMA: Record<Tema, SFSymbol> = { carbohidratos: 'bolt', agua: 'drop', alcohol: 'moon', piernas: 'figure.run', minerales: 'fork.knife', sueno: 'moon', energia: 'bolt' };
const COLOR: Partial<Record<ConsejoDeHoy['tipo'] | Tema, string>> = {
  pocosCarbohidratos: colores.salvia, pocaProteina: colores.oroClaro, faltaProteina: colores.oroClaro, muchaGrasa: colores.grasas, agua: AGUA, carbohidratos: colores.salvia,
};

/** Lo que se dice cambia con la hora: se rehace cada cinco minutos. */
function useAhora(): Date {
  const [ahora, setAhora] = useState(() => new Date());
  useEffect(() => {
    const reloj = setInterval(() => setAhora(new Date()), 5 * 60_000);
    return () => clearInterval(reloj);
  }, []);
  return ahora;
}

export function ParaHoy() {
  const e = useEstado();
  const ahora = useAhora();
  const hoy = useMemo(() => consejosDeHoy(e, ahora), [e, ahora]);
  const titulo = t('inicio.bloques.consejos');
  if (!hoy) return null;
  // Arriba de todo, lo que anotaste anoche (17/11): con el aviso de anotar lo pendiente activado y algo para hoy.
  const pendientes = pendientesDeHoy(e);
  return (
    <View style={bloques.bloque}>
      <Cabeza titulo={titulo} />
      {pendientes.length > 0 && <LoQueHayQueHacer lista={pendientes} />}
      {hoy.lista.length === 0 ? (
        <Animated.Text entering={FadeIn.duration(320).reduceMotion(ReduceMotion.Never)} style={st.nada}>
          {t(hoy.anotadas ? 'inicio.paraHoy.bien' : 'inicio.paraHoy.todaviaNada')}
        </Animated.Text>
      ) : (
        hoy.lista.map((x, i) => {
          const tema = x.tipo === 'deporte' ? x.consejo.tema : null;
          const color = (tema ? COLOR[tema] : COLOR[x.tipo]) ?? 'rgba(239, 230, 207, 0.7)';
          const anotar = x.tipo === 'anotar' || x.tipo === 'nadaAnotado';
          return (
            <Animated.View
              // La clave es el consejo: el que sigue igual no vuelve a entrar al cambiar los otros.
              key={x.tipo === 'deporte' ? `${x.tipo}-${x.consejo.que}` : x.tipo}
              entering={FadeIn.duration(400).delay(60 * i).reduceMotion(ReduceMotion.Never)}
              layout={ACOMODA}
              style={[st.fila, i > 0 && st.filaSiguiente]}
            >
              <View style={[st.ico, { backgroundColor: color.startsWith('#') ? `${color}1a` : 'rgba(239, 230, 207, 0.1)' }]}>
                <Icono nombre={tema ? ICONO_DEL_TEMA[tema] : ICONO[x.tipo as Exclude<ConsejoDeHoy['tipo'], 'deporte'>]} tam={15} color={color} />
              </View>
              <Text style={st.texto}>{textoDelConsejo(x, e.numeros)}</Text>
              {anotar && (
                <Pressable
                  onPress={() => abrirRegistro({ comida: x.tipo === 'anotar' ? x.comidas[0] : comidaDeAhora() })}
                  style={({ pressed }) => [st.accion, pressed && st.apretado]}
                  accessibilityRole="button"
                  hitSlop={6}
                >
                  <Text style={st.accionTexto} maxFontSizeMultiplier={1.4}>{t('inicio.paraHoy.anotarBoton')}</Text>
                </Pressable>
              )}
            </Animated.View>
          );
        })
      )}
    </View>
  );
}

const st = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 2, paddingBottom: 10 },
  filaSiguiente: { paddingTop: 10, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  ico: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  texto: { flex: 1, marginTop: 3, fontFamily: letras.textoLiviano, fontSize: 14, lineHeight: 20.3, color: 'rgba(239, 230, 207, 0.86)' },
  accion: { alignSelf: 'center', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.45)', backgroundColor: 'rgba(232, 196, 106, 0.08)' },
  accionTexto: { fontFamily: letras.textoMedio, fontSize: 12.5, color: colores.oroClaro },
  apretado: { opacity: 0.6, transform: [{ scale: 0.96 }] },
  nada: { fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19.5, color: 'rgba(239, 230, 207, 0.6)' },
});
