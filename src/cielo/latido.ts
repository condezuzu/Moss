// El latido del cielo: los cuadros corren solo mientras hacen falta. Cada cuadro pide el siguiente
// en el hilo de la interfaz (requestAnimationFrame); cuando el cielo queda quieto deja de pedirlo, y
// en pantalla queda la última imagen. Despertarlo es volver a pedir un cuadro, desde un gesto, un
// dato nuevo o la vuelta a la app, sin pasar por React.
// `corre` es la vuelta que está corriendo (0, ninguna) y `vueltas` las numera: un cuadro de una
// vuelta vieja que ya estaba pedido no hace nada.

type Valor<T> = { value: T };

/** Arranca el lazo si estaba quieto: `cuadro` dibuja uno y dice si hace falta otro. Devuelve si lo arrancó. */
export function arrancar(corre: Valor<number>, vueltas: Valor<number>, cuadro: (ahora: number) => boolean, pedir: (f: (ahora: number) => void) => unknown): boolean {
  'worklet';
  if (corre.value !== 0) return false;
  const vuelta = vueltas.value + 1;
  vueltas.value = vuelta;
  corre.value = vuelta;
  const lazo = (ahora: number) => {
    if (corre.value !== vuelta) return;
    if (cuadro(ahora)) pedir(lazo);
    else if (corre.value === vuelta) corre.value = 0;
  };
  pedir(lazo);
  return true;
}

/** Corta el lazo que corre (la app se fue al fondo, se bloqueó la pantalla o el cielo se desarma). */
export function frenar(corre: Valor<number>) {
  'worklet';
  corre.value = 0;
}

/** Si el lazo corre, sigue con este `cuadro`: el de un render nuevo, con lo que sabe ahora React. */
export function relevar(corre: Valor<number>, vueltas: Valor<number>, cuadro: (ahora: number) => boolean, pedir: (f: (ahora: number) => void) => unknown) {
  'worklet';
  if (corre.value === 0) return;
  corre.value = 0;
  arrancar(corre, vueltas, cuadro, pedir);
}

/** Lo que muestra el panel de prueba: los cuadros por segundo, los dibujados y si el cielo está quieto. */
export type Medida = { fps: number; total: number; reposo: boolean };

/**
 * Los cuadros le llegan solo al panel de prueba, no a todo el cielo: si no, cada medio segundo React
 * volvía a armar el lienzo entero.
 */
export function crearMedidor() {
  let medida: Medida = { fps: 0, total: 0, reposo: false };
  const oyentes = new Set<() => void>();
  return {
    leer: () => medida,
    poner: (nueva: Medida) => {
      medida = nueva;
      oyentes.forEach((o) => o());
    },
    suscribir: (oyente: () => void) => {
      oyentes.add(oyente);
      return () => {
        oyentes.delete(oyente);
      };
    },
  };
}

export type Medidor = ReturnType<typeof crearMedidor>;
