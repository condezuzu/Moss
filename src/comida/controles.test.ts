/**
 * Los controles de toda la base de alimentos (assets/alimentos.db, la arma `npm run alimentos`):
 * lo que tiene que cumplir cada alimento, sea de USDA, curado, plato o producto. Con BASE=otra.db
 * se prueba otra base (la de un archivo de alimentos en revisión, por ejemplo).
 * @jest-environment node
 */
/// <reference types="node" />

import { describe, expect, it } from '@jest/globals';
import { DatabaseSync } from 'node:sqlite';
import { join } from 'node:path';

import { MICROS, TOPE_POR_100G } from '../dominio/micronutrientes';

const db = new DatabaseSync(process.env.BASE ? join(__dirname, '../..', process.env.BASE) : join(__dirname, '../../assets/alimentos.db'), { readOnly: true });
type Fila = Record<string, number | string | null> & {
  id: number; fuente: string; descripcion: string; nombre_es: string | null; kcal: number; proteina: number; carbohidratos: number; grasas: number;
  fibra: number | null; azucares: number | null; saturadas: number | null; sodio: number | null; alcohol: number | null; densidad: number | null;
  desecho: number | null; verificado: string | null; segunda: string | null; crudo: number | null; aceite: string | null; porcion: number | null;
};
const todos = db.prepare('SELECT * FROM alimentos').all() as Fila[];
const curados = todos.filter((a) => a.nombre_es);
const nombre = (a: Fila) => `${a.nombre_es ?? a.descripcion} (${a.fuente})`;


/**
 * Las kcal según los macros, de la forma que mejor cierra: con 4/4/9 y 7, o con la fibra a 2 kcal
 * (en Estados Unidos los carbohidratos la cuentan adentro; en Europa, aparte).
 */
function kcalDeLosMacros(a: Fila): number[] {
  const base = 4 * a.proteina + 9 * a.grasas + 7 * (a.alcohol ?? 0);
  const fibra = a.fibra ?? 0;
  return [base + 4 * a.carbohidratos, base + 4 * Math.max(0, a.carbohidratos - fibra) + 2 * fibra, base + 4 * a.carbohidratos + 2 * fibra];
}
const cierra = (a: Fila, parte: number, minimo: number) => kcalDeLosMacros(a).some((k) => Math.abs(a.kcal - k) <= Math.max(minimo, parte * a.kcal));

// Los curados cuyas kcal de USDA no salen de 4/4/9, y por qué: lo que no se digiere entero.
const NO_CIERRAN: Record<string, string> = {
  'Salvado de avena': 'fibra que USDA cuenta casi sin calorías',
  'Cacao en polvo': 'fibra y el alcalinizado',
  'Chicle sin azúcar': 'polioles, de 2,4 kcal por gramo',
  'Polvo de hornear': 'carbohidratos que son sales',
  Stevia: 'el relleno que USDA cuenta sin calorías',
};

