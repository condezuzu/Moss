// El orden y el modo automático de la sincronización, con una cuenta de mentira. La sincronización
// contra el esquema de verdad (dos y tres teléfonos, conflictos, sin conexión) se prueba con
// `npm run supabase:verificar`.

import { describe, expect, it, jest } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import type { Habito } from '../dominio/habitos';
import { crearAlmacen } from './almacen';
import type { Datos } from './mezclar';
import { repositorioEnMemoria, sinCambios, sinComida, type Cambios, type Repositorio } from './repositorio';
import { crearSincronizador, type Remoto } from './sincronizar';

const catalogo = datos.constelaciones as unknown as Constelacion[];
const habito = (id: string, orden: number): Habito => ({ id, nombre: id, icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden, desde: '2026-10-19' });
const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null, ...sinComida() });

/** Una cuenta de mentira: anota cada pedido, guarda lo que sube y, al bajar, devuelve `enLaCuenta`. `borrar` deja la marca de «Borrar mis datos». */
function cuenta(enLaCuenta: Partial<Datos> = {}) {
  const pedidos: string[] = [];
  const desdes: string[][] = [];
  const subido: Cambios[] = [];
  let fallas = 0;
  let borrado: string | null = null;
  const remoto: Remoto = {
    async borrado() {
      return borrado;
    },
    async subir(cambios) {
      pedidos.push('subir');
      if (fallas > 0) {
        fallas--;
        throw new Error('sin conexión');
      }
      subido.push(cambios);
    },
    async bajar(desde, marcasDesde, comidaDesde) {
      pedidos.push(desde ? 'bajar lo nuevo' : 'bajar todo');
      desdes.push([marcasDesde, comidaDesde]);
      return { datos: { ...nada(), ...enLaCuenta }, hasta: '2026-10-21T15:00:00.000Z' };
    },
  };
  return { remoto, pedidos, subido, desdes, fallar: (n: number) => (fallas = n), borrar: (en: string) => (borrado = en) };
}

async function telefono(repositorio: Repositorio = repositorioEnMemoria()) {
  const almacen = crearAlmacen({
    abrir: async () => repositorio, catalogo, ahora: () => new Date('2026-10-21T15:00:00Z'), zona: () => 'America/Montevideo',
    sembrar: () => [habito('meditar', 0), habito('leer', 1)], nuevaSemilla: () => 'semilla',
  });
  await almacen.iniciar();
  return { almacen, repositorio, pendiente: async () => !sinCambios(await almacen.enCola((r) => r.pendientes())) };
}

/** Lo hecho hoy en ese teléfono. */
const hoyDe = (t: Awaited<ReturnType<typeof telefono>>) => t.almacen.estado().dias.get(t.almacen.estado().hoy)?.hechos ?? [];

/** Espera de verdad hasta que se cumpla algo (el modo automático usa relojes). */
async function hasta(condicion: () => boolean | Promise<boolean>, ms = 2000) {
  const limite = Date.now() + ms;
  while (!(await condicion())) {
    if (Date.now() > limite) throw new Error('no pasó');
    await new Promise((listo) => setTimeout(listo, 5));
  }
}

