// La suscripción (D40, spec/suscripcion.md): toda Moss es de pago, con 7 días de prueba. Acá, quién entra y
// lo que sale de eso. Con acceso se tiene todo; sin acceso, la pantalla de pago: nada se bloquea por partes.
// Quien tenía cuenta antes de que se prendiera la tiene de regalo: usó Moss cuando era gratis. El regalo dura
// 3 meses desde ese día, igual para todos (lo pediste el 22/11/2026; antes, desde el 31/10, era para siempre).

import { partesDe, sumarDias, type ClaveDia } from './fechas';

const DIA = 86_400_000;

export const DIAS_DE_PRUEBA = 7;
/** Moss avisa esto antes de que termine la prueba: el día 5 de 7, como dice la pantalla de pago. */
const AVISO_ANTES = 2 * DIA;
export const DIA_DEL_AVISO = DIAS_DE_PRUEBA - AVISO_ANTES / DIA;
/** Sin poder preguntarle a la App Store, quien renovaba sigue hasta esto después de la fecha que se sabe. */
const GRACIA_SIN_CONEXION = 7 * DIA;

export const PRODUCTOS = { mensual: 'uy.moss.suscripcion.mensual', anual: 'uy.moss.suscripcion.anual' } as const;
export type Plan = keyof typeof PRODUCTOS;
/** Lo decidido, en dólares: el respaldo si la App Store no contesta y la maqueta. Lo real lo da Apple en cada moneda. */
export const PRECIOS: Record<Plan, number> = { mensual: 9.99, anual: 39.99 };

/** Lo que dice Apple que hay comprado. `vence` en milisegundos; `renueva`, null si no se sabe. */
export type Suscripcion = { producto: string; vence: number; prueba: boolean; renueva: boolean | null };
/** `nueva` y `vencida` no tienen acceso: `nueva` nunca se suscribió; `vencida` sí, y terminó o canceló. */
export type Acceso = 'nueva' | 'prueba' | 'activa' | 'regalo' | 'vencida';

/**
 * La regla, una sola. `suscripcion` es lo vigente según Apple: la gracia de un pago que falló ya está en
 * su cuenta, y lo guarda en el teléfono, así que anda sin conexión. Lo único que Apple no puede saber sin
 * conexión es que renovó: por eso `ultima`, la última que se conoce aunque haya vencido, con `sinConexion`.
 * Una suscripción vigente va antes que el regalo: Apple la cobra igual, y es la que hay que mostrar y administrar.
 */
export function acceso(d: { suscripcion: Suscripcion | null; regalo: boolean; ultima?: Suscripcion | null; sinConexion?: boolean; ahora?: number }): Acceso {
  if (d.suscripcion) return d.suscripcion.prueba ? 'prueba' : 'activa';
  if (d.regalo) return 'regalo';
  if (!d.ultima) return 'nueva';
  const renovaria = d.sinConexion && d.ultima.renueva !== false && (d.ahora ?? 0) < d.ultima.vence + GRACIA_SIN_CONEXION;
  return renovaria ? 'activa' : 'vencida';
}

export const tieneAcceso = (a: Acceso) => a === 'prueba' || a === 'activa' || a === 'regalo';

/**
 * Desde cuándo tiene cuenta de Moss, según Supabase: la fecha de su identidad de Apple, porque Moss entra
 * solo con Apple. La del usuario de Auth puede ser más vieja: si el correo es el de su cuenta de Ascent,
 * Supabase une las dos (spec/ascent.md, «Dos cuentas»), y quien entró recién parecería de antes.
 */
export function cuentaDeMossDesde(u: { created_at?: string; identities?: { provider: string; created_at?: string }[] | null } | null | undefined): string | null {
  if (!u) return null;
  return u.identities?.find((i) => i.provider === 'apple')?.created_at ?? u.created_at ?? null;
}

/**
 * La fecha de la cuenta que vale para el regalo: la de la sesión y, sin sesión, la que quedó guardada en el
 * teléfono, porque sin conexión y con el token vencido la sesión llega vacía aunque se siga adentro (sin conexión
 * nadie queda afuera). Al salir de la cuenta o borrarla, ninguna.
 */
export function cuentaParaElRegalo(deLaSesion: string | null | undefined, guardada: string | null | undefined, salio: boolean): string | null {
  if (salio) return null;
  return deLaSesion || guardada || null;
}

/**
 * Si la cuenta es de antes de que se prendiera. `saleEl` es AAAA-MM-DD; sin cuenta, no. Vigente, mientras dura el
 * regalo (regaloVigente). El corte es la medianoche de Uruguay, donde se eligió la fecha (UTC−3, sin horario de
 * verano desde 2015): en UTC, quien la creó el día anterior después de las 21 quedaba afuera.
 */
