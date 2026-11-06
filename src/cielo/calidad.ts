import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

import type { Calidad } from './mundo';

const ORDEN: Calidad[] = ['alta', 'media', 'baja'];

/**
 * El valor de fábrica sale del modelo. iPhone13,x es el iPhone 12 (A14): de ahí en adelante, alta.
 * iPhone12,x es la serie 11 y el SE de 2020 (A13): media. Lo anterior, baja. Sin modelo (web o
 * simulador), alta. Después, la escena mide los primeros segundos y baja un escalón si hace falta.
 */
export function calidadDeFabrica(): Calidad {
  const modelo = /^iPhone(\d+),/.exec(Device.modelId ?? '');
  if (!modelo) return 'alta';
  const generacion = Number(modelo[1]);
  if (generacion >= 13) return 'alta';
  if (generacion === 12) return 'media';
  return 'baja';
}

// La automática es una sola para toda la app (el cielo, la luna): la que dice el modelo, y un
// escalón menos cada vez que el cielo avisa que no llega. El escalón medido se guarda: así el
// próximo arranque empieza ahí y no vuelve a pasar por lo que el teléfono no puede.
let automatica: Calidad | null = null;
const oyentes = new Set<() => void>();

/** Lo medido, con el modelo en que se midió: una copia de seguridad puesta en otro iPhone no lo trae. */
const CLAVE = 'moss:calidadMedida';
type Medida = { calidad: Calidad; modelo: string; cuando: number };
/**
 * Pasado este tiempo se vuelve a probar desde la de fábrica: lo medido un día de calor o con el modo
 * de bajo consumo no la deja baja para siempre, y una versión más liviana de Moss tiene su oportunidad.
 */
const VIGENCIA_MS = 30 * 24 * 60 * 60 * 1000;
/** Si el almacenamiento no contesta, el cielo no espera lo guardado más que esto. */
const ESPERA_MAXIMA_MS = 500;

function peor(a: Calidad, b: Calidad): Calidad {
  return ORDEN.indexOf(a) >= ORDEN.indexOf(b) ? a : b;
}

function avisar() {
  oyentes.forEach((o) => o());
}

export function calidadAutomatica(): Calidad {
  automatica ??= calidadDeFabrica();
  return automatica;
}

/** El cielo no llegó con `medida`: si era la automática, baja un escalón y queda guardado. */
export function bajarLaAutomatica(medida: Calidad) {
  const actual = calidadAutomatica();
  // Medida con otra (la elegida en Perfil o la del panel de prueba), no dice nada de la automática.
  if (medida !== actual) return;
  const nueva = unEscalonMenos(actual);
  if (nueva === actual) return;
  automatica = nueva;
  const modelo = Device.modelId;
  if (modelo) {
    const guardar: Medida = { calidad: nueva, modelo, cuando: Date.now() };
    AsyncStorage.setItem(CLAVE, JSON.stringify(guardar)).catch(() => {});
  }
  avisar();
}

/** Lo guardado, si vale para este iPhone y todavía está vigente. */
export function interpretarLaMedida(texto: string | null, modelo: string, ahora: number): Calidad | null {
  if (!texto) return null;
  try {
    const m = JSON.parse(texto) as Partial<Medida>;
    if (!m || !ORDEN.includes(m.calidad as Calidad) || m.modelo !== modelo || typeof m.cuando !== 'number') return null;
    if (ahora - m.cuando > VIGENCIA_MS || m.cuando > ahora) return null;
    return m.calidad as Calidad;
  } catch {
    return null;
  }
}

// Se lee apenas se carga el módulo, en paralelo con el almacén: el cielo espera a esto
// (PantallaDelCielo) para no hornear la textura del fondo dos veces, con la de fábrica y con la medida.
let leida = false;
function leerLaMedida(): Promise<void> {
  const modelo = Device.modelId;
  if (!modelo) {
    leida = true;
    return Promise.resolve();
  }
  const lectura = AsyncStorage.getItem(CLAVE)
    .then((texto) => {
      const guardada = interpretarLaMedida(texto, modelo, Date.now());
      if (!guardada) return;
      const nueva = peor(calidadAutomatica(), guardada);
      if (nueva === automatica) return;
      automatica = nueva;
      // Llegó después de la espera máxima: el cielo ya había arrancado y tiene que enterarse.
      if (leida) avisar();
    })
    .catch(() => {});
  let espera: ReturnType<typeof setTimeout> | undefined;
  const tope = new Promise<void>((listo) => {
    espera = setTimeout(listo, ESPERA_MAXIMA_MS);
  });
  return Promise.race([lectura, tope]).then(() => {
    clearTimeout(espera);
    leida = true;
    avisar();
  });
}
export const laMedidaLeida: Promise<void> = leerLaMedida();

/** Si ya se sabe con qué calidad arrancar (lo guardado ya se leyó o no hay nada que leer). */
export function calidadLeida(): boolean {
  return leida;
}

export function oirLaAutomatica(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function unEscalonMenos(c: Calidad): Calidad {
  return ORDEN[Math.min(ORDEN.indexOf(c) + 1, ORDEN.length - 1)];
}

export function siguiente(c: Calidad): Calidad {
  return ORDEN[(ORDEN.indexOf(c) + 1) % ORDEN.length];
}
