import { describe, expect, it } from '@jest/globals';

import type { Comida } from './comidas';
import { sumarDias } from './fechas';
import {
  aguaDelDia, borrado, comidasParaElControl, confirmar, copiar, cumpleLaComida, delDia, escalar, gramosDe, itemDeAlimento, itemDeReceta, itemDeRecetaEnGramos, itemRapido,
  itemsParaRegistrar, premios, recientes, restaurado, sueles, sumarValores, totalDelDia, ultimaCantidad, valoresDeReceta,
  type Item, type Receta, type Registro, type Valores,
} from './registros';

const HOY = '2026-10-21';
// Por 100 g, como en la base.
const BANANA: Valores = { kcal: 89, proteina: 1.09, carbohidratos: 22.84, grasas: 0.33, fibra: 2.6, azucares: 12.23, saturadas: 0.11, sodio: 1 };
const ARROZ: Valores = { kcal: 130, proteina: 2.69, carbohidratos: 28.17, grasas: 0.28 };
const banana = (veces = 1) => itemDeAlimento('base', '1105314', 'Banana', BANANA, { porcion: '1 mediana', gramosPorcion: 118, veces });
const arroz = (gramos = 150) => itemDeAlimento('base', '168878', 'Arroz blanco', ARROZ, { gramos });

let siguiente = 0;
const nuevoId = () => `r${++siguiente}`;
/** Un registro: `hora` es la hora local en Montevideo (UTC−3). */
function reg(item: Item, dia: string, comida: Comida, hora: number, extra: Partial<Registro> = {}): Registro {
  const momento = new Date(Date.parse(`${dia}T00:00:00Z`) + (hora + 3) * 3_600_000).toISOString();
  return { ...item, id: nuevoId(), dia, comida, momento, planificado: false, actualizado: momento, ...extra };
}

describe('las cantidades y los valores', () => {
  it('una porción por las veces, o los gramos; la carga rápida no tiene', () => {
    expect(gramosDe({ porcion: '1 mediana', gramosPorcion: 118, veces: 1.5 })).toBe(177);
    expect(gramosDe({ gramos: 150 })).toBe(150);
    expect(gramosDe(null)).toBeNull();
  });

  it('los valores salen de los de 100 g, y lo secundario solo si la base lo trae', () => {
    expect(arroz(150).valores).toEqual({ kcal: 195, proteina: expect.closeTo(4.035, 6), carbohidratos: expect.closeTo(42.255, 6), grasas: expect.closeTo(0.42, 6) });
    expect(banana(2).valores.fibra).toBeCloseTo(6.136, 6);
    expect('fibra' in arroz().valores).toBe(false);
  });

  it('la suma: lo que no dice un alimento cuenta como cero, y lo que no dice ninguno no está', () => {
    const s = sumarValores([banana().valores, arroz().valores]);
    expect(s.kcal).toBeCloseTo(105.02 + 195, 6);
    expect(s.fibra).toBeCloseTo(3.068, 6);
    expect('alcohol' in s).toBe(false);
  });

  it('la carga rápida va tal cual', () => {
    expect(itemRapido('Alfajor', { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 })).toEqual({ fuente: 'rapida', ref: null, nombre: 'Alfajor', cantidad: null, valores: { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 } });
  });
});

