// La pantalla de pago mientras faltan los precios de Apple (27/11, para aprobar; spec/suscripcion.md, «Cómo llega»): lo
// que ya hace la app (src/secciones/premium/Premium.tsx) sobre la pantalla de pago de verdad de la galería. Cada plan
// queda atenuado hasta que llega su precio de Apple, y hasta entonces se ve el de respaldo, en dólares. El pie se arma
// acá con las reglas de la app: precioDelPlan, planQueSePuede y preciosDe (src/lib/premium.ts), y la nota de lo
// último que se tocó va aparte del motivo por el que falta el precio. Lo que cambia pasa al nuevo con un fundido.

/* global Galeria, Util, Premium -- los de la página de la galería */

// Lo que dice la App Store en cada vista: qué precios llegaron, si todavía no contestó, si no contestó o si contestó sin
// un plan; qué plan quedó elegido y si lo eligió la persona; y la nota de lo último que se tocó.
const VISTAS = {
  esperando: { estado: 'esperando' },
  sinConexion: { estado: 'sinRespuesta' },
  faltaEnLaTienda: { estado: 'faltaEnLaTienda', llegaron: { mensual: true }, loEligio: true },
  unSoloPlan: { estado: 'faltaEnLaTienda', llegaron: { mensual: true } },
  reintentando: { estado: 'sinRespuesta', reintentando: true },
  llegan: { estado: 'esperando' },
  restaurar: { estado: 'faltaEnLaTienda', llegaron: { mensual: true }, loEligio: true, nota: 'nada' },
};
// Lo que tarda la App Store de mentira en contestar: al reintentar, al restaurar y en «Llegan los precios».
const TARDA = { reintentar: 1400, restaurar: 900, llegan: 1600 };

const CSS = `
.sb .psp-capa { display: grid; }
.sb .psp-capa > .psp-t { grid-area: 1 / 1; }
.sb .psp-t.psp-entra { animation: psp-entra 0.22s ease both; }
.sb .psp-t.psp-va { animation: psp-va 0.18s ease both; pointer-events: none; }
@keyframes psp-entra { from { opacity: 0; } }
@keyframes psp-va { to { opacity: 0; } }
.sb-pie .psp-caja { position: relative; display: grid; min-width: 0; }
.sb-pie .psp-caja > .sb-reco { left: 11px; top: -7px; pointer-events: none; }
.sb-pie .sb-plan.psp-apagado { opacity: 0.5; }
.sb-pie .psp-ahorro { transition: opacity 0.22s ease, visibility 0s linear 0s; }
.sb-pie .psp-ahorro.psp-fuera { opacity: 0; visibility: hidden; transition: opacity 0.18s ease, visibility 0s linear 0.18s; }
.sb-pie .psp-nota { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 0.26s ease, margin-top 0.26s ease, opacity 0.22s ease; }
.sb-pie .psp-nota > .sb-nota { min-height: 0; overflow: hidden; animation: none; }
.sb-pie .psp-nota.psp-fuera { grid-template-rows: 0fr; margin-top: -7px; opacity: 0; }
.sb-pie .psp-boton { position: relative; overflow: hidden; }
.sb-pie .psp-boton:disabled { opacity: 0.5; }
.sb-pie .psp-accion { justify-items: center; }
.sb-pie .psp-espera { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 9px; border-radius: inherit; background: inherit; opacity: 0; transition: opacity 0.16s ease; pointer-events: none; }
.sb-pie .psp-boton.psp-esperando .psp-espera { opacity: 1; transition-duration: 0.18s; }
@media (prefers-reduced-motion: reduce) {
  .sb-pie .psp-nota { transition: opacity 0.22s ease; }
}`;

