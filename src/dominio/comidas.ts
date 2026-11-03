// Las comidas del día y cuál toca a cada hora (spec/nutricion.md, «Registrar»): la hoja de
// registro abre con la comida de la hora elegida, y se cambia con un toque.
// La galería usa este mismo archivo (galeria/construir.mjs): no puede importar nada.

export type Comida = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'snack';

/** En el orden del día. El snack va a cualquier hora. */
export const COMIDAS: readonly Comida[] = ['desayuno', 'almuerzo', 'merienda', 'cena', 'snack'];

/** A qué hora suele caer cada comida, en minutos: para el hueco de la que falta, lo que se anota otro día y los recordatorios. */
export const HORA_TIPICA: Record<Exclude<Comida, 'snack'>, number> = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };

/** Desde qué minuto del día toca cada una, en la hora local. Entre las comidas y de madrugada, snack. */
const FRANJAS: readonly (readonly [number, Comida])[] = [
  [0, 'snack'],
  [4 * 60, 'desayuno'],
  [10 * 60 + 30, 'snack'],
  [12 * 60, 'almuerzo'],
  [15 * 60 + 30, 'merienda'],
  [19 * 60 + 30, 'cena'],
];

/**
 * A qué minuto va lo dicho con el nombre de una comida (lo pediste el 30/10/2026): «el desayuno comí…»,
 * dicho a la tarde, va a la hora de esa comida; si esa hora recién pasó o no llegó, a la de ahora (null).
 */
export const minutoDeLoDicho = (hora: number | undefined, ahora: number): number | null => (hora !== undefined && hora + 60 <= ahora ? hora : null);

/** Las que tienen hora en el día, en orden: el snack va a cualquier hora y no corre nada. */
export const CON_HORA = ['desayuno', 'almuerzo', 'merienda', 'cena'] as const;

/** El horario de comidas va de las 5:00 a las 23:45 (spec/avisos.md): lo corrido de los avisos, también. */
const PRIMERA_HORA = 5 * 60;
const ULTIMA_HORA = 23 * 60 + 45;

/**
 * Las horas de las comidas que todavía faltan, corridas por la última que ya anotaste (lo pediste el
 * 29/10/2026): si desayunaste una hora y media más tarde que siempre, el almuerzo, la merienda y la
 * cena van una hora y media más tarde, con la misma distancia entre ellas; si más temprano, más
 * temprano. Lo anotado queda a su hora. `base` son las horas de siempre (o las del horario) y
 * `anotadas`, cuándo se anotó cada una ese día, en minutos del día.
 * Para los avisos (`avisos`), lo que ya sonó no se mueve: una comida cuya hora (con lo corrido hasta
 * entonces) ya había llegado cuando se anotó la que corre las demás queda donde estaba. Y lo corrido no
 * sale del horario, de 5:00 a 23:45: anotar a la tarde el desayuno olvidado no lleva la cena a la madrugada.
 */
export function horasCorridas(base: Partial<Record<Comida, number>>, anotadas: Partial<Record<Comida, number>>, avisos = false): Partial<Record<Comida, number>> {
  const r: Partial<Record<Comida, number>> = { ...base, ...anotadas };
  const corrida = (m: number, k: number) => (avisos && k !== 0 ? Math.min(ULTIMA_HORA, Math.max(PRIMERA_HORA, m + k)) : m + k);
  let corrimiento = 0;
  // Lo corrido antes de la última anotada que corre las demás, y cuándo se anotó.
  let anterior = 0;
  let ultima: number | undefined;
  for (const c of CON_HORA) {
    const anotada = anotadas[c];
    const deSiempre = base[c];
    if (anotada !== undefined) {
      if (deSiempre !== undefined) {
        anterior = corrimiento;
        corrimiento = anotada - deSiempre;
        ultima = anotada;
      }
    } else if (deSiempre !== undefined) {
      const estaba = corrida(deSiempre, anterior);
      r[c] = avisos && ultima !== undefined && estaba <= ultima ? estaba : corrida(deSiempre, corrimiento);
    }
  }
  return r;
}

/**
 * La comida que toca a una hora, en minutos desde la medianoche. Lo de después de la medianoche en la
 * cuenta del día anterior (D32: la 1470 son las 0:30) es de madrugada, como a esa hora del reloj.
 */
export function comidaDeLaHora(minutos: number): Comida {
  const reloj = ((minutos % 1440) + 1440) % 1440;
  let elegida: Comida = 'snack';
  for (const [desde, comida] of FRANJAS) if (reloj >= desde) elegida = comida;
  return elegida;
}
