import { describe, expect, it } from '@jest/globals';

import { avivar, crearEscena, debeSeguir, estrellaEn, hayMovimiento, paso, ponerEncendidos, RADIO_DE_TOQUE, saludar, tocar, VIVO_AL_LLEGAR, VIVO_AL_TOCAR } from './escena';

const escena = (encendidos: boolean[], movimientoReducido = false) =>
  crearEscena({
    ancho: 393, alto: 852,
    habitos: encendidos.map((encendido, i) => ({ x: i * 0.1, y: 0.1, encendido, auto: false })),
    lineas: [], centro: [0, 0], brotes: [], universo: [], factorParticulas: 1, riqueza: 0, movimientoReducido,
  });

describe('lo que se enciende fuera del cielo', () => {
  it('llega a la escena que está, sin volver a avisar ni a marcar', () => {
    const e = escena([false, false, true]);
    ponerEncendidos(e, [true, false, true]);
    expect(e.habitos.map((h) => h.encendido)).toEqual([true, false, true]);
    expect(e.eventos).toEqual([]);
    expect(e.particulas.length).toBeGreaterThan(0);
  });

  it('si con eso se completa el día, se celebra; y no toca lo que ya estaba igual', () => {
    const e = escena([true, false]);
    e.eventos.push({ tipo: 'encendida', indice: 0 });
    ponerEncendidos(e, [true, true]);
    expect(e.completo).toBe(true);
    expect(e.eventos).toEqual([{ tipo: 'encendida', indice: 0 }, { tipo: 'completo' }]);
    ponerEncendidos(e, [true, true]);
    expect(e.eventos).toHaveLength(2);
  });
});

// Un rato de cuadros a 60 por segundo, como los pide Cielo.tsx mientras el cielo sigue vivo.
const correr = (e: ReturnType<typeof escena>, segundos: number) => {
  for (let i = 0; i < Math.round(segundos * 60); i++) paso(e, 1 / 60);
};

describe('el cielo en reposo', () => {
  it('sin nada que hacer, queda quieto: no pide cuadros', () => {
    const e = escena([false, true]);
    correr(e, 0.5);
    expect(debeSeguir(e)).toBe(false);
  });

  it('un toque lo deja vivo unos segundos y después se aquieta', () => {
    const e = escena([false, false]);
    avivar(e, VIVO_AL_TOCAR);
    tocar(e, 393 / 2, 852 / 2 - 0.1 * 852);
    expect(hayMovimiento(e)).toBe(true);
    correr(e, VIVO_AL_TOCAR - 0.5);
    expect(debeSeguir(e)).toBe(true);
    correr(e, 1.5);
    expect(hayMovimiento(e)).toBe(false);
    expect(debeSeguir(e)).toBe(false);
  });

  it('quieto no larga fugaces ni esporas', () => {
    const e = escena([false]);
    e.brotes = [{ x: 0, y: -0.38, tam: 1, fase: 0, brillo: 1 }];
    e.proximaFugaz = 0;
    correr(e, 20);
    expect(e.fugaz).toBeNull();
    expect(e.particulas).toHaveLength(0);
  });

  it('con Reducir movimiento no tiene vida propia: solo responde a un toque', () => {
    const e = escena([false], true);
    avivar(e, VIVO_AL_LLEGAR);
    expect(debeSeguir(e)).toBe(false);
    saludar(e);
    expect(e.efectos).toHaveLength(0);
    expect(debeSeguir(e)).toBe(false);
  });

  it('al llegar a Hábitos las estrellas saludan y la primera vez pasa una fugaz', () => {
    const e = escena([false, false, true]);
    saludar(e);
    expect(e.efectos.filter((f) => f.tipo === 3)).toHaveLength(3);
    correr(e, 1.6);
    expect(e.fugaz).not.toBeNull();
    correr(e, VIVO_AL_LLEGAR);
    expect(debeSeguir(e)).toBe(false);
    saludar(e);
    correr(e, 2);
    expect(e.fugaz).toBeNull();
  });

  it('el día completo se ve entero (la aurora sube y vuelve) antes de quedar quieto', () => {
    const e = escena([true, false]);
    ponerEncendidos(e, [true, true]);
    correr(e, 8);
    expect(debeSeguir(e)).toBe(true);
    correr(e, 4);
    expect(debeSeguir(e)).toBe(false);
  });

  it('pasado el rato de vida, las esporas se apagan enseguida', () => {
    const e = escena([false]);
    e.brotes = [{ x: 0, y: -0.38, tam: 1, fase: 0, brillo: 1 }];
    e.riqueza = 1;
    e.factorParticulas = 20;
    avivar(e, 30);
    correr(e, 25);
    expect(e.particulas.some((p) => p.espora)).toBe(true);
    e.vivoHasta = e.t;
    correr(e, 1);
    expect(e.particulas).toHaveLength(0);
  });
});

describe('tocar una estrella', () => {
  it('elige la más cercana dentro de un radio generoso', () => {
    const e = escena([false, false]);
    const sx = 393 / 2, sy = 852 / 2 - 0.1 * 852;
    expect(estrellaEn(e, sx, sy + RADIO_DE_TOQUE - 4)).toBe(0);
    expect(estrellaEn(e, sx, sy + RADIO_DE_TOQUE + 4)).toBe(-1);
    // Entre las dos, la que queda más cerca.
    const otra = 393 / 2 + 0.1 * 852;
    expect(estrellaEn(e, sx + (otra - sx) * 0.4, sy)).toBe(0);
    expect(estrellaEn(e, sx + (otra - sx) * 0.6, sy)).toBe(1);
  });

  it('lejos de la estrella, su etiqueta también vale', () => {
    const e = escena([false]);
    e.habitos[0].caja = [16, -16, 160, 24];
    const sx = 393 / 2, sy = 852 / 2 - 0.1 * 852;
    expect(estrellaEn(e, sx + 140, sy + 5)).toBe(0);
    expect(estrellaEn(e, sx + 170, sy + 5)).toBe(-1);
  });
});
