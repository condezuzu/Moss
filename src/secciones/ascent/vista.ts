// Lo que muestra la sección de Ascent vinculada (spec/ascent.md, «Ascent en Progreso»), como la galería
// (galeria/src/ascent.js, calcularHoy y calcularDia), con lo que llega de Ascent y lo de Moss. Las cuentas son las
// del dominio (recuperado.ts, diagnostico.ts, fatiga.ts, estancados.ts, musculos.ts, rendimiento.ts y conAscent.ts);
// acá solo se juntan los datos.
// Con la rutina de Ascent (moss.ascent_rutina), la sesión de hoy es la de la rutina, con el peso de la última vez;
// «Tu fuerza» sigue los multiarticulares de la rutina y está «Tu semana en Ascent». Sin la rutina (la base sin
// 0013_ascent_rutina.sql, o sin rutina activa) no se inventa: la sesión de hoy sale de tu horario de Perfil ›
// Entrenamiento con la última de ese día de la semana, «Tu fuerza» mira los ejercicios de las últimas cuatro semanas
// y «Tu semana en Ascent» no está. El umbral de estancamiento es el de sus Ajustes o, sin ellos, el de fábrica.

import type { Estado } from '@/almacen/almacen';
import { metaVigente } from '@/almacen/almacen';
import type { DeAscent } from '@/almacen/ascent';
import type { Contexto } from '@/dominio/alrededorDelEntreno';
import {
  bloquesDeLaRutina, diasDeEntrenar, diasDeLaRutina, entrenadoSegunAscent, grupoDe, grupoDelAnio, gruposDelDia, gruposDeLaSesion, metaDelDiaConAscent,
  sesionesConBloques, tuAnio,
  type GrupoDelAnio, type MarcaDeAscent, type MetaConAscent, type RutinaDeAscent, type TuAnio,
} from '@/dominio/conAscent';
import { ultimoDiaDeControl } from '@/dominio/control';
import { diagnostico, focoDeHoy, ordenarMarcas, buenDiaParaLaMarca, type Diagnostico, type Foco } from '@/dominio/diagnostico';
import { calidadParaRecuperar } from '@/dominio/entrenamiento';
import {
  estaEstancado, puntosDelEjercicio, razonesDeEstancamiento, semanaDeEntreno, semanasParaLasRazones, UMBRAL_DE_ASCENT,
  type RazonesDeEstancamiento, type SemanaDeEntreno,
} from '@/dominio/estancados';
import { fatigaMuscular, fatigaPorDia, musculosParaLaFatiga, todosLosMusculos, type FatigaDelDia, type MusculoAhora } from '@/dominio/fatiga';
import { diaDeLaSemana, diasEntre, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  CATALOGO, claveDelEjercicio, dosisDeLaSesion, esfuerzoDeSerie, grupoDelEjercicio, mejorE1rm, musculosDe, musculosTrabajados, peorEstado, residual, unRmDeAscent, estadoDe,
  type Bloque, type Musculo, type SesionConBloques, type UnoRMDe,
} from '@/dominio/musculos';
import { titularDeHoy, type Titular } from '@/dominio/recuperado';
import {
  cercaDeLaMarca, condicionesDeLaMarca, estadoDeLaNoche, frecuenciaDeMarcas, nochesCortasSeguidas, tendenciaDeFuerza,
  type CercaDeLaMarca, type CondicionesDeLaMarca, type EstadoDeLaNoche, type Noche as NocheDelRendimiento, type TendenciaDeFuerza,
} from '@/dominio/rendimiento';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { habitualDe } from '@/dominio/sinReloj';
import { calidadDeNoche, deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import { contextoDeHoy } from '../comida/entreno';
import { metaDelDia } from '../comida/datos';
import type { Persona, Sueno } from '../persona';
import { nombreDeSesion } from './nombres';

const DIA = 86_400_000;
/** Sin la hora de Ascent ni la de Perfil, se supone que entrenas a las 18 (como el resto de la app). */
const HORA_DE_FABRICA = 18 * 60;
/** Antes de entrenar, lo de hoy se mira 10 minutos antes de la sesión. */
const ANTES_DE_LA_SESION = 10;
/** La sesión de hoy, si se espera: la última de este día de la semana, de hace 4 semanas como mucho. */
const DIAS_DE_LA_REFERENCIA = 28;
/** Los años con pesas de cada respuesta del cuestionario, para el contexto de las razones. */
const ANIOS = { principiante: 0, intermedio: 2, avanzado: 4 } as const;

export type Entradas = { e: Estado; d: DeAscent; sueno: Sueno; persona: Persona; ahora: Date };

export type SesionDelDia = { como: 'prevista' | 'hecha'; nombre: string; inicio: number; minutos: number; bloques: Bloque[] | null };
export type NocheDeHoy = NocheDelRendimiento & { estado: EstadoDeLaNoche; seguidas: boolean; calidad: number | null; siesta: boolean };
export type SesionConFecha = SesionConBloques & { fecha: ClaveDia };

/** Lo de hoy: la sesión, la noche, los músculos de hoy y el titular. Es lo que también se ve afuera (titularDeHoy.ts). */
export type Hoy = {
  hoy: ClaveDia;
  sesion: SesionDelDia | null;
  sabeCuandoEntrena: boolean;
  noche: NocheDeHoy | null;
  ultimas3: number[];
  deuda: number | null;
  comoTeSientes: number | null;
  titular: Titular;
  /** La fatiga de lo de hoy al momento que se mira; ya hecha, cómo quedó después. */
  f: ReturnType<typeof fatigaMuscular>;
  despues: ReturnType<typeof fatigaMuscular> | null;
  musculosHoy: Musculo[];
  ultima: SesionConFecha | null;
  trabajados: { musculo: Musculo; series: number }[];
  conEllos: { fecha: ClaveDia; series: number } | null;
  // Para lo demás.
  sesiones: SesionConFecha[];
  en: number;
  ahora: number;
  minuto: (t: number) => number;
  entrenado: boolean;
  unoRMEn: (en: number) => UnoRMDe;
  /** La rutina de Ascent, si llegó y tiene algún día de entrenar. */
  rutina: RutinaDeAscent | null;
};

/** Un instante de un día de Moss a unos minutos de su medianoche. */
const instante = (dia: ClaveDia, minutos: number) => {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d, 0, minutos).getTime();
};

