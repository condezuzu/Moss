// La propuesta de widgets, para aprobar (D43, spec/widgets.md): la comida, que es lo más usado y no
// tenía ninguno; el cielo con el cielo de verdad de fondo (assets/widgets, sacado de los shaders); la
// noche también de noche, y la pantalla bloqueada. Con los datos de mentira de la galería y con lo que
// deja dibujar SwiftUI en un widget: formas, degradés, texto, «Link» y «Button». Lo que se toca queda
// en el widget hasta abrir Moss, como en el iPhone.

const WidgetsNuevos = (() => {
  const SVG = 'http://www.w3.org/2000/svg';
  const COMIDAS = ['desayuno', 'almuerzo', 'merienda', 'cena'];
  const MACROS = [['p', 'comida.proteina'], ['c', 'comida.carbohidratos'], ['g', 'comida.grasas']];
  // Una noche de mentira: a dormir a las 23:15 para despertarse a las 7:15, y ahora son las 21:47.
  const A_DORMIR = 23 * 60 + 15;
  const DESPERTAR = 7 * 60 + 15;
  const AHORA = 21 * 60 + 47;
  const MAX_FILAS_MEDIANO = 4;
  const MAX_VASOS = 16;

  const ICONOS = {
    codigo: '<path d="M4.5 8V5.5a1 1 0 0 1 1-1H8M16 4.5h2.5a1 1 0 0 1 1 1V8M19.5 16v2.5a1 1 0 0 1-1 1H16M8 19.5H5.5a1 1 0 0 1-1-1V16"/><path d="M8.5 8.5v7M12 8.5v7M15.5 8.5v7"/>',
    etiqueta: '<path d="M7 3.5h10a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>',
    linterna: '<path d="M9 3.5h6v4l-1.5 2v10h-3v-10L9 7.5z"/>',
    camara: '<path d="M4.5 8.5h3l1.5-2h6l1.5 2h3v10h-15z"/><circle cx="12" cy="13" r="3.2"/>',
  };
  const icono = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[n] || Util.ICONOS[n] || ''}</svg>`;

  const CSS = `
.wg-w.grande { width: 338px; height: 354px; }
.wn-pagina { position: absolute; left: 27.5px; right: 27.5px; top: 72px; display: grid; gap: 22px; }
.wn-dos { display: flex; justify-content: space-between; }
.wn-capa { position: absolute; inset: 0; background-size: 338px 354px; background-position: center bottom; background-repeat: no-repeat; pointer-events: none; transition: opacity 1s ease; }
.wn-noche { background-image: var(--wn-noche); }
.wn-aurora { background-image: var(--wn-aurora); opacity: 0; }
.wg-w.completo .wn-aurora { opacity: 1; }
.wn-tenue .wn-noche { opacity: 0.4; }
.wn-velo { position: absolute; left: 0; right: 0; bottom: 0; height: 44%; background: linear-gradient(180deg, rgba(3, 5, 12, 0), rgba(3, 5, 12, 0.6)); pointer-events: none; transition: opacity 0.4s; }
.wg.tintado .wn-capa, .wg.transparente .wn-capa, .wg.tintado .wn-velo, .wg.transparente .wn-velo { opacity: 0; }
.wn-dentro { position: absolute; inset: 16px; display: flex; flex-direction: column; min-width: 0; }
.wn-ic svg { display: block; width: 100%; height: 100%; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.wn-etq { display: block; font: 500 9.5px/1 var(--letra); letter-spacing: 0.15em; text-transform: uppercase; color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-cifra { display: inline-block; font: 300 36px/1 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.025em; color: #fbf2d9; font-variant-numeric: tabular-nums; transition: color 0.4s; }
.wn-cifra-fila { display: flex; align-items: baseline; gap: 5px; margin-top: 4px; }
.wn-cifra-fila small { font: 400 12px/1 var(--letra); color: var(--tenue); }
.de-mas .wn-cifra { color: #e8c46a; }
.wg.tintado .wn-cifra, .wg.transparente .wn-cifra { color: var(--texto); }
.wn-cambia { animation: wn-cambia 0.42s cubic-bezier(0.2, 0.7, 0.2, 1); }
@keyframes wn-cambia { from { opacity: 0.2; transform: translateY(4px); } to { opacity: 1; transform: none; } }
.wn-m-p { --c: #f6e3a6; }
.wn-m-c { --c: #a6bf94; }
.wn-m-g { --c: #a9c4f5; }
.wg.tintado .wn-m-p, .wg.tintado .wn-m-c, .wg.tintado .wn-m-g, .wg.transparente .wn-m-p, .wg.transparente .wn-m-c, .wg.transparente .wn-m-g { --c: var(--texto); }
.wn-barra { display: block; height: 3px; border-radius: 2px; background: rgba(239, 230, 207, 0.13); overflow: hidden; }
.wn-barra i { display: block; height: 100%; width: var(--f, 0%); border-radius: 2px; background: var(--c); transition: width 0.7s cubic-bezier(0.2, 0.7, 0.2, 1), background 0.4s; }
.de-mas > .wn-barra i, .wn-barra.de-mas i { background: #e8c46a; }
.wn-luna-sitio { display: block; flex: none; line-height: 0; }
.wg.tintado .luna { filter: grayscale(1) sepia(0.5) hue-rotate(185deg) saturate(2.2) brightness(1.05); }
.wg.transparente .luna, .wn-mono .luna { filter: grayscale(1) brightness(1.22); }

/* Hoy, chico: la luna, cuánto queda y los tres macros. Tocarlo abre la hoja de anotar. */
.wn-arriba { display: flex; justify-content: space-between; align-items: flex-start; height: 42px; }
.wn-arriba .wn-luna-sitio { margin: -7px 0 0 -6px; }
.wn-mas { width: 26px; height: 26px; padding: 5px; border-radius: 50%; color: var(--luz); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); }
.wn-empuje { flex: 1; min-height: 0; }
.wn-tres { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; margin-top: 9px; }
.wn-tres > div { display: grid; gap: 4px; min-width: 0; }
.wn-tres b { font: 400 11.5px/1 var(--letra); color: var(--texto); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wn-tres b span { opacity: 0.55; margin-right: 3px; }

/* Hoy, mediano: lo mismo con el nombre de cada macro, y las cuatro comidas abajo. */
.wn-med { display: flex; align-items: center; gap: 9px; height: 62px; }
.wn-med .wn-luna-sitio { margin: -7px -6px -7px -7px; }
.wn-med .wn-cifra { font-size: 31px; }
.wn-cifras { flex: none; min-width: 84px; }
.wn-lista-macros { flex: 1; min-width: 0; display: grid; gap: 5px; margin-left: 3px; }
.wn-lista-macros > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 6px; row-gap: 3px; align-items: baseline; }
.wn-lista-macros span { font: 400 10px/1.25 var(--letra); color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-lista-macros b { font: 500 11.5px/1 var(--letra); color: var(--texto); font-variant-numeric: tabular-nums; }
.wn-lista-macros .wn-barra { grid-column: 1 / 3; }
.wn-chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; margin-top: auto; }
.wn-chip { appearance: none; border: 0; margin: 0; cursor: pointer; height: 46px; min-width: 0; padding: 0 7px; border-radius: 12px; display: grid; align-content: center; gap: 2px; text-align: left; color: var(--texto); font: inherit;
  background: rgba(239, 230, 207, 0.07); box-shadow: inset 0 0 0 0.5px rgba(239, 230, 207, 0.1); transition: background 0.3s, box-shadow 0.3s, transform 0.15s; }
.wn-chip:active { transform: scale(0.95); }
.wn-chip span { font: 400 10px/1.25 var(--letra); color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-chip b { display: flex; align-items: center; gap: 3px; height: 14px; font: 500 13px/1 var(--letra); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wn-chip.siempre, .wn-chip.vacia { background: rgba(246, 227, 166, 0); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.3); }
.wn-chip.siempre b, .wn-chip.vacia b { color: var(--luz); }
.wn-chip.tocada { background: rgba(246, 227, 166, 0.15); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.5); }
.wn-chip b .wn-ic { width: 11px; height: 11px; flex: none; color: var(--luz); }
.wn-chip b .wn-ic svg { stroke-width: 2.6; }

/* Hoy, grande: una fila por comida, con lo que comiste o lo que sumaría un toque, y anotar abajo. */
.wn-gr { display: flex; align-items: center; gap: 12px; height: 74px; }
.wn-gr .wn-luna-sitio { margin: -10px -8px -10px -9px; }
.wn-gr .wn-cifra { font-size: 42px; }
.wn-gr small.wn-de { display: block; margin-top: 4px; font: 400 12px/1 var(--letra); color: var(--tenue); font-variant-numeric: tabular-nums; }
.wn-tres-gr { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 11px; margin-top: 11px; padding-top: 10px; border-top: 0.5px solid rgba(239, 230, 207, 0.1); }
.wn-tres-gr > div { display: grid; gap: 3px; min-width: 0; }
.wn-tres-gr span { font: 400 9.5px/1.25 var(--letra); color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-tres-gr b { font: 500 14px/1 var(--letra); color: var(--texto); font-variant-numeric: tabular-nums; }
.wn-filas { flex: 1; min-height: 0; display: flex; flex-direction: column; margin-top: 8px; border-top: 0.5px solid rgba(239, 230, 207, 0.1); }
.wn-fila { appearance: none; border: 0; background: none; margin: 0; padding: 0; flex: 1; min-height: 0; cursor: pointer; display: grid; grid-template-columns: 62px minmax(0, 1fr) auto 22px; align-items: center; gap: 7px; text-align: left; color: var(--texto); font: inherit; border-bottom: 0.5px solid rgba(239, 230, 207, 0.07); transition: opacity 0.15s; }
.wn-fila:active { opacity: 0.55; }
.wn-fila:last-child { border-bottom: 0; }
.wn-fila b { font: 400 12.5px/1.25 var(--letra); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-fila span { font: 400 11px/1.3 var(--letra); color: var(--tenue); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wn-fila em { font: 500 12.5px/1 var(--letra); font-style: normal; font-variant-numeric: tabular-nums; white-space: nowrap; }
.wn-fila i.wn-ic { width: 22px; height: 22px; padding: 4.5px; border-radius: 50%; color: var(--tenue); transition: color 0.3s, background 0.3s, box-shadow 0.3s; }
.wn-fila.siempre em, .wn-fila.siempre i.wn-ic, .wn-fila.vacia i.wn-ic { color: var(--luz); }
.wn-fila.siempre i.wn-ic, .wn-fila.vacia i.wn-ic { box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); }
.wn-fila.tocada i.wn-ic { color: #0a1024; background: var(--luz); }
.wn-fila.tocada em { color: var(--luz); }
.wn-acciones { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-top: 6px; }
.wn-accion { appearance: none; border: 0; margin: 0; cursor: pointer; height: 34px; border-radius: 17px; display: flex; align-items: center; justify-content: center; gap: 5px; color: var(--texto); font: 400 12px/1 var(--letra); background: rgba(239, 230, 207, 0.08); transition: transform 0.15s; }
.wn-accion:active { transform: scale(0.95); }
.wn-accion .wn-ic { width: 15px; height: 15px; }

/* Anotar: cada botón abre Moss justo ahí. */
.wn-an-cab { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.wn-an-cab b { font: 500 14px/1.1 var(--letra); color: var(--texto); white-space: nowrap; }
.wn-an-cab span { font: 400 11.5px/1 var(--letra); color: var(--tenue); font-variant-numeric: tabular-nums; white-space: nowrap; }
.wn-an-fila { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: auto; }
.wn-tile { appearance: none; border: 0; background: none; margin: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 7px; color: var(--texto); font: 400 11.5px/1 var(--letra); transition: transform 0.15s; }
.wn-tile:active { transform: scale(0.94); }
.wn-tile .wn-ic { width: 52px; height: 52px; padding: 14px; border-radius: 50%; background: rgba(239, 230, 207, 0.08); box-shadow: inset 0 0 0 0.5px rgba(239, 230, 207, 0.12); }
.wn-solo { display: grid; justify-items: center; align-content: center; gap: 12px; height: 100%; text-align: center; }
.wn-solo .wn-ic { width: 66px; height: 66px; padding: 18px; border-radius: 50%; color: var(--luz); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); }
.wn-solo b { font: 400 13px/1.2 var(--letra); color: var(--texto); }

/* El agua: un toque suma un vaso, sin abrir Moss. */
.wn-agua-cab { display: flex; align-items: center; gap: 5px; }
.wn-agua-cab .wn-ic { width: 12px; height: 12px; color: #a9c4f5; }
.wn-agua { --c: #a9c4f5; }
.wg.tintado .wn-agua, .wg.transparente .wn-agua { --c: var(--texto); }
.wg.tintado .wn-agua-cab .wn-ic, .wg.transparente .wn-agua-cab .wn-ic { color: var(--texto); }
.wn-agua .wn-cifra { font-size: 32px; margin-top: 9px; }
.wn-agua small.wn-de { display: block; margin-top: 3px; font: 400 11.5px/1 var(--letra); color: var(--tenue); font-variant-numeric: tabular-nums; }
.wn-agua .wn-barra { margin-top: 7px; }
.wn-agua-botones { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: auto; }
.wn-redondo { appearance: none; border: 0; margin: 0; cursor: pointer; width: 34px; height: 34px; padding: 8px; border-radius: 50%; background: rgba(239, 230, 207, 0.08); color: var(--texto); transition: transform 0.15s, opacity 0.3s; }
.wn-redondo:active { transform: scale(0.92); }
.wn-redondo.fuerte { width: 40px; height: 40px; padding: 9px; background: rgba(246, 227, 166, 0.14); color: var(--luz); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); }
.wn-redondo[disabled] { opacity: 0.3; pointer-events: none; }

/* La noche, en la pantalla de inicio: a la mañana, lo de anoche; a la tardecita, a qué hora a dormir. */
.wn-noche-cab { display: flex; justify-content: space-between; align-items: center; }
.wn-noche-cab .wn-ic { width: 14px; height: 14px; color: var(--tenue); }
.wn-w-noche .wn-cifra { font-size: 34px; margin-top: 10px; white-space: nowrap; }
.wn-w-noche small.wn-de { display: block; margin-top: 4px; font: 400 12px/1.15 var(--letra); color: var(--tenue); font-variant-numeric: tabular-nums; }
.wn-si { appearance: none; border: 0; margin: auto 0 0; cursor: pointer; height: 32px; border-radius: 16px; display: flex; align-items: center; justify-content: center; gap: 5px; background: rgba(246, 227, 166, 0.14); box-shadow: inset 0 0 0 1px rgba(246, 227, 166, 0.45); color: var(--luz); font: 500 12.5px/1 var(--letra); transition: background 0.3s, box-shadow 0.3s, color 0.3s, opacity 0.3s; }
.wn-si[hidden] { display: none; }
.wn-para { margin-top: auto; font: 400 11.5px/1.25 var(--letra); color: var(--tenue); }
.wn-para[hidden] { display: none; }
.wn-si .wn-ic { width: 11px; height: 11px; display: none; }
.wn-si.lista { background: none; box-shadow: none; color: var(--tenue); pointer-events: none; }
.wn-si.lista .wn-ic { display: block; }

/* El cielo: la figura grande sobre el cielo de verdad; se conecta a medida que se enciende. */
.wn-figura { display: block; overflow: visible; }
.wn-figura line { stroke: var(--linea); stroke-width: 0.8; stroke-linecap: round; transition: stroke 0.5s, stroke-width 0.5s, opacity 0.5s; opacity: 0.8; }
.wn-figura line.unida { stroke: var(--luz); stroke-width: 1; opacity: 0.8; }
.wg-w.completo .wn-figura line { stroke: #f3d58a; stroke-width: 1.1; opacity: 0.95; }
.wn-figura .halo-c { stop-color: var(--luz); }
.wn-figura .halo { opacity: 0; transition: opacity 0.5s; }
.wn-figura .rayos { fill: var(--luz); opacity: 0; transform: scale(0.25); transition: opacity 0.45s, transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1.15); }
.wn-figura .nucleo { fill: var(--apagada); transform: scale(0.55); transition: fill 0.45s, transform 0.45s; }
.wn-figura .encendida .halo { opacity: 0.7; }
.wn-figura .encendida .rayos { opacity: 1; transform: none; }
.wn-figura .encendida .nucleo { fill: #fffaf0; transform: none; }
.wg.tintado .wn-figura .encendida .nucleo, .wg.transparente .wn-figura .encendida .nucleo { fill: var(--luz); }
.wn-pie { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-top: auto; }
.wn-pie .wg-cuenta { font-size: 14px; }
.wn-pie .wg-nombre { font-size: 10.5px; }
.wn-c-med { position: absolute; inset: 16px; display: flex; gap: 12px; }
.wn-c-izq { flex: none; width: 150px; display: flex; flex-direction: column; }
.wn-c-med .wg-lista { gap: 1px; }
.wn-c-gr-lista { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 10px; margin-top: 10px; padding-top: 8px; border-top: 0.5px solid rgba(239, 230, 207, 0.14); }
.wn-c-gr-lista .wg-boton { height: 31px; font-size: 13px; }
.wn-c-gr-lista .wg-boton.solo { color: var(--tenue); }
.wn-c-gr-lista.cuatro .wg-boton { height: 25px; }

/* La pantalla bloqueada: iOS lo dibuja de un solo color sobre el fondo. */
.wg-n-bloqueo .wg-reloj, .wg-n-bloqueo2 .wg-reloj { position: absolute; top: 92px; left: 0; right: 0; text-align: center; font: 600 104px/1 'SF Pro Rounded', -apple-system, 'Segoe UI', system-ui, sans-serif; letter-spacing: -0.03em; color: rgba(255, 255, 255, 0.93); font-variant-numeric: tabular-nums; }
.wn-fecha { position: absolute; top: 74px; left: 0; right: 0; display: flex; justify-content: center; gap: 7px; font: 600 19px/1 var(--letra); color: rgba(255, 255, 255, 0.86); white-space: nowrap; }
.wn-fecha i { font-style: normal; font-weight: 500; opacity: 0.85; font-variant-numeric: tabular-nums; }
.wn-acc { position: absolute; top: 222px; left: 16px; right: 16px; display: flex; justify-content: center; align-items: center; gap: 8px; }
.wn-acc .wg-noche { flex: none; cursor: pointer; }
.wn-circ { flex: none; width: 72px; height: 72px; border-radius: 50%; background: rgba(255, 255, 255, 0.13); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); display: grid; justify-items: center; align-content: center; color: #fff; cursor: pointer; position: relative; transition: transform 0.15s; }
.wn-circ:active { transform: scale(0.95); }
.wn-circ b { font: 600 13px/1 var(--letra); font-variant-numeric: tabular-nums; }
.wn-circ .wn-luna-sitio { margin: -7px 0 -5px; }
.wn-circ.mas .wn-ic { width: 32px; height: 32px; }
.wn-circ .wn-figura { --luz: #fff; --apagada: rgba(255, 255, 255, 0.5); --linea: rgba(255, 255, 255, 0.34); margin-bottom: 1px; }
.wn-circ .wn-figura .halo { display: none; }

/* StandBy: dos a la vez, sin el fondo que iOS saca. */
.wg-n-standby { background: #000; }
.wg-n-standby .wg-acostado { justify-content: space-evenly; padding: 0; }
.wg-n-standby.de-noche .wg-acostado { filter: grayscale(1) sepia(1) saturate(5) hue-rotate(-45deg) brightness(0.62); }

@media (prefers-reduced-motion: reduce) {
  .wn-capa, .wn-velo, .wn-barra i, .wn-chip, .wn-fila i.wn-ic, .wn-figura line, .wn-figura .halo, .wn-figura .rayos, .wn-figura .nucleo, .wn-si, .wn-cifra { transition: none; }
  .wn-cambia { animation: none; }
}
`;

  // Un número o un texto que cambia entra suave, como contentTransition('numericText') en el iPhone.
  function poner(nodo, texto) {
    if (nodo.textContent === texto) return;
    const primera = !nodo.textContent;
    nodo.textContent = texto;
    if (primera) return;
    nodo.classList.remove('wn-cambia');
    void nodo.offsetWidth;
    nodo.classList.add('wn-cambia');
  }

  function crear(raiz, o) {
    const { u } = o;
    const { tx, numero, el, horaMin, duracion } = u;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);

    // Lo tocado en estos widgets y la app todavía no vio: las comidas de siempre y los vasos.
    const s = { momento: 'noche', tocadas: new Set(), vasos: 0, confirmada: false };
    const ms = () => (o.movimientoReducido ? 0 : 700);
    const lunas = [];
    const pintores = [];

    // ------------------------------------------------------------ lo de hoy
    const comidaSec = () => o.comida();
    function elDia() {
      const c = comidaSec();
      const anotadas = s.momento === 'noche' ? c.comidasDeHoy() : [];
      const filas = COMIDAS.map((tipo) => {
        const anotada = anotadas.find((x) => x.tipo === tipo) || null;
        const siempre = s.momento === 'primerDia' ? null : c.siempreDe(tipo);
        return { tipo, anotada, siempre, tocada: !anotada && !!siempre && s.tocadas.has(tipo) };
      });
      const suma = { kcal: 0, p: 0, c: 0, g: 0 };
      const sumar = (v) => { suma.kcal += v.kcal; suma.p += v.p; suma.c += v.c; suma.g += v.g; };
      anotadas.forEach((a) => sumar(a.valores));
      filas.forEach((f) => { if (f.tocada) sumar(f.siempre.valores); });
      const meta = c.meta;
      return { meta, suma, filas, queda: meta.kcal - suma.kcal, fraccion: meta.kcal ? suma.kcal / meta.kcal : 0, snack: anotadas.find((x) => x.tipo === 'snack') || null };
    }
    const macrosDe = (d) => MACROS.map(([k, clave]) => {
      const falta = d.meta[k] - d.suma[k];
      return { k, nombre: tx(clave), corto: tx('widgets.macroCorto.' + k), n: numero(Math.round(Math.abs(falta))), mas: falta < 0, f: Math.min(1, d.suma[k] / d.meta[k]) };
    });
    const gramos = (m) => `${m.mas ? '+' : ''}${m.n} g`;
    const etiquetaDe = (d) => tx(d.queda >= 0 ? 'inicio.teQuedan' : 'inicio.deMas');
    const cifraDe = (d) => numero(Math.abs(Math.round(d.queda)));
    const comidaDeAhora = () => (s.momento === 'noche' ? comidaSec().comidaDeAhora() : 'desayuno');

    function tocarComida(tipo) {
      if (s.tocadas.has(tipo)) s.tocadas.delete(tipo);
      else s.tocadas.add(tipo);
      pintar();
      o.alCambiar();
    }
    // Lo que hace el toque en una comida: «de siempre» se suma en el widget; lo demás abre Moss.
    function alTocarFila(f) {
      if (f.anotada) o.abrirMoss('comida');
      else if (f.siempre) tocarComida(f.tipo);
      else o.abrirMoss('comida', { tipo: f.tipo });
    }

    const nuevaLuna = (tam) => {
      const l = Luna.crear({ tam });
      const sitio = el('span', 'wn-luna-sitio');
      sitio.appendChild(l.el);
      lunas.push(l);
      return { l, sitio };
    };
    const conFondo = (w, velo) => {
      w.insertAdjacentHTML('afterbegin', `<div class="wn-capa wn-noche"></div><div class="wn-capa wn-aurora"></div>${velo ? '<div class="wn-velo"></div>' : ''}`);
      return w;
    };
    const barra = (m) => `<span class="wn-barra"><i></i></span>`;

    // ------------------------------------------------------------ Hoy, chico
    function hoyChico() {
      const w = conFondo(el('div', 'wg-w chico wn-hoy wn-tenue'));
      const dentro = el('div', 'wn-dentro');
      const { l, sitio } = nuevaLuna(56);
      const arriba = el('div', 'wn-arriba');
      const mas = el('span', 'wn-mas wn-ic');
      mas.innerHTML = icono('mas');
      arriba.append(sitio, mas);
      const etq = el('span', 'wn-etq');
      const fila = el('div', 'wn-cifra-fila');
      const cifra = el('b', 'wn-cifra');
      fila.append(cifra, el('small', null, 'kcal'));
      const tres = el('div', 'wn-tres');
      const celdas = MACROS.map(([k]) => {
        const c = el('div', `wn-m-${k}`);
        c.innerHTML = `<b><span></span><em style="font-style:normal"></em></b>${barra()}`;
        tres.appendChild(c);
        return c;
      });
      dentro.append(arriba, el('div', 'wn-empuje'), etq, fila, tres);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('comida', { tipo: comidaDeAhora() }));
      const pintar = (d, animar) => {
        l.ir(d.fraccion, animar ? ms() : 0);
        w.classList.toggle('de-mas', d.queda < 0);
        poner(etq, etiquetaDe(d));
        poner(cifra, cifraDe(d));
        macrosDe(d).forEach((m, i) => {
          celdas[i].querySelector('span').textContent = m.corto;
          poner(celdas[i].querySelector('em'), `${m.mas ? '+' : ''}${m.n}`);
          celdas[i].classList.toggle('de-mas', m.mas);
          celdas[i].querySelector('.wn-barra i').style.setProperty('--f', `${(m.f * 100).toFixed(1)}%`);
        });
      };
      pintores.push(pintar);
      return w;
    }

    // ------------------------------------------------------------ Hoy, mediano
    function hoyMediano() {
      const w = conFondo(el('div', 'wg-w mediano wn-hoy wn-tenue'));
      const dentro = el('div', 'wn-dentro');
      const { l, sitio } = nuevaLuna(74);
      const arriba = el('div', 'wn-med');
      const cifras = el('div', 'wn-cifras');
      const etq = el('span', 'wn-etq');
      const fila = el('div', 'wn-cifra-fila');
      const cifra = el('b', 'wn-cifra');
      fila.append(cifra, el('small', null, 'kcal'));
      cifras.append(etq, fila);
      const lista = el('div', 'wn-lista-macros');
      const celdas = MACROS.map(([k]) => {
        const c = el('div', `wn-m-${k}`);
        c.innerHTML = `<span></span><b></b>${barra()}`;
        lista.appendChild(c);
        return c;
      });
      arriba.append(sitio, cifras, lista);
      const chips = el('div', 'wn-chips');
      const botones = COMIDAS.map((tipo) => {
        const b = el('button', 'wn-chip');
        b.type = 'button';
        b.innerHTML = '<span></span><b></b>';
        b.addEventListener('click', (ev) => { ev.stopPropagation(); alTocarFila(elDia().filas.find((f) => f.tipo === tipo)); });
        chips.appendChild(b);
        return b;
      });
      dentro.append(arriba, chips);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      const pintar = (d, animar) => {
        l.ir(d.fraccion, animar ? ms() : 0);
        w.classList.toggle('de-mas', d.queda < 0);
        poner(etq, etiquetaDe(d));
        poner(cifra, cifraDe(d));
        macrosDe(d).forEach((m, i) => {
          celdas[i].querySelector('span').textContent = m.nombre;
          poner(celdas[i].querySelector('b'), gramos(m));
          celdas[i].classList.toggle('de-mas', m.mas);
          celdas[i].querySelector('.wn-barra i').style.setProperty('--f', `${(m.f * 100).toFixed(1)}%`);
        });
        d.filas.forEach((f, i) => pintarChip(botones[i], f));
      };
      pintores.push(pintar);
      return w;
    }
    const estadoDe = (f) => (f.anotada ? 'anotada' : f.tocada ? 'tocada' : f.siempre ? 'siempre' : 'vacia');
    function pintarChip(b, f) {
      const estado = estadoDe(f);
      ['anotada', 'tocada', 'siempre', 'vacia'].forEach((x) => b.classList.toggle(x, x === estado));
      const nombre = tx('widgets.comidaCorta.' + f.tipo);
      b.querySelector('span').textContent = nombre;
      const valor = b.querySelector('b');
      const k = (v) => numero(Math.round(v.kcal));
      if (estado === 'tocada') valor.innerHTML = `<span class="wn-ic" style="display:block">${icono('listo')}</span>${k(f.siempre.valores)}`;
      else valor.textContent = estado === 'anotada' ? k(f.anotada.valores) : estado === 'siempre' ? `+${k(f.siempre.valores)}` : '+';
      b.setAttribute('aria-label', `${nombre}: ${valor.textContent}`);
      b.setAttribute('aria-pressed', String(estado === 'tocada'));
    }

    // ------------------------------------------------------------ Hoy, grande
    function hoyGrande() {
      const w = conFondo(el('div', 'wg-w grande wn-hoy wn-tenue'));
      const dentro = el('div', 'wn-dentro');
      const { l, sitio } = nuevaLuna(92);
      const arriba = el('div', 'wn-gr');
      const cifras = el('div', 'wn-cifras');
      const etq = el('span', 'wn-etq');
      const fila = el('div', 'wn-cifra-fila');
      const cifra = el('b', 'wn-cifra');
      fila.append(cifra, el('small', null, 'kcal'));
      const de = el('small', 'wn-de');
      cifras.append(etq, fila, de);
      arriba.append(sitio, cifras);
      const tres = el('div', 'wn-tres-gr');
      const celdas = MACROS.map(([k]) => {
        const c = el('div', `wn-m-${k}`);
        c.innerHTML = `<span></span><b></b>${barra()}`;
        tres.appendChild(c);
        return c;
      });
      const filas = el('div', 'wn-filas');
      const acciones = el('div', 'wn-acciones');
      [['lupa', 'buscar'], ['microfono', 'decir'], ['codigo', 'codigo']].forEach(([ic, via]) => {
        const b = el('button', 'wn-accion');
        b.type = 'button';
        b.dataset.via = via;
        b.innerHTML = `<span class="wn-ic">${icono(ic)}</span><span></span>`;
        b.addEventListener('click', (ev) => { ev.stopPropagation(); o.abrirMoss('comida', { tipo: comidaDeAhora(), via }); });
        acciones.appendChild(b);
      });
      dentro.append(arriba, tres, filas, acciones);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      const nodos = new Map();
      const pintar = (d, animar) => {
        l.ir(d.fraccion, animar ? ms() : 0);
        w.classList.toggle('de-mas', d.queda < 0);
        poner(etq, etiquetaDe(d));
        poner(cifra, cifraDe(d));
        poner(de, tx('inicio.kcalDe', { comido: numero(Math.round(d.suma.kcal)), meta: numero(d.meta.kcal) }).replace(/^kcal · /, ''));
        macrosDe(d).forEach((m, i) => {
          celdas[i].querySelector('span').textContent = m.nombre;
          poner(celdas[i].querySelector('b'), gramos(m));
          celdas[i].classList.toggle('de-mas', m.mas);
          celdas[i].querySelector('.wn-barra i').style.setProperty('--f', `${(m.f * 100).toFixed(1)}%`);
        });
        const hora = (f) => (f.anotada ? f.anotada.hora : Comidas.HORA_TIPICA[f.tipo]);
        const lista = (d.snack ? [...d.filas, { tipo: 'snack', anotada: d.snack, siempre: null, tocada: false }] : d.filas).slice().sort((a, b) => hora(a) - hora(b));
        lista.forEach((f) => {
          let b = nodos.get(f.tipo);
          if (!b) {
            b = el('button', 'wn-fila');
            b.type = 'button';
            b.innerHTML = '<b></b><span></span><em></em><i class="wn-ic"></i>';
            b.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const hoy = elDia();
              alTocarFila(hoy.filas.find((x) => x.tipo === f.tipo) || { anotada: hoy.snack });
            });
            nodos.set(f.tipo, b);
          }
          filas.appendChild(b);
          pintarFila(b, f);
        });
        if (!d.snack && nodos.has('snack')) nodos.get('snack').remove();
        acciones.querySelectorAll('button').forEach((b) => { b.lastElementChild.textContent = tx('widgets.acciones.' + b.dataset.via); });
      };
      pintores.push(pintar);
      return w;
    }
    function pintarFila(b, f) {
      const estado = estadoDe(f);
      ['anotada', 'tocada', 'siempre', 'vacia'].forEach((x) => b.classList.toggle(x, x === estado));
      b.children[0].textContent = tx('widgets.comidaCorta.' + f.tipo);
      const lista = f.anotada ? f.anotada.nombres : f.siempre ? f.siempre.nombres : [];
      b.children[1].textContent = lista.length ? lista.join(', ') : tx('widgets.sinAnotar');
      const v = f.anotada ? f.anotada.valores : f.siempre ? f.siempre.valores : null;
      poner(b.children[2], !v ? '' : `${estado === 'siempre' ? '+' : ''}${numero(Math.round(v.kcal))}`);
      b.children[3].innerHTML = icono(estado === 'anotada' || estado === 'tocada' ? 'listo' : 'mas');
      b.setAttribute('aria-pressed', String(estado === 'tocada'));
    }

    // ------------------------------------------------------------ Anotar
    const ACCIONES = [['lupa', 'buscar'], ['microfono', 'decir'], ['codigo', 'codigo'], ['etiqueta', 'etiqueta']];
    function anotarMediano() {
      const w = conFondo(el('div', 'wg-w mediano wn-tenue'));
      const dentro = el('div', 'wn-dentro');
      const cab = el('div', 'wn-an-cab');
      const titulo = el('b');
      const queda = el('span');
      cab.append(titulo, queda);
      const fila = el('div', 'wn-an-fila');
      ACCIONES.forEach(([ic, via]) => {
        const b = el('button', 'wn-tile');
        b.type = 'button';
        b.dataset.via = via;
        b.innerHTML = `<span class="wn-ic">${icono(ic)}</span><span></span>`;
        b.addEventListener('click', (ev) => { ev.stopPropagation(); o.abrirMoss('comida', { tipo: comidaDeAhora(), via }); });
        fila.appendChild(b);
      });
      dentro.append(cab, fila);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('comida', { tipo: comidaDeAhora() }));
      pintores.push((d) => {
        poner(titulo, tx('widgets.anotarComida.' + comidaDeAhora()));
        poner(queda, tx(d.queda >= 0 ? 'widgets.teQuedanCorto' : 'widgets.deMasCorto', { n: cifraDe(d) }));
        fila.querySelectorAll('button').forEach((b) => { b.lastElementChild.textContent = tx('widgets.acciones.' + b.dataset.via); });
      });
      return w;
    }
    function decirChico() {
      const w = conFondo(el('div', 'wg-w chico wn-tenue'));
      w.insertAdjacentHTML('beforeend', `<div class="wn-dentro"><div class="wn-solo"><span class="wn-ic">${icono('microfono')}</span><b></b></div></div>`);
      w.addEventListener('click', () => o.abrirMoss('comida', { tipo: comidaDeAhora(), via: 'decir' }));
      pintores.push(() => { poner(w.querySelector('b'), tx('comida.decir.titulo')); });
      return w;
    }

    // ------------------------------------------------------------ El agua
    function aguaChico() {
      const w = conFondo(el('div', 'wg-w chico wn-tenue wn-agua'));
      const dentro = el('div', 'wn-dentro');
      const cab = el('div', 'wn-agua-cab');
      cab.innerHTML = `<span class="wn-ic">${icono('gota')}</span><span class="wn-etq"></span>`;
      const cifra = el('b', 'wn-cifra');
      const de = el('small', 'wn-de');
      const pista = el('span', 'wn-barra');
      pista.innerHTML = '<i></i>';
      const botones = el('div', 'wn-agua-botones');
      const menos = el('button', 'wn-redondo wn-ic');
      menos.type = 'button';
      menos.innerHTML = icono('menos');
      const mas = el('button', 'wn-redondo fuerte wn-ic');
      mas.type = 'button';
      mas.innerHTML = icono('mas');
      const cambiar = (n) => (ev) => {
        ev.stopPropagation();
        const base = aguaBase();
        s.vasos = Math.max(-base, Math.min(MAX_VASOS - base, s.vasos + n));
        pintar();
        o.alCambiar();
      };
      menos.addEventListener('click', cambiar(-1));
      mas.addEventListener('click', cambiar(1));
      botones.append(menos, mas);
      dentro.append(cab, cifra, de, pista, botones);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      pintores.push(() => {
        const a = comidaSec().agua();
        const vasos = aguaBase() + s.vasos;
        cab.lastElementChild.textContent = tx('widgets.agua');
        poner(cifra, `${numero(vasos * 0.25, vasos % 4 ? 2 : 0)} L`);
        poner(de, tx('widgets.vasos', { n: vasos, total: a.vasosMeta }));
        pista.firstElementChild.style.setProperty('--f', `${Math.min(100, (vasos / a.vasosMeta) * 100).toFixed(1)}%`);
        menos.disabled = vasos <= 0;
        menos.setAttribute('aria-label', tx('widgets.quitarVaso'));
        mas.setAttribute('aria-label', tx('mas.sumarVaso'));
      });
      return w;
    }
    const aguaBase = () => (s.momento === 'noche' ? comidaSec().agua().vasos : 0);

    // ------------------------------------------------------------ La noche, en la pantalla de inicio
    function nocheChico() {
      const w = conFondo(el('div', 'wg-w chico wn-tenue wn-w-noche'));
      const dentro = el('div', 'wn-dentro');
      const cab = el('div', 'wn-noche-cab');
      cab.innerHTML = `<span class="wn-etq"></span><span class="wn-ic">${icono('sueno')}</span>`;
      const cifra = el('b', 'wn-cifra');
      const de = el('small', 'wn-de');
      const si = el('button', 'wn-si');
      si.type = 'button';
      si.innerHTML = `<span class="wn-ic">${icono('listo')}</span><span></span>`;
      si.addEventListener('click', (ev) => {
        ev.stopPropagation();
        s.confirmada = true;
        pintar();
        o.alCambiar();
      });
      const para = el('p', 'wn-para');
      dentro.append(cab, cifra, de, si, para);
      w.appendChild(dentro);
      w.addEventListener('click', () => o.abrirMoss('sueno'));
      pintores.push(() => {
        const n = anoche();
        const deNoche = s.momento === 'noche';
        cab.firstElementChild.textContent = tx(deNoche ? 'widgets.aDormir' : 'widgets.anoche');
        if (deNoche) {
          poner(cifra, horaMin(A_DORMIR));
          poner(de, tx('widgets.enTiempo', { tiempo: duracion(A_DORMIR - AHORA) }));
          para.textContent = tx('widgets.paraDespertar', { hora: horaMin(DESPERTAR) });
        } else {
          poner(cifra, n ? tx('widgets.horasCorto', { h: Math.floor(n.dormido / 60), m: String(Math.round(n.dormido % 60)).padStart(2, '0') }) : '—');
          poner(de, n ? tx('widgets.horas', { desde: horaMin(n.dormirse), hasta: horaMin(n.despertar) }) : tx('widgets.seVeEnMoss'));
        }
        const pregunta = !deNoche && o.sinReloj() && !!n;
        para.hidden = !deNoche;
        si.hidden = !pregunta;
        si.classList.toggle('lista', s.confirmada);
        si.lastElementChild.textContent = s.confirmada ? tx('widgets.confirmada') : tx('widgets.siFueAsi');
      });
      return w;
    }
    const anoche = () => o.anoche();

    // ------------------------------------------------------------ El cielo
    let figuras = 0;
    // La figura encajada en W × H con su proporción. En el iPhone: rectángulos finos girados, círculos
    // y el símbolo «sparkle» para los rayos; acá, lo mismo en SVG.
    function figura(W, H, k = 1, margen = 10) {
      const id = `wn-f${++figuras}`;
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('class', 'wn-figura');
      svg.setAttribute('width', W);
      svg.setAttribute('height', H);
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('aria-hidden', 'true');
      let firma = '';
      let grupos = [];
      let lineas = [];
      const armar = (d) => {
        const estrellas = d.constelacion.estrellas.slice(0, Math.max(1, d.habitos.length));
        const plano = Escena.proyectar(estrellas);
        const xs = plano.map((p) => p[0]);
        const ys = plano.map((p) => p[1]);
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        const esc = Math.min((W - 2 * margen) / Math.max(x1 - x0, 1e-6), (H - 2 * margen) / Math.max(y1 - y0, 1e-6));
        const pos = plano.map(([x, y]) => [W / 2 + (x - (x0 + x1) / 2) * esc, H / 2 - (y - (y0 + y1) / 2) * esc]);
        svg.innerHTML = `<defs><radialGradient id="${id}"><stop class="halo-c" offset="0" stop-opacity="0.7"/><stop class="halo-c" offset="1" stop-opacity="0"/></radialGradient></defs>`;
        lineas = d.constelacion.lineas.filter(([a, b]) => a < pos.length && b < pos.length).map(([a, b]) => {
          const l = document.createElementNS(SVG, 'line');
          l.setAttribute('x1', pos[a][0]);
          l.setAttribute('y1', pos[a][1]);
          l.setAttribute('x2', pos[b][0]);
          l.setAttribute('y2', pos[b][1]);
          svg.appendChild(l);
          return { l, a, b };
        });
        grupos = pos.map(([x, y], i) => {
          const t = Math.max(0, Math.min(1, (2.2 - 0.5 * estrellas[i].mag) / 2.5));
          const r = (1.25 + 0.95 * t) * k;
          const ray = (5 + 4.5 * t) * k;
          const c = ray * 0.1;
          const g = document.createElementNS(SVG, 'g');
          g.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
          g.innerHTML = `<circle class="halo" r="${(ray * 1.5).toFixed(2)}" fill="url(#${id})"/>`
            + `<path class="rayos" d="M0 ${-ray}Q${c} ${-c} ${ray} 0Q${c} ${c} 0 ${ray}Q${-c} ${c} ${-ray} 0Q${-c} ${-c} 0 ${-ray}Z"/>`
            + `<circle class="nucleo" r="${r.toFixed(2)}"/>`;
          svg.appendChild(g);
          return g;
        });
      };
      return {
        el: svg,
        pintar(d) {
          const nueva = `${d.constelacion.id}:${d.habitos.length}`;
          if (nueva !== firma) { firma = nueva; armar(d); }
          grupos.forEach((g, i) => g.classList.toggle('encendida', !!(d.habitos[i] && d.habitos[i].hecho)));
          lineas.forEach(({ l, a, b }) => l.classList.toggle('unida', !!(d.habitos[a] && d.habitos[a].hecho && d.habitos[b] && d.habitos[b].hecho)));
        },
      };
    }
    function pieDelCielo() {
      const pie = el('div', 'wn-pie');
      const cuenta = el('div', 'wg-cuenta');
      const nombre = el('div', 'wg-nombre');
      pie.append(cuenta, nombre);
      return {
        el: pie,
        pintar(d) {
          poner(cuenta, tx('widgets.cuenta', { n: d.habitos.filter((h) => h.hecho).length, total: d.habitos.length }));
          nombre.textContent = o.nombreDe(d.constelacion.nombres);
        },
      };
    }
    const estaCompleto = (d) => d.habitos.length > 0 && d.habitos.every((h) => h.hecho);

    function cieloChico() {
      const w = conFondo(el('div', 'wg-w chico wn-c'), true);
      const dentro = el('div', 'wn-dentro');
      const f = figura(126, 92);
      const pie = pieDelCielo();
      dentro.append(f.el, pie.el);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('habitos'));
      pintores.push(() => {
        const d = o.hoy();
        if (!d) return;
        f.pintar(d);
        pie.pintar(d);
        w.classList.toggle('completo', estaCompleto(d));
      });
      return w;
    }

    function botonDeHabito(h) {
      const b = el('button', 'wg-boton');
      b.type = 'button';
      b.append(el('i', 'wg-circulo'), el('span'));
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (b.classList.contains('solo')) o.abrirMoss('habitos');
        else o.tocarHabito(Number(b.dataset.i));
      });
      return b;
    }
    function pintarBoton(b, h) {
      b.dataset.i = h.indice;
      b.classList.toggle('hecho', h.hecho);
      b.classList.toggle('solo', !h.aMano);
      b.setAttribute('aria-pressed', String(h.hecho));
      b.lastElementChild.textContent = h.nombre;
    }

    function cieloMediano() {
      const w = conFondo(el('div', 'wg-w mediano wn-c'), true);
      const dentro = el('div', 'wn-c-med');
      const izq = el('div', 'wn-c-izq');
      const f = figura(150, 98);
      const pie = pieDelCielo();
      izq.append(f.el, pie.el);
      const lista = el('div', 'wg-lista');
      const botones = Array.from({ length: MAX_FILAS_MEDIANO }, () => botonDeHabito());
      dentro.append(izq, lista);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('habitos'));
      pintores.push(() => {
        const d = o.hoy();
        if (!d) return;
        f.pintar(d);
        pie.pintar(d);
        w.classList.toggle('completo', estaCompleto(d));
        // Lo que falta, primero. El orden sale de lo que dijo la app y no de lo tocado: lo recién
        // tocado queda en su lugar, para poder deshacerlo.
        const aMano = d.habitos.filter((h) => h.aMano).sort((a, b) => Number(a.base) - Number(b.base)).slice(0, MAX_FILAS_MEDIANO);
        botones.forEach((b, i) => {
          if (aMano[i]) { pintarBoton(b, aMano[i]); if (!b.parentNode) lista.appendChild(b); } else b.remove();
        });
      });
      return w;
    }

    function cieloGrande() {
      const w = conFondo(el('div', 'wg-w grande wn-c'), true);
      const dentro = el('div', 'wn-dentro');
      const f = figura(306, 178, 1.3, 12);
      const pie = pieDelCielo();
      pie.el.style.marginTop = '4px';
      const lista = el('div', 'wn-c-gr-lista');
      const botones = new Map();
      dentro.append(f.el, pie.el, lista);
      w.appendChild(dentro);
      w.setAttribute('aria-label', 'Moss');
      w.addEventListener('click', () => o.abrirMoss('habitos'));
      pintores.push(() => {
        const d = o.hoy();
        if (!d) return;
        f.pintar(d);
        pie.pintar(d);
        w.classList.toggle('completo', estaCompleto(d));
        lista.classList.toggle('cuatro', d.habitos.length > 6);
        d.habitos.slice(0, 8).forEach((h) => {
          let b = botones.get(h.indice);
          if (!b) { b = botonDeHabito(); botones.set(h.indice, b); lista.appendChild(b); }
          pintarBoton(b, h);
        });
      });
      return w;
    }

    // ------------------------------------------------------------ La pantalla bloqueada
    function hoyRectangular() {
      const w = el('div', 'wg-noche sin-pregunta');
      const titulo = el('b');
      const valor = el('strong');
      const nota = el('small');
      w.append(titulo, valor, el('span'), nota);
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      pintores.push((d) => {
        titulo.textContent = etiquetaDe(d);
        poner(valor, `${cifraDe(d)} kcal`);
        poner(nota, macrosDe(d).map((m) => `${m.corto} ${m.mas ? '+' : ''}${m.n}`).join(' · '));
      });
      return w;
    }
    function hoyCircular() {
      const w = el('div', 'wn-circ wn-mono');
      const { l, sitio } = nuevaLuna(50);
      const cifra = el('b');
      w.append(sitio, cifra);
      w.addEventListener('click', () => o.abrirMoss('inicio'));
      pintores.push((d, animar) => {
        l.ir(d.fraccion, animar ? ms() : 0);
        poner(cifra, cifraDe(d));
      });
      return w;
    }
    function masCircular() {
      const w = el('div', 'wn-circ mas');
      w.innerHTML = `<span class="wn-ic">${icono('mas')}</span>`;
      w.addEventListener('click', () => o.abrirMoss('comida', { tipo: comidaDeAhora() }));
      return w;
    }
    function cieloCircular() {
      const w = el('div', 'wn-circ');
      const f = figura(50, 38, 0.72, 3);
      const cuenta = el('b');
      cuenta.style.fontSize = '11.5px';
      w.append(f.el, cuenta);
      w.addEventListener('click', () => o.abrirMoss('habitos'));
      pintores.push(() => {
        const d = o.hoy();
        if (!d) return;
        f.pintar(d);
        poner(cuenta, `${d.habitos.filter((h) => h.hecho).length}/${d.habitos.length}`);
      });
      return w;
    }
    function nocheRectangular() {
      const w = el('div', 'wg-noche');
      const titulo = el('b');
      const valor = el('strong');
      const si = el('button', 'wg-si');
      si.type = 'button';
      const nota = el('small');
      w.append(titulo, valor, si, nota);
      w.addEventListener('click', () => o.abrirMoss('sueno'));
      si.addEventListener('click', (ev) => {
        ev.stopPropagation();
        s.confirmada = true;
        pintar();
        o.alCambiar();
      });
      pintores.push(() => {
        const n = anoche();
        const deNoche = s.momento === 'noche';
        titulo.textContent = tx(deNoche ? 'widgets.aDormir' : 'widgets.anoche');
        poner(valor, deNoche ? horaMin(A_DORMIR) : n ? tx('widgets.horas', { desde: horaMin(n.dormirse), hasta: horaMin(n.despertar) }) : '—');
        si.textContent = tx('widgets.si');
        const pregunta = !deNoche && o.sinReloj() && !!n;
        w.classList.toggle('sin-pregunta', !pregunta || s.confirmada);
        w.classList.toggle('confirmada', pregunta && s.confirmada);
        poner(nota, deNoche ? tx('widgets.paraDespertar', { hora: horaMin(DESPERTAR) }) : !n ? tx('widgets.seVeEnMoss') : pregunta && !s.confirmada ? tx('widgets.fueAsi') : duracion(n.dormido));
      });
      return w;
    }
    function bloqueo(clase, piezas) {
      const v = el('div', `wg-vista ${clase}`);
      v.innerHTML = `<div class="wn-fecha"><span></span><i></i></div><div class="wg-reloj"></div><div class="wn-acc"></div>
        <div class="wg-abajo"><i>${icono('linterna')}</i><i>${icono('camara')}</i></div><div class="wg-barrita"></div>`;
      v.querySelector('.wn-acc').append(...piezas);
      pintores.push((d) => {
        v.querySelector('.wg-reloj').textContent = s.momento === 'noche' ? horaMin(AHORA).replace(/^0/, '') : '7:12';
        const p = u.partes(Datos.HOY);
        const dia = tx('fecha.dias.' + p.dia);
        v.querySelector('.wn-fecha span').textContent = `${dia.charAt(0).toUpperCase()}${dia.slice(1, 3)} ${p.num}`;
        v.querySelector('.wn-fecha i').textContent = `${cifraDe(d)} kcal`;
      });
      return v;
    }

    // ------------------------------------------------------------ las páginas
    const dock = raiz.querySelector('.wg-dock');
    function pagina(clase, filas) {
      const v = el('div', `wg-vista ${clase}`);
      const hora = el('div', 'wg-hora');
      const cont = el('div', 'wn-pagina');
      filas.forEach((f) => {
        if (Array.isArray(f)) {
          const dos = el('div', 'wn-dos');
          dos.append(...f);
          cont.appendChild(dos);
        } else cont.appendChild(f);
      });
      v.append(hora, cont);
      v.insertAdjacentHTML('beforeend', '<div class="wg-puntos"><i></i><i></i></div>');
      v.appendChild(dock.cloneNode(true));
      pintores.push(() => { hora.textContent = s.momento === 'noche' ? horaMin(AHORA) : '7:12'; });
      return v;
    }
    const standby = el('div', 'wg-vista wg-n-standby');
    const acostado = el('div', 'wg-acostado');
    acostado.append(hoyChico(), cieloChico());
    standby.appendChild(acostado);
    raiz.append(
      pagina('wg-n-comida', [[hoyChico(), aguaChico()], hoyMediano(), anotarMediano()]),
      pagina('wg-n-comidagrande', [hoyGrande(), [decirChico(), nocheChico()]]),
      pagina('wg-n-cielo', [[cieloChico(), nocheChico()], cieloMediano()]),
      pagina('wg-n-cielogrande', [cieloGrande()]),
      bloqueo('wg-n-bloqueo', [nocheRectangular(), hoyCircular(), cieloCircular()]),
      bloqueo('wg-n-bloqueo2', [hoyRectangular(), masCircular(), cieloCircular()]),
      standby,
    );

    let primera = true;
    function pintar() {
      const d = elDia();
      pintores.forEach((p) => p(d, !primera));
      primera = false;
    }

    return {
      pintar,
      get momento() { return s.momento; },
      ponerMomento(m) {
        s.momento = m;
        s.tocadas.clear();
        s.vasos = 0;
        s.confirmada = false;
        pintar();
      },
      tocarComida,
      vasos(n) { s.vasos += n; pintar(); },
      get confirmada() { return s.confirmada; },
      olvidar() { s.tocadas.clear(); s.vasos = 0; s.confirmada = false; pintar(); },
      // Lo que Moss aplica al abrirse. Solo el día de mentira de «noche» es el de la app de la galería.
      sacarPendientes() {
        const r = s.momento === 'noche' ? { comidas: [...s.tocadas], vasos: s.vasos } : { comidas: [], vasos: 0 };
        s.tocadas.clear();
        s.vasos = 0;
        return r;
      },
    };
  }

  return { crear };
})();
