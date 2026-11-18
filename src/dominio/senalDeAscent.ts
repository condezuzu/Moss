// Cómo se encuentra lo de Ascent en Moss (spec/ascent.md, «Que se encuentre»): cuándo invita Inicio a vincular.
// Con la vinculación apagada, nunca.

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