export function calcularHoy({ e, d, sueno, ahora }: Entradas): Hoy {
  const hoy = e.hoy;
  const hora = e.entreno?.hora ?? HORA_DE_FABRICA;
  const sesiones = sesionesConBloques(d.sesiones, (s) => (s.inicio ? Date.parse(s.inicio) : instante(s.fecha, hora)));
  const ahoraMs = ahora.getTime();
  const minuto = (t: number) => minutosEnElDia(new Date(t), hoy);
  const entrenado = entrenadoSegunAscent(d.sesiones, d.marcas, hoy);

  // La sesión de hoy: anotada en Ascent, hecha; si no, la que se espera según la rutina de Ascent (sus ejercicios,
  // con el peso de la última vez) o, sin rutina, según tu horario (o lo que sueles entrenar), con los ejercicios de la
  // última de este día de la semana. La hora no está en la rutina: sale de Perfil o de esa última.
  const rutina = d.rutina && diasDeLaRutina(d.rutina).length ? d.rutina : null;
  const deLaRutina = rutina?.dias.find((x) => x.dia === diaDeLaSemana(hoy) && !x.descanso && x.ejercicios.length) ?? null;
  const deHoy = d.sesiones.filter((s) => s.fecha === hoy);
  const conBloquesDeHoy = sesiones.filter((s) => s.fecha === hoy);
  const dias = rutina ? diasDeLaRutina(rutina) : (e.entreno?.dias ?? diasDeEntrenar(d.sesiones, hoy));
  let sesion: SesionDelDia | null = null;
  if (deHoy.length) {
    const inicio = deHoy.find((s) => s.inicio)?.inicio;
    sesion = {
      como: 'hecha',
      nombre: nombreDeSesion(gruposDeLaSesion({ ejercicios: deHoy.flatMap((s) => s.ejercicios) })),
      inicio: inicio ? minuto(Date.parse(inicio)) : hora,
      minutos: deHoy.reduce((t, s) => t + s.minutos, 0) || (e.entreno?.minutos ?? 60),
      bloques: conBloquesDeHoy.length ? conBloquesDeHoy.flatMap((s) => s.bloques) : null,
    };
  } else if (dias.includes(diaDeLaSemana(hoy))) {
    const referencia = [...d.sesiones].reverse().find((s) => diaDeLaSemana(s.fecha) === diaDeLaSemana(hoy) && s.fecha < hoy && s.fecha >= sumarDias(hoy, -DIAS_DE_LA_REFERENCIA)) ?? null;
    const conBloques = referencia ? sesiones.filter((s) => s.fecha === referencia.fecha) : [];
    const bloques = deLaRutina ? bloquesDeLaRutina(deLaRutina, sesiones.filter((s) => s.fecha < hoy)) : conBloques.flatMap((s) => s.bloques);
    sesion = {
      como: 'prevista',
      nombre: nombreDeSesion(deLaRutina ? gruposDelDia(deLaRutina) : referencia ? gruposDeLaSesion(referencia) : []),
      inicio: e.entreno?.hora ?? (referencia?.inicio ? minutosEnElDia(new Date(referencia.inicio), referencia.fecha) : HORA_DE_FABRICA),
      minutos: e.entreno?.minutos ?? (referencia?.minutos || 60),
      bloques: bloques.length ? bloques : null,
    };
  }
  const sabeCuandoEntrena = !!rutina || !!e.entreno || d.sesiones.length > 0;
  const en = sesion?.como === 'prevista' ? instante(hoy, sesion.inicio - ANTES_DE_LA_SESION) : ahoraMs;

  // El mejor 1RM de cada ejercicio con lo de antes de un momento, una vez por ejercicio: la fatiga lo pide por serie.
  const unoRMEn = (momento: number): UnoRMDe => {
    const previas = sesiones.filter((s) => s.inicio < momento);
    const vistos = new Map<string, number | null>();
    return (b) => {
      const k = claveDelEjercicio(b);
      if (!vistos.has(k)) vistos.set(k, mejorE1rm(previas, b));
      return vistos.get(k)!;
    };
  };
  const unoRM = unoRMEn(en);
  const opciones = { unoRM, novato: !entrenado, minuto: minuto(en) };
  const musculosHoy = musculosParaLaFatiga({ deHoy: sesion?.bloques ?? null, sesiones, en });
  const f = fatigaMuscular({ musculos: musculosHoy, sesiones, en, ...opciones });
  const despues = sesion?.como === 'hecha' ? fatigaMuscular({ musculos: musculosHoy, sesiones, en: ahoraMs, ...opciones, unoRM: unoRMEn(ahoraMs), minuto: minuto(ahoraMs) }) : null;

  // La noche: la de Salud o la de Moss sin reloj (sin las de ejemplo), con la calidad del reloj o de la mañana.
  const noches = sueno.deEjemplo ? [] : sueno.noches;
  const anoche = noches.find((n) => n.clave === hoy) ?? null;
  const ultimas3 = [0, 1, 2].flatMap((k) => noches.filter((n) => n.clave === sumarDias(hoy, -k)).map((n) => n.dormido));
  let noche: NocheDeHoy | null = null;
  if (anoche) {
    const habitual = habitualDe(noches, hoy);
    const despertoAntes = habitual && anoche.despertar < habitual.despertar ? habitual.despertar - anoche.despertar : null;
    const reloj = anoche.moss ? null : (calidadDeNoche(anoche, sueno.necesidad, ultimasNoches(noches, sumarDias(hoy, -1), 14))?.puntos ?? null);
    const n = { dormido: anoche.dormido, necesidad: sueno.necesidad, despertoAntes };
    noche = { ...n, estado: estadoDeLaNoche(n), seguidas: nochesCortasSeguidas(ultimas3), calidad: calidadParaRecuperar(reloj, e.noches.get(hoy)?.cara ?? null), siesta: anoche.siestas >= 20 };
  }
  const deuda = noches.length ? (deudaDeSueno(ultimasNoches(noches, hoy, 14), sueno.necesidad)?.minutos ?? null) : null;
  const comoTeSientes = d.siente?.fecha === hoy ? d.siente.n : null;
  const titular = titularDeHoy({
    sesion: sesion?.como ?? null, sabeCuandoEntrena, noche, ultimas3, musculos: sesion?.como === 'prevista' ? f.peor : null, comoTeSientes,
  });

  // El último entreno: el de hoy si ya está hecho; si no, el último antes.
  const deHoyJuntas: SesionConFecha | null = conBloquesDeHoy.length ? { fecha: hoy, inicio: conBloquesDeHoy[0].inicio, bloques: conBloquesDeHoy.flatMap((s) => s.bloques) } : null;
  const previas = sesiones.filter((s) => s.inicio < en);
  const ultima = sesion?.como === 'hecha' ? deHoyJuntas : (previas[previas.length - 1] ?? null);
  const trabajados = ultima ? musculosTrabajados(ultima, unoRM) : [];
  return {
    hoy, sesion, sabeCuandoEntrena, noche, ultimas3, deuda, comoTeSientes, titular, f, despues, musculosHoy, ultima, trabajados,
    conEllos: musculosHoy.length && sesion?.como !== 'hecha' ? ultimaCon(previas, musculosHoy, unoRM) : null,
    sesiones, en, ahora: ahoraMs, minuto, entrenado, unoRMEn, rutina,
  };
}

