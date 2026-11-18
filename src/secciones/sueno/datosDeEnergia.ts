// Tu energía de ahora con lo del almacén (spec/entreno.md 5.13): arma lo que piden energiaDeEstosDias y
// energiaDeAhora (src/dominio/energia.ts) con el sueño, lo anotado estos días y hoy, y la hora. Sin Ascent
// es la de tu día: sin la sesión ni los músculos. Con Ascent vinculada, la capa del gimnasio: el titular de hoy
// de su sección (los músculos) y su sesión. La usan Sueño (la tarjeta) e Inicio (el botón).

import type { Estado } from '@/almacen/almacen';
import { comidasHabituales } from '@/dominio/alrededorDelEntreno';
import { horaDeReloj, horasDeSueno } from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { MET_DEL_DEPORTE } from '@/dominio/cuestionario';
import { energiaDeAhora, energiaDeEstosDias, type EnergiaDeAhora } from '@/dominio/energia';
import { MET_DE_LA_SESION, MET_EN_REPOSO } from '@/dominio/entrenamiento';
import { diaDeLaSemana, minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { comidasDelPlan, REPARTO } from '@/dominio/plan';
import { vigentes } from '@/dominio/registros';
import { estadoDeLaNoche, nochesCortasSeguidas } from '@/dominio/rendimiento';
import { deudaDeSueno, juicioDeLaDeuda, redondearDeuda, ultimasNoches } from '@/dominio/sueno';
import { horasDeComida, suenoParaAvisos } from '@/recordatorios/programar';
import { cuentaComoEntrenar, entrenosDelDia } from '@/salud/convertir';
import type { TitularParaAfuera } from '../ascent/titularDeHoy';
import { metaDelDia } from '../comida/datos';
import type { Sueno } from '../persona';

export type ComidaDelDia = { comida: Comida; hora: number; anotada: boolean };
/** Cómo se dicen los músculos: cargados o listos, o, sin sesión por delante, si ya entrenaste o descansas. */
export type ComoMusculos = 'cargados' | 'listos' | 'entrenaste' | 'descanso';

export type DatosDeEnergia = {
  /** Con Ascent vinculada, el titular de hoy de su sección; sin vincular, null. */
  ascent: TitularParaAfuera | null;
  comoMusculos: ComoMusculos | null;
  /** La energía de ahora; sin el sueño ni la comida de estos días, null («Tu energía» con cómo verla). */
  dia: EnergiaDeAhora | null;
  /** Ahora, despertarte y la cama de esta noche, en minutos desde la medianoche del día de Moss. */
  ahora: number;
  despertar: number | null;
  cama: number | null;
  /** Las comidas de siempre, con su hora y si ya se anotaron hoy: para la tira del día. */
  comidas: ComidaDelDia[];
  /** Esta noche, como la dicen los avisos: la hora de ir a la cama y la de despertarte. */
  noche: { hora: string; despertar: string; cama: string } | null;
  /** Lo dormido anoche, lo que necesitas y la deuda como se dice (a la media hora), para explicar el sueño. */
  dormido: number | null;
  necesidad: number;
  deuda: number | null;
};

/**
 * Lo que suma entrenar ese día con lo de Perfil › Entrenamiento: el MET menos el de reposo, por kilo y por hora
 * (como kcalDelDia en cuestionario.ts). La sesión mixta cuenta como la de pesas: el Compendio no tiene un MET para
 * la mezcla, y quedarse corto no inventa energía baja.
 */
function kcalDeEntrenar(entreno: Estado['entreno'], dia: ClaveDia, pesoKg: number): number {
  if (!entreno || !entreno.dias.includes(diaDeLaSemana(dia)) || !(pesoKg > 0)) return 0;
  return kcalDeUnaSesion(entreno, pesoKg, entreno.minutos);
}
const kcalDeUnaSesion = (entreno: Estado['entreno'], pesoKg: number, minutos: number) =>
  ((entreno?.tipo === 'resistencia' ? MET_DEL_DEPORTE.resistencia : MET_DE_LA_SESION) - MET_EN_REPOSO) * pesoKg * (minutos / 60);

/**
 * Lo de entrenar de un día con los entrenamientos de Salud (18/11/2026): sus calorías activas o, si no vienen, las
 * de la sesión con su duración. Si Salud tiene entrenamientos de estas dos semanas, es lo que pasó: un día sin
 * ninguno no se entrenó. Si no tiene ninguno (sin reloj, o sin pedirlos todavía), lo de Perfil › Entrenamiento.
 */
function kcalDelDia(e: Estado, dia: ClaveDia, pesoKg: number): number {
  const deSalud = e.salud?.entrenamientos ?? [];
  if (!deSalud.some(cuentaComoEntrenar)) return kcalDeEntrenar(e.entreno, dia, pesoKg);
  return entrenosDelDia(deSalud, dia).reduce((t, x) => t + (x.kcal ?? kcalDeUnaSesion(e.entreno, pesoKg, x.minutos)), 0);
}

/** Tu energía de ahora; sin cuestionario, null (no hay con qué). */
export function energiaDeHoy(e: Estado, s: Sueno, ahora: Date, ascent: TitularParaAfuera | null = null): DatosDeEnergia | null {
  if (!e.perfil) return null;
  const hoy = e.hoy;
  const pesoKg = e.pesos[e.pesos.length - 1]?.kg ?? null;
  // Las noches de ejemplo no son tuyas: no cuentan.
  const noches = s.deEjemplo ? [] : s.noches;
  const anoche = noches.find((n) => n.clave === hoy) ?? null;
  const dos = ultimasNoches(noches, hoy, 14);
  const d = deudaDeSueno(dos, s.necesidad);
  const tres = dos.slice(-3).flatMap((n) => (n ? [n.dormido] : []));
  const sueno = noches.length
    ? {
        anoche: anoche ? estadoDeLaNoche({ dormido: anoche.dormido, necesidad: s.necesidad, despertoAntes: null }) : null,
        seguidas: nochesCortasSeguidas(tres),
        deuda: d ? juicioDeLaDeuda(d) : null,
      }
    : null;

  const registros = vigentes(e.registros.values()).filter((r) => !r.planificado);
  const dias = Array.from({ length: 7 }, (_, i) => {
    const dia = sumarDias(hoy, -(i + 1));
    const delDia = registros.filter((r) => r.dia === dia);
    return {
      dia,
      kcal: delDia.reduce((t, r) => t + r.valores.kcal, 0),
      entreno: pesoKg ? kcalDelDia(e, dia, pesoKg) : 0,
      anotadas: new Set(delDia.map((r) => r.comida)).size,
      meta: metaDelDia(e, dia)?.kcal,
    };
  });
  const deEstosDias = pesoKg
    ? energiaDeEstosDias({
        hoy, sexo: e.perfil.sexo, objetivo: e.perfil.objetivo, pesoKg, alturaCm: e.perfil.alturaCm, dias, entrenaHoy: !!ascent,
        comidasDeSiempre: comidasHabituales(e.registros.values(), hoy),
      })
    : null;

  const ahoraMin = minutosEnElDia(ahora, hoy);
  const avisos = suenoParaAvisos(e);
  const horas = avisos ? horasDeSueno(hoy, avisos) : null;
  // Con la noche de anoche, la hora en que te despertaste de verdad; si no, la de siempre.
  const despertar = anoche ? anoche.despertar - 6 * 60 : (horas?.despertar ?? null);
  const cama = horas?.acostarse ?? null;
  const n = comidasHabituales(e.registros.values(), hoy);
  const deSiempre = horasDeComida(e);
  const deHoy = registros.filter((r) => r.dia === hoy);
  const comidas = comidasDelPlan(n).map((c) => ({ comida: c, hora: deSiempre(c), parte: REPARTO[n][c] ?? 0, anotada: deHoy.some((r) => r.comida === c) }));
  const meta = metaDelDia(e, hoy)?.kcal ?? 0;
  const ultima = deHoy.length ? Math.max(...deHoy.map((r) => minutosEnElDia(new Date(r.momento), hoy))) : null;
  // Un entrenamiento de Salud de hoy: las 2 h de después son «Ya entrenaste: ahora toca recuperar», con comer
  // después. `entrenaHoy` sigue en no: sus frases son de antes de entrenar («todo a favor para entrenar»).
  const ultimoDeHoy = entrenosDelDia(e.salud?.entrenamientos, hoy).at(-1);
  // Hasta que terminó, con las pausas: de ahí cuentan las 2 h de después.
  const deSalud = ultimoDeHoy ? { inicio: minutosEnElDia(new Date(ultimoDeHoy.desde), hoy), minutos: Math.round((ultimoDeHoy.hasta - ultimoDeHoy.desde) / 60_000) } : null;
  // Con Ascent, su sesión de hoy (la que se espera o la hecha) y los músculos, como en la galería: lo que no está
  // cargado cuenta como listo, también si ya entrenaste o hoy descansas.
  const sesion = ascent?.sesion ? { inicio: ascent.sesion.inicio, minutos: ascent.sesion.minutos } : deSalud;
  const musculos = ascent ? (ascent.que === 'cargado' ? 'cargados' : 'listos') : null;
  const comoMusculos: ComoMusculos | null = !ascent ? null
    : ascent.que === 'cargado' ? 'cargados' : ascent.que === 'hecha' ? 'entrenaste' : ascent.que === 'descanso' || ascent.que === 'sinHorario' ? 'descanso' : 'listos';
  const dia = energiaDeAhora({
    deEstosDias, sueno, musculos, entrenaHoy: !!ascent, ahora: ahoraMin, despertar, cama, sesion,
    hoy: meta > 0 ? { meta, comido: deHoy.reduce((t, r) => t + r.valores.kcal, 0), comidas, ultima } : null,
  });
  return {
    ascent,
    comoMusculos,
    dia,
    ahora: ahoraMin,
    despertar,
    cama,
    comidas: comidas.map(({ comida, hora, anotada }) => ({ comida, hora, anotada })),
    noche: horas && horas.acostarse !== null && horas.despertarManana !== null
      ? { hora: horaDeReloj(horas.acostarse), despertar: horaDeReloj(horas.despertarManana), cama: horaDeReloj(horas.acostarse) }
      : null,
    dormido: anoche ? anoche.dormido : null,
    necesidad: s.necesidad,
    deuda: sueno && d ? redondearDeuda(d.minutos) : null,
  };
}
