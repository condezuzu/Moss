// Lo dicho, en alimentos de la base (lo pediste el 26/10): cada pedazo de la frase (frase.ts) pasa
// por el buscador de siempre, y lo que la persona ya eligió o ya comió decide. Se pregunta solo si
// cambia el número (40 kcal, o un 15 % si son al menos 15 kcal), con una respuesta ya marcada, una
// vez por alimento y tres por comida, y cada respuesta se recuerda. Ningún número sale de un
// modelo: todo es de la base.

import type { Cantidad, Valores } from '@/dominio/registros';
import { valoresDeCantidad } from '@/dominio/registros';
import { normalizar, type Resultado } from './buscar';
import type { Detalle } from './detalle';
import type { Dicho } from './frase';
import { gramosDeLinea } from './recetaDeTexto';

export type AlimentoDicho = { ref: string; nombre: string; por100g: Valores; porciones: { nombre: string; gramos: number }[] };
export type Opcion = { alimento: AlimentoDicho; cantidad: Exclude<Cantidad, null>; valores: Valores };
/** Cuál de varios parecidos («¿qué leche?»), crudo o cocido (se dijeron gramos), o cuánto (no se dijo). */
export type TipoDePregunta = 'cual' | 'crudo' | 'cuanto';

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
};

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
/** Lo que se cuenta como una cosa: «1 unidad», «1 mediana», «1 rebanada». */
const DE_A_UNA = /^1\s+(?:unidad|mediana?o?|grande|chica?o?|peque[nñ][ao]|pieza|rebanada|feta|porci[oó]n t[ií]pica|medium|large|small|piece|slice)(?![\p{L}])/iu;
/** Lo que se toma, de a uno: «un café» es una taza, «una coca», una lata. */
const RECIPIENTE = /^1\s+(?:taza|cup|vaso|glass|pocillo|lata|can|botella|bottle|copa|tazón)(?![\p{L}])/iu;
/** Un pocillo de café: unos 80 ml (recetaDeTexto no le da volumen, para que la receta lo pregunte). */
const ML_DEL_POCILLO = 80;
/** Cómo se cocinó, dicho: entonces no se pregunta crudo o cocido. */
const COMO_SE_COCINA = /(?:plancha|horno|hervid|frit|asad|cocid|crud|revuelt|guisad|saltead|grill|baked|boiled|fried|roast|cooked|raw|scrambled)/;

/**
 * La porción para contar lo dicho («2 huevos»): la que se llama como lo dicho («1 huevo»), la de una
 * unidad, en lo que se toma la taza o el vaso, o la de siempre. Nunca «2 tazas» de huevos.
 */
function porcionParaContar(dicho: Dicho, d: Pick<Detalle, 'porciones' | 'densidad'>): { nombre: string; gramos: number } | undefined {
  const palabra = llano(dicho.buscado).split(' ')[0];
  const nombrada = d.porciones.find((p) => /^1\s/.test(p.nombre) && llano(p.nombre).split(' ')[1] === palabra);
  const unidad = d.porciones.find((p) => DE_A_UNA.test(p.nombre));
  const recipiente = d.densidad ? d.porciones.find((p) => RECIPIENTE.test(p.nombre)) : undefined;
  return nombrada ?? unidad ?? recipiente ?? d.porciones[0];
}

