// La suscripción en el teléfono (spec/suscripcion.md): lo que dice Apple (app-intents/Compras.swift), sin
// servidor ni terceros. Va en la build que tenga el módulo; sin él, o con PREMIUM_SALE sin poner, Moss
// sigue abierta como siempre. En la web, para probarla, una tienda de mentira.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo';
import { useSyncExternalStore } from 'react';
import { AppState, Linking, Platform } from 'react-native';

import type { ClaveDia } from '@/dominio/fechas';
import { acceso, ahorroDelAnual, codigoDeOferta, cuentaParaElRegalo, DIAS_DE_PRUEBA, esDeRegalo, finDelRegalo, hastaDelRegalo, porMes, PRECIOS, PRODUCTOS, regaloVigente, tieneAcceso, type Acceso, type Plan, type Suscripcion } from '@/dominio/premium';
import { idioma } from '@/textos';
import { CON_PREMIUM, PREMIUM_SALE } from './banderas';

/** `precio` y `porMes`, como los escribe Apple en la moneda de cada país. `prueba`, los días, si le corresponde. */
export type Producto = { id: string; precio: string; porMes: string; valor: number; prueba: number };
export type ResultadoDeCompra = 'comprado' | 'cancelado' | 'pendiente' | 'error';
export type ResultadoDeRestaurar = 'restaurada' | 'nada' | 'error';
/** `sinCodigo`: esta build no trae la hoja de Apple y el código que se pasó no puede ser uno. */
export type ResultadoDeCanje = 'abierto' | 'sinCodigo' | 'error';
/** Lo que se sabe del precio de un plan: `esperando`, hasta que Apple contesta la primera vez; después, por qué falta. */
export type PrecioDelPlan = 'listo' | 'esperando' | 'sinRespuesta' | 'faltaEnLaTienda';

type Tienda = {
  productos(ids: string[]): Promise<Producto[]>;
  estado(): Promise<Suscripcion | null>;
  ultima(ids: string[]): Promise<Suscripcion | null>;
  comprar(id: string): Promise<ResultadoDeCompra>;
  restaurar(): Promise<Suscripcion | null>;
  /** La hoja de Apple para canjear un código: recién en la build que la trae. false si no pudo abrirla. */
  canjearCodigo?(): Promise<boolean>;
  addListener(evento: 'alCambiar', oyente: () => void): { remove(): void };
};

/** Lo que Apple pide para administrar la suscripción: abre su pantalla, en Ajustes. */
const ADMINISTRAR = 'https://apps.apple.com/account/subscriptions';
/** El enlace de canje de la App Store (spec/suscripcion.md): el de la página de la oferta; el código, si se sabe, va al final. */
const CANJEAR = 'https://apps.apple.com/redeem?ctx=offercodes&id=6828034537';
/** Lo que se espera a Apple antes de decidir si va la pantalla de pago. */
const ESPERA_A_APPLE = 3000;
/** Lo que se esperan los precios de quien ya tuvo una, para saber si hay conexión. */
const ESPERA_A_LOS_PRECIOS = 5000;
/** Lo más que se espera cada pedido de precios: si StoreKit no contesta, el siguiente tiene que poder salir. */
const TOPE_DE_LOS_PRECIOS = 10_000;
/**
 * Mientras se los mira y faltan, cada cuánto se vuelven a pedir solos; la última espera se repite. Crecen hasta
 * cinco minutos: la pantalla de pago es la pantalla fija de quien venció, y con un pedido cada 30 segundos eran
 * más de cien por hora.
 */
