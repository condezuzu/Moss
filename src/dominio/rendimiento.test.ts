import { describe, expect, it } from '@jest/globals';

import {
  aDosYMedio, buenDiaParaMarca, categoriaDe, cercaDeLaMarca, condicionesDeLaMarca, frecuenciaDeMarcas, nivelEn, normalAcumulada, porElSueno, porLaComida, porLaDescarga, porLasNoches,
  probabilidadTuya, rendimientoEsperado, seguridadDeMarcas, sigmaTuyo, tendenciaDeFuerza, type EntradasDelRendimiento, type PuntoDeFuerza,
} from './rendimiento';

/** Un día cualquiera: durmió bien, comió, nada cargado. */
const NORMAL: EntradasDelRendimiento = {
  sueno: { dormido: 7.5 * 60, necesidad: 8 * 60, despertoAntes: false, seAcostoTarde: false, siesta: false, sinReloj: false },
  ultimas3: [450, 440, 460], deuda: 60, cara: 4, multiarticular: true, tren: 'inferior', horaHabitual: 19 * 60,
  comida: { ayuno8h: false, sesionLarga: true, carbosAyerPorKilo: 4, mismosMusculosAyer: false, bajaSemanal: 0.5, semanasBajando: 6, kcalAyer: 0.95 },
  residual: 0, descarga: { diasSinSeriesDuras: 1, seriesSemanaSobreMes: 1, intensidadMantenida: true, diasSinElEjercicio: 7 }, entrenado: true,
};

describe('el rendimiento esperado', () => {
  it('el ejemplo de la especificación: 5 h 50, despertó antes, sentadilla de tarde y el cuádriceps al 4 %', () => {
    const r = rendimientoEsperado({
      ...NORMAL,
      sueno: { ...NORMAL.sueno!, dormido: 350, despertoAntes: true },
      residual: 4,
    });
    // S = −3 × 1,6 (el tope) y −6 × 1,6; M = −2 y −4.
    expect(r.max).toBeCloseTo(-6.8, 5);
    expect(r.vol).toBeCloseTo(-13.6, 5);
    expect(r.categoria).toEqual({ max: 'menos', vol: 'menos' });
    expect(r.motivos[0]).toEqual({ que: 'durmioPoco', minutos: 350 });
  });

  it('el sueño: nada desde una hora menos de lo que necesitás; después, por tramos', () => {
    const con = (dormido: number) => porElSueno({ ...NORMAL, horaHabitual: 13 * 60, sueno: { ...NORMAL.sueno!, dormido } });
    // A las 13, sin tarde ni mañana; piernas: ×1,2.
    expect(con(420)).toEqual({ max: 0, vol: 0 });
    expect(con(400).max).toBeCloseTo(-1.2, 5);
    expect(con(330).vol).toBeCloseTo(-7.2, 5);
    expect(con(240).max).toBeCloseTo(-4.8, 5);
    // El tren superior de mañana pesa mucho menos: ×0,6 × 0,6.
    expect(porElSueno({ ...NORMAL, tren: 'superior', multiarticular: false, horaHabitual: 8 * 60, sueno: { ...NORMAL.sueno!, dormido: 330 } }).max).toBeCloseTo(-1.08, 5);
  });

  it('las noches seguidas tocan los multiarticulares; se toma lo peor, no se suma', () => {
    const cortas = { ...NORMAL, ultimas3: [350, 340, 470] };
    expect(porLasNoches(cortas)).toEqual({ max: -2, vol: -3 });
    expect(porLasNoches({ ...cortas, multiarticular: false })).toEqual({ max: 0, vol: -2 });
    expect(porLasNoches({ ...NORMAL, deuda: 8 * 60 })).toEqual({ max: -1, vol: -1 });
    const r = rendimientoEsperado({ ...cortas, sueno: { ...NORMAL.sueno!, dormido: 350 } });
    // Anoche: S = −3 × 1,2 × 1,6 → tope 1,6: −4,8 / −9,6, peor que D: queda S.
    expect(r.partes.sueno).toEqual({ max: expect.closeTo(-4.8, 5), vol: expect.closeTo(-9.6, 5) });
  });

  it('la comida toca las repeticiones; la fuerza máxima, solo si bajás rápido', () => {
    expect(porLaComida({ ...NORMAL.comida, ayuno8h: true })).toEqual({ max: 0, vol: -5 });
    expect(porLaComida({ ...NORMAL.comida, ayuno8h: true, sesionLarga: false })).toEqual({ max: 0, vol: -2 });
    expect(porLaComida({ ...NORMAL.comida, carbosAyerPorKilo: 2, mismosMusculosAyer: true })).toEqual({ max: 0, vol: -3 });
    expect(porLaComida({ ...NORMAL.comida, bajaSemanal: 1.3, semanasBajando: 3 })).toEqual({ max: -1, vol: -2 });
    expect(porLaComida({ ...NORMAL.comida, kcalAyer: 0.7 })).toEqual({ max: 0, vol: -1 });
  });

  it('la descarga suma a la fuerza máxima; dejar el ejercicio más de una semana resta', () => {
    expect(porLaDescarga({ diasSinSeriesDuras: 4, seriesSemanaSobreMes: 0.55, intensidadMantenida: true, diasSinElEjercicio: 4 })).toEqual({ max: 2, vol: 0 });
    expect(porLaDescarga({ diasSinSeriesDuras: 4, seriesSemanaSobreMes: 0.55, intensidadMantenida: false, diasSinElEjercicio: 4 })).toEqual({ max: 0, vol: 0 });
    expect(porLaDescarga({ diasSinSeriesDuras: 10, seriesSemanaSobreMes: 0.2, intensidadMantenida: true, diasSinElEjercicio: 10 })).toEqual({ max: -1, vol: -2 });
  });

  it('un día común es normal, entre −15 y +4, y sin reloj el margen crece', () => {
    const r = rendimientoEsperado(NORMAL);
    expect(r).toMatchObject({ max: 0, vol: 0, sigma: 3.3, categoria: { max: 'normal', vol: 'normal' }, motivos: [] });
    expect(rendimientoEsperado({ ...NORMAL, sueno: { ...NORMAL.sueno!, sinReloj: true } }).sigma).toBeCloseTo(4.125, 5);
    expect(rendimientoEsperado({ ...NORMAL, entrenado: false }).sigma).toBe(5.5);
    expect(rendimientoEsperado({ ...NORMAL, residual: 40, comida: { ...NORMAL.comida, ayuno8h: true } }).vol).toBe(-15);
    expect([categoriaDe(2), categoriaDe(0), categoriaDe(-3), categoriaDe(-6)]).toEqual(['mejor', 'normal', 'algoMenos', 'menos']);
  });
});

