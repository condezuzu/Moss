// El plan de comidas en Comida, como en la galería (galeria/src/comida.js): «Armar el día» arriba de
// la línea, lo armado con «Comí esto», «Otra», me gusta y no me gusta; «Tus comidas»; y en la
// semana, «Armar la semana» y la lista de compras. Las reglas están en src/dominio/plan.ts.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { baseDeAlimentos } from '@/comida/base';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { lunesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  ALERGENOS, cambiarPorOtra, diaPlaneadoDe, DIETAS, estaTachada, listaDeCompras, opcionDePlantilla, opcionesTuyas, planearDia, planificadoPorCompra, PLANTILLAS,
  PREFERENCIAS_DE_FABRICA, queFalta, recientesDe, tachadasDe, tachar as tacharEn, type DiaPlaneado, type Tachadas, type Opcion, type Preferencias, type Resolver,
} from '@/dominio/plan';
import { totalDelDia } from '@/dominio/registros';
import { t } from '@/textos';
import { colores, letras } from '@/tema';
import { HojaModal } from '../HojaModal';
import { ACOMODA } from '../tarjetas';
import { Boton, Etiqueta, Icono, Pastilla } from './comunes';
import { cantidadDeTexto, metaDelDia, minutosDe, opcionesDeIdioma, sistemaDe, type ComidaDelDia } from './datos';

type Avisar = (texto: string, deshacer?: () => void) => void;

/** A qué hora va lo que se arma: la de siempre de cada comida; el snack, a media mañana. */
export const horaDe = (c: Comida) => (c === 'snack' ? 11 * 60 : HORA_TIPICA[c]);
const semillaNueva = () => Math.floor(Math.random() * 2 ** 31);
const comoCome = (e: Pick<Estado, 'perfil'>): Preferencias => e.perfil?.comer ?? PREFERENCIAS_DE_FABRICA;

// Las comidas tipo, con los curados de la base en el idioma de la app: se arman una vez por idioma.
let comidasTipo: { clave: string; opciones: Promise<Opcion[]> } | null = null;
function lasComidasTipo(): Promise<Opcion[]> {
  const op = opcionesDeIdioma();
  const clave = `${op.idioma}-${op.region ?? ''}`;
  if (comidasTipo?.clave !== clave) {
    const nombres = [...new Set(PLANTILLAS.flatMap((p) => p.items.map(([nombre]) => nombre)))];
    const opciones = baseDeAlimentos.curados(nombres, op).then((curados) => {
      const resolver: Resolver = (nombre) => {
        const c = curados.get(nombre);
        return c ? { fuente: 'base', ref: String(c.id), nombre: c.nombre, por100g: c.por100g, porciones: c.porciones } : null;
      };
      return PLANTILLAS.flatMap((p) => opcionDePlantilla(p, resolver, op.idioma) ?? []);
    });
    opciones.catch(() => {
      comidasTipo = null;
    });
    comidasTipo = { clave, opciones };
  }
  return comidasTipo.opciones;
}

/** Con qué se arma: lo que comes seguido y las comidas tipo. null mientras se cargan. */
function useOpciones(e: Estado): Opcion[] | null {
  const [tipo, setTipo] = useState<Opcion[] | null>(null);
  useEffect(() => {
    let vivo = true;
    lasComidasTipo()
      .then((x) => vivo && setTipo(x))
      .catch(() => vivo && setTipo([]));
    return () => {
      vivo = false;
    };
  }, []);
  const { registros, hoy } = e;
  const tuyas = useMemo(() => opcionesTuyas(registros.values(), hoy), [registros, hoy]);
  return useMemo(() => (tipo ? [...tuyas, ...tipo] : null), [tuyas, tipo]);
}

/** Arma lo que falta de un día con lo que queda de la meta, y lo guarda planificado. null si no había nada que armar. */
function armarUnDia(e: Estado, dia: ClaveDia, opciones: readonly Opcion[]): DiaPlaneado | null {
  const meta = metaDelDia(e, dia);
  if (!meta) return null;
  const pref = comoCome(e);
  const solo = queFalta({ registros: e.registros.values(), dia, hoy: e.hoy, ahora: minutosDe(new Date()), pref, horaDe });
  if (!solo.length) return null;
  const armado = planearDia({
    dia, meta, opciones, pref, semilla: semillaNueva(), solo, yaComido: totalDelDia(e.registros.values(), dia, true), recientes: recientesDe(e.registros.values(), dia),
  });
  if (!armado.comidas.length) return null;
  elAlmacen().planificar(dia, armado.comidas, horaDe);
  return armado;
}

