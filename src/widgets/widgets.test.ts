// Los dos widgets corren en la extensión, en un JavaScript aparte que solo tiene los componentes de
// Expo UI: acá se arman como lo hace el armado de la app (la función con 'widget' pasa a texto) y se
// corren en un contexto vacío con solo esos nombres. Si usaran algo de afuera, fallarían acá igual
// que en el iPhone. También se tocan sus botones como lo hace la extensión: lo que devuelve el toque
// se suma a las props y se vuelve a dibujar.

import { describe, expect, it, jest } from '@jest/globals';
import vm from 'node:vm';

import type { PropsCielo, PropsNoche } from './tipos';

jest.mock('expo-widgets', () => ({ createWidget: (nombre: string, layout: unknown, inicial: unknown) => ({ nombre, layout, inicial }) }));

type Nodo = { type: unknown; key: string | null; props: Record<string, unknown> };
type Armado = { nombre: string; layout: unknown; inicial: unknown };

const COMPONENTES = ['VStack', 'HStack', 'ZStack', 'Text', 'Circle', 'Rectangle', 'Spacer', 'Button', 'Image'];
const MODIFICADORES = [
  'accessibilityLabel', 'accessibilityValue', 'buttonBorderShape', 'buttonStyle', 'containerBackground', 'contentTransition', 'controlSize', 'font', 'foregroundStyle',
  'frame', 'lineLimit', 'minimumScaleFactor', 'monospacedDigit', 'offset', 'opacity', 'rotationEffect', 'shadow', 'widgetURL',
];

/** El widget como función, corriendo en un contexto con solo lo que tiene la extensión. */
function enLaExtension(armado: Armado): (props: object, entorno: object) => Nodo {
  expect(typeof armado.layout).toBe('string');
  const elemento = (type: unknown, props: Record<string, unknown>, key?: string) => ({ type, key: key ?? null, props });
  const globales: Record<string, unknown> = { _jsx: elemento, _jsxs: elemento, jsx: elemento, jsxs: elemento, _Fragment: 'Fragment', Fragment: 'Fragment' };
  for (const c of COMPONENTES) globales[c] = c;
  for (const m of MODIFICADORES) globales[m] = (...args: unknown[]) => ({ modificador: m, args });
  return vm.runInNewContext(`(${armado.layout as string})`, globales);
}

function todos(n: unknown, tipo: string, lista: Nodo[] = []): Nodo[] {
  if (Array.isArray(n)) n.forEach((x) => todos(x, tipo, lista));
  else if (n && typeof n === 'object' && 'props' in n) {
    const nodo = n as Nodo;
    if (nodo.type === tipo) lista.push(nodo);
    todos(nodo.props.children, tipo, lista);
  }
  return lista;
}
const textos = (n: Nodo) => todos(n, 'Text').map((t) => [t.props.children].flat().join(''));

const CIELO: PropsCielo = {
  dia: '2026-10-21',
  nombre: 'Lira',
  estrellas: [[0.69, 0.12, 0.87], [0.31, 1, 0.23], [0.47, 0.91, 0.19], [0.4, 0.4, 0.02], [0.56, 0.3, 0.01], [0.57, 0, 0]],
  lineas: [[0, 4], [0, 5], [1, 2], [1, 3], [2, 4], [3, 4], [4, 5]],
  habitos: [
    { id: 'meditar', nombre: 'Meditar', aMano: true, hecho: true }, { id: 'dormir', nombre: 'Dormir 7 h', aMano: false, hecho: true },
    { id: 'leer', nombre: 'Leer', aMano: true, hecho: true }, { id: 'escribir', nombre: 'Escribir', aMano: true, hecho: false },
    { id: 'pasos', nombre: '8.000 pasos', aMano: false, hecho: false }, { id: 'agua', nombre: 'Agua', aMano: true, hecho: false },
  ],
  pendientes: [],
  atrasados: [],
  textos: { cuenta: '{n} de {total}', solos: 'Solos', sinHabitos: 'Nada hoy', hecho: 'Hecho', sinHacer: 'Sin hacer' },
  url: 'moss://',
};

/** Lo que hace la extensión con un toque: llama al botón y suma lo que devuelve a las props. */
function tocar<P extends object>(dibujar: (p: P, e: object) => Nodo, props: P, entorno: object, destino: string): P {
  const boton = todos(dibujar(props, entorno), 'Button').find((b) => b.props.target === destino);
  expect(boton).toBeDefined();
  const nuevas = (boton!.props.onPress as () => object)();
  return { ...props, ...nuevas };
}