describe('buen día para intentar marca', () => {
  const base = {
    marca: 100, mejorReciente: 98, marcaEn8Semanas: false, recuperado: true, dormido: 460, despertoAntes: false, ultimas3: [460, 450, 470],
    seriesSemanaSobreMes: 0.8, ayunoSesionLarga: false, bajandoRapido: false, deltaMax: 0, sigma: 3.3,
  };

  it('los números de la especificación: a 2 % de la marca, 27 % un día normal, 6 % después de dormir poco y 50 % después de una descarga', () => {
    expect(normalAcumulada(0)).toBeCloseTo(0.5, 6);
    expect(normalAcumulada(1.96)).toBeCloseTo(0.975, 3);
    const p = (deltaMax: number) => buenDiaParaMarca({ ...base, mejorReciente: 100 / 1.02, deltaMax }).probabilidad;
    expect(Math.round(p(0) * 100)).toBe(27);
    expect(Math.round(p(-3) * 100)).toBe(6);
    expect(Math.round(p(2) * 100)).toBe(50);
  });

  it('se avisa solo con las cinco condiciones y desde 35 %', () => {
    const despues = buenDiaParaMarca({ ...base, mejorReciente: 100 / 1.02, deltaMax: 2 });
    expect(despues).toMatchObject({ aplica: true, condiciones: { cerca: true, recuperado: true, sueno: true, sinPico: true, comida: true } });
    expect(buenDiaParaMarca({ ...base, mejorReciente: 100 / 1.02, deltaMax: 2, recuperado: false }).aplica).toBe(false);
    expect(buenDiaParaMarca({ ...base, mejorReciente: 100 / 1.02, deltaMax: 2, dormido: 350 }).condiciones.sueno).toBe(false);
    expect(buenDiaParaMarca({ ...base, mejorReciente: 100 / 1.02, deltaMax: 2, seriesSemanaSobreMes: 1.3 }).condiciones.sinPico).toBe(false);
    // Lejos de la marca (a más de 4 %), no.
    expect(buenDiaParaMarca({ ...base, mejorReciente: 90, deltaMax: 2 }).condiciones.cerca).toBe(false);
    // Sin repeticiones para estimar, alcanza con una marca en las últimas 8 semanas.
    expect(buenDiaParaMarca({ ...base, mejorReciente: null, marcaEn8Semanas: true, deltaMax: 2 }).condiciones.cerca).toBe(true);
  });

  it('la versión tuya: los días parecidos contra la regla, que pesa como 6; entre 10 y 70 % hasta tener seguridad alta', () => {
    expect(seguridadDeMarcas({ marcas: 2, sesiones: 30, semanas: 10, leGanaALaGeneral: false })).toBe('aprendiendo');
    expect(seguridadDeMarcas({ marcas: 5, sesiones: 30, semanas: 10, leGanaALaGeneral: false })).toBe('baja');
    expect(seguridadDeMarcas({ marcas: 9, sesiones: 40, semanas: 9, leGanaALaGeneral: false })).toBe('media');
    expect(seguridadDeMarcas({ marcas: 16, sesiones: 60, semanas: 14, leGanaALaGeneral: true })).toBe('alta');
    // 5 marcas en los 8 días más parecidos y la regla en 27 %: (6 × 0,27 + 5) / 14.
    const t = probabilidadTuya(0.27, 5, 8, 'media');
    expect(t.p).toBeCloseTo((6 * 0.27 + 5) / 14, 5);
    expect(t.intervalo[0]).toBeLessThan(t.p);
    expect(probabilidadTuya(0.9, 8, 8, 'baja').p).toBe(0.7);
    expect(sigmaTuyo([], true)).toBe(3.3);
    // 10 sesiones con 5 % de desvío: a mitad de camino (en varianza) de 3,3.
    expect(sigmaTuyo(Array(10).fill(5), true)).toBeCloseTo(Math.sqrt((250 + 108.9) / 20), 5);
  });
});


