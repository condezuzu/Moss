// La suscripción en el teléfono (spec/suscripcion.md): lo que dice Apple (app-intents/Compras.swift), sin
// servidor ni terceros. Va en la build que tenga el módulo; sin él, o con PREMIUM_SALE sin poner, Moss
// sigue abierta como siempre. En la web, para probarla, una tienda de mentira.

import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import { acceso, DIAS_DE_PRUEBA, esDeRegalo, porMes, PRECIOS, PRODUCTOS, tieneAcceso, type Acceso, type Plan, type Suscripcion } from '@/dominio/premium';
import { idioma } from '@/textos';
import { CON_PREMIUM, PREMIUM_SALE } from './banderas';

/** `precio` y `porMes`, como los escribe Apple en la moneda de cada país. `prueba`, los días, si le corresponde. */
export type Producto = { id: string; precio: string; porMes: string; valor: number; prueba: number };
export type ResultadoDeCompra = 'comprado' | 'cancelado' | 'pendiente' | 'error';
export type ResultadoDeRestaurar = 'restaurada' | 'nada' | 'error';

type Tienda = {
  productos(ids: string[]): Promise<Producto[]>;
  estado(): Promise<Suscripcion | null>;
  ultima(ids: string[]): Promise<Suscripcion | null>;
  comprar(id: string): Promise<ResultadoDeCompra>;
  restaurar(): Promise<Suscripcion | null>;
  addListener(evento: 'alCambiar', oyente: () => void): { remove(): void };
};

/** Lo que Apple pide para administrar la suscripción: abre su pantalla, en Ajustes. */
const ADMINISTRAR = 'https://apps.apple.com/account/subscriptions';
/** Lo que se espera a Apple antes de decidir si va la pantalla de pago. */
const ESPERA_A_APPLE = 3000;
/** Lo que se esperan los precios de quien ya tuvo una, para saber si hay conexión. */
const ESPERA_A_LOS_PRECIOS = 5000;

/** El precio decidido, en dólares: el respaldo si la App Store no contesta (spec/suscripcion.md). */
export function precioDeRespaldo(valor: number): string {
  const n = new Intl.NumberFormat(idioma() === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `USD ${n.format(valor)}`;
}

/** Lo que no se puede probar en la web: los precios y la compra salen de acá. */
function tiendaDeMentira(): Tienda {
  let comprada: Suscripcion | null = null;
  const producto = (plan: Plan): Producto => ({ id: PRODUCTOS[plan], precio: precioDeRespaldo(PRECIOS[plan]), porMes: precioDeRespaldo(porMes(PRECIOS[plan])), valor: PRECIOS[plan], prueba: comprada ? 0 : DIAS_DE_PRUEBA });
  return {
    productos: async () => [producto('mensual'), producto('anual')],
    estado: async () => comprada,
    ultima: async () => comprada,
    comprar: async (id) => {
      comprada = { producto: id, vence: Date.now() + DIAS_DE_PRUEBA * 86_400_000, prueba: true, renueva: true };
      return 'comprado';
    },
    restaurar: async () => comprada,
    addListener: () => ({ remove() {} }),
  };
}

const tienda: Tienda | null = !CON_PREMIUM ? null
  : Platform.OS === 'web' ? tiendaDeMentira()
  : Platform.OS === 'ios' ? requireOptionalNativeModule<Tienda>('Compras')
  : null;

/** Si en esta build y en esta versión se cobra: si no, Moss sigue abierta y sin pantalla de pago. */
export const hayCompras = () => tienda !== null;

export type EstadoDePremium = {
  /** Si ya contestó Apple. Hasta entonces no aparece la pantalla de pago: quien pagó no la ve un instante. */
  listo: boolean;
  /** Lo vigente según Apple, con la gracia de un pago que falló adentro. */
  suscripcion: Suscripcion | null;
  /** La última que se conoce, aunque haya vencido. */
  ultima: Suscripcion | null;
  /** Cuándo se le preguntó a Apple: con esto se cuentan los días de prueba. */
  leido: number;
  /** Si la cuenta es de antes de que se prendiera. */
  regalo: boolean;
  productos: Partial<Record<Plan, Producto>>;
  /** Si no se pudieron traer los precios: no hay conexión con la App Store, y sin precio no se puede comprar. */
  sinPrecios: boolean;
};
let estado: EstadoDePremium = { listo: false, suscripcion: null, ultima: null, leido: 0, regalo: false, productos: {}, sinPrecios: false };
const oyentes = new Set<() => void>();
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};
function cambiar(nuevo: Partial<EstadoDePremium>) {
  estado = { ...estado, ...nuevo };
  oyentes.forEach((o) => o());
}

export async function leerPrecios(): Promise<void> {
  if (!tienda) return;
  try {
    const lista = await tienda.productos(Object.values(PRODUCTOS));
    const de = (id: string) => lista.find((p) => p.id === id);
    cambiar({ productos: { mensual: de(PRODUCTOS.mensual), anual: de(PRODUCTOS.anual) }, sinPrecios: lista.length === 0 });
  } catch {
    cambiar({ sinPrecios: true });
  }
}

