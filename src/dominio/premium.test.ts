import { describe, expect, it } from '@jest/globals';

import { acceso, ahorroDelAnual, avisoDePrueba, cuentaDeMossDesde, DIA_DEL_AVISO, DIAS_DE_PRUEBA, diasDePrueba, esDeRegalo, planDe, porMes, PRECIOS, PRODUCTOS, tieneAcceso, type Suscripcion } from './premium';

const DIA = 86_400_000;
const AHORA = Date.parse('2026-12-10T12:00:00Z');
const prueba: Suscripcion = { producto: PRODUCTOS.anual, vence: AHORA + 5 * DIA, prueba: true, renueva: true };
const pagando: Suscripcion = { producto: PRODUCTOS.mensual, vence: AHORA + 20 * DIA, prueba: false, renueva: true };
const vencidaHace = (dias: number, renueva: boolean | null = true): Suscripcion => ({ producto: PRODUCTOS.mensual, vence: AHORA - dias * DIA, prueba: false, renueva });

describe('quién entra', () => {
  const de = (d: Partial<Parameters<typeof acceso>[0]>) => acceso({ suscripcion: null, regalo: false, ahora: AHORA, ...d });

  it('sin nada, nueva y sin acceso', () => {
    expect(de({})).toBe('nueva');
    expect(tieneAcceso('nueva')).toBe(false);
  });

  it('con lo que dice Apple, en prueba o activa, y con acceso', () => {
    expect(de({ suscripcion: prueba })).toBe('prueba');
    expect(de({ suscripcion: pagando })).toBe('activa');
    expect(tieneAcceso('prueba')).toBe(true);
    expect(tieneAcceso('activa')).toBe(true);
  });

  it('quien tenía cuenta antes de que se prendiera entra de regalo, aunque no pague', () => {
    expect(de({ regalo: true })).toBe('regalo');
    expect(tieneAcceso('regalo')).toBe(true);
    // Aunque además tenga una: el regalo no se cobra, y venza lo que venza sigue adentro.
    expect(de({ regalo: true, ultima: vencidaHace(40) })).toBe('regalo');
  });

  it('la que terminó queda vencida y sin acceso', () => {
    expect(de({ ultima: vencidaHace(1) })).toBe('vencida');
    expect(de({ ultima: vencidaHace(1), sinConexion: false })).toBe('vencida');
    expect(tieneAcceso('vencida')).toBe(false);
  });

  it('lo vigente manda sobre la última que se conoce', () => {
    expect(de({ suscripcion: pagando, ultima: vencidaHace(40) })).toBe('activa');
  });
});

describe('sin conexión', () => {
  const sinRed = (ultima: Suscripcion) => acceso({ suscripcion: null, regalo: false, ultima, sinConexion: true, ahora: AHORA });

  it('quien renovaba sigue adentro: Apple no puede saber que renovó', () => {
    expect(sinRed(vencidaHace(0))).toBe('activa');
    expect(sinRed(vencidaHace(6))).toBe('activa');
    expect(sinRed(vencidaHace(3, null))).toBe('activa');
  });

  it('quien había cancelado no: Apple ya lo sabe', () => {
    expect(sinRed(vencidaHace(1, false))).toBe('vencida');
  });

  it('no para siempre: una semana después de la fecha que se sabe', () => {
    expect(sinRed(vencidaHace(8))).toBe('vencida');
  });

  it('sin haber tenido nunca una suscripción, no entra', () => {
    expect(acceso({ suscripcion: null, regalo: false, ultima: null, sinConexion: true, ahora: AHORA })).toBe('nueva');
  });
});

describe('el regalo', () => {
  it('la fecha es la de la identidad de Apple: la de Auth puede ser la de una cuenta de Ascent más vieja', () => {
    const unida = { created_at: '2025-03-01T10:00:00Z', identities: [{ provider: 'email', created_at: '2025-03-01T10:00:00Z' }, { provider: 'apple', created_at: '2027-01-05T10:00:00Z' }] };
    expect(cuentaDeMossDesde(unida)).toBe('2027-01-05T10:00:00Z');
    expect(esDeRegalo(cuentaDeMossDesde(unida), '2026-12-01')).toBe(false);
    expect(esDeRegalo(cuentaDeMossDesde({ created_at: '2026-10-29T10:00:00Z', identities: [{ provider: 'apple', created_at: '2026-10-29T10:00:00Z' }] }), '2026-12-01')).toBe(true);
  });

  it('sin las identidades a la vista, la de Auth; sin sesión, nada', () => {
    expect(cuentaDeMossDesde({ created_at: '2026-10-29T10:00:00Z' })).toBe('2026-10-29T10:00:00Z');
    expect(cuentaDeMossDesde({ created_at: '2026-10-29T10:00:00Z', identities: null })).toBe('2026-10-29T10:00:00Z');
    expect(cuentaDeMossDesde(null)).toBeNull();
    expect(cuentaDeMossDesde(undefined)).toBeNull();
  });

  it('la cuenta tiene que ser de antes del día en que se prende', () => {
    expect(esDeRegalo('2026-11-30T23:59:00Z', '2026-12-01')).toBe(true);
    expect(esDeRegalo('2026-12-01T00:00:00Z', '2026-12-01')).toBe(false);
    expect(esDeRegalo('2027-01-05T10:00:00Z', '2026-12-01')).toBe(false);
  });

  it('sin una fecha que se entienda, no', () => {
    expect(esDeRegalo(null, '2026-12-01')).toBe(false);
    expect(esDeRegalo(undefined, '2026-12-01')).toBe(false);
    expect(esDeRegalo('cualquier cosa', '2026-12-01')).toBe(false);
  });
});

describe('la prueba', () => {
  it('son 7 días, y el aviso es el día 5, como dice la pantalla', () => {
    expect(DIAS_DE_PRUEBA).toBe(7);
    expect(DIA_DEL_AVISO).toBe(5);
    const recien: Suscripcion = { ...prueba, vence: AHORA + DIAS_DE_PRUEBA * DIA };
    expect(avisoDePrueba(recien, AHORA)).toBe(AHORA + DIA_DEL_AVISO * DIA);
  });

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

describe('los planes y el precio', () => {
  it('dice cuál es', () => {
    expect(planDe(prueba)).toBe('anual');
    expect(planDe(pagando)).toBe('mensual');
  });

  it('las cuentas de lo decidido: USD 3,33 por mes y 67 % de ahorro (119,88 contra 39,99)', () => {
    expect(PRECIOS.mensual).toBe(9.99);
    expect(PRECIOS.anual).toBe(39.99);
    expect(12 * PRECIOS.mensual).toBeCloseTo(119.88, 2);
    expect(porMes(PRECIOS.anual)).toBe(3.33);
    expect(ahorroDelAnual(PRECIOS.anual, PRECIOS.mensual)).toBe(67);
  });

  it('el precio por mes va con los decimales de la moneda', () => {
    expect(porMes(6000, 0)).toBe(500);
    expect(porMes(5900, 0)).toBe(492);
    expect(porMes(44.99, 2)).toBe(3.75);
    expect(porMes(1590, 2)).toBe(132.5);
  });

  it('el ahorro sale de los precios reales de cada país', () => {
    expect(ahorroDelAnual(44.99, 10.99)).toBe(66);
    expect(ahorroDelAnual(60, 5)).toBe(0);
  });
});
