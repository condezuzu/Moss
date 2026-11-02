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
    // `primerDia`: recién instalada, sin nada anotado (la maqueta del 29/10/2026).
    const s = { orden: [...BLOQUES], visibles: new Set(DE_FABRICA), primerDia: false };
    try {
      const g = JSON.parse(localStorage.getItem(GUARDADO) || 'null');
      if (g && Array.isArray(g.orden)) { s.orden = [...g.orden.filter((b) => BLOQUES.includes(b)), ...BLOQUES.filter((b) => !g.orden.includes(b))]; s.visibles = new Set(g.visibles); }
    } catch (_) { /* sin guardado, lo de fábrica */ }
    const guardar = () => { try { localStorage.setItem(GUARDADO, JSON.stringify({ orden: s.orden, visibles: [...s.visibles] })); } catch (_) { /* no pasa nada */ } };

    const zona = el('section', 'inicio pagina-app');
    zona.innerHTML = '<div class="in-scroll"><header class="in-cab"><div class="in-fecha"></div><h2 class="in-titulo"></h2><p class="in-saludo" aria-live="polite"></p></header><div class="in-bloques"></div><div class="in-pie"></div></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const bloquesEl = zona.querySelector('.in-bloques');
    // La figura de las kcal, en el estilo elegido (kcal.js). Se rehace solo al cambiar de estilo, así
    // anima de lo que mostraba a lo nuevo.
    let figura = null;
    let estiloDeLaFigura = null;
    const figuraDeKcal = () => {
      if (estiloDeLaFigura !== Kcal.estilo) {
        figura = Kcal.grande((n) => tx('comida.porcentaje', { n: numero(n) }));
        estiloDeLaFigura = Kcal.estilo;
      }
      return figura;
    };

    // `irA`: la sección a la que lleva, o qué hace al tocarlo.
    const carta = (clase, titulo, irA) => {
      const c = el('article', 'in-bloque ' + clase);
      if (irA != null) {
        c.tabIndex = 0;
        c.setAttribute('role', 'button');
        c.addEventListener('click', () => (typeof irA === 'function' ? irA() : opciones.ir(irA)));
      }
      if (titulo) {
        const cab = el('header', 'in-bloque-cab');
        cab.appendChild(el('span', 'in-bloque-titulo', titulo));
        c.appendChild(cab);
      }
      return c;
    };

    // Lo que quedaba la última vez que se pintó: al anotar, la cifra cuenta desde ahí (como la de
    // Comida, y la de la app: src/secciones/animados.tsx). Con Reducir movimiento, va directo.
    let quedaAntes = null;
    const quieto = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function cifraQueCuenta(hasta) {
      const b = el('b', null, numero(quedaAntes == null || quieto() ? hasta : quedaAntes));
      const desde = quedaAntes;
      quedaAntes = hasta;
      if (desde == null || desde === hasta || quieto()) return b;
      const t0 = performance.now();
      const paso = (ahora) => {
        const k = Math.min(1, (ahora - t0) / 480);
        b.textContent = numero(Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - k, 3))));
        if (k < 1 && b.isConnected) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
      return b;
    }

    // Cada barra arranca donde estaba la vez anterior (al sumar un vaso, los macros no vuelven a cero)
    // y la primera vez, de cero: como en la app, que se llena al aparecer y después solo se corre.
    const anchosAntes = new Map();
    function llenar(nodo, clave, valor, prop = 'width') {
      const antes = anchosAntes.get(clave + prop);
      if (antes != null) nodo.style[prop] = antes;
      anchosAntes.set(clave + prop, valor);
      requestAnimationFrame(() => { nodo.style[prop] = valor; });
    }

    // ------------------------------------------------------------ calorías y macros: lo que queda
    function calorias(ms) {
      const c = carta('in-calorias', null, abrirTodo);
      const meta = opciones.comida.meta;
      const t = opciones.comida.totalDe(0);
      const queda = meta.kcal - t.kcal;
      const f = figuraDeKcal();
      c.classList.add('con-' + Kcal.estilo);
      const arriba = el('div', 'in-cal-arriba');
      const cifra = el('div', 'in-cal-cifra');
      cifra.append(el('span', 'in-cal-etq', tx(queda >= 0 ? 'inicio.teQuedan' : 'inicio.deMas')), cifraQueCuenta(Math.abs(Math.round(queda))),
        el('small', null, tx('inicio.kcalDe', { comido: numero(Math.round(t.kcal)), meta: numero(meta.kcal) })));
      // La barra va debajo de la cifra; las otras, al lado o alrededor.
      if (Kcal.estilo === 'barra') arriba.append(cifra, f.el);
      else arriba.append(f.el, cifra);
      f.ir(t.kcal / meta.kcal, ms, opciones.comida.porComida(0));
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
        // Lo comido y la meta siempre a la vista: también al pasarse.
        x.append(el('span', 'in-macro-nombre', tx('comida.' + clave)), el('b', null, valor), barra, el('small', null, tx('comida.gramosDe', { n: numero(Math.round(t[m])), meta: numero(meta[m]) })));
        llenar(relleno, 'macro-' + m, `${Math.min(100, (t[m] / meta[m]) * 100).toFixed(1)}%`);
        macros.appendChild(x);
      });
      c.append(arriba, macros);
      Util.caber([...macros.querySelectorAll('.in-macro-nombre')], 12);
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
      llenar(relleno, 'camino', pct);
      llenar(marca, 'camino', pct, 'left');
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
      // Sin días todavía, solo lo que falta: una raya y «kcal por día» no dicen nada.
      if (d.balance.dias.length) izq2.append(cifra2, el('span', null, u.plural('inicio.balanceCorto', d.balance.dias.length)));
      else izq2.append(el('span', null, tx('progreso.sinBalance')));
      fila2.append(izq2, Graficos.balance(d.balance.dias, d.gasto, { ancho: 150, alto: 44 }));
      c.append(fila, fila2);
      return c;
    }

    // ------------------------------------------------------------ el día en el cielo
    // La constelación de hoy en chico, con lo encendido: lo que llega de Salud está en Sueño y en Hábitos.
    function cielo() {
      const { constelacion, habitos } = opciones.cielo();
      const c = carta('in-cielo', tx('inicio.bloques.cielo'), 4);
      const hechos = habitos.filter((h) => h.encendido).length;
      c.querySelector('header').appendChild(el('em', 'in-cuenta', tx('inicio.encendidas', { n: hechos, total: habitos.length })));
      const lienzo = el('canvas', 'in-mini-cielo');
      c.appendChild(lienzo);
      requestAnimationFrame(() => dibujarConstelacion(lienzo, constelacion, habitos));
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
    let vasosAntes = null;
    function agua() {
      const a = opciones.comida.agua();
      const c = carta('in-agua', tx('inicio.bloques.agua'));
      const fila = el('div', 'in-fila');
      const izq = el('div', 'in-dato');
      const cifra = el('div', 'in-dato-cifra');
      cifra.append(el('b', null, Porciones.decimal(a.litros, u.idioma())), el('small', null, ' ' + tx('inicio.deLitros', { meta: Porciones.decimal(a.meta, u.idioma()) })));
      izq.appendChild(cifra);
      const vasos = el('div', 'in-vasos');
      // El que se acaba de sumar se llena con un fundido; los demás ya estaban.
      for (let i = 0; i < Math.max(a.vasosMeta, a.vasos); i++) vasos.appendChild(el('i', i < a.vasos ? (vasosAntes != null && i >= vasosAntes ? 'lleno nuevo' : 'lleno') : null));
      vasosAntes = a.vasos;
      const mas = boton('in-agua-mas', icono('mas'), () => { opciones.comida.sumarAgua(); }, tx('mas.sumarVaso'));
      fila.append(izq, vasos, mas);
      c.appendChild(fila);
      return c;
    }

    const ARMAR = { calorias, objetivo, peso, cielo, sueno, agua };

    // ------------------------------------------------------------ todo lo de hoy
    // Tocar la luna (lo pediste el 30/10/2026): lo de hoy con lo que falta, lo que Moss sabe de ti y de
    // dónde, lo que le falta y, abajo de todo, cómo lo estima. Saberlo da seguridad.
    const hojaTodo = Util.hoja(tel, 'in-todo', () => opciones.alCambiar());
    function abrirTodo() {
      pintarTodo();
      hojaTodo.abrir();
      opciones.alCambiar();
    }
    const enLista = (cosas) => {
      const y = u.idioma() === 'es' ? ' y ' : ' and ';
      return cosas.length < 2 ? cosas.join('') : `${cosas.slice(0, -1).join(', ')}${y}${cosas[cosas.length - 1]}`;
    };
    function filaDeHoy(nombre, comido, meta, unidad, clase) {
      const estado = Metas.estadoDeMacro(comido, meta);
      const resto = meta - comido;
      const fila = el('div', 'tt-fila ' + (clase || ''));
      const cuanto = (n) => `${numero(Math.round(n))}${unidad}`;
      fila.append(el('span', 'tt-nombre', nombre), el('b', null, cuanto(comido)), el('span', null, cuanto(meta)),
        el('em', estado, estado === 'falta' ? cuanto(resto) : estado === 'pasado' ? `+${cuanto(-resto)}` : '✓'));
      return fila;
    }
    function pintarTodo() {
      const h = hojaTodo.el;
      h.innerHTML = '';
      const d = opciones.persona();
      const p = d.perfil;
      const meta = opciones.comida.meta;
      const t = opciones.comida.totalDe(0);
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('inicio.todo.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaTodo.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'tt-cuerpo');

      // Hoy: lo comido, la meta y lo que falta o se pasó.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.hoy')));
      const tabla = el('div', 'tt-tabla');
      const cabeza = el('div', 'tt-fila tt-cabeza');
      cabeza.append(el('span'), el('span', null, tx('inicio.todo.comiste')), el('span', null, tx('inicio.todo.meta')), el('span', null, tx('inicio.todo.queda')));
      tabla.append(cabeza, filaDeHoy(tx('inicio.todo.calorias'), t.kcal, meta.kcal, '', 'tt-kcal'));
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave]) => tabla.appendChild(filaDeHoy(tx('comida.' + clave), t[m], meta[m], ' g', 'tt-' + m)));
      cuerpo.appendChild(tabla);
      const macro = (m, clave, n) => tx('inicio.todo.deMacro', { n: numero(Math.round(n)), macro: tx('comida.' + clave).toLowerCase() });
      const macros = [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].map(([m, clave]) => ({ m, clave, estado: Metas.estadoDeMacro(t[m], meta[m]), resto: meta[m] - t[m] }));
      const faltan = macros.filter((x) => x.estado === 'falta').map((x) => macro(x.m, x.clave, x.resto));
      const pasados = macros.filter((x) => x.estado === 'pasado').map((x) => macro(x.m, x.clave, -x.resto));
      const frases = [];
      if (faltan.length) frases.push(tx('inicio.todo.teFaltan', { lista: enLista(faltan) }));
      if (pasados.length) frases.push(tx('inicio.todo.tePasaste', { lista: enLista(pasados) }));
      if (!faltan.length && !pasados.length) frases.push(tx('inicio.todo.llegaste'));
      const sinAnotar = opciones.comida.sinAnotar();
      if (sinAnotar.length) frases.push(tx('inicio.todo.sinAnotar', { lista: enLista(sinAnotar.map((c) => tx('comida.comidas.' + c).toLowerCase())) }));
      cuerpo.appendChild(el('p', 'tt-frase', frases.join(' ')));
      cuerpo.appendChild(boton('cm-enlace tt-enlace', `<span>${tx('inicio.todo.verComida')}</span>${icono('adelante')}`, () => { hojaTodo.cerrar(); opciones.ir(1); }));

      // Lo que Moss sabe de ti, y de dónde lo sacó.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.sabe')));
      const sabe = el('ul', 'pf-lista tt-sabe');
      const dato = (nombre, valor, origen) => {
        const li = el('li');
        const textos = el('div');
        textos.append(el('span', null, nombre), el('small', null, origen));
        li.append(textos, el('b', null, valor));
        sabe.appendChild(li);
      };
      const edad = Number(Datos.HOY.slice(0, 4)) - p.nacimiento;
      dato(tx('inicio.todo.peso'), `${numero(d.pesoHoy, 1)} kg`, tx('inicio.todo.origen.pesadas'));
      dato(tx('perfil.altura'), `${numero(p.alturaCm)} cm`, tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.edad'), numero(edad), tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.sexo'), tx(p.sexo === 'f' ? 'entrada.cuestionario.femenino' : 'entrada.cuestionario.masculino'), tx('inicio.todo.origen.dijiste'));
      dato(tx('perfil.actividad'), tx('entrada.cuestionario.actividad.' + p.actividad)[0], tx('inicio.todo.origen.dijiste'));
      const pct = p.objetivo === 'mantener' ? null : Math.abs(Metas.RITMOS[p.objetivo][p.ritmo]);
      dato(tx('progreso.objetivo'), p.objetivo === 'mantener' ? tx('progreso.objetivos.mantener') : tx('progreso.objetivoA.' + p.objetivo, { kg: numero(p.pesoMeta, p.pesoMeta % 1 ? 1 : 0) }), pct == null ? tx('inicio.todo.origen.elegiste') : tx('inicio.todo.origen.ritmo', { pct: numero(pct, 2) }));
      dato(tx('progreso.gasto'), `${numero(d.gasto)} ${tx('inicio.kcalPorDia')}`, tx('inicio.todo.origen.control', { fecha: u.fechaCorta(d.control.fecha) }));
      if (d.grasa) dato(tx('progreso.grasa'), tx('cuerpo.rango', { desde: d.grasa.desde, hasta: d.grasa.hasta }), tx('inicio.todo.origen.medidas'));
      const noche = opciones.sueno();
      if (noche) dato(tx('inicio.bloques.sueno'), u.duracion(noche.dormido), noche.fuente && noche.fuente.tipo !== 'moss' ? tx('inicio.todo.origen.aparato', { aparato: noche.fuente.nombre }) : tx('inicio.todo.origen.estimado'));
      cuerpo.appendChild(sabe);

      // Lo que le falta a Moss para estimar mejor (Progreso.faltaParaEstimar, la regla de la app).
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.falta')));
      const falta = Progreso.faltaParaEstimar({ control: d.estadoControl, objetivo: p.objetivo, pesoMeta: p.pesoMeta, conMedidas: !!d.grasa, sinReloj: opciones.sinReloj() });
      if (falta.length) {
        const lista = el('ul', 'tt-falta');
        falta.forEach((x) => {
          const texto = x.fecha ? u.plural('inicio.todo.faltaItems.' + x.que, x.n, { fecha: u.fechaCorta(x.fecha) }) : tx('inicio.todo.faltaItems.' + x.que);
          lista.appendChild(el('li', null, texto));
        });
        cuerpo.appendChild(lista);
      } else cuerpo.appendChild(el('p', 'tt-frase', tx('inicio.todo.faltaNada')));

      // Abajo de todo, cómo lo estima.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('inicio.todo.como')));
      ['calorias', 'macros', 'peso', 'grasa', 'sueno', 'alimentos'].forEach((k) => {
        const parte = el('div', 'tt-como');
        parte.append(el('b', null, tx(`inicio.todo.comoEstima.${k}.titulo`)), el('p', null, tx(`inicio.todo.comoEstima.${k}.texto`)));
        cuerpo.appendChild(parte);
      });
      cuerpo.appendChild(el('p', 'tt-pie', tx('inicio.todo.pie')));
      h.append(cab, cuerpo);
    }

    // ------------------------------------------------------------ el primer día
    // Sin nada todavía, cada bloque dice qué hacer y con qué se va a llenar, en vez de ceros y rayas.
    function caloriasPrimerDia() {
      const c = carta('in-calorias in-primer', null, 1);
      const meta = opciones.comida.meta;
      const arriba = el('div', 'in-cal-arriba');
      const luna = el('div', 'in-luna-nueva');
      luna.appendChild(el('i'));
      const cifra = el('div', 'in-cal-cifra');
      cifra.append(el('span', 'in-cal-etq', tx('inicio.primerDia.etiqueta')), el('b', null, numero(meta.kcal)), el('small', null, tx('inicio.primerDia.kcalHoy')));
      arriba.append(luna, cifra);
      const metas = el('div', 'in-metas-chips');
      [['p', 'proteina'], ['c', 'carbohidratos'], ['g', 'grasas']].forEach(([m, clave], k) => {
        const x = el('span', 'in-meta-chip in-meta-' + m);
        x.style.animationDelay = `${(0.25 + k * 0.1).toFixed(2)}s`;
        x.append(el('i'), el('b', null, tx('inicio.gramos', { n: numero(meta[m]) })), ` ${tx('comida.' + clave).toLowerCase()}`);
        metas.appendChild(x);
      });
      const acciones = el('div', 'in-primer-acciones');
      acciones.append(
        boton('cm-accion principal', `${icono('mas')}<span>${tx('inicio.primerDia.anotar')}</span>`, () => opciones.ir(1)),
        boton('cm-accion', `${icono('microfono')}<span>${tx('inicio.primerDia.decir')}</span>`, () => opciones.ir(1)),
      );
      c.append(arriba, metas, el('p', 'in-primer-texto', tx('inicio.primerDia.caloriasTexto')), acciones);
      return c;
    }

    // El camino: hoy y la meta, unidos por lo que falta, con la fecha a un ritmo viable.
    function caminoPrimerDia() {
      const d = opciones.persona();
      const p = d.perfil;
      const c = carta('in-objetivo in-primer', tx('inicio.primerDia.camino'), 2);
      const desde = Math.round(d.pesoHoy * 10) / 10;
      const plazo = Progreso.plazoConRitmo({ hoy: Datos.HOY, pesoKg: desde, pesoMeta: p.pesoMeta, sexo: p.sexo, edad: Number(Datos.HOY.slice(0, 4)) - p.nacimiento, gasto: d.gasto, entrenaFuerza: true },
        Progreso.BORDES[p.objetivo === 'subir' ? 'subir' : 'bajar'][0]);
      const fila = el('div', 'in-obj-fila');
      fila.append(el('b', null, `${numero(desde, 1)} → ${numero(p.pesoMeta, p.pesoMeta % 1 ? 1 : 0)} kg`));
      c.appendChild(fila);
      if (plazo) {
        const total = Fechas.diasEntre(Datos.HOY, plazo.fecha);
        c.appendChild(Graficos.camino([{ dia: 0, kg: desde }], [{ dia: total, kg: p.pesoMeta }], p.pesoMeta, { ancho: 300, alto: 64, clase: 'in-camino-primer' }));
        c.appendChild(el('p', 'in-primer-texto', tx('inicio.primerDia.caminoTexto', { fecha: u.fechaCorta(plazo.fecha) })));
      }
      const acciones = el('div', 'in-primer-acciones');
      acciones.appendChild(boton('cm-accion', `${icono('balanza')}<span>${tx('inicio.primerDia.pesarme')}</span>`, () => opciones.ir(2)));
      c.appendChild(acciones);
      return c;
    }

    // El cielo: la constelación de hoy con sus estrellas esperando, que titilan.
    function cieloPrimerDia() {
      const { constelacion, habitos } = opciones.cielo();
      const c = carta('in-cielo in-primer', tx('inicio.bloques.cielo'), 4);
      const lienzo = el('canvas', 'in-mini-cielo in-cielo-espera');
      c.appendChild(lienzo);
      requestAnimationFrame(() => dibujarConstelacion(lienzo, constelacion, habitos.map((h) => Object.assign({}, h, { encendido: false }))));
      c.appendChild(el('p', 'in-primer-texto', tx('inicio.primerDia.cieloTexto')));
      const acciones = el('div', 'in-primer-acciones');
      acciones.appendChild(boton('cm-accion', `${icono('estrella')}<span>${tx('inicio.primerDia.habitos')}</span>`, () => opciones.ir(4)));
      c.appendChild(acciones);
      return c;
    }

    // El saludo del día (saludo.js): se pide en cada pintada, y solo se toca si la frase cambió.
    function ponerSaludo() {
      const texto = opciones.saludo ? opciones.saludo(s.primerDia) : null;
      if (texto) SeccionSaludo.mostrar(zona.querySelector('.in-saludo'), texto);
    }

    function pintar(ms) {
      const hoy = u.partes(Datos.HOY);
      zona.querySelector('.in-fecha').textContent = tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) });
      zona.querySelector('.in-titulo').textContent = tx('inicio.titulo');
      ponerSaludo();
      bloquesEl.innerHTML = '';
      if (s.primerDia) [caloriasPrimerDia(), caminoPrimerDia(), cieloPrimerDia()].forEach((b) => bloquesEl.appendChild(b));
      else s.orden.filter((b) => s.visibles.has(b)).forEach((b) => bloquesEl.appendChild(ARMAR[b](ms)));
      // La invitación de Ascent (ascent.js), debajo del segundo bloque: se ve sin bajar y no tapa lo de hoy.
      const invitacion = s.primerDia ? null : opciones.invitacionDeAscent();
      if (invitacion) bloquesEl.insertBefore(invitacion, bloquesEl.children[2] || null);
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
    Kcal.alCambiar(() => pintar(600));
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
      primerDia(si) { s.primerDia = !!si; pintar(0); },
      ponerSaludo,
      abrirTodo,
      cerrarTodo: () => hojaTodo.cerrar(),
      bajarTodo: (selector) => {
        const cuerpo = hojaTodo.el.querySelector('.tt-cuerpo');
        const n = hojaTodo.el.querySelector(selector);
        if (cuerpo && n) cuerpo.scrollTop += n.getBoundingClientRect().top - cuerpo.getBoundingClientRect().top - 44;
      },
      bajar() { zona.querySelector('.in-scroll').scrollTo(0, 99999); },
      subir() { zona.querySelector('.in-scroll').scrollTo(0, 0); },
    };
  }

  return { crear };
})();

