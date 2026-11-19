// El estancamiento y sus razones (spec/ascent.md, «Ascent en Progreso», para aprobar), revisado con la
// evidencia el 5/11/2026 (spec/rendimiento.md, «Lo que cambió»).
// - Cuándo: la tendencia de 12 semanas dice «sin subida clara» con 8 semanas o más (tendenciaDeFuerza, en
//   rendimiento.ts), y nunca antes del umbral de Ascent (6 semanas sin marca, de fábrica). Con 3 semanas,
//   a quien sube un 1 % por mes le decía «estancado» el 63 % de las veces.
// - Las razones, de la más a la menos sólida, cada una solo con datos suficientes: lo primero es la dosis
//   (las series duras por semana y, para la fuerza, la frecuencia y la carga pesada: Pelland 2026; Lopez
//   2021; ACSM 2026); después, bajar rápido o estar en definición (Garthe 2011; Murphy y Koehler 2022), la
//   proteína contra 1,6 g por kilo (Morton 2018) y el sueño, que «puede influir» (Knowles 2018). Los años
//   de entrenamiento van aparte, de contexto (Latella 2020).
// Siempre una causa probable, no segura, dos o tres como mucho y con los números a la vista.

import { diasEntre, lunesDe, sumarDias, type ClaveDia } from './fechas';
import { DE_TRABAJO } from './puntajeMuscular';
import { claveDelEjercicio, dosisDeLaSesion, mejorDeLasSeries, type Bloque, type Musculo, type SesionConBloques, type UnoRMDe } from './musculos';
import { PESADA, REPS_PESADAS, type SemanaDeEntreno } from './progresoCompartido';

/** «Cuando subía»: las semanas antes de la mejor marca que se comparan con las de ahora. */
export const SEMANAS_ANTES = 6;

/** Las semanas (sus lunes) para comparar: las 6 de antes de la mejor marca, con ella, y las de después hasta esta. */
export function semanasParaLasRazones(mejor: ClaveDia, hoy: ClaveDia): { antes: ClaveDia[]; ahora: ClaveDia[] } {
  const lunes = lunesDe(mejor);
  const antes = Array.from({ length: SEMANAS_ANTES }, (_, i) => sumarDias(lunes, -7 * (SEMANAS_ANTES - 1 - i)));
  const ahora: ClaveDia[] = [];
  for (let l = sumarDias(lunes, 7); l <= lunesDe(hoy); l = sumarDias(l, 7)) ahora.push(l);
  return { antes, ahora };
}

/**
 * Lo de una semana, de lunes a domingo, con las sesiones de Ascent de esos días. Sin el 1RM de cada
 * ejercicio, el de la mejor serie de ese día: así la entrada en calor tampoco cuenta.
 */
export function semanaDeEntreno(
  sesiones: readonly (SesionConBloques & { fecha: ClaveDia })[],
  lunes: ClaveDia,
  ejercicio: Pick<Bloque, 'id' | 'ejercicio'>,
  musculo: Musculo,
  unoRM: UnoRMDe = (b) => mejorDeLasSeries(b.series),
): SemanaDeEntreno {
  const fin = sumarDias(lunes, 7);
  const deLaSemana = sesiones.filter((s) => s.fecha >= lunes && s.fecha < fin);
  const clave = claveDelEjercicio(ejercicio);
  let series = 0, veces = 0, pesadas = 0, conReps = 0;
  for (const s of deLaSemana) {
    series += dosisDeLaSesion(s, unoRM).get(musculo)?.series ?? 0;
    const bloques = s.bloques.filter((b) => claveDelEjercicio(b) === clave);
    if (bloques.length) veces++;
    for (const b of bloques) {
      const mejor = unoRM(b) ?? mejorDeLasSeries(b.series);
      for (const x of b.series) {
        if (x.reps === null || x.peso <= 0) continue;
        if (mejor && x.peso < DE_TRABAJO * mejor) continue;
        conReps++;
        if (x.reps <= REPS_PESADAS || (mejor !== null && x.peso >= PESADA * mejor)) pesadas++;
      }
    }
  }
  return { lunes, series, veces, pesadas, conReps };
}

/** Las sesiones de un ejercicio en puntos para la tendencia: la semana (desde `origen`) y el 1RM estimado de su mejor serie. */
export function puntosDelEjercicio(sesiones: readonly (SesionConBloques & { fecha: ClaveDia })[], ejercicio: Pick<Bloque, 'id' | 'ejercicio'>, origen: ClaveDia): { t: number; e1rm: number; fecha: ClaveDia }[] {
  const clave = claveDelEjercicio(ejercicio);
  return sesiones.flatMap((s) => {
    const mejor = s.bloques.filter((b) => claveDelEjercicio(b) === clave).reduce<number | null>((m, b) => {
      const v = mejorDeLasSeries(b.series);
      return v !== null && (m === null || v > m) ? v : m;
    }, null);
    return mejor === null ? [] : [{ t: diasEntre(origen, s.fecha) / 7, e1rm: mejor, fecha: s.fecha }];
  });
}
