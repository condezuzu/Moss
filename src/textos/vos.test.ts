// El voseo (vos.json) es una capa sobre es.json: las mismas claves, solo lo que cambia, con las
// mismas variables, y sin formas de tú que se hayan quedado.

import { expect, test } from '@jest/globals';

import es from './es.json';
import vos from './vos.json';

type Nodo = string | readonly string[] | { [clave: string]: Nodo };

function hojas(nodo: Nodo, ruta = ''): [string, string | readonly string[]][] {
  if (typeof nodo === 'string' || Array.isArray(nodo)) return [[ruta, nodo as string | readonly string[]]];
  return Object.entries(nodo).flatMap(([k, v]) => hojas(v, ruta ? `${ruta}.${k}` : k));
}

function en(raiz: Nodo, ruta: string): Nodo | undefined {
  let nodo: Nodo | undefined = raiz;
  for (const parte of ruta.split('.')) nodo = nodo && typeof nodo === 'object' && !Array.isArray(nodo) ? (nodo as Record<string, Nodo>)[parte] : undefined;
  return nodo;
}

const variables = (texto: string) => (texto.match(/\{\w+\}/g) ?? []).sort().join();
const textos = (valor: string | readonly string[]) => (typeof valor === 'string' ? [valor] : [...valor]);

const deVos = hojas(vos as Nodo);

test('cada texto de vos.json existe en es.json, con la misma forma y otro texto', () => {
  for (const [ruta, valor] of deVos) {
    const original = en(es as Nodo, ruta);
    expect([ruta, typeof original]).toEqual([ruta, typeof valor]);
    if (Array.isArray(valor)) expect([ruta, (original as readonly string[]).length]).toEqual([ruta, valor.length]);
    expect([ruta, original]).not.toEqual([ruta, valor]);
  }
});

test('con las mismas variables que en es.json', () => {
  for (const [ruta, valor] of deVos) {
    const original = textos(en(es as Nodo, ruta) as string | readonly string[]);
    textos(valor).forEach((texto, i) => expect([ruta, variables(texto)]).toEqual([ruta, variables(original[i])]));
  }
});

test('con vos encima, ningún texto queda con formas de tú', () => {
  const TU = /\b(tú|contigo|tienes|puedes|quieres|eres|haces|sabes|necesitas|prefieres|sueles|registras|comes|duermes)\b/i;
  const conVos = new Map(deVos);
  const quedan = hojas(es as Nodo)
    .flatMap(([ruta, valor]) => textos(conVos.get(ruta) ?? valor).map((texto) => [ruta, texto] as const))
    .filter(([, texto]) => TU.test(texto));
  expect(quedan).toEqual([]);
});
