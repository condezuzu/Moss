// Lo que muestra la sección de Ascent vinculada (spec/musculos-compartido.md, la misma en Moss y en Ascent), con lo que
// llega de Ascent y lo de Moss: lo de hoy (calcularHoy, que también usan Inicio y Sueño), tus músculos de la semana con
// las cuentas compartidas (calcularTusMusculos) y, más arriba, los estancados con sus razones y tu año (calcularTodo).
// Las cuentas son las del dominio (puntajeMuscular.ts, fatiga.ts, estancados.ts, musculos.ts, rendimiento.ts y
// conAscent.ts); acá solo se juntan los datos. Con la rutina de Ascent (moss.ascent_rutina), la sesión de hoy es la
// de la rutina y los estancados siguen sus multiarticulares; sin ella, los de las últimas cuatro semanas.

import type { Estado } from '@/almacen/almacen';
import type { DeAscent } from '@/almacen/ascent';
import {
  bloquesDeLaRutina, diasDeEntrenar, diasDeLaRutina, entrenadoSegunAscent, grupoDe, gruposDelDia, gruposDeLaSesion, sesionesConBloques, tuAnio, type MarcaDeAscent, type RutinaDeAscent, type TuAnio,
} from '@/dominio/conAscent';
import {
  grupoDelAnio, type GrupoDelAnio, estaEstancado, razonesDeEstancamiento, UMBRAL_DE_ASCENT, type RazonesDeEstancamiento, type SemanaDeEntreno, tendenciaDeFuerza, type TendenciaDeFuerza, DIAS_DE_COMIDA, PROTEINA_POR_KG, proyeccionDeMeta, SUENO_POCO, type ProyeccionDeMeta,
} from '@/dominio/progresoCompartido';
import { calidadParaRecuperar } from '@/dominio/entrenamiento';
import { puntosDelEjercicio, semanaDeEntreno, semanasParaLasRazones } from '@/dominio/estancados';
import { fatigaMuscular, musculosParaLaFatiga } from '@/dominio/fatiga';
import { diaDeLaSemana, diasEntre, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  CATALOGO, claveDelEjercicio, esfuerzoDeSerie, grupoDelEjercicio, mejorE1rm, MUSCULOS, musculosDe, musculosTrabajados, PARTES,
  type Bloque, type Musculo, type Parte, type SesionConBloques, type UnoRMDe,
} from '@/dominio/musculos';
import {
  DE_PIERNAS, DIAS_DEL_E1RM, dentroDeLaSemana, e1rm, diasHastaListo, esDeTrabajo, esDura, estadoDeFatiga, estadoDelPuntaje, listoEl, mejorE1rm as mejorDeLasSeries, notaDeLaRutina,
  proximaSesion, puntaje, seriesPorMusculo as seriesDurasPorMusculo,
  type EjercicioHecho, type EstadoDeFatiga, type EstadoDelPuntaje, type MusculoEnLaSesion, type NotaDeLaRutina, type Proxima,
} from '@/dominio/puntajeMuscular';
import { titularDeHoy, type Titular } from '@/dominio/recuperado';
import {
  DESPERTO_ANTES, estadoDeLaNoche, NOCHE_CORTA, nochesCortasSeguidas, type EstadoDeLaNoche, type Noche as NocheDelRendimiento,
} from '@/dominio/rendimiento';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { habitualDe } from '@/dominio/sinReloj';
import { calidadDeNoche, deudaDeSueno, ultimasNoches } from '@/dominio/sueno';
import type { MetaDeFuerza } from '@/lib/ascentRemoto';
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
export type Estancado = { e: Pick<Bloque, 'id' | 'ejercicio'>; ultima: MarcaDeAscent; sinMarca: number; musculo: Musculo; antes: SemanaDeEntreno[]; ahora: SemanaDeEntreno[]; r: RazonesDeEstancamiento };
export type DiaDelAnio = { fecha: ClaveDia; grupo: GrupoDelAnio | null; marca: boolean };
/** Una meta de fuerza con tu nivel de hoy (el 1RM estimado de la tendencia), el de la meta y cuándo llegarías. */
export type MetaConProyeccion = { meta: MetaDeFuerza; e: Pick<Bloque, 'id' | 'ejercicio'>; nivel: number | null; objetivo: number; proyeccion: ProyeccionDeMeta };
/** Lo que puede alejar una meta: el sueño de la última semana o la proteína, por debajo de lo que pide. */
export type Aleja = { que: 'sueno'; minutos: number } | { que: 'proteina'; gPorKg: number };

