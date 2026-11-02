// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito, el horario de comidas, las comidas sin anotar y pesarse. Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

import type { Estado } from '@/almacen/almacen';
import { sesionesDelDia } from '@/dominio/alrededorDelEntreno';
import { avisosDeLaSemana, cuandoSuena, horasDeSueno, horaDeReloj, textoDelAviso, type Aviso, type Avisos, type Evento, type Notificacion, type Sueno as SuenoDeAvisos } from '@/dominio/avisos';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { diaDeLaSemana, diaLogico, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { horaHabitual } from '@/dominio/recordatorios';
import { aguaDelDia, recientes, totalDelDia, vigentes } from '@/dominio/registros';
import { bajoAlFinal, loQueFaltaHoy, type FaltaConHora } from '@/dominio/loQueFalta';
import { aprenderPersonal, habitualDe } from '@/dominio/sinReloj';
import { avisoDePrueba } from '@/dominio/premium';
import { deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { hayPremium, suscripcionActual } from '@/lib/premium';
import { duracion, metaDelDia } from '@/secciones/comida/datos';
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

/** Cuándo se anotó, en la cuenta de su día (D32): la cena de las 0:30 es la 1470, no la 30. */
const minutosDe = (r: { momento: string; dia: ClaveDia }) => minutosEnElDia(new Date(r.momento), r.dia);

export { horaDeReloj };

type Para = Pick<Estado, 'hoy' | 'corte' | 'latencia' | 'registros' | 'recordatorios' | 'avisos' | 'habitos' | 'marcas' | 'perfil' | 'salud' | 'noches' | 'metas' | 'pesos' | 'entreno' | 'agua' | 'numeros'>;

/** Lo del sueño que usan los avisos: sin noches de verdad (las de ejemplo no valen), nada. */
export function suenoParaAvisos(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'latencia'>): SuenoDeAvisos | null {
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches);
  if (s.deEjemplo) return null;
  return {
    habitual: (clave) => habitualDe(s.noches, clave),
    necesidad: s.necesidad,
    deuda: deudaDeSueno(ultimasNoches(s.noches, e.hoy, 14), s.necesidad)?.minutos ?? null,
    // Lo que tardás en dormirte (D33): la hora de ir a la cama la descuenta.
    latencia: aprenderPersonal([...e.noches.values()], e.hoy, e.latencia).latencia,
  };
}

/** La hora de siempre de cada comida: la mediana de cuándo se anotó en tres semanas, o la típica. */
export function horasDeComida(e: Pick<Estado, 'hoy' | 'registros'>): (c: Comida) => number {
  const desde = sumarDias(e.hoy, -21);
  const registros = vigentes(e.registros.values()).filter((r) => r.dia >= desde && r.dia < e.hoy && !r.planificado);
  return (c: Comida) => horaHabitual(registros.filter((r) => r.comida === c).map(minutosDe), c === 'snack' ? 16 * 60 : HORA_TIPICA[c], c === 'cena' || c === 'merienda');
}

/** Lo que el plan dejó para esa comida de ese día, en pocas palabras: «pollo a la plancha, arroz». */
function planDe(e: Pick<Estado, 'registros'>, dia: ClaveDia, comida: Comida): string {
  const nombres = vigentes(e.registros.values()).filter((r) => r.dia === dia && r.comida === comida && r.planificado).map((r) => r.nombre.toLowerCase());
  return nombres.length > 3 ? `${nombres.slice(0, 3).join(', ')}…` : nombres.join(', ');
}

/** Lo que dice un aviso, con las palabras del idioma de la app. */
const textoDe = (n: Notificacion, e: Pick<Estado, 'habitos' | 'registros'>): string =>
  textoDelAviso(n, {
    // Las claves las arma avisos.ts, y avisos.test.ts comprueba que existan todas.
    t: t as (clave: string, valores?: Record<string, string | number>) => string,
    habito: (id) => e.habitos.find((h) => h.id === id)?.nombre ?? '',
    plan: (dia, comida) => planDe(e, dia, comida),
    duracion,
  });

/** Si hay que avisar de lo que falta: lo que se eligió o, sin elegir, si hay otro aviso prendido (y por lo tanto permiso). */
export const conLoQueFalta = (ajustes: Avisos, alguno: boolean) => ajustes.falta?.encendido ?? alguno;

/** Lo que Moss avisaría hoy de lo que falta, con lo anotado hasta ahora. Lo planificado cuenta: si la cena lo resuelve, nada. */
export function faltasDeHoy(e: Para, hoy: ClaveDia, ahora: number, horaDeComida: (c: Comida) => number): FaltaConHora[] {
  const meta = metaDelDia(e, hoy);
  if (!meta) return [];
  const registros = vigentes(e.registros.values()).filter((r) => r.dia === hoy);
  const anotados = registros.filter((r) => !r.planificado);
  const anotadas: Partial<Record<Comida, number>> = {};
  for (const r of anotados) anotadas[r.comida] = Math.min(anotadas[r.comida] ?? Infinity, minutosDe(r));
  const horaDeCena = horaDeComida('cena');
  // A la tarde (lo mismo que loQueFaltaHoy): para saber qué dijo, si esa hora ya pasó.
  const antesDeCenar = Math.max(16 * 60 + 30, horaDeCena - 120);
  const dias21 = sumarDias(hoy, -21);
  const meriendas = new Set(vigentes(e.registros.values()).filter((r) => r.comida === 'merienda' && !r.planificado && r.dia >= dias21 && r.dia < hoy).map((r) => r.dia));
  const sueno = suenoParaAvisos(e);
  const ayer = sumarDias(hoy, -1);
  const metaDeAyer = metaDelDia(e, ayer);
  // El agua, solo para quien la suele anotar: al menos tres días de los últimos siete, u hoy.
  const conAgua = new Set(vigentes(e.agua.values()).filter((x) => x.dia >= sumarDias(hoy, -7)).map((x) => x.dia));
  const tomasHoy = vigentes(e.agua.values()).filter((x) => x.dia === hoy);
  return loQueFaltaHoy({
    dia: hoy, ahora, meta, comido: totalDelDia(registros, hoy, true), comidoALaTarde: totalDelDia(registros.filter((r) => r.planificado || minutosDe(r) <= antesDeCenar), hoy, true), anotadas,
    planeadas: new Set(registros.filter((r) => r.planificado).map((r) => r.comida)),
    horaDeCena, acostarse: sueno ? horasDeSueno(hoy, sueno).acostarse : null,
    comidasHabituales: meriendas.size >= 7 ? 4 : 3,
    agua: conAgua.size >= 3 || conAgua.has(hoy)
      ? { ml: aguaDelDia(tomasHoy, hoy), mlALaTarde: aguaDelDia(tomasHoy.filter((x) => minutosDe(x) <= antesDeCenar), hoy) }
      : null,
    bajoAyer: metaDeAyer ? bajoAlFinal(metaDeAyer, totalDelDia(e.registros.values(), ayer, false)) : [],
    propios: recientes(e.registros.values(), 30).filter((i) => i.fuente !== 'rapida').map((i) => ({ nombre: i.nombre, proteina: i.valores.proteina, kcal: i.valores.kcal, azucares: i.valores.azucares, alcohol: i.valores.alcohol })),
    dieta: e.perfil?.comer?.dieta, alergias: e.perfil?.comer?.alergias, sinDeficit: !!e.perfil?.sinDeficit, sinNumeros: !e.numeros,
  });
}

/**
 * El aviso de dormir trae «Me voy a dormir» (D33): tocarlo deja la hora en que te fuiste a la cama,
 * como el Atajo, sin armar nada (src/dominio/sinReloj.ts, deLasSenales).
 */
const CATEGORIA_DORMIR = 'dormir';
export const ME_VOY_A_DORMIR = 'meVoyADormir';
let categorias: Promise<unknown> | undefined;
const prepararCategorias = () =>
  (categorias ??= Notifications.setNotificationCategoryAsync(CATEGORIA_DORMIR, [
    { identifier: ME_VOY_A_DORMIR, buttonTitle: t('recordatorios.meVoyADormir'), options: { opensAppToForeground: true } },
  ]).catch(() => {}));

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
  // Sin acceso (venció o canceló) no suena nada: lo elegido queda, y vuelve al suscribirse.
  if (!hayPremium()) return;
  const ajustes: Avisos = { ...e.avisos, comidas: e.recordatorios ?? [] };
  const finDePrueba = avisoDePrueba(suscripcionActual(), Date.now());
  const elegido = !!ajustes.dormir?.encendido || !!ajustes.comidas?.length || !!ajustes.habitos?.length || !!Object.keys(ajustes.horario ?? {}).length || !!ajustes.pesarse?.encendido;
  const conFalta = conLoQueFalta(ajustes, elegido);
  if ((!elegido && !conFalta && finDePrueba === null) || !(await Notifications.getPermissionsAsync()).granted) return;
  await prepararCategorias();
  const horaDeComida = horasDeComida(e);
  const ahora = new Date();
  // Hoy y ahora, del mismo instante: justo al corte, el almacén todavía puede tener el día anterior.
  // Con el día que empieza a las 4 (D32), a la 1 hoy es ayer y ahora es la 1500 de ese día.
  const hoy = diaLogico(ahora, e.corte);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r);
  const minutos = minutosEnElDia(ahora, hoy);
  const lista = avisosDeLaSemana({
    hoy, ahora: minutos, ajustes, habitos: e.habitos, sueno: suenoParaAvisos(e), horaDeComida,
    sesionesDe: (dia) => sesionesDelDia(e.entreno, dia),
    faltasHoy: conFalta ? faltasDeHoy(e, hoy, minutos, horaDeComida) : [],
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
    const { aviso } = n;
    try {
      await Notifications.scheduleNotificationAsync({
        // Lo que lleva el aviso para abrir lo suyo al tocarlo (useAlTocarUnAviso).
        // La comida va con su día: tocado pasada la medianoche o a la mañana, se anota en el día del aviso.
        content: {
          title: 'Moss', body: textoDe(n, e), data: { tipo: aviso.tipo, ...(aviso.comida ? { comida: aviso.comida, dia: n.dia } : {}), ...(aviso.falta ? { que: aviso.falta.que } : {}) },
          ...(aviso.tipo === 'dormir' ? { categoryIdentifier: CATEGORIA_DORMIR } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha },
      });
    } catch {
      // Uno que no se pudo programar no deja sin los demás.
    }
  }
  // Dos días antes de que termine la prueba, como dice la pantalla de pago.
  if (finDePrueba !== null && !vieja()) {
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Moss', body: t('recordatorios.pruebaTermina'), data: { tipo: 'prueba' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(finDePrueba) },
    }).catch(() => {});
  }
}