describe('cada alimento de la base', () => {
  it('tiene valores posibles por 100 g: nada negativo, los macros no pasan de 100 g y las kcal de 902', () => {
    const malos = todos.filter((a) => a.kcal < 0 || a.proteina < 0 || a.carbohidratos < 0 || a.grasas < 0 || a.kcal > 902
      || a.proteina + a.carbohidratos + a.grasas + (a.alcohol ?? 0) > 100.5);
    expect(malos.map(nombre)).toEqual([]);
  });

  it('lo secundario cierra con lo principal: azúcares y grasas por debajo de su total, el sodio por debajo del de la sal', () => {
    const malos = todos.filter((a) => (a.azucares ?? 0) > a.carbohidratos + 1 || (a.saturadas ?? 0) > a.grasas + 1
      || ['trans', 'monoinsaturadas', 'poliinsaturadas'].some((k) => ((a[k] as number | null) ?? 0) > a.grasas + 1)
      || (a.sodio ?? 0) > 40000 || (a.alcohol ?? 0) > 100 || ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'].some((k) => ((a[k] as number | null) ?? 0) < 0));
    expect(malos.map(nombre)).toEqual([]);
  });

  it('en lo de USDA, la fibra entra en los carbohidratos', () => {
    const malos = todos.filter((a) => (a.fuente === 'sr' || a.fuente === 'fndds') && (a.fibra ?? 0) > a.carbohidratos + 1);
    expect(malos.map(nombre)).toEqual([]);
  });

  it('tiene micronutrientes posibles', () => {
    const malos = todos.flatMap((a) => MICROS.filter((k) => a[k] !== null && ((a[k] as number) < 0 || (a[k] as number) > (TOPE_POR_100G[k] ?? 100))).map((k) => `${nombre(a)}: ${k} ${a[k]}`));
    expect(malos).toEqual([]);
  });

  it('casi todo lo de USDA trae las vitaminas y los minerales', () => {
    const deUsda = todos.filter((a) => a.fuente === 'sr' || a.fuente === 'fndds');
    for (const k of ['calcio', 'hierro', 'potasio', 'vitaminaC'] as const) {
      expect(deUsda.filter((a) => a[k] !== null).length / deUsda.length).toBeGreaterThan(0.9);
    }
  });
});

describe('las calorías cierran con los macros', () => {
  it('en cada curado, con un margen de 35 % o 40 kcal; lo que no cierra tiene su porqué', () => {
    const malos = curados.filter((a) => !cierra(a, 0.35, 40) && !NO_CIERRAN[a.nombre_es!]);
    expect(malos.map((a) => `${nombre(a)}: ${a.kcal} kcal, los macros dan ${Math.round(kcalDeLosMacros(a)[0])}`)).toEqual([]);
  });

  it('en lo que escribimos a mano (propios, productos y platos), más ajustado: 20 % o 15 kcal', () => {
    const malos = curados.filter((a) => ['propio', 'producto', 'receta'].includes(a.fuente) && !cierra(a, 0.2, 15) && !NO_CIERRAN[a.nombre_es!]);
    expect(malos.map((a) => `${nombre(a)}: ${a.kcal} kcal, los macros dan ${Math.round(kcalDeLosMacros(a)[0])}`)).toEqual([]);
  });

  it('en lo de USDA sin curar, casi siempre: un error al leer USDA haría fallar a muchos', () => {
    const deUsda = todos.filter((a) => !a.nombre_es);
    expect(deUsda.filter((a) => !cierra(a, 0.35, 40)).length / deUsda.length).toBeLessThan(0.005);
  });
});

describe('cómo se miden', () => {
  const porciones = db.prepare('SELECT p.id, p.alimento, p.gramos, p.es, a.nombre_es, a.fuente, a.descripcion FROM porciones p JOIN alimentos a ON a.id = p.alimento').all() as {
    id: number; alimento: number; gramos: number; es: string | null; nombre_es: string | null; fuente: string; descripcion: string;
  }[];

  it('cada porción pesa algo posible, de una pizca a una sandía entera', () => {
    expect(porciones.filter((p) => !(p.gramos >= 0.1 && p.gramos <= 10000)).map((p) => `${p.nombre_es ?? p.descripcion}: ${p.gramos}`)).toEqual([]);
  });

  it('la porción de siempre de un curado es de las que se comen de una vez', () => {
    const porId = new Map(porciones.map((p) => [p.id, p]));
    const malos = curados.filter((a) => {
      const p = a.porcion === null ? undefined : porId.get(a.porcion);
      return !p || !p.es || p.gramos < 0.1 || p.gramos > 1500;
    });
    expect(malos.map(nombre)).toEqual([]);
  });

  it('lo que se toma tiene una densidad posible, y lo que tiene parte que no se come, una fracción posible', () => {
    expect(todos.filter((a) => a.densidad !== null && !(a.densidad >= 0.3 && a.densidad <= 2)).map(nombre)).toEqual([]);
    expect(todos.filter((a) => a.desecho !== null && !(a.desecho > 0 && a.desecho < 0.9)).map(nombre)).toEqual([]);
  });

  it('lo cocido rinde algo posible desde su versión cruda: de un cuarto a diez veces, como las papillas (lo frito no cuenta: el rebozado suma)', () => {
    const pares = db.prepare(`SELECT a.nombre_es, a.aceite, c.proteina AS pc, a.proteina AS pa, c.kcal AS kc, a.kcal AS ka FROM alimentos a JOIN alimentos c ON c.id = a.crudo`).all() as {
      nombre_es: string; aceite: string | null; pc: number; pa: number; kc: number; ka: number;
    }[];
    const raros = pares.filter((p) => p.aceite !== 'incluido').filter((p) => {
      const rinde = p.pc >= 1 && p.pa >= 1 ? p.pc / p.pa : p.kc / p.ka;
      return !(rinde >= 0.25 && rinde <= 10);
    });
    expect(raros.map((p) => p.nombre_es)).toEqual([]);
  });
});

describe('los platos', () => {
  const platos = db.prepare('SELECT r.plato, r.peso_final, a.nombre_es, a.kcal, a.proteina FROM recetas r JOIN alimentos a ON a.id = r.plato').all() as {
    plato: number; peso_final: number; nombre_es: string; kcal: number; proteina: number;
  }[];
  const ingredientesDe = db.prepare('SELECT i.gramos, a.kcal, a.proteina FROM ingredientes i JOIN alimentos a ON a.id = i.ingrediente WHERE i.plato = ?');

  it('valen lo que suman sus ingredientes, divididos por lo que pesan terminados', () => {
    const malos = platos.filter((p) => {
      const lista = ingredientesDe.all(p.plato) as { gramos: number; kcal: number; proteina: number }[];
      const kcal = lista.reduce((s, i) => s + i.kcal * i.gramos, 0) / p.peso_final;
      const proteina = lista.reduce((s, i) => s + i.proteina * i.gramos, 0) / p.peso_final;
      return Math.abs(kcal - p.kcal) > 0.6 || Math.abs(proteina - p.proteina) > 0.06;
    });
    expect(malos.map((p) => p.nombre_es)).toEqual([]);
  });

  it('pesan terminados entre el 40 % y el 105 % de sus ingredientes', () => {
    const malos = platos.filter((p) => {
      const crudo = (ingredientesDe.all(p.plato) as { gramos: number }[]).reduce((s, i) => s + i.gramos, 0);
      return p.peso_final < 0.4 * crudo || p.peso_final > 1.05 * crudo;
    });
    expect(malos.map((p) => p.nombre_es)).toEqual([]);
  });
});

describe('lo verificado', () => {
  const hoy = new Date().toISOString().slice(0, 10);

  it('dice el día y con qué, y el día ya pasó', () => {
    const malos = todos.filter((a) => a.verificado !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(a.verificado) || a.verificado > hoy || !a.segunda));
    expect(malos.map(nombre)).toEqual([]);
    expect(todos.filter((a) => a.verificado === null && a.segunda !== null).map(nombre)).toEqual([]);
  });

  it('un plato verificado por sus ingredientes los tiene todos verificados', () => {
    const platos = todos.filter((a) => a.segunda === 'ingredientes');
    const sinVerificar = db.prepare('SELECT count(*) AS n FROM ingredientes i JOIN alimentos a ON a.id = i.ingrediente WHERE i.plato = ? AND a.verificado IS NULL');
    expect(platos.filter((p) => (sinVerificar.get(p.id) as { n: number }).n > 0).map(nombre)).toEqual([]);
  });

  it('un producto verificado por su etiqueta tiene kcal que cierran con sus macros', () => {
    expect(todos.filter((a) => a.segunda === 'etiqueta' && (a.fuente !== 'producto' || !cierra(a, 0.2, 15))).map(nombre)).toEqual([]);
  });
});
