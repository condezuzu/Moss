// La escena del cielo: estado de mentira, animaciones, toques y el día completo.
// Cada cuadro arma listas de sprites y líneas y se las pasa al motor. Nada de esto toca el
// navegador más allá del contenedor que recibe: es la misma lógica que va a correr en Skia.

const Escena = (() => {
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
  const suave = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const salida = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const mezclar = (a, b, t) => a + (b - a) * t;

  const HORIZONTE = -0.36;
  const ZONA_UNIVERSO = 1.3;
  const PARALAJE = { cielo: 1.0, aurora: 1.12, lomas: [1.16, 1.3, 1.48] };

  const ORO = [1.0, 0.8, 0.44];
  const ORO_CLARO = [1.0, 0.93, 0.74];
  const PERGAMINO = [0.94, 0.9, 0.81];
  const MUSGO_LUZ = [0.74, 0.93, 0.45];
  const BLANCO_CALIDO = [1.0, 0.96, 0.86];

  const CALIDADES = {
    alta: { dpr: 2, octavas: 6, capas: 3, aurora: 0.5, cortinas: 3, estrellas: 520, particulas: 1, cadaCuantos: 1 },
    media: { dpr: 1.5, octavas: 5, capas: 3, aurora: 0.34, cortinas: 2, estrellas: 320, particulas: 0.6, cadaCuantos: 1 },
    baja: { dpr: 1, octavas: 4, capas: 2, aurora: 0.25, cortinas: 2, estrellas: 160, particulas: 0.3, cadaCuantos: 2 },
  };

  function azar(semilla) {
    let s = semilla >>> 0;
    return () => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function ruido1(x, semilla) {
    const i = Math.floor(x);
    const f = x - i;
    const h = (n) => { const s = Math.sin((n + semilla * 57.31) * 127.1) * 43758.5453; return s - Math.floor(s); };
    const u = f * f * (3 - 2 * f);
    return h(i) * (1 - u) + h(i + 1) * u;
  }

  function fbm1(x, semilla, octavas) {
    let s = 0, a = 0.5, t = 0;
    for (let k = 0; k < octavas; k++) { s += a * ruido1(x, semilla + k * 13.7); t += a; x *= 2.07; a *= 0.5; }
    return s / t;
  }

  function temperatura(t) {
    if (t < 0.5) { const k = t / 0.5; return [1, mezclar(0.74, 0.96, k), mezclar(0.5, 0.9, k)]; }
    const k = (t - 0.5) / 0.5;
    return [mezclar(1, 0.72, k), mezclar(0.96, 0.82, k), mezclar(0.9, 1, k)];
  }

  // Proyección gnomónica centrada en la constelación, con el norte arriba y el este a la
  // izquierda: así se ve mirando el cielo, y así la dibujan los atlas.
  function proyectar(estrellas) {
    const rad = Math.PI / 180;
    const vs = estrellas.map((e) => {
      const ra = e.ra * rad, dec = e.dec * rad;
      return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
    });
    const c = [0, 0, 0];
    vs.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
    const lc = Math.hypot(c[0], c[1], c[2]);
    c[0] /= lc; c[1] /= lc; c[2] /= lc;
    let este = [-c[1], c[0], 0];
    const le = Math.hypot(este[0], este[1]);
    este = le < 1e-6 ? [1, 0, 0] : [este[0] / le, este[1] / le, 0];
    const norte = [c[1] * este[2] - c[2] * este[1], c[2] * este[0] - c[0] * este[2], c[0] * este[1] - c[1] * este[0]];
    return vs.map((v) => {
      const k = v[0] * c[0] + v[1] * c[1] + v[2] * c[2];
      return [-(v[0] * este[0] + v[1] * este[1] + v[2] * este[2]) / k, (v[0] * norte[0] + v[1] * norte[1] + v[2] * norte[2]) / k];
    });
  }

  function encajar(plano, centro, maxAncho, maxAlto) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const ancho = Math.max(x1 - x0, 1e-6), alto = Math.max(y1 - y0, 1e-6);
    const escala = plano.length < 2 ? 1 : Math.min(maxAncho / ancho, maxAlto / alto);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return plano.map(([x, y]) => [centro[0] + (x - cx) * escala, centro[1] + (y - cy) * escala]);
  }

  // Orden en que se encienden las líneas: desde la estrella más brillante hacia afuera.
  function profundidades(n, lineas) {
    const prof = new Array(n).fill(Infinity);
    if (n === 0) return prof;
    prof[0] = 0;
    const cola = [0];
    while (cola.length) {
      const a = cola.shift();
      lineas.forEach(([p, q]) => {
        const b = p === a ? q : q === a ? p : -1;
        if (b >= 0 && prof[b] === Infinity) { prof[b] = prof[a] + 1; cola.push(b); }
      });
    }
    return prof.map((p) => (p === Infinity ? 0 : p));
  }

  // ------------------------------------------------------------------ figura de la Lira
  // La lira se dibuja en un sistema propio (puente en y=12, yugo en y=84) y se lleva a las
  // estrellas con un ajuste afín: así el yugo, el puente y las cuerdas de los bordes caen justo
  // sobre las líneas de la constelación, y el cuerno derecho termina en Vega.

  function ajusteAfin(pares) {
    const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const bx = [0, 0, 0], by = [0, 0, 0];
    pares.forEach(([[x, y], [X, Y]]) => {
      const f = [x, y, 1];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) m[i][j] += f[i] * f[j];
        bx[i] += f[i] * X;
        by[i] += f[i] * Y;
      }
    });
    const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
    const d = det(m);
    const resolver = (b) => [0, 1, 2].map((k) => det(m.map((fila, i) => fila.map((v, j) => (j === k ? b[i] : v)))) / d);
    const [a, b, c] = resolver(bx);
    const [e, f, g] = resolver(by);
    return { a, b, c, e, f, g };
  }

  const aplicarAfin = (M, [x, y]) => [M.a * x + M.b * y + M.c, M.e * x + M.f * y + M.g];
  function invertirAfin(M, [X, Y]) {
    const d = M.a * M.f - M.b * M.e;
    const x = X - M.c, y = Y - M.g;
    return [(M.f * x - M.b * y) / d, (-M.e * x + M.a * y) / d];
  }

  function cubica(p0, p1, p2, p3, n) {
    const pts = [];
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([
        u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
        u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
      ]);
    }
    return pts;
  }

  // Un trazo es una lista de comandos ['M',x,y] ['L',x,y] ['C',x1,y1,x2,y2,x,y].
  function aPuntos(comandos) {
    let pts = [];
    let actual = null;
    comandos.forEach((c) => {
      if (c[0] === 'M') { actual = [c[1], c[2]]; pts.push(actual); }
      else if (c[0] === 'L') { actual = [c[1], c[2]]; pts.push(actual); }
      else if (c[0] === 'C') {
        const fin = [c[5], c[6]];
        pts = pts.concat(cubica(actual, [c[1], c[2]], [c[3], c[4]], fin, 14));
        actual = fin;
      }
    });
    return pts;
  }

  function circulo(cx, cy, r, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = (i / n) * TAU; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }

  function figuraLira(pos) {
    const M = ajusteAfin([
      [[-14, 12], pos.gamma],
      [[14, 12], pos.beta],
      [[-14, 84], pos.delta],
      [[14, 84], pos.zeta],
    ]);
    const [vx, vy] = invertirAfin(M, pos.vega);
    const [ex, ey] = invertirAfin(M, pos.epsilon);
    // Brazos angostos hasta el yugo; arriba se abren en cuernos de carnero: el derecho sale hasta
    // Vega y se enrosca hacia adentro hasta ε. El izquierdo es su espejo.
    const subida = [[16, 9], [23, 26], [24, 54], [20, 76]];
    const brazo = (s) => aPuntos([
      ['M', s * subida[0][0], subida[0][1]],
      ['C', s * subida[1][0], subida[1][1], s * subida[2][0], subida[2][1], s * subida[3][0], subida[3][1]],
      ['C', s * 18.5, 84, s * (vx - 12), vy - 6, s * vx, vy],
      ['C', s * (vx + 6), vy + 6, s * (ex + 16), ey + 6, s * ex, ey],
      ['C', s * (ex - 5), ey - 1, s * (ex - 4.5), ey - 6.5, s * (ex - 0.5), ey - 6],
    ]);
    // El yugo va de brazo a brazo a la altura de δ y ζ.
    const enYugo = cubica([20, 76], [18.5, 84], [vx - 12, vy - 6], [vx, vy], 80).reduce((m, p) => (Math.abs(p[1] - 84) < Math.abs(m[1] - 84) ? p : m));
    const xYugo = enYugo[0];
    const trazos = [];
    const agregar = (pts, t0, t1, ancho, brillo, cuerda) => trazos.push({ pts: pts.map((p) => aplicarAfin(M, p)), t0, t1, ancho, brillo, cuerda: cuerda == null ? -1 : cuerda });
    agregar(brazo(1), 0.0, 0.45, 1.6, 0.85);
    agregar(brazo(-1), 0.0, 0.45, 1.6, 0.85);
    agregar(aPuntos([['M', -17, 9], ['C', -22, -1, -15, -12, 0, -13], ['C', 15, -12, 22, -1, 17, 9]]), 0.12, 0.5, 1.5, 0.85);
    agregar(aPuntos([['M', -17, 9], ['C', -8, 12.5, 8, 12.5, 17, 9]]), 0.3, 0.5, 1.1, 0.6);
    agregar(aPuntos([['M', -xYugo, 84], ['L', xYugo, 84]]), 0.34, 0.52, 1.6, 0.9);
    agregar(circulo(-xYugo, 84, 1.8, 12), 0.45, 0.55, 1.1, 0.8);
    agregar(circulo(xYugo, 84, 1.8, 12), 0.45, 0.55, 1.1, 0.8);
    agregar(aPuntos([['M', -15.5, 12], ['L', 15.5, 12]]), 0.4, 0.54, 1.4, 0.85);
    for (let i = 0; i < 7; i++) {
      const x = -14 + (28 * i) / 6;
      agregar([[x, 12], [x, 84]], 0.5 + i * 0.045, 0.62 + i * 0.045, 0.85, 0.62, i);
      agregar([[x, 12], [x * 0.3, -7]], 0.56 + i * 0.03, 0.72 + i * 0.03, 0.6, 0.32);
    }
    agregar(aPuntos([['M', -5, -7], ['L', 5, -7]]), 0.62, 0.74, 1.1, 0.6);
    agregar(aPuntos([['M', -14, 0], ['C', -6, -3, 6, -3, 14, 0]]), 0.66, 0.9, 0.7, 0.4);
    agregar(aPuntos([['M', -9, -8], ['C', -3, -10, 3, -10, 9, -8]]), 0.7, 0.94, 0.7, 0.4);
    agregar(aPuntos([['M', -8, 9], ['C', -9, 1, -8, -6, -5, -11]]), 0.72, 0.96, 0.7, 0.35);
    agregar(aPuntos([['M', 8, 9], ['C', 9, 1, 8, -6, 5, -11]]), 0.72, 0.96, 0.7, 0.35);
    return trazos.map((tr) => {
      let largo = 0;
      const tramos = [];
      for (let i = 1; i < tr.pts.length; i++) {
        const l = Math.hypot(tr.pts[i][0] - tr.pts[i - 1][0], tr.pts[i][1] - tr.pts[i - 1][1]);
        tramos.push({ a: tr.pts[i - 1], b: tr.pts[i], desde: largo, largo: l });
        largo += l;
      }
      return Object.assign(tr, { tramos, largo });
    });
  }

  function letraBayer(e) {
    const m = /^([α-ω])/.exec(e.bayer || '');
    return m ? m[1] : '';
  }

  // ------------------------------------------------------------------ escena

  function crear(contenedor, fuentes, opciones) {
    const lienzo = contenedor.querySelector('canvas');
    const ui = contenedor.querySelector('.ui');
    let motor = Motor.crear(lienzo, fuentes);
    const sp = { datos: new Float32Array(6000 * 12), n: 0, cap: 6000 };
    const spFrente = { datos: new Float32Array(1500 * 12), n: 0, cap: 1500 };
    const ln = { datos: new Float32Array(1200 * 12), n: 0, cap: 1200 };
    const lnFrente = { datos: new Float32Array(400 * 12), n: 0, cap: 400 };
    const lnUniverso = { datos: new Float32Array(400 * 12), n: 0, cap: 400 };

    const e = {
      t: 0,
      calidad: opciones.calidad || 'alta',
      idioma: opciones.idioma || 'es',
      textos: opciones.textos,
      cssAncho: 1, cssAlto: 1, aspecto: 0.46, escala: 1, escalaCss: 1,
      cam: { y: 0, v: 0, objetivo: 0, arrastre: null },
      aparicion: 0,
      fondoListo: false,
      constelacion: null,
      habitos: [],
      completo: false, tCompleto: -1, rafagaHecha: false,
      aurora: { tiempo: 40, intensidad: 1, oleada: 0 },
      efectos: [], particulas: [], esporasSalud: [],
      musgo: { crecimiento: opciones.musgo == null ? 0.6 : opciones.musgo, lomas: [], capsulas: [], alturas: [] },
      brillantes: [],
      universo: null,
      ultimoToque: null,
      fps: { cuadros: 0, desde: 0, valor: 0 },
      cuadro: 0,
      pausado: false,
      perdido: false,
      fugaz: null, proximaFugaz: 7,
      alCambiar: opciones.alCambiar || (() => {}),
      haptico: opciones.haptico || (() => {}),
    };

    // ---------------------------------------------------------------- textos
    function tx(clave, vars) {
      let s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), e.textos[e.idioma]);
      if (typeof s !== 'string') return clave;
      if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return s;
    }
    const nombreDe = (v) => (v && typeof v === 'object' ? v[e.idioma] || v.es : v);
    const numero = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, e.idioma === 'es' ? '.' : ',');
    // Primer hábito 3 puntos, cada extra 1: lo que dice la especificación, mecánica 5.
    const luzDelDia = (hechos) => (hechos > 0 ? hechos + 2 : 0);

    // ---------------------------------------------------------------- interfaz HTML
    ui.innerHTML = `
      <header class="cab">
        <div class="cab-dia"></div>
        <div class="cab-fila">
          <div class="cab-nombre"><span class="cab-es"></span> <span class="cab-griego"></span></div>
          <div class="cab-luz"><b></b><span></span></div>
        </div>
        <div class="cab-cuenta"></div>
      </header>
      <div class="etiquetas"></div>
      <div class="universo-titulo"></div>
      <div class="universo-etiquetas"></div>
      <section class="tarjeta" aria-live="polite">
        <div class="tj-dia"></div>
        <h3 class="tj-nombre"></h3>
        <div class="tj-griego"></div>
        <p class="tj-mito"></p>
        <div class="tj-chips"></div>
      </section>
      <div class="aviso" role="status"><span class="aviso-txt"></span><button type="button" class="aviso-btn"></button></div>
      <footer class="frase"><q></q><cite></cite></footer>
      <div class="fps" hidden></div>`;
    const $ = (s) => ui.querySelector(s);
    const dom = {
      dia: $('.cab-dia'), es: $('.cab-es'), griego: $('.cab-griego'), luz: $('.cab-luz b'), luzTxt: $('.cab-luz span'),
      cuenta: $('.cab-cuenta'), etiquetas: $('.etiquetas'), tarjeta: $('.tarjeta'), tjDia: $('.tj-dia'), tjNombre: $('.tj-nombre'),
      tjGriego: $('.tj-griego'), tjMito: $('.tj-mito'), tjChips: $('.tj-chips'), aviso: $('.aviso'), avisoTxt: $('.aviso-txt'),
      avisoBtn: $('.aviso-btn'), frase: $('.frase q'), cita: $('.frase cite'), fps: $('.fps'), cab: $('.cab'),
      uTitulo: $('.universo-titulo'), uEtiquetas: $('.universo-etiquetas'),
    };
    let etiquetas = [];
    let etiquetasUniverso = [];
    let temporizadorAviso = 0;

    function avisar(texto, conDeshacer) {
      dom.avisoTxt.textContent = texto;
      dom.avisoBtn.hidden = !conDeshacer;
      dom.avisoBtn.textContent = tx('comun.deshacer');
      dom.aviso.classList.add('visible');
      clearTimeout(temporizadorAviso);
      temporizadorAviso = setTimeout(() => dom.aviso.classList.remove('visible'), conDeshacer ? 4200 : 2600);
    }

    dom.avisoBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const u = e.ultimoToque;
      if (!u) return;
      e.ultimoToque = null;
      cambiarHabito(u.indice, u.antes, { conAviso: false });
      dom.aviso.classList.remove('visible');
    });

    function textoAuto(h) {
      if (h.auto === 'pasos') return numero(h.valor) + ' / ' + numero(h.meta);
      if (h.auto === 'sueno') { const hs = Math.floor(h.valor / 60), m = h.valor % 60; return tx('cielo.horasMinutos', { h: hs, m }); }
      return '';
    }

    function armarEtiquetas() {
      dom.etiquetas.innerHTML = '';
      etiquetas = e.habitos.map((h) => {
        const el = document.createElement('div');
        el.className = 'etq';
        el.innerHTML = `<span class="etq-nombre">${opciones.icono(h.icono)}<span></span></span><span class="etq-auto"></span>`;
        dom.etiquetas.appendChild(el);
        return el;
      });
      refrescarEtiquetas();
    }

    function refrescarEtiquetas() {
      e.habitos.forEach((h, i) => {
        const el = etiquetas[i];
        if (!el) return;
        el.querySelector('.etq-nombre span').textContent = nombreDe(h.nombre);
        const auto = el.querySelector('.etq-auto');
        auto.textContent = h.auto ? textoAuto(h) : '';
        auto.hidden = !h.auto;
        el.classList.toggle('encendida', h.encendido);
        el.classList.toggle('es-auto', !!h.auto);
        el._ancho = 0;
      });
    }

    function refrescarCabecera() {
      const c = e.constelacion;
      if (!c) return;
      const hechos = e.habitos.filter((h) => h.encendido).length;
      dom.dia.textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + opciones.diaSemana), num: opciones.diaMes, mes: tx('fecha.mesesCortos.' + opciones.mes) });
      dom.es.textContent = nombreDe(c.datos.nombres);
      dom.griego.textContent = c.datos.nombres.grc || '';
      dom.luz.textContent = luzDelDia(hechos);
      dom.luzTxt.textContent = tx('cielo.luzDeHoy');
      dom.cuenta.textContent = e.completo ? tx('cielo.completa') : tx('cielo.encendidas', { n: hechos, total: e.habitos.length });
      dom.cab.classList.toggle('completa', e.completo);
      const f = opciones.frase;
      dom.frase.textContent = nombreDe(f.texto);
      dom.cita.textContent = nombreDe(f.autor);
      refrescarTarjeta();
    }

    function refrescarTarjeta() {
      const c = e.constelacion;
      if (!c) return;
      const m = c.datos.mito || {};
      dom.tjDia.textContent = tx('cielo.diaCompleto');
      dom.tjNombre.textContent = nombreDe(c.datos.nombres);
      dom.tjGriego.textContent = c.datos.nombres.grc || '';
      // En la tarjeta entra una sola oración del resumen; el mito completo va en su zona del cielo.
      const resumen = nombreDe(m.resumen) || '';
      const primera = /^(.+?[.;])(\s|$)/.exec(resumen);
      dom.tjMito.textContent = nombreDe(c.datos.frase) || (primera ? primera[1].replace(/;$/, '.') : resumen);
      const cap = c.capitulo || { n: 1, total: 6 };
      dom.tjChips.innerHTML = '';
      [tx('cielo.masLuz', { n: luzDelDia(e.habitos.length) }), tx('cielo.capitulo', { n: cap.n, total: cap.total }) + (cap.titulo ? ' · ' + nombreDe(cap.titulo) : '')]
        .forEach((t) => { const s = document.createElement('span'); s.textContent = t; dom.tjChips.appendChild(s); });
    }

    // ---------------------------------------------------------------- tamaño y mundo
    function redimensionar() {
      const r = contenedor.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const cfg = CALIDADES[e.calidad];
      const dpr = Math.min(window.devicePixelRatio || 1, cfg.dpr);
      e.cssAncho = r.width;
      e.cssAlto = r.height;
      e.aspecto = r.width / r.height;
      motor.redimensionar(r.width * dpr, r.height * dpr, dpr);
      e.escala = motor.estado.alto;
      e.escalaCss = r.height;
      const margenX = 0.08;
      motor.prepararFondo({
        mundoMin: [-e.aspecto / 2 - margenX, -0.5 - 0.12],
        mundoTam: [e.aspecto + 2 * margenX, 1.0 + 0.24 + ZONA_UNIVERSO],
        escala: e.escala,
        horizonte: HORIZONTE,
        octavas: cfg.octavas,
        capas: cfg.capas,
        semilla: 7,
      });
      e.fondoListo = false;
      armarBrillantes();
      armarMusgo();
      if (e.constelacion) ubicarConstelacion();
      armarUniverso();
    }

    function armarBrillantes() {
      const cfg = CALIDADES[e.calidad];
      const r = azar(1234);
      e.brillantes = [];
      for (let i = 0; i < cfg.estrellas; i++) {
        const x = (r() - 0.5) * (e.aspecto + 0.16);
        const y = HORIZONTE + 0.02 + r() * (0.5 + ZONA_UNIVERSO + 0.08 - HORIZONTE);
        const m = Math.pow(r(), 2.6);
        e.brillantes.push({ x, y, tam: 3 + 9 * m, brillo: 0.18 + 0.75 * m, color: temperatura(r()), fase: r() * TAU, vel: 0.7 + r() * 2.4, brazos: m > 0.75 ? 0.35 : 0 });
      }
    }

    // ---------------------------------------------------------------- musgo
    function alturaLoma(capa, x) {
      let h = capa.base + capa.amp * (fbm1(x * capa.frec + 3.1, capa.semilla, 4) - 0.5) * 2;
      h += 0.0028 * (fbm1(x * 95, capa.semilla + 5, 2) - 0.5);
      // Pelusa del borde: de cerca, el musgo son miles de tallitos, no una línea lisa.
      h += capa.pelusa * (ruido1(x * 260, capa.semilla + 9) - 0.5);
      capa.cojines.forEach((c) => {
        const u = (x - c.x) / c.r;
        if (u > -1 && u < 1) h += c.h * Math.sqrt(1 - u * u);
      });
      return h;
    }

    function armarMusgo() {
      e.musgo.lomas.forEach((l) => motor.borrarLoma(l.malla));
      const g = e.musgo.crecimiento;
      const r = azar(99);
      const ancho = e.aspecto / 2 + 0.25;
      // De atrás hacia adelante: la de atrás más azulada y clara (aire de por medio), la de
      // adelante casi negra con el borde encendido por la aurora.
      const defs = [
        { base: HORIZONTE + 0.03, amp: 0.024, frec: 3.0, semilla: 3, cojines: 8, pelusa: 0.0008, cuerpo: [0.032, 0.052, 0.078], borde: [0.24, 0.4, 0.42], luz: 0.22 },
        { base: HORIZONTE + 0.008, amp: 0.026, frec: 4.2, semilla: 7, cojines: 14, pelusa: 0.0012, cuerpo: [0.016, 0.03, 0.03], borde: [0.32, 0.55, 0.36], luz: 0.32 },
        { base: HORIZONTE - 0.036, amp: 0.018, frec: 5.4, semilla: 11, cojines: 24, pelusa: 0.0018, cuerpo: [0.007, 0.014, 0.012], borde: [0.46, 0.68, 0.32], luz: 0.46 },
      ];
      const franja = 1.6 / e.escalaCss;
      e.musgo.lomas = defs.map((d, k) => {
        const capa = Object.assign({}, d, { cojines: [] });
        // Cojines bajos y anchos: el musgo crece en almohadones, no en copas como un árbol.
        const n = Math.round(d.cojines * (0.45 + 0.9 * g));
        for (let i = 0; i < n; i++) {
          const radio = 0.014 + r() * 0.032;
          capa.cojines.push({ x: (r() * 2 - 1) * ancho, r: radio, h: radio * (0.18 + 0.2 * r()) * (0.6 + 0.7 * g) });
        }
        const paso = 1.5 / e.escalaCss;
        const fondo = -0.85;
        const v = [];
        let x0 = -ancho, h0 = alturaLoma(capa, x0);
        for (let x1 = x0 + paso; x1 <= ancho + paso; x1 += paso) {
          const h1 = alturaLoma(capa, x1);
          v.push(x0, h0 + franja, -franja, x1, h1 + franja, -franja, x0, h0, 0);
          v.push(x1, h1 + franja, -franja, x1, h1, 0, x0, h0, 0);
          v.push(x0, h0, 0, x1, h1, 0, x0, fondo, h0 - fondo);
          v.push(x1, h1, 0, x1, fondo, h1 - fondo, x0, fondo, h0 - fondo);
          x0 = x1; h0 = h1;
        }
        return { capa, malla: motor.crearLoma(new Float32Array(v)), par: PARALAJE.lomas[k], franja };
      });
      // Cápsulas que brillan sobre la loma de adelante (el musgo luminoso de verdad, Schistostega,
      // refleja la poca luz que hay y reluce dorado verdoso).
      const frente = e.musgo.lomas[2].capa;
      const nCap = Math.round(10 + 46 * g);
      e.musgo.capsulas = [];
      for (let i = 0; i < nCap; i++) {
        const x = (r() * 2 - 1) * (e.aspecto / 2 + 0.03);
        const y = alturaLoma(frente, x) - 0.002;
        e.musgo.capsulas.push({ x, y, largo: 0.006 + r() * 0.016, inclina: (r() - 0.5) * 0.008, fase: r() * TAU, brillo: 0.45 + r() * 0.55 });
      }
    }

    // ---------------------------------------------------------------- constelación de hoy
    function ponerConstelacion(datos, habitos, extra) {
      e.constelacion = { datos, capitulo: extra && extra.capitulo };
      e.habitos = habitos.map((h) => Object.assign({ valor: 0, meta: 0 }, h, { luz: h.encendido ? 1 : 0, pop: 0 }));
      e.completo = e.habitos.length > 0 && e.habitos.every((h) => h.encendido);
      e.tCompleto = e.completo ? e.t - 30 : -1;
      e.rafagaHecha = e.completo;
      e.efectos = [];
      e.esporasSalud = [];
      e.ultimoToque = null;
      ubicarConstelacion();
      armarEtiquetas();
      refrescarCabecera();
      dom.tarjeta.classList.remove('visible');
      e.alCambiar();
    }

    function ubicarConstelacion() {
      const c = e.constelacion;
      const plano = proyectar(c.datos.estrellas);
      // Abajo queda lugar para la tarjeta del día completo, que aparece sobre el musgo.
      c.pos = encajar(plano, [0, 0.075], e.aspecto * 0.68, 0.4);
      c.lineas = c.datos.lineas.map(([a, b]) => [a, b]);
      c.prof = profundidades(c.pos.length, c.lineas);
      c.lineas = c.lineas.map(([a, b]) => (c.prof[a] <= c.prof[b] ? [a, b] : [b, a]));
      c.avance = c.lineas.map(() => (e.completo ? 1 : 0));
      c.centro = c.pos.reduce((s, p) => [s[0] + p[0] / c.pos.length, s[1] + p[1] / c.pos.length], [0, 0]);
      c.figura = null;
      c.figuraAvance = e.completo ? 1 : 0;
      if (c.datos.id === 'lyra') {
        const p = {};
        const letras = { 'α': 'vega', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ζ': 'zeta', 'ε': 'epsilon' };
        c.datos.estrellas.forEach((s, i) => { if (letras[letraBayer(s)]) p[letras[letraBayer(s)]] = c.pos[i]; });
        if (Object.keys(p).length === 6) c.figura = figuraLira(p);
      }
      // Cada etiqueta va del lado de afuera de la figura, para no taparle las líneas. Nunca arriba:
      // la estrella más alta quedaría pegada a la cabecera.
      let x0 = Infinity, x1 = -Infinity;
      c.pos.forEach(([x]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); });
      const ancho = Math.max(x1 - x0, 1e-6);
      c.lado = c.pos.map((p) => {
        const dx = (p[0] - c.centro[0]) / ancho;
        if (c.pos.length < 2 || Math.abs(dx) < 0.22) return 'abajo';
        return dx > 0 ? 'der' : 'izq';
      });
    }

    // ---------------------------------------------------------------- universo (la semana)
    function armarUniverso() {
      dom.uEtiquetas.innerHTML = '';
      etiquetasUniverso = [];
      e.universo = null;
      const sem = opciones.semana;
      if (!sem || !sem.length) return;
      const huecos = [[-0.55, 0.3], [0.5, 0.24], [-0.06, 0.07], [-0.58, -0.12], [0.52, -0.1], [-0.24, -0.32], [0.42, -0.36]];
      const A = e.aspecto / 2;
      e.universo = sem.map((d, k) => {
        const plano = proyectar(d.datos.estrellas);
        const centro = [huecos[k][0] * A * 0.92, ZONA_UNIVERSO + huecos[k][1]];
        const pos = encajar(plano, centro, A * 0.62, 0.15);
        const el = document.createElement('div');
        el.className = 'uetq' + (d.hoy ? ' hoy' : '');
        el.innerHTML = '<b></b><span></span>';
        dom.uEtiquetas.appendChild(el);
        etiquetasUniverso.push(el);
        const bajo = pos.reduce((m, p) => Math.min(m, p[1]), Infinity);
        return Object.assign({}, d, { pos, centro, bajo });
      });
      refrescarUniverso();
    }

    function refrescarUniverso() {
      if (!e.universo) return;
      dom.uTitulo.textContent = tx('cielo.tuUniverso');
      e.universo.forEach((d, k) => {
        const el = etiquetasUniverso[k];
        el.querySelector('b').textContent = tx('fecha.diasCortos.' + d.dia);
        el.querySelector('span').textContent = nombreDe(d.datos.nombres);
      });
    }

    // ---------------------------------------------------------------- toques
    function posPantalla(x, y, par) {
      return [e.cssAncho / 2 + x * e.escalaCss, e.cssAlto / 2 - (y - e.cam.y * par) * e.escalaCss];
    }

    function cambiarHabito(i, encender, { conAviso = true, desdeSalud = false } = {}) {
      const h = e.habitos[i];
      if (!h || h.encendido === encender) return;
      h.encendido = encender;
      const [x, y] = e.constelacion.pos[i];
      if (encender) {
        h.pop = 1;
        e.efectos.push({ tipo: 'destello', x, y, t0: e.t, dur: 0.42 });
        e.efectos.push({ tipo: 'onda', x, y, t0: e.t, dur: 0.75 });
        const r = azar(Math.floor(e.t * 1000) + i);
        const n = Math.round(14 * CALIDADES[e.calidad].particulas) + 4;
        for (let k = 0; k < n; k++) {
          const a = r() * TAU, v = (0.05 + r() * 0.12);
          e.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: 0.45 + r() * 0.5, tam: 2 + r() * 3, color: r() < 0.5 ? ORO_CLARO : ORO, brillo: 0.9, frena: 3.2, sube: 0, par: 1 });
        }
        if (!desdeSalud) e.haptico('toque');
      } else {
        e.efectos.push({ tipo: 'apagar', x, y, t0: e.t, dur: 0.5 });
        e.haptico('suave');
      }
      if (conAviso) {
        e.ultimoToque = { indice: i, antes: !encender };
        avisar(tx(encender ? 'cielo.encendida' : 'cielo.apagada', { habito: nombreDe(h.nombre) }), true);
      }
      if (desdeSalud) avisar(tx('cielo.desdeSalud', { habito: nombreDe(h.nombre) }), false);
      revisarCompleto();
      refrescarEtiquetas();
      refrescarCabecera();
      e.alCambiar();
    }

    function revisarCompleto() {
      const todos = e.habitos.every((h) => h.encendido);
      if (todos && !e.completo) {
        e.completo = true;
        e.tCompleto = e.t;
        e.rafagaHecha = false;
        e.haptico('completo');
      } else if (!todos && e.completo) {
        e.completo = false;
        dom.tarjeta.classList.remove('visible');
      }
    }

    function tocar(px, py) {
      const c = e.constelacion;
      if (!c) return;
      let mejor = -1, dist = 34;
      c.pos.forEach(([x, y], i) => {
        const [sx, sy] = posPantalla(x, y, PARALAJE.cielo);
        const d = Math.hypot(sx - px, sy - py);
        if (d < dist) { dist = d; mejor = i; }
      });
      if (mejor < 0) return;
      const h = e.habitos[mejor];
      if (h.auto) {
        avisar(tx('cielo.seEnciendeSola') + ' · ' + textoAuto(h), false);
        e.haptico('suave');
        e.efectos.push({ tipo: 'apagar', x: c.pos[mejor][0], y: c.pos[mejor][1], t0: e.t, dur: 0.4 });
        return;
      }
      cambiarHabito(mejor, !h.encendido);
    }

    // Arrastrar mueve la cámara; un toque sin arrastre enciende o apaga.
    let puntero = null;
    contenedor.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('button')) return;
      const r = contenedor.getBoundingClientRect();
      puntero = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, cam0: e.cam.y, ultimoY: ev.clientY, ultimoT: performance.now(), v: 0, movio: false, rx: r.left, ry: r.top };
    });
    contenedor.addEventListener('pointermove', (ev) => {
      if (!puntero || ev.pointerId !== puntero.id) return;
      const dy = ev.clientY - puntero.y0;
      if (!puntero.movio && Math.abs(dy) > 8 && opciones.permitirArrastre()) {
        puntero.movio = true;
        try { contenedor.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
      }
      if (!puntero.movio) return;
      const ahora = performance.now();
      const dt = Math.max(1, ahora - puntero.ultimoT) / 1000;
      puntero.v = mezclar(puntero.v, ((ev.clientY - puntero.ultimoY) / e.escalaCss) / dt, 0.35);
      puntero.ultimoY = ev.clientY;
      puntero.ultimoT = ahora;
      let y = puntero.cam0 + dy / e.escalaCss;
      if (y < 0) y *= 0.35;
      if (y > ZONA_UNIVERSO) y = ZONA_UNIVERSO + (y - ZONA_UNIVERSO) * 0.35;
      e.cam.y = y;
      e.cam.v = 0;
      e.cam.arrastre = true;
    });
    const soltar = (ev) => {
      if (!puntero || ev.pointerId !== puntero.id) return;
      if (!puntero.movio && ev.type === 'pointerup') tocar(ev.clientX - puntero.rx, ev.clientY - puntero.ry);
      if (puntero.movio) {
        const proyectada = e.cam.y + puntero.v * 0.28;
        e.cam.objetivo = proyectada > ZONA_UNIVERSO / 2 ? ZONA_UNIVERSO : 0;
        e.cam.v = puntero.v;
        e.alCambiar();
      }
      e.cam.arrastre = null;
      puntero = null;
    };
    contenedor.addEventListener('pointerup', soltar);
    contenedor.addEventListener('pointercancel', soltar);

    // ---------------------------------------------------------------- actualizar
    function actualizar(dt) {
      e.t += dt;
      const c = e.constelacion;

      if (!e.cam.arrastre) {
        const k = 70, amort = 2 * Math.sqrt(k);
        const a = -k * (e.cam.y - e.cam.objetivo) - amort * e.cam.v;
        e.cam.v += a * dt;
        e.cam.y += e.cam.v * dt;
      }

      e.habitos.forEach((h) => {
        h.luz += ((h.encendido ? 1 : 0) - h.luz) * (1 - Math.exp(-dt * (h.encendido ? 16 : 7)));
        h.pop *= Math.exp(-dt * 6);
      });

      const dc = e.completo ? e.t - e.tCompleto : -1;
      let objI = 1, objO = 0;
      if (e.completo) {
        const sube = suave(0.8, 2.2, dc);
        const baja = suave(3.2, 9.0, dc);
        objI = 1 + sube * (1.2 - 0.7 * baja);
        objO = sube * (1 - 0.45 * baja);
      }
      const ritmo = 1 - Math.exp(-dt * (e.completo ? 5 : 1.1));
      e.aurora.intensidad += (objI - e.aurora.intensidad) * ritmo;
      e.aurora.oleada += (objO - e.aurora.oleada) * ritmo;
      e.aurora.tiempo += dt * (1 + 2.2 * e.aurora.oleada) * (opciones.movimientoReducido ? 0.4 : 1);

      if (c) {
        c.lineas.forEach((_, k) => {
          if (e.completo) c.avance[k] = salida((dc - 0.15 - c.prof[c.lineas[k][0]] * 0.3) / 0.4);
          else c.avance[k] = Math.max(0, c.avance[k] - dt * 2.6);
        });
        if (e.completo) c.figuraAvance = clamp((dc - 1.15) / 2.6, 0, 1);
        else c.figuraAvance = Math.max(0, c.figuraAvance - dt * 1.4);
        if (e.completo && !e.rafagaHecha && dc >= 1.0) {
          e.rafagaHecha = true;
          const r = azar(4242);
          const n = Math.round(26 * CALIDADES[e.calidad].particulas) + 6;
          c.pos.forEach(([x, y]) => {
            for (let k = 0; k < n; k++) {
              const a = r() * TAU, v = 0.03 + r() * 0.16;
              e.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v + 0.02, vida: 0, max: 0.9 + r() * 1.6, tam: 1.6 + r() * 3.4, color: r() < 0.6 ? ORO : ORO_CLARO, brillo: 0.85, frena: 1.6, sube: 0.012, par: 1 });
            }
          });
        }
        const debeVerse = e.completo && dc >= 1.8 && dc < 8.5;
        if (debeVerse !== dom.tarjeta.classList.contains('visible')) {
          dom.tarjeta.classList.toggle('visible', debeVerse);
          ui.classList.toggle('con-tarjeta', debeVerse);
        }
      }

      e.particulas = e.particulas.filter((p) => {
        p.vida += dt;
        const f = Math.exp(-dt * p.frena);
        p.vx *= f; p.vy = p.vy * f + p.sube * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        return p.vida < p.max;
      });
      e.efectos = e.efectos.filter((f) => e.t - f.t0 < f.dur);

      // Esporas: suben despacio desde las cápsulas y, si llegan alto, se vuelven estrellas.
      const tasa = (0.5 + 2.4 * e.musgo.crecimiento) * CALIDADES[e.calidad].particulas;
      if (Math.random() < tasa * dt && e.musgo.capsulas.length) {
        const cap = e.musgo.capsulas[Math.floor(Math.random() * e.musgo.capsulas.length)];
        e.particulas.push({ espora: true, x: cap.x + cap.inclina, y: cap.y + cap.largo, x0: cap.x, vx: 0, vy: 0.018 + Math.random() * 0.03, vida: 0, max: 5 + Math.random() * 5, tam: 1.8 + Math.random() * 1.6, color: MUSGO_LUZ, brillo: 0.7, frena: 0, sube: 0, fase: Math.random() * TAU, par: PARALAJE.lomas[2] });
      }
      e.particulas.forEach((p) => {
        if (!p.espora) return;
        p.x = p.x0 + 0.012 * Math.sin(e.t * 0.9 + p.fase) * suave(0, 1.5, p.vida);
        p.par = mezclar(PARALAJE.lomas[2], 1, suave(HORIZONTE - 0.02, HORIZONTE + 0.3, p.y));
      });

      // Una estrella fugaz cada tanto, solo en la zona de hoy.
      if (!e.fugaz && e.t > e.proximaFugaz && !opciones.movimientoReducido) {
        const r = Math.random;
        const izquierda = r() < 0.5;
        const a = [(r() - 0.5) * e.aspecto * 0.8, 0.12 + r() * 0.3];
        const ang = (izquierda ? Math.PI : 0) + (izquierda ? 1 : -1) * (0.35 + r() * 0.3);
        const largo = 0.18 + r() * 0.14;
        e.fugaz = { a, d: [Math.cos(ang), Math.sin(ang)], largo, t0: e.t, dur: 0.75 + r() * 0.45 };
        e.proximaFugaz = e.t + 18 + r() * 30;
      }
      if (e.fugaz && e.t - e.fugaz.t0 > e.fugaz.dur) e.fugaz = null;

      // La luz que sube desde el musgo hasta un hábito automático.
      e.esporasSalud = e.esporasSalud.filter((s) => {
        const u = (e.t - s.t0) / s.dur;
        if (u >= 1) { cambiarHabito(s.indice, true, { conAviso: false, desdeSalud: true }); return false; }
        if (Math.random() < 0.9) {
          const [x, y] = s.punto(u);
          e.particulas.push({ x, y, vx: (Math.random() - 0.5) * 0.02, vy: (Math.random() - 0.5) * 0.02, vida: 0, max: 0.5 + Math.random() * 0.4, tam: 1.5 + Math.random() * 2, color: MUSGO_LUZ, brillo: 0.8, frena: 2, sube: 0, par: 1 });
        }
        return true;
      });
    }

    // ---------------------------------------------------------------- dibujar
    function sprite(b, x, y, tam, par, col, int, tipo, p1, p2, rot) {
      if (b.n >= b.cap || int <= 0.001) return;
      const o = b.n * 12, d = b.datos;
      d[o] = x; d[o + 1] = y; d[o + 2] = tam; d[o + 3] = par;
      d[o + 4] = col[0]; d[o + 5] = col[1]; d[o + 6] = col[2]; d[o + 7] = int;
      d[o + 8] = tipo; d[o + 9] = p1 || 0; d[o + 10] = p2 || 0; d[o + 11] = rot || 0;
      b.n++;
    }

    function linea(b, a, c, col, int, ancho, avance, punteado, chispa) {
      if (b.n >= b.cap || int <= 0.001 || avance <= 0) return;
      const o = b.n * 12, d = b.datos;
      d[o] = a[0]; d[o + 1] = a[1]; d[o + 2] = c[0]; d[o + 3] = c[1];
      d[o + 4] = col[0]; d[o + 5] = col[1]; d[o + 6] = col[2]; d[o + 7] = int;
      d[o + 8] = ancho; d[o + 9] = avance; d[o + 10] = punteado || 0; d[o + 11] = chispa || 0;
      b.n++;
    }

    function dibujarConstelacion() {
      const c = e.constelacion;
      if (!c) return;
      const dc = e.completo ? e.t - e.tCompleto : -1;
      const pulso = e.completo ? 1 + 0.55 * Math.exp(-Math.pow((dc - 1.05) / 0.13, 2)) : 1;

      c.lineas.forEach(([a, b], k) => {
        const fantasma = 1 - c.avance[k];
        linea(ln, c.pos[a], c.pos[b], PERGAMINO, 0.16 * fantasma, 0.8, 1, 7, 0);
        const av = c.avance[k];
        linea(ln, c.pos[a], c.pos[b], ORO, 0.95, 1.7, av, 0, av > 0 && av < 1 ? 1 : 0);
      });

      if (c.figura && c.figuraAvance > 0) {
        const P = c.figuraAvance;
        const alfa = e.completo ? 1 : P;
        const quieta = e.completo ? suave(3.6, 4.4, dc) : 0;
        c.figura.forEach((tr) => {
          const u = clamp((P - tr.t0) / (tr.t1 - tr.t0), 0, 1);
          if (u <= 0) return;
          const hasta = salida(u) * tr.largo;
          let brillo = tr.brillo * alfa;
          if (tr.cuerda >= 0) brillo *= 1 + quieta * 0.35 * Math.sin(e.t * 6.5 + tr.cuerda * 1.4);
          tr.tramos.forEach((s) => {
            if (s.desde >= hasta) return;
            const f = clamp((hasta - s.desde) / s.largo, 0, 1);
            const punta = f < 1 && u < 1 ? 0.8 : 0;
            linea(ln, s.a, s.b, ORO, brillo * 0.85, tr.ancho, f, 0, punta);
          });
        });
      }

      e.habitos.forEach((h, i) => {
        const [x, y] = c.pos[i];
        const luz = h.luz;
        const resp = 1 + 0.05 * Math.sin(e.t * 1.7 + i * 2.3);
        const tamH = (30 + 30 * luz) * (1 + 0.3 * h.pop) * pulso;
        sprite(sp, x, y, tamH, 1, ORO, (0.1 + 0.45 * luz) * resp, 0);
        const tamN = (13 + 10 * luz) * (1 + 0.6 * h.pop) * pulso;
        sprite(sp, x, y, tamN, 1, BLANCO_CALIDO, 0.32 + 0.95 * luz, 1, 0.12 + 0.55 * luz, 0, e.t * 0.05 + i);
        const apagada = 1 - luz;
        if (apagada > 0.01) {
          if (h.auto) {
            sprite(sp, x, y, 20, 1, PERGAMINO, 0.16 * apagada, 2, 0.86, 0.06);
            sprite(sp, x, y, 20, 1, MUSGO_LUZ, 0.95 * apagada, 3, 0.86, h.meta ? clamp(h.valor / h.meta, 0, 1) : 0);
          } else {
            const latido = 0.3 + 0.13 * Math.sin(e.t * 2.2 + i * 1.7);
            sprite(sp, x, y, 18, 1, PERGAMINO, latido * apagada, 2, 0.84, 0.075);
          }
        }
      });

      e.efectos.forEach((f) => {
        const u = (e.t - f.t0) / f.dur;
        if (f.tipo === 'destello') sprite(sp, f.x, f.y, mezclar(14, 70, salida(u)), 1, ORO_CLARO, 1.1 * (1 - u), 4);
        else if (f.tipo === 'onda') { const r = mezclar(14, 92, salida(u)); sprite(sp, f.x, f.y, r, 1, ORO, 0.75 * (1 - u), 2, 0.92, 2.2 / r); }
        else if (f.tipo === 'apagar') { const r = mezclar(42, 16, salida(u)); sprite(sp, f.x, f.y, r, 1, PERGAMINO, 0.4 * (1 - u), 2, 0.9, 1.6 / r); }
      });
    }

    function dibujarUniverso() {
      if (!e.universo) return;
      e.universo.forEach((d) => {
        const lineasVisibles = d.hoy ? e.completo : d.hechos >= d.datos.estrellas.length;
        d.datos.lineas.forEach(([a, b]) => {
          linea(lnUniverso, d.pos[a], d.pos[b], lineasVisibles ? ORO : PERGAMINO, lineasVisibles ? 0.7 : 0.15, lineasVisibles ? 1.1 : 0.7, 1, lineasVisibles ? 0 : 6, 0);
        });
        const hechos = d.hoy ? e.habitos.filter((h) => h.encendido).length : d.hechos;
        d.pos.forEach(([x, y], i) => {
          const on = i < hechos;
          sprite(sp, x, y, on ? 20 : 13, 1, on ? ORO : PERGAMINO, on ? 0.32 : 0.1, 0);
          sprite(sp, x, y, on ? 9 : 7, 1, BLANCO_CALIDO, on ? 0.9 : 0.5, 1, on ? 0.35 : 0.05, 0, 0.3);
          // Las de días que todavía no llegaron se ven como las apagadas de hoy: con su aro.
          if (!on) sprite(sp, x, y, 9, 1, PERGAMINO, 0.22, 2, 0.8, 0.1);
        });
      });
    }

    function dibujarCielo() {
      sp.n = 0; spFrente.n = 0; ln.n = 0; lnFrente.n = 0; lnUniverso.n = 0;
      const cielo = [0, e.cam.y * PARALAJE.cielo];

      const tw = e.t;
      e.brillantes.forEach((s) => {
        const tit = 0.72 + 0.28 * Math.sin(tw * s.vel + s.fase) * Math.sin(tw * s.vel * 0.37 + s.fase * 2.1);
        sprite(sp, s.x, s.y, s.tam * 2.4, 1, s.color, s.brillo * 0.16 * tit, 0);
        sprite(sp, s.x, s.y, s.tam, 1, s.color, s.brillo * tit, 1, s.brazos, 0, 0.2);
      });

      if (e.fugaz) {
        const f = e.fugaz;
        const u = (e.t - f.t0) / f.dur;
        const brillo = Math.sin(Math.PI * clamp(u, 0, 1));
        const cabeza = [f.a[0] + f.d[0] * f.largo * u, f.a[1] + f.d[1] * f.largo * u];
        // La estela se apaga hacia atrás: cuatro tramos de menos a más.
        for (let k = 0; k < 4; k++) {
          const d0 = 0.07 * (k + 1), d1 = 0.07 * k;
          const p0 = [cabeza[0] - f.d[0] * d0, cabeza[1] - f.d[1] * d0];
          const p1 = [cabeza[0] - f.d[0] * d1, cabeza[1] - f.d[1] * d1];
          linea(ln, p0, p1, BLANCO_CALIDO, brillo * (0.18 + 0.2 * (3 - k)), 0.9 + 0.3 * (3 - k), 1, 0, 0);
        }
        sprite(sp, cabeza[0], cabeza[1], 10, 1, BLANCO_CALIDO, brillo * 0.9, 0);
      }

      dibujarConstelacion();
      dibujarUniverso();

      e.particulas.forEach((p) => {
        if (p.espora) return;
        const u = p.vida / p.max;
        sprite(sp, p.x, p.y, p.tam * 2.2, p.par, p.color, p.brillo * (1 - u) * 0.5, 0);
      });
      e.esporasSalud.forEach((s) => {
        const u = (e.t - s.t0) / s.dur;
        const [x, y] = s.punto(u);
        sprite(sp, x, y, 26, 1, MUSGO_LUZ, 0.55, 0);
        sprite(sp, x, y, 9, 1, BLANCO_CALIDO, 1, 1, 0.4, 0, e.t * 2);
      });

      // Musgo: lomas de atrás hacia adelante, y lo que crece sobre la de adelante.
      const capsulaCol = [0.8, 0.92, 0.5];
      e.musgo.capsulas.forEach((k) => {
        const balanceo = 0.0016 * Math.sin(e.t * 0.8 + k.fase);
        const punta = [k.x + k.inclina + balanceo, k.y + k.largo];
        linea(lnFrente, [k.x, k.y], punta, [0.45, 0.62, 0.32], 0.32, 0.7, 1, 0, 0);
        const tit = 0.75 + 0.25 * Math.sin(e.t * 1.3 + k.fase * 3);
        const luzAurora = 0.75 + 0.25 * e.aurora.intensidad;
        sprite(spFrente, punta[0], punta[1], 7.5, PARALAJE.lomas[2], capsulaCol, 0.42 * k.brillo * tit * luzAurora, 0);
        sprite(spFrente, punta[0], punta[1], 2.6, PARALAJE.lomas[2], [1, 0.95, 0.7], 0.85 * k.brillo * tit, 4);
      });
      e.particulas.forEach((p) => {
        if (!p.espora) return;
        const u = p.vida / p.max;
        const alto = suave(HORIZONTE + 0.05, HORIZONTE + 0.4, p.y);
        const col = [mezclar(MUSGO_LUZ[0], 1, alto), mezclar(MUSGO_LUZ[1], 0.97, alto), mezclar(MUSGO_LUZ[2], 0.88, alto)];
        const vis = suave(0, 0.8, p.vida) * (1 - suave(0.75, 1, u));
        sprite(spFrente, p.x, p.y, p.tam * 2.6, p.par, col, 0.28 * vis, 0);
        sprite(spFrente, p.x, p.y, p.tam, p.par, col, 0.9 * vis, 1, 0.1 * alto, 0, 0.4);
      });

      motor.pasadaAurora({
        resolucion: CALIDADES[e.calidad].aurora,
        cam: [0, e.cam.y * PARALAJE.aurora],
        escala: e.escala,
        tiempo: e.aurora.tiempo,
        horizonte: HORIZONTE,
        intensidad: e.aurora.intensidad,
        oleada: e.aurora.oleada,
        cortinas: CALIDADES[e.calidad].cortinas,
        saltar: CALIDADES[e.calidad].cadaCuantos > 1 && e.cuadro % CALIDADES[e.calidad].cadaCuantos !== 0,
      });

      let onda = [0, 0, 0, 0];
      if (e.completo && e.constelacion) {
        const dc = e.t - e.tCompleto;
        if (dc > 1.0 && dc < 3.4) onda = [e.constelacion.centro[0], e.constelacion.centro[1], (dc - 1.0) * 0.85, 0.9 * Math.pow(1 - (dc - 1.0) / 2.4, 1.5)];
      }
      e.aparicion = Math.min(1, e.aparicion + (e.fondoListo ? 0.03 : 0));
      motor.componer({ camFondo: cielo, escala: e.escala, onda, aparicion: salida(e.aparicion) });
      const cam = [0, e.cam.y];
      motor.dibujarLineas(lnUniverso.datos, lnUniverso.n, cam, e.escala, 1);
      motor.dibujarLineas(ln.datos, ln.n, cam, e.escala, 1);
      motor.dibujarSprites(sp.datos, sp.n, cam, e.escala);
      e.musgo.lomas.forEach((l) => {
        const luzBorde = l.capa.luz * (0.65 + 0.35 * e.aurora.intensidad);
        motor.dibujarLoma(l.malla, { cam, escala: e.escala, paralaje: l.par, franja: l.franja, cuerpo: l.capa.cuerpo, borde: l.capa.borde, luz: luzBorde });
      });
      motor.dibujarLineas(lnFrente.datos, lnFrente.n, cam, e.escala, PARALAJE.lomas[2]);
      motor.dibujarSprites(spFrente.datos, spFrente.n, cam, e.escala);
    }

    function ubicarEtiquetas() {
      const c = e.constelacion;
      if (c) {
        etiquetas.forEach((el, i) => {
          const [sx, sy] = posPantalla(c.pos[i][0], c.pos[i][1], 1);
          let lado = c.lado[i];
          if (!el._ancho) el._ancho = el.offsetWidth;
          // Si del lado elegido no entra en la pantalla, va abajo.
          if (lado === 'der' && sx + 22 + el._ancho > e.cssAncho - 8) lado = 'abajo';
          if (lado === 'izq' && sx - 22 - el._ancho < 8) lado = 'abajo';
          let x = sx, y = sy + 22;
          if (lado === 'der') { x = sx + 22; y = sy; }
          if (lado === 'izq') { x = sx - 22; y = sy; }
          if (lado === 'abajo') x = clamp(x, 8 + el._ancho / 2, e.cssAncho - 8 - el._ancho / 2);
          if (el.dataset.lado !== lado) el.dataset.lado = lado;
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        });
      }
      if (e.universo) {
        e.universo.forEach((d, k) => {
          const [sx, sy] = posPantalla(d.centro[0], d.bajo, 1);
          etiquetasUniverso[k].style.transform = `translate3d(${sx.toFixed(1)}px, ${(sy + 14).toFixed(1)}px, 0)`;
        });
        const [tx0, ty0] = posPantalla(0, ZONA_UNIVERSO + 0.42, 1);
        dom.uTitulo.style.transform = `translate3d(${tx0.toFixed(1)}px, ${ty0.toFixed(1)}px, 0)`;
      }
      // La cabecera, la frase y el aviso son de la zona de hoy: se van con ella.
      const desplazamiento = e.cam.y * e.escalaCss;
      dom.cab.style.transform = `translate3d(0, ${desplazamiento.toFixed(1)}px, 0)`;
      ui.querySelector('.frase').style.transform = `translate3d(0, ${(desplazamiento * PARALAJE.lomas[2]).toFixed(1)}px, 0)`;
      const opac = 1 - suave(0.15, 0.6, e.cam.y);
      // Mientras aparece la figura, las etiquetas se corren a un costado: el momento es del mito.
      const dc = e.completo ? e.t - e.tCompleto : -1;
      const momento = e.completo ? suave(0.6, 1.4, dc) * (1 - suave(7.5, 9.0, dc)) : 0;
      dom.cab.style.opacity = opac;
      dom.etiquetas.style.opacity = opac * (1 - 0.72 * momento);
      dom.uEtiquetas.style.opacity = suave(0.5, 1.1, e.cam.y);
      dom.uTitulo.style.opacity = suave(0.6, 1.15, e.cam.y);
    }

    // Safari descarta el contexto gráfico cuando la pestaña pasa mucho tiempo en segundo plano:
    // al volver, se rearma todo lo de la GPU y el estado de la escena sigue igual.
    lienzo.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); e.perdido = true; });
    lienzo.addEventListener('webglcontextrestored', () => {
      motor = Motor.crear(lienzo, fuentes);
      e.musgo.lomas = [];
      e.perdido = false;
      redimensionar();
      e.aparicion = 0;
    });

    let ultimo = 0;
    function cuadro(ahora) {
      if (e.pausado) { ultimo = 0; return; }
      requestAnimationFrame(cuadro);
      if (e.perdido) return;
      const dt = ultimo ? Math.min(0.05, (ahora - ultimo) / 1000) : 1 / 60;
      ultimo = ahora;
      e.cuadro++;
      if (!e.fondoListo) e.fondoListo = motor.avanzarFondo(2);
      actualizar(dt);
      dibujarCielo();
      ubicarEtiquetas();
      e.fps.cuadros++;
      if (ahora - e.fps.desde > 500) {
        e.fps.valor = (e.fps.cuadros * 1000) / (ahora - e.fps.desde);
        e.fps.desde = ahora;
        e.fps.cuadros = 0;
        dom.fps.textContent = Math.round(e.fps.valor) + ' fps · ' + e.calidad;
      }
    }

    // Esperar a que el tamaño se asiente: en iOS la barra de Safari cambia el alto al hacer scroll,
    // y cada cambio rearma el fondo.
    let esperaTam = 0, tamAnterior = '';
    new ResizeObserver(() => {
      const r = contenedor.getBoundingClientRect();
      const clave = Math.round(r.width) + 'x' + Math.round(r.height);
      if (clave === tamAnterior) return;
      tamAnterior = clave;
      clearTimeout(esperaTam);
      esperaTam = setTimeout(() => { redimensionar(); e.aparicion = 0; }, motor.estado.fondo ? 140 : 0);
    }).observe(contenedor);
    redimensionar();
    requestAnimationFrame(cuadro);

    // ---------------------------------------------------------------- API para la galería
    return {
      ponerConstelacion,
      // Para las capturas automáticas: el mismo camino que un toque, sin coordenadas.
      tocarPorNombre(texto) {
        const i = e.habitos.findIndex((h) => nombreDe(h.nombre).includes(texto));
        if (i < 0) return false;
        const [sx, sy] = posPantalla(e.constelacion.pos[i][0], e.constelacion.pos[i][1], 1);
        tocar(sx, sy);
        return true;
      },
      simularSalud() {
        const i = e.habitos.findIndex((h) => h.auto && !h.encendido);
        if (i < 0 || e.esporasSalud.some((s) => s.indice === i)) return false;
        const h = e.habitos[i];
        h.valor = Math.max(h.valor, h.meta);
        refrescarEtiquetas();
        const destino = e.constelacion.pos[i];
        const origen = [destino[0] * 0.6 + 0.04, HORIZONTE - 0.02];
        const control = [mezclar(origen[0], destino[0], 0.2) - 0.08, mezclar(origen[1], destino[1], 0.55)];
        e.esporasSalud.push({
          indice: i, t0: e.t, dur: 1.5,
          punto: (u) => {
            const k = salida(u), v = 1 - k;
            return [v * v * origen[0] + 2 * v * k * control[0] + k * k * destino[0], v * v * origen[1] + 2 * v * k * control[1] + k * k * destino[1]];
          },
        });
        return true;
      },
      completarDia() {
        e.habitos.forEach((h, i) => { if (!h.auto && !h.encendido) cambiarHabito(i, true, { conAviso: false }); });
        if (!this.simularSalud()) revisarCompleto();
      },
      repetirAnimacion() {
        if (!e.completo) return;
        e.tCompleto = e.t;
        e.rafagaHecha = false;
        e.constelacion.figuraAvance = 0;
        e.constelacion.avance = e.constelacion.avance.map(() => 0);
        e.haptico('completo');
      },
      irA(zona) { e.cam.objetivo = zona === 'universo' ? ZONA_UNIVERSO : 0; e.cam.v = 0; },
      zona() { return e.cam.objetivo > 0 ? 'universo' : 'hoy'; },
      ponerCalidad(n) { e.calidad = n; redimensionar(); },
      ponerIdioma(id) { e.idioma = id; refrescarEtiquetas(); refrescarCabecera(); refrescarUniverso(); },
      ponerMusgo(g) { e.musgo.crecimiento = g; armarMusgo(); },
      ponerSemana(semana) { opciones.semana = semana; armarUniverso(); },
      mostrarFps(si) { dom.fps.hidden = !si; },
      pausar(si) { const antes = e.pausado; e.pausado = si; if (antes && !si) requestAnimationFrame(cuadro); },
      redimensionar,
      get completo() { return e.completo; },
      get encendidas() { return e.habitos.filter((h) => h.encendido).length; },
      get total() { return e.habitos.length; },
      get hayAutoPendiente() { return e.habitos.some((h) => h.auto && !h.encendido); },
    };
  }

  return { crear, proyectar };
})();
