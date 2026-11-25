import { describe, expect, it } from '@jest/globals';

import type { RespuestasGuardadas } from '@/dominio/cuestionario';
import { sumarDias } from '@/dominio/fechas';
import type { MetaGuardada, Perfil } from '@/dominio/metas';
import { plazoConRitmo } from '@/dominio/progreso';
import { calcularPersona, plazoDelPlan, ritmoDelPlan, suenoDe } from './persona';

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

  const conSalud = () => {
    // 60 días de Salud bajando de 88 a 85 antes de la entrada (el 22/9), y después quieto en 85.
    const pesos = Array.from({ length: 91 }, (_, i) => ({ fecha: sumarDias(HOY, i - 90), kg: i < 60 ? 88 - (3 * i) / 60 : 85, origen: 'salud' as const, momento: `${HOY}T08:00:00Z` }));
    const metas: MetaGuardada[] = [{ desde: sumarDias(HOY, -30), kcal: 2000, proteina: 150, carbohidratos: 190, grasas: 70, gasto: 2500, motivo: 'inicial', momento: '' }];
    return { pesos, metas };
  };

  it('empezaste con la tendencia del día de la entrada, no con la pesada más vieja de Salud', () => {
    const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 80, actualizado: `${HOY}T08:00:00Z` };
    const { pesos, metas } = conSalud();
    const p = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio });
    expect(p.pesoInicial!).toBeCloseTo(p.tendencia.get(metas[0].desde)!, 6);
    expect(p.pesoInicial!).toBeLessThan(86);
  });

  it('con el objetivo fijado después de la entrada, empezaste con la tendencia de ese día: al llegar, llegaste', () => {
    // Entró manteniendo en 80, subió a 85 y ahí eligió bajar a 82; ya está en 82. Desde la entrada, la meta
    // estaba «del otro lado» y no llegaba nunca.
    const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 82, actualizado: `${HOY}T08:00:00Z` };
    const kg = (i: number) => (i < 15 ? 80 + i / 3 : i < 35 ? 85 - (3 * (i - 15)) / 20 : 82);
    const pesos = Array.from({ length: 61 }, (_, i) => ({ fecha: sumarDias(HOY, i - 60), kg: kg(i), origen: 'manual' as const, momento: `${HOY}T08:00:00Z` }));
    const metas: MetaGuardada[] = [{ desde: sumarDias(HOY, -60), kcal: 2500, proteina: 150, carbohidratos: 280, grasas: 80, gasto: 2500, motivo: 'inicial', momento: '' }];
    const desde = sumarDias(HOY, -45);
    const p = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio, inicioDelObjetivo: desde });
    expect(p.pesoInicial!).toBeCloseTo(p.tendencia.get(desde)!, 6);
    expect(p.progreso.estado).toBe('llegaste');
    expect(calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio }).progreso.estado).toBe('otroLado');
  });

  it('sin pesadas en la última semana, el cambio de 7 días no es un dato (no «0 kg»)', () => {
    const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 80, actualizado: `${HOY}T08:00:00Z` };
    const { pesos, metas } = conSalud();
    const viejas = pesos.filter((x) => x.fecha <= sumarDias(HOY, -20));
    const p = calcularPersona({ hoy: HOY, perfil, pesos: viejas, metas, ...vacio });
    expect(p.cambio7).toBeNull();
    expect(p.cambio30).not.toBeNull();
    expect(calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio }).cambio7).not.toBeNull();
  });

  it('el ritmo del plan es el elegido en Ritmo y plazo, aunque el perfil diga otro (como en Progreso)', () => {
    const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'suave', pesoMeta: 80, actualizado: `${HOY}T08:00:00Z` };
    const { pesos, metas } = conSalud();
    const sinPlazo = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio });
    const conPlazo = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio, plazo: { pct: 1, fecha: null }, respuestas: null });
    expect(sinPlazo.progreso.ritmoPlan).toBeCloseTo(-0.0025 * sinPlazo.pesoHoy!, 6);
    expect(conPlazo.progreso.ritmoPlan).toBeCloseTo(-0.01 * conPlazo.pesoHoy!, 6);
  });

  it('sin déficit, bajar queda en mantener también en el progreso', () => {
    const perfil: Perfil = { sexo: 'f', nacimiento: 1990, alturaCm: 165, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 70, sinDeficit: true, actualizado: `${HOY}T08:00:00Z` };
    const { pesos, metas } = conSalud();
    const p = calcularPersona({ hoy: HOY, perfil, pesos, metas, ...vacio });
    expect(p.progreso).toMatchObject({ estado: 'estable', ritmoPlan: 0, faltan: null });
  });
});

