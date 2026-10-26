/**
 * Contra la base de verdad (assets/alimentos.db), con el SQLite de Node: la frase dicha, entendida.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import { buscarAlimentos, normalizar } from './buscar';
import { detalleDeAlimento } from './detalle';
import { cambiaElNumero, claveMedida, entender, type Entendido, type ParaEntender } from './entender';
import { conCon, leerFrase } from './frase';

const db = new DatabaseSync(join(__dirname, '../../assets/alimentos.db'), { readOnly: true });
const base = { getAllAsync: async <T,>(sql: string, ...parametros: (string | number)[]) => db.prepare(sql).all(...parametros) as T[] };
const op = { idioma: 'es' as const, region: 'UY' };

const buscar = (texto: string) => buscarAlimentos(base, texto, { ...op, limite: 8 });
const para = (extra: Partial<ParaEntender> = {}): ParaEntender => ({
  buscar,
  detalle: (id) => detalleDeAlimento(base, id, op),
  ultimaCantidad: () => undefined,
  alias: () => undefined,
  conocido: () => false,
  ...extra,
});

/** Un «X con Y» es un solo alimento si el buscador lo encuentra con ese nombre. */
async function nombresDe(texto: string): Promise<Set<string>> {
  const lista = await Promise.all(conCon(texto, 'es').map(async (b) => ((await buscar(b))[0] && normalizar((await buscar(b))[0].coincide) === normalizar(b) ? b : null)));
  return new Set(lista.filter((x): x is string => x !== null));
}

async function decir(texto: string, extra?: Partial<ParaEntender>): Promise<Entendido[]> {
  const nombres = await nombresDe(texto);
  return entender(leerFrase(texto, 'es', (b) => nombres.has(b)).dichos, para(extra));
}

const nombre = (e: Entendido) => e.opciones[e.elegida]?.alimento.nombre ?? null;
const kcal = (e: Entendido) => Math.round(e.opciones[e.elegida]?.valores.kcal ?? 0);

