// La hoja de registro, la de la galería (spec/nutricion.md, «Registrar: los flujos y sus toques»):
// abre lista para escribir, con la comida de la hora (se cambia con un toque) y, sin escribir, lo
// que sueles comer a esa hora, tus recientes y tus favoritos. Registrar es armar la comida: cada
// alimento se abre en su ventana y se suma; abajo se ve lo que se junta, «Listo» abre la revisión y
// recién «Agregar» lo registra. Lo juntado queda guardado si se cierra la hoja.
// Tiene también los atajos: la comida de ayer, las guardadas y las recetas, la carga rápida, crear
// un alimento, el código de barras y la foto de la etiqueta.
// Abierta para otro día, lo dice arriba y en la comida que se arma («Tu cena · ayer»); con los números
// ocultos, sin calorías ni gramos; y con algo escrito sin guardar, cerrarla pregunta antes (la galería 46).

import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputInstance } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutDown, LayoutAnimationConfig, ReduceMotion, useAnimatedStyle, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { textoDeBusqueda } from '@/almacen/buzon';
import { buzon } from '@/almacen/buzonDeMoss';
import { baseDeAlimentos } from '@/comida/base';
import { normalizar, type Resultado } from '@/comida/buscar';
import { formasDelCodigo, type Detalle } from '@/comida/detalle';
import { leerEtiqueta, type Leidos, type Nutriente } from '@/comida/etiqueta';
import { conUnaUnidad } from '@/comida/porciones';
import { buscarEnOff, type Producto } from '@/comida/off';
import { ACEITE_POR_100G } from '@/dominio/cantidades';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { edadDe, type Macros } from '@/dominio/metas';
import type { ParaQuien } from '@/dominio/micronutrientes';
import { SITIO } from '@/lib/sitio';
import {
  claveDeAlimento, delDia, deSiempre, escalar, gramosDe, itemDeAlimento, itemsParaRegistrar, premios, recientes, sueles, sumarValores, ultimaCantidad,
  valoresDeCantidad, valoresDeReceta, vigentes, type AlimentoPropio, type Cantidad, type Item, type Receta, type Registro, type Valores,
} from '@/dominio/registros';
import { idioma, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { CabezaQueBaja, ScrollQueBaja, useBajarParaCerrar } from '../arrastre';
import { confirmarDescartar } from '../descartar';
import { ENTRA_FUNDIDO, ENTRA_HOJA, ENTRA_VELO, SALE_FUNDIDO, SALE_HOJA, SALE_VELO } from '../movimiento';
import { margenDeToque } from '../paso';
import { ACOMODA, Aparece } from '../tarjetas';
import { useTeclado } from '../teclado';
import { AvisoFlotante, Boton, Etiqueta, Icono, Pastilla, type Aviso } from './comunes';
import { PanelDecir } from './Decir';
import { lineasDeHoy } from './entreno';
import { LineaDeEntreno } from './LineaDeEntreno';
import { cantidadDeTexto, comidaDeAhora, metaDelDia, momentoDe, numero, opcionesDeIdioma, region, sistemaDe, totalDe, useEstado, useNumeros } from './datos';
import { Escaner } from './Escaner';
import { etiquetaDelDia, porcionDePropio, tuComidaDe, type Guardada } from './hoja';
import {
  heredarClave, MedirPie, PanelCrear, PanelGuardadas, PanelGuardarComo, PanelPegarReceta, PanelRapida, PanelReceta, PanelRevision, recetaDe, resumenDeCanasta, SinGuardar,
  type Borrador, type DatosDeEtiqueta,
} from './Paneles';
import { avisar, cerrarRegistro, useRegistro, type Panel, type Pedido } from './registro';
import { origenDe, Ventana, type AlimentoAbierto, type ModoDeVentana } from './Ventana';

type VentanaAbierta = { alimento: AlimentoAbierto; inicial?: Cantidad; estimado?: boolean; modo: ModoDeVentana };
type EstadoDelEscaner = { modo: 'codigo' | 'etiqueta'; mensaje: string | null; ocupado: boolean; codigo?: string; parcial?: Producto | null };

/** Lo escrito en el buscador parece una comida entera: varias cosas, con comas o con «y» y otra cantidad. */
function pareceUnaComida(q: string): boolean {
  return /,/.test(q) || /\s(?:y|e|and)\s+(?:\d|un|una|dos|tres|cuatro|media|medio|a|an|two|three)(?![\p{L}])/iu.test(q);
}

/** Los valores sin el aceite de cocción que se les sumó. */
function sinAceite(v: Valores, aceite: number | undefined): Valores {
  if (!aceite) return v;
  const a = escalar(ACEITE_POR_100G, aceite / 100);
  const r: Valores = { kcal: v.kcal - a.kcal, proteina: v.proteina, carbohidratos: v.carbohidratos, grasas: Math.max(0, v.grasas - a.grasas) };
  for (const k of ['fibra', 'azucares', 'sodio', 'alcohol'] as const) if (v[k] != null) r[k] = v[k];
  if (v.saturadas != null) r.saturadas = Math.max(0, v.saturadas - (a.saturadas ?? 0));
  return r;
}

/** Los valores por 100 g de algo ya anotado: así, al corregirlo, se recalcula con lo que valía. */
function por100gDe(item: Pick<Item, 'cantidad' | 'valores'>): Valores | null {
  const g = gramosDe(item.cantidad);
  return g ? escalar(sinAceite(item.valores, item.cantidad?.aceite), 100 / g) : null;
}

/** Una receta propia, para la ventana: un plato es lo que pesa terminada (o sus ingredientes) dividido por lo que rinde. */
function alimentoDeReceta(r: Receta): AlimentoAbierto {
  const { total } = valoresDeReceta(r);
  const peso = r.pesoFinal ?? r.items.reduce((s, i) => s + (gramosDe(i.cantidad) ?? 0), 0);
  return {
    fuente: 'receta', ref: r.id, nombre: r.nombre, origen: t('comida.receta.titulo'),
    por100g: escalar(total, peso ? 100 / peso : 0), porciones: peso ? [{ nombre: t('comida.receta.plato'), gramos: peso / r.porciones }] : [],
  };
}

/** La ventana con la que abre la hoja para corregir un registro: con lo que valía al anotarlo. La carga rápida no tiene ventana. */
function ventanaParaCorregir(e: ReturnType<ReturnType<typeof elAlmacen>['estado']>, id: string | undefined): VentanaAbierta | null {
  const r = id ? e.registros.get(id) : undefined;
  if (!r || r.fuente === 'rapida') return null;
  const por100g = por100gDe(r) ?? r.valores;
  const propio = r.fuente === 'propio' && r.ref ? e.propios.get(r.ref) : undefined;
  const receta = r.fuente === 'receta' && r.ref ? e.recetas.get(r.ref) : undefined;
  const base = propio ? alimentoDePropio(propio) : receta ? alimentoDeReceta(receta) : null;
  return {
    alimento: { fuente: r.fuente, ref: r.ref ?? '', nombre: r.nombre, por100g, porciones: base?.porciones ?? [], origen: base?.origen ?? t('comida.fuente.usda') },
    inicial: r.cantidad ?? undefined,
    estimado: !!r.estimado,
    modo: { tipo: 'registro', id: r.id },
  };
}

let veces = 0;
/** Un número nuevo para cada aviso, así el mismo texto dos veces se vuelve a mostrar. */
const otraVez = () => ++veces;

function alimentoDePropio(a: AlimentoPropio): AlimentoAbierto {
  return {
    fuente: 'propio', ref: a.id, nombre: a.nombre, por100g: a.por100g, porciones: a.porciones,
    origen: [a.origen === 'off' ? t('comida.fuente.productoOff') : t('comida.fuente.etiqueta'), a.marca].filter(Boolean).join(' · '),
  };
}

const NUTRIENTES: readonly Nutriente[] = ['kcal', 'proteina', 'carbohidratos', 'grasas', 'fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'];

/**
 * Lo que sí trajo un producto de Open Food Facts al que le falta algo, por porción (o por 100 g, si no
 * dice la porción): así, al cargarlo a mano, se completa solo lo que falta.
 */
function loQueVinoDeOff(p: Producto): Pick<DatosDeEtiqueta, 'porcion' | 'porPorcion'> {
  const porcion = p.porcion ?? { texto: '100 g', gramos: 100 };
  const porPorcion: Leidos = {};
  for (const k of NUTRIENTES) {
    const v = p.por100g[k];
    if (v != null) porPorcion[k] = (v * porcion.gramos) / 100;
  }
  return { porcion, porPorcion };
}

/** Lo de `items` que todavía no está en la comida que se arma (cada cosa cuenta una vez): así un segundo toque no lo vuelve a sumar. */
function sinLoQueYaEsta(items: readonly Item[], canasta: readonly Item[]): Item[] {
  const libres = [...canasta];
  // Con el nombre y las kcal: dos cargas rápidas no tienen ref ni cantidad, y no son la misma.
  const igual = (c: Item, i: Item) => c.fuente === i.fuente && c.ref === i.ref && c.nombre === i.nombre && c.valores.kcal === i.valores.kcal && JSON.stringify(c.cantidad) === JSON.stringify(i.cantidad);
  return items.filter((i) => {
    const k = libres.findIndex((c) => igual(c, i));
    if (k < 0) return true;
    libres.splice(k, 1);
    return false;
  });
}

/** Saca de la comida que se arma lo de `puestos` que siga ahí, y lo olvida. */
function sacarDeLaCanasta(a: ReturnType<typeof elAlmacen>, puestos: Set<Item>) {
  if (!puestos.size) return;
  const canasta = a.estado().canasta;
  for (let k = canasta.length - 1; k >= 0; k--) if (puestos.has(canasta[k])) a.quitarDeCanasta(k);
  puestos.clear();
}

/** La bandeja de la comida que se arma sube apenas al aparecer y baja al irse; con Reducir movimiento, solo se funde. */
const ENTRA_BANDEJA = FadeInDown.duration(260);
const SALE_BANDEJA = FadeOutDown.duration(180);

/** Lo que dura la salida más larga (SALE_HOJA), con un margen. */
const SALIDA_MS = 280;

/** El día de la hoja, arriba, aparece con un fundido suave (como en la galería): un fundido no es movimiento. */
const ENTRA_DIA = FadeIn.duration(300).reduceMotion(ReduceMotion.Never);

export function HojaRegistro() {
  const pedido = useRegistro();
  // Cerrada, la hoja sigue armada lo que dura su salida, con el contenido ya sacado: así el velo y la
  // hoja se van con su animación. Desarmarla de una sola vez hacía que Reanimated, en la web, animara
  // lo que React ya había sacado (el error de removeChild y el velo que quedaba).
  const [saliendo, setSaliendo] = useState<ReturnType<typeof useRegistro>>(null);
  const anterior = useRef(pedido);
  useEffect(() => {
    const antes = anterior.current;
    anterior.current = pedido;
    if (pedido || !antes) return;
    setSaliendo(antes);
    const espera = setTimeout(() => setSaliendo(null), SALIDA_MS);
    return () => clearTimeout(espera);
  }, [pedido]);
  const visto = pedido ?? saliendo;
  // El contenedor no se va nunca. Si se iba con una salida todavía en curso (con el teléfono ocupado, la
  // del panel dura más que SALIDA_MS), Reanimated, en la web, volvía a colgar lo que se estaba yendo de
  // Secciones y, al terminar, lo sacaba dos veces: el error de removeChild (reattachElementToAncestor).
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {visto && <Hoja key={visto.vez} pedido={visto} abierta={pedido !== null} />}
    </View>
  );
}

