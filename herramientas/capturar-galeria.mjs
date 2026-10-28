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
    // La estrella guía: nace en el musgo, presenta la frase y espera abajo; si nadie la toca, abajo
    // dice «Toca la estrella». Tocarla es seguir.
    await pagina.evaluate(() => window.__accion('entrada'));
    await pagina.waitForTimeout(1200);
    await foto('entrada-frase-1200');
    await pagina.waitForTimeout(2600);
    await foto('entrada-frase-3800');
    await pagina.waitForTimeout(3200);
    await foto('entrada-frase-pista');
    for (const [paso, esperas] of [['habitos', [1500, 4500]], ['comida', [1600, 4200]], ['datos', [1500]], ['cuenta', [2800]], ['salud', [1900]], ['edad', [900]], ['sexo', [900]], ['peso', [900]], ['actividad', [900]], ['objetivo', [900]], ['resultado', [2600]]]) {
      await pagina.evaluate((p) => window.__entrada(p), paso);
      let t = 0;
      for (const ms of esperas) {
        await pagina.waitForTimeout(ms - t);
        t = ms;
        await foto(`entrada-${paso}-${ms}`);
      }
    }
    // Empezar: el flum hasta Inicio, y ahí suben los primeros hábitos.
    await pagina.click('.ent-resultado .ent-principal');
    for (const ms of [200, 420, 520, 750, 1400]) {
      await pagina.waitForTimeout(ms === 200 ? 200 : ms - [200, 420, 520, 750, 1400][[200, 420, 520, 750, 1400].indexOf(ms) - 1]);
      await foto('entrada-fin-' + ms);
    }
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
  // Con Ascent (spec/rendimiento.md): el rendimiento esperado, los músculos y la marca posible,
  // vinculada y sin vincular, y la línea del rendimiento en Sueño.
  async rendimiento() {
    await pagina.evaluate(() => window.__aparato('reloj'));
    await ascent('vincular', true);
    await ascent('abrir');
    await pagina.waitForTimeout(900);
    for (const [selector, nombre] of [['.as-rendimiento', 'rendimiento'], ['.as-musculos', 'rendimiento-musculos'], ['.as-pr', 'rendimiento-marca']]) {
      await ascent('bajar', selector);
      await pagina.waitForTimeout(500);
      await foto(nombre);
    }
    await pagina.click('.as-rendimiento .as-enlace');
    await ascent('bajar', '.as-rendimiento');
    await pagina.waitForTimeout(500);
    await foto('rendimiento-como');
    await pagina.click('.as-rendimiento .as-enlace');
    await ascent('cerrar');
    await pestana(3);
    await sueno('noche', 0);
    await sueno('subir');
    await pagina.waitForTimeout(700);
    await foto('rendimiento-en-sueno');
    await ascent('vincular', false);
    await ascent('abrir');
    await pagina.waitForTimeout(900);
    await ascent('bajar', '.as-rendimiento');
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
  // Ascent, arriba de Hábitos: la flecha, el gesto a mitad de camino (con el dedo todavía abajo),
  // sin vincular y vinculada, y lo que cambia en Inicio, Sueño y Perfil con el vínculo.
  async ascent() {
    await alCielo();
    await pagina.waitForTimeout(600);
    await foto('ascent-flecha');
    // Tocar la flecha también abre la sección.
    await pagina.click('.as-flecha');
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('ascent-flecha-tocada');
    await ascent('cerrar');
    await pagina.waitForTimeout(300);
    // Desde la barra no arranca: el borde de abajo es del gesto de inicio del iPhone.
    await pagina.mouse.move(196, 815);
    await pagina.mouse.down();
    await pagina.mouse.move(196, 560, { steps: 12 });
    await pagina.waitForTimeout(300);
    await foto('ascent-desde-la-barra');
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(600);
    await pagina.mouse.move(196, 640);
    await pagina.mouse.down();
    await pagina.mouse.move(196, 400, { steps: 12 });
    await pagina.waitForTimeout(400);
    await foto('ascent-subiendo');
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('ascent');
    // Para volver: arrastrarla para abajo desde arriba de todo.
    await pagina.mouse.move(196, 300);
    await pagina.mouse.down();
    await pagina.mouse.move(196, 560, { steps: 12 });
    await pagina.waitForTimeout(400);
    await foto('ascent-bajando');
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(900);
    await foto('ascent-de-vuelta');
    // Arrastrar el cielo para abajo sigue subiendo a tu universo.
    await pagina.mouse.move(196, 300);
    await pagina.mouse.down();
    await pagina.mouse.move(196, 560, { steps: 12 });
    await pagina.waitForTimeout(400);
    await foto('ascent-universo-sigue');
    await pagina.mouse.up();
    await pagina.mouse.move(1, 1);
    await pagina.waitForTimeout(1500);
    if (await pagina.evaluate(() => document.querySelector('#b-zona').textContent === 'Volver a hoy')) {
      await pagina.evaluate(() => window.__accion('zona'));
      await pagina.waitForTimeout(1500);
    }
    await ascent('abrir');
    await pagina.waitForTimeout(300);
    for (const [selector, nombre] of [['.as-grupo', 'ascent-bloqueadas'], ['.as-anio', 'ascent-bloqueadas-2']]) {
      await ascent('bajar', selector);
      await pagina.waitForTimeout(300);
      await foto(nombre);
    }
    await ascent('subir');
    // La hoja de vincular (D27): con la sesión de Ascent en el llavero, sin sesión, sin Ascent y sin
    // la cuenta de Moss; un error del servidor y entrar con la cuenta de Ascent.
    await hojaDeVincular();
    await ascent('vincular', true);
    await pagina.waitForTimeout(1700);
    await foto('ascent-vinculada');
    for (const [selector, nombre] of [['.as-gimnasio', 'ascent-gimnasio'], ['.as-recuperacion', 'ascent-vinculada-2'], ['.as-estanc', 'ascent-vinculada-3'], ['.as-funciones', 'ascent-vinculada-4']]) {
      await ascent('bajar', selector);
      await pagina.waitForTimeout(300);
      await foto(nombre);
    }
    // El gimnasio que se enciende solo: sumarlo con un toque.
    await ascent('bajar', '.as-gimnasio');
    await pagina.click('.as-gimnasio-sumar');
    await pagina.waitForTimeout(700);
    await foto('ascent-gimnasio-sumado');
    // Con pocas semanas, «Por qué no subes» todavía junta información.
    await ascent('pocas', true);
    await ascent('bajar', '.as-estanc');
    await pagina.waitForTimeout(300);
    await foto('ascent-juntando');
    await ascent('pocas', false);
    await ascent('subir');
    await ascent('cerrar');
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
    await pagina.getByRole('button', { name: 'Pesarme a la mañana' }).click();
    await pagina.waitForTimeout(600);
    await foto('avisos-horario');
    await pagina.getByRole('button', { name: 'Horario de comidas' }).click();
    await pagina.getByRole('button', { name: 'Pesarme a la mañana' }).click();
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
    await pagina.evaluate(() => document.querySelector('.pf-scroll').scrollTo(0, 0));
    await pestana(0);
  },
  async 'ascent-ingles'() {
    await pagina.evaluate(() => window.__idioma('en'));
    await ascent('abrir');
    await pagina.waitForTimeout(500);
    await foto('ascent-ingles');
    await hojaDeVincular('-ingles');
    await ascent('vincular', true);
    await pagina.waitForTimeout(1700);
    await foto('ascent-vinculada-ingles');
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
