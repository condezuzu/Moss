// Una meta de fuerza, nueva o para cambiarla, en una hoja: se abre a la vista desde donde se la toca, sin correr la
// sección. El ejercicio se elige como en Ascent (su SelectorEjercicio): el campo vacío y, al tocarlo, el buscador, los
// que ya haces y cada grupo con todas sus variantes, en el orden de Ascent. Una meta por ejercicio: el que ya tiene una
// lo dice, y tocarlo abre esa para cambiarla. Las repeticiones arrancan en las que sueles hacer en el ejercicio
// (repsDeSiempre) y, sin sesiones, vacías. El peso va en la unidad de Perfil y, si el ejercicio se anota por mancuerna
// o por lado (o nunca lo anotaste y en Ascent va así), se pide así y se guarda el total. Se cierra al guardar (un toque:
// el segundo no guarda otra vez): la meta ya está en la lista, y si el servidor no la guarda, vuelve lo de antes y un
// aviso lo dice, con «Reintentar», que abre la hoja otra vez con lo escrito (`borrador`). Con 20 metas no deja poner
// otra. Borrar pregunta antes, como iOS: también se borra en Ascent.

import { useRef, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';

import type { MetaPedida } from '@/almacen/ascent';
import type { Sistema } from '@/dominio/cantidades';
import { decimal } from '@/comida/porciones';
import type { GrupoDeAscent } from '@/dominio/musculos';
import { idioma, t } from '@/textos';
import { letras } from '@/tema';
import { Icono } from '../comida/comunes';
import { numero } from '../comida/datos';
import { HojaModal } from '../HojaModal';
import { tecladoDeNumeros } from '../teclado';
import { C } from './colores';
import { buscarEjercicios, enLaUnidad, kilosDeLaMeta, ladoDe, nombreDelEjercicio, pesoEn, tx } from './palabras';
import { Accion, Desplegable, Enlace, Etiqueta, Flecha, Fundido } from './piezas';
import { METAS_TOPE, REPS_DE_UNA_META, type MetaConProyeccion, type ParaLaMeta } from './vista';

/** Los grupos, en el orden del selector de Ascent: el tren superior, el inferior y el core. */
const GRUPOS: readonly GrupoDeAscent[] = ['pecho', 'espalda', 'hombros', 'brazos', 'piernas', 'core'];

/** Lo escrito en la hoja, tal cual: para volver a ella si no se pudo guardar. */
export type Borrador = { ejercicio: string; peso: string; reps: string };

type Props = {
  abierta: boolean;
  /** La meta que se cambia; null, una nueva. */
  meta: MetaConProyeccion | null;
  /** Lo que se escribió la vez que no se pudo guardar; si no, null. */
  borrador: Borrador | null;
  /** Las que ya hay: un ejercicio con meta no se elige para otra, se abre la suya. */
  metas: readonly MetaConProyeccion[];
  ejercicios: readonly ParaLaMeta[];
  sistema: Sistema;
  alCerrar: () => void;
  /** Guarda la meta (la hoja ya se cerró), con lo escrito por si no se puede. */
  alGuardar: (m: MetaPedida, borrador: Borrador) => void;
  alBorrar: (id: string) => void;
};

/** El peso de una meta como se escribe: en la unidad de Perfil y, si es por mancuerna o por lado, la mitad. */
const pesoEscrito = (m: MetaConProyeccion, s: Sistema) =>
  decimal(pesoEn(m.meta.kilos / (ladoDe({ id: m.meta.ejercicio, carga: m.carga }) ? 2 : 1), s), idioma(), false);

/** La pregunta de iOS antes de borrar, como la de descartar.ts. */
function confirmarBorrar(alBorrar: () => void) {
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(t('ascent.metas.borrarTitulo'))) alBorrar();
    return;
  }
  Alert.alert(t('ascent.metas.borrarTitulo'), t('ascent.metas.borrarTexto'), [
    { text: t('comun.cancelar'), style: 'cancel' },
    { text: t('ascent.metas.borrar'), style: 'destructive', onPress: alBorrar },
  ]);
}

