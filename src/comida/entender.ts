// Lo dicho, en alimentos de la base (lo pediste el 26/10): cada pedazo de la frase (frase.ts) pasa
// por el buscador de siempre, y lo que la persona ya eligió o ya comió decide. Se pregunta solo si
// cambia el número (40 kcal, o un 15 % si son al menos 15 kcal), con una respuesta ya marcada, una
// vez por alimento y tres por comida, y cada respuesta se recuerda. Ningún número sale de un
// modelo: todo es de la base, o de lo que la persona guardó y dice por su nombre (27/11/2026).

import type { AlimentoPropio, Cantidad, Fuente, Item, Receta, Valores } from '@/dominio/registros';
import { escalar, gramosDe, valoresDeCantidad, valoresDeReceta } from '@/dominio/registros';
import { normalizar, type Resultado } from './buscar';
import type { Detalle } from './detalle';
import { FAMILIAS_DE_BEBIDA, TAMANO_DE_LA_RECETA, type Dicho } from './frase';
import { gramosDeLaEntera, porcionesAlDecirPlato, porcionesDePlato, porcionesDesde, TAMANOS as TAMANOS_DE_PLATO, type PorcionesDePlato, type Tamano as TamanoDePlato } from './platos';
import { gramosDeLinea, METRICAS as DE_VOLUMEN, ML_POR } from './recetaDeTexto';

/**
 * `fuente`: de dónde es, si no es de la base (lo que la persona guardó). `estimado`: ya estaba anotado a ojo. `rinde`:
 * de una receta, cuántas porciones da («media tarta» es la mitad de todas).
 */
export type AlimentoDicho = { ref: string; nombre: string; por100g: Valores; porciones: { nombre: string; gramos: number }[]; fuente?: Fuente; estimado?: true; rinde?: number };
export type Opcion = { alimento: AlimentoDicho; cantidad: Exclude<Cantidad, null>; valores: Valores };
/**
 * Cuál de varios parecidos («¿qué leche?»), crudo o cocido (se dijeron gramos), cuánto (no se dijo), o
 * el tamaño de un plato dicho sin cantidad (D36: chico, mediano o grande, en ese orden).
 */
export type TipoDePregunta = 'cual' | 'crudo' | 'cuanto' | 'tamano';

export type Entendido = {
  dicho: Dicho;
  /** Las opciones, con la elegida marcada; sin ninguna, no se encontró. */
  opciones: Opcion[];
  elegida: number;
  /** Sin pregunta, las opciones son solo la elegida. */
  pregunta: TipoDePregunta | null;
  /** La cantidad no se dijo ni había una anterior: se supuso. */
  supuesto: boolean;
};

export type ParaEntender = {
  buscar: (texto: string) => Promise<Resultado[]>;
  detalle: (id: number) => Promise<Detalle | null>;
  /** La última cantidad con que se anotó ese alimento. */
  ultimaCantidad: (ref: string) => Cantidad | undefined;
  /** Lo que se eligió antes para esas palabras: «leche» es la descremada. */
  alias: (buscado: string) => number | undefined;
  /** Si ese alimento ya se comió: entonces no se pregunta cuál. */
  conocido: (id: number) => boolean;
  /** Lo que se contestó antes, crudo o cocido, para esas palabras con una cantidad medida (claveMedida). */
  medido?: (buscado: string) => number | undefined;
  /** Lo que la persona guardó, por su lugar en los nombres que recibió leerFrase (`Dicho.tuyo`): sus filas (loTuyo). */
  tuyo?: (cual: number) => readonly Opcion[] | undefined;
};

/** Dónde se recuerda crudo o cocido: aparte de «cuál», así «un plato de arroz» no queda crudo por «200 g de arroz». */
export const claveMedida = (buscado: string) => `medido:${normalizar(buscado)}`;

export const DIFERENCIA_KCAL = 40;
export const DIFERENCIA_PARTE = 0.15;
const DIFERENCIA_MINIMA = 15;
export const PREGUNTAS_POR_COMIDA = 3;
/** Cuántos parecidos se ofrecen en «¿cuál?». */
const PARECIDOS = 3;

/** Si dos opciones cambian el número lo suficiente para preguntar. */
export function cambiaElNumero(a: number, b: number): boolean {
  const diferencia = Math.abs(a - b);
  return diferencia >= DIFERENCIA_KCAL || (diferencia >= DIFERENCIA_MINIMA && diferencia >= DIFERENCIA_PARTE * Math.max(a, b));
}

