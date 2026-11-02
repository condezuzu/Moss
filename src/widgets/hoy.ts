// El widget Hoy (spec/widgets.md, D43): lo que la app escribe en su línea de tiempo y lo que lee de vuelta.
// Va una entrada por día: un toque se guarda solo en la entrada que se ve (expo-widgets, AppIntent.swift),
// así que con una por comida lo anotado se perdería al cambiar de entrada. Por eso todas las comidas del
// día están a la vista. Un toque anota tu comida de siempre, o lo del plan de hoy, y queda en la entrada;
// al abrir Moss se anota por el almacén, con la hora del toque. Otro toque lo deshace, también después.

import type { Estado } from '@/almacen/almacen';
import { HORA_TIPICA, type Comida } from '@/dominio/comidas';
import { minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import type { Macros } from '@/dominio/metas';
import { sugerenciaVencida } from '@/dominio/plan';
import { deSiempre, delDia, sumarValores, type Item, type Registro } from '@/dominio/registros';
import { comienzoDe, DIAS_ARMADOS, DIAS_QUE_ESPERA } from './cielo';
import type { ComidaDeHoy, PropsHoy, ToqueDeComida, ValoresDelWidget } from './tipos';

type Entrada = { date: Date; props: PropsHoy };
type ParaHoy = Pick<Estado, 'hoy' | 'registros'> & Partial<Pick<Estado, 'corte'>>;

/** Las comidas que siempre están a la vista. El snack aparece si se anotó. */
export const COMIDAS_DE_HOY: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

const claveDe = (dia: ClaveDia, comida: Comida) => `${dia}|${comida}`;
const redondo = (x: number) => Math.round(x * 10) / 10;
const aWidget = (v: Macros): ValoresDelWidget => ({ kcal: redondo(v.kcal), p: redondo(v.proteina), c: redondo(v.carbohidratos), g: redondo(v.grasas) });
const sumaDe = (lista: readonly Pick<Item, 'valores'>[]) => aWidget(sumarValores(lista.map((x) => x.valores)));

/**
 * La línea de tiempo: hoy, con lo anotado, y los días que siguen sin nada, cada uno desde que empieza.
 * `deshacer` dice qué se anotó con un toque de este widget (por día y comida, los registros con comas).
 */
export function lineaDeHoy(e: ParaHoy, d: {
  metaDe: (dia: ClaveDia) => Macros | null;
  nombres: Record<Comida, string>;
  textos: PropsHoy['textos'];
  urls: PropsHoy['urls'];
  fondo?: string;
  deshacer?: ReadonlyMap<string, string>;
}): Entrada[] {
  const todos = [...e.registros.values()];
  const deSiempreHoy = new Map(COMIDAS_DE_HOY.map((c) => [c, deSiempre(todos, c, e.hoy)]));
  const entradas: Entrada[] = [];
  for (let k = 0; k < DIAS_ARMADOS; k++) {
    const dia = sumarDias(e.hoy, k);
    const lista = delDia(todos, dia).filter((r) => !sugerenciaVencida(r, e.hoy));
    const comidos = lista.filter((r) => !r.planificado);
    const hayEn = (c: Comida) => comidos.some((r) => r.comida === c);
    const comidas = [...COMIDAS_DE_HOY, ...(hayEn('snack') ? ['snack' as const] : [])].map((tipo): ComidaDeHoy & { minutos: number } => {
      const anotados = comidos.filter((r) => r.comida === tipo);
      const delPlan = lista.filter((r) => r.planificado && r.comida === tipo);
      const siempre: readonly Item[] = delPlan.length ? delPlan : (deSiempreHoy.get(tipo) ?? []);
      const vivos = new Set(comidos.map((r: Registro) => r.id));
      const ids = (d.deshacer?.get(claveDe(dia, tipo)) ?? '').split(',').filter((id) => vivos.has(id));
      const mostrar = anotados.length ? anotados : siempre;
      return {
        tipo,
        nombre: d.nombres[tipo],
        anotado: sumaDe(anotados),
        detalle: mostrar.map((x) => x.nombre).join(', '),
        siempre: sumaDe(siempre),
        // Lo del plan ya está guardado: se confirma. Lo de siempre viaja en la entrada.
        items: delPlan.length ? '' : JSON.stringify(siempre.map(({ fuente, ref, nombre, cantidad, valores, estimado }) => ({ fuente, ref, nombre, cantidad, valores, ...(estimado ? { estimado } : {}) }))),
        deshacer: ids.join(','),
        minutos: anotados.length ? minutosEnElDia(new Date(anotados[0].momento), dia) : tipo === 'snack' ? 0 : HORA_TIPICA[tipo],
      };
    });
    const meta = d.metaDe(dia);
    entradas.push({
      date: comienzoDe(dia, e.corte),
      props: {
        dia,
        meta: meta ? aWidget(meta) : { kcal: 0, p: 0, c: 0, g: 0 },
        comido: sumaDe(comidos),
        comidas: comidas.sort((a, b) => a.minutos - b.minutos).map(({ minutos: _m, ...c }) => c),
        pendientes: [],
        textos: d.textos,
        urls: d.urls,
        fondo: d.fondo ?? '',
      },
    });
  }
  return entradas;
}

export type ToqueDeHoy = ToqueDeComida & { dia: ClaveDia; items: Item[]; plan: boolean; deshacer: string[] };

/** Lo tocado en toda la línea, con lo que mostraba la entrada: de cada día y comida, el último toque. */
export function toquesDeHoy(linea: { props: unknown }[]): ToqueDeHoy[] {
  const ultimos = new Map<string, ToqueDeHoy>();
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsHoy>;
    if (typeof p.dia !== 'string' || !Array.isArray(p.pendientes) || !Array.isArray(p.comidas)) continue;
    for (const t of p.pendientes) {
      if (!t || typeof t.en !== 'number' || !Number.isFinite(t.en)) continue;
      const c = p.comidas.find((x) => x.tipo === t.comida);
      if (!c) continue;
      const clave = claveDe(p.dia, t.comida);
      const antes = ultimos.get(clave);
      if (antes && antes.en > t.en) continue;
      let items: Item[] = [];
      try {
        items = c.items ? JSON.parse(c.items) : [];
      } catch {
        items = [];
      }
      ultimos.set(clave, { comida: t.comida, hecho: !!t.hecho, en: t.en, dia: p.dia, items, plan: !c.items, deshacer: c.deshacer ? c.deshacer.split(',') : [] });
    }
  }
  return [...ultimos.values()];
}

