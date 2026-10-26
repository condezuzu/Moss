// La sección de Ascent (spec/ascent.md), arriba de Hábitos. Desde el cielo, tocar la flecha tenue
// sobre el musgo o deslizar para arriba desde arriba de la barra la suben desde abajo, siguiendo al
// dedo; se vuelve deslizando para abajo, con la flecha de arriba o tocando Hábitos. Sin vincular,
// cada función muestra vacío lo que va a mostrar, con «Vincular» arriba; vinculada, lo de hoy, con
// las cuentas de la app (Entrenamiento, src/dominio/entrenamiento.ts). Tiene los colores de Ascent
// y su regla de líneas en vez de cajas: es la parte de Moss que es de las dos. Debajo de la
// recuperación, el rendimiento esperado, los músculos y la marca posible (Rendimiento y Musculos,
// src/dominio/rendimiento.ts y musculos.ts), como antes de entrenar hoy.

const SeccionAscent = (() => {
  const PARTES = ['sueno', 'carga', 'comida'];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

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
    const MAXIMOS = Entrenamiento.MAXIMOS_DE_RECUPERACION;
    let vinculada = false;
    // Cuánto subió: 0 es abajo, escondida; 1, arriba.
    let p = 0;
    let abierta = false;
    let animacion = 0;
    let comoSeCalcula = false;
    let comoRendimiento = false;

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
    // Tocarla también abre la sección.
    const flecha = boton('as-flecha', icono('arriba'), () => abrir());
    tel.querySelector('.ui .frase').appendChild(flecha);

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const sesionDe = (fecha) => A.sesiones.find((s) => s.fecha === fecha) || null;

    function calcularRecuperacion() {
      const anoche = opciones.anoche();
      const meta = opciones.metaBase();
      const ayer = opciones.comida.totalDe(-1);
      // Antes de entrenar hoy: el peso movido de los tres días anteriores, cuántos seguidos venía
      // entrenando y el promedio por día de las 4 semanas anteriores a esos tres días.
      const anteriores = [1, 2, 3].map((k) => sesionDe(Fechas.sumarDias(Datos.HOY, -k)));
      let seguidos = 0;
      while (seguidos < anteriores.length && anteriores[seguidos]) seguidos++;
      const historia = Entrenamiento.sesionesAnteriores(A.sesiones, Fechas.sumarDias(Datos.HOY, -3));
      const r = Entrenamiento.recuperacion({
        dormido: anoche ? anoche.dormido : 0, necesidad, calidad: anoche ? anoche.calidad : null, sentida: opciones.cara(Datos.HOY),
        kilos3: anteriores.reduce((s, x) => s + (x ? x.kilos : 0), 0),
        kilosPorDia: historia.reduce((s, x) => s + x.kilos, 0) / (7 * Entrenamiento.SEMANAS_DE_HISTORIA),
        seguidos, proteinaAyer: ayer.p, metaProteina: meta.proteina, kcalAyer: ayer.kcal, metaKcal: meta.kcal,
      });
      return Object.assign(r, { anoche, ayer, meta });
    }

    // ------------------------------------------------------------ vincular en dos toques
    // (spec/ascent.md, «Vincular en menos de 10 segundos»): Ascent deja su sesión en el llavero que
    // comparten las apps del equipo, y Moss lo mira al abrir la hoja y cada vez que vuelve a primer
    // plano. Con la sesión, «@usuario · Ascent en este iPhone», qué pasa cada app y «Vincular»: al
    // tocarlo, la luna entra en la órbita. Con Ascent sin sesión, «Abre Ascent y vuelve»; sin
    // Ascent, «Conseguir Ascent»; sin la cuenta de Moss, que hace falta entrar. Siempre, abajo y
    // chico, entrar con la cuenta de Ascent: para quien no la tiene en este iPhone y para quien
    // revisa en Apple. En la galería, el iPhone y lo que contesta el servidor se eligen arriba.
    let esteIphone = 'sesion';
    let resultado = 'bien';
    const hojaVincular = Util.hoja(tel, 'as-hoja', () => opciones.alCambiar());
    const hv = { estado: 'sesion', conCorreo: false, correoEscrito: '', claveEscrita: '', vinculando: null, error: null, errorDe: null, entra: false };
    const usuarioDeAscent = () => '@' + Datos.PERFIL.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let esperaDeLaHoja = 0;

    function abrirVincular(estado) {
      clearTimeout(esperaDeLaHoja);
      Object.assign(hv, { estado: estado || esteIphone, conCorreo: false, vinculando: null, error: null, errorDe: null, entra: false });
      pintarHoja();
      hojaVincular.abrir();
      opciones.alCambiar();
    }

    // Vincular con la sesión del llavero o con el correo: lo que contesta el servidor se elige arriba.
    function vincularDesdeLaHoja(de) {
      if (hv.vinculando) return;
      Object.assign(hv, { vinculando: de, error: null, errorDe: null });
      pintarHoja();
      esperaDeLaHoja = setTimeout(() => {
        hv.vinculando = null;
        // Con el correo, la sesión es nueva: no vence, pero la contraseña puede estar mal.
        const r = de === 'correo' && resultado === 'vencida' ? 'credenciales' : de === 'llavero' && resultado === 'credenciales' ? 'vencida' : resultado;
        if (r !== 'bien') {
          Object.assign(hv, { error: r, errorDe: de });
          pintarHoja();
          return;
        }
        hojaVincular.cerrar();
        // Cuando la hoja termina de bajar, la luna entra en la órbita.
        esperaDeLaHoja = setTimeout(() => opciones.alVincular(true), 380);
      }, 800);
    }

    function pintarHoja() {
      const h = hojaVincular.el;
      const antes = h.querySelector('.as-hoja-cuerpo');
      const arribaDe = antes ? antes.scrollTop : 0;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('ascent.vincularHoja.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaVincular.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'as-hoja-cuerpo');
      const k = hv.estado;
      const cuenta = el('div', 'as-hoja-cuenta');
      cuenta.innerHTML = MARCA;
      const quien = el('div');
      if (k === 'sesion') quien.append(el('b', null, usuarioDeAscent()), el('span', null, tx('ascent.vincularHoja.enEsteIphone')));
      else quien.append(el('b', null, tx(`ascent.vincularHoja.${k}.titulo`)), el('span', null, tx(`ascent.vincularHoja.${k}.texto`)));
      cuenta.appendChild(quien);
      cuerpo.appendChild(cuenta);
      const lista = (titulo, cosas) => {
        cuerpo.appendChild(el('h4', 'as-hoja-grupo', titulo));
        const ul = el('ul', 'as-hoja-lista');
        cosas.forEach((c) => ul.appendChild(el('li', null, c)));
        cuerpo.appendChild(ul);
      };
      lista(tx('ascent.vincularHoja.deMoss'), tx('ascent.vincularHoja.mossComparte'));
      lista(tx('ascent.vincularHoja.deAscent'), tx('ascent.vincularHoja.ascentComparte'));
      cuerpo.appendChild(el('p', 'as-hoja-nota', tx('ascent.vincularHoja.nota')));
      // El error va donde se mira: arriba del botón que se tocó.
      const error = (de) => {
        if (!hv.error || hv.errorDe !== de) return;
        const p = el('p', 'as-hoja-error', tx('ascent.vincularHoja.errores.' + hv.error));
        p.setAttribute('role', 'alert');
        cuerpo.appendChild(p);
      };
      error('llavero');
      if (k === 'sesion') {
        const b = boton('as-vincular as-hoja-vincular', tx(hv.vinculando === 'llavero' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.vincular'), () => vincularDesdeLaHoja('llavero'));
        b.disabled = !!hv.vinculando;
        cuerpo.appendChild(b);
      } else if (k === 'sinSesion') {
        // En el iPhone abre Ascent; al volver, Ascent ya dejó la sesión y la hoja la ve sola.
        cuerpo.appendChild(boton('as-vincular as-hoja-vincular', tx('ascent.vincularHoja.sinSesion.boton'), () => {
          esperaDeLaHoja = setTimeout(() => { Object.assign(hv, { estado: 'sesion', error: null, errorDe: null }); pintarHoja(); }, 900);
        }));
      } else if (k === 'sinAscent') {
        cuerpo.appendChild(boton('as-vincular as-hoja-vincular', tx('ascent.vincularHoja.sinAscent.boton'), () => {}));
      }
      cuerpo.appendChild(boton('as-conseguir as-hoja-ahora-no', tx('ascent.vincularHoja.ahoraNo'), () => hojaVincular.cerrar()));
      if (k !== 'sinCuenta') {
        const enlace = boton('as-hoja-con-correo' + (hv.conCorreo ? ' abierto' : ''), `<span>${tx('ascent.vincularHoja.conCorreo')}</span>${icono('adelante')}`, () => {
          Object.assign(hv, { conCorreo: !hv.conCorreo, entra: !hv.conCorreo });
          if (hv.errorDe === 'correo') Object.assign(hv, { error: null, errorDe: null });
          pintarHoja();
          if (hv.conCorreo) {
            const c = h.querySelector('.as-hoja-cuerpo');
            c.scrollTop = c.scrollHeight;
          }
        });
        enlace.setAttribute('aria-expanded', String(hv.conCorreo));
        cuerpo.appendChild(enlace);
      }
      if (hv.conCorreo && k !== 'sinCuenta') {
        const form = el('form', 'as-hoja-form' + (hv.entra ? ' as-entra' : ''));
        hv.entra = false;
        const campo = (tipo, clave, guardado, auto) => {
          const i = el('input', 'as-campo');
          Object.assign(i, { type: tipo, placeholder: tx('ascent.vincularHoja.' + clave), autocomplete: auto, value: hv[guardado] });
          i.setAttribute('aria-label', i.placeholder);
          i.addEventListener('input', () => { hv[guardado] = i.value; });
          return i;
        };
        form.append(campo('email', 'correo', 'correoEscrito', 'username'), campo('password', 'clave', 'claveEscrita', 'current-password'));
        cuerpo.appendChild(form);
        error('correo');
        const entrar = boton('as-hoja-entrar', tx(hv.vinculando === 'correo' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.entrar'), () => {
          const vacio = [...form.querySelectorAll('.as-campo')].find((i) => !i.value.trim());
          if (vacio) { vacio.focus(); return; }
          vincularDesdeLaHoja('correo');
        });
        entrar.disabled = !!hv.vinculando;
        form.addEventListener('submit', (ev) => { ev.preventDefault(); entrar.click(); });
        cuerpo.append(entrar, el('p', 'as-hoja-nota', tx('ascent.vincularHoja.notaCorreo')));
      }
      h.append(cab, cuerpo);
      cuerpo.scrollTop = arribaDe;
    }

    // Lo que se elige en la galería: cómo está Ascent en este iPhone y qué contesta el servidor.
    const elegir = (id, alElegir) => {
      const cont = document.getElementById(id);
      if (!cont) return;
      cont.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        cont.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        alElegir(b.dataset.valor);
      });
    };
    elegir('s-iphone', (v) => { esteIphone = v; abrirVincular(v); });
    elegir('s-servidor', (v) => { resultado = v; });

    // ------------------------------------------------------------ rendimiento, músculos y marca
    // Como antes de entrenar hoy: 10 minutos antes de la sesión de piernas de las 18:40.
    const DIA = 86_400_000;
    const ANTES = sesionDe(Datos.HOY).inicio - 10 * 60e3;
    const previas = () => A.sesiones.filter((x) => x.inicio < ANTES);
    const unoRM = (ejercicio) => Musculos.mejorE1rm(previas(), ejercicio);
    const GRUPOS = {
      piernas: ['cuadriceps', 'gluteos', 'isquios', 'aductores', 'pantorrillas'], espaldaBaja: ['espaldaBaja'], espalda: ['espaldaAlta'],
      pecho: ['pecho'], hombros: ['hombros'], brazos: ['biceps', 'triceps', 'antebrazos'], abdomen: ['abdomen'],
    };
    const grupoDe = (musculo) => Object.keys(GRUPOS).find((g) => GRUPOS[g].includes(musculo));
    const residualDe = (musculo) => Musculos.residual(musculo, previas(), ANTES, { unoRM });

    /** Cada grupo, con el músculo que más le falta, su estado y en cuánto está listo. */
    function estadoDeGrupos() {
      return Object.entries(GRUPOS).map(([grupo, musculos]) => {
        const peor = musculos.reduce((a, m) => (residualDe(m) > residualDe(a) ? m : a));
        const r = residualDe(peor);
        return { grupo, residual: r, estado: Musculos.estadoDe(r), listo: Musculos.listoEn(peor, previas(), ANTES, { unoRM }) };
      });
    }

    /** Las series de unos músculos (como principales) entre dos momentos. */
    function seriesDe(musculos, desde, hasta) {
      return A.sesiones.filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
        const d = Musculos.dosisDeLaSesion(x, unoRM);
        return t + musculos.reduce((u2, m) => u2 + ((d.get(m) && d.get(m).series) || 0), 0);
      }, 0);
    }

    function calcularRendimiento() {
      const sesion = sesionDe(Datos.HOY);
      const bloque = sesion.bloques[0];
      const musc = Musculos.musculosDe(bloque.ejercicio);
      const noches = opciones.noches();
      const anoche = noches.find((n) => n.clave === Datos.HOY) || null;
      const habitual = SinReloj.habitualDe(noches, Datos.HOY);
      const ultimas3 = [0, 1, 2].map((k) => noches.find((n) => n.clave === Fechas.sumarDias(Datos.HOY, -k))).filter(Boolean).map((n) => n.dormido);
      const deuda = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, Datos.HOY, 14), necesidad);
      const residual = Math.max(...musc.principal.map(residualDe));
      // La semana contra el promedio de las cuatro anteriores, en series de los músculos principales.
      const semana = seriesDe(musc.principal, ANTES - 7 * DIA, ANTES);
      const mes = seriesDe(musc.principal, ANTES - 35 * DIA, ANTES - 7 * DIA) / 4;
      const conEllos = previas().filter((x) => musc.principal.some((m) => (Musculos.dosisDeLaSesion(x, unoRM).get(m) || {}).series > 0));
      const ultima = conEllos[conEllos.length - 1];
      const conElEjercicio = previas().filter((x) => x.bloques.some((b) => b.ejercicio === bloque.ejercicio));
      const ultimoDelEjercicio = conElEjercicio[conElEjercicio.length - 1];
      const ultimoBloque = ultimoDelEjercicio.bloques.find((b) => b.ejercicio === bloque.ejercicio);
      const ayer = opciones.comida.totalDe(-1);
      const meta = opciones.metaBase();
      const pesoKg = opciones.persona().pesoHoy || 75;
      const cambio = opciones.persona().cambio7;
      const entradas = {
        sueno: anoche ? {
          dormido: anoche.dormido, necesidad,
          despertoAntes: !!habitual && anoche.despertar < habitual.despertar - 60,
          seAcostoTarde: !!habitual && anoche.dormirse > habitual.dormirse + 60,
          siesta: anoche.siestas >= 20, sinReloj: !!anoche.moss,
        } : null,
        ultimas3, deuda: deuda ? deuda.minutos : null, cara: opciones.cara(Datos.HOY),
        multiarticular: musc.multiarticular, tren: musc.principal.some((m) => Musculos.DE_PIERNAS.includes(m)) ? 'inferior' : 'superior', horaHabitual: sesion.hora,
        comida: {
          ayuno8h: false, sesionLarga: sesion.minutos > 45, carbosAyerPorKilo: ayer.c ? ayer.c / pesoKg : null, mismosMusculosAyer: false,
          bajaSemanal: cambio !== null && cambio !== undefined ? (-cambio / pesoKg) * 100 : null, semanasBajando: 6, kcalAyer: ayer.kcal ? ayer.kcal / meta.kcal : null,
        },
        residual,
        descarga: {
          diasSinSeriesDuras: Math.floor((ANTES - ultima.inicio) / DIA), seriesSemanaSobreMes: mes ? semana / mes : null,
          intensidadMantenida: ultimoBloque.series.some((x) => x.peso >= 0.85 * (unoRM(bloque.ejercicio) || Infinity)),
          diasSinElEjercicio: Math.floor((ANTES - ultimoDelEjercicio.inicio) / DIA),
        },
        entrenado: true,
      };
      return { r: Rendimiento.rendimientoEsperado(entradas), entradas, bloque, musc, anoche, ultima };
    }

    function calcularMarca(rend) {
      const { r, entradas, bloque, musc, ultima } = rend;
      const pr = A.marcas.find((m) => m.ejercicio === bloque.ejercicio);
      if (!pr) return null;
      const recientes = previas().filter((x) => x.inicio > ANTES - 21 * DIA);
      const dia = Rendimiento.buenDiaParaMarca({
        marca: Musculos.e1rm(pr.peso, pr.reps), mejorReciente: Musculos.mejorE1rm(recientes, bloque.ejercicio), marcaEn8Semanas: pr.fecha > Fechas.sumarDias(Datos.HOY, -56),
        recuperado: entradas.residual < 3, dormido: entradas.sueno ? entradas.sueno.dormido : null, despertoAntes: !!(entradas.sueno && entradas.sueno.despertoAntes),
        ultimas3: entradas.ultimas3, seriesSemanaSobreMes: entradas.descarga.seriesSemanaSobreMes, ayunoSesionLarga: entradas.comida.ayuno8h && entradas.comida.sesionLarga,
        bajandoRapido: entradas.comida.bajaSemanal !== null && entradas.comida.bajaSemanal > 1, deltaMax: r.max, sigma: r.sigma,
      });
      const av = A.avisos[bloque.ejercicio] || { veces: 0, marcas: 0, marcasEnTotal: 0, semanas: 0 };
      const seguridad = Rendimiento.seguridadDeMarcas({ marcas: av.marcasEnTotal, sesiones: previas().length, semanas: av.semanas, leGanaALaGeneral: false });
      return Object.assign(dia, { bloque, av, seguridad, grupo: grupoDe(musc.principal[0]), dias: Math.floor((ANTES - ultima.inicio) / DIA) });
    }

    // Lo de Moss de una semana, de lunes a domingo, con la comida y el sueño de la galería.
    function semanaDeMoss(desde) {
      const fechas = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(desde, i));
      const noches = Datos.NOCHES.filter((x) => fechas.includes(x.clave)).map((x) => x.dormido);
      const comidas = fechas.map((f) => opciones.comida.totalDe(Fechas.diasEntre(Datos.HOY, f))).filter((t) => t.kcal > 0).map((t) => ({ kcal: t.kcal, proteina: t.p }));
      return Entrenamiento.semanaDeMoss(noches, comidas, opciones.persona().gasto);
    }

    // Las semanas del estancamiento contra las semanas en que el ejercicio subía. Con «pocas
    // semanas» (un botón de la galería) solo hay dos con marcas: todavía está juntando.
    function porQueNoSube() {
      const e = A.estancado;
      const sin = Array.from({ length: e.semanas }, (_, i) => semanaDeMoss(Fechas.sumarDias(e.desde, 7 * i)));
      const con = opciones.pocasSemanas() ? A.semanasConMarcas.slice(0, 2) : A.semanasConMarcas;
      return Entrenamiento.porQueNoSube(con, sin);
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
        cab.appendChild(boton('as-vincular', tx('ascent.vincular'), () => abrirVincular()));
        cab.appendChild(boton('as-conseguir', tx('ascent.conseguir'), () => {}));
        cab.appendChild(el('p', 'as-misma', tx('ascent.permiso')));
      }
      return cab;
    }

    // Hoy en Ascent: la sesión, la meta de hoy con el reparto de la semana, y la proteína de la sesión.
    function hoyEnAscent() {
      const c = opciones.conAscent();
      if (!c || !c.sesion) return null;
      const s = c.sesion;
      const k = carta('as-hoy', tx('ascent.hoy.titulo'), el('span', 'as-derecha', tx('ascent.hoy.aLas', { hora: u.horaMin(s.hora) })));
      const m = opciones.comida.meta;
      k.append(
        el('div', 'as-hoy-sesion', tx('ascent.hoy.sesion', { nombre: nombreDe(s.nombre), min: s.minutos, series: s.series })),
        el('p', 'as-hoy-meta', tx('ascent.hoy.meta', { kcal: numero(m.kcal), p: numero(m.p) })),
      );
      // La semana del control: los días de gimnasio más altos, los de descanso más bajos y lo que
      // viene como previsión. Suma lo mismo que el control.
      const barras = el('div', 'as-semana');
      const valores = c.semana.map((d) => d.meta.kcal);
      const alto = Math.max(...valores), bajo = Math.min(...valores);
      c.semana.forEach((d) => {
        const clase = d.entrena === true ? ' gimnasio' : d.entrena === null ? ' previsto' : '';
        const col = el('div', 'as-semana-dia' + clase + (d.fecha === Datos.HOY ? ' hoy' : ''));
        const barra = el('i');
        barra.style.height = `${(35 + (65 * (d.meta.kcal - bajo)) / Math.max(1, alto - bajo)).toFixed(1)}%`;
        col.append(el('b', null, numero(d.meta.kcal)), barra, el('span', null, tx('fecha.diasCortos.' + Fechas.diaDeLaSemana(d.fecha)).charAt(0)));
        barras.appendChild(col);
      });
      const leyenda = el('div', 'as-leyenda');
      ['gimnasio', 'descanso', 'previsto'].forEach((n) => leyenda.appendChild(el('span', 'as-leyenda-' + n, tx('ascent.hoy.leyenda.' + n))));
      k.append(barras, leyenda, el('p', 'as-nota', tx('ascent.hoy.reparto', { entreno: numero(c.entreno), descanso: numero(c.descanso), semana: numero(c.total) })));
      let proteina;
      if (c.extra > 0) {
        const n = Math.round(Math.abs(c.tamano - 1) * 100);
        const comparacion = n < 5 ? tx('ascent.hoy.comparacion.comoSiempre') : tx('ascent.hoy.comparacion.' + (c.tamano > 1 ? 'masGrande' : 'masChica'), { n });
        proteina = tx('ascent.hoy.proteina.sube', { p: c.extra, comparacion });
      } else {
        proteina = tx('ascent.hoy.proteina.' + (c.tamano <= 0.5 ? 'chica' : 'techo'));
      }
      k.appendChild(el('p', 'as-nota', proteina));
      return k;
    }

    // El gimnasio se enciende solo: un hábito con la fuente «Ascent», como los de Salud. Si no hay
    // ninguno, se suma acá con un toque (los días, los que suele entrenar); en la galería solo cambia
    // la carta.
    let conGimnasio = false;
    function cartaGimnasio() {
      const c = carta('as-gimnasio', tx('ascent.funciones.gimnasio.titulo'));
      const nombre = tx('ascent.gimnasio.nombre');
      if (conGimnasio) {
        c.appendChild(el('p', 'as-texto', tx('ascent.gimnasio.listo', { nombre })));
        return c;
      }
      c.appendChild(el('p', 'as-texto', tx('ascent.gimnasio.sumar', { nombre })));
      c.appendChild(boton('as-hoja-entrar as-gimnasio-sumar', tx('ascent.gimnasio.boton', { nombre }), () => {
        conGimnasio = true;
        const nueva = cartaGimnasio();
        nueva.classList.add('as-entra');
        c.replaceWith(nueva);
      }));
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
            carga: () => tx('ascent.recuperacion.detalle.carga', { n: Math.round(d.carga * 100) }),
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

    const motivoTexto = (m, musc) => {
      if (m.que === 'durmioPoco') return tx('ascent.rendimiento.motivos.durmioPoco', { horas: u.duracion(m.minutos) });
      if (m.que === 'musculoCargado') return tx('ascent.rendimiento.motivos.musculoCargado', { musculo: tx('ascent.musculos.grupos.' + grupoDe(musc.principal[0])) });
      if (m.que === 'sinEntrenarlo') return tx('ascent.rendimiento.motivos.sinEntrenarlo', { dias: m.dias });
      return tx('ascent.rendimiento.motivos.' + m.que);
    };

    // El rendimiento esperado de la sesión de hoy: la fuerza máxima y las repeticiones, con sus motivos.
    function cartaRendimiento() {
      const d = vinculada ? calcularRendimiento() : null;
      const c = carta('as-rendimiento', tx('ascent.rendimiento.titulo'), d ? el('span', 'as-derecha', tx('ascent.rendimiento.hoy', { sesion: nombreDe(sesionDe(Datos.HOY).nombre) })) : candado());
      if (!d) {
        c.appendChild(el('p', 'as-texto', tx('ascent.rendimiento.texto')));
        return c;
      }
      const filas = el('div', 'as-rend');
      [['fuerza', d.r.max, d.r.categoria.max], ['repeticiones', d.r.vol, d.r.categoria.vol]].forEach(([k, v, cat]) => {
        const f = el('div', 'as-rend-fila ' + cat);
        f.append(el('span', null, tx('ascent.rendimiento.' + k)), el('b', null, tx('ascent.rendimiento.categorias.' + cat)), el('small', null, `${u.conSigno(Math.round(v))} %`));
        filas.appendChild(f);
      });
      c.appendChild(filas);
      const motivos = el('ul', 'as-motivos');
      (d.r.motivos.length ? d.r.motivos.slice(0, 3).map((m) => motivoTexto(m, d.musc)) : [tx('ascent.rendimiento.sinMotivos')]).forEach((texto) => motivos.appendChild(el('li', null, texto)));
      c.appendChild(motivos);
      c.appendChild(el('p', 'as-nota', tx('ascent.rendimiento.margen', { n: numero(d.r.sigma, 1) })));
      c.appendChild(el('p', 'as-nota', d.anoche && d.anoche.moss ? tx('ascent.rendimiento.sinReloj') : tx('ascent.rendimiento.conReloj', { aparato: 'Apple Watch' })));
      c.appendChild(el('p', 'as-nota', tx('ascent.rendimiento.seguridad', { nivel: tx('ascent.rendimiento.niveles.media'), semanas: 5 })));
      const caja = el('div', 'as-explicacion');
      tx('ascent.rendimiento.como').forEach((p) => caja.appendChild(el('p', null, p)));
      caja.hidden = !comoRendimiento;
      const b = boton('as-enlace' + (comoRendimiento ? ' abierto' : ''), `<span>${tx('progreso.comoSeCalcula')}</span>${icono('adelante')}`, () => {
        comoRendimiento = !comoRendimiento;
        caja.hidden = !comoRendimiento;
        b.classList.toggle('abierto', comoRendimiento);
      });
      c.append(b, caja);
      return c;
    }

    // Los músculos antes de entrenar: recuperado, recuperándose (y en cuánto está listo) o cargado.
    function cartaMusculos() {
      const c = carta('as-musculos', tx('ascent.musculos.titulo'), vinculada ? null : candado());
      if (!vinculada) {
        c.appendChild(el('p', 'as-texto', tx('ascent.musculos.texto')));
        return c;
      }
      c.appendChild(el('p', 'as-nota as-musculos-antes', tx('ascent.musculos.antes')));
      const lista = el('ul', 'as-musculos-lista');
      estadoDeGrupos().forEach((g) => {
        const li = el('li', g.estado);
        const estado = el('span', 'as-estado ' + g.estado, tx('ascent.musculos.estados.' + g.estado));
        li.append(el('span', null, tx('ascent.musculos.grupos.' + g.grupo)), estado);
        if (g.listo) li.appendChild(el('small', null, tx('ascent.musculos.listoEn', { h: g.listo })));
        lista.appendChild(li);
      });
      c.appendChild(lista);
      c.appendChild(el('p', 'as-nota', tx('ascent.musculos.nota')));
      return c;
    }

    // «Buen día para intentar marca», si se cumplen las cinco condiciones y la probabilidad llega.
    function cartaMarca() {
      const c = carta('as-pr', tx('ascent.marca.titulo'), vinculada ? null : candado());
      if (!vinculada) {
        c.appendChild(el('p', 'as-texto', tx('ascent.marca.texto')));
        return c;
      }
      const rend = calcularRendimiento();
      const m = calcularMarca(rend);
      if (!m || !m.aplica) {
        c.appendChild(el('p', 'as-texto', tx('ascent.marca.hoyNo')));
        return c;
      }
      c.classList.add('con-marca');
      c.append(
        el('p', 'as-pr-titulo', tx('ascent.marca.en', { ejercicio: m.bloque.ejercicio.toLowerCase() })),
        el('p', 'as-texto', tx('ascent.marca.porque', {
          horas: rend.anoche ? u.duracion(rend.anoche.dormido) : '—', musculos: tx('ascent.musculos.grupos.' + m.grupo).toLowerCase(), dias: m.dias, g: numero(m.distancia, 1),
        })),
        el('b', 'as-pr-p', tx('ascent.marca.probabilidad', { p: Math.round(m.probabilidad * 100) })),
        el('p', 'as-nota', tx('ascent.marca.aciertos', { veces: m.av.veces, marcas: m.av.marcas })),
        el('p', 'as-nota', tx('ascent.marca.seguridad', { nivel: tx('ascent.rendimiento.niveles.' + m.seguridad), marcas: m.av.marcasEnTotal, semanas: m.av.semanas })),
        el('p', 'as-nota', tx('ascent.marca.nota')),
      );
      return c;
    }

    // Las semanas con marcas contra las del estancamiento: el sueño, la proteína y el balance.
    function tablaDeSemanas(antes, ahora, causa) {
      const tabla = el('div', 'as-tabla');
      tabla.append(el('span'), el('span', 'as-col', tx('ascent.estancamiento.conMarcas')), el('span', 'as-col', tx('ascent.estancamiento.ahora', { n: A.estancado.semanas })));
      const valor = {
        sueno: (v) => u.duracion(Math.round(v)),
        proteina: (v) => tx('ascent.estancamiento.gramos', { n: numero(Math.round(v)) }),
        calorias: (v) => tx('ascent.estancamiento.kcal', { n: u.conSigno(Math.round(v / 10) * 10) }),
      };
      [['sueno', 'sueno'], ['proteina', 'proteina'], ['calorias', 'balance']].forEach(([k, campo]) => {
        const clase = 'as-tabla-fila' + (k === causa ? ' mayor' : '');
        tabla.append(el('span', clase, tx('ascent.estancamiento.filas.' + k)), el('b', clase, antes ? valor[k](antes[campo]) : '—'), el('b', clase, ahora ? valor[k](ahora[campo]) : '—'));
      });
      return tabla;
    }

    function cartaEstancamiento() {
      const c = carta('as-estanc', tx('ascent.estancamiento.titulo'), vinculada ? null : candado());
      const e = A.estancado;
      if (!vinculada) {
        c.append(el('p', 'as-texto', tx('ascent.estancamiento.texto')), tablaDeSemanas(null, null, null));
        return c;
      }
      c.appendChild(el('div', 'as-estanc-ej', tx('ascent.estancamiento.ejercicio', { ejercicio: nombreDe(e.ejercicio), semanas: e.semanas, marca: e.marca })));
      const r = porQueNoSube();
      if (r.estado === 'juntando') {
        // Las semanas que ya hay, de las que hacen falta de cada lado.
        const juntadas = el('div', 'as-juntando');
        [['conMarcas', r.conMarcas], ['sinMarcas', r.sinMarcas]].forEach(([clave, n]) => {
          const fila = el('div', 'as-juntando-fila');
          fila.appendChild(el('span', null, tx('ascent.estancamiento.' + clave)));
          const cuadros = el('span', 'as-cuadros');
          for (let i = 0; i < Entrenamiento.SEMANAS_MINIMAS; i++) cuadros.appendChild(el('i', i < n ? 'lleno' : null));
          fila.appendChild(cuadros);
          juntadas.appendChild(fila);
        });
        c.append(
          el('p', 'as-frase', tx('ascent.estancamiento.juntando')),
          juntadas,
          el('p', 'as-nota', tx('ascent.estancamiento.juntandoDetalle', { min: Entrenamiento.SEMANAS_MINIMAS, dias: Entrenamiento.DIAS_MINIMOS, a: r.conMarcas, b: r.sinMarcas })),
        );
        return c;
      }
      c.appendChild(tablaDeSemanas(r.antes, r.ahora, r.estado === 'probable' ? r.causa : null));
      if (r.estado === 'probable') {
        const horas = u.duracion(Math.floor(r.antes.sueno / 15) * 15);
        c.append(
          el('p', 'as-causa', tx('ascent.estancamiento.causa', { causa: tx('ascent.estancamiento.causas.' + r.causa) })),
          el('p', 'as-frase', tx('ascent.estancamiento.frases.' + r.causa, { horas })),
          el('p', 'as-nota', tx('ascent.estancamiento.nota')),
        );
      } else {
        c.appendChild(el('p', 'as-frase', tx('ascent.estancamiento.sinDiferencia')));
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

    function pintar() {
      const scroll = cont.scrollTop;
      contenido.innerHTML = '';
      zona.classList.toggle('vinculada', vinculada);
      volver.setAttribute('aria-label', tx('ascent.volver'));
      flecha.setAttribute('aria-label', tx('ascent.flecha'));
      contenido.appendChild(cabecera());
      if (vinculada) {
        contenido.append(...[hoyEnAscent(), cartaGimnasio(), grupo('soloConLasDos'), cartaRecuperacion(), cartaRendimiento(), cartaMusculos(), cartaMarca(), cartaEstancamiento(), cartaAnio()].filter(Boolean));
        contenido.appendChild(el('p', 'as-pie', tx('ascent.desvincular')));
      } else {
        contenido.append(grupo('soloConLasDos'), cartaRecuperacion(), cartaRendimiento(), cartaMusculos(), cartaMarca(), cartaEstancamiento(), cartaAnio());
      }
      cont.scrollTop = scroll;
    }

    // ------------------------------------------------------------ subir y bajar
    function poner(v) {
      p = clamp(v, 0, 1);
      zona.style.transform = `translate3d(0, ${((1 - p) * 100).toFixed(3)}%, 0)`;
      zona.style.visibility = p > 0.0005 ? 'visible' : 'hidden';
      zona.inert = p === 0;
      velo.style.opacity = (0.32 * p).toFixed(3);
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
      // Para las capturas: la hoja de vincular.
      abrirVincular,
      get hojaVincularAbierta() { return hojaVincular.abierta; },
      cerrarVincular() { clearTimeout(esperaDeLaHoja); hojaVincular.cerrar(true); },
      // La línea del rendimiento en Sueño.
      rendimientoDeHoy: () => (vinculada ? calcularRendimiento().r : null),
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTop = Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 60);
      },
      subir() { cont.scrollTop = 0; },
    };
  }

  return { crear };
})();
