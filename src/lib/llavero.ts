// El llavero que comparten Moss y Ascent (spec/ascent.md, «Vincular en menos de 10 segundos»): las
// dos apps son del mismo equipo de Apple, así que pueden leer el mismo grupo del llavero y ninguna
// otra app puede. Cada una deja ahí su sesión (un token que vence en una hora) al entrar y al
// renovarla, y la borra al salir; la otra la lee para vincular en dos toques.
//
// El contrato es el mismo en las dos apps y no se cambia sin cambiar Ascent:
// - expo-secure-store, con el servicio, el grupo y la accesibilidad de OPCIONES;
// - las claves `moss.sesion` (la escribe Moss) y `ascent.sesion` (la escribe Ascent);
// - el valor, JSON: { v: 1, app, usuario, nombre, token, vence } (sesionCompartida.ts).
// expo-secure-store guarda el servicio como `uy.condeag.compartido:no-auth`: si Ascent lo leyera
// con otra biblioteca, ese es el nombre de verdad.

import * as SecureStore from 'expo-secure-store';

import { leerSesion, type App, type SesionCompartida } from './sesionCompartida';

export { leerSesion, vigente, type App, type SesionCompartida } from './sesionCompartida';

const OPCIONES: SecureStore.SecureStoreOptions = {
  keychainService: 'uy.condeag.compartido',
  accessGroup: 'XF9N8X9KJG.uy.condeag.compartido',
  // Sin pasar a otro iPhone con la copia: la sesión es de este teléfono.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

const CLAVE: Record<App, string> = { moss: 'moss.sesion', ascent: 'ascent.sesion' };

/** La sesión que dejó Ascent en este iPhone, vigente o no; null si no hay o no se puede leer. */
export async function sesionDeAscent(): Promise<SesionCompartida | null> {
  try {
    return leerSesion(await SecureStore.getItemAsync(CLAVE.ascent, OPCIONES), 'ascent');
  } catch {
    return null;
  }
}

/** Deja la sesión de Moss para Ascent. No espera ni falla: si no se puede, Ascent pide abrir Moss. */
export function dejarMiSesion(s: Omit<SesionCompartida, 'v' | 'app'>): void {
  const valor: SesionCompartida = { v: 1, app: 'moss', ...s };
  SecureStore.setItemAsync(CLAVE.moss, JSON.stringify(valor), OPCIONES).catch(() => {});
}

/** Saca la sesión de Moss del llavero: al cerrar sesión o borrar la cuenta. */
export function borrarMiSesion(): Promise<void> {
  return SecureStore.deleteItemAsync(CLAVE.moss, OPCIONES).catch(() => {});
}
