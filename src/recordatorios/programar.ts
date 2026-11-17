// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito, el horario de comidas, las comidas sin anotar, pesarse, lo que conviene hacer y el día que sigue
// tu despertar (sigueElDespertar.ts: lo de la mañana espera a que te despiertes). Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

import { reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { comidasHabituales, sesionesDelDia } from '@/dominio/alrededorDelEntreno';
import {
  avisosDeLaSemana, cuandoSuena, esDeEntrenar, horasDeSueno, horaDeReloj, textoDelAviso, tituloDelAviso, type Aviso, type Avisos, type Evento, type Notificacion, type Sueno as SuenoDeAvisos,
} from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { apagaLoQueConviene } from '@/dominio/cuidados';
import { claveDeMarca } from '@/dominio/dias';
import { diaDeLaSemana, diaLogico, diasEntre, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { loQueConviene, QUE_CONVIENE, type DeLoQueConviene } from '@/dominio/loQueConviene';
import { edadDe } from '@/dominio/metas';
import { avisosDelDespertar, deFabrica, RESPUESTAS_DEL_DESAYUNO, type DeSigueElDespertar, type RespuestaDelDesayuno } from '@/dominio/sigueElDespertar';
import { horasDeSiempre } from '@/dominio/recordatorios';
import { aguaDelDia, recientes, totalDelDia, vigentes } from '@/dominio/registros';
import { bajoAlFinal, horaDeLaTarde, loQueFaltaHoy, type FaltaConHora } from '@/dominio/loQueFalta';
import { habitualDe, margenParaDormirte } from '@/dominio/sinReloj';
import { avisoDePrueba, avisosHasta } from '@/dominio/premium';
import { despiertoDeLaNoche, deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { accesoActual, hayPremium, seSabeElAcceso, suscripcionActual } from '@/lib/premium';
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
  return (await pedirPermisoDeAvisosConMotivo()) === 'si';
}

/**
 * Como `pedirPermisoDeAvisos`, y sin permiso dice por qué: 'no' si se acaba de negar en el diálogo de
 * iOS, 'soloEnAjustes' si se negó antes (iOS ya no vuelve a preguntar: solo se da desde Ajustes).
 */
export async function pedirPermisoDeAvisosConMotivo(): Promise<'si' | 'no' | 'soloEnAjustes'> {
  if (!hayAvisos) return 'no';
  try {
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) return 'si';
    if (!actual.canAskAgain) return 'soloEnAjustes';
    return (await Notifications.requestPermissionsAsync()).granted ? 'si' : 'no';
  } catch {
    return 'no';
  }
}

/** Cuándo se anotó, en la cuenta de su día (D32): la cena de las 0:30 es la 1470, no la 30. */
const minutosDe = (r: { momento: string; dia: ClaveDia }) => minutosEnElDia(new Date(r.momento), r.dia);

export { horaDeReloj };

/**
 * Lo del almacén que usan los avisos: cuando cambia algo de esto, el almacén los vuelve a programar
 * (src/almacen/index.ts). Lo que tardas en dormirte, lo que necesitas dormir y la hora en que empieza el día
 * también los mueven.
 */
export const LO_QUE_MUEVE_LOS_AVISOS = [
  'hoy', 'corte', 'latencia', 'necesidad', 'registros', 'recordatorios', 'avisos', 'habitos', 'marcas', 'perfil', 'salud', 'noches', 'metas', 'pesos', 'entreno', 'agua', 'numeros',
  // El día que sigue tu despertar: a qué hora te despertaste y qué contestaste a «¿Desayunas hoy?». Y los cuidados,
  // que apagan algo de lo que conviene (el reflujo corre la última comida).
  'despertares', 'desayunos', 'cuidados',
] as const;

type Para = Pick<Estado, (typeof LO_QUE_MUEVE_LOS_AVISOS)[number]>;

/** Lo del sueño que usan los avisos: sin noches de verdad (las de ejemplo no valen), nada. */
export function suenoParaAvisos(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'latencia' | 'necesidad'>): SuenoDeAvisos | null {
  // Con lo que elegiste en «Necesito dormir», dentro de lo de tu edad; sin elegir, lo de tu edad.
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches, e.necesidad);
  if (s.deEjemplo) return null;
  const nec = s.necesidad;
  return {
    habitual: (clave) => habitualDe(s.noches, clave),
    necesidad: nec,
    deuda: deudaDeSueno(ultimasNoches(s.noches, e.hoy, 14), nec)?.minutos ?? null,
    // Tu margen para dormirte: la hora de acostarte lo descuenta.
    latencia: margenParaDormirte(e.latencia),
    // Y, con un reloj o un anillo, lo que sueles estar despierto en la noche: para dormir lo que necesitas, hay que estar en la cama eso más.
    despierto: despiertoDeLaNoche(s.noches),
  };
}

