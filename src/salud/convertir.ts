// De lo que devuelve HealthKit a lo que entiende el dominio (src/dominio/sueno.ts): las muestras de
// sueño con su etapa, su fuente y la zona horaria de ese momento, y las lecturas del reloj. Sin nada
// del teléfono, para probarlo.

import { claveDelDia, type ClaveDia } from '@/dominio/fechas';
import type { Etapa, Fuente, Medida, Muestra, Noche, TipoDeFuente } from '@/dominio/sueno';

/** Lo que importa de una muestra de HealthKit. */
export type DeSalud = {
  value?: number;
  quantity?: number;
  startDate: Date;
  endDate: Date;
  sourceRevision: { source: { name: string; bundleIdentifier: string }; productType?: string };
  metadata?: Record<string, unknown>;
};

/** HKCategoryValueSleepAnalysis: en cama, dormido sin etapa, despierto, núcleo, profundo y REM. */
const ETAPAS: Record<number, Etapa> = { 0: 'enCama', 1: 'dormido', 2: 'despierto', 3: 'nucleo', 4: 'profundo', 5: 'rem' };

/** El reloj, otro aparato o app (un anillo, Garmin) o el teléfono, por el modelo del aparato que la escribió. */
export function tipoDeFuente(productType: string | undefined): TipoDeFuente {
  if (productType?.startsWith('Watch')) return 'reloj';
  if (productType?.startsWith('iPhone')) return 'telefono';
  return 'otra';
}

const idDeFuente = (s: DeSalud) => s.sourceRevision.source.bundleIdentifier || s.sourceRevision.source.name;

/** Las fuentes de unas muestras, una por cada aparato o app. */
export function fuentesDe(muestras: DeSalud[]): Fuente[] {
  const fuentes = new Map<string, Fuente>();
  for (const s of muestras) {
    const id = idDeFuente(s);
    if (!fuentes.has(id)) fuentes.set(id, { id, nombre: s.sourceRevision.source.name, tipo: tipoDeFuente(s.sourceRevision.productType) });
  }
  return [...fuentes.values()];
}

/** Una muestra de sueño, con la zona de su momento (−180 en Uruguay). Lo que no se entiende queda afuera. */
export function muestraDeSueno(s: DeSalud): Muestra | null {
  const etapa = s.value === undefined ? undefined : ETAPAS[s.value];
  const desde = s.startDate.getTime();
  const hasta = s.endDate.getTime();
  if (!etapa || !(hasta > desde)) return null;
  const aMano = s.metadata?.HKWasUserEntered === true || s.metadata?.HKWasUserEntered === 1;
  return { etapa, desde, hasta, fuente: idDeFuente(s), zona: -s.startDate.getTimezoneOffset(), ...(aMano ? { aMano: true } : {}) };
}

/** Las lecturas de una cantidad (la frecuencia, la variabilidad, la respiración): cuándo y cuánto. */
export const lecturasDe = (muestras: DeSalud[]): Medida[] =>
  muestras.flatMap((s) => (typeof s.quantity === 'number' && Number.isFinite(s.quantity) ? [{ en: s.startDate.getTime(), valor: s.quantity }] : []));

/** De muchas muestras de un valor diario (la frecuencia en reposo, el peso), la última de cada día. */
export function ultimaPorDia(muestras: DeSalud[]): Map<ClaveDia, number> {
  const porDia = new Map<ClaveDia, { en: number; valor: number }>();
  for (const s of muestras) {
    if (typeof s.quantity !== 'number' || !Number.isFinite(s.quantity)) continue;
    const dia = claveDelDia(s.startDate);
    const antes = porDia.get(dia);
    if (!antes || s.startDate.getTime() > antes.en) porDia.set(dia, { en: s.startDate.getTime(), valor: s.quantity });
  }
  return new Map([...porDia].map(([d, x]) => [d, x.valor]));
}

/** Los minutos de unas sesiones (la atención plena). */
export const minutosDe = (muestras: DeSalud[]) => Math.round(muestras.reduce((s, m) => s + Math.max(0, m.endDate.getTime() - m.startDate.getTime()), 0) / 60_000);

/** Lo de Salud, leído al abrir la app y al volver: queda en memoria; no se guarda ni sube. */
export type LoDeSalud = {
  /** El día en que se leyó: los valores son de ese día. */
  dia: ClaveDia;
  /** Lo de hoy: pasos, ml de agua, minutos de atención plena y minutos dormidos anoche. */
  valores: Partial<Record<'pasos' | 'agua' | 'mindfulness' | 'sueno', number>>;
  noches: Noche[];
  soloEnCama: Map<ClaveDia, { minutos: number; fuente: Fuente }>;
  lecturas: { frecuencia: Medida[]; variabilidad: Medida[]; respiracion: Medida[]; reposo: Map<ClaveDia, number> };
  fuentes: Fuente[];
  /** El último peso de cada día, en kg. */
  pesos: Map<ClaveDia, number>;
};
