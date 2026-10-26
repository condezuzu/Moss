// El buscador de alimentos, sobre la base del teléfono (assets/alimentos.db, la arma
// herramientas/alimentos.mjs). Mientras se escribe:
// - las palabras con prefijos encuentran lo que empieza igual («pech» → pechuga);
// - los trigramas encuentran lo escrito con errores («frutila» → frutillas).
// El orden: primero el idioma de la app; después, qué tan parecido es a lo escrito, lo curado y el
// nombre de la región; al final, bm25. Lo más usado sube con el premio que pasa quien llama, porque
// el historial es de cada usuario y no está en esta base.
// La galería usa este mismo archivo para ordenar (galeria/construir.mjs): no puede importar nada.

/** Lo justo de expo-sqlite (o de cualquier SQLite) que necesita el buscador. */
export interface BaseDeAlimentos {
  getAllAsync<T>(sql: string, ...parametros: (string | number)[]): Promise<T[]>;
}

export type Idioma = 'es' | 'en';

export type Resultado = {
  id: number;
  /** En el idioma de la app y, en español, con el nombre de la región si tiene uno. */
  nombre: string;
  /** El texto que coincidió: un alias, la descripción de USDA… Sirve para mostrar «Aguacate (palta)». */
  coincide: string;
  curado: boolean;
  /** Comparado con una segunda fuente oficial, calculado con ingredientes verificados o con una etiqueta que cierra. */
  verificado?: boolean;
  /** Por 100 g. */
  kcal: number;
  proteina: number;
  carbohidratos: number;
  grasas: number;
  /** Por 100 g, lo que la base tiene (el sodio, en mg). */
  fibra?: number;
  azucares?: number;
  saturadas?: number;
  sodio?: number;
  alcohol?: number;
  /** La porción de siempre; sin porción, se registra en gramos. */
  porcion: { nombre: string; gramos: number } | null;
};

export type Opciones = {
  idioma: Idioma;
  /** El país del usuario (UY, MX, ES…), para los nombres de cada región. */
  region?: string;
  limite?: number;
  /** Lo que suma el uso: más es mejor. Lo calcula quien tiene el historial. */
  premio?: (id: number) => number;
};

/** Un nombre o alias que coincidió con lo escrito, con su rango de bm25 (más negativo, mejor). */
export type Candidato = { alimento: number; idioma: Idioma; region: string | null; principal: number; texto: string; rango: number; aproximado: boolean };

/** Sin tildes, en minúsculas y con un solo espacio: así se compara lo escrito con los nombres. */
export const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

/** Las palabras de lo escrito, cada una como prefijo: «pech poll» → "pech"* "poll"*. */
export function consultaDePalabras(texto: string): string | null {
  const palabras = normalizar(texto).split(' ').filter(Boolean);
  return palabras.length ? palabras.map((p) => `"${p}"*`).join(' ') : null;
}

/** Los trigramas de lo escrito, en OR: cuantos más tenga un nombre, más arriba sale. */
export function consultaDeTrigramas(texto: string): string | null {
  const limpio = normalizar(texto);
  const trigramas = new Set<string>();
  for (const palabra of limpio.split(' ')) for (let i = 0; i + 3 <= palabra.length; i++) trigramas.add(palabra.slice(i, i + 3));
  return trigramas.size ? [...trigramas].map((t) => `"${t}"`).join(' OR ') : null;
}

/** El tramo del nombre que más se parece a lo escrito: cuánto, de 0 a 1, y en qué palabra empieza. */
function tramoMasParecido(escrito: string, nombre: string): { parecido: number; palabra: number } {
  const q = normalizar(escrito);
  const palabras = normalizar(nombre).split(' ');
  let mejor = { parecido: 0, palabra: 0 };
  for (let i = 0; i < palabras.length; i++) {
    // Se compara contra el tramo del nombre que empieza en esta palabra, del largo de lo escrito.
    const tramo = palabras.slice(i).join(' ').slice(0, q.length + 1);
    const p = 1 - distancia(q, tramo) / Math.max(q.length, tramo.length);
    if (p > mejor.parecido) mejor = { parecido: p, palabra: i };
  }
  return mejor;
}

/** Cuánto se parece lo escrito al principio de alguna palabra del nombre, de 0 a 1. */
export function parecido(escrito: string, nombre: string): number {
  return tramoMasParecido(escrito, nombre).parecido;
}

