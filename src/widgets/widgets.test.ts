// Los widgets corren en la extensión, en un JavaScript aparte que solo tiene los componentes de
// Expo UI: acá se arman como lo hace el armado de la app (la función con 'widget' pasa a texto) y se
// corren en un contexto vacío con solo esos nombres. Si usaran algo de afuera, fallarían acá igual
// que en el iPhone. También se tocan sus botones como lo hace la extensión: lo que devuelve el toque
// se suma a las props y se vuelve a dibujar.

import { describe, expect, it, jest } from '@jest/globals';
import vm from 'node:vm';

import type { PropsAgua, PropsAnotar, PropsCielo, PropsHoy, PropsNoche } from './tipos';

jest.mock('expo-widgets', () => ({ createWidget: (nombre: string, layout: unknown, inicial: unknown) => ({ nombre, layout, inicial }) }));

type Nodo = { type: unknown; key: string | null; props: Record<string, unknown> };
type Armado = { nombre: string; layout: unknown; inicial: unknown };

const COMPONENTES = ['AccessoryWidgetBackground', 'VStack', 'HStack', 'ZStack', 'Text', 'Circle', 'Ellipse', 'Gauge', 'Link', 'Rectangle', 'Spacer', 'Button', 'Image', 'UnevenRoundedRectangle'];
const MODIFICADORES = [
  'accessibilityLabel', 'accessibilityValue', 'background', 'blur', 'buttonBorderShape', 'buttonStyle', 'containerBackground', 'contentTransition', 'controlSize', 'font', 'foregroundStyle',
  'frame', 'gaugeStyle', 'kerning', 'lineLimit', 'minimumScaleFactor', 'monospacedDigit', 'multilineTextAlignment', 'offset', 'opacity', 'padding', 'resizable', 'rotationEffect', 'shadow', 'strokeBorder', 'textCase', 'widgetURL',
];

