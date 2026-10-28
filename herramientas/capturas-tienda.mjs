// Las capturas para la App Store (spec/revision.md, «e) Las capturas»), sacadas de la APP DE VERDAD
// en la web (Skia es CanvasKit) con una persona inventada, Lucía: tres semanas de comidas, pesadas y
// noches. Cada pantalla va dentro de un iPhone dibujado, con un texto corto arriba en la serif de
// Moss, sobre el azul noche, en los dos tamaños que pide App Store Connect y en español e inglés.
// Uso: npm run web:exportar && npm run web:ver   (en otra terminal)
//      npm run tienda:capturas                       todas
//      node herramientas/capturas-tienda.mjs <carpeta> 1 3   solo esas pantallas
// Deja capturas/tienda/<ancho>x<alto>/<es|en>/NN-nombre.png (PNG RGB sin alfa, al tamaño exacto),
// lo capturado sin componer en capturas/tienda/crudas/ y las vistas chicas en JPEG para la galería
// en capturas/tienda/vista/ (npm run galeria las embebe en la sección «Tienda»).
// Corre en primer plano: de fondo, el cielo (WebGL por software) sale negro.
//
// Lo que la web dibuja distinto del iPhone se corrige antes de cada foto, y solo eso:
// - los márgenes de la isla y de la barra de inicio (en la web, env(safe-area-inset-*) da 0);
// - los SF Symbols, que en la web son letras de reemplazo o nada (los de la barra y los de los hábitos), van dibujados
//   en línea fina como en el iPhone;
// - la sombra de una vista sin fondo, que en iOS sigue la forma de lo que tiene adentro y en la web
//   es un rectángulo;
// - el panel de prueba del cielo, que en la web siempre está y en la build de la tienda no.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { PNG } from 'pngjs';

const salida = process.argv[2] || 'capturas/tienda';
const elegidas = process.argv.slice(3).map(Number);
const URL = process.env.APP_URL || 'http://localhost:4174/';
const TEXTOS = { es: JSON.parse(readFileSync('src/textos/es.json', 'utf8')), en: JSON.parse(readFileSync('src/textos/en.json', 'utf8')) };
const tx = (idioma, clave) => clave.split('.').reduce((o, k) => o[k], TEXTOS[idioma]);

// Los dos tamaños que pide Apple hoy: el viewport en puntos del iPhone, a 3×, con sus márgenes.
const TAMANOS = [
  { ancho: 440, alto: 956, arriba: 62, abajo: 34 }, // 6,9": iPhone 16, 17 y 18 Pro Max → 1320 × 2868
  { ancho: 402, alto: 874, arriba: 62, abajo: 34 }, // Dynamic Island mediana: iPhone 16 Pro, 17 y 18 Pro → 1206 × 2622
];
const ESCALA = 3;
// Con IDIOMA=es o TAMANO=1320 (para probar), solo ese.
const IDIOMAS = ['es', 'en'].filter((i) => !process.env.IDIOMA || process.env.IDIOMA === i);

// ------------------------------------------------------------ Lucía
// Lo que come, de la base de alimentos de la app (public/alimentos.json, la que usa la web): cada
// alimento con su porción y sus valores, como los guarda un registro.
const { alimentos } = JSON.parse(readFileSync('public/alimentos.json', 'utf8'));
const porId = new Map(alimentos.map((a) => [a.id, a]));
function item(id, veces, idioma) {
  const a = porId.get(id);
  if (!a) throw new Error(`No está el alimento ${id} en public/alimentos.json`);
  const [es, en, gramos] = a.p[0];
  const k = (gramos * veces) / 100;
  const r = (n) => Math.round(n * 10) / 10;
  const valores = { kcal: Math.round(a.v[0] * k), proteina: r(a.v[1] * k), carbohidratos: r(a.v[2] * k), grasas: r(a.v[3] * k) };
  ['fibra', 'azucares', 'saturadas', 'sodio', 'alcohol'].forEach((c, i) => { if (a.s?.[i] != null) valores[c] = r(a.s[i] * k); });
  return { fuente: 'base', ref: String(id), nombre: idioma === 'en' ? a.en : a.es, cantidad: { porcion: idioma === 'en' ? en : es, gramosPorcion: gramos, veces }, valores };
}
// Sin bebidas alcohólicas. Rotan entre días; hoy falta la cena, que es la que se registra.
const MENUS = {
  desayuno: [[[2705418, 1], [169705, 1], [171688, 1]], [[2710384, 1], [-6018, 1]], [[2705422, 1], [173944, 1]]],
  almuerzo: [[[-8224, 1], [171688, 1]], [[-8289, 1], [169105, 2]], [[-8225, 1]], [[-8291, 1], [173944, 1]]],
  merienda: [[[-8645, 1], [-8084, 2]], [[2705427, 1]], [[2710384, 1], [-8609, 1]]],
  cena: [[[2706286, 1.5], [170434, 1], [169967, 2]], [[-8030, 1]], [[-8255, 1], [-8080, 1]], [[-8012, 1], [-8038, 1]]],
};
const HORAS = { desayuno: [8, 5], almuerzo: [13, 10], merienda: [17, 35], cena: [21, 15] };
const menus = (idioma) => Object.fromEntries(Object.entries(MENUS).map(([c, ms]) => [c, ms.map((m) => m.map(([id, veces]) => item(id, veces, idioma)))]));