/**
 * Lo que se abre al tocar un aviso; con una comida, el día del aviso. Con `meVoyADormir`, se tocó ese
 * botón del aviso de dormir: `id` y `en` son los de esa vez, para guardarla como ancla.
 */
export type AlTocarUnAviso = { tipo: Aviso['tipo'] | 'prueba'; comida?: Comida; dia?: ClaveDia; que?: string; meVoyADormir?: { id: string; en: number } };

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
    // La hora del toque es la de irte a la cama: la del aviso puede ser de hace un rato.
    const meVoyADormir = respuesta?.actionIdentifier === ME_VOY_A_DORMIR ? { id: `${respuesta.notification.request.identifier}:${ME_VOY_A_DORMIR}`, en: Date.now() } : undefined;
    abrir({ tipo: datos.tipo, ...(datos.comida ? { comida: datos.comida } : {}), ...(dia ? { dia } : {}), ...(typeof datos.que === 'string' ? { que: datos.que } : {}), ...(meVoyADormir ? { meVoyADormir } : {}) });
  });
  useEffect(() => {
    if (!hayAvisos) return;
    alTocar(Notifications.getLastNotificationResponse());
    const suscripcion = Notifications.addNotificationResponseReceivedListener(alTocar);
    return () => suscripcion.remove();
  }, []);
}
