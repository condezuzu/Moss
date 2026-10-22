// Compartir una receta, una comida guardada o un alimento propio (D12) con la hoja de compartir del
// iPhone: un texto que se lee sin Moss y el enlace moss:// que lo suma del otro lado.

import { Share } from 'react-native';

import { elAlmacen } from '@/almacen';
import { enlaceDe, porPorcion, type Compartido } from '@/dominio/compartir';
import type { Fuente, Valores } from '@/dominio/registros';
import { t } from '@/textos';
import { cantidadDeTexto, numero, sistemaDe } from './datos';

const macros = (v: Valores) => ({ kcal: numero(Math.round(v.kcal)), p: numero(Math.round(v.proteina)), c: numero(Math.round(v.carbohidratos)), g: numero(Math.round(v.grasas)) });

/** Lo que se comparte de una receta o un propio guardado, o null si no es de ellos. */
export function compartidoDe(fuente: Fuente, ref: string): Compartido | null {
  const e = elAlmacen().estado();
  if (fuente === 'receta') {
    const r = e.recetas.get(ref);
    return r && !r.borrado ? { tipo: 'receta', receta: r } : null;
  }
  if (fuente === 'propio') {
    const p = e.propios.get(ref);
    return p && !p.borrado ? { tipo: 'propio', propio: p } : null;
  }
  return null;
}

/** El texto que se lee aunque no se tenga Moss. */
export function textoDe(c: Compartido): string {
  const sistema = sistemaDe(elAlmacen().estado());
  if (c.tipo === 'propio') {
    return [c.propio.marca ? `${c.propio.nombre} · ${c.propio.marca}` : c.propio.nombre, t('compartir.por100', macros(c.propio.por100g))].join('\n');
  }
  const r = c.receta;
  return [
    r.nombre,
    `${r.tipo === 'receta' ? `${t('compartir.rinde', { n: numero(r.porciones) })} · ` : ''}${t('compartir.porPorcion', macros(porPorcion(r)))}`,
    '',
    t('compartir.ingredientes'),
    ...r.items.map((i) => `· ${i.nombre}${i.cantidad ? ` (${cantidadDeTexto(i.cantidad, sistema)})` : ''}`),
  ].join('\n');
}

export async function compartir(fuente: Fuente, ref: string): Promise<void> {
  const c = compartidoDe(fuente, ref);
  if (!c) return;
  await Share.share({ message: `${textoDe(c)}\n\n${t('compartir.enlace')}\n${enlaceDe(c)}` });
}
