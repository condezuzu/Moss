import { describe, expect, it } from '@jest/globals';

import { anotada, deLaVersionAnterior, desanotada, fotoDeLaComida, fotosDelDia, leerFotos, loAnotado, sinAnotar, type FotoDeComida } from './fotos';
import type { Registro } from './registros';

const foto = (x: Partial<FotoDeComida>): FotoDeComida => ({ id: 'f', dia: '2026-11-16', minutos: 600, comida: null, registros: null, archivo: 'f.jpg', ...x });
const registro = (x: Partial<Registro>) => ({ id: 'r', dia: '2026-11-16', comida: 'almuerzo', planificado: false, ...x }) as Registro;

describe('las fotos de un día', () => {
  const fotos = [
    foto({ id: 'c', minutos: 20 * 60, comida: 'cena' }),
    foto({ id: 'a', minutos: 8 * 60, comida: 'desayuno' }),
    foto({ id: 'b', minutos: 13 * 60, comida: 'almuerzo' }),
    foto({ id: 'b2', minutos: 13 * 60 + 30, comida: 'almuerzo' }),
    foto({ id: 'ayer', dia: '2026-11-15', minutos: 9 * 60, comida: 'desayuno' }),
  ];

  it('van por la hora en que se sacaron, sin las de otro día', () => {
    expect(fotosDelDia(fotos, '2026-11-16').map((f) => f.id)).toEqual(['a', 'b', 'b2', 'c']);
  });

  it('la de la tarjeta es la primera de su comida', () => {
    expect(fotoDeLaComida(fotos, '2026-11-16', 'almuerzo')?.id).toBe('b');
    expect(fotoDeLaComida(fotos, '2026-11-16', 'snack')).toBeNull();
  });
});

describe('lo anotado con una foto', () => {
  const registros = [
    registro({ id: '1' }),
    registro({ id: '2' }),
    registro({ id: '3', comida: 'cena' }),
    registro({ id: '4', planificado: true }),
    registro({ id: '5', dia: '2026-11-15' }),
  ];

  it('sin anotar, nada', () => {
    expect(loAnotado(foto({}), registros)).toEqual([]);
  });

  it('sacada después de anotar, toda su comida, sin lo planificado', () => {
    expect(loAnotado(foto({ comida: 'almuerzo' }), registros).map((r) => r.id)).toEqual(['1', '2']);
  });

  it('anotada con ella, lo de esa vez que siga en su comida', () => {
    expect(loAnotado(foto({ comida: 'almuerzo', registros: ['2', '3', '9'] }), registros).map((r) => r.id)).toEqual(['2']);
  });

  it('deshacer lo anotado la devuelve a sin anotar', () => {
    const f = anotada(foto({}), 'cena', ['3']);
    expect(sinAnotar(f)).toBe(false);
    expect(loAnotado(f, registros).map((r) => r.id)).toEqual(['3']);
    expect(sinAnotar(desanotada(f))).toBe(true);
    expect(desanotada(f).registros).toBeNull();
  });
});

describe('las fotos de la versión anterior', () => {
  it('pasan a ser la foto de toda su comida', () => {
    expect(deLaVersionAnterior('2026-11-10-almuerzo.jpg', 780)).toEqual({ id: '2026-11-10-almuerzo', dia: '2026-11-10', minutos: 780, comida: 'almuerzo', registros: null, archivo: '2026-11-10-almuerzo.jpg' });
  });

  it('lo que no tiene ese nombre no es una foto de antes', () => {
    expect(deLaVersionAnterior('fotos.json', 0)).toBeNull();
    expect(deLaVersionAnterior('2026-11-10-brunch.jpg', 0)).toBeNull();
    expect(deLaVersionAnterior('k3j2-1731.jpg', 0)).toBeNull();
  });
});

describe('leer lo guardado', () => {
  it('se queda con lo que tiene forma de foto', () => {
    const buena = foto({ id: 'x', comida: 'cena', registros: ['1'] });
    const texto = JSON.stringify([buena, { id: 'y' }, null, foto({ comida: 'brunch' as never }), foto({ id: 'z' })]);
    expect(leerFotos(texto)?.map((f) => f.id)).toEqual(['x', 'z']);
  });

  it('sin nada o roto, null', () => {
    expect(leerFotos(null)).toBeNull();
    expect(leerFotos('{')).toBeNull();
    expect(leerFotos('{}')).toBeNull();
  });
});
