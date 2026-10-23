/**
 * Las comidas tipo se arman con la base de verdad (assets/alimentos.db, la arma `npm run alimentos`),
 * con el SQLite de Node.
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { Comida } from './comidas';
import { sumarDias } from './fechas';
import type { Macros } from './metas';
import {
  adaptar, adaptarRegistros, cambiarPorOtra, comidasDelPlan, diaPlaneadoDe, DIETAS, itemsDeComida, listaDeCompras, MINUTOS, opcionDePlantilla, opcionesTuyas, permitida,
  planearDia, planearSemana, PLANTILLAS, PREFERENCIAS_DE_FABRICA, preferenciasDe, queFalta, recientesDe, REPARTO, type DiaPlaneado, type Opcion, type Preferencias,
  type Resolver,
} from './plan';
import { gramosDe, itemDeAlimento, itemRapido, valoresDeCantidad, type Item, type Registro, type Valores } from './registros';

// ------------------------------------------------------------ la base y las comidas tipo

const db = new DatabaseSync(join(__dirname, '../../assets/alimentos.db'), { readOnly: true });
type Fila = { id: number; kcal: number; proteina: number; carbohidratos: number; grasas: number } & Partial<Record<'fibra' | 'azucares' | 'saturadas' | 'sodio' | 'alcohol', number | null>>;
const resolver: Resolver = (nombre) => {
  const a = db.prepare('SELECT * FROM alimentos WHERE nombre_es = ?').get(nombre) as Fila | undefined;
  if (!a) return null;
  const por100g: Valores = { kcal: a.kcal, proteina: a.proteina, carbohidratos: a.carbohidratos, grasas: a.grasas };
  for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const) if (a[k] != null) por100g[k] = a[k]!;
  const porciones = db.prepare('SELECT coalesce(es, en) AS nombre, gramos FROM porciones WHERE alimento = ? ORDER BY id').all(a.id) as { nombre: string; gramos: number }[];
  return { fuente: 'base', ref: String(a.id), nombre, por100g, porciones };
};
const TIPO = PLANTILLAS.map((p) => opcionDePlantilla(p, resolver, 'es')).filter((op): op is Opcion => op !== null);
const plantilla = (clave: string) => PLANTILLAS.find((p) => p.clave === clave)!;

const HOY = '2026-10-21';
const META: Macros = { kcal: 2200, proteina: 140, carbohidratos: 250, grasas: 70 };
const TODO: Preferencias = { dieta: 'todo', alergias: [], comidas: 4, tiempo: 'mucho', noMeGusta: [], meGusta: [] };
const SEMILLAS = Array.from({ length: 20 }, (_, i) => i + 1);

const cerca = (valor: number, meta: number, margen: number) => Math.abs(valor - meta) <= margen * meta;
const todasLasComidas = (dias: DiaPlaneado[]) => dias.flatMap((d) => d.comidas);

// ------------------------------------------------------------ lo tuyo

// Por 100 g, como en la base.
const AVENA: Valores = { kcal: 389, proteina: 16.9, carbohidratos: 66.3, grasas: 6.9, fibra: 10.6 };
const LECHE: Valores = { kcal: 61, proteina: 3.3, carbohidratos: 4.6, grasas: 3.2 };
const BANANA: Valores = { kcal: 89, proteina: 1.1, carbohidratos: 22.8, grasas: 0.3, fibra: 2.6 };
const POLLO: Valores = { kcal: 176, proteina: 29.6, carbohidratos: 0, grasas: 5.5 };
const ARROZ: Valores = { kcal: 129, proteina: 2.7, carbohidratos: 28, grasas: 0.3 };
const avena = (gramos = 40) => itemDeAlimento('base', '1', 'Avena', AVENA, { gramos });
const leche = () => itemDeAlimento('base', '2', 'Leche entera', LECHE, { porcion: '1 vaso (200 ml)', gramosPorcion: 206, veces: 1 });
const banana = (veces = 1) => itemDeAlimento('base', '3', 'Banana', BANANA, { porcion: '1 mediana', gramosPorcion: 118, veces });
const pollo = (gramos = 150) => itemDeAlimento('base', '4', 'Pechuga de pollo a la plancha', POLLO, { gramos });
const arroz = (gramos = 150) => itemDeAlimento('base', '5', 'Arroz blanco cocido', ARROZ, { gramos });

let siguiente = 0;
/** Un registro: `hora` es la hora local en Montevideo (UTC−3). */
function reg(item: Item, dia: string, comida: Comida, hora: number, extra: Partial<Registro> = {}): Registro {
  const momento = new Date(Date.parse(`${dia}T00:00:00Z`) + (hora + 3) * 3_600_000).toISOString();
  return { ...item, id: `r${++siguiente}`, dia, comida, momento, planificado: false, actualizado: momento, ...extra };
}
const hace = (n: number) => sumarDias(HOY, -n);

