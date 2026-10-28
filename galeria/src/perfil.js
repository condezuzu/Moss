// Perfil, la última sección (antes Ajustes): arriba, la persona (su foto o su inicial, y su nombre),
// que abre Editar perfil; tus datos, las preferencias, Salud, los aparatos y Ascent, tus datos para
// llevar o borrar y de dónde salen los alimentos. Las metas pasaron a Progreso, con la estrategia.
// Es una maqueta: lo que hace cada fila ya está en la especificación.
// Aparatos (spec/aparatos.md) es una hoja: los que escriben tu sueño, de cuál sale la noche y qué
// llega de cada marca.

const SeccionPerfil = (() => {
  // Lo que anda solo con las dos apps vinculadas, con su ícono (antes en la sección de Ascent).
  const CON_ASCENT = [['peso', 'balanza'], ['calorias', 'rayo'], ['objetivo', 'objetivo'], ['proteina', 'pesa'], ['gimnasio', 'estrella']];
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

    // ------------------------------------------------------------ la persona y Editar perfil
    // Arriba de Perfil, la persona: su foto (o su inicial; sin nombre, la silueta) y su nombre, con el
    // correo de la cuenta debajo. Tocarla abre Editar perfil, como en la app (Perfil.tsx): la foto, el
    // nombre y tus datos, que se guardan juntos. La foto queda solo en el teléfono: acá se elige de
    // verdad (en el iPhone, con la cámara o las fotos) y se recorta cuadrada y chica, como en la app
    // (src/secciones/perfil/foto.ts).
    // Cerrar sin «Guardar» deja todo como estaba.
    const editar = Util.hoja(tel, 'hh-hoja pf-hoja-editar', () => { ed = null; opciones.alCambiar(); });
    const CORREO = 'agustin@icloud.com';
    const CAMARA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 8.5a2 2 0 0 1 2-2h1.8l1.4-2h4.6l1.4 2h1.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.4"/></svg>';
    const FOTOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4"/></svg>';
    const RANGOS = Metas.RANGOS_DEL_CUESTIONARIO;
    // Lo guardado: el nombre (el de la persona de mentira), la foto y tus datos, si se cambiaron.
    Object.assign(s, { nombre: opciones.persona().perfil.nombre || '', foto: null, datos: null });
    // Lo que se está editando, hasta «Guardar».
    let ed = null;
    const datosDe = () => {
      const p = opciones.persona().perfil;
      return s.datos || { sexo: p.sexo, edad: Number(Datos.HOY.slice(0, 4)) - p.nacimiento, alturaCm: p.alturaCm, actividad: p.actividad };
    };
    const inicial = (nombre) => ([...nombre.trim()][0] || '').toLocaleUpperCase();

    // El círculo se rehace en su lugar: así el oro entra con una transición al escribir la primera letra.
    function pintarAvatar(a, foto, nombre, grande) {
      a.className = 'pf-avatar' + (grande ? ' grande' : '') + (!foto && !nombre.trim() ? ' vacio' : '');
      if (foto) {
        const img = a.querySelector('img') || el('img');
        if (img.getAttribute('src') !== foto) img.src = foto;
        img.alt = '';
        a.replaceChildren(img);
      } else if (nombre.trim()) a.textContent = inicial(nombre);
      else a.innerHTML = icono('perfil');
      return a;
    }
    const avatar = (foto, nombre, grande) => pintarAvatar(el('div'), foto, nombre, grande);

    // Lo que trae el selector, con el cuadrado del medio achicado a 512 px.
    function achicar(archivo) {
      return createImageBitmap(archivo).then((imagen) => {
        const lado = Math.min(imagen.width, imagen.height);
        const destino = Math.min(512, lado);
        const lienzo = el('canvas');
        lienzo.width = destino;
        lienzo.height = destino;
        const ctx = lienzo.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, destino, destino);
        return lienzo.toDataURL('image/jpeg', 0.85);
      });
    }
    function elegirFoto(conCamara) {
      const entrada = el('input');
      entrada.type = 'file';
      entrada.accept = 'image/*';
      if (conCamara) entrada.setAttribute('capture', 'user');
      entrada.addEventListener('change', () => {
        const archivo = entrada.files && entrada.files[0];
        if (!archivo || !ed) return;
        achicar(archivo).then((url) => {
          if (!ed) return;
          ed.foto = url;
          pintarEditar(true);
        }).catch(() => {});
      });
      entrada.click();
    }
    // Para las capturas: una foto de mentira, un atardecer sobre las sierras.
    function fotoDeMentira() {
      const lienzo = el('canvas');
      lienzo.width = 512;
      lienzo.height = 512;
      const x = lienzo.getContext('2d');
      const cielo = x.createLinearGradient(0, 0, 0, 512);
      [[0, '#f2c48d'], [0.45, '#c98a8a'], [0.75, '#5d5a8c'], [1, '#262b4d']].forEach(([en, color]) => cielo.addColorStop(en, color));
      x.fillStyle = cielo;
      x.fillRect(0, 0, 512, 512);
      const sol = x.createRadialGradient(300, 250, 0, 300, 250, 74);
      sol.addColorStop(0, 'rgba(255, 242, 214, 1)');
      sol.addColorStop(0.55, 'rgba(255, 226, 180, 0.85)');
      sol.addColorStop(1, 'rgba(255, 226, 180, 0)');
      x.fillStyle = sol;
      x.fillRect(200, 150, 200, 200);
      const sierra = (color, puntos) => {
        x.fillStyle = color;
        x.beginPath();
        x.moveTo(0, 512);
        puntos.forEach(([px, py]) => x.lineTo(px, py));
        x.lineTo(512, 512);
        x.fill();
      };
      sierra('#3b3c66', [[0, 330], [90, 282], [170, 318], [260, 264], [350, 310], [430, 272], [512, 300]]);
      sierra('#1d2140', [[0, 402], [110, 352], [200, 390], [300, 342], [400, 380], [512, 352]]);
      return lienzo.toDataURL('image/jpeg', 0.85);
    }

    function pintarEditar(mantener) {
      const h = editar.el;
      const antes = h.querySelector('.hh-cuerpo');
      const arriba = mantener && antes ? antes.scrollTop : 0;
      h.innerHTML = '';
      h.setAttribute('aria-label', tx('perfil.editar.titulo'));
      const cab = el('header', 'hh-cab');
      cab.append(el('h3', 'hh-titulo', tx('perfil.editar.titulo')), boton('hb-cerrar', icono('cerrar'), () => editar.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'hh-cuerpo');

      // La foto, sus dos botones y dónde queda. Solo lo que cambió entra con un fundido.
      const caja = el('div', 'pf-editar-foto');
      const grande = avatar(ed.foto, ed.nombre, true);
      grande.setAttribute('role', 'img');
      grande.setAttribute('aria-label', tx('perfil.editar.foto'));
      const otraFoto = ed.foto !== ed.fotoPintada;
      if (otraFoto) grande.classList.add('entra');
      ed.fotoPintada = ed.foto;
      const botones = el('div', 'pf-editar-botones');
      botones.append(
        boton('cm-accion', `${CAMARA}<span>${tx('perfil.editar.sacarFoto')}</span>`, () => elegirFoto(true)),
        boton('cm-accion', `${FOTOS}<span>${tx('perfil.editar.elegirFoto')}</span>`, () => elegirFoto(false)),
      );
      caja.append(grande, botones);
      if (ed.foto) {
        const quitar = boton('pf-quitar-foto', tx('perfil.editar.quitarFoto'), () => { ed.foto = null; pintarEditar(true); });
        if (otraFoto) quitar.classList.add('entra');
        caja.appendChild(quitar);
      }
      caja.appendChild(el('p', 'pf-editar-nota', tx('perfil.editar.fotoNota')));
      cuerpo.appendChild(caja);

      // El nombre: sin uno guardado, Moss lo pide.
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.editar.nombre')));
      if (!s.nombre.trim()) cuerpo.appendChild(el('p', 'pf-pedido', tx('perfil.editar.sinNombre')));
      const campo = el('input', 'hh-campo');
      campo.type = 'text';
      campo.maxLength = 60;
      campo.value = ed.nombre;
      campo.placeholder = tx('perfil.editar.nombreCampo');
      campo.autocomplete = 'name';
      campo.setAttribute('aria-label', tx('perfil.editar.nombre'));
      campo.addEventListener('input', () => {
        ed.nombre = campo.value;
        // Sin foto, el círculo grande muestra la inicial de lo que se escribe.
        if (!ed.foto) pintarAvatar(grande, null, ed.nombre, true);
      });
      cuerpo.appendChild(campo);

      // Tus datos, como estaban en su hoja: no cambian las metas.
      const d = ed.datos;
      const repintar = () => pintarEditar(true);
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.sexo')));
      const sexos = el('div', 'aj-segmento');
      ['f', 'm'].forEach((v) => {
        const b = boton('aj-seg', '', () => { d.sexo = v; repintar(); });
        b.textContent = tx('perfil.sexos.' + v);
        b.setAttribute('aria-pressed', String(d.sexo === v));
        sexos.appendChild(b);
      });
      cuerpo.appendChild(sexos);
      const pasos = (valor, bajar, subir) => {
        const p = el('div', 'fi-stepper');
        p.append(boton('fi-paso', icono('menos'), () => { bajar(); repintar(); }, '−'), el('b', 'fi-valor pf-valor', valor), boton('fi-paso', icono('mas'), () => { subir(); repintar(); }, '+'));
        return p;
      };
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.edad')));
      cuerpo.appendChild(pasos(tx('perfil.anios', { n: d.edad }), () => { d.edad = Math.max(RANGOS.edad[0], d.edad - 1); }, () => { d.edad = Math.min(RANGOS.edad[1], d.edad + 1); }));
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.altura')));
      cuerpo.appendChild(pasos(`${numero(d.alturaCm)} cm`, () => { d.alturaCm = Math.max(RANGOS.alturaCm[0], d.alturaCm - 1); }, () => { d.alturaCm = Math.min(RANGOS.alturaCm[1], d.alturaCm + 1); }));
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.actividad')));
      const actividades = el('div', 'pf-actividades');
      ['poco', 'algo', 'activo', 'muy'].forEach((a) => {
        const [titulo, detalle] = tx('entrada.cuestionario.actividad.' + a);
        const b = boton('ent-opcion', `<b>${titulo}</b><span>${detalle}</span>`, () => { d.actividad = a; repintar(); });
        b.setAttribute('aria-pressed', String(d.actividad === a));
        actividades.appendChild(b);
      });
      cuerpo.appendChild(actividades);
      cuerpo.appendChild(el('p', 'hh-nota', tx('perfil.tusDatosNota')));

      const pie = el('footer', 'hh-pie');
      const guardar = boton('cm-accion principal', '', () => guardarEditar());
      guardar.textContent = tx('comun.guardar');
      pie.appendChild(guardar);
      h.append(el('div', 'hb-asa'), cab, cuerpo, pie);
      cuerpo.scrollTop = arriba;
    }
    function abrirEditar() {
      if (hoja.abierta) hoja.cerrar(true);
      ed = { nombre: s.nombre, foto: s.foto, fotoPintada: s.foto, datos: Object.assign({}, datosDe()) };
      pintarEditar();
      editar.abrir();
      opciones.alCambiar();
    }
    function guardarEditar() {
      if (!ed) return;
      s.nombre = ed.nombre.replace(/\s+/g, ' ').trim();
      s.foto = ed.foto;
      s.datos = ed.datos;
      ed = null;
      editar.cerrar();
      pintar();
    }

    // Lo último que se pintó arriba: el nombre o la foto nuevos entran con un fundido; lo demás queda quieto.
    const pintado = { nombre: s.nombre, foto: s.foto };
    function pintar() {
      cont.innerHTML = '';
      const cab = boton('pf-cab', '', () => abrirEditar(), tx('perfil.editar.titulo'));
      const nombres = el('div', 'pf-nombres');
      const titulo = s.nombre ? el('h2', null, s.nombre) : el('h2', 'pf-sin-nombre', tx('perfil.agregarNombre'));
      if (s.nombre !== pintado.nombre) titulo.classList.add('entra');
      nombres.append(titulo, el('span', null, CORREO));
      const circulo = avatar(s.foto, s.nombre);
      if (s.foto !== pintado.foto || (!s.foto && s.nombre !== pintado.nombre)) circulo.classList.add('entra');
      Object.assign(pintado, { nombre: s.nombre, foto: s.foto });
      cab.append(circulo, nombres);
      cab.insertAdjacentHTML('beforeend', icono('adelante'));
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
      // Tus datos se cambian en Editar perfil, con el nombre y la foto.
      const d = datosDe();
      grupo('perfil.tusDatos', [
        ['perfil.sexo', tx('perfil.sexos.' + d.sexo), true, null, abrirEditar],
        ['perfil.edad', tx('perfil.anios', { n: d.edad }), true, null, abrirEditar],
        ['perfil.altura', `${numero(d.alturaCm)} cm`, true, null, abrirEditar],
        ['perfil.actividad', tx('perfil.actividades.' + d.actividad), true, null, abrirEditar],
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
        // Borra la cuenta de Moss; vinculada, el aviso dice que Ascent sigue intacta (spec/ascent.md, «Dos cuentas»).
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
    // Para las capturas: Editar perfil, con la foto de mentira, lo que se escribe y sin nombre.
    window.__perfil = (accion, arg) => {
      const pasos = {
        abrir: () => abrirEditar(),
        foto: () => { if (ed) { ed.foto = arg === false ? null : fotoDeMentira(); pintarEditar(true); } },
        escribir: () => {
          const campo = editar.el.querySelector('.hh-campo');
          if (!ed || !campo) return;
          campo.value = arg;
          campo.dispatchEvent(new Event('input'));
        },
        guardar: () => guardarEditar(),
        cerrar: () => editar.cerrar(),
        // Sin nombre ni foto, como si Apple no lo hubiera traído; `true` vuelve a la persona de mentira.
        sinNombre: () => { Object.assign(s, { nombre: arg ? opciones.persona().perfil.nombre : '', foto: null }); pintar(); },
      };
      pasos[accion]();
    };
    return {
      zona,
      pintar,
      abrirAparatos,
      abrirAvisos,
      abrirEntreno,
      abrirEditar,
      // Para las capturas: los avisos encendidos.
      ponerAvisos(cambios) { Object.assign(s.avisos, cambios); if (hoja.abierta) pintarAvisos(); pintar(); },
      // Para las capturas: los números ocultos y sin déficit.
      poner(cambios) { Object.assign(s, cambios); if ('numeros' in cambios) opciones.alNumeros(s.numeros); pintar(); },
      // Para las capturas: una marca desplegada.
      desplegar(m) { s.abierta = m; pintarAparatos(); },
      bajarHoja() { const c = hoja.el.querySelector('.pf-aparatos'); if (c) c.scrollTop = c.scrollHeight; },
      get hojaAbierta() { return hoja.abierta || editar.abierta; },
      cerrarHoja() { hoja.cerrar(true); editar.cerrar(true); },
    };
  }

  return { crear };
})();
