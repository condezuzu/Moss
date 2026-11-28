// La suscripción en el teléfono (spec/suscripcion.md), con Apple de mentira: sin conexión nadie queda afuera,
// tampoco al volver a Moss después de que renovó; los precios que no llegaron se vuelven a pedir solos; el acceso
// no depende del orden en que terminan los pedidos de precios; comprar; y el código de oferta.

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { Suscripcion } from '@/dominio/premium';
import type { EstadoDePremium, Producto } from './premium';

const HORA = 3_600_000;
const MENSUAL = 'uy.moss.suscripcion.mensual';
const ANUAL = 'uy.moss.suscripcion.anual';
const PRODUCTOS: Producto[] = [
  { id: MENSUAL, precio: 'USD 9,99', porMes: 'USD 9,99', valor: 9.99, prueba: 0 },
  { id: ANUAL, precio: 'USD 39,99', porMes: 'USD 3,33', valor: 39.99, prueba: 0 },
];
const mockTienda = {
  productos: jest.fn<(ids: string[]) => Promise<Producto[]>>(),
  estado: jest.fn<() => Promise<Suscripcion | null>>(),
  ultima: jest.fn<(ids: string[]) => Promise<Suscripcion | null>>(),
  comprar: jest.fn<(id: string) => Promise<string>>(),
  restaurar: jest.fn<() => Promise<Suscripcion | null>>(),
  // La hoja de canje de Apple: solo en las pruebas de la build que la trae.
  canjearCodigo: undefined as (() => Promise<boolean>) | undefined,
  // Lo que Apple avisa por su cuenta (una renovación, lo canjeado).
  addListener: jest.fn((_evento: string, oyente: () => void) => {
    mockAlCambiar = oyente;
    return { remove() {} };
  }),
};
let mockAlVolver: ((a: string) => void) | undefined;
let mockAlCambiar: (() => void) | undefined;
const mockAbrir = jest.fn(async (_url: string) => {});

jest.mock('expo', () => ({ requireOptionalNativeModule: () => mockTienda }));
jest.mock('react-native', () => ({
  AppState: {
    addEventListener: (_: string, oyente: (a: string) => void) => {
      mockAlVolver = oyente;
      return { remove() {} };
    },
  },
  Linking: { openURL: (url: string) => mockAbrir(url) },
  Platform: { OS: 'ios' },
}));
jest.mock('@/lib/banderas', () => ({ CON_PREMIUM: true, PREMIUM_SALE: '2026-11-14' }));
jest.mock('@/textos', () => ({ idioma: () => 'es' }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const MANANA = new Date(2026, 11, 10, 9).getTime();
const mensualHasta = (vence: number, renueva = true): Suscripcion => ({ producto: MENSUAL, vence, prueba: false, renueva });
const nunca = () => new Promise<never>(() => {});
/** Contesta `valor` a los `ms`, o falla a los `ms`. */
const tarda = <T>(ms: number, valor: T) => () => new Promise<T>((listo) => { setTimeout(() => listo(valor), ms); });
const fallaA = (ms: number) => () => new Promise<never>((_, falla) => { setTimeout(() => falla(new Error('sin red')), ms); });

/** A la mañana, con conexión: la mensual vence a las 14 y los precios llegan. */
async function abrirALaManana() {
  jest.setSystemTime(MANANA);
  const s = mensualHasta(MANANA + 5 * HORA);
  mockTienda.estado.mockResolvedValue(s);
  mockTienda.ultima.mockResolvedValue(s);
  mockTienda.productos.mockResolvedValue(PRODUCTOS);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const premium = require('./premium') as typeof import('./premium');
  await premium.arrancarPremium(async () => null);
  expect(premium.accesoActual()).toBe('activa');
  return { premium, vencio: s };
}

describe('al volver a Moss', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    mockAlVolver = undefined;
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sin conexión, quien renovó con Moss cerrada sigue adentro, y no ve la pantalla de pago ni un instante', async () => {
    const { premium, vencio } = await abrirALaManana();
    // A las 15, sin conexión: Apple no sabe que renovó y los precios no llegan.
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('activa');
    await jest.advanceTimersByTimeAsync(5000);
    expect(premium.accesoActual()).toBe('activa');
    expect(premium.suscripcionActual()).toBeNull();
  });

  it('con conexión, la que venció sin renovar queda vencida', async () => {
    const { premium, vencio } = await abrirALaManana();
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('vencida');
  });

  it('con una vigente no espera a los precios', async () => {
    const { premium } = await abrirALaManana();
    const renovada = mensualHasta(MANANA + 30 * 24 * HORA);
    mockTienda.estado.mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValue(renovada);
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.suscripcionActual()).toEqual(renovada);
  });
});

/** Se abre Moss con lo que Apple da por vigente y la última que conoce; `productos` contesta lo que se le haya dicho antes. */
async function abrirCon(vigente: Suscripcion | null, ultima: Suscripcion | null) {
  mockTienda.estado.mockResolvedValue(vigente);
  mockTienda.ultima.mockResolvedValue(ultima);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const premium = require('./premium') as typeof import('./premium');
  await premium.arrancarPremium(async () => null);
  await jest.advanceTimersByTimeAsync(0);
  const precio = (plan: 'anual' | 'mensual') => premium.precioDelPlan(premium.estadoDePremium(), plan);
  /** Cada acceso por el que pasa desde ahora: para ver que no queda «vencida» ni un instante. */
  const accesos: string[] = [];
  premium.alCambiarPremium(() => accesos.push(premium.accesoActual()));
  return { premium, precio, accesos };
}

/** Alguien que nunca se suscribió abre Moss. */
const abrirSinSuscripcion = () => abrirCon(null, null);

