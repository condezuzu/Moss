// Lo puro de la hoja de registro (la galería 46, aprobada el 9/11/2026): cómo dice el día cuando la
// hoja es de otro día («Tu cena · ayer», «Agregar a la cena de ayer») y cómo queda lo guardado que se
// cambia en Guardadas (una comida guardada, una receta o un alimento tuyo).

import { conMayuscula } from '@/comida/buscar';
import { decimal, leerNumero } from '@/comida/porciones';
import type { Comida } from '@/dominio/comidas';
import { partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { escalar, type AlimentoPropio, type Cantidad, type Item, type Receta, type Valores } from '@/dominio/registros';
import { idioma, lista, t } from '@/textos';

// ------------------------------------------------------------ el día de la hoja
type CualDia = 'hoy' | 'ayer' | 'manana' | 'otro';

function cualDia(dia: ClaveDia, hoy: ClaveDia): CualDia {
  if (dia === hoy) return 'hoy';
  if (dia === sumarDias(hoy, -1)) return 'ayer';
  if (dia === sumarDias(hoy, 1)) return 'manana';
  return 'otro';
}

/** Arriba de la hoja abierta para otro día, chico: «Ayer», «Mañana» o «Vie 16». Para hoy, null. */
export function etiquetaDelDia(dia: ClaveDia, hoy: ClaveDia): string | null {
  const cual = cualDia(dia, hoy);
  if (cual === 'hoy') return null;
  if (cual !== 'otro') return t(`comida.dias.${cual}`);
  const p = partesDe(dia);
  return conMayuscula(t('comida.tituloDia', { dia: lista('fecha.diasCortos')[p.diaSemana], num: p.dia }));
}

/** Lo que sigue al nombre de la comida de otro día: « · ayer», « · viernes 16». Para hoy, nada. */
export function sufijoDelDia(dia: ClaveDia, hoy: ClaveDia): string {
  const cual = cualDia(dia, hoy);
  if (cual === 'hoy') return '';
  if (cual !== 'otro') return ` · ${t(`comida.delDia.${cual}`)}`;
  const p = partesDe(dia);
  return ` · ${t('comida.delDia.otro', { dia: lista('fecha.dias')[p.diaSemana], num: p.dia })}`;
}

/** «Tu cena»; en otro día, «Tu cena · ayer». */
export const tuComidaDe = (comida: Comida, dia: ClaveDia, hoy: ClaveDia) => t(`comida.tuComida.${comida}`) + sufijoDelDia(dia, hoy);

/** «Agregar a la cena»; en otro día, «Agregar a la cena de ayer» o «… del viernes 16» (en inglés, «Log yesterday’s dinner»). */
export function agregarADe(comida: Comida, dia: ClaveDia, hoy: ClaveDia): string {
  const cual = cualDia(dia, hoy);
  if (cual === 'hoy') return t(`comida.agregarA.${comida}`);
  const p = partesDe(dia);
  return t(`comida.agregarADia.${cual}`, {
    aLa: t(`comida.aLa.${comida}`),
    comida: t(`comida.comidas.${comida}`).toLowerCase(),
    dia: `${lista('fecha.dias')[p.diaSemana]} ${p.dia}`,
  });
}

// ------------------------------------------------------------ cambiar lo guardado
/** Un número para llenar un campo: con el decimal del idioma y sin separar los miles, así `leerNumero` lo lee igual. */
export const paraCampo = (n: number) => decimal(Math.round(n * 10) / 10, idioma(), false);

/** Las kcal que dan los macros (4/4/9): las de un campo de kcal vacío. */
export const kcalDeMacros = (proteina: number, carbohidratos: number, grasas: number) => proteina * 4 + carbohidratos * 4 + grasas * 9;

/** Lo que se cambia y se borra desde Guardadas: una comida guardada, una receta o un alimento tuyo. */
export type Guardada = { tipo: 'comida' | 'receta'; x: Receta } | { tipo: 'propio'; x: AlimentoPropio };

/** La cantidad con que se suma de un toque un alimento tuyo: su porción, o 100 g. */
export function porcionDePropio(a: Pick<AlimentoPropio, 'porciones'>): Exclude<Cantidad, null> {
  const porcion = a.porciones[0];
  return porcion ? { porcion: porcion.nombre, gramosPorcion: porcion.gramos, veces: 1 } : { gramos: 100 };
}

/**
 * Lo que se edita, como se escribe en los campos. De una comida guardada o una receta, el nombre y lo
 * que lleva (de la receta, también lo que rinde y lo que pesa terminada); de un alimento tuyo, el nombre,
 * la marca, la porción y, por porción, las kcal y los macros (como en su etiqueta).
 */
export type Edicion = {
  nombre: string;
  items: Item[];
  porciones: string;
  pesoFinal: string;
  marca: string;
  porcion: string;
  kcal: string;
  carbohidratos: string;
  proteina: string;
  grasas: string;
};

const MACROS_DE_PORCION = ['kcal', 'carbohidratos', 'proteina', 'grasas'] as const;

export function edicionDe(g: Guardada): Edicion {
  const vacia: Edicion = { nombre: g.x.nombre, items: [], porciones: '', pesoFinal: '', marca: '', porcion: '', kcal: '', carbohidratos: '', proteina: '', grasas: '' };
  if (g.tipo !== 'propio') return { ...vacia, items: g.x.items, porciones: paraCampo(g.x.porciones), pesoFinal: g.x.pesoFinal ? paraCampo(g.x.pesoFinal) : '' };
  const gramos = g.x.porciones[0]?.gramos ?? 100;
  const e: Edicion = { ...vacia, marca: g.x.marca ?? '', porcion: paraCampo(gramos) };
  for (const k of MACROS_DE_PORCION) e[k] = paraCampo((g.x.por100g[k] * gramos) / 100);
  return e;
}

/** Si se cambió algo: cerrar la hoja pregunta antes de descartarlo. */
export function cambioLaEdicion(g: Guardada, e: Edicion): boolean {
  const antes = edicionDe(g);
  return (Object.keys(antes) as (keyof Edicion)[]).some((k) => (k === 'items' ? e.items.length !== antes.items.length || e.items.some((x, i) => x !== antes.items[i]) : e[k] !== antes[k]));
}

/**
 * Lo guardado con lo editado, para guardarlo con su id; si falta algo (el nombre, lo que lleva, lo que
 * rinde o la porción), null. Lo que no se tocó queda como estaba, sin el redondeo de los campos.
 */
export function conLoEditado(g: Guardada, e: Edicion): Guardada | null {
  const antes = edicionDe(g);
  const nombre = e.nombre.trim();
  if (!nombre) return null;
  if (g.tipo !== 'propio') {
    if (!e.items.length) return null;
    if (g.tipo === 'comida') return { tipo: 'comida', x: { ...g.x, nombre, items: e.items } };
    const porciones = e.porciones === antes.porciones ? g.x.porciones : leerNumero(e.porciones);
    if (!porciones || porciones <= 0) return null;
    const peso = e.pesoFinal === antes.pesoFinal ? g.x.pesoFinal : leerNumero(e.pesoFinal);
    return { tipo: 'receta', x: { ...g.x, nombre, items: e.items, porciones, pesoFinal: peso && peso > 0 ? peso : null } };
  }
  const a = g.x;
  const gramosAntes = a.porciones[0]?.gramos ?? 100;
  const gramos = e.porcion === antes.porcion ? gramosAntes : leerNumero(e.porcion);
  if (!gramos || gramos <= 0) return null;
  // Lo escrito es de la porción, y también lo que no se ve acá (la fibra, el sodio, las vitaminas): si
  // cambia lo que pesa la porción, lo de cada porción sigue igual y cambia lo de 100 g.
  const mismo = gramos === gramosAntes;
  const resto = mismo ? a.por100g : escalar(a.por100g, gramosAntes / gramos);
  const por100 = (k: (typeof MACROS_DE_PORCION)[number]) => {
    if (e[k] === antes[k]) return resto[k];
    const x = leerNumero(e[k]);
    return x === null ? null : (x * 100) / gramos;
  };
  const proteina = por100('proteina') ?? 0;
  const carbohidratos = por100('carbohidratos') ?? 0;
  const grasas = por100('grasas') ?? 0;
  const por100g: Valores = { ...resto, kcal: por100('kcal') ?? kcalDeMacros(proteina, carbohidratos, grasas), proteina, carbohidratos, grasas };
  const porciones = a.porciones.length
    ? [{ ...a.porciones[0], gramos }, ...a.porciones.slice(1)]
    : gramos === 100 ? [] : [{ nombre: `${decimal(gramos, idioma())} g`, gramos }];
  return { tipo: 'propio', x: { ...a, nombre, marca: e.marca.trim() || null, por100g, porciones } };
}
