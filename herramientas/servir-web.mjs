// Sirve la app exportada para la web (dist/web) en http://localhost:4174.
// Uso: npm run web:exportar && npm run web:ver
// Es la forma de ver el cielo de Skia sin un iPhone: en la web, Skia es CanvasKit.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'web');
const puerto = Number(process.env.PORT) || 4174;
const tipos = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.wasm': 'application/wasm',
  '.png': 'image/png', '.ttf': 'font/ttf', '.css': 'text/css', '.ico': 'image/x-icon',
};

createServer(async (pedido, respuesta) => {
  const ruta = normalize(decodeURIComponent(new URL(pedido.url, 'http://x').pathname)).replace(/^[/\\]+/, '');
  let archivo = join(raiz, ruta || 'index.html');
  if (!archivo.startsWith(raiz)) { respuesta.writeHead(403).end(); return; }
  let cuerpo;
  try {
    cuerpo = await readFile(archivo);
  } catch {
    // Expo Router con salida "single": toda ruta que no es un archivo es la app.
    archivo = join(raiz, 'index.html');
    cuerpo = await readFile(archivo);
  }
  respuesta.writeHead(200, { 'Content-Type': tipos[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  respuesta.end(cuerpo);
}).listen(puerto, () => console.log(`App (web) en http://localhost:${puerto}`));
