// Restar un vaso de agua (aprobado en la galería el 9/11/2026): mantener apretada el agua, en Inicio o en
// el «+», quita el último vaso de hoy, con «Deshacer», que lo vuelve a poner igual.

import * as Haptics from 'expo-haptics';

import { elAlmacen } from '@/almacen';
import type { ClaveDia } from '@/dominio/fechas';
import { vigentes, type TomaDeAgua } from '@/dominio/registros';
import { t } from '@/textos';

/** Cuánto hay que mantener apretado, como en la galería. */
export const MANTENER_MS = 350;

/** La última toma de agua del día, por su hora; undefined si ese día no hay agua. */
export function ultimaToma(tomas: Iterable<TomaDeAgua>, dia: ClaveDia): TomaDeAgua | undefined {
  let ultima: TomaDeAgua | undefined;
  for (const x of vigentes(tomas)) {
    if (x.dia === dia && (!ultima || Date.parse(x.momento) >= Date.parse(ultima.momento))) ultima = x;
  }
  return ultima;
}

/**
 * Quita el último vaso de hoy y lo dice con «Deshacer», que lo vuelve a sumar con la misma cantidad y a
 * la misma hora. Sin agua hoy no hace nada (ni vibra) y da false.
 */
export function quitarUltimoVaso(avisar: (texto: string, deshacer: () => void) => void): boolean {
  const a = elAlmacen();
  const e = a.estado();
  const toma = ultimaToma(e.agua.values(), e.hoy);
  if (!toma || !a.quitarAgua(toma.id)) return false;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  avisar(t('mas.vasoQuitado'), () => {
    a.sumarAgua(toma.ml, { dia: toma.dia, momento: toma.momento });
  });
  return true;
}
