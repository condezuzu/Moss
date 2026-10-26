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
import { cambiaElNumero, entender, type Entendido, type ParaEntender } from './entender';
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
});
