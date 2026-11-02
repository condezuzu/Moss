// La foto de la comida, para aprobar (spec/nutricion.md, «La foto de la comida»): sacarla al anotar, o
// elegirla de las del iPhone, y después decir o escribir qué es; Moss lo calcula con la base. La foto no
// se analiza: queda en el día, en la tira «Tu día en fotos», que sin fotos no ocupa lugar.
// Los platos son dibujos: la galería no usa fotos de stock ni baja nada. comida.js pone el camino
// (la hoja, decir lo que comí y lo anotado); acá están las fotos, el visor, la tira y la hoja de cada una.

const FotosDeComida = (() => {
  const CSS = `
.fd-lugar { display: grid; grid-template-rows: 0fr; margin: 0 -20px; transition: grid-template-rows 0.45s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fd-lugar.con-fotos { grid-template-rows: 1fr; }
.fd-dentro { min-height: 0; overflow: hidden; opacity: 0; transition: opacity 0.3s; }
.fd-lugar.con-fotos .fd-dentro { opacity: 1; }
.fd-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 26px 20px 0; margin-bottom: 11px; }
.fd-cab h4 { margin: 0; font: 400 9.5px/1 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: rgba(239, 230, 207, 0.6); }
.fd-cab span { font: 400 11.5px/1 var(--texto); color: rgba(239, 230, 207, 0.55); font-variant-numeric: tabular-nums; white-space: nowrap; }
.fd-tira { position: relative; display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; padding: 0 20px 2px; touch-action: pan-x pan-y; }
.fd-tira::-webkit-scrollbar { display: none; }
.fd-tira.entra { animation: cm-entra 0.4s ease both; }
.fd-foto { appearance: none; cursor: pointer; flex: none; width: 78px; padding: 0; border: 0; background: none; color: var(--tinta); text-align: left; display: grid; align-content: start; gap: 3px; }
.fd-foto:active .fd-marco { transform: scale(0.97); }
.fd-foto.entra { animation: fd-entra 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
.fd-foto.sale { width: 0; margin-right: -10px; opacity: 0; transition: width 0.3s ease, margin 0.3s ease, opacity 0.2s; }
@keyframes fd-entra { from { width: 0; margin-right: -10px; opacity: 0; } }
.fd-marco { position: relative; display: block; width: 78px; height: 104px; margin-bottom: 4px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(239, 230, 207, 0.14); background: rgba(239, 230, 207, 0.05); transition: transform 0.15s; }
.fd-marco img { display: block; width: 100%; height: 100%; object-fit: cover; }
.fd-foto b { font: 400 12.5px/1.15 var(--texto); }
.fd-foto small { font: 400 11px/1 var(--texto); color: rgba(239, 230, 207, 0.55); font-variant-numeric: tabular-nums; }
.fd-foto.pendiente .fd-marco { border: 1px dashed rgba(232, 196, 106, 0.7); }
.fd-foto.pendiente .fd-marco img { opacity: 0.72; }
.fd-foto.pendiente b { color: var(--oro-claro); }
.fd-foto.cambia .fd-marco, .fd-foto.cambia b { animation: fd-aparece 0.45s ease both; }
.fd-punto { position: absolute; top: 7px; right: 7px; width: 8px; height: 8px; border-radius: 50%; background: var(--oro); box-shadow: 0 0 0 2px rgba(6, 10, 22, 0.7); }

.fd-mini { margin-left: auto; appearance: none; cursor: pointer; flex: none; width: 30px; height: 26px; padding: 0; border-radius: 7px; overflow: hidden; border: 1px solid rgba(239, 230, 207, 0.18); background: none; }
.fd-mini.entra { animation: fd-aparece 0.45s ease both; }
.fd-mini img { display: block; width: 100%; height: 100%; object-fit: cover; }

.fd-no-analiza { margin: 0; font: 400 12.5px/1.35 var(--texto); color: rgba(239, 230, 207, 0.68); }

.hoja.fd-directo .hj-panel { transition: none; }
.fd-visor-cuerpo { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: fd-aparece 0.3s ease both; }
@keyframes fd-aparece { from { opacity: 0; } }
.fd-visor-marco { position: relative; flex: 1; min-height: 0; margin: 2px 16px 0; border-radius: 20px; overflow: hidden; background: #000; }
.fd-visor-marco img { display: block; width: 100%; height: 100%; object-fit: cover; }
.fd-flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
.fd-visor .fd-no-analiza { flex: none; margin: 12px 20px 0; text-align: center; }
.fd-controles { flex: none; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; padding: 14px 24px calc(var(--abajo) + 10px); }
.fd-disparar { appearance: none; cursor: pointer; width: 72px; height: 72px; padding: 0; border-radius: 50%; border: 3px solid var(--tinta); background: none; display: grid; place-items: center; }
.fd-disparar i { display: block; width: 58px; height: 58px; border-radius: 50%; background: var(--tinta); transition: transform 0.12s; }
.fd-disparar:active i { transform: scale(0.9); }
.fd-elegir { appearance: none; cursor: pointer; justify-self: start; display: grid; justify-items: center; gap: 5px; padding: 0; border: 0; background: none; color: rgba(239, 230, 207, 0.8); font: 400 11.5px/1 var(--texto); }
.fd-elegir span { display: block; width: 46px; height: 46px; border-radius: 10px; overflow: hidden; border: 1px solid rgba(239, 230, 207, 0.3); }
.fd-elegir img { display: block; width: 100%; height: 100%; object-fit: cover; }

.fd-selector { position: absolute; left: 0; right: 0; bottom: 0; top: 0; z-index: 2; display: flex; flex-direction: column; background: #101524; border-radius: 18px 18px 0 0; transform: translateY(100%); transition: transform 0.36s cubic-bezier(0.2, 0.8, 0.2, 1); }
.fd-selector[hidden] { display: none; }
.fd-selector.visible { transform: none; }
.fd-selector-cab { flex: none; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; height: 50px; padding: 0 14px; border-bottom: 1px solid rgba(239, 230, 207, 0.08); }
.fd-selector-cab b { font: 500 15px/1 var(--texto); }
.fd-selector-cab button { appearance: none; cursor: pointer; justify-self: start; border: 0; background: none; padding: 6px; color: var(--oro-claro); font: 400 14px/1 var(--texto); }
.fd-grilla { flex: 1; min-height: 0; overflow-y: auto; scrollbar-width: none; display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: max-content; gap: 2px; padding: 2px; }
.fd-grilla button { appearance: none; cursor: pointer; padding: 0; border: 0; background: none; aspect-ratio: 1; overflow: hidden; }
.fd-grilla img { display: block; width: 100%; height: 100%; object-fit: cover; }
.fd-selector p { flex: none; margin: 0; padding: 12px 20px calc(var(--abajo) + 8px); text-align: center; font: 400 12.5px/1.35 var(--texto); color: rgba(239, 230, 207, 0.65); border-top: 1px solid rgba(239, 230, 207, 0.08); }

.fd-cabeza { flex: none; display: grid; grid-template-columns: 66px minmax(0, 1fr); gap: 13px; align-items: center; padding: 4px 20px 6px; }
.fd-cabeza .fd-marco { z-index: 3; width: 66px; height: 88px; margin: 0; transform-origin: top left; }
.fd-cabeza-txt { display: grid; gap: 8px; min-width: 0; animation: cm-entra 0.35s ease both; }
.fd-acciones { display: flex; gap: 14px; }
.fd-acciones button { appearance: none; cursor: pointer; padding: 2px 0; border: 0; background: none; color: var(--oro-claro); font: 400 13px/1.2 var(--texto); text-decoration: underline; text-decoration-color: rgba(246, 227, 166, 0.3); text-underline-offset: 3px; }
.hj-decir.con-foto .dc-cuerpo, .hj-decir.con-foto .fi-pie, .hj-decir.con-foto .hj-sub-titulo { animation: cm-entra 0.35s ease both; }
.hj-decir.con-foto .dc-mic-lugar { height: 96px; }
.fd-despues { appearance: none; cursor: pointer; height: 34px; border: 0; background: none; color: rgba(239, 230, 207, 0.72); font: 400 14px/1 var(--texto); }

.tel .hb.fd-hoja { padding-bottom: 0; }
.fd-cuerpo { min-height: 0; overflow-y: auto; scrollbar-width: none; padding: 8px 20px 14px; display: grid; gap: 12px; }
.fd-cuerpo::-webkit-scrollbar { display: none; }
.fd-grande { display: block; width: 100%; aspect-ratio: 5 / 4; object-fit: cover; border-radius: 16px; }
.fd-anotado { display: grid; gap: 7px; padding: 11px 14px 10px; border-radius: 16px; background: rgba(6, 10, 22, 0.66); border: 1px solid rgba(239, 230, 207, 0.1); }
.fd-anotado header { display: flex; align-items: baseline; gap: 8px; }
.fd-anotado header b { font: 500 15px/1.2 var(--texto); }
.fd-anotado ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.fd-anotado li { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: baseline; }
.fd-anotado footer { display: flex; gap: 12px; padding-top: 8px; border-top: 1px solid rgba(239, 230, 207, 0.07); }
.fd-sin-anotar { margin: 0; font: 400 14px/1.45 var(--texto); color: rgba(239, 230, 207, 0.86); }
.fd-pie-nota { margin: 0; font: 400 12px/1.4 var(--texto); color: rgba(239, 230, 207, 0.55); }
.fd-hoja .fi-quitar { width: 100%; }
@media (prefers-reduced-motion: reduce) {
  .fd-lugar, .fd-dentro, .fd-foto.sale, .fd-selector { transition-duration: 0.01s; }
  .fd-tira.entra, .fd-foto.entra, .fd-foto.cambia .fd-marco, .fd-foto.cambia b, .fd-mini.entra, .fd-visor-cuerpo, .fd-cabeza-txt, .hj-decir.con-foto .dc-cuerpo, .hj-decir.con-foto .fi-pie, .hj-decir.con-foto .hj-sub-titulo { animation-duration: 0.01s; }
}
`;

  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ------------------------------------------------------------ los platos dibujados
  // A 3:4, como una foto del iPhone. Todo en SVG y sin el verde vivo, que es solo del cielo.
  const azar = (semilla) => { let x = semilla; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
  const puntos = (semilla, n, cx, cy, rx, ry, r0, r1, colores) => {
    const a = azar(semilla);
    let s = '';
    for (let i = 0; i < n; i++) {
      const t = a() * Math.PI * 2, d = Math.sqrt(a());
      s += `<circle cx="${(cx + Math.cos(t) * d * rx).toFixed(1)}" cy="${(cy + Math.sin(t) * d * ry).toFixed(1)}" r="${(r0 + a() * (r1 - r0)).toFixed(1)}" fill="${colores[Math.floor(a() * colores.length)]}"/>`;
    }
    return s;
  };
  const hoja = (x, y, largo, giro, color) => `<g transform="translate(${x} ${y}) rotate(${giro})"><path d="M0 0C${largo * 0.25} ${-largo * 0.34} ${largo * 0.75} ${-largo * 0.34} ${largo} 0 ${largo * 0.75} ${largo * 0.34} ${largo * 0.25} ${largo * 0.34} 0 0z" fill="${color}"/><path d="M${largo * 0.1} 0H${largo * 0.9}" stroke="#000" stroke-opacity=".14" stroke-width="1" fill="none"/></g>`;
  const fondo = `<defs>
<radialGradient id="m" cx="50%" cy="48%" r="78%"><stop offset="0" stop-color="#40342c"/><stop offset=".7" stop-color="#2a221d"/><stop offset="1" stop-color="#191411"/></radialGradient>
<radialGradient id="p" cx="46%" cy="40%" r="68%"><stop offset="0" stop-color="#f7f3ea"/><stop offset=".75" stop-color="#ece6d8"/><stop offset="1" stop-color="#cbc4b2"/></radialGradient>
<radialGradient id="v" cx="50%" cy="50%" r="72%"><stop offset=".62" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></radialGradient>
</defs><rect width="300" height="400" fill="url(#m)"/><path d="M0 74c70-8 150 10 300-4M0 150c90 8 190-10 300 2M0 262c100-8 180 10 300-2M0 336c80 6 200-8 300 4" stroke="#000" stroke-opacity=".16" stroke-width="2" fill="none"/>`;
  const plato = (cx = 150, cy = 205, r = 126) => `<ellipse cx="${cx + 3}" cy="${cy + 9}" rx="${r + 3}" ry="${r + 2}" fill="#000" opacity=".4"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#p)"/><circle cx="${cx}" cy="${cy}" r="${r * 0.73}" fill="#f4efe4" stroke="#d6d0bf" stroke-width="1.4"/>`;
  const cierre = '<rect width="300" height="400" fill="url(#v)"/>';

  const fideosHebras = () => {
    const a = azar(41);
    let s = '';
    // Un nido: cada hebra es un arco alrededor de un centro corrido, de afuera hacia adentro.
    for (let i = 0; i < 46; i++) {
      const r = 72 - (i / 46) * 58 + a() * 8;
      const cx = 150 + (a() - 0.5) * 14, cy = 205 + (a() - 0.5) * 12;
      const t0 = a() * Math.PI * 2, t1 = t0 + 0.9 + a() * 1.5;
      const x0 = cx + Math.cos(t0) * r, y0 = cy + Math.sin(t0) * r * 0.92;
      const x1 = cx + Math.cos(t1) * r, y1 = cy + Math.sin(t1) * r * 0.92;
      s += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}A${r.toFixed(1)} ${(r * 0.92).toFixed(1)} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${i % 3 === 0 ? '#d3b778' : '#ead492'}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
    }
    return s;
  };

  const DIBUJOS = {
    fideos: () => plato() + fideosHebras()
      + '<path d="M118 178c10-22 50-28 72-14 20 12 22 38 6 52-18 16-54 16-72 2-13-10-12-27-6-40z" fill="#a23f27"/>'
      + '<path d="M128 182c12-14 40-18 54-8 12 9 12 26 2 35-12 11-36 11-48 2-10-8-13-20-8-29z" fill="#b34c30"/>'
      + puntos(7, 12, 156, 192, 26, 20, 1.6, 3.4, ['#8c3420', '#c7643f', '#7f8a4f'])
      + puntos(13, 48, 154, 196, 40, 34, 1.1, 2.1, ['#f6efd9', '#efe3bf'])
      + hoja(170, 172, 26, -24, '#667f4c') + hoja(172, 174, 22, 34, '#74905a'),
    milanesa: () => plato()
      + '<path d="M82 172c16-30 66-44 104-30 28 10 42 36 26 60-16 25-62 38-98 30-34-8-46-36-32-60z" fill="#a4702f"/>'
      + '<path d="M90 174c14-25 60-38 94-26 25 9 36 31 23 52-14 22-55 33-88 26-30-7-41-31-29-52z" fill="#c08a42"/>'
      + puntos(23, 90, 148, 184, 56, 40, 0.8, 2, ['#d9aa60', '#a9742f', '#e3bb78'])
      + '<path d="M200 142a23 23 0 0 1 28 26z" fill="#e5d27a"/><path d="M204 146a17 17 0 0 1 20 19z" fill="#f2e6a3"/>'
      + '<path d="M170 240c16-14 52-14 64 2 9 13-1 32-24 37-26 6-52-4-55-18-1-8 6-16 15-21z" fill="#ecd9a4"/>'
      + '<path d="M176 256c12-10 36-12 46-2M184 268c10-6 24-7 32-2" stroke="#d3bc82" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
      + hoja(84, 262, 44, 18, '#5e7645') + hoja(96, 244, 46, 42, '#73905a') + hoja(82, 282, 42, -8, '#7f9b63') + hoja(118, 276, 36, -26, '#667f4c')
      + '<circle cx="126" cy="262" r="10" fill="#b0503a"/><circle cx="126" cy="262" r="6" fill="#c56a50"/><circle cx="104" cy="286" r="8.5" fill="#b0503a"/><circle cx="104" cy="286" r="5" fill="#c56a50"/>',
    desayuno: () => plato(132, 250, 104)
      + '<g transform="rotate(-12 110 236)"><rect x="70" y="200" width="82" height="76" rx="14" fill="#b98a4c"/><rect x="77" y="207" width="68" height="62" rx="10" fill="#d9b478"/><path d="M84 222c14-8 38-8 52 0 4 12 2 30-6 36-14 6-36 4-44-4-5-9-6-22-2-32z" fill="#8d5a2a"/></g>'
      + '<g transform="rotate(16 160 268)"><rect x="124" y="232" width="78" height="72" rx="14" fill="#b98a4c"/><rect x="131" y="239" width="64" height="58" rx="10" fill="#dcb97e"/></g>'
      + '<ellipse cx="222" cy="108" rx="52" ry="52" fill="#000" opacity=".35"/><circle cx="220" cy="102" r="50" fill="#e9e3d5"/><circle cx="220" cy="102" r="41" fill="#8a5d3a"/><circle cx="220" cy="102" r="41" fill="#c49a70" opacity=".55"/><path d="M204 96c8-10 26-10 34 0-8 12-26 12-34 0z" fill="#e2c7a0" opacity=".8"/><path d="M180 136l-16 18" stroke="#e9e3d5" stroke-width="11" stroke-linecap="round"/>'
      + '<path d="M36 96c16 30 56 40 92 22-4 14-20 28-44 30-26 2-48-14-50-34-1-8 0-14 2-18z" fill="#e4cd6c"/><path d="M36 96c-2-4 0-10 4-8l4 6z" fill="#7d6a35"/>',
    yogur: () => '<ellipse cx="153" cy="214" rx="112" ry="110" fill="#000" opacity=".4"/><circle cx="150" cy="205" r="110" fill="#d6cfc0"/><circle cx="150" cy="205" r="99" fill="#b9b2a2"/><circle cx="150" cy="207" r="94" fill="#f3eee2"/>'
      + '<path d="M86 196c20-30 60-34 92-22 12 22 8 50-16 60-32 12-72 2-82-16-3-8 0-16 6-22z" fill="#b98a4a"/>'
      + puntos(31, 60, 132, 203, 46, 30, 3, 6.2, ['#a97a3d', '#c79a58', '#8f6631', '#d8b273'])
      + '<circle cx="198" cy="164" r="19" fill="#ead98d"/><circle cx="198" cy="164" r="14" fill="#f5eab3"/><circle cx="216" cy="192" r="19" fill="#ead98d"/><circle cx="216" cy="192" r="14" fill="#f5eab3"/><circle cx="208" cy="224" r="19" fill="#ead98d"/><circle cx="208" cy="224" r="14" fill="#f5eab3"/>'
      + puntos(5, 7, 150, 262, 40, 16, 7, 9.5, ['#5d2f49', '#6e3a55', '#4c2740'])
      + puntos(9, 5, 150, 262, 40, 16, 1.4, 2.2, ['#a07a90']),
    pizza: () => plato()
      + '<g><path d="M150 205 88 98c38-22 86-22 124 0z" fill="#b98347"/><path d="M150 196 98 106c32-16 72-16 104 0z" fill="#e2bd61"/></g>'
      + puntos(17, 7, 150, 142, 30, 26, 8, 11, ['#a8452c', '#b5533a'])
      + puntos(19, 26, 150, 145, 36, 34, 1.2, 2.6, ['#f1d98c', '#cf9f4a'])
      + '<g transform="rotate(118 150 205)"><path d="M150 205 88 98c38-22 86-22 124 0z" fill="#b98347"/><path d="M150 196 98 106c32-16 72-16 104 0z" fill="#e2bd61"/></g>'
      + puntos(29, 7, 210, 240, 26, 24, 8, 11, ['#a8452c', '#b5533a'])
      + puntos(37, 26, 208, 240, 30, 28, 1.2, 2.6, ['#f1d98c', '#cf9f4a']),
    pollo: () => plato()
      + '<path d="M86 208c10-26 48-38 80-34 34 4 56 26 50 50-6 22-40 34-74 32-36-2-68-22-56-48z" fill="#c79a5e"/>'
      + '<path d="M94 208c9-21 42-31 70-28 30 3 49 22 44 42-5 18-35 28-65 26-31-2-59-19-49-40z" fill="#dbb67c"/>'
      + '<path d="M112 190l34 52M136 182l36 62M162 180l32 56M188 188l20 36" stroke="#8f6636" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85"/>'
      + '<path d="M104 128c18-16 74-20 102-2 14 10 12 28-4 34-28 12-74 12-100 0-14-8-10-24 2-32z" fill="#f7f2e6"/>'
      + (() => { const a = azar(53); let s = ''; for (let i = 0; i < 80; i++) { const x = 104 + a() * 104, y = 122 + a() * 40, g = a() * 180; s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="8" height="2.6" rx="1.3" fill="#e4dcc7" transform="rotate(${g.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; } return s; })()
      + hoja(92, 288, 62, -8, '#62794a') + hoja(102, 302, 60, -16, '#6f8a55') + hoja(118, 282, 58, 4, '#7c9561'),
  };
  const guardados = {};
  // Como una imagen de verdad: un archivo aparte, sin heredar nada del CSS de la página.
  function fuente(clave) {
    if (!guardados[clave]) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">${fondo}${DIBUJOS[clave]()}${cierre}</svg>`;
      guardados[clave] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    return guardados[clave];
  }

  // ------------------------------------------------------------ las fotos
  function crear(tel, o) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const { tx, plural, el, boton, icono, hora, numero } = o;

    // Una foto: { id, dia, hora, plato, comida, items }. Sin comida está pendiente; con comida y sin
    // items, es la foto de una comida ya anotada: muestra toda la comida.
    const s = { fotos: [], siguiente: 1 };
    const pendiente = (f) => !f.comida;
    const deDia = (d) => s.fotos.filter((f) => f.dia === d).sort((a, b) => a.hora - b.hora);
    const deComida = (d, tipo) => deDia(d).find((f) => f.comida === tipo) || null;

    const imagen = (plato, clase) => {
      const i = el('img', clase);
      i.src = fuente(plato);
      i.alt = '';
      i.draggable = false;
      return i;
    };

    // ---------------------------------------------- la tira: sin fotos no ocupa lugar
    const lugar = o.lugar;
    lugar.className = 'fd-lugar';
    const dentro = el('div', 'fd-dentro');
    const cab = el('div', 'fd-cab');
    const titulo = el('h4');
    const cuenta = el('span');
    cab.append(titulo, cuenta);
    const tira = el('div', 'fd-tira');
    dentro.append(cab, tira);
    lugar.appendChild(dentro);
    let diaPintado = null;

    function pintarTira() {
      const d = o.dia();
      const lista = deDia(d);
      const conFotos = lista.length > 0;
      lugar.classList.toggle('con-fotos', conFotos);
      // Sin fotos, se cierra con lo que tenía adentro: no se vacía de golpe.
      if (!conFotos) return;
      titulo.textContent = tx('comida.fotoDiario.tira');
      const sinAnotar = lista.filter(pendiente).length;
      cuenta.textContent = sinAnotar ? plural('comida.fotoDiario.pendientes', sinAnotar) : plural('comida.fotoDiario.cuantas', lista.length);
      tira.innerHTML = '';
      if (d !== diaPintado && diaPintado !== null) {
        tira.classList.remove('entra');
        void tira.offsetWidth;
        tira.classList.add('entra');
      }
      diaPintado = d;
      lista.forEach((f) => tira.appendChild(miniatura(f)));
      // La que acaba de entrar queda a la vista, sin mover la página (como haría scrollIntoView).
      const entra = tira.querySelector('.entra:last-child') || tira.querySelector('.entra');
      if (entra) {
        lista.forEach((f) => { delete f.entra; });
        setTimeout(() => tira.scrollTo({ left: entra.offsetLeft - (tira.clientWidth - 78) / 2, behavior: quieto() ? 'auto' : 'smooth' }), 80);
      }
    }

    function miniatura(f) {
      const b = boton('fd-foto' + (pendiente(f) ? ' pendiente' : '') + (f.entra ? ' entra' : '') + (f.cambia ? ' cambia' : ''), '', () => abrir(f), tituloDe(f));
      delete f.cambia;
      b.dataset.foto = f.id;
      const marco = el('span', 'fd-marco');
      marco.appendChild(imagen(f.plato));
      if (pendiente(f)) marco.appendChild(el('i', 'fd-punto'));
      b.append(marco, el('b', null, pendiente(f) ? tx('comida.fotoDiario.sinAnotar') : tx('comida.comidas.' + f.comida)), el('small', null, hora(Math.round(f.hora))));
      return b;
    }

    // La foto en la tarjeta de su comida, en lugar de la cámara: abre lo mismo que la tira.
    function mini(f) {
      const b = boton('fd-mini' + (f.miniNueva ? ' entra' : ''), '', () => abrir(f), tx('comida.fotos.ver'));
      delete f.miniNueva;
      b.appendChild(imagen(f.plato));
      return b;
    }

    // ---------------------------------------------- cambiar lo que hay
    const cambio = () => { pintarTira(); o.alCambiar(); };
    function nueva({ dia = 0, hora: h, plato, comida = null, items = null }) {
      const f = { id: s.siguiente++, dia, hora: h, plato, comida, items, entra: true, miniNueva: true };
      s.fotos.push(f);
      cambio();
      return f;
    }
    function anotar(f, tipo, items) { f.comida = tipo; f.items = items; f.cambia = true; f.miniNueva = true; cambio(); }
    function desanotar(f) { f.comida = null; f.items = null; f.cambia = true; cambio(); }
    function reemplazar(f, plato) { f.plato = plato; f.entra = true; f.miniNueva = true; cambio(); }

    // Sale con su animación; recién después se acomoda el resto.
    function quitar(f) {
      const nodo = tira.querySelector(`[data-foto="${f.id}"]`);
      const sacar = () => {
        const i = s.fotos.indexOf(f);
        if (i >= 0) s.fotos.splice(i, 1);
        cambio();
      };
      const sigue = deDia(o.dia()).some((x) => x !== f);
      if (!nodo || quieto()) { sacar(); return; }
      if (!sigue) lugar.classList.remove('con-fotos');
      nodo.classList.add('sale');
      setTimeout(sacar, 300);
    }
    function devolver(f) {
      if (s.fotos.includes(f)) return;
      f.entra = true;
      f.miniNueva = true;
      s.fotos.push(f);
      cambio();
    }
    function borrar(f) {
      quitar(f);
      o.avisar(tx('comida.fotoDiario.borrada'), () => devolver(f));
    }

    // ---------------------------------------------- la hoja de cada foto
    const tituloDe = (f) => `${pendiente(f) ? tx('comida.fotoDiario.sinAnotar') : tx('comida.comidas.' + f.comida)} · ${hora(Math.round(f.hora))}`;
    const hojaFoto = Util.hoja(tel, 'fd-hoja', () => o.alCerrarHoja());
    hojaFoto.el.addEventListener('click', (ev) => { if (ev.target.closest('[data-toque]')) o.contarToque(); }, true);

    function anotadoDe(f) {
      const items = o.itemsDe(f);
      const t = o.sumar(items);
      const caja = el('section', 'fd-anotado');
      const c = el('header');
      c.appendChild(el('b', null, tx('comida.fotoDiario.loAnotado')));
      const total = el('span', 'cm-tk');
      total.append(numero(Math.round(t.kcal)), el('small', null, ' kcal'));
      c.appendChild(total);
      const ul = el('ul');
      items.forEach((it) => {
        const li = el('li');
        const txt = el('span', 'cm-item-txt');
        txt.append(o.nombreDeItem(it));
        const cant = o.cantidadDe(it);
        if (cant) txt.append(el('em', null, ` · ${cant}`));
        li.append(txt, el('span', 'cm-item-k', numero(Math.round(o.valoresDe(it).kcal))));
        ul.appendChild(li);
      });
      const pie = el('footer');
      [['p', t.p], ['c', t.c], ['g', t.g]].forEach(([m, g]) => {
        const chip = el('span', 'cm-mini cm-mini-' + m);
        chip.append(el('i'), `${numero(Math.round(g))} g`);
        pie.appendChild(chip);
      });
      caja.append(c, ul, pie);
      return caja;
    }

    function abrir(f) {
      const h = hojaFoto.el;
      h.innerHTML = '';
      const arriba = el('header', 'hb-cab');
      arriba.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tituloDe(f)), boton('hb-cerrar', icono('cerrar'), () => hojaFoto.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'fd-cuerpo');
      cuerpo.append(imagen(f.plato, 'fd-grande'), el('p', 'fd-no-analiza', tx('comida.fotoDiario.noSeAnaliza')));
      const sinNada = pendiente(f) || !o.itemsDe(f).length;
      cuerpo.appendChild(sinNada ? el('p', 'fd-sin-anotar', tx('comida.fotoDiario.sinAnotarTexto')) : anotadoDe(f));
      cuerpo.appendChild(el('p', 'fd-pie-nota', tx('comida.fotos.nota')));
      const pie = el('footer', 'fi-pie');
      // La cámara espera a que se vaya esta hoja, como en la app.
      const despues = (fn) => { hojaFoto.cerrar(); setTimeout(fn, quieto() ? 0 : 400); };
      if (sinNada) pie.appendChild(boton('fi-agregar', tx('comida.fotoDiario.anotar'), () => despues(() => o.anotarPendiente(f))));
      else pie.appendChild(boton('fi-secundario', tx('comida.fotos.cambiar'), () => despues(() => o.sacarOtra(f))));
      pie.appendChild(boton('fi-quitar', tx('comida.fotos.borrar'), () => { hojaFoto.cerrar(); borrar(f); }));
      h.append(arriba, cuerpo, pie);
      hojaFoto.abrir();
    }

    // ---------------------------------------------- el visor
    // Lo arma en el panel de la hoja de registro. En la app es CameraView, el mismo del escáner: un
    // toque hasta disparar y la fototeca a mano; el selector es el del sistema y no pide permiso.
    function armarVisor(sub, { plato = 'fideos', alSacar }) {
      sub.classList.add('fd-visor');
      const cuerpo = el('div', 'fd-visor-cuerpo');
      const marco = el('div', 'fd-visor-marco');
      const flash = el('i', 'fd-flash');
      marco.append(imagen(plato), flash);
      const disparar = boton('fd-disparar', '<i></i>', () => {
        if (disparando) return;
        disparando = true;
        const desde = marco.getBoundingClientRect();
        if (quieto()) { alSacar(plato, desde); return; }
        flash.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.3 }, { opacity: 0 }], { duration: 240, easing: 'ease-out' });
        setTimeout(() => alSacar(plato, desde), 190);
      }, tx('comida.fotoDiario.disparar'));
      let disparando = false;
      const elegir = boton('fd-elegir', '', () => selector.abrir(), tx('comida.fotoDiario.elegir'));
      const muestra = el('span');
      muestra.appendChild(imagen('pizza'));
      elegir.append(muestra, tx('comida.fotoDiario.tusFotos'));
      const controles = el('div', 'fd-controles');
      controles.append(elegir, disparar, el('span'));
      cuerpo.append(marco, el('p', 'fd-no-analiza', tx('comida.fotoDiario.noSeAnaliza')), controles);
      sub.appendChild(cuerpo);
      const selector = armarSelector(sub, alSacar);
    }

    // El selector del iPhone, dibujado: Moss recibe solo la foto que se elige.
    function armarSelector(sub, alElegir) {
      const panel = el('section', 'fd-selector');
      panel.hidden = true;
      const cabeza = el('header', 'fd-selector-cab');
      const cerrar = () => {
        panel.classList.remove('visible');
        setTimeout(() => { panel.hidden = true; }, quieto() ? 0 : 360);
      };
      cabeza.append(boton('', tx('comun.cancelar'), cerrar), el('b', null, tx('comida.fotoDiario.tusFotos')), el('span'));
      const grilla = el('div', 'fd-grilla');
      ['pizza', 'fideos', 'yogur', 'desayuno', 'pollo', 'milanesa', 'yogur', 'pizza', 'desayuno', 'milanesa', 'fideos', 'pollo', 'desayuno', 'pollo', 'pizza'].forEach((clave) => {
        const b = boton('', '', (ev) => alElegir(clave, ev.currentTarget.getBoundingClientRect()), tx('comida.fotoDiario.elegir'));
        b.appendChild(imagen(clave));
        grilla.appendChild(b);
      });
      panel.append(cabeza, grilla, el('p', null, tx('comida.fotoDiario.soloLaQueElijas')));
      sub.appendChild(panel);
      return {
        abrir() {
          panel.hidden = false;
          void panel.offsetWidth;
          panel.classList.add('visible');
        },
      };
    }

    // ---------------------------------------------- arriba de «¿Qué es?»
    // La miniatura, con la línea fija. Vuela desde el visor hasta su lugar.
    function cabeza(f, { alOtra, alBorrar, desde }) {
      const c = el('div', 'fd-cabeza');
      const marco = el('span', 'fd-marco');
      marco.appendChild(imagen(f.plato));
      const txt = el('div', 'fd-cabeza-txt');
      const acciones = el('div', 'fd-acciones');
      acciones.append(boton('', tx('comida.fotoDiario.otraFoto'), alOtra), boton('', tx('comida.fotoDiario.borrar'), alBorrar));
      txt.append(el('p', 'fd-no-analiza', tx('comida.fotoDiario.noSeAnaliza')), acciones);
      c.append(marco, txt);
      if (desde && !quieto()) {
        requestAnimationFrame(() => {
          const r = marco.getBoundingClientRect();
          if (!r.width) return;
          marco.animate(
            [{ transform: `translate(${desde.left - r.left}px, ${desde.top - r.top}px) scale(${desde.width / r.width}, ${desde.height / r.height})` }, { transform: 'none' }],
            { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
          );
        });
      }
      return c;
    }

    return {
      pintarTira, deDia, deComida, nueva, anotar, desanotar, reemplazar, quitar, devolver, pendiente, mini, abrir, armarVisor, cabeza,
      cerrarHoja: () => hojaFoto.cerrar(),
      // Para ver Comida sin fotos.
      vaciar() { s.fotos.length = 0; cambio(); },
    };
  }

  return { crear };
})();
