import { describe, expect, it } from '@jest/globals';

import { arrancar, frenar, relevar } from './latido';

// requestAnimationFrame de mentira: los cuadros pedidos se corren cuando el test lo dice.
function reloj() {
  let pedidos: ((ahora: number) => void)[] = [];
  let ahora = 0;
  return {
    pedir: (f: (ahora: number) => void) => { pedidos.push(f); },
    cuadro() {
      ahora += 16.7;
      const estos = pedidos;
      pedidos = [];
      estos.forEach((f) => f(ahora));
    },
    get pendientes() { return pedidos.length; },
  };
}

describe('el latido del cielo', () => {
  it('pide cuadros mientras hacen falta y después ninguno', () => {
    const r = reloj();
    const corre = { value: 0 };
    const vueltas = { value: 0 };
    let quedan = 3;
    let dibujados = 0;
    expect(arrancar(corre, vueltas, () => { dibujados++; return --quedan > 0; }, r.pedir)).toBe(true);
    for (let i = 0; i < 10; i++) r.cuadro();
    expect(dibujados).toBe(3);
    expect(r.pendientes).toBe(0);
    expect(corre.value).toBe(0);
  });

  it('despertarlo mientras corre no arma un segundo lazo', () => {
    const r = reloj();
    const corre = { value: 0 };
    const vueltas = { value: 0 };
    let dibujados = 0;
    const cuadro = () => { dibujados++; return true; };
    arrancar(corre, vueltas, cuadro, r.pedir);
    expect(arrancar(corre, vueltas, cuadro, r.pedir)).toBe(false);
    r.cuadro();
    r.cuadro();
    expect(dibujados).toBe(2);
    expect(r.pendientes).toBe(1);
  });

  it('frenado (la app en el fondo), el cuadro que ya estaba pedido no dibuja', () => {
    const r = reloj();
    const corre = { value: 0 };
    const vueltas = { value: 0 };
    let dibujados = 0;
    arrancar(corre, vueltas, () => { dibujados++; return true; }, r.pedir);
    frenar(corre);
    r.cuadro();
    r.cuadro();
    expect(dibujados).toBe(0);
    expect(r.pendientes).toBe(0);
  });

  it('con un render nuevo, el lazo que corre sigue con el cuadro nuevo', () => {
    const r = reloj();
    const corre = { value: 0 };
    const vueltas = { value: 0 };
    const quien: string[] = [];
    arrancar(corre, vueltas, () => { quien.push('viejo'); return true; }, r.pedir);
    r.cuadro();
    relevar(corre, vueltas, () => { quien.push('nuevo'); return true; }, r.pedir);
    r.cuadro();
    r.cuadro();
    expect(quien).toEqual(['viejo', 'nuevo', 'nuevo']);
    // Quieto, relevar no lo despierta.
    frenar(corre);
    r.cuadro();
    relevar(corre, vueltas, () => { quien.push('otro'); return true; }, r.pedir);
    r.cuadro();
    expect(quien).toEqual(['viejo', 'nuevo', 'nuevo']);
  });
});
