// Tu energía de ahora con lo del almacén (spec/entreno.md 5.13): arma lo que piden energiaDeEstosDias y
// energiaDeAhora (src/dominio/energia.ts) con el sueño, lo anotado estos días y hoy, y la hora. Sin Ascent
// es la de tu día: sin la sesión ni los músculos. La usan Sueño (la tarjeta) e Inicio (el botón).

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
import { deudaDeSueno, juicioDeLaDeuda, ultimasNoches } from '@/dominio/sueno';
import { horasDeComida, suenoParaAvisos } from '@/recordatorios/programar';
import { metaDelDia } from '../comida/datos';
import type { Sueno } from '../persona';

export type ComidaDelDia = { comida: Comida; hora: number; anotada: boolean };

export type DatosDeEnergia = {
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
  /** Lo dormido anoche, para «De dónde sale». */
  dormido: number | null;
};

/**
 * Lo que suma entrenar ese día con lo de Perfil › Entrenamiento: el MET menos el de reposo, por kilo y por hora
 * (como kcalDelDia en cuestionario.ts). La sesión mixta cuenta como la de pesas: el Compendio no tiene un MET para
 * la mezcla, y quedarse corto no inventa energía baja.
 */
function kcalDeEntrenar(entreno: Estado['entreno'], dia: ClaveDia, pesoKg: number): number {
  if (!entreno || !entreno.dias.includes(diaDeLaSemana(dia)) || !(pesoKg > 0)) return 0;
  const met = entreno.tipo === 'resistencia' ? MET_DEL_DEPORTE.resistencia : MET_DE_LA_SESION;
  return (met - MET_EN_REPOSO) * pesoKg * (entreno.minutos / 60);
}

/** Tu energía de ahora; sin cuestionario, null (no hay con qué). */
export function energiaDeHoy(e: Estado, s: Sueno, ahora: Date): DatosDeEnergia | null {
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
      entreno: pesoKg ? kcalDeEntrenar(e.entreno, dia, pesoKg) : 0,
      anotadas: new Set(delDia.map((r) => r.comida)).size,
      meta: metaDelDia(e, dia)?.kcal,
    };
  });
  const deEstosDias = pesoKg
    ? energiaDeEstosDias({
        hoy, sexo: e.perfil.sexo, objetivo: e.perfil.objetivo, pesoKg, alturaCm: e.perfil.alturaCm, dias,
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
  const dia = energiaDeAhora({
    deEstosDias, sueno, musculos: null, entrenaHoy: false, ahora: ahoraMin, despertar, cama, sesion: null,
    hoy: meta > 0 ? { meta, comido: deHoy.reduce((t, r) => t + r.valores.kcal, 0), comidas, ultima } : null,
  });
  return {
    dia,
    ahora: ahoraMin,
    despertar,
    cama,
    comidas: comidas.map(({ comida, hora, anotada }) => ({ comida, hora, anotada })),
    noche: horas && horas.acostarse !== null && horas.despertarManana !== null
      ? { hora: horaDeReloj(horas.acostarse), despertar: horaDeReloj(horas.despertarManana), cama: horaDeReloj(horas.acostarse) }
      : null,
    dormido: anoche ? anoche.dormido : null,
  };
}
