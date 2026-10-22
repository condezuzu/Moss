import { describe, expect, it } from '@jest/globals';

import { cambioDe, cinturaAltura, grasaMarina, medidaValida, rangoDeGrasa, ultimasMedidas, type Medidas } from './cuerpo';

describe('la grasa corporal con cinta (método de la Marina)', () => {
  it('un hombre de 178 cm, 85 de cintura y 38 de cuello: 16,4 %', () => {
    expect(grasaMarina('m', 178, { cintura: 85, cuello: 38 })).toBeCloseTo(16.44, 1);
  });

  it('una mujer de 165 cm, 72 de cintura, 98 de cadera y 33 de cuello: 26,9 %', () => {
    expect(grasaMarina('f', 165, { cintura: 72, cadera: 98, cuello: 33 })).toBeCloseTo(26.92, 1);
  });

  it('sin las medidas que pide la fórmula no hay estimación', () => {
    expect(grasaMarina('f', 165, { cintura: 72, cuello: 33 })).toBeNull();
    expect(grasaMarina('m', 178, { cintura: 85 })).toBeNull();
    // La cintura no puede ser menor que el cuello.
    expect(grasaMarina('m', 178, { cintura: 36, cuello: 38 })).toBeNull();
  });

  it('más cintura es más grasa; más cuello, menos', () => {
    const base = grasaMarina('m', 178, { cintura: 85, cuello: 38 })!;
    expect(grasaMarina('m', 178, { cintura: 90, cuello: 38 })!).toBeGreaterThan(base);
    expect(grasaMarina('m', 178, { cintura: 85, cuello: 40 })!).toBeLessThan(base);
  });
});

describe('el rango que se muestra', () => {
  it('es chico, en puntos enteros, y contiene la estimación', () => {
    const r = rangoDeGrasa('m', 178, { cintura: 85, cuello: 38 })!;
    expect(r).toMatchObject({ desde: 15, hasta: 18 });
    expect(r.estimado).toBeGreaterThan(r.desde);
    expect(r.estimado).toBeLessThan(r.hasta);
    const f = rangoDeGrasa('f', 165, { cintura: 72, cadera: 98, cuello: 33 })!;
    expect(f).toMatchObject({ desde: 25, hasta: 28 });
  });

  it('nunca es más angosto que un punto para cada lado ni más ancho que cuatro', () => {
    for (const cintura of [80, 88, 95, 100]) {
      const r = rangoDeGrasa('m', 180, { cintura, cuello: 39 })!;
      expect(r.hasta - r.desde).toBeGreaterThanOrEqual(2);
      expect(r.hasta - r.desde).toBeLessThanOrEqual(4);
    }
  });

  it('con muy poca grasa o con mucha, el método erra más: el rango se abre', () => {
    // 7 % y 35 %: un punto más para cada lado.
    const magro = rangoDeGrasa('m', 180, { cintura: 71, cuello: 39 })!;
    expect(magro.estimado).toBeLessThan(10);
    expect(magro.hasta - magro.desde).toBeGreaterThanOrEqual(4);
    const mucha = rangoDeGrasa('m', 180, { cintura: 125, cuello: 41 })!;
    expect(mucha.estimado).toBeGreaterThan(30);
    expect(mucha.hasta - mucha.desde).toBeGreaterThanOrEqual(4);
  });

  it('una estimación imposible es una medida mal tomada: no se muestra', () => {
    expect(rangoDeGrasa('m', 178, { cintura: 40, cuello: 39 })).toBeNull();
  });
});

describe('las medidas guardadas', () => {
  const m = (fecha: string, cm: Partial<Medidas>): Medidas => ({ fecha, actualizado: `${fecha}T08:00:00.000Z`, ...cm });
  const lista = [
    m('2026-09-01', { cintura: 88, cuello: 38.5, brazo: 33 }),
    m('2026-09-22', { cintura: 86.5, cuello: 38 }),
    m('2026-10-13', { cintura: 85, cuello: 38 }),
    { ...m('2026-10-20', { cintura: 99 }), borrado: true as const },
  ];

  it('de cada sitio, la última, aunque no se haya medido todo el mismo día', () => {
    expect(ultimasMedidas(lista, '2026-10-21')).toEqual({ cintura: 85, cuello: 38, brazo: 33, fechas: { cintura: '2026-10-13', cuello: '2026-10-13', brazo: '2026-09-01' } });
  });

  it('el cambio contra la medida de hace un mes', () => {
    expect(cambioDe(lista, 'cintura', '2026-10-21', '2026-09-21')).toBeCloseTo(-3, 5);
    expect(cambioDe(lista, 'brazo', '2026-10-21', '2026-09-21')).toBeNull();
  });

  it('la cintura sobre la altura', () => {
    expect(cinturaAltura(85.5, 178)).toBeCloseTo(0.48, 2);
    expect(cinturaAltura(undefined, 178)).toBeNull();
  });

  it('los rangos de lo que se puede tipear', () => {
    expect(medidaValida('cintura', 85)).toBe(true);
    expect(medidaValida('cintura', 8.5)).toBe(false);
    expect(medidaValida('cuello', Number.NaN)).toBe(false);
  });
});
