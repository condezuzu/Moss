// Sueño (spec/sueno.md): lo que Salud trae de cada noche, armado con las reglas de la app (Sueno,
// src/dominio/sueno.ts) y, sin reloj, las noches que Moss estima con el teléfono (SinReloj,
// src/dominio/sinReloj.ts). Arriba, la pregunta de cada mañana (sin reloj, primero la hora si Moss
// no está segura; después cómo dormiste, con cinco caras) y las
// últimas dos semanas para elegir una noche; después, esa noche (cuánto dormiste, cuándo, las etapas
// como estimación, lo despierto), la deuda, que es lo que más gente puede tener bien, su calidad con
// de qué sale, el horario y qué tan regular es, lo que mide el reloj de noche, y de dónde sale cada
// dato y qué tan confiable es. Lo que falta se muestra en gris: nunca se inventa.

const SeccionSueno = (() => {
  const DIAS = 14;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const s = { clave: Datos.HOY, abierto: null, cambiando: false, editandoHora: false, editando: null, forzarHora: null };
    // Lo que contestó cada mañana, de 1 a 5, por noche: queda en este navegador, como quedaría en el
    // teléfono. «Ahora no» la esconde solo por hoy.
    const GUARDADO_CARAS = 'moss-galeria-caras';
    let caras = {};
    try { caras = JSON.parse(localStorage.getItem(GUARDADO_CARAS) || '{}') || {}; } catch (_) { caras = {}; }
    const ahoraNo = new Set();
    function ponerCara(clave, cara) {
      caras[clave] = cara;
      try { localStorage.setItem(GUARDADO_CARAS, JSON.stringify(caras)); } catch (_) { /* no pasa nada */ }
      // Nada desaparece de golpe: la cara elegida brilla, la tarjeta se cierra y entra la línea.
      cerrarPregunta(() => {
        s.cambiando = false;
        pintar();
        if (opciones.alCambiarCara) opciones.alCambiarCara();
      }, cara);
    }
    /** Cierra una parte (alto, opacidad y márgenes) y después rearma Sueño: nada desaparece de golpe. */
    function colapsar(nodo, despues, demora) {
      const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!nodo || quieto) { despues(); return; }
      nodo.style.height = `${nodo.offsetHeight}px`;
      // Leer el alto otra vez fija el de partida: así la transición corre aunque no haya cuadros.
      void nodo.offsetHeight;
      nodo.classList.add('cerrando');
      setTimeout(despues, demora || 480);
    }
    /** La tarjeta de la mañana se cierra y después se rearma Sueño; con la hora todavía por contestar, solo las caras. */
    function cerrarPregunta(despues, cara) {
      const carta = cont.querySelector('.sn-manana');
      if (carta && cara) carta.querySelectorAll('.sn-cara').forEach((b, i) => b.classList.toggle('elegida', i + 1 === cara));
      const soloCaras = carta && carta.querySelector('.sn-hora') ? carta.querySelector('.sn-caras-bloque') : null;
      colapsar(soloCaras || carta, despues, cara ? 760 : 480);
    }
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);

    const zona = el('section', 'sueno pagina-app');
    zona.innerHTML = '<div class="sn-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.sn-scroll');

    // ------------------------------------------------------------ sin reloj (spec/sueno.md, «Sin reloj»)
    // Lo que contestó cada mañana sobre la hora (confirmada, corregida o escrita) queda en este
    // navegador, como quedaría en el teléfono, y pisa lo que había estimado Moss.
    const GUARDADO_HORAS = 'moss-galeria-horas';
    let horas = {};
    try { horas = JSON.parse(localStorage.getItem(GUARDADO_HORAS) || '{}') || {}; } catch (_) { horas = {}; }
    const GUARDADO_MOVIMIENTO = 'moss-galeria-movimiento';
    let conMovimiento = false;
    try { conMovimiento = localStorage.getItem(GUARDADO_MOVIMIENTO) === 'si'; } catch (_) { conMovimiento = false; }
    const sinReloj = () => !!(opciones.sinReloj && opciones.sinReloj());
    const propias = () => (sinReloj() ? Datos.PROPIAS_SIN_RELOJ.map((p) => (horas[p.fecha] ? Object.assign({}, p, { hora: horas[p.fecha] }) : p)) : []);
    // Las de Salud y, donde Salud no tiene nada, las de Moss: como en la app (src/secciones/persona.ts).
    const noches = () => SinReloj.conNochesDeMoss(opciones.noches(), propias(), Datos.ZONA);
    /** Lo que contestaste de la hora de una noche, en minutos desde las 18. */
    function ponerHora(clave, dormirse, despertar, origen) {
      const antes = propias().find((p) => p.fecha === clave);
      const h = antes && antes.hora;
      const iso = (min) => new Date(SinReloj.instanteDe(clave, Datos.ZONA, min)).toISOString();
      horas[clave] = Object.assign({ dormirse: iso(dormirse), despertar: iso(despertar), origen, confianza: h ? h.confianza : 'media' }, h && h.estimada ? { estimada: h.estimada } : {});
      try { localStorage.setItem(GUARDADO_HORAS, JSON.stringify(horas)); } catch (_) { /* no pasa nada */ }
    }
    /** Qué preguntar de la hora a la mañana: solo sin reloj, si Moss no está segura, y una mañana por semana sin proponer. */
    function queHora(clave) {
      if (!sinReloj()) return null;
      const p = propias().find((x) => x.fecha === clave);
      if (!p || !p.hora || p.hora.origen !== 'estimada') return null;
      return s.forzarHora || SinReloj.quePreguntar(clave, p.hora.confianza);
    }
    /**
     * Las dos horas, de a 5 minutos, con «Guardar». `alGuardar(dormirse, despertar, cambiadas)`, en
     * minutos desde las 18: guardar sin mover nada es confirmar lo que había, con sus horas exactas.
     */
    function editorDeHora(desde, hasta, alGuardar, soloDormirse) {
      const caja = el('div', 'sn-editor');
      let a = Math.round(desde / 5) * 5, b = Math.round(hasta / 5) * 5;
      let cambiadas = false;
      const fila = (texto, leer, mover) => {
        const f = el('div', 'sn-editor-fila');
        const valor = el('b', null, reloj(leer()));
        const paso = (d) => { cambiadas = true; mover(d); valor.textContent = reloj(leer()); };
        f.append(el('span', null, texto), boton('sn-paso', '−', () => paso(-5), tx('sueno.manana.antes')), valor, boton('sn-paso', '+', () => paso(5), tx('sueno.manana.despues')));
        return f;
      };
      caja.append(fila(tx('sueno.manana.teDormiste'), () => a, (d) => { a = Math.min(b - 60, a + d); }));
      // Con la hora de despertar sacada de un ancla (la alarma parada), solo la de dormirte.
      if (!soloDormirse) caja.append(fila(tx('sueno.manana.teDespertaste'), () => b, (d) => { b = Math.max(a + 60, b + d); }));
      caja.append(boton('sn-guardar', tx('sueno.manana.guardar'), () => (cambiadas ? alGuardar(a, soloDormirse ? hasta : b, true) : alGuardar(desde, hasta, false))));
      return caja;
    }
    /** La pregunta de la hora: «¿Dormiste de 00:30 a 08:10?» con «Sí» y «Cambiar», o las horas sin proponer nada. */
    function bloqueDeHora(clave, modo) {
      const n = noches().find((x) => x.clave === clave);
      const b = el('div', 'sn-hora');
      // Cerrar la pregunta: si las caras ya están contestadas, se va la tarjeta entera.
      const listo = () => {
        s.editandoHora = false;
        const carta = cont.querySelector('.sn-manana');
        colapsar(carta && carta.querySelector('.sn-caras-bloque') ? b : carta, pintar, 480);
      };
      if (modo === 'proponer' && !s.editandoHora) {
        // Con la alarma parada, la hora de despertar ya se sabe: se pregunta solo la de dormirte.
        if (s.soloDormirse) {
          b.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.horaDormirse', { hora: reloj(n.dormirse) })));
          b.appendChild(el('p', 'sn-hora-nota', tx('sueno.manana.horaDormirseNota', { hora: reloj(n.despertar), seguridad: tx('sueno.seguridad.' + n.moss.confianza) })));
        } else {
          b.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.hora', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })));
          b.appendChild(el('p', 'sn-hora-nota', tx('sueno.manana.horaNota', { seguridad: tx('sueno.seguridad.' + n.moss.confianza) })));
        }
        const acciones = el('div', 'sn-hora-acciones');
        acciones.append(
          boton('sn-si', tx('sueno.manana.si'), () => { ponerHora(clave, n.dormirse, n.despertar, 'confirmada'); listo(); }),
          boton('sn-otra', tx('sueno.manana.otraHora'), () => { s.editandoHora = true; pintar(); }),
        );
        b.appendChild(acciones);
        return b;
      }
      // Sin proponer, arranca en lo de siempre y no en lo estimado: así se mide cuánto se acepta lo propuesto.
      const h = modo === 'sinProponer' ? SinReloj.habitualDe(noches(), clave) : null;
      b.classList.add('editando');
      b.appendChild(el('p', 'sn-manana-pregunta', tx(s.soloDormirse ? 'sueno.manana.sinProponerDormirse' : 'sueno.manana.sinProponer')));
      b.appendChild(editorDeHora(h ? h.dormirse : n.dormirse, h && !s.soloDormirse ? h.despertar : n.despertar, (x, y, cambiadas) => {
        // Sin proponer, lo escrito siempre es tuyo; si no, sin mover nada es un «Sí».
        ponerHora(clave, x, y, modo === 'sinProponer' ? 'manual' : cambiadas ? 'corregida' : 'confirmada');
        listo();
      }, s.soloDormirse));
      return b;
    }
    /** Sin reloj y sin permiso, una vez: el movimiento del teléfono mejora la estimación. */
    function cartaDeMovimiento() {
      const c = carta('sn-movimiento', null);
      const txt = el('div');
      txt.append(el('b', null, tx('sueno.movimiento.titulo')), el('p', null, tx('sueno.movimiento.texto')));
      c.append(txt, boton('sn-permitir', tx('sueno.movimiento.permitir'), () => {
        conMovimiento = true;
        try { localStorage.setItem(GUARDADO_MOVIMIENTO, 'si'); } catch (_) { /* no pasa nada */ }
        colapsar(c, pintar, 480);
      }));
      return c;
    }
    const ultimas = (hasta) => Sueno.ultimasNoches(noches(), hasta, DIAS);
    // Las dos semanas antes de una noche: con eso se miden el horario de siempre y lo tuyo.
    const anterioresA = (clave) => Sueno.ultimasNoches(noches(), Fechas.sumarDias(clave, -1), DIAS);

    const carta = (clase, titulo, derecha) => {
      const c = el('article', 'pg-carta sn-carta ' + (clase || ''));
      if (titulo) {
        const cab = el('header', 'pg-carta-cab');
        cab.appendChild(el('span', 'pg-carta-titulo', titulo));
        if (derecha) cab.appendChild(derecha);
        c.appendChild(cab);
      }
      return c;
    };
    const confianza = (nivel) => el('em', 'sn-confianza ' + nivel, tx('sueno.confianza.' + nivel));
    const desplegable = (clave, armar) => {
      const caja = el('div', 'pg-texto pg-como');
      caja.hidden = s.abierto !== clave;
      if (!caja.hidden) armar(caja);
      const b = boton('cm-enlace' + (s.abierto === clave ? ' abierto' : ''), `<span>${tx('progreso.comoSeCalcula')}</span>${icono('adelante')}`, () => {
        s.abierto = s.abierto === clave ? null : clave;
        caja.hidden = s.abierto !== clave;
        caja.innerHTML = '';
        if (!caja.hidden) armar(caja);
        b.classList.toggle('abierto', s.abierto === clave);
      });
      return [b, caja];
    };
    // Una hora del sueño: los minutos se cuentan desde las 18 del día anterior.
    const reloj = (min) => u.horaMin(min + 18 * 60);

    function pintar() {
      const arriba = cont.scrollTop;
      cont.innerHTML = '';
      const hoy = u.partes(Datos.HOY);
      const cab = el('header', 'pg-cab');
      cab.append(el('div', 'pg-fecha', tx('cielo.fecha', { dia: tx('fecha.dias.' + hoy.dia), num: hoy.num, mes: tx('fecha.mesesCortos.' + hoy.mes) })), el('h2', 'pg-titulo', tx('sueno.titulo')));
      cont.appendChild(cab);
      manana().forEach((nodo) => cont.appendChild(nodo));
      cont.appendChild(tira());
      // Poco sueño por semanas: la sugerencia de un médico, arriba (Sueno.pocoSuenoSostenido).
      if (s.poco || Sueno.pocoSuenoSostenido(ultimas(Datos.HOY))) cont.appendChild(pocoSueno());
      // Con Ascent, la recuperación de hoy también vive acá: cruza justo el sueño con el entrenamiento.
      const rec = s.clave === Datos.HOY && opciones.recuperacion ? opciones.recuperacion() : null;
      if (rec) cont.appendChild(recuperacion(rec));
      const noche = noches().find((n) => n.clave === s.clave) || null;
      cont.appendChild(noche ? (noche.moss ? laNocheDeMoss(noche) : laNoche(noche)) : sinNoche(s.clave));
      if (noche && noche.moss && !conMovimiento) cont.appendChild(cartaDeMovimiento());
      // La deuda va segunda: solo necesita cuánto dormiste, así que es lo que más gente tiene bien.
      cont.appendChild(deuda());
      if (noche) cont.appendChild(calidad(noche));
      cont.appendChild(horario());
      if (noche && !noche.moss) cont.appendChild(vitales(noche));
      if (sinReloj()) cont.appendChild(afinar());
      cont.appendChild(fuentes(noche));
      cont.appendChild(el('p', 'sn-pie', tx('sueno.noMedico')));
      cont.scrollTop = arriba;
    }

    function pocoSueno() {
      const c = carta('sn-poco', tx('sueno.pocoSueno.titulo'));
      c.append(el('p', 'pg-texto', tx('sueno.pocoSueno.texto')), el('p', 'sn-poco-nota', tx('sueno.pocoSueno.nota')));
      return c;
    }

    // ------------------------------------------------------------ la pregunta de la mañana
    // Arriba, cada día, hasta que contestes o toques «Ahora no»: cómo dormiste anoche, con cinco caras
    // de línea. Un toque y listo; después queda una línea para cambiarla.
    const BOCA = [-3.4, -1.8, 0, 1.8, 3.4];
    function caraSvg(k) {
      const y = k < 3 ? 5.4 : 4.2;
      return `<svg class="sn-cara-dibujo" viewBox="-12 -12 24 24" aria-hidden="true"><circle r="10.4"/><circle cx="-3.6" cy="-2.4" r="1.05" class="ojo"/><circle cx="3.6" cy="-2.4" r="1.05" class="ojo"/><path d="M -4.6 ${y} Q 0 ${(y + BOCA[k - 1]).toFixed(1)} 4.6 ${y}"/></svg>`;
    }
    function manana() {
      const clave = Datos.HOY;
      const cara = caras[clave];
      const nombres = tx('sueno.manana.caras');
      const hora = ahoraNo.has(clave) ? null : queHora(clave);
      const conCaras = (!cara && !ahoraNo.has(clave)) || s.cambiando;
      const nodos = [];
      if (hora || conCaras) {
        const c = carta('sn-manana', null);
        if (hora) c.appendChild(bloqueDeHora(clave, hora));
        if (conCaras) {
          const bloque = el('div', 'sn-caras-bloque');
          bloque.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.pregunta')));
          const fila = el('div', 'sn-caras');
          nombres.forEach((nombre, i) => {
            fila.appendChild(boton('sn-cara' + (cara === i + 1 ? ' elegida' : ''), caraSvg(i + 1) + `<span>${nombre}</span>`, () => ponerCara(clave, i + 1), nombre));
          });
          bloque.appendChild(fila);
          c.appendChild(bloque);
        }
        c.appendChild(boton('sn-ahora-no', tx('sueno.manana.ahoraNo'), () => {
          colapsar(c, () => {
            if (cara) s.cambiando = false;
            ahoraNo.add(clave);
            pintar();
          });
        }));
        nodos.push(c);
      }
      if (cara && !s.cambiando) {
        const c = el('div', 'sn-manana-hecha');
        c.innerHTML = caraSvg(cara);
        c.append(el('span', null, tx('sueno.manana.respondida', { cara: nombres[cara - 1].toLowerCase() })),
          boton('sn-manana-cambiar', tx('sueno.manana.cambiar'), () => {
            // La línea se apaga y la tarjeta entra creciendo (ver .sn-manana en la página).
            c.classList.add('saliendo');
            setTimeout(() => { s.cambiando = true; ahoraNo.delete(clave); pintar(); }, 200);
          }));
        nodos.push(c);
      }
      return nodos;
    }

    // ------------------------------------------------------------ las dos semanas, para elegir
    function tira() {
      const caja = el('div', 'sn-noches');
      // Las dos semanas que terminan hoy o, si la noche elegida es más vieja, las de alrededor.
      const fin = s.clave > Fechas.sumarDias(Datos.HOY, -DIAS) ? Datos.HOY : Fechas.sumarDias(s.clave, 6);
      const lista = ultimas(fin);
      const maximo = Math.max(necesidad + 60, ...lista.filter(Boolean).map((n) => n.dormido + n.siestas));
      lista.forEach((n, i) => {
        const clave = Fechas.sumarDias(fin, i - DIAS + 1);
        const p = u.partes(clave);
        const soloCama = !n && Datos.SOLO_EN_CAMA.get(clave);
        const b = boton('sn-noche' + (clave === s.clave ? ' elegida' : '') + (n ? (n.moss ? ' moss ' + n.moss.origen : '') : soloCama ? ' cama' : ' vacia'), '', () => { s.clave = clave; s.editando = null; pintar(); });
        const barra = el('div', 'sn-noche-barra');
        const relleno = el('i');
        relleno.style.height = n ? `${Math.max(6, (n.dormido / maximo) * 100).toFixed(1)}%` : soloCama ? `${Math.max(6, (soloCama.minutos / maximo) * 100).toFixed(1)}%` : '100%';
        barra.appendChild(relleno);
        const meta = el('span', 'sn-noche-meta');
        meta.style.bottom = `${((necesidad / maximo) * 100).toFixed(1)}%`;
        barra.appendChild(meta);
        b.append(barra, el('span', 'cm-tira-letra', tx('fecha.diasCortos.' + p.dia).charAt(0)), el('b', null, String(p.num)));
        b.setAttribute('aria-label', u.fechaLarga(clave));
        caja.appendChild(b);
      });
      return caja;
    }

    function recuperacion(r) {
      const c = carta('sn-recuperacion', tx('ascent.recuperacion.titulo'), el('em', 'sn-con-ascent', tx('ascent.conAscent')));
      const fila = boton('sn-rec-fila', '', () => opciones.abrirAscent());
      fila.append(el('b', null, String(r.total)), el('span', null, tx('ascent.recuperacion.conviene.' + r.conviene)));
      fila.insertAdjacentHTML('beforeend', icono('adelante'));
      c.appendChild(fila);
      // Debajo, el rendimiento esperado de hoy (spec/rendimiento.md).
      const rend = opciones.rendimiento ? opciones.rendimiento() : null;
      if (rend) c.appendChild(el('p', 'sn-nota', tx('ascent.rendimiento.enSueno', { categoria: tx('ascent.rendimiento.categorias.' + rend.categoria.max) })));
      return c;
    }

    // ------------------------------------------------------------ la noche
    function titulo(clave) {
      if (clave === Datos.HOY) return tx('sueno.anoche');
      const p = u.partes(clave), antes = u.partes(Fechas.sumarDias(clave, -1));
      return tx('sueno.nocheDel', { desde: tx('fecha.dias.' + antes.dia), hasta: tx('fecha.dias.' + p.dia) });
    }

    function laNoche(n) {
      const c = carta('sn-heroe', titulo(n.clave), confianza(n.confianza.duracion));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, u.duracion(n.dormido)), el('span', null, tx('sueno.dormido')));
      c.appendChild(cifra);
      c.appendChild(el('div', 'pg-nota', tx('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })));
      if (Sueno.pareceIncompleta(n, anterioresA(n.clave))) c.appendChild(el('p', 'pg-aviso', tx('sueno.incompleta')));
      // El hipnograma con las horas abajo.
      const hip = el('div', 'sn-hipno');
      const etiquetas = el('div', 'sn-hipno-etq');
      ['despierto', 'rem', 'nucleo', 'profundo'].forEach((e) => etiquetas.appendChild(el('span', null, tx('sueno.etapas.' + e))));
      hip.append(etiquetas, Graficos.hipnograma({ enCamaDesde: n.dormirse, enCamaHasta: n.despertar, tramos: n.tramos }, { ancho: 260, alto: 96, etiquetas: true }));
      c.appendChild(hip);
      const eje = el('div', 'pg-eje sn-eje');
      eje.append(el('span', null, reloj(n.dormirse)), el('span', null, reloj(n.despertar)));
      c.appendChild(eje);
      // Las etapas, como estimación.
      const etapas = el('div', 'sn-etapas');
      [['rem', n.etapas.rem], ['nucleo', n.etapas.nucleo], ['profundo', n.etapas.profundo]].forEach(([e, min]) => {
        const x = el('div', 'sn-etapa sn-' + e);
        x.append(el('i'), el('span', null, tx('sueno.etapas.' + e)), el('b', null, u.duracion(min)), el('small', null, `${numero(Math.round((min / n.dormido) * 100))} %`));
        etapas.appendChild(x);
      });
      c.appendChild(etapas);
      c.appendChild(el('p', 'sn-nota', n.conEtapas ? tx('sueno.etapasEstimadas') : tx('sueno.sinEtapas')));
      // Despierto y en cama.
      const datos = el('div', 'sn-datos');
      const dato = (clave, valor, nivel) => {
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx(clave)), el('b', null, valor));
        if (nivel) d.appendChild(confianza(nivel));
        datos.appendChild(d);
      };
      dato('sueno.despierto', `${u.duracion(Math.round(n.despierto))} · ${u.plural('sueno.despertares', n.despertares)}`, n.confianza.despertares);
      if (n.enCama) dato('sueno.enCama', `${u.duracion(n.enCama.minutos)} · ${n.enCama.fuente.nombre}`, n.confianza.enCama);
      if (n.siestas) dato('sueno.siesta', u.duracion(n.siestas), 'alta');
      c.appendChild(datos);
      return c;
    }

    // Sin reloj: cuánto y cuándo, de dónde sale la hora y, si es estimada, el rango con los bordes difusos.
    function laNocheDeMoss(n) {
      const m = n.moss;
      const c = carta('sn-heroe sn-moss', titulo(n.clave), el('em', 'sn-origen ' + m.origen, tx('sueno.origen.' + m.origen)));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, u.duracion(n.dormido)), el('span', null, tx('sueno.dormido')));
      c.appendChild(cifra);
      c.appendChild(el('div', 'pg-nota', tx('sueno.horas', { desde: reloj(n.dormirse), hasta: reloj(n.despertar) })));
      const r = m.rango;
      const a = r ? r.dormirse[0] : n.dormirse, b = r ? r.despertar[1] : n.despertar;
      const desde = a - 30, hasta = b + 30;
      const pista = el('div', 'sn-franja');
      const barra = el('i');
      barra.style.left = `${(((a - desde) / (hasta - desde)) * 100).toFixed(1)}%`;
      barra.style.width = `${(((b - a) / (hasta - desde)) * 100).toFixed(1)}%`;
      if (r) {
        const x = ((r.dormirse[1] - r.dormirse[0]) / (b - a)) * 100, y = 100 - ((r.despertar[1] - r.despertar[0]) / (b - a)) * 100;
        barra.style.background = `linear-gradient(90deg, rgba(111, 134, 214, 0) 0%, rgba(111, 134, 214, 0.85) ${x.toFixed(1)}%, rgba(143, 211, 232, 0.85) ${y.toFixed(1)}%, rgba(143, 211, 232, 0) 100%)`;
      }
      pista.appendChild(barra);
      c.appendChild(pista);
      const eje = el('div', 'pg-eje');
      eje.append(el('span', null, reloj(desde)), el('span', null, reloj(hasta)));
      c.appendChild(eje);
      if (r) c.appendChild(el('p', 'pg-texto sn-rango-texto', `${tx('sueno.rango', { a: reloj(r.dormirse[0]), b: reloj(r.dormirse[1]), c: reloj(r.despertar[0]), d: reloj(r.despertar[1]) })} ${tx('sueno.seguridad.' + m.confianza)}.`));
      if (m.origen === 'estimada') c.appendChild(el('p', 'sn-nota', tx('sueno.estimadaTexto')));
      c.appendChild(el('p', 'sn-nota', tx('sueno.sinRelojEtapas')));
      // Cambiar la hora de cualquier noche de Moss, ahí mismo.
      if (s.editando === n.clave) {
        const ed = editorDeHora(n.dormirse, n.despertar, (x, y, cambiadas) => {
          if (cambiadas || m.origen === 'estimada') ponerHora(n.clave, x, y, cambiadas ? 'corregida' : 'confirmada');
          s.editando = null;
          colapsar(ed, pintar, 380);
        });
        ed.classList.add('sn-editor-noche');
        c.appendChild(ed);
      } else {
        c.appendChild(boton('sn-cambiar-hora', tx('sueno.cambiarHora'), () => { s.editando = n.clave; pintar(); }));
      }
      return c;
    }

    function sinNoche(clave) {
      const c = carta('sn-heroe sn-sin', titulo(clave));
      const cama = Datos.SOLO_EN_CAMA.get(clave);
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, tx('sueno.sinDatos')));
      c.appendChild(cifra);
      c.appendChild(el('p', 'pg-texto', tx(cama ? 'sueno.sinRelojTexto' : 'sueno.sinNadaTexto')));
      if (cama) {
        const datos = el('div', 'sn-datos');
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx('sueno.enCama')), el('b', null, `${u.duracion(cama.minutos)} · ${cama.fuente.nombre}`), confianza('baja'));
        datos.appendChild(d);
        c.appendChild(datos);
      }
      c.appendChild(el('p', 'sn-nota', tx('sueno.habitosPendientes')));
      return c;
    }

    // ------------------------------------------------------------ la calidad
    function calidad(n) {
      const q = Sueno.calidadDeNoche(n, necesidad, anterioresA(n.clave));
      const c = carta('sn-calidad', tx('sueno.calidad'));
      if (!q) { c.appendChild(el('p', 'pg-texto', tx(n.moss ? 'sueno.sinCalidadEstimada' : 'sueno.sinCalidad'))); return c; }
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, String(q.puntos)), el('span', null, tx('sueno.palabras.' + q.palabra) + (q.parcial ? ' · ' + tx('sueno.parcial') : '')));
      c.appendChild(cifra);
      const partes = el('div', 'sn-partes');
      [['duracion', q.partes.duracion], ['horario', q.partes.horario], ['continuidad', q.partes.continuidad]].forEach(([parte, puntos]) => {
        const x = el('div', 'sn-parte');
        const max = Sueno.MAXIMOS[parte];
        const barra = el('i', 'sn-parte-barra');
        const relleno = el('i');
        barra.appendChild(relleno);
        if (puntos != null) requestAnimationFrame(() => { relleno.style.width = `${((puntos / max) * 100).toFixed(1)}%`; });
        const falta = parte === 'continuidad' && n.moss ? tx('sueno.sinRelojParte') : tx('sueno.todaviaNo');
        x.append(el('span', null, tx('sueno.partes.' + parte)), el('b', null, puntos == null ? falta : `${puntos} / ${max}`), barra);
        partes.appendChild(x);
      });
      c.appendChild(partes);
      // Lo que dijiste a la mañana va aparte: no cambia el puntaje de la noche, sí la recuperación.
      const cara = caras[n.clave];
      if (cara) {
        const datos = el('div', 'sn-datos');
        const d = el('div', 'sn-dato');
        d.append(el('span', null, tx('sueno.manana.tuRespuesta')), el('b', null, tx('sueno.manana.caras')[cara - 1]));
        datos.appendChild(d);
        c.appendChild(datos);
      }
      const [enlace, caja] = desplegable('calidad', (k) => {
        tx('sueno.comoCalidad').forEach((p) => k.appendChild(el('p', null, p.replace('{necesidad}', u.duracion(necesidad)))));
        k.appendChild(el('p', null, tx('sueno.manana.nota')));
      });
      c.append(enlace, caja);
      return c;
    }

    // ------------------------------------------------------------ el horario
    function horario() {
      const lista = ultimas(s.clave);
      const h = Sueno.horario(lista);
      const c = carta('sn-horario', tx('sueno.horario'), h ? el('em', 'in-estado ' + (h.regularidad === 'muyRegular' || h.regularidad === 'regular' ? 'enCamino' : 'despacio'), tx('sueno.regularidad.' + h.regularidad)) : null);
      // Cada noche como una barra de cuándo te dormiste a cuándo te despertaste.
      const g = el('div', 'sn-rangos');
      const medidas = lista.filter(Boolean);
      const desde = Math.min(...medidas.map((n) => n.dormirse)) - 30, hasta = Math.max(...medidas.map((n) => n.despertar)) + 30;
      lista.forEach((n, i) => {
        const clave = Fechas.sumarDias(s.clave, i - DIAS + 1);
        const fila = el('div', 'sn-rango' + (n ? '' : ' vacia') + (clave === s.clave ? ' elegida' : ''));
        const pista = el('div', 'sn-rango-pista');
        if (n) {
          const barra = el('i');
          barra.style.left = `${(((n.dormirse - desde) / (hasta - desde)) * 100).toFixed(1)}%`;
          barra.style.width = `${(((n.despertar - n.dormirse) / (hasta - desde)) * 100).toFixed(1)}%`;
          pista.appendChild(barra);
        }
        fila.append(el('span', null, tx('fecha.diasCortos.' + u.partes(clave).dia).charAt(0)), pista);
        g.appendChild(fila);
      });
      c.appendChild(g);
      const eje = el('div', 'pg-eje');
      eje.append(el('span', null, reloj(desde)), el('span', null, reloj(hasta)));
      c.appendChild(eje);
      if (!h) {
        c.appendChild(el('p', 'pg-texto', tx('sueno.faltanNoches', { n: medidas.length, minimo: Sueno.MINIMOS.regularidad })));
        return c;
      }
      const datos = el('div', 'sn-datos');
      const dato = (clave, valor) => { const d = el('div', 'sn-dato'); d.append(el('span', null, tx(clave)), el('b', null, valor)); datos.appendChild(d); };
      dato('sueno.dormirte', tx('sueno.horaYDesvio', { hora: reloj(h.dormirse), desvio: Math.round(h.desvioDormirse) }));
      dato('sueno.despertarte', tx('sueno.horaYDesvio', { hora: reloj(h.despertar), desvio: Math.round(h.desvioDespertar) }));
      if (h.finDeSemana != null && Math.abs(h.finDeSemana) >= 30) dato('sueno.finDeSemana', tx(h.finDeSemana > 0 ? 'sueno.masTarde' : 'sueno.masTemprano', { t: u.duracion(Math.abs(h.finDeSemana)) }));
      c.appendChild(datos);
      c.appendChild(el('p', 'sn-nota', tx('sueno.regularidadTexto', { n: h.noches })));
      return c;
    }

    // ------------------------------------------------------------ la deuda
    function deuda() {
      const lista = ultimas(s.clave);
      const d = Sueno.deudaDeSueno(lista, necesidad);
      const c = carta('sn-deuda', tx('sueno.deuda'));
      const cifra = el('div', 'pg-cifra');
      cifra.append(el('b', null, d ? (d.minutos < 15 ? tx('sueno.sinDeuda') : u.duracion(d.minutos)) : '—'), el('span', null, d && d.minutos >= 15 ? tx('sueno.deudaDe', { necesidad: u.duracion(necesidad) }) : ''));
      c.appendChild(cifra);
      c.appendChild(el('div', 'pg-nota', d ? tx('sueno.deudaNoches', { n: d.noches, de: d.de }) : tx('sueno.faltanNoches', { n: lista.filter(Boolean).length, minimo: Sueno.MINIMOS.deuda })));
      c.appendChild(el('p', 'sn-nota', tx('sueno.deudaTexto')));
      return c;
    }

    // ------------------------------------------------------------ lo que mide el reloj de noche
    function vitales(n) {
      const c = carta('sn-vitales', tx('sueno.vitales'));
      const fila = (tipo, unidad, dec) => {
        const lecturas = Datos.LECTURAS[tipo];
        const anteriores = anterioresA(n.clave).filter(Boolean)
          .map((x) => Sueno.vitalDeNoche(tipo, lecturas, x, []))
          .filter(Boolean).map((v) => v.valor);
        const v = Sueno.vitalDeNoche(tipo, lecturas, n, anteriores);
        const d = el('div', 'sn-vital');
        const nombre = el('span', 'sn-vital-nombre');
        nombre.innerHTML = icono(tipo === 'frecuencia' ? 'corazon' : tipo === 'variabilidad' ? 'onda' : 'pulmon');
        nombre.append(tx('sueno.vital.' + tipo));
        const valor = el('b', null, v ? `${numero(v.valor, dec)} ${unidad}` : '—');
        const comp = el('em', 'sn-comparado ' + (v && v.comparado ? v.comparado : ''), v ? (v.comparado ? tx('sueno.comparado.' + v.comparado) : tx('sueno.aprendiendo')) : tx('sueno.pocasLecturas'));
        d.append(nombre, valor, comp);
        if (v && tipo === 'variabilidad') d.appendChild(el('small', null, u.plural('sueno.lecturas', v.lecturas)));
        c.appendChild(d);
      };
      fila('frecuencia', 'lpm', 0);
      fila('variabilidad', 'ms', 0);
      fila('respiracion', 'rpm', 1);
      // La frecuencia en reposo es del día entero: va aparte y lo dice.
      const reposo = Datos.LECTURAS.reposo.get(n.clave);
      if (reposo) {
        const d = el('div', 'sn-vital sn-reposo');
        const nombre = el('span', 'sn-vital-nombre');
        nombre.innerHTML = icono('corazon');
        nombre.append(tx('sueno.vital.reposo'));
        d.append(nombre, el('b', null, `${reposo} lpm`), el('em', 'sn-comparado', tx('sueno.delDia')));
        c.appendChild(d);
      }
      c.appendChild(el('p', 'sn-nota', tx('sueno.vitalesTexto')));
      return c;
    }

    // ------------------------------------------------------------ de dónde sale cada dato
    function fuentes(n) {
      const c = carta('sn-fuentes', tx('sueno.fuentes'));
      // La precisión de la noche, de 0 a 5 (spec/aparatos.md): con un reloj, 4; sin reloj, 1.
      const conLoDeLaNoche = !!(n && !n.moss && Sueno.vitalDeNoche('frecuencia', Datos.LECTURAS.frecuencia, n, []));
      const nivel = Sueno.nivelDeLaNoche(n, conLoDeLaNoche);
      const precision = el('div', 'sn-precision');
      const puntos = el('span', 'sn-puntos');
      for (let i = 1; i <= 5; i++) puntos.appendChild(el('i', i <= nivel ? 'lleno' : null));
      precision.append(el('span', null, tx('sueno.precision.titulo')), puntos, el('b', null, tx('sueno.precision.niveles')[nivel]));
      c.appendChild(precision);
      const lista = el('ul', 'sn-fuentes-lista');
      const fila = (que, fuente, nivel) => {
        const li = el('li');
        const f = el('span', 'sn-fuente');
        f.innerHTML = icono(fuente && fuente.tipo === 'telefono' ? 'telefono' : 'reloj3');
        f.append(fuente ? fuente.nombre : '—');
        li.append(el('span', null, tx('sueno.datos.' + que)), f, nivel ? confianza(nivel) : el('em'));
        lista.appendChild(li);
      };
      if (n && n.moss) {
        // Sin reloj: la hora sale de Moss o de lo que contestaste; lo demás no lo sabe el teléfono.
        const quien = n.moss.origen === 'estimada' ? 'sueno.porMoss' : n.moss.origen === 'corregida' ? 'sueno.corregidaPorTi' : 'sueno.porTi';
        fila('duracion', { nombre: tx(quien), tipo: 'telefono' }, n.moss.origen === 'estimada' && n.moss.confianza !== 'alta' ? 'baja' : 'media');
        ['etapas', 'despertares', 'corazon', 'variabilidad'].forEach((k) => fila(k, null, null));
        c.appendChild(lista);
        c.appendChild(el('p', 'sn-nota', tx('sueno.fuentesSinReloj')));
        return c;
      }
      const reloj = Datos.FUENTES[0], iphone = Datos.FUENTES[1];
      fila('duracion', n ? n.fuente : null, n ? n.confianza.duracion : null);
      fila('etapas', n && n.conEtapas ? n.fuente : null, n ? n.confianza.etapas : null);
      fila('despertares', n ? n.fuente : null, n ? n.confianza.despertares : null);
      fila('enCama', n && n.enCama ? n.enCama.fuente : Datos.SOLO_EN_CAMA.has(s.clave) ? iphone : null, n && n.enCama ? n.confianza.enCama : Datos.SOLO_EN_CAMA.has(s.clave) ? 'baja' : null);
      fila('corazon', reloj, 'media');
      fila('variabilidad', reloj, 'baja');
      c.appendChild(lista);
      c.appendChild(el('p', 'sn-nota', tx('sueno.fuentesTexto')));
      return c;
    }

    // ------------------------------------------------------------ afinar (spec/sueno-sin-esfuerzo.md)
    // Sin reloj: el despertador de Moss (AlarmKit) y la guía de los Atajos que avisan a Moss, con lo que
    // llegó estos días. Con datos de mentira; en la app, src/secciones/sueno/Afinar.tsx.
    const GUARDADO_DESPERTADOR = 'moss-galeria-despertador';
    let despertador = { prendido: false, hora: 7, minuto: 0, dias: [1, 2, 3, 4, 5] };
    try { despertador = Object.assign(despertador, JSON.parse(localStorage.getItem(GUARDADO_DESPERTADOR) || '{}')); } catch (_) { /* no pasa nada */ }
    const guardarDespertador = () => { try { localStorage.setItem(GUARDADO_DESPERTADOR, JSON.stringify(despertador)); } catch (_) { /* no pasa nada */ } };
    const AUTOMATIZACIONES = [['alarma', 'alarmaParada'], ['conectar', 'cargadorConectado'], ['desconectar', 'cargadorDesconectado'], ['empieza', 'enfoqueEmpezo'], ['termina', 'enfoqueTermino']];
    // Lo que avisaron los Atajos estas noches: la alarma, el cargador y el enfoque Sueño con horario (23:15).
    function senales() {
      const en = (dias, h, m) => SinReloj.instanteDe(Fechas.sumarDias(Datos.HOY, dias), Datos.ZONA, (h < 18 ? h + 6 : h - 18) * 60 + m);
      return [
        ['enfoqueEmpezo', -2, 23, 15], ['alarmaParada', -1, 7, 1], ['enfoqueEmpezo', -1, 23, 15], ['cargadorConectado', -1, 23, 52],
        ['alarmaParada', 0, 7, 2], ['enfoqueEmpezo', 0, 23, 15], ['cargadorConectado', 0, 23, 41], ['cargadorDesconectado', 0, 7, 18],
      ].map(([que, dias, h, m], i) => ({ id: 'galeria-' + i, que, en: en(dias, h, m) })).sort((x, y) => x.en - y.en);
    }
    const zonaFija = () => Datos.ZONA;
    /** «hoy, 07:02», «ayer, 23:41» o «sáb, 23:15». */
    function cuando(ms) {
      const minutos = Math.floor(ms / 60000) + Datos.ZONA;
      const dia = Math.floor(minutos / 1440), hoy = Math.floor((SinReloj.instanteDe(Datos.HOY, Datos.ZONA, 360) / 60000 + Datos.ZONA) / 1440);
      const hora = u.horaMin(((minutos % 1440) + 1440) % 1440);
      if (dia === hoy) return tx('sueno.afinar.hoy', { hora });
      if (dia === hoy - 1) return tx('sueno.afinar.ayer', { hora });
      return tx('sueno.afinar.dia', { dia: tx('fecha.diasCortos.' + new Date(dia * 86400000).getUTCDay()), hora });
    }
    function resumenDespertador() {
      const d = [...despertador.dias].sort().join(',');
      const dias = !despertador.dias.length ? tx('sueno.afinar.despertador.unaVez')
        : despertador.dias.length === 7 ? tx('sueno.afinar.despertador.todos')
        : d === '1,2,3,4,5' ? tx('sueno.afinar.despertador.semana')
        : d === '0,6' ? tx('sueno.afinar.despertador.finDe')
        : [1, 2, 3, 4, 5, 6, 0].filter((x) => despertador.dias.includes(x)).map((x) => tx('fecha.diasCortos.' + x)).join(' ');
      return `${u.horaMin(despertador.hora * 60 + despertador.minuto)} · ${dias}`;
    }
    const llaveDelDespertador = () => {
      const llave = boton('in-llave', '<i></i>', () => {
        despertador.prendido = !despertador.prendido;
        guardarDespertador();
        pintar();
        if (hojaAfinar.abierta) pintarHoja();
      }, tx('sueno.afinar.despertador.titulo'));
      llave.setAttribute('aria-pressed', String(despertador.prendido));
      return llave;
    };
    function afinar() {
      const c = carta('sn-afinar', tx('sueno.afinar.titulo'));
      c.appendChild(el('p', 'sn-nota', tx('sueno.afinar.texto')));
      const fila = el('div', 'sn-afinar-fila');
      const textos = boton('sn-afinar-textos', '', () => abrirHoja('despertador'));
      textos.append(el('b', null, tx('sueno.afinar.despertador.titulo')), el('span', null, despertador.prendido ? resumenDespertador() : tx('sueno.afinar.despertador.apagado')));
      fila.append(textos, llaveDelDespertador());
      const atajos = boton('sn-afinar-fila sn-afinar-atajos', '', () => abrirHoja('atajos'));
      const t2 = el('span', 'sn-afinar-textos');
      t2.append(el('b', null, tx('sueno.afinar.atajos.titulo')), el('span', null, tx('sueno.afinar.atajos.fila')));
      atajos.appendChild(t2);
      atajos.insertAdjacentHTML('beforeend', icono('adelante'));
      c.append(fila, atajos);
      return c;
    }
    // Las dos hojas de «Afinar»: el despertador y los Atajos.
    const hojaAfinar = Util.hoja(tel, 'sn-hoja', () => { s.hoja = null; });
    function abrirHoja(cual, abierta) {
      s.hoja = cual;
      s.automatizacion = abierta || null;
      pintarHoja();
      hojaAfinar.abrir();
    }
    function pintarHoja() {
      const h = hojaAfinar.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx(s.hoja === 'despertador' ? 'sueno.afinar.despertador.titulo' : 'sueno.afinar.atajos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaAfinar.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos sn-hoja-cuerpo');
      if (s.hoja === 'despertador') {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        fila.append(el('b', null, tx('sueno.afinar.despertador.titulo')), llaveDelDespertador());
        caja.appendChild(fila);
        cuerpo.appendChild(caja);
        const mover = (m) => {
          const total = (((despertador.hora * 60 + despertador.minuto + m) % 1440) + 1440) % 1440;
          despertador.hora = Math.floor(total / 60);
          despertador.minuto = total % 60;
          guardarDespertador();
          valor.textContent = u.horaMin(total);
          pintar();
        };
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.despertador.hora')));
        const pasos = el('div', 'sn-hora-pasos');
        const valor = el('b', null, u.horaMin(despertador.hora * 60 + despertador.minuto));
        pasos.append(boton('sn-paso', '−', () => mover(-60), '−1 h'), boton('sn-paso', '−5', () => mover(-5), '−5 min'), valor, boton('sn-paso', '+5', () => mover(5), '+5 min'), boton('sn-paso', '+', () => mover(60), '+1 h'));
        cuerpo.appendChild(pasos);
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.despertador.dias')));
        const dias = el('div', 'fi-porciones sn-dias');
        [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
          const b = boton('fi-porcion', `<span>${tx('fecha.diasCortos.' + d).charAt(0)}</span>`, () => {
            despertador.dias = despertador.dias.includes(d) ? despertador.dias.filter((x) => x !== d) : [...despertador.dias, d];
            guardarDespertador();
            pintarHoja();
            pintar();
          }, tx('fecha.dias.' + d));
          b.setAttribute('aria-pressed', String(despertador.dias.includes(d)));
          dias.appendChild(b);
        });
        cuerpo.appendChild(dias);
        if (!despertador.dias.length) cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.despertador.sinDias')));
        ['texto', 'reloj', 'oculta'].forEach((k) => cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.despertador.' + k))));
      } else {
        const lista = senales();
        const semana = lista.filter((x) => x.en >= SinReloj.instanteDe(Datos.HOY, Datos.ZONA, 360) - 7 * 86400000);
        cuerpo.appendChild(el('p', 'pf-nota sn-atajos-texto', tx('sueno.afinar.atajos.texto')));
        cuerpo.appendChild(boton('sn-permitir sn-abrir-atajos', tx('sueno.afinar.atajos.abrir'), () => {}));
        AUTOMATIZACIONES.forEach(([cual, que]) => {
          const caja = el('section', 'pf-aviso sn-automatizacion' + (s.automatizacion === cual ? ' abierta' : ''));
          const ultima = semana.filter((x) => x.que === que).pop();
          const cab2 = boton('sn-automatizacion-cab', '', () => { s.automatizacion = s.automatizacion === cual ? null : cual; pintarHoja(); });
          const textos = el('span', 'sn-afinar-textos');
          textos.append(el('b', null, tx(`sueno.afinar.atajos.cuales.${cual}.titulo`)), el('span', ultima ? 'llego' : null, ultima ? tx('sueno.afinar.atajos.llego', { cuando: cuando(ultima.en) }) : tx('sueno.afinar.atajos.noLlego')));
          cab2.appendChild(textos);
          cab2.insertAdjacentHTML('beforeend', icono(s.automatizacion === cual ? 'arriba' : 'abajo'));
          caja.appendChild(cab2);
          if (s.automatizacion === cual) {
            const pasos = el('ol', 'sn-pasos');
            tx('sueno.afinar.atajos.pasos').forEach((p) => pasos.appendChild(el('li', null, p.replace('{activador}', tx(`sueno.afinar.atajos.cuales.${cual}.activador`)).replace('{accion}', tx(`sueno.afinar.atajos.cuales.${cual}.accion`)))));
            caja.appendChild(pasos);
          }
          cuerpo.appendChild(caja);
        });
        cuerpo.appendChild(el('p', 'pf-nota', tx('sueno.afinar.atajos.siri')));
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('sueno.afinar.atajos.recientes')));
        const recientes = el('div', 'sn-datos sn-recientes');
        [...semana].reverse().forEach((x) => {
          const d = el('div', 'sn-dato');
          const que = el('span', null, tx('sueno.afinar.atajos.senales.' + x.que));
          if (SinReloj.esProgramado(x, lista, zonaFija)) que.appendChild(el('small', null, ' · ' + tx('sueno.afinar.atajos.horario')));
          d.append(que, el('b', null, cuando(x.en)));
          recientes.appendChild(d);
        });
        cuerpo.appendChild(recientes);
      }
      h.append(cab, cuerpo);
    }

    pintar();
    return {
      zona,
      pintar,
      // Para las capturas: «Afinar» (`despertador`, `atajos` o `cerrar`; `prender` lo enciende) y bajar en la hoja.
      afinar(accion, arg) {
        if (accion === 'cerrar') hojaAfinar.cerrar();
        else if (accion === 'prender') { despertador.prendido = arg !== false; guardarDespertador(); pintar(); if (hojaAfinar.abierta) pintarHoja(); }
        else if (accion === 'bajarHoja') { const c = hojaAfinar.el.querySelector('.sn-hoja-cuerpo'); if (c) c.scrollTop = c.scrollHeight; }
        else abrirHoja(accion, arg);
      },
      // Las noches de la sección (de Salud y, sin reloj, las de Moss): las usa Ascent.
      noches,
      // Lo que contestó a la mañana de una noche (1 a 5), o null: lo usa la recuperación.
      cara: (clave) => caras[clave] || null,
      // Lo de anoche para el bloque de Inicio.
      anoche() {
        const n = noches().find((x) => x.clave === Datos.HOY);
        if (!n) return null;
        const q = Sueno.calidadDeNoche(n, necesidad, anterioresA(n.clave));
        return { dormido: n.dormido, dormirse: n.dormirse + 18 * 60, despertar: n.despertar + 18 * 60, calidad: q ? q.puntos : null, enCamaDesde: n.dormirse, enCamaHasta: n.despertar, tramos: n.tramos };
      },
      // Para las capturas y los botones de la galería: `k` días antes de hoy, o una clave.
      verNoche(k) { s.clave = typeof k === 'number' ? Fechas.sumarDias(Datos.HOY, k) : k; s.editando = null; pintar(); cont.scrollTop = 0; },
      // Para las capturas: la pregunta de la hora (`proponer`, `sinProponer`, `soloDormirse` o null), sin lo contestado antes.
      preguntarHora(modo) {
        s.soloDormirse = modo === 'soloDormirse';
        s.forzarHora = s.soloDormirse ? 'proponer' : modo;
        s.editandoHora = false;
        delete horas[Datos.HOY];
        ahoraNo.delete(Datos.HOY);
        pintar();
      },
      editarHora() { s.editandoHora = true; pintar(); },
      editarNoche(k) { s.clave = typeof k === 'number' ? Fechas.sumarDias(Datos.HOY, k) : k; s.editando = s.clave; pintar(); },
      olvidarHoras() {
        horas = {};
        conMovimiento = false;
        try { localStorage.removeItem(GUARDADO_HORAS); localStorage.removeItem(GUARDADO_MOVIMIENTO); } catch (_) { /* no pasa nada */ }
        pintar();
      },
      abrir(cual) { s.abierto = cual; pintar(); },
      // Para las capturas: la sugerencia de poco sueño por semanas.
      poco(si) { s.poco = si; pintar(); cont.scrollTop = 0; },
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTo({ top: Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 70), behavior: 'auto' });
      },
      subir() { cont.scrollTo(0, 0); },
    };
  }

  return { crear };
})();