/** Se guarda en el navegador antes de la primera carga, con el formato de src/almacen/abrir.web.ts. */
function sembrar([menus, horas]) {
  const d = new Date();
  const clave = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  const momento = d.toISOString();
  const haceDias = (n, h = 0, m = 0) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n, h, m);
  // Siete semanas pesándose casi día por medio: de 71,8 kg a unos 69,6, con lo que sube y baja un peso.
  const pesos = Array.from({ length: 50 }, (_, i) => ({ fecha: clave(haceDias(49 - i)), kg: Math.round((71.8 - i * 0.055 + Math.sin(i * 1.7) * 0.35) * 10) / 10, origen: 'manual', momento }))
    .filter((_, i) => i % 2 === 0 || i > 40);
  const registros = [];
  for (let i = 21; i >= 0; i--) {
    const dia = haceDias(i);
    for (const [comida, opciones] of Object.entries(menus)) {
      if (i === 0 && comida === 'cena') continue;
      opciones[(i + comida.length) % opciones.length].forEach((it, n) => {
        registros.push({ ...it, id: `lucia-${clave(dia)}-${comida}-${n}`, dia: clave(dia), comida, momento: haceDias(i, ...horas[comida]).toISOString(), planificado: false, actualizado: momento });
      });
    }
  }
  // Sin reloj: las noches que estimó Moss y ella confirmó, de unas 7 h 40 a 8 h 10.
  const noches = Array.from({ length: 14 }, (_, i) => ({
    fecha: clave(haceDias(i)),
    hora: { dormirse: haceDias(i + 1, 23, 2 + (i % 3) * 9).toISOString(), despertar: haceDias(i, 7, 8 + ((i * 5) % 4) * 6).toISOString(), origen: 'confirmada', confianza: 'alta' },
    actualizado: momento,
  }));
  localStorage.setItem('moss:datos', JSON.stringify({
    perfil: { sexo: 'f', alturaCm: 166, actividad: 'algo', objetivo: 'bajar', ritmo: 'recomendado', nacimiento: d.getFullYear() - 31, pesoMeta: 65, actualizado: momento },
    pesos,
    registros,
    noches,
    metas: [{ desde: clave(haceDias(49)), kcal: 1750, proteina: 125, carbohidratos: 185, grasas: 58, gasto: 2150, motivo: 'inicial', momento }],
    // Sin la entrada hecha en este teléfono, la app vuelve a la entrada aunque haya perfil. La semilla,
    // fija: el mismo cielo en los dos idiomas. Con esta, la primera de seis estrellas es la Lira (el
    // miércoles de los hábitos de ejemplo), la de cinco Casiopea y la de cuatro el Cuervo.
    ajustes: { entrada: 'hecha', semilla: 'lucia-13', nombre: JSON.stringify({ valor: 'Lucía', actualizado: momento }) },
  }));
}

/** Los márgenes de un iPhone con isla: safe-area-context los lee de un div con env(), que en la web da 0. */
function margenesDelIphone([arriba, abajo]) {
  const original = window.getComputedStyle;
  window.getComputedStyle = function (el, ...resto) {
    const estilo = original.call(this, el, ...resto);
    if (el && el.style && /safe-area-inset-top/.test(el.style.paddingTop)) {
      return new Proxy(estilo, { get: (o, k) => ({ paddingTop: `${arriba}px`, paddingBottom: `${abajo}px`, paddingLeft: '0px', paddingRight: '0px' })[k] ?? (typeof o[k] === 'function' ? o[k].bind(o) : o[k]) });
    }
    return estilo;
  };
}

// Una zona horaria donde ahora sean las ocho y pico de la noche: el día tiene desayuno, almuerzo y
// merienda, y la comida de la hora es la cena (con el reloj de verdad, sin congelarlo).
function zonaDeLaNoche() {
  const ahora = new Date();
  let corrida = Math.round(20.6 - (ahora.getUTCHours() + ahora.getUTCMinutes() / 60));
  if (corrida > 14) corrida -= 24;
  if (corrida < -12) corrida += 24;
  return corrida === 0 ? 'Etc/GMT' : `Etc/GMT${corrida > 0 ? '-' : '+'}${Math.abs(corrida)}`;
}

