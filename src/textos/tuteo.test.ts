// Moss habla de tú en todo el español (D31): ni formas de vos ni palabras rioplatenses en es.json.

import { expect, test } from '@jest/globals';

import es from './es.json';

type Nodo = string | readonly string[] | { [clave: string]: Nodo };

function textos(nodo: Nodo, ruta = ''): [string, string][] {
  if (typeof nodo === 'string') return [[ruta, nodo]];
  if (Array.isArray(nodo)) return (nodo as readonly string[]).map((texto) => [ruta, texto]);
  return Object.entries(nodo).flatMap(([k, v]) => textos(v, ruta ? `${ruta}.${k}` : k));
}

const DE_VOS = /(?<!\p{L})(vos|sos|tenés|querés|podés|sabés|hacés|decís|comés|dormís|necesitás|preferís|solés|registrás|fijate|registrá|anotá|tocá|mirá|agregá|sumá|construí|comé|usá|probá|poné|cerrá|guardá|borrá|cambiá|pasá|dejá|buscá|contá|confirmá|revisá|prendé|apagá|marcá|pesate|sacá|bajá|volvé|andá|vení|empezá|hacé|decí|elegí|escribí|abrí|subí|seguí|dormí)(?!\p{L})/iu;
const RIOPLATENSE = /(?<!\p{L})(acá|panza|cola|morrón|manteca|capaz|dale|che|nomás|heladera|remera|pollera)(?!\p{L})/iu;

test('ningún texto en español habla de vos', () => {
  expect(textos(es as Nodo).filter(([, texto]) => DE_VOS.test(texto))).toEqual([]);
});

test('ningún texto en español usa palabras rioplatenses', () => {
  expect(textos(es as Nodo).filter(([, texto]) => RIOPLATENSE.test(texto))).toEqual([]);
});
