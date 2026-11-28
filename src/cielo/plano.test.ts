import { describe, expect, it, jest } from '@jest/globals';

import { catalogo } from '@/datos/catalogo';
import type { DiaDelCielo } from './dia';
import { armarPlano } from './plano';

// Para saber dónde va cada etiqueta no hacen falta los caminos de Skia.
jest.mock('@shopify/react-native-skia', () => {
  const camino = () => {
    const c = { moveTo: () => c, lineTo: () => c, close: () => c, detach: () => ({}) };
    return c;
  };
  return { Skia: { PathBuilder: { Make: camino } } };
});

const CORTOS = ['Dormir 7 h', '8.000 pasos', 'Agua 2 L', 'Leer 20 páginas', 'Entrenar', 'Escribir'];

/** El cielo de un día con la constelación `id` y el hábito `nombre` en la estrella `k`. */
function diaCon(id: string, k: number, nombre: string): DiaDelCielo {
  const constelacion = catalogo.find((c) => c.id === id)!;
  return {
    clave: '2026-11-27', constelacion,
    habitos: constelacion.estrellas.map((_, i) => ({ id: `h${i}`, nombre: i === k ? nombre : CORTOS[i % CORTOS.length], icono: 'star' })),
    frase: { texto: { es: '', en: '' }, autor: { es: '', en: '' } }, luzAcumulada: 0, semana: [], fecha: { diaSemana: 5, diaMes: 27, mes: 10 },
  };
}

describe('las etiquetas de las estrellas', () => {
  it('un nombre largo va en dos líneas parejas, y el que entra, en una', () => {
    const { etiquetas } = armarPlano(393, 852, diaCon('lepus', 2, 'Quedar dentro de las calorías'), 1);
    expect(etiquetas[2].nombre).toBe('Quedar dentro\nde las calorías');
    expect(etiquetas[0].nombre).toBe('Dormir 7 h');
  });

  it('ninguna se sale de la pantalla: la de una estrella del borde se corre hacia adentro', () => {
    // En la Liebre, «Quedar dentro de las calorías» iba centrada en su estrella y la pantalla le cortaba el final.
    const liebre = armarPlano(393, 852, diaCon('lepus', 2, 'Quedar dentro de las calorías'), 1).etiquetas[2];
    expect(liebre.lado).toBe('abajo');
    expect(liebre.corrida).toBeLessThan(0);
    const fuera: string[] = [];
    for (const [ancho, alto, letra] of [[393, 852, 1], [375, 667, 1], [375, 667, 1.3]]) {
      for (const c of catalogo) {
        for (const nombre of ['Quedar dentro de las calorías', 'Llegar a la proteína', 'Tomar la pastilla de la presión con el desayuno']) {
          for (let k = 0; k < c.estrellas.length; k++) {
            armarPlano(ancho, alto, diaCon(c.id, k, nombre), letra).etiquetas.forEach((e, i) => {
              if (e.x + e.caja[0] < 0 || e.x + e.caja[2] > ancho) fuera.push(`${c.id} ${ancho}×${alto} ×${letra}: la estrella ${i}, con «${nombre}» en la ${k}`);
            });
          }
        }
      }
    }
    expect(fuera).toEqual([]);
  });
});