describe('los precios de la pantalla de pago', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    mockAlVolver = undefined;
    mockTienda.productos.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  /** Con la pantalla de pago a la vista: lo que falte se pide solo. */
  async function conLaPantallaAbierta() {
    const moss = await abrirSinSuscripcion();
    const cerrar = moss.premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(0);
    return { ...moss, cerrar };
  }

  it('la App Store contesta sin precios: se dice eso y no «sin conexión», y llegan solos cuando los da', async () => {
    mockTienda.productos.mockResolvedValue([]);
    const { premium, precio } = await conLaPantallaAbierta();
    expect(precio('anual')).toBe('faltaEnLaTienda');
    expect(precio('mensual')).toBe('faltaEnLaTienda');
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await jest.advanceTimersByTimeAsync(2000);
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('listo');
    expect(premium.estadoDePremium().productos.anual?.precio).toBe('USD 39,99');
  });

  it('la App Store no contesta: no se dice que falten en la tienda, y al volver la conexión llegan solos', async () => {
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    const { precio } = await conLaPantallaAbierta();
    expect(precio('anual')).toBe('sinRespuesta');
    // Sigue sin red: se vuelve a pedir a los 2 segundos y, si falla, a los 4.
    await jest.advanceTimersByTimeAsync(2000);
    expect(precio('anual')).toBe('sinRespuesta');
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await jest.advanceTimersByTimeAsync(4000);
    expect(precio('anual')).toBe('listo');
  });

  it('StoreKit no contesta nunca: se espera hasta el tope, y el pedido colgado no frena al siguiente', async () => {
    mockTienda.productos.mockImplementation(nunca);
    const { precio } = await conLaPantallaAbierta();
    expect(precio('anual')).toBe('esperando');
    await jest.advanceTimersByTimeAsync(10_000);
    expect(precio('anual')).toBe('sinRespuesta');
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await jest.advanceTimersByTimeAsync(2000);
    expect(precio('anual')).toBe('listo');
  });

  it('un pedido viejo que contesta tarde y vacío no borra los precios que ya llegaron, ni hace creer que no hay conexión', async () => {
    let contestarElViejo: (lista: Producto[]) => void = () => {};
    mockTienda.productos.mockImplementationOnce(() => new Promise((listo) => { contestarElViejo = listo; }));
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium, precio } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(12_000);
    expect(precio('anual')).toBe('listo');
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    contestarElViejo([]);
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
  });

  it('ni uno viejo que falla tarde hace creer que no hay conexión', async () => {
    let fallarElViejo: (error: Error) => void = () => {};
    mockTienda.productos.mockImplementationOnce(() => new Promise((_, falla) => { fallarElViejo = falla; }));
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(12_000);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    fallarElViejo(new Error('sin red'));
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
  });

  it('los dos precios valen aunque lleguen después del tope, con otro pedido en camino', async () => {
    let contestarElViejo: (lista: Producto[]) => void = () => {};
    mockTienda.productos.mockImplementationOnce(() => new Promise((listo) => { contestarElViejo = listo; }));
    mockTienda.productos.mockImplementation(nunca);
    const { precio } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(12_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(2);
    expect(precio('anual')).toBe('sinRespuesta');
    contestarElViejo(PRODUCTOS);
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
  });

  it('llega un solo plan: ese ya se puede comprar, y el que falta se sigue pidiendo', async () => {
    mockTienda.productos.mockResolvedValue([PRODUCTOS[1]]);
    const { precio } = await conLaPantallaAbierta();
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('faltaEnLaTienda');
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await jest.advanceTimersByTimeAsync(2000);
    expect(precio('mensual')).toBe('listo');
    // Con los dos, no queda nada agendado.
    expect(jest.getTimerCount()).toBe(0);
  });

  it('con los dos precios no se pide nada más, y al cerrar la pantalla se deja de pedir', async () => {
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const conPrecios = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(1);
    conPrecios.cerrar();

    jest.resetModules();
    mockTienda.productos.mockReset();
    mockTienda.productos.mockResolvedValue([]);
    const sinPrecios = await conLaPantallaAbierta();
    sinPrecios.cerrar();
    // El pedido que estaba agendado se borra.
    expect(jest.getTimerCount()).toBe(0);
    const pedidos = mockTienda.productos.mock.calls.length;
    await jest.advanceTimersByTimeAsync(60_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(pedidos);
  });

  it('al volver a Moss se piden los que falten, aunque no conste que el pedido falló', async () => {
    mockTienda.productos.mockResolvedValueOnce([PRODUCTOS[1]]);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { precio } = await abrirSinSuscripcion();
    expect(precio('mensual')).toBe('faltaEnLaTienda');
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('mensual')).toBe('listo');
  });

  it('una respuesta buena no pasa a «sin conexión» cuando se cumple el tope del pedido', async () => {
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium, precio } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(15_000);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    expect(precio('anual')).toBe('listo');
  });

  it('cuando el pedido contesta, el reloj de su tope se borra', async () => {
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await abrirSinSuscripcion();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('un pedido que falla no borra los precios que ya estaban, y para el acceso cuenta como sin conexión', async () => {
    // Canceló y venció: al volver a Moss se piden los precios aunque ya estén, para saber si hay conexión.
    jest.setSystemTime(MANANA);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium, precio } = await abrirCon(null, mensualHasta(MANANA - HORA, false));
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('listo');
    expect(premium.estadoDePremium().sinPrecios).toBe(true);
  });

  it('una lista más corta o vacía no borra un precio que ya llegó', async () => {
    jest.setSystemTime(MANANA);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium, precio } = await abrirCon(null, mensualHasta(MANANA - HORA, false));
    mockTienda.productos.mockResolvedValue([]);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('listo');
    // Vacía cuenta como sin conexión para el acceso, pero no falta ningún precio.
    expect(premium.estadoDePremium()).toMatchObject({ sinPrecios: true, faltanEnLaTienda: false });
    mockTienda.productos.mockResolvedValue([{ ...PRODUCTOS[0], precio: 'USD 10,99' }]);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    // Lo que trae se suma: el mensual con su precio nuevo, y el anual sigue.
    expect(premium.estadoDePremium().productos.mensual?.precio).toBe('USD 10,99');
    expect(precio('anual')).toBe('listo');
    expect(premium.estadoDePremium()).toMatchObject({ sinPrecios: false, faltanEnLaTienda: false });
  });

  it('si antes faltaba en la tienda y esta vez no contesta, se dice que no contesta', async () => {
    mockTienda.productos.mockResolvedValueOnce([PRODUCTOS[1]]);
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    const { precio } = await conLaPantallaAbierta();
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('sinRespuesta');
  });

  it('al volver, si a los cinco segundos no contestó, tampoco se sigue diciendo que falta en la tienda', async () => {
    // Venció hace diez días: ve la pantalla de pago, y de antes quedó que la tienda no dio el mensual.
    jest.setSystemTime(MANANA);
    mockTienda.productos.mockResolvedValue([PRODUCTOS[1]]);
    const { precio } = await abrirCon(null, mensualHasta(MANANA - 10 * 24 * HORA));
    expect(precio('mensual')).toBe('faltaEnLaTienda');
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(5000);
    expect(precio('mensual')).toBe('sinRespuesta');
  });

  it('cerrar la pantalla con un pedido en camino: cuando termina, no se agenda otro', async () => {
    mockTienda.productos.mockImplementation(nunca);
    const { cerrar } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(5000);
    cerrar();
    const pedidos = mockTienda.productos.mock.calls.length;
    await jest.advanceTimersByTimeAsync(5 * 60_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(pedidos);
  });

  it('las esperas entre un pedido y el siguiente crecen hasta cinco minutos: en una hora no llegan a veinte', async () => {
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    const { premium, cerrar } = await conLaPantallaAbierta();
    const pedidos = () => mockTienda.productos.mock.calls.length;
    // Al abrir Moss y al abrir la pantalla; después, a los 2, 4, 8, 15, 30 y 60 segundos del anterior.
    expect(pedidos()).toBe(2);
    let van = 2;
    for (const espera of [2000, 4000, 8000, 15_000, 30_000, 60_000, 300_000, 300_000]) {
      await jest.advanceTimersByTimeAsync(espera - 1);
      expect(pedidos()).toBe(van);
      await jest.advanceTimersByTimeAsync(1);
      expect(pedidos()).toBe(++van);
    }
    await jest.advanceTimersByTimeAsync(3_600_000 - 719_000);
    expect(pedidos()).toBe(19);
    // Un pedido a mano vuelve a empezar por las esperas cortas.
    await premium.leerPrecios(true);
    expect(pedidos()).toBe(20);
    await jest.advanceTimersByTimeAsync(2000);
    expect(pedidos()).toBe(21);
    // Otra pantalla que se abre, también: pide ya, y el siguiente a los 2 segundos.
    cerrar();
    const otra = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(0);
    expect(pedidos()).toBe(22);
    await jest.advanceTimersByTimeAsync(2000);
    expect(pedidos()).toBe(23);
    otra();
  });

  it('con StoreKit colgado no se juntan pedidos sin contestar: solos, tres; con los pedidos a mano, seis', async () => {
    const colgados: ((lista: Producto[]) => void)[] = [];
    mockTienda.productos.mockImplementation(() => new Promise((listo) => { colgados.push(listo); }));
    const { premium, precio } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(3_600_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(3);
    // «Reintentar», muchas veces.
    for (let toque = 0; toque < 8; toque++) {
      premium.leerPrecios(true).catch(() => {});
      await jest.advanceTimersByTimeAsync(3000);
    }
    expect(mockTienda.productos).toHaveBeenCalledTimes(6);
    expect(precio('anual')).toBe('sinRespuesta');
    // Cuando alguno contesta por fin, sus precios valen, aunque sea de un pedido viejo.
    colgados[0](PRODUCTOS);
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
    expect(precio('mensual')).toBe('listo');
  });

  it('«Reintentar» y volver a Moss no se cuelgan de un pedido viejo: si lleva más de dos segundos, sale uno nuevo', async () => {
    mockTienda.productos.mockRejectedValueOnce(new Error('sin red'));
    mockTienda.productos.mockImplementation(nunca);
    const { premium, precio } = await conLaPantallaAbierta();
    // El pedido de la pantalla quedó colgado. Un toque enseguida espera a ese; no salen dos juntos.
    expect(mockTienda.productos).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1000);
    premium.leerPrecios(true).catch(() => {});
    expect(mockTienda.productos).toHaveBeenCalledTimes(2);
    // A los tres segundos volvió la red: el toque saca un pedido nuevo y los precios llegan ya.
    await jest.advanceTimersByTimeAsync(2000);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    await premium.leerPrecios(true);
    expect(mockTienda.productos).toHaveBeenCalledTimes(3);
    expect(precio('anual')).toBe('listo');
  });

  it('al volver a Moss con un pedido colgado en camino también sale uno nuevo', async () => {
    mockTienda.productos.mockRejectedValueOnce(new Error('sin red'));
    mockTienda.productos.mockImplementation(nunca);
    const { precio } = await conLaPantallaAbierta();
    await jest.advanceTimersByTimeAsync(9900);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
  });
});

