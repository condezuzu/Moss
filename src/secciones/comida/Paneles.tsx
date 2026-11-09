// Los paneles de la hoja de registro, como en la galería: entran desde la derecha, sobre la lista.
// - La revisión de la comida que se arma, antes de agregarla, y guardarla para la próxima.
// - La carga rápida: calorías y macros a mano.
// - Las comidas guardadas, las recetas y tus alimentos: el «+» suma de un toque, y tocar la fila la
//   cambia o la borra (la galería 46); y la receta nueva (con su peso final).
// - Crear un alimento: a mano, o con lo que se leyó de la etiqueta.
// Con los números ocultos (Perfil › Los números), sin calorías ni gramos de los macros: quedan los
// nombres y las porciones. Lo que se escribe (la carga rápida, la etiqueta) sigue a la vista.

import * as Haptics from 'expo-haptics';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  AccessibilityInfo, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type AutoCapitalize, type KeyboardTypeOptions, type TextInputInstance, type TextInstance,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInLeft, FadeInRight, LayoutAnimationConfig, ReduceMotion, useAnimatedRef, useReducedMotion, useScrollOffset } from 'react-native-reanimated';

import { baseDeAlimentos } from '@/comida/base';
import type { Etiqueta as EtiquetaLeida, Leidos } from '@/comida/etiqueta';
import { leerNumero } from '@/comida/porciones';
import { gramosDeLinea, leerReceta, type LineaDeReceta } from '@/comida/recetaDeTexto';
import type { Comida } from '@/dominio/comidas';
import type { Sistema } from '@/dominio/cantidades';
import type { ClaveDia } from '@/dominio/fechas';
import { escalar, gramosDe, itemDeAlimento, itemRapido, sumarValores, valoresDeCantidad, valoresDeReceta, type AlimentoPropio, type Item, type Receta, type Valores } from '@/dominio/registros';
import { plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar, conLector } from '../anuncio';
import { ENTRA_FUNDIDO, ENTRA_PANEL, LLEGA, SALE_FUNDIDO, SALE_PANEL } from '../movimiento';
import { margenDeToque } from '../paso';
import { ACOMODA } from '../tarjetas';
import { tecladoDeNumeros, useCampoALaVista } from '../teclado';
import { Boton, Etiqueta, Icono, MACROS, Punto } from './comunes';
import { cantidadDeTexto, gramosDeMacro, numero, opcionesDeIdioma, useNumeros } from './datos';
import { agregarADe, cambioLaEdicion, conLoEditado, edicionDe, kcalDeMacros, paraCampo, porcionDePropio, tuComidaDe, type Edicion, type Guardada } from './hoja';

/**
 * Si hay algo escrito sin guardar en el panel abierto: cerrar la hoja (bajarla, tocar afuera o la cruz)
 * pregunta antes de descartarlo. La hoja da cómo avisarle; al irse el panel, ya no queda nada.
 */
export const SinGuardar = createContext<((hay: boolean) => void) | null>(null);

export function useSinGuardar(hay: boolean) {
  const avisar = useContext(SinGuardar);
  useEffect(() => {
    avisar?.(hay);
  }, [avisar, hay]);
  useEffect(() => () => avisar?.(false), [avisar]);
}

/** Lo que mide el pie del panel abierto: el aviso de la hoja va arriba de sus botones, no encima. */
export const MedirPie = createContext<((alto: number) => void) | null>(null);

// Cada cosa de una lista con su clave, aunque no tenga id (lo de la comida que se arma, los ingredientes,
// lo entendido de una frase): así, al quitar una, las de abajo no se rearman y solo esa se va.
const claves = new WeakMap<object, number>();
let ultimaClave = 0;
export function claveDe(x: object): number {
  let k = claves.get(x);
  if (k === undefined) {
    k = ++ultimaClave;
    claves.set(x, k);
  }
  return k;
}
/** Lo que reemplaza a otra cosa (la misma, corregida) sigue con su clave: se cambia en su lugar, sin irse y volver. */
export function heredarClave(de: object, a: object) {
  claves.set(a, claveDe(de));
}

type Cadena = { registrar: (campo: RefObject<TextInputInstance | null>) => () => void; siguiente: (campo: RefObject<TextInputInstance | null>) => void };
/** Los campos de un panel, en el orden en que se ven: «Siguiente» pasa al que sigue. */
const CamposDelPanel = createContext<Cadena | null>(null);

/**
 * Otra vista del mismo panel (Guardadas y la edición de una): lo de adentro entra deslizándose apenas,
 * como en la galería; para atrás, desde la izquierda. Con Reducir movimiento, solo se funde.
 */
const VISTA_ADELANTE = FadeInRight.duration(260).easing(LLEGA).withInitialValues({ opacity: 0, transform: [{ translateX: 14 }] });
const VISTA_ATRAS = FadeInLeft.duration(260).easing(LLEGA).withInitialValues({ opacity: 0, transform: [{ translateX: -14 }] });

/**
 * Un panel, sobre la lista de la hoja. `abajo` es el borde de abajo del teléfono: la hoja ya lo deja
 * debajo de la lista (o el teclado), y el panel baja hasta el borde por detrás de ese lugar, así su pie
 * llega abajo de todo sin contarlo dos veces. Con el teclado arriba, lo que baja queda detrás del teclado.
 * `vista`: cuál de sus vistas se ve; al cambiar, el título, lo de adentro y el pie entran de nuevo
 * (`haciaAtras`, al volver a la anterior).
 */
