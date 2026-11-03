import { describe, expect, it } from '@jest/globals';

import { estadoDelControl, tendencia, ultimoDiaDeControl, type Pesada } from './control';
import { sumarDias } from './fechas';
import { estadoDeMacro, RITMOS } from './metas';
import { balance, bordeDe, direccionDe, faltaParaEstimar, planPorEtapas, plazoConFecha, plazoConRitmo, progresoAlObjetivo, ritmoSemanal, SEMANAS_DE_MANTENIMIENTO, viabilidad, type EntradaDelPlazo } from './progreso';

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

  it('las primeras semanas, con las pesadas, mide el ritmo entero: la tendencia sola va atrasada', () => {
    const pesadas = bajando(15, 78, -0.5);
    const t = tendencia(pesadas, HOY);
    expect(ritmoSemanal(t, HOY, pesadas)!).toBeCloseTo(-0.5, 5);
    expect(ritmoSemanal(t, HOY)!).toBeGreaterThan(-0.3);
    const p = progresoAlObjetivo({ hoy: HOY, tendencia: t, pesadas, objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 70 });
    expect(p.ritmo!).toBeCloseTo(-0.5, 5);
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
    // Pasándola, también.
    expect(progresoAlObjetivo({ ...base, pesoMeta: t.get(HOY)! + 1, pesoInicial: 78 }).estado).toBe('llegaste');
  });

  it('con la meta del otro lado de donde se empezó (al pasar de bajar a subir), no llegaste: revisa la meta', () => {
    const p = progresoAlObjetivo({ ...base, objetivo: 'subir', pesoMeta: 70, pesoInicial: 78 });
    expect(p).toMatchObject({ estado: 'otroLado', hecho: null, fecha: null });
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

  it('si ya tocó y no corrió (al cambiar el día del control), es hoy, no un día pasado', () => {
    // El último control fue el lunes 19; el miércoles 21 se elige el martes: el del 20 corre hoy.
    const e = estadoDelControl({ hoy: HOY, dia: 2, ultimaMeta: '2026-10-19', pesadas: [], comidas: [] });
    expect(e).toMatchObject({ fecha: HOY, faltan: 0 });
  });

  it('el primer control mide si para entonces hay 7 días con pesadas y comida; si no, lo dice', () => {
    // Entrada el lunes 19, con pesada y comida desde ese día: el control del lunes 26 mira del 19 al 25.
    const desde19 = ['2026-10-19', '2026-10-20', '2026-10-21'];
    const pesadas = [{ fecha: '2026-10-19', kg: 74 }];
    const lunes = estadoDelControl({ hoy: HOY, dia: 1, ultimaMeta: '2026-10-19', pesadas, comidas: [...desde19, '2026-10-22'].map((fecha) => ({ fecha, kcal: 2500 })) });
    expect(lunes).toMatchObject({ fecha: '2026-10-26', tramoCorto: false });
    // Con el control el viernes 23, del 19 al 22 son 4 días: ese no mide.
    const viernes = estadoDelControl({ hoy: HOY, dia: 5, ultimaMeta: '2026-10-19', pesadas, comidas: desde19.map((fecha) => ({ fecha, kcal: 2500 })) });
    expect(viernes).toMatchObject({ fecha: '2026-10-23', tramoCorto: true, alcanza: false });
    // Sin nada registrado todavía, lo más pronto es hoy.
    expect(estadoDelControl({ hoy: HOY, dia: 1, ultimaMeta: '2026-10-19', pesadas: [], comidas: [] }).tramoCorto).toBe(true);
  });
});

describe('lo que le falta a Moss', () => {
  const control = { fecha: '2026-11-02', diasConComida: 2, pesadas: 0, minimos: { diasConComida: 4, pesadas: 1 } };

  it('lo que pide el control, el peso meta, las medidas y el reloj', () => {
    expect(faltaParaEstimar({ control, objetivo: 'bajar', pesoMeta: null, conMedidas: false, sinReloj: true })).toEqual([
      { que: 'pesadas', n: 1, fecha: '2026-11-02' },
      { que: 'comida', n: 2, fecha: '2026-11-02' },
      { que: 'pesoMeta' },
      { que: 'medidas' },
      { que: 'reloj' },
    ]);
  });

  it('con todo eso, nada; manteniendo no hace falta un peso meta', () => {
    const lleno = { ...control, diasConComida: 4, pesadas: 2 };
    expect(faltaParaEstimar({ control: lleno, objetivo: 'bajar', pesoMeta: 71, conMedidas: true, sinReloj: false })).toEqual([]);
    expect(faltaParaEstimar({ control: lleno, objetivo: 'mantener', pesoMeta: null, conMedidas: true, sinReloj: false })).toEqual([]);
    expect(faltaParaEstimar({ control: null, objetivo: 'mantener', conMedidas: true, sinReloj: false })).toEqual([]);
  });
});

