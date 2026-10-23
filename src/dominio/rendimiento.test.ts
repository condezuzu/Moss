import { describe, expect, it } from '@jest/globals';

import {
  caidaInicial, dosisDeLaSesion, e1rm, esfuerzoDeSerie, estadoDe, listoEn, mejorE1rm, musculosDe, residual, type SesionConBloques,
} from './musculos';
import {
  buenDiaParaMarca, categoriaDe, normalAcumulada, porElSueno, porLaComida, porLaDescarga, porLasNoches, probabilidadTuya, rendimientoEsperado, seguridadDeMarcas, sigmaTuyo,
  type EntradasDelRendimiento,
} from './rendimiento';

const HORA = 3_600_000;
const T0 = Date.parse('2026-10-19T21:00:00Z');

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

describe('por músculo', () => {
  const sesion = (horasAntes: number, bloques: SesionConBloques['bloques']): SesionConBloques => ({ inicio: T0 - horasAntes * HORA, bloques });
  const sentadilla = (series: number, alFallo = false) => ({ ejercicio: 'Sentadilla', series: Array.from({ length: series }, () => ({ peso: 100, reps: null })), alFallo });

  it('el ejercicio y sus músculos: el nombre más largo primero, y si no, el grupo de Ascent', () => {
    expect(musculosDe('Peso muerto rumano')!.principal).toEqual(['isquios', 'gluteos']);
    expect(musculosDe('Peso muerto')!.principal).toEqual(['isquios', 'gluteos', 'espaldaBaja']);
    expect(musculosDe('Curl femoral')!.principal).toEqual(['isquios']);
    expect(musculosDe('Curl de bíceps')!.principal).toEqual(['biceps']);
    expect(musculosDe('Bench press')!.ayudan).toEqual(['triceps', 'hombros']);
    expect(musculosDe('Máquina rara', 'piernas')!.principal).toEqual(['cuadriceps', 'gluteos', 'isquios']);
    expect(musculosDe('Bici', 'cardio')).toBeNull();
  });

  it('lo que cae y cómo se recupera, contra los estudios: 6 series de sentadilla, recuperado a las 72 horas', () => {
    expect(caidaInicial(6)).toBeCloseTo(15.83, 2);
    const seis = [sesion(0, [sentadilla(6)])];
    const a = (h: number) => residual('cuadriceps', seis, T0 + h * HORA);
    expect([a(24), a(48), a(72)].map((x) => Math.round(x * 10) / 10)).toEqual([8.1, 4.2, 2.1]);
    expect(estadoDe(a(24))).toBe('recuperandose');
    expect(estadoDe(a(72))).toBe('recuperado');
    // Con una serie al fallo tarda más: 4,2 % a las 72 horas.
    expect(Math.round(residual('cuadriceps', [sesion(0, [sentadilla(6, true)])], T0 + 72 * HORA) * 10) / 10).toBe(4.2);
    // El press de banca: 4,2 % a las 24 horas y 1,1 % a las 48.
    const banca = [sesion(0, [{ ejercicio: 'Press banca', series: Array.from({ length: 6 }, () => ({ peso: 80, reps: null })) }])];
    expect([24, 48].map((h) => Math.round(residual('pecho', banca, T0 + h * HORA) * 10) / 10)).toEqual([4.2, 1.1]);
    // El que ayuda carga la mitad de la dosis.
    expect(residual('triceps', banca, T0 + 24 * HORA)).toBeLessThan(residual('pecho', banca, T0 + 24 * HORA));
    expect(listoEn('cuadriceps', seis, T0 + 24 * HORA)).toBe(36);
  });

  it('con repeticiones, las series lejos del fallo cuentan menos y la entrada en calor no cuenta', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 2);
    expect(e1rm(60, 15)).toBeNull();
    const unoRM = 120;
    expect(esfuerzoDeSerie({ peso: 100, reps: 5 }, unoRM)).toBe(1);
    expect(esfuerzoDeSerie({ peso: 80, reps: 8 }, unoRM)).toBe(0.3);
    expect(esfuerzoDeSerie({ peso: 50, reps: 10 }, unoRM)).toBe(0);
    const s: SesionConBloques = { inicio: T0, bloques: [{ ejercicio: 'Sentadilla', series: [{ peso: 50, reps: 10 }, { peso: 100, reps: 5 }, { peso: 100, reps: 5 }] }] };
    expect(dosisDeLaSesion(s, () => unoRM).get('cuadriceps')).toEqual({ dosis: 2, series: 2, alFallo: false });
    expect(mejorE1rm([s], 'sentadilla')).toBeCloseTo(116.67, 2);
  });
});