const ESPERAS_DE_LOS_PRECIOS = [2000, 4000, 8000, 15_000, 30_000, 60_000, 300_000];
/** Un pedido a mano («Reintentar», o volver a Moss) espera al que está en camino solo si salió hace menos que esto. */
const PEDIDO_RECIENTE = 2000;
/** Con StoreKit colgado, lo más que se junta sin contestar: de los que salen solos y, contando los pedidos a mano, en total. */
const SIN_CONTESTAR = 3;
const SIN_CONTESTAR_A_MANO = 6;
/** Después de una compra, si Apple todavía no la da por vigente: cuántas veces más se le pregunta, y cada cuánto. */
const RELEER_LA_COMPRA = 3;
const ENTRE_RELECTURAS = 300;

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
  /** Si la cuenta es de antes de que se prendiera: tiene el regalo mientras dura (finDelRegaloActual). */
  regalo: boolean;
  productos: Partial<Record<Plan, Producto>>;
  /**
   * Si no se pudieron traer los precios (la App Store no contestó, o contestó sin ninguno): para el acceso vale
   * como estar sin conexión (accesoDe), y sin precio no se puede comprar.
   */
  sinPrecios: boolean;
  /** Si la App Store contestó y falta el precio de algún plan: no es la conexión, y la pantalla de pago no dice que lo sea. */
  faltanEnLaTienda: boolean;
};
let estado: EstadoDePremium = { listo: false, suscripcion: null, ultima: null, leido: 0, regalo: false, productos: {}, sinPrecios: false, faltanEnLaTienda: false };
const oyentes = new Set<() => void>();
const suscribir = (o: () => void) => {
  oyentes.add(o);
  return () => { oyentes.delete(o); };
};
function cambiar(nuevo: Partial<EstadoDePremium>) {
  estado = { ...estado, ...nuevo };
  oyentes.forEach((o) => o());
}

/**
 * Que el acceso no dependa del orden en que terminan los pedidos de precios. `paso`, un reloj que solo avanza, ordena
 * cuándo sale cada pedido, cuándo llegan precios y cuándo se le pregunta a Apple, y con él valen dos reglas:
 * (i) «no hay conexión» lo dice un pedido que falla, llega vacío o no contesta a tiempo, haya o no otro en camino,
 *     salvo que después de que salió hayan llegado precios (sinConexionDesde);
 * (ii) bajar a «vencida» a quien pudo renovar sin conexión pide una respuesta de Apple de después de los últimos
 *     precios: si llegaron después de la pregunta, se le vuelve a preguntar antes de cambiar nada (loQueDiceApple).
 */
let paso = 0;
/** El paso de los últimos precios que llegaron y el del último «no hay conexión» que valió. */
let ultimoExito = 0;
let ultimoFallo = 0;
/** Un pedido de precios: `listo` termina cuando contesta o a su tope; `salida`, el paso en que salió. */
type Pedido = { listo: Promise<void>; salida: number };
/** El que está en camino, hasta su tope: mientras tanto, los que salen solos esperan a ese. */
let enCamino: Pedido | null = null;
let restaurando: Promise<ResultadoDeRestaurar> | null = null;
/** Cuándo salió el último, y cuántos le quedan a StoreKit sin contestar. */
let salioEl = 0;
let sinContestar = 0;
/** Cuántas pantallas están mirando los precios, el reloj del pedido que sigue y por cuál de las esperas va. */
let mirando = 0;
let reloj: ReturnType<typeof setTimeout> | undefined;
let espera = 0;

const faltanPrecios = () => !estado.productos.mensual || !estado.productos.anual;

/**
 * Pide los precios; si ya hay un pedido en camino, es ese. `aMano`: lo pidió la persona (tocó «Reintentar» o
 * volvió a Moss). Si el que está en camino salió hace más de un momento, sale uno nuevo en vez de colgarse de uno
 * que puede estar condenado, y las esperas de los que salen solos empiezan de nuevo. Con muchos sin contestar no
 * sale ninguno más: StoreKit está colgado, y otro pedido no lo arregla.
 */