export function Panel({ titulo, alAtras, children, pie, abajo, vista, haciaAtras }: {
  titulo: string; alAtras: () => void; children: ReactNode; pie?: ReactNode; abajo: number; vista?: string; haciaAtras?: boolean;
}) {
  const reducido = useReducedMotion();
  // El panel ya se achica con el teclado (el lugar de abajo de la hoja crece con él): el scroll solo
  // trae el campo que quedó tapado por su borde.
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  useCampoALaVista(scroll, scrollY);
  const medirPie = useContext(MedirPie);
  const entra = reducido ? ENTRA_FUNDIDO : haciaAtras ? VISTA_ATRAS : VISTA_ADELANTE;
  // La vista nueva empieza arriba, y VoiceOver pasa a su título: lo que tenía enfocado ya no está.
  const titular = useRef<TextInstance>(null);
  const vistaAntes = useRef(vista);
  useEffect(() => {
    if (vistaAntes.current === vista) return;
    vistaAntes.current = vista;
    scroll.current?.scrollTo({ y: 0, animated: false });
    if (Platform.OS === 'web' || !conLector()) return;
    const espera = setTimeout(() => {
      if (titular.current) AccessibilityInfo.sendAccessibilityEvent(titular.current, 'focus');
    }, 300);
    return () => clearTimeout(espera);
  }, [vista, scroll]);
  const campos = useRef<RefObject<TextInputInstance | null>[]>([]);
  const cadena = useMemo<Cadena>(() => ({
    registrar: (campo) => {
      campos.current.push(campo);
      return () => {
        campos.current = campos.current.filter((x) => x !== campo);
      };
    },
    siguiente: (campo) => {
      const otro = campos.current[campos.current.indexOf(campo) + 1];
      if (otro?.current) otro.current.focus();
      else campo.current?.blur();
    },
  }), []);
  return (
    <Animated.View
      entering={reducido ? ENTRA_FUNDIDO : ENTRA_PANEL}
      exiting={reducido ? SALE_FUNDIDO : SALE_PANEL}
      style={[estilos.panel, { bottom: -abajo }]}
      // Tapa la lista de la hoja: VoiceOver no la recorre, y el gesto de escape vuelve atrás.
      accessibilityViewIsModal
      onAccessibilityEscape={alAtras}
    >
      {/* Lo que ya está cuando el panel entra viene con él; otra vista, o lo que llega o se va después, con su animación. */}
      <LayoutAnimationConfig skipEntering>
        <View style={estilos.cabeza}>
          <Pressable onPress={alAtras} style={({ pressed }) => [estilos.atras, pressed && estilos.apretado]} accessibilityRole="button" accessibilityLabel={t('comun.atras')} hitSlop={margenDeToque(38)}>
            <Icono nombre="chevron.left" tam={18} peso="medium" />
          </Pressable>
          <Animated.View key={vista} entering={entra} style={estilos.tituloLugar}>
            <Text ref={titular} style={estilos.titulo} numberOfLines={1} accessibilityRole="header">{titulo}</Text>
          </Animated.View>
          <View style={estilos.lugar} />
        </View>
        <CamposDelPanel.Provider value={cadena}>
          <ScrollView
            ref={scroll}
            style={estilos.cuerpo}
            contentContainerStyle={estilos.cuerpoAdentro}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
          >
            {/* La vista que se va, sin las salidas de lo suyo: no se cruza con la que entra. */}
            <LayoutAnimationConfig key={vista} skipExiting>
              <Animated.View entering={entra}>
                <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
              </Animated.View>
            </LayoutAnimationConfig>
          </ScrollView>
        </CamposDelPanel.Provider>
        {pie && (
          <Animated.View key={vista} entering={entra} style={[estilos.pie, { paddingBottom: abajo + 6 }]} onLayout={(ev) => medirPie?.(ev.nativeEvent.layout.height)}>
            {pie}
          </Animated.View>
        )}
      </LayoutAnimationConfig>
    </Animated.View>
  );
}

/** «Borrar esta comida»: como el de quitar, en rojo suave (en la galería, `.dt-borrar`). Borra sin preguntar: el aviso lo deshace. */
function BotonBorrar({ texto, alTocar }: { texto: string; alTocar: () => void }) {
  return (
    <Pressable onPress={alTocar} accessibilityRole="button" hitSlop={5} style={({ pressed }) => [estilos.borrar, pressed && estilos.borrarApretado]}>
      <Text style={estilos.borrarTexto} maxFontSizeMultiplier={1.4}>{texto}</Text>
    </Pressable>
  );
}

/** «1 taza · 120 kcal»; sin los números, solo la cantidad. */
const detalleDe = (item: Pick<Item, 'cantidad' | 'valores'>, sistema: Sistema, numeros: boolean) =>
  [cantidadDeTexto(item.cantidad, sistema), numeros ? `${numero(Math.round(item.valores.kcal))} kcal` : ''].filter(Boolean).join(' · ');

type PropsDeCampo = {
  etiqueta: string; valor: string; alCambiar: (v: string) => void; unidad?: string; texto?: boolean; ejemplo?: string; mal?: boolean;
  /** Lo que manda la tecla de retorno («Listo»); sin esto, «Siguiente» pasa al campo que sigue. */
  alListo?: () => void;
  /** El último del panel: su tecla dice «Listo» y baja el teclado. */
  ultimo?: boolean;
  largo?: number; mayusculas?: AutoCapitalize; corrector?: boolean; teclado?: KeyboardTypeOptions; enfocado?: boolean;
};

function Campo({ etiqueta, valor, alCambiar, unidad, texto, ejemplo, mal, alListo, ultimo, largo, mayusculas, corrector, teclado, enfocado }: PropsDeCampo) {
  const cadena = useContext(CamposDelPanel);
  const campo = useRef<TextInputInstance>(null);
  useEffect(() => cadena?.registrar(campo), [cadena]);
  // «Siguiente» pasa al que sigue sin que el teclado baje y vuelva a subir; «Listo» lo baja.
  const siguiente = !alListo && !ultimo;
  return (
    <View style={[estilos.campo, !unidad && estilos.campoTexto]}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <TextInput
        ref={campo}
        value={valor}
        onChangeText={alCambiar}
        placeholder={ejemplo ?? (texto ? t('comida.opcional') : '0')}
        placeholderTextColor="rgba(239, 230, 207, 0.35)"
        keyboardType={teclado ?? (texto ? 'default' : 'decimal-pad')}
        maxLength={largo ?? (texto ? 80 : 8)}
        autoCapitalize={mayusculas}
        autoCorrect={corrector}
        autoFocus={enfocado}
        {...tecladoDeNumeros(siguiente)}
        onSubmitEditing={alListo ?? (siguiente ? () => cadena?.siguiente(campo) : undefined)}
        selectionColor={colores.oro}
        // Los de números tienen el ancho fijo: con el texto más grande de iOS, la letra crece hasta un tope que todavía entra.
        maxFontSizeMultiplier={unidad ? 1.4 : undefined}
        style={[estilos.campoEntrada, !unidad && estilos.campoEntradaTexto, mal && estilos.campoMal]}
        accessibilityLabel={etiqueta}
      />
      {unidad ? <Text style={estilos.campoUnidad} maxFontSizeMultiplier={1.4}>{unidad}</Text> : null}
    </View>
  );
}

function ChipsDeMacros({ v }: { v: Valores }) {
  return (
    <View style={estilos.chips}>
      {MACROS.map((m) => (
        <View key={m} style={estilos.chip} accessible accessibilityLabel={`${t(`comida.${m}`)} ${gramosDeMacro(v[m])} g`}>
          <Punto macro={m} />
          <Text style={estilos.chipCifra}>{`${gramosDeMacro(v[m])} g`}</Text>
          <Text style={estilos.chipNombre} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{t(`comida.${m}`)}</Text>
        </View>
      ))}
    </View>
  );
}

