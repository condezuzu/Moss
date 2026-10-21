// Datos de mentira de la etapa 1: los mismos que la galería (galeria/src/galeria.js). Se van
// cuando exista el dominio (etapa 2).

import { buscarConstelacion, catalogo, type Constelacion, type Texto } from '@/datos/catalogo';

export type TipoAutomatico = 'pasos' | 'sueno';

export type HabitoDeMentira = {
  nombre: Texto;
  /** Nombre de SF Symbol. */
  icono: string;
  encendido: boolean;
  auto?: TipoAutomatico;
  valor?: number;
  meta?: number;
};

export type DiaDeLaSemana = { dia: number; constelacion: Constelacion; hechos: number; hoy: boolean };

export type DiaDeMentira = {
  constelacion: Constelacion;
  habitos: HabitoDeMentira[];
  frase: { texto: Texto; autor: Texto };
  /** La luz juntada desde siempre: de ahí sale la riqueza del cielo (mundo.ts, riquezaDe). */
  luzAcumulada: number;
  semana: DiaDeLaSemana[];
  fecha: { diaSemana: number; diaMes: number; mes: number };
};

const HABITOS_DE_LA_LIRA: HabitoDeMentira[] = [
  { nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'figure.mind.and.body', encendido: true },
  { nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'moon', encendido: true, auto: 'sueno', valor: 452, meta: 420 },
  { nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'book', encendido: true },
  { nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pencil', encendido: false },
  { nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'figure.walk', encendido: false, auto: 'pasos', valor: 6240, meta: 8000 },
  { nombre: { es: 'Agua 2 L', en: 'Water 2 L' }, icono: 'drop', encendido: false },
];

// Semana de mentira: el lunes y el sábado tienen la misma cantidad, igual que el miércoles y el
// domingo, para ver que cada día recibe una constelación distinta.
const SEMANA = [
  { dia: 1, total: 4, hechos: 4 },
  { dia: 2, total: 5, hechos: 3 },
  { dia: 3, total: 6, hechos: 0, hoy: true },
  { dia: 4, total: 3, hechos: 0 },
  { dia: 5, total: 7, hechos: 0 },
  { dia: 6, total: 4, hechos: 0 },
  { dia: 0, total: 6, hechos: 0 },
];

function semanaDeMentira(hoy: Constelacion): DiaDeLaSemana[] {
  const usadas = new Set([hoy.id]);
  const conLineas = (c: Constelacion) => c.estrellas.length === 1 || c.lineas.length > 0;
  const dias: DiaDeLaSemana[] = [];
  SEMANA.forEach((d) => {
    if (d.hoy) {
      dias.push({ dia: d.dia, constelacion: hoy, hechos: 0, hoy: true });
      return;
    }
    const elegida =
      catalogo.find((x) => x.estrellas.length === d.total && !usadas.has(x.id) && x.tipo === 'constelacion' && conLineas(x)) ??
      catalogo.find((x) => x.estrellas.length === d.total && !usadas.has(x.id) && conLineas(x));
    if (!elegida) return;
    usadas.add(elegida.id);
    dias.push({ dia: d.dia, constelacion: elegida, hechos: d.hechos, hoy: false });
  });
  return dias;
}

export function diaDeMentira(): DiaDeMentira {
  const lira = buscarConstelacion('lyra');
  return {
    constelacion: lira,
    habitos: HABITOS_DE_LA_LIRA.map((h) => ({ ...h })),
    frase: {
      texto: { es: 'Nada grande nace de golpe, ni siquiera un racimo de uvas o un higo.', en: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.' },
      autor: { es: 'Epicteto · Disertaciones I.15', en: 'Epictetus · Discourses I.15' },
    },
    // Tres meses de uso: el cielo queda en la riqueza que se aprobó en la galería (0.6).
    luzAcumulada: 564,
    semana: semanaDeMentira(lira),
    // Miércoles 21 de octubre.
    fecha: { diaSemana: 3, diaMes: 21, mes: 9 },
  };
}