describe('el día', () => {
  const desayuno = reg(banana(), HOY, 'desayuno', 8);
  const almuerzo = reg(arroz(), HOY, 'almuerzo', 13);
  const borrada = borrado(reg(banana(3), HOY, 'merienda', 17), '2026-10-21T20:00:00.000Z');
  const manana = reg(arroz(), sumarDias(HOY, 1), 'cena', 21, { planificado: true });

  it('lo de un día va por hora y sin lo borrado', () => {
    expect(delDia([almuerzo, borrada, desayuno, manana], HOY).map((r) => r.id)).toEqual([desayuno.id, almuerzo.id]);
  });

  it('el total, con o sin lo planificado', () => {
    const plan = reg(arroz(100), HOY, 'cena', 21, { planificado: true });
    expect(totalDelDia([desayuno, almuerzo, plan], HOY).kcal).toBeCloseTo(105.02 + 195 + 130, 6);
    expect(totalDelDia([desayuno, almuerzo, plan], HOY, false).kcal).toBeCloseTo(105.02 + 195, 6);
  });

  it('el control cuenta lo comido de cada día: no lo planificado ni lo borrado', () => {
    const ayer = reg(arroz(200), sumarDias(HOY, -1), 'cena', 21);
    expect(comidasParaElControl([desayuno, almuerzo, borrada, manana, ayer])).toEqual([
      { fecha: sumarDias(HOY, -1), kcal: 260 },
      { fecha: HOY, kcal: expect.closeTo(300.02, 6) },
    ]);
  });

  it('el aceite de cocción va dentro del registro: 150 g de pollo con 1 cucharadita suman 40 kcal de grasa', () => {
    const por100g = { kcal: 120, proteina: 22.5, carbohidratos: 0, grasas: 2.6 };
    const solo = itemDeAlimento('base', '1', 'Pechuga', por100g, { gramos: 150 });
    const conAceite = itemDeAlimento('base', '1', 'Pechuga', por100g, { gramos: 150, aceite: 4.5 });
    expect(conAceite.valores.kcal - solo.valores.kcal).toBeCloseTo(39.78, 6);
    expect(conAceite.valores.grasas - solo.valores.grasas).toBeCloseTo(4.5, 6);
    expect(conAceite.valores.proteina).toBe(solo.valores.proteina);
    // Los gramos siguen siendo los del pollo.
    expect(gramosDe(conAceite.cantidad)).toBe(150);
  });

  it('el control sabe cuánto de cada día fue a ojo', () => {
    const aOjo = reg(arroz(200), HOY, 'cena', 21, { estimado: true });
    expect(comidasParaElControl([desayuno, aOjo])).toEqual([{ fecha: HOY, kcal: expect.closeTo(105.02 + 260, 6), kcalEstimadas: 260 }]);
  });

  it('el agua del día, sin los vasos sacados', () => {
    const vaso = (id: string, dia = HOY) => ({ id, dia, ml: 250, momento: `${dia}T12:00:00.000Z`, actualizado: `${dia}T12:00:00.000Z` });
    expect(aguaDelDia([vaso('a'), vaso('b'), borrado(vaso('c'), '2026-10-21T13:00:00.000Z'), vaso('d', '2026-10-20')], HOY)).toBe(500);
  });
});

describe('copiar, planificar, confirmar y borrar', () => {
  const ayer = sumarDias(HOY, -1);
  const cena = [reg(arroz(), ayer, 'cena', 21), reg(banana(), ayer, 'cena', 21.5)];
  const almuerzo = reg(arroz(), ayer, 'almuerzo', 13);
  const op = { hoy: HOY, ahora: '2026-10-21T23:00:00.000Z', nuevoId };

  it('la cena de ayer a hoy: registros nuevos, a la misma hora, ya registrados', () => {
    const copia = copiar([...cena, almuerzo], { dia: ayer, comida: 'cena' }, { dia: HOY }, op);
    expect(copia.map((r) => [r.nombre, r.dia, r.comida, r.planificado])).toEqual([['Arroz blanco', HOY, 'cena', false], ['Banana', HOY, 'cena', false]]);
    expect(copia[0].momento).toBe('2026-10-22T00:00:00.000Z');
    expect(new Set([...copia, ...cena].map((r) => r.id)).size).toBe(4);
  });

  it('a un día que no llegó queda planificado, y a otra comida si se pide', () => {
    const copia = copiar([...cena, almuerzo], { dia: ayer }, { dia: sumarDias(HOY, 2), comida: 'snack' }, op);
    expect(copia).toHaveLength(3);
    expect(copia.every((r) => r.planificado && r.comida === 'snack')).toBe(true);
  });

  it('confirmar pasa lo planificado de ese día a registrado', () => {
    const plan = copiar(cena, { dia: ayer }, { dia: sumarDias(HOY, 1) }, op);
    const hechos = confirmar(plan, sumarDias(HOY, 1), '2026-10-22T12:00:00.000Z');
    expect(hechos.map((r) => [r.planificado, r.actualizado])).toEqual([[false, '2026-10-22T12:00:00.000Z'], [false, '2026-10-22T12:00:00.000Z']]);
    expect(confirmar(plan, HOY, op.ahora)).toEqual([]);
  });

  it('«Comí esto» confirma solo esa comida', () => {
    const manana = sumarDias(HOY, 1);
    const plan = copiar([...cena, almuerzo], { dia: ayer }, { dia: manana }, op);
    expect(confirmar(plan, manana, op.ahora, 'cena').map((r) => [r.nombre, r.comida, r.planificado])).toEqual([['Arroz blanco', 'cena', false], ['Banana', 'cena', false]]);
    expect(confirmar(plan, manana, op.ahora, 'desayuno')).toEqual([]);
  });

  it('borrar deja la marca con su hora, y deshacer la saca', () => {
    const r = cena[0];
    const b = borrado(r, '2026-10-21T22:00:00.000Z');
    expect(b).toMatchObject({ borrado: true, actualizado: '2026-10-21T22:00:00.000Z' });
    const vuelve = restaurado(b, '2026-10-21T22:00:05.000Z');
    expect('borrado' in vuelve).toBe(false);
    expect(vuelve).toEqual({ ...r, actualizado: '2026-10-21T22:00:05.000Z' });
  });
});

