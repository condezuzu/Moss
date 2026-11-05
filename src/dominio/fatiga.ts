// La fatiga muscular (spec/ascent.md, «Ascent en Progreso», para aprobar): lo que les falta a los músculos
// para volver a lo suyo (residual() de musculos.ts) y los músculos de cada día de la rutina de Ascent con
// cómo están ahora. Se dice en palabras (descansado, recuperándose o cargado) y en días, nunca en horas ni
// en %: el modelo erra de más o menos un día contra los estudios (spec/rendimiento.md, «Por músculo»). El
// índice de 0 a 100 queda solo para el número de antes («Estás 87 % recuperado»), mientras se decide.

import { cuandoListo, estadoDe, listoEn, MUSCULOS, musculosDe, peorEstado, residual, type Cuando, type EstadoMuscular, type Musculo, type OpcionesDelResidual, type RefDeEjercicio, type SesionConBloques } from './musculos';
import type { DiaSemana } from './fechas';

/** Lo más que deja una sesión en un músculo (caidaInicial() con muchísimas series): es el 100 % de la fatiga. */
export const FATIGA_TOPE = 30;
/** Sin sesión hoy, la fatiga mira los músculos que fueron principales en los últimos 3 días. */
export const DIAS_SIN_SESION = 3;

const DIA = 86_400_000;

export type Ejercicio = RefDeEjercicio & { ejercicio?: string };

/** El promedio de lo que les falta a unos músculos, sobre lo más que deja una sesión: de 0 a 100, sin decimales. */
export function indiceDeFatiga(residuales: readonly number[]): number {
  if (!residuales.length) return 0;
  const promedio = residuales.reduce((s, r) => s + r, 0) / residuales.length;
  return Math.round(Math.min(100, Math.max(0, (promedio / FATIGA_TOPE) * 100)));
}

/** Los músculos principales de unos ejercicios, sin repetir, en el orden de MUSCULOS (las piernas primero). */
export function musculosPrincipales(ejercicios: readonly Ejercicio[]): Musculo[] {
  const usados = new Set<Musculo>();
  for (const e of ejercicios) (musculosDe(e)?.principal ?? []).forEach((m) => usados.add(m));
  return MUSCULOS.filter((m) => usados.has(m));
}

/**
 * Los músculos que cuentan hoy: los principales de la sesión de hoy o, sin sesión, los que fueron
 * principales en las sesiones de los 3 días anteriores a `en`.
 */
export function musculosParaLaFatiga(p: { deHoy: readonly Ejercicio[] | null; sesiones: readonly SesionConBloques[]; en: number }): Musculo[] {
  if (p.deHoy && p.deHoy.length) return musculosPrincipales(p.deHoy);
  const recientes = p.sesiones.filter((s) => s.inicio < p.en && s.inicio >= p.en - DIAS_SIN_SESION * DIA);
  return musculosPrincipales(recientes.flatMap((s) => s.bloques));
}

/** Las sesiones de antes de un momento: la que empieza justo ahí todavía no cansó a nadie. */
const antesDe = (sesiones: readonly SesionConBloques[], en: number) => sesiones.filter((s) => s.inicio < en);

export type Opciones = OpcionesDelResidual & {
  /** La hora del momento que se mira, en minutos desde la medianoche: para decir «mañana» y no «en 20 h». */
  minuto?: number;
};
export type MusculoAhora = { musculo: Musculo; residual: number; estado: EstadoMuscular; listo: number | null; cuando: Cuando };

/** Cómo está un músculo en un momento: lo que le falta (por dentro), la palabra y cuándo va a estar listo. */
function ahora(musculo: Musculo, sesiones: readonly SesionConBloques[], en: number, o: Opciones): MusculoAhora {
  const r = residual(musculo, sesiones, en, o);
  const listo = listoEn(musculo, sesiones, en, o);
  return { musculo, residual: r, estado: estadoDe(r), listo, cuando: cuandoListo(listo, o.minuto ?? 12 * 60) };
}

/** La fatiga en un momento: el índice, cada músculo y el peor estado (null sin músculos). */
export function fatigaMuscular(p: { musculos: readonly Musculo[]; sesiones: readonly SesionConBloques[]; en: number } & Opciones) {
  const sesiones = antesDe(p.sesiones, p.en);
  const musculos = p.musculos.map((musculo) => ahora(musculo, sesiones, p.en, p));
  return { indice: indiceDeFatiga(musculos.map((m) => m.residual)), musculos, peor: peorEstado(musculos.map((m) => m.estado)) };
}

/** Todos los músculos en un momento, para el cuerpo dibujado: los que ya están, también. */
export function todosLosMusculos(p: { sesiones: readonly SesionConBloques[]; en: number } & Opciones): MusculoAhora[] {
  const sesiones = antesDe(p.sesiones, p.en);
  return MUSCULOS.map((m) => ahora(m, sesiones, p.en, p));
}

export type DiaDeRutina = { dia: DiaSemana; nombre: string; ejercicios: readonly Ejercicio[] };
export type MusculoDelDia = MusculoAhora;
export type FatigaDelDia = { dia: DiaSemana; nombre: string; hoy: boolean; musculos: MusculoDelDia[]; peor: EstadoMuscular | null };

/**
 * Cada día de la rutina, con sus músculos principales y cómo están ahora: primero hoy y después los que
 * siguen en la semana. Así, si ayer hiciste tríceps y mañana toca bíceps, se ve que el bíceps está bien.
 */
export function fatigaPorDia(p: { rutina: readonly DiaDeRutina[]; hoy: DiaSemana; sesiones: readonly SesionConBloques[]; en: number } & Opciones): FatigaDelDia[] {
  const cache = new Map<Musculo, MusculoDelDia>();
  const sesiones = antesDe(p.sesiones, p.en);
  const estado = (musculo: Musculo): MusculoDelDia => {
    const visto = cache.get(musculo);
    if (visto) return visto;
    const m = ahora(musculo, sesiones, p.en, p);
    cache.set(musculo, m);
    return m;
  };
  const desdeHoy = (d: DiaSemana) => (d - p.hoy + 7) % 7;
  return [...p.rutina]
    .filter((d) => d.ejercicios.length > 0)
    .sort((a, b) => desdeHoy(a.dia) - desdeHoy(b.dia))
    .map((d) => {
      const musculos = musculosPrincipales(d.ejercicios).map(estado);
      return { dia: d.dia, nombre: d.nombre, hoy: d.dia === p.hoy, musculos, peor: peorEstado(musculos.map((m) => m.estado)) };
    });
}
