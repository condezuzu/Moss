// Los avisos, en el iPhone (src/dominio/avisos.ts dice cuáles y cuándo): la hora de dormir, los de
// cada hábito, el horario de comidas, las comidas sin anotar, pesarse, lo que conviene hacer y el día que sigue
// tu despertar (sigueElDespertar.ts: lo de la mañana espera a que te despiertes, y la noche sale de tu periodo de
// melatonina, el mismo de Sueño). Se programan los de la semana cada vez que se abre Moss y
// cada vez que cambia algo que los mueve (lo anotado, lo hecho, los hábitos, las noches o los
// avisos), así lo ya hecho no avisa. Son avisos locales: no pasan por ningún servidor.
// Mientras Salud no se puede leer (de fondo con el iPhone bloqueado, o si falla), las noches de un reloj o un anillo son
// las que quedaron guardadas en el teléfono la última vez que se leyó (D45, 27/11/2026): la semana se rearma entera,
// igual que con Salud (spec/avisos.md).

import * as Notifications from 'expo-notifications';
import { useEffect, useEffectEvent } from 'react';
import { Platform } from 'react-native';

import { horasDeComerDe, noSueleDe, reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { comidasHabituales, sesionesDelDia } from '@/dominio/alrededorDelEntreno';
import {
  avisosDeLaSemana, cuandoSuena, deLasNoches, esDeEntrenar, horasDeSueno, horaDeReloj, textoDelAviso, tituloDelAviso, yLasDeDespues, type Aviso, type Avisos, type Evento, type Notificacion,
  type Sueno as SuenoDeAvisos,
} from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { apagaLoQueConviene, apagaLoQueFalta, metaDeAgua, type Reglas } from '@/dominio/cuidados';
import { claveDeMarca } from '@/dominio/dias';
import { diaDeLaSemana, diaLogico, diasEntre, minutosEnElDia, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import { delDeporte, loQueConviene, QUE_CONVIENE, type DeLoQueConviene } from '@/dominio/loQueConviene';
import { periodoDeMelatonina } from '@/dominio/melatonina';
import { edadDe } from '@/dominio/metas';
import { pendientesPara } from '@/dominio/pendientes';
import { avisosDelDespertar, comidasSinAnotar, deFabrica, RESPUESTAS_DEL_DESAYUNO, type DeSigueElDespertar, type RespuestaDelDesayuno } from '@/dominio/sigueElDespertar';
import { DIAS } from '@/dominio/recordatorios';
import { aguaDelDia, recientes, totalDelDia, vigentes } from '@/dominio/registros';
import { AGUA_META_ML, bajoAlFinal, horaDeLaTarde, loQueFaltaHoy, QUE_FALTA, type FaltaConHora } from '@/dominio/loQueFalta';
import { habitualDe, margenParaDormirte } from '@/dominio/sinReloj';
import { avisoDelRegalo, avisoDePrueba, avisosHasta } from '@/dominio/premium';
import { despiertoDeLaNoche, deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { accesoActual, finDelRegaloActual, hastaDelRegaloActual, hayPremium, seSabeElAcceso, suscripcionActual } from '@/lib/premium';
import { entrenosDelDia, saludGuardada } from '@/salud/convertir';
import { duracion, fechaLarga, metaDelDia } from '@/secciones/comida/datos';
import { suenoDe } from '@/secciones/persona';
import { alarmaPuesta } from '@/secciones/sueno/despertador';
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
  // La entrada: hasta terminarla, y después de cerrar sesión o borrar todo, no suena nada.
  'entradaHecha',
  // Las noches de Salud guardadas: con ellas se arma todo mientras Salud no se puede leer (D45).
  'nochesDeSalud',
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
    // La que nombra el aviso de acostarte: la de hoy, con la noche de hoy. La de los días que vienen todavía no se sabe.
    deudaDe: (dia) => (dia === e.hoy && s.noches.some((n) => n.clave === e.hoy) ? deuda : null),
  };
}

const despertarDe = (e: Pick<Estado, 'despertares'>): Pick<SuenoDeAvisos, 'despertarReal' | 'despertarSabido'> => ({
  despertarReal: (dia) => e.despertares[dia]?.despertar ?? null, despertarSabido: (dia) => e.despertares[dia]?.sabido ?? null,
});

/**
 * Lo del sueño con el día que sigue tu despertar: el despertar real de cada día y cuándo se supo (los que guardó
 * buscarDespertar, en src/salud/despertar.ts), o null mientras no se sabe. Así lo de la mañana espera y la noche se
 * arma con esa hora.
 */
export function suenoDelDia(e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'latencia' | 'necesidad' | 'despertares'>): SuenoDeAvisos | null {
  const s = suenoParaAvisos(e);
  return s && { ...s, ...despertarDe(e) };
}

/**
 * Sin noches de verdad, solo el despertar de cada día: lo de la mañana espera igual a que te despiertes, también para
 * quien recién empieza (si no, pesarte sonaba a las 7:45 aunque te despertaras a las 10). Sin lo de siempre no hay
 * noche: ni acostarte, ni melatonina, ni deuda.
 */
const soloElDespertar = (e: Pick<Estado, 'hoy' | 'perfil' | 'salud' | 'noches' | 'necesidad' | 'despertares'>): SuenoDeAvisos => ({
  habitual: () => null, necesidad: suenoDe(e.hoy, e.perfil, e.salud, e.noches, e.necesidad).necesidad, deuda: null, ...despertarDe(e),
});

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
 * Los avisos como suenan: lo elegido y, en lo que no se tocó, lo de fábrica (deFabrica: la deuda, la melatonina y el
 * máximo de diez; las comidas sin anotar van aparte, comidasQueAvisan). Perfil muestra esto.
 */
export function avisosDe(e: Pick<Estado, 'avisos' | 'respuestas' | 'cuidados' | 'perfil' | 'pesos' | 'hoy'>): Avisos {
  return conLoDeFabrica(e.avisos, noSueleDe(e), cuidadosDe(e));
}

/** Las comidas que avisan si no las anotaste: las elegidas o, sin elegir, las de fábrica (comidasSinAnotar). */
export const comidasQueAvisan = (e: Pick<Estado, 'recordatorios' | 'respuestas'>) => comidasSinAnotar(e.recordatorios, noSueleDe(e));

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

/**
 * Si hay que avisar de lo que falta: lo que se eligió y, sin elegir, no. Es de «Más avisos», apagados de fábrica; antes
 * se prendía con cualquier otro aviso, y con lo de fábrica (25/11/2026) siempre hay alguno.
 */
export const conLoQueFalta = (ajustes: Avisos) => ajustes.falta?.encendido ?? false;

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
 * también abre Moss, y no abre nada adentro: con Moss cerrada, un botón que no la abre no le llega a Moss
 * (expo-notifications) y la respuesta se perdía. Si igual no llega, anotar el almuerzo primero dice lo mismo.
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
      { identifier: accionDelDesayuno(r), buttonTitle: t(`recordatorios.despertar.desayuno.${r}`), options: { opensAppToForeground: true } }
    ))),
  ]).catch(() => {}));