describe('quien renovó sin conexión, cuando vuelve la conexión', () => {
  const vencio = mensualHasta(MANANA + 5 * HORA);
  const renovada = mensualHasta(MANANA + 30 * 24 * HORA);

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    // Las 15: la mensual vencía a las 14 y renovaba.
    jest.setSystemTime(MANANA + 6 * HORA);
    mockAlVolver = undefined;
    mockTienda.productos.mockReset();
    mockTienda.estado.mockReset();
    mockTienda.ultima.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  /** Abre Moss sin conexión: Apple no da nada por vigente y los precios no llegan. Sigue adentro. */
  async function abrirSinConexion() {
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    const moss = await abrirCon(null, vencio);
    expect(moss.premium.accesoActual()).toBe('activa');
    expect(moss.premium.estadoDePremium().sinPrecios).toBe(true);
    return moss;
  }

  it('abre Tu suscripción con Moss abierta: llegan los precios, se le vuelve a preguntar a Apple y no queda «vencida» ni un instante', async () => {
    const { premium, precio, accesos } = await abrirSinConexion();
    // Vuelve la conexión sin salir de Moss, y Apple ya sabe que renovó.
    mockTienda.estado.mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValue(renovada);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const preguntas = mockTienda.estado.mock.calls.length;
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('mensual')).toBe('listo');
    expect(mockTienda.estado).toHaveBeenCalledTimes(preguntas + 1);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    expect(premium.hayPremium()).toBe(true);
    expect(accesos.length).toBeGreaterThan(0);
    expect(accesos).not.toContain('vencida');
    cerrar();
  });

  it('si Apple no contesta cuando llegan los precios, los precios se ven igual y sigue adentro', async () => {
    const { premium, precio, accesos } = await abrirSinConexion();
    // Apple colgado: los precios no lo esperan.
    mockTienda.estado.mockImplementation(nunca);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(0);
    expect(precio('anual')).toBe('listo');
    expect(premium.estadoDePremium().sinPrecios).toBe(true);
    expect(premium.accesoActual()).toBe('activa');
    cerrar();
    // Más tarde vuelve a Moss, y Apple contesta con un error: tampoco se da por vencida.
    await jest.advanceTimersByTimeAsync(60_000);
    mockTienda.estado.mockRejectedValue(new Error('StoreKit'));
    const pedidos = mockTienda.productos.mock.calls.length;
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(mockTienda.productos.mock.calls.length).toBe(pedidos + 1);
    expect(premium.estadoDePremium().sinPrecios).toBe(true);
    expect(premium.accesoActual()).toBe('activa');
    expect(accesos).not.toContain('vencida');
  });

  it('si con conexión Apple sigue sin darla por vigente, no renovó: queda vencida', async () => {
    const { premium } = await abrirSinConexion();
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('vencida');
    cerrar();
  });

  it('al volver a Moss, aunque los precios lleguen antes que la respuesta de Apple, no queda «vencida» ni un momento', async () => {
    const { premium, accesos } = await abrirSinConexion();
    // Apple tarda en decir que renovó; los precios llegan enseguida.
    mockTienda.estado.mockImplementation(() => new Promise((listo) => { setTimeout(() => listo(renovada), 300); }));
    mockTienda.ultima.mockResolvedValue(renovada);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(300);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    expect(accesos).not.toContain('vencida');
  });

  it('al volver a Moss, si Apple contesta primero lo de sin conexión y al llegar los precios que renovó, vale lo último', async () => {
    const { premium, accesos } = await abrirSinConexion();
    // Al volver, Apple todavía no sabe que renovó; cuando llegan los precios, ya sí.
    mockTienda.estado.mockResolvedValueOnce(null).mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValueOnce(vencio).mockResolvedValue(renovada);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(accesos).not.toContain('vencida');
  });

  it('lo que se restaura mientras se esperan los precios al volver a Moss no lo pisa lo que Apple había dicho antes', async () => {
    const { premium } = await abrirSinConexion();
    mockTienda.productos.mockImplementation(nunca);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    mockTienda.restaurar.mockResolvedValue(renovada);
    expect(await premium.restaurar()).toBe('restaurada');
    // A los cinco segundos sin precios termina la vuelta a Moss, con lo que Apple le había dicho antes.
    await jest.advanceTimersByTimeAsync(5000);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(premium.accesoActual()).toBe('activa');
  });

  it('si la App Store contesta vacío, para el acceso sigue siendo estar sin conexión', async () => {
    mockTienda.productos.mockResolvedValue([]);
    const { premium, precio } = await abrirCon(null, vencio);
    expect(precio('anual')).toBe('faltaEnLaTienda');
    expect(premium.accesoActual()).toBe('activa');
  });
});

