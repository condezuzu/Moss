// El almacén de la app: uno solo, con SQLite (localStorage en la web). Las pantallas lo leen con
// sus propios ganchos; acá está el que lo arranca, cambia de día y lo sincroniza con la cuenta.

import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { actualizarCatalogo } from '@/comida/catalogoLocal';
import { catalogo } from '@/datos/catalogo';
import { msHastaElCorte } from '@/dominio/fechas';
import { cuentaDeMossDesde } from '@/dominio/premium';
import { CON_ASCENT } from '@/lib/banderas';
import { borrarMiSesion, dejarMiSesion } from '@/lib/llavero';
import { haySupabase, supabase } from '@/lib/supabase';
import { accesoActual, alCambiarPremium, arrancarPremium, cuentaDePremium, seSabeElAcceso, suscripcionActual } from '@/lib/premium';
import { LO_QUE_MUEVE_LOS_AVISOS, programarAvisos } from '@/recordatorios/programar';
import { yaNoEsDeMoss } from '@/secciones/perfil/cuentaApple';
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

/** Hasta que el almacén abrió la base: tablas como la de anclas existen recién después de migrar. */
export function almacenListo(): Promise<void> {
  const a = elAlmacen();
  return new Promise((listo) => {
    if (a.estado().listo) {
      listo();
      return;
    }
    const dejar = a.suscribir(() => {
      if (!a.estado().listo) return;
      dejar();
      listo();
    });
  });
}

/** La suscripción, al abrir Moss o en la tarea de fondo. La fecha de la cuenta dice si la tiene de regalo. */
export const arrancarLoDePremium = () =>
  arrancarPremium(async () => (haySupabase() ? cuentaDeMossDesde((await supabase().auth.getSession()).data.session?.user) : null));

/** La sincronización con la cuenta mientras la app está abierta: Perfil la frena antes de borrar el teléfono. */
let deLaCuenta: { subirLoQueFalta(): Promise<void>; soltar(): Promise<void>; retomar(): void } | undefined;

/** Lo más que se espera a la vuelta que esté en camino antes de borrar: después, lo que vuelva ya no se toca igual. */
const ESPERA_AL_SOLTAR = 15_000;

// Quién está en la cuenta, para lo de Ascent (src/almacen/ascent.ts): sin sesión no hay vínculo.
// undefined hasta que Supabase dice si hay sesión: así lo guardado de Ascent no parpadea al abrir, y
// sin sesión se va.
let usuarioDeLaCuenta: string | null | undefined;
const oyentesDeLaSesion = new Set<(usuario: string | null) => void>();

/** Avisa cada vez que cambia la sesión, y ya mismo con la de ahora si ya se sabe. */
export function oirLaSesion(oyente: (usuario: string | null) => void): () => void {
  oyentesDeLaSesion.add(oyente);
  if (usuarioDeLaCuenta !== undefined) oyente(usuarioDeLaCuenta);
  return () => oyentesDeLaSesion.delete(oyente);
}

/**
 * Ascent ve la sesión de Moss en el llavero que comparten las apps del equipo (spec/ascent.md, D27):
 * se deja al entrar y al renovarla, y se saca sin sesión. Con la vinculación apagada
 * (src/lib/banderas.ts) no se deja, y se saca la que hubiera quedado. Con la sesión que trae el
 * aviso: adentro del aviso no se usa el cliente de Supabase.
 */
export function compartirLaSesion(evento: AuthChangeEvent, sesion: Session | null) {
  if (!sesion || evento === 'SIGNED_OUT' || !CON_ASCENT) {
    borrarMiSesion().catch(() => {});
    return;
  }
  if (evento !== 'SIGNED_IN' && evento !== 'TOKEN_REFRESHED' && evento !== 'INITIAL_SESSION') return;
  // Tu nombre de Moss, si lo tiene (va aparte del perfil: src/dominio/nombre.ts); si no, vacío.
  dejarMiSesion({
    usuario: sesion.user.id,
    nombre: elAlmacen().estado().nombre?.valor ?? '',
    token: sesion.access_token,
    vence: sesion.expires_at ?? Math.floor(Date.now() / 1000) + sesion.expires_in,
  });
}

/**
 * Con sesión, sincroniza con la cuenta; sin sesión, el almacén anda solo. Hasta que exista la
 * pantalla de la cuenta (la entrada), nunca hay sesión.
 */
