// La base de alimentos en la web de prueba: SQLite en la web pide encabezados COOP/COEP y un wasm
// propio, así que acá van los curados en un JSON (public/alimentos.json, lo arma
// herramientas/alimentos-web.mjs al exportar) y la búsqueda corre en la memoria, con el mismo orden
// que en el teléfono (candidatosEnMemoria y mejoresPorAlimento).

import { candidatosEnMemoria, conMayuscula, mejoresPorAlimento, textoEnMemoria, type Opciones, type Resultado, type TextoEnMemoria } from './buscar';
import { formasDelCodigo, type Detalle, type Valores100 } from './detalle';

/** Lo que trae public/alimentos.json, compacto: ver herramientas/alimentos-web.mjs. */
type AlimentoWeb = {
  id: number; f: string; es: string; en: string; v: [number, number, number, number]; s: (number | null)[];
  p: [string | null, string, number][]; t: [string, string, number, string][];
  m: string | null; d: number | null; x: [number, string, string] | null; a: string | null; c: number | null; o: string | null;
};
type DatosWeb = { alimentos: AlimentoWeb[]; recetas: Record<string, [number, [number, number][]]>; codigos: Record<string, number> };

type Cargados = { porId: Map<number, AlimentoWeb>; corpus: TextoEnMemoria[]; recetas: DatosWeb['recetas']; codigos: DatosWeb['codigos'] };

let cargados: Promise<Cargados> | undefined;
function cargar(): Promise<Cargados> {
  cargados ??= fetch('/alimentos.json')
    .then((r) => r.json() as Promise<DatosWeb>)
    .then((d) => ({
      porId: new Map(d.alimentos.map((a) => [a.id, a])),
      corpus: d.alimentos.flatMap((a) => a.t.map(([i, region, principal, texto]) => textoEnMemoria(a.id, i === 'en' ? 'en' : 'es', region || null, principal, texto))),
      recetas: d.recetas,
      codigos: d.codigos,
    }));
  cargados.catch(() => {
    cargados = undefined;
  });
  return cargados;
}

const SECUNDARIOS = ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const;
const valoresDe = (a: AlimentoWeb): Valores100 => {
  const v: Valores100 = { kcal: a.v[0], proteina: a.v[1], carbohidratos: a.v[2], grasas: a.v[3] };
  SECUNDARIOS.forEach((k, i) => {
    if (a.s[i] != null) v[k] = a.s[i]!;
  });
  return v;
};

function nombreDe(a: AlimentoWeb, op: { idioma: 'es' | 'en'; region?: string }): string {
  if (op.idioma === 'en') return a.en || a.es;
  const regional = a.t.find(([i, r, principal]) => i === 'es' && r === op.region && principal);
  return regional ? conMayuscula(regional[3]) : a.es;
}

const ORIGENES: Record<string, Detalle['origen']> = { sr: 'usda', fndds: 'usda', propio: 'propio', receta: 'receta', producto: 'producto' };

export type OpcionesDeIdioma = Pick<Opciones, 'idioma' | 'region'>;

export const baseDeAlimentos = {
  async buscar(texto: string, op: Opciones): Promise<Resultado[]> {
    const { porId, corpus } = await cargar();
    return mejoresPorAlimento(candidatosEnMemoria(corpus, texto, op.idioma), texto, op, () => true)
      .slice(0, op.limite ?? 25)
      .map((c) => {
        const a = porId.get(c.alimento)!;
        const v = valoresDe(a);
        const porcion = a.p[0];
        return {
          id: a.id, nombre: nombreDe(a, op), coincide: c.texto, curado: true, ...v,
          porcion: porcion ? { nombre: op.idioma === 'es' ? (porcion[0] ?? porcion[1]) : porcion[1], gramos: porcion[2] } : null,
        };
      });
  },
  async detalle(id: number, op: OpcionesDeIdioma): Promise<Detalle | null> {
    const { porId, recetas } = await cargar();
    const a = porId.get(id);
    if (!a) return null;
    const raiz = a.c ?? a.id;
    const cocidos = [...porId.values()].filter((x) => x.c === raiz && x.id !== a.id);
    const pariente = (x: AlimentoWeb) => ({ id: x.id, nombre: nombreDe(x, op) });
    const crudo = a.c != null ? porId.get(a.c) : undefined;
    const receta = recetas[String(id)];
    return {
      id: a.id,
      nombre: nombreDe(a, op),
      origen: ORIGENES[a.f] ?? 'usda',
      marca: a.m,
      atribucion: a.o === 'off' ? 'off' : null,
      por100g: valoresDe(a),
      porciones: a.p.map(([es, en, gramos]) => ({ nombre: op.idioma === 'es' ? (es ?? en) : en, gramos })),
      densidad: a.d,
      desecho: a.x ? { fraccion: a.x[0], que: op.idioma === 'es' ? a.x[1] : a.x[2] } : null,
      aceite: a.a === 'preguntar' || a.a === 'incluido' ? a.a : null,
      crudo: crudo ? pariente(crudo) : null,
      cocidos: cocidos.map(pariente),
      receta: receta
        ? { pesoFinal: receta[0], ingredientes: receta[1].map(([ingrediente, gramos]) => ({ nombre: porId.has(ingrediente) ? nombreDe(porId.get(ingrediente)!, op) : '', gramos })) }
        : null,
    };
  },
  async porCodigo(codigo: string): Promise<number | null> {
    const { codigos } = await cargar();
    for (const forma of formasDelCodigo(codigo)) if (codigos[forma] != null) return codigos[forma];
    return null;
  },
  preparar() {
    cargar().catch((error) => console.warn('Moss no pudo cargar los alimentos', error));
  },
};
