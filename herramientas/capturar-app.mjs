// Capturas de la app de verdad (Skia en la web, con CanvasKit) a 393×852 @2×: inicio, un toque
// sobre una estrella, el día completo y tu universo. Es lo más cerca del iPhone que se puede
// llegar desde Windows; el rendimiento real se mide en el teléfono.
// Uso: npm run web:exportar && npm run web:ver   (en otra terminal)
//      npm run app:capturas

import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { encajar, proyectar } from '../src/cielo/mundo.ts';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const salida = process.argv[2] || 'capturas/app';
mkdirSync(salida, { recursive: true });

// Dónde cae cada estrella de la Lira, con la misma cuenta que src/cielo/plano.ts.
const ancho = 393, alto = 852;
const catalogo = JSON.parse(readFileSync(join(raiz, 'src/datos/constelaciones.json'), 'utf8'));
const lira = catalogo.constelaciones.find((c) => c.id === 'lyra');
const estrellas = encajar(proyectar(lira.estrellas), [0, 0.075], (ancho / alto) * 0.68, 0.4)
  .map(([x, y]) => [ancho / 2 + x * alto, alto / 2 - y * alto]);

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 2 });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push(String(e)));
await pagina.goto(process.env.APP_URL || 'http://localhost:4174/');
// CanvasKit pesa 8 MB y el cielo fijo se dibuja por software: hay que esperar.
await pagina.getByText(/cps ·/).waitFor({ timeout: 60000 });
await pagina.waitForTimeout(6000);

const foto = async (nombre) => {
  await pagina.screenshot({ path: join(salida, nombre + '.png') });
  console.log('·', nombre);
};
const panel = async (texto) => {
  await pagina.getByText(/cps ·/).click();
  await pagina.getByText(texto, { exact: true }).click();
  await pagina.getByText(/cps ·/).click();
};

await foto('inicio');
// Cambiar de calidad o de riqueza rehace la textura del cielo fijo, pero no la escena: el cielo
// no puede quedar negro ni volver a aparecer desde cero.
for (const [boton, nombre, espera] of [['baja', 'calidad-baja', 3000], ['alta', null, 3000], ['Cielo 0 %', 'riqueza-0', 4000], ['Cielo 100 %', 'riqueza-100', 4000], ['Cielo 60 %', null, 4000]]) {
  await panel(boton);
  await pagina.waitForTimeout(espera);
  if (nombre) await foto(nombre);
}
const [ex, ey] = estrellas[3]; // Escribir
await pagina.mouse.click(ex, ey);
await pagina.waitForTimeout(150);
await foto('toque');
await pagina.waitForTimeout(900);
await foto('toque-despues');
await panel('Completar el día');
for (const ms of [1500, 3500, 6000]) {
  await pagina.waitForTimeout(ms === 1500 ? 1500 : ms - (ms === 3500 ? 1500 : 3500));
  await foto('completo-' + ms);
}
await panel('Hoy / Universo');
await pagina.waitForTimeout(2500);
await foto('universo');

await navegador.close();
if (errores.length) {
  console.log('Errores en la consola:\n' + [...new Set(errores)].join('\n'));
  process.exit(1);
}