// Una programación a la vez: si mientras una programa llega otra, la primera se corta y la segunda
// empieza de cero. Dos a la vez se borraban lo programado y duplicaban el resto.
let enCurso: Promise<void> = Promise.resolve();
let vuelta = 0;

/** iOS guarda 64 avisos pendientes por app; 60 deja margen. */
const TOPE_DE_PENDIENTES = 60;

/** Borra los avisos que había y programa los de la semana, si hay alguno encendido y permiso. */
export function programarAvisos(e: Para): Promise<void> {
  const esta = ++vuelta;
  enCurso = enCurso.then(() => programar(e, () => esta !== vuelta)).catch((error) => console.warn('Moss no pudo programar los avisos', error));
  return enCurso;
}

/**
 * Los avisos que ya llegaron y ya no dicen nada salen del centro de notificaciones y de la pantalla
 * bloqueada: lo de una comida con esa o una de después anotada («Hora de la merienda» con la cena anotada,
 * comer antes de entrenar, la última comida grande), lo que ya no falta, «pesarse» con el peso de hoy, y los
 * de días anteriores (salvo el del fin de la prueba o del regalo). Devuelve los que habían llegado.
 */
async function sacarLosQueYaNoDicenNada(e: Para): Promise<Notifications.Notification[]> {
  const llegados = await Notifications.getPresentedNotificationsAsync().catch(() => [] as Notifications.Notification[]);
  if (!llegados.length) return llegados;
  const hoy = diaLogico(new Date(), e.corte);
  const anotadas = new Set(vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).map((r) => r.comida));
  const pesadoHoy = e.pesos.some((p) => p.fecha === hoy);
  // Lo que sigue bajo hoy, con lo planificado, como cuando se avisó.
  const meta = metaDelDia(e, hoy);
  const bajo: string[] = meta ? bajoAlFinal(meta, totalDelDia(e.registros.values(), hoy)) : [];
  const aguaDesde = (llego: number) => vigentes(e.agua.values()).some((x) => x.dia === hoy && Date.parse(x.actualizado) >= llego);
  for (const n of llegados) {
    const datos = n.request.content.data as Partial<AlTocarUnAviso> | undefined;
    if (!datos?.tipo) continue;
    // La hora en que llegó viene en segundos en iOS (timeIntervalSince1970) y en milisegundos en Android: leída
    // como milisegundos, caía en 1970 y el aviso de hoy salía por «de otro día». Los de antes no llevan su día.
    const llego = n.date < 1e11 ? n.date * 1000 : n.date;
    const dia = datos.dia ?? diaLogico(new Date(llego), e.corte);
    const deOtroDia = dia < hoy && datos.tipo !== 'prueba';
    const comidaHecha = !!datos.comida && dia === hoy && yLasDeDespues(datos.comida).some((c) => anotadas.has(c));
    const pesoHecho = datos.tipo === 'pesarse' && pesadoHoy;
    // «¿Desayunas hoy?» ya contestado, o con otra comida anotada: ya no pregunta nada.
    const desayunoDicho = datos.tipo === 'desayuno' && dia === hoy && (!!e.desayunos[hoy] || anotadas.size > 0);
    // «Lo que hay que hacer hoy», con todo tachado.
    const todoHecho = datos.tipo === 'pendientes' && dia === hoy && pendientesPara(e.pendientes, hoy).every((p) => p.hecho);
    // El agua dice «toma uno ahora»: con un vaso anotado desde que llegó, ya está.
    const yaNoFalta = datos.tipo === 'falta' && dia === hoy && (datos.que === 'agua' ? aguaDesde(llego) : !bajo.includes(datos.que ?? ''));
    if (deOtroDia || comidaHecha || pesoHecho || desayunoDicho || todoHecho || yaNoFalta) await Notifications.dismissNotificationAsync(n.request.identifier).catch(() => {});
  }
  return llegados;
}

