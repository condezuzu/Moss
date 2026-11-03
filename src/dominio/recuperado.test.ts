import { describe, expect, it } from '@jest/globals';

import { bandaDe, CALIDAD_SIN_DATO, comidaParaRecuperar, enLaBarra, musculosParaRecuperar, recuperado, suenoParaRecuperar } from './recuperado';

// Necesita 8 h; ayer, 150 de 160 g de proteína y 2.500 de 2.600 kcal.
const dia = (cambios: Partial<Parameters<typeof recuperado>[0]> = {}) => recuperado({
  dormido: 480, necesidad: 480, calidad: 90, sentida: null, fatiga: 4, proteinaAyer: 150, metaProteina: 160, kcalAyer: 2500, metaKcal: 2600,
  ...cambios,
});

describe('las franjas, las mismas en el total y en cada parte', () => {
  it('el total: muy bien desde 85, bien desde 70, aceptable desde 50 y atención debajo', () => {
    expect([100, 85, 84, 70, 69, 50, 49, 0].map((v) => bandaDe(v, 'total'))).toEqual(['muyBien', 'muyBien', 'bien', 'bien', 'aceptable', 'aceptable', 'atencion', 'atencion']);
  });
  it('el sueño, de 40: 34, 26 y 18; la comida, de 20: 17, 13 y 9', () => {
    expect([34, 33, 26, 25, 18, 17].map((v) => bandaDe(v, 'sueno'))).toEqual(['muyBien', 'bien', 'bien', 'aceptable', 'aceptable', 'atencion']);
    expect([17, 16, 13, 12, 9, 8].map((v) => bandaDe(v, 'comida'))).toEqual(['muyBien', 'bien', 'bien', 'aceptable', 'aceptable', 'atencion']);
  });
  it('la fatiga va al revés: hasta 5 % muy bien, hasta 15 bien (baja), hasta 40 aceptable (moderada) y más, atención (alta)', () => {
    expect([0, 5, 6, 11, 15, 16, 40, 41, 100].map((v) => bandaDe(v, 'fatiga'))).toEqual(['muyBien', 'muyBien', 'bien', 'bien', 'bien', 'aceptable', 'aceptable', 'atencion', 'atencion']);
  });
});

describe('en la barra, un tramo igual por franja', () => {
  it('cada borde cae en el borde de su tramo, y lo de adentro en proporción', () => {
    expect(enLaBarra(0, 'total')).toBe(0);
    expect(enLaBarra(50, 'total')).toBe(0.25);
    expect(enLaBarra(85, 'total')).toBe(0.75);
    expect(enLaBarra(100, 'total')).toBe(1);
    expect(enLaBarra(77.5, 'total')).toBeCloseTo(0.625);
  });
  it('con la fatiga, menos es más a la derecha: 0 % es lo mejor y 100 % lo peor', () => {
    expect(enLaBarra(0, 'fatiga')).toBe(1);
    expect(enLaBarra(15, 'fatiga')).toBe(0.5);
    expect(enLaBarra(40, 'fatiga')).toBe(0.25);
    expect(enLaBarra(100, 'fatiga')).toBe(0);
    expect(enLaBarra(10, 'fatiga')).toBeCloseTo(0.625);
  });
  it('lo que se pasa de la escala queda en la punta', () => {
    expect(enLaBarra(130, 'total')).toBe(1);
    expect(enLaBarra(-5, 'fatiga')).toBe(1);
  });
});

describe('el sueño, de 40', () => {
  it('20 por lo dormido contra lo que necesitas y 20 por la calidad', () => {
    expect(suenoParaRecuperar({ dormido: 480, necesidad: 480, calidad: 100, sentida: null }).puntos).toBe(40);
    expect(suenoParaRecuperar({ dormido: 350, necesidad: 480, calidad: 46, sentida: null }).puntos).toBe(24);
    // Dormir de más no suma.
    expect(suenoParaRecuperar({ dormido: 600, necesidad: 480, calidad: 100, sentida: null }).puntos).toBe(40);
  });
  it('sin calidad cuenta como regular: llega a 30 como mucho, y lo dice', () => {
    expect(CALIDAD_SIN_DATO).toBe(50);
    const s = suenoParaRecuperar({ dormido: 480, necesidad: 480, calidad: null, sentida: null });
    expect(s).toEqual({ puntos: 30, conCalidad: false, calidad: null });
  });
  it('lo que dijiste a la mañana cuenta como calidad, solo o en promedio con el reloj', () => {
    expect(suenoParaRecuperar({ dormido: 480, necesidad: 480, calidad: null, sentida: 5 })).toEqual({ puntos: 40, conCalidad: true, calidad: 100 });
    expect(suenoParaRecuperar({ dormido: 480, necesidad: 480, calidad: 60, sentida: 5 }).puntos).toBe(36);
  });
});

describe('los músculos y la comida', () => {
  it('los músculos: 40 × (1 − la fatiga)', () => {
    expect(musculosParaRecuperar(0)).toBe(40);
    expect(musculosParaRecuperar(11)).toBe(36);
    expect(musculosParaRecuperar(50)).toBe(20);
    expect(musculosParaRecuperar(100)).toBe(0);
    expect(musculosParaRecuperar(140)).toBe(0);
  });
  it('la comida: 10 por la proteína de ayer y 10 por el 80 % de las calorías', () => {
    expect(comidaParaRecuperar({ proteinaAyer: 160, metaProteina: 160, kcalAyer: 2080, metaKcal: 2600 }).puntos).toBe(20);
    expect(comidaParaRecuperar({ proteinaAyer: 80, metaProteina: 160, kcalAyer: 1040, metaKcal: 2600 }).puntos).toBe(10);
    expect(comidaParaRecuperar({ proteinaAyer: 0, metaProteina: 160, kcalAyer: 0, metaKcal: 2600 }).puntos).toBe(0);
  });
});

describe('el total', () => {
  it('suma las tres partes, con su franja y la de cada parte', () => {
    const r = dia();
    expect(r.partes).toEqual({ sueno: 38, musculos: 38, comida: 19 });
    expect(r.total).toBe(95);
    expect(r.banda).toBe('muyBien');
    expect(r.bandas).toEqual({ sueno: 'muyBien', fatiga: 'muyBien', comida: 'muyBien' });
    expect(r.conviene).toBe('fuerte');
  });
  it('dormir poco baja el total y el sueño pasa a ser lo que más falta', () => {
    const r = dia({ dormido: 350, calidad: 46 });
    expect(r.partes.sueno).toBe(24);
    expect(r.bandas.sueno).toBe('aceptable');
    expect(r.loQueMasFalta).toBe('sueno');
    expect(r.total).toBe(81);
    expect(r.banda).toBe('bien');
    expect(r.conviene).toBe('normal');
  });
  it('con los músculos cargados, lo que más falta son los músculos', () => {
    const r = dia({ fatiga: 46 });
    expect(r.bandas.fatiga).toBe('atencion');
    expect(r.loQueMasFalta).toBe('musculos');
    expect(r.partes.musculos).toBe(22);
  });
  it('sin la calidad, el sueño no pasa de 30 y avisa', () => {
    const r = dia({ calidad: null });
    expect(r.conCalidad).toBe(false);
    expect(r.partes.sueno).toBe(30);
  });
  it('por debajo de 50, conviene ir suave', () => {
    const r = dia({ dormido: 240, calidad: 20, fatiga: 60, proteinaAyer: 40, kcalAyer: 1000 });
    expect(r.banda).toBe('atencion');
    expect(r.conviene).toBe('suave');
  });
});
