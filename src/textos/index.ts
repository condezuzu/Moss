import { getLocales } from 'expo-localization';

import en from './en.json';
import es from './es.json';

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

let elegido: Idioma | undefined;

// iOS reinicia la app cuando cambia el idioma del teléfono: basta con leerlo una vez.
export function idioma(): Idioma {
  elegido ??= /^es(-|$)/i.test(getLocales()[0].languageTag) ? 'es' : 'en';
  return elegido;
}

function buscar(clave: string): unknown {
  let nodo: unknown = diccionarios[idioma()];
  for (const parte of clave.split('.')) nodo = (nodo as Record<string, unknown>)[parte];
  return nodo;
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
