// «Tus respuestas» (lo pediste el 5/11: el cuestionario se cambia cuando quieras): desde Perfil, el mismo
// cuestionario de la entrada (Preguntas.tsx) con lo contestado, desde tus datos hasta tu día. Se puede cerrar en
// cualquier pregunta sin cambiar nada; al final, la meta nueva al lado de la de antes y «Guardar», que rehace la
// meta desde hoy (almacen.cambiarRespuestas). Sin la estrella guía: la barra va dibujada.
//
// Perfil lo abre así: <TusRespuestas visible={abierta} alCerrar={() => setAbierta(false)} />

import * as Haptics from 'expo-haptics';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { metaVigente } from '@/almacen/almacen';
import { t } from '@/textos';
import { colores } from '@/tema';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { Cabeza, PantallaDePregunta, Resultado, type DeSalud } from './Preguntas';
import { desdeLoGuardado, lugarDe, paraGuardar, preguntasDe, type Contestado, type Pregunta } from './respuestas';

const SIN_NOCHES: never[] = [];
const NADA_DE_SALUD: DeSalud = new Set();

export function TusRespuestas({ visible, alCerrar }: { visible: boolean; alCerrar: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={alCerrar}>
      {visible && <Cuestionario alCerrar={alCerrar} />}
    </Modal>
  );
}

function Cuestionario({ alCerrar }: { alCerrar: () => void }) {
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const hoy = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().hoy);
  const noches = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().salud?.noches ?? SIN_NOCHES);
  const [r, setR] = useState<Contestado>(() => desdeLoGuardado(elAlmacen().estado()));
  const [kcalAntes] = useState(() => {
    const e = elAlmacen().estado();
    return metaVigente(e, e.hoy)?.kcal ?? null;
  });
  // Con Salud, la primera es «Esto dice Salud»; si no, el sexo.
  const desde: Pregunta = r.salud ? 'tu' : 'sexo';
  const [paso, setPaso] = useState<Pregunta | 'resultado'>(desde);
  const [volviendo, setVolviendo] = useState(false);
  const poner = useCallback((cambio: (x: Contestado) => Contestado) => setR(cambio), []);

  const lista = preguntasDe(r, desde);
  const siguiente = () => {
    const i = paso === 'resultado' ? -1 : lista.indexOf(paso);
    setVolviendo(false);
    setPaso(i >= 0 && i < lista.length - 1 ? lista[i + 1] : 'resultado');
  };
  const anterior = paso === 'resultado' ? lista[lista.length - 1] : lista[lista.indexOf(paso) - 1];
  const atras = anterior
    ? () => {
        Haptics.selectionAsync().catch(() => {});
        setVolviendo(true);
        setPaso(anterior);
      }
    : undefined;
  const guardar = () => {
    const { c, nuevo } = paraGuardar(r, hoy, noches);
    elAlmacen().cambiarRespuestas(c, 'manual', nuevo);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    alCerrar();
  };
  const lugar = paso === 'resultado' ? null : lugarDe(paso, r, desde);
  const id = paso === 'resultado' ? null : paso;
  const entra = reducido ? ENTRA_FUNDIDO : (volviendo ? FadeInUp : FadeInDown).delay(200).duration(500);
  return (
    <View style={[s.fondo, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Animated.View key={paso} entering={entra} exiting={reducido ? SALE_FUNDIDO : FadeOut.duration(220).reduceMotion(ReduceMotion.Never)} style={s.pantalla}>
        {lugar && id ? (
          <>
            <Cabeza i={lugar.i} total={lugar.total} alAtras={atras} alCerrar={alCerrar} barra />
            <PantallaDePregunta id={id} r={r} poner={poner} deSalud={NADA_DE_SALUD} hoy={hoy} noches={noches} alSeguir={siguiente} />
          </>
        ) : (
          <>
            <Cabeza i={lista.length - 1} total={lista.length} alAtras={atras} alCerrar={alCerrar} barra />
            <Resultado r={r} hoy={hoy} alEmpezar={guardar} boton={t('entrada.cuestionario.revisar.guardar')} kcalAntes={kcalAntes} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: colores.noche0 },
  pantalla: { flex: 1, paddingHorizontal: 26 },
});