function Hoja({ pedido, abierta }: { pedido: Pedido; abierta: boolean }) {
  const e = useEstado();
  const a = elAlmacen();
  const insets = useSafeAreaInsets();
  const { alto: teclado, animado: tecladoAnimado } = useTeclado();
  const sistema = sistemaDe(e);
  // Sin los números (Perfil › Los números): sin calorías ni gramos de los macros; quedan los nombres y las porciones.
  const numeros = useNumeros();
  // Lo dicho «anoche» que después se busca a mano sigue yendo a ayer.
  const [diaDicho, setDiaDicho] = useState<ClaveDia | null>(null);
  const dia = diaDicho ?? pedido.dia ?? e.hoy;
  const [comida, setComida] = useState<Comida>(pedido.comida ?? comidaDeAhora());
  const [texto, setTexto] = useState('');
  const [hallado, setHallado] = useState<{ texto: string; lista: Resultado[] } | null>(null);
  // Lo que quedó sin encontrar de lo dicho: se busca después, de a uno, a medida que se suma lo buscado.
  const [porBuscar, setPorBuscar] = useState<string[]>([]);
  // Corregir un registro abre su ventana; si es una carga rápida, su panel.
  const [panel, setPanel] = useState<Panel | 'guardarComo' | null>(() => {
    if (pedido.editar && a.estado().registros.get(pedido.editar)?.fuente === 'rapida') return 'rapida';
    return pedido.panel === 'codigo' || pedido.panel === 'etiqueta' ? null : (pedido.panel ?? null);
  });
  const [ventana, setVentana] = useState<VentanaAbierta | null>(() => ventanaParaCorregir(a.estado(), pedido.editar));
  const [aviso, setAviso] = useState<Aviso | null>(null);
  // Decir la comida: con el micrófono (escucha apenas abre) o con lo que se escribió en el buscador.
  const [decirCon, setDecirCon] = useState<{ escuchar: boolean; texto?: string }>({ escuchar: pedido.panel === 'decir' });
  const decir = (con: { escuchar: boolean; texto?: string }) => {
    Keyboard.dismiss();
    setDecirCon(con);
    setPanel('decir');
  };
  // Lo último que se sumó a la comida que se arma: la bandeja lo dice un momento, en lugar de un aviso.
  const [recienSumado, setRecienSumado] = useState<{ texto: string; vez: number } | null>(null);
  useEffect(() => {
    if (!recienSumado) return;
    const espera = setTimeout(() => setRecienSumado(null), 1800);
    return () => clearTimeout(espera);
  }, [recienSumado]);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  // De dónde se abrió «Pegar una receta»: «‹» vuelve ahí.
  const [pegarDesde, setPegarDesde] = useState<'receta' | 'guardadas'>('guardadas');
  const [crear, setCrear] = useState<DatosDeEtiqueta | null>(null);
  const [escaner, setEscaner] = useState<EstadoDelEscaner | null>(pedido.panel === 'codigo' || pedido.panel === 'etiqueta' ? { modo: pedido.panel, mensaje: null, ocupado: false } : null);
  const soloEditar = !!pedido.editar;
  // Abierta para otro día, lo dice arriba, chico: «Ayer», «Mañana» o «Vie 16». Corrigiendo algo de la línea del
  // día, no (como en la galería): se abrió desde ese día.
  const delDiaArriba = soloEditar ? null : etiquetaDelDia(dia, e.hoy);
  const avisarAca =(textoDelAviso: string, deshacer?: () => void) => setAviso({ texto: textoDelAviso, deshacer, vez: otraVez() });

  // Copiar de ayer: lo de ayer, a la comida que se arma, y directo a la revisión. Lo puesto así (cada
  // cosa, aunque se mueva o se corrija) sale si la hoja se cierra sin agregarlo, por donde se cierre: la
  // cruz, el velo, bajarla o un aviso que la cierra desde afuera.
  const copia = useRef(new Set<Item>());
  useEffect(() => {
    if (!pedido.items?.length) return;
    const puestos = new Set(pedido.items);
    copia.current = puestos;
    for (const item of pedido.items) a.ponerEnCanasta(item);
    // Si otro pedido la reemplaza, la hoja se desarma sin pasar por cerrada.
    return () => sacarDeLaCanasta(a, puestos);
  }, [a, pedido.items]);
  useEffect(() => {
    if (!abierta) sacarDeLaCanasta(a, copia.current);
  }, [abierta, a]);
  /** Lo quitado vuelve a su lugar. El almacén solo suma al final y cambia de a uno: se corre lo de después. */
  const devolverALaCanasta = (i: number, item: Item) => {
    const antes = a.estado().canasta;
    // Ya volvió por otro lado (el atajo de ayer o el de siempre lo suman otra vez): no va dos veces.
    if (antes.includes(item)) return;
    const lugar = Math.min(i, antes.length);
    if (lugar === antes.length) return a.ponerEnCanasta(item);
    a.ponerEnCanasta(antes[antes.length - 1]);
    for (let k = antes.length - 1; k > lugar; k--) a.cambiarEnCanasta(k, antes[k - 1]);
    a.cambiarEnCanasta(lugar, item);
  };
  const quitarDeLaCanasta = (i: number) => {
    const item = a.estado().canasta[i];
    if (!item) return;
    a.quitarDeCanasta(i);
    if (a.estado().canasta.length === 0) setPanel(null);
    avisarAca(t('comida.quitado', { alimento: item.nombre }), () => devolverALaCanasta(i, item));
  };

  // La búsqueda: mientras se escribe, con un respiro para no buscar letra por letra.
  const premio = useMemo(() => premios(e.registros.values(), e.hoy), [e.registros, e.hoy]);
  useEffect(() => {
    const q = texto.trim();
    if (!q) return;
    let vigente = true;
    const espera = setTimeout(() => {
      baseDeAlimentos.buscar(q, { ...opcionesDeIdioma(), limite: 30, limiteDeMarca: 200, premio: (id) => premio.get(id) ?? 0 })
        .then((lista) => vigente && setHallado({ texto: q, lista }))
        .catch(() => vigente && setHallado({ texto: q, lista: [] }));
    }, 90);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto, premio]);
  /** Lo escrito en el buscador. Al borrarlo, o al pasar a buscar otra cosa, lo encontrado antes no asoma mientras se busca lo nuevo. */
  const escribir = (x: string, otraCosa = false) => {
    setTexto(x);
    if (otraCosa || !x.trim()) setHallado(null);
  };

  // Lo copiado de ayer sin agregar sale cuando la hoja pasa a cerrada (ver arriba).
  const cerrar = () => {
    Keyboard.dismiss();
    cerrarRegistro();
  };
  // Lo escrito sin guardar: lo de un panel (crear un alimento, la etiqueta, la carga rápida, decir, pegar
  // o cambiar una guardada; cada uno avisa) y la receta a medio armar, que vive acá.
  const [escritoEnPanel, setEscritoEnPanel] = useState(false);
  const recetaAMedias = !!borrador && (!!borrador.nombre.trim() || borrador.items.length > 0 || !!borrador.pesoFinal.trim());
  const sinGuardar = escritoEnPanel || recetaAMedias;
  // Bajarla con el dedo, tocar afuera o la cruz la cierran; con algo escrito sin guardar, antes pregunta
  // («Descartar» o «Seguir editando»). Un aviso o un widget que la cierran desde afuera, no.
  const intentarCerrar = () => (sinGuardar ? confirmarDescartar(cerrar) : cerrar());
  const reducido = useReducedMotion();
  const deslizar = useBajarParaCerrar({ alCerrar: cerrar, sinGuardar });
  const cancelarLaEleccion = () => {
    setEligiendo(false);
    setPanel('receta');
  };

  // Lo que se abre encima (un panel, la ventana, el escáner) se lleva el teclado del buscador: si no,
  // lo que se escribía iba a parar al buscador tapado.
  const buscador = useRef<TextInputInstance>(null);
  const encima = !!panel || !!ventana || !!escaner;
  useEffect(() => {
    if (encima) buscador.current?.blur();
  }, [encima]);
  // Eligiendo el ingrediente de una receta, lo que sigue es buscarlo: el buscador espera con el teclado.
  useEffect(() => {
    if (!eligiendo || panel) return;
    const espera = setTimeout(() => buscador.current?.focus(), 280);
    return () => clearTimeout(espera);
  }, [eligiendo, panel]);

  // Lo que no encontró nada, sin decir de quién (src/almacen/buzon.ts): así se sabe qué le falta a la
  // base. Cuenta cuando se dejó de escribir, no letra por letra.
  useEffect(() => {
    if (!e.mandarBusquedas || !hallado || hallado.lista.length || hallado.texto !== texto.trim()) return;
    const buscado = textoDeBusqueda(hallado.texto);
    if (!buscado) return;
    const espera = setTimeout(() => {
      buzon().echar({ tipo: 'busqueda', texto: buscado, idioma: idioma(), region: region() ?? '', dia: e.hoy }).catch(() => {});
    }, 1500);
    return () => clearTimeout(espera);
  }, [hallado, texto, e.hoy, e.mandarBusquedas]);

  // ------------------------------------------------------------ lo que queda en el día
  const meta = metaDelDia(e, dia);
  // Las referencias de las vitaminas y los minerales: para la edad y el sexo del perfil; con el último peso, el tope
  // de cafeína antes de los 18 (3 mg por kilo, EFSA 2015).
  const persona: ParaQuien = { sexo: e.perfil?.sexo ?? 'f', edad: e.perfil ? edadDe(e.perfil, e.hoy) : 30, pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null };
  const restar = (x: Macros, y: Macros): Macros => ({ kcal: x.kcal - y.kcal, proteina: x.proteina - y.proteina, carbohidratos: x.carbohidratos - y.carbohidratos, grasas: x.grasas - y.grasas });
  const restante = (kcal: number, sin = 0) => {
    if (!meta) return null;
    const antes = totalDe(e.registros, dia, e.hoy).kcal + sumarValores(e.canasta.map((i) => i.valores)).kcal - sin;
    return meta.kcal - antes - kcal;
  };
  // Cómo deja el día: lo que ya había (con lo que se arma, sin lo que se cambia) y la meta.
  // Lo planificado de hoy o de antes no está en el total del día: no se le resta.
  const enElTotal = (r: Registro) => !r.planificado || r.dia > e.hoy;
  const diaDe = (modo: ModoDeVentana): { antes: Macros; meta: Macros } | null => {
    if (!meta || modo.tipo === 'ingrediente') return null;
    if (modo.tipo === 'registro') {
      const r = e.registros.get(modo.id);
      if (!r) return null;
      const delDia = totalDe(e.registros, r.dia, e.hoy);
      return { antes: enElTotal(r) ? restar(delDia, r.valores) : delDia, meta: metaDelDia(e, r.dia) ?? meta };
    }
    const conLoQueSeArma = sumarValores([totalDe(e.registros, dia, e.hoy), ...e.canasta.map((i) => i.valores)]);
    return { antes: modo.tipo === 'canasta' && e.canasta[modo.indice] ? restar(conLoQueSeArma, e.canasta[modo.indice].valores) : conLoQueSeArma, meta };
  };
  const restanteDe = (modo: ModoDeVentana) => (kcal: number) => {
    if (modo.tipo === 'canasta') return restante(kcal, e.canasta[modo.indice]?.valores.kcal ?? 0);
    if (modo.tipo === 'registro') {
      const r = e.registros.get(modo.id);
      // Lo de otro día se cuenta contra ese día, sin lo que se arma ahora.
      return r && meta ? meta.kcal - (totalDe(e.registros, r.dia, e.hoy).kcal - (enElTotal(r) ? r.valores.kcal : 0)) - kcal : null;
    }
    if (modo.tipo === 'ingrediente') return null;
    return restante(kcal);
  };

  // ------------------------------------------------------------ abrir la ventana
  const modoNuevo: ModoDeVentana = eligiendo ? { tipo: 'ingrediente' } : { tipo: 'sumar' };
  // La ventana sube desde abajo: con el teclado arriba, quedaría tapada.
  const abrirVentana = (v: VentanaAbierta) => {
    Keyboard.dismiss();
    setVentana(v);
  };
  const abrirItem = (item: Item) => {
    Keyboard.dismiss();
    if (item.fuente === 'propio' && item.ref) {
      const propio = e.propios.get(item.ref);
      if (propio) return setVentana({ alimento: alimentoDePropio(propio), inicial: item.cantidad ?? undefined, modo: modoNuevo });
    }
    if (item.fuente === 'receta' && item.ref) {
      const receta = e.recetas.get(item.ref);
      if (receta) return setVentana({ alimento: alimentoDeReceta(receta), inicial: item.cantidad ?? undefined, modo: modoNuevo });
    }
    const por100g = por100gDe(item);
    if (!por100g || !item.ref) return;
    setVentana({ alimento: { fuente: item.fuente, ref: item.ref, nombre: item.nombre, por100g, porciones: [], origen: t('comida.fuente.usda') }, inicial: item.cantidad ?? undefined, modo: modoNuevo });
  };
  const abrirResultado = (r: Resultado) => {
    Keyboard.dismiss();
    const { id, nombre, porcion, coincide: _c, curado: _cu, verificado: _v, marca: _m, ...valores } = r;
    setVentana({
      alimento: { fuente: 'base', ref: String(id), nombre, por100g: valores, porciones: porcion ? conUnaUnidad([porcion], idioma()) : [], origen: t('comida.fuente.usda') },
      inicial: ultimaCantidad(e.registros.values(), 'base', String(id)),
      modo: modoNuevo,
    });
  };
  const abrirDetalle = (d: Detalle) => {
    setVentana({
      alimento: { fuente: 'base', ref: String(d.id), nombre: d.nombre, por100g: d.por100g, porciones: d.porciones, origen: origenDe(d) },
      inicial: ultimaCantidad(e.registros.values(), 'base', String(d.id)),
      modo: modoNuevo,
    });
  };

  // ------------------------------------------------------------ la comida que se arma
  /** Suma a la comida que se arma, con la vibración liviana de lo que suma; `vibrar` en false si ya vibró quien lo mandó. */
  const sumar = (item: Item, vibrar = true) => {
    a.ponerEnCanasta(item);
    if (vibrar) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRecienSumado({ texto: [item.nombre, cantidadDeTexto(item.cantidad, sistema)].filter(Boolean).join(' · '), vez: otraVez() });
  };
  /** Varias cosas de una vez (la comida de ayer, la de siempre, una guardada): la bandeja dice qué. */
  const sumarVarias = (items: readonly Item[], que: string) => {
    for (const item of items) a.ponerEnCanasta(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRecienSumado({ texto: que, vez: otraVez() });
  };
  const agregar = () => {
    const nuevos = a.agregarCanasta({ comida, dia, momento: momentoDe(e, dia, comida) });
    if (!nuevos.length) return;
    copia.current.clear();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const que = nuevos.length === 1 ? [nuevos[0].nombre, cantidadDeTexto(nuevos[0].cantidad, sistema)].filter(Boolean).join(' · ') : `${t(`comida.comidas.${comida}`)} · ${resumenDeCanasta(nuevos, numeros)}`;
    avisar(que, () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
    cerrar();
  };

  const alListo = (item: Item) => {
    if (!ventana) return;
    const modo = ventana.modo;
    if (modo.tipo === 'sumar') {
      // La ventana ya vibró con «Sumar». Lo sumado desde Guardadas se ve en la bandeja, y si quedó algo
      // de lo dicho por buscar, el buscador pasa a eso.
      sumar(item, false);
      setPanel(null);
      if (porBuscar.length) {
        escribir(porBuscar[0], true);
        setPorBuscar(porBuscar.slice(1));
      }
    } else if (modo.tipo === 'canasta') {
      // Corregido, sigue siendo lo mismo: con su lugar en la lista y, si vino de ayer, saliendo si no se agrega.
      const antes = a.estado().canasta[modo.indice];
      if (antes) {
        heredarClave(antes, item);
        if (copia.current.delete(antes)) copia.current.add(item);
      }
      a.cambiarEnCanasta(modo.indice, item);
    } else if (modo.tipo === 'ingrediente' && borrador) {
      setBorrador({ ...borrador, items: [...borrador.items, item] });
      setEligiendo(false);
      escribir('');
      setPanel('receta');
    } else if (modo.tipo === 'registro') {
      a.cambiarRegistro(modo.id, { fuente: item.fuente, ref: item.ref, nombre: item.nombre, cantidad: item.cantidad, valores: item.valores, estimado: !!item.estimado });
      avisar(t('comida.guardado'));
    }
    setVentana(null);
    if (soloEditar) cerrar();
  };

  // ------------------------------------------------------------ el código de barras y la etiqueta
  // Cada búsqueda de un código lleva su número: cerrar el escáner o cambiar de modo deja sin efecto la que estaba en camino.
  const escaneo = useRef(0);
  const dejarElEscaneo = () => {
    escaneo.current++;
  };
  /** No se encontró o no hay red: vibra como un aviso y VoiceOver lo dice (el mensaje cambia sin que se vea). */
  const noSeEncontro = (mensaje: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    anunciar(mensaje);
  };
  const alCodigo = async (codigo: string) => {
    const este = ++escaneo.current;
    const sigue = () => escaneo.current === este;
    setEscaner((s) => s && { ...s, ocupado: true, mensaje: t('comida.escaner.buscando', { codigo }) });
    const formas = formasDelCodigo(codigo);
    const propio = vigentes(e.propios.values()).find((x) => x.codigo && formas.includes(x.codigo));
    if (propio) {
      setEscaner(null);
      setVentana({ alimento: alimentoDePropio(propio), inicial: ultimaCantidad(e.registros.values(), 'propio', propio.id), modo: modoNuevo });
      return;
    }
    const id = await baseDeAlimentos.porCodigo(codigo).catch(() => null);
    const detalle = id !== null ? await baseDeAlimentos.detalle(id, opcionesDeIdioma()).catch(() => null) : null;
    if (!sigue()) return;
    if (detalle) {
      setEscaner(null);
      abrirDetalle(detalle);
      return;
    }
    try {
      const version = Constants.expoConfig?.version ?? '1.0.0';
      const producto = await buscarEnOff(codigo, { idioma: idioma(), version, contacto: SITIO });
      if (!sigue()) return;
      if (producto?.verificado) {
        const p = producto.por100g;
        const nuevo = a.guardarPropio({
          nombre: producto.nombre, marca: producto.marca, codigo: formas[0], origen: 'off',
          por100g: { ...p, kcal: p.kcal ?? 0, proteina: p.proteina ?? 0, carbohidratos: p.carbohidratos ?? 0, grasas: p.grasas ?? 0 },
          porciones: producto.porcion ? [{ nombre: producto.porcion.texto, gramos: producto.porcion.gramos }] : [],
        });
        setEscaner(null);
        setVentana({ alimento: alimentoDePropio(nuevo), modo: modoNuevo });
        return;
      }
      // Lo que falta o no cierra se lee de la etiqueta: así no se guarda un dato malo.
      const mensaje = t(!producto ? 'comida.escaner.noEsta' : producto.completo ? 'comida.escaner.noCierra' : 'comida.escaner.incompleto');
      setEscaner({ modo: 'etiqueta', ocupado: false, mensaje, codigo, parcial: producto });
      noSeEncontro(mensaje);
    } catch {
      if (!sigue()) return;
      setEscaner({ modo: 'etiqueta', ocupado: false, mensaje: t('comida.escaner.sinConexion'), codigo });
      noSeEncontro(t('comida.escaner.sinConexion'));
    }
  };
  const alEtiqueta = (lineas: string[]) => {
    const leida = leerEtiqueta(lineas);
    setCrear({ codigo: escaner?.codigo, nombre: escaner?.parcial?.nombre, marca: escaner?.parcial?.marca, leida });
    setEscaner(null);
    setPanel('crear');
  };
  const aMano = () => {
    const parcial = escaner?.parcial;
    // Lo que sí vino de Open Food Facts (le falta algo, pero nada es imposible) ya llena los campos.
    const vino = parcial && !parcial.completo && !parcial.avisos.length ? loQueVinoDeOff(parcial) : {};
    setCrear({ codigo: escaner?.codigo, nombre: parcial?.nombre, marca: parcial?.marca, ...vino });
    setEscaner(null);
    setPanel('crear');
  };

  // ------------------------------------------------------------ lo que se ve sin escribir
  const q = texto.trim();
  const ayer = sumarDias(dia, -1);
  // Lo planificado de ayer que no se confirmó no se comió: no se copia, como en Comida.
  const deAyer = useMemo(
    () => delDia(e.registros.values(), ayer)
      .filter((r) => r.comida === comida && !r.planificado)
      .map((r): Item => ({ fuente: r.fuente, ref: r.ref, nombre: r.nombre, cantidad: r.cantidad, valores: r.valores, ...(r.estimado ? { estimado: true as const } : {}) })),
    [e.registros, ayer, comida],
  );
  // Un atajo no vuelve a sumar lo que ya está en la comida que se arma: sin nada nuevo que sumar, se va.
  const deAyerQueFalta = useMemo(() => sinLoQueYaEsta(deAyer, e.canasta), [deAyer, e.canasta]);
  // Lo último anotado de cada alimento, en una sola pasada: lo usan las filas del buscador (letra por letra) y los favoritos.
  // Con lo mismo que cuenta ultimaCantidad: sin lo planificado ni la carga rápida.
  const ultimos = useMemo(() => {
    const m = new Map<string, Registro>();
    for (const r of vigentes(e.registros.values())) {
      if (r.planificado || r.fuente === 'rapida') continue;
      const clave = claveDeAlimento(r.fuente, r.ref);
      const antes = m.get(clave);
      if (!antes || r.momento > antes.momento) m.set(clave, r);
    }
    return m;
  }, [e.registros]);
  // Los favoritos de la base que todavía no se anotaron: sus datos se leen de la base para mostrarlos con su porción.
  const favoritosSinAnotar = useMemo(
    () => [...e.favoritos.values()].filter((f) => f.favorito && f.fuente === 'base' && !ultimos.has(claveDeAlimento(f.fuente, f.ref))).map((f) => f.ref),
    [e.favoritos, ultimos],
  );
  const [deLaBase, setDeLaBase] = useState<ReadonlyMap<string, Detalle | null>>(() => new Map());
  useEffect(() => {
    const faltan = favoritosSinAnotar.filter((ref) => !deLaBase.has(ref));
    if (!faltan.length) return;
    let vigente = true;
    Promise.all(faltan.map((ref) => baseDeAlimentos.detalle(Number(ref), opcionesDeIdioma()).catch(() => null))).then((detalles) => {
      if (!vigente) return;
      // Lo que no está en la base queda como null: así no se vuelve a pedir.
      setDeLaBase((antes) => new Map([...antes, ...faltan.map((ref, i) => [ref, detalles[i]] as const)]));
    }).catch(() => {});
    return () => {
      vigente = false;
    };
  }, [favoritosSinAnotar, deLaBase]);
  // Qué comer antes o después de entrenar, si esta comida es la que toca hoy.
  const lineaDeEntreno = dia === e.hoy && !soloEditar ? lineasDeHoy(e).get(comida) : undefined;
  // Tu comida de siempre, entera de un toque: la misma combinación dos veces en dos semanas. Armando otra
  // cosa, se suma solo lo que todavía no está.
  const siempre = useMemo(() => deSiempre(e.registros.values(), comida, dia), [e.registros, comida, dia]);
  const siempreQueFalta = useMemo(() => (siempre ? sinLoQueYaEsta(siempre, e.canasta) : []), [siempre, e.canasta]);
  const secciones = useMemo(() => {
    const vistos = new Set<string>();
    // Solo lo que se muestra cuenta como visto: un favorito entre los recientes que no entraron sigue apareciendo.
    const seccion = (titulo: string, lista: Item[]) => {
      const filas: Item[] = [];
      for (const i of lista) {
        if (filas.length === 4) break;
        const clave = claveDeAlimento(i.fuente, i.ref);
        if (vistos.has(clave)) continue;
        vistos.add(clave);
        filas.push(i);
      }
      return filas.length ? [{ titulo, filas }] : [];
    };
    const favoritos: Item[] = [];
    for (const f of e.favoritos.values()) {
      if (!f.favorito) continue;
      const ultimo = ultimos.get(claveDeAlimento(f.fuente, f.ref));
      if (ultimo) {
        favoritos.push(ultimo);
        continue;
      }
      // Sin anotarlo nunca: con su primera porción, o 100 g.
      const propio = f.fuente === 'propio' ? e.propios.get(f.ref) : undefined;
      const receta = f.fuente === 'receta' ? e.recetas.get(f.ref) : undefined;
      const detalle = f.fuente === 'base' ? deLaBase.get(f.ref) : undefined;
      const alimento = propio && !propio.borrado ? alimentoDePropio(propio) : receta && !receta.borrado ? alimentoDeReceta(receta) : detalle ? { nombre: detalle.nombre, por100g: detalle.por100g, porciones: detalle.porciones } : null;
      if (!alimento) continue;
      const porcion = alimento.porciones[0];
      favoritos.push(itemDeAlimento(f.fuente, f.ref, alimento.nombre, alimento.por100g, porcion ? { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: 1 } : { gramos: 100 }));
    }
    return [
      ...seccion(t(`comida.sueles.${comida}`), sueles(e.registros.values(), comida, e.hoy)),
      ...seccion(t('comida.recientes'), recientes(e.registros.values())),
      ...seccion(t('comida.favoritos'), favoritos),
    ];
  }, [e.registros, e.favoritos, e.propios, e.recetas, e.hoy, comida, ultimos, deLaBase]);

  // Lo propio y las recetas propias también se encuentran, arriba: si lo buscas, es porque lo cargaste.
  const propiosHallados = useMemo(() => {
    if (!q) return [];
    const palabras = normalizar(q).split(' ').filter(Boolean);
    const coincide = (nombre: string) => {
      const n = normalizar(nombre).split(' ');
      return palabras.every((p) => n.some((w) => w.startsWith(p)));
    };
    return [
      ...vigentes(e.propios.values()).filter((x) => coincide(`${x.nombre} ${x.marca ?? ''}`)).map((x) => ({ tipo: 'propio' as const, x })),
      ...vigentes(e.recetas.values()).filter((x) => x.tipo === 'receta' && coincide(x.nombre)).map((x) => ({ tipo: 'receta' as const, x })),
    ].slice(0, 6);
  }, [q, e.propios, e.recetas]);

  const lista = hallado && q ? hallado.lista : [];
  // Corregir una carga rápida: su panel abre con lo que tenía, y se puede quitar.
  const registroEditado = pedido.editar ? e.registros.get(pedido.editar) : undefined;
  const rapidaEditada = registroEditado?.fuente === 'rapida' ? registroEditado : undefined;
  const enCanasta = e.canasta.length > 0 && !soloEditar && !eligiendo;
  const conBandeja = enCanasta && !panel;
  // Debajo de la lista queda siempre el borde de abajo del teléfono o, con el teclado, el teclado: sube con
  // él, con su misma curva. Lo que llega hasta el borde (la bandeja, el pie de un panel) baja por detrás de
  // este lugar, así nada lo cuenta dos veces y la lista no cambia de alto cuando aparece la bandeja.
  const borde = insets.bottom;
  const estiloAbajo = useAnimatedStyle(() => ({ height: Math.max(borde, tecladoAnimado.get()) }));
  // Lo que mide la bandeja sin el borde: lo que la lista deja libre al final para que lo último no quede debajo.
  const [altoBandeja, setAltoBandeja] = useState(64);
  // Lo que mide el pie del panel abierto, con el borde de abajo del teléfono (que el panel deja por detrás).
  const [altoDelPie, setAltoDelPie] = useState<number | null>(null);
  // El aviso va arriba de lo de abajo: de los botones del pie de un panel (como en la galería; con dos
  // botones, más arriba), de la bandeja o del borde.
  const avisoAbajo = Math.max(teclado, insets.bottom) + (panel ? (altoDelPie !== null ? altoDelPie - insets.bottom + 22 : 92) : conBandeja ? altoBandeja + 12 : 12);

  /** «2 rebanadas · 140 kcal»; sin los números, la cantidad. */
  const detalleDe = (cantidad: Cantidad, kcal: number) => [cantidadDeTexto(cantidad, sistema), numeros ? `${numero(Math.round(kcal))} kcal` : ''].filter(Boolean).join(' · ');
  const filaDeItem = (item: Item, i: number) => (
    <Fila key={`${claveDeAlimento(item.fuente, item.ref)}-${i}`} nombre={item.nombre} detalle={detalleDe(item.cantidad, item.valores.kcal)} alAbrir={() => abrirItem(item)} />
  );
  // Lo guardado se vuelve a guardar igual, con su id: al cambiarlo y al deshacer un borrado.
  const guardarDeNuevo = (g: Guardada) => {
    if (g.tipo === 'propio') {
      const { id, nombre, marca, codigo, por100g, porciones, origen } = g.x;
      a.guardarPropio({ id, nombre, marca, codigo, por100g, porciones, ...(origen ? { origen } : {}) });
    } else {
      const { id, tipo, nombre, items, porciones, pesoFinal } = g.x;
      a.guardarReceta({ id, tipo, nombre, items, porciones, pesoFinal });
    }
  };

  return (
    <>
      {/* Al cerrar, la hoja sigue armada sin su contenido lo que dura la salida (ver HojaRegistro). */}
      {abierta && (<>
      {/* El fondo se aclara mientras la hoja baja con el dedo; su fundido de salida va por fuera, así no vuelve a oscurecerse. */}
      <Animated.View entering={ENTRA_VELO} exiting={SALE_VELO} style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, estilos.fondo, deslizar.velo]} pointerEvents="none" />
        {/* Con algo escrito sin guardar, tocar afuera pregunta antes de cerrarla. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={intentarCerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
      </Animated.View>
      <Animated.View
        entering={reducido ? ENTRA_FUNDIDO : ENTRA_HOJA}
        exiting={reducido ? SALE_FUNDIDO : SALE_HOJA}
        style={[estilos.hoja, { top: insets.top + 12 }, deslizar.estilo]}
        onLayout={deslizar.medir}
        // El escáner se dibuja al lado de la hoja, no adentro: encima de ella, VoiceOver va al escáner.
        accessibilityViewIsModal={!escaner}
        accessibilityElementsHidden={!!escaner}
        importantForAccessibility={escaner ? 'no-hide-descendants' : 'auto'}
        onAccessibilityEscape={panel || ventana || escaner ? undefined : eligiendo ? cancelarLaEleccion : intentarCerrar}
      >
        {/* Lo de adentro se va con la hoja: sus propias salidas (las filas de «decir») no corren. */}
        <LayoutAnimationConfig skipExiting>
        <CabezaQueBaja arrastre={deslizar} style={estilos.arriba}>
          {delDiaArriba && (
            <Animated.Text
              key={delDiaArriba}
              entering={ENTRA_DIA}
              exiting={SALE_FUNDIDO}
              style={estilos.dia}
              numberOfLines={1}
              maxFontSizeMultiplier={1.4}
              accessibilityRole="header"
              // En mayúsculas solo a la vista: VoiceOver lo dice como palabra.
              accessibilityLabel={delDiaArriba}
            >
              {delDiaArriba}
            </Animated.Text>
          )}
          <View style={estilos.asa} />
          {!panel && (
            <Pressable onPress={intentarCerrar} style={({ pressed }) => [estilos.cerrar, pressed && estilos.apretado]} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={margenDeToque(32)}>
              <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
            </Pressable>
          )}
        </CabezaQueBaja>

        {/* Los paneles, y la nota de «Reportar un error» en la ventana, avisan si hay algo escrito sin guardar. */}
        <SinGuardar.Provider value={setEscritoEnPanel}>
        <MedirPie.Provider value={setAltoDelPie}>
        <View style={estilos.paneles}>
          <CabezaQueBaja arrastre={deslizar}>
          {eligiendo && borrador && (
            <View style={estilos.eligiendo}>
              <Text style={estilos.eligiendoTexto} numberOfLines={1}>{t('comida.receta.eligeIngrediente', { receta: borrador.nombre.trim() || t('comida.receta.nueva') })}</Text>
              <Boton texto={t('comun.cancelar')} tipo="contorno" alTocar={cancelarLaEleccion} />
            </View>
          )}
          {/* Con el teclado arriba, la comida se cambia al primer toque. */}
          {!eligiendo && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsLugar} contentContainerStyle={estilos.chips} keyboardShouldPersistTaps="handled" scrollsToTop={false}>
              {COMIDAS.map((c) => <Pastilla key={c} texto={t(`comida.comidas.${c}`)} elegida={c === comida} alTocar={() => setComida(c)} estilo={estilos.chip} />)}
            </ScrollView>
          )}
          {!eligiendo && lineaDeEntreno && (
            <View key={comida} style={estilos.entreno}>
              <LineaDeEntreno linea={lineaDeEntreno} />
            </View>
          )}
          <View style={estilos.busca}>
            <Icono nombre="magnifyingglass" tam={17} color="rgba(239, 230, 207, 0.5)" />
            <TextInput
              ref={buscador}
              value={texto}
              onChangeText={(x) => escribir(x)}
              placeholder={t('comida.buscar')}
              placeholderTextColor="rgba(239, 230, 207, 0.42)"
              autoFocus={!soloEditar && !pedido.panel && !pedido.items?.length}
              autoCorrect={false}
              spellCheck={false}
              autoCapitalize="none"
              returnKeyType="search"
              keyboardAppearance="dark"
              clearButtonMode="while-editing"
              maxLength={100}
              selectionColor={colores.oro}
              style={estilos.entrada}
              accessibilityLabel={t('comida.buscar')}
            />
            {/* Eligiendo el ingrediente de una receta, decir la comida no va: lo dicho se anotaría como comido. */}
            <LayoutAnimationConfig skipEntering>
              {!eligiendo && (
                <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO}>
                  <Pressable onPress={() => decir({ escuchar: true })} style={({ pressed }) => [estilos.icono, pressed && estilos.apretado]} accessibilityRole="button" accessibilityLabel={t('comida.decir.titulo')} hitSlop={margenDeToque(38)}>
                    <Icono nombre="mic" tam={20} />
                  </Pressable>
                </Animated.View>
              )}
            </LayoutAnimationConfig>
            <Pressable
              onPress={() => { Keyboard.dismiss(); setEscaner({ modo: 'codigo', mensaje: null, ocupado: false }); }}
              style={({ pressed }) => [estilos.icono, pressed && estilos.apretado]}
              accessibilityRole="button"
              accessibilityLabel={t('comida.escanear')}
              hitSlop={margenDeToque(38)}
            >
              <Icono nombre="barcode.viewfinder" tam={21} />
            </Pressable>
            <Pressable
              onPress={() => { Keyboard.dismiss(); setEscaner({ modo: 'etiqueta', mensaje: null, ocupado: false }); }}
              style={({ pressed }) => [estilos.icono, pressed && estilos.apretado]}
              accessibilityRole="button"
              accessibilityLabel={t('comida.etiqueta')}
              hitSlop={margenDeToque(38)}
            >
              <Icono nombre="doc.text.viewfinder" tam={21} />
            </Pressable>
          </View>
          {!q && !eligiendo && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.atajosLugar} contentContainerStyle={estilos.atajos} keyboardShouldPersistTaps="handled" scrollsToTop={false}>
              {/* Lo que ya está cuando aparecen los atajos viene con ellos; la comida de ayer, cuando ya no queda nada por sumar, se va.
                  En la hoja de otro día no va: «Cena de ayer» copiaría la del día anterior a ese, con un nombre que confunde. */}
              <LayoutAnimationConfig skipEntering>
                {dia === e.hoy && deAyerQueFalta.length > 0 && (
                  <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO}>
                    <Boton texto={t(`comida.deAyer.${comida}`)} icono="doc.on.doc" alTocar={() => sumarVarias(deAyerQueFalta, t(`comida.deAyer.${comida}`))} />
                  </Animated.View>
                )}
                <Animated.View layout={ACOMODA}>
                  <Boton texto={t('comida.guardadasCorto')} icono="bookmark" alTocar={() => setPanel('guardadas')} />
                </Animated.View>
                <Animated.View layout={ACOMODA}>
                  <Boton texto={t('comida.cargaRapida')} icono="bolt" alTocar={() => setPanel('rapida')} />
                </Animated.View>
                <Animated.View layout={ACOMODA}>
                  <Boton texto={t('comida.crearAlimento')} icono="pencil" alTocar={() => { setCrear({}); setPanel('crear'); }} />
                </Animated.View>
              </LayoutAnimationConfig>
            </ScrollView>
          )}
          </CabezaQueBaja>
          <ScrollQueBaja
            arrastre={deslizar}
            lugar={estilos.cuerpo}
            style={estilos.cuerpo}
            contentContainerStyle={[estilos.cuerpoAdentro, { paddingBottom: 14 + (conBandeja ? altoBandeja : 0) }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            // Con un panel o la ventana encima, el toque en la hora sube el de ellos.
            scrollsToTop={!panel && !ventana}
          >
            {!q && !eligiendo && siempre && siempreQueFalta.length > 0 && (
              <Aparece>
                <Pressable
                  onPress={() => {
                    // Armando otra cosa, se suma a lo que se arma (sin repetir lo que ya está); si no, se anota directo, con deshacer.
                    if (e.canasta.length) {
                      sumarVarias(siempreQueFalta, t(`comida.deSiempre.${comida}`));
                      return;
                    }
                    const nuevos = a.registrar(siempre, { comida, dia, momento: momentoDe(e, dia, comida) });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    avisar(t(`comida.deSiempre.${comida}`), () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
                    cerrar();
                  }}
                  style={({ pressed }) => [estilos.siempre, pressed && estilos.filaApretada]}
                  accessibilityRole="button"
                >
                  <View style={estilos.filaTextos}>
                    <Text style={estilos.siempreTitulo} numberOfLines={1}>{t(`comida.deSiempre.${comida}`)}</Text>
                    <Text style={estilos.filaDetalle} numberOfLines={2}>
                      {[siempre.map((i) => i.nombre).join(', '), numeros ? `${numero(Math.round(sumarValores(siempre.map((i) => i.valores)).kcal))} kcal` : ''].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <View style={estilos.mas}>
                    <Icono nombre="plus" tam={17} peso="semibold" />
                  </View>
                </Pressable>
              </Aparece>
            )}
            {!q && secciones.map((s) => (
              <View key={s.titulo}>
                <Etiqueta estilo={estilos.titulo}>{s.titulo}</Etiqueta>
                {s.filas.map(filaDeItem)}
              </View>
            ))}
            {/* Eligiendo el ingrediente de una receta, no: lo dicho se anotaría como comido. */}
            {q && !eligiendo && pareceUnaComida(q) && (
              <Aparece>
                <Pressable onPress={() => decir({ escuchar: false, texto: q })} style={({ pressed }) => [estilos.siempre, pressed && estilos.filaApretada]} accessibilityRole="button">
                  <View style={estilos.filaTextos}>
                    <Text style={estilos.siempreTitulo}>{t('comida.decir.todoJunto')}</Text>
                    <Text style={estilos.filaDetalle} numberOfLines={2}>{q}</Text>
                  </View>
                  <View style={estilos.mas}>
                    <Icono nombre="sparkles" tam={16} peso="semibold" />
                  </View>
                </Pressable>
              </Aparece>
            )}
            {q && propiosHallados.map(({ tipo, x }) => {
              const alimento = tipo === 'propio' ? alimentoDePropio(x as AlimentoPropio) : alimentoDeReceta(x as Receta);
              const porcion = alimento.porciones[0];
              const cantidad: Cantidad = porcion ? { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: 1 } : { gramos: 100 };
              const kcal = valoresDeCantidad(alimento.por100g, cantidad).kcal;
              return (
                <Fila
                  key={`${tipo}-${x.id}`}
                  nombre={alimento.nombre}
                  extra={tipo === 'propio' ? t('comida.tuyo') : t('comida.receta.titulo')}
                  detalle={detalleDe(cantidad, kcal)}
                  alAbrir={() => abrirVentana({ alimento, inicial: ultimaCantidad(e.registros.values(), alimento.fuente, alimento.ref), modo: modoNuevo })}
                />
              );
            })}
            {q && lista.map((r) => {
              const ultima = ultimos.get(claveDeAlimento('base', String(r.id)))?.cantidad;
              const una = r.porcion ? conUnaUnidad([r.porcion], idioma())[0] : null;
              const cantidad: Cantidad = ultima ?? (una ? { porcion: una.nombre, gramosPorcion: una.gramos, veces: 1 } : { gramos: 100 });
              const kcal = valoresDeCantidad(r, cantidad!).kcal;
              const n = normalizar;
              // Si lo que coincidió es otro nombre («aguacate» para la palta), se muestra al lado.
              // De un producto, su marca si el nombre no la dice; de lo demás, cómo se llama lo que se buscó.
              const extra = r.marca ? (n(r.nombre).includes(n(r.marca)) ? undefined : r.marca) : n(r.coincide) !== n(r.nombre) && !n(r.nombre).includes(n(q)) && r.coincide.length < 28 ? r.coincide.toLowerCase() : undefined;
              return <Fila key={r.id} nombre={r.nombre} extra={extra} detalle={detalleDe(cantidad, kcal)} alAbrir={() => abrirResultado(r)} />;
            })}
            {q && hallado?.texto === q && !lista.length && !propiosHallados.length && (eligiendo || !pareceUnaComida(q)) && (
              <Aparece style={estilos.vacio}>
                <Text style={estilos.vacioTexto}>{t('comida.sinResultados', { texto: q })}</Text>
                <View style={estilos.vacioAcciones}>
                  <Boton texto={t('comida.crearAlimento')} icono="pencil" alTocar={() => { setCrear({ nombre: q }); setPanel('crear'); }} />
                  {/* Eligiendo el ingrediente de una receta, la carga rápida no va: se anotaría como comida. */}
                  {!eligiendo && (
                    <Animated.View entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO}>
                      <Boton texto={t('comida.cargaRapida')} icono="bolt" alTocar={() => setPanel('rapida')} />
                    </Animated.View>
                  )}
                </View>
              </Aparece>
            )}
          </ScrollQueBaja>
          {/* La comida que se arma, abajo y encima del final de la lista: así la lista no salta cuando aparece. */}
          <LayoutAnimationConfig skipEntering>
            {conBandeja && (
              <Animated.View
                entering={reducido ? ENTRA_FUNDIDO : ENTRA_BANDEJA}
                exiting={reducido ? SALE_FUNDIDO : SALE_BANDEJA}
                style={[estilos.bandeja, { bottom: -insets.bottom, paddingBottom: insets.bottom }]}
              >
                <View style={estilos.bandejaFila} onLayout={(ev) => setAltoBandeja(ev.nativeEvent.layout.height)}>
                  <View style={estilos.bandejaTextos}>
                    {recienSumado ? (
                      <Animated.Text
                        key={recienSumado.vez}
                        entering={FadeIn.duration(180).reduceMotion(ReduceMotion.Never)}
                        exiting={FadeOut.duration(160).reduceMotion(ReduceMotion.Never)}
                        style={[estilos.bandejaTitulo, estilos.bandejaSumado]}
                        numberOfLines={1}
                      >
                        {t('comida.sumado', { alimento: recienSumado.texto })}
                      </Animated.Text>
                    ) : (
                      // Otra comida u otro día cambian el título con su fundido.
                      <Animated.Text key={`${comida}-${dia}`} entering={FadeIn.duration(180).reduceMotion(ReduceMotion.Never)} style={estilos.bandejaTitulo} numberOfLines={1}>{tuComidaDe(comida, dia, e.hoy)}</Animated.Text>
                    )}
                    <Text style={estilos.bandejaDetalle}>{resumenDeCanasta(e.canasta, numeros)}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss();
                      setPanel('revision');
                    }}
                    style={({ pressed }) => [estilos.listo, pressed && estilos.apretado]}
                    accessibilityRole="button"
                    hitSlop={margenDeToque(42)}
                  >
                    <Text style={estilos.listoTexto} maxFontSizeMultiplier={1.4}>{t('comun.listo')}</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}
          </LayoutAnimationConfig>

          {panel === 'revision' && e.canasta.length > 0 && (
            <PanelRevision
              comida={comida}
              dia={dia}
              hoy={e.hoy}
              canasta={e.canasta}
              sistema={sistema}
              restante={(kcal) => restante(kcal - sumarValores(e.canasta.map((i) => i.valores)).kcal)}
              abajo={insets.bottom}
              alEditar={(i) => {
                const item = e.canasta[i];
                const propio = item.fuente === 'propio' && item.ref ? e.propios.get(item.ref) : undefined;
                const receta = item.fuente === 'receta' && item.ref ? e.recetas.get(item.ref) : undefined;
                const base = propio ? alimentoDePropio(propio) : receta ? alimentoDeReceta(receta) : null;
                const por100g = por100gDe(item);
                if (!por100g || !item.ref) return;
                setVentana({
                  alimento: { fuente: item.fuente, ref: item.ref, nombre: item.nombre, por100g, porciones: base?.porciones ?? [], origen: base?.origen ?? t('comida.fuente.usda') },
                  inicial: item.cantidad ?? undefined, estimado: !!item.estimado, modo: { tipo: 'canasta', indice: i },
                });
              }}
              alQuitar={quitarDeLaCanasta}
              alAgregar={agregar}
              alGuardarComo={() => setPanel('guardarComo')}
              alAtras={() => (pedido.panel === 'revision' && pedido.items ? cerrar() : setPanel(null))}
            />
          )}
          {panel === 'guardarComo' && (
            <PanelGuardarComo
              abajo={insets.bottom}
              alAtras={() => setPanel('revision')}
              alGuardar={(nombre) => {
                a.guardarReceta({ tipo: 'comida', nombre, items: e.canasta, porciones: 1, pesoFinal: null });
                avisarAca(t('comida.guardarComo.guardada', { nombre }));
                setPanel('revision');
              }}
            />
          )}
          {panel === 'rapida' && (
            <PanelRapida
              directo={!!pedido.directo}
              comida={comida}
              dia={dia}
              hoy={e.hoy}
              inicial={rapidaEditada}
              alQuitar={rapidaEditada ? () => {
                const quitado = a.borrarRegistro(rapidaEditada.id);
                if (quitado) avisar(t('comida.quitado', { alimento: quitado.nombre }), () => a.deshacerBorrado(rapidaEditada.id));
                cerrar();
              } : undefined}
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'rapida' || soloEditar ? cerrar() : setPanel(null))}
              alSumar={(item) => {
                if (rapidaEditada) {
                  a.cambiarRegistro(rapidaEditada.id, { nombre: item.nombre, valores: item.valores });
                  avisar(t('comida.guardado'));
                  cerrar();
                } else if (pedido.directo) {
                  const nuevos = a.registrar([item], { comida, dia, momento: momentoDe(e, dia, comida) });
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  avisar(t('comida.agregadoA', { que: item.nombre, donde: t(`comida.aLa.${comida}`) }), () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
                  cerrar();
                } else {
                  sumar(item);
                  setPanel(null);
                }
              }}
            />
          )}
          {panel === 'guardadas' && (
            <PanelGuardadas
              recetas={vigentes(e.recetas.values())}
              // Tus alimentos son los que creaste (a mano o con la etiqueta), como en la galería; lo que se guardó
              // solo al escanear un producto de Open Food Facts no.
              propios={vigentes(e.propios.values()).filter((x) => x.origen !== 'off')}
              sistema={sistema}
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'guardadas' ? cerrar() : setPanel(null))}
              alSumar={(g) => {
                // De una receta, un plato; de un alimento tuyo, su porción. Se cierra el panel: la bandeja dice «Sumado».
                if (g.tipo === 'propio') sumar(itemDeAlimento('propio', g.x.id, g.x.nombre, g.x.por100g, porcionDePropio(g.x)));
                else if (g.tipo === 'receta') sumar(itemsParaRegistrar(g.x, t('comida.receta.plato'))[0]);
                else sumarVarias(itemsParaRegistrar(g.x, t('comida.receta.plato')), g.x.nombre);
                setPanel(null);
              }}
              alGuardar={(g) => {
                guardarDeNuevo(g);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                avisarAca(t('comida.crear.guardado', { nombre: g.x.nombre }));
              }}
              alBorrar={(g) => {
                // Sin preguntar: el aviso lo deshace, con lo de antes y el mismo id.
                if (g.tipo === 'propio') a.borrarPropio(g.x.id);
                else a.borrarReceta(g.x.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                avisarAca(t('comida.guardadasEditar.borrada', { nombre: g.x.nombre }), () => guardarDeNuevo(g));
              }}
              alNuevaReceta={() => {
                // Si había una a medio armar, sigue esa.
                setBorrador((b) => b ?? { nombre: '', porciones: '4', pesoFinal: '', items: [] });
                setPanel('receta');
              }}
              alPegarReceta={() => {
                // Lo pegado se suma a la receta a medio armar, si hay una: no se pierde.
                setPegarDesde('guardadas');
                setPanel('pegar');
              }}
            />
          )}
          {panel === 'decir' && (
            <PanelDecir
              comida={comida}
              dia={dia}
              sistema={sistema}
              escuchar={decirCon.escuchar}
              textoInicial={decirCon.texto}
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'decir' ? cerrar() : setPanel(null))}
              alAgregar={(items, comidaDicha, ayer) => {
                const elDia = ayer ? sumarDias(e.hoy, -1) : dia;
                // Si se nombró otra comida, va a su hora: «el desayuno comí…», dicho a la tarde.
                const nuevos = a.registrar(items, { comida: comidaDicha, dia: elDia, momento: momentoDe(e, elDia, comidaDicha) });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                avisar(plural('comida.decir.anotado', nuevos.length, { comida: t(`comida.aLa.${comidaDicha}`) }), () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
                cerrar();
              }}
              alBuscar={(x, encontrados, comidaDicha, { ayer: dichoAyer, pendientes }) => {
                // Lo que sí se encontró espera en la canasta: se busca lo que falta (lo demás, después) y se
                // agrega todo junto, en el día que se dijo.
                for (const item of encontrados) a.ponerEnCanasta(item);
                setComida(comidaDicha);
                if (dichoAyer) setDiaDicho(sumarDias(e.hoy, -1));
                setPorBuscar(pendientes);
                setPanel(null);
                escribir(x, true);
              }}
              alAvisar={avisarAca}
            />
          )}
          {panel === 'pegar' && (
            <PanelPegarReceta
              sistema={sistema}
              abajo={insets.bottom}
              alAtras={() => setPanel(pegarDesde === 'receta' && borrador ? 'receta' : 'guardadas')}
              alUsar={(r) => {
                // Lo leído llena la receta (lo que ya tenía, queda): se revisa y se guarda como siempre.
                const antes = borrador ?? { nombre: '', porciones: '', pesoFinal: '', items: [] };
                setBorrador({
                  ...antes,
                  nombre: antes.nombre || r.nombre,
                  porciones: antes.porciones || String(r.porciones ?? 1),
                  pesoFinal: antes.pesoFinal || (r.pesoFinal ? String(Math.round(r.pesoFinal)) : ''),
                  items: [...antes.items, ...r.items],
                });
                Haptics.selectionAsync().catch(() => {});
                setPanel('receta');
              }}
            />
          )}
          {panel === 'receta' && borrador && (
            <PanelReceta
              borrador={borrador}
              sistema={sistema}
              abajo={insets.bottom}
              alCambiar={setBorrador}
              alQuitar={(i) => {
                const item = borrador.items[i];
                if (!item) return;
                setBorrador((b) => b && { ...b, items: b.items.filter((_, k) => k !== i) });
                avisarAca(t('comida.quitado', { alimento: item.nombre }), () => setBorrador((b) => b && { ...b, items: [...b.items.slice(0, i), item, ...b.items.slice(i)] }));
              }}
              alAgregarIngrediente={() => {
                setEligiendo(true);
                setPanel(null);
              }}
              alPegar={() => {
                setPegarDesde('receta');
                setPanel('pegar');
              }}
              alGuardar={() => {
                const receta = recetaDe(borrador);
                if (!receta) return;
                const guardada = a.guardarReceta(receta);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                avisarAca(t('comida.receta.guardada', { nombre: guardada.nombre }));
                setBorrador(null);
                setPanel('guardadas');
              }}
              alAtras={() => {
                // La receta a medio armar queda: «Receta nueva» sigue con ella. Sin nada escrito, no hay qué guardar.
                if (!borrador.nombre.trim() && !borrador.items.length && !borrador.pesoFinal.trim()) setBorrador(null);
                setPanel('guardadas');
              }}
            />
          )}
          {panel === 'crear' && crear && (
            <PanelCrear
              inicial={crear}
              abajo={insets.bottom}
              alAtras={() => {
                setCrear(null);
                setPanel(null);
              }}
              alGuardar={(propio) => {
                const nuevo = a.guardarPropio({ ...propio, origen: crear.leida ? 'etiqueta' : 'mano' });
                setCrear(null);
                setPanel(null);
                if (eligiendo) {
                  abrirVentana({ alimento: alimentoDePropio(nuevo), modo: { tipo: 'ingrediente' } });
                  return;
                }
                sumar(itemDeAlimento('propio', nuevo.id, nuevo.nombre, nuevo.por100g, porcionDePropio(nuevo)));
              }}
            />
          )}
        </View>
        </MedirPie.Provider>

        <Animated.View style={estiloAbajo} />

        <AvisoFlotante aviso={aviso} alIrse={() => setAviso(null)} abajo={avisoAbajo} />

        {ventana && (
          <>
            <Ventana
              key={`${ventana.alimento.fuente}-${ventana.alimento.ref}-${ventana.modo.tipo}`}
              alimento={ventana.alimento}
              inicial={ventana.inicial}
              estimadoInicial={ventana.estimado}
              modo={ventana.modo}
              sistema={sistema}
              restante={restanteDe(ventana.modo)}
              dia={diaDe(ventana.modo)}
              persona={persona}
              favorito={!!e.favoritos.get(claveDeAlimento(ventana.alimento.fuente, ventana.alimento.ref))?.favorito}
              alFavorito={() => {
                const clave = claveDeAlimento(ventana.alimento.fuente, ventana.alimento.ref);
                Haptics.selectionAsync().catch(() => {});
                a.ponerFavorito(ventana.alimento.fuente, ventana.alimento.ref, !e.favoritos.get(clave)?.favorito);
              }}
              alListo={alListo}
              alQuitar={
                ventana.modo.tipo === 'canasta'
                  ? () => {
                      const modo = ventana.modo as { indice: number };
                      quitarDeLaCanasta(modo.indice);
                      setVentana(null);
                    }
                  : ventana.modo.tipo === 'registro'
                    ? () => {
                        const id = (ventana.modo as { id: string }).id;
                        const quitado = a.borrarRegistro(id);
                        setVentana(null);
                        if (quitado) avisar(t('comida.quitado', { alimento: quitado.nombre }), () => a.deshacerBorrado(id));
                        cerrar();
                      }
                    : undefined
              }
              alCerrar={() => (soloEditar ? cerrar() : setVentana(null))}
              abajo={insets.bottom}
            />
          </>
        )}
        </SinGuardar.Provider>
        </LayoutAnimationConfig>
      </Animated.View>

      {escaner && (
        <Escaner
          modo={escaner.modo}
          mensaje={escaner.mensaje}
          ocupado={escaner.ocupado}
          alCodigo={(c) => {
            alCodigo(c).catch(() => {
              setEscaner((s) => s && { ...s, ocupado: false, mensaje: t('comida.escaner.sinConexion') });
              noSeEncontro(t('comida.escaner.sinConexion'));
            });
          }}
          alEtiqueta={alEtiqueta}
          alAMano={aMano}
          alCambiarModo={(modo) => {
            dejarElEscaneo();
            setEscaner({ modo, mensaje: null, ocupado: false, codigo: escaner.codigo, parcial: escaner.parcial });
          }}
          alCerrar={() => {
            dejarElEscaneo();
            if (pedido.panel === 'codigo' || pedido.panel === 'etiqueta') cerrar();
            else setEscaner(null);
          }}
          arriba={insets.top + 8}
          abajo={insets.bottom}
        />
      )}
      </>)}
    </>
  );
}