describe('lo dicho, en alimentos de la base', () => {
  it('el desayuno de siempre: huevos, tostada con manteca y café con leche', async () => {
    const lista = await decir('dos huevos revueltos, una tostada con manteca y un café con leche');
    expect(lista).toHaveLength(4);
    expect(nombre(lista[0])).toMatch(/huevo/i);
    expect(nombre(lista[1])).toMatch(/pan|tostad/i);
    expect(nombre(lista[2])).toMatch(/manteca|mantequilla/i);
    expect(nombre(lista[3])).toMatch(/caf[eé] con leche/i);
    // La manteca de la tostada: una porción chica, supuesta.
    expect(lista[2].supuesto).toBe(true);
    expect(kcal(lista[2])).toBeLessThan(80);
  });

  it('se pregunta solo si cambia el número, y lo que ya se comió no pregunta', async () => {
    const [leche] = await decir('un vaso de leche');
    expect(nombre(leche)).toMatch(/leche/i);
    if (leche.pregunta === 'cual') expect(leche.opciones.length).toBeGreaterThanOrEqual(2);
    const conocida = await decir('un vaso de leche', { conocido: () => true });
    expect(conocida[0].pregunta).not.toBe('cual');
  });

  it('con gramos y las dos versiones, crudo o cocido', async () => {
    const [arroz] = await decir('200 gramos de arroz', { conocido: () => true });
    expect(arroz.pregunta).toBe('crudo');
    expect(arroz.opciones).toHaveLength(2);
    expect(Math.abs(arroz.opciones[0].valores.kcal - arroz.opciones[1].valores.kcal)).toBeGreaterThan(100);
  });

  it('una medida de la casa queda como se dijo: «1 vaso», no gramos', async () => {
    const [leche] = await decir('un vaso de leche entera');
    const c = leche.opciones[leche.elegida].cantidad;
    expect('porcion' in c ? [c.porcion, c.veces] : c).toEqual(['1 vaso (200 ml)', 1]);
    const [azucar] = await decir('dos cucharadas de azúcar', { conocido: () => true });
    const d = azucar.opciones[azucar.elegida].cantidad;
    expect('porcion' in d ? [d.porcion.split(' (')[0], d.veces] : d).toEqual(['1 cucharada', 2]);
  });

  it('una taza de arroz también pregunta crudo o cocido, cada una con su peso', async () => {
    const [arroz] = await decir('una taza de arroz', { conocido: () => true });
    expect(arroz.pregunta).toBe('crudo');
    expect(Math.abs(arroz.opciones[0].valores.kcal - arroz.opciones[1].valores.kcal)).toBeGreaterThan(100);
  });

  it('crudo o cocido se recuerda aparte: no vuelve a preguntar, y no cambia lo que no se midió', async () => {
    const [primera] = await decir('200 gramos de arroz', { conocido: () => true });
    const crudo = Number(primera.opciones[1].alimento.ref);
    const recordado = new Map([[claveMedida('arroz'), crudo]]);
    const [otra] = await decir('200 gramos de arroz', { conocido: () => true, medido: (b) => recordado.get(claveMedida(b)) });
    expect(otra.pregunta).toBeNull();
    expect(Number(otra.opciones[0].alimento.ref)).toBe(crudo);
    const [plato] = await decir('un plato de arroz', { conocido: () => true, medido: (b) => recordado.get(claveMedida(b)) });
    expect(Number(plato.opciones[0].alimento.ref)).not.toBe(crudo);
  });

  it('lo que se cuenta va por unidad aunque sean muchas; sin cantidad, la porción de siempre y no la de una', async () => {
    const [uvas] = await decir('20 uvas', { conocido: () => true });
    const c = uvas.opciones[0].cantidad;
    expect('veces' in c ? [c.porcion.startsWith('1 uva'), c.veces] : c).toEqual([true, 20]);
    expect(kcal(uvas)).toBeGreaterThan(60);
    const [galletas] = await decir('galletas', { conocido: () => true });
    const g = galletas.opciones[galletas.elegida].cantidad;
    expect('porcion' in g && g.porcion.startsWith('1 ')).toBe(false);
  });

  it('lo que se eligió antes para esas palabras gana, sin preguntar', async () => {
    const [primera] = await decir('un vaso de leche');
    const id = Number(primera.opciones[primera.opciones.length - 1].alimento.ref);
    const [otra] = await decir('un vaso de leche', { alias: (b) => (b === 'leche' ? id : undefined) });
    expect(Number(otra.opciones[0].alimento.ref)).toBe(id);
    expect(otra.pregunta).toBeNull();
  });

  it('lo que no está en la base vuelve sin opciones', async () => {
    const [nada] = await decir('un zxqwvut');
    expect(nada.opciones).toEqual([]);
  });

  it('el umbral: 40 kcal, o un 15 % si son al menos 15', () => {
    expect(cambiaElNumero(100, 140)).toBe(true);
    expect(cambiaElNumero(100, 120)).toBe(true);
    expect(cambiaElNumero(100, 110)).toBe(false);
    expect(cambiaElNumero(2, 5)).toBe(false);
  });

  it('«arroz y pollo» que la base no tiene entero son dos; lo que tiene entero queda uno', async () => {
    const lista = await decir('arroz y pollo', { conocido: () => true });
    expect(lista.map(nombre)).toEqual([expect.stringMatching(/^Arroz/), expect.stringMatching(/pollo/i)]);
    expect((await decir('café y tostadas', { conocido: () => true })).map(nombre)).toEqual([expect.stringMatching(/^Café/), expect.stringMatching(/^Tostada/)]);
    const empanadas = await decir('dos empanadas de carne y una de jamón y queso', { conocido: () => true });
    expect(empanadas.map(nombre)).toEqual([expect.stringMatching(/empanada de carne/i), expect.stringMatching(/empanada de jamón y queso/i)]);
  });

  it('la mitad de algo que no se cuenta entero es supuesta; la de una cosa entera, no', async () => {
    const [pollo] = await decir('medio pollo al spiedo', { conocido: () => true });
    expect(pollo.supuesto).toBe(true);
    const [pizza] = await decir('media pizza', { conocido: () => true });
    expect(pizza.supuesto).toBe(true);
    const [milanesa] = await decir('media milanesa', { conocido: () => true });
    const c = milanesa.opciones[milanesa.elegida].cantidad;
    expect(['porcion' in c && c.porcion, 'veces' in c && c.veces, milanesa.supuesto]).toEqual(['1 unidad', 0.5, false]);
  });

  it('muchos y en plural se cuentan si hay una porción de una unidad; con «de» o en singular, son gramos', async () => {
    const gramos = (e: Entendido) => { const c = e.opciones[e.elegida].cantidad; return 'gramos' in c ? c.gramos : c.gramosPorcion * c.veces; };
    const [frutillas] = await decir('20 frutillas', { conocido: () => true });
    expect(gramos(frutillas)).toBeGreaterThan(150);
    expect(gramos(frutillas)).toBeLessThan(400);
    const [aceitunas] = await decir('20 aceitunas', { conocido: () => true });
    expect(gramos(aceitunas)).toBeGreaterThan(50);
    const [pollo] = await decir('150 de pollo', { conocido: () => true });
    expect(pollo.opciones[pollo.elegida].cantidad).toEqual({ gramos: 150 });
    const [arroz] = await decir('200 arroz', { conocido: () => true });
    expect(arroz.opciones[arroz.elegida].cantidad).toEqual({ gramos: 200 });
  });

  it('las papas fritas de la milanesa son una porción, y se pregunta cuánto', async () => {
    const [, papas] = await decir('milanesa con papas fritas', { conocido: () => true });
    expect(nombre(papas)).toMatch(/papas fritas/i);
    expect(kcal(papas)).toBeGreaterThan(200);
    expect(papas.pregunta).toBe('cuanto');
  });
});
