import { describe, expect, it } from '@jest/globals';

import { curvaDelDia, DIAS_ANOTADOS, energiaDeAhora, energiaDeEstosDias, energiaDelDia, enLaBarra, hoyParaLaEnergia, momentoDelDia, franjasDeLaBarra, masaMagraEstimada, type DiaDeEnergia, type EntradaDeEnergia } from './energia';
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

describe('la energía de ahora, según la hora', () => {
  const h = (t: string) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  // Se despierta a las 7, se acuesta a las 23 y entrena de 18:40 a 19:55; cuatro comidas, como REPARTO en plan.ts.
  const DIA = { despertar: h('7:00'), cama: h('23:00'), sesion: { inicio: h('18:40'), minutos: 75 } };
  const COMIDAS = [{ hora: h('7:30'), parte: 0.2 }, { hora: h('13:00'), parte: 0.35 }, { hora: h('17:00'), parte: 0.15 }, { hora: h('21:00'), parte: 0.3 }];
  const bien = { anoche: 'normal', seguidas: false, deuda: 'bien' } as const;
  const estosDias = energiaDeEstosDias({ ...ELLA, dias: dias(7, 35).map((d) => ({ ...d, meta: d.kcal })) });
  const ahora = (t: string, comido: number, ultima: string | null = null) =>
    energiaDeAhora({ deEstosDias: estosDias, sueno: bien, ...DIA, ahora: h(t), hoy: { meta: 2600, comido, comidas: COMIDAS, ultima: ultima === null ? null : h(ultima) } });

  it('el momento: antes y después de entrenar primero; recién despierto la primera hora; la noche, 2 h antes de la cama', () => {
    expect(['7:30', '12:00', '15:00', '18:39', '19:55', '21:54', '21:56', '22:30'].map((t) => momentoDelDia({ ...DIA, ahora: h(t) })))
      .toEqual(['recienDespierto', 'dia', 'antesDeEntrenar', 'antesDeEntrenar', 'despuesDeEntrenar', 'despuesDeEntrenar', 'noche', 'noche']);
    // Entrenando temprano, lo de entrenar gana a recién despierto.
    expect(momentoDelDia({ ...DIA, sesion: { inicio: h('8:00'), minutos: 60 }, ahora: h('7:15') })).toBe('antesDeEntrenar');
  });

  it('lo de hoy: antes de que toque la primera comida no se juzga; desde 400 kcal por debajo de lo de esta hora, atrasado', () => {
    const hoy = (t: string, comido: number, momento: 'dia' | 'antesDeEntrenar' = 'dia') => hoyParaLaEnergia({ ahora: h(t), meta: 2600, comido, comidas: COMIDAS, momento });
    expect(hoy('8:00', 0)?.como).toBe('temprano');
    // A las 14:30 tocan el desayuno y el almuerzo: el 55 %, 1.430 kcal.
    expect(hoy('14:30', 1100)).toMatchObject({ como: 'alDia', esperado: 1430, falta: 330 });
    expect(hoy('14:30', 1000)).toMatchObject({ parte: 'justa', como: 'atrasado', falta: 430 });
    expect(hoy('17:15', 600, 'antesDeEntrenar')).toMatchObject({ parte: 'baja', como: 'sinComerParaEntrenar' });
    expect(hoyParaLaEnergia({ ahora: h('14:30'), meta: 0, comido: 0, comidas: COMIDAS, momento: 'dia' })).toBeNull();
  });

  it('a la mañana, lo de hoy no cuenta: con buen sueño y buenos días, alta aunque no hayas comido', () => {
    expect(ahora('7:30', 0)).toMatchObject({ estado: 'alta', momento: 'recienDespierto', hoy: { como: 'temprano' }, notas: ['inercia'] });
  });

  it('a la tarde, atrasado con la comida la frena; antes de entrenar, la baja', () => {
    expect(ahora('14:30', 600)).toMatchObject({ estado: 'suficiente', limita: ['hoy'], notas: ['bajon'] });
    // Lo último, a las 13:20: nada en las 4 h de antes de la sesión de las 18:40.
    expect(ahora('17:15', 600, '13:20')).toMatchObject({ estado: 'baja', limita: ['hoy'], momento: 'antesDeEntrenar', comerAntes: true });
    expect(ahora('17:15', 1500, '15:30')).toMatchObject({ estado: 'alta', comerAntes: false });
    // Al día, pero sin nada en las 4 h de antes de la sesión: que coma algo antes.
    expect(ahora('17:15', 1500, '13:10')).toMatchObject({ estado: 'alta', comerAntes: true });
  });

  it('después de entrenar, la comida de después; a la noche, bajar el ritmo', () => {
    expect(ahora('20:30', 1900, '17:10')).toMatchObject({ momento: 'despuesDeEntrenar', comerDespues: true });
    expect(ahora('20:30', 1900, '20:10')).toMatchObject({ comerDespues: false });
    expect(ahora('22:30', 2500, '21:05')).toMatchObject({ momento: 'noche', notas: ['bajarElRitmo'] });
  });

  it('la comida de estos días baja la energía a cualquier hora, también a la mañana', () => {
    const pocos = energiaDeEstosDias({ ...ELLA, dias: dias(7, 20) });
    expect(energiaDeAhora({ deEstosDias: pocos, sueno: bien, ...DIA, ahora: h('7:30'), hoy: { meta: 2600, comido: 0, comidas: COMIDAS } })).toMatchObject({ estado: 'baja', limita: ['comida'] });
  });
});

