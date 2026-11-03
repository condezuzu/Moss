// Cómo se ven las kcal del día. La luna no te terminó de cerrar (22/10/2026): estas son otras
// opciones para elegir mirándolas con los mismos datos. Cada estilo tiene su figura grande (Inicio),
// la chica (el día en Comida) y la mini (la semana y el mes de Comida). La luna sigue como estaba,
// para comparar. Pasada la meta, la figura queda llena y en oro, como el «de más» del texto.

const Kcal = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  // «macros»: los anillos de la proteína, los carbohidratos y las grasas, con sus colores (2/11/2026).
  const ESTILOS = ['luna', 'anillo', 'arco', 'barra', 'macros'];
  // Lo elegido queda en este navegador, como quedaría en el teléfono.
  const GUARDADO = 'moss-galeria-kcal';
  let estilo = 'luna';
  try {
    const g = localStorage.getItem(GUARDADO);
    if (ESTILOS.includes(g)) estilo = g;
  } catch (_) { /* sin guardado, la luna */ }
  const oyentes = [];

  function poner(e) {
    if (!ESTILOS.includes(e) || e === estilo) return;
    estilo = e;
    try { localStorage.setItem(GUARDADO, e); } catch (_) { /* no pasa nada */ }
    oyentes.forEach((f) => f(e));
  }

  const salida = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);
  const svg = (viewBox, clase, ancho, alto) => {
    const s = document.createElementNS(SVG, 'svg');
    s.setAttribute('viewBox', viewBox);
    s.setAttribute('class', clase);
    s.setAttribute('aria-hidden', 'true');
    if (ancho) s.style.width = ancho + 'px';
    if (alto) s.style.height = alto + 'px';
    return s;
  };

  // Lo que se anima de cualquier figura: de lo que muestra a `hasta` (lo comido sobre la meta), en `ms`.
  function animada(el, dibujar) {
    let ahora = 0;
    let cuadro = 0;
    dibujar(0);
    return {
      el,
      get fraccion() { return ahora; },
      ir(hasta, ms) {
        cancelAnimationFrame(cuadro);
        const desde = ahora;
        if (!ms || Math.abs(hasta - desde) < 1e-4) { ahora = hasta; dibujar(hasta); return; }
        const t0 = performance.now();
        const paso = (t) => {
          const k = salida((t - t0) / ms);
          ahora = desde + (hasta - desde) * k;
          dibujar(ahora);
          if (k < 1) cuadro = requestAnimationFrame(paso);
        };
        cuadro = requestAnimationFrame(paso);
      },
    };
  }

  // Un trazo que se llena: largo de 0 a 100, sin el punto que deja el borde redondo en 0.
  function llenar(trazo, f) {
    const largo = Math.min(1, Math.max(0, f)) * 100;
    trazo.setAttribute('stroke-dasharray', `${largo.toFixed(2)} 100`);
    trazo.style.opacity = largo < 0.4 ? '0' : '1';
  }

  // ------------------------------------------------------------ el anillo
  // Una vuelta es la meta, desde arriba y en el sentido del reloj. Adentro, cuánto llevás.
  function anillo({ tam, clase, grueso = 6, porcentaje }) {
    const r = 46 - grueso / 2;
    const s = svg('-50 -50 100 100', 'kc-anillo ' + (clase || ''), tam, tam);
    const vuelta = `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}`;
    s.innerHTML = `<path d="${vuelta}" class="kc-pista" stroke-width="${grueso}"/>`
      + `<path d="${vuelta}" pathLength="100" class="kc-lleno" stroke-width="${grueso}"/>`
      + (porcentaje ? '<text class="kc-por" x="0" y="7" text-anchor="middle"></text>' : '');
    const lleno = s.querySelector('.kc-lleno');
    const por = s.querySelector('.kc-por');
    return animada(s, (v) => {
      llenar(lleno, v);
      s.classList.toggle('de-mas', v > 1.0005);
      if (por) por.textContent = porcentaje(Math.round(Math.max(0, v) * 100));
    });
  }

  // ------------------------------------------------------------ el arco
  // Medio círculo, como el cielo sobre el horizonte: lo comido sube de izquierda a derecha, con una
  // estrella en la punta. En Inicio, la cifra va adentro.
  function arco({ ancho, clase, grueso = 5, estrella = true }) {
    const r = 46 - grueso / 2;
    const alto = 50 + grueso / 2 + 2;
    const s = svg(`-50 -50 100 ${alto}`, 'kc-arco ' + (clase || ''), ancho, ancho && (ancho * alto) / 100);
    const medio = `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;
    s.innerHTML = `<path d="${medio}" class="kc-pista" stroke-width="${grueso}"/>`
      + `<path d="${medio}" pathLength="100" class="kc-lleno" stroke-width="${grueso}"/>`
      + (estrella ? `<circle r="${Math.max(1.6, grueso * 0.95)}" class="kc-estrella"/>` : '');
    const lleno = s.querySelector('.kc-lleno');
    const punta = s.querySelector('.kc-estrella');
    return animada(s, (v) => {
      const f = Math.min(1, Math.max(0, v));
      llenar(lleno, f);
      s.classList.toggle('de-mas', v > 1.0005);
      if (punta) {
        const a = Math.PI * (1 - f);
        punta.setAttribute('cx', (r * Math.cos(a)).toFixed(2));
        punta.setAttribute('cy', (-r * Math.sin(a)).toFixed(2));
        punta.style.opacity = f < 0.004 ? '0' : '1';
      }
    });
  }

  // ------------------------------------------------------------ la barra
  // Una línea partida por comidas: se ve cómo se repartió el día. Pasada la meta, la línea entera es
  // lo comido y una marca fina dice dónde estaba la meta.
  function barra({ clase }) {
    const el = document.createElement('div');
    el.className = 'kc-barra ' + (clase || '');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="kc-barra-pista"></div><i class="kc-barra-meta"></i>';
    const pista = el.querySelector('.kc-barra-pista');
    const marca = el.querySelector('.kc-barra-meta');
    let partes = [];
    const dibujar = (v) => {
      const total = partes.reduce((a, x) => a + x, 0) || 1;
      const escala = Math.max(1, v);
      pista.innerHTML = '';
      let usado = 0;
      partes.forEach((x) => {
        const ancho = Math.max(0, Math.min(v / escala - usado, (x / total) * (v / escala)));
        if (ancho <= 0.001) return;
        const seg = document.createElement('i');
        seg.style.width = `${(ancho * 100).toFixed(2)}%`;
        pista.appendChild(seg);
        usado += ancho;
      });
      el.classList.toggle('de-mas', v > 1.0005);
      marca.style.left = `${((1 / escala) * 100).toFixed(2)}%`;
    };
    const a = animada(el, dibujar);
    return {
      el,
      get fraccion() { return a.fraccion; },
      // `comidas` son las kcal de cada comida, en orden: la barra se reparte entre ellas.
      ir(hasta, ms, comidas) {
        partes = comidas && comidas.length ? comidas : [1];
        a.ir(hasta, ms);
      },
    };
  }

  // ------------------------------------------------------------ los anillos de los macros
  // Tres vueltas, de afuera hacia adentro: la proteína, los carbohidratos y las grasas, cada una con su
  // color y su meta, como los anillos de Actividad. `ir` recibe además lo comido de cada macro sobre su
  // meta; sin eso, las tres van con las calorías.
  function anillosDeMacros({ tam, clase, grueso = 7 }) {
    const s = svg('-50 -50 100 100', 'kc-macros ' + (clase || ''), tam, tam);
    const MACROS = ['p', 'c', 'g'];
    s.innerHTML = MACROS.map((m, i) => {
      const r = 46 - grueso / 2 - i * (grueso + 2.5);
      const vuelta = `M 0 ${-r} A ${r} ${r} 0 1 1 0 ${r} A ${r} ${r} 0 1 1 0 ${-r}`;
      return `<path d="${vuelta}" class="kc-pista kc-m-${m}" stroke-width="${grueso}"/><path d="${vuelta}" pathLength="100" class="kc-lleno kc-m-${m}" stroke-width="${grueso}"/>`;
    }).join('');
    const llenos = [...s.querySelectorAll('.kc-lleno')];
    let ahora = { p: 0, c: 0, g: 0 };
    let cuadro = 0;
    const dibujar = (v) => MACROS.forEach((m, i) => {
      llenar(llenos[i], v[m]);
      llenos[i].classList.toggle('de-mas', v[m] > 1.0005);
    });
    dibujar(ahora);
    return {
      el: s,
      get fraccion() { return (ahora.p + ahora.c + ahora.g) / 3; },
      ir(hasta, ms, _comidas, macros) {
        const destino = macros || { p: hasta, c: hasta, g: hasta };
        cancelAnimationFrame(cuadro);
        const desde = Object.assign({}, ahora);
        if (!ms) { ahora = destino; dibujar(ahora); return; }
        const t0 = performance.now();
        const paso = (t) => {
          const k = salida((t - t0) / ms);
          ahora = { p: desde.p + (destino.p - desde.p) * k, c: desde.c + (destino.c - desde.c) * k, g: desde.g + (destino.g - desde.g) * k };
          dibujar(ahora);
          if (k < 1) cuadro = requestAnimationFrame(paso);
        };
        cuadro = requestAnimationFrame(paso);
      },
    };
  }

  // ------------------------------------------------------------ las de cada lugar
  /**
   * La de Inicio, grande: la luna o el anillo van al lado de la cifra; el arco, alrededor; la barra,
   * abajo. `porcentaje(n)` escribe lo que va adentro del anillo.
   */
  function grande(porcentaje) {
    if (estilo === 'macros') return anillosDeMacros({ tam: 116, clase: 'kc-grande', grueso: 8 });
    if (estilo === 'anillo') return anillo({ tam: 112, clase: 'kc-grande', grueso: 5, porcentaje });
    if (estilo === 'arco') return arco({ ancho: null, clase: 'kc-grande', grueso: 1.9 });
    if (estilo === 'barra') return barra({ clase: 'kc-grande' });
    return Luna.crear({ tam: 124, clase: 'in-luna' });
  }

  /** La del día en Comida, al lado de lo comido; la barra va debajo de la cifra. */
  function chica(porcentaje) {
    if (estilo === 'macros') return anillosDeMacros({ tam: 60, clase: 'kc-chica', grueso: 10 });
    if (estilo === 'anillo') return anillo({ tam: 58, clase: 'kc-chica', grueso: 7, porcentaje });
    if (estilo === 'arco') return arco({ ancho: 66, clase: 'kc-chica', grueso: 8, estrella: false });
    if (estilo === 'barra') return barra({ clase: 'kc-chica' });
    return Luna.crear({ tam: 64, clase: 'cm-luna-chica' });
  }

  /**
   * La de cada día de la semana y del mes (24 px), sin animar. `estado`: comido, plan (lo
   * planificado, tenue), futuro (sin nada todavía) o vacio. Con la luna, la dibuja Comida.
   */
  function mini(fraccion, estado) {
    const f = estado === 'comido' || estado === 'plan' ? Math.min(1, Math.max(0, fraccion)) : 0;
    const demas = (estado === 'comido' || estado === 'plan') && fraccion > 1.0005 ? ' de-mas' : '';
    if (estilo === 'barra') {
      const s = svg('-12 -12 24 24', `kc-mini kc-mini-barra ${estado}${demas}`);
      const alto = 20 * f;
      s.innerHTML = '<rect x="-3.5" y="-10" width="7" height="20" rx="3.5" class="kc-mini-pista"/>'
        + (alto > 0.3 ? `<rect x="-3.5" y="${(10 - alto).toFixed(2)}" width="7" height="${alto.toFixed(2)}" rx="${Math.min(3.5, alto / 2).toFixed(2)}" class="kc-mini-lleno"/>` : '');
      return s;
    }
    if (estilo === 'arco') {
      const s = svg('-12 -12 24 24', `kc-mini kc-mini-arco ${estado}${demas}`);
      const medio = 'M -9.5 4 A 9.5 9.5 0 0 1 9.5 4';
      s.innerHTML = `<path d="${medio}" class="kc-mini-pista"/>`
        + (f > 0.004 ? `<path d="${medio}" pathLength="100" stroke-dasharray="${(f * 100).toFixed(2)} 100" class="kc-mini-lleno"/>` : '');
      return s;
    }
    const s = svg('-12 -12 24 24', `kc-mini kc-mini-anillo ${estado}${demas}`);
    const vuelta = 'M 0 -9 A 9 9 0 1 1 0 9 A 9 9 0 1 1 0 -9';
    s.innerHTML = `<path d="${vuelta}" class="kc-mini-pista"/>`
      + (f > 0.004 ? `<path d="${vuelta}" pathLength="100" stroke-dasharray="${(f * 100).toFixed(2)} 100" class="kc-mini-lleno"/>` : '');
    return s;
  }

  /** Una muestra chica de cada estilo, quieta, para elegir (Todo lo de hoy). */
  function muestra(e) {
    const ejemplo = 0.62;
    if (e === 'macros') { const f = anillosDeMacros({ tam: 36, clase: 'kc-muestra', grueso: 9 }); f.ir(0, 0, null, { p: 0.72, c: 0.55, g: 0.85 }); return f.el; }
    if (e === 'anillo') { const f = anillo({ tam: 36, clase: 'kc-muestra', grueso: 9 }); f.ir(ejemplo, 0); return f.el; }
    if (e === 'arco') { const f = arco({ ancho: 40, clase: 'kc-muestra', grueso: 9, estrella: false }); f.ir(ejemplo, 0); return f.el; }
    if (e === 'barra') { const f = barra({ clase: 'kc-muestra' }); f.ir(ejemplo, 0, [3, 4, 2]); return f.el; }
    const luna = Luna.crear({ tam: 36, clase: 'kc-muestra' });
    luna.ir(ejemplo, 0);
    return luna.el;
  }

  return {
    ESTILOS,
    get estilo() { return estilo; },
    poner,
    alCambiar(f) { oyentes.push(f); },
    grande,
    chica,
    mini,
    muestra,
  };
})();