function pedirPrecios(aMano = false): Pedido | null {
  if (!tienda) return null;
  if (aMano) {
    clearTimeout(reloj);
    reloj = undefined;
    espera = 0;
  }
  if (enCamino && (!aMano || Date.now() - salioEl < PEDIDO_RECIENTE)) return enCamino;
  if (sinContestar >= (aMano ? SIN_CONTESTAR_A_MANO : SIN_CONTESTAR)) {
    seguirPidiendo();
    return enCamino;
  }
  const salida = ++paso;
  salioEl = Date.now();
  const pedido: Pedido = {
    salida,
    listo: leerLosPrecios(salida).finally(() => {
      if (enCamino === pedido) enCamino = null;
      seguirPidiendo();
    }),
  };
  enCamino = pedido;
  return pedido;
}

export const leerPrecios = (aMano = false): Promise<void> => pedirPrecios(aMano)?.listo ?? Promise.resolve();

/** Agenda el pedido que sigue, si alguien está mirando los precios y falta alguno. */
function seguirPidiendo() {
  if (reloj !== undefined || mirando === 0 || !faltanPrecios()) return;
  reloj = setTimeout(() => {
    reloj = undefined;
    pedirSolos();
  }, ESPERAS_DE_LOS_PRECIOS[Math.min(espera++, ESPERAS_DE_LOS_PRECIOS.length - 1)]);
}

function pedirSolos() {
  if (mirando > 0 && faltanPrecios()) leerPrecios().catch(() => {});
}

/** Si tiene acceso solo porque no hay conexión (accesoDe): ya tuvo una, Apple no la da por vigente y renovaba. */
const dependeDeLaConexion = () => estado.sinPrecios && tieneAcceso(accesoDe(estado)) && !tieneAcceso(accesoDe({ ...estado, sinPrecios: false }));

async function leerLosPrecios(salida: number): Promise<void> {
  if (!tienda) return;
  sinContestar++;
  let contesto = false;
  const sinRespuesta = () => sinConexionDesde(salida, false);
  const pedido = (async () => {
    let lista: Producto[] | null = null;
    try {
      lista = await tienda.productos(Object.values(PRODUCTOS));
    } catch {
      // Sin lista: abajo queda anotado que no contestó.
    }
    contesto = true;
    sinContestar--;
    if (Array.isArray(lista)) await llegaronLosPrecios(lista, salida);
    else sinRespuesta();
  })();
  let relojDelTope: ReturnType<typeof setTimeout> | undefined;
  const tope = new Promise<void>((listo) => {
    relojDelTope = setTimeout(listo, TOPE_DE_LOS_PRECIOS);
  }).then(() => {
    if (!contesto) sinRespuesta();
  });
  await Promise.race([pedido, tope]);
  clearTimeout(relojDelTope);
}

/** Regla (i): no hay conexión, salvo que después de que salió el pedido (`salida`) ya hayan llegado precios. */
function sinConexionDesde(salida: number, faltanEnLaTienda: boolean) {
  if (ultimoExito > salida) return;
  ultimoFallo = ++paso;
  cambiar({ sinPrecios: true, faltanEnLaTienda });
}

/**
 * Llegó una lista de la App Store. Con algún precio, hay conexión ahora (haya salido el pedido cuando haya salido),
 * y lo que trae se suma a lo que ya se tenía: un precio que ya llegó no se pierde porque esta lista traiga menos.
 * Vacía, vale para el acceso como estar sin conexión (regla i).
 */
