// Qué constelación le toca a cada día de la semana (especificación, «Mecánica» 2 y 3).

import type { Constelacion } from '../datos/catalogo';
import { diaDeLaSemana, lunesDe, SEMANA, sumarDias, type ClaveDia, type DiaSemana } from './fechas';

/** La constelación de un día de la semana mientras ese día tiene la misma cantidad de hábitos. */
export type Periodo = {
  dia: DiaSemana;
  constelacion: string;
  cantidad: number;
  desde: ClaveDia;
  /** El último día del período; sin `hasta`, sigue. */
  hasta?: ClaveDia;
};

const ORDEN_DE_TIPO = { constelacion: 0, asterismo: 1, estrella: 2 } as const;

/** Un número entre 0 y 1 que siempre es el mismo para el mismo texto (FNV-1a). */
function azarFijo(texto: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

/**
 * Las de esa cantidad de estrellas. Si no hay ninguna (más hábitos que cualquier constelación de
 * esa cantidad, algo raro), las más chicas de las que tienen más: el día usa sus estrellas más
 * brillantes.
 */
function candidatas(catalogo: Constelacion[], cantidad: number, semilla: string): Constelacion[] {
  const conFigura = (c: Constelacion) => c.estrellas.length === 1 || c.lineas.length > 0;
  let lista = catalogo.filter((c) => c.estrellas.length === cantidad && conFigura(c));
  if (!lista.length) {
    const mayores = catalogo.filter((c) => c.estrellas.length > cantidad && conFigura(c));
    const tope = mayores.length ? Math.min(...mayores.map((c) => c.estrellas.length)) : Math.max(...catalogo.map((c) => c.estrellas.length));
    lista = catalogo.filter((c) => c.estrellas.length === tope);
  }
  // Cada usuario recibe su propio orden: dos personas con los mismos hábitos tienen cielos distintos.
  return [...lista].sort((a, b) => ORDEN_DE_TIPO[a.tipo] - ORDEN_DE_TIPO[b.tipo] || azarFijo(semilla + a.id) - azarFijo(semilla + b.id));
}

export function periodoDe(periodos: Periodo[], clave: ClaveDia): Periodo | undefined {
  const dia = diaDeLaSemana(clave);
  return periodos.find((p) => p.dia === dia && p.desde <= clave && (!p.hasta || clave <= p.hasta));
}

/**
 * Ajusta los períodos a la cantidad de hábitos de cada día. El día que cambia de cantidad pasa
 * desde hoy a otra constelación; la anterior queda guardada con todo su progreso. Al elegir la
 * nueva, en este orden:
 * 1. la que ese mismo día ya tuvo con esa cantidad, si nadie la está usando;
 * 2. una que el usuario nunca tuvo;
 * 3. una que tuvo otro día y ya no usa;
 * 4. si no queda ninguna libre, se repite la menos repetida (D3, «Varios días con la misma cantidad»).
 * Los días que no cambian conservan la suya.
 */
export function asignar(periodos: Periodo[], cantidades: number[], hoy: ClaveDia, catalogo: Constelacion[], semilla: string): Periodo[] {
  // La primera vez arranca el lunes: la semana entera ya tiene sus constelaciones en el universo.
  const desde = periodos.length ? hoy : lunesDe(hoy);
  let lista = periodos.map((p) => ({ ...p }));
  const cambian: DiaSemana[] = [];
  for (const dia of SEMANA) {
    const abierto = lista.find((p) => p.dia === dia && !p.hasta);
    if (abierto && abierto.cantidad === cantidades[dia]) continue;
    if (abierto) {
      // Si había empezado hoy no llegó a existir: se reemplaza en lugar de cerrarse.
      if (abierto.desde >= desde) lista = lista.filter((p) => p !== abierto);
      else abierto.hasta = sumarDias(desde, -1);
    }
    if (cantidades[dia] > 0) cambian.push(dia);
  }
  for (const dia of cambian) {
    const cantidad = cantidades[dia];
    const opciones = candidatas(catalogo, cantidad, semilla);
    const ocupadas = new Set(lista.filter((p) => !p.hasta).map((p) => p.constelacion));
    const usadas = new Set(lista.map((p) => p.constelacion));
    const propias = lista
      .filter((p) => p.dia === dia && p.cantidad === cantidad && p.hasta)
      .sort((a, b) => (a.hasta! < b.hasta! ? 1 : -1))
      .map((p) => p.constelacion);
    const elegida =
      propias.find((id) => !ocupadas.has(id) && opciones.some((c) => c.id === id)) ??
      opciones.find((c) => !usadas.has(c.id))?.id ??
      opciones.find((c) => !ocupadas.has(c.id))?.id ??
      [...opciones].sort((a, b) => cuantas(lista, a.id) - cuantas(lista, b.id))[0].id;
    lista.push({ dia, constelacion: elegida, cantidad, desde });
  }
  return lista;
}

/** Si dos listas tienen los mismos períodos, aunque vengan en otro orden (como bajan de la cuenta). */
export function mismosPeriodos(a: Periodo[], b: Periodo[]): boolean {
  const firma = (lista: Periodo[]) => lista.map((p) => `${p.dia}|${p.desde}|${p.hasta ?? ''}|${p.constelacion}|${p.cantidad}`).sort().join();
  return a.length === b.length && firma(a) === firma(b);
}

const cuantas =(periodos: Periodo[], id: string) => periodos.filter((p) => !p.hasta && p.constelacion === id).length;
