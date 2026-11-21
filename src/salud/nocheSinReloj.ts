// Sin reloj, cada mañana (spec/sueno.md, «Sin reloj»): arma la noche de anoche con lo que guardó el
// teléfono (los pasos de Salud, el movimiento, cuándo usaste Moss y lo que avisaron los Atajos y el
// despertador) y la guarda como estimada, con tu margen para dormirte (src/dominio/sinReloj.ts). No pisa
// lo que confirmaste ni la noche de un reloj o un anillo, y nunca escribe en Salud. Con un reloj o un anillo
// también, desde temprano (lo pediste el 21/11/2026: siempre hay una noche): muchos escriben la suya recién al
// sincronizar su app, y cuando llega, gana (conNochesDeMoss).

import { useSyncExternalStore } from 'react';

import type { Almacen, Estado } from '@/almacen/almacen';
import { diaLogico, sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  aceptadaSinCambios, actividadDeLosPasos, actividadDelMovimiento, conNochesDeMoss, deLasSenales, estimarNoche, habitualDe, instanteDe, margenParaDormirte, NOCHES_QUE_SE_REARMAN, sinLasRestas,
  type Actividad, type Estimacion,
} from '@/dominio/sinReloj';
import type { NochePropia } from '@/dominio/sueno';
import { leerMovimiento } from '../../modules/movimiento';
import { leerSenales } from './anclas';
import type { LoDeSalud } from './convertir';

/** Desde las 4 hay noche para estimar. */
export const DESDE_LAS = 4;
/**
 * iOS guarda siete días del movimiento del teléfono: las noches de los últimos seis días todavía tienen entera su
 * tarde anterior, y se pueden estimar de nuevo con sus señales.
 */
const DIAS_CON_SENALES = 6;

type Pasos = LoDeSalud['pasosRecientes'];
const zonaEn = (ms: number) => -new Date(ms).getTimezoneOffset();

/**
 * La noche de un momento, por el día en que te despiertas: hasta las 4 sigue siendo «anoche» la de ayer.
 * No es el día de Moss (D32): con el corte a las 5 o a las 6, a las 5 el día todavía es ayer y la noche ya es la de hoy.
 */
export const nocheDeAhora = (ahora: Date): ClaveDia => diaLogico(ahora, DESDE_LAS * 60);

// Cómo llegó a la hora de anoche, para contarlo a la mañana. No se guarda: se rehace cada vez que se abre Moss.
type ComoLlego = { clave: ClaveDia; estimacion: Estimacion; margen: number };
let comoLlego: ComoLlego | null = null;
const oyentes = new Set<() => void>();

export function useComoLlego(clave: ClaveDia): ComoLlego | null {
  const actual = useSyncExternalStore((alCambiar) => {
    oyentes.add(alCambiar);
    return () => oyentes.delete(alCambiar);
  }, () => comoLlego);
  return actual?.clave === clave ? actual : null;
}

/** La noche que terminó `clave`, con lo que el teléfono guardó de ella hasta `ahora`, y cómo se guarda. */
async function estimar(e: Estado, clave: ClaveDia, ahora: Date, pasos: Pasos): Promise<{ estimacion: Estimacion; hora: NonNullable<NochePropia['hora']> } | null> {
  const zona = zonaEn(Date.parse(`${clave}T12:00:00.000Z`));
  // Desde las 12 del día anterior hasta las 15: alcanza para ver la tarde, la noche y la mañana.
  const inicio = instanteDe(clave, zona, -360);
  const hasta = Math.min(ahora.getTime(), instanteDe(clave, zona, 21 * 60));
  const movimiento = await leerMovimiento(inicio, hasta);
  // Lo de los Atajos, con dos semanas antes: así se ve si el enfoque Sueño sigue un horario.
  const atajos = deLasSenales(await leerSenales(inicio - 14 * 86_400_000).catch(() => []), zonaEn);
  const actividad: Actividad[] = [
    ...actividadDeLosPasos(pasos),
    ...actividadDelMovimiento(movimiento, hasta),
    ...e.uso.map(([desde, fin]): Actividad => ({ desde, hasta: fin, tipo: 'moss' })),
    ...atajos.actividad,
  ];
  const noches = conNochesDeMoss(e.salud?.noches ?? [], [...e.noches.values()], zonaEn);
  const estimacion = estimarNoche({ clave, zona, actividad, anclas: atajos.anclas, habitual: habitualDe(noches, clave), margen: margenParaDormirte(e.latencia) });
  if (!estimacion) return null;
  const iso = (minutos: number) => new Date(instanteDe(clave, zona, Math.round(minutos))).toISOString();
  const horas = { dormirse: iso(estimacion.dormirse), despertar: iso(estimacion.despertar) };
  return {
    estimacion,
    // Con la ventana tranquila, para volver a armarla si cambia tu margen, y el margen del rango, para calibrarlo.
    hora: { ...horas, origen: 'estimada', confianza: estimacion.confianza, estimada: { ...horas, quieto: { desde: iso(estimacion.quieto.desde), hasta: iso(estimacion.quieto.hasta) }, margen: estimacion.margen } },
  };
}

