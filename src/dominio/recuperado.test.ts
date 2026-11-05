import { describe, expect, it } from '@jest/globals';

import es from '../textos/es.json';
import en from '../textos/en.json';
import { bandaDe, CALIDAD_SIN_DATO, comidaParaRecuperar, enLaBarra, musculosParaRecuperar, recuperado, suenoParaRecuperar, titularDeHoy } from './recuperado';
import { estadoDeLaNoche, lineaDelRendimiento } from './rendimiento';

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
    expect(comidaParaRecuperar({ proteinaAyer: 160, metaProteina: 160, kcalAyer: 2080, metaKcal: 2600 })!.puntos).toBe(20);
    expect(comidaParaRecuperar({ proteinaAyer: 80, metaProteina: 160, kcalAyer: 1040, metaKcal: 2600 })!.puntos).toBe(10);
    // Sin nada anotado no vale 0: no cuenta.
    expect(comidaParaRecuperar({ proteinaAyer: 0, metaProteina: 160, kcalAyer: 0, metaKcal: 2600 })).toBeNull();
    expect(comidaParaRecuperar({ proteinaAyer: null, metaProteina: 160, kcalAyer: null, metaKcal: 2600 })).toBeNull();
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
  it('sin la comida de ayer anotada, no baja: el total sale del sueño y los músculos (antes, 8 h y los músculos descansados daban 77)', () => {
    const r = dia({ calidad: 85, fatiga: 0, proteinaAyer: null, kcalAyer: null });
    expect(r.partes.comida).toBeNull();
    expect(r.bandas.comida).toBeNull();
    expect(r.total).toBeGreaterThanOrEqual(85);
    expect(r.loQueMasFalta).not.toBe('comida');
  });
  it('por debajo de 50, conviene ir suave', () => {
    const r = dia({ dormido: 240, calidad: 20, fatiga: 60, proteinaAyer: 40, kcalAyer: 1000 });
    expect(r.banda).toBe('atencion');
    expect(r.conviene).toBe('suave');
  });
});

// ------------------------------------------------------------ el titular, sin porcentaje (5/11/2026)

const NOCHE = { dormido: 470, necesidad: 480, despertoAntes: null };
const titular = (cambios: Partial<Parameters<typeof titularDeHoy>[0]> = {}) => titularDeHoy({
  sesion: 'prevista', sabeCuandoEntrena: true, noche: NOCHE, ultimas3: [470, 455, 470], musculos: 'recuperado', comoTeSientes: null, ...cambios,
});

describe('la noche en una palabra, con los umbrales de los estudios', () => {
  it('normal hasta una hora por debajo; corta con 6 h o menos o despertándote una hora antes; muy corta con 4 h 30 o menos', () => {
    expect(estadoDeLaNoche({ dormido: 420, necesidad: 480, despertoAntes: null })).toBe('normal');
    expect(estadoDeLaNoche({ dormido: 400, necesidad: 480, despertoAntes: null })).toBe('algoCorta');
    expect(estadoDeLaNoche({ dormido: 360, necesidad: 480, despertoAntes: null })).toBe('corta');
    expect(estadoDeLaNoche({ dormido: 450, necesidad: 480, despertoAntes: 80 })).toBe('corta');
    expect(estadoDeLaNoche({ dormido: 450, necesidad: 480, despertoAntes: 40 })).toBe('normal');
    expect(estadoDeLaNoche({ dormido: 270, necesidad: 480, despertoAntes: null })).toBe('muyCorta');
  });
  it('el rendimiento es una línea, solo con la noche corta', () => {
    expect(lineaDelRendimiento({ dormido: 420, necesidad: 480, despertoAntes: null }, [420, 450, 460])).toBeNull();
    expect(lineaDelRendimiento({ dormido: 350, necesidad: 480, despertoAntes: null }, [350, 450, 460])).toBe('suenoCorto');
    // Dos de las últimas tres, aunque anoche no.
    expect(lineaDelRendimiento({ dormido: 420, necesidad: 480, despertoAntes: null }, [420, 340, 350])).toBe('suenoCorto');
    expect(lineaDelRendimiento(null, [])).toBeNull();
  });
});