/** Desayuno de avena, leche y banana cinco veces; almuerzo de pollo con arroz cuatro. */
const HISTORIAL: Registro[] = [
  ...[1, 2, 3, 5, 8].flatMap((n) => [reg(avena(), hace(n), 'desayuno', 8), reg(leche(), hace(n), 'desayuno', 8), reg(banana(), hace(n), 'desayuno', 8.1)]),
  ...[1, 2, 4, 6].flatMap((n) => [reg(pollo(), hace(n), 'almuerzo', 13), reg(arroz(), hace(n), 'almuerzo', 13)]),
];

const BIZCOCHO: Valores = { kcal: 410, proteina: 6, carbohidratos: 50, grasas: 20 };
const FIDEOS: Valores = { kcal: 158, proteina: 5.8, carbohidratos: 30.9, grasas: 0.9 };
const bizcocho = () => itemDeAlimento('base', '6', 'Bizcocho', BIZCOCHO, { porcion: '1 unidad', gramosPorcion: 40, veces: 2 });
const fideos = () => itemDeAlimento('base', '7', 'Fideos', FIDEOS, { gramos: 300 });
/** Un día entero de lo tuyo, con la proteína sobre todo en un almuerzo grande (como el bife con arroz de la galería). */
const DIA_ENTERO: Registro[] = [1, 2, 3].flatMap((n) => [
  reg(avena(), hace(n), 'desayuno', 8), reg(leche(), hace(n), 'desayuno', 8), reg(banana(), hace(n), 'desayuno', 8.1),
  reg(pollo(150), hace(n), 'almuerzo', 13), reg(arroz(400), hace(n), 'almuerzo', 13),
  reg(bizcocho(), hace(n), 'merienda', 17), reg(banana(), hace(n), 'merienda', 17),
  reg(fideos(), hace(n), 'cena', 21),
]);

describe('las comidas tipo', () => {
  it('cada alimento es un curado de la base, con su nombre exacto en español', () => {
    const existe = db.prepare('SELECT 1 FROM alimentos WHERE nombre_es = ?');
    const faltan = PLANTILLAS.flatMap((p) => p.items.filter(([nombre]) => !existe.get(nombre)).map(([nombre]) => `${p.clave}: ${nombre}`));
    expect(faltan).toEqual([]);
    expect(TIPO).toHaveLength(PLANTILLAS.length);
  });

  it('las claves no se repiten, y cada dieta tiene de cada comida, y algo rápido', () => {
    expect(new Set(PLANTILLAS.map((p) => p.clave)).size).toBe(PLANTILLAS.length);
    expect(PLANTILLAS.length).toBeGreaterThanOrEqual(40);
    for (const dieta of DIETAS) {
      for (const comida of comidasDelPlan(5)) {
        const deEsa = PLANTILLAS.filter((p) => p.comida === comida && p.dietas.includes(dieta));
        expect([dieta, comida, deEsa.length > 0]).toEqual([dieta, comida, true]);
        expect([dieta, comida, deEsa.some((p) => p.minutos <= MINUTOS.poco)]).toEqual([dieta, comida, true]);
      }
    }
  });

  it('los gramos van en una porción con nombre si caben justos; si no, en gramos', () => {
    const op = opcionDePlantilla(plantilla('tofu-revuelto'), resolver, 'es')!;
    expect(op.items.map((it) => it.cantidad)).toEqual([
      { gramos: 150 },
      { porcion: '1 taza', gramosPorcion: 30, veces: 1 },
      { porcion: '1 mediano', gramosPorcion: 123, veces: 1 },
      { porcion: '1 rebanada', gramosPorcion: 32, veces: 2 },
      { porcion: '1 cucharadita', gramosPorcion: 4.5, veces: 1 },
    ]);
    // 150 g de tofu firme: 144 kcal cada 100 g.
    expect(op.items[0].valores.kcal).toBeCloseTo(216, 6);
    expect(op).toMatchObject({ clave: 'tofu-revuelto', nombre: 'Tofu revuelto con espinaca y tostadas', comida: 'desayuno', origen: 'tipo', veces: 0, dietas: DIETAS, contiene: ['soja', 'gluten'] });
    expect(opcionDePlantilla(plantilla('tofu-revuelto'), resolver, 'en')!.nombre).toBe('Tofu scramble with spinach on toast');
  });

  it('si falta un alimento en la base, no hay comida tipo', () => {
    expect(opcionDePlantilla(plantilla('avena-banana'), (nombre) => (nombre === 'Banana' ? null : resolver(nombre)), 'es')).toBeNull();
  });
});

