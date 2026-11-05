import { describe, expect, it } from '@jest/globals';

import { DIAS_ANOTADOS, energiaDeEstosDias, energiaDelDia, enLaBarra, franjasDeLaBarra, masaMagraEstimada, type DiaDeEnergia, type EntradaDeEnergia } from './energia';
import { sumarDias } from './fechas';

const HOY = '2026-11-05';
// Una mujer de 60 kg con 25 % de grasa: 45 kg de masa magra.
const ELLA: Omit<EntradaDeEnergia, 'dias'> = { hoy: HOY, sexo: 'f', objetivo: 'mantener', pesoKg: 60, alturaCm: 165, grasaPct: 25 };
/** `n` días bien anotados hacia atrás, cada uno con lo que queda por kg de masa magra (45 kg). */
const dias = (n: number, porKg: number, entreno = 400, anotadas = 3): DiaDeEnergia[] =>
  Array.from({ length: n }, (_, i) => ({ dia: sumarDias(HOY, -(i + 1)), kcal: porKg * 45 + entreno, entreno, anotadas }));

describe('la energía de estos días', () => {
  it('debajo de 30 kcal por kg de masa magra es baja; de 45 en adelante, alta; en el medio, suficiente', () => {
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 29.9) })?.estado).toBe('baja');
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 30) })?.estado).toBe('suficiente');
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 44.9) })?.estado).toBe('suficiente');
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 45) })?.estado).toBe('alta');
  });

  it('en hombres, la baja es debajo de 25', () => {
    const el: Omit<EntradaDeEnergia, 'dias'> = { ...ELLA, sexo: 'm' };
    expect(energiaDeEstosDias({ ...el, dias: dias(7, 26) })?.estado).toBe('suficiente');
    expect(energiaDeEstosDias({ ...el, dias: dias(7, 24.9) })?.estado).toBe('baja');
  });

  it('lo de entrenar se resta de lo comido, y dice cuánto en promedio', () => {
    const e = energiaDeEstosDias({ ...ELLA, dias: dias(5, 35, 600) })!;
    expect(e.disponible).toBeCloseTo(35, 6);
    expect(e).toMatchObject({ porQue: 'anotado', dias: 5, entreno: 600, kcal: 35 * 45 + 600 });
  });

  it('solo cuentan los 7 días de antes de hoy con las comidas de siempre, y hacen falta 4', () => {
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(DIAS_ANOTADOS - 1, 35) })).toBeNull();
    // Días con una sola comida anotada no cuentan: falta anotar, no falta comer.
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 20, 400, 1) })).toBeNull();
    // Con 5 comidas de siempre, hacen falta 4 anotadas.
    expect(energiaDeEstosDias({ ...ELLA, comidasDeSiempre: 5, dias: dias(7, 20, 400, 3) })).toBeNull();
    // Hoy y lo de hace más de una semana no cuentan.
    const viejos = dias(7, 20).map((d) => ({ ...d, dia: sumarDias(d.dia, -7) }));
    expect(energiaDeEstosDias({ ...ELLA, dias: [...viejos, { dia: HOY, kcal: 500, entreno: 0, anotadas: 3 }] })).toBeNull();
  });

  it('una señal del peso de dos semanas la pone baja aunque no haya nada anotado', () => {
    expect(energiaDeEstosDias({ ...ELLA, dias: [], senal: 'tendencia' })).toMatchObject({ estado: 'baja', porQue: 'tendencia', disponible: null });
    expect(energiaDeEstosDias({ ...ELLA, dias: dias(7, 50), senal: 'bajaRapida' })?.estado).toBe('baja');
  });

  it('dice si hoy entrena y si está bajando', () => {
    expect(energiaDeEstosDias({ ...ELLA, objetivo: 'bajar', entrenaHoy: true, dias: dias(7, 50) })).toMatchObject({ estado: 'alta', entrenaHoy: true, bajando: true });
  });

  it('la masa magra: con la grasa, el peso sin ella; sin la grasa, Janmahasatian con la altura', () => {
    expect(masaMagraEstimada({ sexo: 'f', pesoKg: 60, alturaCm: 165, grasaPct: 25 })).toBeCloseTo(45, 6);
    // Un hombre de 80 kg y 1,80 m: IMC 24,7 y 9.270 × 80 / (6.680 + 216 × 24,7) ≈ 61,7 kg de masa magra.
    expect(masaMagraEstimada({ sexo: 'm', pesoKg: 80, alturaCm: 180, grasaPct: null })).toBeCloseTo(61.7, 1);
    // Una mujer de 60 kg y 1,65 m: IMC 22 y 9.270 × 60 / (8.780 + 244 × 22) ≈ 39,3 kg.
    expect(masaMagraEstimada({ sexo: 'f', pesoKg: 60, alturaCm: 165 })).toBeCloseTo(39.3, 1);
  });

  it('la barra va de 15 a 60, con la suficiente desde el piso de cada uno y la alta desde 45', () => {
    expect(enLaBarra(15)).toBe(0);
    expect(enLaBarra(60)).toBe(1);
    expect(enLaBarra(80)).toBe(1);
    expect(franjasDeLaBarra('f')).toEqual({ suficiente: 1 / 3, alta: 2 / 3 });
  });
});

