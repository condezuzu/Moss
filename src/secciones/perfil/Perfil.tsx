// Perfil, la última sección (antes Ajustes), la de la galería (galeria/src/perfil.js): arriba, la
// tarjeta de la persona (tu foto o tu inicial, tu nombre, la edad, la altura y el peso de hoy), que abre
// Editar perfil; las conexiones (Salud, los aparatos y Ascent); tus datos (con Cuidados y Tus respuestas),
// las preferencias (con ocultar los números) y tus datos para llevar o borrar, con la política de
// privacidad, los términos y el contacto; los créditos, que se despliegan, y abajo de todo, en qué se basa
// Moss. Cada fila con su cuadrito de color. Las metas están en Progreso, con la estrategia.

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, AppState, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, type AlertButton } from 'react-native';
import Animated, {
  FadeIn, LayoutAnimationConfig, ReduceMotion, useAnimatedRef, useAnimatedStyle, useReducedMotion, useScrollOffset, withTiming, type EntryExitAnimationFunction,
} from 'react-native-reanimated';

import { actualizarSalud, datosDeOtraCuenta, elAlmacen, oirLaSesion } from '@/almacen';
import { horasDeComerDe, noSueleDe, reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { CON_ASCENT } from '@/lib/banderas';
import { abrirPagina, CORREO } from '@/lib/sitio';
import type { Calidad } from '@/cielo/mundo';
import { CM_POR_PULGADA, piesYPulgadas } from '@/dominio/cantidades';
import type { Entreno } from '@/dominio/alrededorDelEntreno';
import { DEPORTES, deportesDePerfil, entrenoConCambios, preguntasDelEntreno, type CambiosDelEntreno, type Deporte } from '@/dominio/cuestionario';
import type { Comida } from '@/dominio/comidas';
import { CORTE_DE_FABRICA, CORTES, diaDeLaSemana, sumarDias, type DiaSemana } from '@/dominio/fechas';
import { edadDe, RANGOS_DEL_CUESTIONARIO, type Actividad, type Perfil as DatosDelPerfil, type Sexo } from '@/dominio/metas';
import { LARGO_DEL_NOMBRE } from '@/dominio/nombre';
import { algunAviso, avisosDe, comidasQueAvisan, conLoQueFalta, horaDeReloj, pedirPermisoDeAvisosConMotivo, suenoDelDia } from '@/recordatorios/programar';
import { duerme, horasDeSueno, MAXIMO_POR_DIA } from '@/dominio/avisos';
import { apagaLoQueConviene } from '@/dominio/cuidados';
import { delDeporte, QUE_CONVIENE, VIAJE_DE_FABRICA, VIAJES, type QueConviene } from '@/dominio/loQueConviene';
import { CARRERA_LARGA } from '@/dominio/segunElDeporte';
import { HORARIO_DE_FABRICA, MAXIMO_QUE_SIGUE_EL_DESPERTAR } from '@/dominio/sigueElDespertar';
import { necesidad, necesidadesPara } from '@/dominio/sueno';
import { MARGENES, margenParaDormirte } from '@/dominio/sinReloj';
import { haySalud, pedirPermisos, saludPedida } from '@/salud/salud';
import { lista, plural, t } from '@/textos';
import { colores, letras } from '@/tema';
import { anunciar } from '../anuncio';
import { alTocarDeNuevo, useEsLaActual } from '../arriba';
import { PESTANAS } from '../Barra';
import { Boton, Icono, Pastilla } from '../comida/comunes';
import { cifraDePeso, duracion, fechaDiaMes, numero, region, sistemaDe, useEstado } from '../comida/datos';
import { avisar } from '../comida/registro';
import { Opcion } from '../entrada/piezas';
import { DEBAJO_DE_LA_HORA, FranjaBajoLaHora, LADOS } from '../franja';
import { HojaModal } from '../HojaModal';
import { ENTRA_FUNDIDO, SALE_FUNDIDO } from '../movimiento';
import { BotonDePaso } from '../paso';
import { usePersona } from '../ganchos';
import { aparatoPrincipal, Aparatos, nochesDelPrincipal } from './Aparatos';
import { EnQueSeBasa } from './Base';
import { Cuadro, type ColorDeCuadro } from './Cuadro';
import { Cuidados } from './Cuidados';
import { useFilaDeAscent } from '../ascent/filaDePerfil';
import { hayCompras, useEstadoDePremium } from '@/lib/premium';
import { avisoAlBorrarLaCuenta, HojaDeSuscripcion, valorDeSuscripcion } from '../premium/Premium';
import { ACOMODA, Aparece, EtiquetaDeGrupo, Parrafo, Segmento } from '../tarjetas';
import { borrarLaCuenta, borrarMisDatos, correoDeLaCuenta, correoSabido, exportarTodo, salirDeLaCuenta, type Espera } from './cuenta';
import { borrarFotoDePerfil, elegirFotoDePerfil, fotoDePerfil, guardarFotoDePerfil, hayFotoDePerfil } from './foto';
import { Avatar, Tarjeta } from './Persona';
import { TusRespuestas } from '../entrada/TusRespuestas';

/**
 * Una fila, con su cuadrito; `detalle` dice debajo, chico, qué hace. Lo que cambia ahí mismo no lleva la
 * flecha de entrar (aprobado en la galería el 9/11/2026): `interruptor` muestra la llave, que mueve el toque
 * de toda la fila, y `flecha` en false deja solo el valor. `esperando`: la ruedita en vez del valor.
 */
type Fila = {
  clave: string; titulo: string; icono: SFSymbol; color: ColorDeCuadro; valor?: string; detalle?: string; alTocar?: () => void; tipo?: 'ok' | 'peligro' | 'accion';
  interruptor?: boolean; flecha?: boolean; esperando?: boolean; punto?: boolean;
  /** Lo que todavía no está: su pastilla («Pronto») en vez del valor, y la fila no se toca. */
  pronto?: string;
};

/** Mientras se borra o se sale: lo que está pasando y, al terminar lo de la cuenta, «Listo». */
type EnEspera = { texto: string; listo: boolean };

const LLAVE = { true: colores.oro, false: 'rgba(239, 230, 207, 0.16)' };
/** El valor que cambia en una fila entra con un fundido, que no es movimiento: también con Reducir movimiento. */
const ENTRA_VALOR = FadeIn.duration(300).reduceMotion(ReduceMotion.Never);
/** El «Listo» del velo aparece creciendo apenas, como en la galería. */
const APARECE_LISTO: EntryExitAnimationFunction = () => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.8 }] },
    animations: { opacity: withTiming(1, { duration: 300 }), transform: [{ scale: withTiming(1, { duration: 300 }) }] },
  };
};
/** Si el velo quedara (la entrada no llegó), se va solo después de «Listo». */
const VELO_COMO_MUCHO = 4000;

/** Lo que anda solo con las dos apps vinculadas (antes en la sección de Ascent), sin «El gimnasio se enciende solo» (2/11). */
const FUNCIONES_CON_ASCENT: { clave: 'peso' | 'calorias' | 'objetivo' | 'proteina'; icono: SFSymbol }[] = [
  { clave: 'peso', icono: 'scalemass' },
  { clave: 'calorias', icono: 'bolt' },
  { clave: 'objetivo', icono: 'target' },
  { clave: 'proteina', icono: 'dumbbell' },
];

/** La versión, la de abajo de Perfil y la del correo de ayuda: «1.0.0 (6)». */
const VERSION = `${Constants.expoConfig?.version ?? '1.0.0'} (${Constants.expoConfig?.ios?.buildNumber ?? '1'})`;

/** Los esquemas que esta build declara (LSApplicationQueriesSchemes en app.json): de esos se puede preguntar antes de abrir. */
const ESQUEMAS_DECLARADOS: readonly string[] = (Constants.expoConfig?.ios?.infoPlist?.LSApplicationQueriesSchemes as string[] | undefined) ?? [];

/**
 * Abre algo de otra app y dice si pudo. Con el esquema declarado, antes pregunta si se puede (sin Mail, iOS
 * ofrecería restaurarlo). Sin declararlo (la build 6 no declara `mailto` ni `x-apple-health`), canOpenURL dice
 * siempre que no: se abre directo, como antes.
 */
async function abrirEnOtraApp(url: string): Promise<boolean> {
  const esquema = url.slice(0, url.indexOf(':'));
  if (ESQUEMAS_DECLARADOS.includes(esquema) && !(await Linking.canOpenURL(url).catch(() => false))) return false;
  return Linking.openURL(url).then(() => true, () => false);
}

/**
 * «Ayuda y contacto»: un correo con lo que ayuda a encontrar un problema (la versión, la actualización, el
 * iPhone y iOS); sin Mail, la página de contacto.
 */
function escribirnos() {
  const cuerpo = t('perfil.correo.cuerpo', {
    version: VERSION,
    actualizacion: Updates.updateId?.slice(0, 8) ?? '—',
    modelo: Device.modelName ?? Device.modelId ?? 'iPhone',
    ios: Device.osVersion ?? String(Platform.Version),
  });
  const url = `mailto:${CORREO}?subject=${encodeURIComponent(t('perfil.correo.asunto'))}&body=${encodeURIComponent(cuerpo)}`;
  abrirEnOtraApp(url).then((pudo) => {
    if (!pudo) abrirPagina('contacto');
  });
}

/** Con Salud ya pedida, iOS no vuelve a preguntar: «Conectada» abre Salud, donde se cambia qué lee Moss. Sin Salud, nada. */
function abrirSalud() {
  abrirEnOtraApp('x-apple-health://');
}

const PERFIL = PESTANAS.indexOf('perfil');
const PROGRESO = PESTANAS.indexOf('progreso');
const FUENTES = ['usda', 'off', 'taco', 'ciqual', 'cofid', 'estrellas'] as const;
/** «31 años» en el número y su unidad, para que la unidad vaya más chica. */
const partir = (texto: string): [string, string] => {
  const m = /^(\S+)\s+(.+)$/.exec(texto);
  return m ? [m[1], m[2]] : [texto, ''];
};

/** «Edad» → «edad», para «Menos edad». */
const minuscula = (texto: string) => texto.charAt(0).toLocaleLowerCase() + texto.slice(1);

