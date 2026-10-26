// Lo que necesita la ventana del alimento, de la base del teléfono (assets/alimentos.db): los
// valores, las porciones en el idioma de la app y cómo se mide (spec/nutricion.md, «Cómo se miden
// los alimentos»): la versión cruda o las cocidas, la parte que no se come, la densidad de lo que
// se toma y el aceite. También, un alimento por su código de barras.

import { MICROS, type Micro, type Micros } from '@/dominio/micronutrientes';

import type { BaseDeAlimentos, Idioma } from './buscar';
import { conUnaUnidad } from './porciones';

export type Valores100 = {
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  fibra?: number;
  azucares?: number;
  saturadas?: number;
  sodio?: number;
  alcohol?: number;
  /** Las vitaminas, los minerales, las otras grasas y la cafeína (src/dominio/micronutrientes.ts). */
  micros?: Micros;
};

export type PorcionDeAlimento = { nombre: string; gramos: number };
export type Pariente = { id: number; nombre: string };

export type Detalle = {
  id: number;
  nombre: string;
  /** De dónde salen los valores: USDA, Moss (propio), un plato hecho receta o un producto con marca. */
  origen: 'usda' | 'propio' | 'receta' | 'producto';
  marca: string | null;
  /** 'off' si los datos son de Open Food Facts, que pide nombrarlo (ODbL). */
  atribucion: 'off' | null;
  por100g: Valores100;
  /** La primera es la de siempre. */
  porciones: PorcionDeAlimento[];
  /** Lo que se toma: g por ml. */
  densidad: number | null;
  /** La parte que no se come de lo que se pesa entero: qué fracción y qué es («cáscara»). */
  desecho: { fraccion: number; que: string } | null;
  aceite: 'preguntar' | 'incluido' | null;
  /** En lo cocido, su versión cruda; en lo crudo, las cocidas. Lo cocido ve también a sus hermanas. */
  crudo: Pariente | null;
  cocidos: Pariente[];
  /** Un plato hecho receta: lo que pesa terminado y sus ingredientes. */
  receta: { pesoFinal: number; ingredientes: { nombre: string; gramos: number }[] } | null;
  /**
   * Verificado (spec/fuentes.md): el día y con qué. Una segunda fuente oficial ('cnf:…'), sus
   * ingredientes ('ingredientes') o su etiqueta ('etiqueta'). Sin verificar, null.
   */
  verificado: { fecha: string; con: string } | null;
};

/** Los micronutrientes de una fila: lo que no es null. Sin ninguno, undefined. */
export function microsDeFila(fila: Partial<Record<Micro, number | null>>): Micros | undefined {
  const m: Micros = {};
  for (const k of MICROS) if (fila[k] != null) m[k] = fila[k]!;
  return Object.keys(m).length ? m : undefined;
}

type FilaAlimento = {
  id: number; fuente: string; descripcion: string; nombre_es: string | null; nombre_en: string | null;
  kcal: number; proteina: number; carbohidratos: number; grasas: number;
  fibra: number | null; azucares: number | null; saturadas: number | null; sodio: number | null; alcohol: number | null;
  marca: string | null; densidad: number | null; desecho: number | null; desecho_es: string | null; desecho_en: string | null;
  aceite: string | null; crudo: number | null; atribucion: string | null; verificado?: string | null; segunda?: string | null;
} & Partial<Record<Micro, number | null>>;

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** Los nombres de unos alimentos en el idioma de la app y, en español, con el de la región si tiene. */
async function nombres(base: BaseDeAlimentos, ids: number[], op: { idioma: Idioma; region?: string }): Promise<Map<number, string>> {
  if (!ids.length) return new Map();
  const lista = ids.join(',');
  const filas = await base.getAllAsync<{ id: number; descripcion: string; nombre_es: string | null; nombre_en: string | null }>(
    `SELECT id, descripcion, nombre_es, nombre_en FROM alimentos WHERE id IN (${lista})`,
  );
  const regionales = op.idioma === 'es' && op.region
    ? new Map((await base.getAllAsync<{ alimento: number; texto: string }>(`SELECT alimento, texto FROM alias WHERE principal = 1 AND region = ? AND alimento IN (${lista})`, op.region)).map((x) => [x.alimento, x.texto]))
    : new Map<number, string>();
  return new Map(filas.map((f) => {
    const regional = regionales.get(f.id);
    return [f.id, op.idioma === 'es' ? (regional ? conMayuscula(regional) : (f.nombre_es ?? f.descripcion)) : (f.nombre_en ?? f.descripcion)];
  }));
}

