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
    const s = { abierta: null, fuente: 'auto', sinDeficit: false, numeros: true, buscar: false };

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
        // Sin déficit: embarazo, lactancia o una condición médica (no se guarda cuál).
        ['perfil.cuidado', tx(s.sinDeficit ? 'perfil.sinDeficit' : 'perfil.ninguno'), true, s.sinDeficit ? 'ok' : null, () => { s.sinDeficit = !s.sinDeficit; pintar(); }, s.sinDeficit ? 'perfil.sinDeficitTexto' : null],
      ]);
      grupo('perfil.preferencias', [
        ['perfil.unidades', tx('perfil.metrico'), true],
        ['perfil.idioma', u.idioma() === 'es' ? 'Español' : 'English', true],
        ['perfil.calidad', tx('perfil.alta'), true],
        ['perfil.recordatorios', tx('perfil.apagados'), true],
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
      ['usda', 'off', 'taco', 'estrellas'].forEach((f) => creditos.appendChild(el('li', null, tx('perfil.fuentes.' + f))));
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