/** Cada acceso por el que pasa desde ahora; «?» mientras no se sabe (entonces no hay pantalla de pago ni se tocan los avisos). */
function accesosDe(premium: typeof import('./premium')) {
  const accesos: string[] = [];
  premium.alCambiarPremium(() => accesos.push(premium.seSabeElAcceso() ? premium.accesoActual() : '?'));
  return accesos;
}

/** Cuántas veces hayPremium pasa de true a false desde ahora: cada una borra todos los avisos. */
function caidasDeHayPremium(premium: typeof import('./premium')) {
  let antes = premium.hayPremium();
  const caidas = { n: 0 };
  premium.alCambiarPremium(() => {
    const ahora = premium.hayPremium();
    if (antes && !ahora) caidas.n++;
    antes = ahora;
  });
  return caidas;
}

describe('el acceso no depende del orden en que terminan los pedidos de precios', () => {
  const vencio = mensualHasta(MANANA + 5 * HORA);
  const renovada = mensualHasta(MANANA + 30 * 24 * HORA);
  // Venció hace una hora y renovaba: un cobro que falló, que Apple sigue reintentando.
  const reintentando = mensualHasta(MANANA - HORA);

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    mockAlVolver = undefined;
    mockAlCambiar = undefined;
    mockTienda.productos.mockReset();
    mockTienda.estado.mockReset();
    mockTienda.ultima.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * A la mañana, con red, la mensual vence a las 14 (y los precios llegan o, `sinPreciosALaManana`, no). Renueva con
   * Moss cerrada y a las 15 vuelve sin red: Apple todavía no sabe que renovó. La red vuelve a los `ms`: desde ahí los
   * precios llegan y Apple ya lo sabe.
   */
  async function renovoConMossCerrada(ms: number, sinPreciosALaManana = false) {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockResolvedValue(vencio);
    mockTienda.ultima.mockResolvedValue(vencio);
    if (sinPreciosALaManana) mockTienda.productos.mockRejectedValue(new Error('sin red'));
    else mockTienda.productos.mockResolvedValue(PRODUCTOS);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    await premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.estadoDePremium().sinPrecios).toBe(sinPreciosALaManana);
    const accesos = accesosDe(premium);
    jest.setSystemTime(MANANA + 6 * HORA);
    const antes = mockTienda.estado.mock.calls.length;
    mockTienda.estado.mockResolvedValueOnce(null).mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValueOnce(vencio).mockResolvedValue(renovada);
    mockTienda.productos.mockImplementation(tarda(ms, PRODUCTOS));
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(ms);
    return { premium, accesos, preguntas: mockTienda.estado.mock.calls.length - antes };
  }

  it('A: renovó con Moss cerrada y vuelve sin red; la red vuelve a los 2 s: se le vuelve a preguntar a Apple y no queda «vencida» ni un instante', async () => {
    const { premium, accesos, preguntas } = await renovoConMossCerrada(2000);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(preguntas).toBe(2);
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(premium.hayPremium()).toBe(true);
    expect(accesos).not.toContain('vencida');
  });

  it('A2: lo mismo si a la mañana los precios no habían llegado', async () => {
    const { premium, accesos, preguntas } = await renovoConMossCerrada(2000, true);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    expect(preguntas).toBe(2);
    expect(accesos).not.toContain('vencida');
  });

  it('B: lo mismo al abrir Moss en frío', async () => {
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValueOnce(null).mockResolvedValue(renovada);
    mockTienda.ultima.mockResolvedValueOnce(vencio).mockResolvedValue(renovada);
    mockTienda.productos.mockImplementation(tarda(2000, PRODUCTOS));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const accesos = accesosDe(premium);
    const arranque = premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(2000);
    await arranque;
    expect(premium.seSabeElAcceso()).toBe(true);
    expect(premium.suscripcionActual()).toEqual(renovada);
    expect(accesos).not.toContain('vencida');
  });

  it('C: da lo mismo que la red vuelva un poco antes o un poco después de los 5 s que se esperan los precios', async () => {
    const resultados = [];
    for (const ms of [4900, 5100]) {
      jest.resetModules();
      mockTienda.estado.mockReset();
      mockTienda.ultima.mockReset();
      mockTienda.productos.mockReset();
      const { premium, accesos } = await renovoConMossCerrada(ms);
      resultados.push({ ms, suscripcion: premium.suscripcionActual(), vencida: accesos.includes('vencida') });
    }
    expect(resultados).toEqual([{ ms: 4900, suscripcion: renovada, vencida: false }, { ms: 5100, suscripcion: renovada, vencida: false }]);
  });

  /**
   * Al abrir Moss la App Store da solo el anual: vencida, con la pantalla de pago, que pide el mensual. StoreKit tarda
   * 6 s en ese pedido, pero contesta con los dos. A los 3 s sale otro (`aLos3`: vuelve a Moss o toca «Reintentar»),
   * que contesta `otro`.
   */
  async function enLaPantallaDePago(otro: () => Promise<Producto[]>, aLos3: (premium: typeof import('./premium')) => void) {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(reintentando);
    mockTienda.productos.mockResolvedValueOnce([PRODUCTOS[1]]);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    await premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('vencida');
    const accesos = accesosDe(premium);
    mockTienda.productos.mockImplementationOnce(tarda(6000, PRODUCTOS)).mockImplementation(otro);
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(3000);
    aLos3(premium);
    await jest.advanceTimersByTimeAsync(3000);
    // A los 6 s llegaron los dos precios: hay conexión, y sigue vencida.
    expect(mockTienda.productos).toHaveBeenCalledTimes(3);
    expect(premium.precioDelPlan(premium.estadoDePremium(), 'mensual')).toBe('listo');
    return { premium, accesos, cerrar };
  }
  const volver = () => mockAlVolver!('active');

  it('D: quien venció y renovaba no entra sin pagar porque el pedido nuevo tarde más que el que ya trajo los precios', async () => {
    const { premium, accesos, cerrar } = await enLaPantallaDePago(tarda(6000, PRODUCTOS), volver);
    // A los 8 s vence la espera del pedido nuevo, y a los 9 contesta.
    await jest.advanceTimersByTimeAsync(2000);
    expect(premium.accesoActual()).toBe('vencida');
    await jest.advanceTimersByTimeAsync(2000);
    expect(premium.hayPremium()).toBe(false);
    expect(accesos).not.toContain('activa');
    cerrar();
  });

  it('E: ni si el pedido nuevo no contesta nunca', async () => {
    const { premium, accesos, cerrar } = await enLaPantallaDePago(nunca, volver);
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(premium.hayPremium()).toBe(false);
    expect(accesos).not.toContain('activa');
    cerrar();
  });

  it('F: ni si el pedido nuevo es el de «Reintentar»', async () => {
    const { premium, accesos, cerrar } = await enLaPantallaDePago(nunca, (p) => { p.leerPrecios(true).catch(() => {}); });
    await jest.advanceTimersByTimeAsync(30 * 60_000);
    expect(premium.hayPremium()).toBe(false);
    expect(accesos).not.toContain('activa');
    cerrar();
  });

  it('G: abre Moss con StoreKit lento y vuelve al frente a los 3 s: desde que llegan los precios, vencida, sin ir y volver', async () => {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(reintentando);
    mockTienda.productos.mockImplementation(tarda(6000, PRODUCTOS));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const accesos = accesosDe(premium);
    const arranque = premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(3000);
    // Baja el Centro de control y vuelve: el primer pedido lleva 3 s, y sale otro.
    volver();
    await jest.advanceTimersByTimeAsync(3000);
    await arranque;
    await jest.advanceTimersByTimeAsync(10_000);
    // A los 5 s sin precios no hay conexión y sigue adentro (como siempre); a los 6 llegan, y Apple, con conexión, no
    // la da por vigente: vencida, y ahí queda cuando vence la espera del otro pedido y cuando contesta.
    expect(accesos.filter((a, i) => a !== '?' && a !== accesos[i - 1])).toEqual(['activa', 'vencida']);
  });

  it('al volver a Moss se piden precios aunque no falte ninguno: uno colgado de la vuelta anterior no dice si ahora hay conexión', async () => {
    const { premium } = await abrirALaManana();
    // A las 15 vuelve sin red: Apple no la da por vigente, y el pedido queda colgado.
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.productos.mockImplementation(nunca);
    volver();
    await jest.advanceTimersByTimeAsync(3000);
    // Sale y vuelve a los 3 s, ya con red: no había renovado.
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    volver();
    await jest.advanceTimersByTimeAsync(10_000);
    expect(mockTienda.productos).toHaveBeenCalledTimes(3);
    expect(premium.accesoActual()).toBe('vencida');
  });

  it.each([
    ['falla', fallaA(4000)],
    ['contesta vacío', tarda<Producto[]>(4000, [])],
  ])('un pedido que %s dice «sin conexión» aunque haya otro más nuevo en camino, si después de que salió no llegaron precios', async (_, viejo) => {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(reintentando);
    mockTienda.productos.mockResolvedValueOnce([PRODUCTOS[1]]);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    await premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(0);
    // El pedido de la pantalla de pago termina mal a los 4 s; el de «Reintentar», que salió a los 3, trae los dos a los 5.
    mockTienda.productos.mockImplementationOnce(viejo).mockImplementation(tarda(2000, PRODUCTOS));
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(3000);
    premium.leerPrecios(true).catch(() => {});
    await jest.advanceTimersByTimeAsync(1000);
    expect(premium.estadoDePremium().sinPrecios).toBe(true);
    // Cuando llegan, con conexión Apple no la da por vigente: vencida.
    await jest.advanceTimersByTimeAsync(2000);
    expect(premium.precioDelPlan(premium.estadoDePremium(), 'mensual')).toBe('listo');
    expect(premium.estadoDePremium().sinPrecios).toBe(false);
    expect(premium.accesoActual()).toBe('vencida');
    cerrar();
  });

  // Quien renovó con Moss cerrada vuelve sin red: Apple no da nada vigente y se esperan los precios. Ese pedido
  // termina sin precios a los 2,5 s, pero antes, a los 2,1, salió otro (el primero ya llevaba más de 2 s), que se
  // cuelga. Terminar no es contestar: la espera sigue con el otro, y a los 5 s sin precios no hay conexión.
  it.each([
    ['V1: el primero falla', fallaA(2500), volver],
    ['V4: el primero contesta vacío', tarda<Producto[]>(2500, []), volver],
    ['V5: el primero falla, y el otro lo saca el aviso de Apple', fallaA(2500), () => mockAlCambiar!()],
  ])('al abrir Moss sin red, quien renovó no ve «vencida» si otro pedido sale mientras se esperan los precios (%s)', async (_, primero, aLos2) => {
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockImplementationOnce(primero).mockImplementation(nunca);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const accesos = accesosDe(premium);
    premium.arrancarPremium(async () => null).catch(() => {});
    await jest.advanceTimersByTimeAsync(2100);
    aLos2();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(accesos).not.toContain('vencida');
    expect(premium.accesoActual()).toBe('activa');
  });

  it('al abrir Moss, quien venció no entra ni un instante si el pedido que se esperaba falla y el más nuevo trae los precios dentro de los 5 s', async () => {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(reintentando);
    // El primero falla a los 2,5 s; el que sale al volver a los 2,1 s trae los dos a los 3.
    mockTienda.productos.mockImplementationOnce(fallaA(2500)).mockImplementation(tarda(900, PRODUCTOS));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const accesos = accesosDe(premium);
    premium.arrancarPremium(async () => null).catch(() => {});
    await jest.advanceTimersByTimeAsync(2100);
    volver();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(accesos).not.toContain('activa');
    expect(premium.accesoActual()).toBe('vencida');
  });

  it('V2: con Moss abierta desde la mañana, lo mismo al volver a ella: nunca «vencida», y los avisos quedan', async () => {
    const { premium } = await abrirALaManana();
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.productos.mockImplementationOnce(fallaA(2500)).mockImplementation(nunca);
    const accesos = accesosDe(premium);
    const caidas = caidasDeHayPremium(premium);
    volver();
    await jest.advanceTimersByTimeAsync(2100);
    volver();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(accesos).not.toContain('vencida');
    expect(caidas.n).toBe(0);
  });

  it('V9: vuelve sin red y otra vez a los 0,5 s, con Apple lento (1 s y 3,2 s) y cada pedido fallando a los 3 s: nunca «vencida»', async () => {
    const { premium } = await abrirALaManana();
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockImplementationOnce(tarda(1000, null)).mockImplementationOnce(tarda(3200, null)).mockResolvedValue(null);
    mockTienda.productos.mockImplementation(fallaA(3000));
    const accesos = accesosDe(premium);
    const caidas = caidasDeHayPremium(premium);
    volver();
    await jest.advanceTimersByTimeAsync(500);
    volver();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(accesos).not.toContain('vencida');
    expect(caidas.n).toBe(0);
  });

  it('si al volver a preguntarle a Apple no contesta, queda lo de antes: no «vencida» con lo que dijo sin red', async () => {
    const { premium } = await abrirALaManana();
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValueOnce(null).mockRejectedValue(new Error('StoreKit'));
    mockTienda.productos.mockImplementation(tarda(2000, PRODUCTOS));
    const accesos = accesosDe(premium);
    volver();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(accesos).not.toContain('vencida');
    expect(premium.accesoActual()).toBe('activa');
  });

  it('si Apple no contestó al abrir Moss, lo que contesta al volver deja saber el acceso', async () => {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockRejectedValueOnce(new Error('StoreKit')).mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(null);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    await premium.arrancarPremium(async () => null);
    expect(premium.seSabeElAcceso()).toBe(false);
    volver();
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.seSabeElAcceso()).toBe(true);
    expect(premium.accesoActual()).toBe('nueva');
  });

  it.each([
    ['al volver a Moss', volver],
    ['con el aviso de Apple', () => mockAlCambiar!()],
  ])('si la primera pregunta a Apple al abrir Moss no contesta nunca, lo que contesta después deja saber el acceso (%s)', async (_, despues) => {
    jest.setSystemTime(MANANA);
    mockTienda.estado.mockImplementationOnce(nunca).mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(null);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    premium.arrancarPremium(async () => null).catch(() => {});
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.seSabeElAcceso()).toBe(false);
    despues();
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.seSabeElAcceso()).toBe(true);
    expect(premium.accesoActual()).toBe('nueva');
  });

  it('si mientras se le vuelve a preguntar a Apple un pedido más nuevo constata que no hay conexión, sigue sin conexión', async () => {
    // Abre Moss sin conexión: sigue adentro.
    jest.setSystemTime(MANANA + 6 * HORA);
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(vencio);
    mockTienda.productos.mockRejectedValue(new Error('sin red'));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    await premium.arrancarPremium(async () => null);
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('activa');
    // Vuelve la red y llegan los precios; Apple tarda 3 s en contestar, y a los 2,5 se vuelve a cortar.
    mockTienda.estado.mockImplementation(tarda(3000, null));
    mockTienda.productos.mockResolvedValueOnce(PRODUCTOS).mockRejectedValue(new Error('sin red'));
    const cerrar = premium.pedirLosPreciosQueFalten();
    await jest.advanceTimersByTimeAsync(2500);
    premium.leerPrecios(true).catch(() => {});
    await jest.advanceTimersByTimeAsync(500);
    expect(premium.estadoDePremium().sinPrecios).toBe(true);
    expect(premium.accesoActual()).toBe('activa');
    cerrar();
  });
});