// ------------------------------------------------------------------ la revisión
export function PanelRevision(p: {
  comida: Comida; dia: ClaveDia; hoy: ClaveDia; canasta: Item[]; sistema: Sistema; restante: (kcal: number) => number | null; abajo: number;
  alEditar: (i: number) => void; alQuitar: (i: number) => void; alAgregar: () => void; alGuardarComo: () => void; alAtras: () => void;
}) {
  // Sin los números (Perfil › Los números), ni el total ni lo que quedaría del día: lo que se juntó, con sus porciones.
  const numeros = useNumeros();
  const total = sumarValores(p.canasta.map((i) => i.valores));
  const restante = p.restante(total.kcal);
  return (
    <Panel
      titulo={tuComidaDe(p.comida, p.dia, p.hoy)}
      alAtras={p.alAtras}
      abajo={p.abajo}
      pie={
        <>
          <Boton tipo="grande" texto={agregarADe(p.comida, p.dia, p.hoy)} alTocar={p.alAgregar} />
          <Boton tipo="quitar" texto={t('comida.guardarComida')} alTocar={p.alGuardarComo} />
        </>
      }
    >
      <Text style={estilos.texto}>{t('comida.revisarTexto')}</Text>
      {p.canasta.map((item, i) => {
        const sePuedeCambiar = item.fuente !== 'rapida';
        const detalle = detalleDe(item, p.sistema, numeros);
        return (
          <Animated.View key={claveDe(item)} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
            <Pressable
              onPress={() => sePuedeCambiar && p.alEditar(i)}
              style={({ pressed }) => [estilos.fila, pressed && sePuedeCambiar && estilos.filaApretada]}
              accessibilityRole={sePuedeCambiar ? 'button' : undefined}
              // La fila es un solo elemento para VoiceOver: quitar va como una acción suya.
              accessibilityActions={[{ name: 'quitar', label: t('comida.quitar') }]}
              onAccessibilityAction={(ev) => ev.nativeEvent.actionName === 'quitar' && p.alQuitar(i)}
            >
              <View style={estilos.filaTextos}>
                <Text style={estilos.filaNombre} numberOfLines={1}>{item.nombre}</Text>
                {detalle ? <Text style={estilos.filaDetalle} numberOfLines={1}>{detalle}</Text> : null}
              </View>
              <Pressable
                onPress={() => p.alQuitar(i)}
                style={({ pressed }) => [estilos.quitar, pressed && estilos.apretado]}
                accessibilityRole="button"
                accessibilityLabel={t('comida.quitarAlimento', { alimento: item.nombre })}
                hitSlop={margenDeToque(32)}
              >
                <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.62)" peso="semibold" />
              </Pressable>
            </Pressable>
          </Animated.View>
        );
      })}
      {numeros && (
        <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.total}>
          <Text style={estilos.kcal}>
            {numero(Math.round(total.kcal))}
            <Text style={estilos.kcalUnidad}>{`  ${t('comida.kcal').toUpperCase()}`}</Text>
          </Text>
          {restante !== null && <Text style={estilos.queda}>{t(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) })}</Text>}
          <ChipsDeMacros v={total} />
        </Animated.View>
      )}
    </Panel>
  );
}

export function PanelGuardarComo({ alGuardar, alAtras, abajo }: { alGuardar: (nombre: string) => void; alAtras: () => void; abajo: number }) {
  const [nombre, setNombre] = useState('');
  useSinGuardar(!!nombre.trim());
  return (
    <Panel titulo={t('comida.guardarComo.titulo')} alAtras={alAtras} abajo={abajo} pie={<Boton tipo="grande" texto={t('comun.guardar')} desactivado={!nombre.trim()} alTocar={() => alGuardar(nombre.trim())} />}>
      <Campo etiqueta={t('comida.nombre')} valor={nombre} alCambiar={setNombre} texto ejemplo={t('comida.guardarComo.ejemplo')} enfocado alListo={() => { if (nombre.trim()) alGuardar(nombre.trim()); }} />
    </Panel>
  );
}

// ------------------------------------------------------------------ la carga rápida
export function PanelRapida({ directo, comida, dia, hoy, inicial, alSumar, alQuitar, alAtras, abajo }: {
  directo: boolean; comida: Comida; dia: ClaveDia; hoy: ClaveDia; inicial?: { nombre: string; valores: Valores }; alSumar: (item: Item) => void; alQuitar?: () => void; alAtras: () => void; abajo: number;
}) {
  // Corrigiendo una carga rápida, abre con lo que tenía.
  const [antes] = useState(() => {
    const v = inicial?.valores;
    const campo = (x: number | undefined) => (x ? paraCampo(x) : '');
    return { nombre: inicial?.nombre ?? '', kcal: campo(v?.kcal), proteina: campo(v?.proteina), carbohidratos: campo(v?.carbohidratos), grasas: campo(v?.grasas) };
  });
  const [c, setC] = useState(antes);
  useSinGuardar((Object.keys(c) as (keyof typeof c)[]).some((k) => c[k] !== antes[k]));
  const poner = (k: keyof typeof c) => (v: string) => setC((x) => ({ ...x, [k]: v }));
  const proteina = leerNumero(c.proteina) ?? 0;
  const carbohidratos = leerNumero(c.carbohidratos) ?? 0;
  const grasas = leerNumero(c.grasas) ?? 0;
  // Sin las calorías, salen de los macros.
  const kcal = leerNumero(c.kcal) ?? kcalDeMacros(proteina, carbohidratos, grasas);
  return (
    <Panel
      titulo={t('comida.cargaRapida')}
      alAtras={alAtras}
      abajo={abajo}
      pie={
        <>
          <Boton
            tipo="grande"
            texto={inicial ? t('comun.guardar') : directo ? agregarADe(comida, dia, hoy) : t('comida.sumar')}
            desactivado={!kcal}
            alTocar={() => alSumar(itemRapido(c.nombre.trim() || t('comida.cargaRapida'), { kcal, proteina, carbohidratos, grasas }))}
          />
          {alQuitar && <Boton tipo="quitar" texto={t('comida.quitar')} alTocar={alQuitar} />}
        </>
      }
    >
      <Campo etiqueta={t('comida.nombre')} valor={c.nombre} alCambiar={poner('nombre')} texto />
      <Campo etiqueta={t('comida.kcal')} valor={c.kcal} alCambiar={poner('kcal')} unidad="kcal" ejemplo={!c.kcal && kcal ? numero(Math.round(kcal)) : '0'} enfocado={!inicial} />
      <Campo etiqueta={t('comida.proteina')} valor={c.proteina} alCambiar={poner('proteina')} unidad="g" />
      <Campo etiqueta={t('comida.carbohidratos')} valor={c.carbohidratos} alCambiar={poner('carbohidratos')} unidad="g" />
      <Campo etiqueta={t('comida.grasas')} valor={c.grasas} alCambiar={poner('grasas')} unidad="g" ultimo />
      <Text style={estilos.nota}>{t('comida.cargaRapidaTexto')}</Text>
    </Panel>
  );
}

// ------------------------------------------------------------------ las guardadas, las recetas y tus alimentos
/** Lo que vuelve a la lista (con «Deshacer») crece apenas desde arriba, como en la galería. */
const ENTRA_FILA = FadeInDown.duration(340).easing(LLEGA).withInitialValues({ opacity: 0, transform: [{ translateY: -4 }] });
/** Lo recién borrado se ve un momento en su lugar y recién ahí se cierra: así se ve qué se fue. */
const SE_VE_ANTES_DE_IRSE_MS = 340;
const BORRAR = { comida: 'borrarComida', receta: 'borrarReceta', propio: 'borrarAlimento' } as const;