async function llegaronLosPrecios(lista: Producto[], salida: number): Promise<void> {
  const de = (id: string) => lista.find((p) => p.id === id);
  const mensual = de(PRODUCTOS.mensual);
  const anual = de(PRODUCTOS.anual);
  if (!mensual && !anual) {
    sinConexionDesde(salida, faltanPrecios());
    return;
  }
  ultimoExito = ++paso;
  const productos = { ...estado.productos, ...(mensual ? { mensual } : {}), ...(anual ? { anual } : {}) };
  const conEllos = { productos, faltanEnLaTienda: !productos.mensual || !productos.anual };
  if (!dependeDeLaConexion()) {
    cambiar({ ...conEllos, sinPrecios: false });
    return;
  }
  // Sigue adentro solo porque no había conexión: Apple, que sin conexión no podía saber que renovó, ahora puede.
  // Los precios se ven ya, pero sinPrecios baja recién con lo que conteste Apple, y en el mismo cambio: si no,
  // quedaba «vencida» con lo que Apple había dicho sin conexión. Si Apple no contesta, sigue adentro, y también si
  // mientras tanto un pedido más nuevo constató que no hay conexión.
  cambiar(conEllos);
  const respuesta = await preguntarAApple();
  if (respuesta) cambiar({ sinPrecios: ultimoFallo > ultimoExito, ...loQueVale(respuesta) });
}

/**
 * Mientras se miran los precios (la pantalla de pago, lo que cuesta en la entrada, Tu suscripción): si falta
 * alguno, se pide, y se vuelve a pedir solo hasta tenerlos, cada vez más espaciado. Antes se pedían una vez, al
 * abrir Moss, y si esa vez fallaba la pantalla quedaba sin precio hasta tocar «Reintentar» o salir y volver.
 * Devuelve cómo dejar de pedir.
 */
export function pedirLosPreciosQueFalten(): () => void {
  if (!tienda) return () => {};
  mirando++;
  // Cada pantalla que se abre empieza de nuevo por las esperas cortas.
  clearTimeout(reloj);
  reloj = undefined;
  espera = 0;
  pedirSolos();
  let abierta = true;
  return () => {
    if (!abierta) return;
    abierta = false;
    if (--mirando > 0) return;
    clearTimeout(reloj);
    reloj = undefined;
  };
}

export function precioDelPlan(e: EstadoDePremium, plan: Plan): PrecioDelPlan {
  if (e.productos[plan]) return 'listo';
  if (e.faltanEnLaTienda) return 'faltaEnLaTienda';
  return e.sinPrecios ? 'sinRespuesta' : 'esperando';
}

/**
 * Lo que se muestra de cada plan: su precio de Apple o, si falta, el decidido en dólares. Lo que acompaña al anual
 * sale de la misma fuente que su precio: «por mes», siempre; el ahorro, solo si el mensual también (comparar un
 * precio de Apple con uno de respaldo, que puede estar en otra moneda, no dice nada), y si no, null.
 */
export function preciosDe(e: EstadoDePremium): { anual: string; mensual: string; porMes: string; ahorro: number | null } {
  const { anual, mensual } = e.productos;
  const ahorro = anual && mensual ? ahorroDelAnual(anual.valor, mensual.valor) : anual || mensual ? null : ahorroDelAnual(PRECIOS.anual, PRECIOS.mensual);
  return {
    anual: anual?.precio ?? precioDeRespaldo(PRECIOS.anual),
    mensual: mensual?.precio ?? precioDeRespaldo(PRECIOS.mensual),
    porMes: anual?.porMes ?? precioDeRespaldo(porMes(PRECIOS.anual)),
    ahorro,
  };
}

/**
 * El plan que queda elegido en la pantalla de pago. Si el de ahora no tiene precio y el otro sí, el otro: así el
 * botón compra en vez de decir «Reintentar». Lo que eligió la persona no se pisa, y de un plan que se puede comprar
 * no se sale solo (aunque después llegue el otro: lo cambiaría justo cuando va a tocar el botón).
 */
export function planQueSePuede(elegido: Plan, loEligio: boolean, productos: EstadoDePremium['productos']): Plan {
  const otro: Plan = elegido === 'anual' ? 'mensual' : 'anual';
  return !loEligio && !productos[elegido] && productos[otro] ? otro : elegido;
}

type Lectura = Pick<EstadoDePremium, 'suscripcion' | 'ultima' | 'leido'>;
/** `orden`: el paso en que se le preguntó. */
type Respuesta = { lectura: Lectura; orden: number };
/** El de la respuesta guardada: lo que contesta a una pregunta anterior no pisa lo ya guardado de una posterior. */
let guardadaLaDe = 0;