describe('las comidas del día y los filtros', () => {
  it('3 comidas son desayuno, almuerzo y cena; 4 suman la merienda, y 5, el snack; el reparto suma el día', () => {
    expect(comidasDelPlan(3)).toEqual(['desayuno', 'almuerzo', 'cena']);
    expect(comidasDelPlan(4)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena']);
    expect(comidasDelPlan(5)).toEqual(['desayuno', 'almuerzo', 'merienda', 'cena', 'snack']);
    for (const n of [3, 4, 5] as const) expect(Object.values(REPARTO[n]).reduce((s, x) => s + x!, 0)).toBeCloseTo(1, 9);
  });

  it('la dieta, las alergias, lo que no gusta y el tiempo para cocinar', () => {
    const tipo = (clave: string) => TIPO.find((op) => op.clave === clave)!;
    expect(permitida(tipo('pollo-arroz'), TODO)).toBe(true);
    expect(permitida(tipo('pollo-arroz'), { ...TODO, dieta: 'vegetariana' })).toBe(false);
    expect(permitida(tipo('merluza-papas'), { ...TODO, dieta: 'pescetariana' })).toBe(true);
    expect(permitida(tipo('tacos-frijoles'), { ...TODO, dieta: 'vegana' })).toBe(true);
    expect(permitida(tipo('fideos-bolonesa'), { ...TODO, alergias: ['gluten'] })).toBe(false);
    expect(permitida(tipo('pollo-arroz'), { ...TODO, noMeGusta: ['pollo-arroz'] })).toBe(false);
    // Poco es hasta 15 minutos; normal, hasta 40.
    expect(permitida(tipo('tacos-frijoles'), { ...TODO, tiempo: 'poco' })).toBe(true);
    expect(permitida(tipo('pollo-arroz'), { ...TODO, tiempo: 'poco' })).toBe(false);
    expect(permitida(tipo('guiso-lentejas'), { ...TODO, tiempo: 'normal' })).toBe(false);
  });

  it('lo tuyo es de tu dieta y no se filtra por alergias, que no se saben; lo que no te gusta, sí', () => {
    const [desayuno] = opcionesTuyas(HISTORIAL, HOY);
    const estricta: Preferencias = { ...TODO, dieta: 'vegana', alergias: ['leche', 'gluten'], tiempo: 'poco' };
    expect(permitida(desayuno, estricta)).toBe(true);
    expect(permitida(desayuno, { ...estricta, noMeGusta: [desayuno.clave] })).toBe(false);
  });
});

describe('lo tuyo', () => {
  it('cada comida de cada día; lo mismo es la misma opción, con la cantidad del medio y cuántas veces', () => {
    const lista = [
      reg(avena(40), hace(1), 'desayuno', 8), reg(banana(), hace(1), 'desayuno', 8),
      reg(avena(60), hace(2), 'desayuno', 8), reg(banana(2), hace(2), 'desayuno', 8),
      reg(avena(50), hace(3), 'desayuno', 8), reg(banana(), hace(3), 'desayuno', 8),
      reg(pollo(), hace(1), 'cena', 21),
    ];
    const opciones = opcionesTuyas(lista, HOY);
    expect(opciones).toHaveLength(1);
    const [op] = opciones;
    expect(op).toMatchObject({ comida: 'desayuno', origen: 'tuya', veces: 3, nombre: null, contiene: [], minutos: 0, dietas: DIETAS });
    expect(op.items.map((it) => [it.nombre, it.cantidad])).toEqual([
      ['Avena', { gramos: 50 }],
      ['Banana', { porcion: '1 mediana', gramosPorcion: 118, veces: 1 }],
    ]);
    const esperado = valoresDeCantidad(AVENA, { gramos: 50 });
    expect(Object.keys(op.items[0].valores).sort()).toEqual(Object.keys(esperado).sort());
    for (const k of ['kcal', 'proteina', 'carbohidratos', 'grasas', 'fibra'] as const) expect(op.items[0].valores[k]).toBeCloseTo(esperado[k]!, 9);
    expect(op.items[1].valores.kcal).toBeCloseTo(105.02, 6);
  });

  it('sin lo planificado, lo borrado ni lo de hace más de cuatro semanas', () => {
    const desayuno = (dia: string, extra: Partial<Registro> = {}) => [reg(avena(), dia, 'desayuno', 8, extra), reg(banana(), dia, 'desayuno', 8, extra)];
    const lista = [...desayuno(hace(1)), ...desayuno(sumarDias(HOY, 1), { planificado: true }), ...desayuno(hace(2), { borrado: true }), ...desayuno(hace(28))];
    expect(opcionesTuyas(lista, HOY)).toEqual([]);
    expect(opcionesTuyas(lista, HOY, 29)).toHaveLength(1);
  });

  it('lo anotado dos veces en una comida es un alimento, y la carga rápida va por su nombre', () => {
    const alfajor = (nombre: string) => itemRapido(nombre, { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 });
    const lista = [
      reg(banana(), hace(1), 'merienda', 17), reg(banana(), hace(1), 'merienda', 17.2), reg(alfajor('Alfajor'), hace(1), 'merienda', 17),
      reg(banana(2), hace(2), 'merienda', 17), reg(alfajor('alfajor '), hace(2), 'merienda', 17),
    ];
    const [op] = opcionesTuyas(lista, HOY);
    expect(op.veces).toBe(2);
    expect(op.items.map((it) => [it.fuente, it.cantidad])).toEqual([['base', { porcion: '1 mediana', gramosPorcion: 118, veces: 2 }], ['rapida', null]]);
  });

  it('va en la comida en que más se comió, y lo que más se come va primero', () => {
    const lista = [
      ...HISTORIAL,
      ...[1, 2].flatMap((n) => [reg(pollo(), hace(n), 'cena', 21), reg(arroz(), hace(n), 'cena', 21)]),
    ];
    const opciones = opcionesTuyas(lista, HOY);
    expect(opciones.map((op) => [op.comida, op.veces])).toEqual([['almuerzo', 6], ['desayuno', 5]]);
  });
});

describe('un día', () => {
  const opciones = [...opcionesTuyas(HISTORIAL, HOY), ...TIPO];

  it('la misma semilla da el mismo plan, y otra semilla, otro', () => {
    const plan = (semilla: number) => planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla });
    expect(plan(7)).toEqual(plan(7));
    expect(new Set(SEMILLAS.map((s) => plan(s).comidas.map((c) => c.opcion).join())).size).toBeGreaterThan(5);
  });

  it('llega a la meta: las kcal a menos de un 5 % y la proteína al 90 %', () => {
    for (const pref of [TODO, { ...TODO, comidas: 3 as const }, { ...TODO, comidas: 5 as const }, { ...TODO, dieta: 'vegetariana' as const }]) {
      for (const semilla of SEMILLAS) {
        const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref, semilla });
        expect(dia.comidas.map((c) => c.comida)).toEqual(comidasDelPlan(pref.comidas));
        expect(cerca(dia.valores.kcal, META.kcal, 0.05)).toBe(true);
        expect(dia.valores.proteina).toBeGreaterThanOrEqual(0.9 * META.proteina);
        expect(dia.alcanza).toBe(true);
      }
    }
  });

  it('cada comida queda cerca de su parte del día, aunque falte proteína', () => {
    // Para llegar a la proteína, el almuerzo se duplicaba y lo demás quedaba en la mitad: un almuerzo
    // de 1.700 kcal con un desayuno de 190 (lo mostró la galería el 23/10).
    const tuyas = opcionesTuyas(DIA_ENTERO, HOY);
    expect(tuyas.map((op) => op.comida).sort()).toEqual(['almuerzo', 'cena', 'desayuno', 'merienda']);
    for (const opciones of [tuyas, [...tuyas, ...TIPO], TIPO]) {
      for (const meta of [META, { ...META, kcal: 2580, proteina: 150 }, { ...META, proteina: 180 }]) {
        for (const semilla of SEMILLAS.slice(0, 8)) {
          const dia = planearDia({ dia: HOY, meta, opciones, pref: TODO, semilla });
          expect(cerca(dia.valores.kcal, meta.kcal, 0.05)).toBe(true);
          const fuera = dia.comidas.filter((c) => {
            const suya = REPARTO[4][c.comida]! * meta.kcal;
            return c.valores.kcal < 0.6 * suya || c.valores.kcal > 1.5 * suya;
          });
          expect(fuera.map((c) => `${c.comida}: ${Math.round(c.valores.kcal)} kcal`)).toEqual([]);
        }
      }
    }
  });

  it('primero lo tuyo que comés seguido', () => {
    const [desayuno, almuerzo] = opcionesTuyas(HISTORIAL, HOY);
    for (const semilla of SEMILLAS) {
      const dia = planearDia({ dia: HOY, meta: META, opciones, pref: TODO, semilla });
      expect(dia.comidas.map((c) => c.opcion).slice(0, 2)).toEqual([desayuno.clave, almuerzo.clave]);
      expect(dia.alcanza).toBe(true);
    }
  });

  it('después, lo que te gusta', () => {
    for (const semilla of SEMILLAS) {
      const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: { ...TODO, meGusta: ['salmon-quinoa', 'yogur-manzana'] }, semilla });
      expect(dia.comidas.find((c) => c.comida === 'almuerzo')!.opcion).toBe('salmon-quinoa');
      expect(dia.comidas.find((c) => c.comida === 'merienda')!.opcion).toBe('yogur-manzana');
    }
  });

  it('evita lo de los últimos días, si hay con qué', () => {
    const [desayuno, almuerzo] = opcionesTuyas(HISTORIAL, HOY);
    const dia = planearDia({ dia: HOY, meta: META, opciones, pref: TODO, semilla: 3, recientes: [desayuno.clave] });
    expect(dia.comidas.map((c) => c.opcion)).not.toContain(desayuno.clave);
    expect(dia.comidas[1].opcion).toBe(almuerzo.clave);
    const soloLoTuyo = planearDia({ dia: HOY, meta: META, opciones: [desayuno], pref: TODO, semilla: 3, recientes: [desayuno.clave] });
    expect(soloLoTuyo.comidas.map((c) => [c.comida, c.opcion])).toEqual([['desayuno', desayuno.clave]]);
  });

  it('lo que no te gusta no se propone nunca, ni lo tuyo', () => {
    const tuyas = opcionesTuyas(HISTORIAL, HOY);
    const noMeGusta = [tuyas[0].clave, 'pollo-arroz', 'avena-banana', 'atun-garbanzos', 'batido-proteina', 'carne-papa'];
    for (const semilla of SEMILLAS.slice(0, 5)) {
      const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones, pref: { ...TODO, noMeGusta }, semilla });
      expect(todasLasComidas(semana).filter((c) => noMeGusta.includes(c.opcion))).toEqual([]);
    }
  });

  it('respeta la dieta, las alergias y el tiempo para cocinar', () => {
    const casos: Preferencias[] = [
      { ...TODO, dieta: 'vegana', alergias: ['gluten'] },
      { ...TODO, dieta: 'pescetariana', alergias: ['leche', 'huevo'] },
      { ...TODO, tiempo: 'poco', alergias: ['mani', 'frutosSecos'] },
    ];
    for (const pref of casos) {
      for (const semilla of SEMILLAS.slice(0, 5)) {
        for (const c of todasLasComidas(planearSemana({ desde: HOY, metaDe: () => META, opciones: TIPO, pref, semilla }))) {
          const p = plantilla(c.opcion);
          expect(p.dietas).toContain(pref.dieta);
          expect(p.contiene.filter((a) => pref.alergias.includes(a))).toEqual([]);
          expect(p.minutos).toBeLessThanOrEqual(MINUTOS[pref.tiempo]);
        }
      }
    }
  });

  it('si no se puede llegar, queda lo más cerca posible y lo dice', () => {
    const dia = planearDia({ dia: HOY, meta: { ...META, proteina: 260 }, opciones: TIPO, pref: { ...TODO, dieta: 'vegana' }, semilla: 1 });
    expect(dia.alcanza).toBe(false);
    expect(cerca(dia.valores.kcal, META.kcal, 0.05)).toBe(true);
    // Cada comida va hasta el doble de lo de siempre: 6.000 kcal no entran en cuatro comidas tipo.
    expect(planearDia({ dia: HOY, meta: { ...META, kcal: 6000 }, opciones: TIPO, pref: TODO, semilla: 1 }).alcanza).toBe(false);
  });

  it('sin opciones no hay comidas', () => {
    expect(planearDia({ dia: HOY, meta: META, opciones: [], pref: TODO, semilla: 1 })).toMatchObject({ dia: HOY, comidas: [], alcanza: false });
  });

  it('a la tarde arma solo lo que falta, con lo que dejó lo que ya comiste', () => {
    const desayuno = { kcal: 450, proteina: 25, carbohidratos: 55, grasas: 14 };
    const almuerzo = { kcal: 700, proteina: 45, carbohidratos: 75, grasas: 22 };
    const yaComido = { kcal: desayuno.kcal + almuerzo.kcal, proteina: 70, carbohidratos: 130, grasas: 36 };
    for (const semilla of SEMILLAS.slice(0, 8)) {
      const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla, solo: ['merienda', 'cena'], yaComido });
      expect(dia.comidas.map((c) => c.comida)).toEqual(['merienda', 'cena']);
      expect(cerca(dia.valores.kcal, META.kcal - yaComido.kcal, 0.05)).toBe(true);
    }
    // Si ya comiste lo del día, no hay nada que armar.
    expect(planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla: 1, solo: ['cena'], yaComido: META })).toMatchObject({ comidas: [], alcanza: true });
  });

  it('las cantidades van de a media porción o de a 5 g, y nunca menos', () => {
    for (const semilla of SEMILLAS.slice(0, 5)) {
      const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones, pref: { ...TODO, comidas: 5 }, semilla });
      for (const it of todasLasComidas(semana).flatMap((c) => c.items)) {
        const c = it.cantidad!;
        if ('porcion' in c) {
          expect(Number.isInteger(c.veces * 2) && c.veces >= 0.5).toBe(true);
        } else {
          expect(c.gramos % 5 === 0 && c.gramos >= 5).toBe(true);
        }
      }
    }
  });

  it('los valores van por lo que quedó, como valoresDeCantidad: con el aceite y los micronutrientes', () => {
    const POR100G: Valores = { ...POLLO, fibra: 0, sodio: 74, micros: { potasio: 256, vitaminaB6: 0.6 } };
    const conAceite = itemDeAlimento('base', '9', 'Pechuga a la plancha', POR100G, { gramos: 150, aceite: 4.5 });
    const mia: Opcion = { clave: 'tuya:pechuga', nombre: null, comida: 'almuerzo', items: [conAceite, arroz()], origen: 'tuya', veces: 5, dietas: [...DIETAS], contiene: [], minutos: 0 };
    for (const meta of [META, { ...META, kcal: 2900 }, { ...META, kcal: 1500 }]) {
      const dia = planearDia({ dia: HOY, meta, opciones: [mia, ...TIPO], pref: TODO, semilla: 2 });
      const [pechuga] = dia.comidas.find((c) => c.comida === 'almuerzo')!.items;
      const c = pechuga.cantidad as { gramos: number; aceite: number };
      expect(c.aceite / c.gramos).toBeCloseTo(4.5 / 150, 9);
      const esperado = valoresDeCantidad(POR100G, c);
      for (const k of ['kcal', 'proteina', 'grasas', 'saturadas', 'sodio', 'fibra'] as const) expect(pechuga.valores[k]).toBeCloseTo(esperado[k]!, 6);
      expect(pechuga.valores.micros!.potasio).toBeCloseTo(esperado.micros!.potasio!, 6);
      expect(pechuga.valores.micros!.vitaminaB6).toBeCloseTo(esperado.micros!.vitaminaB6!, 6);
    }
  });
});

