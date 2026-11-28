// «¿Por qué?» dentro de Ascent (28/11/2026, para aprobar). Lo pediste el 27/11: «En qué se basa» «está muy aburrido»;
// el 28/11 aclaraste que es el de la sección de Ascent, el plegable debajo de cada bloque (EnQueSeBasa en
// src/secciones/ascent/Vinculada.tsx), no la página de Perfil. Cada uno pasa a ser «¿Por qué?» y, al tocarlo, crece ahí
// mismo y empuja suave lo de abajo: un dibujo con tus datos, la cadena de 30-base-con-dibujos (tu dato, la regla y lo
// que se sabe), el sello de siempre y las fuentes plegadas en una línea.
// Nada nuevo: cada cifra está en ascent.baseDe.* (src/textos), en base.js (los sellos y las fuentes con su enlace) o en
// spec/estudio/vinculo-ascent.md; los datos son los de AscentDeMentira, el día de fábrica ('cargado').
// Los sellos: la franja de 10 a 20 es una convención (Decisión de Moss); la fatiga, una estimación; lo demás, razonable.

const SELLOS_PQA = { solido: 4, razonable: 3, estimacion: 2, decision: 1 };

// Las fuentes: las de base.js por su área y su lugar; las dos que base.js no trae, con lo que dice ascent.baseDe.
const FUENTES_PQA = {
  pelland: { base: ['ascent', 1] },
  heaselgrave: { quien: 'Heaselgrave', anio: '2019', es: 'En entrenados, 9, 18 o 27 series por semana dieron lo mismo', en: 'In trained people, 9, 18 or 27 sets a week did the same' },
  hellard: { base: ['ascent', 4] },
  sayers: { base: ['ascent', 5] },
  grgic: { base: ['ascent', 2] },
  morton: { base: ['metas', 3] },
  latella: { base: ['ascent', 3] },
  swinton: { quien: 'Swinton', anio: '2024', es: 'Cada uno sube distinto: por eso, un rango', en: 'Everyone progresses differently: hence a range' },
};

// Cada bloque: su sello, sus fuentes y, por idioma, los tres nudos (con los datos de hoy, `x`).
const BLOQUES_PQA = [
  { de: 'musculos', sello: 'decision', fuentes: ['pelland', 'heaselgrave'] },
  { de: 'fatigados', sello: 'estimacion', fuentes: ['hellard', 'sayers'] },
  { de: 'estancados', sello: 'razonable', fuentes: ['grgic'] },
  { de: 'porQue', sello: 'razonable', fuentes: ['pelland', 'morton'] },
  { de: 'metas', sello: 'razonable', fuentes: ['latella', 'swinton'] },
];

const TEXTOS_PQA = {
  es: {
    porQue: '¿Por qué?',
    nudos: ['Tu dato', 'La regla', 'Lo que se sabe'],
    fuentes: (n) => (n === 1 ? '1 fuente' : `${n} fuentes`),
    hoy: 'Hoy',
    ayer: 'Ayer',
    musculos: (x) => [
      { cifra: x.poco, texto: 'músculos a los que les faltan series' },
      { cifra: '10–20', texto: 'series duras por semana: con 3 de sobra o menos' },
      { cifra: '9 · 18 · 27', texto: 'series dieron lo mismo en entrenados: es una convención' },
    ],
    fatigados: (x) => [
      { cifra: x.series, u: 'series', texto: `${x.cuando}, ${x.alFallo} al fallo` },
      { cifra: x.total, u: 'días', texto: x.total >= 3 ? 'al fallo, en un ejercicio grande de piernas' : 'al fallo' },
      { cifra: '±1', u: 'día', texto: 'cada uno se recupera distinto: es un estimado' },
    ],
    estancados: (x) => [
      { cifra: x.semanas, u: 'semanas', texto: `de ${x.ejercicio} sin subida clara` },
      { cifra: '8', u: 'semanas', texto: 'de datos, como mínimo, para decirlo' },
      { cifra: '±3 %', texto: 'cambia la fuerza de un día a otro, sin motivo' },
    ],
    porQueBloque: (x) => [
      { cifra: `${x.antes} → ${x.ahora}`, texto: x.que },
      { cifra: x.razones, u: 'razones', texto: 'de la más sólida a la menos' },
      { cifra: '67', u: 'estudios', texto: 'las series pesan más. Es probable, no seguro.' },
    ],
    metas: (x) => [
      { cifra: x.hoy, u: 'kg', texto: `levantarías hoy en ${x.ejercicio}` },
      { cifra: '12', u: 'semanas', texto: 'de tendencia: tu ritmo más rápido y el más lento' },
      { cifra: '~1 %', u: 'por mes', texto: 'se sube con años entrenando; cada uno, distinto' },
    ],
    e: { minimo: '8 semanas, como mínimo', hace12: 'hace 12 semanas', ruido: '±3 %', margen: '±1 día' },
  },
  en: {
    porQue: 'Why?',
    nudos: ['Your data', 'The rule', 'What’s known'],
    fuentes: (n) => (n === 1 ? '1 source' : `${n} sources`),
    hoy: 'Today',
    ayer: 'Yesterday',
    musculos: (x) => [
      { cifra: x.poco, texto: 'muscles that need more sets' },
      { cifra: '10–20', texto: 'hard sets a week: 3 reps or fewer to spare' },
      { cifra: '9 · 18 · 27', texto: 'sets did the same in trained people: it’s a convention' },
    ],
    fatigados: (x) => [
      { cifra: x.series, u: 'sets', texto: `${x.cuando}, ${x.alFallo} to failure` },
      { cifra: x.total, u: 'days', texto: x.total >= 3 ? 'to failure on a big leg exercise' : 'to failure' },
      { cifra: '±1', u: 'day', texto: 'everyone recovers differently: it’s an estimate' },
    ],
    estancados: (x) => [
      { cifra: x.semanas, u: 'weeks', texto: `of ${x.ejercicio} with no clear rise` },
      { cifra: '8', u: 'weeks', texto: 'of data, at least, before saying so' },
      { cifra: '±3%', texto: 'is how much strength moves day to day, for no reason' },
    ],
    porQueBloque: (x) => [
      { cifra: `${x.antes} → ${x.ahora}`, texto: x.que },
      { cifra: x.razones, u: 'reasons', texto: 'from most to least solid' },
      { cifra: '67', u: 'studies', texto: 'sets matter most. Likely, not certain.' },
    ],
    metas: (x) => [
      { cifra: x.hoy, u: 'kg', texto: `you’d lift today in the ${x.ejercicio}` },
      { cifra: '12', u: 'weeks', texto: 'of trend: your fastest pace and your slowest' },
      { cifra: '~1%', u: 'a month', texto: 'after years of training; everyone differs' },
    ],
    e: { minimo: '8 weeks, at least', hace12: '12 weeks ago', ruido: '±3%', margen: '±1 day' },
  },
};

