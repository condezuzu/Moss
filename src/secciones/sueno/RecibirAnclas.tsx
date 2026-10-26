// Lo que avisaron los Atajos y el despertador mientras Moss estaba cerrada (app-intents/, con
// expo-app-intents): cada invocación se guarda como ancla de la noche (src/salud/anclas.ts) con su id,
// así no cuenta dos veces, y recién entonces sale de la cola. Después, la noche de anoche se vuelve a
// estimar con lo que llegó. Va montado una sola vez, en src/app/_layout.tsx.

import * as AppIntents from 'expo-app-intents';

import { elAlmacen } from '@/almacen';
import { SENALES, type QueSenal, type Senal } from '@/dominio/sinReloj';
import { guardarSenales } from '@/salud/anclas';
import { estimarAnoche } from '@/salud/nocheSinReloj';

const conocida = (nombre: string): nombre is QueSenal => (SENALES as readonly string[]).includes(nombre);

/** Hasta que el almacén abrió la base: la tabla de anclas existe recién después de migrar. */
function almacenListo(): Promise<void> {
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

export function RecibirAnclas() {
  AppIntents.useAppIntents(async (pendientes) => {
    if (!pendientes.length) return;
    await almacenListo();
    const nuevas = pendientes.flatMap((i): Senal[] => (conocida(i.name) ? [{ id: i.id, que: i.name, en: i.createdAt }] : []));
    try {
      await guardarSenales(nuevas);
    } catch (error) {
      // Quedan en la cola: se vuelven a intentar la próxima vez que se abra Moss.
      console.warn('Moss no pudo guardar lo que avisaron los Atajos', error);
      return;
    }
    // Lo que esta versión no conoce no se va a poder guardar nunca: sale de la cola igual.
    for (const i of pendientes) await AppIntents.removePendingInvocationAsync(i.id).catch(() => {});
    await estimarAnoche(elAlmacen()).catch(() => {});
  });
  return null;
}
