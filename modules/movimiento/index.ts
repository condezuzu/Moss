// El módulo propio que lee el historial de movimiento del iPhone (ios/MovimientoModule.swift). Va en
// la build de la app, no en Expo Go ni en la web: ahí no está, y la noche sin reloj se estima con los
// pasos de Salud y con cuándo usaste Moss.

import { requireOptionalNativeModule } from 'expo';

export type PermisoDeMovimiento = 'permitido' | 'negado' | 'restringido' | 'sinPreguntar' | 'noDisponible';
/** Un cambio del historial: desde cuándo (en milisegundos) y qué, con su confianza (0 a 2). */
export type CambioDeMovimiento = { en: number; quieto: boolean; caminando: boolean; corriendo: boolean; auto: boolean; bici: boolean; confianza: 0 | 1 | 2 };

type Modulo = {
  permiso(): PermisoDeMovimiento;
  pedir(): Promise<PermisoDeMovimiento>;
  consultar(desde: number, hasta: number): Promise<CambioDeMovimiento[]>;
};

const modulo = requireOptionalNativeModule<Modulo>('Movimiento');

/** Si Moss puede leer el movimiento; sin el módulo, no está disponible. */
export const permisoDeMovimiento = (): PermisoDeMovimiento => modulo?.permiso() ?? 'noDisponible';

/** Muestra el pedido del sistema y dice qué contestó la persona. */
export const pedirMovimiento = async (): Promise<PermisoDeMovimiento> => (modulo ? modulo.pedir() : 'noDisponible');

/** Los cambios entre dos momentos; sin permiso o si falla, ninguno. */
export async function leerMovimiento(desde: number, hasta: number): Promise<CambioDeMovimiento[]> {
  if (!modulo || modulo.permiso() !== 'permitido') return [];
  try {
    return await modulo.consultar(desde, hasta);
  } catch {
    return [];
  }
}
