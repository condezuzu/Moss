import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { hayHojasAbiertas } from '@/secciones/HojaModal';

/** Al volver a Moss, no se pregunta de nuevo antes de esto. */
const CADA = 10 * 60_000;
/** Recién abierta, recargarse todavía parece parte del arranque. */
const ARRANQUE = 6_000;

/**
 * Las actualizaciones por aire, sin esperar. De fábrica, expo-updates baja la nueva al abrir y la muestra
 * recién en el próximo arranque desde cero, y iOS deja a Moss abierta de fondo durante días: se seguía viendo
 * lo viejo (17/11/2026). Acá se busca al abrir y al volver, y lo bajado entra cuando Moss se va al fondo, sin
 * cortar lo que se está haciendo (con una hoja abierta espera a la próxima), o enseguida si recién abre.
 */
export function useActualizaciones() {
  useEffect(() => {
    if (!Updates.isEnabled) return;
    const abierta = Date.now();
    let mirada = 0;
    let lista = false;
    let buscando = false;

    const buscar = async () => {
      if (buscando || lista || (mirada && Date.now() - mirada < CADA)) return;
      buscando = true;
      mirada = Date.now();
      try {
        const hay = await Updates.checkForUpdateAsync();
        if (hay.isAvailable) {
          lista = (await Updates.fetchUpdateAsync()).isNew;
          if (lista && Date.now() - abierta < ARRANQUE) await Updates.reloadAsync();
        }
      } catch {
        // Sin conexión o con el servidor caído: se prueba la próxima vez.
      } finally {
        buscando = false;
      }
    };

    buscar();
    const escucha = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') buscar();
      else if (estado === 'background' && lista && !hayHojasAbiertas()) Updates.reloadAsync().catch(() => {});
    });
    return () => escucha.remove();
  }, []);
}
