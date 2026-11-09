import { describe, expect, it } from '@jest/globals';

import type { Comida } from '@/dominio/comidas';
import { alSoltarLaFila, ANCHO_DE_BORRAR, ANCHO_DEL_MENU, diasDelMenu, dondeFue, minutoDeDestino, seguirAlDedo, topeDeBorrar, ubicarMenu } from './menuDeComida';

const PANTALLA = { ancho: 393, alto: 852 };
const MARGEN = { arriba: 58, abajo: 46 };

describe('dónde va el menú de mantener apretado', () => {
  it('debajo de lo levantado, si entra, y sin salirse a los costados', () => {
    const l = ubicarMenu({ x: 84, y: 190, ancho: 290, alto: 27 }, 150, PANTALLA, MARGEN);
    expect(l).toEqual({ izquierda: 84, arriba: 227, corre: 0, desdeAbajo: false });
    expect(ubicarMenu({ x: 300, y: 190, ancho: 80, alto: 27 }, 150, PANTALLA, MARGEN).izquierda).toBe(PANTALLA.ancho - 14 - ANCHO_DEL_MENU);
    expect(ubicarMenu({ x: 2, y: 190, ancho: 80, alto: 27 }, 150, PANTALLA, MARGEN).izquierda).toBe(14);
  });

  it('encima, si abajo no entra: crece desde su borde de abajo', () => {
    const l = ubicarMenu({ x: 75, y: 510, ancho: 302, alto: 170 }, 150, PANTALLA, MARGEN);
    expect(l).toEqual({ izquierda: 75, arriba: 510 - 10 - 150, corre: 0, desdeAbajo: true });
  });

  it('si no entra ni arriba ni abajo, lo levantado sube lo justo y el menú va debajo', () => {
    const l = ubicarMenu({ x: 75, y: 200, ancho: 302, alto: 330 }, 305, PANTALLA, MARGEN);
    // Debajo empezaría en 540 y terminaría en 845: tiene que subir 39 para terminar en 806.
    expect(l.corre).toBe(-39);
    expect(l.arriba).toBe(501);
    expect(l.desdeAbajo).toBe(false);
    expect(l.arriba + 305).toBeLessThanOrEqual(PANTALLA.alto - MARGEN.abajo);
  });

  it('nunca pasa de la hora: con algo muy alto, el menú queda en la pantalla aunque lo tape', () => {
    const l = ubicarMenu({ x: 75, y: 120, ancho: 302, alto: 640 }, 305, PANTALLA, MARGEN);
    expect(120 + l.corre).toBeGreaterThanOrEqual(MARGEN.arriba);
    expect(l.arriba + 305).toBeLessThanOrEqual(PANTALLA.alto - MARGEN.abajo);
    expect(l.arriba).toBeGreaterThanOrEqual(MARGEN.arriba);
  });
});

describe('a qué días se copia o se mueve', () => {
  it('ayer, hoy y mañana, sin repetir, y el día que se mira si es otro, en orden', () => {
    expect(diasDelMenu('2026-11-09', '2026-11-09', '2026-07-12')).toEqual(['2026-11-08', '2026-11-09', '2026-11-10']);
    expect(diasDelMenu('2026-11-06', '2026-11-09', '2026-07-12')).toEqual(['2026-11-06', '2026-11-08', '2026-11-09', '2026-11-10']);
    expect(diasDelMenu('2026-11-12', '2026-11-09', '2026-07-12')).toEqual(['2026-11-08', '2026-11-09', '2026-11-10', '2026-11-12']);
  });

  it('sin los días que ya no están en el teléfono', () => {
    expect(diasDelMenu('2026-11-09', '2026-11-09', '2026-11-09')).toEqual(['2026-11-09', '2026-11-10']);
  });

  it('el aviso lo dice desde el día que se mira', () => {
    expect(dondeFue('2026-11-09', '2026-11-09', '2026-11-09')).toBe('mismo');
    expect(dondeFue('2026-11-10', '2026-11-09', '2026-11-09')).toBe('manana');
    expect(dondeFue('2026-11-08', '2026-11-09', '2026-11-09')).toBe('ayer');
    expect(dondeFue('2026-11-09', '2026-11-06', '2026-11-09')).toBe('hoy');
    expect(dondeFue('2026-11-06', '2026-11-09', '2026-11-09')).toBe('otro');
    // Viendo mañana, copiar a mañana es a la misma.
    expect(dondeFue('2026-11-10', '2026-11-10', '2026-11-09')).toBe('mismo');
  });
});

describe('a qué hora queda lo copiado', () => {
  const horaDe = (c: Comida) => ({ desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60, snack: 11 * 60 })[c];
  const momento = (h: number, m: number, s = 0) => new Date(2026, 10, 9, h, m, s).toISOString();
  const op = { hoy: '2026-11-09', ahora: new Date(2026, 10, 9, 13, 40), corte: 4 * 60, horaDe };

  it('con la comida ya en ese día, al minuto siguiente de lo último que tiene: al final, sin mover la comida', () => {
    const delDia = [
      { comida: 'almuerzo' as const, momento: momento(13, 5, 40) },
      { comida: 'almuerzo' as const, momento: momento(13, 22, 10) },
      { comida: 'desayuno' as const, momento: momento(8, 10) },
    ];
    expect(minutoDeDestino(delDia, '2026-11-09', 'almuerzo', op)).toBe(13 * 60 + 23);
  });

  it('hoy y en la comida de la hora, ahora; si no, a su hora de siempre', () => {
    expect(minutoDeDestino([], '2026-11-09', 'almuerzo', op)).toBe(13 * 60 + 40);
    expect(minutoDeDestino([], '2026-11-09', 'cena', op)).toBe(21 * 60);
    expect(minutoDeDestino([], '2026-11-10', 'almuerzo', op)).toBe(13 * 60);
    expect(minutoDeDestino([], '2026-11-09', 'snack', op)).toBe(11 * 60);
  });

  it('pasada la medianoche, antes del corte, lo de ahora sigue siendo del día (D32)', () => {
    const tarde = { ...op, ahora: new Date(2026, 10, 10, 0, 30) };
    expect(minutoDeDestino([], '2026-11-09', 'snack', tarde)).toBe(24 * 60 + 30);
  });
});

describe('deslizar para borrar', () => {
  it('el tope es un poco más de la mitad de la fila, nunca menos que «Borrar» y medio', () => {
    expect(topeDeBorrar(300)).toBe(174);
    expect(topeDeBorrar(120)).toBe(ANCHO_DE_BORRAR * 1.6);
  });

  it('la fila sigue al dedo; a la derecha cede poco y pasado el tope cuesta más', () => {
    expect(seguirAlDedo(0, -60, 174)).toBe(-60);
    expect(seguirAlDedo(-80, 20, 174)).toBe(-60);
    expect(seguirAlDedo(0, 40, 174)).toBe(10);
    expect(seguirAlDedo(0, -274, 174)).toBeCloseTo(-209);
  });

  it('al soltar: pasado el tope se borra; con más de media «Borrar» o un tirón queda abierta; si no, se cierra', () => {
    expect(alSoltarLaFila(-180, 0, 174)).toBe('borrar');
    expect(alSoltarLaFila(-50, 0, 174)).toBe('abrir');
    expect(alSoltarLaFila(-30, -800, 174)).toBe('abrir');
    expect(alSoltarLaFila(-30, -100, 174)).toBe('cerrar');
    expect(alSoltarLaFila(-60, 900, 174)).toBe('cerrar');
    expect(alSoltarLaFila(-10, -800, 174)).toBe('cerrar');
  });
});
