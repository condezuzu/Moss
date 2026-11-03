// La entrada a la app, para aprobar en la galería antes de conectarla con la lógica: la frase de
// apertura, la introducción (la comida, la base, el sueño, los dos juntos, los hábitos y el cielo, y lo
// que cuesta), tus datos, la cuenta, el cuestionario que arma la meta inicial de comida y el plan (el
// nuevo, del 2/11/2026, con las preguntas de MacroFactor: src/dominio/cuestionario.ts) y, al final, la
// pantalla de pago (suscripcion.js). La recorre una estrella guía: nace en el musgo, presenta la frase,
// da vueltas a la luna, recorre la base y la noche, une el sueño con la comida, enciende Casiopea, camina
// la prueba, acompaña desde arriba y en el cuestionario lleva la barra. En la frase y la introducción
// espera abajo y tocarla es seguir; «Saltar» lleva a lo que cuesta, que no se saltea: el cuestionario es
// trabajo, y antes hay que saber que Moss es de pago. Cada pantalla tiene su lugar en el cielo (la cámara
// sube a medida que se avanza) y al final un «flum» lleva al cielo de hoy. Los textos salen del
// diccionario de la app (src/textos). La app hace lo mismo con el guion de src/secciones/entrada/guion.ts.

const Entrada = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;
  const CSS = `
.ent-saltar { position: absolute; right: 18px; top: calc(var(--arriba) + 2px); z-index: 2; appearance: none; cursor: pointer; padding: 8px 10px; border: 0; background: none; color: rgba(239, 230, 207, 0.62); font: 400 13px/1 var(--texto); pointer-events: auto; opacity: 0; transition: opacity 0.4s; }
.ent-saltar.visible { opacity: 1; }
.ent-saltar:not(.visible) { pointer-events: none; }
.ent-cab-intro { position: absolute; left: 28px; top: calc(var(--arriba) + 4px); }
.ent-cab-intro .ent-constelacion { width: 92px; height: 26px; }
.ent-intro .ent-texto { max-width: 322px; }
.ent-fija { position: absolute; left: 28px; right: 28px; }
@keyframes ent-sube { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.ent-aparece { opacity: 0; animation: ent-sube 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }

/* La comida: lo dicho, la luna que se llena y lo que anotó. */
.ent-comida .ent-escenario-luna { top: 46%; }
.ent-dicho { top: 26%; margin: 0; display: flex; align-items: center; gap: 9px; padding: 8px 12px; border-radius: 14px; background: rgba(6, 10, 22, 0.6); border: 1px solid rgba(239, 230, 207, 0.12); text-align: left; font: italic 400 15.5px/1.24 var(--titulos); color: rgba(239, 230, 207, 0.92); }
.ent-dicho svg { flex: none; width: 17px; height: 17px; fill: none; stroke: var(--oro-claro); stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.ent-filas { top: calc(46% + 92.5px); margin: 0; padding: 0; list-style: none; display: grid; gap: 1px; text-align: left; }
.ent-filas li { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 12px; align-items: baseline; padding: 6px 2px; border-bottom: 1px solid rgba(239, 230, 207, 0.08); font: 400 14px/1.2 var(--texto); }
.ent-filas li span { min-width: 0; color: var(--tinta); }
.ent-filas li small { display: inline; margin-left: 6px; font: 300 12.5px/1 var(--texto); color: rgba(239, 230, 207, 0.6); }
.ent-filas li b { font: 400 13.5px/1 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.84); }
.ent-total { top: calc(46% + 92.5px + 111px); margin: 0; font: 400 12.5px/1.2 var(--texto); color: var(--oro-claro); }

/* La base: lo que se busca y lo que encuentra, cada uno con su fuente. */
.ent-busca { top: 30%; height: 40px; display: flex; align-items: center; gap: 9px; padding: 0 13px; border-radius: 13px; background: rgba(239, 230, 207, 0.08); text-align: left; font: 400 15px/1 var(--texto); color: var(--tinta); }
.ent-busca svg { flex: none; width: 16px; height: 16px; fill: none; stroke: rgba(239, 230, 207, 0.6); stroke-width: 1.7; stroke-linecap: round; }
.ent-busca span { display: inline-block; overflow: hidden; white-space: nowrap; width: var(--largo); animation: ent-escribe 0.7s 0.4s steps(6) both; border-right: 1.5px solid var(--oro-claro); padding-right: 1px; }
@keyframes ent-escribe { from { width: 0; } }
.ent-base-filas { top: calc(30% + 50px); margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; text-align: left; }
.ent-base-fila { height: 56px; display: grid; grid-template-columns: 24px minmax(0, 1fr) auto; column-gap: 10px; align-items: center; padding: 0 12px; border-radius: 13px; background: rgba(6, 10, 22, 0.58); border: 1px solid rgba(239, 230, 207, 0.1); transition: border-color 0.4s; }
.ent-base-fila i { width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.25); color: transparent; animation: ent-verificado 0.5s var(--cuando) ease-out both; }
.ent-base-fila i svg { width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
@keyframes ent-verificado { to { color: var(--oro-claro); border-color: rgba(232, 196, 106, 0.7); box-shadow: 0 0 12px rgba(232, 196, 106, 0.28); } }
.ent-base-fila b { display: block; font: 500 14.5px/1.2 var(--texto); }
.ent-base-fila small { display: block; margin-top: 2px; font: 300 12.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.62); }
.ent-base-fila em { font: normal 400 14px/1 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.86); }
.ent-macros-mini { display: flex; gap: 2px; width: 60px; height: 3px; margin-top: 6px; border-radius: 2px; overflow: hidden; }
.ent-macros-mini s { display: block; height: 100%; }
.ent-m-p { background: var(--oro-claro); }
.ent-m-c { background: var(--salvia); }
.ent-m-g { background: #a9c4f5; }
.ent-base-nota { top: calc(30% + 50px + 184px + 12px); margin: 0; display: grid; gap: 7px; justify-items: center; font: 400 12.5px/1.25 var(--texto); color: rgba(239, 230, 207, 0.7); }
.ent-chip { padding: 5px 11px; border-radius: 999px; border: 1px solid rgba(232, 196, 106, 0.5); color: var(--oro-claro); font: 400 12.5px/1 var(--texto); }

/* El sueño: la noche que dibuja la estrella, y lo que sale de ella. */
.ent-noche { top: 27.5%; padding: 14px 16px; border-radius: 16px; background: rgba(6, 10, 22, 0.58); border: 1px solid rgba(239, 230, 207, 0.1); text-align: left; }
.ent-noche-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.ent-noche-cab span { font: 400 10.5px/1 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(239, 230, 207, 0.58); }
.ent-noche-cab b { font: 400 24px/1 var(--numeros); font-variant-numeric: tabular-nums; color: #fbf2d9; }
.ent-noche-grafico { margin-top: 12px; height: 92px; clip-path: inset(-2px 100% -2px 0); animation: ent-revela 1.3s var(--cuando) linear both; }
.ent-noche-grafico svg { display: block; width: 100%; height: 100%; }
@keyframes ent-revela { to { clip-path: inset(-2px 0 -2px 0); } }
.ent-noche-datos { margin-top: 12px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ent-noche-datos div { display: grid; gap: 3px; }
.ent-noche-datos span { font: 400 11.5px/1.15 var(--texto); color: rgba(239, 230, 207, 0.6); }
.ent-noche-datos b { font: 400 15px/1 var(--numeros); font-variant-numeric: tabular-nums; color: var(--tinta); }
.ent-noches { top: calc(27.5% + 214px); }
.ent-noches span { display: block; margin-bottom: 8px; text-align: left; font: 400 10.5px/1 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(239, 230, 207, 0.58); }
.ent-noches svg { display: block; width: 100%; height: 100%; }

/* Los dos juntos: la estrella une la noche con el día. */
.ent-juntos-caja { top: 29%; }
.ent-juntos-caja .sb-juntos { padding: 15px 16px; background: rgba(6, 10, 22, 0.58); text-align: left; }
.ent-juntos-caja .sb-j-grafico { height: 52px; }
.ent-juntos-caja .sb-j-union { height: 30px; margin: 5px 0 5px 23px; transform-origin: top; animation: ent-une 0.7s var(--cuando) ease-in-out both; }
@keyframes ent-une { from { transform: scaleY(0); } }
.ent-juntos-caja .sb-j-hoy { animation: ent-sube 0.6s var(--luego) cubic-bezier(0.2, 0.7, 0.2, 1) both; }

/* Lo que cuesta: la estrella camina la prueba. */
.ent-camino { top: 37%; height: 150px; }
.ent-camino-hilo { position: absolute; left: 13%; right: 13%; top: 5px; height: 1px; background: rgba(239, 230, 207, 0.2); }
.ent-camino-hilo i { display: block; height: 100%; background: var(--oro); box-shadow: 0 0 8px rgba(232, 196, 106, 0.7); transform-origin: left; animation: ent-camina var(--dura) var(--cuando) linear both; }
@keyframes ent-camina { from { transform: scaleX(0); } }
.ent-camino-puntos { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.ent-camino-puntos div { display: grid; align-content: start; justify-items: center; gap: 3px; text-align: center; }
.ent-camino-puntos i { width: 11px; height: 11px; margin-bottom: 7px; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.5); background: #0c1124; animation: ent-nodo 0.4s var(--cuando) ease-out both; }
@keyframes ent-nodo { to { border-color: var(--oro); background: var(--oro); box-shadow: 0 0 12px rgba(232, 196, 106, 0.7); } }
.ent-camino-puntos b { font: 500 14px/1.2 var(--texto); }
.ent-camino-puntos span { font: 400 12.5px/1.28 var(--texto); color: rgba(239, 230, 207, 0.72); text-wrap: balance; }
.ent-precio-nota { top: 58%; margin: 0; font: 400 13px/1.3 var(--texto); color: rgba(239, 230, 207, 0.66); }

/* El cuestionario nuevo (2/11/2026): lo que depende de lo elegido crece y se achica (abierto y quieto,
   deja ver los brillos de adentro), las etiquetas chicas, los pasos de a 15 minutos y las pantallas densas. */
.ent-denso .ent-titulo { font-size: 28px; }
.ent-denso .ent-texto { font-size: 14px; margin-top: 8px; }
.ent-etiqueta { display: block; margin: 18px 0 9px; font: 400 10.5px/1 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: rgba(239, 230, 207, 0.5); }
.ent-plegable { display: grid; grid-template-rows: 1fr; opacity: 1; transition: grid-template-rows 0.42s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.32s; }
.ent-plegable.cerrado { grid-template-rows: 0fr; opacity: 0; pointer-events: none; }
.ent-plegable > div { min-height: 0; overflow: hidden; }
.ent-plegable:not(.cerrado):not(.moviendo) > div { overflow: visible; }
.ent-cambia { transition: opacity 0.18s; }
.ent-cambia.saliendo { opacity: 0; }
.ent-pasito { display: inline-flex; align-items: center; gap: 2px; padding: 3px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.14); background: rgba(6, 10, 22, 0.5); }
.ent-pasito button { appearance: none; cursor: pointer; width: 32px; height: 32px; padding: 0; border-radius: 50%; border: 0; background: rgba(239, 230, 207, 0.07); color: var(--oro-claro); display: grid; place-items: center; transition: transform 0.15s; }
.ent-pasito button:active { transform: scale(0.9); }
.ent-pasito svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; }
.ent-pasito b { min-width: 62px; text-align: center; font: 500 16px/1 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: #fbf2d9; }
.ent-numero.ent-mediano { margin-top: 14px; }
.ent-numero.ent-mediano b { font-size: 56px; }
.ent-mediano + .ent-rango { margin-top: 14px; }
/* La hoja de la página va en el body, después de esta: lo que pisa una regla suya lleva .entrada adelante. */
.entrada .ent-opciones.ent-cuatro { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.entrada .ent-cuatro .ent-opcion { padding: 11px 3px; }
.entrada .ent-cuatro .ent-opcion b { font-size: 12.5px; white-space: nowrap; }
.entrada .ent-opciones.ent-par { grid-template-columns: 1fr 1fr; }
.ent-etiqueta + .ent-opciones { margin-top: 0; }
.ent-opciones.ent-cuadro { grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 18px; }
.ent-cuadro .ent-opcion { padding: 12px; align-content: center; }
.ent-cuadro .ent-opcion b { font-size: 14.5px; }
.con-icono.ent-cuadro .ent-opcion { grid-template-columns: 30px minmax(0, 1fr); gap: 10px; }
.ent-cuadro .ent-opcion-icono { width: 30px; height: 30px; }
.ent-segmento .ent-opcion span { font: 400 11.5px/1.2 var(--numeros); font-variant-numeric: tabular-nums; }
.ent-opciones.ent-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 0; }
.ent-chips .ent-opcion { padding: 9px 14px; border-radius: 999px; }
.ent-chips .ent-opcion b { font: 400 14px/1.1 var(--texto); }
.ent-opcion[data-valor] { position: relative; }
.ent-sugerida { display: inline-block; margin-left: 7px; padding: 3px 7px; border-radius: 999px; font: 400 10.5px/1 var(--texto); color: var(--salvia); border: 1px solid rgba(166, 191, 148, 0.45); vertical-align: 2px; }
.ent-nota-salud { display: block; margin-top: 14px; font: 400 12.5px/1.35 var(--texto); color: var(--salvia); }

/* Esto dice Salud: los cuatro datos en una tarjeta, y cada uno se abre para cambiarlo. */
.ent-tarjeta { margin-top: 20px; border-radius: 18px; background: rgba(6, 10, 22, 0.55); border: 1px solid rgba(239, 230, 207, 0.12); overflow: hidden; animation: ent-entra 0.6s 0.3s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.ent-fila { appearance: none; cursor: pointer; width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto auto 14px; align-items: center; gap: 10px; padding: 15px 16px; background: none; border: 0; border-top: 1px solid rgba(239, 230, 207, 0.08); color: var(--tinta); text-align: left; }
.ent-tarjeta > .ent-fila:first-child { border-top: 0; }
.ent-fila span { font: 400 14.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.72); }
.ent-fila b { font: 500 17px/1 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: #fbf2d9; }
.ent-fila .ent-de-salud { margin: 0; transition: opacity 0.3s; }
.ent-fila .ent-de-salud.apagado { opacity: 0; }
.ent-fila i { color: rgba(239, 230, 207, 0.45); display: grid; }
.ent-fila i svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.3s; }
.ent-fila[aria-expanded='true'] i svg { transform: rotate(180deg); }
.ent-editor { padding: 0 16px 14px; }
.ent-editor .ent-rango { margin-top: 0; }
.ent-editor .ent-opciones { margin-top: 2px; }

/* La grasa: cómo la sabes, y debajo lo de cada modo. Las figuras son dibujos, sin rasgos. */
.ent-grasa-zona { margin-top: 2px; }
.ent-grasa-zona .ent-chico { margin-top: 14px; }
.ent-figuras { margin-top: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.ent-figura { appearance: none; cursor: pointer; padding: 8px 4px 8px; border-radius: 14px; background: rgba(6, 10, 22, 0.55); border: 1px solid rgba(239, 230, 207, 0.12); color: rgba(239, 230, 207, 0.4); display: grid; justify-items: center; gap: 5px; transition: color 0.25s, border-color 0.25s, background 0.25s, box-shadow 0.25s; animation: ent-entra 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.ent-figura svg { width: 40px; height: 62px; fill: currentColor; }
.ent-figura svg .ent-brazos { fill: none; stroke: currentColor; stroke-linecap: round; }
.ent-figura svg .ent-torso { stroke: #0a0f1f; stroke-width: 1.1; }
.ent-figura span { font: 400 11.5px/1 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.66); }
.ent-figura[aria-pressed='true'] { color: var(--oro-claro); border-color: rgba(232, 196, 106, 0.75); background: rgba(232, 196, 106, 0.1); box-shadow: 0 0 18px rgba(232, 196, 106, 0.18); }
.ent-figura[aria-pressed='true'] span { color: var(--oro-claro); }
.ent-medidas { margin-top: 12px; display: grid; gap: 8px; }
.ent-medida { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 14px; background: rgba(6, 10, 22, 0.55); border: 1px solid rgba(239, 230, 207, 0.1); }
.ent-medida b { display: block; font: 500 14.5px/1.2 var(--texto); }
.ent-medida small { display: block; margin-top: 2px; font: 400 11.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.55); }
.ent-resultado-cinta { margin-top: 12px; font: 400 15px/1.3 var(--texto); color: var(--oro-claro); text-align: center; }

/* El entreno: qué deportes (se elige más de uno, con su marca a la derecha), y después qué días, a qué
   hora, cuánto dura y cuánto tardas en llegar. */
.ent-opciones.ent-varias { gap: 8px; margin-top: 18px; }
.ent-varias .ent-opcion { padding: 12px 14px; }
.con-icono.ent-varias .ent-opcion { grid-template-columns: 34px minmax(0, 1fr) 20px; }
.ent-opcion-marca { width: 20px; height: 20px; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.25); display: grid; place-items: center; color: transparent; transition: color 0.25s, background 0.25s, border-color 0.25s; }
.ent-opcion-marca svg { width: 12px; height: 12px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.ent-opcion[aria-pressed='true'] .ent-opcion-marca { color: #1a1406; background: var(--oro); border-color: var(--oro); }
.ent-dias { display: flex; justify-content: space-between; gap: 4px; }
.ent-diasem { appearance: none; cursor: pointer; width: 38px; height: 38px; padding: 0; border-radius: 50%; border: 1px solid rgba(239, 230, 207, 0.18); background: rgba(6, 10, 22, 0.5); color: rgba(239, 230, 207, 0.72); font: 500 13.5px/1 var(--texto); transition: color 0.25s, border-color 0.25s, background 0.25s, box-shadow 0.25s; }
.ent-diasem[aria-pressed='true'] { background: rgba(232, 196, 106, 0.16); border-color: rgba(232, 196, 106, 0.8); color: var(--oro-claro); box-shadow: 0 0 12px rgba(232, 196, 106, 0.25); }
.ent-dos-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ent-desliza { flex: 1 1 auto; min-height: 0; overflow-y: auto; margin: 0 -28px; padding: 0 28px 10px; scrollbar-width: none; }
.ent-desliza::-webkit-scrollbar { display: none; }
.ent-sesion + .ent-sesion { margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(239, 230, 207, 0.08); }
.ent-sesion-cab { display: flex; align-items: center; gap: 8px; margin: 14px 0 10px; color: var(--oro-claro); }
.ent-sesion-cab svg { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.ent-sesion-cab b { font: 500 14px/1.2 var(--texto); color: var(--tinta); }
.ent-pregunta { margin-top: 16px; display: grid; grid-template-columns: minmax(0, 1fr) 118px; align-items: center; gap: 12px; }
.ent-pregunta > span { font: 400 14px/1.3 var(--texto); color: var(--tinta); }
.entrada .ent-pregunta .ent-opciones { margin-top: 0; }
.entrada .ent-si-no .ent-opcion { padding: 9px 4px; }
.ent-dia-partido .ent-etiqueta { margin-top: 12px; }
.ent-suma { margin: 14px 0 0; font: 400 12.5px/1.35 var(--texto); color: rgba(239, 230, 207, 0.6); }

/* El peso meta con su ritmo: cada ritmo con su fecha, o una fecha con el ritmo que pide. */
.ent-ritmos { display: grid; gap: 6px; }
.ent-ritmo-fila { appearance: none; cursor: pointer; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 14px; background: rgba(6, 10, 22, 0.55); border: 1px solid rgba(239, 230, 207, 0.14); color: var(--tinta); text-align: left; transition: border-color 0.25s, background 0.25s, box-shadow 0.25s; animation: ent-entra 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.ent-ritmo-fila b { font: 500 15px/1.2 var(--texto); }
.ent-ritmo-fila span { display: block; margin-top: 2px; font: 400 12px/1.2 var(--texto); color: rgba(239, 230, 207, 0.6); }
.ent-ritmo-fila em { font: normal 400 14px/1 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: rgba(239, 230, 207, 0.88); white-space: nowrap; }
.ent-ritmo-fila[aria-pressed='true'] { border-color: rgba(232, 196, 106, 0.75); background: rgba(232, 196, 106, 0.1); box-shadow: 0 0 22px rgba(232, 196, 106, 0.18); }
.ent-ritmo-fila:disabled { opacity: 0.45; cursor: default; }
.ent-ritmo-fila i { display: grid; color: rgba(239, 230, 207, 0.5); }
.ent-ritmo-fila i svg { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.ent-fecha-elegida { margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.ent-fecha-elegida .ent-pasito b { min-width: 76px; }
.ent-viab { display: grid; justify-items: end; gap: 4px; text-align: right; }
.ent-viab em { font: normal 500 12.5px/1 var(--texto); }
.ent-viab span { font: 400 12px/1.2 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.62); }
.ent-viab .viable { color: var(--salvia); }
.ent-viab .exigente { color: var(--oro-claro); }
.ent-viab .muyAgresivo { color: #f0a58a; }

/* El plan, en una línea: hoy, la meta y lo que sigue. */
.ent-plan { position: relative; margin-top: 24px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
.ent-plan-hilo { position: absolute; left: 16.67%; right: 16.67%; top: 5px; height: 1px; background: rgba(239, 230, 207, 0.18); }
.ent-plan-hilo i { display: block; height: 100%; background: linear-gradient(90deg, var(--oro), rgba(232, 196, 106, 0.55)); box-shadow: 0 0 8px rgba(232, 196, 106, 0.6); transform-origin: left; animation: ent-camina 1.1s 0.5s cubic-bezier(0.4, 0, 0.2, 1) both; }
.ent-plan-nodo { position: relative; display: grid; align-content: start; justify-items: center; gap: 3px; text-align: center; }
.ent-plan-nodo > i { width: 11px; height: 11px; margin-bottom: 7px; border-radius: 50%; background: var(--oro); box-shadow: 0 0 10px rgba(232, 196, 106, 0.7); }
.ent-plan-nodo:last-child > i { background: #0c1124; border: 1px solid rgba(232, 196, 106, 0.75); box-shadow: none; }
.ent-plan b { font: 500 13.5px/1.2 var(--numeros); font-variant-numeric: lining-nums tabular-nums; }
.ent-plan span { font: 400 12px/1.28 var(--texto); color: rgba(239, 230, 207, 0.7); text-wrap: balance; }

/* Cómo comes: el reparto con su barra, la proteína en gramos y lo que comes. */
.ent-barra-macros { display: flex; gap: 2px; height: 4px; margin-top: 9px; border-radius: 2px; overflow: hidden; }
.ent-barra-macros s { display: block; height: 100%; transition: flex-grow 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
.ent-estilos .ent-opcion { padding: 11px 13px 12px; }
.ent-estilos .ent-opcion-textos { gap: 0; }

/* Tu día: de que te despiertas a que te acuestas, con las comidas y el entreno en el medio. */
.ent-dia-lista { position: relative; margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 2px; }
.ent-dia-lista::before { content: ''; position: absolute; left: 6px; top: 22px; bottom: 22px; width: 1px; background: linear-gradient(rgba(169, 196, 245, 0.5), rgba(232, 196, 106, 0.5) 20%, rgba(232, 196, 106, 0.5) 80%, rgba(169, 196, 245, 0.5)); }
.ent-dia-fila { position: relative; display: grid; grid-template-columns: 13px minmax(0, 1fr) auto; align-items: center; column-gap: 12px; min-height: 44px; animation: ent-entra 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.ent-dia-nodo { position: relative; z-index: 1; width: 13px; height: 13px; border-radius: 50%; background: var(--oro); box-shadow: 0 0 8px rgba(232, 196, 106, 0.6); transition: background 0.25s, box-shadow 0.25s, border-color 0.25s; }
.ent-dia-fila.sueno .ent-dia-nodo { background: #a9c4f5; box-shadow: 0 0 8px rgba(169, 196, 245, 0.55); }
.ent-dia-fila.entreno .ent-dia-nodo { background: var(--salvia); box-shadow: 0 0 8px rgba(166, 191, 148, 0.55); }
.ent-dia-fila.no .ent-dia-nodo { background: #0b1022; border: 1px solid rgba(239, 230, 207, 0.35); box-shadow: none; }
.ent-dia-nombre { appearance: none; padding: 4px 0; border: 0; background: none; color: var(--tinta); text-align: left; display: grid; gap: 2px; }
button.ent-dia-nombre { cursor: pointer; }
.ent-dia-nombre b { font: 500 15px/1.2 var(--texto); transition: color 0.25s; }
.ent-dia-nombre span { font: 400 12px/1.2 var(--texto); color: rgba(239, 230, 207, 0.55); }
.ent-dia-fila.no .ent-dia-nombre b { color: rgba(239, 230, 207, 0.45); }
.ent-dia-valor { display: grid; justify-items: end; align-items: center; }
.ent-dia-valor > * { grid-area: 1 / 1; transition: opacity 0.25s; }
.ent-dia-valor .ent-dia-no { opacity: 0; font: 400 13px/1 var(--texto); color: rgba(239, 230, 207, 0.5); pointer-events: none; }
.ent-dia-fila.no .ent-pasito { opacity: 0; pointer-events: none; }
.ent-dia-fila.no .ent-dia-no { opacity: 1; }
.ent-dia-fijo { display: inline-flex; align-items: center; gap: 8px; font: 500 15px/1 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: rgba(239, 230, 207, 0.86); }
.ent-dia-fijo .ent-de-salud { margin: 0; }

/* El resultado: el plan en una línea, y de dónde sale el gasto. */
.ent-plan-linea { margin: 10px auto 0; max-width: 320px; font: italic 400 16.5px/1.32 var(--titulos); color: var(--oro-claro); text-align: center; text-wrap: balance; text-shadow: 0 0 14px rgba(3, 5, 12, 0.9); }
.ent-partes { margin: 4px 0 0; font: 400 11.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.5); text-wrap: balance; }
@media (prefers-reduced-motion: reduce) {
  .ent-aparece, .ent-busca span, .ent-base-fila i, .ent-noche-grafico, .ent-juntos-caja .sb-j-union, .ent-juntos-caja .sb-j-hoy, .ent-camino-hilo i, .ent-camino-puntos i { animation-duration: 0.01s; animation-delay: 0s; }
  .ent-opcion, .ent-tarjeta, .ent-figura, .ent-ritmo-fila, .ent-dia-fila, .ent-plan-hilo i { animation-duration: 0.01s; animation-delay: 0s; }
  .ent-plegable { transition: opacity 0.2s; }
  .ent-fila i svg, .ent-barra-macros s, .ent-pasito button { transition: none; }
  .ent-saltar { transition: none; }
}
`;
  // Lo del ejemplo de la comida, de la base (2 huevos, 122 g; 1 rebanada, 25 g; 1 taza, 252 g) y de lo que se busca.
  const KCAL_DEL_DICHO = [234, 73, 101];
  // kcal y los gramos de proteína, carbohidratos y grasas: ½ aguacate, 1 milanesa y 1 cucharada de dulce de leche.
  const DE_LA_BASE = [[160, 2, 8.5, 14.7], [490, 31.8, 12.7, 33.7], [60, 1.3, 10.5, 1.4]];
  let conEstilo = false;
  function ponerEstilo() {
    if (conEstilo) return;
    conEstilo = true;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
  }
  const limitar = (x, a, b) => Math.min(b, Math.max(a, x));
  const mezclar = (a, b, k) => a + (b - a) * k;

  // La meta inicial sale de src/dominio/cuestionario.ts (Cuestionario.metaDelCuestionario): el gasto por
  // partes, el ritmo o la fecha, el piso y la proteína del nivel elegido. Después la ajusta el control.

  // Los íconos que el cuestionario suma a los de util.js.
  const ICONOS = {
    silla: '<path d="M8 3.5v9.5h9.5M8 13v7.5M17.5 13v7.5M8 17h9.5"/>',
    caja: '<path d="M4 8.5 12 4.5l8 4v8l-8 4-8-4z"/><path d="m4 8.5 8 4 8-4M12 12.5v8"/>',
    pausa: '<path d="M9 7v10M15 7v10"/>',
    cruzadas: '<path d="M8 19.5V5.5M4.8 8.7 8 5.5l3.2 3.2M16 4.5v14M12.8 15.3l3.2 3.2 3.2-3.2"/>',
    pelota: '<circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16M6.6 6.2c2.6 2.9 2.6 8.7 0 11.6M17.4 6.2c-2.6 2.9-2.6 8.7 0 11.6"/>',
    ovalada: '<ellipse cx="12" cy="12" rx="9" ry="5.4" transform="rotate(-35 12 12)"/><path d="m9.3 14.7 5.4-5.4M10.6 11.6l1.8 1.8M12.1 10.1l1.8 1.8"/>',
  };
  const iconoDe = (n) => (ICONOS[n] ? `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n]}</svg>` : Util.icono(n));

  // Una figura de frente, de la cabeza a las rodillas, sin rasgos: con más grasa (k de 0 a 8), más ancha
  // la cintura y, en las mujeres, la cadera. Sirve para comparar.
  function figura(sexo, k) {
    const t = k / 8;
    const m = sexo === 'm';
    const c = 26;
    const w = {
      cuello: 2.6,
      hombro: m ? 14 + 1.6 * t : 11.6 + 1.6 * t,
      pecho: m ? 11.8 + 3.2 * t : 10.6 + 3.4 * t,
      cintura: m ? 8.6 + 9.4 * t : 7.6 + 8.6 * t,
      cadera: m ? 10.2 + 6 * t : 12 + 8 * t,
      muslo: m ? 9 + 4.6 * t : 9.8 + 6 * t,
    };
    const lado = [[w.cuello, 14.5], [w.hombro, 20], [w.pecho, 29], [w.cintura, 42], [w.cadera, 52], [w.muslo, 62], [w.muslo * 0.74, 78]];
    const f = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
    // Catmull-Rom: una curva suave que pasa por cada punto.
    const curva = (pts) => pts.slice(0, -1).map((p1, i) => {
      const p0 = pts[Math.max(0, i - 1)], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      return ` C ${f([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6])} ${f([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6])} ${f(p2)}`;
    }).join('');
    const izq = lado.map(([x, y]) => [c - x, y]);
    const der = lado.map(([x, y]) => [c + x, y]).reverse();
    const torso = `M ${f(izq[0])}${curva(izq)} L ${f([c - 1.4, 78])} L ${f([c, 63])} L ${f([c + 1.4, 78])} L ${f(der[0])}${curva(der)} Z`;
    // Los brazos se abren con la cintura, para no taparla.
    const fin = Math.max(w.hombro + 2.2, w.cintura + 3.2 + 1.2 * t);
    const brazo = (s) => `M ${f([c + s * (w.hombro - 1.4), 21.5])} Q ${f([c + s * (w.hombro + 1.4 + t), 34])} ${f([c + s * fin, 51])}`;
    return `<svg viewBox="0 0 52 80" aria-hidden="true"><path class="ent-brazos" d="${brazo(-1)} ${brazo(1)}" stroke-width="${(3.4 + 2.2 * t).toFixed(2)}"/><path class="ent-torso" d="${torso}"/><circle cx="${c}" cy="8.4" r="5.3"/></svg>`;
  }

  // La parte iluminada de una luna creciente de radio r: p va de 0 (nueva) a 1 (llena).
  function fase(p, r) {
    const rx = Math.abs(Math.cos(Math.PI * p)) * r;
    return `M 0 ${-r} A ${r} ${r} 0 0 1 0 ${r} A ${rx.toFixed(2)} ${r} 0 0 ${p < 0.5 ? 0 : 1} 0 ${-r} Z`;
  }

  // ------------------------------------------------------------ los caminos de la estrella
  // Cada tramo es una lista de puntos repartidos por largo y no por el parámetro de la curva: así la
  // estrella va pareja y la estela mide lo mismo en una curva que en una vuelta.
  const PUNTOS = 48;
  function porLargo(muestra) {
    const N = PUNTOS * 4;
    const finos = [];
    let largo = 0;
    let antes = muestra(0);
    finos.push([antes[0], antes[1], 0]);
    for (let k = 1; k <= N; k++) {
      const p = muestra(k / N);
      largo += Math.hypot(p[0] - antes[0], p[1] - antes[1]);
      finos.push([p[0], p[1], largo]);
      antes = p;
    }
    const lut = [];
    let j = 0;
    for (let k = 0; k <= PUNTOS; k++) {
      const meta = (largo * k) / PUNTOS;
      while (j < N - 1 && finos[j + 1][2] < meta) j++;
      const a = finos[j];
      const b = finos[j + 1];
      const f = b[2] > a[2] ? limitar((meta - a[2]) / (b[2] - a[2]), 0, 1) : 0;
      lut.push(mezclar(a[0], b[0], f), mezclar(a[1], b[1], f));
    }
    return { lut, largo };
  }
  const bezier = (p0, p1, p2, p3) => porLargo((u) => {
    const v = 1 - u;
    const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
    return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
  });
  const recta = (p0, p1) => porLargo((u) => [mezclar(p0[0], p1[0], u), mezclar(p0[1], p1[1], u)]);
  // Una vuelta entera alrededor de c, desde arriba y en el sentido del reloj.
  const vuelta = (c, r) => porLargo((u) => [c[0] + r * Math.sin(u * TAU), c[1] - r * Math.cos(u * TAU)]);

  function enLut(lut, s) {
    const f = limitar(s, 0, 1) * PUNTOS;
    const k = Math.min(PUNTOS - 1, Math.floor(f));
    const r = f - k;
    return [mezclar(lut[2 * k], lut[2 * k + 2], r), mezclar(lut[2 * k + 1], lut[2 * k + 3], r)];
  }

  const FACIL = {
    lineal: (u) => u,
    suave: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(2 - 2 * u, 3) / 2),
    llega: (u) => 1 - Math.pow(1 - u, 3),
    sale: (u) => u * u * u,
  };

  // La estela mide 150 px y, cuando la estrella para, la alcanza en 280 ms.
  const ESTELA = 150;
  const RETRAE = 280;

  // Dónde está la estrella en el momento t del guion y las estelas que deja. Con Reducir movimiento
  // no viaja: se apaga donde estaba y se enciende donde va, sin estela.
  function estado(g, t, reducido) {
    let pos = g.inicio.pos;
    let escala = g.inicio.escala;
    let brillo = g.inicio.brillo;
    let visible = 1;
    const estelas = [];
    for (const tr of g.tramos) {
      if (t < tr.t0) break;
      const u = limitar((t - tr.t0) / tr.ms, 0, 1);
      const s = FACIL[tr.facil](u);
      if (tr.escala) escala = mezclar(tr.escala[0], tr.escala[1], s);
      if (tr.brillo) brillo = mezclar(tr.brillo[0], tr.brillo[1], s);
      if (reducido && tr.largo > 1) {
        pos = enLut(tr.lut, u < 0.5 ? 0 : 1);
        visible = u >= 1 ? 1 : Math.abs(2 * u - 1);
      } else {
        pos = enLut(tr.lut, s);
        visible = 1;
      }
      if (tr.estela && !reducido) {
        const pasado = t - tr.t0 - tr.ms;
        const k = pasado <= 0 ? 1 : 1 - pasado / RETRAE;
        if (k > 0) estelas.push({ lut: tr.lut, desde: Math.max(0, s - (ESTELA / Math.max(1, tr.largo)) * k), hasta: s });
      }
    }
    return { pos, escala, brillo: brillo * visible, base: brillo, estelas };
  }

  // La barra del cuestionario: cuánto lleva y cuánto se ve.
  function barraEn(g, t) {
    const b = g.barra;
    if (!b) return { k: 0, visible: 0 };
    const u = b.ms ? limitar((t - b.t0) / b.ms, 0, 1) : 1;
    return { k: mezclar(b.k[0], b.k[1], FACIL.llega(u)), visible: mezclar(b.visible[0], b.visible[1], limitar((t - (b.tv || 0)) / 500, 0, 1)) };
  }

  // Proyección gnomónica centrada en la constelación, con el norte arriba y el este a la izquierda
  // (la misma de escena.js y de src/cielo/mundo.ts).
  function proyectar(estrellas) {
    const rad = Math.PI / 180;
    const vs = estrellas.map((e) => {
      const ra = e.ra * rad, dec = e.dec * rad;
      return [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
    });
    const c = [0, 0, 0];
    vs.forEach((v) => { c[0] += v[0]; c[1] += v[1]; c[2] += v[2]; });
    const lc = Math.hypot(c[0], c[1], c[2]);
    c[0] /= lc; c[1] /= lc; c[2] /= lc;
    const le = Math.hypot(c[0], c[1]);
    const este = le < 1e-6 ? [1, 0, 0] : [-c[1] / le, c[0] / le, 0];
    const norte = [c[1] * este[2] - c[2] * este[1], c[2] * este[0] - c[0] * este[2], c[0] * este[1] - c[1] * este[0]];
    return vs.map((v) => {
      const k = v[0] * c[0] + v[1] * c[1] + v[2] * c[2];
      return [-(v[0] * este[0] + v[1] * este[1] + v[2] * este[2]) / k, (v[0] * norte[0] + v[1] * norte[1] + v[2] * norte[2]) / k];
    });
  }

  function encajar(plano, centro, maxAncho, maxAlto) {
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    plano.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
    const escala = plano.length < 2 ? 1 : Math.min(maxAncho / Math.max(x1 - x0, 1e-6), maxAlto / Math.max(y1 - y0, 1e-6));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return plano.map(([x, y]) => [centro[0] + (x - cx) * escala, centro[1] + (y - cy) * escala]);
  }

  function crear(tel, escena, opciones) {
    ponerEstilo();
    const raiz = document.createElement('div');
    raiz.className = 'entrada';
    raiz.hidden = true;
    tel.appendChild(raiz);

    let idioma = 'es';
    const u = Util.crear({ textos: opciones.textos, idioma: () => idioma });
    const tx = (clave, vars) => {
      let s = clave.split('.').reduce((o, k) => (o ? o[k] : undefined), opciones.textos[idioma]);
      if (s == null) return clave;
      if (typeof s === 'string' && vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
      return s;
    };
    const numero = (n, dec) => n.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
    const numero2 = (n) => numero(n, 2);
    const el = (etiqueta, clase, texto) => {
      const n = document.createElement(etiqueta);
      if (clase) n.className = clase;
      if (texto != null) n.textContent = texto;
      return n;
    };
    const reducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Lo que contestó. Con Salud conectada, edad, sexo, altura, peso, los pasos y las noches vienen de
    // ahí (de mentira; las noches, las de la persona de la galería). Cada deporte tiene sus días, su hora y
    // cuánto dura en entreno.de; los elegidos están en entreno.tipos (vacío: no entrena, y lo de cada uno
    // espera por si cambia de idea). Una comida en noSuele no se suele hacer.
    const DE_FABRICA = {
      salud: false, edad: 29, sexo: null, altura: 172, peso: 74.5, sinDeficit: false, caso: 'nada',
      grasaModo: 'no', grasaPct: 18, figura: null, cinta: { cintura: 86, cuello: 38, cadera: 98 },
      movimiento: 'sentado',
      entreno: {
        tipos: ['fuerza'],
        de: {
          fuerza: { dias: [1, 3, 5], hora: 18 * 60, minutos: 60 },
          equipo: { dias: [2, 4], hora: 20 * 60, minutos: 90 },
          resistencia: { dias: [2, 6], hora: 7 * 60 + 30, minutos: 45 },
          contacto: { dias: [2, 4], hora: 20 * 60, minutos: 90 },
        },
        viaje: 15, partidos: false, diaDePartido: 6, categoriaDePeso: false,
      },
      objetivo: 'mantener', pesoMeta: null, ritmo: 'recomendado', fecha: null, experiencia: 'principiante', despues: 'mantener',
      estilo: 'equilibrada', proteina: 'recomendada', dieta: 'todo',
      horarios: Object.assign({}, Comidas.HORA_TIPICA), noSuele: {},
      sueno: { despertar: 7 * 60, acostarse: 23 * 60, finDeSemana: 'igual' },
    };
    const copia = (x) => JSON.parse(JSON.stringify(x));
    const r = copia(DE_FABRICA);
    const DE_SALUD = { edad: 31, sexo: 'm', altura: 176, peso: 78.4, pasos: 7400 };
    let desdeSalud = {};

    // Lo que sale de lo contestado, con la lógica de la app (src/dominio/cuestionario.ts).
    const sexo = () => r.sexo || 'm';
    const cambiaPeso = () => r.objetivo === 'bajar' || r.objetivo === 'subir';
    const preguntaGrasa = () => !r.sinDeficit && r.edad >= Metas.MAYORIA_DE_EDAD;
    // Lo que se guarda: los deportes, la sesión de cada uno, el viaje, los partidos y la categoría de peso. Al
    // final, SOLO para el horario de los avisos (alrededorDelEntreno, que hoy lleva uno): el tipo reducido y
    // el horario principal; los consejos salen de los deportes y de las sesiones de cada día.
    function entrenoDicho() {
      const e = r.entreno;
      const tipos = Cuestionario.DEPORTES.filter((t) => e.tipos.includes(t));
      if (!tipos.length) return null;
      const preguntas = Cuestionario.preguntasDelEntreno(tipos);
      const dicho = {
        tipos,
        sesiones: tipos.map((tipo) => Object.assign({ tipo }, copia(e.de[tipo]))),
        viaje: e.viaje,
        partidos: preguntas.partidos && e.partidos ? { dia: e.diaDePartido } : null,
        categoriaDePeso: preguntas.categoriaDePeso ? e.categoriaDePeso : null,
      };
      return Object.assign(dicho, Cuestionario.horarioDeLosAvisos(dicho));
    }
    const levantaPesas = () => Cuestionario.entrenaFuerza(entrenoDicho());
    const medidasDeCinta = () => (sexo() === 'f' ? copia(r.cinta) : { cintura: r.cinta.cintura, cuello: r.cinta.cuello });
    function grasaDicha() {
      if (!preguntaGrasa()) return null;
      if (r.grasaModo === 'dicha') return { como: 'dicha', pct: r.grasaPct };
      if (r.grasaModo === 'imagen' && r.figura != null) return { como: 'imagen', pct: Cuestionario.grasaDeFigura(sexo(), r.figura) };
      if (r.grasaModo === 'cinta') {
        const x = Cuerpo.rangoDeGrasa(sexo(), r.altura, medidasDeCinta());
        return x ? { como: 'cinta', pct: Math.round(x.estimado * 10) / 10 } : null;
      }
      return null;
    }
    const persona = () => ({ edad: r.edad, sexo: sexo(), alturaCm: r.altura, pesoKg: r.peso, sinDeficit: r.sinDeficit, grasa: grasaDicha() });
    const gastoTotal = () => Cuestionario.gastoEstimado(Object.assign(persona(), { movimiento: r.movimiento, entreno: entrenoDicho() })).total;
    const entradaDelPlazo = () => ({ hoy: Datos.HOY, pesoKg: r.peso, pesoMeta: r.pesoMeta, sexo: sexo(), edad: r.edad, gasto: gastoTotal(), entrenaFuerza: levantaPesas() });
    const pctDe = (ritmo) => Math.abs(Metas.RITMOS[r.objetivo][Metas.ritmoPermitido({ edad: r.edad, objetivo: r.objetivo, ritmo })]);
    const plazoDeRitmo = (ritmo) => (cambiaPeso() && r.pesoMeta != null ? Progreso.plazoConRitmo(entradaDelPlazo(), pctDe(ritmo)) : null);
    // Con una fecha, el ritmo que pide; pero antes de los 18, bajando, la meta no pasa del recomendado
    // (Cuestionario.pctDelPlan), y el plan llega cuando llega a ese ritmo.
    function plazoElegido() {
      if (!cambiaPeso() || r.pesoMeta == null) return null;
      if (!r.fecha) return plazoDeRitmo(r.ritmo);
      const e = entradaDelPlazo();
      const conFecha = Progreso.plazoConFecha(e, r.fecha);
      const usado = conFecha && Cuestionario.pctDelPlan({ edad: r.edad, objetivo: r.objetivo, sinDeficit: r.sinDeficit, pct: conFecha.pct });
      return usado && usado < conFecha.pct ? Progreso.plazoConRitmo(e, usado) : conFecha;
    }
    function respuestas() {
      const plazo = r.fecha ? plazoElegido() : null;
      return Object.assign(persona(), {
        movimiento: r.movimiento, entreno: entrenoDicho(), objetivo: r.objetivo, ritmo: r.ritmo,
        pct: plazo ? plazo.pct : null, estilo: r.estilo, proteina: r.proteina,
      });
    }
    const metaDeAhora = () => Cuestionario.metaDelCuestionario(respuestas());
    // Las noches de Salud: con tres o más, el sueño no se pregunta (el horario, de Sueno.horario si alcanza).
    function suenoDeSalud() {
      if (!r.salud) return null;
      const noches = Sueno.ultimasNoches(Datos.NOCHES, Datos.HOY, 14);
      const medidas = noches.filter(Boolean);
      if (medidas.length < Cuestionario.NOCHES_PARA_NO_PREGUNTAR) return null;
      const h = Sueno.horario(noches);
      const promedio = (k) => medidas.reduce((s, n) => s + n[k], 0) / medidas.length;
      const reloj = (x) => (Math.round(x / 5) * 5 + 18 * 60) % 1440;
      return { despertar: reloj(h ? h.despertar : promedio('despertar')), dormirse: reloj(h ? h.dormirse : promedio('dormirse')) };
    }
    // Lo que quedaría en el perfil (galeria/src/datos.js tiene los mismos campos).
    function perfilDicho() {
      const x = metaDeAhora();
      const deSalud = suenoDeSalud();
      return {
        sexo: sexo(), edad: r.edad, alturaCm: r.altura, objetivo: x.objetivo, recomponer: x.recomponer, ritmo: r.ritmo, actividad: x.actividad,
        pesoMeta: cambiaPeso() ? r.pesoMeta : null, sinDeficit: r.sinDeficit, estilo: r.estilo, proteina: r.proteina,
        movimiento: r.movimiento, entreno: entrenoDicho(), experiencia: levantaPesas() ? r.experiencia : null, grasaDicha: grasaDicha(),
        despues: cambiaPeso() ? r.despues : null, comer: { dieta: r.dieta },
        horarios: Object.fromEntries(Comidas.CON_HORA.map((c) => [c, r.noSuele[c] ? null : r.horarios[c]])),
        sueno: deSalud ? { despertar: deSalud.despertar, acostarse: deSalud.dormirse, finDeSemana: null } : copia(r.sueno),
      };
    }

    let actual = -1;
    let animando = 0;
    let temporizador = 0;
    let esperaPista = 0;
    const despues = (ms, fn) => setTimeout(fn, ms);

    // ------------------------------------------------------------ la estrella guía
    // Va por encima de las pantallas: la estrella (con su halo, sus rayos y el aro que se le cierra
    // encima cuando espera), la estela en un lienzo, la barra del cuestionario y el botón invisible
    // que la hace tocable. Cuadro a cuadro solo mientras se mueve algo: quieta, lo que respira es CSS.
    const guia = (() => {
      const capa = el('div', 'ent-guia-capa');
      const lienzo = document.createElement('canvas');
      lienzo.className = 'ent-estela';
      const ctx = lienzo.getContext('2d');
      const barra = el('div', 'ent-progreso');
      const relleno = el('i');
      barra.appendChild(relleno);
      const estrella = el('div', 'ent-guia');
      ['halo', 'rayos', 'nucleo', 'aro'].forEach((n) => estrella.appendChild(el('i', 'ent-guia-' + n)));
      const boton = el('button', 'ent-tocar oculto');
      boton.type = 'button';
      boton.disabled = true;
      const pista = el('p', 'ent-pista');
      const saltar = el('button', 'ent-saltar');
      saltar.type = 'button';
      capa.append(lienzo, barra, estrella, boton, pista, saltar);
      raiz.appendChild(capa);

      let g = null;
      let t0 = 0;
      let cuadro = 0;
      let hechos = 0;
      let dpr = 1;
      let ancho = 0;
      let alto = 0;
      let vivo = { pos: [0, 0], escala: 0.3, brillo: 0, enBarra: null };
      // Para las capturas: el reloj de la estrella quieto en un momento.
      let fijo = null;

      function pintarEstelas(estelas) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, ancho, alto);
        // Sin estela, el lienzo se esconde: algunos navegadores siguen mostrando lo borrado.
        lienzo.style.visibility = estelas.length ? 'visible' : 'hidden';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        estelas.forEach((e) => {
          const pts = [];
          for (let k = 0; k <= 18; k++) pts.push(enLut(e.lut, mezclar(e.desde, e.hasta, k / 18)));
          const [cx, cy] = pts[0];
          const [hx, hy] = pts[pts.length - 1];
          if (Math.hypot(hx - cx, hy - cy) < 2) return;
          const degrade = (alfa) => {
            const d = ctx.createLinearGradient(cx, cy, hx, hy);
            d.addColorStop(0, 'rgba(246, 227, 166, 0)');
            d.addColorStop(1, `rgba(255, 244, 214, ${alfa})`);
            return d;
          };
          const trazo = () => {
            ctx.beginPath();
            pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          };
          // El resplandor son dos trazos anchos y tenues (un filtro de desenfoque es caro y en algunos
          // navegadores deja rastro); encima, el hilo de luz.
          [[7, 0.12], [3.6, 0.22], [1.6, 0.85]].forEach(([grosor, alfa]) => {
            trazo();
            ctx.strokeStyle = degrade(alfa);
            ctx.lineWidth = grosor;
            ctx.stroke();
          });
        });
      }

      function cuadroDe(ahora) {
        cuadro = 0;
        if (!g) return;
        const t = fijo != null ? fijo : ahora - t0;
        const e = estado(g, t, reducido());
        estrella.style.transform = `translate3d(${e.pos[0].toFixed(1)}px, ${e.pos[1].toFixed(1)}px, 0) scale(${e.escala.toFixed(3)})`;
        estrella.style.opacity = e.brillo.toFixed(3);
        pintarEstelas(e.estelas);
        const b = barraEn(g, t);
        relleno.style.width = `${(b.k * 100).toFixed(2)}%`;
        barra.style.opacity = b.visible.toFixed(3);
        vivo = { pos: e.pos, escala: e.escala, brillo: e.base, enBarra: b.visible > 0.5 ? b.k : null };
        if (g.pintar) g.pintar(t);
        while (hechos < g.eventos.length && g.eventos[hechos][0] <= t) g.eventos[hechos++][1]();
        if (t < g.duracion && fijo == null) cuadro = requestAnimationFrame(cuadroDe);
      }

      return {
        boton,
        barra,
        pista,
        saltar,
        get vivo() { return vivo; },
        reproducir(nuevo, a) {
          dpr = Math.min(2, window.devicePixelRatio || 1);
          if (ancho !== a.W || alto !== a.H) {
            ancho = a.W;
            alto = a.H;
            lienzo.width = Math.round(a.W * dpr);
            lienzo.height = Math.round(a.H * dpr);
          }
          g = nuevo;
          g.eventos = (g.eventos || []).slice().sort((x, y) => x[0] - y[0]);
          g.duracion = Math.max(g.fin || 0, g.hasta || 0, ...g.eventos.map((x) => x[0])) + RETRAE + 120;
          hechos = 0;
          fijo = null;
          vivo = { pos: g.inicio.pos, escala: g.inicio.escala, brillo: g.inicio.brillo, enBarra: g.inicio.enBarra ?? null };
          t0 = performance.now();
          cancelAnimationFrame(cuadro);
          cuadro = requestAnimationFrame(cuadroDe);
        },
        esperar(si) {
          estrella.classList.remove('enciende');
          estrella.classList.toggle('espera', si && !reducido());
          boton.disabled = !si;
          pista.classList.remove('visible');
        },
        // Tocarla la enciende, como a una estrella del cielo.
        encender() {
          estrella.classList.remove('espera', 'enciende');
          void estrella.offsetWidth;
          if (!reducido()) estrella.classList.add('enciende');
          boton.disabled = true;
          pista.classList.remove('visible');
        },
        mostrarBoton(si) { boton.classList.toggle('oculto', !si); },
        congelar(t) {
          fijo = t;
          cancelAnimationFrame(cuadro);
          cuadro = requestAnimationFrame(cuadroDe);
        },
        soltar() {
          if (fijo == null) return;
          t0 = performance.now() - fijo;
          fijo = null;
          cuadro = requestAnimationFrame(cuadroDe);
        },
        apagar() {
          cancelAnimationFrame(cuadro);
          cuadro = 0;
          g = null;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, lienzo.width, lienzo.height);
          estrella.className = 'ent-guia';
          estrella.style.opacity = '0';
          barra.style.opacity = '0';
          relleno.style.width = '0';
          boton.classList.add('oculto');
          boton.disabled = true;
          pista.classList.remove('visible');
          saltar.classList.remove('visible');
        },
      };
    })();
    window.__guia = { congelar: guia.congelar, soltar: guia.soltar };

    // Los lugares de la estrella, medidos en la pantalla: abajo (donde espera), el musgo donde nace,
    // arriba de la frase, el centro de lo que se explica, el rincón donde acompaña, la marca y la barra.
    function anclas() {
      const W = raiz.offsetWidth || tel.clientWidth;
      const H = raiz.offsetHeight || tel.clientHeight;
      const b = guia.boton;
      const br = guia.barra;
      const descanso = [b.offsetLeft + b.offsetWidth / 2, b.offsetTop + b.offsetHeight / 2];
      const y = br.offsetTop + br.offsetHeight / 2;
      const marca = [W / 2, H * 0.36];
      return {
        W, H, descanso, marca,
        nacer: [W * 0.17, descanso[1] - 34],
        frase: [W / 2, H * 0.44 - 140],
        figura: [W / 2, H * 0.5],
        compania: [W - 44, y + 26],
        chispa: [marca[0] + 74, marca[1] - 30],
        barra: { y, x0: br.offsetLeft, x1: br.offsetLeft + br.offsetWidth },
      };
    }

    // Dónde queda la estrella al terminar cada pantalla: de ahí sale la siguiente.
    function reposo(i, a) {
      const paso = PASOS[i];
      if (!paso) return { pos: a.nacer, escala: 0.3, brillo: 0 };
      if (paso.tocar) return { pos: a.descanso, escala: 1, brillo: 1 };
      if (paso.id === 'datos') return { pos: a.compania, escala: 0.62, brillo: 0.85 };
      if (paso.id === 'cuenta') return { pos: a.chispa, escala: 0.7, brillo: 0.95 };
      if (paso.id === 'resultado') return { pos: [a.W / 2, a.barra.y], escala: 0.62, brillo: 1 };
      const k = avanceDe(paso);
      return { pos: [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y], escala: 0.5, brillo: 0.9, enBarra: k };
    }

    function botonSeguir(texto, alTocar, clase) {
      const b = el('button', 'ent-boton ' + (clase || ''), texto);
      b.type = 'button';
      b.addEventListener('click', alTocar);
      return b;
    }

    // ------------------------------------------------------------ la luna de la comida
    // La comida tiene su luna: se llena con lo que comes, y tres arcos alrededor, uno por macro. La
    // meta es la luna llena. Es la misma luna de verdad de la zona de comida (comida.js): mares,
    // grano y la sombra con el borde suave.
    let lunas = 0;
    function luna(clase) {
      const id = `entLuna${++lunas}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '-100 -100 200 200');
      svg.setAttribute('class', 'ent-luna ' + (clase || ''));
      svg.innerHTML = `
        <defs>
          <radialGradient id="${id}-cara" cx="36%" cy="32%" r="76%">
            <stop offset="0" stop-color="#fffaf0"/><stop offset="0.5" stop-color="#f0e5ca"/><stop offset="0.88" stop-color="#d6c39b"/><stop offset="1" stop-color="#bfa77a"/>
          </radialGradient>
          <radialGradient id="${id}-noche" cx="40%" cy="38%" r="72%"><stop offset="0" stop-color="#1b2342"/><stop offset="1" stop-color="#0b1022"/></radialGradient>
          <filter id="${id}-grano" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" seed="7"/>
            <feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.35  0 0 0 0 0.22  0 0 0 1 -0.4"/>
            <feComposite in2="SourceAlpha" operator="in"/>
          </filter>
          <filter id="${id}-suave" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
          <filter id="${id}-borde" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter>
          <mask id="${id}-luz" maskUnits="userSpaceOnUse" x="-50" y="-50" width="100" height="100"><path class="ent-luna-fase" fill="#fff" filter="url(#${id}-borde)"/></mask>
          <clipPath id="${id}-disco"><circle r="40"/></clipPath>
        </defs>
        <circle r="46" class="ent-luna-halo"/>
        <g clip-path="url(#${id}-disco)">
          <circle r="40" fill="url(#${id}-noche)"/>
          <g mask="url(#${id}-luz)">
            <circle r="40" fill="url(#${id}-cara)"/>
            <g class="luna-mares" filter="url(#${id}-suave)">
              <ellipse cx="-12" cy="-14" rx="11" ry="8.5"/><ellipse cx="5" cy="-10" rx="7" ry="6"/><ellipse cx="13" cy="0" rx="7.5" ry="7"/>
              <ellipse cx="-20" cy="6" rx="7.5" ry="13"/><ellipse cx="-2" cy="15" rx="6.5" ry="4.2"/><ellipse cx="20" cy="14" rx="4.5" ry="3.6"/>
            </g>
            <g class="luna-crateres"><circle cx="-6" cy="27" r="2.4"/><circle cx="10" cy="23" r="1.5"/><circle cx="24" cy="-2" r="1.3"/><circle cx="-26" cy="-6" r="1.2"/></g>
            <circle r="40" fill="#000" filter="url(#${id}-grano)" opacity="0.16"/>
            <circle r="40" class="luna-limbo" filter="url(#${id}-suave)"/>
          </g>
        </g>
        <circle r="40" class="ent-luna-contorno"/>
        <circle r="54" class="ent-arco ent-arco-p"/>
        <circle r="62" class="ent-arco ent-arco-c"/>
        <circle r="70" class="ent-arco ent-arco-g"/>`;
      const faseEl = svg.querySelector('.ent-luna-fase');
      const arcos = [...svg.querySelectorAll('.ent-arco')];
      // Dos maneras de usar los arcos: tres anillos que dibuja la estrella (la diapositiva) o un
      // solo anillo repartido entre los tres macros (el resultado).
      let repartido = false;
      arcos.forEach((a) => {
        const largo = 2 * Math.PI * Number(a.getAttribute('r'));
        a.style.strokeDasharray = `${largo} ${largo}`;
        a.style.strokeDashoffset = String(largo);
        a.dataset.largo = largo;
      });
      const dibujarArco = (a, ki) => {
        if (repartido) {
          a.style.strokeDasharray = `${(Number(a.dataset.tramo) * ki).toFixed(2)} ${a.dataset.largo}`;
          a.style.strokeDashoffset = String(-Number(a.dataset.desde));
        } else {
          a.style.strokeDashoffset = String(Number(a.dataset.largo) * (1 - ki));
        }
      };
      return {
        svg,
        // De creciente a llena en `ms`, con el anillo repartido que se llena tramo por tramo.
        llenar(ms, demora) {
          const t0 = performance.now() + (demora || 0);
          const cuadro = (ahora) => {
            const u = Math.min(1, Math.max(0, (ahora - t0) / ms));
            const k = 1 - Math.pow(1 - u, 3);
            faseEl.setAttribute('d', fase(0.06 + 0.94 * k, 40));
            arcos.forEach((a, i) => dibujarArco(a, Math.min(1, Math.max(0, (u - 0.3 * i) / 0.4))));
            if (u < 1 && svg.isConnected) animando = requestAnimationFrame(cuadro);
          };
          faseEl.setAttribute('d', fase(0.06, 40));
          arcos.forEach((a) => dibujarArco(a, 0));
          animando = requestAnimationFrame(cuadro);
        },
        // La fase y cuánto lleva cada anillo, desde afuera: la estrella los dibuja al dar la vuelta.
        pintar(k, avances) {
          faseEl.setAttribute('d', fase(0.06 + 0.94 * k, 40));
          arcos.forEach((a, i) => dibujarArco(a, avances[i]));
        },
        // Un anillo entre los tres macros, en proporción a sus kcal, con un hueco entre cada uno.
        repartir(lista) {
          repartido = true;
          const radio = 60;
          const largo = 2 * Math.PI * radio;
          let antes = 0;
          arcos.forEach((a, i) => {
            a.setAttribute('r', radio);
            a.dataset.largo = largo;
            a.dataset.desde = antes * largo;
            a.dataset.tramo = Math.max(0, lista[i] * largo - 7);
            antes += lista[i];
          });
        },
      };
    }

    // ------------------------------------------------------------ las pantallas
    // tocar: la estrella espera abajo y tocarla es seguir (la frase y la introducción).
    // intro: lleva la constelación de la introducción, y se puede saltar hasta lo que cuesta.
    const PASOS = [
      { id: 'frase', camara: 0, tocar: true, armar: armarFrase },
      { id: 'comida', camara: 0.2, tocar: true, intro: true, armar: armarComida },
      { id: 'base', camara: 0.36, tocar: true, intro: true, armar: armarBase },
      { id: 'sueno', camara: 0.52, tocar: true, intro: true, armar: armarSueno },
      { id: 'juntos', camara: 0.66, tocar: true, intro: true, armar: armarJuntos },
      { id: 'habitos', camara: 0.8, tocar: true, intro: true, armar: armarHabitos },
      { id: 'precio', camara: 0.92, tocar: true, intro: true, armar: armarPrecio },
      { id: 'datos', camara: 0.98, armar: armarDatos },
      { id: 'cuenta', camara: 1.08, armar: armarCuenta },
      // El cuestionario nuevo (2/11/2026): una pregunta por pantalla, con lo que va junto agrupado. `si`:
      // cuándo aparece (con Salud, los cuatro datos van en una tarjeta para confirmar; la grasa, desde los 18
      // y sin cuidados; la experiencia, al subir o recomponer con pesas; el peso meta y lo que sigue, al
      // bajar o subir). Lo que no aparece se saltea al seguir.
      { id: 'salud', camara: 1.16, cuestionario: true, armar: armarSalud },
      { id: 'tu', camara: 1.18, cuestionario: true, si: () => r.salud, armar: (p, c) => (r.edad < Metas.EDAD_MINIMA ? armarMenor(p) : armarTu(p, c)) },
      { id: 'sexo', camara: 1.18, cuestionario: true, si: () => !r.salud, armar: armarSexo },
      { id: 'edad', camara: 1.19, cuestionario: true, si: () => !r.salud, armar: (p, c) => (r.edad < Metas.EDAD_MINIMA ? armarMenor(p) : pantallaNumero(p, c.paso, { clave: 'edad', titulo: 'entrada.cuestionario.edadTitulo', min: 16, max: 90, paso: 1, dec: 0, unidad: tx('entrada.cuestionario.anos') })) },
      { id: 'altura', camara: 1.2, cuestionario: true, si: () => !r.salud, armar: (p, c) => pantallaNumero(p, c.paso, { clave: 'altura', titulo: 'entrada.cuestionario.alturaTitulo', min: 130, max: 220, paso: 1, dec: 0, unidad: 'cm' }) },
      { id: 'peso', camara: 1.21, cuestionario: true, si: () => !r.salud, armar: (p, c) => pantallaNumero(p, c.paso, { clave: 'peso', titulo: 'entrada.cuestionario.pesoTitulo', texto: 'entrada.cuestionario.pesoTexto', min: 35, max: 200, paso: 0.1, dec: 1, unidad: 'kg' }) },
      { id: 'cuidado', camara: 1.22, cuestionario: true, armar: armarCuidado },
      { id: 'grasa', camara: 1.235, cuestionario: true, si: preguntaGrasa, armar: armarGrasa },
      { id: 'movimiento', camara: 1.25, cuestionario: true, armar: armarMovimiento },
      { id: 'entreno', camara: 1.26, cuestionario: true, armar: armarEntreno },
      { id: 'cuando', camara: 1.27, cuestionario: true, si: () => r.entreno.tipos.length > 0, armar: armarCuando },
      { id: 'objetivo', camara: 1.28, cuestionario: true, armar: armarObjetivo },
      { id: 'experiencia', camara: 1.29, cuestionario: true, si: () => (r.objetivo === 'subir' || r.objetivo === 'recomponer') && levantaPesas(), armar: armarExperiencia },
      { id: 'meta', camara: 1.3, cuestionario: true, si: cambiaPeso, armar: armarMeta },
      { id: 'despues', camara: 1.315, cuestionario: true, si: cambiaPeso, armar: armarDespues },
      { id: 'comer', camara: 1.33, cuestionario: true, armar: armarComer },
      { id: 'dia', camara: 1.345, cuestionario: true, armar: armarDia },
      { id: 'resultado', camara: 1.37, armar: armarResultado },
    ];
    const aplica = (p) => !p.si || p.si();
    // El lugar de una pregunta entre las que aparecen con lo contestado hasta ahora (cambia al contestar).
    function lugarDe(paso) {
      const lista = PASOS.filter((x) => x.cuestionario && (x === paso || aplica(x)));
      return { i: lista.indexOf(paso), total: lista.length };
    }
    const avanceDe = (paso) => { const l = lugarDe(paso); return (l.i + 1) / l.total; };
    const enIntro = PASOS.filter((p) => p.intro);
    const SALTA_A = PASOS.findIndex((p) => p.id === 'precio');
    // Los íconos de las opciones: cuánto se mueve, qué entrena, hacia dónde va y lo que sigue.
    const ICONOS_DE = {
      movimiento: { sentado: 'silla', dePie: 'huellas', fisico: 'caja' },
      entreno: { fuerza: 'pesa', equipo: 'pelota', resistencia: 'onda', contacto: 'ovalada', no: 'pausa' },
      objetivo: { bajar: 'abajo', mantener: 'objetivo', subir: 'arriba', recomponer: 'cruzadas' },
      despues: { mantener: 'objetivo', musculo: 'pesa', despues: 'reloj' },
    };

    function pantalla(clase) {
      const p = el('section', 'ent-pantalla ' + clase);
      raiz.insertBefore(p, raiz.querySelector('.ent-guia-capa'));
      return p;
    }

    function cabezaDeCuestionario(p, paso) {
      const { i, total } = lugarDe(paso);
      // La barra es de la estrella (va por encima): acá queda su lugar. Debajo, la constelación de
      // las preguntas: lo contestado encendido y la de ahora, prendiéndose.
      const cab = el('div', 'ent-cab-pasos');
      cab.append(constelacionDePasos(i, total), el('div', 'ent-paso', tx('entrada.cuestionario.paso', { n: i + 1, total })));
      p.append(el('div', 'ent-progreso-hueco'), cab);
    }

    // Arriba de la introducción, la misma constelación chica: lo visto encendido y lo de ahora, prendiéndose.
    function cabezaDeIntro(p, paso) {
      const cab = el('div', 'ent-cab-intro');
      cab.appendChild(constelacionDePasos(enIntro.indexOf(paso), enIntro.length));
      p.appendChild(cab);
    }

    // Una estrella por pregunta, en zigzag, como una constelación chica.
    function constelacionDePasos(actual, total) {
      const W = 150, H = 30;
      const pts = Array.from({ length: total }, (_, k) => [6 + (k * (W - 12)) / (total - 1), H - 8 - (k % 2 ? 9 : 0) - k * 1.2]);
      const lineas = pts.slice(1).map(([x, y], k) => {
        const [x0, y0] = pts[k];
        const largo = Math.hypot(x - x0, y - y0).toFixed(1);
        const clase = k + 1 < actual ? 'hecha' : k + 1 === actual ? 'nueva' : '';
        return `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="${clase}" style="--largo:${largo}"/>`;
      }).join('');
      const estrellas = pts.map(([x, y], k) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${k === actual ? 2.6 : 2}" class="${k < actual ? 'hecha' : k === actual ? 'ahora' : ''}"/>`).join('');
      const n = document.createElementNS(SVG, 'svg');
      n.setAttribute('viewBox', `0 0 ${W} ${H}`);
      n.setAttribute('class', 'ent-constelacion');
      n.setAttribute('aria-hidden', 'true');
      n.innerHTML = lineas + estrellas;
      return n;
    }

    // La frase: la estrella nace en el musgo, sube por la izquierda hasta arriba de la frase mientras
    // aparecen las palabras, y baja por la derecha a esperar.
    function armarFrase(p, { a }) {
      const { W, H } = a;
      const caja = el('div', 'ent-frase-caja');
      const q = el('p', 'ent-frase-texto');
      tx('entrada.frase').split(' ').forEach((palabra, i) => {
        const s = el('span', null, palabra);
        s.style.animationDelay = `${1.3 + i * 0.075}s`;
        q.append(s, ' ');
      });
      const autor = el('p', 'ent-frase-autor', tx('entrada.fraseAutor'));
      caja.append(q, autor);
      p.appendChild(caja);
      return {
        inicio: { pos: a.nacer, escala: 0.3, brillo: 0 },
        tramos: [
          { t0: 0, ms: 450, ...recta(a.nacer, a.nacer), facil: 'llega', escala: [0.3, 1], brillo: [0, 1] },
          { t0: 450, ms: 1300, ...bezier(a.nacer, [0, H * 0.55], [W * 0.12, H * 0.16], a.frase), facil: 'suave', estela: true },
          { t0: 2700, ms: 850, ...bezier(a.frase, [W * 1.02, H * 0.3], [W * 1.02, H * 0.8], a.descanso), facil: 'suave', estela: true },
        ],
        fin: 3550,
        eventos: [[380, () => escena.haptico('suave')]],
      };
    }

    // Casiopea en la pantalla: dónde va cada estrella y el orden en que la recorre la guía, de una
    // punta a la otra empezando por la de la izquierda.
    function casiopeaEn(a) {
      const c = (opciones.catalogo || []).find((x) => x.id === 'cassiopeia');
      if (!c) return null;
      const plano = encajar(proyectar(c.estrellas), [0, 0], a.W * 0.64, a.H * 0.2);
      const pos = plano.map(([x, y]) => [a.figura[0] + x, a.figura[1] - y]);
      const vecinos = pos.map(() => []);
      c.lineas.forEach(([i, j]) => { vecinos[i].push(j); vecinos[j].push(i); });
      const puntas = pos.map((_, i) => i).filter((i) => vecinos[i].length === 1).sort((i, j) => pos[i][0] - pos[j][0]);
      let ahora = puntas.length ? puntas[0] : 0;
      const orden = [ahora];
      while (orden.length < pos.length) {
        const siguienteEstrella = vecinos[ahora].find((v) => !orden.includes(v));
        if (siguienteEstrella == null) break;
        orden.push(siguienteEstrella);
        ahora = siguienteEstrella;
      }
      return { pos, orden, lineas: c.lineas };
    }

    // «Tus hábitos son estrellas»: la guía llega a la primera estrella y salta de una a la otra; cada
    // una se enciende al tocarla, la línea queda detrás, y al final se conecta como un día completo.
    function armarHabitos(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.habitosTitulo')), el('p', 'ent-texto', tx('entrada.habitosTexto')));
      const cas = casiopeaEn(a);
      if (!cas) return { inicio: desde, tramos: [{ t0: 100, ms: 900, ...recta(desde.pos, a.descanso), facil: 'suave' }], fin: 2500 };
      const { pos, orden, lineas } = cas;
      const LLEGA = 1100;
      const SALTO = 310;
      const PAUSA = 90;
      const luz = pos.map(() => Infinity);
      const saltos = [];
      luz[orden[0]] = LLEGA;
      const primera = pos[orden[0]];
      const tramos = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.08, a.H * 0.8], [a.W * 0.02, primera[1] + 80], primera), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
      for (let k = 1; k < orden.length; k++) {
        const t0 = LLEGA + PAUSA + (k - 1) * (SALTO + PAUSA);
        tramos.push({ t0, ms: SALTO, ...recta(pos[orden[k - 1]], pos[orden[k]]), facil: 'suave', estela: true });
        luz[orden[k]] = t0 + SALTO;
        saltos.push([orden[k - 1], orden[k], t0, t0 + SALTO]);
      }
      const ultima = pos[orden[orden.length - 1]];
      const completo = luz[orden[orden.length - 1]] + 180;
      const sale = completo + 420;
      tramos.push({ t0: sale, ms: 850, ...bezier(ultima, [ultima[0] + 60, ultima[1] + 90], [a.W * 0.86, a.H * 0.86], a.descanso), facil: 'suave', estela: true });
      const pintar = dibujarCasiopea(p, a, pos, lineas, saltos);
      return {
        inicio: desde,
        tramos,
        fin: sale + 850,
        hasta: completo + 1300,
        eventos: [...orden.map((i) => [luz[i], () => escena.haptico('toque')]), [completo, () => escena.haptico('completo')]],
        pintar: (t) => pintar(t, luz, completo),
      };
    }

    function dibujarCasiopea(p, a, pos, lineas, saltos) {
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'ent-casiopea');
      svg.setAttribute('viewBox', `0 0 ${a.W} ${a.H}`);
      const nuevo = (etiqueta, attrs, padre) => {
        const n = document.createElementNS(SVG, etiqueta);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        (padre || svg).appendChild(n);
        return n;
      };
      const defs = nuevo('defs', {});
      const halo = nuevo('radialGradient', { id: 'entCasHalo' }, defs);
      [[0, 0.62], [0.34, 0.2], [1, 0]].forEach(([o, al]) => nuevo('stop', { offset: o, 'stop-color': '#f6e3a6', 'stop-opacity': al }, halo));
      const brillo = nuevo('radialGradient', { id: 'entCasDestello' }, defs);
      [[0, 0.95], [0.3, 0.45], [1, 0]].forEach(([o, al]) => nuevo('stop', { offset: o, 'stop-color': '#fff6de', 'stop-opacity': al }, brillo));
      lineas.forEach(([i, j]) => nuevo('line', { class: 'ent-cas-base', x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1] }));
      const oro = saltos.map(([i, j]) => {
        const largo = Math.hypot(pos[j][0] - pos[i][0], pos[j][1] - pos[i][1]);
        const n = nuevo('line', { class: 'ent-cas-oro', x1: pos[i][0], y1: pos[i][1], x2: pos[j][0], y2: pos[j][1], 'stroke-dasharray': `${largo} ${largo}`, 'stroke-dashoffset': largo });
        return { n, largo };
      });
      const centro = [pos.reduce((s, q) => s + q[0], 0) / pos.length, pos.reduce((s, q) => s + q[1], 0) / pos.length];
      const ola = nuevo('circle', { class: 'ent-cas-ola', cx: centro[0], cy: centro[1], r: 0, opacity: 0 });
      const estrellas = pos.map(([x, y]) => ({
        onda: nuevo('circle', { class: 'ent-cas-onda', cx: x, cy: y, r: 0, opacity: 0 }),
        halo: nuevo('circle', { cx: x, cy: y, r: 16, fill: 'url(#entCasHalo)', opacity: 0 }),
        destello: nuevo('circle', { cx: x, cy: y, r: 0, fill: 'url(#entCasDestello)', opacity: 0 }),
        anillo: nuevo('circle', { class: 'ent-cas-anillo', cx: x, cy: y, r: 4.2 }),
        nucleo: nuevo('circle', { cx: x, cy: y, r: 1.3, fill: '#fbf2d9', opacity: 0.55 }),
      }));
      p.appendChild(svg);
      // Lo de cada cuadro: una estrella que se enciende tiene un destello y una onda, como un toque
      // real; sin movimiento, solo se enciende.
      const fugaz = (d, ms, desde, hasta) => (d >= 0 && d <= ms && !reducido() ? mezclar(desde, hasta, FACIL.llega(d / ms)) : 0);
      const apaga = (d, ms, alfa) => (d >= 0 && d <= ms && !reducido() ? alfa * (1 - d / ms) : 0);
      return (t, luz, completo) => {
        estrellas.forEach((e, i) => {
          const d = t - luz[i];
          const l = limitar(d / 250, 0, 1);
          const pop = d >= 0 && !reducido() ? Math.exp(-d / 200) : 0;
          e.halo.setAttribute('opacity', l.toFixed(3));
          e.halo.setAttribute('r', (16 + 6 * l + 10 * pop).toFixed(2));
          e.nucleo.setAttribute('r', (1.3 + 1.3 * l + 0.8 * pop).toFixed(2));
          e.nucleo.setAttribute('opacity', (0.55 + 0.45 * l).toFixed(3));
          e.anillo.setAttribute('opacity', (1 - l).toFixed(3));
          e.destello.setAttribute('r', fugaz(d, 420, 8, 34).toFixed(2));
          e.destello.setAttribute('opacity', apaga(d, 420, 0.85).toFixed(3));
          e.onda.setAttribute('r', fugaz(d, 760, 8, 46).toFixed(2));
          e.onda.setAttribute('opacity', apaga(d, 760, 0.7).toFixed(3));
        });
        const c = limitar((t - completo) / 500, 0, 1);
        oro.forEach(({ n, largo }, k) => {
          const u = limitar((t - saltos[k][2]) / (saltos[k][3] - saltos[k][2]), 0, 1);
          n.setAttribute('stroke-dashoffset', (largo * (1 - FACIL.suave(u))).toFixed(2));
          n.setAttribute('stroke-opacity', (0.6 + 0.35 * c).toFixed(3));
          n.setAttribute('stroke-width', (1.2 + 0.5 * c).toFixed(2));
        });
        const dc = t - completo;
        ola.setAttribute('r', fugaz(dc, 1300, 16, 166).toFixed(1));
        ola.setAttribute('opacity', apaga(dc, 1300, 0.35).toFixed(3));
      };
    }

    // Un texto que entra cuando la estrella llega a su lugar: `ms` desde que empieza la pantalla.
    const aparece = (n, ms) => {
      n.classList.add('ent-aparece');
      n.style.animationDelay = `${(ms / 1000).toFixed(2)}s`;
      return n;
    };

    // «Anota en segundos»: lo dicho arriba, y la guía da tres vueltas a la luna, una por macro. Cada vuelta
    // deja su anillo y anota un alimento mientras la luna se llena.
    function armarComida(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.intro.comida.titulo')), el('p', 'ent-texto', tx('entrada.intro.comida.texto')));
      const dicho = el('p', 'ent-fija ent-dicho');
      dicho.innerHTML = Util.icono('microfono');
      dicho.appendChild(el('span', null, tx('entrada.intro.comida.frase')));
      p.appendChild(aparece(dicho, 500));
      const l = luna();
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      p.appendChild(escenario);
      const c = [a.figura[0], a.H * 0.46];
      // Los radios de los anillos en la caja de 230 px (54, 62 y 70 en la de 200).
      const R = [54, 62, 70].map((x) => x * 1.15);
      const arriba = (radio) => [c[0], c[1] - radio];
      const LLEGA = 1100;
      const VUELTA = 560;
      const CAMBIO = 90;
      const vueltas = R.map((_, i) => LLEGA + i * (VUELTA + CAMBIO));
      const filas = el('ul', 'ent-fija ent-filas');
      tx('entrada.intro.comida.filas').forEach((nombre, i) => {
        const li = el('li');
        const texto = el('span', null, nombre);
        texto.appendChild(el('small', null, tx('entrada.intro.comida.porciones')[i]));
        li.append(texto, el('b', null, `${numero(KCAL_DEL_DICHO[i])} kcal`));
        filas.appendChild(aparece(li, vueltas[i] + VUELTA - 200));
      });
      p.appendChild(filas);
      p.appendChild(aparece(el('p', 'ent-fija ent-total', tx('entrada.intro.comida.total', { n: numero(KCAL_DEL_DICHO.reduce((x, y) => x + y, 0)) })), vueltas[2] + VUELTA + 150));
      const tramos = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.1, a.H * 0.86], [c[0] - 120, c[1] - R[0] - 6], arriba(R[0])), facil: 'suave', estela: true, escala: [desde.escala, 1], brillo: [desde.brillo, 1] }];
      R.forEach((radio, i) => {
        tramos.push({ t0: vueltas[i], ms: VUELTA, ...vuelta(c, radio), facil: 'lineal', estela: true });
        if (i < R.length - 1) tramos.push({ t0: vueltas[i] + VUELTA, ms: CAMBIO, ...recta(arriba(radio), arriba(R[i + 1])), facil: 'suave' });
      });
      const termina = vueltas[R.length - 1] + VUELTA;
      tramos.push({ t0: termina, ms: 900, ...bezier(arriba(R[2]), [c[0] + 140, c[1] - R[2]], [a.W * 0.96, a.H * 0.84], a.descanso), facil: 'llega', estela: true });
      return {
        inicio: desde,
        tramos,
        fin: termina + 900,
        eventos: vueltas.map((v) => [v + VUELTA, () => escena.haptico('suave')]),
        pintar: (t) => l.pintar(limitar((t - LLEGA) / (termina - LLEGA), 0, 1), vueltas.map((v) => limitar((t - v) / VUELTA, 0, 1))),
      };
    }

    // «Comida de verdad, sin adivinar»: lo que se busca y lo que encuentra. La guía baja por los resultados
    // y cada uno se enciende con su fuente: se compara con una segunda tabla oficial (spec/fuentes.md).
    function armarBase(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.intro.base.titulo')), el('p', 'ent-texto', tx('entrada.intro.base.texto')));
      const busca = el('div', 'ent-fija ent-busca');
      busca.innerHTML = Util.icono('lupa');
      const texto = el('span', null, tx('entrada.intro.base.busca'));
      texto.style.setProperty('--largo', `${tx('entrada.intro.base.busca').length * 0.5}em`);
      busca.appendChild(texto);
      const alto = a.H * 0.3 + 50;
      const FILA = 64;
      const X = 28 + 13 + 11;
      const centro = (k) => [X, alto + k * FILA + 28];
      const LLEGA = 1150;
      const SALTO = 340;
      const PAUSA = 130;
      const llegaA = [0, 1, 2].map((k) => LLEGA + k * (SALTO + PAUSA));
      const filas = el('ul', 'ent-fija ent-base-filas');
      tx('entrada.intro.base.filas').forEach((nombre, k) => {
        const [kcal, pr, ca, gr] = DE_LA_BASE[k];
        const total = pr * 4 + ca * 4 + gr * 9;
        const li = el('li', 'ent-base-fila');
        const marca = el('i');
        marca.innerHTML = Util.icono('listo');
        marca.style.setProperty('--cuando', `${(llegaA[k] / 1000).toFixed(2)}s`);
        const textos = el('div');
        const macros = el('div', 'ent-macros-mini');
        [['p', pr * 4], ['c', ca * 4], ['g', gr * 9]].forEach(([m, k2]) => {
          const b = el('s', 'ent-m-' + m);
          b.style.flex = `${(k2 / total).toFixed(3)} 0 0`;
          macros.appendChild(b);
        });
        textos.append(el('b', null, nombre), el('small', null, tx('entrada.intro.base.porciones')[k]), macros);
        li.append(marca, textos, el('em', null, `${numero(kcal)} kcal`));
        filas.appendChild(aparece(li, 300 + k * 160));
      });
      const nota = el('div', 'ent-fija ent-base-nota');
      nota.append(el('span', null, tx('entrada.intro.base.verificado')), el('span', 'ent-chip', tx('entrada.intro.base.sinIA')));
      p.append(busca, filas, aparece(nota, llegaA[2] + 300));
      const ultimo = centro(2);
      const tramos = [{ t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.04, a.H * 0.82], [a.W * 0.02, centro(0)[1] + 60], centro(0)), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] }];
      [1, 2].forEach((k) => tramos.push({ t0: llegaA[k] - SALTO, ms: SALTO, ...recta(centro(k - 1), centro(k)), facil: 'suave', estela: true }));
      const sale = llegaA[2] + 320;
      tramos.push({ t0: sale, ms: 850, ...bezier(ultimo, [ultimo[0] + 20, ultimo[1] + 130], [a.W * 0.3, a.H * 0.9], a.descanso), facil: 'suave', estela: true, escala: [0.8, 1] });
      return {
        inicio: desde,
        tramos,
        fin: sale + 850,
        eventos: llegaA.map((t) => [t, () => escena.haptico('suave')]),
      };
    }

    // «Tu sueño, también»: la noche de anoche, que la guía dibuja al pasar, y lo que sale de ella.
    function armarSueno(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.intro.sueno.titulo')), el('p', 'ent-texto', tx('entrada.intro.sueno.texto')));
      const noches = Sueno.ultimasNoches(Datos.NOCHES, Datos.HOY, 14);
      const n = noches[noches.length - 1] || Datos.NOCHES[Datos.NOCHES.length - 1];
      const deuda = Sueno.deudaDeSueno(noches, 8 * 60);
      const caja = el('section', 'ent-fija ent-noche');
      const cab = el('div', 'ent-noche-cab');
      cab.append(el('span', null, tx('entrada.intro.sueno.anoche')), el('b', null, u.duracion(n.dormido)));
      const grafico = el('div', 'ent-noche-grafico');
      grafico.appendChild(Graficos.hipnograma({ enCamaDesde: n.dormirse, enCamaHasta: n.despertar, tramos: n.tramos }, { ancho: 305, alto: 92, etiquetas: true }));
      const LLEGA = 1050;
      const CRUZA = 1300;
      grafico.style.setProperty('--cuando', `${(LLEGA / 1000).toFixed(2)}s`);
      const datos = el('div', 'ent-noche-datos');
      [
        ['teDormiste', u.horaMin(n.dormirse + 18 * 60)],
        ['teDespertaste', u.horaMin(n.despertar + 18 * 60)],
        ['deuda', deuda ? u.duracion(deuda.minutos) : '—'],
      ].forEach(([clave, valor]) => {
        const d = el('div');
        d.append(el('span', null, tx('entrada.intro.sueno.' + clave)), el('b', null, valor));
        datos.appendChild(d);
      });
      caja.append(cab, grafico, aparece(datos, LLEGA + CRUZA - 100));
      const semana = el('div', 'ent-fija ent-noches');
      semana.appendChild(el('span', null, tx('entrada.intro.sueno.semanas')));
      semana.appendChild(Graficos.columnas(noches.slice(-14).map((x) => (x ? x.dormido : null)), 8 * 60, { ancho: 337, alto: 60 }));
      p.append(aparece(caja, 250), aparece(semana, LLEGA + CRUZA));
      // La línea que cruza es la del medio del gráfico: del borde izquierdo al derecho de la tarjeta.
      const y = a.H * 0.275 + 14 + 24 + 12 + 46;
      const izq = [28 + 16, y];
      const der = [a.W - 28 - 16, y];
      const sale = LLEGA + CRUZA + 260;
      return {
        inicio: desde,
        tramos: [
          { t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.04, a.H * 0.8], [a.W * 0.02, y + 70], izq), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
          { t0: LLEGA, ms: CRUZA, ...recta(izq, der), facil: 'lineal', estela: true },
          { t0: sale, ms: 900, ...bezier(der, [a.W * 1.04, y + 130], [a.W * 0.96, a.H * 0.88], a.descanso), facil: 'suave', estela: true, escala: [0.8, 1] },
        ],
        fin: sale + 900,
        eventos: [[LLEGA + CRUZA, () => escena.haptico('suave')]],
      };
    }

    // «Comida y sueño, juntos»: el ejemplo de la pantalla de pago, en grande. La guía sale de la noche, baja
    // por el hilo que deja y llega a la luna de hoy: ahí aparece lo que eso le dice al día.
    function armarJuntos(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.intro.juntos.titulo')), el('p', 'ent-texto', tx('entrada.intro.juntos.texto')));
      const caja = el('div', 'ent-fija ent-juntos-caja');
      const ejemplo = Suscripcion.ejemplo(u);
      caja.appendChild(ejemplo);
      p.appendChild(aparece(caja, 250));
      const LLEGA = 1100;
      const BAJA = 700;
      const union = caja.querySelector('.sb-j-union');
      const hoy = caja.querySelector('.sb-j-hoy');
      const luna = caja.querySelector('.sb-j-luna');
      union.style.setProperty('--cuando', `${(LLEGA / 1000).toFixed(2)}s`);
      hoy.style.setProperty('--luego', `${((LLEGA + BAJA - 150) / 1000).toFixed(2)}s`);
      const top = a.H * 0.29;
      const xUnion = 28 + 16 + 23;
      const arriba = [xUnion, top + union.offsetTop];
      const llega = [xUnion, top + luna.offsetTop + hoy.offsetTop + 22];
      const sale = LLEGA + BAJA + 420;
      return {
        inicio: desde,
        tramos: [
          { t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.04, a.H * 0.8], [a.W * 0.02, arriba[1] + 40], arriba), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
          { t0: LLEGA, ms: BAJA, ...recta(arriba, llega), facil: 'suave', estela: true },
          { t0: sale, ms: 850, ...bezier(llega, [llega[0] + 30, llega[1] + 150], [a.W * 0.3, a.H * 0.9], a.descanso), facil: 'suave', estela: true, escala: [0.8, 1] },
        ],
        fin: sale + 850,
        eventos: [[LLEGA + BAJA, () => escena.haptico('toque')]],
      };
    }

    // «Pruébala 7 días, gratis»: lo que cuesta, antes de pedir nada. La guía camina la prueba y cada punto se
    // enciende al llegar: hoy, el aviso y el cobro. Estos precios son el respaldo; en la app, los de Apple.
    function armarPrecio(p, { a, desde, paso }) {
      cabezaDeIntro(p, paso);
      const usd = (plan) => `USD ${numero2(Premium.PRECIOS[plan])}`;
      p.append(
        el('h2', 'ent-titulo', tx('entrada.intro.precio.titulo', { n: Premium.DIAS_DE_PRUEBA })),
        el('p', 'ent-texto', tx('entrada.intro.precio.texto', { anual: usd('anual'), mensual: usd('mensual') })),
      );
      const camino = el('div', 'ent-fija ent-camino');
      const LLEGA = 1000;
      const TRAMO = 650;
      const cuando = [LLEGA, LLEGA + TRAMO + 120, LLEGA + 2 * (TRAMO + 120)];
      const hilo = el('div', 'ent-camino-hilo');
      const lleno = el('i');
      lleno.style.setProperty('--cuando', `${(LLEGA / 1000).toFixed(2)}s`);
      lleno.style.setProperty('--dura', `${((cuando[2] - LLEGA) / 1000).toFixed(2)}s`);
      hilo.appendChild(lleno);
      const puntos = el('div', 'ent-camino-puntos');
      [
        [tx('suscripcion.linea.hoy'), tx('suscripcion.linea.hoyTexto')],
        [tx('suscripcion.linea.dia', { n: Premium.DIA_DEL_AVISO }), tx('suscripcion.linea.avisoTexto')],
        [tx('suscripcion.linea.dia', { n: Premium.DIAS_DE_PRUEBA }), tx('suscripcion.linea.cobroTexto', { precio: usd('anual') })],
      ].forEach(([titulo, texto], k) => {
        const d = el('div');
        const nodo = el('i');
        nodo.style.setProperty('--cuando', `${(cuando[k] / 1000).toFixed(2)}s`);
        d.append(nodo, el('b', null, titulo), el('span', null, texto));
        puntos.appendChild(d);
      });
      camino.append(hilo, puntos);
      p.append(camino, aparece(el('p', 'ent-fija ent-precio-nota', tx('entrada.intro.precio.nota')), cuando[2] + 200));
      const y = a.H * 0.37 + 5.5;
      const X = [a.W * 0.5 - (a.W - 56 - 12) / 3 - 6, a.W * 0.5, a.W * 0.5 + (a.W - 56 - 12) / 3 + 6];
      const sale = cuando[2] + 380;
      return {
        inicio: desde,
        tramos: [
          { t0: 150, ms: LLEGA - 150, ...bezier(desde.pos, [a.W * 0.04, a.H * 0.8], [a.W * 0.02, y + 40], [X[0], y]), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
          { t0: cuando[1] - TRAMO, ms: TRAMO, ...recta([X[0], y], [X[1], y]), facil: 'suave', estela: true },
          { t0: cuando[2] - TRAMO, ms: TRAMO, ...recta([X[1], y], [X[2], y]), facil: 'suave', estela: true },
          { t0: sale, ms: 850, ...bezier([X[2], y], [a.W * 1.02, y + 140], [a.W * 0.9, a.H * 0.88], a.descanso), facil: 'suave', estela: true, escala: [0.8, 1] },
        ],
        fin: sale + 850,
        eventos: cuando.map((t) => [t, () => escena.haptico('suave')]),
      };
    }

    // Antes de la cuenta, una idea y una acción: qué guarda Moss, para qué, y el consentimiento para
    // los datos de salud (Ley 18.331 y la guía 5.1.1 de Apple). La estrella sube a acompañar.
    function armarDatos(p, { a, desde }) {
      p.classList.add('ent-cuestionario');
      const lista = el('ul', 'ent-lista-datos');
      tx('entrada.datos.lineas').forEach((linea, i) => {
        const li = el('li', null, linea);
        li.style.animationDelay = `${0.5 + i * 0.14}s`;
        lista.appendChild(li);
      });
      p.append(el('h2', 'ent-titulo', tx('entrada.datos.titulo')), el('p', 'ent-texto', tx('entrada.datos.texto')), lista, el('p', 'ent-chico ent-enlace ent-izquierda', tx('entrada.datos.politica')), el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.datos.acepto'), siguiente, 'ent-principal'));
      return {
        inicio: desde,
        tramos: [{ t0: 120, ms: 1100, ...bezier(desde.pos, [a.W * 0.9, a.H * 0.86], [a.W * 1.02, a.H * 0.32], a.compania), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 0.85] }],
        fin: 1220,
      };
    }

    // Menos de 18, según Salud: Moss no sigue (lo pediste el 22/10/2026).
    function armarMenor(p) {
      p.classList.add('ent-menor');
      p.append(el('h2', 'ent-titulo', tx('entrada.menor.titulo')), el('p', 'ent-texto', tx('entrada.menor.texto')));
    }

    // Embarazo, lactancia o una condición médica: sin déficit, y un profesional que acompañe. No se
    // guarda cuál: solo que Moss no pone en déficit.
    function armarCuidado(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuidado.titulo')));
      const aviso = el('p', 'ent-texto ent-aviso' + (r.caso !== 'nada' ? ' visible' : ''), tx('entrada.cuidado.aviso'));
      const casos = [
        ...(r.sexo === 'f' ? [['embarazo', tx('entrada.cuidado.embarazo')]] : []),
        ['condicion', tx('entrada.cuidado.condicion'), tx('entrada.cuidado.condicionTexto')],
        ['nada', tx('entrada.cuidado.nada')],
      ];
      opcionesDe(p, casos, r.caso, (v) => { r.caso = v; r.sinDeficit = v !== 'nada'; aviso.classList.toggle('visible', r.sinDeficit); });
      p.append(aviso, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    // La cuenta, solo con Apple. La estrella baja hasta la marca, pasa por encima mientras aparecen
    // las letras y queda arriba de la última, como un brillo.
    function armarCuenta(p, { a, desde }) {
      const m = a.marca;
      const PASA = 1000;
      const MS = 800;
      // Cada letra aparece cuando la estrella pasa por encima (sale rápido y frena: «llega»).
      const letras = [0.24, 0.44, 0.63, 0.81].map((s) => PASA + MS * (1 - Math.cbrt(1 - s)));
      const caja = el('div', 'ent-marca-caja');
      const marca = el('h1', 'ent-marca');
      'Moss'.split('').forEach((letra, i) => {
        const s = el('span', null, letra);
        s.style.animationDelay = `${(letras[i] / 1000).toFixed(2)}s`;
        marca.appendChild(s);
      });
      caja.append(marca, el('p', 'ent-lema', tx('entrada.cuenta.lema')));
      const apple = botonSeguir('', siguiente, 'ent-apple');
      apple.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.6zM14.1 5.5c.6-.8 1.1-1.9 1-3-1 0-2.2.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.2-.6 2.8-1.4z"/></svg>';
      apple.appendChild(el('span', null, tx('entrada.cuenta.apple')));
      const pie = el('div', 'ent-pie ent-pie-cuenta');
      pie.append(apple, el('p', 'ent-chico ent-legal', tx('entrada.cuenta.legal')));
      p.append(caja, pie);
      const antes = [m[0] - 84, m[1] + 8];
      return {
        inicio: desde,
        tramos: [
          { t0: 100, ms: PASA - 100, ...bezier(desde.pos, [a.W * 0.6, desde.pos[1] + 10], [m[0] - 150, m[1] - 70], antes), facil: 'suave', estela: true, escala: [desde.escala, 0.8], brillo: [desde.brillo, 1] },
          { t0: PASA, ms: MS, ...bezier(antes, [m[0] - 20, m[1] + 14], [m[0] + 50, m[1] + 4], a.chispa), facil: 'llega', estela: true, escala: [0.8, 0.7], brillo: [1, 0.95] },
        ],
        fin: PASA + MS,
      };
    }

    // En el cuestionario la estrella va en la punta de la barra y la estira al avanzar. Si llega de
    // afuera, baja al principio de la barra y la recorre hasta la pregunta de ahora.
    function guionDeBarra(a, desde, paso) {
      const k = avanceDe(paso);
      const punta = [mezclar(a.barra.x0, a.barra.x1, k), a.barra.y];
      if (desde.enBarra != null) {
        return {
          inicio: desde,
          tramos: [{ t0: 60, ms: 700, ...recta(desde.pos, punta), facil: 'llega', escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] }],
          barra: { k: [desde.enBarra, k], t0: 60, ms: 700, visible: [1, 1] },
          fin: 760,
        };
      }
      const comienzo = [a.barra.x0, a.barra.y];
      return {
        inicio: desde,
        tramos: [
          { t0: 80, ms: 900, ...bezier(desde.pos, [mezclar(desde.pos[0], comienzo[0], 0.3), desde.pos[1] + 80], [comienzo[0] + 70, comienzo[1] + 70], comienzo), facil: 'suave', estela: true, escala: [desde.escala, 0.5], brillo: [desde.brillo, 0.9] },
          { t0: 980, ms: 700, ...recta(comienzo, punta), facil: 'llega' },
        ],
        barra: { k: [0, k], t0: 980, ms: 700, visible: [0, 1], tv: 600 },
        fin: 1680,
      };
    }

    // Con Salud: los cuatro datos, los pasos (que sugieren cuánto te mueves) y, con tres noches, el sueño.
    function conectarSalud() {
      r.salud = true;
      desdeSalud = Object.assign({}, DE_SALUD);
      ['edad', 'sexo', 'altura', 'peso'].forEach((k) => { r[k] = DE_SALUD[k]; });
      r.movimiento = Cuestionario.movimientoPorPasos(DE_SALUD.pasos) || r.movimiento;
    }

    function armarSalud(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      const iconos = el('div', 'ent-salud');
      ['huellas', 'luna', 'loto', 'gota', 'balanza'].forEach((n, i) => {
        const c = el('span', 'ent-salud-icono');
        c.innerHTML = opciones.icono(n);
        c.style.animationDelay = `${0.2 + i * 0.16}s`;
        iconos.appendChild(c);
      });
      const conectar = botonSeguir(tx('entrada.cuestionario.conectar'), () => {
        conectarSalud();
        escena.haptico('toque');
        siguiente();
      }, 'ent-principal');
      const ahoraNo = botonSeguir(tx('entrada.cuestionario.ahoraNo'), siguiente, 'ent-secundario');
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.saludTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.saludTexto')), iconos, el('div', 'ent-pie', null));
      p.querySelector('.ent-pie').append(conectar, ahoraNo);
    }

    // Las pantallas de un número (edad, altura, peso) comparten forma.
    function pantallaNumero(p, paso, cfg) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx(cfg.titulo)));
      if (cfg.texto) p.appendChild(el('p', 'ent-texto', tx(cfg.texto)));
      const grande = el('div', 'ent-numero');
      const valor = el('b');
      grande.append(valor, el('span', null, cfg.unidad));
      if (desdeSalud[cfg.clave] != null) grande.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = cfg.min; rango.max = cfg.max; rango.step = cfg.paso;
      rango.value = r[cfg.clave];
      rango.setAttribute('aria-label', tx(cfg.titulo));
      const mostrar = () => { valor.textContent = numero(Number(rango.value), cfg.dec); };
      rango.addEventListener('input', () => { r[cfg.clave] = Number(rango.value); mostrar(); delete desdeSalud[cfg.clave]; const chip = grande.querySelector('em'); if (chip) chip.remove(); });
      mostrar();
      const regla = el('div', 'ent-regla');
      regla.append(el('span', null, numero(cfg.min, 0)), el('span', null, numero(cfg.max, 0)));
      p.append(grande, rango, regla, el('div', 'ent-pie'));
      p.querySelector('.ent-pie').appendChild(botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal'));
    }

    // Cada opción entra un poco después de la anterior; con ícono, a la izquierda (ICONOS_DE).
    function opcionesDe(p, lista, elegida, alElegir, clase, iconos) {
      const caja = el('div', 'ent-opciones ' + (clase || '') + (iconos ? ' con-icono' : ''));
      lista.forEach(([valor, titulo, detalle], k) => {
        const b = el('button', 'ent-opcion');
        b.type = 'button';
        b.dataset.valor = valor;
        b.style.animationDelay = `${(0.32 + k * 0.08).toFixed(2)}s`;
        b.setAttribute('aria-pressed', String(valor === elegida));
        if (iconos && iconos[valor]) {
          const i = el('i', 'ent-opcion-icono');
          i.innerHTML = iconoDe(iconos[valor]);
          b.appendChild(i);
        }
        const textos = el('div', 'ent-opcion-textos');
        textos.appendChild(el('b', null, titulo));
        if (detalle) textos.appendChild(el('span', null, detalle));
        b.appendChild(textos);
        b.addEventListener('click', () => {
          caja.querySelectorAll('.ent-opcion').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          escena.haptico('suave');
          alElegir(valor);
        });
        caja.appendChild(b);
      });
      p.appendChild(caja);
      return caja;
    }

    function armarSexo(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.sexoTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.sexoTexto')));
      const seguir = botonSeguir(tx('entrada.seguir'), siguiente, 'ent-principal');
      seguir.disabled = !r.sexo;
      opcionesDe(p, [['f', tx('entrada.cuestionario.femenino')], ['m', tx('entrada.cuestionario.masculino')]], r.sexo, (v) => { r.sexo = v; seguir.disabled = false; }, 'ent-dos');
      if (desdeSalud.sexo) p.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
      p.appendChild(el('div', 'ent-pie')).appendChild(seguir);
    }

    // ------------------------------------------------------------ las piezas del cuestionario nuevo
    const etiqueta = (texto) => el('span', 'ent-etiqueta', texto);
    const pie = (...botones) => { const n = el('div', 'ent-pie'); n.append(...botones); return n; };
    const seguirBoton = (texto) => botonSeguir(texto || tx('entrada.seguir'), siguiente, 'ent-principal');
    const kg = (x) => numero(x, Math.round(x * 10) % 10 ? 1 : 0);
    const hasta2 = (x) => x.toLocaleString(idioma === 'es' ? 'es-UY' : 'en-US', { maximumFractionDigits: 2 });
    // Una fecha del plan: corta y, a más de diez meses, con el año (si no, parecería de este).
    const lejos = (clave) => Fechas.diasEntre(Datos.HOY, clave) > 300;
    const fechaDelCamino = (clave) => u.fechaCorta(clave) + (lejos(clave) ? ` ${u.partes(clave).anio}` : '');
    // Bajando o subiendo, siempre hay un peso meta: el que se propone, si todavía no eligió.
    function asegurarMeta() {
      if (cambiaPeso() && r.pesoMeta == null) r.pesoMeta = Cuestionario.pesoMetaSugerido(r.peso, r.altura, r.objetivo) ?? r.peso;
    }

    // Lo que depende de lo elegido crece y se achica: nunca aparece ni desaparece de golpe.
    function plegar(contenido, abierto) {
      const caja = el('div', 'ent-plegable' + (abierto ? '' : ' cerrado'));
      const adentro = el('div');
      adentro.appendChild(contenido);
      caja.appendChild(adentro);
      caja.inert = !abierto;
      let espera = 0;
      return {
        el: caja,
        abrir(si) {
          if (si === !caja.classList.contains('cerrado')) return;
          caja.classList.add('moviendo');
          caja.classList.toggle('cerrado', !si);
          caja.inert = !si;
          clearTimeout(espera);
          espera = setTimeout(() => caja.classList.remove('moviendo'), 460);
        },
      };
    }

    // Un texto que cambia se apaga, cambia y se vuelve a prender (si cambia otra vez en el medio, queda el último).
    function cambiarTexto(n, texto) {
      n.dataset.texto = texto;
      if (n.dataset.cambiando || n.textContent === texto) return;
      if (reducido() || !n.isConnected) { n.textContent = texto; return; }
      n.dataset.cambiando = '1';
      n.classList.add('ent-cambia', 'saliendo');
      setTimeout(() => { n.textContent = n.dataset.texto; n.classList.remove('saliendo'); delete n.dataset.cambiando; }, 180);
    }

    // Un número de a pasos (la hora de a 15 minutos, la duración, la cinta, la fecha), con su menos y su más.
    function pasito(valor, cfg) {
      const caja = el('div', 'ent-pasito');
      const v = el('b');
      let x = valor;
      const mostrar = () => { v.textContent = cfg.formato(x); };
      const boton = (signo) => {
        const b = el('button');
        b.type = 'button';
        b.innerHTML = Util.icono(signo < 0 ? 'menos' : 'mas');
        b.setAttribute('aria-label', `${cfg.nombre}: ${tx(signo < 0 ? 'entrada.cuestionario.menos' : 'entrada.cuestionario.mas')}`);
        b.addEventListener('click', () => {
          const nuevo = Math.min(cfg.max, Math.max(cfg.min, Math.round((x + signo * cfg.paso) * 100) / 100));
          if (nuevo === x) return;
          x = nuevo;
          mostrar();
          escena.haptico('suave');
          cfg.alCambiar(x);
        });
        return b;
      };
      caja.append(boton(-1), v, boton(1));
      caja.poner = (nuevo) => { x = nuevo; mostrar(); };
      mostrar();
      return caja;
    }

    // Un deslizador chico, para cambiar un dato sin otra pantalla.
    function deslizador(clave, min, max, paso, alCambiar) {
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = min; rango.max = max; rango.step = paso;
      rango.value = r[clave];
      rango.setAttribute('aria-label', tx('entrada.cuestionario.' + clave));
      rango.addEventListener('input', () => { r[clave] = Number(rango.value); alCambiar(); });
      return rango;
    }

    // Con Salud: los cuatro datos juntos, para confirmar. Cada uno se abre para cambiarlo.
    function armarTu(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.tuTitulo')), el('p', 'ent-texto', tx('entrada.cuestionario.tuTexto')));
      const tarjeta = el('div', 'ent-tarjeta');
      const seguir = seguirBoton(tx('entrada.cuestionario.estaBien'));
      seguir.disabled = !r.sexo;
      const filas = [];
      const fila = (clave, valorDe, editor) => {
        const cab = el('button', 'ent-fila');
        cab.type = 'button';
        cab.dataset.valor = clave;
        cab.setAttribute('aria-expanded', 'false');
        const valor = el('b', null, valorDe());
        const chip = desdeSalud[clave] != null ? el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')) : el('em');
        const flecha = el('i');
        flecha.innerHTML = Util.icono('abajo');
        cab.append(el('span', null, tx('entrada.cuestionario.' + clave)), valor, chip, flecha);
        const cajaEditor = el('div', 'ent-editor');
        const pl = plegar(cajaEditor, false);
        cajaEditor.appendChild(editor(() => {
          valor.textContent = valorDe();
          // Lo cambiado a mano ya no es de Salud.
          delete desdeSalud[clave];
          chip.classList.add('apagado');
        }));
        cab.addEventListener('click', () => {
          const abrir = cab.getAttribute('aria-expanded') !== 'true';
          filas.forEach(([c, x]) => { c.setAttribute('aria-expanded', String(c === cab && abrir)); x.abrir(c === cab && abrir); });
        });
        filas.push([cab, pl]);
        tarjeta.append(cab, pl.el);
      };
      fila('sexo', () => (r.sexo ? tx(r.sexo === 'f' ? 'entrada.cuestionario.femenino' : 'entrada.cuestionario.masculino') : '—'), (cambio) => {
        const n = el('div');
        opcionesDe(n, [['f', tx('entrada.cuestionario.femenino')], ['m', tx('entrada.cuestionario.masculino')]], r.sexo, (v) => { r.sexo = v; seguir.disabled = false; cambio(); }, 'ent-segmento ent-par');
        return n;
      });
      fila('edad', () => `${numero(r.edad)} ${tx('entrada.cuestionario.anos')}`, (cambio) => deslizador('edad', Metas.EDAD_MINIMA, 90, 1, cambio));
      fila('altura', () => `${numero(r.altura)} cm`, (cambio) => deslizador('altura', 130, 220, 1, cambio));
      fila('peso', () => `${numero(r.peso, 1)} kg`, (cambio) => deslizador('peso', 35, 200, 0.1, cambio));
      p.append(tarjeta, pie(seguir));
    }

    // ¿Sabes tu grasa? No sé, lo sé, por imagen o con cinta; debajo, lo de cada uno. Nunca se muestra
    // como una medida exacta: lo dicho es una estimación, la figura un rango y la cinta también.
    function armarGrasa(p, { paso }) {
      p.classList.add('ent-denso');
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.grasa.titulo')), el('p', 'ent-texto', tx('entrada.cuestionario.grasa.texto')));
      const seguir = seguirBoton();
      const puede = () => { seguir.disabled = r.grasaModo === 'imagen' && r.figura == null; };
      const modos = ['no', 'dicha', 'imagen', 'cinta'];
      const paneles = {};
      opcionesDe(p, modos.map((m) => [m, tx('entrada.cuestionario.grasa.modos.' + m)]), r.grasaModo, (v) => {
        r.grasaModo = v;
        modos.forEach((m) => paneles[m].abrir(m === v));
        puede();
      }, 'ent-segmento ent-cuatro');
      const zona = el('div', 'ent-grasa-zona');
      paneles.no = plegar(el('p', 'ent-chico ent-izquierda', tx('entrada.cuestionario.grasa.sinGrasa')), r.grasaModo === 'no');
      paneles.dicha = plegar(panelGrasaDicha(), r.grasaModo === 'dicha');
      paneles.imagen = plegar(panelFiguras(puede), r.grasaModo === 'imagen');
      paneles.cinta = plegar(panelCinta(), r.grasaModo === 'cinta');
      modos.forEach((m) => zona.appendChild(paneles[m].el));
      p.append(zona, pie(seguir));
      puede();
    }

    function panelGrasaDicha() {
      const n = el('div');
      const grande = el('div', 'ent-numero ent-mediano');
      const valor = el('b');
      grande.append(valor, el('span', null, '%'));
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = sexo() === 'f' ? 10 : 4; rango.max = 50; rango.step = 0.5;
      rango.value = r.grasaPct;
      rango.setAttribute('aria-label', tx('entrada.cuestionario.grasa.titulo'));
      const mostrar = () => { valor.textContent = numero(r.grasaPct, r.grasaPct % 1 ? 1 : 0); };
      rango.addEventListener('input', () => { r.grasaPct = Number(rango.value); mostrar(); });
      mostrar();
      n.append(grande, rango, el('p', 'ent-chico ent-izquierda', tx('entrada.cuestionario.grasa.dichaTexto')));
      return n;
    }

    function panelFiguras(alElegir) {
      const n = el('div');
      n.appendChild(el('p', 'ent-chico ent-izquierda', tx('entrada.cuestionario.grasa.imagenTexto')));
      const grilla = el('div', 'ent-figuras');
      Cuestionario.FIGURAS[sexo()].forEach(([desde, hasta], k) => {
        const b = el('button', 'ent-figura');
        b.type = 'button';
        b.dataset.valor = String(k);
        b.style.animationDelay = `${(0.3 + k * 0.04).toFixed(2)}s`;
        b.setAttribute('aria-pressed', String(r.figura === k));
        b.innerHTML = figura(sexo(), k);
        const rango = tx('entrada.cuestionario.grasa.figura', { desde: numero(desde), hasta: numero(hasta) });
        b.appendChild(el('span', null, rango));
        b.setAttribute('aria-label', rango);
        b.addEventListener('click', () => {
          r.figura = k;
          grilla.querySelectorAll('.ent-figura').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
          escena.haptico('suave');
          alElegir();
        });
        grilla.appendChild(b);
      });
      n.appendChild(grilla);
      return n;
    }

    // Con cinta: el método de la Marina (Cuerpo.rangoDeGrasa), la cintura y el cuello, y la cadera en las mujeres.
    function panelCinta() {
      const n = el('div');
      const lista = el('div', 'ent-medidas');
      const resultado = el('p', 'ent-resultado-cinta');
      const pintar = () => {
        const x = Cuerpo.rangoDeGrasa(sexo(), r.altura, medidasDeCinta());
        cambiarTexto(resultado, x ? tx('entrada.cuestionario.grasa.rango', { desde: numero(x.desde), hasta: numero(x.hasta) }) : tx('entrada.cuestionario.grasa.revisa'));
      };
      (sexo() === 'f' ? ['cintura', 'cuello', 'cadera'] : ['cintura', 'cuello']).forEach((s) => {
        const fila = el('div', 'ent-medida');
        const textos = el('div');
        textos.appendChild(el('b', null, tx('entrada.cuestionario.grasa.' + s)));
        if (s === 'cintura') textos.appendChild(el('small', null, tx('entrada.cuestionario.grasa.cinturaTexto')));
        fila.append(textos, pasito(r.cinta[s], {
          nombre: tx('entrada.cuestionario.grasa.' + s), min: Cuerpo.RANGOS[s][0], max: Cuerpo.RANGOS[s][1], paso: 0.5,
          formato: (x) => `${numero(x, x % 1 ? 1 : 0)} cm`, alCambiar: (x) => { r.cinta[s] = x; pintar(); },
        }));
        lista.appendChild(fila);
      });
      n.append(lista, resultado);
      pintar();
      return n;
    }

    // Fuera del entrenamiento, ¿cuánto te mueves? Con Salud, los pasos lo sugieren.
    function armarMovimiento(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.movimiento.titulo')), el('p', 'ent-texto', tx('entrada.cuestionario.movimiento.texto')));
      opcionesDe(p, Cuestionario.MOVIMIENTOS.map((m) => [m, ...tx('entrada.cuestionario.movimiento.' + m)]), r.movimiento, (v) => { r.movimiento = v; }, '', ICONOS_DE.movimiento);
      if (desdeSalud.pasos) p.appendChild(el('span', 'ent-nota-salud', tx('entrada.cuestionario.movimiento.pasos', { n: numero(desdeSalud.pasos) })));
      p.appendChild(pie(seguirBoton()));
    }

    // ¿Entrenas? Qué deportes, con ejemplos que se reconocen: se elige más de uno (dos ya es mixto), y
    // «No entreno» saca los demás. El tipo de deporte va a cambiar los consejos, no solo los macros.
    function armarEntreno(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.entreno.titulo')), el('p', 'ent-texto', tx('entrada.cuestionario.entreno.texto')));
      const e = r.entreno;
      const caja = el('div', 'ent-opciones con-icono ent-varias');
      const pintar = () => caja.querySelectorAll('.ent-opcion').forEach((b) => {
        const v = b.dataset.valor;
        b.setAttribute('aria-pressed', String(v === 'no' ? !e.tipos.length : e.tipos.includes(v)));
      });
      [...Cuestionario.DEPORTES, 'no'].forEach((v, k) => {
        const [titulo, detalle] = tx('entrada.cuestionario.entreno.tipos.' + v);
        const b = el('button', 'ent-opcion');
        b.type = 'button';
        b.dataset.valor = v;
        b.style.animationDelay = `${(0.32 + k * 0.07).toFixed(2)}s`;
        const icono = el('i', 'ent-opcion-icono');
        icono.innerHTML = iconoDe(ICONOS_DE.entreno[v]);
        const textos = el('div', 'ent-opcion-textos');
        textos.appendChild(el('b', null, titulo));
        if (detalle) textos.appendChild(el('span', null, detalle));
        const marca = el('i', 'ent-opcion-marca');
        marca.innerHTML = Util.icono('listo');
        b.append(icono, textos, marca);
        b.addEventListener('click', () => {
          if (v === 'no') e.tipos = [];
          else e.tipos = e.tipos.includes(v) ? e.tipos.filter((x) => x !== v) : [...e.tipos, v];
          escena.haptico('suave');
          pintar();
        });
        caja.appendChild(b);
      });
      pintar();
      p.append(caja, pie(seguirBoton()));
    }

    // Los días de la semana como chips, de lunes a domingo: varios, o uno solo (el del partido). `poner`
    // los cambia desde afuera (el día del partido se suma a los días de ese deporte).
    function chipsDeDias(elegidos, alCambiar, uno) {
      const dias = el('div', 'ent-dias');
      let lista = [...elegidos];
      const iniciales = tx('entrada.cuestionario.entreno.iniciales');
      const pintar = () => dias.querySelectorAll('.ent-diasem').forEach((b) => b.setAttribute('aria-pressed', String(lista.includes(Number(b.dataset.valor)))));
      Fechas.SEMANA.forEach((d, k) => {
        const b = el('button', 'ent-diasem', iniciales[k]);
        b.type = 'button';
        b.dataset.valor = String(d);
        b.setAttribute('aria-label', tx('fecha.dias')[d]);
        b.addEventListener('click', () => {
          lista = uno ? [d] : lista.includes(d) ? lista.filter((x) => x !== d) : [...lista, d];
          pintar();
          escena.haptico('suave');
          alCambiar(lista);
        });
        dias.appendChild(b);
      });
      dias.poner = (nuevos) => { lista = [...nuevos]; pintar(); };
      pintar();
      return dias;
    }

    // «Lun, Mié y Vie»: los días cortos, de lunes a domingo.
    const listaDeDias = (dias) => new Intl.ListFormat(idioma === 'es' ? 'es' : 'en', { type: 'conjunction' })
      .format(Fechas.SEMANA.filter((d) => dias.includes(d)).map((d) => tx('fecha.diasCortos')[d]));

    // ¿Cuándo entrenas? Con un deporte, sus días, su hora y cuánto dura; con dos o más, lo de cada uno, y se
    // ve qué días tienen dos sesiones. Con partidos o choques, si juegas partidos o compites y qué día; con
    // combate, si compites por categoría de peso. Y cuánto tardas en llegar (lo de comer antes de entrenar
    // cuenta el viaje), con lo que todo eso suma a tu gasto: cada día, lo de ese día.
    function armarCuando(p, { paso }) {
      p.classList.add('ent-denso');
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.entreno.cuandoTitulo')));
      const e = r.entreno;
      const tipos = Cuestionario.DEPORTES.filter((t) => e.tipos.includes(t));
      const varios = tipos.length > 1;
      const preguntas = Cuestionario.preguntasDelEntreno(tipos);
      // El día del partido también es un día de ese deporte (el de partidos, o si no el de choques).
      const conPartidos = tipos.includes('equipo') ? 'equipo' : 'contacto';
      if (preguntas.partidos && e.partidos && !e.de[conPartidos].dias.includes(e.diaDePartido)) e.de[conPartidos].dias = [...e.de[conPartidos].dias, e.diaDePartido];
      const seguir = seguirBoton();
      // Si no entra todo (cuatro deportes con sus preguntas), se desliza; el botón queda abajo.
      const desliza = el('div', 'ent-desliza');
      const dobles = el('p', 'ent-suma');
      const plDobles = plegar(dobles, false);
      const suma = el('p', 'ent-suma');
      const chips = {};
      const pintar = () => {
        const dicho = entrenoDicho();
        seguir.disabled = tipos.some((t) => !e.de[t].dias.length);
        const dosSesiones = Cuestionario.diasConDosSesiones(dicho);
        if (dosSesiones.length) cambiarTexto(dobles, tx('entrada.cuestionario.entreno.dosSesiones', { dias: listaDeDias(dosSesiones) }));
        plDobles.abrir(dosSesiones.length > 0);
        cambiarTexto(suma, tx('entrada.cuestionario.entreno.suma', { n: numero(Math.round(Cuestionario.kcalDelEntreno(dicho, r.peso) / 10) * 10) }));
      };
      const columna = (titulo, nodo) => { const c = el('div'); c.append(etiqueta(titulo), nodo); return c; };
      tipos.forEach((t) => {
        const s = e.de[t];
        const bloque = el('div', 'ent-sesion');
        bloque.dataset.valor = t;
        if (varios) {
          const cab = el('div', 'ent-sesion-cab');
          cab.innerHTML = iconoDe(ICONOS_DE.entreno[t]);
          cab.appendChild(el('b', null, tx('entrada.cuestionario.entreno.tipos.' + t)[0]));
          bloque.appendChild(cab);
        } else bloque.appendChild(etiqueta(tx('entrada.cuestionario.entreno.dias')));
        chips[t] = chipsDeDias(s.dias, (dias) => { s.dias = dias; pintar(); });
        const horas = el('div', 'ent-dos-col');
        horas.append(
          columna(tx('entrada.cuestionario.entreno.hora'), pasito(s.hora, { nombre: tx('entrada.cuestionario.entreno.hora'), min: 5 * 60, max: 23 * 60, paso: 15, formato: u.horaMin, alCambiar: (x) => { s.hora = x; pintar(); } })),
          columna(tx('entrada.cuestionario.entreno.dura'), pasito(s.minutos, { nombre: tx('entrada.cuestionario.entreno.dura'), min: 15, max: 180, paso: 15, formato: (x) => tx('fecha.minutos', { m: x }), alCambiar: (x) => { s.minutos = x; pintar(); } })),
        );
        bloque.append(chips[t], horas);
        desliza.appendChild(bloque);
      });
      desliza.appendChild(plDobles.el);
      const siNo = tx('entrada.cuestionario.entreno.siNo');
      const pregunta = (clave, clase, si, alCambiar) => {
        const fila = el('div', 'ent-pregunta ' + clase);
        fila.appendChild(el('span', null, tx('entrada.cuestionario.entreno.' + clave)));
        opcionesDe(fila, [['no', siNo[0]], ['si', siNo[1]]], si ? 'si' : 'no', (v) => alCambiar(v === 'si'), 'ent-segmento ent-par ent-si-no');
        return fila;
      };
      if (preguntas.partidos) {
        // Al elegir el día del partido, se suma a los días de ese deporte, a la vista.
        const sumarElPartido = () => {
          const s = e.de[conPartidos];
          if (e.partidos && !s.dias.includes(e.diaDePartido)) { s.dias = [...s.dias, e.diaDePartido]; chips[conPartidos].poner(s.dias); }
          pintar();
        };
        const cualDia = el('div', 'ent-dia-partido');
        cualDia.append(etiqueta(tx('entrada.cuestionario.entreno.partidoDia')), chipsDeDias([e.diaDePartido], ([d]) => { e.diaDePartido = d; sumarElPartido(); }, true));
        const plDia = plegar(cualDia, e.partidos);
        desliza.append(pregunta('partidos', 'ent-partidos', e.partidos, (si) => { e.partidos = si; plDia.abrir(si); sumarElPartido(); }), plDia.el);
      }
      if (preguntas.categoriaDePeso) desliza.appendChild(pregunta('categoria', 'ent-categoria', e.categoriaDePeso, (si) => { e.categoriaDePeso = si; }));
      desliza.appendChild(etiqueta(tx('entrada.cuestionario.entreno.viaje')));
      opcionesDe(desliza, Cuestionario.VIAJES.map((min, k) => [String(min), tx('entrada.cuestionario.entreno.viajes')[k]]), String(e.viaje), (v) => { e.viaje = Number(v); }, 'ent-segmento ent-cuatro');
      desliza.appendChild(suma);
      p.append(desliza, pie(seguir));
      pintar();
    }

    // ¿Qué quieres lograr? Bajar, mantener, subir o recomponer (ganar músculo y perder grasa).
    function armarObjetivo(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.objetivoTitulo')));
      const sinLugar = !Cuestionario.rangoDelPesoMeta(r.peso, r.altura, 'bajar');
      // Sin déficit, ni bajar ni recomponer; sin lugar para bajar (el IMC de 18,5), tampoco bajar. Se dice por qué, corto.
      if ((r.sinDeficit && (r.objetivo === 'bajar' || r.objetivo === 'recomponer')) || (sinLugar && r.objetivo === 'bajar')) r.objetivo = 'mantener';
      const lista = [
        ['bajar', tx('entrada.cuestionario.bajar'), r.sinDeficit ? tx('entrada.cuidado.bajarNo') : sinLugar ? tx('entrada.cuestionario.bajarNoSano') : null],
        ['mantener', tx('entrada.cuestionario.mantener')],
        ['subir', tx('entrada.cuestionario.subir')],
        ['recomponer', tx('entrada.cuestionario.recomponer'), tx(r.sinDeficit ? 'entrada.cuestionario.recomponerNo' : 'entrada.cuestionario.recomponerTexto')],
      ];
      const caja = opcionesDe(p, lista, r.objetivo, elegirObjetivo, '', ICONOS_DE.objetivo);
      if (r.sinDeficit || sinLugar) caja.querySelector('[data-valor="bajar"]').disabled = true;
      if (r.sinDeficit) caja.querySelector('[data-valor="recomponer"]').disabled = true;
      p.appendChild(pie(seguirBoton()));
    }

    // Al cambiar lo que quiere lograr, el peso meta y el ritmo vuelven a lo que se propone.
    function elegirObjetivo(v) {
      const antes = r.objetivo;
      r.objetivo = v;
      if (cambiaPeso() && antes !== v) {
        r.pesoMeta = null;
        r.fecha = null;
        asegurarMeta();
      }
      r.ritmo = Cuestionario.ritmoSugerido(v, levantaPesas() ? r.experiencia : null);
    }

    // ¿Hace cuánto entrenas con pesas? Al subir, cambia el ritmo que se propone.
    function armarExperiencia(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.experiencia.titulo')), el('p', 'ent-texto', tx('entrada.cuestionario.experiencia.texto')));
      const avanzado = tx(r.objetivo === 'subir' ? 'entrada.cuestionario.experiencia.avanzadoSubir' : 'entrada.cuestionario.experiencia.avanzadoRecomponer');
      opcionesDe(p, [
        ['principiante', tx('entrada.cuestionario.experiencia.principiante')],
        ['intermedio', tx('entrada.cuestionario.experiencia.intermedio')],
        ['avanzado', tx('entrada.cuestionario.experiencia.avanzado'), avanzado],
      ], r.experiencia, (v) => {
        r.experiencia = v;
        if (!r.fecha) r.ritmo = Cuestionario.ritmoSugerido(r.objetivo, v);
      });
      p.appendChild(pie(seguirBoton()));
    }

    // ¿A qué peso quieres llegar? Y a qué ritmo: cada uno con su fecha, o una fecha con el ritmo que pide
    // (D35). Al mover el peso, las fechas se mueven con él.
    function armarMeta(p, { paso }) {
      p.classList.add('ent-denso');
      cabezaDeCuestionario(p, paso);
      const dir = r.objetivo;
      const [min, max] = Cuestionario.rangoDelPesoMeta(r.peso, r.altura, dir) || [r.peso, r.peso];
      if (r.pesoMeta == null || r.pesoMeta < min || r.pesoMeta > max) r.pesoMeta = Cuestionario.pesoMetaSugerido(r.peso, r.altura, dir) ?? min;
      p.appendChild(el('h2', 'ent-titulo', tx('entrada.cuestionario.meta.titulo')));
      const grande = el('div', 'ent-numero ent-mediano');
      const valor = el('b');
      grande.append(valor, el('span', null, 'kg'));
      const rango = el('input', 'ent-rango');
      rango.type = 'range';
      rango.min = min; rango.max = max; rango.step = 0.5;
      rango.value = r.pesoMeta;
      rango.setAttribute('aria-label', tx('entrada.cuestionario.meta.titulo'));
      const regla = el('div', 'ent-regla');
      regla.append(el('span', null, kg(min)), el('span', null, kg(max)));
      p.append(grande, rango, regla);
      if (dir === 'bajar') p.appendChild(el('p', 'ent-chico ent-izquierda', tx('entrada.cuestionario.meta.minimo', { kg: kg(min) })));
      p.appendChild(etiqueta(tx('entrada.cuestionario.meta.ritmo')));
      const lista = el('div', 'ent-ritmos');
      const sugerido = Cuestionario.ritmoSugerido(r.objetivo, levantaPesas() ? r.experiencia : null);
      const filas = {};
      ['suave', 'recomendado', 'rapido', 'fecha'].forEach((k, i) => {
        const b = el('button', 'ent-ritmo-fila');
        b.type = 'button';
        b.dataset.valor = k;
        b.style.animationDelay = `${(0.32 + i * 0.07).toFixed(2)}s`;
        const textos = el('div');
        const titulo = el('b', null, tx(k === 'fecha' ? 'entrada.cuestionario.meta.elegirFecha' : 'entrada.cuestionario.' + k));
        if (k === sugerido && k !== 'recomendado') titulo.appendChild(el('em', 'ent-sugerida', tx('entrada.cuestionario.meta.paraTi')));
        const detalle = el('span');
        textos.append(titulo, detalle);
        const fecha = el('em');
        b.append(textos, fecha);
        // Antes de los 18, bajar rápido no está (ritmoPermitido).
        const menor = dir === 'bajar' && k === 'rapido' && r.edad < Metas.MAYORIA_DE_EDAD;
        b.disabled = menor;
        b.addEventListener('click', () => elegir(k));
        filas[k] = { b, detalle, fecha, menor };
        lista.appendChild(b);
      });
      // La fecha elegida: una semana antes o después, con lo exigente que es y el ritmo que pide.
      const fechaCaja = el('div', 'ent-fecha-elegida');
      const viab = el('div', 'ent-viab');
      const chip = el('em');
      const porSemana = el('span');
      viab.append(chip, porSemana);
      // De una semana a dos años, de a una semana.
      const DIAS_MAXIMOS = 728;
      const pasoFecha = pasito(r.fecha ? Fechas.diasEntre(Datos.HOY, r.fecha) : 70, {
        nombre: tx('entrada.cuestionario.meta.elegirFecha'), min: 7, max: DIAS_MAXIMOS, paso: 7,
        formato: (d) => fechaDelCamino(Fechas.sumarDias(Datos.HOY, d)), alCambiar: (d) => { r.fecha = Fechas.sumarDias(Datos.HOY, d); refrescar(); },
      });
      fechaCaja.append(pasoFecha, viab);
      const plFecha = plegar(fechaCaja, !!r.fecha);
      p.append(lista, plFecha.el, pie(seguirBoton()));
      function elegir(k) {
        if (k === 'fecha') {
          // Arranca en la del ritmo elegido, dentro de lo que se puede elegir.
          if (!r.fecha) { const x = plazoDeRitmo(r.ritmo); r.fecha = Fechas.sumarDias(Datos.HOY, x ? Math.min(DIAS_MAXIMOS, Fechas.diasEntre(Datos.HOY, x.fecha)) : 70); }
        } else {
          r.ritmo = k;
          r.fecha = null;
        }
        plFecha.abrir(k === 'fecha');
        escena.haptico('suave');
        refrescar();
      }
      function refrescar() {
        ['suave', 'recomendado', 'rapido'].forEach((k) => {
          const f = filas[k];
          const x = plazoDeRitmo(k);
          f.detalle.textContent = f.menor ? tx('entrada.cuestionario.meta.desde18') : tx('entrada.cuestionario.meta.porSemana', { pct: hasta2(pctDe(k)) });
          f.fecha.textContent = x && !f.menor ? fechaDelCamino(x.fecha) : '';
        });
        filas.fecha.detalle.textContent = tx('entrada.cuestionario.meta.elegirFechaTexto');
        // Antes de los 18, una fecha que pide más que el ritmo recomendado pasa a la que llega a ese ritmo.
        const elegida = r.fecha ? plazoElegido() : null;
        if (elegida) r.fecha = elegida.fecha;
        filas.fecha.fecha.textContent = r.fecha ? fechaDelCamino(r.fecha) : '';
        if (elegida) {
          chip.className = elegida.viabilidad;
          chip.textContent = tx('entrada.cuestionario.meta.viabilidad.' + elegida.viabilidad);
          porSemana.textContent = tx('entrada.cuestionario.meta.porSemana', { pct: hasta2(elegida.pct) });
          pasoFecha.poner(Fechas.diasEntre(Datos.HOY, r.fecha));
        }
        Object.entries(filas).forEach(([j, f]) => f.b.setAttribute('aria-pressed', String(r.fecha ? j === 'fecha' : j === r.ritmo)));
      }
      const mostrar = () => { valor.textContent = numero(r.pesoMeta, 1); };
      rango.addEventListener('input', () => { r.pesoMeta = Number(rango.value); mostrar(); refrescar(); });
      mostrar();
      refrescar();
    }

    // Cuando llegues, ¿qué sigue? El plan en una línea: hoy, la meta con su fecha y lo que sigue después
    // de las semanas en mantenimiento (Progreso lo lee de perfil.despues).
    function armarDespues(p, { paso }) {
      cabezaDeCuestionario(p, paso);
      asegurarMeta();
      const plazo = plazoElegido();
      const semanas = Progreso.SEMANAS_DE_MANTENIMIENTO || 2;
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.despues.titulo', { kg: kg(r.pesoMeta) })), el('p', 'ent-texto', tx('entrada.cuestionario.despues.texto', { n: semanas })));
      const plan = el('div', 'ent-plan');
      const hilo = el('div', 'ent-plan-hilo');
      hilo.appendChild(el('i'));
      const nodo = (arriba, abajo) => { const d = el('div', 'ent-plan-nodo'); d.append(el('i'), el('b', null, arriba), el('span', null, abajo)); return d; };
      const llegada = plazo ? plazo.fecha : null;
      const ultimo = nodo(llegada ? fechaDelCamino(Fechas.sumarDias(llegada, semanas * 7)) : '—', tx('entrada.cuestionario.despues.elegido.' + r.despues));
      plan.append(hilo, nodo(tx('entrada.cuestionario.despues.hoy'), `${kg(r.peso)} kg`), nodo(llegada ? fechaDelCamino(llegada) : '—', `${kg(r.pesoMeta)} kg`), ultimo);
      p.appendChild(plan);
      const musculo = tx('entrada.cuestionario.despues.musculo');
      opcionesDe(p, [
        ['mantener', ...tx('entrada.cuestionario.despues.mantener')],
        ['musculo', musculo[0], r.objetivo === 'subir' ? tx('entrada.cuestionario.despues.musculoSubir') : musculo[1]],
        ['despues', ...tx('entrada.cuestionario.despues.despues')],
      ], r.despues, (v) => { r.despues = v; cambiarTexto(ultimo.querySelector('span'), tx('entrada.cuestionario.despues.elegido.' + v)); }, '', ICONOS_DE.despues);
      p.appendChild(pie(seguirBoton()));
    }

    // ¿Cómo quieres comer? El reparto (con su barra, para la meta de ahora), la proteína en gramos y lo que comes.
    function armarComer(p, { paso }) {
      p.classList.add('ent-denso');
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.comer.titulo')), etiqueta(tx('entrada.cuestionario.comer.reparto')));
      const estilos = opcionesDe(p, Metas.ESTILOS.map((e) => [e, tx('progreso.metas.estilos.' + e)[0]]), r.estilo, (v) => { r.estilo = v; }, 'ent-cuadro ent-estilos');
      const barras = {};
      estilos.querySelectorAll('.ent-opcion').forEach((b) => {
        const barra = el('div', 'ent-barra-macros');
        barras[b.dataset.valor] = ['p', 'c', 'g'].map((m) => barra.appendChild(el('s', 'ent-m-' + m)));
        b.querySelector('.ent-opcion-textos').appendChild(barra);
      });
      p.appendChild(etiqueta(tx('entrada.cuestionario.comer.proteina')));
      const niveles = opcionesDe(p, Cuestionario.NIVELES_DE_PROTEINA.map((n) => [n, tx('entrada.cuestionario.comer.niveles.' + n), ' ']), r.proteina, (v) => { r.proteina = v; pintar(); }, 'ent-segmento');
      p.appendChild(etiqueta(tx('entrada.cuestionario.comer.dieta')));
      opcionesDe(p, Plan.DIETAS.map((d) => [d, tx('comida.plan.dietas.' + d)]), r.dieta, (v) => { r.dieta = v; }, 'ent-chips');
      p.appendChild(pie(seguirBoton()));
      function pintar() {
        const kcal = metaDeAhora().metas.kcal;
        const proteina = Cuestionario.proteinaDelNivel(respuestas());
        Metas.ESTILOS.forEach((e) => {
          const m = Metas.macrosConProteina(kcal, r.peso, proteina, e);
          [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9].forEach((x, i) => { barras[e][i].style.flex = `${Math.max(0.001, x)} 0 0`; });
        });
        niveles.querySelectorAll('.ent-opcion').forEach((b) => {
          const g = Metas.macrosConProteina(kcal, r.peso, Cuestionario.proteinaDelNivel(Object.assign(respuestas(), { proteina: b.dataset.valor }))).proteina;
          b.querySelector('span').textContent = tx('entrada.cuestionario.comer.gramos', { n: numero(g) });
        });
      }
      pintar();
    }

    // ¿Cómo es tu día? De que te despiertas a que te acuestas, con las comidas y el entreno en el medio:
    // lo que usan los avisos (qué comer antes de entrenar, contando el viaje, y la hora de dormir). Con
    // tres noches en Salud, el sueño ya se sabe: se muestra y no se pregunta.
    function armarDia(p, { paso }) {
      p.classList.add('ent-denso');
      cabezaDeCuestionario(p, paso);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.dia.titulo')), el('p', 'ent-texto', tx('entrada.cuestionario.dia.texto')));
      const deSalud = suenoDeSalud();
      const e = entrenoDicho();
      const medio = Comidas.CON_HORA.map((c) => ({ tipo: 'comida', comida: c, min: r.horarios[c] }));
      if (e) e.sesiones.forEach((sesion) => medio.push({ tipo: 'entreno', sesion, min: sesion.hora }));
      medio.sort((x, y) => x.min - y.min);
      const lista = el('ul', 'ent-dia-lista');
      [{ tipo: 'despertar' }, ...medio, { tipo: 'acostarse' }].forEach((f, k) => {
        const deSueno = f.tipo === 'despertar' || f.tipo === 'acostarse';
        const li = el('li', 'ent-dia-fila ' + (deSueno ? 'sueno' : f.tipo));
        li.style.animationDelay = `${(0.3 + k * 0.05).toFixed(2)}s`;
        const valor = el('div', 'ent-dia-valor');
        let nombre;
        if (f.tipo === 'comida') {
          // Tocar la comida dice que no se suele hacer (y otra vez, que sí).
          nombre = el('button', 'ent-dia-nombre');
          nombre.type = 'button';
          nombre.dataset.valor = f.comida;
          nombre.appendChild(el('b', null, tx('comida.comidas.' + f.comida)));
          const pintarNo = () => { li.classList.toggle('no', !!r.noSuele[f.comida]); nombre.setAttribute('aria-pressed', String(!r.noSuele[f.comida])); };
          nombre.addEventListener('click', () => { r.noSuele[f.comida] = !r.noSuele[f.comida]; pintarNo(); escena.haptico('suave'); });
          valor.append(pasito(r.horarios[f.comida], { nombre: tx('comida.comidas.' + f.comida), min: 4 * 60, max: 24 * 60 - 15, paso: 15, formato: u.horaMin, alCambiar: (x) => { r.horarios[f.comida] = x; } }), el('span', 'ent-dia-no', tx('entrada.cuestionario.dia.noSuelo')));
          pintarNo();
        } else if (f.tipo === 'entreno') {
          // Cada deporte con sus días y la hora de salir (la del viaje), para lo de comer antes.
          const ses = f.sesion;
          const dias = listaDeDias(ses.dias);
          nombre = el('div', 'ent-dia-nombre');
          nombre.append(el('b', null, tx('entrada.cuestionario.entreno.tipos.' + ses.tipo)[0]), el('span', null, e.viaje ? tx('entrada.cuestionario.dia.sesion', { dias, hora: u.horaMin(ses.hora - e.viaje) }) : tx('entrada.cuestionario.dia.sesionEnCasa', { dias })));
          valor.appendChild(el('span', 'ent-dia-fijo', `${u.horaMin(ses.hora)}–${u.horaMin(ses.hora + ses.minutos)}`));
        } else {
          const despertar = f.tipo === 'despertar';
          nombre = el('div', 'ent-dia-nombre');
          nombre.appendChild(el('b', null, tx('entrada.cuestionario.dia.' + (despertar ? 'despertar' : deSalud ? 'dormirse' : 'acostarse'))));
          if (deSalud) {
            const fijo = el('span', 'ent-dia-fijo', u.horaMin(despertar ? deSalud.despertar : deSalud.dormirse));
            fijo.appendChild(el('em', 'ent-de-salud', tx('entrada.cuestionario.deSalud')));
            valor.appendChild(fijo);
          } else if (despertar) {
            valor.appendChild(pasito(r.sueno.despertar, { nombre: tx('entrada.cuestionario.dia.despertar'), min: 4 * 60, max: 12 * 60, paso: 15, formato: u.horaMin, alCambiar: (x) => { r.sueno.despertar = x; } }));
          } else {
            // Pasada la medianoche sigue siendo la noche de ese día: se cuenta desde la tarde y se guarda la hora del reloj.
            const noche = r.sueno.acostarse < 12 * 60 ? r.sueno.acostarse + 24 * 60 : r.sueno.acostarse;
            valor.appendChild(pasito(noche, { nombre: tx('entrada.cuestionario.dia.acostarse'), min: 20 * 60, max: 27 * 60, paso: 15, formato: u.horaMin, alCambiar: (x) => { r.sueno.acostarse = x % (24 * 60); } }));
          }
        }
        li.append(el('i', 'ent-dia-nodo'), nombre, valor);
        lista.appendChild(li);
      });
      // Con varias sesiones el día crece: si no entra, se desliza y el botón queda abajo.
      const desliza = el('div', 'ent-desliza');
      desliza.appendChild(lista);
      if (!deSalud) {
        desliza.appendChild(etiqueta(tx('entrada.cuestionario.dia.finDeSemana')));
        opcionesDe(desliza, ['igual', 'tarde'].map((k) => [k, tx('entrada.cuestionario.dia.finDeSemanaOpciones.' + k)]), r.sueno.finDeSemana, (v) => { r.sueno.finDeSemana = v; }, 'ent-segmento ent-par');
      }
      p.append(desliza, pie(seguirBoton()));
    }

    // El plan en una línea: «Bajar a 71 kg para el 4 de enero; después, mantener».
    function lineaDelPlan(x) {
      if (x.recomponer) return tx('entrada.cuestionario.plan.recomponer');
      if (x.objetivo === 'mantener') return tx('entrada.cuestionario.plan.mantener', { kg: kg(r.peso) });
      asegurarMeta();
      const plazo = plazoElegido();
      const f = plazo ? u.partes(plazo.fecha) : null;
      const fecha = f ? tx(lejos(plazo.fecha) ? 'entrada.cuestionario.fechaConAnio' : 'entrada.cuestionario.fecha', { num: f.num, mes: tx('fecha.meses')[f.mes], anio: f.anio }) : '';
      return tx('entrada.cuestionario.plan.' + x.objetivo, { kg: kg(r.pesoMeta), fecha }) + tx('entrada.cuestionario.plan.luego.' + r.despues);
    }

    // El resultado: la estrella deja la barra y queda arriba del título, el punto de partida, con el plan
    // en una línea y de dónde sale el gasto (en reposo, la vida diaria y el entrenamiento).
    function armarResultado(p, { a, desde }) {
      const meta = metaDeAhora();
      const m = meta.metas;
      const partes = Cuestionario.partesRedondas(meta.gasto);
      p.append(el('h2', 'ent-titulo', tx('entrada.cuestionario.resultadoTitulo')), el('p', 'ent-plan-linea', lineaDelPlan(meta)));
      const l = luna('ent-luna-grande');
      const kcalMacros = [m.proteina * 4, m.carbohidratos * 4, m.grasas * 9];
      const total = kcalMacros.reduce((x, y) => x + y, 0) || 1;
      l.repartir(kcalMacros.map((k) => k / total));
      const escenario = el('div', 'ent-escenario-luna');
      escenario.appendChild(l.svg);
      const cifra = el('div', 'ent-kcal');
      const n = el('b', null, '0');
      cifra.append(n, el('span', null, tx('entrada.cuestionario.kcal')));
      p.append(escenario, cifra);
      const leyenda = el('div', 'ent-macros');
      [['p', 'proteina', m.proteina], ['c', 'carbohidratos', m.carbohidratos], ['g', 'grasas', m.grasas]].forEach(([c, k, g]) => {
        const fila = el('div', 'ent-macro ent-macro-' + c);
        fila.append(el('i'), el('span', null, tx('entrada.cuestionario.' + k)), el('b', null, `${numero(g)} g`));
        leyenda.appendChild(fila);
      });
      const enPartes = tx(partes.entreno ? 'entrada.cuestionario.partes' : 'entrada.cuestionario.partesSinEntreno', { reposo: numero(partes.reposo), vida: numero(partes.vida), entreno: numero(partes.entreno) })
        + (meta.gasto.conGrasa ? ` · ${tx('entrada.cuestionario.masaMagra')}` : '');
      p.append(leyenda, el('p', 'ent-chico', tx('entrada.cuestionario.gasto', { n: numero(partes.total) })), el('p', 'ent-partes', enPartes), el('p', 'ent-texto', tx('entrada.cuestionario.resultadoTexto')));
      p.appendChild(el('div', 'ent-pie')).appendChild(botonSeguir(tx('entrada.seguir'), () => (opciones.antesDeTerminar ? opciones.antesDeTerminar(terminar) : terminar()), 'ent-principal'));
      l.llenar(1600, 200);
      // La cifra cuenta hasta la meta.
      const t0 = performance.now() + 200;
      const contar = (ahora) => {
        const u = Math.min(1, Math.max(0, (ahora - t0) / 1400));
        n.textContent = numero(Math.round(m.kcal * (1 - Math.pow(1 - u, 3))));
        if (u < 1 && n.isConnected) requestAnimationFrame(contar);
      };
      requestAnimationFrame(contar);
      const k = desde.enBarra ?? 1;
      return {
        inicio: desde,
        tramos: [{ t0: 150, ms: 900, ...recta(desde.pos, [a.W / 2, a.barra.y]), facil: 'suave', estela: true, escala: [desde.escala, 0.62], brillo: [desde.brillo, 1] }],
        barra: { k: [k, k], visible: [desde.enBarra != null ? 1 : 0, 0] },
        fin: 1050,
      };
    }

    // ------------------------------------------------------------ moverse
    // Lista para seguir: la estrella espera abajo; si pasa un rato sin que la toquen, una palabra
    // chica dice qué hacer.
    function listo() {
      guia.esperar(true);
      esperaPista = despues(2600, () => guia.pista.classList.add('visible'));
      if (opciones.avanceSolo()) temporizador = despues(900, tocarEstrella);
    }

    function tocarEstrella() {
      if (guia.boton.disabled) return;
      guia.encender();
      escena.haptico('toque');
      siguiente();
    }
    guia.boton.addEventListener('click', tocarEstrella);
    // Saltar lleva a lo que cuesta: el cuestionario es trabajo, y antes hay que saber que Moss es de pago.
    guia.saltar.addEventListener('click', () => {
      if (actual >= 0 && actual < SALTA_A) ir(SALTA_A);
    });

    // salto: se llegó desde los controles de la galería y no tocando; la estrella sale de donde
    // habría quedado la pantalla anterior.
    function ir(i, salto) {
      clearTimeout(temporizador);
      clearTimeout(esperaPista);
      cancelAnimationFrame(animando);
      const a = anclas();
      const desde = !salto && actual >= 0 && i > actual ? guia.vivo : reposo(i - 1, a);
      const vieja = raiz.querySelector('.ent-pantalla:not(.saliendo)');
      if (vieja) {
        vieja.classList.add('saliendo');
        setTimeout(() => vieja.remove(), 420);
      }
      actual = i;
      const paso = PASOS[i];
      escena.camara(paso.camara, i === 0);
      guia.esperar(false);
      guia.mostrarBoton(!!paso.tocar);
      guia.saltar.classList.toggle('visible', i < SALTA_A);
      // La pantalla nueva entra cuando la cámara ya empezó a subir.
      const p = pantalla('ent-' + paso.id + (paso.cuestionario ? ' ent-cuestionario' : '') + (paso.intro ? ' ent-intro' : ''));
      p.style.animationDelay = vieja ? '0.26s' : '0.12s';
      let g = paso.armar(p, { a, desde, paso });
      if (paso.cuestionario) g = guionDeBarra(a, desde, paso);
      if (paso.tocar) g.eventos = [...(g.eventos || []), [g.fin, listo]];
      guia.reproducir(g, a);
      opciones.alCambiar && opciones.alCambiar(paso.id);
    }

    // La que sigue entre las que aparecen con lo contestado (PASOS, `si`).
    function siguiente() {
      let i = actual + 1;
      while (i < PASOS.length - 1 && !aplica(PASOS[i])) i++;
      if (i < PASOS.length) ir(i);
    }

    function limpiar() {
      raiz.querySelectorAll('.ent-pantalla').forEach((n) => n.remove());
    }

    function empezar() {
      clearTimeout(temporizador);
      idioma = escena.idioma;
      limpiar();
      raiz.hidden = false;
      raiz.style.transform = ''; raiz.style.opacity = ''; raiz.style.filter = '';
      guia.pista.textContent = tx('entrada.tocaLaEstrella');
      guia.boton.setAttribute('aria-label', tx('entrada.seguir'));
      guia.saltar.textContent = tx('entrada.intro.saltar');
      escena.ponerModo('entrada');
      escena.aparecer();
      if (opciones.alEmpezar) opciones.alEmpezar();
      actual = -1;
      ir(0);
    }

    // Al terminar el cuestionario: la estrella sube y se va, y un «flum» lleva hasta Inicio
    // (opciones.llegada), la comida. Al llegar, opciones.alTerminar (en la app, los primeros hábitos).
    function terminar() {
      clearTimeout(temporizador);
      const v = guia.vivo;
      guia.reproducir({ inicio: v, tramos: [{ t0: 0, ms: 650, ...recta(v.pos, [v.pos[0], -60]), facil: 'sale', estela: true, brillo: [v.brillo, 0] }], fin: 650 }, anclas());
      escena.viajar({
        hasta: { zoom: 1, velo: 0 },
        sale: raiz,
        llega: opciones.llegada ? opciones.llegada() : tel.querySelector('.ui'),
        alCambiar: () => {
          escena.quitarDemo();
          escena.ponerModo('hoy');
          escena.camara(0, true);
          if (opciones.alSalir) opciones.alSalir();
        },
        alLlegar: () => {
          guia.apagar();
          limpiar();
          actual = -1;
          opciones.alCambiar && opciones.alCambiar(null);
          if (opciones.alTerminar) opciones.alTerminar();
        },
      });
    }

    function salir() {
      clearTimeout(temporizador);
      clearTimeout(esperaPista);
      guia.apagar();
      escena.quitarDemo();
      raiz.hidden = true;
      limpiar();
      actual = -1;
      escena.ponerModo('hoy');
      escena.camara(0, true);
      if (opciones.alSalir) opciones.alSalir();
    }

    // Para las capturas: contestar sin tocar (lo dado se mezcla con lo contestado), conectar Salud o
    // volver a lo de fábrica. Con «salud», como al tocar «Conectar con Salud».
    window.__cuestionario = (accion, arg) => {
      if (accion === 'responder') Object.assign(r, copia(arg));
      else if (accion === 'salud') conectarSalud();
      // El entreno se mezcla aparte: lo de cada deporte, de a uno.
      else if (accion === 'entreno') {
        const { de, ...resto } = copia(arg);
        Object.assign(r.entreno, resto);
        Object.keys(de || {}).forEach((t) => Object.assign(r.entreno.de[t], de[t]));
      }
      else if (accion === 'reiniciar') { Object.assign(r, copia(DE_FABRICA)); desdeSalud = {}; }
      return perfilDicho();
    };

    return {
      empezar,
      salir,
      irA(id) {
        const i = PASOS.findIndex((p) => p.id === id);
        if (i < 0) return;
        idioma = escena.idioma;
        if (actual < 0) empezar();
        ir(i, true);
      },
      // Para las capturas: Salud dice 16 años, o es su caso (sin déficit).
      menor() { r.edad = 15; desdeSalud.edad = 15; },
      caso(v) { r.caso = v; r.sinDeficit = v !== 'nada'; if (v === 'embarazo') r.sexo = 'f'; },
      get paso() { return actual >= 0 ? PASOS[actual].id : null; },
      // La meta de arranque, como la del resultado, y lo que quedaría en el perfil.
      metas: () => { const x = metaDeAhora(); return Object.assign({ gasto: Cuestionario.partesRedondas(x.gasto).total }, x.metas); },
      perfil: perfilDicho,
    };
  }

  return { crear };
})();
