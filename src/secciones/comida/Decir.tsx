// Decir o escribir la comida de una vez (lo pediste el 26/10): «dos huevos revueltos, una tostada
// con manteca y un café con leche». Se habla con el micrófono (en el teléfono) o se escribe; Moss lo
// entiende (src/comida/frase.ts y entender.ts) y lo muestra para revisar: cada alimento con su
// cantidad, que se cambia ahí mismo, y una pregunta solo si cambia el número, con la respuesta ya
// marcada. «Agregar» no espera a que se conteste nada. Con varias comidas en la frase (18/11/2026),
// lo entendido se muestra por comida y se anota cada cosa en la suya. Lo que la persona guardó (una
// receta, una comida, un alimento suyo) se dice por su nombre y se anota entero (27/11/2026).

import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import { baseDeAlimentos } from '@/comida/base';
import { normalizar } from '@/comida/buscar';
import { claveMedida, entender, loTuyo, type Entendido, type Opcion } from '@/comida/entender';
import { conCon, leerFrase, mismoNombre, porComida } from '@/comida/frase';
import { TAMANOS as TAMANOS_DE_PLATO } from '@/comida/platos';
import { pasoDeCantidad, pasoDePorcion, type Sistema } from '@/dominio/cantidades';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import type { FotoDeComida } from '@/dominio/fotos';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { alDia, itemDeAlimento, itemRapido, premios, recientes, sumarValores, ultimaCantidad, valoresDeCantidad, vigentes, type Cantidad, type Item } from '@/dominio/registros';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { BotonDePaso, margenDeToque } from '../paso';
import { ACOMODA } from '../tarjetas';
import { Boton, Etiqueta, Icono, Pastilla } from './comunes';
import { CabezaDeFoto } from './FotosDelDia';
import { cantidadDeTexto, numero, opcionesDeIdioma, useEstado, useNumeros } from './datos';
import { contextoDelDictado, hayDictado, useDictado } from './dictado';
import { agregarADe } from './hoja';
import { claveDe, Panel, useSinGuardar } from './Paneles';
import type { Rect } from './Visor';

type Props = {
  comida: Comida;
  /** El día de la hoja: lo dicho va ahí, salvo que se diga «anoche» o «ayer». */
  dia: ClaveDia;
  sistema: Sistema;
  /** Abrió con el micrófono: escucha apenas aparece. */
  escuchar: boolean;
  /** Lo que se escribió en el buscador, si se llegó desde ahí. */
  textoInicial?: string;
  alAtras: () => void;
  /** Lo entendido, por comida (la dicha, si se dijo: «en el almuerzo»; si no, la de la hoja), para anotarlo. */
  alAgregar: (grupos: GrupoAnotado[]) => void;
  /**
   * Lo que no se encontró se busca a mano; lo que sí, de esa comida, espera en la canasta. `pendientes`:
   * lo demás de esa comida que tampoco se encontró, para buscarlo después; `ayer`, si se dijo «anoche»;
   * `resto`, lo de las otras comidas, que se anota ya.
   */
  alBuscar: (texto: string, encontrados: Item[], comida: Comida, otros: { ayer: boolean; pendientes: string[]; resto: GrupoAnotado[] }) => void;
  /** El aviso de la hoja, con «Deshacer». */
  alAvisar: (texto: string, deshacer?: () => void) => void;
  abajo: number;
  /**
   * «¿Qué es? Dilo o escríbelo» (spec/nutricion.md, «La foto de la comida»): lo mismo, con la miniatura
   * arriba, que vuela `desde` el visor, y «Anotar después». Lo dicho va al día de la foto.
   */
  foto?: { f: FotoDeComida; desde: Rect | null; alOtra: () => void; alBorrar: () => void; alDespues: () => void };
};

/** Lo de una comida, para anotar: `ayer`, si se dijo «anoche» o «ayer», y va al día anterior. */
export type GrupoAnotado = { items: Item[]; comida: Comida; ayer: boolean };
/** Lo entendido, con la comida y el día en que va. */
type Revisado = Entendido & { comida: Comida; ayer: boolean };
const claveDeGrupo = (x: { comida: Comida; ayer: boolean }) => `${x.ayer ? 'ayer' : 'hoy'}:${x.comida}`;

