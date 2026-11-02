import { describe, expect, it } from '@jest/globals';

import type { Comida } from '../dominio/comidas';
import { sumarDias, type ClaveDia } from '../dominio/fechas';
import type { Item, Registro } from '../dominio/registros';
import { DIAS_ARMADOS } from './cielo';
import { deshacerDeLaLinea, lineaDeHoy, repartirToquesDeHoy, toquesDeHoy } from './hoy';
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

const linea = (registros: Map<string, Registro>, deshacer?: Map<string, string>) =>
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
    const deshacer = new Map([[`${HOY}|cena`, `${r.id},otro`]]);
    expect(linea(mapa([r]), deshacer)[0].props.comidas.find((c) => c.tipo === 'cena')!.deshacer).toBe(r.id);
    expect(linea(mapa([]), deshacer)[0].props.comidas.find((c) => c.tipo === 'cena')!.deshacer).toBe('');
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

  it('anotar: con la hora del toque', () => {
    const r = repartirToquesDeHoy(toquesDeHoy(lineaConToque(true, EN)), { hoy: HOY, registros: mapa(conCenaDeSiempre()) });
    expect(r.anotar).toHaveLength(1);
    expect(r.anotar[0]).toMatchObject({ dia: HOY, comida: 'cena', en: EN });
  });

  it('un toque nunca anota dos veces, aunque la línea no haya llegado a escribirse', () => {
    const ya = registro(HOY, 'cena', 'Fideos', 400, { momento: new Date(EN).toISOString() });
    const r = repartirToquesDeHoy(toquesDeHoy(lineaConToque(true, EN)), { hoy: HOY, registros: mapa([...conCenaDeSiempre(), ya]) });
    expect(r.anotar).toEqual([]);
    expect(r.yaAnotado).toEqual([{ clave: `${HOY}|cena`, ids: [ya.id] }]);
  });

  it('otro toque saca lo que se había anotado desde el widget, también después de abrir Moss', () => {
    const r = repartirToquesDeHoy(toquesDeHoy(lineaConToque(false, EN, 'a,b')), { hoy: HOY, registros: mapa([]) });
    expect(r.quitar).toEqual([{ clave: `${HOY}|cena`, ids: ['a', 'b'] }]);
    expect(deshacerDeLaLinea(lineaConToque(false, EN, 'a,b')).get(`${HOY}|cena`)).toBe('a,b');
  });

  it('tocar y destocar antes de abrir Moss no hace nada', () => {
    const r = repartirToquesDeHoy(toquesDeHoy(lineaConToque(false, EN)), { hoy: HOY, registros: mapa([]) });
    expect(r).toEqual({ anotar: [], confirmar: [], yaAnotado: [], quitar: [] });
  });

  it('lo del plan se confirma; lo de un día que no llegó o muy viejo se olvida', () => {
    const conPlan = linea(mapa([registro(HOY, 'cena', 'Sopa', 300, { planificado: true })]));
    conPlan[0].props.pendientes = [{ comida: 'cena', hecho: true, en: EN }];
    expect(repartirToquesDeHoy(toquesDeHoy(conPlan), { hoy: HOY, registros: mapa([]) }).confirmar).toEqual([{ clave: `${HOY}|cena`, dia: HOY, comida: 'cena' }]);
    const vieja = lineaConToque(true, EN);
    expect(repartirToquesDeHoy(toquesDeHoy(vieja), { hoy: sumarDias(HOY, 30), registros: mapa([]) }).anotar).toEqual([]);
    expect(repartirToquesDeHoy(toquesDeHoy(vieja), { hoy: sumarDias(HOY, -1), registros: mapa([]) }).anotar).toEqual([]);
  });
});