/** La lista con lo que se está yendo todavía en su lugar. */
const enSuLugar = <T extends { id: string }>(lista: T[], x: T, i: number) => (lista.some((y) => y.id === x.id) ? lista : [...lista.slice(0, i), x, ...lista.slice(i)]);

/**
 * Las comidas guardadas, las recetas y tus alimentos (la galería 46). El «+» suma de un toque (de una
 * receta, un plato; de un alimento tuyo, su porción); tocar la fila abre su edición en el mismo panel,
 * con «Guardar» y «Borrar» abajo. Borrar no pregunta: la hoja avisa con «Deshacer».
 */
export function PanelGuardadas(p: {
  recetas: Receta[]; propios: AlimentoPropio[]; sistema: Sistema; abajo: number;
  alSumar: (g: Guardada) => void; alGuardar: (g: Guardada) => void; alBorrar: (g: Guardada) => void;
  alNuevaReceta: () => void; alPegarReceta: () => void; alAtras: () => void;
}) {
  const numeros = useNumeros();
  const reducido = useReducedMotion();
  const [editando, setEditando] = useState<{ g: Guardada; e: Edicion } | null>(null);
  const [haciaAtras, setHaciaAtras] = useState(false);
  const [saliendo, setSaliendo] = useState<{ g: Guardada; indice: number } | null>(null);
  useEffect(() => {
    if (!saliendo) return;
    const espera = setTimeout(() => setSaliendo(null), SE_VE_ANTES_DE_IRSE_MS);
    return () => clearTimeout(espera);
  }, [saliendo]);
  useSinGuardar(!!editando && cambioLaEdicion(editando.g, editando.e));

  const comidas = p.recetas.filter((r) => r.tipo === 'comida');
  const recetas = p.recetas.filter((r) => r.tipo === 'receta');
  const abrir = (g: Guardada) => {
    setHaciaAtras(false);
    setEditando({ g, e: edicionDe(g) });
  };
  const volver = () => {
    Keyboard.dismiss();
    setHaciaAtras(true);
    setEditando(null);
  };
  const cambiar = (cambio: Partial<Edicion>) => setEditando((x) => x && { ...x, e: { ...x.e, ...cambio } });
  // Sacar algo de lo que lleva no se guarda hasta «Guardar»: «‹» lo deja como estaba.
  const quitar = (i: number) => {
    const item = editando?.e.items[i];
    if (!item) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    anunciar(t('comida.quitado', { alimento: item.nombre }));
    setEditando((x) => x && { ...x, e: { ...x.e, items: x.e.items.filter((y) => y !== item) } });
  };
  const borrar = (g: Guardada) => {
    const lista: { id: string }[] = g.tipo === 'propio' ? p.propios : g.tipo === 'comida' ? comidas : recetas;
    setSaliendo({ g, indice: Math.max(0, lista.findIndex((x) => x.id === g.x.id)) });
    volver();
    p.alBorrar(g);
  };

  if (editando) {
    const { g, e } = editando;
    const editado = conLoEditado(g, e);
    return (
      <Panel
        titulo={g.x.nombre}
        alAtras={volver}
        abajo={p.abajo}
        vista={`${g.tipo}:${g.x.id}`}
        haciaAtras={haciaAtras}
        pie={(
          <>
            <Boton
              tipo="grande"
              texto={t('comun.guardar')}
              desactivado={!editado}
              alTocar={() => {
                if (!editado) return;
                p.alGuardar(editado);
                volver();
              }}
            />
            <BotonBorrar texto={t(`comida.guardadasEditar.${BORRAR[g.tipo]}`)} alTocar={() => borrar(g)} />
          </>
        )}
      >
        <EdicionDeGuardada g={g} e={e} sistema={p.sistema} numeros={numeros} alCambiar={cambiar} alQuitar={quitar} />
      </Panel>
    );
  }

  const sale = saliendo;
  const vistas = {
    comidas: sale && sale.g.tipo === 'comida' ? enSuLugar(comidas, sale.g.x, sale.indice) : comidas,
    recetas: sale && sale.g.tipo === 'receta' ? enSuLugar(recetas, sale.g.x, sale.indice) : recetas,
    propios: sale && sale.g.tipo === 'propio' ? enSuLugar(p.propios, sale.g.x, sale.indice) : p.propios,
  };
  const hay = vistas.comidas.length + vistas.recetas.length + vistas.propios.length > 0;
  const fila = (g: Guardada, detalle: string, etiquetaDelMas: string) => {
    // Lo que se está yendo ya no se toca.
    const seVa = sale?.g.tipo === g.tipo && sale.g.x.id === g.x.id;
    return (
      <Animated.View
        key={`${g.tipo}:${g.x.id}`}
        entering={reducido ? ENTRA_FUNDIDO : ENTRA_FILA}
        exiting={SALE_FUNDIDO}
        layout={ACOMODA}
        style={estilos.filaGuardada}
        pointerEvents={seVa ? 'none' : 'auto'}
        accessibilityElementsHidden={seVa}
        importantForAccessibility={seVa ? 'no-hide-descendants' : 'auto'}
      >
        <Pressable onPress={() => abrir(g)} style={({ pressed }) => [estilos.filaGuardadaTocable, pressed && estilos.filaApretada]} accessibilityRole="button">
          <View style={estilos.filaTextos}>
            <Text style={estilos.filaNombre} numberOfLines={1}>{g.x.nombre}</Text>
            {detalle ? <Text style={estilos.filaDetalle} numberOfLines={1}>{detalle}</Text> : null}
          </View>
        </Pressable>
        <Pressable
          onPress={() => p.alSumar(g)}
          style={({ pressed }) => [estilos.mas, pressed && estilos.apretado]}
          accessibilityRole="button"
          accessibilityLabel={etiquetaDelMas}
          hitSlop={margenDeToque(36)}
        >
          <Icono nombre="plus" tam={17} peso="semibold" />
        </Pressable>
      </Animated.View>
    );
  };
  const kcal = (v: Valores) => `${numero(Math.round(v.kcal))} kcal`;
  return (
    <Panel
      titulo={t('comida.guardadas')}
      alAtras={p.alAtras}
      abajo={p.abajo}
      vista="lista"
      haciaAtras={haciaAtras}
      pie={(
        <>
          <Boton tipo="quitar" texto={t('comida.receta.nueva')} alTocar={p.alNuevaReceta} />
          <Boton tipo="secundario" icono="doc.on.doc" texto={t('comida.receta.pegar')} alTocar={p.alPegarReceta} />
        </>
      )}
    >
      {hay && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={estilos.texto}>{t('comida.guardadasEditar.tocaParaCambiar')}</Animated.Text>}
      {vistas.comidas.map((r) => {
        const nombres = r.items.map((i) => i.nombre).join(', ');
        return fila({ tipo: 'comida', x: r }, numeros ? `${nombres} · ${kcal(sumarValores(r.items.map((i) => i.valores)))}` : nombres, t('comida.sumarAlimento', { alimento: r.nombre }));
      })}
      {vistas.recetas.length > 0 && (
        <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
          <Etiqueta estilo={estilos.separador}>{t('comida.recetas')}</Etiqueta>
        </Animated.View>
      )}
      {/* Sin los números, de la receta queda lo que suma el «+»: un plato. */}
      {vistas.recetas.map((r) => fila(
        { tipo: 'receta', x: r },
        numeros ? t('comida.receta.porPlato', { kcal: numero(Math.round(valoresDeReceta(r).porcion.kcal)) }) : t('comida.receta.plato'),
        t('comida.receta.sumarPlato'),
      ))}
      {vistas.propios.length > 0 && (
        <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA}>
          <Etiqueta estilo={estilos.separador}>{t('comida.guardadasEditar.tusAlimentos')}</Etiqueta>
        </Animated.View>
      )}
      {vistas.propios.map((a) => {
        const cantidad = porcionDePropio(a);
        return fila({ tipo: 'propio', x: a }, detalleDe({ cantidad, valores: valoresDeCantidad(a.por100g, cantidad) }, p.sistema, numeros), t('comida.sumarAlimento', { alimento: a.nombre }));
      })}
      {!hay && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={estilos.nota}>{t('comida.sinRegistros')}</Animated.Text>}
    </Panel>
  );
}

