// Las fotos de la comida (spec/nutricion.md, «La foto de la comida»): no se analizan, quedan solo en
// el teléfono y pueden ser varias por comida. Una sin comida está sin anotar; con comida y sin
// registros es la de una comida ya anotada, y muestra toda la comida.

import { COMIDAS, type Comida } from './comidas';
import type { ClaveDia } from './fechas';
import type { Registro } from './registros';

export type FotoDeComida = {
  id: string;
  dia: ClaveDia;
  /** Cuándo se sacó, en minutos del día de Moss; desde la tarjeta, la hora de su comida. */
  minutos: number;
  /** Sin comida, está sin anotar. */
  comida: Comida | null;
  /** Lo que se anotó con ella; null, toda su comida (se sacó después de anotarla). */
  registros: string[] | null;
  /** El archivo en la carpeta de las fotos (en la web, la imagen misma). */
  archivo: string;
};

export const sinAnotar = (f: FotoDeComida) => f.comida === null;

/** Las de un día, por la hora en que se sacaron. */
export function fotosDelDia(fotos: readonly FotoDeComida[], dia: ClaveDia): FotoDeComida[] {
  return fotos.filter((f) => f.dia === dia).sort((a, b) => a.minutos - b.minutos);
}

/** La primera foto de una comida de ese día, la que va en su tarjeta. */
export function fotoDeLaComida(fotos: readonly FotoDeComida[], dia: ClaveDia, comida: Comida): FotoDeComida | null {
  return fotosDelDia(fotos, dia).find((f) => f.comida === comida) ?? null;
}

/** Lo anotado con la foto: lo de esa vez, que siga en su comida, o toda su comida. Sin anotar, nada. */
export function loAnotado(f: FotoDeComida, registros: Iterable<Registro>): Registro[] {
  if (!f.comida) return [];
  const deLaComida = [...registros].filter((r) => r.dia === f.dia && r.comida === f.comida && !r.planificado && !r.borrado);
  return f.registros ? deLaComida.filter((r) => f.registros?.includes(r.id)) : deLaComida;
}

/** Anotarla: va a la comida en la que se anotó lo dicho, con eso. */
export const anotada = (f: FotoDeComida, comida: Comida, registros: string[]): FotoDeComida => ({ ...f, comida, registros });

/** Deshacer lo anotado la devuelve a sin anotar: una foto nunca se pierde sin querer. */
export const desanotada = (f: FotoDeComida): FotoDeComida => ({ ...f, comida: null, registros: null });

/** Las de antes (una por comida, «AAAA-MM-DD-comida.jpg»): pasan a ser la foto de toda esa comida. */
export function deLaVersionAnterior(archivo: string, minutos: number): FotoDeComida | null {
  const m = /^(\d{4}-\d{2}-\d{2})-([a-z]+)\.jpg$/.exec(archivo);
  if (!m || !COMIDAS.includes(m[2] as Comida)) return null;
  return { id: `${m[1]}-${m[2]}`, dia: m[1], minutos, comida: m[2] as Comida, registros: null, archivo };
}

/** Lo guardado, solo lo que tiene forma de foto: un archivo roto no deja a Comida sin abrir. */
export function leerFotos(texto: string | null): FotoDeComida[] | null {
  if (!texto) return null;
  try {
    const datos: unknown = JSON.parse(texto);
    if (!Array.isArray(datos)) return null;
    return datos.filter((f): f is FotoDeComida => (
      !!f && typeof f === 'object'
      && typeof f.id === 'string' && typeof f.dia === 'string' && typeof f.minutos === 'number' && typeof f.archivo === 'string'
      && (f.comida === null || COMIDAS.includes(f.comida))
      && (f.registros === null || (Array.isArray(f.registros) && f.registros.every((r: unknown) => typeof r === 'string')))
    ));
  } catch {
    return null;
  }
}
