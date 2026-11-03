import { describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { estimarAnoche, nocheDeAhora } from './nocheSinReloj';

// Sin los Atajos ni el movimiento (no hay módulo en los tests): la noche sale de cuándo se usó Moss.
jest.mock('./anclas', () => ({ leerSenales: async () => [] }));

describe('la noche de anoche, sin reloj', () => {
  it('con el corte a las 6, a las 5 se estima la noche que acaba de terminar, no la de ayer (D32)', async () => {
    let instante = new Date(2026, 9, 21, 20, 0);
    const a = crearAlmacen({
      abrir: async () => repositorioEnMemoria(), catalogo: datos.constelaciones as unknown as Constelacion[], ahora: () => instante, zona: () => 'America/Montevideo', sembrar: () => [], nuevaSemilla: () => 's',
    });
    await a.iniciar();
    a.ponerCorte(360);
    // Moss abierta hasta las 23:10 y otra vez a las 4:50.
    a.anotarUso('abrir', new Date(2026, 9, 21, 23, 0).getTime());
    a.anotarUso('cerrar', new Date(2026, 9, 21, 23, 10).getTime());
    a.anotarUso('abrir', new Date(2026, 9, 22, 4, 50).getTime());
    instante = new Date(2026, 9, 22, 5, 0);
    a.revisarDia();
    expect(a.estado().hoy).toBe('2026-10-21');
    expect(nocheDeAhora(instante)).toBe('2026-10-22');
    await estimarAnoche(a, instante);
    expect(a.estado().noches.get('2026-10-22')?.hora?.origen).toBe('estimada');
    expect(a.estado().noches.has('2026-10-21')).toBe(false);
  });
});
