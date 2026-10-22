// Perfil, la última sección (antes Ajustes): tus datos, las preferencias, Salud y Ascent, y tus
// datos para llevar o borrar. Las metas pasaron a Progreso, con la estrategia. Es una maqueta: lo
// que hace cada fila ya está en la especificación.

const SeccionPerfil = (() => {
  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;

    const zona = el('section', 'perfil pagina-app');
    zona.innerHTML = '<div class="pf-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.pf-scroll');

    function pintar() {
      cont.innerHTML = '';
      const p = opciones.persona().perfil;
      const cab = el('header', 'pf-cab');
      const inicial = el('div', 'pf-inicial', p.nombre.charAt(0));
      const nombres = el('div', 'pf-nombres');
      nombres.append(el('h2', null, p.nombre), el('span', null, tx('perfil.cuentaTexto')));
      cab.append(inicial, nombres);
      cont.appendChild(cab);

      const grupo = (titulo, filas) => {
        cont.appendChild(el('h3', 'pf-grupo', tx(titulo)));
        const ul = el('ul', 'pf-lista');
        filas.forEach(([clave, valor, conFlecha, clase, alTocar]) => {
          const li = el('li', (conFlecha ? 'pf-tocable ' : '') + (clase || ''));
          li.append(el('span', null, tx(clave)), el('b', null, valor));
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
      ]);
      grupo('perfil.preferencias', [
        ['perfil.unidades', tx('perfil.metrico'), true],
        ['perfil.idioma', u.idioma() === 'es' ? 'Español' : 'English', true],
        ['perfil.calidad', tx('perfil.alta'), true],
        ['perfil.recordatorios', tx('perfil.apagados'), true],
      ]);
      grupo('perfil.conexiones', [
        ['perfil.salud', tx('perfil.conectada'), true, 'ok'],
        // Lleva a la sección de Ascent, arriba de Hábitos: ahí se vincula y se ve lo de las dos.
        opciones.vinculada() ? ['perfil.ascent', tx('perfil.vinculada'), true, 'ok', opciones.abrirAscent] : ['perfil.ascent', tx('perfil.vincular'), true, 'accion', opciones.abrirAscent],
      ]);
      grupo('perfil.tusDatosParaLlevar', [
        ['perfil.exportar', 'CSV', true],
        ['perfil.privacidad', '', true],
        ['perfil.borrarDatos', '', true, 'peligro'],
      ]);
      const salir = boton('pf-salir', tx('perfil.cerrarSesion'), () => {});
      cont.appendChild(salir);
      cont.appendChild(el('p', 'pf-version', 'Moss 1.0 (1)'));
    }

    pintar();
    return { zona, pintar };
  }

  return { crear };
})();