// ------------------------------------------------------------ los SF Symbols, en línea fina
// En 24 × 24, con trazo; los rellenos llevan «R:» adelante.
const SIMBOLOS = {
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  xmark: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  magnifyingglass: 'M10.5 4a6.5 6.5 0 1 0 0 13a6.5 6.5 0 1 0 0-13zM15.3 15.3L20 20',
  mic: 'M12 3a3 3 0 0 1 3 3v5.5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM6 11a6 6 0 0 0 12 0M12 17v3.5',
  barcode: 'M4 8V5.5C4 4.7 4.7 4 5.5 4H8M16 4h2.5c.8 0 1.5.7 1.5 1.5V8M20 16v2.5c0 .8-.7 1.5-1.5 1.5H16M8 20H5.5C4.7 20 4 19.3 4 18.5V16M8 8.5v7M10.5 8.5v7M13 8.5v7M16 8.5v7',
  doctexto: 'M4 8V5.5C4 4.7 4.7 4 5.5 4H8M16 4h2.5c.8 0 1.5.7 1.5 1.5V8M20 16v2.5c0 .8-.7 1.5-1.5 1.5H16M8 20H5.5C4.7 20 4 19.3 4 18.5V16M9 9h6M9 12h6M9 15h4',
  copiar: 'M9 9h10v11H9zM5 15V4h10',
  bookmark: 'M7 4h10v16l-5-3.6L7 20z',
  bolt: 'M13.5 3L5.5 13.5H11L10 21l8.5-10.5H13z',
  camara: 'M4 8h3.5L9 5.5h6L16.5 8H20v11H4zM12 10a3.3 3.3 0 1 0 0 6.6a3.3 3.3 0 1 0 0-6.6z',
  star: 'M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z',
  starFill: 'R:M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.6L12 16.7l-5.1 2.7 1-5.6-4.1-4 5.7-.8z',
  izquierda: 'M15 5l-7 7 7 7',
  derecha: 'M9 5l7 7-7 7',
  checkmark: 'M5 12.5l4.5 4.5L19 7',
  trash: 'M5 7h14M9.5 7V5h5v2M7 7l1 13h8l1-13M10.5 10.5v6M13.5 10.5v6',
  tenedor: 'M7 3v6.5c0 1.4 1 2.5 2.5 2.5S12 10.9 12 9.5V3M9.5 3v18M17 21V3c-2 1.2-3 3.5-3 6.5V13h3',
  balanza: 'M12 4v3M5 7h14M7 7l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3zM17 7l-3 7c0 1.7 1.3 3 3 3s3-1.3 3-3zM8 20h8',
  gota: 'M12 3.5c3 4 5.5 7.2 5.5 10.2a5.5 5.5 0 0 1-11 0c0-3 2.5-6.2 5.5-10.2z',
  regla: 'M4 12h16M4 8v8M8 12v-2M12 12v-3M16 12v-2M20 8v8',
  compartir: 'M12 3v12M8 7l4-4 4 4M6 11v9h12v-9',
  calendario: 'M4.5 6h15v13.5h-15zM4.5 10h15M8 3.5V7M16 3.5V7M8 13.5h1.5M11.3 13.5h1.5M14.6 13.5h1.5M8 16.5h1.5M11.3 16.5h1.5',
  deshacer: 'M9 5L5 9l4 4M5 9h9.5a4.5 4.5 0 0 1 0 9H11',
  lista: 'M9 6h11M9 12h11M9 18h11M4.5 6h.5M4.5 12h.5M4.5 18h.5',
  lapiz: 'M16 4.5l3.5 3.5L8.5 19H5v-3.5zM14 6.5l3.5 3.5',
  destellos: 'R:M10 3.5l1.6 4.9 4.9 1.6-4.9 1.6L10 16.5l-1.6-4.9-4.9-1.6 4.9-1.6zM17.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  llama: 'M12 3.5c.5 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 0 2 1 3 2 3.5 0-3-1-6 .5-9z',
  corazon: 'M12 19.5s-7.5-4.5-7.5-10A4 4 0 0 1 12 7.2 4 4 0 0 1 19.5 9.5c0 5.5-7.5 10-7.5 10z',
  corazonLleno: 'R:M12 19.5s-7.5-4.5-7.5-10A4 4 0 0 1 12 7.2 4 4 0 0 1 19.5 9.5c0 5.5-7.5 10-7.5 10z',
  carrito: 'M3.5 4.5h2.5l2.2 10.5h9.6l1.7-7.5H7M9.5 19.5h.1M16.5 19.5h.1',
  // La barra de abajo.
  casa: 'M4 10.5L12 4l8 6.5M6 9v10.5h4.5V14h3v5.5H18V9',
  grafico: 'M4 4v16h16M7.5 15l3.5-4 3 2.5 5-6M16 7.5h3v3',
  luna: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z',
  constelacion: 'M5 17.5a1.6 1.6 0 1 0 0 .1zM12 6a1.6 1.6 0 1 0 0 .1zM19 15a1.6 1.6 0 1 0 0 .1zM6.2 16.2l1-1.4M8.3 13.2l1-1.4M10.4 10.2l.6-1M13.3 7.8l.9 1.5M15.2 10.8l.9 1.5M17.1 13.8l.4.6',
  persona: 'M12 4a3.8 3.8 0 1 0 0 7.6A3.8 3.8 0 1 0 12 4zM4.5 20c.6-3.8 3.7-6 7.5-6s6.9 2.2 7.5 6',
  // Los hábitos de ejemplo, al lado de su nombre en el cielo.
  meditar: 'M12 3a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM12 8.5v5M6 11l6 2 6-2M4.5 19c2.5-2 5-2.8 7.5-2.8s5 .8 7.5 2.8M8 16.5l4 1.8 4-1.8',
  libro: 'M12 6.5C10 5 7 4.8 4 5.3v13c3-.5 6-.3 8 1.2 2-1.5 5-1.7 8-1.2v-13c-3-.5-6-.3-8 1.2zM12 6.5v13',
  caminar: 'M13.5 3a1.8 1.8 0 1 0 0 3.6a1.8 1.8 0 1 0 0-3.6zM12.5 8.5l-2.5 5.5 3 2.5 1 5M12.5 8.5l2 4 3 1M10 14l-2 6.5M11.5 9.5l-3 1.5-1 3',
};
// Las letras de reemplazo de la web (src/secciones/comida/comunes.tsx, EN_LA_WEB) y su símbolo.
const DE_LA_LETRA = {
  '+': 'plus', '−': 'minus', '×': 'xmark', '⌕': 'magnifyingglass', '▥': 'barcode', '▤': 'doctexto', '⧉': 'copiar', '❏': 'bookmark', 'ϟ': 'bolt',
  '◉': 'camara', '☆': 'star', '★': 'starFill', '‹': 'izquierda', '›': 'derecha', '✓': 'checkmark', '⌫': 'trash', '⑂': 'tenedor', '⚖': 'balanza',
  '◖': 'gota', '⊢': 'regla', '⇪': 'compartir', '▦': 'calendario', '↶': 'deshacer', '≡': 'lista', '✎': 'lapiz', '✦': 'destellos', '♨': 'llama',
  '♡': 'corazon', '♥': 'corazonLleno', '⊔': 'carrito',
};
// La barra, en el orden de src/secciones/Barra.tsx.
const DE_LA_BARRA = ['casa', 'tenedor', 'grafico', 'luna', 'constelacion', 'persona'];
// El ícono de cada hábito (el SF Symbol de src/almacen/semilla.ts) y su dibujo.
const DEL_HABITO = { 'figure.mind.and.body': 'meditar', moon: 'luna', book: 'libro', pencil: 'lapiz', 'figure.walk': 'caminar', drop: 'gota' };

