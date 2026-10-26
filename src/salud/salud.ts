// Salud (HealthKit): lo que Moss lee. Nunca escribe. Los permisos se piden todos juntos en la
// entrada, porque leer un tipo que no se pidió cierra la app (spec/plan.md, etapa 8). Fuera del
// iPhone (la web de prueba) no hay Salud: todo vuelve vacío.

import {
  BiologicalSex, getBiologicalSex, getDateOfBirth, getMostRecentQuantitySample, isHealthDataAvailable, requestAuthorization, type ObjectTypeIdentifier,
} from '@kingstinct/react-native-healthkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { enRango, MAYORIA_DE_EDAD, RANGOS_DEL_CUESTIONARIO } from '@/dominio/metas';

/** Todo lo que Moss va a leer: lo del cuestionario, lo de los hábitos que se encienden solos y lo del sueño. */
const LO_QUE_SE_LEE: readonly ObjectTypeIdentifier[] = [
  'HKCharacteristicTypeIdentifierDateOfBirth',
  'HKCharacteristicTypeIdentifierBiologicalSex',
  'HKQuantityTypeIdentifierHeight',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierStepCount',
  'HKQuantityTypeIdentifierDietaryWater',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKCategoryTypeIdentifierMindfulSession',
  'HKQuantityTypeIdentifierHeartRate',
  'HKQuantityTypeIdentifierRestingHeartRate',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRespiratoryRate',
];

export function haySalud(): boolean {
  if (Platform.OS !== 'ios') return false;
  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
}

// Salud no dice qué se aceptó (por privacidad): se recuerda que se pidió, y lo que no se aceptó vuelve vacío.
const PEDIDA = 'moss:salud';

/** Pide leer todo junto, y recuerda que se pidió. */
export async function pedirPermisos(): Promise<boolean> {
  if (!haySalud()) return false;
  try {
    const si = await requestAuthorization({ toRead: LO_QUE_SE_LEE });
    if (si) await AsyncStorage.setItem(PEDIDA, '1').catch(() => {});
    return si;
  } catch {
    return false;
  }
}

/** Si ya se pidió Salud en este teléfono: entonces se puede leer sin volver a preguntar. */
export async function saludPedida(): Promise<boolean> {
  if (!haySalud()) return false;
  try {
    return (await AsyncStorage.getItem(PEDIDA)) === '1';
  } catch {
    return false;
  }
}

export type DelCuestionario = { edad?: number; sexo?: 'f' | 'm'; alturaCm?: number; pesoKg?: number };

const edadA = (nacimiento: Date, hoy: Date) =>
  hoy.getFullYear() - nacimiento.getFullYear() - (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate()) ? 1 : 0);

/**
 * Lo que Salud ya sabe para el cuestionario: la edad, el sexo, la altura y el último peso. Lo que no
 * está o queda fuera de lo posible no vuelve, y se contesta a mano. Menos de 18 sí vuelve: con eso
 * la entrada no sigue (Menor, en Entrada.tsx).
 */
export async function datosDelCuestionario(hoy: Date = new Date()): Promise<DelCuestionario> {
  if (!haySalud()) return {};
  const r: DelCuestionario = {};
  try {
    const nacimiento = getDateOfBirth();
    const edad = nacimiento ? edadA(nacimiento, hoy) : null;
    if (edad !== null && (enRango(RANGOS_DEL_CUESTIONARIO.edad, edad) || (edad >= 0 && edad < MAYORIA_DE_EDAD))) r.edad = edad;
  } catch {}
  try {
    const sexo = getBiologicalSex();
    if (sexo === BiologicalSex.female) r.sexo = 'f';
    else if (sexo === BiologicalSex.male) r.sexo = 'm';
  } catch {}
  try {
    const altura = await getMostRecentQuantitySample('HKQuantityTypeIdentifierHeight', 'cm');
    if (altura && enRango(RANGOS_DEL_CUESTIONARIO.alturaCm, Math.round(altura.quantity))) r.alturaCm = Math.round(altura.quantity);
  } catch {}
  try {
    const peso = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
    if (peso && enRango(RANGOS_DEL_CUESTIONARIO.pesoKg, Math.round(peso.quantity * 10) / 10)) r.pesoKg = Math.round(peso.quantity * 10) / 10;
  } catch {}
  return r;
}