export type Todo = {
  /** Las semanas sin marca que eligió en los Ajustes de Ascent (sin ellos, las de fábrica). */
  umbral: number;
  estancados: Estancado[];
  anio: { dias: DiaDelAnio[]; ultimas: (MarcaDeAscent & { grupo: GrupoDelAnio })[]; datos: TuAnio };
  metas: MetaConProyeccion[];
  alejan: Aleja[];
  /** La proteína del día que pide la meta (1,6 g por kilo); sin peso, null. */
  proteina: number | null;
  /** Los ejercicios para elegir una meta nueva: los de la rutina o, sin ella, los de las últimas 4 semanas. */
  paraMetas: Pick<Bloque, 'id' | 'ejercicio'>[];
};

/** El mismo ejercicio: por el id de Ascent si los dos lo tienen; si no, por el nombre. */
const mismo = (a: { id?: string; ejercicio: string }, b: { id?: string; ejercicio: string }) =>
  a.id && b.id ? a.id === b.id : claveDelEjercicio({ ejercicio: a.ejercicio }) === claveDelEjercicio({ ejercicio: b.ejercicio });

/** Lo de más arriba: los estancados con sus razones y tu año. */
export function calcularTodo(h: Hoy, { e, d, sueno, persona }: Entradas): Todo {
  const hoy = h.hoy;
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg ?? null;
  const delAnio = new Set(d.marcas.map((m) => m.fecha));
  const marcasDe = (b: Pick<Bloque, 'id' | 'ejercicio'>) => d.marcas.filter((m) => mismo(m, b));
  const ultimaMarca = (b: Pick<Bloque, 'id' | 'ejercicio'>) => marcasDe(b).reduce<MarcaDeAscent | null>((a, m) => (!a || m.fecha > a.fecha ? m : a), null);

  /** La tendencia de un ejercicio con lo de antes de hoy (ya hecha, con la de hoy). */
  const tendenciaDe = (x: Pick<Bloque, 'id' | 'ejercicio'>) => {
    const hasta = h.sesion?.como === 'hecha' ? sumarDias(hoy, 1) : hoy;
    const puntos = puntosDelEjercicio(h.sesiones.filter((s) => s.fecha < hasta), x, hoy);
    return { t: tendenciaDeFuerza(puntos, { hoy: 0, entrenado: h.entrenado }), puntos };
  };

  // Los que se miran: los multiarticulares con marca en Ascent de la rutina (sin ella, de las últimas 4 semanas).
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
  const fuerza: DeLaFuerza[] = ejercicios.map((x) => ({ e: x, ...tendenciaDe(x) }));

  // Los estancados y sus razones: sin subida clara y ya pasado el umbral de Ascent.
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
  const ultimas = (['piernas', 'pecho', 'espalda', 'brazos'] as const).flatMap((grupo) => {
    const de = d.marcas.filter((m) => {
      const g = grupoDelEjercicio({ id: m.id });
      return g && grupoDelAnio([g]) === grupo;
    }).sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0];
    return de ? [{ ...de, grupo }] : [];
  });
  const comidas = new Set<ClaveDia>();
  for (const r of vigentes(e.registros.values())) if (!r.planificado) comidas.add(r.dia);
  const datos = tuAnio({ anio, sesiones: d.sesiones, marcas: d.marcas, dias: e.dias.values(), noches, diasConComida: comidas });

  // Las metas: cada una con la tendencia de su ejercicio. Lo que la puede alejar es de la persona: el sueño y la
  // proteína de la última semana, con los mismos cortes que las razones de estancamiento.
  const nombreDe = (id: string) => h.sesiones.flatMap((s) => s.bloques).find((b) => b.id === id)?.ejercicio ?? h.rutina?.dias.flatMap((x) => x.ejercicios).find((x) => x.id === id)?.nombre ?? id;
  const metas = d.metas.map((meta): MetaConProyeccion => {
    const x = { id: meta.ejercicio, ejercicio: nombreDe(meta.ejercicio) };
    const { t } = tendenciaDe(x);
    const objetivo = e1rm(meta.kilos, meta.reps) ?? meta.kilos;
    return { meta, e: x, nivel: t.nivel, objetivo, proyeccion: proyeccionDeMeta(t, objetivo) };
  });
  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(hoy, -1 - i));
  const dormido = promedio(semana.flatMap((f) => (noches.has(f) ? [noches.get(f)!] : [])));
  const comidos = semana.map((f) => totalDelDia(e.registros.values(), f, false)).filter((x) => x.kcal > 0);
  const gPorKg = comidos.length >= DIAS_DE_COMIDA && pesoKg ? comidos.reduce((s, x) => s + x.proteina, 0) / comidos.length / pesoKg : null;
  const alejan: Aleja[] = [
    ...(dormido !== null && dormido < SUENO_POCO ? [{ que: 'sueno' as const, minutos: dormido }] : []),
    ...(gPorKg !== null && gPorKg < PROTEINA_POR_KG ? [{ que: 'proteina' as const, gPorKg }] : []),
  ];
  const vistosParaMetas = new Set<string>();
  const paraMetas = (h.rutina ? h.rutina.dias.flatMap((x) => x.ejercicios.map((y) => ({ id: y.id, ejercicio: y.nombre })))
    : h.sesiones.filter((s) => s.fecha >= sumarDias(hoy, -DIAS_DE_LA_REFERENCIA)).flatMap((s) => s.bloques.map((b) => ({ id: b.id, ejercicio: b.ejercicio }))))
    .filter((x) => x.id && musculosDe(x) && !vistosParaMetas.has(x.id) && vistosParaMetas.add(x.id));

  return {
    umbral, estancados, anio: { dias, ultimas, datos }, metas, alejan, proteina: pesoKg ? Math.round(PROTEINA_POR_KG * pesoKg) : null, paraMetas,
  };
}