/** Sin tildes, sin plural y en minúsculas: «Papas fritas» y «papa frita» son lo mismo. */
const llano = (texto: string) => normalizar(texto).split(' ').map((p) => (p.length > 3 ? p.replace(/(?:es|s)$/, '') : p)).join(' ');
const TAMANOS = 'mediana?o?|grande|chica?o?|peque[nñ][ao]|medium|large|small';
/** El nombre de la cosa y su tamaño: «1 fresa mediana», «1 milanesa grande»; no una medida («1 taza grande»). */
const COSA_Y_TAMANO = String.raw`(?!(?:taza|cup|vaso|glass|cuchar|tbsp|tsp|tablespoon|teaspoon|lata|can|botella|bottle|paquete|package|sobre|packet|porci|serving|onza|oz|fl|copa|envase|bolsa|bag|frasco|jar|bol|bowl|plato|plate|container|extra|cabeza|head|tallo|stalk)\p{L}*\s)\p{L}+\s+(?:${TAMANOS})`;
/** Una cosa entera: «1 unidad», «1 mediana», «1 fresa mediana». */
const UNA_ENTERA = new RegExp(String.raw`^1\s+(?:unidad|${TAMANOS}|${COSA_Y_TAMANO})(?![\p{L}])`, 'iu');
/** Lo que se cuenta como una cosa: una entera, «1 rebanada», «1 feta». */
const DE_A_UNA = new RegExp(String.raw`^1\s+(?:unidad|pieza|rebanada|feta|porci[oó]n t[ií]pica|piece|slice|${TAMANOS}|${COSA_Y_TAMANO})(?![\p{L}])`, 'iu');
/** Lo que se toma, de a uno: «un café» es una taza, «una coca», una lata. */
const RECIPIENTE = /^1\s+(?:taza|cup|vaso|glass|pocillo|lata|can|botella|bottle|copa|tazón)(?![\p{L}])/iu;
/** Una porción en gramos u onzas («100 g»): no es una cosa que se cuente. */
const METRICA = /^\d+(?:[.,]\d+)?\s*(?:g|gr|gramos?|kg|ml|oz|onzas?|ounces?|lb)(?![\p{L}])/iu;
/** Lo que acompaña de a poco: se unta, se pone en fetas o se echa. Lo demás («papas fritas») va en su porción de siempre. */
const DE_A_POCO = /^(?:1\s+)?(?:cucharad|cdta|cda|tablespoon|teaspoon|tbsp|tsp|pat|porci[oó]n individual|individual|sobre|packet|feta|slice|rebanada|pizca|dash|chorr|splash)/iu;
/** Hasta cuántos se cuentan sin una porción con su nombre («20 frutillas»); más, son gramos. */
const CONTABLES = 60;
/** Un pocillo de café: unos 80 ml (recetaDeTexto no le da volumen, para que la receta lo pregunte). */
const ML_DEL_POCILLO = 80;
/** Cómo se cocinó, dicho: entonces no se pregunta crudo o cocido. */
const COMO_SE_COCINA = /(?:plancha|horno|hervid|frit|asad|cocid|crud|revuelt|guisad|saltead|grill|baked|boiled|fried|roast|cooked|raw|scrambled)/;
/** «Una banana congelada», «a frozen banana»: si la base no lo tiene congelado, es lo mismo (27/11/2026). */
const CONGELADO = /(?<![\p{L}])(?:congelad[oa]s?|frozen)(?![\p{L}])/gu;

type Porcion = Detalle['porciones'][number];

/** La porción de siempre: la primera de la base, no la de una unidad que se sumó para contar. */
const deSiempre = (d: Pick<Detalle, 'porciones'>) => d.porciones.find((p) => !p.deUna) ?? d.porciones[0];
/** Una medida de la casa: «1 taza» de «2 tazas» no es una unidad de lo que se cuenta. */
const MEDIDA = /^1\s+(?:cuchar|taza|cup|tbsp|tsp|tablespoon|teaspoon|vaso|glass|pocillo)/iu;
/** La de una unidad: la que sumó conUnaUnidad («1 galleta» de «15 galletas») o la que ya lo dice. */
const deUnaUnidad = (d: Pick<Detalle, 'porciones'>) =>
  d.porciones.find((p) => (p.deUna && !METRICA.test(p.nombre) && !MEDIDA.test(p.nombre)) || DE_A_UNA.test(p.nombre));

/** La porción que se llama como lo dicho: «1 huevo» para «2 huevos», «1 uva» para «20 uvas». */
function porcionNombrada(dicho: Dicho, d: Pick<Detalle, 'porciones'>): Porcion | undefined {
  const palabra = llano(dicho.buscado).split(' ')[0];
  return d.porciones.find((p) => /^1\s/.test(p.nombre) && llano(p.nombre).split(' ')[1] === palabra);
}

/**
 * La porción para contar lo dicho («2 huevos»): la que se llama como lo dicho («1 huevo»), la de una
 * unidad, en lo que se toma la taza o el vaso, o la de siempre. Nunca «2 tazas» de huevos.
 */
function porcionParaContar(dicho: Dicho, d: Pick<Detalle, 'porciones' | 'densidad'>): Porcion | undefined {
  const recipiente = d.densidad ? d.porciones.find((p) => RECIPIENTE.test(p.nombre)) : undefined;
  return porcionNombrada(dicho, d) ?? deUnaUnidad(d) ?? recipiente ?? deSiempre(d);
}

/**
 * La cantidad de lo dicho para un alimento: lo dicho (gramos, una medida de cocina o cuántos), la
 * última vez o, si no, la porción de siempre; el acompañante que se unta, la más chica (la cucharadita de manteca).
 */