/**
 * La cantidad de lo dicho para un alimento: lo dicho (gramos, una medida de cocina o cuántos), la
 * última vez o, si no, la porción de siempre; el acompañante, la más chica (la cucharadita de manteca).
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
    if (gramos) return { cantidad: { gramos }, supuesto: false };
    if (unidad === 'pocillo') return { cantidad: { porcion: '1 pocillo', gramosPorcion: Math.round(ML_DEL_POCILLO * (d.densidad ?? 1)), veces: cantidad }, supuesto: false };
  }
  if (cantidad !== null) {
    // Mucho y sin unidad («150 de pollo»): son gramos.
    if (cantidad >= 20) return { cantidad: { gramos: cantidad }, supuesto: false };
    const una = porcionParaContar(dicho, d);
    return una ? { cantidad: { porcion: una.nombre, gramosPorcion: una.gramos, veces: cantidad }, supuesto: false } : { cantidad: { gramos: 100 * cantidad }, supuesto: true };
  }
  if (ultima) return { cantidad: ultima, supuesto: false };
  const porciones = dicho.acompanante ? [...d.porciones].sort((a, b) => a.gramos - b.gramos) : d.porciones;
  const p = porciones[0];
  return { cantidad: p ? { porcion: p.nombre, gramosPorcion: p.gramos, veces: 1 } : { gramos: 100 }, supuesto: true };
}

const alimentoDe = (d: Detalle): AlimentoDicho => ({ ref: String(d.id), nombre: d.nombre, por100g: d.por100g as Valores, porciones: d.porciones });
const opcion = (d: Detalle, cantidad: Exclude<Cantidad, null>): Opcion => ({ alimento: alimentoDe(d), cantidad, valores: valoresDeCantidad(d.por100g as Valores, cantidad) });

async function entenderUno(dicho: Dicho, p: ParaEntender): Promise<Entendido> {
  const nada: Entendido = { dicho, opciones: [], elegida: 0, pregunta: null, supuesto: false };
  const deAntes = p.alias(dicho.buscado);
  // El nombre exacto primero: «Papas fritas» antes que «Bife con papas fritas». Lo demás, como lo ordena el buscador.
  const buscado = llano(dicho.buscado);
  const esExacto = (r: Resultado) => llano(r.nombre) === buscado || llano(r.coincide) === buscado;
  const resultados = deAntes === undefined ? [...(await p.buscar(dicho.buscado))].sort((a, b) => Number(esExacto(b)) - Number(esExacto(a))) : [];
  const exacto = resultados.length > 0 && esExacto(resultados[0]);
  const id = deAntes ?? resultados[0]?.id;
  const primero = id === undefined ? null : await p.detalle(id);
  if (!primero) return nada;
  const { cantidad, supuesto } = cantidadPara(dicho, primero, p.ultimaCantidad(String(primero.id)));
  const elegida = opcion(primero, cantidad);
  const sola: Entendido = { dicho, opciones: [elegida], elegida: 0, pregunta: null, supuesto };

  // Cuál: sin un alimento que se llame así, los parecidos («leche entera», «leche descremada»; no
  // «banana split» ni nada «con»), si no se eligió antes ni se comió.
  if (deAntes === undefined && !exacto && !p.conocido(primero.id)) {
    const cabeza = buscado.split(' ')[0];
    const parecidos = resultados.slice(1).filter((r) => {
      const palabras = llano(r.nombre).split(' ');
      return palabras[0] === cabeza && palabras.length <= 3 && !palabras.includes('con');
    }).slice(0, PARECIDOS - 1);
    const otros = (await Promise.all(parecidos.map((r) => p.detalle(r.id)))).filter((d): d is Detalle => d !== null);
    const opciones = [elegida, ...otros.map((d) => opcion(d, cantidadPara(dicho, d, undefined).cantidad))];
    if (opciones.some((o) => cambiaElNumero(o.valores.kcal, elegida.valores.kcal))) return { ...sola, opciones, pregunta: 'cual' };
  }
  // Crudo o cocido: se dijeron gramos o una medida, están las dos versiones y no se dijo cómo («a la plancha», «crudo»).
  if (('gramos' in cantidad || dicho.medida) && dicho.unidad && (primero.crudo || primero.cocidos.length) && !COMO_SE_COCINA.test(buscado)) {
    const otro = await p.detalle(primero.crudo ? primero.crudo.id : primero.cocidos[0].id);
    if (otro) {
      // Los gramos son los mismos; la taza de arroz crudo pesa otra cosa que la de cocido.
      const alterna = opcion(otro, 'gramos' in cantidad ? cantidad : cantidadPara(dicho, otro, undefined).cantidad);
      if (cambiaElNumero(alterna.valores.kcal, elegida.valores.kcal)) return { ...sola, opciones: [elegida, alterna], pregunta: 'crudo' };
    }
  }
  // Cuánto: no se dijo, no hay una vez anterior y cambia mucho. El acompañante, sus porciones chicas
  // (la cucharadita o la cucharada de manteca, nunca una taza); lo demás, media, una o una y media.
  if (supuesto && 'porcion' in cantidad) {
    const chicas = [...primero.porciones].sort((a, b) => a.gramos - b.gramos).filter((x) => x.gramos <= 3.5 * cantidad.gramosPorcion).slice(0, 3);
    const cantidades = dicho.acompanante
      ? chicas.map((x) => ({ porcion: x.nombre, gramosPorcion: x.gramos, veces: 1 }))
      : [0.5, 1, 1.5].map((veces) => ({ ...cantidad, veces }));
    const opciones = cantidades.map((c) => opcion(primero, c));
    const marcada = opciones.findIndex((o) => 'porcion' in o.cantidad && o.cantidad.porcion === cantidad.porcion && o.cantidad.veces === cantidad.veces);
    if (opciones.length >= 2 && opciones.some((o) => cambiaElNumero(o.valores.kcal, elegida.valores.kcal))) return { ...sola, opciones, elegida: Math.max(0, marcada), pregunta: 'cuanto' };
  }
  return sola;
}

/** Cuánto mueve el número una pregunta: entre la opción más chica y la más grande. */
const cuantoMueve = (e: Entendido) => {
  const kcal = e.opciones.map((o) => o.valores.kcal);
  return Math.max(...kcal) - Math.min(...kcal);
};

/** Lo dicho, entendido: como mucho tres preguntas por comida, las que más mueven el número. */
export async function entender(dichos: readonly Dicho[], p: ParaEntender): Promise<Entendido[]> {
  const lista = await Promise.all(dichos.map((d) => entenderUno(d, p)));
  const conPregunta = lista.filter((e) => e.pregunta).sort((a, b) => cuantoMueve(b) - cuantoMueve(a));
  for (const e of conPregunta.slice(PREGUNTAS_POR_COMIDA)) {
    e.opciones = [e.opciones[e.elegida]];
    e.elegida = 0;
    e.pregunta = null;
  }
  return lista;
}
