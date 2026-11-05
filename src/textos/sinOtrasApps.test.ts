// Moss no nombra otras apps en lo que se lee (spec/estudio/fotos.md, §3): ni en la pantalla de pago ni en «En qué
// se basa Moss», donde el porqué de no medir la comida con una foto habla de estudios, no de marcas. Sin la «i», para
// que «lose it» en una frase en inglés no cuente; sin «Gemini», que también es una constelación.

import { expect, test } from '@jest/globals';

import en from './en.json';
import es from './es.json';

type Nodo = string | readonly string[] | { [clave: string]: Nodo };

function textos(nodo: Nodo, ruta = ''): [string, string][] {
  if (typeof nodo === 'string') return [[ruta, nodo]];
  if (Array.isArray(nodo)) return (nodo as readonly string[]).map((texto) => [ruta, texto]);
  return Object.entries(nodo).flatMap(([k, v]) => textos(v, ruta ? `${ruta}.${k}` : k));
}

const OTRAS_APPS = /(?<!\p{L})(MyFitnessPal|Cal AI|Lose It!?|Foodvisor|SnapCalorie|Yazio|FatSecret|Cronometer|MacroFactor|Fitia|ChatGPT)(?!\p{L})/u;

test('ningún texto nombra otras apps, en español ni en inglés', () => {
  for (const idioma of [es, en] as unknown as Nodo[]) {
    expect(textos(idioma).filter(([, texto]) => OTRAS_APPS.test(texto))).toEqual([]);
  }
});