export function PaginaDePerfil({ ancho, arriba, abajo, alIr }: { ancho: number; arriba: number; abajo: number; alIr?: (seccion: number) => void }) {
  const e = useEstado();
  const persona = usePersona();
  const ascent = useFilaDeAscent();
  const sistema = sistemaDe(e);
  const [creditos, setCreditos] = useState(false);
  // undefined mientras no se sabe: Persona no dice «Sin cuenta» un instante antes del correo.
  const [correo, setCorreo] = useState<string | null | undefined>(correoSabido);
  const conCuenta = correo !== null && correo !== undefined;
  const [salud, setSalud] = useState(false);
  const [hoja, setHoja] = useState<'editar' | 'privacidad' | 'recordatorios' | 'calidad' | 'corte' | 'aparatos' | 'entreno' | 'suscripcion' | 'cuidados' | 'base' | 'respuestas' | 'pais' | null>(null);
  // Tu foto queda solo en el teléfono, fuera del almacén (foto.ts): se lee al armar Perfil.
  const [foto, setFoto] = useState(fotoDePerfil);
  const premium = useEstadoDePremium();
  const scroll = useAnimatedRef<ScrollView>();
  // Lo que bajó el scroll: con eso aparece la franja bajo la hora.
  const scrollY = useScrollOffset(scroll);
  const reducido = useReducedMotion();
  // Solo el scroll de la sección que se ve sube con un toque en la hora; tocar otra vez la pestaña, arriba de todo.
  const esLaActual = useEsLaActual(PERFIL);
  useEffect(() => alTocarDeNuevo(PERFIL, () => scroll.current?.scrollTo({ y: 0, animated: !reducido })), [reducido, scroll]);
  // Con datos de otra cuenta en el teléfono, la sincronización no arranca (sincronizar.ts): se dice, en una línea.
  // Se sabe recién después de la primera vuelta: se mira cada vez que se llega a Perfil.
  const [otraCuenta, setOtraCuenta] = useState(datosDeOtraCuenta);
  const [mirado, setMirado] = useState({ esLaActual, correo });
  if (mirado.esLaActual !== esLaActual || mirado.correo !== correo) {
    setMirado({ esLaActual, correo });
    if (esLaActual) setOtraCuenta(datosDeOtraCuenta());
  }
  // Las esperas (aprobadas en la galería el 9/11/2026): exportar muestra la ruedita mientras arma los archivos;
  // borrar y salir, después de la alerta de iOS, el velo hasta que termina.
  const [exportando, setExportando] = useState(false);
  const [espera, setEspera] = useState<EnEspera | null>(null);
  // Con el teléfono vacío vuelve la entrada y el velo se va con Perfil; si no, se va solo después de «Listo».
  const listo = !!espera?.listo;
  useEffect(() => {
    if (!listo) return;
    const id = setTimeout(() => setEspera(null), VELO_COMO_MUCHO);
    return () => clearTimeout(id);
  }, [listo]);
  /** El velo de lo que borra o sale, con lo que dice mientras espera. */
  const velo = (texto: string): Espera => ({
    empezar: () => setEspera({ texto, listo: false }),
    listo: () => setEspera({ texto, listo: true }),
    dejar: () => setEspera(null),
  });
  const exportar = () => {
    if (exportando) return;
    setExportando(true);
    const listo = () => setExportando(false);
    exportarTodo(e.hoy, listo).catch(() => avisar(t('perfil.errorExportar'))).finally(listo);
  };
  /** Lo que se cambia ahí mismo vibra apenas, como elegir. */
  const alternar = (cambiar: () => void) => () => {
    Haptics.selectionAsync().catch(() => {});
    cambiar();
  };
  useEffect(() => {
    let vigente = true;
    let vez = 0;
    // El correo cambia con la sesión (al entrar, al salir, al renovarla cuando vuelve la conexión) y se
    // vuelve a mirar al volver a Moss: vale lo último que se pidió.
    const leer = () => {
      const esta = ++vez;
      correoDeLaCuenta().then((c) => {
        if (vigente && esta === vez) setCorreo(c);
      }).catch(() => {});
    };
    leer();
    const dejar = oirLaSesion(leer);
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') leer();
    });
    saludPedida().then(setSalud).catch(() => {});
    return () => {
      vigente = false;
      dejar();
      sub.remove();
    };
  }, []);

  const p = e.perfil;
  // false es un error; null, que se canceló (la hoja de Apple al borrar la cuenta) o que ya estaba en camino: no se dice nada.
  // Mientras borra, el velo con «Borrando…»; con lo de la cuenta borrado, «Listo», y vuelve la entrada.
  const confirmar = (titulo: string, texto: string, accion: (alListo: () => void) => Promise<boolean | null>, otros: AlertButton[] = []) =>
    Alert.alert(titulo, texto, [
      { text: t('comun.cancelar'), style: 'cancel' },
      ...otros,
      {
        text: t('perfil.borrar'), style: 'destructive', onPress: () => {
          const v = velo(t('perfil.borrando'));
          const fallo = () => {
            v.dejar();
            avisar(t('perfil.errorBorrar'));
          };
          v.empezar();
          accion(v.listo).then((ok) => {
            if (ok === false) fallo();
            else if (ok === null) v.dejar();
          }).catch(fallo);
        },
      },
    ]);
  // Los cuidados marcados (solo en este iPhone); sin ninguno, el «sin déficit» de antes, si estaba.
  const marcados = e.cuidados?.marcados.length ?? 0;
  const reglas = reglasDeCuidados(e);
  const filaDeCuidados: Fila = {
    clave: 'cuidado', titulo: t('perfil.cuidado'), icono: 'checkmark.shield', color: 'rosa', alTocar: () => setHoja('cuidados'),
    ...(marcados ? { valor: plural('cuidados.marcados', marcados), detalle: t('cuidados.perfilSub'), tipo: 'ok' as const }
      : p?.sinDeficit ? { valor: t('perfil.sinDeficit'), detalle: t('perfil.sinDeficitTexto'), tipo: 'ok' as const }
        : { valor: t('perfil.ninguno') }),
  };
  // Lo importante de un vistazo: la edad y la altura abren Editar perfil; el peso de hoy (la tendencia), Progreso.
  const peso = persona.pesoHoy === null ? null : cifraDePeso(persona.pesoHoy, sistema);
  const [edadValor, edadUnidad] = partir(p ? t('perfil.anios', { n: edadDe(p, e.hoy) }) : '—');
  const minis = [
    { clave: 'edad', etiqueta: t('perfil.edad'), valor: edadValor, unidad: edadUnidad, alTocar: () => setHoja('editar') },
    sistema === 'imperial'
      ? { clave: 'altura', etiqueta: t('perfil.altura'), valor: p ? piesYPulgadas(p.alturaCm) : '—', alTocar: () => setHoja('editar') }
      : { clave: 'altura', etiqueta: t('perfil.altura'), valor: p ? numero(p.alturaCm) : '—', unidad: 'cm', alTocar: () => setHoja('editar') },
    {
      clave: 'peso', etiqueta: t('perfil.mini.peso'), alTocar: () => alIr?.(PROGRESO),
      ...(peso ? { valor: peso.cifra, unidad: peso.unidad } : { valor: '—' }),
    },
  ];

  const nochesDeAparato = nochesDelPrincipal(e);
  const filaDeSuscripcion: Fila = { clave: 'suscripcion', titulo: t('suscripcion.titulo'), icono: 'star', color: 'oro', valor: valorDeSuscripcion(premium), alTocar: () => setHoja('suscripcion') };
  const conexiones: [string, Fila[]] = ['perfil.conexiones', [
    ...(haySalud() ? [{
      clave: 'salud', titulo: t('perfil.salud'), icono: 'heart' as const, color: 'rosa' as const, valor: salud ? t('perfil.conectada') : t('perfil.conectar'), punto: salud, tipo: salud ? 'ok' as const : 'accion' as const,
      alTocar: () => {
        if (salud) {
          abrirSalud();
          return;
        }
        pedirPermisos().then((si) => {
          setSalud(si);
          if (si) actualizarSalud().catch(() => {});
        }).catch(() => {});
      },
    }] : []),
    {
      clave: 'aparatos', titulo: t('perfil.aparatos.titulo'), icono: e.salud?.aparatos.some((a) => a.noches > 0) ? 'applewatch' : 'iphone', color: 'azul',
      valor: aparatoPrincipal(e.salud?.aparatos ?? []), detalle: nochesDeAparato ? plural('perfil.aparatos.noches', nochesDeAparato, { n: nochesDeAparato }) : undefined, alTocar: () => setHoja('aparatos'),
    },
    // Vinculada: «● Vinculada», y ver o desvincular. Sin vincular, lleva a la sección de Ascent. Apagada, solo dice «Pronto».
    CON_ASCENT ? { ...ascent, icono: 'circle.circle' as const, color: 'ascent' as const }
      : { clave: 'ascent', titulo: t('perfil.ascent'), icono: 'circle.circle' as const, color: 'ascent' as const, pronto: t('ascent.pronto.valor') },
  ]];
  const grupos: [string, Fila[]][] = [
    // Arriba, para que se encuentren: de dónde llega todo y, cuando se prenda, Ascent.
    conexiones,
    // La edad y la altura están en la tarjeta de arriba.
    ['perfil.tusDatos', p ? [
      { clave: 'sexo', titulo: t('perfil.sexo'), icono: 'person', color: 'azul', valor: t(`perfil.sexos.${p.sexo}`), alTocar: () => setHoja('editar') },
      { clave: 'actividad', titulo: t('perfil.actividad'), icono: 'figure.walk', color: 'salvia', valor: t(`perfil.actividades.${p.actividad}`), alTocar: () => setHoja('editar') },
      // Para qué comer antes y después de entrenar (Comida); con «sin déficit» o lo que apaga un cuidado, no se ve.
      ...(p.sinDeficit || reglas?.apagar.includes('antesDeEntrenar') ? [] : [{ clave: 'entreno', titulo: t('entreno.perfil.titulo'), icono: 'dumbbell' as const, color: 'oro' as const, valor: resumenDeEntreno(e.entreno), alTocar: () => setHoja('entreno') }]),
      filaDeCuidados,
      // El cuestionario del principio, para cambiarlo cuando quieras: la hoja es de la entrada.
      ...([{ clave: 'respuestas', titulo: t('perfil.respuestas'), icono: 'target' as const, color: 'oro' as const, detalle: t('perfil.respuestasTexto'), alTocar: () => setHoja('respuestas') }]),
    ] : []],
    ...(hayCompras() ? [['suscripcion.perfil.titulo', [filaDeSuscripcion]] as [string, Fila[]]] : []),
    ['perfil.preferencias', [
      // Las unidades y los números cambian ahí mismo: con su valor y sin la flecha de entrar.
      {
        clave: 'unidades', titulo: t('perfil.unidades'), icono: 'ruler', color: 'gris', valor: t(sistema === 'imperial' ? 'perfil.imperial' : 'perfil.metrico'), flecha: false,
        alTocar: alternar(() => elAlmacen().ponerSistema(sistema === 'imperial' ? 'metrico' : 'imperial')),
      },
      // El idioma es el del teléfono: iOS deja elegir otro solo para Moss, en sus Ajustes.
      { clave: 'idioma', titulo: t('perfil.idioma'), icono: 'globe', color: 'azul', valor: t('perfil.idiomaDelTelefono'), alTocar: () => { Linking.openSettings().catch(() => {}); } },
      // El país de los alimentos, aparte del idioma: los nombres de cada lugar y lo que se vende ahí.
      { clave: 'pais', titulo: t('perfil.pais.titulo'), icono: 'fork.knife', color: 'salvia', valor: e.paisDeAlimentos ? nombreDelPais(e.paisDeAlimentos) : t('perfil.pais.delTelefono'), alTocar: () => setHoja('pais') },
      { clave: 'corte', titulo: t('perfil.corte'), icono: 'sunrise', color: 'oro', valor: nombreDelCorte(e.corte), alTocar: () => setHoja('corte') },
      { clave: 'calidad', titulo: t('perfil.calidad'), icono: 'star', color: 'violeta', valor: t(`perfil.calidades.${e.calidad ?? 'automatica'}`), alTocar: () => setHoja('calidad') },
      { clave: 'recordatorios', titulo: t('perfil.recordatorios'), icono: 'bell', color: 'rosa', valor: hayAvisos(e) ? t('perfil.encendidos') : t('perfil.apagados'), alTocar: () => setHoja('recordatorios') },
      {
        clave: 'numeros', titulo: t('perfil.numeros'), icono: 'eye', color: 'gris', valor: t(e.numeros ? 'perfil.visibles' : 'perfil.ocultos'), detalle: t('perfil.numerosTexto'), flecha: false,
        alTocar: alternar(() => elAlmacen().ponerNumeros(!e.numeros)),
      },
    ]],
    ['perfil.tusDatosParaLlevar', [
      { clave: 'exportar', titulo: t('perfil.exportar'), icono: 'square.and.arrow.up', color: 'azul', valor: 'CSV', esperando: exportando, alTocar: exportar },
      { clave: 'privacidad', titulo: t('perfil.privacidad'), icono: 'lock', color: 'salvia', alTocar: () => setHoja('privacidad') },
      // Sin la cuenta, y solo si se elige (guía 5.1.1 de Apple): src/almacen/buzon.ts. Sí o no, con su llave.
      {
        clave: 'mejorarBase', titulo: t('perfil.mejorarBase'), icono: 'magnifyingglass', color: 'violeta', detalle: t('perfil.mejorarBaseTexto'), interruptor: e.mandarBusquedas,
        alTocar: alternar(() => elAlmacen().ponerMandarBusquedas(!e.mandarBusquedas)),
      },
      { clave: 'politica', titulo: t('perfil.politica'), icono: 'doc.text', color: 'gris', alTocar: () => abrirPagina('privacidad') },
      { clave: 'terminos', titulo: t('perfil.terminos'), icono: 'doc.text', color: 'gris', alTocar: () => abrirPagina('terminos') },
      { clave: 'contacto', titulo: t('perfil.contacto'), icono: 'envelope', color: 'gris', alTocar: escribirnos },
      { clave: 'borrarDatos', titulo: t('perfil.borrarDatos'), icono: 'trash', color: 'rosa', tipo: 'peligro', alTocar: () => confirmar(t('perfil.borrarDatosTitulo'), t('perfil.borrarDatosTexto'), borrarMisDatos) },
      ...(conCuenta ? [{ clave: 'borrarCuenta', titulo: t('perfil.borrarCuenta'), icono: 'trash' as const, color: 'rosa' as const, tipo: 'peligro' as const, alTocar: () => {
        const aviso = avisoAlBorrarLaCuenta(ascent.tipo === 'ok' ? `${t('perfil.borrarCuentaTexto')} ${t('perfil.borrarCuentaConAscent')}` : t('perfil.borrarCuentaTexto'));
        confirmar(t('perfil.borrarCuentaTitulo'), aviso.texto, borrarLaCuenta, aviso.botones);
      } }] : []),
    ]],
  ];

  return (
    <View style={{ width: ancho }}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ paddingTop: arriba + DEBAJO_DE_LA_HORA, paddingHorizontal: LADOS, paddingBottom: abajo + 40 }}
        showsVerticalScrollIndicator={false}
        scrollsToTop={esLaActual}
        scrollEventThrottle={16}
      >
        <Tarjeta nombre={e.nombre?.valor ?? ''} correo={correo === undefined ? '' : correo} foto={foto} alTocar={() => setHoja('editar')} minis={minis} />
        {otraCuenta && conCuenta && (
          <Aparece>
            <Text style={st.otraCuenta}>{t('perfil.otraCuenta')}</Text>
          </Aparece>
        )}
        {/* Al armar Perfil todo está en su lugar (y al irse, se va entero); en el medio, lo que aparece (la fila
            de borrar la cuenta cuando llega el correo, un detalle) entra con un fundido y lo de abajo se acomoda. */}
        <LayoutAnimationConfig skipEntering skipExiting>
          {grupos.filter(([, filas]) => filas.length).map(([titulo, filas]) => (
            <Aparece key={titulo}>
              <Text style={st.grupo}>{t(titulo as 'perfil.tusDatos')}</Text>
              <Animated.View layout={ACOMODA} style={st.lista}>
                {filas.map((f, i) => (
                  <Aparece key={f.clave}>
                    <FilaDePerfil f={f} separada={i > 0} />
                  </Aparece>
                ))}
              </Animated.View>
            </Aparece>
          ))}
          {/* De dónde salen los alimentos y las estrellas, con su licencia: se despliega. */}
          <Animated.View layout={ACOMODA}>
            <Text style={st.grupo}>{t('perfil.creditos')}</Text>
            <Animated.View layout={ACOMODA} style={st.lista}>
              <Pressable
                onPress={() => setCreditos((x) => !x)}
                style={({ pressed }) => [st.fila, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityState={{ expanded: creditos }}
              >
                <Cuadro icono="info.circle" color="gris" />
                <Text style={[st.filaTitulo, st.filaTextos]}>{t('perfil.mini.fuentes')}</Text>
                <Flecha abierta={creditos} />
              </Pressable>
              {creditos && (
                <Aparece style={st.creditos}>
                  {FUENTES.map((f) => <Text key={f} style={st.credito}>{t(`perfil.fuentes.${f}`)}</Text>)}
                </Aparece>
              )}
            </Animated.View>
          </Animated.View>
          {/* Al final, lo que anda solo si vinculas Ascent: información, no una función de Perfil. */}
          {CON_ASCENT && (
            <Animated.View layout={ACOMODA}>
              <Text style={st.grupo}>{t('perfil.informacion')}</Text>
              <Text style={st.informacion}>{t('perfil.informacionAscent')}</Text>
              <View style={st.lista}>
                {FUNCIONES_CON_ASCENT.map((f, i) => (
                  <View key={f.clave} style={[st.funcion, i > 0 && st.filaSeparada]}>
                    <Cuadro icono={f.icono} color="ascent" />
                    <View style={{ flex: 1 }}>
                      <Text style={st.funcionTitulo}>{t(`ascent.funciones.${f.clave}.titulo`)}</Text>
                      <Text style={st.funcionTexto}>{t(`ascent.funciones.${f.clave}.texto`)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
          {/* Abajo de todo, en qué se basa Moss: de dónde sale cada número y cómo se ordena lo que llega. */}
          <Animated.View layout={ACOMODA}>
            <Text style={st.grupo}>{t('perfil.baseGrupo')}</Text>
            <View style={st.lista}>
              <FilaDePerfil f={{ clave: 'base', titulo: t('perfil.base'), icono: 'info.circle', color: 'gris', detalle: t('perfil.baseSub'), alTocar: () => setHoja('base') }} />
            </View>
          </Animated.View>
          {conCuenta && (
            <Aparece>
            <Boton
              tipo="contorno"
              texto={t('perfil.cambiarCuenta')}
              alTocar={() => Alert.alert(t('perfil.cambiarCuenta'), t('perfil.cambiarCuentaTexto'), [
                { text: t('comun.cancelar'), style: 'cancel' },
                // Cambiar de cuenta también cierra la sesión: el mismo velo.
                { text: t('perfil.cambiarCuenta'), onPress: () => salirDeLaCuenta(undefined, velo(t('perfil.cerrandoSesion'))) },
              ])}
              estilo={st.salir}
            />
            <Boton
              tipo="contorno"
              texto={t('perfil.cerrarSesion')}
              alTocar={() => Alert.alert(t('perfil.cerrarSesionTitulo'), t('perfil.cerrarSesionTexto'), [
                { text: t('comun.cancelar'), style: 'cancel' },
                { text: t('perfil.cerrarSesion'), style: 'destructive', onPress: () => salirDeLaCuenta(undefined, velo(t('perfil.cerrandoSesion'))) },
              ])}
              estilo={st.salir}
            />
            </Aparece>
          )}
          <Animated.Text layout={ACOMODA} style={st.version}>{t('perfil.version', { v: VERSION })}</Animated.Text>
        </LayoutAnimationConfig>
      </ScrollView>
      <FranjaBajoLaHora scrollY={scrollY} arriba={arriba} />
      <VeloDeEspera espera={espera} />
      {hoja === 'editar' && (
        <EditarPerfil perfil={p} hoy={e.hoy} imperial={sistema === 'imperial'} nombreGuardado={e.nombre?.valor ?? ''} foto={foto} alGuardarFoto={setFoto} alCerrar={() => setHoja(null)} />
      )}
      {hoja === 'recordatorios' && <Avisos e={e} alCerrar={() => setHoja(null)} />}
      {hoja === 'calidad' && <CalidadDelCielo elegida={e.calidad} alCerrar={() => setHoja(null)} />}
      {hoja === 'corte' && <CorteDelDia elegido={e.corte} alCerrar={() => setHoja(null)} />}
      {hoja === 'pais' && <PaisDeLosAlimentos elegido={e.paisDeAlimentos} alCerrar={() => setHoja(null)} />}
      {hoja === 'entreno' && <CuandoEntrenas e={e} alCerrar={() => setHoja(null)} />}
      {hoja === 'aparatos' && <Aparatos alCerrar={() => setHoja(null)} />}
      {hoja === 'suscripcion' && <HojaDeSuscripcion alCerrar={() => setHoja(null)} />}
      {hoja === 'cuidados' && (
        <Cuidados
          e={e}
          alCerrar={() => setHoja(null)}
          alPonerAMano={() => {
            setHoja(null);
            alIr?.(PROGRESO);
          }}
        />
      )}
      {hoja === 'base' && <EnQueSeBasa alCerrar={() => setHoja(null)} />}
      <TusRespuestas visible={hoja === 'respuestas'} alCerrar={() => setHoja(null)} />
      {hoja === 'privacidad' && (
        <HojaModal abierta titulo={t('perfil.privacidad')} alCerrar={() => setHoja(null)}>
          {lista('perfil.privacidadTexto').map((parrafo, i) => {
            const texto = CON_ASCENT && i === 0 ? `${parrafo} ${t('perfil.privacidadConAscent')}` : parrafo;
            return <Parrafo key={texto}>{texto}</Parrafo>;
          })}
        </HojaModal>
      )}
    </View>
  );
}

/** La flecha de lo que se despliega: gira al abrirse. */
function Flecha({ abierta }: { abierta: boolean }) {
  const giro = useAnimatedStyle(() => ({ transform: [{ rotate: withTiming(abierta ? '90deg' : '0deg', { duration: 260 }) }] }), [abierta]);
  return (
    <Animated.View style={giro}>
      <Icono nombre="chevron.right" tam={12} color="rgba(239, 230, 207, 0.4)" peso="semibold" />
    </Animated.View>
  );
}

/**
 * Una fila de Perfil: su cuadrito, lo que es, debajo qué hace si hace falta, y su llave, su valor o la ruedita,
 * y la flecha si abre algo. `separada`: la línea de arriba, que empieza después del cuadrito.
 */
function FilaDePerfil({ f, separada }: { f: Fila; separada?: boolean }) {
  const llave = f.interruptor !== undefined;
  return (
    <Pressable
      onPress={f.alTocar}
      disabled={!f.alTocar}
      style={({ pressed }) => [st.fila, pressed && { backgroundColor: 'rgba(239, 230, 207, 0.05)' }]}
      accessibilityRole={llave ? 'switch' : f.alTocar ? 'button' : 'text'}
      accessibilityState={llave ? { checked: f.interruptor } : f.esperando ? { busy: true } : undefined}
    >
      {separada && <View style={st.linea} />}
      <Cuadro icono={f.icono} color={f.color} />
      <View style={st.filaTextos}>
        <Text style={[st.filaTitulo, f.tipo === 'peligro' && st.peligro]}>{f.titulo}</Text>
        {f.detalle ? <Aparece><Text style={st.filaDetalle}>{f.detalle}</Text></Aparece> : null}
      </View>
      {llave ? (
        // La llave se mira: la mueve el toque de toda la fila, como en Ajustes.
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Switch value={f.interruptor} trackColor={LLAVE} thumbColor={colores.pergamino} />
        </View>
      ) : f.esperando ? (
        <Animated.View key="esperando" entering={ENTRA_FUNDIDO} exiting={SALE_FUNDIDO} accessibilityLabel={t('perfil.exportando')}>
          <ActivityIndicator size="small" color="rgba(239, 230, 207, 0.66)" />
        </Animated.View>
      ) : f.pronto ? (
        <Text style={st.pronto}>{f.pronto}</Text>
      ) : f.valor ? (
        // Lo que cambia ahí mismo (las unidades, los números) entra con un fundido.
        <Animated.Text
          key={f.valor}
          entering={ENTRA_VALOR}
          style={[st.filaValor, f.tipo === 'ok' && { color: colores.salvia }, f.tipo === 'accion' && { color: colores.oroClaro }]}
          numberOfLines={1}
        >
          {f.punto ? '● ' : ''}{f.valor}
        </Animated.Text>
      ) : null}
      {f.alTocar && f.tipo !== 'peligro' && !llave && f.flecha !== false ? <Icono nombre="chevron.right" tam={12} color="rgba(239, 230, 207, 0.4)" peso="semibold" /> : null}
    </Pressable>
  );
}

/**
 * Mientras se borra o se cierra la sesión (aprobado en la galería el 9/11/2026): un velo con la ruedita y lo
 * que está pasando, que tapa todo (también la barra) y no deja tocar nada; con lo de la cuenta hecho, «Listo»,
 * y vuelve la entrada. Es un Modal: lo de Perfil no llega más arriba.
 */
function VeloDeEspera({ espera }: { espera: EnEspera | null }) {
  const reducido = useReducedMotion();
  // Lo último que dijo: mientras se va con el fundido, no queda vacío.
  const [dicha, setDicha] = useState(espera);
  if (espera && espera !== dicha) setDicha(espera);
  const listo = !!dicha?.listo;
  useEffect(() => {
    if (listo) anunciar(t('comun.listo'));
  }, [listo]);
  return (
    <Modal visible={espera !== null} transparent animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <View style={st.velo} accessibilityViewIsModal>
        {listo ? (
          <Animated.View key="listo" entering={reducido ? ENTRA_FUNDIDO : APARECE_LISTO}>
            <Icono nombre="checkmark" tam={28} color={colores.salvia} peso="medium" />
          </Animated.View>
        ) : (
          <ActivityIndicator size="large" color="rgba(239, 230, 207, 0.85)" />
        )}
        <Text style={st.veloTexto}>{listo ? t('comun.listo') : dicha?.texto}</Text>
      </View>
    </Modal>
  );
}

/**
 * Editar perfil, el de la galería: tu foto (solo en este teléfono), tu nombre (sin uno, Moss lo pide)
 * y tus datos, que antes tenían su hoja: el sexo, la edad, la altura y la actividad (las metas no
 * cambian por esto). Todo se guarda junto con «Guardar»; cerrar deja todo como estaba y, con algo
 * cambiado, antes pregunta si descartarlo.
 */
function EditarPerfil({ perfil, hoy, imperial, nombreGuardado, foto, alGuardarFoto, alCerrar }: {
  perfil: DatosDelPerfil | null; hoy: string; imperial: boolean; nombreGuardado: string; foto: string | null; alGuardarFoto: (foto: string | null) => void; alCerrar: () => void;
}) {
  const [nombre, setNombre] = useState(nombreGuardado);
  // La foto elegida, todavía sin guardar: undefined, que no se tocó; null, que se quitó.
  const [fotoNueva, setFotoNueva] = useState<string | null | undefined>(undefined);
  const [eligiendo, setEligiendo] = useState(false);
  const [sexo, setSexo] = useState<Sexo>(perfil?.sexo ?? 'f');
  const [edad, setEdad] = useState(perfil ? edadDe(perfil, hoy) : RANGOS_DEL_CUESTIONARIO.edad[0]);
  const [alturaCm, setAlturaCm] = useState(perfil?.alturaCm ?? RANGOS_DEL_CUESTIONARIO.alturaCm[0]);
  const [actividad, setActividad] = useState<Actividad>(perfil?.actividad ?? 'algo');
  const laFoto = fotoNueva === undefined ? foto : fotoNueva;
  // Lo cambiado y sin guardar: cerrar la hoja (con el dedo, tocando afuera o con la cruz) pregunta antes de descartarlo.
  const sinGuardar = nombre.trim() !== nombreGuardado.trim() || laFoto !== foto
    || (perfil !== null && (sexo !== perfil.sexo || edad !== edadDe(perfil, hoy) || alturaCm !== perfil.alturaCm || actividad !== perfil.actividad));
  // El selector se abre encima de la hoja, que queda abierta debajo.
  const elegir = (desde: 'camara' | 'carrete') => {
    if (eligiendo) return;
    setEligiendo(true);
    elegirFotoDePerfil(desde).then((uri) => { if (uri) setFotoNueva(uri); }).catch(() => {}).finally(() => setEligiendo(false));
  };
  const guardar = () => {
    elAlmacen().ponerNombre(nombre);
    const nacimiento = Number(hoy.slice(0, 4)) - edad;
    if (perfil && (sexo !== perfil.sexo || nacimiento !== perfil.nacimiento || alturaCm !== perfil.alturaCm || actividad !== perfil.actividad)) {
      elAlmacen().ponerDatos({ sexo, nacimiento, alturaCm, actividad });
    }
    if (fotoNueva === null) {
      borrarFotoDePerfil();
      alGuardarFoto(null);
    } else if (fotoNueva) {
      guardarFotoDePerfil(fotoNueva).then(alGuardarFoto).catch((error) => console.warn('Moss no pudo guardar tu foto', error));
    }
    alCerrar();
  };
  const paso = imperial ? CM_POR_PULGADA : 1;
  const altura = imperial ? piesYPulgadas(alturaCm) : `${numero(alturaCm)} cm`;
  const [edadMinima, edadMaxima] = RANGOS_DEL_CUESTIONARIO.edad;
  const [alturaMinima, alturaMaxima] = RANGOS_DEL_CUESTIONARIO.alturaCm;
  return (
    <HojaModal abierta titulo={t('perfil.editar.titulo')} alCerrar={alCerrar} sinGuardar={sinGuardar} pie={<Boton tipo="principal" texto={t('comun.guardar')} alTocar={guardar} />}>
      {/* «Quitar foto» aparece con la foto: lo de abajo se acomoda en vez de saltar. */}
      <Animated.View layout={ACOMODA} style={st.foto}>
        <Avatar foto={laFoto} nombre={nombre} tam={96} />
        {hayFotoDePerfil && (
          <>
            <View style={st.fotoBotones}>
              <Boton icono="camera" texto={t('perfil.editar.sacarFoto')} alTocar={() => elegir('camara')} desactivado={eligiendo} />
              <Boton icono="photo.on.rectangle" texto={t('perfil.editar.elegirFoto')} alTocar={() => elegir('carrete')} desactivado={eligiendo} />
            </View>
            {laFoto && (
              <Aparece>
                <Pressable onPress={() => setFotoNueva(null)} accessibilityRole="button" hitSlop={8}>
                  <Text style={st.quitarFoto}>{t('perfil.editar.quitarFoto')}</Text>
                </Pressable>
              </Aparece>
            )}
            <Animated.Text layout={ACOMODA} style={st.fotoNota}>{t('perfil.editar.fotoNota')}</Animated.Text>
          </>
        )}
      </Animated.View>
      <Animated.View layout={ACOMODA}>
        <EtiquetaDeGrupo>{t('perfil.editar.nombre')}</EtiquetaDeGrupo>
        {/* Sin un nombre guardado (Apple no lo trajo), Moss lo pide. */}
        {!nombreGuardado && <Text style={st.pedido}>{t('perfil.editar.sinNombre')}</Text>}
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder={t('perfil.editar.nombreCampo')}
          placeholderTextColor="rgba(239, 230, 207, 0.35)"
          maxLength={LARGO_DEL_NOMBRE}
          autoCapitalize="words"
          // Un nombre no se corrige: el corrector cambiaba los que no conoce.
          autoCorrect={false}
          spellCheck={false}
          autoComplete="name"
          textContentType="name"
          clearButtonMode="while-editing"
          keyboardAppearance="dark"
          returnKeyType="done"
          selectionColor={colores.oro}
          style={st.campo}
          accessibilityLabel={t('perfil.editar.nombre')}
        />
        {perfil && <>
        <EtiquetaDeGrupo>{t('perfil.sexo')}</EtiquetaDeGrupo>
        <Segmento<Sexo> opciones={[['f', t('perfil.sexos.f')], ['m', t('perfil.sexos.m')]]} elegida={sexo} alElegir={setSexo} />
        <EtiquetaDeGrupo>{t('perfil.edad')}</EtiquetaDeGrupo>
        <Pasos
          valor={t('perfil.anios', { n: edad })}
          menos={t('comun.menos', { que: minuscula(t('perfil.edad')) })}
          mas={t('comun.mas', { que: minuscula(t('perfil.edad')) })}
          alBajar={() => {
            if (edad <= edadMinima) return false;
            setEdad((x) => Math.max(edadMinima, x - 1));
          }}
          alSubir={() => {
            if (edad >= edadMaxima) return false;
            setEdad((x) => Math.min(edadMaxima, x + 1));
          }}
        />
        <EtiquetaDeGrupo>{t('perfil.altura')}</EtiquetaDeGrupo>
        <Pasos
          valor={altura}
          menos={t('comun.menos', { que: minuscula(t('perfil.altura')) })}
          mas={t('comun.mas', { que: minuscula(t('perfil.altura')) })}
          alBajar={() => {
            if (alturaCm <= alturaMinima) return false;
            setAlturaCm((x) => Math.max(alturaMinima, Math.round((x - paso) * 10) / 10));
          }}
          alSubir={() => {
            if (alturaCm >= alturaMaxima) return false;
            setAlturaCm((x) => Math.min(alturaMaxima, Math.round((x + paso) * 10) / 10));
          }}
        />
        <EtiquetaDeGrupo>{t('perfil.actividad')}</EtiquetaDeGrupo>
        <View style={{ gap: 8 }}>
          {(['poco', 'algo', 'activo', 'muy'] as const).map((a) => {
            const [titulo, detalle] = lista(`entrada.cuestionario.actividad.${a}`);
            return <Opcion key={a} titulo={titulo} detalle={detalle} elegida={a === actividad} alTocar={() => setActividad(a)} />;
          })}
        </View>
        <Parrafo chico>{t('perfil.tusDatosNota')}</Parrafo>
        </>}
      </Animated.View>
    </HojaModal>
  );
}

/** La calidad de toda la app: la automática (según el iPhone, y baja sola si hace falta) o una fija. */
function CalidadDelCielo({ elegida, alCerrar }: { elegida: Calidad | null; alCerrar: () => void }) {
  return (
    <HojaModal abierta titulo={t('perfil.calidad')} alCerrar={alCerrar}>
      <View style={{ gap: 8 }}>
        {([null, 'alta', 'media', 'baja'] as const).map((c) => (
          <Opcion key={c ?? 'automatica'} titulo={t(`perfil.calidades.${c ?? 'automatica'}`)} elegida={c === elegida} alTocar={() => elAlmacen().ponerCalidad(c)} />
        ))}
      </View>
      <Parrafo chico>{t('perfil.calidadTexto')}</Parrafo>
    </HojaModal>
  );
}

/** «4:00»: las horas del corte, sin el cero de adelante. */
const horaDelCorte = (minutos: number) => `${Math.floor(minutos / 60)}:${String(minutos % 60).padStart(2, '0')}`;
/** «A la medianoche», «A la 1:00» o «A las 4:00». */
const nombreDelCorte = (minutos: number) =>
  minutos === 0 ? t('perfil.corteMedianoche') : plural('perfil.corteALaHora', Math.floor(minutos / 60), { hora: horaDelCorte(minutos) });

/** Los países con nombres propios en la base de alimentos (alimentos/genericos.txt), y Estados Unidos. */
const PAISES = ['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'EC', 'SV', 'ES', 'US', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'DO', 'UY', 'VE'] as const;
type Pais = (typeof PAISES)[number];
/** «Uruguay»; de un país que no está en la lista, su código. */
const nombreDelPais = (pais: string) => (PAISES.includes(pais as Pais) ? t(`perfil.pais.nombres.${pais as Pais}`) : pais);

/**
 * El país de los alimentos, aparte del idioma (spec/nutricion.md, «Lo que se suma»): con Moss en inglés, una
 * uruguaya sigue encontrando primero lo que se vende acá. Sin elegir, el del teléfono.
 */
function PaisDeLosAlimentos({ elegido, alCerrar }: { elegido: string | null; alCerrar: () => void }) {
  const delTelefono = region();
  const paises = [...PAISES].sort((a, b) => nombreDelPais(a).localeCompare(nombreDelPais(b)));
  return (
    <HojaModal abierta titulo={t('perfil.pais.titulo')} alCerrar={alCerrar}>
      <Parrafo chico>{t('perfil.pais.texto')}</Parrafo>
      <View style={{ gap: 8, marginTop: 12 }}>
        <Opcion titulo={t('perfil.pais.delTelefono')} detalle={delTelefono ? nombreDelPais(delTelefono) : undefined} elegida={elegido === null} alTocar={() => elAlmacen().ponerPaisDeAlimentos(null)} />
        {paises.map((p) => <Opcion key={p} titulo={nombreDelPais(p)} elegida={p === elegido} alTocar={() => elAlmacen().ponerPaisDeAlimentos(p)} />)}
      </View>
    </HojaModal>
  );
}

/** A qué hora empieza el día (D32): lo de antes cuenta para el día anterior. */
function CorteDelDia({ elegido, alCerrar }: { elegido: number; alCerrar: () => void }) {
  return (
    <HojaModal abierta titulo={t('perfil.corte')} alCerrar={alCerrar}>
      <Parrafo chico>{t('perfil.corteTexto')}</Parrafo>
      <View style={{ gap: 8, marginTop: 12 }}>
        {CORTES.map((c) => (
          <Opcion
            key={c}
            titulo={nombreDelCorte(c)}
            detalle={c === CORTE_DE_FABRICA ? t('perfil.corteDeFabrica') : undefined}
            elegida={c === elegido}
            alTocar={() => elAlmacen().ponerCorte(c)}
          />
        ))}
      </View>
    </HojaModal>
  );
}

const COMIDAS_QUE_AVISAN: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

const MINUTOS_ANTES_DE_DORMIR = [15, 30, 45, 60] as const;
// Con anotar lo que tienes en la cabeza son dos más (el de la noche y «Lo que hay que hacer hoy»): por eso llega a 12.
const MAXIMOS_POR_DIA: readonly number[] = [2, 3, 4, 6, 8, MAXIMO_QUE_SIGUE_EL_DESPERTAR, 12];

/** Los interruptores sueltos de Perfil › Avisos: los de la noche que sigue tu despertar y lo que conviene. */
type Suelto = 'deuda' | 'melatonina' | 'luces' | 'revoluciones' | 'descarga' | 'gafas' | 'cafe' | 'entrenarTarde' | 'ultimaComida' | 'antesDeEntrenar' | 'despuesDeEntrenar' | 'partido' | 'carrera';
/** Las llaves de los avisos que piden permiso para encenderse. */
type Llave = 'dormir' | 'horario' | 'pesarse' | 'falta' | 'comidas' | Suelto;
/** «Más avisos», apagados de fábrica, con su cuadrito como en la galería. */
const MAS_AVISOS: readonly [Suelto, SFSymbol, ColorDeCuadro][] = [
  ['descarga', 'pencil', 'oro'], ['gafas', 'eyeglasses', 'gris'], ['cafe', 'cup.and.saucer', 'rosa'], ['entrenarTarde', 'timer', 'azul'],
  ['ultimaComida', 'fork.knife', 'violeta'], ['antesDeEntrenar', 'dumbbell', 'oro'], ['despuesDeEntrenar', 'dumbbell', 'salvia'],
];
/** Según el deporte: la víspera del partido, con partidos o choques, y la carrera larga, con correr, bici o nadar. */
const AVISOS_DEL_DEPORTE: readonly [Suelto, SFSymbol, ColorDeCuadro][] = [['partido', 'bolt', 'oro'], ['carrera', 'target', 'salvia']];

/** Sin permiso para avisar (iOS ya no vuelve a preguntar), se dice dónde darlo. */
function avisarSinPermiso() {
  Alert.alert(t('perfil.sinPermisoTitulo'), t('perfil.recordatoriosSinPermiso'), [
    { text: t('comun.cancelar'), style: 'cancel' },
    { text: t('perfil.abrirAjustes'), onPress: () => { Linking.openSettings().catch(() => {}); } },
  ]);
}

/** Un aviso en su tarjeta, como en la galería: el cuadrito, el nombre, la llave, qué hace y, prendido, lo de abajo. */
function TarjetaDeAviso({ icono, color, titulo, texto, prendido, alCambiar, derecha, children }: {
  icono: SFSymbol; color: ColorDeCuadro; titulo: string; texto?: string; prendido?: boolean; alCambiar?: (si: boolean) => void; derecha?: ReactNode; children?: ReactNode;
}) {
  const conLlave = prendido !== undefined && !!alCambiar;
  return (
    <Animated.View layout={ACOMODA} style={st.aviso}>
      <View style={st.avisoFila}>
        <View style={st.avisoTitulo}>
          <Cuadro icono={icono} color={color} />
          <Text style={st.llaveTexto}>{titulo}</Text>
        </View>
        {conLlave ? <Switch value={prendido} onValueChange={alCambiar} trackColor={LLAVE} thumbColor={colores.pergamino} accessibilityLabel={titulo} /> : derecha}
      </View>
      {!!texto && <Text style={st.avisoNota}>{texto}</Text>}
      {(!conLlave || prendido) && !!children && <Aparece style={st.avisoDebajo}>{children}</Aparece>}
    </Animated.View>
  );
}

/**
 * Los avisos (lo pediste el 22/10), con el día que sigue tu despertar (aprobado en la galería 49, el 16/11) y los
 * nombres de la galería 50 (el 17/11): en «Tu día» lo que viene prendido, en el orden del día (la deuda, pesarse, el
 * horario, tu periodo de melatonina, bajar las luces, bajar el ritmo y acostarte); en «Más avisos», lo apagado de
 * fábrica, con anotar lo que tienes en la cabeza, que también prende la nota de Sueño y «Lo que hay que hacer hoy».
 * Lo que nunca se tocó muestra lo de fábrica (avisosDe); lo elegido se respeta. Los de cada hábito se eligen en el hábito.
 */
function Avisos({ e, alCerrar }: { e: Estado; alCerrar: () => void }) {
  const comidas = comidasQueAvisan(e);
  const a = avisosDe(e);
  const [sinPermiso, setSinPermiso] = useState(false);
  // Tus horas de comer se cambian en Tus respuestas, en «¿Cómo es tu día?»: se abre encima y se vuelve acá.
  const [tuDia, setTuDia] = useState(false);
  // La llave que se prende queda prendida mientras se pide el permiso (antes volvía sola a apagado, también
  // con el diálogo de iOS arriba); si se niega, se apaga. Si se había negado antes (iOS ya no pregunta), se
  // dice cómo darlo desde Ajustes; recién negado en el diálogo, no hace falta repetirlo.
  const [pidiendo, setPidiendo] = useState<Llave | null>(null);
  const conPermiso = (llave: Llave, hacer: () => void) => {
    setPidiendo(llave);
    pedirPermisoDeAvisosConMotivo().then((motivo) => {
      setSinPermiso(motivo !== 'si');
      if (motivo === 'si') hacer();
      else if (motivo === 'soloEnAjustes') avisarSinPermiso();
    }).catch(() => setSinPermiso(true)).finally(() => setPidiendo(null));
  };
  const prendida = (llave: Llave, si: boolean) => pidiendo === llave || si;
  const suelto = (q: Suelto) => ({
    prendido: prendida(q, !!a[q]?.encendido),
    alCambiar: (si: boolean) => (si ? conPermiso(q, () => elAlmacen().ponerAvisos({ [q]: { encendido: true } })) : elAlmacen().ponerAvisos({ [q]: { encendido: false } })),
  });
  const encender = (si: boolean) => {
    if (!si) {
      // Vacío y no sin elegir: sin elegir son las de fábrica, que avisan.
      elAlmacen().ponerRecordatorios([]);
      return;
    }
    conPermiso('comidas', () => elAlmacen().ponerRecordatorios(['desayuno', 'almuerzo', 'cena']));
  };
  const dormir = a.dormir;
  const encenderDormir = (si: boolean) => {
    if (!si) elAlmacen().ponerAvisos({ dormir: { encendido: false, antes: dormir?.antes } });
    else conPermiso('dormir', () => elAlmacen().ponerAvisos({ dormir: { encendido: true, antes: dormir?.antes ?? 30 } }));
  };
  // La hora de acostarte esta noche y de dónde sale, como dice el aviso: de tu periodo de melatonina, con lo que
  // tardas en dormirte, o, sin periodo, de la hora de despertarte mañana y lo que vas a dormir.
  const sueno = suenoDelDia(e);
  const horas = sueno ? horasDeSueno(e.hoy, sueno) : null;
  const periodo = horas?.periodo ?? null;
  const estaNoche = horas?.acostarse ?? null;
  const manana = horas?.despertarManana ?? null;
  const dormidas = horas ? duerme(horas) : null;
  const margen = margenParaDormirte(e.latencia);
  const edad = e.perfil ? edadDe(e.perfil, e.hoy) : null;
  // El máximo que vale: el que elegiste o, sin elegir, el de fábrica, que sube solo con anotar lo que tienes en la
  // cabeza y con las gafas (maximoDeFabrica). Si quedó en uno que no está entre los de siempre (11 o 13), va con ellos.
  const maximo = a.maximoPorDia ?? MAXIMO_POR_DIA;
  const subioSolo = e.avisos.maximoPorDia === undefined && maximo > MAXIMO_QUE_SIGUE_EL_DESPERTAR;
  const maximos = MAXIMOS_POR_DIA.includes(maximo) ? MAXIMOS_POR_DIA : [...MAXIMOS_POR_DIA, maximo].sort((x, y) => x - y);
  // El horario: qué comidas avisan, cada una a tu hora de comer (una sola lista, horasDeComerDe), que acá se ve y en
  // Tus respuestas se cambia. Apagado queda vacío, no sin elegir: así no vuelve el de fábrica. Lo que en tu día dice
  // «No suelo» no avisa.
  const horario = a.horario ?? [];
  const conHorario = horario.length > 0;
  const horaDe = horasDeComerDe(e);
  const noSuele = noSueleDe(e);
  const encenderHorario = (si: boolean) => {
    if (!si) elAlmacen().ponerAvisos({ horario: [] });
    else conPermiso('horario', () => elAlmacen().ponerAvisos({ horario: [...HORARIO_DE_FABRICA] }));
  };
  const alternarHorario = (c: Comida) => {
    const nuevo = horario.includes(c) ? horario.filter((x) => x !== c) : COMIDAS_QUE_AVISAN.filter((x) => x === c || horario.includes(x));
    elAlmacen().ponerAvisos({ horario: nuevo });
  };
  const pesarse = a.pesarse;
  const encenderPesarse = (si: boolean) => {
    if (!si) elAlmacen().ponerAvisos({ pesarse: { encendido: false, todos: pesarse?.todos } });
    else conPermiso('pesarse', () => elAlmacen().ponerAvisos({ pesarse: { encendido: true, todos: pesarse?.todos } }));
  };
  const alternar = (c: Comida) => {
    const nueva = comidas.includes(c) ? comidas.filter((x) => x !== c) : COMIDAS_QUE_AVISAN.filter((x) => x === c || comidas.includes(x));
    // Sin ninguna queda vacío y no sin elegir: sin elegir son las de fábrica, que avisan.
    elAlmacen().ponerRecordatorios(nueva);
  };
  // Lo que un cuidado de salud apaga (la última comida, lo de entrenar, pesarte) no se ofrece. Los del deporte, solo
  // con ese deporte en Perfil › Entrenamiento (delDeporte).
  const reglas = reglasDeCuidados(e);
  const deporte = delDeporte(e.entreno, e.hoy, e.hoy);
  const mas = [...MAS_AVISOS, ...AVISOS_DEL_DEPORTE.filter(([q]) => (q === 'partido' ? deporte.partido : deporte.carrera))]
    .filter(([q]) => !(reglas && (QUE_CONVIENE as readonly string[]).includes(q) && apagaLoQueConviene(q as QueConviene, reglas)));
  const conPesarse = !reglas?.apagar.includes('pesarse');
  // Cada tarjeta se acomoda cuando la de arriba crece (las pastillas de dormir, el horario, el permiso).
  return (
    <HojaModal abierta titulo={t('perfil.avisos.titulo')} alCerrar={alCerrar}>
      <Text style={[st.grupo, st.grupoPrimero]}>{t('perfil.avisos.tuDia')}</Text>
      <Text style={st.informacion}>{t('perfil.avisos.tuDiaTexto')}</Text>
      <TarjetaDeAviso icono="moon" color="azul" titulo={t('perfil.avisos.deuda')} texto={t('perfil.avisos.deudaTexto')} {...suelto('deuda')} />
      {conPesarse && <TarjetaDeAviso icono="scalemass" color="salvia" titulo={t('perfil.avisos.pesarse')} texto={t('perfil.avisos.pesarseTexto')} prendido={prendida('pesarse', !!pesarse?.encendido)} alCambiar={encenderPesarse}>
        <View style={st.comidas}>
          <Pastilla texto={t('perfil.avisos.pesarseControl')} elegida={!pesarse?.todos} alTocar={() => elAlmacen().ponerAvisos({ pesarse: { encendido: true } })} />
          <Pastilla texto={t('perfil.avisos.pesarseTodos')} elegida={!!pesarse?.todos} alTocar={() => elAlmacen().ponerAvisos({ pesarse: { encendido: true, todos: true } })} />
        </View>
      </TarjetaDeAviso>}
      <TarjetaDeAviso
        icono="fork.knife" color="oro" titulo={t('perfil.avisos.horario')} texto={`${t('perfil.avisos.horarioTexto')} ${t('perfil.avisos.horarioTextoDia')}`}
        prendido={prendida('horario', conHorario)} alCambiar={encenderHorario}
      >
        <View style={st.horario}>
          {COMIDAS_QUE_AVISAN.map((c) => {
            const nombre = t(`comida.comidas.${c}`);
            const no = noSuele(c);
            const hora = horaDe(c);
            return (
              <Animated.View key={c} layout={ACOMODA} style={st.horarioFila}>
                <Pastilla texto={nombre} elegida={!no && horario.includes(c)} alTocar={() => (no ? setTuDia(true) : alternarHorario(c))} estilo={no && st.horarioNo} />
                <View style={st.horarioHora}>
                  {no ? (
                    <Text style={st.horarioDe}>{t('perfil.avisos.noSueles')}</Text>
                  ) : (
                    <>
                      {hora.de === 'aMano' && <Animated.Text entering={ENTRA_FUNDIDO} style={st.horarioDe}>{t('perfil.avisos.horaAMano')}</Animated.Text>}
                      <Text style={st.horarioValor}>{horaDeReloj(hora.minutos)}</Text>
                    </>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
        <Text style={st.avisoNota}>{t('perfil.avisos.horasTexto')}</Text>
        <Pressable onPress={() => setTuDia(true)} accessibilityRole="button" style={({ pressed }) => [st.horasCambiar, pressed && st.apretado]}>
          <Text style={st.horasCambiarTexto}>{t('perfil.avisos.horasCambiar')}</Text>
          <Icono nombre="chevron.right" tam={11} color={colores.oro} peso="semibold" />
        </Pressable>
      </TarjetaDeAviso>
      <TarjetaDeAviso icono="moon.stars" color="violeta" titulo={t('perfil.avisos.melatonina')} texto={t('perfil.avisos.melatoninaTexto')} {...suelto('melatonina')} />
      <TarjetaDeAviso icono="lightbulb" color="gris" titulo={t('perfil.avisos.luces')} texto={t('perfil.avisos.lucesTexto')} {...suelto('luces')} />
      <TarjetaDeAviso icono="speedometer" color="salvia" titulo={t('perfil.avisos.revoluciones')} texto={t('perfil.avisos.revolucionesTexto')} {...suelto('revoluciones')} />
      <TarjetaDeAviso
        icono="moon" color="azul" titulo={t('perfil.avisos.dormir')}
        texto={estaNoche !== null && periodo
          ? t('perfil.avisos.dormirTexto', { hora: horaDeReloj(estaNoche), margen, desde: horaDeReloj(periodo.desde), hasta: horaDeReloj(periodo.hasta) })
          : estaNoche !== null && manana !== null && dormidas !== null
            ? t('perfil.avisos.dormirSinPeriodo', { hora: horaDeReloj(estaNoche), despertar: horaDeReloj(manana), horas: duracion(dormidas), latencia: margen })
            : t('perfil.avisos.dormirSinDatos')}
        prendido={prendida('dormir', !!dormir?.encendido)} alCambiar={encenderDormir}
      >
        <View style={st.comidas}>
          {MINUTOS_ANTES_DE_DORMIR.map((n) => (
            <Pastilla key={n} texto={t('perfil.avisos.antes', { n })} elegida={(dormir?.antes ?? 30) === n} alTocar={() => elAlmacen().ponerAvisos({ dormir: { encendido: true, antes: n } })} />
          ))}
        </View>
      </TarjetaDeAviso>
      {/* Tardo en dormirme: el mismo margen de Sueño › Afinar (17/11/2026), de fábrica o el que elijas. */}
      <TarjetaDeAviso icono="clock" color="violeta" titulo={t('perfil.avisos.tardo')}>
        <View style={st.comidas}>
          {MARGENES.map((n) => (
            <Pastilla key={n} texto={t('perfil.avisos.minutos', { n })} elegida={margen === n} alTocar={() => elAlmacen().ponerLatencia(n)} />
          ))}
        </View>
        <Text style={st.avisoNota}>{t('perfil.avisos.tardoTexto')}</Text>
      </TarjetaDeAviso>
      {/* Necesito dormir: lo de tu edad o lo que elijas, dentro de lo de tu edad (necesidadesPara, en sueno.ts). */}
      {edad !== null && <TarjetaDeAviso icono="moon" color="azul" titulo={t('perfil.avisos.necesito')}>
        <View style={st.comidas}>
          <Pastilla texto={t('perfil.avisos.necesitoEdad', { h: duracion(necesidad(edad)) })} elegida={e.necesidad === null} alTocar={() => elAlmacen().ponerNecesidad(null)} />
          {necesidadesPara(edad).map((m) => (
            <Pastilla key={m} texto={duracion(m)} elegida={e.necesidad === m} alTocar={() => elAlmacen().ponerNecesidad(m)} />
          ))}
        </View>
        <Text style={st.avisoNota}>{t(edad < 18 ? 'perfil.avisos.necesitoTextoMenor' : 'perfil.avisos.necesitoTexto')}</Text>
      </TarjetaDeAviso>}

      <Animated.Text layout={ACOMODA} style={st.grupo}>{t('perfil.avisos.mas')}</Animated.Text>
      <Animated.Text layout={ACOMODA} style={st.informacion}>{t('perfil.avisos.masTexto')}</Animated.Text>
      {mas.map(([q, icono, color]) => (
        <TarjetaDeAviso key={q} icono={icono} color={color} titulo={t(`perfil.avisos.${q}`)} texto={t(`perfil.avisos.${q}Texto`)} {...suelto(q)} />
      ))}
      <TarjetaDeAviso icono="bell" color="rosa" titulo={t('perfil.recordatoriosLlave')} texto={t('perfil.recordatoriosTexto')} prendido={prendida('comidas', !!comidas?.length)} alCambiar={encender}>
        <View style={st.comidas}>
          {COMIDAS_QUE_AVISAN.map((c) => <Pastilla key={c} texto={t(`comida.comidas.${c}`)} elegida={!!comidas?.includes(c)} alTocar={() => alternar(c)} />)}
        </View>
      </TarjetaDeAviso>
      <TarjetaDeAviso
        icono="bolt" color="violeta" titulo={t('perfil.avisos.falta')} texto={t('perfil.avisos.faltaTexto')}
        prendido={prendida('falta', conLoQueFalta(a, algunAviso({ avisos: a, recordatorios: comidas })))}
        alCambiar={(si) => (si ? conPermiso('falta', () => elAlmacen().ponerAvisos({ falta: { encendido: true } })) : elAlmacen().ponerAvisos({ falta: { encendido: false } }))}
      />
      {sinPermiso && (
        <Aparece>
          <Pressable onPress={() => { Linking.openSettings().catch(() => {}); }} accessibilityRole="button">
            <Parrafo>{t('perfil.recordatoriosSinPermiso')}</Parrafo>
          </Pressable>
        </Aparece>
      )}
      <Animated.Text layout={ACOMODA} style={st.grupo}>{t('perfil.avisos.maximo')}</Animated.Text>
      <Animated.View layout={ACOMODA} style={st.comidas}>
        {maximos.map((n) => (
          <Aparece key={n}>
            <Pastilla texto={String(n)} elegida={maximo === n} alTocar={() => elAlmacen().ponerAvisos({ maximoPorDia: n })} />
          </Aparece>
        ))}
      </Animated.View>
      {subioSolo && <Aparece><Text style={[st.informacion, st.maximoSolo]}>{t('perfil.avisos.maximoSolo', { n: maximo })}</Text></Aparece>}
      <Animated.Text layout={ACOMODA} style={[st.informacion, st.maximoTexto]}>{t('perfil.avisos.maximoTextoConviene')}</Animated.Text>
      <TusRespuestas visible={tuDia} desde="dia" alCerrar={() => setTuDia(false)} />
    </HojaModal>
  );
}

const DURACIONES = [30, 45, 60, 90, 120] as const;
const DURACIONES_DE_CARRERA = [60, 90, 120, 180, 240] as const;
/** Lunes primero, como en la galería. */
const DIAS_DE_LA_SEMANA: readonly DiaSemana[] = [1, 2, 3, 4, 5, 6, 0];
/** La hora de entrenar, de a un cuarto de hora entre las 5:00 y las 23:00. */
const PRIMER_ENTRENO = 5 * 60;
const ULTIMO_ENTRENO = 23 * 60;
/** Un partido, no antes de las 8:00. */
const PRIMER_PARTIDO = 8 * 60;

/** Si suena algún aviso: los de comidas sin anotar, dormir, el horario, pesarse, un hábito o lo que falta, si se prendió. */
function hayAvisos(e: Estado): boolean {
  const avisos = avisosDe(e);
  return algunAviso({ avisos, recordatorios: comidasQueAvisan(e) }) || !!avisos.falta?.encendido;
}

/** «Lun Mié Vie · 19:00», «Todos los días · 19:00» o que todavía no se cargó: corto, para que entre en la fila. */
function resumenDeEntreno(entreno: Entreno | null): string {
  if (!entreno || !entreno.dias.length) return t('entreno.perfil.sinCargar');
  const letras = lista('fecha.diasCortos');
  const dias = DIAS_DE_LA_SEMANA.filter((d) => entreno.dias.includes(d));
  const cuales = dias.length === 7 ? t('entreno.perfil.todos')
    : dias.length === 5 && dias.every((d) => d >= 1 && d <= 5) ? t('entreno.perfil.entreSemana')
      : dias.length <= 3 ? dias.map((d) => letras[d]).join(' ')
        : t('entreno.perfil.nDias', { n: dias.length });
  return `${cuales} · ${horaDeReloj(entreno.hora)}`;
}

/**
 * Cuándo entrenas y qué haces (lo pediste el 26/10; según el deporte, como en la galería: galeria/src/perfil.js):
 * los días, la hora y la duración del horario de los avisos, los deportes (varios a la vez, los del cuestionario),
 * el partido con partidos o choques, la próxima carrera con correr, bici o nadar, la categoría de peso con
 * combate y cuánto tardas en llegar. Queda en el teléfono; las sesiones de cada deporte acompañan al horario
 * (entrenoConCambios) y se contestan una por una en «Tus respuestas».
 */
function CuandoEntrenas({ e, alCerrar }: { e: Estado; alCerrar: () => void }) {
  const entreno: Entreno = e.entreno ?? { dias: [], hora: 19 * 60, minutos: 60, tipo: 'fuerza' };
  // Sin días también se guarda: así la hora, la duración y los deportes vuelven al elegir otro día.
  const poner = (cambios: CambiosDelEntreno) => elAlmacen().ponerEntreno(entrenoConCambios(entreno, cambios));
  const alternarDia = (d: DiaSemana) => poner({ dias: entreno.dias.includes(d) ? entreno.dias.filter((x) => x !== d) : [...entreno.dias, d] });
  const letras = lista('fecha.diasCortos');
  const tipos = deportesDePerfil(entreno);
  const preguntas = preguntasDelEntreno(tipos);
  const partido = preguntas.partidos ? entreno.partidos ?? null : null;
  const carrera = tipos.includes('resistencia') ? entreno.carrera ?? null : null;
  const viaje = entreno.viaje ?? VIAJE_DE_FABRICA;
  const alternarDeporte = (x: Deporte) => {
    const nuevos = tipos.includes(x) ? tipos.filter((d) => d !== x) : [...tipos, x];
    // Al menos uno: el último no se saca.
    if (nuevos.length) poner({ tipos: nuevos });
  };
  const moverPartido = (signo: 1 | -1) => {
    if (!partido) return false;
    const hora = partido.hora == null ? 16 * 60 : partido.hora + signo * 15;
    if (hora < PRIMER_PARTIDO || hora > ULTIMO_ENTRENO) return false;
    poner({ partidos: { ...partido, hora } });
  };
  const moverCarrera = (signo: 1 | -1) => {
    if (!carrera) return false;
    const fecha = sumarDias(carrera.fecha, signo);
    if (fecha <= e.hoy) return false;
    poner({ carrera: { ...carrera, fecha } });
  };
  return (
    <HojaModal abierta titulo={t('entreno.perfil.titulo')} alCerrar={alCerrar}>
      <Parrafo chico>{t('entreno.perfil.textoConAvisos')}</Parrafo>
      <TarjetaDeAviso icono="dumbbell" color="oro" titulo={t('entreno.perfil.dias')}>
        <View style={st.dias}>
          {DIAS_DE_LA_SEMANA.map((d) => <Pastilla key={d} texto={letras[d]} elegida={entreno.dias.includes(d)} alTocar={() => alternarDia(d)} estilo={st.dia} estiloTexto={st.diaTexto} />)}
        </View>
      </TarjetaDeAviso>
      {entreno.dias.length > 0 && (
        <Aparece>
          <TarjetaDeAviso
            icono="clock"
            color="azul"
            titulo={t('entreno.perfil.hora')}
            derecha={(
              <Pasos
                valor={horaDeReloj(entreno.hora)}
                menos={t('perfil.pasos.temprano', { que: t('entreno.perfil.titulo') })}
                mas={t('perfil.pasos.tarde', { que: t('entreno.perfil.titulo') })}
                alBajar={() => {
                  if (entreno.hora <= PRIMER_ENTRENO) return false;
                  poner({ hora: Math.max(PRIMER_ENTRENO, entreno.hora - 15) });
                }}
                alSubir={() => {
                  if (entreno.hora >= ULTIMO_ENTRENO) return false;
                  poner({ hora: Math.min(ULTIMO_ENTRENO, entreno.hora + 15) });
                }}
              />
            )}
          />
          <TarjetaDeAviso icono="timer" color="violeta" titulo={t('entreno.perfil.duracion')}>
            <View style={st.comidas}>
              {DURACIONES.map((m) => <Pastilla key={m} texto={t('entreno.perfil.minutos', { n: m })} elegida={entreno.minutos === m} alTocar={() => poner({ minutos: m })} />)}
            </View>
          </TarjetaDeAviso>
          {/* Los mismos deportes que el cuestionario, varios a la vez. */}
          <TarjetaDeAviso icono="figure.walk" color="salvia" titulo={t('entreno.perfil.tipo')}>
            <View style={st.comidas}>
              {DEPORTES.map((x) => <Pastilla key={x} texto={lista(`entrada.cuestionario.entreno.tipos.${x}`)[0]} elegida={tipos.includes(x)} alTocar={() => alternarDeporte(x)} />)}
            </View>
            <Text style={st.avisoNota}>{t('entrada.cuestionario.entreno.texto')}</Text>
          </TarjetaDeAviso>
          {/* Con partidos o choques: qué día juegas y, si se sabe, a qué hora empieza (con la hora se sabe si terminas tarde). */}
          {preguntas.partidos && (
            <Aparece>
              <TarjetaDeAviso icono="bolt" color="oro" titulo={t('entreno.perfil.partidos')} prendido={!!partido} alCambiar={(si) => poner({ partidos: si ? { dia: 6, hora: null } : null })}>
                {partido && (
                  <>
                    <Text style={st.deporteEtiqueta}>{t('entreno.perfil.partidoDia')}</Text>
                    <View style={st.dias}>
                      {DIAS_DE_LA_SEMANA.map((d) => <Pastilla key={d} texto={letras[d]} elegida={partido.dia === d} alTocar={() => poner({ partidos: { ...partido, dia: d } })} estilo={st.dia} estiloTexto={st.diaTexto} />)}
                    </View>
                    <View style={st.deporteFila}>
                      <Text style={st.deporteNombre}>{t('entreno.perfil.partidoHora')}</Text>
                      <View style={st.deporteLado}>
                        <Pastilla texto={t('entreno.perfil.partidoVaria')} elegida={partido.hora == null} alTocar={() => poner({ partidos: { ...partido, hora: null } })} />
                        <Pasos
                          valor={partido.hora == null ? '—:—' : horaDeReloj(partido.hora)}
                          menos={t('perfil.pasos.temprano', { que: t('entreno.perfil.partidoHora') })}
                          mas={t('perfil.pasos.tarde', { que: t('entreno.perfil.partidoHora') })}
                          alBajar={() => moverPartido(-1)}
                          alSubir={() => moverPartido(1)}
                        />
                      </View>
                    </View>
                    <Text style={st.avisoNota}>{t('entreno.perfil.partidoTexto')}</Text>
                  </>
                )}
              </TarjetaDeAviso>
            </Aparece>
          )}
          {/* Con correr, bici o nadar: la próxima carrera, con la fecha y cuánto dura (lo de los dos días antes, solo si es larga). */}
          {tipos.includes('resistencia') && (
            <Aparece>
              <TarjetaDeAviso icono="target" color="salvia" titulo={t('entreno.perfil.carrera')} prendido={!!carrera} alCambiar={(si) => poner({ carrera: si ? { fecha: sumarDias(e.hoy, 11), minutos: 120 } : null })}>
                {carrera && (
                  <>
                    <View style={[st.deporteFila, { marginTop: 0 }]}>
                      <Text style={st.deporteNombre}>{t('entreno.perfil.carreraFecha')}</Text>
                      <Pasos
                        valor={`${letras[diaDeLaSemana(carrera.fecha)]} ${fechaDiaMes(carrera.fecha)}`}
                        menos={t('perfil.pasos.temprano', { que: t('entreno.perfil.carrera') })}
                        mas={t('perfil.pasos.tarde', { que: t('entreno.perfil.carrera') })}
                        alBajar={() => moverCarrera(-1)}
                        alSubir={() => moverCarrera(1)}
                      />
                    </View>
                    <Text style={st.deporteEtiqueta}>{t('entreno.perfil.duracion')}</Text>
                    <View style={st.comidas}>
                      {DURACIONES_DE_CARRERA.map((m) => <Pastilla key={m} texto={duracion(m)} elegida={carrera.minutos === m} alTocar={() => poner({ carrera: { ...carrera, minutos: m } })} />)}
                    </View>
                    <Text style={st.avisoNota}>{t(carrera.minutos > CARRERA_LARGA ? 'entreno.perfil.carreraTexto' : 'entreno.perfil.carreraCorta')}</Text>
                  </>
                )}
              </TarjetaDeAviso>
            </Aparece>
          )}
          {preguntas.categoriaDePeso && (
            <Aparece>
              <TarjetaDeAviso icono="scalemass" color="gris" titulo={t('entreno.perfil.categoria')} prendido={!!entreno.categoriaDePeso} alCambiar={(si) => poner({ categoriaDePeso: si })} />
            </Aparece>
          )}
          <TarjetaDeAviso icono="mappin.and.ellipse" color="gris" titulo={t('entreno.perfil.viaje')}>
            <View style={st.comidas}>
              {VIAJES.map((m) => <Pastilla key={m} texto={m ? t('entreno.perfil.minutos', { n: m }) : t('entreno.perfil.viajeCasa')} elegida={viaje === m} alTocar={() => poner({ viaje: m })} />)}
            </View>
            <Text style={st.avisoNota}>{t('entreno.perfil.viajeTexto')}</Text>
          </TarjetaDeAviso>
          <TarjetaDeAviso icono="fork.knife" color="rosa" titulo={t('entreno.perfil.ver')} texto={t('entreno.porQue.medico')} prendido={e.verEntreno} alCambiar={(v) => elAlmacen().ponerVerEntreno(v)} />
        </Aparece>
      )}
    </HojaModal>
  );
}

/**
 * Un valor con «−» y «+»: mantenidos, repiten (de 7:00 a 12:00 eran veinte toques). Cada botón dice qué
 * cambia y, con VoiceOver, después de cada paso se dice el valor nuevo. `alBajar` y `alSubir` dan false en
 * el tope: ahí no vibra y deja de repetir.
 */
function Pasos({ valor, menos, mas, alBajar, alSubir }: { valor: string; menos: string; mas: string; alBajar: () => boolean | void; alSubir: () => boolean | void }) {
  const tocado = useRef(false);
  useEffect(() => {
    if (!tocado.current) return;
    tocado.current = false;
    anunciar(valor);
  }, [valor]);
  const conAnuncio = (hacer: () => boolean | void) => () => {
    const dio = hacer();
    if (dio !== false) tocado.current = true;
    return dio;
  };
  return (
    <View style={st.pasos}>
      <BotonDePaso alPaso={conAnuncio(alBajar)} etiqueta={menos} style={st.paso}>
        <Icono nombre="minus" tam={16} peso="semibold" />
      </BotonDePaso>
      <Text style={st.pasoValor}>{valor}</Text>
      <BotonDePaso alPaso={conAnuncio(alSubir)} etiqueta={mas} style={st.paso}>
        <Icono nombre="plus" tam={16} peso="semibold" />
      </BotonDePaso>
    </View>
  );
}

const st = StyleSheet.create({
  foto: { alignItems: 'center', gap: 12, paddingTop: 8 },
  fotoBotones: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  quitarFoto: { paddingVertical: 2, paddingHorizontal: 10, fontFamily: letras.texto, fontSize: 13, color: 'rgba(239, 230, 207, 0.6)' },
  fotoNota: { textAlign: 'center', fontFamily: letras.texto, fontSize: 12, lineHeight: 17, color: 'rgba(239, 230, 207, 0.5)' },
  pedido: { marginTop: -2, marginBottom: 10, fontFamily: letras.textoLiviano, fontSize: 13.5, lineHeight: 19, color: 'rgba(246, 227, 166, 0.85)' },
  campo: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.16)', backgroundColor: 'rgba(6, 10, 22, 0.6)',
    fontFamily: letras.texto, fontSize: 16, color: colores.pergamino,
  },
  grupo: { marginTop: 26, marginBottom: 8, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 9.5, letterSpacing: 1.7, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  lista: { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.09)', backgroundColor: 'rgba(8, 12, 26, 0.72)' },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 52, paddingLeft: 13, paddingRight: 12 },
  filaSeparada: { borderTopWidth: 1, borderColor: 'rgba(239, 230, 207, 0.07)' },
  linea: { position: 'absolute', top: 0, left: 54, right: 0, height: 1, backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  filaTextos: { flex: 1, paddingVertical: 10 },
  creditos: { gap: 8, paddingLeft: 16, paddingRight: 14, paddingBottom: 14 },
  filaTitulo: { fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  filaDetalle: { marginTop: 4, fontFamily: letras.texto, fontSize: 11.5, lineHeight: 15, color: 'rgba(239, 230, 207, 0.5)' },
  // Con el texto grande, el valor se corta antes que dejar al título sin lugar.
  otraCuenta: { marginTop: 10, paddingHorizontal: 4, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.6)' },
  filaValor: { flexShrink: 1, maxWidth: '55%', fontFamily: letras.texto, fontSize: 14, color: 'rgba(239, 230, 207, 0.6)' },
  pronto: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(239, 230, 207, 0.06)', fontFamily: letras.textoMedio, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(239, 230, 207, 0.55)' },
  peligro: { color: '#f0a58a' },
  // Sin desenfoque (la galería lo tiene): más oscuro, así lo de atrás no distrae.
  velo: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40, backgroundColor: 'rgba(3, 5, 12, 0.8)' },
  veloTexto: { textAlign: 'center', fontFamily: letras.texto, fontSize: 14.5, lineHeight: 19, color: 'rgba(239, 230, 207, 0.86)' },
  informacion: { marginBottom: 10, marginHorizontal: 4, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  funcion: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, paddingHorizontal: 13 },
  funcionTitulo: { fontFamily: letras.texto, fontSize: 14.5, color: colores.pergamino },
  funcionTexto: { marginTop: 3, fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17.5, color: 'rgba(239, 230, 207, 0.55)' },
  credito: { fontFamily: letras.texto, fontSize: 12.5, lineHeight: 17, color: 'rgba(239, 230, 207, 0.65)' },
  salir: { marginTop: 26 },
  version: { marginTop: 18, textAlign: 'center', fontFamily: letras.texto, fontSize: 11.5, color: 'rgba(239, 230, 207, 0.4)' },
  llave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  // Perfil › Avisos: cada aviso en su tarjeta, como en la galería (pf-aviso).
  aviso: { marginTop: 10, paddingVertical: 13, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.08)', backgroundColor: 'rgba(239, 230, 207, 0.035)' },
  avisoFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 30 },
  avisoTitulo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  avisoNota: { marginTop: 9, fontFamily: letras.texto, fontSize: 13, lineHeight: 18, color: 'rgba(239, 230, 207, 0.6)' },
  avisoDebajo: { marginTop: 11 },
  // Los siete días, en un renglón, como en la galería.
  dias: { flexDirection: 'row', gap: 5 },
  dia: { flex: 1, paddingHorizontal: 0, alignItems: 'center' },
  diaTexto: { fontSize: 13 },
  deporteEtiqueta: { marginTop: 12, marginBottom: 8, fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.6)' },
  deporteFila: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  deporteNombre: { flexShrink: 1, fontFamily: letras.texto, fontSize: 14, color: colores.pergamino },
  deporteLado: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  grupoPrimero: { marginTop: 8 },
  maximoTexto: { marginTop: 10 },
  maximoSolo: { marginTop: 10, marginBottom: 0 },
  llaveTexto: { flex: 1, fontFamily: letras.texto, fontSize: 15, color: colores.pergamino },
  comidas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  horario: { gap: 8, marginBottom: 6 },
  horarioFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 46 },
  // Tus horas de comer, a la derecha de cada comida: solo se leen; «a mano», la que cambiaste.
  horarioHora: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  horarioValor: { fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
  horarioDe: { fontFamily: letras.texto, fontSize: 12.5, color: 'rgba(239, 230, 207, 0.55)' },
  horarioNo: { opacity: 0.5 },
  horasCambiar: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 6 },
  horasCambiarTexto: { fontFamily: letras.texto, fontSize: 14, color: colores.oro },
  apretado: { opacity: 0.6 },
  pasos: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(239, 230, 207, 0.14)' },
  paso: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 230, 207, 0.07)' },
  pasoValor: { minWidth: 96, textAlign: 'center', fontFamily: letras.numeroMedio, fontSize: 17, color: colores.pergamino, fontVariant: ['tabular-nums'] },
});
