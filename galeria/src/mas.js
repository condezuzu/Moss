// El «+» del medio de la barra (spec/especificacion.md, cambio 9): una hoja con lo que se anota.
// Arriba, lo principal: agregar comida (abre la hoja de registro de siempre) y registrar el peso.
// Abajo, la carga rápida: calorías y macros a mano, los recientes y las comidas guardadas (un toque
// las registra en la comida de esta hora, con deshacer) y el agua. Al final, las medidas del cuerpo
// con la cinta, que estiman la grasa corporal como un rango chico (Cuerpo, src/dominio/cuerpo.ts).

const Mas = (() => {
  // Dónde va la cinta en el dibujo de cada medida: [x1, y, x2, curva].
  const CINTA = {
    cuello: [53, 41, 67, 2.5], pecho: [36.5, 65, 83.5, 5], cintura: [41, 97, 79, 4.5], cadera: [37.5, 118, 82.5, 5],
    brazo: [22.6, 74, 33.8, 2.4], muslo: [40.5, 150, 57.5, 3],
  };

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const comida = opciones.comida;
    const s = { vista: 'menu', sitio: 'cintura', hechos: new Set(), aviso: 0 };

    const hoja = Util.hoja(tel, 'mas', () => { s.vista = 'menu'; opciones.alCambiar(); });
    const h = hoja.el;
    h.setAttribute('aria-label', tx('mas.titulo'));
    // Cada toque adentro cuenta para el registro (galeria.js muestra los toques de cada uno).
    h.addEventListener('click', (ev) => { if (ev.target.closest('[data-toque]')) comida.contarToque(); }, true);

    function abrir() {
      s.vista = 'menu';
      s.hechos.clear();
      pintar();
      hoja.abrir();
      opciones.alCambiar();
    }
    const cerrar = (deUna) => hoja.cerrar(deUna);

    function aviso(texto, deshacer) {
      let a = h.querySelector('.mas-aviso');
      if (!a) { a = el('div', 'mas-aviso'); a.setAttribute('role', 'status'); h.appendChild(a); }
      a.innerHTML = '';
      a.appendChild(el('span', null, texto));
      if (deshacer) a.appendChild(boton('mas-aviso-btn', tx('comun.deshacer'), () => { a.classList.remove('visible'); deshacer(); }));
      a.classList.add('visible');
      clearTimeout(s.aviso);
      s.aviso = setTimeout(() => a.classList.remove('visible'), deshacer ? 4200 : 2600);
    }

    function pintar() {
      h.innerHTML = '';
      h.dataset.vista = s.vista;
      h.appendChild(el('div', 'hb-asa'));
      if (s.vista === 'menu') pintarMenu();
      else if (s.vista === 'peso') pintarPeso();
      else if (s.vista === 'medidas') pintarMedidas();
      else pintarRapida();
    }
    const ir = (vista) => { s.vista = vista; pintar(); opciones.alCambiar(); };

    function cabeza(titulo) {
      const cab = el('header', 'mas-cab');
      cab.append(boton('mas-atras', icono('atras'), () => ir('menu'), tx('comun.atras')), el('h3', null, titulo), el('span'));
      h.appendChild(cab);
    }

    // ------------------------------------------------------------ lo principal y la carga rápida
    function pintarMenu() {
      const tipo = comida.comidaDeAhora();
      const persona = opciones.persona();
      // Decir la comida entera de una vez: lo más rápido para lo que no es de siempre.
      const decir = boton('mas-principal mas-decir', `${icono('microfono')}<b>${tx('mas.decir')}</b><span>${tx('mas.decirDetalle')}</span>`, () => {
        cerrar(true);
        comida.abrirHoja({});
        comida.decir({ escuchar: true });
      });
      const principales = el('div', 'mas-principales');
      principales.appendChild(decir);
      const agregar = boton('mas-principal', `${icono('comida')}<b>${tx('mas.agregarComida')}</b><span>${tx('comida.comidas.' + tipo)}</span>`, () => {
        cerrar(true);
        comida.abrirHoja({});
      });
      const ultima = persona.pesadas[persona.pesadas.length - 1];
      const peso = boton('mas-principal', `${icono('balanza')}<b>${tx('mas.registrarPeso')}</b><span>${ultima ? tx('mas.ultimoPeso', { cuando: ultima.fecha === Datos.HOY ? tx('mas.hoy') : u.fechaCorta(ultima.fecha), peso: `${numero(ultima.kg, 1)} kg` }) : ''}</span>`, () => ir('peso'));
      principales.append(agregar, peso);
      h.appendChild(principales);

      h.appendChild(el('h4', 'mas-etq', tx('mas.cargaRapida')));
      const rapidos = el('div', 'mas-rapidos');
      rapidos.appendChild(boton('mas-rapido', `${icono('rayo')}<span>${tx('mas.caloriasYMacros')}</span>`, () => ir('rapida')));
      const a = comida.agua();
      const agua = el('div', 'mas-rapido mas-agua');
      agua.innerHTML = icono('gota');
      const txt = el('span', 'mas-agua-txt');
      txt.append(tx('mas.agua'), el('b', null, `${Porciones.decimal(a.litros, u.idioma())} L`));
      agua.append(txt, boton('mas-agua-mas', icono('mas'), () => {
        comida.sumarAgua();
        txt.querySelector('b').textContent = `${Porciones.decimal(comida.agua().litros, u.idioma())} L`;
        aviso(tx('mas.vasoSumado'), () => { comida.quitarAgua(); txt.querySelector('b').textContent = `${Porciones.decimal(comida.agua().litros, u.idioma())} L`; });
      }, tx('mas.sumarVaso')));
      rapidos.appendChild(agua);
      h.appendChild(rapidos);

      // Un toque y queda registrado en la comida de esta hora, con su última cantidad.
      const fila = (titulo, lista, alTocar) => {
        if (!lista.length) return;
        h.appendChild(el('h4', 'mas-etq', titulo));
        const carril = el('div', 'mas-chips');
        lista.forEach((x) => {
          const chip = boton('mas-chip' + (s.hechos.has(x.clave) ? ' hecho' : ''), `<b></b><span></span>`, () => {
            const r = alTocar(x);
            if (!r) return;
            s.hechos.add(x.clave);
            chip.classList.add('hecho');
            aviso(tx('mas.registrado', { que: x.nombre, donde: tx('comida.aLa.' + r.tipo) }), () => {
              r.deshacer();
              s.hechos.delete(x.clave);
              chip.classList.remove('hecho');
            });
          });
          chip.querySelector('b').textContent = x.nombre;
          chip.querySelector('span').textContent = [x.detalle, `${numero(Math.round(x.kcal))} kcal`].filter(Boolean).join(' · ');
          carril.appendChild(chip);
        });
        h.appendChild(carril);
      };
      fila(tx('mas.recientes'), comida.recientes(8).map((r) => ({ clave: 'r' + r.id, id: r.id, nombre: r.nombre, detalle: r.cantidad, kcal: r.kcal })), (x) => comida.registrarReciente(x.id));
      fila(tx('mas.guardadas'), comida.listaGuardadas().map((g) => ({ clave: 'g' + g.i, i: g.i, nombre: g.nombre, kcal: g.kcal })), (x) => comida.registrarGuardada(x.i));

      // Las medidas del cuerpo, con lo último que estimaron.
      const rango = persona.grasa;
      const medidas = boton('mas-medidas', `${icono('cinta')}<div><b>${tx('mas.medidas')}</b><span>${tx('mas.medidasTexto')}</span></div><em></em>${icono('adelante')}`, () => ir('medidas'));
      medidas.querySelector('em').textContent = rango ? tx('cuerpo.rango', { desde: rango.desde, hasta: rango.hasta }) : '';
      h.appendChild(medidas);
    }

    // ------------------------------------------------------------ el peso
    function pintarPeso() {
      cabeza(tx('mas.registrarPeso'));
      const persona = opciones.persona();
      const ultima = persona.pesadas[persona.pesadas.length - 1];
      let kg = ultima ? ultima.kg : 75;
      const cuerpo = el('div', 'mas-cuerpo mas-peso');
      const cifra = el('div', 'mas-peso-cifra');
      const entrada = el('input');
      entrada.type = 'text';
      entrada.inputMode = 'decimal';
      entrada.setAttribute('aria-label', tx('mas.registrarPeso'));
      const poner = () => { entrada.value = Porciones.decimal(Math.round(kg * 10) / 10, u.idioma()); };
      entrada.addEventListener('input', () => { const n = Number(entrada.value.replace(',', '.')); if (n > 0) kg = n; });
      cifra.append(boton('fi-paso', icono('menos'), () => { kg = Math.max(20, kg - 0.1); poner(); }, '−0,1'), entrada, el('span', null, 'kg'), boton('fi-paso', icono('mas'), () => { kg = Math.min(400, kg + 0.1); poner(); }, '+0,1'));
      poner();
      cuerpo.append(cifra, el('p', 'mas-peso-dia', tx('mas.pesoHoy')));
      const datos = el('div', 'mas-peso-datos');
      if (ultima) datos.append(el('span', null, tx('mas.ultimoPeso', { cuando: u.fechaCorta(ultima.fecha), peso: `${numero(ultima.kg, 1)} kg` })));
      if (persona.pesoHoy != null) datos.append(el('span', null, tx('mas.tendencia', { peso: `${numero(persona.pesoHoy, 1)} kg` })));
      cuerpo.append(datos, el('p', 'mas-nota', tx('mas.pesoNota')));
      h.appendChild(cuerpo);
      const pie = el('footer', 'mas-pie');
      pie.appendChild(boton('fi-agregar', tx('comun.guardar'), () => {
        if (!(kg >= 20 && kg <= 400)) { entrada.focus(); return; }
        opciones.alPeso(Math.round(kg * 10) / 10);
        ir('menu');
        aviso(tx('mas.pesoGuardado', { peso: `${numero(kg, 1)} kg` }));
      }));
      h.appendChild(pie);
    }

    // ------------------------------------------------------------ la carga rápida
    function pintarRapida() {
      const tipo = comida.comidaDeAhora();
      cabeza(tx('mas.caloriasYMacros'));
      const cuerpo = el('div', 'mas-cuerpo');
      const campos = {};
      const campo = (clave, etiqueta, unidad, texto) => {
        const f = el('label', 'cr-campo');
        const input = el('input');
        input.type = 'text';
        if (texto) input.placeholder = tx('comida.opcional'); else { input.inputMode = 'decimal'; input.placeholder = '0'; }
        f.append(el('span', null, etiqueta), input);
        if (unidad) f.appendChild(el('em', null, unidad));
        input.addEventListener('input', pintarBoton);
        campos[clave] = input;
        cuerpo.appendChild(f);
      };
      campo('nombre', tx('comida.nombre'), '', true);
      campo('kcal', tx('comida.kcal'), 'kcal');
      campo('p', tx('comida.proteina'), 'g');
      campo('c', tx('comida.carbohidratos'), 'g');
      campo('g', tx('comida.grasas'), 'g');
      cuerpo.appendChild(el('p', 'cr-nota', tx('comida.cargaRapidaTexto')));
      h.appendChild(cuerpo);
      const leer = (k) => Number(String(campos[k].value).replace(',', '.')) || 0;
      const valores = () => { const p = leer('p'), c = leer('c'), g = leer('g'); return { kcal: campos.kcal.value ? leer('kcal') : p * 4 + c * 4 + g * 9, p, c, g }; };
      const pie = el('footer', 'mas-pie');
      const b = boton('fi-agregar', tx('comida.agregarA.' + tipo), () => {
        const v = valores();
        if (!v.kcal) { campos.kcal.focus(); return; }
        const nombre = campos.nombre.value.trim();
        const r = comida.registrarRapida(v, nombre);
        ir('menu');
        aviso(tx('mas.registrado', { que: nombre || tx('comida.cargaRapida'), donde: tx('comida.aLa.' + r.tipo) }), () => r.deshacer());
      });
      pie.appendChild(b);
      h.appendChild(pie);
      function pintarBoton() {
        const v = valores();
        campos.kcal.placeholder = v.kcal && !campos.kcal.value ? numero(Math.round(v.kcal)) : '0';
        b.disabled = !v.kcal;
      }
      pintarBoton();
    }

    // ------------------------------------------------------------ las medidas del cuerpo
    // El dibujo marca dónde va la cinta en la medida que se está escribiendo, con cómo tomarla; los
    // consejos de siempre van arriba, plegados. Lo que se estima sale de las medidas que hay (las de
    // hoy y, si falta alguna, la última).
    function pintarMedidas() {
      cabeza(tx('mas.medidas'));
      const persona = opciones.persona();
      const sexo = persona.perfil.sexo;
      const ultimas = persona.ultimasMedidas;
      const nuevas = {};
      const cuerpo = el('div', 'mas-cuerpo mas-medidas-cuerpo');

      const tutorial = el('div', 'mas-tutorial');
      const dibujo = el('div', 'mas-figura');
      dibujo.innerHTML = figura();
      const como = el('div', 'mas-como');
      tutorial.append(dibujo, como);
      cuerpo.appendChild(tutorial);

      const consejos = el('details', 'mas-consejos');
      consejos.appendChild(el('summary', null, tx('cuerpo.comoMedir')));
      const lista = el('ul');
      tx('cuerpo.consejos').forEach((c) => lista.appendChild(el('li', null, c)));
      consejos.appendChild(lista);
      cuerpo.appendChild(consejos);

      const campos = el('div', 'mas-campos');
      const usadas = sexo === 'm' ? ['cintura', 'cuello'] : ['cintura', 'cuello', 'cadera'];
      Cuerpo.SITIOS.forEach((sitio) => {
        const f = el('label', 'cr-campo mas-campo' + (usadas.includes(sitio) ? ' usada' : ''));
        f.dataset.sitio = sitio;
        const input = el('input');
        input.type = 'text';
        input.inputMode = 'decimal';
        input.placeholder = ultimas[sitio] != null ? Porciones.decimal(ultimas[sitio], u.idioma()) : '—';
        input.addEventListener('focus', () => elegir(sitio));
        input.addEventListener('input', () => {
          const n = Number(input.value.replace(',', '.'));
          if (input.value.trim() && Cuerpo.medidaValida(sitio, n)) nuevas[sitio] = n; else delete nuevas[sitio];
          f.classList.toggle('mal', !!input.value.trim() && !Cuerpo.medidaValida(sitio, n));
          pintarResultado();
        });
        const nombre = el('span');
        nombre.append(tx('cuerpo.sitios.' + sitio));
        if (ultimas.fechas[sitio]) nombre.appendChild(el('small', null, tx('cuerpo.ultima', { fecha: u.fechaCorta(ultimas.fechas[sitio]) })));
        f.append(nombre, input, el('em', null, 'cm'));
        f.addEventListener('click', () => elegir(sitio));
        campos.appendChild(f);
      });
      cuerpo.appendChild(campos);
      cuerpo.appendChild(el('p', 'cr-nota', tx(sexo === 'm' ? 'cuerpo.usaHombre' : 'cuerpo.usaMujer')));

      const resultado = el('article', 'mas-grasa');
      cuerpo.appendChild(resultado);
      h.appendChild(cuerpo);

      const pie = el('footer', 'mas-pie');
      const guardar = boton('fi-agregar', tx('comun.guardar'), () => {
        if (!Object.keys(nuevas).length) return;
        opciones.alMedidas(Object.assign({}, nuevas));
        ir('menu');
        aviso(tx('mas.medidasGuardadas'));
      });
      pie.appendChild(guardar);
      h.appendChild(pie);

      function elegir(sitio) {
        s.sitio = sitio;
        dibujo.querySelectorAll('[data-cinta]').forEach((n) => n.classList.toggle('activa', n.dataset.cinta === sitio));
        como.innerHTML = '';
        const texto = tx(`cuerpo.como.${sitio}${sitio === 'cintura' ? (sexo === 'm' ? 'Hombre' : 'Mujer') : ''}`);
        como.append(el('b', null, tx('cuerpo.sitios.' + sitio)), el('p', null, texto));
        campos.querySelectorAll('.mas-campo').forEach((f) => f.classList.toggle('elegida', f.dataset.sitio === sitio));
      }

      function pintarResultado() {
        const cm = Object.assign({}, ultimas, nuevas);
        const r = Cuerpo.rangoDeGrasa(sexo, persona.perfil.alturaCm, cm);
        resultado.innerHTML = '';
        resultado.appendChild(el('span', 'mas-grasa-etq', tx('cuerpo.grasaEstimada')));
        resultado.appendChild(el('b', 'mas-grasa-rango', r ? tx('cuerpo.rango', { desde: r.desde, hasta: r.hasta }) : '—'));
        resultado.appendChild(el('p', 'mas-grasa-aviso', tx('cuerpo.aviso')));
        guardar.disabled = !Object.keys(nuevas).length;
      }

      elegir(s.sitio);
      pintarResultado();
    }

    // Una figura de frente, sin rasgos: lo que importa es dónde va la cinta.
    function figura() {
      const cintas = Object.entries(CINTA).map(([sitio, [x1, y, x2, curva]]) => {
        const medio = (x1 + x2) / 2;
        return `<path data-cinta="${sitio}" d="M${x1} ${y} Q${medio} ${y + curva} ${x2} ${y}" class="mas-cinta"/>`;
      }).join('');
      return `<svg viewBox="0 0 120 240" aria-hidden="true">
        <g class="mas-cuerpo-fig">
          <ellipse cx="60" cy="21" rx="11.5" ry="13.5"/>
          <rect x="54" y="31" width="12" height="15" rx="4"/>
          <rect x="22" y="51" width="11" height="74" rx="5.5" transform="rotate(7 27.5 51)"/>
          <rect x="87" y="51" width="11" height="74" rx="5.5" transform="rotate(-7 92.5 51)"/>
          <rect x="40" y="118" width="18" height="114" rx="9" transform="rotate(2 49 118)"/>
          <rect x="62" y="118" width="18" height="114" rx="9" transform="rotate(-2 71 118)"/>
          <path d="M44 45.5C50 43 70 43 76 45.5L83.5 50.5C85.5 58 84.5 71 81.5 81C79.5 88 78.5 94 79 100C80 108 83 113 83 122C83 127 79 129 75 129L45 129C41 129 37 127 37 122C37 113 40 108 41 100C41.5 94 40.5 88 38.5 81C35.5 71 34.5 58 36.5 50.5Z"/>
        </g>
        <circle cx="60" cy="99.5" r="0.9" class="mas-ombligo"/>
        ${cintas}
      </svg>`;
    }

    return {
      abrir,
      cerrar,
      get abierta() { return hoja.abierta; },
      get vista() { return s.vista; },
      // Para las capturas y los botones de la galería.
      ir(vista) { if (!hoja.abierta) abrir(); ir(vista); },
      medir(sitio, cm) {
        const f = h.querySelector(`.mas-campo[data-sitio="${sitio}"] input`);
        if (!f) return;
        f.focus({ preventScroll: true });
        f.value = Porciones.decimal(cm, u.idioma());
        f.dispatchEvent(new Event('input'));
      },
      bajar() { const c = h.querySelector('.mas-cuerpo'); if (c) c.scrollTo(0, 99999); },
      tocarReciente() { const b = h.querySelector('.mas-chip'); if (b) b.click(); },
    };
  }

  return { crear };
})();