function Fila({ nombre, extra, detalle, alAbrir }: { nombre: string; extra?: string; detalle: string; alAbrir: () => void }) {
  return (
    <Pressable onPress={alAbrir} style={({ pressed }) => [estilos.fila, pressed && estilos.filaApretada]} accessibilityRole="button">
      <View style={estilos.filaTextos}>
        <Text style={estilos.filaNombre} numberOfLines={1}>
          {nombre}
          {extra ? <Text style={estilos.filaExtra}>{` · ${extra}`}</Text> : null}
        </Text>
        {detalle ? <Text style={estilos.filaDetalle} numberOfLines={1}>{detalle}</Text> : null}
      </View>
      <View style={estilos.mas}>
        <Icono nombre="plus" tam={17} peso="semibold" />
      </View>
    </Pressable>
  );
}

// La región del teléfono se lee una vez, al abrir la primera hoja: así la búsqueda no espera.
region();

const estilos = StyleSheet.create({
  fondo: { backgroundColor: 'rgba(1, 2, 6, 0.6)' },
  // Sin recortar ni sombra: con dos esquinas redondeadas y dos no, el recorte obliga a iOS a dibujar la hoja aparte en
  // cada cambio (al escribir, con el cursor que titila), y la sombra no se veía. Los paneles y el velo de la ventana
  // llevan las mismas esquinas.
  hoja: {
    position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colores.hoja,
    borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.22)',
  },
  arriba: { height: 34 },
  // Chico y en mayúsculas, a la izquierda de la pestañita (en la galería, `.hj-dia`).
  dia: { position: 'absolute', left: 18, top: 9, maxWidth: '38%', fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colores.oroClaro },
  asa: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, marginTop: 7, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cerrar: { position: 'absolute', right: 12, top: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  paneles: { flex: 1 },
  // Lo de abajo de las pastillas también se toca (el scroll recorta su margen de toque): el lugar baja 3
  // puntos por detrás de lo que sigue, sin moverlo.
  chipsLugar: { flexGrow: 0, marginBottom: -3 },
  entreno: { marginHorizontal: 16 },
  chips: { gap: 6, paddingHorizontal: 16, paddingTop: 3, paddingBottom: 6 },
  chip: { borderRadius: 999, minHeight: 32, paddingVertical: 0, paddingHorizontal: 11 },
  // Con el alto mínimo: con el texto grande de iOS, el buscador crece en vez de cortar lo escrito.
  busca: { marginTop: 10, marginHorizontal: 16, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 13, paddingRight: 4, borderRadius: 14, backgroundColor: 'rgba(239, 230, 207, 0.07)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  entrada: { flex: 1, alignSelf: 'stretch', paddingLeft: 8, paddingRight: 6, outlineWidth: 0, fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
  icono: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  apretado: { opacity: 0.6 },
  atajosLugar: { flexGrow: 0 },
  atajos: { gap: 8, paddingHorizontal: 16, paddingTop: 10 },
  cuerpo: { flex: 1 },
  cuerpoAdentro: { paddingHorizontal: 16 },
  titulo: { marginTop: 16, marginBottom: 2 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingVertical: 7, borderBottomWidth: 1, borderColor: 'rgba(239, 230, 207, 0.06)' },
  filaApretada: { opacity: 0.7 },
  siempre: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10, marginBottom: 4, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  siempreTitulo: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.oroClaro },
  filaTextos: { flex: 1, gap: 4, minWidth: 0 },
  filaNombre: { fontFamily: letras.texto, fontSize: 15.5, color: colores.pergamino },
  filaExtra: { fontSize: 12.5, color: 'rgba(239, 230, 207, 0.48)' },
  filaDetalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)', fontVariant: ['tabular-nums'] },
  mas: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.5)', backgroundColor: 'rgba(232, 196, 106, 0.08)', alignItems: 'center', justifyContent: 'center' },
  vacio: { paddingVertical: 28, paddingHorizontal: 4, alignItems: 'center', gap: 16 },
  vacioTexto: { textAlign: 'center', fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.72)' },
  vacioAcciones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  eligiendo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14, backgroundColor: 'rgba(232, 196, 106, 0.1)', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.32)' },
  eligiendoTexto: { flex: 1, fontFamily: letras.texto, fontSize: 13, color: colores.oroClaro },
  // Encima del final de la lista y hasta el borde de abajo del teléfono, como en la galería: 64 más el borde.
  bandeja: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.2)', backgroundColor: 'rgba(10, 15, 33, 0.97)' },
  bandejaFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 64, paddingHorizontal: 16 },
  bandejaTextos: { flex: 1, gap: 4, minWidth: 0, paddingVertical: 10 },
  bandejaTitulo: { fontFamily: letras.textoMedio, fontSize: 14, color: colores.pergamino },
  bandejaSumado: { color: colores.oroClaro },
  bandejaDetalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  listo: { minHeight: 42, paddingHorizontal: 24, paddingVertical: 6, borderRadius: 999, backgroundColor: colores.oro, alignItems: 'center', justifyContent: 'center' },
  listoTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.tinta },
});