// La paleta de la sección de Ascent (as-vars): casi negro, tinta y grises; terracota (--as-lejos) solo en tus datos.
const CSS_PQA = `
.tel .pr-pantalla.pqa { color: var(--as-tinta); background: var(--as-fondo); }
/* Lo que se desliza se apaga debajo de la hora. */
.tel .pr-pantalla.pqa::before { content: ''; position: absolute; z-index: 1; left: 0; right: 0; top: 0; height: calc(var(--arriba) + 8px); background: linear-gradient(180deg, var(--as-fondo) 72%, rgba(5, 6, 10, 0)); pointer-events: none; }
.pqa-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: calc(var(--arriba) + 4px) 22px calc(var(--pestanas) + 40px); }
.pqa-scroll::-webkit-scrollbar { display: none; }
.pqa-scroll.entra > * { animation: pqa-ap 0.3s ease both; }
.pqa button { -webkit-tap-highlight-color: transparent; }
.pqa :focus-visible { outline: 2px solid var(--as-sub); outline-offset: 2px; }
.pqa-marca { margin: 10px 0 0; font: 500 13px/1.2 var(--texto); letter-spacing: 0.2em; text-transform: uppercase; color: var(--as-lejos); }
.pqa-intro { margin: 10px 0 0; font: 400 17px/1.4 var(--texto); color: var(--as-tinta); text-wrap: pretty; }

.pqa-bloque { margin: 16px -22px 0; padding: 18px 22px 2px; border-top: 1px solid var(--as-linea); }
.pqa-etq { margin: 0; font: 500 13px/1.25 var(--texto); letter-spacing: 0.12em; text-transform: uppercase; color: var(--as-sub); }
.pqa-linea { margin: 8px 0 0; font: 400 15.5px/1.4 var(--texto); color: var(--as-tinta); text-wrap: pretty; font-variant-numeric: tabular-nums; }
.pqa-abrir { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin: 2px 0 0 -4px; padding: 0 10px 0 4px; border: 0; background: none; color: var(--as-sub); font: 400 15px/1 var(--texto); transition: color 0.2s ease; }
.pqa-abrir svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.36s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqa-abrir[aria-expanded='true'] { color: var(--as-tinta); }
.pqa-abrir[aria-expanded='true'] svg { rotate: 180deg; }
.pqa-abrir:active { opacity: 0.6; }
.pqa-pliegue { overflow: hidden; }
.pqa-pliegue[hidden] { display: none; }
.pqa-dentro { padding: 4px 0 6px; transform-origin: 0 0; }

/* Lo de hoy, en la app: los párrafos, para comparar. */
.pqa-parrafo { margin: 0 0 10px; font: 400 13px/1.42 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.pqa-parrafo b { font-weight: 500; color: var(--as-tinta); }

/* El dibujo, sobre una lámina apenas más clara. */
.pqa-lamina { padding: 14px 12px 10px; border-radius: 16px; background: rgba(232, 236, 246, 0.035); }
.pqa-dib { display: block; width: 100%; height: auto; overflow: visible; fill: none; }
.pqa-dib .e { stroke: rgba(170, 178, 196, 0.38); stroke-width: 1; }
.pqa-dib .l { stroke: var(--as-tinta); stroke-width: 1.5; stroke-linecap: round; }
.pqa-dib .ls { stroke: rgba(170, 178, 196, 0.6); stroke-width: 1.2; stroke-linecap: round; }
.pqa-dib .ld { stroke: rgba(232, 236, 246, 0.7); stroke-width: 1.3; stroke-dasharray: 3 3; }
.pqa-dib .lp { stroke: rgba(232, 236, 246, 0.62); stroke-width: 1.5; stroke-dasharray: 0.1 4; stroke-linecap: round; }
.pqa-dib .a { stroke: var(--as-lejos); stroke-width: 1.7; stroke-linecap: round; }
.pqa-dib .fb { fill: rgba(232, 236, 246, 0.08); }
.pqa-dib .fa { fill: rgba(203, 133, 105, 0.2); }
.pqa-dib .r { fill: var(--as-tinta); }
.pqa-dib .rm { fill: rgba(232, 236, 246, 0.42); }
.pqa-dib .ra { fill: var(--as-lejos); }
.pqa-dib .aro { fill: var(--as-fondo); stroke: var(--as-sub); stroke-width: 1.4; }
.pqa-dib text { font: 400 13px var(--texto); fill: var(--as-sub); stroke: none; }
.pqa-dib text.n { font-family: var(--numeros); font-variant-numeric: tabular-nums; }
.pqa-dib text.f { fill: var(--as-tinta); }
.pqa-dib text.o { fill: var(--as-lejos); }
.pqa-dib text.t { fill: var(--as-apagado); }
/* Al abrirse, se dibuja: tz se traza, ap aparece, cx y cy crecen, pt salta; --i es el turno. */
.pqa-dib .tz { stroke-dasharray: 1; }
.pqa-dib .cx, .pqa-dib .cy, .pqa-dib .pt { transform-box: fill-box; }
.pqa-dib .cx { transform-origin: left center; }
.pqa-dib .cy { transform-origin: center bottom; }
.pqa-dib .pt { transform-origin: center; }
.pqa-dib.vista .tz { animation: pqa-tz 0.7s cubic-bezier(0.3, 0.6, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 120ms); }
.pqa-dib.vista .ap, .pqa-dib.vista text { animation: pqa-ap 0.5s ease backwards; animation-delay: calc(var(--i, 6) * 70ms + 120ms); }
.pqa-dib.vista .cx { animation: pqa-cx 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 120ms); }
.pqa-dib.vista .cy { animation: pqa-cy 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 120ms); }
.pqa-dib.vista .pt { animation: pqa-pt 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 70ms + 120ms); }

/* La cadena: tu dato, la regla y lo que se sabe, que se encienden en orden. */
.pqa-cadena { display: grid; grid-template-columns: 1fr 1fr 1.18fr; column-gap: 12px; margin-top: 18px; }
.pqa-nudo { position: relative; min-width: 0; padding-top: 18px; }
.pqa-nudo::before { content: ''; position: absolute; left: 0; top: 1px; width: 8px; height: 8px; border-radius: 50%; background: var(--as-tinta); }
.pqa-nudo.dato::before { background: var(--as-lejos); }
.pqa-nudo::after { content: ''; position: absolute; left: 13px; right: -8px; top: 4.5px; height: 1px; background: var(--as-linea-fuerte); transform-origin: left center; }
.pqa-nudo:last-child::after { display: none; }
.pqa-nudo > span { display: block; font: 500 13px/1.2 var(--texto); color: var(--as-apagado); }
.pqa-nudo > b { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 4px; margin-top: 6px; font: 300 24px/1.08 var(--numeros); letter-spacing: -0.02em; color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.pqa-nudo > b.larga { font-size: 20px; }
.pqa-nudo.dato > b { color: var(--as-lejos); }
.pqa-nudo > b small { font: 400 13px/1.2 var(--texto); letter-spacing: 0; color: var(--as-sub); }
.pqa-nudo > p { margin: 5px 0 0; font: 400 13px/1.36 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.pqa-cadena.vista .pqa-nudo::before { animation: pqa-pt 0.34s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 240ms + 260ms); }
.pqa-cadena.vista .pqa-nudo::after { animation: pqa-cx 0.36s ease-out backwards; animation-delay: calc(var(--i) * 240ms + 340ms); }
.pqa-cadena.vista .pqa-nudo > * { animation: pqa-sube 0.44s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i) * 240ms + 300ms); }

/* El pie: cuánto confiar y las fuentes, plegadas en una línea. */
.pqa-pie { display: flex; flex-wrap: wrap; align-items: center; gap: 0 16px; margin-top: 14px; padding-top: 4px; border-top: 1px solid rgba(48, 55, 72, 0.7); }
.pqa-sello { display: inline-flex; align-items: center; gap: 7px; min-height: 44px; font: 400 13.5px/1 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.pqa-puntos { display: inline-flex; gap: 3px; }
.pqa-puntos i { width: 6px; height: 6px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(232, 236, 246, 0.45); }
.pqa-puntos[data-n='4'] i, .pqa-puntos[data-n='3'] i:nth-child(-n+3), .pqa-puntos[data-n='2'] i:nth-child(-n+2), .pqa-puntos[data-n='1'] i:first-child { background: var(--as-tinta); box-shadow: none; }
.pqa-fuentes-cab { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: 0 0 0 auto; padding: 0 0 0 10px; border: 0; background: none; color: var(--as-sub); font: 400 13.5px/1 var(--texto); }
.pqa-fuentes-cab svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; transition: rotate 0.3s ease; }
.pqa-fuentes-cab[aria-expanded='true'] svg { rotate: 90deg; }
.pqa-fuentes-cab:active { opacity: 0.6; }
.pqa-fuentes { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.34s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pqa-fuentes.abiertas { grid-template-rows: 1fr; }
.pqa-fuentes > ol { min-height: 0; overflow: hidden; margin: 0; padding: 0; list-style: none; }
.pqa-cita { display: block; min-height: 44px; padding: 6px 0; color: inherit; text-decoration: none; }
a.pqa-cita:active { opacity: 0.6; }
.pqa-cita b { display: block; font: 500 13px/1.35 var(--texto); color: var(--as-tinta); }
.pqa-cita em { display: block; margin-top: 2px; font: normal 400 13px/1.35 var(--texto); color: var(--as-sub); }

@keyframes pqa-tz { from { stroke-dashoffset: 1; opacity: 0; } 12% { opacity: 1; } }
@keyframes pqa-ap { from { opacity: 0; } }
@keyframes pqa-cx { from { transform: scaleX(0); } }
@keyframes pqa-cy { from { transform: scaleY(0); } }
@keyframes pqa-pt { from { opacity: 0; transform: scale(0.2); } }
@keyframes pqa-sube { from { opacity: 0; transform: translateY(6px); } }

@media (prefers-reduced-motion: reduce) {
  .pqa-scroll.entra > *, .pqa-dib.vista *, .pqa-cadena.vista .pqa-nudo::before, .pqa-cadena.vista .pqa-nudo::after, .pqa-cadena.vista .pqa-nudo > * { animation: none !important; }
  .pqa-abrir, .pqa-abrir svg, .pqa-fuentes, .pqa-fuentes-cab svg { transition: none; }
}
`;

