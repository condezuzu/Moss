// Los primeros hábitos (spec/plan.md, etapa 9): apenas termina la entrada, se eligen de 3 a 5 de
// una lista corta, entre ellos los de comida, y arman la primera constelación. Los de ejemplo se
// archivan. Después se cambian con el editor.

import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { DiaSemana } from '@/dominio/fechas';
import type { Fuente } from '@/dominio/habitos';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { Boton, Icono } from '../comida/comunes';
import { HojaModal } from '../HojaModal';
import { Aparece, Parrafo } from '../tarjetas';
import { habitoSugerido, nombreDe } from './Editor';

type Sugerido = { clave: string; fuente: Fuente; icono: SFSymbol; nombre?: () => string; dias?: DiaSemana[] };

const SUGERIDOS: readonly Sugerido[] = [
  { clave: 'proteina', fuente: { tipo: 'comida', meta: 'proteina' }, icono: 'fork.knife' },
  { clave: 'registrar', fuente: { tipo: 'comida', meta: 'registrar' }, icono: 'list.bullet' },
  { clave: 'calorias', fuente: { tipo: 'comida', meta: 'calorias' }, icono: 'flame' },
  { clave: 'dormir', fuente: { tipo: 'salud', dato: 'sueno', meta: 420 }, icono: 'moon' },
  { clave: 'pasos', fuente: { tipo: 'salud', dato: 'pasos', meta: 8000 }, icono: 'figure.walk' },
  { clave: 'agua', fuente: { tipo: 'salud', dato: 'agua', meta: 2000 }, icono: 'drop' },
  { clave: 'meditar', fuente: { tipo: 'salud', dato: 'mindfulness', meta: 10 }, icono: 'figure.mind.and.body' },
  { clave: 'leer', fuente: { tipo: 'manual' }, icono: 'book', nombre: () => t('habitos.sugeridos.leer'), dias: [1, 2, 3, 4, 5] },
  { clave: 'entrenar', fuente: { tipo: 'manual' }, icono: 'dumbbell', nombre: () => t('habitos.sugeridos.entrenar'), dias: [1, 3, 5] },
  { clave: 'escribir', fuente: { tipo: 'manual' }, icono: 'pencil', nombre: () => t('habitos.sugeridos.escribir') },
];
const DE_FABRICA = ['proteina', 'registrar', 'dormir', 'pasos'];
const MINIMO = 3;
const MAXIMO = 5;

export function Sugeridos({ alCerrar }: { alCerrar: () => void }) {
  const [elegidos, setElegidos] = useState<string[]>(DE_FABRICA);
  const alternar = (clave: string) => {
    Haptics.selectionAsync().catch(() => {});
    setElegidos((antes) => (antes.includes(clave) ? antes.filter((x) => x !== clave) : antes.length < MAXIMO ? [...antes, clave] : antes));
  };
  const armar = () => {
    // En el orden de la lista: la comida primero, en las estrellas más brillantes.
    const lista = SUGERIDOS.filter((s) => elegidos.includes(s.clave)).map((s) => habitoSugerido(s.fuente, s.icono, s.nombre?.(), s.dias));
    elAlmacen().elegirPrimerosHabitos(lista);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    alCerrar();
  };
  const listos = elegidos.length >= MINIMO && elegidos.length <= MAXIMO;
  return (
    <HojaModal
      abierta
      titulo={t('habitos.sugeridos.titulo')}
      alCerrar={alCerrar}
      pie={(
        <>
          <Text style={st.cuantos}>{t('habitos.sugeridos.cuantos', { n: elegidos.length })}</Text>
          <Boton tipo="principal" texto={t('habitos.sugeridos.listo')} alTocar={armar} desactivado={!listos} />
        </>
      )}
    >
      <Parrafo>{t('habitos.sugeridos.texto')}</Parrafo>
      <View style={st.lista}>
        {SUGERIDOS.map((s) => {
          const si = elegidos.includes(s.clave);
          const nombre = s.nombre?.() ?? nombreDe(s.fuente) ?? '';
          return (
            <Pressable key={s.clave} onPress={() => alternar(s.clave)} style={[st.fila, si && st.filaElegida]} accessibilityRole="checkbox" accessibilityState={{ checked: si }}>
              <Icono nombre={s.icono} tam={18} color={si ? colores.oroClaro : 'rgba(239, 230, 207, 0.6)'} />
              <View style={st.textos}>
                <Text style={st.nombre}>{nombre}</Text>
                {s.fuente.tipo !== 'manual' && <Text style={st.detalle}>{t(s.fuente.tipo === 'comida' ? 'habitos.comidaTexto' : 'habitos.saludTexto')}</Text>}
              </View>
              <View style={[st.marca, si && st.marcaElegida]}>{si && <Aparece><Icono nombre="checkmark" tam={11} color={colores.tinta} peso="bold" /></Aparece>}</View>
            </Pressable>
          );
        })}
      </View>
      <Parrafo chico>{t('habitos.sugeridos.despues')}</Parrafo>
    </HojaModal>
  );
}

const st = StyleSheet.create({
  lista: { marginTop: 14, gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.1)', backgroundColor: 'rgba(6, 10, 22, 0.45)' },
  filaElegida: { borderColor: 'rgba(232, 196, 106, 0.6)', backgroundColor: 'rgba(232, 196, 106, 0.08)' },
  textos: { flex: 1, gap: 2 },
  nombre: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.pergamino },
  detalle: { fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.5)' },
  marca: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.3)', alignItems: 'center', justifyContent: 'center' },
  marcaElegida: { borderColor: colores.oro, backgroundColor: colores.oro },
  cuantos: { textAlign: 'center', fontFamily: letras.texto, fontSize: 12, color: 'rgba(239, 230, 207, 0.55)' },
});