describe('la semana', () => {
  it('siete días seguidos, cada uno con su meta', () => {
    const alto = { ...META, kcal: 2600, carbohidratos: 350 };
    const metaDe = (dia: string) => (dia === sumarDias(HOY, 5) ? alto : META);
    const semana = planearSemana({ desde: HOY, metaDe, opciones: TIPO, pref: TODO, semilla: 1 });
    expect(semana.map((d) => d.dia)).toEqual(Array.from({ length: 7 }, (_, i) => sumarDias(HOY, i)));
    for (const d of semana) expect(cerca(d.valores.kcal, metaDe(d.dia).kcal, 0.05)).toBe(true);
    expect(planearSemana({ desde: HOY, metaDe, opciones: TIPO, pref: TODO, semilla: 1 })).toEqual(semana);
  });

  it('el mismo almuerzo o la misma cena, a lo sumo dos veces y nunca dos días seguidos', () => {
    const opciones = [...opcionesTuyas(HISTORIAL, HOY), ...TIPO];
    for (const semilla of SEMILLAS) {
      const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones, pref: TODO, semilla });
      const grandes = semana.map((d) => d.comidas.filter((c) => c.comida === 'almuerzo' || c.comida === 'cena').map((c) => c.opcion));
      const veces = new Map<string, number>();
      for (const clave of grandes.flat()) veces.set(clave, (veces.get(clave) ?? 0) + 1);
      expect(Math.max(...veces.values())).toBeLessThanOrEqual(2);
      for (let i = 1; i < 7; i++) expect(grandes[i].filter((clave) => grandes[i - 1].includes(clave))).toEqual([]);
      expect(semana.every((d) => d.alcanza)).toBe(true);
    }
  });
});