export function HojaDeMeta({ abierta, meta: deEntrada, borrador, metas, ejercicios, sistema, alCerrar, alGuardar, alBorrar }: Props) {
  // La que se cambia: la que llegó, la del ejercicio del borrador o, si se elige un ejercicio que ya tiene meta, la suya.
  const delBorrador = borrador ? (metas.find((x) => x.meta.ejercicio === borrador.ejercicio && !x.meta.pendiente) ?? null) : null;
  const [meta, setMeta] = useState(deEntrada ?? delBorrador);
  const [elegido, setElegido] = useState<ParaLaMeta | null>(borrador && !delBorrador ? (ejercicios.find((x) => x.id === borrador.ejercicio) ?? null) : null);
  const [eligiendo, setEligiendo] = useState(false);
  const ejercicio = meta ? { id: meta.meta.ejercicio, carga: meta.carga } : elegido;
  const lado = ejercicio ? ladoDe(ejercicio) : null;
  const [peso, setPeso] = useState(() => borrador?.peso ?? (meta ? pesoEscrito(meta, sistema) : ''));
  // Una meta nueva arranca sin repeticiones: llegan con el ejercicio.
  const [reps, setReps] = useState(() => borrador?.reps ?? (meta ? String(meta.meta.reps) : ''));
  const campoDePeso = useRef<TextInputInstance>(null);
  const campoDeReps = useRef<TextInputInstance>(null);
  const guardada = useRef(false);
  const conMeta = new Map(metas.map((x) => [x.meta.ejercicio, x]));
  // Lo escrito es de una mancuerna o de un lado: la meta se guarda en total, como llegan los kilos de Ascent.
  const kilos = Math.round(kilosDeLaMeta(peso, sistema) * (lado ? 2 : 1) * 100) / 100;
  const veces = Number(reps);
  // Una nueva, con 20 ya puestas, no: el servidor la rechaza. Cambiar una de las que hay, sí.
  const llena = !meta && metas.length >= METAS_TOPE;
  const lista = !!ejercicio && !llena && kilos >= 1 && kilos <= 1000 && Number.isInteger(veces) && veces >= 1 && veces <= REPS_DE_UNA_META;
  const guardar = () => {
    // Un segundo toque mientras la hoja se va no guarda otra vez.
    if (!lista || !ejercicio || guardada.current) return;
    guardada.current = true;
    alCerrar();
    alGuardar({ ...(meta ? { id: meta.meta.id } : {}), ejercicio: ejercicio.id, kilos, reps: veces }, { ejercicio: ejercicio.id, peso, reps });
  };
  const elegir = (x: ParaLaMeta) => {
    setEligiendo(false);
    const suya = conMeta.get(x.id);
    if (suya) {
      // Ya tiene meta: se cambia esa en vez de hacer otra.
      setMeta(suya);
      setPeso(pesoEscrito(suya, sistema));
      setReps(String(suya.meta.reps));
      return;
    }
    // Las que sueles hacer en este, salvo que ya escribiste otras.
    if (!reps || reps === String(elegido?.reps ?? '')) setReps(x.reps ? String(x.reps) : '');
    setElegido(x);
    // Lo que sigue es el peso: el teclado queda (o sube) ahí.
    campoDePeso.current?.focus();
  };
  const etiquetaDelPeso = `${t('progreso.peso')}${lado ? ` ${tx(`ascent.metas.${lado}`)}` : ''}`;
  return (
    <HojaModal
      abierta={abierta}
      titulo={t(meta ? 'ascent.metas.editar' : 'ascent.metas.nueva')}
      alCerrar={alCerrar}
      pie={(
        <>
          <Accion texto={t('ascent.metas.guardar')} alTocar={guardar} apagado={!lista} />
          <Desplegable abierto={!!meta}>
            <Enlace
              texto={t('ascent.metas.borrar')}
              alTocar={() => {
                if (!meta) return;
                confirmarBorrar(() => {
                  alCerrar();
                  alBorrar(meta.meta.id);
                });
              }}
              estilo={st.borrar}
            />
          </Desplegable>
        </>
      )}
    >
      {/* Al elegir un ejercicio que ya tiene meta, el campo deja lugar a su nombre. */}
      <Desplegable abierto={!!meta}>
        {meta && <Text style={st.nombre}>{nombreDelEjercicio(meta.e)}</Text>}
      </Desplegable>
      <Desplegable abierto={!meta}>
        <Text style={st.etiqueta}>{t('ascent.metas.elegir')}</Text>
        <Pressable
          onPress={() => setEligiendo((x) => !x)}
          style={({ pressed }) => [st.campo, pressed && st.apretado]}
          accessibilityRole="button"
          accessibilityState={{ expanded: eligiendo }}
          accessibilityLabel={elegido ? nombreDelEjercicio(elegido) : t('ascent.metas.elegir')}
        >
          <Text style={st.campoTexto} numberOfLines={1}>{elegido ? nombreDelEjercicio(elegido) : ''}</Text>
          <Flecha abierta={eligiendo} />
        </Pressable>
        <Desplegable abierto={eligiendo} sigue>
          <Ejercicios lista={ejercicios} conMeta={conMeta} elegido={elegido?.id ?? null} alElegir={elegir} />
        </Desplegable>
      </Desplegable>
      <View style={st.numeros}>
        <View style={st.crece}>
          <Text style={st.etiqueta}>{etiquetaDelPeso}</Text>
          <View style={st.campo}>
            <TextInput
              ref={campoDePeso}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              {...tecladoDeNumeros(true)}
              onSubmitEditing={() => campoDeReps.current?.focus()}
              selectTextOnFocus
              maxLength={7}
              selectionColor={C.claro}
              style={st.entrada}
              accessibilityLabel={`${etiquetaDelPeso} (${sistema === 'imperial' ? 'lb' : 'kg'})`}
            />
            <Text style={st.unidad}>{sistema === 'imperial' ? 'lb' : 'kg'}</Text>
          </View>
        </View>
        <View style={st.crece}>
          <Text style={st.etiqueta}>{t('ascent.metas.reps')}</Text>
          <View style={st.campo}>
            <TextInput
              ref={campoDeReps}
              value={reps}
              onChangeText={setReps}
              keyboardType="number-pad"
              {...tecladoDeNumeros()}
              selectTextOnFocus
              maxLength={2}
              selectionColor={C.claro}
              style={st.entrada}
              accessibilityLabel={t('ascent.metas.reps')}
            />
          </View>
        </View>
      </View>
      {/* Como en Ascent: debajo del campo, el total, solo cuando lo escrito no lo es. */}
      <Desplegable abierto={!!lado}>
        <Text style={st.total}>{kilos > 0 ? enLaUnidad(t('ascent.metas.enTotal', { kg: numero(pesoEn(kilos, sistema), 1) }), sistema) : ' '}</Text>
      </Desplegable>
      <Desplegable abierto={llena}>
        <Text style={st.tope}>{t('ascent.metas.tope', { n: METAS_TOPE })}</Text>
      </Desplegable>
    </HojaModal>
  );
}