describe('los hábitos de comida', () => {
  const meta = { kcal: 2000, proteina: 120, carbohidratos: 230, grasas: 66 };
  const pollo = (gramos: number) => itemDeAlimento('base', '1', 'Pechuga', { kcal: 165, proteina: 31, carbohidratos: 0, grasas: 3.6 }, { gramos });

  it('la proteína: se enciende al llegar a la meta, sin contar lo planificado', () => {
    const almuerzo = reg(pollo(200), HOY, 'almuerzo', 13);
    expect(cumpleLaComida('proteina', [almuerzo], HOY, meta)).toBe(false);
    const cena = reg(pollo(200), HOY, 'cena', 21);
    expect(cumpleLaComida('proteina', [almuerzo, cena], HOY, meta)).toBe(true);
    expect(cumpleLaComida('proteina', [almuerzo, { ...cena, planificado: true }], HOY, meta)).toBe(false);
    expect(cumpleLaComida('proteina', [almuerzo, cena], HOY, null)).toBe(false);
  });

  it('registrar todas las comidas: desayuno, almuerzo y cena, o las que elija el hábito', () => {
    const tres = [reg(banana(), HOY, 'desayuno', 8), reg(arroz(), HOY, 'almuerzo', 13)];
    expect(cumpleLaComida('registrar', tres, HOY, meta)).toBe(false);
    expect(cumpleLaComida('registrar', [...tres, reg(arroz(), HOY, 'cena', 21)], HOY, meta)).toBe(true);
    expect(cumpleLaComida('registrar', tres, HOY, meta, ['desayuno', 'almuerzo'])).toBe(true);
  });

  it('las calorías: a menos de un 10 % de la meta, de más o de menos; pasarse la apaga', () => {
    const cerca = [reg(itemRapido('Todo', { kcal: 1850, proteina: 0, carbohidratos: 0, grasas: 0 }), HOY, 'cena', 21)];
    expect(cumpleLaComida('calorias', cerca, HOY, meta)).toBe(true);
    const mucho = [...cerca, reg(itemRapido('Postre', { kcal: 400, proteina: 0, carbohidratos: 0, grasas: 0 }), HOY, 'cena', 22)];
    expect(cumpleLaComida('calorias', mucho, HOY, meta)).toBe(false);
    expect(cumpleLaComida('calorias', [], HOY, meta)).toBe(false);
  });
});

