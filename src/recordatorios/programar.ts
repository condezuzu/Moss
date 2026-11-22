// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito, el horario de comidas, las comidas sin anotar, pesarse, lo que conviene hacer y el día que sigue
// tu despertar (sigueElDespertar.ts: lo de la mañana espera a que te despiertes, y la noche sale de tu periodo de
// melatonina, el mismo de Sueño). Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.

import * as Notifications from 'expo-notifications';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

import { horasDeComerDe, noSueleDe, reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { comidasHabituales, sesionesDelDia } from '@/dominio/alrededorDelEntreno';
import {
  avisosDeLaSemana, cuandoSuena, esDeEntrenar, horasDeSueno, horaDeReloj, textoDelAviso, tituloDelAviso, type Aviso, type Avisos, type Evento, type Notificacion, type Sueno as SuenoDeAvisos,
} from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { apagaLoQueConviene, apagaLoQueFalta, metaDeAgua, type Reglas } from '@/dominio/cuidados';
import { claveDeMarca } from '@/dominio/dias';
import { diaDeLaSemana, diaLogico, diasEntre, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { delDeporte, loQueConviene, QUE_CONVIENE, type DeLoQueConviene } from '@/dominio/loQueConviene';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import { edadDe } from '@/dominio/metas';
import { pendientesPara } from '@/dominio/pendientes';
import { avisosDelDespertar, deFabrica, RESPUESTAS_DEL_DESAYUNO, type DeSigueElDespertar, type RespuestaDelDesayuno } from '@/dominio/sigueElDespertar';
import { DIAS } from '@/dominio/recordatorios';
import { aguaDelDia, recientes, totalDelDia, vigentes } from '@/dominio/registros';
import { AGUA_META_ML, bajoAlFinal, horaDeLaTarde, loQueFaltaHoy, QUE_FALTA, type FaltaConHora } from '@/dominio/loQueFalta';
import { habitualDe, margenParaDormirte } from '@/dominio/sinReloj';
import { avisoDelRegalo, avisoDePrueba, avisosHasta } from '@/dominio/premium';
import { despiertoDeLaNoche, deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { accesoActual, finDelRegaloActual, hastaDelRegaloActual, hayPremium, seSabeElAcceso, suscripcionActual } from '@/lib/premium';
import { entrenosDelDia } from '@/salud/convertir';
import { duracion, fechaLarga, metaDelDia } from '@/secciones/comida/datos';
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
  // Lo que anotaste para mañana, y lo que ya tachaste: «Lo que hay que hacer hoy» dice lo que falta.
  'pendientes',
  // Tus horas de comer: las de tu día (y su «No suelo») y las que cambiaste a mano.
  'respuestas', 'horasDeComer',
] as const;

type Para = Pick<Estado, (typeof LO_QUE_MUEVE_LOS_AVISOS)[number]>;

/** Lo del sueño que usan los avisos: sin noches de verdad (las de ejemplo no valen), nada. */
export function suenoParaAvisos(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'latencia' | 'necesidad'>): SuenoDeAvisos | null {
  // Con lo que elegiste en «Necesito dormir», dentro de lo de tu edad; sin elegir, lo de tu edad.
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches, e.necesidad);
  if (s.deEjemplo) return null;
  const nec = s.necesidad;
  const deuda = deudaDeSueno(ultimasNoches(s.noches, e.hoy, 14), nec)?.minutos ?? null;
  return {
    habitual: (clave) => habitualDe(s.noches, clave),
    necesidad: nec,
    deuda,
    // Tu margen para dormirte: la hora de acostarte lo descuenta.
    latencia: margenParaDormirte(e.latencia),
    // Y, con un reloj o un anillo, lo que sueles estar despierto en la noche: para dormir lo que necesitas, hay que estar en la cama eso más.
    despierto: despiertoDeLaNoche(s.noches),
    // Tu periodo de melatonina, la misma cuenta de la tarjeta de Sueño: así el aviso y la tarjeta dicen las mismas
    // horas. Los días que vienen todavía no tienen noches: valen las de hoy.
    periodo: (dia) => periodoDeMelatonina(s.noches, dia < e.hoy ? dia : e.hoy, { margen: e.latencia, deuda }),
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

/** Los cuidados de salud marcados, con sus reglas de hoy (cuidados.ts); sin ninguno, o antes del cuestionario, null. */
function cuidadosDe(e: Pick<Estado, 'cuidados' | 'perfil' | 'pesos' | 'hoy'>): Reglas | null {
  const reglas = reglasDeCuidados(e);
  return reglas?.cuidados.length ? reglas : null;
}

/**
 * Lo de fábrica y, mientras no lo hayas elegido, lo que un cuidado prende: con reflujo, la última comida grande. Lo que
 * en tu día dice «No suelo» no avisa a su hora.
 */
function conLoDeFabrica(avisos: Avisos, noSuele: (c: Comida) => boolean, cuidados: Reglas | null): Avisos {
  const a = deFabrica(avisos, noSuele);
  return cuidados?.prender.includes('ultimaComida') && !a.ultimaComida ? { ...a, ultimaComida: { encendido: true } } : a;
}

/**
 * Los avisos como suenan: lo elegido y, en lo que no se tocó, lo de fábrica del día que sigue tu despertar (la deuda,
 * el horario, la melatonina, las revoluciones, las luces, la hora de dormir y el máximo de diez). Perfil muestra esto.
 */
export function avisosDe(e: Pick<Estado, 'avisos' | 'respuestas' | 'cuidados' | 'perfil' | 'pesos' | 'hoy'>): Avisos {
  return conLoDeFabrica(e.avisos, noSueleDe(e), cuidadosDe(e));
}

/** La cafeína de una toma, si se anotó al menos tres de los últimos 14 días: la mediana, en mg. */
export function cafeinaPorToma(e: Pick<Estado, 'registros' | 'hoy'>): number | null {
  const tomas = vigentes(e.registros.values()).filter((r) => !r.planificado && (r.valores.micros?.cafeina ?? 0) > 0 && diasEntre(r.dia, e.hoy) >= 0 && diasEntre(r.dia, e.hoy) < 14);
  if (new Set(tomas.map((r) => r.dia)).size < 3) return null;
  const mg = tomas.map((r) => r.valores.micros!.cafeina!).sort((a, b) => a - b);
  return mg[Math.floor(mg.length / 2)];
}

/** Tus horas de comer, una sola lista (horasDeComer, en recordatorios.ts): la que pusiste a mano, la de lo que anotas o la de tu día. */
export function horasDeComida(e: Pick<Estado, 'hoy' | 'registros' | 'respuestas' | 'horasDeComer'>): (c: Comida) => number {
  const hora = horasDeComerDe(e);
  return (c) => hora(c).minutos;
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

/** El título: lo de la noche, lo de la mañana y lo que conviene dicen ahí qué hacer; los demás, «Moss». */
const tituloDe = (n: Notificacion): string =>
  tituloDelAviso(n, { t: t as (clave: string, valores?: Record<string, string | number>) => string, habito: () => '', plan: () => '', duracion });

/** Si hay que avisar de lo que falta: lo que se eligió o, sin elegir, si hay otro aviso prendido (y por lo tanto permiso). */
export const conLoQueFalta = (ajustes: Avisos, alguno: boolean) => ajustes.falta?.encendido ?? alguno;

/** Los interruptores sueltos: lo que conviene y lo del día que sigue tu despertar. */
const SUELTOS = [...QUE_CONVIENE, 'deuda', 'melatonina', 'revoluciones', 'descarga', 'gafas'] as const;

/** Si hay algún aviso prendido: las comidas sin anotar, dormir, el horario, pesarse, un hábito o uno suelto. Perfil dice lo mismo. */
export const algunAviso = (e: Pick<Estado, 'avisos' | 'recordatorios'>) =>
  !!e.recordatorios?.length || !!e.avisos.dormir?.encendido || !!e.avisos.habitos?.length || !!e.avisos.horario?.length || !!e.avisos.pesarse?.encendido
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
  const cuidados = cuidadosDe(e);
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
    dieta: e.perfil?.comer?.dieta, alergias: e.perfil?.comer?.alergias, sinNumeros: !e.numeros,
    // Con cuidados marcados, cada cosa según lo que apagan, y el agua con su meta; con el «sin déficit» de antes, nada.
    ...(cuidados
      ? { apagado: QUE_FALTA.filter((q) => apagaLoQueFalta(q, cuidados)), metaDeAgua: metaDeAgua(cuidados, AGUA_META_ML), reflujo: cuidados.cuidados.includes('reflujo') }
      : { sinDeficit: !!e.perfil?.sinDeficit }),
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
 * anteriores (salvo el del fin de la prueba o del regalo).
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
    // «Lo que hay que hacer hoy», con todo tachado.
    const todoHecho = datos.tipo === 'pendientes' && dia === hoy && pendientesPara(e.pendientes, hoy).every((p) => p.hecho);
    if (deOtroDia || comidaHecha || pesoHecho || desayunoDicho || todoHecho) await Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {});
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
  // Lo que un cuidado de salud apaga (Cuidados) no suena, aunque esté prendido: de lo que conviene y pesarte.
  const cuidados = cuidadosDe(e);
  const apagados: Avisos = cuidados ? {
    ...Object.fromEntries(QUE_CONVIENE.filter((q) => apagaLoQueConviene(q, cuidados)).map((q) => [q, { encendido: false }])),
    ...(cuidados.apagar.includes('pesarse') ? { pesarse: { encendido: false } } : {}),
  } : {};
  const ajustes: Avisos = { ...conLoDeFabrica(e.avisos, noSueleDe(e), cuidados), ...apagados, comidas: e.recordatorios ?? [] };
  const finDePrueba = avisoDePrueba(suscripcionActual(), Date.now());
  // De regalo, unos días antes de que termine, y nada después (salvo que se suscriba antes).
  const finDelRegalo = accesoActual() === 'regalo' ? finDelRegaloActual() : null;
  const avisoDeRegalo = finDelRegalo ? avisoDelRegalo(finDelRegalo, Date.now()) : null;
  // Cancelada, nada después de que vence: sin acceso no suena, aunque Moss no se abra para borrarlo.
  const hasta = avisosHasta(suscripcionActual(), accesoActual(), hastaDelRegaloActual());
  const elegido = algunAviso({ avisos: ajustes, recordatorios: e.recordatorios });
  const conFalta = conLoQueFalta(ajustes, elegido);
  if ((!elegido && !conFalta && finDePrueba === null && avisoDeRegalo === null) || !(await Notifications.getPermissionsAsync()).granted) return;
  await prepararCategorias();
  const ahora = new Date();
  // Hoy y ahora, del mismo instante: justo al corte, el almacén todavía puede tener el día anterior.
  // Con el día que empieza a las 4 (D32), a la 1 hoy es ayer y ahora es la 1500 de ese día.
  const hoy = diaLogico(ahora, e.corte);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r);
  // Un entrenamiento de Salud de hoy (el reloj, un anillo, Strava, Fitness) es haber entrenado: cuándo terminó el último.
  const entrenoDeHoy = entrenosDelDia(e.salud?.entrenamientos, hoy).at(-1);
  if (entrenoDeHoy) eventosHoy.entrenamiento = minutosEnElDia(new Date(entrenoDeHoy.hasta), hoy);
  const minutos = minutosEnElDia(ahora, hoy);
  const sueno = suenoDelDia(e);
  // El control es el día que se eligió o, sin elegir, el de la primera meta (como en el almacén).
  const diaDelControl = e.perfil?.diaDelControl ?? (e.metas[0] ? diaDeLaSemana(e.metas[0].desde) : undefined);
  // Según el deporte: los partidos de cada semana (el de mañana también cuenta para el último día) y la próxima carrera.
  const deporte = delDeporte(e.entreno, sumarDias(hoy, -1), sumarDias(hoy, DIAS));
  // Lo que conviene y lo del día que sigue tu despertar, de cada día; hoy, con lo que ya anotaste e hiciste.
  const comun: Omit<DeLoQueConviene & DeSigueElDespertar, 'dia'> = {
    ajustes, sueno, horaDeComida, diaDelControl, deudaAntes: deudaDeAyer(e), sinNumeros: !e.numeros,
    viaje: e.entreno?.viaje, pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null, ...(e.perfil ? { edad: edadDe(e.perfil, hoy) } : {}),
    comidasHabituales: comidasHabituales(e.registros.values(), hoy), cafeinaPorToma: cafeinaPorToma(e),
    partidos: deporte.partidos, carrera: deporte.proximaCarrera,
    // Con cuidados marcados, lo que apagan ya está apagado arriba; con el «sin déficit» de antes, todo lo de comer.
    ...(cuidados ? { sinLoDeEntrenar: cuidados.apagar.includes('antesDeEntrenar'), reflujo: cuidados.cuidados.includes('reflujo') } : { sinDeficit: !!e.perfil?.sinDeficit }),
  };
  const entrenadoHoy = e.habitos.filter(esDeEntrenar).map((h) => e.marcas.get(claveDeMarca(h.id, hoy))).find((m) => m?.hecho);
  const deHoyParaConviene = {
    anotadas: new Set(deHoy.map((r) => r.comida)), eventos: eventosHoy, comido: totalDelDia(e.registros.values(), hoy, false),
    desayuno: e.desayunos[hoy] ?? null, entrenado: entrenadoHoy ? minutosEnElDia(new Date(entrenadoHoy.momento), hoy) : null,
  };
  const convieneDe = (dia: ClaveDia): Aviso[] => {
    const op = { ...comun, dia, sesiones: sesionesDelDia(e.entreno, dia), meta: metaDelDia(e, dia), pendientes: pendientesPara(e.pendientes, dia), ...(dia === hoy ? deHoyParaConviene : {}) };
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
  // Dos días antes del último día del regalo, como dice la bienvenida («Moss te avisa unos días antes»).
  if (finDelRegalo && avisoDeRegalo !== null && !vieja()) {
    await Notifications.scheduleNotificationAsync({
      content: { title: t('recordatorios.regaloTermina.titulo'), body: t('recordatorios.regaloTermina.texto', { fecha: fechaLarga(finDelRegalo) }), data: { tipo: 'prueba' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(avisoDeRegalo) },
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
