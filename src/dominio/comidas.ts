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
 * La comida que toca a una hora, en minutos desde la medianoche. Lo de después de la medianoche en la
 * cuenta del día anterior (D32: la 1470 son las 0:30) es de madrugada, como a esa hora del reloj.
 */
export function comidaDeLaHora(minutos: number): Comida {
  const reloj = ((minutos % 1440) + 1440) % 1440;
  let elegida: Comida = 'snack';
  for (const [desde, comida] of FRANJAS) if (reloj >= desde) elegida = comida;
  return elegida;
}