/** Lo que mide una cantidad: las veces de una porción, o los gramos. */
const cuantoDe = (c: Exclude<Cantidad, null>) => ('porcion' in c ? c.veces : c.gramos);

/** La cantidad de una opción, un paso más o menos: las porciones de a una, los gramos por tramos. */
function otraCantidad(o: Opcion, signo: 1 | -1): Opcion {
  const c = o.cantidad;
  let cantidad: Exclude<Cantidad, null>;
  if ('porcion' in c) cantidad = { ...c, veces: pasoDePorcion(c.veces, signo) };
  else {
    // Los gramos van siempre en gramos, también con el sistema imperial; el aceite queda, y los ml y
    // el peso entero cambian con ellos.
    const gramos = pasoDeCantidad(c.gramos, signo, 'peso', 'metrico');
    const f = gramos / c.gramos;
    cantidad = { ...c, gramos, ...(c.ml !== undefined ? { ml: Math.round(c.ml * f) } : {}), ...(c.bruto !== undefined ? { bruto: Math.round(c.bruto * f) } : {}) };
  }
  return { ...o, cantidad, valores: valoresDeCantidad(o.alimento.por100g, cantidad) };
}

/** Lo elegido, como se anota: lo de la base va «a ojo»; lo que la persona guardó, con su fuente y como estaba. */
function itemDicho(o: Opcion): Item {
  const a = o.alimento;
  if (a.fuente === 'rapida') return itemRapido(a.nombre, o.valores);
  const item = itemDeAlimento(a.fuente ?? 'base', a.ref, a.nombre, a.por100g, o.cantidad);
  return !a.fuente || a.estimado ? { ...item, estimado: true } : item;
}

/** Lo más nuevo primero: si dos cosas guardadas se llaman igual, se dice la última que se guardó. */
const nuevoPrimero = <T extends { actualizado: string }>(lista: T[]) => lista.sort((a, b) => (a.actualizado < b.actualizado ? 1 : -1));

