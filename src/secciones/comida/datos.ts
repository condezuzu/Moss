// Lo que comparten las pantallas de la comida: el estado del almacén, la meta y lo comido de cada
// día, los números y las fechas en el idioma de la app, la región y el sistema de unidades.

import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';

import { elAlmacen } from '@/almacen';
import { metaVigente, type Estado } from '@/almacen/almacen';
import { conMayuscula } from '@/comida/buscar';
import { cantidadDePorcion, decimal } from '@/comida/porciones';
import { ACEITE, pesoEn, sistemaDeRegion, volumenEn, type Sistema } from '@/dominio/cantidades';
import { comidaDeLaHora, COMIDAS, type Comida } from '@/dominio/comidas';
import { diaDeLaSemana, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import type { Macros } from '@/dominio/metas';
import { delDia, sumarValores, totalDelDia, type Cantidad, type Registro, type Valores } from '@/dominio/registros';
import { idioma, lista, t } from '@/textos';

/** Todo el estado del almacén: cambia de objeto con cada cambio, así React sabe cuándo pintar. */
export function useEstado(): Estado {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, a.estado);
}

let laRegion: string | undefined | null = null;
/** El país del teléfono (UY, MX…), para los nombres de cada región. */
export function region(): string | undefined {
  if (laRegion === null) laRegion = getLocales()[0]?.regionCode ?? undefined;
  return laRegion;
}

export const sistemaDe = (e: Pick<Estado, 'sistema'>): Sistema => e.sistema ?? sistemaDeRegion(region());

export const opcionesDeIdioma = () => ({ idioma: idioma(), region: region() });

const formatos = new Map<string, Intl.NumberFormat>();
/** Un número en el idioma de la app: «1.234» o «1,234»; con decimales, «2,5» o «2.5». */
export function numero(n: number, decimales = 0): string {
  const clave = `${idioma()}${decimales}`;
  let f = formatos.get(clave);
  if (!f) {
    f = new Intl.NumberFormat(idioma() === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: 0, maximumFractionDigits: decimales });
    formatos.set(clave, f);
  }
  return f.format(n);
}

/** Los gramos de un macro: con decimal por debajo de 10 («2,5 g»), sin decimal arriba. */
export const gramosDeMacro = (g: number) => numero(g, g < 10 ? 1 : 0);

/** «Miércoles 21 oct». */
export function fechaCorta(dia: ClaveDia): string {
  const p = partesDe(dia);
  return t('cielo.fecha', { dia: lista('fecha.dias')[p.diaSemana], num: p.dia, mes: lista('fecha.mesesCortos')[p.mes] });
}

/** «Hoy», «Ayer», «Mañana» o «Viernes 16». */
export function tituloDelDia(dia: ClaveDia, hoy: ClaveDia): string {
  if (dia === hoy) return t('comida.dias.hoy');
  if (dia === sumarDias(hoy, -1)) return t('comida.dias.ayer');
  if (dia === sumarDias(hoy, 1)) return t('comida.dias.manana');
  const p = partesDe(dia);
  return conMayuscula(t('comida.tituloDia', { dia: lista('fecha.dias')[p.diaSemana], num: p.dia }));
}

/** La primera letra del día de la semana: «L», «M»… */
export const letraDelDia = (dia: ClaveDia) => lista('fecha.diasCortos')[diaDeLaSemana(dia)].charAt(0).toUpperCase();

/** La hora local de un instante, en minutos desde la medianoche. */
export function minutosDe(instante: string | Date): number {
  const d = typeof instante === 'string' ? new Date(instante) : instante;
  return d.getHours() * 60 + d.getMinutes();
}

export const hora = (minutos: number) => `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(Math.round(minutos) % 60).padStart(2, '0')}`;

/** La comida que toca ahora. */
export const comidaDeAhora = (): Comida => comidaDeLaHora(minutosDe(new Date()));

/** La meta de un día, sin lo que no son macros. Antes del cuestionario, null. */
export function metaDelDia(e: Pick<Estado, 'metas'>, dia: ClaveDia): Macros | null {
  const m = metaVigente(e, dia);
  return m ? { kcal: m.kcal, proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas } : null;
}

export type ComidaDelDia = { comida: Comida; registros: Registro[]; total: Valores; minutos: number; planificada: boolean };

/** Lo de un día, agrupado por comida y en el orden de la línea: cada comida a la hora de lo primero que tiene. */
export function comidasDelDia(registros: Estado['registros'], dia: ClaveDia): ComidaDelDia[] {
  const porComida = new Map<Comida, Registro[]>();
  for (const r of delDia(registros.values(), dia)) porComida.set(r.comida, [...(porComida.get(r.comida) ?? []), r]);
  return [...porComida]
    .map(([comida, lista]) => ({
      comida, registros: lista, total: sumarValores(lista.map((r) => r.valores)), minutos: minutosDe(lista[0].momento), planificada: lista.every((r) => r.planificado),
    }))
    .sort((a, b) => a.minutos - b.minutos || COMIDAS.indexOf(a.comida) - COMIDAS.indexOf(b.comida));
}

/** Lo comido en un día: hoy y antes, sin lo planificado que no se confirmó; en un día que no llegó, lo planificado. */
export const totalDe = (registros: Estado['registros'], dia: ClaveDia, hoy: ClaveDia) => totalDelDia(registros.values(), dia, dia > hoy);

/** El aceite de una cantidad, como se dice: «1 cdta», «1 cda», «2 cdas» o los gramos. */
export function aceiteDeTexto(gramos: number): string {
  const nombres = lista('comida.medir.aceites');
  const i = [ACEITE.cucharadita, ACEITE.cucharada, ACEITE.dosCucharadas].findIndex((g) => Math.abs(g - gramos) < 0.05);
  return i >= 0 ? nombres[i + 1] : `${numero(gramos, 1)} g`;
}

/** «2 rebanadas», «150 g», «250 ml» (o en onzas), con el aceite si lo lleva. */
export function cantidadDeTexto(c: Cantidad, sistema: Sistema): string {
  if (!c) return '';
  let base: string;
  if ('porcion' in c) base = cantidadDePorcion(c.veces, c.porcion, idioma());
  else if (c.ml != null) {
    const v = volumenEn(c.ml, sistema);
    base = `${decimal(v.valor, idioma())} ${v.unidad === 'floz' ? 'fl oz' : 'ml'}`;
  } else {
    const p = pesoEn(c.gramos, sistema);
    base = `${decimal(p.valor, idioma())} ${p.unidad}`;
  }
  return c.aceite ? `${base} · ${t('comida.medir.conAceite', { que: aceiteDeTexto(c.aceite) })}` : base;
}

/** A qué hora suele caer cada comida: para el hueco de la que falta y para lo que se anota otro día. */
export const HORA_TIPICA: Record<Exclude<Comida, 'snack'>, number> = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };

/** El momento de lo que se registra: hoy, ahora; otro día, a la hora típica de esa comida en ese día. */
export function momentoPara(dia: ClaveDia, comida: Comida, hoy: ClaveDia): string | undefined {
  if (dia === hoy) return undefined;
  const p = partesDe(dia);
  const minutos = comida === 'snack' ? 11 * 60 : HORA_TIPICA[comida];
  return new Date(p.anio, p.mes, p.dia, Math.floor(minutos / 60), minutos % 60).toISOString();
}