function sincronizarConLaCuenta(a: Almacen) {
  if (!haySupabase()) {
    usuarioDeLaCuenta = null;
    oyentesDeLaSesion.forEach((o) => o(null));
    return { alVolver: () => {}, parar: () => {} };
  }
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
    // La cuenta de Moss se borró desde otro teléfono y el usuario de Auth quedó solo para Ascent:
    // como si no hubiera sesión, así nada de este teléfono la vuelve a llenar.
    const borradaEnOtroLado = Boolean(sesion && yaNoEsDeMoss(sesion.user));
    const deMoss = borradaEnOtroLado ? null : sesion;
    // Se anota ya: cerrar sesión sabe al terminar si la sesión sigue.
    usuarioDeLaSesion = deMoss?.user.id ?? null;
    compartirLaSesion(evento, deMoss);
    // Supabase pide no usar su cliente dentro de este aviso: se sigue apenas termine.
    setTimeout(() => {
      // Solo la de este teléfono: las sesiones de Ascent con ese usuario siguen.
      if (borradaEnOtroLado) cliente.auth.signOut({ scope: 'local' }).catch(() => {});
      // La fecha viene del servidor con cada sesión y cada renovación, y queda guardada: anda sin conexión.
      // Sin conexión y con el token vencido la sesión llega vacía: solo salir de la cuenta la olvida.
      cuentaDePremium(cuentaDeMossDesde(deMoss?.user), evento === 'SIGNED_OUT' || borradaEnOtroLado).catch(() => {});
      seguir();
      const ahora = usuarioDeLaSesion;
      if (usuarioDeLaCuenta === ahora) return;
      usuarioDeLaCuenta = ahora;
      oyentesDeLaSesion.forEach((o) => o(ahora));
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
  const s = await leerSalud(new Date(), elAlmacen().estado().fuenteDelSueno, elAlmacen().estado().corte).catch(() => null);
  if (s) elAlmacen().ponerSalud(s);
  await estimarAnoche(elAlmacen()).catch(() => {});
}

/**
 * Con la app abierta, el día cambia a la hora elegida (D32), no a la medianoche. El corte guardado llega
 * después de armar el reloj (al terminar de cargar) y se puede cambiar en Perfil: el reloj se vuelve a armar.
 * Devuelve cómo pararlo.
 */
export function cambiarDeDiaAlCorte(a: Pick<Almacen, 'estado' | 'suscribir' | 'revisarDia'>): () => void {
  let reloj: ReturnType<typeof setTimeout> | undefined;
  let corte = a.estado().corte;
  const esperarElCorte = () => {
    clearTimeout(reloj);
    corte = a.estado().corte;
    reloj = setTimeout(() => {
      a.revisarDia();
      esperarElCorte();
    }, msHastaElCorte(new Date(), corte) + 500);
  };
  esperarElCorte();
  const sinOir = a.suscribir(() => {
    if (a.estado().corte !== corte) esperarElCorte();
  });
  return () => {
    clearTimeout(reloj);
    sinOir();
  };
}

/**
 * Arranca el almacén y dice cuándo está listo. Con la app abierta, cambia de día a la hora del corte y
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
    // Los avisos dependen de la suscripción: se rehacen cuando Apple contesta (hasta entonces quedan como
    // estaban), y otra vez si cambia (al comprar, al vencer, al cancelar la prueba), no cada vez que se le pregunta.
    const dePremium = () => `${seSabeElAcceso()} ${accesoActual()} ${suscripcionActual()?.vence} ${suscripcionActual()?.renueva}`;
    let premiumAntes = dePremium();
    const sinOirPremium = alCambiarPremium(() => {
      const ahora = dePremium();
      if (ahora === premiumAntes) return;
      premiumAntes = ahora;
      if (a.estado().listo) reprogramar();
    });
    arrancarLoDePremium().catch(() => {});
    const sinCorte = cambiarDeDiaAlCorte(a);
    // Los avisos se vuelven a programar cuando cambia algo que los mueve, un rato después.
    let espera: ReturnType<typeof setTimeout> | undefined;
    const programarYa = () => {
      clearTimeout(espera);
      espera = undefined;
      if (a.estado().listo) programarAvisos(a.estado()).catch(() => {});
    };
    const reprogramar = () => {
      clearTimeout(espera);
      espera = setTimeout(programarYa, 1500);
    };
    // Marcar algo y salir enseguida: con Moss de fondo el reloj se para, y sonaría igual lo que ya hiciste.
    const sinSalir = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active' && espera !== undefined) programarYa();
    });
    // Lo que usan los avisos (programar.ts): lo anotado, lo hecho, los hábitos, las noches, Salud, los avisos
    // mismos, el peso (pesarse no suena si ya te pesaste), el perfil y las metas (el día del control), lo que
    // tardas en dormirte, la hora en que empieza el día y el día mismo. Y que el almacén esté listo.
    const queMueve = (e: ReturnType<Almacen['estado']>) => [e.listo, ...LO_QUE_MUEVE_LOS_AVISOS.map((k) => e[k])];
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
    // Volver es venir del fondo: bajar el centro de control o de notificaciones, o una alerta del sistema,
    // también dejan a la app «inactiva» un momento, y rehacerlo todo cada vez (Salud, los avisos, los
    // widgets) se notaba como un tirón en un iPhone viejo.
    let estadoAntes = AppState.currentState;
    const suscripcion = AppState.addEventListener('change', (estado) => {
      const venia = estadoAntes;
      estadoAntes = estado;
      if (estado === 'background' && a.estado().listo) a.anotarUso('cerrar');
      if (estado !== 'active' || venia !== 'background') return;
      // Si no pudo abrir sus datos al arrancar, lo vuelve a intentar.
      if (!a.estado().listo) {
        a.iniciar().then(actualizarSalud).catch((error) => console.warn('Moss no pudo abrir sus datos', error));
        return;
      }
      a.anotarUso('abrir');
      a.revisarDia();
      cuenta.alVolver();
      actualizarSalud().catch(() => {});
      reprogramar();
    });
    return () => {
      sinCorte();
      clearTimeout(espera);
      sinOir();
      sinOirBusquedas();
      sinOirPremium();
      sinSalir.remove();
      suscripcion.remove();
      cuenta.parar();
    };
  }, [a]);
  return listo;
}