export function cantidadPara(dicho: Dicho, d: Pick<Detalle, 'porciones' | 'densidad'>, ultima: Cantidad | undefined): { cantidad: Exclude<Cantidad, null>; supuesto: boolean } {
  const { cantidad, unidad } = dicho;
  if (cantidad !== null && (unidad || dicho.tamano)) {
    const gramos = gramosDeLinea(dicho, { porciones: d.porciones, densidad: d.densidad });
    // Una medida de la casa queda como se dijo («1 vaso», no «206 g»): con la porción de ese nombre, si el alimento la tiene.
    if (gramos && dicho.medida) {
      const medida = normalizar(`1 ${dicho.medida}`);
      const propia = d.porciones.find((x) => { const n = normalizar(x.nombre); return n === medida || n.startsWith(`${medida} `); });
      const porcion = propia ? { porcion: propia.nombre, gramosPorcion: propia.gramos } : { porcion: `1 ${dicho.medida}`, gramosPorcion: Math.round(gramos / cantidad) };
      return { cantidad: { ...porcion, veces: cantidad }, supuesto: false };
    }
    // Lo dicho en ml («200 ml de leche») guarda también los ml: se ve como se dijo, no «206 g».
    if (gramos && unidad && DE_VOLUMEN.has(unidad)) return { cantidad: { gramos, ml: Math.round(cantidad * ML_POR[unidad]!) }, supuesto: false };
    if (gramos) return { cantidad: { gramos }, supuesto: false };
    if (unidad === 'pocillo') return { cantidad: { porcion: '1 pocillo', gramosPorcion: Math.round(ML_DEL_POCILLO * (d.densidad ?? 1)), veces: cantidad }, supuesto: false };
  }
  if (cantidad !== null) {
    const nombrada = porcionNombrada(dicho, d);
    // Mucho y sin unidad («150 de pollo», «200 arroz»): son gramos, salvo que se cuente: «20 uvas» (hay
    // «1 uva») o «20 frutillas», en plural y con una porción de una unidad.
    const dijo = normalizar(dicho.texto);
    const enPlural = !/^\S+\s+(?:de|of)\s/.test(dijo) && /^\S+\s+\p{L}+s(?![\p{L}])/u.test(dijo);
    if (cantidad >= 20 && !nombrada && !(enPlural && cantidad <= CONTABLES && deUnaUnidad(d))) return { cantidad: { gramos: cantidad }, supuesto: false };
    const una = porcionParaContar(dicho, d);
    if (!una) return { cantidad: { gramos: 100 * cantidad }, supuesto: true };
    // «Medio pollo» con «100 g» o «media pizza» con «1 porción»: no es la mitad de una cosa entera, se supone.
    const entera = una === nombrada || UNA_ENTERA.test(una.nombre) || RECIPIENTE.test(una.nombre) || (!!una.deUna && !MEDIDA.test(una.nombre));
    const supuesto = METRICA.test(una.nombre) || (!Number.isInteger(cantidad) && !entera);
    return { cantidad: { porcion: una.nombre, gramosPorcion: una.gramos, veces: cantidad }, supuesto };
  }
  if (ultima) return { cantidad: ultima, supuesto: false };
  const chica = [...d.porciones].sort((a, b) => a.gramos - b.gramos)[0];
  const p = dicho.acompanante && chica && DE_A_POCO.test(chica.nombre) ? chica : deSiempre(d);
  return { cantidad: p ? { porcion: p.nombre, gramosPorcion: p.gramos, veces: 1 } : { gramos: 100 }, supuesto: true };
}

/** El «1 plato» (o el bol) de la base, para un plato que no está en la tabla de platos.ts. */
const PLATO_DE_LA_BASE = /^1\s+(?:plato|bowl|bol|plate)(?![\p{L}])/iu;
const platoDeLaBase = (d: Pick<Detalle, 'porciones'>) => {
  const p = d.porciones.find((x) => PLATO_DE_LA_BASE.test(x.nombre));
  return p ? porcionesDesde(p.gramos) : null;
};
/** La porción de siempre, chica, mediana o grande: «una porción de queso» es la de siempre del queso. */
const platoDeSiempre = (d: Pick<Detalle, 'porciones'>) => {
  const p = deSiempre(d);
  return p ? porcionesDesde(p.gramos) : null;
};

type Plato = { servido: Detalle; porciones: PorcionesDePlato };

/**
 * Lo que se sirve de un alimento dicho como plato y sus gramos chico, mediano y grande, o null si no es
 * un plato. Lo de marca va con su porción (la etiqueta o la cadena: los fideos del paquete se pesan
 * secos); lo demás, con la tabla de platos.ts, y lo crudo o seco, con su versión cocida, porque esos
 * gramos son de comida servida: «polenta» no son 300 g de harina de maíz.
 */
async function platoDe(dicho: Dicho, d: Detalle, p: ParaEntender): Promise<Plato | null> {
  if (d.marca) {
    const suya = dicho.vago ? platoDeLaBase(d) ?? platoDeSiempre(d) : null;
    return suya ? { servido: d, porciones: suya } : null;
  }
  if (!dicho.vago && !porcionesDePlato(d.nombre)) return null;
  const crudo = !d.crudo && d.cocidos.length > 0 && !COMO_SE_COCINA.test(llano(dicho.buscado));
  const servido = (crudo && (await p.detalle(d.cocidos[0].id))) || d;
  if (!dicho.vago) return { servido, porciones: porcionesDePlato(servido.nombre, d.nombre)! };
  // «Una porción», «un bol»: sin fila en la tabla, la porción de siempre, no un plato de cualquier cosa.
  const deLaBase = platoDeLaBase(servido) ?? (dicho.recipiente === 'otro' ? platoDeSiempre(servido) : null);
  return { servido, porciones: porcionesAlDecirPlato(deLaBase, servido.nombre, dicho.buscado) };
}

/** Los parecidos para «¿cuál?»: «leche entera» y «leche descremada»; no «banana split» ni nada «con». */
function esParecido(r: Resultado, cabeza: string): boolean {
  const palabras = llano(r.nombre).split(' ');
  return palabras[0] === cabeza && palabras.length <= 3 && !palabras.includes('con');
}

/**
 * Un plato sin cuánto (D36): «un plato de fideos», «medio plato de arroz», «un poco de puré», o «guiso»
 * sin cantidad y sin una vez anterior. La porción mediana, chica o grande con una sola pregunta, y
 * aproximado; si se nombró el plato, cuenta aunque ya se haya comido: la vez anterior solo marca el
 * tamaño más cercano. La pregunta es cuál, en vez del tamaño, si no se sabe qué es (no se eligió ni se
 * comió y nada se llama así) y elegir otro mueve el número más que un tamaño: «ensalada» puede ser la
 * rusa o la mixta, y los guisos se parecen.
 */