/** Arriba de la línea, de hoy en adelante: «Armar el día» si falta alguna comida, y «Tus comidas». */
export function ArmarElDia({ e, dia, avisar }: { e: Estado; dia: ClaveDia; avisar: Avisar }) {
  const opciones = useOpciones(e);
  const [hoja, setHoja] = useState(false);
  if (dia < e.hoy) return null;
  const falta = queFalta({ registros: e.registros.values(), dia, hoy: e.hoy, ahora: minutosDe(new Date()), pref: comoCome(e), horaDe }).length > 0;
  const armar = () => {
    if (!opciones) return;
    const armado = armarUnDia(e, dia, opciones);
    if (!armado) {
      avisar(t('comida.plan.nadaQueArmar'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!armado.alcanza) avisar(t('comida.plan.noAlcanza'));
  };
  return (
    <Animated.View layout={ACOMODA} style={estilos.armar}>
      {falta && (
        <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} layout={ACOMODA}>
          <Boton texto={t('comida.plan.armarDia')} icono="sparkles" tipo="secundario" alTocar={armar} desactivado={!opciones} />
        </Animated.View>
      )}
      <Animated.View layout={ACOMODA}>
        <Pressable onPress={() => setHoja(true)} hitSlop={8} accessibilityRole="button">
          <Text style={estilos.enlace}>{t('comida.plan.tusComidas')}</Text>
        </Pressable>
      </Animated.View>
      <HojaTusComidas e={e} abierta={hoja} alCerrar={() => setHoja(false)} />
    </Animated.View>
  );
}

function BotonRedondo({ icono, etiqueta, elegido, alTocar }: { icono: 'heart' | 'heart.fill' | 'xmark'; etiqueta: string; elegido?: boolean; alTocar: () => void }) {
  return (
    <Pressable
      onPress={alTocar}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={elegido === undefined ? undefined : { selected: elegido }}
      style={({ pressed }) => [estilos.redondo, pressed && estilos.apretado]}
    >
      <Icono nombre={icono} tam={14} peso="semibold" />
    </Pressable>
  );
}

/** Lo que se hace con una comida armada: «Comí esto» (hoy o antes), otra parecida, me gusta y no me gusta. */
export function AccionesDelPlan({ e, c, dia, avisar }: { e: Estado; c: ComidaDelDia; dia: ClaveDia; avisar: Avisar }) {
  const opciones = useOpciones(e);
  const clave = c.registros.find((r) => r.plan)?.plan ?? `planificada:${c.comida}`;
  const pref = comoCome(e);
  const gusta = pref.meGusta.includes(clave);
  /** Cambia la comida por otra parecida; devuelve cómo deshacerlo, o null si no hay otra. */
  const otra = (prefs: Preferencias) => {
    const meta = metaDelDia(e, dia);
    if (!opciones || !meta) return null;
    const nuevo = cambiarPorOtra(diaPlaneadoDe(e.registros.values(), dia), c.comida, { opciones, pref: prefs, meta, semilla: semillaNueva() });
    const cambiada = nuevo?.comidas.find((x) => x.comida === c.comida);
    return cambiada ? elAlmacen().cambiarPlanificada(dia, cambiada, horaDe) : null;
  };
  const comi = () => {
    const ids = elAlmacen().confirmarComida(dia, c.comida);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    avisar(t('comida.plan.anotado'), () => elAlmacen().volverAPlanificar(ids));
  };
  const cambiar = () => {
    if (otra(pref)) Haptics.selectionAsync().catch(() => {});
    else avisar(t('comida.plan.sinOtra'));
  };
  const meGusta = () => {
    Haptics.selectionAsync().catch(() => {});
    elAlmacen().ponerComer({ ...pref, meGusta: gusta ? pref.meGusta.filter((x) => x !== clave) : [...pref.meGusta, clave] });
  };
  // No vuelve a proponerse (lo anotado no se toca) y se cambia ya por otra.
  const noMeGusta = () => {
    const sinEsta = { ...pref, noMeGusta: [...pref.noMeGusta, clave] };
    const deshacer = otra(sinEsta);
    if (!deshacer) {
      avisar(t('comida.plan.sinOtra'));
      return;
    }
    elAlmacen().ponerComer(sinEsta);
    avisar(t('comida.plan.quitada'), () => {
      deshacer();
      const ahora = comoCome(elAlmacen().estado());
      elAlmacen().ponerComer({ ...ahora, noMeGusta: ahora.noMeGusta.filter((x) => x !== clave) });
    });
  };
  return (
    <View style={estilos.acciones}>
      {dia <= e.hoy && <Boton texto={t('comida.plan.comiEsto')} icono="checkmark" tipo="principal" alTocar={comi} />}
      <Boton texto={t('comida.plan.otra')} tipo="contorno" alTocar={cambiar} desactivado={!opciones} />
      <BotonRedondo icono={gusta ? 'heart.fill' : 'heart'} etiqueta={t('comida.plan.meGusta')} elegido={gusta} alTocar={meGusta} />
      <BotonRedondo icono="xmark" etiqueta={t('comida.plan.noMeGusta')} alTocar={noMeGusta} />
    </View>
  );
}

/** Debajo de las barras de la semana, si no pasó: armar lo que falta hasta el domingo y la lista de compras. */
export function PlanDeLaSemana({ e, dia, avisar }: { e: Estado; dia: ClaveDia; avisar: Avisar }) {
  const opciones = useOpciones(e);
  const [compras, setCompras] = useState(false);
  const lunes = lunesDe(dia);
  const domingo = sumarDias(lunes, 6);
  if (domingo < e.hoy) return null;
  const armar = () => {
    if (!opciones) return;
    let alguno = false;
    // Cada día con lo que ya quedó armado el anterior: así evita repetir.
    for (let d = lunes < e.hoy ? e.hoy : lunes; d <= domingo; d = sumarDias(d, 1)) alguno = !!armarUnDia(elAlmacen().estado(), d, opciones) || alguno;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    avisar(t(alguno ? 'comida.plan.armadaSemana' : 'comida.plan.nadaQueArmar'));
  };
  return (
    <View style={estilos.semana}>
      <Boton texto={t('comida.plan.armarSemana')} icono="sparkles" tipo="secundario" alTocar={armar} desactivado={!opciones} />
      <Boton texto={t('comida.plan.compras')} icono="cart" tipo="secundario" alTocar={() => setCompras(true)} />
      <HojaCompras e={e} abierta={compras} alCerrar={() => setCompras(false)} />
    </View>
  );
}

/** Tus comidas: cómo comes, qué no, cuántas comidas por día y cuánto tiempo para cocinar. */
function HojaTusComidas({ e, abierta, alCerrar }: { e: Estado; abierta: boolean; alCerrar: () => void }) {
  const pref = comoCome(e);
  const poner = (cambios: Partial<Preferencias>) => {
    Haptics.selectionAsync().catch(() => {});
    elAlmacen().ponerComer({ ...pref, ...cambios });
  };
  const grupo = <T extends string | number>(titulo: string, valores: readonly T[], nombre: (v: T) => string, elegido: (v: T) => boolean, alElegir: (v: T) => void) => (
    <View style={estilos.grupo}>
      <Etiqueta estilo={estilos.etiqueta}>{titulo}</Etiqueta>
      <View style={estilos.pastillas}>
        {valores.map((v) => <Pastilla key={String(v)} texto={nombre(v)} elegida={elegido(v)} alTocar={() => alElegir(v)} />)}
      </View>
    </View>
  );
  return (
    <HojaModal abierta={abierta} titulo={t('comida.plan.tusComidas')} alCerrar={alCerrar}>
      <Text style={estilos.texto}>{t('comida.plan.preferenciasTexto')}</Text>
      {grupo(t('comida.plan.dieta'), DIETAS, (d) => t(`comida.plan.dietas.${d}`), (d) => pref.dieta === d, (dieta) => poner({ dieta }))}
      {grupo(t('comida.plan.alergias'), ALERGENOS, (a) => t(`comida.plan.alergenos.${a}`), (a) => pref.alergias.includes(a),
        (a) => poner({ alergias: pref.alergias.includes(a) ? pref.alergias.filter((x) => x !== a) : [...pref.alergias, a] }))}
      {grupo(t('comida.plan.comidas'), [3, 4, 5] as const, String, (n) => pref.comidas === n, (comidas) => poner({ comidas }))}
      {grupo(t('comida.plan.tiempo'), ['poco', 'normal', 'mucho'] as const, (x) => t(`comida.plan.tiempos.${x}`), (x) => pref.tiempo === x, (tiempo) => poner({ tiempo }))}
    </HojaModal>
  );
}

// Lo tachado de la lista de compras queda en el teléfono, aunque se cierre Moss en el súper. Con lo
// planificado que cubría cada alimento (plan.ts): la lista de antes, sin eso, se lee vacía.
const COMPRADAS = 'moss:compradas';

/** La lista de compras: lo de las comidas armadas desde hoy, sumado, para tachar en el súper. */
function HojaCompras({ e, abierta, alCerrar }: { e: Estado; abierta: boolean; alCerrar: () => void }) {
  const [compradas, setCompradas] = useState<Tachadas>({});
  useEffect(() => {
    if (!abierta) return;
    AsyncStorage.getItem(COMPRADAS)
      .then((x) => setCompradas(tachadasDe(x ? JSON.parse(x) : null)))
      .catch(() => {});
  }, [abierta]);
  const { registros, hoy } = e;
  const dias = useMemo(() => {
    const planificados = new Set<ClaveDia>();
    for (const r of registros.values()) if (!r.borrado && r.planificado && r.dia >= hoy) planificados.add(r.dia);
    return [...planificados].sort().map((d) => diaPlaneadoDe(registros.values(), d));
  }, [registros, hoy]);
  const lista = useMemo(() => listaDeCompras(dias), [dias]);
  const planificado = useMemo(() => planificadoPorCompra(registros.values(), hoy), [registros, hoy]);
  const tachar = (clave: string) => {
    Haptics.selectionAsync().catch(() => {});
    const nuevas = tacharEn(compradas, clave, planificado);
    setCompradas(nuevas);
    AsyncStorage.setItem(COMPRADAS, JSON.stringify(nuevas)).catch(() => {});
  };
  return (
    <HojaModal abierta={abierta} titulo={t('comida.plan.compras')} alCerrar={alCerrar}>
      <Text style={estilos.texto}>{t(lista.length ? 'comida.plan.comprasTexto' : 'comida.plan.sinCompras')}</Text>
      {lista.length > 0 && (
        <View style={estilos.lista}>
          {lista.map((x, i) => {
            const hecha = estaTachada(compradas, x.clave, planificado);
            return (
              <Pressable
                key={x.clave}
                onPress={() => tachar(x.clave)}
                style={[estilos.fila, i > 0 && estilos.filaConRaya]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hecha }}
              >
                <View style={[estilos.marca, hecha && estilos.marcaHecha]}>
                  {hecha && <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)}><Icono nombre="checkmark" tam={11} color={colores.tinta} peso="bold" /></Animated.View>}
                </View>
                <Text style={[estilos.nombre, hecha && estilos.nombreHecho]} numberOfLines={2}>{x.nombre}</Text>
                <Text style={estilos.cuanto}>
                  {cantidadDeTexto(x.porciones ? { porcion: x.porciones.nombre, gramosPorcion: x.gramos / x.porciones.veces, veces: x.porciones.veces } : { gramos: x.gramos }, sistemaDe(e))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </HojaModal>
  );
}

const estilos = StyleSheet.create({
  armar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  enlace: { paddingVertical: 8, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.62)', textDecorationLine: 'underline', textDecorationColor: 'rgba(239, 230, 207, 0.25)' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 10 },
  redondo: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232, 196, 106, 0.28)', backgroundColor: 'rgba(232, 196, 106, 0.06)' },
  apretado: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  semana: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  texto: { marginBottom: 6, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  grupo: { marginTop: 16 },
  etiqueta: { marginBottom: 9 },
  pastillas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lista: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.04)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  filaConRaya: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  marca: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: 'rgba(239, 230, 207, 0.3)', alignItems: 'center', justifyContent: 'center' },
  marcaHecha: { backgroundColor: colores.oro, borderColor: colores.oro },
  nombre: { flex: 1, fontFamily: letras.texto, fontSize: 14.5, color: colores.pergamino },
  nombreHecho: { color: 'rgba(239, 230, 207, 0.4)', textDecorationLine: 'line-through' },
  cuanto: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.5)', fontVariant: ['tabular-nums'] },
});
