// Hábitos, sobre el cielo (src/secciones/habitos/ y BotonesDeHabitos en src/secciones/Secciones.tsx):
// arriba a la derecha, debajo de la luz de hoy, «Tu mes» y un hábito nuevo. El editor se abre con el
// «+» o manteniendo apretada una estrella: el nombre, cómo se cumple (a mano, con Salud o con la
// comida), los días y el ícono. «Tu mes» es el mes en mini cielos con sus cifras, que salen de las
// cuentas de la app (Estadisticas, src/dominio/estadisticas.ts). Los primeros hábitos se eligen al
// terminar la entrada. Lo que se guarda lo pone galeria.js en el cielo de hoy.

const SeccionHabitos = (() => {
  // Los íconos que se eligen, con los nombres de SF Symbols que guarda la app (Editor.tsx, ICONOS).
  const ELEGIBLES = [
    'star', 'figure.walk', 'figure.run', 'dumbbell', 'bicycle', 'figure.mind.and.body', 'moon', 'bed.double', 'book', 'pencil', 'drop', 'cup.and.saucer',
    'fork.knife', 'leaf', 'heart', 'brain.head.profile', 'pills', 'sun.max', 'music.note', 'paintbrush', 'graduationcap', 'phone.down', 'pawprint', 'house',
  ];
  // Los que la galería ya dibujaba con su nombre (los de los hábitos de mentira): van con ese dibujo.
  const DE_LA_GALERIA = { loto: 'figure.mind.and.body', luna: 'moon', libro: 'book', pluma: 'pencil', huellas: 'figure.walk', gota: 'drop', pesa: 'dumbbell', corazon: 'heart', sol: 'sun.max', nota: 'music.note' };
  // El resto, de línea como los de la galería. Los dos últimos son de los hábitos de comida.
  const ICONOS = {
    star: Util.ICONOS.estrella,
    'fork.knife': Util.ICONOS.comida,
    house: Util.ICONOS.inicio,
    'figure.run': '<circle cx="15" cy="4.6" r="1.8"/><path d="M13.9 7.6 11.3 13M13.4 8.6l-3.1 1.1-1.8 2.3M13.4 8.6l2.6 2.1 2.3-.6M11.3 13l2.8 2.5-.9 4.4M11.3 13l-1.8 3.4-3.7.9"/>',
    bicycle: '<circle cx="6" cy="15.5" r="3.6"/><circle cx="18" cy="15.5" r="3.6"/><path d="M6 15.5h5.5L9.5 9 6 15.5M9.5 9h6M11.5 15.5 15.5 9l2.5 6.5M9.5 9l-.3-1.3M7.8 7.7h3M15.5 9l-.7-2.4h2.4"/>',
    'bed.double': '<path d="M3.5 19.5V13A1.5 1.5 0 0 1 5 11.5h14a1.5 1.5 0 0 1 1.5 1.5v6.5M3.5 16.5h17M5.5 11.5v-4A1.5 1.5 0 0 1 7 6h10a1.5 1.5 0 0 1 1.5 1.5v4"/><rect x="7.5" y="8.5" width="3.8" height="3" rx="1"/><rect x="12.7" y="8.5" width="3.8" height="3" rx="1"/>',
    'cup.and.saucer': '<path d="M5.5 8h11v4.5A4.5 4.5 0 0 1 12 17h-2a4.5 4.5 0 0 1-4.5-4.5z"/><path d="M16.5 9.5h1.3a2 2 0 0 1 0 4h-1.6M3.5 20h16"/>',
    // Con sus nervaduras: sin ellas se confunde con la pluma de escribir.
    leaf: '<path d="M5.5 18.5C5 10.5 10 5.5 19 5c.5 9-4.5 14-12.5 13.5z"/><path d="M4 20 14.5 9.5M9 15v-3.2M9 15h3.2M12 12V8.8M12 12h3.2"/>',
    'brain.head.profile': '<path d="M8.5 20.5v-3.3A6.8 6.8 0 0 1 11.6 4.3a6.6 6.6 0 0 1 6.6 6.5l1.6 3.1h-1.7v2.3a1.6 1.6 0 0 1-1.6 1.6h-2v2.7"/><path d="M10 10.2a2 2 0 0 1 3.6-1.3 1.8 1.8 0 0 1 1.4 2.9M12.2 13.4a1.8 1.8 0 0 0 2.8-1.6"/>',
    pills: '<rect x="3" y="7" width="12" height="6" rx="3" transform="rotate(-45 9 10)"/><path d="m6.9 7.9 4.2 4.2"/><circle cx="16.5" cy="16.5" r="3.6"/><path d="m14 19 5-5"/>',
    paintbrush: '<path d="M19.5 4.5c-2.5 1.2-6.6 5.2-8.3 7.8l1.9 1.9c2.6-1.7 6.6-5.8 7.8-8.3z"/><path d="M11 12.6c-2.1-.2-3.6 1.3-3.8 3.3-.2 1.7-1 2.6-2.7 3.1 3.9 1.5 8.4.5 8.4-3.6"/>',
    graduationcap: '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.7v4.5c1.5 1.3 3.5 2 5.5 2s4-.7 5.5-2v-4.5M21.5 9.5V15"/>',
    'phone.down': '<path d="M3 13.6c4.9-4.4 13.1-4.4 18 0l-1.5 2.7-3.7-1.3-.5-2.6a11.5 11.5 0 0 0-6.6 0l-.5 2.6-3.7 1.3z"/>',
    pawprint: '<ellipse cx="12" cy="16" rx="3.8" ry="3.1"/><circle cx="6.2" cy="11.2" r="1.6"/><circle cx="9.6" cy="7.2" r="1.6"/><circle cx="14.4" cy="7.2" r="1.6"/><circle cx="17.8" cy="11.2" r="1.6"/>',
    'list.bullet': '<path d="M9.5 7h10M9.5 12h10M9.5 17h10"/><circle cx="5" cy="7" r=".6"/><circle cx="5" cy="12" r=".6"/><circle cx="5" cy="17" r=".6"/>',
    flame: '<path d="M12 20.5c-3.4 0-5.8-2.4-5.8-5.6 0-3.4 2.6-5.2 3.4-9.4 1.9 1.1 3.1 2.9 3.3 4.9.9-.6 1.5-1.5 1.7-2.7 1.9 1.6 3.2 4 3.2 6.9 0 3.4-2.4 5.9-5.8 5.9z"/>',
  };
  const CALENDARIO = '<rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>';
  const MAS = '<path d="M12 5v14M5 12h14"/>';

  // Las metas que se ofrecen de cada dato de Salud: pasos, minutos de sueño, ml de agua y minutos de atención plena.
  const METAS = { pasos: [4000, 6000, 8000, 10000, 12000], sueno: [360, 420, 480], agua: [1500, 2000, 2500, 3000], mindfulness: [5, 10, 15, 20] };
  const ICONO_DE_SALUD = { pasos: 'figure.walk', sueno: 'moon', agua: 'drop', mindfulness: 'figure.mind.and.body' };
  const ICONO_DE_COMIDA = { proteina: 'fork.knife', registrar: 'list.bullet', calorias: 'flame' };
  const TODOS = [0, 1, 2, 3, 4, 5, 6];
  const SEMANA = [1, 2, 3, 4, 5, 6, 0];

  // Los primeros hábitos (Sugeridos.tsx): diez, la comida primero, y cuatro elegidos de fábrica.
  const SUGERIDOS = [
    { clave: 'proteina', fuente: { tipo: 'comida', meta: 'proteina' }, icono: 'fork.knife' },
    { clave: 'registrar', fuente: { tipo: 'comida', meta: 'registrar' }, icono: 'list.bullet' },
    { clave: 'calorias', fuente: { tipo: 'comida', meta: 'calorias' }, icono: 'flame' },
    { clave: 'dormir', fuente: { tipo: 'salud', dato: 'sueno', meta: 420 }, icono: 'moon' },
    { clave: 'pasos', fuente: { tipo: 'salud', dato: 'pasos', meta: 8000 }, icono: 'figure.walk' },
    { clave: 'agua', fuente: { tipo: 'salud', dato: 'agua', meta: 2000 }, icono: 'drop' },
    { clave: 'meditar', fuente: { tipo: 'salud', dato: 'mindfulness', meta: 10 }, icono: 'figure.mind.and.body' },
    { clave: 'leer', fuente: { tipo: 'manual' }, icono: 'book', nombre: 'habitos.sugeridos.leer', dias: [1, 2, 3, 4, 5] },
    { clave: 'entrenar', fuente: { tipo: 'manual' }, icono: 'dumbbell', nombre: 'habitos.sugeridos.entrenar', dias: [1, 3, 5] },
    { clave: 'escribir', fuente: { tipo: 'manual' }, icono: 'pencil', nombre: 'habitos.sugeridos.escribir' },
  ];
  const DE_FABRICA = ['proteina', 'registrar', 'dormir', 'pasos'];
  const MINIMO = 3;
  const MAXIMO = 5;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const dibujo = (n) => opciones.icono(n);
    const svg = (contenido) => `<svg viewBox="0 0 24 24" aria-hidden="true">${contenido}</svg>`;
    const nombreEn = (v) => (v && typeof v === 'object' ? v[u.idioma()] || v.es : v || '');
    const s = { editor: null, mes: null, elegidos: [...DE_FABRICA] };

    // Lo que dice la meta de un dato de Salud: «8.000 pasos», «Dormir 7 h».
    function textoDeMeta(dato, meta) {
      if (dato === 'pasos') return tx('habitos.metas.pasos', { n: numero(meta) });
      if (dato === 'sueno') return tx('habitos.metas.sueno', { n: Porciones.decimal(meta / 60, u.idioma()) });
      if (dato === 'agua') return tx('habitos.metas.agua', { n: Porciones.decimal(meta / 1000, u.idioma()) });
      return tx('habitos.metas.mindfulness', { n: meta });
    }
    // El nombre que se propone para un hábito automático; a mano, ninguno.
    function nombreDe(f) {
      if (f.tipo === 'salud' && f.dato !== 'acostarse') return textoDeMeta(f.dato, f.meta);
      if (f.tipo === 'comida') return tx('habitos.comidas.' + f.meta);
      return null;
    }

    // ------------------------------------------------------------ arriba del cielo
    // Van en la capa de Hábitos (.ui), que la tira corre con su página; el cielo queda limpio.
    const botones = el('div', 'hh-botones');
    const bMes = boton('hh-boton', svg(CALENDARIO), () => abrirMes());
    const bNuevo = boton('hh-boton hh-nuevo', svg(MAS), () => abrirEditor(null));
    botones.append(bMes, bNuevo);
    tel.querySelector('.ui').appendChild(botones);
    function ponerEtiquetas() {
      bMes.setAttribute('aria-label', tx('habitos.mes.abrir'));
      bNuevo.setAttribute('aria-label', tx('habitos.mas'));
    }
    ponerEtiquetas();

    // ------------------------------------------------------------ las hojas
    // Como la de la app (HojaModal): el título, la cruz, lo de adentro con su scroll y, si hay, el pie.
    const hojas = {
      editor: Util.hoja(tel, 'hh-hoja hh-hoja-editor', () => opciones.alCambiar()),
      mes: Util.hoja(tel, 'hh-hoja hh-hoja-mes', () => opciones.alCambiar()),
      sugeridos: Util.hoja(tel, 'hh-hoja hh-hoja-sugeridos', () => opciones.alCambiar()),
    };
    const abierta = () => Object.values(hojas).find((h) => h.abierta) || null;

    // Arma la hoja de nuevo; con `mantener`, queda a la altura en que estaba.
    function armar(h, titulo, conPie, mantener) {
      const antes = h.el.querySelector('.hh-cuerpo');
      const arriba = mantener && antes ? antes.scrollTop : 0;
      h.el.innerHTML = '';
      h.el.classList.toggle('sin-pie', !conPie);
      h.el.setAttribute('aria-label', titulo);
      const cab = el('header', 'hh-cab');
      cab.append(el('h3', 'hh-titulo', titulo), boton('hb-cerrar', icono('cerrar'), () => h.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'hh-cuerpo');
      h.el.append(el('div', 'hb-asa'), cab, cuerpo);
      const pie = conPie ? h.el.appendChild(el('footer', 'hh-pie')) : null;
      return { cuerpo, pie, volver: () => { cuerpo.scrollTop = arriba; } };
    }

    function segmento(opcionesDe, elegida, alElegir) {
      const cont = el('div', 'aj-segmento');
      opcionesDe.forEach(([valor, texto]) => {
        const b = boton('aj-seg', '', () => alElegir(valor));
        b.textContent = texto;
        b.setAttribute('aria-pressed', String(valor === elegida));
        cont.appendChild(b);
      });
      return cont;
    }

    function pastilla(texto, elegida, alTocar) {
      const b = boton('hh-pastilla', '', alTocar);
      b.textContent = texto;
      b.setAttribute('aria-pressed', String(elegida));
      return b;
    }

    // ------------------------------------------------------------ el editor
    // Un hábito del cielo trae su nombre y su ícono; los días y cómo se cumple salen de la persona
    // de mentira o, si no está, de lo que se enciende solo.
    function deDondeSale(h) {
      if (h.dias && h.fuente) return h;
      const guardado = opciones.habitos().find((x) => x.id === h.id);
      if (guardado) return guardado;
      const salud = h.auto === 'pasos' || h.auto === 'sueno';
      return { dias: TODOS, fuente: salud ? { tipo: 'salud', dato: h.auto, meta: h.meta } : { tipo: 'manual' } };
    }

    function abrirEditor(original) {
      const de = original ? deDondeSale(original) : null;
      s.editor = {
        original,
        nombre: original ? nombreEn(original.nombre) : '',
        icono: original ? DE_LA_GALERIA[original.icono] || original.icono : 'star',
        dias: de ? [...de.dias] : [...TODOS],
        fuente: de ? Object.assign({}, de.fuente) : { tipo: 'manual' },
      };
      // Mientras el nombre sea el propuesto, sigue a la meta que se elige.
      s.editor.nombrePropio = !!original && s.editor.nombre !== nombreDe(s.editor.fuente);
      pintarEditor();
      hojas.editor.abrir();
      opciones.alCambiar();
    }

    const nombreFinal = () => s.editor.nombre.trim() || nombreDe(s.editor.fuente) || '';
    const valido = () => { const n = nombreFinal(); return n.length > 0 && n.length <= 80 && s.editor.dias.length > 0; };

    function cambiarFuente(f, iconoSugerido) {
      const ed = s.editor;
      ed.fuente = f;
      if (!ed.nombrePropio) ed.nombre = nombreDe(f) || '';
      if (iconoSugerido && (!ed.original || ed.icono === 'star')) ed.icono = iconoSugerido;
      pintarEditor(true);
    }
    function elegirComo(c) {
      const actual = s.editor.fuente.tipo;
      if (c === actual) return;
      if (c === 'manual') cambiarFuente({ tipo: 'manual' });
      else if (c === 'salud') cambiarFuente({ tipo: 'salud', dato: 'pasos', meta: 8000 }, 'figure.walk');
      else cambiarFuente({ tipo: 'comida', meta: 'proteina' }, 'fork.knife');
    }

    function pintarEditor(mantener) {
      const ed = s.editor;
      const { cuerpo, pie, volver } = armar(hojas.editor, tx(ed.original ? 'habitos.editar' : 'habitos.nuevo'), true, mantener);
      const como = ed.fuente.tipo === 'salud' ? 'salud' : ed.fuente.tipo === 'comida' ? 'comida' : 'manual';

      cuerpo.appendChild(el('div', 'aj-etq', tx('habitos.nombre')));
      const campo = el('input', 'hh-campo');
      campo.type = 'text';
      campo.maxLength = 80;
      campo.value = ed.nombre;
      campo.placeholder = nombreDe(ed.fuente) || tx('habitos.nombreEjemplo');
      campo.setAttribute('aria-label', tx('habitos.nombre'));
      campo.addEventListener('input', () => {
        ed.nombre = campo.value;
        ed.nombrePropio = campo.value.trim().length > 0;
        guardar.disabled = !valido();
      });
      cuerpo.appendChild(campo);

      cuerpo.appendChild(el('div', 'aj-etq', tx('habitos.como')));
      cuerpo.appendChild(segmento([['manual', tx('habitos.aMano')], ['salud', tx('habitos.conSalud')], ['comida', tx('habitos.conComida')]], como, elegirComo));
      cuerpo.appendChild(el('p', 'aj-nota', tx(como === 'manual' ? 'habitos.aManoTexto' : como === 'salud' ? 'habitos.saludTexto' : 'habitos.comidaTexto')));
      if (ed.fuente.tipo === 'salud' && ed.fuente.dato !== 'acostarse') {
        const caja = el('div', 'hh-opciones');
        const datos = el('div', 'hh-fila');
        Object.keys(METAS).forEach((dato) => datos.appendChild(pastilla(tx('habitos.datos.' + dato), ed.fuente.dato === dato,
          () => cambiarFuente({ tipo: 'salud', dato, meta: METAS[dato][Math.floor(METAS[dato].length / 2)] }, ICONO_DE_SALUD[dato]))));
        const metas = el('div', 'hh-fila');
        METAS[ed.fuente.dato].forEach((meta) => metas.appendChild(pastilla(textoDeMeta(ed.fuente.dato, meta), ed.fuente.meta === meta, () => cambiarFuente(Object.assign({}, ed.fuente, { meta })))));
        caja.append(datos, metas);
        cuerpo.appendChild(caja);
      }
      if (ed.fuente.tipo === 'comida') {
        const caja = el('div', 'hh-opciones');
        ['proteina', 'registrar', 'calorias'].forEach((meta) => caja.appendChild(pastilla(tx('habitos.comidas.' + meta), ed.fuente.meta === meta,
          () => cambiarFuente({ tipo: 'comida', meta }, ICONO_DE_COMIDA[meta]))));
        cuerpo.appendChild(caja);
      }

      cuerpo.appendChild(el('div', 'aj-etq', tx('habitos.dias')));
      const dias = el('div', 'aj-dias');
      SEMANA.forEach((d) => {
        const b = boton('aj-dia', tx('fecha.diasCortos.' + d).charAt(0), () => {
          ed.dias = ed.dias.includes(d) ? ed.dias.filter((x) => x !== d) : [...ed.dias, d];
          pintarEditor(true);
        }, tx('fecha.dias.' + d));
        b.setAttribute('aria-pressed', String(ed.dias.includes(d)));
        dias.appendChild(b);
      });
      cuerpo.append(dias, el('p', 'aj-nota', tx('habitos.cambiaLaConstelacion')));

      cuerpo.appendChild(el('div', 'aj-etq', tx('habitos.icono')));
      const iconos = el('div', 'hh-iconos');
      iconos.setAttribute('role', 'radiogroup');
      ELEGIBLES.forEach((n) => {
        const b = boton('hh-icono', dibujo(n), () => { ed.icono = n; pintarEditor(true); }, n);
        b.setAttribute('aria-pressed', String(ed.icono === n));
        iconos.appendChild(b);
      });
      cuerpo.appendChild(iconos);
      cuerpo.appendChild(ed.original ? el('p', 'aj-nota', tx('habitos.archivarTexto')) : el('p', 'hh-nota', tx('habitos.mantener')));

      const guardar = boton('cm-accion principal', '', () => guardarEditor());
      guardar.textContent = tx('habitos.guardar');
      guardar.disabled = !valido();
      pie.appendChild(guardar);
      if (ed.original) {
        const archivar = boton('fi-quitar', '', () => archivarEditor());
        archivar.textContent = tx('habitos.archivar');
        pie.appendChild(archivar);
      }
      volver();
    }

    function guardarEditor() {
      if (!valido()) return;
      const ed = s.editor;
      const nombre = nombreFinal();
      opciones.alGuardar(ed.original, { nombre, icono: ed.icono, dias: [...ed.dias].sort((a, b) => a - b), fuente: ed.fuente });
      hojas.editor.cerrar();
      opciones.avisar(tx('habitos.guardado', { habito: nombre }));
    }
    function archivarEditor() {
      const original = s.editor.original;
      if (!original) return;
      opciones.alArchivar(original);
      hojas.editor.cerrar();
      opciones.avisar(tx('habitos.archivado', { habito: nombreEn(original.nombre) }));
    }

    // ------------------------------------------------------------ tu mes
    // Los días vividos y hoy, como los guarda la app (src/dominio/dias.ts). Hoy sale del cielo.
    const idDe = (h) => h.id || 'galeria-' + nombreEn(h.nombre);
    function diasConHoy() {
      const mapa = new Map(Datos.DIAS.map((d) => [d.clave, d]));
      const hoy = opciones.cielo();
      if (hoy) {
        const habitos = hoy.habitos.map(idDe);
        const hechos = hoy.habitos.filter((h) => h.encendido).map(idDe);
        mapa.set(Datos.HOY, { clave: Datos.HOY, constelacion: hoy.constelacion.id, habitos, hechos, luz: hechos.length ? hechos.length + 2 : 0, completo: habitos.length > 0 && hechos.length === habitos.length });
      }
      return mapa;
    }
    const constelacionDe = (id) => (id && opciones.catalogo.find((c) => c.id === id)) || null;

    function abrirMes() {
      s.mes = { anio: Number(Datos.HOY.slice(0, 4)), mes: Number(Datos.HOY.slice(5, 7)) - 1 };
      pintarMes();
      hojas.mes.abrir();
      opciones.alCambiar();
    }
    function moverMes(d) {
      const m = s.mes.mes + d;
      s.mes = { anio: s.mes.anio + Math.floor(m / 12), mes: ((m % 12) + 12) % 12 };
      pintarMes(true);
    }

    function pintarMes(mantener) {
      const { cuerpo, volver } = armar(hojas.mes, tx('habitos.mes.titulo'), false, mantener);
      const hoy = Datos.HOY;
      const { anio, mes } = s.mes;
      const esteMes = anio === Number(hoy.slice(0, 4)) && mes === Number(hoy.slice(5, 7)) - 1;
      const dias = diasConHoy();

      const navegar = el('div', 'hh-navegar');
      const titulo = `${tx('fecha.meses.' + mes)} ${anio}`;
      const siguiente = boton('hh-flecha', icono('adelante'), () => { if (!esteMes) moverMes(1); }, tx('habitos.mes.siguiente'));
      siguiente.disabled = esteMes;
      navegar.append(boton('hh-flecha', icono('atras'), () => moverMes(-1), tx('habitos.mes.anterior')), el('b', 'hh-mes-titulo', titulo.charAt(0).toUpperCase() + titulo.slice(1)), siguiente);
      cuerpo.appendChild(navegar);

      // De lunes a domingo, con los huecos antes del primero.
      const letras = el('div', 'hh-semana');
      SEMANA.forEach((d) => letras.appendChild(el('span', null, tx('fecha.diasCortos.' + d).charAt(0))));
      cuerpo.appendChild(letras);
      const ancho = Math.max(240, (tel.clientWidth || 393) - 40);
      const lado = ancho / 7;
      const alto = lado * 1.08;
      const claves = Estadisticas.diasDelMes(anio, mes);
      const hueco = (Fechas.diaDeLaSemana(claves[0]) + 6) % 7;
      const filas = Math.ceil((hueco + claves.length) / 7);
      const celdas = claves.map((clave, i) => {
        const lugar = hueco + i;
        const d = clave <= hoy ? dias.get(clave) : undefined;
        return {
          clave, x: (lugar % 7) * lado, y: Math.floor(lugar / 7) * alto, ancho: lado, alto,
          constelacion: d ? constelacionDe(d.constelacion) : null,
          encendidas: d ? d.habitos.map((h) => d.hechos.includes(h)) : [],
          completo: !!(d && d.completo),
        };
      });
      const grilla = el('div', 'hh-grilla');
      grilla.style.width = `${ancho}px`;
      grilla.style.height = `${filas * alto}px`;
      const lienzo = el('canvas');
      lienzo.setAttribute('aria-hidden', 'true');
      grilla.appendChild(lienzo);
      celdas.forEach((c) => {
        const num = Number(c.clave.slice(8));
        const n = el('span', 'hh-num' + (c.clave === hoy ? ' hoy' : c.clave > hoy ? ' futuro' : ''), String(num));
        n.style.left = `${(c.x + 4).toFixed(1)}px`;
        n.style.top = `${(c.y + 3).toFixed(1)}px`;
        if (c.completo) n.setAttribute('aria-label', `${num} ✓`);
        grilla.appendChild(n);
      });
      cuerpo.appendChild(grilla);
      dibujarMes(lienzo, celdas, ancho, filas * alto);

      const resumen = Estadisticas.resumenDelMes(dias, anio, mes, hoy);
      if (resumen.conHabitos === 0) cuerpo.appendChild(el('p', 'hh-vacio', tx('habitos.mes.sinDatos')));
      const cifras = el('div', 'hh-cifras');
      const cifra = (valor, texto) => {
        const c = el('div', 'hh-cifra');
        c.append(el('b', null, numero(valor)), el('span', null, texto));
        cifras.appendChild(c);
      };
      cifra(resumen.completos, tx('habitos.mes.completos'));
      cifra(resumen.conLuz, tx('habitos.mes.conLuz'));
      cifra(resumen.luz, tx('habitos.mes.luz'));
      cuerpo.appendChild(cifras);

      // Cada hábito de ahora, los últimos 30 días, contra los días que le tocaban.
      const vigentes = opciones.habitos().filter((h) => !h.hasta || h.hasta >= hoy).sort((a, b) => a.orden - b.orden);
      if (vigentes.length) {
        cuerpo.appendChild(el('div', 'aj-etq', tx('habitos.mes.porHabito')));
        vigentes.forEach((h) => {
          const c = Estadisticas.cumplimiento(h.id, dias, hoy, 30);
          const fila = el('div', 'hh-habito');
          const arriba = el('div', 'hh-habito-fila');
          arriba.innerHTML = dibujo(h.icono);
          arriba.append(el('span', null, nombreEn(h.nombre)), el('b', null, tx('habitos.mes.deVeces', { hechos: numero(c.hechos), total: numero(c.total) })));
          const pista = el('div', 'hh-pista');
          const lleno = el('i');
          lleno.style.width = `${((c.total ? c.hechos / c.total : 0) * 100).toFixed(1)}%`;
          pista.appendChild(lleno);
          fila.append(arriba, pista);
          cuerpo.appendChild(fila);
        });
      }
      volver();
    }

    // El mes en mini cielos (MesSkia, src/secciones/graficos/GraficosSkia.tsx): la constelación de
    // cada día con lo que se encendió; los días completos, unidos en oro.
    function dibujarMes(lienzo, celdas, ancho, alto) {
      const dpr = Math.min(3, window.devicePixelRatio || 1);
      lienzo.width = Math.round(ancho * dpr);
      lienzo.height = Math.round(alto * dpr);
      const ctx = lienzo.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      celdas.forEach((c) => {
        if (!c.constelacion) return;
        const plano = Escena.encajar(Escena.proyectar(c.constelacion.estrellas), [0, 0], (c.ancho / c.alto) * 0.78, 0.34);
        const cx = c.x + c.ancho / 2, cy = c.y + c.alto / 2 + 4;
        const pos = plano.map(([x, y]) => [cx + x * c.alto, cy - y * c.alto]);
        if (c.completo) {
          const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.alto * 0.48);
          halo.addColorStop(0, 'rgba(232, 196, 106, 0.16)');
          halo.addColorStop(1, 'rgba(232, 196, 106, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(cx, cy, c.alto * 0.48, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = c.completo ? 'rgba(232, 196, 106, 0.8)' : 'rgba(239, 230, 207, 0.13)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        c.constelacion.lineas.forEach(([a, b]) => { ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(pos[b][0], pos[b][1]); });
        ctx.stroke();
        pos.forEach(([x, y], k) => {
          const si = !!c.encendidas[k];
          ctx.fillStyle = si ? '#fbf2d9' : 'rgba(239, 230, 207, 0.32)';
          ctx.beginPath();
          ctx.arc(x, y, si ? 1.7 : 1.1, 0, Math.PI * 2);
          ctx.fill();
        });
      });
    }

    // ------------------------------------------------------------ los primeros hábitos
    const nombreDeSugerido = (sg) => (sg.nombre ? tx(sg.nombre) : nombreDe(sg.fuente) || '');

    function abrirSugeridos() {
      s.elegidos = [...DE_FABRICA];
      pintarSugeridos();
      hojas.sugeridos.abrir();
      opciones.alCambiar();
    }
    // De 3 a 5: el sexto no entra.
    function alternar(clave) {
      if (s.elegidos.includes(clave)) s.elegidos = s.elegidos.filter((x) => x !== clave);
      else if (s.elegidos.length < MAXIMO) s.elegidos = [...s.elegidos, clave];
      pintarSugeridos(true);
    }

    function pintarSugeridos(mantener) {
      const { cuerpo, pie, volver } = armar(hojas.sugeridos, tx('habitos.sugeridos.titulo'), true, mantener);
      cuerpo.appendChild(el('p', 'pg-texto', tx('habitos.sugeridos.texto')));
      const lista = el('div', 'hh-sugeridos');
      SUGERIDOS.forEach((sg) => {
        const si = s.elegidos.includes(sg.clave);
        const fila = boton('hh-sugerido', dibujo(sg.icono), () => alternar(sg.clave));
        fila.setAttribute('role', 'checkbox');
        fila.setAttribute('aria-checked', String(si));
        fila.classList.toggle('elegido', si);
        const textos = el('span', 'hh-sugerido-txt');
        textos.appendChild(el('b', null, nombreDeSugerido(sg)));
        if (sg.fuente.tipo !== 'manual') textos.appendChild(el('span', null, tx(sg.fuente.tipo === 'comida' ? 'habitos.comidaTexto' : 'habitos.saludTexto')));
        const marca = el('span', 'hh-marca');
        if (si) marca.innerHTML = icono('listo');
        fila.append(textos, marca);
        lista.appendChild(fila);
      });
      cuerpo.append(lista, el('p', 'aj-nota', tx('habitos.sugeridos.despues')));
      pie.appendChild(el('p', 'hh-cuantos', tx('habitos.sugeridos.cuantos', { n: s.elegidos.length })));
      const listo = boton('cm-accion principal', '', () => armarConstelacion());
      listo.textContent = tx('habitos.sugeridos.listo');
      listo.disabled = s.elegidos.length < MINIMO || s.elegidos.length > MAXIMO;
      pie.appendChild(listo);
      volver();
    }

    // En el orden de la lista: la comida primero, en las estrellas más brillantes.
    function armarConstelacion() {
      if (s.elegidos.length < MINIMO || s.elegidos.length > MAXIMO) return;
      const lista = SUGERIDOS.filter((sg) => s.elegidos.includes(sg.clave))
        .map((sg) => ({ id: 'primero-' + sg.clave, nombre: nombreDeSugerido(sg), icono: sg.icono, dias: sg.dias || TODOS, fuente: sg.fuente }));
      opciones.alArmar(lista);
      hojas.sugeridos.cerrar();
    }

    return {
      get abierta() { return !!abierta(); },
      cerrar() { const h = abierta(); if (h) h.cerrar(); },
      // Al cambiar el idioma.
      pintar() {
        ponerEtiquetas();
        if (hojas.editor.abierta) pintarEditor(true);
        if (hojas.mes.abierta) pintarMes(true);
        if (hojas.sugeridos.abierta) pintarSugeridos(true);
      },
      nuevo: () => abrirEditor(null),
      // El hábito de la estrella `i` del cielo de hoy (mantenerla apretada).
      editar(i) { const hoy = opciones.cielo(); if (hoy && hoy.habitos[i]) abrirEditor(Object.assign({}, hoy.habitos[i], { indice: i })); },
      mes: abrirMes,
      sugeridos: abrirSugeridos,
      // Para las capturas y los botones de la galería.
      como: (c) => { if (s.editor) elegirComo(c); },
      escribir(texto) { if (!s.editor) return; s.editor.nombre = texto; s.editor.nombrePropio = texto.trim().length > 0; pintarEditor(true); },
      ponerIcono(n) { if (s.editor) { s.editor.icono = n; pintarEditor(true); } },
      guardar: () => { if (s.editor) guardarEditor(); },
      moverMes: (d) => { if (s.mes) moverMes(d); },
      alternar,
      armar: () => armarConstelacion(),
      bajar(selector) {
        const h = abierta();
        const c = h && h.el.querySelector('.hh-cuerpo');
        if (!c) return;
        const n = selector && c.querySelector(selector);
        c.scrollTo(0, n ? Math.max(0, c.scrollTop + n.getBoundingClientRect().top - c.getBoundingClientRect().top - 12) : 99999);
      },
    };
  }

  return { crear, ICONOS, DE_LA_GALERIA };
})();
