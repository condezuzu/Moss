// El almacén de la app: uno solo, con SQLite (localStorage en la web). Las pantallas lo leen con
// sus propios ganchos; acá está el que lo arranca, cambia de día y lo sincroniza con la cuenta.

import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { catalogo } from '@/datos/catalogo';
import { msHastaMedianoche } from '@/dominio/fechas';
import { haySupabase, supabase } from '@/lib/supabase';
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
    }, 0);
  });
  return {
    alVolver: () => actual?.sincronizador.alVolver(),
    parar: () => {
      data.subscription.unsubscribe();
      actual?.sincronizador.parar();
    },
  };
}

/**
 * Arranca el almacén y dice cuándo está listo. Con la app abierta, cambia de día a la medianoche y
 * al volver del fondo, y con sesión se sincroniza con la cuenta.
 */
export function useAlmacenListo(): boolean {
  const a = elAlmacen();
  const listo = useSyncExternalStore(a.suscribir, () => a.estado().listo);
  useEffect(() => {
    a.iniciar().catch((error) => console.warn('Moss no pudo abrir sus datos', error));
    const cuenta = sincronizarConLaCuenta(a);
    let reloj: ReturnType<typeof setTimeout>;
    const esperarMedianoche = () => {
      reloj = setTimeout(() => {
        a.revisarDia();
        esperarMedianoche();
      }, msHastaMedianoche(new Date()) + 500);
    };
    esperarMedianoche();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') return;
      a.revisarDia();
      cuenta.alVolver();
    });
    return () => {
      clearTimeout(reloj);
      suscripcion.remove();
      cuenta.parar();
    };
  }, [a]);
  return listo;
}
