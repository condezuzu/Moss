// Perfil, la última sección (antes Ajustes): arriba, la tarjeta de la persona (su foto o su inicial y su
// nombre, que abre Editar perfil, con la edad, la altura y la meta), cómo está la suscripción, las
// conexiones (Salud, los aparatos y, prendida, Ascent), tus datos, las preferencias, tus datos para
// llevar o borrar y de dónde salen los alimentos. Las metas pasaron a Progreso, con la estrategia.
// Es una maqueta: lo que hace cada fila ya está en la especificación.
// Aparatos (spec/aparatos.md) es una hoja: los que escriben tu sueño, de cuál sale la noche y qué
// llega de cada marca.

const SeccionPerfil = (() => {
  // Lo que anda solo con las dos apps vinculadas, con su ícono (antes en la sección de Ascent). Sin «El gimnasio
  // se enciende solo»: lo pediste sacar el 2/11 (el hábito del gimnasio se suma desde Hábitos, no desde Ascent).
  const CON_ASCENT = [['peso', 'balanza'], ['calorias', 'rayo'], ['objetivo', 'objetivo'], ['proteina', 'pesa']];
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
/* Conectar directo: cada marca con lo que suma y su botón; las que esperan aprobación, «Pronto». */
.pf-lista.pf-directo .pf-fila { grid-template-columns: 30px minmax(0, 1fr) auto; cursor: default; }
.pf-lista.pf-directo .pf-fila-textos b { display: block; font: 400 15px/1.2 var(--texto); color: var(--tinta); }
.pf-lista.pf-directo .pf-fila-textos span { display: block; font: 400 12px/1.3 var(--texto); color: rgba(239, 230, 207, 0.56); }
.pf-lista.pf-directo li.conectada .pf-fila-textos span { color: var(--salvia); }
.pf-conectar { appearance: none; cursor: pointer; padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(232, 196, 106, 0.45); background: rgba(232, 196, 106, 0.08); color: var(--oro-claro); font: 500 12.5px/1 var(--texto); white-space: nowrap; }
.pf-conectar.conectada { border-color: rgba(239, 230, 207, 0.16); background: none; color: rgba(239, 230, 207, 0.7); }
.pf-pronto { font: 500 10px/1 var(--texto); font-style: normal; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 9px; border-radius: 999px; color: rgba(239, 230, 207, 0.55); background: rgba(239, 230, 207, 0.06); }
.pf-nota.pf-nota-tenue { color: rgba(239, 230, 207, 0.45); font-size: 12px; }
.pf-lista.pf-tuyos .pf-fila-textos span { display: block; font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.58); }
.pf-lista.pf-tuyos .pf-fila-textos b { display: block; font: 400 15px/1.2 var(--texto); color: var(--tinta); }
/* En qué se basa Moss: el dibujo de lo que llega, lo que hace Moss y lo que ves; cada área se abre de a una. */
.pf-flujo { display: grid; grid-template-columns: minmax(0, 1fr) 14px minmax(0, 1fr) 14px minmax(0, 1fr); align-items: center; gap: 4px; margin: 10px 0 2px; }
.pf-flujo-col { display: grid; gap: 6px; align-content: center; }
.pf-flujo-etq { font: 400 9.5px/1 var(--texto); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(239, 230, 207, 0.5); text-align: center; }
.pf-flujo-item { display: block; padding: 7px 6px; border-radius: 10px; border: 1px solid rgba(239, 230, 207, 0.12); background: rgba(239, 230, 207, 0.04); font: 400 11.5px/1.25 var(--texto); color: var(--tinta); text-align: center; }
.pf-flujo-col:nth-child(3) .pf-flujo-item { border-color: rgba(232, 196, 106, 0.4); background: rgba(232, 196, 106, 0.07); }
.pf-flujo-flecha { display: grid; place-items: center; color: rgba(239, 230, 207, 0.4); }
.pf-flujo-flecha svg { width: 12px; height: 12px; }
.pf-base-reglas { margin: 10px 0 0; padding: 0 0 0 16px; display: grid; gap: 6px; font: 300 13px/1.42 var(--texto); color: rgba(239, 230, 207, 0.82); }
.pf-base-areas { display: grid; gap: 6px; margin-top: 8px; }
.pf-base-area { border-radius: 14px; border: 1px solid rgba(239, 230, 207, 0.1); background: rgba(8, 12, 26, 0.5); }
.pf-base-cab { appearance: none; cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px; border: 0; background: none; color: var(--tinta); font: 400 14.5px/1.25 var(--texto); text-align: left; }
.pf-base-cab svg { width: 16px; height: 16px; flex: none; transition: transform 0.3s; }
.pf-base-area.abierta .pf-base-cab svg { transform: rotate(180deg); }
.pf-base-dentro { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.34s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pf-base-area.abierta .pf-base-dentro { grid-template-rows: 1fr; }
.pf-base-dentro > div { min-height: 0; overflow: hidden; padding: 0 14px; }
.pf-base-area.abierta .pf-base-dentro > div { padding-bottom: 12px; }
.pf-base-dentro .pf-texto { margin-top: 0; }
.pf-base-fuentes { margin: 8px 0 0; font: 400 11.5px/1.4 var(--texto); color: rgba(239, 230, 207, 0.5); }
@media (prefers-reduced-motion: reduce) { .pf-base-dentro, .pf-base-cab svg { transition: none; } }
/* Según el deporte: el partido (qué día y a qué hora) y la próxima carrera (cuándo y cuánto dura). */
.pf-deporte-etq { margin: 12px 0 0; font: 400 12.5px/1.2 var(--texto); color: rgba(239, 230, 207, 0.62); }
.pf-hoja .pf-deporte-etq + .pf-dias, .pf-hoja .pf-deporte-etq + .pf-aviso-chips { margin-top: 8px; }
.pf-deporte-fila { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; }
.pf-deporte-fila > span { min-width: 0; font: 400 12.5px/1.25 var(--texto); color: rgba(239, 230, 207, 0.62); }
.pf-deporte-lado { flex: none; display: flex; align-items: center; gap: 6px; }
.pf-deporte-lado .fi-stepper { padding: 3px; }
.pf-deporte-lado .fi-paso { width: 32px; height: 32px; }
.pf-deporte-lado .fi-valor { min-width: 72px; font-size: 16px; }
.pf-hoja .pf-varia { padding: 7px 10px; }
.fi-stepper.pf-sin-valor .fi-valor { color: rgba(239, 230, 207, 0.45); }
/* Cuidados (5/11, para aprobar): arriba, cómo cambia tu dieta, con la meta en cuatro mosaicos y lo demás en
   chips; abajo, la lista en grupos. Lo que cambia se mueve en su lugar, y el consentimiento sube desde abajo. */
.pf-plegable { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 0.38s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.28s; }
.pf-plegable.abierto { grid-template-rows: 1fr; opacity: 1; }
.pf-plegable.quieto { transition: none; }
.pf-plegable > div { min-height: 0; overflow: hidden; }
.tel .pf-hoja .pf-cuidados { padding-bottom: 0; }
.pf-cuidados .pf-privado { display: flex; align-items: center; gap: 7px; margin: 2px 4px 10px; font: 400 12.5px/1.3 var(--texto); color: var(--salvia); }
.pf-cuidados .pf-privado svg { flex: none; width: 15px; height: 15px; }
.pf-cambia { margin: 2px 0 6px; padding: 14px 13px 13px; border-radius: 18px; border: 1px solid rgba(232, 196, 106, 0.22); background: linear-gradient(160deg, rgba(43, 53, 99, 0.6), rgba(17, 22, 47, 0.6)); }
.pf-cambia h4 { margin: 0 0 10px; font: 400 9.5px/1 var(--texto); letter-spacing: 0.18em; text-transform: uppercase; color: rgba(239, 230, 207, 0.62); }
.pf-cambia-macros { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.pf-cambia-macro { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; column-gap: 8px; row-gap: 5px; min-width: 0; padding: 9px 11px 10px; border-radius: 12px; border: 1px solid rgba(239, 230, 207, 0.08); background: rgba(6, 10, 22, 0.35); transition: border-color 0.3s, background 0.3s; }
.pf-cambia-macro span { grid-column: 1 / -1; font: 400 9px/1 var(--texto); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(239, 230, 207, 0.56); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pf-cambia-macro b { font: 400 18px/1.05 var(--numeros); font-variant-numeric: lining-nums tabular-nums; color: #fbf2d9; white-space: nowrap; transition: opacity 0.18s; }
.pf-cambia-macro small { text-align: right; font: 400 10.5px/1.05 var(--numeros); font-variant-numeric: tabular-nums; color: rgba(239, 230, 207, 0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: opacity 0.18s; }
.pf-cambia-macro.cambia { border-color: rgba(232, 196, 106, 0.55); background: rgba(232, 196, 106, 0.08); }
.pf-cambia-macro .pf-cambiando { opacity: 0; }
.pf-cambia-grupo > div > div { padding-top: 11px; }
.pf-cambia-grupo span.pf-cambia-etq { display: block; margin-bottom: 6px; font: 400 9px/1 var(--texto); letter-spacing: 0.14em; text-transform: uppercase; color: rgba(239, 230, 207, 0.5); }
.pf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.pf-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 6px 10px; border-radius: 999px; border: 1px solid rgba(239, 230, 207, 0.13); background: rgba(239, 230, 207, 0.04); font: 400 12.5px/1.2 var(--texto); color: var(--tinta); }
.pf-chip svg { flex: none; width: 12px; height: 12px; }
.pf-chip.entra { animation: hj-aparece 0.32s ease both; }
.pf-chip.saliendo { animation: pf-chip-sale 0.24s ease both; }
@keyframes pf-chip-sale { to { opacity: 0; transform: scale(0.92); } }
.pf-chip.meta { border-color: rgba(232, 196, 106, 0.42); color: var(--oro-claro); }
.pf-chip.muestra { border-color: rgba(169, 196, 245, 0.36); color: #c9d8f8; }
.pf-chip.apaga { color: rgba(239, 230, 207, 0.58); }
.pf-chip.apaga svg { color: rgba(239, 230, 207, 0.42); }
.pf-chip.prende { border-color: rgba(166, 191, 148, 0.48); color: #c6d9b6; }
.pf-chip.objetivo { border-color: rgba(239, 230, 207, 0.2); }
.pf-chip.objetivo.antes { color: rgba(239, 230, 207, 0.5); text-decoration: line-through; text-decoration-color: rgba(239, 230, 207, 0.3); }
.pf-cambia-ritmo { margin-top: 10px; align-items: center; }
.pf-cambia-ritmo > i { display: grid; color: rgba(239, 230, 207, 0.4); }
.pf-cambia-ritmo > i svg { width: 12px; height: 12px; }
.pf-banda { position: relative; height: 8px; margin: 9px 0 4px; border-radius: 4px; background: rgba(239, 230, 207, 0.08); }
.pf-banda i { position: absolute; top: 0; bottom: 0; border-radius: 4px; background: rgba(166, 191, 148, 0.55); transition: left 0.35s, width 0.35s; }
.pf-banda b { position: absolute; top: -3px; width: 14px; height: 14px; margin-left: -7px; border-radius: 50%; background: #fbf2d9; box-shadow: 0 0 8px rgba(251, 242, 217, 0.55); transition: left 0.35s; }
.pf-cambia-nota { margin: 10px 0 0; font: 400 12.5px/1.42 var(--texto); color: rgba(239, 230, 207, 0.74); }
.pf-cambia .pf-conectar { margin-top: 10px; }
.pf-cuidados-grupo { border-radius: 16px; border: 1px solid rgba(239, 230, 207, 0.08); background: rgba(8, 12, 26, 0.5); }
.pf-cuidado + .pf-cuidado { border-top: 1px solid rgba(239, 230, 207, 0.07); }
.pf-cuidado-fila { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 11px 12px 11px 14px; }
.pf-cuidado-fila b { display: block; font: 400 15px/1.25 var(--texto); color: var(--tinta); }
.pf-cuidado-fila small { display: block; margin-top: 2px; font: 400 11.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.5); }
.pf-cuidado-dentro { display: grid; gap: 10px; padding: 0 14px 13px; }
.pf-cuidado-dentro .pf-nota { margin: 0; font-size: 12.5px; line-height: 1.42; }
.pf-cuidado-dentro > span { font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.68); }
.pf-pregunta { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.pf-pregunta > span { min-width: 0; font: 400 12.5px/1.3 var(--texto); color: rgba(239, 230, 207, 0.68); }
.pf-pregunta-lado { flex: none; display: flex; align-items: center; gap: 6px; }
.pf-pregunta-lado .fi-stepper { padding: 3px; }
.pf-pregunta-lado .fi-paso { width: 30px; height: 30px; }
.pf-pregunta-lado .fi-valor { min-width: 84px; font-size: 14.5px; }
.pf-cuidado-dentro .fi-porciones { gap: 6px; }
.pf-cuidado-dentro .fi-porcion { padding: 7px 11px; }
.pf-cuidados-alergias { margin: 14px 4px 18px; }
.pf-consentir-caja { position: sticky; bottom: 0; z-index: 2; }
.pf-consentir { margin-top: 10px; padding: 14px 14px calc(var(--abajo) + 8px); border-radius: 18px 18px 0 0; border: 1px solid rgba(166, 191, 148, 0.4); border-bottom: 0; background: linear-gradient(180deg, #141d3b, #0b1128); }
.pf-consentir p { display: flex; gap: 9px; margin: 0 0 11px; font: 400 13.5px/1.42 var(--texto); color: var(--tinta); }
.pf-consentir p svg { flex: none; width: 16px; height: 16px; margin-top: 2px; color: var(--salvia); }
.pf-consentir-botones { display: flex; gap: 8px; }
.pf-consentir-botones button { appearance: none; cursor: pointer; flex: 1; min-height: 42px; border-radius: 999px; font: 500 14px/1 var(--texto); }
.pf-consentir-si { border: 0; background: var(--oro); color: #1a1406; }
.pf-consentir-no { border: 1px solid rgba(239, 230, 207, 0.2); background: none; color: rgba(239, 230, 207, 0.8); }
@media (prefers-reduced-motion: reduce) {
  .pf-plegable, .pf-cambia-macro, .pf-cambia-macro b, .pf-cambia-macro small, .pf-banda i, .pf-banda b { transition: none; }
  .pf-chip.entra, .pf-chip.saliendo { animation: none; }
}
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
    const s = { conectadas: new Set(), abierta: null, fuente: 'auto', sinDeficit: false, numeros: true, buscar: false, sistema: 'metrico', calidad: null, corte: Fechas.CORTE_DE_FABRICA, creditos: false, sinSalud: false, opciones: null, avisos: { dormir: false, antes: 30, comidas: [], maximo: 6, horario: {}, pesarse: false, todos: false, latencia: null, necesidad: null } };

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
      // Conectar directo (2/11/2026, para aprobar): lo que no llega a Salud, desde la app de la marca.
      // Polar primero, porque no pide aprobación; Oura, WHOOP y Garmin, cuando aprueben (spec/aparatos.md).
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.aparatos.directo.titulo')));
      cuerpo.appendChild(el('p', 'pf-nota pf-directo-texto', tx('perfil.aparatos.directo.texto')));
      const directo = el('ul', 'pf-lista pf-filas pf-directo');
      [['polar', true], ['oura', false], ['whoop', false], ['garmin', false]].forEach(([m, abierta]) => {
        const conectada = s.conectadas.has(m);
        const li = el('li', conectada ? 'conectada' : null);
        const fila = el('div', 'pf-fila');
        const txt = el('span', 'pf-fila-textos');
        txt.append(el('b', null, tx(`perfil.aparatos.directo.marcas.${m}.nombre`)),
          el('span', null, conectada ? tx('perfil.aparatos.directo.conectado', { hora: '7:12' }) : tx(`perfil.aparatos.directo.marcas.${m}.suma`)));
        const accion = !abierta ? el('em', 'pf-pronto', tx('perfil.aparatos.directo.pronto'))
          : boton('pf-conectar' + (conectada ? ' conectada' : ''), tx(conectada ? 'perfil.aparatos.directo.desconectar' : 'perfil.aparatos.directo.conectar'), () => {
            if (conectada) s.conectadas.delete(m); else s.conectadas.add(m);
            pintarAparatos();
          });
        fila.append(cuadro('reloj3', conectada ? 'salvia' : 'azul'), txt, accion);
        li.appendChild(fila);
        directo.appendChild(li);
      });
      cuerpo.appendChild(directo);
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.aparatos.directo.soloSalud')));
      cuerpo.appendChild(el('p', 'pf-nota pf-nota-tenue', tx('perfil.aparatos.directo.nota')));
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
    // como en la app (Perfil.tsx). Los de cada hábito se eligen en el hábito. El 3/11, para aprobar, lo que
    // conviene hacer (como Rise), cada uno con su llave: todavía no está en la app.
    function pintarAvisos() {
      const h = hoja.el;
      const arriba = h.querySelector('.pf-avisos') ? h.querySelector('.pf-avisos').scrollTop : 0;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.avisos.titulo')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos');
      const a = s.avisos;
      // Los íconos que solo usan estas llaves: una taza y una lamparita.
      const DIBUJOS = {
        taza: '<path d="M5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3"/>',
        foco: '<path d="M9.5 17.5h5M10.5 20.5h3"/><path d="M12 3.5a5.5 5.5 0 0 0-3.3 9.9c.6.5.8 1.1.8 1.8v.3h5v-.3c0-.7.2-1.3.8-1.8A5.5 5.5 0 0 0 12 3.5z"/>',
      };
      const cuadroDe = (ico, color) => {
        const c = cuadro(DIBUJOS[ico] ? 'reloj' : ico, color);
        if (DIBUJOS[ico]) c.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${DIBUJOS[ico]}</svg>`;
        return c;
      };
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
        nombre.append(cuadroDe(ico, color), el('b', null, titulo));
        fila.append(nombre, llave);
        caja.append(fila, el('p', 'pf-nota', texto));
        if (encendido && debajo) caja.appendChild(debajo);
        cuerpo.appendChild(caja);
      };
      const latencia = a.latencia === null ? 20 : a.latencia;
      const edad = Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento;
      const nec = Sueno.necesidad(edad, a.necesidad);
      bloque('sueno', 'azul', tx('perfil.avisos.dormir'), tx('perfil.avisos.dormirTexto', { hora: u.horaMin(7 * 60 + 30 - nec - Sueno.DESPIERTO_SIN_RELOJ - latencia), despertar: '07:30', horas: u.duracion(nec), latencia }), a.dormir, (v) => { a.dormir = v; },
        chips([15, 30, 45, 60], (n) => tx('perfil.avisos.antes', { n }), (n) => a.antes === n, (n) => { a.antes = n; }));
      // Tardo en dormirme (D33): lo que aprende Moss de tus respuestas, o un número fijo, como en la app.
      const tardo = el('section', 'pf-aviso');
      const tardoFila = el('div', 'pf-aviso-fila');
      const tardoNombre = el('span', 'pf-aviso-titulo');
      tardoNombre.append(cuadro('reloj', 'violeta'), el('b', null, tx('perfil.avisos.tardo')));
      tardoFila.appendChild(tardoNombre);
      tardo.append(tardoFila, chips([null, ...SinReloj.LATENCIAS], (n) => (n === null ? tx('perfil.avisos.tardoAprendido', { n: 20 }) : tx('perfil.avisos.minutos', { n })), (n) => a.latencia === n, (n) => { a.latencia = n; }), el('p', 'pf-nota', tx('perfil.avisos.tardoTexto')));
      cuerpo.appendChild(tardo);
      // Necesito dormir (5/11, para aprobar): lo de tu edad o lo que elijas, de media hora en media hora y dentro de
      // lo de tu edad (Sueno.necesidadesPara). Lo usan la hora de dormir, la deuda, la calidad y esta noche.
      const necesito = el('section', 'pf-aviso');
      const necesitoFila = el('div', 'pf-aviso-fila');
      const necesitoNombre = el('span', 'pf-aviso-titulo');
      necesitoNombre.append(cuadro('sueno', 'azul'), el('b', null, tx('perfil.avisos.necesito')));
      necesitoFila.appendChild(necesitoNombre);
      necesito.append(necesitoFila, chips([null, ...Sueno.necesidadesPara(edad)], (m) => (m === null ? tx('perfil.avisos.necesitoEdad', { h: u.duracion(Sueno.necesidad(edad)) }) : u.duracion(m)), (m) => a.necesidad === m, (m) => { a.necesidad = m; opciones.alCambiarNecesidad && opciones.alCambiarNecesidad(); }), el('p', 'pf-nota', tx(edad < 18 ? 'perfil.avisos.necesitoTextoMenor' : 'perfil.avisos.necesitoTexto')));
      cuerpo.appendChild(necesito);
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
      // Lo que conviene hacer (src/dominio/loQueConviene.ts), apagado de fábrica como lo demás. La recuperación,
      // solo con Ascent vinculada y sin nombrarla.
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.avisos.conviene')));
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.avisos.convieneTexto')));
      // Según el deporte (para aprobar): la víspera del partido, con partidos o choques, y la carrera larga, con
      // correr, bici o nadar (segunElDeporte.ts).
      const tipos = opciones.comida.entreno.tipos || [];
      const conviene = [
        ['antesDeEntrenar', 'pesa', 'oro'], ['despuesDeEntrenar', 'pesa', 'salvia'], ['cafe', 'taza', 'rosa'],
        ['ultimaComida', 'comida', 'violeta'], ['entrenarTarde', 'cronometro', 'azul'], ['luces', 'foco', 'gris'],
        ...(tipos.includes('equipo') || tipos.includes('contacto') ? [['partido', 'rayo', 'oro']] : []),
        ...(tipos.includes('resistencia') ? [['carrera', 'objetivo', 'salvia']] : []),
        ...(conAscent() && opciones.vinculada && opciones.vinculada() ? [['recuperacion', 'onda', 'ascent']] : []),
      ];
      for (const [que, ico, color] of conviene) bloque(ico, color, tx('perfil.avisos.' + que), tx(`perfil.avisos.${que}Texto`), !!a[que], (v) => { a[que] = v; });
      cuerpo.appendChild(el('h4', 'pf-grupo', tx('perfil.avisos.maximo')));
      cuerpo.appendChild(chips([2, 3, 4, 6, 8], String, (n) => a.maximo === n, (n) => { a.maximo = n; }));
      // Con lo que conviene cambia quién queda primero (avisos.ts, CATEGORIA).
      cuerpo.appendChild(el('p', 'pf-nota', tx('perfil.avisos.maximoTextoConviene')));
      h.append(cab, cuerpo);
      cuerpo.scrollTop = arriba;
    }
    // Cuándo entrenás (lo pediste el 26/10): con esto, Comida dice qué comer antes y después, en la
    // comida que toca. Como en la app (Perfil.tsx, CuandoEntrenas). El 3/11, para aprobar, lo que tardás
    // en llegar al gimnasio: los avisos de antes de entrenar cuentan desde que salís.
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
      // El camino al gimnasio, un ícono que solo usa esta pregunta.
      const CAMINO = '<path d="M12 20.5s-6-5.4-6-10a6 6 0 0 1 12 0c0 4.6-6 10-6 10z"/><circle cx="12" cy="10.5" r="2.2"/>';
      const pregunta = (ico, color, titulo, debajo) => {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        const nombre = el('span', 'pf-aviso-titulo');
        const c = cuadro(ico === 'camino' ? 'reloj' : ico, color);
        if (ico === 'camino') c.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${CAMINO}</svg>`;
        nombre.append(c, el('b', null, titulo));
        fila.appendChild(nombre);
        caja.append(fila, debajo);
        cuerpo.appendChild(caja);
      };
      cuerpo.appendChild(el('p', 'pf-nota', tx('entreno.perfil.textoConAvisos')));
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
      // Los mismos deportes que el cuestionario, varios a la vez; el horario de los avisos lleva el tipo reducido.
      const tipos = e.tipos ?? (e.tipo === 'resistencia' ? ['resistencia'] : e.tipo === 'mixta' ? ['equipo'] : ['fuerza']);
      const conTipos = el('div');
      conTipos.append(
        chips(Cuestionario.DEPORTES, (x) => tx('entrada.cuestionario.entreno.tipos.' + x)[0], (x) => tipos.includes(x), (x) => {
          const nuevos = tipos.includes(x) ? tipos.filter((t) => t !== x) : Cuestionario.DEPORTES.filter((t) => t === x || tipos.includes(t));
          if (nuevos.length) poner({ tipos: nuevos, tipo: Cuestionario.tipoDeSesion(nuevos) });
        }),
        el('p', 'pf-nota', tx('entrada.cuestionario.entreno.texto')),
      );
      pregunta('huellas', 'salvia', tx('entreno.perfil.tipo'), conTipos);
      // Según el deporte (para aprobar, segunElDeporte.ts): con partidos o choques, qué día juegas y a qué hora
      // empieza (opcional: con la hora se sabe si terminas tarde); con correr, bici o nadar, la próxima carrera,
      // con la fecha y cuánto dura (lo de los dos días antes, solo si pasa de hora y media).
      const conLlave = (ico, color, titulo, prendida, alCambiar) => {
        const caja = el('section', 'pf-aviso');
        const fila = el('div', 'pf-aviso-fila');
        const llave = boton('in-llave', '<i></i>', () => alCambiar(!prendida), titulo);
        llave.setAttribute('aria-pressed', String(prendida));
        const nombre = el('span', 'pf-aviso-titulo');
        nombre.append(cuadro(ico, color), el('b', null, titulo));
        fila.append(nombre, llave);
        caja.appendChild(fila);
        cuerpo.appendChild(caja);
        return caja;
      };
      const filaCon = (etiqueta, ...nodos) => {
        const f = el('div', 'pf-deporte-fila');
        f.appendChild(el('span', null, etiqueta));
        const lado = el('div', 'pf-deporte-lado');
        lado.append(...nodos);
        f.appendChild(lado);
        return f;
      };
      const conPasos = (valor, alMover, nombre) => {
        const p = el('div', 'fi-stepper' + (valor == null ? ' pf-sin-valor' : ''));
        p.append(boton('fi-paso', icono('menos'), () => alMover(-1), `${nombre} −`), el('b', 'fi-valor', valor == null ? '—:—' : valor), boton('fi-paso', icono('mas'), () => alMover(1), `${nombre} +`));
        return p;
      };
      if (tipos.includes('equipo') || tipos.includes('contacto')) {
        const p = e.partido || null;
        const caja = conLlave('rayo', 'oro', tx('entreno.perfil.partidos'), !!p, (si) => poner({ partido: si ? { dia: 6, hora: null } : null }));
        if (p) {
          const moverHora = (signo) => poner({ partido: { ...p, hora: p.hora == null ? 16 * 60 : Math.min(23 * 60, Math.max(8 * 60, p.hora + signo * 15)) } });
          const varia = boton('fi-porcion pf-varia', `<span>${tx('entreno.perfil.partidoVaria')}</span>`, () => poner({ partido: { ...p, hora: null } }));
          varia.setAttribute('aria-pressed', String(p.hora == null));
          caja.append(
            el('p', 'pf-deporte-etq', tx('entreno.perfil.partidoDia')),
            chips(DIAS, (d) => tx('fecha.diasCortos.' + d), (d) => p.dia === d, (d) => poner({ partido: { ...p, dia: d } }), 'pf-dias'),
            filaCon(tx('entreno.perfil.partidoHora'), varia, conPasos(p.hora == null ? null : reloj(p.hora), moverHora, tx('entreno.perfil.partidoHora'))),
            el('p', 'pf-nota', tx('entreno.perfil.partidoTexto')),
          );
        }
      }
      if (tipos.includes('resistencia')) {
        const c = e.carrera || null;
        const caja = conLlave('objetivo', 'salvia', tx('entreno.perfil.carrera'), !!c, (si) => poner({ carrera: si ? { fecha: Fechas.sumarDias(Datos.HOY, 11), minutos: 120 } : null }));
        if (c) {
          const cuando = `${tx('fecha.diasCortos.' + Fechas.diaDeLaSemana(c.fecha))} ${u.fechaCorta(c.fecha)}`;
          const moverFecha = (signo) => {
            const fecha = Fechas.sumarDias(c.fecha, signo);
            if (fecha > Datos.HOY) poner({ carrera: { ...c, fecha } });
          };
          caja.append(
            filaCon(tx('entreno.perfil.carreraFecha'), conPasos(cuando, moverFecha, tx('entreno.perfil.carreraFecha'))),
            el('p', 'pf-deporte-etq', tx('entreno.perfil.duracion')),
            chips([60, 90, 120, 180, 240], (n) => u.duracion(n), (n) => c.minutos === n, (n) => poner({ carrera: { ...c, minutos: n } })),
            el('p', 'pf-nota', tx(c.minutos > SegunElDeporte.CARRERA_LARGA ? 'entreno.perfil.carreraTexto' : 'entreno.perfil.carreraCorta')),
          );
        }
      }
      const viaje = e.viaje ?? LoQueConviene.VIAJE_DE_FABRICA;
      const conViaje = el('div');
      conViaje.append(
        chips(LoQueConviene.VIAJES, (n) => (n ? tx('entreno.perfil.minutos', { n }) : tx('entreno.perfil.viajeCasa')), (n) => viaje === n, (n) => poner({ viaje: n })),
        el('p', 'pf-nota', tx('entreno.perfil.viajeTexto')),
      );
      pregunta('camino', 'gris', tx('entreno.perfil.viaje'), conViaje);
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
    const nombreDelCorte = (c) => (c === 0 ? tx('perfil.corteMedianoche') : u.plural('perfil.corteALaHora', Math.floor(c / 60), { hora: horaDelCorte(c) }));
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
      } else if (cual === 'base') {
        pintarBase(cuerpo);
      } else {
        tx('perfil.privacidadTexto').forEach((p, i) => cuerpo.appendChild(el('p', 'pf-texto', conAscent() && i === 0 ? `${p} ${tx('perfil.privacidadConAscent')}` : p)));
      }
      h.append(cab, cuerpo);
    }

    // En qué se basa Moss (5/11, para aprobar): cómo se ordena lo que llega (un dibujo: lo que llega, lo que hace
    // Moss y lo que ves, y sus reglas), cada área con su porqué y sus fuentes (salen del estudio de la evidencia;
    // se abren de a una) y lo que Moss no hace. Ascent, solo si la vinculación está prendida.
    const AREAS_DE_LA_BASE = ['metas', 'progreso', 'sueno', 'momentos', 'ascent', 'cuidados', 'fotos'];
    function pintarBase(cuerpo) {
      const b = (k) => tx('perfil.baseInfo.' + k);
      cuerpo.append(el('p', 'pf-texto', b('intro')), el('h4', 'pf-grupo', b('comoTitulo')));
      const flujo = el('div', 'pf-flujo');
      const columna = (clave, items) => {
        const c = el('div', 'pf-flujo-col');
        c.appendChild(el('span', 'pf-flujo-etq', b('columnas.' + clave)));
        items.forEach((t) => c.appendChild(el('b', 'pf-flujo-item', t)));
        return c;
      };
      const flecha = () => { const f = el('i', 'pf-flujo-flecha'); f.innerHTML = icono('adelante'); return f; };
      flujo.append(columna('llega', [...b('llega'), ...(conAscent() ? [b('llegaAscent')] : [])]), flecha(), columna('hace', b('hace')), flecha(), columna('ves', b('ves')));
      const reglas = el('ul', 'pf-base-reglas');
      b('reglas').forEach((t) => reglas.appendChild(el('li', null, t)));
      cuerpo.append(flujo, reglas, el('h4', 'pf-grupo', b('areasTitulo')));
      const areas = el('div', 'pf-base-areas');
      const existe = (k) => tx(`perfil.baseInfo.areas.${k}.titulo`) !== `perfil.baseInfo.areas.${k}.titulo`;
      AREAS_DE_LA_BASE.filter((k) => existe(k) && (k !== 'ascent' || conAscent())).forEach((k) => {
        const a = (x) => tx(`perfil.baseInfo.areas.${k}.${x}`);
        const item = el('div', 'pf-base-area' + (s.baseAbierta === k ? ' abierta' : ''));
        const cab = boton('pf-base-cab', `<span>${a('titulo')}</span>${icono('abajo')}`, () => {
          s.baseAbierta = s.baseAbierta === k ? null : k;
          areas.querySelectorAll('.pf-base-area').forEach((x) => {
            const abierta = x === item && s.baseAbierta === k;
            x.classList.toggle('abierta', abierta);
            x.querySelector('.pf-base-cab').setAttribute('aria-expanded', String(abierta));
          });
        });
        cab.setAttribute('aria-expanded', String(s.baseAbierta === k));
        const dentro = el('div', 'pf-base-dentro');
        const caja = el('div');
        caja.append(el('p', 'pf-texto', a('texto')), el('p', 'pf-base-fuentes', `${b('fuentes')}: ${a('fuentes')}`));
        dentro.appendChild(caja);
        item.append(cab, dentro);
        areas.appendChild(item);
      });
      const no = el('ul', 'pf-base-reglas');
      b('noHace').forEach((t) => no.appendChild(el('li', null, t)));
      cuerpo.append(areas, el('h4', 'pf-grupo', b('noHaceTitulo')), no);
    }
    function abrirOpciones(cual) {
      s.opciones = cual;
      pintarOpciones();
      hoja.abrir();
      opciones.alCambiar();
    }

    // ------------------------------------------------------------ Cuidados (5/11, para aprobar)
    // Lo que es tu caso, para marcar y desmarcar cuando quieras (src/dominio/cuidados.ts). Arriba, cómo cambia tu
    // dieta: la meta de antes y la de ahora, lo que Moss te muestra, lo que deja de decirte y lo que te recuerda.
    // Abajo, la lista en grupos, cada una con lo que se pregunta además y su línea. Al marcar la primera sube el
    // consentimiento: se guarda solo en este iPhone, nunca en la cuenta. Al tocar, la hoja no se rearma: lo que
    // cambia se mueve en su lugar.
    Object.assign(s, { cuidados: [], consentido: false, datosCuidado: { semana: 20, pesoAntes: null, mellizos: false, semanasParto: 8, soloPecho: true, bajaElAzucar: null, dialisis: false } });
    // Una campana tachada: lo que Moss deja de decir.
    const CALLADO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 16.5V11a5.5 5.5 0 0 1 9-4.2M17.5 11.5v5l1.5 2H9"/><path d="M10.2 20.6a2 2 0 0 0 3.6 0M4.5 4.5l15 15"/></svg>';
    const personaDelCuidado = () => {
      const d = datosDe();
      const p = opciones.persona();
      return { sexo: d.sexo, edad: d.edad, alturaCm: d.alturaCm, pesoKg: p.pesoHoy, actividad: d.actividad, dieta: p.perfil.comer ? p.perfil.comer.dieta : undefined };
    };
    function datosDelCuidado() {
      const d = s.datosCuidado;
      return {
        embarazo: { fechaProbable: Cuidados.fechaProbableDe(d.semana, Datos.HOY), pesoAntes: d.pesoAntes, mellizos: d.mellizos },
        lactancia: { parto: Fechas.sumarDias(Datos.HOY, -7 * d.semanasParto), soloPecho: d.soloPecho },
        diabetes2: { bajaElAzucar: d.bajaElAzucar },
        renal: { dialisis: d.dialisis },
      };
    }
    // Lo que cuenta es lo guardado: lo marcado antes del consentimiento todavía no cambia nada.
    const cuidadosGuardados = () => (s.consentido ? s.cuidados : []);
    const reglasDeCuidados = () => Cuidados.reglasDe(cuidadosGuardados(), datosDelCuidado(), personaDelCuidado(), Datos.HOY);
    // Con un trastorno de la alimentación, los números se ocultan de entrada (D9); se vuelven a ver en Perfil.
    function ocultarNumerosPorCuidado() {
      if (s.numeros) { s.numeros = false; opciones.alNumeros(false); }
    }
    // Lo que crece y se achica en su lugar; `deUna`, sin transición (al armar la hoja).
    function plegable(contenido, clase) {
      const caja = el('div', 'pf-plegable' + (clase ? ' ' + clase : ''));
      const adentro = el('div');
      adentro.appendChild(contenido);
      caja.appendChild(adentro);
      return {
        el: caja,
        abrir(si, deUna) {
          if (deUna) caja.classList.add('quieto');
          caja.classList.toggle('abierto', !!si);
          caja.inert = !si;
          if (deUna) { void caja.offsetHeight; caja.classList.remove('quieto'); }
        },
      };
    }
    // Un texto que cambia se apaga, cambia y se prende (si cambia otra vez en el medio, queda el último).
    function ponerTexto(n, texto) {
      if ((n.dataset.texto ?? n.textContent) === texto) return;
      n.dataset.texto = texto;
      if (quieto() || !n.isConnected) { n.textContent = texto; return; }
      if (n.dataset.cambiando) return;
      n.dataset.cambiando = '1';
      n.classList.add('pf-cambiando');
      setTimeout(() => { n.textContent = n.dataset.texto; n.classList.remove('pf-cambiando'); delete n.dataset.cambiando; }, 180);
    }
    // Los chips de un grupo, por su clave: el que llega entra, el que se va sale y los demás quedan.
    function sincronizar(cont, items) {
      const vivos = new Map([...cont.children].filter((n) => !n.classList.contains('saliendo')).map((n) => [n.dataset.clave, n]));
      items.forEach((it) => {
        let n = vivos.get(it.clave);
        if (n) vivos.delete(it.clave);
        else {
          n = el('span', 'pf-chip ' + it.clase + (quieto() || !cont.isConnected ? '' : ' entra'));
          n.dataset.clave = it.clave;
          if (it.icono) n.innerHTML = it.icono;
          n.appendChild(el('span', null, it.texto));
        }
        cont.appendChild(n);
      });
      vivos.forEach((n) => {
        if (quieto()) { n.remove(); return; }
        n.classList.remove('entra');
        n.classList.add('saliendo');
        setTimeout(() => n.remove(), 240);
      });
    }

    // Cómo cambia tu dieta: la meta (cuatro mosaicos, con la de antes debajo si cambió), el objetivo, la banda del
    // embarazo, las metas nuevas, lo que mira primero, lo que te muestra, lo que deja de decirte y lo que te recuerda.
    function panelDeCambios() {
      const MACROS = ['kcal', 'proteina', 'carbohidratos', 'grasas'];
      const caja = el('section', 'pf-cambia');
      caja.appendChild(el('h4', null, tx('cuidados.cambia.titulo')));
      const mosaicos = el('div', 'pf-cambia-macros');
      const tiles = {};
      MACROS.forEach((k) => {
        const t = el('div', 'pf-cambia-macro');
        t.dataset.macro = k;
        const ahora = el('b');
        const antes = el('small');
        t.append(el('span', null, tx('cuidados.cambia.' + k)), ahora, antes);
        tiles[k] = { t, ahora, antes };
        mosaicos.appendChild(t);
      });
      const objetivo = el('div', 'pf-chips pf-cambia-ritmo');
      const bandaTexto = el('p', 'pf-cambia-nota');
      const banda = el('div', 'pf-banda');
      const bandaRango = el('i');
      const bandaHoy = el('b');
      banda.append(bandaRango, bandaHoy);
      const conBanda = el('div');
      conBanda.append(bandaTexto, banda);
      const plBanda = plegable(conBanda);
      const grupoDe = (titulo) => {
        const dentro = el('div');
        if (titulo) dentro.appendChild(el('span', 'pf-cambia-etq', titulo));
        const chips = el('div', 'pf-chips');
        dentro.appendChild(chips);
        const pl = plegable(dentro, 'pf-cambia-grupo');
        return { el: pl.el, poner(items, deUna) { sincronizar(chips, items); pl.abrir(items.length > 0, deUna); } };
      };
      const metas = grupoDe(null);
      const mira = grupoDe(tx('cuidados.cambia.mira'));
      const muestra = grupoDe(tx('cuidados.cambia.muestra'));
      const dejaDe = grupoDe(tx('cuidados.cambia.dejaDe'));
      const recuerda = grupoDe(tx('cuidados.cambia.empieza'));
      const nota = el('p', 'pf-cambia-nota');
      const plAMano = plegable(boton('pf-conectar', tx('cuidados.ponerAMano'), () => { hoja.cerrar(); if (opciones.irAMetas) opciones.irAMetas(); }));
      caja.append(mosaicos, objetivo, plBanda.el, metas.el, mira.el, muestra.el, dejaDe.el, recuerda.el, nota, plAMano.el);
      const pl = plegable(caja);
      const kilos = (x) => numero(x, Math.round(x * 10) % 10 ? 1 : 0);
      return {
        el: pl.el,
        actualizar(deUna) {
          const r = reglasDeCuidados();
          pl.abrir(r.cuidados.length > 0, deUna);
          if (!r.cuidados.length) return;
          const p = opciones.persona();
          const d = datosDe();
          const c = { edad: d.edad, sexo: d.sexo, pesoKg: p.pesoHoy, objetivo: p.perfil.objetivo, ritmo: p.perfil.ritmo };
          const estilo = p.perfil.estilo || 'equilibrada';
          const antes = Metas.metaPara(p.gasto, c, estilo);
          const ahora = Cuidados.metaConCuidados(p.gasto, c, estilo, r);
          // Con los números ocultos, solo hacia dónde va cada uno.
          MACROS.forEach((k) => {
            const x = tiles[k];
            const cambia = !ahora || ahora[k] !== antes[k];
            const valor = (m) => (k === 'kcal' ? numero(m.kcal) : `${numero(m[k])} g`);
            const hacia = !ahora ? '—' : ahora[k] > antes[k] ? tx('cuidados.cambia.sube') : ahora[k] < antes[k] ? tx('cuidados.cambia.baja') : tx('cuidados.cambia.mismo');
            ponerTexto(x.ahora, !ahora ? '—' : s.numeros ? valor(ahora) : hacia);
            ponerTexto(x.antes, cambia && s.numeros ? `${tx('cuidados.cambia.antes')} ${valor(antes)}` : '');
            x.t.classList.toggle('cambia', cambia);
          });
          const nombre = (o, ritmo) => tx('progreso.objetivos.' + o) + (o === 'mantener' ? '' : ` · ${tx('progreso.ritmos.' + ritmo)}`);
          const ritmoAntes = Metas.ritmoPermitido(c);
          const de = nombre(c.objetivo, ritmoAntes);
          const objetivoAhora = Cuidados.objetivoConCuidados(c.objetivo, r);
          const ritmoAhora = Cuidados.ritmoConCuidados(ritmoAntes, objetivoAhora, r);
          let a = nombre(objetivoAhora, ritmoAhora);
          if (c.objetivo === 'bajar' && objetivoAhora === 'mantener') a = r.deficitDesde ? tx('cuidados.cambia.deficitDesde', { fecha: u.fechaCorta(r.deficitDesde) }) : tx('cuidados.cambia.sinBajar');
          else if (ritmoAhora !== ritmoAntes) a = tx('cuidados.cambia.hastaRitmo', { ritmo: tx('progreso.ritmos.' + ritmoAhora).toLowerCase() });
          const flecha = (o) => ic(o === 'bajar' ? 'abajo' : o === 'subir' ? 'arriba' : 'objetivo');
          sincronizar(objetivo, a === de ? [{ clave: 'ahora:' + a, clase: 'objetivo', texto: a, icono: flecha(objetivoAhora) }]
            : [{ clave: 'antes:' + de, clase: 'objetivo antes', texto: de, icono: flecha(c.objetivo) }, { clave: 'ahora:' + a, clase: 'objetivo meta', texto: a, icono: flecha(objetivoAhora) }]);
          // El embarazo: la banda del IOM según la semana, sin juicios; el punto, si se sabe el peso de antes.
          const dc = s.datosCuidado;
          const rango = r.cuidados.includes('embarazo') ? Cuidados.rangoDelEmbarazo(Cuidados.imcDe(dc.pesoAntes ?? p.pesoHoy, d.alturaCm), dc.semana, dc.mellizos) : null;
          if (rango) {
            const alTermino = Cuidados.rangoDelEmbarazo(Cuidados.imcDe(dc.pesoAntes ?? p.pesoHoy, d.alturaCm), 40, dc.mellizos) || rango;
            const escala = Math.max(rango[1], alTermino[1]) * 1.15;
            ponerTexto(bandaTexto, tx('cuidados.cambia.embarazo', { n: dc.semana, a: kilos(rango[0]), b: kilos(rango[1]) }));
            bandaRango.style.left = `${((rango[0] / escala) * 100).toFixed(1)}%`;
            bandaRango.style.width = `${(((rango[1] - rango[0]) / escala) * 100).toFixed(1)}%`;
            const subido = dc.pesoAntes == null ? null : p.pesoHoy - dc.pesoAntes;
            bandaHoy.hidden = subido === null;
            if (subido !== null) bandaHoy.style.left = `${(Math.min(1, Math.max(0, subido / escala)) * 100).toFixed(1)}%`;
          }
          plBanda.abrir(!!rango, deUna);
          const lista = [];
          const pon = (clave, texto) => lista.push({ clave, clase: 'meta', texto });
          if (r.extraKcal > 0) pon('extra', tx('cuidados.cambia.extra', { n: numero(r.extraKcal) }));
          if (r.piso && r.piso > Metas.pisoDe(c.sexo)) pon('piso', tx('cuidados.cambia.piso', { n: numero(r.piso) }));
          if (r.control !== 'normal') pon('control', tx('cuidados.cambia.' + r.control));
          if (r.sodioMax) pon('sodio', tx('cuidados.cambia.sodio', { n: numero(r.sodioMax) }));
          if (typeof r.potasio === 'number') pon('potasio', tx('cuidados.cambia.potasio', { n: numero(r.potasio) }));
          else if (r.potasio === 'sinMeta') pon('potasio', tx('cuidados.cambia.potasioSinMeta'));
          if (r.saturadasMax) pon('saturadas', tx('cuidados.cambia.saturadas', { n: numero(r.saturadasMax * 100) }));
          if (r.colesterolMax) pon('colesterol', tx('cuidados.cambia.colesterol', { n: numero(r.colesterolMax) }));
          if (r.fibra) pon('fibra', tx('cuidados.cambia.fibra', { a: r.fibra[0], b: r.fibra[1] }));
          if (r.agua === 'noPedir') pon('agua', tx('cuidados.cambia.aguaNoPedir'));
          else if (r.agua) pon('agua', tx('cuidados.cambia.agua', { n: numero(r.agua / 1000, 1) }));
          if (r.cafeinaTope) pon('cafeina', tx('cuidados.cambia.cafeina', { n: numero(r.cafeinaTope) }));
          if (r.alcoholTope === 0) pon('alcohol', tx('cuidados.cambia.alcoholNada'));
          else if (r.alcoholTope) pon('alcohol', tx('cuidados.cambia.alcoholTope', { n: numero(r.alcoholTope) }));
          if (r.estilosSin.includes('keto')) pon('keto', tx('cuidados.cambia.sinKeto'));
          if (r.etapa) pon('etapa', tx('cuidados.cambia.vitaminas.' + r.etapa));
          if (r.numerosOcultos) pon('numeros', tx('cuidados.cambia.numerosOcultos'));
          if (!r.pesoMeta) pon('pesoMeta', tx('cuidados.cambia.sinPesoMeta'));
          metas.poner(lista, deUna);
          // Lo que mira primero, con su referencia de ahora (la cafeína y el potasio ya están arriba).
          const para = { sexo: d.sexo, edad: d.edad };
          mira.poner(r.mirar.filter((m) => !(m === 'cafeina' && r.cafeinaTope) && !(m === 'potasio' && r.potasio !== null)).map((m) => {
            const ref = Cuidados.referenciaConCuidados(m, para, r);
            const unidad = Micronutrientes.UNIDAD[m];
            const valor = !ref ? tx('cuidados.cambia.sinMeta') : 'meta' in ref ? `${numero(ref.meta, ref.meta % 1 ? 1 : 0)} ${unidad}` : tx('cuidados.cambia.hasta', { n: numero(ref.tope), u: unidad });
            return { clave: 'mira:' + m, clase: 'muestra', texto: `${tx('comida.micros.nombres.' + m)} · ${valor}` };
          }), deUna);
          muestra.poner(r.marcar.map((m) => ({ clave: 'marca:' + m, clase: 'muestra', texto: tx('cuidados.marcas.' + m), icono: ic('ojo') })), deUna);
          dejaDe.poner(r.apagar.map((x) => ({ clave: 'apaga:' + x, clase: 'apaga', texto: tx('cuidados.dice.' + x), icono: CALLADO })), deUna);
          recuerda.poner(r.prender.map((x) => ({ clave: 'prende:' + x, clase: 'prende', texto: tx('cuidados.dice.' + x), icono: ic('campana') })), deUna);
          const lineas = [];
          if (r.manuales) lineas.push(tx(r.cuidados.includes('renal') && dc.dialisis ? 'cuidados.manuales.dialisis' : 'cuidados.manuales.menor'));
          else if (a === de && MACROS.every((k) => ahora[k] === antes[k])) lineas.push(tx('cuidados.cambia.igual'));
          if (r.profesional) lineas.push(tx('cuidados.profesional.' + r.profesional));
          ponerTexto(nota, lineas.join(' '));
          plAMano.abrir(r.manuales || r.profesional === 'necesario', deUna);
        },
      };
    }

    function pintarCuidados() {
      const h = hoja.el;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('perfil.cuidado')), boton('hb-cerrar', icono('cerrar'), () => hoja.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'pf-avisos pf-cuidados');
      const privado = el('p', 'pf-privado');
      privado.innerHTML = icono('candado');
      privado.appendChild(el('span', null, tx('cuidados.soloEnElIphone')));
      cuerpo.append(el('p', 'pf-nota', tx('cuidados.intro')), privado);
      const panel = panelDeCambios();
      cuerpo.appendChild(panel.el);
      const d = s.datosCuidado;
      // Lo que se pregunta además de cada una, como en el cuestionario.
      function preguntasDe(c) {
        const fila = (texto, ...lado) => {
          const f = el('div', 'pf-pregunta');
          const l = el('div', 'pf-pregunta-lado');
          l.append(...lado);
          f.append(el('span', null, texto), l);
          return f;
        };
        const pasos = (leer, formato, mover, nombre) => {
          const caja = el('div', 'fi-stepper');
          const v = el('b', 'fi-valor', formato(leer()));
          const paso = (signo) => boton('fi-paso', icono(signo < 0 ? 'menos' : 'mas'), () => { mover(signo); v.textContent = formato(leer()); actualizar(); }, `${nombre} ${signo < 0 ? '−' : '+'}`);
          caja.append(paso(-1), v, paso(1));
          caja.valor = v;
          return caja;
        };
        const chips = (lista, elegida, alElegir) => {
          const f = el('div', 'fi-porciones');
          lista.forEach(([valor, texto]) => {
            const b = boton('fi-porcion', `<span>${texto}</span>`, () => {
              alElegir(valor);
              f.querySelectorAll('.fi-porcion').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
              actualizar();
            });
            b.setAttribute('aria-pressed', String(valor === elegida));
            f.appendChild(b);
          });
          return f;
        };
        const llave = (prendida, alCambiar, nombre) => {
          const l = boton('in-llave', '<i></i>', () => {
            const si = l.getAttribute('aria-pressed') !== 'true';
            l.setAttribute('aria-pressed', String(si));
            alCambiar(si);
            actualizar();
          }, nombre);
          l.setAttribute('aria-pressed', String(prendida));
          return l;
        };
        if (c === 'embarazo') {
          const base = () => Math.round(opciones.persona().pesoHoy * 2) / 2;
          const kilos = (x) => `${numero(x, x % 1 ? 1 : 0)} kg`;
          const peso = pasos(() => d.pesoAntes ?? base(), kilos, (signo) => {
            d.pesoAntes = Math.min(200, Math.max(35, (d.pesoAntes ?? base()) + signo * 0.5));
            ponerNoSe();
          }, tx('cuidados.preguntas.pesoAntes'));
          const noSe = boton('fi-porcion pf-varia', `<span>${tx('cuidados.preguntas.noSe')}</span>`, () => {
            d.pesoAntes = d.pesoAntes == null ? base() : null;
            peso.valor.textContent = kilos(d.pesoAntes ?? base());
            ponerNoSe();
            actualizar();
          });
          const ponerNoSe = () => { noSe.setAttribute('aria-pressed', String(d.pesoAntes == null)); peso.classList.toggle('pf-sin-valor', d.pesoAntes == null); };
          ponerNoSe();
          return [
            fila(tx('cuidados.preguntas.semana'), pasos(() => d.semana, (n) => tx('cuidados.preguntas.semanaN', { n }), (signo) => { d.semana = Math.min(42, Math.max(1, d.semana + signo)); }, tx('cuidados.preguntas.semana'))),
            el('span', null, tx('cuidados.preguntas.pesoAntes')),
            fila('', noSe, peso),
            fila(tx('cuidados.preguntas.mellizos'), llave(d.mellizos, (si) => { d.mellizos = si; }, tx('cuidados.preguntas.mellizos'))),
          ];
        }
        if (c === 'lactancia') {
          return [
            fila(tx('cuidados.preguntas.parto'), pasos(() => d.semanasParto, (n) => u.plural('cuidados.preguntas.partoN', n), (signo) => { d.semanasParto = Math.min(104, Math.max(0, d.semanasParto + signo)); }, tx('cuidados.preguntas.parto'))),
            chips([['si', tx('cuidados.preguntas.soloPecho')], ['no', tx('cuidados.preguntas.conFormula')]], d.soloPecho ? 'si' : 'no', (v) => { d.soloPecho = v === 'si'; }),
          ];
        }
        if (c === 'diabetes2') {
          const valor = d.bajaElAzucar === true ? 'si' : d.bajaElAzucar === false ? 'no' : 'noSe';
          return [
            el('span', null, tx('cuidados.preguntas.insulina')),
            chips([['si', tx('cuidados.preguntas.si')], ['no', tx('cuidados.preguntas.no')], ['noSe', tx('cuidados.preguntas.noLoSe')]], valor, (v) => { d.bajaElAzucar = v === 'si' ? true : v === 'no' ? false : null; }),
          ];
        }
        return [fila(tx('cuidados.preguntas.dialisis'), llave(d.dialisis, (si) => { d.dialisis = si; }, tx('cuidados.preguntas.dialisis')))];
      }
      const filas = [];
      Cuidados.gruposPara(datosDe().sexo).forEach(({ grupo, cuidados }) => {
        cuerpo.appendChild(el('h4', 'pf-grupo', tx('cuidados.grupos.' + grupo)));
        const caja = el('section', 'pf-cuidados-grupo');
        caja.dataset.grupo = grupo;
        cuidados.forEach((c) => {
          const item = el('div', 'pf-cuidado');
          item.dataset.cuidado = c;
          const fila = el('div', 'pf-cuidado-fila');
          const textos = el('span');
          textos.appendChild(el('b', null, tx('cuidados.nombres.' + c)));
          const detalle = 'cuidados.detalles.' + c;
          if (tx(detalle) !== detalle) textos.appendChild(el('small', null, tx(detalle)));
          const llave = boton('in-llave', '<i></i>', () => alternar(c), tx('cuidados.nombres.' + c));
          fila.append(textos, llave);
          const dentro = el('div', 'pf-cuidado-dentro');
          if (Cuidados.PREGUNTA[c]) dentro.append(...preguntasDe(c));
          dentro.appendChild(el('p', 'pf-nota', tx('cuidados.lineas.' + c)));
          const pl = plegable(dentro);
          item.append(fila, pl.el);
          caja.appendChild(item);
          filas.push({ c, llave, pl });
        });
        cuerpo.appendChild(caja);
      });
      cuerpo.appendChild(el('p', 'pf-nota pf-nota-tenue pf-cuidados-alergias', tx('cuidados.alergias')));
      const consentir = el('div', 'pf-consentir');
      const texto = el('p');
      texto.innerHTML = icono('candado');
      texto.appendChild(el('span', null, tx('cuidados.consentimiento.texto')));
      const botones = el('div', 'pf-consentir-botones');
      botones.append(
        boton('pf-consentir-si', tx('cuidados.consentimiento.guardar'), () => {
          s.consentido = true;
          if (s.cuidados.includes('tca')) ocultarNumerosPorCuidado();
          actualizar();
          pintar();
        }),
        boton('pf-consentir-no', tx('cuidados.consentimiento.ahoraNo'), () => { s.cuidados = []; actualizar(); }),
      );
      consentir.append(texto, botones);
      const plConsentir = plegable(consentir, 'pf-consentir-caja');
      cuerpo.appendChild(plConsentir.el);
      h.append(cab, cuerpo);
      function actualizar(deUna) {
        filas.forEach((f) => {
          const si = s.cuidados.includes(f.c);
          f.llave.setAttribute('aria-pressed', String(si));
          f.pl.abrir(si, deUna);
        });
        plConsentir.abrir(s.cuidados.length > 0 && !s.consentido, deUna);
        panel.actualizar(deUna);
      }
      function alternar(c) {
        const ya = s.cuidados.includes(c);
        s.cuidados = ya ? s.cuidados.filter((x) => x !== c) : [...s.cuidados, c];
        if (!ya && c === 'tca' && s.consentido) ocultarNumerosPorCuidado();
        actualizar();
        pintar();
      }
      actualizar(true);
    }
    function abrirCuidados() {
      pintarCuidados();
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
      // El peso de hoy (la tendencia), no la meta (lo pediste el 2/11/2026): la meta vive en el plan de Progreso.
      const irAMetas = () => opciones.irAMetas && opciones.irAMetas();
      const kg = opciones.persona().pesoHoy;
      if (s.sistema === 'imperial') mini(tx('perfil.mini.peso'), numero(kg * 2.20462), 'lb', irAMetas);
      else mini(tx('perfil.mini.peso'), numero(kg, 1), 'kg', irAMetas);
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
        !s.sinDeficit && !reglasDeCuidados().apagar.includes('antesDeEntrenar') && opciones.comida && { clave: 'entreno', ico: 'pesa', color: 'oro', titulo: tx('entreno.perfil.titulo'), valor: resumenDeEntreno(opciones.comida.entreno), alTocar: abrirEntreno },
        // Cuidados (5/11, para aprobar): lo marcado, guardado solo en este iPhone, abre su hoja. Con el sí/no de
        // antes (las capturas de la seguridad), «Sin déficit».
        { clave: 'cuidado', ico: 'escudo', color: 'rosa', titulo: tx('perfil.cuidado'),
          sub: cuidadosGuardados().length ? tx('cuidados.perfilSub') : s.sinDeficit ? tx('perfil.sinDeficitTexto') : null,
          valor: cuidadosGuardados().length ? u.plural('cuidados.marcados', cuidadosGuardados().length) : tx(s.sinDeficit ? 'perfil.sinDeficit' : 'perfil.ninguno'),
          tipo: cuidadosGuardados().length || s.sinDeficit ? 'ok' : null, alTocar: abrirCuidados },
        // El cuestionario del principio, para cambiarlo cuando quieras (5/11): con lo contestado y, al guardar, la meta nueva.
        opciones.revisarCuestionario && { clave: 'respuestas', ico: 'objetivo', color: 'oro', titulo: tx('perfil.respuestas'), sub: tx('perfil.respuestasTexto'), alTocar: opciones.revisarCuestionario },
      ]);
      grupo('perfil.preferencias', [
        { ico: 'cinta', color: 'gris', titulo: tx('perfil.unidades'), valor: tx(s.sistema === 'imperial' ? 'perfil.imperial' : 'perfil.metrico'), alTocar: () => { s.sistema = s.sistema === 'imperial' ? 'metrico' : 'imperial'; pintar(); } },
        // El idioma es el del teléfono; en la galería, el botón de idioma.
        { ico: 'globo', color: 'azul', titulo: tx('perfil.idioma'), valor: tx('perfil.idiomaDelTelefono'), alTocar: () => { const otro = document.querySelector('#s-idioma button[aria-pressed="false"]'); if (otro) otro.click(); } },
        { ico: 'amanecer', color: 'oro', titulo: tx('perfil.corte'), valor: nombreDelCorte(s.corte), alTocar: () => abrirOpciones('corte') },
        { ico: 'estrella', color: 'violeta', titulo: tx('perfil.calidad'), valor: tx('perfil.calidades.' + (s.calidad || 'automatica')), alTocar: () => abrirOpciones('calidad') },
        { ico: 'campana', color: 'rosa', titulo: tx('perfil.recordatorios'), valor: tx(s.avisos.dormir || s.avisos.comidas.length || Object.keys(s.avisos.horario).length || s.avisos.pesarse
          || ['antesDeEntrenar', 'despuesDeEntrenar', 'cafe', 'ultimaComida', 'entrenarTarde', 'luces', 'recuperacion'].some((k) => s.avisos[k]) ? 'perfil.encendidos' : 'perfil.apagados'), alTocar: abrirAvisos },
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
      // Abajo de todo, en qué se basa Moss (5/11): de dónde sale cada número y cómo se ordena lo que llega.
      grupo('perfil.baseGrupo', [{ ico: 'info', color: 'gris', titulo: tx('perfil.base'), sub: tx('perfil.baseSub'), alTocar: () => abrirOpciones('base') }]);
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
        // Cuidados con lo marcado (y el sexo, para ver el embarazo y la lactancia), abierto salvo `abrir: false`.
        cuidados: () => {
          const a = arg || {};
          if (a.sexo) s.datos = Object.assign({}, datosDe(), { sexo: a.sexo });
          if (a.marcados) s.cuidados = [...a.marcados];
          if (a.datos) Object.assign(s.datosCuidado, a.datos);
          if ('consentido' in a) s.consentido = a.consentido;
          if ('numeros' in a) { s.numeros = a.numeros; opciones.alNumeros(s.numeros); }
          pintar();
          if (a.abrir !== false) abrirCuidados();
        },
        // El scroll de Cuidados: hasta lo que se pida, arriba (0) o abajo de todo.
        bajarCuidados: () => {
          const c = hoja.el.querySelector('.pf-cuidados');
          const n = typeof arg === 'string' ? hoja.el.querySelector(arg) : null;
          if (c) c.scrollTop = n ? Math.max(0, n.offsetTop - c.offsetTop - 12) : arg === 0 ? 0 : c.scrollHeight;
        },
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
      // En qué se basa Moss, con un área abierta (o ninguna).
      abrirBase(area) { s.baseAbierta = area || null; abrirOpciones('base'); },
      // Para las capturas: los avisos encendidos.
      ponerAvisos(cambios) { Object.assign(s.avisos, cambios); if (hoja.abierta) pintarAvisos(); pintar(); },
      // Para las capturas: los números ocultos y sin déficit.
      poner(cambios) { Object.assign(s, cambios); if ('numeros' in cambios) opciones.alNumeros(s.numeros); pintar(); },
      // Sin déficit: el sí/no de antes o lo que sale de los cuidados guardados (lo que Moss subiría a la cuenta).
      get sinDeficit() { return s.sinDeficit || Cuidados.sinDeficitDe(reglasDeCuidados()); },
      // Lo elegido en «Necesito dormir» (null: lo de tu edad), para Sueño.
      get necesidad() { return s.avisos.necesidad; },
      // Reflujo en Cuidados: la última comida grande, 3 h antes de la cama en vez de 2.
      get reflujo() { return cuidadosGuardados().includes('reflujo'); },
      abrirCuidados,
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
