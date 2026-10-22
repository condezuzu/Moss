// Hasta que exista el editor (etapa 9), la primera vez se arman estos hábitos de ejemplo: los de
// la galería, repartidos en la semana para que cada día tenga su cantidad y su constelación
// (4 el sábado y el domingo, 5 de lunes a viernes salvo el miércoles, que tiene 6).

import { lunesDe, type ClaveDia, type DiaSemana } from '@/dominio/fechas';
import type { Fuente, Habito } from '@/dominio/habitos';
import type { Idioma } from '@/textos';

const TODOS: DiaSemana[] = [0, 1, 2, 3, 4, 5, 6];
const A_MANO: Fuente = { tipo: 'manual' };

export function habitosDeEjemplo(hoy: ClaveDia, idioma: Idioma): Habito[] {
  const desde = lunesDe(hoy);
  const habito = (id: string, es: string, en: string, icono: string, dias: DiaSemana[], fuente: Fuente, orden: number): Habito => ({
    id: `ejemplo-${id}`, nombre: idioma === 'es' ? es : en, icono, dias, fuente, orden, desde,
  });
  return [
    habito('meditar', 'Meditar 10 min', 'Meditate 10 min', 'figure.mind.and.body', TODOS, A_MANO, 0),
    habito('dormir', 'Dormir 7 h', 'Sleep 7 h', 'moon', TODOS, { tipo: 'salud', dato: 'sueno', meta: 420 }, 1),
    habito('leer', 'Leer 20 páginas', 'Read 20 pages', 'book', [1, 2, 3, 4, 5], A_MANO, 2),
    habito('escribir', 'Escribir', 'Journal', 'pencil', [0, 1, 3, 5], A_MANO, 3),
    habito('pasos', '8.000 pasos', '8,000 steps', 'figure.walk', TODOS, { tipo: 'salud', dato: 'pasos', meta: 8000 }, 4),
    habito('agua', 'Agua 2 L', 'Water 2 L', 'drop', [2, 3, 4, 6], A_MANO, 5),
  ];
}
