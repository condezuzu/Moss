// Lo que se prende o se apaga con una actualización por aire, sin una build nueva.

/**
 * Vincular con Ascent: la sección abajo de Hábitos (el gesto y la señal), la invitación de Inicio, la
 * fila y el final de Perfil, la recuperación en Sueño, la frase de la privacidad y la sesión en el llavero
 * compartido. Apagado mientras Ascent 1.2.0 no esté en la App Store (lo decidiste el 28/10/2026): se prende con
 * `true` y una OTA.
 */
export const CON_ASCENT = false;

/**
 * Los widgets que se suman con la próxima build (D43): Hoy, Anotar y Agua. Cada uno se declara en
 * app.json, y eso cambia la huella: lo prende herramientas/preparar-proxima-build.mjs, junto con app.json.
 */
export const CON_WIDGETS_NUEVOS = false;

/**
 * El día en que Moss pasa a ser de pago (AAAA-MM-DD): prenderlo es poner la fecha, y quien tiene cuenta de
 * antes de ese día sigue de regalo (D40). Pide la build con StoreKit (app-intents/Compras.swift) y los
 * productos cargados en App Store Connect (spec/suscripcion.md). Sin la fecha, Moss sigue gratis.
 */
export const PREMIUM_SALE: string | null = process.env.EXPO_PUBLIC_PREMIUM_SALE || null;
export const CON_PREMIUM = PREMIUM_SALE !== null;
