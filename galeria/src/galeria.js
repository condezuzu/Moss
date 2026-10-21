// La página de revisión: datos de mentira, controles y el catálogo.
// CATALOGO, TEXTOS y SHADERS los inyecta galeria/construir.mjs desde src/ (una sola fuente).

(() => {
  // La Lira de la demo. Si el catálogo trae una Lira de cinco estrellas, se usa esa.
  const LIRA_RESPALDO = {
    id: 'lyra', iau: 'Lyr', tipo: 'constelacion',
    nombres: { la: 'Lyra', es: 'Lira', en: 'Lyra', grc: 'Λύρα' },
    estrellas: [
      { id: 'vega', nombre: 'Vega', bayer: 'α Lyr', hr: 7001, ra: 279.2347, dec: 38.7837, mag: 0.03 },
      { id: 'sulafat', nombre: 'Sulafat', bayer: 'γ Lyr', hr: 7178, ra: 284.7359, dec: 32.6896, mag: 3.24 },
      { id: 'sheliak', nombre: 'Sheliak', bayer: 'β Lyr', hr: 7106, ra: 282.52, dec: 33.3627, mag: 3.45 },
      { id: 'delta2-lyr', nombre: 'δ² Lyr', bayer: 'δ² Lyr', hr: 7139, ra: 283.6262, dec: 36.8986, mag: 4.3 },
      { id: 'zeta1-lyr', nombre: 'ζ¹ Lyr', bayer: 'ζ¹ Lyr', hr: 7056, ra: 281.1931, dec: 37.605, mag: 4.36 },
    ],
    lineas: [[0, 4], [4, 3], [3, 1], [1, 2], [2, 4]],
    mito: {
      figura: { es: 'La lira de Orfeo', en: 'The lyre of Orpheus' },
      heroe: { es: 'Orfeo', en: 'Orpheus' },
      resumen: { es: 'Hermes la hizo con un caparazón de tortuga; con ella, Orfeo conmovió al Hades.', en: 'Hermes made it from a tortoise shell; with it, Orpheus moved Hades himself.' },
      fuentes: ['Himno homérico a Hermes', 'Eratóstenes, Catasterismos 24', 'Ovidio, Metamorfosis X'],
    },
  };

  const lista = (typeof CATALOGO !== 'undefined' && CATALOGO && CATALOGO.constelaciones) || [];
  const liraCatalogo = lista.find((c) => c.id === 'lyra' && c.estrellas.length === 5);
  const LIRA = Object.assign({}, liraCatalogo || LIRA_RESPALDO, {
    frase: { es: 'Hermes la hizo con un caparazón de tortuga; con ella, Orfeo conmovió al Hades.', en: 'Hermes made it from a tortoise shell; with it, Orpheus moved Hades himself.' },
  });

  const ICONOS = {
    loto: '<path d="M12 4c2 2.5 2 6.5 0 9-2-2.5-2-6.5 0-9z"/><path d="M12 13c-3-.5-6-2.5-7-6 3.5 0 6 2 7 6zm0 0c3-.5 6-2.5 7-6-3.5 0-6 2-7 6z"/><path d="M5 17h14"/>',
    luna: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    libro: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/>',
    pluma: '<path d="M19.5 4.5C13 5.5 8 10 6.5 17.5"/><path d="M19.5 4.5c-.5 6-4.5 10.5-11 12.5"/><path d="M6.5 17.5 4 20"/>',
    huellas: '<ellipse cx="8.5" cy="7.5" rx="2.6" ry="4"/><ellipse cx="15.5" cy="13.5" rx="2.6" ry="4"/><path d="M7.3 14h2.4M14.3 20h2.4"/>',
    gota: '<path d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5z"/>',
    pesa: '<path d="M3.5 9v6M6.5 7v10M17.5 7v10M20.5 9v6M6.5 12h11"/>',
    circulo: '<circle cx="12" cy="12" r="7"/>',
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/>',
    nota: '<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>',
    corazon: '<path d="M12 19s-7-4.3-7-9.2A4 4 0 0 1 12 7.5a4 4 0 0 1 7 2.3C19 14.7 12 19 12 19z"/>',
    sol: '<circle cx="12" cy="12" r="3.6"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ICONOS.circulo}</svg>`;

  const habitosLira = () => [
    { nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'loto', encendido: true },
    { nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'luna', encendido: true, auto: 'sueno', valor: 452, meta: 420 },
    { nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'libro', encendido: true },
    { nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pluma', encendido: false },
    { nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'huellas', encendido: false, auto: 'pasos', valor: 6240, meta: 8000 },
  ];

  const POZO = [
    { nombre: { es: 'Meditar 10 min', en: 'Meditate 10 min' }, icono: 'loto' },
    { nombre: { es: 'Leer 20 páginas', en: 'Read 20 pages' }, icono: 'libro' },
    { nombre: { es: '8.000 pasos', en: '8,000 steps' }, icono: 'huellas', auto: 'pasos', valor: 6240, meta: 8000 },
    { nombre: { es: 'Gimnasio', en: 'Gym' }, icono: 'pesa' },
    { nombre: { es: 'Agua 2 L', en: 'Water 2 L' }, icono: 'gota' },
    { nombre: { es: 'Escribir', en: 'Journal' }, icono: 'pluma' },
    { nombre: { es: 'Dormir 7 h', en: 'Sleep 7 h' }, icono: 'luna', auto: 'sueno', valor: 452, meta: 420 },
    { nombre: { es: 'Idiomas 15 min', en: 'Languages 15 min' }, icono: 'globo' },
    { nombre: { es: 'Guitarra', en: 'Guitar' }, icono: 'nota' },
    { nombre: { es: 'Estirar 5 min', en: 'Stretch 5 min' }, icono: 'circulo' },
    { nombre: { es: 'Llamar a mamá', en: 'Call mom' }, icono: 'corazon' },
    { nombre: { es: 'Sol de mañana', en: 'Morning sun' }, icono: 'sol' },
    { nombre: { es: 'Gratitud', en: 'Gratitude' }, icono: 'pluma' },
    { nombre: { es: 'Respirar', en: 'Breathe' }, icono: 'loto' },
    { nombre: { es: 'Caminar', en: 'Walk' }, icono: 'huellas' },
    { nombre: { es: 'Sin pantallas 22 h', en: 'No screens 10 pm' }, icono: 'luna' },
    { nombre: { es: 'Fruta', en: 'Fruit' }, icono: 'circulo' },
    { nombre: { es: 'Ordenar 10 min', en: 'Tidy 10 min' }, icono: 'circulo' },
    { nombre: { es: 'Proteína', en: 'Protein' }, icono: 'pesa' },
    { nombre: { es: 'Dibujar', en: 'Sketch' }, icono: 'pluma' },
  ];

  function habitosDeMentira(n) {
    const encendidos = Math.max(1, Math.round(n * 0.6));
    return Array.from({ length: n }, (_, i) => {
      const base = POZO[i % POZO.length];
      return Object.assign({}, base, { encendido: i < encendidos && !(base.auto && i === encendidos - 1) });
    });
  }

  // Semana de mentira: cantidades del ejemplo de la especificación.
  const SEMANA = [
    { dia: 1, total: 4, hechos: 4 },
    { dia: 2, total: 6, hechos: 4 },
    { dia: 3, total: 5, hoy: true },
    { dia: 4, total: 3, hechos: 0 },
    { dia: 5, total: 7, hechos: 0 },
    { dia: 6, total: 4, hechos: 0 },
    { dia: 0, total: 6, hechos: 0 },
  ];

  function semanaDeMentira() {
    if (!lista.length) return [];
    const usadas = new Set(['lyra']);
    const conLineas = (c) => c.estrellas.length === 1 || c.lineas.length > 0;
    return SEMANA.map((d) => {
      if (d.hoy) return Object.assign({}, d, { datos: LIRA });
      const c = lista.find((x) => x.estrellas.length === d.total && !usadas.has(x.id) && x.tipo === 'constelacion' && conLineas(x))
        || lista.find((x) => x.estrellas.length === d.total && !usadas.has(x.id) && conLineas(x));
      if (!c) return null;
      usadas.add(c.id);
      return Object.assign({}, d, { datos: c });
    }).filter(Boolean);
  }

  const FRASE = {
    texto: { es: 'Nada grande nace de golpe, ni siquiera un racimo de uvas o un higo.', en: 'No great thing is created suddenly, any more than a bunch of grapes or a fig.' },
    autor: { es: 'Epicteto · Disertaciones I.15', en: 'Epictetus · Discourses I.15' },
  };

  // Vibración: navigator.vibrate donde existe (Android). En Safari de iOS 18+ no existe, pero
  // tocar un interruptor nativo hace vibrar al sistema: se usa uno escondido.
  const haptico = (() => {
    let etiqueta = null;
    const preparar = () => {
      if (etiqueta) return etiqueta;
      etiqueta = document.createElement('label');
      etiqueta.setAttribute('aria-hidden', 'true');
      etiqueta.style.cssText = 'position:fixed;left:-200px;top:0;width:1px;height:1px;overflow:hidden;opacity:0';
      const entrada = document.createElement('input');
      entrada.type = 'checkbox';
      entrada.setAttribute('switch', '');
      entrada.tabIndex = -1;
      etiqueta.appendChild(entrada);
      document.body.appendChild(etiqueta);
      return etiqueta;
    };
    return (tipo) => {
      try {
        if (navigator.vibrate) {
          navigator.vibrate(tipo === 'completo' ? [14, 70, 22, 70, 34] : tipo === 'suave' ? 6 : 12);
          return;
        }
        preparar().click();
      } catch (_) { /* sin vibración no pasa nada */ }
    };
  })();

  const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esTactil = window.matchMedia('(pointer: coarse)').matches;
  const tel = document.getElementById('tel');
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let escena;
  try {
    escena = Escena.crear(tel, SHADERS, {
      calidad: 'alta',
      idioma: 'es',
      textos: TEXTOS,
      icono,
      frase: FRASE,
      semana: semanaDeMentira(),
      diaSemana: 3,
      diaMes: 21,
      mes: 9,
      movimientoReducido,
      haptico,
      permitirArrastre: () => !esTactil || tel.classList.contains('inmersivo'),
      alCambiar: () => refrescarControles(),
    });
  } catch (err) {
    const aviso = document.createElement('div');
    aviso.className = 'error-cielo';
    aviso.textContent = 'Este navegador no pudo dibujar el cielo (' + err.message + '). Probá con Safari o Chrome actualizados.';
    tel.appendChild(aviso);
    console.error(err);
    return;
  }

  function cargarLira() {
    escena.ponerConstelacion(LIRA, habitosLira(), { capitulo: { n: 2, total: 6, titulo: { es: 'El regalo de Apolo', en: "Apollo's gift" } } });
  }
  cargarLira();

  function refrescarControles() {
    if (!escena) return;
    $('#b-repetir').disabled = !escena.completo;
    $('#b-salud').disabled = !escena.hayAutoPendiente;
    $('#b-completar').disabled = escena.completo;
    const enUniverso = escena.zona() === 'universo';
    $('#b-zona').textContent = enUniverso ? 'Volver a hoy' : 'Subir a tu universo';
    $$('.barra-inmersiva [data-accion="zona"]').forEach((b) => { b.textContent = enUniverso ? 'Hoy' : 'Universo'; });
  }

  const acciones = {
    salud: () => escena.simularSalud(),
    completar: () => escena.completarDia(),
    repetir: () => escena.repetirAnimacion(),
    reiniciar: () => { cargarLira(); escena.irA('hoy'); },
    zona: () => { escena.irA(escena.zona() === 'universo' ? 'hoy' : 'universo'); },
  };
  $$('[data-accion]').forEach((b) => b.addEventListener('click', () => { acciones[b.dataset.accion](); refrescarControles(); }));

  function segmento(id, alElegir) {
    const cont = document.getElementById(id);
    cont.addEventListener('click', (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      cont.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      alElegir(b.dataset.valor);
    });
  }
  segmento('s-idioma', (v) => { escena.ponerIdioma(v); dibujarCatalogo(); });
  segmento('s-calidad', (v) => escena.ponerCalidad(v));

  const rMusgo = $('#r-musgo');
  let esperaMusgo = 0;
  rMusgo.addEventListener('input', () => {
    $('#o-musgo').textContent = rMusgo.value + '%';
    clearTimeout(esperaMusgo);
    esperaMusgo = setTimeout(() => escena.ponerMusgo(rMusgo.value / 100), 60);
  });

  const bFps = $('#b-fps');
  bFps.addEventListener('click', () => {
    const si = bFps.getAttribute('aria-pressed') !== 'true';
    bFps.setAttribute('aria-pressed', String(si));
    bFps.textContent = si ? 'Ocultar cuadros por segundo' : 'Mostrar cuadros por segundo';
    escena.mostrarFps(si);
  });

  function inmersivo(si) {
    tel.classList.toggle('inmersivo', si);
    document.body.classList.toggle('inmersivo', si);
    escena.redimensionar();
  }
  $('#b-inmersivo').addEventListener('click', () => inmersivo(true));
  $('#salir-inmersivo').addEventListener('click', () => inmersivo(false));
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && tel.classList.contains('inmersivo')) inmersivo(false); });

  // Sin dibujar cuando no se ve: la batería del teléfono también es parte de la experiencia.
  let visible = true;
  new IntersectionObserver((entradas) => {
    visible = entradas[0].isIntersecting;
    escena.pausar(!visible || document.hidden);
  }).observe(tel);
  document.addEventListener('visibilitychange', () => escena.pausar(!visible || document.hidden));

  // ------------------------------------------------------------ catálogo
  const nombreDe = (v) => (v && typeof v === 'object' ? v[idiomaActual()] || v.es : v);
  const idiomaActual = () => (document.querySelector('#s-idioma [aria-pressed="true"]') || {}).dataset?.valor || 'es';

  function miniatura(lienzo, c) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = 132, H = 104;
    lienzo.width = W * dpr;
    lienzo.height = H * dpr;
    const ctx = lienzo.getContext('2d');
    ctx.scale(dpr, dpr);
    const plano = Escena.proyectar(c.estrellas);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const esc = plano.length > 1 ? Math.min((W - 26) / Math.max(x1 - x0, 1e-6), (H - 26) / Math.max(y1 - y0, 1e-6)) : 1;
    const pos = plano.map(([x, y]) => [W / 2 + (x - (x0 + x1) / 2) * esc, H / 2 - (y - (y0 + y1) / 2) * esc]);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(232, 196, 106, 0.55)';
    ctx.lineWidth = 1;
    c.lineas.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); ctx.stroke(); });
    c.estrellas.forEach((s, i) => {
      const r = Math.max(1.1, Math.min(3.6, 3.3 - 0.5 * s.mag));
      ctx.shadowColor = 'rgba(246, 227, 166, 0.9)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fbf2d9';
      ctx.beginPath();
      ctx.arc(pos[i][0], pos[i][1], r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
  }

  function dibujarCatalogo() {
    const cont = $('#lista-catalogo');
    if (!lista.length) {
      cont.innerHTML = '<p class="vacio">El catálogo todavía no está en este armado.</p>';
      return;
    }
    const grupos = new Map();
    lista.forEach((c) => {
      const n = c.estrellas.length;
      const clave = n >= 16 ? 16 : n;
      if (!grupos.has(clave)) grupos.set(clave, []);
      grupos.get(clave).push(c);
    });
    cont.innerHTML = '';
    [...grupos.keys()].sort((a, b) => a - b).forEach((n) => {
      const fila = document.createElement('div');
      fila.className = 'fila-cat';
      const etiquetaN = n >= 16 ? '16+' : String(n);
      fila.innerHTML = `<div class="num">${etiquetaN}<small>${n === 1 ? 'estrella' : 'estrellas'}</small></div><div class="tarjetas-cat"></div>`;
      const carril = fila.querySelector('.tarjetas-cat');
      grupos.get(n).sort((a, b) => a.estrellas.length - b.estrellas.length).forEach((c) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'cat';
        const tipo = c.tipo === 'asterismo' ? 'Asterismo' : c.tipo === 'estrella' ? 'Estrella' : 'Constelación';
        b.innerHTML = `<canvas></canvas><b></b><span></span><span class="tipo"></span>`;
        b.querySelector('b').textContent = nombreDe(c.nombres);
        b.querySelector('span').textContent = nombreDe(c.mito && c.mito.heroe) || '';
        b.querySelector('.tipo').textContent = tipo + (n >= 16 ? ' · ' + c.estrellas.length : '');
        b.title = nombreDe(c.mito && c.mito.resumen) || '';
        miniatura(b.querySelector('canvas'), c);
        b.addEventListener('click', () => {
          const datos = c.id === 'lyra' && c.estrellas.length === 5 ? LIRA : c;
          const habitos = c.id === 'lyra' && c.estrellas.length === 5 ? habitosLira() : habitosDeMentira(c.estrellas.length);
          escena.ponerConstelacion(datos, habitos, { capitulo: { n: 1, total: 5 } });
          escena.irA('hoy');
          refrescarControles();
          if (!tel.classList.contains('inmersivo')) tel.scrollIntoView({ behavior: movimientoReducido ? 'auto' : 'smooth', block: 'center' });
        });
        carril.appendChild(b);
      });
      cont.appendChild(fila);
    });
  }
  dibujarCatalogo();
  refrescarControles();

  // Ganchos para las capturas automáticas (herramientas/capturar-galeria.mjs).
  window.__tocar = (texto) => escena.tocarPorNombre(texto);
  window.__accion = (nombre) => { acciones[nombre](); refrescarControles(); };
  window.__idioma = (v) => document.querySelector(`#s-idioma [data-valor="${v}"]`).click();
  window.__calidad = (v) => document.querySelector(`#s-calidad [data-valor="${v}"]`).click();
})();
