import { describe, expect, it } from '@jest/globals';

import { ahorroDelAnual, avisoDePrueba, diasDePrueba, esFundador, estadoDePremium, planDe, PRODUCTOS, tienePremium, type Suscripcion } from './premium';

const DIA = 86_400_000;
const AHORA = Date.parse('2026-12-10T12:00:00Z');
const prueba: Suscripcion = { producto: PRODUCTOS.anual, vence: AHORA + 5 * DIA, prueba: true, renueva: true };
const pagando: Suscripcion = { producto: PRODUCTOS.mensual, vence: AHORA + 20 * DIA, prueba: false, renueva: true };

describe('quién tiene Premium', () => {
  it('sin nada, gratis; con lo que dice Apple, en prueba o activa', () => {
    expect(estadoDePremium({ suscripcion: null, fundador: false })).toBe('gratis');
    expect(estadoDePremium({ suscripcion: prueba, fundador: false })).toBe('prueba');
    expect(estadoDePremium({ suscripcion: pagando, fundador: false })).toBe('activa');
    expect(tienePremium({ suscripcion: null, fundador: false })).toBe(false);
    expect(tienePremium({ suscripcion: pagando, fundador: false })).toBe(true);
  });

  it('quien tenía cuenta antes de que saliera lo tiene de regalo, aunque no pague', () => {
    expect(estadoDePremium({ suscripcion: null, fundador: true })).toBe('fundador');
    expect(tienePremium({ suscripcion: null, fundador: true })).toBe(true);
  });

  it('la cuenta tiene que ser de antes del día en que sale', () => {
    expect(esFundador('2026-11-30T23:59:00Z', '2026-12-01')).toBe(true);
    expect(esFundador('2026-12-01T00:00:00Z', '2026-12-01')).toBe(false);
    expect(esFundador('2027-01-05T10:00:00Z', '2026-12-01')).toBe(false);
    expect(esFundador(null, '2026-12-01')).toBe(false);
    expect(esFundador(undefined, '2026-12-01')).toBe(false);
    expect(esFundador('cualquier cosa', '2026-12-01')).toBe(false);
  });
});

describe('la prueba', () => {
  it('cuenta los días que quedan, con el de hoy', () => {
    expect(diasDePrueba(prueba, AHORA)).toBe(5);
    expect(diasDePrueba({ ...prueba, vence: AHORA + 1 }, AHORA)).toBe(1);
    expect(diasDePrueba({ ...prueba, vence: AHORA - DIA }, AHORA)).toBe(0);
  });

  it('avisa dos días antes de que termine', () => {
    expect(avisoDePrueba(prueba, AHORA)).toBe(AHORA + 3 * DIA);
  });

  it('no avisa si faltan menos de dos días, si se canceló o si no es una prueba', () => {
    expect(avisoDePrueba({ ...prueba, vence: AHORA + DIA }, AHORA)).toBeNull();
    expect(avisoDePrueba({ ...prueba, renueva: false }, AHORA)).toBeNull();
    expect(avisoDePrueba(pagando, AHORA)).toBeNull();
    expect(avisoDePrueba(null, AHORA)).toBeNull();
  });

  it('si no se sabe si renueva, avisa igual: es mejor de más', () => {
    expect(avisoDePrueba({ ...prueba, renueva: null }, AHORA)).toBe(AHORA + 3 * DIA);
  });
});

describe('los planes', () => {
  it('dice cuál es, y cuánto menos sale el anual', () => {
    expect(planDe(prueba)).toBe('anual');
    expect(planDe(pagando)).toBe('mensual');
    expect(ahorroDelAnual(29.99, 4.99)).toBe(50);
    expect(ahorroDelAnual(60, 5)).toBe(0);
  });
});
