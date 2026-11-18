import { describe, expect, it } from '@jest/globals';

import { sumarDias } from './fechas';
import { MINIMO_DE_NOCHES, periodoDeMelatonina, seVeElPeriodo } from './melatonina';
import { MARGEN } from './sinReloj';

const HOY = '2026-11-17';
/** Una hora en la cuenta de las noches, desde las 18 del día anterior: las 23:30 son 330. */
const n = (texto: string) => {
  const [h, m] = texto.split(':').map(Number);
  return (h * 60 + m + 6 * 60) % (24 * 60);
};
/** Las noches de los últimos días, de la más vieja a la de hoy: cada una, de cuándo a cuándo. */
const noches = (horas: [string, string][], hasta = HOY) =>
  horas.map(([dormirse, despertar], i) => ({ clave: sumarDias(hasta, i - horas.length + 1), dormirse: n(dormirse), despertar: n(despertar) }));
const siempre = (cuantas: number, dormirse = '23:30', despertar = '7:30') => noches(Array.from({ length: cuantas }, () => [dormirse, despertar] as [string, string]));

describe('periodoDeMelatonina', () => {
  it('quien duerme de 23:30 a 7:30 lo tiene de 23:00 a 0:00, y la melatonina empieza a subir a las 21:00', () => {
    const p = periodoDeMelatonina(siempre(7), HOY);
    expect(p).toMatchObject({ inicio: n('21:00'), desde: n('23:00'), hasta: n('0:00'), noches: 7 });
  });

  it('con horarios iguales, no se corrió desde ayer', () => {
    expect(periodoDeMelatonina(siempre(8), HOY)?.corrido).toBe(0);
  });

  it('hacen falta 3 noches de los últimos 7 días', () => {
    expect(MINIMO_DE_NOCHES).toBe(3);
    expect(periodoDeMelatonina(siempre(2), HOY)).toBeNull();
    expect(periodoDeMelatonina(siempre(3), HOY)?.noches).toBe(3);
    // Tres noches de hace más de una semana no alcanzan.
    expect(periodoDeMelatonina(noches([['23:30', '7:30'], ['23:30', '7:30'], ['23:30', '7:30']], sumarDias(HOY, -7)), HOY)).toBeNull();
    expect(periodoDeMelatonina([], HOY)).toBeNull();
  });

  it('solo entran las noches de los últimos 7 días', () => {
    // Las tres más viejas, de madrugada, no cuentan: el periodo es el de las siete de siempre.
    const lista = noches([['3:00', '11:00'], ['3:00', '11:00'], ['3:00', '11:00'], ...Array.from({ length: 7 }, () => ['23:30', '7:30'] as [string, string])]);
    expect(periodoDeMelatonina(lista, HOY)?.desde).toBe(n('23:00'));
  });

  it('una noche estimada con poca confianza en el horario no entra', () => {
    const lista = siempre(7).map((x, i) => (i === 6 ? { ...x, dormirse: n('3:00'), despertar: n('11:00'), confianza: { horario: 'baja' as const } } : { ...x, confianza: { horario: 'media' as const } }));
    expect(periodoDeMelatonina(lista, HOY)).toMatchObject({ desde: n('23:00'), noches: 6 });
  });

  it('dos noches 2 h más tarde lo atrasan 34 min (Yang 2001 midió 32)', () => {
    const tarde = noches([['23:30', '7:30'], ['23:30', '7:30'], ['23:30', '7:30'], ['23:30', '7:30'], ['23:30', '7:30'], ['1:30', '9:30'], ['1:30', '9:30']]);
    expect(periodoDeMelatonina(tarde, HOY)?.desde).toBe(n('23:00') + 34);
  });

  it('dice cuánto se corrió desde ayer: más tarde con una noche tarde y antes al volver a lo de siempre', () => {
    const base = Array.from({ length: 7 }, () => ['23:30', '7:30'] as [string, string]);
    // Anoche, una hora más tarde: el punto medio de la semana se atrasa 60 / 7.
    expect(periodoDeMelatonina(noches([...base, ['0:30', '8:30']]), HOY)?.corrido).toBe(9);
    // La noche tarde fue la de hace una semana y ya salió de la cuenta: 9 min antes.
    expect(periodoDeMelatonina(noches([['0:30', '8:30'], ...base]), HOY)?.corrido).toBe(-9);
  });

  it('sin periodo ayer, no dice cuánto se corrió', () => {
    expect(periodoDeMelatonina(siempre(3), HOY)).toMatchObject({ noches: 3, corrido: null });
  });

  it('sin la noche de hoy, sale de las que hay', () => {
    const sinHoy = siempre(7).slice(0, 6);
    expect(periodoDeMelatonina(sinHoy, HOY)).toMatchObject({ desde: n('23:00'), noches: 6 });
  });

  it('recomienda acostarte al comienzo menos tu margen para dormirte, de a 5 minutos', () => {
    expect(MARGEN).toBe(15);
    expect(periodoDeMelatonina(siempre(7), HOY)?.acostarse).toBe(n('22:45'));
    expect(periodoDeMelatonina(siempre(7), HOY, { margen: 30 })?.acostarse).toBe(n('22:30'));
    expect(periodoDeMelatonina(siempre(7), HOY, { margen: null })?.acostarse).toBe(n('22:45'));
    // El periodo va al minuto y la hora de acostarte, redondeada: de 0:28 sale 0:15.
    expect(periodoDeMelatonina(siempre(7, '0:58', '8:58'), HOY)).toMatchObject({ desde: n('0:28'), hasta: n('1:28'), acostarse: n('0:15') });
  });

  it('con deuda recomienda lo mismo, el comienzo del periodo y no antes', () => {
    const sin = periodoDeMelatonina(siempre(7), HOY, { deuda: 0 });
    const con = periodoDeMelatonina(siempre(7), HOY, { deuda: 4 * 60 });
    expect(sin?.conDeuda).toBe(false);
    expect(con?.conDeuda).toBe(true);
    expect(con?.acostarse).toBe(sin?.acostarse);
    // Menos de un cuarto de hora no es deuda, como en Sueño.
    expect(periodoDeMelatonina(siempre(7), HOY, { deuda: 10 })?.conDeuda).toBe(false);
    expect(periodoDeMelatonina(siempre(7), HOY, { deuda: null })?.conDeuda).toBe(false);
  });
});

describe('seVeElPeriodo', () => {
  const a = (hora: string, dia = '2026-11-18') => new Date(`${dia}T${hora}:00`);
  const CORTE = 4 * 60;
  it('de noche: desde las 19 hasta el corte del día de Moss; de día, no', () => {
    expect([a('18:59'), a('19:00'), a('23:30'), a('00:10'), a('03:59'), a('04:00'), a('12:00')].map((x) => seVeElPeriodo(x, CORTE, []))).toEqual([false, true, true, true, true, false, false]);
    // Con el corte a medianoche, se va a las 0.
    expect(seVeElPeriodo(a('00:10'), 0, [])).toBe(false);
  });
  it('de madrugada se va cuando te despiertas: la noche que termina hoy ya está y su despertar pasó', () => {
    // Despierto a las 2:40 (520 desde las 18): a las 3 ya no se ve; la noche de ayer no cuenta.
    const desperto = [{ clave: '2026-11-18', despertar: 520 }];
    expect(seVeElPeriodo(a('03:00'), CORTE, desperto)).toBe(false);
    expect(seVeElPeriodo(a('02:30'), CORTE, desperto)).toBe(true);
    expect(seVeElPeriodo(a('03:00'), CORTE, [{ clave: '2026-11-17', despertar: 520 }])).toBe(true);
  });
});