export function esDeRegalo(cuentaCreada: string | null | undefined, saleEl: string): boolean {
  if (!cuentaCreada) return false;
  const creada = Date.parse(cuentaCreada);
  return Number.isFinite(creada) && creada < Date.parse(`${saleEl}T00:00:00-03:00`);
}

export const MESES_DE_REGALO = 3;
/** Moss avisa que termina el regalo dos días antes de su último día, a esta hora. */
const AVISO_DEL_REGALO = { dias: 2, hora: 10 };

/**
 * El último día del regalo: el mismo número de día, tres meses después del día en que Moss pasó a ser de pago
 * (del 14/11 al 14/2; del 30/11, el último de febrero). Ese día también es de regalo.
 */
export function finDelRegalo(saleEl: ClaveDia): ClaveDia {
  const p = partesDe(saleEl);
  const mes = p.mes + MESES_DE_REGALO;
  const anio = p.anio + Math.floor(mes / 12);
  const enElMes = ((mes % 12) + 12) % 12;
  const ultimo = new Date(Date.UTC(anio, enElMes + 1, 0)).getUTCDate();
  return `${anio}-${String(enElMes + 1).padStart(2, '0')}-${String(Math.min(p.dia, ultimo)).padStart(2, '0')}`;
}

/** Cuándo termina el regalo, en milisegundos: la medianoche, en la hora del teléfono, después de su último día. */
export function hastaDelRegalo(fin: ClaveDia): number {
  const p = partesDe(sumarDias(fin, 1));
  return new Date(p.anio, p.mes, p.dia).getTime();
}

export const regaloVigente = (fin: ClaveDia, ahora: number) => ahora < hastaDelRegalo(fin);

/** Cuándo avisar que termina el regalo, en milisegundos, o null si ya pasó. */
export function avisoDelRegalo(fin: ClaveDia, ahora: number): number | null {
  const p = partesDe(sumarDias(fin, -AVISO_DEL_REGALO.dias));
  const en = new Date(p.anio, p.mes, p.dia, AVISO_DEL_REGALO.hora).getTime();
  return en > ahora ? en : null;
}

/** Cuántos días de prueba quedan, contando el de hoy. */
export const diasDePrueba = (s: Suscripcion, ahora: number) => Math.max(0, Math.ceil((s.vence - ahora) / DIA));

/** Cuándo avisar que termina la prueba: en milisegundos, o null si ya pasó, no hay prueba o se canceló. */
export function avisoDePrueba(s: Suscripcion | null, ahora: number): number | null {
  if (!s?.prueba || s.renueva === false) return null;
  const en = s.vence - AVISO_ANTES;
  return en > ahora ? en : null;
}

/**
 * Hasta cuándo pueden sonar los avisos que se programan, en milisegundos. Con la prueba o la suscripción
 * cancelada, hasta que vence: después no hay acceso y no suena nada, aunque Moss no se abra para borrarlos.
 * De regalo, hasta que termina el regalo (`regaloHasta`, en milisegundos). Renovándose, null: sin fin.
 * Con las dos, lo que dure más: al vencer la cancelada antes que el regalo, sigue el regalo.
 */
export function avisosHasta(s: Suscripcion | null, a: Acceso, regaloHasta: number | null = null): number | null {
  if (a === 'regalo') return regaloHasta;
  return s?.renueva === false ? Math.max(s.vence, regaloHasta ?? s.vence) : null;
}

export const planDe = (s: Suscripcion): Plan => (s.producto === PRODUCTOS.anual ? 'anual' : 'mensual');

/** Lo que sale un mes del plan anual, con los decimales de la moneda (0 en yenes, 2 en dólares). */
export function porMes(anual: number, decimales = 2): number {
  const f = 10 ** decimales;
  return Math.round((anual / 12) * f) / f;
}

/** Cuánto menos sale el anual que doce meses, en %. */
export const ahorroDelAnual = (anual: number, mensual: number) => Math.round((1 - anual / (12 * mensual)) * 100);

/**
 * El código de oferta como se lo pasa a la App Store: solo letras y números, hasta 64 (App Store Connect no
 * deja crear otros). Los espacios escritos de más se sacan; con cualquier otra cosa, null.
 */
export function codigoDeOferta(escrito: string): string | null {
  const codigo = escrito.replace(/\s/g, '');
  return /^[A-Za-z0-9]{1,64}$/.test(codigo) ? codigo : null;
}