/** Lo que la web dibuja distinto del iPhone (ver arriba), justo antes de la foto. */
function comoEnElIphone({ simbolos, deLaLetra, deLaBarra, delHabito, decir, diagnostico }) {
  const svg = (nombre, tam, color, grueso = 1.6) => {
    const d = simbolos[nombre];
    const relleno = d.startsWith('R:');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${tam}" height="${tam}" style="display:block;overflow:visible" fill="${relleno ? color : 'none'}" stroke="${relleno ? 'none' : color}" stroke-width="${grueso}" stroke-linecap="round" stroke-linejoin="round"><path d="${relleno ? d.slice(2) : d}"/></svg>`;
  };
  // Las letras de reemplazo: un div con el ancho igual al alto de línea, centrado, con una sola letra.
  for (const el of document.querySelectorAll('div')) {
    if (el.children.length || el.dataset.simbolo) continue;
    const letra = el.textContent.trim();
    let nombre = deLaLetra[letra];
    if (letra === '·' && el.closest(`[aria-label="${decir}"]`)) nombre = 'mic';
    if (!nombre) continue;
    const cs = getComputedStyle(el);
    const alto = parseFloat(cs.lineHeight);
    if (cs.textAlign !== 'center' || !(Math.abs(parseFloat(cs.width) - alto) < 1.5)) continue;
    el.dataset.simbolo = nombre;
    el.innerHTML = svg(nombre, alto * (nombre === 'plus' || nombre === 'minus' || nombre === 'xmark' ? 0.95 : 1.05), cs.color, alto < 15 ? 2 : 1.6);
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
  }
  // El ícono de cada hábito al lado de su nombre en el cielo: en la web no se dibuja.
  let habitos = [];
  try {
    habitos = JSON.parse(localStorage.getItem('moss:datos')).habitos ?? [];
  } catch {
    // Sin hábitos guardados no hay etiquetas.
  }
  const iconoDe = new Map(habitos.map((h) => [h.nombre, delHabito[h.icono]]));
  for (const el of document.querySelectorAll('div')) {
    const nombre = !el.children.length && iconoDe.get(el.textContent);
    const fila = el.parentElement;
    if (!nombre || !fila || getComputedStyle(fila).flexDirection !== 'row' || fila.querySelector(':scope > [data-simbolo]')) continue;
    const icono = document.createElement('div');
    icono.dataset.simbolo = nombre;
    icono.innerHTML = svg(nombre, 11, getComputedStyle(el).color, 1.8);
    fila.insertBefore(icono, el);
  }
  // La barra: en la web sus íconos no se dibujan (no tienen letra de reemplazo).
  document.querySelectorAll('[role="tab"]').forEach((pestana, i) => {
    const nombre = deLaBarra[i];
    for (const capa of pestana.querySelectorAll(':scope > div > div, :scope > div')) {
      const texto = [...capa.children].find((c) => !c.children.length && c.textContent.trim());
      if (!texto || capa.querySelector(':scope > [data-simbolo]')) continue;
      const icono = document.createElement('div');
      icono.dataset.simbolo = nombre;
      icono.innerHTML = svg(nombre, 21, getComputedStyle(texto).color, 1.3);
      capa.insertBefore(icono, texto);
    }
  });
  // La sombra de una vista sin fondo: en iOS sigue lo que tiene adentro (el brillo de la pestaña elegida).
  for (const el of document.querySelectorAll('div')) {
    const cs = getComputedStyle(el);
    if (cs.boxShadow === 'none' || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)) continue;
    const m = cs.boxShadow.match(/^(rgba?\([^)]*\)) (-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/);
    el.style.boxShadow = 'none';
    if (m) el.style.filter = `drop-shadow(${m[2]}px ${m[3]}px ${Number(m[4]) / 2}px ${m[1]})`;
  }
  // El borde del foco del navegador: en el iPhone no está.
  const sinFoco = document.createElement('style');
  sinFoco.textContent = '*, *:focus, *:focus-visible { outline: none !important; }';
  document.head.appendChild(sinFoco);
  // El panel de prueba del cielo.
  for (const el of document.querySelectorAll('div')) {
    if (!el.children.length && diagnostico.some((r) => new RegExp(r).test(el.textContent))) {
      (el.closest('[role="button"]') ?? el).style.visibility = 'hidden';
    }
  }
}