const ORIGENES: Record<string, Detalle['origen']> = { sr: 'usda', fndds: 'usda', propio: 'propio', receta: 'receta', producto: 'producto' };

export async function detalleDeAlimento(base: BaseDeAlimentos, id: number, op: { idioma: Idioma; region?: string }): Promise<Detalle | null> {
  const [a] = await base.getAllAsync<FilaAlimento>('SELECT * FROM alimentos WHERE id = ?', id);
  if (!a) return null;
  const porciones = conUnaUnidad((await base.getAllAsync<{ es: string | null; en: string; gramos: number }>('SELECT es, en, gramos FROM porciones WHERE alimento = ? ORDER BY id', id))
    .map((p) => ({ nombre: op.idioma === 'es' ? (p.es ?? p.en) : p.en, gramos: p.gramos })), op.idioma);
  // Lo cocido ve su crudo y las otras formas de cocinarlo; lo crudo, todas sus formas cocidas.
  const raiz = a.crudo ?? a.id;
  const cocidos = (await base.getAllAsync<{ id: number }>('SELECT id FROM alimentos WHERE crudo = ? ORDER BY id', raiz)).map((x) => x.id).filter((x) => x !== a.id);
  const nombresDe = await nombres(base, [a.id, ...(a.crudo ? [a.crudo] : []), ...cocidos], op);
  const [plato] = a.fuente === 'receta' ? await base.getAllAsync<{ peso_final: number }>('SELECT peso_final FROM recetas WHERE plato = ?', id) : [];
  const ingredientes = plato
    ? await base.getAllAsync<{ ingrediente: number; gramos: number }>('SELECT ingrediente, gramos FROM ingredientes WHERE plato = ? ORDER BY rowid', id)
    : [];
  const nombresDeIngredientes = await nombres(base, ingredientes.map((i) => i.ingrediente), op);
  const por100g: Valores100 = { kcal: a.kcal, proteina: a.proteina, carbohidratos: a.carbohidratos, grasas: a.grasas };
  for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const) if (a[k] !== null) por100g[k] = a[k]!;
  const micros = microsDeFila(a);
  if (micros) por100g.micros = micros;
  const que = op.idioma === 'es' ? a.desecho_es : a.desecho_en;
  return {
    id: a.id,
    nombre: nombresDe.get(a.id)!,
    origen: ORIGENES[a.fuente] ?? 'usda',
    marca: a.marca,
    atribucion: a.atribucion === 'off' ? 'off' : null,
    por100g,
    porciones,
    densidad: a.densidad,
    desecho: a.desecho && que ? { fraccion: a.desecho, que } : null,
    aceite: a.aceite === 'preguntar' || a.aceite === 'incluido' ? a.aceite : null,
    crudo: a.crudo ? { id: a.crudo, nombre: nombresDe.get(a.crudo) ?? '' } : null,
    cocidos: cocidos.map((c) => ({ id: c, nombre: nombresDe.get(c) ?? '' })),
    receta: plato ? { pesoFinal: plato.peso_final, ingredientes: ingredientes.map((i) => ({ nombre: nombresDeIngredientes.get(i.ingrediente) ?? '', gramos: i.gramos })) } : null,
    verificado: a.verificado && a.segunda ? { fecha: a.verificado, con: a.segunda } : null,
  };
}

/** Lo que el plan necesita de un curado: su id, su nombre en la app, los valores y las porciones. */
export type CuradoDelPlan = { id: number; nombre: string; por100g: Valores100; porciones: PorcionDeAlimento[] };