/** Lo que se cambia de una guardada: el nombre y lo que lleva (de una receta, también lo que rinde y lo que pesa), o lo de la etiqueta de un alimento tuyo. */
function EdicionDeGuardada({ g, e, sistema, numeros, alCambiar, alQuitar }: {
  g: Guardada; e: Edicion; sistema: Sistema; numeros: boolean; alCambiar: (cambio: Partial<Edicion>) => void; alQuitar: (i: number) => void;
}) {
  if (g.tipo === 'propio') {
    const kcalDerivadas = kcalDeMacros(leerNumero(e.proteina) ?? 0, leerNumero(e.carbohidratos) ?? 0, leerNumero(e.grasas) ?? 0);
    return (
      <>
        <Campo etiqueta={t('comida.nombre')} valor={e.nombre} alCambiar={(nombre) => alCambiar({ nombre })} texto />
        <Campo etiqueta={t('comida.etiquetaRevision.marca')} valor={e.marca} alCambiar={(marca) => alCambiar({ marca })} texto largo={60} mayusculas="words" corrector={false} />
        <Campo etiqueta={t('comida.etiquetaRevision.porcion')} valor={e.porcion} alCambiar={(porcion) => alCambiar({ porcion })} unidad="g" />
        <Etiqueta estilo={estilos.separador}>{t('comida.etiquetaRevision.porPorcion')}</Etiqueta>
        <Campo etiqueta={t('comida.kcal')} valor={e.kcal} alCambiar={(kcal) => alCambiar({ kcal })} unidad="kcal" ejemplo={!e.kcal && kcalDerivadas ? numero(Math.round(kcalDerivadas)) : undefined} />
        <Campo etiqueta={t('comida.carbohidratos')} valor={e.carbohidratos} alCambiar={(carbohidratos) => alCambiar({ carbohidratos })} unidad="g" />
        <Campo etiqueta={t('comida.proteina')} valor={e.proteina} alCambiar={(proteina) => alCambiar({ proteina })} unidad="g" />
        <Campo etiqueta={t('comida.grasas')} valor={e.grasas} alCambiar={(grasas) => alCambiar({ grasas })} unidad="g" ultimo />
      </>
    );
  }
  const receta = g.tipo === 'receta';
  const porciones = receta ? leerNumero(e.porciones) : 1;
  // De una receta, un plato: lo de la olla dividido por lo que rinde, como lo suma la lista.
  const deUno = escalar(sumarValores(e.items.map((i) => i.valores)), 1 / (porciones && porciones > 0 ? porciones : 1));
  return (
    <>
      <Campo etiqueta={t('comida.nombre')} valor={e.nombre} alCambiar={(nombre) => alCambiar({ nombre })} texto ultimo={!receta} />
      {receta && (
        <>
          <Campo etiqueta={t('comida.receta.porciones')} valor={e.porciones} alCambiar={(x) => alCambiar({ porciones: x })} unidad={t('comida.receta.porcionesUnidad')} />
          <Campo etiqueta={t('comida.receta.pesoFinal')} valor={e.pesoFinal} alCambiar={(x) => alCambiar({ pesoFinal: x })} unidad="g" ejemplo={t('comida.opcional')} ultimo />
        </>
      )}
      <Etiqueta estilo={estilos.separador}>{t(receta ? 'comida.receta.ingredientes' : 'comida.guardadasEditar.loQueLleva')}</Etiqueta>
      {e.items.map((item, i) => {
        const detalle = detalleDe(item, sistema, numeros);
        return (
          <Animated.View key={claveDe(item)} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.fila}>
            <View style={estilos.filaTextos}>
              <Text style={estilos.filaNombre} numberOfLines={1}>{item.nombre}</Text>
              {detalle ? <Text style={estilos.filaDetalle} numberOfLines={1}>{detalle}</Text> : null}
            </View>
            <Pressable
              onPress={() => alQuitar(i)}
              style={({ pressed }) => [estilos.quitar, pressed && estilos.apretado]}
              accessibilityRole="button"
              accessibilityLabel={t('comida.quitarAlimento', { alimento: item.nombre })}
              hitSlop={margenDeToque(32)}
            >
              <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.62)" peso="semibold" />
            </Pressable>
          </Animated.View>
        );
      })}
      {numeros ? (
        <Animated.View layout={ACOMODA} style={estilos.total}>
          <Text style={estilos.kcal}>
            {numero(Math.round(deUno.kcal))}
            <Text style={estilos.kcalUnidad}>{`  ${(receta ? t('comida.receta.porPlato', { kcal: '' }).trim() : t('comida.kcal')).toUpperCase()}`}</Text>
          </Text>
          {!e.items.length && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={estilos.queda}>{t('comida.guardadasEditar.vacia')}</Animated.Text>}
          <ChipsDeMacros v={deUno} />
        </Animated.View>
      ) : (
        !e.items.length && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.nota}>{t('comida.guardadasEditar.vacia')}</Animated.Text>
      )}
    </>
  );
}

export type Borrador = { id?: string; nombre: string; porciones: string; pesoFinal: string; items: Item[] };