describe('sincronizar', () => {
  it('la primera vez en el teléfono baja todo antes de subir; después sube primero y baja lo nuevo', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    expect(await s.vuelta()).toBe(true);
    expect(c.pedidos).toEqual(['bajar todo', 'subir']);
    t.almacen.marcar('leer', true, 'toque');
    await s.vuelta();
    expect(c.pedidos.slice(2)).toEqual(['subir', 'bajar lo nuevo']);
    expect(c.subido[1].marcas.map((m) => m.habito)).toEqual(['leer']);
    expect(await t.pendiente()).toBe(false);
  });

  it('de las marcas pide las de dos semanas, y de lo comido, lo de cuatro meses', async () => {
    const t = await telefono();
    const c = cuenta();
    await crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' }).vuelta();
    expect(c.desdes[0]).toEqual(['2026-10-07', '2026-06-23']);
  });

  it('lo comido sube como todo lo demás', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    await s.vuelta();
    t.almacen.registrar([{ fuente: 'rapida', ref: null, nombre: 'Alfajor', cantidad: null, valores: { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 } }], { comida: 'snack' });
    t.almacen.sumarAgua();
    await s.vuelta();
    expect([c.subido[1].registros.map((r) => r.nombre), c.subido[1].agua.map((a) => a.ml)]).toEqual([['Alfajor'], [250]]);
    expect(await t.pendiente()).toBe(false);
  });

  it('otro teléfono de la misma cuenta adopta la semilla y las constelaciones de la cuenta antes de subir las suyas', async () => {
    const t = await telefono();
    const periodos = [0, 1, 2, 3, 4, 5, 6].map((dia) => ({ dia: dia as 0, constelacion: 'aselli', cantidad: 2, desde: '2026-10-19' }));
    const c = cuenta({ semilla: 'de-la-cuenta', periodos });
    await crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' }).vuelta();
    expect(t.almacen.estado().semilla).toBe('de-la-cuenta');
    expect(t.almacen.estado().dias.get('2026-10-21')?.constelacion).toBe('aselli');
    expect(c.subido.every((cambios) => !cambios.semilla && !cambios.periodos)).toBe(true);
  });

  it('con los datos de otra cuenta no sube ni baja nada', async () => {
    const t = await telefono();
    await t.almacen.enCola((r) => r.guardarAjuste('usuario', 'u1'));
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u2' });
    expect(await s.vuelta()).toBe(false);
    expect(s.deOtraCuenta()).toBe(true);
    expect(c.pedidos).toEqual([]);
  });

  it('solo: sube unos instantes después de cada cambio y, si falla, reintenta más tarde', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1', espera: 20, reintento: 40 });
    s.arrancar();
    await hasta(() => c.pedidos.length === 2);
    expect(await t.pendiente()).toBe(false);

    // Varios toques seguidos suben juntos.
    t.almacen.marcar('meditar', true, 'toque');
    t.almacen.marcar('leer', true, 'toque');
    await hasta(() => c.subido.length === 2);
    expect(c.subido[1].marcas.map((m) => m.habito).sort()).toEqual(['leer', 'meditar']);

    c.fallar(1);
    t.almacen.marcar('leer', false, 'deshacer');
    await hasta(() => c.pedidos.filter((p) => p === 'subir').length === 3);
    expect(await t.pendiente()).toBe(true);
    await hasta(async () => c.subido.length === 3 && !(await t.pendiente()));
    expect(c.subido[2].marcas).toEqual([expect.objectContaining({ habito: 'leer', hecho: false })]);
    s.parar();
  });

  it('al volver la app del fondo baja lo nuevo; parado, ya no hace nada', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1', espera: 20 });
    s.arrancar();
    await hasta(() => c.pedidos.length === 2);
    s.alVolver();
    await hasta(() => c.pedidos.includes('bajar lo nuevo'));
    s.parar();
    const antes = c.pedidos.length;
    t.almacen.marcar('leer', true, 'toque');
    s.alVolver();
    await new Promise((listo) => setTimeout(listo, 60));
    expect(c.pedidos).toHaveLength(antes);
  });

  it('si la subida falla, igual baja lo nuevo, y el error sale para reintentar', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    await s.vuelta();
    t.almacen.marcar('leer', true, 'toque');
    c.fallar(1);
    await expect(s.vuelta()).rejects.toThrow('sin conexión');
    expect(c.pedidos.slice(2)).toEqual(['subir', 'bajar lo nuevo']);
    expect(await t.pendiente()).toBe(true);
  });

  it('parado, lo que vuelve de la cuenta ya no entra al teléfono', async () => {
    const t = await telefono();
    let soltar: () => void = () => {};
    const enCamino = new Promise<void>((listo) => (soltar = listo));
    const remoto: Remoto = {
      async subir() {},
      async bajar() {
        await enCamino;
        return { datos: { ...nada(), habitos: [habito('correr', 2)] }, hasta: '2026-10-21T15:00:00.000Z' };
      },
    };
    const s = crearSincronizador({ almacen: t.almacen, remoto, usuario: 'u1' });
    const vuelta = s.vuelta();
    await new Promise((listo) => setTimeout(listo, 10));
    const terminado = s.terminar();
    soltar();
    await terminado;
    expect(await vuelta).toBe(false);
    expect(t.almacen.estado().habitos.map((h) => h.id)).not.toContain('correr');
    expect(await t.almacen.enCola((r) => r.leerAjuste('usuario'))).toBeNull();
    expect(await t.almacen.enCola((r) => r.leerAjuste('bajado'))).toBeNull();
  });

  it('parado mientras bajaba, ya no sube: ni lo que se marcó mientras tanto', async () => {
    const t = await telefono();
    const subidas: Cambios[] = [];
    let enCamino: Promise<void> = Promise.resolve();
    let soltar: () => void = () => {};
    const remoto: Remoto = {
      async subir(cambios) {
        subidas.push(cambios);
      },
      async bajar() {
        await enCamino;
        return { datos: nada(), hasta: '2026-10-21T15:00:00.000Z' };
      },
    };
    const s = crearSincronizador({ almacen: t.almacen, remoto, usuario: 'u1' });
    await s.vuelta();
    const antes = subidas.length;
    enCamino = new Promise((listo) => (soltar = listo));
    const vuelta = s.vuelta();
    await new Promise((listo) => setTimeout(listo, 10));
    t.almacen.marcar('leer', true, 'toque');
    const terminado = s.terminar();
    soltar();
    await terminado;
    expect(await vuelta).toBe(false);
    expect(subidas).toHaveLength(antes);
    expect(await t.pendiente()).toBe(true);
  });

  it('la primera bajada: se sabe cuándo el teléfono ya conoce la cuenta, con su dueño guardado', async () => {
    const t = await telefono();
    let soltar: () => void = () => {};
    const enCamino = new Promise<void>((listo) => (soltar = listo));
    const remoto: Remoto = {
      async subir() {},
      async bajar() {
        await enCamino;
        return { datos: nada(), hasta: '2026-10-21T15:00:00.000Z' };
      },
    };
    const s = crearSincronizador({ almacen: t.almacen, remoto, usuario: 'u1' });
    let conocida = false;
    s.primeraBajada().then(() => (conocida = true));
    const vuelta = s.vuelta();
    await new Promise((listo) => setTimeout(listo, 10));
    expect(conocida).toBe(false);
    soltar();
    await vuelta;
    expect(conocida).toBe(true);
    expect(await t.almacen.enCola((r) => r.leerAjuste('usuario'))).toBe('u1');
    // Un teléfono que ya la conocía: con la primera vuelta, sin volver a bajar todo.
    const c = cuenta();
    const otro = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    await otro.vuelta();
    await otro.primeraBajada();
    expect(c.pedidos).toEqual(['bajar lo nuevo']);
  });

  it('«Borrar mis datos» en otro teléfono: este olvida lo suyo antes de subir nada y vuelve a bajar de cero', async () => {
    const t = await telefono();
    const c = cuenta();
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    await s.vuelta();
    t.almacen.marcar('leer', true, 'toque');
    await s.vuelta(false);
    // Marcado acá antes de enterarse: es de antes del borrado.
    t.almacen.marcar('meditar', true, 'toque');
    c.borrar('2026-10-21T16:00:00.000Z');
    const [subidas, pedidos] = [c.subido.length, c.pedidos.length];
    await s.vuelta();
    expect(hoyDe(t)).toEqual([]);
    expect(c.subido.slice(subidas).flatMap((x) => x.marcas)).toEqual([]);
    expect(c.pedidos.slice(pedidos)).toEqual(['bajar todo', 'subir']);
    // Ya enterado, no vuelve a olvidar.
    t.almacen.marcar('leer', true, 'toque');
    await s.vuelta();
    expect(hoyDe(t)).toEqual(['leer']);
  });

  it('el teléfono que borró no olvida dos veces, ni el que ya sincronizaba antes de que existiera la marca', async () => {
    for (const yaLaConocia of [false, true]) {
      const t = await telefono();
      if (yaLaConocia) await t.almacen.enCola((r) => r.guardarAjuste('usuario', 'u1'));
      const c = cuenta();
      c.borrar('2026-10-21T16:00:00.000Z');
      const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
      t.almacen.marcar('leer', true, 'toque');
      await s.vuelta();
      await s.vuelta();
      expect(hoyDe(t)).toEqual(['leer']);
    }
  });

  it('si no se pudo guardar lo bajado, no se da por bajado: al abrir Moss otra vez se vuelve a pedir', async () => {
    const base = repositorioEnMemoria();
    let fallar = true;
    const repositorio: Repositorio = {
      ...base,
      async guardarDeLaNube(cambios) {
        if (fallar) throw new Error('disco lleno');
        await base.guardarDeLaNube(cambios);
      },
    };
    const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const bajado = (t: Awaited<ReturnType<typeof telefono>>) => t.almacen.enCola((r) => r.leerAjuste('bajado'));
    const t = await telefono(repositorio);
    const c = cuenta({ habitos: [habito('correr', 2)] });
    const s = crearSincronizador({ almacen: t.almacen, remoto: c.remoto, usuario: 'u1' });
    await expect(s.vuelta()).rejects.toThrow('disco lleno');
    expect(await bajado(t)).toBeNull();
    // Lo bajado quedó en memoria y no en el teléfono: mientras siga abierta, tampoco avanza.
    fallar = false;
    await expect(s.vuelta()).rejects.toThrow();
    expect(await bajado(t)).toBeNull();
    const otra = await telefono(repositorio);
    await crearSincronizador({ almacen: otra.almacen, remoto: c.remoto, usuario: 'u1' }).vuelta();
    expect(otra.almacen.estado().habitos.map((h) => h.id)).toContain('correr');
    expect(await bajado(otra)).toBe('2026-10-21T15:00:00.000Z');
    aviso.mockRestore();
  });
});