/** Los curados por su nombre en español (el de genericos.txt): los alimentos de las comidas tipo (src/dominio/plan.ts). */
export async function curadosPorNombre(base: BaseDeAlimentos, buscados: readonly string[], op: { idioma: Idioma; region?: string }): Promise<Map<string, CuradoDelPlan>> {
  if (!buscados.length) return new Map();
  const marcas = buscados.map(() => '?').join(',');
  const filas = await base.getAllAsync<FilaAlimento>(`SELECT * FROM alimentos WHERE nombre_es IN (${marcas})`, ...buscados);
  if (!filas.length) return new Map();
  const ids = filas.map((a) => a.id);
  const porciones = await base.getAllAsync<{ alimento: number; es: string | null; en: string; gramos: number }>(
    `SELECT alimento, es, en, gramos FROM porciones WHERE alimento IN (${ids.join(',')}) ORDER BY id`,
  );
  const nombresDe = await nombres(base, ids, op);
  const resultado = new Map<string, CuradoDelPlan>();
  for (const a of filas) {
    if (!a.nombre_es || resultado.has(a.nombre_es)) continue;
    const por100g: Valores100 = { kcal: a.kcal, proteina: a.proteina, carbohidratos: a.carbohidratos, grasas: a.grasas };
    for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const) if (a[k] !== null) por100g[k] = a[k]!;
    const micros = microsDeFila(a);
    if (micros) por100g.micros = micros;
    resultado.set(a.nombre_es, {
      id: a.id, nombre: nombresDe.get(a.id) ?? a.nombre_es, por100g,
      porciones: porciones.filter((p) => p.alimento === a.id).map((p) => ({ nombre: op.idioma === 'es' ? (p.es ?? p.en) : p.en, gramos: p.gramos })),
    });
  }
  return resultado;
}

/**
 * Los códigos a probar: el que llegó, solo con dígitos, y su otra forma. El iPhone entrega el
 * UPC-A como EAN-13 con un 0 adelante.
 */
export function formasDelCodigo(codigo: string): string[] {
  const c = codigo.replace(/\D/g, '');
  if (c.length === 13 && c.startsWith('0')) return [c, c.slice(1)];
  if (c.length === 12) return [c, `0${c}`];
  return c ? [c] : [];
}

/** El alimento de la base con ese código de barras, o null. */
export async function alimentoPorCodigo(base: BaseDeAlimentos, codigo: string): Promise<number | null> {
  const formas = formasDelCodigo(codigo);
  if (!formas.length) return null;
  const [fila] = await base.getAllAsync<{ alimento: number }>(`SELECT alimento FROM codigos WHERE codigo IN (${formas.map(() => '?').join(',')}) LIMIT 1`, ...formas);
  return fila?.alimento ?? null;
}

/**
 * Cuánto rinde lo crudo al cocinarlo: cuántos gramos cocidos dan 100 g crudos. Sale de la proteína
 * de las dos versiones, que no se pierde al cocinar (la grasa sí: con las calorías, una carne grasa
 * parecería no achicarse); sin proteína, de las calorías. 100 g de arroz crudo dan unos 260 g
 * cocido, y las papillas mucho más: la polenta, unas 6 veces, y la sémola con agua, casi 9. Lo frito no tiene rinde:
 * el rebozado y el aceite suman. Sirve de guía, no de cuenta exacta.
 */
export function rindeAlCocinar(crudo: Pick<Valores100, 'kcal' | 'proteina'>, cocido: Pick<Valores100, 'kcal' | 'proteina'>, aceite?: Detalle['aceite']): number | null {
  if (aceite === 'incluido') return null;
  const conProteina = crudo.proteina >= 1 && cocido.proteina >= 1;
  const [a, b] = conProteina ? [crudo.proteina, cocido.proteina] : [crudo.kcal, cocido.kcal];
  if (!(a > 0) || !(b > 0)) return null;
  const rinde = a / b;
  return rinde >= 0.25 && rinde <= 10 ? rinde : null;
}
