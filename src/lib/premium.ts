// Moss Premium en el teléfono (spec/suscripcion.md): lo que dice Apple (app-intents/Compras.swift), sin
// servidor ni terceros. Va en la build que tenga el módulo; sin él, o con PREMIUM_SALE sin poner, todo
// sigue abierto como siempre. En la web, para probarla, una tienda de mentira.

import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';

import { esFundador, PRODUCTOS, tienePremium, type Plan, type Suscripcion } from '@/dominio/premium';
import { CON_PREMIUM, PREMIUM_SALE } from './banderas';

/** `precio` y `porMes`, como los escribe Apple en la moneda de cada país. `prueba`, los días, si le corresponde. */
export type Producto = { id: string; precio: string; porMes: string; valor: number; prueba: number };
export type ResultadoDeCompra = 'comprado' | 'cancelado' | 'pendiente' | 'error';

type Tienda = {
  productos(ids: string[]): Promise<Producto[]>;
  estado(): Promise<Suscripcion | null>;
  comprar(id: string): Promise<ResultadoDeCompra>;
  restaurar(): Promise<Suscripcion | null>;
  addListener(evento: 'alCambiar', oyente: () => void): { remove(): void };
};

/** Lo que no se puede probar en la web: los precios y la compra salen de acá. */
function tiendaDeMentira(): Tienda {
  let comprada: Suscripcion | null = null;
  return {
    productos: async () => [
      { id: PRODUCTOS.mensual, precio: 'USD 4,99', porMes: 'USD 0,42', valor: 4.99, prueba: 7 },
      { id: PRODUCTOS.anual, precio: 'USD 29,99', porMes: 'USD 2,50', valor: 29.99, prueba: 7 },
    ],
    estado: async () => comprada,
    comprar: async (id) => {
      comprada = { producto: id, vence: Date.now() + 7 * 86_400_000, prueba: true, renueva: true };
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

/** Si en esta build y en esta versión hay Premium: si no, nada se bloquea. */
export const hayCompras = () => tienda !== null;

type Estado = {
  /** Si ya contestó Apple. Hasta entonces no se muestra nada bloqueado: quien pagó no ve el candado un instante. */
  listo: boolean;
  suscripcion: Suscripcion | null;
  /** Cuándo se le preguntó a Apple: con esto se cuentan los días de prueba. */
  leido: number;
  fundador: boolean;
  productos: Partial<Record<Plan, Producto>>;
  /** Si no se pudieron traer los precios (sin conexión): sin precio no se puede ofrecer. */
  sinPrecios: boolean;
};
let estado: Estado = { listo: false, suscripcion: null, leido: 0, fundador: false, productos: {}, sinPrecios: false };
const oyentes = new Set<() => void>();
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};
function cambiar(nuevo: Partial<Estado>) {
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

async function leerSuscripcion(): Promise<void> {
  if (!tienda) return;
  try {
    cambiar({ suscripcion: await tienda.estado(), leido: Date.now() });
  } catch {
    // Sin respuesta queda lo que había: Apple contesta sin conexión, así que casi no pasa.
  }
}

/**
 * Quien tenía cuenta antes de que saliera Premium, con cada cambio de sesión (lo avisa el almacén): así
 * también quien vuelve a entrar con su cuenta durante la entrada, antes de que se le ofrezca.
 */
export function cuentaDePremium(creada: string | null | undefined) {
  if (!PREMIUM_SALE) return;
  const fundador = esFundador(creada, PREMIUM_SALE);
  if (fundador !== estado.fundador) cambiar({ fundador });
}

type LeerCuenta = () => Promise<string | null | undefined>;

async function arrancar(leerCuenta: LeerCuenta): Promise<void> {
  if (!tienda) return;
  tienda.addListener('alCambiar', () => { leerSuscripcion().catch(() => {}); });
  AppState.addEventListener('change', (a) => {
    if (a !== 'active') return;
    leerSuscripcion().catch(() => {});
    if (estado.sinPrecios) leerPrecios().catch(() => {});
  });
  // Los precios, aparte: sin conexión tardan, y saber si tiene Premium no los necesita.
  leerPrecios().catch(() => {});
  // La cuenta guardada, sin esperar al primer aviso de la sesión. Sin sesión a mano, la trae ese aviso.
  await Promise.all([leerSuscripcion(), leerCuenta().then(cuentaDePremium).catch(() => {})]);
  cambiar({ listo: true });
}

let arranque: Promise<void> | undefined;
/** Una vez: después se escucha lo que avisa Apple y se vuelve a mirar al volver a la app. */
export function arrancarPremium(leerCuenta: LeerCuenta): Promise<void> {
  arranque ??= arrancar(leerCuenta);
  return arranque;
}

/** Avisa cuando cambia lo que se sabe: al contestar Apple, al comprar, al vencer. */
export const alCambiarPremium = suscribir;

const conPremium = () => tienePremium(estado);
/** Para lo que corre solo (el control, la noche, los avisos): sin saberlo, todavía no. */
export const hayPremium = () => !tienda || (estado.listo && conPremium());
/** Para lo que se ve: hasta que conteste Apple, nada aparece bloqueado. */
export const pareceTenerPremium = () => !tienda || !estado.listo || conPremium();
export const suscripcionActual = () => estado.suscripcion;

export function useEstadoDePremium(): Estado {
  return useSyncExternalStore(suscribir, () => estado);
}
export function useTienePremium(): boolean {
  useEstadoDePremium();
  return pareceTenerPremium();
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

/** Si encontró algo para restaurar. Puede pedir entrar con el Apple ID. */
export async function restaurar(): Promise<boolean> {
  if (!tienda) return false;
  try {
    const s = await tienda.restaurar();
    cambiar({ suscripcion: s, leido: Date.now() });
    return s !== null;
  } catch {
    return false;
  }
}
