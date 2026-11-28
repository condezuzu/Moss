// La sección de Ascent rehecha, propuesta C (27/11/2026, para aprobar): «En Progreso, con avisos». Toma literal dos
// frases del dueño: «capaz que la parte de Ascent tiene que estar en Progreso, pero no arriba» y que lo de los músculos
// fatigados «sea tipo un aviso». Ascent deja de ser un lugar arriba y se reparte por ritmo:
// - en Progreso, la segunda carta, «Fuerza · con Ascent»: el titular, el aviso si lo hay y el cuerpo chico. Al tocarla
//   crece hasta la pantalla desde su marco (las esquinas pasan de redondas a rectas y las cartas vecinas se apartan y se
//   apagan); «⌄ Progreso» o arrastrar hacia abajo la encoge hacia su lugar;
// - en la página, los avisos primero (como mucho tres, uno por tema; se descartan deslizándolos de costado) y cada
//   parte plegada en una línea con su dibujo, que se despliega en su lugar y empuja lo de abajo;
// - en Inicio, una tarjeta chica debajo de la luna solo cuando algo cambia la sesión de hoy;
// - en el teléfono, un aviso 90 minutos antes de la sesión, solo si algo la cambia.
// La cara es «Luz»: el cuerpo de tu rango queda fuera de cuadro y se ve su luz, por el borde de arriba de la carta y,
// crecida, por arriba de la página; entero, solo en el sello del encabezado.
// Todo lo que muestra sale de window.AscentDeMentira (05-ascent-datos.js): acá no se calcula nada.
//
// Qué es un aviso: lo que cambia lo que haces hoy, en este orden: un músculo de hoy que sigue cargado (o, en chico, que
// todavía se recupera); la noche corta con sesión; lo que igual puede subir cuando algo limita la sesión (un día
// normal, subir es lo de siempre y va en «Hoy»); un músculo de hoy que ya va de más; un ejercicio de hoy sin subida
// clara; y, ya entrenado, cómo fue y la meta que la sesión movió. «Le faltan series» a mitad de semana no es un aviso
// (la semana sigue: va en «Esta semana»). Así, un día normal queda en calma.

const T = {
  es: {
    carta: 'Fuerza · con Ascent',
    pagina: 'Fuerza',
    abrirCarta: 'Fuerza: {titular}. Abrir',
    anoche: 'Anoche, {horas}',
    comoFue: 'Cómo fue: {palabra}',
    llevas: { uno: 'Llevas 1 entrenamiento en Ascent', otros: 'Llevas {n} entrenamientos en Ascent' },
    semana7: 'Tu semana: {dias}',
    dia: { hecho: '{dia}, entrenaste', fuera: '{dia}, entrenaste fuera de tu rutina', toca: '{dia}, {sesion}', hoy: 'hoy, {sesion}', hoyHecho: 'hoy, entrenaste', descanso: '{dia}, descanso' },
    sello: 'Tu rango en Ascent',
    aviso: {
      subir: 'Hoy puedes subir',
      sinCargados: 'No trabajan {lista}.',
      noche: 'Noche corta',
      comoFue: 'Cómo fue tu sesión',
      meta: 'Tu meta de {ejercicio}',
      antes: 'Esta mañana: {antes}.',
      metaCorta: '{ejercicio}: ahora {ventana}',
      pista: 'Desliza un aviso de costado para descartarlo.',
      abrir: 'Ver qué hacer',
      anotado: 'Anotado: te sientes bien.',
    },
    detalle: { pasado: 'Lo que pasó', estima: 'Lo que se estima', hacer: 'Qué hacer hoy', sesion: 'En tu sesión de hoy' },
    partes: { hoy: 'Hoy', manana: 'Mañana' },
    fuerza: {
      sube: { uno: '1 sube', otros: '{n} suben' },
      sinSubidaClara: { uno: '1 sin subida clara', otros: '{n} sin subida clara' },
      bajo: { uno: '1 bajó', otros: '{n} bajaron' },
      noSeSabe: { uno: '1 todavía no se sabe', otros: '{n} todavía no se saben' },
    },
    porQue: '¿Por qué no estás mejorando?',
    metaResumen: '{ejercicio}: {ventana}',
    paraLlegar: 'Para llegar antes',
    tiraEtq: 'Series duras de cada músculo en 7 días, de 0 a 30; lo ideal, de 10 a 20',
    inicio: { noche: { titulo: 'Hoy, {sesion} sin ir al fallo', texto: 'Dormiste {horas}: mantén el peso.' } },
    telefono: { ahora: 'ahora' },
  },
  en: {
    carta: 'Strength · with Ascent',
    pagina: 'Strength',
    abrirCarta: 'Strength: {titular}. Open',
    anoche: 'Last night, {horas}',
    comoFue: 'How it went: {palabra}',
    llevas: { uno: 'You have 1 workout in Ascent', otros: 'You have {n} workouts in Ascent' },
    semana7: 'Your week: {dias}',
    dia: { hecho: '{dia}, trained', fuera: '{dia}, trained outside your routine', toca: '{dia}, {sesion}', hoy: 'today, {sesion}', hoyHecho: 'today, trained', descanso: '{dia}, rest' },
    sello: 'Your rank in Ascent',
    aviso: {
      subir: 'You can go up today',
      sinCargados: 'They don’t work your {lista}.',
      noche: 'Short night',
      comoFue: 'How your session went',
      meta: 'Your {ejercicio} goal',
      antes: 'This morning: {antes}.',
      metaCorta: '{ejercicio}: now {ventana}',
      pista: 'Swipe an alert sideways to dismiss it.',
      abrir: 'See what to do',
      anotado: 'Noted: you feel fine.',
    },
    detalle: { pasado: 'What happened', estima: 'The estimate', hacer: 'What to do today', sesion: 'In today’s session' },
    partes: { hoy: 'Today', manana: 'Tomorrow' },
    fuerza: {
      sube: { uno: '1 going up', otros: '{n} going up' },
      sinSubidaClara: { uno: '1 with no clear increase', otros: '{n} with no clear increase' },
      bajo: { uno: '1 down', otros: '{n} down' },
      noSeSabe: { uno: '1 too early to tell', otros: '{n} too early to tell' },
    },
    porQue: 'Why aren’t you improving?',
    metaResumen: '{ejercicio}: {ventana}',
    paraLlegar: 'To get there sooner',
    tiraEtq: 'Hard sets per muscle in 7 days, from 0 to 30; the ideal, 10 to 20',
    inicio: { noche: { titulo: 'Today, {sesion} with no sets to failure', texto: 'You slept {horas}: keep the weight.' } },
    telefono: { ahora: 'now' },
  },
};