/** Lo que lleva cada aviso programado: lo que abre al tocarlo y, en la deuda que todavía no sabe la noche, eso. */
type DatosDelAviso = Pick<AlTocarUnAviso, 'tipo' | 'comida' | 'dia' | 'que'> & {
  /** La deuda que suena sin saber cómo fue la noche (dice la de ayer): si Moss la sabe antes, va la de siempre en su lugar. */
  sinLaNoche?: true;
};

/**
 * Un aviso programado que todavía no sonó, como lo dice iOS: su identificador y, si es uno de la semana (`AAAA-MM-DD:<id>`,
 * con ese día en lo que lleva), cuál es, de qué tipo y a qué hora, en minutos de la cuenta de su día.
 */
type Programado = { identificador: string; dia?: ClaveDia; id?: string; tipo?: Aviso['tipo']; minutos?: number; sinLaNoche?: boolean };

/** La hora de un disparador de calendario de iOS, en minutos de la cuenta de `dia`: pasada la medianoche, más de 1440. */
function minutosDelDisparador(disparador: unknown, dia: ClaveDia): number | undefined {
  const f = (disparador as { dateComponents?: Partial<Record<'year' | 'month' | 'day' | 'hour' | 'minute', number>> } | null)?.dateComponents;
  if (!f || ![f.year, f.month, f.day, f.hour, f.minute].every(Number.isFinite)) return undefined;
  const fecha = `${f.year}-${String(f.month).padStart(2, '0')}-${String(f.day).padStart(2, '0')}`;
  return diasEntre(dia, fecha) * 24 * 60 + f.hour! * 60 + f.minute!;
}

/** Lo programado que todavía no sonó. Si iOS no deja leerlo, null. */
async function loProgramado(): Promise<Programado[] | null> {
  try {
    return (await Notifications.getAllScheduledNotificationsAsync()).map((p) => {
      const datos = p.content.data as Partial<DatosDelAviso> | null;
      const [, dia, id] = /^(\d{4}-\d{2}-\d{2}):(.+)$/.exec(p.identifier) ?? [];
      if (!dia || !id || datos?.dia !== dia || typeof datos.tipo !== 'string') return { identificador: p.identifier };
      return { identificador: p.identifier, dia, id, tipo: datos.tipo as Aviso['tipo'], minutos: minutosDelDisparador(p.trigger, dia), sinLaNoche: datos.sinLaNoche === true };
    });
  } catch {
    return null;
  }
}

