// Capturas de la galería a resolución de iPhone (393×852 a 2×), en momentos fijos:
// es como se revisa el detalle fino sin depender del panel de vista previa.
// Uso: npm run galeria:capturas            (necesita npm run galeria:ver prendido)
//      node herramientas/capturar-galeria.mjs <carpeta> inicio tocar completo universo ingles baja
// La aurora y el cielo se dibujan por software (SwiftShader): los tiempos de la animación van
// más lentos que en un teléfono, pero cada cuadro es el mismo.

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const salida = process.argv[2] || 'capturas/galeria';
const escenarios = process.argv.slice(3);
mkdirSync(salida, { recursive: true });

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pagina = await navegador.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2 });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push(String(e)));
await pagina.goto(process.env.GALERIA_URL || 'http://localhost:4173/');
// A pantalla completa, con los márgenes de un iPhone con isla: lo más parecido a la app.
await pagina.click('#b-inmersivo');
await pagina.addStyleTag({ content: '.barra-inmersiva{display:none!important} .tel.inmersivo{--arriba:58px!important;--abajo:28px!important}' });
await pagina.waitForTimeout(3500);

const foto = async (nombre) => {
  await pagina.screenshot({ path: join(salida, nombre + '.png') });
  console.log('·', nombre);
};

const pasos = {
  inicio: () => foto('inicio'),
  async tocar() {
    await pagina.evaluate(() => window.__tocar('Escribir'));
    await pagina.waitForTimeout(90);
    await foto('toque-90ms');
    await pagina.waitForTimeout(600);
    await foto('toque-700ms');
  },
  async completo() {
    await pagina.evaluate(() => window.__accion('completar'));
    let t = 0;
    for (const ms of [400, 1100, 1800, 2600, 3600, 5000]) {
      await pagina.waitForTimeout(ms - t);
      t = ms;
      await foto('completo-' + ms);
    }
  },
  async universo() {
    await pagina.evaluate(() => window.__accion('zona'));
    await pagina.waitForTimeout(1800);
    await foto('universo');
    await pagina.evaluate(() => window.__accion('zona'));
    await pagina.waitForTimeout(1500);
  },
  async ingles() {
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(400);
    await foto('ingles');
    await pagina.evaluate(() => window.__idioma('es'));
  },
  async baja() {
    await pagina.evaluate(() => window.__calidad('baja'));
    await pagina.waitForTimeout(2500);
    await foto('calidad-baja');
    await pagina.evaluate(() => window.__calidad('alta'));
    await pagina.waitForTimeout(2500);
  },
  async riqueza() {
    for (const r of [0, 1, 0.6]) {
      await pagina.evaluate((v) => window.__riqueza(v), r);
      await pagina.waitForTimeout(3500);
      if (r !== 0.6) await foto('riqueza-' + Math.round(r * 100));
    }
  },
  async fugaz() {
    await pagina.evaluate(() => window.__accion('fugaz'));
    for (const ms of [150, 350, 600, 900]) {
      await pagina.waitForTimeout(ms === 150 ? 150 : 200);
      await foto('fugaz-' + ms);
    }
  },
  async entrada() {
    await pagina.evaluate(() => window.__accion('entrada'));
    await pagina.waitForTimeout(900);
    await foto('entrada-frase-0900');
    await pagina.waitForTimeout(2200);
    await foto('entrada-frase-3100');
    for (const [paso, esperas] of [['habitos', [900, 2600]], ['comida', [1100, 2800]], ['cuenta', [2400]], ['salud', [1400]], ['edad', [900]], ['sexo', [900]], ['peso', [900]], ['actividad', [900]], ['objetivo', [900]], ['resultado', [2600]]]) {
      await pagina.evaluate((p) => window.__entrada(p), paso);
      let t = 0;
      for (const ms of esperas) {
        await pagina.waitForTimeout(ms - t);
        t = ms;
        await foto(`entrada-${paso}-${ms}`);
      }
    }
    // Empezar: el flum hasta el cielo de hoy.
    await pagina.click('.ent-resultado .ent-principal');
    for (const ms of [200, 420, 520, 750, 1400]) {
      await pagina.waitForTimeout(ms === 200 ? 200 : ms - [200, 420, 520, 750, 1400][[200, 420, 520, 750, 1400].indexOf(ms) - 1]);
      await foto('entrada-fin-' + ms);
    }
  },
  async flum() {
    // En cámara lenta: por software cada cuadro tarda, y a velocidad real el salto ya terminó
    // antes de la primera foto. Se saca una cada 600 ms hasta que llega.
    await pagina.evaluate(() => window.__velocidad(0.3));
    for (const [sentido, accion] of [['ida', 'ajustes'], ['vuelta', 'ajustes']]) {
      await pagina.evaluate((a) => window.__accion(a), accion);
      for (let i = 1; i <= 10; i++) {
        await pagina.waitForTimeout(600);
        await foto(`flum-${sentido}-${String(i).padStart(2, '0')}`);
      }
    }
    await pagina.evaluate(() => window.__velocidad(1));
  },
};

for (const e of escenarios.length ? escenarios : ['inicio', 'tocar', 'completo', 'universo']) {
  if (!pasos[e]) throw new Error('No conozco el escenario ' + e);
  await pasos[e]();
}
await navegador.close();
if (errores.length) {
  console.log('Errores en la consola:\n' + errores.join('\n'));
  process.exit(1);
}
