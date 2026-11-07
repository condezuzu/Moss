// Lo que comparten las pantallas de la comida: el estado del almacén, la meta y lo comido de cada
// día, los números y las fechas en el idioma de la app, la región y el sistema de unidades.

import { getLocales } from 'expo-localization';
import { useSyncExternalStore } from 'react';

import { elAlmacen } from '@/almacen';
import { metaVigente, type Estado } from '@/almacen/almacen';
import { estadoConAscent, metaConAscent, suscribirConAscent } from '@/almacen/ascent';
import { conMayuscula } from '@/comida/buscar';
import { cantidadDePorcion, decimal } from '@/comida/porciones';
import { ACEITE, pesoEn, sistemaDeRegion, volumenEn, type Sistema } from '@/dominio/cantidades';
import { comidaDeLaHora, COMIDAS, minutoDeLoDicho, type Comida } from '@/dominio/comidas';
import { diaDeLaSemana, minutosEnElDia, partesDe, sumarDias, type ClaveDia } from '@/dominio/fechas';
import { metaRepartida, type Macros } from '@/dominio/metas';
import { sugerenciaVencida } from '@/dominio/plan';
import { horasDeSiempre } from '@/dominio/recordatorios';
import { delDia, sumarValores, totalDelDia, type Cantidad, type Registro, type Valores } from '@/dominio/registros';
import { idioma, lista, t } from '@/textos';

/** Todo el estado del almacén: cambia de objeto con cada cambio, así React sabe cuándo pintar. */
export function useEstado(): Estado {
  // También cambia con lo que llega de Ascent: la meta del día depende de eso (src/almacen/ascent.ts).
  return useSyncExternalStore(suscribirConAscent, estadoConAscent);
}

/**
 * Si se ven los números de la comida (Perfil › Los números): sin ellos, solo las figuras y las
 * barras. Con selector, así una fila de la línea del día no se redibuja con cualquier cambio.
 */
export function useNumeros(): boolean {
  const a = elAlmacen();
  return useSyncExternalStore(a.suscribir, () => a.estado().numeros);
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

/** «21:30»; lo de después de la medianoche (más de 1440, D32) vuelve a empezar: 1470 son las 00:30. */
export function hora(minutos: number): string {
  const m = ((Math.round(minutos) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** La comida que toca ahora, con la hora a la que empieza el día (D32): a las 5:30 con el corte a las 6, todavía no es el desayuno. */
export const comidaDeAhora = (): Comida => comidaDeLaHora(minutosDe(new Date()), elAlmacen().estado().corte);

/**
 * La meta de un día, sin lo que no son macros, con la semana repartida si se reparte y, con Ascent
 * vinculada, las calorías según el día y la proteína de la sesión. Antes del cuestionario, null.
 */
export function metaDelDia(e: Pick<Estado, 'metas' | 'perfil' | 'pesos' | 'hoy'>, dia: ClaveDia): Macros | null {
  const m = metaVigente(e, dia);
  return m ? metaConAscent(metaRepartida({ kcal: m.kcal, proteina: m.proteina, carbohidratos: m.carbohidratos, grasas: m.grasas }, e.perfil, diaDeLaSemana(dia)), e, dia) : null;
}

export type ComidaDelDia = { comida: Comida; registros: Registro[]; total: Valores; minutos: number; planificada: boolean };

/** Lo de un día, agrupado por comida y en el orden de la línea: cada comida a la hora de lo primero que tiene. */
export function comidasDelDia(registros: Estado['registros'], dia: ClaveDia, hoy: ClaveDia): ComidaDelDia[] {
  const porComida = new Map<Comida, Registro[]>();
  for (const r of delDia(registros.values(), dia)) if (!sugerenciaVencida(r, hoy)) porComida.set(r.comida, [...(porComida.get(r.comida) ?? []), r]);
  return [...porComida]
    .map(([comida, lista]) => ({
      comida, registros: lista, total: sumarValores(lista.map((r) => r.valores)), minutos: minutosEnElDia(new Date(lista[0].momento), dia), planificada: lista.every((r) => r.planificado),
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

export { HORA_TIPICA } from '@/dominio/comidas';

/**
 * La hora de cada comida, una sola para todo (lo que se anota, la línea y lo que corre al comer): la
 * del horario, si se eligió, o la de siempre, la que usan los avisos. El snack no tiene: a media mañana.
 */
export function horasDeComer(e: Pick<Estado, 'hoy' | 'registros' | 'avisos'>): (c: Comida) => number {
  const deSiempre = horasDeSiempre(e.registros.values(), e.hoy);
  return (c) => (c === 'snack' ? 11 * 60 : (e.avisos.horario?.[c] ?? deSiempre(c)));
}

/**
 * El momento de lo que se anota, por cualquier vía (la hoja, el «+», tu comida de siempre, lo rápido,
 * el código y Decir). Otro día, a la hora de esa comida. Hoy, ahora; pero una comida que no es la de la
 * hora y cuya hora pasó hace más de una hora (el desayuno anotado a la tarde) va a su hora, como lo dicho
 * con el nombre de otra comida (D41): así no corre lo que sigue. La cena pasada la medianoche, antes del
 * corte, es la de la hora.
 */
export function momentoDe(e: Pick<Estado, 'hoy' | 'registros' | 'avisos'> & Partial<Pick<Estado, 'corte'>>, dia: ClaveDia, comida: Comida): string | undefined {
  const horaDe = horasDeComer(e);
  const p = partesDe(dia);
  const enElDia = (minutos: number) => new Date(p.anio, p.mes, p.dia, Math.floor(minutos / 60), minutos % 60).toISOString();
  if (dia !== e.hoy) return enElDia(horaDe(comida));
  const ahora = minutosEnElDia(new Date(), dia);
  if (comida === 'snack' || comida === comidaDeLaHora(ahora, e.corte) || (comida === 'cena' && ahora >= 24 * 60)) return undefined;
  const minuto = minutoDeLoDicho(horaDe(comida), ahora);
  return minuto === null ? undefined : enElDia(minuto);
}

/** Un cambio, con el signo de verdad: «+0,4», «−1,2». */
export const conSigno = (n: number, decimales = 0) => `${n < 0 ? '−' : n > 0 ? '+' : ''}${numero(Math.abs(n), decimales)}`;

/** «21 oct». */
export function fechaDiaMes(dia: ClaveDia): string {
  const p = partesDe(dia);
  return t('fecha.corta', { num: p.dia, mes: lista('fecha.mesesCortos')[p.mes] });
}

/** «lunes 26 de octubre». */
export function fechaLarga(dia: ClaveDia): string {
  const p = partesDe(dia);
  return t('fecha.larga', { dia: lista('fecha.dias')[p.diaSemana], num: p.dia, mes: lista('fecha.meses')[p.mes] });
}

/** «7 h 32 min», «8 h» o «45 min». */
export function duracion(minutos: number): string {
  // Primero se redondea: 479,6 minutos son «8 h», no «7 h 60 min».
  const total = Math.round(minutos);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return t('fecha.minutos', { m });
  return m ? t('fecha.horasMinutos', { h, m: String(m).padStart(2, '0') }) : t('fecha.horas', { h });
}

/** Una hora del día en minutos, aunque pase de la medianoche: 1500 son las 01:00. */
export const horaDelDia = (minutos: number) => hora(((Math.round(minutos) % 1440) + 1440) % 1440);