describe('el widget del cielo, en la extensión', () => {
  const armado = jest.requireActual<{ default: Armado }>('./Cielo.widget').default;
  const dibujar = enLaExtension(armado);

  it('se registra como Cielo y el chico cuenta lo encendido, sin botones', () => {
    expect(armado.nombre).toBe('Cielo');
    const chico = dibujar(CIELO, { widgetFamily: 'systemSmall' });
    expect(textos(chico)).toEqual(['3 de 6', 'Lira']);
    expect(todos(chico, 'Button')).toHaveLength(0);
    // Una estrella por hábito y una línea por cada línea de la constelación.
    expect(todos(chico, 'Circle')).toHaveLength(6);
    expect(todos(chico, 'Rectangle')).toHaveLength(7);
  });

  it('el mediano lleva hasta cuatro «hecho», de los que se marcan a mano, con el día en el destino', () => {
    const mediano = dibujar(CIELO, { widgetFamily: 'systemMedium' });
    expect(todos(mediano, 'Button').map((b) => b.props.target)).toEqual(['hecho|2026-10-21|meditar', 'hecho|2026-10-21|leer', 'hecho|2026-10-21|escribir', 'hecho|2026-10-21|agua']);
  });

  it('un toque queda en los pendientes y se ve: la estrella y la cuenta; otro toque lo deshace', () => {
    const entorno = { widgetFamily: 'systemMedium' };
    const antes = Date.now();
    const una = tocar(dibujar, CIELO, entorno, 'hecho|2026-10-21|escribir');
    expect(una.pendientes).toHaveLength(1);
    expect(una.pendientes[0]).toMatchObject({ id: 'escribir', hecho: true });
    expect(una.pendientes[0].en).toBeGreaterThanOrEqual(antes);
    expect(textos(dibujar(una, entorno))[0]).toBe('4 de 6');
    const icono = todos(dibujar(una, entorno), 'Image')[2];
    expect(icono.props.systemName).toBe('circle.fill');
    // Tocar otra vez lo apaga: queda un solo pendiente por hábito, el último.
    const dos = tocar(dibujar, una, entorno, 'hecho|2026-10-21|escribir');
    expect(dos.pendientes).toEqual([expect.objectContaining({ id: 'escribir', hecho: false })]);
    expect(textos(dibujar(dos, entorno))[0]).toBe('3 de 6');
  });

  it('sin hábitos hoy, o antes de que Moss escriba la línea, se dibuja igual', () => {
    expect(textos(dibujar({ ...CIELO, habitos: [], estrellas: [], lineas: [] }, { widgetFamily: 'systemSmall' }))).toEqual(['Nada hoy']);
    expect(() => dibujar(armado.inicial as object, { widgetFamily: 'systemMedium' })).not.toThrow();
    expect(() => dibujar({}, {})).not.toThrow();
  });
});

describe('el widget de la noche, en la extensión', () => {
  const armado = jest.requireActual<{ default: Armado }>('./Noche.widget').default;
  const dibujar = enLaExtension(armado);
  const NOCHE: PropsNoche = {
    clave: '2026-10-21', titulo: 'Anoche', horas: '23:40 → 07:10', nota: '¿Fue así?', notaConfirmada: 'Confirmada · 7 h 30 min', si: 'Sí',
    pregunta: true, dormirse: 340, despertar: 790, confirmada: 0, hecha: false, url: 'moss://',
  };
  const entorno = { widgetFamily: 'accessoryRectangular' };

  it('se registra como Noche y propone con «Sí»; el toque la confirma ahí mismo', () => {
    expect(armado.nombre).toBe('Noche');
    expect(textos(dibujar(NOCHE, entorno))).toEqual(['Anoche', '23:40 → 07:10', '¿Fue así?']);
    const despues = tocar(dibujar, NOCHE, entorno, 'si|2026-10-21');
    expect(despues.confirmada).toBeGreaterThan(0);
    const otra = dibujar(despues, entorno);
    expect(todos(otra, 'Button')).toHaveLength(0);
    expect(textos(otra)).toEqual(['Anoche', '23:40 → 07:10', 'Confirmada · 7 h 30 min']);
  });

  it('con la noche ya contestada o medida, sin botón', () => {
    expect(todos(dibujar({ ...NOCHE, hecha: true }, entorno), 'Button')).toHaveLength(0);
    expect(todos(dibujar({ ...NOCHE, pregunta: false }, entorno), 'Button')).toHaveLength(0);
    expect(() => dibujar(armado.inicial as object, entorno)).not.toThrow();
  });
});
