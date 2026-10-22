// Los recordatorios para anotar, en el iPhone (src/dominio/recordatorios.ts dice cuáles): se
// programan los de la semana cada vez que se abre Moss y cada vez que se anota algo, así el de una
// comida ya anotada no llega. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Estado } from '@/almacen/almacen';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { sumarDias } from '@/dominio/fechas';
import { horaHabitual, recordatoriosDeLaSemana } from '@/dominio/recordatorios';
import { vigentes } from '@/dominio/registros';
import { t } from '@/textos';

const hayAvisos = Platform.OS !== 'web';

if (hayAvisos) {
  // Con Moss abierto, el aviso se ve igual, sin sonido.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
}

export async function pedirPermisoDeAvisos(): Promise<boolean> {
  if (!hayAvisos) return false;
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

const minutosDe = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

/** Borra los avisos que había y programa los de la semana, si están encendidos y hay permiso. */
export async function programarRecordatorios(e: Pick<Estado, 'hoy' | 'registros' | 'recordatorios'>): Promise<void> {
  if (!hayAvisos) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!e.recordatorios?.length || !(await Notifications.getPermissionsAsync()).granted) return;
  const desde = sumarDias(e.hoy, -21);
  const registros = vigentes(e.registros.values()).filter((r) => r.dia >= desde && r.dia <= e.hoy && !r.planificado);
  const hora = (c: Comida) => horaHabitual(registros.filter((r) => r.comida === c && r.dia < e.hoy).map((r) => minutosDe(r.momento)), c === 'snack' ? 16 * 60 : HORA_TIPICA[c]);
  const ahora = new Date();
  const lista = recordatoriosDeLaSemana({
    hoy: e.hoy, ahora: ahora.getHours() * 60 + ahora.getMinutes(), comidas: e.recordatorios, hora,
    anotadasHoy: new Set(registros.filter((r) => r.dia === e.hoy).map((r) => r.comida)),
  });
  for (const r of lista) {
    const [a, m, d] = r.dia.split('-').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Moss', body: t('recordatorios.cuerpo', { comida: t(`comida.comidas.${r.comida}`).toLowerCase() }) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(a, m - 1, d, Math.floor(r.minutos / 60), r.minutos % 60) },
    });
  }
}