// ------------------------------------------------------------ las pantallas
// Las tres primeras se ven en los resultados de búsqueda.
const PANTALLAS = [
  {
    n: 1, nombre: 'registrar',
    texto: { es: 'Anota tu comida en segundos', en: 'Log your meals in seconds' },
    // La hoja de registro de la cena: dos alimentos ya sumados abajo y la búsqueda del tercero.
    async armar(p, idioma) {
      const en = idioma === 'en';
      await pestana(p, 1);
      // Desde el «+» y no desde la tarjeta de la cena, que corre Comida hacia abajo.
      await p.getByLabel(tx(idioma, 'pestanas.mas'), { exact: true }).last().click();
      await p.waitForTimeout(1200);
      await p.getByText(tx(idioma, 'mas.agregarComida'), { exact: true }).first().click();
      await p.waitForTimeout(1500);
      const buscar = p.getByLabel(tx(idioma, 'comida.buscar')).first();
      for (const [q, nombre] of en ? [['salmon', 'Salmon'], ['baked potato', 'Baked potato']] : [['salmón', 'Salmón'], ['papa al horno', 'Papa al horno']]) {
        await buscar.fill(q);
        await p.waitForTimeout(1200);
        await p.getByRole('button', { name: new RegExp(`^${nombre}`) }).first().click();
        await p.waitForTimeout(1300);
        await botonMasAncho(p, tx(idioma, 'comida.sumar'));
        await p.waitForTimeout(1300);
      }
      await buscar.fill(en ? 'salad' : 'ensalada');
      await p.waitForTimeout(1800);
    },
  },
  {
    n: 2, nombre: 'cielo',
    texto: { es: 'Cada hábito, una estrella', en: 'Every habit is a star' },
    cielo: true,
    // Hábitos con la constelación de hoy: se tocan las estrellas como con el dedo. Las que se encienden
    // solas (los pasos y el sueño, de Salud) no llegan a la web: las prende «Completar el día» del
    // panel de prueba, y así el día queda completo, como cuando llegan de Salud.
    async armar(p, idioma) {
      await pestana(p, 4);
      await esperarCielo(p);
      const cielo = await p.evaluate(() => globalThis.__cielo);
      for (const [i, h] of cielo.habitos.entries()) {
        if (h.auto) continue;
        await p.mouse.click(...cielo.estrellas[i]);
        await p.waitForTimeout(1600);
      }
      const panel = p.getByText(new RegExp(diagnostico.join('|'))).first();
      await panel.click();
      await p.getByText(tx(idioma, 'diagnostico.completar'), { exact: true }).click();
      await panel.click();
      await p.mouse.move(1, 1);
      // Se espera a que el día esté completo (lo dice la cabecera para VoiceOver), a que se vaya el
      // aviso de lo encendido desde Salud (las capturas no muestran Salud) y a que la constelación
      // termine de conectarse y la aurora de subir: por software van unos 10 cuadros por segundo, así
      // que se cuentan cuadros además del tiempo.
      const completo = tx(idioma, 'cielo.completa');
      await p.waitForFunction((c) => [...document.querySelectorAll('[aria-label]')].some((el) => el.getAttribute('aria-label').includes(c)), completo, { timeout: 90000 });
      const salud = tx(idioma, 'cielo.desdeSalud').replace('{habito} · ', '');
      await p.waitForFunction((s) => !document.body.innerText.includes(s), salud, { timeout: 60000, polling: 300 });
      await Promise.all([
        p.waitForTimeout(18000),
        p.evaluate(() => new Promise((listo) => {
          let n = 0;
          const cuadro = () => (++n >= 260 ? listo() : requestAnimationFrame(cuadro));
          requestAnimationFrame(cuadro);
        })),
      ]);
      await p.waitForFunction((s) => !document.body.innerText.includes(s), salud, { timeout: 60000, polling: 300 });
    },
  },
  {
    n: 3, nombre: 'sueno',
    texto: { es: 'Tu sueño, noche a noche', en: 'Your sleep, night by night' },
    async armar(p, idioma) {
      await pestana(p, 3);
      await p.getByRole('button', { name: tx(idioma, 'sueno.manana.caras.3'), exact: true }).first().click();
      await p.waitForTimeout(2500);
    },
  },
  {
    n: 4, nombre: 'inicio',
    texto: { es: 'Lo que te queda hoy', en: 'What’s left for today' },
    // Con tres hábitos ya tocados en el cielo, como a la noche: la tarjeta del cielo no queda vacía.
    async armar(p, idioma) {
      await pestana(p, 4);
      await esperarCielo(p);
      const cielo = await p.evaluate(() => globalThis.__cielo);
      const aMano = cielo.habitos.flatMap((h, i) => (h.auto ? [] : [i])).slice(0, 3);
      for (const i of aMano) {
        await p.mouse.click(...cielo.estrellas[i]);
        await p.waitForTimeout(1200);
      }
      await pestana(p, 0);
      await p.waitForTimeout(1500);
      // Con todos los bloques, la tarjeta del cielo queda cortada por la barra: como haría alguien
      // desde «Personalizar Inicio», se esconde el progreso al objetivo (Progreso ya lo muestra).
      await p.getByText(tx(idioma, 'inicio.personalizar'), { exact: true }).first().click();
      await p.waitForTimeout(1200);
      await p.getByRole('switch', { name: tx(idioma, 'inicio.bloques.objetivo') }).first().click();
      await p.waitForTimeout(500);
      await p.keyboard.press('Escape');
      await p.waitForTimeout(900);
      await p.mouse.move(p.viewportSize().width / 2, 400);
      await p.mouse.wheel(0, -3000);
      await p.waitForTimeout(900);
      await p.mouse.move(1, 1);
    },
  },
  {
    n: 5, nombre: 'decir',
    texto: { es: 'Dilo de una vez', en: 'Say it all at once' },
    // Desde el «+»: lo dicho (en la web, escrito) y los alimentos que entendió, antes de anotarlos.
    async armar(p, idioma) {
      await p.getByLabel(tx(idioma, 'pestanas.mas'), { exact: true }).last().click();
      await p.waitForTimeout(1200);
      await p.getByText(tx(idioma, 'mas.decir'), { exact: true }).first().click();
      await p.waitForTimeout(1500);
      await p.getByLabel(tx(idioma, 'comida.decir.titulo')).last().fill(idioma === 'en'
        ? 'a grilled chicken breast with mashed potatoes, a tomato salad and an apple'
        : 'una pechuga de pollo con puré, una ensalada de tomate y una manzana');
      await p.getByRole('button', { name: tx(idioma, 'comida.decir.entender') }).click();
      await p.waitForTimeout(3500);
      await p.evaluate(() => document.activeElement?.blur());
      await p.waitForTimeout(800);
    },
  },
  {
    n: 6, nombre: 'progreso',
    texto: { es: 'Tu progreso, semana a semana', en: 'Your progress, week by week' },
    async armar(p) {
      await pestana(p, 2);
    },
  },
];

