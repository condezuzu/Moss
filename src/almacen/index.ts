// El almacén de la app: uno solo, con SQLite (localStorage en la web). Las pantallas lo leen con
// sus propios ganchos; acá está el que lo arranca, cambia de día y lo sincroniza con la cuenta.

import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { actualizarCatalogo } from '@/comida/catalogoLocal';
import { catalogo } from '@/datos/catalogo';
import { msHastaMedianoche } from '@/dominio/fechas';
import { haySupabase, supabase } from '@/lib/supabase';
import { programarRecordatorios } from '@/recordatorios/programar';
import { leerSalud } from '@/salud/leer';
import { estimarAnoche } from '@/salud/nocheSinReloj';
import { idioma } from '@/textos';
import { abrirRepositorio } from './abrir';
import { crearAlmacen, type Almacen } from './almacen';
import { remotoSupabase } from './remoto';
import { habitosDeEjemplo } from './semilla';
import { crearSincronizador, type Sincronizador } from './sincronizar';

let almacen: Almacen | undefined;

export function elAlmacen(): Almacen {
  almacen ??= crearAlmacen({ abrir: abrirRepositorio, catalogo, sembrar: (hoy) => habitosDeEjemplo(hoy, idioma()) });
  return almacen;
}

/**
 * Con sesión, sincroniza con la cuenta; sin sesión, el almacén anda solo. Hasta que exista la
 * pantalla de la cuenta (la entrada), nunca hay sesión.
 */
function sincronizarConLaCuenta(a: Almacen) {
  if (!haySupabase()) return { alVolver: () => {}, parar: () => {} };
  const cliente = supabase();
  let actual: { usuario: string; sincronizador: Sincronizador } | undefined;
  const { data } = cliente.auth.onAuthStateChange((_evento, sesion) => {
    const usuario = sesion?.user.id ?? null;
    // Supabase pide no usar su cliente dentro de este aviso: se sigue apenas termine.
    setTimeout(() => {
      if (actual?.usuario === usuario) return;
      actual?.sincronizador.parar();
      actual = usuario ? { usuario, sincronizador: crearSincronizador({ almacen: a, remoto: remotoSupabase(cliente), usuario }) } : undefined;
      actual?.sincronizador.arrancar();
      // Con sesión, también baja lo nuevo del catálogo de alimentos del servidor.
      if (usuario) actualizarCatalogo(cliente).catch(() => {});
    }, 0);
  });
  return {
    alVolver: () => {
      actual?.sincronizador.alVolver();
      if (actual) actualizarCatalogo(cliente).catch(() => {});
    },
    parar: () => {
      data.subscription.unsubscribe();
      actual?.sincronizador.parar();
    },
  };
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
    a.iniciar().then(() => a.anotarUso('abrir')).then(actualizarSalud).catch((error) => console.warn('Moss no pudo abrir sus datos', error));
    const cuenta = sincronizarConLaCuenta(a);
    let reloj: ReturnType<typeof setTimeout>;
    const esperarMedianoche = () => {
      reloj = setTimeout(() => {
        a.revisarDia();
        esperarMedianoche();
      }, msHastaMedianoche(new Date()) + 500);
    };
    esperarMedianoche();
    // Los recordatorios se vuelven a programar al anotar algo o al cambiarlos, un rato después.
    let espera: ReturnType<typeof setTimeout> | undefined;
    const reprogramar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        if (a.estado().listo) programarRecordatorios(a.estado()).catch(() => {});
      }, 1500);
    };
    let antes = { registros: a.estado().registros, recordatorios: a.estado().recordatorios, listo: a.estado().listo };
    const sinOir = a.suscribir(() => {
      const e = a.estado();
      if (e.registros === antes.registros && e.recordatorios === antes.recordatorios && e.listo === antes.listo) return;
      antes = { registros: e.registros, recordatorios: e.recordatorios, listo: e.listo };
      reprogramar();
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
      suscripcion.remove();
      cuenta.parar();
    };
  }, [a]);
  return listo;
}
