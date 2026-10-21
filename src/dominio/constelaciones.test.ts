import { describe, expect, it } from '@jest/globals';

import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { asignar, periodoDe, type Periodo } from './constelaciones';

const catalogo = datos.constelaciones as unknown as Constelacion[];
const estrellasDe = (id: string) => catalogo.find((c) => c.id === id)!.estrellas.length;
const abiertos = (periodos: Periodo[]) => periodos.filter((p) => !p.hasta);
const deLaSemana = (periodos: Periodo[], dia: number) => abiertos(periodos).find((p) => p.dia === dia);

// Cantidad de hábitos por día, de domingo a sábado: los de ejemplo de la app.
const SEMANA_DE_EJEMPLO = [4, 5, 5, 6, 5, 5, 4];
const MIERCOLES = '2026-10-21';

describe('una constelación por día de la semana', () => {
  const inicial = asignar([], SEMANA_DE_EJEMPLO, MIERCOLES, catalogo, 'semilla');

  it('le da a cada día una de su cantidad de estrellas', () => {
    expect(abiertos(inicial)).toHaveLength(7);
    for (const p of abiertos(inicial)) expect(estrellasDe(p.constelacion)).toBe(SEMANA_DE_EJEMPLO[p.dia]);
  });

  it('las siete son distintas cuando el catálogo alcanza', () => {
    expect(new Set(abiertos(inicial).map((p) => p.constelacion)).size).toBe(7);
  });

  it('la primera vez arranca el lunes: la semana entera ya tiene su constelación', () => {
    for (const p of inicial) expect(p.desde).toBe('2026-10-19');
  });

  it('es la misma con la misma semilla, y otra semilla da otro cielo', () => {
    expect(asignar([], SEMANA_DE_EJEMPLO, MIERCOLES, catalogo, 'semilla')).toEqual(inicial);
    const otras = ['a', 'b', 'c', 'd', 'e'].map((s) => JSON.stringify(asignar([], SEMANA_DE_EJEMPLO, MIERCOLES, catalogo, s)));
    expect(new Set(otras).size).toBeGreaterThan(1);
  });

  it('si cambia un día, los otros no se tocan', () => {
    const cantidades = [...SEMANA_DE_EJEMPLO];
    cantidades[1] = 6;
    const despues = asignar(inicial, cantidades, '2026-10-22', catalogo, 'semilla');
    for (const dia of [0, 2, 3, 4, 5, 6]) expect(deLaSemana(despues, dia)).toEqual(deLaSemana(inicial, dia));
    const lunes = deLaSemana(despues, 1)!;
    expect(estrellasDe(lunes.constelacion)).toBe(6);
    expect(lunes.desde).toBe('2026-10-22');
    // El miércoles ya tiene una de 6: el lunes recibe otra.
    expect(lunes.constelacion).not.toBe(deLaSemana(despues, 3)!.constelacion);
    // La de antes queda guardada hasta ayer, con su progreso.
    expect(despues.find((p) => p.dia === 1 && p.hasta)).toMatchObject({ constelacion: deLaSemana(inicial, 1)!.constelacion, hasta: '2026-10-21' });
  });

  it('al volver a la cantidad de antes, vuelve su constelación', () => {
    const conSeis = [...SEMANA_DE_EJEMPLO];
    conSeis[1] = 6;
    const despues = asignar(inicial, conSeis, '2026-10-22', catalogo, 'semilla');
    const vuelta = asignar(despues, SEMANA_DE_EJEMPLO, '2026-11-02', catalogo, 'semilla');
    expect(deLaSemana(vuelta, 1)!.constelacion).toBe(deLaSemana(inicial, 1)!.constelacion);
  });

  it('dos cambios en el mismo día no dejan un período vacío', () => {
    const conSeis = [...SEMANA_DE_EJEMPLO];
    conSeis[1] = 6;
    const conSiete = [...SEMANA_DE_EJEMPLO];
    conSiete[1] = 7;
    const una = asignar(inicial, conSeis, '2026-10-22', catalogo, 'semilla');
    const dos = asignar(una, conSiete, '2026-10-22', catalogo, 'semilla');
    for (const p of dos) if (p.hasta) expect(p.hasta >= p.desde).toBe(true);
    expect(dos.filter((p) => p.dia === 1)).toHaveLength(2);
    expect(estrellasDe(deLaSemana(dos, 1)!.constelacion)).toBe(7);
  });

  it('si no alcanzan, se repite la menos repetida', () => {
    // Siete días de 6 hábitos y solo tres constelaciones de 6 estrellas.
    const todas = asignar([], [6, 6, 6, 6, 6, 6, 6], MIERCOLES, catalogo, 'semilla');
    const veces = new Map<string, number>();
    for (const p of abiertos(todas)) veces.set(p.constelacion, (veces.get(p.constelacion) ?? 0) + 1);
    expect(veces.size).toBe(3);
    expect(Math.max(...veces.values()) - Math.min(...veces.values())).toBeLessThanOrEqual(1);
  });

  it('un día sin hábitos no tiene constelación', () => {
    const sinDomingo = asignar(inicial, [0, 5, 5, 6, 5, 5, 4], '2026-10-22', catalogo, 'semilla');
    expect(deLaSemana(sinDomingo, 0)).toBeUndefined();
  });

  it('con más hábitos que cualquier constelación de esa cantidad, usa una de las que tienen más', () => {
    const grande = asignar([], [16, 0, 0, 0, 0, 0, 0], MIERCOLES, catalogo, 'semilla');
    expect(estrellasDe(deLaSemana(grande, 0)!.constelacion)).toBe(17);
  });

  it('cada fecha encuentra el período que le tocaba', () => {
    const conSeis = [...SEMANA_DE_EJEMPLO];
    conSeis[1] = 6;
    const despues = asignar(inicial, conSeis, '2026-10-22', catalogo, 'semilla');
    expect(periodoDe(despues, '2026-10-19')!.constelacion).toBe(deLaSemana(inicial, 1)!.constelacion);
    expect(periodoDe(despues, '2026-10-26')!.constelacion).toBe(deLaSemana(despues, 1)!.constelacion);
  });
});