describe('el titular de hoy: el eslabón más débil, y nada lo compensa', () => {
  it('los seis días de ejemplo de la galería', () => {
    // Durmió 5 h 50 y se despertó 1 h 20 antes; las piernas, recuperándose un poco.
    expect(titular({ noche: { dormido: 350, necesidad: 480, despertoAntes: 80 }, ultimas3: [350, 455, 470], musculos: 'recuperandose' })).toEqual({ que: 'suenoCorto', limita: 'sueno' });
    expect(titular({ noche: { dormido: 472, necesidad: 480, despertoAntes: null } })).toEqual({ que: 'listo', limita: null });
    expect(titular({ sesion: 'hecha' }).que).toBe('hecha');
    expect(titular({ sesion: null }).que).toBe('descanso');
    expect(titular({ noche: null, ultimas3: [] }).que).toBe('faltaNoche');
    // Sin la calidad del sueño no cambia nada: la calidad es un dato, no la mitad del sueño.
    expect(titular({ noche: { dormido: 470, necesidad: 480, despertoAntes: null } }).que).toBe('listo');
  });
  it('lo cargado manda primero: dormir bien no lo compensa', () => {
    expect(titular({ musculos: 'cargado' })).toEqual({ que: 'cargado', limita: 'musculos' });
    expect(titular({ musculos: 'cargado', noche: { dormido: 300, necesidad: 480, despertoAntes: null } }).que).toBe('cargado');
  });
  it('con la noche bien, lo que dices de cómo te sientes cuenta: 4 o menos de 10', () => {
    expect(titular({ comoTeSientes: 3 })).toEqual({ que: 'teSientes', limita: 'teSientes' });
    expect(titular({ comoTeSientes: 7 }).que).toBe('listo');
  });
  it('recuperándose, como siempre; sin saber cuándo entrenas, no dice que descansas', () => {
    expect(titular({ musculos: 'recuperandose' }).que).toBe('casi');
    expect(titular({ sesion: null, sabeCuandoEntrena: false }).que).toBe('sinHorario');
  });
  it('con 4 h 30 a 6 h nunca dice que estás listo: antes, el 97 % de esas noches daba «Bien» o «Muy bien»', () => {
    for (const dormido of [270, 300, 330, 360]) for (const musculos of ['recuperado', 'recuperandose'] as const) {
      expect(titular({ noche: { dormido, necesidad: 480, despertoAntes: null }, musculos }).que).toBe('suenoCorto');
    }
  });
});

describe('ningún texto de la sección dice un porcentaje de recuperación', () => {
  const textos = (o: unknown, fuera: string[] = []): string[] => {
    if (typeof o === 'string') fuera.push(o);
    else if (Array.isArray(o)) o.forEach((x) => textos(x, fuera));
    else if (o && typeof o === 'object') Object.values(o).forEach((x) => textos(x, fuera));
    return fuera;
  };
  it('ni «% recuperado» ni «% recovered», en español ni en inglés', () => {
    const todos = [...textos((es as { ascent: unknown }).ascent), ...textos((en as { ascent: unknown }).ascent)];
    expect(todos.filter((t) => /%\s*(\{[^}]*\}\s*)?(recuperad|recovered)/i.test(t))).toEqual([]);
  });
  it('los titulares nuevos no llevan números de recuperación', () => {
    const titulares = [...textos((es as { ascent: { titular: unknown } }).ascent.titular), ...textos((en as { ascent: { titular: unknown } }).ascent.titular)];
    expect(titulares.length).toBeGreaterThan(0);
    expect(titulares.filter((t) => /\d\s*%/.test(t))).toEqual([]);
  });
});
