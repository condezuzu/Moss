/**
 * Contra la base de verdad (assets/alimentos.db), con el SQLite de Node: la frase dicha, entendida.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import { buscarAlimentos, type Resultado } from './buscar';
import { detalleDeAlimento, type Detalle } from './detalle';
import { cambiaElNumero, claveMedida, entender, type Entendido, type ParaEntender } from './entender';
import { conCon, leerFrase, mismoNombre } from './frase';

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
  const lista = await Promise.all(conCon(texto, 'es').map(async (b) => ((await buscar(b))[0] && mismoNombre((await buscar(b))[0].coincide, b) ? b : null)));
  return new Set(lista.filter((x): x is string => x !== null));
}

async function decir(texto: string, extra?: Partial<ParaEntender>): Promise<Entendido[]> {
  const nombres = await nombresDe(texto);
  return entender(leerFrase(texto, 'es', (b) => nombres.has(b)).dichos, para(extra));
}

const en = { idioma: 'en' as const, region: 'UY' };
const enIngles = (texto: string) =>
  entender(leerFrase(texto, 'en').dichos, para({ buscar: (t) => buscarAlimentos(base, t, { ...en, limite: 8 }), detalle: (id) => detalleDeAlimento(base, id, en) }));

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

  it('un nombre con «con» que está en plural en la base es uno solo, y lo que sigue, otro', async () => {
    const lista = await decir('yogur con frutas y granola', { conocido: () => true });
    expect(lista.map(nombre)).toEqual([expect.stringMatching(/^yogur con frutas/i), expect.stringMatching(/granola/i)]);
  });
});

describe('los platos dichos sin cantidad (D36)', () => {
  const gramos = (e: Entendido) => e.opciones.map((o) => ('gramos' in o.cantidad ? o.cantidad.gramos : null));

  it('«un plato de fideos»: mediano, con una sola pregunta (chico, mediano o grande) y aproximado', async () => {
    const [fideos] = await decir('un plato de fideos', { conocido: () => false });
    expect(fideos.pregunta).toBe('tamano');
    expect(gramos(fideos)).toEqual([200, 300, 450]);
    expect(fideos.elegida).toBe(1);
    expect(fideos.supuesto).toBe(true);
  });

  it('con el tamaño dicho no pregunta; dos platos son el doble', async () => {
    const [grande] = await decir('un plato grande de guiso');
    expect(grande.pregunta).toBeNull();
    expect(gramos(grande)).toEqual([450]);
    expect(grande.supuesto).toBe(true);
    const [dos] = await decir('dos platos de arroz');
    expect(gramos(dos)).toEqual([320, 500, 750]);
  });

  it('«medio plato de arroz» es la mitad de un plato, aunque ya se haya comido arroz (lo pediste el 30/10/2026)', async () => {
    const [medio] = await decir('medio plato de arroz');
    expect(medio.pregunta).toBe('tamano');
    expect(gramos(medio)).toEqual([80, 125, 188]);
    expect(medio.elegida).toBe(1);
    expect(medio.supuesto).toBe(true);
    // Antes era media taza, por la última vez; la vez anterior solo marca el tamaño más cercano.
    const [conAntes] = await decir('medio plato de arroz', { ultimaCantidad: () => ({ gramos: 80 }), conocido: () => true });
    expect(gramos(conAntes)).toEqual([80, 125, 188]);
    expect(conAntes.elegida).toBe(0);
  });

  it('un plato de cualquier cosa da una cantidad con sentido: no 100 g ni media porción', async () => {
    const [pollo] = await decir('medio plato de pollo');
    expect(pollo.pregunta).toBe('tamano');
    expect(gramos(pollo)).toEqual([50, 75, 113]);
    const [carne] = await decir('un plato de carne');
    expect(gramos(carne)).toEqual([100, 150, 225]);
    const [verduras] = await decir('un plato de verduras');
    expect(gramos(verduras)).toEqual([100, 150, 225]);
    const [poroto] = await decir('un plato de porotos');
    expect(gramos(poroto)).toEqual([90, 150, 200]);
    // «Pollo» a secas sigue preguntando cuál, no el tamaño.
    const [solo] = await decir('pollo');
    expect(solo.pregunta).not.toBe('tamano');
  });

  it('«un poco» y «mucho»: el plato chico o grande, sin preguntar; de lo demás, media porción o una y media', async () => {
    const [poco] = await decir('un poco de arroz');
    expect(gramos(poco)).toEqual([160]);
    expect(poco).toMatchObject({ pregunta: null, supuesto: true });
    const [mucho] = await decir('mucho arroz');
    expect(gramos(mucho)).toEqual([375]);
    expect(mucho.pregunta).toBeNull();
    const [queso] = await decir('un poco de queso muzzarella', { conocido: () => true });
    expect(queso.supuesto).toBe(true);
    expect(queso.pregunta).toBeNull();
    const c = queso.opciones[queso.elegida].cantidad;
    expect('veces' in c ? c.veces : 0.5).toBe(0.5);
  });

  it('«media pizza» son cuatro porciones, no media porción', async () => {
    const [media] = await decir('media pizza');
    expect(gramos(media)).toEqual([480]);
    expect(media).toMatchObject({ pregunta: null, supuesto: true });
    // Media empanada sí es media.
    const [empanada] = await decir('media empanada');
    expect(empanada.opciones[empanada.elegida].cantidad).toMatchObject({ veces: 0.5 });
  });

  it('un plato sin «plato» y sin cantidad también; lo contado o lo ya comido, no', async () => {
    const [guiso] = await decir('guiso');
    expect(guiso.pregunta).toBe('tamano');
    const [empanadas] = await decir('2 empanadas');
    expect(empanadas.pregunta).not.toBe('tamano');
    const [antes] = await decir('guiso', { ultimaCantidad: () => ({ gramos: 280 }), conocido: () => true });
    expect(antes.pregunta).toBeNull();
    expect(gramos(antes)).toEqual([280]);
  });

  it('lo que solo se parece a un plato no lleva gramos de plato: «crema de leche», «pastafrola», «galletas de arroz»', async () => {
    for (const texto of ['crema de leche', 'pasta de maní', 'pastafrola', 'galletas de arroz', 'sándwich de milanesa']) {
      expect([texto, (await decir(texto))[0].pregunta]).not.toEqual([texto, 'tamano']);
    }
    expect(kcal((await decir('crema de leche'))[0])).toBeLessThan(100);
    // «Pasta» son fideos, aunque el buscador traiga primero la pasta de maní.
    const [pasta] = await decir('comí pasta');
    expect([nombre(pasta), gramos(pasta)]).toEqual(['Fideos', [200, 300, 450]]);
    for (const texto of ['guiso', 'crema de calabaza', 'sopa de verduras']) expect([texto, (await decir(texto))[0].pregunta]).toEqual([texto, 'tamano']);
  });

  it('una porción, un bol o un serving no son un plato: va la porción de siempre de la base', async () => {
    expect(kcal((await decir('una porción de queso'))[0])).toBeLessThan(100);
    const [torta] = await decir('una porción de torta');
    const deLaBase = await detalleDeAlimento(base, Number(torta.opciones[torta.elegida].alimento.ref), op);
    expect(gramos(torta)[torta.elegida]).toBe(deLaBase?.porciones.find((x) => !x.deUna)?.gramos);
    expect(kcal((await decir('un bol de cereales'))[0])).toBeLessThan(300);
    expect(kcal((await enIngles('a serving of almonds'))[0])).toBeLessThan(300);
    // Un plato sigue siendo un plato.
    expect(gramos((await decir('un plato de arroz'))[0])).toEqual([160, 250, 375]);
  });

  it('los gramos de un plato son de comida servida: lo crudo o seco va con su versión cocida', async () => {
    const [polenta] = await decir('polenta');
    expect([nombre(polenta), gramos(polenta)]).toEqual(['Polenta cocida', [200, 300, 450]]);
    expect(kcal(polenta)).toBeLessThan(250);
    const [avena] = await decir('un plato de avena');
    expect([nombre(avena), gramos(avena)]).toEqual(['Avena cocida', [160, 250, 375]]);
    // Con la porción de siempre, la de lo cocido: un bol de avena no son 40 g de avena cocida.
    expect(kcal((await decir('un bol de avena'))[0])).toBeGreaterThan(100);
    const [ingles] = await enIngles('a plate of pasta');
    expect(nombre(ingles)).toBe('Cooked pasta');
  });

  it('lo de marca va con su porción: los fideos del paquete se pesan secos', async () => {
    const valores = { kcal: 350, proteina: 12, carbohidratos: 72, grasas: 1.5 };
    const paquete: Detalle = {
      id: -1, nombre: 'Mostacholes Marca', origen: 'producto', marca: 'Marca', atribucion: 'off', deDonde: null, aproximado: false, por100g: valores,
      porciones: [{ nombre: '1 porción (80 g)', gramos: 80 }], densidad: null, desecho: null, aceite: null, crudo: null, cocidos: [], receta: null, verificado: null,
    };
    const resultado: Resultado = { id: -1, nombre: paquete.nombre, coincide: 'Mostacholes Marca', curado: false, marca: 'Marca', ...valores, porcion: { nombre: '1 porción (80 g)', gramos: 80 } };
    const conPaquete = para({ buscar: async () => [resultado], detalle: async () => paquete });
    const [solo] = await entender(leerFrase('mostacholes', 'es').dichos, conPaquete);
    expect(solo.opciones[solo.elegida].cantidad).toMatchObject({ gramosPorcion: 80, veces: 1 });
    const [plato] = await entender(leerFrase('un plato de mostacholes', 'es').dichos, conPaquete);
    expect(gramos(plato)).toEqual([52, 80, 120]);
  });

  it('si no se sabe qué plato es y elegir otro cambia más que un tamaño, se pregunta cuál', async () => {
    const [ensalada] = await decir('ensalada');
    expect(ensalada.pregunta).toBe('cual');
    expect(ensalada.opciones.length).toBeGreaterThanOrEqual(2);
    // Los guisos se parecen: el tamaño. Y lo que ya se comió no pregunta cuál.
    expect((await decir('guiso'))[0].pregunta).toBe('tamano');
    expect((await decir('ensalada', { conocido: () => true }))[0].pregunta).toBe('tamano');
    expect((await enIngles('a plate of rice'))[0].pregunta).toBe('cual');
    // «A plate of spaghetti» no es la salsa para los spaghetti.
    expect(nombre((await enIngles('a plate of spaghetti'))[0])).toBe('Spaghetti and meatballs');
  });

  it('el tamaño dicho sin «plato» también cuenta: «milanesa grande», «pizza chica»', async () => {
    const [milanesa] = await decir('milanesa grande');
    expect([milanesa.pregunta, gramos(milanesa)]).toEqual([null, [240]]);
    const [pizza] = await decir('pizza chica');
    expect([pizza.pregunta, gramos(pizza)]).toEqual([null, [85]]);
  });

  it('«un plato y medio», «½ plato», «plato y medio» y el plato dicho después', async () => {
    expect(gramos((await decir('un plato y medio de arroz'))[0])).toEqual([240, 375, 563]);
    expect(gramos((await decir('½ plato de arroz'))[0])).toEqual([80, 125, 188]);
    const [fideos] = await decir('plato y medio de fideos');
    expect([nombre(fideos), gramos(fideos)]).toEqual(['Fideos', [300, 450, 675]]);
    const despues = await decir('fideos, un plato grande');
    expect(despues.map((e) => [nombre(e), gramos(e)])).toEqual([['Fideos', [450]]]);
  });

  it('«arroz y pollo» con lo que se dijo de los dos: un poco o mucho de cada uno, y «uno de» es otro plato', async () => {
    expect(gramos((await decir('un poco de arroz y pollo'))[0])).toEqual([160]);
    expect(gramos((await decir('mucho arroz y pollo'))[0])).toEqual([375]);
    const lista = await decir('un plato de arroz y uno de fideos');
    expect(lista.map((e) => [nombre(e), e.pregunta])).toEqual([['Arroz blanco cocido', 'tamano'], ['Fideos', 'tamano']]);
  });
});
