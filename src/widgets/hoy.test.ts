import { describe, expect, it, jest } from '@jest/globals';

import { crearAlmacen, type Almacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import type { Comida } from '../dominio/comidas';
import { minutosEnElDia, sumarDias, type ClaveDia } from '../dominio/fechas';
import type { Item, Registro } from '../dominio/registros';
import { DIAS_ARMADOS } from './cielo';
import { aplicarToquesDeHoy, deshacerDeLaLinea, lineaDeHoy, repartirToquesDeHoy, toquesDeHoy, type DelToque } from './hoy';
import type { PropsHoy } from './tipos';

const HOY: ClaveDia = '2026-10-21';
const NOMBRES = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', merienda: 'Merienda', cena: 'Cena', snack: 'Snack' } as Record<Comida, string>;
const TEXTOS = {} as PropsHoy['textos'];
const URLS = {} as PropsHoy['urls'];
const valores = (kcal: number) => ({ kcal, proteina: kcal / 40, carbohidratos: kcal / 10, grasas: kcal / 90 });

let n = 0;
function registro(dia: ClaveDia, comida: Comida, nombre: string, kcal: number, extra: Partial<Registro> = {}): Registro {
  n += 1;
  return {
    id: `r${n}`, fuente: 'base', ref: nombre, nombre, cantidad: null, valores: valores(kcal), dia, comida, momento: `${dia}T12:00:00.000Z`,
    planificado: false, actualizado: `${dia}T12:00:00.000Z`, ...extra,
  } as Registro;
}
const mapa = (lista: Registro[]) => new Map(lista.map((r) => [r.id, r]));

/** La cena de siempre: los mismos dos alimentos, dos noches en las últimas dos semanas. */
const conCenaDeSiempre = () => [-1, -3].flatMap((k) => {
  const dia = sumarDias(HOY, k);
  return [registro(dia, 'cena', 'Fideos', 400), registro(dia, 'cena', 'Tuco', 150)];
});

const linea = (registros: Map<string, Registro>, deshacer?: Map<string, DelToque>) =>
  lineaDeHoy({ hoy: HOY, registros, corte: 240 }, { metaDe: () => ({ kcal: 2000, proteina: 150, carbohidratos: 200, grasas: 60 }), nombres: NOMBRES, textos: TEXTOS, urls: URLS, deshacer });

describe('la línea de Hoy', () => {
  it('lleva una entrada por día, desde que empieza cada día, con las cuatro comidas a la vista', () => {
    const l = linea(mapa([]));
    expect(l).toHaveLength(DIAS_ARMADOS);
    expect(l[0].date.getHours()).toBe(4);
    expect(l[1].props.dia).toBe(sumarDias(HOY, 1));
    expect(l[0].props.comidas.map((c) => c.tipo)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena']);
    expect(l[0].props.pendientes).toEqual([]);
  });

  it('suma lo comido y deja lo planificado para un toque', () => {
    const l = linea(mapa([registro(HOY, 'almuerzo', 'Milanesa', 600), registro(HOY, 'cena', 'Sopa', 300, { planificado: true })]));
    expect(l[0].props.comido.kcal).toBe(600);
    const cena = l[0].props.comidas.find((c) => c.tipo === 'cena')!;
    expect(cena.anotado.kcal).toBe(0);
    expect(cena.siempre.kcal).toBe(300);
    expect(cena.items).toBe('');
  });

  it('el snack aparece si se anotó, y va por su hora', () => {
    const l = linea(mapa([registro(HOY, 'snack', 'Manzana', 90, { momento: `${HOY}T14:00:00.000Z` })]));
    expect(l[0].props.comidas.map((c) => c.tipo)).toContain('snack');
    expect(l[1].props.comidas.map((c) => c.tipo)).not.toContain('snack');
  });

  it('lo de siempre viaja en la entrada, para anotar justo eso', () => {
    const cena = linea(mapa(conCenaDeSiempre()))[0].props.comidas.find((c) => c.tipo === 'cena')!;
    expect(cena.siempre.kcal).toBe(550);
    expect(cena.detalle).toBe('Fideos, Tuco');
    expect((JSON.parse(cena.items) as Item[]).map((i) => i.nombre)).toEqual(['Fideos', 'Tuco']);
  });

  it('lo de deshacer se olvida si esos registros ya no están', () => {
    const r = registro(HOY, 'cena', 'Fideos', 400);
    const deshacer = new Map([[`${HOY}|cena`, { ids: [r.id, 'otro'], confirmado: true }]]);
    expect(linea(mapa([r]), deshacer)[0].props.comidas.find((c) => c.tipo === 'cena')).toMatchObject({ deshacer: r.id, confirmado: true });
    expect(linea(mapa([]), deshacer)[0].props.comidas.find((c) => c.tipo === 'cena')).toMatchObject({ deshacer: '', confirmado: false });
  });

  it('lo del plan confirmado con un toque sigue siendo lo del plan: si se deshace, suma eso', () => {
    const sopa = registro(HOY, 'cena', 'Sopa', 300);
    const cena = linea(mapa([...conCenaDeSiempre(), sopa]), new Map([[`${HOY}|cena`, { ids: [sopa.id], confirmado: true }]]))[0].props.comidas.find((c) => c.tipo === 'cena')!;
    expect(cena).toMatchObject({ items: '', deshacer: sopa.id, confirmado: true, detalle: 'Sopa' });
    expect(cena.siempre.kcal).toBe(300);
  });
});

describe('lo tocado en Hoy', () => {
  const lineaConToque = (hecho: boolean, en: number, deshacer = '') => {
    const l = linea(mapa(conCenaDeSiempre()));
    const props = l[0].props;
    props.comidas = props.comidas.map((c) => (c.tipo === 'cena' ? { ...c, deshacer } : c));
    props.pendientes = [{ comida: 'cena', hecho, en }];
    return l;
  };
  const EN = Date.parse(`${HOY}T22:00:00.000Z`);

  it('de cada día y comida queda el último toque, con lo que mostraba', () => {
    const l = lineaConToque(true, EN);
    l[0].props.pendientes = [{ comida: 'cena', hecho: true, en: EN }, { comida: 'cena', hecho: false, en: EN + 5 }];
    const t = toquesDeHoy(l);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ comida: 'cena', hecho: false, dia: HOY });
    expect(t[0].items.map((i) => i.nombre)).toEqual(['Fideos', 'Tuco']);
  });

  const repartir = (l: ReturnType<typeof linea>, e: Parameters<typeof repartirToquesDeHoy>[1]) => repartirToquesDeHoy(toquesDeHoy(l), e, deshacerDeLaLinea(l));

  it('anotar: con la hora del toque', () => {
    const r = repartir(lineaConToque(true, EN), { hoy: HOY, registros: mapa(conCenaDeSiempre()) });
    expect(r.anotar).toHaveLength(1);
    expect(r.anotar[0]).toMatchObject({ dia: HOY, comida: 'cena', en: EN });
  });

  it('un toque nunca anota dos veces, aunque la línea no haya llegado a escribirse', () => {
    const ya = registro(HOY, 'cena', 'Fideos', 400, { momento: new Date(EN).toISOString() });
    const r = repartir(lineaConToque(true, EN), { hoy: HOY, registros: mapa([...conCenaDeSiempre(), ya]) });
    expect(r.anotar).toEqual([]);
    expect(r.yaAnotado).toEqual([{ clave: `${HOY}|cena`, ids: [ya.id], confirmado: false }]);
  });

  it('otro toque saca lo que se había anotado desde el widget, también después de abrir Moss', () => {
    const r = repartir(lineaConToque(false, EN, 'a,b'), { hoy: HOY, registros: mapa([]) });
    expect(r.quitar).toEqual([{ clave: `${HOY}|cena`, ids: ['a', 'b'], en: EN }]);
    expect(deshacerDeLaLinea(lineaConToque(false, EN, 'a,b')).get(`${HOY}|cena`)).toEqual({ ids: ['a', 'b'], confirmado: false });
  });

  it('otro toque en lo del plan confirmado con un toque lo vuelve a planificar, no lo borra', () => {
    const l = lineaConToque(false, EN, 'a,b');
    l[0].props.comidas = l[0].props.comidas.map((c) => (c.tipo === 'cena' ? { ...c, confirmado: true } : c));
    const r = repartir(l, { hoy: HOY, registros: mapa([]) });
    expect(r.volver).toEqual([{ clave: `${HOY}|cena`, ids: ['a', 'b'], en: EN }]);
    expect(r.quitar).toEqual([]);
  });

  it('tocar y destocar antes de abrir Moss no hace nada', () => {
    const r = repartir(lineaConToque(false, EN), { hoy: HOY, registros: mapa([]) });
    expect(r).toEqual({ anotar: [], confirmar: [], yaAnotado: [], quitar: [], volver: [] });
  });

  it('lo del plan se confirma a la hora del toque; lo de un día que no llegó o muy viejo se olvida', () => {
    const conPlan = linea(mapa([registro(HOY, 'cena', 'Sopa', 300, { planificado: true })]));
    conPlan[0].props.pendientes = [{ comida: 'cena', hecho: true, en: EN }];
    expect(repartir(conPlan, { hoy: HOY, registros: mapa([]) }).confirmar).toEqual([{ clave: `${HOY}|cena`, dia: HOY, comida: 'cena', en: EN }]);
    // Ya confirmado a la hora del toque (la línea no llegó a escribirse): no se confirma otra vez.
    const confirmada = registro(HOY, 'cena', 'Sopa', 300, { momento: new Date(EN).toISOString() });
    expect(repartir(conPlan, { hoy: HOY, registros: mapa([confirmada]) })).toMatchObject({ confirmar: [], yaAnotado: [{ clave: `${HOY}|cena`, ids: [confirmada.id], confirmado: true }] });
    const vieja = lineaConToque(true, EN);
    expect(repartir(vieja, { hoy: sumarDias(HOY, 30), registros: mapa([]) }).anotar).toEqual([]);
    expect(repartir(vieja, { hoy: sumarDias(HOY, -1), registros: mapa([]) }).anotar).toEqual([]);
  });
});