describe('el ritmo del plan, el mismo de Progreso', () => {
  const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'suave', pesoMeta: 80, actualizado: '' };
  const respuestas = (fecha: string | null, pct: number | null) => ({ fecha, eleccion: { pct } }) as unknown as RespuestasGuardadas;

  it('lo elegido en Ritmo y plazo, aunque el perfil diga otro; sin elegir, la fecha del cuestionario; sin nada, el del perfil', () => {
    expect(ritmoDelPlan({ perfil, plazo: { pct: 1, fecha: null }, respuestas: respuestas('2027-03-01', -0.8) })).toBe(1);
    expect(ritmoDelPlan({ perfil, plazo: null, respuestas: respuestas('2027-03-01', -0.8) })).toBe(0.8);
    expect(ritmoDelPlan({ perfil, plazo: null, respuestas: null })).toBe(0.25);
  });

  it('sin déficit, bajar queda en mantener: no hay ritmo', () => {
    expect(ritmoDelPlan({ perfil: { ...perfil, sinDeficit: true }, plazo: { pct: 1, fecha: null }, respuestas: null })).toBeNull();
  });

  it('con una fecha, el que hace falta desde el peso de hoy, como Progreso lo vuelve a sacar cada día', () => {
    // Quieto en 85, a 5 kg de la meta y a diez semanas de la fecha: el 0,59 %, no el 0,4 elegido hace un mes.
    const pesos = Array.from({ length: 43 }, (_, i) => ({ fecha: sumarDias(HOY, i - 42), kg: 85, origen: 'manual' as const, momento: '' }));
    const fecha = sumarDias(HOY, 70);
    const pedido = (5 / 10 / 85) * 100;
    expect(ritmoDelPlan({ perfil, plazo: { pct: 0.4, fecha }, respuestas: null, hoy: HOY, pesos })!).toBeCloseTo(pedido, 4);
    expect(ritmoDelPlan({ perfil, plazo: null, respuestas: respuestas(fecha, -0.4), hoy: HOY, pesos })!).toBeCloseTo(pedido, 4);
    expect(ritmoDelPlan({ perfil, plazo: { pct: 0.4, fecha: null }, respuestas: null, hoy: HOY, pesos })).toBe(0.4);
  });
});

describe('el plazo del plan, para el primer día', () => {
  const perfil: Perfil = { sexo: 'm', nacimiento: 1990, alturaCm: 180, actividad: 'algo', objetivo: 'bajar', ritmo: 'suave', pesoMeta: 80, actualizado: '' };
  const pesos = [{ fecha: HOY, kg: 90, origen: 'manual' as const, momento: '' }];
  const entrada = { hoy: HOY, pesoKg: 90, pesoMeta: 80, sexo: 'm' as const, edad: 36, gasto: 2600, entrenaFuerza: null };
  const respuestas = (fecha: string | null, pct: number | null) => ({ fecha, eleccion: { pct } }) as unknown as RespuestasGuardadas;

  it('es el de Progreso: la fecha elegida en el cuestionario o, sin ella, el ritmo del plan (no siempre el borde de lo viable)', () => {
    const fecha = sumarDias(HOY, 140);
    expect(plazoDelPlan({ hoy: HOY, perfil, pesos, plazo: null, respuestas: respuestas(fecha, -0.79) }, entrada)?.fecha).toBe(fecha);
    expect(plazoDelPlan({ hoy: HOY, perfil, pesos, plazo: null, respuestas: null }, entrada)?.fecha).toBe(plazoConRitmo(entrada, 0.25)!.fecha);
    expect(plazoDelPlan({ hoy: HOY, perfil, pesos, plazo: { pct: 0.7, fecha: null }, respuestas: null }, entrada)?.fecha).toBe(plazoConRitmo(entrada, 0.7)!.fecha);
  });

  it('sin déficit, bajar queda en mantener: no hay plazo; con la meta del otro lado, tampoco', () => {
    expect(plazoDelPlan({ hoy: HOY, perfil: { ...perfil, sinDeficit: true }, pesos, plazo: null, respuestas: null }, entrada)).toBeNull();
    expect(plazoDelPlan({ hoy: HOY, perfil, pesos, plazo: null, respuestas: null }, { ...entrada, pesoMeta: 95 })).toBeNull();
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
    // De 00:10 a 7:40, 7 h 30 min: sin reloj cuenta la noche entera.
    expect(s.noches[0]).toMatchObject({ clave: HOY, dormido: 450, fuente: { id: 'moss' }, moss: { origen: 'confirmada' } });
  });
});
