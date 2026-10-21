// La luz de cada día y la riqueza del cielo (especificación, «Mecánica» 5 y «Progresión»).

/** 3 por el primer hábito del día y 1 por cada uno más: gana la constancia, no los picos. */
export const luzDelDia = (hechos: number) => (hechos > 0 ? hechos + 2 : 0);

/**
 * El progreso es el cielo mismo: la riqueza (0 a 1) sale de la luz juntada desde siempre, crece
 * rápido al principio y cada vez más despacio, y nunca baja. Con unos 560 de luz (tres meses de
 * uso) llega a 0.6, el cielo que se aprobó en la galería; con LUZ_PLENA está pleno.
 */
export const LUZ_PLENA = 3650;
const ESCALA_DE_RIQUEZA = 40;

export function riquezaDe(luzAcumulada: number) {
  return Math.min(1, Math.log1p(Math.max(0, luzAcumulada) / ESCALA_DE_RIQUEZA) / Math.log1p(LUZ_PLENA / ESCALA_DE_RIQUEZA));
}

/** La cuenta al revés: cuánta luz hace falta para una riqueza. */
export function luzParaRiqueza(riqueza: number) {
  return ESCALA_DE_RIQUEZA * Math.expm1(riqueza * Math.log1p(LUZ_PLENA / ESCALA_DE_RIQUEZA));
}
