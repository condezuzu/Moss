// Los widgets en la app (spec/widgets.md): al abrir Moss y cuando cambia algo que muestran, aplica lo
// que se tocó en ellos (por el almacén) y les escribe la línea de tiempo nueva. Solo con la app o la
// tarea de fondo (src/fondo/) se escribe la línea: el widget solo suma toques a la suya.
// Solo en el iPhone y con el módulo en la build: en la web, en los tests o en una build vieja no hay nada.

import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { elAlmacen } from '@/almacen';
import type { Estado } from '@/almacen/almacen';
import { catalogo } from '@/datos/catalogo';
import { idioma, t } from '@/textos';
import { lineaDelCielo, repartirToques, toquesDeLaLinea } from './cielo';
import { confirmacionesDeLaLinea, decidir, lineaDeLaNoche, type ConfirmacionDelWidget } from './noche';
import type { PropsCielo, PropsNoche } from './tipos';

type Entrada<P> = { date: Date; props: P };
type ElWidget<P> = { getTimeline(): Promise<Entrada<P>[]>; updateTimeline(entradas: Entrada<P>[]): void };

const URL = 'moss://';
/** Cada hora en la zona de su momento, como las noches de Salud. */
const zona = (ms: number) => -new Date(ms).getTimezoneOffset();

let cargados: { cielo: ElWidget<PropsCielo>; noche: ElWidget<PropsNoche> } | null | undefined;

function losWidgets() {
  if (cargados !== undefined) return cargados;
  cargados = null;
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return cargados;
  try {
    // Recién acá: importar expo-widgets sin su módulo nativo rompe al arrancar.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cargados = { cielo: require('./Cielo.widget').default, noche: require('./Noche.widget').default };
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
      catalogo, idioma: idioma(), url: URL, atrasados: esperan,
      textos: { cuenta: t('widgets.cuenta'), solos: t('widgets.solos'), sinHabitos: t('widgets.sinHabitos'), hecho: t('widgets.hecho'), sinHacer: t('widgets.sinHacer') },
    }),
  );

  // La noche: el «Sí» del widget confirma la estimada si coincide; si Moss todavía no la estimó, espera.
  let esperando: ConfirmacionDelWidget | null = null;
  await alDia(
    w.noche,
    (linea) => {
      esperando = null;
      for (const c of confirmacionesDeLaLinea(linea)) {
        const e = a.estado();
        const propia = e.noches.get(c.clave);
        const que = decidir(c, propia, e.hoy, zona);
        if (que === 'aplicar' && propia?.hora) a.ponerHoraDeLaNoche(c.clave, { ...propia.hora, origen: 'confirmada' });
        if (que === 'esperar') esperando = c;
      }
    },
    () => lineaDeLaNoche(a.estado(), {
      ahora: new Date(), zona, url: URL, esperando,
      textos: {
        anoche: t('widgets.anoche'), si: t('widgets.si'), fueAsi: t('widgets.fueAsi'), confirmada: t('widgets.confirmada'),
        seVeEnMoss: t('widgets.seVeEnMoss'), seAnotaEnMoss: t('widgets.seAnotaEnMoss'), horas: t('widgets.horas'), duracion: t('cielo.horasMinutos'),
      },
    }),
  );
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
const queMuestran = (e: Estado) => [e.listo, e.hoy, e.habitos, e.periodos, e.dias, e.marcas, e.noches, e.salud, e.metas] as const;

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