type DeLasNoches = 'dormir' | 'deuda' | 'melatonina' | 'revoluciones' | 'gafas' | 'descarga' | 'luces' | 'cafe' | 'ultimaComida' | 'entrenarTarde';

/**
 * Lo de las noches que dejó programado la versión de antes sigue mientras siga prendido: lo que apagaste no vuelve, ni el
 * de un hábito que ya no existe o ya no avisa antes de dormirte. Lo hecho lo saca avisosDelDia, como siempre.
 */
function sigueValiendo(a: Pick<Aviso, 'id' | 'tipo' | 'habito'>, ajustes: Avisos, habitos: Para['habitos']): boolean {
  if (!deLasNoches(a, ajustes)) return false;
  if (a.tipo === 'habito') return habitos.some((h) => h.id === a.habito);
  return !!ajustes[a.tipo as DeLasNoches]?.encendido;
}

/**
 * Lo de Salud con que se arman los avisos: lo leído o, mientras Salud no se puede leer (de fondo con el iPhone bloqueado,
 * o si falló), las noches que quedaron guardadas en el teléfono (D45). Entran por el mismo camino y la semana se rearma
 * entera, igual que con Salud. De Salud se guardan solo las noches: de fondo, haber entrenado se sabe por el hábito.
 */
const conLasGuardadas = (e: Para): Para => (e.salud || !e.nochesDeSalud ? e : { ...e, salud: saludGuardada(e.nochesDeSalud, e.hoy) });

/**
 * El despertador de Moss por día de la semana, en minutos desde la medianoche: el que se repite, sus días; el de una sola
 * vez, el día en que va a sonar. Sin despertador (o sin iOS 26), ninguno.
 */
async function despertadorPorDia(ahora: Date): Promise<Partial<Record<DiaSemana, number>>> {
  const alarma = await alarmaPuesta().catch(() => null);
  if (!alarma) return {};
  const minutos = alarma.hora * 60 + alarma.minuto;
  const unaVez = ((ahora.getDay() + (ahora.getHours() * 60 + ahora.getMinutes() < minutos ? 0 : 1)) % 7) as DiaSemana;
  return Object.fromEntries((alarma.dias.length ? alarma.dias : [unaVez]).map((d) => [d, minutos]));
}

