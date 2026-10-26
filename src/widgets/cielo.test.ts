import { describe, expect, it } from '@jest/globals';

import { crearAlmacen } from '../almacen/almacen';
import { repositorioEnMemoria } from '../almacen/repositorio';
import type { Constelacion } from '../datos/catalogo';
import datos from '../datos/constelaciones.json';
import { claveDeMarca } from '../dominio/dias';
import type { Habito } from '../dominio/habitos';
import { DIAS_ARMADOS, formaDeLaConstelacion, lineaDelCielo, repartirToques, toquesDeLaLinea, type ToqueConDia } from './cielo';
import type { PropsCielo } from './tipos';

const catalogo = datos.constelaciones as unknown as Constelacion[];
const TEXTOS = { cuenta: '{n} de {total}', solos: 'solos', sinHabitos: 'nada', hecho: 'Hecho', sinHacer: 'Sin hacer' };

const habito = (id: string, orden: number, extra: Partial<Habito> = {}): Habito => ({
  id, nombre: id, icono: 'star', dias: [0, 1, 2, 3, 4, 5, 6], fuente: { tipo: 'manual' }, orden, desde: '2026-10-19', ...extra,
});
const SEIS = () => [
  habito('meditar', 0), habito('dormir', 1, { fuente: { tipo: 'salud', dato: 'sueno', meta: 420 } }), habito('leer', 2),
  habito('escribir', 3), habito('pasos', 4, { fuente: { tipo: 'salud', dato: 'pasos', meta: 8000 } }), habito('agua', 5, { dias: [3] }),
];

/** Un almacén a las 21:00 del miércoles 21 de octubre en Montevideo, con su reloj. */
async function armar() {
  let instante = new Date('2026-10-22T00:00:00Z');
  const almacen = crearAlmacen({
    abrir: async () => repositorioEnMemoria(), catalogo, ahora: () => instante, zona: () => 'America/Montevideo', sembrar: SEIS, nuevaSemilla: () => 'semilla',
  });
  await almacen.iniciar();
  return { almacen, ir: (iso: string) => { instante = new Date(iso); } };
}

const linea = (e: Parameters<typeof lineaDelCielo>[0], atrasados: ToqueConDia[] = []) =>
  lineaDelCielo(e, { catalogo, idioma: 'es', textos: TEXTOS, url: 'moss://', atrasados });

/** Lo que el widget guarda al tocar un «hecho»: el toque en la entrada que se veía. */
const tocar = (l: { date: Date; props: PropsCielo }[], i: number, id: string, hecho: boolean, en: number) =>
  l.map((x, k) => (k === i ? { ...x, props: { ...x.props, pendientes: [...x.props.pendientes, { id, hecho, en }] } } : x));

describe('la línea de tiempo del widget del cielo', () => {
  it('arma hoy con lo hecho y los días que siguen apagados, cada uno desde su medianoche', async () => {
    const { almacen } = await armar();
    almacen.marcar('meditar', true, 'toque');
    const l = linea(almacen.estado());
    expect(l).toHaveLength(DIAS_ARMADOS);
    expect(l.map((x) => x.props.dia)).toEqual(['2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27']);
    // Cada entrada empieza a la medianoche del teléfono: a las 0:00 el widget pasa solo al día nuevo.
    l.forEach((x, k) => {
      expect([x.date.getHours(), x.date.getMinutes()]).toEqual([0, 0]);
      if (k) expect(x.date.getTime()).toBeGreaterThan(l[k - 1].date.getTime());
    });
    const hoy = l[0].props;
    expect(hoy.habitos.map((h) => [h.id, h.aMano, h.hecho])).toEqual([
      ['meditar', true, true], ['dormir', false, false], ['leer', true, false], ['escribir', true, false], ['pasos', false, false], ['agua', true, false],
    ]);
    // El jueves no toca el agua: cinco hábitos, otra constelación, todo apagado.
    expect(l[1].props.habitos.map((h) => h.id)).toEqual(['meditar', 'dormir', 'leer', 'escribir', 'pasos']);
    expect(l[1].props.habitos.every((h) => !h.hecho)).toBe(true);
    expect(l[1].props.estrellas).toHaveLength(5);
    // La constelación de cada día es la del cielo de ese día, con su nombre en el idioma de la app.
    const deHoy = catalogo.find((c) => c.id === almacen.estado().dias.get('2026-10-21')!.constelacion)!;
    expect(hoy.nombre).toBe(deHoy.nombres.es);
    expect(hoy.estrellas).toHaveLength(6);
    expect(hoy.textos).toEqual(TEXTOS);
  });

  it('la figura entra en la caja, con las estrellas que usa el día y sus líneas', () => {
    const lira = catalogo.find((c) => c.id === 'lyra')!;
    const f = formaDeLaConstelacion(lira, 4);
    expect(f.estrellas).toHaveLength(4);
    for (const [x, y, tam] of f.estrellas) for (const v of [x, y, tam]) expect(v >= 0 && v <= 1).toBe(true);
    expect(f.lineas.every(([a, b]) => a < 4 && b < 4)).toBe(true);
    expect(formaDeLaConstelacion(null, 3)).toEqual({ estrellas: [], lineas: [] });
    expect(formaDeLaConstelacion(lira, 0)).toEqual({ estrellas: [], lineas: [] });
  });

  it('nunca lleva null ni undefined (iOS no los guarda)', async () => {
    const { almacen } = await armar();
    const revisar = (x: unknown): void => {
      expect(x === null || x === undefined).toBe(false);
      if (Array.isArray(x)) x.forEach(revisar);
      else if (x && typeof x === 'object' && !(x instanceof Date)) Object.values(x).forEach(revisar);
    };
    revisar(linea(almacen.estado()).map((x) => x.props));
  });
});

