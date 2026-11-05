import { describe, expect, it } from '@jest/globals';

import { estadoDelControl, tendencia, ultimoDiaDeControl, type Pesada } from './control';
import { diaDeLaSemana, diasEntre, sumarDias, type DiaSemana } from './fechas';
import { estadoDeMacro, RITMOS } from './metas';
import {
  balance, bordeDe, direccionDe, faltaParaEstimar, fechasDeLlegada, planPorEtapas, plazoConFecha, plazoConRitmo, progresoAlObjetivo, ritmoConRango, ritmoSemanal, SEMANAS_DE_MANTENIMIENTO, viabilidad,
  type EntradaDelPlazo,
} from './progreso';

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

  it('pesándose solo los lunes, el del domingo es el real: no copia la última pesada hasta el domingo', () => {
    // −0,5 kg por semana exactos; copiando el lunes hasta el domingo daba −0,395.
    const domingo = '2026-10-25';
    const lunes = Array.from({ length: 9 }, (_, i) => ({ fecha: sumarDias('2026-10-19', -7 * (8 - i)), kg: 85 - 0.5 * i }));
    expect(Math.abs(ritmoSemanal(tendencia(lunes, domingo), domingo, lunes)! + 0.5)).toBeLessThanOrEqual(0.01);
  });
});

// El peso con el ruido que describe la literatura (spec/estudio/progreso.md, anexo): 0,5 kg por día que dura unos
// días (ρ = 0,6), el patrón de la semana (0,35 %) y medio kilo más cinco días de cada 28. Con semilla fija.
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
const INICIO = '2026-01-05';
function conRuido(kgPorSemana: number, r: () => number, dias: number, cuando: 'todos' | DiaSemana[] = 'todos'): Pesada[] {
  const lista: Pesada[] = [];
  const fase = Math.floor(r() * 28);
  let e = 0;
  for (let t = 0; t <= dias; t++) {
    e = t === 0 ? normal(r) * 0.5 : 0.6 * e + normal(r) * 0.5 * 0.8;
    const fecha = sumarDias(INICIO, t);
    const d = diaDeLaSemana(fecha);
    const kg = 80 + (kgPorSemana / 7) * t + e + (0.0035 / 2) * 80 * Math.cos((2 * Math.PI * ((d + 6) % 7)) / 7) + ((t + fase) % 28 < 5 ? 0.45 : 0);
    if (cuando === 'todos' || cuando.includes(d)) lista.push({ fecha, kg: Math.round(kg * 10) / 10 });
  }
  return lista;
}
// 500 series por caso: el estudio usó 2.000; los bordes de abajo tienen margen para el azar de 500.
const SERIES = 500;
const SEIS_SEMANAS = sumarDias(INICIO, 42);

