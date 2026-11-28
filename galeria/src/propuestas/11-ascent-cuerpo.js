// La sección de Ascent rehecha, propuesta B: «El cuerpo manda» (27/11/2026, para aprobar; diseño B de
// spec/seccion-ascent.md). El cuerpo dibujado, grande, es la pantalla y el menú, como una lámina de atlas: se le cambia
// la lente (Hoy, Semana, Fatiga) y lo que en la sección de hoy era una fila pasa a ser un rótulo unido al músculo por
// una línea fina. Solo se rotula lo que se sale o lo que toca hoy: cuatro como mucho, todos a la izquierda.
// - Arrastrar el cuerpo de costado lo gira a la espalda (el frente se angosta y la espalda se abre); los dos botones de
//   abajo hacen lo mismo para quien no arrastra.
// - Tocar un músculo lo levanta apenas, el cuerpo se corre y se acerca a esa zona en una lupa, y su panel crece desde él.
// - «Tu sesión ›», «Tu fuerza ›», «Metas ›», «Tu año ›», «?» y «Ver como lista» crecen a su página desde lo tocado; «‹»
//   o arrastrar hacia abajo vuelve.
// La cara, «Lámina»: todo a línea; el color del rango es la única tinta, sobre casi negro con un grano muy fino, y los
// estados se leen por trama y no por color: rayado «le faltan», lleno «al día», puntos «se recupera» (más puntos, más le
// falta; «cargado», la tinta llena con puntos de papel). Así el rango 1, que es gris, no queda gris sobre gris. El
// cuerpo del rango va arriba a la derecha como un medallón de trazo (dibujado acá, uno por cuerpo: el de la sección es
// una esfera con color).
// Los datos son los de window.AscentDeMentira (05-ascent-datos.js), sin cuentas nuevas; los textos que la app todavía no
// tiene van acá abajo, en es y en.

const TEXTOS = {
  es: {
    lentes: { hoy: 'Hoy', semana: 'Semana', fatiga: 'Fatiga' },
    lentesEtiqueta: 'Lo que muestra el cuerpo',
    lista: 'Ver como lista',
    listaTitulo: 'Todo en una lista',
    tuSesion: 'Tu sesión',
    sesionDeHoy: 'Tu sesión de hoy',
    pie: { comida: 'Hoy, más {macros}', cama: 'a la cama a las {hora}' },
    anoche: 'anoche, {horas}',
    comoFue: 'cómo fue: {palabra}',
    hoyToca: 'Hoy toca',
    hechoHoy: 'Hecho hoy',
    siguen: { cargado: { uno: 'Sigue cargado', otros: 'Siguen cargados' }, seRecupera: { uno: 'Todavía se recupera', otros: 'Todavía se recuperan' } },
    estado: { poco: 'le faltan {n} para 10', enSuPunto: 'al día', mucho: 'de más', sinEntrenar: 'sin entrenar', entrenado: 'entrenado' },
    faseCorta: '{desde}: {texto}',
    estimado: '{desde}, estimado',
    anotado: { entendido: 'Anotado.', bien: 'Anotado: te sientes bien.' },
    nadaDeEsteLado: { hoy: 'De este lado no toca nada hoy.', semana: 'De este lado, todo al día.', fatiga: 'De este lado, todo recuperado.' },
    nueva: { titulo: 'Hoy se encienden' },
    tira: { poco: 'le faltan', enSuPunto: 'al día', mucho: 'de más', etiqueta: 'Series duras de cada músculo en 7 días, de 0 a 30. {resumen}' },
    estimadoCorto: 'Estimado: puede variar un día.',
    panel: { series: 'series duras en 7 días', hoy: 'Hoy, en tu sesión', proxima: 'La próxima vez' },
    enElTiempo: '{ejercicio}, en el tiempo',
    enElTiempoCorto: 'En el tiempo',
    porQue: '¿Por qué no estás mejorando?',
    pasos: { ritmo: 'Ritmo', series: 'Series', veces: 'Veces', sueno: 'Sueño', proteina: 'Proteína' },
    hoyLevantarias: 'hoy',
    anioTexto: 'Cada día que entrenaste, con la trama de lo que más trabajaste; el punto claro es una marca. Toca un día para verlo.',
    listaSec: { hoy: 'Hoy', comidaYSueno: 'Comida y sueño' },
  },
  en: {
    lentes: { hoy: 'Today', semana: 'Week', fatiga: 'Fatigue' },
    lentesEtiqueta: 'What the body shows',
    lista: 'View as a list',
    listaTitulo: 'Everything as a list',
    tuSesion: 'Your session',
    sesionDeHoy: 'Today’s session',
    pie: { comida: 'Today, more {macros}', cama: 'bed at {hora}' },
    anoche: 'last night, {horas}',
    comoFue: 'how it went: {palabra}',
    hoyToca: 'Planned today',
    hechoHoy: 'Done today',
    siguen: { cargado: { uno: 'Still loaded', otros: 'Still loaded' }, seRecupera: { uno: 'Still recovering', otros: 'Still recovering' } },
    estado: { poco: 'needs {n} more to reach 10', enSuPunto: 'on track', mucho: 'too much', sinEntrenar: 'not trained', entrenado: 'trained' },
    faseCorta: '{desde}: {texto}',
    estimado: '{desde}, an estimate',
    anotado: { entendido: 'Noted.', bien: 'Noted: you feel fine.' },
    nadaDeEsteLado: { hoy: 'Nothing planned on this side today.', semana: 'On this side, all on track.', fatiga: 'On this side, all recovered.' },
    nueva: { titulo: 'Lighting up today' },
    tira: { poco: 'needs more', enSuPunto: 'on track', mucho: 'too much', etiqueta: 'Hard sets per muscle in 7 days, from 0 to 30. {resumen}' },
    estimadoCorto: 'An estimate: it can be off by a day.',
    panel: { series: 'hard sets in 7 days', hoy: 'Today, in your session', proxima: 'Next time' },
    enElTiempo: '{ejercicio}, over time',
    enElTiempoCorto: 'Over time',
    porQue: 'Why aren’t you improving?',
    pasos: { ritmo: 'Pace', series: 'Sets', veces: 'Frequency', sueno: 'Sleep', proteina: 'Protein' },
    hoyLevantarias: 'today',
    anioTexto: 'Each day you trained, with the pattern of what you worked most; the light dot is a personal best. Tap a day to see it.',
    listaSec: { hoy: 'Today', comidaYSueno: 'Food and sleep' },
  },
};

// Lo que se ve de la figura de AscentDeMentira.figura (viewBox 0 0 100 188): la silueta va de x 16,6 a 83,4 y de y 4,6 a 184,6.
const RECORTE = { x: 14, y: 3, ancho: 72, alto: 184 };
// Dónde se ata la línea de cada rótulo: un punto adentro de la mitad izquierda del músculo, la que mira a los rótulos.
// Solo están los músculos que se dibujan de cada lado.
const ANCLAS = {
  frente: { trapecio: [41.5, 31.2], hombros: [28.5, 42], pecho: [40, 44], biceps: [27.5, 60.5], antebrazos: [23, 80], abdomen: [46.6, 66], aductores: [46.8, 108], cuadriceps: [38.6, 112], pantorrillas: [37, 151] },
  espalda: { trapecio: [45, 38], dorsales: [40, 60], hombros: [28.5, 43], triceps: [27, 59], antebrazos: [23, 80], espaldaBaja: [45.5, 78], gluteos: [41.5, 97], isquios: [38.8, 120], pantorrillas: [38.5, 151] },
};
// Lo que va abajo del cuerpo: «De frente ● ○ De espalda».
const LADOS = 36;
const CURVA = 'cubic-bezier(0.2, 0.7, 0.2, 1)';
// Las tramas: en las unidades de la figura (a ~2,1 px por unidad en el iPhone), así se ven igual en el cuerpo y en las muestras.
const DEFS = `<svg class="acu-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
<pattern id="acu-t-raya" patternUnits="userSpaceOnUse" width="2.5" height="2.5" patternTransform="rotate(40)"><line x1="0.6" y1="0" x2="0.6" y2="2.5"/></pattern>
<pattern id="acu-t-p1" patternUnits="userSpaceOnUse" width="3.8" height="3.3"><circle cx="0.95" cy="0.82" r="0.5"/><circle cx="2.85" cy="2.47" r="0.5"/></pattern>
<pattern id="acu-t-p2" patternUnits="userSpaceOnUse" width="2.8" height="2.4"><circle cx="0.7" cy="0.6" r="0.55"/><circle cx="2.1" cy="1.8" r="0.55"/></pattern>
<pattern id="acu-t-p3" patternUnits="userSpaceOnUse" width="2.3" height="2"><rect class="lleno" width="2.3" height="2"/><circle class="hueco" cx="0.575" cy="0.5" r="0.36"/><circle class="hueco" cx="1.725" cy="1.5" r="0.36"/></pattern>
<pattern id="acu-t-araya" patternUnits="userSpaceOnUse" width="2.6" height="2.6" patternTransform="rotate(45)"><line class="fino" x1="0.6" y1="0" x2="0.6" y2="2.6"/></pattern>
<pattern id="acu-t-ap" patternUnits="userSpaceOnUse" width="3" height="3"><circle cx="1.5" cy="1.5" r="0.85"/></pattern>
</defs></svg>`;
// El grano del papel: ruido blanco muy tenue.
const GRANO = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.5 -0.5'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23g)'/%3E%3C/svg%3E\")";

