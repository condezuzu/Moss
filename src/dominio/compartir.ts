// Compartir sin dominio (D12): una receta, una comida guardada o un alimento propio viajan en un
// enlace moss://compartido?d=… que lleva todo adentro (JSON en base64url, sin ids ni horas), junto
// a un texto que se lee aunque no se tenga Moss. Quien lo recibe lo suma a lo suyo. Lo que llega se
// revisa entero: de un enlace puede venir cualquier cosa.

import { microsValidos } from './micronutrientes';
import { SECUNDARIOS, type AlimentoPropio, type Item, type Nutriente, type Receta, type Valores } from './registros';

export type RecetaCompartida = Pick<Receta, 'tipo' | 'nombre' | 'items' | 'porciones' | 'pesoFinal'>;
export type PropioCompartido = Pick<AlimentoPropio, 'nombre' | 'marca' | 'codigo' | 'por100g' | 'porciones' | 'origen'>;
export type Compartido = { tipo: 'receta'; receta: RecetaCompartida } | { tipo: 'propio'; propio: PropioCompartido };

export const PREFIJO = 'moss://compartido?d=';
const VERSION = 1;
const MAXIMO_DE_ITEMS = 60;

function aBase64Url(texto: string): string {
  let binario = '';
  for (const b of new TextEncoder().encode(texto)) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64Url(s: string): string {
  const binario = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
}

/** Lo largo que puede ser cada texto: el enlace se arma recortado, así siempre pasa su propia revisión. */
const LARGO = { nombre: 200, marca: 120, porcion: 120 };
const corto = (s: string, n: number) => s.trim().slice(0, n);

/** El enlace, solo con lo que hace falta para armarlo del otro lado. */
export function enlaceDe(c: Compartido): string {
  const datos = c.tipo === 'receta'
    ? { v: VERSION, tipo: c.tipo, receta: { tipo: c.receta.tipo, nombre: corto(c.receta.nombre, LARGO.nombre), porciones: c.receta.porciones, pesoFinal: c.receta.pesoFinal, items: c.receta.items.map(itemLimpio) } }
    : {
      v: VERSION, tipo: c.tipo, propio: {
        nombre: corto(c.propio.nombre, LARGO.nombre), marca: c.propio.marca && corto(c.propio.marca, LARGO.marca), codigo: c.propio.codigo, por100g: c.propio.por100g,
        porciones: c.propio.porciones.map((p) => ({ nombre: corto(p.nombre, LARGO.porcion), gramos: p.gramos })), origen: c.propio.origen ?? 'mano',
      },
    };
  return PREFIJO + aBase64Url(JSON.stringify(datos));
}

// De lo de otro teléfono no viajan las referencias a lo propio: del otro lado no existen.
const itemLimpio = (i: Item): Item => ({
  fuente: i.fuente === 'propio' || i.fuente === 'receta' ? 'rapida' : i.fuente,
  ref: i.fuente === 'propio' || i.fuente === 'receta' ? null : i.ref,
  nombre: corto(i.nombre, LARGO.nombre), cantidad: cantidadLimpia(i.cantidad, true), valores: i.valores, ...(i.estimado ? { estimado: true as const } : {}),
});

const numero = (x: unknown, min: number, max: number): x is number => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max;
const texto = (x: unknown, max: number): x is string => typeof x === 'string' && x.trim().length > 0 && x.length <= max;

/** Los micronutrientes de otro teléfono: solo los conocidos y posibles; si no queda ninguno, no van. */
function conMicrosLimpios(v: Valores): Valores {
  const { micros, ...resto } = v;
  const limpios = microsValidos(micros);
  return limpios ? { ...resto, micros: limpios } : resto;
}

function valoresValidos(v: unknown, porCien: boolean): v is Valores {
  if (!v || typeof v !== 'object') return false;
  const x = v as Record<string, unknown>;
  const tope = porCien ? 100 : 5000;
  if (!numero(x.kcal, 0, porCien ? 902 : 50000) || !numero(x.proteina, 0, tope) || !numero(x.carbohidratos, 0, tope) || !numero(x.grasas, 0, tope)) return false;
  return SECUNDARIOS.every((k) => x[k] === undefined || numero(x[k], 0, k === 'sodio' ? 100000 : tope));
}

/** Una cantidad posible (Medida, con el aceite si tiene); la carga rápida no tiene. */
function cantidadValida(c: unknown): boolean {
  if (c === null || c === undefined) return true;
  if (!c || typeof c !== 'object' || Array.isArray(c)) return false;
  const x = c as Record<string, unknown>;
  const opcional = (v: unknown, max: number) => v === undefined || numero(v, 0, max);
  if (!opcional(x.aceite, 5000)) return false;
  if ('porcion' in x) return texto(x.porcion, LARGO.porcion) && numero(x.gramosPorcion, 0.01, 100000) && numero(x.veces, 0.001, 10000);
  return numero(x.gramos, 0, 100000) && opcional(x.ml, 100000) && opcional(x.bruto, 100000);
}

/** La cantidad, con sus campos y nada más. */
function cantidadLimpia(c: Item['cantidad'] | undefined, recortar = false): Item['cantidad'] {
  if (!c || typeof c !== 'object') return null;
  const aceite = c.aceite !== undefined ? { aceite: c.aceite } : {};
  if ('porcion' in c) return { porcion: recortar ? corto(c.porcion, LARGO.porcion) : c.porcion, gramosPorcion: c.gramosPorcion, veces: c.veces, ...aceite };
  return { gramos: c.gramos, ...(c.ml !== undefined ? { ml: c.ml } : {}), ...(c.bruto !== undefined ? { bruto: c.bruto } : {}), ...aceite };
}

function itemValido(i: unknown): i is Item {
  if (!i || typeof i !== 'object') return false;
  const x = i as Record<string, unknown>;
  const fuentes = ['base', 'catalogo', 'off', 'rapida'];
  return fuentes.includes(x.fuente as string) && (x.ref === null || texto(x.ref, 40)) && texto(x.nombre, LARGO.nombre) && cantidadValida(x.cantidad) && valoresValidos(x.valores, false);
}

/** Un alimento de otro teléfono, solo con los campos conocidos: lo demás no se guarda ni sube. */
const itemRecibido = (i: Item): Item => ({
  fuente: i.fuente, ref: i.ref, nombre: i.nombre.trim(), cantidad: cantidadLimpia(i.cantidad), valores: conMicrosLimpios(i.valores), ...(i.estimado === true ? { estimado: true as const } : {}),
});

/** Lo que trae un enlace (o solo su `d`), revisado; si algo no cierra, null. */
export function leerCompartido(enlaceOD: string): Compartido | null {
  try {
    const d = enlaceOD.startsWith(PREFIJO) ? enlaceOD.slice(PREFIJO.length) : enlaceOD;
    const datos = JSON.parse(deBase64Url(decodeURIComponent(d))) as Record<string, unknown>;
    if (datos.v !== VERSION) return null;
    if (datos.tipo === 'receta') {
      const r = datos.receta as Record<string, unknown>;
      if (!r || (r.tipo !== 'receta' && r.tipo !== 'comida') || !texto(r.nombre, LARGO.nombre) || !numero(r.porciones, 0.5, 100)) return null;
      if (!(r.pesoFinal === null || numero(r.pesoFinal, 1, 20000))) return null;
      if (!Array.isArray(r.items) || !r.items.length || r.items.length > MAXIMO_DE_ITEMS || !r.items.every(itemValido)) return null;
      return { tipo: 'receta', receta: { tipo: r.tipo, nombre: r.nombre.trim(), porciones: r.porciones, pesoFinal: r.pesoFinal as number | null, items: (r.items as Item[]).map(itemRecibido) } };
    }
    if (datos.tipo === 'propio') {
      const p = datos.propio as Record<string, unknown>;
      if (!p || !texto(p.nombre, LARGO.nombre) || !(p.marca === null || texto(p.marca, LARGO.marca)) || !(p.codigo === null || (typeof p.codigo === 'string' && /^\d{6,14}$/.test(p.codigo)))) return null;
      if (!valoresValidos(p.por100g, true)) return null;
      const porciones = p.porciones;
      if (!Array.isArray(porciones) || porciones.length > 20 || !porciones.every((x) => x && texto((x as { nombre: unknown }).nombre, LARGO.porcion) && numero((x as { gramos: unknown }).gramos, 0.1, 5000))) return null;
      const origen = p.origen === 'off' || p.origen === 'etiqueta' ? p.origen : 'mano';
      return { tipo: 'propio', propio: { nombre: p.nombre.trim(), marca: p.marca as string | null, codigo: p.codigo as string | null, por100g: conMicrosLimpios(p.por100g as Valores), porciones: (porciones as AlimentoPropio['porciones']).map((x) => ({ nombre: x.nombre.trim(), gramos: x.gramos })), origen } };
    }
    return null;
  } catch {
    return null;
  }
}

/** Lo que trae una porción de una receta: la suma de sus alimentos, dividida por las porciones. */
export function porPorcion(r: RecetaCompartida): Valores {
  const suma = (k: Nutriente) => r.items.reduce((s, i) => s + (i.valores[k] ?? 0), 0) / r.porciones;
  return { kcal: suma('kcal'), proteina: suma('proteina'), carbohidratos: suma('carbohidratos'), grasas: suma('grasas') };
}