export function PanelReceta(p: {
  borrador: Borrador; sistema: Sistema; alCambiar: (b: Borrador) => void; alQuitar: (i: number) => void; alAgregarIngrediente: () => void; alPegar: () => void; alGuardar: () => void; alAtras: () => void; abajo: number;
}) {
  const b = p.borrador;
  const numeros = useNumeros();
  const total = sumarValores(b.items.map((i) => i.valores));
  const porciones = leerNumero(b.porciones) ?? 0;
  const listo = !!b.nombre.trim() && b.items.length > 0 && porciones > 0;
  return (
    <Panel titulo={b.nombre.trim() || t('comida.receta.nueva')} alAtras={p.alAtras} abajo={p.abajo} pie={<Boton tipo="grande" texto={t('comida.receta.guardar')} desactivado={!listo} alTocar={p.alGuardar} />}>
      <Text style={estilos.texto}>{t('comida.receta.texto')}</Text>
      <Campo etiqueta={t('comida.nombre')} valor={b.nombre} alCambiar={(nombre) => p.alCambiar({ ...b, nombre })} texto ejemplo={t('comida.receta.nombreEjemplo')} enfocado={!b.nombre && !b.items.length} />
      <Campo etiqueta={t('comida.receta.porciones')} valor={b.porciones} alCambiar={(x) => p.alCambiar({ ...b, porciones: x })} unidad={t('comida.receta.porcionesUnidad')} />
      <Campo etiqueta={t('comida.receta.pesoFinal')} valor={b.pesoFinal} alCambiar={(x) => p.alCambiar({ ...b, pesoFinal: x })} unidad="g" ejemplo={t('comida.opcional')} ultimo />
      <Etiqueta estilo={estilos.separador}>{t('comida.receta.ingredientes')}</Etiqueta>
      {b.items.map((item, i) => (
        <Animated.View key={claveDe(item)} entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.fila}>
          <View style={estilos.filaTextos}>
            <Text style={estilos.filaNombre} numberOfLines={1}>{item.nombre}</Text>
            <Text style={estilos.filaDetalle} numberOfLines={1}>{detalleDe(item, p.sistema, numeros)}</Text>
          </View>
          <Pressable
            onPress={() => p.alQuitar(i)}
            style={({ pressed }) => [estilos.quitar, pressed && estilos.apretado]}
            accessibilityRole="button"
            accessibilityLabel={t('comida.quitarAlimento', { alimento: item.nombre })}
            hitSlop={margenDeToque(32)}
          >
            <Icono nombre="xmark" tam={12} color="rgba(239, 230, 207, 0.62)" peso="semibold" />
          </Pressable>
        </Animated.View>
      ))}
      {!b.items.length && <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.nota}>{t('comida.receta.sinIngredientes')}</Animated.Text>}
      <Animated.View layout={ACOMODA} style={estilos.agregarIngrediente}>
        <Boton texto={t('comida.receta.agregarIngrediente')} icono="plus" tipo="secundario" alTocar={p.alAgregarIngrediente} />
        {!b.items.length && (
          <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO}>
            <Boton texto={t('comida.receta.pegar')} icono="doc.on.doc" tipo="contorno" alTocar={p.alPegar} />
          </Animated.View>
        )}
      </Animated.View>
      {numeros && b.items.length > 0 && porciones > 0 && (
        <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} layout={ACOMODA} style={estilos.total}>
          <Text style={estilos.kcal}>
            {numero(Math.round(total.kcal / porciones))}
            <Text style={estilos.kcalUnidad}>{`  ${t('comida.kcal').toUpperCase()}`}</Text>
          </Text>
          <Text style={estilos.queda}>{t('comida.receta.porPlato', { kcal: numero(Math.round(total.kcal / porciones)) })}</Text>
          <ChipsDeMacros v={escalar(total, 1 / porciones)} />
        </Animated.View>
      )}
    </Panel>
  );
}

// ------------------------------------------------------------------ pegar una receta
/** Lo que salió de una receta pegada: el título (si tenía), lo que rinde, lo que pesa terminada y los ingredientes encontrados. */
export type RecetaPegada = { nombre: string; porciones: number | null; pesoFinal: number | null; items: Item[] };
type LineaBuscada = { linea: LineaDeReceta; item: Item | null; fuera: boolean };

/** El título: la primera línea, si el lector no la tomó por un ingrediente. */
function tituloDe(texto: string, lineas: readonly LineaDeReceta[]): string {
  const primera = texto.split('\n').map((l) => l.trim()).find(Boolean) ?? '';
  return !primera || lineas.some((l) => l.texto.trim() === primera) || primera.length > 60 ? '' : primera.replace(/^#+\s*/, '');
}

/**
 * Pegar una receta: el texto como venga (src/comida/recetaDeTexto.ts), cada ingrediente buscado en
 * la base con sus gramos, y la revisión (un toque saca una línea) antes de pasarla a la receta.
 */
export function PanelPegarReceta({ sistema, alUsar, alAtras, abajo }: { sistema: Sistema; alUsar: (r: RecetaPegada) => void; alAtras: () => void; abajo: number }) {
  const numeros = useNumeros();
  const [texto, setTexto] = useState('');
  useSinGuardar(!!texto.trim());
  const [leyendo, setLeyendo] = useState(false);
  const [leida, setLeida] = useState<{ nombre: string; porciones: number | null; pesoFinal: number | null; lineas: LineaBuscada[] } | null>(null);
  const leer = async () => {
    setLeyendo(true);
    const op = opcionesDeIdioma();
    const receta = leerReceta(texto, op.idioma);
    const lineas = await Promise.all(receta.lineas.map(async (linea): Promise<LineaBuscada> => {
      const [hallado] = await baseDeAlimentos.buscar(linea.buscado, { ...op, limite: 1 }).catch(() => []);
      const d = hallado ? await baseDeAlimentos.detalle(hallado.id, op).catch(() => null) : null;
      const gramos = d ? gramosDeLinea(linea, d) : null;
      // Sin cantidad («sal a gusto») queda en 0 g: se ve qué es, pero no suma.
      return { linea, item: d ? itemDeAlimento('base', String(d.id), d.nombre, d.por100g, { gramos: gramos ? Math.round(gramos) : 0 }) : null, fuera: false };
    }));
    setLeida({ nombre: tituloDe(texto, receta.lineas), porciones: receta.porciones, pesoFinal: receta.pesoFinal, lineas });
    setLeyendo(false);
  };
  const usables = leida ? leida.lineas.filter((x) => x.item && (gramosDe(x.item.cantidad) ?? 0) > 0 && !x.fuera) : [];
  const total = sumarValores(usables.map((x) => x.item!.valores));
  return (
    <Panel
      titulo={t('comida.receta.pegar')}
      alAtras={alAtras}
      abajo={abajo}
      pie={(
        <>
          <Boton tipo="secundario" texto={t('comida.receta.leer')} desactivado={!texto.trim() || leyendo} alTocar={() => { leer().catch(() => setLeyendo(false)); }} />
          {leida && <Boton tipo="grande" texto={t('comida.receta.usar')} desactivado={!usables.length} alTocar={() => alUsar({ nombre: leida.nombre, porciones: leida.porciones, pesoFinal: leida.pesoFinal, items: usables.map((x) => x.item!) })} />}
        </>
      )}
    >
      <Text style={estilos.texto}>{t('comida.receta.pegarTexto')}</Text>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        multiline
        maxLength={6000}
        placeholder={t('comida.receta.ejemplo')}
        placeholderTextColor="rgba(239, 230, 207, 0.32)"
        keyboardAppearance="dark"
        style={estilos.pegar}
        textAlignVertical="top"
        accessibilityLabel={t('comida.receta.pegar')}
      />
      {leida && (
        <Animated.View entering={FadeIn.duration(300).reduceMotion(ReduceMotion.Never)} layout={ACOMODA}>
          {leida.lineas.length ? (
            <>
              <Text style={estilos.nota}>{t('comida.receta.encontrados', { n: leida.lineas.filter((x) => x.item && (gramosDe(x.item.cantidad) ?? 0) > 0).length, total: leida.lineas.length })}</Text>
              {leida.lineas.map((x, i) => {
                const gramos = x.item ? gramosDe(x.item.cantidad) ?? 0 : 0;
                const sirve = !!x.item && gramos > 0;
                return (
                  <Pressable
                    key={i}
                    disabled={!sirve}
                    onPress={() => setLeida({ ...leida, lineas: leida.lineas.map((y, k) => (k === i ? { ...y, fuera: !y.fuera } : y)) })}
                    style={({ pressed }) => [estilos.fila, x.fuera && estilos.fuera, pressed && (x.fuera ? estilos.fueraApretada : estilos.filaApretada)]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: sirve && !x.fuera, disabled: !sirve }}
                  >
                    <View style={estilos.filaTextos}>
                      <Text style={[estilos.filaNombre, !sirve && estilos.sinEncontrar, x.fuera && estilos.tachado]} numberOfLines={1}>{x.item ? x.item.nombre : t('comida.receta.sinEncontrar')}</Text>
                      <Text style={estilos.filaDetalle} numberOfLines={1}>{x.linea.texto}</Text>
                    </View>
                    <Text style={estilos.filaDetalle}>{sirve ? detalleDe(x.item!, sistema, numeros) : x.item ? t('comida.receta.sinCantidad') : ''}</Text>
                  </Pressable>
                );
              })}
              {numeros && usables.length > 0 && (
                <Animated.Text entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} style={estilos.totalPegado}>{t('comida.receta.porPlato', { kcal: numero(Math.round(total.kcal / (leida.porciones ?? 1))) })}</Animated.Text>
              )}
            </>
          ) : (
            <Text style={estilos.nota}>{t('comida.receta.nadaLeido')}</Text>
          )}
        </Animated.View>
      )}
    </Panel>
  );
}