async function comoPlato(dicho: Dicho, primero: Detalle, resultados: readonly Resultado[], sabido: boolean, ultima: Cantidad | undefined, p: ParaEntender): Promise<Entendido | null> {
  const buscado = llano(dicho.buscado);
  const cabeza = buscado.split(' ')[0];
  // «Un plato de pasta» y lo primero es la pasta de maní, o «spaghetti» y la salsa: va lo primero que es
  // ese plato y se dijo así. Lo que lo nombra después de la primera palabra sí es el plato («meat pizza»).
  const delDicho = sabido ? null : porcionesDePlato(dicho.buscado);
  const ese = delDicho && porcionesDePlato(primero.nombre) !== delDicho && !llano(primero.nombre).split(' ').slice(1).includes(cabeza)
    ? resultados.find((r) => !r.marca && porcionesDePlato(r.nombre) === delDicho && llano(r.coincide).startsWith(buscado))
    : undefined;
  const base = (ese && (await p.detalle(ese.id))) || primero;
  const plato = await platoDe(dicho, base, p);
  if (!plato) return null;
  const veces = dicho.vago ? (dicho.cantidad ?? 1) : 1;
  const de = (x: Plato, t: TamanoDePlato) => opcion(x.servido, { gramos: Math.round(x.porciones[t] * veces) });
  const dijo = tamanoDicho(dicho);
  if (!sabido && !p.conocido(base.id) && !p.conocido(plato.servido.id)) {
    const parecidos = resultados.filter((r) => r.id !== primero.id && r.id !== base.id && esParecido(r, cabeza)).slice(0, PARECIDOS - 1);
    const otros = await Promise.all(parecidos.map(async (r) => { const d = await p.detalle(r.id); return d && platoDe(dicho, d, p); }));
    const platos = [plato, ...otros.filter((x): x is Plato => !!x)].filter((x, k, todos) => todos.findIndex((y) => y.servido.id === x.servido.id) === k);
    const opciones = platos.map((x) => de(x, dijo ?? 'mediano'));
    const kcal = opciones.map((o) => o.valores.kcal);
    const unTamano = de(plato, 'mediano').valores.kcal - de(plato, 'chico').valores.kcal;
    if (opciones.length > 1 && Math.max(...kcal) - Math.min(...kcal) > unTamano && kcal.some((k) => cambiaElNumero(k, kcal[0]))) {
      return { dicho, opciones, elegida: 0, pregunta: 'cual', supuesto: true };
    }
  }
  const antes = gramosDe((plato.servido.id === primero.id ? ultima : p.ultimaCantidad(String(plato.servido.id))) ?? null);
  return enTamanos(dicho, plato.porciones, (gramos) => opcion(plato.servido, { gramos }), antes);
}

/** El tamaño dicho, con «plato» o sin él («milanesa grande»), o «un poco» y «mucho». */
const tamanoDicho = (dicho: Dicho): TamanoDePlato | undefined =>
  dicho.plato ?? (dicho.tamano && TAMANO_DE_LA_RECETA[dicho.tamano]) ?? (dicho.cuanto === 'poco' ? 'chico' : dicho.cuanto === 'mucho' ? 'grande' : undefined);

/** Un plato en chico, mediano y grande: el tamaño dicho, sin preguntar; si no, el mediano (o el más cercano a los gramos de `antes`), con la pregunta. */
function enTamanos(dicho: Dicho, porciones: PorcionesDePlato, conGramos: (gramos: number) => Opcion, antes: number | null): Entendido {
  const veces = dicho.vago ? (dicho.cantidad ?? 1) : 1;
  const opciones = TAMANOS_DE_PLATO.map((t) => conGramos(Math.round(porciones[t] * veces)));
  const dijo = tamanoDicho(dicho);
  if (dijo) return { dicho, opciones: [opciones[TAMANOS_DE_PLATO.indexOf(dijo)]], elegida: 0, pregunta: null, supuesto: true };
  const marcada = antes === null
    ? TAMANOS_DE_PLATO.indexOf('mediano')
    : TAMANOS_DE_PLATO.reduce((m, t, k) => (Math.abs(porciones[t] * veces - antes) < Math.abs(porciones[TAMANOS_DE_PLATO[m]] * veces - antes) ? k : m), 0);
  return { dicho, opciones, elegida: marcada, pregunta: 'tamano', supuesto: true };
}

/**
 * Cuánto: no se dijo, no hay una vez anterior y cambia mucho. El acompañante, sus porciones chicas (la cucharadita
 * o la cucharada de manteca, nunca una taza); lo demás, media, una o una y media.
 */
function conPreguntaDeCuanto(sola: Entendido, porciones: readonly Porcion[], conCantidad: (c: Exclude<Cantidad, null>) => Opcion): Entendido {
  const { dicho } = sola;
  const [elegida] = sola.opciones;
  const cantidad = elegida.cantidad;
  if (!sola.supuesto || dicho.cantidad !== null || dicho.cuanto || !('porcion' in cantidad)) return sola;
  const chicas = [...porciones].sort((a, b) => a.gramos - b.gramos).filter((x) => x.gramos <= 3.5 * cantidad.gramosPorcion).slice(0, 3);
  const cantidades = dicho.acompanante
    ? chicas.map((x) => ({ porcion: x.nombre, gramosPorcion: x.gramos, veces: 1 }))
    : [0.5, 1, 1.5].map((veces) => ({ ...cantidad, veces }));
  const opciones = cantidades.map(conCantidad);
  const marcada = opciones.findIndex((o) => 'porcion' in o.cantidad && o.cantidad.porcion === cantidad.porcion && o.cantidad.veces === cantidad.veces);
  if (opciones.length >= 2 && opciones.some((o) => cambiaElNumero(o.valores.kcal, elegida.valores.kcal))) return { ...sola, opciones, elegida: Math.max(0, marcada), pregunta: 'cuanto' };
  return sola;
}