async function programar(estado: Para, vieja: () => boolean): Promise<void> {
  if (!hayAvisos || vieja()) return;
  // Sin la entrada hecha no suena nada: tampoco después de cerrar sesión o borrar tus datos o la cuenta (olvidarTodo),
  // que dejaban hasta una semana de avisos de la cuenta de antes. Lo que ya había llegado (los hábitos, con sus nombres)
  // también sale del centro de notificaciones. Aunque Apple todavía no haya dicho si hay acceso.
  if (!estado.entradaHecha) {
    await Notifications.dismissAllNotificationsAsync().catch(() => {});
    return Notifications.cancelAllScheduledNotificationsAsync();
  }
  const e = conLasGuardadas(estado);
  const llegados = await sacarLosQueYaNoDicenNada(e);
  if (vieja()) return;
  // Mientras Apple y la cuenta no contestan no se sabe si hay acceso: lo programado queda como estaba, y
  // se rehace cuando contestan (el almacén oye alCambiarPremium). Borrarlo dejaba la semana sin avisos.
  if (!seSabeElAcceso()) return;
  // Sin acceso (venció o canceló) no suena nada: lo elegido queda, y vuelve al suscribirse.
  if (!hayPremium()) return Notifications.cancelAllScheduledNotificationsAsync();
  const horaDeComida = horasDeComida(e);
  // Lo que un cuidado de salud apaga (Cuidados) no suena, aunque esté prendido: de lo que conviene y pesarte.
  const cuidados = cuidadosDe(e);
  const apagados: Avisos = cuidados ? {
    ...Object.fromEntries(QUE_CONVIENE.filter((q) => apagaLoQueConviene(q, cuidados)).map((q) => [q, { encendido: false }])),
    ...(cuidados.apagar.includes('pesarse') ? { pesarse: { encendido: false } } : {}),
  } : {};
  const ajustes: Avisos = { ...conLoDeFabrica(e.avisos, noSueleDe(e), cuidados), ...apagados, comidas: comidasQueAvisan(e) };
  const finDePrueba = avisoDePrueba(suscripcionActual(), Date.now());
  // De regalo, unos días antes de que termine, y nada después (salvo que se suscriba antes).
  const finDelRegalo = accesoActual() === 'regalo' ? finDelRegaloActual() : null;
  const avisoDeRegalo = finDelRegalo ? avisoDelRegalo(finDelRegalo, Date.now()) : null;
  // Cancelada, nada después de que vence: sin acceso no suena, aunque Moss no se abra para borrarlo.
  const hasta = avisosHasta(suscripcionActual(), accesoActual(), hastaDelRegaloActual());
  const elegido = algunAviso({ avisos: ajustes, recordatorios: ajustes.comidas ?? null });
  const conFalta = conLoQueFalta(ajustes);
  if ((!elegido && !conFalta && finDePrueba === null && avisoDeRegalo === null) || !(await Notifications.getPermissionsAsync()).granted) return Notifications.cancelAllScheduledNotificationsAsync();
  await prepararCategorias();
  const ahora = new Date();
  // Hoy y ahora, del mismo instante: justo al corte, el almacén todavía puede tener el día anterior.
  // Con el día que empieza a las 4 (D32), a la 1 hoy es ayer y ahora es la 1500 de ese día.
  const hoy = diaLogico(ahora, e.corte);
  // Cuándo se anotó cada comida hoy (la primera vez): los avisos de «después de comer» esperan eso.
  const deHoy = vigentes(e.registros.values()).filter((r) => r.dia === hoy && !r.planificado).sort((a, b) => (a.momento < b.momento ? -1 : 1));
  const eventosHoy: Partial<Record<Evento, number>> = {};
  for (const r of deHoy) if (r.comida !== 'snack' && eventosHoy[r.comida] === undefined) eventosHoy[r.comida] = minutosDe(r);
  // Y cuándo se anotó: cuando se guardó, no la hora que dice que se comió (puede ser de antes). Si después se cambió, es
  // más tarde, y a lo sumo su aviso cuenta como que ya sonó: así nunca se pierde uno.
  const cuandoSeAnotoHoy: Partial<Record<Comida, number>> = {};
  for (const r of deHoy) cuandoSeAnotoHoy[r.comida] = Math.min(cuandoSeAnotoHoy[r.comida] ?? Infinity, minutosEnElDia(new Date(r.actualizado), hoy));
  // Un entrenamiento de Salud de hoy (el reloj, un anillo, Strava, Fitness) es haber entrenado: cuándo terminó el último.
  const entrenoDeHoy = entrenosDelDia(e.salud?.entrenamientos, hoy).at(-1);
  if (entrenoDeHoy) eventosHoy.entrenamiento = minutosEnElDia(new Date(entrenoDeHoy.hasta), hoy);
  const minutos = minutosEnElDia(ahora, hoy);
  const programado = await loProgramado();
  // La primera vez con esta versión (la OTA del 27/11/2026) todavía no hay noches guardadas: se guardan recién cuando
  // Salud se lee. Mientras, si no se puede leer, lo de las noches que ya estaba programado queda como está (se reconoce por
  // su identificador y lo que lleva, que la versión de antes no traía entero), salvo lo que se apagó, y lo demás se rehace.
  // Sin esto, la primera corrida de fondo con la versión nueva lo borraba.
  const sinNoches = e.salud === null && e.nochesDeSalud === null;
  const guardados = !sinNoches ? [] : (programado ?? []).flatMap((p) => {
    if (!p.dia || !p.id || !p.tipo || p.minutos === undefined) return [];
    const aviso: Aviso = { id: p.id, tipo: p.tipo, minutos: p.minutos, ...(p.tipo === 'habito' ? { habito: p.id.split(':')[1] } : {}) };
    return sigueValiendo(aviso, ajustes, e.habitos) ? [{ dia: p.dia, aviso, identificador: p.identificador }] : [];
  });
  const sueno: SuenoDeAvisos = sinNoches ? { ...soloElDespertar(e), sinLeer: true } : (suenoDelDia(e) ?? soloElDespertar(e));
  const { deEjemplo, noches } = suenoDe(e.hoy, e.perfil, e.salud, e.noches, e.necesidad);
  const hayNoche = (dia: ClaveDia) => !deEjemplo && noches.some((n) => n.clave === dia);
  // El control es el día que se eligió o, sin elegir, el de la primera meta (como en el almacén).
  const diaDelControl = e.perfil?.diaDelControl ?? (e.metas[0] ? diaDeLaSemana(e.metas[0].desde) : undefined);
  // Según el deporte: los partidos de cada semana (el de mañana también cuenta para el último día) y la próxima carrera.
  const deporte = delDeporte(e.entreno, sumarDias(hoy, -1), sumarDias(hoy, DIAS));
  // Lo que conviene y lo del día que sigue tu despertar, de cada día; hoy, con lo que ya anotaste e hiciste.
  const comun: Omit<DeLoQueConviene & DeSigueElDespertar, 'dia'> = {
    ajustes, sueno, horaDeComida, diaDelControl, sinNumeros: !e.numeros,
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
  // La deuda del día anterior a cada día, para decir «ayer era de…»: hoy, la de ayer; mañana, la de hoy. Solo con la
  // noche de ese día: sin ella (el anillo todavía no sincronizó) diría un número que no es. De pasado mañana, no se sabe.
  const deudaDeAntes: Partial<Record<ClaveDia, number | null>> = {
    [hoy]: hayNoche(sumarDias(hoy, -1)) ? deudaDeAyer(e) : null, [sumarDias(hoy, 1)]: hayNoche(hoy) ? sueno.deuda : null,
  };
  // La deuda de hoy que quedó programada y no sonó: a qué hora quedó de verdad, y si todavía no sabía la noche. Si no está,
  // ya sonó cuando llegó hoy o cuando está programada la de otro día (con ella se programó la de hoy): no se arma otra. Si
  // no, no se programó nunca (recién prendida, o la primera vez con esta versión) y va como siempre (sigueElDespertar.ts).
  const deudaDeHoy = programado?.find((p) => p.dia === hoy && p.id === 'deuda' && p.minutos !== undefined);
  const yaSono = llegados.some((n) => n.request.identifier === `${hoy}:deuda`) || !!programado?.some((p) => p.id === 'deuda' && !!p.dia && p.dia > hoy);
  const deudaPendiente = deudaDeHoy ? { minutos: deudaDeHoy.minutos!, sinLaNoche: !!deudaDeHoy.sinLaNoche } : yaSono ? null : undefined;
  const despertador = await despertadorPorDia(ahora);
  const convieneDe = (dia: ClaveDia): Aviso[] => {
    const op = {
      ...comun, dia, deudaAntes: deudaDeAntes[dia] ?? null, conLaNoche: hayNoche(dia), despertador,
      sesiones: sesionesDelDia(e.entreno, dia), meta: metaDelDia(e, dia), pendientes: pendientesPara(e.pendientes, dia),
      ...(dia === hoy ? { ...deHoyParaConviene, ahora: minutos, deudaPendiente } : {}),
    };
    // Sin noches guardadas todavía, lo de ellas es lo que ya estaba programado: guarda su lugar con lo demás del día.
    return [...loQueConviene(op), ...avisosDelDespertar(op), ...guardados.filter((x) => x.dia === dia).map((x) => x.aviso)];
  };
  const lista = avisosDeLaSemana({
    hoy, ahora: minutos, ajustes, habitos: e.habitos, sueno, horaDeComida, corte: e.corte,
    sesionesDe: (dia) => sesionesDelDia(e.entreno, dia), convieneDe,
    faltasHoy: conFalta ? faltasDeHoy(e, hoy, minutos, horaDeComida, sueno) : [],
    marcas: e.marcas, anotadasHoy: new Set(deHoy.map((r) => r.comida)), cuandoSeAnotoHoy, eventosHoy,
    diaDelControl,
    pesadoHoy: e.pesos.some((p) => p.fecha === hoy),
  });
  // iOS guarda 64 pendientes y descarta en silencio lo que sobra: primero el del fin de la prueba o del regalo, que
  // suena una sola vez, y después los de la semana por fecha, hasta TOPE_DE_PENDIENTES. Lo que queda afuera es lo
  // último de la semana, que se vuelve a programar al abrir Moss.
  const pedidos: Notifications.NotificationRequestInput[] = [];
  // Dos días antes de que termine la prueba, como dice la pantalla de pago.
  if (finDePrueba !== null) {
    pedidos.push({
      identifier: 'prueba',
      content: { title: 'Moss', body: t('recordatorios.pruebaTermina'), data: { tipo: 'prueba' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(finDePrueba) },
    });
  }
  // Dos días antes del último día del regalo, como dice la bienvenida («Moss te avisa unos días antes»).
  if (finDelRegalo && avisoDeRegalo !== null) {
    pedidos.push({
      identifier: 'regalo',
      content: { title: t('recordatorios.regaloTermina.titulo'), body: t('recordatorios.regaloTermina.texto', { fecha: fechaLarga(finDelRegalo) }), data: { tipo: 'prueba' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(avisoDeRegalo) },
    });
  }
  const deLaSemana: { en: number; pedido: Notifications.NotificationRequestInput }[] = [];
  for (const n of lista) {
    const c = cuandoSuena(n.dia, n.minutos);
    const [a, m, d] = c.dia.split('-').map(Number);
    const fecha = new Date(a, m - 1, d, c.hora, c.minuto);
    // iOS rechaza una fecha que ya pasó, y cortaría los que siguen.
    if (fecha.getTime() <= Date.now() || (hasta !== null && fecha.getTime() >= hasta)) continue;
    const { aviso } = n;
    deLaSemana.push({
      en: fecha.getTime(),
      pedido: {
        // Fijo, con su día y cuál es: así se puede sacar uno sin abrir Moss (un widget, en la próxima build).
        identifier: `${n.dia}:${aviso.id}`,
        // Lo que lleva el aviso para abrir lo suyo al tocarlo (useAlTocarUnAviso).
        // Cada uno va con su día: la comida tocada pasada la medianoche o a la mañana se anota en el día del aviso, y
        // sacarLosQueYaNoDicenNada sabe de qué día es sin leer la hora que da el teléfono.
        content: {
          title: tituloDe(n), body: textoDe(n, e),
          data: {
            tipo: aviso.tipo, dia: n.dia, ...(aviso.comida ? { comida: aviso.comida } : {}), ...(aviso.falta ? { que: aviso.falta.que } : {}),
            ...(aviso.despertar?.que === 'deuda' && aviso.despertar.ahora === null ? { sinLaNoche: true as const } : {}),
          } satisfies DatosDelAviso,
          ...(aviso.tipo === 'dormir' ? { categoryIdentifier: CATEGORIA_DORMIR } : aviso.tipo === 'desayuno' ? { categoryIdentifier: CATEGORIA_DESAYUNO } : {}),
        },
        // A la hora del reloj y no «dentro de tantos segundos» (eso hace DATE en iOS): quien viaja a otra
        // zona horaria, o pasa el cambio de hora sin abrir Moss, lo recibe a la hora que dice.
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, year: a, month: m, day: d, hour: c.hora, minute: c.minuto, second: 0, repeats: false },
      },
    });
  }
  deLaSemana.sort((x, y) => x.en - y.en);
  const van = [...pedidos, ...deLaSemana.map((x) => x.pedido)].slice(0, TOPE_DE_PENDIENTES);
  // Lo de antes se cambia recién ahora, con todo lo nuevo armado (si algo falla al armarlo, queda como estaba), y una vez
  // empezado no se corta (27/11/2026): primero sale lo que ya no va y después cada uno se reemplaza en su lugar, con su
  // mismo identificador. Si iOS suspende a Moss en el medio, queda la semana de antes con parte de la nueva, nunca media
  // semana, y la próxima vez se termina. Antes se borraba todo primero, y cortarse ahí dejaba solo lo ya programado.
  if (vieja()) return;
  const quedan = new Set(van.map((p) => p.identifier));
  const comoEstan = new Set(guardados.map((g) => g.identificador));
  if (programado) {
    for (const p of programado) if (!quedan.has(p.identificador)) await Notifications.cancelScheduledNotificationAsync(p.identificador).catch(() => {});
  } else await Notifications.cancelAllScheduledNotificationsAsync();
  for (const pedido of van) {
    if (pedido.identifier && comoEstan.has(pedido.identifier)) continue;
    try {
      await Notifications.scheduleNotificationAsync(pedido);
    } catch {
      // Uno que no se pudo programar no deja sin los demás.
    }
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
