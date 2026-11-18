// Qué comer antes y después de entrenar, con lo de hoy: arma el contexto para la regla
// (src/dominio/alrededorDelEntreno.ts) y dice cada línea en palabras, sin culpa.

import { reglasDeCuidados, type Estado } from '@/almacen/almacen';
import { comidasHabituales, lineaDeNocheCorta, lineasDelDia, sesionesDelDia, type Contexto, type Linea, type Principal, type Sesion } from '@/dominio/alrededorDelEntreno';
import { horasDeSueno } from '@/dominio/avisos';
import type { Comida } from '@/dominio/comidas';
import { apagaLinea } from '@/dominio/cuidados';
import { minutosEnElDia, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { edadDe } from '@/dominio/metas';
import { totalDelDia, vigentes } from '@/dominio/registros';
import { pareceIncompleta, ultimasNoches } from '@/dominio/sueno';
import { hayCompras } from '@/lib/premium';
import { entrenosDelDia, type EntrenoDeSalud } from '@/salud/convertir';
import { cafeinaPorToma, horaDeReloj, horasDeComida, suenoParaAvisos } from '@/recordatorios/programar';
import { t } from '@/textos';
import { suenoDe } from '../persona';
import { duracion, metaDelDia } from './datos';

const PRINCIPALES: readonly Principal[] = ['desayuno', 'almuerzo', 'merienda', 'cena'];

// Los tipos de HealthKit que son fuerza: pesas, fuerza funcional, crossfit y HIIT.
const DE_FUERZA: ReadonlySet<number> = new Set([50, 20, 11, 63]);
/** Un entrenamiento de Salud a menos de esto de una sesión prevista es esa sesión, hecha. */
const MISMA_SESION = 90;

/** Las sesiones de hoy más lo que el reloj o el anillo anotaron en Salud fuera de ellas: también es entrenar. */
function conLasDeSalud(previstas: Sesion[], deSalud: EntrenoDeSalud[], hoy: ClaveDia): Sesion[] {
  const hechas = deSalud.map((s): Sesion => ({ inicio: minutosEnElDia(new Date(s.desde), hoy), minutos: s.minutos, tipo: DE_FUERZA.has(s.tipo) ? 'fuerza' : 'resistencia' }));
  const sueltas = hechas.filter((h) => !previstas.some((p) => Math.abs(p.inicio - h.inicio) <= MISMA_SESION));
  // La prevista que ya se hizo va con su hora de verdad.
  const ajustadas = previstas.map((p) => {
    const hecha = hechas.find((h) => Math.abs(p.inicio - h.inicio) <= MISMA_SESION);
    return hecha ? { ...p, inicio: hecha.inicio, minutos: hecha.minutos } : p;
  });
  return [...ajustadas, ...sueltas].sort((a, b) => a.inicio - b.inicio);
}

/** El contexto de hoy para la regla; sin perfil, sin meta o sin sesiones hoy, null. */
export function contextoDeHoy(e: Estado, ahora: Date): Contexto | null {
  const sesiones = conLasDeSalud(sesionesDelDia(e.entreno, e.hoy), entrenosDelDia(e.salud?.entrenamientos, e.hoy), e.hoy);
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
  // Con cuidados de salud marcados, en lugar de «sin déficit», cada línea según lo que apagan (cuidados.ts).
  const reglas = reglasDeCuidados(e);
  const cuidados = reglas?.cuidados.length ? reglas : null;
  const sinDeficit = !cuidados && !!e.perfil?.sinDeficit;
  const va = (l: Linea) => !cuidados || !apagaLinea(l.clase, cuidados);
  const c = contextoDeHoy(e, ahora);
  const lineas = new Map<Comida, Linea>((c ? lineasDelDia({ ...c, sinDeficit }) : []).filter(va).map((l) => [l.comida, l]));
  // La noche corta va con la suscripción: es el ejemplo de su pantalla (D40).
  if (hayCompras() && e.perfil) {
    const anotadas = new Set(vigentes(e.registros.values()).filter((x) => x.dia === e.hoy && !x.planificado).map((x) => x.comida));
    const corta = lineaDeNocheCorta({ dormido: dormidoAnoche(e), anotadas, sinDeficit });
    if (corta && va(corta) && !lineas.has(corta.comida)) lineas.set(corta.comida, corta);
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
