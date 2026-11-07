// El widget Anotar (spec/widgets.md, D43): no guarda nada, así que puede tener una entrada por comida:
// el título dice la que toca («Anotar la cena») y cambia solo, aunque no se abra Moss.

import { comidaDeLaHora, type Comida } from '@/dominio/comidas';
import { diaLogico, type ClaveDia } from '@/dominio/fechas';
import type { PropsAnotar } from './tipos';

type Entrada = { date: Date; props: PropsAnotar };

const MEDIA_HORA = 30 * 60 * 1000;
/** Un día y medio: hasta entonces, el título sigue solo. Moss la escribe de nuevo cada vez que se abre. */
const HORAS = 36;

/**
 * Desde ahora, una entrada cada vez que cambia la comida de la hora o empieza otro día (D32), cada una
 * con lo que queda de su día y abriendo la hoja en su comida.
 */
export function lineaDeAnotar(ahora: Date, d: {
  titulos: Record<Comida, string>;
  /** «te quedan 1.025» de un día, o vacío. */
  queda: (dia: ClaveDia) => string;
  /** A qué hora empieza el día, en minutos desde la medianoche. */
  corte: number;
  acciones: PropsAnotar['acciones'];
  /** Con {comida}: la de cada entrada. */
  url: string;
  decirTitulo: string;
  fondo?: string;
}): Entrada[] {
  const entradas: Entrada[] = [];
  const comun = { acciones: d.acciones, decirTitulo: d.decirTitulo, fondo: d.fondo ?? '' };
  const comidaEn = (f: Date) => comidaDeLaHora(f.getHours() * 60 + f.getMinutes(), d.corte);
  const entrada = (f: Date, comida: Comida, dia: ClaveDia): Entrada => ({ date: f, props: { ...comun, titulo: d.titulos[comida], queda: d.queda(dia), url: d.url.replace('{comida}', comida) } });
  let antes = { comida: comidaEn(ahora), dia: diaLogico(ahora, d.corte) };
  entradas.push(entrada(ahora, antes.comida, antes.dia));
  // Las franjas y el corte empiezan en punto o y media: de a media hora no se pierde ningún cambio.
  const primera = Math.ceil(ahora.getTime() / MEDIA_HORA) * MEDIA_HORA;
  for (let t = primera; t < ahora.getTime() + HORAS * 3600 * 1000; t += MEDIA_HORA) {
    const f = new Date(t);
    const ahi = { comida: comidaEn(f), dia: diaLogico(f, d.corte) };
    if (ahi.comida === antes.comida && ahi.dia === antes.dia) continue;
    antes = ahi;
    entradas.push(entrada(f, ahi.comida, ahi.dia));
  }
  return entradas;
}
