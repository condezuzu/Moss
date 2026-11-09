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
const ascent = (accion, arg) => pagina.evaluate(([a, x]) => window.__ascent(a, x), [accion, arg]);
const habitos = (accion, arg) => pagina.evaluate(([a, x]) => window.__habitos(a, x), [accion, arg]);
// Lo que depende de los cuadros del cielo (el flum, las etiquetas de las estrellas) puede atrasarse
// varios segundos con el render por software: se espera a que pase en lugar de un tiempo fijo.
const esperarA = (condicion, arg) => pagina.waitForFunction(condicion, arg, { polling: 200, timeout: 30000 });
const etiquetasUbicadas = () => esperarA(() => [...document.querySelectorAll('.etiquetas .etq')].every((e) => e.style.transform));
const hojaAbierta = (clase) => esperarA((c) => {
  const h = document.querySelector('.' + c);
  return !!h && !h.hidden && !h.classList.contains('saliendo') && h.getAnimations().every((a) => a.playState !== 'running');
}, clase);
// Lo que se elige en el panel de Ascent de la galería: cómo está Ascent en este iPhone (abre la hoja
// de vincular) y qué contesta el servidor al vincular.
const elegirEn = (id, valor) => pagina.evaluate(([i, v]) => document.querySelector(`#${i} [data-valor="${v}"]`).click(), [id, valor]);
/** La hoja de vincular en cada estado, un error y entrar con la cuenta de Ascent; queda cerrada. */
async function hojaDeVincular(sufijo = '') {
  const estados = sufijo ? [['sesion', 'ascent-hoja']] : [['sesion', 'ascent-hoja'], ['sinSesion', 'ascent-hoja-sin-sesion'], ['sinAscent', 'ascent-hoja-sin-ascent'], ['sinCuenta', 'ascent-hoja-sin-cuenta']];
  for (const [estado, nombre] of estados) {
    await elegirEn('s-iphone', estado);
    await hojaAbierta('as-hoja');
    await pagina.waitForTimeout(300);
    await foto(nombre + sufijo);
  }
  if (!sufijo) {
    await elegirEn('s-iphone', 'sesion');
    await elegirEn('s-servidor', 'red');
    await pagina.click('.as-hoja-vincular');
    await pagina.waitForTimeout(1300);
    await foto('ascent-hoja-error');
    await elegirEn('s-servidor', 'credenciales');
    await pagina.click('.as-hoja-con-correo');
    await pagina.waitForTimeout(600);
    await pagina.fill('.as-hoja-form input[type=email]', 'agustin@ejemplo.com');
    await pagina.fill('.as-hoja-form input[type=password]', 'una contraseña');
    await pagina.click('.as-hoja-entrar');
    await pagina.waitForTimeout(1300);
    await foto('ascent-hoja-correo');
    await elegirEn('s-servidor', 'bien');
  }
  await pagina.click('.as-hoja .hb-cerrar');
  await pagina.waitForTimeout(600);
}
// Ascent, arriba de Progreso (spec/ascent.md): el scroll de Progreso, cada parte de la sección y los
// días de ejemplo (los siete: con las piernas cargadas también).
const bajarProgreso = (y) => pagina.evaluate((v) => { const s = document.querySelector('.pg-scroll'); s.scrollTop = v === 'fondo' ? s.scrollHeight : v; }, y);
const DIAS_DE_ASCENT = ['corta', 'bien', 'cargado', 'entreno', 'descanso', 'sinSueno', 'sinCalidad'];
const PARTES_DE_ASCENT = [
  ['.as-foco', 'foco'], ['.as-filas', 'filas'], ['.as-fila-comida', 'filas-2'], ['.as-musculos', 'musculos'], ['.as-semana', 'musculos-2'], ['.as-fuerza', 'fuerza'],
  ['.as-marcas', 'marcas'], ['.as-estanc', 'estancamiento'], ['.as-estanc-ej:last-of-type', 'estancamiento-2'], ['.as-anio', 'anio'], ['.as-comparten', 'comparten'],
];
async function diasDeAscent(sufijo = '') {
  for (const d of DIAS_DE_ASCENT) {
    await ascent('dia', d);
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(900);
    await foto(`ascent-dia-${d}${sufijo}`);
    await ascent('bajar', '.as-filas');
    await pagina.waitForTimeout(400);
    await foto(`ascent-dia-${d}-2${sufijo}`);
  }
  await ascent('dia', 'corta');
}
async function partesDeAscent(sufijo = '') {
  for (const [selector, nombre] of PARTES_DE_ASCENT) {
    await ascent('bajar', selector);
    await pagina.waitForTimeout(400);
    await foto(`ascent-parte-${nombre}${sufijo}`);
  }
  await ascent('bajar', 'fondo');
}
// Un arrastre con el mouse, como un dedo; con nombre, saca la foto con el dedo todavía abajo.
async function arrastreVertical(x0, y0, x1, y1, nombre) {
  await pagina.mouse.move(x0, y0);
  await pagina.mouse.down();
  await pagina.mouse.move(x1, y1, { steps: 12 });
  await pagina.waitForTimeout(400);
  if (nombre) await foto(nombre);
  await pagina.mouse.up();
  await pagina.mouse.move(1, 1);
  await pagina.waitForTimeout(900);
}
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
    // Para hoy en otros momentos del día (2/11): al mediodía sin el almuerzo, a la tarde con mucha
    // proteína, sin nada anotado y cuando va bien.
    for (const momento of ['mediodia', 'tarde', 'nada', 'bien']) {
      await pagina.evaluate((m) => window.__paraHoy(m), momento);
      await enInicio('bajar');
      await pagina.waitForTimeout(500);
      await foto('inicio-para-hoy-' + momento);
    }
    await pagina.evaluate(() => window.__paraHoy(null));
    // El control, cuando se acerca: mañana, debajo de la luna.
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 4 }));
    await enInicio('subir');
    await pagina.waitForTimeout(600);
    await foto('inicio-control');
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 1 }));
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
    // La estrella guía: nace en el musgo, presenta la frase y espera abajo; si nadie la toca, abajo
    // dice «Toca la estrella». Tocarla es seguir. Después, la introducción, y «Saltar» lleva a lo que cuesta.
    await pagina.evaluate(() => window.__accion('entrada'));
    await pagina.waitForTimeout(1200);
    await foto('entrada-frase-1200');
    await pagina.waitForTimeout(2600);
    await foto('entrada-frase-3800');
    await pagina.waitForTimeout(3200);
    await foto('entrada-frase-pista');
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    for (const [paso, esperas] of [['comida', [1600, 4600]], ['base', [1600, 4600]], ['sueno', [1800, 4600]], ['juntos', [1500, 4200]], ['habitos', [1500, 4500]], ['precio', [1800, 4200]], ['datos', [1500]], ['cuenta', [2800]], ['salud', [1900]]]) {
      await pagina.evaluate((p) => window.__entrada(p), paso);
      let t = 0;
      for (const ms of esperas) {
        await pagina.waitForTimeout(ms - t);
        t = ms;
        await foto(`entrada-${paso}-${ms}`);
      }
    }
    // El cuestionario nuevo, tocando como una persona: conecta Salud (los cuatro datos van en una
    // tarjeta), elige su figura, quiere bajar y sigue hasta el resultado, con el plan en una línea.
    const tocarEnLaEntrada = (selector) => pagina.evaluate((s) => document.querySelector('.ent-pantalla:not(.saliendo) ' + s).click(), selector);
    const seguir = async (nombre, antes) => {
      // En «¿Alguno es tu caso?» el pie trae antes, plegado, el «Guardar» del consentimiento: se toca «Seguir».
      await tocarEnLaEntrada('.ent-pie .ent-principal:not(.ent-consentimiento *)');
      await pagina.waitForTimeout(1300);
      if (antes) { await antes(); await pagina.waitForTimeout(600); }
      await foto('entrada-' + nombre);
    };
    await seguir('tu');
    await seguir('cuidado');
    await seguir('grasa', async () => { await tocarEnLaEntrada('[data-valor="imagen"]'); await pagina.waitForTimeout(700); await tocarEnLaEntrada('.ent-figura[data-valor="3"]'); });
    await seguir('movimiento');
    await seguir('entreno');
    await seguir('cuando');
    await seguir('objetivo', () => tocarEnLaEntrada('[data-valor="bajar"]'));
    await seguir('meta');
    await seguir('despues');
    await seguir('comer');
    await seguir('dia');
    await tocarEnLaEntrada('.ent-pie .ent-principal');
    await pagina.waitForTimeout(2600);
    await foto('entrada-resultado-2600');
    // Después de la meta, la pantalla de pago; al empezar la prueba, el flum hasta Inicio, y ahí suben los primeros hábitos.
    await pagina.click('.ent-resultado .ent-principal');
    await pagina.waitForTimeout(700);
    await foto('entrada-pago');
    await pagina.evaluate(() => { window.__suscripcion('confirmarApple'); });
    await esperarA(() => !!document.querySelector('.sb-listo'));
    await pagina.waitForTimeout(600);
    await foto('entrada-pago-listo');
    await pagina.click('.sb-listo .sb-principal');
    for (const ms of [200, 420, 520, 750, 1400]) {
      await pagina.waitForTimeout(ms === 200 ? 200 : ms - [200, 420, 520, 750, 1400][[200, 420, 520, 750, 1400].indexOf(ms) - 1]);
      await foto('entrada-fin-' + ms);
    }
    // Esperar la hoja mientras todavía se saca una foto del flum no termina nunca: primero, que pase.
    await pagina.waitForTimeout(4000);
    await hojaAbierta('hh-hoja-sugeridos');
    await foto('entrada-fin-primeros');
    await habitos('cerrar');
    await pagina.waitForTimeout(500);
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
  // Las kcal en cada estilo (kcal.js): Inicio, el día y la semana de Comida, y pasada la meta.
  async kcal() {
    for (const estilo of ['anillo', 'arco', 'barra', 'luna']) {
      await pagina.evaluate((e) => window.__kcal(e), estilo);
      await pestana(0);
      await pagina.waitForTimeout(1400);
      await pagina.screenshot({ path: join(salida, `kcal-${estilo}-inicio.png`), clip: { x: 0, y: 80, width: 393, height: 340 } });
      await pestana(1);
      await pagina.waitForTimeout(1400);
      await pagina.screenshot({ path: join(salida, `kcal-${estilo}-comida.png`), clip: { x: 0, y: 40, width: 393, height: 400 } });
    }
    await seccion('cena');
    for (const estilo of ['anillo', 'arco', 'barra']) {
      await pagina.evaluate((e) => window.__kcal(e), estilo);
      await pestana(0);
      await pagina.waitForTimeout(1400);
      await pagina.screenshot({ path: join(salida, `kcal-${estilo}-pasada.png`), clip: { x: 0, y: 80, width: 393, height: 340 } });
    }
    await pagina.evaluate(() => window.__kcal('luna'));
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
    // Inicio ya no se va arriba solo al repintarse (6/11): la foto es de arriba, con el cielo primero.
    await enInicio('subir');
    await pagina.waitForTimeout(700);
    await foto('inicio-personalizado');
    await enInicio('bajar');
    await pagina.waitForTimeout(400);
    await foto('inicio-personalizado-abajo');
    await enInicio('fabrica');
    await enInicio('subir');
  },
  // Progreso de arriba abajo (2/11/2026): el control en una línea y abierto, el plan con su línea y
  // cambiarlo, el peso, la grasa (cómo se estima, y sin medidas, la invitación) y «Más datos» abierto.
  // Para aprobar (D1 del estudio de progreso): el ritmo con su margen y cómo se calcula, y las primeras
  // semanas: con diez días, faltan datos; con tres semanas, todavía no se sabe; con cuatro, el margen ancho.
  async progreso() {
    await pestana(2);
    await progreso('subir');
    await pagina.waitForTimeout(1400);
    await foto('progreso');
    await progreso('abrir', 'ritmo');
    await progreso('bajar', '.pg-plan');
    await pagina.waitForTimeout(500);
    await foto('progreso-ritmo-como');
    await progreso('abrir', null);
    for (const [semanas, nombre] of [[1.5, 'progreso-diez-dias'], [3, 'progreso-tres-semanas'], [4, 'progreso-cuatro-semanas']]) {
      await progreso('plazo', { datos: semanas });
      await progreso('subir');
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await progreso('plazo', { datos: null });
    await progreso('subir');
    await progreso('abrir', 'control');
    await pagina.waitForTimeout(500);
    await foto('progreso-control');
    await progreso('abrir', 'objetivo');
    await progreso('bajar', '.pg-plan-estrategia');
    await pagina.waitForTimeout(500);
    await foto('progreso-cambiar-plan');
    await progreso('abrir', null);
    await progreso('cambiarPlan', false);
    await progreso('bajar', '.pg-peso');
    await pagina.waitForTimeout(500);
    await foto('progreso-peso');
    await progreso('abrir', 'grasa');
    await progreso('bajar', '.pg-grasa');
    await pagina.waitForTimeout(500);
    await foto('progreso-grasa-como');
    await progreso('abrir', null);
    await progreso('sinMedidas', true);
    await progreso('bajar', '.pg-grasa');
    await pagina.waitForTimeout(500);
    await foto('progreso-grasa-invita');
    await progreso('sinMedidas', false);
    await progreso('masDatos', true);
    for (const [selector, nombre] of [['.pg-mas', 'progreso-mas-datos'], ['.pg-semanas', 'progreso-semanas'], ['.pg-medidas', 'progreso-medidas'], ['.pg-gasto', 'progreso-gasto']]) {
      await progreso('bajar', selector);
      await pagina.waitForTimeout(400);
      await foto(nombre);
    }
    await progreso('masDatos', false);
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 4 }));
    await progreso('subir');
    await progreso('abrir', 'control');
    await pagina.waitForTimeout(500);
    await foto('progreso-jueves');
    await progreso('abrir', null);
    await pagina.evaluate(() => window.__estrategia({ diaDelControl: 1 }));
    await progreso('subir');
  },
  // Cómo llegó a la hora: la pregunta con cada señal, y la noche de quien conectó y siguió usándolo.
  async senales() {
    await seccion('porque');
    await pagina.waitForTimeout(900);
    await foto('senales');
    await sueno('bajar', '.sn-porque-dentro');
    await pagina.waitForTimeout(400);
    await foto('senales-abajo');
    await sueno('subir');
  },
  // La guía del cargador: los dos caminos, paso a paso, y lo que ve en Afinar.
  async guia() {
    await seccion('guia27');
    await pagina.waitForTimeout(600);
    await foto('guia-presentacion');
    for (const [paso, extra, nombre] of [[0, {}, 'guia27-1'], [1, {}, 'guia27-2'], [2, { llave: true }, 'guia27-3'], [3, {}, 'guia27-probar'], [3, { llego: true }, 'guia27-llego']]) {
      await pagina.evaluate(([p, e]) => window.__guia(p, e), [paso, extra]);
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await seccion('guia26');
    await pagina.waitForTimeout(500);
    for (const [paso, nombre] of [[0, 'guia26-1'], [1, 'guia26-2'], [2, 'guia26-3'], [3, 'guia26-4'], [4, 'guia26-5']]) {
      await pagina.evaluate((p) => window.__guia(p, {}), paso);
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    for (const [accion, nombre] of [['cargadorSinArmar', 'cargador-sin-armar'], ['cargadorAnda', 'cargador-anda'], ['cargadorDejo', 'cargador-dejo'], ['cargadorMedias', 'cargador-medias']]) {
      await seccion(accion);
      await pagina.waitForTimeout(900);
      await foto(nombre);
    }
    await seccion('cargadorSinArmar');
  },
  // La suscripción: la pantalla de pago y cada estado, en español y en inglés, y Tu suscripción en Perfil.
  async suscripcion() {
    const sub = (accion, arg) => pagina.evaluate(([a, x]) => { window.__suscripcion(a, x); }, [accion, arg]);
    await seccion('suscripcion');
    await pagina.waitForTimeout(700);
    await foto('suscripcion');
    await sub('bajar');
    await pagina.waitForTimeout(300);
    await foto('suscripcion-abajo');
    await sub('plan', 'mensual');
    await pagina.waitForTimeout(350);
    await foto('suscripcion-mensual');
    await sub('plan', 'anual');
    await sub('apple');
    await pagina.waitForTimeout(500);
    await foto('suscripcion-apple');
    await sub('cancelarApple');
    await pagina.waitForTimeout(600);
    await foto('suscripcion-cancelada');
    await sub('restaurar');
    await pagina.waitForTimeout(400);
    await foto('suscripcion-nada-para-restaurar');
    await sub('cuenta');
    await pagina.waitForTimeout(450);
    await foto('suscripcion-tu-cuenta');
    await pagina.click('.sb-acciones-no');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(350);
    await sub('enCurso', true);
    await pagina.waitForTimeout(300);
    await foto('suscripcion-en-curso');
    await sub('enCurso', false);
    await sub('sinAvisos', true);
    await sub('confirmarApple');
    await esperarA(() => !!document.querySelector('.sb-listo'));
    await pagina.waitForTimeout(600);
    await foto('suscripcion-listo-sin-avisos');
    for (const [accion, nombre] of [['pagoSinConexion', 'suscripcion-sin-conexion'], ['pagoRestaurada', 'suscripcion-restaurada'], ['pagoRegalo', 'suscripcion-regalo'], ['pagoVencida', 'suscripcion-vencida'], ['pagoTermino', 'suscripcion-termino']]) {
      await seccion(accion);
      await pagina.waitForTimeout(600);
      await foto(nombre);
    }
    await sub('cerrar');
    await pagina.waitForTimeout(500);
    for (const [accion, nombre] of [['perfilPrueba', 'suscripcion-hoja-prueba'], ['perfilActiva', 'suscripcion-hoja-mensual'], ['perfilCancelada', 'suscripcion-hoja-cancelada'], ['perfilRegalo', 'suscripcion-hoja-regalo']]) {
      await seccion(accion);
      await pagina.waitForTimeout(700);
      await foto(nombre);
    }
    await sub('cerrarHoja');
    await pagina.waitForTimeout(500);
    await seccion('perfilPrueba');
    await sub('cerrarHoja');
    await pagina.waitForTimeout(500);
    await foto('suscripcion-perfil');
    await pagina.evaluate(() => window.__idioma('en'));
    await seccion('suscripcion');
    await pagina.waitForTimeout(700);
    await foto('suscripcion-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await sub('cerrar');
    await pagina.waitForTimeout(500);
    await seccion('metaConSuscripcion');
    await pagina.waitForTimeout(2500);
    await foto('suscripcion-meta');
    await pagina.evaluate(() => window.__entrada(null));
    await pagina.waitForTimeout(800);
  },
  // Tocar la luna: Todo lo de hoy, de arriba abajo, y cómo queda al pasarse.
  async todo() {
    await pestana(0);
    await enInicio('subir');
    await pagina.waitForTimeout(500);
    await pagina.click('.in-calorias');
    await hojaAbierta('in-todo');
    await foto('todo');
    // Cómo ver las calorías (2/11): los anillos de los macros, en la hoja y en Inicio.
    await pagina.click('.tt-estilo[data-estilo="macros"]');
    await pagina.waitForTimeout(700);
    await foto('todo-estilo-macros');
    await enInicio('cerrarTodo');
    await pagina.waitForTimeout(900);
    await foto('inicio-macros');
    await pagina.evaluate(() => window.__kcal('luna'));
    await pagina.waitForTimeout(400);
    await pagina.click('.in-calorias');
    await hojaAbierta('in-todo');
    for (const [selector, nombre] of [['.tt-sabe', 'todo-sabe'], ['.tt-falta', 'todo-falta'], ['.tt-como', 'todo-como'], ['.tt-pie', 'todo-pie']]) {
      await enInicio('bajarTodo', selector);
      await pagina.waitForTimeout(300);
      await foto(nombre);
    }
    await enInicio('cerrarTodo');
    await pagina.waitForTimeout(500);
    await seccion('cena');
    await pagina.waitForTimeout(1200);
    await foto('todo-inicio-pasado');
    await pagina.click('.in-calorias');
    await hojaAbierta('in-todo');
    await foto('todo-pasado');
    await enInicio('cerrarTodo');
    await pagina.waitForTimeout(400);
  },
  // Inicio el primer día, sin nada anotado: la meta de hoy, el camino y el cielo que espera.
  async primerdia() {
    await pestana(0);
    await enInicio('primerDia', true);
    await enInicio('subir');
    await pagina.waitForTimeout(900);
    await foto('primer-dia');
    await enInicio('bajar');
    await pagina.waitForTimeout(500);
    await foto('primer-dia-abajo');
    await enInicio('primerDia', false);
    await enInicio('subir');
  },
  // El cuestionario nuevo de la entrada (2/11/2026), pantalla por pantalla y en cada caso: sin Salud y con
  // Salud (la tarjeta), la grasa de cada modo (con las figuras de hombre y de mujer), los deportes (varios, con
  // lo de cada uno, los partidos, el día con dos sesiones y el combate) y sin entrenar, el peso
  // meta con su ritmo o una fecha, subir con años de pesas, una comida que no se suele hacer, el resultado
  // de cada objetivo, sin déficit, y en inglés.
  async cuestionario() {
    const entrada = (paso) => pagina.evaluate((p) => window.__entrada(p), paso);
    const responder = (r) => pagina.evaluate((x) => window.__cuestionario('responder', x), r);
    const tocar = (selector) => pagina.evaluate((s) => document.querySelector('.ent-pantalla:not(.saliendo) ' + s).click(), selector);
    const espera = (ms = 1300) => pagina.waitForTimeout(ms);
    const ver = async (paso, nombre, ms) => { await entrada(paso); await espera(ms); await foto('cuestionario-' + nombre); };
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    // Sin Salud, los cuatro datos de a uno.
    await ver('sexo', 'sexo', 2200);
    await responder({ sexo: 'm' });
    for (const paso of ['edad', 'altura', 'peso']) await ver(paso, paso);
    // La grasa: no sé, lo sé, por imagen y con cinta; y las figuras y la cinta de una mujer.
    await ver('grasa', 'grasa');
    for (const [modo, nombre] of [['dicha', 'grasa-dicha'], ['imagen', 'grasa-imagen'], ['cinta', 'grasa-cinta']]) {
      await tocar(`[data-valor="${modo}"]`);
      await espera(700);
      if (modo === 'imagen') { await tocar('.ent-figura[data-valor="2"]'); await espera(400); }
      await foto('cuestionario-' + nombre);
    }
    await responder({ sexo: 'f', grasaModo: 'imagen', figura: 4 });
    await ver('grasa', 'grasa-imagen-mujer');
    await responder({ grasaModo: 'cinta' });
    await ver('grasa', 'grasa-cinta-mujer');
    await responder({ sexo: 'm', grasaModo: 'no', figura: null });
    // Cuánto te mueves, qué deportes (varios a la vez; «No entreno» saca los demás) y cuándo: con pesas y
    // partidos, lo de cada uno y si juega partidos y qué día; con correr el lunes a la mañana, el día con dos
    // sesiones (también en tu día); con combate, la categoría de peso; y con uno solo.
    const deportes = (x) => pagina.evaluate((v) => window.__cuestionario('entreno', v), x);
    await ver('movimiento', 'movimiento');
    await ver('entreno', 'entreno');
    await tocar('[data-valor="equipo"]');
    await espera(500);
    await foto('cuestionario-entreno-varios');
    await ver('cuando', 'cuando-varios');
    await tocar('.ent-partidos [data-valor="si"]');
    await espera(800);
    await foto('cuestionario-cuando-partidos');
    await deportes({ tipos: ['fuerza', 'resistencia'], de: { resistencia: { dias: [1, 6], hora: 7 * 60 + 30, minutos: 45 } } });
    await ver('cuando', 'cuando-dos-sesiones');
    await ver('dia', 'dia-dos-sesiones', 1600);
    await deportes({ tipos: ['contacto'] });
    await ver('cuando', 'cuando-combate');
    await entrada('entreno');
    await espera();
    await tocar('[data-valor="no"]');
    await espera(500);
    await foto('cuestionario-entreno-no');
    await tocar('[data-valor="fuerza"]');
    await espera(400);
    await ver('cuando', 'cuando');
    // Bajar: el peso meta con el ritmo de cada uno, una fecha muy apurada y lo que sigue.
    await entrada('objetivo');
    await espera();
    await tocar('[data-valor="bajar"]');
    await espera(500);
    await foto('cuestionario-objetivo');
    await ver('meta', 'meta');
    await tocar('.ent-ritmo-fila[data-valor="fecha"]');
    await espera(600);
    for (let i = 0; i < 6; i++) { await tocar('.ent-fecha-elegida button'); await espera(150); }
    await espera(500);
    await foto('cuestionario-meta-fecha');
    await responder({ fecha: null, ritmo: 'recomendado' });
    await ver('despues', 'despues', 1800);
    // Subir con más de 3 años de pesas: la experiencia, el ritmo suave «para ti» y lo que sigue.
    await responder({ objetivo: 'subir', pesoMeta: null, fecha: null });
    await entrada('experiencia');
    await espera();
    await tocar('[data-valor="avanzado"]');
    await espera(500);
    await foto('cuestionario-experiencia');
    await ver('meta', 'meta-subir');
    await ver('despues', 'despues-subir', 1800);
    // Cómo comes (con la proteína más alta) y tu día sin Salud, con una comida que no suele hacer.
    await responder({ objetivo: 'bajar', pesoMeta: null, ritmo: 'recomendado' });
    await entrada('comer');
    await espera();
    await tocar('[data-valor="alta"]');
    await espera(500);
    await foto('cuestionario-comer');
    await ver('dia', 'dia', 1600);
    await tocar('.ent-dia-nombre[data-valor="merienda"]');
    await espera(500);
    await foto('cuestionario-dia-sin-merienda');
    // El resultado de cada objetivo, con el plan en una línea; con la grasa, por la masa magra.
    for (const [r, nombre] of [[{ objetivo: 'bajar' }, 'resultado-bajar'], [{ objetivo: 'mantener' }, 'resultado-mantener'], [{ objetivo: 'recomponer', grasaModo: 'dicha', grasaPct: 22 }, 'resultado-recomponer'], [{ objetivo: 'subir', grasaModo: 'no', despues: 'musculo' }, 'resultado-subir']]) {
      await responder(Object.assign({ pesoMeta: null, fecha: null }, r));
      await ver('resultado', nombre, 2600);
    }
    // Con Salud: la tarjeta (y un dato abierto), los pasos que sugieren cuánto te mueves y tu día con sus noches.
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    await pagina.evaluate(() => window.__cuestionario('salud'));
    await ver('tu', 'tu');
    await tocar('.ent-fila[data-valor="peso"]');
    await espera(700);
    await foto('cuestionario-tu-abierto');
    await ver('movimiento', 'movimiento-salud');
    await ver('dia', 'dia-salud', 1600);
    // Sin déficit: ni la grasa ni bajar ni recomponer.
    await responder({ caso: 'condicion', sinDeficit: true });
    await ver('objetivo', 'objetivo-sin-deficit');
    await responder({ caso: 'nada', sinDeficit: false });
    // En inglés, lo nuevo.
    await pagina.evaluate(() => window.__idioma('en'));
    await responder({ objetivo: 'bajar', pesoMeta: null, grasaModo: 'imagen', figura: 3 });
    for (const paso of ['tu', 'grasa', 'movimiento', 'entreno', 'cuando', 'objetivo', 'meta', 'despues', 'comer', 'dia']) await ver(paso, 'en-' + paso);
    await ver('resultado', 'en-resultado', 2600);
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    await pagina.evaluate(() => window.__entrada(null));
    await pagina.waitForTimeout(1200);
  },
  // El ritmo y el plazo (D35): el ritmo del perfil, uno exigente, la fecha que pide uno muy agresivo
  // (con el piso), entrenando fuerza, y el rango del peso. Y cómo vienes contra un plan más rápido y uno
  // más lento, con la fecha a tu ritmo como un rango (D1 del estudio de progreso).
  async plazo() {
    await pestana(2);
    await progreso('plazo', { pct: 0.5, fuerza: null });
    await progreso('bajar', '.pg-plan-estrategia');
    await pagina.waitForTimeout(500);
    await foto('plazo-ritmo');
    await progreso('plazo', { pct: 0.85 });
    await pagina.waitForTimeout(400);
    await foto('plazo-exigente');
    await progreso('plazo', { semanas: 4 });
    await pagina.waitForTimeout(400);
    await foto('plazo-fecha');
    await progreso('plazo', { pct: 0.5, fuerza: true });
    await pagina.waitForTimeout(400);
    await foto('plazo-con-fuerza');
    await progreso('abrir', null);
    await progreso('cambiarPlan', false);
    await progreso('subir');
    await pagina.waitForTimeout(500);
    await foto('plazo-camino');
    await progreso('rango', 'mes');
    await progreso('bajar', '.pg-peso');
    await pagina.waitForTimeout(400);
    await foto('plazo-peso-mes');
    await progreso('rango', 'tresMeses');
    for (const [pct, nombre] of [[0.85, 'plazo-al-ritmo-con-margen'], [1, 'plazo-mas-lento'], [0.25, 'plazo-adelantado']]) {
      await progreso('plazo', { pct });
      await progreso('abrir', null);
      await progreso('cambiarPlan', false);
      await progreso('subir');
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await progreso('plazo', { pct: null, fuerza: null });
    await progreso('abrir', null);
    await progreso('cambiarPlan', false);
    await progreso('subir');
  },
  // Sueño: anoche de arriba abajo, cómo sale la calidad, y las noches que faltan o se cortaron.
  async sueno() {
    await pestana(3);
    await sueno('noche', 0);
    await pagina.waitForTimeout(800);
    await foto('sueno');
    for (const [selector, nombre] of [['.sn-calidad', 'sueno-calidad'], ['.sn-horario', 'sueno-horario'], ['.sn-deuda', 'sueno-deuda'], ['.sn-vitales', 'sueno-vitales'], ['.sn-fuentes', 'sueno-fuentes']]) {
      await sueno('bajar', selector);
      await pagina.waitForTimeout(400);
      await foto(nombre);
    }
    // La deuda arriba de todo (5/11, a la noche): compacta, y desplegada con lo de cada noche y esta noche.
    await sueno('deuda', true);
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(500);
    await foto('sueno-deuda-abierta');
    await sueno('deuda', false);
    await sueno('subir');
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
    // Sin reloj (spec/sueno-sin-esfuerzo.md): «Afinar», el despertador, la guía de los Atajos con lo que
    // llegó, y la pregunta de la mañana con la alarma parada (solo la hora de dormirte).
    await pagina.evaluate(() => window.__aparato('iphone'));
    await sueno('afinar', ['prender', false]);
    await sueno('bajar', '.sn-afinar');
    await pagina.waitForTimeout(500);
    await foto('sueno-afinar');
    await sueno('afinar', 'despertador');
    await pagina.waitForTimeout(700);
    await sueno('afinar', ['prender', true]);
    await pagina.waitForTimeout(300);
    await foto('sueno-despertador');
    await sueno('afinar', 'cerrar');
    await pagina.waitForTimeout(500);
    await foto('sueno-afinar-prendido');
    await sueno('afinar', ['atajos', 'alarma']);
    await pagina.waitForTimeout(700);
    await foto('sueno-atajos');
    await sueno('afinar', 'bajarHoja');
    await pagina.waitForTimeout(300);
    await foto('sueno-atajos-llego');
    await sueno('afinar', 'cerrar');
    await sueno('afinar', ['prender', false]);
    await sueno('olvidar');
    await sueno('hora', 'soloDormirse');
    await sueno('subir');
    await pagina.waitForTimeout(800);
    await foto('sueno-solo-dormirse');
    await sueno('hora', null);
    await pagina.evaluate(() => window.__aparato('reloj'));
    await sueno('noche', 0);
  },
  // Sueño sin noches: la invitación, el ejemplo y los puntos de cada tarjeta; con una y dos noches, lo
  // que ya hay y lo que falta; la deuda ya pagada, y lo mismo en inglés.
  async 'sueno-vacio'() {
    await pagina.evaluate(() => { localStorage.removeItem('moss-galeria-caras'); localStorage.removeItem('moss-galeria-movimiento'); });
    await pestana(3);
    const estado = async (e) => { await sueno('estado', e); await pagina.waitForTimeout(1500); };
    const tarjetas = async (sufijo) => {
      for (const selector of ['.sn-deuda', '.sn-calidad', '.sn-horario', '.sn-vitales', '.sn-fuentes']) {
        await sueno('bajar', selector);
        await pagina.waitForTimeout(350);
        await foto(`sueno-${sufijo}-${selector.slice(4)}`);
      }
      await sueno('subir');
    };
    await estado('vacio');
    await foto('sueno-vacio');
    await pagina.click('.sn-camino .sn-otra');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(500);
    await foto('sueno-vacio-iphone');
    await sueno('bajar', '.sn-manana');
    await pagina.waitForTimeout(350);
    await foto('sueno-vacio-manana');
    await tarjetas('vacio');
    await sueno('bajar', '.sn-afinar');
    await pagina.waitForTimeout(350);
    await foto('sueno-vacio-afinar');
    await sueno('subir');
    await estado('una');
    await foto('sueno-una');
    await tarjetas('una');
    await estado('dos');
    await foto('sueno-dos');
    await tarjetas('dos');
    await estado('pagada');
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(400);
    await foto('sueno-pagada');
    await sueno('bajar', '.sn-calidad');
    await pagina.waitForTimeout(400);
    await foto('sueno-pagada-calidad');
    await estado('mucha');
    await sueno('deuda', true);
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(1200);
    await foto('sueno-mucha');
    await sueno('deuda', false);
    await sueno('subir');
    await pagina.evaluate(() => window.__idioma('en'));
    await estado('vacio');
    await foto('sueno-vacio-ingles');
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(350);
    await foto('sueno-vacio-ingles-deuda');
    await estado('dos');
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(350);
    await foto('sueno-dos-ingles-deuda');
    await estado('datos');
    await sueno('noche', 0);
    await pagina.waitForTimeout(1200);
    await foto('sueno-ingles');
    await sueno('bajar', '.sn-deuda');
    await pagina.waitForTimeout(350);
    await foto('sueno-ingles-deuda');
    await sueno('bajar', '.sn-vitales');
    await pagina.waitForTimeout(350);
    await foto('sueno-ingles-vitales');
    await sueno('subir');
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => localStorage.removeItem('moss-galeria-movimiento'));
    await pestana(0);
  },
  // Solo con el iPhone (spec/sueno.md, «Sin reloj»): la pregunta de la hora, cambiarla, sin proponer,
  // la noche estimada con su franja y la precisión.
  async 'sin-reloj'() {
    await pagina.evaluate(() => { localStorage.removeItem('moss-galeria-caras'); window.__aparato('iphone'); });
    await pestana(3);
    await sueno('olvidar');
    await sueno('hora', 'proponer');
    await sueno('subir');
    await pagina.waitForTimeout(900);
    await foto('sin-reloj');
    await pagina.click('.sn-hora .sn-otra');
    await pagina.waitForTimeout(700);
    await foto('sin-reloj-cambiar');
    await sueno('hora', 'sinProponer');
    await pagina.waitForTimeout(700);
    await foto('sin-reloj-sin-proponer');
    // «Sí»: la pregunta se cierra suave y la noche pasa a confirmada.
    await sueno('hora', 'proponer');
    await pagina.waitForTimeout(600);
    await pagina.click('.sn-hora .sn-si');
    await pagina.waitForTimeout(250);
    await foto('sin-reloj-cerrando');
    await pagina.waitForTimeout(1200);
    await foto('sin-reloj-confirmada');
    await sueno('bajar', '.sn-moss');
    await pagina.waitForTimeout(500);
    await foto('sin-reloj-noche');
    await sueno('noche', -2);
    await pagina.waitForTimeout(500);
    await sueno('bajar', '.sn-moss');
    await pagina.waitForTimeout(400);
    await foto('sin-reloj-estimada');
    await sueno('editarNoche', -2);
    await sueno('bajar', '.sn-moss');
    await pagina.waitForTimeout(500);
    await foto('sin-reloj-editar');
    for (const [selector, nombre] of [['.sn-calidad', 'sin-reloj-calidad'], ['.sn-fuentes', 'sin-reloj-fuentes']]) {
      await sueno('bajar', selector);
      await pagina.waitForTimeout(400);
      await foto(nombre);
    }
    // Con el reloj, la precisión de la noche.
    await pagina.evaluate(() => window.__aparato('reloj'));
    await sueno('noche', 0);
    await sueno('bajar', '.sn-fuentes');
    await pagina.waitForTimeout(400);
    await foto('con-reloj-fuentes');
    await sueno('olvidar');
    await sueno('hora', null);
    await sueno('subir');
  },
  // Perfil › Aparatos (spec/aparatos.md): con el reloj, una marca desplegada y el final; solo con el iPhone.
  async aparatos() {
    await pagina.evaluate(() => window.__aparato('reloj'));
    await seccion('aparatos');
    await hojaAbierta('pf-hoja');
    await pagina.waitForTimeout(300);
    await foto('aparatos');
    await pagina.click('.pf-marcas li:nth-child(2) .pf-marca');
    await pagina.waitForTimeout(600);
    await foto('aparatos-oura');
    await pagina.evaluate(() => { const c = document.querySelector('.pf-aparatos'); c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(400);
    await foto('aparatos-final');
    await pagina.evaluate(() => window.__aparato('iphone'));
    await seccion('aparatos');
    await hojaAbierta('pf-hoja');
    await pagina.waitForTimeout(300);
    await foto('aparatos-solo-iphone');
    await pagina.evaluate(() => window.__aparato('reloj'));
    await pestana(0);
  },
  // Vincular en dos toques (spec/ascent.md, D27): la hoja y la luna en la órbita.
  async vincular() {
    await ascent('vincular', false);
    await ascent('abrir');
    await pagina.waitForTimeout(900);
    await pagina.click('.as-cab .as-vincular');
    await hojaAbierta('as-hoja');
    await pagina.waitForTimeout(300);
    await foto('vincular-hoja');
    await pagina.click('.as-hoja-vincular');
    await pagina.waitForTimeout(1800);
    await foto('vincular-hecho');
    await ascent('vincular', false);
    await ascent('cerrar');
  },
  // Con Ascent (spec/rendimiento.md): los músculos de hoy, el cuerpo con tu semana, tu fuerza y las marcas,
  // vinculada y sin vincular, en qué se basa y la línea del rendimiento en Sueño.
  async rendimiento() {
    await pagina.evaluate(() => window.__aparato('reloj'));
    await ascent('vincular', true);
    await ascent('abrir');
    await pagina.waitForTimeout(900);
    for (const [selector, nombre] of [['.as-fila-musculos', 'rendimiento'], ['.as-musculos', 'rendimiento-musculos'], ['.as-fuerza', 'rendimiento-fuerza'], ['.as-marcas', 'rendimiento-marca']]) {
      await ascent('bajar', selector);
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await ascent('como');
    await pagina.waitForTimeout(900);
    await foto('rendimiento-como');
    await ascent('cerrar');
    await pestana(3);
    await sueno('noche', 0);
    await sueno('subir');
    await pagina.waitForTimeout(700);
    await foto('rendimiento-en-sueno');
    await ascent('vincular', false);
    await ascent('abrir');
    await pagina.waitForTimeout(900);
    await ascent('bajar', '.as-filas-vacias');
    await pagina.waitForTimeout(500);
    await foto('rendimiento-sin-vincular');
    await ascent('cerrar');
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
  async marcas() {
    await pestana(1);
    await comida('registrar');
    await pagina.waitForTimeout(800);
    for (const texto of ['mostaza', 'combo burger king', 'kelloggs', 'conaprole', 'nesquik', 'lays', 'leche']) {
      await comida('escribir', texto);
      await pagina.waitForTimeout(300);
      await foto('marcas-' + texto.replace(/ /g, '-'));
    }
  },
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
  // La ventana del alimento (lo pediste el 22/10): verificado y de dónde sale, cómo deja el día, las
  // vitaminas y los minerales, y reportar un error.
  async ventana() {
    await pestana(1);
    await comida('registrar');
    await pagina.waitForTimeout(1000);
    await comida('ficha', 'Leche entera');
    await pagina.waitForTimeout(900);
    await foto('ventana');
    await pagina.click('.vt-fuente');
    await pagina.click('.vt-ver');
    await pagina.waitForTimeout(700);
    await foto('ventana-abierta');
    await pagina.click('.vt-reportar');
    await pagina.waitForTimeout(600);
    await pagina.click('.vt-motivos button');
    await pagina.waitForTimeout(300);
    await foto('ventana-reportar');
    await pagina.click('.vt-reporte .fi-agregar');
    await pagina.waitForTimeout(500);
    await foto('ventana-gracias');
    await pagina.waitForTimeout(1800);
    // Lo que publicó la comunidad, con su sello y de dónde sale.
    await comida('ficha', 'Barra de proteína de maní');
    await pagina.waitForTimeout(900);
    await pagina.click('.vt-fuente');
    await pagina.waitForTimeout(600);
    await foto('ventana-comunidad');
    await comida('cerrar');
    await pagina.waitForTimeout(800);
  },
  // El plan de comidas (lo pediste el 22/10): armar el viernes y lo que falta de hoy, otra, tus
  // comidas, armar la semana y la lista de compras.
  async plan() {
    await pestana(1);
    await pagina.waitForTimeout(800);
    // El viernes, sin nada: Moss arma el día entero.
    await comida('dia', 2);
    await pagina.waitForTimeout(900);
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(900);
    await foto('plan-viernes');
    await comida('armar');
    await pagina.waitForTimeout(1400);
    await foto('plan-viernes-armado');
    await comida('otra', 'cena');
    await comida('bajar', 'ahora');
    await pagina.waitForTimeout(1200);
    await foto('plan-otra');
    await comida('dia', 0);
    await pagina.waitForTimeout(900);
    await comida('armar');
    await comida('bajar', 'ahora');
    await pagina.waitForTimeout(1400);
    await foto('plan-hoy');
    await comida('tusComidas');
    await pagina.waitForTimeout(900);
    await foto('plan-tus-comidas');
    await comida('cerrarPlan');
    await pagina.waitForTimeout(600);
    await comida('vista', 'semana');
    await pagina.waitForTimeout(800);
    await comida('armarSemana');
    await comida('bajar', 'semana');
    await pagina.waitForTimeout(1400);
    await foto('plan-semana');
    await comida('compras');
    await pagina.waitForTimeout(900);
    await foto('plan-compras');
    await comida('cerrarPlan');
    await pagina.waitForTimeout(600);
  },
  // Pegar una receta (lo pediste el 22/10): leerla, revisarla, guardarla y sumar un plato.
  async receta() {
    await pestana(1);
    await comida('registrar');
    await pagina.waitForTimeout(900);
    await comida('pegarReceta');
    await pagina.waitForTimeout(1200);
    await foto('receta-texto');
    // Solo baja la lista: scrollIntoView correría la hoja entera.
    await pagina.evaluate(() => { const c = document.querySelector('.hj-pegar .hj-cuerpo'); c.scrollTop = document.querySelector('.hj-pegar-resultado').offsetTop - 8; });
    await pagina.waitForTimeout(400);
    await foto('receta-leida');
    // Sacar una línea: queda tachada y el total baja.
    await pagina.evaluate(() => document.querySelectorAll('.hj-pegar-fila:not(.sin)')[4].click());
    await pagina.waitForTimeout(400);
    await foto('receta-sin-una');
    await pagina.evaluate(() => document.querySelector('.hj-pegar .fi-agregar').click());
    await pagina.waitForTimeout(1200);
    await foto('receta-guardada');
    await comida('cerrar');
    await pagina.waitForTimeout(800);
  },
  // Decir lo que comí (lo pediste el 26/10): desde el «+», escuchar (acá se escribe sola), lo que
  // entendió, una frase con preguntas y anotarla; y «tu comida de siempre» arriba de la lista.
  async decir() {
    await pestana(1);
    await mas('abrir');
    await pagina.waitForTimeout(900);
    await foto('decir-mas');
    await pagina.evaluate(() => document.querySelector('.mas-decir').click());
    await pagina.waitForTimeout(1500);
    await foto('decir-escuchando');
    await esperarA(() => !!document.querySelector('.hj-decir .dc-bloque'));
    await pagina.waitForTimeout(600);
    await foto('decir-entendido');
    await pagina.evaluate(() => {
      const a = document.querySelector('.hj-decir .dc-area');
      a.value = 'en el almuerzo comí 200 gramos de arroz, una milanesa con puré y un vaso de leche';
      a.dispatchEvent(new Event('input'));
      [...document.querySelectorAll('.hj-decir .fi-pie .fi-secundario')].find((b) => !b.hidden).click();
    });
    await pagina.waitForTimeout(800);
    await foto('decir-preguntas');
    await pagina.evaluate(() => { const c = document.querySelector('.hj-decir .hj-cuerpo'); c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(400);
    await foto('decir-preguntas-abajo');
    await pagina.evaluate(() => document.querySelector('.hj-decir .fi-agregar').click());
    await pagina.waitForTimeout(1300);
    await foto('decir-anotado');
    await comida('registrar');
    await pagina.waitForTimeout(900);
    await foto('decir-de-siempre');
    await comida('escribir', 'dos huevos, una tostada y un café');
    await pagina.waitForTimeout(700);
    await foto('decir-todo-junto');
    await comida('cerrar');
    await pagina.waitForTimeout(800);
  },
  // La foto de la comida (para aprobar, 2/11): sin fotos, Comida queda como hoy; el botón de la hoja, el
  // visor, elegir de las fotos, «¿Qué es?» con y sin preguntas, anotar, deshacer, anotar después, la tira,
  // abrir una, anotar la que quedó pendiente, borrar, desde la tarjeta, en inglés y con menos movimiento.
  async foto() {
    const tocar = (q) => pagina.evaluate((s) => document.querySelector(s).click(), q);
    const camara = () => pagina.evaluate(() => [...document.querySelectorAll('.hj-busca .hj-icono')][1].click());
    const toques = () => pagina.evaluate(() => document.querySelector('#toques ol li')?.textContent || '');
    await pestana(1);
    await comida('foto', 'nada');
    await pagina.waitForTimeout(600);
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(300);
    await foto('foto-sin-fotos');
    await comida('registrar');
    await pagina.waitForTimeout(900);
    await foto('foto-hoja');
    await camara();
    await pagina.waitForTimeout(700);
    await foto('foto-visor');
    await tocar('.fd-elegir');
    await pagina.waitForTimeout(600);
    await foto('foto-selector');
    await tocar('.fd-selector-cab button');
    await pagina.waitForTimeout(500);
    await tocar('.fd-disparar');
    await pagina.waitForTimeout(90);
    await foto('foto-flash');
    await pagina.waitForTimeout(250);
    await foto('foto-escuchando');
    await esperarA(() => !!document.querySelector('.hj-decir .dc-bloque'));
    await pagina.waitForTimeout(600);
    await foto('foto-entendido');
    await pagina.evaluate(() => {
      const a = document.querySelector('.hj-decir .dc-area');
      a.value = '200 gramos de arroz, una milanesa con puré y un vaso de leche';
      a.dispatchEvent(new Event('input'));
      [...document.querySelectorAll('.hj-decir .fi-pie .fi-secundario')].find((b) => !b.hidden).click();
    });
    await pagina.waitForTimeout(700);
    await foto('foto-preguntas');
    await tocar('.hj-decir .fi-agregar');
    await pagina.waitForTimeout(1300);
    console.log('  toques, desde la hoja abierta:', await toques());
    await comida('bajar', 'fotos');
    await pagina.waitForTimeout(500);
    await foto('foto-anotada');
    await tocar('.cm-aviso-btn');
    await pagina.waitForTimeout(800);
    await foto('foto-deshecha');
    // Otra, sin decir nada todavía.
    await comida('registrar');
    await pagina.waitForTimeout(800);
    await camara();
    await pagina.waitForTimeout(500);
    await tocar('.fd-disparar');
    await pagina.waitForTimeout(500);
    await tocar('.fd-despues');
    await pagina.waitForTimeout(1200);
    await foto('foto-despues');
    // El día con fotos.
    await comida('foto', 'ejemplo');
    await pagina.waitForTimeout(1000);
    await comida('bajar', 'fotos');
    await pagina.waitForTimeout(800);
    await foto('foto-tira');
    await comida('foto', ['abrir', 1]);
    await hojaAbierta('fd-hoja');
    await foto('foto-abierta');
    await comida('foto', 'cerrarFoto');
    await pagina.waitForTimeout(600);
    await comida('foto', 'sinAnotar');
    await hojaAbierta('fd-hoja');
    await foto('foto-abierta-sin-anotar');
    await tocar('.fd-hoja .fi-agregar');
    await pagina.waitForTimeout(1200);
    await foto('foto-anotar-pendiente');
    await esperarA(() => !!document.querySelector('.hj-decir .dc-bloque'));
    await pagina.waitForTimeout(500);
    await tocar('.hj-decir .fi-agregar');
    await pagina.waitForTimeout(1300);
    await comida('bajar', 'fotos');
    await pagina.waitForTimeout(600);
    await foto('foto-pendiente-anotada');
    // Borrar: se va con su animación, lo anotado queda y se puede deshacer.
    await comida('foto', ['abrir', 0]);
    await hojaAbierta('fd-hoja');
    await tocar('.fd-hoja .fi-quitar');
    await pagina.waitForTimeout(150);
    await foto('foto-borrando');
    await pagina.waitForTimeout(800);
    await foto('foto-borrada');
    await tocar('.cm-aviso-btn');
    await pagina.waitForTimeout(800);
    await foto('foto-devuelta');
    // Desde la tarjeta de una comida ya anotada: el snack no tiene foto.
    await comida('bajar', 'dia');
    await pagina.waitForTimeout(300);
    await pagina.evaluate(() => [...document.querySelectorAll('.cm-tarjeta')].find((t) => t.querySelector('.cm-foto')).querySelector('.cm-foto').click());
    await pagina.waitForTimeout(800);
    await foto('foto-tarjeta-visor');
    await tocar('.fd-elegir');
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => document.querySelectorAll('.fd-grilla button')[3].click());
    await pagina.waitForTimeout(1200);
    await foto('foto-tarjeta');
    // En inglés, con el aviso ya ido.
    await pagina.waitForTimeout(3200);
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(600);
    await comida('bajar', 'fotos');
    await pagina.waitForTimeout(500);
    await foto('foto-ingles-tira');
    await comida('foto', ['abrir', 1]);
    await hojaAbierta('fd-hoja');
    await foto('foto-ingles-abierta');
    await comida('foto', 'cerrarFoto');
    await pagina.waitForTimeout(600);
    await comida('registrar');
    await pagina.waitForTimeout(800);
    await foto('foto-ingles-hoja');
    await camara();
    await pagina.waitForTimeout(600);
    await foto('foto-ingles-visor');
    await tocar('.fd-disparar');
    await esperarA(() => !!document.querySelector('.hj-decir .dc-bloque'));
    await pagina.waitForTimeout(600);
    await foto('foto-ingles-entendido');
    await comida('cerrar');
    await pagina.waitForTimeout(800);
    await pagina.evaluate(() => window.__idioma('es'));
    // Con Reducir movimiento, nada vuela.
    await pagina.emulateMedia({ reducedMotion: 'reduce' });
    await comida('registrar');
    await pagina.waitForTimeout(500);
    await camara();
    await pagina.waitForTimeout(400);
    await tocar('.fd-disparar');
    await pagina.waitForTimeout(300);
    await foto('foto-sin-movimiento');
    await comida('cerrar');
    await pagina.waitForTimeout(500);
    await pagina.emulateMedia({ reducedMotion: 'no-preference' });
    await comida('foto', 'nada');
    await pagina.waitForTimeout(600);
    await foto('foto-otra-vez-sin-fotos');
  },
  // Antes y después de entrenar (lo pediste el 26/10): la línea en la comida que toca, por qué, y
  // Perfil › Entrenamiento. La persona de mentira entrena pesas a las 19.
  async entreno() {
    await pestana(1);
    await comida('bajar', 'ahora');
    await pagina.waitForTimeout(900);
    await foto('entreno-cena');
    // Si entrenara a las 22:30, la cena sería la previa.
    await comida('entreno', { entreno: { dias: [0, 1, 2, 3, 4, 5, 6], hora: 22 * 60 + 30, minutos: 90, tipo: 'resistencia' } });
    await pagina.waitForTimeout(900);
    await foto('entreno-previa');
    await comida('entreno', { entreno: { dias: [0, 1, 2, 3, 4, 5, 6], hora: 19 * 60, minutos: 60, tipo: 'fuerza' } });
    await pagina.waitForTimeout(600);
    await comida('porQue');
    await hojaAbierta('pq-hoja');
    await foto('entreno-por-que');
    await pagina.evaluate(() => { const b = document.querySelector('.pq-hoja .hb-cerrar'); if (b) b.click(); });
    await pagina.waitForTimeout(700);
    await seccion('entreno');
    await hojaAbierta('pf-hoja');
    await foto('entreno-perfil');
    await pagina.evaluate(() => { const b = document.querySelector('.pf-hoja .hb-cerrar'); if (b) b.click(); });
    await pagina.waitForTimeout(700);
    await pestana(0);
  },
  // Lo que cuida (lo pediste el 22/10): tus datos y el consentimiento, «¿Alguno es tu caso?», bajar
  // apagado sin déficit, menos de 16, los números ocultos, Perfil, poco sueño y los límites de Progreso.
  async seguridad() {
    const entrada = (paso) => pagina.evaluate((p) => window.__entrada(p), paso);
    const seguridad = (accion, arg) => pagina.evaluate(([a, x]) => window.__seguridad(a, x), [accion, arg]);
    await entrada('datos');
    await pagina.waitForTimeout(2000);
    await foto('seguridad-datos');
    await seguridad('caso', 'embarazo');
    await entrada('cuidado');
    await pagina.waitForTimeout(1400);
    await foto('seguridad-cuidado');
    await entrada('objetivo');
    await pagina.waitForTimeout(1400);
    await foto('seguridad-objetivo');
    await seguridad('menor');
    await entrada('edad');
    await pagina.waitForTimeout(1400);
    await foto('seguridad-menor');
    await pagina.evaluate(() => window.__accion('entrada'));
    await pagina.waitForTimeout(1200);
    await seguridad('numeros', false);
    await pestana(0);
    await pagina.waitForTimeout(800);
    await foto('seguridad-sin-numeros-inicio');
    await pestana(1);
    await pagina.waitForTimeout(800);
    await foto('seguridad-sin-numeros-comida');
    await seguridad('numeros', true);
    await seguridad('sinDeficit', true);
    await pestana(5);
    await pagina.waitForTimeout(800);
    await foto('seguridad-perfil');
    await pagina.evaluate(() => { const c = document.querySelector('.pf-scroll'); c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(500);
    await foto('seguridad-perfil-abajo');
    await seguridad('sinDeficit', false);
    await seguridad('poco', true);
    await pestana(3);
    await pagina.waitForTimeout(900);
    await foto('seguridad-poco-sueno');
    await seguridad('poco', false);
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
  // Que se encuentre (spec/ascent.md, «Ascent en Progreso»): la entrada del encabezado de Progreso y el borde
  // del planeta arriba de todo, el movimiento de la primera vez, tocarla y deslizar para abajo, volver
  // empujando para arriba, que el scroll, las pestañas y la rueda sigan siendo del dedo, que la barra no la
  // abra, Hábitos sin nada de Ascent y la invitación de Inicio, con «Ahora no» y con vincular.
  async 'ascent-senal'() {
    const ascentAbierta = () => pagina.evaluate(() => { const r = document.querySelector('.ascent').getBoundingClientRect(); return Math.abs(r.top) < 40; });
    const ascentCerrada = () => pagina.evaluate(() => document.querySelector('.ascent').style.visibility === 'hidden');
    const enProgreso = () => pagina.evaluate(() => document.querySelector('.pestanas .pt-progreso').getAttribute('aria-selected') === 'true');
    const asoma = (hacer) => pagina.evaluate((h) => {
      const a = document.getAnimations().find((x) => x.id === 'as-asoma');
      if (!a) return false;
      if (h === 'parar') { a.pause(); a.currentTime = 700 + 0.3 * 1500; } else a.finish();
      return true;
    }, hacer);
    const centroDe = (sel) => pagina.evaluate((x) => { const b = document.querySelector(x).getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; }, sel);
    await pestana(2);
    await pagina.waitForTimeout(300);
    // La primera vez que se llega, Progreso baja apenas y el borde del planeta asoma más: la foto, a mitad.
    if (!(await asoma('parar'))) console.log('! la primera vez, Progreso no se movió');
    await pagina.waitForTimeout(200);
    await foto('senal-asomando');
    await asoma('seguir');
    await pagina.waitForTimeout(300);
    await foto('senal-primera-vez');
    await pagina.click('.as-entrada');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('senal-tocada');
    if (!(await ascentAbierta())) console.log('! la entrada tocada no abrió Ascent');
    // Para volver: abajo de todo, empujar para arriba, siguiendo al dedo.
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(300);
    await arrastreVertical(196, 620, 196, 340, 'senal-volviendo');
    if (!(await ascentCerrada())) console.log('! abajo de todo, empujar para arriba no volvió a Progreso');
    await pagina.waitForTimeout(700);
    // Ya se abrió una vez: la pista se pliega.
    await foto('senal-sin-pista');
    // Arriba de todo de Progreso, arrastrar para abajo la baja, siguiendo al dedo.
    await arrastreVertical(196, 300, 196, 580, 'senal-deslizando');
    if (!(await ascentAbierta())) console.log('! arriba de todo, arrastrar para abajo no abrió Ascent');
    // En el medio de Ascent, empujar para arriba es del scroll: no la cierra (sin vincular también está el cuerpo).
    await ascent('bajar', '.as-musculos');
    await pagina.waitForTimeout(300);
    await arrastreVertical(196, 600, 196, 350);
    if (!(await ascentAbierta())) console.log('! en el medio de Ascent, empujar para arriba la cerró');
    await ascent('cerrar');
    await pagina.waitForTimeout(400);
    // Deslizar desde la entrada también la baja.
    const r = await centroDe('.as-entrada');
    await arrastreVertical(r[0], r[1], r[0], r[1] + 260);
    if (!(await ascentAbierta())) console.log('! deslizar desde la entrada no abrió Ascent');
    await ascent('cerrar');
    await pagina.waitForTimeout(400);
    // En el medio del scroll de Progreso, el dedo es del scroll.
    await bajarProgreso(500);
    await pagina.waitForTimeout(300);
    await arrastreVertical(196, 350, 196, 600, 'senal-en-el-medio');
    if (!(await ascentCerrada())) console.log('! en el medio del scroll, arrastrar abrió Ascent');
    await bajarProgreso(0);
    await pagina.waitForTimeout(300);
    // De costado, arriba de todo, sigue pasando de sección.
    await arrastreVertical(340, 420, 60, 420);
    if (await enProgreso()) console.log('! de costado, arriba de todo, no cambió de sección');
    if (!(await ascentCerrada())) console.log('! de costado, arriba de todo, bajó Ascent');
    await pestana(2);
    // Con la rueda: lo que venía subiendo (la inercia) no cuenta; después de una pausa, sí. Y abajo de todo
    // de Ascent, seguir bajando la cierra.
    await bajarProgreso(800);
    await pagina.mouse.move(196, 500);
    await pagina.mouse.wheel(0, -100000);
    await pagina.waitForTimeout(60);
    await pagina.mouse.wheel(0, -120);
    await pagina.waitForTimeout(500);
    if (!(await ascentCerrada())) console.log('! la inercia de la rueda abrió Ascent');
    await pagina.mouse.wheel(0, -120);
    await pagina.waitForTimeout(60);
    await pagina.mouse.wheel(0, -120);
    await pagina.waitForTimeout(900);
    if (!(await ascentAbierta())) console.log('! con la rueda, arriba de todo, no abrió Ascent');
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(400);
    await pagina.mouse.wheel(0, 120);
    await pagina.waitForTimeout(60);
    await pagina.mouse.wheel(0, 120);
    await pagina.waitForTimeout(900);
    if (!(await ascentCerrada())) console.log('! con la rueda, abajo de todo de Ascent, no volvió a Progreso');
    await ascent('cerrar');
    await pagina.waitForTimeout(400);
    // Desde la barra no arranca: el borde de abajo es del gesto de inicio del iPhone.
    await arrastreVertical(196, 790, 196, 850);
    if (!(await ascentCerrada())) console.log('! desde la barra bajó Ascent');
    // En las metas no hay entrada.
    await pagina.evaluate(() => window.__progreso('metas'));
    await pagina.waitForTimeout(600);
    await foto('senal-en-metas');
    if (await pagina.locator('.progreso .as-entrada').count()) console.log('! en las metas está la entrada de Ascent');
    await pagina.evaluate(() => window.__progreso('principal'));
    await pagina.waitForTimeout(300);
    // Hábitos, como antes: sin nada de Ascent; para abajo sigue llevando a tu universo.
    await alCielo();
    await pagina.waitForTimeout(800);
    await foto('senal-habitos');
    if (await pagina.evaluate(() => { const b = document.querySelector('.as-entrada').getBoundingClientRect(); return b.x >= 0 && b.x < 393; })) console.log('! la entrada de Ascent se ve en Hábitos');
    if (await pagina.evaluate(() => document.querySelector('.as-techo').style.visibility !== 'hidden')) console.log('! el borde del planeta se ve en Hábitos');
    await arrastreVertical(196, 180, 196, 740, 'senal-habitos-universo');
    await pagina.waitForTimeout(600);
    if (!(await ascentCerrada())) console.log('! en Hábitos, para abajo bajó Ascent');
    if (await pagina.evaluate(() => document.querySelector('#b-zona').textContent === 'Volver a hoy')) {
      await pagina.evaluate(() => window.__accion('zona'));
      await pagina.waitForTimeout(1500);
    } else console.log('! en Hábitos, para abajo no llevó a tu universo');
    // Lo que dice, en cada estado.
    await pestana(2);
    await ascent('iphone', 'sinAscent');
    await pagina.waitForTimeout(600);
    await foto('senal-sin-ascent');
    await ascent('iphone', 'sesion');
    await ascent('vincular', true);
    await pagina.waitForTimeout(1700);
    await foto('senal-vinculada');
    await ascent('dia', 'entreno');
    await pagina.waitForTimeout(900);
    await foto('senal-vinculada-hoy');
    await ascent('dia', 'descanso');
    await pagina.waitForTimeout(900);
    await foto('senal-vinculada-descanso');
    await ascent('dia', 'corta');
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(600);
    await foto('senal-vinculada-ingles');
    await ascent('vincular', false);
    await pagina.waitForTimeout(1300);
    await foto('senal-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    // La invitación de Inicio.
    await pestana(0);
    await pagina.waitForTimeout(1000);
    await foto('invitacion');
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(500);
    await foto('invitacion-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.waitForTimeout(300);
    await pagina.click('.as-invita-no');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(150);
    await foto('invitacion-yendose');
    await pagina.waitForTimeout(700);
    await foto('invitacion-ahora-no');
    if (await pagina.locator('.as-invita').count()) console.log('! «Ahora no» dejó la invitación');
    await ascent('volverAInvitar');
    await ascent('iphone', 'sinAscent');
    await pagina.waitForTimeout(500);
    if (await pagina.locator('.as-invita').count()) console.log('! sin Ascent en este iPhone, invitó igual');
    await foto('invitacion-sin-ascent');
    await ascent('iphone', 'sesion');
    await pagina.waitForTimeout(700);
    // «Vincular» abre la hoja; al vincular, la invitación se va sola.
    await pagina.click('.as-invita-si');
    await pagina.mouse.move(1, 1);
    await hojaAbierta('as-hoja');
    await pagina.waitForTimeout(300);
    await foto('invitacion-hoja');
    await pagina.click('.as-hoja-vincular');
    await pagina.waitForTimeout(2200);
    await foto('invitacion-vinculada');
    if (await pagina.locator('.as-invita').count()) console.log('! vinculada, siguió la invitación');
    await ascent('vincular', false);
    await pagina.waitForTimeout(600);
  },
  // Ascent, arriba de Progreso: la entrada y el borde del planeta, el gesto a mitad de camino (con el dedo
  // todavía abajo) para abrirla y para volver, sin vincular, la hoja de vincular, vinculada con los siete días
  // de ejemplo y cada parte, «¿Cómo te sientes?» tocado, un músculo tocado, «¿Por qué no hay un porcentaje?»
  // y «En qué se basa», tocar un día del año, «sin déficit», los números ocultos y lo que cambia en Inicio,
  // Sueño y Perfil con el vínculo.
  async ascent() {
    await pestana(2);
    await pagina.waitForTimeout(2600);
    await foto('ascent-entrada');
    await arrastreVertical(196, 300, 196, 600, 'ascent-bajando');
    await foto('ascent');
    // Para volver: abajo de todo, empujarla para arriba.
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(300);
    await foto('ascent-final');
    await arrastreVertical(196, 620, 196, 380, 'ascent-subiendo');
    await foto('ascent-de-vuelta');
    await ascent('abrir');
    await pagina.waitForTimeout(300);
    for (const [selector, nombre] of [['.as-grupo', 'ascent-bloqueadas'], ['.as-musculos', 'ascent-bloqueadas-2'], ['.as-fuerza', 'ascent-bloqueadas-3'], ['.as-estanc', 'ascent-bloqueadas-4']]) {
      await ascent('bajar', selector);
      await pagina.waitForTimeout(300);
      await foto(nombre);
    }
    await ascent('bajar', 'fondo');
    // La hoja de vincular (D27): con la sesión de Ascent en el llavero, sin sesión, sin Ascent y sin
    // la cuenta de Moss; un error del servidor y entrar con la cuenta de Ascent.
    await hojaDeVincular();
    await ascent('vincular', true);
    await pagina.waitForTimeout(1700);
    await foto('ascent-vinculada');
    await diasDeAscent();
    await partesDeAscent();
    // Un buen día para intentar marca, y con la sesión ya hecha, las piernas cargadas en el cuerpo.
    await ascent('dia', 'bien');
    await ascent('bajar', '.as-marcas');
    await pagina.waitForTimeout(400);
    await foto('ascent-parte-marcas-buen-dia');
    await ascent('dia', 'entreno');
    await ascent('bajar', '.as-musculos');
    await pagina.waitForTimeout(400);
    await foto('ascent-parte-musculos-cargados');
    // Tocar un músculo en el cuerpo: dice cómo está y cuándo vuelve a lo suyo. Los toques van por el DOM: el
    // click de Playwright corre la tira de las secciones para mostrar lo tocado.
    const tocar = (selector) => pagina.evaluate((s) => document.querySelector(s).dispatchEvent(new MouseEvent('click', { bubbles: true })), selector);
    await tocar('.as-cuerpo .as-m[data-musculo="cuadriceps"]');
    await pagina.waitForTimeout(600);
    await foto('ascent-musculo-tocado');
    // Durmió bien, pero dice que no se siente bien (3 de 10): el titular y lo de hoy cambian, con un fundido.
    await ascent('dia', 'bien');
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(400);
    await tocar('.as-siente-escala button:nth-child(4)');
    await pagina.waitForTimeout(700);
    await foto('ascent-te-sientes');
    await ascent('dia', 'corta');
    await ascent('bajar', 'fondo');
    // «¿Por qué no hay un porcentaje?» y «En qué se basa», desplegados.
    await tocar('.as-hoy > .as-enlace');
    await pagina.waitForTimeout(500);
    await foto('ascent-por-que-no');
    await ascent('como');
    await pagina.waitForTimeout(900);
    await foto('ascent-en-que-se-basa');
    await ascent('bajar', '.as-como-cuerpo p:nth-of-type(5)');
    await pagina.waitForTimeout(400);
    await foto('ascent-en-que-se-basa-2');
    // Con pocas semanas, las razones del sueño y la comida todavía juntan información.
    await ascent('pocas', true);
    await ascent('bajar', '.as-estanc');
    await pagina.waitForTimeout(300);
    await foto('ascent-juntando');
    await ascent('pocas', false);
    // Un día del año, tocado: el de la última marca.
    await ascent('bajar', '.as-anio');
    await pagina.waitForTimeout(300);
    await pagina.click('.as-anio-dia.marca >> nth=-1');
    await pagina.waitForTimeout(300);
    await foto('ascent-anio-tocado');
    await ascent('bajar', 'fondo');
    await ascent('cerrar');
    // Con «sin déficit» no hay «Hoy, concéntrate en» ni metas de comida; con los números ocultos, sin gramos.
    await pagina.evaluate(() => window.__seguridad('sinDeficit', true));
    await ascent('abrir');
    await pagina.waitForTimeout(500);
    await foto('ascent-sin-deficit');
    await ascent('bajar', '.as-fila-comida');
    await pagina.waitForTimeout(300);
    await foto('ascent-sin-deficit-2');
    await ascent('bajar', 'fondo');
    await ascent('cerrar');
    await pagina.evaluate(() => window.__seguridad('sinDeficit', false));
    await pagina.evaluate(() => window.__seguridad('numeros', false));
    await ascent('abrir');
    await pagina.waitForTimeout(500);
    await foto('ascent-sin-numeros');
    await ascent('bajar', '.as-fila-comida');
    await pagina.waitForTimeout(300);
    await foto('ascent-sin-numeros-2');
    await ascent('bajar', 'fondo');
    await ascent('cerrar');
    await pagina.evaluate(() => window.__seguridad('numeros', true));
    await pestana(0);
    await pagina.waitForTimeout(1200);
    await foto('ascent-inicio');
    await pestana(3);
    await pagina.waitForTimeout(700);
    await foto('ascent-sueno');
    await pestana(5);
    await pagina.waitForTimeout(500);
    await foto('ascent-perfil');
    await ascent('vincular', false);
    await pestana(0);
    await pagina.waitForTimeout(600);
  },
  // Hábitos: los dos botones sobre el cielo, el hábito nuevo con «Con Salud», la grilla de íconos,
  // mantener apretada una estrella (con el mouse, como un dedo) y el cielo después de guardar uno
  // nuevo para hoy: el miércoles pasa de seis a siete y cambia de constelación.
  async editor() {
    await alCielo();
    await etiquetasUbicadas();
    await pagina.waitForTimeout(600);
    await pagina.screenshot({ path: join(salida, 'editor-botones.png'), clip: { x: 0, y: 40, width: 393, height: 240 } });
    console.log('· editor-botones');
    await habitos('nuevo');
    await habitos('como', 'salud');
    await hojaAbierta('hh-hoja-editor');
    await foto('editor');
    await habitos('bajar');
    await pagina.waitForTimeout(300);
    await foto('editor-iconos');
    await habitos('cerrar');
    await pagina.waitForTimeout(600);
    const p = await pagina.evaluate(() => window.__estrella('Escribir'));
    await pagina.mouse.move(p.x, p.y);
    await pagina.mouse.down();
    await pagina.waitForTimeout(700);
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await hojaAbierta('hh-hoja-editor');
    await foto('editor-editar');
    await habitos('cerrar');
    await pagina.waitForTimeout(600);
    await habitos('nuevo');
    await habitos('escribir', 'Estirar 5 min');
    await habitos('icono', 'figure.run');
    await habitos('guardar');
    await etiquetasUbicadas();
    await pagina.waitForTimeout(1500);
    await foto('editor-guardado');
    await pagina.evaluate(() => window.__accion('reiniciar'));
    await etiquetasUbicadas();
    await pestana(0);
  },
  // Tu mes: los mini cielos con las cifras, cada hábito abajo, el mes anterior (antes de sumar el
  // agua) y en inglés.
  async mes() {
    await alCielo();
    await habitos('mes');
    await hojaAbierta('hh-hoja-mes');
    await foto('mes');
    await habitos('bajar');
    await pagina.waitForTimeout(300);
    await foto('mes-habitos');
    await habitos('mover', -1);
    await habitos('bajar', '.hh-navegar');
    await pagina.waitForTimeout(300);
    await foto('mes-septiembre');
    await habitos('mover', 1);
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(400);
    await foto('mes-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await habitos('cerrar');
    await pagina.waitForTimeout(600);
    await pestana(0);
  },
  // Los primeros hábitos: suben al terminar la entrada, con los cuatro de fábrica; con cinco el
  // sexto ya no entra; y la constelación que arman en el cielo de hoy.
  async sugeridos() {
    await pagina.evaluate(() => window.__entrada('resultado'));
    await pagina.waitForTimeout(2600);
    await pagina.click('.ent-resultado .ent-principal');
    await pagina.mouse.move(1, 1);
    // El flum hasta Inicio y, al llegar, la hoja.
    await hojaAbierta('hh-hoja-sugeridos');
    await foto('sugeridos');
    await habitos('elegir', 'leer');
    await habitos('elegir', 'agua');
    await habitos('bajar');
    await pagina.waitForTimeout(400);
    await foto('sugeridos-cinco');
    await habitos('armar');
    await pagina.waitForTimeout(600);
    await alCielo();
    await etiquetasUbicadas();
    await pagina.waitForTimeout(1200);
    await foto('sugeridos-cielo');
    await pagina.evaluate(() => window.__accion('reiniciar'));
    await etiquetasUbicadas();
    await pestana(0);
  },
  // Perfil, abajo: borrar los datos o la cuenta, y los créditos de los alimentos.
  // Los avisos (lo pediste el 22/10): Perfil › Avisos y el aviso de un hábito.
  async avisos() {
    await pagina.evaluate(() => window.__seccion('avisos'));
    await pagina.waitForTimeout(900);
    await foto('avisos-perfil');
    // El horario de comidas (lo pediste el 26/10) y pesarse, encendidos.
    await pagina.getByRole('button', { name: 'Horario de comidas' }).click();
    await pagina.getByRole('button', { name: 'Pesarme por la mañana' }).click();
    await pagina.waitForTimeout(600);
    await foto('avisos-horario');
    await pagina.getByRole('button', { name: 'Horario de comidas' }).click();
    await pagina.getByRole('button', { name: 'Pesarme por la mañana' }).click();
    // Lo que conviene hacer (3/11, para aprobar), cada uno con su llave, en español y en inglés; y en
    // Perfil › Entrenamiento, lo que tardas en llegar al gimnasio.
    const conviene = ['Comer antes de entrenar', 'Proteína después de entrenar', 'Café', 'Última comida grande', 'Si entrenas tarde', 'Bajar las luces'];
    const llaves = async () => { for (const nombre of conviene) await pagina.locator('.pf-hoja').getByRole('button', { name: nombre, exact: true }).click(); };
    const alGrupo = () => pagina.evaluate(() => {
      const c = document.querySelector('.pf-hoja .pf-avisos');
      const g = [...document.querySelectorAll('.pf-hoja .pf-grupo')][0];
      if (c && g) c.scrollTop = g.offsetTop - c.offsetTop - 8;
    });
    await llaves();
    await alGrupo();
    await pagina.waitForTimeout(500);
    await foto('avisos-conviene');
    await pagina.evaluate(() => { const c = document.querySelector('.pf-hoja .pf-avisos'); if (c) c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(400);
    await foto('avisos-conviene-abajo');
    await pagina.evaluate(() => window.__idioma('en'));
    await seccion('avisos');
    await pagina.waitForTimeout(700);
    await alGrupo();
    await pagina.waitForTimeout(400);
    await foto('avisos-conviene-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await seccion('entreno');
    await pagina.waitForTimeout(700);
    await pagina.evaluate(() => { const c = document.querySelector('.pf-hoja .pf-avisos'); if (c) c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(400);
    await foto('avisos-entreno-viaje');
    await seccion('avisos');
    await pagina.waitForTimeout(700);
    await llaves();
    await habitos('nuevo');
    await habitos('como', 'manual');
    await habitos('escribir', 'Estirar');
    await habitos('aviso', 'despertar');
    await pagina.waitForTimeout(400);
    await pagina.evaluate(() => { const c = document.querySelector('.hh-hoja-editor .aj-cuerpo, .hh-hoja-editor .hh-cuerpo'); const a = document.querySelector('.hh-aviso'); if (c && a) c.scrollTop = a.offsetTop - 160; });
    await pagina.waitForTimeout(400);
    await foto('avisos-habito');
    await habitos('cerrar');
    await pagina.waitForTimeout(600);
  },
  async perfil() {
    await pestana(5);
    // Arriba, la persona; tocarla abre Editar perfil: la foto, el nombre y tus datos.
    const enPerfil = (accion, arg) => pagina.evaluate(([a, x]) => window.__perfil(a, x), [accion, arg]);
    await foto('perfil');
    await pagina.click('.pf-cab');
    await pagina.mouse.move(1, 1);
    await hojaAbierta('pf-hoja-editar');
    await foto('perfil-editar');
    await enPerfil('foto');
    await pagina.waitForTimeout(500);
    await foto('perfil-editar-foto');
    await pagina.evaluate(() => { const c = document.querySelector('.pf-hoja-editar .hh-cuerpo'); c.scrollTop = c.scrollHeight; });
    await pagina.waitForTimeout(300);
    await foto('perfil-editar-datos');
    await enPerfil('guardar');
    await pagina.waitForTimeout(700);
    await foto('perfil-con-foto');
    // Sin el nombre (Apple no lo trajo): arriba se invita a ponerlo y Editar perfil lo pide.
    await enPerfil('sinNombre');
    await pagina.waitForTimeout(500);
    await foto('perfil-sin-nombre');
    await enPerfil('abrir');
    await hojaAbierta('pf-hoja-editar');
    await foto('perfil-editar-sin-nombre');
    await enPerfil('escribir', 'Ana');
    await pagina.waitForTimeout(400);
    await foto('perfil-editar-escribiendo');
    await enPerfil('cerrar');
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => window.__idioma('en'));
    await enPerfil('abrir');
    await hojaAbierta('pf-hoja-editar');
    await foto('perfil-editar-ingles');
    await enPerfil('cerrar');
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => window.__idioma('es'));
    await enPerfil('sinNombre', true);
    await pagina.evaluate(() => document.querySelector('.pf-scroll').scrollTo(0, 99999));
    await pagina.waitForTimeout(400);
    await foto('perfil-abajo');
    // Las filas, de arriba abajo; los créditos desplegados; sin Ascent (como la 1.0) y Ascent vinculada.
    await enPerfil('bajar', '.pf-grupo:nth-of-type(2)');
    await pagina.waitForTimeout(300);
    await foto('perfil-datos');
    await enPerfil('creditos', true);
    await enPerfil('bajar', '.pf-creditos-lista');
    await pagina.waitForTimeout(500);
    await foto('perfil-creditos');
    await enPerfil('creditos', false);
    await enPerfil('subir');
    await pagina.evaluate(() => window.__ascentEnPerfil(false));
    await pagina.waitForTimeout(400);
    await foto('perfil-sin-ascent');
    await pagina.evaluate(() => window.__ascentEnPerfil(true));
    await ascent('vincular', true);
    await pestana(5);
    await pagina.waitForTimeout(500);
    await foto('perfil-vinculada');
    await ascent('vincular', false);
    await pestana(5);
    // La suscripción, en cada estado: solo la fila.
    for (const [acceso, nombre] of [['prueba', 'perfil-en-prueba'], ['activa', 'perfil-anual'], ['regalo', 'perfil-regalo']]) {
      await pagina.evaluate((a) => window.__suscripcion('poner', a), acceso);
      await pagina.evaluate(() => window.__seguridad('numeros', true));
      await pagina.waitForTimeout(300);
      await foto(nombre);
    }
    await pagina.evaluate(() => { window.__suscripcion('poner', 'prueba'); window.__seguridad('numeros', true); });
    // Las subpantallas.
    for (const [cual, nombre] of [['calidad', 'perfil-calidad'], ['corte', 'perfil-corte'], ['privacidad', 'perfil-privacidad']]) {
      await enPerfil('hoja', cual);
      await hojaAbierta('pf-hoja');
      await foto(nombre);
      await enPerfil('cerrarHoja');
      await pagina.waitForTimeout(500);
    }
    await seccion('entreno');
    await hojaAbierta('pf-hoja');
    await foto('perfil-entreno');
    await enPerfil('cerrarHoja');
    await pagina.waitForTimeout(500);
    await seccion('aparatos');
    await hojaAbierta('pf-hoja');
    await foto('perfil-aparatos');
    await enPerfil('cerrarHoja');
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(400);
    await foto('perfil-ingles');
    await seccion('avisos');
    await hojaAbierta('pf-hoja');
    await foto('perfil-avisos-ingles');
    await enPerfil('cerrarHoja');
    await pagina.waitForTimeout(500);
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => document.querySelector('.pf-scroll').scrollTo(0, 0));
    await pestana(0);
  },
  // Tu energía en Inicio (5/11, para aprobar): el día entero, con el sueño y la comida. Baja arriba de todo (por
  // el sueño, con «Más» y plegada; por la comida, con «Más»), suficiente y alta debajo de los macros (con «Más»),
  // sin datos, sin números, en inglés y con Ascent vinculada (su marca y los músculos de hoy). Y según la hora (5/11, a la
  // noche): al despertar, el mediodía, antes y después de entrenar y la noche, también con lo de hoy atrasado.
  async energia() {
    const energia = (v, extra) => pagina.evaluate(([x, y]) => window.__energia(x, y), [v, extra || {}]);
    // Tu energía vive en Sueño (5/11, a la noche), debajo de la noche: se baja hasta ella.
    const centrar = () => pagina.evaluate(() => window.__sueno('bajar', '.in-energia'));
    await pagina.evaluate(() => window.__seccion('energia'));
    await pagina.waitForTimeout(1000);
    for (const [v, extra, nombre] of [['baja', {}, 'baja'], ['baja', { mas: true }, 'baja-mas'], ['baja', { mas: false, plegada: true }, 'baja-plegada'],
      ['bajaComida', { plegada: false, mas: true }, 'baja-comida-mas'], ['suficiente', { mas: false }, 'suficiente'], ['suficiente', { mas: true }, 'suficiente-mas'],
      ['alta', { mas: false }, 'alta'], ['alta', { mas: true }, 'alta-mas'], ['sinDatos', { mas: false }, 'sin-datos'],
      ['suficiente', { hora: 'manana', mas: true }, 'hora-despertar-mas'], ['alta', { hora: 'manana', mas: false }, 'hora-despertar-alta'],
      ['atrasado', { hora: 'mediodia', mas: true }, 'hora-mediodia-atrasado-mas'], ['atrasado', { hora: 'antes', mas: true }, 'hora-antes-atrasado-mas'],
      ['suficiente', { hora: 'antes', mas: true }, 'hora-antes-mas'], ['suficiente', { hora: 'despues', mas: true }, 'hora-despues-mas'], ['suficiente', { hora: 'noche', mas: true }, 'hora-noche-mas']]) {
      await energia(v, extra);
      await pagina.waitForTimeout(800);
      await centrar();
      await pagina.waitForTimeout(350);
      await foto('energia-' + nombre);
    }
    // En Inicio, el botón de arriba a la derecha en cada estado; tocarlo lleva a Sueño, con la tarjeta abierta y «Más» cerrado.
    for (const [v, extra, nombre] of [['baja', { hora: 'mediodia' }, 'boton-baja'], ['suficiente', { hora: 'mediodia' }, 'boton-suficiente'], ['alta', { hora: 'mediodia' }, 'boton-alta'], ['atrasado', { hora: 'antes' }, 'boton-antes-atrasado'], ['sinDatos', {}, 'boton-sin-datos']]) {
      await energia(v, extra);
      await pagina.evaluate(() => window.__seccion('energiaInicio'));
      await pagina.waitForTimeout(900);
      await foto('energia-' + nombre);
    }
    // Tocar el botón abre el globo ahí mismo (crece desde el botón); «Más en Sueño» se desliza a la tarjeta, con «Más» abierto.
    for (const [v, nombre] of [['baja', 'globo-baja'], ['suficiente', 'globo-suficiente'], ['alta', 'globo-alta']]) {
      await energia(v, { hora: 'mediodia' });
      await pagina.evaluate(() => window.__seccion('energiaInicio'));
      await pagina.waitForTimeout(700);
      await pagina.click('.in-energia-boton');
      if (v === 'baja') { await pagina.waitForTimeout(90); await foto('energia-globo-creciendo'); }
      await pagina.waitForTimeout(900);
      await foto('energia-' + nombre);
      await pagina.click('.in-energia-cerrar');
      await pagina.waitForTimeout(400);
    }
    await energia('baja', { hora: 'mediodia', plegada: true, mas: false });
    await pagina.evaluate(() => window.__seccion('energiaInicio'));
    await pagina.waitForTimeout(700);
    await pagina.click('.in-energia-boton');
    await pagina.waitForTimeout(900);
    await pagina.click('.in-energia-globo-mas');
    await pagina.waitForTimeout(250);
    await foto('energia-globo-deslizando');
    await pagina.waitForTimeout(1500);
    await foto('energia-globo-a-sueno');
    await pagina.evaluate(() => window.__seccion('energia'));
    await energia('suficiente', { hora: 'mediodia', mas: true });
    await pagina.evaluate(() => window.__seguridad('numeros', false));
    await pagina.waitForTimeout(700);
    await centrar();
    await pagina.waitForTimeout(350);
    await foto('energia-sin-numeros');
    await pagina.evaluate(() => window.__seguridad('numeros', true));
    await pagina.evaluate(() => window.__idioma('en'));
    await energia('baja', { mas: true });
    await pagina.waitForTimeout(900);
    await centrar();
    await pagina.waitForTimeout(350);
    await foto('energia-ingles');
    await pagina.evaluate(() => window.__seccion('energiaInicio'));
    await pagina.waitForTimeout(900);
    await foto('energia-boton-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    // Con Ascent vinculada: su marca en la etiqueta y los músculos de hoy como cuarta parte.
    await pagina.evaluate(() => window.__ascent('vincular', true));
    await pagina.evaluate(() => window.__seccion('energia'));
    for (const [v, nombre] of [['alta', 'ascent-alta-mas'], ['baja', 'ascent-baja-mas']]) {
      await energia(v, { mas: true, plegada: false });
      await pagina.waitForTimeout(800);
      await centrar();
      await pagina.waitForTimeout(350);
      await foto('energia-' + nombre);
    }
    await pagina.evaluate(() => window.__ascent('vincular', false));
    await energia('suficiente', { mas: false, plegada: false });
    await pagina.waitForTimeout(500);
  },


  // En qué se basa Moss (5/11, para aprobar): la fila de abajo de todo de Perfil, la hoja con el dibujo y las
  // reglas, cada área abierta y lo que Moss no hace, y en inglés.
  async base() {
    await pestana(5);
    await pagina.waitForTimeout(1000);
    await pagina.evaluate(() => { const f = [...document.querySelectorAll('.perfil .pf-grupo')].pop(); f?.scrollIntoView({ block: 'center' }); });
    await pagina.waitForTimeout(500);
    await foto('base-fila');
    await pagina.evaluate(() => window.__seccion('base'));
    await pagina.waitForTimeout(1100);
    await foto('base');
    const areas = await pagina.$$eval('.pf-base-area .pf-base-cab', (bs) => bs.length);
    for (let i = 0; i < areas; i++) {
      await pagina.evaluate((k) => document.querySelectorAll('.pf-base-area .pf-base-cab')[k].click(), i);
      await pagina.waitForTimeout(700);
      await pagina.evaluate(() => document.querySelector('.pf-base-area.abierta')?.scrollIntoView({ block: 'start' }));
      await pagina.waitForTimeout(350);
      await foto(`base-area-${i + 1}`);
    }
    await pagina.evaluate(() => [...document.querySelectorAll('.pf-base-reglas')].pop()?.scrollIntoView({ block: 'end' }));
    await pagina.waitForTimeout(400);
    await foto('base-abajo');
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.evaluate(() => window.__seccion('base'));
    await pagina.waitForTimeout(1000);
    await foto('base-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => document.querySelector('.hb-cerrar')?.click());
    await pagina.waitForTimeout(500);
  },

  // Cuidados (5/11, para aprobar: src/dominio/cuidados.ts): en el cuestionario, varios marcados, el
  // consentimiento en lugar de «Seguir», lo que se pregunta además (el embarazo, la diálisis), el objetivo en el
  // embarazo y el resultado con el riñón; en Perfil › Cuidados, la lista para marcar y desmarcar, el
  // consentimiento y cómo cambia tu dieta con el riñón, con la diabetes y la presión, con un trastorno de la
  // alimentación y reflujo (los números ocultos) y con el embarazo (la banda); la fila de Perfil, y en inglés.
  async cuidados() {
    const entrada = (paso) => pagina.evaluate((p) => window.__entrada(p), paso);
    const responder = (r) => pagina.evaluate((x) => window.__cuestionario('responder', x), r);
    const tocar = (selector) => pagina.evaluate((s) => document.querySelector('.ent-pantalla:not(.saliendo) ' + s).click(), selector);
    const bajar = (y) => pagina.evaluate((v) => { const d = document.querySelector('.ent-pantalla:not(.saliendo) .ent-desliza'); if (d) d.scrollTop = typeof v === 'string' ? d.querySelector(v).offsetTop - d.offsetTop - 40 : v; }, y);
    const enPerfil = (accion, arg) => pagina.evaluate(([a, x]) => window.__perfil(a, x), [accion, arg]);
    const tocarEnPerfil = (selector) => pagina.evaluate((s) => document.querySelector(s).click(), selector);
    const espera = (ms = 1300) => pagina.waitForTimeout(ms);
    const DATOS = { semana: 24, pesoAntes: 60, mellizos: false, semanasParto: 8, soloPecho: true, bajaElAzucar: null, dialisis: false };
    // El cuestionario: una mujer de 31 años, 165 cm y 64 kg.
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    await responder({ sexo: 'f', edad: 31, altura: 165, peso: 64 });
    await entrada('cuidado');
    await espera(1700);
    await foto('cuidados-pregunta');
    await tocar('.ent-cuidados [data-valor="diabetes2"]');
    await tocar('.ent-cuidados [data-valor="presion"]');
    await espera(900);
    await foto('cuidados-consentimiento');
    await tocar('.ent-consentimiento .ent-principal');
    await espera(900);
    await foto('cuidados-guardado');
    await bajar(9999);
    await espera(500);
    await foto('cuidados-guardado-abajo');
    await responder({ cuidados: ['embarazo'], consentido: true, datosCuidado: DATOS });
    await entrada('cuidado');
    await espera(1600);
    await foto('cuidados-embarazo');
    await entrada('objetivo');
    await espera();
    await foto('cuidados-objetivo-embarazo');
    await responder({ cuidados: ['renal'], datosCuidado: { ...DATOS, dialisis: true } });
    await entrada('cuidado');
    await espera(1300);
    await bajar('.ent-cuidados [data-valor="renal"]');
    await espera(500);
    await foto('cuidados-dialisis');
    await responder({ cuidados: ['renal'], datosCuidado: DATOS, objetivo: 'bajar', pesoMeta: null });
    await entrada('resultado');
    await espera(2700);
    await foto('cuidados-resultado-renal');
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    await pagina.evaluate(() => window.__entrada(null));
    await espera(1200);
    // Perfil › Cuidados: la lista, el consentimiento al marcar el primero y lo que cambia.
    await pestana(5);
    await enPerfil('cuidados', { marcados: [], consentido: false });
    await hojaAbierta('pf-hoja');
    await foto('cuidados-perfil-lista');
    await enPerfil('bajarCuidados', '.pf-cuidados-grupo[data-grupo="rinones"]');
    await espera(400);
    await tocarEnPerfil('.pf-cuidado[data-cuidado="renal"] .in-llave');
    await espera(900);
    await foto('cuidados-perfil-consentimiento');
    await tocarEnPerfil('.pf-consentir-si');
    await espera(500);
    await enPerfil('bajarCuidados', 0);
    await espera(900);
    await foto('cuidados-perfil-renal');
    await enPerfil('bajarCuidados', '.pf-cuidados-grupo[data-grupo="rinones"]');
    await espera(500);
    await foto('cuidados-perfil-renal-lista');
    // Tres casos distintos: arriba, cómo cambia tu dieta; después, la lista en el grupo del primero.
    for (const [marcados, nombre, grupo, extra] of [
      [['diabetes2', 'presion'], 'diabetes-presion', 'azucar', {}],
      [['tca', 'reflujo'], 'tca-reflujo', 'digestion', { numeros: false }],
      [['embarazo'], 'embarazo', 'etapa', { sexo: 'f', numeros: true, datos: { semana: 24, pesoAntes: 70 } }],
    ]) {
      await enPerfil('cuidados', { marcados, consentido: true, ...extra });
      await espera(1000);
      await foto('cuidados-perfil-' + nombre);
      await enPerfil('bajarCuidados', `.pf-cuidados-grupo[data-grupo="${grupo}"]`);
      await espera(500);
      await foto(`cuidados-perfil-${nombre}-lista`);
    }
    await enPerfil('cerrarHoja');
    await espera(600);
    await enPerfil('bajar', '[data-fila="cuidado"]');
    await espera(500);
    await foto('cuidados-perfil-fila');
    // En inglés: Perfil con el riñón y los cálculos, y la pregunta del cuestionario.
    await pagina.evaluate(() => window.__idioma('en'));
    await enPerfil('cuidados', { sexo: 'm', marcados: ['renal', 'calculos'], consentido: true });
    await espera(1100);
    await foto('cuidados-en-perfil');
    await enPerfil('cerrarHoja');
    await espera(600);
    await responder({ sexo: 'f', cuidados: ['lactancia', 'celiaquia'], consentido: true, datosCuidado: DATOS });
    await entrada('cuidado');
    await espera(1600);
    await foto('cuidados-en-pregunta');
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => window.__cuestionario('reiniciar'));
    await pagina.evaluate(() => window.__entrada(null));
    await enPerfil('cuidados', { sexo: 'm', marcados: [], consentido: false, numeros: true, abrir: false });
    await enPerfil('subir');
    await espera(800);
    await pestana(0);
  },

  // Tu rango en Ascent (5/11, para aprobar): la sección con el color de cada rango y su cuerpo como horizonte,
  // vinculada; los cinco planetas del rango 4; sin vincular, arriba («Ascent» y la frase); y el logo, igual al
  // ícono de Ascent, en la entrada de Progreso (sin vincular y vinculada) y en la invitación de Inicio.
  async 'ascent-rangos'() {
    await pestana(2);
    await pagina.waitForTimeout(1800);
    await foto('rango-entrada-sin-vincular');
    await ascent('abrir');
    await pagina.waitForTimeout(1000);
    await foto('rango-sin-vincular');
    await ascent('subir');
    await pagina.waitForTimeout(800);
    await foto('rango-sin-vincular-arriba');
    await ascent('vincular', true);
    await pagina.waitForTimeout(1600);
    for (const [n, planeta] of [[1], [2], [3], [4, 'Ceres'], [4, 'Mercurio'], [4, 'Marte'], [4, 'Venus'], [4, 'Saturno'], [5], [6], [7]]) {
      await ascent('rango', [n, planeta || null]);
      await ascent('subir');
      await pagina.waitForTimeout(1000);
      await foto(`rango-${n}${planeta ? '-' + planeta.toLowerCase() : ''}`);
    }
    await ascent('rango', [7, null]);
    await ascent('bajar', 'fondo');
    await pagina.waitForTimeout(300);
    await foto('rango-7-llegada');
    await ascent('rango', [1, null]);
    await pagina.waitForTimeout(500);
    await foto('rango-1-llegada');
    await ascent('bajar', 'fondo');
    await ascent('cerrar');
    await pagina.waitForTimeout(900);
    await foto('rango-entrada-vinculada');
    await ascent('vincular', false);
    await ascent('volverAInvitar');
    await pestana(0);
    await pagina.waitForTimeout(1200);
    await pagina.evaluate(() => document.querySelector('.as-invita')?.scrollIntoView({ block: 'center' }));
    await pagina.waitForTimeout(500);
    await foto('rango-invitacion');
  },

  async 'ascent-ingles'() {
    await pagina.evaluate(() => window.__idioma('en'));
    await pestana(2);
    await pagina.waitForTimeout(500);
    await foto('ascent-entrada-ingles');
    await ascent('abrir');
    await pagina.waitForTimeout(500);
    await foto('ascent-ingles');
    await ascent('bajar', '.as-grupo');
    await pagina.waitForTimeout(300);
    await foto('ascent-bloqueadas-ingles');
    await ascent('bajar', 'fondo');
    await hojaDeVincular('-ingles');
    await ascent('vincular', true);
    await pagina.waitForTimeout(1700);
    await foto('ascent-vinculada-ingles');
    await diasDeAscent('-ingles');
    await partesDeAscent('-ingles');
    await ascent('como');
    await pagina.waitForTimeout(900);
    await foto('ascent-en-que-se-basa-ingles');
    await ascent('vincular', false);
    await ascent('cerrar');
    await pagina.evaluate(() => window.__idioma('es'));
    await pestana(0);
  },
  // Los widgets (spec/widgets.md): la pantalla de inicio con el chico y el mediano, un «hecho»
  // tocado ahí, tintados y transparentes, StandBy, la noche en la pantalla bloqueada (con reloj y
  // sin reloj, antes y después del «Sí»), en inglés, y abrir Moss con lo tocado encendiéndose.
  async widgets() {
    const widgets = (accion, arg) => pagina.evaluate(([a, x]) => window.__widgets(a, x), [accion, arg]);
    await alCielo();
    await widgets('inicio');
    await pagina.waitForTimeout(700);
    await foto('widgets-inicio');
    await widgets('tocar', 'Escribir');
    await pagina.waitForTimeout(700);
    await foto('widgets-tocar');
    for (const modo of ['tintado', 'transparente']) {
      await widgets('modo', modo);
      await pagina.waitForTimeout(500);
      await foto('widgets-' + modo);
    }
    await widgets('modo', 'color');
    await widgets('standby');
    await pagina.waitForTimeout(700);
    await foto('widgets-standby');
    await widgets('deNoche', true);
    await pagina.waitForTimeout(300);
    await foto('widgets-standby-noche');
    await widgets('deNoche', false);
    await widgets('bloqueo');
    await pagina.waitForTimeout(700);
    await foto('widgets-bloqueo-reloj');
    await pagina.evaluate(() => window.__aparato('iphone'));
    await widgets('bloqueo');
    await pagina.waitForTimeout(500);
    await foto('widgets-bloqueo');
    await widgets('confirmar');
    await pagina.waitForTimeout(1200);
    await foto('widgets-confirmada');
    await pagina.evaluate(() => window.__idioma('en'));
    await pagina.waitForTimeout(400);
    await foto('widgets-bloqueo-ingles');
    await widgets('inicio');
    await pagina.waitForTimeout(700);
    await foto('widgets-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await pagina.evaluate(() => window.__aparato('reloj'));
    await widgets('inicio');
    await pagina.waitForTimeout(500);
    await widgets('abrirMoss');
    await pagina.waitForTimeout(1600);
    await foto('widgets-abrir-moss');
    await widgets('olvidar');
    // Lo de después no se fotografía: alcanza con volver al cielo de siempre.
    await pagina.evaluate(() => window.__accion('reiniciar'));
    await pagina.waitForTimeout(800);
    await pestana(0);
  },

  // Los avisos en la pantalla bloqueada (spec/avisos.md): tu día (almuerzas a las 13:00, entrenas a las
  // 16:00 y tardas una hora en llegar) a distintas horas, lo que ya pasó, sin entreno y entrenando tarde, en
  // inglés, y cada texto de «Todos», lo de lo que conviene primero.
  async bloqueo() {
    const poner = async (p, nombre, espera = 500) => {
      await pagina.evaluate((x) => window.__avisosBloqueo(x), p);
      await pagina.waitForTimeout(espera);
      await foto(nombre);
    };
    const hora = (h, m = 0) => h * 60 + m;
    const nada = { otraHora: false, cenaTemprano: false, pocaProteina: false };
    await seccion('avisosBloqueo');
    await pagina.waitForTimeout(500);
    // El de comer, antes del almuerzo; el café, antes de salir; mientras vas, nada; al terminar, la proteína.
    await poner({ modo: 'dia', idioma: 'es', dia: 'tarde', hora: hora(12, 30), ...nada }, 'bloqueo-entreno-almuerzo');
    await poner({ hora: hora(15, 30) }, 'bloqueo-entreno-viaje');
    await poner({ hora: hora(17) }, 'bloqueo-entreno-despues');
    await poner({ hora: hora(23, 30) }, 'bloqueo-entreno-noche', 700);
    // El día entero no entra en la pantalla: lo de la mañana, bajando la lista.
    await poner({ abajo: 4000 }, 'bloqueo-entreno-noche-2');
    // Lo que ya pasó no suena: entrenaste a la mañana; cenaste temprano (y poca proteína).
    await poner({ otraHora: true }, 'bloqueo-entreno-otra-hora', 700);
    await poner({ abajo: 4000 }, 'bloqueo-entreno-otra-hora-2');
    await poner({ otraHora: false, cenaTemprano: true, pocaProteina: true }, 'bloqueo-cene-temprano', 700);
    // Sin entreno, y entrenando tarde, con el máximo lleno.
    await poner({ dia: 'no', ...nada, hora: hora(23, 30) }, 'bloqueo-sin-entreno', 700);
    await poner({ abajo: 4000 }, 'bloqueo-sin-entreno-2');
    await poner({ dia: 'noche', hora: hora(23, 30) }, 'bloqueo-entreno-tarde', 700);
    await poner({ abajo: 4000 }, 'bloqueo-entreno-tarde-2');
    await poner({ dia: 'tarde', hora: hora(23, 30), idioma: 'en' }, 'bloqueo-entreno-ingles', 700);
    // Todos, por grupos.
    await poner({ modo: 'todos', idioma: 'es', abajo: 0 }, 'bloqueo-todos-1');
    await poner({ abajo: 'Después de entrenar' }, 'bloqueo-todos-2');
    await poner({ abajo: 'Si entrenas tarde' }, 'bloqueo-todos-3');
    await poner({ abajo: 'Comidas' }, 'bloqueo-todos-4');
    await poner({ abajo: 'Si vas muy bajo en algo' }, 'bloqueo-todos-5');
    await poner({ abajo: 'Hábitos' }, 'bloqueo-todos-6');
    await poner({ abajo: 'La hora de dormir' }, 'bloqueo-todos-7');
    await poner({ modo: 'todos', idioma: 'en', abajo: 0 }, 'bloqueo-todos-ingles-1');
    await poner({ abajo: 'Después de entrenar' }, 'bloqueo-todos-ingles-2');
    await poner({ abajo: 'Si entrenas tarde' }, 'bloqueo-todos-ingles-3');
    await pagina.evaluate((x) => window.__avisosBloqueo(x), { modo: 'dia', idioma: 'es', dia: 'tarde', hora: hora(17, 5), ...nada });
    await pagina.click('.ab-cerrar');
    await pagina.waitForTimeout(400);
  },

  // Según el deporte (3/11, para aprobar; spec/entreno.md 5.12): cada día de ejemplo en Inicio («Para hoy»,
  // abajo), en Sueño (la línea debajo de la noche) y en la pantalla bloqueada (a la hora en que importa); el
  // domingo sin alcohol; la tarjeta de la energía baja, sin números, con «sin déficit» y al tocar «No mostrar
  // más»; Perfil › Entrenamiento con el partido y con la carrera, y sus avisos; la hora del partido en el
  // cuestionario; lo del deporte en «Todos»; y en inglés.
  async deporte() {
    const deporte = (accion, arg) => pagina.evaluate(([a, x]) => window.__deporte(a, x), [accion, arg]);
    const bloqueo = (p) => pagina.evaluate((x) => window.__avisosBloqueo(x), p);
    const espera = (ms = 900) => pagina.waitForTimeout(ms);
    const cerrarBloqueo = async () => { await pagina.click('.ab-cerrar'); await espera(450); };
    // La hoja de Perfil abierta, con lo que diga `texto` arriba.
    const alBloque = (texto) => pagina.evaluate((t) => {
      const c = document.querySelector('.pf-hoja .pf-avisos');
      const b = [...document.querySelectorAll('.pf-hoja .pf-aviso, .pf-hoja .pf-grupo')].find((x) => x.textContent.includes(t));
      if (c && b) c.scrollTop = b.offsetTop - c.offsetTop - 8;
    }, texto);
    const EJEMPLOS = ['vispera', 'anoche', 'carrera', 'pico', 'carga', 'energia', 'bici'];
    const nombre = (clave) => `deporte-${EJEMPLOS.indexOf(clave) + 1}-${clave}`;
    async function enLosTres(clave, sufijo = '') {
      await deporte('poner', clave);
      await deporte('inicio');
      await espera();
      await foto(`${nombre(clave)}-inicio${sufijo}`);
      await deporte('sueno');
      await espera(1200);
      await foto(`${nombre(clave)}-sueno${sufijo}`);
      await deporte('bloqueo');
      await espera(800);
      await foto(`${nombre(clave)}-bloqueo${sufijo}`);
      await cerrarBloqueo();
    }
    for (const clave of EJEMPLOS) await enLosTres(clave);
    // El domingo, sin alcohol anotado: «Para hoy» no dice nada del deporte.
    await deporte('poner', 'anoche');
    await deporte('alcohol', false);
    await deporte('inicio');
    await espera();
    await foto('deporte-2-anoche-inicio-sin-alcohol');
    // La energía baja del rugby (la señal de su peso), arriba de Inicio (5/11: siempre a la vista, plegable): con
    // «Más» abierto, con números, sin números y con «sin déficit», y plegada.
    await deporte('poner', 'energia');
    await pagina.evaluate(() => window.__seccion('energiaInicio'));
    await espera(1100);
    await foto('deporte-tarjeta-inicio');
    await deporte('tarjeta');
    await espera(1100);
    await foto('deporte-tarjeta');
    await pagina.click('.in-energia-mas');
    await espera(600);
    await foto('deporte-tarjeta-mas');
    await pagina.evaluate(() => window.__seguridad('numeros', false));
    await espera(700);
    await foto('deporte-tarjeta-sin-numeros');
    await pagina.evaluate(() => window.__seguridad('numeros', true));
    await pagina.evaluate(() => window.__seguridad('sinDeficit', true));
    await deporte('tarjeta');
    await espera(1100);
    await foto('deporte-tarjeta-sin-deficit');
    await pagina.evaluate(() => window.__seguridad('sinDeficit', false));
    await deporte('tarjeta');
    await espera(1100);
    await pagina.click('.in-energia-plegar');
    await espera(700);
    await foto('deporte-tarjeta-plegada');
    await pagina.click('.in-energia-plegar');
    await espera(500);
    await pagina.evaluate(() => window.__energia('suficiente', { plegada: false, mas: false }));
    // Perfil › Entrenamiento: el partido (qué día y a qué hora) y la próxima carrera (cuándo y cuánto dura).
    await deporte('poner', 'vispera');
    await deporte('perfil');
    await hojaAbierta('pf-hoja');
    await alBloque('Juego partidos');
    await espera(500);
    await foto('deporte-perfil-partido');
    await pagina.click('.pf-hoja .hb-cerrar');
    await espera(500);
    await deporte('poner', 'carrera');
    await deporte('perfil');
    await hojaAbierta('pf-hoja');
    await alBloque('Próxima carrera');
    await espera(500);
    await foto('deporte-perfil-carrera');
    // Con 90 minutos, lo de antes no hace falta.
    await pagina.locator('.pf-hoja .fi-porcion', { hasText: /^1 h 30 min$/ }).click();
    await espera(500);
    await alBloque('Próxima carrera');
    await espera(300);
    await foto('deporte-perfil-carrera-corta');
    await pagina.click('.pf-hoja .hb-cerrar');
    await espera(500);
    // Perfil › Avisos, con la corredora: «Antes de una carrera larga», en lo que conviene hacer.
    await seccion('avisos');
    await hojaAbierta('pf-hoja');
    await alBloque('Bajar las luces');
    await espera(500);
    await foto('deporte-perfil-avisos');
    await pagina.click('.pf-hoja .hb-cerrar');
    await espera(500);
    // La hora del partido, en el cuestionario: abajo de «Qué día».
    await deporte('poner', null);
    await deporte('cuestionario');
    await espera(2400);
    await pagina.evaluate(() => { const d = document.querySelector('.ent-pantalla:not(.saliendo) .ent-desliza'); if (d) d.scrollTop = d.scrollHeight; });
    await espera(500);
    await foto('deporte-cuestionario-hora');
    await pagina.click('.ent-pantalla:not(.saliendo) .ent-varia');
    await espera(500);
    await foto('deporte-cuestionario-varia');
    await pagina.evaluate(() => { window.__cuestionario('entreno', { tipos: ['fuerza'], partidos: false, horaDePartido: null }); window.__entrada(null); });
    await espera(1500);
    // «Todos», lo del deporte, en es y en.
    await seccion('avisosBloqueo');
    await espera(500);
    await bloqueo({ modo: 'todos', idioma: 'es', abajo: 'Según el deporte' });
    await espera(500);
    await foto('deporte-bloqueo-todos');
    await bloqueo({ idioma: 'en', abajo: 'Según el deporte' });
    await espera(500);
    await foto('deporte-bloqueo-todos-ingles');
    // Sin idioma propio, la pantalla bloqueada sigue al de la galería.
    await bloqueo({ modo: 'dia', idioma: null });
    await cerrarBloqueo();
    // En inglés: la víspera, el domingo, la carga, la tarjeta y la bici.
    await pagina.evaluate(() => window.__idioma('en'));
    await enLosTres('vispera', '-ingles');
    await deporte('poner', 'anoche');
    await deporte('sueno');
    await espera(1200);
    await foto('deporte-2-anoche-sueno-ingles');
    await deporte('poner', 'carga');
    await deporte('sueno');
    await espera(1200);
    await foto('deporte-5-carga-sueno-ingles');
    await deporte('tarjeta');
    await espera(1100);
    await foto('deporte-tarjeta-ingles');
    await deporte('poner', 'bici');
    await deporte('inicio');
    await espera();
    await foto('deporte-7-bici-inicio-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await deporte('poner', null);
    await espera(600);
    await pestana(0);
  },

  // La propuesta de widgets (D43): la comida, chica, mediana y grande, con un toque que anota sin abrir
  // Moss; el cielo con su fondo de verdad y el día completo; la noche, a la mañana y a la noche; la
  // pantalla bloqueada; StandBy; tintados y transparentes, en inglés y abrir Moss con lo tocado.
  async 'widgets-nuevos'() {
    const widgets = (accion, arg) => pagina.evaluate(([a, x]) => window.__widgets(a, x), [accion, arg]);
    const espera = (ms = 900) => pagina.waitForTimeout(ms);
    await alCielo();
    await pagina.evaluate(() => window.__aparato('iphone'));
    await widgets('n', 'comida');
    await espera();
    await foto('wn-comida');
    await widgets('tocarComida', 'cena');
    await widgets('vasos', 1);
    await espera(1200);
    await foto('wn-comida-tocada');
    await widgets('olvidarTodo');
    await widgets('n', 'comidagrande');
    await espera();
    await foto('wn-grande');
    await widgets('tocarComida', 'cena');
    await espera(1200);
    await foto('wn-grande-tocada');
    await widgets('olvidarTodo');
    await widgets('momento', 'manana');
    await espera();
    await foto('wn-grande-manana');
    await widgets('n', 'comida');
    await espera();
    await foto('wn-comida-manana');
    await widgets('momento', 'primerDia');
    await espera();
    await foto('wn-comida-primer-dia');
    await widgets('momento', 'noche');
    await widgets('n', 'cielo');
    await espera();
    await foto('wn-cielo');
    await widgets('n', 'cielogrande');
    await espera();
    await foto('wn-cielo-grande');
    await widgets('completar');
    await espera(1500);
    await foto('wn-cielo-grande-completo');
    await widgets('n', 'cielo');
    await espera(1200);
    await foto('wn-cielo-completo');
    await widgets('olvidarTodo');
    await espera(1200);
    await widgets('n', 'bloqueo');
    await espera();
    await foto('wn-bloqueo-noche');
    await widgets('momento', 'manana');
    await espera();
    await foto('wn-bloqueo-manana');
    await widgets('momento', 'noche');
    await widgets('n', 'bloqueo2');
    await espera();
    await foto('wn-bloqueo-otra');
    await widgets('n', 'standby');
    await espera();
    await foto('wn-standby');
    for (const modo of ['tintado', 'transparente']) {
      await widgets('modo', modo);
      await widgets('n', 'comida');
      await espera();
      await foto('wn-comida-' + modo);
      await widgets('n', 'cielo');
      await espera();
      await foto('wn-cielo-' + modo);
    }
    await widgets('modo', 'color');
    await pagina.evaluate(() => window.__idioma('en'));
    await widgets('n', 'comida');
    await espera();
    await foto('wn-comida-ingles');
    await widgets('n', 'comidagrande');
    await espera();
    await foto('wn-grande-ingles');
    await pagina.evaluate(() => window.__idioma('es'));
    await widgets('n', 'comida');
    await widgets('pasarse');
    await espera(1200);
    await foto('wn-comida-pasada');
    await widgets('noPasarse');
    await widgets('n', 'comida');
    await widgets('tocarComida', 'cena');
    await espera(500);
    await widgets('abrirMoss', 'comida');
    await espera(1600);
    await foto('wn-abrir-moss');
    await widgets('olvidar');
    await pagina.evaluate(() => window.__aparato('reloj'));
    await pagina.evaluate(() => window.__accion('reiniciar'));
    await espera(800);
    await pestana(0);
  },
  // Los detalles de app profesional (6/11, para aprobar), cada uno donde va: «Listo» y «Siguiente» arriba del
  // teclado de números, mantener apretado y deslizar en Comida, cambiar y borrar lo guardado, la hoja para otro
  // día, restar un vaso, «Atrás» en el cuestionario, la franja bajo la hora, las esperas, Sueño y Hábitos y
  // Perfil. Lo de mantener y deslizar, con el mouse como un dedo. El 1, el 2, el 5 y el 7, también en inglés.
  async detalles() {
    const det = (a, x) => pagina.evaluate(([a, x]) => window.__detalles(a, x), [a, x]);
    const espera = (ms) => pagina.waitForTimeout(ms);
    const idioma = (v) => pagina.evaluate((x) => window.__idioma(x), v);
    const centro = (s, kx = 0.5) => pagina.evaluate(([s, kx]) => {
      const n = document.querySelector(s);
      if (!n) return null;
      const b = n.getBoundingClientRect();
      return [b.left + b.width * kx, b.top + b.height / 2];
    }, [s, kx]);
    const tocar = async (s) => { const c = await centro(s); if (!c) throw new Error('No está ' + s); await pagina.mouse.click(c[0], c[1]); await pagina.mouse.move(1, 1); };
    // Apretar y mantener, como un dedo; con `nombre`, la foto se saca con el dedo todavía abajo.
    const mantenerEn = async (s, nombre) => {
      const c = await centro(s);
      if (!c) throw new Error('No está ' + s);
      await pagina.mouse.move(c[0], c[1]);
      await pagina.mouse.down();
      await espera(650);
      if (nombre) await foto(nombre);
      await pagina.mouse.up();
      await pagina.mouse.move(1, 1);
    };
    // Deslizar desde el 60 % de algo, `dx` y `dy`; con `nombre`, la foto con el dedo todavía abajo.
    const deslizarEn = async (s, dx, dy, nombre) => {
      const c = await centro(s, 0.6);
      if (!c) throw new Error('No está ' + s);
      await pagina.mouse.move(c[0], c[1]);
      await pagina.mouse.down();
      await pagina.mouse.move(c[0] + dx, c[1] + dy, { steps: 16 });
      await espera(350);
      if (nombre) await foto(nombre);
      await pagina.mouse.up();
      await pagina.mouse.move(1, 1);
    };
    const opcion = async (texto) => { await pagina.locator('.dt-menu button', { hasText: texto }).first().click(); await pagina.mouse.move(1, 1); };

    // 1. «Listo» y «Siguiente» arriba del teclado de números.
    await det('ventana');
    await espera(1700);
    await foto('detalles-01-ventana-listo');
    await tocar('.dt-tk-num .dt-tk:nth-child(2)');
    await espera(700);
    await foto('detalles-01-ventana-escrito');
    await tocar('.dt-tk-boton');
    await espera(800);
    await foto('detalles-01-ventana-bajo');
    await det('peso');
    await espera(1700);
    await foto('detalles-01-peso-listo');
    await det('medidas');
    await espera(1700);
    await foto('detalles-01-medidas-siguiente');
    await tocar('.dt-tk-boton');
    await espera(1100);
    await foto('detalles-01-medidas-cuello');
    await det('enfocar', '.mas-campo[data-sitio="muslo"] input');
    await espera(1400);
    await foto('detalles-01-medidas-listo');
    await det('crear');
    await espera(1900);
    await foto('detalles-01-crear-siguiente');
    await det('enfocar', '.hj-etiqueta input[data-clave="sodio"]');
    await espera(1500);
    await foto('detalles-01-crear-listo');
    await det('enfocar', '.hj-etiqueta input[data-clave="nombre"]');
    await espera(1200);
    await foto('detalles-01-crear-letras');
    await idioma('en');
    await det('ventana');
    await espera(1700);
    await foto('detalles-01-ventana-ingles');
    await det('medidas');
    await espera(1700);
    await foto('detalles-01-medidas-ingles');
    await idioma('es');
    await det('bajarTeclado');
    await pagina.evaluate(() => { window.__mas('cerrar'); window.__comida('cerrar'); });
    await espera(700);

    // 2. Mantener apretado en Comida: lo apretado se levanta y sale el menú; copiar, mover y borrar, con «Deshacer».
    await pestana(1);
    await comida('dia', 0);
    await comida('bajar', 'dia');
    await espera(700);
    await mantenerEn('.comida .cm-tarjeta:not(.vacia) li.cm-item:nth-child(1)', 'detalles-02-menu');
    await espera(400);
    await opcion('Copiar a');
    await espera(700);
    await foto('detalles-02-copiar-a');
    await opcion('Mañana');
    await espera(500);
    await foto('detalles-02-copiar-manana');
    await opcion('Cena');
    await espera(1300);
    await foto('detalles-02-copiado');
    await det('mantenerLaComida', 'almuerzo');
    await espera(1100);
    await foto('detalles-02-comida-menu');
    await opcion('Mover a');
    await espera(700);
    await foto('detalles-02-mover-a');
    await pagina.evaluate(() => window.__detalles('cerrarMenu'));
    await espera(600);
    await det('mantenerAlimento', 'Puré de papas');
    await espera(1000);
    await opcion('Borrar');
    await espera(1000);
    await foto('detalles-02-borrado');
    await tocar('.comida .cm-aviso-btn');
    await espera(1000);
    await foto('detalles-02-deshecho');
    await idioma('en');
    await comida('bajar', 'dia');
    await det('mantenerAlimento', 'Mashed potatoes');
    await espera(1100);
    await foto('detalles-02-menu-ingles');
    await opcion('Copy to');
    await espera(700);
    await foto('detalles-02-copiar-a-ingles');
    await pagina.evaluate(() => window.__detalles('cerrarMenu'));
    await espera(500);
    await idioma('es');

    // 3. Deslizar a la izquierda un alimento: abierto, pasado el tope (con el dedo abajo) y borrado.
    await comida('bajar', 'dia');
    await espera(500);
    await deslizarEn('.comida .cm-tarjeta:not(.vacia) li.cm-item:nth-child(2)', -70, 0);
    await espera(500);
    await foto('detalles-03-abierta');
    await deslizarEn('.comida .cm-tarjeta:not(.vacia) li.cm-item:nth-child(3)', -235, 0, 'detalles-03-tope');
    await espera(1100);
    await foto('detalles-03-borrada');

    // 4. Cambiar y borrar lo guardado: una comida, una receta y un alimento tuyo; borrar, y la fila se cierra.
    await det('guardadas');
    await espera(1700);
    await foto('detalles-04-editar-comida');
    await det('editarGuardada', ['receta', 0]);
    await espera(1200);
    await foto('detalles-04-editar-receta');
    await det('editarGuardada', ['propio', 0]);
    await espera(1200);
    await foto('detalles-04-editar-alimento');
    await det('editarGuardada', ['comida', 0]);
    await espera(1200);
    await det('borrarGuardada');
    await espera(420);
    await foto('detalles-04-borrando');
    await espera(1000);
    await foto('detalles-04-borrada');
    await comida('cerrar');
    await espera(700);

    // 5. La hoja para otro día: ayer, con la cena que se arma y el botón; y mañana, con las comidas que faltan.
    await det('ayer');
    await espera(1300);
    await foto('detalles-05-hoja-ayer');
    await comida('ficha', 'Helado de vainilla');
    await espera(700);
    await comida('sumar');
    await espera(900);
    await foto('detalles-05-bandeja-ayer');
    await comida('listo');
    await espera(800);
    await foto('detalles-05-revision-ayer');
    await comida('confirmar');
    await espera(900);
    await comida('bajar', 'ahora');
    await espera(500);
    await foto('detalles-05-agregado-ayer');
    await det('manana');
    await espera(1300);
    await foto('detalles-05-manana');
    // Con el dedo: «Agregar» en la merienda que falta abre la hoja de mañana.
    await tocar('.comida .cm-tarjeta.vacia .cm-accion.principal');
    await espera(1300);
    await foto('detalles-05-hoja-manana');
    await comida('cerrar');
    await espera(700);
    await idioma('en');
    await det('ayer');
    await espera(1100);
    await comida('ficha', 'Banana');
    await espera(600);
    await comida('sumar');
    await espera(700);
    await comida('listo');
    await espera(800);
    await foto('detalles-05-revision-ingles');
    await comida('cerrar');
    await espera(600);
    await idioma('es');
    await comida('dia', 0);

    // 6. Restar un vaso de agua: mantener apretado el agua, en Inicio y en el «+».
    await det('agua');
    await espera(1300);
    await mantenerEn('.inicio .in-agua .in-vasos');
    await espera(160);
    await foto('detalles-06-inicio-quitado');
    // Que el aviso de Inicio se vaya solo antes de abrir el «+», así no quedan dos iguales en la foto.
    await espera(4300);
    await det('aguaMas');
    await espera(1200);
    await mantenerEn('.mas .mas-agua');
    await espera(250);
    await foto('detalles-06-mas-quitado');
    await mas('cerrar');
    await espera(600);

    // 7. «Atrás» en el cuestionario: la flecha a la altura del paso y lo que pasa al tocarla.
    await det('atras');
    await espera(2600);
    await foto('detalles-07-atras');
    await tocar('.ent-pantalla:not(.saliendo) .ent-atras');
    await espera(380);
    await foto('detalles-07-volviendo');
    await espera(1500);
    await foto('detalles-07-anterior');
    await idioma('en');
    await det('atras');
    await espera(2600);
    await foto('detalles-07-atras-ingles');
    await idioma('es');
    await pagina.evaluate(() => window.__entrada(null));
    await espera(800);

    // 8. La franja bajo la hora: con todo arriba no se ve; al hacer scroll, separa lo que pasa por debajo.
    for (const [i, nombre, scroll, y] of [[0, 'inicio', '.in-scroll', 0], [0, 'inicio', '.in-scroll', 150], [1, 'comida', '.cm-scroll', 320], [2, 'progreso', '.pg-scroll', 260], [3, 'sueno', '.sn-scroll', 240], [5, 'perfil', '.pf-scroll', 300]]) {
      await pestana(i);
      await pagina.evaluate(([s, v]) => { document.querySelector(s).scrollTop = v; }, [scroll, y]);
      await espera(500);
      await foto(`detalles-08-${nombre}${y ? '' : '-arriba'}`);
      await pagina.evaluate((s) => { document.querySelector(s).scrollTop = 0; }, scroll);
    }

    // 9. Las esperas: «Entrando…», borrar la cuenta y cerrar sesión (la alerta y el velo) y exportar.
    await det('apple');
    await espera(3000);
    await tocar('.ent-apple');
    await espera(450);
    await foto('detalles-09-entrando');
    await espera(500);
    await pagina.evaluate(() => window.__entrada(null));
    await espera(800);
    await det('borrarCuenta');
    await espera(700);
    await foto('detalles-09-alerta-borrar');
    await tocar('.dt-alerta-botones .peligro');
    await espera(700);
    await foto('detalles-09-borrando');
    await espera(3200);
    await det('cerrarSesion');
    await espera(700);
    await foto('detalles-09-alerta-cerrar');
    await tocar('.dt-alerta-botones .peligro');
    await espera(700);
    await foto('detalles-09-cerrando');
    await espera(3200);
    // Baja hasta «Exportar todo» y la toca: la ruedita en vez de «CSV».
    await det('exportar');
    await espera(900);
    await foto('detalles-09-exportando');
    await espera(1600);

    // 10. Sueño y Hábitos: «Cancelar» en la hora (de una noche y de la pregunta de la mañana), tirar para volver a
    // leer Salud y un día sin hábitos.
    await det('cancelar');
    await espera(1400);
    await foto('detalles-10-cancelar');
    await sueno('hora', 'proponer');
    await sueno('editarHora');
    await sueno('subir');
    await espera(900);
    await foto('detalles-10-cancelar-manana');
    await pagina.evaluate(() => window.__aparato('reloj'));
    await pestana(3);
    await sueno('subir');
    await espera(700);
    const arriba = await centro('.sueno .sn-scroll');
    await pagina.mouse.move(arriba[0], 260);
    await pagina.mouse.down();
    // Pasado el umbral (unos 125 px de dedo, como iOS): la ruedita entera y, al soltar, lee.
    await pagina.mouse.move(arriba[0], 430, { steps: 18 });
    await espera(300);
    await foto('detalles-10-tirando');
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await espera(500);
    await foto('detalles-10-leyendo');
    // «Al día con Salud» dura un segundo: la foto, apenas aparece (el render por software es lento y una espera fija se lo perdía).
    await pagina.waitForSelector('.dt-tirar.listo', { timeout: 6000 }).catch(() => {});
    await espera(200);
    await foto('detalles-10-al-dia');

    // 11. Perfil: lo que cambia ahí mismo, sin la flecha de entrar: la llave se mueve al tocar la fila, y los
    // números y las unidades cambian su valor.
    await det('perfil');
    await espera(900);
    await foto('detalles-11-perfil');
    await tocar('[data-fila="mejorarBase"] .pf-fila');
    await espera(130);
    await foto('detalles-11-llave');
    await espera(600);
    await tocar('[data-fila="mejorarBase"] .pf-fila');
    await espera(600);
    await tocar('[data-fila="numeros"] .pf-fila');
    await espera(450);
    await foto('detalles-11-numeros');
    await tocar('[data-fila="numeros"] .pf-fila');
    await espera(700);
    await pagina.evaluate(() => window.__perfil('bajar', '[data-fila="unidades"]'));
    await espera(600);
    await foto('detalles-11-unidades');
    await pagina.evaluate(() => window.__perfil('subir'));
    await pagina.evaluate(() => window.__accion('reiniciar'));
    await espera(800);
    await pestana(0);
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