/** El widget como función, corriendo en un contexto con solo lo que tiene la extensión. */
function enLaExtension(armado: Armado): (props: object, entorno: object) => Nodo {
  expect(typeof armado.layout).toBe('string');
  const elemento = (type: unknown, props: Record<string, unknown>, key?: string) => ({ type, key: key ?? null, props });
  const globales: Record<string, unknown> = { _jsx: elemento, _jsxs: elemento, jsx: elemento, jsxs: elemento, _Fragment: 'Fragment', Fragment: 'Fragment' };
  for (const c of COMPONENTES) globales[c] = c;
  for (const m of MODIFICADORES) globales[m] = (...args: unknown[]) => ({ modificador: m, args });
  globales.Mask = Object.assign(() => null, { Content: 'MaskContent' });
  globales.shapes = { roundedRectangle: () => ({}), capsule: () => ({}), circle: () => ({}) };
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
  url: 'moss://habitos',
  fondoNoche: 'file:///grupo/cielo-noche.jpg',
  fondoAurora: 'file:///grupo/cielo-aurora.jpg',
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
    // Una estrella por hábito, con rayos si está encendida, y una línea por cada línea de la constelación.
    expect(todos(chico, 'Circle')).toHaveLength(6);
    expect(todos(chico, 'Image').filter((i) => i.props.systemName === 'sparkle')).toHaveLength(3);
    expect(todos(chico, 'Rectangle').filter((r) => r.key?.startsWith('l'))).toHaveLength(7);
  });

  it('el mediano lleva hasta cuatro «hecho», lo que falta primero, con el día en el destino', () => {
    const mediano = dibujar(CIELO, { widgetFamily: 'systemMedium' });
    expect(todos(mediano, 'Button').map((b) => b.props.target)).toEqual(['hecho|2026-10-21|escribir', 'hecho|2026-10-21|agua', 'hecho|2026-10-21|meditar', 'hecho|2026-10-21|leer']);
  });

  it('un toque queda en los pendientes y se ve: la estrella y la cuenta; otro toque lo deshace', () => {
    const entorno = { widgetFamily: 'systemMedium' };
    const antes = Date.now();
    const una = tocar(dibujar, CIELO, entorno, 'hecho|2026-10-21|escribir');
    expect(una.pendientes).toHaveLength(1);
    expect(una.pendientes[0]).toMatchObject({ id: 'escribir', hecho: true });
    expect(una.pendientes[0].en).toBeGreaterThanOrEqual(antes);
    expect(textos(dibujar(una, entorno))[0]).toBe('4 de 6');
    // Lo recién tocado queda en su lugar, para poder deshacerlo.
    expect(todos(dibujar(una, entorno), 'Button')[0].props.target).toBe('hecho|2026-10-21|escribir');
    expect(todos(todos(dibujar(una, entorno), 'Button')[0], 'Image')[0].props.systemName).toBe('circle.fill');
    // Tocar otra vez lo apaga: queda un solo pendiente por hábito, el último.
    const dos = tocar(dibujar, una, entorno, 'hecho|2026-10-21|escribir');
    expect(dos.pendientes).toEqual([expect.objectContaining({ id: 'escribir', hecho: false })]);
    expect(textos(dibujar(dos, entorno))[0]).toBe('3 de 6');
  });

  const conFondo = (e: object, p: PropsCielo = CIELO) => todos(dibujar(p, e), 'Image').filter((i) => i.key === 'cielo').map((i) => i.props.uiImage);
  it('lleva el cielo de verdad de fondo; con el día completo, la aurora', () => {
    expect(conFondo({ widgetFamily: 'systemSmall', widgetRenderingMode: 'fullColor', showsContainerBackground: true })).toEqual([CIELO.fondoNoche]);
    const completo = { ...CIELO, habitos: CIELO.habitos.map((h) => ({ ...h, hecho: true })) };
    expect(conFondo({ widgetFamily: 'systemMedium', widgetRenderingMode: 'fullColor' }, completo)).toEqual([CIELO.fondoAurora]);
  });

  it('tintado, en StandBy o de noche, sin la imagen; y sin el archivo, tampoco', () => {
    expect(conFondo({ widgetFamily: 'systemSmall', widgetRenderingMode: 'accented' })).toEqual([]);
    expect(conFondo({ widgetFamily: 'systemSmall', showsContainerBackground: false })).toEqual([]);
    expect(conFondo({ widgetFamily: 'systemSmall', isLuminanceReduced: true })).toEqual([]);
    expect(conFondo({ widgetFamily: 'systemSmall' }, { ...CIELO, fondoNoche: '' })).toEqual([]);
  });

  it('el grande muestra todos los hábitos, y los que se encienden solos no llevan botón', () => {
    const grande = dibujar(CIELO, { widgetFamily: 'systemLarge' });
    expect(todos(grande, 'Button')).toHaveLength(4);
    expect(textos(grande)).toEqual(expect.arrayContaining(['Dormir 7 h', '8.000 pasos', 'Agua']));
  });

  it('el redondo de la pantalla bloqueada es la figura y cuántos van, sin imagen', () => {
    const redondo = dibujar(CIELO, { widgetFamily: 'accessoryCircular', widgetRenderingMode: 'vibrant' });
    expect(textos(redondo)).toEqual(['3/6']);
    expect(todos(redondo, 'Image').filter((i) => i.key === 'cielo')).toHaveLength(0);
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
    pregunta: true, dormirse: 340, despertar: 790, confirmada: 0, hecha: false, url: 'moss://sueno',
    aDormir: false, cifra: '7 h 30', falta: '', siLargo: 'Sí, fue así', fondo: '',
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

  const A_DORMIR: PropsNoche = { ...NOCHE, titulo: 'A dormir', horas: '23:15', cifra: '23:15', falta: 'en 1 h 30', nota: 'para despertarte a las 07:15', notaConfirmada: 'para despertarte a las 07:15', pregunta: false, aDormir: true };

  it('a la tardecita dice a qué hora, sin botón', () => {
    expect(textos(dibujar(A_DORMIR, entorno))).toEqual(['A dormir', '23:15', 'para despertarte a las 07:15']);
    expect(todos(dibujar(A_DORMIR, entorno), 'Button')).toHaveLength(0);
  });

  it('el chico y el redondo, para la próxima build', () => {
    const chico = { widgetFamily: 'systemSmall' };
    expect(textos(dibujar(NOCHE, chico))).toEqual(['Anoche', '7 h 30', '23:40 → 07:10', 'Sí, fue así']);
    expect(todos(dibujar(NOCHE, chico), 'Button').map((b) => b.props.target)).toEqual(['si|2026-10-21']);
    expect(textos(dibujar(A_DORMIR, chico))).toEqual(['A dormir', '23:15', 'en 1 h 30', 'para despertarte a las 07:15']);
    expect(textos(dibujar(A_DORMIR, { widgetFamily: 'accessoryCircular' }))).toEqual(['23:15']);
    expect(() => dibujar({} as PropsNoche, chico)).not.toThrow();
  });
});

