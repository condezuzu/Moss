// Capturas de la galería a resolución de iPhone (393×852 a 2×), en momentos fijos:
// es como se revisa el detalle fino sin depender del panel de vista previa.
// Uso: npm run galeria:capturas            (necesita npm run galeria:ver prendido)
//      node herramientas/capturar-galeria.mjs <carpeta> inicio deslizar comida registrar tocar…
// La galería abre en Inicio; los escenarios del cielo pasan primero a Hábitos y los de la comida,
// a Comida.
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
// Una sección de una: 0 Inicio, 1 Comida, 2 Progreso, 3 Sueño, 4 Hábitos y 5 Perfil.
const pestana = async (i) => {
  await pagina.evaluate((n) => window.__pagina(n, true), i);
  await pagina.waitForTimeout(300);
};
const alCielo = () => pestana(4);
const seccion = (nombre) => pagina.evaluate((n) => window.__seccion(n), nombre);
const enInicio = (accion, arg) => pagina.evaluate(([a, x]) => window.__inicio(a, x), [accion, arg]);
const mas = (accion, arg) => pagina.evaluate(([a, x]) => window.__mas(a, x), [accion, arg]);
const progreso = (accion, arg) => pagina.evaluate(([a, x]) => window.__progreso(a, x), [accion, arg]);
const sueno = (accion, arg) => pagina.evaluate(([a, x]) => window.__sueno(a, x), [accion, arg]);
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
  // Lo primero que se ve: Inicio, entero. Después, las otras cinco secciones.
  async inicio() {
    await foto('inicio');
    await enInicio('bajar');
    await pagina.waitForTimeout(400);
    await foto('inicio-abajo');
    await enInicio('subir');
    for (const [i, nombre, espera] of [[1, 'comida', 900], [2, 'progreso', 700], [3, 'sueno', 700], [4, 'habitos', 900], [5, 'perfil', 600]]) {
      await pestana(i);
      await pagina.waitForTimeout(espera);
      await foto(nombre);
    }
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
  // Las secciones con el dedo: de Sueño a Hábitos con la constelación asomando, un arrastre corto
  // que vuelve a su lugar, el nombre de abajo, y el borde de Perfil que cede.
  async deslizar() {
    await pestana(3);
    await arrastrar(330, 250, 430, 'deslizar-asoma');
    await pagina.waitForTimeout(700);
    await foto('deslizar-vuelve');
    await arrastrar(330, 110, 430, 'deslizar-mitad');
    await pagina.waitForTimeout(900);
    await foto('deslizar-habitos');
    await pagina.click('.pestanas .pt-perfil');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('deslizar-perfil');
    await arrastrar(330, 120, 430, 'deslizar-borde');
    await pagina.waitForTimeout(700);
    await pestana(0);
    await arrastrar(330, 160, 430, 'deslizar-inicio-comida');
    await pagina.waitForTimeout(700);
    await pestana(0);
  },
  // Progreso › Metas: cómo se reparten, keto (y cómo cambia Inicio), a mano y repartir la semana.
  async metas() {
    await pestana(2);
    await progreso('metas');
    await pagina.waitForTimeout(300);
    await foto('metas');
    await pagina.evaluate(() => window.__estrategia({ estilo: 'keto' }));
    await pagina.waitForTimeout(300);
    await foto('metas-keto');
    await pestana(0);
    await pagina.waitForTimeout(1400);
    await foto('inicio-keto');
    await pestana(2);
    await pagina.evaluate(() => window.__estrategia({ estilo: 'equilibrada' }));
    await progreso('repartir', true);
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => document.querySelector('.pg-scroll').scrollTo(0, 9999));
    await pagina.waitForTimeout(300);
    await foto('metas-semana');
    await progreso('quien', 'mano');
    await pagina.evaluate(() => document.querySelector('.pg-scroll').scrollTo(0, 0));
    await pagina.waitForTimeout(300);
    await foto('metas-a-mano');
    await progreso('quien', 'moss');
    await progreso('repartir', false);
    await progreso('principal');
    await pestana(0);
  },
  // El «+»: la hoja, un reciente de un toque, el peso, las medidas con su tutorial y la grasa, y la carga rápida.
  async mas() {
    await pestana(0);
    await mas('abrir');
    await pagina.waitForTimeout(900);
    await foto('mas');
    await mas('reciente');
    await pagina.waitForTimeout(500);
    await foto('mas-reciente');
    await mas('ir', 'peso');
    await pagina.waitForTimeout(500);
    await foto('mas-peso');
    await mas('ir', 'medidas');
    await pagina.waitForTimeout(500);
    await foto('mas-medidas');
    await mas('medir', ['cuello', 38]);
    await pagina.waitForTimeout(400);
    await foto('mas-medidas-cuello');
    await mas('medir', ['cintura', 84.5]);
    await mas('bajar');
    await pagina.waitForTimeout(400);
    await foto('mas-medidas-grasa');
    await mas('ir', 'rapida');
    await pagina.waitForTimeout(500);
    await foto('mas-rapida');
    await mas('cerrar');
    await pagina.waitForTimeout(700);
    await foto('mas-despues');
  },
  // Los macros: apagados mientras falta; la cena llega a la proteína y a los carbohidratos (brillan) y se pasa de grasas (tiembla).
  async macros() {
    await pestana(0);
    await pagina.waitForTimeout(400);
    await pagina.screenshot({ path: join(salida, 'macros-antes.png'), clip: { x: 0, y: 80, width: 393, height: 300 } });
    await seccion('cena');
    await pagina.waitForTimeout(1500);
    await foto('macros-cena');
    await pagina.screenshot({ path: join(salida, 'macros-cena-cerca.png'), clip: { x: 0, y: 80, width: 393, height: 300 } });
    await pestana(1);
    await pagina.waitForTimeout(1200);
    await foto('macros-comida');
  },
  // Personalizar Inicio: la hoja, sumar el sueño y el agua, y la constelación primero.
  async personalizar() {
    await pestana(0);
    await enInicio('personalizar');
    await pagina.waitForTimeout(800);
    await foto('personalizar');
    await enInicio('poner', ['sueno', true]);
    await enInicio('poner', ['agua', true]);
    await enInicio('mover', ['cielo', 0]);
    await pagina.waitForTimeout(400);
    await foto('personalizar-cambiado');
    await enInicio('cerrar');
    await pagina.waitForTimeout(700);
    await foto('inicio-personalizado');
    await enInicio('bajar');
    await pagina.waitForTimeout(400);
    await foto('inicio-personalizado-abajo');
    await enInicio('fabrica');
    await enInicio('subir');
  },
  // Progreso de arriba abajo, cómo se estima la grasa, la estrategia y el día del control.
  async progreso() {
    await pestana(2);
    await progreso('subir');
    await pagina.waitForTimeout(800);
    await foto('progreso');
    for (const [selector, nombre] of [['.pg-medidas', 'progreso-medidas'], ['.pg-gasto', 'progreso-gasto'], ['.pg-seccion', 'progreso-estrategia'], ['.pg-control', 'progreso-control']]) {
      await progreso('bajar', selector);
      await pagina.waitForTimeout(400);
      await foto(nombre);
    }
    await progreso('abrir', 'grasa');
    await progreso('bajar', '.pg-grasa');
    await pagina.waitForTimeout(400);
    await foto('progreso-grasa-como');
    await progreso('abrir', 'objetivo');
    await progreso('bajar', '.pg-seccion');
    await pagina.waitForTimeout(400);
    await foto('progreso-objetivo');
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 4 }));
    await progreso('abrir', null);
    await progreso('bajar', '.pg-control');
    await pagina.waitForTimeout(400);
    await foto('progreso-jueves');
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 1 }));
    await progreso('subir');
  },
  // Sueño: anoche de arriba abajo, cómo sale la calidad, y las noches que faltan o se cortaron.
  async sueno() {
    await pestana(3);
    await sueno('noche', 0);
    await pagina.waitForTimeout(800);
    await foto('sueno');
    for (const [selector, nombre] of [['.sn-calidad', 'sueno-calidad'], ['.sn-horario', 'sueno-horario'], ['.sn-deuda', 'sueno-deuda'], ['.sn-fuentes', 'sueno-fuentes']]) {
      await sueno('bajar', selector);
      await pagina.waitForTimeout(400);
      await foto(nombre);
    }
    await sueno('abrir', 'calidad');
    await sueno('bajar', '.sn-calidad');
    await pagina.waitForTimeout(400);
    await foto('sueno-calidad-como');
    await sueno('abrir', null);
    for (const [clave, nombre] of [['2026-10-17', 'sueno-sin-reloj'], ['2026-10-10', 'sueno-sin-nada'], ['2026-10-04', 'sueno-cortada'], ['2026-10-18', 'sueno-siesta']]) {
      await sueno('noche', clave);
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await sueno('noche', 0);
  },
  // Comida: el día con su línea, la semana, el mes, ayer y mañana.
  async comida() {
    await pestana(1);
    await pagina.waitForTimeout(1200);
    await foto('comida-zona');
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(900);
    await foto('comida-linea');
    // El cuadro con el dedo: a la izquierda, la semana (la foto con el dedo abajo), y otra vez, el mes.
    await pagina.evaluate(() => document.querySelector('.cm-scroll').scrollTo(0, 0));
    await pagina.waitForTimeout(400);
    await arrastrar(330, 150, 330, 'comida-cuadro-desliza');
    await pagina.waitForTimeout(900);
    await foto('comida-semana');
    await arrastrar(330, 150, 330);
    await pagina.waitForTimeout(900);
    await foto('comida-mes');
    await arrastrar(60, 360, 330);
    await pagina.waitForTimeout(900);
    await foto('comida-mes-vuelve');
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
    await pestana(1);
    await comida('registrar');
    await pagina.waitForTimeout(1000);
    await foto('registrar');
    for (const [texto, nombre] of [['frutila', 'frutila'], ['palta', 'palta'], ['manzaan', 'manzaan'], ['chivito', 'chivito']]) {
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
  // La etiqueta: lo leído para revisar, guardado y sumado, encontrable después, y el aviso de 4/4/9.
  async etiqueta() {
    await pestana(1);
    await comida('registrar');
    await pagina.waitForTimeout(600);
    await comida('etiqueta');
    await pagina.waitForTimeout(700);
    await foto('etiqueta');
    await pagina.fill('.hj-etiqueta input[data-clave="nombre"]', 'Galletitas María');
    await pagina.click('.hj-etiqueta .fi-agregar');
    await pagina.waitForTimeout(700);
    await foto('etiqueta-sumada');
    await comida('escribir', 'galle');
    await pagina.waitForTimeout(300);
    await foto('etiqueta-encontrada');
    await comida('escribir', '');
    await comida('etiqueta', true);
    await pagina.waitForTimeout(700);
    await foto('etiqueta-no-cierra');
    await comida('cerrar');
    await pagina.waitForTimeout(600);
  },
  async 'comida-ingles'() {
    await pagina.evaluate(() => window.__idioma('en'));
    await pestana(0);
    await pagina.waitForTimeout(900);
    await foto('inicio-ingles');
    await pestana(1);
    await comida('dia', 0);
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