/**
 * Lo del sueño con el día que sigue tu despertar: el despertar real de cada día y cuándo se supo (los que guardó
 * buscarDespertar, en src/salud/despertar.ts), o null mientras no se sabe. Así lo de la mañana espera y la noche se
 * arma con esa hora.
 */
export function suenoDelDia(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'latencia' | 'necesidad' | 'despertares'>): SuenoDeAvisos | null {
  const s = suenoParaAvisos(e);
  return s && { ...s, despertarReal: (dia) => e.despertares[dia]?.despertar ?? null, despertarSabido: (dia) => e.despertares[dia]?.sabido ?? null };
}

/** La deuda de ayer, sin la noche de hoy: para decir al despertarte si bajó o subió. */
function deudaDeAyer(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'necesidad'>): number | null {
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches, e.necesidad);
  return s.deEjemplo ? null : (deudaDeSueno(ultimasNoches(s.noches, sumarDias(e.hoy, -1), 14), s.necesidad)?.minutos ?? null);
}

/**
 * Los avisos como suenan: lo elegido y, en lo que no se tocó, lo de fábrica del día que sigue tu despertar (la deuda,
 * el horario, la melatonina, las revoluciones, las luces, la hora de dormir y el máximo de diez). Perfil muestra esto.
 */
export function avisosDe(e: Pick<Estado, 'avisos' | 'hoy' | 'registros'>): Avisos {
  return deFabrica(e.avisos, horasDeComida(e));
}

/** La cafeína de una toma, si se anotó al menos tres de los últimos 14 días: la mediana, en mg. */
export function cafeinaPorToma(e: Pick<Estado, 'registros' | 'hoy'>): number | null {
  const tomas = vigentes(e.registros.values()).filter((r) => !r.planificado && (r.valores.micros?.cafeina ?? 0) > 0 && diasEntre(r.dia, e.hoy) >= 0 && diasEntre(r.dia, e.hoy) < 14);
  if (new Set(tomas.map((r) => r.dia)).size < 3) return null;
  const mg = tomas.map((r) => r.valores.micros!.cafeina!).sort((a, b) => a - b);
  return mg[Math.floor(mg.length / 2)];
}