describe('la meta con plazo', () => {
  const HOY = '2026-10-29';
  const ELLA: EntradaDelPlazo = { hoy: HOY, pesoKg: 80, pesoMeta: 72, sexo: 'f', edad: 34, gasto: 2300, entrenaFuerza: true };

  it('bajar hasta 0,5 % por semana es viable; hasta 1 %, exigente; más, muy agresivo', () => {
    expect(viabilidad('bajar', 0.5, 80)).toBe('viable');
    expect(viabilidad('bajar', 0.75, 80)).toBe('exigente');
    expect(viabilidad('bajar', 1, 80)).toBe('exigente');
    expect(viabilidad('bajar', 1.1, 80)).toBe('muyAgresivo');
    // Con mucho peso, el kilo por semana y las 1.000 kcal de déficit llegan antes que el 1 %.
    expect(viabilidad('bajar', 0.95, 120)).toBe('muyAgresivo');
    expect(viabilidad('bajar', 0.9, 105)).toBe('muyAgresivo');
    expect(bordeDe('bajar', 'exigente', 120)).toBeCloseTo(((1000 * 7) / 7700 / 120) * 100, 9);
    // El «rápido» de Moss es exigente.
    expect(viabilidad('bajar', -RITMOS.bajar.rapido, 80)).toBe('exigente');
  });

  it('subir hasta 0,25 % es viable; hasta 0,5 %, exigente; más, muy agresivo', () => {
    expect(viabilidad('subir', 0.25, 70)).toBe('viable');
    expect(viabilidad('subir', 0.4, 70)).toBe('exigente');
    expect(viabilidad('subir', 0.6, 70)).toBe('muyAgresivo');
  });

  it('con el ritmo, la fecha; con la fecha, el ritmo', () => {
    const conRitmo = plazoConRitmo(ELLA, 0.5)!;
    // 0,4 kg por semana para 8 kg: 20 semanas.
    expect(conRitmo).toMatchObject({ direccion: 'bajar', faltan: 8, fecha: sumarDias(HOY, 140), viabilidad: 'viable', avisos: [] });
    expect(conRitmo.kgPorSemana).toBeCloseTo(0.4, 9);
    expect(conRitmo.kcal).toBeCloseTo(440, 9);
    const enDiez = plazoConFecha(ELLA, sumarDias(HOY, 70))!;
    expect(enDiez.pct).toBeCloseTo(1, 9);
    expect(enDiez.viabilidad).toBe('exigente');
    expect(plazoConFecha(ELLA, sumarDias(HOY, 56))!.viabilidad).toBe('muyAgresivo');
    // Lo que se puede sugerir: viable desde las 20 semanas y exigente desde las 10.
    expect(enDiez).toMatchObject({ fechaViable: sumarDias(HOY, 140), fechaExigente: sumarDias(HOY, 70) });
    const subir = plazoConRitmo({ ...ELLA, pesoKg: 70, pesoMeta: 75 }, 0.25)!;
    expect(subir).toMatchObject({ direccion: 'subir', fecha: sumarDias(HOY, 200), viabilidad: 'viable' });
  });

  it('sin camino o sin tiempo no hay plazo', () => {
    expect(direccionDe(80, 79.6)).toBeNull();
    expect(plazoConRitmo({ ...ELLA, pesoMeta: 79.8 }, 0.5)).toBeNull();
    expect(plazoConRitmo(ELLA, 0)).toBeNull();
    expect(plazoConFecha(ELLA, sumarDias(HOY, 3))).toBeNull();
  });

  it('avisa del piso, de la edad y de la fuerza', () => {
    // Con 1.700 kcal de gasto y el piso de 1.200, el déficit no pasa de 500 kcal: 8 kg en 124 días.
    const piso = plazoConFecha({ ...ELLA, gasto: 1700 }, sumarDias(HOY, 70))!;
    expect(piso.avisos).toEqual(['piso']);
    expect(piso.fechaConPiso).toBe(sumarDias(HOY, 124));
    expect(plazoConRitmo({ ...ELLA, gasto: 1700 }, 0.5)!.fechaConPiso).toBeNull();
    expect(plazoConFecha({ ...ELLA, edad: 17 }, sumarDias(HOY, 70))!.avisos).toEqual(['menor']);
    expect(plazoConRitmo({ ...ELLA, edad: 17 }, 0.5)!.avisos).toEqual([]);
    expect(plazoConRitmo({ ...ELLA, entrenaFuerza: null }, 0.5)!.avisos).toEqual(['sinFuerzaBajar']);
    expect(plazoConRitmo({ ...ELLA, pesoKg: 70, pesoMeta: 75, entrenaFuerza: false }, 0.25)!.avisos).toEqual(['sinFuerzaSubir']);
  });
});

