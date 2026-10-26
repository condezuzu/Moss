// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito, el horario de comidas, las comidas sin anotar y pesarse. Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

import type { Estado } from '@/almacen/almacen';
import { avisosDeLaSemana, cuandoSuena, type Aviso, type Avisos, type Evento, type Notificacion, type Sueno as SuenoDeAvisos } from '@/dominio/avisos';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { claveDelDia, diaDeLaSemana, sumarDias, type ClaveDia } from '@/dominio/fechas';
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

type Para = Pick<Estado, 'hoy' | 'registros' | 'recordatorios' | 'avisos' | 'habitos' | 'marcas' | 'perfil' | 'salud' | 'noches' | 'metas' | 'pesos'>;

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

/** La hora de siempre de cada comida: la mediana de cuándo se anotó en tres semanas, o la típica. */
export function horasDeComida(e: Pick<Estado, 'hoy' | 'registros'>): (c: Comida) => number {
  const desde = sumarDias(e.hoy, -21);
  const registros = vigentes(e.registros.values()).filter((r) => r.dia >= desde && r.dia < e.hoy && !r.planificado);
  return (c: Comida) => horaHabitual(registros.filter((r) => r.comida === c).map((r) => minutosDe(r.momento)), c === 'snack' ? 16 * 60 : HORA_TIPICA[c], c === 'cena' || c === 'merienda');
}

/** Lo que el plan dejó para esa comida de ese día, en pocas palabras: «pollo a la plancha, arroz». */
function planDe(e: Pick<Estado, 'registros'>, dia: ClaveDia, comida: Comida): string {
  const nombres = vigentes(e.registros.values()).filter((r) => r.dia === dia && r.comida === comida && r.planificado).map((r) => r.nombre.toLowerCase());
  return nombres.length > 3 ? `${nombres.slice(0, 3).join(', ')}…` : nombres.join(', ');
}

/** Lo que dice cada aviso, sin culpa; los que suenan juntos, en una línea. */
function textoDe(n: Notificacion, e: Pick<Estado, 'habitos' | 'registros'>): string {
  const uno = (a: Aviso) => {
    if (a.tipo === 'dormir') return t('recordatorios.dormir', { hora: horaDeReloj(a.dormirA ?? a.minutos) });
    if (a.tipo === 'horario' && a.comida) {
      const hora = t(`recordatorios.horario.${a.comida}`);
      const plan = planDe(e, n.dia, a.comida);
      return plan ? t('recordatorios.conPlan', { hora, plan }) : `${hora}.`;
    }
    if (a.tipo === 'pesarse') return t(a.control ? 'recordatorios.pesarseControl' : 'recordatorios.pesarse');
    if (a.tipo === 'comida' && a.comida) return t('recordatorios.cuerpo', { comida: t(`comida.comidas.${a.comida}`).toLowerCase() });
    const habito = e.habitos.find((h) => h.id === a.habito)?.nombre ?? '';
    return a.mensaje || t('recordatorios.habito', { habito });
  };
  return n.avisos.map(uno).join(' · ');
}

// Una programación a la vez: si mientras una programa llega otra, la primera se corta y la segunda
// empieza de cero. Dos a la vez se borraban lo programado y duplicaban el resto.
let enCurso: Promise<void> = Promise.resolve();
let vuelta = 0;

/** Borra los avisos que había y programa los de la semana, si hay alguno encendido y permiso. */
export function programarAvisos(e: Para): Promise<void> {
  const esta = ++vuelta;
  enCurso = enCurso.then(() => programar(e, () => esta !== vuelta)).catch(() => {});
  return enCurso;
}

async function programar(e: Para, vieja: () => boolean): Promise<void> {
  if (!hayAvisos || vieja()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const ajustes: Avisos = { ...e.avisos, comidas: e.recordatorios ?? [] };
  const alguno = !!ajustes.dormir?.encendido || !!ajustes.comidas?.length || !!ajustes.habitos?.length || !!Object.keys(ajustes.horario ?? {}).length || !!ajustes.pesarse?.encendido;
  if (!alguno || !(await Notifications.getPermissionsAsync()).granted) return;
  const horaDeComida = horasDeComida(e);
  const ahora = new Date();
  // Hoy y ahora, del mismo instante: a la medianoche, el almacén todavía puede tener el día de ayer.
  const hoy = claveDelDia(ahora);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r.momento);
  const lista = avisosDeLaSemana({
    hoy, ahora: ahora.getHours() * 60 + ahora.getMinutes(), ajustes, habitos: e.habitos, sueno: suenoParaAvisos(e), horaDeComida,
    marcas: e.marcas, anotadasHoy: new Set(deHoy.map((r) => r.comida)), eventosHoy,
    // El control es el día que se eligió o, sin elegir, el de la primera meta (como en el almacén).
    diaDelControl: e.perfil?.diaDelControl ?? (e.metas[0] ? diaDeLaSemana(e.metas[0].desde) : undefined),
    pesadoHoy: e.pesos.some((p) => p.fecha === hoy),
  });
  for (const n of lista) {
    if (vieja()) return;
    const c = cuandoSuena(n.dia, n.minutos);
    const [a, m, d] = c.dia.split('-').map(Number);
    const fecha = new Date(a, m - 1, d, c.hora, c.minuto);
    // iOS rechaza una fecha que ya pasó, y cortaría los que siguen.
    if (fecha.getTime() <= Date.now()) continue;
    const primero = n.avisos[0];
    try {
      await Notifications.scheduleNotificationAsync({
        // Lo que lleva el aviso para abrir lo suyo al tocarlo (useAlTocarUnAviso).
        // La comida va con su día: tocado pasada la medianoche o a la mañana, se anota en el día del aviso.
        content: { title: 'Moss', body: textoDe(n, e), data: { tipo: primero.tipo, ...(primero.comida ? { comida: primero.comida, dia: n.dia } : {}) } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha },
      });
    } catch {
      // Uno que no se pudo programar no deja sin los demás.
    }
  }
}

/** Lo que se abre al tocar un aviso; con una comida, el día del aviso. */
export type AlTocarUnAviso = { tipo: Aviso['tipo']; comida?: Comida; dia?: ClaveDia };

/**
 * Tocar un aviso abre lo suyo (la comida para anotarla, Hábitos, el peso o el sueño), también si
 * abrió Moss desde cero. Lo ya abierto se borra, así no vuelve a abrirse la próxima vez.
 */
export function useAlTocarUnAviso(abrir: (a: AlTocarUnAviso) => void) {
  const alTocar = useEffectEvent((respuesta: Notifications.NotificationResponse | null) => {
    const datos = respuesta?.notification.request.content.data as Partial<AlTocarUnAviso> | undefined;
    if (!datos?.tipo) return;
    Notifications.clearLastNotificationResponse();
    const dia = typeof datos.dia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(datos.dia) ? datos.dia : undefined;
    abrir({ tipo: datos.tipo, ...(datos.comida ? { comida: datos.comida } : {}), ...(dia ? { dia } : {}) });
  });
  useEffect(() => {
    if (!hayAvisos) return;
    alTocar(Notifications.getLastNotificationResponse());
    const suscripcion = Notifications.addNotificationResponseReceivedListener(alTocar);
    return () => suscripcion.remove();
  }, []);
}