// ------------------------------------------------------------ tus músculos (spec/musculos-compartido.md)

export type MusculoDeLaSemana = {
  musculo: Musculo; series: number; puntaje: number; estado: EstadoDelPuntaje; partes: Partial<Record<Parte, number>>;
  /** Los días que faltan para que esté listo (0, ya está), qué día y cómo está. */
  dias: number; listo: ClaveDia | null; fatiga: EstadoDeFatiga;
};
export type EjercicioDeLaSemana = {
  e: Pick<Bloque, 'id' | 'ejercicio'>; principal: Musculo[]; ayudan: Musculo[]; parte: Parte | null;
  /** Las repeticiones del objetivo en la rutina; sin ellas, null. */
  tope: number | null;
  /** Las series duras de la semana, las que fueron al fallo y el RIR de las que lo anotaron. */
  duras: number; alFallo: number; rir: number[]; proxima: Proxima;
  /** El peso más alto de la última sesión con el ejercicio (0, con el del cuerpo). */
  peso: number;
};
/** `total`: los días desde su última sesión hasta que esté listo (para el reloj). */
export type Fatigado = { musculo: Musculo; dias: number; listo: ClaveDia; total: number; fatiga: EstadoDeFatiga };
export type TusMusculos = {
  musculos: MusculoDeLaSemana[];
  ejercicios: EjercicioDeLaSemana[];
  /** La nota de la rutina de Ascent; sin rutina, null. */
  nota: NotaDeLaRutina | null;
  /** Los que todavía no están listos, del que más tarda al que menos. */
  fatigados: Fatigado[];
  conDatos: boolean;
};

/** La fatiga mira las sesiones de 2 semanas para atrás (lo más que tarda un músculo son 4 días, más uno por sesión seguida). */
const DIAS_DE_LA_FATIGA = 14;
/** Un ejercicio es nuevo si no estuvo en las 26 semanas anteriores. */
const DIAS_DE_NUEVO = 182;

