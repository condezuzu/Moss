import { describe, expect, it } from '@jest/globals';

import type { MetaGuardada, Perfil } from '@/dominio/metas';
import { calcularPersona, suenoDe } from './persona';

const HOY = '2026-10-22';
const vacio = { registros: new Map(), medidas: new Map() };

describe('la persona de Inicio y Progreso', () => {
  it('sin datos propios es la de ejemplo: baja de peso, va en camino y tiene su control', () => {
    const p = calcularPersona({ hoy: HOY, perfil: null, pesos: [], metas: [], ...vacio });
    expect(p.deEjemplo).toBe(true);
    expect(p.pesoHoy).not.toBeNull();
    expect(p.cambio30!).toBeLessThan(0);
    expect(['enCamino', 'despacio']).toContain(p.progreso.estado);
    expect(p.control?.datos.gastoMedido).not.toBeNull();
    expect(p.gasto).toBeGreaterThan(2000);
    expect(p.balance.promedio!).toBeLessThan(0);
    expect(p.grasa).not.toBeNull();
    expect(p.serie).toHaveLength(56);
  });

  it('con perfil y pesadas, es la tuya: la meta y el gasto son los guardados', () => {
    const perfil: Perfil = { sexo: 'f', nacimiento: 1990, alturaCm: 165, actividad: 'algo', objetivo: 'mantener', ritmo: 'recomendado', actualizado: `${HOY}T08:00:00Z` };
    const metas: MetaGuardada[] = [{ desde: '2026-10-20', kcal: 2000, proteina: 100, carbohidratos: 250, grasas: 65, gasto: 2000, motivo: 'inicial', momento: '2026-10-20T08:00:00Z' }];
    const pesos = [{ fecha: '2026-10-20', kg: 60, origen: 'manual' as const, momento: '2026-10-20T08:00:00Z' }, { fecha: HOY, kg: 60.4, origen: 'manual' as const, momento: `${HOY}T08:00:00Z` }];
    const p = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio });
    expect(p.deEjemplo).toBe(false);
    expect(p.meta?.kcal).toBe(2000);
    expect(p.gasto).toBe(2000);
    // Con dos días de pesadas todavía no hay ritmo: faltan datos.
    expect(p.progreso.estado).toBe('faltanDatos');
    expect(p.control).toBeNull();
    expect(p.estadoControl?.fecha).toBe('2026-10-27');
  });
});

describe('el sueño', () => {
  it('hasta conectar Salud, las noches de ejemplo, con la necesidad de la edad', () => {
    const s = suenoDe(HOY, null);
    expect(s.deEjemplo).toBe(true);
    expect(s.noches.length).toBeGreaterThan(20);
    expect(s.noches.some((n) => n.clave === HOY)).toBe(true);
    expect(s.necesidad).toBeGreaterThanOrEqual(7 * 60);
  });

  it('sin reloj, las noches de Moss: con una sola ya no son las de ejemplo', () => {
    const z = -new Date().getTimezoneOffset() * 60_000;
    const propias = new Map([[HOY, {
      fecha: HOY, actualizado: '2026-10-22T09:00:00.000Z',
      hora: { dormirse: new Date(Date.parse(`${HOY}T00:10:00.000Z`) - z).toISOString(), despertar: new Date(Date.parse(`${HOY}T07:40:00.000Z`) - z).toISOString(), origen: 'confirmada' as const, confianza: 'media' as const },
    }]]);
    const s = suenoDe(HOY, null, null, propias);
    expect(s.deEjemplo).toBe(false);
    expect(s.noches).toHaveLength(1);
    expect(s.noches[0]).toMatchObject({ clave: HOY, dormido: 450, fuente: { id: 'moss' }, moss: { origen: 'confirmada' } });
  });
});
