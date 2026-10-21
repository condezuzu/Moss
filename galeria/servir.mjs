// Sirve galeria/dist en http://localhost:4173 para mirarla antes de publicarla.
// Uso: node galeria/servir.mjs   (rearmá con node galeria/construir.mjs y recargá)

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), 'dist');
const puerto = Number(process.env.PORT) || 4173;
const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png' };

// El artifact real se ve sin el esqueleto: acá se le agrega uno mínimo para que el navegador
// lo trate igual (viewport con cover y el padding de las zonas seguras).
const envolver = (html) => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}</style></head><body>${html}</body></html>`;

createServer(async (pedido, respuesta) => {
  const ruta = normalize(decodeURIComponent(new URL(pedido.url, 'http://x').pathname)).replace(/^[/\\]+/, '');
  const archivo = join(dist, ruta || 'index.html');
  if (!archivo.startsWith(dist)) { respuesta.writeHead(403).end(); return; }
  try {
    let cuerpo = await readFile(archivo);
    const ext = archivo.slice(archivo.lastIndexOf('.'));
    if (ext === '.html') cuerpo = envolver(cuerpo.toString('utf8'));
    respuesta.writeHead(200, { 'Content-Type': tipos[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    respuesta.end(cuerpo);
  } catch {
    respuesta.writeHead(404).end('No está');
  }
}).listen(puerto, () => console.log(`Galería en http://localhost:${puerto}`));
