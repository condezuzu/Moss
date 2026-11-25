// Cómo dice las cosas la sección de Ascent, como la galería (galeria/src/ascent.js): los nombres de los
// ejercicios y los músculos, los pesos en la unidad de cada uno, cuándo fue algo y el titular de hoy en dos líneas.

import { aKg, KG_POR_LIBRA, type Sistema } from '@/dominio/cantidades';
import { diaDeLaSemana, diasEntre, type ClaveDia } from '@/dominio/fechas';
import { esPropio, type Bloque, type Cuando, type Musculo } from '@/dominio/musculos';
import { pesoSiguiente } from '@/dominio/puntajeMuscular';
import { aDosYMedio } from '@/dominio/rendimiento';
import es from '@/textos/es.json';
import { lista, t, type Clave } from '@/textos';
import type { Hoy } from './vista';

/** Un texto de clave armada en el momento (todas están en es.json y en.json: lo comprueba la galería). */
export const tx = (clave: string, variables?: Record<string, string | number>) => t(clave as Clave, variables);

/** El nombre de un ejercicio: el del catálogo de Ascent en el idioma de la app; uno propio, como lo llamó la persona. */
export const nombreDelEjercicio = (b: Pick<Bloque, 'id' | 'ejercicio'>) =>
  b.id && !esPropio(b.id) && b.id in es.ascent.ejercicios ? tx(`ascent.ejercicios.${b.id}`) : b.ejercicio;
export const nombreDelMusculo = (m: Musculo) => tx(`ascent.musculos.nombres.${m}`);
/** Un nombre en el medio de una frase: «en sentadilla», «in squat». */
export const enFrase = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const conMayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** «a, b y c». */
export const enLista = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} ${t('ascent.y')} ${xs[xs.length - 1]}`);
/** Los nombres de unos músculos en una lista: «cuádriceps y glúteos». */
export const listaDeMusculos = (ms: readonly Musculo[]) => enLista(ms.map((m) => nombreDelMusculo(m).toLowerCase()));
export const cuandoDe = (c: Cuando) => tx(`ascent.titular.cuando.${c}`);

// Los pesos llegan de Ascent en kg y la meta se guarda en kg: con el sistema imperial de Moss, se dicen en libras.
/** El peso de una serie o de una marca: en libras, al medio, como en Ascent (así lo anotado en libras vuelve igual). */
export const pesoEn = (kg: number, s: Sistema) => (s === 'imperial' ? Math.round((kg / KG_POR_LIBRA) * 2) / 2 : kg);

/**
 * El peso de la próxima vez (pesoSiguiente, igual en Ascent). En libras, sobre lo de la última vez y con su paso
 * redondeado para abajo a lo que se carga, de a 2,5 lb: los 2,5 kg son 5 lb (el disco chico de cada lado) y el kilo,
 * 2,5 lb (de a 5, una mancuerna de 20 lb volvía a 20).
 */
export function siguienteEn(kg: number, s: Sistema): number | null {
  const siguiente = pesoSiguiente(kg);
  if (s !== 'imperial' || siguiente === null) return siguiente;
  return pesoEn(kg, s) + Math.max(2.5, Math.floor((siguiente - kg) / KG_POR_LIBRA / 2.5) * 2.5);
}

/** El nivel de hoy de una meta, como se carga en la barra: de a 2,5 kg o de a 5 lb. */
export const nivelEn = (kg: number, s: Sistema) => (s === 'imperial' ? Math.round(kg / KG_POR_LIBRA / 5) * 5 : aDosYMedio(kg));

/** Lo escrito en la meta nueva, en kg para guardar: de libras, con dos decimales (225 lb vuelven como 225). */
export function kilosDeLaMeta(escrito: string, s: Sistema): number {
  const n = Number(escrito.replace(',', '.'));
  return s === 'imperial' ? Math.round(aKg(n, s) * 100) / 100 : n;
}

/** Los textos de los pesos dicen «kg», como en Ascent: en libras, la misma frase con «lb» (como progreso/unidades.ts). */
export const enLaUnidad = (frase: string, s: Sistema) => (s === 'imperial' ? frase.replace(/\bkg\b/g, 'lb') : frase);

/** «hoy», «ayer» o «el lunes». */
export function cuandoFue(fecha: ClaveDia, hoy: ClaveDia): string {
  const dias = diasEntre(fecha, hoy);
  if (dias === 0) return t('ascent.recuperado.cuando.hoy');
  if (dias === 1) return t('ascent.recuperado.cuando.ayer');
  return t('ascent.recuperado.cuando.dia', { dia: lista('fecha.dias')[diaDeLaSemana(fecha)] });
}

const ORDEN: readonly Cuando[] = ['ya', 'hoy', 'manana', 'pasadoManana', 'enUnosDias'];
/** Cuándo van a estar listos unos músculos: el más lento de todos. */
export const cuandoTodos = (musculos: readonly { cuando: Cuando }[]) => musculos.reduce<Cuando>((a, m) => (ORDEN.indexOf(m.cuando) > ORDEN.indexOf(a) ? m.cuando : a), 'ya');

/** El titular y su línea, según el caso: lo que todavía no está se nombra, no todo lo de hoy. */
export function textosDelTitular(h: Hoy): [string, string] {
  const que = h.titular.que;
  const musculos = listaDeMusculos(h.musculosHoy);
  const sesion = enFrase(h.sesion?.nombre ?? '');
  if (que === 'hecha') {
    const cuando = cuandoTodos(h.despues ? h.despues.musculos : []);
    return [t('ascent.titular.hecha.titulo', { sesion }), cuando === 'ya' ? t('ascent.titular.hecha.yaListos') : t('ascent.titular.hecha.texto', { musculos, cuando: cuandoDe(cuando) })];
  }
  if (que === 'descanso' || que === 'sinHorario') {
    const falta = h.f.musculos.filter((m) => m.estado !== 'recuperado').sort((a, b) => b.residual - a.residual)[0];
    return [
      tx(`ascent.titular.${que}.titulo`),
      falta ? t('ascent.titular.descanso.texto', { musculo: nombreDelMusculo(falta.musculo).toLowerCase(), cuando: cuandoDe(falta.cuando) }) : t('ascent.titular.descanso.listos'),
    ];
  }
  if (que === 'faltaNoche') return [t('ascent.titular.faltaNoche.titulo'), t('ascent.titular.faltaNoche.texto', { sesion })];
  const faltan = h.f.musculos.filter((m) => m.estado !== 'recuperado');
  const deFaltan = faltan.length ? listaDeMusculos(faltan.map((m) => m.musculo)) : musculos;
  if (que === 'cargado') return [t('ascent.titular.cargado.titulo'), t('ascent.titular.cargado.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
  if (que === 'suenoCorto') {
    const n = h.noche;
    const porque = n && (n.estado === 'corta' || n.estado === 'muyCorta') ? ((n.despertoAntes ?? 0) >= 60 && n.dormido > 360 ? 'temprano' : 'poco') : 'seguidas';
    return [t('ascent.titular.suenoCorto.titulo'), tx(`ascent.titular.suenoCorto.${porque}`)];
  }
  if (que === 'teSientes') return [t('ascent.titular.teSientes.titulo'), t('ascent.titular.teSientes.texto')];
  if (que === 'casi') return [t('ascent.titular.casi.titulo'), t('ascent.titular.casi.texto', { musculos: deFaltan, cuando: cuandoDe(cuandoTodos(faltan)) })];
  return [t('ascent.titular.listo.titulo', { sesion }), t('ascent.titular.listo.texto')];
}
