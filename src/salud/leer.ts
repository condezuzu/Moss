// Leer Salud al abrir la app y al volver (spec/plan.md, etapa 8; spec/sueno.md): lo de hoy para los
// hábitos que se encienden solos (pasos, agua, atención plena y lo dormido anoche), las noches de las
// últimas cuatro semanas con lo que mide el reloj, y el peso. Solo si ya se pidió Salud: leer un
// tipo que no se pidió cierra la app. Lo que falla vuelve vacío: nunca se inventa.

import {
  queryCategorySamples, queryQuantitySamples, queryStatisticsForQuantity, type CategoryTypeIdentifier, type QuantityTypeIdentifier,
} from '@kingstinct/react-native-healthkit';

import { claveDelDia } from '@/dominio/fechas';
import { armarNoches, soloEnCama } from '@/dominio/sueno';
import { fuentesDe, lecturasDe, minutosDe, muestraDeSueno, pasosDe, ultimaPorDia, type DeSalud, type LoDeSalud } from './convertir';
import { saludPedida } from './salud';

const DIA_MS = 86_400_000;

async function suma(id: QuantityTypeIdentifier, unidad: string, desde: Date, hasta: Date): Promise<number | null> {
  try {
    // La unidad depende del tipo: la librería la tipa por identificador.
    const r = await queryStatisticsForQuantity(id, ['cumulativeSum'], { filter: { date: { startDate: desde, endDate: hasta } }, unit: unidad as never });
    return r.sumQuantity?.quantity ?? null;
  } catch {
    return null;
  }
}

async function cantidades(id: QuantityTypeIdentifier, unidad: string, desde: Date, hasta: Date): Promise<DeSalud[]> {
  try {
    return (await queryQuantitySamples(id, { limit: 0, filter: { date: { startDate: desde, endDate: hasta } }, unit: unidad as never })) as unknown as DeSalud[];
  } catch {
    return [];
  }
}

async function categoria(id: CategoryTypeIdentifier, desde: Date, hasta: Date): Promise<DeSalud[]> {
  try {
    return (await queryCategorySamples(id, { limit: 0, filter: { date: { startDate: desde, endDate: hasta } } })) as unknown as DeSalud[];
  } catch {
    return [];
  }
}

/** Todo lo de Salud que usa Moss, o null si Salud no se pidió en este teléfono. */
export async function leerSalud(ahora: Date = new Date()): Promise<LoDeSalud | null> {
  if (!(await saludPedida())) return null;
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const hace = (dias: number) => new Date(hoy.getTime() - dias * DIA_MS);
  // Las noches empiezan a las 18 del día anterior.
  const desdeLasNoches = new Date(hace(28).getTime() - 6 * 3_600_000);
  const [pasos, agua, mindful, sueno, frecuencia, variabilidad, respiracion, reposo, pesos, recientes] = await Promise.all([
    suma('HKQuantityTypeIdentifierStepCount', 'count', hoy, ahora),
    suma('HKQuantityTypeIdentifierDietaryWater', 'mL', hoy, ahora),
    categoria('HKCategoryTypeIdentifierMindfulSession', hoy, ahora),
    categoria('HKCategoryTypeIdentifierSleepAnalysis', desdeLasNoches, ahora),
    cantidades('HKQuantityTypeIdentifierHeartRate', 'count/min', hace(21), ahora),
    cantidades('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'ms', hace(21), ahora),
    cantidades('HKQuantityTypeIdentifierRespiratoryRate', 'count/min', hace(21), ahora),
    cantidades('HKQuantityTypeIdentifierRestingHeartRate', 'count/min', hace(28), ahora),
    cantidades('HKQuantityTypeIdentifierBodyMass', 'kg', hace(60), ahora),
    // Sin reloj, los pasos de la noche y la mañana dicen cuándo estabas despierto (src/dominio/sinReloj.ts).
    cantidades('HKQuantityTypeIdentifierStepCount', 'count', new Date(ahora.getTime() - 30 * 3_600_000), ahora),
  ]);
  const muestras = sueno.flatMap((m) => muestraDeSueno(m) ?? []);
  const fuentes = fuentesDe(sueno);
  const noches = armarNoches(muestras, fuentes);
  const clave = claveDelDia(ahora);
  const anoche = noches.find((n) => n.clave === clave);
  return {
    dia: clave,
    valores: {
      ...(pasos !== null ? { pasos: Math.round(pasos) } : {}),
      ...(agua !== null ? { agua: Math.round(agua) } : {}),
      mindfulness: minutosDe(mindful),
      ...(anoche ? { sueno: anoche.dormido } : {}),
    },
    noches,
    soloEnCama: soloEnCama(muestras, fuentes, noches),
    fuentes,
    lecturas: { frecuencia: lecturasDe(frecuencia), variabilidad: lecturasDe(variabilidad), respiracion: lecturasDe(respiracion), reposo: ultimaPorDia(reposo) },
    pesos: ultimaPorDia(pesos),
    pasosRecientes: pasosDe(recientes),
  };
}
