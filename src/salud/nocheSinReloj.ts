// Sin reloj, cada mañana (spec/sueno.md, «Sin reloj»): arma la noche de anoche con lo que guardó el
// teléfono (los pasos de Salud, el movimiento, cuándo usaste Moss y lo que avisaron los Atajos y el
// despertador) y la guarda como estimada, con lo aprendido de tus correcciones
// (src/dominio/sinReloj.ts). No pisa lo que confirmaste ni la noche de un reloj o un anillo, y nunca
// escribe en Salud.

import { useSyncExternalStore } from 'react';

import type { Almacen } from '@/almacen/almacen';
import { diaLogico, sumarDias, type ClaveDia } from '@/dominio/fechas';
import {
  actividadDeLosPasos, actividadDelMovimiento, aprenderPersonal, conNochesDeMoss, deLasSenales, estimarNoche, habitualDe, instanteDe, type Actividad, type Estimacion, type Personal,
} from '@/dominio/sinReloj';
import { leerMovimiento } from '../../modules/movimiento';
import { leerSenales } from './anclas';

/** Desde las 4 hay noche para estimar; con un reloj o un anillo, se espera su noche hasta las 14. */
export const DESDE_LAS = 4;
const ESPERAR_AL_RELOJ_HASTA = 14;

/**
 * La noche de un momento, por el día en que te despiertas: hasta las 4 sigue siendo «anoche» la de ayer.
 * No es el día de Moss (D32): con el corte a las 5 o a las 6, a las 5 el día todavía es ayer y la noche ya es la de hoy.
 */
export const nocheDeAhora = (ahora: Date): ClaveDia => diaLogico(ahora, DESDE_LAS * 60);

// Cómo llegó a la hora de anoche, para contarlo a la mañana. No se guarda: se rehace cada vez que se abre Moss.
type ComoLlego = { clave: ClaveDia; estimacion: Estimacion; personal: Personal };
let comoLlego: ComoLlego | null = null;
const oyentes = new Set<() => void>();

export function useComoLlego(clave: ClaveDia): ComoLlego | null {
  const actual = useSyncExternalStore((alCambiar) => {
    oyentes.add(alCambiar);
    return () => oyentes.delete(alCambiar);
  }, () => comoLlego);
  return actual?.clave === clave ? actual : null;
}

export async function estimarAnoche(a: Almacen, ahora = new Date()): Promise<void> {
  const e = a.estado();
  if (!e.listo || ahora.getHours() < DESDE_LAS) return;
  const clave = nocheDeAhora(ahora);
  const deSalud = e.salud?.noches ?? [];
  if (deSalud.some((n) => n.clave === clave)) return;
  const conAparato = deSalud.some((n) => n.clave >= sumarDias(clave, -14) && (n.fuente.tipo === 'reloj' || n.fuente.tipo === 'otra'));
  if (conAparato && ahora.getHours() < ESPERAR_AL_RELOJ_HASTA) return;
  const antes = e.noches.get(clave);
  if (antes?.hora && antes.hora.origen !== 'estimada') return;

  const zona = -ahora.getTimezoneOffset();
  // Desde las 12 del día anterior: alcanza para ver la tarde, la noche y la mañana.
  const inicio = instanteDe(clave, zona, -360);
  const movimiento = await leerMovimiento(inicio, ahora.getTime());
  // Lo de los Atajos, con dos semanas antes: así se ve si el enfoque Sueño sigue un horario.
  const atajos = deLasSenales(await leerSenales(inicio - 14 * 86_400_000).catch(() => []), (ms) => -new Date(ms).getTimezoneOffset());
  const actividad: Actividad[] = [
    ...actividadDeLosPasos(e.salud?.pasosRecientes ?? []),
    ...actividadDelMovimiento(movimiento, ahora.getTime()),
    ...e.uso.map(([desde, hasta]): Actividad => ({ desde, hasta, tipo: 'moss' })),
    ...atajos.actividad,
  ];
  const propias = [...e.noches.values()];
  const noches = conNochesDeMoss(deSalud, propias, (ms) => -new Date(ms).getTimezoneOffset());
  const personal = aprenderPersonal(propias, clave, e.latencia);
  const est = estimarNoche({ clave, zona, actividad, anclas: atajos.anclas, habitual: habitualDe(noches, clave), personal });
  if (!est) return;
  comoLlego = { clave, estimacion: est, personal };
  oyentes.forEach((o) => o());
  const iso = (minutos: number) => new Date(instanteDe(clave, zona, Math.round(minutos))).toISOString();
  const hora = {
    dormirse: iso(est.dormirse), despertar: iso(est.despertar), origen: 'estimada' as const, confianza: est.confianza,
    // Con la ventana tranquila: cuando contestes «¿Dormiste de X a Y?», de ahí se aprende lo tuyo.
    estimada: { dormirse: iso(est.dormirse), despertar: iso(est.despertar), quieto: { desde: iso(est.quieto.desde), hasta: iso(est.quieto.hasta) } },
  };
  // Solo si cambió: cada cambio sube a la cuenta.
  if (antes?.hora && antes.hora.dormirse === hora.dormirse && antes.hora.despertar === hora.despertar && antes.hora.confianza === hora.confianza) return;
  a.ponerHoraDeLaNoche(clave, hora);
}
