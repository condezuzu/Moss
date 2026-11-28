// Los despertares de la noche sin reloj (28/11/2026, para aprobar). Lo pediste el 28/11: sin reloj, si a la noche
// agarrabas el teléfono un rato, la noche se cortaba ahí (te salió una de 2 h 4 min). Ahora la noche sigue y cada
// despertar se muestra: va desde que agarraste el teléfono hasta tu margen para dormirte después de dejarlo (15 min
// de fábrica, en Sueño › Afinar), y se resta de lo dormido. La regla la programa otro agente (src/dominio/sinReloj.ts).
// Es la tarjeta «Anoche» sin reloj de Sueño (laNocheDeMoss y arcoDe en galeria/src/sueno.js; LaNoche.tsx en la app)
// con lo nuevo: arriba, «Dormiste de … a …»; en el arco, cada despertar como un corte chico sobre la franja, que
// sigue entera; debajo, cada despertar en dos líneas y cuánto estuviste despierto en total. Tocar un despertar, en
// la lista o en el arco, lo resalta y lo lee en el centro, como se leen las etapas con reloj.
// Los textos van de 13 px para arriba: algo más grandes que los de la tarjeta de hoy.

// Las horas, en minutos desde las 18 del día anterior, como en Sueño.
const hDsp = (hh, mm) => ((hh + 6) % 24) * 60 + mm;
const MARGEN_DSP = 15;
// La escala del arco: la que darían las últimas noches de quien se duerme cerca de la 1 y se despierta cerca de las 10.
const ESCALA_DSP = { desde: hDsp(0, 0), hasta: hDsp(11, 0) };
const RANGO_DSP = { dormirse: [hDsp(0, 55), hDsp(1, 35)], despertar: [hDsp(9, 5), hDsp(9, 40)] };
// Cada despertar: qué lo marcó (agarrar el teléfono o caminar con él), cuándo empezó y cuándo dejaste el teléfono.
const NOCHES_DSP = {
  uno: { despertares: [{ tipo: 'telefono', desde: hDsp(4, 2), dejaste: hDsp(4, 12) }] },
  dos: { despertares: [{ tipo: 'telefono', desde: hDsp(3, 21), dejaste: hDsp(3, 26) }, { tipo: 'telefono', desde: hDsp(6, 48), dejaste: hDsp(6, 56) }] },
  bano: { despertares: [{ tipo: 'pasos', desde: hDsp(4, 20), dejaste: hDsp(4, 26) }] },
  ninguno: { despertares: [] },
  // La misma noche que «antes»: 25 minutos con el teléfono pasaban los 20 que no cortaban la noche.
  largo: { despertares: [{ tipo: 'telefono', desde: hDsp(3, 14), dejaste: hDsp(3, 39) }] },
};
Object.values(NOCHES_DSP).forEach((n) => Object.assign(n, { dormirse: hDsp(1, 10), despertar: hDsp(9, 40), rango: RANGO_DSP, seguridad: 'alta' }));
const ANTES_DSP = { dormirse: hDsp(1, 10), despertar: hDsp(3, 14), rango: { dormirse: RANGO_DSP.dormirse, despertar: [hDsp(2, 50), hDsp(3, 14)] }, seguridad: 'media', despertares: [] };

const TEXTOS_DSP = {
  es: {
    dormiste: ['Dormiste de ', ' a '],
    telefono: 'Te despertaste: agarraste el teléfono',
    pasos: 'Te levantaste y caminaste un poco',
    volviste: 'Volviste a dormirte, más o menos',
    dejaste: (h) => `Dejaste el teléfono a las ${h}`,
    total: 'Despierto en total',
    noCuenta: 'Eso no cuenta como sueño.',
    ninguno: 'No tocaste el teléfono en toda la noche.',
    sinEtapas: 'Sin reloj no hay etapas: con un reloj o un anillo, Moss las mide.',
    aria: (a, b, n) => `Dormiste de ${a} a ${b}` + (n ? `, con ${n === 1 ? 'un despertar' : `${n} despertares`}` : ''),
  },
  en: {
    dormiste: ['You slept from ', ' to '],
    telefono: 'You woke up and picked up your phone',
    pasos: 'You got up and walked around a bit',
    volviste: 'You fell back asleep, more or less',
    dejaste: (h) => `You put your phone down at ${h}`,
    total: 'Total time awake',
    noCuenta: 'That doesn’t count as sleep.',
    ninguno: 'You didn’t touch your phone all night.',
    sinEtapas: 'Without a watch there are no stages: with a watch or a ring, Moss measures them.',
    aria: (a, b, n) => `You slept from ${a} to ${b}` + (n ? `, waking up ${n === 1 ? 'once' : `${n} times`}` : ''),
  },
};