/** Lo que dice Apple, sin guardarlo todavía; null si no contestó. Apple contesta sin conexión. */
async function preguntarAApple(): Promise<Respuesta | null> {
  if (!tienda) return null;
  const orden = ++paso;
  try {
    const [suscripcion, ultima] = await Promise.all([tienda.estado(), tienda.ultima(Object.values(PRODUCTOS))]);
    return { lectura: { suscripcion, ultima, leido: Date.now() }, orden };
  } catch {
    return null;
  }
}

/** Lo que hay que guardar de una respuesta de Apple: nada, si ya se guardó la de una pregunta posterior. */
function loQueVale(respuesta: Respuesta): Partial<EstadoDePremium> {
  if (respuesta.orden < guardadaLaDe) return {};
  guardadaLaDe = respuesta.orden;
  return respuesta.lectura;
}

/**
 * Se esperan los precios del pedido, hasta 5 s: si no llegan, no hay conexión (salvo que hayan llegado de otro
 * después de que salió, regla i). Terminar no es contestar: si termina sin precios y hay otro más nuevo en camino,
 * se sigue esperando a ese con lo que queda.
 */
async function esperarLosPrecios(pedido: Pedido | null): Promise<void> {
  if (!pedido) return;
  const hasta = Date.now() + ESPERA_A_LOS_PRECIOS;
  let esperado = pedido;
  for (;;) {
    let relojDeLaEspera: ReturnType<typeof setTimeout> | undefined;
    const termino = await Promise.race([esperado.listo.then(() => true), new Promise<boolean>((listo) => { relojDeLaEspera = setTimeout(() => listo(false), Math.max(0, hasta - Date.now())); })]);
    clearTimeout(relojDeLaEspera);
    if (!termino) {
      // Tampoco se sigue diciendo que el precio falta en la tienda: eso era de una respuesta anterior, y esta vez no contestó.
      sinConexionDesde(pedido.salida, false);
      return;
    }
    if (ultimoExito > esperado.salida || !enCamino || enCamino === esperado) return;
    esperado = enCamino;
  }
}

/**
 * Lo que dice Apple, para guardar; null si no contestó. Quien ya tuvo una y Apple no la da por vigente pudo haber
 * renovado sin conexión: se esperan los precios (`precios`, o un pedido nuevo: los de antes no dicen si ahora hay
 * conexión) y, si llegaron después de la pregunta, se le vuelve a preguntar (regla ii). Si no llegan, no hay conexión
 * y sigue adentro.
 */
async function loQueDiceApple(precios?: Pedido | null): Promise<Respuesta | null> {
  const respuesta = await preguntarAApple();
  if (!respuesta || respuesta.lectura.suscripcion || !respuesta.lectura.ultima) return respuesta;
  await esperarLosPrecios(precios ?? pedirPrecios(true));
  return ultimoExito > respuesta.orden ? preguntarAApple() : respuesta;
}

/** Guarda lo que dice Apple, con `mas` en el mismo cambio. Dice si contestó: si no, no se le muestra la pantalla de pago a nadie. */
async function leerSuscripcion(precios?: Pedido | null, mas: Partial<EstadoDePremium> = {}): Promise<boolean> {
  const respuesta = await loQueDiceApple(precios);
  if (respuesta) cambiar({ ...loQueVale(respuesta), ...mas });
  return !!respuesta;
}

/**
 * La fecha de la cuenta, guardada aparte de la sesión: sin conexión y con el token vencido, la sesión llega
 * vacía (sin SIGNED_OUT), y quien la tiene de regalo vería la pantalla de pago. Se guarda también con
 * PREMIUM_SALE sin poner: así ya está el día que se prende.
 */
