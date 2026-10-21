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
};

export const claveDeMarca = (habito: string, dia: ClaveDia) => `${habito}|${dia}`;

export function resumirDia(clave: ClaveDia, habitosDelDia: Habito[], marcas: Marca[], constelacion: string | null): Dia {
  const hecho = new Map<string, Marca>();
  for (const m of marcas) {
    if (m.dia !== clave) continue;
    const antes = hecho.get(m.habito);
    if (!antes || antes.momento <= m.momento) hecho.set(m.habito, m);
  }
  const hechos = habitosDelDia.filter((h) => hecho.get(h.id)?.hecho).map((h) => h.id);
  return {
    clave,
    constelacion,
    habitos: habitosDelDia.map((h) => h.id),
    hechos,
    luz: luzDelDia(hechos.length),
    completo: habitosDelDia.length > 0 && hechos.length === habitosDelDia.length,
  };
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
