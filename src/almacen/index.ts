// El almacén de la app: uno solo, con SQLite (localStorage en la web). Las pantallas lo leen con
// sus propios ganchos; acá está el que lo arranca y cambia de día.

import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { catalogo } from '@/datos/catalogo';
import { msHastaMedianoche } from '@/dominio/fechas';
import { idioma } from '@/textos';
import { abrirRepositorio } from './abrir';
import { crearAlmacen, type Almacen } from './almacen';
import { habitosDeEjemplo } from './semilla';

let almacen: Almacen | undefined;

export function elAlmacen(): Almacen {
  almacen ??= crearAlmacen({ abrir: abrirRepositorio, catalogo, sembrar: (hoy) => habitosDeEjemplo(hoy, idioma()) });
  return almacen;
}

/** Arranca el almacén y dice cuándo está listo. Con la app abierta, cambia de día a la medianoche y al volver del fondo. */
export function useAlmacenListo(): boolean {
  const a = elAlmacen();
  const listo = useSyncExternalStore(a.suscribir, () => a.estado().listo);
  useEffect(() => {
    a.iniciar().catch((error) => console.warn('Moss no pudo abrir sus datos', error));
    let reloj: ReturnType<typeof setTimeout>;
    const esperarMedianoche = () => {
      reloj = setTimeout(() => {
        a.revisarDia();
        esperarMedianoche();
      }, msHastaMedianoche(new Date()) + 500);
    };
    esperarMedianoche();
    const suscripcion = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') a.revisarDia();
    });
    return () => {
      clearTimeout(reloj);
      suscripcion.remove();
    };
  }, [a]);
  return listo;
}
