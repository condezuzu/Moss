// «¿Tienes un código?» en la pantalla de pago (27/11, para aprobar): para los códigos de oferta de Apple (el del póster
// de los gimnasios). El código no lo lee Moss: se escribe en la hoja de canje de Apple, que muestra la oferta y
// confirma la suscripción ahí mismo (acá, dibujada, como la otra hoja de Apple de suscripcion.js). Un código de oferta
// reemplaza a la prueba gratis: quien lo canjea paga el precio rebajado desde el primer día.
// Va sobre la pantalla de pago de verdad de la galería, la que cierra la entrada después del cuestionario.

const TEXTOS = {
  es: {
    enlace: '¿Tienes un código?', titulo: 'Canjear código', campo: 'Código', canjear: 'Canjear',
    noValido: 'Este código no es válido o ya venció.',
    oferta: 'Oferta: {n} % menos el primer año', primerAnio: '{precio} el primer año', despues: 'Después, {precio} por año',
    nota: '(dibujo de la hoja de Apple: en la app la pone iOS)',
    listo: 'Se cobra {rebajado} el primer año y después {precio} por año. La administras en Ajustes, cuando quieras.',
  },
  en: {
    enlace: 'Have a code?', titulo: 'Redeem Code', campo: 'Code', canjear: 'Redeem',
    noValido: 'This code isn’t valid or has expired.',
    oferta: 'Offer: {n}% off the first year', primerAnio: '{precio} for the first year', despues: 'Then {precio} per year',
    nota: '(a drawing of Apple’s sheet: in the app, iOS shows it)',
    listo: '{rebajado} is charged for the first year, then {precio} per year. Manage it in Settings, whenever you want.',
  },
};
// El código de ejemplo y su descuento: los de verdad se cargan en App Store Connect.
const CODIGO = 'MOSS50';
const DESCUENTO = 50;

const CSS = `
.sb-pie .cod-enlace { justify-self: center; appearance: none; cursor: pointer; min-height: 44px; margin: -6px 0 -8px; padding: 0 14px; border: 0; background: none; color: var(--oro-claro); font: 400 13.5px/1 var(--texto); text-decoration: underline; text-underline-offset: 3px; animation: cod-entra 0.4s ease both; }
.sb-pie .cod-enlace:active { opacity: 0.6; }
.cod-campo { display: grid; gap: 6px; padding: 12px; border-radius: 11px; background: #fff; }
.cod-campo span { font-size: 12px; color: #6c6c74; }
.cod-campo input { width: 100%; border: 0; outline: 0; padding: 2px 0; background: none; color: #15171f; font: 500 19px/1.2 -apple-system, 'SF Pro Text', 'Segoe UI', sans-serif; letter-spacing: 0.08em; text-transform: uppercase; }
.cod-error { margin: 8px 2px 0; font-size: 12.5px; color: #c0392b; animation: cod-entra 0.3s ease both; }
.cod-paso { animation: cod-entra 0.32s ease both; }
.sb-apple-si:disabled { opacity: 0.4; cursor: default; }
.sb-apple-ficha .cod-oferta { margin-top: 2px; color: #15171f; font-weight: 600; }
.sb-apple-x.cod-x { min-height: 44px; padding: 0 10px; margin: -12px -10px; }
@keyframes cod-entra { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .sb-pie .cod-enlace, .cod-error, .cod-paso { animation: none; } }`;