describe('comprar', () => {
  const nueva: Suscripcion = { producto: ANUAL, vence: MANANA + 7 * 24 * HORA, prueba: true, renueva: true };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(MANANA);
    mockAlVolver = undefined;
    mockTienda.productos.mockReset();
    mockTienda.estado.mockReset();
    mockTienda.ultima.mockReset();
    mockTienda.comprar.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('lo que dice Apple ya está guardado cuando comprar() devuelve', async () => {
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium } = await abrirSinSuscripcion();
    expect(premium.accesoActual()).toBe('nueva');
    mockTienda.comprar.mockResolvedValue('comprado');
    mockTienda.estado.mockResolvedValue(nueva);
    mockTienda.ultima.mockResolvedValue(nueva);
    expect(await premium.comprar('anual')).toBe('comprado');
    expect(premium.accesoActual()).toBe('prueba');
  });

  it('si justo después Apple todavía no la da por vigente, se le vuelve a preguntar enseguida, sin esperar los precios', async () => {
    // Venció hace diez días y la había cancelado: ve la pantalla de pago.
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    const { premium } = await abrirCon(null, mensualHasta(MANANA - 10 * 24 * HORA, false));
    expect(premium.accesoActual()).toBe('vencida');
    // Apple confirma a los 500 ms, pero la primera vez que se le pregunta todavía no la da; StoreKit no da precios.
    mockTienda.comprar.mockImplementation(tarda(500, 'comprado'));
    mockTienda.estado.mockResolvedValueOnce(null).mockResolvedValue(nueva);
    mockTienda.ultima.mockResolvedValue(nueva);
    mockTienda.productos.mockImplementation(nunca);
    let devolvio = -1;
    premium.comprar('anual').then(() => { devolvio = Date.now() - MANANA; }).catch(() => {});
    await jest.advanceTimersByTimeAsync(1500);
    // Antes de un segundo después de que Apple confirmó, con la prueba: así la pantalla dice los 7 días gratis.
    expect(devolvio).toBeGreaterThanOrEqual(500);
    expect(devolvio).toBeLessThan(1500);
    expect(premium.estadoDePremium()).toMatchObject({ suscripcion: nueva, sinPrecios: false });
    expect(premium.accesoActual()).toBe('prueba');
  });
});