describe('las recetas y las comidas guardadas', () => {
  const tarta: Receta = {
    id: 'tarta', tipo: 'receta', nombre: 'Tarta de verduras', porciones: 6, pesoFinal: 900, actualizado: HOY,
    items: [arroz(600), banana(2)],
  };

  it('vale lo que suman sus ingredientes; una porción, la parte, y 100 g, por el peso final', () => {
    const v = valoresDeReceta(tarta);
    expect(v.total.kcal).toBeCloseTo(780 + 210.04, 6);
    expect(v.porcion.kcal).toBeCloseTo((780 + 210.04) / 6, 6);
    expect(v.por100g!.kcal).toBeCloseTo(((780 + 210.04) / 900) * 100, 6);
    expect(valoresDeReceta({ ...tarta, pesoFinal: null }).gramos).toBe(836);
  });

  it('una receta pesada terminada se registra en gramos: 250 g son la parte de 900', () => {
    const plato = itemDeRecetaEnGramos(tarta, 250)!;
    expect(plato.cantidad).toEqual({ gramos: 250 });
    expect(plato.valores.kcal).toBeCloseTo(((780 + 210.04) / 900) * 250, 6);
    expect(itemDeRecetaEnGramos({ ...tarta, pesoFinal: null, items: [] }, 250)).toBeNull();
  });

  it('una receta se registra como un alimento, por porciones; una comida guardada, con cada uno de los suyos', () => {
    const una = itemDeReceta(tarta, 2, '1 porción');
    expect(una).toMatchObject({ fuente: 'receta', ref: 'tarta', nombre: 'Tarta de verduras', cantidad: { porcion: '1 porción', gramosPorcion: 150, veces: 2 } });
    expect(una.valores.kcal).toBeCloseTo(((780 + 210.04) / 6) * 2, 6);
    expect(itemsParaRegistrar({ ...tarta, tipo: 'comida' }, '1 porción').map((i) => i.nombre)).toEqual(['Arroz blanco', 'Banana']);
  });

  it('escalar también lleva lo secundario', () => {
    expect(escalar(BANANA, 0.5).sodio).toBe(0.5);
  });
});

describe('los atajos', () => {
  const dias = (n: number) => sumarDias(HOY, -n);

  it('la última cantidad de un alimento', () => {
    const lista = [reg(banana(1), dias(3), 'merienda', 17), reg(banana(2), dias(1), 'merienda', 17), reg(arroz(), dias(0), 'cena', 21)];
    expect(ultimaCantidad(lista, 'base', '1105314')).toEqual({ porcion: '1 mediana', gramosPorcion: 118, veces: 2 });
    expect(ultimaCantidad(lista, 'base', 'otro')).toBeUndefined();
  });

  it('los recientes, sin repetir y sin la carga rápida', () => {
    const lista = [reg(banana(), dias(2), 'merienda', 17), reg(arroz(), dias(1), 'cena', 21), reg(banana(), dias(0), 'desayuno', 8), reg(itemRapido('Alfajor', ARROZ), dias(0), 'snack', 10)];
    expect(recientes(lista).map((i) => i.nombre)).toEqual(['Banana', 'Arroz blanco']);
  });

  it('lo que solés comer en esa comida: dos veces al menos, y lo reciente pesa más', () => {
    const lista = [
      reg(banana(), dias(1), 'merienda', 17), reg(banana(), dias(2), 'merienda', 17),
      reg(arroz(), dias(40), 'merienda', 17), reg(arroz(), dias(41), 'merienda', 17), reg(arroz(), dias(42), 'merienda', 17),
      reg(arroz(), dias(1), 'cena', 21),
      reg(itemDeAlimento('base', '1', 'Mate', ARROZ, { gramos: 10 }), dias(3), 'merienda', 17),
    ];
    expect(sueles(lista, 'merienda', HOY).map((i) => i.nombre)).toEqual(['Banana', 'Arroz blanco']);
    expect(sueles(lista, 'cena', HOY)).toEqual([]);
  });

  it('el premio del buscador: lo usado sube, lo de esta semana un poco más, y tiene tope', () => {
    const muchas = Array.from({ length: 40 }, (_, i) => reg(banana(), dias(i % 5), 'merienda', 17));
    const p = premios([...muchas, reg(arroz(), dias(60), 'cena', 21), reg(itemDeAlimento('propio', 'x', 'Propio', ARROZ, { gramos: 10 }), dias(0), 'cena', 21)], HOY);
    expect(p.get(1105314)).toBe(10);
    expect(p.get(168878)!).toBeGreaterThan(0);
    expect(p.get(168878)!).toBeLessThan(2);
    expect(p.size).toBe(2);
  });
});
