// Cuándo pedir la reseña de la App Store (lo pidió la sesión de anuncios el 26/11/2026: Moss no tenía calificaciones, y
// las calificaciones pesan en la búsqueda). Apple pide hacerlo en un momento natural, después de que la persona usó la
// app, y nunca al abrirla ni en medio de algo; iOS muestra el cartel como mucho 3 veces en 365 días y no avisa si lo
// mostró. Moss lo pide en dos momentos buenos, lo que llegue primero: el día completo (la constelación entera) o al
// séptimo día con comida anotada; y después, no antes de 120 días.

import { diasEntre, type ClaveDia } from './fechas';

export const DIAS_CON_COMIDA = 7;
export const DIAS_ENTRE_PEDIDOS = 120;

export function tocaPedirResena(x: { hoy: ClaveDia; ultimoPedido: ClaveDia | null; diasConComida: number; diaCompleto: boolean }): boolean {
  if (x.ultimoPedido !== null && diasEntre(x.ultimoPedido, x.hoy) < DIAS_ENTRE_PEDIDOS) return false;
  return x.diaCompleto || x.diasConComida >= DIAS_CON_COMIDA;
}
