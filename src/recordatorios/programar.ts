// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito y las comidas sin anotar. Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { Estado } from '@/almacen/almacen';
import { avisosDeLaSemana, cuandoSuena, type Aviso, type Avisos, type Evento, type Notificacion, type Sueno as SuenoDeAvisos } from '@/dominio/avisos';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { sumarDias } from '@/dominio/fechas';
import { horaHabitual } from '@/dominio/recordatorios';
import { vigentes } from '@/dominio/registros';
import { habitualDe } from '@/dominio/sinReloj';
import { deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { suenoDe } from '@/secciones/persona';
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

/** «23:20» de unos minutos en la cuenta de un día (lo de la noche pasa de 1440). */
export const horaDeReloj = (minutos: number) => {
  const m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

type Para = Pick<Estado, 'hoy' | 'registros' | 'recordatorios' | 'avisos' | 'habitos' | 'marcas' | 'perfil' | 'salud' | 'noches'>;

/** Lo del sueño que usan los avisos: sin noches de verdad (las de ejemplo no valen), nada. */
export function suenoParaAvisos(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches'>): SuenoDeAvisos | null {
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches);
  if (s.deEjemplo) return null;
  return {
    habitual: (clave) => habitualDe(s.noches, clave),
    necesidad: s.necesidad,
    deuda: deudaDeSueno(ultimasNoches(s.noches, e.hoy, 14), s.necesidad)?.minutos ?? null,
  };
}

/** Lo que dice cada aviso, sin culpa; los que suenan juntos, en una línea. */
function textoDe(n: Notificacion, e: Pick<Estado, 'habitos'>): string {
  const uno = (a: Aviso) => {
    if (a.tipo === 'dormir') return t('recordatorios.dormir', { hora: horaDeReloj(a.dormirA ?? a.minutos) });
    if (a.tipo === 'comida' && a.comida) return t('recordatorios.cuerpo', { comida: t(`comida.comidas.${a.comida}`).toLowerCase() });
    const habito = e.habitos.find((h) => h.id === a.habito)?.nombre ?? '';
    return a.mensaje || t('recordatorios.habito', { habito });
  };
  return n.avisos.map(uno).join(' · ');
}

/** Borra los avisos que había y programa los de la semana, si hay alguno encendido y permiso. */
export async function programarAvisos(e: Para): Promise<void> {
  if (!hayAvisos) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const ajustes: Avisos = { ...e.avisos, comidas: e.recordatorios ?? [] };
  const alguno = !!ajustes.dormir?.encendido || !!ajustes.comidas?.length || !!ajustes.habitos?.length;
  if (!alguno || !(await Notifications.getPermissionsAsync()).granted) return;
  const desde = sumarDias(e.hoy, -21);
  const registros = vigentes(e.registros.values()).filter((r) => r.dia >= desde && r.dia <= e.hoy && !r.planificado);
  const horaDeComida = (c: Comida) => horaHabitual(registros.filter((r) => r.comida === c && r.dia < e.hoy).map((r) => minutosDe(r.momento)), c === 'snack' ? 16 * 60 : HORA_TIPICA[c]);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = registros.filter((r) => r.dia === e.hoy).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r.momento);
  const ahora = new Date();
  const lista = avisosDeLaSemana({
    hoy: e.hoy, ahora: ahora.getHours() * 60 + ahora.getMinutes(), ajustes, habitos: e.habitos, sueno: suenoParaAvisos(e), horaDeComida,
    marcas: e.marcas, anotadasHoy: new Set(deHoy.map((r) => r.comida)), eventosHoy,
  });
  for (const n of lista) {
    const c = cuandoSuena(n.dia, n.minutos);
    const [a, m, d] = c.dia.split('-').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Moss', body: textoDe(n, e) },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(a, m - 1, d, c.hora, c.minuto) },
    });
  }
}
