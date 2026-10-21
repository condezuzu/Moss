// Los hábitos: los crea el usuario, eligen qué días de la semana tocan y se cumplen a mano o solos.

import { diaDeLaSemana, sumarDias, type ClaveDia, type DiaSemana } from './fechas';

export type DatoDeSalud = 'pasos' | 'agua' | 'mindfulness' | 'sueno' | 'acostarse';

/** De dónde sale que un hábito se cumpla: a mano o solo, desde Salud, Ascent o la comida. */
export type Fuente =
  | { tipo: 'manual' }
  | { tipo: 'salud'; dato: DatoDeSalud; meta: number }
  | { tipo: 'ascent' }
  | { tipo: 'comida'; meta: 'proteina' | 'registrar' | 'calorias' };

export type Habito = {
  id: string;
  /** Lo escribe el usuario: no pasa por el diccionario. */
  nombre: string;
  /** Nombre de SF Symbol. */
  icono: string;
  dias: DiaSemana[];
  fuente: Fuente;
  /** Dentro de un día, el de menor orden va en la estrella más brillante. */
  orden: number;
  /** El primer día en que toca y, si se archivó, el último. */
  desde: ClaveDia;
  hasta?: ClaveDia;
};

export const esAutomatico = (h: Habito) => h.fuente.tipo !== 'manual';

export function tocaElDia(h: Habito, clave: ClaveDia): boolean {
  return h.desde <= clave && (!h.hasta || clave <= h.hasta) && h.dias.includes(diaDeLaSemana(clave));
}

/** Los hábitos de un día, en el orden de sus estrellas. */
export function habitosDelDia(habitos: Habito[], clave: ClaveDia): Habito[] {
  return habitos.filter((h) => tocaElDia(h, clave)).sort((a, b) => a.orden - b.orden || (a.id < b.id ? -1 : 1));
}

/** Cuántos hábitos toca cada día de la semana desde hoy en adelante. */
export function cantidadesPorDia(habitos: Habito[], hoy: ClaveDia): number[] {
  const vigentes = habitos.filter((h) => !h.hasta || h.hasta >= hoy);
  return [0, 1, 2, 3, 4, 5, 6].map((dia) => vigentes.filter((h) => h.dias.includes(dia as DiaSemana)).length);
}

/** Archivar es dejar de tocar desde hoy; lo anotado antes queda. */
export function archivar(h: Habito, hoy: ClaveDia): Habito {
  return { ...h, hasta: sumarDias(hoy, -1) };
}
