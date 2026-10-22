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
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { elAlmacen } from '@/almacen';
import { baseDeAlimentos } from '@/comida/base';
import { normalizar, type Resultado } from '@/comida/buscar';
import { formasDelCodigo, type Detalle } from '@/comida/detalle';
import { leerEtiqueta } from '@/comida/etiqueta';
import { buscarEnOff, type Producto } from '@/comida/off';
import { ACEITE_POR_100G } from '@/dominio/cantidades';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { sumarDias } from '@/dominio/fechas';
import {
  claveDeAlimento, delDia, escalar, gramosDe, itemDeAlimento, itemsParaRegistrar, premios, recientes, sueles, sumarValores, ultimaCantidad,
  valoresDeCantidad, valoresDeReceta, vigentes, type AlimentoPropio, type Cantidad, type Item, type Receta, type Valores,
} from '@/dominio/registros';
import { idioma, t } from '@/textos';
import { colores, letras } from '@/tema';
import { AvisoAbajo, Boton, Etiqueta, Icono, Pastilla, type Aviso } from './comunes';
import { cantidadDeTexto, comidaDeAhora, metaDelDia, momentoPara, numero, opcionesDeIdioma, region, sistemaDe, totalDe, useEstado } from './datos';
import { Escaner } from './Escaner';
import { PanelCrear, PanelGuardadas, PanelGuardarComo, PanelRapida, PanelReceta, PanelRevision, recetaDe, resumenDeCanasta, type Borrador, type DatosDeEtiqueta } from './Paneles';
import { avisar, cerrarRegistro, useRegistro, type Panel, type Pedido } from './registro';
import { origenDe, Ventana, type AlimentoAbierto, type ModoDeVentana } from './Ventana';

type VentanaAbierta = { alimento: AlimentoAbierto; inicial?: Cantidad; estimado?: boolean; modo: ModoDeVentana };
type EstadoDelEscaner = { modo: 'codigo' | 'etiqueta'; mensaje: string | null; ocupado: boolean; codigo?: string; parcial?: Producto | null };

/** La altura del teclado, para que nada quede abajo de él. */
function useTeclado(): number {
  const [alto, setAlto] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const mostrar = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (ev) => setAlto(ev.endCoordinates.height));
    const ocultar = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setAlto(0));
    return () => {
      mostrar.remove();
      ocultar.remove();
    };
  }, []);
  return alto;
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

export function HojaRegistro() {
  const pedido = useRegistro();
  return pedido ? <Hoja key={pedido.vez} pedido={pedido} /> : null;
}