describe('el ritmo con su margen', () => {
  it('una recta exacta da el ritmo exacto y el peso de hoy, también pesándose solo los lunes', () => {
    const r = ritmoConRango(bajando(60, 78, -0.4), HOY)!;
    expect(r.kgPorSemana).toBeCloseTo(-0.4, 9);
    expect(Math.abs(r.nivelHoy - (78 - (0.4 / 7) * 60))).toBeLessThanOrEqual(0.05);
    expect(r.semanas).toBe(6);
    const lunes = bajando(60, 78, -0.4).filter((p) => diaDeLaSemana(p.fecha) === 1);
    expect(ritmoConRango(lunes, HOY)!.kgPorSemana).toBeCloseTo(-0.4, 9);
    expect(Math.abs(ritmoConRango(lunes, HOY)!.nivelHoy - (78 - (0.4 / 7) * 60))).toBeLessThanOrEqual(0.05);
  });

  it('el margen cubre el ritmo de verdad entre 75 y 90 veces de cada 100', () => {
    const r = azar(7);
    let cubre = 0;
    for (let k = 0; k < SERIES; k++) {
      const x = ritmoConRango(conRuido(-0.4, r, 42), SEIS_SEMANAS)!;
      if (x.desde <= -0.4 && -0.4 <= x.hasta) cubre++;
    }
    expect(cubre / SERIES).toBeGreaterThanOrEqual(0.75);
    expect(cubre / SERIES).toBeLessThanOrEqual(0.9);
  });

  const comoViene = (verdad: number, r: () => number) => {
    const p = conRuido(-verdad, r, 42);
    const x = ritmoConRango(p, SEIS_SEMANAS)!;
    const plazo = plazoConRitmo({ hoy: SEIS_SEMANAS, pesoKg: x.nivelHoy, pesoMeta: 70, sexo: 'f', edad: 30, gasto: 2300, entrenaFuerza: true }, (0.4 / x.nivelHoy) * 100);
    return planPorEtapas({ hoy: SEIS_SEMANAS, pesoKg: x.nivelHoy, objetivo: 'bajar', pesoMeta: 70, plazo, ritmo: x.kgPorSemana, rango: x }).comoVienes;
  };

  it('con el ritmo de verdad igual al plan, «al ritmo» al menos 9 de cada 10 veces a las seis semanas', () => {
    const r = azar(11);
    let alRitmo = 0;
    for (let k = 0; k < SERIES; k++) if (comoViene(0.4, r) === 'alRitmo') alRitmo++;
    expect(alRitmo / SERIES).toBeGreaterThanOrEqual(0.9);
  });

  it('con el doble del plan, «adelantado» al menos 8 de cada 10 veces', () => {
    const r = azar(13);
    let adelantado = 0;
    for (let k = 0; k < SERIES; k++) if (comoViene(0.8, r) === 'adelantado') adelantado++;
    expect(adelantado / SERIES).toBeGreaterThanOrEqual(0.8);
  });

  it('manteniendo con el peso quieto, «cambiando» no más de 1 de cada 10 veces (con un ritmo sin margen, la mitad)', () => {
    const r = azar(21);
    let cambiando = 0;
    for (let k = 0; k < SERIES; k++) {
      const p = conRuido(0, r, 42);
      // Manteniendo, el estado sale del ritmo con su margen: de la tendencia solo hace falta que haya peso hoy.
      if (progresoAlObjetivo({ hoy: SEIS_SEMANAS, tendencia: new Map([[SEIS_SEMANAS, 80]]), pesadas: p, objetivo: 'mantener', ritmo: 'recomendado' }).estado === 'seMueve') cambiando++;
    }
    expect(cambiando / SERIES).toBeLessThanOrEqual(0.1);
  });

  it('con menos de tres semanas con pesadas no hay ritmo; con tres, el margen es ancho: todavía no se sabe', () => {
    const r = azar(5);
    const diez = conRuido(-0.4, r, 42).filter((p) => diasEntre(p.fecha, SEIS_SEMANAS) < 10);
    expect(ritmoConRango(diez, SEIS_SEMANAS)).toBeNull();
    const base = { hoy: SEIS_SEMANAS, objetivo: 'bajar' as const, ritmo: 'recomendado' as const, pesoMeta: 70 };
    expect(progresoAlObjetivo({ ...base, tendencia: tendencia(diez, SEIS_SEMANAS), pesadas: diez }).estado).toBe('faltanDatos');
    const tres = conRuido(-0.4, r, 42).filter((p) => diasEntre(p.fecha, SEIS_SEMANAS) < 17);
    const p = progresoAlObjetivo({ ...base, tendencia: tendencia(tres, SEIS_SEMANAS), pesadas: tres });
    expect(p).toMatchObject({ estado: 'todaviaNo', fecha: null, fechas: null });
    expect(p.rango!.hasta - p.rango!.desde).toBeGreaterThan(0.8);
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

  it('lo que falta y la fecha salen del peso de hoy, no de la tendencia, que atrasa nueve días', () => {
    const pesadas = bajando(60, 78, -0.4);
    const verdad = 78 - (0.4 / 7) * 60;
    const p = progresoAlObjetivo({ hoy: HOY, tendencia: tendencia(pesadas, HOY), pesadas, objetivo: 'bajar', ritmo: 'recomendado', pesoMeta: 71, pesoInicial: 78 });
    expect(Math.abs(p.faltan! - (verdad - 71))).toBeLessThanOrEqual(0.05);
    expect(Math.abs(diasEntre(sumarDias(HOY, Math.ceil(((verdad - 71) / 0.4) * 7)), p.fecha!))).toBeLessThanOrEqual(3);
    // La tendencia va medio kilo atrás: con ella faltaba medio kilo más y la fecha caía nueve días tarde.
    expect(p.peso! - verdad).toBeGreaterThan(0.4);
    expect(p.nivel!).toBeCloseTo(verdad, 1);
  });

  it('la fecha es un rango: con 4 kg que faltan y entre 0,3 y 0,5 kg por semana, de 8 a 13⅓ semanas', () => {
    expect(fechasDeLlegada(HOY, 4, 0.3, 0.5)).toEqual({ temprana: sumarDias(HOY, 56), tardia: sumarDias(HOY, 94) });
    // Si el lento casi no avanza, o pasa de dos años, no hay fecha.
    expect(fechasDeLlegada(HOY, 4, 0.05, 0.5)).toBeNull();
    expect(fechasDeLlegada(HOY, 20, 0.15, 0.5)).toBeNull();
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

  it('si el piso casi no deja déficit, no hay fecha con el piso: no se llega en dos años', () => {
    // Gastando 1.150, comer el piso de 1.200 no baja nada.
    const sinDeficit = plazoConRitmo({ ...ELLA, gasto: 1150 }, 0.5)!;
    expect(sinDeficit.avisos).toEqual(['pisoNoLlega']);
    expect(sinDeficit.fechaConPiso).toBeNull();
    // Gastando 1.210, el piso deja 10 kcal por día: 8 kg en unos 17 años.
    expect(plazoConFecha({ ...ELLA, gasto: 1210 }, sumarDias(HOY, 70))!).toMatchObject({ avisos: ['pisoNoLlega'], fechaConPiso: null });
    // Si el ritmo entra arriba del piso, también al llegar, nada que decir.
    expect(plazoConRitmo({ ...ELLA, gasto: 2300 }, 0.5)!.avisos).toEqual([]);
  });

  it('bajando, el gasto baja con el peso: hoy entra arriba del piso, pero cerca del final no', () => {
    // 60 kg, gasto 1.700, meta 52 al 0,75 %: hoy 1.205 kcal; al llegar, unas 1.524 − 495 = 1.029.
    const flaca: EntradaDelPlazo = { hoy: HOY, pesoKg: 60, pesoMeta: 52, sexo: 'f', edad: 34, gasto: 1700, entrenaFuerza: true };
    expect(plazoConRitmo(flaca, 0.75)!.avisos).toEqual(['pisoAlFinal']);
    expect(plazoConRitmo({ ...flaca, gasto: 2000 }, 0.75)!.avisos).toEqual([]);
    // Con ELLA (80 kg, gasto 1.700, al 0,5 %): 1.700 − 22 × 8 − 440 = 1.084.
    expect(plazoConRitmo({ ...ELLA, gasto: 1700 }, 0.5)!.avisos).toEqual(['pisoAlFinal']);
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

  it('los hitos van de a medio kilo: más fino sería precisión falsa', () => {
    const raro = plazoConRitmo({ ...ELLA, pesoMeta: 72.7 }, 0.45)!;
    const { hitos } = planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72.7, plazo: raro, ritmo: null });
    expect(hitos.length).toBeGreaterThan(1);
    for (const h of hitos.filter((x) => !x.meta)) expect(Number.isInteger(h.kg * 2)).toBe(true);
  });

  it('con el margen del ritmo: más lento o adelantado solo si todo el margen queda afuera; muy ancho, todavía no se sabe', () => {
    // El plan es 0,4 kg por semana, con un cuarto (0,1) de margen.
    const con = (ritmo: number, medio: number) => planPorEtapas({ hoy: HOY, pesoKg: 80, objetivo: 'bajar', pesoMeta: 72, plazo, ritmo, rango: { desde: ritmo - medio, hasta: ritmo + medio } });
    expect(con(-0.2, 0).comoVienes).toBe('atrasado');
    expect(con(-0.2, 0.15).comoVienes).toBe('alRitmo');
    expect(con(-0.62, 0.1).comoVienes).toBe('adelantado');
    expect(con(-0.62, 0.15).comoVienes).toBe('alRitmo');
    expect(con(-0.4, 0.45).comoVienes).toBe('todaviaNo');
    // La fecha a tu ritmo, como un rango: 8 kg entre 0,17 y 0,27 kg por semana.
    const lento = con(-0.22, 0.05);
    expect(lento.comoVienes).toBe('atrasado');
    expect(lento.fechasATuRitmo).toEqual({ temprana: sumarDias(HOY, 208), tardia: sumarDias(HOY, 330) });
    expect(lento.rango!.desde).toBeCloseTo(-0.27, 9);
    expect(lento.rango!.hasta).toBeCloseTo(-0.17, 9);
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

  it('pasando la meta también llegaste; con la meta del otro lado desde el principio, no', () => {
    const como = (pesoKg: number, objetivo: 'bajar' | 'subir', pesoMeta: number, pesoInicial?: number) =>
      planPorEtapas({ hoy: HOY, pesoKg, objetivo, pesoMeta, plazo: null, ritmo: -0.3, pesoInicial }).comoVienes;
    expect(como(70.8, 'bajar', 72)).toBe('llegaste');
    expect(como(70.8, 'bajar', 72, 80)).toBe('llegaste');
    expect(como(76.2, 'subir', 75)).toBe('llegaste');
    // Al pasar de bajar a subir con la meta abajo, no llegó: está del otro lado.
    expect(como(74, 'subir', 71, 78)).toBe('seMueve');
  });
});
