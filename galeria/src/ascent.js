// La sección de Ascent (spec/ascent.md, «Ascent en Progreso», para aprobar), arriba de Progreso: arriba de todo
// del scroll de Progreso, arrastrar para abajo la baja siguiendo al dedo, como se sube a tu universo desde
// Hábitos, y su planeta crece hasta ser el horizonte. En el encabezado de Progreso está la entrada: el planeta
// de Ascent con una órbita que es tu recuperación de hoy y la luna de Moss en la punta, con la sesión debajo;
// arriba de todo asoma el borde del planeta. Se vuelve empujando para arriba abajo de todo, con la flecha de
// arriba, con «Volver a Progreso» o tocando Progreso.
// Tiene el lenguaje de Ascent (spec/estetica.md de su repo): un número grande sin caja, línea y aire,
// octágono donde algo es la acción, píldora para lo que se elige y lo secundario subrayado.
// Vinculada: cuánto estás recuperado (Recuperado y Fatiga), en qué concentrarte hoy (Diagnostico.focoDeHoy),
// las tres partes con su franja y qué hacer, la fatiga de cada músculo por día de la rutina, las marcas
// posibles, las razones de estancamiento (Estancados), tu año, lo que comparten las dos y cómo se calcula.
// Sin vincular, cada cosa se ve vacía, con su candado. La invitación de Inicio sale de SenalDeAscent.