/** Tus músculos de la semana con las cuentas compartidas con Ascent (puntajeMuscular.ts), la nota de tu rutina y los fatigados. */
export function calcularTusMusculos(h: Hoy): TusMusculos {
  // El 1RM de referencia de cada ejercicio: el mejor de sus series de los últimos 126 días (como en Ascent).
  const previas = h.sesiones.filter((s) => s.inicio < h.ahora && s.inicio >= h.ahora - DIAS_DEL_E1RM * DIA);
  const vistos = new Map<string, number | null>();
  const unoRM = (b: Bloque) => {
    const k = claveDelEjercicio(b);
    if (!vistos.has(k)) vistos.set(k, mejorDeLasSeries(previas.flatMap((s) => s.bloques.filter((y) => claveDelEjercicio(y) === k).flatMap((y) => y.series))));
    return vistos.get(k)!;
  };
  const topeDe = new Map<string, number>();
  for (const d of h.rutina?.dias ?? []) for (const y of d.ejercicios) if (y.reps) topeDe.set(y.id, y.reps);
  /** Un ejercicio con sus series de trabajo (la entrada en calor no cuenta), como lo reciben las cuentas compartidas. */
  const hechoDe = (b: Bloque): EjercicioHecho | null => {
    const m = musculosDe(b);
    if (!m) return null;
    const uno = unoRM(b);
    const parte = b.id ? PARTES[b.id] : undefined;
    return {
      principal: m.principal, ayuda: m.ayudan, ...(parte ? { parte } : {}), objetivo: (b.id && topeDe.get(b.id)) || null,
      series: b.series.filter((x) => esDeTrabajo(x, uno)).map((x) => ({ reps: x.reps, rir: x.rir ?? null })),
    };
  };
  const hechos = h.sesiones.filter((s) => dentroDeLaSemana(s.fecha, h.hoy)).flatMap((s) => s.bloques.flatMap((b) => {
    const x = hechoDe(b);
    return x ? [{ b, x }] : [];
  }));
  const porMusculo = seriesDurasPorMusculo(hechos.map((y) => y.x));

  // La fatiga, en días: cada sesión de las últimas 2 semanas, por cada músculo principal.
  const primera = h.sesiones[0]?.fecha;
  const nuevoEl = (b: Bloque, fecha: ClaveDia) => {
    const desde = sumarDias(fecha, -DIAS_DE_NUEVO);
    // Sin 26 semanas de datos no se puede saber: no se suma el día.
    if (!primera || primera > desde) return false;
    const k = claveDelEjercicio(b);
    return !h.sesiones.some((s) => s.fecha >= desde && s.fecha < fecha && s.bloques.some((y) => claveDelEjercicio(y) === k));
  };
  const porSesion = new Map<Musculo, MusculoEnLaSesion[]>();
  for (const s of h.sesiones) {
    if (s.inicio > h.ahora || diasEntre(s.fecha, h.hoy) > DIAS_DE_LA_FATIGA) continue;
    const delDia = new Map<Musculo, MusculoEnLaSesion>();
    for (const b of s.bloques) {
      const m = musculosDe(b);
      const x = hechoDe(b);
      if (!m || !x || !x.series.length) continue;
      const rirs = x.series.flatMap((y) => (y.rir != null ? [y.rir] : []));
      const multi = !!(b.id && CATALOGO[b.id]?.multiarticular);
      for (const musculo of m.principal) {
        const antes = delDia.get(musculo);
        const rirMinimo = rirs.length ? Math.min(...rirs, ...(antes?.rirMinimo != null ? [antes.rirMinimo] : [])) : (antes?.rirMinimo ?? null);
        delDia.set(musculo, {
          fecha: s.fecha,
          series: (antes?.series ?? 0) + x.series.length,
          rirMinimo,
          multiarticularDePiernas: (antes?.multiarticularDePiernas ?? false) || (multi && (DE_PIERNAS as readonly string[]).includes(musculo)),
          nuevo: (antes?.nuevo ?? false) || nuevoEl(b, s.fecha),
        });
      }
    }
    for (const [musculo, x] of delDia) porSesion.set(musculo, [...(porSesion.get(musculo) ?? []), x]);
  }
  const listoDe = (m: Musculo) => listoEl(porSesion.get(m) ?? []);

  const musculos = MUSCULOS.map((musculo): MusculoDeLaSemana => {
    const x = porMusculo.get(musculo);
    const p = puntaje(x?.series ?? 0);
    const listo = listoDe(musculo);
    const dias = diasHastaListo(listo, h.hoy);
    return { musculo, series: x?.series ?? 0, puntaje: p, estado: estadoDelPuntaje(p), partes: (x?.partes ?? {}) as Partial<Record<Parte, number>>, dias, listo: dias ? listo : null, fatiga: estadoDeFatiga(dias) };
  });

  // Cada ejercicio de la semana una vez, con la próxima sesión: la doble progresión con sus últimas sesiones. El día de
  // una noche corta, lo que toca hoy no sube.
  const juntos = new Map<string, { b: Bloque; x: EjercicioHecho; duras: number; alFallo: number; rir: number[] }>();
  for (const { b, x } of hechos) {
    const k = claveDelEjercicio(b);
    const g = juntos.get(k) ?? { b, x, duras: 0, alFallo: 0, rir: [] };
    g.duras += x.series.filter((s) => esDura(s, x.objetivo)).length;
    g.alFallo += x.series.filter((s) => s.rir === 0).length;
    g.rir.push(...x.series.flatMap((s) => (s.rir != null ? [s.rir] : [])));
    juntos.set(k, g);
  }
  const nocheCorta = !!h.noche && (h.noche.dormido <= NOCHE_CORTA || (h.noche.despertoAntes ?? 0) >= DESPERTO_ANTES);
  const deHoy = new Set(h.sesion?.como === 'prevista' ? (h.sesion.bloques ?? []).map(claveDelEjercicio) : []);
  const ejercicios = [...juntos.entries()].map(([k, { b, x, duras, alFallo, rir }]): EjercicioDeLaSemana => {
    const sesiones = h.sesiones.map((s) => ({ series: s.bloques.filter((y) => claveDelEjercicio(y) === k).flatMap((y) => hechoDe(y)?.series ?? []) })).filter((s) => s.series.length);
    const ultima = [...h.sesiones].reverse().find((s) => s.bloques.some((y) => claveDelEjercicio(y) === k));
    const peso = Math.max(0, ...(ultima?.bloques.filter((y) => claveDelEjercicio(y) === k).flatMap((y) => y.series.map((z) => z.peso)) ?? []));
    const fatigadoHoy = deHoy.has(k) && x.principal.some((m) => (musculos.find((y) => y.musculo === m)?.dias ?? 0) > 0);
    return {
      e: { id: b.id, ejercicio: b.ejercicio }, principal: x.principal as Musculo[], ayudan: x.ayuda as Musculo[], parte: (x.parte as Parte | undefined) ?? null, tope: x.objetivo ?? null,
      duras, alFallo, rir, peso, proxima: proximaSesion({ sesiones, tope: x.objetivo ?? null, nocheCortaHoy: nocheCorta && deHoy.has(k), fatigadoHoy }),
    };
  });

  // La nota de la rutina: lo que dice cada día, con sus series (sin RIR: cuentan todas).
  const nota = h.rutina ? notaDeLaRutina(h.rutina.dias.filter((d) => !d.descanso).map((d) => d.ejercicios.flatMap((y) => {
    const m = musculosDe({ id: y.id, grupo: grupoDe(y) });
    return m ? [{ principal: m.principal, ayuda: m.ayudan, series: Array.from({ length: y.series }, () => ({ reps: null })) }] : [];
  }))) : null;

  return {
    musculos, ejercicios, nota,
    fatigados: musculos.flatMap(({ musculo, dias, listo, fatiga }) => {
      const ultima = porSesion.get(musculo)?.at(-1)?.fecha;
      return listo && ultima ? [{ musculo, dias, listo, total: Math.max(dias, diasEntre(ultima, listo)), fatiga }] : [];
    }).sort((a, b) => b.dias - a.dias),
    conDatos: h.sesiones.some((s) => s.fecha >= sumarDias(h.hoy, -DIAS_DE_LA_REFERENCIA)),
  };
}