describe('lo tocado en el widget', () => {
  it('de cada hábito y día queda el último toque, de las entradas y de lo atrasado', () => {
    const base = { dia: '2026-10-21', pendientes: [{ id: 'leer', hecho: true, en: 10 }, { id: 'agua', hecho: true, en: 30 }], atrasados: [{ id: 'leer', dia: '2026-10-20', hecho: true, en: 5 }] };
    const otra = { dia: '2026-10-21', pendientes: [{ id: 'leer', hecho: false, en: 20 }], atrasados: [] };
    const toques = toquesDeLaLinea([{ props: base }, { props: otra }, { props: null }, { props: { dia: 3, pendientes: 'x' } }]);
    expect(toques).toEqual(expect.arrayContaining([
      { id: 'leer', dia: '2026-10-21', hecho: false, en: 20 },
      { id: 'agua', dia: '2026-10-21', hecho: true, en: 30 },
      { id: 'leer', dia: '2026-10-20', hecho: true, en: 5 },
    ]));
    expect(toques).toHaveLength(3);
  });

  it('se aplica lo de hoy por el almacén y se ve en el cielo al abrir', async () => {
    const { almacen } = await armar();
    const ahora = Date.parse('2026-10-22T00:00:00Z');
    let l = linea(almacen.estado());
    l = tocar(l, 0, 'escribir', true, ahora + 1000);
    l = tocar(l, 0, 'leer', true, ahora + 2000);
    const r = repartirToques(toquesDeLaLinea(l), almacen.estado());
    expect(r.aplicar.map((x) => x.id).sort()).toEqual(['escribir', 'leer']);
    for (const x of r.aplicar) almacen.marcar(x.id, x.hecho, 'toque');
    const e = almacen.estado();
    expect(e.dias.get('2026-10-21')!.hechos).toEqual(['leer', 'escribir']);
    // La línea nueva ya no los trae pendientes: los trae hechos.
    const nueva = linea(e);
    expect(nueva[0].props.pendientes).toEqual([]);
    expect(nueva[0].props.habitos.filter((h) => h.hecho).map((h) => h.id)).toEqual(['leer', 'escribir']);
    // Volver a leer la misma línea no aplica nada otra vez.
    expect(repartirToques(toquesDeLaLinea(l), e).aplicar).toEqual([]);
  });

  it('gana el último: si en Moss cambió después del toque, el toque se olvida', async () => {
    const { almacen, ir } = await armar();
    const toque = { id: 'leer', dia: '2026-10-21', hecho: true, en: Date.parse('2026-10-22T00:00:00Z') };
    ir('2026-10-22T00:05:00Z');
    almacen.marcar('leer', false, 'toque');
    expect(repartirToques([toque], almacen.estado()).aplicar).toEqual([]);
    // Un toque más nuevo que lo de Moss sí se aplica.
    expect(repartirToques([{ ...toque, en: Date.parse('2026-10-22T00:06:00Z') }], almacen.estado()).aplicar).toHaveLength(1);
  });

  it('los automáticos, los hábitos que ya no están, lo que no cambia y los días que no llegaron se olvidan', async () => {
    const { almacen } = await armar();
    const en = Date.parse('2026-10-22T00:00:00Z');
    const r = repartirToques([
      { id: 'pasos', dia: '2026-10-21', hecho: true, en },
      { id: 'borrado', dia: '2026-10-21', hecho: true, en },
      { id: 'leer', dia: '2026-10-21', hecho: false, en },
      { id: 'leer', dia: '2026-10-22', hecho: true, en },
    ], almacen.estado());
    expect(r).toEqual({ aplicar: [], esperan: [] });
  });

  it('a la medianoche: lo tocado ayer espera en la primera entrada, hasta dos semanas', async () => {
    const { almacen, ir } = await armar();
    const l = tocar(linea(almacen.estado()), 0, 'escribir', true, Date.parse('2026-10-22T02:50:00Z'));
    // Moss se abre al otro día: hoy es el jueves y el toque era del miércoles.
    ir('2026-10-22T13:00:00Z');
    almacen.revisarDia();
    expect(almacen.estado().hoy).toBe('2026-10-22');
    const r = repartirToques(toquesDeLaLinea(l), almacen.estado());
    expect(r.aplicar).toEqual([]);
    expect(r.esperan).toEqual([{ id: 'escribir', dia: '2026-10-21', hecho: true, en: Date.parse('2026-10-22T02:50:00Z') }]);
    const nueva = linea(almacen.estado(), r.esperan);
    expect(nueva[0].props.dia).toBe('2026-10-22');
    expect(nueva[0].props.atrasados).toEqual([{ id: 'escribir', dia: '2026-10-21', hecho: true, en: Date.parse('2026-10-22T02:50:00Z') }]);
    expect(nueva[1].props.atrasados).toEqual([]);
    // Lo que espera vuelve a leerse de la línea nueva, y pasadas dos semanas se olvida.
    expect(toquesDeLaLinea(nueva)).toHaveLength(1);
    ir('2026-11-05T13:00:00Z');
    almacen.revisarDia();
    expect(repartirToques(toquesDeLaLinea(nueva), almacen.estado())).toEqual({ aplicar: [], esperan: [] });
  });

  it('un toque más viejo que lo marcado en Moss no lo pisa', async () => {
    const { almacen } = await armar();
    almacen.marcar('meditar', true, 'toque');
    const marca = almacen.estado().marcas.get(claveDeMarca('meditar', '2026-10-21'))!;
    const viejo = { id: 'meditar', dia: '2026-10-21', hecho: false, en: Date.parse(marca.momento) - 1 };
    expect(repartirToques([viejo], almacen.estado()).aplicar).toEqual([]);
  });
});
