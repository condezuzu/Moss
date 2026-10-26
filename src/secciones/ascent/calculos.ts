// Lo que muestra la sección de Ascent vinculada, con lo que llegó de Ascent y lo de Moss, como en la
// galería (galeria/src/ascent.js): hoy en Ascent, la recuperación, el rendimiento esperado, los
// músculos, la marca posible, por qué no subes y tu año. Las cuentas son las del dominio
// (entrenamiento.ts, rendimiento.ts, musculos.ts y conAscent.ts); acá solo se juntan los datos.

import type { Estado } from '@/almacen/almacen';
import { metaVigente } from '@/almacen/almacen';
import type { DeAscent } from '@/almacen/ascent';
import {
  cargaAntesDe, diasDeEntrenar, estancamiento, gruposDeLaSesion, metaDelDiaConAscent, semanaDesde, semanasParaComparar, sesionesConBloques, tuAnio,
  type Estancado, type MetaConAscent, type SesionDeAscent, type TuAnio,
} from '@/dominio/conAscent';
import { ultimoDiaDeControl } from '@/dominio/control';
import { porQueNoSube, recuperacion, type PorQueNoSube, type Recuperacion } from '@/dominio/entrenamiento';
import { diaDeLaSemana, diasEntre, sumarDias, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import type { Habito } from '@/dominio/habitos';
import type { Macros } from '@/dominio/metas';
import { DE_PIERNAS, dosisDeLaSesion, estadoDe, listoEn, mejorE1rm, musculosDe, residual as residualDe, type EstadoMuscular, type GrupoDeAscent, type Musculo } from '@/dominio/musculos';
import { buenDiaParaMarca, rendimientoEsperado, seguridadDeMarcas, type DiaDeMarca, type Rendimiento, type Seguridad } from '@/dominio/rendimiento';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { habitualDe } from '@/dominio/sinReloj';
import { calidadDeNoche, deudaDeSueno, ultimasNoches, type Noche } from '@/dominio/sueno';
import type { Persona, Sueno } from '../persona';

const DIA = 86_400_000;
const MINUTO = 60_000;

/** Los grupos de «Tus músculos», con los músculos de cada uno. */
export const GRUPOS_DE_MUSCULOS = {
  piernas: ['cuadriceps', 'gluteos', 'isquios', 'aductores', 'pantorrillas'], espaldaBaja: ['espaldaBaja'], espalda: ['espaldaAlta'],
  pecho: ['pecho'], hombros: ['hombros'], brazos: ['biceps', 'triceps', 'antebrazos'], abdomen: ['abdomen'],
} as const satisfies Record<string, readonly Musculo[]>;
export type GrupoDeMusculos = keyof typeof GRUPOS_DE_MUSCULOS;
const grupoDelMusculo = (m: Musculo) => (Object.keys(GRUPOS_DE_MUSCULOS) as GrupoDeMusculos[]).find((g) => (GRUPOS_DE_MUSCULOS[g] as readonly Musculo[]).includes(m))!;

const sinTildes = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
const mismo = (a: string, b: string) => sinTildes(a) === sinTildes(b);

/** Un instante de un día a unos minutos de la hora local. */
const instante = (dia: ClaveDia, minutos: number) => {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d, Math.floor(minutos / 60), minutos % 60).getTime();
};

export type HoyEnAscent = MetaConAscent & { sesionDeAscent: SesionDeAscent; grupos: GrupoDeAscent[]; hora: number | null };
export type RecuperacionDeHoy = Recuperacion & { anoche: Noche; calidad: number | null; proteinaAyer: number; metaProteina: number };
export type RendimientoDeHoy = {
  r: Rendimiento;
  /** La sesión de hoy o, si todavía no entrenó, la que suele hacer este día de la semana. */
  deHoy: boolean;
  grupos: GrupoDeAscent[];
  dia: DiaSemana;
  musculo: GrupoDeMusculos;
  anoche: Noche | null;
  seguridad: Seguridad;
  semanas: number;
};
export type MusculoDeHoy = { grupo: GrupoDeMusculos; residual: number; estado: EstadoMuscular; listo: number | null };
export type MarcaPosible = DiaDeMarca & { ejercicio: string; grupo: GrupoDeMusculos; dias: number; veces: number; acerto: number; seguridad: Seguridad; marcas: number; semanas: number; anoche: Noche | null };
export type PorQueNoSubes = { estancado: null } | { estancado: Estancado; r: PorQueNoSube };

