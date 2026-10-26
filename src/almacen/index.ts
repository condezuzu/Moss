// El almacén de la app: uno solo, con SQLite (localStorage en la web). Las pantallas lo leen con
// sus propios ganchos; acá está el que lo arranca, cambia de día y lo sincroniza con la cuenta.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { actualizarCatalogo } from '@/comida/catalogoLocal';
import { catalogo } from '@/datos/catalogo';
import { msHastaMedianoche } from '@/dominio/fechas';
import { borrarMiSesion, dejarMiSesion } from '@/lib/llavero';
import { haySupabase, supabase } from '@/lib/supabase';
import { programarAvisos } from '@/recordatorios/programar';
import { leerSalud } from '@/salud/leer';
import { estimarAnoche } from '@/salud/nocheSinReloj';
import { idioma } from '@/textos';
import { abrirRepositorio } from './abrir';
import { crearAlmacen, type Almacen } from './almacen';
import { avisarSesion, buzon } from './buzonDeMoss';
import { remotoSupabase } from './remoto';
import { habitosDeEjemplo } from './semilla';
import { crearSincronizador, type Sincronizador } from './sincronizar';

let almacen: Almacen | undefined;

export function elAlmacen(): Almacen {
  almacen ??= crearAlmacen({ abrir: abrirRepositorio, catalogo, sembrar: (hoy) => habitosDeEjemplo(hoy, idioma()) });
  return almacen;
}

/** La sincronización con la cuenta mientras la app está abierta: Perfil la frena antes de borrar el teléfono. */
let deLaCuenta: { subirLoQueFalta(): Promise<void>; soltar(): Promise<void>; retomar(): void } | undefined;

/** Lo más que se espera a la vuelta que esté en camino antes de borrar: después, lo que vuelva ya no se toca igual. */
const ESPERA_AL_SOLTAR = 15_000;

// Quién está en la cuenta, para lo de Ascent (src/almacen/ascent.ts): sin sesión no hay vínculo.
let usuarioDeLaCuenta: string | null = null;
const oyentesDeLaSesion = new Set<(usuario: string | null) => void>();

/** Avisa cada vez que cambia la sesión, y ya mismo con la de ahora. */
export function oirLaSesion(oyente: (usuario: string | null) => void): () => void {
  oyentesDeLaSesion.add(oyente);
  oyente(usuarioDeLaCuenta);
  return () => oyentesDeLaSesion.delete(oyente);
}

/**
 * Ascent ve la sesión de Moss en el llavero que comparten las apps del equipo (spec/ascent.md, D27):
 * se deja al entrar y al renovarla, y se saca sin sesión. Con la sesión que trae el aviso: adentro
 * del aviso no se usa el cliente de Supabase.
 */
function compartirLaSesion(evento: AuthChangeEvent, sesion: Session | null) {
  if (!sesion || evento === 'SIGNED_OUT') {
    borrarMiSesion().catch(() => {});
    return;
  }
  if (evento !== 'SIGNED_IN' && evento !== 'TOKEN_REFRESHED' && evento !== 'INITIAL_SESSION') return;
  // El nombre del perfil de Moss, si lo tiene; si no, vacío.
  const perfil = elAlmacen().estado().perfil as { nombre?: unknown } | null;
  dejarMiSesion({
    usuario: sesion.user.id,
    nombre: typeof perfil?.nombre === 'string' ? perfil.nombre : '',
    token: sesion.access_token,
    vence: sesion.expires_at ?? Math.floor(Date.now() / 1000) + sesion.expires_in,
  });
}

/**
 * Con sesión, sincroniza con la cuenta; sin sesión, el almacén anda solo. Hasta que exista la
 * pantalla de la cuenta (la entrada), nunca hay sesión.
 */
function sincronizarConLaCuenta(a: Almacen) {
  if (!haySupabase()) return { alVolver: () => {}, parar: () => {} };
  const cliente = supabase();
  let actual: { usuario: string; sincronizador: Sincronizador } | undefined;
  let usuarioDeLaSesion: string | null = null;
  let suelta = false;
  /** Pone la sincronización de acuerdo con la sesión: una por usuario, y ninguna mientras está suelta. */
  const seguir = () => {
    const usuario = suelta ? null : usuarioDeLaSesion;
    if (actual?.usuario === usuario) return;
    actual?.sincronizador.parar();
    actual = usuario ? { usuario, sincronizador: crearSincronizador({ almacen: a, remoto: remotoSupabase(cliente), usuario }) } : undefined;
    actual?.sincronizador.arrancar();
    // Con sesión, también baja lo nuevo del catálogo de alimentos del servidor y sale lo que esperaba en el buzón.
    if (usuario) actualizarCatalogo(cliente).catch(() => {});
    avisarSesion(Boolean(usuario));
  };
  const { data } = cliente.auth.onAuthStateChange((evento, sesion) => {
    // Se anota ya: cerrar sesión sabe al terminar si la sesión sigue.
    usuarioDeLaSesion = sesion?.user.id ?? null;
    compartirLaSesion(evento, sesion);
    // Supabase pide no usar su cliente dentro de este aviso: se sigue apenas termine.
    setTimeout(() => {
      seguir();
      if (usuarioDeLaCuenta === usuarioDeLaSesion) return;
      usuarioDeLaCuenta = usuarioDeLaSesion;
      oyentesDeLaSesion.forEach((o) => o(usuarioDeLaCuenta));
    }, 0);
  });
  deLaCuenta = {
    async subirLoQueFalta() {
      await actual?.sincronizador.vuelta(false);
    },
    async soltar() {
      suelta = true;
      const enCamino = actual?.sincronizador.terminar();
      seguir();
      let reloj: ReturnType<typeof setTimeout> | undefined;
      await Promise.race([enCamino, new Promise((listo) => (reloj = setTimeout(listo, ESPERA_AL_SOLTAR)))]);
      clearTimeout(reloj);
    },
    retomar() {
      suelta = false;
      seguir();
    },
  };
  return {
    alVolver: () => {
      actual?.sincronizador.alVolver();
      if (actual) actualizarCatalogo(cliente).catch(() => {});
      if (actual) buzon().enviar().catch(() => {});
    },
    parar: () => {
      data.subscription.unsubscribe();
      actual?.sincronizador.parar();
      deLaCuenta = undefined;
    },
  };
}

