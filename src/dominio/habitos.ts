// Los hábitos: los crea el usuario, eligen qué días de la semana tocan y se cumplen a mano o solos.

import type { Comida } from './comidas';
import { diaDeLaSemana, sumarDias, type ClaveDia, type DiaSemana } from './fechas';

export type DatoDeSalud = 'pasos' | 'agua' | 'mindfulness' | 'sueno' | 'acostarse';

/** De dónde sale que un hábito se cumpla: a mano o solo, desde Salud, Ascent o la comida. */
export type Fuente =
  | { tipo: 'manual' }
  | { tipo: 'salud'; dato: DatoDeSalud; meta: number }
  | { tipo: 'ascent' }
  /** Con la comida registrada (registros.ts, cumpleLaComida). «Registrar» pide desayuno, almuerzo y cena, o las comidas que se elijan. */
  | { tipo: 'comida'; meta: 'proteina' | 'registrar' | 'calorias'; comidas?: Comida[] };

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
  /** Cuándo cambió por última vez: entre dos teléfonos, gana el más nuevo. */
  actualizado?: string;
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

/**
 * La meta propia de un hábito de Salud como va en su campo (Editor.tsx), en la unidad en que se
 * escribe (pasos, horas, litros o minutos): sin separar los miles, porque un «9.000» se volvía a leer
 * como 9, y con el decimal del idioma, hasta dos decimales.
 */
export function metaParaEscribir(n: number, idioma: 'es' | 'en'): string {
  const texto = String(Math.round(n * 100) / 100);
  return idioma === 'es' ? texto.replace('.', ',') : texto;
}

const MILES = { es: /^\d{1,3}(\.\d{3})+$/, en: /^\d{1,3}(,\d{3})+$/ };

/**
 * Lo escrito en el campo de la meta propia, o null si no es un número. `entero`: el teclado de solo
 * dígitos (pasos y minutos), donde un punto o una coma solo pueden separar miles. Si no (horas y
 * litros), el decimal llega con coma o con punto, porque el teclado sigue la región del iPhone y no el
 * idioma de Moss, y el separador de miles del idioma se saca solo donde separa miles: «1.500» en
 * español, «1,500» en inglés.
 */
export function metaEscrita(texto: string, idioma: 'es' | 'en', entero: boolean): number | null {
  let s = texto.replace(/\s/g, '');
  if (entero) {
    const cifras = s.replace(/\D/g, '');
    return cifras ? Number(cifras) : null;
  }
  if (s.includes(',') && s.includes('.')) {
    // Con los dos, el último separa los decimales y el otro, los miles: «1.500,5», «1,500.5».
    const decimal = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.';
    s = s.split(decimal === ',' ? '.' : ',').join('').replace(decimal, '.');
  } else {
    if (MILES[idioma].test(s)) s = s.replace(/[.,]/g, '');
    s = s.replace(',', '.');
  }
  return /^\d*\.?\d*$/.test(s) && /\d/.test(s) ? Number(s) : null;
}