const CSS_APR = `
/* La luz: el color del borde del cuerpo de tu rango (el que pinta la sección de Ascent); del polvo, su violeta. */
.apr-carta, .apr-pagina, .apr-tarjeta, .apr-fila, .apr-bloqueo { --apr-luz: var(--rango-borde-rgb, 196, 194, 186); --apr-fondo: #070a16; --apr-limite: #cb8569; --apr-limite-texto: #e3a58c; --apr-acento: color-mix(in srgb, rgb(var(--apr-luz)) 70%, #fff); --apr-sub: rgba(239, 230, 207, 0.66); --apr-tenue: rgba(239, 230, 207, 0.58); --apr-linea: rgba(239, 230, 207, 0.09); }
.apr-polvo { --apr-luz: 138, 107, 214; }
.apr-ico { fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }

/* ---- la carta en Progreso: de la familia de las de Progreso, con la luz que entra por el borde de arriba */
.pg-carta.apr-carta { position: relative; overflow: hidden; isolation: isolate; cursor: pointer; border-color: rgba(var(--apr-luz), 0.18); transition: transform 0.15s ease, border-color 0.25s ease; -webkit-tap-highlight-color: transparent; }
.pg-carta.apr-carta:active { transform: scale(0.985); }
@media (hover: hover) { .pg-carta.apr-carta:hover { border-color: rgba(var(--apr-luz), 0.32); } }
.apr-carta-luz { position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(115% 120% at 100% -22%, rgba(var(--apr-luz), 0.32), rgba(var(--apr-luz), 0.09) 42%, rgba(var(--apr-luz), 0) 72%); }
.apr-carta-luz::before { content: ''; position: absolute; left: 18%; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, rgba(var(--apr-luz), 0), rgba(var(--apr-luz), 0.9)); }
.apr-carta-cuerpo { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; column-gap: 12px; }
.apr-carta-textos { display: grid; justify-items: start; min-width: 0; }
.apr-carta-titular { font: 500 21px/1.15 var(--numeros); color: var(--tinta); }
.apr-carta-linea { margin-top: 3px; font: 400 13px/1.25 var(--texto); color: rgba(239, 230, 207, 0.6); }
.apr-carta-pie { margin-top: 12px; display: flex; align-items: center; gap: 8px; min-width: 0; font: 400 13.5px/1.3 var(--texto); color: var(--tinta); }
.apr-carta-pie > span:last-child { min-width: 0; }
.apr-carta-pie.limita { color: var(--apr-limite-texto); }
.apr-marca { display: inline-grid; place-items: center; flex: none; width: 12px; height: 12px; color: var(--apr-sub); }
.apr-marca svg { width: 100%; height: 100%; }
.limita .apr-marca, .apr-marca.limita { color: var(--apr-limite); }
.apr-marca.sube { color: var(--apr-acento); }
.apr-hitos-chico { margin-top: 12px; display: grid; gap: 7px; font: 400 13px/1.25 var(--texto); color: var(--apr-sub); }
.apr-hitos-chico i { display: flex; gap: 5px; }
.apr-hitos-chico i b { width: 22px; height: 3px; border-radius: 2px; background: rgba(239, 230, 207, 0.16); }
.apr-hitos-chico i b.alcanzado { background: var(--apr-acento); }

/* El cuerpo chico, de frente y de espalda: lo de hoy en crema, lo cargado en terracota (no depende del rango). */
.apr-figuras { display: flex; gap: 3px; align-items: flex-end; }
.apr-figuras .am-figura { width: 34px; height: 64px; }
.apr-figuras .am-m.hoy, .apr-figuras .am-m.hecho { fill: var(--tinta); fill-opacity: 0.8; }
.apr-figuras .am-m.manana { fill: var(--tinta); fill-opacity: 0.32; }
.apr-figuras .am-m.faltaPoco { fill: var(--apr-limite); fill-opacity: 0.4; }
.apr-figuras .am-m.seRecupera { fill: var(--apr-limite); fill-opacity: 0.62; }
.apr-figuras .am-m.cargado { fill: var(--apr-limite); fill-opacity: 0.95; }
.apr-figuras .am-m.hecho.cargado, .apr-figuras .am-m.hecho.seRecupera { fill: var(--apr-limite); fill-opacity: 0.55; }

/* La semana en siete marcas: entrenado lleno, previsto en aro, descanso en punto; hoy, con la luz. */
.apr-siete { display: grid; grid-template-columns: repeat(7, 26px); gap: 4px; margin-top: 14px; }
.apr-siete span { display: grid; justify-items: center; gap: 6px; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.64); animation: apr-sube 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(0.04s * var(--i, 0)); }
.apr-siete b { font: inherit; }
.apr-siete i { width: 10px; height: 10px; border-radius: 50%; box-sizing: border-box; }
.apr-siete .hecho i { background: var(--tinta); }
.apr-siete .hecho.fuera i { background: rgba(239, 230, 207, 0.5); }
.apr-siete .toca i { border: 1.5px solid rgba(239, 230, 207, 0.55); }
.apr-siete .descanso i { width: 4px; height: 4px; margin: 3px; background: rgba(239, 230, 207, 0.28); }
.apr-siete .hoy { color: var(--tinta); }
.apr-siete .hoy i { border-color: var(--apr-acento); box-shadow: 0 0 0 3px rgba(var(--apr-luz), 0.2), 0 0 12px rgba(var(--apr-luz), 0.75); }
.apr-siete .hoy.hecho i { background: var(--apr-acento); }
.apr-siete .hoy.descanso i { width: 6px; height: 6px; margin: 2px; background: var(--apr-acento); }
.apr-siete.chica { grid-template-columns: repeat(7, 21px); gap: 3px; margin-top: 12px; }
@keyframes apr-sube { from { opacity: 0; transform: translateY(5px); } }

/* Sin vincular: una fila fina, como «Más datos». */
.apr-fila { margin-top: 12px; }
.apr-fila-boton { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: 24px minmax(0, 1fr) 15px; align-items: center; gap: 12px; padding: 13px 16px; border-radius: 18px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(8, 12, 26, 0.5); color: var(--tinta); text-align: left; transition: transform 0.15s ease; }
.apr-fila-boton:active { transform: scale(0.985); }
.apr-fila-boton .as-marca-chica { width: 24px; height: 24px; }
.apr-fila-textos { display: grid; gap: 4px; min-width: 0; }
.apr-fila-textos b { font: 500 15px/1.2 var(--texto); }
.apr-fila-textos span { font: 400 13px/1.3 var(--texto); color: rgba(239, 230, 207, 0.58); }
.apr-fila-boton > svg:last-child { width: 15px; height: 15px; color: rgba(239, 230, 207, 0.45); }

/* Las cartas de Progreso se apartan y se apagan mientras la carta crece. */
.pg-scroll.apr-moviendo > * { transition: transform 0.42s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.42s ease; }
.pg-scroll.apr-apartadas > :not(.apr-carta) { opacity: 0.25; }
.pg-scroll.apr-apartadas > :has(~ .apr-carta) { transform: translateY(-14px); }
.pg-scroll.apr-apartadas > .apr-carta ~ * { transform: translateY(16px); }

/* Mientras la propuesta está abierta, Ascent no está arriba: ni la entrada del encabezado ni el borde del planeta. */
.tel.apr-sin-arriba .as-entrada, .tel.apr-sin-arriba .as-techo { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; transition: opacity 0.3s ease, visibility 0s linear 0.3s !important; }
.tel.apr-vuelve-arriba .as-entrada, .tel.apr-vuelve-arriba .as-techo { transition: opacity 0.4s ease; }

/* ---- la tarjeta chica de Inicio, debajo de la luna (como el control cuando se acerca) */
.in-bloque.apr-tarjeta { position: relative; overflow: hidden; isolation: isolate; border-color: rgba(203, 133, 105, 0.3); }
.apr-tarjeta::before { content: ''; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(70% 140% at 104% 50%, rgba(var(--apr-luz), 0.16), rgba(var(--apr-luz), 0) 70%); }
.apr-tarjeta .in-control-fila > .apr-marca { justify-self: center; width: 14px; height: 14px; }
.apr-tarjeta .in-control-fila > .apr-marca .apr-ico { width: 18px; height: 18px; }
.apr-tarjeta .in-control-textos b { font-size: 15px; }
.apr-tarjeta .in-control-textos span { font-size: 13px; color: var(--apr-limite-texto); }
.apr-tarjeta .in-control-fila > svg:last-child { width: 14px; height: 14px; color: rgba(239, 230, 207, 0.4); }

/* ---- la página: la carta crecida, sobre el fondo de Progreso, con la luz que entra por arriba */
.tel .pr-pantalla.apr-pagina, .tel .pr-pantalla.apr-pagina.saliendo { animation: none; background: var(--apr-fondo); color: var(--tinta); }
/* Con avisos, la luz se recoge un poco; en calma se abre y respira. */
.apr-pagina-luz { position: absolute; left: 0; right: 0; top: 0; height: 420px; pointer-events: none; opacity: 0.72; background: radial-gradient(92% 64% at 84% -10%, rgba(var(--apr-luz), 0.34), rgba(var(--apr-luz), 0.1) 45%, rgba(var(--apr-luz), 0) 76%); transition: opacity 0.9s ease; }
.apr-pagina-luz::after { content: ''; position: absolute; left: 30%; right: 0; top: 0; height: 1px; background: linear-gradient(90deg, rgba(var(--apr-luz), 0), rgba(var(--apr-luz), 0.7)); }
.apr-pagina.calma .apr-pagina-luz { opacity: 1; animation: apr-respira 7s ease-in-out infinite alternate; }
@keyframes apr-respira { from { opacity: 0.82; } to { opacity: 1; } }
.apr-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) + 2px) 18px calc(var(--pestanas) + 40px); scrollbar-width: none; touch-action: pan-y; }
.apr-scroll::-webkit-scrollbar { display: none; }
.apr-cab { display: flex; align-items: center; justify-content: space-between; min-height: 60px; margin-top: -8px; }
.apr-volver { appearance: none; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; min-height: 44px; padding: 0 12px 0 0; border: 0; background: none; color: rgba(239, 230, 207, 0.78); font: 400 14.5px/1 var(--texto); }
.apr-volver .apr-ico { width: 18px; height: 18px; }
.apr-sello { position: relative; width: 56px; height: 56px; flex: none; margin-right: 2px; }
.apr-sello::before { content: ''; position: absolute; inset: -16px; border-radius: 50%; background: radial-gradient(closest-side, rgba(var(--apr-luz), 0.34), rgba(var(--apr-luz), 0)); }
.apr-sello-cuerpo { position: absolute; inset: 0; border-radius: 50%; overflow: hidden; background: #05060a; transform: rotate(225deg); box-shadow: 0 0 0 1px rgba(var(--apr-luz), 0.32), 0 0 18px rgba(var(--apr-luz), 0.32); }
.apr-sello-cuerpo > svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.apr-sello.galaxia .apr-sello-cuerpo { background: transparent; }
.apr-sello.polvo::before { inset: -10px; }
.apr-sello.polvo .apr-sello-cuerpo { inset: auto; left: 50%; top: 50%; width: 560px; height: 380px; margin: -190px 0 0 -280px; border-radius: 0; overflow: visible; background: none; box-shadow: none; transform: scale(0.16); }
.apr-encabezado { display: grid; justify-items: start; }
.apr-etq { font: 400 11px/1.2 var(--texto); letter-spacing: 0.2em; text-transform: uppercase; color: rgba(239, 230, 207, 0.6); }
.apr-titular { margin: 7px 0 0; font: 500 28px/1.08 var(--numeros); letter-spacing: -0.01em; text-wrap: balance; }
.apr-linea { margin-top: 6px; font: 400 14px/1.3 var(--texto); color: rgba(239, 230, 207, 0.64); }
.apr-hoytexto { margin: 14px 0 0; max-width: 34ch; font: 300 14.5px/1.5 var(--texto); color: rgba(239, 230, 207, 0.82); }

/* Los avisos: arriba de todo, como mucho tres. Se descartan deslizándolos de costado. */
.apr-avisos { display: grid; gap: 10px; margin-top: 20px; }
.apr-avisos:empty { display: none; }
.apr-aviso { position: relative; display: grid; grid-template-columns: 18px minmax(0, 1fr); column-gap: 11px; padding: 14px 15px 15px 14px; border-radius: 18px; border: 1px solid rgba(239, 230, 207, 0.09); background: rgba(16, 21, 40, 0.92); touch-action: pan-y; user-select: none; -webkit-tap-highlight-color: transparent; transition: border-color 0.2s ease; }
.apr-aviso.abre { cursor: pointer; }
.apr-aviso.abre:active:not(.arrastrando) { transform: scale(0.985); }
.apr-aviso.limita { border-color: rgba(203, 133, 105, 0.38); background: linear-gradient(180deg, rgba(203, 133, 105, 0.12), rgba(203, 133, 105, 0.03) 70%), rgba(16, 21, 40, 0.92); }
.apr-aviso.chico, .apr-aviso.anotado { padding: 12px 15px 12px 14px; }
/* «Me siento bien»: el aviso queda en una línea, con el dato y lo anotado. */
.apr-anotado { margin: 0; font: 400 14px/1.45 var(--texto); color: var(--apr-sub); text-wrap: pretty; }
.apr-anotado b { font-weight: 500; color: var(--tinta); }
.apr-anotado span { color: var(--tinta); }
.apr-aviso > .apr-marca { margin-top: 2px; width: 13px; height: 13px; }
.apr-aviso-accion .apr-ico { flex: none; width: 15px; height: 15px; color: rgba(239, 230, 207, 0.5); }
.apr-aviso-cuerpo { min-width: 0; }
.apr-aviso-etq { font: 500 13px/1.3 var(--texto); letter-spacing: 0.01em; color: rgba(239, 230, 207, 0.7); }
.apr-aviso.limita .apr-aviso-etq { color: var(--apr-limite-texto); }
.apr-aviso.subir .apr-aviso-etq { color: var(--apr-acento); }
.apr-aviso-titulo { margin-top: 5px; font: 500 17px/1.25 var(--texto); }
.apr-aviso.chico .apr-aviso-titulo { margin-top: 3px; font-size: 15px; }
.apr-aviso-texto { margin: 5px 0 0; font: 300 14px/1.45 var(--texto); color: rgba(239, 230, 207, 0.84); }
.apr-aviso-accion { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 7px 0 0; font: 400 14px/1.4 var(--texto); color: var(--tinta); }
.apr-aviso.chico .apr-aviso-accion { margin-top: 3px; font-weight: 300; color: rgba(239, 230, 207, 0.84); }
.apr-aviso-fases { margin-top: 11px; display: flex; align-items: center; gap: 10px; font: 400 13px/1 var(--texto); color: var(--apr-sub); }
.apr-aviso-fases .am-fases { color: var(--apr-limite); gap: 3px; }
.apr-aviso-fases .am-fases i { width: 11px; height: 11px; }
.apr-subir { margin-top: 8px; display: grid; gap: 6px; }
.apr-subir div { display: flex; justify-content: space-between; gap: 10px; font: 400 14.5px/1.3 var(--texto); }
.apr-subir b { font: 400 14.5px/1.3 var(--numeros); color: var(--apr-acento); white-space: nowrap; font-variant-numeric: tabular-nums; }
.apr-subir small { font: 400 13px/1.3 var(--numeros); color: var(--apr-tenue); margin-right: 4px; }
.apr-pista-noche { position: relative; height: 4px; margin: 13px 0 7px; border-radius: 3px; background: rgba(239, 230, 207, 0.1); }
.apr-pista-noche i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--apr-limite); transform-origin: 0 50%; animation: apr-llena 0.9s 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.apr-pista-noche b { position: absolute; top: -4px; bottom: -4px; width: 1.5px; background: rgba(239, 230, 207, 0.6); }
@keyframes apr-llena { from { transform: scaleX(0); } }
.apr-reps { margin-top: 10px; display: flex; align-items: flex-end; gap: 6px; height: 34px; }
.apr-reps i { width: 18px; border-radius: 3px 3px 1px 1px; background: rgba(239, 230, 207, 0.55); transform-origin: 50% 100%; animation: apr-crece 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(0.25s + 0.08s * var(--i, 0)); }
.apr-reps i:last-of-type { background: var(--apr-limite); }
.apr-reps small { margin-left: 6px; font: 400 13px/1.2 var(--texto); color: var(--apr-tenue); align-self: center; }
@keyframes apr-crece { from { transform: scaleY(0); } }
.apr-pista-aviso { margin: 10px 0 0; font: 400 13px/1.35 var(--texto); color: var(--apr-tenue); transition: opacity 0.3s ease; }
.apr-aviso.arrastrando { transition: none; cursor: grabbing; }

/* Recién vinculada: cuatro hitos y «estás aquí». */
.apr-nueva { margin-top: 20px; padding: 15px 16px 6px; border-radius: 18px; border: 1px solid rgba(var(--apr-luz), 0.2); background: rgba(16, 21, 40, 0.8); }
.apr-nueva-texto { margin: 0 0 12px; font: 300 14.5px/1.45 var(--texto); color: rgba(239, 230, 207, 0.88); }
.apr-hitos { position: relative; margin: 0; padding: 0; list-style: none; }
.apr-hitos::before { content: ''; position: absolute; left: 5px; top: 8px; bottom: 18px; width: 1.5px; background: rgba(239, 230, 207, 0.14); }
.apr-hitos li { position: relative; display: grid; grid-template-columns: 12px minmax(0, 1fr); column-gap: 13px; padding-bottom: 12px; animation: apr-sube 0.42s cubic-bezier(0.2, 0.7, 0.2, 1) both; animation-delay: calc(0.18s + 0.06s * var(--i, 0)); }
.apr-hitos li > i { width: 12px; height: 12px; margin-top: 3px; border-radius: 50%; border: 1.5px solid rgba(239, 230, 207, 0.4); background: var(--apr-fondo); box-sizing: border-box; }
.apr-hitos li.alcanzado > i { border-color: var(--apr-acento); background: var(--apr-acento); }
.apr-hitos li b { font: 500 14px/1.3 var(--texto); }
.apr-hitos li span { grid-column: 2; font: 400 13px/1.35 var(--texto); color: var(--apr-sub); }
.apr-hitos li.apr-aqui { padding-bottom: 12px; }
.apr-hitos li.apr-aqui > i { width: 12px; height: 2px; margin-top: 8px; border: 0; border-radius: 1px; background: var(--apr-acento); box-shadow: 0 0 8px rgba(var(--apr-luz), 0.9); }
.apr-hitos li.apr-aqui span { grid-column: 2; font: 500 11px/1.6 var(--texto); letter-spacing: 0.14em; text-transform: uppercase; color: var(--apr-acento); }

/* Cada parte, plegada en una línea con su dibujo; se despliega en su lugar. */
.apr-partes { margin-top: 24px; border-top: 1px solid var(--apr-linea); }
.apr-parte { border-bottom: 1px solid var(--apr-linea); }
.apr-parte-fila { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 14px; grid-template-rows: auto auto; align-items: center; column-gap: 12px; row-gap: 6px; min-height: 64px; padding: 13px 0; border: 0; background: none; color: var(--tinta); text-align: left; -webkit-tap-highlight-color: transparent; }
.apr-parte-arriba { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0; min-height: 22px; }
/* Los rótulos de las partes son solo el nombre, en mayúsculas chicas como en Progreso; lo que se lee va en la línea. */
.apr-parte-etq { font: 400 11px/1.2 var(--texto); letter-spacing: 0.17em; text-transform: uppercase; color: rgba(239, 230, 207, 0.64); }
.apr-parte-resumen { grid-column: 1; font: 400 15px/1.3 var(--texto); }
.apr-parte-fila > .apr-ico { grid-column: 2; grid-row: 1 / span 2; width: 14px; height: 14px; color: rgba(239, 230, 207, 0.42); transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1); }
.apr-parte.abierta .apr-parte-fila > .apr-ico { transform: rotate(180deg); }
.apr-parte.solo .apr-parte-fila { grid-template-rows: auto; min-height: 56px; }
.apr-parte-dibujo { flex: none; display: flex; align-items: center; justify-content: flex-end; height: 22px; }
.apr-parte-dibujo svg { display: block; overflow: visible; }
.apr-parte-dentro { overflow: hidden; }
.apr-parte-dentro > div { padding: 2px 0 20px; }
.apr-flechas { display: flex; gap: 7px; font: 400 15px/1 var(--numeros); color: var(--apr-tenue); }
.apr-flechas .sube { color: var(--apr-acento); }

.apr-texto { margin: 0 0 12px; font: 300 14px/1.5 var(--texto); color: rgba(239, 230, 207, 0.84); }
.apr-nota { margin: 12px 0 0; font: 400 13px/1.45 var(--texto); color: var(--apr-tenue); }
.apr-mini-etq { font: 400 11px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.64); }

/* Hoy: la sesión en orden, cada ejercicio con ↑ o = y su porqué al tocarlo. */
.apr-ejercicios { display: grid; }
.apr-ej { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: 18px minmax(0, 1fr) auto; align-items: baseline; column-gap: 10px; min-height: 48px; padding: 9px 0; border: 0; border-top: 1px solid rgba(239, 230, 207, 0.06); background: none; color: var(--tinta); text-align: left; }
.apr-ej:first-child { border-top: 0; }
.apr-ej-flecha { font: 400 15px/1 var(--numeros); color: var(--apr-tenue); text-align: center; }
.apr-ej-flecha.sube { color: var(--apr-acento); }
.apr-ej-nombre { display: grid; gap: 3px; min-width: 0; }
.apr-ej-nombre b { font: 400 15px/1.25 var(--texto); }
.apr-ej-nombre small { font: 400 13px/1.2 var(--numeros); color: var(--apr-tenue); font-variant-numeric: tabular-nums; }
.apr-ej-peso { font: 400 14.5px/1.25 var(--numeros); color: var(--apr-sub); text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.apr-ej.sube .apr-ej-peso { color: var(--apr-acento); }
.apr-ej-porque { grid-column: 2 / -1; overflow: hidden; margin: 0; font: 400 13.5px/1.45 var(--texto); color: var(--apr-sub); }
.apr-ej-porque[hidden] { display: none; }
.apr-ej-porque span { display: block; padding-top: 6px; }
.apr-sug { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 11px; margin-top: 12px; font: 300 14px/1.45 var(--texto); color: rgba(239, 230, 207, 0.82); }
.apr-sug .apr-ico { width: 17px; height: 17px; margin-top: 2px; color: var(--apr-tenue); }
.apr-sugs { margin-top: 8px; padding-top: 4px; border-top: 1px solid rgba(239, 230, 207, 0.06); }
.apr-manana { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 14px; padding: 4px 0; }
.apr-manana > span { font: 400 14.5px/1.4 var(--texto); color: var(--tinta); }

/* Esta semana: el cuerpo grande, la leyenda y la tira de puntos. */
.apr-sem-arriba { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 18px; }
.apr-sem-fig { gap: 8px; }
.apr-sem-fig .am-figura { width: 66px; height: 124px; }
.apr-sem-fig .am-m.poco { fill: var(--tinta); fill-opacity: 0.32; }
.apr-sem-fig .am-m.enSuPunto, .apr-sem-fig .am-m.entrenado { fill: var(--tinta); fill-opacity: 0.88; }
.apr-sem-fig .am-m.mucho { fill: #f0c48a; fill-opacity: 0.92; }
.apr-sem-fig .am-m.fatigado { stroke: var(--apr-limite); stroke-width: 1.1; stroke-dasharray: 1.8 1.2; }
.apr-leyenda { display: grid; gap: 9px; margin: 0; padding: 0; list-style: none; }
.apr-leyenda li { display: flex; align-items: center; gap: 9px; font: 400 13px/1.25 var(--texto); color: var(--apr-sub); }
.apr-leyenda i { flex: none; width: 11px; height: 11px; border-radius: 3px; box-sizing: border-box; }
.apr-leyenda .poco i { background: rgba(239, 230, 207, 0.32); }
.apr-leyenda .enSuPunto i, .apr-leyenda .entrenado i { background: rgba(239, 230, 207, 0.88); }
.apr-leyenda .mucho i { background: #f0c48a; }
.apr-leyenda .sinEntrenar i { background: rgba(170, 178, 196, 0.2); }
.apr-leyenda .fatigado i { border: 1.4px dashed var(--apr-limite); }
.apr-tira { margin-top: 16px; }
.apr-tira svg { display: block; width: 100%; height: auto; overflow: visible; }
.apr-tira .banda { fill: rgba(239, 230, 207, 0.07); }
.apr-tira .eje { stroke: rgba(239, 230, 207, 0.16); stroke-width: 1; }
.apr-tira .num { fill: var(--apr-tenue); font: 400 12px/1 var(--numeros); }
.apr-tira .num.medio { fill: rgba(239, 230, 207, 0.7); }
.apr-tira .punto { transition: r 0.2s ease; }
.apr-tira .punto.poco { fill: rgba(239, 230, 207, 0.5); }
.apr-tira .punto.enSuPunto, .apr-tira .punto.entrenado { fill: var(--tinta); }
.apr-tira .punto.mucho { fill: #f0c48a; }
.apr-tira .punto.sinEntrenar { fill: var(--apr-fondo); stroke: rgba(239, 230, 207, 0.55); stroke-width: 1.3; }
.apr-tira .aro { fill: none; stroke: var(--apr-limite); stroke-width: 1.3; stroke-dasharray: 2 1.6; }
.apr-tira .elegido { fill: none; stroke: var(--apr-acento); stroke-width: 1.5; }
.apr-tira .rotulo { fill: rgba(239, 230, 207, 0.86); font: 400 12px/1 var(--texto); }
.apr-tira .guia { stroke: rgba(239, 230, 207, 0.3); stroke-width: 1; }
.apr-tira .toque { fill: transparent; cursor: pointer; }
.apr-tira-detalle { min-height: 42px; margin: 8px 0 0; font: 400 13.5px/1.45 var(--texto); color: var(--apr-sub); }
.apr-tira-detalle b { font-weight: 500; color: var(--tinta); }
.apr-rutina { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(239, 230, 207, 0.06); }
.apr-rutina b { font: 400 15px/1.3 var(--texto); }
.apr-rutina b em { font-style: normal; color: var(--apr-acento); }
.apr-rutina ul { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; }
.apr-rutina li { font: 400 13.5px/1.4 var(--texto); color: var(--apr-sub); }

/* Tu fuerza: cada ejercicio con su chispa; lo que no sube, con la puerta a «¿Por qué no estás mejorando?». */
.apr-fz { display: grid; grid-template-columns: minmax(0, 1fr) 112px; align-items: center; column-gap: 14px; padding: 11px 0; border-top: 1px solid rgba(239, 230, 207, 0.06); }
.apr-fz:first-of-type { border-top: 0; }
.apr-fz-textos { display: grid; gap: 3px; min-width: 0; }
.apr-fz-textos b { font: 400 15px/1.25 var(--texto); }
.apr-fz-textos span { font: 400 13.5px/1.3 var(--texto); color: var(--apr-sub); }
.apr-fz-textos small { font: 400 13px/1.3 var(--texto); color: var(--apr-tenue); }
.apr-fz.bajo .apr-fz-textos span { color: var(--apr-limite-texto); }
.apr-fz-chispa svg { width: 112px; height: 40px; }
.apr-fz .am-chispa.sube .am-chispa-recta { stroke: var(--tinta); }
.apr-fz .am-chispa .am-chispa-banda { fill: rgba(239, 230, 207, 0.09); }
.apr-porque { grid-column: 1 / -1; appearance: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: 2px 0 -6px; padding: 0; border: 0; background: none; color: var(--apr-acento); font: 400 14px/1.2 var(--texto); }
.apr-porque .apr-ico { width: 14px; height: 14px; }

/* Metas: cada una como una pista, con lo que levantarías hoy y cuándo llegas. */
.apr-meta { padding: 12px 0 14px; border-top: 1px solid rgba(239, 230, 207, 0.06); }
.apr-meta:first-child { border-top: 0; padding-top: 4px; }
.apr-meta-cab { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.apr-meta-cab b { font: 400 15px/1.25 var(--texto); }
.apr-meta-cab span { font: 400 13px/1.25 var(--numeros); color: var(--apr-tenue); white-space: nowrap; }
.apr-meta-pista { position: relative; height: 5px; margin: 11px 0 9px; border-radius: 3px; background: rgba(239, 230, 207, 0.1); }
.apr-meta-pista i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 3px; background: var(--tinta); transform-origin: 0 50%; animation: apr-llena 0.9s 0.15s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.apr-meta.noSube .apr-meta-pista i { background: var(--apr-limite); }
.apr-meta.noSeSabe .apr-meta-pista i { background: rgba(239, 230, 207, 0.4); }
.apr-meta-pista em { position: absolute; right: 0; top: -2px; width: 9px; height: 9px; border-radius: 50%; border: 1.5px solid var(--tinta); background: var(--apr-fondo); }
.apr-meta p { margin: 4px 0 0; font: 400 13.5px/1.45 var(--texto); color: var(--apr-sub); }
.apr-meta p.llega { color: var(--tinta); }
.apr-meta-pasos { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 4px; }
.apr-meta-pasos li { display: grid; grid-template-columns: 14px minmax(0, 1fr); gap: 8px; font: 400 13.5px/1.4 var(--texto); color: var(--apr-sub); }
.apr-meta-pasos li i { font: normal 400 13px/1.4 var(--numeros); color: var(--apr-acento); }

/* Tu año. */
.apr-anio-mapa { margin-top: 4px; }
.apr-anio-mapa .am-anio-dia { cursor: pointer; }
.apr-anio-mapa .am-anio-dia.elegido { stroke: var(--apr-acento); stroke-width: 1.2; }
.apr-anio-detalle { min-height: 22px; margin: 10px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--tinta); }
.apr-anio-leyenda { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 10px 0 0; padding: 0; list-style: none; }
.apr-anio-leyenda li { display: flex; align-items: center; gap: 6px; font: 400 13px/1.2 var(--texto); color: var(--apr-sub); }
.apr-anio-leyenda i { width: 10px; height: 10px; border-radius: 2px; }
.apr-anio-ultimas { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 7px; }
.apr-anio-ultimas li { display: grid; grid-template-columns: 8px minmax(0, 1fr) auto; align-items: baseline; gap: 10px; font: 400 13.5px/1.35 var(--texto); color: var(--tinta); }
.apr-anio-ultimas li i { width: 7px; height: 7px; border-radius: 50%; }
.apr-anio-ultimas li small { font: 400 13px/1.3 var(--texto); color: var(--apr-tenue); white-space: nowrap; }

.apr-base h4 { margin: 14px 0 4px; font: 400 10.5px/1.2 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: rgba(239, 230, 207, 0.55); }
.apr-base h4:first-child { margin-top: 0; }
.apr-base p { margin: 4px 0 0; }

/* ---- el aviso abierto: crece desde el aviso tocado */
.apr-detalle { position: absolute; inset: 0; z-index: 3; background: var(--apr-fondo); }
.apr-detalle .apr-pagina-luz { opacity: 0.55; }
.apr-det-cab { min-height: 60px; margin-top: -8px; display: flex; align-items: center; }
.apr-det-titulo { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.apr-det-titulo .apr-marca { width: 20px; height: 20px; color: var(--apr-limite); }
.apr-det-titulo h2 { margin: 0; font: 500 26px/1.1 var(--numeros); letter-spacing: -0.01em; }
.apr-det-etq { margin-top: 8px; font: 500 14px/1.3 var(--texto); color: var(--apr-limite-texto); }
.apr-det-figuras { display: flex; justify-content: center; gap: 28px; margin: 20px 0 4px; }
.apr-det-figuras .am-figura { width: 92px; height: 145px; overflow: hidden; }
.apr-det-figuras .am-m.cargado { fill: var(--apr-limite); fill-opacity: 0.95; }
.apr-det-figuras .am-m.seRecupera { fill: var(--apr-limite); fill-opacity: 0.62; }
.apr-det-figuras .am-m.faltaPoco { fill: var(--apr-limite); fill-opacity: 0.4; }
.apr-det-bloque { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--apr-linea); }
.apr-det-bloque p { margin: 6px 0 0; font: 300 15px/1.5 var(--texto); color: rgba(239, 230, 207, 0.9); }
.apr-det-fases { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin: 12px 0 4px; }
.apr-det-fases > span { display: grid; justify-items: center; gap: 7px; font: 400 13px/1.2 var(--texto); color: rgba(239, 230, 207, 0.62); text-align: center; }
.apr-det-fases > span .am-fase { width: 20px; height: 20px; color: rgba(239, 230, 207, 0.6); opacity: 0.5; }
.apr-det-fases > span.actual { color: var(--apr-limite-texto); font-weight: 500; }
.apr-det-fases > span.actual .am-fase { color: var(--apr-limite); opacity: 1; }
.apr-det-sesion { margin-top: 6px; }
.apr-det-sesion .apr-ej { cursor: default; }
.apr-det-botones { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 24px; }
.apr-boton { appearance: none; cursor: pointer; min-height: 48px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.28); background: none; color: var(--tinta); font: 500 15px/1.1 var(--texto); transition: transform 0.15s ease, background 0.2s ease; }
.apr-boton:active { transform: scale(0.97); }
.apr-boton.principal { border-color: transparent; background: rgba(239, 230, 207, 0.94); color: #10131f; }

/* ---- la pantalla bloqueada, dibujada simple */
.tel .pr-pantalla.apr-bloqueo { color: #fff; background: #0a1024 center / cover no-repeat; animation: apr-bl-entra 0.32s ease both; }
.tel .pr-pantalla.apr-bloqueo.saliendo { animation: apr-bl-sale 0.24s ease both; }
.apr-bloqueo::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(8, 12, 30, 0.35), rgba(8, 12, 30, 0.15) 40%, rgba(8, 12, 30, 0.6)); pointer-events: none; }
.apr-bloqueo > * { position: relative; }
@keyframes apr-bl-entra { from { opacity: 0; transform: scale(1.03); } }
@keyframes apr-bl-sale { to { opacity: 0; transform: scale(1.03); } }
.apr-bl-isla { display: none; position: absolute; top: 11px; left: 50%; width: 124px; height: 35px; translate: -50% 0; border-radius: 22px; background: #000; }
@media (min-width: 1000px) { .tel:not(.inmersivo) .apr-bl-isla { display: block; } }
.apr-bl-reloj { padding-top: calc(var(--arriba) + 22px); text-align: center; }
.apr-bl-reloj span { display: block; font: 600 16px/1.2 -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; color: rgba(255, 255, 255, 0.88); }
.apr-bl-reloj b { display: block; margin-top: 2px; font: 600 84px/1.04 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.apr-bl-noti { appearance: none; cursor: pointer; position: absolute; left: 10px; right: 10px; bottom: calc(var(--abajo) + 120px); display: grid; grid-template-columns: 38px minmax(0, 1fr); column-gap: 11px; align-items: center; padding: 12px 13px; border: 0; border-radius: 22px; background: rgba(30, 36, 62, 0.62); -webkit-backdrop-filter: blur(18px) saturate(1.3); backdrop-filter: blur(18px) saturate(1.3); color: #fff; text-align: left; font-family: -apple-system, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif; animation: apr-bl-noti 0.5s 0.35s cubic-bezier(0.2, 0.9, 0.3, 1) both; transition: transform 0.15s ease; }
.apr-bl-noti:active { transform: scale(0.98); }
@keyframes apr-bl-noti { from { opacity: 0; transform: translateY(18px) scale(0.96); } }
.apr-bl-noti i { width: 38px; height: 38px; border-radius: 9px; background: linear-gradient(160deg, #24427a, #101a3a) center / cover no-repeat; }
.apr-bl-arriba { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.apr-bl-arriba b { font-size: 15px; font-weight: 600; line-height: 1.25; }
.apr-bl-arriba em { flex: none; font-size: 13px; font-style: normal; color: rgba(255, 255, 255, 0.6); }
.apr-bl-noti p { margin: 2px 0 0; font-size: 15px; line-height: 1.3; color: rgba(255, 255, 255, 0.94); }
.apr-bl-barra { position: absolute; left: 50%; bottom: 9px; width: 134px; height: 5px; margin-left: -67px; border-radius: 3px; background: rgba(255, 255, 255, 0.82); }

/* Lo que se descarta o se despliega, y con Reducir movimiento, sin movimiento. */
.apr-fantasma { pointer-events: none; z-index: 5; }
@media (prefers-reduced-motion: reduce) {
  .apr-siete span, .apr-hitos li, .apr-pista-noche i, .apr-reps i, .apr-meta-pista i, .apr-bl-noti, .tel .pr-pantalla.apr-bloqueo, .apr-pagina.calma .apr-pagina-luz { animation: none; }
  .pg-scroll.apr-moviendo > *, .apr-parte-fila > .apr-ico { transition: none; }
  .pg-scroll.apr-apartadas > * { transform: none !important; }
}
`;

