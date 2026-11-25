// Leer Salud al abrir la app y al volver (spec/plan.md, etapa 8; spec/sueno.md): lo de hoy y de ayer para los
// hábitos que se encienden solos (pasos, agua, atención plena y lo dormido anoche), las noches de las
// últimas cuatro semanas con lo que mide el reloj, el peso y los entrenamientos. Solo si ya se pidió Salud: leer un
// tipo que no se pidió cierra la app. Lo que falla vuelve vacío: nunca se inventa. Si falla el sueño (con el iPhone
// bloqueado Salud no deja leer nada), no se devuelve nada: un día vacío pisaría lo leído antes.

import {
  queryCategorySamples, queryQuantitySamples, queryStatisticsForQuantity, queryWorkoutSamples, type CategoryTypeIdentifier, type QuantityTypeIdentifier,
} from '@kingstinct/react-native-healthkit';

import { promedioDePasos } from '@/dominio/cuestionario';
import { CORTE_DE_FABRICA, diaLogico, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { armarNoches, soloEnCama } from '@/dominio/sueno';
import { entrenoDeSalud, fuentesDe, lecturasDe, minutosDe, muestraDeSueno, pasosDe, primeraPorDia, ultimaPorDia, type DeSalud, type DeSaludEntreno, type LoDeSalud } from './convertir';
import { entrenamientosPedidos, saludPedida } from './salud';

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

/**
 * Las lecturas de una cantidad solo mientras se dormía: de todo el día serían miles por día con un
 * reloj, y solo se miran las de la noche (vitalDeNoche).
 */
async function deLasNoches(id: QuantityTypeIdentifier, unidad: string, ventanas: [number, number][]): Promise<DeSalud[]> {
  if (!ventanas.length) return [];
  const fechas = ventanas.map(([a, b]) => ({ date: { startDate: new Date(a), endDate: new Date(b) } }));
  try {
    return (await queryQuantitySamples(id, { limit: 0, filter: fechas.length === 1 ? fechas[0] : { OR: fechas }, unit: unidad as never })) as unknown as DeSalud[];
  } catch {
    return [];
  }
}

/** Las muestras de una categoría, o null si Salud no dejó leerlas (no es lo mismo que no haya ninguna). */
async function categoria(id: CategoryTypeIdentifier, desde: Date, hasta: Date): Promise<DeSalud[] | null> {
  try {
    return (await queryCategorySamples(id, { limit: 0, filter: { date: { startDate: desde, endDate: hasta } } })) as unknown as DeSalud[];
  } catch {
    return null;
  }
}

/** Los entrenamientos entre dos momentos, solo si ya se pidieron: leerlos sin pedirlos cierra la app. */
async function entrenamientos(desde: Date, hasta: Date): Promise<DeSaludEntreno[]> {
  if (!(await entrenamientosPedidos())) return [];
  try {
    return (await queryWorkoutSamples({ limit: 0, filter: { date: { startDate: desde, endDate: hasta } } })) as unknown as DeSaludEntreno[];
  } catch {
    return [];
  }
}

/**
 * Los pasos por día de las últimas dos semanas (sin hoy, que va por la mitad), para sugerir en el cuestionario
 * cuánto te mueves. Día por día y con la suma de Salud, que no cuenta dos veces lo del iPhone y lo del reloj.
 */
export async function pasosPorDia(ahora: Date = new Date(), dias = 14): Promise<number | null> {
  if (!(await saludPedida())) return null;
  const dia = (n: number) => new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - n);
  return promedioDePasos(await Promise.all(Array.from({ length: dias }, (_, i) => suma('HKQuantityTypeIdentifierStepCount', 'count', dia(i + 1), dia(i)))));
}

/** Los pasos de Salud entre dos momentos, muestra por muestra: para volver a estimar noches de días anteriores (rehacerLasNoches). Sin Salud, ninguno. */
export async function leerPasos(desde: Date, hasta: Date): Promise<LoDeSalud['pasosRecientes']> {
  if (!(await saludPedida())) return [];
  return pasosDe(await cantidades('HKQuantityTypeIdentifierStepCount', 'count', desde, hasta));
}

/**
 * Todo lo de Salud que usa Moss, o null si Salud no se pidió en este teléfono o no se pudo leer. `elegida` es el
 * aparato del que sale la noche, si se eligió en Perfil › Aparatos. Los valores del día son los del
 * día de Moss (D32), de corte a corte: a la 1 de la mañana, antes del corte, son los de ayer, el día que sigue.
 * También van los del día anterior, enteros.
 */
