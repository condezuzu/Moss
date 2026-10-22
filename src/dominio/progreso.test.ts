import { describe, expect, it } from '@jest/globals';

import { estadoDelControl, tendencia, ultimoDiaDeControl, type Pesada } from './control';
import { sumarDias } from './fechas';
import { estadoDeMacro } from './metas';
import { balance, progresoAlObjetivo, ritmoSemanal } from './progreso';

const HOY = '2026-10-21';
/** Pesadas de todos los días hasta hoy, bajando `kgPorSemana` desde `inicial`. */
function bajando(dias: number, inicial: number, kgPorSemana: number): Pesada[] {
  return Array.from({ length: dias + 1 }, (_, i) => ({ fecha: sumarDias(HOY, i - dias), kg: inicial + (kgPorSemana / 7) * i }));
}

describe('el ritmo de la tendencia', () => {
  it('con el peso bajando medio kilo por semana, la tendencia mide eso', () => {
    const t = tendencia(bajando(60, 78, -0.5), HOY);
    expect(ritmoSemanal(t, HOY)).toBeCloseTo(-0.5, 1);
  });

  it('con menos de dos semanas no se mide', () => {
    expect(ritmoSemanal(tendencia(bajando(10, 78, -0.5), HOY), HOY)).toBeNull();
  });
});

describe('el progreso al objetivo', () => {
  const t = tendencia(bajando(60, 78, -0.4), HOY);
  const base = { hoy: HOY, tendencia: t, objetivo: 'bajar' as const, ritmo: 'recomendado' as const };

  it('en camino: con el ritmo medido, da la fecha de llegada', () => {
    const p = progresoAlObjetivo({ ...base, pesoMeta: 71, pesoInicial: 78 });
    expect(p.estado).toBe('enCamino');
    expect(p.faltan).toBeCloseTo(t.get(HOY)! - 71, 5);
    // Faltan unos 3,7 kg a 0,4 por semana: unas nueve semanas.
    expect(p.fecha! > '2026-12-15' && p.fecha! < '2027-01-10').toBe(true);
    expect(p.hecho!).toBeGreaterThan(0.4);
    expect(p.hecho!).toBeLessThan(0.6);
  });

  it('a medio kilo de la meta, llegaste', () => {
    expect(progresoAlObjetivo({ ...base, pesoMeta: t.get(HOY)! - 0.3, pesoInicial: 78 }).estado).toBe('llegaste');
  });

  it('con menos de la mitad del ritmo del plan, despacio; quieto o al revés, sin fecha', () => {
    const lento = tendencia(bajando(60, 78, -0.1), HOY);
    expect(progresoAlObjetivo({ ...base, tendencia: lento, pesoMeta: 70 }).estado).toBe('despacio');
    const quieto = tendencia(bajando(60, 78, 0), HOY);
    expect(progresoAlObjetivo({ ...base, tendencia: quieto, pesoMeta: 70 })).toMatchObject({ estado: 'quieto', fecha: null });
    const subiendo = tendencia(bajando(60, 78, 0.3), HOY);
    expect(progresoAlObjetivo({ ...base, tendencia: subiendo, pesoMeta: 70 })).toMatchObject({ estado: 'alReves', fecha: null });
  });

  it('subir es lo mismo para el otro lado', () => {
    const sube = tendencia(bajando(60, 70, 0.25), HOY);
    const p = progresoAlObjetivo({ hoy: HOY, tendencia: sube, objetivo: 'subir', ritmo: 'recomendado', pesoMeta: 75 });
    expect(p.estado).toBe('enCamino');
    expect(p.fecha).not.toBeNull();
  });

  it('manteniendo, estable o moviéndose; sin meta de peso, el ritmo contra el plan', () => {
    expect(progresoAlObjetivo({ ...base, objetivo: 'mantener', tendencia: tendencia(bajando(60, 74, 0.05), HOY) }).estado).toBe('estable');
    expect(progresoAlObjetivo({ ...base, objetivo: 'mantener' }).estado).toBe('seMueve');
    expect(progresoAlObjetivo(base)).toMatchObject({ estado: 'sinMeta' });
    expect(progresoAlObjetivo(base).ritmoPlan).toBeCloseTo((-0.5 / 100) * t.get(HOY)!, 5);
  });
});

describe('el balance', () => {
  it('lo comido menos el gasto, solo en los días registrados', () => {
    const b = balance([{ fecha: '2026-10-20', kcal: 2600 }, { fecha: '2026-10-19', kcal: 2400 }, { fecha: '2026-10-10', kcal: 5000 }], 3000, '2026-10-20');
    expect(b.dias.map((d) => d.balance)).toEqual([-600, -400]);
    expect(b.promedio).toBe(-500);
    expect(balance([], 3000, '2026-10-20').promedio).toBeNull();
  });
});

describe('cómo va cada macro', () => {
  it('brilla al llegar a la meta (redondeada), y tiembla al pasarse un 20 % y 10 g', () => {
    expect(estadoDeMacro(118.4, 119)).toBe('falta');
    expect(estadoDeMacro(118.6, 119)).toBe('cumplido');
    expect(estadoDeMacro(140, 119)).toBe('cumplido');
    expect(estadoDeMacro(143, 119)).toBe('pasado');
    // Con metas chicas cuentan los 10 g: 37 de 30 en keto todavía no tiembla.
    expect(estadoDeMacro(37, 30)).toBe('cumplido');
    expect(estadoDeMacro(40, 30)).toBe('pasado');
  });
});

describe('el día del control', () => {
  it('el último hasta hoy es el día de la semana elegido', () => {
    // El 21/10/2026 es miércoles: el último lunes fue el 19 y el último jueves, el 15.
    expect(ultimoDiaDeControl(HOY, 1)).toBe('2026-10-19');
    expect(ultimoDiaDeControl(HOY, 3)).toBe(HOY);
    expect(ultimoDiaDeControl(HOY, 4)).toBe('2026-10-15');
  });

  it('el próximo, y si la semana que va a mirar ya alcanza', () => {
    const comidas = ['2026-10-19', '2026-10-20', '2026-10-21'].map((fecha) => ({ fecha, kcal: 2500 }));
    const e = estadoDelControl({ hoy: HOY, dia: 1, ultimaMeta: '2026-10-19', pesadas: [{ fecha: '2026-10-20', kg: 74 }], comidas });
    expect(e).toMatchObject({ fecha: '2026-10-26', faltan: 5, diasConComida: 3, pesadas: 1, alcanza: false });
    // Si toca hoy y todavía no corrió, es hoy.
    expect(estadoDelControl({ hoy: HOY, dia: 3, ultimaMeta: '2026-10-14', pesadas: [], comidas }).fecha).toBe(HOY);
  });
});
