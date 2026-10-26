// Exportar todo, gratis (spec/nutricion.md, «Lo que tienen las otras apps»): lo comido, el peso y
// las metas en CSV, que abre cualquier planilla. Los números van con punto y sin separador de miles,
// para que los lea bien cualquier programa; los nombres de las columnas y de las comidas los pone
// quien llama, en el idioma de la app (src/textos).

import type { Comida } from './comidas';
import type { Peso } from './control';
import type { MetaGuardada } from './metas';
import { gramosDe, vigentes, type Registro } from './registros';

export const COLUMNAS_DE_REGISTROS = [
  'dia', 'comida', 'momento', 'alimento', 'fuente', 'porcion', 'veces', 'gramos',
  'kcal', 'proteina', 'carbohidratos', 'grasas', 'fibra', 'azucares', 'saturadas', 'sodio', 'alcohol', 'planificado',
] as const;
export const COLUMNAS_DE_PESOS = ['fecha', 'kg', 'origen'] as const;
export const COLUMNAS_DE_METAS = ['desde', 'kcal', 'proteina', 'carbohidratos', 'grasas', 'gasto', 'motivo'] as const;

type Valor = string | number | null | undefined;

/** Un campo: entre comillas si tiene comas, comillas o saltos de línea; los números, con hasta dos decimales. */
function campo(v: Valor): string {
  if (v == null) return '';
  const texto = typeof v === 'number' ? String(Math.round(v * 100) / 100) : v;
  return /[",\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}
/** El momento en la hora del teléfono, como lo lee una planilla: «2026-10-26 21:30». En UTC, una cena tarde caía al día siguiente. */
function horaLocal(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
const csv = (cabeza: string[], filas: Valor[][]) => [cabeza, ...filas].map((f) => f.map(campo).join(',')).join('\n') + '\n';

/** Lo comido, sin lo borrado, en el orden del día. */
export function csvDeRegistros(
  registros: Iterable<Registro>,
  op: { columnas: Record<(typeof COLUMNAS_DE_REGISTROS)[number], string>; comida: (c: Comida) => string; si: string; no: string },
): string {
  const lista = vigentes(registros).sort((a, b) => (a.dia === b.dia ? (a.momento < b.momento ? -1 : 1) : a.dia < b.dia ? -1 : 1));
  return csv(COLUMNAS_DE_REGISTROS.map((c) => op.columnas[c]), lista.map((r) => {
    const porcion = r.cantidad && 'porcion' in r.cantidad ? r.cantidad : null;
    const v = r.valores;
    return [
      r.dia, op.comida(r.comida), horaLocal(r.momento), r.nombre, r.fuente, porcion?.porcion, porcion?.veces, gramosDe(r.cantidad),
      v.kcal, v.proteina, v.carbohidratos, v.grasas, v.fibra, v.azucares, v.saturadas, v.sodio, v.alcohol, r.planificado ? op.si : op.no,
    ];
  }));
}

export function csvDePesos(pesos: Peso[], columnas: Record<(typeof COLUMNAS_DE_PESOS)[number], string>): string {
  return csv(COLUMNAS_DE_PESOS.map((c) => columnas[c]), [...pesos].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)).map((p) => [p.fecha, p.kg, p.origen]));
}

export function csvDeMetas(metas: MetaGuardada[], columnas: Record<(typeof COLUMNAS_DE_METAS)[number], string>): string {
  return csv(COLUMNAS_DE_METAS.map((c) => columnas[c]), [...metas].sort((a, b) => (a.desde < b.desde ? -1 : 1)).map((m) => [m.desde, m.kcal, m.proteina, m.carbohidratos, m.grasas, m.gasto, m.motivo]));
}