describe('lo que acompaña a cada precio', () => {
  // En pesos, para que no se confunda con el de respaldo.
  const MENSUAL_EN_PESOS: Producto = { id: MENSUAL, precio: '$U 390', porMes: '$U 390', valor: 390, prueba: 7 };
  const ANUAL_EN_PESOS: Producto = { id: ANUAL, precio: '$U 1.690', porMes: '$U 141', valor: 1690, prueba: 7 };
  let premium: typeof import('./premium');
  const con = (productos: EstadoDePremium['productos']) => ({ ...premium.estadoDePremium(), productos });

  beforeEach(() => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    premium = require('./premium') as typeof import('./premium');
  });

  it('el ahorro y «por mes» salen de la misma fuente que el precio, y con uno de cada una no hay ahorro', () => {
    const respaldo = premium.precioDeRespaldo;
    expect(premium.preciosDe(con({ mensual: MENSUAL_EN_PESOS, anual: ANUAL_EN_PESOS }))).toEqual({ anual: '$U 1.690', mensual: '$U 390', porMes: '$U 141', ahorro: 64 });
    expect(premium.preciosDe(con({}))).toEqual({ anual: respaldo(39.99), mensual: respaldo(9.99), porMes: respaldo(3.33), ahorro: 67 });
    expect(premium.preciosDe(con({ anual: ANUAL_EN_PESOS }))).toEqual({ anual: '$U 1.690', mensual: respaldo(9.99), porMes: '$U 141', ahorro: null });
    expect(premium.preciosDe(con({ mensual: MENSUAL_EN_PESOS }))).toEqual({ anual: respaldo(39.99), mensual: '$U 390', porMes: respaldo(3.33), ahorro: null });
  });

  it('llega solo el mensual: queda elegido ese, sin pisar lo que eligió la persona ni salir solo de uno con precio', () => {
    expect(premium.planQueSePuede('anual', false, { mensual: MENSUAL_EN_PESOS })).toBe('mensual');
    expect(premium.planQueSePuede('anual', true, { mensual: MENSUAL_EN_PESOS })).toBe('anual');
    expect(premium.planQueSePuede('mensual', false, { mensual: MENSUAL_EN_PESOS, anual: ANUAL_EN_PESOS })).toBe('mensual');
    expect(premium.planQueSePuede('anual', false, {})).toBe('anual');
  });
});