describe('la energía del día: el sueño, la comida y, con Ascent, los músculos', () => {
  const bien = { anoche: 'normal', seguidas: false, deuda: 'bien' } as const;
  // Siete días con lo que queda por kg de masa magra y la meta de cada día: comer lo de la meta es llegar.
  const conMeta = (porKg: number, parte = 1) => energiaDeEstosDias({ ...ELLA, dias: dias(7, porKg).map((d) => ({ ...d, meta: d.kcal / parte })) });
  const llegaste = conMeta(35);

  it('baja si una parte está baja: la noche corta, dos cortas de tres o la comida', () => {
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: { ...bien, anoche: 'corta' } })).toMatchObject({ estado: 'baja', limita: ['sueno'] });
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: { ...bien, seguidas: true } })?.sueno).toEqual({ parte: 'baja', como: 'seguidas' });
    expect(energiaDelDia({ deEstosDias: conMeta(20), sueno: bien })).toMatchObject({ estado: 'baja', comida: { parte: 'baja', como: 'muyPoco' }, limita: ['comida'] });
  });

  it('alta si el sueño y la comida están bien; con los músculos cargados, suficiente', () => {
    expect(llegaste?.llegaste).toBe(true);
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: bien })).toMatchObject({ estado: 'alta', limita: [], comida: { parte: 'bien', como: 'llegaste' } });
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: bien, musculos: 'cargados' })).toMatchObject({ estado: 'suficiente', limita: ['musculos'] });
  });

  it('la deuda sola no la baja: con una noche normal, suficiente', () => {
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: { ...bien, deuda: 'alta' } })).toMatchObject({ estado: 'suficiente', sueno: { parte: 'justa', como: 'deuda' }, limita: ['sueno'] });
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: { ...bien, anoche: 'algoCorta' } })?.sueno).toEqual({ parte: 'justa', como: 'algoCorta' });
  });

  it('sin llegar a tus calorías (el 90 %), justa; comer de sobra para lo que entrenas, bien', () => {
    const debajo = conMeta(35, 0.8);
    expect(debajo?.llegaste).toBe(false);
    expect(energiaDelDia({ deEstosDias: debajo, sueno: bien })).toMatchObject({ estado: 'suficiente', comida: { parte: 'justa', como: 'debajo' } });
    expect(energiaDelDia({ deEstosDias: conMeta(50, 0.8), sueno: bien })).toMatchObject({ estado: 'alta', comida: { como: 'deSobra' } });
  });

  it('con una sola parte, nunca alta; sin ninguna, null', () => {
    expect(energiaDelDia({ deEstosDias: llegaste, sueno: null })?.estado).toBe('suficiente');
    expect(energiaDelDia({ deEstosDias: null, sueno: bien })?.estado).toBe('suficiente');
    expect(energiaDelDia({ deEstosDias: null, sueno: { anoche: null, seguidas: false, deuda: 'bien' } })).toBeNull();
    expect(energiaDelDia({ deEstosDias: null, sueno: null })).toBeNull();
  });

  it('primero lo que la baja y después lo justo', () => {
    expect(energiaDelDia({ deEstosDias: conMeta(35, 0.8), sueno: { ...bien, anoche: 'muyCorta' }, musculos: 'cargados' })?.limita).toEqual(['sueno', 'comida', 'musculos']);
  });
});
