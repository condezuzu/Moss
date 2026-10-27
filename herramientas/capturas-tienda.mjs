// Las capturas para la App Store (spec/revision.md, «e) Las capturas»): las pantallas 1 a 7 de la
// tabla, sacadas de la galería con la persona de mentira, con el texto arriba en la serif de Moss y
// la pantalla abajo, en los dos tamaños de iPhone y en español e inglés.
// Uso: npm run galeria && npm run galeria:ver   (en otra terminal)
//      npm run tienda:capturas                       todas
//      node herramientas/capturas-tienda.mjs <carpeta> 1 7   solo esas pantallas
// Deja capturas/tienda/<ancho>x<alto>/<es|en>/NN-nombre.png (PNG sin transparencia, al tamaño
// exacto) y, aparte, lo capturado sin componer en capturas/tienda/crudas/.
// Corre en primer plano: de fondo, el cielo (WebGL por software) sale negro.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const salida = process.argv[2] || 'capturas/tienda';
const elegidas = process.argv.slice(3).map(Number);
const URL = process.env.GALERIA_URL || 'http://localhost:4173/';

// Los dos tamaños que pide Apple hoy: el viewport en puntos del iPhone, a 3×.
const TAMANOS = [
  { ancho: 440, alto: 956 }, // 6,9": iPhone 16, 17 y 18 Pro Max → 1320 × 2868
  { ancho: 402, alto: 874 }, // Dynamic Island mediana: iPhone 16 Pro, 17 y 18 Pro → 1206 × 2622
];
const ESCALA = 3;
const IDIOMAS = ['es', 'en'];

const comida = (p, accion, arg) => p.evaluate(([a, x]) => window.__comida(a, x), [accion, arg]);
const pestana = async (p, i) => {
  await p.evaluate((n) => window.__pagina(n, true), i);
  await p.waitForTimeout(400);
};
const esperarA = (p, condicion, arg) => p.waitForFunction(condicion, arg, { polling: 200, timeout: 30000 });
const sinAvisos = (p) => esperarA(p, () => !document.querySelector('.hj-aviso.visible, .cm-aviso.visible, .mas-aviso.visible'));
const etiquetasUbicadas = (p) => esperarA(p, () => [...document.querySelectorAll('.etiquetas .etq')].every((e) => e.style.transform));

// La etiqueta de la galería está escrita en español; en inglés se muestra una de allá, con los
// mismos números (es lo que leería el teléfono de alguien que compra en inglés).
const ETIQUETA_EN = [
  'NUTRITION FACTS', 'Serving size 30 g (5 cookies)', 'Amount per serving %DV*', 'Calories 140',
  'Total Carbohydrate 20 g 7%', 'Protein 2.4 g', 'Total Fat 5.6 g 7%', 'Saturated Fat 2.5 g 13%', 'Trans Fat 0 g',
  'Dietary Fiber 0.9 g 3%', 'Sodium 105 mg 5%',
];