/** Dice si contestó. Apple contesta sin conexión: si no contesta, no se le muestra la pantalla de pago a nadie. */
async function leerSuscripcion(): Promise<boolean> {
  if (!tienda) return false;
  try {
    const [suscripcion, ultima] = await Promise.all([tienda.estado(), tienda.ultima(Object.values(PRODUCTOS))]);
    cambiar({ suscripcion, ultima, leido: Date.now() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Quien tenía cuenta antes de que se prendiera, con cada cambio de sesión (lo avisa el almacén): así
 * también quien vuelve a entrar con su cuenta durante la entrada, antes de que se le ofrezca.
 */
export function cuentaDePremium(creada: string | null | undefined) {
  if (!PREMIUM_SALE) return;
  const regalo = esDeRegalo(creada, PREMIUM_SALE);
  if (regalo !== estado.regalo) cambiar({ regalo });
}

type LeerCuenta = () => Promise<string | null | undefined>;

async function arrancar(leerCuenta: LeerCuenta): Promise<void> {
  if (!tienda) return;
  const leerAlVolver = async () => {
    if ((await leerSuscripcion()) && !estado.listo) cambiar({ listo: true });
  };
  tienda.addListener('alCambiar', () => { leerAlVolver().catch(() => {}); });
  AppState.addEventListener('change', (a) => {
    if (a !== 'active') return;
    leerAlVolver().catch(() => {});
    if (estado.sinPrecios) leerPrecios().catch(() => {});
  });
  // Los precios, aparte: sin conexión tardan, y saber si tiene acceso no los necesita.
  const precios = leerPrecios().catch(() => {});
  // La cuenta guardada, sin esperar al primer aviso de la sesión. Sin sesión a mano, la trae ese aviso.
  const [contesto] = await Promise.all([leerSuscripcion(), leerCuenta().then(cuentaDePremium).catch(() => {})]);
  // Quien ya tuvo una y Apple no la da por vigente: si no hay conexión, pudo haber renovado.
  if (contesto && !estado.suscripcion && estado.ultima) {
    await Promise.race([precios, new Promise((listo) => setTimeout(listo, ESPERA_A_LOS_PRECIOS))]);
    if (!estado.productos.anual && !estado.productos.mensual) cambiar({ sinPrecios: true });
  }
  if (contesto) cambiar({ listo: true });
}

let arranque: Promise<void> | undefined;
/** Una vez: después se escucha lo que avisa Apple y se vuelve a mirar al volver a la app. */
export function arrancarPremium(leerCuenta: LeerCuenta): Promise<void> {
  arranque ??= arrancar(leerCuenta);
  return arranque;
}

/** Para decidir si va la pantalla de pago: lo que dice Apple, sin esperar de más. */
export const contestoApple = (): Promise<unknown> => Promise.race([arranque ?? Promise.resolve(), new Promise((listo) => setTimeout(listo, ESPERA_A_APPLE))]);

/** Avisa cuando cambia lo que se sabe: al contestar Apple, al comprar, al vencer. */
export const alCambiarPremium = suscribir;

export const accesoDe = (e: EstadoDePremium): Acceso => acceso({ suscripcion: e.suscripcion, regalo: e.regalo, ultima: e.ultima, sinConexion: e.sinPrecios, ahora: Date.now() });
export const accesoActual = (): Acceso => accesoDe(estado);
/** Para lo que corre solo (los avisos): sin saberlo, todavía no. Sin compras en esta build, sí. */
export const hayPremium = () => !tienda || (estado.listo && tieneAcceso(accesoActual()));
export const suscripcionActual = () => estado.suscripcion;

export function useEstadoDePremium(): EstadoDePremium {
  return useSyncExternalStore(suscribir, () => estado);
}

export async function comprar(plan: Plan): Promise<ResultadoDeCompra> {
  if (!tienda) return 'error';
  try {
    const resultado = await tienda.comprar(PRODUCTOS[plan]);
    if (resultado === 'comprado') await leerSuscripcion();
    return resultado;
  } catch {
    return 'error';
  }
}

/** Busca lo comprado con este Apple ID. Puede pedir entrar a la cuenta de Apple. */
export async function restaurar(): Promise<ResultadoDeRestaurar> {
  if (!tienda) return 'nada';
  try {
    const s = await tienda.restaurar();
    cambiar({ suscripcion: s, ultima: s ?? estado.ultima, leido: Date.now() });
    return s ? 'restaurada' : 'nada';
  } catch {
    return 'error';
  }
}

/** Cambiar de plan o cancelar: es de Apple, y lo abre su pantalla. */
export function administrarSuscripcion() {
  Linking.openURL(ADMINISTRAR).catch(() => {});
}