describe('la curva del día', () => {
  const h = (t: string) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
  const reloj = (m: number) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
  const tramos = (c: ReturnType<typeof curvaDelDia>) => c.tramos.map((x) => `${x.que} ${reloj(x.desde)}-${reloj(x.hasta)}`);

  it('de 7 a 23: la inercia la primera hora, el mejor momento a media mañana, el bajón de la tarde, el segundo pico y bajar el ritmo', () => {
    expect(tramos(curvaDelDia({ despertar: h('7:00'), cama: h('23:00'), deuda: 'bien' }))).toEqual([
      'inercia 7:00-8:00', 'pico 9:30-12:00', 'bajon 13:30-16:00', 'segundoPico 17:00-20:30', 'bajarElRitmo 21:00-23:00',
    ]);
  });

  it('se corre con la hora de despertarte y de la cama', () => {
    const c = curvaDelDia({ despertar: h('9:00'), cama: h('25:00'), deuda: 'bien' });
    expect(c.tramos.find((x) => x.que === 'bajon')).toMatchObject({ desde: h('15:30'), hasta: h('18:00') });
    expect(c.tramos.find((x) => x.que === 'bajarElRitmo')).toMatchObject({ desde: h('23:00'), hasta: h('25:00') });
  });

  it('la forma: baja al despertar, sube a media mañana, baja a la tarde y vuelve a subir', () => {
    const c = curvaDelDia({ despertar: h('7:00'), cama: h('23:00'), deuda: 'muyBien' });
    const en = (t: string) => c.puntos.find((p) => p.t === h(t))!.nivel;
    expect(en('7:00')).toBeLessThan(en('8:00'));
    expect(en('10:45')).toBeGreaterThan(en('14:45'));
    expect(en('18:45')).toBeGreaterThan(en('14:45'));
    expect(en('23:00')).toBeLessThan(en('21:00'));
  });

  it('con deuda, los picos más bajos y el bajón más hondo', () => {
    const sin = curvaDelDia({ despertar: h('7:00'), cama: h('23:00'), deuda: 'muyBien' });
    const con = curvaDelDia({ despertar: h('7:00'), cama: h('23:00'), deuda: 'alta' });
    const en = (c: typeof sin, t: string) => c.puntos.find((p) => p.t === h(t))!.nivel;
    expect(en(con, '10:45')).toBeLessThan(en(sin, '10:45'));
    // Más hondo comparado con tu mejor momento: el bajón queda más lejos del pico.
    expect(en(con, '14:45') / en(con, '10:45')).toBeLessThan(en(sin, '14:45') / en(sin, '10:45'));
  });

  it('en la energía de ahora, el tramo y lo que se dice: el mejor momento a media mañana', () => {
    const e = energiaDeAhora({
      deEstosDias: null, sueno: { anoche: 'normal', seguidas: false, deuda: 'bien' }, ahora: h('10:30'),
      despertar: h('7:00'), cama: h('23:00'), sesion: null, hoy: null,
    });
    expect(e).toMatchObject({ tramo: 'pico', notas: ['pico'], momento: 'dia' });
  });
});