describe('el widget Hoy, en la extensión', () => {
  const armado = jest.requireActual<{ default: Armado }>('./Hoy.widget').default;
  const dibujar = enLaExtension(armado);
  const vacio = { kcal: 0, p: 0, c: 0, g: 0 };
  const HOY: PropsHoy = {
    dia: '2026-10-21',
    meta: { kcal: 2600, p: 150, c: 325, g: 78 },
    comido: { kcal: 1575, p: 61, c: 210, g: 57 },
    comidas: [
      { tipo: 'desayuno', nombre: 'Desayuno', anotado: { kcal: 412, p: 12, c: 79, g: 7 }, detalle: 'Café con leche', siempre: vacio, items: '[]', deshacer: '', confirmado: false },
      { tipo: 'almuerzo', nombre: 'Almuerzo', anotado: { kcal: 792, p: 40, c: 90, g: 30 }, detalle: 'Milanesa', siempre: vacio, items: '[]', deshacer: '', confirmado: false },
      { tipo: 'merienda', nombre: 'Merienda', anotado: vacio, detalle: '', siempre: vacio, items: '[]', deshacer: '', confirmado: false },
      { tipo: 'cena', nombre: 'Cena', anotado: vacio, detalle: 'Fideos, Tuco', siempre: { kcal: 633, p: 21, c: 103, g: 14 }, items: '[{"nombre":"Fideos"}]', deshacer: '', confirmado: false },
    ],
    pendientes: [],
    textos: {
      teQuedan: 'Te quedan', deMas: 'Arriba de la meta', kcal: 'kcal', de: '{comido} de {meta}', anotado: 'Anotado', sinAnotar: 'Sin anotar', miles: '.',
      macros: { p: 'Proteína', c: 'Carbohidratos', g: 'Grasas' }, cortos: { p: 'P', c: 'C', g: 'G' }, buscar: 'Buscar', decir: 'Decir', codigo: 'Código',
    },
    urls: { anotar: 'moss://anotar', inicio: 'moss://inicio', comida: 'moss://comida', anotarComida: 'moss://anotar?comida={comida}', buscar: 'moss://anotar?via=buscar', decir: 'moss://anotar?via=decir', codigo: 'moss://anotar?via=codigo' },
    fondo: 'file:///grupo/cielo-noche.jpg',
  };
  const mediano = { widgetFamily: 'systemMedium' };

  it('se registra como Hoy; el chico dice lo que queda y lo que falta de cada macro', () => {
    expect(armado.nombre).toBe('Hoy');
    const t = textos(dibujar(HOY, { widgetFamily: 'systemSmall' }));
    expect(t).toEqual(expect.arrayContaining(['Te quedan', '1.025', 'kcal', '89', '115', '21']));
    expect(todos(dibujar(HOY, { widgetFamily: 'systemSmall' }), 'Button')).toHaveLength(0);
  });

  it('un toque en lo de siempre lo anota ahí mismo: «Anotado ✓», y otro toque lo deshace', () => {
    const antes = textos(dibujar(HOY, mediano));
    expect(antes).toEqual(expect.arrayContaining(['1.025', '+633']));
    const una = tocar(dibujar, HOY, mediano, 'comida|2026-10-21|cena');
    expect(una.pendientes).toEqual([expect.objectContaining({ comida: 'cena', hecho: true })]);
    const despues = dibujar(una, mediano);
    expect(textos(despues)).toEqual(expect.arrayContaining(['392', 'Anotado']));
    expect(textos(despues)).not.toContain('+633');
    expect(todos(despues, 'Image').map((i) => i.props.systemName)).toContain('checkmark');
    const dos = tocar(dibujar, una, mediano, 'comida|2026-10-21|cena');
    expect(dos.pendientes).toEqual([expect.objectContaining({ comida: 'cena', hecho: false })]);
    expect(textos(dibujar(dos, mediano))).toEqual(expect.arrayContaining(['1.025', '+633']));
  });

  it('lo anotado con un toque se deshace también después de abrir Moss', () => {
    const anotada: PropsHoy = {
      ...HOY,
      comido: { kcal: 2208, p: 82, c: 313, g: 71 },
      comidas: HOY.comidas.map((c) => (c.tipo === 'cena' ? { ...c, anotado: c.siempre, deshacer: 'r1,r2' } : c)),
    };
    expect(textos(dibujar(anotada, mediano))).toEqual(expect.arrayContaining(['392', 'Anotado']));
    const otra = tocar(dibujar, anotada, mediano, 'comida|2026-10-21|cena');
    expect(otra.pendientes[0].hecho).toBe(false);
    expect(textos(dibujar(otra, mediano))).toEqual(expect.arrayContaining(['1.025', '+633']));
  });

  it('lo anotado en Moss abre Comida, y sin comida de siempre, la hoja en esa comida', () => {
    const destinos = todos(dibujar(HOY, mediano), 'Link').map((l) => l.props.destination);
    expect(destinos).toEqual(['moss://comida', 'moss://comida', 'moss://anotar?comida={comida}'.replace('{comida}', 'merienda')]);
  });

  it('el grande lleva una fila por comida y los accesos', () => {
    const grande = dibujar(HOY, { widgetFamily: 'systemLarge' });
    expect(textos(grande)).toEqual(expect.arrayContaining(['1.575 de 2.600', 'Café con leche', 'Fideos, Tuco', 'Sin anotar', 'Buscar', 'Decir', 'Código']));
    expect(todos(grande, 'Link').map((l) => l.props.destination)).toEqual(expect.arrayContaining(['moss://anotar?via=buscar', 'moss://anotar?via=decir', 'moss://anotar?via=codigo']));
  });

  it('pasada la meta, lo dice y en oro', () => {
    const pasada = dibujar({ ...HOY, comido: { kcal: 2860, p: 153, c: 335, g: 103 } }, mediano);
    expect(textos(pasada)).toEqual(expect.arrayContaining(['Arriba de la meta', '260', '+3 g', '+10 g', '+25 g']));
  });

  it('en la pantalla bloqueada, en las tres formas, sin imagen', () => {
    expect(textos(dibujar(HOY, { widgetFamily: 'accessoryRectangular', widgetRenderingMode: 'vibrant' }))).toEqual(['Te quedan', '1.025 kcal', 'P 89 · C 115 · G 21']);
    expect(textos(dibujar(HOY, { widgetFamily: 'accessoryCircular', widgetRenderingMode: 'vibrant' }))).toEqual(['1.025']);
    expect(textos(dibujar(HOY, { widgetFamily: 'accessoryInline' }))).toEqual(['1.025 kcal · P 89']);
    expect(todos(dibujar(HOY, { widgetFamily: 'accessoryCircular', widgetRenderingMode: 'accented' }), 'Gauge')).toHaveLength(1);
  });

  it('antes de que Moss escriba la línea, se dibuja igual', () => {
    for (const widgetFamily of ['systemSmall', 'systemMedium', 'systemLarge', 'accessoryCircular', 'accessoryRectangular', 'accessoryInline']) {
      expect(() => dibujar(armado.inicial as object, { widgetFamily })).not.toThrow();
      expect(() => dibujar({}, { widgetFamily })).not.toThrow();
    }
  });
});