describe('el plan por etapas', () => {
  const HOY = '2026-10-29';
  const ELLA: EntradaDelPlazo = { hoy: HOY, pesoKg: 80, pesoMeta: 72, sexo: 'f', edad: 34, gasto: 2300, entrenaFuerza: true };
  // 0,4 kg por semana para 8 kg: 20 semanas, hasta el 18 de marzo.
  const plazo = plazoConRitmo(ELLA, 0.5)!;
  const plan = (ritmo: number | null, p = plazo) => planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72, plazo: p, ritmo });

  it('llegar a la meta y después unas semanas en mantenimiento', () => {
    const { etapas } = plan(-0.4);
    expect(etapas).toEqual([
      { tipo: 'bajar', desde: HOY, hasta: plazo.fecha, pesoDesde: 80, pesoHasta: 72 },
      { tipo: 'mantener', desde: plazo.fecha, hasta: sumarDias(plazo.fecha, SEMANAS_DE_MANTENIMIENTO * 7), pesoDesde: 72, pesoHasta: 72 },
    ]);
  });

  it('lo que sigue al mantenimiento, si lo dijo: quedarse ahí o ganar músculo, sin fecha de fin', () => {
    const fin = sumarDias(plazo.fecha, SEMANAS_DE_MANTENIMIENTO * 7);
    const conMusculo = planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72, plazo, ritmo: -0.4, despues: 'musculo' });
    expect(conMusculo.etapas[2]).toEqual({ tipo: 'subir', desde: fin, hasta: null, pesoDesde: 72, pesoHasta: 72 });
    expect(planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72, plazo, ritmo: -0.4, despues: 'mantener' }).etapas[2].tipo).toBe('mantener');
    // Sin decidirlo, el plan termina en el mantenimiento.
    expect(planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72, plazo, ritmo: -0.4, despues: 'despues' }).etapas).toHaveLength(2);
  });

  it('un hito cada cuatro semanas; en un plan largo, tres repartidos; el último es la meta', () => {
    const { hitos } = plan(-0.4);
    // 20 semanas: cuatro marcas de cuatro semanas no entran, van tres repartidas cada 35 días.
    expect(hitos.map((h) => h.fecha)).toEqual([sumarDias(HOY, 35), sumarDias(HOY, 70), sumarDias(HOY, 105), plazo.fecha]);
    expect(hitos.map((h) => h.kg)).toEqual([78, 76, 74, 72]);
    expect(hitos.map((h) => h.meta)).toEqual([false, false, false, true]);
    // 10 semanas: a las 4 y a las 8.
    const corto = plazoConFecha(ELLA, sumarDias(HOY, 70))!;
    expect(plan(-0.8, corto).hitos.map((h) => h.fecha)).toEqual([sumarDias(HOY, 28), sumarDias(HOY, 56), corto.fecha]);
    // Menos de cuatro semanas: solo la meta.
    const ya = plazoConRitmo({ ...ELLA, pesoMeta: 79 }, 0.5)!;
    expect(planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 79, plazo: ya, ritmo: null }).hitos).toHaveLength(1);
  });

  it('cómo vienes: al ritmo con un cuarto de margen, más rápido, más lento o al revés', () => {
    expect(plan(-0.42).comoVienes).toBe('alRitmo');
    expect(plan(-0.32).comoVienes).toBe('alRitmo');
    expect(plan(-0.6).comoVienes).toBe('adelantado');
    expect(plan(-0.2).comoVienes).toBe('atrasado');
    expect(plan(0.2).comoVienes).toBe('alReves');
    expect(plan(null).comoVienes).toBe('faltanDatos');
    // Con un plan lento, el margen es de 100 g por semana.
    const lento = plazoConRitmo(ELLA, 0.1)!;
    expect(plan(-0.15, lento).comoVienes).toBe('alRitmo');
  });

  it('a tu ritmo, a dónde llegarías: más rápido, antes que el plan; quieto o al revés, sin fecha', () => {
    expect(plan(-0.8).fechaATuRitmo).toBe(sumarDias(HOY, 70));
    expect(plan(-0.2).fechaATuRitmo).toBe(sumarDias(HOY, 280));
    expect(plan(-0.03).fechaATuRitmo).toBeNull();
    expect(plan(0.3).fechaATuRitmo).toBeNull();
    expect(plan(-0.4).ritmoPlan).toBeCloseTo(-0.4, 9);
  });

  it('manteniendo, una sola etapa sin fin, sin hitos, estable o cambiando', () => {
    const m = planPorEtapas({ hoy: HOY, pesoKg: 75, objetivo: 'mantener', plazo: null, ritmo: 0.1 });
    expect(m.etapas).toEqual([{ tipo: 'mantener', desde: HOY, hasta: null, pesoDesde: 75, pesoHasta: 75 }]);
    expect(m.hitos).toEqual([]);
    expect(m.comoVienes).toBe('estable');
    expect(planPorEtapas({ hoy: HOY, pesoKg: 75, objetivo: 'mantener', plazo: null, ritmo: 0.4 }).comoVienes).toBe('seMueve');
    // Ya en la meta (sin camino), llegaste.
    expect(planPorEtapas({ hoy: HOY, pesoKg: 72.3, objetivo: 'bajar', pesoMeta: 72, plazo: null, ritmo: -0.2 }).comoVienes).toBe('llegaste');
  });
});