/** La última sesión en que trabajaron unos músculos como principales, con las series de trabajo de esos ejercicios. */
function ultimaCon(previas: readonly SesionConFecha[], musculos: readonly Musculo[], unoRM: UnoRMDe): { fecha: ClaveDia; series: number } | null {
  for (const s of [...previas].reverse()) {
    const series = s.bloques.reduce((t, b) => {
      const m = musculosDe(b);
      if (!m || !m.principal.some((x) => musculos.includes(x))) return t;
      const uno = unoRM(b);
      return t + b.series.filter((x) => esfuerzoDeSerie(x, uno) > 0).length;
    }, 0);
    if (series > 0) return { fecha: s.fecha, series };
  }
  return null;
}

// ------------------------------------------------------------ todo lo demás

export type DeLaFuerza = { e: Pick<Bloque, 'id' | 'ejercicio'>; t: TendenciaDeFuerza; puntos: { t: number; e1rm: number }[] };
export type DeLaMarca = { bloque: Bloque; pr: MarcaDeAscent; t: TendenciaDeFuerza; cerca: CercaDeLaMarca; condiciones: CondicionesDeLaMarca; frecuencia: { marcas: number; de: number }; fechas: ClaveDia[]; conMarca: Set<ClaveDia> };
export type Estancado = { e: Pick<Bloque, 'id' | 'ejercicio'>; ultima: MarcaDeAscent; sinMarca: number; musculo: Musculo; antes: SemanaDeEntreno[]; ahora: SemanaDeEntreno[]; r: RazonesDeEstancamiento };
export type DiaDelAnio = { fecha: ClaveDia; grupo: GrupoDelAnio | null; marca: boolean };

