// Los widgets en la app (spec/widgets.md): al abrir Moss y cuando cambia algo que muestran, aplica lo
// que se tocó en ellos (por el almacén) y les escribe la línea de tiempo nueva. Solo con la app o la
// tarea de fondo (src/fondo/) se escribe la línea: el widget solo suma toques a la suya.
// Solo en el iPhone y con el módulo en la build: en la web, en los tests o en una build vieja no hay nada.

import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { elAlmacen } from '@/almacen';
import { reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { catalogo } from '@/datos/catalogo';
import { horasDeSueno } from '@/dominio/avisos';
import { COMIDAS, type Comida } from '@/dominio/comidas';
import { metaDeAgua } from '@/dominio/cuidados';
import { sumarDias } from '@/dominio/fechas';
import { juicioDeLaDeuda } from '@/dominio/sueno';
import { CON_WIDGETS_NUEVOS } from '@/lib/banderas';
import { suenoDelDia } from '@/recordatorios/programar';
import { nocheDeAhora } from '@/salud/nocheSinReloj';
import { metaDelDia, numero, totalDe } from '@/secciones/comida/datos';
import { enlaceASeccion, enlaceDeAnotar } from '@/secciones/enlaces';
import { alarmaPuesta } from '@/secciones/sueno/despertador';
import { idioma, lista, t } from '@/textos';
import { lineaDelAgua, repartirAgua, toquesDelAgua } from './agua';
import { lineaDeAnotar } from './anotar';
import { lineaDelCielo, repartirToques, toquesDeLaLinea } from './cielo';
import { fondosEnElGrupo } from './fondos';
import { aplicarToquesDeHoy, lineaDeHoy, type DelToque } from './hoy';
import { confirmacionesDeLaLinea, decidir, despertadorPara, lineaDeLaNoche, type ConfirmacionDelWidget } from './noche';
import type { PropsAgua, PropsAnotar, PropsCielo, PropsHoy, PropsNoche } from './tipos';

type Entrada<P> = { date: Date; props: P };
type ElWidget<P> = { getTimeline(): Promise<Entrada<P>[]>; updateTimeline(entradas: Entrada<P>[]): void };

const META_DE_AGUA = 2000;
/** Cada hora en la zona de su momento, como las noches de Salud. */
const zona = (ms: number) => -new Date(ms).getTimezoneOffset();

type LosWidgets = {
  cielo: ElWidget<PropsCielo>;
  noche: ElWidget<PropsNoche>;
  hoy?: ElWidget<PropsHoy>;
  anotar?: ElWidget<PropsAnotar>;
  agua?: ElWidget<PropsAgua>;
  /** La carpeta del App Group: ahí van los fondos. */
  carpeta: string | null;
};

let cargados: LosWidgets | null | undefined;

function losWidgets() {
  if (cargados !== undefined) return cargados;
  cargados = null;
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return cargados;
  try {
    // Recién acá: importar expo-widgets sin su módulo nativo rompe al arrancar.
    /* eslint-disable @typescript-eslint/no-require-imports */
    cargados = {
      cielo: require('./Cielo.widget').default,
      noche: require('./Noche.widget').default,
      carpeta: require('expo-widgets').widgetsDirectory ?? null,
      // Con la build que los declara en app.json. Antes, no tiene sentido escribir sus líneas.
      ...(CON_WIDGETS_NUEVOS ? { hoy: require('./Hoy.widget').default, anotar: require('./Anotar.widget').default, agua: require('./Agua.widget').default } : {}),
    };
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch (error) {
    console.warn('Moss no pudo cargar los widgets', error);
  }
  return cargados;
}

/** Si esta build tiene los widgets. */
export const hayWidgets = () => !!losWidgets();

/** Lo mismo dicho igual, sin importar el orden de las claves (lo que vuelve de iOS viene en otro orden). */
function firma(x: unknown): string {
  if (x instanceof Date) return String(x.getTime());
  if (Array.isArray(x)) return `[${x.map(firma).join(',')}]`;
  if (x && typeof x === 'object') return `{${Object.keys(x).sort().map((k) => `${k}:${firma((x as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(x) ?? 'null';
}

/**
 * Lee la línea, aplica lo de ella con `aplicar` y escribe la que arma `armar`. Si mientras tanto llegó
 * un toque (la línea cambió), se vuelve a leer antes de pisarla, así no se pierde.
 */
async function alDia<P>(w: ElWidget<P>, aplicar: (linea: Entrada<P>[]) => void, armar: () => Entrada<P>[]) {
  let leida = await w.getTimeline();
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    aplicar(leida);
    const nueva = armar();
    const otra = await w.getTimeline();
    if (firma(otra) !== firma(leida)) {
      leida = otra;
      continue;
    }
    if (firma(nueva) !== firma(otra)) w.updateTimeline(nueva);
    return;
  }
}

async function unaVuelta() {
  const w = losWidgets();
  const a = elAlmacen();
  if (!w || !a.estado().listo) return;
  const fondos = await fondosEnElGrupo(w.carpeta);

  // El cielo: los «hecho» van al almacén con su día y su hora (gana el último).
  let esperan: ReturnType<typeof repartirToques>['esperan'] = [];
  await alDia(
    w.cielo,
    (linea) => {
      const r = repartirToques(toquesDeLaLinea(linea), a.estado());
      for (const x of r.aplicar) a.marcarEnDia(x.id, x.dia, x.hecho, 'toque', new Date(x.en).toISOString());
      esperan = r.esperan;
    },
    () => lineaDelCielo(a.estado(), {
      catalogo, idioma: idioma(), url: enlaceASeccion('habitos'), atrasados: esperan, fondos,
      textos: { cuenta: t('widgets.cuenta'), solos: t('widgets.solos'), sinHabitos: t('widgets.sinHabitos'), hecho: t('widgets.hecho'), sinHacer: t('widgets.sinHacer') },
    }),
  );

  // La noche: el «Sí» del widget confirma la estimada si coincide; si Moss todavía no la estimó, espera.
  let esperando: ConfirmacionDelWidget | null = null;
  // Con el despertador de Moss puesto, la mañana que viene el widget propone despertar a su hora.
  const alarma = await alarmaPuesta().catch(() => null);
  await alDia(
    w.noche,
    (linea) => {
      esperando = null;
      for (const c of confirmacionesDeLaLinea(linea)) {
        const e = a.estado();
        const propia = e.noches.get(c.clave);
        const que = decidir(c, propia, nocheDeAhora(new Date()), zona, e.salud?.noches);
        if (que === 'aplicar' && propia?.hora) a.ponerHoraDeLaNoche(c.clave, { ...propia.hora, origen: 'confirmada' });
        if (que === 'esperar') esperando = c;
      }
    },
    () => {
      const ahora = new Date();
      return lineaDeLaNoche(a.estado(), {
        ahora, zona, url: enlaceASeccion('sueno'), esperando, dormir: horaDeDormirHoy(a.estado(), ahora), deuda: deudaDeAnoche(a.estado(), ahora), fondo: fondos.noche,
        despertador: despertadorPara(alarma, sumarDias(nocheDeAhora(ahora), 1), ahora),
        textos: {
          anoche: t('widgets.anoche'), si: t('widgets.si'), fueAsi: t('widgets.fueAsi'), confirmada: t('widgets.confirmada'),
          seVeEnMoss: t('widgets.seVeEnMoss'), seAnotaEnMoss: t('widgets.seAnotaEnMoss'), horas: t('widgets.horas'), duracion: t('cielo.horasMinutos'), soloHoras: t('fecha.horas'),
          horasCorto: t('widgets.horasCorto'), siLargo: t('widgets.siFueAsi'), aDormir: t('widgets.aDormir'), enTiempo: t('widgets.enTiempo'),
          minutos: t('fecha.minutos'), yaEsHora: t('widgets.yaEsHora'),
        },
      });
    },
  );

  // Hoy: lo de siempre o lo del plan tocado se anota con la hora del toque; otro toque lo deshace.
  if (w.hoy) {
    let deshacer = new Map<string, DelToque>();
    const enEstaVuelta = new Map<string, DelToque | null>();
    await alDia(
      w.hoy,
      (linea) => {
        deshacer = aplicarToquesDeHoy(linea, a, enEstaVuelta);
      },
      () => {
        const e = a.estado();
        return lineaDeHoy(e, {
          metaDe: (dia) => metaDelDia(e, dia),
          nombres: Object.fromEntries(COMIDAS.map((c) => [c, t(`widgets.comidaCorta.${c}`)])) as Record<Comida, string>,
          letras: lista('fecha.diasCortos').map((d) => d.charAt(0).toUpperCase()),
          textos: {
            teQuedan: t('inicio.teQuedan'), deMas: t('inicio.deMas'), kcal: t('comida.kcal'), quedan: t('widgets.quedan'), sobra: t('widgets.deMas'), anotado: t('widgets.anotado'),
            miles: idioma() === 'es' ? '.' : ',',
            cortos: { p: t('widgets.macroCorto.p'), c: t('widgets.macroCorto.c'), g: t('widgets.macroCorto.g') },
            semana: t('widgets.semana'), meta: t('widgets.meta'),
          },
          urls: { anotar: enlaceDeAnotar(), inicio: enlaceASeccion('inicio'), comida: enlaceASeccion('comida'), anotarComida: enlaceDeAnotar({ comida: '{comida}' }) },
          fondo: fondos.noche,
          deshacer,
        });
      },
    );
  }

  // El agua: los vasos tocados, con la hora del toque.
  if (w.agua) {
    await alDia(
      w.agua,
      (linea) => {
        const r = repartirAgua(toquesDelAgua(linea), a.estado());
        for (const x of r.sumar) a.sumarAgua(x.ml, { dia: x.dia, momento: new Date(x.en).toISOString() });
        for (const id of r.quitar) a.quitarAgua(id);
      },
      () => lineaDelAgua(a.estado(), {
        // Con cuidados de salud, su meta (2,5 L con cálculos). «Sin meta» todavía no tiene dibujo en el widget: la de siempre.
        meta: metaDeAgua(reglasDeCuidados(a.estado()), META_DE_AGUA) ?? META_DE_AGUA,
        textos: { titulo: t('widgets.agua'), vasos: t('widgets.vasos'), sumar: t('mas.sumarVaso'), quitar: t('widgets.quitarVaso'), decimal: idioma() === 'es' ? ',' : '.' },
        url: enlaceASeccion('inicio'),
        fondo: fondos.noche,
      }),
    );
  }

  // Anotar no guarda nada: solo el título de cada comida y lo que queda ese día.
  if (w.anotar) {
    await alDia(w.anotar, () => {}, () => {
      const e = a.estado();
      return lineaDeAnotar(new Date(), {
        titulos: Object.fromEntries(COMIDAS.map((c) => [c, t(`widgets.anotarComida.${c}`)])) as Record<Comida, string>,
        // Lo que quedará ese día cuando llegue: lo planificado no cuenta hasta comerlo, como en Inicio.
        queda: (dia) => {
          const meta = metaDelDia(e, dia);
          if (!meta) return '';
          const queda = meta.kcal - totalDe(e.registros, dia, dia).kcal;
          return t(queda >= 0 ? 'widgets.teQuedanCorto' : 'widgets.deMasCorto', { n: numero(Math.abs(Math.round(queda))) });
        },
        numeros: e.numeros,
        corte: e.corte,
        acciones: ([['buscar', 'magnifyingglass'], ['decir', 'mic'], ['codigo', 'barcode.viewfinder'], ['etiqueta', 'doc.text.viewfinder']] as const).map(([id, icono]) => ({
          id, icono, nombre: t(`widgets.acciones.${id}`), url: enlaceDeAnotar({ via: id }),
        })),
        url: enlaceDeAnotar({ comida: '{comida}' }),
        decirTitulo: t('comida.decir.titulo'),
        fondo: fondos.noche,
      });
    });
  }
}

/** A qué hora ir a la cama esta noche (D33). Sin noches de verdad o sin hora de despertarse, no hay «A dormir». */
function horaDeDormirHoy(e: Estado, ahora: Date): { acostarse: number } | null {
  // La del aviso, con el despertar real de hoy: sin periodo de melatonina, despertarte tarde corre la noche.
  const sueno = suenoDelDia(e);
  if (!sueno) return null;
  // La de la noche de la línea, que cambia a las 4 y no con el corte (D32).
  const h = horasDeSueno(nocheDeAhora(ahora), sueno);
  return h.acostarse === null ? null : { acostarse: h.acostarse };
}

/**
 * La deuda en una palabra, la de Sueño (con las noches hasta hoy): solo cuando la noche de la línea es la de hoy, así
 * no se le pega a otra. Sin noches de verdad, nada.
 */
function deudaDeAnoche(e: Estado, ahora: Date): string {
  const minutos = suenoDelDia(e)?.deuda;
  if (minutos == null || nocheDeAhora(ahora) !== e.hoy) return '';
  return t(`widgets.deuda.${juicioDeLaDeuda({ minutos })}`);
}

let enCurso: Promise<void> | null = null;
let otraVez = false;

/** Aplica lo tocado en los widgets y les deja la línea al día. De a una vuelta: si piden otra, va después. */
export function actualizarWidgets(): Promise<void> {
  if (!losWidgets()) return Promise.resolve();
  if (enCurso) {
    otraVez = true;
    return enCurso;
  }
  enCurso = (async () => {
    try {
      do {
        otraVez = false;
        await unaVuelta();
      } while (otraVez);
    } finally {
      enCurso = null;
    }
  })();
  return enCurso;
}

/** Lo que muestran los widgets: si cambia, se escriben de nuevo. */
const queMuestran = (e: Estado) => [e.listo, e.hoy, e.corte, e.latencia, e.necesidad, e.despertares, e.perfil, e.habitos, e.periodos, e.dias, e.marcas, e.noches, e.salud, e.metas, ...(CON_WIDGETS_NUEVOS ? [e.registros, e.agua, e.pesos, e.cuidados, e.numeros] : [])] as const;

/**
 * En la raíz de la app: al estar listo el almacén, al volver a Moss y cuando cambia algo que muestran,
 * un rato después (así un toque tras otro escribe una vez). Al irse, quedan al día.
 */
export function useWidgets() {
  useEffect(() => {
    if (!losWidgets()) return;
    const a = elAlmacen();
    let espera: ReturnType<typeof setTimeout> | undefined;
    const enUnRato = (ms: number) => {
      clearTimeout(espera);
      espera = setTimeout(() => actualizarWidgets().catch((error) => console.warn('Moss no pudo poner los widgets al día', error)), ms);
    };
    let antes = queMuestran(a.estado());
    if (a.estado().listo) enUnRato(400);
    const sinOir = a.suscribir(() => {
      const ahora = queMuestran(a.estado());
      if (ahora.every((x, i) => x === antes[i])) return;
      antes = ahora;
      enUnRato(700);
    });
    const suscripcion = AppState.addEventListener('change', (estado) => {
      // Al volver, después de que el almacén cambie de día: ahí se aplica lo tocado mientras no estabas.
      if (estado === 'active') enUnRato(400);
      if (estado === 'background') {
        clearTimeout(espera);
        actualizarWidgets().catch(() => {});
      }
    });
    return () => {
      clearTimeout(espera);
      sinOir();
      suscripcion.remove();
    };
  }, []);
}