/** «Un poco» y «mucho» de lo que no es un plato: media porción de lo de siempre y una y media. */
const POR_CUANTO = { poco: 0.5, mucho: 1.5 } as const;
function conCuanto(dicho: Dicho, c: Exclude<Cantidad, null>): Exclude<Cantidad, null> {
  if (!dicho.cuanto) return c;
  const f = POR_CUANTO[dicho.cuanto];
  return 'gramos' in c ? { ...c, gramos: Math.round(c.gramos * f), ...(c.ml !== undefined ? { ml: Math.round(c.ml * f) } : {}) } : { ...c, veces: c.veces * f };
}

const alimentoDe = (d: Detalle): AlimentoDicho => ({ ref: String(d.id), nombre: d.nombre, por100g: d.por100g as Valores, porciones: d.porciones });
const opcion = (d: Detalle, cantidad: Exclude<Cantidad, null>): Opcion => ({ alimento: alimentoDe(d), cantidad, valores: valoresDeCantidad(d.por100g as Valores, cantidad) });

async function entenderUno(dicho: Dicho, p: ParaEntender): Promise<Entendido> {
  const nada: Entendido = { dicho, opciones: [], elegida: 0, pregunta: null, supuesto: false };
  const deAntes = p.alias(dicho.buscado);
  const sinCongelar = dicho.buscado.replace(CONGELADO, ' ').replace(/\s+/g, ' ').trim();
  if (sinCongelar && sinCongelar !== dicho.buscado && deAntes === undefined && !(await loTiene(dicho, p))) {
    return { ...(await entenderUno({ ...dicho, buscado: sinCongelar }, p)), dicho };
  }
  // El nombre exacto primero: «Papas fritas» antes que «Bife con papas fritas». Lo demás, como lo ordena el buscador.
  const buscado = llano(dicho.buscado);
  const esExacto = (r: Resultado) => llano(r.nombre) === buscado || llano(r.coincide) === buscado;
  const resultados = deAntes === undefined ? [...(await p.buscar(dicho.buscado))].sort((a, b) => Number(esExacto(b)) - Number(esExacto(a))) : [];
  const exacto = resultados.length > 0 && esExacto(resultados[0]);
  const id = deAntes ?? resultados[0]?.id;
  let primero = id === undefined ? null : await p.detalle(id);
  if (!primero) return nada;
  // Con una medida («two scoops of ice cream»), el primero que la tiene: el helado, no el cono que el buscador trae antes.
  if (dicho.unidad === 'medida' && deAntes === undefined && gramosDeLinea(dicho, primero) === null) {
    for (const r of resultados.slice(1)) {
      const otro = await p.detalle(r.id);
      if (otro && gramosDeLinea(dicho, otro) !== null) {
        primero = otro;
        break;
      }
    }
  }
  const ultima = p.ultimaCantidad(String(primero.id));
  // Un plato sin cuánto (comoPlato). Lo que se cuenta («2 empanadas») o se acompaña no lo es.
  const sinCantidad = dicho.cantidad === null && !dicho.unidad;
  if (!dicho.acompanante && (dicho.vago || (sinCantidad && (!ultima || dicho.cuanto)))) {
    const plato = await comoPlato(dicho, primero, resultados, deAntes !== undefined || exacto, ultima, p);
    if (plato) return plato;
  }
  // «Media pizza» son cuatro porciones de ocho, no media porción.
  const entera = dicho.cantidad !== null && dicho.cantidad < 1 && !dicho.unidad ? gramosDeLaEntera(primero.nombre, dicho.buscado) : null;
  if (entera && dicho.cantidad !== null) return { dicho, opciones: [opcion(primero, { gramos: Math.round(entera * dicho.cantidad) })], elegida: 0, pregunta: null, supuesto: true };
  const paraEste = cantidadPara(dicho, primero, ultima);
  const cantidad = conCuanto(dicho, paraEste.cantidad);
  const supuesto = paraEste.supuesto || !!dicho.cuanto;
  const elegida = opcion(primero, cantidad);
  const sola: Entendido = { dicho, opciones: [elegida], elegida: 0, pregunta: null, supuesto };

  // Cuál: sin un alimento que se llame así, los parecidos («leche entera», «leche descremada»; no
  // «banana split» ni nada «con»), si no se eligió antes ni se comió.
  if (deAntes === undefined && !exacto && !p.conocido(primero.id)) {
    const cabeza = buscado.split(' ')[0];
    const parecidos = resultados.slice(1).filter((r) => esParecido(r, cabeza)).slice(0, PARECIDOS - 1);
    const otros = (await Promise.all(parecidos.map((r) => p.detalle(r.id)))).filter((d): d is Detalle => d !== null);
    const opciones = [elegida, ...otros.map((d) => opcion(d, conCuanto(dicho, cantidadPara(dicho, d, undefined).cantidad)))];
    if (opciones.some((o) => cambiaElNumero(o.valores.kcal, elegida.valores.kcal))) return { ...sola, opciones, pregunta: 'cual' };
  }
  // Crudo o cocido: se dijeron gramos o una medida, están las dos versiones y no se dijo cómo («a la plancha», «crudo»).
  if (('gramos' in cantidad || dicho.medida) && dicho.unidad && (primero.crudo || primero.cocidos.length) && !COMO_SE_COCINA.test(buscado)) {
    const otro = await p.detalle(primero.crudo ? primero.crudo.id : primero.cocidos[0].id);
    if (otro) {
      // Los gramos son los mismos; la taza de arroz crudo pesa otra cosa que la de cocido.
      const alterna = opcion(otro, 'gramos' in cantidad ? cantidad : cantidadPara(dicho, otro, undefined).cantidad);
      // Lo que se contestó antes para estas palabras medidas va sin volver a preguntar.
      const antes = p.medido?.(dicho.buscado);
      if (antes === otro.id) return { ...sola, opciones: [alterna] };
      if (antes !== primero.id && cambiaElNumero(alterna.valores.kcal, elegida.valores.kcal)) return { ...sola, opciones: [elegida, alterna], pregunta: 'crudo' };
    }
  }
  return conPreguntaDeCuanto(sola, primero.porciones, (c) => opcion(primero, c));
}

