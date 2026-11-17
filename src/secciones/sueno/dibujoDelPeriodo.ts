// La geometría del dibujo de «¿Qué es?» (galeria/src/periodo.js, `dibujo`): la noche de izquierda a derecha, la
// melatonina que sube desde su inicio y el tramo del periodo. La comparten el lienzo (DibujosSkia.tsx) y lo
// escrito, que va encima, en la vista.

/** Las medidas del dibujo, en su propia escala: se agranda al ancho que haya. */
export const DIBUJO = { ancho: 320, alto: 118, base: 78, cresta: 54, borde: 6, techo: 12 } as const;
/** Cuánto se ve antes del inicio y después del periodo, en minutos. */
const ANTES = 50;
const DESPUES = 62;

/** Dónde cae cada minuto de la noche, de izquierda a derecha. */
export function xDelPeriodo(inicio: number, hasta: number): (minuto: number) => number {
  const desde = inicio - ANTES;
  return (m) => DIBUJO.borde + ((m - desde) / (hasta + DESPUES - desde)) * (DIBUJO.ancho - 2 * DIBUJO.borde);
}

/** La curva, en puntos del dibujo: una S, casi nada antes del inicio y arriba cuando empieza el periodo. */
export function curvaDelPeriodo(inicio: number, hasta: number): { x: number; y: number }[] {
  const x = xDelPeriodo(inicio, hasta);
  const nivel = (m: number) => 1 / (1 + Math.exp(-(m - (inicio + 62)) / 20));
  const puntos: { x: number; y: number }[] = [];
  for (let m = inicio - ANTES; m <= hasta + DESPUES; m += 4) puntos.push({ x: x(m), y: DIBUJO.base - DIBUJO.cresta * nivel(m) });
  return puntos;
}
