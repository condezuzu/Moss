// «Para hoy» con lo guardado: arma la entrada de la regla (src/dominio/paraHoy.ts), con lo del deporte primero
// (src/dominio/segunElDeporte.ts), y dice cada consejo en palabras, como la galería (galeria/src/inicio.js).

import type { Estado } from '@/almacen/almacen';
import type { Entreno } from '@/dominio/alrededorDelEntreno';
import { comidasHabituales } from '@/dominio/alrededorDelEntreno';
import { CON_HORA, type Comida } from '@/dominio/comidas';
import { deportesDe } from '@/dominio/cuestionario';
import { DESPUES_DE_SU_HORA } from '@/dominio/energia';
import { diasEntre, minutosEnElDia, sumarDias } from '@/dominio/fechas';
import { edadDe } from '@/dominio/metas';
import { paraHoy, type ConsejoDeHoy, type EntradaDeParaHoy } from '@/dominio/paraHoy';
import { totalDelDia, vigentes, type Registro } from '@/dominio/registros';
import { segunElDeporte, textoDelDeporte, type EntradaDelDeporte } from '@/dominio/segunElDeporte';
import { idioma, t, type Clave } from '@/textos';
import { horasDeComer, metaDelDia, numero } from '../comida/datos';

/** La meta de agua de Inicio: ocho vasos de 250 ml. */
export const META_DE_AGUA = 2000;
/** El agua cuenta si se anotó alguna vez en la última semana: si no, no se le pide a quien no la anota. */
const DIAS_DEL_AGUA = 7;

/** Los deportes de lo guardado: los del cuestionario o, si se cambió a mano en Perfil › Entrenamiento, ese tipo (deportesDe). */
export const entrenoDicho = (e: Entreno | null) => deportesDe(e);

/** El hierro o el calcio de un día: lo que suman los registros que lo traen; si ninguno lo trae, no se sabe. */
function mineral(lista: readonly Registro[], k: 'hierro' | 'calcio'): number | null {
  const con = lista.filter((r) => r.valores.micros?.[k] !== undefined);
  return con.length ? con.reduce((s, r) => s + (r.valores.micros?.[k] ?? 0), 0) : null;
}

/** Lo que las reglas del deporte necesitan y la app tiene: el entrenamiento, quién eres y los minerales de dos semanas. */
export function entradaDelDeporte(e: Estado): EntradaDelDeporte | null {
  if (!e.perfil) return null;
  const comidos = vigentes(e.registros.values()).filter((r) => !r.planificado);
  const minerales = Array.from({ length: 14 }, (_, i) => sumarDias(e.hoy, -i)).flatMap((dia) => {
    const delDia = comidos.filter((r) => r.dia === dia);
    const meta = metaDelDia(e, dia);
    if (!delDia.length || !meta) return [];
    return [{ dia, kcal: delDia.reduce((s, r) => s + r.valores.kcal, 0), meta: meta.kcal, hierro: mineral(delDia, 'hierro'), calcio: mineral(delDia, 'calcio') }];
  });
  return {
    hoy: e.hoy,
    entreno: entrenoDicho(e.entreno),
    sexo: e.perfil.sexo,
    edad: edadDe(e.perfil, e.hoy),
    pesoKg: e.pesos[e.pesos.length - 1]?.kg ?? null,
    sinDeficit: !!e.perfil.sinDeficit,
    sinNumeros: !e.numeros,
    minerales,
  };
}

/** La entrada de «Para hoy» con lo de ahora; sin meta (antes del cuestionario), null. */
export function entradaDeParaHoy(e: Estado, ahora: Date): EntradaDeParaHoy | null {
  const meta = metaDelDia(e, e.hoy);
  if (!meta) return null;
  const minutos = minutosEnElDia(ahora, e.hoy);
  const anotadas = new Set(vigentes(e.registros.values()).filter((r) => r.dia === e.hoy && !r.planificado).map((r) => r.comida));
  // Las comidas de siempre: la merienda, solo si se suele anotar.
  const deSiempre: Comida[] = CON_HORA.filter((c) => c !== 'merienda' || comidasHabituales(e.registros.values(), e.hoy) === 4);
  const horaDe = horasDeComer(e);
  const comido = totalDelDia(e.registros.values(), e.hoy, false);
  const conAgua = vigentes(e.agua.values()).some((x) => diasEntre(x.dia, e.hoy) >= 0 && diasEntre(x.dia, e.hoy) < DIAS_DEL_AGUA);
  const ml = vigentes(e.agua.values()).filter((x) => x.dia === e.hoy).reduce((s, x) => s + x.ml, 0);
  const deporte = entradaDelDeporte(e);
  return {
    ahora: minutos,
    meta,
    comido: { kcal: comido.kcal, proteina: comido.proteina, carbohidratos: comido.carbohidratos, grasas: comido.grasas },
    // Una comida falta desde una hora después de la de siempre: recién pasada, todavía se está comiendo.
    sinAnotar: deSiempre.filter((c) => !anotadas.has(c) && horaDe(c) + DESPUES_DE_SU_HORA <= minutos),
    anotadas: anotadas.size,
    proxima: deSiempre.find((c) => !anotadas.has(c) && horaDe(c) > minutos) ?? null,
    agua: conAgua ? { ml, meta: META_DE_AGUA } : null,
    sinDeficit: !!e.perfil?.sinDeficit,
    deporte: deporte ? segunElDeporte(deporte) : [],
  };
}

/** Los consejos de ahora. */
export function consejosDeHoy(e: Estado, ahora: Date): { lista: ConsejoDeHoy[]; anotadas: number } | null {
  const entrada = entradaDeParaHoy(e, ahora);
  return entrada ? { lista: paraHoy(entrada), anotadas: entrada.anotadas } : null;
}

/** «el almuerzo», «el almuerzo y la cena», «el desayuno, el almuerzo y la cena»; en inglés, con «or». */
function enLista(nombres: readonly string[], ultimo: string): string {
  return nombres.length < 2 ? nombres[0] : `${nombres.slice(0, -1).join(', ')}${ultimo}${nombres[nombres.length - 1]}`;
}

/** Lo que dice un consejo, sin cifras con los números ocultos. */
export function textoDelConsejo(x: ConsejoDeHoy, numeros: boolean): string {
  if (x.tipo === 'deporte') return textoDelDeporte(x.consejo, { t: (clave, valores) => t(clave as Clave, valores), numero });
  if (x.tipo === 'anotar') {
    return t('inicio.paraHoy.anotar', { comidas: enLista(x.comidas.map((c) => t(`inicio.paraHoy.comidas.${c}`)), idioma() === 'es' ? ' ni ' : ' or ') });
  }
  if (x.tipo === 'nadaAnotado') return t('inicio.paraHoy.nadaAnotado');
  if (x.tipo === 'agua') return t(numeros ? 'inicio.paraHoy.agua' : 'inicio.paraHoy.aguaSinNumeros', { n: x.vasos });
  const en = t(`inicio.paraHoy.en.${x.proxima ?? 'resto'}`);
  if (x.tipo === 'faltaProteina') return t(numeros ? 'inicio.paraHoy.faltaProteina' : 'inicio.paraHoy.faltaProteinaSinNumeros', { g: numero(x.gramos), en });
  return t(`inicio.paraHoy.${x.tipo}`, { en });
}
