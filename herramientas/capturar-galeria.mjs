// Capturas de la galería a resolución de iPhone (393×852 a 2×), en momentos fijos:
// es como se revisa el detalle fino sin depender del panel de vista previa.
// Uso: npm run galeria:capturas            (necesita npm run galeria:ver prendido)
//      node herramientas/capturar-galeria.mjs <carpeta> inicio deslizar comida registrar tocar…
// La galería abre en Inicio, la comida; los escenarios del cielo pasan primero a Hábitos.
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
// El mouse, afuera: si no, lo que quede abajo de él se ve como si se estuviera por tocar.
await pagina.mouse.move(1, 1);
await pagina.addStyleTag({ content: '.barra-inmersiva{display:none!important} .tel.inmersivo{--arriba:58px!important;--abajo:28px!important}' });
await pagina.waitForTimeout(3500);

const foto = async (nombre) => {
  await pagina.screenshot({ path: join(salida, nombre + '.png') });
  console.log('·', nombre);
};
const comida = (accion, arg) => pagina.evaluate(([a, x]) => window.__comida(a, x), [accion, arg]);
// Una pestaña de una (0 Inicio, 1 Hábitos, 2 Ajustes).
const pestana = async (i) => {
  await pagina.evaluate((n) => window.__pagina(n, true), i);
  await pagina.waitForTimeout(300);
};
const alCielo = () => pestana(1);
// Un arrastre de costado con el mouse, como un dedo: se saca la foto con el dedo todavía abajo.
async function arrastrar(desde, hasta, y, nombre) {
  await pagina.mouse.move(desde, y);
  await pagina.mouse.down();
  await pagina.mouse.move(hasta, y, { steps: 10 });
  await pagina.waitForTimeout(500);
  if (nombre) await foto(nombre);
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
}