describe('canjear un código de oferta', () => {
  const canjeada: Suscripcion = { producto: ANUAL, vence: MANANA + 14 * 24 * HORA, prueba: false, renueva: true };

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(MANANA);
    mockAlVolver = undefined;
    mockAbrir.mockReset();
    mockAbrir.mockResolvedValue(undefined);
    mockTienda.canjearCodigo = undefined;
    mockTienda.productos.mockReset();
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
  });
  afterEach(() => {
    mockTienda.canjearCodigo = undefined;
    jest.useRealTimers();
  });

  it('en una build sin la hoja de Apple abre el enlace de la App Store con el código, y al volver a Moss ya entra', async () => {
    const { premium } = await abrirSinSuscripcion();
    expect(premium.accesoActual()).toBe('nueva');
    expect(await premium.canjearCodigo(' MOSS14 ')).toBe('abierto');
    expect(mockAbrir).toHaveBeenCalledTimes(1);
    expect(mockAbrir).toHaveBeenCalledWith('https://apps.apple.com/redeem?ctx=offercodes&id=6828034537&code=MOSS14');
    // Lo canjeó en la App Store y vuelve.
    mockTienda.estado.mockResolvedValue(canjeada);
    mockTienda.ultima.mockResolvedValue(canjeada);
    mockAlVolver!('active');
    await jest.advanceTimersByTimeAsync(0);
    expect(premium.accesoActual()).toBe('activa');
  });

  it('sin código abre la página de canje de la App Store, que lo pide ella', async () => {
    const { premium } = await abrirSinSuscripcion();
    expect(await premium.canjearCodigo()).toBe('abierto');
    expect(mockAbrir).toHaveBeenCalledWith('https://apps.apple.com/redeem?ctx=offercodes&id=6828034537');
  });

  it('con un código que no puede ser, no abre nada y lo dice', async () => {
    const { premium } = await abrirSinSuscripcion();
    expect(await premium.canjearCodigo('   ')).toBe('sinCodigo');
    expect(await premium.canjearCodigo('MOSS14&id=1')).toBe('sinCodigo');
    expect(mockAbrir).not.toHaveBeenCalled();
  });

  it('con la hoja de Apple en la build, la abre en lugar del enlace, y al cerrarla se vuelve a leer lo que dice Apple', async () => {
    const { premium } = await abrirSinSuscripcion();
    mockTienda.canjearCodigo = async () => {
      mockTienda.estado.mockResolvedValue(canjeada);
      mockTienda.ultima.mockResolvedValue(canjeada);
      return true;
    };
    expect(await premium.canjearCodigo()).toBe('abierto');
    expect(mockAbrir).not.toHaveBeenCalled();
    expect(premium.accesoActual()).toBe('activa');
  });

  it('si la hoja o el enlace no abren, lo dice', async () => {
    const { premium } = await abrirSinSuscripcion();
    mockAbrir.mockRejectedValue(new Error('no abre'));
    expect(await premium.canjearCodigo('MOSS14')).toBe('error');
    mockTienda.canjearCodigo = async () => false;
    expect(await premium.canjearCodigo()).toBe('error');
    mockTienda.canjearCodigo = async () => {
      throw new Error('StoreKit');
    };
    expect(await premium.canjearCodigo()).toBe('error');
  });
});