export type Todo = {
  diag: Diagnostico | null;
  foco: Foco[];
  comida: { dias: number; gPorKg: number | null; ayer: { p: number; meta: number } | null };
  todos: MusculoAhora[];
  /** Tu semana en Ascent: cada día de la rutina, desde hoy, con sus músculos como están ahora. Sin rutina, vacía. */
  semana: FatigaDelDia[];
  fuerza: DeLaFuerza[];
  marcas: DeLaMarca[];
  /** Las semanas sin marca que eligió en los Ajustes de Ascent (sin ellos, las de fábrica). */
  umbral: number;
  estancados: Estancado[];
  anio: { dias: DiaDelAnio[]; ultimas: (MarcaDeAscent & { grupo: GrupoDelAnio })[]; datos: TuAnio };
  comparten: { peso: { kg: number; fecha: ClaveDia } | null; conA: MetaConAscent | null };
  pesoKg: number | null;
};

/** El mismo ejercicio: por el id de Ascent si los dos lo tienen; si no, por el nombre. */
const mismo = (a: { id?: string; ejercicio: string }, b: { id?: string; ejercicio: string }) =>
  a.id && b.id ? a.id === b.id : claveDelEjercicio({ ejercicio: a.ejercicio }) === claveDelEjercicio({ ejercicio: b.ejercicio });

