// La tarea de segundo plano (expo-background-task): cuando iOS la deja correr con Moss cerrada (suele
// ser de noche, cargando, y nunca a una hora fija), pone el día al día, aplica lo tocado en los widgets
// y les deja la línea nueva. Si Salud se puede leer (el teléfono desbloqueado), también enciende los
// hábitos de Salud y estima la noche, como al abrir Moss. Nada más: no sube nada ni anota que Moss se
// abrió (eso diría que estabas despierto).
// Solo en el iPhone y con los módulos en la build: en la web, en los tests o en una build vieja no hace nada.

import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { elAlmacen } from '@/almacen';
import { leerSalud } from '@/salud/leer';
import { estimarAnoche } from '@/salud/nocheSinReloj';
import { actualizarWidgets } from '@/widgets';

export const TAREA = 'moss-fondo';
/** Cada cuánto, como mínimo, en minutos: iOS decide cuándo de verdad. */
const CADA = 4 * 60;

type Modulos = { TaskManager: typeof import('expo-task-manager'); BackgroundTask: typeof import('expo-background-task') };

function cargar(): Modulos | null {
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoTaskManager') || !requireOptionalNativeModule('ExpoBackgroundTask')) return null;
  try {
    // Recién acá: importarlos sin su módulo nativo rompe al arrancar.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return { TaskManager: require('expo-task-manager'), BackgroundTask: require('expo-background-task') };
  } catch (error) {
    console.warn('Moss no pudo cargar la tarea de fondo', error);
    return null;
  }
}

const modulos = cargar();

async function correr(): Promise<void> {
  const a = elAlmacen();
  await a.iniciar();
  a.revisarDia();
  // Con el teléfono bloqueado Salud no se lee: sin eso no se sabe si hay reloj, y la noche no se estima.
  const salud = await leerSalud(new Date(), a.estado().fuenteDelSueno).catch(() => null);
  if (salud) {
    a.ponerSalud(salud);
    await estimarAnoche(a).catch(() => {});
  }
  await actualizarWidgets();
  await a.esperar();
}

// Al cargar el módulo, como pide expo-task-manager: cuando iOS abre Moss para la tarea, ya está.
if (modulos) {
  const { TaskManager, BackgroundTask } = modulos;
  TaskManager.defineTask(TAREA, async () => {
    try {
      await correr();
      return BackgroundTask.BackgroundTaskResult.Success;
    } catch (error) {
      console.warn('La tarea de fondo de Moss no terminó', error);
      return BackgroundTask.BackgroundTaskResult.Failed;
    }
  });
}

/** La registra una vez (queda guardada entre aperturas). Sin el módulo, o si iOS no la permite, nada. */
export async function registrarTareaDeFondo(): Promise<void> {
  if (!modulos) return;
  try {
    const { BackgroundTask } = modulos;
    if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return;
    await BackgroundTask.registerTaskAsync(TAREA, { minimumInterval: CADA });
  } catch (error) {
    console.warn('Moss no pudo registrar la tarea de fondo', error);
  }
}