/** Cuántos cambios de una letra hay entre dos textos. Dos letras dadas vuelta («manzaan») cuentan como uno. */
function distancia(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Menos es mejor. Cada parte está pensada para que pese más que la siguiente. */
export function puntaje(c: Candidato, escrito: string, op: Opciones, curado: boolean): number {
  const q = normalizar(escrito);
  const t = normalizar(c.texto);
  let p: number;
  if (t === q) p = 0;
  // «pan» encuentra antes «Pan blanco» (la palabra entera) que «Pancho» (el principio de otra).
  else if (t.startsWith(`${q} `)) p = 5;
  // En inglés el sustantivo va al final: «Grilled chicken breast» es tan «chicken breast» como
  // «Chicken breast with mushroom sauce», y el largo desempata a favor del más simple.
  else if (c.idioma === 'en' && t.endsWith(` ${q}`)) p = 5;
  else if (t.startsWith(q)) p = 10;
  else if (` ${t} `.includes(` ${q} `)) p = 15;
  else if (!c.aproximado) p = 20;
  // Con errores: entre 30 y 50 según el parecido. Como sin errores, una palabra del medio suma 5:
  // «frutila» es antes «Frutillas» que «yogurt de frutilla».
  else {
    const tramo = tramoMasParecido(escrito, c.texto);
    p = 30 + (1 - tramo.parecido) * 40 + (tramo.palabra > 0 ? 5 : 0);
  }
  // Lo que sigue con «con …» es otro plato: «pechuga de pollo» da antes la pechuga que la pechuga
  // con salsa, y «arroz», el arroz antes que el arroz con leche.
  if (p <= 10 && /^,?\s*(con|with|in|en salsa)\b/.test(t.slice(q.length))) p += 6;
  if (c.idioma !== op.idioma) p += 100;
  if (!curado) p += 8;
  // El nombre de la región gana un poco; uno de otra región pierde (plátano es banana en España y otra cosa en Colombia).
  if (c.region) p += c.region !== op.region ? 4 : c.principal ? -2 : 0;
  p -= op.premio?.(c.alimento) ?? 0;
  // bm25 es negativo (más negativo, mejor) y el largo desempata a favor de lo corto.
  return p + c.rango * 0.5 + t.length / 40;
}

/** Con menos que esto de lo que empieza igual, se buscan también los parecidos. */
export const POCOS = 10;
export const PARECIDO_MINIMO = 0.75;
/** Lo corto con un error se parece a demasiado («coke» a «Cooked taro»): hasta 4 letras, solo sin errores. */
const LARGO_PARA_ERRORES = 5;
const parecidoSuficiente = (escrito: string, nombre: string) =>
  normalizar(escrito).length >= LARGO_PARA_ERRORES && parecido(escrito, nombre) >= PARECIDO_MINIMO;

export const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

/** De cada alimento, su mejor coincidencia; y los alimentos, del mejor al peor. */
export function mejoresPorAlimento(candidatos: Candidato[], texto: string, op: Opciones, esCurado: (id: number) => boolean): Candidato[] {
  const mejores = new Map<number, { c: Candidato; puntos: number }>();
  for (const c of candidatos) {
    const puntos = puntaje(c, texto, op, esCurado(c.alimento));
    const antes = mejores.get(c.alimento);
    if (!antes || puntos < antes.puntos) mejores.set(c.alimento, { c, puntos });
  }
  return [...mejores.values()].sort((a, b) => a.puntos - b.puntos).map(({ c }) => c);
}

/** Un texto de búsqueda en la memoria, con sus palabras y trigramas ya armados: hace las veces de los dos índices. */
export type TextoEnMemoria = Omit<Candidato, 'rango' | 'aproximado'> & { palabras: string[]; trigramas: Set<string> };

export function textoEnMemoria(alimento: number, idioma: Idioma, region: string | null, principal: number, texto: string): TextoEnMemoria {
  const normal = normalizar(texto);
  const trigramas = new Set<string>();
  for (const p of normal.split(' ')) for (let k = 0; k + 3 <= p.length; k++) trigramas.add(p.slice(k, k + 3));
  return { alimento, idioma, region, principal, texto, palabras: normal.split(' '), trigramas };
}

/**
 * Los candidatos de buscarAlimentos, sin SQLite: para la web de prueba y la galería, que tienen los
 * alimentos en la memoria. Lo mismo que los dos índices, menos bm25, que acá vale lo mismo para todos.
 */
export function candidatosEnMemoria(corpus: TextoEnMemoria[], texto: string, idioma: Idioma): Candidato[] {
  const normal = normalizar(texto);
  const palabras = normal.split(' ').filter(Boolean);
  if (!palabras.length) return [];
  const comoCandidato = (t: TextoEnMemoria, aproximado: boolean): Candidato => ({
    alimento: t.alimento, idioma: t.idioma, region: t.region, principal: t.principal, texto: t.texto, rango: 0, aproximado,
  });
  const candidatos = corpus.filter((t) => palabras.every((p) => t.palabras.some((w) => w.startsWith(p)))).map((t) => comoCandidato(t, false));
  if (normal.length >= 3 && new Set(candidatos.map((c) => c.alimento)).size < POCOS) {
    const buscados = new Set<string>();
    for (const p of palabras) for (let k = 0; k + 3 <= p.length; k++) buscados.add(p.slice(k, k + 3));
    for (const t of corpus) {
      if (t.idioma !== idioma || ![...buscados].some((g) => t.trigramas.has(g))) continue;
      if (parecidoSuficiente(texto, t.texto)) candidatos.push(comoCandidato(t, true));
    }
  }
  return candidatos;
}

export async function buscarAlimentos(base: BaseDeAlimentos, texto: string, op: Opciones): Promise<Resultado[]> {
  const limite = op.limite ?? 25;
  const palabras = consultaDePalabras(texto);
  if (!palabras) return [];
  const candidatos: Candidato[] = [];
  const porPalabras = await base.getAllAsync<Omit<Candidato, 'aproximado'>>(
    `SELECT t.alimento, t.idioma, t.region, t.principal, t.texto, bm25(palabras) AS rango
     FROM palabras JOIN textos t ON t.id = palabras.rowid WHERE palabras MATCH ? ORDER BY rango LIMIT 300`,
    palabras,
  );
  candidatos.push(...porPalabras.map((c) => ({ ...c, aproximado: false })));
  // Los parecidos (errores de tipeo) solo hacen falta si lo que empieza igual es poco, y solo en el idioma de la app.
  const trigramas = normalizar(texto).length >= 3 ? consultaDeTrigramas(texto) : null;
  if (trigramas && new Set(porPalabras.map((c) => c.alimento)).size < POCOS) {
    const porTrigramas = await base.getAllAsync<Omit<Candidato, 'aproximado'>>(
      `SELECT t.alimento, t.idioma, t.region, t.principal, t.texto, bm25(trigramas) AS rango
       FROM trigramas JOIN textos t ON t.id = trigramas.rowid WHERE trigramas MATCH ? AND t.idioma = ? ORDER BY rango LIMIT 150`,
      trigramas,
      op.idioma,
    );
    for (const c of porTrigramas) if (parecidoSuficiente(texto, c.texto)) candidatos.push({ ...c, aproximado: true });
  }
  if (!candidatos.length) return [];

  const ids = [...new Set(candidatos.map((c) => c.alimento))];
  const lista = ids.join(',');
  type Secundario = 'fibra' | 'azucares' | 'saturadas' | 'sodio' | 'alcohol';
  type Fila = { id: number; descripcion: string; nombre_es: string | null; nombre_en: string | null; kcal: number; proteina: number; carbohidratos: number; grasas: number; p_es: string | null; p_en: string | null; gramos: number | null; verificado: string | null }
    & Record<Secundario, number | null>;
  const filas = await base.getAllAsync<Fila>(
    `SELECT a.id, a.descripcion, a.nombre_es, a.nombre_en, a.kcal, a.proteina, a.carbohidratos, a.grasas, a.fibra, a.azucares, a.saturadas, a.sodio, a.alcohol,
       a.verificado, p.es AS p_es, p.en AS p_en, p.gramos
     FROM alimentos a LEFT JOIN porciones p ON p.id = a.porcion WHERE a.id IN (${lista})`,
  );
  const secundarios = (f: Fila) => {
    const s: Partial<Record<Secundario, number>> = {};
    for (const k of ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'] as const) if (f[k] !== null) s[k] = f[k]!;
    return s;
  };
  const datos = new Map(filas.map((f) => [f.id, f]));
  const principales = op.idioma === 'es' && op.region
    ? new Map((await base.getAllAsync<{ alimento: number; texto: string }>(`SELECT alimento, texto FROM alias WHERE principal = 1 AND region = ? AND alimento IN (${lista})`, op.region)).map((a) => [a.alimento, a.texto]))
    : new Map<number, string>();

  return mejoresPorAlimento(candidatos, texto, op, (id) => datos.get(id)?.nombre_es != null)
    .slice(0, limite)
    .map((c) => {
      const f = datos.get(c.alimento)!;
      const regional = principales.get(f.id);
      const nombre = op.idioma === 'es' ? (regional ? conMayuscula(regional) : (f.nombre_es ?? f.descripcion)) : (f.nombre_en ?? f.descripcion);
      const nombrePorcion = op.idioma === 'es' ? (f.p_es ?? f.p_en) : f.p_en;
      return {
        id: f.id, nombre, coincide: c.texto, curado: f.nombre_es != null, verificado: f.verificado != null,
        kcal: f.kcal, proteina: f.proteina, carbohidratos: f.carbohidratos, grasas: f.grasas, ...secundarios(f),
        porcion: nombrePorcion && f.gramos ? { nombre: nombrePorcion, gramos: f.gramos } : null,
      };
    });
}
