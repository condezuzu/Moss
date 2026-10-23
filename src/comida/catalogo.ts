// El catálogo del servidor (spec/decisiones.md, D11; supabase/moss/0004_medir.sql): corrige y suma
// alimentos de la base de la app sin sacar una versión nueva. Una fila con el id de un alimento de
// la base lo reemplaza, una con un id nuevo lo agrega y `retirado` lo saca. El teléfono baja lo que
// cambió y lo mezcla al buscar, en el detalle y con el código de barras. Lo de acá es puro: no
// sabe de dónde vienen las filas.

import { microsValidos, type Micros } from '@/dominio/micronutrientes';

import { candidatosEnMemoria, conMayuscula, mejoresPorAlimento, textoEnMemoria, type Opciones, type Resultado } from './buscar';
import { formasDelCodigo, type Detalle, type Valores100 } from './detalle';

/** Una fila de moss.catalogo, como llega de Supabase. */
export type FilaDelCatalogo = {
  id: number;
  nombre_es: string;
  nombre_en: string;
  alias: string[];
  categoria: string | null;
  marca: string | null;
  codigos: string[];
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  fibra: number | null;
  azucares: number | null;
  saturadas: number | null;
  sodio: number | null;
  alcohol: number | null;
  /** Desde 0006: los micronutrientes y lo verificado, como en la base de la app. */
  micros?: Micros | null;
  verificado?: string | null;
  segunda?: string | null;
  porciones: { es: string; en: string; gramos: number }[];
  densidad: number | null;
  desecho: number | null;
  que_desecho: string | null;
  aceite: 'preguntar' | 'incluido' | null;
  crudo: number | null;
  retirado: boolean;
  actualizado: string;
};

/** Lo que se tiene del catálogo: las filas y hasta qué hora del servidor se bajó. */
export type CatalogoLocal = { hasta: string | null; filas: FilaDelCatalogo[] };

/** Las filas nuevas encima de las que había: de cada id, la más nueva. */
export function mezclarCatalogo(antes: FilaDelCatalogo[], llegadas: FilaDelCatalogo[]): FilaDelCatalogo[] {
  const porId = new Map(antes.map((f) => [f.id, f]));
  for (const f of llegadas) {
    const vieja = porId.get(f.id);
    if (!vieja || vieja.actualizado <= f.actualizado) porId.set(f.id, f);
  }
  return [...porId.values()];
}

const valoresDe = (f: FilaDelCatalogo): Valores100 => {
  const v: Valores100 = { kcal: f.kcal, proteina: f.proteina, carbohidratos: f.carbohidratos, grasas: f.grasas };
  for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const) if (f[k] !== null) v[k] = f[k]!;
  const micros = microsValidos(f.micros);
  if (micros) v.micros = micros;
  return v;
};

const nombreDe = (f: FilaDelCatalogo, idioma: 'es' | 'en') => (idioma === 'es' ? f.nombre_es : f.nombre_en);

/**
 * Los resultados de la base con el catálogo encima: lo retirado se va, lo corregido toma los
 * valores nuevos y lo que se agregó y coincide con lo escrito va primero.
 */
export function conElCatalogo(resultados: Resultado[], filas: FilaDelCatalogo[], texto: string, op: Opciones): Resultado[] {
  if (!filas.length) return resultados;
  const porId = new Map(filas.map((f) => [f.id, f]));
  const comoResultado = (f: FilaDelCatalogo, coincide: string): Resultado => {
    const porcion = f.porciones[0];
    return {
      id: f.id, nombre: conMayuscula(nombreDe(f, op.idioma)), coincide, curado: true, verificado: !!f.verificado, ...valoresDe(f),
      porcion: porcion ? { nombre: op.idioma === 'es' ? porcion.es : porcion.en, gramos: porcion.gramos } : null,
    };
  };
  const corregidos = resultados.flatMap((r) => {
    const f = porId.get(r.id);
    if (!f) return [r];
    return f.retirado ? [] : [comoResultado(f, r.coincide)];
  });
  const yaEstan = new Set(resultados.map((r) => r.id));
  const corpus = filas.filter((f) => !f.retirado && !yaEstan.has(f.id)).flatMap((f) => [
    textoEnMemoria(f.id, 'es', null, 0, f.nombre_es),
    textoEnMemoria(f.id, 'en', null, 0, f.nombre_en),
    ...(f.marca ? [textoEnMemoria(f.id, 'es', null, 0, `${f.nombre_es} ${f.marca}`), textoEnMemoria(f.id, 'en', null, 0, `${f.nombre_en} ${f.marca}`)] : []),
    ...f.alias.map((a) => textoEnMemoria(f.id, 'es', null, 0, a)),
  ]);
  const nuevos = mejoresPorAlimento(candidatosEnMemoria(corpus, texto, op.idioma), texto, op, () => true).map((c) => comoResultado(porId.get(c.alimento)!, c.texto));
  return [...nuevos, ...corregidos].slice(0, op.limite ?? 25);
}

/** El detalle de un alimento del catálogo, o null si no está (o se retiró: entonces no se muestra). */
export function detalleDelCatalogo(filas: FilaDelCatalogo[], id: number, op: { idioma: 'es' | 'en' }): Detalle | null | undefined {
  const f = filas.find((x) => x.id === id);
  if (!f) return undefined;
  if (f.retirado) return null;
  const crudo = f.crudo !== null ? filas.find((x) => x.id === f.crudo) : undefined;
  return {
    id: f.id, nombre: conMayuscula(nombreDe(f, op.idioma)), origen: f.marca ? 'producto' : 'propio', marca: f.marca, atribucion: null,
    por100g: valoresDe(f),
    porciones: f.porciones.map((p) => ({ nombre: op.idioma === 'es' ? p.es : p.en, gramos: p.gramos })),
    densidad: f.densidad,
    desecho: f.desecho && f.que_desecho ? { fraccion: f.desecho, que: f.que_desecho } : null,
    aceite: f.aceite,
    crudo: crudo ? { id: crudo.id, nombre: nombreDe(crudo, op.idioma) } : null,
    cocidos: filas.filter((x) => x.crudo === f.id && !x.retirado).map((x) => ({ id: x.id, nombre: nombreDe(x, op.idioma) })),
    receta: null,
    verificado: f.verificado && f.segunda ? { fecha: f.verificado, con: f.segunda } : null,
  };
}

/** El alimento del catálogo con ese código, o null. */
export function codigoDelCatalogo(filas: FilaDelCatalogo[], codigo: string): number | null {
  const formas = formasDelCodigo(codigo);
  return filas.find((f) => !f.retirado && f.codigos.some((c) => formas.includes(c)))?.id ?? null;
}
