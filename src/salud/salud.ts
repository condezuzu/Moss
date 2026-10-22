// Salud (HealthKit): lo que Moss lee. Nunca escribe. Los permisos se piden todos juntos en la
// entrada, porque leer un tipo que no se pidió cierra la app (spec/plan.md, etapa 8). Fuera del
// iPhone (la web de prueba) no hay Salud: todo vuelve vacío.

import {
  BiologicalSex, getBiologicalSex, getDateOfBirth, getMostRecentQuantitySample, isHealthDataAvailable, requestAuthorization, type ObjectTypeIdentifier,
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

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

/** Pide leer todo junto. Salud no dice qué se aceptó: lo que no, después vuelve vacío. */
export async function pedirPermisos(): Promise<boolean> {
  if (!haySalud()) return false;
  try {
    return await requestAuthorization({ toRead: LO_QUE_SE_LEE });
  } catch {
    return false;
  }
}

export type DelCuestionario = { edad?: number; sexo?: 'f' | 'm'; alturaCm?: number; pesoKg?: number };

const edadA = (nacimiento: Date, hoy: Date) =>
  hoy.getFullYear() - nacimiento.getFullYear() - (hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate()) ? 1 : 0);

/**
 * Lo que Salud ya sabe para el cuestionario: la edad, el sexo, la altura y el último peso. Lo que no
 * está o queda fuera de lo posible no vuelve, y se contesta a mano.
 */
export async function datosDelCuestionario(hoy: Date = new Date()): Promise<DelCuestionario> {
  if (!haySalud()) return {};
  const r: DelCuestionario = {};
  try {
    const nacimiento = getDateOfBirth();
    const edad = nacimiento ? edadA(nacimiento, hoy) : null;
    if (edad !== null && edad >= 14 && edad <= 100) r.edad = edad;
  } catch {}
  try {
    const sexo = getBiologicalSex();
    if (sexo === BiologicalSex.female) r.sexo = 'f';
    else if (sexo === BiologicalSex.male) r.sexo = 'm';
  } catch {}
  try {
    const altura = await getMostRecentQuantitySample('HKQuantityTypeIdentifierHeight', 'cm');
    if (altura && altura.quantity >= 100 && altura.quantity <= 250) r.alturaCm = Math.round(altura.quantity);
  } catch {}
  try {
    const peso = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
    if (peso && peso.quantity >= 30 && peso.quantity <= 300) r.pesoKg = Math.round(peso.quantity * 10) / 10;
  } catch {}
  return r;
}