// ------------------------------------------------------------ los dibujos (SVG en texto; las clases dicen el trazo)
let serieDeIdsPqa = 0;
const uidPqa = () => 'pqa-g' + (++serieDeIdsPqa);
const escPqa = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const f1 = (n) => String(Math.round(n * 10) / 10);
const turno = (i) => (i == null ? '' : ` style="--i:${i}"`);
const largoUno = (c) => (/\btz\b/.test(c) ? ' pathLength="1"' : '');
const L = (x1, y1, x2, y2, c, i) => `<line${largoUno(c)} class="${c}" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${turno(i)}/>`;
const P = (d, c, i) => `<path${largoUno(c)} class="${c}" d="${d}"${turno(i)}/>`;
const R = (x, y, w, h, c, i, rx) => `<rect class="${c}" x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}"${rx ? ` rx="${rx}"` : ''}${turno(i)}/>`;
const C = (x, y, r, c, i) => `<circle class="${c}" cx="${f1(x)}" cy="${f1(y)}" r="${r}"${turno(i)}/>`;
const T = (x, y, s, c, a, i) => (s === '' || s == null ? '' : `<text class="${c || ''}" x="${f1(x)}" y="${f1(y)}"${a ? ` text-anchor="${a}"` : ''}${turno(i)}>${escPqa(s)}</text>`);
const camino = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${f1(x)} ${f1(y)}`).join('');

// Cada uno recibe el ancho (W), los datos de hoy (x), sus rótulos (t) y cómo se escriben los números (n); devuelve
// [alto, SVG de adentro].
const DIBUJOS_PQA = {
  // Esta semana: la escala de 0 a 30 series, la franja de 10 a 20 a puntos (es una convención) y tus músculos.
  musculos({ W, x, n }) {
    const x0 = 8, x1 = W - 8, base = 52, X = (s) => x0 + (Math.min(30, Math.max(0, s)) / 30) * (x1 - x0);
    let s = R(X(10), 10, X(20) - X(10), 52, 'fb cy', 0) + L(X(10), 10, X(10), 62, 'lp ap', 1) + L(X(20), 10, X(20), 62, 'lp ap', 1) + L(x0, base, x1, base, 'e tz', 0);
    [0, 10, 20, 30].forEach((v) => { s += L(X(v), base + 5, X(v), base + 9, 'ls ap', 1) + T(X(v), base + 25, n(v), 'n', v === 0 ? 'start' : v === 30 ? 'end' : 'middle', 2); });
    s += T((X(0) + X(10)) / 2, 98, x.zonas.poco, '', 'middle', 4) + T(X(15), 98, x.zonas.enSuPunto, 'f', 'middle', 4) + T((X(20) + X(30)) / 2, 98, x.zonas.mucho, '', 'middle', 4);
    // Los que caen en el mismo lugar se apilan hacia arriba. Los sin entrenar (0 series) van en gris: «Tu dato» cuenta
    // solo a los que les faltan, como el resumen («A 5 les faltan series · 2 sin entrenar»).
    const puestos = [];
    x.series.slice().sort((a, b) => a - b).forEach((v, i) => {
      const cx = X(v), k = puestos.filter((p) => Math.abs(p - cx) < 9.5).length;
      puestos.push(cx);
      s += C(cx, base - k * 10, 4.3, (v <= 0 ? 'rm' : v < 10 ? 'ra' : v > 20 ? 'aro' : 'r') + ' pt', 3 + i * 0.3);
    });
    return [104, s];
  },
  // Músculos fatigados: de cargado a recuperado, en días, con el borde borroso; el día en que vuelve, ±1.
  fatigados({ W, x, t }) {
    const x0 = 8, x1 = W - 8, tot = x.total, X = (d) => x0 + (d / (tot + 1)) * (x1 - x0), y = 40, b = 20, id = uidPqa(), u = (d) => d / (tot + 1);
    const tramos = [[0, 0.85], [u(tot - 1) - 0.04, 0.85], [u(tot - 1) + 0.04, 0.42], [u(tot) - 0.05, 0.42], [u(tot) + 0.05, 0.05], [1, 0.03]];
    let s = `<defs><linearGradient id="${id}">${tramos.map(([o, a]) => `<stop offset="${f1(Math.max(0, Math.min(1, o)) * 100)}%" style="stop-color: var(--as-tinta); stop-opacity: ${a}"/>`).join('')}</linearGradient></defs>`
      + `<rect class="cx" x="${f1(x0)}" y="${y - b / 2}" width="${f1(x1 - x0)}" height="${b}" rx="${b / 2}" fill="url(#${id})" style="--i:1"/>` + R(x0, y - b / 2, x1 - x0, b, 'ls ap', 0, b / 2)
      + T(X((tot - 1) / 2), y - b / 2 - 10, x.fases.cargado, 'f', 'middle', 3) + T(X(tot - 0.5), y - b / 2 - 10, x.fases.medio, 'f', 'middle', 4) + T(x1, y - b / 2 - 10, x.fases.recuperado, 'f', 'end', 5);
    for (let k = 0; k <= tot; k++) s += L(X(k), y + b / 2 + 4, X(k), y + b / 2 + 9, 'ls ap', 2) + T(X(k), y + b / 2 + 26, x.dias[k], k === x.pasados ? 'o' : '', k === 0 ? 'start' : 'middle', 2);
    const yb = y + b / 2 + 40;
    return [yb + 24, s + L(X(x.pasados), y - b / 2 - 3, X(x.pasados), y + b / 2 + 3, 'a tz', 4)
      + L(X(tot - 1), yb, X(tot + 1), yb, 'l ap', 6) + L(X(tot - 1), yb - 4, X(tot - 1), yb + 4, 'l ap', 6) + L(X(tot + 1), yb - 4, X(tot + 1), yb + 4, 'l ap', 6) + T(X(tot), yb + 19, t.margen, 'f', 'middle', 6)];
  },
  // Estancados: tus sesiones, bailando dentro de ±3 % alrededor de su tendencia; arriba, las 8 semanas que hacen falta.
  estancados({ W, x, t }) {
    const x0 = 8, x1 = W - 8, arriba = 36, abajo = 90, X = (s) => x0 + ((s + 12) / 12) * (x1 - x0);
    const a = x.recta[0], z = x.recta[x.recta.length - 1], nivel = (s) => a.nivel + ((s - a.t) * (z.nivel - a.nivel)) / (z.t - a.t);
    const t0 = Math.min(a.t, ...x.puntos.map((p) => p.t)), todos = [nivel(t0) * 0.97, nivel(0) * 0.97, nivel(t0) * 1.03, nivel(0) * 1.03, ...x.puntos.map((p) => p.kg)];
    const lo = Math.min(...todos) - 0.4, hi = Math.max(...todos) + 0.4, Y = (kg) => abajo - ((kg - lo) / (hi - lo)) * (abajo - arriba);
    const banda = [[X(t0), Y(nivel(t0) * 1.03)], [X(0), Y(nivel(0) * 1.03)], [X(0), Y(nivel(0) * 0.97)], [X(t0), Y(nivel(t0) * 0.97)]];
    const yb = 20;
    return [112, P(camino(banda) + 'Z', 'fb ap', 0) + L(X(t0), Y(nivel(t0)), X(0), Y(nivel(0)), 'l tz', 1)
      + x.puntos.map((p, i) => C(X(p.t), Y(p.kg), 3.4, 'ra pt', 3 + i * 0.35)).join('') + T(x0, Y(nivel(t0)) + 4.5, t.ruido, 'n', 'start', 2)
      + L(X(-8), yb, X(0), yb, 'l ap', 7) + L(X(-8), yb - 4, X(-8), yb + 4, 'l ap', 7) + L(X(0), yb - 4, X(0), yb + 4, 'l ap', 7) + T(X(-4), yb - 8, t.minimo, 'f', 'middle', 7)
      + T(x0, 108, t.hace12, '', 'start', 2) + T(x1, 108, x.hoyTexto, 'f', 'end', 2)];
  },
  // Por qué puedes estar estancado: cuando subías y ahora, en dos columnas; en terracota, lo que cuenta como razón.
  porQue({ W, x }) {
    const medio = W / 2, colB = medio + 10, barra = W - colB - 70, filas = x.filas;
    let s = T(0, 13, x.compara.antes, '', 'start', 0) + T(colB, 13, x.compara.ahora, 'f', 'start', 0);
    filas.forEach((f, i) => {
      const y = 42 + i * 40, max = Math.max(f.va || 0, f.vb || 0) || 1, w = (v) => Math.max(3, (v / max) * barra);
      s += T(0, y, f.nombre, f.marcada ? 'f' : '', 'start', 1 + i);
      s += f.va == null ? T(0, y + 19, x.compara.sinDatos, 't', 'start', 2 + i) : R(0, y + 9, w(f.va), 10, 'rm cx', 2 + i, 5) + T(w(f.va) + 7, y + 19, f.antes, 'n', 'start', 2 + i);
      if (f.vb != null) s += R(colB, y + 9, w(f.vb), 10, (f.marcada ? 'ra' : 'rm') + ' cx', 3 + i, 5) + T(colB + w(f.vb) + 7, y + 19, f.ahora, f.marcada ? 'n o' : 'n', 'start', 3 + i);
    });
    return [26 + filas.length * 40, s];
  },
  // Metas: desde hoy, el ritmo más rápido y el más lento tocan la meta en una ventana sombreada sobre los meses.
  metas({ W, x, t }) {
    const x0 = 8, x1 = W - 8, [s0, s1] = x.semanas, fin = s1 + 5, X = (w) => x0 + ((w + 2) / (fin + 2)) * (x1 - x0);
    const arriba = 26, base = 92, lo = x.nivel - 7, hi = x.kilos + 2, Y = (kg) => base - ((kg - lo) / (hi - lo)) * (base - arriba);
    const hoy = [X(0), Y(x.nivel)], ym = Y(x.kilos);
    let s = R(X(s0), ym, X(s1) - X(s0), base - ym, 'fa cy', 6) + L(x0, ym, x1, ym, 'lp ap', 0) + L(x0, base, x1, base, 'e tz', 0)
      + P(camino([hoy, [X(s0), ym], [X(s1), ym]]) + 'Z', 'fb ap', 3) + L(hoy[0], hoy[1], X(s0), ym, 'l tz', 3) + L(hoy[0], hoy[1], X(s1), ym, 'ld tz', 4)
      + L(hoy[0], hoy[1] + 6, hoy[0], base, 'lp ap', 2) + C(hoy[0], hoy[1], 4.6, 'ra pt', 2) + T(hoy[0], base + 20, x.hoyTexto, 'o', 'middle', 2)
      + T(x0, ym - 8, x.metaTexto, 'n f', 'start', 1) + T((X(s0) + X(s1)) / 2, ym - 8, x.ventana, 'o', 'middle', 7);
    x.meses.forEach((m) => {
      if (m.desde > -2) s += L(X(m.desde), base, X(m.desde), base + 4, 'ls ap', 5);
      const a = Math.max(m.desde, -2), b = Math.min(m.hasta, fin), c = X((a + b) / 2);
      // El mes que cae debajo de «Hoy» no se escribe.
      if (b - a >= 2.4 && Math.abs(c - hoy[0]) > x.hoyTexto.length * 3.8 + 20) s += T(c, base + 20, m.nombre, b > s0 && a < s1 ? 'o' : '', 'middle', 5);
    });
    return [base + 26, s];
  },
};

// ------------------------------------------------------------ la propuesta
Galeria.propuesta({
  id: 'porQueEnAscent',
  titulo: '«¿Por qué?» dentro de Ascent',
  texto: 'En la sección de Ascent, cada «En qué se basa» pasa a llamarse «¿Por qué?» y, al tocarlo, se abre ahí mismo con un dibujo, tus números y cuánto confiar. Compáralo con cómo se ve hoy.',
  vistas: [['semana', 'Abierto: Esta semana'], ['cerrado', 'Todo cerrado'], ['antes', 'Cómo se ve hoy']],
  mas: [['fatigados', 'Abierto: Músculos fatigados'], ['estancados', 'Abierto: Estancados'], ['porQue', 'Abierto: Por qué puedes estar estancado'], ['metas', 'Abierto: Metas'], ['en', 'En inglés']],
  principal: 0,
  crear(g) {
    g.estilo('pqa-css', CSS_PQA);
    const p = g.pantalla('pqa as-vars', { conBarra: true });
    const u = Util.crear(g.opciones);
    const { tx, el, boton } = u;
    const M = window.AscentDeMentira;
    const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const textos = () => TEXTOS_PQA[g.idioma] || TEXTOS_PQA.es;
    const DE_LA_VISTA = { semana: 'musculos', en: 'musculos', antes: 'musculos', fatigados: 'fatigados', estancados: 'estancados', porQue: 'porQue', metas: 'metas', cerrado: null };
    const estado = { modo: null, idioma: null, idiomaAntes: null, pestanaAntes: null, seguir: 0 };
    let scroll = null;

    // ------------------------------------------------------------ los datos de hoy, ya en palabras
    function datos() {
      const d = M.dia('cargado'), en = g.idioma === 'en', minuscula = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
      const numero = (s) => parseFloat(String(s).replace(en ? /,/g : /\./g, '').replace(',', '.'));
      const nombres = (lista) => lista.map((m, i) => (i ? minuscula(m.nombre) : m.nombre)).join(', ').replace(/, ([^,]*)$/, en ? ' and $1' : ' y $1');
      // Músculos fatigados: los que les falta algo, juntos por lo que les falta («faltan 2 días»).
      const fatigados = d.fatiga.lista.map((id) => d.musculos.find((m) => m.id === id)).filter((m) => m && m.fatiga && m.fatiga.dias > 0);
      const grupos = [];
      fatigados.forEach((m) => { const gr = grupos.find((x) => x.texto === m.fatiga.texto); if (gr) gr.lista.push(m); else grupos.push({ texto: m.fatiga.texto, lista: [m] }); });
      const primero = fatigados[0], pasados = primero ? primero.fatiga.total - primero.fatiga.dias : 1, total = primero ? primero.fatiga.total : 3;
      const fase = (k) => (d.fatiga.fases.find((f) => f.fase === k) || {}).nombre;
      const dias = Array.from({ length: total + 1 }, (_, k) => {
        if (k === pasados) return textos().hoy;
        if (k === pasados - 1) return textos().ayer;
        return tx('fecha.diasCortos.' + u.partes(Fechas.sumarDias(d.fecha, k - pasados)).dia);
      });
      const ej = d.fuerza.ejercicios.find((e) => e.estancado), est = ej.estancado;
      const series = est.compara.filas.find((f) => f.que === 'series');
      const meta = d.metas.lista.find((m) => m.semanas) || d.metas.lista[0];
      const meses = [];
      for (let c = Fechas.sumarDias(d.fecha, -60); Fechas.diasEntre(d.fecha, c) <= (meta.semanas[1] + 5) * 7; c = Fechas.sumarDias(c, 1)) {
        if (!c.endsWith('-01')) continue;
        const desde = Fechas.diasEntre(d.fecha, c) / 7;
        if (meses.length) meses[meses.length - 1].hasta = desde;
        meses.push({ desde, hasta: meta.semanas[1] + 5, nombre: tx('fecha.mesesCortos.' + u.partes(c).mes) });
      }
      const zona = (k) => (d.semana.leyenda.find((l) => l.estado === k) || {}).nombre;
      return {
        d,
        lineas: {
          musculos: d.semana.resumen,
          fatigados: grupos.map((gr) => `${nombres(gr.lista)}: ${gr.texto}`).join(' · '),
          estancados: `${ej.nombre}: ${est.dato}`,
          porQue: est.razones.length ? `${est.razones[0].titulo}${est.razones[0].valor ? ': ' + est.razones[0].valor : ''}` : '',
          metas: `${meta.nombre} · ${meta.llegas || meta.hoy}`,
        },
        titulos: { musculos: d.semana.titulo, fatigados: d.fatiga.titulo, estancados: d.fuerza.estancados.titulo, porQue: d.fuerza.estancados.porQue, metas: d.metas.titulo },
        musculos: { poco: u.numero(d.semana.cuentas.poco || 0), series: d.musculos.map((m) => m.series), zonas: { poco: zona('poco'), enSuPunto: zona('enSuPunto'), mucho: zona('mucho') } },
        fatigados: {
          series: d.aviso ? u.numero(d.aviso.series) : '', alFallo: d.aviso ? u.numero(d.aviso.alFallo) : '', cuando: d.aviso ? d.aviso.cuando : '', total, pasados, dias,
          fases: { cargado: fase('cargado'), medio: fase(total >= 3 ? 'faltaPoco' : 'seRecupera'), recuperado: fase('recuperado') },
        },
        estancados: { semanas: u.numero(ej.semanas), ejercicio: en ? ej.nombre.toLowerCase() : minuscula(ej.nombre), puntos: ej.trazo.puntos, recta: ej.trazo.recta, hoyTexto: textos().hoy },
        porQue: {
          antes: series.antes, ahora: series.ahora, que: minuscula(series.nombre), razones: u.numero(est.razones.length), compara: est.compara,
          filas: est.compara.filas.filter((f) => f.antes != null || f.marcada).map((f) => Object.assign({}, f, { va: f.antes == null ? null : numero(f.antes), vb: f.ahora == null ? null : numero(f.ahora) })),
        },
        metas: {
          hoy: u.peso(meta.nivelKg), ejercicio: en ? meta.nombre.toLowerCase() : minuscula(meta.nombre), nivel: meta.nivelKg, kilos: meta.kilos, semanas: meta.semanas, ventana: meta.ventanaCorta, meses,
          hoyTexto: textos().hoy, metaTexto: `${u.peso(meta.kilos)} kg`,
        },
      };
    }

    // ------------------------------------------------------------ las piezas
    const puntos = (s) => `<span class="pqa-puntos" data-n="${SELLOS_PQA[s]}" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
    function dibujo(de, x) {
      const W = 325, t = textos();
      let alto = 100, dentro = '';
      try { [alto, dentro] = DIBUJOS_PQA[de]({ W, x, t: t.e, n: u.numero }); } catch (e) { console.error('El dibujo de ' + de + ' falló:', e); }
      const caja = document.createElement('div');
      caja.innerHTML = `<svg class="pqa-dib" viewBox="0 0 ${W} ${alto}" aria-hidden="true">${dentro}</svg>`;
      return caja.firstChild;
    }
    function cadena(nudos) {
      const t = textos(), c = el('div', 'pqa-cadena');
      nudos.forEach((x, i) => {
        const nudo = el('div', 'pqa-nudo' + (i === 0 ? ' dato' : '')), cifra = String(x.cifra), b = el('b', cifra.length > 6 && !x.u ? 'larga' : null, cifra);
        nudo.style.setProperty('--i', String(i));
        if (x.u) b.appendChild(el('small', null, x.u));
        nudo.append(el('span', null, t.nudos[i]), b, el('p', null, x.texto));
        c.appendChild(nudo);
      });
      return c;
    }
    function fuentes(claves) {
      const citas = claves.map((k) => {
        const f = FUENTES_PQA[k];
        if (!f.base) return { quien: f.quien, anio: f.anio, que: f[g.idioma] || f.es };
        const lista = tx(`perfil.baseInfo.areas.${f.base[0]}.citas`);
        return Array.isArray(lista) ? lista[f.base[1]] : null;
      }).filter(Boolean);
      const lista = el('div', 'pqa-fuentes'), ol = el('ol');
      citas.forEach((c) => {
        const li = el('li'), caja = el(c.enlace ? 'a' : 'div', 'pqa-cita');
        if (c.enlace) Object.assign(caja, { href: c.enlace, target: '_blank', rel: 'noopener' });
        caja.append(el('b', null, `${c.quien} · ${c.anio}`), el('em', null, c.que));
        li.appendChild(caja);
        ol.appendChild(li);
      });
      lista.appendChild(ol);
      lista.inert = true;
      const cab = boton('pqa-fuentes-cab', `<span>${textos().fuentes(citas.length)}</span>${Util.icono('adelante')}`, () => {
        const si = !lista.classList.contains('abiertas');
        lista.classList.toggle('abiertas', si);
        cab.setAttribute('aria-expanded', String(si));
        lista.inert = !si;
        if (si) setTimeout(() => llevarA(cab.closest('.pqa-bloque'), false), 340);
      });
      cab.setAttribute('aria-expanded', 'false');
      return [cab, lista];
    }
    function porQue(def, x) {
      const t = textos(), dentro = el('div', 'pqa-dentro'), lamina = el('div', 'pqa-lamina'), pie = el('div', 'pqa-pie'), sello = el('span', 'pqa-sello');
      lamina.appendChild(dibujo(def.de, x[def.de]));
      sello.innerHTML = puntos(def.sello);
      sello.appendChild(el('span', null, tx(`perfil.baseInfo.sellos.${def.sello}.nombre`)));
      const [cab, lista] = fuentes(def.fuentes);
      pie.append(sello, cab);
      dentro.append(lamina, cadena(t[def.de === 'porQue' ? 'porQueBloque' : def.de](x[def.de])), pie, lista);
      return dentro;
    }
    // Lo de hoy en la app: los párrafos de ascent.baseDe, con lo de antes de los dos puntos en negrita.
    function parrafos(de, x) {
      const dentro = el('div', 'pqa-dentro');
      (x.d.base[de] || []).forEach((s) => {
        const p = el('p', 'pqa-parrafo'), i = s.indexOf(':');
        if (i > 0 && i < 40) p.append(el('b', null, s.slice(0, i + 1)), s.slice(i + 1)); else p.textContent = s;
        dentro.appendChild(p);
      });
      return dentro;
    }

    // ------------------------------------------------------------ la pantalla
    function pintar(modo) {
      const x = datos();
      scroll = el('div', 'pqa-scroll');
      scroll.append(el('p', 'pqa-marca', 'Ascent'), el('p', 'pqa-intro', x.d.semana.paraQue));
      BLOQUES_PQA.forEach((def) => {
        const b = el('section', 'pqa-bloque'), pliegue = el('div', 'pqa-pliegue');
        b.dataset.de = def.de;
        pliegue.hidden = true;
        pliegue.inert = true;
        pliegue.appendChild(modo === 'antes' ? parrafos(def.de, x) : porQue(def, x));
        const abrir = boton('pqa-abrir', `<span>${modo === 'antes' ? tx('ascent.enQueSeBasa') : textos().porQue}</span>${Util.icono('abajo')}`, () => {
          const si = abrir.getAttribute('aria-expanded') !== 'true';
          desplegar(b, si, false, () => { if (si) llevarA(b, false); });
        });
        abrir.setAttribute('aria-expanded', 'false');
        b.append(el('h3', 'pqa-etq', x.titulos[def.de]), el('p', 'pqa-linea', x.lineas[def.de]), abrir, pliegue);
        scroll.appendChild(b);
      });
      p.el.replaceChildren(scroll);
      Object.assign(estado, { modo, idioma: g.idioma });
    }
    const bloque = (de) => (scroll ? scroll.querySelector(`.pqa-bloque[data-de="${de}"]`) : null);
    const abiertos = () => (scroll ? [...scroll.querySelectorAll('.pqa-abrir[aria-expanded="true"]')].map((b) => b.closest('.pqa-bloque').dataset.de) : []);

    /** Se dibuja de nuevo cada vez que se abre. */
    function reavivar(n) {
      n.querySelectorAll('.pqa-dib, .pqa-cadena').forEach((x) => { x.classList.remove('vista'); void x.getBoundingClientRect(); x.classList.add('vista'); });
    }
    /** Abre o cierra el «¿Por qué?» de un bloque: crece desde el enlace y empuja lo de abajo. */
    function desplegar(b, si, deUna, alTerminar) {
      const pl = b.querySelector('.pqa-pliegue'), dentro = pl.firstElementChild, abrir = b.querySelector('.pqa-abrir');
      if ((abrir.getAttribute('aria-expanded') === 'true') === si) return;
      const desde = pl.hidden ? 0 : pl.offsetHeight;
      // Tocado a mitad de camino: sigue desde donde estaba, sin saltar a la opacidad entera.
      const enCurso = dentro.getAnimations().length ? (({ opacity, transform }) => ({ opacity, transform }))(getComputedStyle(dentro)) : null;
      pl.getAnimations().concat(dentro.getAnimations()).forEach((a) => a.cancel());
      abrir.setAttribute('aria-expanded', String(si));
      pl.inert = !si;
      if (si) { pl.hidden = false; reavivar(dentro); }
      if (deUna || quieto()) { if (!si) pl.hidden = true; if (alTerminar) alTerminar(); return; }
      // Con nombre («pqa-…»): las capturas frenan estas animaciones a mitad de camino.
      const t = { id: 'pqa-abre', duration: si ? 460 : 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' };
      const alto = pl.animate([{ height: `${desde}px` }, { height: `${si ? dentro.offsetHeight : 0}px` }], t);
      dentro.animate(si ? [enCurso || { opacity: 0, transform: 'translateY(-10px) scale(0.96)' }, { opacity: 1, transform: 'none' }] : [enCurso || { opacity: 1 }, { opacity: 0 }], Object.assign({}, t, { duration: si ? 420 : 200, easing: si ? t.easing : 'ease-out', fill: 'both' }));
      alto.onfinish = () => { if (!si) pl.hidden = true; dentro.getAnimations().forEach((a) => a.cancel()); if (alTerminar) alTerminar(); };
    }
    /** Baja (o sube) lo justo para que se vea el bloque entero; si no entra, su comienzo. Sigue al bloque mientras crece. */
    function llevarA(b, deUna) {
      // Lo que llega tarde (el timer de las fuentes, una animación que terminó) para un bloque que ya se volvió a
      // pintar no mueve nada: si no, el bloque suelto mide 0 y sube todo hasta arriba.
      if (!scroll || (b && !scroll.contains(b))) return;
      cancelAnimationFrame(estado.seguir);
      const s = scroll;
      const objetivo = () => {
        if (!b) return 0;
        const cs = getComputedStyle(s), arriba = parseFloat(cs.paddingTop), abajo = parseFloat(cs.paddingBottom) - 24;
        const y = Math.min(Math.max(0, b.offsetTop + b.offsetHeight - s.clientHeight + abajo), b.offsetTop - arriba);
        return Math.max(0, Math.min(y, s.scrollHeight - s.clientHeight));
      };
      if (deUna || quieto()) { s.scrollTop = objetivo(); return; }
      const desde = s.scrollTop, t0 = performance.now(), dur = 560;
      const paso = (ahora) => {
        const k = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        s.scrollTop = desde + (objetivo() - desde) * e;
        if (k < 1) estado.seguir = requestAnimationFrame(paso);
      };
      estado.seguir = requestAnimationFrame(paso);
    }

    /** «En inglés» pone toda la galería en inglés y, al salir de esa vista, la deja como estaba. */
    function ingles(si) {
      if (si && g.idioma !== 'en') { estado.idiomaAntes = g.idioma; window.__idioma('en'); }
      if (!si && estado.idiomaAntes) { const antes = estado.idiomaAntes; estado.idiomaAntes = null; if (g.idioma !== antes) window.__idioma(antes); }
    }
    // Si el idioma cambia con la pantalla abierta, se pinta de nuevo donde estaba, con lo mismo abierto.
    const selector = document.getElementById('s-idioma');
    if (selector) selector.addEventListener('click', () => {
      if (!p.abierta || estado.idioma === g.idioma) return;
      const y = scroll.scrollTop, eran = abiertos();
      pintar(estado.modo);
      eran.forEach((de) => desplegar(bloque(de), true, true));
      scroll.scrollTop = y;
      if (!quieto()) scroll.classList.add('entra');
    });
    // Como en la app con Ascent abierta, de costado no se cambia de sección. La tira mira el gesto en captura sobre el
    // teléfono, antes que la pantalla: se corta un paso antes, en el documento.
    document.addEventListener('pointerdown', (ev) => { if (p.abierta && p.el.contains(ev.target)) ev.stopPropagation(); }, true);

    return {
      abrir(vista) {
        ingles(vista === 'en');
        if (!p.abierta && estado.pestanaAntes == null) estado.pestanaAntes = g.pestana;
        // Ascent vive arriba de Progreso: la barra lo dice.
        if (g.pestana !== 2) g.irA(2, quieto());
        const modo = vista === 'antes' ? 'antes' : 'nuevo', ya = p.abierta && estado.modo === modo && estado.idioma === g.idioma;
        if (!ya) {
          const vuelve = p.abierta;
          pintar(modo);
          if (vuelve && !quieto()) scroll.classList.add('entra');
        }
        p.abrir();
        const de = DE_LA_VISTA[vista];
        BLOQUES_PQA.forEach((def) => desplegar(bloque(def.de), def.de === de, !ya));
        llevarA(de ? bloque(de) : null, !ya);
      },
      cerrar() {
        cancelAnimationFrame(estado.seguir);
        // Primero se va: así, al volver el idioma, no se repinta en el otro mientras sale.
        p.cerrar();
        ingles(false);
        // Vuelve a la sección de antes deslizándose, mientras la pantalla se va.
        if (estado.pestanaAntes != null && estado.pestanaAntes !== g.pestana) g.irA(estado.pestanaAntes, quieto());
        estado.pestanaAntes = null;
      },
    };
  },
});
