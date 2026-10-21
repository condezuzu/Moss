// Lo que pasó cada día: las marcas (hecho o no, por hábito) y el resumen que queda guardado.

import type { ClaveDia } from './fechas';
import type { Habito } from './habitos';
import { luzDelDia } from './luz';

export type Origen = 'toque' | 'deshacer' | 'salud' | 'ascent' | 'comida';

/** El último estado de un hábito en un día: si hay dos cambios, gana el último. */
export type Marca = { habito: string; dia: ClaveDia; hecho: boolean; momento: string; origen: Origen };

export type Dia = {
  clave: ClaveDia;
  constelacion: string | null;
  /** Los hábitos que tocaban ese día, en orden. Quedan fijos aunque después cambien los hábitos. */
  habitos: string[];
  hechos: string[];
  luz: number;
  completo: boolean;
  /** Cuándo se resumió por última vez: entre dos teléfonos, gana el más nuevo. */
  actualizado?: string;
};

export const claveDeMarca = (habito: string, dia: ClaveDia) => `${habito}|${dia}`;

function armarDia(clave: ClaveDia, habitos: string[], marcas: Marca[], constelacion: string | null): Dia {
  const hecho = new Map<string, Marca>();
  for (const m of marcas) {
    if (m.dia !== clave) continue;
    const antes = hecho.get(m.habito);
    if (!antes || antes.momento <= m.momento) hecho.set(m.habito, m);
  }
  const hechos = habitos.filter((id) => hecho.get(id)?.hecho);
  return { clave, constelacion, habitos, hechos, luz: luzDelDia(hechos.length), completo: habitos.length > 0 && hechos.length === habitos.length };
}

export function resumirDia(clave: ClaveDia, habitosDelDia: Habito[], marcas: Marca[], constelacion: string | null): Dia {
  return armarDia(clave, habitosDelDia.map((h) => h.id), marcas, constelacion);
}

/** Un día ya vivido con lo hecho según estas marcas: los hábitos que tocaban y la constelación quedan los suyos. */
export function rehacerDia(dia: Dia, marcas: Marca[]): Dia {
  return armarDia(dia.clave, dia.habitos, marcas, dia.constelacion);
}

/** Si dos resúmenes dicen lo mismo, sin mirar cuándo se hicieron ni el orden de sus campos. */
export function mismoResumen(a: Dia | undefined, b: Dia): boolean {
  return !!a && a.clave === b.clave && a.constelacion === b.constelacion && a.luz === b.luz && a.completo === b.completo
    && a.habitos.join() === b.habitos.join() && a.hechos.join() === b.hechos.join();
}

/** La luz de todos los días o, con `antesDe`, solo la de los días anteriores a ese. */
export function luzAcumulada(dias: Iterable<Dia>, antesDe?: ClaveDia): number {
  let suma = 0;
  for (const d of dias) if (!antesDe || d.clave < antesDe) suma += d.luz;
  return suma;
}

/** Lo que juntó cada constelación en los días en que le tocó: queda aunque cambien los hábitos. */
export function progresoPorConstelacion(dias: Iterable<Dia>): Map<string, { luz: number; completos: number; dias: number }> {
  const progreso = new Map<string, { luz: number; completos: number; dias: number }>();
  for (const d of dias) {
    if (!d.constelacion) continue;
    const p = progreso.get(d.constelacion) ?? { luz: 0, completos: 0, dias: 0 };
    p.luz += d.luz;
    p.completos += d.completo ? 1 : 0;
    p.dias += 1;
    progreso.set(d.constelacion, p);
  }
  return progreso;
}