// Las pantallas, en el orden de la tienda: las tres primeras se ven en la búsqueda.
const PANTALLAS = [
  {
    n: 1, nombre: 'inicio', fondo: true,
    texto: { es: 'Lo que te queda hoy, de un vistazo', en: 'What’s left today, at a glance' },
    async armar(p) {
      await p.evaluate(() => window.__kcal('luna'));
      await pestana(p, 0);
      await p.waitForTimeout(1500);
    },
  },
  {
    n: 2, nombre: 'registrar',
    texto: { es: 'Registra en pocos toques', en: 'Log food in a few taps' },
    // La hoja de registro con la cena que se arma abajo (lo de siempre y una ensalada) y una búsqueda.
    async armar(p, idioma) {
      await pestana(p, 1);
      await p.waitForTimeout(900);
      await comida(p, 'registrar');
      await p.waitForTimeout(1000);
      await comida(p, 'agregar');
      await p.waitForTimeout(700);
      await comida(p, 'sumar');
      await p.waitForTimeout(500);
      await comida(p, 'ficha', 'Ensalada mixta');
      await p.waitForTimeout(700);
      await comida(p, 'sumar');
      await p.waitForTimeout(500);
      await comida(p, 'escribir', idioma === 'en' ? 'chicken' : 'pollo');
      await sinAvisos(p);
      await p.waitForTimeout(700);
    },
  },
  {
    n: 3, nombre: 'decir',
    texto: { es: 'Dilo y queda anotado', en: 'Say it, and it’s logged' },
    // Desde el «+»: lo dicho (en la galería se escribe solo) y los alimentos que entendió.
    async armar(p) {
      await pestana(p, 1);
      await p.evaluate(() => window.__mas('abrir'));
      await p.waitForTimeout(900);
      await p.evaluate(() => document.querySelector('.mas-decir').click());
      await esperarA(p, () => !!document.querySelector('.hj-decir .dc-bloque'));
      await p.waitForTimeout(1000);
    },
  },
  {
    n: 4, nombre: 'etiqueta',
    texto: { es: 'Escanea el código o la etiqueta', en: 'Scan the barcode or the label' },
    // La revisión de lo leído en la foto de la etiqueta, con el nombre ya escrito.
    async armar(p, idioma) {
      await pestana(p, 1);
      await comida(p, 'registrar');
      await p.waitForTimeout(700);
      await comida(p, 'etiqueta');
      await p.waitForTimeout(900);
      await p.fill('.hj-etiqueta input[data-clave="nombre"]', idioma === 'en' ? 'Oat cookies' : 'Galletas de avena');
      if (idioma === 'en') {
        await p.evaluate((lineas) => {
          document.querySelectorAll('.hj-etiqueta .et-foto > div').forEach((d, i) => { d.textContent = lineas[i] ?? ''; });
        }, ETIQUETA_EN);
      }
      await p.evaluate(() => document.activeElement && document.activeElement.blur());
      await p.waitForTimeout(500);
    },
  },
  {
    n: 5, nombre: 'progreso', fondo: true,
    texto: { es: 'Metas que se ajustan cada semana', en: 'Targets that adjust every week' },
    async armar(p) {
      await pestana(p, 2);
      await p.evaluate(() => window.__progreso('subir'));
      await p.waitForTimeout(900);
    },
  },
  {
    n: 6, nombre: 'sueno', fondo: true,
    texto: { es: 'Tu sueño, con reloj o sin él', en: 'Your sleep, with or without a watch' },
    // Anoche con el reloj, con la pregunta de la mañana ya contestada («Bien»).
    async armar(p) {
      await p.evaluate(() => window.__aparato('reloj'));
      await pestana(p, 3);
      await p.evaluate(() => window.__sueno('noche', 0));
      await p.waitForTimeout(700);
      await p.click('.sn-cara:nth-child(4)');
      await p.mouse.move(1, 1);
      await p.waitForTimeout(1800);
      await p.evaluate(() => window.__sueno('subir'));
      await p.waitForTimeout(500);
    },
  },
  {
    n: 7, nombre: 'habitos',
    texto: { es: 'Cada hábito es una estrella', en: 'Every habit is a star' },
    cielo: true,
    // El día completo: la constelación que se conecta y la aurora que sube. Se espera a que se asiente
    // (la aurora más suave y los nombres de las estrellas que se leen): la animación avanza por cuadros,
    // y por software van unos 11 por segundo, así que se cuentan los cuadros además del tiempo.
    async armar(p) {
      await pestana(p, 4);
      await etiquetasUbicadas(p);
      await p.waitForTimeout(1500);
      await p.evaluate(() => window.__accion('completar'));
      await Promise.all([
        p.waitForTimeout(20000),
        p.evaluate(() => new Promise((listo) => {
          let n = 0;
          const cuadro = () => (++n >= 220 ? listo() : requestAnimationFrame(cuadro));
          requestAnimationFrame(cuadro);
        })),
      ]);
    },
  },
];

// Lo que diga el nombre o el correo de quien hizo la persona de mentira, cambiado en la página.
async function limpiar(p) {
  await p.evaluate(() => {
    const recorrer = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = recorrer.nextNode(); n; n = recorrer.nextNode()) {
      if (/Agust[íi]n/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/Agust[íi]n/g, 'Lucía');
      if (/\S+@\S+\.\S+/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/\S+@\S+\.\S+/g, '');
    }
  });
}