// La paleta de Sueño (sueno.js): casi negro azulado, tinta clara; el durazno es lo despierto, como en el arco con reloj.
const CSS_DSP = `
.tel .pr-pantalla.dsp {
  --dsp-2: rgba(214, 226, 250, 0.82); --dsp-3: rgba(196, 212, 246, 0.7); --dsp-linea: rgba(150, 178, 240, 0.15); --dsp-despierto: #efb08c; --dsp-cifra: #fbf2d9;
  color: var(--tinta);
  background: radial-gradient(70% 30% at 50% -4%, rgba(70, 92, 170, 0.16), rgba(70, 92, 170, 0) 74%), linear-gradient(180deg, #040812 0%, #050916 46%, #03050d 100%);
}
/* Lo que se desliza se apaga debajo de la hora. */
.tel .pr-pantalla.dsp::before { content: ''; position: absolute; z-index: 1; left: 0; right: 0; top: 0; height: calc(var(--arriba) + 8px); background: linear-gradient(180deg, #040812 70%, rgba(4, 8, 18, 0)); pointer-events: none; }
.dsp-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: calc(var(--arriba) + 2px) 18px calc(var(--pestanas) + 40px); }
.dsp-scroll::-webkit-scrollbar { display: none; }
.dsp-scroll.entra > * { animation: dsp-ap 0.3s ease both; }
.dsp button { -webkit-tap-highlight-color: transparent; }
.dsp :focus-visible { outline: 2px solid var(--dsp-2); outline-offset: 2px; }
.dsp-cabeza { display: grid; gap: 2px; margin-bottom: 4px; }
.dsp-fecha { font: 400 13px/1.2 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: var(--dsp-3); }
.dsp-pagina { margin: 6px 0 0; font: 500 28px/1 var(--numeros); letter-spacing: -0.01em; color: var(--tinta); }

/* La tarjeta: la de la noche de Sueño. */
.dsp-carta { display: grid; gap: 6px; margin-top: 12px; padding: 14px 16px 10px; border-radius: 20px; border: 1px solid rgba(150, 178, 240, 0.11); background: linear-gradient(178deg, rgba(10, 18, 48, 0.82) 0%, rgba(14, 26, 66, 0.82) 62%, rgba(20, 36, 84, 0.8) 100%); }
.dsp-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 26px; }
.dsp-cab > span { font: 400 13px/1 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: var(--dsp-2); }
.dsp-origen { flex: none; padding: 6px 10px; border-radius: 999px; font: 500 13px/1 var(--texto); font-style: normal; letter-spacing: 0.03em; color: var(--dsp-2); background: rgba(150, 178, 240, 0.12); }
.dsp-titular { margin: 2px 0 0; font: 400 18px/1.3 var(--texto); color: var(--tinta); }
.dsp-titular b { font: 400 20px/1 var(--numeros); color: var(--dsp-cifra); font-variant-numeric: tabular-nums; }

/* El arco, como el de Sueño; los despertares, cortes chicos sobre la franja. */
.dsp-arco { position: relative; margin-top: 2px; }
.dsp-arco.tocable { cursor: pointer; }
.dsp-arco svg { display: block; width: 100%; height: auto; overflow: visible; }
.dsp-arco .dsp-pista { fill: none; stroke: rgba(150, 178, 240, 0.09); }
.dsp-arco .dsp-grueso { fill: none; stroke-linecap: butt; }
.dsp-arco .dsp-hito { fill: none; stroke: rgba(196, 212, 246, 0.42); stroke-width: 1; }
.dsp-arco .dsp-horizonte { stroke: rgba(150, 178, 240, 0.3); stroke-width: 1; }
.dsp-arco .dsp-estrella { fill: #dfe8ff; stroke: none; }
/* El dibujo se achica a 323 de 325: con 13,1 las horas se leen a 13. */
.dsp-arco text { fill: rgba(196, 212, 246, 0.72); stroke: none; font: 400 13.1px var(--numeros); text-anchor: middle; font-variant-numeric: tabular-nums; }
.dsp-arco .dsp-revela { fill: none; stroke: #fff; stroke-dasharray: 1; stroke-dashoffset: 0; }
.dsp-arco .dsp-revela.animar { animation: dsp-revela 1.2s cubic-bezier(0.3, 0.7, 0.2, 1) both; }
.dsp-arco .dsp-banda { transition: opacity 0.25s ease; }
.dsp-arco .dsp-hueco { fill: none; stroke: rgba(5, 9, 26, 0.62); stroke-linecap: butt; transition: opacity 0.25s ease; }
.dsp-arco .dsp-corte { fill: none; stroke: var(--dsp-despierto); stroke-linecap: round; transition: opacity 0.25s ease, stroke 0.25s ease, filter 0.25s ease; }
.dsp-arco.animar .dsp-hueco, .dsp-arco.animar .dsp-corte { animation: dsp-ap 0.45s ease backwards; animation-delay: calc(var(--i, 0) * 120ms + 650ms); }
/* Al leer uno, la franja se apaga y el corte leído brilla: los otros quedan tenues. */
.dsp-arco.leyendo .dsp-banda, .dsp-arco.leyendo .dsp-hueco { opacity: 0.36; }
.dsp-arco.leyendo .dsp-corte:not(.leido) { opacity: 0.4; }
.dsp-arco .dsp-corte.leido { stroke: #ffd6bd; filter: drop-shadow(0 0 5px rgba(239, 176, 140, 0.9)); }
.dsp-centro { position: absolute; left: 0; right: 0; bottom: 12px; display: grid; justify-items: center; gap: 4px; pointer-events: none; }
.dsp-centro b { font: 400 33px/1 var(--numeros); letter-spacing: -0.015em; color: var(--dsp-cifra); font-variant-numeric: tabular-nums; }
.dsp-centro span { font: 400 14px/1.1 var(--texto); color: var(--dsp-2); font-variant-numeric: tabular-nums; }
.dsp-centro.cambia { animation: dsp-ap 0.22s ease both; }

/* Antes: a qué hora te dormiste y te despertaste, a cada lado. */
.dsp-horas { display: flex; justify-content: space-between; gap: 12px; margin-top: 6px; }
.dsp-lado { display: grid; grid-template-columns: 20px auto; column-gap: 7px; align-items: center; }
.dsp-lado.fin { grid-template-columns: auto 20px; text-align: right; }
.dsp-lado svg { grid-row: 1 / span 2; width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; color: #c6d6fa; }
.dsp-lado.fin svg { grid-column: 2; color: #f3dfb0; }
.dsp-lado b { font: 400 17px/1.1 var(--numeros); font-variant-numeric: tabular-nums; }
.dsp-lado small { font: 400 13px/1.25 var(--texto); color: var(--dsp-3); }

/* Cada despertar: dos líneas unidas por lo que estuviste despierto. */
.dsp-lista { display: grid; gap: 2px; margin-top: 6px; }
.dsp-desp { appearance: none; cursor: pointer; display: grid; gap: 10px; width: calc(100% + 16px); margin: 0 -8px; padding: 10px 8px; border: 0; border-radius: 14px; background: rgba(239, 176, 140, 0); color: inherit; font: inherit; text-align: left; transition: background-color 0.25s ease, box-shadow 0.25s ease; }
.dsp-desp:active { background: rgba(239, 176, 140, 0.06); }
.dsp-desp[aria-pressed='true'] { background: rgba(239, 176, 140, 0.08); box-shadow: inset 0 0 0 1px rgba(239, 176, 140, 0.2); }
.dsp-fila { display: grid; grid-template-columns: 44px 12px minmax(0, 1fr); column-gap: 10px; align-items: start; }
.dsp-hora { font: 400 15px/22px var(--numeros); color: var(--dsp-cifra); font-variant-numeric: tabular-nums; }
.dsp-marca { position: relative; align-self: stretch; }
.dsp-marca i { position: absolute; left: 50%; top: 11px; width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-radius: 50%; background: var(--dsp-despierto); transition: box-shadow 0.25s ease; }
.dsp-fila.vuelve .dsp-marca i { background: none; box-shadow: inset 0 0 0 1.5px rgba(168, 200, 250, 0.9); }
/* El hilo baja hasta el punto de la otra línea: el alto de esta fila, el espacio entre las dos y 11 px más. */
.dsp-fila.empieza .dsp-marca::after { content: ''; position: absolute; left: 50%; top: 17px; bottom: -16px; width: 2px; margin-left: -1px; border-radius: 1px; background: linear-gradient(180deg, var(--dsp-despierto), rgba(239, 176, 140, 0.35)); }
.dsp-desp[aria-pressed='true'] .dsp-fila.empieza .dsp-marca i { box-shadow: 0 0 0 4px rgba(239, 176, 140, 0.22); }
.dsp-que { font: 400 15px/22px var(--texto); color: var(--tinta); text-wrap: pretty; }
.dsp-fila.vuelve .dsp-que { color: var(--dsp-2); }
.dsp-que small { display: block; font: 400 13px/18px var(--texto); color: var(--dsp-3); }
.dsp-entra .dsp-desp { animation: dsp-sube 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--i, 0) * 90ms + 350ms); }
.dsp-entra .dsp-total, .dsp-entra .dsp-ninguno { animation: dsp-sube 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) backwards; animation-delay: calc(var(--n, 0) * 90ms + 440ms); }

/* Despierto en total: como la fila de «Despierto» de la noche con reloj. */
.dsp-total { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 10px; row-gap: 3px; align-items: center; margin-top: 4px; padding: 12px 0 2px; border-top: 1px solid var(--dsp-linea); }
.dsp-total > span { display: inline-flex; align-items: center; gap: 8px; font: 400 15px/1.2 var(--texto); color: var(--tinta); }
.dsp-total > span::before { content: ''; flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--dsp-despierto); }
.dsp-total > b { font: 400 17px/1.2 var(--numeros); color: var(--dsp-cifra); font-variant-numeric: tabular-nums; }
.dsp-total > small { grid-column: 1 / -1; padding-left: 16px; font: 400 13px/1.4 var(--texto); color: var(--dsp-3); }
.dsp-ninguno { margin: 8px 0 0; font: 400 15px/1.4 var(--texto); color: var(--dsp-2); }

.dsp-texto { margin: 8px 0 0; padding-top: 10px; border-top: 1px solid var(--dsp-linea); font: 300 14px/1.48 var(--texto); color: var(--dsp-2); }
.dsp-texto.sin-linea { padding-top: 0; border-top: 0; }
.dsp-nota { margin: 4px 0 0; font: 400 13px/1.45 var(--texto); color: var(--dsp-3); }
.dsp-cambiar { appearance: none; cursor: pointer; justify-self: center; min-height: 44px; padding: 0 14px; border: 0; background: none; color: var(--oro-claro); font: 400 15px/1 var(--texto); }
.dsp-cambiar:active { opacity: 0.6; }

@keyframes dsp-ap { from { opacity: 0; } }
@keyframes dsp-sube { from { opacity: 0; transform: translateY(6px); } }
@keyframes dsp-revela { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }

@media (prefers-reduced-motion: reduce) {
  .dsp-scroll.entra > *, .dsp-arco .dsp-revela.animar, .dsp-arco.animar .dsp-hueco, .dsp-arco.animar .dsp-corte, .dsp-centro.cambia, .dsp-entra .dsp-desp, .dsp-entra .dsp-total, .dsp-entra .dsp-ninguno { animation: none; }
  .dsp-arco .dsp-banda, .dsp-arco .dsp-hueco, .dsp-arco .dsp-corte, .dsp-desp, .dsp-marca i { transition: none; }
}
`;