// ------------------------------------------------------------ la fuerza: la tendencia de cada ejercicio (5/11/2026)

/** Un azar con semilla (mulberry32): las mismas series simuladas cada vez. */
function azar(semilla: number) {
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Una normal con Box-Muller. */
const normal = (r: () => number) => Math.sqrt(-2 * Math.log(r() || 1e-12)) * Math.cos(2 * Math.PI * r());

/** 12 semanas, una sesión por semana: lo que sube de verdad (% por semana) y el ruido de cada día (%). */
function simular(r: () => number, porSemana: number, ruido: number, semanas = 12): PuntoDeFuerza[] {
  return Array.from({ length: semanas }, (_, w) => ({ t: w, e1rm: 100 * (1 + (porSemana / 100) * w) * (1 + (ruido / 100) * normal(r)) }));
}
const veces = (porSemana: number, estado: string, n = 2000) => {
  const r = azar(20261105);
  let k = 0;
  for (let i = 0; i < n; i++) if (tendenciaDeFuerza(simular(r, porSemana, 3.3), { hoy: 11, entrenado: true }).estado === estado) k++;
  return k / n;
};

describe('la tendencia de la fuerza, con su rango', () => {
  it('con +0,5 % por semana, ruido de 3,3 % y una sesión por semana: «sin subida clara» menos del 5 % de las veces', () => {
    expect(veces(0.5, 'sinSubidaClara')).toBeLessThan(0.05);
  });

  it('sin progreso, «sube» alrededor del 12 % (un rango del 80 %, de un solo lado, con 10 grados de libertad)', () => {
    expect(veces(0, 'sube')).toBeLessThanOrEqual(0.13);
  });

  it('si sube un 1 % por mes, la regla de 3 semanas decía «estancado» el 63 % de las veces; la tendencia dice «sin subida clara» mucho menos', () => {
    expect(veces(0.25, 'sinSubidaClara')).toBeLessThan(0.25);
  });

  it('con menos de 6 sesiones, o menos de 6 semanas de la primera a la última, todavía no se sabe', () => {
    const cinco = [0, 2, 4, 6, 8].map((t) => ({ t, e1rm: 100 + t }));
    expect(tendenciaDeFuerza(cinco, { hoy: 8, entrenado: true })).toMatchObject({ estado: 'noSeSabe', sesiones: 5, porMes: null, rango: null });
    const juntas = [0, 0.5, 1, 1.5, 2, 2.5, 3].map((t) => ({ t, e1rm: 100 + 3 * t }));
    expect(tendenciaDeFuerza(juntas, { hoy: 3, entrenado: true }).estado).toBe('noSeSabe');
    // Con 3 o más hay nivel, aunque no se sepa si sube.
    expect(tendenciaDeFuerza(cinco, { hoy: 8, entrenado: true }).nivel).toBeGreaterThan(100);
  });

  it('una subida clara: lo dice por mes, con su rango; lo de antes de las 12 semanas no cuenta', () => {
    const puntos = Array.from({ length: 12 }, (_, w) => ({ t: w, e1rm: 100 * Math.exp(0.004 * w) * (1 + (w % 2 ? 0.01 : -0.01)) }));
    const t = tendenciaDeFuerza([{ t: -20, e1rm: 300 }, ...puntos], { hoy: 11, entrenado: true });
    expect(t.estado).toBe('sube');
    expect(t.sesiones).toBe(12);
    expect(t.porMes!).toBeCloseTo((Math.exp(4.35 * 0.004) - 1) * 100, 0);
    expect(t.rango![0]).toBeGreaterThan(0);
    expect(t.rango![0]).toBeLessThan(t.porMes!);
    expect(t.rango![1]).toBeGreaterThan(t.porMes!);
  });

  it('plana: sin subida clara, con tu ruido acercado al de los estudios', () => {
    const plana = Array.from({ length: 12 }, (_, w) => ({ t: w, e1rm: 100 * (1 + (w % 2 ? 0.01 : -0.01)) }));
    const t = tendenciaDeFuerza(plana, { hoy: 11, entrenado: true });
    expect(t.estado).toBe('sinSubidaClara');
    // 12 sesiones con un 1 % de desvío: entre el 1 % y el 3,3 % de los estudios.
    expect(t.sigma).toBeGreaterThan(1);
    expect(t.sigma).toBeLessThan(3.3);
    expect(tendenciaDeFuerza(plana, { hoy: 11, entrenado: false }).sigma).toBeGreaterThan(t.sigma);
  });

  it('la recta en un momento, con su rango, para dibujarla; y el 1RM estimado, de a 2,5 kg', () => {
    const t = tendenciaDeFuerza(Array.from({ length: 10 }, (_, w) => ({ t: w, e1rm: 120 + w * (w % 2 ? 1.2 : 0.8) })), { hoy: 9, entrenado: true });
    const a = nivelEn(t.ajuste!, 9);
    expect(a.nivel).toBeCloseTo(t.nivel!, 6);
    expect(a.abajo).toBeLessThan(a.nivel);
    expect(a.arriba).toBeGreaterThan(a.nivel);
    expect([aDosYMedio(121.2), aDosYMedio(123.8), aDosYMedio(125)]).toEqual([120, 125, 125]);
  });
});

describe('la marca, sin probabilidad', () => {
  it('cerca de la marca si tu nivel de hoy está a menos de tu ruido: con 3,3 %, 2,5 % es cerca y 5 % no', () => {
    expect(cercaDeLaMarca({ marca: 102.5, nivel: 100, sigma: 3.3 }).cerca).toBe(true);
    expect(cercaDeLaMarca({ marca: 105.2, nivel: 100, sigma: 3.3 }).cerca).toBe(false);
    expect(cercaDeLaMarca({ marca: 100, nivel: 101, sigma: 3.3 })).toMatchObject({ cerca: true });
    expect(cercaDeLaMarca({ marca: 100, nivel: null, sigma: 3.3 })).toEqual({ cerca: false, distancia: null });
  });

  it('lo que acompaña: más de 6 h sin despertarte antes, los músculos descansados y una semana como siempre', () => {
    const bien = { noche: { dormido: 470, necesidad: 480, despertoAntes: null }, ultimas3: [470, 460, 455], musculos: 'recuperado' as const, seriesSemanaSobreMes: 0.9 };
    expect(condicionesDeLaMarca(bien)).toEqual({ sueno: true, musculos: true, semana: true });
    expect(condicionesDeLaMarca({ ...bien, noche: { dormido: 470, necesidad: 480, despertoAntes: 70 } }).sueno).toBe(false);
    expect(condicionesDeLaMarca({ ...bien, ultimas3: [470, 340, 350] }).sueno).toBe(false);
    expect(condicionesDeLaMarca({ ...bien, musculos: 'recuperandose' }).musculos).toBe(false);
    expect(condicionesDeLaMarca({ ...bien, seriesSemanaSobreMes: 1.3 }).semana).toBe(false);
    expect(condicionesDeLaMarca({ ...bien, noche: null }).sueno).toBe(false);
  });

  it('cada cuánto haces marca, en tus últimas 20 sesiones con el ejercicio', () => {
    const sesiones = Array.from({ length: 25 }, (_, i) => `2026-${String(1 + Math.floor(i / 4)).padStart(2, '0')}-${String(1 + (i % 4) * 7).padStart(2, '0')}`);
    const marcas = [sesiones[2], sesiones[10], sesiones[18], sesiones[24]];
    expect(frecuenciaDeMarcas(sesiones, marcas)).toEqual({ marcas: 3, de: 20 });
    expect(frecuenciaDeMarcas(sesiones.slice(0, 6), marcas)).toEqual({ marcas: 1, de: 6 });
  });
});
