// Dónde vive Ascent (28/11/2026, para aprobar). Lo de Ascent ya vinculada (lo que Moss muestra del gimnasio), con el
// mismo contenido (AscentDeMentira, el día «cargado»), en tres lugares:
// - «Como hoy»: la sección de verdad de la galería, arriba de Progreso, bajando.
// - «Dentro de Progreso»: Progreso con un selector «Cuerpo · Fuerza» que se cambia tocando o deslizando de costado.
//   «Cuerpo» es Progreso tal cual (otra copia de SeccionProgreso, sin la entrada de Ascent) y «Fuerza», lo de Ascent en
//   las cartas de Progreso; sin vincular, «Fuerza» invita a vincular. Su otra forma, «en un solo scroll»: sin selector,
//   «Fuerza» es un título más al final de Progreso.
// - «Su propia pestaña»: Inicio · Comida · Fuerza · + · Progreso · Sueño · Hábitos, con Perfil en un botón redondo
//   arriba a la derecha de Inicio; sin vincular, la barra de siempre. La barra de la galería no cambia: esta es
//   dibujada, y Inicio, Comida, Sueño y Perfil son copias quietas de las secciones de verdad (Hábitos no está).
// Las secciones de verdad quedan debajo, tapadas (las clases dva-tapa en .tel): se ve el mismo cielo con su velo.

const T = {
  es: {
    cuerpo: 'Cuerpo',
    fuerza: 'Fuerza',
    selector: 'Qué ver en Progreso',
    conAscent: 'Con Ascent',
    hoy: 'Hoy',
    entrenamientos: { uno: '{n} de {de} entrenamiento', otros: '{n} de {de} entrenamientos' },
    suben: { uno: '{n} de {de} sube', otros: '{n} de {de} suben' },
    porQue: '¿Por qué no estás mejorando?',
    estados: { enCamino: 'En camino', noSube: 'Así no llega', noSeSabe: 'Todavía no se sabe', lograda: 'Lograda' },
    invita: {
      titulo: 'Tu fuerza, con Ascent',
      lista: ['Cómo llegas a entrenar hoy', 'Tu semana, músculo por músculo', 'Si tu fuerza sube, y por qué no', 'Tus metas y tu año'],
    },
    perfil: 'Perfil de {nombre}',
  },
  en: {
    cuerpo: 'Body',
    fuerza: 'Strength',
    selector: 'What to see in Progress',
    conAscent: 'With Ascent',
    hoy: 'Today',
    entrenamientos: { uno: '{n} of {de} workout', otros: '{n} of {de} workouts' },
    suben: { uno: '{n} of {de} going up', otros: '{n} of {de} going up' },
    porQue: 'Why am I not improving?',
    estados: { enCamino: 'On track', noSube: 'Not getting there', noSeSabe: 'Too early to tell', lograda: 'Reached' },
    invita: {
      titulo: 'Your strength, with Ascent',
      lista: ['How ready you are to train today', 'Your week, muscle by muscle', 'Whether your strength goes up, and why not', 'Your goals and your year'],
    },
    perfil: '{nombre}’s profile',
  },
};

