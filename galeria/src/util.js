// Lo que comparten las secciones nuevas de la galería (Inicio, el «+», Progreso, Sueño y Perfil):
// los textos del diccionario, los números en el idioma de la app, los nodos, los íconos de línea y
// una hoja que sube desde abajo.

const Util = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const ICONOS = {
    inicio: '<path d="M4.5 10.5 12 4.5l7.5 6V19a.5.5 0 0 1-.5.5h-4.5V14h-5v5.5H5a.5.5 0 0 1-.5-.5z"/>',
    comida: '<path d="M7 3.5v6.5a2 2 0 0 0 2 2V20.5M5 3.5V9M9 3.5V9"/><path d="M17.5 20.5V3.5c-2.3 1.2-3.5 4-3.5 7.5 0 1.4.9 2.5 2.2 2.5h1.3"/>',
    progreso: '<path d="M4 18.5 9.5 12l3.5 3.5 7-8"/><path d="M15.5 7.5H20V12"/>',
    sueno: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
    habitos: '<circle cx="6" cy="16.5" r="1.6"/><circle cx="11.5" cy="7" r="1.6"/><circle cx="18" cy="12.5" r="1.6"/><path d="m7 15 3.6-6.4M13 8.2l3.7 3.2"/>',
    perfil: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.8 20c.8-3.6 3.6-5.6 7.2-5.6s6.4 2 7.2 5.6"/>',
    mas: '<path d="M12 6v12M6 12h12"/>',
    balanza: '<rect x="4" y="4.5" width="16" height="15" rx="3.5"/><path d="M9 9.5a4 4 0 0 1 6 0M12 9.5l1.4-1.6"/>',
    lupa: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    rayo: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3z"/>',
    gota: '<path d="M12 3.5s5.5 6 5.5 10.2a5.5 5.5 0 0 1-11 0C6.5 9.5 12 3.5 12 3.5z"/>',
    cinta: '<path d="M3.5 9.5h17v5h-17z"/><path d="M7 9.5v2.2M10.5 9.5v3M14 9.5v2.2M17.5 9.5v3"/>',
    reloj: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    guardadas: '<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>',
    atras: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    adelante: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    cerrar: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    listo: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    menos: '<path d="M5 12h14"/>',
    asa: '<path d="M8 8h8M8 12h8M8 16h8"/>',
    huellas: '<ellipse cx="8.5" cy="7.5" rx="2.6" ry="4"/><ellipse cx="15.5" cy="13.5" rx="2.6" ry="4"/><path d="M7.3 14h2.4M14.3 20h2.4"/>',
    corazon: '<path d="M12 19s-7-4.3-7-9.2A4 4 0 0 1 12 7.5a4 4 0 0 1 7 2.3C19 14.7 12 19 12 19z"/>',
    pulmon: '<path d="M12 4v8M12 12c-1.5 1-3 1.2-3 1.2M12 12c1.5 1 3 1.2 3 1.2"/><path d="M8.5 7.5C6 8 4.5 11 4.5 15c0 2.5 1.5 4 3.5 4s2.5-1.5 2.5-4V9"/><path d="M15.5 7.5C18 8 19.5 11 19.5 15c0 2.5-1.5 4-3.5 4s-2.5-1.5-2.5-4V9"/>',
    onda: '<path d="M3 12h3.5l2-5 3.5 10 2.5-7 1.5 2H21"/>',
    reloj3: '<rect x="7" y="3.5" width="10" height="17" rx="3"/><path d="M12 9v3l1.8 1.2"/>',
    telefono: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 17.5h2"/>',
    termometro: '<path d="M10 14.2V5.5a2 2 0 0 1 4 0v8.7a3.8 3.8 0 1 1-4 0z"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8h.01"/>',
    arriba: '<path d="M6 14.5 12 8.5l6 6"/>',
    abajo: '<path d="M6 9.5 12 15.5l6-6"/>',
    candado: '<rect x="6" y="10.5" width="12" height="9" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    objetivo: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 12h.01"/>',
    amigos: '<circle cx="9" cy="9" r="3.2"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8s4.9 1.8 5.5 4.8"/><path d="M15.5 6.2a3 3 0 0 1 0 5.6M17.6 14.6c1.6.6 2.6 2.1 2.9 4.4"/>',
    pesa: '<path d="M3.5 9v6M6.5 7v10M17.5 7v10M20.5 9v6M6.5 12h11"/>',
    estrella: '<path d="m12 4.5 2 5.1 5.4.3-4.2 3.4 1.4 5.2L12 15.6l-4.6 2.9 1.4-5.2-4.2-3.4 5.4-.3z"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || ''}</svg>`;

  function crear(opciones) {
    const idioma = () => opciones.idioma();
    const crudo = (clave) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma()]);
    const tx = (clave, vars) => {
      let s = crudo(clave);
      if (s == null) return clave;
      // La galería es en kilos: los textos del peso llevan la unidad.
      if (typeof s === 'string' && (vars || s.includes('{unidad}'))) {
        const v = { unidad: 'kg', ...vars };
        s = s.replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));
      }
      return s;
    };
    const plural = (clave, n, vars) => {
      const formas = tx(clave);
      return (n === 1 ? formas.uno : formas.otros).replace(/\{(\w+)\}/g, (_, k) => (k === 'n' ? n : vars && vars[k] != null ? vars[k] : ''));
    };
    const local = () => (idioma() === 'es' ? 'es-UY' : 'en-US');
    const numero = (n, dec) => n.toLocaleString(local(), { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    // Con signo de verdad (−), como se escribe un cambio.
    const conSigno = (n, dec) => (n < 0 ? '−' : n > 0 ? '+' : '') + numero(Math.abs(n), dec);
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };
    const boton = (clase, contenido, alTocar, etiqueta) => {
      const b = el('button', clase);
      b.type = 'button';
      b.dataset.toque = '';
      b.innerHTML = contenido;
      if (etiqueta) b.setAttribute('aria-label', etiqueta);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); alTocar(ev); });
      return b;
    };
    // Una fecha «AAAA-MM-DD» como la lee la app: «lunes 26 de octubre».
    const partes = (clave) => { const [a, m, d] = clave.split('-').map(Number); const f = new Date(a, m - 1, d); return { dia: f.getDay(), num: d, mes: m - 1, anio: a }; };
    const fechaLarga = (clave) => { const p = partes(clave); return tx('fecha.larga', { dia: tx('fecha.dias.' + p.dia), num: p.num, mes: tx('fecha.meses.' + p.mes) }); };
    const fechaCorta = (clave) => { const p = partes(clave); return tx('fecha.corta', { num: p.num, mes: tx('fecha.mesesCortos.' + p.mes) }); };
    const horaMin = (min) => `${String(Math.floor(((min % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.round(((min % 60) + 60) % 60)).padStart(2, '0')}`;
    const duracion = (min) => {
      const h = Math.floor(min / 60), m = Math.round(min % 60);
      if (!h) return tx('fecha.minutos', { m });
      return m ? tx('fecha.horasMinutos', { h, m: String(m).padStart(2, '0') }) : tx('fecha.horas', { h });
    };
    return { tx, plural, numero, conSigno, el, boton, icono, partes, fechaLarga, fechaCorta, horaMin, duracion, idioma };
  }

  // Una hoja que sube desde abajo sobre todo lo demás, con su fondo: se cierra tocando afuera o
  // con la cruz. La de registrar comida es otra (comida.js), más grande.
  function hoja(tel, clase, alCerrar) {
    const fondo = document.createElement('div');
    fondo.className = 'hb-fondo';
    fondo.hidden = true;
    const h = document.createElement('section');
    h.className = 'hb ' + clase;
    h.hidden = true;
    h.setAttribute('role', 'dialog');
    h.setAttribute('aria-modal', 'true');
    tel.append(fondo, h);
    [fondo, h].forEach((n) => n.addEventListener('pointerdown', (ev) => ev.stopPropagation()));
    let abierta = false;
    let espera = 0;
    const api = {
      el: h,
      get abierta() { return abierta; },
      abrir() {
        if (abierta) return;
        abierta = true;
        clearTimeout(espera);
        tel.classList.add('hoja-anim', 'con-hoja');
        fondo.hidden = false;
        h.hidden = false;
        h.classList.remove('saliendo');
        setTimeout(() => tel.classList.remove('hoja-anim'), 520);
      },
      // `deUna`: sin animación, cuando otra hoja la reemplaza.
      cerrar(deUna) {
        if (!abierta) return;
        abierta = false;
        if (deUna) {
          h.hidden = true;
          fondo.hidden = true;
        } else {
          tel.classList.add('hoja-anim');
          tel.classList.remove('con-hoja');
          h.classList.add('saliendo');
          espera = setTimeout(() => { if (!abierta) { h.hidden = true; fondo.hidden = true; } tel.classList.remove('hoja-anim'); }, 400);
        }
        if (alCerrar) alCerrar(deUna);
      },
    };
    fondo.addEventListener('click', () => api.cerrar());
    return api;
  }

  return { crear, hoja, icono, ICONOS, SVG };
})();
