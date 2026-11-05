// La suscripción (D40, spec/suscripcion.md): una maqueta, sin compras de verdad. Toda Moss es de pago, con 7
// días gratis: la pantalla de pago va después de la meta, al final de la entrada, y cuando vence. Destaca lo
// que nos diferencia, comida y sueño juntos, con un ejemplo. Lo que Apple pide está a la vista y sin letra
// chica: el nombre y la duración de cada plan, lo que se cobra como lo más grande (lo que equivale, abajo y
// en chico), cuánto dura la prueba y lo que se cobra después, junto al botón, restaurar, los términos y la
// privacidad. No se salta, y no borra nada: exportar, cerrar sesión y borrar la cuenta siempre están.
// Las cuentas del precio son las de la app (src/dominio/premium.ts). La hoja de Apple es un dibujo.

const Suscripcion = (() => {
  const CSS = `
.tel .sb { position: absolute; inset: 0; z-index: 20; display: flex; flex-direction: column; color: var(--tinta); background: radial-gradient(120% 60% at 50% 0%, rgba(30, 42, 84, 0.95), rgba(9, 12, 26, 1) 70%), #090c1a; animation: sb-entra 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sb[hidden] { display: none; }
.sb.saliendo { animation: sb-sale 0.34s cubic-bezier(0.5, 0, 0.9, 0.6) both; pointer-events: none; }
@keyframes sb-entra { from { opacity: 0; transform: translateY(26px); } }
@keyframes sb-sale { to { opacity: 0; transform: translateY(26px); } }
@keyframes sb-aparece { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }
.sb-pago { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: sb-aparece 0.36s ease both; }
.sb-scroll { flex: 1; min-height: 0; overflow-y: auto; padding: calc(var(--arriba) + 8px) 20px 14px; display: flex; flex-direction: column; gap: 13px; scrollbar-width: none; }
.sb-scroll::-webkit-scrollbar { display: none; }
.sb-cab { display: grid; justify-items: center; gap: 7px; text-align: center; }
.sb-cab h2 { margin: 0; font: 500 30px/1.08 var(--titulos); text-wrap: balance; }
.sb-cab p { margin: 0; max-width: 330px; font: 300 14.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.76); text-wrap: pretty; }

/* El ejemplo: la noche de ayer y lo que eso le dice al día de hoy. */
.sb-juntos { padding: 11px 14px; border-radius: 16px; border: 1px solid rgba(239, 230, 207, 0.1); background: rgba(239, 230, 207, 0.03); }
.sb-j-fila { display: flex; align-items: center; gap: 12px; min-width: 0; }
.sb-j-textos { flex: none; }
.sb-j-textos.largo { flex: 1; min-width: 0; }
.sb-j-rotulo { display: block; font: 400 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.55); }
.sb-j-cifra { display: block; margin-top: 2px; font: 500 18px/1.15 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: #fbf2d9; white-space: nowrap; }
.sb-j-texto { margin: 3px 0 0; font: 400 13.5px/1.32 var(--texto); color: var(--tinta); text-wrap: pretty; }
.sb-j-grafico { flex: 1; min-width: 0; height: 40px; }
.sb-j-grafico svg { display: block; width: 100%; height: 100%; }
.sb-j-union { width: 1px; height: 12px; margin: 3px 0 3px 23px; background: linear-gradient(180deg, rgba(232, 196, 106, 0.2), rgba(232, 196, 106, 0.7)); }
.sb-j-luna { flex: none; width: 47px; height: 47px; display: grid; place-items: center; }
.sb-j-luna .luna { overflow: visible; }
.sb-j-hoy .sb-j-cifra small { margin-left: 6px; font: 400 12px/1 var(--texto); color: rgba(239, 230, 207, 0.55); }
/* Los macros de hoy, como en Inicio pero en chico. */
.sb-j-macros { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.sb-j-macros .in-macro { gap: 4px; }
.sb-j-macros .in-macro-barra { margin-top: 1px; }
.sb-j-dice { margin: 10px 0 0; padding-top: 9px; border-top: 1px solid rgba(239, 230, 207, 0.07); font: 400 13.5px/1.32 var(--texto); color: var(--tinta); text-wrap: pretty; }

.sb-todo { display: grid; gap: 5px; }
.sb-rotulo { margin: 0 0 2px; font: 400 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: var(--oro-claro); }
.sb-todo ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.sb-todo li { position: relative; padding-left: 15px; font: 300 13.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.9); }
.sb-todo li::before { content: ''; position: absolute; left: 2px; top: 0.5em; width: 5px; height: 5px; transform: rotate(45deg); background: var(--oro-claro); }

/* La línea de la prueba: hoy, el aviso y el cobro. */
.sb-linea { position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 9px; }
.sb-linea::before { content: ''; position: absolute; left: 4px; right: 8%; top: 4px; height: 1px; background: rgba(239, 230, 207, 0.2); }
.sb-punto { position: relative; display: grid; gap: 2px; align-content: start; }
.sb-punto > i { width: 9px; height: 9px; margin-bottom: 4px; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.5); background: #0c1124; }
.sb-punto.hoy > i { border-color: var(--oro); background: var(--oro); box-shadow: 0 0 8px rgba(232, 196, 106, 0.6); }
.sb-punto b { font: 500 12.5px/1.2 var(--texto); color: var(--tinta); }
.sb-punto span { font: 400 11.5px/1.28 var(--texto); color: rgba(239, 230, 207, 0.66); }

.sb-cuenta { display: grid; gap: 1px; }
.sb-cuenta h3 { margin: 0; font: 400 10px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.55); }
.sb-enlaces { display: flex; flex-wrap: wrap; gap: 0 14px; }
.sb-enlace { appearance: none; cursor: pointer; padding: 6px 0; border: 0; background: none; color: rgba(239, 230, 207, 0.82); font: 400 12px/1 var(--texto); text-decoration: underline; text-underline-offset: 2px; }
.sb-enlace.peligro { color: #f0a58a; }

/* Abajo y siempre a la vista: los planes, el botón y lo que se cobra. */
.sb-pie { flex: none; display: grid; gap: 7px; padding: 14px 20px calc(var(--abajo) + 4px); border-top: 1px solid rgba(239, 230, 207, 0.07); background: rgba(9, 12, 26, 0.9); }
.sb-planes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.sb-plan { appearance: none; cursor: pointer; position: relative; display: block; min-width: 0; padding: 12px 12px 9px; border: 1px solid rgba(239, 230, 207, 0.16); border-radius: 15px; background: none; color: inherit; text-align: left; transition: border-color 0.2s, background 0.2s, opacity 0.3s; }
.sb-plan[aria-checked='true'] { border-color: var(--oro); background: rgba(232, 196, 106, 0.08); }
.sb-reco { position: absolute; left: 10px; top: -8px; padding: 2px 8px; border-radius: 9px; background: var(--oro); color: #1a1406; font: 500 10.5px/1.3 var(--texto); }
.sb-plan-nombre { display: block; font: 400 12px/1.2 var(--texto); color: rgba(239, 230, 207, 0.68); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sb-plan-precio { display: block; margin-top: 3px; font: 500 22px/1.12 var(--numeros); font-size: var(--justo, 22px); font-variant-numeric: lining-nums tabular-nums; color: #fbf2d9; white-space: nowrap; }
.sb-plan-por { display: block; font: 400 12px/1.25 var(--texto); color: rgba(239, 230, 207, 0.74); }
.sb-plan-mas { display: block; margin-top: 4px; min-height: 2.6em; font: 400 11.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.62); }
.sb-plan-mas em { display: block; font-style: normal; color: var(--oro-claro); }
.sb-sin-conexion .sb-plan { opacity: 0.55; }
.sb-cambia { animation: sb-aparece 0.28s ease both; }
.sb-nota { margin: 0; font: 400 12.5px/1.35 var(--texto); color: var(--oro-claro); animation: sb-aparece 0.3s ease both; }
.sb-principal { appearance: none; cursor: pointer; width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 9px; border: 0; border-radius: 15px; background: var(--tinta); color: #0b0f1d; font: 500 15.5px/1 var(--texto); transition: transform 0.15s, opacity 0.2s; }
.sb-principal:active { transform: scale(0.98); }
.sb-principal:disabled { cursor: default; opacity: 0.72; }
.sb-giro { width: 15px; height: 15px; border-radius: 50%; border: 2px solid rgba(11, 15, 29, 0.25); border-top-color: #0b0f1d; animation: sb-giro 0.8s linear infinite; }
@keyframes sb-giro { to { transform: rotate(360deg); } }
.sb-legal { margin: 1px 0 0; font: 500 12.5px/1.32 var(--texto); color: rgba(239, 230, 207, 0.92); }
.sb-renueva { margin: -3px 0 0; font: 400 11px/1.35 var(--texto); color: rgba(239, 230, 207, 0.6); }

/* La hoja de Apple: un dibujo; en la app la pone iOS. */
.sb-apple-fondo { position: absolute; inset: 0; z-index: 3; display: flex; align-items: flex-end; background: rgba(0, 0, 0, 0.5); animation: sb-apple-fondo 0.3s ease both; }
@keyframes sb-apple-fondo { from { opacity: 0; } }
.sb-apple-fondo.saliendo { animation: sb-sale 0.28s ease both; pointer-events: none; }
.sb-apple { width: 100%; padding: 12px 18px calc(var(--abajo) + 10px); border-radius: 18px 18px 0 0; background: #f2f2f7; color: #15171f; font: 400 13px/1.3 -apple-system, 'SF Pro Text', 'Segoe UI', sans-serif; animation: sb-apple-sube 0.34s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes sb-apple-sube { from { transform: translateY(100%); } }
.sb-apple-cab { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; font-size: 15px; }
.sb-apple-x { appearance: none; cursor: pointer; border: 0; background: none; color: #0a66e4; font: inherit; font-size: 14px; }
.sb-apple-ficha { display: grid; gap: 3px; padding: 12px; border-radius: 11px; background: #fff; }
.sb-apple-ficha small { margin-top: 5px; color: #6c6c74; }
.sb-apple-si { appearance: none; cursor: pointer; width: 100%; min-height: 44px; margin-top: 12px; border: 0; border-radius: 11px; background: #0a66e4; color: #fff; font: 600 15px/1 inherit; }
.sb-apple-nota { margin: 8px 0 0; font-size: 11px; text-align: center; color: #6c6c74; }

/* «Tu cuenta»: como la hoja de acciones de iOS. */
.sb-acciones-fondo { position: absolute; inset: 0; z-index: 3; display: flex; align-items: flex-end; background: rgba(0, 0, 0, 0.5); animation: sb-apple-fondo 0.26s ease both; }
.sb-acciones-fondo.saliendo { animation: sb-sale 0.24s ease both; pointer-events: none; }
.sb-acciones { width: 100%; display: grid; gap: 8px; padding: 0 10px calc(var(--abajo) + 6px); animation: sb-apple-sube 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.sb-acciones button { appearance: none; cursor: pointer; width: 100%; min-height: 52px; border: 0; background: #1b2238; color: #8fb7ff; font: 400 16.5px/1 var(--texto); }
.sb-acciones-lista { display: grid; gap: 1px; border-radius: 14px; overflow: hidden; background: #2c3450; }
.sb-acciones button.peligro { color: #f0a58a; }
.sb-acciones .sb-acciones-no { border-radius: 14px; font-weight: 500; }

/* Después de pagar, restaurar, o quien ya estaba. */
.sb-listo { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 28px; text-align: center; animation: sb-aparece 0.45s ease both; }
.sb-estrella { display: block; width: 16px; height: 16px; transform: rotate(45deg); background: var(--oro-claro); box-shadow: 0 0 16px rgba(246, 227, 166, 0.8), 0 0 40px rgba(246, 227, 166, 0.3); }
.sb-listo h2 { margin: 14px 0 0; font: 500 28px/1.12 var(--titulos); text-wrap: balance; }
.sb-listo p { margin: 0; font: 300 15px/1.42 var(--texto); color: rgba(239, 230, 207, 0.82); text-wrap: pretty; }
.sb-listo .sb-listo-nota { font: 400 12.5px/1.38 var(--texto); color: var(--oro-claro); }
.sb-listo .sb-principal { margin-top: 18px; }

/* «Tu suscripción», en Perfil. */
.sb-hoja-cuerpo { display: grid; gap: 0; padding: 4px 20px calc(var(--abajo) + 16px); }
.sb-hoja-fila { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid rgba(239, 230, 207, 0.07); font: 400 14px/1.25 var(--texto); }
.sb-hoja-fila span { color: rgba(239, 230, 207, 0.6); }
.sb-hoja-fila b { font-weight: 400; text-align: right; color: var(--tinta); }
.sb-hoja-texto { margin: 10px 0 0; font: 300 14px/1.4 var(--texto); color: rgba(239, 230, 207, 0.8); }
.sb-hoja-texto.chico { font-size: 12.5px; color: rgba(239, 230, 207, 0.62); }
.sb-hoja-cuerpo .sb-principal { margin-top: 16px; }
.sb-hoja-cuerpo .sb-enlaces { margin-top: 8px; }
@media (prefers-reduced-motion: reduce) {
  .tel .sb, .sb.saliendo, .sb-pago, .sb-nota, .sb-apple-fondo, .sb-apple-fondo.saliendo, .sb-apple, .sb-acciones-fondo, .sb-acciones-fondo.saliendo, .sb-acciones, .sb-listo, .sb-cambia { animation-duration: 0.01s; }
  .sb-giro { animation-duration: 2.4s; }
}
`;
  let conEstilo = false;
  function ponerEstilo() {
    if (conEstilo) return;
    conEstilo = true;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }
  const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // La noche del ejemplo: 5 h 40 dormidas. La misma de la app (src/secciones/premium/Premium.tsx).
  const NOCHE_CORTA = {
    enCamaDesde: 0,
    enCamaHasta: 352,
    dormido: 340,
    tramos: [
      { etapa: 'nucleo', desde: 0, hasta: 28 }, { etapa: 'profundo', desde: 28, hasta: 62 }, { etapa: 'nucleo', desde: 62, hasta: 96 }, { etapa: 'rem', desde: 96, hasta: 112 },
      { etapa: 'nucleo', desde: 112, hasta: 150 }, { etapa: 'profundo', desde: 150, hasta: 176 }, { etapa: 'nucleo', desde: 176, hasta: 212 }, { etapa: 'despierto', desde: 212, hasta: 224 },
      { etapa: 'nucleo', desde: 224, hasta: 262 }, { etapa: 'rem', desde: 262, hasta: 296 }, { etapa: 'nucleo', desde: 296, hasta: 336 }, { etapa: 'rem', desde: 336, hasta: 352 },
    ],
  };

  // Lo de hoy del ejemplo: lo comido hasta ahora contra la meta, con sus macros (5/11: que se vea que Moss también
  // es una app de macros, no solo de sueño).
  const DIA_DEL_EJEMPLO = { kcal: 1250, meta: 2300, macros: [['p', 'proteina', 66, 140], ['c', 'carbohidratos', 155, 260], ['g', 'grasas', 40, 70]] };

  /**
   * Comida y sueño juntos, con un ejemplo: la noche de ayer, lo de hoy con sus calorías y sus macros, y lo que una
   * cosa le dice a la otra. También en la entrada.
   */
  function ejemplo(u) {
    const { tx, el, duracion, numero } = u;
    const c = el('section', 'sb-juntos');
    const noche = el('div', 'sb-j-fila sb-j-noche');
    const cifras = el('div', 'sb-j-textos');
    cifras.append(el('span', 'sb-j-rotulo', tx('suscripcion.ejemplo.anoche')), el('span', 'sb-j-cifra', duracion(NOCHE_CORTA.dormido)));
    const grafico = el('div', 'sb-j-grafico');
    grafico.appendChild(Graficos.hipnograma(NOCHE_CORTA, { ancho: 210, alto: 40 }));
    noche.append(cifras, grafico);
    const d = DIA_DEL_EJEMPLO;
    const hoy = el('div', 'sb-j-fila sb-j-hoy');
    const luna = el('div', 'sb-j-luna');
    const l = Luna.crear({ tam: 47 });
    l.ir(d.kcal / d.meta, 0);
    luna.appendChild(l.el);
    const textos = el('div', 'sb-j-textos largo');
    const cifra = el('span', 'sb-j-cifra', `${numero(d.kcal)} kcal`);
    cifra.appendChild(el('small', null, tx('suscripcion.ejemplo.deMeta', { meta: numero(d.meta) })));
    textos.append(el('span', 'sb-j-rotulo', tx('suscripcion.ejemplo.hoy')), cifra);
    hoy.append(luna, textos);
    const macros = el('div', 'sb-j-macros');
    const rellenos = [];
    d.macros.forEach(([m, clave, comido, meta]) => {
      const x = el('div', `in-macro in-macro-${m}`);
      const barra = el('i', 'in-macro-barra');
      const relleno = el('i');
      barra.appendChild(relleno);
      rellenos.push([relleno, `${Math.min(100, (comido / meta) * 100).toFixed(1)}%`]);
      x.append(el('span', 'in-macro-nombre', tx('comida.' + clave)), barra, el('small', null, tx('comida.gramosDe', { n: numero(comido), meta: numero(meta) })));
      macros.appendChild(x);
    });
    // Las barras se llenan al aparecer, como en Inicio.
    requestAnimationFrame(() => requestAnimationFrame(() => rellenos.forEach(([r, w]) => { r.style.width = w; })));
    Util.caber([...macros.querySelectorAll('.in-macro-nombre')], 12);
    c.append(noche, el('div', 'sb-j-union'), hoy, macros, el('p', 'sb-j-dice', tx('suscripcion.ejemplo.hambre', { h: duracion(NOCHE_CORTA.dormido) })));
    return c;
  }

  function crear(tel, opciones) {
    ponerEstilo();
    const u = Util.crear(opciones);
    const { tx, el, boton, icono, plural, numero, fechaLarga } = u;
    const raiz = el('section', 'sb');
    raiz.hidden = true;
    raiz.setAttribute('role', 'dialog');
    raiz.setAttribute('aria-modal', 'true');
    tel.appendChild(raiz);
    raiz.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const hoja = Util.hoja(tel, 'sb-hoja', () => opciones.alCambiar && opciones.alCambiar());

    // acceso: el de la app (Premium.acceso). `conAlgo`: si en esta cuenta de Apple hay algo para restaurar.
    const s = { plan: 'anual', vista: 'pago', acceso: 'prueba', sinConexion: false, enCurso: false, nota: null, conAlgo: false, deLaPrueba: true, cancelada: false, sinAvisos: false, tengo: 'anual', despues: null, cierre: 0 };

    const usd = (v) => `USD ${numero(v, 2)}`;
    const precioDe = (plan) => usd(Premium.PRECIOS[plan]);
    const conPrecio = (plan) => tx(`suscripcion.${plan}.precioDe`, { precio: precioDe(plan) });
    const conPrueba = () => s.acceso !== 'vencida';
    const dias = Premium.DIAS_DE_PRUEBA;
    /** El día en que termina la prueba: de hoy en una semana. */
    const finDeLaPrueba = () => Fechas.sumarDias(Datos.HOY, dias);

    function linea() {
      const c = el('section', 'sb-linea');
      [
        ['hoy', tx('suscripcion.linea.hoy'), tx('suscripcion.linea.hoyTexto')],
        ['', tx('suscripcion.linea.dia', { n: Premium.DIA_DEL_AVISO }), tx('suscripcion.linea.avisoTexto')],
        ['cobro', tx('suscripcion.linea.dia', { n: dias }), tx('suscripcion.linea.cobroTexto', { precio: precioDe(s.plan) })],
      ].forEach(([clase, titulo, texto]) => {
        const p = el('div', 'sb-punto ' + clase);
        p.append(el('i'), el('b', null, titulo), el('span', null, texto));
        c.appendChild(p);
      });
      return c;
    }

    function tuCuenta() {
      const c = el('section', 'sb-cuenta');
      c.appendChild(el('h3', null, tx('suscripcion.cuenta.titulo')));
      const enlaces = el('div', 'sb-enlaces');
      // En la app: exportar es el CSV de Perfil, y cerrar sesión o borrar la cuenta vuelven a la entrada.
      enlaces.append(
        boton('sb-enlace', tx('suscripcion.cuenta.exportar'), () => {}),
        boton('sb-enlace', tx('suscripcion.cuenta.cerrarSesion'), () => {}),
        boton('sb-enlace peligro', tx('suscripcion.cuenta.borrar'), () => {}),
      );
      c.appendChild(enlaces);
      return c;
    }

    function enlaces() {
      const c = el('div', 'sb-enlaces');
      c.append(boton('sb-enlace', tx('suscripcion.restaurar'), restaurar), boton('sb-enlace', tx('suscripcion.terminos'), () => {}), boton('sb-enlace', tx('suscripcion.privacidad'), () => {}));
      if (s.acceso !== 'vencida') c.appendChild(boton('sb-enlace', tx('suscripcion.cuenta.titulo'), abrirCuenta));
      return c;
    }

    /** Lo que no se paga: llevarse los datos, salir y borrar la cuenta (guía 5.1.1). En la app, la hoja de acciones de iOS. */
    function abrirCuenta() {
      if (raiz.querySelector('.sb-acciones-fondo')) return;
      const fondo = el('div', 'sb-acciones-fondo');
      const cerrarla = () => {
        fondo.classList.add('saliendo');
        setTimeout(() => fondo.remove(), quieto() ? 0 : 240);
      };
      const h = el('div', 'sb-acciones');
      const lista = el('div', 'sb-acciones-lista');
      // En la app: exportar es el CSV de Perfil, y cerrar sesión o borrar la cuenta vuelven a la entrada.
      lista.append(boton('', tx('suscripcion.cuenta.exportar'), cerrarla), boton('', tx('suscripcion.cuenta.cerrarSesion'), cerrarla), boton('peligro', tx('suscripcion.cuenta.borrar'), cerrarla));
      h.append(lista, boton('sb-acciones-no', tx('suscripcion.apple.cancelar'), cerrarla));
      fondo.addEventListener('click', (ev) => { if (ev.target === fondo) cerrarla(); });
      fondo.appendChild(h);
      raiz.appendChild(fondo);
    }

    function plan(p) {
      const b = boton('sb-plan', '', () => elegirPlan(p));
      b.dataset.plan = p;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(s.plan === p));
      // Lo que se cobra es lo más grande; lo que equivale, abajo y en chico (lo pide Apple).
      const precio = el('span', 'sb-plan-precio', precioDe(p));
      const mas = el('span', 'sb-plan-mas');
      if (p === 'anual') {
        mas.append(tx('suscripcion.anual.porMes', { mes: usd(Premium.porMes(Premium.PRECIOS.anual)) }), el('em', null, tx('suscripcion.anual.ahorro', { ahorro: Premium.ahorroDelAnual(Premium.PRECIOS.anual, Premium.PRECIOS.mensual) })));
        b.appendChild(el('span', 'sb-reco', tx('suscripcion.anual.recomendado')));
      } else mas.textContent = tx('suscripcion.mensual.detalle');
      b.append(el('span', 'sb-plan-nombre', tx(`suscripcion.${p}.nombre`)), precio, el('span', 'sb-plan-por', tx(`suscripcion.${p}.por`)), mas);
      return b;
    }

    const textoDelBoton = () => {
      if (s.enCurso) return `<i class="sb-giro"></i>${tx('suscripcion.enCurso')}`;
      if (s.sinConexion) return tx('suscripcion.reintentar');
      return conPrueba() ? tx('suscripcion.empezar', { n: dias }) : tx('suscripcion.suscribirme');
    };
    const textoLegal = () => (conPrueba() ? tx('suscripcion.legal', { n: dias, precio: conPrecio(s.plan) }) : tx('suscripcion.legalSinPrueba', { precio: conPrecio(s.plan) }));

    function pie() {
      const c = el('div', 'sb-pie' + (s.sinConexion ? ' sb-sin-conexion' : ''));
      const planes = el('div', 'sb-planes');
      planes.setAttribute('role', 'radiogroup');
      planes.append(plan('anual'), plan('mensual'));
      c.appendChild(planes);
      if (s.nota || s.sinConexion) c.appendChild(el('p', 'sb-nota', tx('suscripcion.notas.' + (s.nota || 'sinConexion'))));
      const principal = boton('sb-principal', textoDelBoton(), tocarPrincipal);
      principal.disabled = s.enCurso;
      c.append(principal, el('p', 'sb-legal', textoLegal()), el('p', 'sb-renueva', tx('suscripcion.renovacion')), enlaces());
      Util.caber([...c.querySelectorAll('.sb-plan-precio')]);
      return c;
    }

    function pago() {
      const vencida = s.acceso === 'vencida';
      const c = el('div', 'sb-pago');
      const cont = el('div', 'sb-scroll');
      const cab = el('div', 'sb-cab');
      cab.append(
        el('h2', null, vencida ? tx(s.deLaPrueba ? 'suscripcion.vencida.tituloPrueba' : 'suscripcion.vencida.titulo') : tx('suscripcion.pago.titulo')),
        el('p', null, vencida ? tx('suscripcion.vencida.texto') : tx('suscripcion.pago.texto')),
      );
      cont.append(cab, vencida ? tuCuenta() : ejemplo(u));
      const todo = el('section', 'sb-todo');
      const ul = el('ul');
      tx('suscripcion.pago.todo').forEach((t) => ul.appendChild(el('li', null, t)));
      todo.append(el('h3', 'sb-rotulo', tx('suscripcion.pago.todoTitulo')), ul);
      cont.appendChild(todo);
      if (!vencida) cont.appendChild(linea());
      c.append(cont, pie());
      return c;
    }

    // Sin rearmar nada: el borde pasa al otro plan con su transición, y cambian lo que se cobra y cuándo.
    function elegirPlan(p) {
      s.plan = p;
      raiz.querySelectorAll('.sb-plan').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.plan === p)));
      const cambia = (n, texto) => {
        if (!n) return;
        n.textContent = texto;
        n.classList.remove('sb-cambia');
        void n.offsetWidth;
        n.classList.add('sb-cambia');
      };
      cambia(raiz.querySelector('.sb-legal'), textoLegal());
      cambia(raiz.querySelector('.sb-punto.cobro span'), tx('suscripcion.linea.cobroTexto', { precio: precioDe(p) }));
    }

    function ponerNota(nota) {
      s.nota = nota;
      const viejo = raiz.querySelector('.sb-nota');
      if (viejo) viejo.remove();
      if (nota) raiz.querySelector('.sb-principal').before(el('p', 'sb-nota', tx('suscripcion.notas.' + nota)));
    }

    function tocarPrincipal() {
      if (s.enCurso) return;
      if (s.sinConexion) { sinConexion(false); return; }
      ponerNota(null);
      abrirApple();
    }
    function abrirApple() {
      if (!raiz.querySelector('.sb-apple-fondo')) raiz.appendChild(hojaApple());
    }
    function cerrarApple(despues) {
      const fondo = raiz.querySelector('.sb-apple-fondo');
      if (!fondo) { if (despues) despues(); return; }
      fondo.classList.add('saliendo');
      setTimeout(() => { fondo.remove(); if (despues) despues(); }, quieto() ? 0 : 280);
    }
    function cancelarApple() { cerrarApple(() => ponerNota('cancelada')); }
    function confirmarApple() {
      cerrarApple(() => {
        ponerEnCurso(true);
        setTimeout(() => {
          s.enCurso = false;
          s.tengo = s.plan;
          ponerAcceso(conPrueba() ? 'prueba' : 'activa');
          s.vista = 'listo';
          pintar();
        }, quieto() ? 200 : 1100);
      });
    }
    function ponerEnCurso(si) {
      s.enCurso = si;
      const b = raiz.querySelector('.sb-principal');
      if (b) { b.innerHTML = textoDelBoton(); b.disabled = si; }
    }
    /** El dibujo de la hoja de Apple, solo en la galería: en la app la pone iOS. */
    function hojaApple() {
      const fondo = el('div', 'sb-apple-fondo');
      const h = el('div', 'sb-apple');
      const cab = el('div', 'sb-apple-cab');
      cab.append(el('b', null, tx('suscripcion.apple.tienda')), boton('sb-apple-x', tx('suscripcion.apple.cancelar'), cancelarApple));
      const ficha = el('div', 'sb-apple-ficha');
      ficha.appendChild(el('b', null, tx(`suscripcion.${s.plan}.nombre`)));
      if (conPrueba()) ficha.appendChild(el('span', null, tx('suscripcion.apple.prueba', { n: dias })));
      ficha.append(el('span', null, conPrueba() ? tx('suscripcion.apple.despues', { precio: conPrecio(s.plan) }) : conPrecio(s.plan)), el('small', null, tx('suscripcion.apple.cuenta')));
      h.append(cab, ficha, boton('sb-apple-si', tx('suscripcion.apple.confirmar'), confirmarApple), el('p', 'sb-apple-nota', tx('suscripcion.apple.nota')));
      fondo.appendChild(h);
      return fondo;
    }

    function restaurar() {
      if (!s.conAlgo) { ponerNota('nada'); return; }
      s.tengo = s.plan;
      ponerAcceso('activa');
      s.vista = 'restaurada';
      pintar();
    }
    function sinConexion(si) {
      s.sinConexion = si;
      s.nota = null;
      pintar();
    }

    function listo() {
      const c = el('div', 'sb-listo');
      const seguir = boton('sb-principal', tx('suscripcion.listo.seguir'), terminar);
      const con = (titulo, texto, nota) => {
        c.append(el('i', 'sb-estrella'), el('h2', null, titulo), el('p', null, texto));
        if (nota) c.appendChild(el('p', 'sb-listo-nota', nota));
        c.appendChild(seguir);
      };
      if (s.vista === 'regalo') con(tx('suscripcion.regalo.titulo'), tx('suscripcion.regalo.texto'));
      else if (s.vista === 'restaurada') con(tx('suscripcion.restaurada.titulo'), tx('suscripcion.restaurada.texto'));
      else if (s.acceso === 'prueba') con(tx('suscripcion.listo.titulo', { n: dias }), tx('suscripcion.listo.texto', { fecha: fechaLarga(finDeLaPrueba()), precio: conPrecio(s.tengo) }), s.sinAvisos ? tx('suscripcion.listo.sinAvisos') : null);
      else con(tx('suscripcion.listo.tituloSinPrueba'), tx('suscripcion.listo.textoSinPrueba', { precio: conPrecio(s.tengo) }));
      return c;
    }

    function pintar() {
      raiz.innerHTML = '';
      raiz.appendChild(s.vista === 'pago' ? pago() : listo());
    }

    function ponerAcceso(a) {
      s.acceso = a;
      if (opciones.alCambiar) opciones.alCambiar();
    }

    function terminar() {
      cerrar();
      const despues = s.despues;
      s.despues = null;
      if (despues) despues();
    }
    function abrir({ despues, acceso, vista } = {}) {
      clearTimeout(s.cierre);
      Object.assign(s, { plan: 'anual', vista: vista || 'pago', enCurso: false, nota: null, sinConexion: false, conAlgo: false, despues: despues || null });
      if (acceso) ponerAcceso(acceso);
      raiz.hidden = false;
      raiz.classList.remove('saliendo');
      pintar();
    }
    function cerrar() {
      raiz.classList.add('saliendo');
      s.cierre = setTimeout(() => { raiz.hidden = true; raiz.classList.remove('saliendo'); }, quieto() ? 0 : 340);
    }

    // ---------------------------------------------------------------- Perfil
    /** Lo que dice la fila de Perfil. */
    function valorDeFila() {
      if (s.acceso === 'regalo') return tx('suscripcion.perfil.regalo');
      if (s.acceso === 'prueba') return plural('suscripcion.perfil.prueba', dias - 2);
      if (s.acceso === 'activa') return tx('suscripcion.perfil.' + s.tengo);
      return tx('suscripcion.perfil.vencida');
    }
    /** «Tu suscripción»: qué tienes, cuándo cambia y cómo administrarla en Apple. Perfil solo muestra la fila. */
    function pintarHoja() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('suscripcion.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'sb-hoja-cuerpo');
      const fila = (titulo, valor) => {
        const f = el('div', 'sb-hoja-fila');
        f.append(el('span', null, titulo), el('b', null, valor));
        cuerpo.appendChild(f);
      };
      if (s.acceso === 'regalo') cuerpo.appendChild(el('p', 'sb-hoja-texto', tx('suscripcion.hoja.regalo')));
      else {
        const fecha = s.acceso === 'prueba' ? Fechas.sumarDias(Datos.HOY, dias - 2) : Fechas.sumarDias(Datos.HOY, s.tengo === 'anual' ? 280 : 20);
        fila(tx('suscripcion.hoja.estado'), s.acceso === 'prueba' ? valorDeFila() : tx(s.acceso === 'activa' ? 'suscripcion.hoja.activa' : 'suscripcion.perfil.vencida'));
        fila(tx('suscripcion.hoja.plan'), tx(`suscripcion.${s.tengo}.nombre`));
        fila(tx('suscripcion.hoja.precio'), conPrecio(s.tengo));
        fila(tx(s.cancelada ? 'suscripcion.hoja.termina' : s.acceso === 'prueba' ? 'suscripcion.hoja.primerCobro' : 'suscripcion.hoja.renueva'), fechaLarga(fecha));
        if (s.cancelada) cuerpo.appendChild(el('p', 'sb-hoja-texto chico', tx('suscripcion.hoja.cancelada')));
        cuerpo.append(boton('sb-principal', tx('suscripcion.hoja.administrar'), () => {}), el('p', 'sb-hoja-texto chico', tx('suscripcion.hoja.administrarTexto')));
      }
      const c = el('div', 'sb-enlaces');
      c.append(boton('sb-enlace', tx('suscripcion.restaurar'), () => {}), boton('sb-enlace', tx('suscripcion.terminos'), () => {}), boton('sb-enlace', tx('suscripcion.privacidad'), () => {}));
      cuerpo.appendChild(c);
      h.append(cab, cuerpo);
    }
    function abrirHoja() {
      if (s.acceso === 'nueva' || s.acceso === 'vencida') { abrir(); return; }
      pintarHoja();
      hoja.abrir();
      if (opciones.alCambiar) opciones.alCambiar();
    }

    return {
      abrir, cerrar, abrirHoja, valorDeFila,
      cerrarHoja: () => hoja.cerrar(),
      get hojaAbierta() { return hoja.abierta; },
      get abierta() { return !raiz.hidden; },
      get acceso() { return s.acceso; },
      /** Para ver cada estado desde la galería. */
      poner(acceso, { tengo, cancelada, deLaPrueba } = {}) {
        ponerAcceso(acceso);
        if (tengo) s.tengo = tengo;
        s.cancelada = !!cancelada;
        if (deLaPrueba !== undefined) s.deLaPrueba = deLaPrueba;
      },
      plan: elegirPlan,
      apple: abrirApple,
      cuenta: abrirCuenta,
      cancelarApple,
      confirmarApple,
      sinConexion,
      restaurar,
      conAlgo(si) { s.conAlgo = si; },
      sinAvisos(si) { s.sinAvisos = si; },
      enCurso(si) { ponerEnCurso(si); },
      bajar() { const c = raiz.querySelector('.sb-scroll'); if (c) c.scrollTop = c.scrollHeight; },
    };
  }
  return { crear, ejemplo, NOCHE_CORTA };
})();
