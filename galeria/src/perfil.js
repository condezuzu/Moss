// Perfil, la última sección (antes Ajustes): tus datos, las preferencias, Salud, los aparatos y
// Ascent, tus datos para llevar o borrar y de dónde salen los alimentos. Las metas pasaron a
// Progreso, con la estrategia. Es una maqueta: lo que hace cada fila ya está en la especificación.
// Aparatos (spec/aparatos.md) es una hoja: los que escriben tu sueño, de cuál sale la noche y qué
// llega de cada marca.

const SeccionPerfil = (() => {
  // Lo que anda solo con las dos apps vinculadas, con su ícono (antes en la sección de Ascent).
  const CON_ASCENT = [['peso', 'balanza'], ['calorias', 'rayo'], ['objetivo', 'objetivo'], ['cuenta', 'amigos'], ['proteina', 'pesa'], ['gimnasio', 'estrella']];
  // Las marcas de Aparatos, en el orden en que miden mejor el sueño (spec/aparatos.md, «El orden»).
  const MARCAS = ['appleWatch', 'oura', 'google', 'whoop', 'polar', 'garmin', 'withings', 'ringconn', 'ultrahuman', 'amazfit', 'coros', 'suunto', 'eightSleep', 'samsung'];
  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;

    const zona = el('section', 'perfil pagina-app');
    zona.innerHTML = '<div class="pf-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.pf-scroll');
    const hoja = Util.hoja(tel, 'pf-hoja', () => opciones.alCambiar());
    const s = { abierta: null, fuente: 'auto', sinDeficit: false, numeros: true, buscar: false, avisos: { dormir: false, antes: 30, comidas: [], maximo: 6, horario: {}, pesarse: false, todos: false } };

    /** La precisión, en puntos: de 1 (estimada con el teléfono) a 4 (con etapas y lo de la noche). */
    const puntos = (nivel) => {
      const p = el('span', 'sn-puntos');
      for (let i = 1; i <= 5; i++) p.appendChild(el('i', i <= nivel ? 'lleno' : null));
      return p;
    };
    function pintarAparatos() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.aparatos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-aparatos');
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.aparatos.arriba')));
      // Los que escribieron sueño en Salud el último mes, con su precisión.
      const sinReloj = opciones.sinReloj();
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.aparatos.tuyos')));
      const tuyos = el('ul', 'pf-lista pf-tuyos');
      const tuyo = (marca, n, nivel) => {
        const li = el('li');
        const txt = el('div');
        txt.append(el('b', null, tx(`perfil.aparatos.marcas.${marca}.nombre`)), el('span', null, u.plural('perfil.aparatos.noches', n)));
        li.append(txt, puntos(nivel));
        tuyos.appendChild(li);
      };
      if (sinReloj) tuyo('iphone', opciones.nochesSinReloj(), 1);
      else tuyo('appleWatch', Datos.NOCHES.filter((n) => n.clave > Fechas.sumarDias(Datos.HOY, -30)).length, 4);
      cuerpo.appendChild(tuyos);
      // De cuál sale la noche: la automática (la más precisa de cada noche) o la que elijas.
      if (!sinReloj) {
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.aparatos.laNoche')));
        const opcionesDeFuente = el('ul', 'pf-lista pf-opciones');
        [['auto', tx('perfil.aparatos.automatica'), tx('perfil.aparatos.automaticaTexto')], ['appleWatch', 'Apple Watch', null]].forEach(([v, nombre, texto]) => {
          const li = el('li', s.fuente === v ? 'elegida' : null);
          const txt = el('div');
          txt.appendChild(el('b', null, nombre));
          if (texto) txt.appendChild(el('span', null, texto));
          li.append(txt, el('i', 'pf-marca-punto'));
          li.addEventListener('click', () => {
            s.fuente = v;
            opcionesDeFuente.querySelectorAll('li').forEach((x) => x.classList.toggle('elegida', x === li));
          });
          opcionesDeFuente.appendChild(li);
        });
        cuerpo.appendChild(opcionesDeFuente);
      }
      // Qué llega de cada marca: cada una se despliega con su texto.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.aparatos.cadaUno')));
      const marcas = el('ul', 'pf-lista pf-marcas');
      [...(sinReloj ? ['iphone'] : []), ...MARCAS].forEach((m) => {
        const li = el('li', s.abierta === m ? 'abierta' : null);
        const fila = boton('pf-marca', `<span>${tx(`perfil.aparatos.marcas.${m}.nombre`)}</span>${icono('adelante')}`, () => {
          s.abierta = s.abierta === m ? null : m;
          marcas.querySelectorAll('li').forEach((x) => x.classList.toggle('abierta', x === li && s.abierta === m));
        });
        const texto = el('div', 'pf-marca-texto');
        texto.appendChild(el('p', null, tx(`perfil.aparatos.marcas.${m}.texto`)));
        li.append(fila, texto);
        marcas.appendChild(li);
      });
      cuerpo.appendChild(marcas);
      cuerpo.appendChild(el('p', 'pf-nota pf-varios', tx('perfil.aparatos.varios')));
      h.append(cab, cuerpo);
    }
    function abrirAparatos() {
      pintarAparatos();
      hoja.abrir();
      opciones.alCambiar();
    }

    // Los avisos (lo pediste el 22/10): la hora de dormir, las comidas sin anotar y cuántos por día,
    // como en la app (Perfil.tsx). Los de cada hábito se eligen en el hábito.
    function pintarAvisos() {
      const h = hoja.el;
      const arriba = h.querySelector('.pf-avisos') ? h.querySelector('.pf-avisos').scrollTop : 0;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.avisos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const a = s.avisos;
      const chips = (valores, nombre, elegido, alElegir) => {
        const fila = el('div', 'fi-porciones pf-aviso-chips');
        valores.forEach((v) => {
          const b = boton('fi-porcion', `<span>${nombre(v)}</span>`, () => { alElegir(v); pintarAvisos(); pintar(); });
          b.setAttribute('aria-pressed', String(elegido(v)));
          fila.appendChild(b);
        });
        return fila;
      };
      const bloque = (titulo, texto, encendido, alCambiar, debajo) => {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        const llave = boton('in-llave', '<i></i>', () => { alCambiar(!encendido); pintarAvisos(); pintar(); }, titulo);
        llave.setAttribute('aria-pressed', String(encendido));
        fila.append(el('b', null, titulo), llave);
        caja.append(fila, el('p', 'pf-nota', texto));
        if (encendido && debajo) caja.appendChild(debajo);
        cuerpo.appendChild(caja);
      };
      bloque(tx('perfil.avisos.dormir'), tx('perfil.avisos.dormirTexto', { hora: '23:20' }), a.dormir, (v) => { a.dormir = v; },
        chips([15, 30, 45, 60], (n) => tx('perfil.avisos.antes', { n }), (n) => a.antes === n, (n) => { a.antes = n; }));
      // El horario de comidas: cada comida elegida, con su hora de a un cuarto de hora (como Perfil.tsx).
      const HORAS = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };
      const reloj = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const filas = el('div', 'pf-horario');
      ['desayuno', 'almuerzo', 'merienda', 'cena'].forEach((c) => {
        const fila = el('div', 'pf-horario-fila');
        const elegida = a.horario[c] !== undefined;
        const chip = boton('fi-porcion', `<span>${tx('comida.comidas.' + c)}</span>`, () => {
          if (elegida) delete a.horario[c]; else a.horario[c] = HORAS[c];
          pintarAvisos(); pintar();
        });
        chip.setAttribute('aria-pressed', String(elegida));
        fila.appendChild(chip);
        if (elegida) {
          const mover = (dm) => { a.horario[c] = Math.min(23 * 60 + 45, Math.max(5 * 60, a.horario[c] + dm)); pintarAvisos(); };
          const pasos = el('div', 'fi-stepper pf-horario-pasos');
          pasos.append(boton('fi-paso', icono('menos'), () => mover(-15), '−15'), el('b', 'fi-valor', reloj(a.horario[c])), boton('fi-paso', icono('mas'), () => mover(15), '+15'));
          fila.appendChild(pasos);
        }
        filas.appendChild(fila);
      });
      bloque(tx('perfil.avisos.horario'), tx('perfil.avisos.horarioTexto'), Object.keys(a.horario).length > 0,
        (v) => { a.horario = v ? { desayuno: HORAS.desayuno, almuerzo: HORAS.almuerzo, cena: HORAS.cena } : {}; }, filas);
      bloque(tx('perfil.avisos.pesarse'), tx('perfil.avisos.pesarseTexto'), a.pesarse, (v) => { a.pesarse = v; },
        chips([false, true], (todos) => tx(todos ? 'perfil.avisos.pesarseTodos' : 'perfil.avisos.pesarseControl'), (todos) => a.todos === todos, (todos) => { a.todos = todos; }));
      bloque(tx('perfil.recordatoriosLlave'), tx('perfil.recordatoriosTexto'), a.comidas.length > 0, (v) => { a.comidas = v ? ['desayuno', 'almuerzo', 'cena'] : []; },
        chips(['desayuno', 'almuerzo', 'merienda', 'cena'], (c) => tx('comida.comidas.' + c), (c) => a.comidas.includes(c),
          (c) => { a.comidas = a.comidas.includes(c) ? a.comidas.filter((x) => x !== c) : [...a.comidas, c]; }));
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.avisos.maximo')));
      cuerpo.appendChild(chips([2, 3, 4, 6, 8], String, (n) => a.maximo === n, (n) => { a.maximo = n; }));
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.avisos.maximoTexto')));
      h.append(cab, cuerpo);
      cuerpo.scrollTop = arriba;
    }
    // Cuándo entrenás (lo pediste el 26/10): con esto, Comida dice qué comer antes y después, en la
    // comida que toca. Como en la app (Perfil.tsx, CuandoEntrenas).
    function pintarEntreno() {
      const h = hoja.el;
      h.innerHTML = '';
      const e = opciones.comida.entreno;
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('entreno.perfil.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const poner = (cambios, ver) => { const nuevo = Object.assign({}, e, cambios); delete nuevo.ver; opciones.comida.ponerEntreno(nuevo, ver); pintarEntreno(); pintar(); };
      const chips = (valores, nombre, elegido, alElegir) => {
        const fila = el('div', 'fi-porciones pf-aviso-chips');
        valores.forEach((v) => {
          const b = boton('fi-porcion', `<span>${nombre(v)}</span>`, () => alElegir(v));
          b.setAttribute('aria-pressed', String(elegido(v)));
          fila.appendChild(b);
        });
        return fila;
      };
      cuerpo.appendChild(el('p', 'pf-nota', tx('entreno.perfil.texto')));
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('entreno.perfil.dias')));
      cuerpo.appendChild(chips(DIAS, (d) => tx('fecha.diasCortos.' + d), (d) => e.dias.includes(d), (d) => poner({ dias: e.dias.includes(d) ? e.dias.filter((x) => x !== d) : [...e.dias, d] })));
      if (!e.dias.length) { h.append(cab, cuerpo); return; }
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('entreno.perfil.hora')));
      const reloj = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const pasos = el('div', 'fi-stepper');
      pasos.append(boton('fi-paso', icono('menos'), () => poner({ hora: Math.max(5 * 60, e.hora - 15) }), '−15'), el('b', 'fi-valor', reloj(e.hora)), boton('fi-paso', icono('mas'), () => poner({ hora: Math.min(23 * 60, e.hora + 15) }), '+15'));
      cuerpo.appendChild(pasos);
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('entreno.perfil.duracion')));
      cuerpo.appendChild(chips([30, 45, 60, 90, 120], (n) => tx('entreno.perfil.minutos', { n }), (n) => e.minutos === n, (n) => poner({ minutos: n })));
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('entreno.perfil.tipo')));
      cuerpo.appendChild(chips(['fuerza', 'resistencia', 'mixta'], (x) => tx('entreno.perfil.tipos.' + x), (x) => e.tipo === x, (x) => poner({ tipo: x })));
      const caja = el('section', 'pf-aviso');
      const fila = el('div', 'pf-aviso-fila');
      const llave = boton('in-llave', '<i></i>', () => poner({}, !e.ver), tx('entreno.perfil.ver'));
      llave.setAttribute('aria-pressed', String(e.ver));
      fila.append(el('b', null, tx('entreno.perfil.ver')), llave);
      caja.append(fila, el('p', 'pf-nota', tx('entreno.porQue.medico')));
      cuerpo.appendChild(caja);
      h.append(cab, cuerpo);
    }
    const DIAS = [1, 2, 3, 4, 5, 6, 0];
    function resumenDeEntreno(e) {
      if (!e.dias.length) return tx('entreno.perfil.sinCargar');
      const h = `${String(Math.floor(e.hora / 60)).padStart(2, '0')}:${String(e.hora % 60).padStart(2, '0')}`;
      const dias = DIAS.filter((d) => e.dias.includes(d));
      const cuales = dias.length === 7 ? tx('entreno.perfil.todos')
        : dias.length === 5 && dias.every((d) => d >= 1 && d <= 5) ? tx('entreno.perfil.entreSemana')
          : dias.length <= 3 ? dias.map((d) => tx('fecha.diasCortos.' + d)).join(' ')
            : tx('entreno.perfil.nDias', { n: dias.length });
      return `${cuales} · ${h}`;
    }
    function abrirEntreno() {
      pintarEntreno();
      hoja.abrir();
    }

    function abrirAvisos() {
      pintarAvisos();
      hoja.abrir();
      opciones.alCambiar();
    }

    function pintar() {
      cont.innerHTML = '';
      const p = opciones.persona().perfil;
      const cab = el('header', 'pf-cab');
      const inicial = el('div', 'pf-inicial', p.nombre.charAt(0));
      const nombres = el('div', 'pf-nombres');
      nombres.append(el('h2', null, p.nombre));
      cab.append(inicial, nombres);
      cont.appendChild(cab);

      const grupo = (titulo, filas) => {
        cont.appendChild(el('h3', 'pf-grupo', tx(titulo)));
        const ul = el('ul', 'pf-lista');
        filas.forEach(([clave, valor, conFlecha, clase, alTocar, sub]) => {
          const li = el('li', (conFlecha ? 'pf-tocable ' : '') + (clase || ''));
          const nombre = el('span', null, tx(clave));
          // Una fila puede decir debajo, chico, qué hace.
          if (sub) nombre.appendChild(el('small', 'pf-sub', tx(sub)));
          li.append(nombre, el('b', null, valor));
          if (conFlecha) li.insertAdjacentHTML('beforeend', icono('adelante'));
          if (alTocar) li.addEventListener('click', alTocar);
          ul.appendChild(li);
        });
        cont.appendChild(ul);
      };
      const edad = Number(Datos.HOY.slice(0, 4)) - p.nacimiento;
      grupo('perfil.tusDatos', [
        ['perfil.sexo', tx('perfil.sexos.' + p.sexo), true],
        ['perfil.edad', tx('perfil.anios', { n: edad }), true],
        ['perfil.altura', `${numero(p.alturaCm)} cm`, true],
        ['perfil.actividad', tx('perfil.actividades.' + p.actividad), true],
        // Para qué comer antes y después de entrenar (Comida); con «sin déficit» no se ve.
        ...(s.sinDeficit || !opciones.comida ? [] : [['entreno.perfil.titulo', resumenDeEntreno(opciones.comida.entreno), true, null, abrirEntreno]]),
        // Sin déficit: embarazo, lactancia o una condición médica (no se guarda cuál).
        ['perfil.cuidado', tx(s.sinDeficit ? 'perfil.sinDeficit' : 'perfil.ninguno'), true, s.sinDeficit ? 'ok' : null, () => { s.sinDeficit = !s.sinDeficit; pintar(); }, s.sinDeficit ? 'perfil.sinDeficitTexto' : null],
      ]);
      grupo('perfil.preferencias', [
        ['perfil.unidades', tx('perfil.metrico'), true],
        ['perfil.idioma', u.idioma() === 'es' ? 'Español' : 'English', true],
        ['perfil.calidad', tx('perfil.alta'), true],
        ['perfil.recordatorios', tx(s.avisos.dormir || s.avisos.comidas.length || Object.keys(s.avisos.horario).length || s.avisos.pesarse ? 'perfil.encendidos' : 'perfil.apagados'), true, null, abrirAvisos],
        // Ocultar los números: sin calorías ni gramos, solo las figuras y las barras.
        ['perfil.numeros', tx(s.numeros ? 'perfil.visibles' : 'perfil.ocultos'), true, null, () => { s.numeros = !s.numeros; opciones.alNumeros(s.numeros); pintar(); }, 'perfil.numerosTexto'],
      ]);
      grupo('perfil.conexiones', [
        ['perfil.salud', tx('perfil.conectada'), true, 'ok'],
        ['perfil.aparatos.titulo', opciones.sinReloj() ? tx('perfil.aparatos.soloIphone') : 'Apple Watch', true, null, abrirAparatos],
        // Lleva a la sección de Ascent, arriba de Hábitos: ahí se vincula y se ve lo de las dos.
        opciones.vinculada() ? ['perfil.ascent', tx('perfil.vinculada'), true, 'ok', opciones.abrirAscent] : ['perfil.ascent', tx('perfil.vincular'), true, 'accion', opciones.abrirAscent],
      ]);
      grupo('perfil.tusDatosParaLlevar', [
        ['perfil.exportar', 'CSV', true],
        ['perfil.privacidad', '', true],
        // Lo que se busca y no se encuentra sale sin la cuenta, solo si se elige (guía 5.1.1 de Apple).
        ['perfil.mejorarBase', tx(s.buscar ? 'perfil.si' : 'perfil.no'), true, null, () => { s.buscar = !s.buscar; pintar(); }, 'perfil.mejorarBaseTexto'],
        ['perfil.politica', '', true],
        ['perfil.terminos', '', true],
        ['perfil.contacto', '', true],
        ['perfil.borrarDatos', '', false, 'peligro'],
        // Avisa que la cuenta es la misma en Ascent (spec/ascent.md, «Borrar la cuenta»).
        ['perfil.borrarCuenta', '', false, 'peligro'],
      ]);
      // De dónde salen los alimentos y las estrellas, con su licencia, como en la app (Perfil.tsx).
      cont.appendChild(el('h3', 'pf-grupo', tx('perfil.creditos')));
      const creditos = el('ul', 'pf-lista pf-creditos');
      ['usda', 'off', 'taco', 'ciqual', 'cofid', 'estrellas'].forEach((f) => creditos.appendChild(el('li', null, tx('perfil.fuentes.' + f))));
      cont.appendChild(creditos);
      // Al final, lo que anda solo si vinculas Ascent (lo pediste el 22/10): información, no una función de Perfil.
      cont.appendChild(el('h3', 'pf-grupo', tx('perfil.informacion')));
      cont.appendChild(el('p', 'pf-nota', tx('perfil.informacionAscent')));
      const conAscent = el('ul', 'pf-lista pf-con-ascent');
      CON_ASCENT.forEach(([k, ic]) => {
        const li = el('li');
        li.innerHTML = icono(ic);
        const txt = el('div');
        txt.append(el('b', null, tx(`ascent.funciones.${k}.titulo`)), el('span', null, tx(`ascent.funciones.${k}.texto`)));
        li.appendChild(txt);
        conAscent.appendChild(li);
      });
      cont.appendChild(conAscent);
      const salir = boton('pf-salir', tx('perfil.cerrarSesion'), () => {});
      cont.appendChild(salir);
      cont.appendChild(el('p', 'pf-version', 'Moss 1.0 (1)'));
    }

    pintar();
    return {
      zona,
      pintar,
      abrirAparatos,
      abrirAvisos,
      abrirEntreno,
      // Para las capturas: los avisos encendidos.
      ponerAvisos(cambios) { Object.assign(s.avisos, cambios); if (hoja.abierta) pintarAvisos(); pintar(); },
      // Para las capturas: los números ocultos y sin déficit.
      poner(cambios) { Object.assign(s, cambios); if ('numeros' in cambios) opciones.alNumeros(s.numeros); pintar(); },
      // Para las capturas: una marca desplegada.
      desplegar(m) { s.abierta = m; pintarAparatos(); },
      bajarHoja() { const c = hoja.el.querySelector('.pf-aparatos'); if (c) c.scrollTop = c.scrollHeight; },
      get hojaAbierta() { return hoja.abierta; },
      cerrarHoja() { hoja.cerrar(true); },
    };
  }

  return { crear };
})();