// ------------------------------------------------------------ lo tuyo, por su nombre
/**
 * Lo que la persona guardó, para decirlo por su nombre (lo pediste el 27/11/2026: «mi batido de la mañana»).
 * Una receta o un alimento suyo es una fila, con un plato o su porción; una comida guardada, una fila por
 * cada cosa suya, con la cantidad con que se guardó.
 */
export type Tuyo = { nombre: string; filas: Opcion[] };

/** Una cosa de una comida guardada, como fila, con lo que valía. Lo que no tiene cantidad (la carga rápida) va tal cual. */
function filaDeItem(i: Item): Opcion {
  const gramos = gramosDe(i.cantidad);
  if (!i.cantidad || !i.ref || !gramos) return { alimento: { fuente: 'rapida', ref: '', nombre: i.nombre, por100g: i.valores, porciones: [] }, cantidad: { gramos: 100 }, valores: i.valores };
  // Lo salteado ya trae su aceite en los valores: en la cantidad se contaría dos veces.
  const { aceite: _aceite, ...cantidad } = i.cantidad;
  return { alimento: { fuente: i.fuente, ref: i.ref, nombre: i.nombre, por100g: escalar(i.valores, 100 / gramos), porciones: [], ...(i.estimado ? { estimado: true as const } : {}) }, cantidad, valores: i.valores };
}

/**
 * Lo tuyo, con sus nombres (para leerFrase) y sus filas (para entender). `plato`: cómo se llama la porción de una
 * receta («1 plato»). `alDia`: cada cosa de una comida guardada con lo que vale ahora (alDia, en registros.ts).
 */
export function loTuyo(recetas: Iterable<Receta>, propios: Iterable<AlimentoPropio>, plato: string, alDia: (i: Item) => Item = (i) => i): Tuyo[] {
  const lista: Tuyo[] = [];
  for (const r of recetas) {
    if (!r.items.length) continue;
    if (r.tipo === 'comida') {
      lista.push({ nombre: r.nombre, filas: r.items.map((i) => filaDeItem(alDia(i))) });
      continue;
    }
    // Un plato: lo que pesa terminada (o sus ingredientes) dividido por lo que rinde. Sin pesos, vale lo de una porción.
    const { porcion, por100g, gramos } = valoresDeReceta(r);
    const cantidad = { porcion: plato, gramosPorcion: gramos ? gramos / Math.max(1, r.porciones) : 100, veces: 1 };
    const alimento: AlimentoDicho = { fuente: 'receta', ref: r.id, nombre: r.nombre, por100g: por100g ?? porcion, porciones: [{ nombre: plato, gramos: cantidad.gramosPorcion }], rinde: Math.max(1, r.porciones) };
    lista.push({ nombre: r.nombre, filas: [{ alimento, cantidad, valores: porcion }] });
  }
  for (const a of propios) {
    const [p] = a.porciones;
    const cantidad = p ? { porcion: p.nombre, gramosPorcion: p.gramos, veces: 1 } : { gramos: 100 };
    lista.push({ nombre: a.nombre, filas: [{ alimento: { fuente: 'propio', ref: a.id, nombre: a.nombre, por100g: a.por100g, porciones: a.porciones }, cantidad, valores: valoresDeCantidad(a.por100g, cantidad) }] });
  }
  return lista;
}

/** Lo guardado, las veces que se dijo: «medio batido de la mañana» es la mitad. */
function porVeces(o: Opcion, veces: number): Opcion {
  const c = o.cantidad;
  const cantidad = 'porcion' in c ? { ...c, veces: c.veces * veces } : { ...c, gramos: c.gramos * veces, ...(c.ml !== undefined ? { ml: c.ml * veces } : {}) };
  return { ...o, cantidad, valores: escalar(o.valores, veces) };
}

/**
 * Lo tuyo, con lo que se dijo. Por su nombre, solo o contado, es lo que guardaste con su porción: «medio batido de la
 * mañana» es la mitad, y una comida guardada va entera. «Media tarta» de una receta de seis porciones son tres, como
 * en la base: la mitad de la entera. Con una medida, un plato, «un poco», «mucho», un tamaño, como acompañante o sin
 * porción tuya («un huevo»), pasa por la misma cuenta que lo de la base (27/11/2026): «tres fetas de mi queso» son
 * tres fetas, y «una cucharada de mi manteca», una cucharada y no 100 g (loTuyoConCantidad).
 */