/** El borrador de una receta, como receta para guardar; sin lo necesario, null. */
export function recetaDe(b: Borrador): Omit<Receta, 'id' | 'actualizado' | 'borrado'> & { id?: string } | null {
  const porciones = leerNumero(b.porciones);
  const pesoFinal = leerNumero(b.pesoFinal);
  if (!b.nombre.trim() || !b.items.length || !porciones) return null;
  return { ...(b.id ? { id: b.id } : {}), tipo: 'receta', nombre: b.nombre.trim(), items: b.items, porciones, pesoFinal: pesoFinal && pesoFinal > 0 ? pesoFinal : null };
}

// ------------------------------------------------------------------ crear un alimento
export type DatosDeEtiqueta = { codigo?: string; nombre?: string; marca?: string | null; leida?: EtiquetaLeida; porcion?: { texto: string; gramos: number } | null; porPorcion?: Leidos };

const CAMPOS_DE_ETIQUETA = [['kcal', 'kcal'], ['carbohidratos', 'g'], ['proteina', 'g'], ['grasas', 'g'], ['saturadas', 'g'], ['azucares', 'g'], ['fibra', 'g'], ['sodio', 'mg']] as const;

const completa = (x: Leidos) => (['kcal', 'proteina', 'carbohidratos', 'grasas'] as const).every((k) => x[k] != null);

export function PanelCrear({ inicial, alGuardar, alAtras, abajo }: { inicial: DatosDeEtiqueta; alGuardar: (propio: Omit<AlimentoPropio, 'id' | 'actualizado' | 'borrado'>) => void; alAtras: () => void; abajo: number }) {
  const [c, setC] = useState<Record<string, string>>(() => {
    const leida = inicial.leida;
    // Una etiqueta con solo la columna por 100 g (las de Europa) llena los campos con esa columna,
    // llevada a la porción; si no dice la porción, la porción son esos 100 g.
    const desde100 = !!leida && !completa(leida.porPorcion) && completa(leida.por100g);
    const porcion = leida?.porcion ?? inicial.porcion ?? (desde100 ? { texto: '100 g', gramos: 100 } : null);
    const v: Leidos = desde100 && porcion
      ? Object.fromEntries(Object.entries(leida.por100g).map(([k, x]) => [k, x * (porcion.gramos / 100)]))
      : (leida?.porPorcion ?? inicial.porPorcion ?? {});
    return {
      nombre: inicial.nombre ?? '', marca: inicial.marca ?? '', codigo: inicial.codigo ?? '',
      porcionNombre: porcion?.texto ?? '', porcionGramos: porcion ? paraCampo(porcion.gramos) : '',
      ...Object.fromEntries(CAMPOS_DE_ETIQUETA.map(([k]) => [k, v[k] != null ? paraCampo(v[k]!) : ''])),
    };
  });
  // Lo leído de la etiqueta o lo que ya venía (el nombre buscado, el código) también se perdería: cuenta como escrito.
  useSinGuardar(Object.values(c).some((x) => !!x.trim()));
  const poner = (k: string) => (x: string) => setC((antes) => ({ ...antes, [k]: x }));
  const gramos = leerNumero(c.porcionGramos);
  const avisos = inicial.leida?.avisos ?? [];
  // Sin las kcal (no se leyeron o no se escribieron), salen de los macros, como en la carga rápida.
  const kcalDerivadas = kcalDeMacros(leerNumero(c.proteina) ?? 0, leerNumero(c.carbohidratos) ?? 0, leerNumero(c.grasas) ?? 0);
  const guardar = () => {
    if (!c.nombre.trim() || !gramos) return;
    const f = 100 / gramos;
    const por100 = (k: string) => {
      const x = leerNumero(c[k]);
      return x === null ? undefined : x * f;
    };
    const por100g: Valores = { kcal: por100('kcal') ?? kcalDerivadas * f, proteina: por100('proteina') ?? 0, carbohidratos: por100('carbohidratos') ?? 0, grasas: por100('grasas') ?? 0 };
    for (const k of ['saturadas', 'azucares', 'fibra', 'sodio'] as const) if (por100(k) !== undefined) por100g[k] = por100(k);
    const codigo = c.codigo.replace(/\D/g, '');
    alGuardar({
      nombre: c.nombre.trim(), marca: c.marca.trim() || null, codigo: codigo.length >= 6 ? codigo : null, por100g,
      porciones: [{ nombre: c.porcionNombre.trim() || `${numero(gramos, 1)} g`, gramos }],
    });
  };
  return (
    <Panel titulo={inicial.leida ? t('comida.etiquetaRevision.titulo') : t('comida.crear.titulo')} alAtras={alAtras} abajo={abajo} pie={<Boton tipo="grande" texto={t('comida.crear.guardar')} desactivado={!c.nombre.trim() || !gramos} alTocar={guardar} />}>
      <Text style={estilos.texto}>{inicial.leida ? t('comida.etiquetaRevision.leida') : t('comida.crear.texto')}</Text>
      {avisos.map((a) => <Text key={a} style={estilos.aviso}>{t(`comida.etiquetaRevision.${a}`)}</Text>)}
      <Campo etiqueta={t('comida.nombre')} valor={c.nombre} alCambiar={poner('nombre')} texto ejemplo={t('comida.etiquetaRevision.nombreEjemplo')} enfocado={!inicial.nombre && !inicial.leida} />
      <Campo etiqueta={t('comida.etiquetaRevision.marca')} valor={c.marca} alCambiar={poner('marca')} texto largo={60} mayusculas="words" corrector={false} />
      <Campo etiqueta={t('comida.crear.porcionNombre')} valor={c.porcionNombre} alCambiar={poner('porcionNombre')} texto largo={40} mayusculas="none" ejemplo={t('comida.crear.porcionEjemplo')} />
      <Campo etiqueta={t('comida.etiquetaRevision.porcion')} valor={c.porcionGramos} alCambiar={poner('porcionGramos')} unidad="g" mal={avisos.includes('sinPorcion')} />
      <Etiqueta estilo={estilos.separador}>{t('comida.etiquetaRevision.porPorcion')}</Etiqueta>
      {CAMPOS_DE_ETIQUETA.map(([k, unidad]) => (
        <Campo
          key={k}
          etiqueta={k === 'kcal' ? t('comida.kcal') : k === 'proteina' || k === 'carbohidratos' || k === 'grasas' ? t(`comida.${k}`) : t(`comida.secundarios.${k}`)}
          valor={c[k]}
          alCambiar={poner(k)}
          unidad={unidad}
          ejemplo={k === 'kcal' && !c.kcal && kcalDerivadas ? numero(Math.round(kcalDerivadas)) : undefined}
          mal={k === 'kcal' && avisos.includes('noCierra')}
        />
      ))}
      <Campo etiqueta={t('comida.crear.codigo')} valor={c.codigo} alCambiar={poner('codigo')} unidad="#" teclado="number-pad" largo={14} ultimo />
    </Panel>
  );
}

