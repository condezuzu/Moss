// Cómo se encuentra lo de Ascent en Moss (spec/ascent.md, «Que se encuentre»): qué dice la señal de
// Hábitos y cuándo invita Inicio a vincular. Con la vinculación apagada, ninguna de las dos existe.

import { diasEntre, type ClaveDia } from './fechas';

/** Una sesión más vieja que esto ya no dice nada útil: la señal vuelve a la marca. */
export const DIAS_DE_LA_SENAL = 6;

export type SenalDeAscent =
  /** Sin vincular, con Ascent en este iPhone: invita. */
  | { que: 'vincular' }
  /** Sin Ascent en este iPhone, o vinculada sin una sesión reciente: solo la marca. */
  | { que: 'marca' }
  /** Vinculada: la última sesión, `dias` atrás (0 es hoy). */
  | { que: 'sesion'; fecha: ClaveDia; dias: number };

export function senalDeAscent(d: {
  conAscent: boolean;
  vinculada: boolean;
  /** null: todavía no se sabe. */
  instalada: boolean | null;
  sesiones: readonly { fecha: ClaveDia }[];
  hoy: ClaveDia;
}): SenalDeAscent | null {
  if (!d.conAscent) return null;
  if (!d.vinculada) return { que: d.instalada ? 'vincular' : 'marca' };
  const ultima = d.sesiones.reduce<ClaveDia | null>((u, s) => (s.fecha <= d.hoy && (u === null || s.fecha > u) ? s.fecha : u), null);
  if (ultima === null) return { que: 'marca' };
  const dias = diasEntre(ultima, d.hoy);
  return dias > DIAS_DE_LA_SENAL ? { que: 'marca' } : { que: 'sesion', fecha: ultima, dias };
}

/**
 * Inicio invita solo a quien ya tiene las dos apps y todavía no las unió. Sin Ascent no se dice nada y sin
 * la cuenta de Moss no se puede vincular. «Ahora no» la guarda 4 horas (lo pediste el 5/11/2026: que
 * vuelva sin molestar, así la ves cuando vuelves a anotar una comida).
 */
export const VUELVE_EN = 4 * 60 * 60 * 1000;
export function invitarEnInicio(d: {
  conAscent: boolean;
  /** Ya se leyó lo guardado: hasta entonces, una cuenta vinculada parece sin vincular. */
  listo: boolean;
  conCuenta: boolean;
  vinculada: boolean;
  instalada: boolean | null;
  /** Cuándo se tocó «Ahora no», en milisegundos; false si nunca; null mientras se lee. */
  descartada: number | false | null;
  /** Ahora, en milisegundos. */
  ahora: number;
}): boolean {
  if (!(d.conAscent && d.listo && d.conCuenta && !d.vinculada && d.instalada === true) || d.descartada === null) return false;
  return d.descartada === false || d.ahora - d.descartada >= VUELVE_EN;
}
