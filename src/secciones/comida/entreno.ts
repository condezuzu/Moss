// Qué comer antes y después de entrenar, con lo de hoy: arma el contexto para la regla
// (src/dominio/alrededorDelEntreno.ts) y dice cada línea en palabras, sin culpa.

import type { Estado } from '@/almacen/almacen';
import { lineasDelDia, sesionesDelDia, type Contexto, type Linea, type Principal } from '@/dominio/alrededorDelEntreno';
import { horasDeSueno } from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { diasEntre } from '@/dominio/fechas';
import { edadDe } from '@/dominio/metas';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { horaDeReloj, horasDeComida, suenoParaAvisos } from '@/recordatorios/programar';
import { t } from '@/textos';
import { metaDelDia, minutosDe } from './datos';

const PRINCIPALES: readonly Principal[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

/** La cafeína de una toma, si se anotó al menos tres de los últimos 14 días: la mediana, en mg. */
function cafeinaPorToma(e: Pick<Estado, 'registros' | 'hoy'>): number | null {
  const tomas = vigentes(e.registros.values()).filter((r) => !r.planificado && (r.valores.micros?.cafeina ?? 0) > 0 && diasEntre(r.dia, e.hoy) >= 0 && diasEntre(r.dia, e.hoy) < 14);
  if (new Set(tomas.map((r) => r.dia)).size < 3) return null;
  const mg = tomas.map((r) => r.valores.micros!.cafeina!).sort((a, b) => a - b);
  return mg[Math.floor(mg.length / 2)];
}

/** Con merienda en al menos 4 de cada 10 días anotados de las dos últimas semanas, cuatro comidas. */
function comidasHabituales(e: Pick<Estado, 'registros' | 'hoy'>): 3 | 4 {
  const recientes = vigentes(e.registros.values()).filter((r) => !r.planificado && diasEntre(r.dia, e.hoy) > 0 && diasEntre(r.dia, e.hoy) <= 14);
  const dias = new Set(recientes.map((r) => r.dia)).size;
  const conMerienda = new Set(recientes.filter((r) => r.comida === 'merienda').map((r) => r.dia)).size;
  return dias > 0 && conMerienda / dias >= 0.4 ? 4 : 3;
}

/** El contexto de hoy para la regla; sin perfil, sin meta o sin sesiones hoy, null. */
export function contextoDeHoy(e: Estado, ahora: Date): Contexto | null {
  const sesiones = sesionesDelDia(e.entreno, e.hoy);
  const meta = metaDelDia(e, e.hoy);
  if (!sesiones.length || !e.perfil || !meta) return null;
  const deSiempre = horasDeComida(e);
  const horaDeComida = Object.fromEntries(PRINCIPALES.map((c) => [c, e.avisos.horario?.[c] ?? deSiempre(c)])) as Record<Principal, number>;
  const anotado: Contexto['anotado'] = {};
  for (const r of vigentes(e.registros.values()).filter((x) => x.dia === e.hoy && !x.planificado)) {
    const antes = anotado[r.comida];
    const hora = minutosDe(r.momento);
    anotado[r.comida] = { hora: antes ? Math.min(antes.hora, hora) : hora, proteina: (antes?.proteina ?? 0) + r.valores.proteina, kcal: (antes?.kcal ?? 0) + r.valores.kcal };
  }
  const sueno = suenoParaAvisos(e);
  const horas = sueno ? horasDeSueno(e.hoy, sueno) : { despertar: null, dormir: null };
  const comido = totalDelDia(e.registros.values(), e.hoy, false);
  return {
    ahora: minutosDe(ahora),
    sesiones,
    horaDeComida,
    anotado,
    meta,
    comido: { kcal: comido.kcal, proteina: comido.proteina, carbohidratos: comido.carbohidratos, grasas: comido.grasas },
    comidasHabituales: comidasHabituales(e),
    pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null,
    edad: edadDe(e.perfil, e.hoy),
    despertar: horas.despertar,
    dormir: horas.dormir,
    cafeinaPorToma: cafeinaPorToma(e),
    sinDeficit: !!e.perfil.sinDeficit,
  };
}

/** Las líneas de hoy, por comida; apagadas en Perfil, ninguna. */
export function lineasDeHoy(e: Estado, ahora = new Date()): Map<Comida, Linea> {
  if (!e.verEntreno) return new Map();
  const c = contextoDeHoy(e, ahora);
  return new Map((c ? lineasDelDia(c) : []).map((l) => [l.comida, l]));
}

/** Lo que dice una línea, en una o dos frases. Sin los números (Perfil › Los números), sin gramos. */
export function textoDeLinea(l: Linea, numeros: boolean): string {
  const hora = horaDeReloj(l.hora);
  const c = numeros ? l.carbohidratos : undefined;
  const p = numeros ? l.proteina : undefined;
  const cuanto = c && p ? t('entreno.cantidades', { c, p }) : p ? t('entreno.soloProteina', { p }) : c ? t('entreno.soloCarbohidratos', { c }) : '';
  const partes: string[] = [];
  if (l.clase === 'previa') partes.push(t('entreno.previa', { hora }), cuanto || t('entreno.previaSinNumeros'));
  else if (l.clase === 'previaLiviana') partes.push(t('entreno.previaLiviana', { hora }), cuanto);
  else if (l.clase === 'snackPrevio') partes.push(c ? t('entreno.snackPrevio', { c }) : t('entreno.snackPrevioSinNumeros'));
  else if (l.clase === 'ayunasLarga') partes.push(c ? t('entreno.ayunasLarga', { c }) : t('entreno.ayunasLargaSinNumeros'));
  else if (l.clase === 'despues') partes.push(p ? t('entreno.despues', { p }) : t('entreno.despuesSinNumeros'));
  else if (l.clase === 'despuesPronto') partes.push(p ? t('entreno.despuesPronto', { p }) : t('entreno.despuesProntoSinNumeros'));
  else if (l.clase === 'reponer') partes.push(t('entreno.reponer', { hora }), cuanto);
  else partes.push(p ? t('entreno.antesDeDormir', { p }) : t('entreno.antesDeDormirSinNumeros'));
  if (l.durantePorHora) partes.push(numeros ? t('entreno.durante', { a: l.durantePorHora[0], b: l.durantePorHora[1] }) : t('entreno.duranteSinNumeros'));
  if (l.cafeinaHasta !== undefined) partes.push(t('entreno.cafeina', { hora: horaDeReloj(l.cafeinaHasta) }));
  return partes.filter(Boolean).join(' ');
}

/** Por qué, según la línea: antes, después, reponer o antes de dormir. */
export function porQueDe(l: Linea): string {
  if (l.clase === 'reponer') return t('entreno.porQue.reponer');
  if (l.clase === 'antesDeDormir') return t('entreno.porQue.antesDeDormir');
  if (l.clase === 'despues' || l.clase === 'despuesPronto') return t('entreno.porQue.despues');
  return t('entreno.porQue.antes');
}