const pestana = async (p, i) => {
  await p.getByRole('tab').nth(i).click();
  await p.waitForTimeout(2500);
};
/** El botón con ese nombre que más ocupa: el grande de abajo de la ventana del alimento, no el «+» de la barra. */
async function botonMasAncho(p, nombre) {
  const botones = p.getByRole('button', { name: nombre, exact: true });
  let mejor = null;
  for (let i = 0; i < (await botones.count()); i++) {
    const caja = await botones.nth(i).boundingBox();
    if (caja && (!mejor || caja.width > mejor.caja.width)) mejor = { i, caja };
  }
  if (!mejor) throw new Error(`no está el botón «${nombre}»`);
  await botones.nth(mejor.i).click();
}

/** El brillo medio (0 a 255) de una franja de la imagen. */
function brillo(png, desde, hasta) {
  const { width, height, data } = PNG.sync.read(png);
  let suma = 0;
  let n = 0;
  for (let y = Math.round(desde * height); y < Math.round(hasta * height); y += 3) {
    for (let x = 0; x < width; x += 3) {
      const i = (y * width + x) * 4;
      suma += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      n++;
    }
  }
  return suma / n;
}
/** El cielo está cuando el panel de prueba ya cuenta cuadros: el primero, por software, tarda. */
async function esperarCielo(p) {
  await p.waitForFunction(() => /cps ·|fps ·|En reposo ·|At rest ·/.test(document.body.innerText), null, { timeout: 90000 });
  await p.waitForTimeout(5000);
}

const navegador = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errores = [];
const problemas = [];
const zona = zonaDeLaNoche();
const diagnostico = ['es', 'en'].flatMap((i) => ['diagnostico.cuadros', 'diagnostico.reposo'].map((c) => tx(i, c).replace(/\{\w+\}/g, '.*')));

/** Una pantalla de la app en un navegador nuevo, con Lucía recién sembrada: así ningún estado se arrastra. */
async function capturar(tamano, idioma, pantalla) {
  const contexto = await navegador.newContext({
    viewport: { width: tamano.ancho, height: tamano.alto }, deviceScaleFactor: ESCALA, locale: idioma === 'en' ? 'en-US' : 'es-UY', timezoneId: zona,
  });
  const p = await contexto.newPage();
  p.on('pageerror', (e) => errores.push(`${pantalla.nombre} ${idioma}: ${e}`));
  try {
    await p.addInitScript(sembrar, [menus(idioma), HORAS]);
    await p.addInitScript(margenesDelIphone, [tamano.arriba, tamano.abajo]);
    await p.goto(URL);
    await p.getByRole('tab').first().waitFor({ timeout: 90000 });
    await p.waitForTimeout(4000);
    await pantalla.armar(p, idioma);
    await p.mouse.move(1, 1);
    await p.evaluate(comoEnElIphone, { simbolos: SIMBOLOS, deLaLetra: DE_LA_LETRA, deLaBarra: DE_LA_BARRA, delHabito: DEL_HABITO, decir: tx(idioma, 'comida.decir.titulo'), diagnostico });
    await p.waitForTimeout(300);
    let foto = await p.screenshot();
    // Con el render por software el cielo puede atrasarse: se espera a verlo.
    for (let intento = 0; pantalla.cielo && brillo(foto, 0.15, 0.7) < 14 && intento < 10; intento++) {
      await p.waitForTimeout(1500);
      foto = await p.screenshot();
    }
    if (pantalla.cielo && brillo(foto, 0.15, 0.7) < 14) throw new Error('el cielo no se dibujó');
    const texto = await p.evaluate(() => document.body.innerText);
    if (/Agust[íi]n|@\w+\.\w+/.test(texto)) problemas.push(`${pantalla.nombre} ${idioma}: aparece un nombre o un correo de verdad`);
    // Sin la app Salud en las capturas (spec/revision.md, «e»).
    if (texto.includes(tx(idioma, 'cielo.desdeSalud').replace('{habito} · ', ''))) problemas.push(`${pantalla.nombre} ${idioma}: se ve el aviso de Salud`);
    return foto;
  } finally {
    await contexto.close();
  }
}