describe('cambiar por otra', () => {
  it('otra comida, que no está en el día, con las kcal y la proteína a menos de un 15 %', () => {
    let distintas = 0;
    for (const semilla of SEMILLAS) {
      const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla });
      for (const comida of comidasDelPlan(4)) {
        const nuevo = cambiarPorOtra(dia, comida, { opciones: TIPO, pref: TODO, meta: META, semilla: semilla + 100 });
        expect(nuevo).not.toBeNull();
        const i = dia.comidas.findIndex((c) => c.comida === comida);
        const [antes, despues] = [dia.comidas[i], nuevo!.comidas[i]];
        expect(dia.comidas.map((c) => c.opcion)).not.toContain(despues.opcion);
        expect(cerca(despues.valores.kcal, antes.valores.kcal, 0.15)).toBe(true);
        expect(Math.abs(despues.valores.proteina - antes.valores.proteina)).toBeLessThanOrEqual(Math.max(0.15 * antes.valores.proteina, 3));
        expect(nuevo!.comidas.filter((_, j) => j !== i)).toEqual(dia.comidas.filter((_, j) => j !== i));
        expect(nuevo!.valores.kcal).toBeCloseTo(nuevo!.comidas.reduce((s, c) => s + c.valores.kcal, 0), 6);
        if (despues.opcion !== antes.opcion) distintas++;
      }
    }
    expect(distintas).toBe(SEMILLAS.length * 4);
  });

  it('nunca propone lo que no te gusta, y sin otra parecida no hay cambio', () => {
    const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla: 4 });
    const enElDia = dia.comidas.map((c) => c.opcion);
    const grandes = TIPO.filter((op) => (op.comida === 'almuerzo' || op.comida === 'cena') && !enElDia.includes(op.clave)).map((op) => op.clave);
    const noMeGusta = grandes.filter((_, i) => i % 2 === 0);
    for (const semilla of SEMILLAS) {
      const nuevo = cambiarPorOtra(dia, 'almuerzo', { opciones: TIPO, pref: { ...TODO, noMeGusta }, meta: META, semilla });
      if (nuevo) expect(noMeGusta).not.toContain(nuevo.comidas[1].opcion);
    }
    expect(cambiarPorOtra(dia, 'almuerzo', { opciones: TIPO, pref: { ...TODO, noMeGusta: grandes }, meta: META, semilla: 1 })).toBeNull();
    // Un plan de cuatro comidas no tiene snack.
    expect(cambiarPorOtra(dia, 'snack', { opciones: TIPO, pref: TODO, meta: META, semilla: 1 })).toBeNull();
  });
});

