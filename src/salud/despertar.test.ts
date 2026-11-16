import { describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import type { Senal } from '../dominio/sinReloj';
import { buscarDespertar } from './despertar';

let mockSenales: Senal[] = [];
jest.mock('./anclas', () => ({ leerSenales: async () => mockSenales }));

const armar = async (instante: () => Date) => {
  const a = crearAlmacen({
    abrir: async () => repositorioEnMemoria(), catalogo: datos.constelaciones as unknown as Constelacion[], ahora: instante, zona: () => 'America/Montevideo', sembrar: () => [], nuevaSemilla: () => 's',
  });
  await a.iniciar();
  return a;
};

describe('el despertar real de hoy', () => {
  it('abrir Moss de mañana dice que te despertaste, y el despertador que llega después lo corre más temprano', async () => {
    let instante = new Date(2026, 10, 16, 3, 0);
    const a = await armar(() => instante);
    // Abrirla a las 3 es de la noche de ayer (antes del corte de las 4): no cuenta para hoy.
    a.anotarUso('abrir', instante.getTime());
    instante = new Date(2026, 10, 16, 8, 15);
    a.revisarDia();
    a.anotarUso('abrir', instante.getTime());
    mockSenales = [];
    await buscarDespertar(a, instante);
    expect(a.estado().despertares['2026-11-16']).toEqual({ despertar: 8 * 60 + 15, sabido: 8 * 60 + 15 });
    // Llega el «Me desperté» del atajo de las 7:50: el despertar se corre, cuándo se supo no.
    mockSenales = [{ id: 'x', que: 'meDesperte', en: new Date(2026, 10, 16, 7, 50).getTime() }];
    instante = new Date(2026, 10, 16, 8, 30);
    await buscarDespertar(a, instante);
    expect(a.estado().despertares['2026-11-16']).toEqual({ despertar: 7 * 60 + 50, sabido: 8 * 60 + 15 });
  });

  it('sin nada de mañana, todavía no se sabe', async () => {
    const instante = new Date(2026, 10, 16, 6, 0);
    const a = await armar(() => instante);
    mockSenales = [{ id: 'y', que: 'meVoyADormir', en: new Date(2026, 10, 15, 23, 0).getTime() }];
    await buscarDespertar(a, instante);
    expect(a.estado().despertares).toEqual({});
  });
});