const CSS = `
/* Con la clase de la pantalla: .tel .pr-pantalla (galería) le pone la tinta crema de Moss y pesa lo mismo. */
/* La tinta es un color de verdad: al cambiar de rango (también desde el panel de la galería), todo se retiñe de a poco. */
@property --acu-tinta { syntax: '<color>'; inherits: true; initial-value: #9e9bb0; }
.tel .pr-pantalla.acu { color: var(--as-tinta); background: #05060a; --acu-tinta: #9e9bb0; --acu-regla: rgba(170, 178, 196, 0.17); --acu-curva: ${CURVA}; transition: --acu-tinta 0.6s ease; }
.tel .pr-pantalla.acu::after { opacity: 0; z-index: 7; transition: opacity 0.3s; }
.tel .pr-pantalla.acu.acu-con-pagina::after { opacity: 1; }
.tel .pr-pantalla.acu.acu-a-progreso.saliendo { animation: acu-se-va 0.3s ease both; }
@keyframes acu-se-va { to { opacity: 0; transform: translateY(-34px); } }
.acu button { -webkit-tap-highlight-color: transparent; }
.acu :focus-visible { outline: 2px solid var(--acu-tinta); outline-offset: 2px; }
.acu-ico svg, .acu-atras svg, .acu-chev svg, .acu-progreso svg { stroke: currentColor; fill: none; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.acu-defs { position: absolute; width: 0; height: 0; overflow: hidden; }
.acu-defs line { stroke: var(--acu-tinta); stroke-width: 0.62; fill: none; }
.acu-defs line.fino { stroke-width: 0.85; }
.acu-defs circle { fill: var(--acu-tinta); stroke: none; }
/* «Cargado» es la tinta llena con puntos de papel: más tinta que «se recupera», y distinto del lleno liso de «al día». */
.acu-defs rect.lleno { fill: var(--acu-tinta); }
.acu-defs circle.hueco { fill: #05060a; }

/* El papel: casi negro, grano muy fino y órbitas de pelo alrededor del medallón. */
.acu-fondo { position: absolute; inset: 0; pointer-events: none; }
.acu-fondo::before, .acu-hoja::before { content: ''; position: absolute; inset: 0; opacity: 0.09; background-image: ${GRANO}; background-size: 160px 160px; pointer-events: none; }
.acu-orbitas { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.acu-orbitas circle { fill: none; stroke: var(--acu-tinta); stroke-width: 0.6; }
.acu-entrando .acu-orbitas circle { stroke-dasharray: 1 1; animation: acu-traza 1.6s 0.2s cubic-bezier(0.4, 0.1, 0.2, 1) both; }

/* El medallón: el cuerpo del rango, a trazo. */
.acu-medallon { position: absolute; z-index: 6; top: calc(var(--arriba) + 2px); right: 12px; width: 66px; height: 66px; pointer-events: none; }
.acu-medallon svg { position: relative; display: block; width: 100%; height: 100%; overflow: visible; }
/* En las páginas, un halo oscuro: el texto que se desliza por debajo se apaga antes de llegar al borde. */
.acu-medallon::before { content: ''; position: absolute; inset: -14px; border-radius: 50%; background: radial-gradient(closest-side, #05060a 68%, rgba(5, 6, 10, 0)); opacity: 0; transition: opacity 0.3s ease; }
.acu-con-pagina .acu-medallon::before { opacity: 1; }
/* Con fondo: lo que se desliza en una página pasa por debajo del medallón, no a través. */
.acu-med-marco { fill: #05060a; stroke: var(--acu-tinta); stroke-width: 0.6; stroke-opacity: 0.6; }
.acu-med-orbita { fill: none; stroke: var(--acu-tinta); stroke-width: 0.55; stroke-opacity: 0.55; stroke-dasharray: 0.7 1.8; }
.acu-med-t { fill: none; stroke: var(--acu-tinta); stroke-width: 0.95; stroke-linecap: round; stroke-linejoin: round; }
.acu-med-fino { fill: none; stroke: var(--acu-tinta); stroke-width: 0.55; stroke-opacity: 0.8; stroke-linecap: round; }
.acu-med-f { fill: var(--acu-tinta); stroke: none; }
.acu-med-n { fill: #05060a; stroke: var(--acu-tinta); stroke-width: 0.95; }
.acu-med-tapa { fill: #05060a; stroke: none; }
.acu-entrando .acu-med-marco { stroke-dasharray: 1 1; animation: acu-traza 1s 0.15s cubic-bezier(0.4, 0.1, 0.2, 1) both; }
.acu-entrando .acu-med-cuerpo, .acu-entrando .acu-med-orbita, .acu-entrando .acu-med-luna { animation: acu-funde 0.7s 0.45s ease both; }

/* La portada: una sola pantalla, sin deslizar. */
.acu-portada { position: absolute; left: 0; right: 0; top: var(--arriba); bottom: var(--pestanas); display: flex; flex-direction: column; padding: 0 18px; transform-origin: 50% 45%; transition: opacity 0.32s ease, transform 0.45s var(--acu-curva); }
.acu-portada.acu-atras-de { opacity: 0; transform: scale(0.965); pointer-events: none; }
.acu-portada > * { transition: opacity 0.3s ease; }
.acu-portada.acu-con-musculo > :not(.acu-lamina), .acu-portada.acu-con-musculo .acu-lados { opacity: 0; pointer-events: none; }
.acu-lados { transition: opacity 0.3s ease; }
/* El encabezado va encima de la lámina, a la izquierda: así el cuerpo sube hasta el medallón y gana alto. */
.acu-cab { position: absolute; z-index: 1; top: 0; left: 18px; right: 18px; padding: 0 74px 0 0; pointer-events: none; }
.acu-cab button { pointer-events: auto; }
.acu-fila { display: flex; align-items: center; height: 38px; margin-left: -10px; }
.acu-marca { padding: 0 6px 0 10px; font: 500 11.5px/1 var(--texto); letter-spacing: 0.3em; text-transform: uppercase; color: var(--as-sub); }
.acu-ico { appearance: none; flex: none; width: 44px; height: 44px; margin: -3px -2px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--as-apagado); cursor: pointer; transition: background-color 0.15s, color 0.15s; }
.acu-ico:active { background: rgba(232, 236, 246, 0.08); color: var(--as-tinta); }
.acu-ico svg { width: 19px; height: 19px; }
.acu-preg { display: grid; place-items: center; width: 18px; height: 18px; border: 1.3px solid currentColor; border-radius: 50%; font: italic 600 13px/1 var(--titulos); }
.acu-titular, .acu-hoja-t, .acu-r-n, .acu-panel-n, .acu-meta-n, .acu-celda-n, .acu-ej-n, .acu-grande, .acu-nota-t, .acu-aviso h3 { font-variant-numeric: lining-nums; }
.acu-titular { margin: 0; font: 500 33px/1.03 var(--titulos); letter-spacing: -0.005em; color: var(--as-tinta); text-wrap: balance; }
/* Hasta donde empieza el cuerpo: una línea larga (la de quien recién vincula) no le pasa por encima. */
.acu-linea { max-width: calc(var(--acu-col, 200px) + 30px); margin: 5px 0 0; font: 400 14px/1.3 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.acu-linea b { font-weight: 400; color: var(--acu-tinta); }

/* La lámina: el cuerpo, los rótulos y sus líneas. */
.acu-lamina { position: relative; flex: 1 1 auto; min-height: 0; margin: 0 -18px; touch-action: none; }
.acu-cuerpo { position: absolute; transform-origin: 0 0; }
.acu-giro { position: absolute; inset: 0; }
.acu-capa, .acu-capa-base { position: absolute; inset: 0; }
.acu-capa > svg, .acu-capa-base > svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }
.acu-capa .am-base { display: none; }
.acu-capa-base .am-m, .acu-capa-base .am-linea { display: none; }
.acu-capa-base .am-base { fill: rgba(190, 196, 220, 0.04); stroke: var(--acu-tinta); stroke-opacity: 0.62; stroke-width: 0.42; }
.acu .acu-capa.acu-entra { animation: acu-funde 0.32s ease both; }
.acu .acu-capa.acu-sale { animation: acu-funde 0.32s ease reverse both; }
.acu .acu-capa .am-m { fill: transparent; stroke: var(--acu-tinta); stroke-opacity: 0.34; stroke-width: 0.34; stroke-dasharray: none; pointer-events: all; cursor: pointer; transition: opacity 0.35s ease, stroke-opacity 0.35s ease; }
.acu .acu-capa .am-linea { stroke: var(--acu-tinta); stroke-opacity: 0.26; stroke-width: 0.3; }
/* Semana: rayado le faltan, lleno al día, doble contorno de más; los puntos del borde, que se recupera. */
.acu .acu-lente-semana .am-m.poco { fill: url(#acu-t-raya); stroke-opacity: 0.9; stroke-width: 0.4; }
.acu .acu-lente-semana .am-m.enSuPunto, .acu .acu-lente-semana .am-m.mucho, .acu .acu-lente-semana .am-m.entrenado { fill: var(--acu-tinta); stroke: #05060a; stroke-opacity: 1; stroke-width: 0.5; }
.acu .acu-lente-semana .am-m.entrenado { fill-opacity: 0.6; }
.acu .acu-lente-semana .am-m.mucho { stroke: var(--as-tinta); stroke-width: 0.75; }
.acu .acu-lente-semana .am-m.sinEntrenar { stroke-opacity: 0.7; stroke-width: 0.4; stroke-dasharray: 0.9 0.9; }
.acu .acu-lente-semana .am-m.fatigado { stroke: var(--as-tinta); stroke-opacity: 1; stroke-width: 0.8; stroke-dasharray: 0 1.45; stroke-linecap: round; }
.acu .acu-lente-semana .am-m.enSuPunto.fatigado, .acu .acu-lente-semana .am-m.mucho.fatigado { stroke: #05060a; stroke-width: 0.95; }
/* Fatiga: más puntos, más cargado. */
.acu .acu-lente-fatiga .am-m.recuperado { stroke-opacity: 0.42; }
.acu .acu-lente-fatiga .am-m.faltaPoco { fill: url(#acu-t-p1); stroke-opacity: 0.8; stroke-width: 0.4; }
.acu .acu-lente-fatiga .am-m.seRecupera { fill: url(#acu-t-p2); stroke-opacity: 0.9; stroke-width: 0.4; }
.acu .acu-lente-fatiga .am-m.cargado { fill: url(#acu-t-p3); stroke-opacity: 1; stroke-width: 0.5; }
/* Hoy: lo de la sesión, encendido; si sigue cansado, con sus puntos. */
.acu .acu-lente-hoy .am-m.hoy, .acu .acu-lente-hoy .am-m.hecho { fill: var(--acu-tinta); stroke: #05060a; stroke-opacity: 1; stroke-width: 0.5; }
.acu .acu-lente-hoy .am-m.hoy.faltaPoco, .acu .acu-lente-hoy .am-m.hecho.faltaPoco { fill: url(#acu-t-p1); stroke: var(--acu-tinta); stroke-width: 0.65; }
.acu .acu-lente-hoy .am-m.hoy.seRecupera, .acu .acu-lente-hoy .am-m.hecho.seRecupera { fill: url(#acu-t-p2); stroke: var(--acu-tinta); stroke-width: 0.65; }
.acu .acu-lente-hoy .am-m.hoy.cargado, .acu .acu-lente-hoy .am-m.hecho.cargado { fill: url(#acu-t-p3); stroke: var(--acu-tinta); stroke-width: 0.65; }
.acu .acu-lente-hoy .am-m.manana { fill: var(--acu-tinta); fill-opacity: 0.26; stroke-opacity: 0.7; }
.acu .acu-lente-hoy .am-m.acu-descansa.faltaPoco { fill: url(#acu-t-p1); stroke-opacity: 0.8; }
.acu .acu-lente-hoy .am-m.acu-descansa.seRecupera { fill: url(#acu-t-p2); stroke-opacity: 0.85; }
.acu .acu-lente-hoy .am-m.acu-descansa.cargado { fill: url(#acu-t-p3); stroke-opacity: 0.9; }
.acu .acu-lente-hoy .am-m.porEncender { stroke: var(--as-tinta); stroke-opacity: 0.95; stroke-width: 0.5; stroke-dasharray: 1.1 0.9; }
.acu .acu-lente-hoy .am-m.acu-del-aviso { animation: acu-respira 2.8s ease-in-out infinite; }
@keyframes acu-respira { 50% { stroke-opacity: 0.4; } }
/* El músculo tocado se levanta apenas; lo demás se aparta. */
.acu .acu-capa .am-m.acu-elegido { transform: scale(1.03); transform-box: fill-box; transform-origin: center; stroke: var(--as-tinta); stroke-opacity: 1; stroke-width: 0.6; filter: drop-shadow(0 0 1.2px rgba(232, 236, 246, 0.6)); transition: transform 0.35s var(--acu-curva), opacity 0.35s; }
.acu .acu-enfocado .acu-capa .am-m:not(.acu-elegido), .acu .acu-enfocado .acu-capa .am-linea { opacity: 0.32; }

/* Los rótulos, en Cormorant itálica, con su línea desde el músculo. */
.acu-rotulos { position: absolute; inset: 0; pointer-events: none; }
.acu-rotulo, .acu-nota { position: absolute; left: 18px; width: var(--acu-col, 190px); opacity: 0; translate: -8px 0; transition: opacity 0.3s ease, translate 0.42s var(--acu-curva), top 0.4s var(--acu-curva); }
.acu-rotulo { pointer-events: auto; }
.acu-rotulo.acu-ve, .acu-nota.acu-ve { opacity: 1; translate: 0 0; }
.acu-r-abre { appearance: none; display: block; width: 100%; margin: -4px 0; padding: 4px 0; border: 0; background: none; text-align: left; cursor: pointer; }
.acu-r-abre:active { opacity: 0.75; }
.acu-r-k, .acu-k { display: block; margin: 0 0 3px; font: 500 11.5px/1.25 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: var(--acu-tinta); }
.acu-r-n { display: block; font: italic 500 21px/1.08 var(--titulos); color: var(--as-tinta); }
.acu-r-n b { margin-left: 7px; font: 300 17px/1 var(--numeros); font-style: normal; color: var(--acu-tinta); font-variant-numeric: tabular-nums; }
.acu-r-aviso .acu-r-n { font-size: 22px; }
.acu-r-l { display: block; margin-top: 3px; font: 400 13px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.acu-r-l.sigue { margin-top: 0; }
.acu-r-l.fuerte { color: var(--as-tinta); }
.acu-r-l.suave { color: var(--as-apagado); }
.acu-r-ej { display: flex; align-items: baseline; gap: 6px; margin-top: 3px; font: 400 13px/1.3 var(--texto); color: var(--as-tinta); }
.acu-r-ej i { flex: none; width: 11px; font: 500 14px/1 var(--numeros); font-style: normal; color: var(--as-apagado); text-align: center; }
.acu-r-ej i.sube { color: var(--acu-tinta); }
.acu-r-ej em { font: 400 13px/1 var(--numeros); font-style: normal; color: var(--as-sub); white-space: nowrap; }
.acu-r-resp { display: flex; align-items: center; margin: 2px 0 -10px -8px; }
.acu-r-resp button { appearance: none; min-height: 44px; padding: 0 8px; border: 0; background: none; color: var(--as-tinta); font: 400 13.5px/1 var(--texto); text-decoration: underline; text-decoration-color: color-mix(in srgb, var(--acu-tinta) 70%, transparent); text-underline-offset: 4px; cursor: pointer; }
.acu-r-resp span { color: var(--as-apagado); }
.acu-muestra { display: inline-block; width: 13px; height: 13px; margin-right: 5px; vertical-align: -2px; overflow: visible; }
.acu-muestra circle { stroke: var(--acu-tinta); stroke-width: 0.5; fill: none; }
.acu-muestra .p1 { fill: url(#acu-t-p1); }
.acu-muestra .p2 { fill: url(#acu-t-p2); }
.acu-muestra .p3 { fill: url(#acu-t-p3); }
.acu-nota-t { margin: 0; font: italic 500 18px/1.22 var(--titulos); color: var(--as-tinta); text-wrap: pretty; }
.acu-guias { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
.acu-guia { fill: none; stroke: var(--acu-tinta); stroke-width: 0.9; stroke-opacity: 0.8; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1 1; stroke-dashoffset: 1; transition: stroke-dashoffset 0.42s cubic-bezier(0.3, 0.6, 0.2, 1); }
.acu-guia.acu-ve { stroke-dashoffset: 0; }
.acu-ancla { fill: var(--acu-tinta); stroke: #05060a; stroke-width: 1.6; transform-box: fill-box; transform-origin: center; scale: 0; transition: scale 0.26s var(--acu-curva); }
.acu-ancla.acu-ve { scale: 1; }
.acu-ancla-c { fill: var(--as-tinta); stroke: none; transform-box: fill-box; transform-origin: center; scale: 0; transition: scale 0.26s var(--acu-curva); }
.acu-ancla-c.acu-ve { scale: 1; }

/* Los hitos de quien recién vincula: cuándo se enciende cada cosa. */
.acu-hitos { position: relative; list-style: none; margin: 0; padding: 0; }
.acu-hitos::before { content: ''; position: absolute; left: 4.5px; top: 6px; bottom: 14px; width: 1px; background: var(--acu-regla); }
.acu-hito { position: relative; padding: 0 0 9px 20px; font: 400 13px/1.3 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.acu-hito::before { content: ''; position: absolute; left: 0; top: 3px; width: 8px; height: 8px; border: 1px solid var(--acu-tinta); border-radius: 50%; background: #05060a; }
.acu-hito.alcanzado::before { background: var(--acu-tinta); }
.acu-hito b { font-weight: 400; }
.acu-hito span { font: italic 500 16px/1.15 var(--titulos); color: var(--as-sub); }
.acu-hito.alcanzado span { color: var(--as-tinta); }
.acu-aqui { position: relative; margin: 0 0 10px 20px; font: 500 11.5px/1 var(--texto); letter-spacing: 0.15em; text-transform: uppercase; color: var(--acu-tinta); }
.acu-aqui::before { content: ''; position: absolute; left: -18px; top: 50%; width: 10px; border-top: 1px solid var(--acu-tinta); }

/* De frente y de espalda. */
.acu-lados { position: absolute; height: ${LADOS}px; display: flex; align-items: center; gap: 2px; translate: -50% 0; }
/* 44 px de alto (sobresale 4 px arriba y abajo de la fila) y 44 de ancho como mínimo, también con «Back». */
.acu-lados button { position: relative; appearance: none; display: inline-flex; align-items: center; justify-content: center; height: 44px; min-width: 44px; margin: -4px 0; padding: 0 7px; border: 0; background: none; color: var(--as-apagado); font: 400 13px/1 var(--texto); white-space: nowrap; cursor: pointer; transition: color 0.25s; }
.acu-lados button[aria-pressed="true"] { color: var(--as-tinta); }
.acu-lados button.acu-hay::after { content: ''; position: absolute; left: 50%; bottom: 7px; width: 4px; height: 4px; translate: -50% 0; border-radius: 50%; background: var(--acu-tinta); }
.acu-puntos { display: flex; gap: 5px; }
.acu-puntos i { width: 6px; height: 6px; border: 1px solid var(--as-sub); border-radius: 50%; transition: background-color 0.25s, border-color 0.25s; }
.acu-puntos i.on { background: var(--as-tinta); border-color: var(--as-tinta); }

/* Las tres lentes, sobre una regla. */
.acu-lentes { position: relative; flex: none; display: flex; height: 45px; border-top: 1px solid var(--acu-regla); }
.acu-lente { appearance: none; flex: 1 1 0; padding: 0; border: 0; background: none; color: var(--as-apagado); font: 400 15px/1 var(--texto); cursor: pointer; transition: color 0.25s; }
.acu-lente[aria-pressed="true"] { color: var(--as-tinta); }
.acu-lentes-marca { position: absolute; top: -1px; left: 0; width: 40px; height: 1.5px; background: var(--acu-tinta); transition: translate 0.4s var(--acu-curva), width 0.4s var(--acu-curva); }

/* El pie de cada lente. */
.acu-pie { position: relative; flex: none; height: 66px; }
.acu-pie-capa { position: absolute; inset: 0; }
.acu-pie-capa.acu-entra { animation: acu-sube 0.36s var(--acu-curva) both; }
.acu-pie-capa.acu-sale { animation: acu-funde 0.2s ease reverse both; }
.acu-sesion { position: relative; appearance: none; display: flex; align-items: center; gap: 10px; width: 100%; height: 44px; margin: 0; padding: 0; border: 0; background: none; color: var(--as-tinta); text-align: left; cursor: pointer; }
button.acu-sesion:active { opacity: 0.75; }
.acu-sesion-t { font: 400 14px/1 var(--texto); white-space: nowrap; }
.acu-flechas { display: flex; gap: 3px; }
.acu-flechas i { display: grid; place-items: center; width: 18px; height: 21px; border: 1px solid var(--acu-regla); border-radius: 4px; font: 500 13px/1 var(--numeros); font-style: normal; color: var(--as-apagado); }
.acu-flechas i.sube { background: var(--acu-tinta); border-color: var(--acu-tinta); color: #05060a; }
.acu-sesion-r { margin-left: auto; font: 400 13px/1 var(--texto); color: var(--as-sub); white-space: nowrap; }
.acu-chev { display: inline-grid; color: var(--as-apagado); }
.acu-chev svg { width: 15px; height: 15px; }
.acu-pie-l { margin: 0; font: 400 13px/1.25 var(--texto); color: var(--as-sub); }
.acu-pie-l.acu-pie-dia { margin: 2px 0 0; color: var(--as-tinta); }
.acu-tira { display: block; width: 100%; height: 56px; overflow: visible; cursor: pointer; }
.acu-tira .eje { stroke: var(--acu-regla); stroke-width: 1; }
.acu-tira .poco { fill: url(#acu-t-raya); stroke: var(--acu-tinta); stroke-width: 0.6; stroke-opacity: 0.5; }
.acu-tira .punto { fill: var(--acu-tinta); fill-opacity: 0.38; }
.acu-tira .mucho { fill: none; stroke: var(--acu-tinta); stroke-width: 0.6; stroke-opacity: 0.5; stroke-dasharray: 2 2; }
.acu-tira .tic { stroke: var(--as-apagado); stroke-width: 1; }
.acu-tira text { fill: var(--as-sub); font: 400 13px/1 var(--numeros); }
.acu-tira text.zona { fill: var(--as-sub); font: italic 500 14px/1 var(--titulos); }
.acu-tira circle { fill: var(--acu-tinta); fill-opacity: 0.55; stroke: #05060a; stroke-width: 1.4; transition: fill-opacity 0.3s, r 0.3s; }
.acu-tira circle.on { fill: var(--as-tinta); fill-opacity: 1; r: 4.3px; }
.acu-leyenda { display: flex; justify-content: space-between; padding-top: 7px; font: 400 13px/1 var(--texto); color: var(--as-sub); }
.acu-leyenda span { white-space: nowrap; }
.acu-pie-nota { margin: 10px 0 0; font: 400 13px/1.3 var(--texto); color: var(--as-apagado); }

/* Los enlaces de abajo, cada uno con su dibujo chico. */
.acu-enlaces { flex: none; display: flex; border-top: 1px solid var(--acu-regla); }
.acu-enlace { appearance: none; flex: 1 1 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; height: 52px; padding: 0; border: 0; background: none; color: var(--as-tinta); cursor: pointer; transition: opacity 0.2s; }
.acu-enlace:active { opacity: 0.7; }
.acu-enlace > svg { width: 46px; height: 14px; overflow: visible; }
.acu-enlace > span { font: 400 14px/1 var(--texto); white-space: nowrap; }
.acu-enlace > span i { margin-left: 4px; font-style: normal; color: var(--as-apagado); }
.acu-mini-eje { stroke: var(--acu-regla); stroke-width: 1; }
.acu-mini-t { fill: none; stroke: var(--acu-tinta); stroke-width: 1.3; stroke-linecap: round; }
.acu-mini-f { fill: var(--acu-tinta); }
.acu-mini-v { fill: rgba(170, 178, 196, 0.16); }
.acu-progreso { position: relative; flex: none; align-self: center; appearance: none; display: inline-flex; align-items: center; gap: 4px; height: 44px; padding: 0 14px; border: 0; background: none; color: var(--as-sub); font: 400 13px/1 var(--texto); cursor: pointer; }
.acu-progreso svg { width: 16px; height: 16px; }

/* La entrada: la lámina se dibuja. */
.acu-llega .acu-fila, .acu-llega .acu-titular, .acu-llega .acu-linea { animation: acu-sube 0.5s var(--acu-curva) both; }
.acu-llega .acu-titular { animation-delay: 0.06s; }
.acu-llega .acu-linea { animation-delay: 0.12s; }
.acu-llega .acu-capa-base .am-base path { stroke-dasharray: 1 1; animation: acu-traza 0.95s 0.1s cubic-bezier(0.4, 0.1, 0.2, 1) both, acu-relleno 0.6s 0.6s ease both; }
.acu-llega .acu-capa-base .am-base ellipse { animation: acu-funde 0.6s 0.2s ease both; }
.acu-llega .acu-capa { animation: acu-funde 0.55s 0.5s ease both; }
.acu-llega .acu-lados, .acu-llega .acu-lentes, .acu-llega .acu-pie, .acu-llega .acu-enlaces, .acu-llega .acu-progreso { animation: acu-sube 0.45s var(--acu-curva) both; }
.acu-llega .acu-lentes { animation-delay: 0.22s; }
.acu-llega .acu-pie { animation-delay: 0.28s; }
.acu-llega .acu-enlaces { animation-delay: 0.34s; }
.acu-llega .acu-progreso { animation-delay: 0.4s; }
.acu-llega .acu-lados { animation-delay: 0.7s; }
@keyframes acu-traza { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes acu-relleno { from { fill-opacity: 0; } }
@keyframes acu-funde { from { opacity: 0; } }
@keyframes acu-sube { from { opacity: 0; translate: 0 8px; } }

/* El panel del músculo: la lupa arriba a la izquierda y lo suyo al lado y abajo. */
.acu-panel { position: absolute; left: 0; right: 0; top: var(--arriba); bottom: 0; z-index: 3; }
.acu-atras { position: absolute; z-index: 2; left: 6px; top: 1px; appearance: none; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; border: 0; border-radius: 50%; background: none; color: var(--as-tinta); cursor: pointer; transition: background-color 0.15s; }
.acu-atras:active { background: rgba(232, 236, 246, 0.08); }
.acu-atras svg { width: 22px; height: 22px; }
.acu-panel-cab { position: absolute; left: 168px; right: 18px; top: 70px; }
.acu-panel-n { margin: 0; font: italic 500 31px/1.02 var(--titulos); color: var(--as-tinta); }
.acu-panel-d { margin: 6px 0 0; font: 400 13px/1.3 var(--texto); color: var(--as-sub); }
.acu-panel-d b { font: 400 15px/1 var(--numeros); color: var(--as-tinta); }
.acu-escala { display: block; width: 100%; height: 40px; margin-top: 8px; overflow: visible; }
.acu-escala .banda { fill: var(--acu-tinta); fill-opacity: 0.22; }
.acu-escala .eje { stroke: var(--acu-regla); stroke-width: 1; }
.acu-escala .tic { stroke: var(--as-apagado); stroke-width: 1; }
.acu-escala text { fill: var(--as-sub); font: 400 13px/1 var(--numeros); }
.acu-escala circle { fill: var(--as-tinta); stroke: #05060a; stroke-width: 2; }
.acu-panel-fase { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 0; margin-top: 6px; font: 400 13px/1.3 var(--texto); color: var(--as-sub); }
.acu-fases { display: inline-flex; gap: 4px; margin-right: 8px; }
.acu-fases svg { width: 14px; height: 14px; overflow: visible; opacity: 0.35; }
.acu-fases svg.actual { opacity: 1; }
.acu-fases circle { stroke: var(--acu-tinta); stroke-width: 0.5; fill: none; }
.acu-fases svg.actual circle { stroke: var(--as-tinta); stroke-width: 0.7; }
.acu-fases .p1 { fill: url(#acu-t-p1); } .acu-fases .p2 { fill: url(#acu-t-p2); } .acu-fases .p3 { fill: url(#acu-t-p3); }
.acu-panel-scroll { position: absolute; left: 0; right: 0; bottom: 0; overflow-y: auto; overscroll-behavior: contain; padding: 6px 18px calc(var(--pestanas) + 40px); scrollbar-width: none; touch-action: pan-y; mask-image: linear-gradient(180deg, transparent 0, #000 16px); }
.acu-panel-scroll::-webkit-scrollbar { display: none; }
.acu-lupa-aro { position: absolute; z-index: 2; pointer-events: none; }
.acu-lupa-aro svg { display: block; width: 100%; height: 100%; overflow: visible; }
.acu-lupa-aro circle { fill: none; stroke: var(--acu-tinta); stroke-width: 1; stroke-opacity: 0.75; }
.acu-lupa-aro path { stroke: var(--acu-tinta); stroke-width: 1; stroke-opacity: 0.75; }

/* Las páginas: crecen desde lo tocado. */
.acu-hoja { position: absolute; inset: 0; z-index: 5; background: #05060a; }
.acu-hoja-cab { position: absolute; left: 0; right: 0; top: var(--arriba); height: 46px; z-index: 1; }
.acu-hoja-scroll { position: absolute; left: 0; right: 0; top: calc(var(--arriba) + 46px); bottom: 0; overflow-y: auto; overscroll-behavior: contain; padding: 6px 18px calc(var(--pestanas) + 44px); scrollbar-width: none; touch-action: pan-y; mask-image: linear-gradient(180deg, transparent 0, #000 16px); }
.acu-hoja-scroll::-webkit-scrollbar { display: none; }
.acu-hoja-tit { padding-right: 70px; }
.acu-hoja-t { margin: 2px 0 0; font: 500 34px/1.04 var(--titulos); color: var(--as-tinta); transform-origin: 0 0; text-wrap: balance; }
.acu-sec { margin-top: 26px; }
.acu-sec-t { margin: 0 0 6px; font: 500 11.5px/1.3 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: var(--as-sub); }
.acu-p { margin: 6px 0 0; font: 400 15px/1.45 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.acu-p.suave { font-size: 13.5px; color: var(--as-sub); }
.acu-grande { margin: 14px 0 0; font: italic 500 27px/1.12 var(--titulos); color: var(--acu-tinta); text-wrap: balance; }
.acu-aviso { margin-top: 20px; padding: 2px 0 2px 16px; border-left: 2px solid var(--acu-tinta); }
.acu-aviso h3 { margin: 2px 0 0; font: italic 500 24px/1.1 var(--titulos); color: var(--as-tinta); }
.acu-aviso .acu-p { margin-top: 6px; }
.acu-resp { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.acu-resp button { appearance: none; min-height: 44px; padding: 0 18px; border: 1px solid color-mix(in srgb, var(--acu-tinta) 55%, transparent); border-radius: 999px; background: none; color: var(--as-tinta); font: 400 14.5px/1 var(--texto); cursor: pointer; transition: background-color 0.15s; }
.acu-resp button:active { background: rgba(232, 236, 246, 0.08); }
.acu-ejs { margin-top: 16px; border-top: 1px solid var(--acu-regla); }
.acu-ej { appearance: none; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; align-items: center; gap: 10px; width: 100%; min-height: 60px; padding: 9px 0; border: 0; border-bottom: 1px solid var(--acu-regla); background: none; color: var(--as-tinta); text-align: left; }
button.acu-ej { cursor: pointer; }
.acu-ej-f { font: 400 21px/1 var(--numeros); font-style: normal; color: var(--as-apagado); text-align: center; }
.acu-ej-f.sube { color: var(--acu-tinta); }
.acu-ej-n { min-width: 0; font: italic 500 21px/1.1 var(--titulos); }
.acu-ej-n small { display: block; margin-top: 3px; font: 400 13px/1.25 var(--texto); font-style: normal; color: var(--as-sub); }
.acu-ej-p { font: 400 17px/1 var(--numeros); color: var(--as-tinta); white-space: nowrap; text-align: right; font-variant-numeric: tabular-nums; }
.acu-ej-p small { display: block; margin-bottom: 4px; font: 400 13px/1 var(--texto); color: var(--acu-tinta); }
.acu-pliegue { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.38s var(--acu-curva); }
.acu-pliegue > div { min-height: 0; overflow: hidden; opacity: 0; transition: opacity 0.25s ease; }
.acu-pliegue.abierto { grid-template-rows: 1fr; }
.acu-pliegue.abierto > div { opacity: 1; }
.acu-pliegue .acu-p { margin: 0; padding: 8px 0 4px 34px; font-size: 14px; color: var(--as-sub); }
.acu-ir { appearance: none; display: inline-flex; align-items: center; gap: 4px; min-height: 44px; margin: 4px 0 0; padding: 0; border: 0; background: none; color: var(--as-tinta); font: 400 14.5px/1.2 var(--texto); text-align: left; cursor: pointer; }
.acu-ir i { font-style: normal; color: var(--acu-tinta); }
.acu-ir span { border-bottom: 1px solid color-mix(in srgb, var(--acu-tinta) 55%, transparent); padding-bottom: 2px; }
.acu-pliegue .acu-ir { margin-left: 34px; }
.acu-fila-l { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--acu-regla); }
.acu-fila-l > span:first-child { font: 400 14.5px/1.3 var(--texto); color: var(--as-tinta); }
.acu-fila-l > span:first-child small { display: block; margin-top: 2px; font-size: 13px; color: var(--as-sub); }
.acu-fila-l > span:last-child { font: 400 13.5px/1.3 var(--texto); color: var(--as-sub); text-align: right; white-space: nowrap; }
.acu-fila-l > span:last-child b { font: 400 15px/1 var(--numeros); color: var(--as-tinta); }
.acu-base-b { appearance: none; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; margin-top: 18px; padding: 0; border: 0; background: none; color: var(--as-sub); font: 400 14px/1 var(--texto); cursor: pointer; }
.acu-base-b .acu-chev svg { transition: rotate 0.36s var(--acu-curva); }
.acu-base-b[aria-expanded="true"] .acu-chev svg { rotate: 180deg; }
.acu-base .acu-pliegue .acu-p { padding-left: 0; font-size: 13.5px; }
.acu-celdas { display: grid; grid-template-columns: 1fr 1fr; margin-top: 18px; border-top: 1px solid var(--acu-regla); }
.acu-celda { appearance: none; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; padding: 14px 12px 14px 0; border: 0; border-bottom: 1px solid var(--acu-regla); background: none; color: var(--as-tinta); text-align: left; cursor: pointer; }
.acu-celda:nth-child(2n) { padding: 14px 0 14px 12px; border-left: 1px solid var(--acu-regla); }
.acu-celda-n { font: italic 500 19px/1.1 var(--titulos); }
.acu-celda > svg { width: 100%; height: 50px; margin: 2px 0; }
.acu-celda-v { font: 400 13.5px/1.3 var(--texto); }
.acu-celda-d { font: 400 13px/1.3 var(--texto); color: var(--as-sub); }
.acu-celda-x { font: 400 13px/1.3 var(--texto); color: var(--acu-tinta); }
.acu-celda-ir { margin-top: 2px; font: 400 13px/1.2 var(--texto); color: var(--as-apagado); }
.acu .am-chispa .am-chispa-banda { fill: url(#acu-t-araya); opacity: 0.5; }
.acu .am-chispa .am-chispa-recta { stroke: var(--acu-tinta); stroke-width: 1.4; }
.acu .am-chispa.sinSubidaClara .am-chispa-recta, .acu .am-chispa.noSeSabe .am-chispa-recta { stroke: var(--as-sub); stroke-dasharray: 3 2.5; }
.acu .am-chispa.bajo .am-chispa-recta { stroke: var(--as-tinta); stroke-dasharray: 1 2.4; stroke-linecap: round; }
.acu .am-chispa .am-chispa-punto { fill: var(--as-tinta); }
.acu-meta { padding: 18px 0 16px; border-bottom: 1px solid var(--acu-regla); }
.acu-meta:first-of-type { border-top: 1px solid var(--acu-regla); margin-top: 16px; }
.acu-meta-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.acu-meta-n { margin: 0; font: italic 500 23px/1.1 var(--titulos); color: var(--as-tinta); }
.acu-meta-kg { font: 300 20px/1 var(--numeros); color: var(--acu-tinta); white-space: nowrap; }
.acu-meta-o { margin: 3px 0 0; font: 400 13px/1.3 var(--texto); color: var(--as-sub); }
.acu-pista { display: block; width: 100%; height: 50px; margin-top: 10px; overflow: visible; }
.acu-pista .eje { stroke: var(--acu-regla); stroke-width: 1; }
.acu-pista .tic { stroke: var(--as-apagado); stroke-width: 1; }
.acu-pista text { fill: var(--as-sub); font: 400 13px/1 var(--texto); }
.acu-pista text.hoy { fill: var(--as-tinta); }
.acu-pista .ventana { fill: url(#acu-t-araya); stroke: var(--acu-tinta); stroke-width: 1; }
.acu-pista .hasta { stroke: var(--acu-tinta); stroke-width: 1.4; stroke-linecap: round; }
.acu-pista .no { stroke: var(--as-sub); stroke-width: 1.2; stroke-dasharray: 1.5 3.5; stroke-linecap: round; }
.acu-pista .yo { fill: var(--as-tinta); stroke: #05060a; stroke-width: 2; }
.acu-pista .sesion { fill: var(--acu-tinta); }
.acu-pista .falta { fill: none; stroke: var(--acu-tinta); stroke-width: 1; }
.acu-meta-l { margin: 8px 0 0; font: 400 15px/1.35 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.acu-meta-l.suave { font-size: 13.5px; color: var(--as-sub); }
.acu-pasos { display: flex; flex-wrap: wrap; gap: 0 14px; margin-top: 6px; }
.acu-paso { position: relative; appearance: none; display: inline-flex; align-items: center; gap: 5px; min-height: 44px; min-width: 44px; padding: 0; border: 0; background: none; color: var(--as-sub); font: 400 13.5px/1 var(--texto); cursor: pointer; transition: color 0.2s; }
.acu-paso::after { content: ''; position: absolute; left: 0; right: 0; bottom: 9px; height: 1px; background: var(--acu-tinta); scale: 0 1; transform-origin: left; transition: scale 0.3s var(--acu-curva); }
.acu-paso[aria-pressed="true"]::after { scale: 1 1; }
.acu-paso b { font: 500 13px/1 var(--numeros); color: var(--as-apagado); }
.acu-paso.bien b { color: var(--as-tinta); }
.acu-paso.mejorar b { color: var(--acu-tinta); }
.acu-paso[aria-pressed="true"] { color: var(--as-tinta); }
.acu-paso-t { margin: 0; min-height: 20px; font: 400 13.5px/1.4 var(--texto); color: var(--as-sub); }
.acu-numeros { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 12px; margin-top: 18px; }
.acu-numeros b { display: block; font: 300 27px/1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.acu-numeros span { display: block; margin-top: 4px; font: 400 13px/1.25 var(--texto); color: var(--as-sub); }
/* El mapa del año, propio: los meses en letra que se lee (el compartido los dibuja a 8 px) y un renglón por mes. */
.acu-mapa { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; row-gap: 4px; margin-top: 22px; cursor: pointer; }
.acu-mes { font: 400 13px/1 var(--texto); color: var(--as-sub); }
.acu-mapa svg { display: block; width: 100%; height: auto; overflow: visible; }
.acu .am-anio .am-anio-dia { fill: rgba(170, 178, 196, 0.08); cursor: pointer; }
.acu .am-anio .am-anio-dia.futuro { fill: none; stroke: rgba(170, 178, 196, 0.12); stroke-width: 0.5; }
.acu .am-anio .am-anio-dia.piernas { fill: var(--acu-tinta); }
.acu .am-anio .am-anio-dia.espalda { fill: url(#acu-t-araya); stroke: var(--acu-tinta); stroke-width: 0.6; }
.acu .am-anio .am-anio-dia.pecho { fill: url(#acu-t-ap); stroke: var(--acu-tinta); stroke-width: 0.6; }
.acu .am-anio .am-anio-dia.brazos { fill: none; stroke: var(--acu-tinta); stroke-width: 1; }
.acu .am-anio .am-anio-dia.hoy { stroke: var(--as-tinta); stroke-width: 1; }
.acu .am-anio .am-anio-dia.acu-elegido { stroke: var(--as-tinta); stroke-width: 1.4; }
.acu .am-anio .am-anio-marca { fill: var(--as-tinta); stroke: #05060a; stroke-width: 0.7; }
.acu-mapa-d { margin: 12px 0 0; min-height: 20px; font: 400 14px/1.35 var(--texto); color: var(--as-tinta); }
.acu-leyenda-a { display: flex; flex-wrap: wrap; gap: 8px 14px; margin-top: 12px; font: 400 13px/1 var(--texto); color: var(--as-sub); }
.acu-leyenda-a span { display: inline-flex; align-items: center; gap: 6px; }
.acu-leyenda-a svg { width: 13px; height: 13px; overflow: visible; }

@media (prefers-reduced-motion: reduce) {
  .tel .pr-pantalla.acu { transition-duration: 0.12s; }
  .acu *, .acu *::before, .acu *::after { animation-duration: 0.12s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; transition-duration: 0.12s !important; transition-delay: 0s !important; }
  .acu-rotulo, .acu-nota { translate: none; }
  @keyframes acu-sube { from { opacity: 0; } }
  .acu .acu-capa .am-m.acu-elegido { transform: none; }
}
`;

