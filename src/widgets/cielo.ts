// El widget del cielo (spec/widgets.md): lo que la app escribe en su línea de tiempo y lo que lee de
// vuelta. Va una entrada por día, desde hoy y los seis que siguen, así a la medianoche el widget pasa
// solo al día nuevo aunque no se abra Moss. Los «hecho» del widget corren en la extensión y quedan en
// su entrada, con su día; la app los aplica por el almacén con la clave hábito:día (gana el último).

import type { Estado } from '@/almacen/almacen';
import { encajar, proyectar } from '@/cielo/mundo';
import type { Constelacion } from '@/datos/catalogo';
import { periodoDe } from '@/dominio/constelaciones';
import { claveDeMarca } from '@/dominio/dias';
import { partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { esAutomatico, habitosDelDia } from '@/dominio/habitos';
import type { PropsCielo, ToqueDelWidget } from './tipos';

/** La proporción de la caja de la figura: la misma que dibujan Cielo.widget.tsx y la galería. */
export const ASPECTO = 1.7;
/** Hoy y los seis días que siguen: una semana sin abrir Moss y el widget sigue en su día. */
export const DIAS_ARMADOS = 7;
/** Lo tocado en un día que ya pasó espera, como mucho, lo que el almacén tiene de marcas a mano. */
export const DIAS_QUE_ESPERA = 14;

export type ToqueConDia = ToqueDelWidget & { dia: ClaveDia };
type Entrada = { date: Date; props: PropsCielo };
type ParaElCielo = Pick<Estado, 'hoy' | 'habitos' | 'periodos' | 'dias' | 'marcas'>;

const redondo = (x: number) => Math.round(x * 1000) / 1000;

/**
 * Las estrellas de la constelación de un día con esa cantidad de hábitos, de 0 a 1 en una caja de
 * proporción ASPECTO (la y hacia abajo), con su tamaño por el brillo. Con más estrellas que hábitos,
 * el día usa las más brillantes, como el cielo de la app (src/cielo/dia.ts).
 */
export function formaDeLaConstelacion(c: Constelacion | null, cantidad: number): Pick<PropsCielo, 'estrellas' | 'lineas'> {
  if (!c || cantidad === 0) return { estrellas: [], lineas: [] };
  const estrellas = c.estrellas.slice(0, Math.max(1, Math.min(cantidad, c.estrellas.length)));
  const plano = encajar(proyectar(estrellas), [0, 0], ASPECTO, 1);
  return {
    estrellas: plano.map(([x, y], i) => [
      redondo((x + ASPECTO / 2) / ASPECTO),
      redondo(0.5 - y),
      redondo(Math.max(0, Math.min(1, (2.2 - 0.5 * estrellas[i].mag) / 2.5))),
    ]),
    lineas: c.lineas.filter(([a, b]) => a < estrellas.length && b < estrellas.length).map(([a, b]) => [a, b]),
  };
}

/** La medianoche del teléfono al empezar ese día. */
export function comienzoDe(clave: ClaveDia): Date {
  const p = partesDe(clave);
  return new Date(p.anio, p.mes, p.dia);
}

/**
 * La línea de tiempo del widget: hoy, con lo hecho, y los días que siguen con todo apagado. Los
 * toques de días anteriores que todavía esperan van en la primera entrada.
 */
export function lineaDelCielo(e: ParaElCielo, d: {
  catalogo: Constelacion[];
  idioma: 'es' | 'en';
  textos: PropsCielo['textos'];
  url: string;
  atrasados?: ToqueConDia[];
}): Entrada[] {
  const entradas: Entrada[] = [];
  for (let k = 0; k < DIAS_ARMADOS; k++) {
    const dia = sumarDias(e.hoy, k);
    const habitos = habitosDelDia(e.habitos, dia);
    const id = e.dias.get(dia)?.constelacion ?? periodoDe(e.periodos, dia)?.constelacion;
    const c = (id && d.catalogo.find((x) => x.id === id)) || null;
    entradas.push({
      date: comienzoDe(dia),
      props: {
        dia,
        nombre: c && habitos.length ? c.nombres[d.idioma] : '',
        ...formaDeLaConstelacion(c, habitos.length),
        habitos: habitos.map((h) => ({ id: h.id, nombre: h.nombre, aMano: !esAutomatico(h), hecho: e.marcas.get(claveDeMarca(h.id, dia))?.hecho ?? false })),
        pendientes: [],
        atrasados: k === 0 ? (d.atrasados ?? []).map((x) => ({ id: x.id, dia: x.dia, hecho: x.hecho, en: x.en })) : [],
        textos: d.textos,
        url: d.url,
      },
    });
  }
  return entradas;
}

const esToque = (x: unknown): x is ToqueDelWidget => {
  const t = x as ToqueDelWidget | null;
  return !!t && typeof t.id === 'string' && typeof t.en === 'number' && Number.isFinite(t.en);
};

/**
 * Lo tocado en toda la línea, cada toque con su día: los pendientes de cada entrada y los atrasados
 * de la primera. De cada hábito y día queda el último.
 */
export function toquesDeLaLinea(linea: { props: unknown }[]): ToqueConDia[] {
  const ultimos = new Map<string, ToqueConDia>();
  const sumar = (t: ToqueConDia) => {
    const clave = claveDeMarca(t.id, t.dia);
    const antes = ultimos.get(clave);
    if (!antes || antes.en <= t.en) ultimos.set(clave, t);
  };
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsCielo>;
    if (typeof p.dia === 'string' && Array.isArray(p.pendientes)) {
      for (const t of p.pendientes) if (esToque(t)) sumar({ id: t.id, hecho: !!t.hecho, en: t.en, dia: p.dia });
    }
    if (Array.isArray(p.atrasados)) {
      for (const t of p.atrasados) if (esToque(t) && typeof t.dia === 'string') sumar({ id: t.id, hecho: !!t.hecho, en: t.en, dia: t.dia });
    }
  }
  return [...ultimos.values()];
}

/**
 * Qué hacer con cada toque. Los de hoy se aplican si cambian algo y si lo que tiene el almacén de ese
 * hábito ese día es más viejo (gana el último). Los de días anteriores, que el almacén todavía no
 * marca, esperan hasta DIAS_QUE_ESPERA. El resto (un hábito que ya no está, uno automático, un día
 * que no llegó) se olvida.
 */
export function repartirToques(toques: ToqueConDia[], e: Pick<Estado, 'hoy' | 'habitos' | 'marcas'>): { aplicar: ToqueConDia[]; esperan: ToqueConDia[] } {
  const aplicar: ToqueConDia[] = [];
  const esperan: ToqueConDia[] = [];
  const desde = sumarDias(e.hoy, -DIAS_QUE_ESPERA);
  for (const t of toques) {
    if (t.dia > e.hoy || t.dia < desde) continue;
    const h = habitosDelDia(e.habitos, t.dia).find((x) => x.id === t.id);
    if (!h || esAutomatico(h)) continue;
    const marca = e.marcas.get(claveDeMarca(t.id, t.dia));
    if (marca && Date.parse(marca.momento) >= t.en) continue;
    if ((marca?.hecho ?? false) === t.hecho) continue;
    (t.dia === e.hoy ? aplicar : esperan).push(t);
  }
  return { aplicar, esperan };
}