const CUENTA_GUARDADA = 'moss:cuentaDeMoss';
/** La que está guardada; undefined mientras no se leyó. */
let guardada: string | null | undefined;
/** Una sola lectura: con dos, la primera en terminar ya tiene que dejar el regalo puesto. */
let leyendoGuardada: Promise<void> | undefined;

/**
 * Quien tenía cuenta antes de que se prendiera, con cada cambio de sesión (lo avisa el almacén): así
 * también quien vuelve a entrar con su cuenta durante la entrada, antes de que se le ofrezca. `salio`: se
 * cerró la sesión o se borró la cuenta, y lo guardado se olvida.
 */
export async function cuentaDePremium(creada: string | null | undefined, salio = false): Promise<void> {
  if ((creada || salio) && (creada || null) !== guardada) {
    guardada = creada || null;
    (creada ? AsyncStorage.setItem(CUENTA_GUARDADA, creada) : AsyncStorage.removeItem(CUENTA_GUARDADA)).catch(() => {});
  }
  if (!PREMIUM_SALE) return;
  if (guardada === undefined) {
    leyendoGuardada ??= AsyncStorage.getItem(CUENTA_GUARDADA).catch(() => null).then((leida) => {
      // Mientras se leía llegó otra sesión (una cuenta o una salida): vale esa, que ya está en guardada.
      if (guardada === undefined) guardada = leida;
    });
    await leyendoGuardada;
  }
  const regalo = esDeRegalo(cuentaParaElRegalo(creada, guardada, salio), PREMIUM_SALE);
  if (regalo !== estado.regalo) cambiar({ regalo });
}

type LeerCuenta = () => Promise<string | null | undefined>;