/** El buscador y la lista: escribiendo, los que coinciden y los que entrenan lo mismo; sin escribir, los que ya haces y cada grupo. */
function Ejercicios({ lista, conMeta, elegido, alElegir }: {
  lista: readonly ParaLaMeta[]; conMeta: ReadonlyMap<string, MetaConProyeccion>; elegido: string | null; alElegir: (x: ParaLaMeta) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [grupo, setGrupo] = useState<GrupoDeAscent | null>(null);
  const hallados = buscarEjercicios(lista, busqueda);
  // Lo que se encuentra entra con un fundido cuando cambia (y la hoja se estira deslizándose: `sigue`, afuera).
  const encontrados = busqueda.trim() ? [...hallados.coinciden, ...hallados.parecidos].map((x) => x.id).join() || '-' : '';
  // Primero los que ya haces, del más reciente al más viejo.
  const hechos = lista.filter((x) => x.hecho).sort((a, b) => (a.hecho! < b.hecho! ? 1 : a.hecho! > b.hecho! ? -1 : 0));
  const fila = (x: ParaLaMeta) => {
    const suya = conMeta.get(x.id);
    // Recién puesta, la suya todavía no tiene id para cambiarla: se puede apenas el servidor la guarda.
    return <Fila key={x.id} texto={nombreDelEjercicio(x)} nota={suya && t('ascent.metas.yaTiene')} apagada={!!suya?.meta.pendiente} elegida={x.id === elegido} alTocar={() => alElegir(x)} />;
  };
  return (
    <View style={st.lista}>
      <View style={st.buscador}>
        <Icono nombre="magnifyingglass" tam={15} color={C.sub} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder={t('ascent.metas.buscar')}
          placeholderTextColor={C.apagado}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          keyboardAppearance="dark"
          clearButtonMode="while-editing"
          selectionColor={C.claro}
          style={st.buscar}
          accessibilityLabel={t('ascent.metas.buscar')}
        />
      </View>
      <Fundido clave={encontrados}>
        {busqueda.trim() ? (
          <>
            {hallados.coinciden.map(fila)}
            {!hallados.coinciden.length && <Text style={st.nada}>{t('ascent.metas.nada')}</Text>}
            {hallados.parecidos.length > 0 && <Etiqueta style={st.rotulo}>{t('ascent.metas.parecidos')}</Etiqueta>}
            {hallados.parecidos.map(fila)}
          </>
        ) : (
          <>
            {hechos.length > 0 && <Etiqueta style={st.rotulo}>{t('ascent.metas.hechos')}</Etiqueta>}
            {hechos.map(fila)}
            {hechos.length > 0 && <View style={st.separa} />}
            {GRUPOS.map((g) => {
              const suyos = lista.filter((x) => x.grupo === g);
              return (
                <View key={g}>
                  <Pressable
                    onPress={() => setGrupo((x) => (x === g ? null : g))}
                    style={({ pressed }) => [st.fila, pressed && st.apretado]}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: grupo === g }}
                  >
                    <Text style={st.grupo}>{tx(`ascent.hoy.grupos.${g}`)}</Text>
                    <Text style={st.cuantos}>{suyos.length}</Text>
                    <Flecha abierta={grupo === g} />
                  </Pressable>
                  <Desplegable abierto={grupo === g} style={st.delGrupo}>{suyos.map(fila)}</Desplegable>
                </View>
              );
            })}
          </>
        )}
      </Fundido>
    </View>
  );
}

