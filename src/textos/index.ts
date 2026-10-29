import { getLocales } from 'expo-localization';

import en from './en.json';
import es from './es.json';
import vos from './vos.json';

export type Idioma = 'es' | 'en';

type Variables = Record<string, string | number>;
type Plural = { uno: string; otros: string };

// La forma de un diccionario sin sus textos, para comparar es.json con en.json clave por clave.
type Forma<T> = T extends string
  ? string
  : T extends readonly string[]
    ? readonly string[]
    : { readonly [K in keyof T]: Forma<T[K]> };

// Las dos direcciones: a en.json no le falta ninguna clave de es.json, y tampoco le sobra ninguna.
const diccionarios = {
  es: es satisfies Forma<typeof en>,
  en: en satisfies Forma<typeof es>,
};

// Las rutas con punto ('cielo.armandose', 'fecha.dias'…) hasta cada valor del tipo H.
type Rutas<T, H, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends H
    ? `${P}${K}`
    : T[K] extends string | readonly unknown[]
      ? never
      : T[K] extends object
        ? Rutas<T[K], H, `${P}${K}.`>
        : never;
}[keyof T & string];

export type Clave = Rutas<typeof es, string>;
export type ClaveDeLista = Rutas<typeof es, readonly string[]>;
export type ClaveDePlural = Rutas<typeof es, Plural>;

// El voseo es una capa sobre es.json: solo los textos que cambian, con las mismas claves (lo revisa
// vos.test.ts). Una clave que no está en es.json, o con otra forma, no compila.
type Parcial<T> = T extends string | readonly string[] ? T : { readonly [K in keyof T]?: Parcial<T[K]> };
const voseo = vos satisfies Parcial<Forma<typeof es>>;

/** Las regiones donde se habla de vos (lo decidiste el 28/10/2026). */
const CON_VOSEO = new Set(['UY', 'AR']);

let elegido: Idioma | undefined;
let conVos: boolean | undefined;

// iOS reinicia la app cuando cambia el idioma o la región del teléfono: basta con leerlos una vez.
export function idioma(): Idioma {
  elegido ??= /^es(-|$)/i.test(getLocales()[0].languageTag) ? 'es' : 'en';
  return elegido;
}

/** Si la app habla de vos: en español, con el teléfono en Uruguay o Argentina. */
export function hablaDeVos(): boolean {
  if (conVos === undefined) {
    const l = getLocales()[0];
    const region = l.regionCode ?? l.languageTag.split('-')[1];
    conVos = idioma() === 'es' && !!region && CON_VOSEO.has(region.toUpperCase());
  }
  return conVos;
}

function enDiccionario(raiz: unknown, clave: string): unknown {
  let nodo = raiz;
  for (const parte of clave.split('.')) nodo = (nodo as Record<string, unknown> | undefined)?.[parte];
  return nodo;
}

function buscar(clave: string): unknown {
  if (hablaDeVos()) {
    const deVos = enDiccionario(voseo, clave);
    if (deVos !== undefined) return deVos;
  }
  return enDiccionario(diccionarios[idioma()], clave);
}

function interpolar(texto: string, variables: Variables = {}): string {
  // Un {nombre} sin valor queda a la vista en lugar de desaparecer.
  return texto.replace(/\{(\w+)\}/g, (marca, nombre: string) =>
    Object.hasOwn(variables, nombre) ? String(variables[nombre]) : marca,
  );
}

export function t(clave: Clave, variables?: Variables): string {
  return interpolar(buscar(clave) as string, variables);
}

// fecha.dias empieza en domingo, como Date.getDay(); fecha.mesesCortos en enero, como Date.getMonth().
export function lista(clave: ClaveDeLista): readonly string[] {
  return buscar(clave) as readonly string[];
}

/**
 * Para entradas con la forma { "uno": "{n} hábito", "otros": "{n} hábitos" }.
 * En español y en inglés solo el 1 va en singular; `n` también se interpola como {n}.
 */
export function plural(clave: ClaveDePlural, n: number, variables?: Variables): string {
  const formas = buscar(clave) as Plural;
  return interpolar(n === 1 ? formas.uno : formas.otros, { ...variables, n });
}