export type VistaDeAscent = {
  hoy: HoyEnAscent | null;
  gimnasio: { habito: Habito | null; dias: DiaSemana[] };
  /** null: falta la noche de anoche. */
  recuperacion: RecuperacionDeHoy | null;
  /** null: no hay sesiones de Ascent para saber qué se entrena hoy. */
  rendimiento: RendimientoDeHoy | null;
  musculos: MusculoDeHoy[];
  marca: MarcaPosible | null;
  porQue: PorQueNoSubes;
  anio: TuAnio & { desde: ClaveDia };
};

export type Entradas = {
  e: Estado;
  d: DeAscent;
  sueno: Sueno;
  persona: Persona;
  /** La meta de un día como se ve en Comida (con lo de Ascent). */
  metaDe: (dia: ClaveDia) => Macros | null;
  /** Para Sueño: solo la recuperación y el rendimiento (lo demás cuesta y no se ve). */
  soloSueno?: boolean;
};

/** La meta de un día con Ascent, con todo lo de la semana (para «Hoy en Ascent»). */
export function semanaConAscent(e: Estado, d: DeAscent, dia: ClaveDia): MetaConAscent | null {
  if (!e.perfil || !e.metas.length) return null;
  const vigente = metaVigente(e, dia);
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg;
  if (!vigente || pesoKg === undefined) return null;
  const inicio = ultimoDiaDeControl(dia, e.perfil.diaDelControl ?? diaDeLaSemana(e.metas[0].desde));
  const meta = { kcal: vigente.kcal, proteina: vigente.proteina, carbohidratos: vigente.carbohidratos, grasas: vigente.grasas };
  return metaDelDiaConAscent({ meta, inicio, dia, hoy: e.hoy, sesiones: d.sesiones, pesoKg, sexo: e.perfil.sexo });
}

/** Lo dormido cada noche: lo que se fue juntando y lo de Salud y Moss de ahora (lo de ahora gana). */
function nochesDe(d: DeAscent, sueno: Sueno): Map<ClaveDia, number> {
  const m = new Map<ClaveDia, number>(Object.entries(d.noches));
  if (!sueno.deEjemplo) for (const n of sueno.noches) if (n.confianza.duracion !== 'baja') m.set(n.clave, n.dormido);
  return m;
}

/** Lo comido cada día que se anotó algo (sin lo planificado). */
function comidasDe(e: Estado): Map<ClaveDia, { kcal: number; proteina: number }> {
  const m = new Map<ClaveDia, { kcal: number; proteina: number }>();
  for (const r of vigentes(e.registros.values())) {
    if (r.planificado) continue;
    const x = m.get(r.dia) ?? { kcal: 0, proteina: 0 };
    m.set(r.dia, { kcal: x.kcal + r.valores.kcal, proteina: x.proteina + r.valores.proteina });
  }
  return m;
}

