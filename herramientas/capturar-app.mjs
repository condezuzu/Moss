// Capturas de la app de verdad (Skia en la web, con CanvasKit) a 393×852 @2×:
// - inicio, calidad baja y dos riquezas;
// - un toque sobre una estrella, y otra vez el cielo después de recargar (tiene que acordarse);
// - el día completo y tu universo.
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

await navegador.close();
if (errores.length) {
  console.log('Errores:\n' + [...new Set(errores)].join('\n'));
  process.exit(1);
}