Galeria.propuesta({
  id: 'pagoSinPrecios',
  titulo: 'El pago mientras cargan los precios',
  texto: 'Hasta que Apple manda los precios, cada plan se ve apagado y el botón dice «Un momento…»; sin conexión, aparece «Reintentar». Cuando llegan, todo cambia con un fundido.',
  vistas: [['esperando', 'Mientras cargan los precios'], ['sinConexion', 'Sin conexión'], ['llegan', 'Cuando llegan los precios']],
  mas: [['faltaEnLaTienda', 'Apple no mandó un plan'], ['unSoloPlan', 'Con un solo plan'], ['reintentando', 'Al tocar «Reintentar»'], ['restaurar', 'Al tocar «Restaurar» sin precios']],
  principal: 0,
  crear(g) {
    g.estilo('psp-css', CSS);
    const pago = g.secciones.suscripcion;
    const u = Util.crear(g.opciones);
    const { tx, el, numero } = u;
    const raiz = () => g.tel.querySelector('.sb');
    const s = {};
    let relojes = [];
    let mirando = null;
    const temporizar = (f, ms) => { relojes.push(setTimeout(f, ms)); };
    const otro = (plan) => (plan === 'anual' ? 'mensual' : 'anual');

    // Los precios como la app: el de respaldo (precioDeRespaldo) y el de Apple, en la moneda de la tienda con la forma
    // del idioma del teléfono (en Uruguay la App Store cobra en dólares: «US$ 39,99»).
    const respaldo = (v) => `USD ${numero(v, 2)}`;
    const deApple = (v) => new Intl.NumberFormat(g.idioma === 'es' ? 'es-UY' : 'en-US', { style: 'currency', currency: 'USD' }).format(v);
    function precioDelPlan(plan) {
      if (s.llegaron[plan]) return 'listo';
      return s.estado === 'faltaEnLaTienda' ? 'faltaEnLaTienda' : s.estado === 'sinRespuesta' ? 'sinRespuesta' : 'esperando';
    }
    function preciosDe() {
      const { anual, mensual } = s.llegaron;
      const P = Premium.PRECIOS;
      return {
        anual: anual ? deApple(P.anual) : respaldo(P.anual),
        mensual: mensual ? deApple(P.mensual) : respaldo(P.mensual),
        porMes: anual ? deApple(Premium.porMes(P.anual)) : respaldo(Premium.porMes(P.anual)),
        // El ahorro, solo si los dos son de la misma fuente.
        ahorro: anual && mensual ? Premium.ahorroDelAnual(P.anual, P.mensual) : anual || mensual ? null : Premium.ahorroDelAnual(P.anual, P.mensual),
      };
    }
    /** Lo que la app calcula en cada dibujo de la pantalla de pago (Pago, en Premium.tsx). */
    function calcular() {
      // planQueSePuede: si el elegido no tiene precio y el otro sí, el otro, sin pisar lo que eligió la persona.
      if (!s.loEligio && !s.llegaron[s.elegido] && s.llegaron[otro(s.elegido)]) s.elegido = otro(s.elegido);
      const plan = s.elegido;
      const delPlan = precioDelPlan(plan);
      const esperando = delPlan === 'esperando';
      const sinPrecio = !s.llegaron[plan] && !esperando;
      const p = preciosDe();
      const enEspera = esperando || s.reintentando;
      const precio = plan === 'anual' ? p.anual : p.mensual;
      const dias = Premium.DIAS_DE_PRUEBA;
      return {
        plan, delPlan, sinPrecio, p, enEspera,
        apagado: enEspera || s.restaurando,
        motivo: sinPrecio && !(s.nota === 'errorRestaurar' && delPlan === 'sinRespuesta'),
        accion: sinPrecio ? tx('suscripcion.reintentar') : tx('suscripcion.empezar', { n: dias }),
        legal: tx('suscripcion.legal', { n: dias, precio: tx(`suscripcion.${plan}.precioDe`, { precio }) }),
        cobro: tx('suscripcion.linea.cobroTexto', { precio }),
      };
    }

    // Un texto que cambia pasa al nuevo con un fundido: el viejo se va mientras entra el nuevo, en el mismo lugar.
    function ponerTexto(nodo, texto, conFundido) {
      const actual = nodo.querySelector(':scope > .psp-t:not(.psp-va)');
      if (actual && actual.textContent === texto) return;
      if (actual && conFundido) {
        actual.classList.add('psp-va');
        setTimeout(() => actual.remove(), 220);
      } else if (actual) actual.remove();
      nodo.appendChild(el('span', 'psp-t' + (actual && conFundido ? ' psp-entra' : ''), texto));
    }
    const capa = (etiqueta, clase) => el(etiqueta, (clase ? clase + ' ' : '') + 'psp-capa');

    function opcion(plan) {
      const caja = el('div', 'psp-caja');
      const b = el('button', 'sb-plan');
      b.type = 'button';
      b.dataset.plan = plan;
      b.setAttribute('role', 'radio');
      const mas = el('span', 'sb-plan-mas');
      if (plan === 'anual') mas.append(capa('span', 'psp-mes'), el('em', 'psp-ahorro'));
      else mas.textContent = tx('suscripcion.mensual.detalle');
      b.append(el('span', 'sb-plan-nombre', tx(`suscripcion.${plan}.nombre`)), capa('span', 'sb-plan-precio'), el('span', 'sb-plan-por', tx(`suscripcion.${plan}.por`)), mas);
      b.addEventListener('click', (ev) => { ev.stopPropagation(); elegir(plan); });
      caja.appendChild(b);
      // Como en la app, «Recomendado» va al lado de la caja del plan: no se atenúa con ella.
      if (plan === 'anual') caja.appendChild(el('span', 'sb-reco', tx('suscripcion.anual.recomendado')));
      return caja;
    }
    function enlace(texto, alTocar) {
      const b = el('button', 'sb-enlace', texto);
      b.type = 'button';
      b.addEventListener('click', (ev) => { ev.stopPropagation(); alTocar(); });
      return b;
    }
    /** El pie de la pantalla de pago, con las mismas piezas de la galería; lo que cambia, en capas para el fundido. */
    function armarPie() {
      const pie = el('div', 'sb-pie psp-pie');
      const planes = el('div', 'sb-planes');
      planes.setAttribute('role', 'radiogroup');
      planes.append(opcion('anual'), opcion('mensual'));
      const boton = el('button', 'sb-principal psp-boton');
      boton.type = 'button';
      const espera = el('span', 'psp-espera');
      espera.setAttribute('aria-hidden', 'true');
      espera.append(el('i', 'sb-giro'), tx('suscripcion.enCurso'));
      boton.append(capa('span', 'psp-accion'), espera);
      boton.addEventListener('click', (ev) => { ev.stopPropagation(); tocarBoton(); });
      const enlaces = el('div', 'sb-enlaces');
      enlaces.append(enlace(tx('suscripcion.restaurar'), restaurar), enlace(tx('suscripcion.terminos'), () => {}), enlace(tx('suscripcion.privacidad'), () => {}), enlace(tx('suscripcion.cuenta.titulo'), () => pago.cuenta()));
      pie.append(planes, boton, capa('p', 'sb-legal'), el('p', 'sb-renueva', tx('suscripcion.renovacion')), enlaces);
      return pie;
    }

    // La nota de lo último que se tocó y el motivo por el que falta el precio, cada una por su lado: entran y se van
    // creciendo o achicándose, y el pie se acomoda con ellas.
    function ponerNotas(pie, c, conFundido) {
      const quiero = [];
      if (s.nota) quiero.push(['nota-' + s.nota, tx('suscripcion.notas.' + s.nota)]);
      if (c.motivo) quiero.push(['motivo-' + c.delPlan, tx(c.delPlan === 'faltaEnLaTienda' ? 'suscripcion.notas.sinPrecios' : 'suscripcion.notas.sinConexion')]);
      const vivas = () => [...pie.querySelectorAll(':scope > .psp-nota:not(.psp-se-va)')];
      vivas().forEach((n) => {
        if (quiero.some(([clave]) => clave === n.dataset.clave)) return;
        n.classList.add('psp-se-va', 'psp-fuera');
        if (conFundido) setTimeout(() => n.remove(), 300);
        else n.remove();
      });
      let antes = pie.querySelector(':scope > .sb-planes');
      quiero.forEach(([clave, texto]) => {
        let n = vivas().find((x) => x.dataset.clave === clave);
        if (!n) {
          n = el('div', 'psp-nota' + (conFundido ? ' psp-fuera' : ''));
          n.dataset.clave = clave;
          const p = el('p', 'sb-nota', texto);
          p.setAttribute('aria-live', 'polite');
          n.appendChild(p);
          antes.after(n);
          if (conFundido) {
            void n.offsetWidth;
            n.classList.remove('psp-fuera');
          }
        }
        antes = n;
      });
    }

    /** Dibuja el estado: la primera vez arma el pie; después cambia solo lo que cambió, con su fundido. */
    function pintar(conFundido) {
      const r = raiz();
      const pantalla = r && r.querySelector('.sb-pago');
      if (!pantalla) return;
      let pie = pantalla.querySelector('.psp-pie');
      if (!pie) {
        pie = armarPie();
        pantalla.querySelector('.sb-pie').replaceWith(pie);
        conFundido = false;
      }
      const c = calcular();
      pie.querySelectorAll('.sb-plan').forEach((b) => {
        const plan = b.dataset.plan;
        b.setAttribute('aria-checked', String(plan === c.plan));
        b.classList.toggle('psp-apagado', !s.llegaron[plan]);
        ponerTexto(b.querySelector('.sb-plan-precio'), plan === 'anual' ? c.p.anual : c.p.mensual, conFundido);
      });
      ponerTexto(pie.querySelector('.psp-mes'), tx('suscripcion.anual.porMes', { mes: c.p.porMes }), conFundido);
      const ahorro = pie.querySelector('.psp-ahorro');
      if (c.p.ahorro !== null) ahorro.textContent = tx('suscripcion.anual.ahorro', { ahorro: c.p.ahorro });
      ahorro.classList.toggle('psp-fuera', c.p.ahorro === null);
      Util.caber([...pie.querySelectorAll('.sb-plan-precio')]);
      ponerNotas(pie, c, conFundido);
      const boton = pie.querySelector('.psp-boton');
      ponerTexto(boton.querySelector('.psp-accion'), c.accion, conFundido);
      boton.classList.toggle('psp-esperando', c.enEspera);
      boton.disabled = c.apagado;
      boton.setAttribute('aria-label', c.enEspera ? tx('suscripcion.enCurso') : c.accion);
      boton.setAttribute('aria-busy', String(c.apagado));
      ponerTexto(pie.querySelector('.sb-legal'), c.legal, conFundido);
      // La línea de la prueba, arriba: lo que se cobra el día 7 es el precio del plan elegido.
      const cobro = pantalla.querySelector('.sb-punto.cobro span');
      if (cobro && !cobro.classList.contains('psp-capa')) {
        cobro.textContent = '';
        cobro.classList.add('psp-capa');
      }
      if (cobro) ponerTexto(cobro, c.cobro, conFundido);
    }

    function elegir(plan) {
      // La nota de antes era del otro plan.
      if (plan !== s.elegido) s.nota = null;
      s.elegido = plan;
      s.loEligio = true;
      pintar(true);
    }
    function llegan() {
      s.reintentando = false;
      s.estado = 'listos';
      s.llegaron = { anual: true, mensual: true };
      pintar(true);
    }
    function tocarBoton() {
      const c = calcular();
      if (c.apagado || !c.sinPrecio) return;
      s.nota = null;
      s.reintentando = true;
      pintar(true);
      if (!s.quieto) temporizar(llegan, TARDA.reintentar);
    }
    function restaurar() {
      if (s.restaurando) return;
      s.nota = null;
      s.restaurando = true;
      pintar(true);
      temporizar(() => {
        s.restaurando = false;
        s.nota = 'nada';
        pintar(true);
      }, TARDA.restaurar);
    }
    const limpiar = () => {
      relojes.forEach(clearTimeout);
      relojes = [];
    };

    return {
      // `arg.quieto`: sin que llegue nada después (para las capturas).
      abrir(vista, arg) {
        limpiar();
        const v = VISTAS[vista];
        Object.assign(s, { estado: v.estado, llegaron: { anual: false, mensual: false, ...v.llegaron }, elegido: 'anual', loEligio: !!v.loEligio, reintentando: !!v.reintentando, restaurando: false, nota: v.nota || null, quieto: !!(arg && arg.quieto) });
        pago.sinPrueba(false);
        pago.abrir({ acceso: 'nueva' });
        pintar(false);
        // La pantalla de pago se vuelve a pintar entera con algunas acciones de la galería: el pie vuelve con ella.
        if (!mirando) {
          mirando = new MutationObserver(() => { if (!raiz().hidden) pintar(false); });
          mirando.observe(raiz(), { childList: true });
        }
        if (vista === 'llegan' && !s.quieto) temporizar(llegan, TARDA.llegan);
      },
      cerrar() {
        limpiar();
        if (mirando) {
          mirando.disconnect();
          mirando = null;
        }
        pago.cerrar();
      },
    };
  },
});