describe('lo tocado en Hoy, por el almacén', () => {
  const catalogo = datos.constelaciones as unknown as Constelacion[];
  const OPCIONES = { metaDe: () => null, nombres: NOMBRES, textos: TEXTOS, urls: URLS };
  /** Una hora de ese día en Montevideo (todo el año a −3), en milisegundos. */
  const aLas = (dia: ClaveDia, h: number, m = 0) => Date.parse(`${dia}T00:00:00.000-03:00`) + (h * 60 + m) * 60_000;

  /** Un almacén a las 7:00 del 21 de octubre en Montevideo, con su reloj. */
  async function armar() {
    let instante = new Date(aLas(HOY, 7));
    let ids = 0;
    const a = crearAlmacen({
      abrir: async () => repositorioEnMemoria(), catalogo, ahora: () => instante, zona: () => 'America/Montevideo', sembrar: () => [], nuevaSemilla: () => 's', nuevoId: () => `id${++ids}`,
    });
    await a.iniciar();
    return { a, ir: (ms: number) => { instante = new Date(ms); } };
  }
  const plato = (comida: Comida) => ({ comida, opcion: comida, items: [{ fuente: 'rapida' as const, ref: null, nombre: comida, cantidad: null, valores: valores(500) }], valores: valores(500) });
  const HORAS: Partial<Record<Comida, number>> = { desayuno: 8 * 60, almuerzo: 13 * 60, cena: 21 * 60 };
  const conPlan = (a: Almacen) => a.planificar(HOY, [plato('desayuno'), plato('almuerzo'), plato('cena')], (c) => HORAS[c] ?? 0);
  const de = (a: Almacen, comida: Comida) => [...a.estado().registros.values()].filter((r) => r.dia === HOY && r.comida === comida && !r.borrado);
  /** Lo que guarda el widget al tocar una comida (alTocar de Hoy.widget.tsx): el último toque de cada una. */
  const tocar = (l: ReturnType<typeof lineaDeHoy>, comida: Comida, hecho: boolean, en: number) => {
    const otra = l.map((x) => ({ ...x, props: { ...x.props } }));
    otra[0].props.pendientes = [...otra[0].props.pendientes.filter((t) => t.comida !== comida), { comida, hecho, en }];
    return otra;
  };

  it('lo del plan tocado a las 8:05 se confirma a esa hora, aunque Moss se abra a las 12:30, y una sola vez', async () => {
    const { a, ir } = await armar();
    conPlan(a);
    const confirmar = jest.spyOn(a, 'confirmarComida');
    let l = tocar(lineaDeHoy(a.estado(), OPCIONES), 'desayuno', true, aLas(HOY, 8, 5));
    ir(aLas(HOY, 12, 30));
    const enEstaVuelta = new Map<string, DelToque | null>();
    aplicarToquesDeHoy(l, a, enEstaVuelta);
    expect(confirmar).toHaveBeenCalledWith(HOY, 'desayuno', new Date(aLas(HOY, 8, 5)).toISOString());
    expect(de(a, 'desayuno').map((r) => [r.planificado, r.momento])).toEqual([[false, new Date(aLas(HOY, 8, 5)).toISOString()]]);
    // Lo que sigue corre desde la hora del toque, no cuatro horas y media.
    expect(de(a, 'almuerzo').every((r) => minutosEnElDia(new Date(r.momento), HOY) < 13 * 60 + 30)).toBe(true);
    // Otro toque llegó entre las dos lecturas: la segunda pasada no confirma otra vez ni pierde el deshacer.
    l = tocar(l, 'cena', true, aLas(HOY, 12, 31));
    const deshacer = aplicarToquesDeHoy(l, a, enEstaVuelta);
    expect(confirmar.mock.calls.map((c) => c[1])).toEqual(['desayuno', 'cena']);
    expect(deshacer.get(`${HOY}|desayuno`)).toEqual({ ids: de(a, 'desayuno').map((r) => r.id), confirmado: true });
  });

  it('deshacer desde el widget lo del plan confirmado lo vuelve a planificar, como en Comida', async () => {
    const { a, ir } = await armar();
    conPlan(a);
    let l = tocar(lineaDeHoy(a.estado(), OPCIONES), 'cena', true, aLas(HOY, 21, 5));
    ir(aLas(HOY, 21, 10));
    let deshacer = aplicarToquesDeHoy(l, a, new Map());
    expect(de(a, 'cena').map((r) => r.planificado)).toEqual([false]);
    // Moss escribe la línea: la cena, anotada con un toque; otro toque, más tarde, la deshace.
    l = lineaDeHoy(a.estado(), { ...OPCIONES, deshacer });
    expect(l[0].props.comidas.find((c) => c.tipo === 'cena')).toMatchObject({ confirmado: true, items: '' });
    l = tocar(l, 'cena', false, aLas(HOY, 21, 20));
    ir(aLas(HOY, 21, 30));
    deshacer = aplicarToquesDeHoy(l, a, new Map());
    expect(deshacer.has(`${HOY}|cena`)).toBe(false);
    expect(de(a, 'cena').map((r) => r.planificado)).toEqual([true]);
  });

  /** Esa comida de siempre: los mismos dos alimentos, dos días en las últimas dos semanas. */
  const comidaDeSiempre = (a: Almacen, comida: Comida, hora: number) => {
    const items: Item[] = [{ fuente: 'base', ref: `${comida}1`, nombre: 'Fideos', cantidad: null, valores: valores(400) }, { fuente: 'base', ref: `${comida}2`, nombre: 'Tuco', cantidad: null, valores: valores(150) }];
    for (const k of [-1, -3]) a.registrar(items, { comida, dia: sumarDias(HOY, k), momento: new Date(aLas(sumarDias(HOY, k), hora)).toISOString() });
  };

  it('se aplica en el orden de los toques: el desayuno del plan de las 8:05 antes que el almuerzo de siempre de las 13:05', async () => {
    const { a, ir } = await armar();
    a.planificar(HOY, [plato('desayuno'), plato('cena')], (c) => HORAS[c] ?? 0);
    comidaDeSiempre(a, 'almuerzo', 13);
    let l = tocar(lineaDeHoy(a.estado(), OPCIONES), 'desayuno', true, aLas(HOY, 8, 5));
    l = tocar(l, 'almuerzo', true, aLas(HOY, 13, 5));
    ir(aLas(HOY, 13, 30));
    const deshacer = aplicarToquesDeHoy(l, a, new Map());
    // Si el almuerzo fuera primero, sacaría el desayuno del plan como «ya pasó» y no habría nada que confirmar.
    expect(de(a, 'desayuno').map((r) => [r.planificado, r.momento])).toEqual([[false, new Date(aLas(HOY, 8, 5)).toISOString()]]);
    expect(deshacer.get(`${HOY}|desayuno`)).toEqual({ ids: de(a, 'desayuno').map((r) => r.id), confirmado: true });
    expect(de(a, 'almuerzo')).toHaveLength(2);
  });

  it('lo de siempre tocado y deshecho mientras Moss lo aplica no queda anotado', async () => {
    const { a, ir } = await armar();
    comidaDeSiempre(a, 'cena', 21);
    let l = tocar(lineaDeHoy(a.estado(), OPCIONES), 'cena', true, aLas(HOY, 21, 5));
    ir(aLas(HOY, 21, 6));
    const enEstaVuelta = new Map<string, DelToque | null>();
    aplicarToquesDeHoy(l, a, enEstaVuelta);
    expect(de(a, 'cena')).toHaveLength(2);
    // Entre las dos lecturas, otro toque lo deshizo: la línea que se vuelve a leer todavía no dice qué se anotó.
    l = tocar(l, 'cena', false, aLas(HOY, 21, 5) + 30_000);
    const deshacer = aplicarToquesDeHoy(l, a, enEstaVuelta);
    expect(de(a, 'cena')).toEqual([]);
    expect(deshacer.has(`${HOY}|cena`)).toBe(false);
  });
});
