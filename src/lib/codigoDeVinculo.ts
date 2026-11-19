// Vincular desde Moss con un código de un uso (spec/ascent.md, «Con un código»; supabase/moss/0014_codigo_de_vinculo.sql):
// sin la sesión de Ascent en el llavero, Moss pide un código y abre este enlace. Con Ascent instalada, iOS lo abre en
// Ascent; si no, la web ofrece la App Store. Si al volver quedó vinculada, Moss lo confirma una vez, con «No fui yo».
// Puro: lo usa src/secciones/ascent/vincularDesdeMoss.ts.

export const VINCULAR_EN_ASCENT = 'https://ascent-blush-seven.vercel.app/vincular/';

/** Hasta cuándo, desde que se pidió el código, vincular se confirma: el código vence a los 5 minutos. */
export const CONFIRMAR_HASTA_MS = 10 * 60_000;

/** 32 bytes en base64url sin relleno, como los da moss.crear_codigo_de_vinculo(). */
export const esCodigoDeVinculo = (x: unknown): x is string => typeof x === 'string' && /^[A-Za-z0-9_-]{43}$/.test(x);

export function enlaceDeVincular(codigo: string): string {
  return VINCULAR_EN_ASCENT + codigo;
}

/** Si toca preguntar «Vinculada con @usuario»: pasó de no vinculada a vinculada hasta 10 minutos después de pedir el código. */
export function confirmarElVinculo({ pedido, ahora, antes, vinculada }: { pedido: number | null; ahora: number; antes: boolean; vinculada: boolean }): boolean {
  return pedido !== null && !antes && vinculada && ahora >= pedido && ahora - pedido <= CONFIRMAR_HASTA_MS;
}

/** Si el código pedido ya no puede terminar en una confirmación. */
export function codigoVencido(pedido: number | null, ahora: number): boolean {
  return pedido === null || ahora < pedido || ahora - pedido > CONFIRMAR_HASTA_MS;
}