/** Cuántos alimentos y kcal tiene la comida que se arma: «3 alimentos · 640 kcal». */
export const resumenDeCanasta = (canasta: Item[], numeros = true) =>
  numeros ? plural('comida.agregados', canasta.length, { kcal: numero(Math.round(sumarValores(canasta.map((i) => i.valores)).kcal)) }) : plural('comida.alimentos', canasta.length);

const estilos = StyleSheet.create({
  // Las esquinas de la hoja de registro, que no recorta lo de adentro.
  panel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: colores.hoja },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 46, paddingTop: 2, paddingHorizontal: 12 },
  atras: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  lugar: { width: 38 },
  tituloLugar: { flex: 1, minWidth: 0 },
  titulo: { textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  cuerpo: { flex: 1 },
  cuerpoAdentro: { paddingHorizontal: 20, paddingBottom: 18 },
  pie: { gap: 8, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(8, 12, 28, 0.94)' },
  texto: { marginTop: 2, marginBottom: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  nota: { marginTop: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  aviso: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(232, 196, 106, 0.1)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.32)', fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: colores.oroClaro },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 7, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  // En Guardadas, toda la fila (menos el «+») se toca para cambiarla: el alto va en lo que se toca.
  filaGuardada: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  filaGuardadaTocable: { flex: 1, minWidth: 0, minHeight: 58, paddingVertical: 7, justifyContent: 'center' },
  filaApretada: { opacity: 0.7 },
  apretado: { opacity: 0.6 },
  filaTextos: { flex: 1, gap: 4, minWidth: 0 },
  filaNombre: { fontFamily: letras.texto, fontSize: 15.5, color: colores.pergamino },
  filaDetalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  quitar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', alignItems: 'center', justifyContent: 'center' },
  mas: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.5)', backgroundColor: 'rgba(232, 196, 106, 0.08)', alignItems: 'center', justifyContent: 'center' },
  total: { marginTop: 16, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16, borderRadius: 16, backgroundColor: 'rgba(239, 230, 207, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)' },
  kcal: { fontFamily: letras.numeroLiviano, fontSize: 48, lineHeight: 50, letterSpacing: -1, color: colores.cifra, fontVariant: ['tabular-nums'] },
  kcalUnidad: { fontFamily: letras.texto, fontSize: 11, letterSpacing: 2, color: 'rgba(239, 230, 207, 0.6)' },
  queda: { marginTop: 8, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.78)' },
  chips: { marginTop: 14, flexDirection: 'row', gap: 8 },
  chip: { flex: 1, gap: 4, paddingTop: 10, paddingHorizontal: 11, paddingBottom: 9, borderRadius: 12, backgroundColor: 'rgba(239, 230, 207, 0.05)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)', minWidth: 0 },
  chipCifra: { fontFamily: letras.numeroMedio, fontSize: 16, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  chipNombre: { fontFamily: letras.texto, fontSize: 10.5, color: 'rgba(239, 230, 207, 0.55)' },
  campo: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  campoTexto: {},
  campoEtiqueta: { flex: 1, fontFamily: letras.texto, fontSize: 14.5, color: colores.pergamino },
  // Con el alto mínimo: con el texto grande de iOS, el campo crece en vez de cortar lo escrito.
  campoEntrada: { width: 118, minHeight: 40, outlineWidth: 0, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(239, 230, 207, 0.06)', paddingHorizontal: 12, textAlign: 'right', fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
  campoEntradaTexto: { flex: 2, width: undefined, textAlign: 'left' },
  campoMal: { borderColor: 'rgba(232, 196, 106, 0.7)', color: colores.oroClaro },
  campoUnidad: { minWidth: 30, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
  separador: { marginTop: 22, marginBottom: 4 },
  pegar: { marginTop: 10, minHeight: 150, maxHeight: 260, padding: 12, outlineWidth: 0, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)', backgroundColor: 'rgba(6, 10, 22, 0.6)', fontFamily: letras.texto, fontSize: 14, lineHeight: 20, color: colores.pergamino },
  fuera: { opacity: 0.35 },
  fueraApretada: { opacity: 0.25 },
  tachado: { textDecorationLine: 'line-through' },
  sinEncontrar: { fontStyle: 'italic', color: 'rgba(239, 230, 207, 0.5)' },
  totalPegado: { marginTop: 12, textAlign: 'right', fontFamily: letras.textoMedio, fontSize: 14, color: colores.oroClaro },
  agregarIngrediente: { marginTop: 12, alignItems: 'flex-start', gap: 8 },
  borrar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 13, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(240, 165, 138, 0.28)' },
  borrarApretado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  borrarTexto: { fontFamily: letras.texto, fontSize: 15, color: '#f0a58a' },
});
