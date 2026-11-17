// «Lo que hay que hacer hoy» (lo pediste el 17/11/2026; spec/sueno.md, «Lo que tienes en la cabeza»): los
// pendientes que anotas por la noche, antes de acostarte, para sacártelos de la cabeza, y que vuelven por la
// mañana, en un aviso y arriba de «Para hoy». Quedan en el teléfono: no suben a la cuenta.

import { sumarDias, type ClaveDia } from './fechas';

/** `para` es el día de Moss en que hay que hacerlo. */
export type Pendiente = { id: string; texto: string; hecho: boolean; para: ClaveDia };

/** Es una lista corta: hasta 6 por día, de hasta 60 letras cada uno. */
export const MAXIMO_DE_PENDIENTES = 6;
export const LARGO_DEL_PENDIENTE = 60;
/** Los de hace más de una semana se olvidan. */
export const DIAS_DE_PENDIENTES = 7;

/**
 * Para qué día es lo que se anota ahora: el que sigue al día de Moss. Lo anotado a la noche es para mañana, y lo
 * anotado de madrugada, antes del corte, también: para Moss todavía es el día anterior (diaLogico, en fechas.ts).
 */
export const diaDeLosPendientes = (ahoraDiaDeMoss: ClaveDia): ClaveDia => sumarDias(ahoraDiaDeMoss, 1);

/** Los de ese día, en el orden en que se anotaron. */
export const pendientesPara = (lista: readonly Pendiente[], dia: ClaveDia): Pendiente[] => lista.filter((p) => p.para === dia);

/** El texto como se guarda: sin espacios de más y cortado al largo, por letras y no por la mitad de un emoji. */
export const limpiarPendiente = (texto: string): string => Array.from(texto.replace(/\s+/g, ' ').trim()).slice(0, LARGO_DEL_PENDIENTE).join('').trim();

/** Si ese día ya tiene todos los que entran. */
export const pendientesLlenos = (lista: readonly Pendiente[], dia: ClaveDia): boolean => pendientesPara(lista, dia).length >= MAXIMO_DE_PENDIENTES;

/** Sin los de hace más de una semana. */
export const pendientesVigentes = (lista: readonly Pendiente[], hoy: ClaveDia): Pendiente[] => lista.filter((p) => p.para >= sumarDias(hoy, -DIAS_DE_PENDIENTES));

/** Lo guardado, si tiene forma: lo que no se entiende no está. */
export function pendientesDe(x: unknown): Pendiente[] {
  if (!Array.isArray(x)) return [];
  return x.flatMap((p: Partial<Pendiente> | null) =>
    p && typeof p.id === 'string' && typeof p.texto === 'string' && p.texto && typeof p.para === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.para)
      ? [{ id: p.id, texto: p.texto, hecho: p.hecho === true, para: p.para }]
      : []);
}
