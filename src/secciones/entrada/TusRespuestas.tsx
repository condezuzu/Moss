// «Tus respuestas» (lo pediste el 5/11: el cuestionario se cambia cuando quieras): desde Perfil, el mismo
// cuestionario de la entrada (Preguntas.tsx) con lo contestado, desde tus datos hasta tu día. Se puede cerrar en
// cualquier pregunta sin cambiar nada; al final, la meta nueva al lado de la de antes y «Guardar», que rehace la
// meta desde hoy (almacen.cambiarRespuestas). Sin la estrella guía: la barra va dibujada.
// Tus horas de comer (18/11): «¿Cómo es tu día?» muestra las de ahora (horasDeComerDe: a mano, de lo que anotas o de
// tu día), y la que cambias queda fija (horasPuestasAMano). Perfil › Avisos lo abre ahí mismo, con `desde="dia"`.
//
// Perfil lo abre así: <TusRespuestas visible={abierta} alCerrar={() => setAbierta(false)} />

import * as Haptics from 'expo-haptics';
import { useCallback, useState, useSyncExternalStore } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeOut, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { horasDeComerDe, metaVigente } from '@/almacen/almacen';
import { CON_HORA } from '@/dominio/comidas';
import { horasPuestasAMano } from '@/dominio/recordatorios';
import { t } from '@/textos';
import { colores } from '@/tema';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { Cabeza, PantallaDePregunta, Resultado, type DeSalud } from './Preguntas';
import { desdeLoGuardado, lugarDe, paraGuardar, preguntasDe, type Contestado, type Pregunta } from './respuestas';

const SIN_NOCHES: never[] = [];
const NADA_DE_SALUD: DeSalud = new Set();

export function TusRespuestas({ visible, alCerrar, desde }: { visible: boolean; alCerrar: () => void; desde?: Pregunta }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={alCerrar}>
      {visible && <Cuestionario alCerrar={alCerrar} empezarEn={desde} />}
    </Modal>
  );
}

/** Lo guardado, con tus horas de comer de ahora en «¿Cómo es tu día?» (las que no sueles hacer quedan como estaban). */
function conTusHoras(): { r: Contestado; mostradas: Contestado['horarios'] } {
  const e = elAlmacen().estado();
  const r = desdeLoGuardado(e);
  const hora = horasDeComerDe(e);
  const mostradas = Object.fromEntries(CON_HORA.map((c) => [c, r.noSuele[c] ? r.horarios[c] : hora(c).minutos])) as Contestado['horarios'];
  return { r: { ...r, horarios: mostradas }, mostradas };
}

function Cuestionario({ alCerrar, empezarEn }: { alCerrar: () => void; empezarEn?: Pregunta }) {
  const insets = useSafeAreaInsets();
  const reducido = useReducedMotion();
  const hoy = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().hoy);
  const noches = useSyncExternalStore(elAlmacen().suscribir, () => elAlmacen().estado().salud?.noches ?? SIN_NOCHES);
  const [inicio] = useState(conTusHoras);
  const [r, setR] = useState<Contestado>(inicio.r);
  const [kcalAntes] = useState(() => {
    const e = elAlmacen().estado();
    return metaVigente(e, e.hoy)?.kcal ?? null;
  });
  // Con Salud, la primera es «Esto dice Salud»; si no, el sexo.
  const desde: Pregunta = r.salud ? 'tu' : 'sexo';
  const [paso, setPaso] = useState<Pregunta | 'resultado'>(empezarEn ?? desde);
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
    // Las horas que no tocaste quedan como las contestaste (siguen su regla); las que moviste, fijas.
    const guardado = desdeLoGuardado(elAlmacen().estado());
    const movida = (x: (typeof CON_HORA)[number]) => r.horarios[x] !== inicio.mostradas[x];
    const horarios = Object.fromEntries(CON_HORA.map((x) => [x, movida(x) ? r.horarios[x] : guardado.horarios[x]])) as Contestado['horarios'];
    const { c, nuevo } = paraGuardar({ ...r, horarios }, hoy, noches);
    // Si solo cambiaron las horas de comer, la meta queda como está: cambiar cuándo comes no cambia cuánto.
    const sinHoras = (x: Contestado) => JSON.stringify({ ...x, horarios: null, noSuele: null });
    elAlmacen().cambiarRespuestas(c, 'manual', sinHoras(r) === sinHoras(inicio.r) ? { ...nuevo, meta: null } : nuevo);
    elAlmacen().ponerHorasDeComer(horasPuestasAMano({ mostradas: inicio.mostradas, elegidas: r.horarios, noSuele: r.noSuele, antes: elAlmacen().estado().horasDeComer }));
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
