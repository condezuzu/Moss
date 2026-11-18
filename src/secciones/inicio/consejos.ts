// «Para hoy» con lo guardado: arma la entrada de la regla (src/dominio/paraHoy.ts), con lo del deporte primero
// (src/dominio/segunElDeporte.ts), y dice cada consejo en palabras, como la galería (galeria/src/inicio.js).

import { reglasDeCuidados, type Estado } from '@/almacen/almacen';
import type { Entreno } from '@/dominio/alrededorDelEntreno';
import { comidasHabituales } from '@/dominio/alrededorDelEntreno';
import { CON_HORA, type Comida } from '@/dominio/comidas';
import { deportesDe } from '@/dominio/cuestionario';
import { apagaConsejo, metaDeAgua } from '@/dominio/cuidados';
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
/** Con cuidados de salud (cuidados.ts), la suya: 2,5 L con cálculos; con el riñón u «otra», ninguna (null): Moss no la pide. */
export const metaDeAguaDe = (e: Pick<Estado, 'cuidados' | 'perfil' | 'pesos' | 'hoy'>): number | null => metaDeAgua(reglasDeCuidados(e), META_DE_AGUA);
/** El agua cuenta si se anotó alguna vez en la última semana: si no, no se le pide a quien no la anota. */
const DIAS_DEL_AGUA = 7;

/** Los deportes de lo guardado: los del cuestionario o, si se cambió a mano en Perfil › Entrenamiento, ese tipo (deportesDe). */
export const entrenoDicho = (e: Entreno | null) => deportesDe(e);

/** El hierro o el calcio de un día: lo que suman los registros que lo traen; si ninguno lo trae, no se sabe. */
function mineral(lista: readonly Registro[], k: 'hierro' | 'calcio'): number | null {
  const con = lista.filter((r) => r.valores.micros?.[k] !== undefined);
  return con.length ? con.reduce((s, r) => s + (r.valores.micros?.[k] ?? 0), 0) : null;
}

/**
 * Lo que las reglas del deporte necesitan y la app tiene: el entrenamiento (con la próxima carrera), quién eres, el
 * alcohol anotado ayer y hoy y los minerales de dos semanas. Pesarse antes y después de una sesión (la regla 4) no
 * entra: Moss guarda un solo peso por día.
 */
export function entradaDelDeporte(e: Estado): EntradaDelDeporte | null {
  if (!e.perfil) return null;
  const comidos = vigentes(e.registros.values()).filter((r) => !r.planificado);
  // El alcohol con su hora, para lo de después de jugar: la regla mira las 12 h que siguen al partido de ayer.
  const ayer = sumarDias(e.hoy, -1);
  const alcohol = comidos.filter((r) => (r.dia === ayer || r.dia === e.hoy) && (r.valores.alcohol ?? 0) > 0)
    .map((r) => ({ dia: r.dia, minutos: minutosEnElDia(new Date(r.momento), r.dia), gramos: r.valores.alcohol ?? 0 }));
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
    carrera: e.entreno?.carrera ?? null,
    alcohol,
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
  // Con cuidados de salud marcados, en lugar de «sin déficit», cada consejo según lo que apagan (cuidados.ts).
  const reglas = reglasDeCuidados(e);
  const cuidados = reglas?.cuidados.length ? reglas : null;
  const metaDelAgua = metaDeAguaDe(e);
  return {
    ahora: minutos,
    meta,
    comido: { kcal: comido.kcal, proteina: comido.proteina, carbohidratos: comido.carbohidratos, grasas: comido.grasas },
    // Una comida falta desde una hora después de la de siempre: recién pasada, todavía se está comiendo.
    sinAnotar: deSiempre.filter((c) => !anotadas.has(c) && horaDe(c) + DESPUES_DE_SU_HORA <= minutos),
    anotadas: anotadas.size,
    proxima: deSiempre.find((c) => !anotadas.has(c) && horaDe(c) > minutos) ?? null,
    agua: conAgua && metaDelAgua !== null ? { ml, meta: metaDelAgua } : null,
    ...(cuidados ? { apaga: (c: ConsejoDeHoy) => apagaConsejo(c, cuidados) } : { sinDeficit: !!e.perfil?.sinDeficit }),
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
