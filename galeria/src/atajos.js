// La guía del cargador (spec/sueno-sin-esfuerzo.md): armar la automatización que avisa a Moss cuando
// conectas o desconectas el cargador, en menos de un minuto, con un iPhone dibujado que muestra qué tocar.
// Hay dos caminos: en iOS 27 la automatización viaja con el atajo (un toque, la llave y «Añadir»); hasta
// iOS 26, el atajo se instala igual de un toque y la automatización se arma a mano. Termina probándolo:
// Moss no ve las automatizaciones de Atajos, pero sí lo que le llega (SinReloj.estadoDelCargador).

const GuiaAtajos = (() => {
  // Cada pantalla del iPhone dibujado y qué hay que tocar en ella.
  const PASOS = {
    27: [
      { id: 'instalar', clave: 'conAtajos27.instalar', pantalla: 'moss' },
      { id: 'activar', clave: 'conAtajos27.activar', pantalla: 'importar', toca: 'llave' },
      { id: 'anadir', clave: 'conAtajos27.anadir', pantalla: 'importarListo', toca: 'anadir' },
    ],
    26: [
      { id: 'instalar', clave: 'conAtajos26.instalar', pantalla: 'importarSimple', toca: 'anadir' },
      { id: 'automatizacion', clave: 'conAtajos26.automatizacion', pantalla: 'automatizaciones', toca: 'mas' },
      { id: 'cargador', clave: 'conAtajos26.cargador', pantalla: 'lista', toca: 'cargador' },
      { id: 'marcar', clave: 'conAtajos26.marcar', pantalla: 'marcar', toca: 'siguiente' },
      { id: 'elegir', clave: 'conAtajos26.elegir', pantalla: 'elegir', toca: 'atajo' },
    ],
  };
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, el, boton, icono } = u;
    const ios = (clave) => tx('sueno.afinar.cargador.guia.ios.' + clave);
    const guia = (clave, vars) => tx('sueno.afinar.cargador.guia.' + clave, vars);
    const raiz = el('section', 'gc');
    raiz.hidden = true;
    raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-modal', 'true');
    tel.appendChild(raiz);
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());

    const s = { version: 27, paso: -1, llave: false, llego: false, marcadas: false, solo: 0, cierre: 0 };
    const pasos = () => PASOS[s.version];
    /** -1 es la presentación; después, cada paso; al final, probarlo. */
    const enPrueba = () => s.paso >= pasos().length;

    /** El iPhone dibujado: una pantalla de la app Atajos, con lo que hay que tocar latiendo. */
    function dibujo(paso) {
      const marco = el('div', 'gc-tel');
      marco.appendChild(el('i', 'gc-isla'));
      const p = el('div', 'gc-pantalla entra');
      const toca = (clase, contenido, id) => {
        const b = boton(clase + (paso.toca === id ? ' gc-toca' : ''), contenido, () => { if (paso.toca === id) avanzar(); });
        if (paso.toca !== id) b.tabIndex = -1;
        return b;
      };
      const fila = (texto, id, extra) => {
        const b = toca('gc-fila', `<span>${texto}</span>${extra || '<em>›</em>'}`, id);
        return b;
      };
      const barra = (titulo) => {
        const c = el('div', 'gc-barra');
        c.append(el('b', null, titulo));
        return c;
      };
      if (paso.pantalla === 'moss') {
        // Es la pantalla de Moss: el botón de verdad se toca abajo.
        p.classList.add('gc-en-moss');
        const logo = el('div', 'gc-moss');
        logo.append(el('b', null, 'Moss'), el('span', null, tx('sueno.afinar.cargador.titulo')));
        p.append(logo, toca('gc-instalar gc-toca', guia('conAtajos27.instalar.titulo'), 'instalar'));
        p.lastChild.addEventListener('click', () => avanzar());
      } else if (paso.pantalla === 'importar' || paso.pantalla === 'importarListo' || paso.pantalla === 'importarSimple') {
        p.classList.add('gc-hoja-ios');
        const ficha = el('div', 'gc-ficha');
        ficha.append(el('i', 'gc-glifo'), el('b', null, ios('atajo')));
        p.appendChild(ficha);
        if (paso.pantalla !== 'importarSimple') {
          p.appendChild(el('p', 'gc-cuando', ios('cuando')));
          const llave = toca('gc-fila gc-llave-fila', `<span>${ios('activar')}</span><i class="gc-llave${s.llave ? ' si' : ''}"></i>`, 'llave');
          p.appendChild(llave);
        }
        p.appendChild(toca('gc-principal', ios('anadir'), 'anadir'));
      } else if (paso.pantalla === 'automatizaciones') {
        const cab = barra(ios('automatizacion'));
        cab.appendChild(toca('gc-mas', '+', 'mas'));
        p.appendChild(cab);
        const vacio = el('div', 'gc-vacio');
        vacio.append(el('i', 'gc-glifo chico'), el('span', null, ios('nueva')));
        p.appendChild(vacio);
        const pest = el('div', 'gc-pestanas');
        pest.append(el('span', null, ios('atajos')), el('b', null, ios('automatizacion')));
        p.appendChild(pest);
      } else if (paso.pantalla === 'lista') {
        p.appendChild(barra(ios('nueva')));
        p.appendChild(el('div', 'gc-buscar', ios('buscar')));
        [ios('alarma'), ios('sueno')].forEach((t) => p.appendChild(fila(t, '')));
        p.appendChild(fila(ios('cargador'), 'cargador'));
      } else if (paso.pantalla === 'marcar') {
        p.appendChild(barra(ios('cargador')));
        const m = (t) => { const c = el('div', 'gc-fila gc-marca'); c.innerHTML = `<span>${t}</span><em class="si">✓</em>`; return c; };
        p.append(m(ios('conectado')), m(ios('desconectado')));
        const r = (t, si) => { const c = el('div', 'gc-fila gc-marca'); c.innerHTML = `<span>${t}</span>${si ? '<em class="si">✓</em>' : '<em></em>'}`; return c; };
        p.appendChild(el('i', 'gc-espacio'));
        p.append(r(ios('confirmar'), false), r(ios('ejecutar'), true));
        p.appendChild(toca('gc-principal', ios('siguiente'), 'siguiente'));
      } else if (paso.pantalla === 'elegir') {
        p.appendChild(barra(ios('misAtajos')));
        p.appendChild(el('div', 'gc-buscar', ios('buscar')));
        p.append(fila(ios('otro1'), ''), fila(ios('atajo'), 'atajo'), fila(ios('otro2'), ''));
      }
      marco.appendChild(p);
      return marco;
    }

    function avanzar() {
      clearTimeout(s.solo);
      // La llave se prende a la vista y recién después sigue.
      if (pasos()[s.paso] && pasos()[s.paso].id === 'activar' && !s.llave) {
        s.llave = true;
        const llave = raiz.querySelector('.gc-llave');
        if (llave) llave.classList.add('si');
        s.solo = setTimeout(() => { s.paso++; pintar(); }, quieto() ? 0 : 420);
        return;
      }
      s.paso++;
      pintar();
    }

    function pintar() {
      raiz.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), boton('hb-cerrar', icono('cerrar'), cerrar, tx('comida.cerrar')));
      const cuerpo = el('div', 'gc-cuerpo');
      if (s.paso < 0) {
        cuerpo.appendChild(el('h3', 'gc-titulo', guia('titulo')));
        const lista = el('ul', 'gc-puntos');
        guia('puntos').forEach((t) => lista.appendChild(el('li', null, t)));
        cuerpo.append(lista, el('p', 'gc-chico', guia('minuto')));
        const pie = el('div', 'gc-pie');
        pie.append(boton('sn-si gc-ancho', guia('empezar'), () => { s.paso = 0; pintar(); }), boton('sn-otra gc-ancho', guia('mirar'), mirar));
        raiz.append(cab, cuerpo, pie);
        return;
      }
      if (enPrueba()) {
        const caja = el('div', 'gc-prueba');
        caja.appendChild(el('h3', 'gc-titulo', guia('probar.titulo')));
        caja.appendChild(el('p', 'gc-texto', guia('probar.texto')));
        const estado = el('div', 'gc-estado' + (s.llego ? ' llego' : ''));
        estado.append(el('i'), el('span', null, s.llego ? guia('probar.llego', { hora: '23:41' }) : guia('probar.esperando')));
        caja.appendChild(estado);
        cuerpo.appendChild(caja);
        const pie = el('div', 'gc-pie');
        if (s.llego) pie.appendChild(boton('sn-si gc-ancho', guia('probar.listo'), () => { if (opciones.alArmar) opciones.alArmar(); cerrar(); }));
        // Solo en la galería: el cargador de verdad no se puede enchufar acá.
        else pie.appendChild(boton('sn-otra gc-ancho gc-simular', '(galería) Conectar el cargador', () => { s.llego = true; pintar(); }));
        raiz.append(cab, cuerpo, pie);
        return;
      }
      const paso = pasos()[s.paso];
      cuerpo.appendChild(el('p', 'gc-cuenta', guia('paso', { n: s.paso + 1, total: pasos().length + 1 })));
      cuerpo.appendChild(el('h3', 'gc-titulo', guia(paso.clave + '.titulo')));
      cuerpo.appendChild(el('p', 'gc-texto', guia(paso.clave + '.texto')));
      cuerpo.appendChild(dibujo(paso));
      const pie = el('div', 'gc-pie gc-pie-atras');
      pie.appendChild(boton('gc-atras', `${icono('atras')}<span>${guia('atras')}</span>`, () => { clearTimeout(s.solo); s.llave = false; s.paso--; pintar(); }));
      raiz.append(cab, cuerpo, pie);
    }

    /** Sola, un paso cada 2,4 segundos: para mirarla una vez antes de ir a Atajos. */
    function mirar() {
      s.paso = 0;
      pintar();
      const seguir = () => {
        if (raiz.hidden || enPrueba()) return;
        s.solo = setTimeout(() => { avanzar(); seguir(); }, 2400);
      };
      seguir();
    }

    function abrir(version) {
      clearTimeout(s.cierre);
      clearTimeout(s.solo);
      Object.assign(s, { version: version === 26 ? 26 : 27, paso: -1, llave: false, llego: false });
      raiz.hidden = false;
      raiz.classList.remove('saliendo');
      pintar();
    }
    function cerrar() {
      clearTimeout(s.solo);
      raiz.classList.add('saliendo');
      s.cierre = setTimeout(() => { raiz.hidden = true; raiz.classList.remove('saliendo'); }, quieto() ? 0 : 320);
    }
    return {
      abrir, cerrar,
      get abierta() { return !raiz.hidden; },
      // Para las capturas: un paso (`-1` la presentación; más allá del último, probarlo), con la llave y lo que llegó.
      irA(paso, extra) { clearTimeout(s.solo); Object.assign(s, { paso, llave: !!(extra && extra.llave), llego: !!(extra && extra.llego) }); pintar(); },
    };
  }
  return { crear };
})();