Galeria.propuesta({
  id: 'ascentCuerpo',
  titulo: 'Ascent, opción B: el cuerpo como menú',
  texto: 'El cuerpo dibujado es la pantalla y el menú: cada músculo que importa hoy lleva su rótulo. Arrastralo de costado para girarlo y tocá un músculo.',
  vistas: [['aviso', 'La pantalla principal'], ['musculo', 'Al tocar un músculo'], ['semana', 'Cómo va la semana'], ['fatiga', 'Qué músculos están cansados']],
  mas: [
    ['calma', 'Un día normal, sin avisos'], ['casi', 'Un aviso suave: le falta 1 día'], ['nocheCorta', 'Después de dormir poco'], ['hecha', 'Después de entrenar'],
    ['descanso', 'Un día de descanso'], ['nueva', 'Recién vinculada'], ['espalda', 'El cuerpo de espalda'], ['fuerza', 'Al tocar «Tu fuerza»'],
    ['metas', 'Al tocar «Metas»'], ['anio', 'Al tocar «Tu año»'], ['lista', 'Todo en una lista'], ['rango1', 'Con el rango 1'], ['rango5', 'Con el rango 5'],
    ['en', 'En inglés'],
  ],
  principal: 0,
  crear(g) {
    g.estilo('acu-css', CSS);
    const p = g.pantalla('acu as-vars', { conBarra: true });
    const u = Util.crear(g.opciones);
    const { el, tx } = u;
    const M = window.AscentDeMentira;
    const quieto = g.movimientoReducido;
    const ms = (n) => (quieto ? 120 : n);
    const NS = 'http://www.w3.org/2000/svg';

    // Lo que se ve: el día, la lente, el lado, y lo abierto encima (un músculo o una página).
    const VISTAS = {
      aviso: { dia: 'cargado', lente: 'hoy' },
      semana: { dia: 'cargado', lente: 'semana' },
      fatiga: { dia: 'cargado', lente: 'fatiga' },
      calma: { dia: 'normal', lente: 'hoy' },
      casi: { dia: 'casi', lente: 'hoy' },
      hecha: { dia: 'hecha', lente: 'hoy' },
      descanso: { dia: 'descanso', lente: 'hoy' },
      nocheCorta: { dia: 'nocheCorta', lente: 'hoy' },
      nueva: { dia: 'nueva', lente: 'hoy' },
      espalda: { dia: 'cargado', lente: 'hoy', lado: 'espalda' },
      musculo: { dia: 'cargado', lente: 'hoy', musculo: 'cuadriceps' },
      fuerza: { dia: 'cargado', lente: 'hoy', pagina: 'fuerza' },
      metas: { dia: 'cargado', lente: 'hoy', pagina: 'metas' },
      anio: { dia: 'cargado', lente: 'hoy', pagina: 'anio' },
      lista: { dia: 'cargado', lente: 'hoy', pagina: 'lista' },
      rango1: { dia: 'cargado', lente: 'hoy', rango: 1 },
      rango5: { dia: 'cargado', lente: 'hoy', rango: 5 },
      en: { dia: 'cargado', lente: 'hoy', idioma: 'en' },
    };
    const estado = { vista: null, dia: 'cargado', lente: 'hoy', lado: 'frente', musculo: null, pagina: null, respondido: {} };
    let d = null;
    let geo = null;
    let portada = null;
    let vivos = [];
    let delLado = [];
    let giro = null;
    let paginaAbierta = null;
    // Lo que había al irse a «¿Por qué no estás mejorando?»: al volver, queda igual.
    let pendiente = null;
    let rangoGuardado = null;
    const esperas = new Set();
    const despues = (fn, t) => { const id = setTimeout(() => { esperas.delete(id); fn(); }, t); esperas.add(id); };
    const cancelarEsperas = () => { esperas.forEach(clearTimeout); esperas.clear(); };

    // ------------------------------------------------------------ los textos
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));
    // Al cortar el renglón, el número no se separa de su unidad.
    const pegado = (s) => String(s).replace(/(\d) (%|kg\b|h\b|min\b|g\b|sesiones|sesión|semanas|semana|series|sessions|session|weeks|week|sets)/g, '$1 $2').replace(/ × /g, ' × ');
    const conVars = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k])) : s);
    const tr = (clave, vars) => {
      const s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS[g.idioma] || TEXTOS.es);
      return typeof s === 'string' ? conVars(s, vars) : s;
    };
    const trPlural = (clave, n, vars) => { const f = tr(clave); return conVars(n === 1 ? f.uno : f.otros, Object.assign({ n }, vars)); };
    const conMay = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
    // «ayer» → «de ayer», «el lunes» → «del lunes»; en inglés, «from yesterday», «from Monday».
    const desdeEnFrase = (desde) => {
      if (!desde) return '';
      if (g.idioma === 'en') return 'from ' + desde.replace(/^on /, '');
      return /^el /.test(desde) ? desde.replace(/^el /, 'del ') : 'de ' + desde;
    };
    const tituloDe = (k) => ({ fuerza: tx('ascent.fuerza.titulo'), metas: tx('ascent.metas.titulo'), anio: tx('ascent.anio.titulo'), sesion: tr('sesionDeHoy'), lista: tr('lista'), base: tx('ascent.enQueSeBasa') }[k]);
    const musculo = (id) => d.musculos.find((m) => m.id === id);
    const visible = (lado, id) => !!ANCLAS[lado][id];
    const ladoDe = (id) => (ANCLAS.frente[id] ? 'frente' : 'espalda');
    const svg = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs || {}).forEach(([k, v]) => n.setAttribute(k, v)); return n; };

    // ------------------------------------------------------------ la tinta: el color del rango
    const luminancia = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    function ponerTinta() {
      const r = M.rango();
      // El color del rango; si es oscuro (el polvo, el asteroide, la luna), su claro: sobre casi negro tiene que leerse.
      p.el.style.setProperty('--acu-tinta', luminancia(r.paleta.principal) >= 0.28 ? r.paleta.principal : r.paleta.claro);
      return r;
    }

    // ------------------------------------------------------------ el medallón: el cuerpo del rango, a trazo
    function azar(semilla) {
      let a = semilla >>> 0;
      return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    function medallon(r) {
      const az = azar(17 + r.rango * 31);
      const f = (n) => n.toFixed(2);
      const C = 32;
      const ORB = 'transform="rotate(-24 32 32)"';
      let tapa = '';
      let cuerpo = '';
      if (r.cuerpo === 'polvo') {
        for (let i = 0; i < 54; i++) {
          const a = az() * Math.PI * 2;
          const q = Math.pow(az(), 0.75) * 15;
          cuerpo += `<circle class="acu-med-f" cx="${f(C + Math.cos(a) * q * 1.2)}" cy="${f(C + Math.sin(a) * q * 0.75)}" r="${f(0.3 + az() * 0.75)}" opacity="${f(0.3 + az() * 0.7)}"/>`;
        }
        cuerpo += '<path class="acu-med-t" d="M44 20.5v6M41 23.5h6"/>';
      } else if (r.cuerpo === 'asteroide') {
        const pts = Array.from({ length: 11 }, (_, i) => { const a = (i / 11) * Math.PI * 2; const q = 11.5 + (az() - 0.5) * 4.5; return [C + Math.cos(a) * q * 1.08, C + Math.sin(a) * q * 0.86]; });
        const d0 = g.secciones.ascent.piezas.trazosDelCuerpo.curvaCerrada(pts);
        tapa = `<path class="acu-med-tapa" d="${d0}"/>`;
        cuerpo = `<path class="acu-med-t" d="${d0}"/>` + [[27, 29, 2.3], [36.5, 35.5, 1.6], [33, 24.5, 1.1], [24, 36, 0.9]].map(([x, y, q]) => `<circle class="acu-med-fino" cx="${x}" cy="${y}" r="${q}"/>`).join('');
      } else if (r.cuerpo === 'luna') {
        tapa = '<circle class="acu-med-tapa" cx="32" cy="32" r="14"/>';
        let sombra = '';
        for (let y = 20.5; y <= 43.5; y += 2.3) {
          const k = Math.sqrt(Math.max(0, 1 - ((y - 32) / 14) ** 2));
          sombra += `<path class="acu-med-fino" d="M${f(32 + 5 * k)} ${f(y)} H${f(32 + 13.6 * k)}"/>`;
        }
        cuerpo = '<circle class="acu-med-t" cx="32" cy="32" r="14"/><path class="acu-med-fino" d="M32 18 A5 14 0 0 1 32 46"/>' + sombra
          + [[26, 27, 2.4], [28.5, 38.5, 1.6], [22, 33, 1.1]].map(([x, y, q]) => `<circle class="acu-med-fino" cx="${x}" cy="${y}" r="${q}"/>`).join('');
      } else if (r.cuerpo === 'planeta') {
        tapa = '<circle class="acu-med-tapa" cx="32" cy="32" r="13"/>';
        const anillo = r.planeta === 'Saturno';
        cuerpo = (anillo ? '<path class="acu-med-t" d="M10 32 A22 5.5 0 0 1 54 32" transform="rotate(-14 32 32)"/>' : '')
          + '<circle class="acu-med-n" cx="32" cy="32" r="13"/>'
          + '<path class="acu-med-fino" d="M19.5 28.5 Q32 31.5 44.5 28.5M19.2 34.5 Q32 38 44.8 34.5M22 40.5 Q32 43 42 40.5M23 23.5 Q32 25.5 41 23.5"/>'
          + (anillo ? '<path class="acu-med-t" d="M10 32 A22 5.5 0 0 0 54 32" transform="rotate(-14 32 32)"/>' : '');
      } else if (r.cuerpo === 'sol') {
        tapa = '<circle class="acu-med-tapa" cx="32" cy="32" r="16"/>';
        cuerpo = '<circle class="acu-med-t" cx="32" cy="32" r="10.5"/><circle class="acu-med-fino" cx="32" cy="32" r="6.5"/>'
          + Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; const r2 = i % 2 ? 15 : 17; return `<path class="acu-med-t" d="M${f(C + Math.cos(a) * 13)} ${f(C + Math.sin(a) * 13)} L${f(C + Math.cos(a) * r2)} ${f(C + Math.sin(a) * r2)}"/>`; }).join('');
      } else if (r.cuerpo === 'galaxia') {
        [0, Math.PI].forEach((base) => {
          const pts = Array.from({ length: 26 }, (_, i) => { const t = i / 25; const a = base + t * 3.4 * Math.PI * 0.62; const q = 1.5 + t * 15.5; return [C + Math.cos(a) * q * 1.18, C + Math.sin(a) * q * 0.72]; });
          cuerpo += `<path class="acu-med-t" d="M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')}"/>`;
          pts.forEach(([x, y], i) => { if (i % 2) cuerpo += `<circle class="acu-med-f" cx="${f(x + (az() - 0.5) * 3)}" cy="${f(y + (az() - 0.5) * 2.4)}" r="${f(0.35 + az() * 0.55)}" opacity="${f(0.4 + az() * 0.6)}"/>`; });
        });
        cuerpo += '<circle class="acu-med-f" cx="32" cy="32" r="2"/>';
      } else {
        tapa = '<circle class="acu-med-tapa" cx="32" cy="32" r="11.5"/>';
        cuerpo = '<path class="acu-med-t" d="M10 32 A22 6 0 0 1 54 32" transform="rotate(-12 32 32)"/><circle class="acu-med-n" cx="32" cy="32" r="9.5"/><circle class="acu-med-fino" cx="32" cy="32" r="11.3"/>'
          + '<path class="acu-med-t" d="M10 32 A22 6 0 0 0 54 32" transform="rotate(-12 32 32)"/>';
      }
      const a = (200 * Math.PI) / 180;
      const [ox, oy] = [30 * Math.cos(a), 9.5 * Math.sin(a)];
      const giro24 = (-24 * Math.PI) / 180;
      const luna = [C + ox * Math.cos(giro24) - oy * Math.sin(giro24), C + ox * Math.sin(giro24) + oy * Math.cos(giro24)];
      return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="acu-med-marco" cx="32" cy="32" r="30.5" pathLength="1"/>`
        + `<path class="acu-med-orbita" d="M2 32 A30 9.5 0 0 1 62 32" ${ORB}/>${tapa}<g class="acu-med-cuerpo">${cuerpo}</g>`
        + `<path class="acu-med-orbita" d="M2 32 A30 9.5 0 0 0 62 32" ${ORB}/><circle class="acu-med-f acu-med-luna" cx="${f(luna[0])}" cy="${f(luna[1])}" r="1.5"/></svg>`;
    }
    // Las órbitas de pelo: círculos alrededor del medallón, que pasan por detrás de todo.
    function dibujarOrbitas() {
      const o = p.el.querySelector('.acu-orbitas');
      const m = p.el.querySelector('.acu-medallon').getBoundingClientRect();
      const r0 = p.el.getBoundingClientRect();
      const cx = m.left + m.width / 2 - r0.left;
      const cy = m.top + m.height / 2 - r0.top;
      o.innerHTML = [[58, 0.16, ''], [116, 0.11, '1 5'], [205, 0.08, ''], [340, 0.06, '2 6']]
        .map(([q, op, raya]) => `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${q}" pathLength="1" style="stroke-opacity:${op}"${raya ? ` data-raya="${raya}"` : ''}/>`).join('');
      // Las punteadas no se trazan al entrar: ya son livianas.
      o.querySelectorAll('[data-raya]').forEach((c) => { c.removeAttribute('pathLength'); c.style.strokeDasharray = c.dataset.raya; c.style.animation = 'acu-funde 1.2s 0.3s ease both'; });
    }

    // ------------------------------------------------------------ los dibujos chicos
    /** Una muestra de la trama de una fase de la fatiga (0 vacía a 3 llena de puntos), a la escala del cuerpo. */
    const muestra = (paso) => `<svg class="acu-muestra" viewBox="0 0 7.2 7.2" aria-hidden="true"><circle class="${paso ? 'p' + paso : ''}" cx="3.6" cy="3.6" r="3.1"/></svg>`;
    const fasesEnFila = (paso) => `<span class="acu-fases" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<svg viewBox="0 0 7.2 7.2" class="${i === paso ? 'actual' : ''}"><circle class="${i ? 'p' + i : ''}" cx="3.6" cy="3.6" r="3.1"/></svg>`).join('')}</span>`;
    function figuraSvg(lado, estados, etiqueta) {
      const caja = document.createElement('div');
      caja.innerHTML = M.figura(lado, estados, { etiqueta: etiqueta || ' ' });
      const s = caja.firstElementChild;
      s.setAttribute('viewBox', `${RECORTE.x} ${RECORTE.y} ${RECORTE.ancho} ${RECORTE.alto}`);
      if (!etiqueta) { s.removeAttribute('role'); s.removeAttribute('aria-label'); s.setAttribute('aria-hidden', 'true'); }
      return s;
    }
    function estadosPara(lente) {
      const r = M.estadosDe(d, lente);
      if (lente === 'hoy' && d.nueva && d.sesion) d.sesion.musculos.forEach((id) => { r[id] = 'porEncender'; });
      if (lente === 'hoy' && d.aviso && d.sesion && d.sesion.estado === 'prevista') d.aviso.musculos.forEach((id) => { r[id] += ' acu-del-aviso'; });
      // En descanso, lo que todavía se recupera se ve con sus puntos, como lo dice su rótulo.
      if (lente === 'hoy' && !d.sesion) d.musculos.forEach((m) => { if (m.fatiga.dias && !r[m.id]) r[m.id] = 'acu-descansa ' + m.fatiga.fase; });
      return r;
    }
    function etiquetaDelCuerpo() {
      const lado = tx('ascent.cuerpo.' + estado.lado);
      if (estado.lente === 'semana') return `${lado}. ${d.semana.resumen}`;
      if (estado.lente === 'fatiga') return `${lado}. ${d.fatiga.lista.length ? d.fatiga.lista.map((id) => `${musculo(id).nombre}: ${musculo(id).fatiga.nombre}`).join(', ') : d.fatiga.ninguno}`;
      return `${lado}. ${d.sesion ? conMay(d.sesion.musculosTexto) : d.siguiente ? d.siguiente.linea : ''}`;
    }
    // El dibujo chico de cada enlace: viaja con él a su página.
    function mini(k) {
      if (k === 'fuerza') {
        const e = d.fuerza.ejercicios.find((x) => x.estado === 'sube') || d.fuerza.ejercicios[0];
        if (!e) return '<svg viewBox="0 0 46 14" aria-hidden="true"><path class="acu-mini-eje" d="M2 7H44"/></svg>';
        return M.chispa(e, { ancho: 46, alto: 14 }).replace(/role="img" aria-label="[^"]*"/, 'aria-hidden="true"');
      }
      if (k === 'metas') {
        const m = d.metas.lista.find((x) => x.avance != null) || d.metas.lista[0];
        const x = m && m.avance != null ? 2 + Math.min(1, m.avance) * 38 : 2;
        return `<svg viewBox="0 0 46 14" aria-hidden="true"><path class="acu-mini-eje" d="M2 7H40"/><path class="acu-mini-t" d="M2 7H${x.toFixed(1)}"/><circle class="acu-mini-f" cx="${x.toFixed(1)}" cy="7" r="2.4"/><path class="acu-mini-t" d="M42.5 2.5V11.5"/></svg>`;
      }
      return `<svg viewBox="0 0 46 14" aria-hidden="true">${d.anio.recientes.map((x, i) => `<rect class="${x.grupo ? 'acu-mini-f' : 'acu-mini-v'}" x="${(Math.floor(i / 2) * 3.3).toFixed(1)}" y="${i % 2 ? 7.6 : 2}" width="2.5" height="4.4" rx="0.6"/>`).join('')}</svg>`;
    }

    // ------------------------------------------------------------ la portada
    function lineaDeHoy() {
      // Recién vinculada, la línea dice cuánto lleva: la sesión de hoy ya va en su rótulo.
      if (d.nueva) return esc(d.nueva.texto);
      const partes = [esc(d.hoy.linea)];
      if (d.sesion && d.sesion.comoFue) partes.push(esc(tr('comoFue', { palabra: d.sesion.comoFue.palabra.toLowerCase() })));
      else if (d.hoy.noche && d.hoy.noche.corta) partes.push(`<b>${esc(tr('anoche', { horas: d.hoy.noche.texto }))}</b>`);
      return partes.join(' · ');
    }
    function construirPortada() {
      const po = el('div', 'acu-portada');
      const cab = el('header', 'acu-cab');
      const fila = el('div', 'acu-fila');
      const preg = u.boton('acu-ico', '<span class="acu-preg" aria-hidden="true">?</span>', (ev) => abrirPagina('base', ev.currentTarget), tx('ascent.enQueSeBasa'));
      preg.dataset.pagina = 'base';
      const lista = u.boton('acu-ico', u.icono('asa'), (ev) => abrirPagina('lista', ev.currentTarget), tr('lista'));
      lista.dataset.pagina = 'lista';
      fila.append(el('span', 'acu-marca', tx('ascent.titulo')), preg, lista);
      const linea = el('p', 'acu-linea');
      linea.innerHTML = lineaDeHoy();
      cab.append(fila, el('h1', 'acu-titular', d.hoy.corto), linea);
      const lam = el('div', 'acu-lamina');
      lam.innerHTML = '<div class="acu-cuerpo"><div class="acu-giro"></div></div><svg class="acu-guias" aria-hidden="true"></svg><div class="acu-rotulos"></div>';
      const lados = el('div', 'acu-lados');
      ['frente', 'espalda'].forEach((k, i) => {
        const b = u.boton('', esc(tx('ascent.cuerpo.' + k)), () => girarA(k));
        b.dataset.lado = k;
        if (i) { const pts = el('span', 'acu-puntos'); pts.setAttribute('aria-hidden', 'true'); pts.innerHTML = '<i></i><i></i>'; lados.appendChild(pts); }
        lados.appendChild(b);
      });
      lam.appendChild(lados);
      const lentes = el('div', 'acu-lentes');
      lentes.setAttribute('role', 'group');
      lentes.setAttribute('aria-label', tr('lentesEtiqueta'));
      ['hoy', 'semana', 'fatiga'].forEach((k) => { const b = u.boton('acu-lente', esc(tr('lentes.' + k)), () => ponerLente(k)); b.dataset.lente = k; lentes.appendChild(b); });
      lentes.appendChild(el('i', 'acu-lentes-marca'));
      const enlaces = el('nav', 'acu-enlaces');
      // Recién vinculada, Tu fuerza y Tu año todavía no tienen qué mostrar (spec: lo que sobra el primer mes).
      (d.nueva ? ['metas'] : ['fuerza', 'metas', 'anio']).forEach((k) => {
        const b = u.boton('acu-enlace', `${mini(k)}<span>${esc(tituloDe(k))}<i aria-hidden="true">›</i></span>`, (ev) => abrirPagina(k, ev.currentTarget));
        b.dataset.pagina = k;
        enlaces.appendChild(b);
      });
      const prog = u.boton('acu-progreso', `<span>${esc(tx('pestanas.progreso'))}</span>${u.icono('abajo')}`, irAProgreso, tx('ascent.volverAProgreso'));
      po.append(cab, lam, lentes, el('div', 'acu-pie'), enlaces, prog);
      return po;
    }
    function medir() {
      const lam = portada.querySelector('.acu-lamina');
      const W = lam.clientWidth;
      const H = lam.clientHeight;
      const rl = lam.getBoundingClientRect();
      // La cabeza empieza debajo del medallón; los rótulos, debajo del encabezado.
      const arriba = Math.max(8, p.el.querySelector('.acu-medallon').getBoundingClientRect().bottom - rl.top + 4);
      const alto = Math.max(160, H - arriba - LADOS - 4);
      const s = alto / RECORTE.alto;
      const ancho = RECORTE.ancho * s;
      const izq = W - 4 - ancho;
      const col = Math.round(izq + (16.6 - RECORTE.x) * s - 18 - 14);
      // El ancho de la columna cambia el alto del encabezado (su línea se corta ahí): primero el ancho, después el alto.
      portada.style.setProperty('--acu-col', `${col}px`);
      const tope = portada.querySelector('.acu-cab').offsetHeight + 14;
      geo = { W, H, s, izq, arriba, ancho, alto, tope, col };
      Object.assign(lam.querySelector('.acu-cuerpo').style, { left: `${izq}px`, top: `${arriba}px`, width: `${ancho}px`, height: `${alto}px` });
      const lados = lam.querySelector('.acu-lados');
      const centro = Math.min(izq + ancho / 2, W - 10 - lados.offsetWidth / 2);
      geo.ladosArriba = arriba + alto + 2;
      geo.ladosIzq = centro - lados.offsetWidth / 2;
      lados.style.top = `${geo.ladosArriba.toFixed(1)}px`;
      lados.style.left = `${centro.toFixed(1)}px`;
    }
    const enLamina = ([x, y]) => [geo.izq + (x - RECORTE.x) * geo.s, geo.arriba + (y - RECORTE.y) * geo.s];

    /** El cuerpo del rango de ahora en el medallón (y la tinta); con `fundir`, el de antes se va mientras entra el nuevo. */
    function ponerMedallon(fundir) {
      const med = p.el.querySelector('.acu-medallon');
      const viejos = [...med.children];
      med.insertAdjacentHTML('beforeend', medallon(ponerTinta()));
      viejos.forEach((v) => {
        if (!fundir) { v.remove(); return; }
        Object.assign(v.style, { position: 'absolute', inset: '0' });
        const a = v.animate([{ opacity: getComputedStyle(v).opacity }, { opacity: 0 }], { duration: ms(400), fill: 'forwards' });
        a.onfinish = () => v.remove();
        a.oncancel = () => v.remove();
      });
      if (fundir && viejos.length) med.lastElementChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(400), easing: 'ease' });
    }
    function pintar(entrada) {
      d = M.dia(estado.dia);
      // Al cambiar de vista con la pantalla abierta, lo de antes se funde mientras entra lo nuevo.
      const fundir = (n) => { n.style.pointerEvents = 'none'; n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(260), fill: 'forwards' }).finished.then(() => n.remove()); };
      ponerMedallon(!!entrada);
      const nueva = construirPortada();
      if (portada && entrada) { fundir(portada); p.el.appendChild(nueva); } else if (portada) portada.replaceWith(nueva);
      else p.el.appendChild(nueva);
      portada = nueva;
      vivos = [];
      dibujarOrbitas();
      medir();
      ponerCapas(false);
      pintarPie(false);
      marcarLentes();
      marcarLados();
      p.el.classList.toggle('acu-entrando', !!entrada);
      portada.classList.toggle('acu-llega', !!entrada);
      // Fuera de las esperas que se cancelan: si se toca algo durante la entrada, la entrada igual termina.
      const esta = portada;
      if (entrada) setTimeout(() => { p.el.classList.remove('acu-entrando'); esta.classList.remove('acu-llega'); }, 1700);
      despues(() => pintarRotulos(true), entrada ? ms(640) : ms(60));
    }

    // ------------------------------------------------------------ las capas del cuerpo: la silueta y la lente
    function ponerCapas(fundir) {
      const giroEl = portada.querySelector('.acu-giro');
      let base = giroEl.querySelector('.acu-capa-base');
      if (!base || base.dataset.lado !== estado.lado) {
        const nb = el('div', 'acu-capa-base');
        nb.dataset.lado = estado.lado;
        nb.appendChild(figuraSvg(estado.lado, {}, ''));
        nb.querySelector('.am-base path').setAttribute('pathLength', '1');
        if (base) base.replaceWith(nb);
        else giroEl.prepend(nb);
      }
      const viejas = [...giroEl.querySelectorAll('.acu-capa:not(.acu-sale)')];
      const capa = el('div', `acu-capa acu-lente-${estado.lente}`);
      capa.appendChild(figuraSvg(estado.lado, estadosPara(estado.lente), etiquetaDelCuerpo()));
      giroEl.appendChild(capa);
      if (fundir) {
        capa.classList.add('acu-entra');
        viejas.forEach((v) => { v.classList.add('acu-sale'); setTimeout(() => v.remove(), 340); });
      } else viejas.forEach((v) => v.remove());
    }

    // ------------------------------------------------------------ los rótulos
    const ejerciciosDe = (m) => (d.sesion ? d.sesion.ejercicios.filter((e) => m.deHoy.includes(e.id)) : []);
    const pesoCorto = (e) => (e.decision === 'sube' && e.subeTexto ? e.subeTexto : e.decision === 'primera' ? '' : e.pesoTexto || '');
    const lineaDeFase = (m) => ({ t: `${m.fatiga.nombre} · ${m.fatiga.listo}`, fase: m.fatiga.paso });
    // Una frase de la app en dos renglones que se leen solos: «Los entrenaste ayer:» / «12 series, 4 al fallo.».
    const partido = (t, sep, c2) => {
      const i = t.indexOf(sep);
      if (i < 0) return [{ t }];
      const corte = sep.trim() === ':' ? i + 1 : i;
      return [{ t: t.slice(0, corte).trim() }, { t: t.slice(corte).trim(), c: `${c2} sigue` }];
    };
    /** El aviso como rótulo; `compacto`, sin la estimación (queda en el panel del músculo), cuando no entra entero. */
    function rotuloDelAviso(ancla, compacto) {
      const a = d.aviso;
      const respondido = estado.respondido[estado.dia];
      const lineas = respondido
        ? [{ t: a.queHacerCorto, c: 'fuerte' }, { t: `✓ ${tr('anotado.' + respondido)}`, c: 'suave' }]
        : [...partido(a.hecho, ': ', ''), ...(compacto ? [] : partido(a.estimacion, ' (', 'suave')), { t: a.queHacerCorto, c: 'fuerte' }];
      return { ancla, clase: 'aviso', compacto, kicker: trPlural('siguen.' + a.nivel, a.musculos.length), nombre: a.musculosTexto, lineas, respuestas: a.pide && !respondido ? a.respuestas : null };
    }
    function rotulosHoy(lado) {
      const r = [];
      if (d.nueva) {
        const ids = d.sesion ? d.sesion.musculos.filter((id) => visible(lado, id)) : [];
        if (ids.length) r.push({ ancla: ids[0], kicker: `${d.sesion.nombre} · ${d.sesion.hora}`, nombre: tr('nueva.titulo'), lineas: [{ t: `${conMay(d.sesion.musculosTexto)}.` }] });
        return r;
      }
      if (!d.sesion) {
        const s = d.siguiente;
        const ids = s ? s.musculos.filter((id) => visible(lado, id)) : [];
        if (ids.length) r.push({ ancla: ids[0], kicker: `${conMay(s.cuando)} · ${s.hora}`, nombre: s.nombre, lineas: [{ t: `${conMay(s.musculosTexto)}.`, c: 'suave' }] });
        d.musculos.filter((m) => m.fatiga.dias && visible(lado, m.id) && !(s && s.musculos.includes(m.id))).slice(0, 2)
          .forEach((m) => r.push({ ancla: m.id, nombre: m.nombre, lineas: [lineaDeFase(m)] }));
        return r;
      }
      const hecha = d.sesion.estado === 'hecha';
      const delAviso = d.aviso && !hecha ? d.aviso.musculos.filter((id) => visible(lado, id)) : [];
      if (delAviso.length) r.push(rotuloDelAviso(delAviso[0]));
      d.sesion.musculos.filter((id) => visible(lado, id) && !delAviso.includes(id)).forEach((id) => {
        const m = musculo(id);
        if (hecha) r.push({ ancla: id, kicker: tr('hechoHoy'), nombre: m.nombre, lineas: m.fatiga.dias ? [lineaDeFase(m)] : [] });
        else r.push({ ancla: id, nombre: m.nombre, ejercicios: ejerciciosDe(m) });
      });
      return r;
    }
    function rotulosSemana(lado) {
      const prevista = d.sesion && d.sesion.estado === 'prevista';
      return d.semana.destacados.filter((id) => visible(lado, id)).slice(0, 4).map((id) => {
        const m = musculo(id);
        // Las series que le faltan para llegar a 10: la misma cuenta que la sugerencia de la app (05-ascent-datos.js).
        const n = Math.max(1, Math.ceil(d.semana.escala.desde - m.seriesExactas));
        const lineas = [{ t: tr('estado.' + m.estado, { n }) }];
        if (m.fatiga.dias) lineas.push({ t: tr('faseCorta', { desde: conMay(desdeEnFrase(m.fatiga.desde)), texto: m.fatiga.texto }), fase: m.fatiga.paso });
        return { ancla: id, kicker: m.hoyToca && prevista ? tr('hoyToca') : '', nombre: m.nombre, numero: m.series, lineas };
      });
    }
    function rotulosFatiga(lado) {
      const prevista = d.sesion && d.sesion.estado === 'prevista';
      const ids = d.fatiga.lista.filter((id) => visible(lado, id));
      // Primero lo que toca hoy: es lo que cambia la sesión.
      ids.sort((a, b) => Number(musculo(b).hoyToca) - Number(musculo(a).hoyToca));
      return ids.slice(0, 4).map((id) => {
        const m = musculo(id);
        return { ancla: id, kicker: m.hoyToca && prevista ? tr('hoyToca') : '', nombre: m.nombre, lineas: [lineaDeFase(m), { t: tr('estimado', { desde: conMay(desdeEnFrase(m.fatiga.desde)) }), c: 'suave' }] };
      });
    }
    function nota(html) {
      const n = el('div', 'acu-nota');
      n.innerHTML = html;
      return n;
    }
    /** Los hitos de quien recién vincula; en un iPhone chico, `hasta` deja solo los primeros (lo hecho y lo que sigue). */
    function notaDeNueva(hasta) {
      const nv = d.nueva;
      let hitos = '';
      nv.hitos.slice(0, hasta || nv.hitos.length).forEach((h, i) => {
        hitos += `<li class="acu-hito${h.alcanzado ? ' alcanzado' : ''}"><b>${esc(h.cuando)}:</b> <span>${esc(h.que)}</span></li>`;
        if (i === nv.alcanzados - 1) hitos += `<li class="acu-aqui">${esc(nv.aqui)}</li>`;
      });
      const n = nota(`<ol class="acu-hitos">${hitos}</ol>`);
      n.dataset.hitos = String(hasta || nv.hitos.length);
      return n;
    }
    function modelo(lado) {
      const L = estado.lente;
      const notas = [];
      let rotulos = [];
      if (L === 'hoy') {
        if (d.nueva) notas.push(notaDeNueva());
        rotulos = rotulosHoy(lado);
      } else if (L === 'semana') {
        if (d.semana.primera) notas.push(nota(`<p class="acu-nota-t">${esc(d.semana.resumen)}</p>`));
        else rotulos = rotulosSemana(lado);
      } else {
        rotulos = rotulosFatiga(lado);
        if (!rotulos.length) notas.push(nota(`<p class="acu-nota-t">${esc(d.fatiga.ninguno || tr('nadaDeEsteLado.fatiga'))}</p>`));
      }
      if (!rotulos.length && !notas.length) notas.push(nota(`<p class="acu-nota-t">${esc(tr('nadaDeEsteLado.' + L))}</p>`));
      return { notas, rotulos: rotulos.slice(0, 4) };
    }
    function nodoDeRotulo(it) {
      const n = el('div', 'acu-rotulo' + (it.clase ? ' acu-r-' + it.clase : ''));
      n.dataset.musculo = it.ancla;
      const b = el('button', 'acu-r-abre');
      b.type = 'button';
      let html = it.kicker ? `<span class="acu-r-k">${esc(it.kicker)}</span>` : '';
      html += `<span class="acu-r-n"><span>${esc(it.nombre)}</span>${it.numero != null ? `<b>${it.numero}</b>` : ''}</span>`;
      (it.lineas || []).forEach((l) => { html += `<span class="acu-r-l ${l.c || ''}">${l.fase != null ? muestra(l.fase) : ''}${esc(pegado(l.t))}</span>`; });
      (it.ejercicios || []).forEach((e) => { html += `<span class="acu-r-ej"><i class="${e.decision === 'sube' ? 'sube' : ''}">${esc(e.flecha || '·')}</i><span>${esc(e.nombre)} <em>${esc(pegado(pesoCorto(e)))}</em></span></span>`; });
      b.innerHTML = html;
      b.addEventListener('click', (ev) => { ev.stopPropagation(); abrirMusculo(it.ancla); });
      n.appendChild(b);
      if (it.respuestas) {
        const r = el('div', 'acu-r-resp');
        it.respuestas.forEach((t, i) => {
          if (i) r.appendChild(el('span', null, '·'));
          r.appendChild(u.boton('', esc(t), () => responder(i ? 'bien' : 'entendido')));
        });
        n.appendChild(r);
      }
      return n;
    }
    // Lo que llega a la fila de «De frente · De espalda» la deja respirar: si su texto se acerca a la fila por la derecha,
    // termina arriba de ella; si queda lejos, puede bajar hasta el borde.
    function limiteDe(nodo) {
      const caja = nodo.getBoundingClientRect();
      const r = document.createRange();
      const w = document.createTreeWalker(nodo, NodeFilter.SHOW_TEXT);
      let derecha = 0;
      while (w.nextNode()) {
        r.selectNodeContents(w.currentNode);
        for (const x of r.getClientRects()) if (x.width > 0) derecha = Math.max(derecha, x.right - caja.left);
      }
      return 18 + derecha > geo.ladosIzq - 24 ? geo.ladosArriba - 14 : geo.H - 4;
    }
    function ubicar(items, tope) {
      const GAP = 14;
      const med = items.map(({ it, nodo }) => {
        const rango = document.createRange();
        rango.selectNodeContents(nodo.querySelector('.acu-r-n'));
        const rects = [...rango.getClientRects()].filter((r) => r.width > 0);
        const caja = nodo.getBoundingClientRect();
        const primera = rects[0];
        const derecha = Math.max(...rects.filter((r) => Math.abs(r.top - primera.top) < 4).map((r) => r.right)) - caja.left;
        const [ax, ay] = enLamina(ANCLAS[estado.lado][it.ancla]);
        const centro = primera.top + primera.height / 2 - caja.top;
        return { it, nodo, h: caja.height, centro, derecha, ax, ay, top: ay - centro, limite: limiteDe(nodo) };
      }).sort((a, b) => a.ay - b.ay);
      med.forEach((m, i) => { m.top = Math.max(m.top, i ? med[i - 1].top + med[i - 1].h + GAP : tope); });
      for (let i = med.length - 1; i >= 0; i--) {
        const limite = Math.min(med[i].limite, i === med.length - 1 ? Infinity : med[i + 1].top - GAP);
        if (med[i].top + med[i].h > limite) med[i].top = limite - med[i].h;
      }
      if (med.length && med[0].top < tope) {
        med[0].top = tope;
        for (let i = 1; i < med.length; i++) med[i].top = Math.max(med[i].top, med[i - 1].top + med[i - 1].h + GAP);
      }
      return med;
    }
    function quitarRotulos() {
      const viejos = vivos;
      vivos = [];
      viejos.forEach((v) => {
        v.nodo.style.transitionDelay = '0s';
        v.nodo.style.pointerEvents = 'none';
        v.nodo.classList.remove('acu-ve');
        if (v.guia) {
          v.guia.style.transitionDelay = '0s';
          v.guia.classList.remove('acu-ve');
          v.puntos.forEach((x) => { x.style.transitionDelay = '0.22s'; x.classList.remove('acu-ve'); });
        }
        setTimeout(() => { v.nodo.remove(); if (v.g) v.g.remove(); }, quieto ? 140 : 480);
      });
    }
    function pintarRotulos(animado) {
      if (!portada || estado.musculo || giro) return;
      quitarRotulos();
      const cont = portada.querySelector('.acu-rotulos');
      const guias = portada.querySelector('.acu-guias');
      const { notas, rotulos } = modelo(estado.lado);
      let tope = geo.tope;
      const nuevos = [];
      notas.forEach((primera) => {
        let n = primera;
        n.style.top = `${tope}px`;
        cont.appendChild(n);
        // Recién vinculada en un iPhone chico: si los hitos no entran arriba de la fila de abajo, quedan lo hecho y lo que sigue.
        for (let k = Number(n.dataset.hitos) - 1; n.dataset.hitos && k > d.nueva.alcanzados && tope + n.offsetHeight > limiteDe(n); k--) {
          const otra = notaDeNueva(k);
          otra.style.top = n.style.top;
          n.replaceWith(otra);
          n = otra;
        }
        tope += n.offsetHeight + 20;
        nuevos.push({ nodo: n });
      });
      const items = rotulos.map((it) => { const n = nodoDeRotulo(it); cont.appendChild(n); return { it, nodo: n }; });
      // Si no entran todos (un iPhone chico, una nota larga), se suelta el de menos prioridad (van en orden); el aviso, nunca.
      let puestos = ubicar(items, tope);
      while (puestos.some((m) => m.top + m.h > m.limite + 0.5)) {
        const i = items.findLastIndex((x) => x.it.clase !== 'aviso');
        if (i >= 0) items.splice(i, 1)[0].nodo.remove();
        else {
          // Solo queda el aviso y tampoco entra: va sin la estimación.
          const j = items.findIndex((x) => x.it.clase === 'aviso' && !x.it.compacto);
          if (j < 0) break;
          const it = rotuloDelAviso(items[j].it.ancla, true);
          const n = nodoDeRotulo(it);
          items[j].nodo.replaceWith(n);
          items[j] = { it, nodo: n };
        }
        puestos = ubicar(items, tope);
      }
      delLado = items.map((x) => x.it.ancla);
      puestos.forEach((m) => {
        m.nodo.style.transition = 'none';
        m.nodo.style.top = `${m.top.toFixed(1)}px`;
        void m.nodo.offsetWidth;
        m.nodo.style.transition = '';
        const ny = m.top + m.centro;
        const ex = 18 + m.derecha + 7;
        const kx = Math.max(ex + 12, 18 + geo.col + 12);
        const grupo = svg('g');
        const guia = svg('path', { class: 'acu-guia', d: `M${m.ax.toFixed(1)} ${m.ay.toFixed(1)} L${kx.toFixed(1)} ${ny.toFixed(1)} L${ex.toFixed(1)} ${ny.toFixed(1)}`, pathLength: '1' });
        const punto = svg('circle', { class: 'acu-ancla', cx: m.ax.toFixed(1), cy: m.ay.toFixed(1), r: '3.4' });
        const centro = svg('circle', { class: 'acu-ancla-c', cx: m.ax.toFixed(1), cy: m.ay.toFixed(1), r: '1.1' });
        grupo.append(guia, punto, centro);
        guias.appendChild(grupo);
        nuevos.push({ nodo: m.nodo, guia, puntos: [punto, centro], g: grupo });
      });
      vivos = nuevos;
      marcarTira();
      marcarLados();
      // Primero el punto en el músculo, después la línea hacia el texto y por último el texto.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        let i = 0;
        nuevos.forEach((v) => {
          const t = animado ? i * 80 : 0;
          if (v.guia) {
            v.puntos.forEach((x) => { x.style.transitionDelay = `${t}ms`; x.classList.add('acu-ve'); });
            v.guia.style.transitionDelay = `${t + 90}ms`;
            v.guia.classList.add('acu-ve');
            i++;
          }
          v.nodo.style.transitionDelay = `${v.guia ? t + 300 : t}ms`;
          v.nodo.classList.add('acu-ve');
        });
      }));
    }
    function responder(cual) {
      estado.respondido[estado.dia] = cual;
      pintarRotulos(true);
    }

    // ------------------------------------------------------------ las lentes y los lados
    function marcarLentes() {
      const cont = portada.querySelector('.acu-lentes');
      cont.querySelectorAll('.acu-lente').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lente === estado.lente)));
      const b = cont.querySelector(`[data-lente="${estado.lente}"]`);
      const r = document.createRange();
      r.selectNodeContents(b);
      const rt = r.getBoundingClientRect();
      const rc = cont.getBoundingClientRect();
      const marca = cont.querySelector('.acu-lentes-marca');
      marca.style.width = `${rt.width.toFixed(1)}px`;
      marca.style.translate = `${(rt.left - rc.left).toFixed(1)}px 0`;
    }
    function hayDel(lado) {
      if (lado === estado.lado) return false;
      const deAca = new Set(delLado);
      if (estado.lente === 'hoy') return rotulosHoy(lado).some((r) => !deAca.has(r.ancla));
      if (estado.lente === 'semana') return !d.semana.primera && rotulosSemana(lado).some((r) => !deAca.has(r.ancla));
      return rotulosFatiga(lado).some((r) => !deAca.has(r.ancla));
    }
    function marcarLados() {
      const c = portada.querySelector('.acu-lados');
      c.querySelectorAll('button').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.lado === estado.lado));
        b.classList.toggle('acu-hay', !giro && hayDel(b.dataset.lado));
      });
      const [a, b] = c.querySelectorAll('.acu-puntos i');
      a.classList.toggle('on', estado.lado === 'frente');
      b.classList.toggle('on', estado.lado === 'espalda');
    }
    function ponerLente(k) {
      if (k === estado.lente || estado.musculo || giro) return;
      estado.lente = k;
      quitarRotulos();
      ponerCapas(true);
      pintarPie(true);
      marcarLentes();
      despues(() => pintarRotulos(true), ms(170));
    }

    // Girar: con el dedo de costado, el frente se angosta hasta quedar de canto y del otro lado se abre la espalda.
    // Tocar un músculo (sin arrastrar) lo abre de cerca.
    function gestoDeLamina(ev) {
      if (estado.musculo || giro || ev.target.closest('.acu-rotulo, .acu-lados')) return null;
      const lam = portada.querySelector('.acu-lamina');
      const a = { x: ev.clientX, y: ev.clientY, objetivo: ev.target, girando: false };
      return {
        mover(e) {
          const dx = e.clientX - a.x;
          const dy = e.clientY - a.y;
          if (!a.girando) {
            if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
            a.girando = true;
            try { lam.setPointerCapture(e.pointerId); } catch (x) { /* sin captura, igual sigue */ }
            empezarGiro();
          }
          e.preventDefault();
          ponerAngulo(Math.max(-180, Math.min(180, (dx / (geo.ancho * 1.7)) * 180)));
        },
        soltar(e) {
          if (a.girando) { finDeArrastre = performance.now(); terminarGiro(); return; }
          if (e.type !== 'pointerup' || Math.hypot(e.clientX - a.x, e.clientY - a.y) > 10) return;
          const m = a.objetivo.closest && a.objetivo.closest('.acu-capa [data-musculo]');
          if (m) abrirMusculo(m.dataset.musculo);
        },
      };
    }
    function empezarGiro() {
      giro = { desde: estado.lado, angulo: 0 };
      quitarRotulos();
      marcarLados();
    }
    function ponerAngulo(a) {
      giro.angulo = a;
      const otro = giro.desde === 'frente' ? 'espalda' : 'frente';
      const ver = Math.abs(a) < 90 ? giro.desde : otro;
      if (ver !== estado.lado) {
        estado.lado = ver;
        // Sin movimiento, el cambio de lado se funde; con movimiento, pasa de canto y no se ve.
        ponerCapas(quieto);
        marcarLados();
      }
      const visto = Math.abs(a) < 90 ? a : a - Math.sign(a) * 180;
      if (!quieto) portada.querySelector('.acu-giro').style.transform = `perspective(${Math.round(geo.alto * 2.4)}px) rotateY(${visto.toFixed(2)}deg)`;
    }
    function terminarGiro(destino) {
      const a0 = giro.angulo;
      const fin = destino != null ? destino : Math.abs(a0) > 55 ? Math.sign(a0) * 180 : 0;
      const listo = () => {
        portada.querySelector('.acu-giro').style.transform = '';
        const cambio = giro.desde !== estado.lado;
        giro = null;
        if (cambio && estado.lente === 'semana') pintarPie(true);
        pintarRotulos(true);
      };
      if (quieto) { ponerAngulo(fin); listo(); return; }
      const dur = 160 + 300 * (Math.abs(fin - a0) / 180);
      const t0 = performance.now();
      const paso = (ahora) => {
        if (!giro) return;
        const t = Math.min(1, (ahora - t0) / dur);
        ponerAngulo(a0 + (fin - a0) * (1 - Math.pow(1 - t, 3)));
        if (t < 1) requestAnimationFrame(paso);
        else listo();
      };
      requestAnimationFrame(paso);
    }
    function girarA(lado) {
      if (lado === estado.lado || giro || estado.musculo) return;
      empezarGiro();
      terminarGiro(lado === 'espalda' ? -180 : 180);
    }

    // ------------------------------------------------------------ el pie de cada lente
    function piePalabras() {
      const com = d.sugerencias.find((x) => x.tipo === 'comida');
      const sue = d.sugerencias.find((x) => x.tipo === 'sueno');
      const partes = [];
      if (com && com.macros) partes.push(tr('pie.comida', { macros: com.macros }));
      if (sue && sue.hora) partes.push(tr('pie.cama', { hora: sue.hora }));
      return conMay(partes.join(' · '));
    }
    function pieHoy(capa) {
      const s = d.sesion;
      if (s) {
        const b = el('button', 'acu-sesion');
        b.type = 'button';
        b.dataset.pagina = 'sesion';
        b.setAttribute('aria-label', `${tr('tuSesion')}: ${s.resumen}`);
        b.innerHTML = `<span class="acu-sesion-t">${esc(tr('tuSesion'))}</span><span class="acu-flechas" aria-hidden="true">${s.ejercicios.map((e) => `<i class="${e.decision === 'sube' ? 'sube' : ''}">${esc(e.flecha || '·')}</i>`).join('')}</span>`
          + `<span class="acu-sesion-r">${esc(s.comoFue ? s.comoFue.palabra : s.resumen)}</span><span class="acu-chev" aria-hidden="true">${u.icono('adelante')}</span>`;
        b.addEventListener('click', (ev) => { ev.stopPropagation(); abrirPagina('sesion', b); });
        capa.appendChild(b);
      } else {
        // Sin sesión, lo de mañana ya lo dicen el titular y su rótulo: acá, qué hacer hoy.
        const ent = d.sugerencias.find((x) => x.tipo === 'entreno');
        // «Hoy descansas.» ya es el titular: no se repite.
        if (ent) capa.appendChild(el('p', 'acu-pie-l acu-pie-dia', ent.texto.startsWith(`${d.hoy.corto}. `) ? ent.texto.slice(d.hoy.corto.length + 2) : ent.texto));
      }
      const pl = piePalabras();
      if (pl) capa.appendChild(el('p', 'acu-pie-l', pl));
    }
    function pieFatiga(capa) {
      const ley = el('div', 'acu-leyenda');
      ley.innerHTML = d.fatiga.fases.map((x) => `<span>${muestra(x.paso)}${esc(x.nombre)}</span>`).join('');
      capa.append(ley, el('p', 'acu-pie-nota', d.fatiga.ninguno || tr('estimadoCorto')));
    }
    // La semana en una tira: los 14 músculos en la misma escala de 0 a 30 series; la franja de 10 a 20, lo ideal.
    function tira() {
      const W = geo.W - 36;
      const X = (s) => 5 + (Math.min(s, 30) / 30) * (W - 10);
      // Los puntos van arriba y la franja abajo, como la escala de una lámina: así un punto no tapa la trama.
      const Y = 22;
      const B = 32;
      const primera = d.semana.primera;
      let h = `<line class="eje" x1="${X(0)}" y1="${B}" x2="${X(30)}" y2="${B}"/>`;
      if (!primera) {
        h += `<rect class="poco" x="${X(0)}" y="${B - 2.5}" width="${X(10) - X(0)}" height="5"/><rect class="punto" x="${X(10)}" y="${B - 2.5}" width="${X(20) - X(10)}" height="5"/><rect class="mucho" x="${X(20)}" y="${B - 2.5}" width="${X(30) - X(20)}" height="5"/>`;
        h += [10, 20].map((v) => `<line class="tic" x1="${X(v)}" y1="${B + 3}" x2="${X(v)}" y2="${B + 7}"/>`).join('');
        h += [[0, 'start'], [10, 'middle'], [20, 'middle'], [30, 'end']].map(([v, an]) => `<text x="${X(v)}" y="${B + 19}" text-anchor="${an}">${v}</text>`).join('');
        h += [['poco', 5], ['enSuPunto', 15], ['mucho', 25]].map(([k, v]) => `<text class="zona" x="${X(v)}" y="${B + 19}" text-anchor="middle">${esc(tr('tira.' + k))}</text>`).join('');
      } else h += [[0, 'start'], [10, 'middle'], [20, 'middle'], [30, 'end']].map(([v, an]) => `<text x="${X(v)}" y="${B + 19}" text-anchor="${an}">${v}</text>`).join('');
      const puestos = [];
      [...d.musculos].sort((a, b) => a.seriesExactas - b.seriesExactas).forEach((m) => {
        const x = X(m.seriesExactas);
        let nivel = 0;
        while (puestos.some((q) => q.nivel === nivel && Math.abs(q.x - x) < 8.5)) nivel++;
        puestos.push({ m, x, nivel });
      });
      h += puestos.map((q) => `<circle data-musculo="${q.m.id}" cx="${q.x.toFixed(1)}" cy="${Y - q.nivel * 8}" r="3.4"/>`).join('');
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('class', 'acu-tira');
      s.setAttribute('viewBox', `0 0 ${W} 56`);
      s.setAttribute('role', 'img');
      s.setAttribute('aria-label', tr('tira.etiqueta', { resumen: d.semana.resumen }));
      s.innerHTML = h;
      s.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const r = s.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * W;
        const y = ((ev.clientY - r.top) / r.height) * 56;
        const q = puestos.map((z) => ({ z, dist: Math.hypot(z.x - x, (Y - z.nivel * 8 - y) * 0.6) })).sort((a, b) => a.dist - b.dist)[0];
        if (q && q.dist < 16) abrirMusculo(q.z.m.id);
      });
      return s;
    }
    function marcarTira() {
      if (!portada) return;
      const deAca = new Set(delLado);
      portada.querySelectorAll('.acu-tira circle').forEach((c) => c.classList.toggle('on', deAca.has(c.dataset.musculo)));
    }
    function pintarPie(fundir) {
      const pie = portada.querySelector('.acu-pie');
      const capa = el('div', 'acu-pie-capa');
      if (estado.lente === 'hoy') pieHoy(capa);
      else if (estado.lente === 'semana') capa.appendChild(tira());
      else pieFatiga(capa);
      const viejas = [...pie.children];
      pie.appendChild(capa);
      if (fundir) {
        capa.classList.add('acu-entra');
        viejas.forEach((v) => { v.classList.add('acu-sale'); setTimeout(() => v.remove(), 220); });
      } else viejas.forEach((v) => v.remove());
      marcarTira();
    }

    // ------------------------------------------------------------ el músculo de cerca: la lupa y su panel
    function lupa() {
      const arriba = portada.offsetTop;
      return { cx: 18 + 68, cy: arriba + 52 + 68, r: 68 };
    }
    function cajaDe(grupo) {
      let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
      grupo.querySelectorAll('path:not([transform])').forEach((pth) => {
        const b = pth.getBBox();
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      });
      return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 };
    }
    function seccion(titulo) {
      const s = el('section', 'acu-sec acu-orden');
      if (titulo) s.appendChild(el('h3', 'acu-sec-t', titulo));
      return s;
    }
    function botonEnElTiempo(e) {
      const b = u.boton('acu-ir acu-orden', `<span>${esc(tr('enElTiempo', { ejercicio: e.nombre }))}</span><i aria-hidden="true">›</i>`, () => enElTiempo(e.id));
      return b;
    }
    const fuerzaDe = (m) => {
      const xs = d.fuerza.ejercicios.filter((e) => e.musculo === m.id);
      return xs.find((e) => e.hoyToca) || xs[0] || null;
    };
    function bloqueAviso(conBotones) {
      const a = d.aviso;
      const respondido = estado.respondido[estado.dia];
      const caja = el('div', 'acu-aviso acu-orden');
      caja.innerHTML = `<p class="acu-k">${esc(a.etiqueta)}</p><h3>${esc(a.musculosTexto)}</h3><p class="acu-p">${esc(pegado(a.hecho))}</p><p class="acu-p suave">${esc(pegado(a.estimacion))}</p><p class="acu-p">${esc(a.queHacer)}</p>`;
      if (a.sinRir) caja.appendChild(el('p', 'acu-p suave', a.sinRir));
      if (respondido) caja.appendChild(el('p', 'acu-p suave', `✓ ${tr('anotado.' + respondido)}`));
      else if (conBotones && a.pide) {
        const r = el('div', 'acu-resp');
        a.respuestas.forEach((t, i) => r.appendChild(u.boton('', esc(t), () => {
          estado.respondido[estado.dia] = i ? 'bien' : 'entendido';
          const nuevo = bloqueAviso(true);
          nuevo.classList.remove('acu-orden');
          nuevo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(260), easing: 'ease' });
          caja.replaceWith(nuevo);
        })));
        caja.appendChild(r);
      }
      return caja;
    }
    function pliegueBase(parrafos) {
      const caja = el('div', 'acu-base acu-orden');
      const b = el('button', 'acu-base-b');
      b.type = 'button';
      b.innerHTML = `${esc(tx('ascent.enQueSeBasa'))}<span class="acu-chev">${u.icono('abajo')}</span>`;
      b.setAttribute('aria-expanded', 'false');
      const pl = el('div', 'acu-pliegue');
      const dentro = el('div');
      parrafos.forEach((t) => dentro.appendChild(el('p', 'acu-p suave', t)));
      dentro.inert = true;
      pl.appendChild(dentro);
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const si = !pl.classList.contains('abierto');
        pl.classList.toggle('abierto', si);
        b.setAttribute('aria-expanded', String(si));
        dentro.inert = !si;
      });
      caja.append(b, pl);
      return caja;
    }
    function construirPanel(m) {
      const panel = el('div', 'acu-panel');
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-label', m.nombre);
      panel.appendChild(u.boton('acu-atras', u.icono('atras'), () => cerrarMusculo(), tx('comun.atras')));
      const cab = el('div', 'acu-panel-cab');
      const prevista = d.sesion && d.sesion.estado === 'prevista';
      const kicker = m.hoyToca && prevista ? tr('hoyToca') : m.hoyToca && d.sesion ? tr('hechoHoy') : '';
      if (kicker) cab.appendChild(el('p', 'acu-k acu-orden', kicker));
      cab.appendChild(el('h2', 'acu-panel-n acu-orden', m.nombre));
      const dato = el('p', 'acu-panel-d acu-orden');
      dato.innerHTML = `<b>${m.series}</b> ${esc(tr('panel.series'))}${d.semana.primera ? '' : ` · ${esc(m.estadoTexto.toLowerCase())}`}`;
      cab.appendChild(dato);
      const W = 207;
      const X = (s) => 5 + (Math.min(s, 30) / 30) * (W - 10);
      const escala = el('div', 'acu-orden');
      escala.innerHTML = `<svg class="acu-escala" viewBox="0 0 ${W} 40" role="img" aria-label="${esc(m.seriesTexto)}">${d.semana.primera ? '' : `<rect class="banda" x="${X(10)}" y="13" width="${X(20) - X(10)}" height="8"/>`}`
        + `<line class="eje" x1="${X(0)}" y1="17" x2="${X(30)}" y2="17"/>${[0, 10, 20, 30].map((v) => `<line class="tic" x1="${X(v)}" y1="13" x2="${X(v)}" y2="21"/><text x="${X(v)}" y="37" text-anchor="${v === 0 ? 'start' : v === 30 ? 'end' : 'middle'}">${v}</text>`).join('')}`
        + `<circle cx="${X(m.seriesExactas).toFixed(1)}" cy="17" r="5"/></svg>`;
      cab.appendChild(escala);
      const fase = el('div', 'acu-panel-fase acu-orden');
      fase.innerHTML = `${fasesEnFila(m.fatiga.paso)}<span>${esc(m.fatiga.nombre)}${m.fatiga.dias ? ` · ${esc(pegado(m.fatiga.texto))} (${esc(m.fatiga.estimado)})` : ''}</span>`;
      cab.appendChild(fase);
      const scroll = el('div', 'acu-panel-scroll');
      if (d.aviso && d.aviso.musculos.includes(m.id) && prevista) scroll.appendChild(bloqueAviso(true));
      const deHoy = ejerciciosDe(m);
      if (deHoy.length) {
        const s = seccion(d.sesion.estado === 'hecha' ? tr('panel.proxima') : tr('panel.hoy'));
        const lista = el('div', 'acu-ejs');
        deHoy.forEach((e) => lista.appendChild(filaEjercicio(e, false)));
        s.appendChild(lista);
        scroll.appendChild(s);
      }
      if (!d.semana.primera && m.sugerencia) {
        const s = seccion(tx('ascent.tus.semana'));
        s.appendChild(el('p', 'acu-p', m.sugerencia));
        if (m.partes) m.partes.filas.forEach((x) => s.appendChild(el('p', 'acu-p suave', x.texto)));
        scroll.appendChild(s);
      }
      if (m.ejercicios.length) {
        const s = seccion(tx('ascent.tus.ejercicios'));
        m.ejercicios.forEach((e) => {
          const f = el('div', 'acu-fila-l');
          f.innerHTML = `<span>${esc(e.nombre)}${e.ayudaTexto ? `<small>${esc(e.ayudaTexto)}</small>` : ''}</span><span>${esc(e.seriesTexto)}</span>`;
          s.appendChild(f);
        });
        scroll.appendChild(s);
      } else if (m.sinEjercicios) scroll.appendChild(el('p', 'acu-p suave acu-orden', m.sinEjercicios));
      const f = fuerzaDe(m);
      if (f) scroll.appendChild(botonEnElTiempo(f));
      if (m.fatiga.sinRir && !(d.aviso && d.aviso.musculos.includes(m.id) && prevista)) scroll.appendChild(el('p', 'acu-p suave acu-orden', d.fatiga.sinRir));
      scroll.appendChild(pliegueBase([...(m.fatiga.dias ? d.base.fatigados : []), ...d.base.musculos.slice(0, 3)]));
      panel.append(cab, scroll);
      return panel;
    }
    /** Con un músculo abierto, todo lo de la portada menos el cuerpo (que es la lupa). */
    function apagar(si) {
      [...portada.children, portada.querySelector('.acu-lados')].forEach((n) => { if (n && !n.classList.contains('acu-lamina')) n.inert = si; });
    }
    function abrirMusculo(id, deUna) {
      if (estado.musculo || paginaAbierta || giro || !portada) return;
      const m = musculo(id);
      if (!m) return;
      if (!visible(estado.lado, id)) { estado.lado = ladoDe(id); ponerCapas(true); marcarLados(); }
      estado.musculo = id;
      quitarRotulos();
      portada.classList.add('acu-con-musculo');
      // Lo que queda apagado detrás del panel no se toca ni lo lee VoiceOver.
      apagar(true);
      p.el.classList.add('acu-con-pagina');
      const cuerpo = portada.querySelector('.acu-cuerpo');
      const grupo = cuerpo.querySelector(`.acu-capa:last-child [data-musculo="${id}"]`);
      grupo.classList.add('acu-elegido');
      cuerpo.classList.add('acu-enfocado');
      const caja = cajaDe(grupo);
      const lam = portada.querySelector('.acu-lamina');
      const rl = lam.getBoundingClientRect();
      const rp = p.el.getBoundingClientRect();
      const L0 = lupa();
      const s = geo.s;
      const C = [geo.izq + (caja.cx - RECORTE.x) * s, geo.arriba + (caja.cy - RECORTE.y) * s];
      const O = [geo.izq, geo.arriba];
      const L = [L0.cx - (rl.left - rp.left), L0.cy - (rl.top - rp.top)];
      // Que el músculo entre en la lupa con aire, sin acercarse tanto que se pierda dónde está.
      const k = Math.max(1.25, Math.min(2.6, (2 * L0.r * 0.72) / (Math.max(caja.w, caja.h * 0.85) * s)));
      const T = [L[0] - O[0] - k * (C[0] - O[0]), L[1] - O[1] - k * (C[1] - O[1])];
      const local = `${(C[0] - O[0]).toFixed(1)}px ${(C[1] - O[1]).toFixed(1)}px`;
      const fin = { transform: `translate(${T[0].toFixed(1)}px, ${T[1].toFixed(1)}px) scale(${k.toFixed(3)})`, clipPath: `circle(${(L0.r / k).toFixed(1)}px at ${local})` };
      // El círculo empieza justo afuera del cuerpo (la esquina más lejana del músculo): así se cierra a la par del acercamiento.
      const lejos = Math.max(...[[0, 0], [geo.ancho, 0], [0, geo.alto], [geo.ancho, geo.alto]].map(([x, y]) => Math.hypot(x - (C[0] - O[0]), y - (C[1] - O[1]))));
      const ini = { transform: 'translate(0px, 0px) scale(1)', clipPath: `circle(${Math.ceil(lejos + 6)}px at ${local})` };
      cuerpo.dataset.inicio = JSON.stringify(ini);
      Object.assign(cuerpo.style, fin);
      if (!deUna) cuerpo.animate([quieto ? Object.assign({}, fin, { opacity: 0 }) : ini, fin], { duration: ms(500), easing: CURVA, fill: 'backwards' });
      const aro = el('div', 'acu-lupa-aro');
      const R = L0.r + 6;
      Object.assign(aro.style, { left: `${L0.cx - R}px`, top: `${L0.cy - R}px`, width: `${2 * R}px`, height: `${2 * R}px` });
      aro.innerHTML = `<svg viewBox="${-R} ${-R} ${2 * R} ${2 * R}"><circle r="${R - 1}"/><path d="M0 ${-R - 5}V${-R + 3}M${R + 5} 0H${R - 3}M0 ${R + 5}V${R - 3}M${-R - 5} 0H${-R + 3}"/></svg>`;
      p.el.appendChild(aro);
      if (!deUna) aro.animate([{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: ms(360), delay: ms(300), easing: CURVA, fill: 'backwards' });
      const panel = construirPanel(m);
      p.el.appendChild(panel);
      // El panel crece desde el músculo; lo de adentro entra después, de arriba hacia abajo.
      const rpan = panel.getBoundingClientRect();
      panel.style.transformOrigin = `${(rl.left + C[0] - rpan.left).toFixed(1)}px ${(rl.top + C[1] - rpan.top).toFixed(1)}px`;
      const cab = panel.querySelector('.acu-panel-cab');
      const scroll = panel.querySelector('.acu-panel-scroll');
      scroll.style.top = `${Math.max(L0.cy + L0.r + 14 - portada.offsetTop, cab.offsetTop + cab.offsetHeight + 10)}px`;
      if (!deUna) {
        panel.animate([{ transform: quieto ? 'none' : 'scale(0.25)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: ms(440), easing: CURVA, fill: 'backwards' });
        panel.querySelectorAll('.acu-orden').forEach((n, i) => n.animate([{ opacity: 0, transform: quieto ? 'none' : 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: ms(340), delay: ms(140 + i * 40), easing: CURVA, fill: 'backwards' }));
      }
    }
    function cerrarMusculo(deUna) {
      if (!estado.musculo || !portada) return;
      const id = estado.musculo;
      estado.musculo = null;
      const panel = p.el.querySelector('.acu-panel');
      const aro = p.el.querySelector('.acu-lupa-aro');
      const cuerpo = portada.querySelector('.acu-cuerpo');
      const grupo = cuerpo.querySelector(`.acu-capa:last-child [data-musculo="${id}"]`);
      if (grupo) grupo.classList.remove('acu-elegido');
      cuerpo.classList.remove('acu-enfocado');
      portada.classList.remove('acu-con-musculo');
      apagar(false);
      p.el.classList.remove('acu-con-pagina');
      const fin = { transform: cuerpo.style.transform, clipPath: cuerpo.style.clipPath };
      const ini = cuerpo.dataset.inicio ? JSON.parse(cuerpo.dataset.inicio) : null;
      cuerpo.style.transform = '';
      cuerpo.style.clipPath = '';
      if (deUna) {
        [panel, aro].filter(Boolean).forEach((n) => { if (deUna === 'fundir') { n.style.pointerEvents = 'none'; n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(260), fill: 'forwards' }).finished.then(() => n.remove()); } else n.remove(); });
        return;
      }
      if (ini) cuerpo.animate([fin, quieto ? Object.assign({}, ini, { transform: fin.transform, opacity: 0 }) : ini], { duration: ms(460), easing: CURVA });
      if (aro) aro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(200), fill: 'forwards' }).finished.then(() => aro.remove());
      if (panel) {
        panel.style.pointerEvents = 'none';
        panel.animate([{ transform: panel.style.transform || 'none', opacity: 1 }, { transform: quieto ? 'none' : 'scale(0.25)', opacity: 0 }], { duration: ms(320), easing: 'cubic-bezier(0.4, 0, 0.7, 0.2)', fill: 'forwards' }).finished.then(() => panel.remove());
      }
      despues(() => pintarRotulos(true), ms(320));
    }

    // ------------------------------------------------------------ las páginas
    function filaEjercicio(e, conPorque) {
      const hecha = d.sesion && d.sesion.estado === 'hecha';
      const peso = pesoCorto(e);
      const arriba = e.decision === 'sube' ? (g.idioma === 'en' ? 'up to' : 'sube a') : '';
      const b = el(conPorque ? 'button' : 'div', 'acu-ej');
      if (conPorque) b.type = 'button';
      b.innerHTML = `<i class="acu-ej-f${e.decision === 'sube' ? ' sube' : ''}" aria-hidden="true">${esc(e.flecha || '·')}</i><span class="acu-ej-n">${esc(e.nombre)}<small>${esc(pegado(hecha && e.hecho ? e.hecho : conPorque ? e.plan : e.motivo))}</small></span>`
        + `<span class="acu-ej-p">${arriba ? `<small>${esc(arriba)}</small>` : ''}${esc(pegado(peso))}</span>`;
      if (!conPorque) return b;
      const caja = el('div');
      const pl = el('div', 'acu-pliegue');
      const dentro = el('div');
      dentro.appendChild(el('p', 'acu-p', e.proxima));
      const f = d.fuerza.ejercicios.find((x) => x.id === e.id);
      if (f) { const ir = botonEnElTiempo(f); ir.classList.remove('acu-orden'); dentro.appendChild(ir); }
      dentro.inert = true;
      pl.appendChild(dentro);
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const si = !pl.classList.contains('abierto');
        pl.classList.toggle('abierto', si);
        b.setAttribute('aria-expanded', String(si));
        dentro.inert = !si;
      });
      caja.append(b, pl);
      return caja;
    }
    function paginaSesion() {
      const s = d.sesion;
      const cuerpo = [];
      if (d.aviso && s.estado === 'prevista') cuerpo.push(bloqueAviso(true));
      if (s.comoFue) {
        const cf = el('div', 'acu-sec');
        cf.innerHTML = `<h3 class="acu-sec-t">${esc(s.comoFue.titulo)}</h3><p class="acu-grande">${esc(s.comoFue.palabra)}</p><p class="acu-p">${esc(pegado(s.comoFue.porque))}</p><p class="acu-p suave">${esc(s.comoFue.implica)}</p>`;
        cuerpo.push(cf);
      }
      const lista = el('div', 'acu-ejs');
      s.ejercicios.forEach((e) => lista.appendChild(filaEjercicio(e, true)));
      cuerpo.push(lista);
      const sug = seccion(tr('listaSec.comidaYSueno'));
      d.sugerencias.filter((x) => x.tipo !== 'entreno').forEach((x) => sug.appendChild(el('p', 'acu-p', x.texto)));
      cuerpo.push(sug);
      return { kicker: tr('sesionDeHoy'), titulo: `${s.nombre} · ${s.hora}`, cuerpo };
    }
    function paginaFuerza() {
      const f = d.fuerza;
      const cuerpo = [];
      if (f.vacio) { cuerpo.push(el('p', 'acu-grande', f.vacio)); return { kicker: f.semanas, titulo: f.titulo, cuerpo }; }
      cuerpo.push(el('p', 'acu-grande', f.respuesta), el('p', 'acu-p suave', f.resumen));
      const celdas = el('div', 'acu-celdas');
      f.ejercicios.forEach((e) => {
        const c = u.boton('acu-celda', `<span class="acu-celda-n">${esc(e.nombre)}</span>${M.chispa(e, { ancho: 160, alto: 50 })}<span class="acu-celda-v">${esc(pegado(e.veredicto))}</span><span class="acu-celda-d">${esc(pegado(e.dato))}</span>`
          + `${e.sinMarcaTexto ? `<span class="acu-celda-x">${esc(e.sinMarcaTexto)}</span>` : ''}<span class="acu-celda-ir">${esc(tr('enElTiempoCorto'))} ›</span>`, () => enElTiempo(e.id));
        celdas.appendChild(c);
      });
      cuerpo.push(celdas);
      if (f.ruido) cuerpo.push(el('p', 'acu-p suave', f.ruido));
      cuerpo.push(pliegueBase([...d.base.estancados, ...d.base.porQue]));
      return { kicker: f.semanas, titulo: f.titulo, cuerpo };
    }
    // La pista de una meta: el tiempo desde hoy, con la ventana en que llegas rayada, o lo que falta para saberlo.
    function pista(m) {
      const W = 357;
      const max = m.semanas ? Math.max(26, Math.ceil(m.semanas[1] * 1.25)) : 26;
      const X = (w) => 7 + (w / max) * (W - 14);
      const Y = 14;
      let h = `<line class="eje" x1="${X(0)}" y1="${Y}" x2="${X(max)}" y2="${Y}"/>`;
      const [an, mes] = Datos.HOY.split('-').map(Number);
      for (let i = 1; i < 10; i++) {
        const mm = ((mes - 1 + i) % 12) + 1;
        const aa = an + Math.floor((mes - 1 + i) / 12);
        const w = Fechas.diasEntre(Datos.HOY, `${aa}-${String(mm).padStart(2, '0')}-01`) / 7;
        if (w > max) break;
        // Ni «hoy» ni las sesiones que lleva tapan un mes.
        if (X(w) < (m.llevas && !m.semanas ? X(1.2) + 6 * 13 + 10 : 44)) continue;
        h += `<line class="tic" x1="${X(w).toFixed(1)}" y1="${Y + 3}" x2="${X(w).toFixed(1)}" y2="${Y + 7}"/><text x="${X(w).toFixed(1)}" y="${Y + 22}" text-anchor="middle">${esc(conMay(tx('fecha.mesesCortos.' + (mm - 1))))}</text>`;
      }
      if (m.semanas) {
        h += `<line class="hasta" x1="${X(0)}" y1="${Y}" x2="${X(m.semanas[0]).toFixed(1)}" y2="${Y}"/><rect class="ventana" x="${X(m.semanas[0]).toFixed(1)}" y="${Y - 7}" width="${(X(m.semanas[1]) - X(m.semanas[0])).toFixed(1)}" height="14" rx="2"/>`;
      } else if (m.estado === 'noSube') {
        h += `<line class="no" x1="${X(0)}" y1="${Y}" x2="${X(max * 0.82).toFixed(1)}" y2="${Y}"/>`;
      } else if (m.llevas) {
        const lleva = Number((m.llevas.match(/\d+/) || [0])[0]);
        h += Array.from({ length: 6 }, (_, i) => `<circle class="${i < lleva ? 'sesion' : 'falta'}" cx="${(X(1.2) + i * 13).toFixed(1)}" cy="${Y}" r="4"/>`).join('');
      }
      h += `<circle class="yo" cx="${X(0)}" cy="${Y}" r="5"/><text class="hoy" x="${X(0) - 4}" y="${Y + 22}">${esc(tr('hoyLevantarias'))}</text>`;
      return `<svg class="acu-pista" viewBox="0 0 ${W} 50" aria-hidden="true">${h}</svg>`;
    }
    // «Así no llega… Mira “Por qué puedes estar estancado”»: ese bloque no existe en esta sección; en su lugar va el enlace
    // a «¿Por qué no estás mejorando?», como en la propuesta C.
    const estadoSinRemision = (m) => (m.estadoTexto ? m.estadoTexto.replace(/\s*(Mira «[^»]*»|See “[^”]*”)\.?$/, '') : m.estadoTexto);
    function paginaMetas() {
      const mt = d.metas;
      const cuerpo = [];
      if (!mt.lista.length) { cuerpo.push(el('p', 'acu-grande', mt.ninguna)); return { titulo: mt.titulo, cuerpo }; }
      mt.lista.forEach((m) => {
        const a = el('article', 'acu-meta');
        a.innerHTML = `<div class="acu-meta-cab"><h3 class="acu-meta-n">${esc(m.nombre)}</h3><span class="acu-meta-kg">${esc(pegado(`${u.peso(m.kilos)} kg`))}</span></div><p class="acu-meta-o">${esc(m.objetivo)}${m.hoy ? ` · ${esc(pegado(m.hoy))}` : ''}</p>${pista(m)}`
          + `<p class="acu-meta-l">${esc(pegado(m.llegas || estadoSinRemision(m) || m.falta || ''))}</p>${m.llevas ? `<p class="acu-meta-l suave">${esc(m.llevas)}</p>` : ''}`;
        const pasos = el('div', 'acu-pasos');
        pasos.setAttribute('role', 'group');
        pasos.setAttribute('aria-label', m.comoLlegar);
        const texto = el('p', 'acu-paso-t');
        const elegir = (x, b) => {
          pasos.querySelectorAll('.acu-paso').forEach((y) => y.setAttribute('aria-pressed', String(y === b)));
          texto.textContent = pegado(x.texto);
          texto.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms(220) });
        };
        m.pasos.forEach((x) => {
          const b = u.boton(`acu-paso ${x.estado}`, `<b aria-hidden="true">${esc(x.marca || '·')}</b>${esc(tr('pasos.' + x.que))}`, () => elegir(x, b), `${tr('pasos.' + x.que)}: ${x.etiqueta}`);
          pasos.appendChild(b);
        });
        a.append(pasos, texto);
        const primero = m.pasos.find((x) => x.estado === 'mejorar') || m.pasos[0];
        if (primero) { const b = pasos.children[m.pasos.indexOf(primero)]; b.setAttribute('aria-pressed', 'true'); texto.textContent = pegado(primero.texto); }
        [...pasos.children].forEach((b) => { if (!b.hasAttribute('aria-pressed')) b.setAttribute('aria-pressed', 'false'); });
        if (m.proxima) a.appendChild(el('p', 'acu-meta-l suave', pegado(m.proxima)));
        if (m.estado === 'noSube' && window.PorQueNoMejoro) a.appendChild(u.boton('acu-ir', `<span>${esc(tr('porQue'))}</span><i aria-hidden="true">›</i>`, () => enElTiempo(m.id)));
        cuerpo.push(a);
      });
      if (mt.comer) cuerpo.push(el('p', 'acu-p suave', mt.comer));
      cuerpo.push(pliegueBase(d.base.metas));
      return { titulo: mt.titulo, cuerpo };
    }
    // El mapa del año con los meses en letra que se lee (el de 05-ascent-datos.js los dibuja a 8 px): un renglón por mes y
    // un cuadro por día, con las mismas clases, así se pinta con las mismas tramas.
    function mapaDelAnio(anio) {
      const P = 11;
      const porFecha = new Map(anio.dias.map((x) => [x.fecha, x]));
      let html = '';
      for (let mes = 0; mes < 12; mes++) {
        const dias = new Date(anio.anio, mes + 1, 0).getDate();
        let celdas = '';
        for (let n = 1; n <= dias; n++) {
          const fecha = `${anio.anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
          const x = porFecha.get(fecha);
          celdas += `<rect class="am-anio-dia ${fecha > anio.hoy ? 'futuro' : x && x.grupo ? x.grupo : 'descanso'}${fecha === anio.hoy ? ' hoy' : ''}" data-fecha="${fecha}" x="${(n - 1) * P + 0.5}" y="0.5" width="9" height="12" rx="1.6"/>`;
          if (x && x.marca) celdas += `<circle class="am-anio-marca" cx="${(n - 1) * P + 5}" cy="6.5" r="1.7"/>`;
        }
        html += `<span class="acu-mes" aria-hidden="true">${esc(conMay(tx('fecha.mesesCortos.' + mes)))}</span><svg viewBox="0 0 ${31 * P} 13" data-mes="${mes}" aria-hidden="true">${celdas}</svg>`;
      }
      return html;
    }
    function paginaAnio() {
      const a = d.anio;
      const cuerpo = [];
      const nums = el('div', 'acu-numeros');
      nums.innerHTML = a.datos.map((x) => `<div><b>${esc(x.valor)}</b><span>${esc(x.nombre)}</span></div>`).join('');
      cuerpo.push(nums);
      const mapa = el('div', 'acu-mapa am-anio');
      mapa.setAttribute('role', 'img');
      mapa.setAttribute('aria-label', a.mapa);
      mapa.innerHTML = mapaDelAnio(a);
      const detalle = el('p', 'acu-mapa-d', a.mapa);
      detalle.setAttribute('aria-live', 'polite');
      // Tocar cerca alcanza: se elige el día del renglón más cercano, debajo del dedo.
      mapa.addEventListener('click', (ev) => {
        const filas = [...mapa.querySelectorAll('svg[data-mes]')];
        const fila = ev.target.closest('svg[data-mes]') || filas.reduce((x, f) => { const b = f.getBoundingClientRect(); const dy = Math.abs(ev.clientY - (b.top + b.height / 2)); return !x || dy < x.dy ? { f, dy } : x; }, null).f;
        const b = fila.getBoundingClientRect();
        if (ev.clientX < b.left - 4) return;
        const dia = fila.querySelectorAll('rect')[Math.min(30, Math.max(0, Math.floor(((ev.clientX - b.left) / b.width) * 31)))];
        if (!dia || dia.classList.contains('futuro')) return;
        mapa.querySelectorAll('.acu-elegido').forEach((x) => x.classList.remove('acu-elegido'));
        dia.classList.add('acu-elegido');
        detalle.textContent = a.detalle(dia.dataset.fecha);
      });
      const ley = el('div', 'acu-leyenda-a');
      const caja = (cls) => `<svg viewBox="0 0 9 9" aria-hidden="true"><rect class="am-anio-dia ${cls}" x="0" y="0" width="9" height="9" rx="1.6"/></svg>`;
      ley.innerHTML = a.leyenda.map((x) => (x.clave === 'marca'
        ? `<span><svg viewBox="0 0 9 9" aria-hidden="true"><rect class="am-anio-dia piernas" width="9" height="9" rx="1.6"/><circle class="am-anio-marca" cx="4.5" cy="4.5" r="1.6"/></svg>${esc(x.nombre)}</span>`
        : `<span>${caja(x.clave)}${esc(x.nombre)}</span>`)).join('');
      ley.classList.add('am-anio');
      cuerpo.push(mapa, detalle, ley, el('p', 'acu-p suave', tr('anioTexto')));
      const ult = seccion(a.ultimasTitulo);
      a.ultimas.slice(0, 5).forEach((x) => { const f = el('div', 'acu-fila-l'); f.innerHTML = `<span>${esc(pegado(x.texto))}</span><span>${esc(x.cuando)}</span>`; ult.appendChild(f); });
      cuerpo.push(ult);
      return { kicker: a.derecha, titulo: a.titulo, cuerpo };
    }
    function paginaLista() {
      const cuerpo = [];
      const hoy = seccion(tr('listaSec.hoy'));
      hoy.innerHTML += `<p class="acu-grande">${esc(d.hoy.titulo)}</p><p class="acu-p">${esc(d.hoy.texto)}</p>`;
      if (d.aviso) hoy.appendChild(el('p', 'acu-p suave', pegado(d.aviso.linea)));
      if (d.sesion) {
        const lista = el('div', 'acu-ejs');
        d.sesion.ejercicios.forEach((e) => lista.appendChild(filaEjercicio(e, false)));
        hoy.appendChild(lista);
      }
      cuerpo.push(hoy);
      const sem = seccion(tx('ascent.tus.semana'));
      sem.appendChild(el('p', 'acu-p suave', d.semana.texto));
      ['frente', 'espalda'].forEach((lado) => {
        sem.appendChild(el('h4', 'acu-sec-t', tx('ascent.cuerpo.' + lado))).style.marginTop = '18px';
        d.musculos.filter((m) => m.lado === lado).forEach((m) => {
          const f = el('div', 'acu-fila-l');
          f.innerHTML = `<span>${esc(m.nombre)}${m.fatiga.dias ? `<small>${esc(m.fatiga.nombre)} · ${esc(m.fatiga.listo)}</small>` : ''}</span><span><b>${m.series}</b> · ${esc(m.estadoTexto.toLowerCase())}</span>`;
          sem.appendChild(f);
        });
      });
      cuerpo.push(sem);
      const fat = seccion(tx('ascent.fatigados.titulo'));
      if (d.fatiga.lista.length) d.fatiga.lista.forEach((id) => { const m = musculo(id); const f = el('div', 'acu-fila-l'); f.innerHTML = `<span>${esc(m.nombre)}<small>${esc(conMay(desdeEnFrase(m.fatiga.desde)))}</small></span><span>${esc(m.fatiga.nombre)} · ${esc(m.fatiga.listo)}</span>`; fat.appendChild(f); });
      else fat.appendChild(el('p', 'acu-p', d.fatiga.ninguno));
      fat.appendChild(el('p', 'acu-p suave', d.fatiga.comoSeCalcula));
      cuerpo.push(fat);
      const cys = seccion(tr('listaSec.comidaYSueno'));
      d.sugerencias.forEach((x) => cys.appendChild(el('p', 'acu-p', x.texto)));
      cuerpo.push(cys);
      return { titulo: tr('listaTitulo'), cuerpo };
    }
    function paginaBase() {
      const b = d.base;
      const cuerpo = [];
      [[tx('ascent.tus.titulo'), b.musculos], [tx('ascent.fatigados.titulo'), b.fatigados], [d.fuerza.estancados.titulo, b.estancados], [d.fuerza.estancados.porQue, b.porQue], [tx('ascent.metas.titulo'), b.metas]].forEach(([t, ps]) => {
        const s = seccion(t);
        ps.forEach((x) => s.appendChild(el('p', 'acu-p suave', x)));
        cuerpo.push(s);
      });
      return { titulo: b.titulo, cuerpo };
    }
    const PAGINAS = { sesion: paginaSesion, fuerza: paginaFuerza, metas: paginaMetas, anio: paginaAnio, lista: paginaLista, base: paginaBase };
    const origenDe = (k) => portada && portada.querySelector(`[data-pagina="${k}"]`);

    function abrirPagina(clave, origen, deUna) {
      if (paginaAbierta || estado.musculo || giro || !portada) return;
      const def = PAGINAS[clave]();
      const hoja = el('section', 'acu-hoja');
      hoja.setAttribute('role', 'dialog');
      hoja.setAttribute('aria-label', def.titulo);
      const cab = el('div', 'acu-hoja-cab');
      cab.appendChild(u.boton('acu-atras', u.icono('atras'), () => cerrarPagina(), tx('comun.atras')));
      const scroll = el('div', 'acu-hoja-scroll');
      const tit = el('div', 'acu-hoja-tit');
      if (def.kicker) tit.appendChild(el('p', 'acu-k', def.kicker));
      const h2 = el('h2', 'acu-hoja-t', def.titulo);
      tit.appendChild(h2);
      scroll.append(tit, ...def.cuerpo);
      hoja.append(cab, scroll);
      p.el.appendChild(hoja);
      paginaAbierta = { clave, hoja, origen, h2, scroll };
      estado.pagina = clave;
      p.el.classList.add('acu-con-pagina');
      portada.classList.add('acu-atras-de');
      portada.inert = true;
      if (deUna) return;
      if (quieto || !origen) { hoja.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 }); return; }
      // El marco crece desde lo tocado; el título viaja desde su texto; lo demás entra 120 ms después, de arriba hacia abajo.
      const r1 = hoja.getBoundingClientRect();
      const r0 = origen.getBoundingClientRect();
      const recorte = `inset(${(r0.top - r1.top).toFixed(1)}px ${(r1.right - r0.right).toFixed(1)}px ${(r1.bottom - r0.bottom).toFixed(1)}px ${(r0.left - r1.left).toFixed(1)}px round 14px)`;
      hoja.animate([{ clipPath: recorte }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], { duration: 440, easing: CURVA, fill: 'backwards' });
      const fuente = origen.querySelector('span') || origen;
      const rs = fuente.getBoundingClientRect();
      const rt = h2.getBoundingClientRect();
      const esc2 = Math.min(1, rs.height / rt.height);
      h2.animate([{ transform: `translate(${(rs.left - rt.left).toFixed(1)}px, ${(rs.top - rt.top).toFixed(1)}px) scale(${esc2.toFixed(3)})`, opacity: 0.6 }, { transform: 'none', opacity: 1 }], { duration: 440, easing: CURVA, fill: 'backwards' });
      [...scroll.children].forEach((n, i) => {
        if (n === tit) { const k = tit.querySelector('.acu-k'); if (k) k.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 160, fill: 'backwards' }); return; }
        // Recién cuando el título ya casi llegó, para que no pase por encima de lo que entra.
        n.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 200 + i * 45, easing: CURVA, fill: 'backwards' });
      });
    }
    function cerrarPagina(deUna) {
      const pa = paginaAbierta;
      if (!pa) return;
      paginaAbierta = null;
      estado.pagina = null;
      p.el.classList.remove('acu-con-pagina');
      if (portada) { portada.classList.remove('acu-atras-de'); portada.inert = false; }
      pa.hoja.style.pointerEvents = 'none';
      if (deUna === 'fundir') { pa.hoja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(260), fill: 'forwards' }).finished.then(() => pa.hoja.remove()); return; }
      if (deUna) { pa.hoja.remove(); return; }
      if (quieto || !pa.origen || !pa.origen.isConnected) {
        pa.hoja.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms(200), fill: 'forwards' }).finished.then(() => pa.hoja.remove());
        return;
      }
      const r1 = pa.hoja.getBoundingClientRect();
      const r0 = pa.origen.getBoundingClientRect();
      const recorte = `inset(${(r0.top - r1.top).toFixed(1)}px ${(r1.right - r0.right).toFixed(1)}px ${(r1.bottom - r0.bottom).toFixed(1)}px ${(r0.left - r1.left).toFixed(1)}px round 14px)`;
      [...pa.scroll.children].forEach((n) => { if (!n.classList.contains('acu-hoja-tit')) n.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' }); });
      pa.hoja.animate([{ clipPath: 'inset(0px 0px 0px 0px round 0px)', opacity: 1 }, { clipPath: recorte, opacity: 0.2 }], { duration: 400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' }).finished.then(() => pa.hoja.remove());
    }
    // Arrastrar hacia abajo una página o el panel del músculo: sigue al dedo (el panel, con su lupa); pasado un umbral,
    // vuelve a la portada; si no, a su lugar.
    function gestoDeCerrar(capa, ev) {
      const scroll = capa.querySelector('.acu-hoja-scroll, .acu-panel-scroll');
      if (scroll && scroll.contains(ev.target) && scroll.scrollTop > 2) return null;
      const esPanel = capa.classList.contains('acu-panel');
      const juntos = () => (esPanel ? [portada && portada.querySelector('.acu-lamina'), p.el.querySelector('.acu-lupa-aro')] : []).filter(Boolean);
      const a = { x: ev.clientX, y: ev.clientY, dy: 0, activo: false };
      return {
        mover(e) {
          const dy = e.clientY - a.y;
          const dx = e.clientX - a.x;
          if (!a.activo) {
            if (dy > 12 && dy > Math.abs(dx) * 1.3) {
              a.activo = true;
              try { capa.setPointerCapture(e.pointerId); } catch (x) { /* sin captura, igual sigue */ }
            } else if (Math.abs(dx) > 12 || dy < -8) { gesto = null; return; } else return;
          }
          e.preventDefault();
          a.dy = Math.max(0, dy);
          capa.style.transform = `translateY(${(a.dy * 0.55).toFixed(1)}px) scale(${(1 - Math.min(a.dy, 320) / 2600).toFixed(4)})`;
          juntos().forEach((n) => { n.style.translate = `0 ${(a.dy * 0.55).toFixed(1)}px`; });
        },
        soltar() {
          if (!a.activo) return;
          finDeArrastre = performance.now();
          const cierra = a.dy > 90;
          const antes = capa.style.transform;
          capa.style.transform = '';
          juntos().forEach((n) => { const t = n.style.translate; n.style.translate = ''; n.animate([{ translate: t }, { translate: '0 0' }], { duration: ms(cierra ? 420 : 280), easing: CURVA }); });
          capa.animate([{ transform: antes }, { transform: 'none' }], { duration: ms(cierra ? 420 : 280), easing: CURVA });
          if (cierra) (esPanel ? cerrarMusculo : cerrarPagina)();
        },
      };
    }
    // La galería mira el dedo antes que nadie (en captura, sobre .tel) para deslizar entre secciones: acá se mira antes
    // todavía, en window, y un toque en esta pantalla no le llega. Así, arrastrar de costado gira el cuerpo en lugar de
    // cambiar de sección. Los click siguen llegando como siempre.
    let gesto = null;
    let finDeArrastre = -1e9;
    window.addEventListener('pointerdown', (ev) => {
      gesto = null;
      if (!p.abierta || !portada || !p.el.contains(ev.target) || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      ev.stopPropagation();
      const capa = ev.target.closest('.acu-hoja, .acu-panel');
      if (capa) gesto = gestoDeCerrar(capa, ev);
      else if (ev.target.closest('.acu-lamina')) gesto = gestoDeLamina(ev);
      if (gesto) gesto.id = ev.pointerId;
    }, true);
    window.addEventListener('pointermove', (ev) => { if (gesto && ev.pointerId === gesto.id) gesto.mover(ev); }, true);
    const soltarGesto = (ev) => {
      if (!gesto || ev.pointerId !== gesto.id) return;
      const g2 = gesto;
      gesto = null;
      g2.soltar(ev);
    };
    window.addEventListener('pointerup', soltarGesto, true);
    window.addEventListener('pointercancel', soltarGesto, true);
    // El click que llega después de arrastrar no es un toque: no abre nada.
    window.addEventListener('click', (ev) => {
      if (p.el.contains(ev.target) && performance.now() - finDeArrastre < 400) { ev.stopPropagation(); ev.preventDefault(); }
    }, true);

    // ------------------------------------------------------------ afuera
    // Pasando a «¿Por qué no estás mejorando?» (otra propuesta, que cierra esta): el idioma, el rango y el vínculo quedan
    // como están, así esa pantalla se ve igual; los devuelve el cierre de verdad, al volver con «‹» o desde otro botón.
    let pasando = false;
    let vinculadaAntes = null;
    function enElTiempo(id) {
      if (!window.PorQueNoMejoro) return;
      pendiente = { vista: estado.vista, lente: estado.lente, lado: estado.lado, musculo: estado.musculo, pagina: estado.pagina };
      pasando = true;
      try { window.PorQueNoMejoro.abrir(id); } finally { pasando = false; }
    }
    function irAProgreso() {
      p.el.classList.add('acu-a-progreso');
      Galeria.ver('ascentCuerpo', null);
    }
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
    function ponerRangoDeVista(n) {
      const A = g.secciones.ascent;
      if (n) {
        if (!rangoGuardado) rangoGuardado = Object.assign({}, A.rango);
        A.ponerRango(n);
      } else if (rangoGuardado) {
        A.ponerRango(rangoGuardado.rango, rangoGuardado.planeta);
        rangoGuardado = null;
      }
    }
    // El idioma o el tamaño cambian con la pantalla abierta: se pinta de nuevo, sin la entrada.
    function rehacer() {
      if (!p.abierta || !estado.vista) return;
      cancelarEsperas();
      const m = estado.musculo;
      const pg = estado.pagina;
      cerrarPagina(true);
      cerrarMusculo(true);
      pintar(false);
      if (m) abrirMusculo(m, true);
      else if (pg) abrirPagina(pg, origenDe(pg), true);
    }
    document.getElementById('s-idioma').addEventListener('click', () => { if (!cambiandoIdioma) setTimeout(rehacer, 0); });
    // «Tu rango en Ascent» del panel de la galería: la tinta se retiñe sola (es un color con su transición) y el medallón se
    // funde con el del rango nuevo. Lo elegido ahí queda al cerrar.
    function cambiarRango() {
      if (!p.abierta || !estado.vista) return;
      rangoGuardado = null;
      ponerMedallon(true);
    }
    ['s-rango', 's-planeta'].forEach((id) => {
      const n = document.getElementById(id);
      if (n) n.addEventListener('click', (ev) => { if (ev.target.closest('button')) setTimeout(cambiarRango, 0); });
    });
    let altoDeAntes = 0;
    new ResizeObserver(() => {
      const h = p.el.clientHeight;
      if (!h || Math.abs(h - altoDeAntes) < 2) return;
      const habia = altoDeAntes;
      altoDeAntes = h;
      if (habia) rehacer();
    }).observe(p.el);

    p.el.innerHTML = `${DEFS}<div class="acu-fondo"><svg class="acu-orbitas" aria-hidden="true"></svg></div><div class="acu-medallon" aria-hidden="true"></div>`;

    return {
      abrir(vista) {
        const conf = VISTAS[vista] || VISTAS.aviso;
        // Cómo estaba Ascent antes de abrir (vinculada o no): al cerrar de verdad, vuelve a eso.
        if (vinculadaAntes === null) vinculadaAntes = g.secciones.ascent.vinculada;
        g.vincular(true);
        ponerIdioma(conf.idioma || null);
        ponerRangoDeVista(conf.rango || null);
        if (g.pestana !== 2) g.irA(2, true);
        cancelarEsperas();
        const yaAbierta = p.abierta && !!portada;
        giro = null;
        cerrarPagina(yaAbierta ? 'fundir' : true);
        cerrarMusculo(yaAbierta ? 'fundir' : true);
        p.el.classList.remove('acu-a-progreso');
        const volver = pendiente && pendiente.vista === vista ? pendiente : null;
        pendiente = null;
        // Cada botón de la galería muestra el aviso sin contestar; al volver de «en el tiempo», queda como estaba.
        if (!volver) estado.respondido = {};
        estado.vista = vista;
        estado.dia = conf.dia;
        estado.lente = volver ? volver.lente : conf.lente;
        d = M.dia(estado.dia);
        // Si lo que avisa hoy está solo de espalda (el día «casi»: glúteos e isquios), se llega de espalda.
        const deEspalda = estado.lente === 'hoy' && d.aviso && !d.aviso.musculos.some((id) => ANCLAS.frente[id]);
        estado.lado = volver ? volver.lado : conf.lado || (deEspalda ? 'espalda' : 'frente');
        p.abrir();
        altoDeAntes = p.el.clientHeight;
        pintar(!volver);
        if (volver && volver.musculo) abrirMusculo(volver.musculo, true);
        else if (volver && volver.pagina) abrirPagina(volver.pagina, origenDe(volver.pagina), true);
        else if (conf.musculo) despues(() => abrirMusculo(conf.musculo), ms(1300));
        else if (conf.pagina) despues(() => abrirPagina(conf.pagina, origenDe(conf.pagina)), ms(1000));
      },
      cerrar() {
        cancelarEsperas();
        estado.vista = null;
        cerrarPagina(true);
        cerrarMusculo(true);
        giro = null;
        p.cerrar();
        if (pasando) return;
        ponerIdioma(null);
        ponerRangoDeVista(null);
        if (vinculadaAntes !== null) g.vincular(vinculadaAntes);
        vinculadaAntes = null;
      },
    };
  },
});