// Los gráficos chicos de las secciones nuevas: una línea con su tendencia, el balance de la semana,
// el hipnograma de una noche, el camino a la meta, las barras de cada semana y la línea chiquita de
// una medida. SVG con los colores de la galería.
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

  // El camino a la meta: la tendencia hasta hoy (llena) y el plan hasta la fecha (punteado), con la
  // meta. `pasado` y `plan` son [{ dia, kg }], con `dia` contado desde el primero.
  function camino(pasado, plan, meta, { ancho = 300, alto = 96, clase } = {}) {
    const m = 6;
    const todos = [...pasado, ...plan];
    const ultimoDia = Math.max(...todos.map((p) => p.dia), 1);
    const valores = todos.map((p) => p.kg).concat([meta]);
    const min = Math.min(...valores) - 0.4, max = Math.max(...valores) + 0.4;
    const X = (d) => m + (d / ultimoDia) * (ancho - 2 * m);
    const Y = (v) => m + (1 - (v - min) / (max - min)) * (alto - 2 * m);
    const trazo = (lista) => lista.map((p, i) => `${i ? 'L' : 'M'}${X(p.dia).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join(' ');
    const hoy = pasado[pasado.length - 1];
    const fin = plan[plan.length - 1];
    const id = 'c' + Math.random().toString(36).slice(2, 8);
    const area = pasado.length > 1 ? `${trazo(pasado)} L${X(hoy.dia).toFixed(1)} ${alto} L${X(pasado[0].dia).toFixed(1)} ${alto} Z` : '';
    return svg(ancho, alto, 'gr-camino ' + (clase || ''), `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a6bf94" stop-opacity="0.22"/><stop offset="1" stop-color="#a6bf94" stop-opacity="0"/></linearGradient></defs>
      <line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-meta"/>
      <path d="${area}" fill="url(#${id})" stroke="none"/>
      <path d="${trazo(pasado)}" class="gr-linea gr-hecho"/>
      ${plan.length ? `<path d="${trazo([hoy, ...plan])}" class="gr-plan"/>` : ''}
      ${hoy ? `<circle cx="${X(hoy.dia).toFixed(1)}" cy="${Y(hoy.kg).toFixed(1)}" r="3" class="gr-fin"/>` : ''}
      ${fin ? `<circle cx="${X(fin.dia).toFixed(1)}" cy="${Y(fin.kg).toFixed(1)}" r="3.4" class="gr-destino"/>` : ''}`);
  }

  // Barras desde el cero: lo negativo baja y lo positivo sube (el cambio de cada semana). Si todo va
  // para el mismo lado, el cero queda en el borde y las barras usan todo el alto.
  function barras(valores, { ancho = 300, alto = 60, clase, tope } = {}) {
    const m = 3;
    const hay = valores.filter((v) => v != null);
    const max = tope || Math.max(0.1, ...hay.map((v) => Math.abs(v)));
    const cero = hay.every((v) => v <= 0) ? m : hay.every((v) => v >= 0) ? alto - m : alto / 2;
    const lugar = Math.max(cero - m, alto - m - cero);
    const paso = (ancho - 2 * m) / valores.length;
    const lista = valores.map((v, i) => {
      if (v == null) return '';
      const h = Math.max(1.5, (Math.abs(v) / max) * lugar);
      const x = m + i * paso + paso * 0.24;
      return `<rect x="${x.toFixed(1)}" y="${(v < 0 ? cero : cero - h).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="${v < 0 ? 'gr-baja' : 'gr-sube'}"/>`;
    }).join('');
    return svg(ancho, alto, 'gr-barras ' + (clase || ''), `<line x1="${m}" x2="${ancho - m}" y1="${cero}" y2="${cero}" class="gr-guia"/>${lista}`);
  }

  // Lo comido de cada semana contra la meta (la línea): columnas que llegan o no.
  function columnas(valores, meta, { ancho = 300, alto = 60, clase } = {}) {
    const m = 3;
    const max = Math.max(meta * 1.2, ...valores.map((v) => v ?? 0));
    const Y = (v) => alto - m - (v / max) * (alto - 2 * m);
    const paso = (ancho - 2 * m) / valores.length;
    const lista = valores.map((v, i) => (v == null ? `<rect x="${(m + i * paso + paso * 0.24).toFixed(1)}" y="${(alto - m - 2).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="2" rx="1" class="gr-vacia"/>`
      : `<rect x="${(m + i * paso + paso * 0.24).toFixed(1)}" y="${Y(v).toFixed(1)}" width="${(paso * 0.52).toFixed(1)}" height="${(alto - m - Y(v)).toFixed(1)}" rx="2" class="gr-columna${v > meta * 1.05 ? ' arriba' : v < meta * 0.9 ? ' abajo' : ''}"/>`)).join('');
    return svg(ancho, alto, 'gr-columnas ' + (clase || ''), `${lista}<line x1="${m}" x2="${ancho - m}" y1="${Y(meta).toFixed(1)}" y2="${Y(meta).toFixed(1)}" class="gr-gasto"/>`);
  }

  // Una línea chiquita, para el lado de un número (las medidas).
  function chispa(valores, { ancho = 54, alto = 18, clase } = {}) {
    const m = 2.5;
    if (valores.length < 2) return svg(ancho, alto, clase, '');
    const min = Math.min(...valores), max = Math.max(...valores);
    const X = (i) => m + (i / (valores.length - 1)) * (ancho - 2 * m);
    const Y = (v) => (max === min ? alto / 2 : m + (1 - (v - min) / (max - min)) * (alto - 2 * m));
    const d = valores.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    const ult = valores.length - 1;
    return svg(ancho, alto, 'gr-chispa ' + (clase || ''), `<path d="${d}" class="gr-linea"/><circle cx="${X(ult).toFixed(1)}" cy="${Y(valores[ult]).toFixed(1)}" r="2" class="gr-fin"/>`);
  }

  return { linea, balance, hipnograma, camino, barras, columnas, chispa };
})();
