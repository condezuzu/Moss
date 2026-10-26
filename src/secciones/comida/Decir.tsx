// Decir o escribir la comida de una vez (lo pediste el 26/10): «dos huevos revueltos, una tostada
// con manteca y un café con leche». Se habla con el micrófono (en el teléfono) o se escribe; Moss lo
// entiende (src/comida/frase.ts y entender.ts) y lo muestra para revisar: cada alimento con su
// cantidad, que se cambia ahí mismo, y una pregunta solo si cambia el número, con la respuesta ya
// marcada. «Agregar» no espera a que se conteste nada.

import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { baseDeAlimentos } from '@/comida/base';
import { normalizar } from '@/comida/buscar';
import { entender, type Entendido, type Opcion } from '@/comida/entender';
import { conCon, leerFrase } from '@/comida/frase';
import { pasoDeCantidad, pasoDePorcion, type Sistema } from '@/dominio/cantidades';
import type { Comida } from '@/dominio/comidas';
import { itemDeAlimento, premios, recientes, sumarValores, ultimaCantidad, valoresDeCantidad, type Item } from '@/dominio/registros';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { ACOMODA } from '../tarjetas';
import { Boton, Icono, Pastilla } from './comunes';
import { cantidadDeTexto, numero, opcionesDeIdioma, useEstado } from './datos';
import { hayDictado, useDictado } from './dictado';
import { Panel } from './Paneles';

type Props = {
  comida: Comida;
  sistema: Sistema;
  /** Abrió con el micrófono: escucha apenas aparece. */
  escuchar: boolean;
  /** Lo que se escribió en el buscador, si se llegó desde ahí. */
  textoInicial?: string;
  alAtras: () => void;
  /** Lo entendido, para anotarlo en la comida (la dicha, si se dijo: «en el almuerzo»). */
  alAgregar: (items: Item[], comida: Comida) => void;
  /** Lo que no se encontró se busca a mano. */
  alBuscar: (texto: string) => void;
  abajo: number;
};

/** La cantidad de una opción, un paso más o menos: las porciones de a una, los gramos por tramos. */
function otraCantidad(o: Opcion, signo: 1 | -1): Opcion {
  const c = o.cantidad;
  // Los gramos van siempre en gramos, también con el sistema imperial.
  const cantidad = 'porcion' in c ? { ...c, veces: pasoDePorcion(c.veces, signo) } : { gramos: pasoDeCantidad(c.gramos, signo, 'peso', 'metrico') };
  return { ...o, cantidad, valores: valoresDeCantidad(o.alimento.por100g, cantidad) };
}