const pasos = {
  // Lo primero que se ve: Inicio. Después, las otras dos pestañas.
  async inicio() {
    await foto('inicio');
    await alCielo();
    await pagina.waitForTimeout(900);
    await foto('habitos');
    await pestana(2);
    await pagina.waitForTimeout(600);
    await foto('ajustes');
    await pestana(0);
  },
  async tocar() {
    await alCielo();
    await pagina.evaluate(() => window.__tocar('Escribir'));
    await pagina.waitForTimeout(90);
    await foto('toque-90ms');
    await pagina.waitForTimeout(600);
    await foto('toque-700ms');
  },
  async completo() {
    await alCielo();
    await pagina.evaluate(() => window.__accion('completar'));
    let t = 0;
    for (const ms of [400, 1100, 1800, 2600, 3600, 5000]) {
      await pagina.waitForTimeout(ms - t);
      t = ms;
      await foto('completo-' + ms);
    }
  },
  async universo() {
    await alCielo();
    await pagina.evaluate(() => window.__accion('zona'));
    await pagina.waitForTimeout(1800);
    await foto('universo');
    await pagina.evaluate(() => window.__accion('zona'));
    await pagina.waitForTimeout(1500);
  },
  async ingles() {
    await alCielo();
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(400);
    await foto('ingles');
    await pagina.evaluate(() => window.__idioma('es'));
  },
  async baja() {
    await alCielo();
    await pagina.evaluate(() => window.__calidad('baja'));
    await pagina.waitForTimeout(2500);
    await foto('calidad-baja');
    await pagina.evaluate(() => window.__calidad('alta'));
    await pagina.waitForTimeout(2500);
  },
  async riqueza() {
    await alCielo();
    for (const r of [0, 1, 0.6]) {
      await pagina.evaluate((v) => window.__riqueza(v), r);
      await pagina.waitForTimeout(3500);
      if (r !== 0.6) await foto('riqueza-' + Math.round(r * 100));
    }
    // La vía láctea: apagada y entera, para comparar con el 30 % de siempre.
    for (const v of [0, 1, 0.3]) {
      await pagina.evaluate((x) => window.__via(x), v);
      await pagina.waitForTimeout(3500);
      if (v !== 0.3) await foto('via-' + Math.round(v * 100));
    }
  },
  async fugaz() {
    await alCielo();
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
    // Empezar: el flum hasta Inicio.
    await pagina.click('.ent-resultado .ent-principal');
    for (const ms of [200, 420, 520, 750, 1400]) {
      await pagina.waitForTimeout(ms === 200 ? 200 : ms - [200, 420, 520, 750, 1400][[200, 420, 520, 750, 1400].indexOf(ms) - 1]);
      await foto('entrada-fin-' + ms);
    }
  },
  // Las pestañas con el dedo: de Inicio a Hábitos con la constelación asomando, un arrastre corto
  // que vuelve a su lugar, el nombre de abajo y el borde que cede.
  async deslizar() {
    await pestana(0);
    await arrastrar(330, 250, 430, 'deslizar-asoma');
    await pagina.waitForTimeout(700);
    await foto('deslizar-vuelve');
    await arrastrar(330, 110, 430, 'deslizar-mitad');
    await pagina.waitForTimeout(900);
    await foto('deslizar-habitos');
    await pagina.click('.pestanas button:nth-child(3)');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('deslizar-ajustes');
    await arrastrar(330, 120, 430, 'deslizar-borde');
    await pagina.waitForTimeout(700);
    await arrastrar(120, 330, 430, 'deslizar-desde-ajustes');
    await pagina.waitForTimeout(700);
    await pestana(0);
  },
  // Inicio: el día con su línea, la semana, el mes, ayer y mañana.
  async comida() {
    await pestana(0);
    await pagina.waitForTimeout(1200);
    await foto('comida-zona');
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(900);
    await foto('comida-linea');
    await comida('vista', 'semana');
    await pagina.waitForTimeout(1100);
    await foto('comida-semana');
    await comida('bajar', 'semana');
    await pagina.waitForTimeout(900);
    await foto('comida-semana-peso');
    await comida('vista', 'mes');
    await pagina.waitForTimeout(1100);
    await foto('comida-mes');
    await comida('dia', -1);
    await pagina.waitForTimeout(1600);
    await foto('comida-ayer');
    await comida('dia', 1);
    await pagina.waitForTimeout(400);
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(1400);
    await foto('comida-manana');
    await comida('dia', 0);
    await pagina.waitForTimeout(500);
    // Copiar de ayer abre la revisión con la cena de ayer; «Agregar a la cena» la registra.
    await comida('copiar', 'cena');
    await pagina.waitForTimeout(900);
    await foto('comida-copiar-revision');
    await comida('confirmar');
    await pagina.waitForTimeout(600);
    await comida('bajar', 'ahora');
    await pagina.waitForTimeout(1300);
    await foto('comida-copiada');
  },
  // La hoja de registro: lo de siempre, la búsqueda, la ventana, la revisión y la carga rápida.
  async registrar() {
    await pestana(0);
    await comida('registrar');
    await pagina.waitForTimeout(1000);
    await foto('registrar');
    for (const [texto, nombre] of [['frutila', 'frutila'], ['palta', 'palta'], ['manzaan', 'manzaan']]) {
      await comida('escribir', texto);
      await pagina.waitForTimeout(250);
      await foto('registrar-' + nombre);
    }
    await comida('escribir', '');
    // Lo de siempre: el «+» abre la ventana, «Sumar» lo pone en la cena que se arma.
    await comida('agregar');
    await pagina.waitForTimeout(700);
    await foto('registrar-ventana');
    await comida('sumar');
    await pagina.waitForTimeout(500);
    await foto('registrar-sumado');
    await comida('ficha', 'Banana');
    await pagina.waitForTimeout(700);
    await foto('registrar-banana');
    await comida('sumar');
    await pagina.waitForTimeout(400);
    // «Listo» abre la revisión, y «Agregar a la cena» registra todo junto.
    await comida('listo');
    await pagina.waitForTimeout(700);
    await foto('registrar-revision');
    await comida('confirmar');
    await pagina.waitForTimeout(1600);
    await foto('registrar-agregado');
    await comida('registrar');
    await pagina.waitForTimeout(600);
    await comida('rapida');
    await pagina.waitForTimeout(700);
    await foto('registrar-rapida');
    await comida('cerrar');
    await pagina.waitForTimeout(1600);
    await foto('registrar-despues');
  },
  async 'comida-ingles'() {
    await pagina.evaluate(() => window.__idioma('en'));
    await pestana(0);
    await pagina.waitForTimeout(1200);
    await foto('comida-ingles');
    await comida('registrar');
    await pagina.waitForTimeout(900);
    await comida('escribir', 'chick');
    await pagina.waitForTimeout(250);
    await foto('registrar-ingles');
    await comida('cerrar');
    await pagina.waitForTimeout(600);
    await pagina.evaluate(() => window.__idioma('es'));
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
