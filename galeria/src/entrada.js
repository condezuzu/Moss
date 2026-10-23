// La entrada a la app, para aprobar en la galería antes de conectarla con la lógica: la frase de
// apertura, dos diapositivas, la cuenta y el cuestionario que arma la meta inicial de comida.
// Cada pantalla tiene su lugar en el cielo: la cámara sube a medida que se avanza, el musgo queda
// abajo y al final un «flum» lleva al cielo de hoy. La frase y las diapositivas no se pueden
// saltear: el botón se llena en 2,5 s, como el circulito de Ascent. Los textos salen del
// diccionario de la app (src/textos), igual que los del cielo.

const Entrada = (() => {
  const MINIMO = 2500;
  const SVG = 'http://www.w3.org/2000/svg';

  // Mifflin-St Jeor por el nivel de actividad, más o menos el ritmo elegido (7.700 kcal por kg),
  // con un piso, y sin déficit si es su caso (embarazo, lactancia o una condición médica). Es la
  // meta inicial: después la ajusta el control de cada semana.
  const ACTIVIDAD = { poco: 1.35, algo: 1.5, activo: 1.65, muy: 1.85 };
  const RITMO = { bajar: { suave: -0.25, recomendado: -0.5, rapido: -0.75 }, subir: { suave: 0.1, recomendado: 0.25, rapido: 0.4 } };
  function metas(r) {
    const basal = 10 * r.peso + 6.25 * r.altura - 5 * r.edad + (r.sexo === 'f' ? -161 : 5);
    const gasto = basal * ACTIVIDAD[r.actividad];
    const objetivo = r.sinDeficit && r.objetivo === 'bajar' ? 'mantener' : r.objetivo;
    const pct = objetivo === 'mantener' ? 0 : RITMO[objetivo][r.ritmo];
    const kcal = Math.max(r.sexo === 'f' ? 1200 : 1400, Math.round((gasto + (pct / 100) * r.peso * 7700 / 7) / 10) * 10);
    const proteina = Math.round(r.peso * (objetivo === 'bajar' ? 2.0 : objetivo === 'subir' ? 1.8 : 1.6));
    const grasas = Math.round(Math.max(0.6 * r.peso, (kcal * 0.27) / 9));
    const carbohidratos = Math.max(0, Math.round((kcal - proteina * 4 - grasas * 9) / 4));
    return { gasto: Math.round(gasto / 10) * 10, kcal, proteina, grasas, carbohidratos };
  }

  // La parte iluminada de una luna creciente de radio r: p va de 0 (nueva) a 1 (llena).
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }

  function crear(tel, escena, opciones) {
    const raiz = document.createElement('div');
    raiz.className = 'entrada';
    raiz.hidden = true;
    tel.appendChild(raiz);

    let idioma = 'es';
    const tx = (clave, vars) => {
      let s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma]);
      if (s == null) return clave;
      if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return s;
    };
    const numero = (n, dec) => n.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };

    // Lo que contestó: con Salud conectada, edad, sexo, altura y peso vienen de ahí (de mentira).
    const r = { salud: false, edad: 29, sexo: null, altura: 172, peso: 74.5, actividad: 'activo', objetivo: 'mantener', ritmo: 'recomendado', sinDeficit: false, caso: 'nada', buscar: false };
    const DE_SALUD = { edad: 31, sexo: 'm', altura: 176, peso: 78.4 };
    let desdeSalud = {};

    let actual = -1;
    let animando = 0;
    let temporizador = 0;
    const despues = (ms, fn) => { const id = setTimeout(fn, ms); return id; };

    // ------------------------------------------------------------ el botón que se llena
    // No se puede tocar hasta que el aro se completa; después late suave. Con «avance solo»
    // pasa a la pantalla siguiente sin tocar.
    function circulo(alTocar) {
      const b = el('button', 'ent-circulo');
      b.type = 'button';
      b.disabled = true;
      b.setAttribute('aria-label', tx('entrada.seguir'));
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '0 0 64 64');
      const fondo = document.createElementNS(SVG, 'circle');
      fondo.setAttribute('cx', 32); fondo.setAttribute('cy', 32); fondo.setAttribute('r', 29);
      fondo.setAttribute('class', 'ent-circulo-fondo');
      const aro = document.createElementNS(SVG, 'circle');
      aro.setAttribute('cx', 32); aro.setAttribute('cy', 32); aro.setAttribute('r', 29);
      aro.setAttribute('class', 'ent-circulo-aro');
      const flecha = document.createElementNS(SVG, 'path');
      flecha.setAttribute('d', 'M26 32h13M33 25.5l6.5 6.5-6.5 6.5');
      flecha.setAttribute('class', 'ent-circulo-flecha');
      svg.append(fondo, aro, flecha);
      b.appendChild(svg);
      requestAnimationFrame(() => requestAnimationFrame(() => b.classList.add('llenando')));
      temporizador = despues(MINIMO, () => {
        b.disabled = false;
        b.classList.add('listo');
        escena.haptico('suave');
        if (opciones.avanceSolo()) temporizador = despues(900, alTocar);
      });
      b.addEventListener('click', () => { if (!b.disabled) alTocar(); });
      return b;
    }

    function botonSeguir(texto, alTocar, clase) {
      const b = el('button', 'ent-boton ' + (clase || ''), texto);
      b.type = 'button';
      b.addEventListener('click', alTocar);
      return b;
    }

    // ------------------------------------------------------------ la luna de la comida
    // La comida tiene su luna: se llena con lo que comés, y tres arcos alrededor, uno por macro. La
    // meta es la luna llena. Es la misma luna de verdad de la zona de comida (comida.js): mares,
    // grano y la sombra con el borde suave.
    let lunas = 0;
    function luna(clase) {
      const id = `entLuna${++lunas}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '-100 -100 200 200');
      svg.setAttribute('class', 'ent-luna ' + (clase || ''));
      svg.innerHTML = `
        <defs>
          <radialGradient id="${id}-cara" cx="40%" cy="36%" r="72%">
            <stop offset="0" stop-color="#f7f3e8"/><stop offset="0.6" stop-color="#e4ddcc"/><stop offset="1" stop-color="#b9b09b"/>
          </radialGradient>
          <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.16" numOctaves="3" seed="4"/>
            <feColorMatrix values="0 0 0 0 0.32  0 0 0 0 0.3  0 0 0 0 0.26  0 0 0 1.5 -0.72"/>
            <feComposite in2="SourceAlpha" operator="in"/>
          </filter>
          <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
          <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><path class="ent-luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
          <clipPath id="${id}-disco"><circle r="40"/></clipPath>
        </defs>
        <circle r="46" class="ent-luna-halo"/>
        <g clip-path="url(#${id}-disco)">
          <circle r="40" class="ent-luna-noche"/>
          <g mask="url(#${id}-luz)">
            <circle r="40" fill="url(#${id}-cara)"/>
            <g class="ent-mares" filter="url(#${id}-suave)">
              <ellipse cx="-13" cy="-15" rx="11" ry="8.5"/><ellipse cx="5" cy="-11" rx="7" ry="6"/><ellipse cx="13" cy="-1" rx="8" ry="7"/>
              <ellipse cx="-21" cy="5" rx="8" ry="15"/><ellipse cx="-3" cy="14" rx="7" ry="4.5"/><ellipse cx="22" cy="-14" rx="4" ry="3.2"/>
              <ellipse cx="19" cy="13" rx="5" ry="4"/>
            </g>
            <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.55"/>
            <circle cx="-7" cy="27" r="1.5" class="ent-crater"/><circle cx="9" cy="22" r="1" class="ent-crater"/>
          </g>
        </g>
        <circle r="40" class="ent-luna-contorno"/>
        <circle r="54" class="ent-arco ent-arco-p"/>
        <circle r="62" class="ent-arco ent-arco-c"/>
        <circle r="70" class="ent-arco ent-arco-g"/>`;
      const faseEl = svg.querySelector('.ent-luna-fase');
      const arcos = [...svg.querySelectorAll('.ent-arco')];
      // Dos maneras de usar los arcos: tres anillos que se llenan hasta la meta (la diapositiva) o
      // un solo anillo repartido entre los tres macros (el resultado).
      let repartido = false;
      arcos.forEach((a) => {
        const largo = 2 * Math.PI * Number(a.getAttribute('r'));
        a.style.strokeDasharray = `${largo} ${largo}`;
        a.style.strokeDashoffset = String(largo);
        a.dataset.largo = largo;
      });
      const dibujarArco = (a, i, ki) => {
        if (repartido) {
          a.style.strokeDasharray = `${(Number(a.dataset.tramo) * ki).toFixed(2)} ${a.dataset.largo}`;
          a.style.strokeDashoffset = String(-Number(a.dataset.desde));
        } else {
          a.style.strokeDashoffset = String(Number(a.dataset.largo) * (1 - ki));
        }
      };
      return {
        svg,
        // De creciente a llena en `ms`; los arcos se llenan uno detrás del otro.
        llenar(ms, demora) {
          const t0 = performance.now() + (demora || 0);
          const cuadro = (ahora) => {
            const u = Math.min(1, Math.max(0, (ahora - t0) / ms));
            const k = 1 - Math.pow(1 - u, 3);
            faseEl.setAttribute('d', fase(0.06 + 0.94 * k, 40));
            arcos.forEach((a, i) => {
              const ui = repartido ? Math.min(1, Math.max(0, (u - 0.3 * i) / 0.4)) : Math.min(1, Math.max(0, (u - 0.15 * i) / 0.7));
              dibujarArco(a, i, repartido ? ui : 1 - Math.pow(1 - ui, 3));
            });
            if (u < 1 && svg.isConnected) animando = requestAnimationFrame(cuadro);
          };
          faseEl.setAttribute('d', fase(0.06, 40));
          arcos.forEach((a, i) => dibujarArco(a, i, 0));
          animando = requestAnimationFrame(cuadro);
        },
        // Un anillo entre los tres macros, en proporción a sus kcal, con un hueco entre cada uno.
        repartir(lista) {
          repartido = true;
          const radio = 60;
          const largo = 2 * Math.PI * radio;
          let antes = 0;
          arcos.forEach((a, i) => {
            a.setAttribute('r', radio);
            a.dataset.largo = largo;
            a.dataset.desde = antes * largo;
            a.dataset.tramo = Math.max(0, lista[i] * largo - 7);
            antes += lista[i];
          });
        },
      };
    }

    // ------------------------------------------------------------ las pantallas
    const PASOS = [
      { id: 'frase', camara: 0, minimo: true, armar: armarFrase },
      { id: 'habitos', camara: 0.42, minimo: true, armar: armarHabitos, alSalir: () => escena.quitarDemo() },
      { id: 'comida', camara: 0.8, minimo: true, armar: armarComida },
      { id: 'datos', camara: 0.98, armar: armarDatos },
      { id: 'cuenta', camara: 1.08, armar: armarCuenta },
      { id: 'salud', camara: 1.16, cuestionario: true, armar: armarSalud },
      { id: 'edad', camara: 1.19, cuestionario: true, armar: (p) => (r.edad < 18 ? armarMenor(p) : armarNumero('edad', 'entrada.cuestionario.edadTitulo', null, 18, 90, 1, 0, tx('entrada.cuestionario.anos'))) },
      { id: 'sexo', camara: 1.22, cuestionario: true, armar: armarSexo },
      { id: 'altura', camara: 1.25, cuestionario: true, armar: () => armarNumero('altura', 'entrada.cuestionario.alturaTitulo', null, 130, 220, 1, 0, 'cm') },
      { id: 'peso', camara: 1.28, cuestionario: true, armar: () => armarNumero('peso', 'entrada.cuestionario.pesoTitulo', 'entrada.cuestionario.pesoTexto', 35, 200, 0.1, 1, 'kg') },
      { id: 'actividad', camara: 1.31, cuestionario: true, armar: armarActividad },
      { id: 'cuidado', camara: 1.325, cuestionario: true, armar: armarCuidado },
      { id: 'objetivo', camara: 1.34, cuestionario: true, armar: armarObjetivo },
      { id: 'resultado', camara: 1.37, armar: armarResultado },
    ];
    const enCuestionario = PASOS.filter((p) => p.cuestionario);

    function pantalla(clase) {
      const p = el('section', 'ent-pantalla ' + clase);
      raiz.appendChild(p);
      return p;
    }

    function cabezaDeCuestionario(p, paso) {
      const i = enCuestionario.indexOf(paso);
      const barra = el('div', 'ent-progreso');
      const relleno = el('i');
      relleno.style.width = `${(i / enCuestionario.length) * 100}%`;
      barra.appendChild(relleno);
      requestAnimationFrame(() => requestAnimationFrame(() => { relleno.style.width = `${((i + 1) / enCuestionario.length) * 100}%`; }));
      p.append(barra, el('div', 'ent-paso', tx('entrada.cuestionario.paso', { n: i + 1, total: enCuestionario.length })));
    }

    function armarFrase(p) {
      const caja = el('div', 'ent-frase');
      const q = el('p', 'ent-frase-texto');
      tx('entrada.frase').split(' ').forEach((palabra, i) => {
        const s = el('span', null, palabra);
        s.style.animationDelay = `${0.35 + i * 0.075}s`;
        q.append(s, ' ');
      });
      const autor = el('p', 'ent-frase-autor', tx('entrada.fraseAutor'));
      caja.append(q, autor);
      p.append(caja, circulo(siguiente));
    }

    function armarHabitos(p) {
      const cas = (opciones.catalogo || []).find((c) => c.id === 'cassiopeia');
      if (cas) escena.ponerDemo(cas, [0, PASOS[1].camara + 0.02], opciones.aspecto() * 0.6, 0.17);
      p.append(el('h2', 'ent-titulo', tx('entrada.habitosTitulo')), el('p', 'ent-texto', tx('entrada.habitosTexto')), circulo(siguiente));
    }

    function armarComida(p) {
      const l = luna();
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      // Lo que se come vuela hasta la luna.
      for (let i = 0; i < 7; i++) {
        const chispa = el('i', 'ent-chispa');
        const a = (i / 7) * Math.PI * 2 + 0.4;
        chispa.style.setProperty('--dx', `${Math.cos(a) * 150}px`);
        chispa.style.setProperty('--dy', `${Math.sin(a) * 150}px`);
        chispa.style.animationDelay = `${0.2 + i * 0.22}s`;
        escenario.appendChild(chispa);
      }
      p.append(el('h2', 'ent-titulo', tx('entrada.comidaTitulo')), el('p', 'ent-texto', tx('entrada.comidaTexto')), escenario, circulo(siguiente));
      l.llenar(2000, 250);
    }

    // Antes de la cuenta: qué se guarda, dónde, y el consentimiento para los datos de salud (Ley
    // 18.331 y la guía 5.1.1 de Apple). Mandar lo que no se encuentra es opcional y empieza apagado.
    function armarDatos(p) {
      // Como el cuestionario: a la izquierda, que se lee mejor que centrado.
      p.classList.add('ent-cuestionario');
      const lista = el('ul', 'ent-lista-datos');
      tx('entrada.datos.lineas').forEach((linea, i) => {
        const li = el('li', null, linea);
        li.style.animationDelay = `${0.15 + i * 0.12}s`;
        lista.appendChild(li);
      });
      const llave = botonSeguir('', () => { r.buscar = !r.buscar; llave.setAttribute('aria-pressed', String(r.buscar)); }, 'ent-llave');
      llave.innerHTML = `<span><b>${tx('entrada.datos.busquedas')}</b><small>${tx('entrada.datos.busquedasTexto')}</small></span><i></i>`;
      llave.setAttribute('aria-pressed', String(r.buscar));
      p.append(el('h2', 'ent-titulo', tx('entrada.datos.titulo')), lista, el('p', 'ent-texto ent-salud-datos', tx('entrada.datos.salud')),
        el('p', 'ent-chico ent-enlace', tx('entrada.datos.politica')), llave, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.datos.acepto'), siguiente, 'ent-principal'));
    }

    // Menos de 18, según Salud: Moss no sigue (lo pediste el 22/10/2026).
    function armarMenor(p) {
      p.classList.add('ent-menor');
      p.append(el('h2', 'ent-titulo', tx('entrada.menor.titulo')), el('p', 'ent-texto', tx('entrada.menor.texto')));
      return null;
    }

    // Embarazo, lactancia o una condición médica: sin déficit, y un profesional que acompañe. No se
    // guarda cuál: solo que Moss no pone en déficit.
    function armarCuidado(p, paso) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuidado.titulo')));
      const aviso = el('p', 'ent-texto ent-aviso' + (r.caso !== 'nada' ? ' visible' : ''), tx('entrada.cuidado.aviso'));
      const casos = [
        ...(r.sexo === 'f' ? [['embarazo', tx('entrada.cuidado.embarazo')]] : []),
        ['condicion', tx('entrada.cuidado.condicion'), tx('entrada.cuidado.condicionTexto')],
        ['nada', tx('entrada.cuidado.nada')],
      ];
      opcionesDe(p, casos, r.caso, (v) => { r.caso = v; r.sinDeficit = v !== 'nada'; aviso.classList.toggle('visible', r.sinDeficit); });
      p.append(aviso, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function armarCuenta(p) {
      const marca = el('h1', 'ent-marca');
      'Moss'.split('').forEach((letra, i) => {
        const s = el('span', null, letra);
        s.style.animationDelay = `${0.15 + i * 0.12}s`;
        marca.appendChild(s);
      });
      const apple = botonSeguir('', siguiente, 'ent-apple');
      apple.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6zM14.1 5.5c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"/></svg>';
      apple.appendChild(el('span', null, tx('entrada.cuenta.apple')));
      const formulario = el('div', 'ent-formulario');
      formulario.hidden = true;
      // Maqueta: son cajas, no campos; acá no se escribe ni se manda nada.
      [tx('entrada.cuenta.correoCampo'), tx('entrada.cuenta.claveCampo')].forEach((t) => formulario.appendChild(el('div', 'ent-campo', t)));
      formulario.append(botonSeguir(tx('entrada.cuenta.entrar'), siguiente, 'ent-principal'), el('p', 'ent-chico ent-enlace', tx('entrada.cuenta.olvide')));
      const correo = botonSeguir(tx('entrada.cuenta.correo'), () => { formulario.hidden = false; correo.hidden = true; }, 'ent-secundario');
      const botones = el('div', 'ent-botones');
      botones.append(apple, correo, formulario);
      p.append(marca, el('p', 'ent-lema', tx('entrada.cuenta.lema')), botones, el('p', 'ent-chico', tx('entrada.cuenta.ascent')), el('p', 'ent-chico ent-legal', tx('entrada.cuenta.legal')));
    }

    function armarSalud(p, paso) {
      cabezaDeCuestionario(p, paso);
      const iconos = el('div', 'ent-salud');
      ['huellas', 'luna', 'loto', 'gota', 'balanza'].forEach((n, i) => {
        const c = el('span', 'ent-salud-icono');
        c.innerHTML = opciones.icono(n);
        c.style.animationDelay = `${0.2 + i * 0.16}s`;
        iconos.appendChild(c);
      });
      const conectar = botonSeguir(tx('entrada.cuestionario.conectar'), () => {
        r.salud = true;
        desdeSalud = Object.assign({}, DE_SALUD);
        Object.assign(r, DE_SALUD);
        escena.haptico('toque');
        siguiente();
      }, 'ent-principal');
      const ahoraNo = botonSeguir(tx('entrada.cuestionario.ahoraNo'), siguiente, 'ent-secundario');
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.saludTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.saludTexto')), iconos, el('div', 'ent-pie', null));
      p.querySelector('.ent-pie').append(conectar, ahoraNo);
    }

    // Las pantallas de un número (edad, altura, peso) comparten forma: devuelven su configuración
    // y la arma pantallaNumero.
    function armarNumero(clave, titulo, texto, min, max, paso, dec, unidad) {
      return { clave, titulo, texto, min, max, paso, dec, unidad };
    }

    function pantallaNumero(p, paso, cfg) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx(cfg.titulo)));
      if (cfg.texto) p.appendChild(el('p', 'ent-texto', tx(cfg.texto)));
      const grande = el('div', 'ent-numero');
      const valor = el('b');
      grande.append(valor, el('span', null, cfg.unidad));
      if (desdeSalud[cfg.clave] != null) grande.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = cfg.min; rango.max = cfg.max; rango.step = cfg.paso;
      rango.value = r[cfg.clave];
      rango.setAttribute('aria-label', tx(cfg.titulo));
      const mostrar = () => { valor.textContent = numero(Number(rango.value), cfg.dec); };
      rango.addEventListener('input', () => { r[cfg.clave] = Number(rango.value); mostrar(); delete desdeSalud[cfg.clave]; const chip = grande.querySelector('em'); if (chip) chip.remove(); });
      mostrar();
      p.append(grande, rango, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function opcionesDe(p, lista, elegida, alElegir, clase) {
      const caja = el('div', 'ent-opciones ' + (clase || ''));
      lista.forEach(([valor, titulo, detalle]) => {
        const b = el('button', 'ent-opcion');
        b.type = 'button';
        b.setAttribute('aria-pressed', String(valor === elegida));
        b.appendChild(el('b', null, titulo));
        if (detalle) b.appendChild(el('span', null, detalle));
        b.addEventListener('click', () => {
          caja.querySelectorAll('.ent-opcion').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          escena.haptico('suave');
          alElegir(valor);
        });
        caja.appendChild(b);
      });
      p.appendChild(caja);
      return caja;
    }

    function armarSexo(p, paso) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.sexoTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.sexoTexto')));
      const seguir = botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal');
      seguir.disabled = !r.sexo;
      opcionesDe(p, [['f', tx('entrada.cuestionario.femenino')], ['m', tx('entrada.cuestionario.masculino')]], r.sexo, (v) => { r.sexo = v; seguir.disabled = false; }, 'ent-dos');
      if (desdeSalud.sexo) p.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      p.appendChild(el('div', 'ent-pie')).appendChild(seguir);
    }

    function armarActividad(p, paso) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.actividadTitulo')));
      opcionesDe(p, ['poco', 'algo', 'activo', 'muy'].map((k) => [k, ...tx('entrada.cuestionario.actividad.' + k)]), r.actividad, (v) => { r.actividad = v; });
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function armarObjetivo(p, paso) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.objetivoTitulo')));
      const ritmo = el('div', 'ent-ritmo');
      const textoRitmo = el('p', 'ent-chico');
      const pintarRitmo = () => {
        ritmo.hidden = r.objetivo === 'mantener';
        if (r.objetivo !== 'mantener') textoRitmo.textContent = tx('entrada.cuestionario.ritmoTexto', { pct: numero(Math.abs(RITMO[r.objetivo][r.ritmo]), 2) });
      };
      if (r.sinDeficit && r.objetivo === 'bajar') r.objetivo = 'mantener';
      const objetivos = opcionesDe(p, [['bajar', tx('entrada.cuestionario.bajar'), r.sinDeficit ? tx('entrada.cuidado.bajarNo') : null], ['mantener', tx('entrada.cuestionario.mantener')], ['subir', tx('entrada.cuestionario.subir')]], r.objetivo, (v) => { r.objetivo = v; pintarRitmo(); });
      // Sin déficit, bajar de peso no se elige acá: se dice por qué, corto.
      if (r.sinDeficit) objetivos.firstChild.disabled = true;
      ritmo.appendChild(el('span', 'ent-paso', tx('entrada.cuestionario.ritmo')));
      opcionesDe(ritmo, ['suave', 'recomendado', 'rapido'].map((k) => [k, tx('entrada.cuestionario.' + k)]), r.ritmo, (v) => { r.ritmo = v; pintarRitmo(); }, 'ent-segmento');
      ritmo.appendChild(textoRitmo);
      p.appendChild(ritmo);
      pintarRitmo();
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    function armarResultado(p) {
      const m = metas(Object.assign({}, r, { sexo: r.sexo || 'm' }));
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.resultadoTitulo')));
      const l = luna('ent-luna-grande');
      const kcalMacros = [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9];
      const total = kcalMacros.reduce((a, b) => a + b, 0) || 1;
      l.repartir(kcalMacros.map((k) => k / total));
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      const cifra = el('div', 'ent-kcal');
      const n = el('b', null, '0');
      cifra.append(n, el('span', null, tx('entrada.cuestionario.kcal')));
      p.append(escenario, cifra);
      const leyenda = el('div', 'ent-macros');
      [['p', 'proteina', m.proteina], ['c', 'carbohidratos', m.carbohidratos], ['g', 'grasas', m.grasas]].forEach(([c, k, g]) => {
        const fila = el('div', 'ent-macro ent-macro-' + c);
        fila.append(el('i'), el('span', null, tx('entrada.cuestionario.' + k)), el('b', null, `${numero(g)} g`));
        leyenda.appendChild(fila);
      });
      p.append(leyenda, el('p', 'ent-chico', tx('entrada.cuestionario.gasto', { n: numero(m.gasto) })), el('p', 'ent-texto', tx('entrada.cuestionario.resultadoTexto')));
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.cuestionario.empezar'), terminar, 'ent-principal'));
      l.llenar(1600, 200);
      // La cifra cuenta hasta la meta.
      const t0 = performance.now() + 200;
      const contar = (ahora) => {
        const u = Math.min(1, Math.max(0, (ahora - t0) / 1400));
        n.textContent = numero(Math.round(m.kcal * (1 - Math.pow(1 - u, 3))));
        if (u < 1 && n.isConnected) requestAnimationFrame(contar);
      };
      requestAnimationFrame(contar);
    }

    // ------------------------------------------------------------ moverse
    function ir(i) {
      clearTimeout(temporizador);
      cancelAnimationFrame(animando);
      const vieja = raiz.querySelector('.ent-pantalla:not(.saliendo)');
      const anterior = PASOS[actual];
      if (anterior && anterior.alSalir) anterior.alSalir();
      if (vieja) {
        vieja.classList.add('saliendo');
        setTimeout(() => vieja.remove(), 420);
      }
      actual = i;
      const paso = PASOS[i];
      escena.camara(paso.camara, i === 0);
      // La pantalla nueva entra cuando la cámara ya empezó a subir.
      setTimeout(() => {
        if (actual !== i) return;
        const p = pantalla('ent-' + paso.id + (paso.cuestionario ? ' ent-cuestionario' : ''));
        const armado = paso.armar(p, paso);
        if (armado && armado.clave) pantallaNumero(p, paso, armado);
        opciones.alCambiar && opciones.alCambiar(paso.id);
      }, vieja ? 260 : 120);
    }

    function siguiente() {
      if (actual < PASOS.length - 1) ir(actual + 1);
    }

    function empezar() {
      clearTimeout(temporizador);
      idioma = escena.idioma;
      raiz.innerHTML = '';
      raiz.hidden = false;
      raiz.style.transform = ''; raiz.style.opacity = ''; raiz.style.filter = '';
      escena.ponerModo('entrada');
      escena.aparecer();
      if (opciones.alEmpezar) opciones.alEmpezar();
      actual = -1;
      ir(0);
    }

    // Al terminar el cuestionario: un «flum» hasta Inicio (opciones.llegada), la comida. Al llegar,
    // opciones.alTerminar (en la app, los primeros hábitos).
    function terminar() {
      clearTimeout(temporizador);
      escena.viajar({
        hasta: { zoom: 1, velo: 0 },
        sale: raiz,
        llega: opciones.llegada ? opciones.llegada() : tel.querySelector('.ui'),
        alCambiar: () => {
          escena.quitarDemo();
          escena.ponerModo('hoy');
          escena.camara(0, true);
          if (opciones.alSalir) opciones.alSalir();
        },
        alLlegar: () => {
          raiz.innerHTML = '';
          actual = -1;
          opciones.alCambiar && opciones.alCambiar(null);
          if (opciones.alTerminar) opciones.alTerminar();
        },
      });
    }

    function salir() {
      clearTimeout(temporizador);
      escena.quitarDemo();
      raiz.hidden = true;
      raiz.innerHTML = '';
      actual = -1;
      escena.ponerModo('hoy');
      escena.camara(0, true);
      if (opciones.alSalir) opciones.alSalir();
    }

    return {
      empezar,
      salir,
      irA(id) { const i = PASOS.findIndex((p) => p.id === id); if (i >= 0) { if (actual < 0) empezar(); ir(i); } },
      // Para las capturas: Salud dice 16 años, o es su caso (sin déficit).
      menor() { r.edad = 16; desdeSalud.edad = 16; },
      caso(v) { r.caso = v; r.sinDeficit = v !== 'nada'; if (v === 'embarazo') r.sexo = 'f'; },
      get paso() { return actual >= 0 ? PASOS[actual].id : null; },
      metas: () => metas(Object.assign({}, r, { sexo: r.sexo || 'm' })),
    };
  }

  return { crear };
})();