function Fila({ texto, nota, apagada, elegida, alTocar }: { texto: string; nota?: string; apagada?: boolean; elegida: boolean; alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      disabled={apagada}
      style={({ pressed }) => [st.fila, (pressed || apagada) && st.apretado]}
      accessibilityRole="button"
      accessibilityState={{ selected: elegida, disabled: !!apagada }}
      accessibilityLabel={nota ? `${texto}, ${nota}` : texto}
    >
      <Text style={[st.filaTexto, elegida && st.filaElegida]} numberOfLines={1}>{texto}</Text>
      {nota && <Text style={st.filaNota}>{nota}</Text>}
    </Pressable>
  );
}

const st = StyleSheet.create({
  crece: { flex: 1, minWidth: 0 },
  apretado: { opacity: 0.6 },
  nombre: { marginTop: 4, fontFamily: letras.texto, fontSize: 17, lineHeight: 22, color: C.tinta },
  etiqueta: { marginTop: 10, fontFamily: letras.texto, fontSize: 12.5, color: C.sub },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 46, marginTop: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: C.lineaFuerte, backgroundColor: 'rgba(232, 236, 246, 0.04)' },
  campoTexto: { flex: 1, fontFamily: letras.texto, fontSize: 15.5, color: C.tinta },
  entrada: { flex: 1, minWidth: 0, paddingVertical: 10, fontFamily: letras.numero, fontSize: 17, color: C.tinta },
  unidad: { fontFamily: letras.texto, fontSize: 13, color: C.sub },
  numeros: { flexDirection: 'row', gap: 12, marginTop: 6 },
  total: { marginTop: 8, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.sub, fontVariant: ['tabular-nums'] },
  tope: { marginTop: 12, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: C.lejos },
  borrar: { alignSelf: 'center', marginTop: 4 },
  // La lista
  lista: { paddingTop: 10, paddingBottom: 6 },
  buscador: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 42, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: C.lineaFuerte },
  buscar: { flex: 1, minWidth: 0, paddingVertical: 9, fontFamily: letras.texto, fontSize: 15, color: C.tinta },
  rotulo: { marginTop: 16, marginBottom: 2 },
  separa: { height: 14 },
  nada: { marginTop: 12, fontFamily: letras.texto, fontSize: 13, color: C.apagado },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 46, borderBottomWidth: 1, borderBottomColor: C.lineaSuave },
  filaTexto: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: C.sub },
  filaElegida: { fontFamily: letras.textoMedio, color: C.tinta },
  filaNota: { fontFamily: letras.texto, fontSize: 12.5, color: C.apagado },
  grupo: { flex: 1, fontFamily: letras.texto, fontSize: 15.5, color: C.tinta },
  cuantos: { fontFamily: letras.numero, fontSize: 13, color: C.sub, fontVariant: ['tabular-nums'] },
  delGrupo: { paddingLeft: 14 },
});