describe('adaptar', () => {
  it('las mismas comidas, escaladas a la meta nueva', () => {
    const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones: TIPO, pref: TODO, semilla: 9 });
    for (const nueva of [{ ...META, kcal: 2500, proteina: 150 }, { ...META, kcal: 1900, proteina: 130 }]) {
      const adaptada = adaptar(semana, () => nueva);
      expect(adaptada.map((d) => d.comidas.map((c) => c.opcion))).toEqual(semana.map((d) => d.comidas.map((c) => c.opcion)));
      for (const d of adaptada) {
        expect(cerca(d.valores.kcal, nueva.kcal, 0.05)).toBe(true);
        expect(d.alcanza).toBe(true);
      }
      const gramos = (d: DiaPlaneado) => d.comidas.flatMap((c) => c.items).reduce((s, it) => s + (gramosDe(it.cantidad) ?? 0), 0);
      expect(gramos(adaptada[0]) > gramos(semana[0])).toBe(nueva.kcal > META.kcal);
    }
  });

  it('cada día con su meta: desde el control, la nueva', () => {
    const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones: TIPO, pref: TODO, semilla: 9 });
    const control = sumarDias(HOY, 3);
    const adaptada = adaptar(semana, (dia) => (dia < control ? META : { ...META, kcal: 1800 }));
    for (const d of adaptada) expect(cerca(d.valores.kcal, d.dia < control ? META.kcal : 1800, 0.05)).toBe(true);
  });
});