/** El brillo medio y el máximo (0 a 255) de una franja de la imagen: sin el cielo dibujado, el fondo es parejo y oscuro. */
function brillo(png, desde, hasta) {
  const { width, data } = PNG.sync.read(png);
  const y0 = Math.round(desde * (data.length / 4 / width));
  const y1 = Math.round(hasta * (data.length / 4 / width));
  let suma = 0;
  let n = 0;
  let maximo = 0;
  for (let y = y0; y < y1; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      suma += l;
      maximo = Math.max(maximo, l);
      n++;
    }
  }
  return { medio: suma / n, maximo };
}
// La franja de arriba, donde va la isla: ahí no hay interfaz, así que se ven las estrellas del cielo o nada.
const ARRIBA = 0.06;
const hayEstrellas = (png) => brillo(png, 0, ARRIBA).maximo > 20;
/** Espera a que el lienzo del cielo haya dibujado (el primer cuadro por software puede tardar varios segundos). */
async function esperarCielo(p) {
  for (let i = 0; i < 40; i++) {
    if (hayEstrellas(await p.screenshot())) return;
    await p.waitForTimeout(750);
  }
  throw new Error('el cielo no se dibujó');
}

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];
const problemas = [];

/** Una pantalla de la galería en un navegador nuevo, armada y lista: así ningún estado se arrastra. */
async function capturar(tamano, idioma, pantalla) {
  const contexto = await navegador.newContext({ viewport: { width: tamano.ancho, height: tamano.alto }, deviceScaleFactor: ESCALA, locale: idioma === 'en' ? 'en-US' : 'es-UY' });
  const p = await contexto.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errores.push(`${pantalla.nombre} ${idioma}: ${m.text()}`); });
  p.on('pageerror', (e) => errores.push(`${pantalla.nombre} ${idioma}: ${e}`));
  try {
    await p.goto(URL);
    await p.click('#b-inmersivo');
    // El mouse, afuera: si no, lo que quede abajo de él se ve como si se estuviera por tocar.
    await p.mouse.move(1, 1);
    // Los márgenes de un iPhone 16 Pro o Pro Max (la isla arriba, la barra de inicio abajo). El teclado
    // de mentira de la galería, guardado, deja una franja gris abajo de las hojas: en el teléfono no está.
    await p.addStyleTag({ content: '.barra-inmersiva{display:none!important} .tel.inmersivo{--arriba:62px!important;--abajo:28px!important} .hoja:not(.con-teclado) .hj-teclado{padding:0!important}' });
    await p.waitForTimeout(2000);
    await esperarCielo(p);
    if (idioma === 'en') {
      await p.evaluate(() => window.__idioma('en'));
      await p.waitForTimeout(500);
    }
    await pantalla.armar(p, idioma);
    await limpiar(p);
    let foto = await p.screenshot();
    // Con el render por software, el cielo puede atrasarse: se espera a verlo antes de quedarse con la foto.
    const dibujado = (f) => (pantalla.cielo ? brillo(f, 0.15, 0.75).medio > 14 : !pantalla.fondo || hayEstrellas(f));
    for (let intento = 0; !dibujado(foto) && intento < 10; intento++) {
      await p.waitForTimeout(1500);
      foto = await p.screenshot();
    }
    if (!dibujado(foto)) throw new Error('el cielo no se dibujó');
    return foto;
  } finally {
    await contexto.close();
  }
}