// ------------------------------------------------------------ la imagen de la tienda
// La barra de estado del iPhone: la hora a la izquierda; la señal, el wifi y la batería a la derecha.
function barraDeEstado(e) {
  return `<svg class="estado" viewBox="0 0 402 62" preserveAspectRatio="xMidYMin meet" xmlns="http://www.w3.org/2000/svg">
    <text x="78" y="37" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="17" fill="#fff" letter-spacing="-0.2">9:41</text>
    <g fill="#fff" transform="translate(296 25)">
      <rect x="0" y="7.5" width="3.2" height="4.5" rx="1"/><rect x="4.8" y="5.3" width="3.2" height="6.7" rx="1"/><rect x="9.6" y="2.8" width="3.2" height="9.2" rx="1"/><rect x="14.4" y="0" width="3.2" height="12" rx="1"/>
    </g>
    <g transform="translate(323 25)" fill="#fff">
      <path d="M8.2 2.2c2.6 0 5 1 6.8 2.7l1.2-1.3C14.1 1.6 11.3.5 8.2.5S2.3 1.6.2 3.6l1.2 1.3C3.2 3.2 5.6 2.2 8.2 2.2z"/>
      <path d="M8.2 5.6c1.7 0 3.2.6 4.4 1.7l1.2-1.3C12.3 4.6 10.3 3.9 8.2 3.9S4.1 4.6 2.6 6l1.2 1.3c1.2-1.1 2.7-1.7 4.4-1.7z"/>
      <path d="M8.2 9c.8 0 1.5.3 2 .8L8.2 12 6.2 9.8c.5-.5 1.2-.8 2-.8z"/>
    </g>
    <g transform="translate(346 24.5)">
      <rect x="0.5" y="0.5" width="24" height="12" rx="3.8" fill="none" stroke="#fff" stroke-opacity="0.4"/>
      <rect x="2.2" y="2.2" width="19" height="8.6" rx="2.4" fill="#fff"/>
      <path d="M26.3 4.4v4.2c.8-.3 1.3-1.1 1.3-2.1s-.5-1.8-1.3-2.1z" fill="#fff" fill-opacity="0.45"/>
    </g>
  </svg>`.replace(/\n\s*/g, '');
}

// La serif de Moss, del mismo paquete que usa la app (la de Google Fonts pone mal el acento de «á»).
const SERIF = readFileSync('node_modules/@expo-google-fonts/cormorant-garamond/500Medium/CormorantGaramond_500Medium.ttf').toString('base64');

function html(ancho, alto, tamano, texto, idioma) {
  // El texto arriba; abajo, el iPhone entero, con sus botones de los costados.
  const arribaTexto = Math.round(alto * 0.06);
  const altoTexto = Math.round(alto * 0.115);
  const arribaTel = arribaTexto + altoTexto + Math.round(alto * 0.03);
  const altoTel = alto - arribaTel - Math.round(alto * 0.04);
  const pantallaPorTel = 0.958; // lo que ocupa la pantalla del alto del teléfono (el resto, el bisel y el marco)
  const altoPantalla = Math.round(altoTel * pantallaPorTel);
  const escala = altoPantalla / tamano.alto;
  const anchoPantalla = Math.round(tamano.ancho * escala);
  const bisel = Math.round((altoTel - altoPantalla) / 2 * 0.62);
  const marco = Math.round((altoTel - altoPantalla) / 2 - bisel);
  const radio = Math.round(55 * escala);
  const boton = (lado, top, largo) => `<div class="boton ${lado}" style="top:${Math.round(top * escala)}px;height:${Math.round(largo * escala)}px"></div>`;
  return `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@600&display=block">
<style>
  @font-face { font-family: 'Cormorant Garamond'; font-weight: 500; src: url(data:font/ttf;base64,${SERIF}) format('truetype'); }
  html, body { margin: 0; width: ${ancho}px; height: ${alto}px; overflow: hidden; }
  body {
    position: relative;
    background:
      radial-gradient(60% 34% at 50% 62%, rgba(22, 41, 90, 0.55) 0%, rgba(22, 41, 90, 0) 100%),
      radial-gradient(110% 40% at 50% 0%, rgba(22, 41, 90, 0.5) 0%, rgba(22, 41, 90, 0) 100%),
      linear-gradient(180deg, #0d1a38 0%, #070d1f 52%, #03050c 100%);
  }
  h1 {
    position: absolute; left: 0; right: 0; top: ${arribaTexto}px; height: ${altoTexto}px; margin: 0;
    padding: 0 ${Math.round(ancho * 0.08)}px; box-sizing: border-box;
    display: flex; align-items: center; justify-content: center; text-align: center; text-wrap: balance;
    font: 500 ${Math.round(ancho * 0.084)}px/1.05 'Cormorant Garamond', serif; letter-spacing: -0.003em; color: #efe6cf;
  }
  .tel {
    position: absolute; top: ${arribaTel}px; left: 50%; transform: translateX(-50%);
    padding: ${marco}px; border-radius: ${radio + bisel + marco}px;
    background: linear-gradient(145deg, #5a5d66 0%, #2b2e35 9%, #1b1d22 30%, #34373f 52%, #17181d 74%, #4a4d55 100%);
    box-shadow:
      inset 0 0 0 ${Math.max(1, Math.round(marco * 0.18))}px rgba(255, 255, 255, 0.10),
      0 ${Math.round(alto * 0.014)}px ${Math.round(alto * 0.045)}px rgba(0, 0, 0, 0.6),
      0 0 ${Math.round(alto * 0.06)}px rgba(22, 41, 90, 0.35);
  }
  .bisel { position: relative; padding: ${bisel}px; border-radius: ${radio + bisel}px; background: #000; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05); }
  .pantalla { position: relative; width: ${anchoPantalla}px; height: ${altoPantalla}px; border-radius: ${radio}px; overflow: hidden; background: #03050c; }
  .pantalla img { display: block; width: 100%; height: 100%; }
  .estado { position: absolute; left: 0; top: 0; width: 100%; height: ${Math.round(62 * escala)}px; }
  .isla {
    position: absolute; left: 50%; top: ${Math.round(11 * escala)}px; transform: translateX(-50%);
    width: ${Math.round(125 * escala)}px; height: ${Math.round(36.5 * escala)}px; border-radius: 999px; background: #000;
  }
  .inicio {
    position: absolute; left: 50%; bottom: ${Math.round(8 * escala)}px; transform: translateX(-50%);
    width: ${Math.round(140 * escala)}px; height: ${Math.max(3, Math.round(5 * escala))}px; border-radius: 999px; background: rgba(255, 255, 255, 0.82);
  }
  .boton { position: absolute; width: ${Math.max(4, Math.round(marco * 0.75))}px; background: linear-gradient(90deg, #2a2c32, #50535b 50%, #2a2c32); }
  .boton.izq { left: ${-Math.max(4, Math.round(marco * 0.75)) + 1}px; border-radius: 3px 0 0 3px; }
  .boton.der { right: ${-Math.max(4, Math.round(marco * 0.75)) + 1}px; border-radius: 0 3px 3px 0; }
</style></head><body>
<h1>${texto}</h1>
<div class="tel">
  ${boton('izq', 150, 34)}${boton('izq', 210, 62)}${boton('izq', 286, 62)}${boton('der', 232, 96)}${boton('der', 610, 58)}
  <div class="bisel"><div class="pantalla"><img id="pantalla" alt="">${barraDeEstado()}<div class="isla"></div><div class="inicio"></div></div></div>
</div>
</body></html>`;
}

