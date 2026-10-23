// Lee las hojas de un .xlsx sin paquetes: el .xlsx es un zip de XML. Lo usan los lectores de las
// tablas de composición (spec/fuentes.md). Solo lo que traen esas tablas: sin ZIP64 ni cifrado.

import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';

/** Los archivos de un zip, por su ruta completa (en un .xlsx se repiten los nombres sueltos). */
export function leerZip(ruta) {
  const zip = readFileSync(ruta);
  const fin = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (fin < 0) throw new Error(`${ruta}: no es un zip`);
  const cantidad = zip.readUInt16LE(fin + 10);
  let p = zip.readUInt32LE(fin + 16);
  const archivos = new Map();
  for (let i = 0; i < cantidad; i++) {
    const metodo = zip.readUInt16LE(p + 10);
    const comprimido = zip.readUInt32LE(p + 20);
    const largoNombre = zip.readUInt16LE(p + 28);
    const extra = zip.readUInt16LE(p + 30);
    const comentario = zip.readUInt16LE(p + 32);
    const local = zip.readUInt32LE(p + 42);
    const nombre = zip.toString('utf8', p + 46, p + 46 + largoNombre);
    const datos = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const crudo = zip.subarray(datos, datos + comprimido);
    if (!nombre.endsWith('/')) archivos.set(nombre, metodo === 8 ? inflateRawSync(crudo) : crudo);
    p += 46 + largoNombre + extra + comentario;
  }
  return archivos;
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
export const desescapar = (texto) => texto.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (todo, e) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTIDADES[e] ?? todo));

/** El texto de un <si> o de un <is>: un <t> solo o varios tramos <r><t>. */
const textoDe = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>|<t(?:\s[^>]*)?\/>/g)].map((m) => desescapar(m[1] ?? '')).join('');

/** «AB12» → 27 (la columna, desde 0). */
const columna = (ref) => [...ref.replace(/\d+$/, '')].reduce((n, letra) => n * 26 + letra.charCodeAt(0) - 64, 0) - 1;

/**
 * Las hojas de un .xlsx: Map de nombre de hoja → filas, cada fila un arreglo de celdas (texto o
 * número; lo vacío, undefined). `soloHojas` lee solo las que se piden.
 */
export function leerXlsx(ruta, soloHojas = null) {
  const archivos = leerZip(ruta);
  const leer = (nombre) => archivos.get(nombre)?.toString('utf8');
  const compartidos = [...(leer('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textoDe(m[1]));
  const relaciones = new Map([...(leer('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship\b[^>]*>/g)].map(([r]) => [r.match(/Id="([^"]+)"/)[1], r.match(/Target="([^"]+)"/)[1]]));
  const hojas = new Map();
  for (const [etiqueta] of leer('xl/workbook.xml').matchAll(/<sheet\b[^>]*>/g)) {
    const nombre = desescapar(etiqueta.match(/name="([^"]*)"/)[1]);
    if (soloHojas && !soloHojas.includes(nombre)) continue;
    const destino = relaciones.get(etiqueta.match(/r:id="([^"]+)"/)[1]).replace(/^\/?(xl\/)?/, 'xl/');
    const filas = [];
    for (const [, numero, contenido] of leer(destino).matchAll(/<row\b[^>]*?\br="(\d+)"[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const fila = [];
      for (const [, atributos, cuerpo = ''] of (contenido ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = atributos.match(/\br="([A-Z]+\d+)"/)[1];
        const tipo = atributos.match(/\bt="(\w+)"/)?.[1];
        const v = cuerpo.match(/<v>([\s\S]*?)<\/v>/)?.[1];
        let valor;
        if (tipo === 's') valor = compartidos[Number(v)];
        else if (tipo === 'inlineStr') valor = textoDe(cuerpo);
        else if (tipo === 'str' || tipo === 'e') valor = v === undefined ? undefined : desescapar(v);
        else if (tipo === 'b') valor = v === '1';
        else valor = v === undefined ? undefined : Number(v);
        fila[columna(ref)] = valor;
      }
      filas[Number(numero) - 1] = fila;
    }
    hojas.set(nombre, Array.from(filas, (f) => f ?? []));
  }
  return hojas;
}
