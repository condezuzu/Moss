import { describe, expect, it } from '@jest/globals';

import {
  acceso, ahorroDelAnual, avisoDelRegalo, avisoDePrueba, avisosHasta, codigoDeOferta, cuentaDeMossDesde, cuentaParaElRegalo, DIA_DEL_AVISO, DIAS_DE_PRUEBA, diasDePrueba, esDeRegalo, finDelRegalo,
  hastaDelRegalo, MESES_DE_REGALO, planDe, porMes, PRECIOS, PRODUCTOS, regaloVigente, tieneAcceso, type Suscripcion,
} from './premium';

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
    // Aunque además haya tenido una: el regalo no se cobra, y venza lo que venza sigue adentro.
    expect(de({ regalo: true, ultima: vencidaHace(40) })).toBe('regalo');
  });

  it('con regalo y una suscripción vigente, manda la suscripción: Apple la cobra igual', () => {
    expect(de({ regalo: true, suscripcion: pagando })).toBe('activa');
    expect(de({ regalo: true, suscripcion: prueba })).toBe('prueba');
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
    expect(esDeRegalo('2026-12-01T03:00:00Z', '2026-12-01')).toBe(false);
    expect(esDeRegalo('2027-01-05T10:00:00Z', '2026-12-01')).toBe(false);
  });

  it('el día del corte es el de Uruguay (UTC−3), no el de UTC', () => {
    // Creada el 13/11 a las 21:30 en Uruguay: en UTC ya es el 14.
    expect(esDeRegalo('2026-11-14T00:30:00Z', '2026-11-14')).toBe(true);
    expect(esDeRegalo('2026-11-14T02:59:59Z', '2026-11-14')).toBe(true);
    expect(esDeRegalo('2026-11-14T03:00:00Z', '2026-11-14')).toBe(false);
    expect(esDeRegalo('2026-11-14T00:00:00-03:00', '2026-11-14')).toBe(false);
  });

  it('sin una fecha que se entienda, no', () => {
    expect(esDeRegalo(null, '2026-12-01')).toBe(false);
    expect(esDeRegalo(undefined, '2026-12-01')).toBe(false);
    expect(esDeRegalo('cualquier cosa', '2026-12-01')).toBe(false);
  });

  it('sin conexión y con el token vencido la sesión llega vacía: vale la fecha guardada, y solo salir la olvida', () => {
    const antes = '2026-10-29T10:00:00Z';
    expect(cuentaParaElRegalo(antes, null, false)).toBe(antes);
    expect(cuentaParaElRegalo(null, antes, false)).toBe(antes);
    expect(esDeRegalo(cuentaParaElRegalo(undefined, antes, false), '2026-12-01')).toBe(true);
    // La de la sesión gana a la guardada: es la que da el servidor.
    expect(cuentaParaElRegalo('2027-01-05T10:00:00Z', antes, false)).toBe('2027-01-05T10:00:00Z');
    // Al salir de la cuenta o borrarla, ya no es de regalo; sin nada, tampoco.
    expect(cuentaParaElRegalo(null, antes, true)).toBeNull();
    expect(cuentaParaElRegalo(null, null, false)).toBeNull();
  });
});

describe('el regalo dura 3 meses', () => {
  // En la hora del teléfono: el regalo termina a la medianoche de ahí.
  const local = (a: number, m: number, d: number, h = 0, min = 0) => new Date(a, m - 1, d, h, min).getTime();

  it('hasta el mismo número de día, tres meses después del día en que Moss pasó a ser de pago', () => {
    expect(MESES_DE_REGALO).toBe(3);
    expect(finDelRegalo('2026-11-14')).toBe('2027-02-14');
    expect(finDelRegalo('2026-10-31')).toBe('2027-01-31');
    expect(finDelRegalo('2027-12-31')).toBe('2028-03-31');
  });

  it('si ese mes es más corto, su último día', () => {
    expect(finDelRegalo('2026-11-30')).toBe('2027-02-28');
    expect(finDelRegalo('2027-11-30')).toBe('2028-02-29');
  });

  it('el último día también es de regalo, y a la medianoche termina', () => {
    expect(hastaDelRegalo('2027-02-14')).toBe(local(2027, 2, 15));
    expect(regaloVigente('2027-02-14', local(2027, 2, 14, 23, 59))).toBe(true);
    expect(regaloVigente('2027-02-14', local(2027, 2, 15))).toBe(false);
    expect(regaloVigente('2027-02-14', local(2026, 11, 22))).toBe(true);
  });

  it('avisa dos días antes del último, a las 10', () => {
    expect(avisoDelRegalo('2027-02-14', local(2026, 11, 22))).toBe(local(2027, 2, 12, 10));
    expect(avisoDelRegalo('2027-02-14', local(2027, 2, 12, 10, 1))).toBeNull();
  });

  it('los avisos de quien la tiene de regalo suenan hasta que termina', () => {
    expect(avisosHasta(null, 'regalo', hastaDelRegalo('2027-02-14'))).toBe(local(2027, 2, 15));
    expect(avisosHasta({ ...prueba, renueva: false }, 'regalo', local(2027, 2, 15))).toBe(local(2027, 2, 15));
  });

  it('con regalo y una prueba cancelada que vence antes, suenan hasta que termina el regalo', () => {
    const cancelada = { ...prueba, renueva: false };
    expect(avisosHasta(cancelada, 'prueba', local(2027, 2, 15))).toBe(local(2027, 2, 15));
    // Si la prueba vence después del regalo, hasta la prueba.
    expect(avisosHasta(cancelada, 'prueba', cancelada.vence - DIA)).toBe(cancelada.vence);
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

describe('hasta cuándo suenan los avisos', () => {
  it('con la prueba o la suscripción cancelada, hasta que vence: después no hay acceso', () => {
    expect(avisosHasta({ ...prueba, renueva: false }, 'prueba')).toBe(prueba.vence);
    expect(avisosHasta({ ...pagando, renueva: false }, 'activa')).toBe(pagando.vence);
  });

  it('renovándose, sin saber si renueva, o de regalo sin saber cuándo termina, sin fin', () => {
    expect(avisosHasta(prueba, 'prueba')).toBeNull();
    expect(avisosHasta({ ...pagando, renueva: null }, 'activa')).toBeNull();
    expect(avisosHasta({ ...prueba, renueva: false }, 'regalo')).toBeNull();
    expect(avisosHasta(null, 'regalo')).toBeNull();
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

describe('el código de oferta', () => {
  it('letras y números, como se escribió', () => {
    expect(codigoDeOferta('MOSS14')).toBe('MOSS14');
    expect(codigoDeOferta('moss14')).toBe('moss14');
    expect(codigoDeOferta('A'.repeat(64))).toBe('A'.repeat(64));
  });

  it('los espacios escritos de más se sacan: el teclado suele dejar uno al final', () => {
    expect(codigoDeOferta(' MOSS14 ')).toBe('MOSS14');
    expect(codigoDeOferta('MOSS 14\n')).toBe('MOSS14');
  });

  it('con cualquier otra cosa no hay código: no llega nada raro al enlace de la App Store', () => {
    expect(codigoDeOferta('')).toBeNull();
    expect(codigoDeOferta('   ')).toBeNull();
    expect(codigoDeOferta('MOSS-14')).toBeNull();
    expect(codigoDeOferta('MOSS14&id=1')).toBeNull();
    expect(codigoDeOferta('MOSS14?x')).toBeNull();
    expect(codigoDeOferta('MOÑO14')).toBeNull();
    expect(codigoDeOferta('A'.repeat(65))).toBeNull();
  });
});