export function calcularVista({ e, d, sueno, persona, metaDe, soloSueno = false }: Entradas): VistaDeAscent {
  const hoy = e.hoy;
  const ayer = sumarDias(hoy, -1);
  const noches = sueno.deEjemplo ? [] : sueno.noches;
  const anoche = noches.find((n) => n.clave === hoy) ?? null;

  // ---------------------------------------------------------------- hoy en Ascent
  const deHoy = d.sesiones.filter((s) => s.fecha === hoy);
  const semana = deHoy.length ? semanaConAscent(e, d, hoy) : null;
  const sesionDeAscent: SesionDeAscent | null = deHoy.length
    ? { ...deHoy[0], series: deHoy.reduce((t, s) => t + s.series, 0), kilos: deHoy.reduce((t, s) => t + s.kilos, 0), minutos: deHoy.reduce((t, s) => t + s.minutos, 0), ejercicios: deHoy.flatMap((s) => s.ejercicios) }
    : null;
  const inicioDeHoy = deHoy.find((s) => s.inicio)?.inicio;
  const hoyEnAscent: HoyEnAscent | null = semana && sesionDeAscent
    ? { ...semana, sesionDeAscent, grupos: gruposDeLaSesion(sesionDeAscent), hora: inicioDeHoy ? new Date(inicioDeHoy).getHours() * 60 + new Date(inicioDeHoy).getMinutes() : null }
    : null;

  // ---------------------------------------------------------------- recuperación
  let rec: RecuperacionDeHoy | null = null;
  const metaAyer = metaDe(ayer) ?? metaDe(hoy);
  if (anoche && metaAyer) {
    const calidad = calidadDeNoche(anoche, sueno.necesidad, ultimasNoches(noches, ayer, 14))?.puntos ?? null;
    const comido = totalDelDia(e.registros.values(), ayer, false);
    const r = recuperacion({
      dormido: anoche.dormido, necesidad: sueno.necesidad, calidad, sentida: e.noches.get(hoy)?.cara ?? null,
      ...cargaAntesDe(d.sesiones, hoy),
      proteinaAyer: comido.proteina, metaProteina: metaAyer.proteina, kcalAyer: comido.kcal, metaKcal: metaAyer.kcal,
    });
    rec = { ...r, anoche, calidad, proteinaAyer: comido.proteina, metaProteina: metaAyer.proteina };
  }

  // ---------------------------------------------------------------- antes de entrenar hoy
  // Ascent manda la hora si se cronometró; si no, se supone la de Perfil › Entrenamiento (o las 18).
  const hora = e.entreno?.hora ?? 18 * 60;
  const conBloques = sesionesConBloques(d.sesiones, (s) => (s.inicio ? Date.parse(s.inicio) : instante(s.fecha, hora)));
  const laDeHoy = conBloques.find((x) => x.fecha === hoy) ?? null;
  // 10 minutos antes de la sesión de hoy: lo de antes es lo que pesa.
  const en = (laDeHoy ? laDeHoy.inicio : instante(hoy, hora)) - 10 * MINUTO;
  const previas = conBloques.filter((x) => x.inicio < en);
  // El mejor 1RM de cada ejercicio se busca una vez: la fatiga lo pide por cada serie.
  const mejores = new Map<string, number | null>();
  const unoRM = (ejercicio: string) => {
    const k = sinTildes(ejercicio);
    if (!mejores.has(k)) mejores.set(k, mejorE1rm(previas, ejercicio));
    return mejores.get(k)!;
  };
  // Para la fatiga alcanzan las últimas 3 semanas: lo de antes ya no pesa nada (la constante más
  // larga es de 54 horas).
  const recientes = previas.filter((x) => x.inicio > en - 21 * DIA);
  const residual = (m: Musculo) => residualDe(m, recientes, en, { unoRM });
  const musculos: MusculoDeHoy[] = soloSueno ? [] : (Object.keys(GRUPOS_DE_MUSCULOS) as GrupoDeMusculos[]).map((grupo) => {
    const lista = GRUPOS_DE_MUSCULOS[grupo] as readonly Musculo[];
    const peor = lista.reduce((a, b) => (residual(b) > residual(a) ? b : a));
    const r = residual(peor);
    return { grupo, residual: r, estado: estadoDe(r), listo: listoEn(peor, recientes, en, { unoRM }) };
  });

  // La de hoy o, si todavía no entrenó, la última de las 4 semanas anteriores en este día de la semana.
  const referencia = laDeHoy ?? [...previas].reverse().find((x) => diaDeLaSemana(x.fecha) === diaDeLaSemana(hoy) && x.fecha >= sumarDias(hoy, -28)) ?? null;
  const bloque = referencia?.bloques.find((b) => b.series.length && musculosDe(b.ejercicio, b.grupo)) ?? null;
  const musc = bloque ? musculosDe(bloque.ejercicio, bloque.grupo) : null;
  let rendimiento: RendimientoDeHoy | null = null;
  let marca: MarcaPosible | null = null;
  if (referencia && bloque && musc) {
    const seriesDe = (de: readonly Musculo[], desde: number, hasta: number) =>
      conBloques.filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
        const dosis = dosisDeLaSesion(x, unoRM);
        return t + de.reduce((u, m) => u + (dosis.get(m)?.series ?? 0), 0);
      }, 0);
    const conEllos = previas.filter((x) => musc.principal.some((m) => (dosisDeLaSesion(x, unoRM).get(m)?.series ?? 0) > 0));
    const ultima = conEllos[conEllos.length - 1] ?? null;
    const conElEjercicio = previas.filter((x) => x.bloques.some((b) => mismo(b.ejercicio, bloque.ejercicio)));
    const ultimoDelEjercicio = conElEjercicio[conElEjercicio.length - 1] ?? null;
    const ultimoBloque = ultimoDelEjercicio?.bloques.find((b) => mismo(b.ejercicio, bloque.ejercicio)) ?? null;
    const habitual = habitualDe(noches, hoy);
    const ultimas3 = [0, 1, 2].flatMap((k) => noches.filter((n) => n.clave === sumarDias(hoy, -k)).map((n) => n.dormido));
    const deuda = deudaDeSueno(ultimasNoches(noches, hoy, 14), sueno.necesidad);
    const comidoAyer = totalDelDia(e.registros.values(), ayer, false);
    const pesoKg = persona.deEjemplo ? e.pesos[e.pesos.length - 1]?.kg ?? 70 : persona.pesoHoy ?? 70;
    const t = persona.deEjemplo ? null : persona.tendencia;
    const baja = (dias: number) => {
      const a = t?.get(sumarDias(hoy, -dias)), b = t?.get(sumarDias(hoy, -dias - 7));
      return a !== undefined && b !== undefined ? ((b - a) / pesoKg) * 100 : null;
    };
    const bajaSemanal = baja(0);
    const ayerSesion = conBloques.find((x) => x.fecha === ayer);
    const semanaSeries = seriesDe(musc.principal, en - 7 * DIA, en);
    const mes = seriesDe(musc.principal, en - 35 * DIA, en - 7 * DIA) / 4;
    const r = rendimientoEsperado({
      sueno: anoche
        ? {
          dormido: anoche.dormido, necesidad: sueno.necesidad,
          despertoAntes: !!habitual && anoche.despertar < habitual.despertar - 60,
          seAcostoTarde: !!habitual && anoche.dormirse > habitual.dormirse + 60,
          siesta: anoche.siestas >= 20, sinReloj: !!anoche.moss,
        }
        : null,
      ultimas3, deuda: deuda ? deuda.minutos : null, cara: e.noches.get(hoy)?.cara ?? null,
      multiarticular: musc.multiarticular, tren: musc.principal.some((m) => DE_PIERNAS.includes(m)) ? 'inferior' : 'superior',
      horaHabitual: e.entreno?.hora ?? null,
      comida: {
        ayuno8h: false,
        sesionLarga: (laDeHoy ? d.sesiones.find((s) => s.fecha === hoy)?.minutos ?? 0 : d.sesiones.find((s) => s.fecha === referencia.fecha)?.minutos ?? 0) > 45,
        carbosAyerPorKilo: comidoAyer.kcal > 0 ? comidoAyer.carbohidratos / pesoKg : null,
        mismosMusculosAyer: !!ayerSesion && musc.principal.reduce((s, m) => s + (dosisDeLaSesion(ayerSesion, unoRM).get(m)?.series ?? 0), 0) >= 10,
        bajaSemanal, semanasBajando: bajaSemanal !== null && bajaSemanal > 1 && (baja(7) ?? 0) > 1 ? 2 : 1,
        kcalAyer: comidoAyer.kcal > 0 && metaAyer ? comidoAyer.kcal / metaAyer.kcal : null,
      },
      residual: Math.max(...musc.principal.map(residual)),
      descarga: {
        diasSinSeriesDuras: ultima ? Math.floor((en - ultima.inicio) / DIA) : 99,
        seriesSemanaSobreMes: mes ? semanaSeries / mes : null,
        intensidadMantenida: !!ultimoBloque && ultimoBloque.series.some((x) => x.peso >= 0.85 * (unoRM(bloque.ejercicio) ?? Infinity)),
        diasSinElEjercicio: ultimoDelEjercicio ? Math.floor((en - ultimoDelEjercicio.inicio) / DIA) : 0,
      },
      entrenado: true,
    });
    const primera = conBloques[0]?.fecha ?? hoy;
    const semanas = Math.max(1, Math.round(diasEntre(primera, hoy) / 7));
    const prs = d.marcas.filter((m) => mismo(m.ejercicio, bloque.ejercicio));
    const delEjercicio = conElEjercicio.length;
    const desdeElEjercicio = conElEjercicio[0]?.fecha ?? hoy;
    const seguridad = seguridadDeMarcas({ marcas: prs.length, sesiones: delEjercicio, semanas: Math.floor(diasEntre(desdeElEjercicio, hoy) / 7), leGanaALaGeneral: false });
    const sesionRef = d.sesiones.find((s) => s.fecha === referencia.fecha);
    rendimiento = {
      r, deHoy: !!laDeHoy, grupos: sesionRef ? gruposDeLaSesion(sesionRef) : [], dia: diaDeLaSemana(hoy),
      musculo: grupoDelMusculo(musc.principal[0]), anoche, seguridad, semanas,
    };
    if (prs.length) {
      const mejor = prs.reduce((a, b) => (b.kilos * (1 + b.reps / 30) > a.kilos * (1 + a.reps / 30) ? b : a));
      const dia = buenDiaParaMarca({
        marca: mejor.reps <= 1 ? mejor.kilos : mejor.kilos * (1 + mejor.reps / 30),
        mejorReciente: mejorE1rm(recientes, bloque.ejercicio),
        marcaEn8Semanas: prs.some((m) => m.fecha > sumarDias(hoy, -56)),
        recuperado: Math.max(...musc.principal.map(residual)) < 3,
        dormido: anoche ? anoche.dormido : null,
        despertoAntes: !!anoche && !!habitual && anoche.despertar < habitual.despertar - 60,
        ultimas3, seriesSemanaSobreMes: mes ? semanaSeries / mes : null, ayunoSesionLarga: false,
        bajandoRapido: bajaSemanal !== null && bajaSemanal > 1, deltaMax: r.max, sigma: r.sigma,
      });
      const avisos = d.avisos.filter((a) => mismo(a.ejercicio, bloque.ejercicio) && a.fecha < hoy);
      marca = {
        ...dia, ejercicio: bloque.ejercicio, grupo: grupoDelMusculo(musc.principal[0]),
        dias: ultima ? Math.floor((en - ultima.inicio) / DIA) : 0,
        veces: avisos.length, acerto: avisos.filter((a) => prs.some((m) => m.fecha === a.fecha)).length,
        seguridad, marcas: prs.length, semanas: Math.max(1, Math.round(diasEntre(prs.reduce((a, b) => (b.fecha < a.fecha ? b : a)).fecha, hoy) / 7)), anoche,
      };
    }
  }

  // ---------------------------------------------------------------- por qué no subes
  const estancado = soloSueno ? null : estancamiento(d.marcas, hoy);
  const nochesPorDia = nochesDe(d, sueno);
  const comidas = comidasDe(e);
  let porQue: PorQueNoSubes = { estancado: null };
  if (estancado) {
    const { con, sin } = semanasParaComparar(d.marcas, estancado, hoy, e.metas[0]?.desde ?? hoy);
    const gasto = (lunes: ClaveDia) => metaVigente(e, sumarDias(lunes, 3))?.gasto ?? persona.gasto ?? 0;
    porQue = {
      estancado,
      r: porQueNoSube(con.map((l) => semanaDesde(l, nochesPorDia, comidas, gasto(l))), sin.map((l) => semanaDesde(l, nochesPorDia, comidas, gasto(l)))),
    };
  }

  // ---------------------------------------------------------------- tu año
  const anio = Number(hoy.slice(0, 4));
  const empezo = e.metas[0]?.desde ?? hoy;
  const desde = `${anio}-01-01` > empezo ? `${anio}-01-01` : empezo;

  return {
    hoy: hoyEnAscent,
    gimnasio: { habito: e.habitos.find((h) => h.fuente.tipo === 'ascent' && (!h.hasta || h.hasta >= hoy)) ?? null, dias: diasDeEntrenar(d.sesiones, hoy) },
    recuperacion: rec,
    rendimiento,
    musculos,
    marca,
    porQue,
    anio: { ...tuAnio({ anio, sesiones: d.sesiones, marcas: d.marcas, dias: e.dias.values(), noches: nochesPorDia, diasConComida: comidas.keys() }), desde },
  };
}

