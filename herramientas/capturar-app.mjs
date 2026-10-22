// Capturas de la app de verdad (Skia en la web, con CanvasKit) a 393×852 @2×:
// - inicio, calidad baja y dos riquezas;
// - un toque sobre una estrella, y otra vez el cielo después de recargar (tiene que acordarse);
// - el día completo y tu universo;
// - las secciones: Ascent desde el cielo (y no desde la barra), la flecha, las pestañas y el «+».
// Es lo más cerca del iPhone que se puede llegar desde Windows; el rendimiento real se mide en el
// teléfono. Cada corrida arranca de cero: el navegador es nuevo y los hábitos de ejemplo también.
// Uso: npm run web:exportar && npm run web:ver   (en otra terminal)
//      npm run app:capturas

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const salida = process.argv[2] || 'capturas/app';
mkdirSync(salida, { recursive: true });

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pagina = await navegador.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, locale: 'es-UY' });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push(String(e)));

// CanvasKit pesa 8 MB y el cielo fijo se dibuja por software: hay que esperar.
async function abrir() {
  await pagina.goto(process.env.APP_URL || 'http://localhost:4174/');
  await pagina.getByText(/cps ·/).waitFor({ timeout: 60000 });
  await pagina.waitForTimeout(6000);
  // Dónde quedó cada estrella del día (Cielo.tsx lo deja a mano en la web).
  return pagina.evaluate(() => globalThis.__cielo);
}

const foto = async (nombre) => {
  await pagina.screenshot({ path: join(salida, nombre + '.png') });
  console.log('·', nombre);
};
const panel = async (texto) => {
  await pagina.getByText(/cps ·/).click();
  await pagina.getByText(texto, { exact: true }).click();
  await pagina.getByText(/cps ·/).click();
};
const cuenta = () => pagina.getByText(/de \d+ encendidas|DÍA COMPLETO/i).first().textContent();

const cielo = await abrir();
await foto('inicio');
// Cambiar de calidad o de riqueza rehace la textura del cielo fijo, pero no la escena: el cielo
// no puede quedar negro ni volver a aparecer desde cero.
for (const [boton, nombre, espera] of [['baja', 'calidad-baja', 3000], ['alta', null, 3000], ['Cielo 0 %', 'riqueza-0', 4000], ['Cielo 100 %', 'riqueza-100', 4000], ['Cielo 60 %', null, 4000]]) {
  await panel(boton);
  await pagina.waitForTimeout(espera);
  if (nombre) await foto(nombre);
}

// El primer hábito a mano del día.
const indice = cielo.habitos.findIndex((h) => !h.auto);
const [ex, ey] = cielo.estrellas[indice];
const antes = await cuenta();
await pagina.mouse.click(ex, ey);
await pagina.waitForTimeout(150);
await foto('toque');
await pagina.waitForTimeout(900);
await foto('toque-despues');
const despues = await cuenta();

// Local primero: después de recargar, lo encendido sigue encendido.
await abrir();
await foto('recordado');
const recordado = await cuenta();
console.log(`  ${cielo.habitos[indice].nombre}: «${antes}» → «${despues}» → al recargar «${recordado}»`);
if (recordado !== despues) errores.push(`Al recargar no se acordó: «${despues}» pasó a «${recordado}»`);

await panel('Completar el día');
for (const ms of [1500, 3500, 6000]) {
  await pagina.waitForTimeout(ms === 1500 ? 1500 : ms - (ms === 3500 ? 1500 : 3500));
  await foto('completo-' + ms);
}
await panel('Hoy / Universo');
await pagina.waitForTimeout(2500);
await foto('universo');

// Las secciones (cambios 9 y 10): Ascent sube con el dedo desde el cielo, pero no desde la barra;
// la flecha de arriba la baja y la tenue de abajo la sube; la tira de pestañas y el «+».
await abrir();
const { width: an, height: al } = pagina.viewportSize();
const arrastrar = async (desde, hasta, nombre) => {
  await pagina.mouse.move(desde[0], desde[1]);
  await pagina.mouse.down();
  await pagina.mouse.move(hasta[0], hasta[1], { steps: 14 });
  await pagina.waitForTimeout(400);
  if (nombre) await foto(nombre);
  await pagina.mouse.up();
  await pagina.waitForTimeout(1200);
};
// En el borde de la barra, donde no hay botón: soltar sobre un botón lo tocaría.
await arrastrar([3, al - 30], [3, al - 330], 'ascent-desde-la-barra');
await arrastrar([an / 2, al - 220], [an / 2, al - 520], 'ascent-subiendo');
await foto('ascent');
await pagina.getByLabel('Volver al cielo').click();
await pagina.waitForTimeout(1200);
await foto('ascent-bajada');
await pagina.mouse.click(an / 2, al - 58 - 24);
await pagina.waitForTimeout(1200);
await foto('ascent-por-la-flecha');
await pagina.getByLabel('Volver al cielo').click();
await pagina.waitForTimeout(1200);
await arrastrar([an - 40, 420], [an - 200, 430], 'pestanas-deslizando');
await foto('perfil');
await pagina.getByRole('tab', { name: 'Inicio' }).click();
await pagina.waitForTimeout(900);
await foto('inicio-pendiente');
await pagina.getByLabel('Agregar', { exact: true }).click();
await pagina.waitForTimeout(900);
await foto('mas');
await pagina.getByLabel('Sumar un vaso de 250 ml').click();
await pagina.waitForTimeout(500);
await foto('mas-agua');

await navegador.close();
if (errores.length) {
  console.log('Errores:\n' + [...new Set(errores)].join('\n'));
  process.exit(1);
}