async function arrancar(leerCuenta: LeerCuenta): Promise<void> {
  if (!tienda) return;
  // Hasta que se decide lo que dice Apple (loQueDiceApple) queda lo de antes: si no, quien renovó vería la pantalla
  // de pago mientras tanto. Si mientras se esperaba se guardó algo más nuevo (una compra, restaurar, o lo que dijo
  // Apple al llegar los precios), vale eso.
  // El acceso se sabe recién con la cuenta leída: al abrir, iOS avisa que Moss pasó al frente (y Apple manda lo suyo)
  // antes, y quien tiene el regalo veía la pantalla de pago un instante. Se espera la cuenta, no la primera respuesta
  // de Apple: si esa se colgaba, lo que contestaba después no servía. Sin sesión (o si falla), vale la guardada.
  const cuenta = leerCuenta().catch(() => undefined).then(cuentaDePremium).catch(() => {});
  const leerAlVolver = async () => {
    const contesto = await leerSuscripcion();
    await cuenta;
    if (contesto && !estado.listo) cambiar({ listo: true });
  };
  tienda.addListener('alCambiar', () => { leerAlVolver().catch(() => {}); });
  AppState.addEventListener('change', (a) => {
    if (a !== 'active') return;
    leerAlVolver().catch(() => {});
    // También si falta alguno sin que conste que falló: el pedido de antes podía seguir en camino y fallar después.
    if (estado.sinPrecios || faltanPrecios()) leerPrecios(true).catch(() => {});
  });
  // Los precios, aparte: sin conexión tardan, y saber si tiene acceso solo los espera quien ya tuvo una.
  const precios = pedirPrecios();
  // La cuenta, sin esperar al primer aviso de la sesión. Sin sesión a mano, la trae ese aviso.
  const [contesto] = await Promise.all([leerSuscripcion(precios), cuenta]);
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

/** El último día del regalo de quien tenía cuenta de antes; sin regalo, null. */
export const finDelRegaloDe = (e: EstadoDePremium): ClaveDia | null => (e.regalo && PREMIUM_SALE ? finDelRegalo(PREMIUM_SALE) : null);
export const finDelRegaloActual = () => finDelRegaloDe(estado);
/** Cuándo termina el regalo, en milisegundos; sin regalo, null. */
export function hastaDelRegaloActual(): number | null {
  const fin = finDelRegaloActual();
  return fin ? hastaDelRegalo(fin) : null;
}

export function accesoDe(e: EstadoDePremium): Acceso {
  const fin = finDelRegaloDe(e);
  return acceso({ suscripcion: e.suscripcion, regalo: !!fin && regaloVigente(fin, Date.now()), ultima: e.ultima, sinConexion: e.sinPrecios, ahora: Date.now() });
}
export const accesoActual = (): Acceso => accesoDe(estado);
/** Si ya se sabe si hay acceso: hasta que Apple y la cuenta contestan, no (y sin compras en esta build, sí). */
export const seSabeElAcceso = () => !tienda || estado.listo;
/** Para lo que corre solo (los avisos): sin saberlo, todavía no. Sin compras en esta build, sí. */
export const hayPremium = () => !tienda || (estado.listo && tieneAcceso(accesoActual()));
export const suscripcionActual = () => estado.suscripcion;

export const estadoDePremium = () => estado;

export function useEstadoDePremium(): EstadoDePremium {
  return useSyncExternalStore(suscribir, estadoDePremium);
}

export async function comprar(plan: Plan): Promise<ResultadoDeCompra> {
  if (!tienda) return 'error';
  try {
    const resultado = await tienda.comprar(PRODUCTOS[plan]);
    if (resultado === 'comprado') await leerLaCompra();
    return resultado;
  } catch {
    return 'error';
  }
}

/**
 * Lo que dice Apple después de una compra que confirmó: hubo conexión, y no se esperan los precios (con StoreKit
 * lento, eran 5 s de «Un momento…» y un «sin conexión» falso). Si todavía no la da por vigente, se le vuelve a
 * preguntar unas pocas veces, cortas, antes de mostrar el resultado.
 */
async function leerLaCompra(): Promise<void> {
  let respuesta = await preguntarAApple();
  for (let vez = 0; vez < RELEER_LA_COMPRA && !respuesta?.lectura.suscripcion; vez++) {
    await new Promise((listo) => setTimeout(listo, ENTRE_RELECTURAS));
    respuesta = (await preguntarAApple()) ?? respuesta;
  }
  if (respuesta) cambiar(loQueVale(respuesta));
}

/**
 * Busca lo comprado con este Apple ID. Puede pedir entrar a la cuenta de Apple: con dos toques seguidos
 * la pedía dos veces, y ahora el segundo espera al primero.
 */
export function restaurar(): Promise<ResultadoDeRestaurar> {
  restaurando ??= restaurarAhora().finally(() => {
    restaurando = null;
  });
  return restaurando;
}

async function restaurarAhora(): Promise<ResultadoDeRestaurar> {
  if (!tienda) return 'nada';
  try {
    const s = await tienda.restaurar();
    // Lo que Apple dice después de sincronizar es lo más nuevo: lo que se le preguntó antes ya no lo pisa.
    guardadaLaDe = ++paso;
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

/**
 * Canjear un código de oferta. Con la build que la trae, la hoja de Apple: el código se escribe ahí, y `codigo`
 * no se usa. Sin ella, la página de canje de la App Store, que pide el código ella (Apple no quiere una pantalla
 * propia para escribirlo); con `codigo`, ya puesto. Lo canjeado no vuelve por acá: lo avisa Apple («alCambiar») y
 * se vuelve a leer al volver a Moss (arrancar).
 */
export async function canjearCodigo(codigo?: string): Promise<ResultadoDeCanje> {
  if (!tienda) return 'error';
  try {
    if (tienda.canjearCodigo) {
      const abierta = await tienda.canjearCodigo();
      await leerSuscripcion();
      return abierta ? 'abierto' : 'error';
    }
    const valido = codigo === undefined ? '' : codigoDeOferta(codigo);
    if (valido === null) return 'sinCodigo';
    await Linking.openURL(valido ? `${CANJEAR}&code=${valido}` : CANJEAR);
    return 'abierto';
  } catch {
    return 'error';
  }
}