async function componer(pagina, ancho, alto, tamano, texto, idioma, foto) {
  await pagina.setContent(html(ancho, alto, tamano, texto, idioma), { waitUntil: 'networkidle' });
  await pagina.evaluate(async (src) => {
    const img = document.getElementById('pantalla');
    img.src = src;
    await img.decode();
    await document.fonts.load("500 100px 'Cormorant Garamond'", 'Moss');
    await document.fonts.load("600 17px 'Inter'", '9:41');
    await document.fonts.ready;
  }, 'data:image/png;base64,' + foto.toString('base64'));
  // El texto tiene que estar en la serif de Moss y entrar entero en su lugar.
  const medida = await pagina.evaluate(() => {
    const h = document.querySelector('h1');
    const tel = document.querySelector('.tel').getBoundingClientRect();
    return { serif: document.fonts.check("500 100px 'Cormorant Garamond'"), sobra: h.scrollHeight > h.clientHeight + 1 || h.scrollWidth > h.clientWidth + 1, adentro: tel.bottom <= innerHeight && tel.left >= 0 };
  });
  if (!medida.serif) throw new Error('no cargó Cormorant Garamond');
  if (medida.sobra) problemas.push(`«${texto}» no entra en su lugar`);
  if (!medida.adentro) problemas.push(`el iPhone de «${texto}» se sale de la imagen`);
  const png = PNG.sync.read(await pagina.screenshot());
  if (png.width !== ancho || png.height !== alto) throw new Error(`salió de ${png.width}×${png.height}`);
  // Sin canal alfa: App Store Connect rechaza las capturas con transparencia.
  return PNG.sync.write(png, { colorType: 2, inputHasAlpha: true });
}

/** La vista chica para la galería, en JPEG: la galería es un solo HTML y tiene que pesar poco. */
async function vista(pagina, png, ancho) {
  await pagina.setContent(`<html><body style="margin:0;background:#03050c"><img id="v" style="display:block;width:${ancho}px"></body></html>`);
  const alto = await pagina.evaluate(async (src) => {
    const img = document.getElementById('v');
    img.src = src;
    await img.decode();
    return img.getBoundingClientRect().height;
  }, 'data:image/png;base64,' + png.toString('base64'));
  return pagina.screenshot({ type: 'jpeg', quality: 84, clip: { x: 0, y: 0, width: ancho, height: Math.floor(alto) } });
}

const pantallas = PANTALLAS.filter((x) => !elegidas.length || elegidas.includes(x.n));
const achicador = await navegador.newPage({ viewport: { width: 480, height: 1050 }, deviceScaleFactor: 1 });
mkdirSync(join(salida, 'vista'), { recursive: true });
for (const tamano of TAMANOS.filter((t) => !process.env.TAMANO || Number(process.env.TAMANO) === t.ancho * ESCALA)) {
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
        console.log(`  ${archivo} (${ancho}x${alto} ${idioma}): ${e.message.split('\n')[0]}; otra vez`);
        foto = await capturar(tamano, idioma, pantalla);
      }
      writeFileSync(join(crudas, archivo), foto);
      const final = await componer(compositor, ancho, alto, tamano, pantalla.texto[idioma], idioma, foto);
      writeFileSync(join(carpeta, archivo), final);
      // Las vistas de la galería, del tamaño grande (las del otro tamaño son la misma pantalla).
      if (tamano === TAMANOS[0]) writeFileSync(join(salida, 'vista', `${idioma}-${archivo.replace('.png', '.jpg')}`), await vista(achicador, final, 480));
      console.log('·', `${ancho}x${alto}/${idioma}/${archivo}`);
    }
  }
  await compositor.close();
}
// El ícono, para la sección «Tienda» de la galería (el de verdad es assets/images/icon.png, de herramientas/icono.mjs).
writeFileSync(join(salida, 'vista', 'icono.jpg'), await vista(achicador, readFileSync('assets/images/icon.png'), 400));
// Los textos, para la galería y para la ficha.
writeFileSync(join(salida, 'vista', 'textos.json'), JSON.stringify(PANTALLAS.map(({ n, nombre, texto }) => ({ n, nombre, texto })), null, 2));
await navegador.close();
if (problemas.length) console.log('Para revisar:\n' + problemas.join('\n'));
if (errores.length) {
  console.log('Errores en la página:\n' + [...new Set(errores)].join('\n'));
  process.exit(1);
}
