import { describe, expect, it } from '@jest/globals';

import type { TomaDeAgua } from '../dominio/registros';
import { lineaDelAgua, repartirAgua, toquesDelAgua, VASO_ML } from './agua';
import { lineaDeAnotar } from './anotar';
import type { PropsAgua } from './tipos';

const HOY = '2026-10-21';
const TEXTOS = {} as PropsAgua['textos'];
const toma = (id: string, ml: number, momento: string, dia = HOY): TomaDeAgua => ({ id, dia, ml, momento, actualizado: momento });
const agua = (...t: TomaDeAgua[]) => new Map(t.map((x) => [x.id, x]));

describe('el agua en el widget', () => {
  it('una entrada por día, con lo que tomó hoy', () => {
    const l = lineaDelAgua({ hoy: HOY, agua: agua(toma('a', 500, `${HOY}T10:00:00.000Z`)) }, { meta: 2000, textos: TEXTOS, url: 'moss://inicio' });
    expect(l[0].props.ml).toBe(500);
    expect(l[1].props.ml).toBe(0);
  });

  it('lo tocado se suma con la hora del toque, una sola vez', () => {
    const l = lineaDelAgua({ hoy: HOY, agua: agua() }, { meta: 2000, textos: TEXTOS, url: '' });
    const en = Date.parse(`${HOY}T22:00:00.000Z`);
    l[0].props.vasos = 2;
    l[0].props.en = en;
    expect(toquesDelAgua(l)).toEqual([{ dia: HOY, vasos: 2, en }]);
    expect(repartirAgua(toquesDelAgua(l), { hoy: HOY, agua: agua() }).sumar).toEqual([{ dia: HOY, ml: 2 * VASO_ML, en }]);
    const ya = agua(toma('t', 500, new Date(en).toISOString()));
    expect(repartirAgua(toquesDelAgua(l), { hoy: HOY, agua: ya }).sumar).toEqual([]);
  });

  it('el «−» saca las últimas tomas de ese día', () => {
    const tomas = agua(toma('a', 250, `${HOY}T09:00:00.000Z`), toma('b', 250, `${HOY}T11:00:00.000Z`), toma('c', 250, '2026-10-20T11:00:00.000Z', '2026-10-20'));
    expect(repartirAgua([{ dia: HOY, vasos: -1, en: 1 }], { hoy: HOY, agua: tomas }).quitar).toEqual(['b']);
  });
});

describe('el título de Anotar', () => {
  const titulos = { desayuno: 'Anotar el desayuno', almuerzo: 'Anotar el almuerzo', merienda: 'Anotar la merienda', cena: 'Anotar la cena', snack: 'Anotar un snack' };

  it('cambia con la comida de la hora, sin abrir Moss, y en orden', () => {
    const l = lineaDeAnotar(new Date(2026, 9, 21, 11, 40), { titulos, queda: '', acciones: [], url: '', decirTitulo: '' });
    expect(l[0].props.titulo).toBe('Anotar un snack');
    expect(l[1].date.getHours()).toBe(12);
    expect(l[1].props.titulo).toBe('Anotar el almuerzo');
    expect(l.map((e) => e.props.titulo)).toContain('Anotar la cena');
    const tiempos = l.map((e) => e.date.getTime());
    expect([...tiempos].sort((a, b) => a - b)).toEqual(tiempos);
  });
});