function Hoja({ pedido }: { pedido: Pedido }) {
  const e = useEstado();
  const a = elAlmacen();
  const insets = useSafeAreaInsets();
  const teclado = useTeclado();
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
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [eligiendo, setEligiendo] = useState(false);
  const [crear, setCrear] = useState<DatosDeEtiqueta | null>(null);
  const [escaner, setEscaner] = useState<EstadoDelEscaner | null>(pedido.panel === 'codigo' || pedido.panel === 'etiqueta' ? { modo: pedido.panel, mensaje: null, ocupado: false } : null);
  const soloEditar = !!pedido.editar;
  const avisarAca = (textoDelAviso: string, deshacer?: () => void) => setAviso({ texto: textoDelAviso, deshacer, vez: otraVez() });

  // Copiar de ayer: lo de ayer, a la comida que se arma, y directo a la revisión. Una sola vez.
  const puestos = useRef(false);
  useEffect(() => {
    if (puestos.current || !pedido.items?.length) return;
    puestos.current = true;
    for (const item of pedido.items) a.ponerEnCanasta(item);
  }, [a, pedido.items]);

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
    cerrarRegistro();
  };

  // ------------------------------------------------------------ lo que queda en el día
  const meta = metaDelDia(e, dia);
  const restante = (kcal: number, sin = 0) => {
    if (!meta) return null;
    const antes = totalDe(e.registros, dia, e.hoy).kcal + sumarValores(e.canasta.map((i) => i.valores)).kcal - sin;
    return meta.kcal - antes - kcal;
  };
  const restanteDe = (modo: ModoDeVentana) => (kcal: number) => {
    if (modo.tipo === 'canasta') return restante(kcal, e.canasta[modo.indice]?.valores.kcal ?? 0);
    if (modo.tipo === 'registro') {
      const r = e.registros.get(modo.id);
      // Lo de otro día se cuenta contra ese día, sin lo que se arma ahora.
      return r && meta ? meta.kcal - (totalDe(e.registros, r.dia, e.hoy).kcal - r.valores.kcal) - kcal : null;
    }
    if (modo.tipo === 'ingrediente') return null;
    return restante(kcal);
  };

  // ------------------------------------------------------------ abrir la ventana
  const modoNuevo: ModoDeVentana = eligiendo ? { tipo: 'ingrediente' } : { tipo: 'sumar' };
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
    const { id, nombre, porcion, coincide: _c, curado: _cu, ...valores } = r;
    setVentana({
      alimento: { fuente: 'base', ref: String(id), nombre, por100g: valores, porciones: porcion ? [porcion] : [], origen: t('comida.fuente.usda') },
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
    const indice = a.estado().canasta.length - 1;
    avisarAca(t('comida.sumado', { alimento: [item.nombre, cantidadDeTexto(item.cantidad, sistema)].filter(Boolean).join(' · ') }), () => {
      if (a.estado().canasta[indice] === item) a.quitarDeCanasta(indice);
    });
  };
  const agregar = () => {
    const nuevos = a.agregarCanasta({ comida, dia, momento: momentoPara(dia, comida, e.hoy) });
    if (!nuevos.length) return;
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
  const alCodigo = async (codigo: string) => {
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
    if (detalle) {
      setEscaner(null);
      abrirDetalle(detalle);
      return;
    }
    try {
      const version = Constants.expoConfig?.version ?? '1.0.0';
      const producto = await buscarEnOff(codigo, { idioma: idioma(), version, contacto: 'github.com/condezuzu/moss' });
      if (producto?.completo) {
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
      setEscaner({ modo: 'etiqueta', ocupado: false, mensaje: t(producto ? 'comida.escaner.incompleto' : 'comida.escaner.noEsta'), codigo, parcial: producto });
    } catch {
      setEscaner({ modo: 'etiqueta', ocupado: false, mensaje: t('comida.escaner.sinConexion'), codigo });
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
  const deAyer = delDia(e.registros.values(), ayer).filter((r) => r.comida === comida);
  const secciones = useMemo(() => {
    const vistos = new Set<string>();
    const seccion = (titulo: string, lista: Item[]) => {
      const filas = lista.filter((i) => {
        const clave = claveDeAlimento(i.fuente, i.ref);
        if (vistos.has(clave)) return false;
        vistos.add(clave);
        return true;
      }).slice(0, 4);
      return filas.length ? [{ titulo, filas }] : [];
    };
    const favoritos: Item[] = [];
    for (const f of e.favoritos.values()) {
      if (!f.favorito) continue;
      const ultimo = vigentes(e.registros.values()).filter((r) => claveDeAlimento(r.fuente, r.ref) === claveDeAlimento(f.fuente, f.ref)).sort((x, y) => (x.momento < y.momento ? 1 : -1))[0];
      if (ultimo) favoritos.push(ultimo);
      else if (f.fuente === 'propio') {
        const propio = e.propios.get(f.ref);
        const porcion = propio?.porciones[0];
        if (propio && porcion) favoritos.push(itemDeAlimento('propio', propio.id, propio.nombre, propio.por100g, { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: 1 }));
      }
    }
    return [
      ...seccion(t(`comida.sueles.${comida}`), sueles(e.registros.values(), comida, e.hoy)),
      ...seccion(t('comida.recientes'), recientes(e.registros.values())),
      ...seccion(t('comida.favoritos'), favoritos),
    ];
  }, [e.registros, e.favoritos, e.propios, e.hoy, comida]);

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
  const enCanasta = e.canasta.length > 0 && !soloEditar && !eligiendo;
  const abajo = teclado || (enCanasta ? 0 : insets.bottom);

  const filaDeItem = (item: Item, i: number) => {
    const detalle = [cantidadDeTexto(item.cantidad, sistema), `${numero(Math.round(item.valores.kcal))} kcal`].filter(Boolean).join(' · ');
    return <Fila key={`${claveDeAlimento(item.fuente, item.ref)}-${i}`} nombre={item.nombre} detalle={detalle} alAbrir={() => abrirItem(item)} />;
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View entering={FadeIn.duration(350)} exiting={FadeOut.duration(300)} style={[StyleSheet.absoluteFill, estilos.fondo]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={cerrar} accessibilityRole="button" accessibilityLabel={t('comida.cerrar')} />
      </Animated.View>
      <Animated.View entering={SlideInDown.duration(460)} exiting={SlideOutDown.duration(380)} style={[estilos.hoja, { top: insets.top + 12 }]} accessibilityViewIsModal>
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
            <Pressable onPress={() => setEscaner({ modo: 'codigo', mensaje: null, ocupado: false })} style={estilos.icono} accessibilityRole="button" accessibilityLabel={t('comida.escanear')}>
              <Icono nombre="barcode.viewfinder" tam={21} />
            </Pressable>
            <Pressable onPress={() => setEscaner({ modo: 'etiqueta', mensaje: null, ocupado: false })} style={estilos.icono} accessibilityRole="button" accessibilityLabel={t('comida.etiqueta')}>
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
                    avisarAca(t('comida.sumado', { alimento: t(`comida.deAyer.${comida}`) }));
                  }}
                />
              )}
              <Boton texto={t('comida.guardadasCorto')} icono="bookmark" alTocar={() => setPanel('guardadas')} />
              <Boton texto={t('comida.cargaRapida')} icono="bolt" alTocar={() => setPanel('rapida')} />
              <Boton texto={t('comida.crearAlimento')} icono="pencil" alTocar={() => { setCrear({}); setPanel('crear'); }} />
            </ScrollView>
          )}
          <ScrollView style={estilos.cuerpo} contentContainerStyle={[estilos.cuerpoAdentro, { paddingBottom: 14 }]} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {!q && secciones.map((s) => (
              <View key={s.titulo}>
                <Etiqueta estilo={estilos.titulo}>{s.titulo}</Etiqueta>
                {s.filas.map(filaDeItem)}
              </View>
            ))}
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
                  alAbrir={() => setVentana({ alimento, inicial: ultimaCantidad(e.registros.values(), alimento.fuente, alimento.ref), modo: modoNuevo })}
                />
              );
            })}
            {q && lista.map((r) => {
              const ultima = ultimaCantidad(e.registros.values(), 'base', String(r.id));
              const cantidad: Cantidad = ultima ?? (r.porcion ? { porcion: r.porcion.nombre, gramosPorcion: r.porcion.gramos, veces: 1 } : { gramos: 100 });
              const kcal = valoresDeCantidad(r, cantidad!).kcal;
              const n = normalizar;
              // Si lo que coincidió es otro nombre («aguacate» para la palta), se muestra al lado.
              const extra = n(r.coincide) !== n(r.nombre) && !n(r.nombre).includes(n(q)) && r.coincide.length < 28 ? r.coincide.toLowerCase() : undefined;
              return <Fila key={r.id} nombre={r.nombre} extra={extra} detalle={`${cantidadDeTexto(cantidad, sistema)} · ${numero(Math.round(kcal))} kcal`} alAbrir={() => abrirResultado(r)} />;
            })}
            {q && hallado?.texto === q && !lista.length && !propiosHallados.length && (
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
              alQuitar={(i) => {
                a.quitarDeCanasta(i);
                if (a.estado().canasta.length === 0) setPanel(null);
              }}
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
              abajo={insets.bottom}
              alAtras={() => (pedido.panel === 'rapida' || soloEditar ? cerrar() : setPanel(null))}
              alSumar={(item) => {
                const editado = pedido.editar ? e.registros.get(pedido.editar) : undefined;
                if (editado) {
                  a.cambiarRegistro(editado.id, { nombre: item.nombre, valores: item.valores });
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
              alAbrirReceta={(r) => setVentana({ alimento: alimentoDeReceta(r), inicial: ultimaCantidad(e.registros.values(), 'receta', r.id), modo: { tipo: 'sumar' } })}
              alNuevaReceta={() => {
                setBorrador({ nombre: '', porciones: '4', pesoFinal: '', items: [] });
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
                  setVentana({ alimento: alimentoDePropio(nuevo), modo: { tipo: 'ingrediente' } });
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
              <Text style={estilos.bandejaTitulo} numberOfLines={1}>{t(`comida.tuComida.${comida}`)}</Text>
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
        <View style={{ height: abajo }} />

        <AvisoAbajo aviso={aviso} alIrse={() => setAviso(null)} abajo={(teclado || 0) + (enCanasta && !panel ? 76 + (teclado ? 0 : insets.bottom) : insets.bottom + 12)} />

        {ventana && (
          <>
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(260)} style={[StyleSheet.absoluteFill, estilos.velo]}>
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
                      a.quitarDeCanasta(modo.indice);
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
          alCambiarModo={(modo) => setEscaner({ modo, mensaje: null, ocupado: false, codigo: escaner.codigo, parcial: escaner.parcial })}
          alCerrar={() => (pedido.panel === 'codigo' || pedido.panel === 'etiqueta' ? cerrar() : setEscaner(null))}
          arriba={insets.top + 8}
          abajo={insets.bottom}
        />
      )}
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
  bandejaDetalle: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.62)', fontVariant: ['tabular-nums'] },
  listo: { height: 42, paddingHorizontal: 24, borderRadius: 999, backgroundColor: colores.oro, alignItems: 'center', justifyContent: 'center' },
  listoTexto: { fontFamily: letras.textoMedio, fontSize: 15, color: colores.tinta },
  velo: { backgroundColor: 'rgba(2, 4, 10, 0.58)' },
});