const SeccionAscent = (() => {
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  // La hora de cada comida, si no se anotó: la típica de la app.
  const HORA_DE_COMIDA = Comidas.HORA_TIPICA;
  // Lo de siempre de la persona de mentira: sin sesión hoy, la recuperación se mira a la hora de despertarse.
  const DESPERTAR = 7 * 60 + 30;
  const DORMIR = 23 * 60 + 30;
  // Lo que tarda en dormirse: lo que aprendió Moss, como dice Perfil › Avisos.
  const LATENCIA = 20;
  // El planeta, en píxeles sobre la barra, cuando es el horizonte.
  const HORIZONTE_PX = 74;
  // El borde del planeta que asoma arriba de Progreso: cuánto se ve quieto y cuánto baja con el dedo.
  const TECHO_PX = 7;
  const TECHO_BAJA = 150;
  // Hasta dónde llega la barra de cada músculo, en %: cargado es desde el 10.
  const TOPE_MUSCULO = 15;
  // Cada razón de estancamiento en su escala (las de porQueNoSube) para dibujar la distancia.
  const ESCALAS = Entrenamiento.ESCALAS;
  // Los grupos del mapa del año, en el orden de la leyenda.
  const GRUPOS_DEL_ANIO = ['pecho', 'piernas', 'espalda'];

  const CORTE = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% calc(100% - ${c}px), calc(100% - ${c}px) 100%, ${c}px 100%, 0 calc(100% - ${c}px), 0 ${c}px)`;
  const CORTE_ARRIBA = (c) => `polygon(${c}px 0, calc(100% - ${c}px) 0, 100% ${c}px, 100% 100%, 0 100%, 0 ${c}px)`;

  // Las franjas van de gris oscuro a crema, más claras cuanto mejor; solo «atención» tiene color (como Oura).
  // Los grupos del año, tres tonos apagados que pasan las comprobaciones de la skill dataviz de a pares
  // (daltonismo y visión normal) sobre el fondo de Ascent.
  const CSS = `
.tel .ascent, .as-entrada, .as-techo, .tel .hb.as-hoja {
  --as-fondo: #05060a; --as-hoja: #0b0d13; --as-tinta: #e8ecf6; --as-sub: #aab2c4; --as-apagado: #9098ab; --as-tenue: #4a5163;
  --as-linea: #303748; --as-linea-fuerte: #3e4659; --as-principal: #7e8ca8; --as-claro: #c4c2ba; --as-lejos: #cb8569;
  --as-f-atencion: #cb8569; --as-f-aceptable: #5a6176; --as-f-bien: #8b94aa; --as-f-muyBien: #d2cfc5;
  --as-g-pecho: #419ec6; --as-g-piernas: #a77e33; --as-g-espalda: #765190;
}
/* El cielo sigue detrás, como a tu universo; apenas oscurecido para leer. */
.tel .ascent { visibility: hidden; color: var(--as-tinta); will-change: transform; background: linear-gradient(180deg, rgba(5, 6, 10, 0.5) 0, rgba(5, 6, 10, 0.42) 240px, rgba(5, 6, 10, 0.6) 100%); }
.tel .ascent::after { display: none; }
.as-velo { position: absolute; inset: 0; z-index: 2; background: #020308; opacity: 0; pointer-events: none; }
.as-scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; padding: calc(var(--arriba) - 18px) 22px calc(var(--pestanas) + ${HORIZONTE_PX + 34}px); scrollbar-width: none; touch-action: pan-y;
  --hasta: calc(100% - var(--pestanas) - ${HORIZONTE_PX + 10}px); --hundido: calc(100% - var(--pestanas) - ${HORIZONTE_PX - 52}px);
  -webkit-mask-image: linear-gradient(180deg, #000 var(--hasta), transparent var(--hundido)); mask-image: linear-gradient(180deg, #000 var(--hasta), transparent var(--hundido)); }
.as-scroll::-webkit-scrollbar { display: none; }
.as-arriba { position: relative; display: grid; justify-items: center; height: 30px; }
.as-volver { appearance: none; cursor: pointer; width: 64px; height: 30px; padding: 0; border: 0; background: none; color: var(--as-apagado); display: grid; place-items: center; }
.as-volver svg { width: 22px; height: 22px; stroke-width: 1.5; }

/* La marca: el planeta con su órbita abierta y la luna de Moss, afuera hasta que se vinculan. */
.pagina-app svg.as-marca, .pagina-app svg.as-marca-chica { stroke: none; fill: none; }
.as-marca { overflow: visible; }
.as-arriba .as-marca { position: absolute; right: -6px; top: 36px; width: 76px; height: 76px; transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1), height 0.7s cubic-bezier(0.16, 1, 0.3, 1), top 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.ascent.vinculada .as-arriba .as-marca { top: 24px; width: 46px; height: 46px; }
.as-planeta-borde { fill: none; stroke: rgba(232, 236, 246, 0.2); stroke-width: 0.8; }
.as-orbita { fill: none; stroke-linecap: round; transition: opacity 0.9s ease; }
.as-orbita-sin { stroke: rgba(170, 178, 196, 0.8); stroke-width: 1.8; stroke-dasharray: 0.4 6; }
.as-orbita-con { stroke: #c4c2ba; stroke-width: 2; opacity: 0; }
.as-marca.unida .as-orbita-sin { opacity: 0; }
.as-marca.unida .as-orbita-con { opacity: 0.85; }
.as-luna { transform: translate(51px, -36px); opacity: 0.7; transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s; }
.as-marca.unida .as-luna { transform: translate(36.04px, -25.24px); opacity: 1; }
.as-luna-halo { fill: rgba(246, 236, 210, 0.22); filter: blur(3px); opacity: 0; transition: opacity 1s 0.4s; }
.as-marca.unida .as-luna-halo { opacity: 1; }
.as-marca-chica { width: 24px; height: 24px; flex: none; overflow: visible; }
.as-chica-planeta { stroke: rgba(232, 236, 246, 0.4); stroke-width: 0.7; }
.as-chica-orbita { fill: none; stroke-width: 1; stroke-linecap: round; transition: opacity 0.9s ease; }
.as-chica-sin { stroke: rgba(170, 178, 196, 0.9); stroke-dasharray: 0.1 2.3; }
.as-chica-con { stroke: #c4c2ba; opacity: 0; }
.as-chica-luna { fill: #f6ecd2; transform: translate(9.3px, -7px); opacity: 0.85; transition: transform 1.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s; }

/* El planeta de Ascent, que sube hasta ser el horizonte. Debajo de la barra; lo de Moss sigue arriba. */
.as-horizonte { position: absolute; left: 0; right: 0; bottom: 0; height: 62%; z-index: 2; overflow: hidden; pointer-events: none; visibility: hidden; --sube: 0px; --escala: 0.8; }
.as-horizonte i { position: absolute; left: 66%; top: calc(100% - var(--pestanas) - var(--sube)); width: 1180px; height: 1180px; margin-left: -590px; border-radius: 50%; background: radial-gradient(circle at 50% 0, #14161e 0, #0a0b11 34%, #05060a 62%); box-shadow: 0 0 30px rgba(196, 194, 186, 0.13), inset 0 18px 44px rgba(196, 194, 186, 0.07); transform: scale(var(--escala)); transform-origin: 50% 0; will-change: transform, top; }
.as-horizonte i::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from -40deg, rgba(232, 228, 212, 0.12) 0deg, rgba(232, 228, 212, 0.86) 24deg, rgba(232, 228, 212, 0.34) 46deg, rgba(232, 228, 212, 0.04) 70deg, rgba(232, 228, 212, 0) 320deg, rgba(232, 228, 212, 0.12) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }
.tel.hoja-anim > .as-horizonte { transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1); }
.tel.con-hoja > .as-horizonte { transform: scale(0.93); transform-origin: 50% 0; }

/* Arriba de Progreso asoma el borde del planeta, colgado: Ascent está arriba. Baja con el dedo. */
.as-techo { position: absolute; left: 0; right: 0; top: 0; height: 190px; z-index: 2; overflow: hidden; pointer-events: none; opacity: 0; --baja: 0px; }
.as-techo i { position: absolute; left: 62%; bottom: calc(100% - ${TECHO_PX}px - var(--baja)); width: 760px; height: 760px; margin-left: -380px; border-radius: 50%; background: radial-gradient(circle at 50% 100%, #161922 0, #0b0c12 30%, #05060a 64%); box-shadow: 0 6px 28px rgba(196, 194, 186, 0.16); }
.as-techo i::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(from 120deg, rgba(232, 228, 212, 0) 0deg, rgba(232, 228, 212, 0.45) 34deg, rgba(232, 228, 212, 0.95) 58deg, rgba(232, 228, 212, 0.4) 82deg, rgba(232, 228, 212, 0) 118deg, rgba(232, 228, 212, 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.5px), #000 calc(100% - 1px)); }

/* La entrada, en el encabezado de Progreso: lo de hoy a la izquierda y el planeta con su órbita. */
.as-entrada { appearance: none; cursor: pointer; position: absolute; right: -6px; top: -8px; display: grid; grid-template-columns: auto 48px; align-items: center; column-gap: 9px; padding: 4px 6px 4px 10px; border: 0; background: none; color: var(--as-tinta); text-align: right; font: inherit; touch-action: none; }
.as-entrada-textos { display: grid; gap: 4px; justify-items: end; min-width: 0; }
.as-entrada-cifra { display: flex; align-items: baseline; gap: 5px; font: 300 21px/1 var(--numeros); letter-spacing: -0.01em; color: var(--as-claro); white-space: nowrap; }
.as-entrada-cifra span { font: 400 11.5px/1 var(--texto); letter-spacing: 0; color: var(--as-sub); }
.as-entrada.sin .as-entrada-cifra { font: 400 13.5px/1.15 var(--texto); color: var(--as-tinta); }
.as-entrada-sub { font: 400 11.5px/1.1 var(--texto); color: var(--as-sub); white-space: nowrap; }
.as-entrada-sub:empty { display: none; }
.as-entrada-pista { grid-column: 1 / -1; display: flex; align-items: center; justify-content: flex-end; gap: 4px; max-height: 18px; margin-top: 3px; overflow: hidden; font: 400 11px/1.2 var(--texto); color: var(--as-sub); transition: max-height 0.5s cubic-bezier(0.2, 0.7, 0.2, 1), opacity 0.4s, margin-top 0.5s; }
.as-entrada-pista svg { width: 13px; height: 13px; stroke-width: 1.8; animation: as-respira 2.8s ease-in-out infinite; }
.as-entrada.sin-pista .as-entrada-pista { max-height: 0; margin-top: 0; opacity: 0; }
@keyframes as-respira { 50% { transform: translateY(2px); opacity: 0.55; } }
.as-orbe { width: 48px; height: 48px; overflow: visible; stroke: none !important; fill: none; }
.as-orbe-pista { fill: none; stroke: rgba(170, 178, 196, 0.22); stroke-width: 1.6; transition: stroke 0.6s, stroke-dasharray 0.6s; }
.as-orbe-arco { fill: none; stroke: var(--as-claro); stroke-width: 2.2; stroke-linecap: round; stroke-dasharray: var(--arco, 0) 100; transition: stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.6s, opacity 0.6s; }
.as-entrada.atencion .as-orbe-arco { stroke: var(--as-f-atencion); }
.as-orbe-luna { transform: rotate(var(--giro, 0deg)) translateY(-19px); transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s; }
.as-orbe-halo { fill: rgba(246, 236, 210, 0.2); }
.as-entrada.sin .as-orbe-pista { stroke: rgba(170, 178, 196, 0.85); stroke-dasharray: 0.6 3.6; }
.as-entrada.sin .as-orbe-arco { opacity: 0; }
.as-entrada.sin .as-orbe-luna { transform: rotate(38deg) translateY(-25px); opacity: 0.75; }
.as-entrada:active .as-orbe { opacity: 0.75; }

.as-invita { display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: 12px; align-items: start; padding: 14px 16px 12px; border-radius: 20px; border: 1px solid rgba(138, 147, 168, 0.2); background: rgba(8, 12, 26, 0.72); color: #e8ecf6; overflow: hidden; }
.as-invita.entra { animation: as-entra 0.5s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
.pagina-app .as-invita svg.as-marca-chica { width: 40px; height: 40px; }
.as-invita-titulo { display: block; font: 400 14.5px/1.25 var(--texto); }
.as-invita-texto { margin: 4px 0 0; font: 400 12.5px/1.38 var(--texto); color: rgba(232, 236, 246, 0.62); }
.as-invita-acciones { grid-column: 2; display: flex; align-items: center; gap: 6px; margin-top: 10px; margin-left: -1px; }
.as-invita-si, .as-invita-no { appearance: none; cursor: pointer; height: 32px; border-radius: 999px; font: 400 13px/1 var(--texto); }
.as-invita-si { padding: 0 15px; border: 1px solid rgba(232, 236, 246, 0.42); background: none; color: #e8ecf6; }
.as-invita-si:active { background: rgba(232, 236, 246, 0.08); }
.as-invita-no { padding: 0 10px; border: 0; background: none; color: rgba(232, 236, 246, 0.62); }

.as-contenido.as-entra { animation: as-entra 0.6s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@keyframes as-entra { from { opacity: 0; transform: translateY(8px); } }
.as-etq { display: block; margin: 0; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }

/* Sin vincular: el título, la frase, la acción de la pantalla (un octágono) y lo secundario, subrayado. */
.as-cab { margin-top: 10px; padding-right: 78px; }
.as-titulo { margin: 8px 0 0; font: 200 46px/1 var(--numeros); letter-spacing: -0.02em; color: var(--as-claro); white-space: nowrap; }
.as-bajada { margin: 14px -78px 0 0; font: 400 15px/1.42 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-vincular { appearance: none; cursor: pointer; display: block; width: calc(100% + 78px); min-height: 52px; margin-top: 20px; border: 0; background: var(--as-claro); color: var(--as-fondo); font: 500 15px/1 var(--texto); letter-spacing: 0.01em; clip-path: ${CORTE(11)}; transition: background-color 0.15s; }
.as-vincular:active { background: #a9a79f; }
.as-conseguir { appearance: none; cursor: pointer; display: block; width: fit-content; margin: 18px auto 0; padding: 0 0 3px; border: 0; border-bottom: 1px solid rgba(232, 236, 246, 0.42); border-radius: 0; background: none; color: var(--as-tinta); font: 400 13.5px/1.2 var(--texto); }
.as-cab .as-conseguir { margin-left: calc(50% + 39px); translate: -50% 0; white-space: nowrap; }
.as-grupo { margin: 36px -22px 0; padding: 12px 22px 0; border-top: 1px solid var(--as-linea); font: 500 10.5px/1 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }

/* Cada parte cuelga de una línea de pelo, de borde a borde. */
.as-parte { margin: 30px -22px 0; padding: 14px 22px 0; border-top: 1px solid var(--as-linea); }
.as-grupo + .as-parte { margin-top: 12px; border-top: 0; padding-top: 6px; }
.as-parte-cab { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 22px; }
.as-derecha { font: 400 11.5px/1.2 var(--texto); color: var(--as-sub); font-variant-numeric: tabular-nums; text-align: right; }
.as-candado { flex: none; display: inline-flex; align-items: center; gap: 5px; padding: 4px 9px 4px 7px; border-radius: 999px; border: 1px solid var(--as-linea-fuerte); font: 400 10px/1 var(--texto); letter-spacing: 0.06em; color: var(--as-sub); }
.as-candado svg { width: 12px; height: 12px; stroke-width: 1.8; }
.as-una { margin: 6px 0 0; font: 400 13px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-nota { margin: 10px 0 0; font: 400 11.5px/1.38 var(--texto); color: var(--as-apagado); text-wrap: pretty; }
.as-enlace { appearance: none; cursor: pointer; display: block; width: fit-content; margin-top: 12px; padding: 0 0 3px; border: 0; border-bottom: 1px solid rgba(170, 178, 196, 0.42); border-radius: 0; background: none; color: var(--as-sub); font: 400 12.5px/1.2 var(--texto); text-align: left; }
.as-enlaces { display: flex; flex-wrap: wrap; gap: 0 18px; }
.as-explicacion { overflow: hidden; margin: 10px 0 0; font: 400 13px/1.45 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-explicacion p { margin: 0 0 8px; }

/* Cuánto estás recuperado: el número grande, sin caja, y la barra con sus cuatro franjas. */
.as-rec { margin-top: 2px; padding-right: 50px; }
.as-rec-estas { margin: 0; font: 400 17px/1.2 var(--texto); color: var(--as-sub); }
.as-rec-cifra { display: flex; align-items: baseline; margin: 2px 0 0 -5px; font: 200 116px/0.9 var(--numeros); letter-spacing: -0.045em; color: var(--as-claro); }
.as-rec-cifra small { margin-left: 8px; font: 200 42px/1 var(--numeros); letter-spacing: 0; color: var(--as-sub); }
.as-rec-cifra.vacia { color: var(--as-apagado); font-size: 86px; }
.as-rec-palabra { margin: 4px 0 0; font: 300 25px/1.1 var(--numeros); color: var(--as-tinta); }
.as-rec-desde { margin: 10px -50px 0 0; font: 400 13.5px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-rec .as-franjas { margin-right: -50px; }
.as-rec-frase { margin: 12px -50px 0 0; font: 400 15px/1.35 var(--texto); color: var(--as-tinta); }
.as-franjas { margin-top: 18px; }
.as-franjas-pista { position: relative; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; height: 6px; }
.as-franjas-pista > i { border-radius: 1px; opacity: 0.38; transition: opacity 0.5s; }
.as-franjas-pista > i.atencion { background: var(--as-f-atencion); }
.as-franjas-pista > i.aceptable { background: var(--as-f-aceptable); }
.as-franjas-pista > i.bien { background: var(--as-f-bien); }
.as-franjas-pista > i.muyBien { background: var(--as-f-muyBien); }
.as-franjas-pista > i.esta { opacity: 1; }
.as-franjas.vacia .as-franjas-pista > i { background: var(--as-linea-fuerte); opacity: 0.6; }
.as-franjas-punto { position: absolute; top: 50%; width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%; background: var(--as-tinta); box-shadow: 0 0 0 3px #090b11; transition: left 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
.as-franjas-nombres { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3px; margin-top: 9px; font: 400 11px/1.2 var(--texto); color: var(--as-apagado); }
.as-franjas-nombres span.esta { color: var(--as-tinta); }
.as-franjas-nombres span.esta.atencion { color: var(--as-lejos); }

/* Hoy, concéntrate en: cada cosa con su hora, en el orden del día. */
.as-foco { margin: 32px -22px 0; padding: 14px 22px 0; border-top: 1px solid var(--as-linea); }
.as-foco-lista { margin: 8px 0 0; padding: 0; list-style: none; }
.as-foco-item { display: grid; grid-template-columns: 50px minmax(0, 1fr); column-gap: 12px; padding: 12px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-foco-item:first-child { border-top: 0; padding-top: 6px; }
.as-foco-hora { padding-top: 1px; font: 300 17px/1.2 var(--numeros); color: var(--as-claro); font-variant-numeric: tabular-nums; }
.as-foco-hora.sin { font: 500 10px/1.9 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: var(--as-sub); }
.as-foco-titulo { display: block; font: 400 15.5px/1.3 var(--texto); color: var(--as-tinta); }
.as-foco-texto { margin: 3px 0 0; font: 400 13.5px/1.38 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-foco-item .as-enlace { margin-top: 8px; }

/* Las tres partes, en filas sin cajas: el nombre, el valor, la franja y una barra con las cuatro. */
.as-partes { margin: 30px -22px 0; padding: 14px 22px 0; border-top: 1px solid var(--as-linea); }
.as-fila { padding: 16px 0 18px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-etq + .as-fila, .as-etq + .as-una + .as-fila { border-top: 0; padding-top: 10px; }
.as-fila-cab { display: flex; align-items: baseline; gap: 9px; }
.as-fila-nombre { margin: 0; font: 400 16.5px/1.2 var(--texto); color: var(--as-tinta); }
.as-fila-valor { font: 300 15px/1 var(--numeros); color: var(--as-sub); font-variant-numeric: tabular-nums; white-space: nowrap; }
.as-fila-banda { margin-left: auto; font: 400 13.5px/1.2 var(--texto); color: var(--as-tinta); white-space: nowrap; }
.as-fila-banda.atencion { color: var(--as-lejos); }
.as-fila .as-franjas { margin-top: 11px; }
.as-fila .as-franjas-pista { height: 4px; gap: 2px; }
.as-fila .as-franjas-punto { width: 10px; height: 10px; margin: -5px 0 0 -5px; box-shadow: 0 0 0 2.5px #090b11; }
.as-fila-texto { margin: 11px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-fila-consejo { margin: 7px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-fila-consejo b { font-weight: 500; }
.as-fila .as-nota { margin-top: 7px; }
.as-fila .as-enlace { margin-top: 10px; }

/* La fatiga de cada músculo, por día de la rutina, sobre la misma escala y en palabras. */
.as-musc-eje { position: relative; height: 12px; margin: 14px 108px 0 88px; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-musc-eje span { position: absolute; top: 0; translate: -50% 0; }
.as-dia-rutina { margin-top: 14px; }
.as-dia-rutina-cab { display: flex; align-items: baseline; justify-content: space-between; margin: 0 0 2px; font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.16em; text-transform: uppercase; color: var(--as-sub); }
.as-dia-rutina-cab em { font: 400 11.5px/1 var(--texto); font-style: normal; letter-spacing: 0.02em; text-transform: none; color: var(--as-tinta); }
.as-musculos-lista { margin: 0; padding: 0; list-style: none; }
.as-musc { display: grid; grid-template-columns: 78px minmax(0, 1fr) 98px; align-items: center; column-gap: 10px; min-height: 38px; padding: 4px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-musc-nombre { font: 400 13px/1.15 var(--texto); color: var(--as-tinta); }
.as-musc-barra { position: relative; height: 4px; background: var(--as-linea); }
.as-musc-barra::before, .as-musc-barra::after { content: ''; position: absolute; top: -3px; width: 1px; height: 10px; background: var(--as-linea-fuerte); }
.as-musc-barra::before { left: ${((3 / TOPE_MUSCULO) * 100).toFixed(2)}%; }
.as-musc-barra::after { left: ${((10 / TOPE_MUSCULO) * 100).toFixed(2)}%; }
.as-musc-barra i { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 0 2px 2px 0; background: var(--as-claro); transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.as-musc.cargado .as-musc-barra i { background: var(--as-lejos); }
.as-musc-estado { display: grid; gap: 2px; justify-items: end; text-align: right; }
.as-musc-estado b { font: 400 12px/1.1 var(--texto); color: var(--as-tinta); }
.as-musc.cargado .as-musc-estado b { color: var(--as-lejos); }
.as-musc-estado small { font: 400 10.5px/1.1 var(--texto); color: var(--as-sub); }

/* Marcas: cada ejercicio de hoy con su probabilidad contra la línea de 35 %. */
.as-marca-fila { padding: 12px 0 13px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-marcas .as-una + .as-marca-fila { border-top: 0; }
.as-marca-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-marca-nombre { font: 400 15px/1.2 var(--texto); color: var(--as-tinta); }
.as-marca-prob { font: 300 17px/1 var(--numeros); color: var(--as-sub); font-variant-numeric: tabular-nums; }
.as-marca-fila.si .as-marca-prob { color: var(--as-claro); }
.as-marca-linea { margin: 5px 0 0; font: 400 13px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-marca-fila.si .as-marca-linea { color: var(--as-tinta); }
.as-medidor { position: relative; height: 16px; margin-top: 7px; }
.as-medidor-pista { position: absolute; left: 0; right: 0; top: 7px; height: 2px; background: var(--as-linea-fuerte); }
.as-medidor-tramo { position: absolute; left: 0; top: 7px; height: 2px; background: var(--as-apagado); transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.as-marca-fila.si .as-medidor-tramo { background: var(--as-claro); }
.as-medidor-corte { position: absolute; top: 1px; width: 1px; height: 14px; background: var(--as-sub); }
.as-medidor-punto { position: absolute; top: 3px; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: var(--as-apagado); box-shadow: 0 0 0 2px #090b11; transition: left 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
.as-marca-fila.si .as-medidor-punto { background: var(--as-claro); }
.as-medidor-eje { position: relative; height: 13px; margin-top: 1px; font: 400 10.5px/1 var(--texto); color: var(--as-apagado); }
.as-medidor-eje span { position: absolute; top: 0; translate: -50% 0; white-space: nowrap; }

/* Razones de estancamiento: cada ejercicio con sus razones, y en cada una antes y ahora. */
.as-estanc-ej { padding: 14px 0 6px; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-estanc-ej:first-of-type { margin-top: 8px; }
.as-estanc-ej-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-estanc-ej-nombre { font: 400 15.5px/1.2 var(--texto); color: var(--as-tinta); }
.as-estanc-ej-dato { font: 400 12.5px/1.2 var(--texto); color: var(--as-sub); white-space: nowrap; font-variant-numeric: tabular-nums; }
.as-razones { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 12px; }
.as-razon { display: grid; gap: 4px; }
.as-razon-cab { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.as-razon-cab b { font: 400 13.5px/1.3 var(--texto); color: var(--as-tinta); }
.as-razon-cab span { font: 400 12px/1.2 var(--numeros); color: var(--as-sub); white-space: nowrap; font-variant-numeric: tabular-nums; }
.as-razon p { margin: 0; font: 400 12.5px/1.35 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-razon-sin { margin: 10px 0 0; font: 400 13px/1.35 var(--texto); color: var(--as-sub); }
.as-definicion { margin: 12px 0 0; padding: 10px 0 0; font: 400 13.5px/1.4 var(--texto); color: var(--as-tinta); text-wrap: pretty; }
.as-pesa-pista { position: relative; height: 12px; }
.as-pesa-pista > i { position: absolute; }
.as-pesa-base { left: 0; right: 0; top: 5.5px; height: 1px; background: var(--as-linea); }
.as-pesa-tramo { top: 5px; height: 2px; background: var(--as-claro); }
.as-pesa-con, .as-pesa-ahora { top: 1.5px; width: 9px; height: 9px; margin-left: -4.5px; box-sizing: border-box; border-radius: 50%; box-shadow: 0 0 0 2px #090b11; }
.as-pesa-con { background: var(--as-claro); }
.as-pesa-ahora { background: #090b11; border: 1.5px solid var(--as-principal); }
.as-cuadros { display: inline-flex; gap: 5px; }
.as-cuadros i { width: 11px; height: 11px; box-sizing: border-box; border: 1px solid var(--as-apagado); }
.as-cuadros i.lleno { background: var(--as-lejos); border-color: var(--as-lejos); }
.as-leyenda { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 10px; font: 400 11px/1 var(--texto); color: var(--as-sub); }
.as-leyenda span::before { content: ''; display: inline-block; width: 8px; height: 8px; margin-right: 6px; vertical-align: -0.5px; box-sizing: border-box; border-radius: 50%; background: var(--as-linea-fuerte); }
.as-leyenda .as-leyenda-con::before { background: var(--as-claro); }
.as-leyenda .as-leyenda-ahora::before { background: none; border: 1.5px solid var(--as-principal); }
.as-juntando { display: grid; gap: 9px; margin-top: 12px; }
.as-juntando-fila { display: flex; align-items: center; justify-content: space-between; font: 400 13px/1 var(--texto); color: var(--as-sub); }
.as-juntando .as-cuadros i.lleno { background: var(--as-claro); border-color: var(--as-claro); }

/* Tu año: un día por cuadro, los meses en filas, con el color de lo que entrenaste y un punto en cada marca. */
.as-anio-mapa { display: grid; grid-template-columns: 24px repeat(31, minmax(0, 1fr)); gap: 2px 1.5px; margin-top: 14px; }
.as-anio-mes { align-self: center; font: 400 9.5px/1 var(--texto); color: var(--as-apagado); text-transform: capitalize; }
.as-anio-dia { position: relative; aspect-ratio: 1; border-radius: 1.5px; background: rgba(170, 178, 196, 0.1); }
.as-anio-dia.pecho { background: var(--as-g-pecho); }
.as-anio-dia.piernas { background: var(--as-g-piernas); }
.as-anio-dia.espalda { background: var(--as-g-espalda); }
.as-anio-dia.futuro { background: none; box-shadow: inset 0 0 0 1px rgba(170, 178, 196, 0.08); }
.as-anio-dia.nada { visibility: hidden; }
.as-anio-dia.hoy { box-shadow: 0 0 0 1.5px var(--as-tinta); }
.as-anio-dia.marca::after { content: ''; position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px 0 0 -2px; border-radius: 50%; background: #fbf8ef; box-shadow: 0 0 0 1px rgba(5, 6, 10, 0.55); }
.as-anio-dia.elegido { box-shadow: 0 0 0 1.5px var(--as-tinta); }
.as-anio-leyenda { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 12px; font: 400 11px/1 var(--texto); color: var(--as-sub); }
.as-anio-leyenda span { display: inline-flex; align-items: center; gap: 6px; }
.as-anio-leyenda i { width: 9px; height: 9px; border-radius: 1.5px; }
.as-anio-leyenda i.pecho { background: var(--as-g-pecho); } .as-anio-leyenda i.piernas { background: var(--as-g-piernas); } .as-anio-leyenda i.espalda { background: var(--as-g-espalda); }
.as-anio-leyenda i.descanso { background: rgba(170, 178, 196, 0.1); }
.as-anio-leyenda i.marca { position: relative; background: rgba(170, 178, 196, 0.25); }
.as-anio-leyenda i.marca::after { content: ''; position: absolute; left: 50%; top: 50%; width: 4px; height: 4px; margin: -2px 0 0 -2px; border-radius: 50%; background: #fbf8ef; }
.as-anio-detalle { min-height: 17px; margin: 10px 0 0; font: 400 12.5px/1.35 var(--texto); color: var(--as-tinta); }
.as-anio-ultimas { margin: 14px 0 0; padding: 0; list-style: none; display: grid; gap: 9px; }
.as-anio-ultima { display: grid; grid-template-columns: 9px minmax(0, 1fr) auto; align-items: baseline; column-gap: 10px; font: 400 13.5px/1.3 var(--texto); color: var(--as-tinta); }
.as-anio-ultima i { width: 9px; height: 9px; border-radius: 1.5px; }
.as-anio-ultima i.pecho { background: var(--as-g-pecho); } .as-anio-ultima i.piernas { background: var(--as-g-piernas); } .as-anio-ultima i.espalda { background: var(--as-g-espalda); }
.as-anio-ultima small { font: 400 12px/1.2 var(--texto); color: var(--as-sub); white-space: nowrap; }
.as-anio-grilla { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 10px; margin-top: 18px; }
.as-dato { display: grid; gap: 4px; align-content: start; min-width: 0; }
.as-dato b { font: 300 21px/1 var(--numeros); letter-spacing: -0.01em; color: var(--as-tinta); font-variant-numeric: tabular-nums; white-space: nowrap; }
.as-dato span { font: 400 11px/1.25 var(--texto); color: var(--as-sub); }
.ascent:not(.vinculada) .as-anio-dia { background: rgba(170, 178, 196, 0.07); }

/* Lo que comparten las dos: compacto, una línea por cosa. */
.as-comp { margin: 8px 0 0; padding: 0; list-style: none; }
.as-comp li { display: grid; gap: 3px; padding: 10px 0; border-top: 1px solid rgba(48, 55, 72, 0.6); }
.as-comp li:first-child { border-top: 0; }
.as-comp b { font: 400 14px/1.25 var(--texto); color: var(--as-tinta); }
.as-comp span { font: 400 12.5px/1.35 var(--texto); color: var(--as-sub); font-variant-numeric: tabular-nums; }

/* Cómo se calcula: se despliega, con las tres partes sumando 100 y lo de hoy. */
.as-como { margin: 30px -22px 0; padding: 0 22px; border-top: 1px solid var(--as-linea); }
.as-como-cab { appearance: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 16px 0; border: 0; background: none; color: var(--as-sub); font: 500 10.5px/1.2 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; }
.as-como-cab svg { width: 16px; height: 16px; stroke-width: 1.8; transition: transform 0.3s; }
.as-como.abierta .as-como-cab svg { transform: rotate(180deg); }
.as-como-cuerpo { overflow: hidden; padding-bottom: 6px; }
.as-suma { display: grid; grid-template-columns: 4fr 4fr 2fr; gap: 3px; margin-top: 2px; }
.as-suma-parte { display: grid; gap: 7px; min-width: 0; }
.as-suma-parte > i { position: relative; display: block; height: 22px; background: rgba(170, 178, 196, 0.12); overflow: hidden; }
.as-suma-parte > i > i { position: absolute; left: 0; top: 0; bottom: 0; background: var(--as-claro); opacity: 0.85; }
.as-suma-parte span { font: 400 11px/1.25 var(--texto); color: var(--as-sub); }
.as-suma-parte span b { display: block; font: 300 15px/1.1 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-suma-total { margin: 12px 0 2px; font: 300 17px/1.2 var(--numeros); color: var(--as-tinta); font-variant-numeric: tabular-nums; }
.as-como-cuerpo p { margin: 12px 0 0; font: 400 13px/1.45 var(--texto); color: var(--as-sub); text-wrap: pretty; }
.as-como-cuerpo p b { font-weight: 500; color: var(--as-tinta); }

/* El final: volver a Progreso, empujando para arriba o tocando. */
.as-final { display: grid; justify-items: center; gap: 6px; margin-top: 34px; }
.as-volver-abajo { appearance: none; cursor: pointer; display: grid; justify-items: center; gap: 4px; padding: 6px 12px; border: 0; background: none; color: var(--as-sub); font: 400 13px/1.2 var(--texto); }
.as-volver-abajo svg { width: 20px; height: 20px; stroke-width: 1.6; animation: as-sube 2.8s ease-in-out infinite; }
@keyframes as-sube { 50% { transform: translateY(-3px); opacity: 0.55; } }
.as-pie { margin: 6px 0 0; font: 400 12px/1.4 var(--texto); color: var(--as-apagado); text-align: center; }

/* Vincular en dos toques: la hoja sube cortada arriba. */
.tel .hb.as-hoja { border-radius: 0; border-top: 0; clip-path: ${CORTE_ARRIBA(16)}; background: linear-gradient(180deg, #0d1018 0%, #07080d 100%); color: var(--as-tinta); }
.tel .as-hoja .hb-cerrar { color: var(--as-sub); }
.as-hoja-cuerpo { padding: 4px 22px 8px; overflow-y: auto; }
.as-hoja-cuenta { display: flex; align-items: center; gap: 14px; padding: 12px 0 16px; border-bottom: 1px solid var(--as-linea); }
.as-hoja-cuenta .as-marca { width: 52px; height: 52px; flex: none; }
.as-hoja-cuenta b { display: block; font: 400 18px/1.2 var(--texto); color: var(--as-tinta); }
.as-hoja-cuenta span { display: block; margin-top: 3px; font: 400 12.5px/1.3 var(--texto); color: var(--as-sub); }
.as-hoja-grupo { margin: 16px 0 6px; font: 500 10.5px/1 var(--texto); letter-spacing: 0.19em; text-transform: uppercase; color: var(--as-sub); }
.as-hoja-lista { margin: 0; padding: 0; list-style: none; display: grid; gap: 6px; }
.as-hoja-lista li { position: relative; padding-left: 14px; font: 400 14px/1.35 var(--texto); color: var(--as-tinta); }
.as-hoja-lista li::before { content: ''; position: absolute; left: 2px; top: 0.6em; width: 4px; height: 4px; border-radius: 50%; background: var(--as-claro); }
.as-hoja-nota { margin: 16px 0 0; font: 400 12.5px/1.4 var(--texto); color: var(--as-sub); }
.as-hoja-vincular { width: 100%; margin-top: 18px; }
.as-hoja-ahora-no { display: block; margin: 12px auto 0; }
.as-hoja-error { margin: 16px 0 0; font: 400 13px/1.4 var(--texto); color: #f0c48a; }
.as-hoja-con-correo { appearance: none; cursor: pointer; display: flex; align-items: center; gap: 4px; margin: 20px auto 0; padding: 6px 2px; border: 0; background: none; color: var(--as-sub); font: 400 12.5px/1.2 var(--texto); }
.as-hoja-con-correo svg { width: 12px; height: 12px; stroke: currentColor; fill: none; stroke-width: 1.8; transition: transform 0.25s; }
.as-hoja-con-correo.abierto svg { transform: rotate(90deg); }
.as-hoja-form { display: grid; gap: 8px; margin-top: 12px; }
.as-campo { appearance: none; box-sizing: border-box; width: 100%; min-height: 46px; padding: 0 14px; border: 1px solid var(--as-linea-fuerte); border-radius: 0; background: rgba(232, 236, 246, 0.04); color: var(--as-tinta); font: 400 15px/1 var(--texto); }
.as-campo::placeholder { color: var(--as-sub); }
.as-campo:focus { outline: none; border-color: var(--as-principal); }
.as-hoja-entrar { appearance: none; cursor: pointer; position: relative; isolation: isolate; width: 100%; min-height: 46px; margin-top: 10px; border: 0; background: var(--as-apagado); clip-path: ${CORTE(9)}; color: var(--as-tinta); font: 500 14.5px/1 var(--texto); letter-spacing: 0.01em; }
.as-hoja-entrar::before { content: ''; position: absolute; inset: 1px; background: #0b0d13; clip-path: ${CORTE(9)}; transition: background-color 0.15s; }
.as-hoja-entrar:active::before { background: #171a23; }
.as-hoja-entrar span { position: relative; }
.as-hoja-vincular:disabled, .as-hoja-entrar:disabled { opacity: 0.6; cursor: default; }
.as-hoja-form.as-entra, .as-parte.as-entra { animation: as-entra 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .as-entrada-pista svg, .as-volver-abajo svg { animation: none; }
  .as-invita.entra, .as-contenido.as-entra, .as-hoja-form.as-entra, .as-parte.as-entra { animation-duration: 0.01s; }
  .as-chica-orbita, .as-chica-luna, .as-orbita, .as-luna, .as-luna-halo, .as-arriba .as-marca, .as-entrada-pista, .as-orbe-arco, .as-orbe-luna, .as-orbe-pista,
  .as-franjas-punto, .as-franjas-pista > i, .as-musc-barra i, .as-medidor-tramo, .as-medidor-punto, .as-como-cab svg { transition: none; }
}`;

  // El planeta de Ascent con su órbita abierta, como en su ícono, y la luna de Moss: sin vincular
  // queda afuera de la órbita; al vincular, entra.
  const ORBITA = 'M -25.24 -36.04 A 44 44 0 1 1 -36.04 25.24';
  const MARCA = `<svg class="as-marca" viewBox="-66 -66 132 132" aria-hidden="true">
    <defs>
      <radialGradient id="asPlaneta" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#6b7386"/><stop offset="0.5" stop-color="#2b313e"/><stop offset="1" stop-color="#0c0f15"/></radialGradient>
      <radialGradient id="asLunita" cx="38%" cy="34%" r="70%"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#bdb39c"/></radialGradient>
    </defs>
    <circle r="25" fill="url(#asPlaneta)"/>
    <circle r="25" class="as-planeta-borde"/>
    <path class="as-orbita as-orbita-sin" d="${ORBITA}"/>
    <path class="as-orbita as-orbita-con" d="${ORBITA}"/>
    <g class="as-luna"><circle r="9.5" class="as-luna-halo"/><circle r="5.2" fill="url(#asLunita)"/></g>
  </svg>`;
  // La misma marca en chico: a 24 píxeles, la órbita y la luna de la grande no se ven.
  const ORBITA_CHICA = 'M -4.59 -6.55 A 8 8 0 1 1 -6.55 4.59';
  const MARCA_CHICA = `<svg class="as-marca-chica" viewBox="-12 -12 24 24" aria-hidden="true">
    <defs><radialGradient id="asPlanetaChico" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#7b8498"/><stop offset="1" stop-color="#2b313e"/></radialGradient></defs>
    <circle r="4.6" class="as-chica-planeta" fill="url(#asPlanetaChico)"/>
    <path class="as-chica-orbita as-chica-sin" d="${ORBITA_CHICA}"/>
    <path class="as-chica-orbita as-chica-con" d="${ORBITA_CHICA}"/>
    <circle r="1.9" class="as-chica-luna"/>
  </svg>`;
  // La entrada de Progreso: el planeta, su órbita completa como pista, el arco de la recuperación y la luna de
  // Moss en la punta del arco. Sin vincular, la órbita punteada y la luna afuera, como en el ícono.
  const ORBE = `<svg class="as-orbe" viewBox="-24 -24 48 48" aria-hidden="true">
    <defs><radialGradient id="asOrbePlaneta" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#7b8498"/><stop offset="0.55" stop-color="#2f3542"/><stop offset="1" stop-color="#0e1117"/></radialGradient></defs>
    <circle class="as-orbe-pista" r="19"/>
    <circle class="as-orbe-arco" r="19" pathLength="100" transform="rotate(-90)"/>
    <circle r="9" fill="url(#asOrbePlaneta)" stroke="rgba(232, 236, 246, 0.25)" stroke-width="0.6"/>
    <g class="as-orbe-luna"><circle class="as-orbe-halo" r="4.4"/><circle r="2.6" fill="#f6ecd2"/></g>
  </svg>`;

  function crear(tel, opciones) {
    const u = Util.crear(opciones);
    const { tx, numero, el, boton, icono } = u;
    const estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    const A = Datos.ASCENT;
    const nombreDe = (v) => v[u.idioma()] || v.es;
    // Un nombre en el medio de una frase: «en sentadilla», «in squat».
    const enFrase = (s) => s.charAt(0).toLowerCase() + s.slice(1);
    const curva = opciones.curva;
    // Los umbrales del gesto, los mismos que para abrirla (galeria.js): un quinto largo de la pantalla o un tirón.
    const umbral = () => (opciones.umbral ? opciones.umbral() : 0.22);
    const velocidadMin = () => (opciones.velocidadMin ? opciones.velocidadMin() : 0.35);
    const conNumeros = () => !tel.classList.contains('sin-numeros');
    const sinDeficit = () => !!(opciones.sinDeficit && opciones.sinDeficit());
    const pct = (x) => `${x.toFixed(2)}%`;
    const lista = (xs) => (xs.length <= 1 ? xs[0] || '' : `${xs.slice(0, -1).join(', ')} ${tx('ascent.y')} ${xs[xs.length - 1]}`);
    let vinculada = false;
    // Cuánto bajó: 0 es arriba, escondida; 1, abierta.
    let p = 0;
    let abierta = false;
    let animacion = 0;
    // Lo desplegado: «¿Qué es este número?» y «Cómo se calcula».
    let queEs = false;
    let como = false;
    // El día de ejemplo que se mira, y si ya se abrió alguna vez (la pista se pliega).
    let diaElegido = 'corta';
    let yaSeAbrio = false;
    let diaDelAnio = null;
    const elDia = () => A.dias[diaElegido];

    const progresoZona = tel.querySelector('.progreso');
    const pgScroll = progresoZona.querySelector('.pg-scroll');
    const techo = el('div', 'as-techo');
    techo.innerHTML = '<i></i>';
    techo.setAttribute('aria-hidden', 'true');
    const horizonte = el('div', 'as-horizonte');
    horizonte.innerHTML = '<i></i>';
    horizonte.setAttribute('aria-hidden', 'true');
    const velo = el('div', 'as-velo');
    const zona = el('section', 'ascent pagina-app');
    zona.setAttribute('aria-label', 'Ascent');
    zona.innerHTML = `<div class="as-scroll"><div class="as-arriba"></div><div class="as-contenido"></div></div>`;
    tel.append(techo, velo, horizonte, zona);
    zona.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    const cont = zona.querySelector('.as-scroll');
    const contenido = zona.querySelector('.as-contenido');
    // La flecha para volver y el dibujo no se rearman: así el dibujo puede cambiar con una transición.
    const arriba = zona.querySelector('.as-arriba');
    const volver = boton('as-volver', icono('arriba'), () => cerrar());
    arriba.appendChild(volver);
    arriba.insertAdjacentHTML('beforeend', MARCA);
    const marca = arriba.querySelector('.as-marca');

    // ------------------------------------------------------------ lo que se calcula
    const necesidad = Sueno.necesidad(Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento);
    const sesionDe = (fecha) => A.sesiones.find((s) => s.fecha === fecha) || null;
    const sesionDeHoy = sesionDe(Datos.HOY);
    const inicioDeHoy = sesionDeHoy.inicio - sesionDeHoy.hora * 60e3;
    const DIA = 86_400_000;
    const nombreDeSesion = () => nombreDe(sesionDeHoy.nombre);
    const previas = (en) => A.sesiones.filter((x) => x.inicio < en);
    // El 1RM de cada ejercicio con lo de antes de un momento, una vez por ejercicio: residual() lo pide por serie.
    const memoUnoRM = (en) => {
      const vistos = new Map();
      return (ejercicio) => {
        if (!vistos.has(ejercicio)) vistos.set(ejercicio, Musculos.mejorE1rm(previas(en), ejercicio));
        return vistos.get(ejercicio);
      };
    };
    /** El momento del día en que se mira la recuperación: la sesión de hoy o, sin sesión, la mañana. */
    const momentoDe = (d) => (!d || d.sesion ? sesionDeHoy.inicio : inicioDeHoy + DESPERTAR * 60e3);
    /** Ahora, en el día de ejemplo (o el de la galería). */
    const ahoraDe = (d) => inicioDeHoy + (d ? d.ahora : Datos.AHORA_MIN) * 60e3;
    /**
     * A qué hora ir a la cama esta noche: la del aviso de dormir (Avisos.horasDeSueno), con lo de siempre (en
     * minutos desde las 18 del día anterior, como las noches), la deuda del día de ejemplo y lo que tarda en dormirse.
     */
    const acostarseDe = (d) => {
      const habitual = { dormirse: DORMIR - 18 * 60, despertar: DESPERTAR + 6 * 60 };
      return Avisos.horasDeSueno(Datos.HOY, { habitual: () => habitual, necesidad, deuda: d.deuda, latencia: LATENCIA }).acostarse;
    };

    /** La recuperación de un día de ejemplo o, sin día, la de la persona de mentira (la que ve Sueño). */
    function calcularRecuperado(d) {
      const anoche = d ? d.noche : opciones.anoche();
      if (!anoche) return null;
      const en = momentoDe(d);
      const unoRM = memoUnoRM(en);
      const deHoy = !d || d.sesion ? sesionDeHoy.bloques : null;
      const musculos = Fatiga.musculosParaLaFatiga({ deHoy, sesiones: A.sesiones, en });
      const f = Fatiga.fatigaMuscular({ musculos, sesiones: A.sesiones, en, unoRM });
      const meta = opciones.metaBase();
      const ayer = opciones.comida.totalDe(-1);
      const sentida = d ? null : opciones.cara(Datos.HOY);
      const r = Recuperado.recuperado({
        dormido: anoche.dormido, necesidad, calidad: anoche.calidad ?? null, sentida, fatiga: f.indice,
        proteinaAyer: ayer.p, metaProteina: meta.proteina, kcalAyer: ayer.kcal, metaKcal: meta.kcal,
      });
      const ultima = previas(en).pop() || null;
      const sueno = Recuperado.suenoParaRecuperar({ dormido: anoche.dormido, necesidad, calidad: anoche.calidad ?? null, sentida });
      return Object.assign(r, { anoche, ayer, meta, musculos, en, ultima, calidad: sueno.calidad });
    }

    /** Lo del sueño que entra al rendimiento: el del día de ejemplo o, sin día, el de la persona de mentira. */
    function suenoParaElRendimiento(d) {
      if (d) {
        const n = d.noche;
        return { anoche: n, sueno: n ? { dormido: n.dormido, necesidad, despertoAntes: n.despertoAntes, seAcostoTarde: n.seAcostoTarde, siesta: n.siesta, sinReloj: false } : null, ultimas3: d.ultimas3, deuda: d.deuda, cara: null };
      }
      const noches = opciones.noches();
      const anoche = noches.find((n) => n.clave === Datos.HOY) || null;
      const habitual = SinReloj.habitualDe(noches, Datos.HOY);
      const deuda = Sueno.deudaDeSueno(Sueno.ultimasNoches(noches, Datos.HOY, 14), necesidad);
      return {
        anoche,
        sueno: anoche ? {
          dormido: anoche.dormido, necesidad,
          despertoAntes: !!habitual && anoche.despertar < habitual.despertar - 60,
          seAcostoTarde: !!habitual && anoche.dormirse > habitual.dormirse + 60,
          siesta: anoche.siestas >= 20, sinReloj: !!anoche.moss,
        } : null,
        ultimas3: [0, 1, 2].map((k) => noches.find((n) => n.clave === Fechas.sumarDias(Datos.HOY, -k))).filter(Boolean).map((n) => n.dormido),
        deuda: deuda ? deuda.minutos : null,
        cara: opciones.cara(Datos.HOY),
      };
    }

    /** Las series de unos músculos (como principales) entre dos momentos. */
    function seriesDe(musculos, desde, hasta, unoRM) {
      return A.sesiones.filter((x) => x.inicio >= desde && x.inicio < hasta).reduce((t, x) => {
        const dosis = Musculos.dosisDeLaSesion(x, unoRM);
        return t + musculos.reduce((s, m) => s + ((dosis.get(m) && dosis.get(m).series) || 0), 0);
      }, 0);
    }

    /** El rendimiento esperado de un ejercicio de hoy, antes de la sesión. */
    function calcularRendimiento(d, bloque = sesionDeHoy.bloques[0]) {
      const en = sesionDeHoy.inicio;
      const unoRM = memoUnoRM(en);
      const musc = Musculos.musculosDe(bloque.ejercicio);
      const s = suenoParaElRendimiento(d);
      const residual = Math.max(...musc.principal.map((m) => Musculos.residual(m, previas(en), en, { unoRM })));
      // La semana contra el promedio de las cuatro anteriores, en series de los músculos principales.
      const semana = seriesDe(musc.principal, en - 7 * DIA, en, unoRM);
      const mes = seriesDe(musc.principal, en - 35 * DIA, en - 7 * DIA, unoRM) / 4;
      const conEllos = previas(en).filter((x) => musc.principal.some((m) => (Musculos.dosisDeLaSesion(x, unoRM).get(m) || {}).series > 0));
      const ultima = conEllos[conEllos.length - 1];
      const conElEjercicio = previas(en).filter((x) => x.bloques.some((b) => b.ejercicio === bloque.ejercicio));
      const ultimoDelEjercicio = conElEjercicio[conElEjercicio.length - 1] || null;
      const ultimoBloque = ultimoDelEjercicio ? ultimoDelEjercicio.bloques.find((b) => b.ejercicio === bloque.ejercicio) : null;
      const ayer = opciones.comida.totalDe(-1);
      const meta = opciones.metaBase();
      const pesoKg = opciones.persona().pesoHoy || 75;
      const cambio = opciones.persona().cambio7;
      const entradas = {
        sueno: s.sueno, ultimas3: s.ultimas3, deuda: s.deuda, cara: s.cara,
        multiarticular: musc.multiarticular, tren: musc.principal.some((m) => Musculos.DE_PIERNAS.includes(m)) ? 'inferior' : 'superior', horaHabitual: sesionDeHoy.hora,
        comida: {
          ayuno8h: false, sesionLarga: sesionDeHoy.minutos > 45, carbosAyerPorKilo: ayer.c ? ayer.c / pesoKg : null, mismosMusculosAyer: false,
          bajaSemanal: cambio !== null && cambio !== undefined ? (-cambio / pesoKg) * 100 : null, semanasBajando: 6, kcalAyer: ayer.kcal ? ayer.kcal / meta.kcal : null,
        },
        residual,
        descarga: {
          diasSinSeriesDuras: ultima ? Math.floor((en - ultima.inicio) / DIA) : 30, seriesSemanaSobreMes: mes ? semana / mes : null,
          intensidadMantenida: !!ultimoBloque && ultimoBloque.series.some((x) => x.peso >= 0.85 * (unoRM(bloque.ejercicio) || Infinity)),
          diasSinElEjercicio: ultimoDelEjercicio ? Math.floor((en - ultimoDelEjercicio.inicio) / DIA) : 30,
        },
        entrenado: true,
      };
      return { r: Rendimiento.rendimientoEsperado(entradas), entradas, bloque, musc, anoche: s.anoche };
    }

    /** Los ejercicios de la sesión de hoy con su marca y si hoy es buen día para intentarla. */
    function calcularMarcas(d) {
      const en = sesionDeHoy.inicio;
      const unoRM = memoUnoRM(en);
      const recientes = previas(en).filter((x) => x.inicio > en - 21 * DIA);
      const lista = [];
      sesionDeHoy.bloques.forEach((bloque) => {
        const pr = A.marcas.find((m) => m.ejercicio === bloque.ejercicio);
        if (!pr) return;
        const rend = calcularRendimiento(d, bloque);
        const { r, entradas } = rend;
        const dia = Rendimiento.buenDiaParaMarca({
          marca: Musculos.e1rm(pr.peso, pr.reps), mejorReciente: Musculos.mejorE1rm(recientes, bloque.ejercicio), marcaEn8Semanas: pr.fecha > Fechas.sumarDias(Datos.HOY, -56),
          recuperado: entradas.residual < 3, dormido: entradas.sueno ? entradas.sueno.dormido : null, despertoAntes: !!(entradas.sueno && entradas.sueno.despertoAntes),
          ultimas3: entradas.ultimas3, seriesSemanaSobreMes: entradas.descarga.seriesSemanaSobreMes, ayunoSesionLarga: entradas.comida.ayuno8h && entradas.comida.sesionLarga,
          bajandoRapido: entradas.comida.bajaSemanal !== null && entradas.comida.bajaSemanal > 1, deltaMax: r.max, sigma: r.sigma,
        });
        const av = A.avisos[bloque.ejercicio] || null;
        const seguridad = av ? Rendimiento.seguridadDeMarcas({ marcas: av.marcasEnTotal, sesiones: previas(en).length, semanas: av.semanas, leGanaALaGeneral: false }) : null;
        lista.push({ ejercicio: bloque.ejercicio, dia, av, seguridad, unoRM: unoRM(bloque.ejercicio) });
      });
      return Diagnostico.ordenarMarcas(lista);
    }

    /** Los días de la rutina con sus músculos, cómo están ahora. */
    function fatigaDeLaRutina(d) {
      const en = ahoraDe(d);
      return Fatiga.fatigaPorDia({
        rutina: A.rutina.map((r) => ({ dia: r.dia, nombre: nombreDe(r.nombre), ejercicios: r.ejercicios.map((ejercicio) => ({ ejercicio })) })),
        hoy: Fechas.diaDeLaSemana(Datos.HOY), sesiones: A.sesiones, en, unoRM: memoUnoRM(en),
      });
    }

    // Lo de Moss de una semana, de lunes a domingo, con la comida y el sueño de la galería.
    function semanaDeMoss(desde) {
      const fechas = Array.from({ length: 7 }, (_, i) => Fechas.sumarDias(desde, i));
      const noches = Datos.NOCHES.filter((x) => fechas.includes(x.clave)).map((x) => x.dormido);
      const comidas = fechas.filter((f) => f < Datos.HOY).map((f) => opciones.comida.totalDe(Fechas.diasEntre(Datos.HOY, f))).filter((t) => t.kcal > 0).map((t) => ({ kcal: t.kcal, proteina: t.p }));
      return Entrenamiento.semanaDeMoss(noches, comidas, opciones.persona().gasto);
    }

    /** Las razones de cada ejercicio estancado: las semanas en que subía contra las de ahora, y lo de Ascent. */
    function calcularEstancados() {
      const persona = opciones.persona();
      const con = opciones.pocasSemanas() ? A.semanasConMarcas.slice(0, 2) : A.semanasConMarcas;
      const baja = persona.cambio7 !== null && persona.cambio7 !== undefined ? -persona.cambio7 : null;
      return A.estancados.ejercicios.map((e) => {
        const sin = Array.from({ length: e.semanas }, (_, i) => semanaDeMoss(Fechas.sumarDias(e.desde, 7 * i)));
        const r = Estancados.razonesDeEstancamiento({
          conMarcas: con, sinMarcas: sin, objetivo: persona.perfil.objetivo, bajaSemanal: baja,
          llegadas: e.llegadas, vecesPorSemana: e.vecesPorSemana, minutos: e.minutos,
        });
        // Con «sin déficit» no se habla de comer por debajo del gasto.
        if (sinDeficit()) r.razones = r.razones.filter((x) => x.que !== 'calorias' && x.que !== 'definicion');
        return { e, r, musculo: (Musculos.musculosDe(e.ejercicio) || { principal: [] }).principal[0] || null };
      });
    }

    /** Lo de hoy para «Hoy, concéntrate en» y las partes: la meta del día, con o sin la sesión anotada. */
    function entradasDelDia(d, rend, marcaDeHoy) {
      const c = opciones.conAscent(d.sesion !== 'hecha');
      const meta = c ? c.meta : opciones.metaBase();
      const filas = Object.entries(d.anotado);
      const suma = (k) => filas.reduce((t, [, x]) => t + x[k], 0);
      const sesion = d.sesion ? { inicio: sesionDeHoy.hora, minutos: sesionDeHoy.minutos, tipo: 'fuerza', hecha: d.sesion === 'hecha' } : null;
      return {
        contexto: {
          ahora: d.ahora, horaDeComida: HORA_DE_COMIDA, anotado: Object.fromEntries(filas.map(([k, x]) => [k, { hora: x.hora, proteina: x.p, kcal: x.kcal }])),
          meta: { kcal: meta.kcal, proteina: meta.proteina, carbohidratos: meta.carbohidratos, grasas: meta.grasas },
          comido: { kcal: suma('kcal'), proteina: suma('p'), carbohidratos: suma('c'), grasas: suma('g') },
          comidasHabituales: 4, pesoKg: Datos.PESADAS[Datos.PESADAS.length - 1].kg, edad: Number(Datos.HOY.slice(0, 4)) - Datos.PERFIL.nacimiento,
          despertar: DESPERTAR, dormir: DORMIR, cafeinaPorToma: d.cafe || null, sinDeficit: sinDeficit(),
        },
        sesion, sabeCuandoEntrena: true,
        noche: d.noche ? { dormido: d.noche.dormido, necesidad, siesta: d.noche.siesta } : null,
        ultimas3: d.ultimas3, deuda: d.deuda, rendimiento: rend ? rend.r : null, marca: marcaDeHoy,
      };
    }

    /** Todo lo del día de ejemplo, una vez por pintada. */
    function calcularDia(d) {
      const rec = calcularRecuperado(d);
      const rend = d.sesion && d.noche ? calcularRendimiento(d) : null;
      const marcas = d.sesion === 'prevista' && d.noche ? calcularMarcas(d) : [];
      const buena = marcas.find((m) => m.dia.aplica);
      const x = entradasDelDia(d, rend, buena ? enFrase(nombreDelEjercicio(buena.ejercicio)) : null);
      const diag = Diagnostico.diagnostico(x);
      const foco = Diagnostico.focoDeHoy(Object.assign({}, x, { recuperado: rec, acostarse: acostarseDe(d) }));
      // Cómo ir en el gimnasio no depende de la comida: también se dice con «sin déficit».
      const gimnasio = rec && d.sesion === 'prevista' ? Diagnostico.comoEntrenar({ recuperado: rec, sueno: Diagnostico.estadoDelSueno(x.noche), marca: x.marca }) : null;
      return { rec, rend, marcas, diag, foco, gimnasio, rutina: fatigaDeLaRutina(d) };
    }
    const nombreDelEjercicio = (ej) => (A.nombresDeEjercicios[ej] ? nombreDe(A.nombresDeEjercicios[ej]) : ej);
    const palabraRecuperado = () => tx('ascent.recuperado.palabra.' + (Datos.PERFIL.sexo === 'f' ? 'f' : 'm'));
    // Lo que falta para recuperarse: en horas o, desde dos días, en días (108 h se lee mejor como ~5 días).
    const tiempoDe = (h) => (h >= 48 ? tx('ascent.tiempo.dias', { n: Math.round(h / 24) }) : tx('ascent.tiempo.horas', { n: h }));

    // ------------------------------------------------------------ vincular en dos toques
    // (spec/ascent.md, «Vincular en menos de 10 segundos»): Ascent deja su sesión en el llavero que
    // comparten las apps del equipo, y Moss lo mira al abrir la hoja y cada vez que vuelve a primer
    // plano. Con la sesión, «@usuario · Ascent en este iPhone», qué pasa cada app y «Vincular»: al
    // tocarlo, la luna entra en la órbita. Con Ascent sin sesión, «Abre Ascent y vuelve»; sin
    // Ascent, «Conseguir Ascent»; sin la cuenta de Moss, que hace falta entrar. Siempre, abajo y
    // chico, entrar con la cuenta de Ascent: para quien no la tiene en este iPhone y para quien
    // revisa en Apple. En la galería, el iPhone y lo que contesta el servidor se eligen arriba.
    let esteIphone = 'sesion';
    let resultado = 'bien';
    const hojaVincular = Util.hoja(tel, 'as-hoja', () => opciones.alCambiar());
    const hv = { estado: 'sesion', conCorreo: false, correoEscrito: '', claveEscrita: '', vinculando: null, error: null, errorDe: null, entra: false };
    const usuarioDeAscent = () => '@' + Datos.PERFIL.nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    let esperaDeLaHoja = 0;

    function abrirVincular(estado) {
      clearTimeout(esperaDeLaHoja);
      Object.assign(hv, { estado: estado || esteIphone, conCorreo: false, vinculando: null, error: null, errorDe: null, entra: false });
      pintarHoja();
      hojaVincular.abrir();
      opciones.alCambiar();
    }

    // Vincular con la sesión del llavero o con el correo: lo que contesta el servidor se elige arriba.
    function vincularDesdeLaHoja(de) {
      if (hv.vinculando) return;
      Object.assign(hv, { vinculando: de, error: null, errorDe: null });
      pintarHoja();
      esperaDeLaHoja = setTimeout(() => {
        hv.vinculando = null;
        // Con el correo, la sesión es nueva: no vence, pero la contraseña puede estar mal.
        const r = de === 'correo' && resultado === 'vencida' ? 'credenciales' : de === 'llavero' && resultado === 'credenciales' ? 'vencida' : resultado;
        if (r !== 'bien') {
          Object.assign(hv, { error: r, errorDe: de });
          pintarHoja();
          return;
        }
        hojaVincular.cerrar();
        // Cuando la hoja termina de bajar, la luna entra en la órbita.
        esperaDeLaHoja = setTimeout(() => opciones.alVincular(true), 380);
      }, 800);
    }

    function pintarHoja() {
      const h = hojaVincular.el;
      const antes = h.querySelector('.as-hoja-cuerpo');
      const arribaDe = antes ? antes.scrollTop : 0;
      h.innerHTML = '';
      const cab = el('header', 'hb-cab');
      cab.append(el('div', 'hb-asa'), el('h3', 'hb-titulo', tx('ascent.vincularHoja.titulo')), boton('hb-cerrar', icono('cerrar'), () => hojaVincular.cerrar(), tx('comida.cerrar')));
      const cuerpo = el('div', 'as-hoja-cuerpo');
      const k = hv.estado;
      const cuenta = el('div', 'as-hoja-cuenta');
      cuenta.innerHTML = MARCA;
      const quien = el('div');
      if (k === 'sesion') quien.append(el('b', null, usuarioDeAscent()), el('span', null, tx('ascent.vincularHoja.enEsteIphone')));
      else quien.append(el('b', null, tx(`ascent.vincularHoja.${k}.titulo`)), el('span', null, tx(`ascent.vincularHoja.${k}.texto`)));
      cuenta.appendChild(quien);
      cuerpo.appendChild(cuenta);
      const listaDe = (titulo, cosas) => {
        cuerpo.appendChild(el('h4', 'as-hoja-grupo', titulo));
        const ul = el('ul', 'as-hoja-lista');
        cosas.forEach((c) => ul.appendChild(el('li', null, c)));
        cuerpo.appendChild(ul);
      };
      listaDe(tx('ascent.vincularHoja.deMoss'), tx('ascent.vincularHoja.mossComparte'));
      listaDe(tx('ascent.vincularHoja.deAscent'), tx('ascent.vincularHoja.ascentComparte'));
      cuerpo.appendChild(el('p', 'as-hoja-nota', tx('ascent.vincularHoja.nota')));
      // El error va donde se mira: arriba del botón que se tocó.
      const error = (de) => {
        if (!hv.error || hv.errorDe !== de) return;
        const p2 = el('p', 'as-hoja-error', tx('ascent.vincularHoja.errores.' + hv.error));
        p2.setAttribute('role', 'alert');
        cuerpo.appendChild(p2);
      };
      error('llavero');
      if (k === 'sesion') {
        const b = boton('as-vincular as-hoja-vincular', tx(hv.vinculando === 'llavero' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.vincular'), () => vincularDesdeLaHoja('llavero'));
        b.disabled = !!hv.vinculando;
        cuerpo.appendChild(b);
      } else if (k === 'sinSesion') {
        // En el iPhone abre Ascent; al volver, Ascent ya dejó la sesión y la hoja la ve sola.
        cuerpo.appendChild(boton('as-vincular as-hoja-vincular', tx('ascent.vincularHoja.sinSesion.boton'), () => {
          esperaDeLaHoja = setTimeout(() => { Object.assign(hv, { estado: 'sesion', error: null, errorDe: null }); pintarHoja(); }, 900);
        }));
      } else if (k === 'sinAscent') {
        cuerpo.appendChild(boton('as-vincular as-hoja-vincular', tx('ascent.vincularHoja.sinAscent.boton'), () => {}));
      }
      cuerpo.appendChild(boton('as-conseguir as-hoja-ahora-no', tx('ascent.vincularHoja.ahoraNo'), () => hojaVincular.cerrar()));
      if (k !== 'sinCuenta') {
        const enlace = boton('as-hoja-con-correo' + (hv.conCorreo ? ' abierto' : ''), `<span>${tx('ascent.vincularHoja.conCorreo')}</span>${icono('adelante')}`, () => {
          Object.assign(hv, { conCorreo: !hv.conCorreo, entra: !hv.conCorreo });
          if (hv.errorDe === 'correo') Object.assign(hv, { error: null, errorDe: null });
          pintarHoja();
          if (hv.conCorreo) {
            const c = h.querySelector('.as-hoja-cuerpo');
            c.scrollTop = c.scrollHeight;
          }
        });
        enlace.setAttribute('aria-expanded', String(hv.conCorreo));
        cuerpo.appendChild(enlace);
      }
      if (hv.conCorreo && k !== 'sinCuenta') {
        const form = el('form', 'as-hoja-form' + (hv.entra ? ' as-entra' : ''));
        hv.entra = false;
        const campo = (tipo, clave, guardado, auto) => {
          const i = el('input', 'as-campo');
          Object.assign(i, { type: tipo, placeholder: tx('ascent.vincularHoja.' + clave), autocomplete: auto, value: hv[guardado] });
          i.setAttribute('aria-label', i.placeholder);
          i.addEventListener('input', () => { hv[guardado] = i.value; });
          return i;
        };
        form.append(campo('email', 'correo', 'correoEscrito', 'username'), campo('password', 'clave', 'claveEscrita', 'current-password'));
        cuerpo.appendChild(form);
        error('correo');
        const entrar = boton('as-hoja-entrar', `<span>${tx(hv.vinculando === 'correo' ? 'ascent.vincularHoja.vinculando' : 'ascent.vincularHoja.entrar')}</span>`, () => {
          const vacio = [...form.querySelectorAll('.as-campo')].find((i) => !i.value.trim());
          if (vacio) { vacio.focus(); return; }
          vincularDesdeLaHoja('correo');
        });
        entrar.disabled = !!hv.vinculando;
        form.addEventListener('submit', (ev) => { ev.preventDefault(); entrar.click(); });
        cuerpo.append(entrar, el('p', 'as-hoja-nota', tx('ascent.vincularHoja.notaCorreo')));
      }
      h.append(cab, cuerpo);
      cuerpo.scrollTop = arribaDe;
    }

    // Lo que se elige en la galería: cómo está Ascent en este iPhone, qué contesta el servidor y qué día se mira.
    // El día sin la calidad del sueño se suma acá al panel, junto a los otros.
    const segmentoDelDia = document.getElementById('s-dia-ascent');
    if (segmentoDelDia && !segmentoDelDia.querySelector('[data-valor="sinCalidad"]')) {
      const b = document.createElement('button');
      Object.assign(b, { type: 'button', textContent: 'Sin la calidad del sueño' });
      b.dataset.valor = 'sinCalidad';
      b.setAttribute('aria-pressed', 'false');
      segmentoDelDia.appendChild(b);
    }
    const elegir = (id, alElegir) => {
      const c = document.getElementById(id);
      if (!c) return;
      c.addEventListener('click', (ev) => {
        const b = ev.target.closest('button');
        if (!b) return;
        c.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        alElegir(b.dataset.valor);
      });
    };
    elegir('s-iphone', (v) => { ponerIphone(v); abrirVincular(v); });
    elegir('s-servidor', (v) => { resultado = v; });
    elegir('s-dia-ascent', (v) => ponerDia(v));

    // Cómo está Ascent en este iPhone cambia la entrada y la invitación de Inicio.
    function ponerIphone(v) {
      esteIphone = v;
      document.querySelectorAll('#s-iphone button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === v)));
      pintarEntrada();
      opciones.repintarInicio();
    }
    function ponerDia(v) {
      diaElegido = v;
      document.querySelectorAll('#s-dia-ascent button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.valor === v)));
      queEs = false;
      como = false;
      pintar();
      entraElContenido();
    }
    function entraElContenido() {
      contenido.classList.remove('as-entra');
      void contenido.offsetWidth;
      contenido.classList.add('as-entra');
    }
    // Lo que se despliega y se pliega: nada aparece ni desaparece de golpe.
    function desplegar(caja, abrirla) {
      caja.hidden = false;
      if (opciones.movimientoReducido) { caja.hidden = !abrirla; return; }
      const animacionDeCaja = caja.animate(
        [{ height: '0px', marginTop: '0px', opacity: 0 }, { height: `${caja.offsetHeight}px`, opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)', direction: abrirla ? 'normal' : 'reverse' },
      );
      if (!abrirla) animacionDeCaja.onfinish = () => { caja.hidden = true; };
    }

    // ------------------------------------------------------------ la entrada, en el encabezado de Progreso
    // Un solo nodo que Progreso pone en su encabezado cada vez que se pinta: así la pista se pliega con una
    // transición y la órbita se mueve de un valor al otro.
    const entrada = el('button', 'as-entrada');
    entrada.type = 'button';
    entrada.innerHTML = `<span class="as-entrada-textos"><b class="as-entrada-cifra"></b><small class="as-entrada-sub"></small></span>${ORBE}<span class="as-entrada-pista">${icono('abajo')}<span></span></span>`;
    entrada.addEventListener('click', (ev) => { ev.stopPropagation(); abrir(); });
    const entradaCifra = entrada.querySelector('.as-entrada-cifra');
    const entradaSub = entrada.querySelector('.as-entrada-sub');
    const entradaPista = entrada.querySelector('.as-entrada-pista span');
    let firmaDeLaEntrada = '';

    function pintarEntrada() {
      const d = elDia();
      const rec = vinculada ? calcularRecuperado(d) : null;
      const instalada = esteIphone !== 'sinAscent';
      let cifra;
      let sub = '';
      if (!vinculada) cifra = tx(instalada ? 'ascent.senal.vincular' : 'ascent.senal.marca');
      else {
        cifra = rec ? `${rec.total} %<span>${palabraRecuperado()}</span>` : `— %<span>${palabraRecuperado()}</span>`;
        sub = !d.sesion ? tx('ascent.entrada.descanso') : d.sesion === 'hecha' ? tx('ascent.senal.hoy', { sesion: enFrase(nombreDeSesion()) }) : tx('ascent.entrada.sesion', { sesion: nombreDeSesion(), hora: u.horaMin(sesionDeHoy.hora) });
      }
      entrada.classList.toggle('sin', !vinculada);
      entrada.classList.toggle('atencion', !!rec && rec.banda === 'atencion');
      entrada.style.setProperty('--arco', rec ? String(rec.total) : '0');
      entrada.style.setProperty('--giro', `${rec ? rec.total * 3.6 : 0}deg`);
      entradaPista.textContent = tx('ascent.entrada.pista');
      entrada.setAttribute('aria-label', vinculada && rec ? tx('ascent.entrada.etiqueta', { n: rec.total, palabra: palabraRecuperado() }) : tx('ascent.flecha'));
      const firma = `${cifra}|${sub}`;
      if (firma === firmaDeLaEntrada) return;
      const habia = firmaDeLaEntrada !== '';
      firmaDeLaEntrada = firma;
      entradaCifra.innerHTML = cifra;
      entradaSub.textContent = sub;
      if (habia && !opciones.movimientoReducido) entrada.querySelector('.as-entrada-textos').animate([{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
    }
    function plegarLaPista(plegada) { entrada.classList.toggle('sin-pista', plegada); }

    // ------------------------------------------------------------ el borde del planeta, arriba de Progreso
    let corrida = 0;
    function ponerTecho(baja = 0) {
      const enMetas = progresoZona.classList.contains('en-metas');
      const arribaDeTodo = clamp(1 - pgScroll.scrollTop / 60, 0, 1);
      const prendida = !opciones.prendida || opciones.prendida();
      const o = enMetas || !prendida ? 0 : arribaDeTodo * clamp(1 - p * 2.4, 0, 1);
      techo.style.opacity = o.toFixed(3);
      techo.style.setProperty('--baja', `${(p * TECHO_BAJA + baja).toFixed(1)}px`);
      techo.style.visibility = o < 0.002 || Math.abs(corrida) >= (tel.clientWidth || 1) ? 'hidden' : 'visible';
    }
    pgScroll.addEventListener('scroll', () => ponerTecho(), { passive: true });

    // La primera vez que se llega a Progreso, como si alguien tirara apenas: Progreso baja un poco y vuelve,
    // y el planeta asoma un poco más. Una sola vez; con Reducir movimiento, nada.
    let yaAsomo = false;
    function asomar(otraVez) {
      if (yaAsomo && !otraVez) return;
      yaAsomo = true;
      if (otraVez) { yaSeAbrio = false; plegarLaPista(false); }
      if (opciones.movimientoReducido) return;
      const pasos = (n) => [{ transform: 'translateY(0)' }, { transform: `translateY(${n}px)`, offset: 0.3 }, { transform: 'translateY(0)', offset: 0.6 }, { transform: `translateY(${n * 0.35}px)`, offset: 0.8 }, { transform: 'translateY(0)' }];
      const como2 = { duration: 1500, delay: 700, easing: 'ease-in-out' };
      pgScroll.animate(pasos(24), Object.assign({ id: 'as-asoma' }, como2));
      techo.firstElementChild.animate(pasos(20), como2);
    }

    // ------------------------------------------------------------ la invitación de Inicio
    // Solo con Ascent en este iPhone y sin vincular, y «Ahora no» es para siempre (en el teléfono queda
    // guardado; en la galería, hasta recargar o con su botón). «Vincular» abre la hoja: dos toques.
    let descartada = false;
    let invitacionVista = false;
    // La que se está yendo sigue en su lugar: Inicio se vuelve a pintar entero en cualquier momento.
    let saliendo = null;
    function invitacion() {
      if (saliendo) return saliendo;
      const invita = SenalDeAscent.invitarEnInicio({ conAscent: !opciones.prendida || opciones.prendida(), listo: true, conCuenta: esteIphone !== 'sinCuenta', vinculada, instalada: esteIphone !== 'sinAscent', descartada });
      if (!invita) { invitacionVista = false; return null; }
      const c = el('article', 'as-invita' + (invitacionVista ? '' : ' entra'));
      invitacionVista = true;
      c.innerHTML = MARCA_CHICA;
      const textos = el('div');
      textos.append(el('b', 'as-invita-titulo', tx('ascent.invitacion.titulo')), el('p', 'as-invita-texto', tx('ascent.invitacion.texto')));
      const acciones = el('div', 'as-invita-acciones');
      acciones.append(
        boton('as-invita-si', tx('ascent.invitacion.vincular'), () => abrirVincular()),
        boton('as-invita-no', tx('ascent.invitacion.ahoraNo'), () => { descartada = true; quitarInvitacion(); }),
      );
      c.append(textos, acciones);
      return c;
    }
    // Se cierra acomodando lo de abajo, con el espacio entre los bloques incluido.
    function quitarInvitacion() {
      const n = document.querySelector('.as-invita');
      if (!n || saliendo) return;
      saliendo = n;
      const a = n.animate(
        [{ height: `${n.offsetHeight}px`, opacity: 1, marginBottom: '0px' }, { height: '0px', paddingTop: '0px', paddingBottom: '0px', borderTopWidth: '0px', borderBottomWidth: '0px', opacity: 0, marginBottom: '-12px' }],
        { duration: opciones.movimientoReducido ? 1 : 320, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
      );
      a.onfinish = () => {
        saliendo = null;
        invitacionVista = false;
        n.remove();
      };
    }

    // ------------------------------------------------------------ piezas
    const candado = () => {
      const c = el('span', 'as-candado');
      c.innerHTML = icono('candado');
      c.appendChild(el('span', null, tx('ascent.conAscent')));
      return c;
    };
    function parte(clase, titulo, derecha) {
      const c = el('section', 'as-parte ' + clase);
      const cab = el('header', 'as-parte-cab');
      cab.appendChild(el('h3', 'as-etq', titulo));
      if (derecha) cab.appendChild(derecha);
      c.appendChild(cab);
      return c;
    }
    const linea = (clase, texto) => el('p', clase, texto);
    const irA = (que, clave) => boton('as-enlace', tx(clave), () => opciones.irASeccion(que));

    /** Una barra de cuatro tramos iguales, uno por franja, con el punto donde cae el valor. */
    function franjas(banda, posicion, conNombres) {
      const c = el('div', 'as-franjas' + (banda ? '' : ' vacia'));
      const pista = el('div', 'as-franjas-pista');
      Recuperado.BANDAS.forEach((b) => pista.appendChild(el('i', b + (b === banda ? ' esta' : ''))));
      if (posicion !== null && posicion !== undefined) {
        const punto = el('b', 'as-franjas-punto');
        punto.style.left = pct(posicion * 100);
        pista.appendChild(punto);
      }
      c.appendChild(pista);
      if (conNombres) {
        const nombres = el('div', 'as-franjas-nombres');
        Recuperado.BANDAS.forEach((b) => nombres.appendChild(el('span', b + (b === banda ? ' esta' : ''), tx('ascent.bandas.' + b))));
        c.appendChild(nombres);
      }
      c.setAttribute('role', 'img');
      c.setAttribute('aria-label', banda ? tx('ascent.bandas.' + banda) : tx('ascent.vacio.sinDatos'));
      return c;
    }

    // ------------------------------------------------------------ cuánto estás recuperado
    function cuandoFue(fecha) {
      const dias = Fechas.diasEntre(fecha, Datos.HOY);
      if (dias === 0) return tx('ascent.recuperado.cuando.hoy');
      if (dias === 1) return tx('ascent.recuperado.cuando.ayer');
      return tx('ascent.recuperado.cuando.dia', { dia: tx('fecha.dias.' + u.partes(fecha).dia) });
    }
    function cabezaRecuperado(d, k) {
      const rec = k.rec;
      const c = el('section', 'as-rec');
      const hecha = d.sesion === 'hecha';
      c.appendChild(linea('as-rec-estas', tx(hecha ? 'ascent.recuperado.llegaste' : 'ascent.recuperado.estas')));
      const cifra = el('div', 'as-rec-cifra' + (rec ? '' : ' vacia'));
      cifra.append(document.createTextNode(rec ? String(rec.total) : '—'), el('small', null, '%'));
      c.append(cifra, linea('as-rec-palabra', palabraRecuperado()));
      if (rec && hecha) c.appendChild(linea('as-rec-desde', tx('ascent.recuperado.asi', { sesion: enFrase(nombreDeSesion()), hora: u.horaMin(sesionDeHoy.hora) })));
      else if (rec && rec.ultima) c.appendChild(linea('as-rec-desde', tx('ascent.recuperado.desde', { cuando: cuandoFue(rec.ultima.fecha), sesion: enFrase(nombreDe(rec.ultima.nombre)) })));
      c.appendChild(franjas(rec ? rec.banda : null, rec ? Recuperado.enLaBarra(rec.total, 'total') : null, true));
      // Qué hacer, antes de entrenar: la frase de la franja, salvo que el sueño o los músculos pidan otra
      // cosa (lo mismo que dice «Hoy, concéntrate en» para el gimnasio).
      if (k.gimnasio) {
        const comoIr = { marca: 'muyBien', masFuerte: 'muyBien', comoSiempre: 'bien', sinFallo: 'aceptable', suave: 'atencion' };
        c.appendChild(linea('as-rec-frase', tx('ascent.bandas.frases.' + comoIr[k.gimnasio.como])));
      }
      if (!rec) {
        c.appendChild(linea('as-rec-desde', tx('ascent.recuperacion.sinNoche')));
        return c;
      }
      // «¿Qué es este número?»: dos líneas llanas, y de ahí a «Cómo se calcula».
      const caja = el('div', 'as-explicacion');
      caja.append(linea(null, tx('ascent.recuperado.queEs.texto')), boton('as-enlace', tx('ascent.recuperado.queEs.ver'), () => abrirComo()));
      caja.hidden = !queEs;
      const b = boton('as-enlace', tx('ascent.recuperado.queEs.enlace'), () => {
        queEs = !queEs;
        b.setAttribute('aria-expanded', String(queEs));
        desplegar(caja, queEs);
      });
      b.setAttribute('aria-expanded', String(queEs));
      c.append(b, caja);
      return c;
    }

    // ------------------------------------------------------------ hoy, concéntrate en
    function cantidadesDeAntes(l) {
      const n = conNumeros();
      const c = n ? l.carbohidratos : null;
      const g = n ? l.proteina : null;
      let s = c && g ? tx('ascent.foco.comer.cyp', { c, p: g }) : c ? tx('ascent.foco.comer.soloC', { c }) : g ? tx('ascent.foco.comer.soloP', { p: g }) : tx('ascent.foco.comer.sinNumeros');
      if (l.durantePorHora) s += ' ' + (n ? tx('entreno.durante', { a: l.durantePorHora[0], b: l.durantePorHora[1] }) : tx('entreno.duranteSinNumeros'));
      if (l.cafeinaHasta != null) s += ' ' + tx('ascent.foco.comer.cafe', { hora: u.horaMin(l.cafeinaHasta) });
      return s;
    }
    function textosDelFoco(f, d, k) {
      const comida = (c) => tx('comida.comidas.' + c);
      const n = conNumeros();
      if (f.que === 'comer') {
        const l = f.linea;
        if (f.cuando === 'antes') {
          const titulo = l.clase === 'snackPrevio' ? tx('ascent.foco.comer.snack') : l.clase === 'previaLiviana' ? tx('ascent.foco.comer.liviana', { comida: comida(l.comida) })
            : l.clase === 'ayunasLarga' ? tx('ascent.foco.comer.ayunas', { comida: comida(l.comida) }) : tx('ascent.foco.comer.previa', { comida: comida(l.comida) });
          return [titulo, cantidadesDeAntes(l)];
        }
        if (f.cuando === 'dormir') return [tx('ascent.foco.comer.dormir'), n && l.proteina ? tx('ascent.foco.comer.dormirTexto', { p: l.proteina }) : tx('ascent.foco.comer.dormirSinNumeros')];
        const g = n ? l.proteina : null;
        let texto = l.clase === 'reponer' ? tx('entreno.reponer', { hora: u.horaMin(l.hora) }) : g ? tx('ascent.foco.comer.despuesTexto', { p: g }) : tx('ascent.foco.comer.despuesSinNumeros');
        if (l.clase === 'despuesPronto') texto += ' ' + tx('ascent.diagnostico.pasos.pronto');
        if (k.diag && k.diag.consejos.some((x) => x.que === 'sinApuro')) texto += ' ' + tx('ascent.diagnostico.consejos.sinApuro');
        return [tx('ascent.foco.comer.despues', { comida: comida(l.comida) }), texto];
      }
      if (f.que === 'entrenar') {
        const clave = f.como === 'suave' ? `suave.${f.porque || 'total'}` : f.como;
        return [nombreDeSesion(), tx('ascent.foco.entrenar.' + clave, { ejercicio: f.ejercicio || '' })];
      }
      if (f.que === 'terminar') return [tx('ascent.foco.terminar.titulo', { hora: u.horaMin(f.antesDe) }), tx('ascent.foco.terminar.texto', { dormir: u.horaMin(f.dormir) })];
      if (f.que === 'dormir') {
        const deuda = d.deuda !== null && d.deuda >= 7 * 60;
        return [tx('ascent.foco.dormir.titulo'), deuda ? tx('ascent.diagnostico.consejos.deuda') : tx('ascent.foco.dormir.texto', { horas: u.duracion(necesidad) })];
      }
      if (f.que === 'proteina') return [tx('ascent.foco.proteina.titulo'), n ? tx('ascent.diagnostico.consejos.totalDelDia', { g: numero(f.gramos) }) : tx('ascent.diagnostico.consejos.totalDelDiaSinNumeros')];
      if (f.que === 'descanso') {
        const todos = k.rutina.flatMap((x) => x.musculos).filter((m) => m.estado !== 'recuperado').sort((a, b) => b.residual - a.residual);
        return [tx('ascent.foco.descanso.titulo'), todos.length ? tx('ascent.foco.descanso.falta', { musculo: tx('ascent.musculos.nombres.' + todos[0].musculo), tiempo: tiempoDe(todos[0].listo) }) : tx('ascent.diagnostico.sub.recuperados')];
      }
      return [tx('ascent.foco.faltaNoche.titulo'), tx('ascent.foco.faltaNoche.texto')];
    }
    function parteFoco(d, k) {
      if (!k.foco.length) return null;
      const c = el('section', 'as-foco');
      c.appendChild(el('h3', 'as-etq', tx('ascent.foco.titulo')));
      const ul = el('ul', 'as-foco-lista');
      k.foco.forEach((f) => {
        const li = el('li', 'as-foco-item ' + f.que);
        const hora = el('span', 'as-foco-hora' + (f.hora === null ? ' sin' : ''), f.hora === null ? tx('ascent.foco.hoy') : u.horaMin(f.hora));
        const cuerpo = el('div');
        const [titulo, texto] = textosDelFoco(f, d, k);
        cuerpo.append(el('b', 'as-foco-titulo', titulo));
        if (texto) cuerpo.appendChild(linea('as-foco-texto', texto));
        if (f.que === 'faltaNoche') cuerpo.appendChild(irA('sueno', 'ascent.diagnostico.irA.sueno'));
        li.append(hora, cuerpo);
        ul.appendChild(li);
      });
      c.appendChild(ul);
      return c;
    }

    // ------------------------------------------------------------ las tres partes
    function fila(clase, nombre, valor, banda, posicion) {
      const f = el('article', 'as-fila ' + clase);
      const cab = el('header', 'as-fila-cab');
      cab.append(el('h4', 'as-fila-nombre', nombre), el('span', 'as-fila-valor', valor), el('span', 'as-fila-banda ' + (banda || ''), banda ? tx('ascent.bandas.' + banda) : ''));
      f.append(cab, franjas(banda, posicion, false));
      return f;
    }
    const consejo = (texto) => el('p', 'as-fila-consejo', texto);
    const aLaCama = (d) => u.horaMin(acostarseDe(d));

    function filaSueno(d, k) {
      const r = k.rec;
      const f = fila('as-fila-sueno', tx('ascent.partes.sueno.nombre'), r ? tx('ascent.partes.de', { n: r.partes.sueno, max: Recuperado.MAXIMOS.sueno }) : '—', r && r.bandas.sueno, r && Recuperado.enLaBarra(r.partes.sueno, 'sueno'));
      if (!r) {
        f.append(linea('as-fila-texto', tx('ascent.recuperacion.sinNoche')), irA('sueno', 'ascent.diagnostico.irA.sueno'));
        return f;
      }
      const horas = u.duracion(r.anoche.dormido);
      const de = u.duracion(necesidad);
      f.appendChild(linea('as-fila-texto', r.conCalidad ? tx('ascent.partes.sueno.texto', { horas, necesidad: de, calidad: Math.round(r.calidad) }) : tx('ascent.partes.sueno.sinCalidad', { horas, necesidad: de })));
      const antes = d.sesion === 'prevista';
      const b = r.bandas.sueno;
      const consejos = k.diag ? k.diag.consejos.map((x) => x.que) : [];
      // Sin la calidad y con la noche bien, lo que lo sube es registrarla: lo dice el enlace de abajo.
      const porLaCalidad = !r.conCalidad && (b === 'muyBien' || b === 'bien');
      let texto = null;
      if (b === 'muyBien' && !porLaCalidad) texto = r.partes.sueno >= 40 ? tx('ascent.partes.sueno.consejos.perfecto') : tx('ascent.partes.sueno.consejos.casi', { falta: tx(r.anoche.dormido < necesidad ? 'ascent.partes.sueno.consejos.faltaDormir' : 'ascent.partes.sueno.consejos.faltaCalidad', { horas: de }) });
      else if (b === 'bien' && !porLaCalidad) texto = tx('ascent.partes.sueno.consejos.bien', { hora: aLaCama(d) });
      else if (b === 'aceptable' || b === 'atencion') texto = tx(`ascent.partes.sueno.consejos.${b}${antes ? 'Antes' : ''}`, { hora: aLaCama(d) });
      if (texto) f.appendChild(consejo(texto));
      if (antes && consejos.includes('siesta')) f.appendChild(consejo(tx('ascent.diagnostico.consejos.siesta')));
      else if (antes && consejos.includes('seriesPesadas')) f.appendChild(consejo(tx('ascent.diagnostico.consejos.seriesPesadas')));
      if (consejos.includes('deuda')) f.appendChild(linea('as-nota', tx('ascent.diagnostico.consejos.deuda')));
      const enlaces = el('div', 'as-enlaces');
      if (!r.conCalidad) enlaces.appendChild(irA('manana', 'ascent.partes.sueno.registrar'));
      enlaces.appendChild(irA('corregir', 'ascent.partes.sueno.corregir'));
      f.appendChild(enlaces);
      return f;
    }

    function filaFatiga(d, k) {
      const r = k.rec;
      const f = fila('as-fila-fatiga', tx('ascent.partes.fatiga.nombre'), r ? `${r.fatiga} %` : '—', r && r.bandas.fatiga, r && Recuperado.enLaBarra(r.fatiga, 'fatiga'));
      if (!r) return f;
      const nivel = r.fatiga <= 15 ? 'baja' : r.fatiga <= 40 ? 'moderada' : 'alta';
      const musculos = lista(r.musculos.map((m) => enFrase(tx('ascent.musculos.nombres.' + m))));
      f.appendChild(linea('as-fila-texto', tx('ascent.partes.fatiga.texto.' + (d.sesion === 'hecha' ? 'hecha' : d.sesion ? 'hoy' : 'recientes'), { nivel: tx('ascent.partes.fatiga.niveles.' + nivel), musculos })));
      const b = r.bandas.fatiga;
      if (d.sesion === 'prevista') {
        const suenoFlojo = r.bandas.sueno === 'atencion' || r.bandas.sueno === 'aceptable';
        const clave = b === 'atencion' ? 'atencion' : b === 'aceptable' ? 'aceptable' : suenoFlojo ? 'listosPeroSueno' : 'listos';
        f.appendChild(consejo(tx('ascent.partes.fatiga.consejos.' + clave, { sesion: enFrase(nombreDeSesion()) })));
        if (k.rend) {
          const cat = (c) => tx('ascent.rendimiento.categorias.' + c);
          f.appendChild(linea('as-nota', tx('ascent.partes.fatiga.rendimiento', { fuerza: cat(k.rend.r.categoria.max), reps: cat(k.rend.r.categoria.vol), n: numero(k.rend.r.sigma, 1) })));
        }
      } else if (d.sesion === 'hecha') {
        const hoy = k.rutina.find((x) => x.hoy);
        const listo = hoy ? Math.max(0, ...hoy.musculos.map((m) => m.listo || 0)) : 0;
        f.appendChild(consejo(listo ? tx('ascent.partes.fatiga.consejos.despues', { tiempo: tiempoDe(listo) }) : tx('ascent.diagnostico.sub.recuperados')));
      } else {
        const todos = k.rutina.flatMap((x) => x.musculos).filter((m) => m.estado !== 'recuperado').sort((a, b2) => b2.residual - a.residual);
        f.appendChild(consejo(todos.length ? tx('ascent.foco.descanso.falta', { musculo: tx('ascent.musculos.nombres.' + todos[0].musculo), tiempo: tiempoDe(todos[0].listo) }) : tx('ascent.diagnostico.sub.recuperados')));
      }
      return f;
    }

    function filaComida(d, k) {
      const r = k.rec;
      const f = fila('as-fila-comida', tx('ascent.partes.comida.nombre'), r ? tx('ascent.partes.de', { n: r.partes.comida, max: Recuperado.MAXIMOS.comida }) : '—', r && r.bandas.comida, r && Recuperado.enLaBarra(r.partes.comida, 'comida'));
      if (!r) return f;
      const ayer = r.ayer;
      const meta = r.meta;
      if (sinDeficit()) {
        f.appendChild(linea('as-fila-texto', tx('ascent.partes.comida.textoSinMetas')));
        return f;
      }
      const n = conNumeros();
      const kcal = Math.round((ayer.kcal / meta.kcal) * 100);
      f.appendChild(linea('as-fila-texto', n ? tx('ascent.partes.comida.texto', { p: numero(Math.round(ayer.p)), meta: numero(meta.proteina), k: kcal }) : tx('ascent.partes.comida.textoSinNumeros')));
      const falta = Math.floor(Math.max(0, meta.proteina - ayer.p) / 5) * 5;
      const poco = ayer.kcal < 0.8 * meta.kcal;
      let texto;
      if (r.partes.comida >= Recuperado.MAXIMOS.comida) texto = tx('ascent.partes.comida.consejos.perfecta');
      else if (poco) texto = tx('ascent.partes.comida.consejos.' + (d.sesion === 'prevista' ? 'caloriasAntes' : 'calorias'));
      else if (falta >= 5) texto = tx('ascent.partes.comida.consejos.' + (r.bandas.comida === 'muyBien' ? 'casi' : 'proteina') + (n ? '' : 'SinNumeros'), { g: falta });
      if (texto) f.appendChild(consejo(texto));
      if (k.diag && k.diag.consejos.some((x) => x.que === 'noCompensar')) f.appendChild(linea('as-nota', tx('ascent.diagnostico.consejos.noCompensar')));
      return f;
    }

    function partePartes(d, k) {
      const c = el('section', 'as-partes');
      c.appendChild(el('h3', 'as-etq', tx('ascent.partes.titulo')));
      c.append(filaSueno(d, k), filaFatiga(d, k), filaComida(d, k));
      return c;
    }

    // ------------------------------------------------------------ la fatiga de cada músculo, por día
    function filaDeMusculo(m) {
      const li = el('li', 'as-musc ' + (m ? m.estado : ''));
      const barra = el('div', 'as-musc-barra');
      const relleno = el('i');
      relleno.style.width = pct((clamp(m ? m.residual : 0, 0, TOPE_MUSCULO) / TOPE_MUSCULO) * 100);
      barra.appendChild(relleno);
      const estado = el('div', 'as-musc-estado');
      estado.appendChild(el('b', null, m ? tx('ascent.musculos.estados.' + m.estado) : '—'));
      if (m && m.listo) estado.appendChild(el('small', null, tx('ascent.musculos.listoEnTiempo', { tiempo: tiempoDe(m.listo) })));
      li.append(el('span', 'as-musc-nombre', m ? tx('ascent.musculos.nombres.' + m.musculo) : ''), barra, estado);
      return li;
    }
    function ejeDeMusculos() {
      const eje = el('div', 'as-musc-eje');
      [3, 10].forEach((n) => { const s = el('span', null, `${n} %`); s.style.left = pct((n / TOPE_MUSCULO) * 100); eje.appendChild(s); });
      return eje;
    }
    function parteFatiga(d, k) {
      const c = parte('as-fatiga', tx('ascent.fatiga.titulo'));
      c.append(linea('as-una', tx('ascent.graficos.musculos')), ejeDeMusculos());
      k.rutina.forEach((dia) => {
        const g = el('div', 'as-dia-rutina' + (dia.hoy ? ' hoy' : ''));
        const cab = el('h4', 'as-dia-rutina-cab');
        cab.appendChild(el('span', null, `${tx('fecha.dias.' + dia.dia)} · ${dia.nombre}`));
        if (dia.hoy) cab.appendChild(el('em', null, tx('ascent.fatiga.hoy')));
        const ul = el('ul', 'as-musculos-lista');
        dia.musculos.forEach((m) => ul.appendChild(filaDeMusculo(m)));
        g.append(cab, ul);
        c.appendChild(g);
      });
      c.appendChild(linea('as-nota', tx('ascent.musculos.nota')));
      return c;
    }

    // ------------------------------------------------------------ marcas
    function medidor(prob, conEje) {
      const TOPE = 0.7;
      const x = (v) => (clamp(v, 0, TOPE) / TOPE) * 100;
      const c = el('div');
      const m = el('div', 'as-medidor');
      const corte = el('i', 'as-medidor-corte');
      corte.style.left = pct(x(Rendimiento.AVISAR_DESDE));
      m.append(el('i', 'as-medidor-pista'), corte);
      if (prob !== null) {
        const tramo = el('i', 'as-medidor-tramo');
        tramo.style.width = pct(x(prob));
        const punto = el('i', 'as-medidor-punto');
        punto.style.left = pct(x(prob));
        m.append(tramo, punto);
      }
      c.appendChild(m);
      if (conEje) {
        const eje = el('div', 'as-medidor-eje');
        const avisa = el('span', null, tx('ascent.marca.avisaDesde', { p: Math.round(Rendimiento.AVISAR_DESDE * 100) }));
        avisa.style.left = pct(x(Rendimiento.AVISAR_DESDE));
        eje.appendChild(avisa);
        c.appendChild(eje);
      }
      return c;
    }
    function parteMarcas(d, k) {
      const c = parte('as-marcas', tx('ascent.marcas.titulo'));
      if (!d.sesion) { c.appendChild(linea('as-una', tx('ascent.marcas.sinSesion'))); return c; }
      if (d.sesion === 'hecha') { c.appendChild(linea('as-una', tx('ascent.marcas.hecha', { sesion: enFrase(nombreDeSesion()) }))); return c; }
      if (!d.noche) { c.appendChild(linea('as-una', tx('ascent.marcas.sinNoche'))); return c; }
      c.appendChild(linea('as-una', tx('ascent.marcas.texto', { sesion: enFrase(nombreDeSesion()) })));
      k.marcas.forEach((m, i) => {
        const f = el('div', 'as-marca-fila' + (m.dia.aplica ? ' si' : ''));
        const cab = el('div', 'as-marca-cab');
        cab.append(el('span', 'as-marca-nombre', nombreDelEjercicio(m.ejercicio)), el('span', 'as-marca-prob', `${Math.round(m.dia.probabilidad * 100)} %`));
        const fallan = Diagnostico.queFalla(m.dia.condiciones);
        const texto = m.dia.aplica ? tx('ascent.marcas.si') : tx('ascent.marcas.no', { razones: fallan.length ? lista(fallan.map((x) => tx('ascent.marcas.fallas.' + x))) : tx('ascent.marcas.fallas.probabilidad') });
        f.append(cab, medidor(m.dia.probabilidad, i === k.marcas.length - 1), linea('as-marca-linea', texto));
        if (m.dia.aplica && m.av) f.appendChild(linea('as-nota', `${tx('ascent.marca.seguridad', { nivel: tx('ascent.rendimiento.niveles.' + m.seguridad), marcas: m.av.marcasEnTotal, semanas: m.av.semanas })} · ${tx('ascent.marca.aciertos', { veces: m.av.veces, marcas: m.av.marcas })}`));
        c.appendChild(f);
      });
      c.appendChild(linea('as-nota', tx('ascent.marcas.como')));
      return c;
    }

    // ------------------------------------------------------------ razones de estancamiento
    const VALORES = {
      sueno: (v) => u.duracion(Math.round(v / 5) * 5),
      proteina: (v) => tx('ascent.estancamiento.gramos', { n: numero(Math.round(v)) }),
      calorias: (v) => tx('ascent.estancamiento.kcal', { n: u.conSigno(Math.round(v / 10) * 10) }),
      // Las veces por semana, contadas en 4 semanas: «3 → 6» se lee mejor que «0,75 → 1,5».
      menosSeguido: (v) => numero(Math.round(v * 4)),
      sesionesMasCortas: (v) => tx('fecha.minutos', { m: Math.round(v) }),
    };
    /** Antes y ahora sobre una línea: el punto lleno es cuando subía; el hueco, ahora. */
    function antesYAhora(que, antes, ahora) {
      const pista = el('div', 'as-pesa-pista');
      pista.appendChild(el('i', 'as-pesa-base'));
      const escala = ESCALAS[que] || Math.max(1, antes) * 0.33;
      const dif = (antes - ahora) / escala;
      const xCon = clamp(50 + dif * 12.5, 4, 96);
      const xAhora = clamp(50 - dif * 12.5, 4, 96);
      const tramo = el('i', 'as-pesa-tramo');
      tramo.style.left = pct(Math.min(xCon, xAhora));
      tramo.style.width = pct(Math.abs(xCon - xAhora));
      const con = el('i', 'as-pesa-con');
      con.style.left = pct(xCon);
      const ya = el('i', 'as-pesa-ahora');
      ya.style.left = pct(xAhora);
      pista.append(tramo, con, ya);
      return pista;
    }
    function razon(x, musculo) {
      const li = el('li', 'as-razon');
      const cab = el('div', 'as-razon-cab');
      if (x.que === 'cargado') {
        cab.appendChild(el('b', null, tx('ascent.estancados.razones.cargado.titulo')));
        const cuadros = el('span', 'as-cuadros');
        for (let i = 0; i < x.de; i++) cuadros.appendChild(el('i', i < x.veces ? 'lleno' : null));
        cab.appendChild(cuadros);
        li.append(cab, linea(null, tx('ascent.estancados.razones.cargado.texto', { musculo: tx('ascent.musculos.nombres.' + musculo), veces: x.veces, de: x.de })));
        return li;
      }
      const v = VALORES[x.que];
      cab.append(el('b', null, tx(`ascent.estancados.razones.${x.que}.titulo`)), el('span', null, `${v(x.antes)} → ${v(x.ahora)}`));
      li.append(cab, antesYAhora(x.que, x.antes, x.ahora), linea(null, tx(`ascent.estancados.razones.${x.que}.texto`, { antes: v(x.antes), ahora: v(x.ahora) })));
      return li;
    }
    function parteEstancamiento() {
      const c = parte('as-estanc', tx('ascent.estancados.titulo'));
      c.appendChild(linea('as-una', tx('ascent.estancados.umbral', { n: A.estancados.umbral })));
      const leyenda = el('div', 'as-leyenda');
      leyenda.append(el('span', 'as-leyenda-con', tx('ascent.estancados.leyenda.antes')), el('span', 'as-leyenda-ahora', tx('ascent.estancados.leyenda.ahora')));
      c.appendChild(leyenda);
      const todos = calcularEstancados();
      // Lo que vale para todos va una vez, arriba: la definición y lo del sueño o la comida que cambió igual
      // en todos (con las mismas semanas, da lo mismo).
      const firma = (x) => (x.que === 'definicion' ? 'definicion' : x.que === 'sueno' || x.que === 'proteina' || x.que === 'calorias' ? `${x.que}|${Math.round(x.antes)}|${Math.round(x.ahora)}` : null);
      const enTodos = todos.length > 1 || (todos.length === 1 && todos[0].r.razones.some((x) => x.que === 'definicion'))
        ? todos[0].r.razones.filter((x) => firma(x) && todos.every((t) => t.r.razones.some((y) => firma(y) === firma(x)))) : [];
      const comunes = new Set(enTodos.map(firma));
      const def = enTodos.find((x) => x.que === 'definicion');
      if (def) c.appendChild(linea('as-definicion', def.bajaSemanal ? tx('ascent.estancados.definicion', { kg: numero(def.bajaSemanal, 1) }) : tx('ascent.estancados.definicionSinRitmo')));
      const deTodos = enTodos.filter((x) => x.que !== 'definicion');
      // Si a todos les faltan las mismas semanas para comparar el sueño y la comida, se dice una vez.
      const juntando = (t) => (t.r.comparacion.estado === 'juntando' ? `${t.r.comparacion.conMarcas}|${t.r.comparacion.sinMarcas}` : null);
      const juntandoEnTodos = todos.length > 1 && juntando(todos[0]) !== null && todos.every((t) => juntando(t) === juntando(todos[0]));
      const notaDeJuntando = (t) => linea('as-nota', tx('ascent.estancados.juntando', { a: t.r.comparacion.conMarcas, b: t.r.comparacion.sinMarcas, min: Entrenamiento.SEMANAS_MINIMAS }));
      if (juntandoEnTodos) c.appendChild(notaDeJuntando(todos[0]));
      if (deTodos.length && todos.length > 1) {
        const g = el('article', 'as-estanc-ej as-estanc-comunes');
        g.appendChild(el('header', 'as-estanc-ej-cab')).appendChild(el('span', 'as-estanc-ej-nombre', tx('ascent.estancados.comunes')));
        const ul = el('ul', 'as-razones');
        deTodos.forEach((x) => ul.appendChild(razon(x, null)));
        g.appendChild(ul);
        c.appendChild(g);
      }
      todos.forEach(({ e, r, musculo }) => {
        const g = el('article', 'as-estanc-ej');
        const cab = el('header', 'as-estanc-ej-cab');
        cab.append(el('span', 'as-estanc-ej-nombre', nombreDelEjercicio(e.ejercicio)), el('span', 'as-estanc-ej-dato', `${tx('ascent.estancados.semanas', { n: e.semanas })} · ${tx('ascent.estancamiento.marca', { kg: numero(e.peso, e.peso % 1 ? 1 : 0), reps: e.reps })}`));
        g.appendChild(cab);
        const propias = r.razones.filter((x) => !comunes.has(firma(x)));
        if (propias.length) {
          const ul = el('ul', 'as-razones');
          propias.slice(0, 3).forEach((x) => ul.appendChild(x.que === 'definicion' ? linea('as-razon-sin', tx('ascent.estancados.definicionSinRitmo')) : razon(x, musculo)));
          g.appendChild(ul);
        } else g.appendChild(linea('as-razon-sin', tx(comunes.size ? 'ascent.estancados.soloComunes' : 'ascent.estancados.sinCausa')));
        if (r.comparacion.estado === 'juntando' && !juntandoEnTodos) g.appendChild(notaDeJuntando({ r }));
        c.appendChild(g);
      });
      c.appendChild(linea('as-nota', tx('ascent.estancamiento.nota')));
      return c;
    }

    // ------------------------------------------------------------ tu año
    function mapaDelAnio(conDatos) {
      const anio = Number(Datos.HOY.slice(0, 4));
      const porFecha = new Map((conDatos ? A.anioDias : []).map((x) => [x.fecha, x]));
      const mapa = el('div', 'as-anio-mapa');
      mapa.setAttribute('role', 'img');
      mapa.setAttribute('aria-label', tx('ascent.anio.mapa', { n: A.anioDias.filter((x) => x.grupo).length, m: A.anioDias.filter((x) => x.marca).length }));
      for (let mes = 0; mes < 12; mes++) {
        mapa.appendChild(el('span', 'as-anio-mes', tx('fecha.mesesCortos.' + mes)));
        const dias = new Date(anio, mes + 1, 0).getDate();
        for (let n = 1; n <= 31; n++) {
          const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
          const x = porFecha.get(fecha);
          const clase = n > dias ? 'nada' : fecha > Datos.HOY ? 'futuro' : fecha === Datos.HOY ? 'hoy' : x && x.grupo ? x.grupo + (x.marca ? ' marca' : '') : '';
          const cuadro = el('i', 'as-anio-dia ' + clase + (fecha === diaDelAnio ? ' elegido' : ''));
          if (n <= dias) cuadro.dataset.fecha = fecha;
          mapa.appendChild(cuadro);
        }
      }
      return mapa;
    }
    function detalleDelDia(fecha) {
      const x = A.anioDias.find((y) => y.fecha === fecha);
      const cuando = u.fechaCorta(fecha);
      if (fecha === Datos.HOY) return tx('ascent.anio.detalle.hoy', { cuando });
      if (!x || !x.grupo) return tx('ascent.anio.detalle.descanso', { cuando });
      const grupo = enFrase(tx('ascent.hoy.grupos.' + x.grupo));
      return tx(x.marca ? 'ascent.anio.detalle.marca' : 'ascent.anio.detalle.entreno', { cuando, grupo });
    }
    function parteAnio() {
      const c = parte('as-anio', tx('ascent.anio.titulo'), el('span', 'as-derecha', tx('ascent.anio.hastaHoy', { anio: Datos.HOY.slice(0, 4) })));
      c.appendChild(linea('as-una', tx('ascent.anio.texto2')));
      const mapa = mapaDelAnio(true);
      const detalle = linea('as-anio-detalle', diaDelAnio ? detalleDelDia(diaDelAnio) : '');
      detalle.setAttribute('aria-live', 'polite');
      mapa.addEventListener('click', (ev) => {
        const cuadro = ev.target.closest('[data-fecha]');
        if (!cuadro || cuadro.classList.contains('futuro')) return;
        diaDelAnio = cuadro.dataset.fecha;
        mapa.querySelectorAll('.elegido').forEach((x) => x.classList.remove('elegido'));
        cuadro.classList.add('elegido');
        detalle.textContent = detalleDelDia(diaDelAnio);
      });
      const leyenda = el('div', 'as-anio-leyenda');
      [...GRUPOS_DEL_ANIO.map((g) => [g, tx('ascent.hoy.grupos.' + g)]), ['descanso', tx('ascent.anio.descanso')], ['marca', tx('ascent.anio.marca')]].forEach(([clase, texto]) => {
        const s = el('span');
        s.append(el('i', clase), document.createTextNode(texto));
        leyenda.appendChild(s);
      });
      c.append(mapa, leyenda, detalle);
      c.appendChild(el('h4', 'as-etq', tx('ascent.anio.ultimas')));
      c.lastChild.style.marginTop = '18px';
      const ul = el('ul', 'as-anio-ultimas');
      A.ultimasMarcas.forEach((m) => {
        const li = el('li', 'as-anio-ultima');
        const semanas = Math.floor(Fechas.diasEntre(m.fecha, Datos.HOY) / 7);
        li.append(el('i', m.grupo), el('span', null, `${tx('ascent.hoy.grupos.' + m.grupo)}: ${enFrase(nombreDelEjercicio(m.ejercicio))} ${tx('ascent.estancamiento.marca', { kg: numero(m.peso, m.peso % 1 ? 1 : 0), reps: m.reps })}`), el('small', null, semanas ? u.plural('ascent.anio.hace', semanas) : tx('ascent.anio.estaSemana')));
        ul.appendChild(li);
      });
      c.appendChild(ul);
      const noches = Datos.NOCHES;
      const sueno = noches.reduce((s, x) => s + x.dormido, 0) / Math.max(1, noches.length);
      const datos = [
        ['entrenamientos', numero(A.anioDias.filter((x) => x.grupo).length)],
        ['marcas', numero(A.anioDias.filter((x) => x.marca).length)],
        ['habitos', numero(A.anio.diasConHabitos)],
        ['sueno', tx('ascent.anio.horas', { h: Math.floor(sueno / 60), m: String(Math.round(sueno % 60)).padStart(2, '0') })],
        ['comida', numero(A.anio.diasConComida)],
      ];
      const grilla = el('div', 'as-anio-grilla');
      datos.forEach(([clave, v]) => {
        const dato = el('div', 'as-dato');
        dato.append(el('b', null, v), el('span', null, tx('ascent.anio.datos.' + clave)));
        grilla.appendChild(dato);
      });
      c.appendChild(grilla);
      return c;
    }

    // ------------------------------------------------------------ lo que comparten las dos
    /** Lo de un día de gimnasio o de descanso de la semana del control (el último que hubo; si no, el de hoy con o sin la sesión). */
    const kcalDel = (conA, gimnasio) => {
      const dia = conA.semana.filter((x) => x.entrena === gimnasio).pop();
      return dia ? dia.meta.kcal : gimnasio ? conA.hoy.meta.kcal + conA.costo : conA.hoy.meta.kcal;
    };
    function parteComparten(d) {
      const c = parte('as-comparten', tx('ascent.comparten.titulo'));
      const conA = opciones.conAscent(d.sesion !== 'hecha');
      const persona = opciones.persona();
      const ultima = Datos.PESADAS[Datos.PESADAS.length - 1];
      const ocultas = !conNumeros() || sinDeficit();
      const filas = [
        ['peso', tx('ascent.funciones.peso.vivo', { kg: numero(ultima.kg, 1), cuando: cuandoFue(ultima.fecha) })],
        ['calorias', conA && !ocultas ? tx('ascent.funciones.calorias.vivo', { entreno: numero(kcalDel(conA, true)), descanso: numero(kcalDel(conA, false)) }) : tx('ascent.funciones.calorias.texto')],
        ['objetivo', tx('ascent.funciones.objetivo.vivo.' + persona.perfil.objetivo)],
        ['proteina', conA && d.sesion === 'hecha' && conA.extra > 0 && !ocultas ? tx('ascent.funciones.proteina.vivo', { n: conA.extra }) : tx('ascent.funciones.proteina.texto')],
      ];
      const ul = el('ul', 'as-comp');
      filas.forEach(([clave, valor]) => {
        const li = el('li');
        li.append(el('b', null, tx(`ascent.funciones.${clave}.titulo`)), el('span', null, valor));
        ul.appendChild(li);
      });
      c.appendChild(ul);
      return c;
    }

    // ------------------------------------------------------------ cómo se calcula
    function parteComo(k) {
      const r = k.rec;
      const c = el('section', 'as-como' + (como ? ' abierta' : ''));
      const cuerpo = el('div', 'as-como-cuerpo');
      cuerpo.hidden = !como;
      const cab = boton('as-como-cab', `<span>${tx('ascent.como.titulo')}</span>${icono('abajo')}`, () => {
        como = !como;
        c.classList.toggle('abierta', como);
        cab.setAttribute('aria-expanded', String(como));
        desplegar(cuerpo, como);
      });
      cab.setAttribute('aria-expanded', String(como));
      // Las tres partes, cada una del ancho de lo que pesa, llenas con lo de hoy: suman 100.
      const suma = el('div', 'as-suma');
      suma.setAttribute('role', 'img');
      [['sueno', 'sueno'], ['musculos', 'musculos'], ['comida', 'comida']].forEach(([clave]) => {
        const max = Recuperado.MAXIMOS[clave];
        const valor = r ? r.partes[clave] : 0;
        const s = el('div', 'as-suma-parte');
        const pista = el('i');
        const relleno = el('i');
        relleno.style.width = pct((valor / max) * 100);
        pista.appendChild(relleno);
        const nombre = el('span');
        nombre.append(el('b', null, r ? tx('ascent.partes.de', { n: valor, max }) : `— / ${max}`), document.createTextNode(tx('ascent.como.partes.' + clave)));
        s.append(pista, nombre);
        suma.appendChild(s);
      });
      suma.setAttribute('aria-label', r ? tx('ascent.como.suma', { s: r.partes.sueno, m: r.partes.musculos, c: r.partes.comida, t: r.total }) : tx('ascent.como.titulo'));
      cuerpo.appendChild(suma);
      if (r) cuerpo.appendChild(linea('as-suma-total', tx('ascent.como.suma', { s: r.partes.sueno, m: r.partes.musculos, c: r.partes.comida, t: r.total })));
      const parrafo = (clave, vars) => {
        const t = tx(clave, vars);
        const i = t.indexOf(':');
        const pp = el('p');
        if (i > 0) pp.append(el('b', null, t.slice(0, i + 1)), document.createTextNode(t.slice(i + 1)));
        else pp.textContent = t;
        return pp;
      };
      cuerpo.append(
        parrafo('ascent.como.sueno', { necesidad: u.duracion(necesidad) }),
        parrafo('ascent.como.musculos', { f: r ? r.fatiga : 0, m: r ? r.partes.musculos : 40 }),
        parrafo('ascent.como.comida'),
        parrafo('ascent.como.franjas'),
        parrafo('ascent.como.cuando'),
        parrafo('ascent.como.comer'),
        parrafo('ascent.como.orientativo'),
      );
      c.append(cab, cuerpo);
      return c;
    }

    // ------------------------------------------------------------ sin vincular
    function cabezaSinVincular() {
      const cab = el('header', 'as-cab');
      cab.append(
        el('span', 'as-etq', tx('ascent.etiqueta')),
        el('h2', 'as-titulo', tx('ascent.titulo')),
        el('p', 'as-bajada', tx('ascent.bajada')),
        boton('as-vincular', tx('ascent.vincular'), () => abrirVincular()),
        boton('as-conseguir', tx('ascent.conseguir'), () => {}),
      );
      return cab;
    }
    function vacia(clase, titulo, texto, dibujo) {
      const c = parte(clase, titulo, candado());
      c.appendChild(linea('as-una', texto));
      if (dibujo) c.appendChild(dibujo);
      return c;
    }
    function partesVacias() {
      const caja = el('div');
      ['sueno', 'fatiga', 'comida'].forEach((k) => caja.appendChild(fila('as-fila-' + k, tx(`ascent.partes.${k}.nombre`), '—', null, null)));
      return caja;
    }
    function musculosVacios() {
      const ul = el('ul', 'as-musculos-lista');
      ul.style.marginTop = '10px';
      ['cuadriceps', 'pecho', 'espaldaAlta', 'biceps', 'triceps'].forEach((m) => {
        const li = filaDeMusculo(null);
        li.querySelector('.as-musc-nombre').textContent = tx('ascent.musculos.nombres.' + m);
        ul.appendChild(li);
      });
      return ul;
    }
    function estancVacio() {
      const caja = el('div');
      ['sueno', 'proteina', 'calorias'].forEach((k) => {
        const f = el('div', 'as-razon');
        f.style.marginTop = '12px';
        const cab = el('div', 'as-razon-cab');
        cab.append(el('b', null, tx(`ascent.estancados.razones.${k}.titulo`)), el('span', null, '—'));
        const pista = el('div', 'as-pesa-pista');
        pista.appendChild(el('i', 'as-pesa-base'));
        f.append(cab, pista);
        caja.appendChild(f);
      });
      return caja;
    }

    // ------------------------------------------------------------ pintar
    function pie() {
      const c = el('div', 'as-final');
      c.appendChild(boton('as-volver-abajo', `${icono('arriba')}<span>${tx('ascent.volverAProgreso')}</span>`, () => cerrar()));
      if (vinculada) c.appendChild(linea('as-pie', tx('ascent.desvincular')));
      return c;
    }

    function pintar() {
      const scroll = cont.scrollTop;
      contenido.innerHTML = '';
      zona.classList.toggle('vinculada', vinculada);
      volver.setAttribute('aria-label', tx('ascent.volverAProgreso'));
      const d = elDia();
      if (vinculada) {
        const k = calcularDia(d);
        contenido.append(...[
          cabezaRecuperado(d, k), parteFoco(d, k), partePartes(d, k), parteFatiga(d, k), parteMarcas(d, k),
          parteEstancamiento(), parteAnio(), parteComparten(d), parteComo(k), pie(),
        ].filter(Boolean));
      } else {
        contenido.append(
          cabezaSinVincular(),
          el('h3', 'as-grupo', tx('ascent.soloConLasDos')),
          vacia('as-rec-vacia', tx('ascent.vacio.recuperadoTitulo'), tx('ascent.vacio.recuperado'), franjas(null, null, true)),
          vacia('as-partes-vacias', tx('ascent.partes.titulo'), tx('ascent.vacio.partes'), partesVacias()),
          vacia('as-fatiga', tx('ascent.fatiga.titulo'), tx('ascent.graficos.musculos'), musculosVacios()),
          vacia('as-marcas', tx('ascent.marcas.titulo'), tx('ascent.vacio.marcas'), medidor(null, true)),
          vacia('as-estanc', tx('ascent.estancados.titulo'), tx('ascent.vacio.estancamiento'), estancVacio()),
          vacia('as-anio', tx('ascent.anio.titulo'), tx('ascent.vacio.anio'), mapaDelAnio(false)),
          pie(),
        );
      }
      pintarEntrada();
      cont.scrollTop = scroll;
    }

    function abrirComo() {
      if (!como) {
        como = true;
        const c = contenido.querySelector('.as-como');
        if (c) {
          c.classList.add('abierta');
          c.querySelector('.as-como-cab').setAttribute('aria-expanded', 'true');
          desplegar(c.querySelector('.as-como-cuerpo'), true);
        }
      }
      const c = contenido.querySelector('.as-como');
      if (c) cont.scrollTo({ top: Math.max(0, cont.scrollTop + c.getBoundingClientRect().top - cont.getBoundingClientRect().top - 60), behavior: opciones.movimientoReducido ? 'auto' : 'smooth' });
    }

    // ------------------------------------------------------------ bajar y subir
    function ponerHorizonte() {
      const sube = HORIZONTE_PX * p;
      horizonte.style.setProperty('--sube', `${sube.toFixed(1)}px`);
      horizonte.style.setProperty('--escala', (0.8 + 0.2 * p).toFixed(3));
      horizonte.style.visibility = sube > 0.1 ? 'visible' : 'hidden';
    }
    function poner(v) {
      p = clamp(v, 0, 1);
      zona.style.transform = `translate3d(0, ${(-(1 - p) * 100).toFixed(3)}%, 0)`;
      zona.style.visibility = p > 0.0005 ? 'visible' : 'hidden';
      zona.inert = p === 0;
      velo.style.opacity = (0.32 * p).toFixed(3);
      ponerHorizonte();
      ponerTecho();
      if (opciones.alMover) opciones.alMover(p);
    }
    function ir(hasta, deUna) {
      cancelAnimationFrame(animacion);
      animacion = 0;
      abierta = hasta === 1;
      const desde = p;
      if (deUna || opciones.movimientoReducido || desde === hasta) { poner(hasta); listo(); return; }
      // Más corto cuanto menos falta, como un resorte.
      const ms = 220 + 260 * Math.abs(hasta - desde);
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / ms);
        poner(desde + (hasta - desde) * curva(k));
        if (k < 1) animacion = requestAnimationFrame(paso);
        else { animacion = 0; listo(); }
      };
      animacion = requestAnimationFrame(paso);
    }
    function listo() {
      if (!abierta) {
        cont.scrollTop = 0;
        queEs = false;
        como = false;
        // Ya se abrió una vez: al volver a Progreso, la pista se pliega a la vista.
        if (yaSeAbrio && !entrada.classList.contains('sin-pista')) setTimeout(() => plegarLaPista(true), opciones.movimientoReducido ? 0 : 450);
      }
      if (abierta && !yaSeAbrio) yaSeAbrio = true;
      if (opciones.alCambiar) opciones.alCambiar();
    }
    function abrir(deUna) { if (!abierta) pintar(); ir(1, deUna); }
    function cerrar(deUna) { ir(0, deUna); }

    // Para volver: empujar para arriba abajo de todo, siguiendo al dedo, o con la rueda; y la flecha.
    const alFondo = () => cont.scrollTop + cont.clientHeight >= cont.scrollHeight - 2;
    let tirando = null;
    zona.addEventListener('pointerdown', (ev) => {
      tirando = null;
      if (!abierta || animacion || (ev.pointerType === 'mouse' && ev.button !== 0)) return;
      tirando = { id: ev.pointerId, x0: ev.clientX, y0: ev.clientY, decidido: false, v: 0, ultimoY: ev.clientY, ultimoT: performance.now() };
    });
    zona.addEventListener('pointermove', (ev) => {
      const g = tirando;
      if (!g || ev.pointerId !== g.id) return;
      const dx = ev.clientX - g.x0, dy = ev.clientY - g.y0;
      if (!g.decidido) {
        if (!alFondo() || dy > 8 || Math.abs(dx) > 12) { tirando = null; return; }
        if (-dy < 10 || Math.abs(dx) > -dy) return;
        g.decidido = true;
        try { zona.setPointerCapture(ev.pointerId); } catch (_) { /* sin captura igual funciona */ }
      }
      ev.preventDefault();
      const ahora = performance.now();
      g.v = g.v * 0.6 + ((g.ultimoY - ev.clientY) / Math.max(1, ahora - g.ultimoT)) * 0.4;
      g.ultimoY = ev.clientY;
      g.ultimoT = ahora;
      poner(1 - Math.max(0, -dy - 10) / (zona.clientHeight || 1));
    });
    const soltar = (ev) => {
      const g = tirando;
      if (!g || ev.pointerId !== g.id) return;
      tirando = null;
      if (!g.decidido) return;
      const sube = ev.type === 'pointerup' && (1 - p >= umbral() || g.v >= velocidadMin());
      ir(sube ? 0 : 1);
      // El click que llega después de arrastrar no es un toque.
      const tragar = (e) => { e.stopPropagation(); e.preventDefault(); };
      zona.addEventListener('click', tragar, { capture: true, once: true });
      setTimeout(() => zona.removeEventListener('click', tragar, { capture: true }), 400);
    };
    zona.addEventListener('pointerup', soltar);
    zona.addEventListener('pointercancel', soltar);
    // En Safari del iPhone, abajo de todo, empujar para arriba es de la sección y no del rebote del scroll.
    let toque = null;
    cont.addEventListener('touchstart', (ev) => { const t = ev.touches[0]; toque = t ? { x: t.clientX, y: t.clientY, abajo: alFondo() } : null; }, { passive: true });
    cont.addEventListener('touchmove', (ev) => {
      const t = ev.touches[0];
      if (!toque || !t || !toque.abajo) return;
      const dy = toque.y - t.clientY;
      if (dy > 0 && dy > Math.abs(t.clientX - toque.x)) ev.preventDefault();
    }, { passive: false });
    // Con la rueda o el trackpad, lo mismo: abajo de todo, seguir bajando la cierra. Lo que venía bajando
    // (la inercia) no cuenta: tiene que haber una pausa antes de arrancar.
    let rueda = 0;
    let ultimaRueda = -1e9;
    let finDeRueda = 0;
    zona.addEventListener('wheel', (ev) => {
      const antes = ultimaRueda;
      ultimaRueda = performance.now();
      if (!rueda && (ev.deltaY <= 0 || !abierta || animacion || !alFondo() || ultimaRueda - antes < 200)) return;
      ev.preventDefault();
      rueda = Math.max(0, rueda + ev.deltaY);
      // Rinde el doble que el dedo: una vuelta de la rueda alcanza.
      poner(1 - (2 * rueda) / (zona.clientHeight || 1));
      clearTimeout(finDeRueda);
      // Se decide cuando la rueda para un cuarto de segundo: entre dos vueltas de una rueda de mouse pasa más que entre dos del trackpad.
      finDeRueda = setTimeout(() => { ir(1 - p >= umbral() ? 0 : 1); rueda = 0; }, 260);
    }, { passive: false });

    poner(0);
    pintar();

    return {
      zona,
      asomar,
      invitacion,
      ponerIphone,
      ponerDia,
      // La entrada del encabezado de Progreso: siempre el mismo nodo.
      marcaDeProgreso() { pintarEntrada(); return entrada; },
      // Progreso se volvió a pintar o se movió: el borde del planeta, según lo arriba que esté.
      mirarArriba() { ponerTecho(); },
      // Mientras se desliza entre pestañas, el borde del planeta se va con Progreso.
      seguirPagina(x) { corrida = x; techo.style.translate = `${x.toFixed(1)}px 0`; ponerTecho(); },
      // Para los botones de la galería: «Ahora no» se olvida al recargar o con esto.
      volverAInvitar() { descartada = false; opciones.repintarInicio(); },
      pintar,
      abrir,
      cerrar,
      abrirComo,
      get vinculada() { return vinculada; },
      get abierta() { return abierta; },
      get progreso() { return p; },
      // Ocupada: abierta, bajando o subiendo. Mientras, las pestañas no se deslizan.
      get ocupada() { return abierta || p > 0 || !!animacion; },
      // El gesto desde Progreso (galeria.js): mientras el dedo baja, y al soltar.
      arrastrar(fr) { cancelAnimationFrame(animacion); animacion = 0; if (!abierta && p === 0) pintar(); poner(fr); },
      soltar(abrirla) { ir(abrirla ? 1 : 0); },
      ponerVinculo(si) {
        vinculada = si;
        marca.classList.toggle('unida', si);
        if (si) quitarInvitacion();
        opciones.repintarInicio();
        pintar();
        entraElContenido();
      },
      // La recuperación de hoy, para Sueño: la de la persona de mentira, no la del día de ejemplo.
      recuperacionDeHoy: () => (vinculada ? calcularRecuperado() : null),
      // Para las capturas: la hoja de vincular.
      abrirVincular,
      get hojaVincularAbierta() { return hojaVincular.abierta; },
      cerrarVincular() { clearTimeout(esperaDeLaHoja); hojaVincular.cerrar(true); },
      // La línea del rendimiento en Sueño.
      rendimientoDeHoy: () => (vinculada ? calcularRendimiento().r : null),
      bajarA(selector) {
        if (selector === 'fondo') { cont.scrollTop = cont.scrollHeight; return; }
        const n = cont.querySelector(selector);
        if (n) cont.scrollTop = Math.max(0, cont.scrollTop + n.getBoundingClientRect().top - cont.getBoundingClientRect().top - 60);
      },
      subir() { cont.scrollTop = 0; },
    };
  }

  return { crear };
})();