// ------------------------------------------------------------ la imagen de la tienda
// Fondo: el azul noche de Moss (src/tema.ts) en un degradé suave, sin estrellas. Arriba el texto en
// Cormorant Garamond, color pergamino; abajo la pantalla, con el borde y las esquinas de un iPhone.
function html(ancho, alto, texto, idioma) {
  const letra = Math.round(ancho * 0.08);
  const arribaTexto = Math.round(alto * 0.058);
  const altoTexto = Math.round(alto * 0.142);
  const arribaTel = arribaTexto + altoTexto + Math.round(alto * 0.022);
  const abajoTel = Math.round(alto * 0.045);
  const borde = Math.round(ancho * 0.0125);
  const altoPantalla = alto - arribaTel - abajoTel - 2 * borde;
  const escala = altoPantalla / (alto / ESCALA);
  const anchoPantalla = Math.round((ancho / ESCALA) * escala);
  // Las esquinas y la isla de un iPhone 16 Pro, en puntos, llevadas a la pantalla achicada.
  const radio = Math.round(55 * escala);
  return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&display=block">
<style>
  html, body { margin: 0; width: ${ancho}px; height: ${alto}px; overflow: hidden; }
  body {
    position: relative;
    background:
      radial-gradient(90% 42% at 50% 0%, rgba(22, 41, 90, 0.55) 0%, rgba(22, 41, 90, 0) 100%),
      linear-gradient(180deg, #0d1a38 0%, #070d1f 48%, #03050c 100%);
  }
  h1 {
    position: absolute; left: 0; right: 0; top: ${arribaTexto}px; height: ${altoTexto}px; margin: 0;
    padding: 0 ${Math.round(ancho * 0.09)}px; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center; text-align: center; text-wrap: balance;
    font: 500 ${letra}px/1.06 'Cormorant Garamond', serif; letter-spacing: -0.005em; color: #efe6cf;
  }
  .tel {
    position: absolute; top: ${arribaTel}px; left: 50%; transform: translateX(-50%);
    padding: ${borde}px; border-radius: ${radio + borde}px; background: #090b11;
    box-shadow: 0 0 0 ${Math.max(2, Math.round(ancho * 0.0015))}px rgba(239, 230, 207, 0.13), 0 ${Math.round(alto * 0.012)}px ${Math.round(alto * 0.04)}px rgba(0, 0, 0, 0.55);
  }
  .tel img { display: block; width: ${anchoPantalla}px; height: ${altoPantalla}px; border-radius: ${radio}px; }
  .isla {
    position: absolute; left: 50%; top: ${borde + Math.round(11 * escala)}px; transform: translateX(-50%);
    width: ${Math.round(126 * escala)}px; height: ${Math.round(37 * escala)}px; border-radius: 999px; background: #000;
  }
</style></head><body>
<h1>${texto}</h1>
<div class="tel"><img id="pantalla" alt=""><div class="isla"></div></div>
</body></html>`;
}

async function componer(pagina, ancho, alto, texto, idioma, foto) {
  await pagina.setContent(html(ancho, alto, texto, idioma), { waitUntil: 'networkidle' });
  await pagina.evaluate(async (src) => {
    const img = document.getElementById('pantalla');
    img.src = src;
    await img.decode();
    await document.fonts.load("500 100px 'Cormorant Garamond'", 'Moss');
    await document.fonts.ready;
  }, 'data:image/png;base64,' + foto.toString('base64'));
  // El texto tiene que estar en la serif de Moss y entrar entero en su lugar.
  const medida = await pagina.evaluate(() => {
    const h = document.querySelector('h1');
    return { serif: document.fonts.check("500 100px 'Cormorant Garamond'"), sobra: h.scrollHeight > h.clientHeight + 1 || h.scrollWidth > h.clientWidth + 1 };
  });
  if (!medida.serif) throw new Error('no cargó Cormorant Garamond');
  if (medida.sobra) problemas.push(`«${texto}» no entra en su lugar`);
  const png = PNG.sync.read(await pagina.screenshot());
  if (png.width !== ancho || png.height !== alto) throw new Error(`salió de ${png.width}×${png.height}`);
  // Sin canal alfa: App Store Connect rechaza las capturas con transparencia.
  return PNG.sync.write(png, { colorType: 2, inputHasAlpha: true });
}

const pantallas = PANTALLAS.filter((x) => !elegidas.length || elegidas.includes(x.n));
for (const tamano of TAMANOS) {
  const ancho = tamano.ancho * ESCALA;
  const alto = tamano.alto * ESCALA;
  const compositor = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  for (const idioma of IDIOMAS) {
    const carpeta = join(salida, `${ancho}x${alto}`, idioma);
    const crudas = join(salida, 'crudas', `${ancho}x${alto}`, idioma);
    mkdirSync(carpeta, { recursive: true });
    mkdirSync(crudas, { recursive: true });
    for (const pantalla of pantallas) {
      const archivo = `${String(pantalla.n).padStart(2, '0')}-${pantalla.nombre}.png`;
      let foto;
      try {
        foto = await capturar(tamano, idioma, pantalla);
      } catch (e) {
        // Una vez más, de cero: el render por software a veces se queda atrás.
        console.log(`  ${archivo} (${ancho}x${alto} ${idioma}): ${e.message}; otra vez`);
        foto = await capturar(tamano, idioma, pantalla);
      }
      writeFileSync(join(crudas, archivo), foto);
      writeFileSync(join(carpeta, archivo), await componer(compositor, ancho, alto, pantalla.texto[idioma], idioma, foto));
      console.log('·', `${ancho}x${alto}/${idioma}/${archivo}`);
    }
  }
  await compositor.close();
}
await navegador.close();
if (problemas.length) console.log('Para revisar:\n' + problemas.join('\n'));
if (errores.length) {
  console.log('Errores en la consola:\n' + errores.join('\n'));
  process.exit(1);
}
