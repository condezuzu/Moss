/**
 * Contra la base de verdad (assets/alimentos.db), con el SQLite de Node: la frase dicha, entendida.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import type { AlimentoPropio, Item, Receta } from '../dominio/registros';
import { buscarAlimentos, type Resultado } from './buscar';
import { detalleDeAlimento, type Detalle } from './detalle';
import { cambiaElNumero, claveMedida, entender, loTuyo, type Entendido, type ParaEntender } from './entender';
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

  it('lo dicho en ml queda en ml: «200 ml de leche» se ve «200 ml», con sus gramos', async () => {
    const [leche] = await decir('200 ml de leche entera', { conocido: () => true });
    expect(leche.opciones[leche.elegida].cantidad).toEqual({ gramos: expect.any(Number), ml: 200 });
  });

  it('en Uruguay, «pan» es el pan francés y no el pan dulce (el panettone): sin preguntar ni recordarlo', async () => {
    const [pan] = await decir('pan');
    expect(nombre(pan)).toBe('Pan francés');
    expect(pan.pregunta).not.toBe('cual');
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

  it('«un cuarto de pollo» es un cuarto del pollo entero (lo que se come, FNDDS), no de 100 g; la pechuga, no', async () => {
    const [cuarto] = await decir('un cuarto de pollo', { conocido: () => true });
    expect(gramos(cuarto)).toEqual([150]);
    const [medio] = await decir('medio pollo', { conocido: () => true });
    expect(gramos(medio)).toEqual([300]);
    const [pechuga] = await decir('media pechuga de pollo', { conocido: () => true });
    expect(pechuga.opciones[pechuga.elegida].cantidad).toMatchObject({ veces: 0.5 });
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

describe('un plato con nombre y lo que lleva (lo pediste el 27/11/2026)', () => {
  const cuanto = (e: Entendido) => { const c = e.opciones[e.elegida].cantidad; return 'veces' in c ? [c.porcion.split(' (')[0], c.veces] : c; };

  it('«me tomo un batido de banana, leche y avena»: banana, leche y avena, no un licuado de banana con leche de avena', async () => {
    const lista = await decir('me tomo un batido de banana, leche y avena', { conocido: () => true });
    expect(lista.map(nombre)).toEqual(['Banana', 'Leche entera', expect.stringMatching(/^Avena/)]);
    expect(lista.map((e) => e.dicho.grupo)).toEqual(['batido', 'batido', 'batido']);
  });

  it('con sus cantidades, como cualquier otra cosa dicha', async () => {
    const lista = await decir('me tomo un batido de: una banana, una taza de leche, dos cucharadas de avena y una de mantequilla de maní', { conocido: () => true });
    expect(lista.map(nombre)).toEqual(['Banana', 'Leche entera', expect.stringMatching(/^Avena/), 'Pasta de maní']);
    expect(lista.map(cuanto)).toEqual([['1 mediana', 1], ['1 taza', 1], ['1 cucharada', 2], ['1 cucharada', 1]]);
    const total = lista.reduce((s, e) => s + kcal(e), 0);
    expect(total).toBeGreaterThan(380);
    expect(total).toBeLessThan(480);
    // «300 de leche» son 300 g de leche.
    const [, leche] = await decir('un batido de: una banana, 300 de leche y 30 gramos de avena', { conocido: () => true });
    expect([nombre(leche), leche.opciones[leche.elegida].cantidad]).toEqual(['Leche entera', { gramos: 300 }]);
  });

  it('la base manda: lo que existe con ese nombre es un alimento', async () => {
    const casos: [string, RegExp][] = [
      ['un batido de proteína', /^Batido de proteínas$/], ['una ensalada de frutas', /^Ensalada de frutas$/], ['una tortilla de papas', /^Tortilla de papas$/],
      ['un jugo de naranja', /^Jugo de naranja$/], ['un batido de banana', /^Licuado de banana$/], ['un licuado de durazno', /^Licuado de durazno$/],
    ];
    for (const [texto, esperado] of casos) {
      const lista = await decir(texto, { conocido: () => true });
      expect([texto, lista.map(nombre)]).toEqual([texto, [expect.stringMatching(esperado)]]);
      expect(lista[0].dicho.grupo).toBeUndefined();
    }
  });

  it('si la base no tiene ese nombre, va lo que lleva: «un batido de kiwi» es kiwi, no una malteada de vainilla', async () => {
    const lista = await decir('un batido de kiwi', { conocido: () => true });
    expect(lista.map((e) => [nombre(e), e.dicho.grupo])).toEqual([['Kiwi', 'batido']]);
    // Lo que se eligió antes para esas palabras sigue ganando.
    const [elegido] = await decir('un batido de kiwi', { alias: (b) => (b === 'batido de kiwi' ? Number(lista[0].opciones[0].alimento.ref) : undefined) });
    expect(elegido.dicho.grupo).toBeUndefined();
    // Si lo que sigue al «de» no es algo que se coma, no se inventa: sigue sin encontrarse, para buscarlo.
    const sinGuardar = await decir('un batido de la mañana', { conocido: () => true });
    expect(sinGuardar.map((e) => [e.dicho.buscado, e.opciones.length])).toEqual([['batido de la mañana', 0]]);
  });

  it('«una tortilla de 3 huevos con queso» son tres huevos y el queso', async () => {
    const [huevos, queso] = await decir('una tortilla de 3 huevos con queso', { conocido: () => true });
    expect([nombre(huevos), cuanto(huevos)]).toEqual(['Huevo', ['1 unidad', 3]]);
    expect(nombre(queso)).toMatch(/queso/i);
    expect([huevos.dicho.grupo, queso.dicho.grupo]).toEqual(['tortilla', 'tortilla']);
  });

  it('la medida del polvo: un scoop de proteína es su medida', async () => {
    const [proteina] = await decir('un scoop de proteína', { conocido: () => true });
    expect([nombre(proteina), cuanto(proteina)]).toEqual(['Proteína de suero', ['1 medida', 1]]);
    const [whey] = await decir('dos medidas de whey', { conocido: () => true });
    expect([nombre(whey), cuanto(whey)]).toEqual(['Proteína de suero', ['1 medida', 2]]);
    expect(kcal(whey)).toBeGreaterThan(180);
  });

  it('el hielo no es el hielo raspado con jarabe', async () => {
    expect((await decir('un café con hielo', { conocido: () => true })).map(nombre)).toEqual(['Café']);
  });

  it('las formas de decir lo de un batido: la leche vegetal y la mantequilla de maní, de cada lugar', async () => {
    const casos: [string, string][] = [
      ['un vaso de leche de almendras', 'Leche de almendras'], ['un vaso de bebida de avena', 'Leche de avena'], ['un vaso de leche de soya', 'Leche de soja'],
      ['un vaso de leche vegetal', 'Bebida vegetal'], ['una cucharada de crema de cacahuete', 'Pasta de maní'], ['una cucharada de mantequilla de cacahuate', 'Pasta de maní'],
      ['un plátano', 'Banana'], ['una cucharada de semillas de chía', 'Chía'], ['un scoop de proteína en polvo', 'Proteína de suero'],
    ];
    for (const [texto, esperado] of casos) expect([texto, (await decir(texto, { conocido: () => true })).map(nombre)]).toEqual([texto, [esperado]]);
    for (const [texto, esperado] of [['a glass of oat milk', 'Oat milk'], ['a tablespoon of peanut butter', 'Peanut butter'], ['a scoop of whey', 'Whey protein']]) {
      expect([texto, (await enIngles(texto)).map(nombre)]).toEqual([texto, [esperado]]);
    }
  });

  it('lo congelado es lo mismo si la base no lo tiene así: «una banana congelada» no es el ananá congelado', async () => {
    const [banana] = await decir('una banana congelada', { conocido: () => true });
    expect([nombre(banana), banana.dicho.buscado]).toEqual(['Banana', 'banana congelada']);
    expect((await enIngles('a frozen banana')).map(nombre)).toEqual(['Banana']);
    // Lo que la base tiene congelado, como siempre.
    expect((await decir('una taza de mango congelado', { conocido: () => true })).map(nombre)).toEqual(['Mango congelado']);
    expect((await decir('un batido de: una banana congelada, un vaso de leche de almendras y un scoop de whey', { conocido: () => true })).map(nombre))
      .toEqual(['Banana', 'Leche de almendras', 'Proteína de suero']);
  });

  it('en inglés: «a smoothie with banana, milk and oats»', async () => {
    const lista = await enIngles('a smoothie with banana, milk and oats');
    expect(lista.map((e) => e.dicho.grupo)).toEqual(['smoothie', 'smoothie', 'smoothie']);
    expect(lista.map(nombre)).toEqual(['Banana', expect.stringMatching(/milk/i), 'Oats']);
  });
});

describe('lo tuyo, dicho por su nombre (lo pediste el 27/11/2026)', () => {
  const ahora = '2026-11-27T12:00:00.000Z';
  const item = (ref: string, nombreDelItem: string, cantidad: Item['cantidad'], kcalDelItem: number): Item =>
    ({ fuente: 'base', ref, nombre: nombreDelItem, cantidad, valores: { kcal: kcalDelItem, proteina: 2, carbohidratos: 10, grasas: 1 } });
  const batido: Receta = {
    id: 'r1', tipo: 'receta', nombre: 'Batido de la mañana', porciones: 1, pesoFinal: null, actualizado: ahora,
    items: [item('1', 'Banana', { porcion: '1 mediana', gramosPorcion: 118, veces: 1 }, 105), item('2', 'Leche entera', { gramos: 248, ml: 240 }, 151), item('3', 'Avena arrollada', { porcion: '1 cucharada', gramosPorcion: 10, veces: 2 }, 78)],
  };
  const guiso: Receta = { id: 'r2', tipo: 'receta', nombre: 'Guiso de la abuela', porciones: 4, pesoFinal: 1200, actualizado: ahora, items: [item('4', 'Lentejas', { gramos: 400 }, 1400), item('5', 'Papa', { gramos: 300 }, 240)] };
  const desayuno: Receta = {
    id: 'c1', tipo: 'comida', nombre: 'Desayuno de siempre', porciones: 1, pesoFinal: null, actualizado: ahora,
    items: [
      item('6', 'Café con leche', { porcion: '1 taza', gramosPorcion: 250, veces: 1 }, 90), item('7', 'Tostada', { porcion: '1 rebanada', gramosPorcion: 25, veces: 2 }, 147),
      { fuente: 'rapida', ref: null, nombre: 'Mermelada casera', cantidad: null, valores: { kcal: 40, proteina: 0, carbohidratos: 10, grasas: 0 } },
    ],
  };
  const yogur: AlimentoPropio = { id: 'p1', nombre: 'Yogur de la abuela', marca: null, codigo: null, por100g: { kcal: 60, proteina: 4, carbohidratos: 5, grasas: 3 }, porciones: [{ nombre: '1 pote', gramos: 180 }], actualizado: ahora };
  const cafe: AlimentoPropio = { id: 'p2', nombre: 'Café con leche', marca: null, codigo: null, por100g: { kcal: 40, proteina: 2, carbohidratos: 3, grasas: 2 }, porciones: [], actualizado: ahora };
  const tuyos = loTuyo([batido, guiso, desayuno], [yogur, cafe], '1 plato');

  async function decirLoTuyo(texto: string): Promise<Entendido[]> {
    const enLaBase = await nombresDe(texto);
    return entender(leerFrase(texto, 'es', (b) => enLaBase.has(b), tuyos.map((x) => x.nombre)).dichos, para({ tuyo: (i) => tuyos[i]?.filas }));
  }
  const elegida = (e: Entendido) => e.opciones[e.elegida];

  it('una receta: «mi batido de la mañana» o «un batido de la mañana» la anotan entera, en una fila y sin preguntar', async () => {
    for (const texto of ['mi batido de la mañana', 'me tomo un batido de la mañana', 'el batido de la mañana']) {
      const lista = await decirLoTuyo(texto);
      expect([texto, lista.length]).toEqual([texto, 1]);
      const o = elegida(lista[0]);
      expect([o.alimento.fuente, o.alimento.ref, o.alimento.nombre]).toEqual(['receta', 'r1', 'Batido de la mañana']);
      expect(o.cantidad).toMatchObject({ porcion: '1 plato', veces: 1 });
      expect(Math.round(o.valores.kcal)).toBe(105 + 151 + 78);
      expect([lista[0].pregunta, lista[0].supuesto]).toEqual([null, false]);
    }
  });

  it('lo tuyo gana sobre la base cuando el nombre coincide', async () => {
    // Sin porción tuya, «un café con leche» es la taza de la base (27/11/2026), no 100 g.
    const [tuyo] = await decirLoTuyo('un café con leche');
    expect([elegida(tuyo).alimento.fuente, elegida(tuyo).alimento.ref, elegida(tuyo).cantidad]).toEqual(['propio', 'p2', expect.objectContaining({ porcion: expect.stringMatching(/^1 taza/), veces: 1 })]);
    // Sin lo tuyo, es el de la base.
    const [deLaBase] = await decir('un café con leche');
    expect([elegida(deLaBase).alimento.fuente, nombre(deLaBase)]).toEqual([undefined, 'Café con leche']);
  });

  it('una comida guardada: cada cosa suya, con su cantidad, y lo que no tiene cantidad también', async () => {
    const lista = await decirLoTuyo('mi desayuno de siempre');
    expect(lista.map((e) => [elegida(e).alimento.nombre, elegida(e).alimento.fuente, Math.round(elegida(e).valores.kcal)])).toEqual([
      ['Café con leche', 'base', 90], ['Tostada', 'base', 147], ['Mermelada casera', 'rapida', 40],
    ]);
    expect(elegida(lista[1]).cantidad).toEqual({ porcion: '1 rebanada', gramosPorcion: 25, veces: 2 });
    // Cada fila es otra cosa para la pantalla.
    expect(new Set(lista.map((e) => e.dicho)).size).toBe(3);
  });

  it('un alimento tuyo con su porción, y las veces o los gramos que se digan', async () => {
    const [propio] = await decirLoTuyo('un yogur de la abuela');
    expect([elegida(propio).alimento.fuente, elegida(propio).cantidad, Math.round(elegida(propio).valores.kcal)]).toEqual(['propio', { porcion: '1 pote', gramosPorcion: 180, veces: 1 }, 108]);
    const [medio] = await decirLoTuyo('medio batido de la mañana');
    expect([elegida(medio).cantidad, Math.round(elegida(medio).valores.kcal)]).toEqual([expect.objectContaining({ veces: 0.5 }), 167]);
    // Una receta pesada se anota por lo que pesa el plato.
    const [pesado] = await decirLoTuyo('300 gramos de guiso de la abuela');
    expect([elegida(pesado).alimento.ref, elegida(pesado).cantidad, Math.round(elegida(pesado).valores.kcal)]).toEqual(['r2', { gramos: 300 }, 410]);
    const [plato] = await decirLoTuyo('un guiso de la abuela');
    expect([elegida(plato).cantidad, Math.round(elegida(plato).valores.kcal)]).toEqual([{ porcion: '1 plato', gramosPorcion: 300, veces: 1 }, 410]);
  });

  it('con otras cosas en la frase, cada una a lo suyo', async () => {
    const lista = await decirLoTuyo('mi batido de la mañana y una banana');
    expect(lista.map((e) => [elegida(e).alimento.nombre, elegida(e).alimento.fuente])).toEqual([['Batido de la mañana', 'receta'], ['Banana', undefined]]);
  });

  it('guardado como «Mi batido», «me tomo mi batido» es ese; y el batido dicho con su lista sigue siendo la lista', async () => {
    const miBatido = loTuyo([{ ...batido, id: 'r3', nombre: 'Mi batido' }], [], '1 plato');
    const conMiBatido = async (texto: string) => entender(leerFrase(texto, 'es', () => false, miBatido.map((x) => x.nombre)).dichos, para({ conocido: () => true, tuyo: (i) => miBatido[i]?.filas }));
    const [suyo] = await conMiBatido('me tomo mi batido');
    expect([elegida(suyo).alimento.ref, Math.round(elegida(suyo).valores.kcal)]).toEqual(['r3', 105 + 151 + 78]);
    expect((await conMiBatido('un batido de banana, leche y avena')).map((e) => [elegida(e).alimento.fuente, e.dicho.grupo])).toEqual([[undefined, 'batido'], [undefined, 'batido'], [undefined, 'batido']]);
  });
});

describe('la revisión del 27/11/2026, contra la base', () => {
  const nombres = (lista: Entendido[]) => lista.map(nombre);
  const como = (esperado: (string | RegExp)[]) => esperado.map((x) => (typeof x === 'string' ? x : expect.stringMatching(x)));
  const gramos = (e: Entendido) => { const c = e.opciones[e.elegida].cantidad; return 'gramos' in c ? c.gramos : c.gramosPorcion * c.veces; };

  it('un plato con algo que no va en él: el plato y lo otro, como antes («un licuado con dos medialunas»)', async () => {
    const casos: [string, (string | RegExp)[]][] = [
      ['un licuado con dos medialunas', ['Licuado', 'Medialuna']],
      ['un smoothie con un sándwich', [/^Smoothie/, /^Sándwich/]],
      ['una malteada con unas papas fritas', ['Malteada', 'Papas fritas']],
      ['un omelette con dos tostadas', [/huevo/i, 'Tostada']],
      ['un revuelto con una tostada', [/^Revuelto/, 'Tostada']],
      ['un shake con una hamburguesa', [/batido|shake/i, /^Hamburguesa/]],
      ['un licuado con tostadas y mermelada', ['Licuado', 'Tostada', 'Mermelada']],
      ['un smoothie con tostadas y huevos', [/^Smoothie/, 'Tostada', 'Huevo']],
      ['un batido con galletitas y fruta', ['Licuado', /^Galletitas/, /fruta/i]],
    ];
    for (const [texto, esperado] of casos) {
      const lista = await decir(texto, { conocido: () => true });
      expect([texto, nombres(lista), lista.map((e) => e.dicho.grupo ?? null)]).toEqual([texto, como(esperado), esperado.map(() => null)]);
    }
    for (const [texto, esperado] of [['a smoothie with a bagel', [/smoothie/i, 'Bagel']], ['an omelet with two slices of toast', [/omelet/i, 'Toast']]] as const) {
      expect([texto, nombres(await enIngles(texto))]).toEqual([texto, como([...esperado])]);
    }
    // El licuado y las dos medialunas: 600 kcal, no las 463 de las medialunas solas.
    expect((await decir('un licuado con dos medialunas', { conocido: () => true })).reduce((s, e) => s + kcal(e), 0)).toBeGreaterThan(550);
  });

  it('la lista termina en lo primero que no va en el plato: el licuado de banana de la base, las tostadas y el café', async () => {
    const casos: [string, (string | RegExp)[]][] = [
      ['un licuado de banana, tostadas y café', ['Licuado de banana', 'Tostada', /^Café/]],
      ['un licuado de frutilla y medialunas', ['Licuado de frutilla', 'Medialuna']],
      ['un batido de chocolate y galletitas', [/chocolate/i, /^Galletitas/]],
      ['ensalada de pollo, arroz y una coca', ['Ensalada de pollo', /^Arroz/, /cola|coca/i]],
    ];
    for (const [texto, esperado] of casos) expect([texto, nombres(await decir(texto, { conocido: () => true }))]).toEqual([texto, como(esperado)]);
    // El batido de chocolate es el de la base, no 20 g de chocolate.
    const [batido] = await decir('un batido de chocolate y galletitas', { conocido: () => true });
    expect(kcal(batido)).toBeGreaterThan(400);
  });

  it('si la base tiene el plato dicho, con «de», «y» o «con», es el de la base', async () => {
    const casos: [string, string[]][] = [
      ['ensalada de zanahoria y huevo', ['Ensalada de zanahoria y huevo']],
      ['una ensalada de remolacha y huevo', ['Ensalada de remolacha y huevo']],
      ['una ensalada de papa y huevo', ['Ensalada de papa y huevo']],
      ['ensalada de tomate y pepino', ['Ensalada de tomate y pepino']],
      ['ensalada de repollo y zanahoria', ['Ensalada de repollo y zanahoria']],
      ['una ensalada de atún y huevo', ['Ensalada de atún con huevo']],
      ['una milanesa con una ensalada de zanahoria y huevo', ['Milanesa', 'Ensalada de zanahoria y huevo']],
    ];
    for (const [texto, esperado] of casos) expect([texto, nombres(await decir(texto, { conocido: () => true }))]).toEqual([texto, esperado]);
    // Sin el plato en la base, la lista: la zanahoria y el pepino.
    expect(nombres(await decir('ensalada de zanahoria y pepino', { conocido: () => true }))).toEqual(['Zanahoria', 'Pepino']);
  });

  it('una bebida con algo que la base no tiene solo es la de antes: «un licuado de frutas» no es la ensalada de frutas', async () => {
    expect(nombres(await decir('un licuado de frutas', { conocido: () => true }))).toEqual(['Licuado de frutilla']);
    expect(nombres(await decir('un smoothie de frutos rojos', { conocido: () => true }))).toEqual(['Smoothie de frutas con yogur']);
    // Lo que está como tal en la base sigue yendo: «un batido de kiwi» es el kiwi.
    expect(nombres(await decir('un batido de kiwi', { conocido: () => true }))).toEqual(['Kiwi']);
  });

  it('«como bebida» y «como acompañamiento»: la coca y el arroz, no una ensalada de acompañamiento', async () => {
    expect(nombres(await decir('una pizza y como bebida una coca', { conocido: () => true }))).toEqual(como([/pizza/i, /cola|coca/i]));
    expect(nombres(await decir('pollo y como acompañamiento arroz', { conocido: () => true }))).toEqual(como([/pollo/i, /^Arroz/]));
  });

  it('lo que se calla después de una docena, los dos puntos después de lo contado y los gramos sin unidad', async () => {
    const casos: [string, (string | RegExp)[], number[]][] = [
      ['una docena de empanadas, 6 de carne y 6 de jamón y queso', ['Empanada de carne', 'Empanada de jamón y queso'], [6, 6]],
      ['media docena de huevos y 2 de codorniz', ['Huevo', 'Huevo de codorniz'], [6, 2]],
      ['unas 6 empanadas de carne y 6 de pollo', ['Empanada de carne', 'Empanada de pollo'], [6, 6]],
      ['tres empanadas: dos de carne y una de pollo', ['Empanada de carne', 'Empanada de pollo'], [2, 1]],
      ['dos medialunas: una de grasa y una de manteca', [/^Medialuna/, /^Medialuna/], [1, 1]],
      ['veinte empanadas de carne y veinte de pollo', ['Empanada de carne', 'Empanada de pollo'], [20, 20]],
    ];
    for (const [texto, esperado, veces] of casos) {
      const lista = await decir(texto, { conocido: () => true });
      expect([texto, nombres(lista), lista.map((e) => { const c = e.opciones[e.elegida].cantidad; return 'veces' in c ? c.veces : null; })]).toEqual([texto, como(esperado), veces]);
    }
    expect((await decir('200 de arroz y 200 de pollo', { conocido: () => true })).map((e) => [nombre(e), gramos(e)])).toEqual([[expect.stringMatching(/^Arroz/), 200], [expect.stringMatching(/pollo/i), 200]]);
    const [, chorizos] = await decir('un kilo de asado y dos de chorizo', { conocido: () => true });
    expect([nombre(chorizos), chorizos.opciones[chorizos.elegida].cantidad]).toEqual(['Chorizo', expect.objectContaining({ veces: 2 })]);
  });

  it('una bebida sin el líquido es la de la base, como antes: «un licuado de manzana» no es una manzana sola', async () => {
    expect(kcal((await decir('un licuado de manzana', { conocido: () => true }))[0])).toBeGreaterThan(150);
    expect(kcal((await decir('un licuado de kiwi', { conocido: () => true }))[0])).toBeGreaterThan(150);
    expect(nombres(await decir('un licuado de una banana', { conocido: () => true }))).toEqual(['Licuado de banana']);
    expect(nombres(await decir('un licuado de banana y frutilla', { conocido: () => true }))).toEqual(['Licuado de banana', 'Frutillas']);
    expect(nombres(await decir('un smoothie de banana y espinaca', { conocido: () => true }))).toEqual(['Licuado de banana', 'Espinaca']);
    const proteina = await decir('un batido con una cucharada de proteína', { conocido: () => true });
    expect([nombres(proteina), proteina.reduce((s, e) => s + kcal(e), 0)]).toEqual([['Licuado', expect.stringMatching(/prote/i)], 183]);
    // Con el líquido, la lista.
    expect(nombres(await decir('un licuado de banana y frutilla con leche', { conocido: () => true }))).toEqual(['Banana', 'Frutillas', expect.stringMatching(/^Leche/)]);
  });

  it('«two scoops of ice cream» son dos bochas de helado, no dos conos de 4 g; «un tostado» es el sándwich; el helado de la ensalada se anota', async () => {
    const [helado] = await enIngles('two scoops of ice cream');
    expect([nombre(helado), helado.opciones[helado.elegida].cantidad]).toEqual([expect.stringMatching(/ice cream$/i), expect.objectContaining({ porcion: '1 scoop', veces: 2 })]);
    expect(kcal(helado)).toBeGreaterThan(150);
    expect(nombres(await decir('un tostado', { conocido: () => true }))).toEqual([expect.stringMatching(/s[aá]ndwich|tostado de jam/i)]);
    expect(nombres(await decir('ensalada de frutas con helado', { conocido: () => true }))).toEqual(['Ensalada de frutas', expect.stringMatching(/^Helado/)]);
  });

  it('un número sin unidad son gramos: «una taza de café y 30 de leche» no son 30 tazas', async () => {
    const [, leche] = await decir('una taza de café y 30 de leche', { conocido: () => true });
    expect([nombre(leche), gramos(leche)]).toEqual([expect.stringMatching(/^Leche/), 30]);
    expect(gramos((await decir('un vaso de leche y 30 de cereales', { conocido: () => true }))[1])).toBe(30);
    expect(gramos((await decir('un plato de arroz y 200 de pollo', { conocido: () => true }))[1])).toBe(200);
    const [, empanadas] = await decir('20 empanadas de carne y 20 de pollo', { conocido: () => true });
    expect([nombre(empanadas), empanadas.opciones[empanadas.elegida].cantidad]).toEqual(['Empanada de pollo', expect.objectContaining({ veces: 20 })]);
  });
});

describe('lo tuyo con la cantidad dicha (la revisión del 27/11/2026)', () => {
  const nombres = (lista: Entendido[]) => lista.map(nombre);
  const ahora = '2026-11-27T12:00:00.000Z';
  const v = (kcalCada100: number, proteina = 0, carbohidratos = 0, grasas = 0) => ({ kcal: kcalCada100, proteina, carbohidratos, grasas });
  const propio = (id: string, nombreDelPropio: string, por100g: AlimentoPropio['por100g'], porciones: AlimentoPropio['porciones'] = []): AlimentoPropio =>
    ({ id, nombre: nombreDelPropio, marca: null, codigo: null, por100g, porciones, actualizado: ahora });
  const item = (ref: string, nombreDelItem: string, gramosDelItem: number, kcalDelItem: number): Item =>
    ({ fuente: 'base', ref, nombre: nombreDelItem, cantidad: { gramos: gramosDelItem }, valores: v(kcalDelItem), estimado: true });
  const propios = [
    propio('p-queso', 'Queso dambo', v(350, 25, 1, 28), [{ nombre: '1 feta', gramos: 20 }]),
    propio('p-leche', 'Leche', v(62, 3.2, 4.8, 3.3), [{ nombre: '1 vaso', gramos: 200 }]),
    propio('p-pan', 'Pan', v(270, 9, 50, 3), [{ nombre: '1 rebanada', gramos: 30 }]),
    propio('p-manteca', 'Manteca', v(717, 0.9, 0.1, 81)),
    propio('p-arroz', 'Arroz', v(130, 2.7, 28, 0.3)),
  ];
  const recetas: Receta[] = [
    { id: 'r-batido', tipo: 'receta', nombre: 'Batido de la mañana', porciones: 1, pesoFinal: null, actualizado: ahora, items: [item('15', 'Banana', 118, 105), item('16', 'Leche', 200, 124), item('17', 'Avena', 40, 156)] },
    { id: 'r-guiso', tipo: 'receta', nombre: 'Guiso de lentejas', porciones: 4, pesoFinal: 2000, actualizado: ahora, items: [item('18', 'Lentejas', 500, 580), item('19', 'Carne', 400, 800)] },
    { id: 'c-desayuno', tipo: 'comida', nombre: 'Desayuno', porciones: 1, pesoFinal: null, actualizado: ahora, items: [item('11', 'Café con leche', 250, 100), item('12', 'Tostada', 50, 146)] },
  ];
  const tuyos = loTuyo(recetas, propios, '1 plato');
  async function decirLoTuyo(texto: string): Promise<Entendido[]> {
    const enLaBase = await nombresDe(texto);
    return entender(leerFrase(texto, 'es', (b) => enLaBase.has(b), tuyos.map((x) => x.nombre)).dichos, para({ conocido: () => true, tuyo: (i) => tuyos[i]?.filas }));
  }
  const elegida = (e: Entendido) => e.opciones[e.elegida];
  const gramos = (e: Entendido) => { const c = elegida(e).cantidad; return 'gramos' in c ? c.gramos : c.gramosPorcion * c.veces; };
  const cuanto = (e: Entendido) => { const c = elegida(e).cantidad; return 'veces' in c ? [c.porcion, c.veces] : c; };

  it('con su porción: las fetas, los vasos y las rebanadas que se dijeron', async () => {
    const casos: [string, string, number][] = [
      ['tres fetas de queso dambo', '1 feta', 3], ['dos vasos de leche', '1 vaso', 2], ['medio vaso de leche', '1 vaso', 0.5], ['dos rebanadas de pan', '1 rebanada', 2],
    ];
    for (const [texto, porcion, veces] of casos) {
      const [e] = await decirLoTuyo(texto);
      expect([texto, elegida(e).alimento.fuente, cuanto(e)]).toEqual([texto, 'propio', [porcion, veces]]);
    }
    expect(Math.round(elegida((await decirLoTuyo('tres fetas de queso dambo'))[0]).valores.kcal)).toBe(210);
  });

  it('con una medida que no tiene, la regla de la medida: dos tazas de mi batido no son un plato', async () => {
    const [batido] = await decirLoTuyo('dos tazas de mi batido de la mañana');
    expect([elegida(batido).alimento.fuente, cuanto(batido)]).toEqual(['receta', ['1 taza', 2]]);
    expect(gramos(batido)).toBeGreaterThan(450);
    expect(kcal(batido)).toBeGreaterThan(105 + 124 + 156);
  });

  it('sin porción, la del mismo alimento en la base: una cucharada de manteca no son 100 g', async () => {
    const [cucharada] = await decirLoTuyo('una cucharada de manteca');
    expect([elegida(cucharada).alimento.fuente, cuanto(cucharada)]).toEqual(['propio', [expect.stringMatching(/^1 cucharada/), 1]]);
    expect(kcal(cucharada)).toBeLessThan(120);
    const [, manteca] = await decirLoTuyo('tostada con manteca');
    expect([elegida(manteca).alimento.fuente, gramos(manteca) < 10, kcal(manteca) < 50]).toEqual(['propio', true, true]);
    const [poco] = await decirLoTuyo('un poco de manteca');
    expect([elegida(poco).alimento.fuente, gramos(poco) < 20]).toEqual(['propio', true]);
  });

  it('un plato, «mucho» o «un poco», como lo de la base; la receta, con el plato que rinde', async () => {
    const [plato] = await decirLoTuyo('un plato de arroz');
    expect([elegida(plato).alimento.fuente, plato.pregunta, plato.opciones.map((o) => ('gramos' in o.cantidad ? o.cantidad.gramos : 0))]).toEqual(['propio', 'tamano', [160, 250, 375]]);
    expect(gramos((await decirLoTuyo('mucho arroz'))[0])).toBe(375);
    // El guiso rinde cuatro platos de 500 g: un poco es menos que un plato.
    const [poco] = await decirLoTuyo('un poco de guiso de lentejas');
    expect([elegida(poco).alimento.fuente, gramos(poco)]).toEqual(['receta', 325]);
  });

  it('una comida guardada que se llama como algo de la base («Asado», «Pizza»): con una cantidad o una medida, la base', async () => {
    const asado: Receta = {
      id: 'c-asado', tipo: 'comida', nombre: 'Asado', porciones: 1, pesoFinal: null, actualizado: ahora,
      items: [item('40', 'Asado de tira', 400, 1880), item('41', 'Chorizo', 100, 340), item('42', 'Morcilla', 80, 300), item('43', 'Ensalada mixta', 150, 37)],
    };
    const pizza: Receta = {
      id: 'c-pizza', tipo: 'comida', nombre: 'Pizza', porciones: 1, pesoFinal: null, actualizado: ahora,
      items: [{ ...item('44', 'Pizza de muzzarella', 258, 687), cantidad: { porcion: '1 porción', gramosPorcion: 86, veces: 3 } }, item('45', 'Gaseosa cola', 372, 156)],
    };
    const comidas = loTuyo([asado, pizza], [], '1 plato');
    const decirConComidas = async (texto: string) => {
      const enLaBase = await nombresDe(texto);
      return entender(leerFrase(texto, 'es', (b) => enLaBase.has(b), comidas.map((x) => x.nombre)).dichos, para({ conocido: () => true, tuyo: (i) => comidas[i]?.filas }));
    };
    const deLaBase = (lista: Entendido[]) => lista.map((e) => [elegida(e).alimento.fuente ?? 'base', elegida(e).alimento.nombre]);
    const [doscientos] = await decirConComidas('200 g de asado');
    expect([elegida(doscientos).alimento.fuente, elegida(doscientos).cantidad]).toEqual([undefined, { gramos: 200 }]);
    expect(deLaBase(await decirConComidas('un poco de asado'))).toEqual([['base', expect.stringMatching(/asado/i)]]);
    expect(deLaBase(await decirConComidas('una porción de pizza'))).toEqual([['base', expect.stringMatching(/pizza/i)]]);
    // «Una pizza y una coca»: una coca, no dos.
    expect(deLaBase(await decirConComidas('una pizza y una coca'))).toEqual([['base', expect.stringMatching(/pizza/i)], ['base', expect.stringMatching(/cola|coca/i)]]);
    // Sin dudas, la comida guardada entera.
    for (const texto of ['mi asado', 'el asado de siempre', 'Asado']) expect([texto, (await decirConComidas(texto)).length]).toEqual([texto, 4]);
    expect((await decirConComidas('mi pizza')).map((e) => Math.round(elegida(e).valores.kcal))).toEqual([687, 156]);
  });

  it('«media tarta» de una receta de seis porciones es la mitad de la tarta, como en la base; «una tarta», una porción', async () => {
    const tarta: Receta = {
      id: 'r-tarta', tipo: 'receta', nombre: 'Tarta de jamón y queso', porciones: 6, pesoFinal: null, actualizado: ahora,
      items: [item('33', 'Masa', 300, 900), item('34', 'Jamón', 200, 250), item('35', 'Queso', 200, 700), item('36', 'Huevos', 150, 215)],
    };
    const pizzaCasera: Receta = { id: 'r-pizza', tipo: 'receta', nombre: 'Pizza casera', porciones: 8, pesoFinal: null, actualizado: ahora, items: [item('30', 'Masa', 500, 1300), item('31', 'Muzzarella', 300, 900), item('32', 'Salsa', 200, 100)] };
    const recetasEnteras = loTuyo([tarta, pizzaCasera], [], '1 plato');
    const conRecetas = (texto: string) => entender(leerFrase(texto, 'es', () => false, recetasEnteras.map((x) => x.nombre)).dichos, para({ tuyo: (i) => recetasEnteras[i]?.filas }));
    const [media] = await conRecetas('media tarta de jamón y queso');
    expect([cuanto(media), Math.round(elegida(media).valores.kcal)]).toEqual([['1 plato', 3], Math.round(2065 / 2)]);
    expect(cuanto((await conRecetas('una tarta de jamón y queso'))[0])).toEqual(['1 plato', 1]);
    expect(cuanto((await conRecetas('media pizza casera'))[0])).toEqual(['1 plato', 4]);
    expect(cuanto((await conRecetas('un cuarto de pizza casera'))[0])).toEqual(['1 plato', 2]);
  });

  it('un alimento tuyo sin porciones, por unidad: la del mismo alimento en la base, y si no hay, pregunta', async () => {
    const huevo = propio('p-huevo', 'Huevo', v(143, 12.6, 0.7, 9.5));
    const huevos = propio('p-huevos', 'Huevos', v(143, 12.6, 0.7, 9.5));
    const raro = propio('p-raro', 'Zxqwerty casero', v(200));
    const conPropio = (texto: string, a: AlimentoPropio) => {
      const solo = loTuyo([], [a], '1 plato');
      return entender(leerFrase(texto, 'es', () => false, solo.map((x) => x.nombre)).dichos, para({ tuyo: (i) => solo[i]?.filas }));
    };
    const [uno] = await conPropio('un huevo', huevo);
    expect([elegida(uno).alimento.fuente, gramos(uno)]).toEqual(['propio', 50]);
    const [dos] = await conPropio('dos huevos', huevos);
    expect([elegida(dos).alimento.fuente, gramos(dos)]).toEqual(['propio', 100]);
    const [raros] = await conPropio('dos zxqwerty casero', raro);
    expect([elegida(raros).alimento.fuente, raros.pregunta, raros.opciones.map((o) => ('gramos' in o.cantidad ? o.cantidad.gramos : 0)), raros.elegida]).toEqual(['propio', 'cuanto', [100, 200, 300], 1]);
  });

  it('lo tuyo en plural: «dos batidos de la mañana», «dos medialunas»', async () => {
    const medialuna = propio('p-medialuna', 'Medialuna', v(410, 8, 45, 22), [{ nombre: '1 unidad', gramos: 45 }]);
    const conPlural = loTuyo(recetas, [medialuna], '1 plato');
    const decirConPlural = (texto: string) => entender(leerFrase(texto, 'es', () => false, conPlural.map((x) => x.nombre)).dichos, para({ tuyo: (i) => conPlural[i]?.filas }));
    const [batidos] = await decirConPlural('dos batidos de la mañana');
    expect([elegida(batidos).alimento.ref, cuanto(batidos)]).toEqual(['r-batido', ['1 plato', 2]]);
    for (const [texto, veces] of [['dos medialunas', 2], ['una medialuna', 1]] as const) {
      const [m] = await decirConPlural(texto);
      expect([texto, elegida(m).alimento.ref, cuanto(m)]).toEqual([texto, 'p-medialuna', ['1 unidad', veces]]);
    }
  });

  it('una comida guardada que se llama «Desayuno» no se suma cuando la frase dice el desayuno', async () => {
    const lista = await decirLoTuyo('Desayuno, dos huevos y un café');
    expect([nombres(lista), lista.some((e) => e.dicho.tuyo !== undefined)]).toEqual([['Huevo', expect.stringMatching(/^Café/)], false]);
    expect((await decirLoTuyo('mi desayuno')).map((e) => elegida(e).alimento.nombre)).toEqual(['Café con leche', 'Tostada']);
  });
});
