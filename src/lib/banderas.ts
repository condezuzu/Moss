// Lo que se prende o se apaga con una actualización por aire, sin una build nueva.

/**
 * Vincular con Ascent: la sección arriba de Hábitos (el gesto y la flecha), la fila y el final de
 * Perfil, la recuperación en Sueño, la frase de la privacidad y la sesión en el llavero compartido.
 * Apagado mientras Ascent 1.2.0 no esté en la App Store (lo decidiste el 28/10/2026): se prende con
 * `true` y una OTA.
 */
export const CON_ASCENT = false;

/**
 * El día en que sale Moss Premium (AAAA-MM-DD): prenderlo es poner la fecha, y quien tiene cuenta de
 * antes de ese día lo tiene de regalo (lo decidiste el 31/10/2026). Pide la build con StoreKit
 * (app-intents/Compras.swift) y los productos cargados en App Store Connect (spec/suscripcion.md).
 */
export const PREMIUM_SALE: string | null = process.env.EXPO_PUBLIC_PREMIUM_SALE || null;
export const CON_PREMIUM = PREMIUM_SALE !== null;
