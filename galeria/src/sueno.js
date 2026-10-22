// Sueño (spec/sueno.md): lo que Salud trae de cada noche, armado con las reglas de la app (Sueno,
// src/dominio/sueno.ts). Arriba, la pregunta de cada mañana (cómo dormiste, con cinco caras) y las
// últimas dos semanas para elegir una noche; después, esa noche (cuánto dormiste, cuándo, las etapas
// como estimación, lo despierto), la deuda, que es lo que más gente puede tener bien, su calidad con
// de qué sale, el horario y qué tan regular es, lo que mide el reloj de noche, y de dónde sale cada
// dato y qué tan confiable es. Lo que falta se muestra en gris: nunca se inventa.

const SeccionSueno = (() => {
  const DIAS = 14;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const s = { clave: Datos.HOY, abierto: null, cambiando: false };
    // Lo que contestó cada mañana, de 1 a 5, por noche: queda en este navegador, como quedaría en el
    // teléfono. «Ahora no» la esconde solo por hoy.
    const GUARDADO_CARAS = 'moss-galeria-caras';
    let caras = {};
    try { caras = JSON.parse(localStorage.getItem(GUARDADO_CARAS) || '{}') || {}; } catch (_) { caras = {}; }
    const ahoraNo = new Set();
    function ponerCara(clave, cara) {
      caras[clave] = cara;
      try { localStorage.setItem(GUARDADO_CARAS, JSON.stringify(caras)); } catch (_) { /* no pasa nada */ }
      s.cambiando = false;
      pintar();
      if (opciones.alCambiarCara) opciones.alCambiarCara();
    }
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);

    const zona = el('section', 'sueno pagina-app');
    zona.innerHTML = '<div class="sn-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.sn-scroll');

    const noches = () => opciones.noches();
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
      const pregunta = manana();
      if (pregunta) cont.appendChild(pregunta);
      cont.appendChild(tira());
      // Con Ascent, la recuperación de hoy también vive acá: cruza justo el sueño con el entrenamiento.
      const rec = s.clave === Datos.HOY && opciones.recuperacion ? opciones.recuperacion() : null;
      if (rec) cont.appendChild(recuperacion(rec));
      const noche = noches().find((n) => n.clave === s.clave) || null;
      cont.appendChild(noche ? laNoche(noche) : sinNoche(s.clave));
      // La deuda va segunda: solo necesita cuánto dormiste, así que es lo que más gente tiene bien.
      cont.appendChild(deuda());
      if (noche) cont.appendChild(calidad(noche));
      cont.appendChild(horario());
      if (noche) cont.appendChild(vitales(noche));
      cont.appendChild(fuentes(noche));
      cont.appendChild(el('p', 'sn-pie', tx('sueno.noMedico')));
      cont.scrollTop = arriba;
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
      if (!cara && ahoraNo.has(clave)) return null;
      const nombres = tx('sueno.manana.caras');
      if (cara && !s.cambiando) {
        const c = el('div', 'sn-manana-hecha');
        c.innerHTML = caraSvg(cara);
        c.append(el('span', null, tx('sueno.manana.respondida', { cara: nombres[cara - 1].toLowerCase() })),
          boton('sn-manana-cambiar', tx('sueno.manana.cambiar'), () => { s.cambiando = true; pintar(); }));
        return c;
      }
      const c = carta('sn-manana', null);
      c.appendChild(el('p', 'sn-manana-pregunta', tx('sueno.manana.pregunta')));
      const fila = el('div', 'sn-caras');
      nombres.forEach((nombre, i) => {
        fila.appendChild(boton('sn-cara' + (cara === i + 1 ? ' elegida' : ''), caraSvg(i + 1) + `<span>${nombre}</span>`, () => ponerCara(clave, i + 1), nombre));
      });
      c.appendChild(fila);
      c.appendChild(boton('sn-ahora-no', tx('sueno.manana.ahoraNo'), () => {
        if (cara) s.cambiando = false;
        else ahoraNo.add(clave);
        pintar();
      }));
      return c;
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
        const b = boton('sn-noche' + (clave === s.clave ? ' elegida' : '') + (n ? '' : soloCama ? ' cama' : ' vacia'), '', () => { s.clave = clave; pintar(); });
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
      if (!q) { c.appendChild(el('p', 'pg-texto', tx('sueno.sinCalidad'))); return c; }
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
        x.append(el('span', null, tx('sueno.partes.' + parte)), el('b', null, puntos == null ? tx('sueno.todaviaNo') : `${puntos} / ${max}`), barra);
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
        if (v && tipo === 'variabilidad') d.appendChild(el('small', null, tx('sueno.lecturas', { n: v.lecturas })));
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
      const lista = el('ul', 'sn-fuentes-lista');
      const fila = (que, fuente, nivel) => {
        const li = el('li');
        const f = el('span', 'sn-fuente');
        f.innerHTML = icono(fuente && fuente.tipo === 'telefono' ? 'telefono' : 'reloj3');
        f.append(fuente ? fuente.nombre : '—');
        li.append(el('span', null, tx('sueno.datos.' + que)), f, nivel ? confianza(nivel) : el('em'));
        lista.appendChild(li);
      };
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

    pintar();
    return {
      zona,
      pintar,
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
      verNoche(k) { s.clave = typeof k === 'number' ? Fechas.sumarDias(Datos.HOY, k) : k; pintar(); cont.scrollTop = 0; },
      abrir(cual) { s.abierto = cual; pintar(); },
      bajarA(selector) {
        const n = cont.querySelector(selector);
        if (n) cont.scrollTo({ top: Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 70), behavior: 'auto' });
      },
      subir() { cont.scrollTo(0, 0); },
    };
  }

  return { crear };
})();