async function loTuyoDicho(dicho: Dicho, filas: readonly Opcion[], p: ParaEntender): Promise<Entendido[]> {
  const [o] = filas;
  const deLaEntera = (o.alimento.rinde ?? 1) > 1 && dicho.cantidad !== null && dicho.cantidad < 1 && !dicho.unidad && gramosDeLaEntera(o.alimento.nombre, dicho.buscado) !== null;
  const veces = !dicho.unidad && dicho.cantidad !== null && dicho.cantidad > 0 ? dicho.cantidad * (deLaEntera ? o.alimento.rinde ?? 1 : 1) : 1;
  // Cada fila con su dicho: la pantalla las distingue por él.
  const sola = (x: Opcion): Entendido => ({ dicho: { ...dicho }, opciones: [x], elegida: 0, pregunta: null, supuesto: false });
  const comoSeGuardo = o.alimento.porciones.length > 0 && !dicho.unidad && !dicho.vago && !dicho.cuanto && !dicho.acompanante && !dicho.tamano && veces < 20;
  if (filas.length > 1 || o.alimento.fuente === 'rapida' || comoSeGuardo) return filas.map((x) => sola(porVeces(x, veces)));
  return [await loTuyoConCantidad(dicho, o, p)];
}

/** El mismo alimento en la base, por su nombre entero («Manteca» para tu manteca): de ahí salen las medidas que lo tuyo no tiene. */
async function mismoEnLaBase(nombre: string, p: ParaEntender): Promise<Detalle | null> {
  const buscado = llano(nombre);
  const igual = (await p.buscar(nombre)).find((r) => llano(r.nombre) === buscado || llano(r.coincide) === buscado);
  return igual ? p.detalle(igual.id) : null;
}

/**
 * Lo tuyo con la cantidad dicha, como lo de la base: sus porciones (las tuyas, el plato que rinde la receta) y, para la
 * medida que no tiene, las del mismo alimento en la base o, si no, la regla de esa medida (una taza son 237 ml).
 */
async function loTuyoConCantidad(dicho: Dicho, o: Opcion, p: ParaEntender): Promise<Entendido> {
  const a = o.alimento;
  const conCantidad = (cantidad: Exclude<Cantidad, null>): Opcion => ({ alimento: a, cantidad, valores: valoresDeCantidad(a.por100g, cantidad) });
  const igual = await mismoEnLaBase(a.nombre, p);
  const deLaBase = (igual?.porciones ?? []).filter((x) => !a.porciones.some((y) => normalizar(y.nombre) === normalizar(x.nombre)));
  const d = { porciones: [...a.porciones, ...deLaBase], densidad: igual?.densidad ?? null };
  // Un plato, «un poco», «mucho» o un tamaño: el plato de la receta (lo que rinde) o, si no, el de la tabla.
  if (!dicho.acompanante && (dicho.vago || (dicho.cantidad === null && !dicho.unidad && (dicho.cuanto || tamanoDicho(dicho))))) {
    const suPlato = a.porciones.find((x) => PLATO_DE_LA_BASE.test(x.nombre));
    const delPlato = dicho.recipiente === 'otro' ? platoDeSiempre(d) : null;
    const porciones = suPlato ? porcionesDesde(suPlato.gramos)
      : dicho.vago ? porcionesAlDecirPlato((igual && platoDeLaBase(igual)) ?? delPlato, a.nombre, dicho.buscado)
      : porcionesDePlato(a.nombre, igual?.nombre);
    if (porciones) return enTamanos(dicho, porciones, (gramos) => conCantidad({ gramos }), null);
  }
  // Contado y sin ninguna porción, ni tuya ni de la base: no se sabe cuánto pesa uno, se pregunta.
  if (!d.porciones.length && dicho.cantidad !== null && !dicho.unidad && dicho.cantidad < 20) {
    const cantidad = dicho.cantidad;
    return { dicho, opciones: [0.5, 1, 1.5].map((f) => conCantidad({ gramos: Math.round(100 * f * cantidad) })), elegida: 1, pregunta: 'cuanto', supuesto: true };
  }
  // Una medida de volumen que no está en ningún lado va con la regla de esa medida, con la densidad del agua.
  const conMedida = dicho.unidad && ML_POR[dicho.unidad] && gramosDeLinea(dicho, d) === null ? { ...d, densidad: 1 } : d;
  const paraEste = cantidadPara(dicho, conMedida, undefined);
  const elegida = conCantidad(conCuanto(dicho, paraEste.cantidad));
  const sola: Entendido = { dicho, opciones: [elegida], elegida: 0, pregunta: null, supuesto: paraEste.supuesto || !!dicho.cuanto };
  return conPreguntaDeCuanto(sola, d.porciones, conCantidad);
}

/**
 * Si la base tiene algo que se llama como lo dicho, con todas sus palabras enteras: «batido de proteína», sí; «batido
 * de kiwi», que solo se parece a otros batidos, no.
 */
async function loTiene(dicho: Dicho, p: ParaEntender): Promise<boolean> {
  if (p.alias(dicho.buscado) !== undefined) return true;
  const palabras = llano(dicho.buscado).split(' ').filter((x) => x && !UNIONES.has(x));
  const nombra = (texto: string) => { const suyas = llano(texto).split(' '); return palabras.every((x) => suyas.includes(x)); };
  return (await p.buscar(dicho.buscado)).some((r) => nombra(r.coincide) || nombra(r.nombre));
}

/**
 * Si la base trajo una bebida de la misma familia que la dicha («Licuado de frutilla» para «un licuado de kiwi»): lleva
 * el líquido que no se dijo, y va esa, como antes; la fruta sola sería menos de la mitad.
 */
