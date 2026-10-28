// La entrada a la app, para aprobar en la galería antes de conectarla con la lógica: la frase de
// apertura, dos diapositivas, tus datos, la cuenta y el cuestionario que arma la meta inicial de
// comida. La recorre una estrella guía: nace en el musgo, presenta la frase, enciende Casiopea,
// dibuja los anillos de la luna, acompaña desde arriba y en el cuestionario lleva la barra. En la
// frase y las diapositivas espera abajo y tocarla es seguir: no hay cómo saltearlas. Cada pantalla
// tiene su lugar en el cielo (la cámara sube a medida que se avanza) y al final un «flum» lleva al
// cielo de hoy. Los textos salen del diccionario de la app (src/textos). La app hace lo mismo con el
// guion de src/secciones/entrada/guion.ts.

const Entrada = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const limitar = (x, a, b) => Math.min(b, Math.max(a, x));
  const mezclar = (a, b, k) => a + (b - a) * k;

  // Mifflin-St Jeor por el nivel de actividad, más o menos el ritmo elegido (7.700 kcal por kg),
  // con un piso, y sin déficit si es su caso (embarazo, lactancia o una condición médica). Es la
  // meta inicial: después la ajusta el control de cada semana.
  const ACTIVIDAD = { poco: 1.35, algo: 1.5, activo: 1.65, muy: 1.85 };
  const RITMO = { bajar: { suave: -0.25, recomendado: -0.5, rapido: -0.75 }, subir: { suave: 0.1, recomendado: 0.25, rapido: 0.4 } };
  function metas(r) {
    const basal = 10 * r.peso + 6.25 * r.altura - 5 * r.edad + (r.sexo === 'f' ? -161 : 5);
    const gasto = basal * ACTIVIDAD[r.actividad];
    const objetivo = r.sinDeficit && r.objetivo === 'bajar' ? 'mantener' : r.objetivo;
    const pct = objetivo === 'mantener' ? 0 : RITMO[objetivo][r.ritmo];
    const kcal = Math.max(r.sexo === 'f' ? 1200 : 1400, Math.round((gasto + (pct / 100) * r.peso * 7700 / 7) / 10) * 10);
    const proteina = Math.round(r.peso * (objetivo === 'bajar' ? 2.0 : objetivo === 'subir' ? 1.8 : 1.6));
    const grasas = Math.round(Math.max(0.6 * r.peso, (kcal * 0.27) / 9));
    const carbohidratos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));
    return { gasto: Math.round(gasto / 10) * 10, kcal, proteina, grasas, carbohidratos };
  }

  // La parte iluminada de una luna creciente de radio r: p va de 0 (nueva) a 1 (llena).
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }

  // ------------------------------------------------------------ los caminos de la estrella
  // Cada tramo es una lista de puntos repartidos por largo y no por el parámetro de la curva: así la
  // estrella va pareja y la estela mide lo mismo en una curva que en una vuelta.
  const PUNTOS = 48;
  function porLargo(muestra) {
    const N = PUNTOS * 4;
    const finos = [];
    let largo = 0;
    let antes = muestra(0);
    finos.push([antes[0], antes[1], 0]);
    for (let k = 1; k <= N; k++) {
      const p = muestra(k / N);
      largo += Math.hypot(p[0] - antes[0], p[1] - antes[1]);
      finos.push([p[0], p[1], largo]);
      antes = p;
    }
    const lut = [];
    let j = 0;
    for (let k = 0; k <= PUNTOS; k++) {
      const meta = (largo * k) / PUNTOS;
      while (j < N - 1 && finos[j + 1][2] < meta) j++;
      const a = finos[j];
      const b = finos[j + 1];
      const f = b[2] > a[2] ? limitar((meta - a[2]) / (b[2] - a[2]), 0, 1) : 0;
      lut.push(mezclar(a[0], b[0], f), mezclar(a[1], b[1], f));
    }
    return { lut, largo };
  }
  const bezier = (p0, p1, p2, p3) => porLargo((u) => {
    const v = 1 - u;
    const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });
  const recta = (p0, p1) => porLargo((u) => [mezclar(p0[0], p1[0], u), mezclar(p0[1], p1[1], u)]);
  // Una vuelta entera alrededor de c, desde arriba y en el sentido del reloj.
  const vuelta = (c, r) => porLargo((u) => [c[0] + r * Math.sin(u * TAU), c[1] - r * Math.cos(u * TAU)]);

  function enLut(lut, s) {
    const f = limitar(s, 0, 1) * PUNTOS;
    const k = Math.min(PUNTOS - 1, Math.floor(f));
    const r = f - k;
    return [mezclar(lut[2 * k], lut[2 * k + 2], r), mezclar(lut[2 * k + 1], lut[2 * k + 3], r)];
  }

  const FACIL = {
    lineal: (u) => u,
    suave: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(2 - 2 * u, 3) / 2),
    llega: (u) => 1 - Math.pow(1 - u, 3),
    sale: (u) => u * u * u,
  };

  // La estela mide 150 px y, cuando la estrella para, la alcanza en 280 ms.
  const ESTELA = 150;
  const RETRAE = 280;

  // Dónde está la estrella en el momento t del guion y las estelas que deja. Con Reducir movimiento
  // no viaja: se apaga donde estaba y se enciende donde va, sin estela.
  function estado(g, t, reducido) {
    let pos = g.inicio.pos;
    let escala = g.inicio.escala;
    let brillo = g.inicio.brillo;
    let visible = 1;
    const estelas = [];
    for (const tr of g.tramos) {
      if (t < tr.t0) break;
      const u = limitar((t - tr.t0) / tr.ms, 0, 1);
      const s = FACIL[tr.facil](u);
      if (tr.escala) escala = mezclar(tr.escala[0], tr.escala[1], s);
      if (tr.brillo) brillo = mezclar(tr.brillo[0], tr.brillo[1], s);
      if (reducido && tr.largo > 1) {
        pos = enLut(tr.lut, u < 0.5 ? 0 : 1);
        visible = u >= 1 ? 1 : Math.abs(2 * u - 1);
      } else {
        pos = enLut(tr.lut, s);
        visible = 1;
      }
      if (tr.estela && !reducido) {
        const pasado = t - tr.t0 - tr.ms;
        const k = pasado <= 0 ? 1 : 1 - pasado / RETRAE;
        if (k > 0) estelas.push({ lut: tr.lut, desde: Math.max(0, s - (ESTELA / Math.max(1, tr.largo)) * k), hasta: s });
      }
    }
    return { pos, escala, brillo: brillo * visible, base: brillo, estelas };
  }

  // La barra del cuestionario: cuánto lleva y cuánto se ve.
  function barraEn(g, t) {
    const b = g.barra;
    if (!b) return { k: 0, visible: 0 };
    const u = b.ms ? limitar((t - b.t0) / b.ms, 0, 1) : 1;
    return { k: mezclar(b.k[0], b.k[1], FACIL.llega(u)), visible: mezclar(b.visible[0], b.visible[1], limitar((t - (b.tv || 0)) / 500, 0, 1)) };
  }

  // Proyección gnomónica centrada en la constelación, con el norte arriba y el este a la izquierda
  // (la misma de escena.js y de src/cielo/mundo.ts).
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
    const le = Math.hypot(c[0], c[1]);
    const este = le < 1e-6 ? [1, 0, 0] : [-c[1] / le, c[0] / le, 0];
    const norte = [c[1] * este[2] - c[2] * este[1], c[2] * este[0] - c[0] * este[2], c[0] * este[1] - c[1] * este[0]];
    return vs.map((v) => {
      const k = v[0] * c[0] + v[1] * c[1] + v[2] * c[2];
      return [-(v[0] * este[0] + v[1] * este[1] + v[2] * este[2]) / k, (v[0] * norte[0] + v[1] * norte[1] + v[2] * norte[2]) / k];
    });
  }

  function encajar(plano, centro, maxAncho, maxAlto) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const escala = plano.length < 2 ? 1 : Math.min(maxAncho / Math.max(x1 - x0, 1e-6), maxAlto / Math.max(y1 - y0, 1e-6));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return plano.map(([x, y]) => [centro[0] + (x - cx) * escala, centro[1] + (y - cy) * escala]);
  }

  function crear(tel, escena, opciones) {
    const raiz = document.createElement('div');
    raiz.className = 'entrada';
    raiz.hidden = true;
    tel.appendChild(raiz);

    let idioma = 'es';
    const tx = (clave, vars) => {
      let s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma]);
      if (s == null) return clave;
      if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return s;
    };
    const numero = (n, dec) => n.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };
    const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lo que contestó: con Salud conectada, edad, sexo, altura y peso vienen de ahí (de mentira).
    const r = { salud: false, edad: 29, sexo: null, altura: 172, peso: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', sinDeficit: false, caso: 'nada' };
    const DE_SALUD = { edad: 31, sexo: 'm', altura: 176, peso: 78.4 };
    let desdeSalud = {};

    let actual = -1;
    let animando = 0;
    let temporizador = 0;
    let esperaPista = 0;
    const despues = (ms, fn) => setTimeout(fn, ms);

    // ------------------------------------------------------------ la estrella guía
    // Va por encima de las pantallas: la estrella (con su halo, sus rayos y el aro que se le cierra
    // encima cuando espera), la estela en un lienzo, la barra del cuestionario y el botón invisible
    // que la hace tocable. Cuadro a cuadro solo mientras se mueve algo: quieta, lo que respira es CSS.
    const guia = (() => {
      const capa = el('div', 'ent-guia-capa');
      const lienzo = document.createElement('canvas');
      lienzo.className = 'ent-estela';
      const ctx = lienzo.getContext('2d');
      const barra = el('div', 'ent-progreso');
      const relleno = el('i');
      barra.appendChild(relleno);
      const estrella = el('div', 'ent-guia');
      ['halo', 'rayos', 'nucleo', 'aro'].forEach((n) => estrella.appendChild(el('i', 'ent-guia-' + n)));
      const boton = el('button', 'ent-tocar oculto');
      boton.type = 'button';
      boton.disabled = true;
      const pista = el('p', 'ent-pista');
      capa.append(lienzo, barra, estrella, boton, pista);
      raiz.appendChild(capa);

      let g = null;
      let t0 = 0;
      let cuadro = 0;
      let hechos = 0;
      let dpr = 1;
      let ancho = 0;
      let alto = 0;
      let vivo = { pos: [0, 0], escala: 0.3, brillo: 0, enBarra: null };
      // Para las capturas: el reloj de la estrella quieto en un momento.
      let fijo = null;

      function pintarEstelas(estelas) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);
        // Sin estela, el lienzo se esconde: algunos navegadores siguen mostrando lo borrado.
        lienzo.style.visibility = estelas.length ? 'visible' : 'hidden';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        estelas.forEach((e) => {
          const pts = [];
          for (let k = 0; k <= 18; k++) pts.push(enLut(e.lut, mezclar(e.desde, e.hasta, k / 18)));
          const [cx, cy] = pts[0];
          const [hx, hy] = pts[pts.length - 1];
          if (Math.hypot(hx - cx, hy - cy) < 2) return;
          const degrade = (alfa) => {
            const d = ctx.createLinearGradient(cx, cy, hx, hy);
            d.addColorStop(0, 'rgba(246, 227, 166, 0)');
            d.addColorStop(1, `rgba(255, 244, 214, ${alfa})`);
            return d;
          };
          const trazo = () => {
            ctx.beginPath();
            pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          };
          // El resplandor son dos trazos anchos y tenues (un filtro de desenfoque es caro y en algunos
          // navegadores deja rastro); encima, el hilo de luz.
          [[7, 0.12], [3.6, 0.22], [1.6, 0.85]].forEach(([grosor, alfa]) => {
            trazo();
            ctx.strokeStyle = degrade(alfa);
            ctx.lineWidth = grosor;
            ctx.stroke();
          });
        });
      }

      function cuadroDe(ahora) {
        cuadro = 0;
        if (!g) return;
        const t = fijo != null ? fijo : ahora - t0;
        const e = estado(g, t, reducido());
        estrella.style.transform = `translate3d(${e.pos[0].toFixed(1)}px, ${e.pos[1].toFixed(1)}px, 0) scale(${e.escala.toFixed(3)})`;
        estrella.style.opacity = e.brillo.toFixed(3);
        pintarEstelas(e.estelas);
        const b = barraEn(g, t);
        relleno.style.width = `${(b.k * 100).toFixed(2)}%`;
        barra.style.opacity = b.visible.toFixed(3);
        vivo = { pos: e.pos, escala: e.escala, brillo: e.base, enBarra: b.visible > 0.5 ? b.k : null };
        if (g.pintar) g.pintar(t);
        while (hechos < g.eventos.length && g.eventos[hechos][0] <= t) g.eventos[hechos++][1]();
        if (t < g.duracion && fijo == null) cuadro = requestAnimationFrame(cuadroDe);
      }

      return {
        boton,
        barra,
        pista,
        get vivo() { return vivo; },
        reproducir(nuevo, a) {
          dpr = Math.min(2, window.devicePixelRatio || 1);
          if (ancho !== a.W || alto !== a.H) {
            ancho = a.W;
            alto = a.H;
            lienzo.width = Math.round(a.W * dpr);
            lienzo.height = Math.round(a.H * dpr);
          }
          g = nuevo;
          g.eventos = (g.eventos || []).slice().sort((x, y) => x[0] - y[0]);
          g.duracion = Math.max(g.fin || 0, g.hasta || 0, ...g.eventos.map((x) => x[0])) + RETRAE + 120;
          hechos = 0;
          fijo = null;
          vivo = { pos: g.inicio.pos, escala: g.inicio.escala, brillo: g.inicio.brillo, enBarra: g.inicio.enBarra ?? null };
          t0 = performance.now();
          cancelAnimationFrame(cuadro);
          cuadro = requestAnimationFrame(cuadroDe);
        },
        esperar(si) {
          estrella.classList.remove('enciende');
          estrella.classList.toggle('espera', si && !reducido());
          boton.disabled = !si;
          pista.classList.remove('visible');
        },
        // Tocarla la enciende, como a una estrella del cielo.
        encender() {
          estrella.classList.remove('espera', 'enciende');
          void estrella.offsetWidth;
          if (!reducido()) estrella.classList.add('enciende');
          boton.disabled = true;
          pista.classList.remove('visible');
        },
        mostrarBoton(si) { boton.classList.toggle('oculto', !si); },
        congelar(t) {
          fijo = t;
          cancelAnimationFrame(cuadro);
          cuadro = requestAnimationFrame(cuadroDe);
        },
        soltar() {
          if (fijo == null) return;
          t0 = performance.now() - fijo;
          fijo = null;
          cuadro = requestAnimationFrame(cuadroDe);
        },
        apagar() {
          cancelAnimationFrame(cuadro);
          cuadro = 0;
          g = null;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, lienzo.width, lienzo.height);
          estrella.className = 'ent-guia';
          estrella.style.opacity = '0';
          barra.style.opacity = '0';
          relleno.style.width = '0';
          boton.classList.add('oculto');
          boton.disabled = true;
          pista.classList.remove('visible');
        },
      };
    })();
    window.__guia = { congelar: guia.congelar, soltar: guia.soltar };

    // Los lugares de la estrella, medidos en la pantalla: abajo (donde espera), el musgo donde nace,
    // arriba de la frase, el centro de lo que se explica, el rincón donde acompaña, la marca y la barra.
    function anclas() {
      const W = raiz.offsetWidth || tel.clientWidth;
      const H = raiz.offsetHeight || tel.clientHeight;
      const b = guia.boton;
      const br = guia.barra;
      const descanso = [b.offsetLeft + b.offsetWidth / 2, b.offsetTop + b.offsetHeight / 2];
      const y = br.offsetTop + br.offsetHeight / 2;
      const marca = [W / 2, H * 0.36];
      return {
        W, H, descanso, marca,
        nacer: [W * 0.17, descanso[1] - 34],
        frase: [W / 2, H * 0.44 - 140],
        figura: [W / 2, H * 0.5],
        compania: [W - 44, y + 26],
        chispa: [marca[0] + 74, marca[1] - 30],
        barra: { y, x0: br.offsetLeft, x1: br.offsetLeft + br.offsetWidth },
      };
    }

    // Dónde queda la estrella al terminar cada pantalla: de ahí sale la siguiente.
    function reposo(i, a) {
      const paso = PASOS[i];
      if (!paso) return { pos: a.nacer, escala: 0.3, brillo: 0 };
      if (paso.tocar) return { pos: a.descanso, escala: 1, brillo: 1 };
      if (paso.id === 'datos') return { pos: a.compania, escala: 0.62, brillo: 0.85 };
      if (paso.id === 'cuenta') return { pos: a.chispa, escala: 0.7, brillo: 0.95 };
      if (paso.id === 'resultado') return { pos: [a.W / 2, a.barra.y], escala: 0.62, brillo: 1 };
      const k = (enCuestionario.indexOf(paso) + 1) / enCuestionario.length;
      return { pos: [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y], escala: 0.5, brillo: 0.9, enBarra: k };
    }

    function botonSeguir(texto, alTocar, clase) {
      const b = el('button', 'ent-boton ' + (clase || ''), texto);
      b.type = 'button';
      b.addEventListener('click', alTocar);
      return b;
    }

    // ------------------------------------------------------------ la luna de la comida
    // La comida tiene su luna: se llena con lo que comes, y tres arcos alrededor, uno por macro. La
    // meta es la luna llena. Es la misma luna de verdad de la zona de comida (comida.js): mares,
    // grano y la sombra con el borde suave.
    let lunas = 0;
    function luna(clase) {
      const id = `entLuna${++lunas}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '-100 -100 200 200');
      svg.setAttribute('class', 'ent-luna ' + (clase || ''));
      svg.innerHTML = `
        <defs>
          <radialGradient id="${id}-cara" cx="36%" cy="32%" r="76%">
            <stop offset="0" stop-color="#fffaf0"/><stop offset="0.5" stop-color="#f0e5ca"/><stop offset="0.88" stop-color="#d6c39b"/><stop offset="1" stop-color="#bfa77a"/>
          </radialGradient>
          <radialGradient id="${id}-noche" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#1b2342"/><stop offset="1" stop-color="#0b1022"/></radialGradient>
          <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="7"/>
            <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 1 -0.4"/>
            <feComposite in2="SourceAlpha" operator="in"/>
          </filter>
          <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
          <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>
          <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><path class="ent-luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
          <clipPath id="${id}-disco"><circle r="40"/></clipPath>
        </defs>
        <circle r="46" class="ent-luna-halo"/>
        <g clip-path="url(#${id}-disco)">
          <circle r="40" fill="url(#${id}-noche)"/>
          <g mask="url(#${id}-luz)">
            <circle r="40" fill="url(#${id}-cara)"/>
            <g class="luna-mares" filter="url(#${id}-suave)">
              <ellipse cx="-12" cy="-14" rx="11" ry="8.5"/><ellipse cx="5" cy="-10" rx="7" ry="6"/><ellipse cx="13" cy="0" rx="7.5" ry="7"/>
              <ellipse cx="-20" cy="6" rx="7.5" ry="13"/><ellipse cx="-2" cy="15" rx="6.5" ry="4.2"/><ellipse cx="20" cy="14" rx="4.5" ry="3.6"/>
            </g>
            <g class="luna-crateres"><circle cx="-6" cy="27" r="2.4"/><circle cx="10" cy="23" r="1.5"/><circle cx="24" cy="-2" r="1.3"/><circle cx="-26" cy="-6" r="1.2"/></g>
            <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.16"/>
            <circle r="40" class="luna-limbo" filter="url(#${id}-suave)"/>
          </g>
        </g>
        <circle r="40" class="ent-luna-contorno"/>
        <circle r="54" class="ent-arco ent-arco-p"/>
        <circle r="62" class="ent-arco ent-arco-c"/>
        <circle r="70" class="ent-arco ent-arco-g"/>`;
      const faseEl = svg.querySelector('.ent-luna-fase');
      const arcos = [...svg.querySelectorAll('.ent-arco')];
      // Dos maneras de usar los arcos: tres anillos que dibuja la estrella (la diapositiva) o un
      // solo anillo repartido entre los tres macros (el resultado).
      let repartido = false;
      arcos.forEach((a) => {
        const largo = 2 * Math.PI * Number(a.getAttribute('r'));
        a.style.strokeDasharray = `${largo} ${largo}`;
        a.style.strokeDashoffset = String(largo);
        a.dataset.largo = largo;
      });
      const dibujarArco = (a, ki) => {
        if (repartido) {
          a.style.strokeDasharray = `${(Number(a.dataset.tramo) * ki).toFixed(2)} ${a.dataset.largo}`;
          a.style.strokeDashoffset = String(-Number(a.dataset.desde));
        } else {
          a.style.strokeDashoffset = String(Number(a.dataset.largo) * (1 - ki));
        }
      };
      return {
        svg,
        // De creciente a llena en `ms`, con el anillo repartido que se llena tramo por tramo.
        llenar(ms, demora) {
          const t0 = performance.now() + (demora || 0);
          const cuadro = (ahora) => {
            const u = Math.min(1, Math.max(0, (ahora - t0) / ms));
            const k = 1 - Math.pow(1 - u, 3);
            faseEl.setAttribute('d', fase(0.06 + 0.94 * k, 40));
            arcos.forEach((a, i) => dibujarArco(a, Math.min(1, Math.max(0, (u - 0.3 * i) / 0.4))));
            if (u < 1 && svg.isConnected) animando = requestAnimationFrame(cuadro);
          };
          faseEl.setAttribute('d', fase(0.06, 40));
          arcos.forEach((a) => dibujarArco(a, 0));
          animando = requestAnimationFrame(cuadro);
        },
        // La fase y cuánto lleva cada anillo, desde afuera: la estrella los dibuja al dar la vuelta.
        pintar(k, avances) {
          faseEl.setAttribute('d', fase(0.06 + 0.94 * k, 40));
          arcos.forEach((a, i) => dibujarArco(a, avances[i]));
        },
        // Un anillo entre los tres macros, en proporción a sus kcal, con un hueco entre cada uno.
        repartir(lista) {
          repartido = true;
          const radio = 60;
          const largo = 2 * Math.PI * radio;
          let antes = 0;
          arcos.forEach((a, i) => {
            a.setAttribute('r', radio);
            a.dataset.largo = largo;
            a.dataset.desde = antes * largo;
            a.dataset.tramo = Math.max(0, lista[i] * largo - 7);
            antes += lista[i];
          });
        },
      };
    }

    // ------------------------------------------------------------ las pantallas
    // tocar: la estrella espera abajo y tocarla es seguir (la frase y las diapositivas).
    const PASOS = [
      { id: 'frase', camara: 0, tocar: true, armar: armarFrase },
      { id: 'habitos', camara: 0.42, tocar: true, armar: armarHabitos },
      { id: 'comida', camara: 0.8, tocar: true, armar: armarComida },
      { id: 'datos', camara: 0.98, armar: armarDatos },
      { id: 'cuenta', camara: 1.08, armar: armarCuenta },
      { id: 'salud', camara: 1.16, cuestionario: true, armar: armarSalud },
      { id: 'edad', camara: 1.19, cuestionario: true, armar: (p, c) => (r.edad < 16 ? armarMenor(p) : pantallaNumero(p, c.paso, { clave: 'edad', titulo: 'entrada.cuestionario.edadTitulo', min: 16, max: 90, paso: 1, dec: 0, unidad: tx('entrada.cuestionario.anos') })) },
      { id: 'sexo', camara: 1.22, cuestionario: true, armar: armarSexo },
      { id: 'altura', camara: 1.25, cuestionario: true, armar: (p, c) => pantallaNumero(p, c.paso, { clave: 'altura', titulo: 'entrada.cuestionario.alturaTitulo', min: 130, max: 220, paso: 1, dec: 0, unidad: 'cm' }) },
      { id: 'peso', camara: 1.28, cuestionario: true, armar: (p, c) => pantallaNumero(p, c.paso, { clave: 'peso', titulo: 'entrada.cuestionario.pesoTitulo', texto: 'entrada.cuestionario.pesoTexto', min: 35, max: 200, paso: 0.1, dec: 1, unidad: 'kg' }) },
      { id: 'actividad', camara: 1.31, cuestionario: true, armar: armarActividad },
      { id: 'cuidado', camara: 1.325, cuestionario: true, armar: armarCuidado },
      { id: 'objetivo', camara: 1.34, cuestionario: true, armar: armarObjetivo },
      { id: 'resultado', camara: 1.37, armar: armarResultado },
    ];
    const enCuestionario = PASOS.filter((p) => p.cuestionario);

    function pantalla(clase) {
      const p = el('section', 'ent-pantalla ' + clase);
      raiz.insertBefore(p, raiz.querySelector('.ent-guia-capa'));
      return p;
    }

    function cabezaDeCuestionario(p, paso) {
      const i = enCuestionario.indexOf(paso);
      // La barra es de la estrella (va por encima): acá queda su lugar.
      p.append(el('div', 'ent-progreso-hueco'), el('div', 'ent-paso', tx('entrada.cuestionario.paso', { n: i + 1, total: enCuestionario.length })));
    }

    // La frase: la estrella nace en el musgo, sube por la izquierda hasta arriba de la frase mientras
    // aparecen las palabras, y baja por la derecha a esperar.
    function armarFrase(p, { a }) {
      const { W, H } = a;
      const caja = el('div', 'ent-frase-caja');
      const q = el('p', 'ent-frase-texto');
      tx('entrada.frase').split(' ').forEach((palabra, i) => {
        const s = el('span', null, palabra);
        s.style.animationDelay = `${1.3 + i * 0.075}s`;
        q.append(s, ' ');
      });
      const autor = el('p', 'ent-frase-autor', tx('entrada.fraseAutor'));
      caja.append(q, autor);
      p.appendChild(caja);
      return {
        inicio: { pos: a.nacer, escala: 0.3, brillo: 0 },
        tramos: [
          { t0: 0, ms: 450, ...recta(a.nacer, a.nacer), facil: 'llega', escala: [0.3, 1], brillo: [0, 1] },
          { t0: 450, ms: 1300, ...bezier(a.nacer, [0, H * 0.55], [W * 0.12, H * 0.16], a.frase), facil: 'suave', estela: true },
          { t0: 2700, ms: 850, ...bezier(a.frase, [W * 1.02, H * 0.3], [W * 1.02, H * 0.8], a.descanso), facil: 'suave', estela: true },
        ],
        fin: 3550,
        eventos: [[380, () => escena.haptico('suave')]],
      };
    }

    // Casiopea en la pantalla: dónde va cada estrella y el orden en que la recorre la guía, de una
    // punta a la otra empezando por la de la izquierda.
    function casiopeaEn(a) {
      const c = (opciones.catalogo || []).find((x) => x.id === 'cassiopeia');
      if (!c) return null;
      const plano = encajar(proyectar(c.estrellas), [0, 0], a.W * 0.64, a.H * 0.2);
      const pos = plano.map(([x, y]) => [a.figura[0] + x, a.figura[1] - y]);
      const vecinos = pos.map(() => []);
      c.lineas.forEach(([i, j]) => { vecinos[i].push(j); vecinos[j].push(i); });
      const puntas = pos.map((_, i) => i).filter((i) => vecinos[i].length === 1).sort((i, j) => pos[i][0] - pos[j][0]);
      let ahora = puntas.length ? puntas[0] : 0;
      const orden = [ahora];
      while (orden.length < pos.length) {
        const siguienteEstrella = vecinos[ahora].find((v) => !orden.includes(v));
        if (siguienteEstrella == null) break;
        orden.push(siguienteEstrella);
        ahora = siguienteEstrella;
      }
      return { pos, orden, lineas: c.lineas };
    }

    // «Tus hábitos son estrellas»: la guía llega a la primera estrella y salta de una a la otra; cada
    // una se enciende al tocarla, la línea queda detrás, y al final se conecta como un día completo.
    function armarHabitos(p, { a, desde }) {
      p.append(el('h2', 'ent-titulo', tx('entrada.habitosTitulo')), el('p', 'ent-texto', tx('entrada.habitosTexto')));
      const cas = casiopeaEn(a);
      if (!cas) return { inicio: desde, tramos: [{ t0: 100, ms: 900, ...recta(desde.pos, a.descanso), facil: 'suave' }], fin: 2500 };
      const { pos, orden, lineas } = cas;
      const LLEGA = 1100;
      const SALTO = 310;
      const PAUSA = 90;
      const luz = pos.map(() => Infinity);
      const saltos = [];
      luz[orden[0]] = LLEGA;
      const primera = pos[orden[0]];
      const tramos = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.08, a.H * 0.8], [a.W * 0.02, primera[1] + 80], primera), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
      for (let k = 1; k < orden.length; k++) {
        const t0 = LLEGA + PAUSA + (k - 1) * (SALTO + PAUSA);
        tramos.push({ t0, ms: SALTO, ...recta(pos[orden[k - 1]], pos[orden[k]]), facil: 'suave', estela: true });
        luz[orden[k]] = t0 + SALTO;
        saltos.push([orden[k - 1], orden[k], t0, t0 + SALTO]);
      }
      const ultima = pos[orden[orden.length - 1]];
      const completo = luz[orden[orden.length - 1]] + 180;
      const sale = completo + 420;
      tramos.push({ t0: sale, ms: 850, ...bezier(ultima, [ultima[0] + 60, ultima[1] + 90], [a.W * 0.86, a.H * 0.86], a.descanso), facil: 'suave', estela: true });
      const pintar = dibujarCasiopea(p, a, pos, lineas, saltos);
      return {
        inicio: desde,
        tramos,
        fin: sale + 850,
        hasta: completo + 1300,
        eventos: [...orden.map((i) => [luz[i], () => escena.haptico('toque')]), [completo, () => escena.haptico('completo')]],
        pintar: (t) => pintar(t, luz, completo),
      };
    }

    function dibujarCasiopea(p, a, pos, lineas, saltos) {
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'ent-casiopea');
      svg.setAttribute('viewBox', `0 0 ${a.W} ${a.H}`);
      const nuevo = (etiqueta, attrs, padre) => {
        const n = document.createElementNS(SVG, etiqueta);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        (padre || svg).appendChild(n);
        return n;
      };
      const defs = nuevo('defs', {});
      const halo = nuevo('radialGradient', { id: 'entCasHalo' }, defs);
      [[0, 0.62], [0.34, 0.2], [1, 0]].forEach(([o, al]) => nuevo('stop', { offset: o, 'stop-color': '#f6e3a6', 'stop-opacity': al }, halo));
      const brillo = nuevo('radialGradient', { id: 'entCasDestello' }, defs);
      [[0, 0.95], [0.3, 0.45], [1, 0]].forEach(([o, al]) => nuevo('stop', { offset: o, 'stop-color': '#fff6de', 'stop-opacity': al }, brillo));
      lineas.forEach(([i, j]) => nuevo('line', { class: 'ent-cas-base', x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1] }));
      const oro = saltos.map(([i, j]) => {
        const largo = Math.hypot(pos[j][0] - pos[i][0], pos[j][1] - pos[i][1]);
        const n = nuevo('line', { class: 'ent-cas-oro', x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1], 'stroke-dasharray': `${largo} ${largo}`, 'stroke-dashoffset': largo });
        return { n, largo };
      });
      const centro = [pos.reduce((s, q) => s + q[0], 0) / pos.length, pos.reduce((s, q) => s + q[1], 0) / pos.length];
      const ola = nuevo('circle', { class: 'ent-cas-ola', cx: centro[0], cy: centro[1], r: 0, opacity: 0 });
      const estrellas = pos.map(([x, y]) => ({
        onda: nuevo('circle', { class: 'ent-cas-onda', cx: x, cy: y, r: 0, opacity: 0 }),
        halo: nuevo('circle', { cx: x, cy: y, r: 16, fill: 'url(#entCasHalo)', opacity: 0 }),
        destello: nuevo('circle', { cx: x, cy: y, r: 0, fill: 'url(#entCasDestello)', opacity: 0 }),
        anillo: nuevo('circle', { class: 'ent-cas-anillo', cx: x, cy: y, r: 4.2 }),
        nucleo: nuevo('circle', { cx: x, cy: y, r: 1.3, fill: '#fbf2d9', opacity: 0.55 }),
      }));
      p.appendChild(svg);
      // Lo de cada cuadro: una estrella que se enciende tiene un destello y una onda, como un toque
      // real; sin movimiento, solo se enciende.
      const fugaz = (d, ms, desde, hasta) => (d >= 0 && d <= ms && !reducido() ? mezclar(desde, hasta, FACIL.llega(d / ms)) : 0);
      const apaga = (d, ms, alfa) => (d >= 0 && d <= ms && !reducido() ? alfa * (1 - d / ms) : 0);
      return (t, luz, completo) => {
        estrellas.forEach((e, i) => {
          const d = t - luz[i];
          const l = limitar(d / 250, 0, 1);
          const pop = d >= 0 && !reducido() ? Math.exp(-d / 200) : 0;
          e.halo.setAttribute('opacity', l.toFixed(3));
          e.halo.setAttribute('r', (16 + 6 * l + 10 * pop).toFixed(2));
          e.nucleo.setAttribute('r', (1.3 + 1.3 * l + 0.8 * pop).toFixed(2));
          e.nucleo.setAttribute('opacity', (0.55 + 0.45 * l).toFixed(3));
          e.anillo.setAttribute('opacity', (1 - l).toFixed(3));
          e.destello.setAttribute('r', fugaz(d, 420, 8, 34).toFixed(2));
          e.destello.setAttribute('opacity', apaga(d, 420, 0.85).toFixed(3));
          e.onda.setAttribute('r', fugaz(d, 760, 8, 46).toFixed(2));
          e.onda.setAttribute('opacity', apaga(d, 760, 0.7).toFixed(3));
        });
        const c = limitar((t - completo) / 500, 0, 1);
        oro.forEach(({ n, largo }, k) => {
          const u = limitar((t - saltos[k][2]) / (saltos[k][3] - saltos[k][2]), 0, 1);
          n.setAttribute('stroke-dashoffset', (largo * (1 - FACIL.suave(u))).toFixed(2));
          n.setAttribute('stroke-opacity', (0.6 + 0.35 * c).toFixed(3));
          n.setAttribute('stroke-width', (1.2 + 0.5 * c).toFixed(2));
        });
        const dc = t - completo;
        ola.setAttribute('r', fugaz(dc, 1300, 16, 166).toFixed(1));
        ola.setAttribute('opacity', apaga(dc, 1300, 0.35).toFixed(3));
      };
    }

    // «Tu comida, a tu medida»: la guía da tres vueltas a la luna, una por macro, y cada vuelta deja
    // su anillo mientras la luna se llena.
    function armarComida(p, { a, desde }) {
      p.append(el('h2', 'ent-titulo', tx('entrada.comidaTitulo')), el('p', 'ent-texto', tx('entrada.comidaTexto')));
      const l = luna();
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      p.appendChild(escenario);
      const c = a.figura;
      // Los radios de los anillos en la caja de 230 px (54, 62 y 70 en la de 200).
      const R = [54, 62, 70].map((x) => x * 1.15);
      const arriba = (radio) => [c[0], c[1] - radio];
      const LLEGA = 1100;
      const VUELTA = 560;
      const CAMBIO = 90;
      const vueltas = R.map((_, i) => LLEGA + i * (VUELTA + CAMBIO));
      const tramos = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.1, a.H * 0.86], [c[0] - 120, c[1] - R[0] - 6], arriba(R[0])), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
      R.forEach((radio, i) => {
        tramos.push({ t0: vueltas[i], ms: VUELTA, ...vuelta(c, radio), facil: 'lineal', estela: true });
        if (i < R.length - 1) tramos.push({ t0: vueltas[i] + VUELTA, ms: CAMBIO, ...recta(arriba(radio), arriba(R[i + 1])), facil: 'suave' });
      });
      const termina = vueltas[R.length - 1] + VUELTA;
      tramos.push({ t0: termina, ms: 900, ...bezier(arriba(R[2]), [c[0] + 140, c[1] - R[2]], [a.W * 0.96, a.H * 0.84], a.descanso), facil: 'llega', estela: true });
      return {
        inicio: desde,
        tramos,
        fin: termina + 900,
        eventos: vueltas.map((v) => [v + VUELTA, () => escena.haptico('suave')]),
        pintar: (t) => l.pintar(limitar((t - LLEGA) / (termina - LLEGA), 0, 1), vueltas.map((v) => limitar((t - v) / VUELTA, 0, 1))),
      };
    }

    // Antes de la cuenta, una idea y una acción: qué guarda Moss, para qué, y el consentimiento para
    // los datos de salud (Ley 18.331 y la guía 5.1.1 de Apple). La estrella sube a acompañar.
    function armarDatos(p, { a, desde }) {
      p.classList.add('ent-cuestionario');
      const lista = el('ul', 'ent-lista-datos');
      tx('entrada.datos.lineas').forEach((linea, i) => {
        const li = el('li', null, linea);
        li.style.animationDelay = `${0.5 + i * 0.14}s`;
        lista.appendChild(li);
      });
      p.append(el('h2', 'ent-titulo', tx('entrada.datos.titulo')), el('p', 'ent-texto', tx('entrada.datos.texto')), lista, el('p', 'ent-chico ent-enlace ent-izquierda', tx('entrada.datos.politica')), el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.datos.acepto'), siguiente, 'ent-principal'));
      return {
        inicio: desde,
        tramos: [{ t0: 120, ms: 1100, ...bezier(desde.pos, [a.W * 0.9, a.H * 0.86], [a.W * 1.02, a.H * 0.32], a.compania), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 0.85] }],
        fin: 1220,
      };
    }

    // Menos de 18, según Salud: Moss no sigue (lo pediste el 22/10/2026).
    function armarMenor(p) {
      p.classList.add('ent-menor');
      p.append(el('h2', 'ent-titulo', tx('entrada.menor.titulo')), el('p', 'ent-texto', tx('entrada.menor.texto')));
    }

    // Embarazo, lactancia o una condición médica: sin déficit, y un profesional que acompañe. No se
    // guarda cuál: solo que Moss no pone en déficit.
    function armarCuidado(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuidado.titulo')));
      const aviso = el('p', 'ent-texto ent-aviso' + (r.caso !== 'nada' ? ' visible' : ''), tx('entrada.cuidado.aviso'));
      const casos = [
        ...(r.sexo === 'f' ? [['embarazo', tx('entrada.cuidado.embarazo')]] : []),
        ['condicion', tx('entrada.cuidado.condicion'), tx('entrada.cuidado.condicionTexto')],
        ['nada', tx('entrada.cuidado.nada')],
      ];
      opcionesDe(p, casos, r.caso, (v) => { r.caso = v; r.sinDeficit = v !== 'nada'; aviso.classList.toggle('visible', r.sinDeficit); });
      p.append(aviso, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    // La cuenta, solo con Apple. La estrella baja hasta la marca, pasa por encima mientras aparecen
    // las letras y queda arriba de la última, como un brillo.
    function armarCuenta(p, { a, desde }) {
      const m = a.marca;
      const PASA = 1000;
      const MS = 800;
      // Cada letra aparece cuando la estrella pasa por encima (sale rápido y frena: «llega»).
      const letras = [0.24, 0.44, 0.63, 0.81].map((s) => PASA + MS * (1 - Math.cbrt(1 - s)));
      const caja = el('div', 'ent-marca-caja');
      const marca = el('h1', 'ent-marca');
      'Moss'.split('').forEach((letra, i) => {
        const s = el('span', null, letra);
        s.style.animationDelay = `${(letras[i] / 1000).toFixed(2)}s`;
        marca.appendChild(s);
      });
      caja.append(marca, el('p', 'ent-lema', tx('entrada.cuenta.lema')));
      const apple = botonSeguir('', siguiente, 'ent-apple');
      apple.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6zM14.1 5.5c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"/></svg>';
      apple.appendChild(el('span', null, tx('entrada.cuenta.apple')));
      const pie = el('div', 'ent-pie ent-pie-cuenta');
      pie.append(apple, el('p', 'ent-chico ent-legal', tx('entrada.cuenta.legal')));
      p.append(caja, pie);
      const antes = [m[0] - 84, m[1] + 8];
      return {
        inicio: desde,
        tramos: [
          { t0: 100, ms: PASA - 100, ...bezier(desde.pos, [a.W * 0.6, desde.pos[1] + 10], [m[0] - 150, m[1] - 70], antes), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
          { t0: PASA, ms: MS, ...bezier(antes, [m[0] - 20, m[1] + 14], [m[0] + 50, m[1] + 4], a.chispa), facil: 'llega', estela: true, escala: [0.8, 0.7], brillo: [1, 0.95] },
        ],
        fin: PASA + MS,
      };
    }

    // En el cuestionario la estrella va en la punta de la barra y la estira al avanzar. Si llega de
    // afuera, baja al principio de la barra y la recorre hasta la pregunta de ahora.
    function guionDeBarra(a, desde, paso) {
      const k = (enCuestionario.indexOf(paso) + 1) / enCuestionario.length;
      const punta = [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y];
      if (desde.enBarra != null) {
        return {
          inicio: desde,
          tramos: [{ t0: 60, ms: 700, ...recta(desde.pos, punta), facil: 'llega', escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] }],
          barra: { k: [desde.enBarra, k], t0: 60, ms: 700, visible: [1, 1] },
          fin: 760,
        };
      }
      const comienzo = [a.barra.x0, a.barra.y];
      return {
        inicio: desde,
        tramos: [
          { t0: 80, ms: 900, ...bezier(desde.pos, [mezclar(desde.pos[0], comienzo[0], 0.3), desde.pos[1] + 80], [comienzo[0] + 70, comienzo[1] + 70], comienzo), facil: 'suave', estela: true, escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] },
          { t0: 980, ms: 700, ...recta(comienzo, punta), facil: 'llega' },
        ],
        barra: { k: [0, k], t0: 980, ms: 700, visible: [0, 1], tv: 600 },
        fin: 1680,
      };
    }

    function armarSalud(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      const iconos = el('div', 'ent-salud');
      ['huellas', 'luna', 'loto', 'gota', 'balanza'].forEach((n, i) => {
        const c = el('span', 'ent-salud-icono');
        c.innerHTML = opciones.icono(n);
        c.style.animationDelay = `${0.2 + i * 0.16}s`;
        iconos.appendChild(c);
      });
      const conectar = botonSeguir(tx('entrada.cuestionario.conectar'), () => {
        r.salud = true;
        desdeSalud = Object.assign({}, DE_SALUD);
        Object.assign(r, DE_SALUD);
        escena.haptico('toque');
        siguiente();
      }, 'ent-principal');
      const ahoraNo = botonSeguir(tx('entrada.cuestionario.ahoraNo'), siguiente, 'ent-secundario');
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.saludTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.saludTexto')), iconos, el('div', 'ent-pie', null));
      p.querySelector('.ent-pie').append(conectar, ahoraNo);
    }

    // Las pantallas de un número (edad, altura, peso) comparten forma.
    function pantallaNumero(p, paso, cfg) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx(cfg.titulo)));
      if (cfg.texto) p.appendChild(el('p', 'ent-texto', tx(cfg.texto)));
      const grande = el('div', 'ent-numero');
      const valor = el('b');
      grande.append(valor, el('span', null, cfg.unidad));
      if (desdeSalud[cfg.clave] != null) grande.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = cfg.min; rango.max = cfg.max; rango.step = cfg.paso;
      rango.value = r[cfg.clave];
      rango.setAttribute('aria-label', tx(cfg.titulo));
      const mostrar = () => { valor.textContent = numero(Number(rango.value), cfg.dec); };
      rango.addEventListener('input', () => { r[cfg.clave] = Number(rango.value); mostrar(); delete desdeSalud[cfg.clave]; const chip = grande.querySelector('em'); if (chip) chip.remove(); });
      mostrar();
      p.append(grande, rango, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function opcionesDe(p, lista, elegida, alElegir, clase) {
      const caja = el('div', 'ent-opciones ' + (clase || ''));
      lista.forEach(([valor, titulo, detalle]) => {
        const b = el('button', 'ent-opcion');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(valor === elegida));
        b.appendChild(el('b', null, titulo));
        if (detalle) b.appendChild(el('span', null, detalle));
        b.addEventListener('click', () => {
          caja.querySelectorAll('.ent-opcion').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          escena.haptico('suave');
          alElegir(valor);
        });
        caja.appendChild(b);
      });
      p.appendChild(caja);
      return caja;
    }

    function armarSexo(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.sexoTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.sexoTexto')));
      const seguir = botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal');
      seguir.disabled = !r.sexo;
      opcionesDe(p, [['f', tx('entrada.cuestionario.femenino')], ['m', tx('entrada.cuestionario.masculino')]], r.sexo, (v) => { r.sexo = v; seguir.disabled = false; }, 'ent-dos');
      if (desdeSalud.sexo) p.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      p.appendChild(el('div', 'ent-pie')).appendChild(seguir);
    }

    function armarActividad(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.actividadTitulo')));
      opcionesDe(p, ['poco', 'algo', 'activo', 'muy'].map((k) => [k, ...tx('entrada.cuestionario.actividad.' + k)]), r.actividad, (v) => { r.actividad = v; });
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function armarObjetivo(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.objetivoTitulo')));
      const ritmo = el('div', 'ent-ritmo');
      const textoRitmo = el('p', 'ent-chico');
      const pintarRitmo = () => {
        ritmo.hidden = r.objetivo === 'mantener';
        if (r.objetivo !== 'mantener') textoRitmo.textContent = tx('entrada.cuestionario.ritmoTexto', { pct: numero(Math.abs(RITMO[r.objetivo][r.ritmo]), 2) });
      };
      if (r.sinDeficit && r.objetivo === 'bajar') r.objetivo = 'mantener';
      const objetivos = opcionesDe(p, [['bajar', tx('entrada.cuestionario.bajar'), r.sinDeficit ? tx('entrada.cuidado.bajarNo') : null], ['mantener', tx('entrada.cuestionario.mantener')], ['subir', tx('entrada.cuestionario.subir')]], r.objetivo, (v) => { r.objetivo = v; pintarRitmo(); });
      // Sin déficit, bajar de peso no se elige acá: se dice por qué, corto.
      if (r.sinDeficit) objetivos.firstChild.disabled = true;
      ritmo.appendChild(el('span', 'ent-paso', tx('entrada.cuestionario.ritmo')));
      opcionesDe(ritmo, ['suave', 'recomendado', 'rapido'].map((k) => [k, tx('entrada.cuestionario.' + k)]), r.ritmo, (v) => { r.ritmo = v; pintarRitmo(); }, 'ent-segmento');
      ritmo.appendChild(textoRitmo);
      p.appendChild(ritmo);
      pintarRitmo();
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    // El resultado: la estrella deja la barra y queda arriba del título, el punto de partida.
    function armarResultado(p, { a, desde }) {
      const m = metas(Object.assign({}, r, { sexo: r.sexo || 'm' }));
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.resultadoTitulo')));
      const l = luna('ent-luna-grande');
      const kcalMacros = [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9];
      const total = kcalMacros.reduce((x, y) => x + y, 0) || 1;
      l.repartir(kcalMacros.map((k) => k / total));
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      const cifra = el('div', 'ent-kcal');
      const n = el('b', null, '0');
      cifra.append(n, el('span', null, tx('entrada.cuestionario.kcal')));
      p.append(escenario, cifra);
      const leyenda = el('div', 'ent-macros');
      [['p', 'proteina', m.proteina], ['c', 'carbohidratos', m.carbohidratos], ['g', 'grasas', m.grasas]].forEach(([c, k, g]) => {
        const fila = el('div', 'ent-macro ent-macro-' + c);
        fila.append(el('i'), el('span', null, tx('entrada.cuestionario.' + k)), el('b', null, `${numero(g)} g`));
        leyenda.appendChild(fila);
      });
      p.append(leyenda, el('p', 'ent-chico', tx('entrada.cuestionario.gasto', { n: numero(m.gasto) })), el('p', 'ent-texto', tx('entrada.cuestionario.resultadoTexto')));
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.cuestionario.empezar'), terminar, 'ent-principal'));
      l.llenar(1600, 200);
      // La cifra cuenta hasta la meta.
      const t0 = performance.now() + 200;
      const contar = (ahora) => {
        const u = Math.min(1, Math.max(0, (ahora - t0) / 1400));
        n.textContent = numero(Math.round(m.kcal * (1 - Math.pow(1 - u, 3))));
        if (u < 1 && n.isConnected) requestAnimationFrame(contar);
      };
      requestAnimationFrame(contar);
      const k = desde.enBarra ?? 1;
      return {
        inicio: desde,
        tramos: [{ t0: 150, ms: 900, ...recta(desde.pos, [a.W / 2, a.barra.y]), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 1] }],
        barra: { k: [k, k], visible: [desde.enBarra != null ? 1 : 0, 0] },
        fin: 1050,
      };
    }

    // ------------------------------------------------------------ moverse
    // Lista para seguir: la estrella espera abajo; si pasa un rato sin que la toquen, una palabra
    // chica dice qué hacer.
    function listo() {
      guia.esperar(true);
      esperaPista = despues(2600, () => guia.pista.classList.add('visible'));
      if (opciones.avanceSolo()) temporizador = despues(900, tocarEstrella);
    }

    function tocarEstrella() {
      if (guia.boton.disabled) return;
      guia.encender();
      escena.haptico('toque');
      siguiente();
    }
    guia.boton.addEventListener('click', tocarEstrella);

    // salto: se llegó desde los controles de la galería y no tocando; la estrella sale de donde
    // habría quedado la pantalla anterior.
    function ir(i, salto) {
      clearTimeout(temporizador);
      clearTimeout(esperaPista);
      cancelAnimationFrame(animando);
      const a = anclas();
      const desde = !salto && actual >= 0 && i === actual + 1 ? guia.vivo : reposo(i - 1, a);
      const vieja = raiz.querySelector('.ent-pantalla:not(.saliendo)');
      if (vieja) {
        vieja.classList.add('saliendo');
        setTimeout(() => vieja.remove(), 420);
      }
      actual = i;
      const paso = PASOS[i];
      escena.camara(paso.camara, i === 0);
      guia.esperar(false);
      guia.mostrarBoton(!!paso.tocar);
      // La pantalla nueva entra cuando la cámara ya empezó a subir.
      const p = pantalla('ent-' + paso.id + (paso.cuestionario ? ' ent-cuestionario' : ''));
      p.style.animationDelay = vieja ? '0.26s' : '0.12s';
      let g = paso.armar(p, { a, desde, paso });
      if (paso.cuestionario) g = guionDeBarra(a, desde, paso);
      if (paso.tocar) g.eventos = [...(g.eventos || []), [g.fin, listo]];
      guia.reproducir(g, a);
      opciones.alCambiar && opciones.alCambiar(paso.id);
    }

    function siguiente() {
      if (actual < PASOS.length - 1) ir(actual + 1);
    }

    function limpiar() {
      raiz.querySelectorAll('.ent-pantalla').forEach((n) => n.remove());
    }

    function empezar() {
      clearTimeout(temporizador);
      idioma = escena.idioma;
      limpiar();
      raiz.hidden = false;
      raiz.style.transform = ''; raiz.style.opacity = ''; raiz.style.filter = '';
      guia.pista.textContent = tx('entrada.tocaLaEstrella');
      guia.boton.setAttribute('aria-label', tx('entrada.seguir'));
      escena.ponerModo('entrada');
      escena.aparecer();
      if (opciones.alEmpezar) opciones.alEmpezar();
      actual = -1;
      ir(0);
    }

    // Al terminar el cuestionario: la estrella sube y se va, y un «flum» lleva hasta Inicio
    // (opciones.llegada), la comida. Al llegar, opciones.alTerminar (en la app, los primeros hábitos).
    function terminar() {
      clearTimeout(temporizador);
      const v = guia.vivo;
      guia.reproducir({ inicio: v, tramos: [{ t0: 0, ms: 650, ...recta(v.pos, [v.pos[0], -60]), facil: 'sale', estela: true, brillo: [v.brillo, 0] }], fin: 650 }, anclas());
      escena.viajar({
        hasta: { zoom: 1, velo: 0 },
        sale: raiz,
        llega: opciones.llegada ? opciones.llegada() : tel.querySelector('.ui'),
        alCambiar: () => {
          escena.quitarDemo();
          escena.ponerModo('hoy');
          escena.camara(0, true);
          if (opciones.alSalir) opciones.alSalir();
        },
        alLlegar: () => {
          guia.apagar();
          limpiar();
          actual = -1;
          opciones.alCambiar && opciones.alCambiar(null);
          if (opciones.alTerminar) opciones.alTerminar();
        },
      });
    }

    function salir() {
      clearTimeout(temporizador);
      clearTimeout(esperaPista);
      guia.apagar();
      escena.quitarDemo();
      raiz.hidden = true;
      limpiar();
      actual = -1;
      escena.ponerModo('hoy');
      escena.camara(0, true);
      if (opciones.alSalir) opciones.alSalir();
    }

    return {
      empezar,
      salir,
      irA(id) { const i = PASOS.findIndex((p) => p.id === id); if (i >= 0) { if (actual < 0) empezar(); ir(i, true); } },
      // Para las capturas: Salud dice 16 años, o es su caso (sin déficit).
      menor() { r.edad = 15; desdeSalud.edad = 15; },
      caso(v) { r.caso = v; r.sinDeficit = v !== 'nada'; if (v === 'embarazo') r.sexo = 'f'; },
      get paso() { return actual >= 0 ? PASOS[actual].id : null; },
      metas: () => metas(Object.assign({}, r, { sexo: r.sexo || 'm' })),
    };
  }

  return { crear };
})();
