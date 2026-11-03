import { describe, expect, it } from '@jest/globals';

import { crearAlmacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { aguaDelDia, vigentes, type TomaDeAgua } from '../dominio/registros';
import { lineaDelAgua, repartirAgua, toquesDelAgua, VASO_ML } from './agua';
import { lineaDeAnotar } from './anotar';
import type { PropsAgua } from './tipos';

const HOY = '2026-10-21';
const TEXTOS = {} as PropsAgua['textos'];
const toma = (id: string, ml: number, momento: string, dia = HOY): TomaDeAgua => ({ id, dia, ml, momento, actualizado: momento });
const agua = (...t: TomaDeAgua[]) => new Map(t.map((x) => [x.id, x]));
/** Una hora de hoy en UTC, en milisegundos. */
const a = (hora: string) => Date.parse(`${HOY}T${hora}:00.000Z`);

describe('el agua en el widget', () => {
  it('una entrada por día, con lo que tomó hoy', () => {
    const l = lineaDelAgua({ hoy: HOY, agua: agua(toma('a', 500, `${HOY}T10:00:00.000Z`)) }, { meta: 2000, textos: TEXTOS, url: 'moss://inicio' });
    expect(l[0].props.ml).toBe(500);
    expect(l[1].props.ml).toBe(0);
    expect(l[0].props.pendientes).toEqual([]);
  });

  it('cada vaso tocado es una toma, a la hora de su toque, y se suma una sola vez', () => {
    const l = lineaDelAgua({ hoy: HOY, agua: agua() }, { meta: 2000, textos: TEXTOS, url: '' });
    const en = a('22:00');
    l[0].props.pendientes = [{ vasos: 1, en }, { vasos: 1, en: en + 400 }];
    expect(toquesDelAgua(l)).toEqual([{ dia: HOY, vasos: 1, en }, { dia: HOY, vasos: 1, en: en + 400 }]);
    expect(repartirAgua(toquesDelAgua(l), { hoy: HOY, agua: agua() }).sumar).toEqual([{ dia: HOY, ml: VASO_ML, en }, { dia: HOY, ml: VASO_ML, en: en + 400 }]);
    const ya = agua(toma('t', VASO_ML, new Date(en).toISOString()));
    expect(repartirAgua(toquesDelAgua(l), { hoy: HOY, agua: ya }).sumar).toEqual([{ dia: HOY, ml: VASO_ML, en: en + 400 }]);
  });

  it('el «−» saca el último vaso que había a la hora del toque', () => {
    const tomas = agua(toma('a', 250, `${HOY}T09:00:00.000Z`), toma('b', 250, `${HOY}T11:00:00.000Z`), toma('c', 250, '2026-10-20T11:00:00.000Z', '2026-10-20'));
    expect(repartirAgua([{ dia: HOY, vasos: -1, en: a('12:00') }], { hoy: HOY, agua: tomas }).quitar).toEqual(['b']);
    expect(repartirAgua([{ dia: HOY, vasos: -1, en: a('10:00') }], { hoy: HOY, agua: tomas }).quitar).toEqual(['a']);
  });

  it('un «+» y un «−» antes de abrir Moss no hacen nada', () => {
    expect(repartirAgua([{ dia: HOY, vasos: 1, en: a('22:00') }, { dia: HOY, vasos: -1, en: a('22:01') }], { hoy: HOY, agua: agua() })).toEqual({ sumar: [], quitar: [] });
  });
});

describe('el agua del widget, por el almacén', () => {
  const catalogo = datos.constelaciones as unknown as Constelacion[];

  /** Un almacén a las 10:00 del 21 de octubre en Montevideo; `aplicar` hace con la línea lo que hace Moss al abrirse. */
  async function armar() {
    let instante = new Date(a('13:00'));
    let ids = 0;
    const almacen = crearAlmacen({
      abrir: async () => repositorioEnMemoria(), catalogo, ahora: () => instante, zona: () => 'America/Montevideo', sembrar: () => [], nuevaSemilla: () => 's', nuevoId: () => `id${++ids}`,
    });
    await almacen.iniciar();
    const aplicar = (pendientes: PropsAgua['pendientes'], hora: string) => {
      instante = new Date(a(hora));
      const l = lineaDelAgua(almacen.estado(), { meta: 2000, textos: TEXTOS, url: '' });
      l[0].props.pendientes = pendientes;
      const r = repartirAgua(toquesDelAgua(l), almacen.estado());
      for (const x of r.sumar) almacen.sumarAgua(x.ml, { dia: x.dia, momento: new Date(x.en).toISOString() });
      for (const id of r.quitar) almacen.quitarAgua(id);
    };
    return { almacen, aplicar, ml: () => aguaDelDia(almacen.estado().agua.values(), HOY), tomas: () => vigentes(almacen.estado().agua.values()).map((t) => t.ml) };
  }

  it('tres «+» sin abrir Moss son tres vasos, y un «−» después saca uno', async () => {
    const x = await armar();
    x.aplicar([{ vasos: 1, en: a('13:01') }, { vasos: 1, en: a('13:02') }, { vasos: 1, en: a('13:03') }], '13:10');
    expect(x.tomas()).toEqual([250, 250, 250]);
    x.aplicar([{ vasos: -1, en: a('13:20') }], '13:30');
    expect(x.ml()).toBe(500);
  });

  it('la misma línea leída dos veces, o con un toque más, no saca ni suma de más', async () => {
    const x = await armar();
    for (const hora of ['10:00', '11:00', '12:00', '12:30']) x.almacen.sumarAgua(250, { momento: new Date(a(hora)).toISOString() });
    const menos = { vasos: -1, en: a('13:20') };
    x.aplicar([menos], '13:30');
    x.aplicar([menos], '13:31');
    expect(x.ml()).toBe(750);
    x.aplicar([menos, { vasos: -1, en: a('13:32') }], '13:33');
    expect(x.ml()).toBe(500);
    const mas = { vasos: 1, en: a('13:40') };
    x.aplicar([mas], '13:41');
    x.aplicar([mas, { vasos: 1, en: a('13:42') }], '13:43');
    x.aplicar([mas, { vasos: 1, en: a('13:42') }], '13:44');
    expect(x.ml()).toBe(1000);
    // Un «−» después de un «+» ya sumado saca ese vaso.
    x.aplicar([mas, { vasos: 1, en: a('13:42') }, { vasos: -1, en: a('13:50') }], '13:51');
    expect(x.ml()).toBe(750);
  });
});

describe('el título de Anotar', () => {
  const titulos = { desayuno: 'Anotar el desayuno', almuerzo: 'Anotar el almuerzo', merienda: 'Anotar la merienda', cena: 'Anotar la cena', snack: 'Anotar un snack' };
  const anotar = (ahora: Date, d: Partial<Parameters<typeof lineaDeAnotar>[1]> = {}) =>
    lineaDeAnotar(ahora, { titulos, queda: () => '', corte: 240, acciones: [], url: 'moss://anotar?comida={comida}', decirTitulo: '', ...d });

  it('cambia con la comida de la hora, sin abrir Moss, y en orden', () => {
    const l = anotar(new Date(2026, 9, 21, 11, 40));
    expect(l[0].props.titulo).toBe('Anotar un snack');
    expect(l[1].date.getHours()).toBe(12);
    expect(l[1].props.titulo).toBe('Anotar el almuerzo');
    expect(l.map((e) => e.props.titulo)).toContain('Anotar la cena');
    const tiempos = l.map((e) => e.date.getTime());
    expect([...tiempos].sort((a, b) => a - b)).toEqual(tiempos);
  });

  it('cada entrada abre la hoja en la comida de su título', () => {
    const l = anotar(new Date(2026, 9, 21, 8, 30));
    const comidaDe = (titulo: string) => Object.entries(titulos).find(([, x]) => x === titulo)![0];
    expect(new Set(l.map((e) => e.props.url)).size).toBeGreaterThan(1);
    for (const e of l) expect(e.props.url).toBe(`moss://anotar?comida=${comidaDe(e.props.titulo)}`);
  });

  it('lo que queda es el de su día: a la madrugada, el de ayer, y desde el corte, el del día nuevo', () => {
    const queda = (dia: string) => (dia === HOY ? 'te quedan 150' : 'te quedan 2.000');
    const l = anotar(new Date(2026, 9, 21, 22, 0), { queda, corte: 300 });
    const alCorte = new Date(2026, 9, 22, 5, 0).getTime();
    expect(l.filter((e) => e.date.getTime() < alCorte).map((e) => e.props.queda)).toEqual(expect.arrayContaining(['te quedan 150']));
    expect(l.filter((e) => e.date.getTime() < alCorte).every((e) => e.props.queda === 'te quedan 150')).toBe(true);
    // Con el corte a las 5, el desayuno empieza a las 4 y el día nuevo a las 5: ahí va otra entrada.
    expect(l.find((e) => e.date.getTime() === alCorte)?.props).toMatchObject({ titulo: 'Anotar el desayuno', queda: 'te quedan 2.000' });
  });
});
