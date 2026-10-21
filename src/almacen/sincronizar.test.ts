// El orden y el modo automático de la sincronización, con una cuenta de mentira. La sincronización
// contra el esquema de verdad (dos y tres teléfonos, conflictos, sin conexión) se prueba con
// `npm run supabase:verificar`.

import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import type { Habito } from '../dominio/habitos';
import { crearAlmacen } from './almacen';
import type { Datos } from './mezclar';
import { repositorioEnMemoria, sinCambios, type Cambios, type Repositorio } from './repositorio';
import { crearSincronizador, type Remoto } from './sincronizar';

const catalogo = datos.constelaciones as unknown as Constelacion[];
const habito = (id: string, orden: number): Habito => ({ id, nombre: id, icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden, desde: '2026-10-19' });
const nada = (): Datos => ({ habitos: [], periodos: [], dias: [], marcas: [], logros: [], perfil: null, metas: [], pesos: [], semilla: null });

/** Una cuenta de mentira: anota cada pedido, guarda lo que sube y, al bajar, devuelve `enLaCuenta`. */
function cuenta(enLaCuenta: Partial<Datos> = {}) {
  const pedidos: string[] = [];
  const subido: Cambios[] = [];
  let fallas = 0;
  const remoto: Remoto = {
    async subir(cambios) {
      pedidos.push('subir');
      if (fallas > 0) {
        fallas--;
        throw new Error('sin conexión');
      }
      subido.push(cambios);
    },
    async bajar(desde) {
      pedidos.push(desde ? 'bajar lo nuevo' : 'bajar todo');
      return { datos: { ...nada(), ...enLaCuenta }, hasta: '2026-10-21T15:00:00.000Z' };
    },
  };
  return { remoto, pedidos, subido, fallar: (n: number) => (fallas = n) };
}

async function telefono(repositorio: Repositorio = repositorioEnMemoria()) {
  const almacen = crearAlmacen({
    abrir: async () => repositorio, catalogo, ahora: () => new Date('2026-10-21T15:00:00Z'), zona: () => 'America/Montevideo',
    sembrar: () => [habito('meditar', 0), habito('leer', 1)], nuevaSemilla: () => 'semilla',
  });
  await almacen.iniciar();
  return { almacen, repositorio, pendiente: async () => !sinCambios(await almacen.enCola((r) => r.pendientes())) };
}

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
});
