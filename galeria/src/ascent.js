// La sección de Ascent (spec/ascent.md), arriba de Hábitos. Desde el cielo, la flecha tenue sobre
// el musgo y deslizar para arriba la suben desde abajo, siguiendo al dedo; se vuelve deslizando
// para abajo, con la flecha de arriba o tocando Hábitos. Sin vincular, cada función muestra vacío
// lo que va a mostrar, con «Vincular» arriba; vinculada, lo de hoy. Tiene los colores de Ascent y
// su regla de líneas en vez de cajas: es la parte de Moss que es de las dos.

const SeccionAscent = (() => {
  const MAXIMOS = { sueno: 40, carga: 40, comida: 20 };
  const PARTES = ['sueno', 'carga', 'comida'];
  const FUNCIONES = [['peso', 'balanza'], ['calorias', 'rayo'], ['objetivo', 'objetivo'], ['cuenta', 'amigos'], ['proteina', 'pesa'], ['gimnasio', 'estrella']];
  // Cuánto pesa cada diferencia para elegir la más grande en «Por qué no subes»: 45 minutos de
  // sueño, 15 g de proteína por día o 250 kcal por día de balance cuentan lo mismo.
  const ESCALAS = { sueno: 45, proteina: 15, calorias: 250 };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  // La recuperación de spec/ascent.md. En la app la calcula moss.recuperacion(fecha) en Supabase,
  // así las dos apps muestran el mismo número.
  function recuperacion(d) {
    const sueno = 20 * Math.min(1, d.dormido / d.necesidad) + (20 * clamp(d.calidad, 0, 100)) / 100;
    const r = d.kg3 / (3 * d.promedioDiario);
    const carga = Math.max(0, 40 * clamp(1.5 - r, 0, 1) - 5 * Math.max(0, d.seguidos - 2));
    const comida = 10 * Math.min(1, d.proteina / d.metaProteina) + 10 * Math.min(1, d.kcal / (0.8 * d.metaKcal));
    const partes = { sueno: Math.round(sueno), carga: Math.round(carga), comida: Math.round(comida) };
    const total = partes.sueno + partes.carga + partes.comida;
    return { partes, total, r, conviene: total >= 70 ? 'fuerte' : total >= 45 ? 'normal' : 'suave' };
  }

  // El planeta de Ascent con su órbita abierta, como en su ícono, y la luna de Moss: sin vincular
  // queda afuera de la órbita; al vincular, entra.
  const ORBITA = 'M -25.24 -36.04 A 44 44 0 1 1 -36.04 25.24';
  const MARCA = `<svg class="as-marca" viewBox="-66 -66 132 132" aria-hidden="true">
    <defs>
      <radialGradient id="asPlaneta" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#6b7386"/><stop offset="0.5" stop-color="#2b313e"/><stop offset="1" stop-color="#0c0f15"/></radialGradient>
      <radialGradient id="asLunita" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#bdb39c"/></radialGradient>
    </defs>
    <circle r="25" fill="url(#asPlaneta)"/>
    <circle r="25" class="as-planeta-borde"/>
    <path class="as-orbita as-orbita-sin" d="${ORBITA}"/>
    <path class="as-orbita as-orbita-con" d="${ORBITA}"/>
    <g class="as-luna"><circle r="9.5" class="as-luna-halo"/><circle r="5.2" fill="url(#asLunita)"/></g>
  </svg>`;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const A = Datos.ASCENT;
    const nombreDe = (v) => v[u.idioma()] || v.es;
    const curva = opciones.curva;
    let vinculada = false;
    // Cuánto subió: 0 es abajo, escondida; 1, arriba.
    let p = 0;
    let abierta = false;
    let animacion = 0;
    let comoSeCalcula = false;

    const velo = el('div', 'as-velo');
    const zona = el('section', 'ascent pagina-app');
    zona.setAttribute('aria-label', 'Ascent');
    zona.innerHTML = `<div class="as-scroll"><div class="as-arriba"></div><div class="as-contenido"></div></div>`;
    tel.append(velo, zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.as-scroll');
    const contenido = zona.querySelector('.as-contenido');
    // La flecha para volver y el dibujo no se rearman: así el dibujo puede cambiar con una transición.
    const arriba = zona.querySelector('.as-arriba');
    const volver = boton('as-volver', icono('abajo'), () => cerrar());
    arriba.appendChild(volver);
    arriba.insertAdjacentHTML('beforeend', MARCA);
    const marca = arriba.querySelector('.as-marca');

    // La flecha tenue de Hábitos va con la frase: se va con ella cuando la cámara sube a tu universo.
    const flecha = boton('as-flecha', icono('arriba'), () => abrir());
    tel.querySelector('.ui .frase').appendChild(flecha);

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const sesionDe = (fecha) => A.sesiones.find((s) => s.fecha === fecha) || null;

    function calcularRecuperacion() {
      const anoche = opciones.anoche();
      const meta = opciones.metaBase();
      const ayer = opciones.comida.totalDe(-1);
      // Lo de antes de entrenar hoy: los tres días anteriores y cuántos seguidos venía entrenando.
      const anteriores = [1, 2, 3].map((k) => sesionDe(Fechas.sumarDias(Datos.HOY, -k)));
      let seguidos = 0;
      while (seguidos < anteriores.length && anteriores[seguidos]) seguidos++;
      const r = recuperacion({
        dormido: anoche ? anoche.dormido : 0, necesidad, calidad: anoche && anoche.calidad != null ? anoche.calidad : 0,
        kg3: anteriores.reduce((s, x) => s + (x ? x.kg : 0), 0), promedioDiario: (A.sesionPromedioKg * A.sesionesPorSemana) / 7, seguidos,
        proteina: ayer.p, metaProteina: meta.proteina, kcal: ayer.kcal, metaKcal: meta.kcal,
      });
      return Object.assign(r, { anoche, ayer, meta });
    }

    // Lo de Moss de estas semanas, para comparar con las semanas en que llegaban las marcas.
    function estasSemanas() {
      const n = A.estancado.semanas * 7;
      const desde = Fechas.sumarDias(Datos.HOY, -n);
      const noches = Datos.NOCHES.filter((x) => x.clave > desde && x.clave <= Datos.HOY);
      const sueno = noches.reduce((s, x) => s + x.dormido, 0) / Math.max(1, noches.length);
      let proteina = 0, kcal = 0, dias = 0;
      for (let k = 1; k <= n; k++) {
        const t = opciones.comida.totalDe(-k);
        if (!t.kcal) continue;
        dias++;
        kcal += t.kcal;
        proteina += t.p;
      }
      return { sueno, proteina: proteina / Math.max(1, dias), balance: kcal / Math.max(1, dias) - opciones.persona().gasto };
    }

    // ------------------------------------------------------------ las partes
    const grupo = (clave) => el('h3', 'as-grupo', tx('ascent.' + clave));
    const candado = () => {
      const c = el('span', 'as-candado');
      c.innerHTML = icono('candado');
      c.appendChild(el('span', null, tx('ascent.conAscent')));
      return c;
    };
    function carta(clase, titulo, derecha) {
      const c = el('article', 'as-carta ' + clase);
      const cab = el('header', 'as-carta-cab');
      cab.appendChild(el('h4', 'as-carta-titulo', titulo));
      if (derecha) cab.appendChild(derecha);
      c.appendChild(cab);
      return c;
    }

    function cabecera() {
      const cab = el('header', 'as-cab');
      cab.append(
        el('span', 'as-etq', vinculada ? tx('ascent.vinculadaDesde', { fecha: u.fechaCorta(A.vinculadaDesde) }) : tx('ascent.etiqueta')),
        el('h2', 'as-titulo', tx('ascent.titulo')),
      );
      if (!vinculada) {
        cab.appendChild(el('p', 'as-bajada', tx('ascent.bajada')));
        cab.appendChild(boton('as-vincular', tx('ascent.vincular'), () => opciones.alVincular(true)));
        cab.appendChild(boton('as-conseguir', tx('ascent.conseguir'), () => {}));
        cab.appendChild(el('p', 'as-misma', tx('ascent.mismaCuenta')));
      }
      return cab;
    }

    function hoyEnAscent() {
      const s = sesionDe(Datos.HOY);
      const aj = opciones.ajuste();
      if (!s || !aj) return null;
      const c = carta('as-hoy', tx('ascent.hoy.titulo'), el('span', 'as-derecha', tx('ascent.hoy.aLas', { hora: u.horaMin(s.hora) })));
      const m = opciones.comida.meta;
      c.append(
        el('div', 'as-hoy-sesion', tx('ascent.hoy.sesion', { nombre: nombreDe(s.nombre), min: s.min, series: s.series })),
        el('p', 'as-hoy-meta', tx('ascent.hoy.meta', { kcal: numero(m.kcal), p: numero(m.p) })),
        el('p', 'as-nota', tx('ascent.hoy.cambio', { kcal: numero(aj.kcal), p: numero(aj.p) })),
      );
      return c;
    }

    function cartaRecuperacion() {
      const d = vinculada ? calcularRecuperacion() : null;
      const c = carta('as-recuperacion', tx('ascent.recuperacion.titulo'), d ? el('span', 'as-derecha', tx('ascent.recuperacion.hoy')) : candado());
      const fila = el('div', 'as-rec-fila');
      const largo = 2 * Math.PI * 42;
      const anillo = el('div', 'as-anillo-caja');
      anillo.innerHTML = `<svg class="as-anillo" viewBox="-50 -50 100 100" aria-hidden="true"><circle r="42" class="as-anillo-pista"/>${d ? `<circle r="42" class="as-anillo-valor" transform="rotate(-90)" stroke-dasharray="${largo.toFixed(1)} ${largo.toFixed(1)}" stroke-dashoffset="${(largo * (1 - d.total / 100)).toFixed(1)}"/>` : ''}</svg>`;
      anillo.appendChild(el('b', null, d ? String(d.total) : '—'));
      const txt = el('div', 'as-rec-txt');
      if (d) txt.appendChild(el('strong', null, tx('ascent.recuperacion.conviene.' + d.conviene)));
      txt.appendChild(el('p', null, tx('ascent.recuperacion.texto')));
      fila.append(anillo, txt);
      c.appendChild(fila);

      const partes = el('div', 'as-partes');
      PARTES.forEach((k) => {
        const f = el('div', 'as-parte');
        const barra = el('i', 'as-parte-barra');
        const relleno = el('i');
        relleno.style.width = d ? `${((d.partes[k] / MAXIMOS[k]) * 100).toFixed(1)}%` : '0';
        barra.appendChild(relleno);
        f.append(el('span', 'as-parte-nombre', tx('ascent.recuperacion.partes.' + k)), barra, el('b', null, d ? tx('ascent.recuperacion.de', { n: d.partes[k], max: MAXIMOS[k] }) : '—'));
        if (d) {
          const detalle = {
            sueno: () => tx('ascent.recuperacion.detalle.sueno', { horas: d.anoche ? u.duracion(d.anoche.dormido) : '—', calidad: d.anoche && d.anoche.calidad != null ? d.anoche.calidad : '—' }),
            carga: () => tx('ascent.recuperacion.detalle.carga', { n: Math.round(d.r * 100) }),
            comida: () => tx('ascent.recuperacion.detalle.comida', { p: numero(Math.round(d.ayer.p)), meta: numero(d.meta.proteina) }),
          }[k]();
          f.appendChild(el('small', null, detalle));
        }
        partes.appendChild(f);
      });
      c.appendChild(partes);
      if (d) {
        const caja = el('p', 'as-explicacion', tx('ascent.recuperacion.explicacion'));
        caja.hidden = !comoSeCalcula;
        const b = boton('as-enlace' + (comoSeCalcula ? ' abierto' : ''), `<span>${tx('progreso.comoSeCalcula')}</span>${icono('adelante')}`, () => {
          comoSeCalcula = !comoSeCalcula;
          caja.hidden = !comoSeCalcula;
          b.classList.toggle('abierto', comoSeCalcula);
        });
        c.append(b, caja);
      }
      return c;
    }

    function cartaEstancamiento() {
      const c = carta('as-estanc', tx('ascent.estancamiento.titulo'), vinculada ? null : candado());
      const e = A.estancado;
      const ahora = vinculada ? estasSemanas() : null;
      const antes = A.conMarcas;
      if (vinculada) c.appendChild(el('div', 'as-estanc-ej', tx('ascent.estancamiento.ejercicio', { ejercicio: nombreDe(e.ejercicio), semanas: e.semanas, marca: e.marca })));
      else c.appendChild(el('p', 'as-texto', tx('ascent.estancamiento.texto')));
      // La diferencia más grande, cada una en su escala: esa es la oración.
      const difs = ahora ? {
        sueno: (antes.sueno - ahora.sueno) / ESCALAS.sueno,
        proteina: (antes.proteina - ahora.proteina) / ESCALAS.proteina,
        calorias: Math.abs(ahora.balance - antes.balance) / ESCALAS.calorias,
      } : null;
      const mayor = difs ? Object.keys(difs).reduce((a, b) => (difs[b] > difs[a] ? b : a)) : null;
      const tabla = el('div', 'as-tabla');
      tabla.append(el('span'), el('span', 'as-col', tx('ascent.estancamiento.conMarcas')), el('span', 'as-col', tx('ascent.estancamiento.ahora', { n: e.semanas })));
      const valor = {
        sueno: (v) => u.duracion(Math.round(v)),
        proteina: (v) => tx('ascent.estancamiento.gramos', { n: numero(Math.round(v)) }),
        calorias: (v) => tx('ascent.estancamiento.kcal', { n: u.conSigno(Math.round(v / 10) * 10) }),
      };
      const fila = (k, a, b) => {
        const clase = 'as-tabla-fila' + (k === mayor ? ' mayor' : '');
        const n = el('span', clase, tx('ascent.estancamiento.filas.' + k));
        tabla.append(n, el('b', clase, ahora ? valor[k](a) : '—'), el('b', clase, ahora ? valor[k](b) : '—'));
      };
      fila('sueno', antes.sueno, ahora && ahora.sueno);
      fila('proteina', antes.proteina, ahora && ahora.proteina);
      fila('calorias', antes.balance, ahora && ahora.balance);
      c.appendChild(tabla);
      if (mayor) {
        const horas = u.duracion(Math.floor(antes.sueno / 15) * 15);
        c.append(el('p', 'as-frase', tx('ascent.estancamiento.frases.' + mayor, { horas })), el('p', 'as-nota', tx('ascent.estancamiento.nota')));
      }
      return c;
    }

    function cartaAnio() {
      const c = carta('as-anio', tx('ascent.anio.titulo'), vinculada ? el('span', 'as-derecha', tx('ascent.anio.cuando')) : candado());
      if (!vinculada) c.appendChild(el('p', 'as-texto', tx('ascent.anio.texto')));
      const noches = Datos.NOCHES;
      const sueno = noches.reduce((s, x) => s + x.dormido, 0) / Math.max(1, noches.length);
      const datos = [
        ['entrenamientos', numero(A.anio.entrenamientos)],
        ['marcas', numero(A.anio.marcas)],
        ['habitos', numero(A.anio.diasConHabitos)],
        ['sueno', tx('ascent.anio.horas', { h: Math.floor(sueno / 60), m: String(Math.round(sueno % 60)).padStart(2, '0') })],
        ['comida', numero(A.anio.diasConComida)],
      ];
      const grilla = el('div', 'as-anio-grilla');
      datos.forEach(([k, v]) => {
        const d = el('div', 'as-dato');
        d.append(el('b', null, vinculada ? v : '—'), el('span', null, tx('ascent.anio.datos.' + k)));
        grilla.appendChild(d);
      });
      c.appendChild(grilla);
      if (vinculada) c.appendChild(el('p', 'as-nota', tx('ascent.anio.desde', { fecha: u.fechaCorta(Datos.INICIO) })));
      return c;
    }

    function vivo(k) {
      const aj = opciones.ajuste() || { kcal: 0, p: 0 };
      if (k === 'peso') {
        const ult = Datos.PESADAS[Datos.PESADAS.length - 1];
        const ayer = Fechas.sumarDias(Datos.HOY, -1);
        const cuando = ult.fecha === Datos.HOY ? tx('ascent.cuando.hoy') : ult.fecha === ayer ? tx('ascent.cuando.ayer') : tx('ascent.cuando.dia', { dia: tx('fecha.dias.' + Fechas.diaDeLaSemana(ult.fecha)) });
        return tx('ascent.funciones.peso.vivo', { kg: numero(ult.kg, 1), cuando });
      }
      if (k === 'calorias') return tx('ascent.funciones.calorias.vivo', { n: numero(aj.kcal) });
      if (k === 'objetivo') return tx('ascent.funciones.objetivo.vivo.' + opciones.persona().perfil.objetivo);
      if (k === 'cuenta') return tx('ascent.funciones.cuenta.vivo', { n: A.amigos });
      if (k === 'proteina') return tx('ascent.funciones.proteina.vivo', { n: aj.p });
      return tx('ascent.funciones.gimnasio.vivo');
    }

    function funciones() {
      const ul = el('ul', 'as-funciones');
      FUNCIONES.forEach(([k, ic]) => {
        const li = el('li', 'as-funcion');
        li.insertAdjacentHTML('beforeend', icono(ic));
        const txt = el('div', 'as-funcion-txt');
        txt.append(el('b', null, tx(`ascent.funciones.${k}.titulo`)), el('span', vinculada ? 'vivo' : null, vinculada ? vivo(k) : tx(`ascent.funciones.${k}.texto`)));
        li.appendChild(txt);
        if (!vinculada) {
          const c = el('i', 'as-funcion-candado');
          c.innerHTML = icono('candado');
          li.appendChild(c);
        }
        ul.appendChild(li);
      });
      return ul;
    }

    function pintar() {
      const scroll = cont.scrollTop;
      contenido.innerHTML = '';
      zona.classList.toggle('vinculada', vinculada);
      volver.setAttribute('aria-label', tx('ascent.volver'));
      flecha.setAttribute('aria-label', tx('ascent.flecha'));
      contenido.appendChild(cabecera());
      if (vinculada) {
        contenido.append(...[hoyEnAscent(), grupo('soloConLasDos'), cartaRecuperacion(), cartaEstancamiento(), cartaAnio(), grupo('mejorConectadas'), funciones()].filter(Boolean));
        contenido.appendChild(el('p', 'as-pie', tx('ascent.desvincular')));
      } else {
        contenido.append(grupo('soloConLasDos'), cartaRecuperacion(), cartaEstancamiento(), cartaAnio(), grupo('mejorConectadas'), funciones());
      }
      cont.scrollTop = scroll;
    }

    // ------------------------------------------------------------ subir y bajar
    function poner(v) {
      p = clamp(v, 0, 1);
      zona.style.transform = `translate3d(0, ${((1 - p) * 100).toFixed(3)}%, 0)`;
      zona.style.visibility = p > 0.0005 ? 'visible' : 'hidden';
      zona.inert = p === 0;
      velo.style.opacity = (0.6 * p).toFixed(3);
      flecha.style.opacity = (1 - Math.min(1, p * 2.5)).toFixed(3);
      if (opciones.alMover) opciones.alMover(p);
    }
    function ir(hasta, deUna) {
      cancelAnimationFrame(animacion);
      animacion = 0;
      abierta = hasta === 1;
      const desde = p;
      if (deUna || opciones.movimientoReducido || desde === hasta) { poner(hasta); listo(); return; }
      // Más corto cuanto menos falta, como un resorte.
      const ms = 220 + 260 * Math.abs(hasta - desde);
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        poner(desde + (hasta - desde) * curva(k));
        if (k < 1) animacion = requestAnimationFrame(paso);
        else { animacion = 0; listo(); }
      };
      animacion = requestAnimationFrame(paso);
    }
    function listo() {
      if (!abierta) { cont.scrollTop = 0; comoSeCalcula = false; }
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function abrir(deUna) { if (!abierta) pintar(); ir(1, deUna); }
    function cerrar(deUna) { ir(0, deUna); }

    // Para volver: deslizar para abajo desde arriba de todo, o con la flecha.
    let tirando = null;
    zona.addEventListener('pointerdown', (ev) => {
      tirando = null;
      if (!abierta || animacion || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      tirando = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, v: 0, ultimoY: ev.clientY, ultimoT: performance.now() };
    });
    zona.addEventListener('pointermove', (ev) => {
      const g = tirando;
      if (!g || ev.pointerId !== g.id) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (cont.scrollTop > 0 || dy < -8 || Math.abs(dx) > 12) { tirando = null; return; }
        if (dy < 10 || Math.abs(dx) > dy) return;
        g.decidido = true;
        try { zona.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
      }
      ev.preventDefault();
      const ahora = performance.now();
      g.v = g.v * 0.6 + ((ev.clientY - g.ultimoY) / Math.max(1, ahora - g.ultimoT)) * 0.4;
      g.ultimoY = ev.clientY;
      g.ultimoT = ahora;
      poner(1 - Math.max(0, dy - 10) / (zona.clientHeight || 1));
    });
    const soltar = (ev) => {
      const g = tirando;
      if (!g || ev.pointerId !== g.id) return;
      tirando = null;
      if (!g.decidido) return;
      const baja = ev.type === 'pointerup' && (1 - p >= 0.2 || g.v >= 0.35);
      ir(baja ? 0 : 1);
      // El click que llega después de arrastrar no es un toque.
      const tragar = (e) => { e.stopPropagation(); e.preventDefault(); };
      zona.addEventListener('click', tragar, { capture: true, once: true });
      setTimeout(() => zona.removeEventListener('click', tragar, { capture: true }), 400);
    };
    zona.addEventListener('pointerup', soltar);
    zona.addEventListener('pointercancel', soltar);
    // En Safari del iPhone, arriba de todo, tirar para abajo es de la sección y no del scroll.
    let toque = null;
    cont.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; toque = t ? { x: t.clientX, y: t.clientY, arriba: cont.scrollTop <= 0 } : null; }, { passive: true });
    cont.addEventListener('touchmove', (ev) => {
      const t = ev.touches[0];
      if (!toque || !t || !toque.arriba) return;
      const dy = t.clientY - toque.y;
      if (dy > 0 && dy > Math.abs(t.clientX - toque.x)) ev.preventDefault();
    }, { passive: false });

    poner(0);
    pintar();

    return {
      zona,
      flecha,
      pintar,
      abrir,
      cerrar,
      get vinculada() { return vinculada; },
      get abierta() { return abierta; },
      get progreso() { return p; },
      // Ocupada: arriba, subiendo o bajando. Mientras, las pestañas no se deslizan.
      get ocupada() { return abierta || p > 0 || !!animacion; },
      // El gesto desde el cielo (galeria.js): mientras el dedo sube, y al soltar.
      arrastrar(fr) { cancelAnimationFrame(animacion); animacion = 0; if (!abierta && p === 0) pintar(); poner(fr); },
      soltar(subir) { ir(subir ? 1 : 0); },
      ponerVinculo(si) {
        vinculada = si;
        marca.classList.toggle('unida', si);
        pintar();
        contenido.classList.remove('as-entra');
        void contenido.offsetWidth;
        contenido.classList.add('as-entra');
      },
      // La recuperación de hoy, para Sueño.
      recuperacionDeHoy: () => (vinculada ? calcularRecuperacion() : null),
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTop = Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 60);
      },
      subir() { cont.scrollTop = 0; },
    };
  }

  return { crear, recuperacion };
})();