Galeria.propuesta({
  id: 'ascentEnProgreso',
  titulo: 'Ascent, opción C: dentro de Progreso',
  texto: 'Ascent deja de estar arriba y pasa a ser una tarjeta de Progreso; al tocarla se abre y muestra primero solo lo que cambia lo que hacés hoy. Si algo cambia tu sesión, también avisa en Inicio y en el teléfono.',
  vistas: [['progreso', 'La tarjeta en Progreso'], ['aviso', 'Al tocar la tarjeta'], ['inicio', 'El aviso en Inicio'], ['telefono', 'El aviso en la pantalla bloqueada']],
  mas: [
    ['avisoAbierto', 'Al abrir el aviso de músculos cansados'], ['calma', 'Un día normal, sin avisos'], ['casi', 'Un aviso suave: le falta 1 día'],
    ['nocheCorta', 'Después de dormir poco'], ['hecha', 'Después de entrenar'], ['descanso', 'Un día de descanso'], ['nueva', 'Recién vinculada'],
    ['partes', 'Con todas las partes abiertas'], ['sinVincular', 'Sin Ascent vinculada'], ['en', 'En inglés'],
  ],
  principal: 0,
  crear(g) {
    const M = window.AscentDeMentira;
    const u = Util.crear(g.opciones);
    const { el, boton, tx } = u;
    g.estilo('apr-estilo', CSS_APR);

    // ------------------------------------------------------------ los textos de la propuesta
    const propio = (clave, idioma) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), T[idioma]);
    const conVars = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
    const tr = (clave, vars) => conVars(propio(clave, g.idioma) ?? propio(clave, 'es'), vars);
    const trPlural = (clave, n, vars) => { const f = propio(clave, g.idioma) || propio(clave, 'es'); return conVars(n === 1 ? f.uno : f.otros, Object.assign({ n }, vars)); };
    const conMayuscula = (x) => x.charAt(0).toUpperCase() + x.slice(1);
    const escapar = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const ico = (nombre) => Util.icono(nombre).replace('<svg ', '<svg class="apr-ico" ');
    const FLECHA = '<svg class="apr-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5.5M6.5 11 12 5.5l5.5 5.5"/></svg>';
    const PUNTO = '<svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.2" fill="currentColor"/></svg>';
    const quieto = () => g.movimientoReducido || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const CURVA = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
    const esPolvo = () => M.rango().cuerpo === 'polvo';
    const enLaLista = (nombres, y) => (nombres.length < 2 ? nombres.join('') : `${nombres.slice(0, -1).join(', ')} ${y} ${nombres[nombres.length - 1]}`);

    // ------------------------------------------------------------ lo de la galería que se usa
    const pgZona = g.secciones.progreso.zona;
    const pgScroll = pgZona.querySelector('.pg-scroll');
    const inBloques = g.secciones.inicio.zona.querySelector('.in-bloques');
    const p = g.pantalla('apr-pagina as-vars', { conBarra: true });
    const bl = g.pantalla('apr-bloqueo');
    // El gesto de las pestañas (galeria.js) cede lo que empieza en una fila que se desliza (Detalles.gestoPropio): así
    // deslizar un aviso, o la página entera, no mueve las secciones de atrás.
    p.el.classList.add('dt-desliza', 'dt-abierta');
    bl.el.classList.add('dt-desliza', 'dt-abierta');

    // ------------------------------------------------------------ el estado
    const VISTAS = {
      progreso: { dia: 'cargado', modo: 'carta' },
      aviso: { dia: 'cargado', modo: 'pagina' },
      avisoAbierto: { dia: 'cargado', modo: 'detalle' },
      inicio: { dia: 'cargado', modo: 'inicio' },
      telefono: { dia: 'cargado', modo: 'telefono' },
      calma: { dia: 'normal', modo: 'pagina' },
      casi: { dia: 'casi', modo: 'pagina' },
      nocheCorta: { dia: 'nocheCorta', modo: 'pagina' },
      hecha: { dia: 'hecha', modo: 'pagina' },
      descanso: { dia: 'descanso', modo: 'carta' },
      nueva: { dia: 'nueva', modo: 'pagina' },
      partes: { dia: 'cargado', modo: 'pagina', abiertas: ['semana', 'fuerza'] },
      sinVincular: { dia: 'cargado', modo: 'carta', sinVincular: true },
      en: { dia: 'cargado', modo: 'carta', idioma: 'en' },
    };
    const s = {
      abierta: false, vista: null, dia: 'cargado', descartados: new Set(), respuestas: {}, abiertas: new Set(), ejercicio: null, musculo: null, diaDelAnio: null,
      conTarjeta: false, pagina: false, detalle: null, volviendo: null, yaDescarto: false, ocupada: false,
      // Cómo estaba la galería antes de abrir la propuesta (el vínculo con Ascent): se devuelve al cerrarla de verdad.
      antes: null,
    };
    let carta = null;
    let tarjeta = null;
    const diaDe = () => M.dia(s.dia);

    // ------------------------------------------------------------ los avisos de hoy
    /** Los avisos del día, en orden y sin los descartados: como mucho tres. */
    function avisosDe(d) {
      const lista = [];
      const prevista = !!d.sesion && d.sesion.estado === 'prevista';
      const a = d.aviso;
      if (prevista && a) {
        // Con «Me siento bien», queda anotado en una línea con el dato: ya no pide nada, ni en Inicio.
        const bien = s.respuestas.fatiga === 'bien';
        lista.push({
          tema: 'fatiga', limita: a.pide && !bien, chico: !a.pide, anotado: bien, abre: !bien, marca: M.fase(a.paso), corto: a.corto,
          inicio: a.pide && !bien ? { titulo: a.titulo, texto: a.corto } : null,
        });
      }
      const noche = d.hoy.noche;
      if (prevista && noche && noche.corta) {
        lista.push({
          tema: 'noche', limita: true, marca: ico('sueno'), corto: tr('anoche', { horas: noche.texto }),
          inicio: { titulo: tr('inicio.noche.titulo', { sesion: d.sesion.nombre.toLowerCase() }), texto: tr('inicio.noche.texto', { horas: noche.texto }) },
        });
      }
      const limitada = prevista && ((a && a.pide) || (noche && noche.corta));
      const suben = prevista ? d.sesion.ejercicios.filter((e) => e.decision === 'sube') : [];
      if (limitada && suben.length) lista.push({ tema: 'subir', marca: FLECHA, marcaClase: 'sube', corto: `${suben[0].nombre}: ${suben[0].corto}`, ejercicios: suben });
      const deMas = prevista ? d.musculos.find((m) => m.hoyToca && m.estado === 'mucho') : null;
      if (deMas) lista.push({ tema: 'musculo', marca: PUNTO, corto: `${deMas.nombre}: ${deMas.estadoTexto.toLowerCase()}`, musculo: deMas });
      const sinSubir = prevista ? d.fuerza.ejercicios.find((e) => e.hoyToca && (e.estado === 'sinSubidaClara' || e.estado === 'bajo')) : null;
      if (sinSubir) lista.push({ tema: 'fuerza', marca: PUNTO, corto: `${sinSubir.nombre}: ${sinSubir.corto}`, ejercicio: sinSubir });
      // Ya entrenado, primero cómo fue (lo que acaba de pasar) y después la meta que esa sesión movió.
      if (d.sesion && d.sesion.estado === 'hecha' && d.sesion.comoFue) lista.push({ tema: 'comoFue', marca: PUNTO, corto: tr('comoFue', { palabra: d.sesion.comoFue.palabra }) });
      const movida = d.metas.lista.find((x) => x.antes);
      if (movida) lista.push({ tema: 'meta', marca: ico('objetivo'), corto: tr('aviso.metaCorta', { ejercicio: movida.nombre, ventana: movida.ventanaCorta }), meta: movida });
      return lista.filter((x) => !s.descartados.has(x.tema)).slice(0, 3);
    }
    const marcaDe = (a, clase) => `<span class="apr-marca ${a.marcaClase || ''} ${clase || ''}" aria-hidden="true">${a.marca}</span>`;

    // ------------------------------------------------------------ piezas chicas
    /** El cuerpo de frente y de espalda, con las clases de la lente (M.estadosDe). */
    function figuras(d, lente, clase, estados) {
      const caja = el('div', 'apr-figuras ' + (clase || ''));
      const e = estados || M.estadosDe(d, lente);
      caja.innerHTML = M.figura('frente', e) + M.figura('espalda', e);
      caja.setAttribute('aria-hidden', 'true');
      return caja;
    }
    /** La semana en siete marcas, de lunes a domingo. */
    function siete(d, clase) {
      const fila = el('div', 'apr-siete ' + (clase || ''));
      const partes = [];
      d.semana.dias.forEach((x, i) => {
        const estado = x.hecho ? 'hecho' + (x.fuera ? ' fuera' : '') : x.toca ? 'toca' : 'descanso';
        const n = el('span', estado + (x.hoy ? ' hoy' : ''));
        n.style.setProperty('--i', i);
        n.append(el('b', null, x.letra), el('i'));
        fila.appendChild(n);
        const sesion = x.nombre ? x.nombre.toLowerCase() : '';
        partes.push(x.hoy ? (x.hecho ? tr('dia.hoyHecho') : tr('dia.hoy', { sesion: sesion || tr('dia.descanso', { dia: '' }).replace(/^,\s*/, '') })) : tr('dia.' + (x.hecho ? (x.fuera ? 'fuera' : 'hecho') : x.toca ? 'toca' : 'descanso'), { dia: x.dia, sesion }));
      });
      fila.setAttribute('role', 'img');
      fila.setAttribute('aria-label', tr('semana7', { dias: partes.join('; ') }));
      return fila;
    }
    /** El sello del encabezado: el cuerpo de tu rango, entero (el polvo es una nube y va sin círculo). */
    function sello() {
      const r = M.rango();
      const caja = el('div', 'apr-sello ' + r.cuerpo);
      caja.setAttribute('role', 'img');
      caja.setAttribute('aria-label', tr('sello'));
      const cuerpo = el('i', 'apr-sello-cuerpo');
      cuerpo.innerHTML = M.cuerpoDelRango();
      caja.appendChild(cuerpo);
      return caja;
    }
    function lineaDe(d) {
      if (!d.sesion) return d.siguiente ? `${d.siguiente.linea} · ${d.siguiente.hora}` : d.hoy.linea;
      if (d.sesion.estado === 'hecha') return `${d.hoy.linea} · ${d.sesion.duracion}`;
      return d.hoy.linea;
    }

    // ------------------------------------------------------------ la carta de Progreso
    function pintarCarta() {
      const luz = esPolvo() ? ' apr-polvo' : '';
      if (!g.secciones.ascent.vinculada) {
        const c = el('section', 'apr-fila' + luz);
        const f = M.frases();
        const b = boton('apr-fila-boton', M.marcaChica, () => g.secciones.ascent.abrirVincular());
        const textos = el('span', 'apr-fila-textos');
        textos.append(el('b', null, f.conecta), el('span', null, f.queEsAscent));
        b.appendChild(textos);
        b.insertAdjacentHTML('beforeend', ico('adelante'));
        c.appendChild(b);
        return c;
      }
      const d = diaDe();
      const c = el('article', 'pg-carta apr-carta as-vars' + luz);
      c.tabIndex = 0;
      c.setAttribute('role', 'button');
      c.setAttribute('aria-label', tr('abrirCarta', { titular: d.hoy.corto }));
      c.addEventListener('click', () => abrirPagina({ crecer: true }));
      c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirPagina({ crecer: true }); } });
      c.innerHTML = '<i class="apr-carta-luz" aria-hidden="true"></i>';
      const cab = el('header', 'pg-carta-cab');
      cab.appendChild(el('span', 'pg-carta-titulo apr-carta-etq', tr('carta')));
      const cuerpo = el('div', 'apr-carta-cuerpo');
      const textos = el('div', 'apr-carta-textos');
      textos.append(el('b', 'apr-carta-titular', d.hoy.corto), el('span', 'apr-carta-linea', lineaDe(d)));
      const primero = avisosDe(d)[0];
      if (primero) {
        const pie = el('span', 'apr-carta-pie' + (primero.limita ? ' limita' : ''));
        pie.innerHTML = marcaDe(primero, primero.anotado ? 'limita' : '');
        pie.appendChild(el('span', null, primero.corto));
        textos.appendChild(pie);
      } else if (d.nueva) textos.appendChild(hitosChicos(d));
      else textos.appendChild(siete(d, 'chica'));
      cuerpo.append(textos, figuras(d, 'hoy', 'apr-carta-figuras'));
      c.append(cab, cuerpo);
      return c;
    }
    function hitosChicos(d) {
      const caja = el('span', 'apr-hitos-chico');
      const barras = el('i');
      d.nueva.hitos.forEach((h) => barras.appendChild(el('b', h.alcanzado ? 'alcanzado' : '')));
      caja.append(el('span', null, trPlural('llevas', d.nueva.entrenamientos)), barras);
      return caja;
    }

    /** Lo de abajo se acomoda en lugar de saltar: cada hijo que se movió vuelve desde donde estaba. */
    function acomodar(contenedor, cambio) {
      if (quieto() || !contenedor.isConnected) { cambio(); return; }
      const antes = new Map([...contenedor.children].map((n) => [n, n.getBoundingClientRect().top]));
      cambio();
      [...contenedor.children].forEach((n) => {
        if (!antes.has(n)) return;
        const dy = antes.get(n) - n.getBoundingClientRect().top;
        if (Math.abs(dy) > 0.5) n.animate([{ transform: `translateY(${dy.toFixed(1)}px)` }, { transform: 'none' }], { duration: 400, easing: CURVA });
      });
    }
    const entra = (n, retraso = 0) => { if (!quieto()) n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: retraso, easing: CURVA, fill: 'backwards' }); };

    /** La carta, en su lugar: después del control. Con `animar`, entra; si no (Progreso se volvió a pintar), queda igual. */
    function ponerCarta(animar) {
      const control = pgScroll.querySelector(':scope > .pg-control');
      if (!control) return;
      const nueva = pintarCarta();
      if (carta && carta.isConnected) { carta.replaceWith(nueva); carta = nueva; return; }
      carta = nueva;
      if (animar) {
        acomodar(pgScroll, () => control.after(carta));
        entra(carta, 60);
      } else control.after(carta);
    }
    function quitarCarta(animar) {
      const c = carta;
      carta = null;
      if (!c || !c.isConnected) return;
      if (!animar || quieto()) { c.remove(); return; }
      c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px) scale(0.98)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        if (!c.isConnected) return;
        const padre = c.parentElement;
        acomodar(padre, () => c.remove());
      };
    }

    // ------------------------------------------------------------ la tarjeta de Inicio
    function pintarTarjeta() {
      const d = diaDe();
      const a = g.secciones.ascent.vinculada ? avisosDe(d).find((x) => x.inicio) : null;
      if (!a) return null;
      const c = el('article', 'in-bloque in-control apr-tarjeta as-vars' + (esPolvo() ? ' apr-polvo' : ''));
      c.tabIndex = 0;
      c.setAttribute('role', 'button');
      c.addEventListener('click', () => desdeInicio());
      c.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); desdeInicio(); } });
      const fila = el('div', 'in-control-fila');
      fila.innerHTML = marcaDe(a, 'limita');
      const textos = el('div', 'in-control-textos');
      textos.append(el('b', null, a.inicio.titulo), el('span', null, a.inicio.texto));
      fila.appendChild(textos);
      fila.insertAdjacentHTML('beforeend', ico('adelante'));
      c.appendChild(fila);
      return c;
    }
    function ponerTarjeta(animar) {
      const luna = inBloques.querySelector(':scope > .in-calorias');
      const nueva = luna && s.conTarjeta ? pintarTarjeta() : null;
      if (!nueva) { quitarTarjeta(animar); return; }
      if (tarjeta && tarjeta.isConnected) { tarjeta.replaceWith(nueva); tarjeta = nueva; return; }
      tarjeta = nueva;
      if (animar) {
        acomodar(inBloques, () => luna.after(tarjeta));
        entra(tarjeta, 80);
      } else luna.after(tarjeta);
    }
    function quitarTarjeta(animar) {
      const c = tarjeta;
      tarjeta = null;
      if (!c || !c.isConnected) return;
      if (!animar || quieto()) { c.remove(); return; }
      c.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(6px) scale(0.98)' }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        if (!c.isConnected) return;
        const padre = c.parentElement;
        acomodar(padre, () => c.remove());
      };
    }
    // Tocar la tarjeta lleva a Progreso deslizándose y la carta crece hasta la página.
    function desdeInicio() {
      g.irA(2);
      g.secciones.progreso.subir();
      setTimeout(() => { if (s.abierta) abrirPagina({ crecer: true }); }, quieto() ? 0 : 420);
    }

    // ------------------------------------------------------------ crecer y encoger
    /** El marco de `nodo` dentro de `caja` (lo que cubre la capa que crece). */
    function marcoEn(caja, nodo) {
      const c = caja.getBoundingClientRect();
      const r = nodo.getBoundingClientRect();
      return { t: r.top - c.top, l: r.left - c.left, b: c.bottom - r.bottom, r: c.right - r.right, w: r.width, h: r.height };
    }
    const recorte = (m, radio) => `inset(${m.t.toFixed(1)}px ${m.r.toFixed(1)}px ${m.b.toFixed(1)}px ${m.l.toFixed(1)}px round ${radio}px)`;
    const LLENO = { t: 0, l: 0, b: 0, r: 0 };
    /** Lleva `grande` desde donde está `chico` (posición y tamaño de letra) hasta su lugar, o al revés. */
    function viajar(chico, grande, duracion, alReves) {
      if (!chico || !grande || !chico.isConnected || !grande.isConnected) return;
      const a = chico.getBoundingClientRect();
      const b = grande.getBoundingClientRect();
      if (!a.width || !b.width) return;
      const fa = parseFloat(getComputedStyle(chico).fontSize);
      const fb = parseFloat(getComputedStyle(grande).fontSize);
      const k = fa && fb ? fa / fb : a.width / b.width;
      const desde = { transformOrigin: '0 0', transform: `translate(${(a.left - b.left).toFixed(1)}px, ${(a.top - b.top).toFixed(1)}px) scale(${k.toFixed(3)})` };
      const hasta = { transformOrigin: '0 0', transform: 'none' };
      grande.animate(alReves ? [hasta, desde] : [desde, hasta], { duration: duracion, easing: CURVA, fill: alReves ? 'forwards' : 'none' });
    }
    /** Una copia de lo tocado, en su marco: tapa el primer instante y se funde (o aparece al volver). */
    function fantasma(capa, origen, m) {
      const f = origen.cloneNode(true);
      f.classList.add('apr-fantasma');
      f.removeAttribute('tabindex');
      f.setAttribute('aria-hidden', 'true');
      Object.assign(f.style, { position: 'absolute', left: `${m.l}px`, top: `${m.t}px`, width: `${m.w}px`, height: `${m.h}px`, margin: '0', transform: 'none' });
      capa.appendChild(f);
      return f;
    }
    /**
     * Lo que se abre crece desde lo tocado: `capa` (que cubre `caja`) pasa del marco de `origen` a llenarla, con las
     * esquinas de redondas a rectas; `pares` viajan y `resto` entra después, de arriba hacia abajo.
     */
    function crecer({ capa, caja, origen, radio, pares, resto, sello: elSello }) {
      if (quieto()) { capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
      const m = marcoEn(caja, origen);
      const D = 440;
      const f = fantasma(capa, origen, m);
      capa.animate([{ clipPath: recorte(m, radio) }, { clipPath: recorte(LLENO, 0) }], { duration: D, easing: CURVA });
      f.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 170, easing: 'ease-out', fill: 'forwards' }).onfinish = () => f.remove();
      pares.forEach(([a, b]) => viajar(a, b, D));
      resto.forEach((n, i) => n.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: 120 + i * 40, easing: CURVA, fill: 'backwards' }));
      // El cuerpo del rango, que estaba fuera de cuadro, entra al sello desde la esquina de donde venía su luz.
      if (elSello) {
        const b = elSello.getBoundingClientRect();
        const c = caja.getBoundingClientRect();
        const dx = c.left + m.l + m.w - (b.left + b.width / 2);
        const dy = c.top + m.t - (b.top + b.height / 2);
        elSello.animate([{ opacity: 0, transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(0.3)` }, { opacity: 1, transform: 'none' }], { duration: D + 80, easing: CURVA });
      }
    }
    /** Al revés: lo de adentro se va, la capa se encoge hacia `destino` y la copia aparece en su marco. */
    function encoger({ capa, caja, destino, radio, pares, resto, sello: elSello, desde, alTerminar }) {
      if (quieto() || !destino || !destino.isConnected) {
        capa.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).onfinish = alTerminar;
        return;
      }
      const m = marcoEn(caja, destino);
      const D = 400;
      resto.forEach((n) => n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'ease-in', fill: 'forwards' }));
      const f = fantasma(capa, destino, m);
      f.animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: D, fill: 'forwards' });
      capa.animate([Object.assign({ clipPath: recorte(LLENO, 0) }, desde ? { transform: desde } : {}), Object.assign({ clipPath: recorte(m, radio) }, desde ? { transform: 'none' } : {})], { duration: D, easing: CURVA, fill: 'forwards' }).onfinish = alTerminar;
      pares.forEach(([a, b]) => viajar(a, b, D, true));
      if (elSello) elSello.animate([{ opacity: 1 }, { opacity: 0, transform: 'scale(0.4)' }], { duration: 220, easing: 'ease-in', fill: 'forwards' });
    }

    // ------------------------------------------------------------ la página
    function pintarPagina() {
      const d = diaDe();
      const avisos = avisosDe(d);
      const antes = p.el.querySelector(':scope > .apr-scroll');
      const arriba = antes ? antes.scrollTop : 0;
      p.el.getAnimations().forEach((a) => a.cancel());
      p.el.style.transform = '';
      p.el.classList.toggle('apr-polvo', esPolvo());
      p.el.classList.toggle('calma', !avisos.length);
      const luz = el('div', 'apr-pagina-luz');
      luz.setAttribute('aria-hidden', 'true');
      const scroll = el('div', 'apr-scroll');
      const cab = el('header', 'apr-cab');
      const volver = boton('apr-volver', `${ico('abajo')}<span>${tx('progreso.titulo')}</span>`, () => cerrarPagina({ encoger: true }), tx('ascent.volverAProgreso'));
      cab.append(volver, sello());
      const enc = el('div', 'apr-encabezado');
      enc.append(el('div', 'apr-etq', tr('pagina')), el('h2', 'apr-titular', d.hoy.corto), el('div', 'apr-linea', lineaDe(d)), siete(d));
      // El porqué del titular, si ningún aviso ya lo dice.
      if (!avisos.some((a) => a.tema === 'fatiga' || a.tema === 'noche') && d.hoy.texto) enc.appendChild(el('p', 'apr-hoytexto', d.hoy.texto));
      scroll.append(cab, enc);
      if (d.nueva) scroll.appendChild(bloqueNueva(d));
      const lista = el('div', 'apr-avisos');
      avisos.forEach((a) => lista.appendChild(pintarAviso(a, d)));
      scroll.appendChild(lista);
      if (avisos.length && !s.yaDescarto) scroll.appendChild(el('p', 'apr-pista-aviso', tr('aviso.pista')));
      scroll.appendChild(partes(d));
      p.el.replaceChildren(luz, scroll);
      Detalles.franja(p.el, scroll, '7, 10, 22');
      tirarParaCerrar(scroll, p.el, (desde) => cerrarPagina({ encoger: true, desde }), () => !s.detalle);
      scroll.scrollTop = arriba;
      return scroll;
    }
    const piezasDeLaPagina = () => {
      const sc = p.el.querySelector(':scope > .apr-scroll');
      return {
        scroll: sc, volver: sc.querySelector('.apr-volver'), sello: sc.querySelector('.apr-sello'), etq: sc.querySelector('.apr-etq'),
        titular: sc.querySelector('.apr-titular'), linea: sc.querySelector('.apr-linea'), siete: sc.querySelector('.apr-encabezado > .apr-siete'),
        resto: [sc.querySelector('.apr-volver'), sc.querySelector('.apr-hoytexto'), sc.querySelector('.apr-nueva'), ...sc.querySelectorAll('.apr-avisos > *'), sc.querySelector('.apr-pista-aviso'), ...sc.querySelectorAll('.apr-partes > *')].filter(Boolean),
      };
    };
    const paresCon = (c, x) => (c ? [[c.querySelector('.apr-carta-etq'), x.etq], [c.querySelector('.apr-carta-titular'), x.titular], [c.querySelector('.apr-carta-linea'), x.linea], [c.querySelector('.apr-siete'), x.siete]] : []);

    /** Abre la página; con `crecer`, desde la carta. */
    function abrirPagina({ crecer: desdeLaCarta } = {}) {
      if (s.ocupada) return;
      if (s.pagina) { pintarPagina(); return; }
      s.pagina = true;
      pintarPagina();
      p.abrir();
      const x = piezasDeLaPagina();
      x.scroll.scrollTop = 0;
      if (desdeLaCarta && carta && carta.isConnected) {
        s.ocupada = true;
        pgScroll.classList.add('apr-moviendo', 'apr-apartadas');
        // Las siete marcas viajan si la carta también las tiene; si no, entran con lo demás.
        const resto = carta.querySelector('.apr-siete') || !x.siete ? x.resto : [x.siete, ...x.resto];
        crecer({ capa: p.el, caja: g.tel, origen: carta, radio: 20, pares: paresCon(carta, x), resto, sello: x.sello });
        setTimeout(() => { s.ocupada = false; }, 460);
      } else if (!quieto()) p.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
    }
    /** Cierra la página; con `encoger`, hacia la carta (que se pinta antes, por si algo se descartó). */
    function cerrarPagina({ encoger: haciaLaCarta, desde, alTerminar } = {}) {
      if (!s.pagina || s.ocupada) { if (alTerminar) alTerminar(); return; }
      s.pagina = false;
      if (s.detalle) cerrarDetalleYa();
      const fin = () => {
        s.ocupada = false;
        // Si se volvió a abrir mientras se iba, queda abierta.
        if (!s.pagina) {
          p.cerrar(true);
          p.el.getAnimations({ subtree: true }).forEach((a) => a.cancel());
          p.el.style.transform = '';
          p.el.style.borderRadius = '';
        }
        if (alTerminar) alTerminar();
      };
      if (haciaLaCarta && carta && carta.isConnected) {
        ponerCarta(false);
        s.ocupada = true;
        const x = piezasDeLaPagina();
        pgScroll.classList.add('apr-moviendo');
        pgScroll.classList.remove('apr-apartadas');
        setTimeout(() => pgScroll.classList.remove('apr-moviendo'), 460);
        encoger({ capa: p.el, caja: g.tel, destino: carta, radio: 20, pares: paresCon(carta, x), resto: carta.querySelector('.apr-siete') || !x.siete ? x.resto : [x.siete, ...x.resto], sello: x.sello, desde, alTerminar: fin });
      } else {
        pgScroll.classList.remove('apr-apartadas', 'apr-moviendo');
        if (quieto()) fin();
        else p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' }).onfinish = fin;
      }
    }

    /**
     * Arrastrar hacia abajo desde arriba de todo: `capa` sigue al dedo y, pasado el tope, `alSoltar(transform)` la
     * encoge hacia su origen (la página hacia la carta, el aviso abierto hacia el aviso). `puede()` dice si es su turno.
     */
    function tirarParaCerrar(scroll, capa, alSoltar, puede) {
      let t = null;
      const tope = 120;
      // También desde un aviso: de costado es del aviso (descartarlo) y hacia abajo, de la página.
      scroll.addEventListener('pointerdown', (ev) => {
        t = null;
        if ((ev.pointerType === 'mouse' && ev.button !== 0) || scroll.scrollTop > 0 || s.ocupada || !puede()) return;
        t = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, dy: 0 };
      });
      scroll.addEventListener('pointermove', (ev) => {
        if (!t || ev.pointerId !== t.id) return;
        const dy = ev.clientY - t.y0;
        const dx = ev.clientX - t.x0;
        if (!t.decidido) {
          if (dy < -6 || Math.abs(dx) > Math.abs(dy)) { t = null; return; }
          if (dy < 10) return;
          t.decidido = true;
          try { scroll.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual sigue */ }
        }
        t.dy = Math.max(0, dy - 10);
        const k = Math.min(1, t.dy / 600);
        capa.style.transform = `translateY(${(t.dy * 0.55).toFixed(1)}px) scale(${(1 - k * 0.1).toFixed(3)})`;
        capa.style.borderRadius = `${Math.min(24, t.dy * 0.2).toFixed(1)}px`;
      });
      const soltar = (ev) => {
        if (!t || ev.pointerId !== t.id) return;
        const x = t;
        t = null;
        if (!x.decidido) return;
        const ahora = capa.style.transform;
        capa.style.transform = '';
        capa.style.borderRadius = '';
        if (ev.type === 'pointerup' && x.dy > tope) alSoltar(ahora);
        else if (!quieto()) capa.animate([{ transform: ahora }, { transform: 'none' }], { duration: 300, easing: CURVA });
      };
      scroll.addEventListener('pointerup', soltar);
      scroll.addEventListener('pointercancel', soltar);
      // En el iPhone, arriba de todo el navegador se queda con el dedo si no se le dice nada.
      let toque = null;
      scroll.addEventListener('touchstart', (ev) => { const x = ev.touches[0]; toque = x && scroll.scrollTop <= 0 && puede() ? { x: x.clientX, y: x.clientY } : null; }, { passive: true });
      scroll.addEventListener('touchmove', (ev) => {
        const x = ev.touches[0];
        if (!toque || !x) return;
        const dy = x.clientY - toque.y;
        if (dy > 0 && dy > Math.abs(x.clientX - toque.x)) ev.preventDefault();
      }, { passive: false });
    }

    // ------------------------------------------------------------ los avisos de la página
    function pintarAviso(a, d) {
      const n = el('article', `apr-aviso ${a.tema}${a.limita ? ' limita' : ''}${a.chico ? ' chico' : ''}${a.anotado ? ' anotado' : ''}${a.abre ? ' abre' : ''}`);
      n.dataset.tema = a.tema;
      // La fase anotada conserva su color: es el dato.
      n.insertAdjacentHTML('beforeend', marcaDe(a, a.anotado ? 'limita' : ''));
      const cuerpo = el('div', 'apr-aviso-cuerpo');
      const etq = (texto) => cuerpo.appendChild(el('div', 'apr-aviso-etq', texto));
      const titulo = (texto) => cuerpo.appendChild(el('div', 'apr-aviso-titulo', texto));
      const texto = (t, clase) => cuerpo.appendChild(el('p', clase || 'apr-aviso-texto', t));
      if (a.tema === 'fatiga' && a.anotado) {
        // «Cuádriceps y glúteos, de ayer: faltan unos 2 días (estimado). ✓ Anotado: te sientes bien.»
        const x = d.aviso;
        const estimacion = x.estimacion.replace(/\(([^,;)]+)[,;][^)]*\)/, '($1)').replace(/^./, (c) => c.toLowerCase());
        const linea = el('p', 'apr-anotado');
        linea.append(el('b', null, x.corto), `: ${estimacion} `, el('span', null, `✓ ${tr('aviso.anotado')}`));
        cuerpo.appendChild(linea);
      } else if (a.tema === 'fatiga') {
        const x = d.aviso;
        etq(x.etiqueta);
        titulo(a.chico ? `${x.musculosTexto} · ${x.listo}` : x.musculosTexto);
        if (!a.chico) texto(x.hecho);
        // Qué hacer, con la flecha que lo abre.
        const accion = el('p', 'apr-aviso-accion');
        accion.appendChild(el('span', null, x.queHacerCorto));
        accion.insertAdjacentHTML('beforeend', ico('adelante'));
        cuerpo.appendChild(accion);
        if (!a.chico) {
          const fases = el('div', 'apr-aviso-fases');
          fases.innerHTML = M.fases(x.paso);
          fases.appendChild(el('span', null, x.listo));
          cuerpo.appendChild(fases);
        }
      } else if (a.tema === 'noche') {
        const noche = d.hoy.noche;
        etq(`${tr('aviso.noche')} · ${noche.texto}`);
        titulo(d.hoy.titulo);
        texto(d.hoy.texto);
        // La noche contra lo que necesitas (la frase dice «~8 h»), en una escala de 0 a 10 h.
        const m = noche.frase.match(/~\s*(\d+)\s*h(?:\s*(\d+)\s*min)?/);
        const necesita = m ? Number(m[1]) * 60 + Number(m[2] || 0) : 480;
        const pista = el('div', 'apr-pista-noche');
        pista.setAttribute('aria-hidden', 'true');
        const lleno = el('i');
        lleno.style.width = `${Math.min(100, (noche.minutos / 600) * 100).toFixed(1)}%`;
        const marca = el('b');
        marca.style.left = `${Math.min(100, (necesita / 600) * 100).toFixed(1)}%`;
        pista.append(lleno, marca);
        cuerpo.appendChild(pista);
        texto(noche.frase, 'apr-nota');
      } else if (a.tema === 'subir') {
        etq(tr('aviso.subir'));
        const filas = el('div', 'apr-subir');
        a.ejercicios.forEach((e) => {
          const f = el('div');
          const peso = el('b');
          peso.append(el('small', null, `${e.pesoTexto} →`), e.subeTexto);
          f.append(el('span', null, e.nombre), peso);
          filas.appendChild(f);
        });
        cuerpo.appendChild(filas);
        const cargados = d.aviso && d.aviso.pide ? d.aviso.musculos.map((m) => d.musculos.find((x) => x.id === m).nombre.toLowerCase()) : null;
        texto(cargados ? tr('aviso.sinCargados', { lista: enLaLista(cargados, g.idioma === 'en' ? 'or' : 'ni').replace(/,/g, g.idioma === 'en' ? ',' : ' ni') }) : conMayuscula(a.ejercicios[0].motivo) + '.');
      } else if (a.tema === 'musculo') {
        etq(a.musculo.estadoTexto);
        titulo(a.musculo.nombre);
        texto(a.musculo.sugerencia);
      } else if (a.tema === 'fuerza') {
        etq(conMayuscula(a.ejercicio.corto));
        titulo(a.ejercicio.nombre);
        texto(a.ejercicio.sinMarcaTexto || a.ejercicio.dato);
      } else if (a.tema === 'comoFue') {
        const c = d.sesion.comoFue;
        etq(tr('aviso.comoFue'));
        titulo(c.palabra);
        texto(c.porque);
        const caida = c.caidas && c.caidas[0];
        if (caida) {
          const reps = el('div', 'apr-reps');
          reps.setAttribute('aria-hidden', 'true');
          const max = Math.max(...caida.reps);
          caida.reps.forEach((r, i) => { const b = el('i'); b.style.height = `${(r / max) * 100}%`; b.style.setProperty('--i', i); reps.appendChild(b); });
          reps.appendChild(el('small', null, `${caida.reps.join(' · ')} ${caida.etiqueta}`));
          cuerpo.appendChild(reps);
        }
        texto(c.implica, 'apr-nota');
      } else if (a.tema === 'meta') {
        etq(tr('aviso.meta', { ejercicio: a.meta.nombre.toLowerCase() }));
        titulo(a.meta.llegas);
        texto(tr('aviso.antes', { antes: a.meta.antes }));
      }
      n.appendChild(cuerpo);
      if (a.abre) {
        n.tabIndex = 0;
        n.setAttribute('role', 'button');
        n.setAttribute('aria-label', `${d.aviso.musculosTexto}. ${tr('aviso.abrir')}`);
        n.addEventListener('click', () => abrirDetalle(n));
        n.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrirDetalle(n); } });
      }
      deslizable(n, a.tema);
      return n;
    }

    /** Deslizar de costado descarta el aviso: se va y los de abajo suben. */
    function deslizable(n, tema) {
      let t = null;
      let ultimo = -1e9;
      n.addEventListener('pointerdown', (ev) => {
        if (ev.pointerType === 'mouse' && ev.button !== 0) return;
        t = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, dx: 0, v: 0, ux: ev.clientX, ut: performance.now() };
      });
      n.addEventListener('pointermove', (ev) => {
        if (!t || ev.pointerId !== t.id) return;
        const dx = ev.clientX - t.x0;
        const dy = ev.clientY - t.y0;
        if (!t.decidido) {
          if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { t = null; return; }
          if (Math.abs(dx) < 8) return;
          t.decidido = true;
          n.classList.add('arrastrando');
          try { n.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual sigue */ }
        }
        ev.preventDefault();
        const ahora = performance.now();
        t.v = t.v * 0.6 + ((ev.clientX - t.ux) / Math.max(1, ahora - t.ut)) * 0.4;
        t.ux = ev.clientX;
        t.ut = ahora;
        t.dx = dx;
        n.style.transform = `translateX(${dx.toFixed(1)}px) rotate(${(dx * 0.015).toFixed(2)}deg)`;
        n.style.opacity = (1 - Math.min(0.75, Math.abs(dx) / (n.offsetWidth || 1))).toFixed(3);
      });
      const soltar = (ev) => {
        if (!t || ev.pointerId !== t.id) return;
        const x = t;
        t = null;
        if (!x.decidido) return;
        n.classList.remove('arrastrando');
        ultimo = performance.now();
        if (ev.type === 'pointerup' && (Math.abs(x.dx) > (n.offsetWidth || 1) * 0.3 || Math.abs(x.v) > 0.55)) descartar(n, tema, Math.sign(x.dx || x.v));
        else {
          const desde = n.style.transform;
          const op = n.style.opacity;
          n.style.transform = '';
          n.style.opacity = '';
          if (!quieto()) n.animate([{ transform: desde, opacity: op }, { transform: 'none', opacity: 1 }], { duration: 260, easing: CURVA });
        }
      };
      n.addEventListener('pointerup', soltar);
      n.addEventListener('pointercancel', soltar);
      // El toque que llega después de arrastrar no abre el aviso.
      n.addEventListener('click', (ev) => { if (performance.now() - ultimo < 350) { ev.stopImmediatePropagation(); ev.preventDefault(); } }, true);
    }
    function descartar(n, tema, lado = 1) {
      s.descartados.add(tema);
      s.yaDescarto = true;
      const lista = n.parentElement;
      const pista = p.el.querySelector('.apr-pista-aviso');
      const fin = () => {
        if (!n.isConnected) return;
        // Lo que había más abajo (un cuarto aviso) entra en su lugar.
        const d = diaDe();
        const ahora = avisosDe(d);
        const nuevo = ahora.find((x) => !lista.querySelector(`[data-tema="${x.tema}"]`));
        acomodar(lista.parentElement, () => {
          n.remove();
          if (pista) pista.remove();
          if (nuevo) { const m = pintarAviso(nuevo, d); lista.appendChild(m); entra(m); }
        });
        p.el.classList.toggle('calma', !ahora.length);
        if (!ahora.length) {
          // Sin avisos, el titular explica el día, como en un día en calma.
          const enc = p.el.querySelector('.apr-encabezado');
          if (enc && !enc.querySelector('.apr-hoytexto') && d.hoy.texto) { const t2 = el('p', 'apr-hoytexto', d.hoy.texto); enc.appendChild(t2); entra(t2, 120); }
        }
        if (carta && carta.isConnected) ponerCarta(false);
        if (tarjeta && tarjeta.isConnected) ponerTarjeta(false);
      };
      if (quieto()) { fin(); return; }
      const desde = n.style.transform || 'none';
      const op = n.style.opacity || '1';
      n.style.transform = '';
      n.style.opacity = '';
      const ancho = (n.offsetWidth || 300) * 1.15;
      n.animate([{ transform: desde, opacity: op }, { transform: `translateX(${lado * ancho}px) rotate(${lado * 4}deg)`, opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = () => {
        // Después de irse, su lugar se cierra: los de abajo suben.
        const h = n.offsetHeight;
        n.style.visibility = 'hidden';
        n.animate([{ height: `${h}px`, marginBottom: '0px' }, { height: '0px', marginBottom: '-10px', paddingTop: '0px', paddingBottom: '0px', borderWidth: '0px' }], { duration: 240, easing: CURVA, fill: 'forwards' }).onfinish = fin;
        if (pista) pista.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
      };
    }

    function bloqueNueva(d) {
      const x = d.nueva;
      const caja = el('section', 'apr-nueva');
      caja.appendChild(el('p', 'apr-nueva-texto', x.texto));
      const lista = el('ol', 'apr-hitos');
      let i = 0;
      const aqui = () => { const li = el('li', 'apr-aqui'); li.style.setProperty('--i', i++); li.append(el('i'), el('span', null, x.aqui)); lista.appendChild(li); };
      if (!x.alcanzados) aqui();
      x.hitos.forEach((h, k) => {
        const li = el('li', h.alcanzado ? 'alcanzado' : '');
        li.style.setProperty('--i', i++);
        li.append(el('i'), el('b', null, h.cuando), el('span', null, h.que));
        lista.appendChild(li);
        if (k === x.alcanzados - 1) aqui();
      });
      caja.appendChild(lista);
      return caja;
    }

    // ------------------------------------------------------------ las partes plegadas
    function partes(d) {
      const caja = el('div', 'apr-partes');
      (d.nueva ? ['hoy', 'semana', 'metas', 'base'] : ['hoy', 'semana', 'fuerza', 'metas', 'anio', 'base']).forEach((k) => caja.appendChild(parte(k, d)));
      return caja;
    }
    function cabezaDe(k, d) {
      if (k === 'hoy') {
        // El rótulo es solo el nombre de la parte; la sesión y su hora van en la línea, que se lee. Hoy descansa: mañana.
        if (!d.sesion) return d.siguiente ? [tr('partes.manana'), `${d.siguiente.nombre} · ${d.siguiente.hora}`, ''] : [tr('partes.hoy'), d.hoy.titulo, ''];
        const ses = d.sesion;
        const flechas = `<span class="apr-flechas" aria-hidden="true">${ses.ejercicios.map((e) => `<b class="${e.decision === 'sube' ? 'sube' : ''}">${e.flecha || '·'}</b>`).join('')}</span>`;
        if (ses.estado === 'hecha') return [tr('partes.hoy'), `${ses.nombre} · ${ses.duracion}${ses.comoFue ? ` · ${tr('comoFue', { palabra: ses.comoFue.palabra })}` : ''}`, flechas];
        return [tr('partes.hoy'), `${ses.nombre} · ${ses.hora} · ${ses.resumen}`, flechas];
      }
      if (k === 'semana') return [d.semana.titulo, d.semana.resumen, tiraChica(d)];
      if (k === 'fuerza') {
        const c = d.fuerza.cuentas;
        const resumen = ['sube', 'sinSubidaClara', 'bajo', 'noSeSabe'].filter((x) => c[x]).slice(0, 3).map((x) => trPlural('fuerza.' + x, c[x])).join(' · ');
        return [d.fuerza.titulo, resumen, fuerzaChica(d)];
      }
      if (k === 'metas') {
        const lista = d.metas.lista;
        const enCamino = lista.find((x) => x.ventanaCorta);
        const enFrase = (x) => x.replace(/\s*\(.*\)/, '').replace(/\.$/, '').replace(/^./, (c) => c.toLowerCase());
        const resumen = enCamino ? tr('metaResumen', { ejercicio: enCamino.nombre, ventana: enCamino.ventanaCorta }) : lista[0] ? `${lista[0].nombre}: ${enFrase(lista[0].llevas || lista[0].hoy)}` : d.metas.ninguna;
        return [d.metas.titulo, resumen, metasChica(d)];
      }
      if (k === 'anio') return [d.anio.titulo, d.anio.mapa, anioChico(d)];
      return ['', d.base.titulo, ''];
    }
    function parte(k, d) {
      const abierta = s.abiertas.has(k);
      const [etq, resumen, dibujo] = cabezaDe(k, d);
      const n = el('section', `apr-parte ${k}${abierta ? ' abierta' : ''}${etq ? '' : ' solo'}`);
      n.dataset.parte = k;
      const fila = boton('apr-parte-fila', '', () => alternar(n, k));
      fila.setAttribute('aria-expanded', String(abierta));
      if (etq) {
        const arriba = el('span', 'apr-parte-arriba');
        arriba.appendChild(el('span', 'apr-parte-etq', etq));
        if (dibujo) { const dib = el('span', 'apr-parte-dibujo'); dib.innerHTML = dibujo; arriba.appendChild(dib); }
        fila.appendChild(arriba);
      }
      fila.appendChild(el('span', 'apr-parte-resumen', resumen));
      fila.insertAdjacentHTML('beforeend', ico('abajo'));
      const dentro = el('div', 'apr-parte-dentro');
      dentro.hidden = !abierta;
      if (abierta) dentro.appendChild(contenidoDe(k, d));
      n.append(fila, dentro);
      return n;
    }
    /** Se despliega en su lugar y empuja lo de abajo; plegarla lo trae de vuelta. */
    function alternar(n, k) {
      const dentro = n.querySelector('.apr-parte-dentro');
      const fila = n.querySelector('.apr-parte-fila');
      const abrirla = !s.abiertas.has(k);
      if (abrirla) s.abiertas.add(k); else s.abiertas.delete(k);
      n.classList.toggle('abierta', abrirla);
      fila.setAttribute('aria-expanded', String(abrirla));
      dentro.getAnimations().forEach((a) => a.cancel());
      if (abrirla) {
        if (!dentro.firstChild) dentro.appendChild(contenidoDe(k, diaDe()));
        dentro.hidden = false;
        if (quieto()) return;
        const h = dentro.scrollHeight;
        dentro.animate([{ height: '0px', opacity: 0 }, { height: `${h}px`, opacity: 1 }], { duration: 360, easing: CURVA });
        dentro.firstChild.animate([{ transform: 'translateY(-8px)' }, { transform: 'none' }], { duration: 360, easing: CURVA });
        // Si lo que se abrió queda abajo de la pantalla, se baja suave hasta verlo.
        const sc = n.closest('.apr-scroll');
        const r = n.getBoundingClientRect();
        const c = sc.getBoundingClientRect();
        const cuanto = Math.min(r.top + 64 + Math.min(h, 260) - (c.bottom - 120), r.top - c.top - 90);
        if (cuanto > 0) sc.scrollBy({ top: cuanto, behavior: 'smooth' });
      } else {
        if (quieto()) { dentro.hidden = true; return; }
        const h = dentro.offsetHeight;
        dentro.animate([{ height: `${h}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 280, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }).onfinish = () => { if (!s.abiertas.has(k)) dentro.hidden = true; };
      }
    }
    function contenidoDe(k, d) {
      const caja = el('div', 'apr-dentro-' + k);
      ({ hoy: contenidoHoy, semana: contenidoSemana, fuerza: contenidoFuerza, metas: contenidoMetas, anio: contenidoAnio, base: contenidoBase })[k](d, caja);
      return caja;
    }

    // ---- los dibujos de cada línea
    function tiraChica(d) {
      const W = 88;
      const H = 18;
      const e = d.semana.escala;
      const X = (v) => 3 + Math.min(1, v / e.tope) * (W - 6);
      const COLOR = { poco: 'rgba(239,230,207,0.5)', mucho: '#f0c48a' };
      const puntos = d.musculos.map((m) => {
        const cx = X(m.seriesExactas).toFixed(1);
        return m.estado === 'sinEntrenar'
          ? `<circle cx="${cx}" cy="${H / 2}" r="2.3" fill="none" stroke="rgba(239,230,207,0.6)" stroke-width="1"/>`
          : `<circle cx="${cx}" cy="${H / 2}" r="2.6" fill="${COLOR[m.estado] || '#efe6cf'}" fill-opacity="0.9"/>`;
      }).join('');
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><rect x="${X(e.desde).toFixed(1)}" y="1" width="${(X(e.hasta) - X(e.desde)).toFixed(1)}" height="${H - 2}" rx="3" fill="rgba(239,230,207,0.1)"/><path d="M2 ${H / 2}H${W - 2}" stroke="rgba(239,230,207,0.18)" stroke-width="1"/>${puntos}</svg>`;
    }
    function fuerzaChica(d) {
      const orden = { sube: 0, sinSubidaClara: 1, bajo: 2, noSeSabe: 3 };
      const lista = [...d.fuerza.ejercicios].sort((a, b) => orden[a.estado] - orden[b.estado]);
      const glifo = (e, i) => {
        const x = 6 + i * 14;
        if (e.estado === 'sube') return `<circle cx="${x}" cy="7" r="4.4" fill="#efe6cf"/>`;
        if (e.estado === 'sinSubidaClara') return `<circle cx="${x}" cy="7" r="4" fill="none" stroke="#efe6cf" stroke-width="1.3"/><path d="M${x - 2.6} 7H${x + 2.6}" stroke="#efe6cf" stroke-width="1.3"/>`;
        if (e.estado === 'bajo') return `<circle cx="${x}" cy="7" r="4.4" fill="#cb8569"/>`;
        return `<circle cx="${x}" cy="7" r="4" fill="none" stroke="rgba(239,230,207,0.5)" stroke-width="1.2" stroke-dasharray="1.6 1.6"/>`;
      };
      const W = 12 + (lista.length - 1) * 14;
      return `<svg viewBox="0 0 ${W} 14" width="${W}" height="14" aria-hidden="true">${lista.map(glifo).join('')}</svg>`;
    }
    function metasChica(d) {
      const lista = d.metas.lista.slice(0, 3);
      if (!lista.length) return '';
      const W = 88;
      const color = (x) => (x.estado === 'noSube' ? '#cb8569' : x.estado === 'noSeSabe' ? 'rgba(239,230,207,0.4)' : '#efe6cf');
      const barras = lista.map((x, i) => {
        const y = 2 + i * 6;
        const largo = Math.max(4, (x.avance == null ? 0.1 : Math.min(1, x.avance)) * W);
        return `<rect x="0" y="${y}" width="${W}" height="3" rx="1.5" fill="rgba(239,230,207,0.12)"/><rect x="0" y="${y}" width="${largo.toFixed(1)}" height="3" rx="1.5" fill="${color(x)}"/>`;
      }).join('');
      return `<svg viewBox="0 0 ${W} ${4 + lista.length * 6}" width="${W}" height="${4 + lista.length * 6}" aria-hidden="true">${barras}</svg>`;
    }
    function anioChico(d) {
      const L = 4.6;
      const S = 1.6;
      const cuadros = d.anio.recientes.map((x, i) => {
        const fila = i < 14 ? 0 : 1;
        const col = i % 14;
        const color = x.grupo ? d.anio.colores[x.grupo] : 'rgba(239,230,207,0.1)';
        return `<rect x="${(col * (L + S)).toFixed(1)}" y="${(fila * (L + S)).toFixed(1)}" width="${L}" height="${L}" rx="1" fill="${color}"${x.hoy ? ' stroke="#efe6cf" stroke-width="0.8"' : ''}/>`;
      }).join('');
      const W = 14 * (L + S) - S;
      return `<svg viewBox="0 0 ${W.toFixed(1)} ${(2 * L + S).toFixed(1)}" width="${W.toFixed(0)}" height="${(2 * L + S).toFixed(0)}" aria-hidden="true">${cuadros}</svg>`;
    }

    // ---- lo de adentro de cada parte
    function contenidoHoy(d, caja) {
      if (!d.sesion) {
        const entreno = d.sugerencias.find((x) => x.tipo === 'entreno');
        if (entreno) caja.appendChild(el('p', 'apr-texto', entreno.texto));
        if (d.siguiente) {
          const m = el('div', 'apr-manana');
          m.append(el('span', null, conMayuscula(d.siguiente.musculosTexto)), figuras(d, 'hoy', 'apr-carta-figuras'));
          caja.appendChild(m);
        }
      } else {
        const lista = el('div', 'apr-ejercicios');
        d.sesion.ejercicios.forEach((e) => lista.appendChild(filaDeEjercicio(e, d)));
        caja.appendChild(lista);
      }
      const otras = d.sugerencias.filter((x) => x.tipo !== 'entreno');
      if (otras.length) {
        const sugs = el('div', 'apr-sugs');
        otras.forEach((x) => { const f = el('div', 'apr-sug'); f.innerHTML = ico(x.tipo === 'comida' ? 'comida' : 'sueno'); f.appendChild(el('span', null, x.texto)); sugs.appendChild(f); });
        caja.appendChild(sugs);
      }
    }
    function filaDeEjercicio(e, d, fijo) {
      const hecha = d.sesion && d.sesion.estado === 'hecha';
      const abierta = s.ejercicio === e.id;
      const f = el(fijo ? 'div' : 'button', `apr-ej ${e.decision || ''}${abierta ? ' abierta' : ''}`);
      if (!fijo) f.type = 'button';
      const nombre = el('span', 'apr-ej-nombre');
      // En el aviso abierto, el porqué va en la misma línea que las series: no hay nada que tocar.
      nombre.append(el('b', null, e.nombre), el('small', null, fijo ? `${e.plan} · ${e.motivo}` : hecha ? e.hecho : e.plan));
      f.append(el('span', `apr-ej-flecha ${e.decision === 'sube' ? 'sube' : ''}`, e.flecha || '·'), nombre, el('span', 'apr-ej-peso', e.corto || e.motivo));
      if (fijo) return f;
      const porque = el('p', 'apr-ej-porque');
      porque.appendChild(el('span', null, e.proxima));
      porque.hidden = !abierta;
      f.appendChild(porque);
      f.setAttribute('aria-expanded', String(abierta));
      f.addEventListener('click', () => {
        const otra = f.parentElement.querySelector('.apr-ej.abierta');
        if (otra && otra !== f) plegarPorque(otra);
        if (f.classList.contains('abierta')) { plegarPorque(f); s.ejercicio = null; return; }
        s.ejercicio = e.id;
        f.classList.add('abierta');
        f.setAttribute('aria-expanded', 'true');
        porque.hidden = false;
        if (!quieto()) porque.animate([{ height: '0px', opacity: 0 }, { height: `${porque.scrollHeight}px`, opacity: 1 }], { duration: 260, easing: CURVA });
      });
      return f;
    }
    function plegarPorque(f) {
      const porque = f.querySelector('.apr-ej-porque');
      f.classList.remove('abierta');
      f.setAttribute('aria-expanded', 'false');
      if (quieto()) { porque.hidden = true; return; }
      porque.animate([{ height: `${porque.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 200, easing: 'ease-in' }).onfinish = () => { if (!f.classList.contains('abierta')) porque.hidden = true; };
    }

    function contenidoSemana(d, caja) {
      const arriba = el('div', 'apr-sem-arriba');
      const leyenda = el('ul', 'apr-leyenda');
      const estados = d.semana.primera ? [...new Set(d.musculos.map((m) => m.estado))].map((k) => ({ estado: k, nombre: d.musculos.find((m) => m.estado === k).estadoTexto })) : d.semana.leyenda;
      estados.forEach((x) => { const li = el('li', x.estado); li.append(el('i'), el('span', null, x.nombre)); leyenda.appendChild(li); });
      arriba.append(figuras(d, 'semana', 'apr-sem-fig'), leyenda);
      caja.appendChild(arriba);
      if (d.semana.primera) caja.appendChild(el('p', 'apr-nota', d.semana.resumen));
      caja.appendChild(tira(d));
      if (!d.semana.primera) {
        const r = d.semana.rutina;
        const rutina = el('div', 'apr-rutina');
        const titulo = el('b');
        titulo.append(`${r.titulo}: `, el('em', null, r.palabra));
        const ul = el('ul');
        r.mejoras.forEach((x) => ul.appendChild(el('li', null, x)));
        rutina.append(titulo, ul);
        caja.appendChild(rutina);
      }
      caja.appendChild(el('p', 'apr-nota', d.semana.anotas));
    }
    /**
     * La tira de puntos: los 14 músculos en una escala de 0 a 30 series, con la franja de 10 a 20; solo llevan nombre
     * los que se salen (los más importantes hoy, sin pisarse). Tocar un punto dice qué le pasa.
     */
    function tira(d) {
      const W = 320;
      const IZQ = 8;
      const DER = W - 8;
      const EJE = 62;
      const e = d.semana.escala;
      const X = (v) => IZQ + Math.min(1, v / e.tope) * (DER - IZQ);
      const CARRILES = [0, -11, 11, -22, 22];
      const ultimos = CARRILES.map(() => -1e9);
      const puestos = [...d.musculos].sort((a, b) => a.seriesExactas - b.seriesExactas).map((m) => {
        const x = X(m.seriesExactas);
        let k = ultimos.findIndex((v) => x - v >= 10);
        if (k < 0) k = 0;
        ultimos[k] = x;
        return { m, x, y: EJE + CARRILES[k] };
      });
      // Los rótulos: los que se salen, de lo que más importa hoy a lo que menos, en dos renglones sin pisarse.
      const fuera = d.semana.destacados.filter((id) => { const m = d.musculos.find((x) => x.id === id); return m.estado !== 'enSuPunto' && m.estado !== 'entrenado'; });
      const ocupados = [[], []];
      const rotulos = [];
      fuera.forEach((id) => {
        if (rotulos.length >= 3) return;
        const pto = puestos.find((x) => x.m.id === id);
        const texto = `${pto.m.nombre} ${pto.m.series}`;
        const ancho = texto.length * 6.4 + 6;
        const izq = pto.x < W * 0.62 ? pto.x - 4 : pto.x - ancho + 4;
        const fila = [0, 1].find((r) => ocupados[r].every(([a, b]) => izq + ancho < a - 6 || izq > b + 6));
        if (fila == null) return;
        ocupados[fila].push([izq, izq + ancho]);
        rotulos.push({ pto, texto, izq, fila });
      });
      if (s.musculo == null || !d.musculos.some((m) => m.id === s.musculo)) s.musculo = rotulos[0] ? rotulos[0].pto.m.id : d.musculos[0].id;
      const caja = el('div', 'apr-tira');
      const dibujar = () => {
        let svg = `<rect class="banda" x="${X(e.desde).toFixed(1)}" y="${EJE - 28}" width="${(X(e.hasta) - X(e.desde)).toFixed(1)}" height="56" rx="6"/>`;
        svg += `<path class="eje" d="M${IZQ} ${EJE + 34}H${DER}"/>`;
        [[0, ''], [e.desde, 'medio'], [e.hasta, 'medio'], [e.tope, '']].forEach(([v, c]) => { svg += `<text class="num ${c}" x="${X(v).toFixed(1)}" y="${EJE + 48}" text-anchor="${v === 0 ? 'start' : v === e.tope ? 'end' : 'middle'}">${v}</text>`; });
        rotulos.forEach((r) => {
          const y = r.fila === 0 ? 12 : 26;
          svg += `<path class="guia" d="M${r.pto.x.toFixed(1)} ${y + 4}V${(r.pto.y - 6).toFixed(1)}"/>`;
          svg += `<text class="rotulo" x="${(r.pto.x < W * 0.62 ? r.izq + 4 : r.izq + (r.texto.length * 6.4 + 2)).toFixed(1)}" y="${y}" text-anchor="${r.pto.x < W * 0.62 ? 'start' : 'end'}">${escapar(r.texto)}</text>`;
        });
        puestos.forEach(({ m, x, y }) => {
          svg += `<circle class="punto ${m.estado}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4"/>`;
          if (m.fatiga.dias > 0) svg += `<circle class="aro" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/>`;
          if (m.id === s.musculo) svg += `<circle class="elegido" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8.5"/>`;
        });
        puestos.forEach(({ m, x, y }) => { svg += `<circle class="toque" data-musculo="${m.id}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"><title>${escapar(m.nombre)}</title></circle>`; });
        return `<svg viewBox="0 0 ${W} ${EJE + 54}" role="img" aria-label="${escapar(tr('tiraEtq'))}">${svg}</svg>`;
      };
      const detalle = el('p', 'apr-tira-detalle');
      detalle.setAttribute('aria-live', 'polite');
      const ponerDetalle = () => {
        const m = d.musculos.find((x) => x.id === s.musculo);
        // Sin entrenar, la sugerencia ya dice los 7 días.
        detalle.replaceChildren(el('b', null, m.nombre), m.estado === 'sinEntrenar' && m.sugerencia ? ` · ${m.sugerencia}` : ` · ${m.seriesTexto}. ${m.sugerencia || ''}`);
      };
      caja.innerHTML = dibujar();
      caja.appendChild(detalle);
      ponerDetalle();
      caja.addEventListener('click', (ev) => {
        const c = ev.target.closest('[data-musculo]');
        if (!c) return;
        s.musculo = c.dataset.musculo;
        caja.firstElementChild.outerHTML = dibujar();
        ponerDetalle();
        if (!quieto()) detalle.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220 });
      });
      return caja;
    }

    function contenidoFuerza(d, caja) {
      const f = d.fuerza;
      if (f.vacio) { caja.appendChild(el('p', 'apr-texto', f.vacio)); return; }
      caja.appendChild(el('p', 'apr-texto', f.texto));
      f.ejercicios.forEach((e) => {
        const fila = el('div', 'apr-fz ' + e.estado);
        const textos = el('div', 'apr-fz-textos');
        textos.append(el('b', null, e.nombre), el('span', null, e.veredicto), el('small', null, e.sinMarcaTexto || e.dato));
        const chispa = el('div', 'apr-fz-chispa');
        chispa.innerHTML = M.chispa(e, { ancho: 112, alto: 40 });
        fila.append(textos, chispa);
        if ((e.estancado || e.bajo) && window.PorQueNoMejoro) fila.appendChild(boton('apr-porque', `<span>${tr('porQue')}</span>${ico('adelante')}`, () => aPorQue(e.id)));
        caja.appendChild(fila);
      });
      if (f.ruido) caja.appendChild(el('p', 'apr-nota', f.ruido));
    }
    // «¿Por qué no estás mejorando?» es otra propuesta: al volver con «‹», esta página queda como estaba.
    function aPorQue(id) {
      const sc = p.el.querySelector('.apr-scroll');
      s.volviendo = { abiertas: new Set(s.abiertas), arriba: sc ? sc.scrollTop : 0, dia: s.dia, vista: s.vista, descartados: new Set(s.descartados), respuestas: Object.assign({}, s.respuestas) };
      window.PorQueNoMejoro.abrir(id);
    }

    function contenidoMetas(d, caja) {
      const lista = d.metas.lista;
      if (!lista.length) { caja.appendChild(el('p', 'apr-texto', d.metas.ninguna)); return; }
      lista.forEach((x) => {
        const n = el('div', 'apr-meta ' + x.estado);
        const cab = el('div', 'apr-meta-cab');
        cab.append(el('b', null, x.nombre), el('span', null, x.objetivo));
        n.appendChild(cab);
        if (x.avance != null) {
          const pista = el('div', 'apr-meta-pista');
          const lleno = el('i');
          lleno.style.width = `${(Math.min(1, x.avance) * 100).toFixed(1)}%`;
          pista.append(lleno, el('em'));
          n.appendChild(pista);
        }
        if (x.hoy) n.appendChild(el('p', null, x.hoy));
        if (x.llegas) n.appendChild(el('p', 'llega', x.llegas));
        // «Mira “Por qué puedes estar estancado”» señala la sección de antes: acá la puerta va justo debajo.
        const conPuerta = x.estado === 'noSube' && window.PorQueNoMejoro;
        if (x.estadoTexto) n.appendChild(el('p', null, conPuerta ? x.estadoTexto.replace(/\s*(Mira «[^»]*»|See “[^”]*”)\.?$/, '') : x.estadoTexto));
        if (x.falta) n.appendChild(el('p', null, x.falta));
        if (x.llevas) n.appendChild(el('p', null, x.llevas));
        const mejorar = x.estado === 'enCamino' ? (x.pasos || []).filter((y) => y.estado === 'mejorar') : [];
        if (mejorar.length) {
          n.appendChild(el('div', 'apr-mini-etq', tr('paraLlegar'))).style.marginTop = '10px';
          const ul = el('ul', 'apr-meta-pasos');
          mejorar.forEach((y) => { const li = el('li'); li.append(el('i', null, y.marca), el('span', null, y.texto)); ul.appendChild(li); });
          n.appendChild(ul);
        }
        if (conPuerta) n.appendChild(boton('apr-porque', `<span>${tr('porQue')}</span>${ico('adelante')}`, () => aPorQue(x.id)));
        caja.appendChild(n);
      });
      if (d.metas.comer) caja.appendChild(el('p', 'apr-nota', d.metas.comer));
    }

    function contenidoAnio(d, caja) {
      const a = d.anio;
      const mapa = el('div', 'apr-anio-mapa');
      mapa.innerHTML = M.mapaDelAnio(a);
      const detalle = el('p', 'apr-anio-detalle', a.detalle(s.diaDelAnio || a.hoy));
      detalle.setAttribute('aria-live', 'polite');
      const elegir = (fecha) => {
        mapa.querySelectorAll('.elegido').forEach((r) => r.classList.remove('elegido'));
        const r = mapa.querySelector(`[data-fecha="${fecha}"]`);
        if (r) r.classList.add('elegido');
      };
      if (s.diaDelAnio) elegir(s.diaDelAnio);
      mapa.addEventListener('click', (ev) => {
        const r = ev.target.closest('[data-fecha]');
        if (!r || r.classList.contains('futuro')) return;
        s.diaDelAnio = r.dataset.fecha;
        elegir(s.diaDelAnio);
        detalle.textContent = a.detalle(s.diaDelAnio);
        if (!quieto()) detalle.animate([{ opacity: 0.2, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
      });
      const leyenda = el('ul', 'apr-anio-leyenda');
      a.leyenda.filter((x) => x.color).forEach((x) => { const li = el('li'); const i = el('i'); i.style.background = x.color; li.append(i, x.nombre); leyenda.appendChild(li); });
      const ultimas = el('ul', 'apr-anio-ultimas');
      a.ultimas.slice(0, 3).forEach((x) => { const li = el('li'); const i = el('i'); i.style.background = x.color || '#efe6cf'; li.append(i, el('span', null, x.texto), el('small', null, x.cuando)); ultimas.appendChild(li); });
      caja.append(mapa, detalle, leyenda, el('div', 'apr-mini-etq', a.ultimasTitulo), ultimas);
      caja.querySelector('.apr-mini-etq').style.marginTop = '16px';
    }

    function contenidoBase(d, caja) {
      caja.classList.add('apr-base');
      const b = d.base;
      [['musculos', d.semana.titulo], ['fatigados', d.fatiga.titulo], ['estancados', d.fuerza.estancados.titulo], ['porQue', tx('ascent.porQue.titulo')], ['metas', d.metas.titulo]].forEach(([k, titulo]) => {
        const lista = Array.isArray(b[k]) ? b[k] : b[k] ? [b[k]] : [];
        if (!lista.length) return;
        caja.appendChild(el('h4', null, titulo));
        lista.forEach((x) => caja.appendChild(el('p', 'apr-nota', x)));
      });
    }

    // ------------------------------------------------------------ el aviso abierto
    function abrirDetalle(origen, { sinCrecer } = {}) {
      if (s.detalle || s.ocupada) return;
      const d = diaDe();
      const a = d.aviso;
      if (!a) return;
      const capa = el('section', 'apr-detalle');
      capa.setAttribute('role', 'dialog');
      capa.setAttribute('aria-label', a.musculosTexto);
      const luz = el('div', 'apr-pagina-luz');
      luz.setAttribute('aria-hidden', 'true');
      const scroll = el('div', 'apr-scroll');
      const cab = el('header', 'apr-det-cab');
      const volver = boton('apr-volver', `${ico('atras')}<span>${tr('pagina')}</span>`, () => cerrarDetalle(), tx('comun.atras'));
      cab.appendChild(volver);
      const titulo = el('div', 'apr-det-titulo');
      titulo.innerHTML = `<span class="apr-marca" aria-hidden="true">${M.fase(a.paso)}</span>`;
      const h = el('h2', null, a.musculosTexto);
      titulo.appendChild(h);
      const etq = el('div', 'apr-det-etq', a.etiqueta);
      // Solo esas zonas, de cerca: las piernas de frente y de espalda.
      const estados = {};
      a.musculos.forEach((m) => { estados[m] = a.fase; });
      const figs = el('div', 'apr-det-figuras');
      figs.setAttribute('aria-hidden', 'true');
      figs.innerHTML = (M.figura('frente', estados) + M.figura('espalda', estados)).replace(/viewBox="0 0 100 188"/g, 'viewBox="22 82 56 88"');
      const bloque = (etiqueta, ...hijos) => { const b = el('section', 'apr-det-bloque'); b.appendChild(el('div', 'apr-mini-etq', etiqueta)); hijos.filter(Boolean).forEach((x) => b.appendChild(x)); return b; };
      const fases = el('div', 'apr-det-fases');
      fases.setAttribute('role', 'img');
      fases.setAttribute('aria-label', d.fatiga.fases[a.paso].nombre);
      d.fatiga.fases.forEach((f) => { const sp = el('span', f.paso === a.paso ? 'actual' : ''); sp.innerHTML = M.fase(f.paso); sp.appendChild(el('span', null, f.nombre)); fases.appendChild(sp); });
      const deHoy = d.sesion.ejercicios.filter((e) => e.principal.some((m) => a.musculos.includes(m)));
      const sesion = el('div', 'apr-ejercicios apr-det-sesion');
      deHoy.forEach((e) => sesion.appendChild(filaDeEjercicio(e, d, true)));
      const botones = el('div', 'apr-det-botones');
      // «Entendido» lo descarta; «Me siento bien» lo anota y lo deja en una línea con el dato.
      botones.append(
        boton('apr-boton principal', a.respuestas[0], () => cerrarDetalle(() => { if (origen && origen.isConnected) descartar(origen, 'fatiga', 1); })),
        boton('apr-boton', a.respuestas[1], () => cerrarDetalle(() => { s.respuestas.fatiga = 'bien'; if (origen && origen.isConnected) anotar(origen); })),
      );
      scroll.append(...[cab, titulo, etq, figs,
        bloque(tr('detalle.pasado'), el('p', null, a.hecho)),
        bloque(tr('detalle.estima'), fases, el('p', null, a.estimacion), el('p', null, `${conMayuscula(a.listo)}.`)),
        bloque(tr('detalle.hacer'), el('p', null, a.queHacer)),
        deHoy.length ? bloque(tr('detalle.sesion'), sesion) : null,
        el('p', 'apr-nota', a.sinRir ? `${d.fatiga.comoSeCalcula} ${a.sinRir}` : d.fatiga.comoSeCalcula),
        botones].filter(Boolean));
      capa.append(luz, scroll);
      p.el.appendChild(capa);
      s.detalle = { capa, origen };
      Detalles.franja(capa, scroll, '7, 10, 22');
      tirarParaCerrar(scroll, capa, (desde) => cerrarDetalle(null, desde), () => s.detalle && s.detalle.capa === capa);
      const resto = [volver, etq, figs, ...scroll.querySelectorAll('.apr-det-bloque'), scroll.querySelector('.apr-nota'), botones].filter(Boolean);
      if (!sinCrecer && origen && origen.isConnected) {
        s.ocupada = true;
        crecer({ capa, caja: p.el, origen, radio: 18, pares: [[origen.querySelector('.apr-aviso-titulo'), h], [origen.querySelector('.apr-marca'), titulo.querySelector('.apr-marca')]], resto });
        setTimeout(() => { s.ocupada = false; }, 460);
      } else if (!quieto()) capa.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
    }
    /** Cierra el aviso abierto encogiéndolo hacia el aviso; `desde`: el transform con que lo dejó el dedo. */
    function cerrarDetalle(alTerminar, desde) {
      const x = s.detalle;
      if (!x || s.ocupada) return;
      const fin = () => { x.capa.remove(); s.detalle = null; s.ocupada = false; if (alTerminar) alTerminar(); };
      const origen = x.origen && x.origen.isConnected ? x.origen : null;
      s.ocupada = true;
      const sc = x.capa.querySelector('.apr-scroll');
      const resto = [...sc.children].filter((n) => !n.classList.contains('apr-det-titulo'));
      encoger({ capa: x.capa, caja: p.el, destino: origen, radio: 18, pares: origen ? [[origen.querySelector('.apr-aviso-titulo'), sc.querySelector('.apr-det-titulo h2')], [origen.querySelector('.apr-marca'), sc.querySelector('.apr-det-titulo .apr-marca')]] : [], resto, desde, alTerminar: fin });
    }
    /** «Me siento bien»: el aviso se achica a una línea con el dato y lo anotado; lo de abajo sube acompañándolo. */
    function anotar(n) {
      const d = diaDe();
      const a = avisosDe(d).find((x) => x.tema === 'fatiga');
      if (!a) return;
      const nuevo = pintarAviso(a, d);
      const antes = n.offsetHeight;
      n.replaceWith(nuevo);
      if (carta && carta.isConnected) ponerCarta(false);
      if (tarjeta && tarjeta.isConnected) ponerTarjeta(false);
      if (quieto()) return;
      nuevo.animate([{ height: `${antes}px` }, { height: `${nuevo.offsetHeight}px` }], { duration: 420, easing: CURVA });
      nuevo.querySelector('.apr-aviso-cuerpo').animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 120, easing: CURVA, fill: 'backwards' });
    }
    function cerrarDetalleYa() {
      if (!s.detalle) return;
      s.detalle.capa.remove();
      s.detalle = null;
    }

    // ------------------------------------------------------------ el teléfono
    function mostrarBloqueo() {
      const d = diaDe();
      const a = d.aviso;
      const n = bl.el;
      if (typeof FONDOS_WIDGETS !== 'undefined' && FONDOS_WIDGETS && FONDOS_WIDGETS.noche) n.style.backgroundImage = `url(${FONDOS_WIDGETS.noche})`;
      // Suena 90 minutos antes de la sesión.
      const [hh, mm] = d.sesion.hora.split(':').map(Number);
      const reloj = el('div', 'apr-bl-reloj');
      reloj.append(el('span', null, conMayuscula(u.fechaLarga(d.fecha))), el('b', null, u.horaMin(hh * 60 + mm - 90)));
      const noti = boton('apr-bl-noti', '', () => desdeElTelefono());
      const icono = el('i');
      if (typeof TIENDA !== 'undefined' && TIENDA && TIENDA.icono) icono.style.backgroundImage = `url(${TIENDA.icono})`;
      const textos = el('div');
      const arriba = el('div', 'apr-bl-arriba');
      arriba.append(el('b', null, a.notificacion.titulo), el('em', null, tr('telefono.ahora')));
      textos.append(arriba, el('p', null, a.notificacion.texto));
      noti.append(icono, textos);
      n.replaceChildren(el('div', 'apr-bl-isla'), reloj, noti, el('div', 'apr-bl-barra'));
      bl.abrir();
    }
    // Tocar el aviso abre Moss donde importa: la página de Fuerza con el aviso abierto.
    function desdeElTelefono() {
      bl.cerrar();
      s.conTarjeta = false;
      g.irA(2, true);
      g.secciones.progreso.subir();
      ponerCarta(false);
      abrirPagina({});
      setTimeout(() => { const n = p.el.querySelector('.apr-aviso.fatiga'); if (n && s.abierta) abrirDetalle(n); }, quieto() ? 0 : 380);
    }

    // ------------------------------------------------------------ lo que mira mientras está abierta
    // Progreso e Inicio se vuelven a pintar enteros: si pierden la carta o la tarjeta, se ponen de nuevo, sin animar.
    const mirarProgreso = new MutationObserver(() => { if (s.abierta && (!carta || !carta.isConnected)) ponerCarta(false); });
    const mirarInicio = new MutationObserver(() => { if (s.abierta && s.conTarjeta && (!tarjeta || !tarjeta.isConnected)) ponerTarjeta(false); });
    // Vincular desde la hoja de Ascent cambia la entrada del encabezado: la fila pasa a ser la carta.
    let vinculadaVista = null;
    const mirarVinculo = new MutationObserver(() => {
      if (!s.abierta || g.secciones.ascent.vinculada === vinculadaVista) return;
      vinculadaVista = g.secciones.ascent.vinculada;
      acomodar(pgScroll, () => ponerCarta(false));
      if (carta && !quieto()) carta.animate([{ opacity: 0.3 }, { opacity: 1 }], { duration: 380, easing: CURVA });
    });
    function mirar(si) {
      if (!si) { [mirarProgreso, mirarInicio, mirarVinculo].forEach((o) => o.disconnect()); return; }
      mirarProgreso.observe(pgScroll, { childList: true });
      mirarInicio.observe(inBloques, { childList: true });
      const entrada = pgZona.querySelector('.as-entrada');
      if (entrada) mirarVinculo.observe(entrada, { attributes: true, attributeFilter: ['class'] });
      vinculadaVista = g.secciones.ascent.vinculada;
    }
    // Acá Ascent no está arriba de Progreso: tirar hacia abajo desde arriba de todo ya no la baja (el gesto de
    // galeria.js mira en captura desde el teléfono; esto mira antes, desde la ventana).
    let tiron = null;
    window.addEventListener('pointerdown', (ev) => { tiron = s.abierta && ev.target.closest && ev.target.closest('.progreso') ? { id: ev.pointerId, x: ev.clientX, y: ev.clientY } : null; }, true);
    window.addEventListener('pointermove', (ev) => {
      if (!tiron || !s.abierta || ev.pointerId !== tiron.id) return;
      const dy = ev.clientY - tiron.y;
      if (dy > 0 && dy > Math.abs(ev.clientX - tiron.x)) ev.stopPropagation();
    }, true);
    window.addEventListener('wheel', (ev) => { if (s.abierta && ev.deltaY < 0 && ev.target.closest && ev.target.closest('.progreso')) ev.stopPropagation(); }, { capture: true, passive: true });

    // El idioma o el rango cambian con la propuesta abierta: se pinta todo de nuevo.
    let idiomaDeAntes = null;
    let cambiandoIdioma = false;
    function ponerIdioma(quiere) {
      const a = quiere || idiomaDeAntes;
      if (!quiere) idiomaDeAntes = null;
      if (!a || g.idioma === a) return;
      if (quiere) idiomaDeAntes = g.idioma;
      cambiandoIdioma = true;
      window.__idioma(a);
      cambiandoIdioma = false;
    }
    function repintarTodo() {
      if (!s.abierta) return;
      ponerCarta(false);
      if (s.conTarjeta) ponerTarjeta(false);
      if (s.pagina) {
        const habia = !!s.detalle;
        cerrarDetalleYa();
        pintarPagina();
        if (habia) abrirDetalle(p.el.querySelector('.apr-aviso.fatiga'), { sinCrecer: true });
      }
      if (bl.abierta) mostrarBloqueo();
    }
    ['s-idioma', 's-rango', 's-planeta'].forEach((id) => {
      const n = document.getElementById(id);
      if (n) n.addEventListener('click', () => { if (!cambiandoIdioma) setTimeout(repintarTodo, 0); });
    });

    // Al pasar a «¿Por qué no estás mejorando?» la galería cierra esta propuesta, pero lo de antes (el vínculo y el
    // idioma) se devuelve recién cuando se termina de verdad: volviendo con «‹» sigue igual, y si se sale de allá por
    // otro camino (una pestaña, otro botón), se devuelve cuando ya no queda ninguna propuesta abierta.
    function devolverLoDeAntes() {
      ponerIdioma(null);
      if (s.antes) g.vincular(s.antes.vinculada);
      s.antes = null;
      s.volviendo = null;
    }
    const cajaDePropuestas = document.getElementById('propuestas-nuevas');
    const vigia = new MutationObserver(() => {
      if (s.abierta) { vigia.disconnect(); return; }
      if (document.querySelector('[data-propuesta][aria-pressed="true"]')) return;
      vigia.disconnect();
      devolverLoDeAntes();
    });

    // ------------------------------------------------------------ abrir y cerrar
    return {
      abrir(vista, arg) {
        const v = VISTAS[vista] || VISTAS.progreso;
        // Vuelve de «¿Por qué no estás mejorando?» con «‹» (la misma vista): la página queda como estaba.
        const volviendo = s.volviendo && s.volviendo.vista === vista ? s.volviendo : null;
        s.volviendo = null;
        vigia.disconnect();
        if (!s.abierta) {
          // Si viene de «¿Por qué…?», lo de antes ya está guardado: no se pisa con lo que dejó aquella.
          if (!s.antes) s.antes = { vinculada: g.secciones.ascent.vinculada };
          s.abierta = true;
          g.tel.classList.remove('apr-vuelve-arriba');
          g.tel.classList.add('apr-sin-arriba');
        }
        s.vista = vista;
        if (volviendo) {
          s.dia = volviendo.dia;
          s.abiertas = volviendo.abiertas;
          s.descartados = volviendo.descartados;
          s.respuestas = volviendo.respuestas;
        } else {
          s.descartados = new Set();
          s.respuestas = {};
          s.yaDescarto = false;
          s.dia = v.dia;
          s.abiertas = new Set(v.abiertas || []);
          s.ejercicio = null;
          s.musculo = null;
        }
        const modo = volviendo ? 'pagina' : typeof arg === 'string' ? arg : v.modo;
        s.conTarjeta = modo === 'inicio';
        mirar(false);
        ponerIdioma(v.idioma || null);
        g.vincular(!v.sinVincular);
        mirar(true);
        if (modo !== 'telefono') bl.cerrar(true);

        if (modo === 'inicio') {
          cerrarPagina({});
          g.irA(0, true);
          g.secciones.inicio.subir();
          ponerCarta(false);
          ponerTarjeta(true);
          return;
        }
        quitarTarjeta(false);
        g.irA(2, true);
        // La primera vez que se llega a Progreso, la sección de Ascent lo hace asomar: acá no hay nada arriba.
        pgScroll.getAnimations().forEach((a) => { if (a.id === 'as-asoma') a.cancel(); });
        if (!s.pagina) g.secciones.progreso.subir();
        const nueva = !carta || !carta.isConnected;
        ponerCarta(nueva && !s.pagina);
        if (modo === 'telefono') { cerrarPagina({}); mostrarBloqueo(); return; }
        if (modo === 'carta') { cerrarPagina({ encoger: true }); return; }
        if (volviendo) {
          abrirPagina({});
          const sc = p.el.querySelector('.apr-scroll');
          if (sc) sc.scrollTop = volviendo.arriba;
          return;
        }
        const seguir = () => {
          if (!s.abierta || s.vista !== vista) return;
          if (s.pagina) { cerrarDetalleYa(); pintarPagina(); const sc = p.el.querySelector('.apr-scroll'); sc.scrollTop = 0; if (!quieto()) sc.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 }); } else abrirPagina({ crecer: true });
          if (modo === 'detalle') setTimeout(() => { const n = p.el.querySelector('.apr-aviso.fatiga'); if (n && s.vista === vista) abrirDetalle(n); }, quieto() ? 0 : 560);
        };
        // Si la carta recién entra, crece cuando ya se asentó.
        if (nueva && !s.pagina && !quieto()) setTimeout(seguir, 480); else seguir();
      },
      cerrar() {
        if (!s.abierta) return;
        s.abierta = false;
        mirar(false);
        cerrarDetalleYa();
        if (s.pagina) {
          s.pagina = false;
          s.ocupada = false;
          if (quieto()) p.cerrar(true);
          else p.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }).onfinish = () => { if (s.pagina) return; p.cerrar(true); p.el.getAnimations({ subtree: true }).forEach((a) => a.cancel()); };
        }
        bl.cerrar();
        s.conTarjeta = false;
        quitarCarta(true);
        quitarTarjeta(true);
        pgScroll.classList.remove('apr-apartadas');
        setTimeout(() => pgScroll.classList.remove('apr-moviendo'), 460);
        g.tel.classList.remove('apr-sin-arriba');
        g.tel.classList.add('apr-vuelve-arriba');
        setTimeout(() => { if (!s.abierta) g.tel.classList.remove('apr-vuelve-arriba'); }, 450);
        s.vista = null;
        // Hacia «¿Por qué no estás mejorando?», el idioma y el vínculo quedan como están hasta que se termine (vigia).
        if (s.volviendo && cajaDePropuestas) vigia.observe(cajaDePropuestas, { subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
        else devolverLoDeAntes();
      },
    };
  },
});