export function PanelDecir(p: Props) {
  const e = useEstado();
  // Sin los números (Perfil › Los números), lo entendido va con sus cantidades, sin calorías.
  const numeros = useNumeros();
  const [texto, setTexto] = useState(p.textoInicial ?? '');
  useSinGuardar(!!texto.trim());
  const [entendidos, setEntendidos] = useState<Revisado[] | null>(null);
  const [entendiendo, setEntendiendo] = useState(false);
  // El texto que se entendió: si se cambia, hay que volver a entender.
  const [entendido, setEntendido] = useState<string | null>(null);
  // Lo que la persona guardó se dice por su nombre («mi batido de la mañana»), con lo que vale ahora.
  const tuyos = useMemo(
    () => loTuyo(nuevoPrimero(vigentes(e.recetas.values())), nuevoPrimero(vigentes(e.propios.values())), t('comida.receta.plato'), (i) => alDia(i, e.propios, e.recetas)),
    [e.recetas, e.propios],
  );

  /** Entiende la frase; con `sumarA`, lo nuevo va después de lo que ya estaba revisado. */
  const entenderTexto = async (frase: string, sumarA?: { lista: Revisado[]; completo: string }) => {
    if (!frase.trim()) return;
    setEntendiendo(true);
    const op = opcionesDeIdioma();
    const premio = premios(e.registros.values(), e.hoy);
    const buscar = (x: string) => baseDeAlimentos.buscar(x, { ...op, limite: 8, premio: (id) => premio.get(id) ?? 0 });
    // «Café con leche» es uno si la base lo tiene con ese nombre; si no, se corta en el «con».
    const conNombre = new Set<string>();
    await Promise.all(conCon(frase, op.idioma).map(async (b) => {
      const [r] = await buscar(b);
      if (r && mismoNombre(r.coincide, b)) conNombre.add(b);
    }));
    const leida = leerFrase(frase, op.idioma, (b) => conNombre.has(b), tuyos.map((x) => x.nombre));
    // Lo que no dice comida va a la de la hoja; lo que se suma después («y una banana»), a la de lo último.
    const ultimo = sumarA?.lista[sumarA.lista.length - 1];
    // Con la foto, todo va a una comida: la de la foto.
    const grupos = p.foto
      ? [{ comida: leida.comida ?? p.comida, ayer: false, dichos: leida.dichos }]
      : porComida(leida.grupos, ultimo?.comida ?? p.comida, ultimo?.ayer ?? false);
    const para = {
      buscar,
      detalle: (id: number) => baseDeAlimentos.detalle(id, op),
      ultimaCantidad: (ref: string) => ultimaCantidad(e.registros.values(), 'base', ref),
      alias: (b: string) => e.alias[normalizar(b)],
      conocido: (id: number) => (premio.get(id) ?? 0) > 0,
      medido: (b: string) => e.alias[claveMedida(b)],
      tuyo: (cual: number) => tuyos[cual]?.filas,
    };
    // Cada comida con sus preguntas: como mucho tres por comida.
    const lista = (await Promise.all(grupos.map(async (g) => (await entender(g.dichos, para)).map((x) => ({ ...x, comida: g.comida, ayer: g.ayer }))))).flat();
    setEntendido(sumarA ? sumarA.completo : frase);
    setEntendidos(sumarA ? [...sumarA.lista, ...lista] : lista);
    setEntendiendo(false);
    Haptics.selectionAsync().catch(() => {});
  };
  const entenderYa = (frase: string, sumarA?: { lista: Revisado[]; completo: string }) => {
    entenderTexto(frase, sumarA).catch(() => setEntendiendo(false));
  };

  // Al volver a hablar, lo nuevo se suma («y una banana»): lo ya revisado no se pierde.
  const [previo, setPrevio] = useState<{ texto: string; lista: Revisado[] | null }>({ texto: '', lista: null });
  const conPrevio = (nuevo: string) => {
    const antes = previo.texto.replace(/[\s,.;]+$/, '');
    return antes && nuevo ? `${antes}, ${nuevo}` : antes || nuevo;
  };
  const conMicrofono = hayDictado();
  const dictado = useDictado({
    alTexto: (x) => setTexto(conPrevio(x)),
    alTerminar: (x) => {
      // Sin nada nuevo, lo ya revisado queda como estaba, con lo que se cambió a mano.
      if (previo.lista?.length && !x.trim()) return;
      if (previo.lista?.length) entenderYa(x, { lista: previo.lista, completo: conPrevio(x) });
      else entenderYa(conPrevio(x));
    },
    // Abre escuchando: el micrófono se ve encendido desde el primer cuadro, no un instante apagado.
    alAbrir: p.escuchar && conMicrofono,
  });
  // Lo que la persona suele comer y lo que guardó ayudan a reconocer los nombres.
  const contexto = () => contextoDelDictado(recientes(e.registros.values(), 60).map((i) => i.nombre), tuyos.map((x) => x.nombre));
  // Si se toca el micrófono antes de que el panel termine de entrar, manda ese toque: ya no arranca solo.
  const tocado = useRef(false);
  const hablar = () => {
    tocado.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (dictado.escuchando) dictado.parar();
    else {
      // Lo entendido sigue si el texto no se cambió a mano desde entonces.
      setPrevio({ texto, lista: entendidos && entendido !== null && texto.trim() === entendido.trim() ? entendidos : null });
      dictado.empezar(contexto()).catch(() => {});
    }
  };
  // Al abrir, cuando el panel ya entró: escucha, o entiende lo que se escribió en el buscador.
  useEffect(() => {
    const espera = setTimeout(() => {
      if (p.escuchar && conMicrofono) {
        if (!tocado.current) dictado.empezar(contexto()).catch(() => {});
      } else if (p.textoInicial) entenderYa(p.textoInicial);
    }, 320);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiar = (i: number, cambio: (x: Revisado) => Revisado) => setEntendidos((lista) => lista && lista.map((x, k) => (k === i ? cambio(x) : x)));
  // La pastilla ya vibra al elegir otra.
  const elegir = (i: number, k: number) => cambiar(i, (x) => ({ ...x, elegida: k }));
  /** Un paso con − o +; en el tope no cambia, y el botón no vibra ni repite. */
  const mover = (i: number, signo: 1 | -1) => {
    const x = entendidos?.[i];
    const o = x?.opciones[x.elegida];
    if (!o || cuantoDe(otraCantidad(o, signo).cantidad) === cuantoDe(o.cantidad)) return false;
    cambiar(i, (y) => ({ ...y, supuesto: false, opciones: y.opciones.map((op, k) => (k === y.elegida ? otraCantidad(op, signo) : op)) }));
    return true;
  };
  // Lo quitado se puede deshacer: vuelve a su lugar.
  const quitar = (i: number) => {
    const x = entendidos?.[i];
    if (!x) return;
    setEntendidos((lista) => lista && lista.filter((_, k) => k !== i));
    p.alAvisar(t('comida.quitado', { alimento: x.opciones[x.elegida]?.alimento.nombre ?? x.dicho.buscado }), () => {
      setEntendidos((lista) => lista && [...lista.slice(0, i), x, ...lista.slice(i)]);
    });
  };

  const elegidas = (entendidos ?? []).flatMap((x) => (x.opciones[x.elegida] ? [{ x, o: x.opciones[x.elegida] }] : []));
  const total = sumarValores(elegidas.map(({ o }) => o.valores));
  const cambioElTexto = entendido !== null && texto.trim() !== entendido.trim();
  // Por comida, en el orden del día (lo de ayer primero), cada fila con su lugar en la lista.
  const grupos: { clave: string; comida: Comida; ayer: boolean; filas: { x: Revisado; i: number }[] }[] = [];
  (entendidos ?? []).forEach((x, i) => {
    const clave = claveDeGrupo(x);
    const g = grupos.find((y) => y.clave === clave);
    if (g) g.filas.push({ x, i });
    else grupos.push({ clave, comida: x.comida, ayer: x.ayer, filas: [{ x, i }] });
  });
  grupos.sort((a, b) => Number(b.ayer) - Number(a.ayer) || COMIDAS.indexOf(a.comida) - COMIDAS.indexOf(b.comida));
  const conElegida = grupos.filter((g) => g.filas.some(({ x }) => x.opciones[x.elegida]));
  // «Agregar a la cena» dice el día si no es hoy: el de la hoja, o ayer si se dijo «anoche». Con varias comidas, «Agregar todo».
  const una = conElegida.length === 1 ? conElegida[0] : null;
  const textoDeAgregar = una
    ? agregarADe(una.comida, p.foto ? p.foto.f.dia : una.ayer ? sumarDias(e.hoy, -1) : p.dia, e.hoy)
    : t('comida.decir.agregarTodo');

  /** Lo elegido, como ítems de cada comida. Cada respuesta se recuerda: la próxima vez, esas palabras ya no preguntan. */
  const confirmar = (): GrupoAnotado[] => {
    for (const { x, o } of elegidas) {
      if (x.pregunta === 'cual') elAlmacen().ponerAlias(normalizar(x.dicho.buscado), Number(o.alimento.ref));
      if (x.pregunta === 'crudo') elAlmacen().ponerAlias(claveMedida(x.dicho.buscado), Number(o.alimento.ref));
    }
    return conElegida.map((g) => ({
      comida: g.comida,
      ayer: g.ayer,
      items: g.filas.flatMap(({ x }) => {
        const o = x.opciones[x.elegida];
        return o ? [itemDicho(o)] : [];
      }),
    }));
  };
  const agregar = () => p.alAgregar(confirmar());
  /** «Buscarlo»: lo demás de esa comida que tampoco se encontró se busca después, lo dicho «anoche» sigue yendo a ayer y lo de las otras comidas se anota. */
  const buscar = (i: number) => {
    const lista = entendidos ?? [];
    const x = lista[i];
    const todos = confirmar();
    const propio = todos.find((g) => claveDeGrupo(g) === claveDeGrupo(x));
    const pendientes = lista.filter((y, k) => k !== i && !y.opciones[y.elegida] && claveDeGrupo(y) === claveDeGrupo(x)).map((y) => y.dicho.buscado);
    p.alBuscar(x.dicho.buscado, propio?.items ?? [], x.comida, { ayer: x.ayer, pendientes, resto: todos.filter((g) => g !== propio) });
  };

  const foto = p.foto;
  const principal = entendidos && !cambioElTexto && elegidas.length > 0
    ? <Boton tipo="grande" texto={numeros ? `${textoDeAgregar} · ${numero(Math.round(total.kcal))} kcal` : textoDeAgregar} alTocar={agregar} />
    : <Boton tipo="secundario" texto={entendiendo ? t('comida.decir.entendiendo') : t('comida.decir.entender')} desactivado={!texto.trim() || entendiendo || dictado.escuchando} alTocar={() => entenderYa(texto)} />;
  // Con la foto, se puede no decir nada todavía: la foto queda en el día, sin anotar.
  const conFoto = (accion: () => void) => () => {
    if (dictado.escuchando) dictado.parar();
    accion();
  };
  const ayuda = dictado.escuchando
    ? t('comida.decir.teEscucho')
    : foto ? t(conMicrofono ? 'comida.fotoDiario.ayuda' : 'comida.fotoDiario.ayudaTeclado') : conMicrofono ? t('comida.decir.ayuda') : t('comida.decir.ayudaTeclado');

  return (
    <Panel
      titulo={foto ? t('comida.fotoDiario.queEs') : t('comida.decir.titulo')}
      alAtras={foto ? conFoto(foto.alDespues) : p.alAtras}
      abajo={p.abajo}
      fundido={!!foto?.desde}
      pie={foto ? (
        <>
          {principal}
          <Pressable onPress={conFoto(foto.alDespues)} style={({ pressed }) => [st.despues, pressed && st.apretado]} accessibilityRole="button">
            <Text style={st.despuesTexto}>{t('comida.fotoDiario.despues')}</Text>
          </Pressable>
        </>
      ) : principal}
    >
      {foto && <CabezaDeFoto f={foto.f} desde={foto.desde} alOtra={conFoto(foto.alOtra)} alBorrar={conFoto(foto.alBorrar)} />}
      {conMicrofono && <Microfono escuchando={dictado.escuchando} alTocar={hablar} />}
      <Text style={st.ayuda}>{ayuda}</Text>
      {dictado.error && (
        <Animated.Text entering={FadeIn.duration(200).reduceMotion(ReduceMotion.Never)} exiting={SALE_FUNDIDO} style={st.error}>{t(`comida.decir.error.${dictado.error}`)}</Animated.Text>
      )}
      <TextInput
        value={texto}
        onChangeText={setTexto}
        multiline
        maxLength={500}
        // Con lo que se escribió en el buscador, abre entendiéndolo: el teclado no sube a taparlo.
        autoFocus={!p.textoInicial && (!p.escuchar || !conMicrofono)}
        placeholder={t('comida.decir.ejemplo')}
        placeholderTextColor="rgba(239, 230, 207, 0.32)"
        keyboardAppearance="dark"
        style={st.frase}
        textAlignVertical="top"
        returnKeyType="done"
        submitBehavior="blurAndSubmit"
        onSubmitEditing={() => entenderYa(texto)}
        accessibilityLabel={foto ? t('comida.fotoDiario.queEs') : t('comida.decir.titulo')}
      />
      {entendidos && (
        <Animated.View entering={FadeIn.duration(260).reduceMotion(ReduceMotion.Never)} layout={ACOMODA}>
          {entendidos.length === 0 && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={st.nota}>{t('comida.decir.nada')}</Animated.Text>}
          {grupos.map((g) => (
            <Animated.View key={g.clave} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
              {/* Con una sola comida, «Agregar al almuerzo» ya la dice. */}
              {grupos.length > 1 && <CabezaDeGrupo comida={g.comida} ayer={g.ayer} kcal={numeros ? sumarValores(g.filas.flatMap(({ x }) => (x.opciones[x.elegida] ? [x.opciones[x.elegida].valores] : []))).kcal : null} />}
              {g.filas.map(({ x, i }) => (
                <Animated.View key={claveDe(x.dicho)} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
                  <Fila x={x} sistema={p.sistema} numeros={numeros} alMover={(s) => mover(i, s)} alQuitar={() => quitar(i)} alElegir={(k) => elegir(i, k)} alBuscar={() => buscar(i)} />
                </Animated.View>
              ))}
            </Animated.View>
          ))}
        </Animated.View>
      )}
    </Panel>
  );
}

/** El nombre de la comida arriba de lo suyo, como los títulos de la hoja: «Desayuno · 420 kcal», «Cena · ayer». */
function CabezaDeGrupo({ comida, ayer, kcal }: { comida: Comida; ayer: boolean; kcal: number | null }) {
  const nombre = t(`comida.comidas.${comida}`);
  const titulo = ayer ? t('comida.decir.grupoAyer', { comida: nombre }) : nombre;
  return (
    <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
      <Etiqueta estilo={st.grupo}>{kcal === null ? titulo : `${titulo} · ${numero(Math.round(kcal))} kcal`}</Etiqueta>
    </Animated.View>
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

/** Una cosa entendida: el alimento, su cantidad con − y +, sus kcal (sin los números, no) y, si hace falta, la pregunta. */
function Fila({ x, sistema, numeros, alMover, alQuitar, alElegir, alBuscar }: {
  x: Entendido; sistema: Sistema; numeros: boolean; alMover: (signo: 1 | -1) => boolean; alQuitar: () => void; alElegir: (k: number) => void; alBuscar: () => void;
}) {
  const o = x.opciones[x.elegida];
  if (!o) {
    return (
      <View style={st.fila}>
        <View style={st.textos}>
          <Text style={[st.nombre, st.sinEncontrar]} numberOfLines={1}>{t('comida.decir.noEncontre', { que: x.dicho.buscado })}</Text>
          <Pressable onPress={alBuscar} style={({ pressed }) => pressed && st.apretado} accessibilityRole="button" hitSlop={{ top: 12, bottom: 12 }}>
            <Text style={st.buscar}>{t('comida.decir.buscar')}</Text>
          </Pressable>
        </View>
        <Quitar que={x.dicho.buscado} alTocar={alQuitar} />
      </View>
    );
  }
  // Lo que se guardó sin cantidad (una carga rápida dentro de una comida guardada) va con sus kcal, sin − ni +.
  const sinCantidad = o.alimento.fuente === 'rapida';
  const detalle = [sinCantidad ? '' : cantidadDeTexto(o.cantidad, sistema), numeros ? `${numero(Math.round(o.valores.kcal))} kcal` : ''].filter(Boolean).join(' · ');
  return (
    <View style={st.bloque}>
      <View style={st.fila}>
        <View style={st.textos}>
          <Text style={st.nombre} numberOfLines={1}>{o.alimento.nombre}</Text>
          <Text style={st.detalle} numberOfLines={1}>
            {detalle}
            {x.supuesto ? <Text style={st.supuesto}>{` · ${t('comida.decir.supuesto')}`}</Text> : null}
          </Text>
        </View>
        {!sinCantidad && (
          <View style={st.pasos}>
            <BotonDePaso alPaso={() => alMover(-1)} etiqueta={t('comun.menos', { que: o.alimento.nombre })} lado={32} style={st.paso}>
              <Icono nombre="minus" tam={14} peso="semibold" />
            </BotonDePaso>
            <BotonDePaso alPaso={() => alMover(1)} etiqueta={t('comun.mas', { que: o.alimento.nombre })} lado={32} style={st.paso}>
              <Icono nombre="plus" tam={14} peso="semibold" />
            </BotonDePaso>
          </View>
        )}
        <Quitar que={o.alimento.nombre} alTocar={alQuitar} />
      </View>
      {x.pregunta && (
        <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
          <Text style={st.pregunta}>{preguntaDe(x)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={st.opciones} keyboardShouldPersistTaps="handled" scrollsToTop={false}>
            {x.opciones.map((op, k) => (
              <Pastilla
                key={k}
                texto={
                  x.pregunta === 'tamano'
                    ? `${t(`comida.decir.tamanos.${TAMANOS_DE_PLATO[k]}`)} · ${cantidadDeTexto(op.cantidad, sistema)}`
                    : x.pregunta === 'cuanto' ? cantidadDeTexto(op.cantidad, sistema) : op.alimento.nombre
                }
                detalle={numeros ? `${numero(Math.round(op.valores.kcal))} kcal` : undefined}
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
  if (x.pregunta === 'tamano') return t('comida.decir.tamano');
  return t(x.pregunta === 'cual' ? 'comida.decir.cual' : 'comida.decir.cuanto', { que });
}

function Quitar({ que, alTocar }: { que: string; alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      style={({ pressed }) => [st.quitar, pressed && st.apretado]}
      accessibilityRole="button"
      accessibilityLabel={t('comida.quitarAlimento', { alimento: que })}
      hitSlop={margenDeToque(32)}
    >
      <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.62)" peso="semibold" />
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
  grupo: { marginTop: 16, marginBottom: 2 },
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
  quitar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)' },
  pregunta: { marginTop: 2, marginBottom: 6, fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  opciones: { gap: 8, paddingBottom: 8, paddingRight: 8 },
  despues: { height: 34, alignItems: 'center', justifyContent: 'center' },
  despuesTexto: { fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.72)' },
});