describe('la lista de compras', () => {
  const dia = (fecha: string, items: Item[]): DiaPlaneado => {
    const valores = items.reduce((s, it) => ({ ...s, kcal: s.kcal + it.valores.kcal }), { kcal: 0, proteina: 0, carbohidratos: 0, grasas: 0 });
    return { dia: fecha, comidas: [{ comida: 'almuerzo', opcion: 'x', items, valores }], valores, alcanza: true };
  };
  const alfajor = (nombre: string) => itemRapido(nombre, { kcal: 250, proteina: 3, carbohidratos: 35, grasas: 11 });
  const tarta: Item = { fuente: 'receta', ref: 'tarta', nombre: 'Tarta de verduras', cantidad: { porcion: '1 porción', gramosPorcion: 150, veces: 2 }, valores: { kcal: 600, proteina: 20, carbohidratos: 60, grasas: 30 } };
  const arandanos = itemDeAlimento('base', '6', 'Arándanos', { kcal: 57, proteina: 0.7, carbohidratos: 14.5, grasas: 0.3 }, { gramos: 75 });

  it('suma los gramos de cada alimento, cuenta la carga rápida y deja la receta en una línea, por nombre', () => {
    const plan = [dia(HOY, [arroz(150), banana(1), alfajor('Alfajor'), tarta]), dia(sumarDias(HOY, 1), [arroz(200), banana(2), alfajor('alfajor'), arandanos])];
    expect(listaDeCompras(plan)).toEqual([
      { clave: 'rapida:alfajor', nombre: 'Alfajor', gramos: 0, porciones: null, comidas: 2 },
      { clave: 'base:6', nombre: 'Arándanos', gramos: 75, porciones: null, comidas: 1 },
      { clave: 'base:5', nombre: 'Arroz blanco cocido', gramos: 350, porciones: null, comidas: 2 },
      { clave: 'base:3', nombre: 'Banana', gramos: 354, porciones: { nombre: '1 mediana', veces: 3 }, comidas: 2 },
      { clave: 'receta:tarta', nombre: 'Tarta de verduras', gramos: 300, porciones: { nombre: '1 porción', veces: 2 }, comidas: 1 },
    ]);
  });

  it('de una semana planeada: cada alimento una sola vez', () => {
    const semana = planearSemana({ desde: HOY, metaDe: () => META, opciones: TIPO, pref: TODO, semilla: 5 });
    const lista = listaDeCompras(semana);
    expect(new Set(lista.map((x) => x.clave)).size).toBe(lista.length);
    const items = todasLasComidas(semana).flatMap((c) => c.items);
    expect(lista.reduce((s, x) => s + x.comidas, 0)).toBe(items.length);
  });
});