describe('la cuenta guardada', () => {
  beforeEach(() => {
    jest.resetModules();
    // Con la hora fija: con la del reloj, el regalo (hasta el 14/2/2027) vencería y estos tests fallarían.
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    jest.setSystemTime(MANANA);
    mockTienda.productos.mockReset();
    mockTienda.estado.mockReset();
    mockTienda.ultima.mockReset();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('dos sesiones vacías mientras se lee: al terminar la primera, el regalo ya está', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const almacenamiento = require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage').default;
    // Cada lectura termina cuando se la deja: en el teléfono, dos lecturas no terminan juntas.
    const lecturas: ((cuenta: string | null) => void)[] = [];
    jest.mocked(almacenamiento.getItem).mockImplementation(() => new Promise((listo) => { lecturas.push(listo); }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    // Sin conexión y con el token vencido: la sesión llega vacía, al arrancar y en el aviso del almacén.
    const primera = premium.cuentaDePremium(null);
    const segunda = premium.cuentaDePremium(null);
    lecturas[0]('2026-10-01T12:00:00Z');
    await primera;
    expect(premium.finDelRegaloActual()).toBe('2027-02-14');
    lecturas.slice(1).forEach((leer) => leer('2026-10-01T12:00:00Z'));
    await segunda;
    expect(premium.finDelRegaloActual()).toBe('2027-02-14');
  });

  it('al abrir Moss, si iOS o Apple avisan antes de leer la cuenta, quien tiene el regalo no ve la pantalla de pago ni un instante', async () => {
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(null);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const vistos: string[] = [];
    premium.alCambiarPremium(() => vistos.push(premium.seSabeElAcceso() ? premium.accesoActual() : '?'));
    let darLaCuenta!: (creada: string) => void;
    const arranque = premium.arrancarPremium(() => new Promise((listo) => { darLaCuenta = listo; }));
    // Al abrir, iOS avisa que Moss pasó al frente y Apple manda lo suyo, antes de que se lea la cuenta.
    mockAlVolver!('active');
    mockAlCambiar!();
    for (let i = 0; i < 5; i++) await new Promise((listo) => setImmediate(listo));
    darLaCuenta('2026-10-01T12:00:00Z');
    await arranque;
    expect(vistos.filter((a) => a !== '?' && a !== 'regalo')).toEqual([]);
    expect([premium.seSabeElAcceso(), premium.accesoActual()]).toEqual([true, 'regalo']);
  });

  it('si leer la sesión falla al abrir Moss, vale la cuenta guardada: quien tiene el regalo no ve la pantalla de pago', async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const almacenamiento = require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage').default;
    await almacenamiento.setItem('moss:cuentaDeMoss', '2026-10-01T12:00:00Z');
    mockTienda.estado.mockResolvedValue(null);
    mockTienda.ultima.mockResolvedValue(null);
    mockTienda.productos.mockResolvedValue(PRODUCTOS);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const premium = require('./premium') as typeof import('./premium');
    const vistos = accesosDe(premium);
    await premium.arrancarPremium(() => Promise.reject(new Error('sin sesión')));
    expect(vistos.filter((a) => a !== '?' && a !== 'regalo')).toEqual([]);
    expect([premium.seSabeElAcceso(), premium.accesoActual()]).toEqual([true, 'regalo']);
  });
});