// Las reglas del gesto de la galería (galeria.js): cambia con un quinto de la pantalla o con un tirón; el viaje dura
// 340 ms con la curva de Ascent, y donde no hay nada la tira cede un cuarto de lo que se mueve el dedo.
const DECIDE_PX = 14;
const UMBRAL = 0.22;
const VELOCIDAD_MIN = 0.35;
const VIAJE_MS = 340;
const CEDE = 0.25;
// Cuánto se oscurece el cielo detrás de cada sección (VELO en galeria.js). La de verdad queda en Inicio (0,45) y el
// velo propio suma lo que falta.
const VELO = { inicio: 0.45, comida: 0.8, fuerza: 0.8, progreso: 0.8, sueno: 0.7, habitos: 0, perfil: 0.8 };
const VELO_DE_INICIO = 0.45;
const CURVA = 'cubic-bezier(0.16, 1, 0.3, 1)';

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const enX = (t) => ((ax * t + bx) * t + cx) * t;
  const derivada = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (u) => {
    let t = u;
    for (let i = 0; i < 8; i++) {
      const d = derivada(t);
      if (Math.abs(d) < 1e-6) break;
      t = Math.min(1, Math.max(0, t - (enX(t) - u) / d));
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const curva = bezier(0.16, 1, 0.3, 1);

const CSS = `
/* Las secciones de verdad, debajo y tapadas; con la pestaña propia, también su barra. */
.tel.dva-tapa > .pagina-app, .tel.dva-tapa > .as-techo { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s ease; }
.tel.dva-tapa-barra > .pestanas { opacity: 0 !important; pointer-events: none !important; transition: opacity 0.3s ease; }
.tel .pr-pantalla.dva-pantalla { background: transparent; -webkit-user-select: none; user-select: none; }
.tel .pr-pantalla.dva-sin { animation-name: dva-aparece; }
.tel .pr-pantalla.dva-sin.saliendo { animation-name: dva-desaparece; }
@keyframes dva-aparece { from { opacity: 0; } }
@keyframes dva-desaparece { to { opacity: 0; } }
.dva-con .pagina-app::after { display: none; }
.dva-vista { position: absolute; inset: 0; animation: dva-aparece 0.3s ease both; }
.dva-pantalla .dva-icono svg, .dva-pantalla .dva-enlace svg, .dva-pantalla .dva-volver svg, .dva-invita li svg { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

/* Dentro de Progreso: arriba la fecha, el título y el selector; al bajar, el título se va y el selector queda. */
.dva-cab { position: absolute; z-index: 3; left: 0; right: 0; top: 0; padding: calc(var(--arriba) + 2px) 18px 0; pointer-events: none; }
.dva-cab::before { content: ''; position: absolute; left: 0; right: 0; top: 0; bottom: -18px; background: linear-gradient(180deg, rgba(3, 5, 12, 0.99), rgba(3, 5, 12, 0.985) calc(100% - 18px), rgba(3, 5, 12, 0)); opacity: var(--dva-k, 0); }
.dva-cab > * { position: relative; }
.dva-titulos { display: grid; gap: 2px; padding-bottom: 16px; }
.dva-selector { pointer-events: auto; position: relative; display: grid; grid-template-columns: 1fr 1fr; height: 44px; padding: 3px; border-radius: 13px; background: rgba(239, 230, 207, 0.06); border: 1px solid rgba(239, 230, 207, 0.09); }
.dva-selector > i { position: absolute; left: 3px; top: 3px; bottom: 3px; width: calc(50% - 3px); border-radius: 10px; background: rgba(239, 230, 207, 0.13); box-shadow: 0 1px 8px rgba(0, 0, 0, 0.35); }
.dva-selector button { position: relative; appearance: none; border: 0; background: none; cursor: pointer; padding: 0; font: 500 14.5px/1 var(--texto); letter-spacing: 0.01em; color: rgba(239, 230, 207, 0.55); }
/* Cada parte mide 36 px por dentro del borde: lo que se toca llega a los 44 del selector. */
.dva-selector button::after { content: ''; position: absolute; inset: -4px 0; }
.dva-pistas { position: absolute; inset: 0; overflow: hidden; }
.dva-panel { position: absolute; inset: 0; }
.dva-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) + 2px) 18px calc(var(--pestanas) + 40px); scrollbar-width: none; touch-action: pan-y; color: var(--tinta); }
.dva-scroll::-webkit-scrollbar { display: none; }
.dva-selectora .pg-cab, .dva-selectora .dt-franja { display: none; }
.dva-selectora .pg-scroll, .dva-selectora .dva-scroll { padding-top: var(--dva-cab, 180px); }

/* Las cartas de Fuerza, con la letra y las cartas de Progreso. */
.dva-carta { animation: dva-sube 0.46s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(var(--i, 0) * 55ms); }
@keyframes dva-sube { from { opacity: 0; transform: translateY(12px); } }
.dva-derecha { font: 400 13px/1.2 var(--texto); color: rgba(239, 230, 207, 0.62); white-space: nowrap; }
.dva-linea { height: 1px; margin: 8px 0 4px; background: rgba(239, 230, 207, 0.08); }
.dva-aviso { display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 10px; }
.dva-aviso > i { display: block; width: 16px; height: 16px; color: var(--as-lejos); }
.dva-aviso.seRecupera > i { color: rgba(239, 230, 207, 0.7); }
.dva-aviso b { font: 500 15px/1.25 var(--texto); }
.dva-aviso span { font: 400 13px/1.2 var(--texto); color: var(--as-lejos); white-space: nowrap; }
.dva-aviso.seRecupera span { color: rgba(239, 230, 207, 0.62); }
.dva-hacer { margin: 2px 0 0; font: 400 14.5px/1.42 var(--texto); color: var(--tinta); }
.dva-semana { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 16px; margin-top: 6px; }
.dva-figuras { display: flex; gap: 4px; }
.dva-figuras svg { width: 50px; height: 94px; }
.dva-sale { display: grid; gap: 9px; min-width: 0; }
.dva-sale-resumen { display: grid; gap: 2px; font: 500 15px/1.3 var(--texto); }
.dva-sale ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
.dva-sale li { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 8px; font: 400 13.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.86); }
.dva-sale li em { font-style: normal; font-size: 13px; color: rgba(239, 230, 207, 0.6); white-space: nowrap; }
.dva-sale li.fatigado em { color: var(--as-lejos); }
.dva-muestra { width: 10px; height: 10px; border-radius: 3px; background: rgba(170, 178, 196, 0.2); }
.dva-muestra.poco { background: color-mix(in srgb, var(--as-claro) 38%, transparent); }
.dva-muestra.enSuPunto { background: color-mix(in srgb, var(--as-claro) 92%, transparent); }
.dva-muestra.mucho { background: rgba(240, 196, 138, 0.85); }
.dva-muestra.fatigado { outline: 1px dashed var(--as-lejos); outline-offset: 1px; }
.dva-ejercicios { list-style: none; margin: 2px 0 0; padding: 0; display: grid; }
.dva-ejercicios li { display: grid; grid-template-columns: 1fr 76px; align-items: center; gap: 12px; min-height: 50px; padding: 6px 0; border-top: 1px solid rgba(239, 230, 207, 0.07); }
.dva-ejercicios li:first-child { border-top: 0; }
.dva-ejercicios b { display: block; font: 400 15px/1.2 var(--texto); }
.dva-ejercicios span { display: block; margin-top: 3px; font: 400 13px/1.25 var(--texto); color: rgba(239, 230, 207, 0.6); }
.dva-ejercicios li.bajo span { color: var(--as-lejos); }
.dva-ejercicios svg { width: 76px; height: 28.5px; }
.dva-pantalla .dva-enlace { min-height: 44px; padding: 0; font-size: 14px; }
.dva-metas { display: grid; gap: 16px; margin-top: 4px; }
.dva-meta-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.dva-meta-cab b { font: 400 15px/1.25 var(--texto); }
.dva-estado { flex: none; font: 500 13px/1 var(--texto); padding: 5px 9px; border-radius: 999px; color: rgba(239, 230, 207, 0.75); background: rgba(239, 230, 207, 0.07); white-space: nowrap; }
.dva-estado.enCamino, .dva-estado.lograda { color: var(--salvia); background: rgba(166, 191, 148, 0.1); }
.dva-estado.noSube { color: var(--oro-claro); background: rgba(232, 196, 106, 0.1); }
.dva-meta-barra { height: 4px; margin: 9px 0 7px; border-radius: 2px; background: rgba(239, 230, 207, 0.1); overflow: hidden; }
.dva-meta-barra i { display: block; height: 100%; border-radius: 2px; background: var(--as-claro); transform-origin: left; transform: scaleX(var(--a, 0)); animation: dva-llena 0.9s 0.25s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes dva-llena { from { transform: scaleX(0); } }
.dva-meta-nota { font: 400 13px/1.38 var(--texto); color: rgba(239, 230, 207, 0.62); }
.dva-anio-mapa { margin-top: 6px; }
.dva-leyenda { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 4px; font: 400 13px/1.2 var(--texto); color: rgba(239, 230, 207, 0.7); }
.dva-leyenda span { display: inline-flex; align-items: center; gap: 6px; }
.dva-leyenda i { width: 9px; height: 9px; border-radius: 2px; }
.dva-pie { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 0 0; font: 400 13px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); text-align: center; }
.dva-pie svg.as-marca-chica { width: 20px; height: 20px; }
/* Sin vincular: la invitación, con la marca de Ascent. */
.pg-carta.dva-invita { gap: 10px; padding: 20px 18px 16px; }
.dva-invita-marca { display: block; width: 52px; height: 52px; margin-bottom: 4px; }
.dva-invita-marca svg { width: 100%; height: 100%; }
.dva-invita ul { list-style: none; margin: 6px 0; padding: 0; display: grid; gap: 11px; }
.dva-invita li { display: grid; grid-template-columns: 22px 1fr; align-items: center; gap: 12px; font: 400 14.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.86); }
.dva-invita li svg { width: 21px; height: 21px; color: rgba(239, 230, 207, 0.6); stroke-width: 1.5; }
.dva-boton { appearance: none; cursor: pointer; min-height: 50px; margin-top: 8px; border: 0; border-radius: 14px; background: var(--oro); color: #1a1406; font: 500 15.5px/1 var(--texto); transition: transform 0.15s, background 0.2s; }
.dva-boton:active { transform: scale(0.98); background: var(--oro-claro); }
.dva-invita .dva-enlace { justify-self: center; }
/* «Fuerza» como un título más, al final de Progreso. */
.dva-bloque { margin-top: 34px; }
.dva-seccion { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; padding: 0 2px 4px; }
.dva-seccion h3 { margin: 0; font: 500 24px/1 var(--numeros); letter-spacing: -0.01em; }
.dva-con-ascent { display: inline-flex; align-items: center; gap: 7px; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.62); }
.dva-con-ascent svg.as-marca-chica { width: 22px; height: 22px; }
.pagina-app .dva-bloque svg.as-marca-chica { stroke: none !important; }

/* Su propia pestaña: la tira de secciones, el velo propio y la barra dibujada. */
.dva-tira { position: absolute; inset: 0; overflow: hidden; }
.dva-pagina { position: absolute; inset: 0; }
.dva-pagina > .pagina-app { z-index: 1; }
.dva-fuerza { position: absolute; inset: 0; color: var(--tinta); }
.dva-fuerza::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--pestanas) + 40px); background: linear-gradient(180deg, rgba(3, 5, 12, 0), rgba(3, 5, 12, 0.85) 75%); pointer-events: none; z-index: 1; }
.dva-fuerza .pg-cab .dva-con-ascent { position: absolute; right: 0; bottom: 2px; }
.dva-pantalla .dva-barra { z-index: 5; }
.dva-barra > button.dva-quieta { cursor: default; }
/* Perfil, en un botón redondo con la inicial, arriba a la derecha de Inicio; la energía se corre a su izquierda. */
.dva-con-yo .in-energia-boton { right: 44px; }
.dva-yo { position: absolute; right: -6px; top: -2px; width: 48px; height: 48px; display: grid; place-items: center; padding: 0; border: 0; background: none; cursor: pointer; }
.dva-yo span { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; background: rgba(239, 230, 207, 0.1); border: 1px solid rgba(239, 230, 207, 0.22); font: 500 16px/1 var(--numeros); color: var(--tinta); transition: transform 0.15s, background 0.2s; }
.dva-yo:active span { transform: scale(0.92); background: rgba(239, 230, 207, 0.16); }
.dva-perfil { position: absolute; inset: 0; z-index: 4; background: rgba(3, 5, 12, 0.64); }
.dva-perfil .pf-scroll { padding-top: calc(var(--arriba) + 44px); }
.dva-volver { position: absolute; z-index: 3; left: 6px; top: calc(var(--arriba) - 6px); min-height: 44px; display: inline-flex; align-items: center; gap: 2px; padding: 0 12px 0 4px; border: 0; background: none; cursor: pointer; color: var(--oro-claro); font: 400 15.5px/1 var(--texto); }
.dva-volver svg { width: 24px; height: 24px; }
@media (prefers-reduced-motion: reduce) {
  .dva-vista, .dva-carta, .dva-meta-barra i { animation: none; }
  .tel.dva-tapa > .pagina-app, .tel.dva-tapa > .as-techo, .tel.dva-tapa-barra > .pestanas, .dva-boton, .dva-yo span { transition: none; }
}
`;

Galeria.propuesta({
  id: 'dondeViveAscent',
  titulo: 'Dónde vive Ascent',
  texto: 'Lo mismo de Ascent en tres lugares. <b>Arriba de Progreso</b> (como hoy) no estorba, pero hay que saber que está; <b>dentro de Progreso</b> junta todo tu progreso en un lugar, pero Progreso crece; <b>en su propia pestaña</b> se ve sin buscar, pero Perfil pasa a un botón arriba en Inicio y la barra queda llena.',
  vistas: [['hoy', 'Como hoy: arriba de Progreso'], ['enProgreso', 'Dentro de Progreso'], ['enProgresoScroll', 'Dentro de Progreso, en un solo scroll'], ['pestana', 'Su propia pestaña']],
  principal: 1,
  mas: [['enProgresoSinVincular', 'Dentro de Progreso, sin vincular'], ['pestanaSinVincular', 'Sin vincular, la barra de siempre'], ['en', 'Dentro de Progreso, en inglés']],
  crear(g) {
    const M = window.AscentDeMentira;
    const u = Util.crear(g.opciones);
    const { el, boton, tx, numero } = u;
    const tel = g.tel;
    const ascent = g.secciones.ascent;
    g.estilo('dva-estilo', CSS);

    // ------------------------------------------------------------ los textos de la propuesta
    const propio = (clave, idioma) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), T[idioma]);
    const conVars = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
    const tr = (clave, vars) => conVars(propio(clave, g.idioma) ?? propio(clave, 'es'), vars);
    const trPlural = (clave, n, vars) => { const f = propio(clave, g.idioma) || propio(clave, 'es'); return conVars(n === 1 ? f.uno : f.otros, Object.assign({ n }, vars)); };
    const escapar = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const quieto = () => g.movimientoReducido || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fechaDeHoy = () => { const h = u.partes(Datos.HOY); return tx('cielo.fecha', { dia: tx('fecha.dias.' + h.dia), num: h.num, mes: tx('fecha.mesesCortos.' + h.mes) }); };
    const nombreDe = (n) => (n === 'fuerza' ? tr('fuerza') : tx('pestanas.' + n));
    const marcaUnida = (svg) => svg.replace(/class="(as-marca(?:-chica)?)"/, 'class="$1 unida"');

    const s = { vista: null, abierta: false, antes: null, idiomaEn: null, alVolver: null, espera: 0, mirar: 0, seVinculo: false, porLaBarra: -1e9, aPorQue: false };
    // Lo de Ascent se ve vinculado en todas, salvo en las dos «sin vincular» (hasta vincular desde la invitación).
    const conAscent = () => !/SinVincular$/.test(s.vista || '') || s.seVinculo;

    // ------------------------------------------------------------ Progreso otra vez, sin la entrada de Ascent
    // «Cuerpo», el solo scroll y la pestaña Progreso usan esta copia; lo del plan no se cambia desde acá.
    let modoProgreso = null;
    const progreso = SeccionProgreso.crear(el('div'), Object.assign({}, g.opciones, {
      comida: g.secciones.comida,
      persona: g.persona,
      metaDeMoss: () => g.secciones.comida.meta,
      ponerEstrategia() {},
      ponerMeta() {},
      registrarPeso() {},
      medir() {},
      sinDeficit: () => !!(g.secciones.perfil && g.secciones.perfil.sinDeficit),
      asomoDeAscent: () => (modoProgreso === 'scroll' ? bloqueDeFuerza() : null),
    }));
    const pgScroll = progreso.zona.querySelector('.pg-scroll');
    Detalles.franja(progreso.zona, pgScroll);

    const pCon = g.pantalla('dva-pantalla dva-con', { conBarra: true });
    const pSin = g.pantalla('dva-pantalla dva-sin');

    // ------------------------------------------------------------ Fuerza: lo de Ascent en cartas de Progreso
    function carta(i, titulo, derecha, clase) {
      const c = el('article', 'pg-carta dva-carta ' + (clase || ''));
      c.style.setProperty('--i', i);
      const cab = el('header', 'pg-carta-cab');
      cab.appendChild(el('span', 'pg-carta-titulo', titulo));
      if (derecha) cab.appendChild(el('span', 'dva-derecha', derecha));
      c.appendChild(cab);
      return c;
    }
    function cartaHoy(d, i) {
      const derecha = d.sesion ? d.hoy.linea : d.siguiente ? d.siguiente.linea : null;
      const c = carta(i, tr('hoy'), derecha, 'dva-hoy');
      c.append(el('div', 'pg-plan-titulo', d.hoy.corto), el('div', 'pg-plan-para', d.hoy.titulo));
      const a = d.aviso;
      if (!a) { c.appendChild(el('p', 'pg-texto', d.hoy.texto)); return c; }
      const fila = el('div', 'dva-aviso ' + a.nivel);
      const disco = el('i');
      disco.innerHTML = M.fase(a.paso);
      fila.append(disco, el('b', null, a.musculosTexto), el('span', null, a.listo));
      c.append(el('div', 'dva-linea'), fila, el('p', 'pg-texto', `${a.hecho} ${a.estimacion}`), el('p', 'dva-hacer', a.queHacer));
      return c;
    }
    function cartaSemana(d, i) {
      const w = d.semana;
      const c = carta(i, w.titulo, trPlural('entrenamientos', w.previstas, { n: w.hechas, de: w.previstas }), 'dva-semana-carta');
      const fila = el('div', 'dva-semana');
      const figuras = el('div', 'dva-figuras');
      const estados = M.estadosDe(d, 'semana');
      figuras.innerHTML = M.figura('frente', estados) + M.figura('espalda', estados);
      figuras.setAttribute('role', 'img');
      figuras.setAttribute('aria-label', w.resumen);
      const sale = el('div', 'dva-sale');
      // Lo que se sale, una cosa por línea («A 5 les faltan series», «2 sin entrenar»).
      const resumen = el('div', 'dva-sale-resumen');
      w.resumen.split(' · ').forEach((parte) => resumen.appendChild(el('span', null, parte)));
      sale.appendChild(resumen);
      const lista = el('ul');
      w.destacados.slice(0, 3).forEach((id) => {
        const m = d.musculos.find((x) => x.id === id);
        if (!m) return;
        const fatigado = !!(m.fatiga && m.fatiga.dias > 0);
        const li = el('li', fatigado ? 'fatigado' : '');
        li.append(el('i', 'dva-muestra ' + m.estado + (fatigado ? ' fatigado' : '')), el('span', null, m.nombre), el('em', null, fatigado ? m.fatiga.nombre : m.estadoTexto));
        lista.appendChild(li);
      });
      sale.appendChild(lista);
      fila.append(figuras, sale);
      c.appendChild(fila);
      return c;
    }
    function cartaFuerza(d, i) {
      const f = d.fuerza;
      const c = carta(i, f.titulo, f.semanas, 'dva-fuerza-carta');
      if (f.vacio) { c.appendChild(el('p', 'pg-texto', f.vacio)); return c; }
      c.appendChild(el('div', 'pg-plan-titulo', trPlural('suben', f.cuentas.sube || 0, { de: f.ejercicios.length })));
      const lista = el('ul', 'dva-ejercicios');
      f.ejercicios.forEach((e) => {
        const li = el('li', e.estado);
        const textos = el('div');
        let dato = e.veredicto;
        if (e.estado === 'sinSubidaClara' && e.sinMarcaTexto) dato += ' · ' + e.sinMarcaTexto;
        if (e.estado === 'noSeSabe') dato += ' · ' + e.dato;
        textos.append(el('b', null, e.nombre), el('span', null, dato));
        const chispa = el('div');
        chispa.innerHTML = M.chispa(e);
        li.append(textos, chispa);
        lista.appendChild(li);
      });
      c.appendChild(lista);
      const id = f.estancados.lista[0] || f.bajaron.lista[0] || (f.ejercicios.find((e) => e.estado !== 'sube') || {}).id;
      if (id && window.PorQueNoMejoro) c.appendChild(boton('cm-enlace dva-enlace', `<span>${escapar(tr('porQue'))}</span>${Util.icono('adelante')}`, () => porQueNoMejoro(id)));
      return c;
    }
    // El estado de una meta en una línea: lo de hoy y cuándo llega, o por qué todavía no se sabe.
    function notaDeMeta(m) {
      if (m.estado === 'enCamino') return m.linea;
      if (m.estado === 'noSube' && m.estadoTexto) {
        const t = m.estadoTexto.slice(m.estadoTexto.indexOf(':') + 1).trim();
        const corto = t.split('. ')[0].replace(/\.$/, '');
        return `${m.hoy} · ${corto}`;
      }
      return [m.hoy, m.falta].filter(Boolean).join(' · ');
    }
    function cartaMetas(d, i) {
      const c = carta(i, d.metas.titulo, null, 'dva-metas-carta');
      if (!d.metas.lista.length) { c.appendChild(el('p', 'pg-texto', d.metas.ninguna)); return c; }
      const lista = el('div', 'dva-metas');
      d.metas.lista.forEach((m) => {
        const caja = el('div', 'dva-meta');
        const cab = el('div', 'dva-meta-cab');
        cab.append(el('b', null, `${m.nombre} · ${numero(m.kilos, m.kilos % 1 ? 1 : 0)} kg${m.reps > 1 ? ' × ' + m.reps : ''}`), el('em', 'dva-estado ' + m.estado, tr('estados.' + m.estado)));
        const barra = el('div', 'dva-meta-barra');
        const lleno = el('i');
        lleno.style.setProperty('--a', (m.avance || 0).toFixed(3));
        barra.appendChild(lleno);
        caja.append(cab, barra, el('div', 'dva-meta-nota', notaDeMeta(m)));
        lista.appendChild(caja);
      });
      c.appendChild(lista);
      if (d.metas.comer) c.appendChild(el('p', 'pg-texto', d.metas.comer));
      return c;
    }
    function cartaAnio(d, i) {
      const a = d.anio;
      const c = carta(i, a.titulo, a.derecha, 'dva-anio');
      const mapa = el('div', 'dva-anio-mapa');
      mapa.innerHTML = M.mapaDelAnio(a);
      mapa.setAttribute('role', 'img');
      mapa.setAttribute('aria-label', a.mapa);
      const leyenda = el('div', 'dva-leyenda');
      a.leyenda.filter((x) => x.color).forEach((x) => {
        const n = el('span');
        const muestra = el('i');
        muestra.style.background = x.color;
        n.append(muestra, document.createTextNode(x.nombre));
        leyenda.appendChild(n);
      });
      c.append(mapa, el('p', 'pg-texto', a.mapa), leyenda);
      return c;
    }
    function pie() {
      const p = el('p', 'dva-pie');
      p.innerHTML = marcaUnida(M.marcaChica);
      p.appendChild(el('span', null, tx('ascent.desvincular')));
      return p;
    }
    function invitacion() {
      const c = carta(0, tr('fuerza'), null, 'dva-invita');
      const marca = el('span', 'dva-invita-marca');
      marca.innerHTML = M.marca;
      c.append(marca, el('div', 'pg-plan-titulo', tr('invita.titulo')), el('p', 'pg-texto', tx('ascent.bajada')));
      const lista = el('ul');
      const iconos = ['pesa', 'perfil', 'progreso', 'objetivo'];
      (propio('invita.lista', g.idioma) || propio('invita.lista', 'es')).forEach((t, i) => {
        const li = el('li');
        li.innerHTML = Util.icono(iconos[i]);
        li.appendChild(el('span', null, t));
        lista.appendChild(li);
      });
      c.append(lista, boton('dva-boton', escapar(tx('ascent.vincular')), () => vincularDesdeLaInvitacion()), boton('cm-enlace dva-enlace', escapar(tx('ascent.conseguir')), () => {}));
      return c;
    }
    /** Lo de Fuerza, de arriba abajo: vinculada, las cinco cartas; sin vincular, la invitación. */
    function contenidoDeFuerza() {
      if (!conAscent()) {
        const p = el('p', 'dva-pie', M.frases().queEsAscent);
        return [invitacion(), p];
      }
      const d = M.dia('cargado');
      return [cartaHoy(d, 0), cartaSemana(d, 1), cartaFuerza(d, 2), cartaMetas(d, 3), cartaAnio(d, 4), pie()];
    }
    function conAscentChico() {
      const n = el('span', 'dva-con-ascent');
      n.innerHTML = marcaUnida(M.marcaChica);
      n.appendChild(el('span', null, tr('conAscent')));
      return n;
    }
    /** Al final de Progreso, en un solo scroll: «Fuerza» como un título más. */
    function bloqueDeFuerza() {
      const b = el('section', 'dva-bloque as-vars');
      const cab = el('header', 'dva-seccion');
      cab.appendChild(el('h3', null, tr('fuerza')));
      if (conAscent()) cab.appendChild(conAscentChico());
      b.appendChild(cab);
      contenidoDeFuerza().forEach((n) => b.appendChild(n));
      return b;
    }

    // ------------------------------------------------------------ lo que se desliza de costado
    /** Una tira de páginas: las dos partes de Progreso o las pestañas. `pintar(k)` con k en páginas. */
    function crearTira(o) {
      let k = o.inicio || 0;
      let animacion = 0;
      const t = {
        get k() { return k; },
        get moviendo() { return !!animacion; },
        parar() { cancelAnimationFrame(animacion); animacion = 0; },
        poner(v) { k = v; o.pintar(k); },
        ir(i, deUna) {
          t.parar();
          const desde = k;
          if (deUna || quieto() || Math.abs(desde - i) < 0.001) { k = i; o.pintar(k); o.alLlegar(i); return; }
          const t0 = performance.now();
          const paso = (ahora) => {
            const x = Math.min(1, (ahora - t0) / VIAJE_MS);
            k = desde + (i - desde) * curva(x);
            o.pintar(k);
            if (x < 1) animacion = requestAnimationFrame(paso);
            else { animacion = 0; o.alLlegar(i); }
          };
          animacion = requestAnimationFrame(paso);
        },
        arrastrar(desde, dx) {
          const vecina = o.vecina(desde, dx < 0 ? 1 : -1);
          let corrida = -dx / o.ancho();
          if (vecina === null) corrida *= CEDE;
          t.poner(desde + Math.max(-1, Math.min(1, corrida)));
        },
        soltar(desde, dx, v) {
          const vecina = o.vecina(desde, dx < 0 ? 1 : -1);
          const lejos = Math.abs(dx) >= o.ancho() * UMBRAL;
          const rapido = dx < 0 ? v <= -VELOCIDAD_MIN : v >= VELOCIDAD_MIN;
          t.ir(vecina !== null && (lejos || rapido) ? vecina : desde);
        },
        antes: o.antes || (() => {}),
      };
      return t;
    }

    // ------------------------------------------------------------ dentro de Progreso, con el selector
    let sel = null;
    function montarSelector(inicial, volver) {
      const v = el('div', 'dva-vista dva-selectora');
      const cab = el('header', 'dva-cab');
      const titulos = el('div', 'dva-titulos');
      titulos.append(el('div', 'pg-fecha', fechaDeHoy()), el('h2', 'pg-titulo', tx('progreso.titulo')));
      const selector = el('div', 'dva-selector');
      selector.setAttribute('role', 'tablist');
      selector.setAttribute('aria-label', tr('selector'));
      const pulgar = el('i');
      pulgar.setAttribute('aria-hidden', 'true');
      const botones = ['cuerpo', 'fuerza'].map((clave, i) => {
        const b = boton('dva-segmento', escapar(tr(clave)), () => irASegmento(i));
        b.setAttribute('role', 'tab');
        return b;
      });
      selector.append(pulgar, ...botones);
      cab.append(titulos, selector);
      const pistas = el('div', 'dva-pistas');
      const panelCuerpo = el('div', 'dva-panel');
      panelCuerpo.appendChild(progreso.zona);
      const panelFuerza = el('div', 'dva-panel as-vars');
      const fScroll = el('div', 'dva-scroll');
      contenidoDeFuerza().forEach((n) => fScroll.appendChild(n));
      panelFuerza.appendChild(fScroll);
      pistas.append(panelCuerpo, panelFuerza);
      v.append(pistas, cab);
      sel = { v, cab, titulos, selector, pulgar, botones, paneles: [panelCuerpo, panelFuerza], scrolls: [pgScroll, fScroll], c: 0, C: 1, fScroll };
      sel.tira = crearTira({
        inicio: inicial,
        ancho: () => v.clientWidth || tel.clientWidth || 1,
        vecina: (i, d) => (i + d >= 0 && i + d <= 1 ? i + d : null),
        pintar: pintarSelector,
        alLlegar: (i) => llegarSegmento(i, true),
        antes: (desde) => sincronizarCab(1 - desde),
      });
      fScroll.addEventListener('scroll', () => alDesplazar(1), { passive: true });
      pCon.el.replaceChildren(v);
      pCon.abrir();
      progreso.pintar();
      medirCab();
      pintarSelector(inicial);
      llegarSegmento(inicial);
      if (volver) { sel.scrolls[inicial].scrollTop = volver.scroll; ponerCab(volver.scroll); }
    }
    // La cabecera mide distinto según el idioma y el teléfono: el alto va a las dos partes y el título se va al bajar.
    function medirCab() {
      if (!sel) return;
      const arriba = parseFloat(getComputedStyle(sel.cab).paddingTop) || 0;
      sel.C = Math.max(1, sel.selector.offsetTop - arriba);
      sel.v.style.setProperty('--dva-cab', `${sel.cab.offsetHeight + 4}px`);
    }
    function ponerCab(y) {
      const c = Math.max(0, Math.min(sel.C, y));
      sel.c = c;
      sel.cab.style.transform = c ? `translateY(${(-c).toFixed(1)}px)` : '';
      sel.titulos.style.opacity = Math.max(0, 1 - c / (sel.C * 0.7)).toFixed(3);
      sel.cab.style.setProperty('--dva-k', (c / sel.C).toFixed(3));
    }
    function alDesplazar(i) {
      if (!sel || modoProgreso !== 'selector' || sel.tira.moviendo || (gesto && gesto.decidido)) return;
      if (Math.round(sel.tira.k) === i) ponerCab(sel.scrolls[i].scrollTop);
    }
    pgScroll.addEventListener('scroll', () => alDesplazar(0), { passive: true });
    // La otra parte queda a la misma altura de la cabecera: así el selector no salta al cambiar.
    function sincronizarCab(i) {
      const sc = sel.scrolls[i];
      if (sel.c < sel.C - 0.5) sc.scrollTop = sel.c;
      else if (sc.scrollTop < sel.C) sc.scrollTop = sel.C;
    }
    function pintarSelector(k) {
      const w = sel.v.clientWidth || tel.clientWidth || 1;
      sel.paneles.forEach((p, i) => {
        p.style.translate = `${((i - k) * w).toFixed(1)}px 0`;
        p.style.visibility = Math.abs(i - k) >= 1 ? 'hidden' : '';
      });
      sel.pulgar.style.transform = `translateX(${(k * 100).toFixed(2)}%)`;
      sel.botones.forEach((b, i) => { b.style.color = `rgba(239, 230, 207, ${(0.55 + 0.45 * Math.max(0, 1 - Math.abs(k - i))).toFixed(3)})`; });
    }
    function llegarSegmento(i, alMoverse) {
      s.seg = i;
      sel.botones.forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
      sel.paneles.forEach((p, j) => { p.inert = j !== i; });
      const antes = { c: sel.c, titulos: sel.titulos.style.opacity || '1' };
      ponerCab(sel.scrolls[i].scrollTop);
      // La parte a la que se llegó no da para bajar tanto (Fuerza sin vincular entra entera): el título vuelve deslizándose.
      if (alMoverse && Math.abs(sel.c - antes.c) > 1 && !quieto()) {
        const o = { duration: VIAJE_MS, easing: CURVA };
        sel.cab.animate([{ transform: `translateY(${-antes.c}px)` }, { transform: `translateY(${-sel.c}px)` }], o);
        sel.cab.animate([{ opacity: antes.c / sel.C }, { opacity: sel.c / sel.C }], Object.assign({ pseudoElement: '::before' }, o));
        sel.titulos.animate([{ opacity: antes.titulos }, { opacity: sel.titulos.style.opacity }], o);
      }
    }
    function irASegmento(i) {
      if (!sel || Math.round(sel.tira.k) === i) return;
      sincronizarCab(i);
      sel.tira.ir(i);
    }

    // ------------------------------------------------------------ dentro de Progreso, en un solo scroll
    function montarScroll(volver) {
      const v = el('div', 'dva-vista dva-unscroll');
      v.appendChild(progreso.zona);
      pCon.el.replaceChildren(v);
      pCon.abrir();
      progreso.pintar();
      pgScroll.scrollTop = volver ? volver.scroll : 0;
    }

    // ------------------------------------------------------------ su propia pestaña
    /** Una sección de verdad, quieta: sin ids ni inert, con su franja y lo dibujado en sus lienzos. */
    function copia(zona, scrollSel) {
      const c = zona.cloneNode(true);
      c.removeAttribute('inert');
      ['translate', 'visibility', 'transform', 'opacity'].forEach((p) => c.style.removeProperty(p));
      c.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      c.querySelectorAll('[inert]').forEach((n) => n.removeAttribute('inert'));
      c.querySelectorAll('.dt-franja').forEach((n) => n.remove());
      const originales = zona.querySelectorAll('canvas');
      c.querySelectorAll('canvas').forEach((lienzo, i) => {
        const o = originales[i];
        if (!o || !o.width) return;
        lienzo.width = o.width;
        lienzo.height = o.height;
        try { lienzo.getContext('2d').drawImage(o, 0, 0); } catch (_) { /* un lienzo sin dibujo queda vacío */ }
      });
      Detalles.franja(c, c.querySelector(scrollSel));
      return c;
    }
    let tira = null;
    const SCROLLS = '.in-scroll, .cm-scroll, .pg-scroll, .sn-scroll, .pf-scroll, .dva-scroll';
    function montarPestana(conFuerza, inicial) {
      const nombres = conFuerza ? ['inicio', 'comida', 'fuerza', 'progreso', 'sueno', 'habitos'] : ['inicio', 'comida', 'progreso', 'sueno', 'habitos', 'perfil'];
      const velo = el('div', 'velo-pestanas dva-velo');
      velo.innerHTML = '<i></i><i class="velo-sueno"></i>';
      const tiraEl = el('div', 'dva-tira');
      const paginas = nombres.map((n) => {
        const nodo = paginaDe(n, conFuerza);
        if (!nodo) return null;
        const p = el('div', 'dva-pagina dva-pagina-' + n);
        p.appendChild(nodo);
        tiraEl.appendChild(p);
        return p;
      });
      const barra = el('nav', 'pestanas dva-barra');
      barra.setAttribute('role', 'tablist');
      const capa = (n, luz) => `<span class="pt-capa${luz ? ' pt-luz' : ''}"${luz ? ' aria-hidden="true"' : ''}>${Util.icono(n === 'fuerza' ? 'pesa' : n)}<span class="pt-nombre">${escapar(nombreDe(n))}</span></span>`;
      const botones = nombres.map((n, i) => {
        const b = el('button', 'dva-pt dva-pt-' + n + (paginas[i] ? '' : ' dva-quieta'));
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.setAttribute('aria-label', nombreDe(n));
        b.innerHTML = capa(n, false) + capa(n, true);
        b.addEventListener('click', () => irAPestana(i));
        return b;
      });
      const mas = el('button', 'pt-mas');
      mas.type = 'button';
      mas.innerHTML = `<span>${Util.icono('mas')}</span>`;
      mas.setAttribute('aria-label', tx('pestanas.mas'));
      botones.forEach((b, i) => { if (i === 3) barra.appendChild(mas); barra.appendChild(b); });
      tira = { nombres, paginas, velo, barra, botones, perfil: null, pareja: 0 };
      tira.tira = crearTira({
        inicio: inicial,
        ancho: () => pSin.el.clientWidth || tel.clientWidth || 1,
        vecina: (i, d) => (paginas[i + d] ? i + d : null),
        pintar: pintarPestanas,
        alLlegar: llegarPestana,
      });
      pSin.el.replaceChildren(velo, tiraEl, barra);
      pSin.abrir();
      pintarPestanas(inicial);
      llegarPestana(inicial);
    }
    function paginaDe(n, conFuerza) {
      if (n === 'inicio') {
        const c = copia(g.secciones.inicio.zona, '.in-scroll');
        if (conFuerza) {
          ponerYo(c);
          // Recién vinculada, la invitación de Ascent de Inicio todavía se está yendo: en la copia ya no está.
          c.querySelectorAll('.as-invita').forEach((n) => n.remove());
        }
        return c;
      }
      if (n === 'comida') return copia(g.secciones.comida.zona, '.cm-scroll');
      if (n === 'sueno') return copia(g.secciones.sueno.zona, '.sn-scroll');
      if (n === 'perfil') return copia(g.secciones.perfil.zona, '.pf-scroll');
      if (n === 'progreso') { progreso.pintar(); return progreso.zona; }
      if (n === 'fuerza') return paginaDeFuerza();
      return null;
    }
    function paginaDeFuerza() {
      const zona = el('section', 'dva-fuerza as-vars');
      const sc = el('div', 'dva-scroll');
      const cab = el('header', 'pg-cab');
      cab.append(el('div', 'pg-fecha', fechaDeHoy()), el('h2', 'pg-titulo', tr('fuerza')), conAscentChico());
      sc.appendChild(cab);
      contenidoDeFuerza().forEach((n) => sc.appendChild(n));
      zona.appendChild(sc);
      Detalles.franja(zona, sc);
      return zona;
    }
    function ponerYo(c) {
      c.classList.add('dva-con-yo');
      const nombre = Datos.PERFIL.nombre || '';
      const b = boton('dva-yo', `<span>${escapar(nombre.charAt(0).toUpperCase())}</span>`, () => abrirPerfil(b), tr('perfil', { nombre }));
      c.querySelector('.in-cab').appendChild(b);
    }
    function oscuroEn(k) {
      const a = Math.floor(k), b = Math.min(tira.nombres.length - 1, Math.ceil(k));
      const va = VELO[tira.nombres[a]], vb = VELO[tira.nombres[b]];
      return va + (vb - va) * (k - a);
    }
    // Sobre las secciones la barra es pareja; sobre el cielo de Inicio deja ver algo (como la de la galería). Con
    // Perfil arriba (`pareja` en 1), pareja.
    const solida = () => { const s0 = Math.min(1, oscuroEn(tira.tira.k) / 0.7); return s0 + (1 - s0) * tira.pareja; };
    function barraHacia(ms, hasta) {
      const desde = tira.pareja;
      const t0 = performance.now();
      const paso = (ahora) => {
        if (!tira) return;
        const x = Math.min(1, (ahora - t0) / ms);
        tira.pareja = desde + (hasta - desde) * curva(x);
        tira.barra.style.setProperty('--solida', solida().toFixed(3));
        if (x < 1) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
    function pintarPestanas(k) {
      const w = pSin.el.clientWidth || tel.clientWidth || 1;
      tira.paginas.forEach((p, i) => {
        if (!p) return;
        p.style.translate = `${((i - k) * w).toFixed(1)}px 0`;
        // Con Perfil ya crecido encima, Inicio queda oculto: se ve el cielo con el velo de Perfil.
        p.style.visibility = Math.abs(i - k) >= 1 || (i === 0 && tira.perfil && tira.perfil.tapado) ? 'hidden' : '';
      });
      const oscuro = oscuroEn(k);
      tira.velo.firstChild.style.opacity = Math.max(0, 1 - (1 - oscuro) / (1 - VELO_DE_INICIO)).toFixed(3);
      tira.velo.lastChild.style.opacity = Math.max(0, 1 - Math.abs(k - tira.nombres.indexOf('sueno'))).toFixed(3);
      tira.barra.style.setProperty('--solida', solida().toFixed(3));
      tira.botones.forEach((boton, i) => { boton.querySelector('.pt-luz').style.opacity = Math.max(0, 1 - Math.abs(k - i)).toFixed(3); });
    }
    function llegarPestana(i) {
      s.pagina = i;
      tira.botones.forEach((b, j) => b.setAttribute('aria-selected', String(j === i)));
      tira.paginas.forEach((p, j) => { if (p) p.inert = j !== i; });
    }
    function irAPestana(i) {
      if (!tira || !tira.paginas[i]) return;
      const desdePerfil = !!tira.perfil;
      if (desdePerfil) cerrarPerfil();
      if (Math.round(tira.tira.k) !== i) tira.tira.ir(i);
      else if (!desdePerfil) {
        // Tocar otra vez la pestaña sube, como en la app.
        const sc = tira.paginas[i].querySelector(SCROLLS);
        if (sc) sc.scrollTo({ top: 0, behavior: quieto() ? 'auto' : 'smooth' });
      }
    }

    // Perfil crece desde su botón, como una página más de Inicio; «‹ Hoy» lo encoge de vuelta.
    function abrirPerfil(desde, deUna) {
      if (!tira || tira.perfil) return;
      const r = desde.getBoundingClientRect();
      const caja = pSin.el.getBoundingClientRect();
      const cx = r.left + r.width / 2 - caja.left, cy = r.top + r.height / 2 - caja.top;
      const radio = Math.hypot(Math.max(cx, caja.width - cx), Math.max(cy, caja.height - cy));
      const capa = el('section', 'dva-perfil');
      capa.append(copia(g.secciones.perfil.zona, '.pf-scroll'), boton('dva-volver', `${Util.icono('atras')}<span>${escapar(tx('inicio.titulo'))}</span>`, () => cerrarPerfil()));
      pSin.el.insertBefore(capa, tira.barra);
      const inicioPag = tira.paginas[0];
      tira.perfil = { capa, cx, cy, radio, inicioPag };
      // Debajo, Inicio se apaga mientras Perfil crece, y la barra queda pareja como sobre cualquier sección.
      if (deUna || quieto()) { tira.perfil.tapado = true; tira.pareja = 1; pintarPestanas(tira.tira.k); return; }
      capa.animate([{ clipPath: `circle(19px at ${cx}px ${cy}px)` }, { clipPath: `circle(${radio}px at ${cx}px ${cy}px)` }], { duration: 480, easing: CURVA });
      inicioPag.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' })
        .onfinish = () => { if (tira && tira.perfil && tira.perfil.capa === capa) { tira.perfil.tapado = true; inicioPag.style.visibility = 'hidden'; } };
      barraHacia(480, 1);
    }
    function cerrarPerfil() {
      const p = tira && tira.perfil;
      if (!p) return;
      tira.perfil = null;
      p.inicioPag.style.visibility = '';
      p.inicioPag.getAnimations().forEach((a) => a.cancel());
      if (quieto()) { p.capa.remove(); tira.pareja = 0; pintarPestanas(tira.tira.k); return; }
      p.inicioPag.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-in' });
      barraHacia(360, 0);
      p.capa.animate([{ clipPath: `circle(${p.radio}px at ${p.cx}px ${p.cy}px)` }, { clipPath: `circle(19px at ${p.cx}px ${p.cy}px)`, opacity: 0.4 }], { duration: 360, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'forwards' })
        .onfinish = () => p.capa.remove();
    }

    // ------------------------------------------------------------ el dedo
    // La galería mira el dedo en captura sobre .tel para deslizar entre sus secciones: acá se mira antes, en window,
    // y lo que empieza en esta propuesta no le llega. Los click siguen llegando como siempre.
    let gesto = null;
    let finDeArrastre = -1e9;
    const enMia = (n) => (pCon.abierta && pCon.el.contains(n)) || (pSin.abierta && pSin.el.contains(n));
    function tiraBajo(n) {
      if (pCon.abierta && pCon.el.contains(n)) return modoProgreso === 'selector' && sel ? sel.tira : null;
      if (pSin.abierta && pSin.el.contains(n) && tira && !tira.perfil && !n.closest('.dva-barra')) return tira.tira;
      return null;
    }
    window.addEventListener('pointerdown', (ev) => {
      gesto = null;
      if (!enMia(ev.target)) return;
      ev.stopPropagation();
      if (ev.pointerType === 'mouse' && ev.button !== 0) return;
      const t = tiraBajo(ev.target);
      if (t) gesto = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, t0: 0, tira: t, desde: 0 };
    }, true);
    window.addEventListener('pointermove', (ev) => {
      const x = gesto;
      if (!x || ev.pointerId !== x.id) return;
      const dx = ev.clientX - x.x0, dy = ev.clientY - x.y0;
      if (!x.decidido) {
        if (Math.abs(dy) >= DECIDE_PX && Math.abs(dy) > Math.abs(dx)) { gesto = null; return; }
        if (Math.abs(dx) < DECIDE_PX || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        x.decidido = true;
        x.t0 = performance.now();
        x.tira.parar();
        x.desde = Math.round(x.tira.k);
        x.tira.antes(x.desde);
        try { (pCon.abierta ? pCon.el : pSin.el).setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual anda */ }
      }
      ev.stopPropagation();
      ev.preventDefault();
      x.tira.arrastrar(x.desde, dx);
    }, true);
    const soltar = (ev) => {
      const x = gesto;
      if (!x || ev.pointerId !== x.id) return;
      gesto = null;
      if (!x.decidido) return;
      ev.stopPropagation();
      finDeArrastre = performance.now();
      if (ev.type === 'pointercancel') { x.tira.ir(x.desde); return; }
      const dx = ev.clientX - x.x0;
      x.tira.soltar(x.desde, dx, dx / Math.max(1, performance.now() - x.t0));
    };
    window.addEventListener('pointerup', soltar, true);
    window.addEventListener('pointercancel', soltar, true);
    // El click que llega después de arrastrar no es un toque.
    window.addEventListener('click', (ev) => {
      if (performance.now() - finDeArrastre < 400 && enMia(ev.target)) { ev.stopImmediatePropagation(); ev.preventDefault(); }
      // Tocar la barra de verdad cierra la propuesta y va a esa sección: al cerrar, no se vuelve a la de antes.
      if (ev.target.closest && ev.target.closest('.pestanas') && !ev.target.closest('.dva-barra')) s.porLaBarra = performance.now();
    }, true);
    new ResizeObserver(() => {
      if (sel && pCon.abierta && modoProgreso === 'selector') { medirCab(); pintarSelector(sel.tira.k); ponerCab(sel.scrolls[Math.round(sel.tira.k)].scrollTop); }
      if (tira && pSin.abierta) pintarPestanas(tira.tira.k);
    }).observe(tel);

    // ------------------------------------------------------------ ir y volver
    const altura = () => (modoProgreso === 'selector' && sel ? sel.scrolls[s.seg].scrollTop
      : modoProgreso === 'scroll' ? pgScroll.scrollTop
        : tira ? (tira.paginas[s.pagina].querySelector(SCROLLS) || {}).scrollTop || 0 : 0);
    function porQueNoMejoro(id) {
      // Lo de antes de abrir la propuesta viaja con la vuelta: mientras, se queda vinculada y en Progreso (de ahí
      // sale «¿Por qué no estás mejorando?»), y al volver de ella se sigue como estaba.
      const ida = { vista: s.vista, seg: s.seg, pagina: s.pagina, scroll: altura(), antes: s.antes, seVinculo: s.seVinculo };
      s.alVolver = ida;
      s.aPorQue = true;
      window.PorQueNoMejoro.abrir(id);
      s.aPorQue = false;
      // Si esa pantalla se cierra por otro lado (una pestaña, otro botón) sin volver acá, esta se cerró de verdad:
      // vuelven el idioma y el vínculo de antes, salvo que ya haya otra propuesta abierta (la sección queda en Progreso).
      const otra = tel.querySelector('.pr-pantalla.pqn');
      if (!otra) return;
      const mira = new MutationObserver(() => {
        if (!otra.hidden) return;
        mira.disconnect();
        setTimeout(() => {
          if (s.abierta || s.alVolver !== ida) return;
          s.alVolver = null;
          s.idiomaEn = null;
          if (document.querySelector('[data-propuesta][aria-pressed="true"]')) return;
          if (g.idioma !== ida.antes.idioma) ponerIdioma(ida.antes.idioma);
          if (ascent.vinculada !== ida.antes.vinculada) g.vincular(ida.antes.vinculada);
        }, 0);
      });
      mira.observe(otra, { attributes: true, attributeFilter: ['hidden'] });
    }
    // Vincular desde la invitación abre la hoja de verdad; al vincular, Fuerza se llena ahí mismo.
    function vincularDesdeLaInvitacion() {
      ascent.abrirVincular();
      clearInterval(s.mirar);
      s.mirar = setInterval(() => {
        if (!ascent.vinculada || conAscent()) return;
        clearInterval(s.mirar);
        s.seVinculo = true;
        repintarFuerza();
      }, 400);
    }
    function repintarFuerza() {
      if (modoProgreso === 'selector' && sel) {
        const sc = sel.fScroll;
        sc.replaceChildren(...contenidoDeFuerza());
        sc.scrollTop = Math.min(sc.scrollTop, sel.c);
      } else if (modoProgreso === 'scroll') progreso.pintar();
    }
    function repintar() {
      if (!s.abierta || !s.vista || s.vista === 'hoy') return;
      // En el idioma nuevo, donde estaba: la parte o la página, la altura y Perfil abierto.
      s.alVolver = { vista: s.vista, seg: s.seg, pagina: s.pagina, scroll: altura(), perfil: !!(tira && tira.perfil) };
      api.abrir(s.vista);
    }
    // El idioma se cambia también desde el panel de la galería, con la propuesta abierta (no cuando lo cambia ella).
    let idiomaPropio = false;
    const ponerIdioma = (i) => { idiomaPropio = true; window.__idioma(i); idiomaPropio = false; };
    document.querySelectorAll('#s-idioma').forEach((n) => n.addEventListener('click', () => { if (!idiomaPropio) setTimeout(repintar, 0); }));

    /** Lo de la vista que se deja: esperas, el idioma de «en inglés» y Perfil abierto. `sigue`: se rearma donde estaba. */
    function salirDeLaVista(nueva, sigue) {
      clearTimeout(s.espera);
      // Un dedo que seguía arrastrando ya no mueve nada: su tira se rearma o se va.
      gesto = null;
      // Rearmada (otro idioma), lo vinculado desde la invitación sigue y la hoja de vincular sigue mirada.
      if (!sigue) { s.seVinculo = false; clearInterval(s.mirar); }
      if (s.idiomaEn && nueva !== 'en' && !s.aPorQue) { const i = s.idiomaEn; s.idiomaEn = null; if (g.idioma !== i) ponerIdioma(i); }
      // Perfil se va con su pantalla, que se desvanece (o se rearma): no se saca de golpe.
      if (tira) tira.perfil = null;
    }
    function verHoy(arg) {
      pCon.cerrar();
      pSin.cerrar();
      modoProgreso = null;
      tel.classList.remove('dva-tapa', 'dva-tapa-barra');
      if (ascent.ocupada) ascent.cerrar(true);
      g.secciones.progreso.verPrincipal();
      g.secciones.progreso.subir();
      if (arg === 'medio') { g.irA(2, true); ascent.arrastrar(0.45); return; }
      if (arg === 'arriba') { g.irA(2, true); return; }
      // Primero Progreso y su entrada; después Ascent baja desde arriba, como al deslizar.
      const llegando = g.pestana !== 2;
      g.irA(2);
      s.espera = setTimeout(() => { if (s.vista === 'hoy' && !ascent.ocupada) ascent.abrir(); }, llegando ? 900 : 600);
    }
    function verEnProgreso(modo, arg, volver) {
      pSin.cerrar();
      tel.classList.add('dva-tapa');
      tel.classList.remove('dva-tapa-barra');
      if (ascent.ocupada) ascent.cerrar();
      if (g.pestana !== 2) g.irA(2);
      modoProgreso = modo;
      if (modo === 'scroll') { sel = null; montarScroll(volver); return; }
      montarSelector(volver ? volver.seg : arg === 'cuerpo' ? 0 : 1, volver);
    }
    function verPestana(conFuerza, arg, volver) {
      pCon.cerrar();
      tel.classList.add('dva-tapa', 'dva-tapa-barra');
      if (ascent.ocupada) ascent.cerrar();
      if (g.pestana !== 0) g.irA(0);
      modoProgreso = 'pestana';
      sel = null;
      const nombres = conFuerza ? ['inicio', 'comida', 'fuerza', 'progreso', 'sueno', 'habitos'] : ['inicio', 'comida', 'progreso', 'sueno', 'habitos', 'perfil'];
      const pedida = nombres.indexOf(arg);
      montarPestana(conFuerza, volver ? volver.pagina : pedida >= 0 ? pedida : conFuerza ? 2 : 0);
      if (volver) {
        const sc = tira.paginas[volver.pagina] && tira.paginas[volver.pagina].querySelector(SCROLLS);
        if (sc) sc.scrollTop = volver.scroll;
        const yo = volver.perfil && tira.paginas[0].querySelector('.dva-yo');
        if (yo) abrirPerfil(yo, true);
      }
    }

    const api = {
      abrir(vista, arg) {
        const vuelta = s.alVolver;
        const volver = vuelta && vuelta.vista === vista && arg === undefined ? vuelta : null;
        s.alVolver = null;
        if (!s.abierta) {
          s.abierta = true;
          // Desde «¿Por qué no estás mejorando?», aunque se vuelva a otra vista, lo de antes es lo de antes de ir.
          s.antes = vuelta && vuelta.antes ? vuelta.antes : { pestana: g.pestana, vinculada: ascent.vinculada, idioma: g.idioma };
        }
        salirDeLaVista(vista, !!volver);
        if (volver && volver.seVinculo) s.seVinculo = true;
        s.vista = vista;
        if (vista === 'en' && g.idioma !== 'en') { s.idiomaEn = g.idioma; ponerIdioma('en'); }
        const vinculada = !/SinVincular$/.test(vista);
        if (ascent.vinculada !== (vinculada || s.seVinculo)) g.vincular(vinculada || s.seVinculo);
        if (vista === 'hoy') return verHoy(arg);
        if (vista === 'pestana' || vista === 'pestanaSinVincular') return verPestana(vinculada, arg, volver);
        return verEnProgreso(vista === 'enProgresoScroll' ? 'scroll' : 'selector', arg, volver);
      },
      cerrar() {
        salirDeLaVista(null);
        s.vista = null;
        s.abierta = false;
        modoProgreso = null;
        pCon.cerrar();
        pSin.cerrar();
        tel.classList.remove('dva-tapa', 'dva-tapa-barra');
        // Por la barra, Ascent la cierra la barra, como en la app: tocando Progreso baja deslizándose.
        const porLaBarra = performance.now() - s.porLaBarra <= 300;
        if (ascent.ocupada && !porLaBarra) ascent.cerrar(true);
        const a = s.antes;
        s.antes = null;
        if (s.aPorQue) { if (g.pestana !== 2) g.irA(2, true); } else if (a) {
          if (g.idioma !== a.idioma) ponerIdioma(a.idioma);
          if (ascent.vinculada !== a.vinculada) g.vincular(a.vinculada);
          if (!porLaBarra && g.pestana !== a.pestana) g.irA(a.pestana, true);
        }
        // Las copias de las secciones no quedan en la página: después, nadie las encuentra por error.
        setTimeout(() => { if (!s.abierta) { pSin.el.replaceChildren(); tira = null; } }, 320);
      },
    };
    return api;
  },
});