describe('los widgets Anotar y Agua, en la extensión', () => {
  const anotar = jest.requireActual<{ default: Armado }>('./Anotar.widget').default;
  const dibujarAnotar = enLaExtension(anotar);
  const ANOTAR: PropsAnotar = {
    titulo: 'Anotar la cena', queda: 'te quedan 1.025', url: 'moss://anotar?comida=cena', decirTitulo: 'Decir lo que comí', fondo: '',
    acciones: [
      { id: 'buscar', nombre: 'Buscar', url: 'moss://anotar?via=buscar', icono: 'magnifyingglass' }, { id: 'decir', nombre: 'Decir', url: 'moss://anotar?via=decir', icono: 'mic' },
      { id: 'codigo', nombre: 'Código', url: 'moss://anotar?via=codigo', icono: 'barcode.viewfinder' }, { id: 'etiqueta', nombre: 'Etiqueta', url: 'moss://anotar?via=etiqueta', icono: 'doc.text.viewfinder' },
    ],
  };

  it('el mediano abre cada acción; el chico, la elegida al editar el widget', () => {
    expect(anotar.nombre).toBe('Anotar');
    const mediano = dibujarAnotar(ANOTAR, { widgetFamily: 'systemMedium' });
    expect(textos(mediano)).toEqual(['Anotar la cena', 'te quedan 1.025', 'Buscar', 'Decir', 'Código', 'Etiqueta']);
    expect(todos(mediano, 'Link').map((l) => l.props.destination)).toHaveLength(4);
    expect(textos(dibujarAnotar(ANOTAR, { widgetFamily: 'systemSmall' }))).toEqual(['Decir lo que comí']);
    expect(textos(dibujarAnotar(ANOTAR, { widgetFamily: 'systemSmall', configuration: { accion: 'codigo' } }))).toEqual(['Código']);
    expect(() => dibujarAnotar({}, { widgetFamily: 'accessoryCircular' })).not.toThrow();
  });

  const agua = jest.requireActual<{ default: Armado }>('./Agua.widget').default;
  const dibujarAgua = enLaExtension(agua);
  const AGUA: PropsAgua = {
    dia: '2026-10-21', ml: 1250, meta: 2000, pendientes: [], url: 'moss://inicio', fondo: '',
    textos: { titulo: 'Agua', vasos: '{n} de {total} vasos', sumar: 'Sumar un vaso', quitar: 'Quitar un vaso', decimal: ',' },
  };

  it('el agua suma y saca de un toque, sin abrir Moss, y cada toque queda con su hora', () => {
    expect(agua.nombre).toBe('Agua');
    expect(textos(dibujarAgua(AGUA, {}))).toEqual(['Agua', '1,25 L', '5 de 8 vasos']);
    const antes = Date.now();
    const mas = tocar(dibujarAgua, AGUA, {}, 'agua|2026-10-21|mas');
    expect(mas.pendientes).toEqual([{ vasos: 1, en: expect.any(Number) }]);
    expect(mas.pendientes[0].en).toBeGreaterThanOrEqual(antes);
    expect(textos(dibujarAgua(mas, {}))).toEqual(['Agua', '1,5 L', '6 de 8 vasos']);
    const dos = tocar(dibujarAgua, mas, {}, 'agua|2026-10-21|mas');
    const menos = tocar(dibujarAgua, dos, {}, 'agua|2026-10-21|menos');
    expect(menos.pendientes.map((t) => t.vasos)).toEqual([1, 1, -1]);
    expect(textos(dibujarAgua(menos, {}))).toEqual(['Agua', '1,5 L', '6 de 8 vasos']);
  });

  it('sin vasos, no hay nada que sacar', () => {
    expect(todos(dibujarAgua({ ...AGUA, ml: 0 }, {}), 'Button').map((b) => b.props.target)).toEqual(['agua|2026-10-21|mas']);
    expect(() => dibujarAgua({}, {})).not.toThrow();
  });
});
