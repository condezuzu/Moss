// Los widgets (spec/widgets.md), con la persona de mentira: el del cielo en la pantalla de inicio,
// chico y mediano, y el de la noche en la pantalla bloqueada. Van con las medidas de un iPhone de
// 393 puntos (158 y 338 de ancho; 160 × 72 el de la pantalla bloqueada) y con lo mismo que dibuja la
// app con SwiftUI (src/widgets/): el cielo de hoy con sus estrellas, hasta cuatro «hecho» de los que
// se marcan a mano y la noche con su «Sí». Lo que se toca queda en el widget hasta abrir Moss, como
// en el iPhone. También se ve cómo los muestra iOS: tintados, transparentes y en StandBy.

const SeccionWidgets = (() => {
  // Las mismas medidas que src/widgets/Cielo.widget.tsx: la figura, su margen y su proporción.
  const FIGURA = { chico: [112, 72], mediano: [126, 80] };
  const MARGEN = 7;
  const ASPECTO = 1.7;
  const MAX_BOTONES = 4;
  const SVG = 'http://www.w3.org/2000/svg';

  const CSS = `
.tel .wg { position: absolute; inset: 0; z-index: 8; overflow: hidden; color: #fff; opacity: 0; transition: opacity 0.35s ease; pointer-events: none;
  font-family: -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; }
.tel .wg.visible { opacity: 1; pointer-events: auto; }
.tel .wg[hidden] { display: none; }
.wg-papel { position: absolute; inset: 0; background:
  radial-gradient(120% 60% at 15% 0%, #23336a 0%, rgba(35, 51, 106, 0) 62%),
  radial-gradient(90% 55% at 100% 100%, #33264f 0%, rgba(51, 38, 79, 0) 68%),
  linear-gradient(180deg, #0d1533 0%, #0a1024 58%, #070a18 100%); transition: filter 0.4s; }
.wg.en-bloqueo .wg-papel { filter: brightness(0.72); }
.wg-vista { position: absolute; inset: 0; opacity: 0; transition: opacity 0.35s ease; pointer-events: none; }
.wg-vista.activa { opacity: 1; pointer-events: auto; }
.wg-hora { position: absolute; top: 19px; left: 38px; font: 600 15px/1 inherit; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.wg-inicio .wg-hora { font-weight: 600; }

/* La pantalla de inicio: el chico con cuatro íconos al lado, el mediano debajo y el dock. */
.wg-fila { position: absolute; left: 27.5px; right: 27.5px; top: 72px; display: flex; justify-content: space-between; }
.wg-iconos { width: 158px; height: 158px; display: grid; grid-template-columns: 1fr 1fr; place-items: center; }
.wg-icono { width: 62px; height: 62px; border-radius: 15px; display: grid; place-items: center; background: var(--c, #33405f); box-shadow: inset 0 0 0 0.5px rgba(255, 255, 255, 0.12); }
.wg-icono svg { width: 28px; height: 28px; fill: none; stroke: rgba(255, 255, 255, 0.82); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.wg-icono.moss { background: linear-gradient(180deg, #0d1a38, #03050c); }
.wg-icono.moss svg { stroke: #f6e3a6; }
.wg-mediano-sitio { position: absolute; left: 27.5px; top: 254px; }
.wg-puntos { position: absolute; left: 50%; bottom: 140px; translate: -50% 0; display: flex; gap: 8px; padding: 6px 10px; border-radius: 99px; background: rgba(255, 255, 255, 0.1); }
.wg-puntos i { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.35); }
.wg-puntos i:first-child { background: #fff; }
.wg-dock { position: absolute; left: 12px; right: 12px; bottom: 22px; height: 92px; border-radius: 34px; background: rgba(255, 255, 255, 0.13); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  display: flex; justify-content: space-around; align-items: center; padding: 0 12px; }

/* El widget: el cielo de fondo (que iOS puede sacar) y lo de adentro con sus colores. */
.wg-w { position: relative; border-radius: 22px; overflow: hidden; cursor: pointer; isolation: isolate;
  --luz: #f6e3a6; --texto: #efe6cf; --tenue: rgba(239, 230, 207, 0.55); --apagada: rgba(239, 230, 207, 0.42); --linea: rgba(239, 230, 207, 0.22);
  --fondo: linear-gradient(180deg, #0d1a38 0%, #070d1f 55%, #03050c 100%);
  background: var(--fondo); box-shadow: 0 10px 28px rgba(0, 0, 0, 0.28); transition: transform 0.2s ease; }
.wg-w:active { transform: scale(0.97); }
.wg-w.completo { --linea: rgba(232, 196, 106, 0.72); --luz: #f3d58a; }
.wg-w.chico { width: 158px; height: 158px; }
.wg-w.mediano { width: 338px; height: 158px; }
.wg-adentro { position: absolute; inset: 16px; display: flex; gap: 14px; }
.wg-cielo { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.wg-w.chico .wg-cielo { flex: 1; }
.wg-w.mediano .wg-cielo { width: 126px; flex: none; }
.wg-figura { align-self: center; display: block; overflow: visible; }
.wg-cuenta { font: 500 15px/1.15 inherit; color: var(--texto); font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.wg-nombre { font: 400 11px/1.3 inherit; color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wg-figura .ln { stroke: var(--linea); stroke-width: 0.8; stroke-linecap: round; transition: stroke 0.5s; }
.wg-figura .halo { fill: url(#wg-halo); opacity: 0; transition: opacity 0.45s; }
.wg-figura .halo-stop { stop-color: var(--luz); }
.wg-figura .nucleo { fill: var(--apagada); transition: fill 0.45s, r 0.45s; }
.wg-figura .encendida .halo { opacity: 0.5; }
.wg-figura .encendida .nucleo { fill: var(--luz); }

/* Los «hecho» del mediano: un círculo que se llena, como la estrella. */
.wg-lista { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 2px; }
.wg-boton { appearance: none; border: 0; background: none; padding: 0 4px 0 2px; margin: 0; height: 30px; display: flex; align-items: center; gap: 9px; color: var(--texto);
  font: 400 13.5px/1 inherit; text-align: left; cursor: pointer; border-radius: 8px; transition: background 0.15s, opacity 0.15s; }
.wg-boton:active { opacity: 0.55; }
.wg-boton span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; transition: opacity 0.35s; }
.wg-boton.hecho span { opacity: 1; }
.wg-circulo { width: 13px; height: 13px; flex: none; border-radius: 50%; box-shadow: inset 0 0 0 1.2px var(--apagada); position: relative; transition: box-shadow 0.35s; }
.wg-circulo::after { content: ''; position: absolute; inset: 0; border-radius: 50%; background: var(--luz); transform: scale(0.2); opacity: 0; transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1.2), opacity 0.35s; }
.wg-boton.hecho .wg-circulo { box-shadow: inset 0 0 0 1.2px var(--luz), 0 0 6px rgba(246, 227, 166, 0.25); }
.wg-boton.hecho .wg-circulo::after { transform: scale(1); opacity: 1; }
.wg-solos { margin: auto 0; font: 400 12.5px/1.35 inherit; color: var(--tenue); }

/* Cómo los muestra iOS 26: tintados (todo de un color, sin el fondo) o transparentes (de vidrio). */
.wg.tintado .wg-w { --luz: #dbe6ff; --texto: #dbe6ff; --tenue: rgba(219, 230, 255, 0.55); --apagada: rgba(219, 230, 255, 0.4); --linea: rgba(219, 230, 255, 0.26);
  --fondo: rgba(58, 78, 128, 0.32); backdrop-filter: blur(22px) saturate(1.3); -webkit-backdrop-filter: blur(22px) saturate(1.3); box-shadow: inset 0 0 0 0.5px rgba(219, 230, 255, 0.18); }
.wg.transparente .wg-w { --luz: #fff; --texto: #fff; --tenue: rgba(255, 255, 255, 0.62); --apagada: rgba(255, 255, 255, 0.45); --linea: rgba(255, 255, 255, 0.32);
  --fondo: rgba(255, 255, 255, 0.06); backdrop-filter: blur(10px) brightness(1.08); -webkit-backdrop-filter: blur(10px) brightness(1.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.16); }
.wg.tintado .wg-w.completo, .wg.transparente .wg-w.completo { --linea: var(--texto); }
.wg.tintado .wg-icono, .wg.tintado .wg-icono.moss { background: rgba(58, 78, 128, 0.42); }
.wg.tintado .wg-icono svg, .wg.tintado .wg-icono.moss svg { stroke: #dbe6ff; }
.wg.transparente .wg-icono, .wg.transparente .wg-icono.moss { background: rgba(255, 255, 255, 0.08); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.16); }
.wg.transparente .wg-icono svg, .wg.transparente .wg-icono.moss svg { stroke: #fff; }

/* La pantalla bloqueada: la fecha, la hora grande y la noche debajo, en blanco (iOS la vuelve monocroma). */
.wg-bloqueo .wg-fecha { position: absolute; top: 74px; left: 0; right: 0; text-align: center; font: 600 19px/1 inherit; color: rgba(255, 255, 255, 0.86); }
.wg-bloqueo .wg-reloj { position: absolute; top: 92px; left: 0; right: 0; text-align: center; font: 600 104px/1 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.03em; color: rgba(255, 255, 255, 0.93); font-variant-numeric: tabular-nums; }
.wg-accesorios { position: absolute; top: 222px; left: 28px; right: 28px; display: flex; justify-content: center; }
.wg-noche { position: relative; width: 160px; height: 72px; padding: 6px 2px 4px; display: grid; grid-template-columns: 1fr auto; grid-template-rows: auto auto auto; column-gap: 8px; align-items: center; cursor: pointer; }
.wg-noche b { grid-column: 1 / 3; display: flex; align-items: center; gap: 5px; font: 600 13px/1.25 inherit; color: rgba(255, 255, 255, 0.7); }
.wg-noche b svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transition: opacity 0.35s; }
.wg-noche.confirmada b svg { opacity: 1; }
.wg-noche strong { font: 600 19px/1.15 inherit; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; white-space: nowrap; }
.wg-noche small { grid-column: 1 / 3; font: 400 12px/1.3 inherit; color: rgba(255, 255, 255, 0.62); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wg-si { appearance: none; border: 0; cursor: pointer; padding: 6px 15px; border-radius: 99px; background: rgba(255, 255, 255, 0.24); color: #fff; font: 600 14px/1 inherit; transition: opacity 0.3s, transform 0.2s; }
.wg-si:active { transform: scale(0.94); }
.wg-noche.confirmada .wg-si, .wg-noche.sin-pregunta .wg-si { opacity: 0; pointer-events: none; }
.wg-candado { position: absolute; right: 6px; top: 2px; width: 22px; height: 22px; opacity: 0; transition: opacity 0.25s; }
.wg-candado svg { width: 22px; height: 22px; fill: none; stroke: #fff; stroke-width: 1.6; }
.wg-noche.abriendo .wg-candado { opacity: 1; }
.wg-abajo { position: absolute; left: 46px; right: 46px; bottom: 56px; display: flex; justify-content: space-between; }
.wg-abajo i { width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 255, 255, 0.14); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); display: grid; place-items: center; }
.wg-abajo svg { width: 22px; height: 22px; fill: none; stroke: #fff; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.wg-barrita { position: absolute; left: 50%; bottom: 8px; translate: -50% 0; width: 134px; height: 5px; border-radius: 3px; background: rgba(255, 255, 255, 0.8); }

/* StandBy: el teléfono acostado, el widget sin su fondo y más grande; de noche, todo en rojo. */
.wg-standby { background: #000; }
.wg-acostado { position: absolute; left: 50%; top: 50%; width: 852px; height: 393px; translate: -50% -50%; rotate: 90deg; display: flex; align-items: center; justify-content: space-around; padding: 0 60px; }
.wg-acostado .wg-w { --fondo: transparent; box-shadow: none; transform: scale(1.95); transform-origin: center; }
.wg-acostado .wg-w:active { transform: scale(1.9); }
.wg-reloj-grande { font: 300 150px/1 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; color: #fff; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.wg-standby.de-noche .wg-acostado { filter: grayscale(1) sepia(1) saturate(5) hue-rotate(-45deg) brightness(0.62); }

@media (prefers-reduced-motion: reduce) {
  .tel .wg, .wg-vista, .wg-papel, .wg-figura .ln, .wg-figura .halo, .wg-figura .nucleo, .wg-boton span, .wg-circulo, .wg-circulo::after, .wg-noche b svg, .wg-si, .wg-candado { transition: none; }
}

/* El panel de la galería. */
#widgets .wg-medidas { margin: 0; color: var(--tenue); font-size: 13.5px; }
`;

  const ICONOS = {
    notas: '<path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5z"/><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4"/>',
    camara: '<path d="M4.5 8.5h3l1.5-2h6l1.5 2h3v10h-15z"/><circle cx="12" cy="13" r="3.2"/>',
    musica: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    mapa: '<path d="m4.5 6.5 5-2 5 2 5-2v13l-5 2-5-2-5 2z"/><path d="M9.5 4.5v13M14.5 6.5v13"/>',
    linterna: '<path d="M9 3.5h6v4l-1.5 2v10h-3v-10L9 7.5z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || Util.ICONOS[n] || ''}</svg>`;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, el } = u;
    const nombreDe = (v) => (v && typeof v === 'object' ? v[u.idioma()] || v.es : v);
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    // Lo que se tocó en el widget y la app todavía no vio: por hábito, encendido o no.
    const pendientes = new Map();
    const s = { vista: null, modo: 'color', confirmada: false, deNoche: false };

    const raiz = el('div', 'wg');
    raiz.hidden = true;
    raiz.setAttribute('role', 'region');
    raiz.setAttribute('aria-label', 'Widgets');
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    raiz.innerHTML = `
      <div class="wg-papel"></div>
      <div class="wg-vista wg-inicio">
        <div class="wg-hora">21:47</div>
        <div class="wg-fila"><div class="wg-chico-sitio"></div><div class="wg-iconos"></div></div>
        <div class="wg-mediano-sitio"></div>
        <div class="wg-puntos"><i></i><i></i></div>
        <div class="wg-dock"></div>
      </div>
      <div class="wg-vista wg-bloqueo">
        <div class="wg-fecha"></div>
        <div class="wg-reloj">7:12</div>
        <div class="wg-accesorios"><div class="wg-noche-sitio"></div></div>
        <div class="wg-abajo"><i>${icono('linterna')}</i><i>${icono('camara')}</i></div>
        <div class="wg-barrita"></div>
      </div>
      <div class="wg-vista wg-standby"><div class="wg-acostado"><div class="wg-standby-sitio"></div><div class="wg-reloj-grande">21:47</div></div></div>`;
    tel.appendChild(raiz);
    const $ = (sel) => raiz.querySelector(sel);

    const iconosDeApp = [['notas', '#3b4766'], ['musica', '#4a3a55'], ['mapa', '#3a5049'], ['camara', '#55493a']];
    iconosDeApp.forEach(([n, c]) => {
      const i = el('div', 'wg-icono');
      i.style.setProperty('--c', c);
      i.innerHTML = icono(n);
      $('.wg-iconos').appendChild(i);
    });
    ['camara', 'habitos', 'notas', 'musica'].forEach((n, k) => {
      const i = el('div', 'wg-icono' + (n === 'habitos' ? ' moss' : ''));
      if (n !== 'habitos') i.style.setProperty('--c', iconosDeApp[(k + 1) % 4][1]);
      i.innerHTML = icono(n);
      $('.wg-dock').appendChild(i);
    });

    // ------------------------------------------------------------ el cielo de hoy, como lo arma la app
    function hoy() {
      const c = opciones.cielo();
      if (!c) return null;
      const habitos = c.habitos.map((h, i) => {
        const tocado = pendientes.get(i);
        return { indice: i, nombre: nombreDe(h.nombre), aMano: !h.auto, hecho: tocado === undefined ? !!h.encendido : tocado };
      });
      return { constelacion: c.constelacion, habitos };
    }

    // Las estrellas de 0 a 1 en una caja de proporción ASPECTO, con su tamaño por el brillo
    // (src/widgets/cielo.ts, formaDeLaConstelacion).
    function forma(c, n) {
      const estrellas = c.estrellas.slice(0, Math.max(1, n));
      const plano = Escena.encajar(Escena.proyectar(estrellas), [0, 0], ASPECTO, 1);
      return {
        estrellas: plano.map(([x, y], i) => [(x + ASPECTO / 2) / ASPECTO, 0.5 - y, Math.max(0, Math.min(1, (2.2 - 0.5 * estrellas[i].mag) / 2.5))]),
        lineas: c.lineas.filter(([a, b]) => a < estrellas.length && b < estrellas.length),
      };
    }

    function figura(tam, d) {
      const [W, H] = FIGURA[tam];
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'wg-figura');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('aria-hidden', 'true');
      // El brillo de las encendidas: un degradé que se apaga hacia afuera, como el círculo difuso de la app.
      svg.innerHTML = '<defs><radialGradient id="wg-halo"><stop class="halo-stop" offset="0" stop-opacity="0.55"/><stop class="halo-stop" offset="1" stop-opacity="0"/></radialGradient></defs>';
      const { estrellas, lineas } = forma(d.constelacion, d.habitos.length);
      const pos = estrellas.map(([x, y]) => [MARGEN + x * (W - 2 * MARGEN), MARGEN + y * (H - 2 * MARGEN)]);
      lineas.forEach(([a, b]) => {
        const l = document.createElementNS(SVG, 'line');
        l.setAttribute('class', 'ln');
        l.setAttribute('x1', pos[a][0]);
        l.setAttribute('y1', pos[a][1]);
        l.setAttribute('x2', pos[b][0]);
        l.setAttribute('y2', pos[b][1]);
        svg.appendChild(l);
      });
      estrellas.forEach(([, , t], i) => {
        const prendida = !!(d.habitos[i] && d.habitos[i].hecho);
        const r = 1.2 + 1.1 * t;
        const g = document.createElementNS(SVG, 'g');
        if (prendida) g.setAttribute('class', 'encendida');
        const halo = document.createElementNS(SVG, 'circle');
        halo.setAttribute('class', 'halo');
        halo.setAttribute('cx', pos[i][0]);
        halo.setAttribute('cy', pos[i][1]);
        halo.setAttribute('r', (r + 0.6) * 3.2);
        const nucleo = document.createElementNS(SVG, 'circle');
        nucleo.setAttribute('class', 'nucleo');
        nucleo.setAttribute('cx', pos[i][0]);
        nucleo.setAttribute('cy', pos[i][1]);
        nucleo.setAttribute('r', prendida ? r + 0.6 : r);
        g.append(halo, nucleo);
        svg.appendChild(g);
      });
      return svg;
    }

    function cielo(tam, d) {
      const hechos = d.habitos.filter((h) => h.hecho).length;
      const caja = el('div', 'wg-cielo');
      caja.appendChild(figura(tam, d));
      const pie = el('div');
      pie.append(
        el('div', 'wg-cuenta', tx('widgets.cuenta', { n: hechos, total: d.habitos.length })),
        el('div', 'wg-nombre', nombreDe(d.constelacion.nombres)),
      );
      caja.appendChild(pie);
      return caja;
    }

    function widgetDelCielo(tam) {
      const d = hoy();
      const w = el('div', `wg-w ${tam}`);
      if (!d) return w;
      if (d.habitos.length && d.habitos.every((h) => h.hecho)) w.classList.add('completo');
      const adentro = el('div', 'wg-adentro');
      adentro.appendChild(cielo(tam, d));
      if (tam === 'mediano') {
        const lista = el('div', 'wg-lista');
        const aMano = d.habitos.filter((h) => h.aMano).slice(0, MAX_BOTONES);
        if (!aMano.length) lista.appendChild(el('p', 'wg-solos', tx('widgets.solos')));
        aMano.forEach((h) => {
          const b = el('button', 'wg-boton' + (h.hecho ? ' hecho' : ''));
          b.type = 'button';
          b.setAttribute('aria-pressed', String(h.hecho));
          b.append(el('i', 'wg-circulo'), el('span', null, h.nombre));
          // El botón corre en el widget: queda anotado ahí y la app lo aplica al abrirse.
          b.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const ahora = hoy().habitos[h.indice];
            pendientes.set(h.indice, !(ahora && ahora.hecho));
            pintarCielo();
            opciones.alCambiar();
          });
          lista.appendChild(b);
        });
        adentro.appendChild(lista);
      }
      w.appendChild(adentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => abrirMoss());
      return w;
    }

    // Cambia lo de adentro sin rehacer cada widget: así las transiciones de lo que se enciende se ven.
    function pintarCielo() {
      [['chico', '.wg-chico-sitio'], ['mediano', '.wg-mediano-sitio'], ['chico', '.wg-standby-sitio']].forEach(([tam, sitio]) => {
        const cont = $(sitio);
        const nuevo = widgetDelCielo(tam);
        const viejo = cont.firstChild;
        if (!viejo) { cont.appendChild(nuevo); return; }
        // Las estrellas y los círculos cambian de clase en el lugar, para que se animen.
        const encendidasNuevas = [...nuevo.querySelectorAll('.wg-figura g')].map((g) => g.classList.contains('encendida'));
        const gs = [...viejo.querySelectorAll('.wg-figura g')];
        const mismaForma = gs.length === encendidasNuevas.length && viejo.querySelectorAll('.wg-boton').length === nuevo.querySelectorAll('.wg-boton').length;
        if (!mismaForma) { cont.replaceChild(nuevo, viejo); return; }
        gs.forEach((g, i) => {
          g.classList.toggle('encendida', encendidasNuevas[i]);
          const nucleoNuevo = nuevo.querySelectorAll('.wg-figura .nucleo')[i];
          g.querySelector('.nucleo').setAttribute('r', nucleoNuevo.getAttribute('r'));
        });
        const botonesNuevos = [...nuevo.querySelectorAll('.wg-boton')];
        viejo.querySelectorAll('.wg-boton').forEach((b, i) => {
          const hecho = botonesNuevos[i].classList.contains('hecho');
          b.classList.toggle('hecho', hecho);
          b.setAttribute('aria-pressed', String(hecho));
        });
        viejo.querySelector('.wg-cuenta').textContent = nuevo.querySelector('.wg-cuenta').textContent;
        viejo.classList.toggle('completo', nuevo.classList.contains('completo'));
      });
    }

    // ------------------------------------------------------------ la noche, en la pantalla bloqueada
    function pintarNoche() {
      const cont = $('.wg-noche-sitio');
      cont.innerHTML = '';
      const sinReloj = opciones.sinReloj();
      const n = opciones.anoche();
      const w = el('div', 'wg-noche');
      const titulo = el('b');
      titulo.append(el('span', null, tx('widgets.anoche')));
      titulo.insertAdjacentHTML('beforeend', icono('check'));
      const horas = el('strong', null, n ? tx('widgets.horas', { desde: u.horaMin(n.dormirse), hasta: u.horaMin(n.despertar) }) : '—');
      const si = el('button', 'wg-si', tx('widgets.si'));
      si.type = 'button';
      const duracion = n ? u.duracion(n.dormido) : '';
      const nota = el('small');
      const candado = el('span', 'wg-candado');
      candado.innerHTML = icono('candado');
      // Con reloj, la noche ya es la medida: no hay nada que confirmar.
      const pregunta = sinReloj && !!n;
      const ponerNota = () => {
        nota.textContent = !n ? tx('widgets.seVeEnMoss') : !pregunta ? duracion : s.confirmada ? `${tx('widgets.confirmada')} · ${duracion}` : tx('widgets.fueAsi');
        w.classList.toggle('confirmada', pregunta && s.confirmada);
      };
      if (!pregunta) w.classList.add('sin-pregunta');
      ponerNota();
      // Con el teléfono bloqueado, el toque pide Face ID antes de correr.
      si.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (s.confirmada) return;
        w.classList.add('abriendo');
        setTimeout(() => {
          w.classList.remove('abriendo');
          s.confirmada = true;
          ponerNota();
          opciones.alCambiar();
        }, opciones.movimientoReducido ? 0 : 520);
      });
      w.append(titulo, horas, si, nota, candado);
      w.setAttribute('aria-label', tx('widgets.anoche'));
      w.addEventListener('click', () => abrirMoss('sueno'));
      cont.appendChild(w);
      $('.wg-fecha').textContent = u.fechaLarga(Datos.HOY).replace(/^./, (c) => c.toUpperCase());
    }

    function pintar() {
      if (raiz.hidden) return;
      pintarCielo();
      pintarNoche();
    }

    // ------------------------------------------------------------ mostrar, cambiar y abrir Moss
    function ir(vista) {
      s.vista = vista;
      raiz.hidden = false;
      raiz.classList.toggle('en-bloqueo', vista === 'bloqueo');
      raiz.querySelectorAll('.wg-vista').forEach((v) => v.classList.toggle('activa', v.classList.contains('wg-' + vista)));
      pintar();
      requestAnimationFrame(() => raiz.classList.add('visible'));
      opciones.alCambiar();
    }

    function cerrar() {
      if (raiz.hidden) return;
      s.vista = null;
      raiz.classList.remove('visible');
      setTimeout(() => { if (!s.vista) raiz.hidden = true; }, opciones.movimientoReducido ? 0 : 360);
      opciones.alCambiar();
    }

    // Al abrir Moss se aplica lo tocado en el widget (gana el último toque) y se ve en el cielo.
    function abrirMoss(seccion) {
      const c = opciones.cielo();
      const cambios = [];
      if (c) {
        c.habitos.forEach((h, i) => {
          if (pendientes.has(i) && pendientes.get(i) !== !!h.encendido) cambios.push(nombreDe(h.nombre));
        });
      }
      pendientes.clear();
      cerrar();
      opciones.alAbrirMoss(cambios, seccion || 'habitos', s.confirmada);
    }

    function ponerModo(modo) {
      s.modo = modo;
      raiz.classList.toggle('tintado', modo === 'tintado');
      raiz.classList.toggle('transparente', modo === 'transparente');
      document.querySelectorAll('#s-wg-modo button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === modo)));
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ lo que se revisa, a la derecha
    // Va antes de «Para decidir», que pasa a ser la siguiente.
    const columna = document.querySelector('.columna-texto');
    if (columna) {
      const decidir = document.getElementById('decidir');
      const numero = decidir ? decidir.querySelector('.n') : null;
      const n = numero ? Number(numero.textContent) || 11 : 11;
      if (numero) numero.textContent = String(n + 1);
      const seccion = el('section', 'item');
      seccion.id = 'widgets';
      seccion.innerHTML = `
      <h2><span class="n">${n}</span>Los widgets</h2>
      <p>El cielo en la pantalla de inicio, chico y mediano, y la noche en la pantalla bloqueada. Van con las medidas de este iPhone (158 y 338 puntos de ancho, y 160 × 72 el de la pantalla bloqueada), con lo que dibuja la app con SwiftUI. Tocá <b>Escribir</b> en el mediano y después <b>Abrir Moss</b>: la estrella se enciende en el cielo.</p>
      <div class="panel">
        <div class="controles">
          <button class="boton principal" type="button" data-wg="inicio">Pantalla de inicio</button>
          <button class="boton" type="button" data-wg="bloqueo">Pantalla bloqueada</button>
          <button class="boton" type="button" data-wg="standby">StandBy</button>
          <button class="boton" type="button" data-wg="abrirMoss">Abrir Moss</button>
        </div>
        <div class="controles">
          <div class="grupo"><span>Cómo los muestra iOS</span>
            <div class="segmento" id="s-wg-modo"><button type="button" data-valor="color" aria-pressed="true">Color</button><button type="button" data-valor="tintado" aria-pressed="false">Tintado</button><button type="button" data-valor="transparente" aria-pressed="false">Transparente</button></div>
          </div>
          <div class="grupo"><span>StandBy</span>
            <div class="segmento" id="s-wg-noche"><button type="button" data-valor="dia" aria-pressed="true">De día</button><button type="button" data-valor="noche" aria-pressed="false">De noche</button></div>
          </div>
        </div>
      </div>
      <ul class="lista">
        <li><b>El chico</b>: el cielo de hoy de un vistazo, con la constelación del día y lo encendido, cuántos van y el nombre de la constelación, chico. Tocarlo abre Moss.</li>
        <li><b>El mediano</b>: lo mismo y hasta cuatro «hecho» de los hábitos que se marcan a mano, en el orden de sus estrellas. Los de Salud y los de la comida se encienden solos y no llevan botón. Un toque enciende o apaga, como en el cielo: el círculo se llena y la estrella se enciende.</li>
        <li><b>Un toque corre en el widget</b>, con Moss cerrada (iOS 17 o más). Queda anotado en el widget, con su día, y Moss lo aplica al abrirse por el almacén: de cada hábito, ese día, gana el último cambio. Después Moss vuelve a escribir el widget con lo de verdad.</li>
        <li><b>La medianoche</b>: Moss deja armados los siete días que vienen, cada uno con su constelación y todo apagado. A las 0:00 el widget pasa solo al día nuevo, aunque no abras Moss.</li>
        <li><b>La noche, en la pantalla bloqueada</b> (cambiá a <b>Solo el iPhone</b> en Sueño): «Anoche» con las dos horas y <b>Sí</b>. Como Moss estima la noche al abrirse, la deja armada desde la noche anterior para las 4 de la mañana: lo de siempre y, cuando exista, la hora del despertador de Moss. Con el teléfono bloqueado, el «Sí» pide Face ID.
          <ul>
            <li>Al abrir Moss, si coincide con lo que estimó (20 minutos de cada lado), queda confirmada y la pregunta de la mañana no aparece. Si no coincide, Moss pregunta como siempre.</li>
            <li>Con el reloj muestra lo medido, sin botón. La mañana de cada semana en que Moss pregunta sin proponer, el widget tampoco propone.</li>
          </ul></li>
        <li><b>Cómo los muestra iOS</b>: en el tintado y el transparente de iOS 26 todo queda de un color, así que «hecho» se ve por el brillo y el círculo lleno, no por el color. StandBy saca el fondo y de noche lo pasa a rojo.</li>
        <li><b>Livianos</b>: sin imágenes, solo círculos y líneas de SwiftUI, lejos del tope de unos 30 MB. Una tarea de segundo plano los refresca cuando iOS la deja correr.</li>
        <li><b>Lo que no se puede</b>: el nombre y la descripción en la galería de widgets de iOS van solo en español (el plugin de Expo no los traduce). Tocar el widget abre Moss en Inicio: abrir directo en Hábitos o en Sueño pide que la app lea la sección del enlace.</li>
      </ul>`;
      if (decidir) columna.insertBefore(seccion, decidir);
      else columna.appendChild(seccion);
      const acciones = {
        inicio: () => ir('inicio'),
        bloqueo: () => ir('bloqueo'),
        standby: () => ir('standby'),
        abrirMoss: () => abrirMoss(s.vista === 'bloqueo' ? 'sueno' : 'habitos'),
      };
      seccion.querySelectorAll('[data-wg]').forEach((b) => b.addEventListener('click', () => {
        acciones[b.dataset.wg]();
        if (b.dataset.wg !== 'abrirMoss' && !tel.classList.contains('inmersivo')) tel.scrollIntoView({ behavior: opciones.movimientoReducido ? 'auto' : 'smooth', block: 'center' });
      }));
      seccion.querySelector('#s-wg-modo').addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (b) ponerModo(b.dataset.valor);
      });
      seccion.querySelector('#s-wg-noche').addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        seccion.querySelectorAll('#s-wg-noche button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        $('.wg-standby').classList.toggle('de-noche', b.dataset.valor === 'noche');
      });
    }
    // El idioma de la galería cambia los textos del widget.
    const idiomas = document.getElementById('s-idioma');
    if (idiomas) idiomas.addEventListener('click', () => setTimeout(pintar, 0));

    return {
      get vista() { return s.vista; },
      get modo() { return s.modo; },
      get pendientes() { return pendientes.size; },
      ir,
      cerrar,
      abrirMoss,
      ponerModo,
      deNoche(si) { s.deNoche = si; $('.wg-standby').classList.toggle('de-noche', si); },
      // Para las capturas: el mismo camino que un toque en el mediano.
      tocar(texto) {
        const b = [...raiz.querySelectorAll('.wg-mediano-sitio .wg-boton')].find((x) => x.textContent.includes(texto));
        if (b) b.click();
        return !!b;
      },
      confirmar() { const b = raiz.querySelector('.wg-si'); if (b) b.click(); },
      olvidar() { pendientes.clear(); s.confirmada = false; pintar(); },
      pintar,
    };
  }

  return { crear };
})();
