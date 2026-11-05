// Qué comer antes y después de entrenar, con lo de hoy: arma el contexto para la regla
// (src/dominio/alrededorDelEntreno.ts) y dice cada línea en palabras, sin culpa.

import type { Estado } from '@/almacen/almacen';
import { comidasHabituales, lineaDeNocheCorta, lineasDelDia, sesionesDelDia, type Contexto, type Linea, type Principal } from '@/dominio/alrededorDelEntreno';
import { horasDeSueno } from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { diasEntre, minutosEnElDia, sumarDias } from '@/dominio/fechas';
import { edadDe } from '@/dominio/metas';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { pareceIncompleta, ultimasNoches } from '@/dominio/sueno';
import { hayCompras } from '@/lib/premium';
import { horaDeReloj, horasDeComida, suenoParaAvisos } from '@/recordatorios/programar';
import { t } from '@/textos';
import { suenoDe } from '../persona';
import { duracion, metaDelDia } from './datos';

const PRINCIPALES: readonly Principal[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

/** La cafeína de una toma, si se anotó al menos tres de los últimos 14 días: la mediana, en mg. */
function cafeinaPorToma(e: Pick<Estado, 'registros' | 'hoy'>): number | null {
  const tomas = vigentes(e.registros.values()).filter((r) => !r.planificado && (r.valores.micros?.cafeina ?? 0) > 0 && diasEntre(r.dia, e.hoy) >= 0 && diasEntre(r.dia, e.hoy) < 14);
  if (new Set(tomas.map((r) => r.dia)).size < 3) return null;
  const mg = tomas.map((r) => r.valores.micros!.cafeina!).sort((a, b) => a - b);
  return mg[Math.floor(mg.length / 2)];
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
    const hora = minutosEnElDia(new Date(r.momento), e.hoy);
    // Del snack, la última vez: el de después de la cena es el que cuenta para antes de dormir.
    const cuando = !antes ? hora : r.comida === 'snack' ? Math.max(antes.hora, hora) : Math.min(antes.hora, hora);
    anotado[r.comida] = { hora: cuando, proteina: (antes?.proteina ?? 0) + r.valores.proteina, kcal: (antes?.kcal ?? 0) + r.valores.kcal };
  }
  const sueno = suenoParaAvisos(e);
  const horas = sueno ? horasDeSueno(e.hoy, sueno) : { despertar: null, dormir: null, acostarse: null };
  const comido = totalDelDia(e.registros.values(), e.hoy, false);
  return {
    ahora: minutosEnElDia(ahora, e.hoy),
    sesiones,
    horaDeComida,
    anotado,
    meta,
    comido: { kcal: comido.kcal, proteina: comido.proteina, carbohidratos: comido.carbohidratos, grasas: comido.grasas },
    comidasHabituales: comidasHabituales(e.registros.values(), e.hoy),
    pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null,
    edad: edadDe(e.perfil, e.hoy),
    despertar: horas.despertar,
    dormir: horas.dormir,
    // El corte del café cuenta desde la hora de ir a la cama.
    acostarse: horas.acostarse,
    cafeinaPorToma: cafeinaPorToma(e),
    sinDeficit: !!e.perfil.sinDeficit,
  };
}

/** Cuánto se durmió anoche, si se sabe bien: sin las noches de ejemplo, las estimadas sin confirmar ni las que parecen cortadas. */
function dormidoAnoche(e: Estado): number | null {
  const s = suenoDe(e.hoy, e.perfil, e.salud, e.noches);
  if (s.deEjemplo) return null;
  const n = s.noches.find((x) => x.clave === e.hoy);
  if (!n || n.moss?.origen === 'estimada') return null;
  return pareceIncompleta(n, ultimasNoches(s.noches, sumarDias(e.hoy, -1), 14)) ? null : n.dormido;
}

/** Las líneas de hoy, por comida; apagadas en Perfil, ninguna. */
export function lineasDeHoy(e: Estado, ahora = new Date()): Map<Comida, Linea> {
  if (!e.verEntreno) return new Map();
  const c = contextoDeHoy(e, ahora);
  const lineas = new Map<Comida, Linea>((c ? lineasDelDia(c) : []).map((l) => [l.comida, l]));
  // La noche corta va con la suscripción: es el ejemplo de su pantalla (D40).
  if (hayCompras() && e.perfil) {
    const anotadas = new Set(vigentes(e.registros.values()).filter((x) => x.dia === e.hoy && !x.planificado).map((x) => x.comida));
    const corta = lineaDeNocheCorta({ dormido: dormidoAnoche(e), anotadas, sinDeficit: !!e.perfil.sinDeficit });
    if (corta && !lineas.has(corta.comida)) lineas.set(corta.comida, corta);
  }
  return lineas;
}

/** Lo que dice una línea, en una o dos frases. Sin los números (Perfil › Los números), sin gramos. */
export function textoDeLinea(l: Linea, numeros: boolean): string {
  if (l.clase === 'nocheCorta') return t('entreno.nocheCorta', { h: duracion(l.dormido ?? 0) });
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
  if (l.clase === 'nocheCorta') return t('entreno.porQue.nocheCorta');
  if (l.clase === 'reponer') return t('entreno.porQue.reponer');
  if (l.clase === 'antesDeDormir') return t('entreno.porQue.antesDeDormir');
  if (l.clase === 'despues' || l.clase === 'despuesPronto') return t('entreno.porQue.despues');
  return t('entreno.porQue.antes');
}
