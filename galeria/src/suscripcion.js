// La suscripción (D40, spec/suscripcion.md): una maqueta, sin compras de verdad. Va después de la meta,
// al final de la entrada, y cuando se toca algo de Premium. Lo que Apple pide está a la vista: qué incluye,
// el precio que se cobra como lo más grande, cuánto dura la prueba y lo que se cobra después, restaurar,
// los términos y la privacidad. «Seguir con lo gratis» se ve tanto como lo demás: Moss no insiste.

const Suscripcion = (() => {
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, el, boton, icono } = u;
    const raiz = el('section', 'sb');
    raiz.hidden = true;
    raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-modal', 'true');
    tel.appendChild(raiz);
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());

    const s = { plan: 'anual', vista: 'planes', bloqueo: null, despues: null, cierre: 0 };

    function planes() {
      const cont = el('div', 'sb-scroll');
      if (s.bloqueo) cont.appendChild(el('p', 'sb-bloqueo', tx('suscripcion.bloqueo.' + s.bloqueo)));
      else {
        const cab = el('div', 'sb-cab');
        cab.append(el('i', 'sb-estrella'), el('h2', null, tx('suscripcion.titulo')), el('p', null, tx('suscripcion.bajada')));
        cont.appendChild(cab);
      }
      const lista = (titulo, claves, clase) => {
        const c = el('section', 'sb-lista ' + clase);
        c.appendChild(el('h3', null, titulo));
        const ul = el('ul');
        tx(claves).forEach((t) => ul.appendChild(el('li', null, t)));
        c.appendChild(ul);
        return c;
      };
      cont.appendChild(lista(tx('suscripcion.premiumTitulo'), 'suscripcion.premium', 'sb-premium'));
      if (!s.bloqueo) cont.appendChild(lista(tx('suscripcion.gratisTitulo'), 'suscripcion.gratis', 'sb-gratis'));
      const elegir = el('div', 'sb-planes');
      elegir.setAttribute('role', 'radiogroup');
      ['anual', 'mensual'].forEach((p) => {
        // Sin rearmar nada: el borde y el círculo pasan al otro plan con su transición.
        const b = boton('sb-plan', '', () => elegirPlan(p));
        b.dataset.plan = p;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(s.plan === p));
        // El precio que se cobra es lo más grande; lo que equivale, abajo y en chico (lo pide Apple).
        const textos = el('span', 'sb-plan-textos');
        textos.append(el('small', null, tx(`suscripcion.${p}.nombre`)), el('b', null, tx(`suscripcion.${p}.precio`)), el('em', null, tx(`suscripcion.${p}.detalle`)));
        b.append(el('i', 'sb-radio'), textos);
        elegir.appendChild(b);
      });
      cont.appendChild(elegir);
      const precio = tx(`suscripcion.${s.plan}.precio`);
      const pie = el('div', 'sb-pie');
      pie.appendChild(boton('sb-principal', tx('suscripcion.empezar'), abrirApple));
      pie.appendChild(boton('sb-secundario', s.bloqueo ? tx('suscripcion.bloqueo.cerrar') : tx('suscripcion.seguirGratis'), () => terminar('gratis')));
      const legal = el('div', 'sb-legal');
      legal.append(el('p', 'sb-terminos', tx('suscripcion.legal', { precio })), el('p', 'sb-recuerda', tx('suscripcion.recordatorio')));
      const enlaces = el('div', 'sb-enlaces');
      enlaces.append(
        boton('sb-enlace', tx('suscripcion.restaurar'), () => {
          if (raiz.querySelector('.sb-aviso')) return;
          raiz.querySelector('.sb-legal').appendChild(el('p', 'sb-aviso', tx('suscripcion.restaurando')));
        }),
        boton('sb-enlace', tx('suscripcion.terminos'), () => {}),
        boton('sb-enlace', tx('suscripcion.privacidad'), () => {}),
      );
      legal.appendChild(enlaces);
      cont.appendChild(legal);
      return [cont, pie];
    }

    function elegirPlan(p) {
      s.plan = p;
      raiz.querySelectorAll('.sb-plan').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.plan === p)));
      raiz.querySelector('.sb-terminos').textContent = tx('suscripcion.legal', { precio: tx(`suscripcion.${p}.precio`) });
    }
    function abrirApple() {
      if (!raiz.querySelector('.sb-apple-fondo')) raiz.appendChild(hojaApple());
    }
    /** El dibujo de la hoja de Apple, solo en la galería: en la app la pone iOS. */
    function hojaApple() {
      const fondo = el('div', 'sb-apple-fondo');
      const h = el('div', 'sb-apple');
      const cab = el('div', 'sb-apple-cab');
      cab.append(el('b', null, tx('suscripcion.apple.tienda')), boton('sb-apple-x', tx('suscripcion.apple.cancelar'), () => {
        fondo.classList.add('saliendo');
        setTimeout(() => fondo.remove(), quieto() ? 0 : 280);
      }));
      const ficha = el('div', 'sb-apple-ficha');
      ficha.append(el('b', null, `${tx('suscripcion.titulo')} · ${tx(`suscripcion.${s.plan}.nombre`)}`), el('span', null, tx('suscripcion.apple.prueba')), el('span', null, tx('suscripcion.apple.despues', { precio: tx(`suscripcion.${s.plan}.precio`) })), el('small', null, tx('suscripcion.apple.cuenta')));
      h.append(cab, ficha, boton('sb-apple-si', tx('suscripcion.apple.confirmar'), () => { s.vista = 'listo'; pintar(); }), el('p', 'sb-apple-nota', tx('suscripcion.apple.nota')));
      fondo.appendChild(h);
      return fondo;
    }

    function listo() {
      const c = el('div', 'sb-listo');
      c.append(el('i', 'sb-estrella grande'), el('h2', null, tx('suscripcion.listo.titulo')), el('p', null, tx('suscripcion.listo.texto')), boton('sb-principal', tx('suscripcion.listo.seguir'), () => terminar('prueba')));
      return c;
    }

    function pintar() {
      raiz.innerHTML = '';
      if (s.vista === 'listo') { raiz.appendChild(listo()); return; }
      if (s.bloqueo) raiz.appendChild(boton('hb-cerrar', icono('cerrar'), () => terminar('gratis'), tx('comida.cerrar')));
      planes().forEach((n) => raiz.appendChild(n));
    }

    function terminar(estado) {
      if (opciones.alCambiar) opciones.alCambiar(estado);
      cerrar();
      const despues = s.despues;
      s.despues = null;
      if (despues) despues(estado);
    }
    function abrir({ bloqueo, despues } = {}) {
      clearTimeout(s.cierre);
      Object.assign(s, { plan: 'anual', vista: 'planes', bloqueo: bloqueo || null, despues: despues || null });
      raiz.hidden = false;
      raiz.classList.remove('saliendo');
      raiz.classList.toggle('sb-chica', !!bloqueo);
      pintar();
    }
    /** Lo que es de Premium, en su lugar (Sueño y Progreso): lo dice y lleva a verlo. */
    function carta(que) {
      const c = el('section', 'pg-carta sb-carta');
      const textos = el('div', 'sb-carta-textos');
      textos.append(el('b', null, tx('suscripcion.bloqueo.' + que)), el('p', null, tx('suscripcion.prueba')));
      c.append(textos, boton('sb-carta-boton', tx('suscripcion.perfil.verPlanes'), () => abrir({ bloqueo: que })));
      return c;
    }
    function cerrar() {
      raiz.classList.add('saliendo');
      s.cierre = setTimeout(() => { raiz.hidden = true; raiz.classList.remove('saliendo'); }, quieto() ? 0 : 340);
    }
    return {
      abrir, cerrar, carta,
      get abierta() { return !raiz.hidden; },
      // Para las capturas: el plan, la hoja de Apple, lo último y bajar.
      plan: elegirPlan,
      apple: abrirApple,
      listo() { s.vista = 'listo'; pintar(); },
      bajar() { const c = raiz.querySelector('.sb-scroll'); if (c) c.scrollTop = c.scrollHeight; },
    };
  }
  return { crear };
})();
