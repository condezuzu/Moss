// La escena del cielo: estado de mentira, animaciones, toques y el día completo.
// Cada cuadro arma listas de sprites y líneas y se las pasa al motor. Nada de esto toca el
// navegador más allá del contenedor que recibe: es la misma lógica que va a correr en Skia.
// Tiene dos modos: «hoy» (la pestaña Hábitos) y «entrada» (el cielo solo, sin la constelación del
// día, para la entrada a la app); de la entrada a la app se viaja con el «flum» (viajar). El cielo
// queda quieto detrás de las tres pestañas, como el planeta de Ascent: lo que se desliza con su
// pestaña es la constelación (desplazarPagina).
// Como en la app (src/cielo/escena.ts y latido.ts), los cuadros corren solo mientras hacen falta: un
// toque, un gesto o un cambio lo dejan vivo unos segundos y después, sin nada en marcha, deja de
// pedir cuadros y queda la última imagen. Detrás de las otras secciones no corre.

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
  // Segundos que la estela de una estrella fugaz sigue a la vista después de que se apaga la cabeza.
  const RESTO_DE_LA_ESTELA = 0.45;
  // Lo mismo que src/cielo/escena.ts: cuánto sigue vivo el cielo, el radio del toque y el aro de la comida.
  const VIVO_AL_TOCAR = 6;
  const VIVO_AL_LLEGAR = 8;
  const RADIO_DE_TOQUE = 52;
  const PUNTOS_DE_COMIDA = 12;
  // La distancia mínima entre dos estrellas de hoy, en px CSS (src/cielo/plano.ts, SEPARACION).
  const SEPARACION = 60;
  // Hasta que se toca una estrella por primera vez, Hábitos muestra cómo se marca un hábito.
  const GUARDADO_GLOBITO = 'moss-galeria-globito';

  const CALIDADES = {
    // densidad: qué fracción de las celdas de 64 px tiene una estrella que titila (vivo.glsl).
    alta: { dpr: 2, octavas: 6, capas: 3, aurora: 0.5, cortinas: 3, densidad: 0.42, particulas: 1, cadaCuantos: 1 },
    media: { dpr: 1.5, octavas: 5, capas: 3, aurora: 0.34, cortinas: 2, densidad: 0.26, particulas: 0.6, cadaCuantos: 1 },
    baja: { dpr: 1, octavas: 4, capas: 2, aurora: 0.25, cortinas: 2, densidad: 0.14, particulas: 0.3, cadaCuantos: 2 },
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

  // Aparta las estrellas que quedaron más cerca que `minimo`, sin mover el centro (src/cielo/mundo.ts).
  function separar(plano, minimo) {
    const p = plano.map(([x, y]) => [x, y]);
    if (p.length < 2) return p;
    const centro = (q) => q.reduce((s, a) => [s[0] + a[0] / q.length, s[1] + a[1] / q.length], [0, 0]);
    const [cx, cy] = centro(p);
    for (let vuelta = 0; vuelta < 24; vuelta++) {
      let movio = false;
      for (let i = 0; i < p.length; i++) {
        for (let j = i + 1; j < p.length; j++) {
          let dx = p[j][0] - p[i][0], dy = p[j][1] - p[i][1];
          let d = Math.hypot(dx, dy);
          if (d >= minimo) continue;
          if (d < 1e-9) { dx = 1; dy = 0; d = 1; }
          const falta = (minimo - d) / 2 + 1e-6;
          p[i][0] -= (dx / d) * falta; p[i][1] -= (dy / d) * falta;
          p[j][0] += (dx / d) * falta; p[j][1] += (dy / d) * falta;
          movio = true;
        }
      }
      if (!movio) break;
    }
    const [nx, ny] = centro(p);
    return p.map(([x, y]) => [x - nx + cx, y - ny + cy]);
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

  // ------------------------------------------------------------------ escena

  function crear(contenedor, fuentes, opciones) {
    const lienzo = contenedor.querySelector('canvas');
    const ui = contenedor.querySelector('.ui');
    let motor = Motor.crear(lienzo, fuentes);
    const sp = { datos: new Float32Array(6000 * 12), n: 0, cap: 6000 };
    const spFrente = { datos: new Float32Array(1500 * 12), n: 0, cap: 1500 };
    const ln = { datos: new Float32Array(1200 * 12), n: 0, cap: 1200 };
    const lnUniverso = { datos: new Float32Array(400 * 12), n: 0, cap: 400 };

    const e = {
      t: 0,
      calidad: opciones.calidad || 'alta',
      idioma: opciones.idioma || 'es',
      textos: opciones.textos,
      cssAncho: 1, cssAlto: 1, aspecto: 0.46, escala: 1, escalaCss: 1,
      cam: { y: 0, v: 0, objetivo: 0, arrastre: null },
      // Dónde está la pestaña Hábitos, en píxeles desde su lugar: la constelación va con ella.
      paginaPx: 0,
      aparicion: 0,
      // Con Ascent arriba, lo de hoy se apaga y queda el cielo solo (de 0 a 1).
      velado: 0,
      fondoListo: false,
      constelacion: null,
      habitos: [],
      completo: false, tCompleto: -1, rafagaHecha: false,
      aurora: { tiempo: 40, intensidad: 1, oleada: 0 },
      efectos: [], particulas: [], esporasSalud: [],
      // El progreso de toda la vida (0 a 1): más estrellas, aurora y musgo.
      riqueza: opciones.riqueza == null ? 0.6 : opciones.riqueza,
      // Cuánto se ve la vía láctea (0 a 1): su polvo blanco va tenue desde el 21/10/2026.
      via: opciones.via == null ? 0.3 : opciones.via,
      musgo: { lomas: [], brotes: [] },
      modo: 'hoy',
      // El «flum» en curso y cómo queda el cielo al llegar (detrás de Ajustes: cerca y oscuro).
      viaje: null,
      fondoViaje: { zoom: 1, velo: 0 },
      // La constelación que se enciende sola en la entrada.
      demo: null,
      universo: null,
      ultimoToque: null,
      fps: { cuadros: 0, desde: 0, valor: 0 },
      cuadro: 0,
      pausado: false,
      perdido: false,
      fugaz: null, proximaFugaz: 7,
      // Vivo hasta este momento del tiempo de la escena; las veces que se llegó a Hábitos.
      vivoHasta: 0,
      llegadas: 0,
      auroraQuieta: true,
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
    // El cielo es el protagonista: el nombre de la constelación va chico, debajo de la fecha, y el
    // día completo no tiene texto propio (lo encendido lo dicen las estrellas y la luz de hoy; el
    // lector de pantalla lo lee en la cabecera).
    ui.innerHTML = `
      <header class="cab">
        <div class="cab-fila">
          <div><div class="cab-dia"></div><div class="cab-nombre"></div></div>
          <div class="cab-luz"><b></b><span></span></div>
        </div>
      </header>
      <div class="etiquetas"></div>
      <div class="universo-titulo"></div>
      <div class="universo-etiquetas"></div>
      <div class="aviso globito" aria-hidden="true"><span class="aviso-txt"></span></div>
      <div class="aviso" role="status"><span class="aviso-txt"></span><button type="button" class="aviso-btn"></button></div>
      <footer class="frase"><q></q><cite></cite></footer>
      <div class="fps" hidden></div>`;
    const $ = (s) => ui.querySelector(s);
    const dom = {
      dia: $('.cab-dia'), nombre: $('.cab-nombre'), luz: $('.cab-luz b'), luzTxt: $('.cab-luz span'),
      etiquetas: $('.etiquetas'), aviso: $('.aviso[role="status"]'), avisoTxt: $('.aviso[role="status"] .aviso-txt'),
      avisoBtn: $('.aviso-btn'), frase: $('.frase q'), cita: $('.frase cite'), fps: $('.fps'), cab: $('.cab'),
      uTitulo: $('.universo-titulo'), uEtiquetas: $('.universo-etiquetas'), pie: $('.frase'), globito: $('.globito'),
    };
    // El globito va donde la frase, que se aparta mientras está.
    dom.globito.style.bottom = 'calc(var(--pestanas) + 40px)';
    dom.globito.style.borderColor = 'rgba(232, 196, 106, 0.32)';
    dom.globito.style.paddingRight = '16px';
    dom.globito.style.pointerEvents = 'none';
    let etiquetas = [];
    let etiquetasUniverso = [];
    let temporizadorAviso = 0;
    let accionDelAviso = null;
    let globitoPendiente = true;
    try { globitoPendiente = !localStorage.getItem(GUARDADO_GLOBITO); } catch (_) { /* sin guardado, se muestra */ }

    // `accion`: un botón al lado del texto ({ texto, alTocar }); el de un hábito de comida lleva a Comida.
    function avisar(texto, accion) {
      dom.avisoTxt.textContent = texto;
      accionDelAviso = accion ? accion.alTocar : null;
      dom.avisoBtn.hidden = !accion;
      dom.avisoBtn.textContent = accion ? accion.texto : '';
      // Con botón, el texto puede ir en dos líneas, como en la app.
      dom.aviso.style.whiteSpace = accion ? 'normal' : '';
      dom.aviso.classList.add('visible');
      clearTimeout(temporizadorAviso);
      temporizadorAviso = setTimeout(() => dom.aviso.classList.remove('visible'), accion ? 4200 : 2600);
    }

    dom.avisoBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const a = accionDelAviso;
      accionDelAviso = null;
      dom.aviso.classList.remove('visible');
      if (a) a();
    });

    function quitarGlobito() {
      if (!globitoPendiente) return;
      globitoPendiente = false;
      try { localStorage.setItem(GUARDADO_GLOBITO, '1'); } catch (_) { /* no pasa nada */ }
    }

    // Debajo de la etiqueta, solo lo que lleva hoy un automático que no llegó: la meta ya está en el nombre.
    function textoAuto(h) {
      if (h.encendido) return '';
      if (h.auto === 'pasos') return numero(h.valor);
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
        auto.hidden = !auto.textContent;
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
      dom.nombre.textContent = nombreDe(c.datos.nombres);
      dom.luz.textContent = luzDelDia(hechos);
      dom.luzTxt.textContent = tx('cielo.luzDeHoy');
      dom.cab.setAttribute('aria-label', [dom.dia.textContent, dom.nombre.textContent,
        e.completo ? tx('cielo.completa') : tx('cielo.encendidas', { n: hechos, total: e.habitos.length }), luzDelDia(hechos) + ' ' + tx('cielo.luzDeHoy')].join(', '));
      dom.globito.querySelector('.aviso-txt').textContent = tx('cielo.globito');
      const f = opciones.frase;
      dom.frase.textContent = nombreDe(f.texto);
      dom.cita.textContent = nombreDe(f.autor);
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
      redimensionarFondo();
      armarMusgo();
      if (e.constelacion) ubicarConstelacion();
      armarUniverso();
      avivar(VIVO_AL_TOCAR);
    }

    // El cielo fijo se arma aparte y reemplaza al de antes cuando está entero (motor.avanzarFondo).
    function redimensionarFondo() {
      const cfg = CALIDADES[e.calidad];
      const margenX = 0.08;
      motor.prepararFondo({
        mundoMin: [-e.aspecto / 2 - margenX, -0.5 - 0.12],
        mundoTam: [e.aspecto + 2 * margenX, 1.0 + 0.24 + ZONA_UNIVERSO],
        escala: e.escala,
        horizonte: HORIZONTE,
        octavas: cfg.octavas,
        capas: cfg.capas,
        semilla: 7,
        riqueza: e.riqueza,
        via: e.via,
      });
      e.fondoListo = false;
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

    // Crece con la riqueza del cielo. Cada loma y los manchones de luz tienen su propio azar: al
    // crecer, lo que ya estaba queda donde estaba y solo se suma lo nuevo.
    function armarMusgo() {
      e.musgo.lomas.forEach((l) => motor.borrarLoma(l.malla));
      const g = e.riqueza;
      const ancho = e.aspecto / 2 + 0.25;
      // De atrás hacia adelante: la de atrás más azulada y clara (aire de por medio), la de
      // adelante casi negra con el borde encendido por la aurora.
      const defs = [
        { base: HORIZONTE + 0.03, amp: 0.024, frec: 3.0, semilla: 3, cojines: 8, pelusa: 0.0008, cuerpo: [0.032, 0.052, 0.078], borde: [0.24, 0.4, 0.42], luz: 0.12 },
        { base: HORIZONTE + 0.008, amp: 0.026, frec: 4.2, semilla: 7, cojines: 14, pelusa: 0.0012, cuerpo: [0.016, 0.03, 0.03], borde: [0.32, 0.55, 0.36], luz: 0.16 },
        { base: HORIZONTE - 0.036, amp: 0.018, frec: 5.4, semilla: 11, cojines: 24, pelusa: 0.0018, cuerpo: [0.007, 0.014, 0.012], borde: [0.46, 0.68, 0.32], luz: 0.22 },
      ];
      const franja = 1.6 / e.escalaCss;
      e.musgo.lomas = defs.map((d, k) => {
        const capa = Object.assign({}, d, { cojines: [] });
        const r = azar(99 + 101 * k);
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
      // Luz atrapada en el musgo de adelante: el musgo luminoso de verdad (Schistostega) no tiene
      // tallos que brillan, refleja la poca luz que hay desde adentro, en manchones de puntitos.
      const frente = e.musgo.lomas[2].capa;
      const r = azar(7777);
      const manchones = Math.round(2 + 4 * g);
      e.musgo.brotes = [];
      for (let m = 0; m < manchones; m++) {
        const cx = (r() * 2 - 1) * (e.aspecto / 2 + 0.02);
        const n = 3 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) {
          const x = cx + (r() - 0.5) * 0.04;
          e.musgo.brotes.push({ x, y: alturaLoma(frente, x) - 0.002 - r() * 0.013, tam: 0.6 + r() * 0.8, fase: r() * TAU, brillo: 0.4 + r() * 0.6 });
        }
      }
    }

    // ---------------------------------------------------------------- constelación de hoy
    function ponerConstelacion(datos, habitos) {
      e.constelacion = { datos };
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
      e.alCambiar();
    }

    function ubicarConstelacion() {
      const c = e.constelacion;
      const plano = proyectar(c.datos.estrellas);
      // Abajo queda lugar para la frase del día, sobre el musgo. Las estrellas pegadas se apartan.
      c.pos = separar(encajar(plano, [0, 0.075], e.aspecto * 0.68, 0.4), SEPARACION / e.escalaCss);
      c.lineas = c.datos.lineas.map(([a, b]) => [a, b]);
      c.prof = profundidades(c.pos.length, c.lineas);
      c.lineas = c.lineas.map(([a, b]) => (c.prof[a] <= c.prof[b] ? [a, b] : [b, a]));
      c.avance = c.lineas.map(() => (e.completo ? 1 : 0));
      c.centro = c.pos.reduce((s, p) => [s[0] + p[0] / c.pos.length, s[1] + p[1] / c.pos.length], [0, 0]);
      // Cada etiqueta va del lado de afuera de la constelación, para no taparle las líneas. Nunca
      // arriba: la estrella más alta quedaría pegada a la cabecera.
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
        // Un poco más arriba y más juntas que en plano.ts: abajo están las pestañas (etapa 10).
        const centro = [huecos[k][0] * A * 0.92, ZONA_UNIVERSO + huecos[k][1] * 0.88 + 0.03];
        const pos = encajar(plano, centro, A * 0.62, 0.14);
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
      // Sin «Deshacer», como en la app: tocar otra vez la estrella la apaga.
      if (conAviso) avisar(tx(encender ? 'cielo.encendida' : 'cielo.apagada', { habito: nombreDe(h.nombre) }));
      if (desdeSalud) avisar(tx('cielo.desdeSalud', { habito: nombreDe(h.nombre) }));
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
      }
    }

    // La estrella de hoy más cerca del punto (en píxeles del lienzo) dentro de un radio generoso y,
    // lejos de todas, la de la etiqueta tocada; o -1. Solo en Hábitos.
    function estrellaEn(px, py) {
      const c = e.constelacion;
      if (!c || e.modo !== 'hoy' || e.viaje || e.paginaPx !== 0) return -1;
      let mejor = -1, dist = RADIO_DE_TOQUE;
      c.pos.forEach(([x, y], i) => {
        const [sx, sy] = posPantalla(x, y, PARALAJE.cielo);
        const d = Math.hypot(sx - px, sy - py);
        if (d < dist) { dist = d; mejor = i; }
      });
      if (mejor >= 0) return mejor;
      const r = contenedor.getBoundingClientRect();
      return etiquetas.findIndex((el) => {
        const q = el.getBoundingClientRect();
        return q.width > 0 && px >= q.left - r.left - 6 && px <= q.right - r.left + 6 && py >= q.top - r.top - 6 && py <= q.bottom - r.top + 6;
      });
    }

    function tocar(px, py) {
      const mejor = estrellaEn(px, py);
      if (mejor < 0) return;
      const c = e.constelacion;
      const h = e.habitos[mejor];
      quitarGlobito();
      // Los de comida se encienden solos con lo anotado: tocarlos dice qué los enciende y lleva a Comida.
      if (h.auto === 'comida') {
        avisar(tx('cielo.seEnciendeCon.' + ((h.fuente && h.fuente.meta) || 'registrar')), opciones.alIrAComida ? { texto: tx('cielo.verComida'), alTocar: opciones.alIrAComida } : null);
        e.haptico('suave');
        e.efectos.push({ tipo: 'apagar', x: c.pos[mejor][0], y: c.pos[mejor][1], t0: e.t, dur: 0.4 });
        return;
      }
      cambiarHabito(mejor, !h.encendido);
    }

    // Arrastrar mueve la cámara; un toque sin arrastre enciende o apaga. Solo en Hábitos: en las
    // otras pestañas el cielo es el fondo. Mantener apretada una estrella 450 ms sin mover el dedo
    // abre su hábito (opciones.alMantener), como en la app; al soltar ya no enciende.
    let puntero = null;
    let esperaMantener = 0;
    contenedor.addEventListener('pointerdown', (ev) => {
      if (ev.target.closest('button') || e.paginaPx !== 0) return;
      avivar(VIVO_AL_TOCAR);
      const r = contenedor.getBoundingClientRect();
      const p = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, cam0: e.cam.y, ultimoY: ev.clientY, ultimoT: performance.now(), v: 0, movio: false, lejos: false, rx: r.left, ry: r.top };
      puntero = p;
      clearTimeout(esperaMantener);
      if (!opciones.alMantener) return;
      esperaMantener = setTimeout(() => {
        if (puntero !== p || p.movio || p.lejos) return;
        const i = estrellaEn(p.x0 - p.rx, p.y0 - p.ry);
        if (i < 0) return;
        puntero = null;
        e.haptico('toque');
        opciones.alMantener(i);
      }, 450);
    });
    contenedor.addEventListener('pointermove', (ev) => {
      if (!puntero || ev.pointerId !== puntero.id) return;
      const dy = ev.clientY - puntero.y0;
      if (Math.hypot(ev.clientX - puntero.x0, dy) > 8) puntero.lejos = true;
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
      clearTimeout(esperaMantener);
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
      const vivo = e.t < e.vivoHasta;

      if (!e.cam.arrastre) {
        const k = 70, amort = 2 * Math.sqrt(k);
        const a = -k * (e.cam.y - e.cam.objetivo) - amort * e.cam.v;
        e.cam.v += a * dt;
        e.cam.y += e.cam.v * dt;
        // Quieta del todo al llegar, como en la app.
        if (Math.abs(e.cam.y - e.cam.objetivo) < 1e-4 && Math.abs(e.cam.v) < 1e-3) { e.cam.y = e.cam.objetivo; e.cam.v = 0; }
      }

      e.habitos.forEach((h) => {
        const meta = h.encendido ? 1 : 0;
        h.luz += (meta - h.luz) * (1 - Math.exp(-dt * (h.encendido ? 16 : 7)));
        h.pop *= Math.exp(-dt * 6);
        if (Math.abs(meta - h.luz) < 0.002) h.luz = meta;
        if (h.pop < 0.01) h.pop = 0;
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
      e.auroraQuieta = Math.abs(objI - e.aurora.intensidad) < 0.004 && Math.abs(objO - e.aurora.oleada) < 0.004;

      if (c) {
        c.lineas.forEach((_, k) => {
          if (e.completo) c.avance[k] = salida((dc - 0.15 - c.prof[c.lineas[k][0]] * 0.3) / 0.4);
          else c.avance[k] = Math.max(0, c.avance[k] - dt * 2.6);
        });
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
      }

      e.particulas = e.particulas.filter((p) => {
        p.vida += dt;
        const f = Math.exp(-dt * p.frena);
        p.vx *= f; p.vy = p.vy * f + p.sube * dt;
        p.x += p.vx * dt; p.y += p.vy * dt;
        return p.vida < p.max;
      });
      e.efectos = e.efectos.filter((f) => e.t - f.t0 < f.dur);

      // Esporas: suben despacio desde la luz del musgo y, si llegan alto, se vuelven estrellas. Son
      // de vez en cuando: una cada siete segundos, más o menos, y solo con el cielo vivo; pasado el
      // rato, las que hay se apagan enseguida.
      const tasa = (0.05 + 0.15 * e.riqueza) * CALIDADES[e.calidad].particulas;
      if (!vivo) e.particulas.forEach((p) => { if (p.espora && p.max > p.vida + 0.8) p.max = p.vida + 0.8; });
      if (vivo && Math.random() < tasa * dt && e.musgo.brotes.length) {
        const k = e.musgo.brotes[Math.floor(Math.random() * e.musgo.brotes.length)];
        e.particulas.push({ espora: true, x: k.x, y: k.y, x0: k.x, vx: 0, vy: 0.018 + Math.random() * 0.03, vida: 0, max: 5 + Math.random() * 5, tam: 1.8 + Math.random() * 1.6, color: MUSGO_LUZ, brillo: 0.7, frena: 0, sube: 0, fase: Math.random() * TAU, par: PARALAJE.lomas[2] });
      }
      e.particulas.forEach((p) => {
        if (!p.espora) return;
        p.x = p.x0 + 0.012 * Math.sin(e.t * 0.9 + p.fase) * suave(0, 1.5, p.vida);
        p.par = mezclar(PARALAJE.lomas[2], 1, suave(HORIZONTE - 0.02, HORIZONTE + 0.3, p.y));
      });

      // Una estrella fugaz cada tanto, en la zona de hoy: cae en diagonal y rápido. Una de cada
      // cinco es una bola de fuego, más brillante, que estalla antes de apagarse. La cabeza se apaga
      // y la estela queda un instante donde estaba.
      if (vivo && !e.fugaz && e.t >= e.proximaFugaz && !opciones.movimientoReducido) {
        const r = Math.random;
        const izquierda = r() < 0.5;
        const ang = (izquierda ? Math.PI : 0) + (izquierda ? 1 : -1) * (0.45 + r() * 0.45);
        e.fugaz = {
          a: [(r() - 0.5) * e.aspecto * 0.7, e.cam.y + 0.2 + r() * 0.28], d: [Math.cos(ang), Math.sin(ang)],
          recorrido: 0.32 + r() * 0.22, largo: 0.16 + r() * 0.1, t0: e.t, dur: 0.45 + r() * 0.35, bola: r() < 0.2,
        };
        e.proximaFugaz = e.t + 12 + r() * 24;
      }
      if (e.fugaz && e.t - e.fugaz.t0 > e.fugaz.dur + RESTO_DE_LA_ESTELA) e.fugaz = null;

      actualizarDemo(dt);

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
      int *= 1 - e.velado;
      if (b.n >= b.cap || int <= 0.001) return;
      const o = b.n * 12, d = b.datos;
      d[o] = x; d[o + 1] = y; d[o + 2] = tam; d[o + 3] = par;
      d[o + 4] = col[0]; d[o + 5] = col[1]; d[o + 6] = col[2]; d[o + 7] = int;
      d[o + 8] = tipo; d[o + 9] = p1 || 0; d[o + 10] = p2 || 0; d[o + 11] = rot || 0;
      b.n++;
    }

    function linea(b, a, c, col, int, ancho, avance, punteado, chispa) {
      int *= 1 - e.velado;
      if (b.n >= b.cap || int <= 0.001 || avance <= 0) return;
      const o = b.n * 12, d = b.datos;
      d[o] = a[0]; d[o + 1] = a[1]; d[o + 2] = c[0]; d[o + 3] = c[1];
      d[o + 4] = col[0]; d[o + 5] = col[1]; d[o + 6] = col[2]; d[o + 7] = int;
      d[o + 8] = ancho; d[o + 9] = avance; d[o + 10] = punteado || 0; d[o + 11] = chispa || 0;
      b.n++;
    }

    function dibujarConstelacion() {
      const c = e.constelacion;
      if (!c || e.modo !== 'hoy') return;
      const dc = e.completo ? e.t - e.tCompleto : -1;
      const pulso = e.completo ? 1 + 0.55 * Math.exp(-Math.pow((dc - 1.05) / 0.13, 2)) : 1;

      c.lineas.forEach(([a, b], k) => {
        const fantasma = 1 - c.avance[k];
        linea(ln, c.pos[a], c.pos[b], PERGAMINO, 0.16 * fantasma, 0.8, 1, 7, 0);
        const av = c.avance[k];
        linea(ln, c.pos[a], c.pos[b], ORO, 0.95, 1.7, av, 0, av > 0 && av < 1 ? 1 : 0);
      });

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
          if (h.auto === 'comida') {
            // Un aro de puntos dorados: se enciende solo con lo que se anota.
            const r = 19 / e.escalaCss;
            sprite(sp, x, y, 22, 1, ORO_CLARO, 0.12 * apagada, 2, 0.86, 0.06);
            for (let k = 0; k < PUNTOS_DE_COMIDA; k++) {
              const a = (k / PUNTOS_DE_COMIDA) * TAU;
              sprite(sp, x + Math.cos(a) * r, y + Math.sin(a) * r, 3, 1, ORO_CLARO, 0.95 * apagada, 4);
            }
          } else if (h.auto) {
            sprite(sp, x, y, 20, 1, PERGAMINO, 0.16 * apagada, 2, 0.86, 0.06);
            sprite(sp, x, y, 20, 1, MUSGO_LUZ, 0.95 * apagada, 3, 0.86, h.meta ? clamp(h.valor / h.meta, 0, 1) : 0);
          } else {
            const latido = 0.3 + 0.13 * Math.sin(e.t * 2.2 + i * 1.7);
            sprite(sp, x, y, 18, 1, PERGAMINO, latido * apagada, 2, 0.84, 0.075);
          }
        }
      });

    }

    // El destello, la onda y el aro que se cierra de un toque (de verdad o de la demostración), y el
    // saludo de cada estrella al llegar a Hábitos.
    function dibujarEfectos() {
      e.efectos.forEach((f) => {
        const u = (e.t - f.t0) / f.dur;
        if (u < 0) return;
        if (f.tipo === 'saludo') { const r = mezclar(17, 34, salida(u)); sprite(sp, f.x, f.y, r, 1, ORO_CLARO, 0.32 * Math.sin(Math.PI * u), 2, 0.92, 2.2 / r); return; }
        if (f.tipo === 'destello') sprite(sp, f.x, f.y, mezclar(14, 70, salida(u)), 1, ORO_CLARO, 1.1 * (1 - u), 4);
        else if (f.tipo === 'onda') { const r = mezclar(14, 92, salida(u)); sprite(sp, f.x, f.y, r, 1, ORO, 0.75 * (1 - u), 2, 0.92, 2.2 / r); }
        else if (f.tipo === 'apagar') { const r = mezclar(42, 16, salida(u)); sprite(sp, f.x, f.y, r, 1, PERGAMINO, 0.4 * (1 - u), 2, 0.9, 1.6 / r); }
      });
    }

    // ---------------------------------------------------------------- la demostración de la entrada
    // «Tus hábitos son estrellas»: una constelación de verdad que se enciende sola, toque por toque,
    // con los mismos efectos que un toque real; al final se conecta como un día completo.
    function ponerDemo(datos, centro, maxAncho, maxAlto) {
      const pos = encajar(proyectar(datos.estrellas), centro, maxAncho, maxAlto);
      const prof = profundidades(pos.length, datos.lineas);
      const lineas = datos.lineas.map(([a, b]) => (prof[a] <= prof[b] ? [a, b] : [b, a]));
      e.demo = { pos, prof, lineas, t0: e.t, luz: pos.map(() => 0), pop: pos.map(() => 0), encendida: pos.map(() => false), avance: lineas.map(() => 0), completo: false, tCompleto: 0 };
    }

    const DEMO_PRIMERA = 0.45;
    const DEMO_ENTRE = 0.3;

    function actualizarDemo(dt) {
      const d = e.demo;
      if (!d) return;
      const td = e.t - d.t0;
      d.pos.forEach(([x, y], i) => {
        if (!d.encendida[i] && td >= DEMO_PRIMERA + DEMO_ENTRE * i) {
          d.encendida[i] = true;
          d.pop[i] = 1;
          e.efectos.push({ tipo: 'destello', x, y, t0: e.t, dur: 0.42 });
          e.efectos.push({ tipo: 'onda', x, y, t0: e.t, dur: 0.75 });
          const r = azar(Math.floor(e.t * 1000) + i);
          for (let k = 0; k < 10; k++) {
            const a = r() * TAU, v = 0.05 + r() * 0.1;
            e.particulas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vida: 0, max: 0.4 + r() * 0.5, tam: 2 + r() * 2.5, color: r() < 0.5 ? ORO_CLARO : ORO, brillo: 0.9, frena: 3.2, sube: 0, par: 1 });
          }
          e.haptico('toque');
        }
        d.luz[i] += ((d.encendida[i] ? 1 : 0) - d.luz[i]) * (1 - Math.exp(-dt * 16));
        d.pop[i] *= Math.exp(-dt * 6);
      });
      if (!d.completo && d.encendida.every(Boolean) && td >= DEMO_PRIMERA + DEMO_ENTRE * (d.pos.length - 1) + 0.25) {
        d.completo = true;
        d.tCompleto = e.t;
      }
      if (d.completo) {
        const dc = e.t - d.tCompleto;
        d.avance = d.lineas.map(([a]) => salida((dc - d.prof[a] * 0.22) / 0.35));
      }
    }

    function dibujarDemo() {
      const d = e.demo;
      if (!d) return;
      const td = e.t - d.t0;
      d.lineas.forEach(([a, b], k) => {
        linea(ln, d.pos[a], d.pos[b], PERGAMINO, 0.16 * (1 - d.avance[k]), 0.8, 1, 7, 0);
        linea(ln, d.pos[a], d.pos[b], ORO, 0.95, 1.7, d.avance[k], 0, d.avance[k] > 0 && d.avance[k] < 1 ? 1 : 0);
      });
      d.pos.forEach(([x, y], i) => {
        const luz = d.luz[i];
        sprite(sp, x, y, (30 + 30 * luz) * (1 + 0.3 * d.pop[i]), 1, ORO, 0.1 + 0.45 * luz, 0);
        sprite(sp, x, y, (13 + 10 * luz) * (1 + 0.6 * d.pop[i]), 1, BLANCO_CALIDO, 0.32 + 0.95 * luz, 1, 0.12 + 0.55 * luz, 0, e.t * 0.05 + i);
        if (luz < 0.99) sprite(sp, x, y, 18, 1, PERGAMINO, (0.3 + 0.13 * Math.sin(e.t * 2.2 + i * 1.7)) * (1 - luz), 2, 0.84, 0.075);
        // El dedo: un aro que se cierra sobre la estrella justo antes de que se encienda.
        const antes = DEMO_PRIMERA + DEMO_ENTRE * i - td;
        if (antes > 0 && antes < 0.28) {
          const u = 1 - antes / 0.28;
          sprite(sp, x, y, mezclar(40, 20, u), 1, BLANCO_CALIDO, 0.5 * u, 2, 0.9, 0.06);
          sprite(sp, x, y, 22, 1, BLANCO_CALIDO, 0.14 * u, 0);
        }
      });
    }

    function dibujarUniverso() {
      if (!e.universo || e.modo !== 'hoy') return;
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
      sp.n = 0; spFrente.n = 0; ln.n = 0; lnUniverso.n = 0;
      const cielo = [0, e.cam.y * PARALAJE.cielo];

      // Las estrellas que titilan y la estrella fugaz se dibujan en el shader (vivo.glsl): acá
      // solo se calcula dónde está la fugaz.
      let fugaz = [0, 0, 1, 0], fugazEstela = [0, 0, 0, 0];
      if (e.fugaz) {
        const f = e.fugaz;
        const u = (e.t - f.t0) / f.dur;
        const vuelo = clamp(u, 0, 1);
        const recorrido = f.recorrido * (0.65 * vuelo + 0.35 * vuelo * vuelo * (3 - 2 * vuelo));
        let cabeza = suave(0, 0.12, u) * (1 - suave(0.7, 1, u)) * (f.bola ? 1.5 : 1);
        if (f.bola) cabeza += 1.8 * Math.exp(-Math.pow((u - 0.86) / 0.06, 2));
        const estela = u < 1 ? suave(0, 0.2, u) : 1 - suave(0, RESTO_DE_LA_ESTELA, e.t - f.t0 - f.dur);
        fugaz = [f.a[0] + f.d[0] * recorrido, f.a[1] + f.d[1] * recorrido, f.d[0], f.d[1]];
        fugazEstela = [recorrido, f.largo, u < 1 ? cabeza : 0, estela * (f.bola ? 1.3 : 1)];
      }

      dibujarConstelacion();
      dibujarUniverso();
      dibujarDemo();
      dibujarEfectos();

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
      const luzAurora = 0.75 + 0.25 * e.aurora.intensidad;
      e.musgo.brotes.forEach((k) => {
        const tit = 0.7 + 0.3 * Math.sin(e.t * 0.9 + k.fase * 3);
        sprite(spFrente, k.x, k.y, 5.5 * k.tam, PARALAJE.lomas[2], [0.72, 0.9, 0.42], 0.15 * k.brillo * tit * luzAurora, 0);
        sprite(spFrente, k.x, k.y, 1.8 * k.tam, PARALAJE.lomas[2], [0.95, 0.96, 0.7], 0.4 * k.brillo * tit, 4);
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
        riqueza: e.riqueza,
        saltar: CALIDADES[e.calidad].cadaCuantos > 1 && e.cuadro % CALIDADES[e.calidad].cadaCuantos !== 0,
      });

      let onda = [0, 0, 0, 0];
      if (e.completo && e.constelacion) {
        const dc = e.t - e.tCompleto;
        if (dc > 1.0 && dc < 3.4) onda = [e.constelacion.centro[0], e.constelacion.centro[1], (dc - 1.0) * 0.85, 0.9 * Math.pow(1 - (dc - 1.0) / 2.4, 1.5)];
      }
      e.aparicion = Math.min(1, e.aparicion + (e.fondoListo ? 0.03 : 0));
      const viaje = paramsViaje();
      motor.empezarCuadro(!!viaje);
      motor.componer({
        camFondo: cielo, escala: e.escala, onda, aparicion: salida(e.aparicion),
        tiempo: e.t, densidad: CALIDADES[e.calidad].densidad, riqueza: e.riqueza, fugaz, fugazEstela,
      });
      const cam = [0, e.cam.y];
      // La constelación (y lo que sale de sus toques) se corre con su pestaña; el cielo, la aurora
      // y el musgo no. En la entrada no hay pestañas.
      const camPagina = [e.modo === 'entrada' ? 0 : -e.paginaPx / e.escalaCss, e.cam.y];
      motor.dibujarLineas(lnUniverso.datos, lnUniverso.n, camPagina, e.escala, 1);
      motor.dibujarLineas(ln.datos, ln.n, camPagina, e.escala, 1);
      motor.dibujarSprites(sp.datos, sp.n, camPagina, e.escala);
      e.musgo.lomas.forEach((l) => {
        const luzBorde = l.capa.luz * (0.65 + 0.35 * e.aurora.intensidad);
        motor.dibujarLoma(l.malla, { cam, escala: e.escala, paralaje: l.par, franja: l.franja, cuerpo: l.capa.cuerpo, borde: l.capa.borde, luz: luzBorde });
      });
      motor.dibujarSprites(spFrente.datos, spFrente.n, cam, e.escala);
      motor.terminarCuadro(viaje);
    }

    // ---------------------------------------------------------------- viajes («flum»)
    // De la entrada a la app se pasa con un salto de un segundo: la cámara acelera hacia un punto de
    // fuga, las estrellas se estiran en estelas, en la mitad cambia lo que se ve (alCambiar) y
    // después todo frena hasta quedar quieto. La pantalla que se va crece y se desvanece hacia
    // la cámara; la que llega viene de lejos, chica y borrosa, y se asienta.
    const DUR_VIAJE = 1.0;
    const MITAD_VIAJE = 0.45;

    function viajar({ hasta, sale, llega, alCambiar, alLlegar }) {
      if (e.viaje) return false;
      e.viaje = { t0: e.t, desde: Object.assign({}, e.fondoViaje), hasta: hasta || { zoom: 1, velo: 0 }, sale, llega, alCambiar, alLlegar, cambiado: false };
      if (llega) { llega.hidden = false; estiloViaje(llega, 0, false); }
      e.haptico('suave');
      return true;
    }

    function estiloViaje(el, k, saliendo) {
      if (!el) return;
      if (saliendo) {
        el.style.transform = `scale(${(1 + 0.22 * k).toFixed(3)})`;
        el.style.opacity = String(1 - k);
        el.style.filter = k > 0.01 ? `blur(${(5 * k).toFixed(1)}px)` : '';
      } else {
        el.style.transform = `scale(${(0.88 + 0.12 * k).toFixed(3)})`;
        el.style.opacity = String(k);
        el.style.filter = k < 0.99 ? `blur(${(7 * (1 - k)).toFixed(1)}px)` : '';
      }
    }

    // Lo que usa la pasada de viaje del motor este cuadro, o null si no hace falta.
    function paramsViaje() {
      const centro = [motor.estado.ancho / 2, motor.estado.alto * 0.56];
      const v = e.viaje;
      if (!v) {
        const f = e.fondoViaje;
        if (f.zoom === 1 && f.velo === 0) return null;
        return { centro, zoom: f.zoom, estela: 0, brillo: 1, velo: f.velo };
      }
      const u = clamp((e.t - v.t0) / DUR_VIAJE, 0, 1);
      let p;
      if (u < MITAD_VIAJE) {
        const k = Math.pow(u / MITAD_VIAJE, 2.2);
        p = { zoom: v.desde.zoom * (1 + 1.5 * k), estela: 1.1 * k, brillo: 1 + 0.35 * k, velo: mezclar(v.desde.velo, Math.max(v.desde.velo, 0.2), k) };
        estiloViaje(v.sale, suave(0, 0.85, u / MITAD_VIAJE), true);
        estiloViaje(v.llega, 0, false);
      } else {
        if (!v.cambiado) {
          v.cambiado = true;
          if (v.sale) v.sale.hidden = true;
          if (v.alCambiar) v.alCambiar();
        }
        const k = salida((u - MITAD_VIAJE) / (1 - MITAD_VIAJE));
        const destello = 0.35 * Math.exp(-Math.pow((u - MITAD_VIAJE) / 0.05, 2));
        p = { zoom: v.hasta.zoom * (1 + 0.6 * (1 - k)), estela: 1.1 * (1 - k), brillo: 1 + 0.35 * (1 - k) + destello, velo: mezclar(Math.max(v.hasta.velo, 0.2), v.hasta.velo, k) };
        estiloViaje(v.llega, suave(0.1, 1, k), false);
      }
      if (u >= 1) {
        e.fondoViaje = { zoom: v.hasta.zoom, velo: v.hasta.velo };
        if (v.sale) { v.sale.style.transform = ''; v.sale.style.opacity = ''; v.sale.style.filter = ''; }
        if (v.llega) { v.llega.style.transform = ''; v.llega.style.opacity = ''; v.llega.style.filter = ''; }
        e.viaje = null;
        e.haptico('toque');
        if (v.alLlegar) v.alLlegar();
      }
      return Object.assign({ centro }, p);
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
      dom.pie.style.transform = `translate3d(0, ${(desplazamiento * PARALAJE.lomas[2]).toFixed(1)}px, 0)`;
      const opac = 1 - suave(0.15, 0.6, e.cam.y);
      // Mientras la constelación se conecta y sube la aurora, las etiquetas se apagan un poco: el
      // momento es del cielo.
      const dc = e.completo ? e.t - e.tCompleto : -1;
      const momento = e.completo ? suave(0.6, 1.4, dc) * (1 - suave(7.5, 9.0, dc)) : 0;
      const sinVelo = 1 - e.velado;
      dom.cab.style.opacity = opac * sinVelo;
      dom.etiquetas.style.opacity = opac * (1 - 0.55 * momento) * sinVelo;
      dom.uEtiquetas.style.opacity = suave(0.5, 1.1, e.cam.y) * sinVelo;
      dom.uTitulo.style.opacity = suave(0.6, 1.15, e.cam.y) * sinVelo;
      // El globito, solo en Hábitos y hasta tocar una estrella; mientras está, la frase se aparta.
      const conGlobito = globitoPendiente && e.modo === 'hoy' && e.paginaPx === 0 && e.habitos.length > 0 && e.cam.objetivo === 0 && e.velado === 0 && !dom.aviso.classList.contains('visible');
      dom.globito.classList.toggle('visible', conGlobito);
      dom.pie.style.opacity = sinVelo * (conGlobito ? 0 : 1);
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
      // El lazo paró al perderse: sin esto, el cielo queda negro hasta el próximo toque.
      avivar(VIVO_AL_LLEGAR);
    });

    // ---------------------------------------------------------------- reposo (src/cielo/escena.ts)
    // Deja el cielo vivo `segundos` más y, si estaba quieto, vuelve a pedir cuadros. Con Reducir
    // movimiento no tiene vida propia: solo lo que responde a un toque.
    function avivar(segundos) {
      if (!opciones.movimientoReducido) e.vivoHasta = Math.max(e.vivoHasta, e.t + segundos);
      despertarLazo();
    }

    // La llegada a Hábitos: cada estrella saluda con un aro tenue y la primera vez pasa una fugaz.
    function saludar() {
      avivar(VIVO_AL_LLEGAR);
      if (opciones.movimientoReducido || !e.constelacion) return;
      e.efectos = e.efectos.filter((f) => f.tipo !== 'saludo');
      e.constelacion.pos.forEach(([x, y], i) => e.efectos.push({ tipo: 'saludo', x, y, t0: e.t + 0.12 + 0.07 * i, dur: 0.7 }));
      if (e.llegadas === 0 && !e.fugaz) e.proximaFugaz = Math.min(e.proximaFugaz, e.t + 1.4);
      e.llegadas++;
    }

    function hayMovimiento() {
      if (e.efectos.length || e.particulas.length || e.esporasSalud.length || e.fugaz || e.viaje) return true;
      if (e.cam.arrastre || e.cam.v !== 0 || e.cam.y !== e.cam.objetivo) return true;
      if (!e.fondoListo || e.aparicion < 1) return true;
      if (!e.auroraQuieta || (e.completo && e.t - e.tCompleto < 9.5)) return true;
      if (e.habitos.some((h) => h.luz !== (h.encendido ? 1 : 0) || h.pop !== 0)) return true;
      if (e.constelacion && e.constelacion.avance && e.constelacion.avance.some((a) => a !== (e.completo ? 1 : 0))) return true;
      const d = e.demo;
      return !!d && (!d.completo || d.avance.some((a) => a < 1) || d.luz.some((l) => l < 0.999) || d.pop.some((p) => p > 0.01));
    }

    let ultimo = 0;
    // Menos de 1 para revisar las animaciones en cámara lenta (capturas por software).
    let velocidad = 1;
    let corriendo = false;
    function despertarLazo() {
      if (corriendo || e.pausado) return;
      corriendo = true;
      ultimo = 0;
      requestAnimationFrame(cuadro);
    }
    // Sin pedir más cuadros: queda la última imagen.
    function quedarQuieto() {
      corriendo = false;
      ultimo = 0;
      dom.fps.textContent = 'en reposo · ' + e.calidad + ' · ' + e.cuadro + ' cuadros';
    }
    function cuadro(ahora) {
      if (e.pausado || e.perdido) { corriendo = false; ultimo = 0; return; }
      // Detrás de las otras secciones el cielo no se calcula ni se vuelve a dibujar, como en la app.
      const oculto = e.modo === 'hoy' && !e.viaje && e.velado === 0 && e.fondoListo && e.aparicion >= 1 && Math.abs(e.paginaPx) >= e.cssAncho;
      const enMarcha = hayMovimiento() || !!(puntero && puntero.movio);
      if (oculto || (!enMarcha && e.t >= e.vivoHasta)) { quedarQuieto(); return; }
      requestAnimationFrame(cuadro);
      // Sin nada en marcha (el titilar y la aurora, que van lentos), a 30 cuadros: la mitad del trabajo.
      if (!enMarcha && ultimo && ahora - ultimo < 30) return;
      const dt = (ultimo ? Math.min(0.05, (ahora - ultimo) / 1000) : 1 / 60) * velocidad;
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
        dom.fps.textContent = Math.round(e.fps.valor) + ' fps · ' + e.calidad + ' · ' + e.cuadro + ' cuadros';
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

    // ---------------------------------------------------------------- API para la galería
    return {
      ponerConstelacion(datos, habitos) { ponerConstelacion(datos, habitos); avivar(VIVO_AL_LLEGAR); },
      // Para las capturas automáticas: el mismo camino que un toque, sin coordenadas.
      tocarPorNombre(texto) {
        const i = e.habitos.findIndex((h) => nombreDe(h.nombre).includes(texto));
        if (i < 0) return false;
        const [sx, sy] = posPantalla(e.constelacion.pos[i][0], e.constelacion.pos[i][1], 1);
        avivar(VIVO_AL_TOCAR);
        tocar(sx, sy);
        return true;
      },
      // Dónde está una estrella en la página, para apretarla con el mouse en las capturas.
      dondeEsta(texto) {
        const i = e.habitos.findIndex((h) => nombreDe(h.nombre).includes(texto));
        if (i < 0) return null;
        const r = contenedor.getBoundingClientRect();
        const [sx, sy] = posPantalla(e.constelacion.pos[i][0], e.constelacion.pos[i][1], PARALAJE.cielo);
        return { x: r.left + sx, y: r.top + sy };
      },
      avisar(texto) { avisar(texto); avivar(0.5); },
      // Los que se encienden solos con la comida no esperan a Salud.
      simularSalud() {
        const i = e.habitos.findIndex((h) => h.auto && h.auto !== 'comida' && !h.encendido);
        if (i < 0 || e.esporasSalud.some((s) => s.indice === i)) return false;
        avivar(VIVO_AL_TOCAR);
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
        avivar(VIVO_AL_TOCAR);
        e.habitos.forEach((h, i) => { if (!h.auto && !h.encendido) cambiarHabito(i, true, { conAviso: false }); });
        if (!this.simularSalud()) revisarCompleto();
      },
      repetirAnimacion() {
        if (!e.completo) return;
        avivar(VIVO_AL_TOCAR);
        e.tCompleto = e.t;
        e.rafagaHecha = false;
        e.constelacion.avance = e.constelacion.avance.map(() => 0);
        e.haptico('completo');
      },
      irA(zona) { e.cam.objetivo = zona === 'universo' ? ZONA_UNIVERSO : 0; e.cam.v = 0; avivar(VIVO_AL_TOCAR); },
      zona() { return e.cam.objetivo > 0 ? 'universo' : 'hoy'; },
      ponerCalidad(n) { e.calidad = n; redimensionar(); },
      ponerIdioma(id) { e.idioma = id; refrescarEtiquetas(); refrescarCabecera(); refrescarUniverso(); avivar(0.5); },
      ponerRiqueza(r) {
        if (Math.abs(r - e.riqueza) < 0.001) return;
        e.riqueza = r;
        armarMusgo();
        redimensionarFondo();
        avivar(VIVO_AL_TOCAR);
      },
      lanzarFugaz() { if (!e.fugaz) e.proximaFugaz = e.t; avivar(VIVO_AL_TOCAR); },
      ponerVia(v) {
        if (Math.abs(v - e.via) < 0.001) return;
        e.via = v;
        redimensionarFondo();
        avivar(VIVO_AL_TOCAR);
      },
      velocidad(v) { velocidad = v; },
      // Las pestañas: `px` es dónde está Hábitos respecto de la pantalla (positivo, a la derecha).
      desplazarPagina(px) {
        if (px === e.paginaPx) return;
        const antes = e.paginaPx;
        e.paginaPx = px;
        // Mientras Hábitos asoma, llega o se va, el cielo se mueve; al llegar, saluda.
        if (e.modo !== 'hoy' || (Math.abs(px) >= e.cssAncho && Math.abs(antes) >= e.cssAncho)) return;
        if (px === 0) saludar(); else avivar(VIVO_AL_TOCAR);
      },
      // Si el dedo arrastra la cámara, el gesto es del cielo y no de las pestañas.
      get arrastrando() { return !!(puntero && puntero.movio); },
      // Las pestañas se quedaron con el gesto: lo que empezó acá ya no es un toque.
      soltarGesto() { puntero = null; },
      viajar(v) { const si = viajar(v); avivar(VIVO_AL_TOCAR); return si; },
      get viajando() { return !!e.viaje; },
      // La entrada: el cielo solo, con la cámara donde la pida cada pantalla.
      ponerModo(modo) { e.modo = modo; ui.hidden = modo !== 'hoy'; avivar(VIVO_AL_TOCAR); },
      get modo() { return e.modo; },
      camara(y, deUna) { e.cam.objetivo = y; e.cam.v = 0; if (deUna) e.cam.y = y; avivar(VIVO_AL_TOCAR); },
      // Ascent arriba: lo de hoy (la constelación, el universo y sus textos) se apaga y queda el cielo.
      velar(v) { const nuevo = Math.min(1, Math.max(0, v)); if (nuevo !== e.velado) { e.velado = nuevo; avivar(VIVO_AL_TOCAR); } },
      aparecer() { e.aparicion = 0; avivar(VIVO_AL_TOCAR); },
      ponerDemo(...a) { ponerDemo(...a); avivar(VIVO_AL_TOCAR); },
      quitarDemo() { e.demo = null; avivar(0.5); },
      get riqueza() { return e.riqueza; },
      get idioma() { return e.idioma; },
      haptico: (tipo) => e.haptico(tipo),
      ponerSemana(semana) { opciones.semana = semana; armarUniverso(); avivar(0.5); },
      mostrarFps(si) { dom.fps.hidden = !si; },
      // Los cuadros dibujados y si el cielo está quieto: para comprobar que en reposo no corre.
      get cuadros() { return e.cuadro; },
      get quieto() { return !corriendo; },
      pausar(si) { e.pausado = si; if (!si) avivar(VIVO_AL_TOCAR); },
      redimensionar,
      get completo() { return e.completo; },
      get nombre() { return e.constelacion ? nombreDe(e.constelacion.datos.nombres) : ''; },
      get encendidas() { return e.habitos.filter((h) => h.encendido).length; },
      get total() { return e.habitos.length; },
      get hayAutoPendiente() { return e.habitos.some((h) => h.auto && h.auto !== 'comida' && !h.encendido); },
      // Lo de hoy para el bloque de Inicio: la constelación y cada hábito con lo encendido.
      get hoy() { return e.constelacion ? { constelacion: e.constelacion.datos, habitos: e.habitos.map((h) => Object.assign({}, h)) } : null; },
    };
  }

  // Las mismas cuentas que src/cielo/mundo.ts: la riqueza sale de la luz juntada desde siempre.
  const LUZ_PLENA = 3650;
  const ESCALA_DE_RIQUEZA = 40;
  const riquezaDe = (luz) => Math.min(1, Math.log1p(Math.max(0, luz) / ESCALA_DE_RIQUEZA) / Math.log1p(LUZ_PLENA / ESCALA_DE_RIQUEZA));
  const luzParaRiqueza = (r) => ESCALA_DE_RIQUEZA * Math.expm1(r * Math.log1p(LUZ_PLENA / ESCALA_DE_RIQUEZA));

  return { crear, proyectar, encajar, riquezaDe, luzParaRiqueza };
})();