export async function estimarAnoche(a: Almacen, ahora = new Date()): Promise<void> {
  const e = a.estado();
  if (!e.listo || ahora.getHours() < DESDE_LAS) return;
  const clave = nocheDeAhora(ahora);
  const deSalud = e.salud?.noches ?? [];
  if (deSalud.some((n) => n.clave === clave)) return;
  const antes = e.noches.get(clave);
  if (antes?.hora && antes.hora.origen !== 'estimada') return;

  const est = await estimar(e, clave, ahora, e.salud?.pasosRecientes ?? []);
  if (!est) return;
  comoLlego = { clave, estimacion: est.estimacion, margen: margenParaDormirte(e.latencia) };
  oyentes.forEach((o) => o());
  // Solo si cambió: cada cambio sube a la cuenta.
  if (antes?.hora && antes.hora.dormirse === est.hora.dormirse && antes.hora.despertar === est.hora.despertar && antes.hora.confianza === est.hora.confianza) return;
  a.ponerHoraDeLaNoche(clave, est.hora);
}

/**
 * Una sola vez, al llegar la regla del 17/11/2026 (spec/sueno.md, «Sin reloj»): vuelve a armar las noches
 * estimadas de las últimas cuatro semanas, para que la deuda cambie ese mismo día y no dos semanas después. Las
 * de los últimos seis días, con sus señales, que el teléfono todavía guarda (así se arregla también la mañana
 * cortada por la alarma); las demás, y las que ya no tienen pasos ni movimiento o quedan sin ventana, con su
 * ventana guardada y sin las restas de antes (sinLasRestas). También las que aceptaste con «Sí» tal como Moss
 * las propuso: la propuesta ya traía esas restas, así que no es una medición tuya, y vuelven a ser estimadas.
 * Lo que corregiste o escribiste no se toca. `leerPasos`, los pasos de Salud entre dos momentos.
 */
export async function rehacerLasNoches(a: Almacen, ahora = new Date(), leerPasos: (desde: Date, hasta: Date) => Promise<Pasos> = async () => []): Promise<void> {
  if (!a.estado().listo || a.estado().suenoRehecho) return;
  const hoy = nocheDeAhora(ahora);
  const pasos = await leerPasos(new Date(ahora.getTime() - (DIAS_CON_SENALES + 2) * 86_400_000), ahora).catch((): Pasos => []);
  const sirve = (e: Estimacion) => !e.motivos.includes('pocosDatos') && !e.motivos.includes('sinVentana');
  // De la más vieja a la más nueva: cada una se compara con lo de siempre de las anteriores, ya rehechas.
  for (let i = NOCHES_QUE_SE_REARMAN - 1; i >= 0; i--) {
    const clave = sumarDias(hoy, -i);
    const e = a.estado();
    const antes = e.noches.get(clave);
    if (!antes?.hora || antes.borrado || e.salud?.noches.some((n) => n.clave === clave)) continue;
    const sinRestas = sinLasRestas(antes.hora, margenParaDormirte(e.latencia), true);
    // Una aceptada con «Sí» se rehace solo si su propuesta era de la regla de antes: si ya son las horas de su ventana, ese «Sí» vale.
    if (antes.hora.origen !== 'estimada' && !(aceptadaSinCambios(antes.hora) && sinRestas)) continue;
    const conSenales = i < DIAS_CON_SENALES ? await estimar(e, clave, ahora, pasos) : null;
    const hora = conSenales && sirve(conSenales.estimacion) ? conSenales.hora : sinRestas;
    if (hora && (hora.dormirse !== antes.hora.dormirse || hora.despertar !== antes.hora.despertar)) a.ponerHoraDeLaNoche(clave, hora);
  }
  a.marcarSuenoRehecho();
}