describe('lo que usa la app', () => {
  /** Un día armado, como lo guarda el almacén: un registro por alimento, planificado y con su opción. */
  function guardado(dia: DiaPlaneado): Registro[] {
    return dia.comidas.flatMap((c, i) => c.items.map((it, j) => reg(it, dia.dia, c.comida, 8 + 4 * i + j / 100, { planificado: true, plan: c.opcion })));
  }

  it('las preferencias de la cuenta: lo que no se entiende queda como de fábrica', () => {
    expect(preferenciasDe(null)).toBeNull();
    expect(preferenciasDe([])).toBeNull();
    expect(preferenciasDe({})).toEqual(PREFERENCIAS_DE_FABRICA);
    expect(preferenciasDe({ dieta: 'carnivora', alergias: ['mani', 'polvo', 'mani'], comidas: 6, tiempo: 'poco', noMeGusta: ['a', 'a', 7, ''], meGusta: 'b' }))
      .toEqual({ dieta: 'todo', alergias: ['mani'], comidas: 4, tiempo: 'poco', noMeGusta: ['a'], meGusta: [] });
    expect(preferenciasDe({ dieta: 'vegana', comidas: 3 })).toMatchObject({ dieta: 'vegana', comidas: 3, tiempo: 'normal' });
  });

  it('lo planificado de un día, como un día del plan: por comida, con su opción', () => {
    const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla: 4 });
    const aMano = reg(banana(), HOY, 'snack', 11, { planificado: true });
    const otroDia = reg(banana(), hace(1), 'cena', 21, { planificado: true });
    const anotado = reg(arroz(), HOY, 'almuerzo', 13.5);
    const vuelta = diaPlaneadoDe([...guardado(dia), aMano, otroDia, anotado], HOY);
    expect(vuelta.comidas.map((c) => [c.comida, c.opcion])).toEqual([...dia.comidas.map((c) => [c.comida, c.opcion]), ['snack', 'planificada:snack']]);
    expect(vuelta.comidas[0].items).toEqual(dia.comidas[0].items);
    expect(vuelta.valores.kcal).toBeCloseTo(dia.valores.kcal + aMano.valores.kcal, 6);
  });

  it('lo que falta armar: nada anotado ni planificado y, hoy, lo que no pasó hace más de una hora', () => {
    const horaDe = (c: Comida) => ({ desayuno: 8, almuerzo: 13, merienda: 17.5, cena: 21, snack: 11 })[c] * 60;
    const registros = [reg(avena(), HOY, 'desayuno', 8), reg(banana(), sumarDias(HOY, 1), 'merienda', 17, { planificado: true })];
    const falta = (dia: string, ahora: number) => queFalta({ registros, dia, hoy: HOY, ahora, pref: TODO, horaDe });
    expect(falta(HOY, 14 * 60)).toEqual(['almuerzo', 'merienda', 'cena']);
    expect(falta(HOY, 14 * 60 + 1)).toEqual(['merienda', 'cena']);
    expect(falta(sumarDias(HOY, 1), 23 * 60)).toEqual(['desayuno', 'almuerzo', 'cena']);
    expect(falta(hace(1), 9 * 60)).toEqual([]);
  });

  it('lo reciente es lo que armó el plan los dos días anteriores', () => {
    const registros = [
      reg(avena(), hace(1), 'desayuno', 8, { planificado: true, plan: 'avena-banana' }),
      reg(pollo(), hace(2), 'almuerzo', 13, { plan: 'pollo-arroz' }),
      reg(arroz(), hace(3), 'cena', 21, { plan: 'viejo' }),
      reg(banana(), HOY, 'merienda', 17, { plan: 'de-hoy' }),
    ];
    expect(recientesDe(registros, HOY).sort()).toEqual(['avena-banana', 'pollo-arroz']);
  });

  it('con la meta nueva, lo armado se escala: los mismos registros, con lo que deja lo demás del día', () => {
    const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla: 6 });
    const registros = [...guardado(dia), reg(banana(2), HOY, 'snack', 11)];
    const nueva = { ...META, kcal: 2500, proteina: 150 };
    const cambiados = adaptarRegistros(registros, HOY, nueva);
    expect(cambiados.length).toBeGreaterThan(0);
    const porId = new Map(registros.map((r) => [r.id, r]));
    for (const r of cambiados) expect(porId.get(r.id)).toMatchObject({ dia: HOY, comida: r.comida, planificado: true, plan: r.plan, nombre: r.nombre });
    const despues = registros.map((r) => cambiados.find((x) => x.id === r.id) ?? r);
    const total = despues.reduce((s, r) => s + r.valores.kcal, 0);
    expect(cerca(total, nueva.kcal, 0.05)).toBe(true);
    // Lo anotado no se toca, y sin nada armado no hay nada que adaptar.
    expect(cambiados.some((r) => r.comida === 'snack')).toBe(false);
    expect(adaptarRegistros([reg(banana(), HOY, 'snack', 11)], HOY, nueva)).toEqual([]);
  });
});

describe('comí esto', () => {
  it('lo de una comida del plan, para registrarlo como cualquier alimento', () => {
    const dia = planearDia({ dia: HOY, meta: META, opciones: TIPO, pref: TODO, semilla: 1 });
    const items = itemsDeComida(dia.comidas[1]);
    expect(items).toEqual(dia.comidas[1].items);
    expect(items[0]).not.toBe(dia.comidas[1].items[0]);
    expect(Object.keys(items[0]).sort()).toEqual(['cantidad', 'fuente', 'nombre', 'ref', 'valores']);
  });
});
