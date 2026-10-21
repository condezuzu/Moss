import { describe, expect, it } from '@jest/globals';

import { claveDelDia, diaDeLaSemana, diasEntre, lunesDe, partesDe, sumarDias } from './fechas';

describe('el día local', () => {
  it('un mismo instante cae en días distintos según la zona', () => {
    // 22:30 del 21 en Montevideo (UTC−3) y 03:30 del 22 en Madrid (UTC+2).
    const instante = new Date('2026-10-22T01:30:00Z');
    expect(claveDelDia(instante, 'America/Montevideo')).toBe('2026-10-21');
    expect(claveDelDia(instante, 'Europe/Madrid')).toBe('2026-10-22');
  });

  it('si viajás, el día corta en tu hora y lo anotado queda donde se anotó', () => {
    // A las 23:00 en Montevideo es el 21; al llegar a Madrid, al mediodía, ya es el 22 allá.
    expect(claveDelDia(new Date('2026-10-22T02:00:00Z'), 'America/Montevideo')).toBe('2026-10-21');
    expect(claveDelDia(new Date('2026-10-22T12:00:00Z'), 'Europe/Madrid')).toBe('2026-10-22');
  });
});

describe('cuentas con días', () => {
  it('el 21 de octubre de 2026 es miércoles', () => {
    expect(diaDeLaSemana('2026-10-21')).toBe(3);
    expect(partesDe('2026-10-21')).toEqual({ anio: 2026, mes: 9, dia: 21, diaSemana: 3 });
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('cuenta los días entre dos fechas, sin que la cambie el horario de verano', () => {
    expect(diasEntre('2026-10-19', '2026-10-26')).toBe(7);
    expect(diasEntre('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('la semana empieza el lunes', () => {
    expect(lunesDe('2026-10-21')).toBe('2026-10-19');
    expect(lunesDe('2026-10-19')).toBe('2026-10-19');
    expect(lunesDe('2026-10-25')).toBe('2026-10-19');
  });
});
