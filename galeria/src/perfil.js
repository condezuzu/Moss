// Perfil, la última sección (antes Ajustes): arriba, la tarjeta de la persona (su foto o su inicial y su
// nombre, que abre Editar perfil, con la edad, la altura y la meta), cómo está la suscripción, las
// conexiones (Salud, los aparatos y, prendida, Ascent), tus datos, las preferencias, tus datos para
// llevar o borrar y de dónde salen los alimentos. Las metas pasaron a Progreso, con la estrategia.
// Es una maqueta: lo que hace cada fila ya está en la especificación.
// Aparatos (spec/aparatos.md) es una hoja: los que escriben tu sueño, de cuál sale la noche y qué
// llega de cada marca.

const SeccionPerfil = (() => {
  // Lo que anda solo con las dos apps vinculadas, con su ícono (antes en la sección de Ascent).
  const CON_ASCENT = [['peso', 'balanza'], ['calorias', 'rayo'], ['objetivo', 'objetivo'], ['proteina', 'pesa'], ['gimnasio', 'estrella']];
  // Las marcas de Aparatos, en el orden en que miden mejor el sueño (spec/aparatos.md, «El orden»).
  const MARCAS = ['appleWatch', 'oura', 'google', 'whoop', 'polar', 'garmin', 'withings', 'ringconn', 'ultrahuman', 'amazfit', 'anillo', 'coros', 'suunto', 'eightSleep', 'samsung'];
  // Los íconos que solo usa Perfil; los demás, de Util.
  const ICONOS = {
    globo: '<circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.4 2.2 3.6 4.9 3.6 8s-1.2 5.8-3.6 8c-2.4-2.2-3.6-4.9-3.6-8s1.2-5.8 3.6-8z"/>',
    campana: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5z"/><path d="M10.2 20.6a2 2 0 0 0 3.6 0"/>',
    ojo: '<path d="M2.8 12S6.2 6 12 6s9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6z"/><circle cx="12" cy="12" r="2.6"/>',
    exportar: '<path d="M12 15V4M8 7.5l4-4 4 4"/><path d="M5.5 13.5v5A1.5 1.5 0 0 0 7 20h10a1.5 1.5 0 0 0 1.5-1.5v-5"/>',
    documento: '<path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 1-.5z"/><path d="M14 3.5V8h4M9.5 12.5h5M9.5 16h5"/>',
    sobre: '<rect x="3.5" y="6" width="17" height="12.5" rx="2"/><path d="m4 7.5 8 6 8-6"/>',
    basura: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/><path d="M10 11v5M14 11v5"/>',
    cronometro: '<circle cx="12" cy="13.5" r="7"/><path d="M12 9.8v3.7l2.4 1.4M9.5 3.5h5M12 3.5v2.9"/>',
    amanecer: '<path d="M7.5 17a4.5 4.5 0 0 1 9 0"/><path d="M12 7.5v2.2M5.3 10.3l1.5 1.5M18.7 10.3l-1.5 1.5M3 17h2M19 17h2M3.5 20.5h17"/>',
    escudo: '<path d="M12 3.5 5 6v6c0 4.2 3 7 7 8.5 4-1.5 7-4.3 7-8.5V6z"/><path d="m9 12 2.2 2.2L15 10.4"/>',
    planeta: '<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="9.5" ry="3.6" transform="rotate(-24 12 12)"/>',
    regalo: '<rect x="4.5" y="9.5" width="15" height="10.5" rx="1.5"/><path d="M3.5 7h17v2.5h-17zM12 7v13"/><path d="M12 7c-1.2-3-5-3.6-5-1.6C7 6.8 9.5 7 12 7zM12 7c1.2-3 5-3.6 5-1.6C17 6.8 14.5 7 12 7z"/>',
  };
  const CSS = `
.perfil svg { stroke-width: 1.7; }
.pf-tarjeta { margin-top: 2px; padding: 14px 14px 13px; border-radius: 22px; border: 1px solid rgba(232, 196, 106, 0.2); background: linear-gradient(150deg, #2b3563 0%, #1b2247 56%, #11162f 100%); }
.pf-tarjeta .pf-cab { margin: 0 0 13px; padding: 0 2px 0 0; }
.pf-tarjeta .pf-nombres h2 { font-size: 23px; }
.pf-minis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.pf-mini { appearance: none; cursor: pointer; display: grid; gap: 6px; min-width: 0; padding: 10px 11px 11px; border: 1px solid rgba(239, 230, 207, 0.09); border-radius: 13px; background: rgba(239, 230, 207, 0.055); color: var(--tinta); text-align: left; transition: background 0.2s ease, transform 0.15s ease; }
.pf-mini:active { transform: scale(0.97); background: rgba(239, 230, 207, 0.09); }
.pf-mini span { font: 400 9.5px/1 var(--texto); letter-spacing: 0.13em; text-transform: uppercase; color: rgba(239, 230, 207, 0.64); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-mini b { font: 400 20px/1 var(--numeros); letter-spacing: -0.01em; color: #fbf2d9; white-space: nowrap; }
.pf-mini b.texto { font-size: 15px; line-height: 20px; }
.pf-mini b small { font: 400 12px/1 var(--texto); letter-spacing: 0; color: rgba(239, 230, 207, 0.72); }

/* La suscripción, a la vista: solo la fila; la pantalla de pago es de la suscripción. */
.pf-plan { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: 30px minmax(0, 1fr) auto 12px; align-items: center; column-gap: 11px; margin-top: 10px; padding: 11px 12px 11px 13px; border-radius: 18px; border: 1px solid rgba(232, 196, 106, 0.2); background: rgba(232, 196, 106, 0.07); color: var(--tinta); text-align: left; transition: background 0.2s ease; }
.pf-plan:active { background: rgba(232, 196, 106, 0.12); }
.pf-plan-textos { display: grid; gap: 3px; min-width: 0; }
.pf-plan-textos b { font: 500 15px/1.2 var(--texto); }
.pf-plan-textos span { font: 400 12.5px/1.25 var(--texto); color: rgba(239, 230, 207, 0.68); }
.pf-plan-dias { display: inline-flex; gap: 3px; }
.pf-plan-dias i { width: 6px; height: 6px; border-radius: 50%; background: rgba(239, 230, 207, 0.16); }
.pf-plan-dias i.lleno { background: var(--oro-claro); }
.pf-plan > svg { width: 12px; height: 12px; fill: none; stroke: rgba(239, 230, 207, 0.42); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

/* Cada fila con su cuadrito de color: apagado, para que no compita con lo demás. */
.pf-cuadro { flex: none; display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; font-style: normal; }
.pf-cuadro svg, .pf-lista .pf-cuadro svg, .pf-lista.pf-con-ascent .pf-cuadro svg { width: 17px; height: 17px; color: inherit; stroke: currentColor; fill: none; stroke-linecap: round; stroke-linejoin: round; }
.c-azul { background: rgba(116, 150, 232, 0.2); color: #b5ccf8; }
.c-salvia { background: rgba(166, 191, 148, 0.18); color: #c6d9b6; }
.c-oro { background: rgba(232, 196, 106, 0.17); color: #f2d98e; }
.c-rosa { background: rgba(232, 150, 136, 0.17); color: #f3bcae; }
.c-violeta { background: rgba(150, 132, 232, 0.2); color: #c9bff6; }
.c-gris { background: rgba(239, 230, 207, 0.09); color: rgba(239, 230, 207, 0.76); }
.c-ascent { background: rgba(138, 147, 168, 0.22); color: #c9cfdd; }
.pf-lista.pf-filas li { display: block; padding: 0; }
.pf-lista.pf-filas li + li { position: relative; border-top: 0; }
.pf-lista.pf-filas li + li::before { content: ''; position: absolute; left: 54px; right: 0; top: 0; height: 1px; background: rgba(239, 230, 207, 0.07); }
.pf-fila { appearance: none; cursor: pointer; width: 100%; min-height: 52px; display: grid; grid-template-columns: 30px minmax(min-content, 1fr) minmax(0, auto) 12px; align-items: center; column-gap: 11px; padding: 9px 12px 9px 13px; border: 0; background: none; color: var(--tinta); text-align: left; font: 400 15px/1.2 var(--texto); transition: background 0.15s ease; }
.pf-filas li:first-child .pf-fila { border-radius: 15px 15px 0 0; }
.pf-filas li:last-child .pf-fila { border-radius: 0 0 15px 15px; }
.pf-filas li:only-child .pf-fila { border-radius: 15px; }
.pf-fila:active { background: rgba(239, 230, 207, 0.05); }
.pf-fila-textos { display: grid; gap: 3px; min-width: 0; }
.pf-fila-textos .pf-sub { margin: 0; }
.pf-fila-valor { display: inline-flex; align-items: center; gap: 6px; font: 400 13.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.62); text-align: right; max-width: 158px; }
.pf-lista .pf-fila-valor { color: rgba(239, 230, 207, 0.62); }
.pf-fila-valor i { flex: none; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.pf-lista .pf-fila.ok .pf-fila-valor { color: var(--salvia); }
.pf-lista .pf-fila.accion .pf-fila-valor { color: var(--oro-claro); }
.pf-fila.peligro .pf-fila-titulo { color: #f0a58a; }
.pf-lista .pf-fila > svg { width: 12px; height: 12px; color: rgba(239, 230, 207, 0.42); stroke-width: 2; }
.pf-fila .sin-flecha { width: 12px; }
.perfil .pf-grupo { margin-top: 22px; }
.pf-marca.pf-creditos-abrir { grid-template-columns: 30px minmax(0, 1fr) 12px; column-gap: 11px; min-height: 52px; padding: 9px 12px 9px 13px; }
.pf-lista .pf-creditos-abrir > svg { width: 12px; height: 12px; color: rgba(239, 230, 207, 0.42); stroke-width: 2; }
.pf-lista.pf-con-ascent li { grid-template-columns: 30px minmax(0, 1fr); gap: 11px; padding: 11px 13px; }
.pf-marcas li.abierta .pf-marca .pf-cuadro svg { transform: none; }
.pf-creditos-dentro span { display: block; margin-top: 8px; font: 400 12.5px/17px var(--texto); color: rgba(239, 230, 207, 0.65); }
.pf-creditos-dentro span:first-child { margin-top: 0; }
.pf-salir + .pf-salir { margin-top: 8px; }
/* Solo se mueve lo que cambió: el valor entra con un fundido, y la fila que llega o se va cambia de alto. */
.perfil .pf-sub { animation: none; }
.perfil .pf-sub.entra { animation: sn-aparece 0.3s both; }
.pf-entra { animation: hj-aparece 0.3s ease both; }
.pf-lista.pf-filas li.pf-crece { overflow: hidden; animation: pf-crece 0.32s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes pf-crece { from { max-height: 0; opacity: 0; } to { max-height: 130px; opacity: 1; } }
.pf-lista.pf-filas li.pf-sale, .perfil .pf-sub.pf-sale { height: 0 !important; margin: 0; opacity: 0; overflow: hidden; transition: height 0.26s ease, opacity 0.2s ease; }
.pf-lista.pf-no-llego { margin-top: 8px; }

/* Las subpantallas: cada cosa en su tarjeta, con su cuadrito. */
.tel .hb.pf-hoja { padding-bottom: 0; }
.tel .pf-hoja .pf-avisos { flex: 1; padding: 2px 16px calc(var(--abajo) + 18px); }
.tel .pf-hoja .pf-aparatos { padding-bottom: calc(var(--abajo) + 18px); }
.pf-hoja .pf-aviso { margin-top: 10px; padding: 13px 14px 13px; border: 1px solid rgba(239, 230, 207, 0.08); border-radius: 18px; background: rgba(239, 230, 207, 0.035); }
.pf-hoja .pf-aviso-fila { min-height: 30px; }
.pf-aviso-titulo { display: flex; align-items: center; gap: 11px; min-width: 0; }
.pf-hoja .pf-aviso-titulo b { font: 400 15px/1.2 var(--texto); }
.pf-hoja .pf-aviso .pf-nota { margin: 9px 0 0; }
.pf-hoja .pf-aviso-chips { margin: 11px 0 0; }
.pf-hoja .pf-horario { margin: 10px 0 0; }
.pf-hoja .pf-grupo { margin: 18px 4px 8px; }
.pf-hoja .pf-avisos > .pf-nota { margin: 8px 4px; }
.pf-hoja .fi-porcion { padding: 8px 11px; }
.pf-hoja .pf-dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; margin: 11px 0 0; }
.pf-hoja .pf-dias .fi-porcion { min-width: 0; padding: 9px 0; justify-items: center; }
.pf-opciones-lista { display: grid; gap: 8px; margin-top: 8px; }
.pf-opciones-lista .ent-opcion { padding: 13px 15px; }
.pf-opciones-lista .ent-opcion b { font-size: 15px; }
.pf-texto { margin: 10px 4px 0; font: 400 13.5px/1.48 var(--texto); color: rgba(239, 230, 207, 0.78); }
.pf-lista.pf-tuyos .pf-fila { grid-template-columns: 30px minmax(0, 1fr) auto; cursor: default; }
.pf-lista.pf-tuyos .pf-fila > .pf-fila-textos { display: grid; margin: 0; }
.pf-lista.pf-tuyos .pf-fila > .sn-puntos { display: inline-flex; margin: 0; }
.pf-tuyos .sn-puntos i { background: rgba(150, 178, 240, 0.2); }
.pf-tuyos .sn-puntos i.lleno { background: #a8c8fa; box-shadow: none; }
.pf-lista.pf-tuyos .pf-fila-textos span { display: block; font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.58); }
.pf-lista.pf-tuyos .pf-fila-textos b { display: block; font: 400 15px/1.2 var(--texto); color: var(--tinta); }
@media (prefers-reduced-motion: reduce) {
  .pf-entra, .perfil .pf-sub.entra, .pf-lista.pf-filas li.pf-crece { animation: none; }
  .pf-mini, .pf-plan, .pf-fila { transition: none; }
}
`;
  function crear(tel, opciones) {
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const ic = (n) => (ICONOS[n] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>` : icono(n));
    const cuadro = (n, color) => { const c = el('i', 'pf-cuadro c-' + color); c.innerHTML = ic(n); return c; };
    // Ascent en la maqueta: apagada es como la 1.0 (CON_ASCENT en src/lib/banderas.ts).
    const conAscent = () => (opciones.ascentPrendida ? opciones.ascentPrendida() : true);

    const zona = el('section', 'perfil pagina-app');
    zona.innerHTML = '<div class="pf-scroll"></div>';
    tel.appendChild(zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.pf-scroll');
    const hoja = Util.hoja(tel, 'pf-hoja', () => opciones.alCambiar());
    const s = { abierta: null, fuente: 'auto', sinDeficit: false, numeros: true, buscar: false, sistema: 'metrico', calidad: null, corte: Fechas.CORTE_DE_FABRICA, creditos: false, sinSalud: false, opciones: null, avisos: { dormir: false, antes: 30, comidas: [], maximo: 6, horario: {}, pesarse: false, todos: false, latencia: null } };

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
      const tuyos = el('ul', 'pf-lista pf-filas pf-tuyos');
      const tuyo = (marca, n, nivel) => {
        const li = el('li');
        const fila = el('div', 'pf-fila');
        const txt = el('span', 'pf-fila-textos');
        txt.append(el('b', null, tx(`perfil.aparatos.marcas.${marca}.nombre`)), el('span', null, u.plural('perfil.aparatos.noches', n)));
        fila.append(cuadro(marca === 'iphone' ? 'telefono' : 'reloj3', 'azul'), txt, puntos(nivel));
        li.appendChild(fila);
        tuyos.appendChild(li);
      };
      if (sinReloj) tuyo('iphone', opciones.nochesSinReloj(), 1);
      else tuyo('appleWatch', Datos.NOCHES.filter((n) => n.clave > Fechas.sumarDias(Datos.HOY, -30)).length, 4);
      cuerpo.appendChild(tuyos);
      // Si un aparato no aparece, qué mirar y en qué orden: Moss solo lee lo que hay en Salud.
      const noLlego = el('ul', 'pf-lista pf-marcas pf-no-llego');
      const liNoLlego = el('li', s.abierta === 'noLlego' ? 'abierta' : null);
      const filaNoLlego = boton('pf-marca', `<span>${tx('perfil.aparatos.noLlego.titulo')}</span>${icono('adelante')}`, () => {
        s.abierta = s.abierta === 'noLlego' ? null : 'noLlego';
        liNoLlego.classList.toggle('abierta', s.abierta === 'noLlego');
      });
      const textoNoLlego = el('div', 'pf-marca-texto');
      const pasosNoLlego = el('p', 'pf-creditos-dentro');
      tx('perfil.aparatos.noLlego.pasos').forEach((paso, i) => pasosNoLlego.appendChild(el('span', null, `${i + 1}. ${paso}`)));
      textoNoLlego.appendChild(pasosNoLlego);
      liNoLlego.append(filaNoLlego, textoNoLlego);
      noLlego.appendChild(liNoLlego);
      cuerpo.appendChild(noLlego);
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

    // Los avisos (lo pediste el 22/10): la hora de dormir, las comidas sin anotar y cuántos por día,
    // como en la app (Perfil.tsx). Los de cada hábito se eligen en el hábito.
    function pintarAvisos() {
      const h = hoja.el;
      const arriba = h.querySelector('.pf-avisos') ? h.querySelector('.pf-avisos').scrollTop : 0;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.avisos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const a = s.avisos;
      const chips = (valores, nombre, elegido, alElegir) => {
        const fila = el('div', 'fi-porciones pf-aviso-chips');
        valores.forEach((v) => {
          const b = boton('fi-porcion', `<span>${nombre(v)}</span>`, () => { alElegir(v); pintarAvisos(); pintar(); });
          b.setAttribute('aria-pressed', String(elegido(v)));
          fila.appendChild(b);
        });
        return fila;
      };
      const bloque = (ico, color, titulo, texto, encendido, alCambiar, debajo) => {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        const llave = boton('in-llave', '<i></i>', () => { alCambiar(!encendido); pintarAvisos(); pintar(); }, titulo);
        llave.setAttribute('aria-pressed', String(encendido));
        const nombre = el('span', 'pf-aviso-titulo');
        nombre.append(cuadro(ico, color), el('b', null, titulo));
        fila.append(nombre, llave);
        caja.append(fila, el('p', 'pf-nota', texto));
        if (encendido && debajo) caja.appendChild(debajo);
        cuerpo.appendChild(caja);
      };
      const latencia = a.latencia === null ? 20 : a.latencia;
      bloque('sueno', 'azul', tx('perfil.avisos.dormir'), tx('perfil.avisos.dormirTexto', { hora: '23:20', despertar: '07:30', horas: u.duracion(480), latencia }), a.dormir, (v) => { a.dormir = v; },
        chips([15, 30, 45, 60], (n) => tx('perfil.avisos.antes', { n }), (n) => a.antes === n, (n) => { a.antes = n; }));
      // Tardo en dormirme (D33): lo que aprende Moss de tus respuestas, o un número fijo, como en la app.
      const tardo = el('section', 'pf-aviso');
      const tardoFila = el('div', 'pf-aviso-fila');
      const tardoNombre = el('span', 'pf-aviso-titulo');
      tardoNombre.append(cuadro('reloj', 'violeta'), el('b', null, tx('perfil.avisos.tardo')));
      tardoFila.appendChild(tardoNombre);
      tardo.append(tardoFila, chips([null, ...SinReloj.LATENCIAS], (n) => (n === null ? tx('perfil.avisos.tardoAprendido', { n: 20 }) : tx('perfil.avisos.minutos', { n })), (n) => a.latencia === n, (n) => { a.latencia = n; }), el('p', 'pf-nota', tx('perfil.avisos.tardoTexto')));
      cuerpo.appendChild(tardo);
      // El horario de comidas: cada comida elegida, con su hora de a un cuarto de hora (como Perfil.tsx).
      const HORAS = { desayuno: 8 * 60, almuerzo: 13 * 60, merienda: 17 * 60 + 30, cena: 21 * 60 };
      const reloj = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const filas = el('div', 'pf-horario');
      ['desayuno', 'almuerzo', 'merienda', 'cena'].forEach((c) => {
        const fila = el('div', 'pf-horario-fila');
        const elegida = a.horario[c] !== undefined;
        const chip = boton('fi-porcion', `<span>${tx('comida.comidas.' + c)}</span>`, () => {
          if (elegida) delete a.horario[c]; else a.horario[c] = HORAS[c];
          pintarAvisos(); pintar();
        });
        chip.setAttribute('aria-pressed', String(elegida));
        fila.appendChild(chip);
        if (elegida) {
          const mover = (dm) => { a.horario[c] = Math.min(23 * 60 + 45, Math.max(5 * 60, a.horario[c] + dm)); pintarAvisos(); };
          const pasos = el('div', 'fi-stepper pf-horario-pasos');
          pasos.append(boton('fi-paso', icono('menos'), () => mover(-15), '−15'), el('b', 'fi-valor', reloj(a.horario[c])), boton('fi-paso', icono('mas'), () => mover(15), '+15'));
          fila.appendChild(pasos);
        }
        filas.appendChild(fila);
      });
      bloque('comida', 'oro', tx('perfil.avisos.horario'), tx('perfil.avisos.horarioTexto'), Object.keys(a.horario).length > 0,
        (v) => { a.horario = v ? { desayuno: HORAS.desayuno, almuerzo: HORAS.almuerzo, cena: HORAS.cena } : {}; }, filas);
      bloque('balanza', 'salvia', tx('perfil.avisos.pesarse'), tx('perfil.avisos.pesarseTexto'), a.pesarse, (v) => { a.pesarse = v; },
        chips([false, true], (todos) => tx(todos ? 'perfil.avisos.pesarseTodos' : 'perfil.avisos.pesarseControl'), (todos) => a.todos === todos, (todos) => { a.todos = todos; }));
      bloque('campana', 'rosa', tx('perfil.recordatoriosLlave'), tx('perfil.recordatoriosTexto'), a.comidas.length > 0, (v) => { a.comidas = v ? ['desayuno', 'almuerzo', 'cena'] : []; },
        chips(['desayuno', 'almuerzo', 'merienda', 'cena'], (c) => tx('comida.comidas.' + c), (c) => a.comidas.includes(c),
          (c) => { a.comidas = a.comidas.includes(c) ? a.comidas.filter((x) => x !== c) : [...a.comidas, c]; }));
      // Si vas muy bajo en algo (src/dominio/loQueFalta.ts): aparte del máximo, con su propio tope.
      bloque('rayo', 'violeta', tx('perfil.avisos.falta'), tx('perfil.avisos.faltaTexto'), a.falta !== false, (v) => { a.falta = v; });
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.avisos.maximo')));
      cuerpo.appendChild(chips([2, 3, 4, 6, 8], String, (n) => a.maximo === n, (n) => { a.maximo = n; }));
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.avisos.maximoTexto')));
      h.append(cab, cuerpo);
      cuerpo.scrollTop = arriba;
    }
    // Cuándo entrenás (lo pediste el 26/10): con esto, Comida dice qué comer antes y después, en la
    // comida que toca. Como en la app (Perfil.tsx, CuandoEntrenas).
    function pintarEntreno() {
      const h = hoja.el;
      h.innerHTML = '';
      const e = opciones.comida.entreno;
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('entreno.perfil.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const poner = (cambios, ver) => { const nuevo = Object.assign({}, e, cambios); delete nuevo.ver; opciones.comida.ponerEntreno(nuevo, ver); pintarEntreno(); pintar(); };
      const chips = (valores, nombre, elegido, alElegir, clase) => {
        const fila = el('div', clase || 'fi-porciones pf-aviso-chips');
        valores.forEach((v) => {
          const b = boton('fi-porcion', `<span>${nombre(v)}</span>`, () => alElegir(v));
          b.setAttribute('aria-pressed', String(elegido(v)));
          fila.appendChild(b);
        });
        return fila;
      };
      const pregunta = (ico, color, titulo, debajo) => {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        const nombre = el('span', 'pf-aviso-titulo');
        nombre.append(cuadro(ico, color), el('b', null, titulo));
        fila.appendChild(nombre);
        caja.append(fila, debajo);
        cuerpo.appendChild(caja);
      };
      cuerpo.appendChild(el('p', 'pf-nota', tx('entreno.perfil.texto')));
      pregunta('pesa', 'oro', tx('entreno.perfil.dias'), chips(DIAS, (d) => tx('fecha.diasCortos.' + d), (d) => e.dias.includes(d), (d) => poner({ dias: e.dias.includes(d) ? e.dias.filter((x) => x !== d) : [...e.dias, d] }), 'pf-dias'));
      if (!e.dias.length) { h.append(cab, cuerpo); return; }
      const reloj = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      const pasos = el('div', 'fi-stepper');
      pasos.append(boton('fi-paso', icono('menos'), () => poner({ hora: Math.max(5 * 60, e.hora - 15) }), '−15'), el('b', 'fi-valor', reloj(e.hora)), boton('fi-paso', icono('mas'), () => poner({ hora: Math.min(23 * 60, e.hora + 15) }), '+15'));
      // La hora va a la derecha de su título: es un solo valor.
      const conHora = el('section', 'pf-aviso');
      const filaHora = el('div', 'pf-aviso-fila');
      const nombreHora = el('span', 'pf-aviso-titulo');
      nombreHora.append(cuadro('reloj', 'azul'), el('b', null, tx('entreno.perfil.hora')));
      filaHora.append(nombreHora, pasos);
      conHora.appendChild(filaHora);
      cuerpo.appendChild(conHora);
      pregunta('cronometro', 'violeta', tx('entreno.perfil.duracion'), chips([30, 45, 60, 90, 120], (n) => tx('entreno.perfil.minutos', { n }), (n) => e.minutos === n, (n) => poner({ minutos: n })));
      pregunta('huellas', 'salvia', tx('entreno.perfil.tipo'), chips(['fuerza', 'resistencia', 'mixta'], (x) => tx('entreno.perfil.tipos.' + x), (x) => e.tipo === x, (x) => poner({ tipo: x })));
      const caja = el('section', 'pf-aviso');
      const fila = el('div', 'pf-aviso-fila');
      const llave = boton('in-llave', '<i></i>', () => poner({}, !e.ver), tx('entreno.perfil.ver'));
      llave.setAttribute('aria-pressed', String(e.ver));
      const nombre = el('span', 'pf-aviso-titulo');
      nombre.append(cuadro('comida', 'rosa'), el('b', null, tx('entreno.perfil.ver')));
      fila.append(nombre, llave);
      caja.append(fila, el('p', 'pf-nota', tx('entreno.porQue.medico')));
      cuerpo.appendChild(caja);
      h.append(cab, cuerpo);
    }
    const DIAS = [1, 2, 3, 4, 5, 6, 0];
    function resumenDeEntreno(e) {
      if (!e.dias.length) return tx('entreno.perfil.sinCargar');
      const h = `${String(Math.floor(e.hora / 60)).padStart(2, '0')}:${String(e.hora % 60).padStart(2, '0')}`;
      const dias = DIAS.filter((d) => e.dias.includes(d));
      const cuales = dias.length === 7 ? tx('entreno.perfil.todos')
        : dias.length === 5 && dias.every((d) => d >= 1 && d <= 5) ? tx('entreno.perfil.entreSemana')
          : dias.length <= 3 ? dias.map((d) => tx('fecha.diasCortos.' + d)).join(' ')
            : tx('entreno.perfil.nDias', { n: dias.length });
      return `${cuales} · ${h}`;
    }
    function abrirEntreno() {
      pintarEntreno();
      hoja.abrir();
    }

    function abrirAvisos() {
      pintarAvisos();
      hoja.abrir();
      opciones.alCambiar();
    }

    // Las hojas chicas, como en la app (Perfil.tsx): la calidad del cielo, a qué hora empieza el día y la privacidad.
    const horaDelCorte = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    const nombreDelCorte = (c) => (c === 0 ? tx('perfil.corteMedianoche') : tx('perfil.corteHora', { hora: horaDelCorte(c) }));
    function pintarOpciones() {
      const h = hoja.el;
      h.innerHTML = '';
      const cual = s.opciones;
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.' + cual)), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const lista = el('div', 'pf-opciones-lista');
      const opcion = (titulo, detalle, elegida, alTocar) => {
        const b = boton('ent-opcion', `<b>${titulo}</b>${detalle ? `<span>${detalle}</span>` : ''}`, () => { alTocar(); pintar(); lista.querySelectorAll('.ent-opcion').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); });
        b.setAttribute('aria-pressed', String(elegida));
        lista.appendChild(b);
      };
      if (cual === 'calidad') {
        [null, 'alta', 'media', 'baja'].forEach((c) => opcion(tx('perfil.calidades.' + (c || 'automatica')), null, s.calidad === c, () => { s.calidad = c; }));
        cuerpo.append(lista, el('p', 'pf-texto', tx('perfil.calidadTexto')));
      } else if (cual === 'corte') {
        Fechas.CORTES.forEach((c) => opcion(nombreDelCorte(c), c === Fechas.CORTE_DE_FABRICA ? tx('perfil.corteDeFabrica') : null, s.corte === c, () => { s.corte = c; }));
        cuerpo.append(el('p', 'pf-texto', tx('perfil.corteTexto')), lista);
      } else {
        tx('perfil.privacidadTexto').forEach((p, i) => cuerpo.appendChild(el('p', 'pf-texto', conAscent() && i === 0 ? `${p} ${tx('perfil.privacidadConAscent')}` : p)));
      }
      h.append(cab, cuerpo);
    }
    function abrirOpciones(cual) {
      s.opciones = cual;
      pintarOpciones();
      hoja.abrir();
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ la persona y Editar perfil
    // Arriba de Perfil, la persona: su foto (o su inicial; sin nombre, la silueta) y su nombre, con el
    // correo de la cuenta debajo. Tocarla abre Editar perfil, como en la app (Perfil.tsx): la foto, el
    // nombre y tus datos, que se guardan juntos. La foto queda solo en el teléfono: acá se elige de
    // verdad (en el iPhone, con la cámara o las fotos) y se recorta cuadrada y chica, como en la app
    // (src/secciones/perfil/foto.ts).
    // Cerrar sin «Guardar» deja todo como estaba.
    const editar = Util.hoja(tel, 'hh-hoja pf-hoja-editar', () => { ed = null; opciones.alCambiar(); });
    const CORREO = 'agustin@icloud.com';
    const CAMARA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 8.5a2 2 0 0 1 2-2h1.8l1.4-2h4.6l1.4 2h1.8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.4"/></svg>';
    const FOTOS = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4"/></svg>';
    const RANGOS = Metas.RANGOS_DEL_CUESTIONARIO;
    // Lo guardado: el nombre (el de la persona de mentira), la foto y tus datos, si se cambiaron.
    Object.assign(s, { nombre: opciones.persona().perfil.nombre || '', foto: null, datos: null });
    // Lo que se está editando, hasta «Guardar».
    let ed = null;
    const datosDe = () => {
      const p = opciones.persona().perfil;
      return s.datos || { sexo: p.sexo, edad: Number(Datos.HOY.slice(0, 4)) - p.nacimiento, alturaCm: p.alturaCm, actividad: p.actividad };
    };
    const inicial = (nombre) => ([...nombre.trim()][0] || '').toLocaleUpperCase();

    // El círculo se rehace en su lugar: así el oro entra con una transición al escribir la primera letra.
    function pintarAvatar(a, foto, nombre, grande) {
      a.className = 'pf-avatar' + (grande ? ' grande' : '') + (!foto && !nombre.trim() ? ' vacio' : '');
      if (foto) {
        const img = a.querySelector('img') || el('img');
        if (img.getAttribute('src') !== foto) img.src = foto;
        img.alt = '';
        a.replaceChildren(img);
      } else if (nombre.trim()) a.textContent = inicial(nombre);
      else a.innerHTML = icono('perfil');
      return a;
    }
    const avatar = (foto, nombre, grande) => pintarAvatar(el('div'), foto, nombre, grande);

    // Lo que trae el selector, con el cuadrado del medio achicado a 512 px.
    function achicar(archivo) {
      return createImageBitmap(archivo).then((imagen) => {
        const lado = Math.min(imagen.width, imagen.height);
        const destino = Math.min(512, lado);
        const lienzo = el('canvas');
        lienzo.width = destino;
        lienzo.height = destino;
        const ctx = lienzo.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(imagen, (imagen.width - lado) / 2, (imagen.height - lado) / 2, lado, lado, 0, 0, destino, destino);
        return lienzo.toDataURL('image/jpeg', 0.85);
      });
    }
    function elegirFoto(conCamara) {
      const entrada = el('input');
      entrada.type = 'file';
      entrada.accept = 'image/*';
      if (conCamara) entrada.setAttribute('capture', 'user');
      entrada.addEventListener('change', () => {
        const archivo = entrada.files && entrada.files[0];
        if (!archivo || !ed) return;
        achicar(archivo).then((url) => {
          if (!ed) return;
          ed.foto = url;
          pintarEditar(true);
        }).catch(() => {});
      });
      entrada.click();
    }
    // Para las capturas: una foto de mentira, un atardecer sobre las sierras.
    function fotoDeMentira() {
      const lienzo = el('canvas');
      lienzo.width = 512;
      lienzo.height = 512;
      const x = lienzo.getContext('2d');
      const cielo = x.createLinearGradient(0, 0, 0, 512);
      [[0, '#f2c48d'], [0.45, '#c98a8a'], [0.75, '#5d5a8c'], [1, '#262b4d']].forEach(([en, color]) => cielo.addColorStop(en, color));
      x.fillStyle = cielo;
      x.fillRect(0, 0, 512, 512);
      const sol = x.createRadialGradient(300, 250, 0, 300, 250, 74);
      sol.addColorStop(0, 'rgba(255, 242, 214, 1)');
      sol.addColorStop(0.55, 'rgba(255, 226, 180, 0.85)');
      sol.addColorStop(1, 'rgba(255, 226, 180, 0)');
      x.fillStyle = sol;
      x.fillRect(200, 150, 200, 200);
      const sierra = (color, puntos) => {
        x.fillStyle = color;
        x.beginPath();
        x.moveTo(0, 512);
        puntos.forEach(([px, py]) => x.lineTo(px, py));
        x.lineTo(512, 512);
        x.fill();
      };
      sierra('#3b3c66', [[0, 330], [90, 282], [170, 318], [260, 264], [350, 310], [430, 272], [512, 300]]);
      sierra('#1d2140', [[0, 402], [110, 352], [200, 390], [300, 342], [400, 380], [512, 352]]);
      return lienzo.toDataURL('image/jpeg', 0.85);
    }

    function pintarEditar(mantener) {
      const h = editar.el;
      const antes = h.querySelector('.hh-cuerpo');
      const arriba = mantener && antes ? antes.scrollTop : 0;
      h.innerHTML = '';
      h.setAttribute('aria-label', tx('perfil.editar.titulo'));
      const cab = el('header', 'hh-cab');
      cab.append(el('h3', 'hh-titulo', tx('perfil.editar.titulo')), boton('hb-cerrar', icono('cerrar'), () => editar.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'hh-cuerpo');

      // La foto, sus dos botones y dónde queda. Solo lo que cambió entra con un fundido.
      const caja = el('div', 'pf-editar-foto');
      const grande = avatar(ed.foto, ed.nombre, true);
      grande.setAttribute('role', 'img');
      grande.setAttribute('aria-label', tx('perfil.editar.foto'));
      const otraFoto = ed.foto !== ed.fotoPintada;
      if (otraFoto) grande.classList.add('entra');
      ed.fotoPintada = ed.foto;
      const botones = el('div', 'pf-editar-botones');
      botones.append(
        boton('cm-accion', `${CAMARA}<span>${tx('perfil.editar.sacarFoto')}</span>`, () => elegirFoto(true)),
        boton('cm-accion', `${FOTOS}<span>${tx('perfil.editar.elegirFoto')}</span>`, () => elegirFoto(false)),
      );
      caja.append(grande, botones);
      if (ed.foto) {
        const quitar = boton('pf-quitar-foto', tx('perfil.editar.quitarFoto'), () => { ed.foto = null; pintarEditar(true); });
        if (otraFoto) quitar.classList.add('entra');
        caja.appendChild(quitar);
      }
      caja.appendChild(el('p', 'pf-editar-nota', tx('perfil.editar.fotoNota')));
      cuerpo.appendChild(caja);

      // El nombre: sin uno guardado, Moss lo pide.
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.editar.nombre')));
      if (!s.nombre.trim()) cuerpo.appendChild(el('p', 'pf-pedido', tx('perfil.editar.sinNombre')));
      const campo = el('input', 'hh-campo');
      campo.type = 'text';
      campo.maxLength = 60;
      campo.value = ed.nombre;
      campo.placeholder = tx('perfil.editar.nombreCampo');
      campo.autocomplete = 'name';
      campo.setAttribute('aria-label', tx('perfil.editar.nombre'));
      campo.addEventListener('input', () => {
        ed.nombre = campo.value;
        // Sin foto, el círculo grande muestra la inicial de lo que se escribe.
        if (!ed.foto) pintarAvatar(grande, null, ed.nombre, true);
      });
      cuerpo.appendChild(campo);

      // Tus datos, como estaban en su hoja: no cambian las metas.
      const d = ed.datos;
      const repintar = () => pintarEditar(true);
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.sexo')));
      const sexos = el('div', 'aj-segmento');
      ['f', 'm'].forEach((v) => {
        const b = boton('aj-seg', '', () => { d.sexo = v; repintar(); });
        b.textContent = tx('perfil.sexos.' + v);
        b.setAttribute('aria-pressed', String(d.sexo === v));
        sexos.appendChild(b);
      });
      cuerpo.appendChild(sexos);
      const pasos = (valor, bajar, subir) => {
        const p = el('div', 'fi-stepper');
        p.append(boton('fi-paso', icono('menos'), () => { bajar(); repintar(); }, '−'), el('b', 'fi-valor pf-valor', valor), boton('fi-paso', icono('mas'), () => { subir(); repintar(); }, '+'));
        return p;
      };
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.edad')));
      cuerpo.appendChild(pasos(tx('perfil.anios', { n: d.edad }), () => { d.edad = Math.max(RANGOS.edad[0], d.edad - 1); }, () => { d.edad = Math.min(RANGOS.edad[1], d.edad + 1); }));
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.altura')));
      cuerpo.appendChild(pasos(`${numero(d.alturaCm)} cm`, () => { d.alturaCm = Math.max(RANGOS.alturaCm[0], d.alturaCm - 1); }, () => { d.alturaCm = Math.min(RANGOS.alturaCm[1], d.alturaCm + 1); }));
      cuerpo.appendChild(el('div', 'aj-etq', tx('perfil.actividad')));
      const actividades = el('div', 'pf-actividades');
      ['poco', 'algo', 'activo', 'muy'].forEach((a) => {
        const [titulo, detalle] = tx('entrada.cuestionario.actividad.' + a);
        const b = boton('ent-opcion', `<b>${titulo}</b><span>${detalle}</span>`, () => { d.actividad = a; repintar(); });
        b.setAttribute('aria-pressed', String(d.actividad === a));
        actividades.appendChild(b);
      });
      cuerpo.appendChild(actividades);
      cuerpo.appendChild(el('p', 'hh-nota', tx('perfil.tusDatosNota')));

      const pie = el('footer', 'hh-pie');
      const guardar = boton('cm-accion principal', '', () => guardarEditar());
      guardar.textContent = tx('comun.guardar');
      pie.appendChild(guardar);
      h.append(el('div', 'hb-asa'), cab, cuerpo, pie);
      cuerpo.scrollTop = arriba;
    }
    function abrirEditar() {
      if (hoja.abierta) hoja.cerrar(true);
      ed = { nombre: s.nombre, foto: s.foto, fotoPintada: s.foto, datos: Object.assign({}, datosDe()) };
      pintarEditar();
      editar.abrir();
      opciones.alCambiar();
    }
    function guardarEditar() {
      if (!ed) return;
      s.nombre = ed.nombre.replace(/\s+/g, ' ').trim();
      s.foto = ed.foto;
      s.datos = ed.datos;
      ed = null;
      editar.cerrar();
      pintar();
    }

    // Lo último que se pintó arriba: el nombre o la foto nuevos entran con un fundido; lo demás queda quieto.
    const pintado = { nombre: s.nombre, foto: s.foto };
    // Lo que se vio la última vez: lo que cambia se anima, lo demás queda quieto. Al cambiar de idioma cambia todo: no se anima.
    const vistos = new Map();
    let filasAntes = new Set(), filasAhora = new Set();
    let idiomaPintado = null;
    const quieto = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const cambio = (clave, valor) => { const si = vistos.has(clave) && vistos.get(clave) !== valor; vistos.set(clave, valor); return si; };
    /** Lo que se va se achica antes de rearmar Perfil: nada desaparece de golpe. */
    function conSalida(nodos, despues) {
      if (quieto() || !nodos.length) { despues(); return; }
      nodos.forEach((n) => { n.style.height = `${n.offsetHeight}px`; void n.offsetHeight; n.classList.add('pf-sale'); });
      setTimeout(despues, 260);
    }
    /** «31 años» en el número y su unidad, para que la unidad vaya más chica. */
    const partir = (texto) => { const m = /^(\S+)\s+(.+)$/.exec(texto); return m ? [m[1], m[2]] : [texto, '']; };
    const piesYPulgadas = (cm) => { const p = Math.round(cm / 2.54); return `${Math.floor(p / 12)}′ ${p % 12}″`; };
    function tarjetaDeLaPersona() {
      const tarjeta = el('section', 'pf-tarjeta');
      const cab = boton('pf-cab', '', () => abrirEditar(), tx('perfil.editar.titulo'));
      const nombres = el('div', 'pf-nombres');
      const titulo = s.nombre ? el('h2', null, s.nombre) : el('h2', 'pf-sin-nombre', tx('perfil.agregarNombre'));
      if (s.nombre !== pintado.nombre) titulo.classList.add('entra');
      nombres.append(titulo, el('span', null, CORREO));
      const circulo = avatar(s.foto, s.nombre);
      if (s.foto !== pintado.foto || (!s.foto && s.nombre !== pintado.nombre)) circulo.classList.add('entra');
      Object.assign(pintado, { nombre: s.nombre, foto: s.foto });
      cab.append(circulo, nombres);
      cab.insertAdjacentHTML('beforeend', icono('adelante'));
      tarjeta.appendChild(cab);
      // Lo importante de un vistazo: tocar la edad o la altura abre Editar perfil; la meta, Progreso.
      const d = datosDe();
      const p = opciones.persona().perfil;
      const minis = el('div', 'pf-minis');
      const mini = (etiqueta, valor, unidad, alTocar, clase) => {
        const b = boton('pf-mini', '', alTocar);
        b.appendChild(el('span', null, etiqueta));
        const v = el('b', clase || null, valor);
        if (unidad) v.append(' ', el('small', null, unidad));
        if (cambio('mini:' + etiqueta, valor + unidad)) v.classList.add('pf-entra');
        b.appendChild(v);
        minis.appendChild(b);
      };
      const [edad, anios] = partir(tx('perfil.anios', { n: d.edad }));
      mini(tx('perfil.edad'), edad, anios, abrirEditar);
      if (s.sistema === 'imperial') mini(tx('perfil.altura'), piesYPulgadas(d.alturaCm), '', abrirEditar);
      else mini(tx('perfil.altura'), numero(d.alturaCm), 'cm', abrirEditar);
      const irAMetas = () => opciones.irAMetas && opciones.irAMetas();
      if (p.objetivo === 'mantener') mini(tx('perfil.mini.mantener'), tx('progreso.objetivos.mantener'), '', irAMetas, 'texto');
      else mini(tx('perfil.mini.' + p.objetivo), numero(p.pesoMeta), 'kg', irAMetas);
      tarjeta.appendChild(minis);
      return tarjeta;
    }
    // Cómo está la suscripción, a la vista: solo la fila, con lo que dice la suscripción (suscripcion.js),
    // y con los días de la prueba, los que pasaron encendidos.
    function filaDelPlan() {
      const acceso = opciones.accesoDeSuscripcion ? opciones.accesoDeSuscripcion() : null;
      const b = boton('pf-plan', '', () => opciones.abrirSuscripcion(), tx('suscripcion.titulo'));
      const textos = el('span', 'pf-plan-textos');
      const estado = el('span', null, opciones.suscripcion());
      if (cambio('plan', estado.textContent)) estado.classList.add('pf-entra');
      textos.append(el('b', null, tx('suscripcion.titulo')), estado);
      b.append(cuadro(acceso === 'regalo' ? 'regalo' : 'estrella', 'oro'), textos);
      if (acceso === 'prueba') {
        const dias = el('span', 'pf-plan-dias');
        for (let i = 0; i < Premium.DIAS_DE_PRUEBA; i++) dias.appendChild(el('i', i < 2 ? 'lleno' : null));
        b.appendChild(dias);
      } else b.appendChild(el('span'));
      b.insertAdjacentHTML('beforeend', icono('adelante'));
      return b;
    }
    /** Una fila: su cuadrito, lo que es, debajo qué hace si hace falta, cómo está y la flecha. */
    function filaDe({ clave, ico, color, titulo, sub, valor, punto, tipo, alTocar, flecha = true }) {
      const li = el('li');
      if (clave) li.dataset.fila = clave;
      // La fila que no estaba crece; si ya estaba, entra lo que cambió de ella.
      const nueva = filasAntes.size > 0 && !filasAntes.has(titulo);
      if (nueva) li.classList.add('pf-crece');
      filasAhora.add(titulo);
      const b = boton('pf-fila' + (tipo ? ' ' + tipo : ''), '', alTocar || (() => {}));
      const textos = el('span', 'pf-fila-textos');
      textos.appendChild(el('span', 'pf-fila-titulo', titulo));
      if (sub) {
        const chico = el('small', 'pf-sub', sub);
        if (!nueva && vistos.has('sub:' + titulo) && !vistos.get('sub:' + titulo)) chico.classList.add('entra');
        textos.appendChild(chico);
      }
      vistos.set('sub:' + titulo, !!sub);
      b.append(cuadro(ico, color), textos);
      const v = el('b', 'pf-fila-valor');
      if (punto) v.appendChild(el('i'));
      if (valor) v.append(valor);
      if (!nueva && cambio('valor:' + titulo, valor || '')) v.classList.add('pf-entra');
      else vistos.set('valor:' + titulo, valor || '');
      b.appendChild(v);
      if (flecha) b.insertAdjacentHTML('beforeend', icono('adelante'));
      else b.appendChild(el('span', 'sin-flecha'));
      li.appendChild(b);
      return li;
    }
    function grupo(clave, filas) {
      cont.appendChild(el('h3', 'pf-grupo', tx(clave)));
      const ul = el('ul', 'pf-lista pf-filas');
      filas.filter(Boolean).forEach((f) => ul.appendChild(filaDe(f)));
      cont.appendChild(ul);
    }
    function pintar() {
      const arriba = cont.scrollTop;
      filasAntes = u.idioma() === idiomaPintado ? filasAhora : new Set();
      filasAhora = new Set();
      if (u.idioma() !== idiomaPintado) vistos.clear();
      idiomaPintado = u.idioma();
      cont.innerHTML = '';
      cont.appendChild(tarjetaDeLaPersona());
      if (opciones.suscripcion) cont.appendChild(filaDelPlan());
      const d = datosDe();
      const aparato = opciones.sinReloj() ? tx('perfil.aparatos.soloIphone') : 'Apple Watch';
      const noches = opciones.sinReloj() ? opciones.nochesSinReloj() : Datos.NOCHES.filter((n) => n.clave > Fechas.sumarDias(Datos.HOY, -30)).length;
      // Arriba, para que se encuentren: de dónde llega todo y, cuando se prenda, Ascent.
      grupo('perfil.conexiones', [
        { ico: 'corazon', color: 'rosa', titulo: tx('perfil.salud'), valor: tx(s.sinSalud ? 'perfil.conectar' : 'perfil.conectada'), punto: !s.sinSalud, tipo: s.sinSalud ? 'accion' : 'ok', alTocar: () => { s.sinSalud = !s.sinSalud; pintar(); } },
        { ico: opciones.sinReloj() ? 'telefono' : 'reloj3', color: 'azul', titulo: tx('perfil.aparatos.titulo'), sub: u.plural('perfil.aparatos.noches', noches), valor: aparato, alTocar: abrirAparatos },
        // Lleva a la sección de Ascent: ahí se vincula y se ve lo de las dos.
        conAscent() && (opciones.vinculada()
          ? { ico: 'planeta', color: 'ascent', titulo: tx('perfil.ascent'), valor: tx('perfil.vinculada'), punto: true, tipo: 'ok', alTocar: opciones.abrirAscent }
          : { ico: 'planeta', color: 'ascent', titulo: tx('perfil.ascent'), sub: tx('perfil.mini.ascent'), valor: tx('perfil.vincular'), tipo: 'accion', alTocar: opciones.abrirAscent }),
      ]);
      // Tus datos se cambian en Editar perfil, con el nombre y la foto.
      grupo('perfil.tusDatos', [
        { ico: 'perfil', color: 'azul', titulo: tx('perfil.sexo'), valor: tx('perfil.sexos.' + d.sexo), alTocar: abrirEditar },
        { ico: 'huellas', color: 'salvia', titulo: tx('perfil.actividad'), valor: tx('perfil.actividades.' + d.actividad), alTocar: abrirEditar },
        // Para qué comer antes y después de entrenar (Comida); con «sin déficit» no se ve.
        !s.sinDeficit && opciones.comida && { clave: 'entreno', ico: 'pesa', color: 'oro', titulo: tx('entreno.perfil.titulo'), valor: resumenDeEntreno(opciones.comida.entreno), alTocar: abrirEntreno },
        // Sin déficit: embarazo, lactancia o una condición médica (no se guarda cuál).
        { clave: 'cuidado', ico: 'escudo', color: 'rosa', titulo: tx('perfil.cuidado'), sub: s.sinDeficit ? tx('perfil.sinDeficitTexto') : null, valor: tx(s.sinDeficit ? 'perfil.sinDeficit' : 'perfil.ninguno'), tipo: s.sinDeficit ? 'ok' : null,
          alTocar: () => conSalida([...cont.querySelectorAll(s.sinDeficit ? '[data-fila="cuidado"] .pf-sub' : '[data-fila="entreno"]')], () => { s.sinDeficit = !s.sinDeficit; pintar(); }) },
      ]);
      grupo('perfil.preferencias', [
        { ico: 'cinta', color: 'gris', titulo: tx('perfil.unidades'), valor: tx(s.sistema === 'imperial' ? 'perfil.imperial' : 'perfil.metrico'), alTocar: () => { s.sistema = s.sistema === 'imperial' ? 'metrico' : 'imperial'; pintar(); } },
        // El idioma es el del teléfono; en la galería, el botón de idioma.
        { ico: 'globo', color: 'azul', titulo: tx('perfil.idioma'), valor: tx('perfil.idiomaDelTelefono'), alTocar: () => { const otro = document.querySelector('#s-idioma button[aria-pressed="false"]'); if (otro) otro.click(); } },
        { ico: 'amanecer', color: 'oro', titulo: tx('perfil.corte'), valor: nombreDelCorte(s.corte), alTocar: () => abrirOpciones('corte') },
        { ico: 'estrella', color: 'violeta', titulo: tx('perfil.calidad'), valor: tx('perfil.calidades.' + (s.calidad || 'automatica')), alTocar: () => abrirOpciones('calidad') },
        { ico: 'campana', color: 'rosa', titulo: tx('perfil.recordatorios'), valor: tx(s.avisos.dormir || s.avisos.comidas.length || Object.keys(s.avisos.horario).length || s.avisos.pesarse ? 'perfil.encendidos' : 'perfil.apagados'), alTocar: abrirAvisos },
        // Ocultar los números: sin calorías ni gramos, solo las figuras y las barras.
        { ico: 'ojo', color: 'gris', titulo: tx('perfil.numeros'), sub: tx('perfil.numerosTexto'), valor: tx(s.numeros ? 'perfil.visibles' : 'perfil.ocultos'), alTocar: () => { s.numeros = !s.numeros; opciones.alNumeros(s.numeros); pintar(); } },
      ]);
      grupo('perfil.tusDatosParaLlevar', [
        { ico: 'exportar', color: 'azul', titulo: tx('perfil.exportar'), valor: 'CSV' },
        { ico: 'candado', color: 'salvia', titulo: tx('perfil.privacidad'), alTocar: () => abrirOpciones('privacidad') },
        // Lo que se busca y no se encuentra sale sin la cuenta, solo si se elige (guía 5.1.1 de Apple).
        { ico: 'lupa', color: 'violeta', titulo: tx('perfil.mejorarBase'), sub: tx('perfil.mejorarBaseTexto'), valor: tx(s.buscar ? 'perfil.si' : 'perfil.no'), alTocar: () => { s.buscar = !s.buscar; pintar(); } },
        { ico: 'documento', color: 'gris', titulo: tx('perfil.politica') },
        { ico: 'documento', color: 'gris', titulo: tx('perfil.terminos') },
        { ico: 'sobre', color: 'gris', titulo: tx('perfil.contacto') },
        { ico: 'basura', color: 'rosa', titulo: tx('perfil.borrarDatos'), tipo: 'peligro', flecha: false },
        // Borra la cuenta de Moss; vinculada, el aviso dice que Ascent sigue intacta (spec/ascent.md, «Dos cuentas»).
        { ico: 'basura', color: 'rosa', titulo: tx('perfil.borrarCuenta'), tipo: 'peligro', flecha: false },
      ]);
      // De dónde salen los alimentos y las estrellas, con su licencia: se despliega, como una marca en Aparatos.
      cont.appendChild(el('h3', 'pf-grupo', tx('perfil.creditos')));
      const creditos = el('ul', 'pf-lista pf-marcas pf-creditos-lista');
      const liCreditos = el('li', s.creditos ? 'abierta' : null);
      const abrirCreditos = boton('pf-marca pf-creditos-abrir', '', () => { s.creditos = !s.creditos; liCreditos.classList.toggle('abierta', s.creditos); });
      abrirCreditos.append(cuadro('info', 'gris'), el('span', null, tx('perfil.mini.fuentes')));
      abrirCreditos.insertAdjacentHTML('beforeend', icono('adelante'));
      const dentro = el('div', 'pf-marca-texto');
      const texto = el('p', 'pf-creditos-dentro');
      ['usda', 'off', 'taco', 'ciqual', 'cofid', 'estrellas'].forEach((f) => texto.appendChild(el('span', null, tx('perfil.fuentes.' + f))));
      dentro.appendChild(texto);
      liCreditos.append(abrirCreditos, dentro);
      creditos.appendChild(liCreditos);
      cont.appendChild(creditos);
      // Al final, lo que anda solo si vinculas Ascent (lo pediste el 22/10): información, no una función de Perfil.
      if (conAscent()) {
        cont.appendChild(el('h3', 'pf-grupo', tx('perfil.informacion')));
        cont.appendChild(el('p', 'pf-nota', tx('perfil.informacionAscent')));
        const conLasDos = el('ul', 'pf-lista pf-con-ascent');
        CON_ASCENT.forEach(([k, icon]) => {
          const li = el('li');
          li.appendChild(cuadro(icon, 'ascent'));
          const txt = el('div');
          txt.append(el('b', null, tx(`ascent.funciones.${k}.titulo`)), el('span', null, tx(`ascent.funciones.${k}.texto`)));
          li.appendChild(txt);
          conLasDos.appendChild(li);
        });
        cont.appendChild(conLasDos);
      }
      cont.appendChild(boton('pf-salir', tx('perfil.cambiarCuenta'), () => {}));
      cont.appendChild(boton('pf-salir', tx('perfil.cerrarSesion'), () => {}));
      cont.appendChild(el('p', 'pf-version', 'Moss 1.0 (1)'));
      cont.scrollTop = arriba;
    }

    pintar();
    // Para las capturas: Editar perfil, con la foto de mentira, lo que se escribe y sin nombre.
    window.__perfil = (accion, arg) => {
      const pasos = {
        abrir: () => abrirEditar(),
        foto: () => { if (ed) { ed.foto = arg === false ? null : fotoDeMentira(); pintarEditar(true); } },
        escribir: () => {
          const campo = editar.el.querySelector('.hh-campo');
          if (!ed || !campo) return;
          campo.value = arg;
          campo.dispatchEvent(new Event('input'));
        },
        guardar: () => guardarEditar(),
        cerrar: () => editar.cerrar(),
        // Sin nombre ni foto, como si Apple no lo hubiera traído; `true` vuelve a la persona de mentira.
        sinNombre: () => { Object.assign(s, { nombre: arg ? opciones.persona().perfil.nombre : '', foto: null }); pintar(); },
        hoja: () => abrirOpciones(arg),
        cerrarHoja: () => hoja.cerrar(),
        creditos: () => { s.creditos = arg !== false; pintar(); },
        bajar: () => { const n = cont.querySelector(arg); if (n) cont.scrollTo(0, Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - 70)); },
        subir: () => cont.scrollTo(0, 0),
      };
      pasos[accion]();
    };
    return {
      zona,
      pintar,
      abrirAparatos,
      abrirAvisos,
      abrirEntreno,
      abrirEditar,
      // Para las capturas: los avisos encendidos.
      ponerAvisos(cambios) { Object.assign(s.avisos, cambios); if (hoja.abierta) pintarAvisos(); pintar(); },
      // Para las capturas: los números ocultos y sin déficit.
      poner(cambios) { Object.assign(s, cambios); if ('numeros' in cambios) opciones.alNumeros(s.numeros); pintar(); },
      get sinDeficit() { return s.sinDeficit; },
      // Para las capturas: una marca desplegada.
      desplegar(m) { s.abierta = m; pintarAparatos(); },
      bajarHoja() { const c = hoja.el.querySelector('.pf-aparatos, .pf-avisos'); if (c) c.scrollTop = c.scrollHeight; },
      subir() { cont.scrollTo(0, 0); },
      get hojaAbierta() { return hoja.abierta || editar.abierta; },
      cerrarHoja() { hoja.cerrar(true); editar.cerrar(true); },
    };
  }

  return { crear };
})();
