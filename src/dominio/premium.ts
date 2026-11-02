// Moss Premium (D40, spec/suscripcion.md): quién lo tiene y lo que sale de eso. Gratis, siempre: registrar
// comida, hábitos y cielo, y peso. Premium: el ajuste semanal de las metas, el plan de comidas, el sueño
// avanzado y la hora de dormir, y «Todo lo de hoy». Quien tenía cuenta antes de que saliera Premium lo
// tiene de regalo (lo decidiste el 31/10/2026): usó Moss cuando era gratis.

const DIA = 86_400_000;
/** Moss avisa esto antes de que termine la prueba (spec/suscripcion.md). */
const AVISO_ANTES = 2 * DIA;

export const PRODUCTOS = { mensual: 'uy.moss.premium.mensual', anual: 'uy.moss.premium.anual' } as const;
export type Plan = keyof typeof PRODUCTOS;
/** Lo que pide Premium, para decirlo al tocarlo. */
export type Bloqueo = 'plan' | 'metas' | 'sueno' | 'dormir' | 'todo';
/** Lo que dice Apple que hay comprado. `vence` en milisegundos; `renueva`, null si no se sabe. */
export type Suscripcion = { producto: string; vence: number; prueba: boolean; renueva: boolean | null };
export type EstadoDePremium = 'gratis' | 'prueba' | 'activa' | 'fundador';

/** Lo que Apple dice que hay es lo que vale: la gracia de un pago que falló ya está en su cuenta. */
export function estadoDePremium(d: { suscripcion: Suscripcion | null; fundador: boolean }): EstadoDePremium {
  if (d.fundador) return 'fundador';
  if (!d.suscripcion) return 'gratis';
  return d.suscripcion.prueba ? 'prueba' : 'activa';
}

export const tienePremium = (d: { suscripcion: Suscripcion | null; fundador: boolean }) => estadoDePremium(d) !== 'gratis';

/** Si la cuenta es de antes de que saliera Premium. `saleEl` es AAAA-MM-DD; sin cuenta, no. */
export function esFundador(cuentaCreada: string | null | undefined, saleEl: string): boolean {
  if (!cuentaCreada) return false;
  const creada = Date.parse(cuentaCreada);
  return Number.isFinite(creada) && creada < Date.parse(`${saleEl}T00:00:00Z`);
}

/** Cuántos días de prueba quedan, contando el de hoy. */
export const diasDePrueba = (s: Suscripcion, ahora: number) => Math.max(0, Math.ceil((s.vence - ahora) / DIA));

/** Cuándo avisar que termina la prueba: en milisegundos, o null si ya pasó, no hay prueba o se canceló. */
export function avisoDePrueba(s: Suscripcion | null, ahora: number): number | null {
  if (!s?.prueba || s.renueva === false) return null;
  const en = s.vence - AVISO_ANTES;
  return en > ahora ? en : null;
}

export const planDe = (s: Suscripcion): Plan => (s.producto === PRODUCTOS.anual ? 'anual' : 'mensual');

/** Cuánto menos sale el anual que doce meses, en %. */
export const ahorroDelAnual = (anual: number, mensual: number) => Math.round((1 - anual / (12 * mensual)) * 100);
