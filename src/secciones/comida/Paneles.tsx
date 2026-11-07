// Los paneles de la hoja de registro, como en la galería: entran desde la derecha, sobre la lista.
// - La revisión de la comida que se arma, antes de agregarla, y guardarla para la próxima.
// - La carga rápida: calorías y macros a mano.
// - Las comidas guardadas y las recetas, con la receta nueva (con su peso final).
// - Crear un alimento: a mano, o con lo que se leyó de la etiqueta.

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type AutoCapitalize, type KeyboardTypeOptions, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, LayoutAnimationConfig, ReduceMotion, useAnimatedRef, useReducedMotion, useScrollOffset } from 'react-native-reanimated';

import { baseDeAlimentos } from '@/comida/base';
import type { Etiqueta as EtiquetaLeida, Leidos } from '@/comida/etiqueta';
import { decimal, leerNumero } from '@/comida/porciones';
import { gramosDeLinea, leerReceta, type LineaDeReceta } from '@/comida/recetaDeTexto';
import type { Comida } from '@/dominio/comidas';
import type { Sistema } from '@/dominio/cantidades';
import { escalar, gramosDe, itemDeAlimento, itemRapido, sumarValores, valoresDeReceta, type AlimentoPropio, type Item, type Receta, type Valores } from '@/dominio/registros';
import { idioma, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_FUNDIDO, ENTRA_PANEL, SALE_FUNDIDO, SALE_PANEL } from '../movimiento';
import { margenDeToque } from '../paso';
import { ACOMODA } from '../tarjetas';
import { tecladoDeNumeros, useCampoALaVista } from '../teclado';
import { Boton, Etiqueta, Icono, MACROS, Punto } from './comunes';
import { cantidadDeTexto, gramosDeMacro, numero, opcionesDeIdioma, useNumeros } from './datos';

/** Un número para llenar un campo: con el decimal del idioma y sin separar los miles, así `leerNumero` lo lee igual. */
const paraCampo = (n: number) => decimal(Math.round(n * 10) / 10, idioma(), false);

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

/** Las kcal que dan los macros (4/4/9): las de un campo de kcal vacío. */
const kcalDeMacros = (proteina: number, carbohidratos: number, grasas: number) => proteina * 4 + carbohidratos * 4 + grasas * 9;

type Cadena = { registrar: (campo: RefObject<TextInputInstance | null>) => () => void; siguiente: (campo: RefObject<TextInputInstance | null>) => void };
/** Los campos de un panel, en el orden en que se ven: «Siguiente» pasa al que sigue. */
const CamposDelPanel = createContext<Cadena | null>(null);

/**
 * Un panel, sobre la lista de la hoja. `abajo` es el borde de abajo del teléfono: la hoja ya lo deja
 * debajo de la lista (o el teclado), y el panel baja hasta el borde por detrás de ese lugar, así su pie
 * llega abajo de todo sin contarlo dos veces. Con el teclado arriba, lo que baja queda detrás del teclado.
 */
