// La línea de qué comer antes o después de entrenar, debajo del nombre de la comida que toca (en
// Comida y en la hoja de registro). Nunca un aviso: se lee al pasar. Tocarla dice por qué, con las
// fuentes, y ahí se apaga.

import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { Linea } from '@/dominio/alrededorDelEntreno';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { HojaModal } from '../HojaModal';
import { Aparece, Parrafo } from '../tarjetas';
import { Boton, Icono } from './comunes';
import { useNumeros } from './datos';
import { porQueDe, textoDeLinea } from './entreno';

export function LineaDeEntreno({ linea }: { linea: Linea }) {
  const numeros = useNumeros();
  const [porQue, setPorQue] = useState(false);
  return (
    <Aparece>
      <Pressable onPress={() => setPorQue(true)} style={({ pressed }) => [st.linea, pressed && st.apretada]} accessibilityRole="button" accessibilityHint={t('entreno.porQue.titulo')}>
        <Icono nombre="dumbbell" tam={13} color={colores.oroClaro} />
        <Text style={st.texto}>{textoDeLinea(linea, numeros)}</Text>
      </Pressable>
      {porQue && (
        <HojaModal
          abierta
          titulo={t('entreno.porQue.titulo')}
          alCerrar={() => setPorQue(false)}
          pie={<Boton tipo="contorno" texto={t('entreno.porQue.noMostrar')} alTocar={() => { setPorQue(false); elAlmacen().ponerVerEntreno(false); }} />}
        >
          <Parrafo>{porQueDe(linea)}</Parrafo>
          {linea.cafeinaHasta !== undefined && <Parrafo>{t('entreno.porQue.cafeina')}</Parrafo>}
          <Parrafo chico>{t('entreno.porQue.fuentes')}</Parrafo>
          <Parrafo chico>{t('entreno.porQue.medico')}</Parrafo>
          <Parrafo chico>{t('entreno.porQue.volver')}</Parrafo>
        </HojaModal>
      )}
    </Aparece>
  );
}

const st = StyleSheet.create({
  linea: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 12,
    backgroundColor: 'rgba(232, 196, 106, 0.07)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.16)',
  },
  apretada: { opacity: 0.7 },
  texto: { flex: 1, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.85)' },
});
