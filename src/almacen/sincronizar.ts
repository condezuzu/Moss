// La sincronización con la cuenta. El teléfono manda: todo se guarda primero acá y después sube.
// Cada cosa lleva la hora de su cambio y entre dos versiones gana la más nueva, en el teléfono
// (mezclar.ts) y en Supabase (los triggers de supabase/moss/).
//
// - La primera vez en un teléfono baja todo antes de subir nada: así un teléfono nuevo recibe la
//   semilla y las constelaciones de la cuenta en lugar de pisarlas con las suyas.
// - Después sube lo pendiente a los pocos segundos de cada cambio y, al volver la app del fondo,
//   baja lo que cambió en la cuenta desde la última vez.
// - Si algo falla (sin conexión), no se pierde nada: queda pendiente y se reintenta cada vez más
//   espaciado.

import { sumarDias, type ClaveDia } from '@/dominio/fechas';
import { DIAS_DE_COMIDA, DIAS_DE_MARCAS, type Almacen } from './almacen';
import type { Datos } from './mezclar';
import { sinCambios, type Cambios } from './repositorio';

export interface Remoto {
  subir(cambios: Cambios): Promise<void>;
  /**
   * Lo que cambió en la cuenta desde `desde` (una hora del servidor) o, sin `desde`, todo; en ese
   * caso, de las marcas, solo las de `marcasDesde` en adelante, y de los registros y el agua, los
   * de `comidaDesde`. `hasta` es la hora del servidor de lo último que bajó: la próxima vez se
   * pide desde ahí.
   */
  bajar(desde: string | null, marcasDesde: ClaveDia, comidaDesde: ClaveDia): Promise<{ datos: Datos; hasta: string | null }>;
}

export type Opciones = {
  almacen: Almacen;
  remoto: Remoto;
  /** El usuario de la sesión. */
  usuario: string;
  /** Cuánto se espera después de un cambio antes de subir, para juntar varios toques. */
  espera?: number;
  /** Si falla, cuánto se espera para el primer reintento; después, el doble cada vez. */
  reintento?: number;
};

/** Los ajustes de la sincronización: de quién son los datos del teléfono y hasta dónde bajó. */
const DUENO = 'usuario';
const BAJADO = 'bajado';

const ULTIMO_REINTENTO = 5 * 60_000;

export type Sincronizador = ReturnType<typeof crearSincronizador>;

export function crearSincronizador({ almacen, remoto, usuario, espera = 3000, reintento: primerReintento = 10_000 }: Opciones) {
  let conocida = false;
  let deOtraCuenta = false;
  let parado = true;
  // Se paró para siempre (se cerró la sesión o se borra el teléfono): lo que vuelva de la cuenta ya no se toca.
  let soltado = false;
  let fallas = 0;
  let pedidoDeBajada = false;
  let reloj: ReturnType<typeof setTimeout> | undefined;
  let dejarDeOir: (() => void) | undefined;
  let cola: Promise<unknown> = Promise.resolve();

  // Una vuelta por vez: subir y bajar nunca se cruzan.
  const enOrden = <T>(tarea: () => Promise<T>): Promise<T> => {
    const resultado = cola.then(tarea);
    cola = resultado.catch(() => undefined);
    return resultado;
  };

  async function subir() {
    const p = await almacen.enCola((r) => r.pendientes());
    if (sinCambios(p)) return;
    await remoto.subir(p);
    if (soltado) return;
    await almacen.enCola((r) => r.subidoHasta(p.hasta));
  }

  async function bajar() {
    const desde = await almacen.enCola((r) => r.leerAjuste(BAJADO));
    const hoy = almacen.estado().hoy;
    const { datos, hasta } = await remoto.bajar(desde, sumarDias(hoy, -DIAS_DE_MARCAS), sumarDias(hoy, -DIAS_DE_COMIDA));
    // De acá en adelante todo entra a la cola en el mismo instante: nunca detrás de un borrado que llegó antes.
    if (soltado) return;
    almacen.mezclar(datos);
    // En la cola, después de lo mezclado: si la app se cierra antes de guardarlo, la próxima vez se vuelve a bajar.
    if (hasta && hasta !== desde) await almacen.enCola((r) => r.guardarAjuste(BAJADO, hasta));
  }

  /** Devuelve false si los datos del teléfono son de otra cuenta, o si se paró: entonces no se toca nada. */
  async function vuelta(conBajada: boolean): Promise<boolean> {
    if (deOtraCuenta || soltado) return false;
    await almacen.iniciar();
    if (!conocida) {
      const dueno = await almacen.enCola((r) => r.leerAjuste(DUENO));
      if (dueno && dueno !== usuario) {
        deOtraCuenta = true;
        console.warn('Los datos de este teléfono son de otra cuenta: no se sincronizan.');
        return false;
      }
      if (!dueno) {
        await bajar();
        if (soltado) return false;
        await almacen.enCola((r) => r.guardarAjuste(DUENO, usuario));
        conBajada = false;
      }
      conocida = true;
    }
    // Si la subida falla, igual baja lo nuevo; el error sale al final, para reintentar más tarde.
    const errores: unknown[] = [];
    await subir().catch((error: unknown) => errores.push(error));
    if (conBajada) {
      await bajar();
      // Lo mezclado puede haber rearmado el día de hoy.
      if (!errores.length) await subir();
    }
    if (errores.length) throw errores[0];
    return !soltado;
  }

  // Solo: cada pedido espera un poco y, si la vuelta falla, se reintenta cada vez más espaciado.
  function pedir(conBajada: boolean, ms = espera) {
    pedidoDeBajada ||= conBajada;
    if (parado) return;
    clearTimeout(reloj);
    const reintento = fallas ? Math.min(ULTIMO_REINTENTO, primerReintento * 2 ** (fallas - 1)) : 0;
    reloj = setTimeout(correr, Math.max(ms, reintento));
  }

  function correr() {
    const conBajada = pedidoDeBajada;
    pedidoDeBajada = false;
    enOrden(() => vuelta(conBajada)).then(
      (seguir) => {
        fallas = 0;
        if (!seguir) parar();
      },
      (error) => {
        console.warn('Moss no pudo sincronizar', error);
        fallas++;
        pedir(conBajada, 0);
      },
    );
  }

  function parar() {
    soltado = true;
    parado = true;
    clearTimeout(reloj);
    dejarDeOir?.();
    dejarDeOir = undefined;
  }

  return {
    /** Una vuelta ahora: sube lo pendiente y, con `conBajada`, baja lo nuevo. La primera vez en este teléfono, primero baja todo. */
    vuelta: (conBajada = true) => enOrden(() => vuelta(conBajada)),
    /** Queda atento: una vuelta completa ya, y después sube a los pocos segundos de cada cambio. */
    arrancar() {
      if (!parado) return;
      parado = false;
      dejarDeOir = almacen.suscribir(() => pedir(false));
      pedir(true, 0);
    },
    /** La app volvió del fondo: baja lo que haya cambiado en la cuenta. */
    alVolver: () => pedir(true, 0),
    /** Para para siempre: lo que esté en camino ya no toca el teléfono. */
    parar,
    /** Para y espera a que termine la vuelta que esté en camino. */
    terminar(): Promise<void> {
      parar();
      return enOrden(async () => {});
    },
    /** Para mostrarlo en Ajustes cuando exista: el teléfono tiene datos de otra cuenta y no sincroniza. */
    deOtraCuenta: () => deOtraCuenta,
  };
}