export function Panel({ titulo, alAtras, children, pie, abajo }: { titulo: string; alAtras: () => void; children: ReactNode; pie?: ReactNode; abajo: number }) {
  const reducido = useReducedMotion();
  // El panel ya se achica con el teclado (el lugar de abajo de la hoja crece con él): el scroll solo
  // trae el campo que quedó tapado por su borde.
  const scroll = useAnimatedRef<ScrollView>();
  const scrollY = useScrollOffset(scroll);
  useCampoALaVista(scroll, scrollY);
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
      <View style={estilos.cabeza}>
        <Pressable onPress={alAtras} style={({ pressed }) => [estilos.atras, pressed && estilos.apretado]} accessibilityRole="button" accessibilityLabel={t('comun.atras')} hitSlop={margenDeToque(38)}>
          <Icono nombre="chevron.left" tam={18} peso="medium" />
        </Pressable>
        <Text style={estilos.titulo} numberOfLines={1}>{titulo}</Text>
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
          {/* Lo que ya está cuando el panel entra viene con él; lo que llega o se va después, con su fundido. */}
          <LayoutAnimationConfig skipEntering>{children}</LayoutAnimationConfig>
        </ScrollView>
      </CamposDelPanel.Provider>
      {pie && <View style={[estilos.pie, { paddingBottom: abajo + 6 }]}>{pie}</View>}
    </Animated.View>
  );
}

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
  comida: Comida; canasta: Item[]; sistema: Sistema; restante: (kcal: number) => number | null; abajo: number;
  alEditar: (i: number) => void; alQuitar: (i: number) => void; alAgregar: () => void; alGuardarComo: () => void; alAtras: () => void;
}) {
  // Sin los números (Perfil › Los números), lo que quedaría del día no se dice, como en la galería.
  const numeros = useNumeros();
  const total = sumarValores(p.canasta.map((i) => i.valores));
  const restante = p.restante(total.kcal);
  return (
    <Panel
      titulo={t(`comida.tuComida.${p.comida}`)}
      alAtras={p.alAtras}
      abajo={p.abajo}
      pie={
        <>
          <Boton tipo="grande" texto={t(`comida.agregarA.${p.comida}`)} alTocar={p.alAgregar} />
          <Boton tipo="quitar" texto={t('comida.guardarComida')} alTocar={p.alGuardarComo} />
        </>
      }
    >
      <Text style={estilos.texto}>{t('comida.revisarTexto')}</Text>
      {p.canasta.map((item, i) => {
        const sePuedeCambiar = item.fuente !== 'rapida';
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
                <Text style={estilos.filaDetalle} numberOfLines={1}>{[cantidadDeTexto(item.cantidad, p.sistema), `${numero(Math.round(item.valores.kcal))} kcal`].filter(Boolean).join(' · ')}</Text>
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
      <Animated.View layout={ACOMODA} style={estilos.total}>
        <Text style={estilos.kcal}>
          {numero(Math.round(total.kcal))}
          <Text style={estilos.kcalUnidad}>{`  ${t('comida.kcal').toUpperCase()}`}</Text>
        </Text>
        {numeros && restante !== null && <Text style={estilos.queda}>{t(restante >= 0 ? 'comida.teQuedarian' : 'comida.tePasarias', { n: numero(Math.abs(Math.round(restante))) })}</Text>}
        <ChipsDeMacros v={total} />
      </Animated.View>
    </Panel>
  );
}

export function PanelGuardarComo({ alGuardar, alAtras, abajo }: { alGuardar: (nombre: string) => void; alAtras: () => void; abajo: number }) {
  const [nombre, setNombre] = useState('');
  return (
    <Panel titulo={t('comida.guardarComo.titulo')} alAtras={alAtras} abajo={abajo} pie={<Boton tipo="grande" texto={t('comun.guardar')} desactivado={!nombre.trim()} alTocar={() => alGuardar(nombre.trim())} />}>
      <Campo etiqueta={t('comida.nombre')} valor={nombre} alCambiar={setNombre} texto ejemplo={t('comida.guardarComo.ejemplo')} enfocado alListo={() => { if (nombre.trim()) alGuardar(nombre.trim()); }} />
    </Panel>
  );
}

// ------------------------------------------------------------------ la carga rápida
export function PanelRapida({ directo, comida, inicial, alSumar, alQuitar, alAtras, abajo }: {
  directo: boolean; comida: Comida; inicial?: { nombre: string; valores: Valores }; alSumar: (item: Item) => void; alQuitar?: () => void; alAtras: () => void; abajo: number;
}) {
  // Corrigiendo una carga rápida, abre con lo que tenía.
  const [c, setC] = useState(() => {
    const v = inicial?.valores;
    const campo = (x: number | undefined) => (x ? paraCampo(x) : '');
    return { nombre: inicial?.nombre ?? '', kcal: campo(v?.kcal), proteina: campo(v?.proteina), carbohidratos: campo(v?.carbohidratos), grasas: campo(v?.grasas) };
  });
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
            texto={inicial ? t('comun.guardar') : directo ? t(`comida.agregarA.${comida}`) : t('comida.sumar')}
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

// ------------------------------------------------------------------ las guardadas y las recetas
export function PanelGuardadas(p: {
  recetas: Receta[]; alSumarComida: (r: Receta) => void; alAbrirReceta: (r: Receta) => void; alNuevaReceta: () => void; alPegarReceta: () => void; alAtras: () => void; abajo: number;
}) {
  const comidas = p.recetas.filter((r) => r.tipo === 'comida');
  const recetas = p.recetas.filter((r) => r.tipo === 'receta');
  return (
    <Panel
      titulo={t('comida.guardadas')}
      alAtras={p.alAtras}
      abajo={p.abajo}
      pie={(
        <>
          <Boton tipo="quitar" texto={t('comida.receta.nueva')} alTocar={p.alNuevaReceta} />
          <Boton tipo="secundario" icono="doc.on.doc" texto={t('comida.receta.pegar')} alTocar={p.alPegarReceta} />
        </>
      )}
    >
      {comidas.map((r) => {
        const total = sumarValores(r.items.map((i) => i.valores));
        return (
          <View key={r.id} style={estilos.fila}>
            <View style={estilos.filaTextos}>
              <Text style={estilos.filaNombre} numberOfLines={1}>{r.nombre}</Text>
              <Text style={estilos.filaDetalle} numberOfLines={1}>{`${r.items.map((i) => i.nombre).join(', ')} · ${numero(Math.round(total.kcal))} kcal`}</Text>
            </View>
            <Pressable
              onPress={() => p.alSumarComida(r)}
              style={({ pressed }) => [estilos.mas, pressed && estilos.apretado]}
              accessibilityRole="button"
              accessibilityLabel={t('comida.sumarAlimento', { alimento: r.nombre })}
              hitSlop={margenDeToque(36)}
            >
              <Icono nombre="plus" tam={17} peso="semibold" />
            </Pressable>
          </View>
        );
      })}
      {recetas.length > 0 && <Etiqueta estilo={estilos.separador}>{t('comida.recetas')}</Etiqueta>}
      {recetas.map((r) => {
        const { porcion } = valoresDeReceta(r);
        return (
          <Pressable key={r.id} onPress={() => p.alAbrirReceta(r)} style={({ pressed }) => [estilos.fila, pressed && estilos.filaApretada]} accessibilityRole="button">
            <View style={estilos.filaTextos}>
              <Text style={estilos.filaNombre} numberOfLines={1}>{r.nombre}</Text>
              <Text style={estilos.filaDetalle} numberOfLines={1}>{t('comida.receta.porPlato', { kcal: numero(Math.round(porcion.kcal)) })}</Text>
            </View>
            <Icono nombre="chevron.right" tam={13} color={colores.pergaminoApagado} />
          </Pressable>
        );
      })}
      {!comidas.length && !recetas.length && <Text style={estilos.nota}>{t('comida.sinRegistros')}</Text>}
    </Panel>
  );
}

export type Borrador = { id?: string; nombre: string; porciones: string; pesoFinal: string; items: Item[] };

export function PanelReceta(p: {
  borrador: Borrador; sistema: Sistema; alCambiar: (b: Borrador) => void; alQuitar: (i: number) => void; alAgregarIngrediente: () => void; alPegar: () => void; alGuardar: () => void; alAtras: () => void; abajo: number;
}) {
  const b = p.borrador;
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
            <Text style={estilos.filaDetalle} numberOfLines={1}>{`${cantidadDeTexto(item.cantidad, p.sistema)} · ${numero(Math.round(item.valores.kcal))} kcal`}</Text>
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
      {b.items.length > 0 && porciones > 0 && (
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
  const [texto, setTexto] = useState('');
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
                    <Text style={estilos.filaDetalle}>{sirve ? `${cantidadDeTexto(x.item!.cantidad, sistema)} · ${numero(Math.round(x.item!.valores.kcal))} kcal` : x.item ? t('comida.receta.sinCantidad') : ''}</Text>
                  </Pressable>
                );
              })}
              {usables.length > 0 && <Text style={estilos.totalPegado}>{t('comida.receta.porPlato', { kcal: numero(Math.round(total.kcal / (leida.porciones ?? 1))) })}</Text>}
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
export const resumenDeCanasta = (canasta: Item[]) => plural('comida.agregados', canasta.length, { kcal: numero(Math.round(sumarValores(canasta.map((i) => i.valores)).kcal)) });

const estilos = StyleSheet.create({
  // Las esquinas de la hoja de registro, que no recorta lo de adentro.
  panel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderTopLeftRadius: 27, borderTopRightRadius: 27, backgroundColor: colores.hoja },
  cabeza: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 46, paddingTop: 2, paddingHorizontal: 12 },
  atras: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  lugar: { width: 38 },
  titulo: { flex: 1, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino },
  cuerpo: { flex: 1 },
  cuerpoAdentro: { paddingHorizontal: 20, paddingBottom: 18 },
  pie: { gap: 8, paddingTop: 12, paddingHorizontal: 20, borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(8, 12, 28, 0.94)' },
  texto: { marginTop: 2, marginBottom: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  nota: { marginTop: 14, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  aviso: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: 'rgba(232, 196, 106, 0.1)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.32)', fontFamily: letras.texto, fontSize: 13, lineHeight: 17.5, color: colores.oroClaro },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 7, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
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
});