const ARCO_DSP = { ancho: 325, alto: 170, cx: 162.5, cy: 164 };
const SOL_DSP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 17a4.5 4.5 0 0 1 9 0"/><path d="M12 7.5v2.2M5.3 10.3l1.5 1.5M18.7 10.3l-1.5 1.5M3 17h2M19 17h2M3.5 20.5h17"/></svg>';
let serieDsp = 0;

Galeria.propuesta({
  id: 'despertares',
  titulo: 'Los despertares de la noche, sin reloj',
  texto: 'Sin reloj, agarrar el teléfono a la noche ya no la corta: la noche sigue, cada despertar se marca en el arco y se cuenta debajo, ya restado de lo dormido. Tocá un despertar para verlo en el dibujo.',
  vistas: [['uno', 'Un despertar'], ['dos', 'Dos despertares'], ['antes', 'Cómo se veía antes']],
  mas: [['bano', 'Te levantaste, con pasos'], ['largo', 'Un despertar largo'], ['ninguno', 'Sin despertares'], ['en', 'En inglés']],
  principal: 0,
  crear(g) {
    g.estilo('dsp-css', CSS_DSP);
    const p = g.pantalla('dsp', { conBarra: true });
    const u = Util.crear(g.opciones);
    const { tx, el, boton } = u;
    const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const textos = () => TEXTOS_DSP[g.idioma] || TEXTOS_DSP.es;
    const reloj = (min) => u.horaMin(min + 18 * 60);
    const estado = { vista: null, idioma: null, idiomaAntes: null, pestanaAntes: null, leido: -1 };
    let scroll = null, arco = null;

    // ------------------------------------------------------------ el arco
    const pi = Math.PI;
    const { ancho, alto, cx, cy } = ARCO_DSP;
    const { desde, hasta } = ESCALA_DSP;
    const ang = (m) => pi + ((Math.min(hasta, Math.max(desde, m)) - desde) / (hasta - desde)) * pi;
    const punto = (r, a) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
    const trazo = (r, a0, a1) => `M${punto(r, a0)} A${r} ${r} 0 0 1 ${punto(r, a1)}`;
    const GRUESO = { r: 122, w: 18 };

    /** El arco de Sueño sin etapas, con los despertares encima. `centro`: lo de en medio, [grande, chico]. */
    function arcoDe(n, des, centro, animar) {
      const caja = el('div', 'dsp-arco' + (animar ? ' animar' : '') + (des.length ? ' tocable' : ''));
      const id = 'dsp' + (++serieDsp);
      const azar = Datos.azar(7);
      let estrellas = '';
      for (let i = 0; i < 16; i++) {
        const a = pi + 0.12 + azar() * (pi - 0.24), dist = 62 + azar() * 38;
        estrellas += `<circle class="dsp-estrella" cx="${(cx + dist * Math.cos(a)).toFixed(1)}" cy="${(cy + dist * Math.sin(a)).toFixed(1)}" r="${(0.5 + azar() * 0.55).toFixed(2)}" opacity="${(0.25 + azar() * 0.45).toFixed(2)}"/>`;
      }
      // Las horas alrededor: una marca por hora y el número cada dos, salvo pegado a los extremos.
      let marcas = '';
      for (let m = Math.ceil(desde / 60) * 60; m <= hasta; m += 60) {
        const a = ang(m), aExtremo = Math.min(a - pi, 2 * pi - a), par = (18 + m / 60) % 2 === 0;
        if (aExtremo < 0.05) continue;
        const rEt = 155 + 7 * Math.abs(Math.cos(a));
        marcas += `<path class="dsp-hito" d="M${punto(145.5, a)} L${punto(par ? 149.5 : 147.5, a)}"/>`;
        if (par && aExtremo > 0.24) marcas += `<text x="${(cx + rEt * Math.cos(a)).toFixed(1)}" y="${(cy + rEt * Math.sin(a) + 4.5).toFixed(1)}">${String((18 + m / 60) % 24).padStart(2, '0')}</text>`;
      }
      // La franja, del color de la noche al de la mañana, con los bordes de la duda esfumados.
      const PARADAS = [[0, [0x5a, 0x5f, 0xd0]], [0.5, [0x6b, 0x8f, 0xf0]], [1, [0xa8, 0xe2, 0xf0]]];
      const colorEn = (x) => {
        const f = Math.min(1, Math.max(0, (x - (cx - GRUESO.r)) / (2 * GRUESO.r)));
        const [q0, q1] = f < 0.5 ? [PARADAS[0], PARADAS[1]] : [PARADAS[1], PARADAS[2]];
        const k = (f - q0[0]) / (q1[0] - q0[0]);
        return `rgb(${q0[1].map((v, i) => Math.round(v + (q1[1][i] - v) * k)).join(',')})`;
      };
      let defs = `<linearGradient id="${id}t" gradientUnits="userSpaceOnUse" x1="${cx - GRUESO.r}" x2="${cx + GRUESO.r}" y1="0" y2="0"><stop offset="0" stop-color="${colorEn(cx - GRUESO.r)}"/><stop offset="0.5" stop-color="${colorEn(cx)}"/><stop offset="1" stop-color="${colorEn(cx + GRUESO.r)}"/></linearGradient>`;
      let banda = '';
      const r = n.rango;
      const a = ang(r.dormirse[1]), b = ang(r.despertar[0]);
      const esfumar = (x0, x1, de, hacia, cual) => {
        if (x1 <= x0) return;
        const px = (x) => cx + GRUESO.r * Math.cos(x), py = (x) => cy + GRUESO.r * Math.sin(x);
        defs += `<linearGradient id="${id}${cual}" gradientUnits="userSpaceOnUse" x1="${px(x0).toFixed(2)}" y1="${py(x0).toFixed(2)}" x2="${px(x1).toFixed(2)}" y2="${py(x1).toFixed(2)}"><stop offset="0" stop-color="${colorEn(px(x0))}" stop-opacity="${de}"/><stop offset="1" stop-color="${colorEn(px(x1))}" stop-opacity="${hacia}"/></linearGradient>`;
        banda += `<path class="dsp-grueso" stroke="url(#${id}${cual})" stroke-width="${GRUESO.w}" d="${trazo(GRUESO.r, x0, x1)}"/>`;
      };
      esfumar(ang(r.dormirse[0]), a + 0.008, 0, 1, 'a');
      esfumar(b - 0.008, ang(r.despertar[1]), 1, 0, 'b');
      banda += `<path class="dsp-grueso" stroke="url(#${id}t)" stroke-width="${GRUESO.w}" d="${trazo(GRUESO.r, a, b)}"/>`;
      // Cada despertar: la franja se oscurece en ese rato (no se corta) y, en el medio, un trazo durazno.
      let cortes = '';
      des.forEach((d, i) => {
        const w = 8, borde = (w / 2 + 0.6) / GRUESO.r;
        let a0 = ang(d.desde) + borde, a1 = ang(d.hasta) - borde;
        if (a1 <= a0) { a0 = (a0 + a1) / 2; a1 = a0 + 0.001; }
        const turno = ` data-i="${i}" style="--i:${i}"`;
        cortes += `<path class="dsp-hueco"${turno} stroke-width="${GRUESO.w + 1}" d="${trazo(GRUESO.r, ang(d.desde), ang(d.hasta))}"/>`
          + `<path class="dsp-corte"${turno} stroke-width="${w}" d="${trazo(GRUESO.r, a0, a1)}"/>`;
      });
      const revela = `<path class="dsp-revela${animar ? ' animar' : ''}" pathLength="1" stroke-width="64" d="${trazo(126, pi, 2 * pi)}"/>`;
      caja.innerHTML = `<svg viewBox="0 0 ${ancho} ${alto}" aria-hidden="true">
        <defs><linearGradient id="${id}c" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#6a5fd6" stop-opacity="0.26"/><stop offset="0.55" stop-color="#6b8ff0" stop-opacity="0.14"/><stop offset="1" stop-color="#a8e2f0" stop-opacity="0.22"/></linearGradient>${defs}</defs>
        <path fill="url(#${id}c)" stroke="none" d="M${cx - 104} ${cy} A104 104 0 0 1 ${cx + 104} ${cy} Z"/>${estrellas}
        <line class="dsp-horizonte" x1="4" x2="${ancho - 4}" y1="${cy + 1}" y2="${cy + 1}"/>
        <mask id="${id}m" maskUnits="userSpaceOnUse" x="-10" y="-10" width="${ancho + 20}" height="${alto + 40}">${revela}</mask>${marcas}
        <path class="dsp-pista" stroke-width="${GRUESO.w}" d="${trazo(GRUESO.r, pi, 2 * pi)}"/>
        <g mask="url(#${id}m)"><g class="dsp-banda">${banda}</g>${cortes}</g></svg>`;
      const medio = el('div', 'dsp-centro');
      const grande = el('b', null, centro[0]), chico = el('span', null, centro[1]);
      medio.append(grande, chico);
      caja.appendChild(medio);
      /** Lee un despertar en el centro y lo resalta; con -1, vuelve a la noche. */
      const marcar = (i) => {
        caja.classList.toggle('leyendo', i >= 0);
        caja.querySelectorAll('[data-i]').forEach((x) => x.classList.toggle('leido', Number(x.dataset.i) === i));
        const d = des[i];
        grande.textContent = d ? tx('sueno.etapas.despierto') : centro[0];
        chico.textContent = d ? `${reloj(d.desde)} – ${reloj(d.hasta)} · ${u.duracion(d.hasta - d.desde)}` : centro[1];
        medio.classList.remove('cambia');
        void medio.offsetWidth;
        medio.classList.add('cambia');
      };
      // Como las etapas con reloj: se busca por la hora, con tolerancia, porque un corte es chico. Lo que se toca
      // mide al menos 44 px sobre la franja (un despertar de 20 minutos mide 12): gana el más cercano.
      const alcance = (22 / GRUESO.r / pi) * (hasta - desde);
      caja.addEventListener('click', (ev) => {
        if (!des.length) return;
        const rc = caja.querySelector('svg').getBoundingClientRect();
        const x = ((ev.clientX - rc.left) / rc.width) * ancho - cx, y = ((ev.clientY - rc.top) / rc.height) * alto - cy;
        const lejos = Math.hypot(x, y);
        let i = -1, cerca = Infinity;
        if (y <= 0 && lejos > 96 && lejos < 156) {
          const m = desde + ((Math.atan2(y, x) + 2 * pi - pi) / pi) * (hasta - desde);
          des.forEach((d, k) => {
            const dist = Math.abs(m - (d.desde + d.hasta) / 2);
            if (dist <= Math.max((d.hasta - d.desde) / 2 + 10, alcance) && dist < cerca) { i = k; cerca = dist; }
          });
        }
        elegir(i === estado.leido ? -1 : i);
      });
      return { caja, marcar };
    }

    // ------------------------------------------------------------ la tarjeta
    function cabecera(c) {
      const cab = el('header', 'dsp-cab');
      cab.append(el('span', null, tx('sueno.anoche')), el('em', 'dsp-origen', tx('sueno.origen.estimada')));
      c.appendChild(cab);
    }
    const rangoTexto = (n) => `${tx('sueno.rango', { a: reloj(n.rango.dormirse[0]), b: reloj(n.rango.dormirse[1]), c: reloj(n.rango.despertar[0]), d: reloj(n.rango.despertar[1]) })} ${tx('sueno.seguridad.' + n.seguridad)}.`;
    const cambiar = () => boton('dsp-cambiar', tx('sueno.cambiarHora'), () => {});

    /** Una línea de un despertar: la hora, su punto y qué pasó. */
    function linea(min, texto, debajo, clase) {
      const f = el('span', 'dsp-fila ' + clase), marca = el('span', 'dsp-marca'), que = el('span', 'dsp-que', texto);
      marca.appendChild(el('i'));
      if (debajo) que.appendChild(el('small', null, debajo));
      f.append(el('b', 'dsp-hora', reloj(min)), marca, que);
      return f;
    }

    function cartaNueva(n, animar) {
      const t = textos(), c = el('article', 'dsp-carta' + (animar ? ' dsp-entra' : ''));
      // Con la regla de la app: un toque de hasta 5 minutos resta lo usado más 5, no el margen entero.
      const des = n.despertares.map((d) => Object.assign({}, d, { hasta: d.dejaste + SinReloj.margenDelDespertar(d.dejaste - d.desde, MARGEN_DSP) }));
      const despierto = des.reduce((s, d) => s + d.hasta - d.desde, 0);
      cabecera(c);
      const titular = el('p', 'dsp-titular');
      titular.append(t.dormiste[0], el('b', null, reloj(n.dormirse)), t.dormiste[1], el('b', null, reloj(n.despertar)));
      c.appendChild(titular);
      arco = arcoDe(n, des, [u.duracion(n.despertar - n.dormirse - despierto), tx('sueno.dormidoAprox')], animar);
      arco.caja.setAttribute('role', 'img');
      arco.caja.setAttribute('aria-label', t.aria(reloj(n.dormirse), reloj(n.despertar), des.length));
      c.appendChild(arco.caja);
      if (des.length) {
        const lista = el('div', 'dsp-lista');
        des.forEach((d, i) => {
          const b = boton('dsp-desp', '', () => elegir(i === estado.leido ? -1 : i));
          b.setAttribute('aria-pressed', 'false');
          b.style.setProperty('--i', String(i));
          b.append(linea(d.desde, t[d.tipo], null, 'empieza'), linea(d.hasta, t.volviste, t.dejaste(reloj(d.dejaste)), 'vuelve'));
          lista.appendChild(b);
        });
        const total = el('div', 'dsp-total');
        total.style.setProperty('--n', String(des.length));
        total.append(el('span', null, t.total), el('b', null, u.duracion(despierto)), el('small', null, t.noCuenta));
        c.append(lista, total);
      } else c.appendChild(el('p', 'dsp-ninguno', t.ninguno));
      c.append(el('p', 'dsp-texto', rangoTexto(n)), el('p', 'dsp-nota', tx('sueno.estimadaTexto', { margen: MARGEN_DSP })), el('p', 'dsp-nota', t.sinEtapas), cambiar());
      return c;
    }

    /** Antes: la noche cortada donde agarraste el teléfono, con lo de la tarjeta de hoy tal cual. */
    function cartaDeAntes(n, animar) {
      const c = el('article', 'dsp-carta');
      cabecera(c);
      arco = arcoDe(n, [], [u.duracion(n.despertar - n.dormirse), tx('sueno.dormidoAprox')], animar);
      arco.caja.setAttribute('role', 'img');
      arco.caja.setAttribute('aria-label', tx('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) }));
      const horas = el('div', 'dsp-horas');
      const lado = (clase, icono, hora, texto) => {
        const h = el('div', 'dsp-lado ' + clase);
        h.innerHTML = icono;
        h.append(el('b', null, hora), el('small', null, texto));
        return h;
      };
      horas.append(lado('inicio', Util.icono('sueno'), reloj(n.dormirse), tx('sueno.manana.teDormiste')), lado('fin', SOL_DSP, reloj(n.despertar), tx('sueno.manana.teDespertaste')));
      c.append(arco.caja, horas, el('p', 'dsp-texto sin-linea', rangoTexto(n)), el('p', 'dsp-nota', tx('sueno.estimadaTexto', { margen: MARGEN_DSP })), el('p', 'dsp-nota', tx('sueno.sinRelojEtapas')), cambiar());
      return c;
    }

    function elegir(i) {
      estado.leido = i;
      if (arco) arco.marcar(i);
      if (scroll) scroll.querySelectorAll('.dsp-desp').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    }

    // ------------------------------------------------------------ la pantalla
    function pintar(vista, animar = !quieto()) {
      const hoy = u.partes(Datos.HOY);
      scroll = el('div', 'dsp-scroll');
      const cab = el('header', 'dsp-cabeza');
      cab.append(el('div', 'dsp-fecha', tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) })), el('h2', 'dsp-pagina', tx('sueno.titulo')));
      scroll.append(cab, vista === 'antes' ? cartaDeAntes(ANTES_DSP, animar) : cartaNueva(NOCHES_DSP[vista === 'en' ? 'uno' : vista], animar));
      p.el.replaceChildren(scroll);
      Object.assign(estado, { vista, idioma: g.idioma, leido: -1 });
    }

    /** «En inglés» pone toda la galería en inglés y, al salir de esa vista, la deja como estaba. */
    function ingles(si) {
      if (si && g.idioma !== 'en') { estado.idiomaAntes = g.idioma; window.__idioma('en'); }
      if (!si && estado.idiomaAntes) { const antes = estado.idiomaAntes; estado.idiomaAntes = null; if (g.idioma !== antes) window.__idioma(antes); }
    }
    // Si el idioma cambia con la pantalla abierta, se pinta de nuevo donde estaba, con el mismo despertar leído.
    const selector = document.getElementById('s-idioma');
    if (selector) selector.addEventListener('click', () => {
      if (!p.abierta || estado.idioma === g.idioma) return;
      const leido = estado.leido, y = scroll.scrollTop;
      // Sin volver a dibujar el arco: si no, el despertar leído se apaga un segundo mientras el centro lo nombra.
      pintar(estado.vista, false);
      scroll.scrollTop = y;
      if (leido >= 0) elegir(leido);
      if (!quieto()) scroll.classList.add('entra');
    });
    // Como en Sueño: de costado no se cambia de sección mientras se mira la tarjeta.
    document.addEventListener('pointerdown', (ev) => { if (p.abierta && p.el.contains(ev.target)) ev.stopPropagation(); }, true);

    return {
      abrir(vista) {
        ingles(vista === 'en');
        if (!p.abierta && estado.pestanaAntes == null) estado.pestanaAntes = g.pestana;
        // La noche vive en Sueño: la barra lo dice.
        if (g.pestana !== 3) g.irA(3, quieto());
        const vuelve = p.abierta;
        pintar(vista);
        if (vuelve && !quieto()) scroll.classList.add('entra');
        p.abrir();
      },
      cerrar() {
        p.cerrar();
        ingles(false);
        if (estado.pestanaAntes != null && estado.pestanaAntes !== g.pestana) g.irA(estado.pestanaAntes, quieto());
        estado.pestanaAntes = null;
      },
    };
  },
});