/** La meta de hoy con Ascent, con todo lo de la semana del control (para «Lo que comparten las dos»). */
function semanaConAscent(e: Estado, d: DeAscent): MetaConAscent | null {
  if (!e.perfil || !e.metas.length) return null;
  const vigente = metaVigente(e, e.hoy);
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg;
  if (!vigente || pesoKg === undefined) return null;
  const inicio = ultimoDiaDeControl(e.hoy, e.perfil.diaDelControl ?? diaDeLaSemana(e.metas[0].desde));
  const meta = { kcal: vigente.kcal, proteina: vigente.proteina, carbohidratos: vigente.carbohidratos, grasas: vigente.grasas };
  return metaDelDiaConAscent({ meta, inicio, dia: e.hoy, hoy: e.hoy, sesiones: d.sesiones, pesoKg, sexo: e.perfil.sexo });
}

/**
 * El contexto de la comida de hoy sin las sesiones (las pone la sección, con la de Ascent): se le pide a la
 * Comida con un horario que incluye hoy, y las suyas se descartan.
 */
function contextoSinSesiones(e: Estado, ahora: Date): Omit<Contexto, 'sesiones'> | null {
  const entreno = { dias: [diaDeLaSemana(e.hoy)], hora: HORA_DE_FABRICA, minutos: 60, tipo: 'fuerza' as const };
  const c = contextoDeHoy({ ...e, entreno }, ahora);
  if (!c) return null;
  const { sesiones: _s, ...resto } = c;
  return resto;
}