/** Lo que la línea dice que se anotó con un toque: se conserva al escribirla de nuevo. */
export function deshacerDeLaLinea(linea: { props: unknown }[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const { props } of linea) {
    const p = (props ?? {}) as Partial<PropsHoy>;
    if (typeof p.dia !== 'string' || !Array.isArray(p.comidas)) continue;
    for (const c of p.comidas) if (c?.deshacer) m.set(claveDe(p.dia, c.tipo), c.deshacer);
  }
  return m;
}

export type QueHacerConHoy = {
  anotar: { clave: string; dia: ClaveDia; comida: Comida; items: Item[]; en: number }[];
  confirmar: { clave: string; dia: ClaveDia; comida: Comida }[];
  /** Ya estaba anotado por este mismo toque (la línea no llegó a escribirse): no se repite. */
  yaAnotado: { clave: string; ids: string[] }[];
  quitar: { clave: string; ids: string[] }[];
};

/**
 * Qué hacer con cada toque. Se aplica lo de hoy y lo de hasta DIAS_QUE_ESPERA atrás; lo de un día que
 * no llegó se olvida. Anotar se reconoce por la hora del toque: un toque nunca anota dos veces.
 */
export function repartirToquesDeHoy(toques: readonly ToqueDeHoy[], e: Pick<Estado, 'hoy' | 'registros'>): QueHacerConHoy {
  const r: QueHacerConHoy = { anotar: [], confirmar: [], yaAnotado: [], quitar: [] };
  const desde = sumarDias(e.hoy, -DIAS_QUE_ESPERA);
  const todos = [...e.registros.values()];
  for (const t of toques) {
    if (t.dia > e.hoy || t.dia < desde) continue;
    const clave = claveDe(t.dia, t.comida);
    if (!t.hecho) {
      if (t.deshacer.length) r.quitar.push({ clave, ids: t.deshacer });
      continue;
    }
    if (t.deshacer.length) continue;
    const delToque = delDia(todos, t.dia).filter((x) => !x.planificado && x.comida === t.comida && Math.abs(Date.parse(x.momento) - t.en) < 1000);
    if (delToque.length) r.yaAnotado.push({ clave, ids: delToque.map((x) => x.id) });
    else if (t.plan) r.confirmar.push({ clave, dia: t.dia, comida: t.comida });
    else if (t.items.length) r.anotar.push({ clave, dia: t.dia, comida: t.comida, items: t.items, en: t.en });
  }
  return r;
}
