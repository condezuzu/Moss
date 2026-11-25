// Con Ascent vinculada, cómo llegas a entrenar también en Sueño (galeria/src/sueno.js, recuperacion): el mismo
// titular de hoy que la sección, sin porcentaje, con lo que pone el límite en terracota; debajo, la línea del
// rendimiento, solo con la noche corta y si el titular no la dice ya. Tocarlo abre Ascent. Va donde iría tu
// energía, solo cuando ella no está. Sin vínculo o sin el titular, nada.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { lineaDelRendimiento } from '@/dominio/rendimiento';
import { sumarDias } from '@/dominio/fechas';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { useEstado } from '../comida/datos';
import { useSueno } from '../ganchos';
import { CartaDeSueno } from '../sueno/comunes';
import { Aparece } from '../tarjetas';
import { abrirAscent } from './abrir';
import { useTitularDeAscent } from './titularDeHoy';

export function RecuperacionEnSueno() {
  const titular = useTitularDeAscent();
  const hoy = useEstado().hoy;
  const s = useSueno();
  if (!titular) return null;
  // Las de confianza baja no cuentan, como en la deuda.
  const noches = s.deEjemplo ? [] : s.noches.filter((n) => n.confianza.duracion !== 'baja');
  const anoche = noches.find((n) => n.clave === hoy) ?? null;
  const ultimas3 = [0, 1, 2].flatMap((k) => noches.find((n) => n.clave === sumarDias(hoy, -k))?.dormido ?? []);
  const linea = titular.que !== 'suenoCorto' && anoche && lineaDelRendimiento({ dormido: anoche.dormido, necesidad: s.necesidad, despertoAntes: null }, ultimas3)
    ? t('ascent.linea.suenoCorto') : null;
  return (
    <Aparece>
      <CartaDeSueno titulo={t('ascent.vacio.titular')} derecha={<Text style={st.conAscent}>{t('ascent.conAscent')}</Text>}>
        <Pressable onPress={abrirAscent} style={({ pressed }) => [st.fila, pressed && { opacity: 0.7 }]} accessibilityRole="button">
          <View style={st.textos}>
            <Text style={[st.titulo, titular.limita && st.limita]}>{titular.titulo}</Text>
            <Text style={st.texto}>{titular.texto}</Text>
          </View>
          <Icono nombre="chevron.right" tam={13} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
        </Pressable>
        {linea && <Text style={st.nota}>{linea}</Text>}
      </CartaDeSueno>
    </Aparece>
  );
}

const st = StyleSheet.create({
  conAscent: { fontFamily: letras.texto, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: '#8a93a8' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 2 },
  textos: { flex: 1, gap: 5 },
  titulo: { fontFamily: letras.texto, fontSize: 15, lineHeight: 18, color: colores.pergamino },
  limita: { color: '#f2b9a2' },
  texto: { fontFamily: letras.textoLiviano, fontSize: 13, lineHeight: 19, color: 'rgba(214, 226, 250, 0.78)' },
  nota: { marginTop: 8, fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
});