/** `enFrase`: el nombre de un ejercicio en el medio de una frase («buen día para intentar marca en sentadilla»). */
export function calcularTodo(h: Hoy, { e, d, sueno, persona, ahora }: Entradas, enFrase: (b: Pick<Bloque, 'id' | 'ejercicio'>) => string): Todo {
  const hoy = h.hoy;
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg ?? null;
  const delAnio = new Set(d.marcas.map((m) => m.fecha));
  const marcasDe = (b: Pick<Bloque, 'id' | 'ejercicio'>) => d.marcas.filter((m) => mismo(m, b));
  const mejorMarca = (b: Pick<Bloque, 'id' | 'ejercicio'>) => marcasDe(b).reduce<MarcaDeAscent | null>((a, m) => (!a || unRmDeAscent(m) > unRmDeAscent(a) ? m : a), null);
  const ultimaMarca = (b: Pick<Bloque, 'id' | 'ejercicio'>) => marcasDe(b).reduce<MarcaDeAscent | null>((a, m) => (!a || m.fecha > a.fecha ? m : a), null);

  /** La tendencia de un ejercicio con lo de antes de hoy (ya hecha, con la de hoy). */
  const tendenciaDe = (x: Pick<Bloque, 'id' | 'ejercicio'>) => {
    const hasta = h.sesion?.como === 'hecha' ? sumarDias(hoy, 1) : hoy;
    const puntos = puntosDelEjercicio(h.sesiones.filter((s) => s.fecha < hasta), x, hoy);
    return { t: tendenciaDeFuerza(puntos, { hoy: 0, entrenado: h.entrenado }), puntos };
  };

  // Tu fuerza: los multiarticulares con marca en Ascent de la rutina (sin ella, de las últimas 4 semanas), en el orden
  // en que vuelven en la semana.
  const desdeHoy = (dia: number) => (dia - diaDeLaSemana(hoy) + 7) % 7;
  const vistos = new Set<string>();
  const ejercicios: Pick<Bloque, 'id' | 'ejercicio'>[] = [];
  const seguir = (b: Pick<Bloque, 'id' | 'ejercicio'>) => {
    const c = b.id ? CATALOGO[b.id] : undefined;
    const k = claveDelEjercicio(b);
    if (!c?.multiarticular || vistos.has(k) || !marcasDe(b).length) return;
    vistos.add(k);
    ejercicios.push({ id: b.id, ejercicio: b.ejercicio });
  };
  if (h.rutina) {
    [...h.rutina.dias].sort((a, b) => desdeHoy(a.dia) - desdeHoy(b.dia)).forEach((x) => x.ejercicios.forEach((y) => seguir({ id: y.id, ejercicio: y.nombre })));
  } else {
    [...h.sesiones].filter((s) => s.fecha >= sumarDias(hoy, -DIAS_DE_LA_REFERENCIA)).reverse()
      .sort((a, b) => desdeHoy(diaDeLaSemana(a.fecha)) - desdeHoy(diaDeLaSemana(b.fecha))).forEach((s) => s.bloques.forEach(seguir));
  }
  const fuerza = ejercicios.map((x) => ({ e: x, ...tendenciaDe(x) }));

  // Marcas: los ejercicios de la sesión de hoy, antes de entrenar.
  const seriesDe = (musculos: readonly Musculo[], desde: number, hasta: number, unoRM: UnoRMDe) =>
    h.sesiones.filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
      const dosis = dosisDeLaSesion(x, unoRM);
      return t + musculos.reduce((s, m) => s + (dosis.get(m)?.series ?? 0), 0);
    }, 0);
  const marcas: DeLaMarca[] = [];
  if (h.sesion?.como === 'prevista' && h.sesion.bloques) {
    const unoRM = h.unoRMEn(h.en);
    const previas = h.sesiones.filter((s) => s.inicio < h.en);
    const vistosHoy = new Set<string>();
    for (const bloque of h.sesion.bloques) {
      const k = claveDelEjercicio(bloque);
      const pr = mejorMarca(bloque);
      const musc = musculosDe(bloque);
      if (!pr || !musc || vistosHoy.has(k)) continue;
      vistosHoy.add(k);
      const { t } = tendenciaDe(bloque);
      const peor = peorEstado(musc.principal.map((m) => estadoDe(residual(m, previas, h.en, { unoRM, novato: !h.entrenado }))));
      const semana = seriesDe(musc.principal, h.en - 7 * DIA, h.en, unoRM);
      const mes = seriesDe(musc.principal, h.en - 35 * DIA, h.en - 7 * DIA, unoRM) / 4;
      const fechas = h.sesiones.filter((s) => s.fecha < hoy && s.bloques.some((b) => mismo(b, bloque))).map((s) => s.fecha);
      const conMarcaDe = new Set(marcasDe(bloque).map((m) => m.fecha));
      marcas.push({
        bloque, pr, t,
        cerca: cercaDeLaMarca({ marca: unRmDeAscent(pr), nivel: t.nivel, sigma: t.sigma }),
        condiciones: condicionesDeLaMarca({ noche: h.noche, ultimas3: h.ultimas3, musculos: peor, seriesSemanaSobreMes: mes ? semana / mes : null }),
        frecuencia: frecuenciaDeMarcas(fechas, [...conMarcaDe]),
        fechas: [...new Set(fechas)].slice(-20),
        conMarca: conMarcaDe,
      });
    }
  }
  const ordenadas = ordenarMarcas(marcas);

  // Hoy, concéntrate en: el diagnóstico con la sesión de hoy y la comida.
  const c = contextoSinSesiones(e, ahora);
  let diag: Diagnostico | null = null;
  let foco: Foco[] = [];
  if (c) {
    const buena = h.noche ? ordenadas.find((m) => buenDiaParaLaMarca(m)) : undefined;
    const x = {
      contexto: c,
      sesion: h.sesion ? { inicio: h.sesion.inicio, minutos: h.sesion.minutos, tipo: 'fuerza' as const, hecha: h.sesion.como === 'hecha' } : null,
      sabeCuandoEntrena: h.sabeCuandoEntrena,
      noche: h.noche ? { dormido: h.noche.dormido, necesidad: h.noche.necesidad, siesta: h.noche.siesta, despertoAntes: h.noche.despertoAntes } : null,
      ultimas3: h.ultimas3,
      deuda: h.deuda,
      marca: buena ? enFrase(buena.bloque) : null,
    };
    diag = diagnostico(x);
    foco = focoDeHoy({ ...x, titular: h.noche ? h.titular : null, acostarse: c.acostarse ?? null });
  }

  // La comida de la semana: la proteína por kilo de los días anotados y la de ayer.
  const comidos = Array.from({ length: 7 }, (_, i) => totalDelDia(e.registros.values(), sumarDias(hoy, -1 - i), false)).filter((x) => x.kcal > 0);
  const comidoAyer = totalDelDia(e.registros.values(), sumarDias(hoy, -1), false);
  const metaAyer = metaDelDia(e, sumarDias(hoy, -1));
  const comida = {
    dias: comidos.length,
    gPorKg: comidos.length >= 3 && pesoKg ? comidos.reduce((s, x) => s + x.proteina, 0) / comidos.length / pesoKg : null,
    ayer: comidoAyer.kcal > 0 && metaAyer ? { p: Math.round(comidoAyer.proteina), meta: metaAyer.proteina } : null,
  };

  // Tus músculos, ahora, y tu semana en Ascent: cada día de la rutina con sus músculos como están ahora.
  const opcionesAhora = { unoRM: h.unoRMEn(h.ahora), novato: !h.entrenado, minuto: h.minuto(h.ahora) };
  const todos = todosLosMusculos({ sesiones: h.sesiones, en: h.ahora, ...opcionesAhora });
  const semana = h.rutina ? fatigaPorDia({
    rutina: h.rutina.dias.map((x) => ({ dia: x.dia, nombre: nombreDeSesion(gruposDelDia(x)), ejercicios: x.ejercicios.map((y) => ({ id: y.id, ejercicio: y.nombre, grupo: grupoDe(y) })) })),
    hoy: diaDeLaSemana(hoy), sesiones: h.sesiones, en: h.ahora, ...opcionesAhora,
  }) : [];

  // Razones de estancamiento: los de «Tu fuerza» sin subida clara, ya pasado el umbral de Ascent.
  const umbral = d.ajustes?.umbral ?? UMBRAL_DE_ASCENT;
  const pasadas = h.sesiones.filter((s) => s.fecha < hoy);
  const conSesion = (lunes: ClaveDia) => pasadas.some((s) => s.fecha >= lunes && s.fecha < sumarDias(lunes, 7));
  const noches = new Map<ClaveDia, number>(Object.entries(d.noches));
  if (!sueno.deEjemplo) for (const n of sueno.noches) if (n.confianza.duracion !== 'baja') noches.set(n.clave, n.dormido);
  const deLaSemana = (lunes: ClaveDia) => {
    const fechas = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)).filter((f) => f < hoy);
    const dias = fechas.map((f) => totalDelDia(e.registros.values(), f, false)).filter((x) => x.kcal > 0);
    return {
      comida: { dias: dias.length, proteina: dias.length ? dias.reduce((s, x) => s + x.proteina, 0) / dias.length : 0 },
      noches: fechas.flatMap((f) => (noches.has(f) ? [noches.get(f)!] : [])),
    };
  };
  const promedio = (xs: number[]) => (xs.length >= 3 ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
  const baja = !persona.deEjemplo && persona.cambio7 !== null && pesoKg ? (-persona.cambio7 / pesoKg) * 100 : null;
  const experiencia = e.respuestas?.experiencia;
  const estancados = fuerza.flatMap(({ e: x, t }) => {
    const ultima = ultimaMarca(x);
    if (!ultima) return [];
    const sinMarca = Math.floor(diasEntre(ultima.fecha, hoy) / 7);
    const musculo = musculosDe(x)?.principal[0];
    if (!musculo || !estaEstancado(t, sinMarca, umbral)) return [];
    // Las semanas sin ninguna sesión (las vacaciones) no cuentan para comparar lo que se entrenaba.
    const s = semanasParaLasRazones(ultima.fecha, hoy);
    const semana = (l: ClaveDia) => semanaDeEntreno(pasadas, l, x, musculo);
    const antes = s.antes.filter(conSesion).map(semana);
    const ahoraS = s.ahora.filter(conSesion).map(semana);
    const moss = s.ahora.map(deLaSemana);
    const r = razonesDeEstancamiento({
      antes, ahora: ahoraS, objetivo: e.perfil?.objetivo ?? 'mantener', sinDeficit: !!e.perfil?.sinDeficit, bajaSemanal: baja,
      comida: moss.map((m) => m.comida), pesoKg: pesoKg ?? 0,
      sueno: { antes: promedio(s.antes.flatMap((l) => deLaSemana(l).noches)), ahora: promedio(moss.flatMap((m) => m.noches)) },
      anios: experiencia ? ANIOS[experiencia] : null,
    });
    return [{ e: x, ultima, sinMarca, musculo, antes, ahora: ahoraS, r }];
  });

  // Tu año: cada día del año con el grupo de lo que más trabajaste y sus marcas; la última marca de cada grupo.
  const anio = Number(hoy.slice(0, 4));
  const grupoDelDia = new Map<ClaveDia, GrupoDelAnio | null>();
  for (const s of d.sesiones) if (s.fecha.startsWith(`${anio}-`)) grupoDelDia.set(s.fecha, grupoDelDia.get(s.fecha) ?? grupoDelAnio(gruposDeLaSesion(s)));
  const dias: DiaDelAnio[] = [...grupoDelDia].map(([fecha, grupo]) => ({ fecha, grupo, marca: delAnio.has(fecha) }));
  const ultimas = (['piernas', 'pecho', 'espalda'] as const).flatMap((grupo) => {
    const de = d.marcas.filter((m) => {
      const g = grupoDelEjercicio({ id: m.id });
      return g && grupoDelAnio([g]) === grupo;
    }).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
    return de ? [{ ...de, grupo }] : [];
  });
  const comidas = new Set<ClaveDia>();
  for (const r of vigentes(e.registros.values())) if (!r.planificado) comidas.add(r.dia);
  const datos = tuAnio({ anio, sesiones: d.sesiones, marcas: d.marcas, dias: e.dias.values(), noches, diasConComida: comidas });

  const peso = e.pesos[e.pesos.length - 1];
  return {
    diag, foco, comida, todos, semana, fuerza, marcas: ordenadas, umbral, estancados,
    anio: { dias, ultimas, datos },
    comparten: { peso: peso ? { kg: peso.kg, fecha: peso.fecha } : null, conA: semanaConAscent(e, d) },
    pesoKg,
  };
}
