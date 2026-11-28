import { describe, expect, it } from '@jest/globals';

import { alAbrirAscent, alReabrirLaMeta, olvidarLaMetaPedida, reabrirLaMeta } from './abrir';

const BORRADOR = { ejercicio: 'press_mancuernas', peso: '32,5', reps: '8' };

describe('«Reintentar»: la hoja de la meta con lo escrito, aunque la sección esté cerrada', () => {
  it('con la sección cerrada, la abre y la hoja espera a que las metas se armen', () => {
    const abiertas: string[] = [];
    const dejarDeAbrir = alAbrirAscent(() => abiertas.push('sección'));
    reabrirLaMeta(BORRADOR);
    expect(abiertas).toEqual(['sección']);
    // Se arman las metas: la hoja se abre una vez, con lo escrito.
    const hojas: unknown[] = [];
    const dejar = alReabrirLaMeta((b) => hojas.push(b));
    expect(hojas).toEqual([BORRADOR]);
    dejar();
    alReabrirLaMeta((b) => hojas.push(b))();
    expect(hojas).toEqual([BORRADOR]);
    dejarDeAbrir();
  });

  it('con la sección abierta, la hoja se abre enseguida', () => {
    const hojas: unknown[] = [];
    const dejar = alReabrirLaMeta((b) => hojas.push(b));
    reabrirLaMeta(BORRADOR);
    expect(hojas).toEqual([BORRADOR]);
    dejar();
  });

  it('desvinculada, lo pedido ya no va', () => {
    reabrirLaMeta(BORRADOR);
    olvidarLaMetaPedida();
    const hojas: unknown[] = [];
    alReabrirLaMeta((b) => hojas.push(b))();
    expect(hojas).toEqual([]);
  });
});
