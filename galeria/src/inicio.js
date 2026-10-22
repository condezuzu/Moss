// Inicio: lo primero que se ve, hecho de bloques que cada uno elige y ordena (spec/especificacion.md,
// cambio 9). De fábrica: las calorías y los macros que quedan, el progreso al objetivo, el peso con
// el balance y el día en el cielo. El sueño de anoche y el agua están para sumarlos. Tocar un
// bloque lleva a su sección.

const SeccionInicio = (() => {
  const BLOQUES = ['calorias', 'objetivo', 'peso', 'cielo', 'sueno', 'agua'];
  const DE_FABRICA = ['calorias', 'objetivo', 'peso', 'cielo'];
  // Lo elegido queda en este navegador, como quedaría en el teléfono.
  const GUARDADO = 'moss-galeria-inicio';

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, conSigno, el, boton, icono } = u;
    const s = { orden: [...BLOQUES], visibles: new Set(DE_FABRICA) };
    try {
      const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
      if (g && Array.isArray(g.orden)) { s.orden = [...g.orden.filter((b) => BLOQUES.includes(b)), ...BLOQUES.filter((b) => !g.orden.includes(b))]; s.visibles = new Set(g.visibles); }
    } catch (_) { /* sin guardado, lo de fábrica */ }
    const guardar = () => { try { localStorage.setItem(GUARDADO, JSON.stringify({ orden: s.orden, visibles: [...s.visibles] })); } catch (_) { /* no pasa nada */ } };

    const zona = el('section', 'inicio pagina-app');
    zona.innerHTML = '<div class="in-scroll"><header class="in-cab"><div class="in-fecha"></div><h2 class="in-titulo"></h2></header><div class="in-bloques"></div><div class="in-pie"></div></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const bloquesEl = zona.querySelector('.in-bloques');
    const luna = Luna.crear({ tam: 124, clase: 'in-luna' });

    const carta = (clase, titulo, irA) => {
      const c = el('article', 'in-bloque ' + clase);
      if (irA != null) {
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.addEventListener('click', () => opciones.ir(irA));
      }
      if (titulo) {
        const cab = el('header', 'in-bloque-cab');
        cab.appendChild(el('span', 'in-bloque-titulo', titulo));
        c.appendChild(cab);
      }
      return c;
    };

    // ------------------------------------------------------------ calorías y macros: lo que queda
    function calorias(ms) {
      const c = carta('in-calorias', null, 1);
      const meta = opciones.comida.meta;
      const t = opciones.comida.totalDe(0);
      const queda = meta.kcal - t.kcal;
      const arriba = el('div', 'in-cal-arriba');
      const cifra = el('div', 'in-cal-cifra');
      cifra.append(el('span', 'in-cal-etq', tx(queda >= 0 ? 'inicio.teQuedan' : 'inicio.deMas')), el('b', null, numero(Math.abs(Math.round(queda)))),
        el('small', null, tx('inicio.kcalDe', { comido: numero(Math.round(t.kcal)), meta: numero(meta.kcal) })));
      arriba.append(luna.el, cifra);
      luna.ir(t.kcal / meta.kcal, ms);
      const macros = el('div', 'in-macros');
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => {
        const estado = Metas.estadoDeMacro(t[m], meta[m]);
        const x = el('div', `in-macro in-macro-${m} ${estado}`);
        const resto = meta[m] - t[m];
        const valor = estado === 'falta' ? tx('inicio.gramos', { n: numero(Math.round(resto)) })
          : estado === 'pasado' ? tx('inicio.gramos', { n: '+' + numero(Math.round(-resto)) }) : tx('inicio.listo');
        const barra = el('i', 'in-macro-barra');
        const relleno = el('i');
        barra.appendChild(relleno);
        x.append(el('span', 'in-macro-nombre', tx('comida.' + clave)), el('b', null, valor), el('small', null, tx('inicio.deMeta', { comido: numero(Math.round(t[m])), meta: numero(meta[m]) })), barra);
        requestAnimationFrame(() => { relleno.style.width = `${Math.min(100, (t[m] / meta[m]) * 100).toFixed(1)}%`; });
        macros.appendChild(x);
      });
      c.append(arriba, macros);
      return c;
    }

    // ------------------------------------------------------------ el progreso al objetivo
    function objetivo() {
      const d = opciones.persona();
      const p = d.progreso;
      const c = carta('in-objetivo', tx('inicio.bloques.objetivo'), 2);
      c.querySelector('header').appendChild(el('em', 'in-estado ' + p.estado, tx('progreso.estados.' + p.estado)));
      const fila = el('div', 'in-obj-fila');
      const metaKg = d.perfil.pesoMeta;
      if (p.fecha) fila.append(el('b', null, u.fechaCorta(p.fecha)), el('span', null, tx('inicio.llegarias', { kg: numero(metaKg, metaKg % 1 ? 1 : 0), unidad: 'kg' })));
      else if (p.estado === 'llegaste') fila.append(el('b', null, `${numero(metaKg, metaKg % 1 ? 1 : 0)} kg`), el('span', null, tx('inicio.yaLlegaste')));
      else fila.append(el('b', null, p.peso == null ? '—' : `${numero(p.peso, 1)} kg`), el('span', null, tx('inicio.tendencia')));
      c.appendChild(fila);
      if (p.hecho != null) c.appendChild(barraDelCamino(d.pesoInicial, p.peso, metaKg, p.hecho));
      if (p.ritmo != null) c.appendChild(el('p', 'in-nota', tx('inicio.ritmo', { ritmo: conSigno(p.ritmo, 2), plan: conSigno(p.ritmoPlan, 2), unidad: 'kg' })));
      return c;
    }

    // La barra del camino: de dónde se empezó a la meta, con el peso de hoy marcado.
    function barraDelCamino(desde, ahora, hasta, hecho) {
      const b = el('div', 'in-camino');
      const pista = el('div', 'in-camino-pista');
      const relleno = el('i');
      const marca = el('span', 'in-camino-marca');
      pista.append(relleno, marca);
      const pct = (hecho * 100).toFixed(1) + '%';
      requestAnimationFrame(() => { relleno.style.width = pct; marca.style.left = pct; });
      const etiquetas = el('div', 'in-camino-etq');
      etiquetas.append(el('span', null, numero(desde, 1)), el('span', 'ahora', numero(ahora, 1)), el('span', null, numero(hasta, hasta % 1 ? 1 : 0)));
      b.append(pista, etiquetas);
      return b;
    }

    // ------------------------------------------------------------ el peso y el balance
    function peso() {
      const d = opciones.persona();
      const c = carta('in-peso', tx('inicio.bloques.peso'), 2);
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, d.pesoHoy == null ? '—' : numero(d.pesoHoy, 1)), el('small', null, ' kg'));
      izq.append(cifra, el('span', null, d.cambio7 == null ? tx('inicio.tendencia') : tx('inicio.enSieteDias', { n: conSigno(d.cambio7, 1), unidad: 'kg' })));
      fila.append(izq, Graficos.linea(d.serie30, { clase: 'in-chispa', ancho: 150, alto: 44 }));
      const fila2 = el('div', 'in-fila');
      const izq2 = el('div', 'in-dato');
      const cifra2 = el('div', 'in-dato-cifra');
      const bal = d.balance.promedio;
      cifra2.append(el('b', null, bal == null ? '—' : conSigno(Math.round(bal))), el('small', null, ' ' + tx('inicio.kcalPorDia')));
      izq2.append(cifra2, el('span', null, tx('inicio.balanceTexto', { gasto: numero(d.gasto) })));
      fila2.append(izq2, Graficos.balance(d.balance.dias, d.gasto, { ancho: 150, alto: 44 }));
      c.append(fila, fila2);
      return c;
    }

    // ------------------------------------------------------------ el día en el cielo
    // La constelación de hoy en chico, con lo encendido, y lo que llega solo de Salud.
    function cielo() {
      const { constelacion, habitos } = opciones.cielo();
      const c = carta('in-cielo', tx('inicio.bloques.cielo'), 4);
      const hechos = habitos.filter((h) => h.encendido).length;
      c.querySelector('header').appendChild(el('em', 'in-cuenta', tx('inicio.encendidas', { n: hechos, total: habitos.length })));
      const lienzo = el('canvas', 'in-mini-cielo');
      c.appendChild(lienzo);
      requestAnimationFrame(() => dibujarConstelacion(lienzo, constelacion, habitos));
      const datos = el('div', 'in-cielo-datos');
      habitos.filter((h) => h.auto).forEach((h) => {
        const dato = el('span', 'in-chip' + (h.encendido ? ' hecho' : ''));
        dato.innerHTML = icono(h.auto === 'sueno' ? 'sueno' : 'huellas');
        dato.append(h.auto === 'sueno' ? tx('inicio.dormiste', { h: u.duracion(h.valor) }) : tx('inicio.pasos', { n: numero(h.valor) }));
        datos.appendChild(dato);
      });
      c.appendChild(datos);
      return c;
    }

    function dibujarConstelacion(lienzo, c, habitos) {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      const W = lienzo.clientWidth || 300, H = lienzo.clientHeight || 120;
      lienzo.width = Math.round(W * dpr);
      lienzo.height = Math.round(H * dpr);
      const ctx = lienzo.getContext('2d');
      ctx.scale(dpr, dpr);
      const plano = Escena.proyectar(c.estrellas);
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
      const esc = Math.min((W - 60) / Math.max(x1 - x0, 1e-6), (H - 30) / Math.max(y1 - y0, 1e-6));
      const pos = plano.map(([x, y]) => [W / 2 + (x - (x0 + x1) / 2) * esc, H / 2 - (y - (y0 + y1) / 2) * esc]);
      // Unas estrellas de fondo, quietas.
      const r = Datos.azar(17);
      for (let i = 0; i < 70; i++) {
        ctx.fillStyle = `rgba(239, 230, 207, ${(0.08 + r() * 0.22).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(r() * W, r() * H, 0.3 + r() * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      const completo = habitos.every((h) => h.encendido);
      ctx.lineCap = 'round';
      ctx.strokeStyle = completo ? 'rgba(232, 196, 106, 0.7)' : 'rgba(232, 196, 106, 0.22)';
      ctx.lineWidth = 1;
      c.lineas.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); ctx.stroke(); });
      c.estrellas.forEach((st, i) => {
        const h = habitos[i];
        const encendida = h && h.encendido;
        const radio = Math.max(1.4, Math.min(3.4, 3.2 - 0.45 * st.mag));
        if (encendida) {
          const g = ctx.createRadialGradient(pos[i][0], pos[i][1], 0, pos[i][0], pos[i][1], radio * 5);
          g.addColorStop(0, 'rgba(246, 227, 166, 0.55)');
          g.addColorStop(1, 'rgba(246, 227, 166, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio * 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbf2d9';
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = 'rgba(239, 230, 207, 0.4)';
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.arc(pos[i][0], pos[i][1], radio + 0.6, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }

    // ------------------------------------------------------------ el sueño de anoche
    function sueno() {
      const n = opciones.sueno();
      const c = carta('in-sueno', tx('inicio.bloques.sueno'), 3);
      if (!n) { c.appendChild(el('p', 'in-nota', tx('sueno.sinNoche'))); return c; }
      if (n.calidad != null) c.querySelector('header').appendChild(el('em', 'in-cuenta', tx('inicio.calidad', { n: n.calidad })));
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, u.duracion(n.dormido)));
      izq.append(cifra, el('span', null, tx('inicio.horario', { desde: u.horaMin(n.dormirse), hasta: u.horaMin(n.despertar) })));
      fila.append(izq, Graficos.hipnograma(n, { ancho: 150, alto: 44 }));
      c.appendChild(fila);
      return c;
    }

    // ------------------------------------------------------------ el agua
    function agua() {
      const a = opciones.comida.agua();
      const c = carta('in-agua', tx('inicio.bloques.agua'));
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, Porciones.decimal(a.litros, u.idioma())), el('small', null, ' ' + tx('inicio.deLitros', { meta: Porciones.decimal(a.meta, u.idioma()) })));
      izq.appendChild(cifra);
      const vasos = el('div', 'in-vasos');
      for (let i = 0; i < Math.max(a.vasosMeta, a.vasos); i++) vasos.appendChild(el('i', i < a.vasos ? 'lleno' : null));
      const mas = boton('in-agua-mas', icono('mas'), () => { opciones.comida.sumarAgua(); }, tx('mas.sumarVaso'));
      fila.append(izq, vasos, mas);
      c.appendChild(fila);
      return c;
    }

    const ARMAR = { calorias, objetivo, peso, cielo, sueno, agua };

    function pintar(ms) {
      const hoy = u.partes(Datos.HOY);
      zona.querySelector('.in-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) });
      zona.querySelector('.in-titulo').textContent = tx('inicio.titulo');
      bloquesEl.innerHTML = '';
      s.orden.filter((b) => s.visibles.has(b)).forEach((b) => bloquesEl.appendChild(ARMAR[b](ms)));
      const pie = zona.querySelector('.in-pie');
      pie.innerHTML = '';
      pie.appendChild(boton('in-personalizar', `${icono('asa')}<span>${tx('inicio.personalizar')}</span>`, () => abrirPersonalizar()));
    }

    // ------------------------------------------------------------ personalizar
    // Una hoja con los bloques: la llave muestra u oculta, y se ordenan arrastrando de la manija.
    const hoja = Util.hoja(tel, 'in-hoja', () => opciones.alCambiar());
    function abrirPersonalizar() {
      pintarHoja();
      hoja.abrir();
      opciones.alCambiar();
    }
    function pintarHoja() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('inicio.personalizarTitulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      h.append(cab, el('p', 'hb-texto', tx('inicio.personalizarTexto')));
      const lista = el('ul', 'in-lista');
      s.orden.forEach((b) => {
        const li = el('li', 'in-fila-orden');
        li.dataset.bloque = b;
        const asa = el('span', 'in-asa');
        asa.innerHTML = icono('asa');
        asa.setAttribute('aria-label', tx('inicio.mover'));
        const llave = boton('in-llave', '<i></i>', () => {
          if (s.visibles.has(b)) s.visibles.delete(b); else s.visibles.add(b);
          llave.setAttribute('aria-pressed', String(s.visibles.has(b)));
          guardar();
          pintar(0);
        }, tx('inicio.bloques.' + b));
        llave.setAttribute('aria-pressed', String(s.visibles.has(b)));
        li.append(asa, el('span', 'in-fila-nombre', tx('inicio.bloques.' + b)), llave);
        arrastrable(li, asa, lista);
        lista.appendChild(li);
      });
      h.appendChild(lista);
      h.appendChild(el('p', 'hb-nota', tx('inicio.personalizarNota')));
    }

    // Arrastrar de la manija: la fila sigue al dedo y las otras le hacen lugar.
    function arrastrable(li, asa, lista) {
      asa.addEventListener('pointerdown', (ev) => {
        ev.preventDefault();
        const filas = [...lista.children];
        const alto = li.offsetHeight;
        const y0 = ev.clientY;
        const desde = filas.indexOf(li);
        let hasta = desde;
        li.classList.add('moviendo');
        try { asa.setPointerCapture(ev.pointerId); } catch (_) { /* igual anda */ }
        const mover = (e) => {
          const dy = e.clientY - y0;
          li.style.translate = `0 ${dy}px`;
          hasta = Math.max(0, Math.min(filas.length - 1, desde + Math.round(dy / alto)));
          filas.forEach((f, i) => {
            if (f === li) return;
            const corre = desde < hasta ? i > desde && i <= hasta ? -alto : 0 : i < desde && i >= hasta ? alto : 0;
            f.style.translate = `0 ${corre}px`;
          });
        };
        const soltar = () => {
          asa.removeEventListener('pointermove', mover);
          filas.forEach((f) => { f.style.translate = ''; });
          li.classList.remove('moviendo');
          if (hasta !== desde) {
            const b = s.orden.splice(desde, 1)[0];
            s.orden.splice(hasta, 0, b);
            guardar();
            pintar(0);
            pintarHoja();
          }
        };
        asa.addEventListener('pointermove', mover);
        asa.addEventListener('pointerup', soltar, { once: true });
        asa.addEventListener('pointercancel', soltar, { once: true });
      });
    }

    pintar(0);
    return {
      zona,
      pintar,
      get editando() { return hoja.abierta; },
      cerrar() { hoja.cerrar(); },
      // Para las capturas y los botones de la galería.
      personalizar: abrirPersonalizar,
      poner(bloque, si) { if (si) s.visibles.add(bloque); else s.visibles.delete(bloque); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      mover(bloque, a) { const i = s.orden.indexOf(bloque); s.orden.splice(i, 1); s.orden.splice(a, 0, bloque); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      deFabrica() { s.orden = [...BLOQUES]; s.visibles = new Set(DE_FABRICA); guardar(); pintar(0); if (hoja.abierta) pintarHoja(); },
      bajar() { zona.querySelector('.in-scroll').scrollTo(0, 99999); },
      subir() { zona.querySelector('.in-scroll').scrollTo(0, 0); },
    };
  }

  return { crear };
})();

// Los gráficos chicos de las secciones nuevas: una línea con su tendencia, el balance de la semana
// y el hipnograma de una noche. SVG con los colores de la galería.
const Graficos = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const svg = (ancho, alto, clase, html) => {
    const n = document.createElementNS(SVG, 'svg');
    n.setAttribute('viewBox', `0 0 ${ancho} ${alto}`);
    n.setAttribute('class', 'gr ' + (clase || ''));
    n.setAttribute('aria-hidden', 'true');
    n.innerHTML = html;
    return n;
  };

  // Puntos (lo de cada día) y una línea (la tendencia): [{ x, punto, linea }], x de 0 a 1.
  function linea(serie, { ancho = 300, alto = 70, clase, meta } = {}) {
    const m = 4;
    const valores = serie.flatMap((p) => [p.punto, p.linea]).filter((v) => v != null).concat(meta != null ? [meta] : []);
    const min = Math.min(...valores) - 0.1, max = Math.max(...valores) + 0.1;
    const X = (x) => m + x * (ancho - 2 * m);
    const Y = (v) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
    const conLinea = serie.filter((p) => p.linea != null);
    const camino = conLinea.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.linea).toFixed(1)}`).join(' ');
    const area = conLinea.length ? `${camino} L${X(conLinea[conLinea.length - 1].x).toFixed(1)} ${alto} L${X(conLinea[0].x).toFixed(1)} ${alto} Z` : '';
    const puntos = serie.filter((p) => p.punto != null).map((p) => `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.punto).toFixed(1)}" r="1.5" class="gr-punto"/>`).join('');
    const ultimo = conLinea[conLinea.length - 1];
    const id = 'g' + Math.random().toString(36).slice(2, 8);
    const lineaMeta = meta != null && meta > min && meta < max ? `<line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-meta"/>` : '';
    return svg(ancho, alto, clase, `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3a6" stop-opacity="0.18"/><stop offset="1" stop-color="#f6e3a6" stop-opacity="0"/></linearGradient></defs>
      ${lineaMeta}<path d="${area}" fill="url(#${id})" stroke="none"/>${puntos}<path d="${camino}" class="gr-linea"/>
      ${ultimo ? `<circle cx="${X(ultimo.x).toFixed(1)}" cy="${Y(ultimo.linea).toFixed(1)}" r="2.6" class="gr-fin"/>` : ''}`);
  }

  // Lo comido de cada día contra el gasto (la línea): debajo es déficit; arriba, de más.
  function balance(dias, gasto, { ancho = 300, alto = 70, clase } = {}) {
    const m = 3;
    if (!dias.length) return svg(ancho, alto, clase, '');
    const max = Math.max(gasto * 1.15, ...dias.map((d) => d.kcal));
    const Y = (v) => alto - m - (v / max) * (alto - 2 * m);
    const paso = (ancho - 2 * m) / 7;
    const barras = dias.map((d, i) => {
      const x = m + (7 - dias.length + i) * paso + paso * 0.28;
      return `<rect x="${x.toFixed(1)}" y="${Y(d.kcal).toFixed(1)}" width="${(paso * 0.44).toFixed(1)}" height="${(alto - m - Y(d.kcal)).toFixed(1)}" rx="1.6" class="${d.kcal > gasto ? 'gr-barra arriba' : 'gr-barra'}"/>`;
    }).join('');
    return svg(ancho, alto, 'gr-balance ' + (clase || ''), `${barras}<line x1="${m}" x2="${ancho - m}" y1="${Y(gasto).toFixed(1)}" y2="${Y(gasto).toFixed(1)}" class="gr-gasto"/>`);
  }

  // Las etapas de una noche en el tiempo: despierto arriba y profundo abajo, como la app Salud.
  const FILAS = { despierto: 0, rem: 1, nucleo: 2, profundo: 3, dormido: 2 };
  function hipnograma(noche, { ancho = 300, alto = 90, clase, etiquetas } = {}) {
    const inicio = noche.enCamaDesde, fin = noche.enCamaHasta;
    const X = (min) => ((min - inicio) / Math.max(1, fin - inicio)) * ancho;
    const alturaFila = alto / 4;
    const tramos = noche.tramos.map((t) => {
      const fila = FILAS[t.etapa];
      return `<rect x="${X(t.desde).toFixed(2)}" y="${(fila * alturaFila + 1).toFixed(1)}" width="${Math.max(0.6, X(t.hasta) - X(t.desde)).toFixed(2)}" height="${(alturaFila - 2).toFixed(1)}" rx="1.4" class="gr-etapa gr-${t.etapa}"/>`;
    }).join('');
    const guias = etiquetas ? [0, 1, 2, 3].map((i) => `<line x1="0" x2="${ancho}" y1="${(i * alturaFila + alturaFila / 2).toFixed(1)}" y2="${(i * alturaFila + alturaFila / 2).toFixed(1)}" class="gr-guia"/>`).join('') : '';
    return svg(ancho, alto, 'gr-hipno ' + (clase || ''), guias + tramos);
  }

  return { linea, balance, hipnograma };
})();
