// Tu periodo de melatonina (lo pediste el 17/11/2026): la hora de la noche en que menos te cuesta dormirte,
// estimada con tus horarios y no medida. La evidencia, en spec/estudio/deuda-y-melatonina.md, sección 3:
// - El inicio de la melatonina con poca luz cae, en promedio, 6 h 30 antes del punto medio del sueño (la cuenta
//   del informe con las medias de Burgess y Eastman 2005 y de Martin y Eastman 2002: 6 h 26 a 6 h 42), y la gente
//   sana se duerme entre 2 y 3 horas después de ese inicio. Ese tramo es el periodo. Para alguien regular queda
//   sobre su hora de siempre de dormirse, por construcción: sirve para ver cómo se corre, no para descubrir nada.
// - El punto medio es el de las noches de los últimos 7 días (Reiter 2020; Martin y Eastman 2002), así que el
//   periodo se corre solo: dos noches 2 h más tarde lo atrasan 34 min, y Yang 2001 midió 32.
// - El margen honesto es de ±1 h (un desvío): la cuenta acierta dentro de una hora en el 74 a 92 % de jóvenes
//   sanos con horario libre, bastante menos con horarios impuestos, y con turnos de noche no sirve. Con luz fuerte
//   o pantallas hasta tarde, el de verdad viene después (Chang 2015; Phillips 2019). Por eso se dice «estimado», y
//   la hoja de Sueño lo explica.
// Convenciones (no salen de un estudio):
// - Que dure una hora, como la ventana de Rise: no hay evidencia de que se cierre. Acostarse antes es lo que
//   cuesta; después, solo se acorta la noche.
// - Alcanza con 3 noches de las 7. El informe proponía 5: con menos, el promedio se mueve más de un día a otro.
// - Se dice al minuto, como lo pediste («00:28 – 01:28»), aunque el informe aconseja no dar una hora exacta.
// - El promedio es el común: las noches cuentan desde las 18 (sueno.ts), así que vale como el circular salvo para
//   quien duerme cruzando las 18.

import { sumarDias, type ClaveDia } from './fechas';
import { margenParaDormirte } from './sinReloj';
import { redondearDeuda, type Noche } from './sueno';

/** Las noches que entran: las de los últimos 7 días, y hacen falta 3. */
export const NOCHES_DEL_PERIODO = 7;
export const MINIMO_DE_NOCHES = 3;
/** Del punto medio del sueño, hacia atrás, al inicio estimado de la melatonina. */
export const ANTES_DEL_PUNTO_MEDIO = 6 * 60 + 30;
/** El periodo, contado desde ese inicio: de 2 a 3 horas después. */
export const PERIODO = { desde: 120, hasta: 180 } as const;

/** Todo en minutos desde las 18 del día anterior, como `dormirse` y `despertar` de una noche. */
export type PeriodoDeMelatonina = {
  /** Cuándo empieza a subir la melatonina, estimado. */
  inicio: number;
  desde: number;
  hasta: number;
  /** Cuánto se corrió desde ayer, en minutos: negativo es antes y positivo, más tarde. Sin periodo ayer, null. */
  corrido: number | null;
  /** A qué hora acostarte para estar dormido cuando empieza, de a 5 minutos. */
  acostarse: number;
  /** Con deuda se recomienda lo mismo, el comienzo del periodo y no antes: el texto lo dice. */
  conDeuda: boolean;
  /** Con cuántas noches se estimó. */
  noches: number;
};

/** Lo que hace falta de cada noche. Las estimadas con poca confianza en el horario no entran, como en habitualDe. */
type Horas = Pick<Noche, 'clave' | 'dormirse' | 'despertar'> & { confianza?: Pick<Noche['confianza'], 'horario'> };

/** El comienzo del periodo con las noches de los 7 días que terminan en `hasta`, sin redondear; null si no alcanzan. */
function comienzo(noches: readonly Horas[], hasta: ClaveDia): { desde: number; noches: number } | null {
  const primera = sumarDias(hasta, 1 - NOCHES_DEL_PERIODO);
  const medios = noches.filter((n) => n.clave >= primera && n.clave <= hasta && n.confianza?.horario !== 'baja').map((n) => (n.dormirse + n.despertar) / 2);
  if (medios.length < MINIMO_DE_NOCHES) return null;
  const medio = medios.reduce((s, m) => s + m, 0) / medios.length;
  return { desde: medio - ANTES_DEL_PUNTO_MEDIO + PERIODO.desde, noches: medios.length };
}

/**
 * El periodo de esta noche, con las noches hasta la de hoy, y cuánto se corrió desde el de anoche. `margen` es tu
 * margen para dormirte (el de sinReloj.ts: sin elegir, 15 min). Con deuda no se adelanta: antes del periodo hay un
 * rato en que el cuerpo no se duerme (Lavie 1986; Strogatz 1987; Shekleton 2013), así que acostarse mucho antes es
 * dar vueltas en la cama.
 */
export function periodoDeMelatonina(noches: readonly Horas[], hoy: ClaveDia, op: { margen?: number | null; deuda?: number | null } = {}): PeriodoDeMelatonina | null {
  const esta = comienzo(noches, hoy);
  if (!esta) return null;
  const desde = Math.round(esta.desde);
  const ayer = comienzo(noches, sumarDias(hoy, -1));
  return {
    inicio: desde - PERIODO.desde,
    desde,
    hasta: desde + PERIODO.hasta - PERIODO.desde,
    corrido: ayer ? desde - Math.round(ayer.desde) : null,
    acostarse: Math.round((desde - margenParaDormirte(op.margen)) / 5) * 5,
    conDeuda: redondearDeuda(op.deuda ?? 0) > 0,
    noches: esta.noches,
  };
}