function esLaMismaBebida(d: Dicho, e: Entendido): boolean {
  const o = e.opciones[e.elegida];
  const [dicha, hallada] = [llano(d.buscado).split(' ')[0], o ? llano(o.alimento.nombre).split(' ')[0] : ''];
  return FAMILIAS_DE_BEBIDA.some((f) => f.includes(dicha) && f.includes(hallada));
}

/**
 * Si lo encontrado es eso mismo, nombrado primero: «Kiwi» para «kiwi» o «Banana» para «banana congelada»; no «Ensalada
 * de frutas» para «fruta», ni «Frutos del bosque» para «frutos rojos».
 */
function esLoMismo(e: Entendido): boolean {
  const o = e.opciones[e.elegida];
  if (!o) return false;
  const palabras = (t: string) => llano(t.replace(CONGELADO, ' ')).split(' ').filter((x) => x && !UNIONES.has(x));
  const [dicho, nombre] = [palabras(e.dicho.buscado), palabras(o.alimento.nombre)];
  return dicho.length > 0 && dicho[0] === nombre[0] && dicho.every((x) => nombre.includes(x));
}

/** Cuánto mueve el número una pregunta: entre la opción más chica y la más grande. */
const cuantoMueve = (e: Entendido) => {
  const kcal = e.opciones.map((o) => o.valores.kcal);
  return Math.max(...kcal) - Math.min(...kcal);
};

const UNIONES = new Set(['y', 'e', 'and', 'de', 'del', 'con', 'with', 'of', 'a', 'al', 'en', 'el', 'la', 'los', 'las', 'the']);
/** Si el nombre de la base dice lo mismo que lo dicho, sin palabras de más: «Arroz con pollo» es «arroz y pollo»; «Medialuna de jamón y queso» no es «jamón y queso». */
function esEso(dicho: string, nombre: string): boolean {
  const palabras = (t: string) => llano(t).split(' ').filter((x) => x && !UNIONES.has(x));
  const [a, b] = [palabras(dicho), palabras(nombre)];
  return b.length <= a.length && a.every((x) => b.includes(x));
}

/** Lo dicho, entendido: como mucho tres preguntas por comida, las que más mueven el número. */
export async function entender(dichos: readonly Dicho[], p: ParaEntender): Promise<Entendido[]> {
  // «Arroz y pollo»: si la base no tiene el nombre entero, cada uno por su lado, con lo que se dijo de
  // los dos: «un poco de arroz y pollo» es un poco de cada uno, y «un plato de arroz y pollo», un plato.
  // Lo encontrado tiene que ser eso y nada más: «eggs and toast» no es un sándwich con huevo y tostada.
  /**
   * Una cosa dicha: lo que la persona guardó, con sus filas; lo demás, de la base. Una comida guardada (varias cosas)
   * que se llama como algo de la base («Asado», «Pizza») va solo si se la nombró sin dudas («mi asado», «el asado de
   * siempre», la frase entera): «200 g de asado» o «una pizza y una coca» son lo de la base.
   */
  const uno = async (x: Dicho): Promise<Entendido[]> => {
    const filas = x.tuyo === undefined ? undefined : p.tuyo?.(x.tuyo);
    if (!filas?.length) return [await entenderUno(x, p)];
    if (filas.length > 1 && !x.sinDudas && (await mismoEnLaBase(x.buscado, p))) return [await entenderUno({ ...x, tuyo: undefined }, p)];
    return loTuyoDicho(x, filas, p);
  };
  const lista = (await Promise.all(dichos.map(async (d) => {
    if (d.tuyo !== undefined) return uno(d);
    // «Un batido de kiwi»: si la base no tiene nada con ese nombre, va lo que lleva, si lo encontrado es eso mismo:
    // «un licuado de frutas» no es la ensalada de frutas, ni «un smoothie de frutos rojos» los frutos del bosque solos,
    // y siguen como antes (27/11/2026). Si la base trae una bebida de la misma familia, es esa: «un licuado de kiwi» es
    // un licuado, con su leche, no un kiwi. «Un batido de la mañana», que no lleva nada que se coma, sigue sin encontrarse.
    let e: Entendido | null = null;
    if (d.lleva && !(await loTiene(d, p))) {
      e = await entenderUno(d, p);
      if (!esLaMismaBebida(d, e)) {
        const lleva = (await Promise.all(d.lleva.map(uno))).flat();
        if (lleva.length && lleva.every((x) => x.dicho.tuyo !== undefined || esLoMismo(x))) return lleva;
      }
    }
    e ??= await entenderUno(d, p);
    const o = e.opciones[e.elegida];
    if (!d.partes || (o && (p.alias(d.buscado) !== undefined || esEso(d.buscado, o.alimento.nombre)))) return [e];
    const deLosDos: Partial<Dicho> = { ...(d.vago ? { vago: true, recipiente: d.recipiente } : {}), ...(d.plato ? { plato: d.plato } : {}), ...(d.cuanto ? { cuanto: d.cuanto } : {}) };
    return (await Promise.all(d.partes.map((x) => uno({
      ...x,
      ...deLosDos,
      ...(x.cantidad === null && d.vago ? { cantidad: d.cantidad } : {}),
      ...(x.cantidad === null && d.acompanante ? { acompanante: true as const } : {}),
    })))).flat();
  }))).flat();
  const conPregunta = lista.filter((e) => e.pregunta).sort((a, b) => cuantoMueve(b) - cuantoMueve(a));
  for (const e of conPregunta.slice(PREGUNTAS_POR_COMIDA)) {
    e.opciones = [e.opciones[e.elegida]];
    e.elegida = 0;
    e.pregunta = null;
  }
  return lista;
}