Galeria.propuesta({
  id: 'codigoEnElPago',
  titulo: '“¿Tienes un código?” en el pago',
  texto: 'En la pantalla de pago, «¿Tienes un código?» abre la hoja de Apple para canjearlo (acá, dibujada). Probá con MOSS50: el código reemplaza los días gratis y se paga el precio rebajado desde el primer día.',
  vistas: [['pago', 'La pantalla de pago'], ['hoja', 'Al tocar «¿Tienes un código?»'], ['oferta', 'Con un código que vale'], ['noValido', 'Con un código que no vale']],
  principal: 0,
  crear(g) {
    g.estilo('cod-css', CSS);
    const pago = g.secciones.suscripcion;
    const u = Util.crear(g.opciones);
    const { el, boton, numero } = u;
    const t = (clave, vars) => TEXTOS[g.idioma][clave].replace(/\{(\w+)\}/g, (_, k) => vars[k]);
    const raiz = () => g.tel.querySelector('.sb');
    const usd = (v) => `USD ${numero(v, 2)}`;
    let mirando = null;
    let antes = null;
    // Suscrita con el código: lo que queda dice lo que se cobra de verdad (el primer año, rebajado).
    let conCodigo = false;
    const rebajado = () => usd(Math.round(Premium.PRECIOS.anual * (1 - DESCUENTO / 100)) - 0.01);
    function ponerLoQueSeCobra() {
      const texto = raiz().querySelector('.sb-listo h2 + p');
      if (conCodigo && texto) texto.textContent = t('listo', { rebajado: rebajado(), precio: usd(Premium.PRECIOS.anual) });
    }

    function sinPrueba(si) {
      const lista = raiz().querySelector('.sb-scroll');
      const arriba = lista ? lista.scrollTop : 0;
      pago.sinPrueba(si);
      const nueva = raiz().querySelector('.sb-scroll');
      if (nueva) nueva.scrollTop = arriba;
    }
    function ponerEnlace() {
      const principal = raiz().querySelector('.sb-pie .sb-principal');
      if (!principal || raiz().querySelector('.cod-enlace')) return;
      principal.after(boton('cod-enlace', t('enlace'), abrirHoja));
    }
    // Con la oferta a la vista, la pantalla de atrás ya no ofrece la prueba; si se cancela, vuelve a ofrecerla.
    let conOferta = false;
    function cerrarHoja() {
      const fondo = raiz().querySelector('.sb-apple-fondo');
      if (!fondo) return;
      fondo.style.animation = '';
      fondo.classList.add('saliendo');
      setTimeout(() => {
        fondo.remove();
        if (conOferta) { conOferta = false; sinPrueba(false); }
      }, g.movimientoReducido ? 0 : 280);
    }
    function abrirHoja() {
      raiz().querySelectorAll('.sb-apple-fondo.saliendo').forEach((n) => n.remove());
      if (raiz().querySelector('.sb-apple-fondo')) return;
      const fondo = el('div', 'sb-apple-fondo');
      const h = el('div', 'sb-apple');
      const cab = el('div', 'sb-apple-cab');
      cab.append(el('b', null, t('titulo')), boton('sb-apple-x cod-x', u.tx('suscripcion.apple.cancelar'), () => cerrarHoja()));
      const cuerpo = el('div', 'cod-paso');
      h.append(cab, cuerpo, el('p', 'sb-apple-nota', t('nota')));
      fondo.appendChild(h);
      raiz().appendChild(fondo);
      pedirCodigo(cuerpo);
    }
    function pedirCodigo(cuerpo, conError) {
      const campo = el('label', 'cod-campo');
      const entrada = el('input');
      entrada.type = 'text';
      entrada.autocapitalize = 'characters';
      entrada.autocomplete = 'off';
      entrada.setAttribute('aria-label', t('campo'));
      campo.append(el('span', null, t('campo')), entrada);
      const canjear = boton('sb-apple-si', t('canjear'), () => {
        if (entrada.value.trim().toUpperCase() === CODIGO) mostrarOferta(cuerpo);
        else if (!cuerpo.querySelector('.cod-error')) campo.after(el('p', 'cod-error', t('noValido')));
      });
      canjear.disabled = true;
      entrada.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !canjear.disabled) canjear.click(); });
      entrada.addEventListener('input', () => {
        canjear.disabled = !entrada.value.trim();
        const error = cuerpo.querySelector('.cod-error');
        if (error) error.remove();
      });
      cuerpo.replaceChildren(campo, canjear);
      if (conError) campo.after(el('p', 'cod-error', t('noValido')));
    }
    function mostrarOferta(cuerpo) {
      const anual = Premium.PRECIOS.anual;
      const ficha = el('div', 'sb-apple-ficha');
      ficha.append(
        el('b', null, u.tx('suscripcion.anual.nombre')), el('span', 'cod-oferta', t('oferta', { n: DESCUENTO })),
        el('span', null, t('primerAnio', { precio: rebajado() })), el('span', null, t('despues', { precio: usd(anual) })),
        el('small', null, u.tx('suscripcion.apple.cuenta')),
      );
      const fondo = raiz().querySelector('.sb-apple-fondo');
      const confirmar = boton('sb-apple-si', u.tx('suscripcion.apple.confirmar'), () => {
        conOferta = false;
        conCodigo = true;
        fondo.style.animation = '';
        pago.plan('anual');
        pago.confirmarApple();
      });
      const paso = el('div', 'cod-paso');
      paso.append(ficha, confirmar);
      cuerpo.replaceChildren(paso);
      // Con el código no hay prueba, y la pantalla de atrás lo dice ya, detrás del velo: se pinta entera de nuevo, así
      // que la hoja se vuelve a colgar, quieta (sin su animación de entrada).
      conOferta = true;
      fondo.style.animation = 'none';
      fondo.firstChild.style.animation = 'none';
      sinPrueba(true);
      raiz().appendChild(fondo);
      ponerEnlace();
    }
    const escribir = (texto) => {
      const entrada = raiz().querySelector('.cod-campo input');
      entrada.value = texto;
      entrada.dispatchEvent(new Event('input'));
    };

    return {
      abrir(vista) {
        conCodigo = false;
        if (!antes) antes = { acceso: pago.acceso, tengo: pago.tengo };
        pago.sinPrueba(false);
        pago.abrir({ acceso: 'nueva' });
        ponerEnlace();
        // La pantalla de pago se vuelve a pintar entera con algunas acciones: el enlace vuelve con ella.
        if (!mirando) {
          mirando = new MutationObserver(() => {
            if (raiz().hidden) { g.ver('codigoEnElPago', null); return; }
            ponerEnlace();
            ponerLoQueSeCobra();
          });
          mirando.observe(raiz(), { childList: true, attributes: true, attributeFilter: ['hidden'] });
        }
        if (vista === 'pago') return;
        abrirHoja();
        escribir(vista === 'noValido' ? 'GIMNASIO' : CODIGO);
        if (vista !== 'hoja') raiz().querySelector('.sb-apple-si').click();
      },
      cerrar() {
        if (mirando) { mirando.disconnect(); mirando = null; }
        pago.sinPrueba(false);
        if (!raiz().hidden && !raiz().classList.contains('saliendo')) pago.cerrar();
        if (antes) { pago.poner(antes.acceso, { tengo: antes.tengo }); antes = null; }
      },
    };
  },
});
