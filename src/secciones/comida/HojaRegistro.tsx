// La hoja de registro, la de la galería (spec/nutricion.md, «Registrar: los flujos y sus toques»):
// abre lista para escribir, con la comida de la hora (se cambia con un toque) y, sin escribir, lo
// que sueles comer a esa hora, tus recientes y tus favoritos. Registrar es armar la comida: cada
// alimento se abre en su ventana y se suma; abajo se ve lo que se junta, «Listo» abre la revisión y
// recién «Agregar» lo registra. Lo juntado queda guardado si se cierra la hoja.
// Tiene también los atajos: la comida de ayer, las guardadas y las recetas, la carga rápida, crear
// un alimento, el código de barras y la foto de la etiqueta.

import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LayoutAnimationConfig, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { textoDeBusqueda } from '@/almacen/buzon';
import { buzon } from '@/almacen/buzonDeMoss';
import { baseDeAlimentos } from '@/comida/base';
import { normalizar, type Resultado } from '@/comida/buscar';
import { formasDelCodigo, type Detalle } from '@/comida/detalle';
import { leerEtiqueta } from '@/comida/etiqueta';
import { conUnaUnidad } from '@/comida/porciones';
import { buscarEnOff, type Producto } from '@/comida/off';
import { ACEITE_POR_100G } from '@/dominio/cantidades';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { sumarDias } from '@/dominio/fechas';
import { edadDe, type Macros } from '@/dominio/metas';
import type { ParaQuien } from '@/dominio/micronutrientes';
import { SITIO } from '@/lib/sitio';
import {
  claveDeAlimento, delDia, deSiempre, escalar, gramosDe, itemDeAlimento, itemsParaRegistrar, premios, recientes, sueles, sumarValores, ultimaCantidad,
  valoresDeCantidad, valoresDeReceta, vigentes, type AlimentoPropio, type Cantidad, type Item, type Receta, type Registro, type Valores,
} from '@/dominio/registros';
import { idioma, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { ENTRA_HOJA, ENTRA_VELO, SALE_HOJA, SALE_VELO } from '../movimiento';
import { Aparece } from '../tarjetas';
import { useTeclado } from '../teclado';
import { AvisoFlotante, Boton, Etiqueta, Icono, Pastilla, type Aviso } from './comunes';
import { PanelDecir } from './Decir';
import { lineasDeHoy } from './entreno';
import { LineaDeEntreno } from './LineaDeEntreno';
import { cantidadDeTexto, comidaDeAhora, metaDelDia, momentoPara, numero, opcionesDeIdioma, region, sistemaDe, totalDe, useEstado } from './datos';
import { Escaner } from './Escaner';
import {
  PanelCrear, PanelGuardadas, PanelGuardarComo, PanelPegarReceta, PanelRapida, PanelReceta, PanelRevision, recetaDe, resumenDeCanasta, type Borrador, type DatosDeEtiqueta,
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

/** Lo que dura la salida más larga (SALE_HOJA), con un margen. */
const SALIDA_MS = 280;

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
  return visto ? <Hoja key={visto.vez} pedido={visto} abierta={pedido !== null} /> : null;
}

function Hoja({ pedido, abierta }: { pedido: Pedido; abierta: boolean }) {
  const e = useEstado();
  const a = elAlmacen();
  const insets = useSafeAreaInsets();
  const { alto: teclado, animado: tecladoAnimado } = useTeclado();
  const sistema = sistemaDe(e);
  const dia = pedido.dia ?? e.hoy;
  const [comida, setComida] = useState<Comida>(pedido.comida ?? comidaDeAhora());
  const [texto, setTexto] = useState('');
  const [hallado, setHallado] = useState<{ texto: string; lista: Resultado[] } | null>(null);
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
  const [crear, setCrear] = useState<DatosDeEtiqueta | null>(null);
  const [escaner, setEscaner] = useState<EstadoDelEscaner | null>(pedido.panel === 'codigo' || pedido.panel === 'etiqueta' ? { modo: pedido.panel, mensaje: null, ocupado: false } : null);
  const soloEditar = !!pedido.editar;
  const avisarAca = (textoDelAviso: string, deshacer?: () => void) => setAviso({ texto: textoDelAviso, deshacer, vez: otraVez() });

  // Copiar de ayer: lo de ayer, a la comida que se arma, y directo a la revisión. Una sola vez.
  // Dónde quedó en la comida que se arma: si se cierra sin agregar, se saca.
  const puestos = useRef(false);
  const copia = useRef<{ desde: number; cuantos: number } | null>(null);
  useEffect(() => {
    if (puestos.current || !pedido.items?.length) return;
    puestos.current = true;
    copia.current = { desde: a.estado().canasta.length, cuantos: pedido.items.length };
    for (const item of pedido.items) a.ponerEnCanasta(item);
  }, [a, pedido.items]);
  const quitarDeLaCanasta = (i: number) => {
    a.quitarDeCanasta(i);
    const c = copia.current;
    if (c && i < c.desde) c.desde--;
    else if (c && i < c.desde + c.cuantos) c.cuantos--;
    if (a.estado().canasta.length === 0) setPanel(null);
  };

  // La búsqueda: mientras se escribe, con un respiro para no buscar letra por letra.
  const premio = useMemo(() => premios(e.registros.values(), e.hoy), [e.registros, e.hoy]);
  useEffect(() => {
    const q = texto.trim();
    if (!q) return;
    let vigente = true;
    const espera = setTimeout(() => {
      baseDeAlimentos.buscar(q, { ...opcionesDeIdioma(), limite: 30, premio: (id) => premio.get(id) ?? 0 })
        .then((lista) => vigente && setHallado({ texto: q, lista }))
        .catch(() => vigente && setHallado({ texto: q, lista: [] }));
    }, 90);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto, premio]);

  const cerrar = () => {
    Keyboard.dismiss();
    const c = copia.current;
    copia.current = null;
    if (c) for (let k = 0; k < c.cuantos; k++) a.quitarDeCanasta(c.desde);
    cerrarRegistro();
  };

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
  // Las referencias de las vitaminas y los minerales: para la edad y el sexo del perfil.
  const persona: ParaQuien = { sexo: e.perfil?.sexo ?? 'f', edad: e.perfil ? edadDe(e.perfil, e.hoy) : 30 };
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
    const { id, nombre, porcion, coincide: _c, curado: _cu, verificado: _v, ...valores } = r;
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
  const sumar = (item: Item) => {
    a.ponerEnCanasta(item);
    Haptics.selectionAsync().catch(() => {});
    setRecienSumado({ texto: [item.nombre, cantidadDeTexto(item.cantidad, sistema)].filter(Boolean).join(' · '), vez: otraVez() });
  };
  const agregar = () => {
    const nuevos = a.agregarCanasta({ comida, dia, momento: momentoPara(dia, comida, e.hoy) });
    if (!nuevos.length) return;
    copia.current = null;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const que = nuevos.length === 1 ? [nuevos[0].nombre, cantidadDeTexto(nuevos[0].cantidad, sistema)].filter(Boolean).join(' · ') : `${t(`comida.comidas.${comida}`)} · ${resumenDeCanasta(nuevos)}`;
    avisar(que, () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
    cerrar();
  };

  const alListo = (item: Item) => {
    if (!ventana) return;
    const modo = ventana.modo;
    if (modo.tipo === 'sumar') sumar(item);
    else if (modo.tipo === 'canasta') a.cambiarEnCanasta(modo.indice, item);
    else if (modo.tipo === 'ingrediente' && borrador) {
      setBorrador({ ...borrador, items: [...borrador.items, item] });
      setEligiendo(false);
      setTexto('');
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
      const mensaje = !producto ? 'comida.escaner.noEsta' : producto.completo ? 'comida.escaner.noCierra' : 'comida.escaner.incompleto';
      setEscaner({ modo: 'etiqueta', ocupado: false, mensaje: t(mensaje), codigo, parcial: producto });
    } catch {
      if (sigue()) setEscaner({ modo: 'etiqueta', ocupado: false, mensaje: t('comida.escaner.sinConexion'), codigo });
    }
  };
  const alEtiqueta = (lineas: string[]) => {
    const leida = leerEtiqueta(lineas);
    setCrear({ codigo: escaner?.codigo, nombre: escaner?.parcial?.nombre, marca: escaner?.parcial?.marca, leida });
    setEscaner(null);
    setPanel('crear');
  };
  const aMano = () => {
    setCrear({ codigo: escaner?.codigo, nombre: escaner?.parcial?.nombre, marca: escaner?.parcial?.marca, porPorcion: undefined });
    setEscaner(null);
    setPanel('crear');
  };

  // ------------------------------------------------------------ lo que se ve sin escribir
  const q = texto.trim();
  const ayer = sumarDias(dia, -1);
  const deAyer = useMemo(() => delDia(e.registros.values(), ayer).filter((r) => r.comida === comida), [e.registros, ayer, comida]);
  // Lo último anotado de cada alimento, en una sola pasada: lo usan las filas del buscador (letra por letra) y los favoritos.
  const ultimos = useMemo(() => {
    const m = new Map<string, Registro>();
    for (const r of vigentes(e.registros.values())) {
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
  // Tu comida de siempre, entera de un toque: la misma combinación dos veces en dos semanas.
  const siempre = useMemo(() => deSiempre(e.registros.values(), comida, dia), [e.registros, comida, dia]);
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
  // El lugar del teclado (o del borde de abajo) sube con el teclado, con su misma curva.
  const sinTeclado = enCanasta ? 0 : insets.bottom;
  const estiloAbajo = useAnimatedStyle(() => ({ height: Math.max(sinTeclado, tecladoAnimado.get()) }));

  const filaDeItem = (item: Item, i: number) => {
    const detalle = [cantidadDeTexto(item.cantidad, sistema), `${numero(Math.round(item.valores.kcal))} kcal`].filter(Boolean).join(' · ');
    return <Fila key={`${claveDeAlimento(item.fuente, item.ref)}-${i}`} nombre={item.nombre} detalle={detalle} alAbrir={() => abrirItem(item)} />;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Al cerrar, la hoja sigue armada sin su contenido lo que dura la salida (ver HojaRegistro). */}
      {abierta && (<>
      <Animated.View entering={ENTRA_VELO} exiting={SALE_VELO} style={[StyleSheet.absoluteFill, estilos.fondo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
      </Animated.View>
      <Animated.View entering={ENTRA_HOJA} exiting={SALE_HOJA} style={[estilos.hoja, { top: insets.top + 12 }]} accessibilityViewIsModal>
        {/* Lo de adentro se va con la hoja: sus propias salidas (las filas de «decir») no corren. */}
        <LayoutAnimationConfig skipExiting>
        <View style={estilos.arriba}>
          <View style={estilos.asa} />
          {!panel && (
            <Pressable onPress={cerrar} style={estilos.cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} hitSlop={6}>
              <Icono nombre="xmark" tam={13} color="rgba(239, 230, 207, 0.75)" peso="semibold" />
            </Pressable>
          )}
        </View>

        <View style={estilos.paneles}>
          {eligiendo && borrador && (
            <View style={estilos.eligiendo}>
              <Text style={estilos.eligiendoTexto} numberOfLines={1}>{t('comida.receta.eligeIngrediente', { receta: borrador.nombre.trim() || t('comida.receta.nueva') })}</Text>
              <Boton texto={t('comun.cancelar')} tipo="contorno" alTocar={() => { setEligiendo(false); setPanel('receta'); }} />
            </View>
          )}
          {!eligiendo && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsLugar} contentContainerStyle={estilos.chips}>
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
              value={texto}
              onChangeText={setTexto}
              placeholder={t('comida.buscar')}
              placeholderTextColor="rgba(239, 230, 207, 0.42)"
              autoFocus={!soloEditar && !pedido.panel && !pedido.items?.length}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              selectionColor={colores.oro}
              style={estilos.entrada}
              accessibilityLabel={t('comida.buscar')}
            />
            <Pressable onPress={() => decir({ escuchar: true })} style={estilos.icono} accessibilityRole="button" accessibilityLabel={t('comida.decir.titulo')}>
              <Icono nombre="mic" tam={20} />
            </Pressable>
            <Pressable onPress={() => { Keyboard.dismiss(); setEscaner({ modo: 'codigo', mensaje: null, ocupado: false }); }} style={estilos.icono} accessibilityRole="button" accessibilityLabel={t('comida.escanear')}>
              <Icono nombre="barcode.viewfinder" tam={21} />
            </Pressable>
            <Pressable onPress={() => { Keyboard.dismiss(); setEscaner({ modo: 'etiqueta', mensaje: null, ocupado: false }); }} style={estilos.icono} accessibilityRole="button" accessibilityLabel={t('comida.etiqueta')}>
              <Icono nombre="doc.text.viewfinder" tam={21} />
            </Pressable>
          </View>
          {!q && !eligiendo && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.atajosLugar} contentContainerStyle={estilos.atajos} keyboardShouldPersistTaps="handled">
              {deAyer.length > 0 && (
                <Boton
                  texto={t(`comida.deAyer.${comida}`)}
                  icono="doc.on.doc"
                  alTocar={() => {
                    for (const r of deAyer) a.ponerEnCanasta({ fuente: r.fuente, ref: r.ref, nombre: r.nombre, cantidad: r.cantidad, valores: r.valores, ...(r.estimado ? { estimado: true as const } : {}) });
                    setRecienSumado({ texto: t(`comida.deAyer.${comida}`), vez: otraVez() });
                  }}
                />
              )}
              <Boton texto={t('comida.guardadasCorto')} icono="bookmark" alTocar={() => setPanel('guardadas')} />
              <Boton texto={t('comida.cargaRapida')} icono="bolt" alTocar={() => setPanel('rapida')} />
              <Boton texto={t('comida.crearAlimento')} icono="pencil" alTocar={() => { setCrear({}); setPanel('crear'); }} />
            </ScrollView>
          )}
          <ScrollView style={estilos.cuerpo} contentContainerStyle={[estilos.cuerpoAdentro, { paddingBottom: 14 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {!q && !eligiendo && siempre && (
              <Aparece>
                <Pressable
                  onPress={() => {
                    // Armando otra cosa, se suma a lo que se arma; si no, se anota directo, con deshacer.
                    if (e.canasta.length) {
                      for (const item of siempre) a.ponerEnCanasta(item);
                      Haptics.selectionAsync().catch(() => {});
                      setRecienSumado({ texto: t(`comida.deSiempre.${comida}`), vez: otraVez() });
                      return;
                    }
                    const nuevos = a.registrar(siempre, { comida, dia, momento: momentoPara(dia, comida, e.hoy) });
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
                      {`${siempre.map((i) => i.nombre).join(', ')} · ${numero(Math.round(sumarValores(siempre.map((i) => i.valores)).kcal))} kcal`}
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
            {q && pareceUnaComida(q) && (
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
                  detalle={`${cantidadDeTexto(cantidad, sistema)} · ${numero(Math.round(kcal))} kcal`}
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
              const extra = n(r.coincide) !== n(r.nombre) && !n(r.nombre).includes(n(q)) && r.coincide.length < 28 ? r.coincide.toLowerCase() : undefined;
              return <Fila key={r.id} nombre={r.nombre} extra={extra} detalle={`${cantidadDeTexto(cantidad, sistema)} · ${numero(Math.round(kcal))} kcal`} alAbrir={() => abrirResultado(r)} />;
            })}
            {q && hallado?.texto === q && !lista.length && !propiosHallados.length && !pareceUnaComida(q) && (
              <View style={estilos.vacio}>
                <Text style={estilos.vacioTexto}>{t('comida.sinResultados', { texto: q })}</Text>
                <View style={estilos.vacioAcciones}>
                  <Boton texto={t('comida.crearAlimento')} icono="pencil" alTocar={() => { setCrear({ nombre: q }); setPanel('crear'); }} />
                  <Boton texto={t('comida.cargaRapida')} icono="bolt" alTocar={() => setPanel('rapida')} />
                </View>
              </View>
            )}
          </ScrollView>

          {panel === 'revision' && e.canasta.length > 0 && (
            <PanelRevision
              comida={comida}
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
                  const nuevos = a.registrar([item], { comida, dia, momento: momentoPara(dia, comida, e.hoy) });
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
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'guardadas' ? cerrar() : setPanel(null))}
              alSumarComida={(r) => {
                for (const item of itemsParaRegistrar(r, t('comida.receta.plato'))) a.ponerEnCanasta(item);
                Haptics.selectionAsync().catch(() => {});
                avisarAca(t('comida.sumado', { alimento: r.nombre }));
                setPanel(null);
              }}
              alAbrirReceta={(r) => abrirVentana({ alimento: alimentoDeReceta(r), inicial: ultimaCantidad(e.registros.values(), 'receta', r.id), modo: { tipo: 'sumar' } })}
              alNuevaReceta={() => {
                setBorrador({ nombre: '', porciones: '4', pesoFinal: '', items: [] });
                setPanel('receta');
              }}
              alPegarReceta={() => {
                setBorrador(null);
                setPanel('pegar');
              }}
            />
          )}
          {panel === 'decir' && (
            <PanelDecir
              comida={comida}
              sistema={sistema}
              escuchar={decirCon.escuchar}
              textoInicial={decirCon.texto}
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'decir' ? cerrar() : setPanel(null))}
              alAgregar={(items, comidaDicha, ayer) => {
                const elDia = ayer ? sumarDias(e.hoy, -1) : dia;
                const nuevos = a.registrar(items, { comida: comidaDicha, dia: elDia, momento: momentoPara(elDia, comidaDicha, e.hoy) });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                avisar(plural('comida.decir.anotado', nuevos.length, { comida: t(`comida.aLa.${comidaDicha}`) }), () => nuevos.forEach((r) => a.borrarRegistro(r.id)));
                cerrar();
              }}
              alBuscar={(x, encontrados, comidaDicha) => {
                // Lo que sí se encontró espera en la canasta: se busca lo que falta y se agrega todo junto.
                for (const item of encontrados) a.ponerEnCanasta(item);
                setComida(comidaDicha);
                setPanel(null);
                setTexto(x);
              }}
            />
          )}
          {panel === 'pegar' && (
            <PanelPegarReceta
              sistema={sistema}
              abajo={insets.bottom}
              alAtras={() => setPanel(borrador ? 'receta' : 'guardadas')}
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
              alAgregarIngrediente={() => {
                setEligiendo(true);
                setPanel(null);
              }}
              alPegar={() => setPanel('pegar')}
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
                setBorrador(null);
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
                const porcion = nuevo.porciones[0];
                setCrear(null);
                setPanel(null);
                if (eligiendo) {
                  abrirVentana({ alimento: alimentoDePropio(nuevo), modo: { tipo: 'ingrediente' } });
                  return;
                }
                sumar(itemDeAlimento('propio', nuevo.id, nuevo.nombre, nuevo.por100g, porcion ? { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: 1 } : { gramos: 100 }));
              }}
            />
          )}
        </View>

        {enCanasta && !panel && (
          <View style={[estilos.bandeja, { paddingBottom: teclado ? 0 : insets.bottom }]}>
            <View style={estilos.bandejaTextos}>
              {recienSumado ? (
                <Animated.Text key={recienSumado.vez} entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={[estilos.bandejaTitulo, estilos.bandejaSumado]} numberOfLines={1}>
                  {t('comida.sumado', { alimento: recienSumado.texto })}
                </Animated.Text>
              ) : (
                <Animated.Text key="titulo" entering={FadeIn.duration(180)} style={estilos.bandejaTitulo} numberOfLines={1}>{t(`comida.tuComida.${comida}`)}</Animated.Text>
              )}
              <Text style={estilos.bandejaDetalle}>{resumenDeCanasta(e.canasta)}</Text>
            </View>
            <Pressable
              onPress={() => {
                Keyboard.dismiss();
                setPanel('revision');
              }}
              style={estilos.listo}
              accessibilityRole="button"
            >
              <Text style={estilos.listoTexto}>{t('comun.listo')}</Text>
            </Pressable>
          </View>
        )}
        <Animated.View style={estiloAbajo} />

        <AvisoFlotante aviso={aviso} alIrse={() => setAviso(null)} abajo={(teclado || 0) + (enCanasta && !panel ? 76 + (teclado ? 0 : insets.bottom) : insets.bottom + 12)} />

        {ventana && (
          <>
            <Animated.View entering={ENTRA_VELO} exiting={SALE_VELO} style={[StyleSheet.absoluteFill, estilos.velo]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => (soloEditar ? cerrar() : setVentana(null))} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
            </Animated.View>
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
        </LayoutAnimationConfig>
      </Animated.View>

      {escaner && (
        <Escaner
          modo={escaner.modo}
          mensaje={escaner.mensaje}
          ocupado={escaner.ocupado}
          alCodigo={(c) => {
            alCodigo(c).catch(() => setEscaner((s) => s && { ...s, ocupado: false, mensaje: t('comida.escaner.sinConexion') }));
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
    </View>
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
        <Text style={estilos.filaDetalle} numberOfLines={1}>{detalle}</Text>
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
  hoja: {
    position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: colores.hoja,
    borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.22)', shadowColor: '#000', shadowOpacity: 0.55, shadowRadius: 30, shadowOffset: { width: 0, height: -24 },
  },
  arriba: { height: 34 },
  asa: { alignSelf: 'center', width: 38, height: 5, borderRadius: 3, marginTop: 7, backgroundColor: 'rgba(239, 230, 207, 0.22)' },
  cerrar: { position: 'absolute', right: 12, top: 6, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.08)' },
  paneles: { flex: 1 },
  chipsLugar: { flexGrow: 0 },
  entreno: { marginHorizontal: 16 },
  chips: { gap: 6, paddingHorizontal: 16, paddingVertical: 3 },
  chip: { borderRadius: 999, minHeight: 32, paddingVertical: 0, paddingHorizontal: 11 },
  busca: { marginTop: 10, marginHorizontal: 16, height: 48, flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 13, paddingRight: 4, borderRadius: 14, backgroundColor: 'rgba(239, 230, 207, 0.07)', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  entrada: { flex: 1, height: '100%', paddingLeft: 8, paddingRight: 6, outlineWidth: 0, fontFamily: letras.texto, fontSize: 16, color: colores.pergamino },
  icono: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
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
  bandeja: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 64, paddingHorizontal: 16, borderTopWidth: 1, borderColor: 'rgba(232, 196, 106, 0.2)', backgroundColor: 'rgba(10, 15, 33, 0.97)' },
  bandejaTextos: { flex: 1, gap: 4, minWidth: 0, paddingVertical: 10 },
  bandejaTitulo: { fontFamily: letras.textoMedio, fontSize: 14, color: colores.pergamino },
  bandejaSumado: { color: colores.oroClaro },
  bandejaDetalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  listo: { height: 42, paddingHorizontal: 24, borderRadius: 999, backgroundColor: colores.oro, alignItems: 'center', justifyContent: 'center' },
  listoTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.tinta },
  velo: { backgroundColor: 'rgba(2, 4, 10, 0.58)' },
});