/** La hora de siempre de cada comida: la mediana de cuándo se anotó en tres semanas, o la típica (la misma con que se anota lo de otra comida). */
export function horasDeComida(e: Pick<Estado, 'hoy' | 'registros'>): (c: Comida) => number {
  return horasDeSiempre(e.registros.values(), e.hoy);
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

/** El título: lo que conviene y lo de la noche dicen ahí qué hacer; los demás, «Moss». */
const tituloDe = (n: Notificacion): string =>
  tituloDelAviso(n, { t: t as (clave: string, valores?: Record<string, string | number>) => string, habito: () => '', plan: () => '', duracion });

/** Si hay que avisar de lo que falta: lo que se eligió o, sin elegir, si hay otro aviso prendido (y por lo tanto permiso). */
export const conLoQueFalta = (ajustes: Avisos, alguno: boolean) => ajustes.falta?.encendido ?? alguno;

/** Los interruptores sueltos: lo que conviene y lo del día que sigue tu despertar. */
const SUELTOS = [...QUE_CONVIENE, 'deuda', 'melatonina', 'revoluciones', 'descarga', 'gafas'] as const;

/** Si hay algún aviso prendido: las comidas sin anotar, dormir, el horario, pesarse, un hábito o uno suelto. Perfil dice lo mismo. */
export const algunAviso = (e: Pick<Estado, 'avisos' | 'recordatorios'>) =>
  !!e.recordatorios?.length || !!e.avisos.dormir?.encendido || !!e.avisos.habitos?.length || !!Object.keys(e.avisos.horario ?? {}).length || !!e.avisos.pesarse?.encendido
  || SUELTOS.some((q) => !!e.avisos[q]?.encendido);

/** Lo que Moss avisaría hoy de lo que falta, con lo anotado hasta ahora. Lo planificado cuenta: si la cena lo resuelve, nada. */
export function faltasDeHoy(e: Para, hoy: ClaveDia, ahora: number, horaDeComida: (c: Comida) => number, sueno = suenoParaAvisos(e)): FaltaConHora[] {
  const meta = metaDelDia(e, hoy);
  if (!meta) return [];
  const registros = vigentes(e.registros.values()).filter((r) => r.dia === hoy);
  const anotados = registros.filter((r) => !r.planificado);
  const anotadas: Partial<Record<Comida, number>> = {};
  for (const r of anotados) anotadas[r.comida] = Math.min(anotadas[r.comida] ?? Infinity, minutosDe(r));
  const horaDeCena = horaDeComida('cena');
  // Lo que se sabía a la hora de la tarde, para saber qué dijo si ya pasó: lo anotado hasta entonces, no lo
  // que tiene una hora de antes (lo dicho a la noche con el nombre del almuerzo va a las 13).
  const tarde = horaDeLaTarde(horaDeCena);
  const yaAnotado = (x: { actualizado: string }) => minutosEnElDia(new Date(x.actualizado), hoy) <= tarde;
  const ayer = sumarDias(hoy, -1);
  const metaDeAyer = metaDelDia(e, ayer);
  // El agua, solo para quien la suele anotar: al menos tres días de los últimos siete, u hoy.
  const conAgua = new Set(vigentes(e.agua.values()).filter((x) => x.dia >= sumarDias(hoy, -7)).map((x) => x.dia));
  const tomasHoy = vigentes(e.agua.values()).filter((x) => x.dia === hoy);
  return loQueFaltaHoy({
    dia: hoy, ahora, meta, comido: totalDelDia(registros, hoy, true), comidoALaTarde: totalDelDia(registros.filter((r) => r.planificado || yaAnotado(r)), hoy, true), anotadas,
    planeadas: new Set(registros.filter((r) => r.planificado).map((r) => r.comida)),
    horaDeCena, acostarse: sueno ? horasDeSueno(hoy, sueno).acostarse : null,
    comidasHabituales: comidasHabituales(e.registros.values(), hoy),
    agua: conAgua.size >= 3 || conAgua.has(hoy)
      ? { ml: aguaDelDia(tomasHoy, hoy), mlALaTarde: aguaDelDia(tomasHoy.filter(yaAnotado), hoy) }
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
/**
 * «¿Desayunas hoy?» trae sus dos respuestas. «Sí» abre Moss en el desayuno, para anotarlo; «Voy directo al almuerzo»
 * se guarda sin abrirla. Si iOS no le pasa la respuesta a Moss, anotar el almuerzo primero dice lo mismo.
 */
const CATEGORIA_DESAYUNO = 'desayuno';
const accionDelDesayuno = (r: RespuestaDelDesayuno) => `desayuno:${r}`;
let categorias: Promise<unknown> | undefined;
const prepararCategorias = () =>
  (categorias ??= Promise.all([
    Notifications.setNotificationCategoryAsync(CATEGORIA_DORMIR, [
      { identifier: ME_VOY_A_DORMIR, buttonTitle: t('recordatorios.meVoyADormir'), options: { opensAppToForeground: true } },
    ]),
    Notifications.setNotificationCategoryAsync(CATEGORIA_DESAYUNO, RESPUESTAS_DEL_DESAYUNO.map((r) => (
      { identifier: accionDelDesayuno(r), buttonTitle: t(`recordatorios.despertar.desayuno.${r}`), options: { opensAppToForeground: r === 'si' } }
    ))),
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

/**
 * Los avisos que ya llegaron y ya no dicen nada salen del centro de notificaciones y de la pantalla
 * bloqueada: «¿Anotaste la cena?» con la cena anotada, «pesarse» con el peso de hoy, y los de días
 * anteriores (salvo el del fin de la prueba).
 */
async function sacarLosQueYaNoDicenNada(e: Para): Promise<void> {
  const llegados = await Notifications.getPresentedNotificationsAsync().catch(() => [] as Notifications.Notification[]);
  if (!llegados.length) return;
  const hoy = diaLogico(new Date(), e.corte);
  const anotadas = new Set(vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).map((r) => r.comida));
  const pesadoHoy = e.pesos.some((p) => p.fecha === hoy);
  for (const n of llegados) {
    const datos = n.request.content.data as Partial<AlTocarUnAviso> | undefined;
    if (!datos?.tipo) continue;
    const dia = datos.dia ?? diaLogico(new Date(n.date), e.corte);
    const deOtroDia = dia < hoy && datos.tipo !== 'prueba';
    const comidaHecha = (datos.tipo === 'comida' || datos.tipo === 'horario' || datos.tipo === 'desayuno') && !!datos.comida && dia === hoy && anotadas.has(datos.comida);
    const pesoHecho = datos.tipo === 'pesarse' && pesadoHoy;
    // «¿Desayunas hoy?» ya contestado, o con otra comida anotada: ya no pregunta nada.
    const desayunoDicho = datos.tipo === 'desayuno' && dia === hoy && (!!e.desayunos[hoy] || anotadas.size > 0);
    if (deOtroDia || comidaHecha || pesoHecho || desayunoDicho) await Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {});
  }
}

async function programar(e: Para, vieja: () => boolean): Promise<void> {
  if (!hayAvisos || vieja()) return;
  await sacarLosQueYaNoDicenNada(e);
  if (vieja()) return;
  // Mientras Apple y la cuenta no contestan no se sabe si hay acceso: lo programado queda como estaba, y
  // se rehace cuando contestan (el almacén oye alCambiarPremium). Borrarlo dejaba la semana sin avisos.
  if (!seSabeElAcceso()) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  // Sin acceso (venció o canceló) no suena nada: lo elegido queda, y vuelve al suscribirse.
  if (!hayPremium()) return;
  const horaDeComida = horasDeComida(e);
  // Lo que un cuidado de salud apaga de lo que conviene (Cuidados) no suena, aunque esté prendido.
  const reglas = reglasDeCuidados(e);
  const apagados = reglas ? Object.fromEntries(QUE_CONVIENE.filter((q) => apagaLoQueConviene(q, reglas)).map((q) => [q, { encendido: false }])) : {};
  const ajustes: Avisos = { ...deFabrica(e.avisos, horaDeComida), ...apagados, comidas: e.recordatorios ?? [] };
  const finDePrueba = avisoDePrueba(suscripcionActual(), Date.now());
  // Cancelada, nada después de que vence: sin acceso no suena, aunque Moss no se abra para borrarlo.
  const hasta = avisosHasta(suscripcionActual(), accesoActual());
  const elegido = algunAviso({ avisos: ajustes, recordatorios: e.recordatorios });
  const conFalta = conLoQueFalta(ajustes, elegido);
  if ((!elegido && !conFalta && finDePrueba === null) || !(await Notifications.getPermissionsAsync()).granted) return;
  await prepararCategorias();
  const ahora = new Date();
  // Hoy y ahora, del mismo instante: justo al corte, el almacén todavía puede tener el día anterior.
  // Con el día que empieza a las 4 (D32), a la 1 hoy es ayer y ahora es la 1500 de ese día.
  const hoy = diaLogico(ahora, e.corte);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r);
  const minutos = minutosEnElDia(ahora, hoy);
  const sueno = suenoDelDia(e);
  // El control es el día que se eligió o, sin elegir, el de la primera meta (como en el almacén).
  const diaDelControl = e.perfil?.diaDelControl ?? (e.metas[0] ? diaDeLaSemana(e.metas[0].desde) : undefined);
  // Lo que conviene y lo del día que sigue tu despertar, de cada día; hoy, con lo que ya anotaste e hiciste.
  const comun: Omit<DeLoQueConviene & DeSigueElDespertar, 'dia'> = {
    ajustes, sueno, horaDeComida, diaDelControl, deudaAntes: deudaDeAyer(e), sinNumeros: !e.numeros,
    viaje: e.entreno?.viaje, pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null, ...(e.perfil ? { edad: edadDe(e.perfil, hoy) } : {}),
    comidasHabituales: comidasHabituales(e.registros.values(), hoy), cafeinaPorToma: cafeinaPorToma(e),
    sinDeficit: !!e.perfil?.sinDeficit, reflujo: !!reglas?.cuidados.includes('reflujo'),
  };
  const entrenadoHoy = e.habitos.filter(esDeEntrenar).map((h) => e.marcas.get(claveDeMarca(h.id, hoy))).find((m) => m?.hecho);
  const deHoyParaConviene = {
    anotadas: new Set(deHoy.map((r) => r.comida)), eventos: eventosHoy, comido: totalDelDia(e.registros.values(), hoy, false),
    desayuno: e.desayunos[hoy] ?? null, entrenado: entrenadoHoy ? minutosEnElDia(new Date(entrenadoHoy.momento), hoy) : null,
  };
  const convieneDe = (dia: ClaveDia): Aviso[] => {
    const op = { ...comun, dia, sesiones: sesionesDelDia(e.entreno, dia), meta: metaDelDia(e, dia), ...(dia === hoy ? deHoyParaConviene : {}) };
    return [...loQueConviene(op), ...avisosDelDespertar(op)];
  };
  const lista = avisosDeLaSemana({
    hoy, ahora: minutos, ajustes, habitos: e.habitos, sueno, horaDeComida, corte: e.corte,
    sesionesDe: (dia) => sesionesDelDia(e.entreno, dia), convieneDe,
    faltasHoy: conFalta ? faltasDeHoy(e, hoy, minutos, horaDeComida, sueno) : [],
    marcas: e.marcas, anotadasHoy: new Set(deHoy.map((r) => r.comida)), eventosHoy,
    diaDelControl,
    pesadoHoy: e.pesos.some((p) => p.fecha === hoy),
  });
  for (const n of lista) {
    if (vieja()) return;
    const c = cuandoSuena(n.dia, n.minutos);
    const [a, m, d] = c.dia.split('-').map(Number);
    const fecha = new Date(a, m - 1, d, c.hora, c.minuto);
    // iOS rechaza una fecha que ya pasó, y cortaría los que siguen.
    if (fecha.getTime() <= Date.now() || (hasta !== null && fecha.getTime() >= hasta)) continue;
    const { aviso } = n;
    try {
      await Notifications.scheduleNotificationAsync({
        // Lo que lleva el aviso para abrir lo suyo al tocarlo (useAlTocarUnAviso).
        // La comida va con su día: tocado pasada la medianoche o a la mañana, se anota en el día del aviso.
        content: {
          title: tituloDe(n), body: textoDe(n, e), data: { tipo: aviso.tipo, ...(aviso.comida ? { comida: aviso.comida, dia: n.dia } : {}), ...(aviso.falta ? { que: aviso.falta.que } : {}) },
          ...(aviso.tipo === 'dormir' ? { categoryIdentifier: CATEGORIA_DORMIR } : aviso.tipo === 'desayuno' ? { categoryIdentifier: CATEGORIA_DESAYUNO } : {}),
        },
        // A la hora del reloj y no «dentro de tantos segundos» (eso hace DATE en iOS): quien viaja a otra
        // zona horaria, o pasa el cambio de hora sin abrir Moss, lo recibe a la hora que dice.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, year: a, month: m, day: d, hour: c.hora, minute: c.minuto, second: 0, repeats: false },
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
export type AlTocarUnAviso = {
  tipo: Aviso['tipo'] | 'prueba'; comida?: Comida; dia?: ClaveDia; que?: string; meVoyADormir?: { id: string; en: number };
  /** Lo que se contestó con un botón de «¿Desayunas hoy?». */
  desayuno?: RespuestaDelDesayuno;
};

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
    const desayuno = RESPUESTAS_DEL_DESAYUNO.find((r) => respuesta?.actionIdentifier === accionDelDesayuno(r));
    abrir({
      tipo: datos.tipo, ...(datos.comida ? { comida: datos.comida } : {}), ...(dia ? { dia } : {}), ...(typeof datos.que === 'string' ? { que: datos.que } : {}),
      ...(meVoyADormir ? { meVoyADormir } : {}), ...(desayuno ? { desayuno } : {}),
    });
  });
  useEffect(() => {
    if (!hayAvisos) return;
    alTocar(Notifications.getLastNotificationResponse());
    const suscripcion = Notifications.addNotificationResponseReceivedListener(alTocar);
    return () => suscripcion.remove();
  }, []);
}