export function PanelDecir(p: Props) {
  const e = useEstado();
  const [texto, setTexto] = useState(p.textoInicial ?? '');
  const [entendidos, setEntendidos] = useState<Entendido[] | null>(null);
  const [entendiendo, setEntendiendo] = useState(false);
  const [comida, setComida] = useState(p.comida);
  // El texto que se entendió: si se cambia, hay que volver a entender.
  const [entendido, setEntendido] = useState<string | null>(null);

  const entenderTexto = async (frase: string) => {
    if (!frase.trim()) return;
    setEntendiendo(true);
    const op = opcionesDeIdioma();
    const premio = premios(e.registros.values(), e.hoy);
    const buscar = (x: string) => baseDeAlimentos.buscar(x, { ...op, limite: 8, premio: (id) => premio.get(id) ?? 0 });
    // «Café con leche» es uno si la base lo tiene con ese nombre; si no, se corta en el «con».
    const conNombre = new Set<string>();
    await Promise.all(conCon(frase, op.idioma).map(async (b) => {
      const [r] = await buscar(b);
      if (r && normalizar(r.coincide) === normalizar(b)) conNombre.add(b);
    }));
    const leida = leerFrase(frase, op.idioma, (b) => conNombre.has(b));
    if (leida.comida) setComida(leida.comida);
    const lista = await entender(leida.dichos, {
      buscar,
      detalle: (id) => baseDeAlimentos.detalle(id, op),
      ultimaCantidad: (ref) => ultimaCantidad(e.registros.values(), 'base', ref),
      alias: (b) => e.alias[normalizar(b)],
      conocido: (id) => (premio.get(id) ?? 0) > 0,
    });
    setEntendido(frase);
    setEntendidos(lista);
    setEntendiendo(false);
    Haptics.selectionAsync().catch(() => {});
  };
  const entenderYa = (frase: string) => {
    entenderTexto(frase).catch(() => setEntendiendo(false));
  };

  const dictado = useDictado({ alTexto: setTexto, alTerminar: entenderYa });
  const conMicrofono = hayDictado();
  // Lo que la persona suele comer ayuda a reconocer los nombres.
  const contexto = () => recientes(e.registros.values(), 60).map((i) => i.nombre);
  const hablar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (dictado.escuchando) dictado.parar();
    else dictado.empezar(contexto()).catch(() => {});
  };
  // Al abrir, cuando el panel ya entró: escucha, o entiende lo que se escribió en el buscador.
  useEffect(() => {
    const espera = setTimeout(() => {
      if (p.escuchar && conMicrofono) dictado.empezar(contexto()).catch(() => {});
      else if (p.textoInicial) entenderYa(p.textoInicial);
    }, 320);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (i: number, cambio: (x: Entendido) => Entendido) => setEntendidos((lista) => lista && lista.map((x, k) => (k === i ? cambio(x) : x)));
  const elegir = (i: number, k: number) => {
    Haptics.selectionAsync().catch(() => {});
    cambiar(i, (x) => ({ ...x, elegida: k }));
  };
  const mover = (i: number, signo: 1 | -1) => cambiar(i, (x) => ({ ...x, supuesto: false, opciones: x.opciones.map((o, k) => (k === x.elegida ? otraCantidad(o, signo) : o)) }));
  const quitar = (i: number) => setEntendidos((lista) => lista && lista.filter((_, k) => k !== i));

  const elegidas = (entendidos ?? []).flatMap((x) => (x.opciones[x.elegida] ? [{ x, o: x.opciones[x.elegida] }] : []));
  const total = sumarValores(elegidas.map(({ o }) => o.valores));
  const cambioElTexto = entendido !== null && texto.trim() !== entendido.trim();

  const agregar = () => {
    const items = elegidas.map(({ o }) => ({ ...itemDeAlimento('base', o.alimento.ref, o.alimento.nombre, o.alimento.por100g, o.cantidad), estimado: true as const }));
    // Cada respuesta se recuerda: la próxima vez, esas palabras ya no preguntan.
    for (const { x, o } of elegidas) if (x.pregunta === 'cual' || x.pregunta === 'crudo') elAlmacen().ponerAlias(normalizar(x.dicho.buscado), Number(o.alimento.ref));
    p.alAgregar(items, comida);
  };

  return (
    <Panel
      titulo={t('comida.decir.titulo')}
      alAtras={p.alAtras}
      abajo={p.abajo}
      pie={entendidos && !cambioElTexto && elegidas.length > 0
        ? <Boton tipo="grande" texto={`${t(`comida.agregarA.${comida}`)} · ${numero(Math.round(total.kcal))} kcal`} alTocar={agregar} />
        : <Boton tipo="secundario" texto={entendiendo ? t('comida.decir.entendiendo') : t('comida.decir.entender')} desactivado={!texto.trim() || entendiendo || dictado.escuchando} alTocar={() => entenderYa(texto)} />}
    >
      {conMicrofono && <Microfono escuchando={dictado.escuchando} alTocar={hablar} />}
      <Text style={st.ayuda}>{dictado.escuchando ? t('comida.decir.teEscucho') : conMicrofono ? t('comida.decir.ayuda') : t('comida.decir.ayudaTeclado')}</Text>
      {dictado.error && (
        <Animated.Text entering={FadeIn.duration(200)} style={st.error}>{t(`comida.decir.error.${dictado.error}`)}</Animated.Text>
      )}
      <TextInput
        value={texto}
        onChangeText={setTexto}
        multiline
        autoFocus={!p.escuchar || !conMicrofono}
        placeholder={t('comida.decir.ejemplo')}
        placeholderTextColor="rgba(239, 230, 207, 0.32)"
        style={st.frase}
        textAlignVertical="top"
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={() => entenderYa(texto)}
        accessibilityLabel={t('comida.decir.titulo')}
      />
      {entendidos && (
        <Animated.View entering={FadeIn.duration(260)} layout={ACOMODA}>
          {entendidos.length === 0 && <Text style={st.nota}>{t('comida.decir.nada')}</Text>}
          {entendidos.map((x, i) => (
            <Animated.View key={`${x.dicho.texto}-${i}`} entering={FadeIn.duration(240)} exiting={FadeOut.duration(160)} layout={ACOMODA}>
              <Fila x={x} sistema={p.sistema} alMover={(s) => mover(i, s)} alQuitar={() => quitar(i)} alElegir={(k) => elegir(i, k)} alBuscar={() => p.alBuscar(x.dicho.buscado)} />
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Panel>
  );
}

/** El micrófono: un toque empieza y otro termina; mientras escucha, respira (sin Reducir movimiento). */
function Microfono({ escuchando, alTocar }: { escuchando: boolean; alTocar: () => void }) {
  const reducido = useReducedMotion();
  const pulso = useSharedValue(0);
  useEffect(() => {
    pulso.set(escuchando && !reducido ? withRepeat(withTiming(1, { duration: 900 }), -1, true) : withTiming(0, { duration: 200 }));
  }, [escuchando, reducido, pulso]);
  const aro = useAnimatedStyle(() => ({ opacity: escuchando ? 0.35 + 0.4 * pulso.get() : 0, transform: [{ scale: 1 + 0.18 * pulso.get() }] }));
  return (
    <View style={st.microfonoLugar}>
      <Animated.View style={[st.aro, aro]} pointerEvents="none" />
      <Pressable
        onPress={alTocar}
        style={({ pressed }) => [st.microfono, escuchando && st.microfonoEscuchando, pressed && st.apretado]}
        accessibilityRole="button"
        accessibilityLabel={t(escuchando ? 'comida.decir.parar' : 'comida.decir.hablar')}
      >
        <Icono nombre={escuchando ? 'stop.fill' : 'mic.fill'} tam={26} color={escuchando ? colores.tinta : colores.oroClaro} />
      </Pressable>
    </View>
  );
}

/** Una cosa entendida: el alimento, su cantidad con − y +, sus kcal y, si hace falta, la pregunta. */
function Fila({ x, sistema, alMover, alQuitar, alElegir, alBuscar }: {
  x: Entendido; sistema: Sistema; alMover: (signo: 1 | -1) => void; alQuitar: () => void; alElegir: (k: number) => void; alBuscar: () => void;
}) {
  const o = x.opciones[x.elegida];
  if (!o) {
    return (
      <View style={st.fila}>
        <View style={st.textos}>
          <Text style={[st.nombre, st.sinEncontrar]} numberOfLines={1}>{t('comida.decir.noEncontre', { que: x.dicho.buscado })}</Text>
          <Pressable onPress={alBuscar} accessibilityRole="button" hitSlop={6}>
            <Text style={st.buscar}>{t('comida.decir.buscar')}</Text>
          </Pressable>
        </View>
        <Quitar alTocar={alQuitar} />
      </View>
    );
  }
  return (
    <View style={st.bloque}>
      <View style={st.fila}>
        <View style={st.textos}>
          <Text style={st.nombre} numberOfLines={1}>{o.alimento.nombre}</Text>
          <Text style={st.detalle} numberOfLines={1}>
            {`${cantidadDeTexto(o.cantidad, sistema)} · ${numero(Math.round(o.valores.kcal))} kcal`}
            {x.supuesto ? <Text style={st.supuesto}>{` · ${t('comida.decir.supuesto')}`}</Text> : null}
          </Text>
        </View>
        <View style={st.pasos}>
          <Pressable onPress={() => alMover(-1)} style={st.paso} accessibilityRole="button" accessibilityLabel="−" hitSlop={4}>
            <Icono nombre="minus" tam={14} peso="semibold" />
          </Pressable>
          <Pressable onPress={() => alMover(1)} style={st.paso} accessibilityRole="button" accessibilityLabel="+" hitSlop={4}>
            <Icono nombre="plus" tam={14} peso="semibold" />
          </Pressable>
        </View>
        <Quitar alTocar={alQuitar} />
      </View>
      {x.pregunta && (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} layout={ACOMODA}>
          <Text style={st.pregunta}>{preguntaDe(x)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.opciones} keyboardShouldPersistTaps="handled">
            {x.opciones.map((op, k) => (
              <Pastilla
                key={k}
                texto={x.pregunta === 'cuanto' ? cantidadDeTexto(op.cantidad, sistema) : op.alimento.nombre}
                detalle={`${numero(Math.round(op.valores.kcal))} kcal`}
                elegida={k === x.elegida}
                alTocar={() => alElegir(k)}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

function preguntaDe(x: Entendido): string {
  const que = x.dicho.buscado;
  if (x.pregunta === 'crudo') {
    const o = x.opciones[0];
    return 'gramos' in o.cantidad ? t('comida.decir.crudo', { gramos: numero(Math.round(o.cantidad.gramos)) }) : t('comida.decir.crudoMedida');
  }
  return t(x.pregunta === 'cual' ? 'comida.decir.cual' : 'comida.decir.cuanto', { que });
}

function Quitar({ alTocar }: { alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} style={st.quitar} accessibilityRole="button" accessibilityLabel={t('comida.quitar')} hitSlop={6}>
      <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.55)" peso="semibold" />
    </Pressable>
  );
}

const st = StyleSheet.create({
  microfonoLugar: { alignSelf: 'center', marginTop: 6, marginBottom: 4, width: 92, height: 92, alignItems: 'center', justifyContent: 'center' },
  aro: { position: 'absolute', width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: colores.oro },
  microfono: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.5)', backgroundColor: 'rgba(232, 196, 106, 0.1)' },
  microfonoEscuchando: { backgroundColor: colores.oro, borderColor: colores.oro },
  apretado: { opacity: 0.75 },
  ayuda: { marginTop: 4, textAlign: 'center', fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.62)' },
  error: { marginTop: 8, textAlign: 'center', fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: colores.oroClaro },
  frase: {
    marginTop: 12, minHeight: 84, maxHeight: 180, padding: 12, outlineWidth: 0, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)',
    backgroundColor: 'rgba(6, 10, 22, 0.6)', fontFamily: letras.texto, fontSize: 15, lineHeight: 21, color: colores.pergamino,
  },
  nota: { marginTop: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  bloque: { paddingVertical: 4, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 54, paddingVertical: 6 },
  textos: { flex: 1, gap: 3, minWidth: 0 },
  nombre: { fontFamily: letras.texto, fontSize: 15.5, color: colores.pergamino },
  sinEncontrar: { color: 'rgba(239, 230, 207, 0.6)' },
  detalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  supuesto: { color: 'rgba(232, 196, 106, 0.75)' },
  buscar: { fontFamily: letras.textoMedio, fontSize: 12.5, color: colores.oroClaro },
  pasos: { flexDirection: 'row', gap: 4 },
  paso: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  quitar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pregunta: { marginTop: 2, marginBottom: 6, fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  opciones: { gap: 8, paddingBottom: 8, paddingRight: 8 },
});