/**
 * Para borrar el teléfono o cerrar sesión: frena la sincronización (espera la vuelta que esté en
 * camino, así nada de la cuenta vuelve a entrar después de borrar), hace la tarea y la retoma si la
 * sesión sigue.
 */
export async function sinSincronizar<T>(tarea: () => Promise<T>): Promise<T> {
  const cuenta = deLaCuenta;
  await cuenta?.soltar();
  try {
    return await tarea();
  } finally {
    cuenta?.retomar();
  }
}

/** Sube ya lo que falta subir. Tira un error si no se pudo (sin conexión). */
export async function subirLoQueFalta(): Promise<void> {
  await deLaCuenta?.subirLoQueFalta();
}

/**
 * Lee Salud (si ya se pidió) y lo pone en el almacén: al abrir, al volver y después de pedir permiso.
 * Después, sin reloj, estima la noche de anoche con lo que guardó el teléfono.
 */
export async function actualizarSalud(): Promise<void> {
  const s = await leerSalud(new Date(), elAlmacen().estado().fuenteDelSueno).catch(() => null);
  if (s) elAlmacen().ponerSalud(s);
  await estimarAnoche(elAlmacen()).catch(() => {});
}

/**
 * Arranca el almacén y dice cuándo está listo. Con la app abierta, cambia de día a la medianoche y
 * al volver del fondo, y con sesión se sincroniza con la cuenta.
 */
export function useAlmacenListo(): boolean {
  const a = elAlmacen();
  const listo = useSyncExternalStore(a.suscribir, () => a.estado().listo);
  useEffect(() => {
    // Abrir Moss dice que estás despierto: sin reloj, es lo más exacto para la noche (spec/sueno.md).
    // Si iOS la abre en segundo plano (la tarea de fondo, un Atajo, el pre-arranque), nadie la usó:
    // el «abrir» llega después, con el cambio a `active`.
    a.iniciar()
      .then(() => (AppState.currentState === 'background' ? undefined : a.anotarUso('abrir')))
      .then(actualizarSalud)
      .catch((error) => console.warn('Moss no pudo abrir sus datos', error));
    const cuenta = sincronizarConLaCuenta(a);
    let reloj: ReturnType<typeof setTimeout>;
    const esperarMedianoche = () => {
      reloj = setTimeout(() => {
        a.revisarDia();
        esperarMedianoche();
      }, msHastaMedianoche(new Date()) + 500);
    };
    esperarMedianoche();
    // Los avisos se vuelven a programar cuando cambia algo que los mueve, un rato después.
    let espera: ReturnType<typeof setTimeout> | undefined;
    const reprogramar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (a.estado().listo) programarAvisos(a.estado()).catch(() => {});
      }, 1500);
    };
    // Lo anotado, lo hecho, los hábitos, las noches, Salud, los avisos mismos, el peso (pesarse no
    // suena si ya te pesaste), el perfil y las metas (el día del control) y el día que empieza.
    const queMueve = (e: ReturnType<Almacen['estado']>) => [e.registros, e.recordatorios, e.avisos, e.marcas, e.habitos, e.noches, e.salud, e.pesos, e.perfil, e.metas, e.hoy, e.listo] as const;
    let antes = queMueve(a.estado());
    const sinOir = a.suscribir(() => {
      const ahora = queMueve(a.estado());
      if (ahora.every((x, i) => x === antes[i])) return;
      antes = ahora;
      reprogramar();
    });
    // Si dejas de elegir que se manden las búsquedas que no encuentran nada, las que esperaban ya no salen.
    let mandaba = false;
    const sinOirBusquedas = a.suscribir(() => {
      const { listo, mandarBusquedas } = a.estado();
      if (!listo) return;
      if (mandaba && !mandarBusquedas) buzon().descartar('busqueda').catch(() => {});
      mandaba = mandarBusquedas;
    });
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'background' && a.estado().listo) a.anotarUso('cerrar');
      if (estado !== 'active') return;
      if (a.estado().listo) a.anotarUso('abrir');
      a.revisarDia();
      cuenta.alVolver();
      actualizarSalud().catch(() => {});
      reprogramar();
    });
    return () => {
      clearTimeout(reloj);
      clearTimeout(espera);
      sinOir();
      sinOirBusquedas();
      suscripcion.remove();
      cuenta.parar();
    };
  }, [a]);
  return listo;
}