export async function leerSalud(ahora: Date = new Date(), elegida: string | null = null, corte = CORTE_DE_FABRICA): Promise<LoDeSalud | null> {
  if (!(await saludPedida())) return null;
  const clave = diaLogico(ahora, corte);
  const ayer = sumarDias(clave, -1);
  const p = partesDe(clave);
  const hoy = new Date(p.anio, p.mes, p.dia);
  const desde = new Date(p.anio, p.mes, p.dia, 0, corte);
  const desdeAyer = new Date(p.anio, p.mes, p.dia - 1, 0, corte);
  const hace = (dias: number) => new Date(hoy.getTime() - dias * DIA_MS);
  // Las noches empiezan a las 18 del día anterior.
  const desdeLasNoches = new Date(hace(28).getTime() - 6 * 3_600_000);
  const [pasos, agua, mindful, pasosAyer, aguaAyer, mindfulAyer, sueno, reposo, pesos, recientes, entrenos] = await Promise.all([
    suma('HKQuantityTypeIdentifierStepCount', 'count', desde, ahora),
    suma('HKQuantityTypeIdentifierDietaryWater', 'mL', desde, ahora),
    categoria('HKCategoryTypeIdentifierMindfulSession', desde, ahora),
    suma('HKQuantityTypeIdentifierStepCount', 'count', desdeAyer, desde),
    suma('HKQuantityTypeIdentifierDietaryWater', 'mL', desdeAyer, desde),
    categoria('HKCategoryTypeIdentifierMindfulSession', desdeAyer, desde),
    categoria('HKCategoryTypeIdentifierSleepAnalysis', desdeLasNoches, ahora),
    cantidades('HKQuantityTypeIdentifierRestingHeartRate', 'count/min', hace(28), ahora),
    cantidades('HKQuantityTypeIdentifierBodyMass', 'kg', hace(60), ahora),
    // Sin reloj, los pasos de la noche y la mañana dicen cuándo estabas despierto (src/dominio/sinReloj.ts).
    cantidades('HKQuantityTypeIdentifierStepCount', 'count', new Date(ahora.getTime() - 30 * 3_600_000), ahora),
    // Los entrenamientos de las dos semanas: cuentan como «entrenaste» y, con sus calorías, para tu energía.
    entrenamientos(hace(14), ahora),
  ]);
  if (!sueno) return null;
  const muestras = sueno.flatMap((m) => muestraDeSueno(m) ?? []);
  const fuentes = fuentesDe(sueno);
  const noches = armarNoches(muestras, fuentes, elegida ?? undefined);
  // Cada aparato por separado: cuántas noches escribió y si con etapas.
  const aparatos = fuentes.map((fuente) => {
    const propias = armarNoches(muestras.filter((m) => m.fuente === fuente.id), [fuente]);
    return { fuente, noches: propias.length, conEtapas: propias.some((n) => n.conEtapas) };
  });
  // Lo del reloj, de las noches de las últimas tres semanas: de que te dormiste a que te despertaste.
  const ventanas = noches.flatMap((n): [number, number][] => {
    const fin = n.intervalos[n.intervalos.length - 1]?.[1];
    return fin !== undefined && fin > hace(21).getTime() ? [[n.intervalos[0][0], fin]] : [];
  });
  const [frecuencia, variabilidad, respiracion] = await Promise.all([
    deLasNoches('HKQuantityTypeIdentifierHeartRate', 'count/min', ventanas),
    deLasNoches('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', 'ms', ventanas),
    deLasNoches('HKQuantityTypeIdentifierRespiratoryRate', 'count/min', ventanas),
  ]);
  // Lo dormido es la noche de ese día (la que terminó a su mañana).
  const valoresDe = (dia: ClaveDia, pasos: number | null, agua: number | null, mindful: DeSalud[] | null): LoDeSalud['valores'] => {
    const noche = noches.find((n) => n.clave === dia);
    return {
      ...(pasos !== null ? { pasos: Math.round(pasos) } : {}),
      ...(agua !== null ? { agua: Math.round(agua) } : {}),
      mindfulness: minutosDe(mindful ?? []),
      ...(noche ? { sueno: Math.round(noche.dormido) } : {}),
    };
  };
  return {
    dia: clave,
    valores: valoresDe(clave, pasos, agua, mindful),
    ayer: { dia: ayer, valores: valoresDe(ayer, pasosAyer, aguaAyer, mindfulAyer) },
    noches,
    soloEnCama: soloEnCama(muestras, fuentes, noches),
    fuentes,
    aparatos,
    lecturas: { frecuencia: lecturasDe(frecuencia), variabilidad: lecturasDe(variabilidad), respiracion: lecturasDe(respiracion), reposo: ultimaPorDia(reposo) },
    pesos: primeraPorDia(pesos, corte),
    pesadoEn: primeraPorDia(pesos, corte, 'en'),
    pasosRecientes: pasosDe(recientes),
    entrenamientos: entrenos.flatMap((w) => entrenoDeSalud(w, corte) ?? []),
  };
}
