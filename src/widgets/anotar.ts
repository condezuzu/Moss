// El widget Anotar (spec/widgets.md, D43): no guarda nada, así que puede tener una entrada por comida:
// el título dice la que toca («Anotar la cena») y cambia solo, aunque no se abra Moss.

import { comidaDeLaHora, type Comida } from '@/dominio/comidas';
import type { PropsAnotar } from './tipos';

type Entrada = { date: Date; props: PropsAnotar };

const MEDIA_HORA = 30 * 60 * 1000;
/** Un día y medio: hasta entonces, el título sigue solo. Moss la escribe de nuevo cada vez que se abre. */
const HORAS = 36;

/** Desde ahora, una entrada cada vez que cambia la comida de la hora. */
export function lineaDeAnotar(ahora: Date, d: {
  titulos: Record<Comida, string>;
  queda: string;
  acciones: PropsAnotar['acciones'];
  url: string;
  decirTitulo: string;
  fondo?: string;
}): Entrada[] {
  const entradas: Entrada[] = [];
  const comun = { queda: d.queda, acciones: d.acciones, url: d.url, decirTitulo: d.decirTitulo, fondo: d.fondo ?? '' };
  const comidaEn = (f: Date) => comidaDeLaHora(f.getHours() * 60 + f.getMinutes());
  let antes = comidaEn(ahora);
  entradas.push({ date: ahora, props: { ...comun, titulo: d.titulos[antes] } });
  // Las franjas empiezan en punto o y media: de a media hora no se pierde ningún cambio.
  const primera = Math.ceil(ahora.getTime() / MEDIA_HORA) * MEDIA_HORA;
  for (let t = primera; t < ahora.getTime() + HORAS * 3600 * 1000; t += MEDIA_HORA) {
    const f = new Date(t);
    const c = comidaEn(f);
    if (c === antes) continue;
    antes = c;
    entradas.push({ date: f, props: { ...comun, titulo: d.titulos[c] } });
  }
  return entradas;
}
